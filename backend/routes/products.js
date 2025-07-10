const express = require('express');
const mongoose = require('mongoose');
const Product = require('../models/Product');
const Category = require('../models/Category');
const { auth, adminAuth, optionalAuth } = require('../middleware/auth');
const { uploadProduct, uploadToCloudinary } = require('../middleware/upload');
const router = express.Router();

// @route   GET /api/products
// @desc    Get all products with advanced filtering, pagination, and search
// @access  Public
router.get('/', optionalAuth, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 12,
      category,
      gender,
      brand,
      minPrice,
      maxPrice,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      search,
      featured,
      onSale,
      newArrival,
      inStock = true,
      status = 'active'
    } = req.query;

    // Build query object
    const query = { status };

    // Category filter
    if (category) {
      if (mongoose.Types.ObjectId.isValid(category)) {
        query.category = category;
      } else {
        // Find category by name/slug
        const categoryDoc = await Category.findOne({
          $or: [
            { name: new RegExp(category, 'i') },
            { slug: category.toLowerCase() }
          ]
        });
        if (categoryDoc) query.category = categoryDoc._id;
      }
    }

    // Gender filter
    if (gender && ['men', 'women', 'unisex'].includes(gender.toLowerCase())) {
      query.gender = gender.toLowerCase();
    }

    // Brand filter
    if (brand) {
      query.brand = new RegExp(brand, 'i');
    }

    // Price range filter
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseFloat(minPrice);
      if (maxPrice) query.price.$lte = parseFloat(maxPrice);
    }

    // Feature filters
    if (featured === 'true') query.featured = true;
    if (onSale === 'true') query.onSale = true;
    if (newArrival === 'true') query.newArrival = true;

    // Stock filter
    if (inStock === 'true') {
      query.$or = [
        { 'inventory.quantity': { $gt: 0 } },
        { 'variants.stock': { $gt: 0 } }
      ];
    }

    // Search functionality
    if (search) {
      query.$text = { $search: search };
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const limitNum = parseInt(limit);

    // Sort options
    const sortOptions = {};
    if (search) {
      sortOptions.score = { $meta: 'textScore' };
    }
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Execute query
    const products = await Product.find(query)
      .populate('category', 'name slug')
      .select('-__v')
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNum)
      .lean();

    // Get total count for pagination
    const total = await Product.countDocuments(query);

    // Calculate pagination info
    const totalPages = Math.ceil(total / limitNum);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    // Transform products for response
    const transformedProducts = products.map(product => ({
      ...product,
      effectivePrice: product.isOnSale ? product.salePrice : product.price,
      discountPercentage: product.isOnSale 
        ? Math.round(((product.price - product.salePrice) / product.price) * 100) 
        : 0,
      isAvailable: product.status === 'active' && (
        product.inventory.quantity > 0 || 
        (product.variants && product.variants.some(v => v.stock > 0))
      )
    }));

   const data = [
  {
    "name": "Classic White T-Shirt",
    "description": "A soft cotton t-shirt ideal for everyday wear.",
    "shortDescription": "Soft cotton t-shirt.",
    "price": 29.99,
    "sku": "TSHIRT001",
    "gender": "unisex",
    "brand": "Vervix Essentials",
    "category": "64a7d9f5a05e49001234abcd",
    "tags": ["t-shirt", "white", "cotton"],
    "images": [
      {
        "url": "https://via.placeholder.com/400x600?text=White+T-Shirt",
        "alt": "Classic White T-Shirt",
        "isPrimary": true
      }
    ],
    "variants": [
      {
        "size": "M",
        "color": "White",
        "sku": "TSHIRT001-M",
        "stock": 100,
        "price": 29.99
      },
      {
        "size": "L",
        "color": "White",
        "sku": "TSHIRT001-L",
        "stock": 80,
        "price": 29.99
      }
    ],
    "inventory": {
      "quantity": 180,
      "availableQuantity": 180
    },
    "seo": {
      "title": "Classic White T-Shirt",
      "description": "Timeless white t-shirt for any wardrobe.",
      "keywords": ["t-shirt", "cotton", "basic"],
      "slug": "classic-white-t-shirt"
    },
    "status": "active"
  },
  {
    "name": "Slim Fit Blue Jeans",
    "description": "Fitted jeans in classic blue denim with modern style.",
    "price": 59.99,
    "sku": "JEANS001",
    "gender": "men",
    "brand": "Denim House",
    "category": "64a7d9f5a05e49001234abcd",
    "tags": ["jeans", "denim", "slim-fit"],
    "images": [
      {
        "url": "https://via.placeholder.com/400x600?text=Blue+Jeans",
        "alt": "Slim Fit Blue Jeans",
        "isPrimary": true
      }
    ],
    "variants": [
      {
        "size": "32",
        "color": "Blue",
        "sku": "JEANS001-32",
        "stock": 60,
        "price": 59.99
      },
      {
        "size": "34",
        "color": "Blue",
        "sku": "JEANS001-34",
        "stock": 40,
        "price": 59.99
      }
    ],
    "inventory": {
      "quantity": 100,
      "availableQuantity": 100
    },
    "seo": {
      "title": "Slim Fit Blue Jeans",
      "description": "Modern blue denim jeans for daily wear.",
      "keywords": ["jeans", "denim", "slim"],
      "slug": "slim-fit-blue-jeans"
    },
    "status": "active"
  },
  {
    "name": "Leather Crossbody Bag",
    "description": "Premium leather crossbody bag with adjustable strap.",
    "price": 119.99,
    "sku": "BAG001",
    "gender": "women",
    "brand": "Urban Vogue",
    "category": "64a7d9f5a05e49001234abcd",
    "tags": ["bag", "leather", "crossbody"],
    "images": [
      {
        "url": "https://via.placeholder.com/400x600?text=Leather+Bag",
        "alt": "Leather Crossbody Bag",
        "isPrimary": true
      }
    ],
    "variants": [
      {
        "size": "ONE_SIZE",
        "color": "Brown",
        "sku": "BAG001-BRN",
        "stock": 30,
        "price": 119.99
      }
    ],
    "inventory": {
      "quantity": 30,
      "availableQuantity": 30
    },
    "seo": {
      "title": "Leather Crossbody Bag",
      "description": "Elegant leather bag for stylish women.",
      "keywords": ["leather", "bag", "accessory"],
      "slug": "leather-crossbody-bag"
    },
    "status": "active"
  },
  {
    "name": "Oversized Hoodie",
    "description": "Warm oversized fleece hoodie for chilly evenings.",
    "price": 49.99,
    "sku": "HOODIE001",
    "gender": "unisex",
    "brand": "Chillwear",
    "category": "64a7d9f5a05e49001234abcd",
    "tags": ["hoodie", "fleece", "oversized"],
    "images": [
      {
        "url": "https://via.placeholder.com/400x600?text=Oversized+Hoodie",
        "alt": "Oversized Hoodie",
        "isPrimary": true
      }
    ],
    "variants": [
      {
        "size": "L",
        "color": "Gray",
        "sku": "HOODIE001-GRY-L",
        "stock": 75,
        "price": 49.99
      }
    ],
    "inventory": {
      "quantity": 75,
      "availableQuantity": 75
    },
    "seo": {
      "title": "Oversized Hoodie",
      "description": "Cozy and oversized for maximum comfort.",
      "keywords": ["hoodie", "oversized", "unisex"],
      "slug": "oversized-hoodie"
    },
    "status": "active"
  },
  {
    "name": "Formal Oxford Shoes",
    "description": "Elegant leather Oxford shoes for business and events.",
    "price": 99.99,
    "sku": "SHOE001",
    "gender": "men",
    "brand": "Gent & Co.",
    "category": "64a7d9f5a05e49001234abcd",
    "tags": ["oxford", "leather", "shoes"],
    "images": [
      {
        "url": "https://via.placeholder.com/400x600?text=Oxford+Shoes",
        "alt": "Formal Oxford Shoes",
        "isPrimary": true
      }
    ],
    "variants": [
      {
        "size": "10",
        "color": "Black",
        "sku": "SHOE001-BLK-10",
        "stock": 40,
        "price": 99.99
      }
    ],
    "inventory": {
      "quantity": 40,
      "availableQuantity": 40
    },
    "seo": {
      "title": "Formal Oxford Shoes",
      "description": "Polished style for formal wear.",
      "keywords": ["oxford", "formal", "leather"],
      "slug": "formal-oxford-shoes"
    },
    "status": "active"
  }
]


    res.json({
      success: true,
      data: data,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalProducts: total,
        hasNextPage,
        hasPrevPage,
        limit: limitNum
      },
      filters: {
        category,
        gender,
        brand,
        minPrice,
        maxPrice,
        search,
        featured,
        onSale,
        newArrival
      }
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch products',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   GET /api/products/featured
// @desc    Get featured products
// @access  Public
router.get('/featured', async (req, res) => {
  try {
    const { limit = 8 } = req.query;

    const products = await Product.find({
      status: 'active',
      featured: true
    })
      .populate('category', 'name slug')
      .select('-__v')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .lean();

    res.json({
      success: true,
      data: products
    });
  } catch (error) {
    console.error('Get featured products error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch featured products'
    });
  }
});

