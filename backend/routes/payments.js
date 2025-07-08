const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const paymentService = require('../services/paymentService');
const rateLimit = require('express-rate-limit');

// Rate limiting for payment endpoints
const paymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 requests per windowMs
  message: 'Too many payment requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Webhook limiter (more permissive for Stripe)
const webhookLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many webhook requests',
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * @route   POST /api/payments/create-payment-intent
 * @desc    Create a payment intent for an order
 * @access  Private
 */
router.post('/create-payment-intent', [auth, paymentLimiter], async (req, res) => {
  try {
    const { orderId } = req.body;
    const customerId = req.user.id;

    if (!orderId) {
      return res.status(400).json({ message: 'Order ID is required' });
    }

    const paymentIntent = await paymentService.createPaymentIntent(orderId, customerId);

    res.json({
      success: true,
      clientSecret: paymentIntent.clientSecret,
      paymentIntentId: paymentIntent.paymentIntentId
    });
  } catch (error) {
    console.error('Payment intent creation error:', error);
    res.status(500).json({ 
      message: error.message || 'Failed to create payment intent' 
    });
  }
});

/**
 * @route   POST /api/payments/confirm-payment
 * @desc    Confirm a successful payment
 * @access  Private
 */
router.post('/confirm-payment', [auth, paymentLimiter], async (req, res) => {
  try {
    const { paymentIntentId } = req.body;

    if (!paymentIntentId) {
      return res.status(400).json({ message: 'Payment intent ID is required' });
    }

    const result = await paymentService.processSuccessfulPayment(paymentIntentId);

    if (result.success) {
      res.json({
        success: true,
        message: 'Payment confirmed successfully',
        orderId: result.orderId,
        orderNumber: result.orderNumber
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message || 'Payment confirmation failed'
      });
    }
  } catch (error) {
    console.error('Payment confirmation error:', error);
    res.status(500).json({ 
      message: error.message || 'Failed to confirm payment' 
    });
  }
});

/**
 * @route   POST /api/payments/webhook
 * @desc    Handle Stripe webhook events
 * @access  Public (Stripe only)
 */
router.post('/webhook', [webhookLimiter], express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).json({ message: 'Webhook signature verification failed' });
  }

  try {
    await paymentService.handleWebhook(event);
    res.json({ received: true });
  } catch (error) {
    console.error('Webhook handling error:', error);
    res.status(500).json({ message: 'Webhook handling failed' });
  }
});

/**
 * @route   GET /api/payments/payment-methods
 * @desc    Get customer's saved payment methods
 * @access  Private
 */
router.get('/payment-methods', auth, async (req, res) => {
  try {
    const customerId = req.user.id;
    const paymentMethods = await paymentService.getCustomerPaymentMethods(customerId);

    res.json({
      success: true,
      paymentMethods
    });
  } catch (error) {
    console.error('Get payment methods error:', error);
    res.status(500).json({ 
      message: error.message || 'Failed to get payment methods' 
    });
  }
});

/**
 * @route   POST /api/payments/save-payment-method
 * @desc    Save a payment method for customer
 * @access  Private
 */
router.post('/save-payment-method', [auth, paymentLimiter], async (req, res) => {
  try {
    const { paymentMethodId, isDefault } = req.body;
    const customerId = req.user.id;

    if (!paymentMethodId) {
      return res.status(400).json({ message: 'Payment method ID is required' });
    }

    const result = await paymentService.savePaymentMethod(customerId, paymentMethodId, isDefault);

    res.json({
      success: true,
      message: 'Payment method saved successfully',
      paymentMethodId: result.paymentMethodId
    });
  } catch (error) {
    console.error('Save payment method error:', error);
    res.status(500).json({ 
      message: error.message || 'Failed to save payment method' 
    });
  }
});

/**
 * @route   DELETE /api/payments/payment-methods/:id
 * @desc    Delete a payment method
 * @access  Private
 */
router.delete('/payment-methods/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    await paymentService.deletePaymentMethod(id);

    res.json({
      success: true,
      message: 'Payment method deleted successfully'
    });
  } catch (error) {
    console.error('Delete payment method error:', error);
    res.status(500).json({ 
      message: error.message || 'Failed to delete payment method' 
    });
  }
});

/**
 * @route   POST /api/payments/refund
 * @desc    Create a refund for an order
 * @access  Admin
 */
router.post('/refund', [auth, admin], async (req, res) => {
  try {
    const { orderId, amount, reason } = req.body;

    if (!orderId) {
      return res.status(400).json({ message: 'Order ID is required' });
    }

    const refund = await paymentService.createRefund(orderId, amount, reason);

    res.json({
      success: true,
      message: 'Refund created successfully',
      refundId: refund.refundId,
      amount: refund.amount,
      status: refund.status
    });
  } catch (error) {
    console.error('Refund creation error:', error);
    res.status(500).json({ 
      message: error.message || 'Failed to create refund' 
    });
  }
});

/**
 * @route   GET /api/payments/analytics
 * @desc    Get payment analytics
 * @access  Admin
 */
router.get('/analytics', [auth, admin], async (req, res) => {
  try {
    const { timeRange } = req.query;
    const analytics = await paymentService.getPaymentAnalytics(timeRange);

    res.json({
      success: true,
      analytics
    });
  } catch (error) {
    console.error('Payment analytics error:', error);
    res.status(500).json({ 
      message: error.message || 'Failed to get payment analytics' 
    });
  }
});

/**
 * @route   POST /api/payments/test-payment
 * @desc    Test payment endpoint (development only)
 * @access  Admin
 */
if (process.env.NODE_ENV === 'development') {
  router.post('/test-payment', [auth, admin], async (req, res) => {
    try {
      const { orderId } = req.body;
      const customerId = req.user.id;

      // Create a test payment intent
      const paymentIntent = await paymentService.createPaymentIntent(orderId, customerId);

      // Simulate successful payment
      const result = await paymentService.processSuccessfulPayment(paymentIntent.paymentIntentId);

      res.json({
        success: true,
        message: 'Test payment processed successfully',
        orderId: result.orderId,
        orderNumber: result.orderNumber
      });
    } catch (error) {
      console.error('Test payment error:', error);
      res.status(500).json({ 
        message: error.message || 'Test payment failed' 
      });
    }
  });
}

module.exports = router; 