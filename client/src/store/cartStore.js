import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Build a stable cart key from productId + selected variant labels
const makeCartKey = (productId, selectedVariants = {}) => {
  const varStr = Object.entries(selectedVariants)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v?.label ?? v}`)
    .join('&');
  return varStr ? `${productId}__${varStr}` : productId;
};

// Calculate the real unit price: base discounted price + variant price modifier
const calcUnitPrice = (product, selectedVariants = {}) => {
  const base = product.discountPrice ?? product.price ?? 0;
  const adj  = Object.values(selectedVariants)
    .reduce((sum, opt) => sum + (opt?.priceModifier ?? 0), 0);
  return base + adj;
};

export const useCartStore = create(
  persist(
    (set, get) => ({
      items: [],

      // ── addItem ──────────────────────────────────────────────────────────
      // product: full product object from API
      // qty: number
      // selectedVariants: { 'Size': { label: 'XL', priceModifier: 50, stock: 10 }, ... }
      addItem: (product, qty = 1, selectedVariants = {}) => {
        if (!product?._id) return { ok: false, reason: 'Invalid product' };

        const cartKey  = makeCartKey(product._id, selectedVariants);
        const unitPrice = calcUnitPrice(product, selectedVariants);
        const items    = get().items;
        const existing = items.find(i => i.cartKey === cartKey);

        // Stock check
        const variantOpt = Object.values(selectedVariants)[0]; // first variant for stock check
        const availableStock = variantOpt?.stock ?? product.stock ?? 999;
        const currentQty = existing?.qty ?? 0;

        if (availableStock === 0) {
          return { ok: false, reason: 'This item is out of stock' };
        }
        if (currentQty + qty > availableStock) {
          return {
            ok: false,
            reason: `Only ${availableStock} available. You already have ${currentQty} in cart.`,
          };
        }

        if (existing) {
          set({
            items: items.map(i =>
              i.cartKey === cartKey
                ? { ...i, qty: i.qty + qty, lineTotal: (i.qty + qty) * i.unitPrice }
                : i
            ),
          });
        } else {
          const newItem = {
            cartKey,
            productId:       product._id,
            name:            product.name,
            slug:            product.slug,
            image:           product.images?.[0]?.url ?? '',
            originalPrice:   product.price,
            discountPrice:   product.discountPrice ?? null,
            unitPrice,
            qty,
            lineTotal:       qty * unitPrice,
            stock:           availableStock,
            categoryId:      product.category?._id ?? product.category ?? null,
            categoryName:    product.category?.name ?? '',
            selectedVariants,    // full variant objects { label, priceModifier, stock }
            variantSummary:      // human-readable for display
              Object.entries(selectedVariants)
                .map(([k, v]) => `${k}: ${v?.label ?? v}`)
                .join(', '),
          };
          set({ items: [...items, newItem] });
        }
        return { ok: true };
      },

      // ── removeItem ───────────────────────────────────────────────────────
      removeItem: (cartKey) =>
        set({ items: get().items.filter(i => i.cartKey !== cartKey) }),

      // ── updateQty ────────────────────────────────────────────────────────
      updateQty: (cartKey, newQty) => {
        if (newQty < 1) { get().removeItem(cartKey); return; }
        set({
          items: get().items.map(i => {
            if (i.cartKey !== cartKey) return i;
            const safeQty = Math.min(newQty, i.stock);
            return { ...i, qty: safeQty, lineTotal: safeQty * i.unitPrice };
          }),
        });
      },

      clearCart: () => set({ items: [] }),

      // ── Derived values (computed on read, not stored) ─────────────────
      get itemCount() {
        return get().items.reduce((sum, i) => sum + i.qty, 0);
      },
      get subtotal() {
        return get().items.reduce((sum, i) => sum + i.lineTotal, 0);
      },
    }),
    {
      name:    'shopbd-cart-v3',
      version: 3,
      // Wipe old cart on version bump to avoid shape mismatch crashes
      migrate: (_old, version) => (version < 3 ? { items: [] } : _old),
    }
  )
);