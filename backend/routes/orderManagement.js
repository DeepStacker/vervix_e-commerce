const express = require('express');
const router = express.Router();
const OrderService = require('../services/orderService');
const Order = require('../models/Order');
const { auth, adminAuth } = require('../middleware/auth');
const { auditOrderCreate, auditOrderUpdate } = require('../middleware/audit');

// Get orders with filters and pagination
router.get('/', auth, adminAuth, async (req, res) => {
  try {
    const filters = {
      status: req.query.status,
      customer: req.query.customer,
      orderNumber: req.query.orderNumber,
      startDate: req.query.startDate,
      endDate: req.query.endDate
    };

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;

    const result = await OrderService.getOrders(filters, page, limit);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error getting orders:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get orders',
      error: error.message
    });
  }
});

// Get order details
router.get('/:orderId', auth, adminAuth, async (req, res) => {
  try {
    const order = await OrderService.getOrderDetails(req.params.orderId);

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('Error getting order details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get order details',
      error: error.message
    });
  }
});

// Update order status
router.put('/:orderId/status', auth, adminAuth, auditOrderUpdate, async (req, res) => {
  try {
    const { status, note } = req.body;
    const userId = req.user._id;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required'
      });
    }

    const order = await OrderService.updateOrderStatus(
      req.params.orderId,
      status,
      note,
      userId
    );

    res.json({
      success: true,
      message: 'Order status updated successfully',
      data: {
        orderId: order._id,
        orderNumber: order.orderNumber,
        status: order.status
      }
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update order status',
      error: error.message
    });
  }
});

// Cancel order
router.post('/:orderId/cancel', auth, adminAuth, async (req, res) => {
  try {
    const { reason } = req.body;
    const userId = req.user._id;

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'Cancellation reason is required'
      });
    }

    const order = await OrderService.cancelOrder(
      req.params.orderId,
      reason,
      userId
    );

    res.json({
      success: true,
      message: 'Order cancelled successfully',
      data: {
        orderId: order._id,
        orderNumber: order.orderNumber,
        status: order.status
      }
    });
  } catch (error) {
    console.error('Error cancelling order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel order',
      error: error.message
    });
  }
});

// Create return request
router.post('/:orderId/returns', auth, async (req, res) => {
  try {
    const { items, returnReason, notes } = req.body;
    const userId = req.user._id;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Return items are required'
      });
    }

    if (!returnReason) {
      return res.status(400).json({
        success: false,
        message: 'Return reason is required'
      });
    }

    const returnData = {
      items,
      returnReason,
      notes
    };

    const order = await OrderService.createReturnRequest(
      req.params.orderId,
      returnData,
      userId
    );

    const returnRequest = order.returns[order.returns.length - 1];

    res.json({
      success: true,
      message: 'Return request created successfully',
      data: {
        orderId: order._id,
        orderNumber: order.orderNumber,
        returnId: returnRequest.returnId,
        status: returnRequest.status
      }
    });
  } catch (error) {
    console.error('Error creating return request:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create return request',
      error: error.message
    });
  }
});

// Update return status
router.put('/:orderId/returns/:returnId/status', auth, adminAuth, async (req, res) => {
  try {
    const { status, note } = req.body;
    const userId = req.user._id;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required'
      });
    }

    const order = await OrderService.updateReturnStatus(
      req.params.orderId,
      req.params.returnId,
      status,
      note,
      userId
    );

    res.json({
      success: true,
      message: 'Return status updated successfully',
      data: {
        orderId: order._id,
        orderNumber: order.orderNumber,
        returnId: req.params.returnId,
        status
      }
    });
  } catch (error) {
    console.error('Error updating return status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update return status',
      error: error.message
    });
  }
});

// Get return details
router.get('/:orderId/returns/:returnId', auth, adminAuth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId)
      .populate('returns.items.product', 'name images sku');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    const returnRequest = order.returns.id(req.params.returnId);
    if (!returnRequest) {
      return res.status(404).json({
        success: false,
        message: 'Return request not found'
      });
    }

    res.json({
      success: true,
      data: returnRequest
    });
  } catch (error) {
    console.error('Error getting return details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get return details',
      error: error.message
    });
  }
});

