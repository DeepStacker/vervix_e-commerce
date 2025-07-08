const AuditLog = require('../models/AuditLog');

// Helper function to get client IP address
const getClientIP = (req) => {
  return req.headers['x-forwarded-for'] || 
         req.connection.remoteAddress || 
         req.socket.remoteAddress ||
         (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
         req.ip;
};

// Helper function to get user agent
const getUserAgent = (req) => {
  return req.headers['user-agent'] || 'Unknown';
};

// Helper function to get session ID
const getSessionId = (req) => {
  return req.sessionID || req.headers['x-session-id'] || null;
};

// Main audit logging function
const createAuditLog = async (logData) => {
  try {
    await AuditLog.createLog(logData);
  } catch (error) {
    console.error('Audit logging failed:', error);
    // Don't throw error to avoid breaking the main functionality
  }
};

// Middleware for automatic audit logging
const auditMiddleware = (action, resource, options = {}) => {
  return async (req, res, next) => {
    const originalSend = res.send;
    const originalJson = res.json;
    
    // Override res.send to capture response
    res.send = function(data) {
      logAuditEvent(req, res, action, resource, options, data);
      return originalSend.call(this, data);
    };
    
    // Override res.json to capture response
    res.json = function(data) {
      logAuditEvent(req, res, action, resource, options, data);
      return originalJson.call(this, data);
    };
    
    next();
  };
};

// Function to log audit event
const logAuditEvent = async (req, res, action, resource, options, responseData) => {
  try {
    const userId = req.user ? req.user._id : null;
    const ipAddress = getClientIP(req);
    const userAgent = getUserAgent(req);
    const sessionId = getSessionId(req);
    
    // Determine status based on response
    let status = 'success';
    let errorMessage = null;
    
    if (res.statusCode >= 400) {
      status = 'failure';
      if (responseData && typeof responseData === 'object') {
        errorMessage = responseData.message || responseData.error || 'Request failed';
      }
    }
    
    // Extract resource ID from request
    let resourceId = null;
    if (req.params.id) {
      resourceId = req.params.id;
    } else if (req.body && req.body._id) {
      resourceId = req.body._id;
    }
    
    // Prepare details object
    const details = {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      ...options.details
    };
    
    // Add request body for sensitive operations (sanitized)
    if (options.includeBody && req.body) {
      const sanitizedBody = { ...req.body };
      
      // Remove sensitive fields
      delete sanitizedBody.password;
      delete sanitizedBody.confirmPassword;
      delete sanitizedBody.token;
      delete sanitizedBody.secret;
      
      details.requestBody = sanitizedBody;
    }
    
    // Add response data if needed
    if (options.includeResponse && responseData) {
      details.responseData = responseData;
    }
    
    const auditData = {
      user: userId,
      action,
      resource,
      resourceId,
      details,
      ipAddress,
      userAgent,
      sessionId,
      status,
      errorMessage,
      metadata: options.metadata || {}
    };
    
    await createAuditLog(auditData);
  } catch (error) {
    console.error('Error in audit logging:', error);
  }
};

// Specific audit middleware for different actions
const auditLogin = auditMiddleware('user_login', 'security', {
  includeBody: false,
  metadata: { type: 'authentication' }
});

const auditLogout = auditMiddleware('user_logout', 'security', {
  includeBody: false,
  metadata: { type: 'authentication' }
});

const auditProductCreate = auditMiddleware('product_create', 'product', {
  includeBody: true,
  includeResponse: true,
  metadata: { type: 'product_management' }
});

const auditProductUpdate = auditMiddleware('product_update', 'product', {
  includeBody: true,
  includeResponse: true,
  metadata: { type: 'product_management' }
});

const auditProductDelete = auditMiddleware('product_delete', 'product', {
  includeBody: false,
  includeResponse: true,
  metadata: { type: 'product_management' }
});

const auditOrderCreate = auditMiddleware('order_create', 'order', {
  includeBody: true,
  includeResponse: true,
  metadata: { type: 'order_management' }
});

const auditOrderUpdate = auditMiddleware('order_status_update', 'order', {
  includeBody: true,
  includeResponse: true,
  metadata: { type: 'order_management' }
});

const auditPayment = auditMiddleware('payment_success', 'payment', {
  includeBody: false,
  includeResponse: true,
  metadata: { type: 'payment_processing' }
});

const auditInventoryUpdate = auditMiddleware('inventory_update', 'inventory', {
  includeBody: true,
  includeResponse: true,
  metadata: { type: 'inventory_management' }
});

// Manual audit logging function for custom events
const logCustomEvent = async (req, action, resource, details = {}, options = {}) => {
  try {
    const userId = req.user ? req.user._id : null;
    const ipAddress = getClientIP(req);
    const userAgent = getUserAgent(req);
    const sessionId = getSessionId(req);
    
    const auditData = {
      user: userId,
      action,
      resource,
      details,
      ipAddress,
      userAgent,
      sessionId,
      status: options.status || 'success',
      errorMessage: options.errorMessage,
      metadata: options.metadata || {}
    };
    
    await createAuditLog(auditData);
  } catch (error) {
    console.error('Error in custom audit logging:', error);
  }
};

// Security event logging
const logSecurityEvent = async (req, action, details = {}) => {
  await logCustomEvent(req, action, 'security', details, {
    metadata: { type: 'security_event' }
  });
};

// System event logging
const logSystemEvent = async (action, details = {}, options = {}) => {
  try {
    const auditData = {
      user: null, // System events don't have a user
      action,
      resource: 'system',
      details,
      ipAddress: 'system',
      userAgent: 'system',
      sessionId: null,
      status: options.status || 'success',
      errorMessage: options.errorMessage,
      metadata: { type: 'system_event', ...options.metadata }
    };
    
    await createAuditLog(auditData);
  } catch (error) {
    console.error('Error in system audit logging:', error);
  }
};

// Failed login attempt logging
const logFailedLogin = async (req, email, reason) => {
  await logSecurityEvent(req, 'failed_login_attempt', {
    email,
    reason,
    timestamp: new Date()
  });
};

// Account lock/unlock logging
const logAccountLock = async (req, email, reason) => {
  await logSecurityEvent(req, 'account_locked', {
    email,
    reason,
    timestamp: new Date()
  });
};

const logAccountUnlock = async (req, email) => {
  await logSecurityEvent(req, 'account_unlocked', {
    email,
    timestamp: new Date()
  });
};

module.exports = {
  auditMiddleware,
  auditLogin,
  auditLogout,
  auditProductCreate,
  auditProductUpdate,
  auditProductDelete,
  auditOrderCreate,
  auditOrderUpdate,
  auditPayment,
  auditInventoryUpdate,
  logCustomEvent,
  logSecurityEvent,
  logSystemEvent,
  logFailedLogin,
  logAccountLock,
  logAccountUnlock,
  createAuditLog
}; 