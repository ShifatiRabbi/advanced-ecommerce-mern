import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const calcItemPrice = (item) => {
  const base  = item.discountPrice || item.price;
  const adj   = Object.values(item.selectedVariants || {})
    .reduce((s, o) => s + (o?.priceModifier || 0), 0);
  return base + adj;
};

export const useCartStore = create(
  persist(
    (set, get) => ({
      items: [],

      // Build a unique key from product + variant combo
      _key: (productId, variants) => {
        const varStr = Object.entries(variants || {})
          .sort(([a],[b]) => a.localeCompare(b))
          .map(([k,v]) => `${k}:${v?.label}`)
          .join('|');
        return `${productId}__${varStr}`;
      },

      addItem: (product, qty = 1, selectedVariants = {}) => {
        const { items, _key } = get();
        const key  = _key(product._id, selectedVariants);
        const unit = calcItemPrice({ ...product, selectedVariants });
        const existing = items.find(i => i.cartKey === key);

        if (existing) {
          set({ items: items.map(i => i.cartKey === key
            ? { ...i, qty: i.qty + qty, total: (i.qty + qty) * unit }
            : i
          )});
        } else {
          set({ items: [...items, {
            cartKey:           key,
            _id:               product._id,
            name:              product.name,
            slug:              product.slug,
            image:             product.images?.[0]?.url || '',
            price:             product.price,
            discountPrice:     product.discountPrice,
            selectedVariants,
            unitPrice:         unit,
            qty,
            total:             qty * unit,
            stock:             product.stock,
            category:          product.category,
          }]});
        }
      },

      removeItem: (cartKey) =>
        set({ items: get().items.filter(i => i.cartKey !== cartKey) }),

      updateQty: (cartKey, qty) => {
        if (qty < 1) { get().removeItem(cartKey); return; }
        set({ items: get().items.map(i =>
          i.cartKey === cartKey
            ? { ...i, qty, total: qty * i.unitPrice }
            : i
        )});
      },

      clearCart: () => set({ items: [] }),

      get itemCount() { return get().items.reduce((s, i) => s + i.qty, 0); },
      get subtotal()  { return get().items.reduce((s, i) => s + i.total, 0); },
    }),
    {
      name:    'shopbd-cart',
      version: 2, // bump version to clear old cart shape
      migrate: (old, version) => version < 2 ? { items: [] } : old,
    }
  )
);