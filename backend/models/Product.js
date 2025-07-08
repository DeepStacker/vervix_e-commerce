const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    maxlength: [100, 'Product name cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Product description is required'],
    maxlength: [2000, 'Product description cannot exceed 2000 characters']
  },
  shortDescription: {
    type: String,
    maxlength: [200, 'Short description cannot exceed 200 characters']
  },
  price: {
    type: Number,
    required: [true, 'Product price is required'],
    min: [0, 'Price cannot be negative']
  },
  comparePrice: {
    type: Number,
    min: [0, 'Compare price cannot be negative']
  },
  costPrice: {
    type: Number,
    min: [0, 'Cost price cannot be negative']
  },
  sku: {
    type: String,
    required: [true, 'SKU is required'],
    unique: true,
    uppercase: true,
    trim: true
  },
  barcode: {
    type: String,
    trim: true
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'Product category is required']
  },
  subcategory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  },
  brand: {
    type: String,
    required: [true, 'Brand is required'],
    trim: true
  },
  gender: {
    type: String,
    enum: ['men', 'women', 'unisex'],
    required: [true, 'Gender category is required'],
    lowercase: true
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  images: [{
    url: {
      type: String,
      required: true
    },
    alt: String,
    isPrimary: {
      type: Boolean,
      default: false
    },
    order: {
      type: Number,
      default: 0
    }
  }],
  variants: [{
    size: {
      type: String,
      required: true,
      enum: ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', '28', '30', '32', '34', '36', '38', '40', '42', '44', '46', '48', '50', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', 'ONE_SIZE'],
      uppercase: true
    },
    color: {
      type: String,
      required: true,
      trim: true
    },
    colorCode: {
      type: String,
      trim: true
    },
    material: {
      type: String,
      trim: true
    },
    weight: {
      type: Number,
      min: [0, 'Weight cannot be negative']
    },
    dimensions: {
      length: Number,
      width: Number,
      height: Number
    },
    stock: {
      type: Number,
      required: true,
      min: [0, 'Stock cannot be negative'],
      default: 0
    },
    reservedStock: {
      type: Number,
      default: 0,
      min: [0, 'Reserved stock cannot be negative']
    },
    availableStock: {
      type: Number,
      default: 0,
      min: [0, 'Available stock cannot be negative']
    },
    reorderPoint: {
      type: Number,
      default: 5,
      min: [0, 'Reorder point cannot be negative']
    },
    reorderQuantity: {
      type: Number,
      default: 10,
      min: [1, 'Reorder quantity must be at least 1']
    },
    price: {
      type: Number,
      min: [0, 'Variant price cannot be negative']
    },
    comparePrice: {
      type: Number,
      min: [0, 'Compare price cannot be negative']
    },
    costPrice: {
      type: Number,
      min: [0, 'Cost price cannot be negative']
    },
    sku: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true
    },
    barcode: {
      type: String,
      trim: true
    },
    images: [{
      url: String,
      alt: String,
      isPrimary: {
        type: Boolean,
        default: false
      }
    }],
    status: {
      type: String,
      enum: ['active', 'inactive', 'out_of_stock'],
      default: 'active'
    },
    lastStockUpdate: {
      type: Date,
      default: Date.now
    },
    lowStockAlert: {
      type: Boolean,
      default: false
    }
  }],
  inventory: {
    trackQuantity: {
      type: Boolean,
      default: true
    },
    continueSellingWhenOutOfStock: {
      type: Boolean,
      default: false
    },
    quantity: {
      type: Number,
      default: 0,
      min: [0, 'Inventory quantity cannot be negative']
    },
    reservedQuantity: {
      type: Number,
      default: 0,
      min: [0, 'Reserved quantity cannot be negative']
    },
    availableQuantity: {
      type: Number,
      default: 0,
      min: [0, 'Available quantity cannot be negative']
    },
    lowStockThreshold: {
      type: Number,
      default: 10,
      min: [0, 'Low stock threshold cannot be negative']
    },
    reorderPoint: {
      type: Number,
      default: 5,
      min: [0, 'Reorder point cannot be negative']
    },
    reorderQuantity: {
      type: Number,
      default: 10,
      min: [1, 'Reorder quantity must be at least 1']
    },
    lastStockUpdate: {
      type: Date,
      default: Date.now
    },
    lastReorderDate: Date,
    nextReorderDate: Date,
    supplier: {
      name: String,
      email: String,
      phone: String,
      leadTime: Number // in days
    },
    stockHistory: [{
      date: {
        type: Date,
        default: Date.now
      },
      type: {
        type: String,
        enum: ['in', 'out', 'adjustment', 'reserved', 'released']
      },
      quantity: Number,
      reason: String,
      reference: String, // order number, adjustment reason, etc.
      updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    }],
    lowStockAlerts: [{
      date: {
        type: Date,
        default: Date.now
      },
      variant: {
        size: String,
        color: String
      },
      currentStock: Number,
      threshold: Number,
      resolved: {
        type: Boolean,
        default: false
      },
      resolvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      resolvedAt: Date
    }]
  },
  shipping: {
    weight: {
      type: Number,
      min: [0, 'Weight cannot be negative']
    },
    dimensions: {
      length: Number,
      width: Number,
      height: Number
    },
    shippingClass: {
      type: String,
      enum: ['standard', 'express', 'overnight', 'free'],
      default: 'standard'
    },
    requiresShipping: {
      type: Boolean,
      default: true
    }
  },
  seo: {
    title: String,
    description: String,
    keywords: [String],
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true
    }
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'archived', 'draft'],
    default: 'draft'
  },
  featured: {
    type: Boolean,
    default: false
  },
  newArrival: {
    type: Boolean,
    default: false
  },
  bestseller: {
    type: Boolean,
    default: false
  },
  onSale: {
    type: Boolean,
    default: false
  },
  salePrice: {
    type: Number,
    min: [0, 'Sale price cannot be negative']
  },
  saleStartDate: Date,
  saleEndDate: Date,
  ratings: {
    average: {
      type: Number,
      default: 0,
      min: [0, 'Rating cannot be negative'],
      max: [5, 'Rating cannot exceed 5']
    },
    count: {
      type: Number,
      default: 0,
      min: [0, 'Rating count cannot be negative']
    }
  },
  reviews: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Review'
  }],
  relatedProducts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }],
  specifications: [{
    name: String,
    value: String
  }],
  careInstructions: String,
  materials: [String],
  origin: String,
  vendor: {
    type: String,
    default: 'Vervix'
  },
  publishedAt: Date,
  viewCount: {
    type: Number,
    default: 0
  },
  salesCount: {
    type: Number,
    default: 0
  },
  lastOrderDate: Date,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
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

