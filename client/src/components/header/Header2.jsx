// light with search bar

import { useState }          from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCartStore }      from '../../store/cartStore';
import { useAuthStore }      from '../../store/authStore';
import { useSiteSettings } from '../../hooks/useSiteSettings';

export default function Header2() {
  const settings = useSiteSettings();
  const logo     = settings?.logo;
  const siteName = settings?.siteName || 'ShopBD';
  const { itemCount } = useCartStore();
  const { user }      = useAuthStore();
  const navigate      = useNavigate();
  const [search, setSearch] = useState('');

  return (
    <header style={{ background: '#fff', borderBottom: '1px solid #eee', padding: '0 40px' }}>
      <div style={{ display: 'flex', alignItems: 'center', height: 70, gap: 24 }}>
        <Link to="/" style={{ fontWeight: 800, fontSize: 22, color: '#111', textDecoration: 'none', flexShrink: 0 }}>
          {logo
          ? <img src={logo} alt={siteName} style={{ height: 44, objectFit: 'contain' }} />
          : <span style={{ color: '#fff', fontWeight: 700, fontSize: 20 }}>{siteName}</span>}
        </Link>
        <form onSubmit={e => { e.preventDefault(); navigate(`/shop?search=${search}`); }} style={{ flex: 1, display: 'flex', gap: 0 }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products..."
            style={{ flex: 1, padding: '10px 16px', border: '2px solid #eee', borderRight: 'none', borderRadius: '8px 0 0 8px', fontSize: 14, outline: 'none' }} />
          <button type="submit" style={{ padding: '10px 20px', background: '#111', color: '#fff', border: 'none', borderRadius: '0 8px 8px 0', cursor: 'pointer', fontSize: 14 }}>Search</button>
        </form>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexShrink: 0 }}>
          <Link to="/wishlist" style={{ color: '#888', textDecoration: 'none', fontSize: 20 }}>♡</Link>
          <Link to="/cart"     style={{ position: 'relative', color: '#111', textDecoration: 'none', fontWeight: 600 }}>
            Cart {itemCount > 0 && <span style={{ background: '#e53e3e', color: '#fff', borderRadius: 10, padding: '1px 6px', fontSize: 11 }}>{itemCount}</span>}
          </Link>
          {user ? <Link to="/my-orders" style={{ fontSize: 14, color: '#555', textDecoration: 'none' }}>{user.name.split(' ')[0]}</Link>
                : <button onClick={() => navigate('/login')} style={{ padding: '8px 16px', background: '#111', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 14 }}>Login</button>}
        </div>
      </div>
      <nav style={{ display: 'flex', gap: 28, paddingBottom: 12, fontSize: 14 }}>
        {[['/', 'Home'], ['/shop', 'Shop'], ['/shop?featured=true', 'Featured'], ['/blog', 'Blog']].map(([to, label]) => (
          <Link key={to} to={to} style={{ color: '#555', textDecoration: 'none' }}>{label}</Link>
        ))}
      </nav>
    </header>
  );
}