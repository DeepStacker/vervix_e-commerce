const express = require('express');
const mongoose = require('mongoose');
const Category = require('../models/Category');
const Product = require('../models/Product');
const { auth, adminAuth } = require('../middleware/auth');
const { uploadCategory, deleteFromCloudinary } = require('../middleware/upload');
const router = express.Router();

// @route   GET /api/categories
// @desc    Get all categories with optional tree structure
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { tree = false, active = true } = req.query;

    let query = {};
    if (active === 'true') {
      query.isActive = true;
    }

    if (tree === 'true') {
      // Get category tree structure
      const categories = await Category.getCategoryTree();
      return res.json({
        success: true,
        data: categories
      });
    }

    // Get flat list of categories
    const categories = await Category.find(query)
      .sort({ sortOrder: 1, name: 1 })
      .populate('parent', 'name slug')
      .select('-__v')
      .lean();

    // Add product counts for each category
    const categoriesWithCounts = await Promise.all(
      categories.map(async (category) => {
        const productCount = await Product.countDocuments({
          category: category._id,
          status: 'active'
        });
        return {
          ...category,
          productCount
        };
      })
    );

    res.json({
      success: true,
      data: categoriesWithCounts
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch categories'
    });
  }
});

// @route   GET /api/categories/featured
// @desc    Get featured categories
// @access  Public
router.get('/featured', async (req, res) => {
  try {
    const { limit = 6 } = req.query;

    const categories = await Category.find({
      isActive: true,
      isFeatured: true
    })
      .sort({ sortOrder: 1 })
      .limit(parseInt(limit))
      .select('-__v')
      .lean();

    // Add product counts
    const categoriesWithCounts = await Promise.all(
      categories.map(async (category) => {
        const productCount = await Product.countDocuments({
          category: category._id,
          status: 'active'
        });
        return {
          ...category,
          productCount
        };
      })
    );

    res.json({
      success: true,
      data: categoriesWithCounts
    });
  } catch (error) {
    console.error('Get featured categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch featured categories'
    });
  }
});

// @route   GET /api/categories/:id
// @desc    Get single category by ID or slug
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    let query;

    // Check if id is MongoDB ObjectId or slug
    if (mongoose.Types.ObjectId.isValid(id)) {
      query = { _id: id };
    } else {
      query = { slug: id };
    }

    const category = await Category.findOne(query)
      .populate('parent', 'name slug')
      .populate('children')
      .select('-__v');

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Get products in this category
    const products = await Product.find({
      category: category._id,
      status: 'active'
    })
      .select('name slug price salePrice onSale images')
      .sort({ createdAt: -1 })
      .limit(12)
      .lean();

    // Update product count
    await category.updateProductCount();

    res.json({
      success: true,
      data: {
        ...category.toObject(),
        products
      }
    });
  } catch (error) {
    console.error('Get category error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch category'
    });
  }
});