// Virtual for total stock across all variants
productSchema.virtual('totalStock').get(function() {
  if (this.variants && this.variants.length > 0) {
    return this.variants.reduce((total, variant) => total + variant.stock, 0);
  }
  return this.inventory.quantity;
});

// Virtual for availability status
productSchema.virtual('isAvailable').get(function() {
  if (this.status !== 'active') return false;
  
  if (this.inventory.trackQuantity) {
    if (this.variants && this.variants.length > 0) {
      return this.variants.some(variant => variant.stock > 0);
    }
    return this.inventory.quantity > 0 || this.inventory.continueSellingWhenOutOfStock;
  }
  
  return true;
});

// Virtual for low stock status
productSchema.virtual('isLowStock').get(function() {
  if (this.variants && this.variants.length > 0) {
    return this.variants.some(variant => 
      variant.stock > 0 && variant.stock <= this.inventory.lowStockThreshold
    );
  }
  return this.inventory.quantity <= this.inventory.lowStockThreshold;
});

// Virtual for sale status
productSchema.virtual('isOnSale').get(function() {
  if (!this.onSale || !this.salePrice) return false;
  
  const now = new Date();
  if (this.saleStartDate && now < this.saleStartDate) return false;
  if (this.saleEndDate && now > this.saleEndDate) return false;
  
  return this.salePrice < this.price;
});

// Virtual for effective price
productSchema.virtual('effectivePrice').get(function() {
  return this.isOnSale ? this.salePrice : this.price;
});

// Virtual for discount percentage
productSchema.virtual('discountPercentage').get(function() {
  if (!this.isOnSale) return 0;
  return Math.round(((this.price - this.salePrice) / this.price) * 100);
});

