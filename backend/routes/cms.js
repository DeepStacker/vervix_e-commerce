const express = require('express');
const router = express.Router();
const Content = require('../models/Content');
const { auth, adminAuth } = require('../middleware/auth');
const { logCustomEvent } = require('../middleware/audit');

// Get all content with filters
router.get('/', auth, adminAuth, async (req, res) => {
  try {
    const {
      type,
      status,
      page = 1,
      limit = 50,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      search
    } = req.query;

    const query = {};
    if (type) query.type = type;
    if (status) query.status = status;
    if (search) {
      query.$text = { $search: search };
    }

    const skip = (page - 1) * limit;
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    const content = await Content.find(query)
      .populate('createdBy', 'firstName lastName email')
      .populate('updatedBy', 'firstName lastName email')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Content.countDocuments(query);

    res.json({
      success: true,
      data: content,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error getting content:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get content',
      error: error.message
    });
  }
});

// Create new content
router.post('/', auth, adminAuth, async (req, res) => {
  try {
    const contentData = {
      ...req.body,
      createdBy: req.user._id
    };

    const content = new Content(contentData);
    await content.save();

    // Log the content creation
    await logCustomEvent(req, 'content_create', 'content', {
      contentId: content._id,
      type: content.type,
      title: content.title
    });

    res.status(201).json({
      success: true,
      message: 'Content created successfully',
      data: content
    });
  } catch (error) {
    console.error('Error creating content:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create content',
      error: error.message
    });
  }
});

// Get content by ID
router.get('/:id', auth, adminAuth, async (req, res) => {
  try {
    const content = await Content.findById(req.params.id)
      .populate('createdBy', 'firstName lastName email')
      .populate('updatedBy', 'firstName lastName email');

    if (!content) {
      return res.status(404).json({
        success: false,
        message: 'Content not found'
      });
    }

    res.json({
      success: true,
      data: content
    });
  } catch (error) {
    console.error('Error getting content:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get content',
      error: error.message
    });
  }
});

// Update content
router.put('/:id', auth, adminAuth, async (req, res) => {
  try {
    const contentData = {
      ...req.body,
      updatedBy: req.user._id
    };

    const content = await Content.findByIdAndUpdate(
      req.params.id,
      contentData,
      { new: true, runValidators: true }
    ).populate('createdBy', 'firstName lastName email')
     .populate('updatedBy', 'firstName lastName email');

    if (!content) {
      return res.status(404).json({
        success: false,
        message: 'Content not found'
      });
    }

    // Log the content update
    await logCustomEvent(req, 'content_update', 'content', {
      contentId: content._id,
      type: content.type,
      title: content.title
    });

    res.json({
      success: true,
      message: 'Content updated successfully',
      data: content
    });
  } catch (error) {
    console.error('Error updating content:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update content',
      error: error.message
    });
  }
});

// Delete content
router.delete('/:id', auth, adminAuth, async (req, res) => {
  try {
    const content = await Content.findByIdAndDelete(req.params.id);

    if (!content) {
      return res.status(404).json({
        success: false,
        message: 'Content not found'
      });
    }

    // Log the content deletion
    await logCustomEvent(req, 'content_delete', 'content', {
      contentId: content._id,
      type: content.type,
      title: content.title
    });

    res.json({
      success: true,
      message: 'Content deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting content:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete content',
      error: error.message
    });
  }
});

// Get active banners (public)
router.get('/banners/active', async (req, res) => {
  try {
    const { position } = req.query;
    const banners = await Content.getActiveBanners(position);

    res.json({
      success: true,
      data: banners
    });
  } catch (error) {
    console.error('Error getting active banners:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get active banners',
      error: error.message
    });
  }
});

// Get active promotions (public)
router.get('/promotions/active', async (req, res) => {
  try {
    const promotions = await Content.getActivePromotions();

    res.json({
      success: true,
      data: promotions
    });
  } catch (error) {
    console.error('Error getting active promotions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get active promotions',
      error: error.message
    });
  }
});

// Get published pages (public)
router.get('/pages/published', async (req, res) => {
  try {
    const pages = await Content.getPublishedPages();

    res.json({
      success: true,
      data: pages
    });
  } catch (error) {
    console.error('Error getting published pages:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get published pages',
      error: error.message
    });
  }
});

// Get page by slug (public)
router.get('/pages/:slug', async (req, res) => {
  try {
    const page = await Content.findOne({
      type: 'page',
      slug: req.params.slug,
      status: 'published',
      'page.isPublished': true
    });

    if (!page) {
      return res.status(404).json({
        success: false,
        message: 'Page not found'
      });
    }

    // Increment views
    await page.incrementViews();

    res.json({
      success: true,
      data: page
    });
  } catch (error) {
    console.error('Error getting page:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get page',
      error: error.message
    });
  }
});