// @route   POST /api/categories
// @desc    Create new category (Admin only)
// @access  Private/Admin
router.post('/', auth, adminAuth, uploadCategory.single('image'), async (req, res) => {
  try {
    const {
      name,
      description,
      parent,
      color,
      icon,
      isFeatured,
      sortOrder,
      seo
    } = req.body;

    // Validate required fields
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Category name is required'
      });
    }

    // Check if category name already exists
    const existingCategory = await Category.findOne({ 
      name: new RegExp(`^${name}$`, 'i') 
    });
    if (existingCategory) {
      return res.status(400).json({
        success: false,
        message: 'Category name already exists'
      });
    }

    // Validate parent category if provided
    if (parent) {
      const parentCategory = await Category.findById(parent);
      if (!parentCategory) {
        return res.status(400).json({
          success: false,
          message: 'Invalid parent category'
        });
      }

      // Check nesting level (max 3 levels)
      if (parentCategory.level >= 2) {
        return res.status(400).json({
          success: false,
          message: 'Maximum category nesting level exceeded'
        });
      }
    }

    // Handle image upload
    let imageData = {};
    if (req.file) {
      imageData = {
        url: req.file.path,
        alt: `${name} category image`
      };
    }

    // Create category
    const category = new Category({
      name,
      description,
      parent: parent || null,
      color: color || '#000000',
      icon,
      image: Object.keys(imageData).length > 0 ? imageData : undefined,
      isFeatured: isFeatured === 'true',
      sortOrder: sortOrder ? parseInt(sortOrder) : 0,
      seo: seo ? JSON.parse(seo) : {}
    });

    await category.save();

    // Populate parent info
    await category.populate('parent', 'name slug');

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: category
    });
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create category',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   PUT /api/categories/:id
// @desc    Update category (Admin only)
// @access  Private/Admin
router.put('/:id', auth, adminAuth, uploadCategory.single('image'), async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    // Parse JSON fields
    if (updateData.seo && typeof updateData.seo === 'string') {
      try {
        updateData.seo = JSON.parse(updateData.seo);
      } catch (e) {
        delete updateData.seo;
      }
    }

    // Convert string booleans
    if (updateData.isFeatured) {
      updateData.isFeatured = updateData.isFeatured === 'true';
    }
    if (updateData.isActive) {
      updateData.isActive = updateData.isActive === 'true';
    }

    // Handle image upload
    if (req.file) {
      updateData.image = {
        url: req.file.path,
        alt: `${updateData.name || 'Category'} image`
      };
    }

    // Validate parent category if being updated
    if (updateData.parent) {
      const parentCategory = await Category.findById(updateData.parent);
      if (!parentCategory) {
        return res.status(400).json({
          success: false,
          message: 'Invalid parent category'
        });
      }

      // Prevent circular references
      if (updateData.parent === id) {
        return res.status(400).json({
          success: false,
          message: 'Category cannot be its own parent'
        });
      }

      // Check if new parent would create a circular reference
      let checkParent = parentCategory;
      while (checkParent.parent) {
        if (checkParent.parent.toString() === id) {
          return res.status(400).json({
            success: false,
            message: 'Circular reference detected'
          });
        }
        checkParent = await Category.findById(checkParent.parent);
        if (!checkParent) break;
      }
    }

    const category = await Category.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('parent', 'name slug');

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    res.json({
      success: true,
      message: 'Category updated successfully',
      data: category
    });
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update category',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   DELETE /api/categories/:id
// @desc    Delete category (Admin only)
// @access  Private/Admin
router.delete('/:id', auth, adminAuth, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if category has products
    const productCount = await Product.countDocuments({ category: id });
    if (productCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete category with ${productCount} products. Move or delete products first.`
      });
    }

    // Check if category has children
    const childrenCount = await Category.countDocuments({ parent: id });
    if (childrenCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete category with ${childrenCount} subcategories. Delete subcategories first.`
      });
    }

    const category = await Category.findByIdAndDelete(id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    res.json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete category'
    });
  }
});

// @route   PUT /api/categories/:id/reorder
// @desc    Update category sort order (Admin only)
// @access  Private/Admin
router.put('/:id/reorder', auth, adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { newOrder, parentId } = req.body;

    // Get all categories at the same level
    const siblings = await Category.find({ 
      parent: parentId || null 
    }).sort({ sortOrder: 1 });

    // Update sort orders
    const updates = siblings.map((category, index) => {
      let order;
      if (category._id.toString() === id) {
        order = parseInt(newOrder);
      } else if (index < newOrder) {
        order = index;
      } else {
        order = index + 1;
      }

      return Category.findByIdAndUpdate(category._id, { sortOrder: order });
    });

    await Promise.all(updates);

    res.json({
      success: true,
      message: 'Category order updated successfully'
    });
  } catch (error) {
    console.error('Reorder category error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reorder category'
    });
  }
});

