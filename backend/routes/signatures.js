const express = require('express');
const router = express.Router();
const { supabase } = require('../services/supabaseClient');
const { authenticateToken } = require('../middleware/auth-supabase');

// Get user signatures
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id; // Fix: use _id instead of id

    const { data: signatures, error } = await supabase
      .from('user_signatures')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching signatures:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch signatures'
      });
    }

    // Transform to camelCase for frontend while keeping snake_case for backward compatibility
    const transformedSignatures = (signatures || []).map(sig => ({
      id: sig.id,
      userId: sig.user_id,
      user_id: sig.user_id,
      signatureData: sig.signature_data,
      signature_data: sig.signature_data,
      name: sig.name,
      createdAt: sig.created_at,
      created_at: sig.created_at
    }));

    // Get default signature ID
    const { data: userSettings } = await supabase
      .from('user_settings')
      .select('default_signature_id')
      .eq('user_id', userId)
      .single();

    res.json({
      success: true,
      signatures: transformedSignatures,
      defaultSignatureId: userSettings?.default_signature_id || null
    });
  } catch (error) {
    console.error('Error in get signatures:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Save new signature
router.post('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id; // Fix: use _id instead of id
    const { signatureData, name, isDefault } = req.body;

    if (!signatureData) {
      return res.status(400).json({
        success: false,
        message: 'Signature data is required'
      });
    }

    // Insert signature
    const { data: signature, error } = await supabase
      .from('user_signatures')
      .insert({
        user_id: userId,
        signature_data: signatureData,
        name: name || 'Signature',
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving signature:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to save signature'
      });
    }

    // Transform for response (dual format for compatibility)
    const transformedSignature = {
      id: signature.id,
      userId: signature.user_id,
      user_id: signature.user_id,
      signatureData: signature.signature_data,
      signature_data: signature.signature_data,
      name: signature.name,
      createdAt: signature.created_at,
      created_at: signature.created_at
    };

    // Set as default if requested or if it's the first signature
    if (isDefault) {
      await supabase
        .from('user_settings')
        .upsert({
          user_id: userId,
          default_signature_id: signature.id,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });
    }

    res.json({
      success: true,
      signature: transformedSignature,
      message: 'Signature saved successfully'
    });
  } catch (error) {
    console.error('Error in save signature:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Delete signature
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id; // Fix: use _id instead of id
    const signatureId = req.params.id;

    // Check if signature belongs to user
    const { data: signature, error: fetchError } = await supabase
      .from('user_signatures')
      .select('*')
      .eq('id', signatureId)
      .eq('user_id', userId)
      .single();

    if (fetchError || !signature) {
      return res.status(404).json({
        success: false,
        message: 'Signature not found'
      });
    }

    // Delete signature
    const { error: deleteError } = await supabase
      .from('user_signatures')
      .delete()
      .eq('id', signatureId)
      .eq('user_id', userId);

    if (deleteError) {
      console.error('Error deleting signature:', deleteError);
      return res.status(500).json({
        success: false,
        message: 'Failed to delete signature'
      });
    }

    // If this was the default signature, clear the default
    await supabase
      .from('user_settings')
      .update({ default_signature_id: null })
      .eq('user_id', userId)
      .eq('default_signature_id', signatureId);

    res.json({
      success: true,
      message: 'Signature deleted successfully'
    });
  } catch (error) {
    console.error('Error in delete signature:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Set default signature
router.put('/:id/default', authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id; // Fix: use _id instead of id
    const signatureId = req.params.id;

    // Check if signature belongs to user
    const { data: signature, error: fetchError } = await supabase
      .from('user_signatures')
      .select('*')
      .eq('id', signatureId)
      .eq('user_id', userId)
      .single();

    if (fetchError || !signature) {
      return res.status(404).json({
        success: false,
        message: 'Signature not found'
      });
    }

    // Set as default
    const { error } = await supabase
      .from('user_settings')
      .upsert({
        user_id: userId,
        default_signature_id: signatureId,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' });

    if (error) {
      console.error('Error setting default signature:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to set default signature'
      });
    }

    res.json({
      success: true,
      message: 'Default signature updated successfully'
    });
  } catch (error) {
    console.error('Error in set default signature:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;