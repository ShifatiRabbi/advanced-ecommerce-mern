import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';

const TYPE_LABELS = {
  welcome:          'Welcome email',
  order_placed:     'Order placed',
  order_confirmed:  'Order confirmed',
  order_shipped:    'Order shipped',
  order_delivered:  'Order delivered',
  order_cancelled:  'Order cancelled',
  password_reset:   'Password reset',
  payment_received: 'Payment received',
  low_stock_alert:  'Low stock alert',
};

export default function EmailTemplates() {
  const qc = useQueryClient();
  const [active, setActive] = useState('order_placed');
  const [form, setForm]     = useState({ subject: '', body: '', isActive: true });
  const [testTo, setTestTo] = useState('');
  const [preview, setPreview] = useState(false);

  const { data: templates } = useQuery({ queryKey: ['email-tpls'], queryFn: () => api.get('/email-templates').then(r => r.data.data) });

  const current = templates?.find(t => t.type === active);

  useEffect(() => {
    if (current) setForm({ subject: current.subject, body: current.body, isActive: current.isActive });
  }, [current]);

  const saveMutation = useMutation({
    mutationFn: (data) => api.put(`/email-templates/${active}`, data),
    onSuccess:  () => { qc.invalidateQueries({ queryKey: ['email-tpls'] }); alert('Template saved!'); },
    onError:    (err) => alert(err.response?.data?.message || 'Save failed'),
  });

  const seedMutation = useMutation({
    mutationFn: () => api.post('/email-templates/seed'),
    onSuccess:  () => { qc.invalidateQueries({ queryKey: ['email-tpls'] }); alert('All templates reset to defaults!'); },
  });

  const testMutation = useMutation({
    mutationFn: () => api.post(`/email-templates/test/${active}`, { to: testTo }),
    onSuccess:  () => alert(`Test email sent to ${testTo}`),
    onError:    (err) => alert(err.response?.data?.message || 'Send failed'),
  });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Email Templates</h2>
        <button onClick={() => seedMutation.mutate()} disabled={seedMutation.isPending}
          style={{ padding: '8px 16px', border: '1px solid #e5e7eb', borderRadius: 8, background: '#fff', cursor: 'pointer', fontSize: 14 }}>
          Reset all to defaults
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 20 }}>
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, overflow: 'hidden' }}>
          {Object.entries(TYPE_LABELS).map(([type, label]) => (
            <button key={type} onClick={() => setActive(type)}
              style={{ display: 'block', width: '100%', textAlign: 'left', padding: '11px 14px', border: 'none', borderBottom: '1px solid #f3f4f6', background: active === type ? '#f0fdf4' : '#fff', cursor: 'pointer', fontSize: 13, fontWeight: active === type ? 700 : 400, color: active === type ? '#2e7d32' : '#374151' }}>
              {label}
            </button>
          ))}
        </div>

        <div>
          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: 24, marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 16 }}>{TYPE_LABELS[active]}</h3>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, cursor: 'pointer' }}>
                  <input type="checkbox" checked={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} />
                  Active
                </label>
                <button onClick={() => setPreview(v => !v)}
                  style={{ padding: '6px 14px', border: '1px solid #e5e7eb', borderRadius: 6, background: preview ? '#f3f4f6' : '#fff', cursor: 'pointer', fontSize: 13 }}>
                  {preview ? 'Edit' : 'Preview'}
                </button>
              </div>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={s.label}>Subject line</label>
              <input value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} style={s.input} />
            </div>

            {current?.variables?.length > 0 && (
              <div style={{ marginBottom: 14, background: '#f9fafb', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#6b7280' }}>
                Available variables: {current.variables.map(v => <code key={v} style={{ background: '#e5e7eb', padding: '1px 4px', borderRadius: 3, marginRight: 4, fontSize: 11 }}>{'{{'+v+'}}'}</code>)}
              </div>
            )}

            {preview ? (
              <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 20, background: '#fff' }}>
                <p style={{ fontWeight: 700, fontSize: 14, marginBottom: 12, color: '#374151' }}>Subject: {form.subject}</p>
                <div dangerouslySetInnerHTML={{ __html: form.body }} />
              </div>
            ) : (
              <div>
                <label style={s.label}>HTML body</label>
                <textarea
                  value={form.body}
                  onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
                  style={{ ...s.input, height: 360, fontFamily: 'monospace', fontSize: 12, resize: 'vertical' }} />
              </div>
            )}

            <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
              <button onClick={() => saveMutation.mutate(form)} disabled={saveMutation.isPending}
                style={{ padding: '10px 24px', background: '#111827', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>
                {saveMutation.isPending ? 'Saving...' : 'Save Template'}
              </button>
            </div>
          </div>

          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: 20 }}>
            <h4 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 700 }}>Send Test Email</h4>
            <div style={{ display: 'flex', gap: 10 }}>
              <input value={testTo} onChange={e => setTestTo(e.target.value)}
                placeholder="recipient@example.com" type="email" style={{ ...s.input, flex: 1 }} />
              <button onClick={() => { if (!testTo) return alert('Enter email'); testMutation.mutate(); }}
                disabled={testMutation.isPending}
                style={{ padding: '9px 20px', background: '#2e7d32', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 600, flexShrink: 0 }}>
                {testMutation.isPending ? 'Sending...' : 'Send Test'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const s = {
  label: { display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 5, color: '#374151' },
  input: { width: '100%', padding: '9px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' },
};