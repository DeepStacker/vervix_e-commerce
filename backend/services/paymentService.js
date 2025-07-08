const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Order = require('../models/Order');
const User = require('../models/User');

class PaymentService {
  /**
   * Create a payment intent for an order
   */
  async createPaymentIntent(orderId, customerId) {
    try {
      // Get order details
      const order = await Order.findById(orderId).populate('items.product');
      if (!order) {
        throw new Error('Order not found');
      }

      // Get customer details
      const customer = await User.findById(customerId);
      if (!customer) {
        throw new Error('Customer not found');
      }

      // Create or get Stripe customer
      let stripeCustomer;
      if (customer.stripeCustomerId) {
        stripeCustomer = await stripe.customers.retrieve(customer.stripeCustomerId);
      } else {
        stripeCustomer = await stripe.customers.create({
          email: customer.email,
          name: `${customer.firstName} ${customer.lastName}`,
          phone: customer.phone,
          metadata: {
            userId: customer._id.toString()
          }
        });

        // Save Stripe customer ID to user
        await User.findByIdAndUpdate(customer._id, {
          stripeCustomerId: stripeCustomer.id
        });
      }

      // Create payment intent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(order.total * 100), // Convert to cents
        currency: 'usd',
        customer: stripeCustomer.id,
        metadata: {
          orderId: order._id.toString(),
          userId: customer._id.toString(),
          orderNumber: order.orderNumber
        },
        description: `Order ${order.orderNumber} - Vervix Luxury Fashion`,
        automatic_payment_methods: {
          enabled: true,
        },
        shipping: {
          name: `${order.shippingAddress.firstName} ${order.shippingAddress.lastName}`,
          address: {
            line1: order.shippingAddress.street,
            city: order.shippingAddress.city,
            state: order.shippingAddress.state,
            postal_code: order.shippingAddress.zipCode,
            country: order.shippingAddress.country,
          },
        },
      });

      // Update order with payment intent ID
      await Order.findByIdAndUpdate(order._id, {
        paymentIntentId: paymentIntent.id,
        paymentStatus: 'pending'
      });

