import { Link, useNavigate } from 'react-router-dom';
import { useCartStore }      from '../store/cartStore';
import { toast }             from '../utils/toast';

export default function Cart() {
  const navigate = useNavigate();
  const { items, removeItem, updateQty, subtotal, itemCount, clearCart } = useCartStore();

  if (items.length === 0) return (
    <div style={{ textAlign:'center', padding:'80px 24px' }}>
      <div style={{ fontSize:64, marginBottom:16 }}>🛒</div>
      <h2 style={{ margin:'0 0 12px' }}>Your cart is empty</h2>
      <button onClick={() => navigate('/shop')}
        style={{ padding:'12px 28px', background:'#111827', color:'#fff', border:'none', borderRadius:8, cursor:'pointer', fontSize:15, fontWeight:600 }}>
        Browse Products
      </button>
    </div>
  );

  return (
    <div style={{ maxWidth:1100, margin:'0 auto', padding:'32px 20px' }}>
      <h1 style={{ margin:'0 0 24px', fontSize:24, fontWeight:800 }}>Shopping Cart ({itemCount} items)</h1>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 360px', gap:24, alignItems:'start' }}>
        <div>
          {items.map(item => (
            <div key={item.cartKey} style={{ display:'flex', gap:16, border:'1px solid #e5e7eb', borderRadius:10, padding:16, marginBottom:12, background:'#fff' }}>
              <Link to={`/product/${item.slug}`} style={{ display:'block', width:88, height:88, borderRadius:8, overflow:'hidden', flexShrink:0, background:'#f5f5f5' }}>
                {item.image && <img src={item.image} alt={item.name} style={{ width:'100%', height:'100%', objectFit:'cover' }} />}
              </Link>
              <div style={{ flex:1 }}>
                <Link to={`/product/${item.slug}`} style={{ textDecoration:'none', color:'#111', fontWeight:600, fontSize:15 }}>{item.name}</Link>

                {/* Variant display */}
                {Object.keys(item.selectedVariants || {}).length > 0 && (
                  <div style={{ display:'flex', flexWrap:'wrap', gap:6, margin:'6px 0' }}>
                    {Object.entries(item.selectedVariants).map(([k,v]) => (
                      <span key={k} style={{ fontSize:12, background:'#f3f4f6', padding:'2px 8px', borderRadius:20, color:'#374151' }}>
                        {k}: <strong>{v?.label}</strong>
                        {v?.priceModifier !== 0 && v?.priceModifier && (
                          <span style={{ color: v.priceModifier>0?'#059669':'#dc2626', marginLeft:4 }}>
                            {v.priceModifier>0?'+':''}৳{v.priceModifier}
                          </span>
                        )}
                      </span>
                    ))}
                  </div>
                )}

                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginTop:8 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <div style={{ display:'flex', alignItems:'center', border:'1px solid #e5e7eb', borderRadius:6, overflow:'hidden' }}>
                      <button onClick={() => updateQty(item.cartKey, item.qty - 1)}
                        style={{ width:32, height:32, border:'none', background:'#f9fafb', cursor:'pointer', fontSize:18, fontWeight:700 }}>−</button>
                      <span style={{ width:40, textAlign:'center', fontSize:15, fontWeight:600 }}>{item.qty}</span>
                      <button onClick={() => { if (item.qty >= item.stock) { toast.warning(`Only ${item.stock} in stock`); return; } updateQty(item.cartKey, item.qty + 1); }}
                        style={{ width:32, height:32, border:'none', background:'#f9fafb', cursor:'pointer', fontSize:18, fontWeight:700 }}>+</button>
                    </div>
                    <button onClick={() => removeItem(item.cartKey)}
                      style={{ fontSize:13, color:'#dc2626', background:'none', border:'none', cursor:'pointer', textDecoration:'underline' }}>
                      Remove
                    </button>
                  </div>
                  <div style={{ textAlign:'right' }}>
                    <div style={{ fontWeight:800, fontSize:17, color:'#111' }}>৳{item.total.toLocaleString()}</div>
                    <div style={{ fontSize:12, color:'#9ca3af' }}>৳{item.unitPrice.toLocaleString()} each</div>
                  </div>
                </div>
              </div>
            </div>
          ))}

          <button onClick={() => { clearCart(); toast.success('Cart cleared'); }}
            style={{ background:'none', border:'1px solid #fecaca', color:'#dc2626', padding:'8px 16px', borderRadius:8, cursor:'pointer', fontSize:13 }}>
            Clear cart
          </button>
        </div>

        {/* Summary */}
        <div style={{ background:'#fff', border:'1px solid #e5e7eb', borderRadius:10, padding:24, position:'sticky', top:20 }}>
          <h3 style={{ margin:'0 0 16px', fontSize:16, fontWeight:700 }}>Order Summary</h3>

          {items.map(item => (
            <div key={item.cartKey} style={{ display:'flex', justifyContent:'space-between', fontSize:13, padding:'5px 0', borderBottom:'1px solid #f3f4f6' }}>
              <span style={{ color:'#555', flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', marginRight:8 }}>
                {item.name}
                {Object.keys(item.selectedVariants||{}).length>0 && (
                  <span style={{ color:'#9ca3af', marginLeft:4, fontSize:11 }}>
                    ({Object.values(item.selectedVariants).map(v=>v?.label).join(', ')})
                  </span>
                )}
                {' '}×{item.qty}
              </span>
              <span style={{ fontWeight:600, flexShrink:0 }}>৳{item.total.toLocaleString()}</span>
            </div>
          ))}

          <div style={{ display:'flex', justifyContent:'space-between', padding:'12px 0', fontSize:15 }}>
            <span style={{ color:'#6b7280' }}>Subtotal</span>
            <span style={{ fontWeight:700 }}>৳{subtotal.toLocaleString()}</span>
          </div>

          <div style={{ padding:'10px 0', borderTop:'1px solid #e5e7eb', marginBottom:16, fontSize:13, color:'#6b7280' }}>
            Shipping calculated at checkout
          </div>

          <button onClick={() => navigate('/checkout')}
            style={{ width:'100%', padding:14, background:'#111827', color:'#fff', border:'none', borderRadius:8, fontSize:15, fontWeight:700, cursor:'pointer' }}>
            Proceed to Checkout
          </button>
          <button onClick={() => navigate('/shop')}
            style={{ width:'100%', marginTop:10, padding:10, border:'1px solid #e5e7eb', borderRadius:8, background:'#fff', cursor:'pointer', fontSize:14 }}>
            Continue Shopping
          </button>
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