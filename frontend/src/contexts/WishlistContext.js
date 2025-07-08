import React, { createContext, useContext, useReducer, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from './AuthContext';

// Create Wishlist Context
const WishlistContext = createContext();

// Wishlist Actions
const WISHLIST_ACTIONS = {
  SET_WISHLIST: 'SET_WISHLIST',
  ADD_ITEM: 'ADD_ITEM',
  REMOVE_ITEM: 'REMOVE_ITEM',
  CLEAR_WISHLIST: 'CLEAR_WISHLIST',
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR'
};

// Initial State
const initialState = {
  items: [],
  itemCount: 0,
  loading: false,
  error: null
};

// Wishlist Reducer
const wishlistReducer = (state, action) => {
  switch (action.type) {
    case WISHLIST_ACTIONS.SET_WISHLIST:
      return {
        ...state,
        items: action.payload.items || [],
        itemCount: action.payload.itemCount || 0,
        loading: false,
        error: null
      };
    
    case WISHLIST_ACTIONS.ADD_ITEM:
      const existingItem = state.items.find(
        item => item._id === action.payload._id
      );
      
      if (existingItem) {
        return state; // Item already exists
      } else {
        return {
          ...state,
          items: [...state.items, action.payload],
          itemCount: state.itemCount + 1
        };
      }
    
    case WISHLIST_ACTIONS.REMOVE_ITEM:
      const filteredItems = state.items.filter(item => item._id !== action.payload);
      return {
        ...state,
        items: filteredItems,
        itemCount: state.itemCount - 1
      };
    
    case WISHLIST_ACTIONS.CLEAR_WISHLIST:
      return {
        ...state,
        items: [],
        itemCount: 0
      };
    
    case WISHLIST_ACTIONS.SET_LOADING:
      return {
        ...state,
        loading: action.payload
      };
    
    case WISHLIST_ACTIONS.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        loading: false
      };
    
    default:
      return state;
  }
};

// Wishlist Provider Component
export const WishlistProvider = ({ children }) => {
  const [state, dispatch] = useReducer(wishlistReducer, initialState);
  const { isAuthenticated } = useAuth();

  // Load wishlist from server on mount if authenticated
  useEffect(() => {
    if (isAuthenticated) {
      loadWishlist();
    }
  }, [isAuthenticated]);

  // Load wishlist from server
  const loadWishlist = async () => {
    if (!isAuthenticated) return;
    try {
      dispatch({ type: WISHLIST_ACTIONS.SET_LOADING, payload: true });
      const response = await axios.get('/api/users/wishlist');
      dispatch({
        type: WISHLIST_ACTIONS.SET_WISHLIST,
        payload: {
          items: response.data.wishlist || [],
          itemCount: response.data.wishlist?.length || 0
        }
      });
    } catch (error) {
      console.error('Failed to load wishlist:', error);
      // Don't show error toast for initial load
    } finally {
      dispatch({ type: WISHLIST_ACTIONS.SET_LOADING, payload: false });
    }
  };

  // Add item to wishlist
  const addToWishlist = async (productId) => {
    try {
      dispatch({ type: WISHLIST_ACTIONS.SET_LOADING, payload: true });
      
      // Use correct endpoint: productId as URL param
      const response = await axios.post(`/api/users/wishlist/${productId}`);
      
      dispatch({
        type: WISHLIST_ACTIONS.ADD_ITEM,
        payload: response.data.product
      });

      toast.success('Added to wishlist!');
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to add to wishlist';
      dispatch({ type: WISHLIST_ACTIONS.SET_ERROR, payload: errorMessage });
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Remove item from wishlist
  const removeFromWishlist = async (productId) => {
    try {
      dispatch({ type: WISHLIST_ACTIONS.SET_LOADING, payload: true });
      
      await axios.delete(`/api/users/wishlist/${productId}`);
      
      dispatch({
        type: WISHLIST_ACTIONS.REMOVE_ITEM,
        payload: productId
      });

      toast.success('Removed from wishlist');
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to remove from wishlist';
      dispatch({ type: WISHLIST_ACTIONS.SET_ERROR, payload: errorMessage });
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Clear wishlist
  const clearWishlist = async () => {
    try {
      dispatch({ type: WISHLIST_ACTIONS.SET_LOADING, payload: true });
      
      await axios.delete('/api/users/wishlist');
      
      dispatch({ type: WISHLIST_ACTIONS.CLEAR_WISHLIST });
      
      toast.success('Wishlist cleared');
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to clear wishlist';
      dispatch({ type: WISHLIST_ACTIONS.SET_ERROR, payload: errorMessage });
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Check if product is in wishlist
  const isInWishlist = (productId) => {
    return state.items.some(item => item._id === productId);
  };

  // Get wishlist item by ID
  const getWishlistItem = (productId) => {
    return state.items.find(item => item._id === productId);
  };

  // Move item from wishlist to cart
  const moveToCart = async (productId, variantId = null) => {
    try {
      // First remove from wishlist
      await removeFromWishlist(productId);
      
      // Then add to cart (this will be handled by cart context)
      return { success: true };
    } catch (error) {
      toast.error('Failed to move item to cart');
      return { success: false, error: error.message };
    }
  };

  const contextValue = {
    // State
    items: state.items,
    itemCount: state.itemCount,
    loading: state.loading,
    error: state.error,
    
    // Actions
    addToWishlist,
    removeFromWishlist,
    clearWishlist,
    loadWishlist,
    
    // Utilities
    isInWishlist,
    getWishlistItem,
    moveToCart
  };

  return (
    <WishlistContext.Provider value={contextValue}>
      {children}
    </WishlistContext.Provider>
  );
};

// Custom hook to use wishlist context
export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
}; 