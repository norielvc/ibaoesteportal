const express = require('express');
const router = express.Router();
const { supabase } = require('../services/supabaseClient');

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
    
    // Custom ordering: Brgy Captain → Kagawad → SK Chairman → Staff (Secretary & Treasurer)
    const positionOrder = {
      'captain': 1,
      'kagawad': 2, 
      'sk_chairman': 3,
      'secretary': 4, // Group with staff
      'treasurer': 4, // Group with staff  
      'staff': 4
    };
    
    const sortedOfficials = officials?.sort((a, b) => {
      const orderA = positionOrder[a.position_type] || 999;
      const orderB = positionOrder[b.position_type] || 999;
      
      if (orderA !== orderB) {
        return orderA - orderB;
      }
      
      // Within same position type, sort by order_index for kagawads, or by name for others
      if (a.position_type === 'kagawad' && b.position_type === 'kagawad') {
        return (a.order_index || 0) - (b.order_index || 0);
      }
      
      // For staff positions, sort by order_index
      return (a.order_index || 0) - (b.order_index || 0);
    }) || [];
    
    res.json({
      success: true,
      data: sortedOfficials,
      count: sortedOfficials?.length || 0
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