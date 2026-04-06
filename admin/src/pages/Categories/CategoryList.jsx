import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';

export default function CategoryList() {
  const qc = useQueryClient();
  const [showForm, setShowForm]   = useState(false);
  const [editing, setEditing]     = useState(null);
  const [form, setForm]           = useState({ name: '', description: '', isActive: true });
  const [image, setImage]         = useState(null);

  const { data: categories, isLoading } = useQuery({
    queryKey: ['admin-categories'],
    queryFn:  () => api.get('/categories').then(r => r.data.data),
  });

  const reset = () => { setForm({ name: '', description: '', isActive: true }); setImage(null); setEditing(null); setShowForm(false); };

  const saveMutation = useMutation({
    mutationFn: (fd) => editing
      ? api.put(`/categories/${editing._id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      : api.post('/categories', fd, { headers: { 'Content-Type': 'multipart/form-data' } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-categories'] }); reset(); },
    onError: (err) => alert(err.response?.data?.message || 'Save failed'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/categories/${id}`),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['admin-categories'] }),
  });

  const handleSave = () => {
    if (!form.name.trim()) return alert('Name is required');
    const fd = new FormData();
    fd.append('name', form.name);
    fd.append('description', form.description);
    fd.append('isActive', form.isActive);
    if (image) fd.append('image', image);
    saveMutation.mutate(fd);
  };

  const startEdit = (cat) => {
    setEditing(cat);
    setForm({ name: cat.name, description: cat.description || '', isActive: cat.isActive });
    setImage(null);
    setShowForm(true);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
        <h2 style={{ margin: 0 }}>Categories ({categories?.length ?? 0})</h2>
        <button onClick={() => { reset(); setShowForm(s => !s); }}
          style={{ padding: '8px 16px', background: '#111827', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14 }}>
          {showForm ? 'Cancel' : '+ Add Category'}
        </button>
      </div>

      {showForm && (
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: 20, marginBottom: 20 }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 15 }}>{editing ? 'Edit Category' : 'New Category'}</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div>
              <label style={s.label}>Name *</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Electronics" style={s.input} />
            </div>
            <div>
              <label style={s.label}>Description</label>
              <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Optional description" style={s.input} />
            </div>
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={s.label}>Category image</label>
            <input type="file" accept="image/*" onChange={e => setImage(e.target.files[0])} style={{ fontSize: 14 }} />
            {editing?.image?.url && !image && (
              <img src={editing.image.url} alt="" style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 6, marginTop: 8 }} />
            )}
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
                {['Image', 'Name', 'Slug', 'Description', 'Status', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '12px 14px', fontWeight: 600, color: '#6b7280', fontSize: 13 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {categories?.map(cat => (
                <tr key={cat._id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '12px 14px' }}>
                    {cat.image?.url
                      ? <img src={cat.image.url} alt="" style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 6 }} />
                      : <div style={{ width: 44, height: 44, background: '#f3f4f6', borderRadius: 6 }} />}
                  </td>
                  <td style={{ padding: '12px 14px', fontWeight: 600 }}>{cat.name}</td>
                  <td style={{ padding: '12px 14px', fontFamily: 'monospace', fontSize: 13, color: '#6b7280' }}>{cat.slug}</td>
                  <td style={{ padding: '12px 14px', color: '#6b7280', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {cat.description || '—'}
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <span style={{ padding: '3px 8px', borderRadius: 12, fontSize: 12, fontWeight: 600, background: cat.isActive ? '#d1fae5' : '#fee2e2', color: cat.isActive ? '#065f46' : '#991b1b' }}>
                      {cat.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => startEdit(cat)} style={{ padding: '4px 10px', background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}>
                        Edit
                      </button>
                      <button onClick={() => window.confirm(`Delete "${cat.name}"?`) && deleteMutation.mutate(cat._id)}
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