// @route   GET /api/products/bestsellers
// @desc    Get bestselling products
// @access  Public
router.get('/bestsellers', async (req, res) => {
  try {
    const { limit = 8 } = req.query;

    const products = await Product.find({
      status: 'active',
      bestseller: true
    })
      .populate('category', 'name slug')
      .select('-__v')
      .sort({ salesCount: -1 })
      .limit(parseInt(limit))
      .lean();

    res.json({
      success: true,
      data: products
    });
  } catch (error) {
    console.error('Get bestsellers error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch bestselling products'
    });
  }
});

// @route   GET /api/products/new-arrivals
// @desc    Get new arrival products
// @access  Public
router.get('/new-arrivals', async (req, res) => {
  try {
    const { limit = 8 } = req.query;

    const products = await Product.find({
      status: 'active',
      newArrival: true
    })
      .populate('category', 'name slug')
      .select('-__v')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .lean();

    res.json({
      success: true,
      data: products
    });
  } catch (error) {
    console.error('Get new arrivals error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch new arrivals'
    });
  }
});

// @route   GET /api/products/search
// @desc    Advanced product search with suggestions
// @access  Public
router.get('/search', async (req, res) => {
  try {
    const { q, limit = 10 } = req.query;

    if (!q || q.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Search query must be at least 2 characters long'
      });
    }

    // Text search
    const products = await Product.find({
      $text: { $search: q },
      status: 'active'
    })
      .populate('category', 'name slug')
      .select('name slug price salePrice onSale images brand category')
      .sort({ score: { $meta: 'textScore' } })
      .limit(parseInt(limit))
      .lean();

    // Get search suggestions
    const suggestions = await Product.aggregate([
      {
        $match: {
          status: 'active',
          $or: [
            { name: new RegExp(q, 'i') },
            { brand: new RegExp(q, 'i') },
            { tags: new RegExp(q, 'i') }
          ]
        }
      },
      {
        $group: {
          _id: null,
          brands: { $addToSet: '$brand' },
          tags: { $addToSet: { $unwind: '$tags' } }
        }
      }
    ]);

    res.json({
      success: true,
      data: products,
      suggestions: suggestions[0] || { brands: [], tags: [] },
      searchTerm: q
    });
  } catch (error) {
    console.error('Product search error:', error);
    res.status(500).json({
      success: false,
      message: 'Search failed'
    });
  }
});

