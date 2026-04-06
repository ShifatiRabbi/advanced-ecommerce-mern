import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import api from '../../services/api';

export default function AddProduct() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '', description: '', shortDesc: '', price: '', discountPrice: '',
    category: '', brand: '', stock: '', sku: '', tags: '', isActive: true, isFeatured: false,
    metaTitle: '', metaDesc: '',
  });
  const [images, setImages] = useState([]);
  const [errors, setErrors] = useState({});

  const { data: categories } = useQuery({ queryKey: ['cats'], queryFn: () => api.get('/categories').then(r => r.data.data) });
  const { data: brands }     = useQuery({ queryKey: ['brands'], queryFn: () => api.get('/brands').then(r => r.data.data) });

  const mutation = useMutation({
    mutationFn: (fd) => api.post('/products', fd, { headers: { 'Content-Type': 'multipart/form-data' } }),
    onSuccess: () => navigate('/products'),
    onError:   (err) => {
      const errs = err.response?.data?.errors;
      if (errs) setErrors(Object.fromEntries(errs.map(e => [e.field, e.message])));
      else alert(err.response?.data?.message || 'Failed to create product');
    },
  });

  const set = (k, v) => {
    setForm(f => ({ ...f, [k]: v }));
    setErrors(e => { const n = { ...e }; delete n[k]; return n; });
  };

  const handleSubmit = () => {
    if (!form.name.trim())    return setErrors({ name: 'Name is required' });
    if (!form.price)          return setErrors({ price: 'Price is required' });
    if (!form.category)       return setErrors({ category: 'Category is required' });

    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => {
      if (k === 'metaTitle' || k === 'metaDesc') return;
      if (v !== '' && v !== null) fd.append(k, v);
    });
    if (form.metaTitle) fd.append('meta[title]', form.metaTitle);
    if (form.metaDesc)  fd.append('meta[description]', form.metaDesc);
    if (form.tags)      form.tags.split(',').map(t => t.trim()).filter(Boolean).forEach(t => fd.append('tags', t));
    images.forEach(img => fd.append('images', img));

    mutation.mutate(fd);
  };

  const Field = ({ k, label, type = 'text', ph = '', required = false, half = false }) => (
    <div style={{ marginBottom: 16, ...(half && { gridColumn: 'span 1' }) }}>
      <label style={s.label}>{label}{required && ' *'}</label>
      <input type={type} value={form[k]} onChange={e => set(k, e.target.value)} placeholder={ph}
        style={{ ...s.input, ...(errors[k] && { borderColor: '#ef4444' }) }} />
      {errors[k] && <p style={s.err}>{errors[k]}</p>}
    </div>
  );

  return (
    <div style={{ maxWidth: 900 }}>
      <div style={s.pageHead}>
        <h2 style={s.heading}>Add Product</h2>
        <button onClick={() => navigate('/products')} style={s.backBtn}>← Back to Products</button>
      </div>

      <div style={s.grid2}>
        <div>
          <div style={s.card}>
            <h3 style={s.cardTitle}>Basic information</h3>
            <Field k="name" label="Product name" required ph="e.g. Samsung Galaxy S24" />
            <div style={{ marginBottom: 16 }}>
              <label style={s.label}>Short description</label>
              <textarea value={form.shortDesc} onChange={e => set('shortDesc', e.target.value)}
                rows={2} placeholder="One-line description..."
                style={{ ...s.input, height: 60, resize: 'vertical' }} />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={s.label}>Full description</label>
              <textarea value={form.description} onChange={e => set('description', e.target.value)}
                rows={5} placeholder="Detailed product description..."
                style={{ ...s.input, height: 120, resize: 'vertical' }} />
            </div>
          </div>

          <div style={s.card}>
            <h3 style={s.cardTitle}>Pricing & stock</h3>
            <div style={s.row2}>
              <Field k="price"          label="Price (৳)"          type="number" ph="1999" required half />
              <Field k="discountPrice"  label="Discount price (৳)" type="number" ph="1499"        half />
              <Field k="stock"          label="Stock quantity"     type="number" ph="100"  required half />
              <Field k="sku"            label="SKU"                              ph="SKU-001"      half />
            </div>
          </div>

          <div style={s.card}>
            <h3 style={s.cardTitle}>SEO meta</h3>
            <Field k="metaTitle" label="Meta title"       ph="Product title for search (max 70 chars)" />
            <Field k="metaDesc"  label="Meta description" ph="Description for search (max 160 chars)" />
            <div style={{ marginBottom: 0 }}>
              <label style={s.label}>Tags (comma-separated)</label>
              <input value={form.tags} onChange={e => set('tags', e.target.value)}
                placeholder="samsung, phone, android" style={s.input} />
            </div>
          </div>
        </div>

        <div>
          <div style={s.card}>
            <h3 style={s.cardTitle}>Category & brand</h3>
            <div style={{ marginBottom: 16 }}>
              <label style={s.label}>Category *</label>
              <select value={form.category} onChange={e => set('category', e.target.value)}
                style={{ ...s.input, ...(errors.category && { borderColor: '#ef4444' }) }}>
                <option value="">Select category</option>
                {categories?.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
              {errors.category && <p style={s.err}>{errors.category}</p>}
            </div>
            <div style={{ marginBottom: 0 }}>
              <label style={s.label}>Brand</label>
              <select value={form.brand} onChange={e => set('brand', e.target.value)} style={s.input}>
                <option value="">Select brand</option>
                {brands?.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
              </select>
            </div>
          </div>

          <div style={s.card}>
            <h3 style={s.cardTitle}>Product images</h3>
            <div
              onClick={() => document.getElementById('product-imgs').click()}
              style={{ border: '2px dashed #d1d5db', borderRadius: 8, padding: 20, textAlign: 'center', cursor: 'pointer', marginBottom: 12 }}>
              {images.length > 0
                ? <p style={{ color: '#059669', margin: 0, fontSize: 14 }}>{images.length} image(s) selected</p>
                : <p style={{ color: '#9ca3af', margin: 0, fontSize: 14 }}>Click to upload images (max 8)</p>}
            </div>
            <input id="product-imgs" type="file" multiple accept="image/*" style={{ display: 'none' }}
              onChange={e => setImages(Array.from(e.target.files))} />
            {images.length > 0 && (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {images.map((img, i) => (
                  <img key={i} src={URL.createObjectURL(img)} alt=""
                    style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 6, border: '1px solid #e5e7eb' }} />
                ))}
              </div>
            )}
          </div>

          <div style={s.card}>
            <h3 style={s.cardTitle}>Status</h3>
            <label style={s.checkRow}>
              <input type="checkbox" checked={form.isActive} onChange={e => set('isActive', e.target.checked)} />
              <span style={{ fontSize: 14, marginLeft: 8 }}>Active (visible on store)</span>
            </label>
            <label style={s.checkRow}>
              <input type="checkbox" checked={form.isFeatured} onChange={e => set('isFeatured', e.target.checked)} />
              <span style={{ fontSize: 14, marginLeft: 8 }}>Featured product</span>
            </label>
          </div>

          <button onClick={handleSubmit} disabled={mutation.isPending} style={s.submitBtn}>
            {mutation.isPending ? 'Creating product...' : 'Create Product'}
          </button>
        </div>
      </div>
    </div>
  );
}

const s = {
  pageHead:   { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  heading:    { fontSize: 22, fontWeight: 700, margin: 0 },
  backBtn:    { padding: '8px 16px', border: '1px solid #d1d5db', borderRadius: 8, background: '#fff', cursor: 'pointer', fontSize: 14, color: '#374151' },
  grid2:      { display: 'grid', gridTemplateColumns: '1fr 380px', gap: 20, alignItems: 'start' },
  card:       { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: 20, marginBottom: 16 },
  cardTitle:  { fontSize: 15, fontWeight: 700, margin: '0 0 16px', color: '#111827' },
  row2:       { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 },
  label:      { display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: '#374151' },
  input:      { width: '100%', padding: '9px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' },
  err:        { fontSize: 12, color: '#dc2626', marginTop: 4 },
  checkRow:   { display: 'flex', alignItems: 'center', marginBottom: 10, cursor: 'pointer' },
  submitBtn:  { width: '100%', padding: 14, background: '#111827', color: '#fff', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: 'pointer' },
};