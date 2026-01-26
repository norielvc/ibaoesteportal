const express = require('express');
const router = express.Router();
const qrCodeService = require('../services/qrCodeService');

// Verify pickup token (public endpoint)
router.get('/verify', async (req, res) => {
  try {
    const { token, ref } = req.query;

    if (!token || !ref) {
      return res.status(400).json({
        success: false,
        valid: false,
        message: 'Missing token or reference number'
      });
    }

    const verification = await qrCodeService.verifyPickupToken(token, ref);
    
    res.json({
      success: true,
      ...verification
    });

  } catch (error) {
    console.error('Error verifying pickup token:', error);
    res.status(500).json({
      success: false,
      valid: false,
      message: 'Internal server error'
    });
  }
});

// Confirm pickup (public endpoint)
router.post('/confirm', async (req, res) => {
  try {
    const { token, pickedUpBy } = req.body;

    if (!token || !pickedUpBy) {
      return res.status(400).json({
        success: false,
        message: 'Missing token or pickup person name'
      });
    }

    // First verify the token is still valid
    const verification = await qrCodeService.verifyPickupToken(token, '');
    
    if (!verification.valid) {
      return res.status(400).json({
        success: false,
        message: verification.message
      });
    }

    // Mark as picked up
    const result = await qrCodeService.markAsPickedUp(token, pickedUpBy);
    
    if (result.success) {
      res.json({
        success: true,
        message: 'Certificate pickup confirmed successfully',
        pickedUpAt: result.pickedUpAt
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message || 'Failed to confirm pickup'
      });
    }

  } catch (error) {
    console.error('Error confirming pickup:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get pickup history for a request (authenticated)
router.get('/history/:requestId', async (req, res) => {
  try {
    const { requestId } = req.params;
    
    const result = await qrCodeService.getPickupHistory(requestId);
    
    res.json(result);

  } catch (error) {
    console.error('Error getting pickup history:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;