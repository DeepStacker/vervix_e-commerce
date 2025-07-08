const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { logFailedLogin, logAccountLock, logAccountUnlock } = require('./audit');

// Middleware to verify JWT token
const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid token' });
    }

    if (!user.isActive) {
      return res.status(401).json({ message: 'Account has been deactivated' });
    }

    // Check if account is locked
    if (user.isLocked) {
      return res.status(423).json({ 
        message: 'Account is temporarily locked due to multiple failed login attempts. Please try again later or contact support.',
        lockUntil: user.lockUntil
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token has expired' });
    }
    res.status(401).json({ success: false, message: 'Invalid token' });
  }
};

// Enhanced login authentication with account lockout
const loginAuth = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    
    if (!user) {
      await logFailedLogin(req, email, 'User not found');
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Check if account is locked
    if (user.isLocked) {
      const lockTimeRemaining = user.lockUntil - Date.now();
      if (lockTimeRemaining > 0) {
        return res.status(423).json({ 
          message: 'Account is temporarily locked due to multiple failed login attempts',
          lockUntil: user.lockUntil,
          lockTimeRemaining: Math.ceil(lockTimeRemaining / 1000 / 60) // minutes remaining
        });
      } else {
        // Unlock account if lock time has expired
        await user.resetLoginAttempts();
        await logAccountUnlock(req, email);
      }
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    
    if (!isPasswordValid) {
      // Increment failed login attempts
      await user.incLoginAttempts();
      
      await logFailedLogin(req, email, 'Invalid password');
      
      // Check if account should be locked
      if (user.loginAttempts >= 5) {
        await logAccountLock(req, email, 'Too many failed login attempts');
        return res.status(423).json({ 
          message: 'Account has been locked due to multiple failed login attempts. Please try again in 2 hours.',
          lockUntil: user.lockUntil
        });
      }
      
      return res.status(401).json({ 
        message: 'Invalid email or password',
        remainingAttempts: 5 - user.loginAttempts
      });
    }

    // Reset login attempts on successful login
    if (user.loginAttempts > 0) {
      await user.resetLoginAttempts();
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    req.user = user;
    next();
  } catch (error) {
    console.error('Login authentication error:', error);
    res.status(500).json({ message: 'Server error during authentication' });
  }
};

// Middleware to check if user is admin
const adminAuth = async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
    }
    next();
  } catch (error) {
    res.status(500).json({ message: 'Server error in admin authentication' });
  }
};

// Middleware to check if user is owner or admin
const ownerOrAdmin = (req, res, next) => {
  try {
    const resourceUserId = req.params.userId || req.body.userId || req.query.userId;
    
    if (req.user.role === 'admin' || req.user._id.toString() === resourceUserId) {
      next();
    } else {
      res.status(403).json({ message: 'Access denied. You can only access your own resources.' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error in authorization' });
  }
};

// Optional auth middleware (doesn't fail if no token)
const optionalAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');
      
      if (user && user.isActive && !user.isLocked) {
        req.user = user;
      }
    }
    
    next();
  } catch (error) {
    // Continue without user if token is invalid
    next();
  }
};

// Rate limiting middleware for sensitive operations
const sensitiveOperationLimit = (maxAttempts = 5, windowMs = 15 * 60 * 1000) => {
  const attempts = new Map();
  
  return (req, res, next) => {
    const key = req.ip;
    const now = Date.now();
    
    if (!attempts.has(key)) {
      attempts.set(key, { count: 0, resetTime: now + windowMs });
    }
    
    const attempt = attempts.get(key);
    
    if (now > attempt.resetTime) {
      attempt.count = 0;
      attempt.resetTime = now + windowMs;
    }
    
    attempt.count++;
    
    if (attempt.count > maxAttempts) {
      return res.status(429).json({
        message: `Too many attempts. Please try again in ${Math.ceil((attempt.resetTime - now) / 1000 / 60)} minutes.`
      });
    }
    
    next();
  };
};

// Password strength validation middleware
const validatePasswordStrength = (req, res, next) => {
  const { password } = req.body;
  
  if (!password) {
    return res.status(400).json({ message: 'Password is required' });
  }
  
  // Password strength requirements
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  
  const errors = [];
  
  if (password.length < minLength) {
    errors.push(`Password must be at least ${minLength} characters long`);
  }
  if (!hasUpperCase) {
    errors.push('Password must contain at least one uppercase letter');
  }
  if (!hasLowerCase) {
    errors.push('Password must contain at least one lowercase letter');
  }
  if (!hasNumbers) {
    errors.push('Password must contain at least one number');
  }
  if (!hasSpecialChar) {
    errors.push('Password must contain at least one special character');
  }
  
  if (errors.length > 0) {
    return res.status(400).json({
      message: 'Password does not meet security requirements',
      errors
    });
  }
  
  next();
};

// Email validation middleware
const validateEmail = (req, res, next) => {
  const { email } = req.body;
  
  if (!email) {
    return res.status(400).json({ message: 'Email is required' });
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!emailRegex.test(email)) {
    return res.status(400).json({ message: 'Please provide a valid email address' });
  }
  
  next();
};

// Input sanitization middleware
const sanitizeInput = (req, res, next) => {
  // Sanitize string inputs
  const sanitizeString = (str) => {
    if (typeof str !== 'string') return str;
    return str
      .trim()
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+=/gi, ''); // Remove event handlers
  };
  
  // Recursively sanitize object
  const sanitizeObject = (obj) => {
    if (typeof obj !== 'object' || obj === null) return obj;
    
    if (Array.isArray(obj)) {
      return obj.map(sanitizeObject);
    }
    
    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        sanitized[key] = sanitizeString(value);
      } else if (typeof value === 'object') {
        sanitized[key] = sanitizeObject(value);
      } else {
        sanitized[key] = value;
      }
    }
    return sanitized;
  };
  
  // Sanitize request body, query, and params
  if (req.body) req.body = sanitizeObject(req.body);
  if (req.query) req.query = sanitizeObject(req.query);
  if (req.params) req.params = sanitizeObject(req.params);
  
  next();
};

module.exports = {
  auth,
  loginAuth,
  adminAuth,
  ownerOrAdmin,
  optionalAuth,
  sensitiveOperationLimit,
  validatePasswordStrength,
  validateEmail,
  sanitizeInput
};
