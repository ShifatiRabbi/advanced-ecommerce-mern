import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom'; // Import useNavigate from react-router-dom
import api from '../../services/api';

export default function Blog() {
  const qc = useQueryClient();
  const navigate = useNavigate();  // Initialize navigate
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ title: '', content: '', excerpt: '', category: 'General', isPublished: false });

  const { data, isLoading } = useQuery({
    queryKey: ['admin-blogs'],
    queryFn:  () => api.get('/blog/admin/all').then(r => r.data.data),
  });

  const reset = () => { 
    setForm({ title: '', content: '', excerpt: '', category: 'General', isPublished: false }); 
    setEditing(null); 
    setShowForm(false); 
  };

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const saveMutation = useMutation({
    mutationFn: (data) => editing ? api.put(`/blog/${editing._id}`, data) : api.post('/blog', data),
    onSuccess:  () => { qc.invalidateQueries({ queryKey: ['admin-blogs'] }); reset(); },
    onError:    (err) => alert(err.response?.data?.message || 'Save failed'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/blog/${id}`),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['admin-blogs'] }),
  });

  const startEdit = (post) => {
    setEditing(post);
    setForm({ title: post.title, content: post.content, excerpt: post.excerpt || '', category: post.category || 'General', isPublished: post.isPublished });
    setShowForm(true);
  };

  return (
    <div className="admin-page-blog-blog" id="admin-page-blog-blog">
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
        <h2 style={{ margin: 0 }}>Blog Posts ({data?.pagination?.total ?? 0})</h2>
        <button onClick={() => { reset(); setShowForm(s => !s); }}
          style={{ padding: '8px 16px', background: '#111827', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14 }}>
          {showForm ? 'Cancel' : '+ New Post'}
        </button>
        <button onClick={() => navigate('/blog/new')} style={{ padding: '8px 16px', background: '#111827', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14 }}>+ New Post</button>
      </div>

      {showForm && (
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: 24, marginBottom: 20 }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 15 }}>{editing ? 'Edit Post' : 'New Blog Post'}</h3>

          <div style={{ marginBottom: 14 }}>
            <label style={s.label}>Title *</label>
            <input value={form.title} onChange={e => set('title', e.target.value)} placeholder="Post title" style={s.input} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
            <div>
              <label style={s.label}>Category</label>
              <input value={form.category} onChange={e => set('category', e.target.value)} placeholder="General" style={s.input} />
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: 2 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, cursor: 'pointer' }}>
                <input type="checkbox" checked={form.isPublished} onChange={e => set('isPublished', e.target.checked)} />
                Publish immediately
              </label>
            </div>
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={s.label}>Excerpt (short summary)</label>
            <textarea value={form.excerpt} onChange={e => set('excerpt', e.target.value)} rows={2}
              style={{ ...s.input, height: 60, resize: 'vertical' }} placeholder="Brief summary..." />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={s.label}>Content *</label>
            <textarea value={form.content} onChange={e => set('content', e.target.value)} rows={10}
              style={{ ...s.input, height: 200, resize: 'vertical' }} placeholder="Full blog post content..." />
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => { if (!form.title.trim() || !form.content.trim()) return alert('Title and content required'); saveMutation.mutate(form); }}
              disabled={saveMutation.isPending}
              style={{ padding: '9px 20px', background: '#111827', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14 }}>
              {saveMutation.isPending ? 'Saving...' : editing ? 'Update Post' : 'Create Post'}
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
                {['Title', 'Category', 'Status', 'Created', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '12px 14px', fontWeight: 600, color: '#6b7280', fontSize: 13 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data?.posts?.map(post => (
                <tr key={post._id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '12px 14px' }}>
                    <div style={{ fontWeight: 600 }}>{post.title}</div>
                    <div style={{ fontSize: 12, color: '#9ca3af', fontFamily: 'monospace' }}>{post.slug}</div>
                  </td>
                  <td style={{ padding: '12px 14px', color: '#6b7280' }}>{post.category}</td>
                  <td style={{ padding: '12px 14px' }}>
                    <span style={{ padding: '3px 8px', borderRadius: 12, fontSize: 12, fontWeight: 600, background: post.isPublished ? '#d1fae5' : '#fef9c3', color: post.isPublished ? '#065f46' : '#854d0e' }}>
                      {post.isPublished ? 'Published' : 'Draft'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 14px', color: '#6b7280', fontSize: 13 }}>
                    {new Date(post.createdAt).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => navigate(`/blog/edit/${post._id}`)} style={{ padding: '4px 10px', background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}>Edit</button>
                      <button onClick={() => window.confirm('Delete this post?') && deleteMutation.mutate(post._id)} style={{ padding: '4px 10px', background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}>Delete</button>
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