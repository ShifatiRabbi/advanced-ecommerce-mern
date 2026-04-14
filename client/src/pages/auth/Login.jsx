import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import api, { setAccessToken } from '../../services/api';
import { useAuthStore } from '../../store/authStore';

export default function Login() {
  const navigate    = useNavigate();
  const [params]    = useSearchParams();
  const { setUser } = useAuthStore();
  const [form, setForm]   = useState({ email:'', password:'' });
  const [error, setError] = useState('');

  const mutation = useMutation({
    mutationFn: (data) => api.post('/auth/login', data),
    onSuccess: (res) => {
      const { user, accessToken } = res.data.data;
      setAccessToken(accessToken);
      setUser(user);
      if (user.role === 'admin' || user.role === 'employee') {
        window.location.href = 'http://localhost:3001/dashboard';
      } else {
        navigate('/');
      }
    },
    onError: (err) => setError(err.response?.data?.message || 'Login failed'),
  });

  const set = (k,v) => { setForm(f=>({...f,[k]:v})); setError(''); };

  return (
    <div style={s.page} className="client-page-auth-login" id="client-page-auth-login">
      <div style={s.card}>
        <h1 style={s.title}>Welcome back</h1>
        <p style={s.sub}>Sign in to your account</p>

        {params.get('registered') && (
          <div style={{...s.errorBox, background:'#d1fae5', color:'#065f46', border:'1px solid #a7f3d0'}}>
            Account created! Please sign in.
          </div>
        )}
        {error && <div style={s.errorBox}>{error}</div>}

        {[
          {k:'email',    label:'Email',    type:'email',    ph:'you@example.com'},
          {k:'password', label:'Password', type:'password', ph:'Your password'},
        ].map(f=>(
          <div key={f.k} style={s.field}>
            <label style={s.label}>{f.label}</label>
            <input type={f.type} value={form[f.k]} onChange={e=>set(f.k,e.target.value)}
              placeholder={f.ph} onKeyDown={e=>e.key==='Enter'&&mutation.mutate(form)}
              style={s.input} autoFocus={f.k==='email'} />
          </div>
        ))}

        <div style={{textAlign:'right',marginBottom:16}}>
          <Link to="/forgot-password" style={{fontSize:13,color:'#6b7280',textDecoration:'none'}}>Forgot password?</Link>
        </div>

        <button onClick={()=>mutation.mutate(form)} disabled={mutation.isPending} style={s.btn}>
          {mutation.isPending ? 'Signing in...' : 'Sign In'}
        </button>

        <p style={s.switchLine}>
          Don't have an account? <Link to="/register" style={s.link}>Register</Link>
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
  btn:        {width:'100%',padding:12,background:'#111827',color:'#fff',border:'none',borderRadius:8,fontSize:15,fontWeight:600,cursor:'pointer'},
  switchLine: {fontSize:14,color:'#6b7280',textAlign:'center',marginTop:16},
  link:       {color:'#111827',fontWeight:600,textDecoration:'none'},
};