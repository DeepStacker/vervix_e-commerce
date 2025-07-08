const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  action: {
    type: String,
    required: true,
    enum: [
      // User actions
      'user_login', 'user_logout', 'user_register', 'user_profile_update', 'user_password_change',
      'user_address_add', 'user_address_update', 'user_address_delete',
      
      // Product actions
      'product_create', 'product_update', 'product_delete', 'product_status_change',
      'product_variant_add', 'product_variant_update', 'product_variant_delete',
      'product_image_upload', 'product_image_delete',
      
      // Order actions
      'order_create', 'order_status_update', 'order_cancel', 'order_refund',
      'order_return_request', 'order_return_approve', 'order_return_reject',
      'order_shipping_update', 'order_tracking_update',
      
      // Payment actions
      'payment_initiated', 'payment_success', 'payment_failed', 'payment_refund',
      'payment_method_add', 'payment_method_update', 'payment_method_delete',
      
      // Inventory actions
      'inventory_update', 'inventory_low_stock_alert', 'inventory_reorder',
      'stock_adjustment', 'stock_transfer',
      
      // Admin actions
      'admin_login', 'admin_logout', 'admin_user_management', 'admin_order_management',
      'admin_product_management', 'admin_settings_update', 'admin_backup_create',
      
      // System actions
      'system_backup', 'system_maintenance', 'system_error', 'system_alert',
      
      // Security actions
      'failed_login_attempt', 'account_locked', 'account_unlocked', 'password_reset',
      'email_verification', 'two_factor_auth_enabled', 'two_factor_auth_disabled'
    ]
  },
  resource: {
    type: String,
    required: true,
    enum: ['user', 'product', 'order', 'payment', 'inventory', 'category', 'system', 'security']
  },
  resourceId: {
    type: mongoose.Schema.Types.ObjectId,
    required: false
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
    required: false
  },
  ipAddress: {
    type: String,
    required: true
  },
  userAgent: {
    type: String,
    required: false
  },
  sessionId: {
    type: String,
    required: false
  },
  status: {
    type: String,
    enum: ['success', 'failure', 'pending'],
    default: 'success'
  },
  errorMessage: {
    type: String,
    required: false
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    required: false
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for performance and querying
auditLogSchema.index({ user: 1, timestamp: -1 });
auditLogSchema.index({ action: 1, timestamp: -1 });
auditLogSchema.index({ resource: 1, resourceId: 1 });
auditLogSchema.index({ ipAddress: 1, timestamp: -1 });
auditLogSchema.index({ timestamp: -1 });

// Virtual for formatted timestamp
auditLogSchema.virtual('formattedTimestamp').get(function() {
  return this.timestamp.toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
});

// Static method to create audit log
auditLogSchema.statics.createLog = async function(logData) {
  try {
    const auditLog = new this(logData);
    await auditLog.save();
    return auditLog;
  } catch (error) {
    console.error('Error creating audit log:', error);
    throw error;
  }
};

// Static method to get audit logs with pagination
auditLogSchema.statics.getLogs = async function(filters = {}, page = 1, limit = 50) {
  const skip = (page - 1) * limit;
  
  const query = {};
  
  if (filters.user) query.user = filters.user;
  if (filters.action) query.action = filters.action;
  if (filters.resource) query.resource = filters.resource;
  if (filters.status) query.status = filters.status;
  if (filters.ipAddress) query.ipAddress = filters.ipAddress;
  
  if (filters.startDate && filters.endDate) {
    query.timestamp = {
      $gte: new Date(filters.startDate),
      $lte: new Date(filters.endDate)
    };
  }
  
  const logs = await this.find(query)
    .populate('user', 'firstName lastName email')
    .sort({ timestamp: -1 })
    .skip(skip)
    .limit(limit);
    
  const total = await this.countDocuments(query);
  
  return {
    logs,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
};

// Static method to get audit summary
auditLogSchema.statics.getSummary = async function(startDate, endDate) {
  const matchStage = {
    timestamp: {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    }
  };
  
  const summary = await this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: {
          action: '$action',
          status: '$status'
        },
        count: { $sum: 1 }
      }
    },
    {
      $group: {
        _id: '$_id.action',
        statuses: {
          $push: {
            status: '$_id.status',
            count: '$count'
          }
        },
        totalCount: { $sum: '$count' }
      }
    },
    { $sort: { totalCount: -1 } }
  ]);
  
  return summary;
};

// Static method to clean old logs (for compliance retention)
auditLogSchema.statics.cleanOldLogs = async function(retentionDays = 365) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
  
  const result = await this.deleteMany({
    timestamp: { $lt: cutoffDate }
  });
  
  return result;
};

module.exports = mongoose.model('AuditLog', auditLogSchema); 