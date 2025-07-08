const Order = require('../models/Order');
const Product = require('../models/Product');
const InventoryService = require('./inventoryService');
const { sendOrderStatusUpdateEmail, sendReturnRequestEmail } = require('../utils/email');
const { logCustomEvent } = require('../middleware/audit');

class OrderService {
  // Create a new order
  static async createOrder(orderData, userId) {
    try {
      // Validate stock availability for all items
      for (const item of orderData.items) {
        const availability = await InventoryService.checkStockAvailability(
          item.product,
          item.variantId,
          item.quantity
        );
        
        if (!availability.available) {
          throw new Error(`Insufficient stock for product ${item.product}: ${availability.reason}`);
        }
      }

      // Reserve stock for the order
      for (const item of orderData.items) {
        await InventoryService.reserveStock(
          item.product,
          item.variantId,
          item.quantity,
          orderData.orderNumber || `TEMP-${Date.now()}`,
          userId
        );
      }

      // Create the order
      const order = new Order({
        ...orderData,
        customer: userId,
        customerInfo: orderData.customerInfo,
        source: orderData.source || 'web'
      });

      await order.save();

      // Log the order creation
      await logCustomEvent(
        { user: { _id: userId } },
        'order_create',
        'order',
        {
          orderId: order._id,
          orderNumber: order.orderNumber,
          total: order.total,
          itemCount: order.items.length
        }
      );

      return order;
    } catch (error) {
      console.error('Error creating order:', error);
      throw error;
    }
  }

  // Update order status
  static async updateOrderStatus(orderId, newStatus, note, updatedBy) {
    try {
      const order = await Order.findById(orderId);
      if (!order) {
        throw new Error('Order not found');
      }

      const oldStatus = order.status;
      await order.updateStatus(newStatus, note, updatedBy);

      // Handle stock updates based on status change
      if (oldStatus !== newStatus) {
        if (newStatus === 'cancelled') {
          // Release reserved stock
          for (const item of order.items) {
            await InventoryService.releaseReservedStock(
              item.product,
              item.variantId,
              item.quantity,
              order.orderNumber,
              updatedBy
            );
          }
        } else if (newStatus === 'shipped') {
          // Convert reserved stock to actual stock reduction
          for (const item of order.items) {
            await InventoryService.updateStock(
              item.product,
              item.variantId,
              -item.quantity,
              'order_shipped',
              order.orderNumber,
              updatedBy
            );
          }
        }
      }

      // Send email notification to customer
      if (['confirmed', 'shipped', 'delivered'].includes(newStatus)) {
        await sendOrderStatusUpdateEmail(
          order.customerInfo.email,
          {
            orderNumber: order.orderNumber,
            customerName: order.customerInfo.firstName,
            newStatus,
            statusMessage: this.getStatusMessage(newStatus),
            trackingNumber: order.shipping.trackingNumber
          }
        );
      }

      // Log the status update
      await logCustomEvent(
        { user: { _id: updatedBy } },
        'order_status_update',
        'order',
        {
          orderId: order._id,
          orderNumber: order.orderNumber,
          oldStatus,
          newStatus,
          note
        }
      );

      return order;
    } catch (error) {
      console.error('Error updating order status:', error);
      throw error;
    }
  }

  // Create return request
  static async createReturnRequest(orderId, returnData, userId) {
    try {
      const order = await Order.findById(orderId);
      if (!order) {
        throw new Error('Order not found');
      }

      // Validate return eligibility
      if (!['delivered', 'shipped'].includes(order.status)) {
        throw new Error('Order is not eligible for return');
      }

      // Validate return items
      for (const returnItem of returnData.items) {
        const orderItem = order.items.find(item => 
          item.product.toString() === returnItem.product &&
          item.variant?.size === returnItem.variant?.size &&
          item.variant?.color === returnItem.variant?.color
        );

        if (!orderItem) {
          throw new Error('Return item not found in order');
        }

        if (returnItem.quantity > orderItem.quantity) {
          throw new Error('Return quantity exceeds order quantity');
        }
      }

      await order.createReturnRequest(returnData, userId);

      // Send return request email
      await sendReturnRequestEmail(
        order.customerInfo.email,
        {
          orderNumber: order.orderNumber,
          customerName: order.customerInfo.firstName,
          reason: returnData.returnReason,
          items: returnData.items.map(item => item.product),
          status: 'requested'
        }
      );

      // Log the return request
      await logCustomEvent(
        { user: { _id: userId } },
        'order_return_request',
        'order',
        {
          orderId: order._id,
          orderNumber: order.orderNumber,
          returnReason: returnData.returnReason,
          itemCount: returnData.items.length
        }
      );

      return order;
    } catch (error) {
      console.error('Error creating return request:', error);
      throw error;
    }
  }

  // Update return status
  static async updateReturnStatus(orderId, returnId, newStatus, note, updatedBy) {
    try {
      const order = await Order.findById(orderId);
      if (!order) {
        throw new Error('Order not found');
      }

      await order.updateReturnStatus(returnId, newStatus, note, updatedBy);

      // Handle stock updates for approved returns
      if (newStatus === 'approved') {
        const returnRequest = order.returns.id(returnId);
        for (const item of returnRequest.items) {
          await InventoryService.updateStock(
            item.product,
            item.variant?.sku,
            item.quantity,
            'return_approved',
            returnRequest.returnId,
            updatedBy
          );
        }
      }

      // Log the return status update
      await logCustomEvent(
        { user: { _id: updatedBy } },
        'order_return_status_update',
        'order',
        {
          orderId: order._id,
          orderNumber: order.orderNumber,
          returnId,
          newStatus,
          note
        }
      );

      return order;
    } catch (error) {
      console.error('Error updating return status:', error);
      throw error;
    }
  }

