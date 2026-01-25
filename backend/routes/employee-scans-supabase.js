const express = require('express');
const router = express.Router();
const { supabase } = require('../services/supabaseClient');
const authMiddleware = require('../middleware/auth-supabase');

// Create employee_scans table if it doesn't exist
const createEmployeeScansTable = async () => {
  try {
    const { error } = await supabase.rpc('create_employee_scans_table_if_not_exists');
    if (error && !error.message.includes('already exists')) {
      console.error('Error creating employee_scans table:', error);
    }
  } catch (err) {
    console.error('Error in createEmployeeScansTable:', err);
  }
};

// Initialize table on module load
createEmployeeScansTable();

// POST /api/employee-scans - Save a new employee scan
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { qr_data, scan_timestamp, scanner_type, device_info } = req.body;
    const user_id = req.user.id;

    console.log('📱 Saving employee scan:', {
      qr_data,
      scan_timestamp,
      scanner_type,
      user_id
    });

    // Validate required fields
    if (!qr_data || !scan_timestamp) {
      return res.status(400).json({
        success: false,
        error: 'QR data and timestamp are required'
      });
    }

    // Insert scan record
    const { data, error } = await supabase
      .from('employee_scans')
      .insert([
        {
          qr_data,
          scan_timestamp: new Date(scan_timestamp).toISOString(),
          scanner_type: scanner_type || 'mobile',
          device_info: device_info || {},
          scanned_by: user_id,
          created_at: new Date().toISOString()
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('❌ Error saving employee scan:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to save scan data'
      });
    }

    console.log('✅ Employee scan saved successfully:', data.id);

    res.json({
      success: true,
      message: 'Scan saved successfully',
      scan_id: data.id,
      data: data
    });

  } catch (error) {
    console.error('❌ Error in POST /employee-scans:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// GET /api/employee-scans - Get all employee scans with pagination
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 50, date, qr_data } = req.query;
    const offset = (page - 1) * limit;

    let query = supabase
      .from('employee_scans')
      .select(`
        *,
        users:scanned_by(id, email, first_name, last_name)
      `)
      .order('scan_timestamp', { ascending: false });

    // Filter by date if provided
    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);
      
      query = query
        .gte('scan_timestamp', startDate.toISOString())
        .lt('scan_timestamp', endDate.toISOString());
    }

    // Filter by QR data if provided
    if (qr_data) {
      query = query.ilike('qr_data', `%${qr_data}%`);
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('❌ Error fetching employee scans:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch scan data'
      });
    }

    res.json({
      success: true,
      data: data || [],
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit)
      }
    });

  } catch (error) {
    console.error('❌ Error in GET /employee-scans:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// GET /api/employee-scans/stats - Get scan statistics
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);

    // Get today's scans count
    const { count: todayCount, error: todayError } = await supabase
      .from('employee_scans')
      .select('*', { count: 'exact', head: true })
      .gte('scan_timestamp', startOfDay.toISOString())
      .lt('scan_timestamp', endOfDay.toISOString());

    if (todayError) {
      console.error('❌ Error getting today\'s count:', todayError);
    }

    // Get total scans count
    const { count: totalCount, error: totalError } = await supabase
      .from('employee_scans')
      .select('*', { count: 'exact', head: true });

    if (totalError) {
      console.error('❌ Error getting total count:', totalError);
    }

    // Get this week's scans
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const { count: weekCount, error: weekError } = await supabase
      .from('employee_scans')
      .select('*', { count: 'exact', head: true })
      .gte('scan_timestamp', startOfWeek.toISOString());

    if (weekError) {
      console.error('❌ Error getting week count:', weekError);
    }

    // Get unique employees scanned today
    const { data: uniqueToday, error: uniqueError } = await supabase
      .from('employee_scans')
      .select('qr_data')
      .gte('scan_timestamp', startOfDay.toISOString())
      .lt('scan_timestamp', endOfDay.toISOString());

    const uniqueEmployeesToday = uniqueToday ? 
      new Set(uniqueToday.map(scan => scan.qr_data)).size : 0;

    if (uniqueError) {
      console.error('❌ Error getting unique employees:', uniqueError);
    }

    res.json({
      success: true,
      stats: {
        today: todayCount || 0,
        total: totalCount || 0,
        week: weekCount || 0,
        unique_today: uniqueEmployeesToday
      }
    });

  } catch (error) {
    console.error('❌ Error in GET /employee-scans/stats:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// GET /api/employee-scans/recent - Get recent scans
router.get('/recent', authMiddleware, async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const { data, error } = await supabase
      .from('employee_scans')
      .select(`
        *,
        users:scanned_by(id, email, first_name, last_name)
      `)
      .order('scan_timestamp', { ascending: false })
      .limit(parseInt(limit));

    if (error) {
      console.error('❌ Error fetching recent scans:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch recent scans'
      });
    }

    res.json({
      success: true,
      data: data || []
    });

  } catch (error) {
    console.error('❌ Error in GET /employee-scans/recent:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// DELETE /api/employee-scans/:id - Delete a scan record
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('employee_scans')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('❌ Error deleting scan:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to delete scan'
      });
    }

    res.json({
      success: true,
      message: 'Scan deleted successfully'
    });

  } catch (error) {
    console.error('❌ Error in DELETE /employee-scans/:id:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

module.exports = router;