import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';

const STAT_CARDS = [
  { key: 'revenue',    label: 'Total Revenue',   prefix: '৳', color: '#dcfce7', textColor: '#166534' },
  { key: 'orders',     label: 'Total Orders',    prefix: '',  color: '#dbeafe', textColor: '#1e40af' },
  { key: 'customers',  label: 'Customers',       prefix: '',  color: '#ede9fe', textColor: '#5b21b6' },
  { key: 'incomplete', label: 'Incomplete',      prefix: '',  color: '#fef9c3', textColor: '#854d0e' },
];

export default function Dashboard() {
  const { data: stats }   = useQuery({ queryKey: ['order-stats'],    queryFn: () => api.get('/orders/stats').then(r => r.data.data) });
  const { data: custData } = useQuery({ queryKey: ['customer-count'], queryFn: () => api.get('/customers?limit=1').then(r => r.data.data) });
  const { data: health }  = useQuery({ queryKey: ['health'],         queryFn: () => api.get('/health').then(r => r.data), refetchInterval: 30000 });
  const { data: lowStock }= useQuery({ queryKey: ['low-stock'],      queryFn: () => api.get('/products?stock_lte=5&limit=8').then(r => r.data.data) });
  const { data: recentOrders } = useQuery({ queryKey: ['recent-orders'], queryFn: () => api.get('/orders?limit=8').then(r => r.data.data) });

  const statValues = {
    revenue:    stats?.revenue ?? 0,
    orders:     stats?.total ?? 0,
    customers:  custData?.pagination?.total ?? 0,
    incomplete: stats?.byStatus?.incomplete?.count ?? 0,
  };

  return (
    <div>
      <h1 style={s.heading}>Dashboard</h1>

      <div style={s.statsGrid}>
        {STAT_CARDS.map(card => (
          <div key={card.key} style={{ ...s.statCard, background: card.color }}>
            <p style={{ ...s.statVal, color: card.textColor }}>
              {card.prefix}{Number(statValues[card.key]).toLocaleString()}
            </p>
            <p style={{ ...s.statLabel, color: card.textColor }}>{card.label}</p>
          </div>
        ))}
      </div>

      <div style={s.row2}>
        <section style={s.section}>
          <h2 style={s.sectionTitle}>Recent orders</h2>
          <table style={s.table}>
            <thead><tr style={s.thead}>
              {['Order #', 'Customer', 'Total', 'Status'].map(h => <th key={h} style={s.th}>{h}</th>)}
            </tr></thead>
            <tbody>
              {recentOrders?.orders?.map(o => (
                <tr key={o._id} style={s.tr}>
                  <td style={s.td}><code style={{ fontSize: 12 }}>{o.orderNumber}</code></td>
                  <td style={s.td}>{o.shippingAddress?.fullName}</td>
                  <td style={s.td}><strong>৳{o.total?.toLocaleString()}</strong></td>
                  <td style={s.td}><span style={{ ...s.badge, background: STATUS_BG[o.status] || '#f1f5f9' }}>{o.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <div>
          <section style={{ ...s.section, marginBottom: 20 }}>
            <h2 style={s.sectionTitle}>System health</h2>
            <div style={s.healthRow}>
              <span style={s.healthDot(health?.status === 'ok')} />
              <span style={{ fontSize: 14 }}>{health?.status === 'ok' ? 'All systems operational' : 'Checking...'}</span>
            </div>
            <p style={{ fontSize: 13, color: '#888', margin: '8px 0 0' }}>
              Uptime: {health ? Math.floor(health.uptime / 60) + ' min' : '—'}
            </p>
          </section>

          <section style={s.section}>
            <h2 style={s.sectionTitle}>Low stock alerts</h2>
            {lowStock?.products?.length === 0
              ? <p style={{ fontSize: 13, color: '#888' }}>No low stock items</p>
              : lowStock?.products?.map(p => (
                <div key={p._id} style={s.stockRow}>
                  <span style={s.stockName}>{p.name}</span>
                  <span style={{ ...s.stockBadge, color: p.stock === 0 ? '#991b1b' : '#854d0e', background: p.stock === 0 ? '#fee2e2' : '#fef9c3' }}>
                    {p.stock === 0 ? 'Out of stock' : `${p.stock} left`}
                  </span>
                </div>
              ))
            }
          </section>
        </div>
      </div>
    </div>
  );
}

const STATUS_BG = { pending: '#fef9c3', confirmed: '#dbeafe', shipped: '#e0f2fe', delivered: '#dcfce7', cancelled: '#fee2e2', incomplete: '#f1f5f9', fake: '#fce7f3' };

const s = {
  heading:      { fontSize: 22, fontWeight: 700, margin: '0 0 24px' },
  statsGrid:    { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 28 },
  statCard:     { borderRadius: 10, padding: '20px 24px' },
  statVal:      { fontSize: 28, fontWeight: 700, margin: '0 0 4px' },
  statLabel:    { fontSize: 13, margin: 0, fontWeight: 500 },
  row2:         { display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20 },
  section:      { background: '#fff', border: '1px solid #eee', borderRadius: 10, padding: 20 },
  sectionTitle: { fontSize: 15, fontWeight: 700, margin: '0 0 16px' },
  table:        { width: '100%', borderCollapse: 'collapse', fontSize: 14 },
  thead:        { borderBottom: '2px solid #eee', textAlign: 'left' },
  th:           { padding: '8px 10px', color: '#666', fontWeight: 600 },
  tr:           { borderBottom: '1px solid #f5f5f5' },
  td:           { padding: '10px 10px' },
  badge:        { padding: '2px 8px', borderRadius: 12, fontSize: 12, fontWeight: 500 },
  healthRow:    { display: 'flex', alignItems: 'center', gap: 8 },
  healthDot:    (ok) => ({ width: 10, height: 10, borderRadius: '50%', background: ok ? '#22c55e' : '#f59e0b', flexShrink: 0 }),
  stockRow:     { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  stockName:    { fontSize: 13, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  stockBadge:   { fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 10, flexShrink: 0, marginLeft: 8 },
};