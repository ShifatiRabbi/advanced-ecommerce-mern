//  sticky minimal dark

import { Link, useNavigate } from 'react-router-dom';
import { useCartStore }      from '../../store/cartStore';
import { useAuthStore }      from '../../store/authStore';
import { useTranslation }    from 'react-i18next';
import { useMenu } from '../../hooks/useMenu';

export default function Header1() {
  const { data: menuData } = useMenu('header');
  const { itemCount } = useCartStore();
  const { user }      = useAuthStore();
  const { i18n }      = useTranslation();
  const navigate      = useNavigate();

  const menuItems = menuData?.items || [
    { id: '1', label: 'Home',  url: '/', target: '_self' },
    { id: '2', label: 'Shop',  url: '/shop', target: '_self' },
    { id: '3', label: 'Blog',  url: '/blog', target: '_self' },
    { id: '4', label: 'Cart',  url: '/cart', target: '_self' },
    { id: '5', label: 'My Orders',  url: '/my-orders', target: '_self' },
  ];

  return (
    <header style={{ position: 'sticky', top: 0, zIndex: 100, background: 'var(--header-bg, #111)', color: 'var(--header-text-color, #fff)', padding: '0 40px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <Link to="/" style={{ color: 'var(--header-text-color,#fff)', textDecoration: 'none', fontWeight: 700, fontSize: 20 }}>ShopBD</Link>
      <nav style={{ display: 'flex', gap: 24, fontSize: 14 }}>
        {menuItems.map(item => (
          <Link key={item.id} to={item.url} target={item.target}
            style={{ color: 'var(--header-text-color,#ccc)', textDecoration: 'none', opacity: 0.85 }}>
            {item.label}
          </Link>
        ))}
      </nav>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <button onClick={() => i18n.changeLanguage(i18n.language === 'en' ? 'bn' : 'en')} style={{ background: 'none', border: '1px solid #444', color: '#ccc', padding: '4px 10px', borderRadius: 4, cursor: 'pointer', fontSize: 12 }}>
          {i18n.language === 'en' ? 'বাং' : 'EN'}
        </button>
        <Link to="/cart" style={{ color: '#fff', textDecoration: 'none', position: 'relative' }}>
          Cart {itemCount > 0 && <span style={{ background: '#e53e3e', color: '#fff', borderRadius: '50%', width: 18, height: 18, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, marginLeft: 4 }}>{itemCount}</span>}
        </Link>
        {user
          ? <Link to="/dashboard" style={{ color: '#ccc', textDecoration: 'none', fontSize: 13 }}>{user.name.split(' ')[0]}</Link>
          : <button onClick={() => navigate('/login')} style={{ background: '#fff', color: '#111', border: 'none', padding: '6px 14px', borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>Login</button>}
      </div>
    </header>
  );
}