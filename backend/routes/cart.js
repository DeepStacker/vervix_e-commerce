const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const Product = require('../models/Product');
const User = require('../models/User');

// Get user's cart
router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate({
      path: 'cart.product',
      select: 'name price images inventory category discount isActive variants',
      populate: {
        path: 'category',
        select: 'name'
      }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Filter out inactive products and calculate totals
    const activeCartItems = user.cart.filter(item => 
      item.product && item.product.isActive
    );

    let subtotal = 0;
    let totalDiscount = 0;
    let totalItems = 0;

    const cartItems = activeCartItems.map(item => {
      const product = item.product;
      const itemPrice = product.price;
      const itemDiscount = product.discount ? (itemPrice * product.discount / 100) : 0;
      const finalPrice = itemPrice - itemDiscount;
      const itemTotal = finalPrice * item.quantity;
      
      subtotal += itemTotal;
      totalDiscount += itemDiscount * item.quantity;
      totalItems += item.quantity;

      return {
        _id: item._id,
        product: {
          _id: product._id,
          name: product.name,
          price: itemPrice,
          discount: product.discount,
          finalPrice: finalPrice,
          images: product.images,
          inventory: product.inventory,
          category: product.category
        },
        quantity: item.quantity,
        addedAt: item.addedAt,
        itemTotal: itemTotal
      };
    });

    // Calculate shipping (free above ₹500)
    const shippingThreshold = 500;
    const shippingCost = subtotal >= shippingThreshold ? 0 : 50;
    const total = subtotal + shippingCost;

    res.status(200).json({
      items: cartItems,
      summary: {
        totalItems,
        subtotal,
        totalDiscount,
        shippingCost,
        shippingThreshold,
        total,
        isEmpty: cartItems.length === 0
      }
    });

  } catch (error) {
    console.error('Cart fetch error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch cart',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Add item to cart
router.post('/add', auth, async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;

    if (!productId) {
      return res.status(400).json({ message: 'Product ID is required' });
    }

    if (quantity <= 0) {
      return res.status(400).json({ message: 'Quantity must be positive' });
    }

    // Check if product exists and is active
    const product = await Product.findById(productId);
    if (!product || !product.isActive) {
      return res.status(404).json({ message: 'Product not found or inactive' });
    }

    // Check stock availability
    const availableStock = product.inventory?.quantity || 0;
    if (availableStock < quantity) {
      return res.status(400).json({ 
        message: `Only ${availableStock} items available in stock` 
      });
    }

    const user = await User.findById(req.user.id);
    
    // Check if item already exists in cart
    const existingItemIndex = user.cart.findIndex(
      item => item.product.toString() === productId
    );

    if (existingItemIndex >= 0) {
      // Update quantity if item exists
      const newQuantity = user.cart[existingItemIndex].quantity + quantity;
      
      const availableStock = product.inventory?.quantity || 0;
      if (newQuantity > availableStock) {
        return res.status(400).json({ 
          message: `Cannot add ${quantity} more. Only ${availableStock} items available in stock` 
        });
      }

      user.cart[existingItemIndex].quantity = newQuantity;
      user.cart[existingItemIndex].addedAt = new Date();
    } else {
      // Add new item to cart
      user.cart.push({
        product: productId,
        quantity,
        addedAt: new Date()
      });
    }

    await user.save();

    // Return updated cart item
    await user.populate({
      path: 'cart.product',
      select: 'name price images inventory category discount isActive'
    });

    const addedItem = user.cart.find(item => 
      item.product._id.toString() === productId
    );

    res.status(200).json({
      message: 'Item added to cart successfully',
      item: {
        _id: addedItem._id,
        product: addedItem.product,
        quantity: addedItem.quantity,
        addedAt: addedItem.addedAt
      },
      cartItemsCount: user.cart.length
    });

  } catch (error) {
    console.error('Add to cart error:', error);
    res.status(500).json({ 
      message: 'Failed to add item to cart',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Update cart item quantity
router.put('/update/:itemId', auth, async (req, res) => {
  try {
    const { itemId } = req.params;
    const { quantity } = req.body;

    if (!quantity || quantity <= 0) {
      return res.status(400).json({ message: 'Valid quantity is required' });
    }

    const user = await User.findById(req.user.id);
    const cartItem = user.cart.id(itemId);

    if (!cartItem) {
      return res.status(404).json({ message: 'Cart item not found' });
    }

    // Check product stock
    const product = await Product.findById(cartItem.product);
    if (!product || !product.isActive) {
      return res.status(404).json({ message: 'Product not found or inactive' });
    }

    const availableStock = product.inventory?.quantity || 0;
    if (quantity > availableStock) {
      return res.status(400).json({ 
        message: `Only ${availableStock} items available in stock` 
      });
    }

    cartItem.quantity = quantity;
    cartItem.addedAt = new Date();

    await user.save();

    res.status(200).json({
      message: 'Cart item updated successfully',
      item: {
        _id: cartItem._id,
        quantity: cartItem.quantity,
        addedAt: cartItem.addedAt
      }
    });

  } catch (error) {
    console.error('Update cart error:', error);
    res.status(500).json({ 
      message: 'Failed to update cart item',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Remove item from cart
router.delete('/remove/:itemId', auth, async (req, res) => {
  try {
    const { itemId } = req.params;

    const user = await User.findById(req.user.id);
    const cartItem = user.cart.id(itemId);

    if (!cartItem) {
      return res.status(404).json({ message: 'Cart item not found' });
    }

    user.cart.pull(itemId);
    await user.save();

    res.status(200).json({
      message: 'Item removed from cart successfully',
      cartItemsCount: user.cart.length
    });

  } catch (error) {
    console.error('Remove from cart error:', error);
    res.status(500).json({ 
      message: 'Failed to remove item from cart',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Clear entire cart
router.delete('/clear', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    user.cart = [];
    await user.save();

    res.status(200).json({
      message: 'Cart cleared successfully',
      cartItemsCount: 0
    });

  } catch (error) {
    console.error('Clear cart error:', error);
    res.status(500).json({ 
      message: 'Failed to clear cart',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Apply coupon code
router.post('/apply-coupon', auth, async (req, res) => {
  try {
    const { couponCode } = req.body;

    if (!couponCode) {
      return res.status(400).json({ message: 'Coupon code is required' });
    }

    // Get user's cart
    const user = await User.findById(req.user.id).populate('cart.product');
    
    if (!user.cart || user.cart.length === 0) {
      return res.status(400).json({ message: 'Cart is empty' });
    }

    // Calculate current cart total
    let subtotal = 0;
    for (const item of user.cart) {
      if (item.product && item.product.isActive) {
        const itemPrice = item.product.price;
        const itemDiscount = item.product.discount ? (itemPrice * item.product.discount / 100) : 0;
        const finalPrice = itemPrice - itemDiscount;
        subtotal += finalPrice * item.quantity;
      }
    }

    // Mock coupon validation - in production, you'd have a Coupon model
    const validCoupons = {
      'WELCOME10': { discount: 10, minAmount: 200, type: 'percentage' },
      'SAVE50': { discount: 50, minAmount: 500, type: 'flat' },
      'FIRST20': { discount: 20, minAmount: 300, type: 'percentage' },
      'LUXURY15': { discount: 15, minAmount: 1000, type: 'percentage' }
    };

    const coupon = validCoupons[couponCode.toUpperCase()];
    
    if (!coupon) {
      return res.status(400).json({ message: 'Invalid coupon code' });
    }

    if (subtotal < coupon.minAmount) {
      return res.status(400).json({ 
        message: `Minimum order amount of ₹${coupon.minAmount} required for this coupon` 
      });
    }

    // Calculate discount
    let discountAmount = 0;
    if (coupon.type === 'percentage') {
      discountAmount = (subtotal * coupon.discount) / 100;
    } else if (coupon.type === 'flat') {
      discountAmount = coupon.discount;
    }

    // Ensure discount doesn't exceed subtotal
    discountAmount = Math.min(discountAmount, subtotal);

    res.status(200).json({
      message: 'Coupon applied successfully',
      coupon: {
        code: couponCode.toUpperCase(),
        discount: coupon.discount,
        type: coupon.type,
        discountAmount,
        minAmount: coupon.minAmount
      },
      cartTotal: {
        subtotal,
        discountAmount,
        finalAmount: subtotal - discountAmount
      }
    });

  } catch (error) {
    console.error('Apply coupon error:', error);
    res.status(500).json({ 
      message: 'Failed to apply coupon',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get cart item count
router.get('/count', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('cart');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const itemCount = user.cart.length;
    const totalQuantity = user.cart.reduce((total, item) => total + item.quantity, 0);

    res.status(200).json({
      itemCount,
      totalQuantity
    });

  } catch (error) {
    console.error('Cart count error:', error);
    res.status(500).json({ 
      message: 'Failed to get cart count',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Check cart items availability before checkout
router.post('/validate', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('cart.product');
    
    if (!user.cart || user.cart.length === 0) {
      return res.status(400).json({ 
        message: 'Cart is empty',
        issues: []
      });
    }

    const issues = [];
    const validItems = [];

    for (const item of user.cart) {
      const product = item.product;
      
      if (!product) {
        issues.push({
          itemId: item._id,
          type: 'product_not_found',
          message: 'Product no longer exists'
        });
        continue;
      }

      if (!product.isActive) {
        issues.push({
          itemId: item._id,
          productId: product._id,
          productName: product.name,
          type: 'product_inactive',
          message: 'Product is no longer available'
        });
        continue;
      }

      if (product.stock < item.quantity) {
        issues.push({
          itemId: item._id,
          productId: product._id,
          productName: product.name,
          type: 'insufficient_stock',
          message: `Only ${product.stock} items available, but ${item.quantity} in cart`,
          availableStock: product.stock,
          requestedQuantity: item.quantity
        });
        continue;
      }

      validItems.push({
        itemId: item._id,
        productId: product._id,
        productName: product.name,
        quantity: item.quantity,
        price: product.price,
        discount: product.discount
      });
    }

    res.status(200).json({
      isValid: issues.length === 0,
      issues,
      validItems,
      message: issues.length === 0 ? 'Cart is valid for checkout' : 'Cart has issues that need attention'
    });

  } catch (error) {
    console.error('Cart validation error:', error);
    res.status(500).json({ 
      message: 'Failed to validate cart',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
