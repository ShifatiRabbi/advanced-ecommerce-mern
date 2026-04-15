// gradient promotional banner + nav

import { Link }          from 'react-router-dom';
import { useCartStore }  from '../../store/cartStore';
import { useSiteSettings } from '../../hooks/useSiteSettings';
import { useMenu } from '../../hooks/useMenu';

export default function Header4() {
  const settings = useSiteSettings();
  const logo     = settings?.logo;
  const siteName = settings?.siteName || 'ShopBD';
  const store         = useCartStore();
  const itemCount     = store.items.reduce((s, i) => s + i.qty, 0);
  const { data: menuData } = useMenu('header');
  const menuItems = menuData?.items || [
    { id: '1', label: 'Home', url: '/', target: '_self' },
    { id: '2', label: 'Shop', url: '/shop', target: '_self' },
    { id: '3', label: 'Deals', url: '/shop?featured=true', target: '_self' },
    { id: '4', label: 'Blog', url: '/blog', target: '_self' },
    { id: '5', label: 'Contact', url: '/contact', target: '_self' },
  ];
  
  return (
    <div className="client-component-header4" id="client-component-header4" style={{ display: 'contents' }}>
      <div style={{ background: 'var(--color-primary, #111)', color: 'var(--header-text-color, #fff)', textAlign: 'center', padding: '8px', fontSize: 13 }}>
        Free shipping on orders over ৳1000! &nbsp;
        <Link to="/shop" style={{ color: 'var(--color-accent, #fbbf24)', fontWeight: 700, textDecoration: 'none' }}>Shop now →</Link>
      </div>
      <header style={{ background: 'var(--header-bg, #fff)', color: 'var(--header-text-color, #111)', borderBottom: '1px solid var(--color-border, #eee)', padding: '0 40px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link to="/" style={{ fontWeight: 800, fontSize: 20, color: 'var(--header-text-color, #111)', textDecoration: 'none' }}>
          {logo
          ? <img src={logo} alt={siteName} style={{ height: 44, objectFit: 'contain' }} />
          : <span style={{ color: 'var(--header-text-color, #111)', fontWeight: 700, fontSize: 20 }}>{siteName}</span>}
        </Link>
        <nav style={{ display: 'flex', gap: 20, fontSize: 14 }}>
          {menuItems.map((item) => (
            <Link key={item.id} to={item.url} target={item.target} style={{ color: 'var(--header-text-color, #444)', textDecoration: 'none' }}>
              {item.label}
            </Link>
          ))}
        </nav>
        <Link to="/cart" style={{ fontWeight: 700, color: 'var(--header-text-color, #111)', textDecoration: 'none', fontSize: 15 }}>
          Cart {itemCount > 0 && `(${itemCount})`}
        </Link>
      </header>
    </div>
  );
}