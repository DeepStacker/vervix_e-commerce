const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const User = require('../models/User');
const Order = require('../models/Order');
const Product = require('../models/Product');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Mock Stripe for testing
jest.mock('stripe', () => {
  return jest.fn(() => ({
    paymentIntents: {
      create: jest.fn(),
      retrieve: jest.fn()
    },
    customers: {
      create: jest.fn(),
      retrieve: jest.fn(),
      update: jest.fn()
    },
    paymentMethods: {
      list: jest.fn(),
      attach: jest.fn(),
      detach: jest.fn()
    },
    refunds: {
      create: jest.fn()
    },
    webhooks: {
      constructEvent: jest.fn()
    }
  }));
});

describe('Payment API', () => {
  let testUser;
  let testOrder;
  let testProduct;
  let authToken;
  let mockStripe;

  // Database connection is handled by setup.js

  beforeEach(async () => {
    // Create test user
    testUser = new User({
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@test.com',
      password: 'password123',
      phone: '+1234567890'
    });
    await testUser.save();

    // Create test category first
    const Category = require('../models/Category');
    const testCategory = new Category({
      name: 'Test Category',
      description: 'Test category',
      gender: 'unisex'
    });
    await testCategory.save();

    // Create test product
    testProduct = new Product({
      name: 'Test Product',
      description: 'Test product description',
      price: 99.99,
      stock: 10,
      category: testCategory._id,
      brand: 'Test Brand',
      gender: 'unisex',
      sku: 'TEST-001',
      images: ['https://example.com/test.jpg']
    });
    await testProduct.save();

    // Create test order
    testOrder = new Order({
      orderNumber: 'VER-2024-TEST-001',
      customer: testUser._id,
      customerInfo: {
        firstName: testUser.firstName,
        lastName: testUser.lastName,
        email: testUser.email,
        phone: testUser.phone
      },
      items: [{
        product: testProduct._id,
        name: testProduct.name,
        price: testProduct.price,
        quantity: 1,
        totalPrice: testProduct.price
      }],
      subtotal: testProduct.price,
      total: testProduct.price,
      paymentMethod: 'stripe',
      shippingAddress: {
        firstName: 'John',
        lastName: 'Doe',
        street: '123 Test St',
        city: 'Test City',
        state: 'TS',
        zipCode: '12345',
        country: 'US'
      },
      billingAddress: {
        firstName: 'John',
        lastName: 'Doe',
        street: '123 Test St',
        city: 'Test City',
        state: 'TS',
        zipCode: '12345',
        country: 'US'
      }
    });
    await testOrder.save();

    // Login to get token
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: 'password123'
      });
    authToken = response.body.token;

    // Get mock Stripe instance
    mockStripe = stripe();
  });

  afterEach(async () => {
    await User.deleteMany({});
    await Order.deleteMany({});
    await Product.deleteMany({});
    const Category = require('../models/Category');
    await Category.deleteMany({});
    jest.clearAllMocks();
  });

  describe('POST /api/payments/create-payment-intent', () => {
    it('should create payment intent successfully', async () => {
      const mockPaymentIntent = {
        id: 'pi_test_123',
        client_secret: 'pi_test_secret_123',
        amount: 9999,
        currency: 'usd',
        status: 'requires_payment_method'
      };

      const mockCustomer = {
        id: 'cus_test_123',
        email: testUser.email,
        name: `${testUser.firstName} ${testUser.lastName}`
      };

      mockStripe.customers.create.mockResolvedValue(mockCustomer);
      mockStripe.paymentIntents.create.mockResolvedValue(mockPaymentIntent);

      const response = await request(app)
        .post('/api/payments/create-payment-intent')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ orderId: testOrder._id })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.clientSecret).toBe(mockPaymentIntent.client_secret);
      expect(response.body.paymentIntentId).toBe(mockPaymentIntent.id);
    });

    it('should fail without order ID', async () => {
      const response = await request(app)
        .post('/api/payments/create-payment-intent')
        .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Order ID is required');
    });

    it('should fail with non-existent order', async () => {
      const response = await request(app)
        .post('/api/payments/create-payment-intent')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ orderId: new mongoose.Types.ObjectId() })
        .expect(500);

      expect(response.body.success).toBe(false);
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .post('/api/payments/create-payment-intent')
        .send({ orderId: testOrder._id })
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/payments/confirm-payment', () => {
    it('should confirm payment successfully', async () => {
      // Set payment intent ID on order
      testOrder.paymentIntentId = 'pi_test_123';
      await testOrder.save();

      const mockPaymentIntent = {
        id: 'pi_test_123',
        status: 'succeeded',
        payment_method_types: ['card']
      };

      mockStripe.paymentIntents.retrieve.mockResolvedValue(mockPaymentIntent);

      const response = await request(app)
        .post('/api/payments/confirm-payment')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ paymentIntentId: 'pi_test_123' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Payment confirmed successfully');
    });

    it('should fail with non-existent payment intent', async () => {
      const response = await request(app)
        .post('/api/payments/confirm-payment')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ paymentIntentId: 'pi_nonexistent' })
        .expect(500);

      expect(response.body.success).toBe(false);
    });

    it('should fail without payment intent ID', async () => {
      const response = await request(app)
        .post('/api/payments/confirm-payment')
        .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Payment intent ID is required');
    });
  });

  describe('POST /api/payments/webhook', () => {
    it('should handle payment_intent.succeeded webhook', async () => {
      const mockEvent = {
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: 'pi_test_123',
            status: 'succeeded'
          }
        }
      };

      mockStripe.webhooks.constructEvent.mockReturnValue(mockEvent);

      // Set payment intent ID on order
      testOrder.paymentIntentId = 'pi_test_123';
      await testOrder.save();

      const response = await request(app)
        .post('/api/payments/webhook')
        .set('stripe-signature', 'test_signature')
        .send({})
        .expect(200);

      expect(response.body.received).toBe(true);
    });

    it('should handle payment_intent.payment_failed webhook', async () => {
      const mockEvent = {
        type: 'payment_intent.payment_failed',
        data: {
          object: {
            id: 'pi_test_123',
            status: 'requires_payment_method'
          }
        }
      };

      mockStripe.webhooks.constructEvent.mockReturnValue(mockEvent);

      // Set payment intent ID on order
      testOrder.paymentIntentId = 'pi_test_123';
      await testOrder.save();

      const response = await request(app)
        .post('/api/payments/webhook')
        .set('stripe-signature', 'test_signature')
        .send({})
        .expect(200);

      expect(response.body.received).toBe(true);
    });

    it('should fail with invalid webhook signature', async () => {
      mockStripe.webhooks.constructEvent.mockImplementation(() => {
        throw new Error('Invalid signature');
      });

      const response = await request(app)
        .post('/api/payments/webhook')
        .set('stripe-signature', 'invalid_signature')
        .send({})
        .expect(400);

      expect(response.body.message).toContain('Webhook signature verification failed');
    });
  });

  describe('GET /api/payments/payment-methods', () => {
    it('should get customer payment methods', async () => {
      // Set Stripe customer ID on user
      testUser.stripeCustomerId = 'cus_test_123';
      await testUser.save();

      const mockPaymentMethods = {
        data: [
          {
            id: 'pm_test_123',
            card: {
              brand: 'visa',
              last4: '4242',
              exp_month: 12,
              exp_year: 2025
            },
            metadata: { isDefault: 'true' }
          }
        ]
      };

      mockStripe.paymentMethods.list.mockResolvedValue(mockPaymentMethods);

      const response = await request(app)
        .get('/api/payments/payment-methods')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.paymentMethods).toHaveLength(1);
      expect(response.body.paymentMethods[0].id).toBe('pm_test_123');
    });

    it('should return empty array for user without Stripe customer ID', async () => {
      const response = await request(app)
        .get('/api/payments/payment-methods')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.paymentMethods).toEqual([]);
    });
  });

  describe('POST /api/payments/save-payment-method', () => {
    it('should save payment method successfully', async () => {
      // Set Stripe customer ID on user
      testUser.stripeCustomerId = 'cus_test_123';
      await testUser.save();

      mockStripe.paymentMethods.attach.mockResolvedValue({});
      mockStripe.customers.update.mockResolvedValue({});

      const response = await request(app)
        .post('/api/payments/save-payment-method')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          paymentMethodId: 'pm_test_123',
          isDefault: true
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Payment method saved successfully');
    });

    it('should fail without payment method ID', async () => {
      const response = await request(app)
        .post('/api/payments/save-payment-method')
        .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Payment method ID is required');
    });
  });

  describe('DELETE /api/payments/payment-methods/:id', () => {
    it('should delete payment method successfully', async () => {
      mockStripe.paymentMethods.detach.mockResolvedValue({});

      const response = await request(app)
        .delete('/api/payments/payment-methods/pm_test_123')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Payment method deleted successfully');
    });
  });

  describe('POST /api/payments/refund', () => {
    let adminUser;
    let adminToken;

    beforeEach(async () => {
      // Create admin user
      adminUser = new User({
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin@test.com',
        password: 'admin123',
        role: 'admin'
      });
      await adminUser.save();

      // Login as admin
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: adminUser.email,
          password: 'admin123'
        });
      adminToken = response.body.token;

      // Set payment intent ID on order
      testOrder.paymentIntentId = 'pi_test_123';
      await testOrder.save();
    });

    it('should create refund successfully', async () => {
      const mockRefund = {
        id: 're_test_123',
        amount: 9999,
        status: 'succeeded'
      };

      mockStripe.refunds.create.mockResolvedValue(mockRefund);

      const response = await request(app)
        .post('/api/payments/refund')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          orderId: testOrder._id,
          amount: 99.99,
          reason: 'customer_request'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Refund created successfully');
      expect(response.body.refundId).toBe('re_test_123');
    });

    it('should fail without order ID', async () => {
      const response = await request(app)
        .post('/api/payments/refund')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          amount: 99.99,
          reason: 'customer_request'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Order ID is required');
    });

    it('should fail for non-admin user', async () => {
      const response = await request(app)
        .post('/api/payments/refund')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          orderId: testOrder._id,
          amount: 99.99,
          reason: 'customer_request'
        })
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/payments/analytics', () => {
    let adminUser;
    let adminToken;

    beforeEach(async () => {
      // Create admin user
      adminUser = new User({
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin@test.com',
        password: 'admin123',
        role: 'admin'
      });
      await adminUser.save();

      // Login as admin
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: adminUser.email,
          password: 'admin123'
        });
      adminToken = response.body.token;
    });

    it('should get payment analytics', async () => {
      // Create a paid order
      const paidOrder = new Order({
        orderNumber: 'VER-2024-TEST-002',
        customer: testUser._id,
        customerInfo: {
          firstName: testUser.firstName,
          lastName: testUser.lastName,
          email: testUser.email
        },
        items: [{
          product: testProduct._id,
          name: testProduct.name,
          price: testProduct.price,
          quantity: 1,
          totalPrice: testProduct.price
        }],
        subtotal: testProduct.price,
        total: testProduct.price,
        paymentStatus: 'paid',
        status: 'processing',
        paymentMethod: 'stripe'
      });
      await paidOrder.save();

      const response = await request(app)
        .get('/api/payments/analytics?timeRange=30d')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.analytics).toHaveProperty('totalRevenue');
      expect(response.body.analytics).toHaveProperty('totalOrders');
      expect(response.body.analytics).toHaveProperty('averageOrderValue');
    });

    it('should fail for non-admin user', async () => {
      const response = await request(app)
        .get('/api/payments/analytics')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });
}); 