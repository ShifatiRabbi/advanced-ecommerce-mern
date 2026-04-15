import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';

const SECTIONS = [
  {
    title: 'Colors',
    fields: [
      {k:'colorPrimary',   label:'Primary color',       type:'color', desc:'Main buttons, links, highlights'},
      {k:'colorSecondary', label:'Secondary color',     type:'color', desc:'Muted text, secondary elements'},
      {k:'colorAccent',    label:'Accent color',        type:'color', desc:'Badges, tags, special elements'},
      {k:'colorHover',     label:'Hover color',         type:'color', desc:'Button/link hover state'},
      {k:'colorSuccess',   label:'Success color',       type:'color', desc:'In stock, confirmed states'},
      {k:'colorDanger',    label:'Danger color',        type:'color', desc:'Errors, out of stock'},
      {k:'colorBackground',label:'Page background',     type:'color', desc:'Main page background'},
      {k:'colorSurface',   label:'Surface color',       type:'color', desc:'Cards, sidebars'},
      {k:'colorText',      label:'Primary text',        type:'color', desc:'Headings and body text'},
      {k:'colorTextMuted', label:'Muted text',          type:'color', desc:'Labels, placeholders'},
      {k:'colorBorder',    label:'Border color',        type:'color', desc:'Card and input borders'},
    ],
  },
  {
    title: 'Header & Footer',
    fields: [
      {k:'headerBg',        label:'Header background', type:'color'},
      {k:'headerTextColor', label:'Header text color', type:'color'},
      {k:'footerBg',        label:'Footer background', type:'color'},
      {k:'footerTextColor', label:'Footer text color', type:'color'},
    ],
  },
  {
    title: 'Buttons',
    fields: [
      {k:'btnRadius',     label:'Corner radius',  type:'text', ph:'8px',  desc:'e.g. 0px (square), 8px (rounded), 999px (pill)'},
      {k:'btnPaddingX',   label:'Horizontal pad', type:'text', ph:'20px', desc:'Left/right padding'},
      {k:'btnPaddingY',   label:'Vertical pad',   type:'text', ph:'10px', desc:'Top/bottom padding'},
      {k:'btnFontWeight', label:'Font weight',    type:'text', ph:'600',  desc:'400=normal, 600=semibold, 700=bold'},
      {k:'btnFontSize',   label:'Font size',      type:'text', ph:'14px'},
    ],
  },
  {
    title: 'Cards',
    fields: [
      {k:'cardRadius', label:'Card corner radius', type:'text', ph:'12px'},
      {k:'cardBorder', label:'Card border',        type:'text', ph:'1px solid #e5e7eb', desc:'CSS border shorthand'},
      {k:'cardShadow', label:'Card shadow',        type:'text', ph:'none', desc:'CSS box-shadow value'},
    ],
  },
  {
    title: 'Typography',
    fields: [
      {k:'fontFamily',  label:'Font family', type:'text', ph:'system-ui, sans-serif', desc:'Full CSS font-family value'},
      {k:'fontSizeBase',label:'Base font size', type:'text', ph:'16px'},
    ],
  },
  {
    title: 'Inputs & Forms',
    fields: [
      {k:'inputRadius', label:'Input corner radius', type:'text', ph:'8px'},
    ],
  },
];

