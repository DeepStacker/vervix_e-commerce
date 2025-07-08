// Load environment variables first
require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const { 
  securityHeaders, 
  rateLimiters, 
  corsOptions 
} = require('./config/security');

// Import routes
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const userRoutes = require('./routes/users');
const orderRoutes = require('./routes/orders');
const categoryRoutes = require('./routes/categories');
const adminRoutes = require('./routes/admin');
const uploadRoutes = require('./routes/upload');
const auditRoutes = require('./routes/audit');
const inventoryRoutes = require('./routes/inventory');
const orderManagementRoutes = require('./routes/orderManagement');
const cartRoutes = require('./routes/cart');

// Initialize Express app
const app = express();

// Security middleware
app.use(securityHeaders);
app.use(morgan('combined'));

// Rate limiting
app.use('/api/', rateLimiters.general);
app.use('/api/auth', rateLimiters.auth);
app.use('/api/upload', rateLimiters.upload);
app.use('/api/admin', rateLimiters.admin);

// CORS configuration
app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/users', userRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/order-management', orderManagementRoutes);
app.use('/api/cart', cartRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ message: 'Vervix API is running successfully!' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Database connection
if (process.env.NODE_ENV !== 'test') {
  mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log('🚀 Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));
}

// Start server only if not in test mode
if (process.env.NODE_ENV !== 'test') {
  const PORT = process.env.PORT || 5000;
  const HOST = process.env.HOST || '0.0.0.0'; // Listen on all network interfaces
  
  app.listen(PORT, HOST, () => {
    console.log(`🌟 Vervix Server running on http://${HOST}:${PORT}`);
    console.log(`🌐 Environment: ${process.env.NODE_ENV}`);
    console.log(`🔗 Local access: http://localhost:${PORT}`);
    console.log(`🔗 Network access: http://[YOUR_LOCAL_IP]:${PORT}`);
    console.log(`💡 To find your local IP, run: ipconfig (Windows) or ifconfig (Mac/Linux)`);
  });
}

module.exports = app;
