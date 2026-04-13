import { Link, useParams } from 'react-router-dom';
import { useQuery }         from '@tanstack/react-query';
import api                  from '../services/api';

export default function OrderSuccess() {
  const { orderNumber } = useParams();

  const { data: order, isLoading } = useQuery({
    queryKey:  ['order-track', orderNumber],
    queryFn:   () => api.get(`/orders/track/${orderNumber}`).then(r => r.data.data),
    enabled:   !!orderNumber,
    retry:     3,
    retryDelay: 1000,
  });

  if (isLoading) return (
    <div style={{ textAlign: 'center', padding: 80 }}>
      <div style={{ fontSize: 40, marginBottom: 16 }}>⏳</div>
      <p>Loading your order...</p>
    </div>
  );

  return (
    <div style={{ maxWidth: 600, margin: '60px auto', padding: '0 24px', textAlign: 'center' }}>
      <div style={{ fontSize: 64, marginBottom: 16 }}>✅</div>
      <h1 style={{ fontSize: 28, fontWeight: 900, margin: '0 0 8px', color: '#111' }}>
        Order Placed!
      </h1>
      <p style={{ fontSize: 16, color: '#6b7280', marginBottom: 32 }}>
        Thank you for your order. We'll contact you to confirm delivery.
      </p>

      {order && (
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 24, textAlign: 'left', marginBottom: 28 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div>
              <p style={{ fontSize: 12, color: '#9ca3af', margin: '0 0 2px', textTransform: 'uppercase', fontWeight: 700 }}>Order number</p>
              <p style={{ fontSize: 20, fontWeight: 900, margin: 0, fontFamily: 'monospace', color: '#111' }}>{order.orderNumber}</p>
            </div>
            <span style={{ padding: '5px 12px', background: '#d1fae5', color: '#065f46', borderRadius: 20, fontSize: 13, fontWeight: 700 }}>
              {order.status}
            </span>
          </div>

          {/* Items */}
          <div style={{ marginBottom: 16 }}>
            {order.items?.map((item, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, padding: '8px 0', borderBottom: '1px solid #f3f4f6', alignItems: 'center' }}>
                {item.image && (
                  <img src={item.image} alt={item.name} style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 6, flexShrink: 0 }} />
                )}
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, margin: '0 0 2px' }}>{item.name}</p>
                  {item.variant && <p style={{ fontSize: 11, color: '#6b7280', margin: '0 0 2px' }}>{item.variant}</p>}
                  <p style={{ fontSize: 12, color: '#9ca3af', margin: 0 }}>×{item.qty}</p>
                </div>
                <span style={{ fontWeight: 700, fontSize: 14 }}>৳{item.total?.toLocaleString()}</span>
              </div>
            ))}
          </div>

          {/* Totals */}
          {[
            { l: 'Subtotal',   v: `৳${order.subtotal?.toLocaleString()}` },
            { l: 'Shipping',   v: `৳${order.shippingCharge?.toLocaleString()}` },
            ...(order.discount > 0 ? [{ l: 'Discount', v: `-৳${order.discount?.toLocaleString()}` }] : []),
          ].map(r => (
            <div key={r.l} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '4px 0', color: '#6b7280' }}>
              <span>{r.l}</span><span>{r.v}</span>
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: 16, padding: '10px 0', borderTop: '2px solid #e5e7eb', marginTop: 4 }}>
            <span>Total</span>
            <span style={{ color: '#2e7d32' }}>৳{order.total?.toLocaleString()}</span>
          </div>

          {/* Delivery address */}
          {order.shippingAddress && (
            <div style={{ marginTop: 16, padding: '12px 14px', background: '#f9fafb', borderRadius: 8, fontSize: 13, color: '#374151' }}>
              <p style={{ fontWeight: 700, margin: '0 0 6px', fontSize: 12, textTransform: 'uppercase', color: '#9ca3af' }}>Deliver to</p>
              <p style={{ margin: '0 0 2px', fontWeight: 600 }}>{order.shippingAddress.fullName}</p>
              <p style={{ margin: '0 0 2px' }}>{order.shippingAddress.phone}</p>
              <p style={{ margin: 0 }}>{order.shippingAddress.address}, {order.shippingAddress.city}</p>
            </div>
          )}

          <div style={{ marginTop: 16, padding: '10px 14px', background: '#eff6ff', borderRadius: 8, fontSize: 13, color: '#1d4ed8', display: 'flex', justifyContent: 'space-between' }}>
            <span>Payment: <strong>{order.paymentMethod?.toUpperCase()}</strong></span>
            <span>Status: <strong>{order.paymentStatus}</strong></span>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
        <Link to="/shop"
          style={{ padding: '12px 24px', background: '#2e7d32', color: '#fff', borderRadius: 8, textDecoration: 'none', fontWeight: 700, fontSize: 15 }}>
          Continue Shopping
        </Link>
        <Link to="/dashboard"
          style={{ padding: '12px 24px', border: '1px solid #e5e7eb', background: '#fff', borderRadius: 8, textDecoration: 'none', color: '#374151', fontSize: 15 }}>
          My Orders
        </Link>
      </div>
    </div>
  );
}

const s = {
  page: { minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 },
  card: { maxWidth: 560, width: '100%', border: '1px solid #eee', borderRadius: 16, padding: 40, textAlign: 'center' },
  iconWrap: { marginBottom: 20 },
  title: { fontSize: 26, fontWeight: 700, margin: '0 0 8px' },
  subtitle: { fontSize: 15, color: '#666', marginBottom: 28 },
  infoBox: { background: '#f9f9f9', borderRadius: 10, padding: 20, textAlign: 'left', marginBottom: 24 },
  infoRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  label: { fontSize: 13, color: '#888' },
  value: { fontSize: 14, fontWeight: 600 },
  statusBadge: { background: '#c6f6d5', color: '#276749', padding: '3px 10px', borderRadius: 20, fontSize: 13 },
  items: { borderTop: '1px solid #eee', paddingTop: 16, marginBottom: 24, textAlign: 'left' },
  itemRow: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10, fontSize: 14 },
  itemImg: { width: 44, height: 44, objectFit: 'cover', borderRadius: 6 },
  actions: { display: 'flex', gap: 12, justifyContent: 'center' },
  shopBtn: { padding: '10px 24px', background: '#1a1a1a', color: '#fff', borderRadius: 8, textDecoration: 'none', fontSize: 14, fontWeight: 600 },
  ordersBtn: { padding: '10px 24px', border: '1px solid #e2e2e2', borderRadius: 8, textDecoration: 'none', fontSize: 14, color: '#555' },
  paymentBtn: {
    padding: '10px 20px',
    background: '#1a56db',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: 14,
  },
};