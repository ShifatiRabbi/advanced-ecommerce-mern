import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';

const FIELDS = [
  { key: 'ga4MeasurementId', label: 'GA4 Measurement ID',    placeholder: 'G-XXXXXXXXXX' },
  { key: 'gtmId',            label: 'GTM Container ID',      placeholder: 'GTM-XXXXXXX' },
  { key: 'fbPixelId',        label: 'Facebook Pixel ID',     placeholder: '123456789012345' },
  { key: 'smsApiKey',        label: 'SMS API Key',           placeholder: 'Green Web / other provider' },
  { key: 'smsSenderId',      label: 'SMS Sender ID',         placeholder: 'ShopBD' },
];

export default function Marketing() {
  const qc = useQueryClient();
  const { data }   = useQuery({ queryKey: ['marketing'], queryFn: () => api.get('/marketing').then(r => r.data.data) });
  const [form, setForm] = useState({});
  const [smsForm, setSmsForm] = useState({ numbers: '', message: '' });
  const [smsResult, setSmsResult] = useState('');

  const saveMutation = useMutation({
    mutationFn: (d) => api.put('/marketing', d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['marketing'] }); alert('Saved!'); },
  });

  const smsMutation = useMutation({
    mutationFn: (d) => api.post('/marketing/sms/bulk', d),
    onSuccess: (res) => setSmsResult(JSON.stringify(res.data.data)),
    onError:   (err) => setSmsResult(err.response?.data?.message || 'Failed'),
  });

  const merged = { ...data, ...form };
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div>
      <h2 style={{ margin: '0 0 24px' }}>Marketing & Analytics</h2>

      <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: 12, padding: 24, marginBottom: 24 }}>
        <h3 style={{ margin: '0 0 20px', fontSize: 15 }}>Integration settings</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {FIELDS.map(f => (
            <div key={f.key}>
              <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>{f.label}</label>
              <input value={merged[f.key] || ''} onChange={e => set(f.key, e.target.value)}
                placeholder={f.placeholder}
                style={{ width: '100%', padding: '9px 12px', border: '1px solid #e2e2e2', borderRadius: 8, fontSize: 14, boxSizing: 'border-box' }} />
            </div>
          ))}
        </div>
        <button onClick={() => saveMutation.mutate(form)} disabled={saveMutation.isPending}
          style={{ marginTop: 20, padding: '10px 24px', background: '#1a1a1a', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14 }}>
          {saveMutation.isPending ? 'Saving...' : 'Save Settings'}
        </button>
      </div>

      <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: 12, padding: 24 }}>
        <h3 style={{ margin: '0 0 16px', fontSize: 15 }}>Send bulk SMS</h3>
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>Phone numbers (comma-separated)</label>
          <textarea value={smsForm.numbers} onChange={e => setSmsForm(f => ({ ...f, numbers: e.target.value }))}
            placeholder="01711111111, 01722222222"
            style={{ width: '100%', height: 80, padding: '9px 12px', border: '1px solid #e2e2e2', borderRadius: 8, fontSize: 14, boxSizing: 'border-box', resize: 'vertical' }} />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>Message ({smsForm.message.length}/160)</label>
          <textarea value={smsForm.message} onChange={e => setSmsForm(f => ({ ...f, message: e.target.value }))} maxLength={160}
            style={{ width: '100%', height: 80, padding: '9px 12px', border: '1px solid #e2e2e2', borderRadius: 8, fontSize: 14, boxSizing: 'border-box', resize: 'vertical' }} />
        </div>
        <button onClick={() => smsMutation.mutate({ numbers: smsForm.numbers.split(',').map(n => n.trim()), message: smsForm.message })}
          disabled={smsMutation.isPending}
          style={{ padding: '10px 24px', background: '#1a1a1a', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14 }}>
          {smsMutation.isPending ? 'Sending...' : 'Send SMS'}
        </button>
        {smsResult && <pre style={{ marginTop: 12, background: '#f9f9f9', padding: 12, borderRadius: 8, fontSize: 12 }}>{smsResult}</pre>}
      </div>
    </div>
  );
}