// @route   GET /api/products/:id
// @desc    Get single product by ID or slug
// @access  Public
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;
    let query;

    // Check if id is MongoDB ObjectId or slug
    if (mongoose.Types.ObjectId.isValid(id)) {
      query = { _id: id };
    } else {
      query = { 'seo.slug': id };
    }

    const product = await Product.findOne(query)
      .populate('category', 'name slug')
      .populate('relatedProducts', 'name slug price salePrice onSale images')
      .select('-__v');

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Increment view count (don't await to not slow down response)
    Product.findByIdAndUpdate(product._id, { $inc: { viewCount: 1 } }).exec();

    // Get related products if not populated
    if (!product.relatedProducts || product.relatedProducts.length === 0) {
      const relatedProducts = await Product.find({
        category: product.category._id,
        _id: { $ne: product._id },
        status: 'active'
      })
        .select('name slug price salePrice onSale images')
        .limit(4)
        .lean();

      product.relatedProducts = relatedProducts;
    }

    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch product'
    });
  }
});

// @route   POST /api/products
// @desc    Create new product (Admin only)
// @access  Private/Admin
router.post('/', auth, adminAuth, uploadProduct.array('images', 10), async (req, res) => {
  try {
    const {
      name,
      description,
      shortDescription,
      price,
      comparePrice,
      costPrice,
      sku,
      barcode,
      category,
      subcategory,
      brand,
      gender,
      tags,
      variants,
      inventory,
      shipping,
      seo,
      specifications,
      careInstructions,
      materials,
      origin
    } = req.body;

    // Validate required fields
    if (!name || !description || !price || !sku || !category || !brand || !gender) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: name, description, price, sku, category, brand, gender'
      });
    }

    // Check if SKU already exists
    const existingSku = await Product.findOne({ sku: sku.toUpperCase() });
    if (existingSku) {
      return res.status(400).json({
        success: false,
        message: 'SKU already exists'
      });
    }

    // Validate category
    const categoryDoc = await Category.findById(category);
    if (!categoryDoc) {
      return res.status(400).json({
        success: false,
        message: 'Invalid category'
      });
    }

    // Upload images to Cloudinary
    const imageUploads = [];
    if (req.files && req.files.length > 0) {
      for (let i = 0; i < req.files.length; i++) {
        const file = req.files[i];
        try {
          const result = await uploadToCloudinary(file.buffer, 'products');
          imageUploads.push({
            url: result.secure_url,
            alt: `${name} - Image ${i + 1}`,
            isPrimary: i === 0,
            order: i
          });
        } catch (uploadError) {
          console.error('Image upload error:', uploadError);
        }
      }
    }

    // Create product
    const product = new Product({
      name,
      description,
      shortDescription,
      price: parseFloat(price),
      comparePrice: comparePrice ? parseFloat(comparePrice) : undefined,
      costPrice: costPrice ? parseFloat(costPrice) : undefined,
      sku: sku.toUpperCase(),
      barcode,
      category,
      subcategory,
      brand,
      gender: gender.toLowerCase(),
      tags: tags ? JSON.parse(tags) : [],
      images: imageUploads,
      variants: variants ? JSON.parse(variants) : [],
      inventory: inventory ? JSON.parse(inventory) : {},
      shipping: shipping ? JSON.parse(shipping) : {},
      seo: seo ? JSON.parse(seo) : {},
      specifications: specifications ? JSON.parse(specifications) : [],
      careInstructions,
      materials: materials ? JSON.parse(materials) : [],
      origin,
      createdBy: req.user._id,
      status: 'draft' // Start as draft
    });

    await product.save();

    // Populate category info
    await product.populate('category', 'name slug');

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: product
    });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create product',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   PUT /api/products/:id
