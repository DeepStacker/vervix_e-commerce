const express = require('express');
const router = express.Router();
const InventoryService = require('../services/inventoryService');
const Product = require('../models/Product');
const { auth, adminAuth } = require('../middleware/auth');
const { auditInventoryUpdate } = require('../middleware/audit');

// Get inventory report
router.get('/report', auth, adminAuth, async (req, res) => {
  try {
    const filters = {
      category: req.query.category,
      status: req.query.status,
      lowStock: req.query.lowStock === 'true',
      outOfStock: req.query.outOfStock === 'true',
      sortBy: req.query.sortBy || 'name',
      sortOrder: req.query.sortOrder || 'asc',
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 50
    };

    const report = await InventoryService.getInventoryReport(filters);

    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    console.error('Error getting inventory report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get inventory report',
      error: error.message
    });
  }
});

// Get low stock alerts
router.get('/alerts/low-stock', auth, adminAuth, async (req, res) => {
  try {
    const alerts = await InventoryService.getLowStockAlerts();

    res.json({
      success: true,
      data: alerts,
      count: alerts.length
    });
  } catch (error) {
    console.error('Error getting low stock alerts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get low stock alerts',
      error: error.message
    });
  }
});

// Send low stock alert emails
router.post('/alerts/send', auth, adminAuth, async (req, res) => {
  try {
    const result = await InventoryService.sendLowStockAlertEmails();

    res.json({
      success: true,
      message: `Sent ${result.sent} low stock alert emails`,
      data: result
    });
  } catch (error) {
    console.error('Error sending low stock alerts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send low stock alerts',
      error: error.message
    });
  }
});

// Update stock for a product
router.put('/stock/:productId', auth, adminAuth, auditInventoryUpdate, async (req, res) => {
  try {
    const { productId } = req.params;
    const { variantId, quantity, reason, reference } = req.body;
    const userId = req.user._id;

    if (!quantity || typeof quantity !== 'number') {
      return res.status(400).json({
        success: false,
        message: 'Quantity is required and must be a number'
      });
    }

    const product = await InventoryService.updateStock(
      productId,
      variantId,
      quantity,
      reason || 'manual',
      reference,
      userId
    );

    res.json({
      success: true,
      message: 'Stock updated successfully',
      data: {
        productId,
        variantId,
        quantity,
        newStock: variantId ? 
          product.variants.id(variantId)?.stock : 
          product.inventory.quantity
      }
    });
  } catch (error) {
    console.error('Error updating stock:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update stock',
      error: error.message
    });
  }
});

// Bulk stock update
router.put('/stock/bulk', auth, adminAuth, async (req, res) => {
  try {
    const { updates } = req.body;
    const userId = req.user._id;

    if (!updates || !Array.isArray(updates)) {
      return res.status(400).json({
        success: false,
        message: 'Updates array is required'
      });
    }

    const result = await InventoryService.bulkStockUpdate(updates, userId);

    res.json({
      success: true,
      message: `Updated ${result.results.length} items successfully`,
      data: result
    });
  } catch (error) {
    console.error('Error in bulk stock update:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update stock',
      error: error.message
    });
  }
});

// Reserve stock for an order
router.post('/reserve', auth, async (req, res) => {
  try {
    const { productId, variantId, quantity, orderId } = req.body;
    const userId = req.user._id;

    if (!productId || !quantity || !orderId) {
      return res.status(400).json({
        success: false,
        message: 'Product ID, quantity, and order ID are required'
      });
    }

    const product = await InventoryService.reserveStock(
      productId,
      variantId,
      quantity,
      orderId,
      userId
    );

    res.json({
      success: true,
      message: 'Stock reserved successfully',
      data: {
        productId,
        variantId,
        quantity,
        orderId
      }
    });
  } catch (error) {
    console.error('Error reserving stock:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reserve stock',
      error: error.message
    });
  }
});

// Release reserved stock
router.post('/release', auth, async (req, res) => {
  try {
    const { productId, variantId, quantity, orderId } = req.body;
    const userId = req.user._id;

    if (!productId || !quantity || !orderId) {
      return res.status(400).json({
        success: false,
        message: 'Product ID, quantity, and order ID are required'
      });
    }

    const product = await InventoryService.releaseReservedStock(
      productId,
      variantId,
      quantity,
      orderId,
      userId
    );

    res.json({
      success: true,
      message: 'Stock released successfully',
      data: {
        productId,
        variantId,
        quantity,
        orderId
      }
    });
  } catch (error) {
    console.error('Error releasing stock:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to release stock',
      error: error.message
    });
  }
});

