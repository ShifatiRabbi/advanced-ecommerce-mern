import { useSearchParams, Link } from 'react-router-dom';

export default function PaymentFail() {
  const [params] = useSearchParams();
  const reason   = params.get('reason');
  const method   = params.get('method');

  return (
    <div style={s.page} className="client-page-payment-payment-fail" id="client-page-payment-payment-fail">
      <div style={s.card}>
        <div style={s.icon}>
          <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
            <circle cx="28" cy="28" r="28" fill="#fee2e2"/>
            <path d="M20 20l16 16M36 20L20 36" stroke="#991b1b" strokeWidth="3"
              strokeLinecap="round"/>
          </svg>
        </div>
        <h1 style={s.title}>Payment Failed</h1>
        <p style={s.sub}>
          {reason
            ? `Reason: ${decodeURIComponent(reason)}`
            : `Your ${method || ''} payment could not be completed.`}
        </p>
        <p style={s.sub}>Your order is saved. You can retry payment from your orders page.</p>
        <div style={s.actions}>
          <Link to="/my-orders" style={s.primaryBtn}>My Orders</Link>
          <Link to="/cart"      style={s.secondaryBtn}>Back to Cart</Link>
        </div>
      </div>
    </div>
  );
}

const s = {
  page:        { minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 },
  card:        { maxWidth: 460, width: '100%', textAlign: 'center', border: '1px solid #eee', borderRadius: 16, padding: '48px 36px' },
  icon:        { marginBottom: 20 },
  title:       { fontSize: 26, fontWeight: 700, margin: '0 0 12px' },
  sub:         { fontSize: 15, color: '#555', margin: '0 0 8px' },
  actions:     { display: 'flex', gap: 12, justifyContent: 'center', marginTop: 28 },
  primaryBtn:  { padding: '11px 24px', background: '#1a1a1a', color: '#fff', borderRadius: 8, textDecoration: 'none', fontWeight: 600, fontSize: 14 },
  secondaryBtn:{ padding: '11px 24px', border: '1px solid #e2e2e2', borderRadius: 8, textDecoration: 'none', fontSize: 14, color: '#555' },
};