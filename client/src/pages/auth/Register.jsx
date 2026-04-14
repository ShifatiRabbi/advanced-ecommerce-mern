import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation }       from '@tanstack/react-query';
import api, { setAccessToken } from '../services/api';
import { useAuthStore }      from '../store/authStore';

export default function Register() {
  const navigate    = useNavigate();
  const { setUser } = useAuthStore();
  const [form, setForm]   = useState({ name:'', email:'', phone:'', password:'', confirm:'' });
  const [errors, setErrors] = useState({});

  const mutation = useMutation({
    mutationFn: (data) => api.post('/auth/register', data),
    onSuccess: (res) => {
      const { user, accessToken } = res.data.data || {};
      if (accessToken) { setAccessToken(accessToken); setUser(user); navigate('/'); }
      else navigate('/login?registered=1');
    },
    onError: (err) => {
      const msg = err.response?.data?.message || 'Registration failed';
      setErrors({ submit: msg });
    },
  });

  const validate = () => {
    const e = {};
    if (!form.name.trim())      e.name     = 'Full name is required';
    if (!form.email.trim())     e.email    = 'Email is required';
    if (form.password.length<8) e.password = 'Password must be at least 8 characters';
    if (form.password !== form.confirm) e.confirm = 'Passwords do not match';
    return e;
  };

  const handleSubmit = (e) => {
    e?.preventDefault?.();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    const { confirm, ...data } = form;
    mutation.mutate(data);
  };

  const set = (k,v) => { setForm(f=>({...f,[k]:v})); setErrors(e=>{const n={...e};delete n[k];delete n.submit;return n;}); };

  return (
    <div style={s.page} className="client-page-auth-register" id="client-page-auth-register">
      <div style={s.card}>
        <h1 style={s.title}>Create account</h1>
        <p style={s.sub}>Join us — it's free!</p>

        {errors.submit && <div style={s.errorBox}>{errors.submit}</div>}

        {[
          {k:'name',    label:'Full name',        type:'text',     ph:'Your name'},
          {k:'email',   label:'Email address',    type:'email',    ph:'you@example.com'},
          {k:'phone',   label:'Phone (optional)', type:'tel',      ph:'01XXXXXXXXX'},
          {k:'password',label:'Password',         type:'password', ph:'Min 8 characters'},
          {k:'confirm', label:'Confirm password', type:'password', ph:'Repeat password'},
        ].map(f=>(
          <div key={f.k} style={s.field}>
            <label style={s.label}>{f.label}</label>
            <input type={f.type} value={form[f.k]} onChange={e=>set(f.k,e.target.value)}
              placeholder={f.ph} onKeyDown={e=>e.key==='Enter'&&handleSubmit()}
              style={{...s.input,...(errors[f.k]&&{borderColor:'#ef4444'})}} />
            {errors[f.k] && <p style={s.err}>{errors[f.k]}</p>}
          </div>
        ))}

        <button onClick={handleSubmit} disabled={mutation.isPending} style={s.btn}>
          {mutation.isPending ? 'Creating account...' : 'Create Account'}
        </button>

        <p style={s.switchLine}>
          Already have an account? <Link to="/login" style={s.link}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}

const s = {
  page:       {minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',padding:24,background:'#f9fafb'},
  card:       {background:'#fff',borderRadius:12,padding:'40px 36px',width:400,border:'1px solid #e5e7eb'},
  title:      {fontSize:24,fontWeight:800,margin:'0 0 4px'},
  sub:        {fontSize:14,color:'#6b7280',margin:'0 0 24px'},
  errorBox:   {background:'#fef2f2',color:'#dc2626',padding:'10px 14px',borderRadius:8,fontSize:14,marginBottom:16,border:'1px solid #fecaca'},
  field:      {marginBottom:14},
  label:      {display:'block',fontSize:13,fontWeight:600,marginBottom:5,color:'#374151'},
  input:      {width:'100%',padding:'10px 12px',border:'1px solid #d1d5db',borderRadius:8,fontSize:14,outline:'none',boxSizing:'border-box',fontFamily:'inherit'},
  err:        {fontSize:12,color:'#dc2626',marginTop:4},
  btn:        {width:'100%',padding:12,background:'#111827',color:'#fff',border:'none',borderRadius:8,fontSize:15,fontWeight:600,cursor:'pointer',marginTop:4},
  switchLine: {fontSize:14,color:'#6b7280',textAlign:'center',marginTop:16},
  link:       {color:'#111827',fontWeight:600,textDecoration:'none'},
};