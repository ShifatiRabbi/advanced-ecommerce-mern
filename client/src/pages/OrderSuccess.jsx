import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useSSLPayment, useBkashPayment } from '../hooks/usePayment';
import api from '../services/api';

export default function OrderSuccess() {
  const { orderNumber } = useParams();
  const sslMutation = useSSLPayment();
  const bkashMutation = useBkashPayment();

  const { data: order, isLoading } = useQuery({
    queryKey: ['order-track', orderNumber],
    queryFn: () => api.get(`/orders/track/${orderNumber}`).then((r) => r.data.data),
    enabled: !!orderNumber,
  });

  if (isLoading) return <div style={{ padding: 80, textAlign: 'center' }}>Loading...</div>;

  const renderPaymentDetails = () => {
    if (order?.paymentStatus === 'paid' && order?.paymentMethod === 'cod') {
      return (
        <>
          <h1 style={s.title}>Order Placed Successfully!</h1>
          <p style={s.subtitle}>Thank you for your purchase. We will contact you soon.</p>

          <div style={s.infoBox}>
            <div style={s.infoRow}>
              <span style={s.label}>Order Number</span>
              <span style={s.value}>{order?.orderNumber}</span>
            </div>
            <div style={s.infoRow}>
              <span style={s.label}>Status</span>
              <span style={{ ...s.value, ...s.statusBadge }}>{order?.status}</span>
            </div>
            <div style={s.infoRow}>
              <span style={s.label}>Total Paid</span>
              <span style={{ ...s.value, fontSize: 20, fontWeight: 700 }}>
                ৳{order?.total?.toLocaleString()}
              </span>
            </div>
            <div style={s.infoRow}>
              <span style={s.label}>Payment</span>
              <span style={s.value}>{order?.paymentMethod?.toUpperCase()}</span>
            </div>
            <div style={s.infoRow}>
              <span style={s.label}>Deliver To</span>
              <span style={s.value}>
                {order?.shippingAddress?.fullName}, {order?.shippingAddress?.city}
              </span>
            </div>
          </div>

          <div style={s.items}>
            {order?.items?.map((item, i) => (
              <div key={i} style={s.itemRow}>
                {item.image && <img src={item.image} alt={item.name} style={s.itemImg} />}
                <span style={{ flex: 1 }}>{item.name}</span>
                <span style={{ color: '#888' }}>x{item.qty}</span>
                <span style={{ fontWeight: 700 }}>৳{item.total?.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </>
      );
    }

    if (order?.paymentStatus !== 'paid' && order?.paymentMethod !== 'cod') {
      return (
        <div style={{ borderTop: '1px solid #eee', paddingTop: 20, marginTop: 8 }}>
          <p style={{ fontSize: 14, color: '#888', marginBottom: 12 }}>Complete your payment:</p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            <button
              onClick={() => sslMutation.mutate(order._id)}
              disabled={sslMutation.isPending}
              style={s.paymentBtn}
            >
              {sslMutation.isPending ? 'Redirecting...' : 'Pay with Card'}
            </button>
            <button
              onClick={() => bkashMutation.mutate(order._id)}
              disabled={bkashMutation.isPending}
              style={s.paymentBtn}
            >
              {bkashMutation.isPending ? 'Redirecting...' : 'Pay with bKash'}
            </button>
          </div>
        </div>
      );
    }
  };

  return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={s.iconWrap}>
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
            <circle cx="24" cy="24" r="24" fill="#c6f6d5" />
            <path
              d="M14 24l7 7 13-13"
              stroke="#276749"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        {renderPaymentDetails()}
        <div style={s.actions}>
          <Link to="/shop" style={s.shopBtn}>Continue Shopping</Link>
          <Link to="/my-orders" style={s.ordersBtn}>View My Orders</Link>
        </div>
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