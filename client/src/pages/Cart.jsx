import { Link, useNavigate } from 'react-router-dom';
import { useCartStore }      from '../store/cartStore';
import { toast }             from '../utils/toast';

export default function Cart() {
  const navigate               = useNavigate();
  const { items, removeItem, updateQty, clearCart } = useCartStore();

  // Compute from items (derived)
  const subtotal   = items.reduce((s, i) => s + i.lineTotal, 0);
  const itemCount  = items.reduce((s, i) => s + i.qty, 0);

  if (items.length === 0) return (
    <div style={{ textAlign: 'center', padding: '80px 24px' }}>
      <div style={{ fontSize: 60, marginBottom: 16 }}>🛒</div>
      <h2 style={{ margin: '0 0 10px', fontSize: 22, fontWeight: 800 }}>Your cart is empty</h2>
      <p style={{ color: '#6b7280', marginBottom: 24 }}>Add some products to get started.</p>
      <button onClick={() => navigate('/shop')}
        style={{ padding: '12px 28px', background: '#2e7d32', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 15, fontWeight: 700 }}>
        Browse Products
      </button>
    </div>
  );

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 20px 60px' }}>
      <h1 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 24px' }}>
        Shopping Cart ({itemCount} item{itemCount !== 1 ? 's' : ''})
      </h1>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24, alignItems: 'start' }}>

        {/* ── Cart Items ──────────────────────────────────────────────────── */}
        <div>
          {items.map(item => (
            <div key={item.cartKey} style={{ display: 'flex', gap: 16, border: '1px solid #e5e7eb', borderRadius: 12, padding: 16, marginBottom: 12, background: '#fff', alignItems: 'flex-start' }}>

              {/* Thumbnail */}
              <Link to={`/product/${item.slug}`}
                style={{ display: 'block', width: 90, height: 90, borderRadius: 8, overflow: 'hidden', background: '#f5f5f5', flexShrink: 0 }}>
                {item.image
                  ? <img src={item.image} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <div style={{ width: '100%', height: '100%', background: '#e5e7eb' }} />}
              </Link>

              <div style={{ flex: 1, minWidth: 0 }}>
                {/* Name */}
                <Link to={`/product/${item.slug}`}
                  style={{ textDecoration: 'none', color: '#111', fontWeight: 700, fontSize: 15, display: 'block', marginBottom: 4, lineHeight: 1.3 }}>
                  {item.name}
                </Link>

                {/* Variant tags */}
                {item.variantSummary && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                    {Object.entries(item.selectedVariants || {}).map(([key, opt]) => (
                      <span key={key}
                        style={{ fontSize: 12, background: '#f0fdf4', border: '1px solid #a7f3d0', color: '#065f46', padding: '2px 10px', borderRadius: 20, fontWeight: 600 }}>
                        {key}: {opt?.label ?? opt}
                        {(opt?.priceModifier ?? 0) !== 0 && (
                          <span style={{ marginLeft: 4, color: (opt.priceModifier > 0 ? '#059669' : '#dc2626') }}>
                            ({opt.priceModifier > 0 ? '+' : ''}৳{opt.priceModifier})
                          </span>
                        )}
                      </span>
                    ))}
                  </div>
                )}

                {/* Price per unit */}
                <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 8 }}>
                  ৳{item.unitPrice.toLocaleString()} each
                  {item.discountPrice && item.originalPrice && (
                    <span style={{ marginLeft: 6, textDecoration: 'line-through', color: '#d1d5db' }}>
                      ৳{(item.originalPrice + Object.values(item.selectedVariants || {}).reduce((s,o)=>s+(o?.priceModifier??0),0)).toLocaleString()}
                    </span>
                  )}
                </div>

                {/* Qty + remove */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden' }}>
                    <button
                      onClick={() => updateQty(item.cartKey, item.qty - 1)}
                      style={{ width: 34, height: 34, border: 'none', background: '#f9fafb', fontSize: 18, cursor: 'pointer', fontWeight: 700 }}>
                      −
                    </button>
                    <span style={{ width: 40, textAlign: 'center', fontSize: 15, fontWeight: 700 }}>{item.qty}</span>
                    <button
                      onClick={() => {
                        if (item.qty >= item.stock) {
                          toast.warning(`Only ${item.stock} in stock`);
                          return;
                        }
                        updateQty(item.cartKey, item.qty + 1);
                      }}
                      style={{ width: 34, height: 34, border: 'none', background: '#f9fafb', fontSize: 18, cursor: 'pointer', fontWeight: 700 }}>
                      +
                    </button>
                  </div>
                  <button
                    onClick={() => { removeItem(item.cartKey); toast.info('Item removed from cart'); }}
                    style={{ fontSize: 13, color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
                    Remove
                  </button>
                </div>
              </div>

              {/* Line total */}
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <p style={{ fontSize: 18, fontWeight: 800, margin: 0, color: '#111' }}>
                  ৳{item.lineTotal.toLocaleString()}
                </p>
                {item.qty > 1 && (
                  <p style={{ fontSize: 12, color: '#9ca3af', margin: '2px 0 0' }}>
                    {item.qty} × ৳{item.unitPrice.toLocaleString()}
                  </p>
                )}
              </div>
            </div>
          ))}

          <button
            onClick={() => { clearCart(); toast.info('Cart cleared'); }}
            style={{ background: 'none', border: '1px solid #fecaca', color: '#dc2626', padding: '7px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 13 }}>
            Clear Cart
          </button>
        </div>

        {/* ── Order Summary ───────────────────────────────────────────────── */}
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 24, position: 'sticky', top: 20 }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 17, fontWeight: 700 }}>Order Summary</h3>

          {/* Item breakdown */}
          <div style={{ marginBottom: 16 }}>
            {items.map(item => (
              <div key={item.cartKey} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '5px 0', borderBottom: '1px solid #f3f4f6', gap: 8 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#374151' }}>
                    {item.name}
                  </div>
                  {item.variantSummary && (
                    <div style={{ fontSize: 11, color: '#9ca3af' }}>{item.variantSummary}</div>
                  )}
                  <div style={{ fontSize: 11, color: '#9ca3af' }}>×{item.qty} @ ৳{item.unitPrice.toLocaleString()}</div>
                </div>
                <span style={{ fontWeight: 700, flexShrink: 0 }}>৳{item.lineTotal.toLocaleString()}</span>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15, padding: '8px 0', borderTop: '1px solid #e5e7eb' }}>
            <span style={{ color: '#6b7280' }}>Subtotal</span>
            <span style={{ fontWeight: 700 }}>৳{subtotal.toLocaleString()}</span>
          </div>
          <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 20, padding: '4px 0' }}>
            Shipping calculated at checkout
          </div>

          <button
            onClick={() => navigate('/checkout')}
            style={{ width: '100%', padding: '14px', background: '#2e7d32', color: '#fff', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 700, cursor: 'pointer', marginBottom: 10 }}>
            Proceed to Checkout →
          </button>
          <button
            onClick={() => navigate('/shop')}
            style={{ width: '100%', padding: '10px', border: '1px solid #e5e7eb', borderRadius: 8, background: '#fff', cursor: 'pointer', fontSize: 14, color: '#374151' }}>
            Continue Shopping
          </button>
        </div>
      </div>
    </div>
  );
}