// @desc    Update product (Admin only)
// @access  Private/Admin
router.put('/:id', auth, adminAuth, uploadProduct.array('images', 10), async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    // Parse JSON fields
    ['tags', 'variants', 'inventory', 'shipping', 'seo', 'specifications', 'materials'].forEach(field => {
      if (updateData[field] && typeof updateData[field] === 'string') {
        try {
          updateData[field] = JSON.parse(updateData[field]);
        } catch (e) {
          delete updateData[field];
        }
      }
    });

    // Handle new image uploads
    if (req.files && req.files.length > 0) {
      const imageUploads = [];
      for (let i = 0; i < req.files.length; i++) {
        const file = req.files[i];
        try {
          const result = await uploadToCloudinary(file.buffer, 'products');
          imageUploads.push({
            url: result.secure_url,
            alt: `${updateData.name || 'Product'} - Image ${i + 1}`,
            isPrimary: i === 0,
            order: i
          });
        } catch (uploadError) {
          console.error('Image upload error:', uploadError);
        }
      }
      
      if (imageUploads.length > 0) {
        updateData.images = imageUploads;
      }
    }

    updateData.updatedBy = req.user._id;

    const product = await Product.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('category', 'name slug');

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.json({
      success: true,
      message: 'Product updated successfully',
      data: product
    });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update product',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   DELETE /api/products/:id
// @desc    Delete product (Admin only)
// @access  Private/Admin
router.delete('/:id', auth, adminAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findByIdAndDelete(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete product'
    });
  }
});

