import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';

export default function GeneralSettings() {
  const qc = useQueryClient();
  const { data: settings } = useQuery({ queryKey: ['all-settings'], queryFn: () => api.get('/settings/all').then(r => r.data.data) });
  const [form, setForm] = useState({ siteName: '', siteDesc: '', siteUrl: '', favicon: '', logo: '', siteKeywords: '', adminEmail: '', siteAddress: '', phone: '', email: '' });

  useEffect(() => {
    if (settings) setForm(prev => ({ ...prev, ...settings }));
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: (data) => api.put('/settings/bulk', data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['all-settings'] }); alert('Settings saved! Reload frontend to see changes.'); },
    onError:   (err) => alert(err.response?.data?.message || 'Save failed'),
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const FIELDS = [
    { group: 'Site identity', fields: [
      { k: 'siteName',    label: 'Site name',         ph: 'ShopBD' },
      { k: 'siteUrl',     label: 'Site URL',          ph: 'https://shopbd.com' },
      { k: 'siteDesc',    label: 'Site description',  ph: 'Best products at best prices', full: true },
      { k: 'siteKeywords',label: 'SEO keywords',      ph: 'shop, ecommerce, bangladesh', full: true },
      { k: 'logo',        label: 'Logo URL',          ph: 'https://...' },
      { k: 'favicon',     label: 'Favicon URL',       ph: 'https://...favicon.ico' },
    ]},
    { group: 'Contact information', fields: [
      { k: 'adminEmail',  label: 'Admin email',       ph: 'admin@shopbd.com' },
      { k: 'phone',       label: 'Contact phone',     ph: '01700-000000' },
      { k: 'email',       label: 'Support email',     ph: 'support@shopbd.com' },
      { k: 'siteAddress', label: 'Business address',  ph: 'Dhaka, Bangladesh', full: true },
    ]},
  ];

  return (
    <div className="admin-page-settings-general-settings" id="admin-page-settings-general-settings">
      <h2 style={{ margin: '0 0 20px', fontSize: 20, fontWeight: 700 }}>General Settings</h2>

      {FIELDS.map(group => (
        <div key={group.group} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: 20, marginBottom: 16 }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700 }}>{group.group}</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            {group.fields.map(f => (
              <div key={f.k} style={{ ...(f.full && { gridColumn: '1/-1' }) }}>
                <label style={s.label}>{f.label}</label>
                <input value={form[f.k] || ''} onChange={e => set(f.k, e.target.value)}
                  placeholder={f.ph} style={s.input} />
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Preview logo + favicon */}
      {(form.logo || form.favicon) && (
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: 20, marginBottom: 16 }}>
          <h3 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 700 }}>Preview</h3>
          <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
            {form.logo && (
              <div>
                <p style={s.label}>Logo</p>
                <img src={form.logo} alt="logo" style={{ maxHeight: 60, maxWidth: 200, objectFit: 'contain', border: '1px solid #e5e7eb', borderRadius: 6, padding: 6 }} onError={e => e.target.style.display='none'} />
              </div>
            )}
            {form.favicon && (
              <div>
                <p style={s.label}>Favicon</p>
                <img src={form.favicon} alt="favicon" style={{ width: 32, height: 32, objectFit: 'contain', border: '1px solid #e5e7eb', borderRadius: 4, padding: 4 }} onError={e => e.target.style.display='none'} />
              </div>
            )}
          </div>
        </div>
      )}

      <button onClick={() => saveMutation.mutate(form)} disabled={saveMutation.isPending}
        style={{ padding: '12px 28px', background: '#111827', color: '#fff', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>
        {saveMutation.isPending ? 'Saving...' : 'Save All Settings'}
      </button>
    </div>
  );
}

const s = {
  label: { display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 5, color: '#374151' },
  input: { width: '100%', padding: '9px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' },
};