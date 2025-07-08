const mongoose = require('mongoose');

const contentSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['banner', 'promotion', 'page', 'announcement', 'faq'],
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true,
    trim: true
  },
  content: {
    type: String,
    required: true
  },
  excerpt: {
    type: String,
    maxlength: [500, 'Excerpt cannot exceed 500 characters']
  },
  images: [{
    url: {
      type: String,
      required: true
    },
    alt: String,
    caption: String,
    order: {
      type: Number,
      default: 0
    }
  }],
  // Banner specific fields
  banner: {
    position: {
      type: String,
      enum: ['hero', 'top', 'bottom', 'sidebar'],
      default: 'hero'
    },
    backgroundColor: String,
    textColor: String,
    ctaText: String,
    ctaUrl: String,
    ctaColor: String,
    startDate: Date,
    endDate: Date,
    isActive: {
      type: Boolean,
      default: true
    }
  },
  // Promotion specific fields
  promotion: {
    type: {
      type: String,
      enum: ['discount', 'free_shipping', 'buy_one_get_one', 'flash_sale', 'clearance'],
      required: false
    },
    discountType: {
      type: String,
      enum: ['percentage', 'fixed', 'free_shipping'],
      required: false
    },
    discountValue: {
      type: Number,
      min: [0, 'Discount value cannot be negative']
    },
    minimumOrder: {
      type: Number,
      min: [0, 'Minimum order cannot be negative']
    },
    applicableProducts: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product'
    }],
    applicableCategories: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category'
    }],
    startDate: Date,
    endDate: Date,
    isActive: {
      type: Boolean,
      default: true
    },
    usageLimit: {
      type: Number,
      min: [0, 'Usage limit cannot be negative']
    },
    usedCount: {
      type: Number,
      default: 0,
      min: [0, 'Used count cannot be negative']
    }
  },
  // Page specific fields
  page: {
    template: {
      type: String,
      enum: ['default', 'about', 'contact', 'privacy', 'terms', 'custom'],
      default: 'default'
    },
    metaTitle: String,
    metaDescription: String,
    metaKeywords: [String],
    isPublished: {
      type: Boolean,
      default: false
    },
    publishedAt: Date,
    featuredImage: String
  },
  // FAQ specific fields
  faq: {
    category: {
      type: String,
      enum: ['general', 'shipping', 'returns', 'payment', 'account', 'products'],
      default: 'general'
    },
    order: {
      type: Number,
      default: 0
    },
    isPublished: {
      type: Boolean,
      default: true
    }
  },
  // Common fields
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft'
  },
  priority: {
    type: Number,
    default: 0,
    min: [0, 'Priority cannot be negative']
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  seo: {
    title: String,
    description: String,
    keywords: [String],
    canonicalUrl: String
  },
  settings: {
    showOnMobile: {
      type: Boolean,
      default: true
    },
    showOnDesktop: {
      type: Boolean,
      default: true
    },
    requireLogin: {
      type: Boolean,
      default: false
    },
    targetAudience: {
      type: String,
      enum: ['all', 'new_customers', 'returning_customers', 'vip_customers'],
      default: 'all'
    }
  },
  analytics: {
    views: {
      type: Number,
      default: 0
    },
    clicks: {
      type: Number,
      default: 0
    },
    conversions: {
      type: Number,
      default: 0
    },
    lastViewed: Date
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for formatted slug
contentSchema.virtual('formattedSlug').get(function() {
  return this.slug || this.title
    .toLowerCase()
    .replace(/[^a-z0-9 -]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim('-');
});

// Virtual for is active based on dates
contentSchema.virtual('isActiveByDate').get(function() {
  const now = new Date();
  
  if (this.type === 'banner' && this.banner) {
    if (this.banner.startDate && now < this.banner.startDate) return false;
    if (this.banner.endDate && now > this.banner.endDate) return false;
    return this.banner.isActive;
  }
  
  if (this.type === 'promotion' && this.promotion) {
    if (this.promotion.startDate && now < this.promotion.startDate) return false;
    if (this.promotion.endDate && now > this.promotion.endDate) return false;
    return this.promotion.isActive;
  }
  
  return this.status === 'published';
});

// Virtual for click-through rate
contentSchema.virtual('ctr').get(function() {
  if (this.analytics.views === 0) return 0;
  return ((this.analytics.clicks / this.analytics.views) * 100).toFixed(2);
});

// Virtual for conversion rate
contentSchema.virtual('conversionRate').get(function() {
  if (this.analytics.clicks === 0) return 0;
  return ((this.analytics.conversions / this.analytics.clicks) * 100).toFixed(2);
});

// Pre-save middleware to generate slug
contentSchema.pre('save', function(next) {
  if (this.isModified('title') || !this.slug) {
    this.slug = this.formattedSlug;
  }
  next();
});

// Pre-save middleware to set published date
contentSchema.pre('save', function(next) {
  if (this.isModified('status') && this.status === 'published' && !this.page?.publishedAt) {
    if (this.page) {
      this.page.publishedAt = new Date();
    }
  }
  next();
});

// Instance method to increment views
contentSchema.methods.incrementViews = function() {
  this.analytics.views += 1;
  this.analytics.lastViewed = new Date();
  return this.save();
};

// Instance method to increment clicks
contentSchema.methods.incrementClicks = function() {
  this.analytics.clicks += 1;
  return this.save();
};

// Instance method to increment conversions
contentSchema.methods.incrementConversions = function() {
  this.analytics.conversions += 1;
  return this.save();
};

// Instance method to check if promotion is valid
contentSchema.methods.isPromotionValid = function() {
  if (this.type !== 'promotion') return false;
  
  const now = new Date();
  
  if (this.promotion.startDate && now < this.promotion.startDate) return false;
  if (this.promotion.endDate && now > this.promotion.endDate) return false;
  if (!this.promotion.isActive) return false;
  
  if (this.promotion.usageLimit && this.promotion.usedCount >= this.promotion.usageLimit) {
    return false;
  }
  
  return true;
};

// Static method to get active banners
contentSchema.statics.getActiveBanners = function(position = null) {
  const query = {
    type: 'banner',
    status: 'published',
    'banner.isActive': true
  };
  
  if (position) {
    query['banner.position'] = position;
  }
  
  const now = new Date();
  query.$and = [
    { $or: [{ 'banner.startDate': { $exists: false } }, { 'banner.startDate': { $lte: now } }] },
    { $or: [{ 'banner.endDate': { $exists: false } }, { 'banner.endDate': { $gte: now } }] }
  ];
  
  return this.find(query)
    .sort({ priority: -1, createdAt: -1 });
};

// Static method to get active promotions
contentSchema.statics.getActivePromotions = function() {
  const now = new Date();
  
  return this.find({
    type: 'promotion',
    status: 'published',
    'promotion.isActive': true,
    $and: [
      { $or: [{ 'promotion.startDate': { $exists: false } }, { 'promotion.startDate': { $lte: now } }] },
      { $or: [{ 'promotion.endDate': { $exists: false } }, { 'promotion.endDate': { $gte: now } }] },
      {
        $or: [
          { 'promotion.usageLimit': { $exists: false } },
          { $expr: { $lt: ['$promotion.usedCount', '$promotion.usageLimit'] } }
        ]
      }
    ]
  }).sort({ priority: -1, createdAt: -1 });
};

// Static method to get published pages
contentSchema.statics.getPublishedPages = function() {
  return this.find({
    type: 'page',
    status: 'published',
    'page.isPublished': true
  }).sort({ priority: -1, createdAt: -1 });
};

// Static method to get FAQ by category
contentSchema.statics.getFAQByCategory = function(category = 'general') {
  return this.find({
    type: 'faq',
    status: 'published',
    'faq.isPublished': true,
    'faq.category': category
  }).sort({ 'faq.order': 1, createdAt: -1 });
};

// Indexes for performance
contentSchema.index({ type: 1, status: 1 });
contentSchema.index({ slug: 1 });
contentSchema.index({ 'banner.position': 1, 'banner.isActive': 1 });
contentSchema.index({ 'promotion.isActive': 1, 'promotion.startDate': 1, 'promotion.endDate': 1 });
contentSchema.index({ 'faq.category': 1, 'faq.isPublished': 1 });
contentSchema.index({ tags: 1 });
contentSchema.index({ createdAt: -1 });
contentSchema.index({ priority: -1 });

// Text search index
contentSchema.index({
  title: 'text',
  content: 'text',
  excerpt: 'text',
  'seo.title': 'text',
  'seo.description': 'text',
  'seo.keywords': 'text',
  tags: 'text'
});

module.exports = mongoose.model('Content', contentSchema); 