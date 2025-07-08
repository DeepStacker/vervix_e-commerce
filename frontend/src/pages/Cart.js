import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiTrash2, FiMinus, FiPlus, FiArrowLeft, FiLock, FiTruck, FiShield, FiRefreshCw, FiShoppingCart } from 'react-icons/fi';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import axios from 'axios';
import toast from 'react-hot-toast';

const Cart = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [updatingItems, setUpdatingItems] = useState(new Set());

  // Fetch cart data
  const { data: cart, isLoading, error } = useQuery(
    'cart',
    async () => {
      const response = await axios.get('/api/cart');
      return response.data;
    },
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  );

  // Mutations
  const updateQuantityMutation = useMutation(
    async ({ itemId, quantity }) => {
      const response = await axios.put(`/api/cart/update/${itemId}`, { quantity });
      return response.data;
    },
    {
      onMutate: async ({ itemId, quantity }) => {
        // Cancel any outgoing refetches
        await queryClient.cancelQueries('cart');
        
        // Snapshot the previous value
        const previousCart = queryClient.getQueryData('cart');
        
        // Optimistically update the cache
        queryClient.setQueryData('cart', old => {
          if (!old || !old.items) return old;
          
          const updatedItems = old.items.map(item => 
            item._id === itemId ? { ...item, quantity } : item
          );
          
          return {
            ...old,
            items: updatedItems
          };
        });
        
        return { previousCart };
      },
      onError: (err, variables, context) => {
        // Rollback on error
        if (context?.previousCart) {
          queryClient.setQueryData('cart', context.previousCart);
        }
        toast.error(err.response?.data?.message || 'Failed to update cart');
      },
      onSettled: () => {
        queryClient.invalidateQueries('cart');
      }
    }
  );

  const removeItemMutation = useMutation(
    async (itemId) => {
      const response = await axios.delete(`/api/cart/remove/${itemId}`);
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('cart');
        toast.success('Item removed from cart');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to remove item');
      }
    }
  );

  const clearCartMutation = useMutation(
    async () => {
      const response = await axios.delete('/api/cart/clear');
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('cart');
        toast.success('Cart cleared');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to clear cart');
      }
    }
  );

  // Handle quantity update
  const handleQuantityUpdate = async (itemId, newQuantity) => {
    if (newQuantity < 1) return;
    
    setUpdatingItems(prev => new Set(prev).add(itemId));
    await updateQuantityMutation.mutateAsync({ itemId, quantity: newQuantity });
    setUpdatingItems(prev => {
      const newSet = new Set(prev);
      newSet.delete(itemId);
      return newSet;
    });
  };

  // Handle item removal
  const handleRemoveItem = async (itemId) => {
    await removeItemMutation.mutateAsync(itemId);
  };

  // Handle clear cart
  const handleClearCart = async () => {
    if (window.confirm('Are you sure you want to clear your cart?')) {
      await clearCartMutation.mutateAsync();
    }
  };

  // Calculate totals
  const subtotal = cart?.items?.reduce((sum, item) => sum + (item.price * item.quantity), 0) || 0;
  const shipping = subtotal >= 100 ? 0 : 10; // Free shipping over $100
  const tax = subtotal * 0.08; // 8% tax
  const total = subtotal + shipping + tax;

  if (isLoading) {
    return (
      <div className="section-padding">
        <div className="container-luxury">
          <div className="animate-pulse">
            <div className="bg-gray-200 h-8 rounded w-1/4 mb-8"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="bg-gray-200 h-32 rounded-lg"></div>
                ))}
              </div>
              <div className="bg-gray-200 h-64 rounded-lg"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="section-padding">
        <div className="container-luxury">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-red-600 mb-4">Error Loading Cart</h2>
            <p className="text-warm-gray mb-6">{error.message}</p>
            <button
              onClick={() => navigate('/products')}
              className="bg-luxury-gold text-white px-6 py-3 rounded-lg hover:bg-luxury-gold-dark transition-colors"
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!cart?.items || cart.items.length === 0) {
    return (
      <div className="section-padding">
        <div className="container-luxury">
          <div className="text-center max-w-md mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8"
            >
              <div className="w-24 h-24 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
                <FiShoppingCart size={32} className="text-gray-400" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h2>
              <p className="text-warm-gray mb-8">
                Looks like you haven't added any items to your cart yet.
              </p>
            </motion.div>
            
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              onClick={() => navigate('/products')}
              className="bg-luxury-gold text-white px-8 py-4 rounded-lg hover:bg-luxury-gold-dark transition-colors font-medium"
            >
              Start Shopping
            </motion.button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="section-padding bg-luxury-cream">
      <div className="container-luxury">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="section-title">Shopping Cart</h1>
              <p className="text-warm-gray mt-2">
                {cart.items.length} item{cart.items.length !== 1 ? 's' : ''} in your cart
              </p>
            </div>
            <button
              onClick={() => navigate('/products')}
              className="flex items-center gap-2 text-luxury-gold hover:text-luxury-gold-dark transition-colors"
            >
              <FiArrowLeft size={16} />
              Continue Shopping
            </button>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-2 space-y-4"
          >
            {/* Cart Actions */}
            <div className="flex items-center justify-between bg-white rounded-lg p-4 shadow-sm">
              <h2 className="font-semibold text-gray-900">Cart Items</h2>
              <button
                onClick={handleClearCart}
                disabled={clearCartMutation.isLoading}
                className="text-red-600 hover:text-red-700 text-sm font-medium disabled:opacity-50"
              >
                {clearCartMutation.isLoading ? 'Clearing...' : 'Clear Cart'}
              </button>
            </div>

            {/* Items List */}
            <AnimatePresence>
              {cart.items.map((item, index) => (
                <motion.div
                  key={item._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-lg shadow-sm overflow-hidden"
                >
                  <div className="flex items-center p-4">
                    {/* Product Image */}
                    <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                      <img
                        src={item.image || '/placeholder-product.jpg'}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Product Info */}
                    <div className="flex-1 ml-4">
                      <h3 className="font-semibold text-gray-900 mb-1">{item.name}</h3>
                      <p className="text-sm text-warm-gray mb-2">
                        {item.variant?.size && `Size: ${item.variant.size}`}
                        {item.variant?.color && ` • Color: ${item.variant.color}`}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-gray-900">
                          ${item.price.toFixed(2)}
                        </span>
                        <span className="text-sm text-warm-gray">
                          ${(item.price * item.quantity).toFixed(2)} total
                        </span>
                      </div>
                    </div>

                    {/* Quantity Controls */}
                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() => handleQuantityUpdate(item._id, item.quantity - 1)}
                        disabled={item.quantity <= 1 || updatingItems.has(item._id)}
                        className="p-1 rounded hover:bg-gray-100 disabled:opacity-50"
                      >
                        <FiMinus size={16} />
                      </button>
                      <span className="w-12 text-center font-medium">
                        {updatingItems.has(item._id) ? '...' : item.quantity}
                      </span>
                      <button
                        onClick={() => handleQuantityUpdate(item._id, item.quantity + 1)}
                        disabled={updatingItems.has(item._id)}
                        className="p-1 rounded hover:bg-gray-100 disabled:opacity-50"
                      >
                        <FiPlus size={16} />
                      </button>
                    </div>

                    {/* Remove Button */}
                    <button
                      onClick={() => handleRemoveItem(item._id)}
                      disabled={removeItemMutation.isLoading}
                      className="ml-4 p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                    >
                      <FiTrash2 size={18} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>

          {/* Order Summary */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-1"
          >
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-4">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Order Summary</h2>

              {/* Price Breakdown */}
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Shipping</span>
                  <span className="font-medium">
                    {shipping === 0 ? 'Free' : `$${shipping.toFixed(2)}`}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tax</span>
                  <span className="font-medium">${tax.toFixed(2)}</span>
                </div>
                <div className="border-t border-gray-200 pt-3 flex justify-between text-lg font-semibold">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>

              {/* Shipping Info */}
              {shipping > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6">
                  <p className="text-sm text-blue-800">
                    Add ${(100 - subtotal).toFixed(2)} more to get free shipping!
                  </p>
                </div>
              )}

              {/* Features */}
              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <FiTruck className="text-luxury-gold" />
                  <span>Free shipping on orders over $100</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <FiShield className="text-luxury-gold" />
                  <span>Secure checkout</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <FiRefreshCw className="text-luxury-gold" />
                  <span>Easy returns</span>
                </div>
              </div>

              {/* Checkout Button */}
              <button
                onClick={() => navigate('/checkout')}
                className="w-full bg-luxury-gold text-white py-4 px-6 rounded-lg hover:bg-luxury-gold-dark transition-colors font-medium flex items-center justify-center gap-2"
              >
                <FiLock size={18} />
                Proceed to Checkout
              </button>

              {/* Payment Methods */}
              <div className="mt-4 text-center">
                <p className="text-xs text-gray-500 mb-2">We accept</p>
                <div className="flex items-center justify-center gap-2">
                  <div className="w-8 h-5 bg-gray-200 rounded"></div>
                  <div className="w-8 h-5 bg-gray-200 rounded"></div>
                  <div className="w-8 h-5 bg-gray-200 rounded"></div>
                  <div className="w-8 h-5 bg-gray-200 rounded"></div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Cart; 