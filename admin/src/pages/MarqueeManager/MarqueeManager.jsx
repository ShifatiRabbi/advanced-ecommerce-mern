import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';

const POSITIONS = [
  { value: 'top',            label: 'Very top of every page' },
  { value: 'below-header',   label: 'Just below header' },
  { value: 'above-footer',   label: 'Just above footer' },
  { value: 'product-detail', label: 'On product detail page' },
];

const emptyMarquee = () => ({
  name: '', text: '🎉 Free delivery on orders over ৳1000! Use code SAVE20 for 20% off!',
  bg: '#111827', textColor: '#ffffff', speed: 30, isActive: true,
  showOnAll: true, productIds: [], categoryIds: [], showOnPages: [], position: 'below-header',
});

export default function MarqueeManager() {
  const qc = useQueryClient();
  const [editing, setEditing]       = useState(null);
  const [form, setForm]             = useState(emptyMarquee());
  const [productSearch, setPS]      = useState('');
  const [showProducts, setShowProd] = useState(false);

  const { data: marquees, isLoading } = useQuery({
    queryKey: ['marquees-admin'],
    queryFn:  () => api.get('/marquees/all').then(r => r.data.data),
  });

  const { data: products } = useQuery({
    queryKey: ['products-picker', productSearch],
    queryFn:  () => api.get('/products', { params: { search: productSearch || undefined, limit: 30 } }).then(r => r.data.data.products),
    enabled:  showProducts,
  });

  const { data: categories } = useQuery({
    queryKey: ['categories-picker'],
    queryFn:  () => api.get('/categories').then(r => r.data.data),
  });

  const saveMutation = useMutation({
    mutationFn: (data) => editing ? api.put(`/marquees/${editing}`, data) : api.post('/marquees', data),
    onSuccess:  () => { qc.invalidateQueries({ queryKey: ['marquees-admin'] }); setEditing(null); setForm(emptyMarquee()); },
    onError:    (err) => alert(err.response?.data?.message || 'Save failed'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/marquees/${id}`),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['marquees-admin'] }),
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const toggleProduct = (id) => {
    const ids = form.productIds || [];
    set('productIds', ids.includes(id) ? ids.filter(i => i !== id) : [...ids, id]);
  };

  const toggleCategory = (id) => {
    const ids = form.categoryIds || [];
    set('categoryIds', ids.includes(id) ? ids.filter(i => i !== id) : [...ids, id]);
  };

  const startEdit = (m) => { setEditing(m._id); setForm({ ...m, productIds: m.productIds?.map(p => p._id || p) || [], categoryIds: m.categoryIds?.map(c => c._id || c) || [] }); };

  return (
    <div className="admin-page-marquee-manager-marquee-manager" id="admin-page-marquee-manager-marquee-manager">
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Marquee / Offer Text</h2>
        <button onClick={() => { setEditing(null); setForm(emptyMarquee()); }} style={s.addBtn}>+ New Marquee</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 20, marginBottom: 24 }}>
        <div style={s.card}>
          <h3 style={s.h3}>{editing ? 'Edit Marquee' : 'New Marquee'}</h3>

          <div style={{ marginBottom: 12 }}>
            <label style={s.label}>Name *</label>
            <input value={form.name} onChange={e => set('name', e.target.value)} style={s.input} placeholder="e.g. Summer Sale Banner" />
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={s.label}>Marquee text *</label>
            <textarea value={form.text} onChange={e => set('text', e.target.value)} rows={3}
              style={{ ...s.input, height: 70, resize: 'vertical' }}
              placeholder="🎉 Free delivery on orders over ৳1000! | Use code SAVE20 for 20% off!" />
            <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>Use | to separate multiple messages. Emoji supported.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div>
              <label style={s.label}>Background color</label>
              <div style={{ display: 'flex', gap: 6 }}>
                <input type="color" value={form.bg} onChange={e => set('bg', e.target.value)} style={{ width: 40, height: 36, border: '1px solid #d1d5db', borderRadius: 6, padding: 2, cursor: 'pointer' }} />
                <input value={form.bg} onChange={e => set('bg', e.target.value)} style={{ ...s.input, flex: 1, fontFamily: 'monospace' }} />
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
            <div>
              <label style={s.label}>Speed ({form.speed}px/s)</label>
              <input type="range" min={10} max={100} value={form.speed} onChange={e => set('speed', Number(e.target.value))} style={{ width: '100%', marginTop: 8 }} />
            </div>
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, cursor: 'pointer', marginBottom: 10 }}>
              <input type="checkbox" checked={form.showOnAll} onChange={e => set('showOnAll', e.target.checked)} />
              <strong>Show on all products / pages</strong>
            </label>

            {!form.showOnAll && (
              <>
                <div style={{ marginBottom: 10 }}>
                  <label style={s.label}>Show for specific categories</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {categories?.map(cat => (
                      <label key={cat._id} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, padding: '4px 10px', border: `1px solid ${form.categoryIds?.includes(cat._id) ? '#1d4ed8' : '#e5e7eb'}`, borderRadius: 20, cursor: 'pointer', background: form.categoryIds?.includes(cat._id) ? '#eff6ff' : '#fff' }}>
                        <input type="checkbox" style={{ display: 'none' }} checked={form.categoryIds?.includes(cat._id)} onChange={() => toggleCategory(cat._id)} />
                        {cat.name}
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <label style={s.label}>Show for specific products</label>
                    <button onClick={() => setShowProd(v => !v)} style={{ fontSize: 12, color: '#1d4ed8', background: 'none', border: 'none', cursor: 'pointer' }}>
                      {showProducts ? 'Hide picker' : 'Show product picker'}
                    </button>
                  </div>
                  {form.productIds?.length > 0 && (
                    <p style={{ fontSize: 12, color: '#6b7280', margin: '0 0 6px' }}>{form.productIds.length} product(s) selected</p>
                  )}
                  {showProducts && (
                    <>
                      <input value={productSearch} onChange={e => setPS(e.target.value)}
                        placeholder="Search products..." style={{ ...s.input, marginBottom: 8 }} />
                      <div style={{ maxHeight: 200, overflowY: 'auto', border: '1px solid #e5e7eb', borderRadius: 8, padding: 8 }}>
                        {products?.map(p => (
                          <label key={p._id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 4px', cursor: 'pointer', borderBottom: '1px solid #f3f4f6' }}>
                            <input type="checkbox" checked={form.productIds?.includes(p._id)} onChange={() => toggleProduct(p._id)} />
                            {p.images?.[0] && <img src={p.images[0].url} alt="" style={{ width: 28, height: 28, objectFit: 'cover', borderRadius: 4 }} />}
                            <span style={{ fontSize: 13 }}>{p.name}</span>
                          </label>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </>
            )}
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, cursor: 'pointer', marginBottom: 14 }}>
            <input type="checkbox" checked={form.isActive} onChange={e => set('isActive', e.target.checked)} />
            Active
          </label>

          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => { if(!form.name||!form.text) return alert('Name and text required'); saveMutation.mutate(form); }}
              disabled={saveMutation.isPending} style={s.addBtn}>
              {saveMutation.isPending ? 'Saving...' : editing ? 'Update' : 'Create Marquee'}
            </button>
            {editing && <button onClick={() => { setEditing(null); setForm(emptyMarquee()); }} style={{ padding: '9px 18px', border: '1px solid #e5e7eb', borderRadius: 8, background: '#fff', cursor: 'pointer', fontSize: 14 }}>Cancel</button>}
          </div>
        </div>

        <div style={s.card}>
          <h3 style={s.h3}>Preview</h3>
          <div style={{ background: form.bg, padding: '10px 0', overflow: 'hidden', borderRadius: 6 }}>
            <div style={{
              color: form.textColor, fontSize: 14, fontWeight: 600, whiteSpace: 'nowrap',
              animation: `marquee ${100/form.speed * 20}s linear infinite`,
              display: 'inline-block', paddingLeft: '100%',
            }}>
              {form.text} &nbsp;&nbsp;&nbsp; {form.text}
            </div>
          </div>
          <style>{`@keyframes marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }`}</style>
          <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 8 }}>Position: {POSITIONS.find(p => p.value === form.position)?.label}</p>
        </div>
      </div>

      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead><tr style={{ background: '#f9fafb', borderBottom: '2px solid #e5e7eb', textAlign: 'left' }}>
            {['Name','Text','Position','Target','Status','Actions'].map(h => <th key={h} style={{ padding: '10px 14px', fontWeight: 600, color: '#6b7280', fontSize: 13 }}>{h}</th>)}
          </tr></thead>
          <tbody>
            {marquees?.map(m => (
              <tr key={m._id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                <td style={{ padding: '10px 14px', fontWeight: 600 }}>{m.name}</td>
                <td style={{ padding: '10px 14px', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#6b7280' }}>{m.text}</td>
                <td style={{ padding: '10px 14px', fontSize: 13, color: '#6b7280' }}>{POSITIONS.find(p=>p.value===m.position)?.label||m.position}</td>
                <td style={{ padding: '10px 14px', fontSize: 12, color: '#9ca3af' }}>
                  {m.showOnAll ? 'All' : `${m.categoryIds?.length||0} cats, ${m.productIds?.length||0} products`}
                </td>
                <td style={{ padding: '10px 14px' }}>
                  <span style={{ padding: '3px 8px', borderRadius: 12, fontSize: 12, fontWeight: 600, background: m.isActive ? '#d1fae5' : '#fee2e2', color: m.isActive ? '#065f46' : '#991b1b' }}>
                    {m.isActive ? 'Active' : 'Off'}
                  </span>
                </td>
                <td style={{ padding: '10px 14px' }}>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => startEdit(m)} style={{ padding: '4px 10px', background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}>Edit</button>
                    <button onClick={() => window.confirm('Delete?') && deleteMutation.mutate(m._id)} style={{ padding: '4px 10px', background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}>Del</button>
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
  card:   { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: 20, marginBottom: 16 },
  h3:     { fontSize: 15, fontWeight: 700, margin: '0 0 14px' },
  label:  { display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 5, color: '#374151' },
  input:  { width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: 7, fontSize: 13, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' },
};