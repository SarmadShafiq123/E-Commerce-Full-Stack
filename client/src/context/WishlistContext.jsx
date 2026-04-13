import { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { userAPI } from '../services/api';
import { AuthContext } from './AuthContext';

export const WishlistContext = createContext();

export const WishlistProvider = ({ children }) => {
  const { user } = useContext(AuthContext);
  const [wishlist, setWishlist] = useState([]);
  const [wishlistIds, setWishlistIds] = useState(new Set());
  const [loading, setLoading] = useState(false);

  const fetchWishlist = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data } = await userAPI.getWishlist();
      const products = data.data || [];
      setWishlist(products);
      setWishlistIds(new Set(products.map((p) => p._id)));
    } catch (error) {
      console.error('[Wishlist] Failed to fetch:', error.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchWishlist();
    } else {
      // Clear on logout
      setWishlist([]);
      setWishlistIds(new Set());
    }
  }, [user, fetchWishlist]);

  const addToWishlist = async (productId) => {
    try {
      await userAPI.addToWishlist(productId);
      setWishlistIds((prev) => new Set([...prev, productId]));
      // Refresh full list for wishlist page accuracy
      fetchWishlist();
    } catch (error) {
      console.error('[Wishlist] Failed to add:', error.message);
      throw error;
    }
  };

  const removeFromWishlist = async (productId) => {
    try {
      await userAPI.removeFromWishlist(productId);
      setWishlistIds((prev) => {
        const next = new Set(prev);
        next.delete(productId);
        return next;
      });
      setWishlist((prev) => prev.filter((p) => p._id !== productId));
    } catch (error) {
      console.error('[Wishlist] Failed to remove:', error.message);
      throw error;
    }
  };

  const isInWishlist = (productId) => wishlistIds.has(productId);

  return (
    <WishlistContext.Provider
      value={{
        wishlist,
        wishlistIds,
        loading,
        addToWishlist,
        removeFromWishlist,
        isInWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
};
