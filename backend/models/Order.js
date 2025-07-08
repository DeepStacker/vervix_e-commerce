const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    required: true,
    unique: true,
    uppercase: true
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Customer is required']
  },
  customerInfo: {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true },
    phone: String
  },
  items: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    variant: {
      size: String,
      color: String,
      sku: String
    },
    name: { type: String, required: true },
    image: String,
    price: { 
      type: Number, 
      required: true,
      min: [0, 'Price cannot be negative']
    },
    quantity: { 
      type: Number, 
      required: true,
      min: [1, 'Quantity must be at least 1']
    },
    totalPrice: {
      type: Number,
      required: true,
      min: [0, 'Total price cannot be negative']
    }
  }],
  subtotal: {
    type: Number,
    required: true,
    min: [0, 'Subtotal cannot be negative']
  },
  tax: {
    amount: {
      type: Number,
      default: 0,
      min: [0, 'Tax amount cannot be negative']
    },
    rate: {
      type: Number,
      default: 0,
      min: [0, 'Tax rate cannot be negative']
    }
  },
  shipping: {
    cost: {
      type: Number,
      default: 0,
      min: [0, 'Shipping cost cannot be negative']
    },
    method: {
      type: String,
      enum: ['standard', 'express', 'overnight', 'free'],
      default: 'standard'
    },
    estimatedDelivery: Date,
    trackingNumber: String,
    carrier: String
  },
  discount: {
    amount: {
      type: Number,
      default: 0,
      min: [0, 'Discount amount cannot be negative']
    },
    code: String,
    type: {
      type: String,
      enum: ['percentage', 'fixed'],
      default: 'fixed'
    }
  },
  total: {
    type: Number,
    required: true,
    min: [0, 'Total cannot be negative']
  },
  currency: {
    type: String,
    default: 'USD',
    uppercase: true
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'],
    default: 'pending'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded', 'partially_refunded'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['credit_card', 'debit_card', 'paypal', 'stripe', 'cash_on_delivery'],
    required: true
  },
  paymentIntentId: {
    type: String,
    unique: true,
    sparse: true
  },
  paymentDetails: {
    transactionId: String,
    paymentGateway: String,
    last4: String,
    brand: String,
    paidAt: Date,
    failureReason: String
  },
  billingAddress: {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    company: String,
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    zipCode: { type: String, required: true },
    country: { type: String, required: true },
    phone: String
  },
  shippingAddress: {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    company: String,
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    zipCode: { type: String, required: true },
    country: { type: String, required: true },
    phone: String
  },
  notes: String,
  adminNotes: String,
  statusHistory: [{
    status: String,
    timestamp: { type: Date, default: Date.now },
    note: String,
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  refunds: [{
    refundId: {
      type: String,
      unique: true,
      uppercase: true
    },
    amount: {
      type: Number,
      required: true,
      min: [0, 'Refund amount cannot be negative']
    },
    reason: {
      type: String,
      enum: [
        'customer_request',
        'defective_product',
        'wrong_item',
        'late_delivery',
        'cancellation',
        'return_processed',
        'duplicate_charge',
        'other'
      ],
      required: true
    },
    type: {
      type: String,
      enum: ['full', 'partial', 'shipping', 'tax'],
      default: 'partial'
    },
    method: {
      type: String,
      enum: ['original_payment', 'store_credit', 'bank_transfer', 'check'],
      default: 'original_payment'
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'processing', 'completed', 'failed', 'cancelled'],
      default: 'pending'
    },
    requestedAt: { type: Date, default: Date.now },
    approvedAt: Date,
    processedAt: Date,
    completedAt: Date,
    failedAt: Date,
    transactionId: String,
    gatewayResponse: mongoose.Schema.Types.Mixed,
    notes: String,
    adminNotes: String,
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    statusHistory: [{
      status: String,
      timestamp: { type: Date, default: Date.now },
      note: String,
      updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    }]
  }],
  returns: [{
    returnId: {
      type: String,
      unique: true,
      uppercase: true
    },
    items: [{
      product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product'
      },
      variant: {
        size: String,
        color: String,
        sku: String
      },
      quantity: {
        type: Number,
        required: true,
        min: [1, 'Return quantity must be at least 1']
      },
      originalPrice: Number,
      returnReason: {
        type: String,
        enum: [
          'wrong_size',
          'wrong_color',
          'defective',
          'not_as_described',
          'changed_mind',
          'arrived_late',
          'duplicate_order',
          'other'
        ],
        required: true
      },
      returnType: {
        type: String,
        enum: ['refund', 'exchange', 'store_credit'],
        default: 'refund'
      },
      condition: {
        type: String,
        enum: ['new', 'like_new', 'used', 'damaged'],
        default: 'new'
      },
      notes: String
    }],
    returnReason: String,
    status: {
      type: String,
      enum: ['requested', 'approved', 'rejected', 'shipped', 'received', 'processed', 'completed'],
      default: 'requested'
    },
    requestedAt: { type: Date, default: Date.now },
    approvedAt: Date,
    shippedAt: Date,
    receivedAt: Date,
    processedAt: Date,
    completedAt: Date,
    notes: String,
    adminNotes: String,
    returnShippingLabel: {
      trackingNumber: String,
      carrier: String,
      cost: Number
    },
    refundAmount: Number,
    exchangeProduct: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product'
    },
    exchangeVariant: {
      size: String,
      color: String
    },
    statusHistory: [{
      status: String,
      timestamp: { type: Date, default: Date.now },
      note: String,
      updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    }],
    images: [{
      url: String,
      description: String
    }]
  }],
  source: {
    type: String,
    enum: ['web', 'mobile', 'admin', 'api'],
    default: 'web'
  },
  ipAddress: String,
  userAgent: String,
  confirmedAt: Date,
  shippedAt: Date,
  deliveredAt: Date,
  cancelledAt: Date,
  cancellationReason: String
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for formatted order number
orderSchema.virtual('formattedOrderNumber').get(function() {
  return `#${this.orderNumber}`;
});

