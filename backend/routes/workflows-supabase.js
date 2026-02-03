const express = require('express');
const fs = require('fs');
const path = require('path');
const { requireAdmin, authenticateToken } = require('../middleware/auth-supabase');
const { supabase } = require('../services/supabaseClient');

const router = express.Router();

// File path for storing workflows
const WORKFLOWS_FILE = path.join(__dirname, '../data/workflows.json');

// Ensure data directory exists
const dataDir = path.join(__dirname, '../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Default workflows
const defaultWorkflows = {
  barangay_clearance: [
    { id: 1, name: 'Submitted', description: 'Application received', status: 'pending', icon: 'FileText', autoApprove: false, assignedUsers: [], requiresApproval: false, sendEmail: true },
    { id: 2, name: 'Staff Review', description: 'Being reviewed by staff', status: 'processing', icon: 'Clock', autoApprove: false, assignedUsers: [], requiresApproval: true, sendEmail: true },
    { id: 3, name: 'Barangay Captain Approval', description: 'Approved by authorized personnel', status: 'ready', icon: 'UserCheck', autoApprove: false, assignedUsers: [], requiresApproval: true, sendEmail: true },
    { id: 5, name: 'Ready for Pickup', description: 'Certificate is ready', status: 'ready', icon: 'CheckCircle', autoApprove: false, assignedUsers: [], requiresApproval: false, sendEmail: false },
    { id: 6, name: 'Released', description: 'Certificate released to applicant', status: 'released', icon: 'CheckCircle', autoApprove: false, assignedUsers: [], requiresApproval: false, sendEmail: false }
  ],
  certificate_of_indigency: [
    { id: 1, name: 'Submitted', description: 'Application received', status: 'pending', icon: 'FileText', autoApprove: false, assignedUsers: [], requiresApproval: false, sendEmail: true },
    { id: 2, name: 'Under Review', description: 'Being reviewed by staff', status: 'processing', icon: 'Clock', autoApprove: false, assignedUsers: [], requiresApproval: true, sendEmail: true },
    { id: 3, name: 'Barangay Captain Approval', description: 'Approved by authorized personnel', status: 'ready', icon: 'UserCheck', autoApprove: false, assignedUsers: [], requiresApproval: true, sendEmail: true },
    { id: 5, name: 'Ready for Pickup', description: 'Certificate is ready', status: 'ready', icon: 'CheckCircle', autoApprove: false, assignedUsers: [], requiresApproval: false, sendEmail: false },
    { id: 6, name: 'Released', description: 'Certificate released to applicant', status: 'released', icon: 'CheckCircle', autoApprove: false, assignedUsers: [], requiresApproval: false, sendEmail: false }
  ],
  barangay_residency: [
    { id: 1, name: 'Submitted', description: 'Application received', status: 'pending', icon: 'FileText', autoApprove: false, assignedUsers: [], requiresApproval: false, sendEmail: true },
    { id: 2, name: 'Under Review', description: 'Being reviewed by staff', status: 'processing', icon: 'Clock', autoApprove: false, assignedUsers: [], requiresApproval: true, sendEmail: true },
    { id: 3, name: 'Barangay Captain Approval', description: 'Approved by authorized personnel', status: 'ready', icon: 'UserCheck', autoApprove: false, assignedUsers: [], requiresApproval: true, sendEmail: true },
    { id: 5, name: 'Ready for Pickup', description: 'Certificate is ready', status: 'ready', icon: 'CheckCircle', autoApprove: false, assignedUsers: [], requiresApproval: false, sendEmail: false },
    { id: 6, name: 'Released', description: 'Certificate released to applicant', status: 'released', icon: 'CheckCircle', autoApprove: false, assignedUsers: [], requiresApproval: false, sendEmail: false }
  ]
};

// Helper to get workflows from DB
const getWorkflowsFromDB = async () => {
  try {
    const { data, error } = await supabase
      .from('workflow_configurations')
      .select('*');

    if (error) throw error;

    const workflows = {};
    // Initialize with defaults
    Object.keys(defaultWorkflows).forEach(key => {
      workflows[key] = defaultWorkflows[key];
    });

    if (data && data.length > 0) {
      data.forEach(config => {
        if (config.workflow_config && config.workflow_config.steps) {
          workflows[config.certificate_type] = config.workflow_config.steps;
        }
      });
    }
    return workflows;
  } catch (error) {
    console.error('Error fetching workflows from DB:', error);
    return defaultWorkflows;
  }
};

/**
 * @route   GET /api/workflows
 * @desc    Get all workflows (accessible to all authenticated users)
 * @access  Private
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const workflows = await getWorkflowsFromDB();
    console.log('Workflows loaded from DB:', Object.keys(workflows));

    res.status(200).json({
      success: true,
      data: workflows
    });
  } catch (error) {
    console.error('Get workflows error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * @route   PUT /api/workflows
 * @desc    Save workflows (Admin only)
 * @access  Private (Admin only)
 */
router.put('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { workflows } = req.body;

    if (!workflows || typeof workflows !== 'object') {
      return res.status(400).json({
        success: false,
        message: 'Invalid workflows data'
      });
    }

    // Save each workflow type to database
    const promises = Object.keys(workflows).map(async (certType) => {
      const steps = workflows[certType];

      const { error } = await supabase
        .from('workflow_configurations')
        .upsert([{
          certificate_type: certType,
          workflow_config: { steps: steps },
          is_active: true,
          updated_at: new Date().toISOString()
        }], { onConflict: 'certificate_type' });

      if (error) {
        console.error(`Error saving workflow for ${certType}:`, error);
        throw error;
      }
    });

    await Promise.all(promises);

    console.log('Workflows saved to DB successfully');

    res.status(200).json({
      success: true,
      message: 'Workflows saved successfully'
    });
  } catch (error) {
    console.error('Save workflows error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * @route   POST /api/workflows/sync-assignments
 * @desc    Sync workflow assignments with database based on UI configuration (Admin only)
 * @access  Private (Admin only)
 */
router.post('/sync-assignments', authenticateToken, requireAdmin, async (req, res) => {
  try {
    console.log('=== SYNCING WORKFLOW ASSIGNMENTS WITH UI CONFIGURATION ===');

    // Load current workflows from DB
    const workflows = await getWorkflowsFromDB();

    // Get all users to find the correct IDs
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .order('first_name');

    if (usersError) {
      console.error('Error fetching users:', usersError);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch users from database'
      });
    }

    console.log('Available users:');
    users.forEach(user => {
      console.log(`- ${user.first_name} ${user.last_name} (${user.email}) - ID: ${user.id} - Role: ${user.role}`);
    });

    // Process each certificate type
    const certificateTypes = ['barangay_clearance', 'certificate_of_indigency', 'barangay_residency'];
    let syncResults = {
      totalAssignments: 0,
      updatedSteps: 0,
      errors: []
    };

    for (const certType of certificateTypes) {
      const workflowSteps = workflows[certType];
      if (!workflowSteps || !Array.isArray(workflowSteps)) {
        console.log(`No workflow found for ${certType}, skipping...`);
        continue;
      }

      console.log(`\nProcessing ${certType} workflow...`);

      // Process each step that requires approval
      for (const step of workflowSteps) {
        if (!step.requiresApproval || !step.assignedUsers || step.assignedUsers.length === 0) {
          continue;
        }

        console.log(`  Step ${step.id}: ${step.name} - ${step.assignedUsers.length} assigned users`);

        // Validate that assigned user IDs exist in the database
        const validUserIds = [];
        for (const userId of step.assignedUsers) {
          const user = users.find(u => u.id === userId);
          if (user) {
            validUserIds.push(userId);
            console.log(`    ✅ ${user.first_name} ${user.last_name} (${user.id})`);
          } else {
            console.log(`    ❌ User ID ${userId} not found in database`);
            syncResults.errors.push(`User ID ${userId} not found for step "${step.name}" in ${certType}`);
          }
        }

        if (validUserIds.length > 0) {
          // Delete existing assignments for this step and certificate type
          // Note: We use string comparison for step_id to handle large IDs correctly
          const { error: deleteError } = await supabase
            .from('workflow_assignments')
            .delete()
            .eq('step_id', step.id.toString())
            .eq('request_type', certType);

          if (deleteError) {
            console.error(`    Error deleting existing assignments for step ${step.id}:`, deleteError);
            syncResults.errors.push(`Failed to delete existing assignments for step "${step.name}" in ${certType}`);
            continue;
          }

          // Get all requests of this type that should be at this step
          let requestsQuery = supabase
            .from('certificate_requests')
            .select('id, reference_number, status')
            .eq('certificate_type', certType);

          // Determine which requests should be at this step based on the step's status
          // If the step status is 'oic_review', we look for requests in that status
          // For legacy steps, we might need to map them.
          const relevantStatuses = [step.status];

          // Special cases for initial steps
          if (step.status === 'staff_review' || step.name.toLowerCase().includes('staff') || step.name.toLowerCase().includes('secretary')) {
            relevantStatuses.push('pending', 'submitted', 'processing');
          }

          if (step.status === 'Clerk_review') {
            relevantStatuses.push('pending', 'submitted');
          }

          requestsQuery = requestsQuery.in('status', relevantStatuses);

          const { data: requests, error: requestsError } = await requestsQuery;

          if (requestsError) {
            console.error(`    Error fetching requests:`, requestsError);
            syncResults.errors.push(`Failed to fetch requests for step "${step.name}" in ${certType}`);
            continue;
          }

          // Create assignments for each valid user and relevant request
          let assignmentCount = 0;
          for (const request of requests || []) {
            for (const userId of validUserIds) {
              const { error: assignError } = await supabase
                .from('workflow_assignments')
                .insert([{
                  request_id: request.id,
                  request_type: certType,
                  step_id: step.id.toString(), // Ensure it's handled as a string for safety
                  step_name: step.name,
                  assigned_user_id: userId,
                  status: 'pending'
                }]);

              if (assignError) {
                console.error(`    Failed to create assignment for ${request.reference_number}:`, assignError);
                syncResults.errors.push(`Failed to create assignment for ${request.reference_number}`);
              } else {
                assignmentCount++;
              }
            }
          }

          console.log(`    Created ${assignmentCount} assignments for ${requests?.length || 0} requests`);
          syncResults.totalAssignments += assignmentCount;
        }

        syncResults.updatedSteps++;
      }
    }

    // Update workflow configurations in database
    console.log('\nUpdating workflow configurations in database...');
    for (const certType of certificateTypes) {
      const workflowSteps = workflows[certType];
      if (workflowSteps) {
        const { error: configError } = await supabase
          .from('workflow_configurations')
          .upsert([{
            certificate_type: certType,
            workflow_config: { steps: workflowSteps },
            is_active: true
          }], { onConflict: 'certificate_type' });

        if (configError) {
          console.error(`Error updating ${certType} workflow config:`, configError);
          syncResults.errors.push(`Failed to update workflow configuration for ${certType}`);
        } else {
          console.log(`✅ Updated ${certType} workflow configuration`);
        }
      }
    }

    console.log('\n=== SYNC SUMMARY ===');
    console.log(`✅ Total assignments created: ${syncResults.totalAssignments}`);
    console.log(`✅ Steps processed: ${syncResults.updatedSteps}`);
    console.log(`❌ Errors: ${syncResults.errors.length}`);

    if (syncResults.errors.length > 0) {
      console.log('Errors encountered:');
      syncResults.errors.forEach(error => console.log(`  - ${error}`));
    }

    res.status(200).json({
      success: true,
      message: 'Workflow assignments synced successfully',
      data: {
        totalAssignments: syncResults.totalAssignments,
        updatedSteps: syncResults.updatedSteps,
        errors: syncResults.errors
      }
    });

  } catch (error) {
    console.error('Sync workflow assignments error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during sync',
      error: error.message
    });
  }
});

module.exports = router;
