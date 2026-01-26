const express = require('express');
const router = express.Router();
const { supabase } = require('../services/supabaseClient');
const { authenticateToken } = require('../middleware/auth-supabase');

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
          purpose
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
    const userId = req.user.id; // From auth token
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
          place_of_birth
        )
      `)
      .eq('assigned_user_id', userId)
      .eq('status', status)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    // Transform data to match expected format
    const requests = data.map(assignment => ({
      ...assignment.certificate_requests,
      workflow_assignment: {
        id: assignment.id,
        step_id: assignment.step_id,
        step_name: assignment.step_name,
        assigned_at: assignment.assigned_at,
        status: assignment.status
      }
    }));
    
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
    const { action, comment } = req.body; // action: 'approve', 'reject', 'return'
    const userId = req.user.id;
    
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
    
    // Determine new status based on action
    if (action === 'approve') {
      newStatus = 'completed';
      // Move to next step in workflow
      if (assignment.step_id === 2) { // Staff review -> Captain approval
        newRequestStatus = 'processing';
      } else if (assignment.step_id === 3) { // Captain approval -> Ready
        newRequestStatus = 'approved';
      }
    } else if (action === 'reject') {
      newStatus = 'completed';
      newRequestStatus = 'rejected';
    } else if (action === 'return') {
      newStatus = 'completed';
      newRequestStatus = 'pending'; // Return to previous step
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
    
    if (requestUpdateError) throw requestUpdateError;
    
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
        comments: comment
      }]);
    
    // Don't fail if history logging fails
    if (historyError) {
      console.error('Failed to log workflow history:', historyError);
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

// Get workflow history for a request
router.get('/history/:requestId', authenticateToken, async (req, res) => {
  try {
    const { requestId } = req.params;
    
    const { data, error } = await supabase
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
      .order('created_at', { ascending: true });
    
    if (error) throw error;
    
    res.json({ 
      success: true, 
      history: data || []
    });
  } catch (error) {
    console.error('Error fetching workflow history:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;