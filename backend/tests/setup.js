// Test setup file
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;

// Global test timeout
jest.setTimeout(60000);

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  // Uncomment to suppress console.log during tests
  // log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Mock email service
jest.mock('../services/emailService', () => ({
  sendEmail: jest.fn().mockResolvedValue(true),
  sendPasswordResetEmail: jest.fn().mockResolvedValue(true),
  sendOrderConfirmationEmail: jest.fn().mockResolvedValue(true),
  sendWelcomeEmail: jest.fn().mockResolvedValue(true)
}));

// Mock cloudinary
jest.mock('cloudinary', () => ({
  v2: {
    config: jest.fn(),
    uploader: {
      upload: jest.fn().mockResolvedValue({
        secure_url: 'https://res.cloudinary.com/test/image/upload/test.jpg',
        public_id: 'test_public_id'
      }),
      destroy: jest.fn().mockResolvedValue({ result: 'ok' })
    }
  }
}));

// Mock Stripe
jest.mock('stripe', () => {
  return jest.fn().mockImplementation(() => ({
    paymentIntents: {
      create: jest.fn().mockResolvedValue({
        id: 'pi_test_payment_intent_id',
        client_secret: 'pi_test_payment_intent_id_secret_test',
        amount: 2000,
        currency: 'usd',
        status: 'requires_payment_method'
      }),
      retrieve: jest.fn().mockResolvedValue({
        id: 'pi_test_payment_intent_id',
        status: 'succeeded',
        amount: 2000,
        currency: 'usd'
      }),
      confirm: jest.fn().mockResolvedValue({
        id: 'pi_test_payment_intent_id',
        status: 'succeeded'
      })
    },
    paymentMethods: {
      list: jest.fn().mockResolvedValue({
        data: [{
          id: 'pm_test_payment_method',
          type: 'card',
          card: {
            brand: 'visa',
            last4: '4242'
          }
        }]
      }),
      attach: jest.fn().mockResolvedValue({
        id: 'pm_test_payment_method',
        customer: 'cus_test_customer'
      }),
      detach: jest.fn().mockResolvedValue({
        id: 'pm_test_payment_method'
      })
    },
    customers: {
      create: jest.fn().mockResolvedValue({
        id: 'cus_test_customer',
        email: 'test@example.com'
      }),
      retrieve: jest.fn().mockResolvedValue({
        id: 'cus_test_customer',
        email: 'test@example.com'
      })
    },
    refunds: {
      create: jest.fn().mockResolvedValue({
        id: 're_test_refund_id',
        amount: 2000,
        status: 'succeeded'
      })
    },
    webhooks: {
      constructEvent: jest.fn().mockReturnValue({
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: 'pi_test_payment_intent_id',
            status: 'succeeded'
          }
        }
      })
    }
  }));
});

// Mock multer
jest.mock('multer', () => {
  const multer = () => {
    return {
      single: () => (req, res, next) => {
        req.file = {
          fieldname: 'image',
          originalname: 'test.jpg',
          encoding: '7bit',
          mimetype: 'image/jpeg',
          buffer: Buffer.from('test'),
          size: 1024
        };
        next();
      },
      array: () => (req, res, next) => {
        req.files = [
          {
            fieldname: 'images',
            originalname: 'test1.jpg',
            encoding: '7bit',
            mimetype: 'image/jpeg',
            buffer: Buffer.from('test1'),
            size: 1024
          },
          {
            fieldname: 'images',
            originalname: 'test2.jpg',
            encoding: '7bit',
            mimetype: 'image/jpeg',
            buffer: Buffer.from('test2'),
            size: 1024
          }
        ];
        next();
      }
    };
  };
  multer.memoryStorage = () => ({});
  return multer;
});