// Get FAQ by category (public)
router.get('/faq/:category', async (req, res) => {
  try {
    const { category } = req.params;
    const faqs = await Content.getFAQByCategory(category);

    res.json({
      success: true,
      data: faqs
    });
  } catch (error) {
    console.error('Error getting FAQ:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get FAQ',
      error: error.message
    });
  }
});

// Get all FAQ categories (public)
router.get('/faq/categories/list', async (req, res) => {
  try {
    const categories = await Content.distinct('faq.category', {
      type: 'faq',
      status: 'published',
      'faq.isPublished': true
    });

    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Error getting FAQ categories:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get FAQ categories',
      error: error.message
    });
  }
});

// Increment content analytics
router.post('/:id/analytics/:action', async (req, res) => {
  try {
    const { id, action } = req.params;
    const content = await Content.findById(id);

    if (!content) {
      return res.status(404).json({
        success: false,
        message: 'Content not found'
      });
    }

    switch (action) {
      case 'view':
        await content.incrementViews();
        break;
      case 'click':
        await content.incrementClicks();
        break;
      case 'conversion':
        await content.incrementConversions();
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid analytics action'
        });
    }

    res.json({
      success: true,
      message: 'Analytics updated successfully'
    });
  } catch (error) {
    console.error('Error updating analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update analytics',
      error: error.message
    });
  }
});

// Get content analytics
router.get('/analytics/overview', auth, adminAuth, async (req, res) => {
  try {
    const { startDate, endDate, type } = req.query;

    const query = {};
    if (type) query.type = type;
    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const analytics = await Content.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$type',
          totalViews: { $sum: '$analytics.views' },
          totalClicks: { $sum: '$analytics.clicks' },
          totalConversions: { $sum: '$analytics.conversions' },
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          type: '$_id',
          totalViews: 1,
          totalClicks: 1,
          totalConversions: 1,
          count: 1,
          avgCTR: {
            $cond: [
              { $eq: ['$totalViews', 0] },
              0,
              { $multiply: [{ $divide: ['$totalClicks', '$totalViews'] }, 100] }
            ]
          },
          avgConversionRate: {
            $cond: [
              { $eq: ['$totalClicks', 0] },
              0,
              { $multiply: [{ $divide: ['$totalConversions', '$totalClicks'] }, 100] }
            ]
          }
        }
      }
    ]);

    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    console.error('Error getting content analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get content analytics',
      error: error.message
    });
  }
});

// Bulk update content status
router.put('/bulk/status', auth, adminAuth, async (req, res) => {
  try {
    const { ids, status } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Content IDs are required'
      });
    }

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required'
      });
    }

    const result = await Content.updateMany(
      { _id: { $in: ids } },
      { 
        status,
        updatedBy: req.user._id
      }
    );

    // Log the bulk update
    await logCustomEvent(req, 'content_bulk_update', 'content', {
      contentIds: ids,
      status,
      updatedCount: result.modifiedCount
    });

    res.json({
      success: true,
      message: `Updated ${result.modifiedCount} content items`,
      data: {
        modifiedCount: result.modifiedCount
      }
    });
  } catch (error) {
    console.error('Error bulk updating content:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to bulk update content',
      error: error.message
    });
  }
});

// Duplicate content
router.post('/:id/duplicate', auth, adminAuth, async (req, res) => {
  try {
    const originalContent = await Content.findById(req.params.id);

    if (!originalContent) {
      return res.status(404).json({
        success: false,
        message: 'Content not found'
      });
    }

    const duplicatedContent = new Content({
      ...originalContent.toObject(),
      _id: undefined,
      title: `${originalContent.title} (Copy)`,
      slug: `${originalContent.slug}-copy-${Date.now()}`,
      status: 'draft',
      createdBy: req.user._id,
      updatedBy: req.user._id,
      analytics: {
        views: 0,
        clicks: 0,
        conversions: 0
      }
    });

    await duplicatedContent.save();

    // Log the content duplication
    await logCustomEvent(req, 'content_duplicate', 'content', {
      originalContentId: originalContent._id,
      newContentId: duplicatedContent._id,
      type: originalContent.type
    });

    res.status(201).json({
      success: true,
      message: 'Content duplicated successfully',
      data: duplicatedContent
    });
  } catch (error) {
    console.error('Error duplicating content:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to duplicate content',
      error: error.message
    });
  }
});

module.exports = router; 