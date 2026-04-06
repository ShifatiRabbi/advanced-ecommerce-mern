import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import VariantManager from '../../components/VariantManager';
import { useQueryClient } from '@tanstack/react-query';

export default function EditProduct() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: product, isLoading } = useQuery({
    queryKey: ['product-edit', id],
    queryFn:  () => api.get(`/products/${id}`).then(r => r.data.data),
    enabled:  !!id,
  });

  const { data: categories } = useQuery({ queryKey: ['cats'], queryFn: () => api.get('/categories').then(r => r.data.data) });
  const { data: brands }     = useQuery({ queryKey: ['brands'], queryFn: () => api.get('/brands').then(r => r.data.data) });

  const [form, setForm] = useState({});
  const [newImages, setNewImages] = useState([]);

  useEffect(() => {
    if (product) {
      setForm({
        name:          product.name          || '',
        description:   product.description   || '',
        shortDesc:     product.shortDesc      || '',
        price:         product.price          || '',
        discountPrice: product.discountPrice  || '',
        category:      product.category?._id  || '',
        brand:         product.brand?._id     || '',
        stock:         product.stock          ?? '',
        sku:           product.sku            || '',
        tags:          product.tags?.join(', ') || '',
        isActive:      product.isActive       ?? true,
        isFeatured:    product.isFeatured     ?? false,
      });
    }
  }, [product]);

  const mutation = useMutation({
    mutationFn: (fd) => api.put(`/products/${id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } }),
    onSuccess: () => navigate('/products'),
    onError:   (err) => alert(err.response?.data?.message || 'Update failed'),
  });

  const deleteImageMutation = useMutation({
    mutationFn: (publicId) => api.delete(`/products/${id}/images/${encodeURIComponent(publicId)}`),
    onSuccess: () => window.location.reload(),
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = () => {
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => {
      if (k !== 'tags' && v !== '') fd.append(k, v);
    });
    if (form.tags) form.tags.split(',').map(t => t.trim()).filter(Boolean).forEach(t => fd.append('tags', t));
    newImages.forEach(img => fd.append('images', img));
    mutation.mutate(fd);
  };

  if (isLoading) return <div style={{ padding: 40, textAlign: 'center' }}>Loading product...</div>;

  return (
    <div style={{ maxWidth: 900 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
        <h2 style={{ margin: 0 }}>Edit Product</h2>
        <button onClick={() => navigate('/products')} style={{ padding: '8px 16px', border: '1px solid #d1d5db', borderRadius: 8, background: '#fff', cursor: 'pointer', fontSize: 14 }}>
          ← Back
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 20 }}>
        <div>
          <div style={s.card}>
            <h3 style={s.cardTitle}>Basic information</h3>
            {[
              { k: 'name', label: 'Product name *', type: 'text' },
              { k: 'shortDesc', label: 'Short description', type: 'textarea' },
              { k: 'description', label: 'Full description', type: 'textarea' },
            ].map(f => (
              <div key={f.k} style={{ marginBottom: 16 }}>
                <label style={s.label}>{f.label}</label>
                {f.type === 'textarea' ? (
                  <textarea value={form[f.k] || ''} onChange={e => set(f.k, e.target.value)}
                    style={{ ...s.input, height: f.k === 'description' ? 100 : 60, resize: 'vertical' }} />
                ) : (
                  <input value={form[f.k] || ''} onChange={e => set(f.k, e.target.value)} style={s.input} />
                )}
              </div>
            ))}
          </div>

          <div style={s.card}>
            <h3 style={s.cardTitle}>Pricing & stock</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[
                { k: 'price', label: 'Price (৳) *', type: 'number' },
                { k: 'discountPrice', label: 'Discount (৳)', type: 'number' },
                { k: 'stock', label: 'Stock', type: 'number' },
                { k: 'sku', label: 'SKU', type: 'text' },
              ].map(f => (
                <div key={f.k}>
                  <label style={s.label}>{f.label}</label>
                  <input type={f.type} value={form[f.k] || ''} onChange={e => set(f.k, e.target.value)} style={s.input} />
                </div>
              ))}
            </div>
            <div style={{ marginTop: 12 }}>
              <label style={s.label}>Tags (comma-separated)</label>
              <input value={form.tags || ''} onChange={e => set('tags', e.target.value)} style={s.input} placeholder="phone, android, samsung" />
            </div>
          </div>
        </div>

        <div>
          <div style={s.card}>
            <h3 style={s.cardTitle}>Category & brand</h3>
            <div style={{ marginBottom: 12 }}>
              <label style={s.label}>Category</label>
              <select value={form.category || ''} onChange={e => set('category', e.target.value)} style={s.input}>
                <option value="">Select</option>
                {categories?.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label style={s.label}>Brand</label>
              <select value={form.brand || ''} onChange={e => set('brand', e.target.value)} style={s.input}>
                <option value="">Select</option>
                {brands?.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
              </select>
            </div>
          </div>

          <div style={s.card}>
            <h3 style={s.cardTitle}>Current images</h3>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
              {product?.images?.map((img) => (
                <div key={img.public_id} style={{ position: 'relative' }}>
                  <img src={img.url} alt="" style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 6 }} />
                  <button
                    onClick={() => window.confirm('Delete this image?') && deleteImageMutation.mutate(img.public_id)}
                    style={{ position: 'absolute', top: -6, right: -6, width: 18, height: 18, borderRadius: '50%', background: '#ef4444', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    ×
                  </button>
                </div>
              ))}
            </div>
            <div onClick={() => document.getElementById('edit-imgs').click()}
              style={{ border: '2px dashed #d1d5db', borderRadius: 8, padding: 12, textAlign: 'center', cursor: 'pointer' }}>
              <p style={{ color: '#9ca3af', margin: 0, fontSize: 13 }}>
                {newImages.length > 0 ? `${newImages.length} new image(s) selected` : 'Add more images'}
              </p>
            </div>
            <input id="edit-imgs" type="file" multiple accept="image/*" style={{ display: 'none' }}
              onChange={e => setNewImages(Array.from(e.target.files))} />
          </div>
          {product && (
            <div style={s.card}>
              <h3 style={s.cardTitle}>Variations</h3>
              <VariantManager
                productId={id}
                variants={product.variants || []}
                onUpdate={() => qc.invalidateQueries({ queryKey: ['product-edit', id] })} />
            </div>
          )}

          <div style={s.card}>
            <h3 style={s.cardTitle}>Status</h3>
            {[
              { k: 'isActive', label: 'Active (visible on store)' },
              { k: 'isFeatured', label: 'Featured product' },
            ].map(f => (
              <label key={f.k} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, cursor: 'pointer', fontSize: 14 }}>
                <input type="checkbox" checked={!!form[f.k]} onChange={e => set(f.k, e.target.checked)} />
                {f.label}
              </label>
            ))}
          </div>

          <button onClick={handleSubmit} disabled={mutation.isPending}
            style={{ width: '100%', padding: 14, background: '#111827', color: '#fff', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>
            {mutation.isPending ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

const s = {
  card:      { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: 20, marginBottom: 16 },
  cardTitle: { fontSize: 15, fontWeight: 700, margin: '0 0 16px' },
  label:     { display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: '#374151' },
  input:     { width: '100%', padding: '9px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' },
};