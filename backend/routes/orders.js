const express = require('express');
const mongoose = require('mongoose');
const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const { auth, adminAuth, ownerOrAdmin } = require('../middleware/auth');
const { sendOrderConfirmationEmail } = require('../utils/email');
const router = express.Router();

// @route   GET /api/orders
// @desc    Get all orders with filtering and pagination (Admin only)
// @access  Private/Admin
router.get('/', auth, adminAuth, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      paymentStatus,
      customer,
      startDate,
      endDate,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      search
    } = req.query;

    // Build query object
    const query = {};

    // Status filters
    if (status) query.status = status;
    if (paymentStatus) query.paymentStatus = paymentStatus;

    // Customer filter
    if (customer) {
      if (mongoose.Types.ObjectId.isValid(customer)) {
        query.customer = customer;
      } else {
        // Search by customer email or name
        const customers = await User.find({
          $or: [
            { email: new RegExp(customer, 'i') },
            { firstName: new RegExp(customer, 'i') },
            { lastName: new RegExp(customer, 'i') }
          ]
        }).select('_id');
        
        if (customers.length > 0) {
          query.customer = { $in: customers.map(c => c._id) };
        }
      }
    }

    // Date range filter
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    // Search functionality
    if (search) {
      query.$or = [
        { orderNumber: new RegExp(search, 'i') },
        { 'customerInfo.email': new RegExp(search, 'i') },
        { 'customerInfo.firstName': new RegExp(search, 'i') },
        { 'customerInfo.lastName': new RegExp(search, 'i') }
      ];
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const limitNum = parseInt(limit);

    // Sort options
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Execute query
    const orders = await Order.find(query)
      .populate('customer', 'firstName lastName email avatar')
      .populate('items.product', 'name images')
      .select('-__v')
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNum)
      .lean();

    // Get total count
    const total = await Order.countDocuments(query);

    // Calculate pagination info
    const totalPages = Math.ceil(total / limitNum);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    res.json({
      success: true,
      data: orders,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalOrders: total,
        hasNextPage,
        hasPrevPage,
        limit: limitNum
      },
      filters: {
        status,
        paymentStatus,
        customer,
        startDate,
        endDate,
        search
      }
    });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch orders'
    });
  }
});

// @route   GET /api/orders/my-orders
// @desc    Get current user's orders
// @access  Private
router.get('/my-orders', auth, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build query object
    const query = { customer: req.user._id };
    if (status) query.status = status;

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const limitNum = parseInt(limit);

    // Sort options
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Execute query
    const orders = await Order.find(query)
      .populate('items.product', 'name images slug')
      .select('-__v')
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNum)
      .lean();

    // Get total count
    const total = await Order.countDocuments(query);

    // Calculate pagination info
    const totalPages = Math.ceil(total / limitNum);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    res.json({
      success: true,
      data: orders,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalOrders: total,
        hasNextPage,
        hasPrevPage,
        limit: limitNum
      }
    });
  } catch (error) {
    console.error('Get user orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch your orders'
    });
  }
});

// @route   GET /api/orders/:id
// @desc    Get single order by ID
// @access  Private (Owner or Admin)
router.get('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;

    const order = await Order.findById(id)
      .populate('customer', 'firstName lastName email phone avatar')
      .populate('items.product', 'name images slug brand')
      .populate('statusHistory.updatedBy', 'firstName lastName')
      .select('-__v');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if user is owner or admin
    if (req.user.role !== 'admin' && order.customer._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch order'
    });
  }
});

