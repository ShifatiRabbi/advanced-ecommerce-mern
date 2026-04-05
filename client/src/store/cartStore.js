import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useCartStore = create(
  persist(
    (set, get) => ({
      items: [],

      addItem: (product, qty = 1) => {
        const items = get().items;
        const existing = items.find((i) => i._id === product._id);
        if (existing) {
          set({
            items: items.map((i) =>
              i._id === product._id
                ? { ...i, qty: Math.min(i.qty + qty, product.stock) }
                : i
            ),
          });
        } else {
          set({ items: [...items, { ...product, qty }] });
        }
      },

      removeItem: (id) =>
        set({ items: get().items.filter((i) => i._id !== id) }),

      updateQty: (id, qty) => {
        if (qty < 1) return get().removeItem(id);
        set({ items: get().items.map((i) => (i._id === id ? { ...i, qty } : i)) });
      },

      clearCart: () => set({ items: [] }),

      get total() {
        return get().items.reduce(
          (sum, i) => sum + (i.discountPrice || i.price) * i.qty,
          0
        );
      },

      get itemCount() {
        return get().items.reduce((sum, i) => sum + i.qty, 0);
      },
    }),
    {
      name: 'cart-store',
      partialize: (state) => ({ items: state.items }),
    }
  )
);