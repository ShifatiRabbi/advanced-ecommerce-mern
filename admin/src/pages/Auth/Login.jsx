import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import api from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { setAccessToken } from '../../services/api';

export default function Login() {
  const navigate = useNavigate();
  const { setUser } = useAuthStore();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');

  const mutation = useMutation({
    mutationFn: (data) => api.post('/auth/login', data),
    onSuccess: (res) => {
      const { user, accessToken } = res.data.data;
      if (user.role !== 'admin' && user.role !== 'employee') {
        setError('Access denied. Admin accounts only.');
        return;
      }
      setAccessToken(accessToken);
      setUser(user);
      navigate('/dashboard');
    },
    onError: (err) => setError(err.response?.data?.message || 'Login failed'),
  });

  return (
    <div style={s.page}>
      <div style={s.card}>
        <h1 style={s.title}>ShopAdmin</h1>
        <p style={s.sub}>Sign in to your account</p>
        {error && <div style={s.error}>{error}</div>}
        <div style={s.field}>
          <label style={s.label}>Email</label>
          <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            style={s.input} placeholder="admin@gmail.com" autoFocus />
        </div>
        <div style={s.field}>
          <label style={s.label}>Password</label>
          <input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
            style={s.input} placeholder="••••••••"
            onKeyDown={e => e.key === 'Enter' && mutation.mutate(form)} />
        </div>
        <button onClick={() => mutation.mutate(form)} disabled={mutation.isPending} style={s.btn}>
          {mutation.isPending ? 'Signing in...' : 'Sign in'}
        </button>
      </div>
    </div>
  );
}

const s = {
  page:  { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8f9fa' },
  card:  { background: '#fff', borderRadius: 12, padding: '40px 36px', width: 360, border: '1px solid #eee' },
  title: { fontSize: 22, fontWeight: 700, margin: '0 0 4px', textAlign: 'center' },
  sub:   { fontSize: 14, color: '#888', textAlign: 'center', margin: '0 0 28px' },
  error: { background: '#fee2e2', color: '#991b1b', padding: '10px 14px', borderRadius: 8, fontSize: 14, marginBottom: 16 },
  field: { marginBottom: 16 },
  label: { display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 },
  input: { width: '100%', padding: '10px 12px', border: '1px solid #e2e2e2', borderRadius: 8, fontSize: 14, boxSizing: 'border-box', outline: 'none' },
  btn:   { width: '100%', padding: 12, background: '#111', color: '#fff', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: 'pointer', marginTop: 4 },
};