// Create refund
router.post('/:orderId/refunds', auth, adminAuth, async (req, res) => {
  try {
    const { amount, reason, type, method, notes } = req.body;
    const userId = req.user._id;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid refund amount is required'
      });
    }

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'Refund reason is required'
      });
    }

    const refundData = {
      amount,
      reason,
      type,
      method,
      notes
    };

    const order = await OrderService.createRefund(
      req.params.orderId,
      refundData,
      userId
    );

    const refund = order.refunds[order.refunds.length - 1];

    res.json({
      success: true,
      message: 'Refund created successfully',
      data: {
        orderId: order._id,
        orderNumber: order.orderNumber,
        refundId: refund.refundId,
        amount: refund.amount,
        status: refund.status
      }
    });
  } catch (error) {
    console.error('Error creating refund:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create refund',
      error: error.message
    });
  }
});

// Process refund
router.post('/:orderId/refunds/:refundId/process', auth, adminAuth, async (req, res) => {
  try {
    const userId = req.user._id;

    const order = await OrderService.processRefund(
      req.params.orderId,
      req.params.refundId,
      userId
    );

    const refund = order.refunds.id(req.params.refundId);

    res.json({
      success: true,
      message: 'Refund processed successfully',
      data: {
        orderId: order._id,
        orderNumber: order.orderNumber,
        refundId: refund.refundId,
        amount: refund.amount,
        status: refund.status,
        transactionId: refund.gatewayResponse?.transactionId
      }
    });
  } catch (error) {
    console.error('Error processing refund:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process refund',
      error: error.message
    });
  }
});

// Get refund details
router.get('/:orderId/refunds/:refundId', auth, adminAuth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    const refund = order.refunds.id(req.params.refundId);
    if (!refund) {
      return res.status(404).json({
        success: false,
        message: 'Refund not found'
      });
    }

    res.json({
      success: true,
      data: refund
    });
  } catch (error) {
    console.error('Error getting refund details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get refund details',
      error: error.message
    });
  }
});

// Get order statistics
router.get('/stats/overview', auth, adminAuth, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Start date and end date are required'
      });
    }

    const stats = await OrderService.getOrderStats(
      new Date(startDate),
      new Date(endDate)
    );

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error getting order statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get order statistics',
      error: error.message
    });
  }
});

// Get returns statistics
router.get('/stats/returns', auth, adminAuth, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Start date and end date are required'
      });
    }

    const returnStats = await Order.getReturnStats(
      new Date(startDate),
      new Date(endDate)
    );

    res.json({
      success: true,
      data: returnStats
    });
  } catch (error) {
    console.error('Error getting return statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get return statistics',
      error: error.message
    });
  }
});

// Export orders to CSV
router.get('/export/csv', auth, adminAuth, async (req, res) => {
  try {
    const filters = {
      status: req.query.status,
      startDate: req.query.startDate,
      endDate: req.query.endDate
    };

    const result = await OrderService.getOrders({ ...filters, limit: 10000 });

    // Generate CSV content
    const csvHeaders = [
      'Order Number',
      'Customer',
      'Email',
      'Status',
      'Total',
      'Items',
      'Created At',
      'Payment Status',
      'Shipping Method'
    ];

    const csvRows = result.orders.map(order => [
      order.orderNumber,
      `${order.customerInfo.firstName} ${order.customerInfo.lastName}`,
      order.customerInfo.email,
      order.status,
      order.total,
      order.items.reduce((sum, item) => sum + item.quantity, 0),
      new Date(order.createdAt).toLocaleDateString(),
      order.paymentStatus,
      order.shipping.method
    ]);

    const csvContent = [csvHeaders, ...csvRows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    // Set response headers for file download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="orders-${new Date().toISOString().split('T')[0]}.csv"`);
    
    res.send(csvContent);
  } catch (error) {
    console.error('Error exporting orders:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export orders',
      error: error.message
    });
  }
});

// Get customer orders
router.get('/customer/:customerId', auth, adminAuth, async (req, res) => {
  try {
    const filters = {
      customer: req.params.customerId,
      status: req.query.status,
      startDate: req.query.startDate,
      endDate: req.query.endDate
    };

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    const result = await OrderService.getOrders(filters, page, limit);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error getting customer orders:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get customer orders',
      error: error.message
    });
  }
});

module.exports = router; 