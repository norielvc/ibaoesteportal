const express = require('express');
const { supabase } = require('../services/supabaseClient');
const { requireAdmin } = require('../middleware/auth-supabase');

const router = express.Router();

/**
 * @route   GET /api/dashboard/stats
 * @desc    Get dashboard statistics
 * @access  Private (Admin only)
 */
router.get('/stats', requireAdmin, async (req, res) => {
  try {
    // Get all users
    const { data: allUsers, error: usersError } = await supabase
      .from('users')
      .select('*');

    if (usersError) {
      return res.status(400).json({
        success: false,
        message: 'Failed to fetch users'
      });
    }

    const users = allUsers || [];

    // Calculate statistics
    const totalUsers = users.length;
    const activeUsers = users.filter(u => u.status === 'active').length;
    const inactiveUsers = users.filter(u => u.status === 'inactive').length;
    const suspendedUsers = users.filter(u => u.status === 'suspended').length;
    const adminUsers = users.filter(u => u.role === 'admin').length;
    const regularUsers = users.filter(u => u.role === 'user').length;

    // Get current month users
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const currentMonthUsers = users.filter(u => {
      const createdDate = new Date(u.created_at);
      return createdDate >= currentMonthStart;
    }).length;

    // Get previous month users
    const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 1);
    const previousMonthUsers = users.filter(u => {
      const createdDate = new Date(u.created_at);
      return createdDate >= previousMonthStart && createdDate < previousMonthEnd;
    }).length;

    const growthPercentage = previousMonthUsers > 0 
      ? ((currentMonthUsers - previousMonthUsers) / previousMonthUsers * 100).toFixed(1)
      : 0;

    // Get recent users (last 10)
    const recentUsers = users
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 10)
      .map(u => ({
        _id: u.id,
        firstName: u.first_name,
        lastName: u.last_name,
        email: u.email,
        role: u.role,
        status: u.status,
        createdAt: u.created_at,
        lastLogin: u.last_login,
        loginCount: u.login_count
      }));

    // Get most active users (by login count)
    const activeUsersList = users
      .filter(u => u.login_count > 0)
      .sort((a, b) => b.login_count - a.login_count)
      .slice(0, 10)
      .map(u => ({
        _id: u.id,
        firstName: u.first_name,
        lastName: u.last_name,
        email: u.email,
        loginCount: u.login_count,
        lastLogin: u.last_login
      }));

    // Role distribution
    const roleDistribution = [
      { role: 'admin', count: adminUsers },
      { role: 'user', count: regularUsers }
    ];

    // Status distribution
    const statusDistribution = [
      { status: 'active', count: activeUsers },
      { status: 'inactive', count: inactiveUsers },
      { status: 'suspended', count: suspendedUsers }
    ];

    // User growth (last 12 months)
    const userGrowth = [];
    for (let i = 11; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
      const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 1);
      
      const monthUsers = users.filter(u => {
        const createdDate = new Date(u.created_at);
        return createdDate >= monthStart && createdDate < monthEnd;
      }).length;

      userGrowth.push({
        month: `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, '0')}`,
        users: monthUsers
      });
    }

    // Login activity (last 7 days)
    const loginActivity = [];
    for (let i = 6; i >= 0; i--) {
      const dayDate = new Date(now);
      dayDate.setDate(dayDate.getDate() - i);
      const dayStart = new Date(dayDate.getFullYear(), dayDate.getMonth(), dayDate.getDate());
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);

      const dayLogins = users.filter(u => {
        if (!u.last_login) return false;
        const loginDate = new Date(u.last_login);
        return loginDate >= dayStart && loginDate < dayEnd;
      }).length;

      loginActivity.push({
        date: dayStart.toISOString().split('T')[0],
        logins: dayLogins
      });
    }

    res.status(200).json({
      success: true,
      data: {
        overview: {
          totalUsers,
          activeUsers,
          inactiveUsers,
          suspendedUsers,
          adminUsers,
          regularUsers,
          growthPercentage: parseFloat(growthPercentage),
          currentMonthUsers,
          previousMonthUsers
        },
        charts: {
          userGrowth,
          loginActivity,
          roleDistribution,
          statusDistribution
        },
        recentActivity: {
          recentUsers,
          activeUsers: activeUsersList
        }
      }
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * @route   GET /api/dashboard/analytics
 * @desc    Get detailed analytics data
 * @access  Private (Admin only)
 */
router.get('/analytics', requireAdmin, async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    
    const { data: allUsers, error: usersError } = await supabase
      .from('users')
      .select('*');

    if (usersError) {
      return res.status(400).json({
        success: false,
        message: 'Failed to fetch users'
      });
    }

    const users = allUsers || [];
    let startDate = new Date();
    let dateFormat = 'day'; // 'day' or 'month'

    switch (period) {
      case '7d':
        startDate.setDate(startDate.getDate() - 7);
        dateFormat = 'day';
        break;
      case '30d':
        startDate.setDate(startDate.getDate() - 30);
        dateFormat = 'day';
        break;
      case '90d':
        startDate.setDate(startDate.getDate() - 90);
        dateFormat = 'day';
        break;
      case '1y':
        startDate.setFullYear(startDate.getFullYear() - 1);
        dateFormat = 'month';
        break;
      default:
        startDate.setDate(startDate.getDate() - 30);
        dateFormat = 'day';
    }

    // User registrations over time
    const registrations = {};
    users.forEach(u => {
      const createdDate = new Date(u.created_at);
      if (createdDate >= startDate) {
        const key = dateFormat === 'month'
          ? `${createdDate.getFullYear()}-${String(createdDate.getMonth() + 1).padStart(2, '0')}`
          : createdDate.toISOString().split('T')[0];
        registrations[key] = (registrations[key] || 0) + 1;
      }
    });

    // Login activity over time
    const logins = {};
    users.forEach(u => {
      if (u.last_login) {
        const loginDate = new Date(u.last_login);
        if (loginDate >= startDate) {
          const key = dateFormat === 'month'
            ? `${loginDate.getFullYear()}-${String(loginDate.getMonth() + 1).padStart(2, '0')}`
            : loginDate.toISOString().split('T')[0];
          logins[key] = (logins[key] || 0) + 1;
        }
      }
    });

    res.status(200).json({
      success: true,
      data: {
        period,
        registrations: Object.entries(registrations).map(([date, count]) => ({
          date,
          count
        })),
        logins: Object.entries(logins).map(([date, count]) => ({
          date,
          count
        }))
      }
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;
