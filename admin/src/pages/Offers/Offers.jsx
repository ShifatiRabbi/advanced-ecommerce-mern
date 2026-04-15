import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';

const emptyForm = { code: '', type: 'percentage', value: '', minOrderValue: '', maxDiscount: '', usageLimit: '', expiresAt: '' };

export default function Offers() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const { data } = useQuery({ queryKey: ['coupons'], queryFn: () => api.get('/offers').then(r => r.data.data) });

  const createMutation = useMutation({
    mutationFn: (d) => api.post('/offers', d),
    onSuccess:  () => { qc.invalidateQueries({ queryKey: ['coupons'] }); setShowForm(false); setForm(emptyForm); },
    onError:    (e) => alert(e.response?.data?.message || 'Failed'),
  });

  const toggleMutation = useMutation({
    mutationFn: (id) => api.patch(`/offers/${id}/toggle`),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['coupons'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/offers/${id}`),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['coupons'] }),
  });

  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="admin-page-offers-offers" id="admin-page-offers-offers">
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
        <h2 style={{ margin: 0 }}>Coupons & Offers</h2>
        <button onClick={() => setShowForm(s => !s)}
          style={{ padding: '8px 16px', background: '#1a1a1a', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14 }}>
          {showForm ? 'Cancel' : '+ New Coupon'}
        </button>
      </div>

      {showForm && (
        <div style={{ border: '1px solid #e2e2e2', borderRadius: 12, padding: 24, marginBottom: 24, background: '#fafafa' }}>
          <h3 style={{ margin: '0 0 16px' }}>Create coupon</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
            {[
              { k: 'code',          label: 'Coupon code *',     type: 'text',   ph: 'SAVE20' },
              { k: 'value',         label: 'Discount value *',  type: 'number', ph: '20' },
              { k: 'minOrderValue', label: 'Min order (৳)',     type: 'number', ph: '500' },
              { k: 'maxDiscount',   label: 'Max discount (৳)',  type: 'number', ph: '200' },
              { k: 'usageLimit',    label: 'Usage limit',       type: 'number', ph: '100' },
              { k: 'expiresAt',     label: 'Expires at',        type: 'date',   ph: '' },
            ].map(({ k, label, type, ph }) => (
              <div key={k}>
                <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>{label}</label>
                <input type={type} value={form[k]} onChange={e => setF(k, e.target.value)} placeholder={ph}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #e2e2e2', borderRadius: 8, fontSize: 14, boxSizing: 'border-box' }} />
              </div>
            ))}
          </div>
          <div style={{ marginTop: 16 }}>
            <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>Discount type</label>
            <select value={form.type} onChange={e => setF('type', e.target.value)}
              style={{ padding: '8px 12px', border: '1px solid #e2e2e2', borderRadius: 8, fontSize: 14 }}>
              <option value="percentage">Percentage (%)</option>
              <option value="fixed">Fixed amount (৳)</option>
            </select>
          </div>
          <button onClick={() => createMutation.mutate(form)} disabled={createMutation.isPending}
            style={{ marginTop: 16, padding: '10px 24px', background: '#1a1a1a', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14 }}>
            {createMutation.isPending ? 'Creating...' : 'Create Coupon'}
          </button>
        </div>
      )}

      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
        <thead><tr style={{ borderBottom: '2px solid #eee', textAlign: 'left' }}>
          {['Code', 'Type', 'Value', 'Min order', 'Used / Limit', 'Expires', 'Status', 'Actions'].map(h =>
            <th key={h} style={{ padding: '10px 12px', color: '#555', fontWeight: 600 }}>{h}</th>)}
        </tr></thead>
        <tbody>
          {data?.coupons?.map(c => (
            <tr key={c._id} style={{ borderBottom: '1px solid #f5f5f5' }}>
              <td style={{ padding: '12px' }}><code style={{ fontWeight: 700, fontSize: 13 }}>{c.code}</code></td>
              <td style={{ padding: '12px', color: '#666' }}>{c.type}</td>
              <td style={{ padding: '12px', fontWeight: 700 }}>{c.type === 'percentage' ? `${c.value}%` : `৳${c.value}`}</td>
              <td style={{ padding: '12px' }}>{c.minOrderValue ? `৳${c.minOrderValue}` : '—'}</td>
              <td style={{ padding: '12px' }}>{c.usedCount} / {c.usageLimit ?? '∞'}</td>
              <td style={{ padding: '12px', color: '#888', fontSize: 13 }}>{c.expiresAt ? new Date(c.expiresAt).toLocaleDateString() : '—'}</td>
              <td style={{ padding: '12px' }}>
                <span style={{ padding: '3px 8px', borderRadius: 12, fontSize: 12, fontWeight: 600, background: c.isActive ? '#dcfce7' : '#fee2e2', color: c.isActive ? '#166534' : '#991b1b' }}>
                  {c.isActive ? 'Active' : 'Inactive'}
                </span>
              </td>
              <td style={{ padding: '12px' }}>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => toggleMutation.mutate(c._id)}
                    style={{ padding: '4px 10px', border: '1px solid #e2e2e2', borderRadius: 6, fontSize: 13, cursor: 'pointer', background: 'none' }}>
                    {c.isActive ? 'Disable' : 'Enable'}
                  </button>
                  <button onClick={() => window.confirm('Delete coupon?') && deleteMutation.mutate(c._id)}
                    style={{ padding: '4px 10px', border: '1px solid #fed7d7', background: '#fff0f0', color: '#e53e3e', borderRadius: 6, fontSize: 13, cursor: 'pointer' }}>
                    Del
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}