// Virtual for order age in days
orderSchema.virtual('ageInDays').get(function() {
  const now = new Date();
  const diffTime = Math.abs(now - this.createdAt);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Virtual for total items count
orderSchema.virtual('totalItems').get(function() {
  return this.items.reduce((total, item) => total + item.quantity, 0);
});

// Virtual for formatted total
orderSchema.virtual('formattedTotal').get(function() {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: this.currency
  }).format(this.total);
});

// Virtual for full billing address
orderSchema.virtual('fullBillingAddress').get(function() {
  const addr = this.billingAddress;
  return `${addr.street}, ${addr.city}, ${addr.state} ${addr.zipCode}, ${addr.country}`;
});

// Virtual for full shipping address
orderSchema.virtual('fullShippingAddress').get(function() {
  const addr = this.shippingAddress;
  return `${addr.street}, ${addr.city}, ${addr.state} ${addr.zipCode}, ${addr.country}`;
});

// Pre-save middleware to generate order number
orderSchema.pre('save', async function(next) {
  if (!this.orderNumber) {
    const count = await mongoose.model('Order').countDocuments();
    this.orderNumber = `VRX${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

// Pre-save middleware to calculate totals
orderSchema.pre('save', function(next) {
  // Calculate subtotal
  this.subtotal = this.items.reduce((sum, item) => sum + item.totalPrice, 0);
  
  // Calculate total
  this.total = this.subtotal + this.tax.amount + this.shipping.cost - this.discount.amount;
  
  next();
});

// Pre-save middleware to add status history
orderSchema.pre('save', function(next) {
  if (this.isModified('status') && !this.isNew) {
    this.statusHistory.push({
      status: this.status,
      timestamp: new Date()
    });
    
    // Set specific timestamps based on status
    switch (this.status) {
      case 'confirmed':
        if (!this.confirmedAt) this.confirmedAt = new Date();
        break;
      case 'shipped':
        if (!this.shippedAt) this.shippedAt = new Date();
        break;
      case 'delivered':
        if (!this.deliveredAt) this.deliveredAt = new Date();
        break;
      case 'cancelled':
        if (!this.cancelledAt) this.cancelledAt = new Date();
        break;
    }
  }
  next();
});

// Instance method to add status update
orderSchema.methods.updateStatus = function(newStatus, note, updatedBy) {
  this.status = newStatus;
  this.statusHistory.push({
    status: newStatus,
    timestamp: new Date(),
    note,
    updatedBy
  });
  return this.save();
};

// Instance method to calculate shipping cost
orderSchema.methods.calculateShipping = function() {
  const baseRate = 10;
  const expressRate = 25;
  const overnightRate = 50;
  
  switch (this.shipping.method) {
    case 'express':
      this.shipping.cost = expressRate;
      break;
    case 'overnight':
      this.shipping.cost = overnightRate;
      break;
    case 'free':
      this.shipping.cost = 0;
      break;
    default:
      this.shipping.cost = this.subtotal > 100 ? 0 : baseRate;
  }
  
  return this.shipping.cost;
};

// Instance method to calculate tax
orderSchema.methods.calculateTax = function(taxRate = 0.08) {
  this.tax.rate = taxRate;
  this.tax.amount = this.subtotal * taxRate;
  return this.tax.amount;
};

// Instance method to apply discount
orderSchema.methods.applyDiscount = function(discountCode, discountAmount, discountType = 'fixed') {
  this.discount.code = discountCode;
  this.discount.type = discountType;
  
  if (discountType === 'percentage') {
    this.discount.amount = this.subtotal * (discountAmount / 100);
  } else {
    this.discount.amount = discountAmount;
  }
  
  // Ensure discount doesn't exceed subtotal
  this.discount.amount = Math.min(this.discount.amount, this.subtotal);
  
  return this.discount.amount;
};

// Static method to get orders by status
orderSchema.statics.getOrdersByStatus = function(status) {
  return this.find({ status })
    .populate('customer', 'firstName lastName email')
    .populate('items.product', 'name images')
    .sort({ createdAt: -1 });
};

// Instance method to create return request
orderSchema.methods.createReturnRequest = function(returnData, userId) {
  const returnId = `RET${Date.now()}${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
  
  const returnRequest = {
    returnId,
    items: returnData.items,
    returnReason: returnData.returnReason,
    notes: returnData.notes,
    status: 'requested',
    requestedAt: new Date(),
    statusHistory: [{
      status: 'requested',
      timestamp: new Date(),
      note: 'Return request created',
      updatedBy: userId
    }]
  };
  
  this.returns.push(returnRequest);
  return this.save();
};

// Instance method to update return status
orderSchema.methods.updateReturnStatus = function(returnId, newStatus, note, updatedBy) {
  const returnRequest = this.returns.id(returnId);
  if (!returnRequest) {
    throw new Error('Return request not found');
  }
  
  returnRequest.status = newStatus;
  returnRequest.statusHistory.push({
    status: newStatus,
    timestamp: new Date(),
    note,
    updatedBy
  });
  
  // Set specific timestamps based on status
  switch (newStatus) {
    case 'approved':
      returnRequest.approvedAt = new Date();
      break;
    case 'shipped':
      returnRequest.shippedAt = new Date();
      break;
    case 'received':
      returnRequest.receivedAt = new Date();
      break;
    case 'processed':
      returnRequest.processedAt = new Date();
      break;
    case 'completed':
      returnRequest.completedAt = new Date();
      break;
  }
  
  return this.save();
};

// Instance method to create refund
orderSchema.methods.createRefund = function(refundData, userId) {
  const refundId = `REF${Date.now()}${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
  
  const refund = {
    refundId,
    amount: refundData.amount,
    reason: refundData.reason,
    type: refundData.type || 'partial',
    method: refundData.method || 'original_payment',
    status: 'pending',
    requestedAt: new Date(),
    requestedBy: userId,
    notes: refundData.notes,
    statusHistory: [{
      status: 'pending',
      timestamp: new Date(),
      note: 'Refund request created',
      updatedBy: userId
    }]
  };
  
  this.refunds.push(refund);
  return this.save();
};

// Instance method to update refund status
orderSchema.methods.updateRefundStatus = function(refundId, newStatus, note, updatedBy, gatewayResponse = null) {
  const refund = this.refunds.id(refundId);
  if (!refund) {
    throw new Error('Refund not found');
  }
  
  refund.status = newStatus;
  refund.statusHistory.push({
    status: newStatus,
    timestamp: new Date(),
    note,
    updatedBy
  });
  
  // Set specific timestamps based on status
  switch (newStatus) {
    case 'approved':
      refund.approvedAt = new Date();
      break;
    case 'processing':
      refund.processedAt = new Date();
      break;
    case 'completed':
      refund.completedAt = new Date();
      break;
    case 'failed':
      refund.failedAt = new Date();
      break;
  }
  
  if (gatewayResponse) {
    refund.gatewayResponse = gatewayResponse;
  }
  
  return this.save();
};

// Instance method to cancel order
orderSchema.methods.cancelOrder = function(reason, cancelledBy) {
  if (this.status === 'cancelled') {
    throw new Error('Order is already cancelled');
  }
  
  if (['shipped', 'delivered'].includes(this.status)) {
    throw new Error('Cannot cancel order that has been shipped or delivered');
  }
  
  this.status = 'cancelled';
  this.cancellationReason = reason;
  this.cancelledAt = new Date();
  
  this.statusHistory.push({
    status: 'cancelled',
    timestamp: new Date(),
    note: reason,
    updatedBy: cancelledBy
  });
  
  return this.save();
};

// Instance method to get return statistics
orderSchema.methods.getReturnStats = function() {
  const totalReturns = this.returns.length;
  const pendingReturns = this.returns.filter(r => r.status === 'requested').length;
  const approvedReturns = this.returns.filter(r => r.status === 'approved').length;
  const completedReturns = this.returns.filter(r => r.status === 'completed').length;
  
  const totalRefunds = this.refunds.length;
  const pendingRefunds = this.refunds.filter(r => r.status === 'pending').length;
  const completedRefunds = this.refunds.filter(r => r.status === 'completed').length;
  
  return {
    returns: {
      total: totalReturns,
      pending: pendingReturns,
      approved: approvedReturns,
      completed: completedReturns
    },
    refunds: {
      total: totalRefunds,
      pending: pendingRefunds,
      completed: completedRefunds
    }
  };
};

// Static method to get sales statistics
orderSchema.statics.getSalesStats = async function(startDate, endDate) {
  const pipeline = [
    {
      $match: {
        status: { $in: ['confirmed', 'processing', 'shipped', 'delivered'] },
        createdAt: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: null,
        totalOrders: { $sum: 1 },
        totalRevenue: { $sum: '$total' },
        averageOrderValue: { $avg: '$total' },
        totalItems: { $sum: { $sum: '$items.quantity' } }
      }
    }
  ];
  
  const result = await this.aggregate(pipeline);
  return result[0] || {
    totalOrders: 0,
    totalRevenue: 0,
    averageOrderValue: 0,
    totalItems: 0
  };
};

// Static method to get return statistics
orderSchema.statics.getReturnStats = async function(startDate, endDate) {
  const pipeline = [
    {
      $match: {
        'returns.requestedAt': { $gte: startDate, $lte: endDate }
      }
    },
    {
      $unwind: '$returns'
    },
    {
      $group: {
        _id: '$returns.status',
        count: { $sum: 1 },
        totalAmount: { $sum: '$returns.refundAmount' }
      }
    }
  ];
  
  const result = await this.aggregate(pipeline);
  return result;
};

// Indexes for performance
orderSchema.index({ customer: 1, createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ orderNumber: 1 });
orderSchema.index({ paymentStatus: 1 });
orderSchema.index({ 'paymentDetails.transactionId': 1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ total: -1 });

module.exports = mongoose.model('Order', orderSchema);
