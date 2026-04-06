import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';

export default function VariantManager({ productId, variants = [], onUpdate }) {
  const qc = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [newVariant, setNewVariant] = useState({ name: '', options: [] });
  const [newOption, setNewOption]   = useState({ label: '', priceModifier: 0, stock: 0 });

  const addVariantMutation = useMutation({
    mutationFn: (v) => api.post(`/products/${productId}/variants`, v),
    onSuccess:  () => { qc.invalidateQueries({ queryKey: ['product-edit', productId] }); setShowAdd(false); setNewVariant({ name:'', options:[] }); onUpdate?.(); },
  });

  const deleteVariantMutation = useMutation({
    mutationFn: (idx) => api.delete(`/products/${productId}/variants/${idx}`),
    onSuccess:  () => { qc.invalidateQueries({ queryKey: ['product-edit', productId] }); onUpdate?.(); },
  });

  const addOption = () => {
    if (!newOption.label.trim()) return;
    setNewVariant(v => ({ ...v, options: [...v.options, { ...newOption }] }));
    setNewOption({ label:'', priceModifier:0, stock:0 });
  };

  const removeOption = (idx) => setNewVariant(v => ({ ...v, options: v.options.filter((_, i) => i !== idx) }));

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
        <h4 style={{ margin:0, fontSize:14, fontWeight:700 }}>Product Variations ({variants.length})</h4>
        <button onClick={()=>setShowAdd(s=>!s)}
          style={{ padding:'6px 12px', background:'#111827', color:'#fff', border:'none', borderRadius:6, cursor:'pointer', fontSize:13 }}>
          {showAdd ? 'Cancel' : '+ Add Variation'}
        </button>
      </div>

      {showAdd && (
        <div style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:16, marginBottom:12, background:'#fafafa' }}>
          <div style={{ marginBottom:12 }}>
            <label style={s.label}>Variation name *</label>
            <input value={newVariant.name} onChange={e=>setNewVariant(v=>({...v,name:e.target.value}))}
              placeholder="e.g. Size, Color, Material" style={s.input} />
          </div>

          <div style={{ marginBottom:10 }}>
            <label style={s.label}>Options</label>
            <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr auto', gap:8, marginBottom:8 }}>
              <input value={newOption.label} onChange={e=>setNewOption(o=>({...o,label:e.target.value}))}
                placeholder="Option label (e.g. Red, XL)" style={s.input} />
              <input type="number" value={newOption.priceModifier} onChange={e=>setNewOption(o=>({...o,priceModifier:Number(e.target.value)}))}
                placeholder="Price +/-" style={s.input} />
              <input type="number" value={newOption.stock} onChange={e=>setNewOption(o=>({...o,stock:Number(e.target.value)}))}
                placeholder="Stock" style={s.input} />
              <button onClick={addOption}
                style={{ padding:'9px 12px', background:'#059669', color:'#fff', border:'none', borderRadius:6, cursor:'pointer', fontSize:13 }}>
                Add
              </button>
            </div>
            {newVariant.options.length > 0 && (
              <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:10 }}>
                {newVariant.options.map((opt, i) => (
                  <div key={i} style={{ display:'flex', alignItems:'center', gap:4, background:'#eff6ff', border:'1px solid #bfdbfe', borderRadius:20, padding:'3px 10px', fontSize:13, color:'#1d4ed8' }}>
                    <span>{opt.label}</span>
                    {opt.priceModifier !== 0 && <span style={{fontSize:11}}>{opt.priceModifier > 0 ? '+' : ''}৳{opt.priceModifier}</span>}
                    <span style={{fontSize:11,color:'#6b7280'}}>({opt.stock} stock)</span>
                    <button onClick={()=>removeOption(i)} style={{ background:'none', border:'none', cursor:'pointer', color:'#ef4444', fontSize:16, padding:'0 0 0 4px', lineHeight:1 }}>×</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={() => { if(!newVariant.name||!newVariant.options.length) return alert('Add a name and at least one option'); addVariantMutation.mutate(newVariant); }}
            disabled={addVariantMutation.isPending}
            style={{ padding:'8px 16px', background:'#111827', color:'#fff', border:'none', borderRadius:6, cursor:'pointer', fontSize:13 }}>
            {addVariantMutation.isPending ? 'Saving...' : 'Save Variation'}
          </button>
        </div>
      )}

      {variants.map((variant, idx) => (
        <div key={idx} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:12, marginBottom:8, background:'#fff' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
            <span style={{ fontWeight:600, fontSize:14 }}>{variant.name}</span>
            <button onClick={()=>window.confirm(`Delete variation "${variant.name}"?`)&&deleteVariantMutation.mutate(idx)}
              style={{ padding:'3px 8px', background:'#fef2f2', color:'#dc2626', border:'1px solid #fecaca', borderRadius:6, cursor:'pointer', fontSize:12 }}>
              Delete
            </button>
          </div>
          <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
            {variant.options?.map((opt, oi) => (
              <span key={oi} style={{ padding:'4px 12px', background:'#f3f4f6', borderRadius:20, fontSize:13, color:'#374151' }}>
                {opt.label}
                {opt.priceModifier !== 0 && <span style={{marginLeft:4,color:opt.priceModifier>0?'#059669':'#dc2626',fontSize:11}}>{opt.priceModifier>0?'+':''}৳{opt.priceModifier}</span>}
                <span style={{marginLeft:4,fontSize:11,color:'#9ca3af'}}>·{opt.stock}</span>
              </span>
            ))}
          </div>
        </div>
      ))}

      {variants.length === 0 && !showAdd && (
        <p style={{ color:'#9ca3af', fontSize:13, fontStyle:'italic' }}>No variations added. Click "+ Add Variation" to create size, color, or other options.</p>
      )}
    </div>
  );
}

const s = {
  label: {display:'block',fontSize:13,fontWeight:600,marginBottom:6,color:'#374151'},
  input: {width:'100%',padding:'8px 10px',border:'1px solid #d1d5db',borderRadius:6,fontSize:13,outline:'none',boxSizing:'border-box',fontFamily:'inherit'},
};