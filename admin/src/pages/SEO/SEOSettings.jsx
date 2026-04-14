import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';

const FIELDS = [
  { key: 'siteName', label: 'Site name', ph: 'My Shop' },
  { key: 'siteDesc', label: 'Meta description', ph: 'Best products...' },
  { key: 'siteKeywords', label: 'Meta keywords', ph: 'shop, ecommerce, bd' },
  { key: 'siteUrl', label: 'Site URL', ph: 'https://myshop.com' },
  { key: 'ogImage', label: 'OG Image URL', ph: 'https://...' },
];

const s = {
  card: { background: '#fff', border: '1px solid #eee', borderRadius: 12, padding: 24, marginBottom: 20 },
  tabBtn: (active) => ({
    padding: '8px 16px',
    cursor: 'pointer',
    border: 'none',
    background: active ? '#1a1a1a' : 'transparent',
    color: active ? '#fff' : '#666',
    borderRadius: 6,
    fontSize: 14,
    fontWeight: 500,
    marginRight: 8
  })
};

export default function SEOSettings() {
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState('general'); // Added to manage visibility
  const [form, setForm] = useState({});
  const [genLoading, setGenLoading] = useState(false);
  const [genResults, setGenResults] = useState([]);

  // Fetch Global SEO Settings
  const { data } = useQuery({ 
    queryKey: ['seo-admin'], 
    queryFn: () => api.get('/seo/settings').then(r => r.data.data) 
  });
  
  const merged = { ...data, ...form };

  // Fetch Products for SEO Generator
  const { data: products } = useQuery({
    queryKey: ['seo-products'],
    queryFn: () => api.get('/products?limit=50').then(r => r.data.data.products),
  });

  const mutation = useMutation({
    mutationFn: (d) => api.put('/seo/settings', d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['seo-admin'] }); alert('SEO settings saved!'); },
  });

  const generateProductMeta = async (product) => {
    const title = `${product.name} — Buy Online at Best Price | ShopBD`.slice(0, 60);
    const desc = `Buy ${product.name} at ৳${(product.discountPrice || product.price).toLocaleString()} on ShopBD. ${product.shortDesc || product.description?.replace(/<[^>]+>/g, '').slice(0, 100) || 'Best quality, fast delivery in Bangladesh.'}`.slice(0, 160);
    const keywords = [product.name, product.category?.name, product.brand?.name, 'buy online', 'Bangladesh', 'ShopBD']
      .filter(Boolean).join(', ');
    
    await api.put(`/products/${product._id}`, { 
      meta: { title, description: desc, keywords: [keywords] } 
    });
    return { id: product._id, title, desc };
  };

  const handleBulkGenerate = async () => {
    if (!products?.length) return;
    setGenLoading(true);
    setGenResults([]);
    const results = [];
    for (const product of products.slice(0, 20)) {
      try {
        const r = await generateProductMeta(product);
        results.push({ name: product.name, ...r, ok: true });
      } catch {
        results.push({ name: product.name, ok: false });
      }
      setGenResults([...results]);
    }
    setGenLoading(false);
    qc.invalidateQueries({ queryKey: ['seo-products'] });
    qc.invalidateQueries({ queryKey: ['admin-products'] });
  };

  return (
    <div className="admin-page-seo-seosettings" id="admin-page-seo-seosettings">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ margin: 0 }}>SEO Settings</h2>
        <div style={{ background: '#eee', padding: 4, borderRadius: 8 }}>
          <button style={s.tabBtn(activeTab === 'general')} onClick={() => setActiveTab('general')}>General</button>
          <button style={s.tabBtn(activeTab === 'seo-products')} onClick={() => setActiveTab('seo-products')}>Product SEO</button>
        </div>
      </div>

      {activeTab === 'general' && (
        <>
          <div style={s.card}>
            {FIELDS.map(f => (
              <div key={f.key} style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>{f.label}</label>
                <input 
                  value={merged[f.key] || ''} 
                  onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                  placeholder={f.ph}
                  style={{ width: '100%', padding: '9px 12px', border: '1px solid #e2e2e2', borderRadius: 8, fontSize: 14, boxSizing: 'border-box' }} 
                />
              </div>
            ))}
            <button 
              onClick={() => mutation.mutate(form)} 
              disabled={mutation.isPending}
              style={{ padding: '10px 24px', background: '#1a1a1a', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14 }}>
              {mutation.isPending ? 'Saving...' : 'Save SEO Settings'}
            </button>
          </div>

          <div style={s.card}>
            <h3 style={{ margin: '0 0 12px', fontSize: 15 }}>Sitemap & Robots</h3>
            <div style={{ display: 'flex', gap: 12 }}>
              <a href={`${import.meta.env.VITE_API_URL?.replace('/api', '')}/api/seo/sitemap.xml`} target="_blank" rel="noreferrer"
                style={{ padding: '9px 18px', border: '1px solid #e2e2e2', borderRadius: 8, textDecoration: 'none', color: '#555', fontSize: 14 }}>
                View sitemap.xml
              </a>
              <a href={`${import.meta.env.VITE_API_URL?.replace('/api', '')}/api/seo/robots.txt`} target="_blank" rel="noreferrer"
                style={{ padding: '9px 18px', border: '1px solid #e2e2e2', borderRadius: 8, textDecoration: 'none', color: '#555', fontSize: 14 }}>
                View robots.txt
              </a>
            </div>
          </div>
        </>
      )}

      {activeTab === 'seo-products' && (
        <div style={s.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div>
              <h3 style={{ margin: '0 0 4px', fontSize: 15 }}>Product SEO auto-generator</h3>
              <p style={{ margin: 0, fontSize: 13, color: '#6b7280' }}>Auto-generates meta title, description, and keywords for up to 20 products.</p>
            </div>
            <button onClick={handleBulkGenerate} disabled={genLoading}
              style={{ padding: '9px 18px', background: '#111827', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>
              {genLoading ? 'Generating...' : 'Auto-generate All'}
            </button>
          </div>

          {products?.map(product => (
            <div key={product._id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid #f3f4f6' }}>
              <div style={{ flex: 1 }}>
                <p style={{ fontWeight: 600, fontSize: 14, margin: '0 0 2px' }}>{product.name}</p>
                <p style={{ fontSize: 12, color: '#9ca3af', margin: 0 }}>
                  {product.meta?.title ? `✓ ${product.meta.title.slice(0, 50)}...` : '— No meta title yet'}
                </p>
              </div>
              <button onClick={async () => { await generateProductMeta(product); qc.invalidateQueries({ queryKey: ['seo-products'] }); alert('Meta generated!'); }}
                style={{ padding: '5px 12px', background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}>
                Generate
              </button>
              <a href={`/product/${product.slug}`} target="_blank" rel="noreferrer"
                style={{ padding: '5px 12px', border: '1px solid #e5e7eb', borderRadius: 6, fontSize: 12, color: '#374151', textDecoration: 'none' }}>
                Preview
              </a>
            </div>
          ))}

          {genResults.length > 0 && (
            <div style={{ marginTop: 16, background: '#f9fafb', borderRadius: 8, padding: 14 }}>
              <p style={{ fontWeight: 700, marginBottom: 8, fontSize: 14 }}>Results: {genResults.filter(r => r.ok).length} generated</p>
              {genResults.map((r, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, fontSize: 13, marginBottom: 4 }}>
                  <span style={{ color: r.ok ? '#059669' : '#dc2626' }}>{r.ok ? '✓' : '✕'}</span>
                  <span>{r.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}