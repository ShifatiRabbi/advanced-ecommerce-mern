// gradient promotional banner + nav

import { Link }          from 'react-router-dom';
import { useCartStore }  from '../../store/cartStore';
import { useSiteSettings } from '../../hooks/useSiteSettings';

export default function Header4() {
  const settings = useSiteSettings();
  const logo     = settings?.logo;
  const siteName = settings?.siteName || 'ShopBD';
  const { itemCount } = useCartStore();
  return (
    <>
      <div style={{ background: '#111', color: '#fff', textAlign: 'center', padding: '8px', fontSize: 13 }}>
        Free shipping on orders over ৳1000! &nbsp;
        <Link to="/shop" style={{ color: '#fbbf24', fontWeight: 700, textDecoration: 'none' }}>Shop now →</Link>
      </div>
      <header style={{ background: '#fff', borderBottom: '1px solid #eee', padding: '0 40px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link to="/" style={{ fontWeight: 800, fontSize: 20, color: '#111', textDecoration: 'none' }}>
          {logo
          ? <img src={logo} alt={siteName} style={{ height: 44, objectFit: 'contain' }} />
          : <span style={{ color: '#fff', fontWeight: 700, fontSize: 20 }}>{siteName}</span>}
        </Link>
        <nav style={{ display: 'flex', gap: 20, fontSize: 14 }}>
          {[['/', 'Home'], ['/shop', 'Shop'], ['/shop?featured=true', 'Deals'], ['/blog', 'Blog'], ['/contact', 'Contact']].map(([to, l]) => (
            <Link key={to} to={to} style={{ color: '#444', textDecoration: 'none' }}>{l}</Link>
          ))}
        </nav>
        <Link to="/cart" style={{ fontWeight: 700, color: '#111', textDecoration: 'none', fontSize: 15 }}>
          Cart {itemCount > 0 && `(${itemCount})`}
        </Link>
      </header>
    </>
  );
}