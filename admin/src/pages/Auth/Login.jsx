import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import api, { setAccessToken } from '../../services/api';
import { useAuthStore } from '../../store/authStore';

export default function Login() {
  const navigate    = useNavigate();
  const { setUser } = useAuthStore();
  const [form, setForm]   = useState({ email: 'admin@gmail.com', password: 'admin' });
  const [error, setError] = useState('');

  const mutation = useMutation({
    mutationFn: (data) => api.post('/auth/login', data),
    onSuccess: (res) => {
      const { user, accessToken } = res.data.data;
      if (user.role !== 'admin' && user.role !== 'employee') {
        setError('Access denied. Admin/employee accounts only.');
        return;
      }
      setAccessToken(accessToken);
      setUser(user);
      navigate('/dashboard');
    },
    onError: (err) => setError(err.response?.data?.message || 'Login failed'),
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div style={s.page} className="admin-page-auth-login" id="admin-page-auth-login">
      <div style={s.card}>
        <div style={s.brand}>ShopAdmin</div>
        <p style={s.sub}>Sign in to your admin account</p>

        {error && <div style={s.errorBox}>{error}</div>}

        <div style={s.field}>
          <label style={s.label}>Email</label>
          <input
            type="email"
            value={form.email}
            onChange={e => set('email', e.target.value)}
            style={s.input}
            autoFocus />
        </div>

        <div style={s.field}>
          <label style={s.label}>Password</label>
          <input
            type="password"
            value={form.password}
            onChange={e => set('password', e.target.value)}
            style={s.input}
            onKeyDown={e => e.key === 'Enter' && mutation.mutate(form)} />
        </div>

        <button
          onClick={() => mutation.mutate(form)}
          disabled={mutation.isPending}
          style={s.btn}>
          {mutation.isPending ? 'Signing in...' : 'Sign in'}
        </button>

        <p style={s.hint}>
          Default: admin@gmail.com / admin
        </p>
      </div>
    </div>
  );
}

const s = {
  page:     { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f3f4f6' },
  card:     { background: '#fff', borderRadius: 12, padding: '40px 36px', width: 380, border: '1px solid #e5e7eb' },
  brand:    { fontSize: 24, fontWeight: 800, marginBottom: 4, color: '#111827' },
  sub:      { fontSize: 14, color: '#6b7280', margin: '0 0 28px' },
  errorBox: { background: '#fef2f2', color: '#dc2626', padding: '10px 14px', borderRadius: 8, fontSize: 14, marginBottom: 16, border: '1px solid #fecaca' },
  field:    { marginBottom: 16 },
  label:    { display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: '#374151' },
  input:    { width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' },
  btn:      { width: '100%', padding: 12, background: '#111827', color: '#fff', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: 'pointer', marginTop: 4 },
  hint:     { fontSize: 12, color: '#9ca3af', textAlign: 'center', marginTop: 16 },
};