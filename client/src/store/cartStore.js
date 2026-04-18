import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../services/api';
import { useAuthStore } from './authStore';

let skipNextServerPush = false;
let serverPushTimer = null;

const shouldSyncCartToServer = () => {
  const user = useAuthStore.getState().user;
  if (!user) return false;
  if (user.role === 'admin' || user.role === 'employee') return false;
  return true;
};

const scheduleServerCartSave = (items) => {
  if (!shouldSyncCartToServer()) return;
  clearTimeout(serverPushTimer);
  serverPushTimer = setTimeout(async () => {
    try {
      await api.put('/auth/cart', { items }, { _silent: true });
    } catch {
      /* offline or session expired */
    }
  }, 700);
};

const CART_STORAGE_KEY = 'shopbd-cart-v3';
const CART_TTL_MS = 3 * 24 * 60 * 60 * 1000;

const cartStorage = {
  getItem: (name) => {
    const raw = localStorage.getItem(name);
    if (!raw) return null;

    try {
      const parsed = JSON.parse(raw);

      // Backward compatibility with old persist payload format.
      if (parsed?.state && parsed?.version !== undefined) {
        return raw;
      }

      // New payload format with explicit TTL metadata.
      if (parsed?.value && parsed?.persistedAt) {
        const isExpired = Date.now() - parsed.persistedAt > CART_TTL_MS;
        if (isExpired) {
          localStorage.removeItem(name);
          return null;
        }
        return parsed.value;
      }
    } catch {
      localStorage.removeItem(name);
      return null;
    }

    localStorage.removeItem(name);
    return null;
  },

  setItem: (name, value) => {
    const payload = JSON.stringify({
      persistedAt: Date.now(),
      value,
    });
    localStorage.setItem(name, payload);
  },

  removeItem: (name) => localStorage.removeItem(name),
};

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
      lastUpdated: null,

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
        const variantStocks = Object.values(selectedVariants)
          .map((opt) => opt?.stock)
          .filter((stock) => Number.isFinite(stock));
        const availableStock = variantStocks.length
          ? Math.min(...variantStocks)
          : (product.totalStock ?? product.stock ?? 999);
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
            lastUpdated: Date.now(),
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
          set({ items: [...items, newItem], lastUpdated: Date.now() });
        }
        return { ok: true };
      },

      // ── removeItem ───────────────────────────────────────────────────────
      removeItem: (cartKey) =>
        set({ items: get().items.filter(i => i.cartKey !== cartKey), lastUpdated: Date.now() }),

      // ── updateQty ────────────────────────────────────────────────────────
      updateQty: (cartKey, newQty) => {
        if (newQty < 1) { get().removeItem(cartKey); return; }
        set({
          items: get().items.map(i => {
            if (i.cartKey !== cartKey) return i;
            const safeQty = Math.min(newQty, i.stock);
            return { ...i, qty: safeQty, lineTotal: safeQty * i.unitPrice };
          }),
          lastUpdated: Date.now(),
        });
      },

      clearCart: () => set({ items: [], lastUpdated: Date.now() }),

      /** Replace cart (e.g. after server load). Skips one debounced server push. */
      replaceAll: (items) => {
        skipNextServerPush = true;
        set({ items: Array.isArray(items) ? items : [], lastUpdated: Date.now() });
        queueMicrotask(() => {
          skipNextServerPush = false;
        });
      },

      // ── Derived values (computed on read, not stored) ─────────────────
      get itemCount() {
        return get().items.reduce((sum, i) => sum + i.qty, 0);
      },
      get subtotal() {
        return get().items.reduce((sum, i) => sum + i.lineTotal, 0);
      },
    }),
    {
      name: CART_STORAGE_KEY,
      version: 3,
      storage: cartStorage,
      partialize: (state) => ({ items: state.items, lastUpdated: state.lastUpdated }),
      // Wipe old cart on version bump to avoid shape mismatch crashes
      migrate: (_old, version) => (version < 3 ? { items: [], lastUpdated: null } : _old),
    }
  )
);

useCartStore.subscribe((state, prev) => {
  if (!prev) return;
  if (skipNextServerPush) return;
  if (state.items === prev.items) return;
  scheduleServerCartSave(state.items);
});