export default function ThemeDesigner() {
  const qc = useQueryClient();

  const { data: savedTheme } = useQuery({
    queryKey: ['theme-admin'],
    queryFn:  () => api.get('/settings/theme').then(r=>r.data.data),
  });

  const [overrides, setOverrides] = useState({});
  const theme = { ...savedTheme, ...overrides };

  useEffect(() => {
    if (savedTheme) setOverrides({});
  }, [savedTheme]);

  const saveMutation = useMutation({
    mutationFn: (data) => api.put('/settings/theme', data),
    onSuccess:  () => { qc.invalidateQueries({ queryKey: ['theme-admin'] }); setOverrides({}); alert('Theme saved! Refresh your storefront to see changes.'); },
    onError:    (err) => alert(err.response?.data?.message || 'Save failed'),
  });

  const resetMutation = useMutation({
    mutationFn: () => api.post('/settings/theme/reset'),
    onSuccess:  () => { qc.invalidateQueries({ queryKey: ['theme-admin'] }); setOverrides({}); alert('Theme reset to defaults.'); },
  });

  const set = (k,v) => setOverrides(o=>({...o,[k]:v}));

  const hasChanges = Object.keys(overrides).length > 0;

  return (
    <div className="admin-page-theme-designer-theme-designer" id="admin-page-theme-designer-theme-designer">
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:20}}>
        <div>
          <h2 style={{margin:'0 0 4px',fontSize:20,fontWeight:700}}>Theme Designer</h2>
          <p style={{margin:0,fontSize:14,color:'#6b7280'}}>Control colors, typography, buttons, and cards globally.</p>
        </div>
        <div style={{display:'flex',gap:10}}>
          {hasChanges && (
            <span style={{fontSize:13,color:'#d97706',alignSelf:'center',fontWeight:600}}>Unsaved changes</span>
          )}
          <button onClick={()=>window.confirm('Reset all theme to defaults?')&&resetMutation.mutate()}
            style={{padding:'9px 16px',border:'1px solid #fecaca',background:'#fef2f2',color:'#dc2626',borderRadius:8,cursor:'pointer',fontSize:14}}>
            Reset to defaults
          </button>
          <button onClick={()=>saveMutation.mutate(theme)} disabled={saveMutation.isPending}
            style={{padding:'9px 20px',background:'#111827',color:'#fff',border:'none',borderRadius:8,cursor:'pointer',fontSize:14,fontWeight:600}}>
            {saveMutation.isPending ? 'Saving...' : 'Save Theme'}
          </button>
        </div>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 380px',gap:24,alignItems:'start'}}>
        <div>
          {SECTIONS.map(section=>(
            <div key={section.title} style={s.card}>
              <h3 style={s.cardTitle}>{section.title}</h3>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
                {section.fields.map(f=>(
                  <div key={f.k}>
                    <label style={s.label}>{f.label}</label>
                    {f.type==='color' ? (
                      <div style={{display:'flex',gap:8,alignItems:'center'}}>
                        <input type="color" value={theme[f.k]||'#000000'}
                          onChange={e=>set(f.k,e.target.value)}
                          style={{width:44,height:36,border:'1px solid #d1d5db',borderRadius:6,padding:2,cursor:'pointer',background:'#fff'}} />
                        <input type="text" value={theme[f.k]||''}
                          onChange={e=>set(f.k,e.target.value)}
                          style={{...s.input,flex:1,fontFamily:'monospace',fontSize:13}} />
                      </div>
                    ) : (
                      <input value={theme[f.k]||''} onChange={e=>set(f.k,e.target.value)}
                        placeholder={f.ph} style={s.input} />
                    )}
                    {f.desc && <p style={{fontSize:11,color:'#9ca3af',marginTop:4}}>{f.desc}</p>}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div style={{position:'sticky',top:20}}>
          <div style={s.card}>
            <h3 style={s.cardTitle}>Live Preview</h3>
            <div style={{fontFamily:theme.fontFamily,fontSize:theme.fontSizeBase,color:theme.colorText}}>

              <div style={{background:theme.headerBg,color:theme.headerTextColor,padding:'12px 16px',borderRadius:8,marginBottom:12,fontSize:14,fontWeight:600}}>
                Header · ShopBD
              </div>

              <div style={{marginBottom:12}}>
                <p style={{fontSize:11,color:'#9ca3af',marginBottom:8,textTransform:'uppercase',letterSpacing:'0.05em'}}>Buttons</p>
                <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                  <button style={{
                    background:theme.colorPrimary,color:'#fff',border:'none',
                    borderRadius:theme.btnRadius,padding:`${theme.btnPaddingY} ${theme.btnPaddingX}`,
                    fontSize:theme.btnFontSize,fontWeight:theme.btnFontWeight,cursor:'pointer',
                  }}>Primary button</button>
                  <button style={{
                    background:'transparent',color:theme.colorPrimary,border:`1px solid ${theme.colorPrimary}`,
                    borderRadius:theme.btnRadius,padding:`${theme.btnPaddingY} ${theme.btnPaddingX}`,
                    fontSize:theme.btnFontSize,fontWeight:theme.btnFontWeight,cursor:'pointer',
                  }}>Outline button</button>
                </div>
              </div>

              <div style={{marginBottom:12}}>
                <p style={{fontSize:11,color:'#9ca3af',marginBottom:8,textTransform:'uppercase',letterSpacing:'0.05em'}}>Product card</p>
                <div style={{border:theme.cardBorder,borderRadius:theme.cardRadius,overflow:'hidden',boxShadow:theme.cardShadow,background:theme.colorSurface,maxWidth:180}}>
                  <div style={{height:100,background:theme.colorBorder,display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,color:theme.colorTextMuted}}>
                    Product image
                  </div>
                  <div style={{padding:'10px 12px'}}>
                    <p style={{fontSize:13,fontWeight:600,margin:'0 0 4px',color:theme.colorText}}>Product name</p>
                    <p style={{fontSize:12,color:theme.colorTextMuted,margin:'0 0 8px'}}>Category</p>
                    <p style={{fontWeight:700,fontSize:15,margin:'0 0 8px',color:theme.colorPrimary}}>৳1,499</p>
                    <button style={{width:'100%',background:theme.colorPrimary,color:'#fff',border:'none',borderRadius:theme.btnRadius,padding:'7px',fontSize:13,fontWeight:theme.btnFontWeight,cursor:'pointer'}}>
                      Add to cart
                    </button>
                  </div>
                </div>
              </div>

              <div style={{marginBottom:12}}>
                <p style={{fontSize:11,color:'#9ca3af',marginBottom:8,textTransform:'uppercase',letterSpacing:'0.05em'}}>Typography</p>
                <p style={{fontFamily:theme.fontFamily,fontSize:theme.fontSizeBase,color:theme.colorText,margin:'0 0 4px',fontWeight:700}}>Heading text</p>
                <p style={{fontFamily:theme.fontFamily,fontSize:theme.fontSizeBase,color:theme.colorTextMuted,margin:0}}>Body text sample. This is how regular paragraph text will look.</p>
              </div>

              <div>
                <p style={{fontSize:11,color:'#9ca3af',marginBottom:8,textTransform:'uppercase',letterSpacing:'0.05em'}}>Input</p>
                <input placeholder="Input field preview" style={{
                  width:'100%',padding:'9px 12px',border:`1px solid ${theme.colorBorder}`,
                  borderRadius:theme.inputRadius,fontSize:14,boxSizing:'border-box',
                  color:theme.colorText,background:theme.colorBackground,
                }} readOnly />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const s = {
  card:      {background:'#fff',border:'1px solid #e5e7eb',borderRadius:10,padding:20,marginBottom:16},
  cardTitle: {fontSize:15,fontWeight:700,margin:'0 0 16px'},
  label:     {display:'block',fontSize:13,fontWeight:600,marginBottom:6,color:'#374151'},
  input:     {width:'100%',padding:'9px 12px',border:'1px solid #d1d5db',borderRadius:8,fontSize:14,outline:'none',boxSizing:'border-box',fontFamily:'inherit'},
};