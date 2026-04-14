import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';

const MENU_KEYS = [
  { key: 'header', label: 'Header Navigation' },
  { key: 'footer', label: 'Footer Menu' },
];

const ITEM_TYPES = [
  { value: 'page',     label: 'Site Page' },
  { value: 'category', label: 'Category' },
  { value: 'custom',   label: 'Custom URL' },
  { value: 'blog',     label: 'Blog' },
];

const QUICK_LINKS = [
  { label: 'Home',      url: '/' },
  { label: 'Shop',      url: '/shop' },
  { label: 'Blog',      url: '/blog' },
  { label: 'Contact',   url: '/contact' },
  { label: 'About',     url: '/about' },
  { label: 'Privacy',   url: '/privacy' },
  { label: 'Terms',     url: '/terms' },
  { label: 'Cart',      url: '/cart' },
  { label: 'My Orders', url: '/my-orders' },
];

let _uid = 1;
const uid = () => `item_${Date.now()}_${_uid++}`;

export default function MenuBuilder() {
  const qc = useQueryClient();
  const [activeMenuKey, setActiveMenuKey] = useState('header');
  const [items, setItems]                 = useState([]);
  const [newItem, setNewItem]             = useState({ label: '', url: '', type: 'custom', target: '_self' });
  const [dragging, setDragging]           = useState(null);
  const [dragOver, setDragOver]           = useState(null);

  const { isLoading } = useQuery({
    queryKey: ['menu', activeMenuKey],
    queryFn:  () => api.get(`/menus/${activeMenuKey}`).then(r => r.data.data),
    onSuccess: (data) => setItems(data.items || []),
  });

  const saveMutation = useMutation({
    mutationFn: (data) => api.put(`/menus/${activeMenuKey}`, data),
    onSuccess:  () => { qc.invalidateQueries({ queryKey: ['menu', activeMenuKey] }); alert('Menu saved!'); },
    onError:    (err) => alert(err.response?.data?.message || 'Save failed'),
  });

  const addItem = () => {
    if (!newItem.label.trim() || !newItem.url.trim()) return alert('Label and URL are required');
    setItems(prev => [...prev, { ...newItem, id: uid(), children: [] }]);
    setNewItem({ label: '', url: '', type: 'custom', target: '_self' });
  };

  const addQuickLink = (link) => {
    const exists = items.find(i => i.url === link.url);
    if (exists) return alert(`"${link.label}" is already in the menu`);
    setItems(prev => [...prev, { id: uid(), label: link.label, url: link.url, type: 'page', target: '_self', children: [] }]);
  };

  const removeItem = (id) => setItems(prev => prev.filter(i => i.id !== id));

  const updateItem = (id, key, value) =>
    setItems(prev => prev.map(i => i.id === id ? { ...i, [key]: value } : i));

  const moveUp   = (idx) => { if (idx === 0) return; const a = [...items]; [a[idx-1], a[idx]] = [a[idx], a[idx-1]]; setItems(a); };
  const moveDown = (idx) => { if (idx === items.length-1) return; const a = [...items]; [a[idx], a[idx+1]] = [a[idx+1], a[idx]]; setItems(a); };

  const handleDragStart = (idx) => setDragging(idx);
  const handleDragEnter = (idx) => setDragOver(idx);
  const handleDrop = () => {
    if (dragging === null || dragOver === null || dragging === dragOver) { setDragging(null); setDragOver(null); return; }
    const a = [...items];
    const [removed] = a.splice(dragging, 1);
    a.splice(dragOver, 0, removed);
    setItems(a);
    setDragging(null); setDragOver(null);
  };

  return (
    <div className="admin-page-menu-builder-menu-builder" id="admin-page-menu-builder-menu-builder">
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Menu Builder</h2>
        <button onClick={() => saveMutation.mutate({ items })} disabled={saveMutation.isPending}
          style={{ padding: '9px 20px', background: '#111827', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>
          {saveMutation.isPending ? 'Saving...' : 'Save Menu'}
        </button>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {MENU_KEYS.map(m => (
          <button key={m.key} onClick={() => setActiveMenuKey(m.key)}
            style={{ padding: '8px 18px', border: '1px solid #e5e7eb', borderRadius: 20, background: activeMenuKey === m.key ? '#111827' : '#fff', color: activeMenuKey === m.key ? '#fff' : '#374151', cursor: 'pointer', fontSize: 14 }}>
            {m.label}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 20 }}>
        <div>
          <div style={s.card}>
            <h3 style={s.cardTitle}>Menu items — drag to reorder</h3>
            {isLoading ? <p>Loading...</p> : items.length === 0 ? (
              <p style={{ color: '#9ca3af', fontSize: 14 }}>No items yet. Add items from the right panel.</p>
            ) : (
              items.map((item, idx) => (
                <div key={item.id}
                  draggable
                  onDragStart={() => handleDragStart(idx)}
                  onDragEnter={() => handleDragEnter(idx)}
                  onDragEnd={handleDrop}
                  onDragOver={(e) => e.preventDefault()}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', border: `1px solid ${dragOver === idx ? '#111827' : '#e5e7eb'}`, borderRadius: 8, marginBottom: 8, background: dragging === idx ? '#f9fafb' : '#fff', cursor: 'grab' }}>
                  <span style={{ color: '#9ca3af', fontSize: 18, cursor: 'grab', userSelect: 'none' }}>⠿</span>
                  <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 8, alignItems: 'center' }}>
                    <input value={item.label} onChange={e => updateItem(item.id, 'label', e.target.value)}
                      style={s.input} placeholder="Label" />
                    <input value={item.url} onChange={e => updateItem(item.id, 'url', e.target.value)}
                      style={s.input} placeholder="URL" />
                    <select value={item.target} onChange={e => updateItem(item.id, 'target', e.target.value)} style={{ ...s.input, width: 100 }}>
                      <option value="_self">Same tab</option>
                      <option value="_blank">New tab</option>
                    </select>
                  </div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button onClick={() => moveUp(idx)} disabled={idx === 0} style={s.arrowBtn}>↑</button>
                    <button onClick={() => moveDown(idx)} disabled={idx === items.length - 1} style={s.arrowBtn}>↓</button>
                    <button onClick={() => removeItem(item.id)} style={{ ...s.arrowBtn, color: '#dc2626', borderColor: '#fecaca' }}>✕</button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div>
          <div style={s.card}>
            <h3 style={s.cardTitle}>Add custom link</h3>
            <div style={{ marginBottom: 10 }}>
              <label style={s.label}>Label *</label>
              <input value={newItem.label} onChange={e => setNewItem(p => ({ ...p, label: e.target.value }))}
                placeholder="e.g. Sale Items" style={s.input} />
            </div>
            <div style={{ marginBottom: 10 }}>
              <label style={s.label}>URL *</label>
              <input value={newItem.url} onChange={e => setNewItem(p => ({ ...p, url: e.target.value }))}
                placeholder="/shop?sale=true or https://..." style={s.input} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
              <div>
                <label style={s.label}>Type</label>
                <select value={newItem.type} onChange={e => setNewItem(p => ({ ...p, type: e.target.value }))} style={s.input}>
                  {ITEM_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label style={s.label}>Open in</label>
                <select value={newItem.target} onChange={e => setNewItem(p => ({ ...p, target: e.target.value }))} style={s.input}>
                  <option value="_self">Same tab</option>
                  <option value="_blank">New tab</option>
                </select>
              </div>
            </div>
            <button onClick={addItem} style={{ width: '100%', padding: '9px', background: '#111827', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>
              Add Item
            </button>
          </div>

          <div style={s.card}>
            <h3 style={s.cardTitle}>Quick add pages</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {QUICK_LINKS.map(link => (
                <button key={link.url} onClick={() => addQuickLink(link)}
                  style={{ padding: '5px 12px', border: '1px solid #e5e7eb', borderRadius: 20, background: '#fff', cursor: 'pointer', fontSize: 13, color: '#374151' }}>
                  + {link.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const s = {
  card:      { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: 20, marginBottom: 16 },
  cardTitle: { fontSize: 15, fontWeight: 700, margin: '0 0 16px' },
  label:     { display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 5, color: '#374151' },
  input:     { width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: 7, fontSize: 13, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' },
  arrowBtn:  { width: 28, height: 28, border: '1px solid #e5e7eb', borderRadius: 6, background: '#fff', cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' },
};