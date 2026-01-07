const express = require('express');
const router = express.Router();
const supabase = require('../services/supabaseClient');
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
    
    // Get the last reference number for this type and year
    const { data: lastRecord, error } = await supabase
      .from('certificate_requests')
      .select('reference_number')
      .eq('certificate_type', type)
      .like('reference_number', `${prefix}-${year}-%`)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    let nextNumber = 1;
    
    if (lastRecord && lastRecord.reference_number) {
      // Extract the number from the last reference (e.g., "BC-2026-00005" -> 5)
      const parts = lastRecord.reference_number.split('-');
      if (parts.length === 3) {
        const lastNumber = parseInt(parts[2], 10);
        if (!isNaN(lastNumber)) {
          nextNumber = lastNumber + 1;
        }
      }
    }
    
    const referenceNumber = `${prefix}-${year}-${String(nextNumber).padStart(5, '0')}`;
    
    res.json({ 
      success: true, 
      referenceNumber,
      lastNumber: nextNumber - 1,
      nextNumber
    });
  } catch (error) {
    // If no records found, start from 1
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
      lastNumber: 0,
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
    
    // Get the last reference number for barangay_clearance this year
    const { data: lastRecord } = await supabase
      .from('certificate_requests')
      .select('reference_number')
      .eq('certificate_type', 'barangay_clearance')
      .like('reference_number', `BC-${year}-%`)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    let nextNumber = 1;
    if (lastRecord && lastRecord.reference_number) {
      const parts = lastRecord.reference_number.split('-');
      if (parts.length === 3) {
        const lastNumber = parseInt(parts[2], 10);
        if (!isNaN(lastNumber)) {
          nextNumber = lastNumber + 1;
        }
      }
    }
    
    const refNumber = `BC-${year}-${String(nextNumber).padStart(5, '0')}`;

    const { data, error } = await supabase
      .from('certificate_requests')
      .insert([{
        reference_number: refNumber,
        certificate_type: 'barangay_clearance',
        full_name: fullName,
        age: parseInt(age),
        sex,
        civil_status: civilStatus,
        address,
        contact_number: contactNumber,
        date_of_birth: dateOfBirth,
        place_of_birth: placeOfBirth,
        purpose,
        status: 'pending',
        date_issued: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) throw error;

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
    
    // Get the last reference number for certificate_of_indigency this year
    const { data: lastRecord } = await supabase
      .from('certificate_requests')
      .select('reference_number')
      .eq('certificate_type', 'certificate_of_indigency')
      .like('reference_number', `CI-${year}-%`)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    let nextNumber = 1;
    if (lastRecord && lastRecord.reference_number) {
      const parts = lastRecord.reference_number.split('-');
      if (parts.length === 3) {
        const lastNumber = parseInt(parts[2], 10);
        if (!isNaN(lastNumber)) {
          nextNumber = lastNumber + 1;
        }
      }
    }
    
    const refNumber = `CI-${year}-${String(nextNumber).padStart(5, '0')}`;

    const { data, error } = await supabase
      .from('certificate_requests')
      .insert([{
        reference_number: refNumber,
        certificate_type: 'certificate_of_indigency',
        full_name: fullName,
        age: parseInt(age),
        sex: gender,
        civil_status: civilStatus,
        address,
        contact_number: contactNumber,
        date_of_birth: dateOfBirth,
        place_of_birth: placeOfBirth,
        purpose,
        status: 'pending',
        date_issued: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) throw error;

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
    
    // Get the last reference number for barangay_residency this year
    const { data: lastRecord } = await supabase
      .from('certificate_requests')
      .select('reference_number')
      .eq('certificate_type', 'barangay_residency')
      .like('reference_number', `BR-${year}-%`)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    let nextNumber = 1;
    if (lastRecord && lastRecord.reference_number) {
      const parts = lastRecord.reference_number.split('-');
      if (parts.length === 3) {
        const lastNumber = parseInt(parts[2], 10);
        if (!isNaN(lastNumber)) {
          nextNumber = lastNumber + 1;
        }
      }
    }
    
    const refNumber = `BR-${year}-${String(nextNumber).padStart(5, '0')}`;

    const { data, error } = await supabase
      .from('certificate_requests')
      .insert([{
        reference_number: refNumber,
        certificate_type: 'barangay_residency',
        full_name: fullName,
        age: parseInt(age),
        sex,
        civil_status: civilStatus,
        address,
        contact_number: contactNumber,
        date_of_birth: dateOfBirth,
        place_of_birth: placeOfBirth,
        purpose,
        status: 'pending',
        date_issued: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) throw error;

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
    const validStatuses = ['pending', 'submitted', 'processing', 'approved', 'rejected', 'ready_for_pickup', 'released', 'cancelled'];
    
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    // Build update object - only include fields that exist in the table
    const updateData = { 
      status, 
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