// Pre-save middleware to generate slug
productSchema.pre('save', function(next) {
  if (this.isModified('name') || !this.seo.slug) {
    this.seo.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9 -]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim('-');
  }
  next();
});

// Pre-save middleware to set published date
productSchema.pre('save', function(next) {
  if (this.isModified('status') && this.status === 'active' && !this.publishedAt) {
    this.publishedAt = new Date();
  }
  next();
});

// Instance method to update ratings
productSchema.methods.updateRatings = async function() {
  const Review = mongoose.model('Review');
  const reviews = await Review.find({ product: this._id });
  
  if (reviews.length > 0) {
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    this.ratings.average = totalRating / reviews.length;
    this.ratings.count = reviews.length;
  } else {
    this.ratings.average = 0;
    this.ratings.count = 0;
  }
  
  await this.save();
};

// Instance method to increment view count
productSchema.methods.incrementViewCount = function() {
  this.viewCount += 1;
  return this.save();
};

// Instance method to update stock
productSchema.methods.updateStock = function(variantId, quantity, reason = 'manual', reference = null, userId = null) {
  if (variantId) {
    const variant = this.variants.id(variantId);
    if (variant) {
      const oldStock = variant.stock;
      variant.stock = Math.max(0, variant.stock + quantity);
      variant.availableStock = Math.max(0, variant.stock - variant.reservedStock);
      variant.lastStockUpdate = new Date();
      
      // Check for low stock alert
      if (variant.stock <= variant.reorderPoint && !variant.lowStockAlert) {
        variant.lowStockAlert = true;
        this.inventory.lowStockAlerts.push({
          variant: { size: variant.size, color: variant.color },
          currentStock: variant.stock,
          threshold: variant.reorderPoint
        });
      } else if (variant.stock > variant.reorderPoint && variant.lowStockAlert) {
        variant.lowStockAlert = false;
      }
      
      // Add to stock history
      this.inventory.stockHistory.push({
        type: quantity > 0 ? 'in' : 'out',
        quantity: Math.abs(quantity),
        reason,
        reference,
        updatedBy: userId
      });
    }
  } else {
    const oldStock = this.inventory.quantity;
    this.inventory.quantity = Math.max(0, this.inventory.quantity + quantity);
    this.inventory.availableQuantity = Math.max(0, this.inventory.quantity - this.inventory.reservedQuantity);
    this.inventory.lastStockUpdate = new Date();
    
    // Add to stock history
    this.inventory.stockHistory.push({
      type: quantity > 0 ? 'in' : 'out',
      quantity: Math.abs(quantity),
      reason,
      reference,
      updatedBy: userId
    });
  }
  
  return this.save();
};

// Instance method to reserve stock
productSchema.methods.reserveStock = function(variantId, quantity, orderId) {
  if (variantId) {
    const variant = this.variants.id(variantId);
    if (variant && variant.availableStock >= quantity) {
      variant.reservedStock += quantity;
      variant.availableStock = Math.max(0, variant.stock - variant.reservedStock);
      
      this.inventory.stockHistory.push({
        type: 'reserved',
        quantity,
        reason: 'Order reservation',
        reference: orderId
      });
      
      return this.save();
    }
    throw new Error('Insufficient available stock');
  } else {
    if (this.inventory.availableQuantity >= quantity) {
      this.inventory.reservedQuantity += quantity;
      this.inventory.availableQuantity = Math.max(0, this.inventory.quantity - this.inventory.reservedQuantity);
      
      this.inventory.stockHistory.push({
        type: 'reserved',
        quantity,
        reason: 'Order reservation',
        reference: orderId
      });
      
      return this.save();
    }
    throw new Error('Insufficient available stock');
  }
};

