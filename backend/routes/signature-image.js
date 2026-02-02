const express = require('express');
const router = express.Router();
const { supabase } = require('../services/supabaseClient');
const { authenticateToken } = require('../middleware/auth-supabase');

// Serve signature image by ID
router.get('/:signatureId', authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;
    const signatureId = req.params.signatureId;

    // Get signature data
    const { data: signature, error } = await supabase
      .from('user_signatures')
      .select('signature_data, name')
      .eq('id', signatureId)
      .eq('user_id', userId)
      .single();

    if (error || !signature) {
      return res.status(404).json({
        success: false,
        message: 'Signature not found'
      });
    }

    if (!signature.signature_data) {
      return res.status(404).json({
        success: false,
        message: 'No signature data found'
      });
    }

    // Parse the data URL
    const dataURL = signature.signature_data;
    if (!dataURL.startsWith('data:image/')) {
      return res.status(400).json({
        success: false,
        message: 'Invalid signature data format'
      });
    }

    // Extract MIME type and base64 data
    const [header, base64Data] = dataURL.split('base64,');
    const mimeType = header.split(':')[1].split(';')[0];

    if (!base64Data) {
      return res.status(400).json({
        success: false,
        message: 'Invalid base64 data'
      });
    }

    // Convert base64 to buffer
    const imageBuffer = Buffer.from(base64Data, 'base64');

    // Set appropriate headers
    res.set({
      'Content-Type': mimeType,
      'Content-Length': imageBuffer.length,
      'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      'Content-Disposition': `inline; filename="${signature.name || 'signature'}.${mimeType.split('/')[1]}"`
    });

    // Send the image
    res.send(imageBuffer);

  } catch (error) {
    console.error('Error serving signature image:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;