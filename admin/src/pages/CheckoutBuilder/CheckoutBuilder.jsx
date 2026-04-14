import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';

let _id = 1;
const newId = () => `f${Date.now()}${_id++}`;

const FIELD_TYPES = ['text','email','tel','textarea','select','radio','checkbox'];

export default function CheckoutBuilder() {
  const qc = useQueryClient();
  const [tab, setTab] = useState('fields');
  const [fields, setFields]   = useState([]);
  const [payments, setPayments] = useState([]);
  const [adding, setAdding]   = useState(false);
  const [newField, setNewField] = useState({ label:'', name:'', type:'text', placeholder:'', required:false, width:'full', options:'', defaultValue:'' });

  const { data: config, isLoading } = useQuery({
    queryKey: ['checkout-config'],
    queryFn:  () => api.get('/checkout-config').then(r => r.data.data),
  });

  useEffect(() => {
    if (config) {
      setFields(config.fields || []);
      setPayments(config.paymentMethods || []);
    }
  }, [config]);

  const saveMutation = useMutation({
    mutationFn: (data) => api.put('/checkout-config', data),
    onSuccess:  () => { qc.invalidateQueries({ queryKey: ['checkout-config'] }); alert('Checkout config saved!'); },
    onError:    (err) => alert(err.response?.data?.message || 'Save failed'),
  });

  const handleSave = () => saveMutation.mutate({ fields, paymentMethods: payments });

  const addField = () => {
    if (!newField.label || !newField.name) return alert('Label and field name required');
    const opts = newField.options ? newField.options.split(',').map(o => o.trim()).filter(Boolean) : [];
    setFields(f => [...f, { id: newId(), isActive: true, sortOrder: f.length + 1, ...newField, options: opts }]);
    setNewField({ label:'', name:'', type:'text', placeholder:'', required:false, width:'full', options:'', defaultValue:'' });
    setAdding(false);
  };

  const updateField  = (id, key, val) => setFields(f => f.map(i => i.id === id ? { ...i, [key]: val } : i));
  const removeField  = (id)            => setFields(f => f.filter(i => i.id !== id));
  const moveField    = (idx, dir)      => {
    const a = [...fields];
    const ni = idx + dir;
    if (ni < 0 || ni >= a.length) return;
    [a[idx], a[ni]] = [a[ni], a[idx]];
    setFields(a);
  };

  const togglePayment  = (key)          => setPayments(p => p.map(m => m.key === key ? { ...m, isActive: !m.isActive } : m));
  const updatePayment  = (key, k, v)    => setPayments(p => p.map(m => m.key === key ? { ...m, [k]: v } : m));
  const movePayment    = (idx, dir)     => {
    const a = [...payments];
    const ni = idx + dir;
    if (ni < 0 || ni >= a.length) return;
    [a[idx], a[ni]] = [a[ni], a[idx]];
    setPayments(a);
  };

  if (isLoading) return <p style={{ padding: 20 }}>Loading...</p>;

  return (
    <div className="admin-page-checkout-builder-checkout-builder" id="admin-page-checkout-builder-checkout-builder">
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Checkout Builder</h2>
        <button onClick={handleSave} disabled={saveMutation.isPending}
          style={{ padding: '9px 20px', background: '#111827', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>
          {saveMutation.isPending ? 'Saving...' : 'Save Configuration'}
        </button>
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
        {[{ k:'fields', l:'Form Fields' }, { k:'payments', l:'Payment Methods' }].map(t => (
          <button key={t.k} onClick={() => setTab(t.k)}
            style={{ padding: '8px 18px', border: '1px solid #e5e7eb', borderRadius: 20, background: tab === t.k ? '#111827' : '#fff', color: tab === t.k ? '#fff' : '#374151', cursor: 'pointer', fontSize: 14 }}>
            {t.l}
          </button>
        ))}
      </div>

      {tab === 'fields' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 20 }}>
          <div>
            <div style={s.card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>Form fields ({fields.length})</h3>
                <button onClick={() => setAdding(v => !v)}
                  style={{ padding: '6px 14px', background: '#111827', color: '#fff', border: 'none', borderRadius: 7, cursor: 'pointer', fontSize: 13 }}>
                  {adding ? 'Cancel' : '+ Add Field'}
                </button>
              </div>

              {adding && (
                <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 8, padding: 16, marginBottom: 16 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                    <div>
                      <label style={s.label}>Label *</label>
                      <input value={newField.label} onChange={e => setNewField(p => ({ ...p, label: e.target.value }))} style={s.input} placeholder="e.g. Postal Code" />
                    </div>
                    <div>
                      <label style={s.label}>Field name (key) *</label>
                      <input value={newField.name} onChange={e => setNewField(p => ({ ...p, name: e.target.value.toLowerCase().replace(/\s/g,'_') }))} style={{ ...s.input, fontFamily: 'monospace' }} placeholder="postal_code" />
                    </div>
                    <div>
                      <label style={s.label}>Field type</label>
                      <select value={newField.type} onChange={e => setNewField(p => ({ ...p, type: e.target.value }))} style={s.input}>
                        {FIELD_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={s.label}>Width</label>
                      <select value={newField.width} onChange={e => setNewField(p => ({ ...p, width: e.target.value }))} style={s.input}>
                        <option value="full">Full width</option>
                        <option value="half">Half width</option>
                      </select>
                    </div>
                    <div>
                      <label style={s.label}>Placeholder</label>
                      <input value={newField.placeholder} onChange={e => setNewField(p => ({ ...p, placeholder: e.target.value }))} style={s.input} />
                    </div>
                    <div>
                      <label style={s.label}>Default value</label>
                      <input value={newField.defaultValue} onChange={e => setNewField(p => ({ ...p, defaultValue: e.target.value }))} style={s.input} />
                    </div>
                  </div>
                  {(newField.type === 'select' || newField.type === 'radio') && (
                    <div style={{ marginBottom: 10 }}>
                      <label style={s.label}>Options (comma-separated)</label>
                      <input value={newField.options} onChange={e => setNewField(p => ({ ...p, options: e.target.value }))} style={s.input} placeholder="Option 1, Option 2, Option 3" />
                    </div>
                  )}
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, fontSize: 14, cursor: 'pointer' }}>
                    <input type="checkbox" checked={newField.required} onChange={e => setNewField(p => ({ ...p, required: e.target.checked }))} />
                    Required field
                  </label>
                  <button onClick={addField} style={{ padding: '8px 16px', background: '#059669', color: '#fff', border: 'none', borderRadius: 7, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                    Add Field
                  </button>
                </div>
              )}

              {fields.map((field, idx) => (
                <div key={field.id} style={{ border: `1px solid ${field.isActive ? '#e5e7eb' : '#f3f4f6'}`, borderRadius: 8, padding: '12px 14px', marginBottom: 8, background: field.isActive ? '#fff' : '#f9fafb', opacity: field.isActive ? 1 : 0.6 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: 10, alignItems: 'end' }}>
                    <div>
                      <p style={{ fontSize: 11, color: '#9ca3af', margin: '0 0 2px', textTransform: 'uppercase' }}>{field.type} · {field.width}</p>
                      <input value={field.label} onChange={e => updateField(field.id, 'label', e.target.value)} style={{ ...s.input, fontWeight: 600 }} />
                    </div>
                    <div>
                      <p style={{ fontSize: 11, color: '#9ca3af', margin: '0 0 2px', textTransform: 'uppercase' }}>Placeholder</p>
                      <input value={field.placeholder} onChange={e => updateField(field.id, 'placeholder', e.target.value)} style={s.input} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}>
                        <input type="checkbox" checked={field.required} onChange={e => updateField(field.id, 'required', e.target.checked)} /> Required
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}>
                        <input type="checkbox" checked={field.isActive} onChange={e => updateField(field.id, 'isActive', e.target.checked)} /> Active
                      </label>
                    </div>
                    <div style={{ display: 'flex', gap: 4, alignItems: 'flex-end' }}>
                      <button onClick={() => moveField(idx, -1)} disabled={idx === 0} style={s.arrowBtn}>↑</button>
                      <button onClick={() => moveField(idx, 1)}  disabled={idx === fields.length-1} style={s.arrowBtn}>↓</button>
                      <button onClick={() => removeField(field.id)} style={{ ...s.arrowBtn, color: '#dc2626', borderColor: '#fecaca' }}>✕</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={s.card}>
            <h3 style={s.cardTitle}>Preview</h3>
            <div style={{ fontSize: 13 }}>
              {(() => {
                const halves = [];
                let tempHalf = null;
                const rows = [];
                fields.filter(f => f.isActive).sort((a,b) => a.sortOrder - b.sortOrder).forEach(f => {
                  if (f.width === 'half') {
                    if (tempHalf) { rows.push({ type: 'row', items: [tempHalf, f] }); tempHalf = null; }
                    else           tempHalf = f;
                  } else {
                    if (tempHalf) { rows.push({ type: 'row', items: [tempHalf] }); tempHalf = null; }
                    rows.push({ type: 'full', item: f });
                  }
                });
                if (tempHalf) rows.push({ type: 'row', items: [tempHalf] });
                return rows.map((row, ri) => (
                  <div key={ri} style={{ display: 'grid', gridTemplateColumns: row.type === 'row' ? `repeat(${row.items.length},1fr)` : '1fr', gap: 10, marginBottom: 10 }}>
                    {(row.items || [row.item]).map(f => (
                      <div key={f.id}>
                        <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4, color: '#374151' }}>
                          {f.label}{f.required && <span style={{ color: '#dc2626' }}> *</span>}
                        </label>
                        {f.type === 'textarea'
                          ? <textarea placeholder={f.placeholder} rows={2} style={{ ...s.input, height: 50, resize: 'none', fontSize: 12 }} readOnly />
                          : f.type === 'select'
                          ? <select style={{ ...s.input, fontSize: 12 }}><option>{f.placeholder || 'Select...'}</option>{f.options?.map(o => <option key={o}>{o}</option>)}</select>
                          : f.type === 'radio'
                          ? <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                              {f.options?.map(o => <label key={o} style={{ fontSize: 12, display: 'flex', gap: 4, alignItems: 'center' }}><input type="radio" readOnly />{o}</label>)}
                            </div>
                          : <input type={f.type} placeholder={f.placeholder} style={{ ...s.input, fontSize: 12 }} readOnly />}
                      </div>
                    ))}
                  </div>
                ));
              })()}
            </div>
          </div>
        </div>
      )}

      {tab === 'payments' && (
        <div style={s.card}>
          <h3 style={s.cardTitle}>Active payment methods (drag to reorder)</h3>
          {payments.map((method, idx) => (
            <div key={method.key} style={{ display: 'flex', alignItems: 'center', gap: 12, border: `1px solid ${method.isActive ? '#e5e7eb' : '#f3f4f6'}`, borderRadius: 8, padding: '12px 16px', marginBottom: 8, background: method.isActive ? '#fff' : '#f9fafb', opacity: method.isActive ? 1 : 0.6 }}>
              <span style={{ fontSize: 22 }}>{method.icon}</span>
              <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 10 }}>
                <input value={method.label} onChange={e => updatePayment(method.key, 'label', e.target.value)}
                  style={s.input} />
                <input value={method.note} onChange={e => updatePayment(method.key, 'note', e.target.value)}
                  placeholder="Description shown to customer" style={s.input} />
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, cursor: 'pointer', flexShrink: 0 }}>
                <input type="checkbox" checked={method.isActive} onChange={() => togglePayment(method.key)} />
                Active
              </label>
              <div style={{ display: 'flex', gap: 4 }}>
                <button onClick={() => movePayment(idx, -1)} disabled={idx === 0} style={s.arrowBtn}>↑</button>
                <button onClick={() => movePayment(idx, 1)}  disabled={idx === payments.length-1} style={s.arrowBtn}>↓</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const s = {
  card:      { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: 20, marginBottom: 16 },
  cardTitle: { fontSize: 15, fontWeight: 700, margin: '0 0 16px' },
  label:     { display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 5, color: '#374151' },
  input:     { width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: 7, fontSize: 13, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' },
  arrowBtn:  { width: 28, height: 28, border: '1px solid #e5e7eb', borderRadius: 6, background: '#fff', cursor: 'pointer', fontSize: 12 },
};