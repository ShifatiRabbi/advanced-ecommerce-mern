import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';

const HEADERS = ['header1', 'header2', 'header3', 'header4'];
const FOOTERS = ['footer1', 'footer2', 'footer3', 'footer4'];

export default function Settings() {
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState('layout');

  const { data: layout } = useQuery({ queryKey: ['layout'], queryFn: () => api.get('/settings/layout').then(r => r.data.data) });
  const { data: health } = useQuery({ queryKey: ['health'], queryFn: () => api.get('/health').then(r => r.data) });
  const { data: metrics}= useQuery({ queryKey: ['metrics'], queryFn: () => api.get('/metrics').then(r => r.data.data), refetchInterval: 15000 });

  const [selectedLayout, setSelectedLayout] = useState({});

  const layoutMutation = useMutation({
    mutationFn: (payload) => api.put('/settings/layout', payload),
    onSuccess: (res) => { qc.invalidateQueries({ queryKey: ['layout'] }); alert('Layout saved!'); },
  });

  const active = { header: selectedLayout.header || layout?.header || 'header1', footer: selectedLayout.footer || layout?.footer || 'footer1' };

  const TABS = ['layout', 'health', 'metrics'];

  return (
    <div>
      <h2 style={{ margin: '0 0 20px' }}>Site Settings</h2>
      <div style={{ display: 'flex', gap: 4, marginBottom: 24 }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setActiveTab(t)}
            style={{ padding: '8px 18px', border: '1px solid #e2e2e2', borderRadius: 20, background: activeTab === t ? '#1a1a1a' : 'none', color: activeTab === t ? '#fff' : 'inherit', cursor: 'pointer', fontSize: 14, textTransform: 'capitalize' }}>
            {t}
          </button>
        ))}
      </div>

      {activeTab === 'layout' && (
        <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: 12, padding: 28 }}>
          <h3 style={{ margin: '0 0 20px', fontSize: 16 }}>Header layout</h3>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 32 }}>
            {HEADERS.map(h => (
              <button key={h} onClick={() => setSelectedLayout(s => ({ ...s, header: h }))}
                style={{ padding: '16px 28px', border: `2px solid ${active.header === h ? '#1a1a1a' : '#e2e2e2'}`, borderRadius: 10, background: active.header === h ? '#f9f9f9' : '#fff', cursor: 'pointer', fontWeight: active.header === h ? 700 : 400, fontSize: 15 }}>
                {h}
                {active.header === h && <span style={{ display: 'block', fontSize: 11, color: '#888', marginTop: 2 }}>current</span>}
              </button>
            ))}
          </div>
          <h3 style={{ margin: '0 0 20px', fontSize: 16 }}>Footer layout</h3>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 32 }}>
            {FOOTERS.map(f => (
              <button key={f} onClick={() => setSelectedLayout(s => ({ ...s, footer: f }))}
                style={{ padding: '16px 28px', border: `2px solid ${active.footer === f ? '#1a1a1a' : '#e2e2e2'}`, borderRadius: 10, background: active.footer === f ? '#f9f9f9' : '#fff', cursor: 'pointer', fontWeight: active.footer === f ? 700 : 400, fontSize: 15 }}>
                {f}
                {active.footer === f && <span style={{ display: 'block', fontSize: 11, color: '#888', marginTop: 2 }}>current</span>}
              </button>
            ))}
          </div>
          <button onClick={() => layoutMutation.mutate(active)} disabled={layoutMutation.isPending}
            style={{ padding: '12px 32px', background: '#1a1a1a', color: '#fff', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>
            {layoutMutation.isPending ? 'Saving...' : 'Save Layout'}
          </button>
        </div>
      )}

      {activeTab === 'health' && (
        <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: 12, padding: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <div style={{ width: 14, height: 14, borderRadius: '50%', background: health?.status === 'ok' ? '#22c55e' : '#ef4444' }} />
            <h3 style={{ margin: 0 }}>{health?.status === 'ok' ? 'All systems operational' : 'System issue detected'}</h3>
          </div>
          {[
            { label: 'Status',    value: health?.status },
            { label: 'Uptime',   value: health ? `${Math.floor(health.uptime / 3600)}h ${Math.floor((health.uptime % 3600) / 60)}m` : '—' },
            { label: 'Timestamp',value: health?.timestamp ? new Date(health.timestamp).toLocaleString() : '—' },
          ].map(r => (
            <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #f5f5f5', fontSize: 15 }}>
              <span style={{ color: '#666' }}>{r.label}</span>
              <strong>{r.value}</strong>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'metrics' && metrics && (
        <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: 12, padding: 28 }}>
          <p style={{ margin: '0 0 16px', fontSize: 13, color: '#888' }}>Auto-refreshes every 15s</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 20 }}>
            {[
              { label: 'RSS Memory',   value: `${metrics.memoryMB?.rss} MB` },
              { label: 'Heap used',    value: `${metrics.memoryMB?.heapUsed} MB` },
              { label: 'Heap total',   value: `${metrics.memoryMB?.heapTotal} MB` },
              { label: 'CPU load (1m)',value: metrics.cpuLoad?.[0]?.toFixed(2) },
              { label: 'Platform',     value: metrics.platform },
              { label: 'Node version', value: metrics.nodeVersion },
            ].map(m => (
              <div key={m.label} style={{ background: '#f9f9f9', borderRadius: 8, padding: '14px 16px' }}>
                <p style={{ fontSize: 18, fontWeight: 700, margin: '0 0 4px' }}>{m.value}</p>
                <p style={{ fontSize: 12, color: '#888', margin: 0 }}>{m.label}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}