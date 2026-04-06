import { create } from 'zustand';
import api from '../services/api';

export const useWishlistStore = create((set, get) => ({
  items:   [],
  loading: false,

  fetchWishlist: async () => {
    try {
      set({ loading: true });
      const { data } = await api.get('/wishlist');
      set({ items: data.data, loading: false });
    } catch { set({ loading: false }); }
  },

  toggle: async (productId) => {
    const { data } = await api.post(`/wishlist/toggle/${productId}`);
    get().fetchWishlist();
    return data.data;
  },

  isWishlisted: (productId) => get().items.some(i => i._id === productId),
}));