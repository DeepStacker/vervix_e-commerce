import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiTrash2, FiMinus, FiPlus, FiShoppingCart, FiTag, FiTruck, FiArrowLeft } from 'react-icons/fi';
import { toast } from 'react-hot-toast';

const Cart = () => {
  const [cartData, setCartData] = useState({ items: [], summary: {} });
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState({});
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const navigate = useNavigate();

  // Fetch cart data
  const fetchCart = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await fetch('/api/cart', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setCartData(data);
      } else if (response.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
      } else {
        throw new Error('Failed to fetch cart');
      }
    } catch (error) {
      console.error('Cart fetch error:', error);
      toast.error('Failed to load cart');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, []);

  // Update item quantity
  const updateQuantity = async (itemId, newQuantity) => {
    if (newQuantity <= 0) return;

    setUpdating(prev => ({ ...prev, [itemId]: true }));

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/cart/update/${itemId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ quantity: newQuantity })
      });

      if (response.ok) {
        await fetchCart(); // Refresh cart data
        toast.success('Cart updated');
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Failed to update cart');
      }
    } catch (error) {
      console.error('Update quantity error:', error);
      toast.error('Failed to update cart');
    } finally {
      setUpdating(prev => ({ ...prev, [itemId]: false }));
    }
  };

  // Remove item from cart
  const removeItem = async (itemId) => {
    setUpdating(prev => ({ ...prev, [itemId]: true }));

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/cart/remove/${itemId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        await fetchCart(); // Refresh cart data
        toast.success('Item removed from cart');
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Failed to remove item');
      }
    } catch (error) {
      console.error('Remove item error:', error);
      toast.error('Failed to remove item');
    } finally {
      setUpdating(prev => ({ ...prev, [itemId]: false }));
    }
  };

  // Clear entire cart
  const clearCart = async () => {
    if (!window.confirm('Are you sure you want to clear your cart?')) return;

    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/cart/clear', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        await fetchCart(); // Refresh cart data
        toast.success('Cart cleared');
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Failed to clear cart');
      }
    } catch (error) {
      console.error('Clear cart error:', error);
      toast.error('Failed to clear cart');
    } finally {
      setLoading(false);
    }
  };

  // Apply coupon code
  const applyCoupon = async () => {
    if (!couponCode.trim()) {
      toast.error('Please enter a coupon code');
      return;
    }

    setCouponLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/cart/apply-coupon', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ couponCode: couponCode.trim() })
      });

      const data = await response.json();

      if (response.ok) {
        setAppliedCoupon(data.coupon);
        toast.success(data.message);
      } else {
        toast.error(data.message || 'Invalid coupon code');
      }
    } catch (error) {
      console.error('Apply coupon error:', error);
      toast.error('Failed to apply coupon');
    } finally {
      setCouponLoading(false);
    }
  };

  // Proceed to checkout
  const proceedToCheckout = () => {
    navigate('/checkout', { 
      state: { 
        cartData, 
        appliedCoupon 
      } 
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-luxury-gold mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your cart...</p>
        </div>
      </div>
    );
  }

  if (cartData.summary.isEmpty) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <FiShoppingCart className="w-24 h-24 text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h2>
            <p className="text-gray-600 mb-6">Looks like you haven't added any items to your cart yet.</p>
            <Link
              to="/products"
              className="inline-flex items-center px-6 py-3 bg-luxury-gold text-white font-medium rounded-lg hover:bg-opacity-90 transition-all duration-200"
            >
              <FiArrowLeft className="mr-2" />
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Shopping Cart</h1>
          <p className="text-gray-600">{cartData.summary.totalItems} items in your cart</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              {/* Header */}
              <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900">Items</h2>
                <button
                  onClick={clearCart}
                  className="text-red-600 hover:text-red-700 font-medium text-sm"
                  disabled={loading}
                >
                  Clear Cart
                </button>
              </div>

              {/* Items List */}
              <div className="divide-y divide-gray-200">
                {cartData.items.map((item) => (
                  <div key={item._id} className="p-6">
                    <div className="flex items-center space-x-4">
                      {/* Product Image */}
                      <div className="flex-shrink-0">
                        <img
                          src={item.product.images?.[0] || '/placeholder-product.jpg'}
                          alt={item.product.name}
                          className="w-20 h-20 object-cover rounded-lg"
                        />
                      </div>

                      {/* Product Details */}
                      <div className="flex-1 min-w-0">
                        <Link
                          to={`/products/${item.product._id}`}
                          className="text-lg font-medium text-gray-900 hover:text-luxury-gold transition-colors duration-200"
                        >
                          {item.product.name}
                        </Link>
                        {item.product.category && (
                          <p className="text-sm text-gray-500 mt-1">
                            {item.product.category.name}
                          </p>
                        )}
                        
                        {/* Price */}
                        <div className="flex items-center space-x-2 mt-2">
                          <span className="text-lg font-semibold text-gray-900">
                            ₹{item.product.finalPrice?.toLocaleString()}
                          </span>
                          {item.product.discount > 0 && (
                            <>
                              <span className="text-sm text-gray-500 line-through">
                                ₹{item.product.price?.toLocaleString()}
                              </span>
                              <span className="text-sm text-green-600 font-medium">
                                {item.product.discount}% off
                              </span>
                            </>
                          )}
                        </div>

                        {/* Stock Status */}
                        {item.product.stock < 5 && (
                          <p className="text-sm text-orange-600 mt-1">
                            Only {item.product.stock} left in stock
                          </p>
                        )}
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center border border-gray-300 rounded-lg">
                          <button
                            onClick={() => updateQuantity(item._id, item.quantity - 1)}
                            disabled={item.quantity <= 1 || updating[item._id]}
                            className="p-2 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <FiMinus className="w-4 h-4" />
                          </button>
                          <span className="px-4 py-2 border-x border-gray-300 min-w-[3rem] text-center">
                            {updating[item._id] ? '...' : item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item._id, item.quantity + 1)}
                            disabled={item.quantity >= item.product.stock || updating[item._id]}
                            className="p-2 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <FiPlus className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Remove Button */}
                        <button
                          onClick={() => removeItem(item._id)}
                          disabled={updating[item._id]}
                          className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all duration-200 disabled:opacity-50"
                        >
                          <FiTrash2 className="w-5 h-5" />
                        </button>
                      </div>

                      {/* Item Total */}
                      <div className="text-right">
                        <p className="text-lg font-semibold text-gray-900">
                          ₹{item.itemTotal?.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Order Summary</h2>

              {/* Coupon Code */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FiTag className="inline mr-1" />
                  Coupon Code
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    placeholder="Enter coupon code"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-luxury-gold focus:border-transparent"
                    disabled={appliedCoupon || couponLoading}
                  />
                  <button
                    onClick={applyCoupon}
                    disabled={!couponCode.trim() || appliedCoupon || couponLoading}
                    className="px-4 py-2 bg-luxury-gold text-white font-medium rounded-lg hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                  >
                    {couponLoading ? '...' : 'Apply'}
                  </button>
                </div>
                {appliedCoupon && (
                  <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-800">
                      Coupon "{appliedCoupon.code}" applied! 
                      {appliedCoupon.type === 'percentage' 
                        ? ` ${appliedCoupon.discount}% off` 
                        : ` ₹${appliedCoupon.discount} off`}
                    </p>
                    <button
                      onClick={() => {
                        setAppliedCoupon(null);
                        setCouponCode('');
                      }}
                      className="text-sm text-green-600 hover:text-green-700 underline"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>

              {/* Price Breakdown */}
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal ({cartData.summary.totalItems} items)</span>
                  <span>₹{cartData.summary.subtotal?.toLocaleString()}</span>
                </div>

                {cartData.summary.totalDiscount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Product Discounts</span>
                    <span>-₹{cartData.summary.totalDiscount?.toLocaleString()}</span>
                  </div>
                )}

                {appliedCoupon && (
                  <div className="flex justify-between text-green-600">
                    <span>Coupon Discount</span>
                    <span>-₹{appliedCoupon.discountAmount?.toLocaleString()}</span>
                  </div>
                )}

                <div className="flex justify-between text-gray-600">
                  <span className="flex items-center">
                    <FiTruck className="mr-1" />
                    Shipping
                  </span>
                  <span>
                    {cartData.summary.shippingCost === 0 ? (
                      <span className="text-green-600">Free</span>
                    ) : (
                      `₹${cartData.summary.shippingCost}`
                    )}
                  </span>
                </div>

                {cartData.summary.shippingCost > 0 && (
                  <p className="text-sm text-gray-500">
                    Add ₹{(cartData.summary.shippingThreshold - cartData.summary.subtotal).toLocaleString()} more for free shipping
                  </p>
                )}
              </div>

              {/* Total */}
              <div className="border-t border-gray-200 pt-4 mb-6">
                <div className="flex justify-between text-xl font-bold text-gray-900">
                  <span>Total</span>
                  <span>
                    ₹{(appliedCoupon 
                      ? cartData.summary.total - appliedCoupon.discountAmount 
                      : cartData.summary.total
                    )?.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Checkout Button */}
              <button
                onClick={proceedToCheckout}
                className="w-full bg-luxury-gold text-white font-semibold py-3 px-4 rounded-lg hover:bg-opacity-90 transition-all duration-200 mb-4"
              >
                Proceed to Checkout
              </button>

              {/* Continue Shopping */}
              <Link
                to="/products"
                className="block w-full text-center text-luxury-gold font-medium py-2 px-4 border border-luxury-gold rounded-lg hover:bg-luxury-gold hover:text-white transition-all duration-200"
              >
                Continue Shopping
              </Link>

              {/* Security Notice */}
              <div className="mt-6 p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-600 text-center">
                  🔒 Your payment information is secure and encrypted
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
