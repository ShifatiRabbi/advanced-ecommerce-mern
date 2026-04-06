import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';

export default function CustomCode() {
  const qc = useQueryClient();
  const [tab, setTab] = useState('css');

  const { data } = useQuery({
    queryKey: ['custom-code'],
    queryFn:  () => api.get('/settings/custom-code').then(r=>r.data.data),
  });

  const [css, setCss]             = useState('');
  const [js, setJs]               = useState('');
  const [headerScripts, setHeader] = useState('');

  useEffect(() => {
    if (data) { setCss(data.customCss||''); setJs(data.customJs||''); setHeader(data.headerScripts||''); }
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: (payload) => api.put('/settings/custom-code', payload),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['custom-code'] }); alert('Code saved! It will be injected on next page load.'); },
    onError: (err) => alert(err.response?.data?.message || 'Save failed'),
  });

  const handleSave = () => saveMutation.mutate({ customCss: css, customJs: js, headerScripts });

  const TABS = [
    { key:'css',    label:'Custom CSS',      desc:'Injected into <head> as <style> — applies globally with highest specificity.' },
    { key:'js',     label:'Custom JS',       desc:'Injected before </body> — runs after page load. Use for tracking pixels, chat widgets, etc.' },
    { key:'header', label:'Header scripts',  desc:'Raw HTML injected into <head> — use for meta tags, external CDN scripts, etc.' },
  ];

  const current = TABS.find(t=>t.key===tab);

  return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:20}}>
        <div>
          <h2 style={{margin:'0 0 4px',fontSize:20,fontWeight:700}}>Custom Code Injection</h2>
          <p style={{margin:0,fontSize:14,color:'#6b7280'}}>Add global CSS, JavaScript, or head scripts sitewide.</p>
        </div>
        <button onClick={handleSave} disabled={saveMutation.isPending}
          style={{padding:'10px 24px',background:'#111827',color:'#fff',border:'none',borderRadius:8,cursor:'pointer',fontSize:14,fontWeight:600}}>
          {saveMutation.isPending ? 'Saving...' : 'Save All Code'}
        </button>
      </div>

      <div style={{background:'#fef9c3',border:'1px solid #fde68a',borderRadius:8,padding:'10px 14px',marginBottom:20,fontSize:13,color:'#854d0e'}}>
        Warning: Invalid CSS or JS can break your storefront. Test changes carefully. Custom code runs with top priority.
      </div>

      <div style={{display:'flex',gap:4,marginBottom:20}}>
        {TABS.map(t=>(
          <button key={t.key} onClick={()=>setTab(t.key)}
            style={{padding:'8px 18px',border:'1px solid #e5e7eb',borderRadius:20,background:tab===t.key?'#111827':'#fff',color:tab===t.key?'#fff':'#374151',cursor:'pointer',fontSize:14}}>
            {t.label}
          </button>
        ))}
      </div>

      <div style={{background:'#fff',border:'1px solid #e5e7eb',borderRadius:10,padding:24}}>
        <p style={{margin:'0 0 16px',fontSize:13,color:'#6b7280'}}>{current?.desc}</p>

        {tab === 'css' && (
          <>
            <div style={{marginBottom:12,fontSize:12,color:'#9ca3af',fontFamily:'monospace'}}>
              /* Example: change primary button color */<br/>
              .btn-primary {"{"} background: #e53e3e !important; {"}"}
            </div>
            <textarea value={css} onChange={e=>setCss(e.target.value)} spellCheck={false}
              placeholder={`/* Your custom CSS here */\n\n:root {\n  --color-primary: #e53e3e;\n}\n\n.product-card {\n  border-radius: 16px;\n}`}
              style={s.codeArea} />
          </>
        )}

        {tab === 'js' && (
          <>
            <div style={{marginBottom:12,fontSize:12,color:'#9ca3af',fontFamily:'monospace'}}>
              // Example: console log on every page load<br/>
              console.log('ShopBD loaded');
            </div>
            <textarea value={js} onChange={e=>setJs(e.target.value)} spellCheck={false}
              placeholder={`// Your custom JavaScript here\n// This runs after the page loads\n\ndocument.addEventListener('DOMContentLoaded', function() {\n  // your code\n});`}
              style={s.codeArea} />
          </>
        )}

        {tab === 'header' && (
          <>
            <div style={{marginBottom:12,fontSize:12,color:'#9ca3af',fontFamily:'monospace'}}>
              &lt;!-- Example: add external font --&gt;<br/>
              &lt;link href="https://fonts.googleapis.com/css2?family=Hind+Siliguri" rel="stylesheet"&gt;
            </div>
            <textarea value={headerScripts} onChange={e=>setHeader(e.target.value)} spellCheck={false}
              placeholder={`<!-- Raw HTML for <head> -->\n<link rel="preconnect" href="https://fonts.googleapis.com">\n<script async src="https://example.com/widget.js"></script>`}
              style={s.codeArea} />
          </>
        )}

        <div style={{marginTop:16,display:'flex',gap:12}}>
          <button onClick={handleSave} disabled={saveMutation.isPending}
            style={{padding:'10px 24px',background:'#111827',color:'#fff',border:'none',borderRadius:8,cursor:'pointer',fontSize:14,fontWeight:600}}>
            {saveMutation.isPending ? 'Saving...' : 'Save & Apply'}
          </button>
          <button onClick={()=>{if(window.confirm('Clear this code block?')){tab==='css'?setCss(''):tab==='js'?setJs(''):setHeader('');}}}
            style={{padding:'10px 18px',background:'#fff',color:'#dc2626',border:'1px solid #fecaca',borderRadius:8,cursor:'pointer',fontSize:14}}>
            Clear
          </button>
        </div>
      </div>
    </div>
  );
}

const s = {
  codeArea: {
    width:'100%',height:360,padding:'12px 14px',border:'1px solid #d1d5db',borderRadius:8,
    fontSize:13,fontFamily:'monospace',outline:'none',resize:'vertical',
    boxSizing:'border-box',background:'#1e1e1e',color:'#d4d4d4',lineHeight:1.7,
  },
};