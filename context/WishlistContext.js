'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const WishlistContext = createContext();

const WISHLIST_STORAGE_KEY = 'letsorganic_wishlist';

export function WishlistProvider({ children }) {
  const [items, setItems] = useState([]);
  const [isHydrated, setIsHydrated] = useState(false);

  // Hydrate from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(WISHLIST_STORAGE_KEY);
      if (stored) {
        setItems(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Failed to load wishlist:', e);
    }
    setIsHydrated(true);
  }, []);

  // Persist to localStorage
  useEffect(() => {
    if (isHydrated) {
      localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(items));
    }
  }, [items, isHydrated]);

  const toggleItem = useCallback((productId) => {
    setItems(prev => {
      if (prev.includes(productId)) {
        return prev.filter(id => id !== productId);
      }
      return [...prev, productId];
    });
  }, []);

  const isWishlisted = useCallback((productId) => {
    return items.includes(productId);
  }, [items]);

  const totalItems = items.length;

  return (
    <WishlistContext.Provider
      value={{
        items,
        toggleItem,
        isWishlisted,
        totalItems,
        isHydrated,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
}
