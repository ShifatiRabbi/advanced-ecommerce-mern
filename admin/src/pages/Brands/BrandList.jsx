import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';

export default function BrandList() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing]   = useState(null);
  const [name, setName]         = useState('');
  const [logo, setLogo]         = useState(null);

  const { data: brands, isLoading } = useQuery({
    queryKey: ['admin-brands'],
    queryFn:  () => api.get('/brands').then(r => r.data.data),
  });

  const reset = () => { setName(''); setLogo(null); setEditing(null); setShowForm(false); };

  const saveMutation = useMutation({
    mutationFn: (fd) => editing
      ? api.put(`/brands/${editing._id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      : api.post('/brands', fd, { headers: { 'Content-Type': 'multipart/form-data' } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-brands'] }); reset(); },
    onError:   (err) => alert(err.response?.data?.message || 'Save failed'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/brands/${id}`),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['admin-brands'] }),
  });

  const handleSave = () => {
    if (!name.trim()) return alert('Brand name is required');
    const fd = new FormData();
    fd.append('name', name);
    if (logo) fd.append('logo', logo);
    saveMutation.mutate(fd);
  };

  const startEdit = (brand) => { setEditing(brand); setName(brand.name); setLogo(null); setShowForm(true); };

  return (
    <div className="admin-page-brands-brand-list" id="admin-page-brands-brand-list">
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
        <h2 style={{ margin: 0 }}>Brands ({brands?.length ?? 0})</h2>
        <button onClick={() => { reset(); setShowForm(s => !s); }}
          style={{ padding: '8px 16px', background: '#111827', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14 }}>
          {showForm ? 'Cancel' : '+ Add Brand'}
        </button>
      </div>

      {showForm && (
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: 20, marginBottom: 20 }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 15 }}>{editing ? 'Edit Brand' : 'New Brand'}</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div>
              <label style={s.label}>Brand name *</label>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Samsung" style={s.input} />
            </div>
            <div>
              <label style={s.label}>Logo image</label>
              <input type="file" accept="image/*" onChange={e => setLogo(e.target.files[0])} style={{ fontSize: 14 }} />
              {editing?.logo?.url && !logo && (
                <img src={editing.logo.url} alt="" style={{ width: 40, height: 40, objectFit: 'contain', borderRadius: 4, marginTop: 8 }} />
              )}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={handleSave} disabled={saveMutation.isPending}
              style={{ padding: '9px 20px', background: '#111827', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14 }}>
              {saveMutation.isPending ? 'Saving...' : editing ? 'Update' : 'Create'}
            </button>
            <button onClick={reset} style={{ padding: '9px 20px', border: '1px solid #d1d5db', borderRadius: 8, background: '#fff', cursor: 'pointer', fontSize: 14 }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {isLoading ? <p>Loading...</p> : (
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ background: '#f9fafb', borderBottom: '2px solid #f3f4f6', textAlign: 'left' }}>
                {['Logo', 'Name', 'Slug', 'Status', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '12px 14px', fontWeight: 600, color: '#6b7280', fontSize: 13 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {brands?.map(b => (
                <tr key={b._id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '12px 14px' }}>
                    {b.logo?.url
                      ? <img src={b.logo.url} alt="" style={{ width: 44, height: 44, objectFit: 'contain', borderRadius: 4 }} />
                      : <div style={{ width: 44, height: 44, background: '#f3f4f6', borderRadius: 6 }} />}
                  </td>
                  <td style={{ padding: '12px 14px', fontWeight: 600 }}>{b.name}</td>
                  <td style={{ padding: '12px 14px', fontFamily: 'monospace', fontSize: 13, color: '#6b7280' }}>{b.slug}</td>
                  <td style={{ padding: '12px 14px' }}>
                    <span style={{ padding: '3px 8px', borderRadius: 12, fontSize: 12, fontWeight: 600, background: b.isActive ? '#d1fae5' : '#fee2e2', color: b.isActive ? '#065f46' : '#991b1b' }}>
                      {b.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => startEdit(b)} style={{ padding: '4px 10px', background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}>
                        Edit
                      </button>
                      <button onClick={() => window.confirm(`Delete "${b.name}"?`) && deleteMutation.mutate(b._id)}
                        style={{ padding: '4px 10px', background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}>
                        Delete
                      </button>
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