// Global test utilities
global.testUtils = {
  // Create test user
  createTestUser: async (userData = {}) => {
    const User = require('../models/User');
    const defaultUser = {
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      password: 'password123',
      phone: '+1234567890',
      ...userData
    };
    
    const user = new User(defaultUser);
    await user.save();
    return user;
  },

  // Create test admin user
  createTestAdmin: async (userData = {}) => {
    const User = require('../models/User');
    const defaultAdmin = {
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@example.com',
      password: 'admin123',
      role: 'admin',
      ...userData
    };
    
    const admin = new User(defaultAdmin);
    await admin.save();
    return admin;
  },

  // Create test product
  createTestProduct: async (productData = {}) => {
    const Product = require('../models/Product');
    const Category = require('../models/Category');
    
    // Create category if not provided
    let categoryId = productData.category;
    if (!categoryId) {
      const testCategory = new Category({
        name: 'Test Category',
        description: 'Test category',
        gender: 'unisex'
      });
      await testCategory.save();
      categoryId = testCategory._id;
    }
    
    const defaultProduct = {
      name: 'Test Product',
      description: 'Test product description',
      price: 99.99,
      stock: 10,
      category: categoryId,
      brand: 'Test Brand',
      gender: 'unisex',
      sku: 'TEST-001',
      images: ['https://example.com/test.jpg'],
      ...productData
    };
    
    const product = new Product(defaultProduct);
    await product.save();
    return product;
  },

  // Create test order
  createTestOrder: async (orderData = {}) => {
    const Order = require('../models/Order');
    const User = require('../models/User');
    const Product = require('../models/Product');
    
    // Create user and product if not provided
    const user = orderData.customer || await global.testUtils.createTestUser();
    const product = orderData.items?.[0]?.product || await global.testUtils.createTestProduct();
    
    const defaultOrder = {
      orderNumber: `VER-${Date.now()}`,
      customer: user._id,
      customerInfo: {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone
      },
      items: [{
        product: product._id,
        name: product.name,
        price: product.price,
        quantity: 1,
        totalPrice: product.price
      }],
      subtotal: product.price,
      total: product.price,
      paymentMethod: 'stripe',
      shippingAddress: {
        firstName: user.firstName,
        lastName: user.lastName,
        street: '123 Test St',
        city: 'Test City',
        state: 'TS',
        zipCode: '12345',
        country: 'US'
      },
      billingAddress: {
        firstName: user.firstName,
        lastName: user.lastName,
        street: '123 Test St',
        city: 'Test City',
        state: 'TS',
        zipCode: '12345',
        country: 'US'
      },
      ...orderData
    };
    
    const order = new Order(defaultOrder);
    await order.save();
    return order;
  },

  // Get auth token for user
  getAuthToken: async (user) => {
    const request = require('supertest');
    const app = require('../server');
    
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: user.email,
        password: user.password || 'password123'
      });
    
    return response.body.token;
  },

  // Clean up test data
  cleanupTestData: async () => {
    const User = require('../models/User');
    const Order = require('../models/Order');
    const Product = require('../models/Product');
    const Category = require('../models/Category');
    
    await User.deleteMany({});
    await Order.deleteMany({});
    await Product.deleteMany({});
    await Category.deleteMany({});
  }
};

// Before all tests
beforeAll(async () => {
  try {
    // Try MongoDB Memory Server first
    console.log('🚀 Starting MongoDB Memory Server...');
    mongoServer = await MongoMemoryServer.create({
      binary: {
        downloadDir: './node_modules/.mongodb-binaries'
      }
    });
    const mongoUri = mongoServer.getUri();
    
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connected to MongoDB Memory Server');
  } catch (memoryServerError) {
    console.warn('⚠️ MongoDB Memory Server failed, trying local MongoDB:', memoryServerError.message);
    
    // Fallback to local MongoDB
    const testDbUri = process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/vervix-test';
    try {
      await mongoose.connect(testDbUri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        maxPoolSize: 10
      });
      console.log('✅ Connected to local test database');
    } catch (localError) {
      console.error('❌ Failed to connect to any database:', localError.message);
      console.log('💡 Solutions:');
      console.log('   1. Install and start MongoDB locally');
      console.log('   2. Start Docker: docker run -d -p 27017:27017 --name test-mongo mongo:6.0');
      console.log('   3. MongoDB Memory Server will be downloaded automatically on first run');
      throw localError;
    }
  }
}, 60000);

// After all tests
afterAll(async () => {
  try {
    await mongoose.connection.close();
    if (mongoServer) {
      await mongoServer.stop();
      console.log('🛑 MongoDB Memory Server stopped');
    }
  } catch (error) {
    console.error('Error during test cleanup:', error);
  }
}, 30000);

// Before each test
beforeEach(async () => {
  // Clean up test data
  await global.testUtils.cleanupTestData();
});

// After each test
afterEach(async () => {
  // Clean up test data
  await global.testUtils.cleanupTestData();
}); 