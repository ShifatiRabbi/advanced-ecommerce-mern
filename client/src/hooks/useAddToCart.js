import { useCartStore } from '../store/cartStore';
import { toast }        from '../utils/toast';

/**
 * Returns a stable `addToCart(product, qty, selectedVariants)` function
 * that handles stock checks, shows toasts, and returns a boolean.
 */
export const useAddToCart = () => {
  const { addItem } = useCartStore();

  const addToCart = (product, qty = 1, selectedVariants = {}) => {
    if (!product) return false;

    // Require variant selection when product has variants
    if (product.variants?.length > 0) {
      for (const variant of product.variants) {
        if (!selectedVariants[variant.name]) {
          toast.warning(`Please select a ${variant.name} first`);
          return false;
        }
      }
    }

    const result = addItem(product, qty, selectedVariants);

    if (result.ok) {
      toast.success(
        `"${product.name.slice(0, 40)}${product.name.length > 40 ? '…' : ''}" added to cart!`,
        3000
      );
      return true;
    } else {
      toast.error(result.reason || 'Could not add to cart');
      return false;
    }
  };

  return addToCart;
};