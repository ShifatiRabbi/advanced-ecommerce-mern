import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';

const STATUS_COLORS = {
  pending:    { bg: '#fef3c7', color: '#92400e' },
  confirmed:  { bg: '#dbeafe', color: '#1e40af' },
  processing: { bg: '#ede9fe', color: '#5b21b6' },
  shipped:    { bg: '#e0f2fe', color: '#0369a1' },
  delivered:  { bg: '#dcfce7', color: '#166534' },
  cancelled:  { bg: '#fee2e2', color: '#991b1b' },
  fake:       { bg: '#f1f5f9', color: '#64748b' },
};

export default function MyOrders() {
  const { data, isLoading } = useQuery({
    queryKey: ['my-orders'],
    queryFn:  () => api.get('/orders/my').then(r => r.data.data),
  });

  if (isLoading) return <p style={{ padding: 40, textAlign: 'center' }}>Loading orders...</p>;

  const orders = data?.orders || [];

  if (orders.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: 80 }}>
        <p style={{ fontSize: 18, marginBottom: 16 }}>No orders yet</p>
        <Link to="/shop" style={{ padding: '10px 24px', background: '#1a1a1a', color: '#fff', borderRadius: 8, textDecoration: 'none' }}>
          Start Shopping
        </Link>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 24px' }} className="client-page-my-orders" id="client-page-my-orders">
      <h1 style={{ fontSize: 26, fontWeight: 700, marginBottom: 24 }}>My Orders</h1>
      {orders.map((order) => {
        const col = STATUS_COLORS[order.status] || STATUS_COLORS.pending;
        return (
          <div key={order._id} style={s.card}>
            <div style={s.cardHeader}>
              <div>
                <span style={s.orderNum}>{order.orderNumber}</span>
                <span style={s.date}>{new Date(order.createdAt).toLocaleDateString()}</span>
              </div>
              <span style={{ ...s.badge, background: col.bg, color: col.color }}>
                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
              </span>
            </div>
            <div style={s.itemsRow}>
              {order.items.slice(0, 3).map((item, i) => (
                <div key={i} style={s.miniItem}>
                  {item.image && <img src={item.image} alt={item.name} style={s.miniImg} />}
                  <span style={s.miniName}>{item.name}</span>
                </div>
              ))}
              {order.items.length > 3 && (
                <span style={s.moreItems}>+{order.items.length - 3} more</span>
              )}
            </div>
            <div style={s.cardFooter}>
              <span style={s.total}>৳{order.total.toLocaleString()}</span>
              <span style={s.payment}>{order.paymentMethod.toUpperCase()}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

const s = {
  card:       { border: '1px solid #eee', borderRadius: 12, padding: 20, marginBottom: 16 },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  orderNum:   { fontWeight: 700, fontSize: 15, marginRight: 12 },
  date:       { fontSize: 13, color: '#888' },
  badge:      { padding: '4px 12px', borderRadius: 20, fontSize: 13, fontWeight: 600 },
  itemsRow:   { display: 'flex', gap: 12, alignItems: 'center', marginBottom: 14, flexWrap: 'wrap' },
  miniItem:   { display: 'flex', alignItems: 'center', gap: 8 },
  miniImg:    { width: 40, height: 40, objectFit: 'cover', borderRadius: 6, background: '#f5f5f5' },
  miniName:   { fontSize: 13, color: '#555', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  moreItems:  { fontSize: 12, color: '#aaa' },
  cardFooter: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f0f0f0', paddingTop: 12 },
  total:      { fontWeight: 700, fontSize: 18 },
  payment:    { fontSize: 12, color: '#888', background: '#f5f5f5', padding: '3px 8px', borderRadius: 4 },
};