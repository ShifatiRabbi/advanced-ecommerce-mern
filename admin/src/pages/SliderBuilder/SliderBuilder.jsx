import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';

const POSITIONS = [
  { value: 'hero',          label: 'Hero section (top of page)' },
  { value: 'after-hero',    label: 'After hero section' },
  { value: 'middle',        label: 'Middle of page' },
  { value: 'before-footer', label: 'Just before footer' },
  { value: 'custom',        label: 'Custom / specific pages only' },
];

const PAGES = ['/', '/shop', '/about', '/contact', '/blog', '/cart'];

const ALIGN_OPTIONS = [
  { value: 'left',   label: 'Left' },
  { value: 'center', label: 'Center' },
  { value: 'right',  label: 'Right' },
];

const defaultSlide = () => ({
  type: 'mixed', imageUrl: '', heading: 'Welcome to ShopBD', subheading: 'Discover amazing products',
  buttonLabel: 'Shop Now', buttonUrl: '/shop', buttonStyle: 'primary',
  bgColor: '#111827', textColor: '#ffffff', align: 'center', overlay: 40,
});

const emptySlider = () => ({
  name: '', position: 'hero', showOnPages: [], autoPlay: true,
  interval: 4000, showDots: true, showArrows: true, height: '480px',
  isActive: true, slides: [defaultSlide()],
});

