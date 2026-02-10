const express = require('express');
const router = express.Router();
const { supabase } = require('../services/supabaseClient');
const { authenticateToken } = require('../middleware/auth-supabase');
const certificateGenerationService = require('../services/certificateGenerationService');
const qrCodeService = require('../services/qrCodeService');

// Get workflow assignments for a specific user
router.get('/user/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const { status } = req.query; // Optional status filter

    let query = supabase
      .from('workflow_assignments')
      .select(`
        *,
        certificate_requests:request_id (
          id,
          reference_number,
          full_name,
          certificate_type,
          status,
          created_at,
          contact_number,
          purpose,
          date_of_death,
          cause_of_death,
          covid_related,
          requestor_name
        )
      `)
      .eq('assigned_user_id', userId);

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;

    res.json({
      success: true,
      assignments: data || [],
      count: data?.length || 0
    });
  } catch (error) {
    console.error('Error fetching user workflow assignments:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Check if user is assigned to a specific request
router.get('/user/:userId/request/:requestId', authenticateToken, async (req, res) => {
  try {
    const { userId, requestId } = req.params;

    const { data, error } = await supabase
      .from('workflow_assignments')
      .select('*')
      .eq('assigned_user_id', userId)
      .eq('request_id', requestId)
      .eq('status', 'pending')
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      throw error;
    }

    res.json({
      success: true,
      isAssigned: !!data,
      assignment: data || null
    });
  } catch (error) {
    console.error('Error checking workflow assignment:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get all requests assigned to a user (for "My Assignments" view)
router.get('/my-assignments', authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id; // From auth token (note: using _id not id)
    const { status = 'pending' } = req.query;

    const { data, error } = await supabase
      .from('workflow_assignments')
      .select(`
        *,
        certificate_requests:request_id (
          id,
          reference_number,
          full_name,
          certificate_type,
          status,
          created_at,
          contact_number,
          purpose,
          age,
          sex,
          civil_status,
          address,
          date_of_birth,
          place_of_birth,
          date_of_death,
          cause_of_death,
          covid_related,
          requestor_name,
          resident_id,
          residents:resident_id (
            id,
            pending_case,
            case_record_history,
            is_deceased,
            date_of_death,
            cause_of_death,
            covid_related
          ),
          updated_at
        )
      `)
      .eq('assigned_user_id', userId)
      .eq('status', status)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Fetch all workflow configurations for filtering
    const { data: allConfigs } = await supabase
      .from('workflow_configurations')
      .select('certificate_type, workflow_config');

    const configMap = {};
    if (allConfigs) {
      allConfigs.forEach(c => {
        if (c.workflow_config && c.workflow_config.steps) {
          configMap[c.certificate_type] = c.workflow_config.steps;
        }
      });
    }

    // Transform data and STRICTLY filter by step order
    const requests = data.reduce((acc, assignment) => {
      const request = assignment.certificate_requests;
      if (!request) return acc;

      const stepId = assignment.step_id;
      const reqStatus = request.status || 'pending';
      const certType = request.certificate_type;

      // Get workflow steps for this certificate type
      const steps = configMap[certType] || [];

      // Find the index of this assignment's step in the workflow
      const assignmentStepIndex = steps.findIndex(s => String(s.id) === String(stepId));

      // FILTER LOGIC:
      // Since we only query for assignments with status='pending', 
      // and the workflow creates assignments sequentially (next step only after current step is approved),
      // all returned assignments should be valid for the user to act on.
      // 
      // Extra safety: For pending/submitted requests, only show if assignment is for first approval step
      // This handles legacy data where assignments might have been pre-created

      let shouldShow = true;

      if ((reqStatus === 'pending' || reqStatus === 'submitted' || reqStatus === 'staff_review' || reqStatus === 'returned') && steps.length > 0) {
        // For pending requests, only show assignments for the FIRST approval step
        const firstApprovalStep = steps.find(s => s.requiresApproval === true);
        if (firstApprovalStep) {
          shouldShow = String(stepId) === String(firstApprovalStep.id);
        }
      }
      // For processing/other statuses, show all pending assignments (they were created when it was their turn)

      if (shouldShow) {
        acc.push({
          ...request,
          workflow_assignment: {
            id: assignment.id,
            step_id: assignment.step_id,
            step_name: assignment.step_name,
            assigned_user_id: assignment.assigned_user_id,
            assigned_at: assignment.assigned_at,
            status: assignment.status
          }
        });
      }
      return acc;
    }, []);

    // Sort by latest activity (updated_at) - newest first
    // Note: 'updated_at' is used as the primary activity indicator
    requests.sort((a, b) => {
      const timeA = new Date(a.updated_at || a.created_at).getTime();
      const timeB = new Date(b.updated_at || b.created_at).getTime();
      return timeB - timeA;
    });

    res.json({
      success: true,
      certificates: requests,
      count: requests.length
    });
  } catch (error) {
    console.error('Error fetching my assignments:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update workflow assignment status (approve, reject, etc.)
router.put('/:assignmentId/status', authenticateToken, async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const { action, comment, signatureData } = req.body; // action: 'approve', 'reject', 'return'
    const userId = req.user._id;

    // Get the assignment
    const { data: assignment, error: fetchError } = await supabase
      .from('workflow_assignments')
      .select(`
        *,
        certificate_requests:request_id (*)
      `)
      .eq('id', assignmentId)
      .single();

    if (fetchError) throw fetchError;
    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Assignment not found' });
    }

    // Check if user is authorized to update this assignment
    if (assignment.assigned_user_id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to update this assignment' });
    }

    let newStatus = 'completed';
    let newRequestStatus = assignment.certificate_requests.status;

    // Get workflow configuration for this request type
    const { data: workflowConfig, error: configError } = await supabase
      .from('workflow_configurations')
      .select('workflow_config')
      .eq('certificate_type', assignment.request_type)
      .single();

    let steps = [];
    if (workflowConfig && workflowConfig.workflow_config && workflowConfig.workflow_config.steps) {
      steps = workflowConfig.workflow_config.steps;
    } else {
      // Fallback or error handling if no config found
      console.warn(`No workflow config found for ${assignment.request_type}, using basic logic not supported yet.`);
      // We could try to load from file here if needed, but DB should be synced
    }

    // Find current step index
    // Note: step_id is stored as string in DB for large IDs, but might be number in JSON
    const currentStepIndex = steps.findIndex(s => s.id.toString() === assignment.step_id.toString());
    const currentStep = steps[currentStepIndex];
    let nextStep = null;

    // Determine new status based on action
    if (action === 'approve') {
      // 🎯 SPECIAL CASE: OIC / Releasing Team Two-Stage Flow
      if (currentStep && currentStep.status === 'oic_review') {
        if (assignment.certificate_requests.status !== 'ready') {
          // Stage 1: Mark as Ready (Keep assignment pending so it stays in "My Assignments")
          newStatus = 'pending';
          newRequestStatus = 'ready';

          // Trigger PDF generation
          setImmediate(async () => {
            try {
              await processPostApprovalWorkflow(assignment.request_id, assignment.certificate_requests);
            } catch (error) {
              console.error('Error in post-approval workflow:', error);
            }
          });
          console.log(`⚡ OIC Stage 1: Moved to Ready, keeping assignment pending for final release.`);
        } else {
          // Stage 2: Mark as Released (Finalize assignment)
          newStatus = 'completed';
          newRequestStatus = 'released';
          console.log(`✅ OIC Stage 2: Final Release completed.`);
        }
      } else if (currentStepIndex !== -1 && currentStepIndex < steps.length - 1) {
        // Normal Flow: Move to NEXT defined step
        newStatus = 'completed';
        nextStep = steps[currentStepIndex + 1];
        newRequestStatus = nextStep.status;

        // Auto-trigger post-approval if we skipped to a ready/released state (non-OIC flow)
        if (nextStep.status === 'ready' || nextStep.status === 'released') {
          setImmediate(async () => {
            try {
              await processPostApprovalWorkflow(assignment.request_id, assignment.certificate_requests);
            } catch (error) {
              console.error('Error in post-approval workflow:', error);
            }
          });
        }
      } else {
        // No more steps and not OIC (or already in a final state)
        newStatus = 'completed';
        newRequestStatus = 'released';
      }
    } else if (action === 'reject') {
      newStatus = 'completed';
      newRequestStatus = 'cancelled'; // Changed from 'rejected' to match DB constraint
    } else if (action === 'return') {
      newStatus = 'completed';
      newRequestStatus = 'returned'; // Explicitly set to 'returned'

      // 🔄 RETURNING FLOW: Re-assign to the FIRST step (Review Request Team)
      if (steps && steps.length > 0) {
        nextStep = steps[0]; // First step is Review Team
        console.log(`🏠 Returning to first step: ${nextStep.name}`);
      }
    }

    // Update assignment status
    const { error: updateError } = await supabase
      .from('workflow_assignments')
      .update({
        status: newStatus,
        completed_at: new Date().toISOString()
      })
      .eq('id', assignmentId);

    if (updateError) throw updateError;

    // Update certificate request status
    const { error: requestUpdateError } = await supabase
      .from('certificate_requests')
      .update({
        status: newRequestStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', assignment.request_id);

    if (requestUpdateError) {
      console.error(`❌ DATABASE CONSTRAINT ERROR: Failed to update certificate_requests status to "${newRequestStatus}":`, requestUpdateError);
      throw requestUpdateError;
    }

    // Create next step assignments if approved or returned
    if ((action === 'approve' || action === 'return') && nextStep) {
      console.log(`Creating assignments for next step: ${nextStep.name} (ID: ${nextStep.id})`);

      const nextStepAssignments = nextStep.assignedUsers || [];

      if (nextStepAssignments.length > 0) {
        for (const userId of nextStepAssignments) {
          // Check if assignment already exists to avoid duplicates
          const { data: existing } = await supabase
            .from('workflow_assignments')
            .select('id')
            .eq('request_id', assignment.request_id)
            .eq('step_id', nextStep.id.toString())
            .eq('assigned_user_id', userId)
            .eq('status', 'pending')
            .single();

          if (!existing) {
            const { error: assignError } = await supabase
              .from('workflow_assignments')
              .insert([{
                request_id: assignment.request_id,
                request_type: assignment.request_type,
                step_id: nextStep.id.toString(),
                step_name: nextStep.name,
                assigned_user_id: userId,
                status: 'pending'
              }]);

            if (assignError) {
              console.error(`Failed to create assignment for user ${userId}:`, assignError);
            } else {
              console.log(` Assigned ${userId} to ${nextStep.name}`);
            }
          }
        }
      } else {
        console.log(`Warning: Next step ${nextStep.name} has no assigned users.`);
      }
    }

    // Log workflow history
    const { error: historyError } = await supabase
      .from('workflow_history')
      .insert([{
        request_id: assignment.request_id,
        request_type: assignment.request_type,
        step_id: assignment.step_id,
        step_name: assignment.step_name,
        action: action,
        performed_by: userId,
        previous_status: assignment.certificate_requests.status,
        new_status: newRequestStatus,
        comments: comment,
        signature_data: signatureData,
        official_role: currentStep?.officialRole
      }]);

    // Don't fail if history logging fails, but log it clearly
    if (historyError) {
      console.error(`❌ WORKFLOW HISTORY ERROR [${assignment.request_type}]:`, historyError.message, historyError.details);
    }

    res.json({
      success: true,
      message: `Request ${action}d successfully`,
      newStatus: newRequestStatus
    });
  } catch (error) {
    console.error('Error updating workflow assignment:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Add an internal note to a request
router.post('/add-note', authenticateToken, async (req, res) => {
  try {
    const { requestId, requestType, comment, stepId, stepName } = req.body;
    const userId = req.user._id;

    if (!requestId || !comment) {
      return res.status(400).json({ success: false, message: 'Request ID and comment are required' });
    }

    const { error } = await supabase
      .from('workflow_history')
      .insert([{
        request_id: requestId,
        request_type: requestType,
        step_id: stepId || 'note',
        step_name: stepName || 'Internal Note',
        action: 'note',
        performed_by: userId,
        comments: comment,
        new_status: 'note' // Using 'note' as status or keep previous? Maybe 'note' to distinguish.
      }]);

    if (error) throw error;

    // 🎯 IMPORTANT: Update the certificate_requests table's updated_at 
    // to ensure this request jumps to the top of the "Last Activity" list
    await supabase
      .from('certificate_requests')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', requestId);

    res.json({ success: true, message: 'Note added successfully' });
  } catch (error) {
    console.error('Error adding note:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get workflow history for a request
router.get('/history/:requestId', authenticateToken, async (req, res) => {
  try {
    const { requestId } = req.params;

    // 1. Fetch from new workflow_history table
    const { data: historyData, error: historyError } = await supabase
      .from('workflow_history')
      .select(`
        *,
        users:performed_by (
          first_name,
          last_name,
          email
        )
      `)
      .eq('request_id', requestId)
      .order('created_at', { ascending: false });

    if (historyError) throw historyError;

    // 2. Fetch completed assignments from workflow_assignments (Legacy/Fallback)
    const { data: assignmentData, error: assignmentError } = await supabase
      .from('workflow_assignments')
      .select(`
        *,
        users:assigned_user_id (
          first_name,
          last_name,
          email
        )
      `)
      .eq('request_id', requestId)
      .eq('status', 'completed')
      .order('completed_at', { ascending: true });

    if (assignmentError) throw assignmentError;

    // 3. Merge and formatting
    const existingStepIds = new Set((historyData || []).map(h => String(h.step_id)));
    const legacyEntries = (assignmentData || []).filter(a => !existingStepIds.has(String(a.step_id))).map(a => ({
      id: a.id,
      request_id: a.request_id,
      step_id: a.step_id,
      step_name: a.step_name,
      action: 'completed', // Generic action for legacy
      performed_by: a.assigned_user_id,
      users: a.users, // Attached user data
      created_at: a.completed_at || a.updated_at || a.assigned_at, // Use completion time
      comments: a.comments || a.comment || a.remarks || a.note || 'Action Completed', // Try to find comment, fallback to generic
      is_legacy: true
    }));

    const combinedHistory = [...(historyData || []), ...legacyEntries].sort((a, b) =>
      new Date(a.created_at) - new Date(b.created_at)
    );

    res.json({
      success: true,
      history: combinedHistory
    });
  } catch (error) {
    console.error('Error fetching workflow history:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 🎯 POST-APPROVAL WORKFLOW FUNCTION
async function processPostApprovalWorkflow(requestId, requestData) {
  console.log(`🚀 Starting post-approval workflow for ${requestData.reference_number}`);

  try {
    // Step 1: Generate Certificate
    console.log('📄 Step 1: Generating certificate...');
    const certificateResult = await certificateGenerationService.generateCertificate(requestId);

    if (certificateResult.success) {
      console.log(`✅ Certificate generated: ${certificateResult.filename}`);
    } else {
      throw new Error('Certificate generation failed');
    }

    // Step 2: Generate Pickup QR Code
    console.log('🔗 Step 2: Generating pickup QR code...');
    const qrResult = await qrCodeService.generatePickupQRCode(requestId);

    if (qrResult.success) {
      console.log(`✅ Pickup QR code generated: ${qrResult.pickupToken}`);
    } else {
      throw new Error('QR code generation failed');
    }

    // Step 3: Log completion
    console.log('📝 Step 3: Logging workflow completion...');
    await supabase
      .from('workflow_history')
      .insert([{
        request_id: requestId,
        request_type: requestData.certificate_type,
        step_id: 4,
        step_name: 'Post-Approval Processing',
        action: 'completed',
        performed_by: 'system',
        previous_status: 'ready',
        new_status: 'ready',
        comments: `Certificate generated and QR code created. Ready for pickup.`
      }]);

    console.log(`🎉 Post-approval workflow completed for ${requestData.reference_number}`);

    return {
      success: true,
      certificate: certificateResult,
      qrCode: qrResult
    };

  } catch (error) {
    console.error(`❌ Post-approval workflow failed for ${requestData.reference_number}:`, error);

    // Log the error but don't fail the main approval process
    await supabase
      .from('workflow_history')
      .insert([{
        request_id: requestId,
        request_type: requestData.certificate_type,
        step_id: 4,
        step_name: 'Post-Approval Processing',
        action: 'failed',
        performed_by: 'system',
        previous_status: 'ready',
        new_status: 'ready',
        comments: `Post-approval workflow failed: ${error.message}`
      }]);

    return {
      success: false,
      error: error.message
    };
  }
}

module.exports = router;