const express = require('express');
const router = express.Router();
const { supabase } = require('../services/supabaseClient');
const { authenticateToken } = require('../middleware/auth-supabase');

// GET /api/employees/by-qr - Get employee data by QR code
router.get('/by-qr', authenticateToken, async (req, res) => {
  try {
    const { qr } = req.query;

    if (!qr) {
      return res.status(400).json({
        success: false,
        error: 'QR parameter is required'
      });
    }

    console.log('🔍 Looking up employee by QR:', qr);

    // Try to find employee by QR code in different possible fields
    // This assumes you have an employees table or users table with QR data
    
    // Method 1: Look in users table if QR is stored there
    let { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .or(`employee_id.eq.${qr},qr_code.eq.${qr},id.eq.${qr}`)
      .single();

    if (userError && userError.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('❌ Error querying users:', userError);
    }

    if (userData) {
      console.log('✅ Found employee in users table:', userData.id);
      return res.json({
        success: true,
        employee: {
          id: userData.id,
          name: `${userData.first_name || ''} ${userData.last_name || ''}`.trim() || userData.email,
          email: userData.email,
          position: userData.role || 'Employee',
          employee_id: userData.employee_id || userData.id,
          qr_code: qr,
          status: userData.status || 'active'
        }
      });
    }

    // Method 2: Look in a dedicated employees table if it exists
    let { data: employeeData, error: employeeError } = await supabase
      .from('employees')
      .select('*')
      .or(`employee_id.eq.${qr},qr_code.eq.${qr},id.eq.${qr}`)
      .single();

    if (employeeError && employeeError.code !== 'PGRST116') {
      console.error('❌ Error querying employees:', employeeError);
    }

    if (employeeData) {
      console.log('✅ Found employee in employees table:', employeeData.id);
      return res.json({
        success: true,
        employee: {
          id: employeeData.id,
          name: employeeData.name || `${employeeData.first_name || ''} ${employeeData.last_name || ''}`.trim(),
          email: employeeData.email,
          position: employeeData.position || employeeData.role || 'Employee',
          employee_id: employeeData.employee_id || employeeData.id,
          qr_code: qr,
          status: employeeData.status || 'active',
          department: employeeData.department,
          phone: employeeData.phone
        }
      });
    }

    // Method 3: If no dedicated employee record, create a generic response
    console.log('⚠️ No employee record found, returning generic data');
    
    // Check if QR follows a pattern (e.g., EMP001, 12345, etc.)
    let employeeName = 'Unknown Employee';
    let position = 'Employee';
    
    if (qr.match(/^EMP\d+$/i)) {
      employeeName = `Employee ${qr.replace(/^EMP/i, '')}`;
    } else if (qr.match(/^\d+$/)) {
      employeeName = `Employee #${qr}`;
    } else {
      employeeName = qr.length > 20 ? `Employee (${qr.substring(0, 10)}...)` : `Employee (${qr})`;
    }

    res.json({
      success: true,
      employee: {
        id: qr,
        name: employeeName,
        email: null,
        position: position,
        employee_id: qr,
        qr_code: qr,
        status: 'unknown'
      }
    });

  } catch (error) {
    console.error('❌ Error in GET /employees/by-qr:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// POST /api/employees/register-qr - Register QR code for an employee
router.post('/register-qr', authenticateToken, async (req, res) => {
  try {
    const { employee_id, qr_code, name, position, email, department } = req.body;

    if (!employee_id || !qr_code) {
      return res.status(400).json({
        success: false,
        error: 'Employee ID and QR code are required'
      });
    }

    console.log('📝 Registering QR code for employee:', { employee_id, qr_code });

    // Try to update existing user record first
    const { data: existingUser, error: findError } = await supabase
      .from('users')
      .select('*')
      .eq('id', employee_id)
      .single();

    if (!findError && existingUser) {
      // Update existing user with QR code
      const { data, error } = await supabase
        .from('users')
        .update({
          qr_code: qr_code,
          employee_id: employee_id,
          updated_at: new Date().toISOString()
        })
        .eq('id', employee_id)
        .select()
        .single();

      if (error) {
        console.error('❌ Error updating user QR code:', error);
        return res.status(500).json({
          success: false,
          error: 'Failed to register QR code'
        });
      }

      console.log('✅ QR code registered for existing user:', data.id);
      return res.json({
        success: true,
        message: 'QR code registered successfully',
        employee: data
      });
    }

    // If no user found, try to create/update in employees table
    const { data, error } = await supabase
      .from('employees')
      .upsert([
        {
          employee_id,
          qr_code,
          name,
          position,
          email,
          department,
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ], {
        onConflict: 'employee_id'
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Error registering employee QR code:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to register QR code'
      });
    }

    console.log('✅ QR code registered for employee:', data.id);

    res.json({
      success: true,
      message: 'QR code registered successfully',
      employee: data
    });

  } catch (error) {
    console.error('❌ Error in POST /employees/register-qr:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// GET /api/employees/qr-list - Get all employees with QR codes
router.get('/qr-list', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    // Get from users table first
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, first_name, last_name, email, role, employee_id, qr_code, status')
      .not('qr_code', 'is', null)
      .range(offset, offset + limit - 1);

    if (usersError) {
      console.error('❌ Error fetching users with QR codes:', usersError);
    }

    // Get from employees table if it exists
    const { data: employees, error: employeesError } = await supabase
      .from('employees')
      .select('*')
      .not('qr_code', 'is', null)
      .range(offset, offset + limit - 1);

    if (employeesError && employeesError.code !== '42P01') { // 42P01 = table doesn't exist
      console.error('❌ Error fetching employees with QR codes:', employeesError);
    }

    // Combine and format results
    const allEmployees = [];

    if (users) {
      users.forEach(user => {
        allEmployees.push({
          id: user.id,
          name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email,
          email: user.email,
          position: user.role || 'Employee',
          employee_id: user.employee_id || user.id,
          qr_code: user.qr_code,
          status: user.status || 'active',
          source: 'users'
        });
      });
    }

    if (employees) {
      employees.forEach(emp => {
        allEmployees.push({
          id: emp.id,
          name: emp.name || `${emp.first_name || ''} ${emp.last_name || ''}`.trim(),
          email: emp.email,
          position: emp.position || emp.role || 'Employee',
          employee_id: emp.employee_id || emp.id,
          qr_code: emp.qr_code,
          status: emp.status || 'active',
          department: emp.department,
          phone: emp.phone,
          source: 'employees'
        });
      });
    }

    res.json({
      success: true,
      data: allEmployees,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: allEmployees.length
      }
    });

  } catch (error) {
    console.error('❌ Error in GET /employees/qr-list:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

module.exports = router;