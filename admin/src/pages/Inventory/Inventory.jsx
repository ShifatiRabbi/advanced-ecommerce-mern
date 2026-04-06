import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';

export default function Inventory() {
  const qc = useQueryClient();
  const [edits, setEdits] = useState({});
  const [threshold, setThreshold] = useState(20);

  const { data: summary } = useQuery({
    queryKey: ['inv-summary'],
    queryFn:  () => api.get('/inventory/summary').then(r => r.data.data),
  });

  const { data: lowStock, isLoading } = useQuery({
    queryKey: ['low-stock', threshold],
    queryFn:  () => api.get(`/inventory/low-stock?threshold=${threshold}`).then(r => r.data.data),
  });

  const bulkMutation = useMutation({
    mutationFn: (updates) => api.post('/inventory/bulk-update', { updates }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['low-stock'] });
      qc.invalidateQueries({ queryKey: ['inv-summary'] });
      setEdits({});
      alert('Stock updated successfully!');
    },
    onError: (err) => alert(err.response?.data?.message || 'Update failed'),
  });

  const changed = Object.entries(edits).map(([id,stock]) => ({ id, stock: Number(stock) }));

  const SUMMARY_CARDS = [
    {label:'Total products', key:'total',      bg:'#f1f5f9',color:'#334155'},
    {label:'Out of stock',   key:'outOfStock',  bg:'#fee2e2',color:'#991b1b'},
    {label:'Low stock',      key:'lowStock',    bg:'#fef9c3',color:'#854d0e'},
    {label:'Healthy',        key:'healthy',     bg:'#dcfce7',color:'#166534'},
  ];

  return (
    <div>
      <h2 style={{margin:'0 0 20px',fontSize:20,fontWeight:700}}>Inventory</h2>

      {summary && (
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:16,marginBottom:24}}>
          {SUMMARY_CARDS.map(c=>(
            <div key={c.key} style={{borderRadius:10,padding:'16px 20px',background:c.bg}}>
              <p style={{fontSize:28,fontWeight:700,margin:'0 0 4px',color:c.color}}>{summary[c.key]}</p>
              <p style={{fontSize:13,margin:0,color:c.color}}>{c.label}</p>
            </div>
          ))}
        </div>
      )}

      <div style={{background:'#fff',border:'1px solid #e5e7eb',borderRadius:10,padding:20}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
          <div style={{display:'flex',alignItems:'center',gap:12}}>
            <h3 style={{margin:0,fontSize:15}}>Low stock items</h3>
            <div style={{display:'flex',alignItems:'center',gap:6,fontSize:13}}>
              <label>Threshold:</label>
              <input type="number" value={threshold} onChange={e=>setThreshold(Number(e.target.value))}
                style={{width:60,padding:'4px 8px',border:'1px solid #d1d5db',borderRadius:6,fontSize:13}} />
            </div>
          </div>
          {changed.length > 0 && (
            <button onClick={()=>bulkMutation.mutate(changed)} disabled={bulkMutation.isPending}
              style={{padding:'8px 16px',background:'#059669',color:'#fff',border:'none',borderRadius:8,cursor:'pointer',fontSize:14,fontWeight:600}}>
              {bulkMutation.isPending ? 'Saving...' : `Save ${changed.length} change(s)`}
            </button>
          )}
        </div>

        {isLoading ? <p>Loading...</p> : (
          <table style={{width:'100%',borderCollapse:'collapse',fontSize:14}}>
            <thead><tr style={{borderBottom:'2px solid #f3f4f6',textAlign:'left',background:'#f9fafb'}}>
              {['Product','Category','SKU','Current stock','New stock','Adjust'].map(h=>(
                <th key={h} style={{padding:'10px 12px',fontWeight:600,color:'#6b7280',fontSize:13}}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {lowStock?.map(p=>(
                <tr key={p._id} style={{borderBottom:'1px solid #f3f4f6'}}>
                  <td style={{padding:'12px'}}>
                    <div style={{display:'flex',alignItems:'center',gap:10}}>
                      {p.images?.[0]&&<img src={p.images[0].url} alt="" style={{width:36,height:36,objectFit:'cover',borderRadius:6}}/>}
                      <span style={{fontWeight:600}}>{p.name}</span>
                    </div>
                  </td>
                  <td style={{padding:'12px',color:'#6b7280'}}>{p.category?.name||'—'}</td>
                  <td style={{padding:'12px',fontFamily:'monospace',fontSize:12,color:'#9ca3af'}}>{p.sku||'—'}</td>
                  <td style={{padding:'12px'}}>
                    <span style={{fontWeight:700,color:p.stock===0?'#dc2626':p.stock<=5?'#d97706':'#374151'}}>{p.stock}</span>
                  </td>
                  <td style={{padding:'12px'}}>
                    <input type="number" min="0"
                      value={edits[p._id]!==undefined?edits[p._id]:p.stock}
                      onChange={e=>setEdits(prev=>({...prev,[p._id]:e.target.value}))}
                      style={{width:80,padding:'6px 8px',border:'1px solid #d1d5db',borderRadius:6,fontSize:14,
                        background:edits[p._id]!==undefined?'#fffbeb':'#fff'}} />
                  </td>
                  <td style={{padding:'12px'}}>
                    <div style={{display:'flex',gap:6}}>
                      <button onClick={()=>api.patch(`/inventory/${p._id}/adjust`,{delta:10,reason:'manual add'}).then(()=>{qc.invalidateQueries({queryKey:['low-stock']});})}
                        style={{padding:'4px 8px',background:'#d1fae5',color:'#065f46',border:'1px solid #a7f3d0',borderRadius:6,cursor:'pointer',fontSize:12}}>+10</button>
                      <button onClick={()=>api.patch(`/inventory/${p._id}/adjust`,{delta:50,reason:'restock'}).then(()=>{qc.invalidateQueries({queryKey:['low-stock']});})}
                        style={{padding:'4px 8px',background:'#dbeafe',color:'#1d4ed8',border:'1px solid #bfdbfe',borderRadius:6,cursor:'pointer',fontSize:12}}>+50</button>
                    </div>
                  </td>
                </tr>
              ))}
              {lowStock?.length===0&&<tr><td colSpan={6} style={{padding:20,textAlign:'center',color:'#9ca3af'}}>No items below threshold {threshold}</td></tr>}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}