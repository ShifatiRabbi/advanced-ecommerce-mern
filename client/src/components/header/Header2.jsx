// light with search bar

import { useState }          from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCartStore }      from '../../store/cartStore';
import { useAuthStore }      from '../../store/authStore';
import { useSiteSettings } from '../../hooks/useSiteSettings';
import { useMenu } from '../../hooks/useMenu';

export default function Header2() {
  const settings = useSiteSettings();
  const logo     = settings?.logo;
  const siteName = settings?.siteName || 'ShopBD';
  const store         = useCartStore();
  const itemCount     = store.items.reduce((s, i) => s + i.qty, 0);
  const { user }      = useAuthStore();
  const navigate      = useNavigate();
  const [search, setSearch] = useState('');
  const { data: menuData } = useMenu('header');
  const menuItems = menuData?.items || [
    { id: '1', label: 'Home', url: '/', target: '_self' },
    { id: '2', label: 'Shop', url: '/shop', target: '_self' },
    { id: '3', label: 'Featured', url: '/shop?featured=true', target: '_self' },
    { id: '4', label: 'Blog', url: '/blog', target: '_self' },
  ];

  return (
    <header className="client-component-header2" id="client-component-header2" style={{ background: 'var(--header-bg, #fff)', color: 'var(--header-text-color, #111)', borderBottom: '1px solid var(--color-border, #eee)', padding: '0 40px' }}>
      <div style={{ display: 'flex', alignItems: 'center', height: 70, gap: 24 }}>
        <Link to="/" style={{ fontWeight: 800, fontSize: 22, color: 'var(--header-text-color, #111)', textDecoration: 'none', flexShrink: 0 }}>
          {logo
          ? <img src={logo} alt={siteName} style={{ height: 44, objectFit: 'contain' }} />
          : <span style={{ color: 'var(--header-text-color, #111)', fontWeight: 700, fontSize: 20 }}>{siteName}</span>}
        </Link>
        <form onSubmit={e => { e.preventDefault(); navigate(`/shop?search=${search}`); }} style={{ flex: 1, display: 'flex', gap: 0 }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products..."
            style={{ flex: 1, padding: '10px 16px', border: '2px solid var(--color-border, #eee)', borderRight: 'none', borderRadius: '8px 0 0 8px', fontSize: 14, outline: 'none' }} />
          <button type="submit" style={{ padding: '10px 20px', background: 'var(--color-primary, #111)', color: '#fff', border: 'none', borderRadius: '0 8px 8px 0', cursor: 'pointer', fontSize: 14 }}>Search</button>
        </form>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexShrink: 0 }}>
          <Link to="/wishlist" style={{ color: 'var(--header-text-color, #888)', textDecoration: 'none', fontSize: 20 }}>♡</Link>
          <Link to="/cart"     style={{ position: 'relative', color: 'var(--header-text-color, #111)', textDecoration: 'none', fontWeight: 600 }}>
            Cart {itemCount > 0 && <span style={{ background: '#e53e3e', color: '#fff', borderRadius: 10, padding: '1px 6px', fontSize: 11 }}>{itemCount}</span>}
          </Link>
          {user ? <Link to="/my-orders" style={{ fontSize: 14, color: 'var(--header-text-color, #555)', textDecoration: 'none' }}>{user.name.split(' ')[0]}</Link>
                : <button onClick={() => navigate('/login')} style={{ padding: '8px 16px', background: 'var(--color-primary, #111)', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 14 }}>Login</button>}
        </div>
      </div>
      <nav style={{ display: 'flex', gap: 28, paddingBottom: 12, fontSize: 14 }}>
        {menuItems.map((item) => (
          <Link key={item.id} to={item.url} target={item.target} style={{ color: 'var(--header-text-color, #555)', textDecoration: 'none' }}>
            {item.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}