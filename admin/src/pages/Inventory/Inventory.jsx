import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';

export default function Inventory() {
  const qc = useQueryClient();
  const [edits, setEdits] = useState({});

  const { data: summary } = useQuery({ queryKey: ['inv-summary'], queryFn: () => api.get('/inventory/summary').then(r => r.data.data) });
  const { data: low }     = useQuery({ queryKey: ['low-stock'],   queryFn: () => api.get('/inventory/low-stock?threshold=20').then(r => r.data.data) });

  const bulkMutation = useMutation({
    mutationFn: (updates) => api.post('/inventory/bulk-update', { updates }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['low-stock'] }); setEdits({}); },
  });

  const adjusted = Object.entries(edits).map(([id, stock]) => ({ id, stock: Number(stock) }));

  return (
    <div>
      <h2 style={{ margin: '0 0 20px' }}>Inventory</h2>

      {summary && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 24 }}>
          {[
            { label: 'Total products', value: summary.total, bg: '#f1f5f9', color: '#334155' },
            { label: 'Out of stock',   value: summary.outOfStock, bg: '#fee2e2', color: '#991b1b' },
            { label: 'Low stock',      value: summary.lowStock,   bg: '#fef9c3', color: '#854d0e' },
            { label: 'Healthy',        value: summary.healthy,    bg: '#dcfce7', color: '#166534' },
          ].map(st => (
            <div key={st.label} style={{ borderRadius: 10, padding: '16px 20px', background: st.bg }}>
              <p style={{ fontSize: 26, fontWeight: 700, margin: '0 0 4px', color: st.color }}>{st.value}</p>
              <p style={{ fontSize: 13, margin: 0, color: st.color }}>{st.label}</p>
            </div>
          ))}
        </div>
      )}

      <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: 10, padding: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ margin: 0, fontSize: 15 }}>Low stock items (≤20)</h3>
          {adjusted.length > 0 && (
            <button onClick={() => bulkMutation.mutate(adjusted)} disabled={bulkMutation.isPending}
              style={{ padding: '8px 16px', background: '#1a1a1a', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14 }}>
              {bulkMutation.isPending ? 'Saving...' : `Save ${adjusted.length} change(s)`}
            </button>
          )}
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead><tr style={{ borderBottom: '2px solid #eee', textAlign: 'left' }}>
            {['Product', 'Category', 'SKU', 'Current stock', 'New stock'].map(h =>
              <th key={h} style={{ padding: '10px 12px', color: '#555', fontWeight: 600 }}>{h}</th>)}
          </tr></thead>
          <tbody>
            {low?.map(p => (
              <tr key={p._id} style={{ borderBottom: '1px solid #f5f5f5' }}>
                <td style={{ padding: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {p.images?.[0] && <img src={p.images[0].url} alt="" style={{ width: 36, height: 36, objectFit: 'cover', borderRadius: 6 }} />}
                    <span style={{ fontWeight: 600 }}>{p.name}</span>
                  </div>
                </td>
                <td style={{ padding: '12px', color: '#666' }}>{p.category?.name}</td>
                <td style={{ padding: '12px', fontFamily: 'monospace', fontSize: 12, color: '#888' }}>{p.sku || '—'}</td>
                <td style={{ padding: '12px' }}>
                  <span style={{ fontWeight: 700, color: p.stock === 0 ? '#e53e3e' : p.stock <= 5 ? '#d97706' : '#1a1a1a' }}>
                    {p.stock}
                  </span>
                </td>
                <td style={{ padding: '12px' }}>
                  <input type="number" min="0"
                    value={edits[p._id] ?? p.stock}
                    onChange={e => setEdits(prev => ({ ...prev, [p._id]: e.target.value }))}
                    style={{ width: 80, padding: '6px 8px', border: '1px solid #e2e2e2', borderRadius: 6, fontSize: 14, background: edits[p._id] !== undefined ? '#fffbeb' : 'transparent' }} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}