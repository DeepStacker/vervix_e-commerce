import React, { createContext, useContext, useReducer, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from './AuthContext';

// Create Cart Context
const CartContext = createContext();

// Cart Actions
const CART_ACTIONS = {
  SET_CART: 'SET_CART',
  ADD_ITEM: 'ADD_ITEM',
  REMOVE_ITEM: 'REMOVE_ITEM',
  UPDATE_QUANTITY: 'UPDATE_QUANTITY',
  CLEAR_CART: 'CLEAR_CART',
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR'
};

// Initial State
const initialState = {
  items: [],
  total: 0,
  itemCount: 0,
  loading: false,
  error: null
};

// Cart Reducer
const cartReducer = (state, action) => {
  switch (action.type) {
    case CART_ACTIONS.SET_CART:
      return {
        ...state,
        items: action.payload.items || [],
        total: action.payload.total || 0,
        itemCount: action.payload.itemCount || 0,
        loading: false,
        error: null
      };
    
    case CART_ACTIONS.ADD_ITEM:
      const existingItem = state.items.find(
        item => item._id === action.payload._id
      );
      
      if (existingItem) {
        const updatedItems = state.items.map(item =>
          item._id === action.payload._id
            ? { ...item, quantity: item.quantity + action.payload.quantity }
            : item
        );
        return {
          ...state,
          items: updatedItems,
          itemCount: state.itemCount + action.payload.quantity,
          total: state.total + (action.payload.price * action.payload.quantity)
        };
      } else {
        return {
          ...state,
          items: [...state.items, action.payload],
          itemCount: state.itemCount + action.payload.quantity,
          total: state.total + (action.payload.price * action.payload.quantity)
        };
      }
    
    case CART_ACTIONS.REMOVE_ITEM:
      const removedItem = state.items.find(item => item._id === action.payload);
      const filteredItems = state.items.filter(item => item._id !== action.payload);
      
      return {
        ...state,
        items: filteredItems,
        itemCount: state.itemCount - (removedItem?.quantity || 0),
        total: state.total - (removedItem ? removedItem.price * removedItem.quantity : 0)
      };
    
    case CART_ACTIONS.UPDATE_QUANTITY:
      const updatedItems = state.items.map(item => {
        if (item._id === action.payload.itemId) {
          const quantityDiff = action.payload.quantity - item.quantity;
          return {
            ...item,
            quantity: action.payload.quantity
          };
        }
        return item;
      });
      
      const updatedItem = updatedItems.find(item => item._id === action.payload.itemId);
      const quantityDiff = action.payload.quantity - (state.items.find(item => item._id === action.payload.itemId)?.quantity || 0);
      
      return {
        ...state,
        items: updatedItems,
        itemCount: state.itemCount + quantityDiff,
        total: state.total + (updatedItem?.price * quantityDiff || 0)
      };
    
    case CART_ACTIONS.CLEAR_CART:
      return {
        ...state,
        items: [],
        total: 0,
        itemCount: 0
      };
    
    case CART_ACTIONS.SET_LOADING:
      return {
        ...state,
        loading: action.payload
      };
    
    case CART_ACTIONS.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        loading: false
      };
    
    default:
      return state;
  }
};

// Cart Provider Component
export const CartProvider = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, initialState);
  const { isAuthenticated } = useAuth();

  // Load cart from server on mount if authenticated
  useEffect(() => {
    if (isAuthenticated) {
      loadCart();
    }
  }, [isAuthenticated]);

  // Load cart from server
  const loadCart = async () => {
    if (!isAuthenticated) return;
    try {
      dispatch({ type: CART_ACTIONS.SET_LOADING, payload: true });
      const response = await axios.get('/api/cart');
      dispatch({
        type: CART_ACTIONS.SET_CART,
        payload: {
          items: response.data.items || [],
          total: response.data.total || 0,
          itemCount: response.data.itemCount || 0
        }
      });
    } catch (error) {
      console.error('Failed to load cart:', error);
    } finally {
      dispatch({ type: CART_ACTIONS.SET_LOADING, payload: false });
    }
  };

  // Add item to cart
  const addToCart = async (productId, variantId, quantity = 1) => {
    try {
      dispatch({ type: CART_ACTIONS.SET_LOADING, payload: true });
      
      const response = await axios.post('/api/cart/add', {
        productId,
        variantId,
        quantity
      });

      const newItem = response.data.item;
      dispatch({
        type: CART_ACTIONS.ADD_ITEM,
        payload: newItem
      });

      toast.success('Added to cart successfully!');
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to add to cart';
      dispatch({ type: CART_ACTIONS.SET_ERROR, payload: errorMessage });
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Remove item from cart
  const removeFromCart = async (itemId) => {
    try {
      dispatch({ type: CART_ACTIONS.SET_LOADING, payload: true });
      
      await axios.delete(`/api/cart/remove/${itemId}`);
      
      dispatch({
        type: CART_ACTIONS.REMOVE_ITEM,
        payload: itemId
      });

      toast.success('Item removed from cart');
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to remove item';
      dispatch({ type: CART_ACTIONS.SET_ERROR, payload: errorMessage });
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Update item quantity
  const updateQuantity = async (itemId, quantity) => {
    try {
      dispatch({ type: CART_ACTIONS.SET_LOADING, payload: true });
      
      await axios.put(`/api/cart/update/${itemId}`, { quantity });
      
      dispatch({
        type: CART_ACTIONS.UPDATE_QUANTITY,
        payload: { itemId, quantity }
      });

      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to update quantity';
      dispatch({ type: CART_ACTIONS.SET_ERROR, payload: errorMessage });
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Clear cart
  const clearCart = async () => {
    try {
      dispatch({ type: CART_ACTIONS.SET_LOADING, payload: true });
      
      await axios.delete('/api/cart/clear');
      
      dispatch({ type: CART_ACTIONS.CLEAR_CART });
      
      toast.success('Cart cleared successfully');
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to clear cart';
      dispatch({ type: CART_ACTIONS.SET_ERROR, payload: errorMessage });
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Get cart item by ID
  const getCartItem = (itemId) => {
    return state.items.find(item => item._id === itemId);
  };

  // Check if product is in cart
  const isInCart = (productId, variantId = null) => {
    return state.items.some(item => 
      item.product === productId && 
      (!variantId || item.variant?._id === variantId)
    );
  };

  // Get cart item quantity
  const getItemQuantity = (productId, variantId = null) => {
    const item = state.items.find(item => 
      item.product === productId && 
      (!variantId || item.variant?._id === variantId)
    );
    return item ? item.quantity : 0;
  };

  // Calculate cart totals
  const calculateTotals = () => {
    const subtotal = state.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const shipping = subtotal >= 100 ? 0 : 10; // Free shipping over $100
    const tax = subtotal * 0.08; // 8% tax
    const total = subtotal + shipping + tax;

    return {
      subtotal,
      shipping,
      tax,
      total
    };
  };

  const contextValue = {
    // State
    items: state.items,
    total: state.total,
    itemCount: state.itemCount,
    loading: state.loading,
    error: state.error,
    
    // Actions
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    loadCart,
    
    // Utilities
    getCartItem,
    isInCart,
    getItemQuantity,
    calculateTotals
  };

  return (
    <CartContext.Provider value={contextValue}>
      {children}
    </CartContext.Provider>
  );
};

// Custom hook to use cart context
export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}; 