// Instance method to release reserved stock
productSchema.methods.releaseReservedStock = function(variantId, quantity, orderId) {
  if (variantId) {
    const variant = this.variants.id(variantId);
    if (variant && variant.reservedStock >= quantity) {
      variant.reservedStock -= quantity;
      variant.availableStock = Math.max(0, variant.stock - variant.reservedStock);
      
      this.inventory.stockHistory.push({
        type: 'released',
        quantity,
        reason: 'Order cancellation',
        reference: orderId
      });
      
      return this.save();
    }
    throw new Error('Insufficient reserved stock');
  } else {
    if (this.inventory.reservedQuantity >= quantity) {
      this.inventory.reservedQuantity -= quantity;
      this.inventory.availableQuantity = Math.max(0, this.inventory.quantity - this.inventory.reservedQuantity);
      
      this.inventory.stockHistory.push({
        type: 'released',
        quantity,
        reason: 'Order cancellation',
        reference: orderId
      });
      
      return this.save();
    }
    throw new Error('Insufficient reserved stock');
  }
};

// Instance method to check stock availability
productSchema.methods.checkStockAvailability = function(variantId, quantity) {
  if (variantId) {
    const variant = this.variants.id(variantId);
    if (!variant) return { available: false, reason: 'Variant not found' };
    
    if (variant.status !== 'active') {
      return { available: false, reason: 'Variant is not active' };
    }
    
    if (variant.availableStock >= quantity) {
      return { available: true, stock: variant.availableStock };
    } else {
      return { 
        available: false, 
        reason: 'Insufficient stock',
        availableStock: variant.availableStock,
        requestedQuantity: quantity
      };
    }
  } else {
    if (this.status !== 'active') {
      return { available: false, reason: 'Product is not active' };
    }
    
    if (this.inventory.availableQuantity >= quantity) {
      return { available: true, stock: this.inventory.availableQuantity };
    } else {
      return { 
        available: false, 
        reason: 'Insufficient stock',
        availableStock: this.inventory.availableQuantity,
        requestedQuantity: quantity
      };
    }
  }
};

// Instance method to get low stock variants
productSchema.methods.getLowStockVariants = function() {
  if (this.variants && this.variants.length > 0) {
    return this.variants.filter(variant => 
      variant.stock > 0 && variant.stock <= variant.reorderPoint
    );
  }
  return [];
};

// Instance method to generate reorder suggestions
productSchema.methods.generateReorderSuggestions = function() {
  const suggestions = [];
  
  if (this.variants && this.variants.length > 0) {
    this.variants.forEach(variant => {
      if (variant.stock <= variant.reorderPoint) {
        suggestions.push({
          variant: {
            size: variant.size,
            color: variant.color,
            sku: variant.sku
          },
          currentStock: variant.stock,
          reorderPoint: variant.reorderPoint,
          suggestedQuantity: variant.reorderQuantity,
          urgency: variant.stock === 0 ? 'critical' : 'low'
        });
      }
    });
  } else {
    if (this.inventory.quantity <= this.inventory.reorderPoint) {
      suggestions.push({
        product: this.name,
        sku: this.sku,
        currentStock: this.inventory.quantity,
        reorderPoint: this.inventory.reorderPoint,
        suggestedQuantity: this.inventory.reorderQuantity,
        urgency: this.inventory.quantity === 0 ? 'critical' : 'low'
      });
    }
  }
  
  return suggestions;
};

// Instance method to update variant status
productSchema.methods.updateVariantStatus = function(variantId, status) {
  const variant = this.variants.id(variantId);
  if (variant) {
    variant.status = status;
    if (status === 'out_of_stock') {
      variant.availableStock = 0;
    }
    return this.save();
  }
  throw new Error('Variant not found');
};

// Indexes for performance
productSchema.index({ status: 1, featured: 1 });
productSchema.index({ category: 1, status: 1 });
productSchema.index({ gender: 1, status: 1 });
productSchema.index({ 'seo.slug': 1 });
productSchema.index({ sku: 1 });
productSchema.index({ 'variants.sku': 1 });
productSchema.index({ tags: 1 });
productSchema.index({ price: 1 });
productSchema.index({ createdAt: -1 });
productSchema.index({ viewCount: -1 });
productSchema.index({ salesCount: -1 });
productSchema.index({ 'ratings.average': -1 });

// Text search index
productSchema.index({
  name: 'text',
  description: 'text',
  'seo.title': 'text',
  'seo.description': 'text',
  'seo.keywords': 'text',
  tags: 'text'
});

module.exports = mongoose.model('Product', productSchema);