export default function SliderBuilder() {
  const qc = useQueryClient();
  const [editing, setEditing]     = useState(null);
  const [form, setForm]           = useState(emptySlider());
  const [activeSlide, setActive]  = useState(0);

  const { data: sliders, isLoading } = useQuery({
    queryKey: ['sliders-admin'],
    queryFn:  () => api.get('/sliders/all').then(r => r.data.data),
  });

  const saveMutation = useMutation({
    mutationFn: (data) => editing ? api.put(`/sliders/${editing}`, data) : api.post('/sliders', data),
    onSuccess:  () => { qc.invalidateQueries({ queryKey: ['sliders-admin'] }); setEditing(null); setForm(emptySlider()); },
    onError:    (err) => alert(err.response?.data?.message || 'Save failed'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/sliders/${id}`),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['sliders-admin'] }),
  });

  const startEdit = (slider) => {
    setEditing(slider._id);
    setForm({ ...slider });
    setActive(0);
  };

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const setSlide = (idx, k, v) => setForm(f => {
    const slides = [...f.slides];
    slides[idx] = { ...slides[idx], [k]: v };
    return { ...f, slides };
  });

  const addSlide    = () => { setForm(f => ({ ...f, slides: [...f.slides, defaultSlide()] })); setActive(form.slides.length); };
  const removeSlide = (idx) => { setForm(f => ({ ...f, slides: f.slides.filter((_, i) => i !== idx) })); setActive(0); };

  const currentSlide = form.slides?.[activeSlide] || defaultSlide();

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Slider / Carousel Builder</h2>
        <button onClick={() => { setEditing(null); setForm(emptySlider()); setActive(0); }}
          style={s.addBtn}>+ New Slider</button>
      </div>

      {(editing !== null || !sliders?.length) && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: 20, marginBottom: 24 }}>
          <div>
            <div style={s.card}>
              <h3 style={s.h3}>Slider settings</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={s.label}>Slider name *</label>
                  <input value={form.name} onChange={e => set('name', e.target.value)} style={s.input} placeholder="e.g. Hero Banner" />
                </div>
                <div>
                  <label style={s.label}>Height</label>
                  <input value={form.height} onChange={e => set('height', e.target.value)} style={s.input} placeholder="480px" />
                </div>
                <div>
                  <label style={s.label}>Position</label>
                  <select value={form.position} onChange={e => set('position', e.target.value)} style={s.input}>
                    {POSITIONS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                  </select>
                </div>
                <div>
                  <label style={s.label}>Auto-play interval (ms)</label>
                  <input type="number" value={form.interval} onChange={e => set('interval', Number(e.target.value))} style={s.input} />
                </div>
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={s.label}>Show on specific pages (leave empty = all pages)</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {PAGES.map(page => (
                    <label key={page} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, cursor: 'pointer' }}>
                      <input type="checkbox"
                        checked={form.showOnPages?.includes(page)}
                        onChange={e => set('showOnPages', e.target.checked
                          ? [...(form.showOnPages || []), page]
                          : (form.showOnPages || []).filter(p => p !== page))} />
                      {page === '/' ? 'Home' : page.replace('/','').replace('-',' ')}
                    </label>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 16, marginBottom: 0 }}>
                {[
                  { k:'autoPlay',   label:'Auto-play' },
                  { k:'showDots',   label:'Show dots' },
                  { k:'showArrows', label:'Show arrows' },
                  { k:'isActive',   label:'Active' },
                ].map(f => (
                  <label key={f.k} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}>
                    <input type="checkbox" checked={!!form[f.k]} onChange={e => set(f.k, e.target.checked)} />
                    {f.label}
                  </label>
                ))}
              </div>
            </div>

            <div style={s.card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>Slides ({form.slides?.length || 0})</h3>
                <button onClick={addSlide} style={{ padding: '5px 12px', background: '#111827', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13 }}>+ Add Slide</button>
              </div>

              <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
                {form.slides?.map((_, i) => (
                  <button key={i} onClick={() => setActive(i)}
                    style={{ padding: '5px 12px', border: `2px solid ${activeSlide === i ? '#111827' : '#e5e7eb'}`, borderRadius: 6, background: activeSlide === i ? '#111827' : '#fff', color: activeSlide === i ? '#fff' : '#374151', cursor: 'pointer', fontSize: 13 }}>
                    Slide {i + 1}
                  </button>
                ))}
              </div>

              {form.slides?.length > 0 && (
                <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, alignItems: 'center' }}>
                    <span style={{ fontWeight: 600, fontSize: 14 }}>Slide {activeSlide + 1}</span>
                    {form.slides.length > 1 && (
                      <button onClick={() => removeSlide(activeSlide)}
                        style={{ padding: '3px 8px', background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: 5, cursor: 'pointer', fontSize: 12 }}>
                        Remove
                      </button>
                    )}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <div style={{ gridColumn: '1/-1' }}>
                      <label style={s.label}>Background image URL</label>
                      <input value={currentSlide.imageUrl} onChange={e => setSlide(activeSlide,'imageUrl',e.target.value)}
                        placeholder="https://..." style={s.input} />
                    </div>
                    <div>
                      <label style={s.label}>Heading text</label>
                      <input value={currentSlide.heading} onChange={e => setSlide(activeSlide,'heading',e.target.value)}
                        placeholder="Welcome to ShopBD" style={s.input} />
                    </div>
                    <div>
                      <label style={s.label}>Subheading</label>
                      <input value={currentSlide.subheading} onChange={e => setSlide(activeSlide,'subheading',e.target.value)}
                        placeholder="Discover amazing products" style={s.input} />
                    </div>
                    <div>
                      <label style={s.label}>Button label</label>
                      <input value={currentSlide.buttonLabel} onChange={e => setSlide(activeSlide,'buttonLabel',e.target.value)}
                        placeholder="Shop Now" style={s.input} />
                    </div>
                    <div>
                      <label style={s.label}>Button URL</label>
                      <input value={currentSlide.buttonUrl} onChange={e => setSlide(activeSlide,'buttonUrl',e.target.value)}
                        placeholder="/shop" style={s.input} />
                    </div>
                    <div>
                      <label style={s.label}>Background color</label>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <input type="color" value={currentSlide.bgColor} onChange={e => setSlide(activeSlide,'bgColor',e.target.value)}
                          style={{ width: 40, height: 36, border: '1px solid #d1d5db', borderRadius: 6, padding: 2, cursor: 'pointer' }} />
                        <input value={currentSlide.bgColor} onChange={e => setSlide(activeSlide,'bgColor',e.target.value)} style={{ ...s.input, fontFamily: 'monospace' }} />
                      </div>
                    </div>
                    <div>
                      <label style={s.label}>Text color</label>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <input type="color" value={currentSlide.textColor} onChange={e => setSlide(activeSlide,'textColor',e.target.value)}
                          style={{ width: 40, height: 36, border: '1px solid #d1d5db', borderRadius: 6, padding: 2, cursor: 'pointer' }} />
                        <input value={currentSlide.textColor} onChange={e => setSlide(activeSlide,'textColor',e.target.value)} style={{ ...s.input, fontFamily: 'monospace' }} />
                      </div>
                    </div>
                    <div>
                      <label style={s.label}>Text alignment</label>
                      <select value={currentSlide.align} onChange={e => setSlide(activeSlide,'align',e.target.value)} style={s.input}>
                        {ALIGN_OPTIONS.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={s.label}>Image overlay opacity ({currentSlide.overlay}%)</label>
                      <input type="range" min={0} max={80} value={currentSlide.overlay}
                        onChange={e => setSlide(activeSlide,'overlay',Number(e.target.value))}
                        style={{ width: '100%', marginTop: 6 }} />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => saveMutation.mutate(form)} disabled={saveMutation.isPending || !form.name}
                style={{ ...s.addBtn, flex: 1 }}>
                {saveMutation.isPending ? 'Saving...' : editing ? 'Update Slider' : 'Create Slider'}
              </button>
              {editing && (
                <button onClick={() => { setEditing(null); setForm(emptySlider()); }}
                  style={{ padding: '10px 20px', border: '1px solid #e5e7eb', borderRadius: 8, background: '#fff', cursor: 'pointer', fontSize: 14 }}>
                  Cancel
                </button>
              )}
            </div>
          </div>

          <div>
            <div style={s.card}>
              <h3 style={s.h3}>Live preview</h3>
              <div style={{
                height: 220, borderRadius: 8, overflow: 'hidden', position: 'relative',
                background: currentSlide.imageUrl ? 'transparent' : currentSlide.bgColor,
              }}>
                {currentSlide.imageUrl && (
                  <img src={currentSlide.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                )}
                {currentSlide.imageUrl && (
                  <div style={{ position: 'absolute', inset: 0, background: `rgba(0,0,0,${currentSlide.overlay/100})` }} />
                )}
                <div style={{
                  position: currentSlide.imageUrl ? 'absolute' : 'relative',
                  inset: 0, display: 'flex', flexDirection: 'column',
                  alignItems: currentSlide.align === 'center' ? 'center' : currentSlide.align === 'right' ? 'flex-end' : 'flex-start',
                  justifyContent: 'center', padding: 20,
                  textAlign: currentSlide.align, color: currentSlide.textColor,
                  background: !currentSlide.imageUrl ? currentSlide.bgColor : 'transparent',
                }}>
                  {currentSlide.heading && <h2 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 8px', color: currentSlide.textColor }}>{currentSlide.heading}</h2>}
                  {currentSlide.subheading && <p style={{ fontSize: 14, margin: '0 0 14px', opacity: 0.85, color: currentSlide.textColor }}>{currentSlide.subheading}</p>}
                  {currentSlide.buttonLabel && (
                    <span style={{ display: 'inline-block', padding: '8px 20px', background: '#fff', color: '#111827', borderRadius: 6, fontWeight: 700, fontSize: 13 }}>
                      {currentSlide.buttonLabel}
                    </span>
                  )}
                </div>
              </div>
              <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 8, textAlign: 'center' }}>
                Position: <strong>{POSITIONS.find(p => p.value === form.position)?.label}</strong>
              </p>
            </div>
          </div>
        </div>
      )}

      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead><tr style={{ background: '#f9fafb', borderBottom: '2px solid #e5e7eb', textAlign: 'left' }}>
            {['Name','Slides','Position','Pages','Status','Actions'].map(h => (
              <th key={h} style={{ padding: '10px 14px', fontWeight: 600, color: '#6b7280', fontSize: 13 }}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {sliders?.map(slider => (
              <tr key={slider._id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                <td style={{ padding: '12px 14px', fontWeight: 600 }}>{slider.name}</td>
                <td style={{ padding: '12px 14px' }}>{slider.slides?.length} slide(s)</td>
                <td style={{ padding: '12px 14px', color: '#6b7280', fontSize: 13 }}>
                  {POSITIONS.find(p => p.value === slider.position)?.label || slider.position}
                </td>
                <td style={{ padding: '12px 14px', fontSize: 12, color: '#9ca3af' }}>
                  {slider.showOnPages?.length ? slider.showOnPages.join(', ') : 'All pages'}
                </td>
                <td style={{ padding: '12px 14px' }}>
                  <span style={{ padding: '3px 8px', borderRadius: 12, fontSize: 12, fontWeight: 600, background: slider.isActive ? '#d1fae5' : '#fee2e2', color: slider.isActive ? '#065f46' : '#991b1b' }}>
                    {slider.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td style={{ padding: '12px 14px' }}>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => startEdit(slider)}
                      style={{ padding: '4px 10px', background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}>Edit</button>
                    <button onClick={() => window.confirm('Delete this slider?') && deleteMutation.mutate(slider._id)}
                      style={{ padding: '4px 10px', background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
            {!sliders?.length && !isLoading && (
              <tr><td colSpan={6} style={{ padding: 24, textAlign: 'center', color: '#9ca3af' }}>No sliders yet. Create one above.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const s = {
  addBtn:  { padding: '9px 18px', background: '#111827', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 600 },
  card:    { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: 20, marginBottom: 16 },
  h3:      { fontSize: 15, fontWeight: 700, margin: '0 0 14px' },
  label:   { display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 5, color: '#374151' },
  input:   { width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: 7, fontSize: 13, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' },
};