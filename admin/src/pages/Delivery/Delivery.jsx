import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';

const empty = { zone: '', areas: '', charge: '', minDays: 1, maxDays: 3, isActive: true };

export default function Delivery() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing]   = useState(null);
  const [form, setForm]         = useState(empty);

  const { data: zones, isLoading } = useQuery({
    queryKey: ['delivery-zones'],
    queryFn:  () => api.get('/delivery').then(r => r.data.data),
  });

  const reset = () => { setForm(empty); setEditing(null); setShowForm(false); };
  const set   = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const saveMutation = useMutation({
    mutationFn: (data) => editing
      ? api.put(`/delivery/${editing._id}`, data)
      : api.post('/delivery', data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['delivery-zones'] }); reset(); },
    onError: (err) => alert(err.response?.data?.message || 'Save failed'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/delivery/${id}`),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['delivery-zones'] }),
  });

  const handleSave = () => {
    if (!form.zone.trim() || !form.charge) return alert('Zone name and charge are required');
    saveMutation.mutate({
      zone:     form.zone,
      areas:    form.areas.split(',').map(a => a.trim()).filter(Boolean),
      charge:   Number(form.charge),
      minDays:  Number(form.minDays),
      maxDays:  Number(form.maxDays),
      isActive: form.isActive,
    });
  };

  const startEdit = (zone) => {
    setEditing(zone);
    setForm({ zone: zone.zone, areas: zone.areas?.join(', ') || '', charge: zone.charge, minDays: zone.minDays, maxDays: zone.maxDays, isActive: zone.isActive });
    setShowForm(true);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
        <h2 style={{ margin: 0 }}>Delivery Zones</h2>
        <button onClick={() => { reset(); setShowForm(s => !s); }}
          style={{ padding: '8px 16px', background: '#111827', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14 }}>
          {showForm ? 'Cancel' : '+ Add Zone'}
        </button>
      </div>

      {showForm && (
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: 20, marginBottom: 20 }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 15 }}>{editing ? 'Edit Zone' : 'New Delivery Zone'}</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginBottom: 14 }}>
            {[
              { k: 'zone',    label: 'Zone name *',      ph: 'Dhaka City' },
              { k: 'charge',  label: 'Delivery charge *', ph: '60',    type: 'number' },
              { k: 'areas',   label: 'Areas (comma sep)', ph: 'Mirpur, Dhanmondi' },
              { k: 'minDays', label: 'Min days',          ph: '1',     type: 'number' },
              { k: 'maxDays', label: 'Max days',          ph: '3',     type: 'number' },
            ].map(f => (
              <div key={f.k}>
                <label style={s.label}>{f.label}</label>
                <input type={f.type || 'text'} value={form[f.k]} onChange={e => set(f.k, e.target.value)}
                  placeholder={f.ph} style={s.input} />
              </div>
            ))}
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, fontSize: 14, cursor: 'pointer' }}>
            <input type="checkbox" checked={form.isActive} onChange={e => set('isActive', e.target.checked)} />
            Active zone
          </label>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={handleSave} disabled={saveMutation.isPending}
              style={{ padding: '9px 20px', background: '#111827', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14 }}>
              {saveMutation.isPending ? 'Saving...' : editing ? 'Update Zone' : 'Create Zone'}
            </button>
            <button onClick={reset} style={{ padding: '9px 20px', border: '1px solid #d1d5db', borderRadius: 8, background: '#fff', cursor: 'pointer', fontSize: 14 }}>Cancel</button>
          </div>
        </div>
      )}

      {isLoading ? <p>Loading...</p> : (
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ background: '#f9fafb', borderBottom: '2px solid #f3f4f6', textAlign: 'left' }}>
                {['Zone', 'Areas', 'Charge', 'Delivery time', 'Status', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '12px 14px', fontWeight: 600, color: '#6b7280', fontSize: 13 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {zones?.map(zone => (
                <tr key={zone._id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '12px 14px', fontWeight: 600 }}>{zone.zone}</td>
                  <td style={{ padding: '12px 14px', color: '#6b7280', maxWidth: 200 }}>
                    {zone.areas?.join(', ') || '—'}
                  </td>
                  <td style={{ padding: '12px 14px', fontWeight: 700 }}>৳{zone.charge}</td>
                  <td style={{ padding: '12px 14px', color: '#6b7280' }}>{zone.minDays}–{zone.maxDays} days</td>
                  <td style={{ padding: '12px 14px' }}>
                    <span style={{ padding: '3px 8px', borderRadius: 12, fontSize: 12, fontWeight: 600, background: zone.isActive ? '#d1fae5' : '#fee2e2', color: zone.isActive ? '#065f46' : '#991b1b' }}>
                      {zone.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => startEdit(zone)} style={{ padding: '4px 10px', background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}>Edit</button>
                      <button onClick={() => window.confirm('Delete this zone?') && deleteMutation.mutate(zone._id)} style={{ padding: '4px 10px', background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const s = {
  label: { display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: '#374151' },
  input: { width: '100%', padding: '9px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' },
};