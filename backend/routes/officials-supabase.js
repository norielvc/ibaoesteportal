const express = require('express');
const router = express.Router();
const supabase = require('../services/supabaseClient');

// Get all barangay officials
router.get('/', async (req, res) => {
  try {
    console.log('Fetching barangay officials...');
    
    const { data: officials, error } = await supabase
      .from('barangay_officials')
      .select('*')
      .eq('is_active', true)
      .order('order_index', { ascending: true });

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch officials',
        error: error.message
      });
    }

    console.log(`Found ${officials?.length || 0} officials`);
    
    res.json({
      success: true,
      data: officials || [],
      count: officials?.length || 0
    });

  } catch (error) {
    console.error('Error fetching officials:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Get officials by position type
router.get('/by-type/:type', async (req, res) => {
  try {
    const { type } = req.params;
    console.log(`Fetching officials by type: ${type}`);
    
    const { data: officials, error } = await supabase
      .from('barangay_officials')
      .select('*')
      .eq('position_type', type)
      .eq('is_active', true)
      .order('order_index', { ascending: true });

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch officials by type',
        error: error.message
      });
    }

    res.json({
      success: true,
      data: officials || [],
      count: officials?.length || 0
    });

  } catch (error) {
    console.error('Error fetching officials by type:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Get single official by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`Fetching official with ID: ${id}`);
    
    const { data: official, error } = await supabase
      .from('barangay_officials')
      .select('*')
      .eq('id', id)
      .eq('is_active', true)
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return res.status(404).json({
        success: false,
        message: 'Official not found',
        error: error.message
      });
    }

    res.json({
      success: true,
      data: official
    });

  } catch (error) {
    console.error('Error fetching official:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

module.exports = router;