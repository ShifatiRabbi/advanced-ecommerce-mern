import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';

const FIELDS = [
  { key: 'siteName',    label: 'Site name',       ph: 'My Shop' },
  { key: 'siteDesc',    label: 'Meta description',ph: 'Best products...' },
  { key: 'siteKeywords',label: 'Meta keywords',   ph: 'shop, ecommerce, bd' },
  { key: 'siteUrl',     label: 'Site URL',        ph: 'https://myshop.com' },
  { key: 'ogImage',     label: 'OG Image URL',    ph: 'https://...' },
];

export default function SEOSettings() {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ['seo-admin'], queryFn: () => api.get('/seo/settings').then(r => r.data.data) });
  const [form, setForm] = useState({});
  const merged = { ...data, ...form };

  const mutation = useMutation({
    mutationFn: (d) => api.put('/seo/settings', d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['seo-admin'] }); alert('SEO settings saved!'); },
  });

  return (
    <div>
      <h2 style={{ margin: '0 0 24px' }}>SEO Settings</h2>
      <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: 12, padding: 24, marginBottom: 20 }}>
        {FIELDS.map(f => (
          <div key={f.key} style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>{f.label}</label>
            <input value={merged[f.key] || ''} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
              placeholder={f.ph}
              style={{ width: '100%', padding: '9px 12px', border: '1px solid #e2e2e2', borderRadius: 8, fontSize: 14, boxSizing: 'border-box' }} />
          </div>
        ))}
        <button onClick={() => mutation.mutate(form)} disabled={mutation.isPending}
          style={{ padding: '10px 24px', background: '#1a1a1a', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14 }}>
          {mutation.isPending ? 'Saving...' : 'Save SEO Settings'}
        </button>
      </div>
      <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: 12, padding: 24 }}>
        <h3 style={{ margin: '0 0 12px', fontSize: 15 }}>Sitemap & Robots</h3>
        <div style={{ display: 'flex', gap: 12 }}>
          <a href={`${import.meta.env.VITE_API_URL?.replace('/api','')}/api/seo/sitemap.xml`} target="_blank" rel="noreferrer"
            style={{ padding: '9px 18px', border: '1px solid #e2e2e2', borderRadius: 8, textDecoration: 'none', color: '#555', fontSize: 14 }}>
            View sitemap.xml
          </a>
          <a href={`${import.meta.env.VITE_API_URL?.replace('/api','')}/api/seo/robots.txt`} target="_blank" rel="noreferrer"
            style={{ padding: '9px 18px', border: '1px solid #e2e2e2', borderRadius: 8, textDecoration: 'none', color: '#555', fontSize: 14 }}>
            View robots.txt
          </a>
        </div>
      </div>
    </div>
  );
}