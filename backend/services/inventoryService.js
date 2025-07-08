const Product = require('../models/Product');
const { sendLowStockAlertEmail } = require('../utils/email');
const { logCustomEvent } = require('../middleware/audit');

class InventoryService {
  // Update stock for a product or variant
  static async updateStock(productId, variantId, quantity, reason, reference, userId) {
    try {
      const product = await Product.findById(productId);
      if (!product) {
        throw new Error('Product not found');
      }

      await product.updateStock(variantId, quantity, reason, reference, userId);
      
      // Log the inventory update
      await logCustomEvent(
        { user: { _id: userId } },
        'inventory_update',
        'inventory',
        {
          productId,
          variantId,
          quantity,
          reason,
          reference,
          newStock: variantId ? 
            product.variants.id(variantId)?.stock : 
            product.inventory.quantity
        }
      );

      return product;
    } catch (error) {
      console.error('Error updating stock:', error);
      throw error;
    }
  }

  // Reserve stock for an order
  static async reserveStock(productId, variantId, quantity, orderId, userId) {
    try {
      const product = await Product.findById(productId);
      if (!product) {
        throw new Error('Product not found');
      }

      await product.reserveStock(variantId, quantity, orderId);
      
      // Log the stock reservation
      await logCustomEvent(
        { user: { _id: userId } },
        'inventory_reserve',
        'inventory',
        {
          productId,
          variantId,
          quantity,
          orderId
        }
      );

      return product;
    } catch (error) {
      console.error('Error reserving stock:', error);
      throw error;
    }
  }

  // Release reserved stock
  static async releaseReservedStock(productId, variantId, quantity, orderId, userId) {
    try {
      const product = await Product.findById(productId);
      if (!product) {
        throw new Error('Product not found');
      }

      await product.releaseReservedStock(variantId, quantity, orderId);
      
      // Log the stock release
      await logCustomEvent(
        { user: { _id: userId } },
        'inventory_release',
        'inventory',
        {
          productId,
          variantId,
          quantity,
          orderId
        }
      );

      return product;
    } catch (error) {
      console.error('Error releasing reserved stock:', error);
      throw error;
    }
  }

  // Check stock availability
  static async checkStockAvailability(productId, variantId, quantity) {
    try {
      const product = await Product.findById(productId);
      if (!product) {
        throw new Error('Product not found');
      }

      return product.checkStockAvailability(variantId, quantity);
    } catch (error) {
      console.error('Error checking stock availability:', error);
      throw error;
    }
  }

