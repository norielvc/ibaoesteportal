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
    { id: 111, name: 'Review Request', description: 'Initial review of submitted requests', status: 'staff_review', icon: 'Eye', autoApprove: false, assignedUsers: [], requiresApproval: true, sendEmail: true },
    { id: 2, name: 'Barangay Secretary Approval', description: 'Awaiting Barangay Secretary approval', status: 'secretary_approval', icon: 'Clock', autoApprove: false, assignedUsers: [], requiresApproval: true, sendEmail: true, officialRole: 'Brgy. Secretary' },
    { id: 3, name: 'Barangay Captain Approval', description: 'Awaiting Barangay Captain approval', status: 'captain_approval', icon: 'UserCheck', autoApprove: false, assignedUsers: [], requiresApproval: true, sendEmail: true, officialRole: 'Brgy. Captain' },
    { id: 999, name: 'Releasing Team', description: 'Certificate is ready for release', status: 'oic_review', icon: 'CheckCircle', autoApprove: false, assignedUsers: [], requiresApproval: true, sendEmail: true }
  ],
  certificate_of_indigency: [
    { id: 111, name: 'Review Request', description: 'Initial review of submitted requests', status: 'staff_review', icon: 'Eye', autoApprove: false, assignedUsers: [], requiresApproval: true, sendEmail: true },
    { id: 2, name: 'Barangay Secretary Approval', description: 'Awaiting Barangay Secretary approval', status: 'secretary_approval', icon: 'Clock', autoApprove: false, assignedUsers: [], requiresApproval: true, sendEmail: true, officialRole: 'Brgy. Secretary' },
    { id: 3, name: 'Barangay Captain Approval', description: 'Awaiting Barangay Captain approval', status: 'captain_approval', icon: 'UserCheck', autoApprove: false, assignedUsers: [], requiresApproval: true, sendEmail: true, officialRole: 'Brgy. Captain' },
    { id: 999, name: 'Releasing Team', description: 'Certificate is ready for release', status: 'oic_review', icon: 'CheckCircle', autoApprove: false, assignedUsers: [], requiresApproval: true, sendEmail: true }
  ],
  barangay_residency: [
    { id: 111, name: 'Review Request', description: 'Initial review of submitted requests', status: 'staff_review', icon: 'Eye', autoApprove: false, assignedUsers: [], requiresApproval: true, sendEmail: true },
    { id: 2, name: 'Barangay Secretary Approval', description: 'Awaiting Barangay Secretary approval', status: 'secretary_approval', icon: 'Clock', autoApprove: false, assignedUsers: [], requiresApproval: true, sendEmail: true, officialRole: 'Brgy. Secretary' },
    { id: 3, name: 'Barangay Captain Approval', description: 'Awaiting Barangay Captain approval', status: 'captain_approval', icon: 'UserCheck', autoApprove: false, assignedUsers: [], requiresApproval: true, sendEmail: true, officialRole: 'Brgy. Captain' },
    { id: 999, name: 'Releasing Team', description: 'Certificate is ready for release', status: 'oic_review', icon: 'CheckCircle', autoApprove: false, assignedUsers: [], requiresApproval: true, sendEmail: true }
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
      console.log(`\n--- Syncing ${certType} ---`);
      const workflowSteps = workflows[certType];
      if (!workflowSteps || !Array.isArray(workflowSteps)) {
        console.log(`No workflow found for ${certType}, skipping...`);
        continue;
      }

      // 1. CLEAR ALL PENDING ASSIGNMENTS for this type to ensure a clean state
      // This is the most reliable way to handle deletions of users/steps
      const { error: deleteError } = await supabase
        .from('workflow_assignments')
        .delete()
        .eq('request_type', certType)
        .eq('status', 'pending');

      if (deleteError) {
        console.error(`Error clearing assignments for ${certType}:`, deleteError);
        syncResults.errors.push(`Failed to clear existing assignments for ${certType}`);
        continue;
      }

      // 2. Fetch all active requests of this type
      const { data: requests, error: requestsError } = await supabase
        .from('certificate_requests')
        .select(`
          id, 
          reference_number, 
          status,
          certificate_type
        `)
        .eq('certificate_type', certType)
        .in('status', ['pending', 'submitted', 'staff_review', 'processing', 'oic_review']);

      if (requestsError) {
        console.error(`Error fetching requests for ${certType}:`, requestsError);
        syncResults.errors.push(`Failed to fetch requests for ${certType}`);
        continue;
      }

      console.log(`Found ${requests?.length || 0} active requests for ${certType}`);

      // 3. For each request, find its CORRECT step and create assignments
      for (const request of requests || []) {
        let currentStep = null;

        // Determination based on status
        if (request.status === 'staff_review' || request.status === 'pending' || request.status === 'submitted') {
          // 🛡️ ENFORCED SEQUENTIAL FLOW: Initial requests ALWAYS go to the first step (index 0)
          // which we forced to be the "Review Request Team" in the UI save logic.
          currentStep = workflowSteps[0];
        } else if (request.status === 'oic_review') {
          // It's at the Releasing phase
          currentStep = workflowSteps.find(s => s.status === 'oic_review');
        } else if (request.status === 'processing') {
          // It's in the middle approval flow
          // find the first step that is NOT staff_review or oic_review
          const approvalSteps = workflowSteps.filter(s => s.status !== 'staff_review' && s.status !== 'oic_review' && s.requiresApproval);

          // To be precise, we should check history to see which steps are done, 
          // but for now we assume the first approval step if it's "processing"
          // In a multi-step approval, the status might stay "processing"
          // but for simplicity in syncing, we target all users in the approval chain 
          // that could potentially be next.

          // Actually, let's just find the first defined approval step.
          currentStep = approvalSteps[0];
        }

        if (currentStep && currentStep.assignedUsers && currentStep.assignedUsers.length > 0) {
          // Create assignments for all assigned users
          for (const userId of currentStep.assignedUsers) {
            const user = users.find(u => u.id === userId);
            if (!user) continue;

            const { error: assignError } = await supabase
              .from('workflow_assignments')
              .insert([{
                request_id: request.id,
                request_type: certType,
                step_id: currentStep.id.toString(),
                step_name: currentStep.name,
                assigned_user_id: userId,
                status: 'pending'
              }]);

            if (assignError) {
              console.error(`Failed to assign ${user.email} to ${request.reference_number}:`, assignError);
            } else {
              syncResults.totalAssignments++;
            }
          }
        }
      }
      syncResults.updatedSteps += workflowSteps.length;
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
