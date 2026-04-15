// centered logo with category mega nav

import { Link } from 'react-router-dom';
import { useCartStore }      from '../../store/cartStore';
import { useCategories }     from '../../hooks/useProducts';
import { useSiteSettings } from '../../hooks/useSiteSettings';
import { useMenu } from '../../hooks/useMenu';

export default function Header3() {
  const settings = useSiteSettings();
  const logo     = settings?.logo;
  const siteName = settings?.siteName || 'ShopBD';
  const store         = useCartStore();
  const itemCount     = store.items.reduce((s, i) => s + i.qty, 0);
  const { data: cats } = useCategories();
  const { data: menuData } = useMenu('header');
  const menuItems = menuData?.items || [
    { id: '1', label: 'All Products', url: '/shop', target: '_self' },
    { id: '2', label: 'Blog', url: '/blog', target: '_self' },
    { id: '3', label: 'Contact', url: '/contact', target: '_self' },
  ];
  return (
    <header className="client-component-header3" id="client-component-header3" style={{ background: 'var(--header-bg, #fff)', boxShadow: 'var(--card-shadow, 0 1px 4px rgba(0,0,0,0.08))' }}>
      <div style={{ textAlign: 'center', padding: '16px 0 8px', borderBottom: '1px solid var(--color-border, #f0f0f0)' }}>
        <Link to="/" style={{ fontSize: 28, fontWeight: 900, color: 'var(--header-text-color, #111)', textDecoration: 'none', letterSpacing: '-0.04em' }}>
          {logo
          ? <img src={logo} alt={siteName} style={{ height: 44, objectFit: 'contain' }} />
          : <span style={{ color: 'var(--header-text-color, #111)', fontWeight: 700, fontSize: 20 }}>{siteName}</span>}
        </Link>
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 8, padding: '8px 40px', flexWrap: 'wrap' }}>
        {menuItems.map((item) => (
          <Link key={item.id} to={item.url} target={item.target} style={navStyle}>{item.label}</Link>
        ))}
        {cats?.slice(0, 6).map(c => (
          <Link key={c._id} to={`/shop?category=${c._id}`} style={navStyle}>{c.name}</Link>
        ))}
        <Link to="/cart" style={{ ...navStyle, marginLeft: 'auto', fontWeight: 700 }}>
          Cart {itemCount > 0 && `(${itemCount})`}
        </Link>
      </div>
    </header>
  );
}
const navStyle = { padding: '6px 14px', borderRadius: 20, fontSize: 13, color: 'var(--header-text-color, #555)', textDecoration: 'none', background: 'var(--color-surface, #f9f9f9)' };