import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';

const HEADERS = ['header1', 'header2', 'header3', 'header4'];
const FOOTERS = ['footer1', 'footer2', 'footer3', 'footer4'];

export default function LayoutSettings() {
  const queryClient = useQueryClient();

  const { data: layout } = useQuery({
    queryKey: ['layout'],
    queryFn: () => api.get('/settings/layout').then((r) => r.data.data),
  });

  const [selected, setSelected] = useState({ header: null, footer: null });

  const mutation = useMutation({
    mutationFn: (payload) => api.put('/settings/layout', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['layout'] });
      alert('Layout updated!');
    },
  });

  const current = { header: layout?.header || 'header1', footer: layout?.footer || 'footer1' };
  const active = { header: selected.header || current.header, footer: selected.footer || current.footer };

  const handleSave = () => mutation.mutate(active);

  return (
    <div className="admin-page-settings-layout-settings" id="admin-page-settings-layout-settings">
      <h2>Layout Settings</h2>
      <section>
        <h3>Header</h3>
        <div style={{ display: 'flex', gap: 8 }}>
          {HEADERS.map((h) => (
            <button
              key={h}
              onClick={() => setSelected((s) => ({ ...s, header: h }))}
              style={{ fontWeight: active.header === h ? 'bold' : 'normal', border: active.header === h ? '2px solid blue' : '1px solid #ccc', padding: '6px 12px', borderRadius: 6 }}
            >
              {h}
            </button>
          ))}
        </div>
      </section>

      <section style={{ marginTop: 24 }}>
        <h3>Footer</h3>
        <div style={{ display: 'flex', gap: 8 }}>
          {FOOTERS.map((f) => (
            <button
              key={f}
              onClick={() => setSelected((s) => ({ ...s, footer: f }))}
              style={{ fontWeight: active.footer === f ? 'bold' : 'normal', border: active.footer === f ? '2px solid blue' : '1px solid #ccc', padding: '6px 12px', borderRadius: 6 }}
            >
              {f}
            </button>
          ))}
        </div>
      </section>

      <button onClick={handleSave} disabled={mutation.isPending} style={{ marginTop: 24, padding: '10px 24px' }}>
        {mutation.isPending ? 'Saving...' : 'Save Layout'}
      </button>
    </div>
  );
}