const express = require('express');
const router = express.Router();
const { supabase } = require('../services/supabaseClient');
const { authenticateToken } = require('../middleware/auth-supabase');

// Create qr_scans table if it doesn't exist
const createQRScansTable = async () => {
  try {
    // Try to query the table first to see if it exists
    const { data, error } = await supabase
      .from('qr_scans')
      .select('count(*)')
      .limit(1);

    if (error && error.code === 'PGRST116') {
      console.log('📝 QR scans table does not exist, it needs to be created in Supabase dashboard');
      console.log('ℹ️  Please create the table manually or the API will not work');
    } else {
      console.log('✅ QR scans table exists and is ready');
    }
  } catch (err) {
    console.error('Error checking QR scans table:', err);
  }
};

// Initialize table on module load
createQRScansTable();

// GET /api/qr-scans/stats - Get scan statistics (must come before general GET route)
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);

    // Get today's scans count
    const { count: todayCount, error: todayError } = await supabase
      .from('qr_scans')
      .select('*', { count: 'exact', head: true })
      .gte('scan_timestamp', startOfDay.toISOString())
      .lt('scan_timestamp', endOfDay.toISOString());

    if (todayError) {
      console.error('❌ Error getting today\'s count:', todayError);
    }

    // Get total scans count
    const { count: totalCount, error: totalError } = await supabase
      .from('qr_scans')
      .select('*', { count: 'exact', head: true });

    if (totalError) {
      console.error('❌ Error getting total count:', totalError);
    }

    res.json({
      success: true,
      stats: {
        today: todayCount || 0,
        total: totalCount || 0
      }
    });

  } catch (error) {
    console.error('❌ Error in GET /qr-scans/stats:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// GET /api/qr-scans/recent - Get recent scans
router.get('/recent', authenticateToken, async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const { data, error } = await supabase
      .from('qr_scans')
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
    console.error('❌ Error in GET /qr-scans/recent:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// POST /api/qr-scans - Save a new QR scan
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { qr_data, scan_timestamp, scanner_type, device_info } = req.body;
    const user_id = req.user._id;

    console.log('📱 Saving QR scan:', {
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

    // Check if this QR code has already been scanned
    const { data: existingScan, error: checkError } = await supabase
      .from('qr_scans')
      .select(`
        *,
        users:scanned_by(id, email, first_name, last_name)
      `)
      .eq('qr_data', qr_data)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('❌ Error checking for duplicate:', checkError);
    }

    // If QR code already exists, return duplicate warning
    if (existingScan) {
      console.log('⚠️ Duplicate QR code detected:', qr_data);
      return res.status(409).json({
        success: false,
        error: 'QR code already scanned',
        isDuplicate: true,
        existingScan: {
          id: existingScan.id,
          scan_timestamp: existingScan.scan_timestamp,
          scanner_type: existingScan.scanner_type,
          scanned_by: existingScan.users ?
            `${existingScan.users.first_name} ${existingScan.users.last_name}` :
            'Unknown User',
          scanned_by_email: existingScan.users?.email || 'Unknown'
        },
        message: `This QR code was already scanned on ${new Date(existingScan.scan_timestamp).toLocaleString()} by ${existingScan.users ? `${existingScan.users.first_name} ${existingScan.users.last_name}` : 'Unknown User'}`
      });
    }

    // Insert scan record (only if not duplicate)
    const { data, error } = await supabase
      .from('qr_scans')
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
      console.error('❌ Error saving QR scan:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to save scan data'
      });
    }

    console.log('✅ QR scan saved successfully:', data.id);

    res.json({
      success: true,
      message: 'Scan saved successfully',
      scan_id: data.id,
      data: data,
      isDuplicate: false
    });

  } catch (error) {
    console.error('❌ Error in POST /qr-scans:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// GET /api/qr-scans - Get all QR scans with pagination
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 20, date, qr_data } = req.query;
    const offset = (page - 1) * limit;

    let query = supabase
      .from('qr_scans')
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
    query = query.range(offset, offset + parseInt(limit) - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('❌ Error fetching QR scans:', error);
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
        pages: Math.ceil((count || 0) / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('❌ Error in GET /qr-scans:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// GET /api/qr-scans/duplicates - Get duplicate QR scan attempts
router.get('/duplicates', authenticateToken, async (req, res) => {
  try {
    // Get all scans and find duplicates in JavaScript
    const { data: allScans, error: allScansError } = await supabase
      .from('qr_scans')
      .select(`
        *,
        users:scanned_by(id, email, first_name, last_name)
      `)
      .order('scan_timestamp', { ascending: false });

    if (allScansError) {
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch duplicate data'
      });
    }

    // Group by QR data and find duplicates
    const qrGroups = {};
    allScans.forEach(scan => {
      if (!qrGroups[scan.qr_data]) {
        qrGroups[scan.qr_data] = [];
      }
      qrGroups[scan.qr_data].push(scan);
    });

    // Filter groups with more than one scan (duplicates)
    const duplicates = [];
    Object.keys(qrGroups).forEach(qrData => {
      if (qrGroups[qrData].length > 1) {
        // Sort by timestamp to get first and subsequent scans
        const sortedScans = qrGroups[qrData].sort((a, b) =>
          new Date(a.scan_timestamp) - new Date(b.scan_timestamp)
        );

        const firstScan = sortedScans[0];
        const duplicateAttempts = sortedScans.slice(1);

        duplicateAttempts.forEach(attempt => {
          duplicates.push({
            qr_data: qrData,
            original_scan: {
              id: firstScan.id,
              scan_timestamp: firstScan.scan_timestamp,
              scanned_by: firstScan.users ?
                `${firstScan.users.first_name} ${firstScan.users.last_name}` :
                'Unknown User'
            },
            duplicate_attempt: {
              id: attempt.id,
              scan_timestamp: attempt.scan_timestamp,
              scanned_by: attempt.users ?
                `${attempt.users.first_name} ${attempt.users.last_name}` :
                'Unknown User',
              scanner_type: attempt.scanner_type
            },
            time_difference: new Date(attempt.scan_timestamp) - new Date(firstScan.scan_timestamp)
          });
        });
      }
    });

    res.json({
      success: true,
      data: duplicates
    });

  } catch (error) {
    console.error('❌ Error in GET /qr-scans/duplicates:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// DELETE /api/qr-scans - Clear all scan history
router.delete('/', authenticateToken, async (req, res) => {
  try {
    // Only allow admins to clear history (optional but recommended)
    // if (req.user.role !== 'admin') {
    //   return res.status(403).json({ success: false, error: 'Unauthorized' });
    // }

    console.log('🗑️ Clearing all QR scan history...');

    const { error } = await supabase
      .from('qr_scans')
      .delete()
      .neq('id', 0); // Delete all rows where id is not 0 (effectively all rows)

    if (error) {
      console.error('❌ Error clearing QR scans:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to clear scan history'
      });
    }

    console.log('✅ QR scan history cleared successfully');

    res.json({
      success: true,
      message: 'All scan history cleared successfully'
    });

  } catch (error) {
    console.error('❌ Error in DELETE /qr-scans:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

module.exports = router;