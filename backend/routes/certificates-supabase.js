const express = require('express');
const router = express.Router();
const { supabase } = require('../services/supabaseClient');
const { sendWorkflowNotifications } = require('../services/emailService');

// Helper function to send workflow notifications
const notifyNextStepApprovers = async (certificateType, referenceNumber, applicantName, requestId) => {
  try {
    // Get workflow configuration from request body or use default
    // In production, this would be fetched from a database
    const defaultWorkflow = [
      { status: 'pending', sendEmail: false, assignedUsers: [] },
      { status: 'staff_review', sendEmail: true, assignedUsers: [] },
      { status: 'captain_approval', sendEmail: true, assignedUsers: [] },
      { status: 'ready', sendEmail: false, assignedUsers: [] },
      { status: 'released', sendEmail: false, assignedUsers: [] }
    ];

    // Find the first step that requires email notification (staff_review)
    const nextStep = defaultWorkflow.find(step => step.status === 'staff_review');

    if (nextStep && nextStep.sendEmail && nextStep.assignedUsers.length > 0) {
      // Get user details for assigned users
      const { data: users } = await supabase
        .from('users')
        .select('id, email, first_name, last_name')
        .in('id', nextStep.assignedUsers);

      if (users && users.length > 0) {
        const recipients = users.map(u => ({
          email: u.email,
          name: `${u.first_name} ${u.last_name}`
        }));

        await sendWorkflowNotifications({
          recipients,
          certificateType,
          referenceNumber,
          applicantName,
          stepName: 'Staff Review',
          requestId
        });
      }
    }
  } catch (error) {
    console.error('Error sending workflow notifications:', error);
  }
};

// Get next reference number for a certificate type
router.get('/next-reference/:type', async (req, res) => {
  try {
    const { type } = req.params;

    // Map type to prefix
    const prefixMap = {
      'barangay_clearance': 'BC',
      'certificate_of_indigency': 'CI',
      'barangay_residency': 'BR'
    };

    const prefix = prefixMap[type] || 'REF';
    const year = new Date().getFullYear();

    // Get ALL records of this type for this year, ordered by reference_number descending
    const { data: records, error } = await supabase
      .from('certificate_requests')
      .select('reference_number')
      .eq('certificate_type', type)
      .order('reference_number', { ascending: false });

    if (error) {
      console.error('Error fetching records:', error);
      throw error;
    }

    let nextNumber = 1;

    // Find the highest number from existing records for this year
    if (records && records.length > 0) {
      let maxNumber = 0;
      for (const record of records) {
        if (record.reference_number && record.reference_number.startsWith(`${prefix}-${year}-`)) {
          const parts = record.reference_number.split('-');
          if (parts.length === 3) {
            const num = parseInt(parts[2], 10);
            if (!isNaN(num) && num > maxNumber) {
              maxNumber = num;
            }
          }
        }
      }
      nextNumber = maxNumber + 1;
    }

    const referenceNumber = `${prefix}-${year}-${String(nextNumber).padStart(5, '0')}`;

    console.log(`Next reference for ${type}: ${referenceNumber} (found ${records?.length || 0} records)`);

    res.json({
      success: true,
      referenceNumber,
      nextNumber
    });
  } catch (error) {
    console.error('Error getting next reference:', error);
    // Fallback to 00001 if error
    const { type } = req.params;
    const prefixMap = {
      'barangay_clearance': 'BC',
      'certificate_of_indigency': 'CI',
      'barangay_residency': 'BR'
    };
    const prefix = prefixMap[type] || 'REF';
    const year = new Date().getFullYear();
    const referenceNumber = `${prefix}-${year}-00001`;

    res.json({
      success: true,
      referenceNumber,
      nextNumber: 1
    });
  }
});

