import { Link, useNavigate } from 'react-router-dom';
import { useCartStore } from '../store/cartStore';

export default function Cart() {
  const { items, removeItem, updateQty, total, clearCart } = useCartStore();
  const navigate = useNavigate();

  if (items.length === 0) {
    return (
      <div style={s.empty}>
        <p style={{ fontSize: 18, marginBottom: 16 }}>Your cart is empty</p>
        <Link to="/shop" style={s.shopBtn}>Continue Shopping</Link>
      </div>
    );
  }

  const shipping = total >= 1000 ? 0 : 60;

  return (
    <div style={s.page}>
      <h1 style={s.heading}>Shopping Cart</h1>

      <div style={s.layout}>
        <div style={s.itemsCol}>
          {items.map((item) => (
            <div key={item._id} style={s.row}>
              <img
                src={item.images?.[0]?.url}
                alt={item.name}
                style={s.thumb}
              />
              <div style={s.info}>
                <Link to={`/product/${item.slug}`} style={s.name}>{item.name}</Link>
                <p style={s.brand}>{item.brand?.name}</p>
                <p style={s.unitPrice}>৳{(item.discountPrice || item.price).toLocaleString()} each</p>
              </div>
              <div style={s.qtyWrap}>
                <button style={s.qtyBtn} onClick={() => updateQty(item._id, item.qty - 1)}>−</button>
                <span style={s.qtyNum}>{item.qty}</span>
                <button style={s.qtyBtn} onClick={() => updateQty(item._id, item.qty + 1)}>+</button>
              </div>
              <div style={s.lineTotal}>
                ৳{((item.discountPrice || item.price) * item.qty).toLocaleString()}
              </div>
              <button style={s.removeBtn} onClick={() => removeItem(item._id)}>✕</button>
            </div>
          ))}

          <button onClick={clearCart} style={s.clearBtn}>Clear Cart</button>
        </div>

        <div style={s.summary}>
          <h2 style={s.summaryTitle}>Order Summary</h2>
          <div style={s.summaryRow}>
            <span>Subtotal</span>
            <span>৳{total.toLocaleString()}</span>
          </div>
          <div style={s.summaryRow}>
            <span>Shipping</span>
            <span style={{ color: shipping === 0 ? '#38a169' : 'inherit' }}>
              {shipping === 0 ? 'Free' : `৳${shipping}`}
            </span>
          </div>
          {shipping === 0 && (
            <p style={s.freeShipNote}>Free shipping on orders over ৳1000</p>
          )}
          <div style={{ ...s.summaryRow, ...s.totalRow }}>
            <span>Total</span>
            <span>৳{(total + shipping).toLocaleString()}</span>
          </div>
          <button onClick={() => navigate('/checkout')} style={s.checkoutBtn}>
            Proceed to Checkout
          </button>
          <Link to="/shop" style={s.continueLink}>Continue Shopping</Link>
        </div>
      </div>
    </div>
  );
}

const s = {
  page:         { maxWidth: 1100, margin: '0 auto', padding: '32px 24px' },
  heading:      { fontSize: 28, fontWeight: 700, marginBottom: 28 },
  layout:       { display: 'grid', gridTemplateColumns: '1fr 340px', gap: 40, alignItems: 'start' },
  itemsCol:     {},
  row:          { display: 'flex', alignItems: 'center', gap: 16, padding: '16px 0', borderBottom: '1px solid #f0f0f0' },
  thumb:        { width: 80, height: 80, objectFit: 'cover', borderRadius: 8, background: '#f5f5f5', flexShrink: 0 },
  info:         { flex: 1 },
  name:         { fontSize: 15, fontWeight: 600, textDecoration: 'none', color: 'inherit', display: 'block', marginBottom: 4 },
  brand:        { fontSize: 13, color: '#888', margin: '0 0 4px' },
  unitPrice:    { fontSize: 13, color: '#555', margin: 0 },
  qtyWrap:      { display: 'flex', alignItems: 'center', border: '1px solid #e2e2e2', borderRadius: 8, overflow: 'hidden' },
  qtyBtn:       { width: 32, height: 36, background: 'none', border: 'none', fontSize: 16, cursor: 'pointer' },
  qtyNum:       { width: 36, textAlign: 'center', fontSize: 14, fontWeight: 600 },
  lineTotal:    { fontWeight: 700, fontSize: 16, minWidth: 80, textAlign: 'right' },
  removeBtn:    { background: 'none', border: 'none', color: '#aaa', fontSize: 16, cursor: 'pointer', padding: '4px 8px' },
  clearBtn:     { marginTop: 16, background: 'none', border: '1px solid #e2e2e2', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontSize: 14, color: '#888' },
  summary:      { border: '1px solid #eee', borderRadius: 12, padding: 24, position: 'sticky', top: 20 },
  summaryTitle: { fontSize: 18, fontWeight: 700, marginBottom: 20, marginTop: 0 },
  summaryRow:   { display: 'flex', justifyContent: 'space-between', marginBottom: 12, fontSize: 15 },
  totalRow:     { borderTop: '1px solid #eee', paddingTop: 12, marginTop: 4, fontWeight: 700, fontSize: 18 },
  freeShipNote: { fontSize: 12, color: '#38a169', margin: '-6px 0 12px', textAlign: 'right' },
  checkoutBtn:  { width: '100%', padding: '14px', background: '#1a1a1a', color: '#fff', border: 'none', borderRadius: 8, fontSize: 16, fontWeight: 600, cursor: 'pointer', marginTop: 8, marginBottom: 12 },
  continueLink: { display: 'block', textAlign: 'center', fontSize: 14, color: '#666', textDecoration: 'none' },
  empty:        { textAlign: 'center', padding: '80px 24px' },
  shopBtn:      { padding: '12px 24px', background: '#1a1a1a', color: '#fff', borderRadius: 8, textDecoration: 'none', fontWeight: 600 },
};