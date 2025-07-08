const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Order = require('../models/Order');
const { auth, adminAuth } = require('../middleware/auth');
const { uploadUser } = require('../middleware/upload');
const { sendEmail } = require('../utils/email');
const router = express.Router();

// @route   GET /api/users/profile
// @desc    Get user profile
// @access  Private
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', auth, async (req, res) => {
  try {
    const { firstName, lastName, email, phone, dateOfBirth, gender } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if email is being changed and if it's already taken
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email, _id: { $ne: req.user.id } });
      if (existingUser) {
        return res.status(400).json({ message: 'Email already in use' });
      }
    }

    // Update user fields
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (email) user.email = email;
    if (phone) user.phone = phone;
    if (dateOfBirth) user.dateOfBirth = dateOfBirth;
    if (gender) user.gender = gender;

    user.updatedAt = Date.now();
    await user.save();

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        dateOfBirth: user.dateOfBirth,
        gender: user.gender,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/users/profile/avatar
// @desc    Update user avatar
// @access  Private
router.put('/profile/avatar', [auth, uploadUser.single('avatar')], async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'No image file provided' });
    }

    user.avatar = req.file.path;
    user.updatedAt = Date.now();
    await user.save();

    res.json({
      message: 'Avatar updated successfully',
      avatar: user.avatar
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/users/change-password
// @desc    Change user password
// @access  Private
router.put('/change-password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current password and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters' });
    }
    // console.log(req.user.id); 
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    user.updatedAt = Date.now();
    await user.save();

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/users/addresses
// @desc    Add new address
// @access  Private
router.post('/addresses', auth, async (req, res) => {
  try {
    const { 
      type, 
      firstName, 
      lastName, 
      company, 
      address1, 
      address2, 
      city, 
      state, 
      zipCode, 
      country, 
      phone, 
      isDefault 
    } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const newAddress = {
      type,
      firstName,
      lastName,
      company,
      address1,
      address2,
      city,
      state,
      zipCode,
      country,
      phone,
      isDefault
    };

    // If this is set as default, remove default from other addresses
    if (isDefault) {
      user.addresses.forEach(addr => addr.isDefault = false);
    }

    user.addresses.push(newAddress);
    user.updatedAt = Date.now();
    await user.save();

    res.status(201).json({
      message: 'Address added successfully',
      address: user.addresses[user.addresses.length - 1]
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/users/addresses/:addressId
// @desc    Update address
// @access  Private
router.put('/addresses/:addressId', auth, async (req, res) => {
  try {
    const { addressId } = req.params;
    const updateData = req.body;

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const address = user.addresses.id(addressId);
    if (!address) {
      return res.status(404).json({ message: 'Address not found' });
    }

    // If setting as default, remove default from other addresses
    if (updateData.isDefault) {
      user.addresses.forEach(addr => {
        if (addr._id.toString() !== addressId) {
          addr.isDefault = false;
        }
      });
    }

    Object.keys(updateData).forEach(key => {
      address[key] = updateData[key];
    });

    user.updatedAt = Date.now();
    await user.save();

    res.json({
      message: 'Address updated successfully',
      address
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/users/addresses/:addressId
// @desc    Delete address
// @access  Private
router.delete('/addresses/:addressId', auth, async (req, res) => {
  try {
    const { addressId } = req.params;

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const address = user.addresses.id(addressId);
    if (!address) {
      return res.status(404).json({ message: 'Address not found' });
    }

    user.addresses.pull(addressId);
    user.updatedAt = Date.now();
    await user.save();

    res.json({ message: 'Address deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/users/addresses
// @desc    Get all user addresses
// @access  Private
router.get('/addresses', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('addresses');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user.addresses);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/users/wishlist
// @desc    Get user wishlist
// @access  Private
router.get('/wishlist', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('wishlist');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user.wishlist);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/users/wishlist/:productId
// @desc    Add product to wishlist
// @access  Private
router.post('/wishlist/:productId', auth, async (req, res) => {
  try {
    const { productId } = req.params;

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if product already in wishlist
    if (user.wishlist.includes(productId)) {
      return res.status(400).json({ message: 'Product already in wishlist' });
    }

    user.wishlist.push(productId);
    user.updatedAt = Date.now();
    await user.save();

    res.json({ message: 'Product added to wishlist' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/users/wishlist/:productId
// @desc    Remove product from wishlist
// @access  Private
router.delete('/wishlist/:productId', auth, async (req, res) => {
  try {
    const { productId } = req.params;
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.wishlist.pull(productId);
    await user.save();

    res.json({ message: 'Product removed from wishlist' });
  } catch (error) {
    console.error('Remove from wishlist error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/users/wishlist
// @desc    Clear entire wishlist
// @access  Private
router.delete('/wishlist', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.wishlist = [];
    await user.save();

    res.json({ 
      message: 'Wishlist cleared successfully',
      wishlistCount: 0
    });
  } catch (error) {
    console.error('Clear wishlist error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/users/wishlist/move-to-cart
// @desc    Move items from wishlist to cart
// @access  Private
router.post('/wishlist/move-to-cart', auth, async (req, res) => {
  try {
    const { productIds, moveAll = false } = req.body;
    
    const user = await User.findById(req.user.id)
      .populate('wishlist', 'name price images inventory variants status isActive');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    let itemsToMove = [];
    
    if (moveAll) {
      itemsToMove = user.wishlist;
    } else if (productIds && Array.isArray(productIds)) {
      itemsToMove = user.wishlist.filter(product => 
        productIds.includes(product._id.toString())
      );
    } else {
      return res.status(400).json({ 
        message: 'Either provide productIds array or set moveAll to true'
      });
    }

    if (itemsToMove.length === 0) {
      return res.status(400).json({ 
        message: 'No items found to move to cart'
      });
    }

    const addedToCart = [];
    const unavailableItems = [];
    const errors = [];

    for (const product of itemsToMove) {
      try {
        // Check if product is still active and available
        if (!product.isActive || product.status !== 'active') {
          unavailableItems.push({
            productId: product._id,
            name: product.name,
            reason: 'Product is no longer available'
          });
          continue;
        }

        // Check stock
        const availableStock = product.inventory?.quantity || 0;
        if (availableStock < 1) {
          unavailableItems.push({
            productId: product._id,
            name: product.name,
            reason: 'Product is out of stock'
          });
          continue;
        }

        // Check if item already exists in cart
        const existingCartItemIndex = user.cart.findIndex(
          cartItem => cartItem.product.toString() === product._id.toString()
        );

        if (existingCartItemIndex >= 0) {
          // Update quantity if item exists in cart
          user.cart[existingCartItemIndex].quantity += 1;
          user.cart[existingCartItemIndex].addedAt = new Date();
        } else {
          // Add new item to cart
          user.cart.push({
            product: product._id,
            quantity: 1,
            addedAt: new Date()
          });
        }

        // Remove from wishlist
        user.wishlist.pull(product._id);
        
        addedToCart.push({
          productId: product._id,
          name: product.name,
          price: product.price,
          image: product.images[0]?.url
        });

      } catch (error) {
        errors.push({
          productId: product._id,
          name: product.name,
          error: error.message
        });
      }
    }

    await user.save();

    res.json({
      success: true,
      message: `Successfully moved ${addedToCart.length} items to cart`,
      data: {
        addedToCart,
        unavailableItems,
        errors,
        remainingWishlistCount: user.wishlist.length
      }
    });

  } catch (error) {
    console.error('Move to cart error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/users/wishlist/count
// @desc    Get wishlist item count
// @access  Private
router.get('/wishlist/count', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('wishlist');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      count: user.wishlist.length
    });
  } catch (error) {
    console.error('Get wishlist count error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/users/order-history
// @desc    Get user order history
// @access  Private
router.get('/order-history', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const orders = await Order.find({ user: req.user.id })
      .populate('items.product', 'name images price')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalOrders = await Order.countDocuments({ user: req.user.id });

    res.json({
      orders,
      currentPage: page,
      totalPages: Math.ceil(totalOrders / limit),
      totalOrders
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/users/preferences
// @desc    Update user preferences
// @access  Private
router.put('/preferences', auth, async (req, res) => {
  try {
    const { 
      newsletter, 
      emailNotifications, 
      smsNotifications, 
      language, 
      currency, 
      timezone 
    } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.preferences) {
      user.preferences = {};
    }

    if (newsletter !== undefined) user.preferences.newsletter = newsletter;
    if (emailNotifications !== undefined) user.preferences.emailNotifications = emailNotifications;
    if (smsNotifications !== undefined) user.preferences.smsNotifications = smsNotifications;
    if (language) user.preferences.language = language;
    if (currency) user.preferences.currency = currency;
    if (timezone) user.preferences.timezone = timezone;

    user.updatedAt = Date.now();
    await user.save();

    res.json({
      message: 'Preferences updated successfully',
      preferences: user.preferences
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/users/preferences
// @desc    Get user preferences
// @access  Private
router.get('/preferences', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('preferences');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user.preferences || {});
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/users/account
// @desc    Delete user account
// @access  Private
router.delete('/account', auth, async (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ message: 'Password is required to delete account' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid password' });
    }

    // Check for pending orders
    const pendingOrders = await Order.find({ 
      user: req.user.id, 
      status: { $in: ['pending', 'processing', 'shipped'] } 
    });

    if (pendingOrders.length > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete account with pending orders. Please contact support.' 
      });
    }

    // Instead of deleting, deactivate the account
    user.isActive = false;
    user.email = `deleted_${Date.now()}_${user.email}`;
    user.updatedAt = Date.now();
    await user.save();

    res.json({ message: 'Account deactivated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin routes for user management
// @route   GET /api/users/admin/all
// @desc    Get all users (admin only)
// @access  Private/Admin
router.get('/admin/all', [auth, adminAuth], async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';
    const role = req.query.role || '';
    const status = req.query.status || '';

    // Build query
    let query = {};
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    if (role) query.role = role;
    if (status === 'active') query.isActive = true;
    if (status === 'inactive') query.isActive = false;

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalUsers = await User.countDocuments(query);

    res.json({
      users,
      currentPage: page,
      totalPages: Math.ceil(totalUsers / limit),
      totalUsers
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/users/admin/:userId
// @desc    Get user details (admin only)
// @access  Private/Admin
router.get('/admin/:userId', [auth, adminAuth], async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get user's order statistics
    const orderStats = await Order.aggregate([
      { $match: { user: user._id } },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalSpent: { $sum: '$totalAmount' },
          avgOrderValue: { $avg: '$totalAmount' }
        }
      }
    ]);

    res.json({
      user,
      orderStats: orderStats[0] || { totalOrders: 0, totalSpent: 0, avgOrderValue: 0 }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/users/admin/:userId/status
// @desc    Update user status (admin only)
// @access  Private/Admin
router.put('/admin/:userId/status', [auth, adminAuth], async (req, res) => {
  try {
    const { isActive } = req.body;
    const userId = req.params.userId;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.isActive = isActive;
    user.updatedAt = Date.now();
    await user.save();

    res.json({
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
      user: { id: user._id, isActive: user.isActive }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/users/admin/:userId/role
// @desc    Update user role (admin only)
// @access  Private/Admin
router.put('/admin/:userId/role', [auth, adminAuth], async (req, res) => {
  try {
    const { role } = req.body;
    const userId = req.params.userId;

    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.role = role;
    user.updatedAt = Date.now();
    await user.save();

    res.json({
      message: `User role updated to ${role} successfully`,
      user: { id: user._id, role: user.role }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/users/admin/stats
// @desc    Get user statistics (admin only)
// @access  Private/Admin
router.get('/admin/stats', [auth, adminAuth], async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const inactiveUsers = await User.countDocuments({ isActive: false });
    const adminUsers = await User.countDocuments({ role: 'admin' });

    // New users this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    
    const newUsersThisMonth = await User.countDocuments({
      createdAt: { $gte: startOfMonth }
    });

    // User registration trend (last 12 months)
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

    res.json({
      totalUsers,
      activeUsers,
      inactiveUsers,
      adminUsers,
      newUsersThisMonth,
      userTrend
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