// Get all certificate requests (with optional filters)
router.get('/', async (req, res) => {
  try {
    const { type, status } = req.query;

    let query = supabase
      .from('certificate_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (type) query = query.eq('certificate_type', type);
    if (status) query = query.eq('status', status);

    const { data, error } = await query;

    if (error) throw error;

    res.json({ success: true, certificates: data });
  } catch (error) {
    console.error('Error fetching certificates:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get single certificate request
router.get('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('certificate_requests')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ success: false, message: 'Certificate not found' });

    res.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching certificate:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create new certificate request (Barangay Clearance)
router.post('/clearance', async (req, res) => {
  try {
    const {
      fullName, age, sex, civilStatus, address, contactNumber,
      dateOfBirth, placeOfBirth, purpose
    } = req.body;

    const year = new Date().getFullYear();
    const prefix = 'BC';

    // Get ALL barangay_clearance records to find the highest number
    const { data: records } = await supabase
      .from('certificate_requests')
      .select('reference_number')
      .eq('certificate_type', 'barangay_clearance')
      .order('reference_number', { ascending: false });

    let nextNumber = 1;
    if (records && records.length > 0) {
      let maxNumber = 0;
      for (const record of records) {
        if (record.reference_number && record.reference_number.startsWith(`${prefix}-${year}-`)) {
          const parts = record.reference_number.split('-');
          if (parts.length === 3) {
            const num = parseInt(parts[2], 10);
            if (!isNaN(num) && num > maxNumber) {
              maxNumber = num;
            }
          }
        }
      }
      nextNumber = maxNumber + 1;
    }

    const refNumber = `${prefix}-${year}-${String(nextNumber).padStart(5, '0')}`;
    console.log(`Creating clearance with reference: ${refNumber}`);

    const { data, error } = await supabase
      .from('certificate_requests')
      .insert([{
        reference_number: refNumber,
        certificate_type: 'barangay_clearance',
        full_name: fullName?.toUpperCase() || '',
        age: parseInt(age),
        sex: sex?.toUpperCase() || '',
        civil_status: civilStatus?.toUpperCase() || '',
        address: address?.toUpperCase() || '',
        contact_number: contactNumber,
        date_of_birth: dateOfBirth,
        place_of_birth: placeOfBirth?.toUpperCase() || '',
        purpose: purpose?.toUpperCase() || '',
        status: 'pending',
        date_issued: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) throw error;

    // Create initial workflow assignments based on configuration
    // Fetch workflow config for this type
    const { data: workflowConfig } = await supabase
      .from('workflow_configurations')
      .select('workflow_config')
      .eq('certificate_type', 'barangay_clearance')
      .single();

    let staffUserIds = [];
    let initialStepId = 2; // Default to legacy step 2
    let initialStepName = 'Staff Review';

    if (workflowConfig && workflowConfig.workflow_config && workflowConfig.workflow_config.steps) {
      // Find the first approval step (usually after 'pending' if pending is a step, or the first step)
      // Assuming 'pending' is step 0, so looking for step 1 or 'staff_review'
      const steps = workflowConfig.workflow_config.steps;

      // Try to find specific 'staff_review' step, or use the second step (index 1)
      const firstApprovalStep = steps.find(s => s.status === 'staff_review' || s.id === 2) || steps[1]; // Index 1 because 0 is usually 'pending'

      if (firstApprovalStep && firstApprovalStep.assignedUsers && firstApprovalStep.assignedUsers.length > 0) {
        staffUserIds = firstApprovalStep.assignedUsers;
        initialStepId = firstApprovalStep.id;
        initialStepName = firstApprovalStep.name;
        console.log(`Using configured workflow assignments for step: ${initialStepName}`);
      }
    }

    // Fallback if no config found (Legacy hardcoded)
    if (staffUserIds.length === 0) {
      console.log('Using fallback hardcoded staff assignment');
      staffUserIds = ['9550a8b2-9e32-4f52-a260-52766afb49b1']; // Noriel Cruz
    }

    for (const staffUserId of staffUserIds) {
      const { error: assignmentError } = await supabase
        .from('workflow_assignments')
        .insert([{
          request_id: data.id,
          request_type: 'barangay_clearance',
          step_id: initialStepId,
          step_name: initialStepName,
          assigned_user_id: staffUserId,
          status: 'pending'
        }]);

      if (assignmentError) {
        console.error('Failed to create workflow assignment:', assignmentError);
      }
    }

    // Send email notifications to next step approvers
    notifyNextStepApprovers('barangay_clearance', refNumber, fullName, data.id);

    res.status(201).json({
      success: true,
      message: 'Barangay Clearance request submitted successfully',
      data,
      referenceNumber: refNumber
    });
  } catch (error) {
    console.error('Error creating clearance request:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create new certificate request (Certificate of Indigency)
router.post('/indigency', async (req, res) => {
  try {
    const {
      fullName, age, gender, civilStatus, address, contactNumber,
      dateOfBirth, placeOfBirth, purpose
    } = req.body;

    const year = new Date().getFullYear();
    const prefix = 'CI';

    // Get ALL certificate_of_indigency records to find the highest number
    const { data: records } = await supabase
      .from('certificate_requests')
      .select('reference_number')
      .eq('certificate_type', 'certificate_of_indigency')
      .order('reference_number', { ascending: false });

    let nextNumber = 1;
    if (records && records.length > 0) {
      let maxNumber = 0;
      for (const record of records) {
        if (record.reference_number && record.reference_number.startsWith(`${prefix}-${year}-`)) {
          const parts = record.reference_number.split('-');
          if (parts.length === 3) {
            const num = parseInt(parts[2], 10);
            if (!isNaN(num) && num > maxNumber) {
              maxNumber = num;
            }
          }
        }
      }
      nextNumber = maxNumber + 1;
    }

    const refNumber = `${prefix}-${year}-${String(nextNumber).padStart(5, '0')}`;
    console.log(`Creating indigency with reference: ${refNumber}`);

    const { data, error } = await supabase
      .from('certificate_requests')
      .insert([{
        reference_number: refNumber,
        certificate_type: 'certificate_of_indigency',
        full_name: fullName?.toUpperCase() || '',
        age: parseInt(age),
        sex: gender?.toUpperCase() || '',
        civil_status: civilStatus?.toUpperCase() || '',
        address: address?.toUpperCase() || '',
        contact_number: contactNumber,
        date_of_birth: dateOfBirth,
        place_of_birth: placeOfBirth?.toUpperCase() || '',
        purpose: purpose?.toUpperCase() || '',
        status: 'pending',
        date_issued: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) throw error;

    // Create initial workflow assignments for staff (step 2: Under Review)
    const staffUserIds = [
      '9550a8b2-9e32-4f52-a260-52766afb49b1' // Noriel Cruz (as shown in UI)
    ];

    for (const staffUserId of staffUserIds) {
      const { error: assignmentError } = await supabase
        .from('workflow_assignments')
        .insert([{
          request_id: data.id,
          request_type: 'certificate_of_indigency',
          step_id: 2, // Step 2: Staff Review
          step_name: 'Staff Review',
          assigned_user_id: staffUserId,
          status: 'pending'
        }]);

      if (assignmentError) {
        console.error('Failed to create workflow assignment:', assignmentError);
      }
    }

    // Send email notifications to next step approvers
    notifyNextStepApprovers('certificate_of_indigency', refNumber, fullName, data.id);

    res.status(201).json({
      success: true,
      message: 'Certificate of Indigency request submitted successfully',
      data,
      referenceNumber: refNumber
    });
  } catch (error) {
    console.error('Error creating indigency request:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create new certificate request (Barangay Residency)
router.post('/residency', async (req, res) => {
  try {
    const {
      fullName, age, sex, civilStatus, address, contactNumber,
      dateOfBirth, placeOfBirth, purpose
    } = req.body;

    const year = new Date().getFullYear();
    const prefix = 'BR';

    // Get ALL barangay_residency records to find the highest number
    const { data: records } = await supabase
      .from('certificate_requests')
      .select('reference_number')
      .eq('certificate_type', 'barangay_residency')
      .order('reference_number', { ascending: false });

    let nextNumber = 1;
    if (records && records.length > 0) {
      let maxNumber = 0;
      for (const record of records) {
        if (record.reference_number && record.reference_number.startsWith(`${prefix}-${year}-`)) {
          const parts = record.reference_number.split('-');
          if (parts.length === 3) {
            const num = parseInt(parts[2], 10);
            if (!isNaN(num) && num > maxNumber) {
              maxNumber = num;
            }
          }
        }
      }
      nextNumber = maxNumber + 1;
    }

    const refNumber = `${prefix}-${year}-${String(nextNumber).padStart(5, '0')}`;
    console.log(`Creating residency with reference: ${refNumber}`);

    const { data, error } = await supabase
      .from('certificate_requests')
      .insert([{
        reference_number: refNumber,
        certificate_type: 'barangay_residency',
        full_name: fullName?.toUpperCase() || '',
        age: parseInt(age),
        sex: sex?.toUpperCase() || '',
        civil_status: civilStatus?.toUpperCase() || '',
        address: address?.toUpperCase() || '',
        contact_number: contactNumber,
        date_of_birth: dateOfBirth,
        place_of_birth: placeOfBirth?.toUpperCase() || '',
        purpose: purpose?.toUpperCase() || '',
        status: 'pending',
        date_issued: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) throw error;

    // Create initial workflow assignments for staff (step 2: Under Review)
    const staffUserIds = [
      '9550a8b2-9e32-4f52-a260-52766afb49b1' // Noriel Cruz (as shown in UI)
    ];

    for (const staffUserId of staffUserIds) {
      const { error: assignmentError } = await supabase
        .from('workflow_assignments')
        .insert([{
          request_id: data.id,
          request_type: 'barangay_residency',
          step_id: 2, // Step 2: Staff Review
          step_name: 'Staff Review',
          assigned_user_id: staffUserId,
          status: 'pending'
        }]);

      if (assignmentError) {
        console.error('Failed to create workflow assignment:', assignmentError);
      }
    }

    // Send email notifications to next step approvers
    notifyNextStepApprovers('barangay_residency', refNumber, fullName, data.id);

    res.status(201).json({
      success: true,
      message: 'Barangay Residency Certificate request submitted successfully',
      data,
      referenceNumber: refNumber
    });
  } catch (error) {
    console.error('Error creating residency request:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update certificate status (for admin)
router.put('/:id/status', async (req, res) => {
  try {
    const { status, comment, action } = req.body;
    console.log(`Updating status for request ${req.params.id}:`, { status, action, comment });

    const validStatuses = [
      'pending', 'submitted', 'processing', 'under_review',
      'approved', 'rejected', 'returned', 'ready',
      'ready_for_pickup', 'released', 'cancelled',
      'staff_review', 'captain_approval', 'oic_review', 'completed'
    ];

    if (status && !validStatuses.includes(status)) {
      console.error('Invalid status received:', status);
      return res.status(400).json({ success: false, message: `Invalid status: ${status}` });
    }

    // Map status to allowed database values if necessary
    let finalStatus = status;
    if (status === 'approved') finalStatus = 'ready';
    if (status === 'rejected') finalStatus = 'cancelled';

    // Build update object - only include fields that exist in the table
    const updateData = {
      status: finalStatus,
      updated_at: new Date().toISOString()
    };

    // Try to update with all fields first, if it fails, update without optional fields
    try {
      // Add comment/reason if provided
      if (comment) {
        updateData.admin_comment = comment;
      }

      // Track action history
      if (action) {
        updateData.last_action = action;
        updateData.last_action_date = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from('certificate_requests')
        .update(updateData)
        .eq('id', req.params.id)
        .select()
        .single();

      if (error) throw error;

      res.json({ success: true, message: 'Status updated successfully', data });
    } catch (innerError) {
      // If error is about missing column, try without optional fields
      if (innerError.message && innerError.message.includes('column')) {
        console.log('Retrying without optional columns...');
        const basicUpdateData = {
          status,
          updated_at: new Date().toISOString()
        };

        const { data, error } = await supabase
          .from('certificate_requests')
          .update(basicUpdateData)
          .eq('id', req.params.id)
          .select()
          .single();

        if (error) throw error;

        res.json({ success: true, message: 'Status updated successfully', data });
      } else {
        throw innerError;
      }
    }
  } catch (error) {
    console.error('Error updating status:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete certificate request
router.delete('/:id', async (req, res) => {
  try {
    const { error } = await supabase
      .from('certificate_requests')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;

    res.json({ success: true, message: 'Certificate request deleted' });
  } catch (error) {
    console.error('Error deleting certificate:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get statistics
router.get('/stats/summary', async (req, res) => {
  try {
    const { data: all, error: allError } = await supabase
      .from('certificate_requests')
      .select('certificate_type, status');

    if (allError) throw allError;

    const stats = {
      total: all.length,
      byType: {
        barangay_clearance: all.filter(c => c.certificate_type === 'barangay_clearance').length,
        certificate_of_indigency: all.filter(c => c.certificate_type === 'certificate_of_indigency').length
      },
      byStatus: {
        pending: all.filter(c => c.status === 'pending').length,
        processing: all.filter(c => c.status === 'processing').length,
        ready: all.filter(c => c.status === 'ready').length,
        released: all.filter(c => c.status === 'released').length
      }
    };

    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