      return {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        customerId: stripeCustomer.id
      };
    } catch (error) {
      console.error('Error creating payment intent:', error);
      throw new Error(`Payment intent creation failed: ${error.message}`);
    }
  }

  /**
   * Process successful payment
   */
  async processSuccessfulPayment(paymentIntentId) {
    try {
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      
      if (paymentIntent.status === 'succeeded') {
        const order = await Order.findOne({ paymentIntentId });
        if (!order) {
          throw new Error('Order not found for payment intent');
        }

        // Update order status
        await Order.findByIdAndUpdate(order._id, {
          paymentStatus: 'paid',
          status: 'processing',
          paidAt: new Date(),
          paymentMethod: paymentIntent.payment_method_types[0] || 'card'
        });

        // Update inventory
        await this.updateInventory(order);

        return {
          success: true,
          orderId: order._id,
          orderNumber: order.orderNumber
        };
      }

      return { success: false, message: 'Payment not succeeded' };
    } catch (error) {
      console.error('Error processing successful payment:', error);
      throw new Error(`Payment processing failed: ${error.message}`);
    }
  }

  /**
   * Process failed payment
   */
  async processFailedPayment(paymentIntentId) {
    try {
      const order = await Order.findOne({ paymentIntentId });
      if (!order) {
        throw new Error('Order not found for payment intent');
      }

      // Update order status
      await Order.findByIdAndUpdate(order._id, {
        paymentStatus: 'failed',
        status: 'cancelled'
      });

      return {
        success: true,
        orderId: order._id,
        orderNumber: order.orderNumber
      };
    } catch (error) {
      console.error('Error processing failed payment:', error);
      throw new Error(`Failed payment processing error: ${error.message}`);
    }
  }

  /**
   * Create refund for an order
   */
  async createRefund(orderId, amount, reason = 'customer_request') {
    try {
      const order = await Order.findById(orderId);
      if (!order) {
        throw new Error('Order not found');
      }

      if (!order.paymentIntentId) {
        throw new Error('No payment intent found for this order');
      }

      // Create refund
      const refund = await stripe.refunds.create({
        payment_intent: order.paymentIntentId,
        amount: amount ? Math.round(amount * 100) : undefined, // Full refund if no amount specified
        reason: reason,
        metadata: {
          orderId: order._id.toString(),
          orderNumber: order.orderNumber,
          reason: reason
        }
      });

      // Update order
      await Order.findByIdAndUpdate(order._id, {
        refundStatus: 'refunded',
        refundedAt: new Date(),
        refundAmount: amount || order.total,
        refundId: refund.id
      });

      return {
        success: true,
        refundId: refund.id,
        amount: refund.amount / 100,
        status: refund.status
      };
    } catch (error) {
      console.error('Error creating refund:', error);
      throw new Error(`Refund creation failed: ${error.message}`);
    }
  }

  /**
   * Get payment methods for a customer
   */
  async getCustomerPaymentMethods(customerId) {
    try {
      const customer = await User.findById(customerId);
      if (!customer || !customer.stripeCustomerId) {
        return [];
      }

      const paymentMethods = await stripe.paymentMethods.list({
        customer: customer.stripeCustomerId,
        type: 'card',
      });

      return paymentMethods.data.map(pm => ({
        id: pm.id,
        brand: pm.card.brand,
        last4: pm.card.last4,
        expMonth: pm.card.exp_month,
        expYear: pm.card.exp_year,
        isDefault: pm.metadata.isDefault === 'true'
      }));
    } catch (error) {
      console.error('Error getting customer payment methods:', error);
      throw new Error(`Failed to get payment methods: ${error.message}`);
    }
  }

  /**
   * Save payment method for customer
   */
  async savePaymentMethod(customerId, paymentMethodId, isDefault = false) {
    try {
      const customer = await User.findById(customerId);
      if (!customer) {
        throw new Error('Customer not found');
      }

      // Attach payment method to customer
      await stripe.paymentMethods.attach(paymentMethodId, {
        customer: customer.stripeCustomerId,
      });

      // Set as default if requested
      if (isDefault) {
        await stripe.customers.update(customer.stripeCustomerId, {
          invoice_settings: {
            default_payment_method: paymentMethodId,
          },
        });
      }

      return { success: true, paymentMethodId };
    } catch (error) {
      console.error('Error saving payment method:', error);
      throw new Error(`Failed to save payment method: ${error.message}`);
    }
  }

  /**
   * Delete payment method
   */
  async deletePaymentMethod(paymentMethodId) {
    try {
      await stripe.paymentMethods.detach(paymentMethodId);
      return { success: true };
    } catch (error) {
      console.error('Error deleting payment method:', error);
      throw new Error(`Failed to delete payment method: ${error.message}`);
    }
  }

  /**
   * Update inventory after successful payment
   */
  async updateInventory(order) {
    try {
      const Product = require('../models/Product');
      
      for (const item of order.items) {
        const product = await Product.findById(item.product);
        if (product) {
          // Update stock
          const newStock = Math.max(0, product.stock - item.quantity);
          await Product.findByIdAndUpdate(product._id, {
            stock: newStock,
            soldCount: (product.soldCount || 0) + item.quantity
          });

          // Update variant stock if applicable
          if (item.variant) {
            const variant = product.variants.find(v => 
              v.size === item.variant.size && v.color === item.variant.color
            );
            if (variant) {
              variant.stock = Math.max(0, variant.stock - item.quantity);
              await product.save();
            }
          }
        }
      }
    } catch (error) {
      console.error('Error updating inventory:', error);
      // Don't throw error as payment is already processed
    }
  }

  /**
   * Handle Stripe webhook events
   */
  async handleWebhook(event) {
    try {
      switch (event.type) {
        case 'payment_intent.succeeded':
          await this.processSuccessfulPayment(event.data.object.id);
          break;

        case 'payment_intent.payment_failed':
          await this.processFailedPayment(event.data.object.id);
          break;

        case 'charge.refunded':
          await this.handleRefund(event.data.object);
          break;

        case 'customer.subscription.created':
        case 'customer.subscription.updated':
        case 'customer.subscription.deleted':
          await this.handleSubscription(event);
          break;

        default:
          console.log(`Unhandled event type: ${event.type}`);
      }

      return { success: true };
    } catch (error) {
      console.error('Error handling webhook:', error);
      throw new Error(`Webhook handling failed: ${error.message}`);
    }
  }

  /**
   * Handle refund webhook
   */
  async handleRefund(charge) {
    try {
      const order = await Order.findOne({ paymentIntentId: charge.payment_intent });
      if (order) {
        await Order.findByIdAndUpdate(order._id, {
          refundStatus: 'refunded',
          refundedAt: new Date(),
          refundAmount: charge.amount_refunded / 100
        });
      }
    } catch (error) {
      console.error('Error handling refund webhook:', error);
    }
  }

  /**
   * Handle subscription events (for future use)
   */
  async handleSubscription(event) {
    // Handle subscription events for future membership features
    console.log('Subscription event:', event.type);
  }

  /**
   * Get payment analytics
   */
  async getPaymentAnalytics(timeRange = '30d') {
    try {
      const now = new Date();
      let startDate;

      switch (timeRange) {
        case '7d':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case '90d':
          startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        case '1y':
          startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      }

      // Get payment analytics from database
      const analytics = await Order.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate },
            paymentStatus: 'paid'
          }
        },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$total' },
            totalOrders: { $sum: 1 },
            averageOrderValue: { $avg: '$total' }
          }
        }
      ]);

      return analytics[0] || {
        totalRevenue: 0,
        totalOrders: 0,
        averageOrderValue: 0
      };
    } catch (error) {
      console.error('Error getting payment analytics:', error);
      throw new Error(`Failed to get payment analytics: ${error.message}`);
    }
  }
}

module.exports = new PaymentService(); 