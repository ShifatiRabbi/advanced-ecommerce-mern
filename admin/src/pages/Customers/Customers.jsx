import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';

export default function Customers() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage]     = useState(1);
  const [selected, setSelected] = useState(null);

  const { data } = useQuery({
    queryKey: ['customers', search, page],
    queryFn:  () => api.get('/customers', { params: { search: search || undefined, page, limit: 20 } }).then(r => r.data.data),
  });

  const detail = useQuery({
    queryKey: ['customer-detail', selected],
    queryFn:  () => api.get(`/customers/${selected}`).then(r => r.data.data),
    enabled:  !!selected,
  });

  const blockMutation = useMutation({
    mutationFn: (id) => api.patch(`/customers/${id}/toggle`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['customers'] }),
  });

  return (
    <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 360px' : '1fr', gap: 20 }}>
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
          <h2 style={{ margin: 0 }}>Customers ({data?.pagination?.total ?? 0})</h2>
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by name, email, phone..."
            style={{ padding: '8px 12px', border: '1px solid #e2e2e2', borderRadius: 8, fontSize: 14, width: 280 }} />
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead><tr style={{ borderBottom: '2px solid #eee', textAlign: 'left' }}>
            {['Name', 'Email', 'Phone', 'Joined', 'Status', 'Actions'].map(h =>
              <th key={h} style={{ padding: '10px 12px', color: '#555', fontWeight: 600 }}>{h}</th>)}
          </tr></thead>
          <tbody>
            {data?.customers?.map(c => (
              <tr key={c._id} style={{ borderBottom: '1px solid #f5f5f5', cursor: 'pointer' }}
                  onClick={() => setSelected(c._id)}>
                <td style={{ padding: '12px' }}><strong>{c.name}</strong></td>
                <td style={{ padding: '12px', color: '#666' }}>{c.email}</td>
                <td style={{ padding: '12px' }}>{c.phone || '—'}</td>
                <td style={{ padding: '12px', color: '#888', fontSize: 13 }}>{new Date(c.createdAt).toLocaleDateString()}</td>
                <td style={{ padding: '12px' }}>
                  <span style={{ padding: '3px 8px', borderRadius: 12, fontSize: 12, fontWeight: 600, background: c.isActive ? '#dcfce7' : '#fee2e2', color: c.isActive ? '#166534' : '#991b1b' }}>
                    {c.isActive ? 'Active' : 'Blocked'}
                  </span>
                </td>
                <td style={{ padding: '12px' }} onClick={e => e.stopPropagation()}>
                  <button onClick={() => blockMutation.mutate(c._id)}
                    style={{ padding: '4px 10px', border: '1px solid #e2e2e2', borderRadius: 6, fontSize: 13, cursor: 'pointer', background: c.isActive ? '#fff0f0' : '#f0fff4', color: c.isActive ? '#e53e3e' : '#38a169' }}>
                    {c.isActive ? 'Block' : 'Unblock'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div style={{ display: 'flex', gap: 8, marginTop: 16, justifyContent: 'center' }}>
          {Array.from({ length: data?.pagination?.pages || 1 }, (_, i) => i + 1).map(pg => (
            <button key={pg} onClick={() => setPage(pg)}
              style={{ padding: '6px 12px', border: '1px solid #e2e2e2', borderRadius: 6, background: page === pg ? '#1a1a1a' : 'none', color: page === pg ? '#fff' : 'inherit', cursor: 'pointer', fontSize: 13 }}>
              {pg}
            </button>
          ))}
        </div>
      </div>

      {selected && detail.data && (
        <div style={{ border: '1px solid #eee', borderRadius: 12, padding: 20, position: 'sticky', top: 0, height: 'fit-content' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
            <h3 style={{ margin: 0 }}>{detail.data.name}</h3>
            <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: '#aaa' }}>✕</button>
          </div>
          <p style={{ fontSize: 13, color: '#666', margin: '0 0 4px' }}>{detail.data.email}</p>
          <p style={{ fontSize: 13, color: '#666', margin: '0 0 16px' }}>{detail.data.phone || 'No phone'}</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
            {[
              { label: 'Total spent', value: `৳${detail.data.totalSpent?.toLocaleString()}` },
              { label: 'Orders', value: detail.data.orderCount },
            ].map(st => (
              <div key={st.label} style={{ background: '#f9f9f9', borderRadius: 8, padding: 12, textAlign: 'center' }}>
                <p style={{ fontSize: 18, fontWeight: 700, margin: '0 0 4px' }}>{st.value}</p>
                <p style={{ fontSize: 12, color: '#888', margin: 0 }}>{st.label}</p>
              </div>
            ))}
          </div>
          <h4 style={{ margin: '0 0 10px', fontSize: 14 }}>Recent orders</h4>
          {detail.data.orders?.slice(0, 5).map(o => (
            <div key={o._id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '6px 0', borderBottom: '1px solid #f5f5f5' }}>
              <span style={{ fontFamily: 'monospace' }}>{o.orderNumber}</span>
              <strong>৳{o.total?.toLocaleString()}</strong>
              <span style={{ color: '#888' }}>{o.status}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}