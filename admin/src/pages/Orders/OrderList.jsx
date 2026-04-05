import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';

const TABS = [
  { key: '',           label: 'All' },
  { key: 'pending',    label: 'Pending' },
  { key: 'confirmed',  label: 'Confirmed' },
  { key: 'shipped',    label: 'Shipped' },
  { key: 'delivered',  label: 'Delivered' },
  { key: 'incomplete', label: 'Incomplete' },
  { key: 'fake',       label: 'Fake' },
  { key: 'cancelled',  label: 'Cancelled' },
];

const STATUS_COLORS = {
  pending:    '#fef3c7',
  confirmed:  '#dbeafe',
  processing: '#ede9fe',
  shipped:    '#e0f2fe',
  delivered:  '#dcfce7',
  cancelled:  '#fee2e2',
  incomplete: '#f1f5f9',
  fake:       '#fce7f3',
};

export default function OrderList() {
  const qc = useQueryClient();
  const [activeTab, setActiveTab]   = useState('');
  const [search, setSearch]         = useState('');
  const [page, setPage]             = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-orders', activeTab, search, page],
    queryFn:  () => api.get('/orders', { params: { status: activeTab || undefined, search: search || undefined, page } }).then(r => r.data.data),
  });

  const statsQuery = useQuery({
    queryKey: ['order-stats'],
    queryFn:  () => api.get('/orders/stats').then(r => r.data.data),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }) => api.patch(`/orders/${id}/status`, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-orders'] });
      qc.invalidateQueries({ queryKey: ['order-stats'] });
    },
  });

  const stats = statsQuery.data;

  return (
    <div>
      {stats && (
        <div style={s.statsRow}>
          {[
            { label: 'Total Orders',   value: stats.total },
            { label: 'Revenue',        value: `৳${stats.revenue?.toLocaleString()}` },
            { label: 'Incomplete',     value: stats.byStatus?.incomplete?.count || 0 },
            { label: 'Fake Orders',    value: stats.byStatus?.fake?.count || 0 },
          ].map((st) => (
            <div key={st.label} style={s.statCard}>
              <p style={s.statVal}>{st.value}</p>
              <p style={s.statLabel}>{st.label}</p>
            </div>
          ))}
        </div>
      )}

      <div style={s.tabs}>
        {TABS.map((t) => (
          <button key={t.key} onClick={() => { setActiveTab(t.key); setPage(1); }}
            style={{ ...s.tab, ...(activeTab === t.key && s.tabActive) }}>
            {t.label}
          </button>
        ))}
      </div>

      <div style={s.toolbar}>
        <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search by order no / phone / name..." style={s.search} />
      </div>

      {isLoading ? <p style={{ padding: 24 }}>Loading...</p> : (
        <table style={s.table}>
          <thead>
            <tr style={s.thead}>
              {['Order #','Customer','Phone','Items','Total','Payment','Status','Actions'].map((h) => (
                <th key={h} style={s.th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data?.orders?.map((o) => (
              <tr key={o._id} style={s.tr}>
                <td style={s.td}><span style={s.orderNum}>{o.orderNumber}</span></td>
                <td style={s.td}>{o.shippingAddress?.fullName}</td>
                <td style={s.td}>{o.shippingAddress?.phone}</td>
                <td style={s.td}>{o.items?.length} item(s)</td>
                <td style={s.td}><strong>৳{o.total?.toLocaleString()}</strong></td>
                <td style={s.td}>{o.paymentMethod?.toUpperCase()}</td>
                <td style={s.td}>
                  <span style={{ ...s.badge, background: STATUS_COLORS[o.status] || '#f1f5f9' }}>
                    {o.status}
                  </span>
                </td>
                <td style={s.td}>
                  <select
                    value={o.status}
                    onChange={(e) => statusMutation.mutate({ id: o._id, status: e.target.value })}
                    style={s.statusSelect}
                  >
                    {['pending','confirmed','processing','shipped','delivered','cancelled','fake'].map((st) => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div style={s.pagination}>
        {Array.from({ length: data?.pagination?.pages || 1 }, (_, i) => i + 1).map((pg) => (
          <button key={pg} onClick={() => setPage(pg)}
            style={{ ...s.pageBtn, ...(page === pg && s.pageBtnActive) }}>
            {pg}
          </button>
        ))}
      </div>
    </div>
  );
}

const s = {
  statsRow:    { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 24 },
  statCard:    { border: '1px solid #eee', borderRadius: 10, padding: '16px 20px', textAlign: 'center' },
  statVal:     { fontSize: 26, fontWeight: 700, margin: '0 0 4px' },
  statLabel:   { fontSize: 13, color: '#888', margin: 0 },
  tabs:        { display: 'flex', gap: 4, marginBottom: 16, flexWrap: 'wrap' },
  tab:         { padding: '7px 14px', border: '1px solid #e2e2e2', borderRadius: 20, background: 'none', cursor: 'pointer', fontSize: 13 },
  tabActive:   { background: '#1a1a1a', color: '#fff', borderColor: '#1a1a1a' },
  toolbar:     { marginBottom: 16 },
  search:      { width: 320, padding: '8px 12px', border: '1px solid #e2e2e2', borderRadius: 8, fontSize: 14 },
  table:       { width: '100%', borderCollapse: 'collapse', fontSize: 14 },
  thead:       { borderBottom: '2px solid #eee', textAlign: 'left' },
  th:          { padding: '10px 12px', fontWeight: 600, color: '#555' },
  tr:          { borderBottom: '1px solid #f5f5f5' },
  td:          { padding: '12px 12px', verticalAlign: 'middle' },
  orderNum:    { fontFamily: 'monospace', fontSize: 13 },
  badge:       { padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600 },
  statusSelect:{ padding: '4px 8px', border: '1px solid #e2e2e2', borderRadius: 6, fontSize: 13, cursor: 'pointer' },
  pagination:  { display: 'flex', gap: 8, marginTop: 20, justifyContent: 'center' },
  pageBtn:     { padding: '6px 12px', border: '1px solid #e2e2e2', borderRadius: 6, background: 'none', cursor: 'pointer', fontSize: 13 },
  pageBtnActive:{ background: '#1a1a1a', color: '#fff', borderColor: '#1a1a1a' },
};