// Check stock availability
router.post('/check-availability', auth, async (req, res) => {
  try {
    const { productId, variantId, quantity } = req.body;

    if (!productId || !quantity) {
      return res.status(400).json({
        success: false,
        message: 'Product ID and quantity are required'
      });
    }

    const availability = await InventoryService.checkStockAvailability(
      productId,
      variantId,
      quantity
    );

    res.json({
      success: true,
      data: availability
    });
  } catch (error) {
    console.error('Error checking stock availability:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check stock availability',
      error: error.message
    });
  }
});

// Get stock history for a product
router.get('/history/:productId', auth, adminAuth, async (req, res) => {
  try {
    const { productId } = req.params;
    const filters = {
      type: req.query.type,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 50
    };

    const history = await InventoryService.getStockHistory(productId, filters);

    res.json({
      success: true,
      data: history
    });
  } catch (error) {
    console.error('Error getting stock history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get stock history',
      error: error.message
    });
  }
});

// Get reorder suggestions
router.get('/reorder-suggestions', auth, adminAuth, async (req, res) => {
  try {
    const suggestions = await InventoryService.getReorderSuggestions();

    res.json({
      success: true,
      data: suggestions,
      count: suggestions.length
    });
  } catch (error) {
    console.error('Error getting reorder suggestions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get reorder suggestions',
      error: error.message
    });
  }
});

// Update reorder settings
router.put('/reorder-settings/:productId', auth, adminAuth, async (req, res) => {
  try {
    const { productId } = req.params;
    const { variantId, reorderPoint, reorderQuantity } = req.body;

    const settings = {};
    if (reorderPoint !== undefined) settings.reorderPoint = reorderPoint;
    if (reorderQuantity !== undefined) settings.reorderQuantity = reorderQuantity;

    const product = await InventoryService.updateReorderSettings(
      productId,
      variantId,
      settings
    );

    res.json({
      success: true,
      message: 'Reorder settings updated successfully',
      data: {
        productId,
        variantId,
        settings
      }
    });
  } catch (error) {
    console.error('Error updating reorder settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update reorder settings',
      error: error.message
    });
  }
});

// Get inventory dashboard stats
router.get('/dashboard/stats', auth, adminAuth, async (req, res) => {
  try {
    const [
      totalProducts,
      lowStockProducts,
      outOfStockProducts,
      totalStockValue,
      lowStockAlerts
    ] = await Promise.all([
      Product.countDocuments({ status: 'active' }),
      Product.countDocuments({
        $or: [
          {
            'variants.lowStockAlert': true,
            'variants.stock': { $gt: 0 }
          },
          {
            'inventory.quantity': { $gt: 0, $lte: '$inventory.lowStockThreshold' }
          }
        ]
      }),
      Product.countDocuments({
        $or: [
          {
            'variants.stock': 0
          },
          {
            'inventory.quantity': 0
          }
        ]
      }),
      Product.aggregate([
        { $match: { status: 'active' } },
        {
          $group: {
            _id: null,
            totalValue: {
              $sum: {
                $multiply: ['$price', '$inventory.quantity']
              }
            }
          }
        }
      ]),
      InventoryService.getLowStockAlerts()
    ]);

    const stats = {
      totalProducts,
      lowStockProducts,
      outOfStockProducts,
      totalStockValue: totalStockValue[0]?.totalValue || 0,
      lowStockAlerts: lowStockAlerts.length,
      stockUtilization: totalProducts > 0 ? 
        ((totalProducts - outOfStockProducts) / totalProducts * 100).toFixed(2) : 0
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error getting inventory dashboard stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get inventory dashboard stats',
      error: error.message
    });
  }
});

// Export inventory report to CSV
router.get('/export/csv', auth, adminAuth, async (req, res) => {
  try {
    const filters = {
      category: req.query.category,
      status: req.query.status,
      lowStock: req.query.lowStock === 'true',
      outOfStock: req.query.outOfStock === 'true'
    };

    const report = await InventoryService.getInventoryReport({ ...filters, limit: 10000 });

    // Generate CSV content
    const csvHeaders = [
      'Product Name',
      'SKU',
      'Category',
      'Status',
      'Total Stock',
      'Available Stock',
      'Reserved Stock',
      'Low Stock',
      'Out of Stock',
      'Last Stock Update'
    ];

    const csvRows = report.products.map(product => [
      product.name,
      product.sku,
      product.category,
      product.status,
      product.totalStock,
      product.availableStock,
      product.reservedStock,
      product.lowStock ? 'Yes' : 'No',
      product.outOfStock ? 'Yes' : 'No',
      product.lastStockUpdate ? new Date(product.lastStockUpdate).toLocaleDateString() : ''
    ]);

    const csvContent = [csvHeaders, ...csvRows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    // Set response headers for file download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="inventory-report-${new Date().toISOString().split('T')[0]}.csv"`);
    
    res.send(csvContent);
  } catch (error) {
    console.error('Error exporting inventory report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export inventory report',
      error: error.message
    });
  }
});

module.exports = router; 