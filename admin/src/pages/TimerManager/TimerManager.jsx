import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';

const POSITIONS = [
  { value: 'above-price',   label: 'Above price (product detail)' },
  { value: 'below-price',   label: 'Below price (product detail)' },
  { value: 'product-card',  label: 'On product card' },
  { value: 'top-of-page',   label: 'Top of product page' },
];

const empty = () => ({
  name: '', label: 'Offer ends in', durationHours: 6, loopAfterHours: 6,
  bgColor: '#ef4444', textColor: '#ffffff', isActive: true,
  showOnAll: false, productIds: [], categoryIds: [], position: 'above-price',
});

export default function TimerManager() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState(null);
  const [form, setForm]       = useState(empty());
  const [pSearch, setPSearch] = useState('');
  const [showPicker, setShowPicker] = useState(false);

  const { data: timers } = useQuery({ queryKey: ['timers-admin'], queryFn: () => api.get('/timers/all').then(r => r.data.data) });
  const { data: products } = useQuery({ queryKey: ['prod-pick', pSearch], queryFn: () => api.get('/products', { params: { search: pSearch||undefined, limit: 30 } }).then(r => r.data.data.products), enabled: showPicker });
  const { data: categories } = useQuery({ queryKey: ['cats-pick'], queryFn: () => api.get('/categories').then(r => r.data.data) });

  const saveMutation = useMutation({
    mutationFn: (data) => editing ? api.put(`/timers/${editing}`, data) : api.post('/timers', data),
    onSuccess:  () => { qc.invalidateQueries({ queryKey: ['timers-admin'] }); setEditing(null); setForm(empty()); },
    onError:    (err) => alert(err.response?.data?.message || 'Save failed'),
  });

  const restartMutation = useMutation({
    mutationFn: (id) => api.patch(`/timers/${id}/restart`),
    onSuccess:  () => { qc.invalidateQueries({ queryKey: ['timers-admin'] }); alert('Timer restarted!'); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/timers/${id}`),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['timers-admin'] }),
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const toggleProd = (id) => set('productIds', form.productIds.includes(id) ? form.productIds.filter(i => i !== id) : [...form.productIds, id]);
  const toggleCat  = (id) => set('categoryIds', form.categoryIds.includes(id) ? form.categoryIds.filter(i => i !== id) : [...form.categoryIds, id]);

  const startEdit = (t) => { setEditing(t._id); setForm({ ...t, productIds: t.productIds?.map(p => p._id||p)||[], categoryIds: t.categoryIds?.map(c => c._id||c)||[] }); };

  const getRemainingPreview = () => {
    const totalMs = form.durationHours * 3600 * 1000;
    const h = Math.floor(totalMs / 3600000);
    const m = Math.floor((totalMs % 3600000) / 60000);
    return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:00`;
  };

  return (
    <div className="admin-page-timer-manager-timer-manager" id="admin-page-timer-manager-timer-manager">
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Timer / Countdown Manager</h2>
        <button onClick={() => { setEditing(null); setForm(empty()); }} style={s.addBtn}>+ New Timer</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20, marginBottom: 24 }}>
        <div style={s.card}>
          <h3 style={s.h3}>{editing ? 'Edit Timer' : 'New Timer'}</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div>
              <label style={s.label}>Timer name *</label>
              <input value={form.name} onChange={e => set('name', e.target.value)} style={s.input} placeholder="e.g. Flash Sale Timer" />
            </div>
            <div>
              <label style={s.label}>Display label</label>
              <input value={form.label} onChange={e => set('label', e.target.value)} style={s.input} placeholder="Offer ends in" />
            </div>
            <div>
              <label style={s.label}>Duration (hours) *</label>
              <input type="number" min={0.5} step={0.5} value={form.durationHours} onChange={e => set('durationHours', Number(e.target.value))} style={s.input} />
            </div>
            <div>
              <label style={s.label}>Loop — reset after (hours)</label>
              <input type="number" min={0} step={0.5} value={form.loopAfterHours||''} onChange={e => set('loopAfterHours', e.target.value ? Number(e.target.value) : null)} style={s.input} placeholder="Same as duration = loop" />
              <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 3 }}>Leave blank to not loop</p>
            </div>
            <div>
              <label style={s.label}>Background color</label>
              <div style={{ display: 'flex', gap: 6 }}>
                <input type="color" value={form.bgColor} onChange={e => set('bgColor', e.target.value)} style={{ width: 40, height: 36, border: '1px solid #d1d5db', borderRadius: 6, padding: 2, cursor: 'pointer' }} />
                <input value={form.bgColor} onChange={e => set('bgColor', e.target.value)} style={{ ...s.input, flex: 1, fontFamily: 'monospace' }} />
              </div>
            </div>
            <div>
              <label style={s.label}>Text color</label>
              <div style={{ display: 'flex', gap: 6 }}>
                <input type="color" value={form.textColor} onChange={e => set('textColor', e.target.value)} style={{ width: 40, height: 36, border: '1px solid #d1d5db', borderRadius: 6, padding: 2, cursor: 'pointer' }} />
                <input value={form.textColor} onChange={e => set('textColor', e.target.value)} style={{ ...s.input, flex: 1, fontFamily: 'monospace' }} />
              </div>
            </div>
            <div>
              <label style={s.label}>Position</label>
              <select value={form.position} onChange={e => set('position', e.target.value)} style={s.input}>
                {POSITIONS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </div>
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, cursor: 'pointer', marginBottom: 12 }}>
            <input type="checkbox" checked={form.showOnAll} onChange={e => set('showOnAll', e.target.checked)} />
            <strong>Show on all products</strong>
          </label>

          {!form.showOnAll && (
            <div style={{ marginBottom: 12 }}>
              <label style={s.label}>Categories</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                {categories?.map(c => (
                  <label key={c._id} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, padding: '4px 10px', border: `1px solid ${form.categoryIds.includes(c._id) ? '#1d4ed8' : '#e5e7eb'}`, borderRadius: 20, cursor: 'pointer', background: form.categoryIds.includes(c._id) ? '#eff6ff' : '#fff' }}>
                    <input type="checkbox" style={{ display: 'none' }} checked={form.categoryIds.includes(c._id)} onChange={() => toggleCat(c._id)} />
                    {c.name}
                  </label>
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <label style={s.label}>Specific products ({form.productIds.length} selected)</label>
                <button onClick={() => setShowPicker(v => !v)} style={{ fontSize: 12, color: '#1d4ed8', background: 'none', border: 'none', cursor: 'pointer' }}>
                  {showPicker ? 'Hide' : 'Pick products'}
                </button>
              </div>
              {showPicker && (
                <>
                  <input value={pSearch} onChange={e => setPSearch(e.target.value)} placeholder="Search..." style={{ ...s.input, marginBottom: 6 }} />
                  <div style={{ maxHeight: 180, overflowY: 'auto', border: '1px solid #e5e7eb', borderRadius: 8, padding: 8 }}>
                    {products?.map(p => (
                      <label key={p._id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 4px', cursor: 'pointer', borderBottom: '1px solid #f3f4f6' }}>
                        <input type="checkbox" checked={form.productIds.includes(p._id)} onChange={() => toggleProd(p._id)} />
                        {p.images?.[0] && <img src={p.images[0].url} alt="" style={{ width: 28, height: 28, objectFit: 'cover', borderRadius: 4 }} />}
                        <span style={{ fontSize: 13 }}>{p.name}</span>
                      </label>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, cursor: 'pointer', marginBottom: 14 }}>
            <input type="checkbox" checked={form.isActive} onChange={e => set('isActive', e.target.checked)} />
            Active
          </label>

          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => { if(!form.name||!form.durationHours) return alert('Name and duration required'); saveMutation.mutate(form); }}
              disabled={saveMutation.isPending} style={s.addBtn}>
              {saveMutation.isPending ? 'Saving...' : editing ? 'Update Timer' : 'Create Timer'}
            </button>
            {editing && <button onClick={() => { setEditing(null); setForm(empty()); }} style={{ padding: '9px 18px', border: '1px solid #e5e7eb', borderRadius: 8, background: '#fff', cursor: 'pointer', fontSize: 14 }}>Cancel</button>}
          </div>
        </div>

        <div style={s.card}>
          <h3 style={s.h3}>Preview</h3>
          <div style={{ background: form.bgColor, borderRadius: 8, padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ color: form.textColor, fontSize: 14, fontWeight: 600 }}>{form.label || 'Offer ends in'}</span>
            <div style={{ display: 'flex', gap: 6 }}>
              {getRemainingPreview().split(':').map((v, i) => (
                <div key={i} style={{ textAlign: 'center' }}>
                  <span style={{ display: 'block', background: 'rgba(0,0,0,0.25)', color: form.textColor, fontFamily: 'monospace', fontSize: 22, fontWeight: 800, padding: '4px 10px', borderRadius: 6, minWidth: 44 }}>
                    {v}
                  </span>
                  <span style={{ display: 'block', color: form.textColor, fontSize: 10, opacity: 0.8, marginTop: 3 }}>
                    {i === 0 ? 'HH' : i === 1 ? 'MM' : 'SS'}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <p style={{ fontSize: 12, color: '#6b7280' }}>
            Duration: {form.durationHours}h · {form.loopAfterHours ? `Resets every ${form.loopAfterHours}h` : 'No loop'}
          </p>
        </div>
      </div>

      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead><tr style={{ background: '#f9fafb', borderBottom: '2px solid #e5e7eb', textAlign: 'left' }}>
            {['Name','Duration','Loop','Position','Target','Status','Actions'].map(h => <th key={h} style={{ padding: '10px 14px', fontWeight: 600, color: '#6b7280', fontSize: 13 }}>{h}</th>)}
          </tr></thead>
          <tbody>
            {timers?.map(t => (
              <tr key={t._id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                <td style={{ padding: '10px 14px', fontWeight: 600 }}>{t.name}</td>
                <td style={{ padding: '10px 14px' }}>{t.durationHours}h</td>
                <td style={{ padding: '10px 14px', color: '#6b7280', fontSize: 13 }}>{t.loopAfterHours ? `Every ${t.loopAfterHours}h` : 'None'}</td>
                <td style={{ padding: '10px 14px', fontSize: 13, color: '#6b7280' }}>{POSITIONS.find(p=>p.value===t.position)?.label||t.position}</td>
                <td style={{ padding: '10px 14px', fontSize: 12, color: '#9ca3af' }}>{t.showOnAll ? 'All' : `${t.categoryIds?.length||0}c ${t.productIds?.length||0}p`}</td>
                <td style={{ padding: '10px 14px' }}>
                  <span style={{ padding: '3px 8px', borderRadius: 12, fontSize: 12, fontWeight: 600, background: t.isActive ? '#d1fae5' : '#fee2e2', color: t.isActive ? '#065f46' : '#991b1b' }}>
                    {t.isActive ? 'Active' : 'Off'}
                  </span>
                </td>
                <td style={{ padding: '10px 14px' }}>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => startEdit(t)} style={{ padding: '4px 8px', background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', borderRadius: 5, cursor: 'pointer', fontSize: 12 }}>Edit</button>
                    <button onClick={() => restartMutation.mutate(t._id)} style={{ padding: '4px 8px', background: '#f9fafb', color: '#374151', border: '1px solid #e5e7eb', borderRadius: 5, cursor: 'pointer', fontSize: 12 }}>Restart</button>
                    <button onClick={() => window.confirm('Delete?') && deleteMutation.mutate(t._id)} style={{ padding: '4px 8px', background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: 5, cursor: 'pointer', fontSize: 12 }}>Del</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const s = {
  addBtn: { padding: '9px 18px', background: '#111827', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 600 },
  card:   { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: 20 },
  h3:     { fontSize: 15, fontWeight: 700, margin: '0 0 14px' },
  label:  { display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 5, color: '#374151' },
  input:  { width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: 7, fontSize: 13, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' },
};