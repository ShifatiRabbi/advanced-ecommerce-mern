import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';

const ROLES = ['manager', 'support', 'content'];
const PERMISSION_TEMPLATES = {
  manager: ['orders:read','orders:write','products:read','products:write','customers:read','inventory:write'],
  support: ['orders:read','customers:read','orders:write'],
  content: ['products:read','products:write','blog:write'],
};

const empty = { name:'', email:'', password:'', role:'support' };

export default function Employees() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm]         = useState(empty);
  const [errors, setErrors]     = useState({});

  const { data: employees, isLoading } = useQuery({
    queryKey: ['employees'],
    queryFn:  () => api.get('/employees').then(r => r.data.data),
  });

  const createMutation = useMutation({
    mutationFn: (data) => api.post('/employees', { ...data, permissions: PERMISSION_TEMPLATES[data.role] }),
    onSuccess:  () => { qc.invalidateQueries({ queryKey: ['employees'] }); setShowForm(false); setForm(empty); },
    onError:    (err) => { const msg = err.response?.data?.message || 'Failed'; alert(msg); },
  });

  const toggleMutation = useMutation({
    mutationFn: (id) => api.patch(`/employees/${id}/toggle`),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['employees'] }),
  });

  const set = (k,v) => { setForm(f=>({...f,[k]:v})); setErrors(e=>{const n={...e};delete n[k];return n;}); };

  const handleCreate = () => {
    const errs = {};
    if (!form.name.trim())  errs.name     = 'Required';
    if (!form.email.trim()) errs.email    = 'Required';
    if (!form.password)     errs.password = 'Required';
    if (Object.keys(errs).length) { setErrors(errs); return; }
    createMutation.mutate(form);
  };

  return (
    <div className="admin-page-employees-employees" id="admin-page-employees-employees">
      <div style={s.topRow}>
        <h2 style={s.h2}>Employees ({employees?.length ?? 0})</h2>
        <button onClick={() => setShowForm(v=>!v)} style={s.addBtn}>
          {showForm ? 'Cancel' : '+ Add Employee'}
        </button>
      </div>

      {showForm && (
        <div style={s.formCard}>
          <h3 style={s.h3}>New employee account</h3>
          <div style={s.grid3}>
            {[
              {k:'name',     label:'Full name *',   type:'text',     ph:'John Doe'},
              {k:'email',    label:'Email *',        type:'email',    ph:'john@shop.com'},
              {k:'password', label:'Password *',     type:'password', ph:'Min 8 chars'},
            ].map(f=>(
              <div key={f.k}>
                <label style={s.label}>{f.label}</label>
                <input type={f.type} value={form[f.k]} onChange={e=>set(f.k,e.target.value)}
                  placeholder={f.ph} style={{...s.input,...(errors[f.k]&&{borderColor:'#ef4444'})}} />
                {errors[f.k] && <p style={s.errTxt}>{errors[f.k]}</p>}
              </div>
            ))}
          </div>
          <div style={{marginBottom:16}}>
            <label style={s.label}>Role</label>
            <select value={form.role} onChange={e=>set('role',e.target.value)} style={s.input}>
              {ROLES.map(r=><option key={r} value={r}>{r.charAt(0).toUpperCase()+r.slice(1)}</option>)}
            </select>
          </div>
          <div style={{marginBottom:16,padding:'10px 14px',background:'#f9fafb',borderRadius:8,fontSize:13,color:'#6b7280'}}>
            Permissions for <strong>{form.role}</strong>: {PERMISSION_TEMPLATES[form.role]?.join(' · ')}
          </div>
          <button onClick={handleCreate} disabled={createMutation.isPending} style={s.addBtn}>
            {createMutation.isPending ? 'Creating...' : 'Create Employee'}
          </button>
        </div>
      )}

      {isLoading ? <p style={{padding:20}}>Loading...</p> : (
        <div style={s.tableWrap}>
          <table style={s.table}>
            <thead><tr style={s.thead}>
              {['Name','Email','Role','Permissions','Status','Actions'].map(h=>(
                <th key={h} style={s.th}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {employees?.map(emp=>(
                <tr key={emp._id} style={s.tr}>
                  <td style={s.td}><strong>{emp.name}</strong></td>
                  <td style={{...s.td,color:'#6b7280'}}>{emp.email}</td>
                  <td style={s.td}>
                    <span style={{...s.pill,background:'#eff6ff',color:'#1d4ed8'}}>{emp.role}</span>
                  </td>
                  <td style={{...s.td,fontSize:12,color:'#9ca3af',maxWidth:200}}>
                    {emp.permissions?.slice(0,3).join(', ')}{emp.permissions?.length>3?'...':''}
                  </td>
                  <td style={s.td}>
                    <span style={{...s.pill,background:emp.isActive?'#d1fae5':'#fee2e2',color:emp.isActive?'#065f46':'#991b1b'}}>
                      {emp.isActive?'Active':'Blocked'}
                    </span>
                  </td>
                  <td style={s.td}>
                    <button onClick={()=>toggleMutation.mutate(emp._id)}
                      style={{padding:'4px 10px',border:'1px solid #d1d5db',borderRadius:6,background:'#fff',cursor:'pointer',fontSize:12}}>
                      {emp.isActive?'Block':'Unblock'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const s = {
  topRow:   {display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20},
  h2:       {fontSize:20,fontWeight:700,margin:0},
  h3:       {fontSize:15,fontWeight:700,margin:'0 0 16px'},
  addBtn:   {padding:'8px 16px',background:'#111827',color:'#fff',border:'none',borderRadius:8,cursor:'pointer',fontSize:14,fontWeight:600},
  formCard: {background:'#fff',border:'1px solid #e5e7eb',borderRadius:10,padding:20,marginBottom:20},
  grid3:    {display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:14,marginBottom:16},
  label:    {display:'block',fontSize:13,fontWeight:600,marginBottom:6,color:'#374151'},
  input:    {width:'100%',padding:'9px 12px',border:'1px solid #d1d5db',borderRadius:8,fontSize:14,outline:'none',boxSizing:'border-box',fontFamily:'inherit'},
  errTxt:   {fontSize:12,color:'#dc2626',marginTop:4},
  tableWrap:{background:'#fff',border:'1px solid #e5e7eb',borderRadius:10,overflow:'hidden'},
  table:    {width:'100%',borderCollapse:'collapse',fontSize:14},
  thead:    {borderBottom:'2px solid #f3f4f6',textAlign:'left',background:'#f9fafb'},
  th:       {padding:'12px 14px',fontWeight:600,color:'#6b7280',fontSize:13},
  tr:       {borderBottom:'1px solid #f3f4f6'},
  td:       {padding:'12px 14px',verticalAlign:'middle'},
  pill:     {padding:'3px 8px',borderRadius:12,fontSize:12,fontWeight:600},
};