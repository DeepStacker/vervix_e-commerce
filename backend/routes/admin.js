const express = require('express');
const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Category = require('../models/Category');
const Settings = require('../models/Settings');
const { auth, adminAuth } = require('../middleware/auth');
const router = express.Router();

// @route   GET /api/admin/dashboard
// @desc    Get admin dashboard overview
// @access  Private/Admin
router.get('/dashboard', [auth, adminAuth], async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    // Total counts
    const totalUsers = await User.countDocuments();
    const totalProducts = await Product.countDocuments();
    const totalOrders = await Order.countDocuments();
    const totalCategories = await Category.countDocuments();

    // This month stats
    const thisMonthUsers = await User.countDocuments({
      createdAt: { $gte: startOfMonth }
    });
    const thisMonthOrders = await Order.countDocuments({
      createdAt: { $gte: startOfMonth }
    });
    const thisMonthProducts = await Product.countDocuments({
      createdAt: { $gte: startOfMonth }
    });

    // Last month stats for comparison
    const lastMonthUsers = await User.countDocuments({
      createdAt: { $gte: startOfLastMonth, $lt: endOfLastMonth }
    });
    const lastMonthOrders = await Order.countDocuments({
      createdAt: { $gte: startOfLastMonth, $lt: endOfLastMonth }
    });

    // Revenue stats
    const revenueStats = await Order.aggregate([
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$totalAmount' },
          avgOrderValue: { $avg: '$totalAmount' }
        }
      }
    ]);

    const thisMonthRevenue = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startOfMonth },
          status: { $in: ['delivered', 'completed'] }
        }
      },
      {
        $group: {
          _id: null,
          revenue: { $sum: '$totalAmount' }
        }
      }
    ]);

    const lastMonthRevenue = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startOfLastMonth, $lt: endOfLastMonth },
          status: { $in: ['delivered', 'completed'] }
        }
      },
      {
        $group: {
          _id: null,
          revenue: { $sum: '$totalAmount' }
        }
      }
    ]);

    // Recent orders
    const recentOrders = await Order.find()
      .populate('user', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .limit(5);

    // Low stock products
    const lowStockProducts = await Product.find({
      stock: { $lt: 10 }
    })
    .sort({ stock: 1 })
    .limit(10);

    // Top selling products this month
    const topProducts = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startOfMonth }
        }
      },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.product',
          totalSold: { $sum: '$items.quantity' },
          totalRevenue: { $sum: { $multiply: ['$items.quantity', '$items.price'] } }
        }
      },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'product'
        }
      },
      { $unwind: '$product' },
      {
        $project: {
          productName: '$product.name',
          totalSold: 1,
          totalRevenue: 1
        }
      },
      { $sort: { totalSold: -1 } },
      { $limit: 5 }
    ]);

    // Order status distribution
    const orderStatusStats = await Order.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Daily sales for the last 7 days
    const dailySales = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          sales: { $sum: '$totalAmount' },
          orders: { $sum: 1 }
        }
      },
      { $sort: { '_id': 1 } }
    ]);

    // Calculate growth percentages
    const userGrowth = lastMonthUsers === 0 ? 0 : 
      ((thisMonthUsers - lastMonthUsers) / lastMonthUsers) * 100;
    const orderGrowth = lastMonthOrders === 0 ? 0 : 
      ((thisMonthOrders - lastMonthOrders) / lastMonthOrders) * 100;
    const revenueGrowth = !lastMonthRevenue[0] ? 0 : 
      ((thisMonthRevenue[0]?.revenue || 0) - (lastMonthRevenue[0]?.revenue || 0)) / 
      (lastMonthRevenue[0]?.revenue || 1) * 100;

    res.json({
      overview: {
        totalUsers,
        totalProducts,
        totalOrders,
        totalCategories,
        totalRevenue: revenueStats[0]?.totalRevenue || 0,
        avgOrderValue: revenueStats[0]?.avgOrderValue || 0
      },
      thisMonth: {
        users: thisMonthUsers,
        orders: thisMonthOrders,
        products: thisMonthProducts,
        revenue: thisMonthRevenue[0]?.revenue || 0
      },
      growth: {
        users: userGrowth,
        orders: orderGrowth,
        revenue: revenueGrowth
      },
      recentOrders,
      lowStockProducts,
      topProducts,
      orderStatusStats,
      dailySales
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/admin/analytics/sales
// @desc    Get sales analytics
// @access  Private/Admin
router.get('/analytics/sales', [auth, adminAuth], async (req, res) => {
  try {
    const { period = 'month', year, month } = req.query;
    let matchStage = {};
    let groupStage = {};

    const currentDate = new Date();
    const currentYear = year ? parseInt(year) : currentDate.getFullYear();
    const currentMonth = month ? parseInt(month) : currentDate.getMonth() + 1;

    if (period === 'year') {
      matchStage = {
        createdAt: {
          $gte: new Date(currentYear, 0, 1),
          $lt: new Date(currentYear + 1, 0, 1)
        }
      };
      groupStage = {
        _id: { month: { $month: '$createdAt' } },
        sales: { $sum: '$totalAmount' },
        orders: { $sum: 1 }
      };
    } else if (period === 'month') {
      matchStage = {
        createdAt: {
          $gte: new Date(currentYear, currentMonth - 1, 1),
          $lt: new Date(currentYear, currentMonth, 1)
        }
      };
      groupStage = {
        _id: { day: { $dayOfMonth: '$createdAt' } },
        sales: { $sum: '$totalAmount' },
        orders: { $sum: 1 }
      };
    } else if (period === 'week') {
      const startOfWeek = new Date();
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
      startOfWeek.setHours(0, 0, 0, 0);
      
      matchStage = {
        createdAt: { $gte: startOfWeek }
      };
      groupStage = {
        _id: { dayOfWeek: { $dayOfWeek: '$createdAt' } },
        sales: { $sum: '$totalAmount' },
        orders: { $sum: 1 }
      };
    }

    const salesData = await Order.aggregate([
      { $match: matchStage },
      { $group: groupStage },
      { $sort: { '_id': 1 } }
    ]);

    // Product performance
    const productPerformance = await Order.aggregate([
      { $match: matchStage },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.product',
          totalSold: { $sum: '$items.quantity' },
          totalRevenue: { $sum: { $multiply: ['$items.quantity', '$items.price'] } }
        }
      },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'product'
        }
      },
      { $unwind: '$product' },
      {
        $project: {
          productName: '$product.name',
          category: '$product.category',
          totalSold: 1,
          totalRevenue: 1
        }
      },
      { $sort: { totalRevenue: -1 } },
      { $limit: 10 }
    ]);

    // Category performance
    const categoryPerformance = await Order.aggregate([
      { $match: matchStage },
      { $unwind: '$items' },
      {
        $lookup: {
          from: 'products',
          localField: 'items.product',
          foreignField: '_id',
          as: 'product'
        }
      },
      { $unwind: '$product' },
      {
        $lookup: {
          from: 'categories',
          localField: 'product.category',
          foreignField: '_id',
          as: 'category'
        }
      },
      { $unwind: '$category' },
      {
        $group: {
          _id: '$category._id',
          categoryName: { $first: '$category.name' },
          totalSold: { $sum: '$items.quantity' },
          totalRevenue: { $sum: { $multiply: ['$items.quantity', '$items.price'] } }
        }
      },
      { $sort: { totalRevenue: -1 } }
    ]);

    res.json({
      period,
      salesData,
      productPerformance,
      categoryPerformance
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/admin/analytics/users
// @desc    Get user analytics
// @access  Private/Admin
router.get('/analytics/users', [auth, adminAuth], async (req, res) => {
  try {
    const { period = 'month' } = req.query;
    
    // User registration trend
    const userTrend = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: new Date(Date.now() - 12 * 30 * 24 * 60 * 60 * 1000) }
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
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // User demographics
    const demographics = await User.aggregate([
      {
        $group: {
          _id: '$gender',
          count: { $sum: 1 }
        }
      }
    ]);

    // User activity (orders per user)
    const userActivity = await Order.aggregate([
      {
        $group: {
          _id: '$user',
          orderCount: { $sum: 1 },
          totalSpent: { $sum: '$totalAmount' }
        }
      },
      {
        $group: {
          _id: {
            $switch: {
              branches: [
                { case: { $eq: ['$orderCount', 1] }, then: 'One-time' },
                { case: { $and: [{ $gte: ['$orderCount', 2] }, { $lt: ['$orderCount', 5] }] }, then: 'Regular' },
                { case: { $gte: ['$orderCount', 5] }, then: 'Frequent' }
              ],
              default: 'Unknown'
            }
          },
          count: { $sum: 1 }
        }
      }
    ]);

    // Top customers
    const topCustomers = await Order.aggregate([
      {
        $group: {
          _id: '$user',
          totalOrders: { $sum: 1 },
          totalSpent: { $sum: '$totalAmount' }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      {
        $project: {
          userName: { $concat: ['$user.firstName', ' ', '$user.lastName'] },
          email: '$user.email',
          totalOrders: 1,
          totalSpent: 1
        }
      },
      { $sort: { totalSpent: -1 } },
      { $limit: 10 }
    ]);

    res.json({
      userTrend,
      demographics,
      userActivity,
      topCustomers
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/admin/analytics/products
// @desc    Get product analytics
// @access  Private/Admin
router.get('/analytics/products', [auth, adminAuth], async (req, res) => {
  try {
    const totalProducts = await Product.countDocuments();
    const activeProducts = await Product.countDocuments({ isActive: true });
    const outOfStockProducts = await Product.countDocuments({ stock: 0 });
    const lowStockProducts = await Product.countDocuments({ stock: { $lt: 10, $gt: 0 } });

    // Product performance
    const productPerformance = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
        }
      },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.product',
          totalSold: { $sum: '$items.quantity' },
          totalRevenue: { $sum: { $multiply: ['$items.quantity', '$items.price'] } }
        }
      },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'product'
        }
      },
      { $unwind: '$product' },
      {
        $project: {
          productName: '$product.name',
          totalSold: 1,
          totalRevenue: 1,
          currentStock: '$product.stock'
        }
      },
      { $sort: { totalSold: -1 } },
      { $limit: 20 }
    ]);

    // Category distribution
    const categoryDistribution = await Product.aggregate([
      {
        $lookup: {
          from: 'categories',
          localField: 'category',
          foreignField: '_id',
          as: 'category'
        }
      },
      { $unwind: '$category' },
      {
        $group: {
          _id: '$category._id',
          categoryName: { $first: '$category.name' },
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Price range distribution
    const priceDistribution = await Product.aggregate([
      {
        $group: {
          _id: {
            $switch: {
              branches: [
                { case: { $lt: ['$price', 25] }, then: 'Under $25' },
                { case: { $and: [{ $gte: ['$price', 25] }, { $lt: ['$price', 50] }] }, then: '$25-$50' },
                { case: { $and: [{ $gte: ['$price', 50] }, { $lt: ['$price', 100] }] }, then: '$50-$100' },
                { case: { $and: [{ $gte: ['$price', 100] }, { $lt: ['$price', 200] }] }, then: '$100-$200' },
                { case: { $gte: ['$price', 200] }, then: 'Over $200' }
              ],
              default: 'Unknown'
            }
          },
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      overview: {
        totalProducts,
        activeProducts,
        outOfStockProducts,
        lowStockProducts
      },
      productPerformance,
      categoryDistribution,
      priceDistribution
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/admin/system/info
// @desc    Get system information
// @access  Private/Admin
router.get('/system/info', [auth, adminAuth], async (req, res) => {
  try {
    const systemInfo = {
      nodeVersion: process.version,
      platform: process.platform,
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      cpuUsage: process.cpuUsage(),
      environment: process.env.NODE_ENV || 'development'
    };

    // Database stats
    const dbStats = {
      totalUsers: await User.countDocuments(),
      totalProducts: await Product.countDocuments(),
      totalOrders: await Order.countDocuments(),
      totalCategories: await Category.countDocuments()
    };

    res.json({
      system: systemInfo,
      database: dbStats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/admin/logs
// @desc    Get application logs (simplified)
// @access  Private/Admin
router.get('/logs', [auth, adminAuth], async (req, res) => {
  try {
    const { level = 'all', limit = 100 } = req.query;
    
    // In a real application, you would read from log files
    // For now, we'll return recent orders and user activities as "logs"
    const recentOrders = await Order.find()
      .populate('user', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit) / 2);

    const recentUsers = await User.find()
      .select('firstName lastName email createdAt')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit) / 2);

    const logs = [
      ...recentOrders.map(order => ({
        id: order._id,
        type: 'order',
        level: 'info',
        message: `Order ${order.orderNumber} created by ${order.user.firstName} ${order.user.lastName}`,
        timestamp: order.createdAt,
        data: { orderId: order._id, userId: order.user._id }
      })),
      ...recentUsers.map(user => ({
        id: user._id,
        type: 'user',
        level: 'info',
        message: `New user registered: ${user.firstName} ${user.lastName}`,
        timestamp: user.createdAt,
        data: { userId: user._id }
      }))
    ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    res.json({
      logs: logs.slice(0, parseInt(limit)),
      total: logs.length,
      level,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/admin/backup
// @desc    Create system backup (placeholder)
// @access  Private/Admin
router.post('/backup', [auth, adminAuth], async (req, res) => {
  try {
    // This is a placeholder for backup functionality
    // In a real application, you would implement actual backup logic
    const backupInfo = {
      id: new Date().getTime(),
      timestamp: new Date().toISOString(),
      type: 'full',
      size: '0 MB', // Placeholder
      status: 'completed'
    };

    res.json({
      message: 'Backup created successfully',
      backup: backupInfo
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/admin/settings/:category
// @desc    Get admin settings
// @access  Private/Admin
router.get('/settings/:category', [auth, adminAuth], async (req, res) => {
  try {
    const category = req.params.category;
    const settings = await Settings.getByCategory(category);
    if (settings) {
      res.json({ settings, message: 'Settings retrieved successfully' });
    } else {
      res.status(404).json({ message: 'Settings not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/admin/settings/:category
// @desc    Update admin settings
// @access  Private/Admin
router.put('/settings/:category', [auth, adminAuth], async (req, res) => {
  try {
    const category = req.params.category;
    const settingsData = req.body;
    const updatedBy = req.user._id;
    const updatedSettings = await Settings.updateByCategory(category, settingsData, updatedBy);
    res.json({ settings: updatedSettings.settings, message: 'Settings updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/admin/settings
// @desc    Update admin settings
// @access  Private/Admin
router.put('/settings', [auth, adminAuth], async (req, res) => {
  try {
    const updatedSettings = req.body;
    
    // In a real application, you would save these to a database
    // For now, we'll just return the updated settings
    res.json({
      message: 'Settings updated successfully',
      settings: updatedSettings
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/admin/notifications
// @desc    Get admin notifications
// @access  Private/Admin
router.get('/notifications', [auth, adminAuth], async (req, res) => {
  try {
    // In a real app, fetch from notifications collection
    const notifications = [
      {
        id: 1,
        type: 'order',
        title: 'New Order',
        message: 'You have received a new order',
        timestamp: new Date(),
        read: false
      },
      {
        id: 2,
        type: 'stock',
        title: 'Low Stock Alert',
        message: 'Some products are running low on stock',
        timestamp: new Date(Date.now() - 3600000),
        read: false
      }
    ];
    
    res.json({ notifications });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/admin/change-password
// @desc    Change admin password
// @access  Private/Admin
router.put('/change-password', [auth, adminAuth], async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user._id;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current password and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/admin/notifications
// @desc    Send notification to users
// @access  Private/Admin
router.post('/notifications', [auth, adminAuth], async (req, res) => {
  try {
    const { type, title, message, userIds, sendToAll } = req.body;

    if (!title || !message) {
      return res.status(400).json({ message: 'Title and message are required' });
    }

    let targetUsers = [];
    if (sendToAll) {
      targetUsers = await User.find({ isActive: true }).select('_id email firstName lastName');
    } else if (userIds && userIds.length > 0) {
      targetUsers = await User.find({ _id: { $in: userIds }, isActive: true }).select('_id email firstName lastName');
    } else {
      return res.status(400).json({ message: 'No users specified for notification' });
    }

    // In a real application, you would send actual notifications
    // For now, we'll just simulate the process
    const notificationResult = {
      id: new Date().getTime(),
      type,
      title,
      message,
      targetUsers: targetUsers.length,
      sentAt: new Date().toISOString(),
      status: 'sent'
    };

    res.json({
      message: 'Notification sent successfully',
      notification: notificationResult
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/admin/reports/export
// @desc    Export data reports
// @access  Private/Admin
router.get('/reports/export', [auth, adminAuth], async (req, res) => {
  try {
    const { type = 'orders', format = 'json', startDate, endDate } = req.query;

    let query = {};
    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    let data = [];
    switch (type) {
      case 'orders':
        data = await Order.find(query)
          .populate('user', 'firstName lastName email')
          .populate('items.product', 'name price')
          .sort({ createdAt: -1 });
        break;
      case 'users':
        data = await User.find(query)
          .select('-password')
          .sort({ createdAt: -1 });
        break;
      case 'products':
        data = await Product.find(query)
          .populate('category', 'name')
          .sort({ createdAt: -1 });
        break;
      default:
        return res.status(400).json({ message: 'Invalid report type' });
    }

    if (format === 'csv') {
      // In a real application, you would convert to CSV format
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=${type}-report.csv`);
      res.send('CSV export not implemented yet');
    } else {
      res.json({
        type,
        count: data.length,
        data,
        exportedAt: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
