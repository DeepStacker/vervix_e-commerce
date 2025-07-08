import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiHeart, 
  FiShoppingCart, 
  FiTrash2, 
  FiArrowLeft,
  FiGrid,
  FiList,
  FiFilter,
  FiCheck,
  FiX,
  FiEye
} from 'react-icons/fi';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useCart } from '../contexts/CartContext';

const Wishlist = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { addToCart } = useCart();
  
  // State
  const [viewMode, setViewMode] = useState('grid'); // grid or list
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);

  // Fetch wishlist data
  const { data: wishlist, isLoading, error } = useQuery(
    'wishlist',
    async () => {
      const response = await axios.get('/api/users/wishlist');
      return response.data;
    },
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  );

  // Remove item mutation
  const removeItemMutation = useMutation(
    async (productId) => {
      const response = await axios.delete(`/api/users/wishlist/${productId}`);
      return response.data;
    },
    {
      onMutate: async (productId) => {
        // Optimistically update the cache
        await queryClient.cancelQueries('wishlist');
        const previousWishlist = queryClient.getQueryData('wishlist');
        
        queryClient.setQueryData('wishlist', (old) => 
          old ? old.filter(item => item._id !== productId) : []
        );
        
        return { previousWishlist };
      },
      onError: (err, productId, context) => {
        // Rollback on error
        if (context?.previousWishlist) {
          queryClient.setQueryData('wishlist', context.previousWishlist);
        }
        toast.error(err.response?.data?.message || 'Failed to remove item');
      },
      onSuccess: () => {
        toast.success('Removed from wishlist');
      },
      onSettled: () => {
        queryClient.invalidateQueries('wishlist');
      }
    }
  );

  // Clear wishlist mutation
  const clearWishlistMutation = useMutation(
    async () => {
      const response = await axios.delete('/api/users/wishlist');
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('wishlist');
        toast.success('Wishlist cleared');
        setSelectedItems(new Set());
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to clear wishlist');
      }
    }
  );

  // Move to cart mutation
  const moveToCartMutation = useMutation(
    async ({ productIds, moveAll = false }) => {
      const response = await axios.post('/api/users/wishlist/move-to-cart', {
        productIds,
        moveAll
      });
      return response.data;
    },
    {
      onSuccess: (data) => {
        if (data.success) {
          toast.success(data.message);
          queryClient.invalidateQueries(['wishlist', 'cart']);
          setSelectedItems(new Set());
        }
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to move items to cart');
      }
    }
  );

  // Handle item selection
  const handleItemSelect = (productId) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(productId)) {
        newSet.delete(productId);
      } else {
        newSet.add(productId);
      }
      setShowBulkActions(newSet.size > 0);
      return newSet;
    });
  };

  // Handle select all
  const handleSelectAll = () => {
    if (selectedItems.size === wishlist?.length) {
      setSelectedItems(new Set());
      setShowBulkActions(false);
    } else {
      setSelectedItems(new Set(wishlist?.map(item => item._id) || []));
      setShowBulkActions(true);
    }
  };

  // Handle individual move to cart
  const handleMoveToCart = async (productId) => {
    await moveToCartMutation.mutateAsync({ productIds: [productId] });
  };

  // Handle bulk move to cart
  const handleBulkMoveToCart = async () => {
    await moveToCartMutation.mutateAsync({ 
      productIds: Array.from(selectedItems)
    });
  };

  // Handle bulk remove
  const handleBulkRemove = async () => {
    if (window.confirm(`Remove ${selectedItems.size} items from wishlist?`)) {
      for (const productId of selectedItems) {
        await removeItemMutation.mutateAsync(productId);
      }
      setSelectedItems(new Set());
      setShowBulkActions(false);
    }
  };

  // Handle clear all
  const handleClearAll = async () => {
    if (window.confirm('Are you sure you want to clear your entire wishlist?')) {
      await clearWishlistMutation.mutateAsync();
    }
  };

  // Product card component
  const ProductCard = ({ product, isSelected, onSelect }) => (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className={`bg-white rounded-lg shadow-sm overflow-hidden group hover:shadow-lg transition-shadow ${
        isSelected ? 'ring-2 ring-luxury-gold' : ''
      }`}
    >
      {/* Selection checkbox */}
      {showBulkActions && (
        <div className="absolute top-3 left-3 z-10">
          <button
            onClick={() => onSelect(product._id)}
            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
              isSelected 
                ? 'bg-luxury-gold border-luxury-gold text-white' 
                : 'bg-white border-gray-300 hover:border-luxury-gold'
            }`}
          >
            {isSelected && <FiCheck size={14} />}
          </button>
        </div>
      )}

      {/* Product Image */}
      <div className="relative aspect-square overflow-hidden bg-gray-100">
        <img
          src={product.images?.[0]?.url || '/placeholder-product.jpg'}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        
        {/* Stock badge */}
        {product.inventory?.quantity === 0 && (
          <div className="absolute top-3 right-3 bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-medium">
            Out of Stock
          </div>
        )}
        
        {/* Quick actions overlay */}
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
          <div className="flex gap-2">
            <button
              onClick={() => navigate(`/products/${product._id}`)}
              className="bg-white text-gray-900 p-2 rounded-full shadow-lg hover:bg-gray-100 transition-colors"
            >
              <FiEye size={16} />
            </button>
            {product.inventory?.quantity > 0 && (
              <button
                onClick={() => handleMoveToCart(product._id)}
                disabled={moveToCartMutation.isLoading}
                className="bg-luxury-gold text-white p-2 rounded-full shadow-lg hover:bg-luxury-gold-dark transition-colors disabled:opacity-50"
              >
                <FiShoppingCart size={16} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Product Info */}
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">
          {product.name}
        </h3>
        <p className="text-sm text-gray-600 mb-2 line-clamp-1">
          {product.category?.name}
        </p>
        
        {/* Price */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {product.isOnSale ? (
              <>
                <span className="font-bold text-luxury-gold">
                  ${product.salePrice?.toFixed(2)}
                </span>
                <span className="text-sm text-gray-500 line-through">
                  ${product.price?.toFixed(2)}
                </span>
              </>
            ) : (
              <span className="font-bold text-gray-900">
                ${product.price?.toFixed(2)}
              </span>
            )}
          </div>
          {product.discount > 0 && (
            <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-medium">
              -{product.discount}%
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          {product.inventory?.quantity > 0 ? (
            <button
              onClick={() => handleMoveToCart(product._id)}
              disabled={moveToCartMutation.isLoading}
              className="flex-1 bg-luxury-gold text-white py-2 px-3 rounded-lg hover:bg-luxury-gold-dark transition-colors disabled:opacity-50 text-sm font-medium"
            >
              Move to Cart
            </button>
          ) : (
            <button
              disabled
              className="flex-1 bg-gray-100 text-gray-400 py-2 px-3 rounded-lg text-sm font-medium cursor-not-allowed"
            >
              Out of Stock
            </button>
          )}
          <button
            onClick={() => removeItemMutation.mutateAsync(product._id)}
            disabled={removeItemMutation.isLoading}
            className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
          >
            <FiTrash2 size={16} />
          </button>
        </div>
      </div>
    </motion.div>
  );

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="section-padding">
        <div className="container-luxury">
          <div className="animate-pulse">
            <div className="bg-gray-200 h-8 rounded w-1/4 mb-8"></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-gray-200 aspect-square rounded-lg"></div>
              ))}
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
            <h2 className="text-2xl font-bold text-red-600 mb-4">Error Loading Wishlist</h2>
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

  const isEmpty = !wishlist || wishlist.length === 0;

  return (
    <div className="section-padding bg-luxury-cream">
      <div className="container-luxury">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/products')}
                className="flex items-center gap-2 text-luxury-gold hover:text-luxury-gold-dark transition-colors"
              >
                <FiArrowLeft size={16} />
                Continue Shopping
              </button>
              <div>
                <h1 className="section-title">My Wishlist</h1>
                <p className="text-warm-gray mt-1">
                  {wishlist?.length || 0} item{wishlist?.length !== 1 ? 's' : ''} saved
                </p>
              </div>
            </div>
            
            {!isEmpty && (
              <div className="flex items-center gap-3">
                {/* View mode toggle */}
                <div className="flex items-center border border-gray-300 rounded-lg">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded-l-lg transition-colors ${
                      viewMode === 'grid' 
                        ? 'bg-luxury-gold text-white' 
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <FiGrid size={16} />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded-r-lg transition-colors ${
                      viewMode === 'list' 
                        ? 'bg-luxury-gold text-white' 
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <FiList size={16} />
                  </button>
                </div>

                {/* Bulk actions toggle */}
                <button
                  onClick={() => {
                    setShowBulkActions(!showBulkActions);
                    setSelectedItems(new Set());
                  }}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    showBulkActions
                      ? 'bg-luxury-gold text-white'
                      : 'border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  Select Items
                </button>

                {/* Clear all button */}
                <button
                  onClick={handleClearAll}
                  disabled={clearWishlistMutation.isLoading}
                  className="px-4 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                >
                  Clear All
                </button>
              </div>
            )}
          </div>

          {/* Bulk actions bar */}
          <AnimatePresence>
            {showBulkActions && !isEmpty && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-white rounded-lg p-4 shadow-sm mb-6"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={handleSelectAll}
                      className="flex items-center gap-2 text-sm font-medium text-gray-700"
                    >
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                        selectedItems.size === wishlist?.length
                          ? 'bg-luxury-gold border-luxury-gold text-white'
                          : 'border-gray-300'
                      }`}>
                        {selectedItems.size === wishlist?.length && <FiCheck size={12} />}
                      </div>
                      Select All ({wishlist?.length})
                    </button>
                    {selectedItems.size > 0 && (
                      <span className="text-sm text-gray-600">
                        {selectedItems.size} item{selectedItems.size !== 1 ? 's' : ''} selected
                      </span>
                    )}
                  </div>
                  
                  {selectedItems.size > 0 && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleBulkMoveToCart}
                        disabled={moveToCartMutation.isLoading}
                        className="flex items-center gap-2 bg-luxury-gold text-white px-4 py-2 rounded-lg hover:bg-luxury-gold-dark transition-colors disabled:opacity-50"
                      >
                        <FiShoppingCart size={16} />
                        Move to Cart
                      </button>
                      <button
                        onClick={handleBulkRemove}
                        disabled={removeItemMutation.isLoading}
                        className="flex items-center gap-2 text-red-600 hover:text-red-700 px-4 py-2 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                      >
                        <FiTrash2 size={16} />
                        Remove
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Empty state */}
        {isEmpty ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <div className="w-24 h-24 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
              <FiHeart size={32} className="text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Your wishlist is empty</h3>
            <p className="text-warm-gray mb-6">
              Save items you love to your wishlist and come back to them later.
            </p>
            <button
              onClick={() => navigate('/products')}
              className="bg-luxury-gold text-white px-6 py-3 rounded-lg hover:bg-luxury-gold-dark transition-colors"
            >
              Discover Products
            </button>
          </motion.div>
        ) : (
          /* Products grid */
          <motion.div
            layout
            className={`grid gap-6 ${
              viewMode === 'grid' 
                ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4' 
                : 'grid-cols-1'
            }`}
          >
            <AnimatePresence>
              {wishlist.map((product) => (
                <ProductCard
                  key={product._id}
                  product={product}
                  isSelected={selectedItems.has(product._id)}
                  onSelect={handleItemSelect}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Wishlist;
