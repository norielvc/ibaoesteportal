const express = require('express');
const fs = require('fs');
const path = require('path');
const { requireAdmin, authenticateToken } = require('../middleware/auth-supabase');

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
    { id: 2, name: 'Under Review', description: 'Being reviewed by staff', status: 'processing', icon: 'Clock', autoApprove: false, assignedUsers: [], requiresApproval: true, sendEmail: true },
    { id: 3, name: 'Barangay Captain Approval', description: 'Approved by authorized personnel', status: 'approved', icon: 'UserCheck', autoApprove: false, assignedUsers: [], requiresApproval: true, sendEmail: true },
    { id: 4, name: 'Ready for Pickup', description: 'Certificate is ready', status: 'ready', icon: 'CheckCircle', autoApprove: false, assignedUsers: [], requiresApproval: false, sendEmail: false },
    { id: 5, name: 'Released', description: 'Certificate released to applicant', status: 'released', icon: 'CheckCircle', autoApprove: false, assignedUsers: [], requiresApproval: false, sendEmail: false }
  ],
  certificate_of_indigency: [
    { id: 1, name: 'Submitted', description: 'Application received', status: 'pending', icon: 'FileText', autoApprove: false, assignedUsers: [], requiresApproval: false, sendEmail: true },
    { id: 2, name: 'Under Review', description: 'Being reviewed by staff', status: 'processing', icon: 'Clock', autoApprove: false, assignedUsers: [], requiresApproval: true, sendEmail: true },
    { id: 3, name: 'Barangay Captain Approval', description: 'Approved by authorized personnel', status: 'approved', icon: 'UserCheck', autoApprove: false, assignedUsers: [], requiresApproval: true, sendEmail: true },
    { id: 4, name: 'Ready for Pickup', description: 'Certificate is ready', status: 'ready', icon: 'CheckCircle', autoApprove: false, assignedUsers: [], requiresApproval: false, sendEmail: false },
    { id: 5, name: 'Released', description: 'Certificate released to applicant', status: 'released', icon: 'CheckCircle', autoApprove: false, assignedUsers: [], requiresApproval: false, sendEmail: false }
  ],
  barangay_residency: [
    { id: 1, name: 'Submitted', description: 'Application received', status: 'pending', icon: 'FileText', autoApprove: false, assignedUsers: [], requiresApproval: false, sendEmail: true },
    { id: 2, name: 'Under Review', description: 'Being reviewed by staff', status: 'processing', icon: 'Clock', autoApprove: false, assignedUsers: [], requiresApproval: true, sendEmail: true },
    { id: 3, name: 'Barangay Captain Approval', description: 'Approved by authorized personnel', status: 'approved', icon: 'UserCheck', autoApprove: false, assignedUsers: [], requiresApproval: true, sendEmail: true },
    { id: 4, name: 'Ready for Pickup', description: 'Certificate is ready', status: 'ready', icon: 'CheckCircle', autoApprove: false, assignedUsers: [], requiresApproval: false, sendEmail: false },
    { id: 5, name: 'Released', description: 'Certificate released to applicant', status: 'released', icon: 'CheckCircle', autoApprove: false, assignedUsers: [], requiresApproval: false, sendEmail: false }
  ]
};

// Load workflows from file
const loadWorkflows = () => {
  try {
    if (fs.existsSync(WORKFLOWS_FILE)) {
      const data = fs.readFileSync(WORKFLOWS_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error loading workflows:', error);
  }
  return defaultWorkflows;
};

// Save workflows to file
const saveWorkflowsToFile = (workflows) => {
  try {
    fs.writeFileSync(WORKFLOWS_FILE, JSON.stringify(workflows, null, 2));
    return true;
  } catch (error) {
    console.error('Error saving workflows:', error);
    return false;
  }
};

/**
 * @route   GET /api/workflows
 * @desc    Get all workflows (accessible to all authenticated users)
 * @access  Private
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const workflows = loadWorkflows();
    console.log('Workflows loaded:', Object.keys(workflows));

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

    const saved = saveWorkflowsToFile(workflows);
    
    if (!saved) {
      return res.status(500).json({
        success: false,
        message: 'Failed to save workflows'
      });
    }

    console.log('Workflows saved successfully');

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

module.exports = router;
