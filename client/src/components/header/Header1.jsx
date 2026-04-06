//  sticky minimal dark

import { Link, useNavigate } from 'react-router-dom';
import { useCartStore }      from '../../store/cartStore';
import { useAuthStore }      from '../../store/authStore';
import { useTranslation }    from 'react-i18next';

export default function Header1() {
  const { itemCount } = useCartStore();
  const { user }      = useAuthStore();
  const { t, i18n }   = useTranslation();
  const navigate      = useNavigate();

  return (
    <header style={{ position: 'sticky', top: 0, zIndex: 100, background: '#111', color: '#fff', padding: '0 40px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <Link to="/" style={{ color: '#fff', textDecoration: 'none', fontWeight: 700, fontSize: 20 }}>ShopBD</Link>
      <nav style={{ display: 'flex', gap: 24, fontSize: 14 }}>
        <Link to="/"      style={{ color: '#ccc', textDecoration: 'none' }}>{t('nav.home')}</Link>
        <Link to="/shop"  style={{ color: '#ccc', textDecoration: 'none' }}>{t('nav.shop')}</Link>
        <Link to="/blog"  style={{ color: '#ccc', textDecoration: 'none' }}>Blog</Link>
      </nav>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <button onClick={() => i18n.changeLanguage(i18n.language === 'en' ? 'bn' : 'en')} style={{ background: 'none', border: '1px solid #444', color: '#ccc', padding: '4px 10px', borderRadius: 4, cursor: 'pointer', fontSize: 12 }}>
          {i18n.language === 'en' ? 'বাং' : 'EN'}
        </button>
        <Link to="/cart" style={{ color: '#fff', textDecoration: 'none', position: 'relative' }}>
          Cart
          {itemCount > 0 && <span style={{ position: 'absolute', top: -8, right: -10, background: '#e53e3e', color: '#fff', borderRadius: '50%', width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700 }}>{itemCount}</span>}
        </Link>
        {user ? (
          <Link to="/my-orders" style={{ color: '#ccc', textDecoration: 'none', fontSize: 13 }}>{user.name.split(' ')[0]}</Link>
        ) : (
          <button onClick={() => navigate('/login')} style={{ background: '#fff', color: '#111', border: 'none', padding: '6px 14px', borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>Login</button>
        )}
      </div>
    </header>
  );
}