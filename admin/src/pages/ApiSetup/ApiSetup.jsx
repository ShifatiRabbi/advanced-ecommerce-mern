import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import { toast } from '../../utils/toast';

export default function ApiSetup() {
  const qc = useQueryClient();
  const { data, isLoading, error } = useQuery({
    queryKey: ['api-env'],
    queryFn: () => api.get('/api-env').then((r) => r.data.data),
  });

  const [managedDraft, setManagedDraft] = useState({});
  const [managedClear, setManagedClear] = useState(() => new Set());
  const [customRows, setCustomRows] = useState([]);
  const [customClear, setCustomClear] = useState(() => new Set());
  const [newCustomKey, setNewCustomKey] = useState('');
  const [newCustomVal, setNewCustomVal] = useState('');

  useEffect(() => {
    if (!data?.managed) return;
    setManagedDraft({});
    setManagedClear(new Set());
    setCustomRows(
      (data.custom || []).map((c) => ({
        key: c.key,
        value: '',
      }))
    );
    setCustomClear(new Set());
    setNewCustomKey('');
    setNewCustomVal('');
  }, [data]);

  const groupedManaged = useMemo(() => {
    const m = new Map();
    for (const row of data?.managed ?? []) {
      if (!m.has(row.group)) m.set(row.group, []);
      m.get(row.group).push(row);
    }
    return [...m.entries()];
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: (body) => api.put('/api-env', body),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['api-env'] });
      toast.success(res.data?.message || 'Saved');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Save failed'),
  });

  const setManaged = (key, val) => {
    setManagedDraft((d) => ({ ...d, [key]: val }));
    setManagedClear((s) => {
      const n = new Set(s);
      n.delete(key);
      return n;
    });
  };

  const markManagedClear = (key) => {
    setManagedClear((s) => new Set(s).add(key));
    setManagedDraft((d) => {
      const n = { ...d };
      delete n[key];
      return n;
    });
  };

  const setCustomRow = (key, val) => {
    setCustomRows((rows) => rows.map((r) => (r.key === key ? { ...r, value: val } : r)));
    setCustomClear((s) => {
      const n = new Set(s);
      n.delete(key);
      return n;
    });
  };

  const markCustomClear = (key) => {
    setCustomClear((s) => new Set(s).add(key));
    setCustomRows((rows) => rows.map((r) => (r.key === key ? { ...r, value: '' } : r)));
  };

  const addSuggested = (key) => {
    if (customRows.some((r) => r.key === key)) return;
    setCustomRows((rows) => [...rows, { key, value: '' }]);
  };

  const handleSave = () => {
    const overrides = {};
    for (const k of managedClear) overrides[k] = null;
    for (const [k, v] of Object.entries(managedDraft)) {
      if (v != null && String(v).trim() !== '') overrides[k] = String(v).trim();
    }

    const custom = {};
    for (const k of customClear) custom[k] = null;
    for (const row of customRows) {
      const k = row.key?.trim();
      if (!k) continue;
      const upper = k.toUpperCase();
      if (!/^[A-Z][A-Z0-9_]*$/.test(upper)) {
        toast.error(`Invalid env key: ${upper}`);
        return;
      }
      if (row.value != null && String(row.value).trim() !== '') custom[upper] = String(row.value).trim();
    }
    if (newCustomKey.trim() && newCustomVal.trim()) {
      const upper = newCustomKey.trim().toUpperCase();
      if (!/^[A-Z][A-Z0-9_]*$/.test(upper)) {
        toast.error('Advanced key must be UPPER_SNAKE_CASE (letters, numbers, underscore).');
        return;
      }
      custom[upper] = newCustomVal.trim();
    }

    const body = {};
    if (Object.keys(overrides).length) body.overrides = overrides;
    if (Object.keys(custom).length) body.custom = custom;
    if (!body.overrides && !body.custom) {
      toast.error('Nothing to save. Enter a value, add an advanced key, or use Clear override.');
      return;
    }
    saveMutation.mutate(body);
  };

  if (isLoading) {
    return (
      <div className="admin-page-api-setup" id="admin-page-api-setup">
        <p style={{ color: '#64748b' }}>Loading API setup…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-page-api-setup" id="admin-page-api-setup">
        <p style={{ color: '#b91c1c' }}>{error.response?.data?.message || 'Could not load API setup.'}</p>
      </div>
    );
  }

  return (
    <div className="admin-page-api-setup" id="admin-page-api-setup">
      <h2 style={{ margin: '0 0 8px', fontSize: 20, fontWeight: 700 }}>API setup</h2>
      <p style={{ margin: '0 0 20px', fontSize: 14, color: '#64748b', maxWidth: 720 }}>
        Values saved here override your server <code style={{ fontSize: 13 }}>.env</code> at runtime (after save, no
        redeploy needed). Secrets are never returned in full; leave a field empty to keep the current stored value.
        Use <strong>Clear override</strong> to remove the database value and fall back to <code>.env</code>.
      </p>

      {groupedManaged.map(([group, rows]) => (
        <div
          key={group}
          style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: 20, marginBottom: 16 }}
        >
          <h3 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 700 }}>{group}</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {rows.map((row) => (
              <div
                key={row.key}
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'minmax(160px, 1fr) minmax(200px, 1.2fr) auto',
                  gap: 12,
                  alignItems: 'start',
                  borderBottom: '1px solid #f1f5f9',
                  paddingBottom: 12,
                }}
              >
                <div>
                  <div style={s.label}>{row.label}</div>
                  <code style={{ fontSize: 12, color: '#64748b' }}>{row.key}</code>
                  {row.maskedPreview && (
                    <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>Current: {row.maskedPreview}</div>
                  )}
                  <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>{row.displayHint}</div>
                </div>
                <div>
                  <label style={s.label}>New value</label>
                  <input
                    type={row.sensitive ? 'password' : 'text'}
                    autoComplete="off"
                    value={managedDraft[row.key] ?? ''}
                    onChange={(e) => setManaged(row.key, e.target.value)}
                    placeholder={row.hasDatabaseOverride || row.hasEnvValue ? '•••• (hidden)' : 'Not set'}
                    style={s.input}
                  />
                </div>
                <div style={{ paddingTop: 22 }}>
                  <button type="button" onClick={() => markManagedClear(row.key)} style={s.btnGhost}>
                    Clear override
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: 20, marginBottom: 16 }}>
        <h3 style={{ margin: '0 0 8px', fontSize: 15, fontWeight: 700 }}>Advanced / custom env keys</h3>
        <p style={{ margin: '0 0 16px', fontSize: 13, color: '#64748b' }}>
          Common AI keys (OpenAI, Anthropic, Gemini, xAI, and so on) are listed in the groups above. Use this section
          for extra provider keys or anything not in that list. Keys must be UPPER_SNAKE_CASE and are merged into the
          server <code>env</code> object (same shape as <code>process.env</code> for supported code paths). Quick-add
          suggestions:
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
          {(data?.suggestedAdvancedKeys || []).map((k) => (
            <button key={k} type="button" onClick={() => addSuggested(k)} style={s.chip}>
              + {k}
            </button>
          ))}
        </div>

        {customRows.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
            {customRows.map((row) => (
              <div
                key={row.key}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1.5fr auto',
                  gap: 10,
                  alignItems: 'end',
                }}
              >
                <div>
                  <label style={s.label}>Key</label>
                  <input value={row.key} readOnly style={{ ...s.input, background: '#f8fafc' }} />
                </div>
                <div>
                  <label style={s.label}>New value</label>
                  <input
                    type="password"
                    autoComplete="off"
                    value={row.value}
                    onChange={(e) => setCustomRow(row.key, e.target.value)}
                    placeholder="Enter new value"
                    style={s.input}
                  />
                </div>
                <button type="button" onClick={() => markCustomClear(row.key)} style={s.btnGhost}>
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: 10, alignItems: 'end' }}>
          <div>
            <label style={s.label}>New key</label>
            <input
              value={newCustomKey}
              onChange={(e) => setNewCustomKey(e.target.value)}
              placeholder="e.g. OPENAI_API_KEY"
              style={s.input}
            />
          </div>
          <div>
            <label style={s.label}>Value</label>
            <input
              type="password"
              autoComplete="off"
              value={newCustomVal}
              onChange={(e) => setNewCustomVal(e.target.value)}
              placeholder="Secret value"
              style={s.input}
            />
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={handleSave}
        disabled={saveMutation.isPending}
        style={{
          padding: '12px 28px',
          background: '#111827',
          color: '#fff',
          border: 'none',
          borderRadius: 8,
          fontSize: 15,
          fontWeight: 600,
          cursor: saveMutation.isPending ? 'wait' : 'pointer',
        }}
      >
        {saveMutation.isPending ? 'Saving…' : 'Save changes'}
      </button>
    </div>
  );
}

const s = {
  label: { display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 5, color: '#374151' },
  input: {
    width: '100%',
    padding: '9px 12px',
    border: '1px solid #d1d5db',
    borderRadius: 8,
    fontSize: 14,
    outline: 'none',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
  },
  btnGhost: {
    padding: '8px 12px',
    borderRadius: 8,
    border: '1px solid #e5e7eb',
    background: '#fff',
    fontSize: 13,
    fontWeight: 600,
    color: '#374151',
    cursor: 'pointer',
  },
  chip: {
    padding: '6px 10px',
    borderRadius: 999,
    border: '1px solid #e2e8f0',
    background: '#f8fafc',
    fontSize: 12,
    cursor: 'pointer',
    fontWeight: 500,
  },
};