  // Get low stock alerts
  static async getLowStockAlerts() {
    try {
      const products = await Product.find({
        $or: [
          {
            'variants.lowStockAlert': true,
            'variants.stock': { $gt: 0 }
          },
          {
            'inventory.quantity': { $gt: 0, $lte: '$inventory.lowStockThreshold' }
          }
        ]
      }).populate('category', 'name');

      const alerts = [];

      products.forEach(product => {
        if (product.variants && product.variants.length > 0) {
          product.variants.forEach(variant => {
            if (variant.lowStockAlert && variant.stock > 0) {
              alerts.push({
                productId: product._id,
                productName: product.name,
                sku: product.sku,
                category: product.category?.name,
                variant: {
                  id: variant._id,
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
          if (product.inventory.quantity <= product.inventory.lowStockThreshold && product.inventory.quantity > 0) {
            alerts.push({
              productId: product._id,
              productName: product.name,
              sku: product.sku,
              category: product.category?.name,
              currentStock: product.inventory.quantity,
              reorderPoint: product.inventory.lowStockThreshold,
              suggestedQuantity: product.inventory.reorderQuantity,
              urgency: product.inventory.quantity === 0 ? 'critical' : 'low'
            });
          }
        }
      });

      return alerts;
    } catch (error) {
      console.error('Error getting low stock alerts:', error);
      throw error;
    }
  }

  // Send low stock alert emails
  static async sendLowStockAlertEmails() {
    try {
      const alerts = await this.getLowStockAlerts();
      const adminEmail = process.env.ADMIN_EMAIL || 'admin@vervix.com';

      for (const alert of alerts) {
        const productDetails = {
          productName: alert.productName,
          sku: alert.sku,
          category: alert.category,
          currentStock: alert.currentStock,
          threshold: alert.reorderPoint,
          variant: alert.variant
        };

        await sendLowStockAlertEmail(adminEmail, productDetails);
      }

      return { sent: alerts.length };
    } catch (error) {
      console.error('Error sending low stock alert emails:', error);
      throw error;
    }
  }

  // Get inventory report
  static async getInventoryReport(filters = {}) {
    try {
      const {
        category,
        status,
        lowStock,
        outOfStock,
        sortBy = 'name',
        sortOrder = 'asc',
        page = 1,
        limit = 50
      } = filters;

      const query = {};

      if (category) query.category = category;
      if (status) query.status = status;
      if (lowStock) {
        query.$or = [
          {
            'variants.lowStockAlert': true,
            'variants.stock': { $gt: 0 }
          },
          {
            'inventory.quantity': { $gt: 0, $lte: '$inventory.lowStockThreshold' }
          }
        ];
      }
      if (outOfStock) {
        query.$or = [
          {
            'variants.stock': 0
          },
          {
            'inventory.quantity': 0
          }
        ];
      }

      const skip = (page - 1) * limit;
      const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

      const products = await Product.find(query)
        .populate('category', 'name')
        .sort(sort)
        .skip(skip)
        .limit(limit);

      const total = await Product.countDocuments(query);

      const report = products.map(product => {
        const reportItem = {
          productId: product._id,
          name: product.name,
          sku: product.sku,
          category: product.category?.name,
          status: product.status,
          totalStock: product.totalStock,
          availableStock: product.inventory.availableQuantity,
          reservedStock: product.inventory.reservedQuantity,
          lowStock: product.isLowStock,
          outOfStock: product.totalStock === 0,
          lastStockUpdate: product.inventory.lastStockUpdate,
          variants: []
        };

        if (product.variants && product.variants.length > 0) {
          reportItem.variants = product.variants.map(variant => ({
            id: variant._id,
            size: variant.size,
            color: variant.color,
            sku: variant.sku,
            stock: variant.stock,
            availableStock: variant.availableStock,
            reservedStock: variant.reservedStock,
            status: variant.status,
            lowStock: variant.lowStockAlert,
            reorderPoint: variant.reorderPoint,
            lastStockUpdate: variant.lastStockUpdate
          }));
        }

        return reportItem;
      });

      return {
        products: report,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('Error generating inventory report:', error);
      throw error;
    }
  }

  // Get stock movement history
  static async getStockHistory(productId, filters = {}) {
    try {
      const product = await Product.findById(productId);
      if (!product) {
        throw new Error('Product not found');
      }

      const {
        type,
        startDate,
        endDate,
        page = 1,
        limit = 50
      } = filters;

      let history = product.inventory.stockHistory;

      // Apply filters
      if (type) {
        history = history.filter(item => item.type === type);
      }
      if (startDate && endDate) {
        history = history.filter(item => 
          item.date >= new Date(startDate) && item.date <= new Date(endDate)
        );
      }

      // Sort by date (newest first)
      history.sort((a, b) => new Date(b.date) - new Date(a.date));

      // Apply pagination
      const skip = (page - 1) * limit;
      const paginatedHistory = history.slice(skip, skip + limit);

      return {
        history: paginatedHistory,
        pagination: {
          page,
          limit,
          total: history.length,
          pages: Math.ceil(history.length / limit)
        }
      };
    } catch (error) {
      console.error('Error getting stock history:', error);
      throw error;
    }
  }

  // Bulk stock update
  static async bulkStockUpdate(updates, userId) {
    try {
      const results = [];
      const errors = [];

      for (const update of updates) {
        try {
          const { productId, variantId, quantity, reason, reference } = update;
          const product = await this.updateStock(productId, variantId, quantity, reason, reference, userId);
          results.push({
            productId,
            variantId,
            success: true,
            newStock: variantId ? 
              product.variants.id(variantId)?.stock : 
              product.inventory.quantity
          });
        } catch (error) {
          errors.push({
            productId: update.productId,
            variantId: update.variantId,
            success: false,
            error: error.message
          });
        }
      }

      return { results, errors };
    } catch (error) {
      console.error('Error in bulk stock update:', error);
      throw error;
    }
  }

  // Get reorder suggestions
  static async getReorderSuggestions() {
    try {
      const products = await Product.find({
        $or: [
          {
            'variants.stock': { $lte: '$variants.reorderPoint' }
          },
          {
            'inventory.quantity': { $lte: '$inventory.reorderPoint' }
          }
        ]
      }).populate('category', 'name');

      const suggestions = [];

      products.forEach(product => {
        const productSuggestions = product.generateReorderSuggestions();
        suggestions.push({
          productId: product._id,
          productName: product.name,
          sku: product.sku,
          category: product.category?.name,
          suggestions: productSuggestions
        });
      });

      return suggestions;
    } catch (error) {
      console.error('Error getting reorder suggestions:', error);
      throw error;
    }
  }

  // Update reorder settings
  static async updateReorderSettings(productId, variantId, settings) {
    try {
      const product = await Product.findById(productId);
      if (!product) {
        throw new Error('Product not found');
      }

      if (variantId) {
        const variant = product.variants.id(variantId);
        if (!variant) {
          throw new Error('Variant not found');
        }

        if (settings.reorderPoint !== undefined) {
          variant.reorderPoint = settings.reorderPoint;
        }
        if (settings.reorderQuantity !== undefined) {
          variant.reorderQuantity = settings.reorderQuantity;
        }
      } else {
        if (settings.reorderPoint !== undefined) {
          product.inventory.reorderPoint = settings.reorderPoint;
        }
        if (settings.reorderQuantity !== undefined) {
          product.inventory.reorderQuantity = settings.reorderQuantity;
        }
      }

      await product.save();
      return product;
    } catch (error) {
      console.error('Error updating reorder settings:', error);
      throw error;
    }
  }
}

module.exports = InventoryService; 