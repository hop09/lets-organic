'use client';

import { createContext, useContext, useReducer, useEffect, useState, useCallback } from 'react';

const CartContext = createContext();

const CART_STORAGE_KEY = 'letsorganic_cart';

function cartReducer(state, action) {
  switch (action.type) {
    case 'ADD_ITEM': {
      const itemId = action.payload.id || action.payload._id || action.payload.slug;
      const existingIndex = state.items.findIndex(item => (item.id || item._id) === itemId);
      if (existingIndex >= 0) {
        const newItems = [...state.items];
        newItems[existingIndex] = {
          ...newItems[existingIndex],
          quantity: newItems[existingIndex].quantity + (action.payload.quantity || 1),
        };
        return { ...state, items: newItems };
      }
      return {
        ...state,
        items: [...state.items, { ...action.payload, id: itemId, quantity: action.payload.quantity || 1 }],
      };
    }
    case 'REMOVE_ITEM':
      return {
        ...state,
        items: state.items.filter(item => (item.id || item._id) !== action.payload),
      };
    case 'UPDATE_QUANTITY': {
      if (action.payload.quantity <= 0) {
        return {
          ...state,
          items: state.items.filter(item => (item.id || item._id) !== action.payload.id),
        };
      }
      return {
        ...state,
        items: state.items.map(item =>
          (item.id || item._id) === action.payload.id
            ? { ...item, quantity: action.payload.quantity }
            : item
        ),
      };
    }
    case 'CLEAR_CART':
      return { ...state, items: [] };
    case 'HYDRATE':
      return { ...state, items: action.payload };
    default:
      return state;
  }
}

export function CartProvider({ children }) {
  const [state, dispatch] = useReducer(cartReducer, { items: [] });
  const [isOpen, setIsOpen] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const [toasts, setToasts] = useState([]);

  // Hydrate from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      if (stored) {
        dispatch({ type: 'HYDRATE', payload: JSON.parse(stored) });
      }
    } catch (e) {
      console.error('Failed to load cart:', e);
    }
    setIsHydrated(true);
  }, []);

  // Persist to localStorage
  useEffect(() => {
    if (isHydrated) {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(state.items));
    }
  }, [state.items, isHydrated]);

  const addToast = useCallback((message) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  }, []);

  const addItem = useCallback((product, quantity = 1) => {
    const normalizedId = product.id || product._id || product.slug;
    dispatch({ type: 'ADD_ITEM', payload: { ...product, id: normalizedId, quantity } });
    addToast(`${product.name} added to cart`);
  }, [addToast]);

  const removeItem = useCallback((id) => {
    dispatch({ type: 'REMOVE_ITEM', payload: id });
  }, []);

  const updateQuantity = useCallback((id, quantity) => {
    dispatch({ type: 'UPDATE_QUANTITY', payload: { id, quantity } });
  }, []);

  const clearCart = useCallback(() => {
    dispatch({ type: 'CLEAR_CART' });
  }, []);

  const totalItems = state.items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = state.items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items: state.items,
        isOpen,
        setIsOpen,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        totalItems,
        totalPrice,
        isHydrated,
        toasts,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
