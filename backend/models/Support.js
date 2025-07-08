const mongoose = require('mongoose');

const supportSchema = new mongoose.Schema({
  ticketNumber: {
    type: String,
    required: true,
    unique: true,
    uppercase: true
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  customerInfo: {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true },
    phone: String
  },
  type: {
    type: String,
    enum: ['general', 'technical', 'billing', 'order', 'return', 'product', 'shipping', 'other'],
    required: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['open', 'in_progress', 'waiting_customer', 'resolved', 'closed'],
    default: 'open'
  },
  subject: {
    type: String,
    required: true,
    trim: true,
    maxlength: [200, 'Subject cannot exceed 200 characters']
  },
  description: {
    type: String,
    required: true,
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  category: {
    type: String,
    enum: [
      'account_issues',
      'payment_problems',
      'order_status',
      'shipping_delays',
      'product_questions',
      'return_refund',
      'website_technical',
      'mobile_app_issues',
      'general_inquiry',
      'complaint',
      'suggestion',
      'other'
    ],
    required: true
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  assignedAt: Date,
  resolvedAt: Date,
  closedAt: Date,
  estimatedResolutionTime: Date,
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  attachments: [{
    filename: String,
    originalName: String,
    url: String,
    size: Number,
    mimeType: String,
    uploadedAt: { type: Date, default: Date.now }
  }],
  messages: [{
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    senderType: {
      type: String,
      enum: ['customer', 'admin', 'system'],
      required: true
    },
    message: {
      type: String,
      required: true,
      maxlength: [5000, 'Message cannot exceed 5000 characters']
    },
    attachments: [{
      filename: String,
      originalName: String,
      url: String,
      size: Number,
      mimeType: String
    }],
    isInternal: {
      type: Boolean,
      default: false
    },
    sentAt: { type: Date, default: Date.now }
  }],
  relatedOrder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order'
  },
  relatedProduct: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  },
  customerSatisfaction: {
    rating: {
      type: Number,
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5']
    },
    feedback: String,
    submittedAt: Date
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
  source: {
    type: String,
    enum: ['web', 'mobile', 'email', 'phone', 'chat', 'admin'],
    default: 'web'
  },
  ipAddress: String,
  userAgent: String,
  browser: String,
  operatingSystem: String,
  deviceType: {
    type: String,
    enum: ['desktop', 'mobile', 'tablet', 'unknown'],
    default: 'unknown'
  },
  location: {
    country: String,
    city: String,
    timezone: String
  },
  notes: String,
  internalNotes: String,
  escalationLevel: {
    type: Number,
    default: 1,
    min: [1, 'Escalation level must be at least 1'],
    max: [5, 'Escalation level cannot exceed 5']
  },
  sla: {
    targetResolutionTime: Date,
    actualResolutionTime: Date,
    isOverdue: {
      type: Boolean,
      default: false
    },
    overdueHours: {
      type: Number,
      default: 0
    }
  },
  autoClose: {
    enabled: {
      type: Boolean,
      default: true
    },
    closeAfterDays: {
      type: Number,
      default: 7
    },
    lastActivity: Date
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for formatted ticket number
supportSchema.virtual('formattedTicketNumber').get(function() {
  return `#${this.ticketNumber}`;
});

// Virtual for ticket age in hours
supportSchema.virtual('ageInHours').get(function() {
  const now = new Date();
  const diffTime = Math.abs(now - this.createdAt);
  return Math.ceil(diffTime / (1000 * 60 * 60));
});

// Virtual for ticket age in days
supportSchema.virtual('ageInDays').get(function() {
  const now = new Date();
  const diffTime = Math.abs(now - this.createdAt);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Virtual for is overdue
supportSchema.virtual('isOverdue').get(function() {
  if (!this.sla.targetResolutionTime) return false;
  return new Date() > this.sla.targetResolutionTime && this.status !== 'resolved' && this.status !== 'closed';
});

// Virtual for last message
supportSchema.virtual('lastMessage').get(function() {
  if (this.messages.length === 0) return null;
  return this.messages[this.messages.length - 1];
});

// Virtual for unread messages count
supportSchema.virtual('unreadMessagesCount').get(function() {
  return this.messages.filter(msg => 
    msg.senderType === 'customer' && 
    !msg.isRead
  ).length;
});

// Pre-save middleware to generate ticket number
supportSchema.pre('save', async function(next) {
  if (!this.ticketNumber) {
    const count = await mongoose.model('Support').countDocuments();
    this.ticketNumber = `TKT${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

// Pre-save middleware to add status history
supportSchema.pre('save', function(next) {
  if (this.isModified('status') && !this.isNew) {
    this.statusHistory.push({
      status: this.status,
      timestamp: new Date()
    });
    
    // Set specific timestamps based on status
    switch (this.status) {
      case 'resolved':
        if (!this.resolvedAt) this.resolvedAt = new Date();
        break;
      case 'closed':
        if (!this.closedAt) this.closedAt = new Date();
        break;
    }
  }
  next();
});

// Instance method to add message
supportSchema.methods.addMessage = function(sender, message, senderType = 'customer', isInternal = false, attachments = []) {
  this.messages.push({
    sender,
    senderType,
    message,
    isInternal,
    attachments
  });
  
  this.autoClose.lastActivity = new Date();
  
  return this.save();
};

// Instance method to update status
supportSchema.methods.updateStatus = function(newStatus, note, updatedBy) {
  this.status = newStatus;
  this.statusHistory.push({
    status: newStatus,
    timestamp: new Date(),
    note,
    updatedBy
  });
  return this.save();
};

// Instance method to assign ticket
supportSchema.methods.assignTicket = function(assignedTo, updatedBy) {
  this.assignedTo = assignedTo;
  this.assignedAt = new Date();
  this.statusHistory.push({
    status: this.status,
    timestamp: new Date(),
    note: `Ticket assigned to ${assignedTo}`,
    updatedBy
  });
  return this.save();
};

// Instance method to escalate ticket
supportSchema.methods.escalateTicket = function(level, reason, updatedBy) {
  this.escalationLevel = level;
  this.statusHistory.push({
    status: this.status,
    timestamp: new Date(),
    note: `Ticket escalated to level ${level}: ${reason}`,
    updatedBy
  });
  return this.save();
};

// Instance method to add customer satisfaction
supportSchema.methods.addSatisfaction = function(rating, feedback) {
  this.customerSatisfaction = {
    rating,
    feedback,
    submittedAt: new Date()
  };
  return this.save();
};

// Static method to get tickets by status
supportSchema.statics.getTicketsByStatus = function(status) {
  return this.find({ status })
    .populate('customer', 'firstName lastName email')
    .populate('assignedTo', 'firstName lastName email')
    .sort({ createdAt: -1 });
};

// Static method to get tickets by priority
supportSchema.statics.getTicketsByPriority = function(priority) {
  return this.find({ priority })
    .populate('customer', 'firstName lastName email')
    .populate('assignedTo', 'firstName lastName email')
    .sort({ createdAt: -1 });
};

// Static method to get overdue tickets
supportSchema.statics.getOverdueTickets = function() {
  const now = new Date();
  return this.find({
    'sla.targetResolutionTime': { $lt: now },
    status: { $nin: ['resolved', 'closed'] }
  })
  .populate('customer', 'firstName lastName email')
  .populate('assignedTo', 'firstName lastName email')
  .sort({ 'sla.targetResolutionTime': 1 });
};

// Static method to get support statistics
supportSchema.statics.getSupportStats = async function(startDate, endDate) {
  const pipeline = [
    {
      $match: {
        createdAt: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: null,
        totalTickets: { $sum: 1 },
        openTickets: {
          $sum: {
            $cond: [{ $in: ['$status', ['open', 'in_progress', 'waiting_customer']] }, 1, 0]
          }
        },
        resolvedTickets: {
          $sum: {
            $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0]
          }
        },
        closedTickets: {
          $sum: {
            $cond: [{ $eq: ['$status', 'closed'] }, 1, 0]
          }
        },
        avgResolutionTime: {
          $avg: {
            $cond: [
              { $in: ['$status', ['resolved', 'closed']] },
              { $subtract: ['$resolvedAt', '$createdAt'] },
              null
            ]
          }
        },
        avgSatisfaction: {
          $avg: '$customerSatisfaction.rating'
        }
      }
    }
  ];
  
  const result = await this.aggregate(pipeline);
  return result[0] || {
    totalTickets: 0,
    openTickets: 0,
    resolvedTickets: 0,
    closedTickets: 0,
    avgResolutionTime: 0,
    avgSatisfaction: 0
  };
};

// Indexes for performance
supportSchema.index({ customer: 1, createdAt: -1 });
supportSchema.index({ status: 1, createdAt: -1 });
supportSchema.index({ priority: 1, createdAt: -1 });
supportSchema.index({ assignedTo: 1, status: 1 });
supportSchema.index({ ticketNumber: 1 });
supportSchema.index({ type: 1, category: 1 });
supportSchema.index({ 'sla.targetResolutionTime': 1 });
supportSchema.index({ createdAt: -1 });
supportSchema.index({ escalationLevel: -1 });

// Text search index
supportSchema.index({
  subject: 'text',
  description: 'text',
  'messages.message': 'text',
  tags: 'text'
});

module.exports = mongoose.model('Support', supportSchema); 