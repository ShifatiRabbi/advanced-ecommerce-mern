import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';

const PAGES = [
  { key:'about',   label:'About Us',          hasExtra:false },
  { key:'privacy', label:'Privacy Policy',    hasExtra:false },
  { key:'terms',   label:'Terms & Conditions',hasExtra:false },
  { key:'contact', label:'Contact Page',      hasExtra:true  },
];

export default function PageManager() {
  const qc = useQueryClient();
  const [activeKey, setActiveKey] = useState('about');

  const { data: page, isLoading } = useQuery({
    queryKey: ['admin-page', activeKey],
    queryFn:  () => api.get(`/pages/${activeKey}`).then(r=>r.data.data),
  });

  const [form, setForm]     = useState({});
  const [extraForm, setExtra] = useState({});

  const merged = { ...page, ...form };
  const mergedExtra = { ...page?.extra, ...extraForm };

  const saveMutation = useMutation({
    mutationFn: (data) => api.put(`/pages/${activeKey}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-page', activeKey] });
      alert('Page saved!');
    },
    onError: (err) => alert(err.response?.data?.message || 'Save failed'),
  });

  const handleSave = () => {
    saveMutation.mutate({
      title:     merged.title,
      content:   merged.content,
      metaTitle: merged.metaTitle,
      metaDesc:  merged.metaDesc,
      isActive:  merged.isActive !== false,
      extra:     mergedExtra,
    });
  };

  const set = (k,v)      => setForm(f=>({...f,[k]:v}));
  const setEx = (k,v)    => setExtra(f=>({...f,[k]:v}));
  const setSocial = (k,v)=> setExtra(f=>({...f, socials:{...f.socials,...page?.extra?.socials,[k]:v}}));

  const current = PAGES.find(p=>p.key===activeKey);

  return (
    <div>
      <h2 style={{margin:'0 0 20px',fontSize:20,fontWeight:700}}>Page Manager</h2>

      <div style={{display:'flex',gap:8,marginBottom:24,flexWrap:'wrap'}}>
        {PAGES.map(p=>(
          <button key={p.key} onClick={()=>{ setActiveKey(p.key); setForm({}); setExtra({}); }}
            style={{padding:'8px 18px',border:'1px solid #e5e7eb',borderRadius:20,background:activeKey===p.key?'#111827':'#fff',color:activeKey===p.key?'#fff':'#374151',cursor:'pointer',fontSize:14,fontWeight:activeKey===p.key?600:400}}>
            {p.label}
          </button>
        ))}
      </div>

      {isLoading ? <p>Loading...</p> : (
        <div style={{display:'grid',gridTemplateColumns:'1fr 360px',gap:20,alignItems:'start'}}>
          <div>
            <div style={s.card}>
              <h3 style={s.cardTitle}>Page content for: {current?.label}</h3>
              <div style={{marginBottom:16}}>
                <label style={s.label}>Page title</label>
                <input value={merged.title||''} onChange={e=>set('title',e.target.value)} style={s.input} />
              </div>
              <div style={{marginBottom:16}}>
                <label style={s.label}>Content (HTML supported)</label>
                <div style={{marginBottom:6,fontSize:12,color:'#9ca3af'}}>
                  You can use HTML tags like &lt;h2&gt;, &lt;p&gt;, &lt;ul&gt;, &lt;strong&gt;, &lt;a href=""&gt;, etc.
                </div>
                <textarea
                  value={merged.content||''}
                  onChange={e=>set('content',e.target.value)}
                  rows={16}
                  placeholder={`<h2>Heading</h2>\n<p>Your content here...</p>\n<ul>\n  <li>Point 1</li>\n  <li>Point 2</li>\n</ul>`}
                  style={{...s.input,height:320,resize:'vertical',fontFamily:'monospace',fontSize:13}} />
              </div>
              <div style={{background:'#f9fafb',borderRadius:8,padding:14,border:'1px solid #e5e7eb'}}>
                <p style={{fontSize:13,fontWeight:700,marginBottom:10,color:'#374151'}}>Live preview</p>
                <div dangerouslySetInnerHTML={{__html:merged.content||'<p style="color:#9ca3af">No content yet.</p>'}}
                  style={{lineHeight:1.8,fontSize:14,color:'#374151',maxHeight:200,overflow:'auto'}} />
              </div>
            </div>
          </div>

          <div>
            <div style={s.card}>
              <h3 style={s.cardTitle}>SEO meta</h3>
              <div style={{marginBottom:12}}>
                <label style={s.label}>Meta title</label>
                <input value={merged.metaTitle||''} onChange={e=>set('metaTitle',e.target.value)}
                  placeholder={merged.title} style={s.input} />
              </div>
              <div style={{marginBottom:0}}>
                <label style={s.label}>Meta description</label>
                <textarea value={merged.metaDesc||''} onChange={e=>set('metaDesc',e.target.value)}
                  placeholder="160 char description..." rows={3} style={{...s.input,height:70,resize:'vertical'}} />
              </div>
            </div>

            {current?.hasExtra && (
              <div style={s.card}>
                <h3 style={s.cardTitle}>Contact details</h3>
                {[
                  {k:'phone',   label:'Phone number',  ph:'01700-000000'},
                  {k:'email',   label:'Email address', ph:'support@shopbd.com'},
                  {k:'address', label:'Address',       ph:'Dhaka, Bangladesh'},
                ].map(f=>(
                  <div key={f.k} style={{marginBottom:12}}>
                    <label style={s.label}>{f.label}</label>
                    <input value={mergedExtra[f.k]||''} onChange={e=>setEx(f.k,e.target.value)}
                      placeholder={f.ph} style={s.input} />
                  </div>
                ))}
                <div style={{marginBottom:12}}>
                  <label style={s.label}>Google Maps embed URL</label>
                  <textarea value={mergedExtra.mapEmbed||''} onChange={e=>setEx('mapEmbed',e.target.value)}
                    placeholder="Paste the src URL from Google Maps embed iframe"
                    rows={2} style={{...s.input,height:60,resize:'vertical',fontSize:12}} />
                  <p style={{fontSize:11,color:'#9ca3af',marginTop:4}}>
                    In Google Maps → Share → Embed a map → copy only the src="..." URL
                  </p>
                </div>

                <div style={{marginTop:4}}>
                  <label style={s.label}>Social media links</label>
                  {['facebook','instagram','youtube','twitter','tiktok'].map(platform=>(
                    <div key={platform} style={{display:'flex',alignItems:'center',gap:8,marginBottom:8}}>
                      <span style={{width:72,fontSize:13,textTransform:'capitalize',color:'#374151'}}>{platform}</span>
                      <input value={mergedExtra.socials?.[platform]||''} onChange={e=>setSocial(platform,e.target.value)}
                        placeholder={`https://${platform}.com/yourpage`}
                        style={{...s.input,flex:1,fontSize:12}} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button onClick={handleSave} disabled={saveMutation.isPending}
              style={{width:'100%',padding:14,background:'#111827',color:'#fff',border:'none',borderRadius:8,fontSize:15,fontWeight:600,cursor:'pointer'}}>
              {saveMutation.isPending ? 'Saving...' : `Save ${current?.label}`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const s = {
  card:      {background:'#fff',border:'1px solid #e5e7eb',borderRadius:10,padding:20,marginBottom:16},
  cardTitle: {fontSize:15,fontWeight:700,margin:'0 0 16px'},
  label:     {display:'block',fontSize:13,fontWeight:600,marginBottom:6,color:'#374151'},
  input:     {width:'100%',padding:'9px 12px',border:'1px solid #d1d5db',borderRadius:8,fontSize:14,outline:'none',boxSizing:'border-box',fontFamily:'inherit'},
};