  // Create refund
  static async createRefund(orderId, refundData, userId) {
    try {
      const order = await Order.findById(orderId);
      if (!order) {
        throw new Error('Order not found');
      }

      // Validate refund amount
      if (refundData.amount > order.total) {
        throw new Error('Refund amount cannot exceed order total');
      }

      await order.createRefund(refundData, userId);

      // Log the refund creation
      await logCustomEvent(
        { user: { _id: userId } },
        'order_refund_create',
        'order',
        {
          orderId: order._id,
          orderNumber: order.orderNumber,
          refundAmount: refundData.amount,
          reason: refundData.reason
        }
      );

      return order;
    } catch (error) {
      console.error('Error creating refund:', error);
      throw error;
    }
  }

  // Process refund through payment gateway
  static async processRefund(orderId, refundId, userId) {
    try {
      const order = await Order.findById(orderId);
      if (!order) {
        throw new Error('Order not found');
      }

      const refund = order.refunds.id(refundId);
      if (!refund) {
        throw new Error('Refund not found');
      }

      if (refund.status !== 'approved') {
        throw new Error('Refund must be approved before processing');
      }

      // Update refund status to processing
      await order.updateRefundStatus(refundId, 'processing', 'Processing refund through payment gateway', userId);

      // Here you would integrate with your payment gateway (Stripe, PayPal, etc.)
      // For now, we'll simulate a successful refund
      const gatewayResponse = {
        success: true,
        transactionId: `TXN_${Date.now()}`,
        processedAt: new Date()
      };

      // Update refund status to completed
      await order.updateRefundStatus(
        refundId, 
        'completed', 
        'Refund processed successfully', 
        userId, 
        gatewayResponse
      );

      // Log the refund processing
      await logCustomEvent(
        { user: { _id: userId } },
        'order_refund_process',
        'order',
        {
          orderId: order._id,
          orderNumber: order.orderNumber,
          refundId,
          amount: refund.amount,
          transactionId: gatewayResponse.transactionId
        }
      );

      return order;
    } catch (error) {
      console.error('Error processing refund:', error);
      throw error;
    }
  }

  // Cancel order
  static async cancelOrder(orderId, reason, cancelledBy) {
    try {
      const order = await Order.findById(orderId);
      if (!order) {
        throw new Error('Order not found');
      }

      await order.cancelOrder(reason, cancelledBy);

      // Release reserved stock
      for (const item of order.items) {
        await InventoryService.releaseReservedStock(
          item.product,
          item.variantId,
          item.quantity,
          order.orderNumber,
          cancelledBy
        );
      }

      // Log the order cancellation
      await logCustomEvent(
        { user: { _id: cancelledBy } },
        'order_cancel',
        'order',
        {
          orderId: order._id,
          orderNumber: order.orderNumber,
          reason
        }
      );

      return order;
    } catch (error) {
      console.error('Error cancelling order:', error);
      throw error;
    }
  }

  // Get order statistics
  static async getOrderStats(startDate, endDate) {
    try {
      const [salesStats, returnStats, orderCounts] = await Promise.all([
        Order.getSalesStats(startDate, endDate),
        Order.getReturnStats(startDate, endDate),
        Order.aggregate([
          {
            $match: {
              createdAt: { $gte: startDate, $lte: endDate }
            }
          },
          {
            $group: {
              _id: '$status',
              count: { $sum: 1 }
            }
          }
        ])
      ]);

      return {
        sales: salesStats,
        returns: returnStats,
        orderCounts: orderCounts.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {})
      };
    } catch (error) {
      console.error('Error getting order statistics:', error);
      throw error;
    }
  }

  // Get orders with filters and pagination
  static async getOrders(filters = {}, page = 1, limit = 50) {
    try {
      const query = {};

      if (filters.status) query.status = filters.status;
      if (filters.customer) query.customer = filters.customer;
      if (filters.orderNumber) query.orderNumber = { $regex: filters.orderNumber, $options: 'i' };
      if (filters.startDate && filters.endDate) {
        query.createdAt = {
          $gte: new Date(filters.startDate),
          $lte: new Date(filters.endDate)
        };
      }

      const skip = (page - 1) * limit;
      const sort = { createdAt: -1 };

      const orders = await Order.find(query)
        .populate('customer', 'firstName lastName email')
        .populate('items.product', 'name images sku')
        .sort(sort)
        .skip(skip)
        .limit(limit);

      const total = await Order.countDocuments(query);

      return {
        orders,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('Error getting orders:', error);
      throw error;
    }
  }

  // Get order details
  static async getOrderDetails(orderId) {
    try {
      const order = await Order.findById(orderId)
        .populate('customer', 'firstName lastName email phone')
        .populate('items.product', 'name images sku description')
        .populate('returns.items.product', 'name images sku')
        .populate('refunds.requestedBy', 'firstName lastName')
        .populate('refunds.processedBy', 'firstName lastName');

      if (!order) {
        throw new Error('Order not found');
      }

      return order;
    } catch (error) {
      console.error('Error getting order details:', error);
      throw error;
    }
  }

  // Helper method to get status message
  static getStatusMessage(status) {
    const messages = {
      confirmed: 'Your order has been confirmed and is being prepared for shipment.',
      processing: 'Your order is being processed and will be shipped soon.',
      shipped: 'Your order has been shipped and is on its way to you.',
      delivered: 'Your order has been delivered successfully.',
      cancelled: 'Your order has been cancelled.',
      refunded: 'Your order has been refunded.'
    };

    return messages[status] || 'Your order status has been updated.';
  }
}

module.exports = OrderService; 