// @route   POST /api/orders
// @desc    Create new order
// @access  Private
router.post('/', auth, async (req, res) => {
  try {
    const {
      items,
      shippingAddress,
      billingAddress,
      paymentMethod,
      notes,
      shippingMethod = 'standard',
      couponCode
    } = req.body;

    // Validate required fields
    if (!items || !items.length) {
      return res.status(400).json({
        success: false,
        message: 'Order items are required'
      });
    }

    if (!shippingAddress || !billingAddress) {
      return res.status(400).json({
        success: false,
        message: 'Shipping and billing addresses are required'
      });
    }

    if (!paymentMethod) {
      return res.status(400).json({
        success: false,
        message: 'Payment method is required'
      });
    }

    // Validate and process order items
    const processedItems = [];
    let subtotal = 0;

    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product) {
        return res.status(400).json({
          success: false,
          message: `Product ${item.productId} not found`
        });
      }

      if (product.status !== 'active') {
        return res.status(400).json({
          success: false,
          message: `Product ${product.name} is not available`
        });
      }

      // Check stock availability
      let availableStock = 0;
      if (item.variantId) {
        const variant = product.variants.id(item.variantId);
        if (!variant) {
          return res.status(400).json({
            success: false,
            message: `Variant not found for product ${product.name}`
          });
        }
        availableStock = variant.stock;
      } else {
        availableStock = product.inventory.quantity;
      }

      if (availableStock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${product.name}. Available: ${availableStock}, Requested: ${item.quantity}`
        });
      }

      // Calculate item price (use sale price if on sale)
      const itemPrice = product.isOnSale ? product.salePrice : product.price;
      const totalPrice = itemPrice * item.quantity;

      processedItems.push({
        product: product._id,
        variant: item.variantId ? {
          size: product.variants.id(item.variantId).size,
          color: product.variants.id(item.variantId).color,
          sku: product.variants.id(item.variantId).sku
        } : undefined,
        name: product.name,
        image: product.images[0]?.url || '',
        price: itemPrice,
        quantity: item.quantity,
        totalPrice
      });

      subtotal += totalPrice;

      // Update stock
      if (item.variantId) {
        const variant = product.variants.id(item.variantId);
        variant.stock -= item.quantity;
      } else {
        product.inventory.quantity -= item.quantity;
      }

      // Update sales count
      product.salesCount += item.quantity;
      product.lastOrderDate = new Date();

      await product.save();
    }

    // Create order
    const order = new Order({
      customer: req.user._id,
      customerInfo: {
        firstName: req.user.firstName,
        lastName: req.user.lastName,
        email: req.user.email,
        phone: req.user.phone
      },
      items: processedItems,
      subtotal,
      shippingAddress,
      billingAddress,
      paymentMethod,
      notes,
      shipping: {
        method: shippingMethod
      },
      source: 'web',
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    // Calculate shipping
    order.calculateShipping();

    // Calculate tax (8% default)
    order.calculateTax();

    // Apply coupon if provided
    if (couponCode) {
      // TODO: Implement coupon validation and application
      // order.applyDiscount(couponCode, discountAmount, discountType);
    }

    await order.save();

    // Populate order data
    await order.populate('customer', 'firstName lastName email');
    await order.populate('items.product', 'name images');

    // Send order confirmation email
    try {
      await sendOrderConfirmationEmail(req.user.email, {
        firstName: req.user.firstName,
        orderNumber: order.orderNumber,
        orderDate: order.createdAt.toLocaleDateString(),
        total: order.formattedTotal,
        items: order.items.map(item => ({
          name: item.name,
          image: item.image,
          quantity: item.quantity,
          price: `$${item.price.toFixed(2)}`
        }))
      });
    } catch (emailError) {
      console.error('Failed to send order confirmation email:', emailError);
    }

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: order
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create order',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   PUT /api/orders/:id/status
// @desc    Update order status (Admin only)
// @access  Private/Admin
router.put('/:id/status', auth, adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, note, trackingNumber, carrier } = req.body;

    if (!['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order status'
      });
    }

    const order = await Order.findById(id)
      .populate('customer', 'firstName lastName email');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Update order status using the model method
    await order.updateStatus(status, note, req.user._id);

    // Update shipping info if provided
    if (trackingNumber) order.shipping.trackingNumber = trackingNumber;
    if (carrier) order.shipping.carrier = carrier;

    await order.save();

    // Send status update email to customer
    try {
      // TODO: Implement status update email template
      console.log(`Order ${order.orderNumber} status updated to ${status}`);
    } catch (emailError) {
      console.error('Failed to send status update email:', emailError);
    }

    res.json({
      success: true,
      message: `Order status updated to ${status}`,
      data: order
    });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update order status'
    });
  }
});

// @route   PUT /api/orders/:id/payment-status
// @desc    Update payment status (Admin only)
// @access  Private/Admin
router.put('/:id/payment-status', auth, adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentStatus, transactionId, paidAt, failureReason } = req.body;

    if (!['pending', 'paid', 'failed', 'refunded', 'partially_refunded'].includes(paymentStatus)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment status'
      });
    }

    const updateData = { paymentStatus };

    // Update payment details
    if (transactionId) updateData['paymentDetails.transactionId'] = transactionId;
    if (paidAt) updateData['paymentDetails.paidAt'] = new Date(paidAt);
    if (failureReason) updateData['paymentDetails.failureReason'] = failureReason;

    const order = await Order.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    ).populate('customer', 'firstName lastName email');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    res.json({
      success: true,
      message: `Payment status updated to ${paymentStatus}`,
      data: order
    });
  } catch (error) {
    console.error('Update payment status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update payment status'
    });
  }
});

// @route   POST /api/orders/:id/cancel
// @desc    Cancel order
// @access  Private (Owner or Admin)
router.post('/:id/cancel', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if user is owner or admin
    if (req.user.role !== 'admin' && order.customer.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Check if order can be cancelled
    if (['shipped', 'delivered', 'cancelled', 'refunded'].includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: `Order cannot be cancelled. Current status: ${order.status}`
      });
    }

    // Update order status
    await order.updateStatus('cancelled', reason, req.user._id);
    order.cancellationReason = reason;

    // Restore product stock
    for (const item of order.items) {
      const product = await Product.findById(item.product);
      if (product) {
        if (item.variant && item.variant.sku) {
          const variant = product.variants.find(v => v.sku === item.variant.sku);
          if (variant) {
            variant.stock += item.quantity;
          }
        } else {
          product.inventory.quantity += item.quantity;
        }
        product.salesCount = Math.max(0, product.salesCount - item.quantity);
        await product.save();
      }
    }

    await order.save();

    res.json({
      success: true,
      message: 'Order cancelled successfully',
      data: order
    });
  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel order'
    });
  }
});

// @route   POST /api/orders/:id/refund
// @desc    Process refund (Admin only)
// @access  Private/Admin
router.post('/:id/refund', auth, adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, reason, refundId } = req.body;

    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    if (order.paymentStatus !== 'paid') {
      return res.status(400).json({
        success: false,
        message: 'Order must be paid before refunding'
      });
    }

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Refund amount must be greater than 0'
      });
    }

    if (amount > order.total) {
      return res.status(400).json({
        success: false,
        message: 'Refund amount cannot exceed order total'
      });
    }

    // Add refund record
    order.refunds.push({
      amount,
      reason,
      status: 'processed',
      processedAt: new Date(),
      refundId: refundId || `REF-${Date.now()}`,
      notes: `Processed by ${req.user.firstName} ${req.user.lastName}`
    });

    // Update payment status
    const totalRefunded = order.refunds.reduce((sum, refund) => 
      refund.status === 'processed' ? sum + refund.amount : sum, 0
    );

    if (totalRefunded >= order.total) {
      order.paymentStatus = 'refunded';
      await order.updateStatus('refunded', `Full refund processed: $${totalRefunded}`, req.user._id);
    } else {
      order.paymentStatus = 'partially_refunded';
    }

    await order.save();

    res.json({
      success: true,
      message: 'Refund processed successfully',
      data: order
    });
  } catch (error) {
    console.error('Process refund error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process refund'
    });
  }
});

// @route   GET /api/orders/analytics/overview
// @desc    Get orders analytics overview (Admin only)
// @access  Private/Admin
router.get('/analytics/overview', auth, adminAuth, async (req, res) => {
  try {
    const { period = '30d' } = req.query;

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    
    switch (period) {
      case '7d':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(endDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(endDate.getDate() - 90);
        break;
      case '1y':
        startDate.setFullYear(endDate.getFullYear() - 1);
        break;
      default:
        startDate.setDate(endDate.getDate() - 30);
    }

    // Get basic metrics
    const [
      totalOrders,
      pendingOrders,
      completedOrders,
      cancelledOrders,
      totalRevenue,
      periodStats
    ] = await Promise.all([
      Order.countDocuments(),
      Order.countDocuments({ status: 'pending' }),
      Order.countDocuments({ status: 'delivered' }),
      Order.countDocuments({ status: 'cancelled' }),
      Order.aggregate([
        { $match: { status: { $in: ['confirmed', 'processing', 'shipped', 'delivered'] } } },
        { $group: { _id: null, total: { $sum: '$total' } } }
      ]),
      Order.getSalesStats(startDate, endDate)
    ]);

    // Get order status distribution
    const statusDistribution = await Order.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          revenue: { $sum: '$total' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Get daily sales for the period
    const dailySales = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
          status: { $in: ['confirmed', 'processing', 'shipped', 'delivered'] }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          orders: { $sum: 1 },
          revenue: { $sum: '$total' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);

    // Get top customers
    const topCustomers = await Order.aggregate([
      {
        $match: {
          status: { $in: ['confirmed', 'processing', 'shipped', 'delivered'] }
        }
      },
      {
        $group: {
          _id: '$customer',
          totalOrders: { $sum: 1 },
          totalSpent: { $sum: '$total' }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'customer'
        }
      },
      { $unwind: '$customer' },
      {
        $project: {
          'customer.firstName': 1,
          'customer.lastName': 1,
          'customer.email': 1,
          totalOrders: 1,
          totalSpent: 1
        }
      },
      { $sort: { totalSpent: -1 } },
      { $limit: 10 }
    ]);

    res.json({
      success: true,
      data: {
        overview: {
          totalOrders,
          pendingOrders,
          completedOrders,
          cancelledOrders,
          totalRevenue: totalRevenue[0]?.total || 0,
          periodRevenue: periodStats.totalRevenue,
          averageOrderValue: periodStats.averageOrderValue
        },
        statusDistribution,
        dailySales,
        topCustomers,
        period: {
          startDate,
          endDate,
          period
        }
      }
    });
  } catch (error) {
    console.error('Orders analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch analytics'
    });
  }
});

// @route   POST /api/orders/:id/reorder
// @desc    Reorder items from existing order
// @access  Private (Owner or Admin)
router.post('/:id/reorder', auth, async (req, res) => {
  try {
    const { id } = req.params;

    const order = await Order.findById(id)
      .populate('items.product', 'name price images inventory variants status isActive');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if user is owner or admin
    if (req.user.role !== 'admin' && order.customer.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Validate items availability
    const unavailableItems = [];
    const availableItems = [];

    for (const item of order.items) {
      const product = item.product;
      
      if (!product || !product.isActive) {
        unavailableItems.push({
          name: item.name,
          reason: 'Product no longer available'
        });
        continue;
      }

      // Check stock availability
      let availableStock = 0;
      if (item.variant && item.variant.sku) {
        const variant = product.variants.find(v => v.sku === item.variant.sku);
        if (!variant) {
          unavailableItems.push({
            name: item.name,
            reason: 'Variant no longer available'
          });
          continue;
        }
        availableStock = variant.stock;
      } else {
        availableStock = product.inventory.quantity;
      }

      if (availableStock < item.quantity) {
        unavailableItems.push({
          name: item.name,
          reason: `Only ${availableStock} items available (${item.quantity} requested)`
        });
        continue;
      }

      availableItems.push({
        productId: product._id,
        variantId: item.variant?.sku ? product.variants.find(v => v.sku === item.variant.sku)?._id : null,
        quantity: item.quantity,
        name: item.name,
        price: product.price,
        image: product.images[0]?.url || item.image
      });
    }

    // Add available items to cart
    const user = await User.findById(req.user._id);
    let addedToCart = 0;
    let cartErrors = [];

    for (const item of availableItems) {
      try {
        // Check if item already exists in cart
        const existingItemIndex = user.cart.findIndex(
          cartItem => cartItem.product.toString() === item.productId.toString() &&
          (!item.variantId || cartItem.variant?.toString() === item.variantId.toString())
        );

        if (existingItemIndex >= 0) {
          // Update quantity if item exists
          user.cart[existingItemIndex].quantity += item.quantity;
          user.cart[existingItemIndex].addedAt = new Date();
        } else {
          // Add new item to cart
          user.cart.push({
            product: item.productId,
            variant: item.variantId,
            quantity: item.quantity,
            addedAt: new Date()
          });
        }
        addedToCart++;
      } catch (error) {
        cartErrors.push({
          name: item.name,
          error: error.message
        });
      }
    }

    await user.save();

    res.json({
      success: true,
      message: `Reorder completed. ${addedToCart} items added to cart.`,
      data: {
        addedToCart,
        unavailableItems,
        cartErrors,
        totalItemsProcessed: order.items.length
      }
    });
  } catch (error) {
    console.error('Reorder error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process reorder'
    });
  }
});

// @route   GET /api/orders/analytics/revenue
// @desc    Get revenue analytics (Admin only)
// @access  Private/Admin
router.get('/analytics/revenue', auth, adminAuth, async (req, res) => {
  try {
    const { period = '30d', groupBy = 'day' } = req.query;

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    
    switch (period) {
      case '7d':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(endDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(endDate.getDate() - 90);
        break;
      case '1y':
        startDate.setFullYear(endDate.getFullYear() - 1);
        break;
      default:
        startDate.setDate(endDate.getDate() - 30);
    }

    // Build grouping based on period
    let grouping;
    switch (groupBy) {
      case 'hour':
        grouping = {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' },
          hour: { $hour: '$createdAt' }
        };
        break;
      case 'day':
        grouping = {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' }
        };
        break;
      case 'month':
        grouping = {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' }
        };
        break;
      default:
        grouping = {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' }
        };
    }

    const revenueData = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
          status: { $in: ['confirmed', 'processing', 'shipped', 'delivered'] }
        }
      },
      {
        $group: {
          _id: grouping,
          revenue: { $sum: '$total' },
          orders: { $sum: 1 },
          averageOrderValue: { $avg: '$total' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1, '_id.hour': 1 } }
    ]);

    res.json({
      success: true,
      data: {
        revenueData,
        period: {
          startDate,
          endDate,
          period,
          groupBy
        }
      }
    });
  } catch (error) {
    console.error('Revenue analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch revenue analytics'
    });
  }
});

module.exports = router;