// @route   PUT /api/categories/:id/toggle-status
// @desc    Toggle category active status (Admin only)
// @access  Private/Admin
router.put('/:id/toggle-status', auth, adminAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    category.isActive = !category.isActive;
    await category.save();

    res.json({
      success: true,
      message: `Category ${category.isActive ? 'activated' : 'deactivated'} successfully`,
      data: category
    });
  } catch (error) {
    console.error('Toggle category status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle category status'
    });
  }
});

// @route   PUT /api/categories/:id/toggle-featured
// @desc    Toggle category featured status (Admin only)
// @access  Private/Admin
router.put('/:id/toggle-featured', auth, adminAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    category.isFeatured = !category.isFeatured;
    await category.save();

    res.json({
      success: true,
      message: `Category ${category.isFeatured ? 'marked as featured' : 'removed from featured'} successfully`,
      data: category
    });
  } catch (error) {
    console.error('Toggle category featured error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle category featured status'
    });
  }
});

// @route   GET /api/categories/:id/products
// @desc    Get products in a specific category with pagination
// @access  Public
router.get('/:id/products', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      page = 1,
      limit = 12,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      minPrice,
      maxPrice,
      brand,
      onSale,
      inStock = true
    } = req.query;

    // Find category
    let category;
    if (mongoose.Types.ObjectId.isValid(id)) {
      category = await Category.findById(id);
    } else {
      category = await Category.findOne({ slug: id });
    }

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Build product query
    const query = { 
      category: category._id, 
      status: 'active'
    };

    // Price range filter
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseFloat(minPrice);
      if (maxPrice) query.price.$lte = parseFloat(maxPrice);
    }

    // Brand filter
    if (brand) {
      query.brand = new RegExp(brand, 'i');
    }

    // Sale filter
    if (onSale === 'true') {
      query.onSale = true;
    }

    // Stock filter
    if (inStock === 'true') {
      query.$or = [
        { 'inventory.quantity': { $gt: 0 } },
        { 'variants.stock': { $gt: 0 } }
      ];
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const limitNum = parseInt(limit);

    // Sort options
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Execute query
    const products = await Product.find(query)
      .select('-__v')
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNum)
      .lean();

    // Get total count
    const total = await Product.countDocuments(query);

    // Calculate pagination info
    const totalPages = Math.ceil(total / limitNum);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    res.json({
      success: true,
      data: {
        category: {
          _id: category._id,
          name: category.name,
          slug: category.slug,
          description: category.description
        },
        products,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalProducts: total,
          hasNextPage,
          hasPrevPage,
          limit: limitNum
        }
      }
    });
  } catch (error) {
    console.error('Get category products error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch category products'
    });
  }
});

// @route   GET /api/categories/analytics/overview
// @desc    Get categories analytics overview (Admin only)
// @access  Private/Admin
router.get('/analytics/overview', auth, adminAuth, async (req, res) => {
  try {
    const [
      totalCategories,
      activeCategories,
      featuredCategories,
      parentCategories,
      childCategories
    ] = await Promise.all([
      Category.countDocuments(),
      Category.countDocuments({ isActive: true }),
      Category.countDocuments({ isFeatured: true }),
      Category.countDocuments({ parent: null }),
      Category.countDocuments({ parent: { $ne: null } })
    ]);

    // Category performance
    const categoryPerformance = await Category.aggregate([
      { $match: { isActive: true } },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: 'category',
          as: 'products'
        }
      },
      {
        $project: {
          name: 1,
          productCount: { $size: '$products' },
          activeProducts: {
            $size: {
              $filter: {
                input: '$products',
                cond: { $eq: ['$$this.status', 'active'] }
              }
            }
          }
        }
      },
      { $sort: { productCount: -1 } },
      { $limit: 10 }
    ]);

    res.json({
      success: true,
      data: {
        overview: {
          totalCategories,
          activeCategories,
          featuredCategories,
          parentCategories,
          childCategories
        },
        categoryPerformance
      }
    });
  } catch (error) {
    console.error('Categories analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch analytics'
    });
  }
});

module.exports = router;
