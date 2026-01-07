const express = require('express');
const User = require('../models/User');
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();

/**
 * @route   GET /api/dashboard/stats
 * @desc    Get dashboard statistics
 * @access  Private (Admin only)
 */
router.get('/stats', requireAdmin, async (req, res) => {
  try {
    // Get user statistics
    const userStats = await User.getStats();
    
    // Get user growth data (last 12 months)
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
    
    const userGrowth = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: twelveMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);

    // Get login activity (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const loginActivity = await User.aggregate([
      {
        $match: {
          lastLogin: { $gte: sevenDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$lastLogin'
            }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id': 1 }
      }
    ]);

    // Get role distribution
    const roleDistribution = await User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get status distribution
    const statusDistribution = await User.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get recent users (last 10)
    const recentUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .select('firstName lastName email role status createdAt')
      .lean();

    // Get most active users (by login count)
    const activeUsers = await User.find()
      .sort({ loginCount: -1 })
      .limit(10)
      .select('firstName lastName email loginCount lastLogin')
      .lean();

    // Calculate growth percentage (current month vs previous month)
    const currentMonth = new Date();
    const previousMonth = new Date();
    previousMonth.setMonth(previousMonth.getMonth() - 1);
    
    const [currentMonthUsers, previousMonthUsers] = await Promise.all([
      User.countDocuments({
        createdAt: {
          $gte: new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1),
          $lt: new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)
        }
      }),
      User.countDocuments({
        createdAt: {
          $gte: new Date(previousMonth.getFullYear(), previousMonth.getMonth(), 1),
          $lt: new Date(previousMonth.getFullYear(), previousMonth.getMonth() + 1, 1)
        }
      })
    ]);

    const growthPercentage = previousMonthUsers > 0 
      ? ((currentMonthUsers - previousMonthUsers) / previousMonthUsers * 100).toFixed(1)
      : 0;

    res.status(200).json({
      success: true,
      data: {
        overview: {
          ...userStats,
          growthPercentage: parseFloat(growthPercentage),
          currentMonthUsers,
          previousMonthUsers
        },
        charts: {
          userGrowth: userGrowth.map(item => ({
            month: `${item._id.year}-${String(item._id.month).padStart(2, '0')}`,
            users: item.count
          })),
          loginActivity: loginActivity.map(item => ({
            date: item._id,
            logins: item.count
          })),
          roleDistribution: roleDistribution.map(item => ({
            role: item._id,
            count: item.count
          })),
          statusDistribution: statusDistribution.map(item => ({
            status: item._id,
            count: item.count
          }))
        },
        recentActivity: {
          recentUsers,
          activeUsers
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
    
    let startDate = new Date();
    
    switch (period) {
      case '7d':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(startDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(startDate.getDate() - 90);
        break;
      case '1y':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      default:
        startDate.setDate(startDate.getDate() - 30);
    }

    // User registrations over time
    const registrations = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: period === '1y' ? '%Y-%m' : '%Y-%m-%d',
              date: '$createdAt'
            }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id': 1 }
      }
    ]);

    // Login activity over time
    const logins = await User.aggregate([
      {
        $match: {
          lastLogin: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: period === '1y' ? '%Y-%m' : '%Y-%m-%d',
              date: '$lastLogin'
            }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id': 1 }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        period,
        registrations: registrations.map(item => ({
          date: item._id,
          count: item.count
        })),
        logins: logins.map(item => ({
          date: item._id,
          count: item.count
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