// @route   PUT /api/products/:id/status
// @desc    Update product status (Admin only)
// @access  Private/Admin
router.put('/:id/status', auth, adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['active', 'inactive', 'archived', 'draft'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    const product = await Product.findByIdAndUpdate(
      id,
      { 
        status,
        publishedAt: status === 'active' ? new Date() : undefined,
        updatedBy: req.user._id
      },
      { new: true }
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.json({
      success: true,
      message: `Product ${status} successfully`,
      data: product
    });
  } catch (error) {
    console.error('Update product status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update product status'
    });
  }
});

// @route   PUT /api/products/:id/stock
// @desc    Update product stock (Admin only)
// @access  Private/Admin
router.put('/:id/stock', auth, adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { variantId, quantity, operation = 'set' } = req.body;

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    if (variantId) {
      // Update variant stock
      const variant = product.variants.id(variantId);
      if (!variant) {
        return res.status(404).json({
          success: false,
          message: 'Variant not found'
        });
      }

      switch (operation) {
        case 'set':
          variant.stock = parseInt(quantity);
          break;
        case 'add':
          variant.stock += parseInt(quantity);
          break;
        case 'subtract':
          variant.stock = Math.max(0, variant.stock - parseInt(quantity));
          break;
      }
    } else {
      // Update main inventory
      switch (operation) {
        case 'set':
          product.inventory.quantity = parseInt(quantity);
          break;
        case 'add':
          product.inventory.quantity += parseInt(quantity);
          break;
        case 'subtract':
          product.inventory.quantity = Math.max(0, product.inventory.quantity - parseInt(quantity));
          break;
      }
    }

    await product.save();

    res.json({
      success: true,
      message: 'Stock updated successfully',
      data: product
    });
  } catch (error) {
    console.error('Update stock error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update stock'
    });
  }
});

// @route   GET /api/products/analytics/overview
// @desc    Get products analytics overview (Admin only)
// @access  Private/Admin
router.get('/analytics/overview', auth, adminAuth, async (req, res) => {
  try {
    const [
      totalProducts,
      activeProducts,
      outOfStockProducts,
      lowStockProducts,
      draftProducts
    ] = await Promise.all([
      Product.countDocuments(),
      Product.countDocuments({ status: 'active' }),
      Product.countDocuments({
        $or: [
          { 'inventory.quantity': 0 },
          { 'variants.stock': { $not: { $gt: 0 } } }
        ]
      }),
      Product.countDocuments({
        $or: [
          { 'inventory.quantity': { $lte: 10, $gt: 0 } },
          { 'variants.stock': { $lte: 10, $gt: 0 } }
        ]
      }),
      Product.countDocuments({ status: 'draft' })
    ]);

    // Top performing products
    const topProducts = await Product.find({ status: 'active' })
      .sort({ salesCount: -1, viewCount: -1 })
      .limit(5)
      .select('name salesCount viewCount price')
      .lean();

    res.json({
      success: true,
      data: {
        overview: {
          totalProducts,
          activeProducts,
          outOfStockProducts,
          lowStockProducts,
          draftProducts
        },
        topProducts
      }
    });
  } catch (error) {
    console.error('Products analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch analytics'
    });
  }
});

module.exports = router;
