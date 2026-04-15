import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';

const HEADERS = ['header1', 'header2', 'header3', 'header4'];
const FOOTERS = ['footer1', 'footer2', 'footer3', 'footer4'];
const CARD_STYLES = [
  { key: 'style1', icon: '▦', label: 'Classic' },
  { key: 'style2', icon: '▣', label: 'Modern' },
  { key: 'style3', icon: '▬', label: 'List' },
  { key: 'style4', icon: '◼', label: 'Minimal' },
];
const TABS = ['layout', 'cards', 'health', 'metrics'];

export default function Settings() {
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState('layout');

  const { data: layout }  = useQuery({ queryKey: ['layout'],  queryFn: () => api.get('/settings/layout').then(r => r.data.data) });
  const { data: health }  = useQuery({ queryKey: ['health'],  queryFn: () => api.get('/health').then(r => r.data) });
  const { data: metrics } = useQuery({ queryKey: ['metrics'], queryFn: () => api.get('/metrics').then(r => r.data.data), refetchInterval: 15000 });
  const { data: savedCardStyle } = useQuery({ queryKey: ['card-style'], queryFn: () => api.get('/settings/product-card-style').then(r => r.data.data) });

  const [selLayout, setSelLayout]   = useState({});
  const [selCard,   setSelCard]     = useState('style1');

  useEffect(() => { if (savedCardStyle) setSelCard(savedCardStyle); }, [savedCardStyle]);

  const activeLayout = {
    header: selLayout.header || layout?.header || 'header1',
    footer: selLayout.footer || layout?.footer || 'footer1',
  };

  const layoutMutation = useMutation({
    mutationFn: (p) => api.put('/settings/layout', p),
    onSuccess:  () => { qc.invalidateQueries({ queryKey: ['layout'] }); alert('Layout saved!'); },
  });

  const cardMutation = useMutation({
    mutationFn: (style) => api.put('/settings/product-card-style', { style }),
    onSuccess:  () => { qc.invalidateQueries({ queryKey: ['card-style'] }); alert('Card style saved!'); },
  });

  return (
    <div className="admin-page-settings-settings" id="admin-page-settings-settings">
      <h2 style={s.h2}>Site Settings</h2>

      <div style={s.tabRow}>
        {TABS.map(t => (
          <button key={t} onClick={() => setActiveTab(t)}
            style={{ ...s.tab, ...(activeTab === t && s.tabActive) }}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {activeTab === 'layout' && (
        <div style={s.card}>
          <h3 style={s.h3}>Header variant</h3>
          <div style={s.btnRow}>
            {HEADERS.map(h => (
              <button key={h} onClick={() => setSelLayout(l => ({ ...l, header: h }))}
                style={{ ...s.variantBtn, ...(activeLayout.header === h && s.variantBtnActive) }}>
                {h}
                {activeLayout.header === h && <span style={s.currentBadge}>current</span>}
              </button>
            ))}
          </div>

          <h3 style={{ ...s.h3, marginTop: 28 }}>Footer variant</h3>
          <div style={s.btnRow}>
            {FOOTERS.map(f => (
              <button key={f} onClick={() => setSelLayout(l => ({ ...l, footer: f }))}
                style={{ ...s.variantBtn, ...(activeLayout.footer === f && s.variantBtnActive) }}>
                {f}
                {activeLayout.footer === f && <span style={s.currentBadge}>current</span>}
              </button>
            ))}
          </div>

          <button onClick={() => layoutMutation.mutate(activeLayout)} disabled={layoutMutation.isPending}
            style={s.saveBtn}>
            {layoutMutation.isPending ? 'Saving...' : 'Save Layout'}
          </button>
        </div>
      )}

      {activeTab === 'cards' && (
        <div style={s.card}>
          <h3 style={s.h3}>Product card design</h3>
          <p style={s.hint}>Select the card style used across all product listings.</p>
          <div style={s.cardStyleGrid}>
            {CARD_STYLES.map(cs => (
              <button key={cs.key} onClick={() => setSelCard(cs.key)}
                style={{ ...s.cardStyleBtn, ...(selCard === cs.key && s.cardStyleBtnActive) }}>
                <span style={{ fontSize: 32, display: 'block', marginBottom: 8 }}>{cs.icon}</span>
                <span style={{ fontWeight: selCard === cs.key ? 700 : 400, fontSize: 14 }}>{cs.label}</span>
                {selCard === cs.key && <span style={{ display: 'block', fontSize: 11, color: '#059669', marginTop: 4 }}>Active</span>}
              </button>
            ))}
          </div>
          <button onClick={() => cardMutation.mutate(selCard)} disabled={cardMutation.isPending}
            style={{ ...s.saveBtn, marginTop: 8 }}>
            {cardMutation.isPending ? 'Saving...' : 'Apply Card Style'}
          </button>
        </div>
      )}

      {activeTab === 'health' && (
        <div style={s.card}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <span style={{ width: 14, height: 14, borderRadius: '50%', background: health?.status === 'ok' ? '#22c55e' : '#ef4444', display: 'inline-block' }} />
            <h3 style={{ margin: 0, fontSize: 16 }}>{health?.status === 'ok' ? 'All systems operational' : 'System issue detected'}</h3>
          </div>
          {[
            { label: 'Status',    value: health?.status ?? '—' },
            { label: 'Uptime',   value: health ? `${Math.floor(health.uptime/3600)}h ${Math.floor((health.uptime%3600)/60)}m` : '—' },
            { label: 'Timestamp',value: health?.timestamp ? new Date(health.timestamp).toLocaleString() : '—' },
          ].map(r => (
            <div key={r.label} style={s.metricRow}>
              <span style={{ color: '#666' }}>{r.label}</span>
              <strong>{r.value}</strong>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'metrics' && (
        <div style={s.card}>
          <p style={{ margin: '0 0 16px', fontSize: 13, color: '#888' }}>Auto-refreshes every 15 s</p>
          {metrics ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14 }}>
              {[
                { label: 'RSS Memory',    value: `${metrics.memoryMB?.rss} MB` },
                { label: 'Heap used',     value: `${metrics.memoryMB?.heapUsed} MB` },
                { label: 'Heap total',    value: `${metrics.memoryMB?.heapTotal} MB` },
                { label: 'CPU load (1m)', value: metrics.cpuLoad?.[0]?.toFixed(2) },
                { label: 'Platform',      value: metrics.platform },
                { label: 'Node version',  value: metrics.nodeVersion },
              ].map(m => (
                <div key={m.label} style={s.metricCard}>
                  <p style={{ fontSize: 20, fontWeight: 700, margin: '0 0 4px' }}>{m.value}</p>
                  <p style={{ fontSize: 12, color: '#888', margin: 0 }}>{m.label}</p>
                </div>
              ))}
            </div>
          ) : <p style={{ color: '#9ca3af' }}>Loading metrics...</p>}
        </div>
      )}
    </div>
  );
}

const s = {
  h2:              { fontSize: 20, fontWeight: 700, margin: '0 0 20px' },
  h3:              { fontSize: 15, fontWeight: 700, margin: '0 0 14px' },
  hint:            { fontSize: 13, color: '#6b7280', margin: '0 0 16px' },
  tabRow:          { display: 'flex', gap: 4, marginBottom: 20, flexWrap: 'wrap' },
  tab:             { padding: '8px 18px', border: '1px solid #e5e7eb', borderRadius: 20, background: '#fff', cursor: 'pointer', fontSize: 14, color: '#374151' },
  tabActive:       { background: '#111827', color: '#fff', borderColor: '#111827' },
  card:            { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 24 },
  btnRow:          { display: 'flex', gap: 10, flexWrap: 'wrap' },
  variantBtn:      { padding: '14px 24px', border: '2px solid #e5e7eb', borderRadius: 10, background: '#fff', cursor: 'pointer', fontSize: 14, textAlign: 'center' },
  variantBtnActive:{ borderColor: '#111827', background: '#f9fafb', fontWeight: 700 },
  currentBadge:    { display: 'block', fontSize: 11, color: '#6b7280', marginTop: 2 },
  saveBtn:         { marginTop: 24, padding: '11px 28px', background: '#111827', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' },
  cardStyleGrid:   { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 16 },
  cardStyleBtn:    { padding: 16, border: '2px solid #e5e7eb', borderRadius: 10, background: '#fff', cursor: 'pointer', textAlign: 'center' },
  cardStyleBtnActive: { borderColor: '#111827', background: '#f9fafb' },
  metricRow:       { display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #f3f4f6', fontSize: 15 },
  metricCard:      { background: '#f9fafb', borderRadius: 8, padding: '14px 16px' },
};