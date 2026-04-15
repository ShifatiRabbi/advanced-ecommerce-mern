//  compact centered

import { Link } from 'react-router-dom';
import { useSiteSettings } from '../../hooks/useSiteSettings';
import { useMenu } from '../../hooks/useMenu';
export default function Footer3() {
  const settings = useSiteSettings();
  const siteName = settings?.siteName || 'ShopBD';
  const contactPhone = settings?.phone || 'N/A';
  const contactEmail = settings?.email || settings?.adminEmail || 'N/A';
  const contactAddress = settings?.siteAddress || 'N/A';
  const { data: menuData } = useMenu('footer');
  const menuItems = menuData?.items || [
    { id: '1', label: 'Shop', url: '/shop', target: '_self' },
    { id: '2', label: 'Blog', url: '/blog', target: '_self' },
    { id: '3', label: 'Contact', url: '/contact', target: '_self' },
    { id: '4', label: 'Privacy', url: '/privacy', target: '_self' },
    { id: '5', label: 'Terms', url: '/terms', target: '_self' },
  ];
  return (
    <footer className="client-component-footer3" id="client-component-footer3" style={{ background: 'var(--footer-bg, #fff)', color: 'var(--footer-text-color, #666)', borderTop: '1px solid var(--color-border, #eee)', padding: '32px 40px', textAlign: 'center' }}>
      <Link to="/" style={{ fontWeight: 800, fontSize: 20, color: 'var(--header-text-color, #111)', textDecoration: 'none', display: 'block', marginBottom: 16 }}>{siteName}</Link>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginBottom: 16, flexWrap: 'wrap' }}>
        {menuItems.map((item) =>
          <Link key={item.id} to={item.url} target={item.target} style={{ color: 'var(--footer-text-color, #666)', textDecoration: 'none', fontSize: 14 }}>{item.label}</Link>)}
      </div>
      <p style={{ fontSize: 13, margin: '0 0 8px', color: 'var(--footer-text-color, #888)' }}>{contactAddress}</p>
      <p style={{ fontSize: 13, margin: '0 0 8px', color: 'var(--footer-text-color, #888)' }}>{contactEmail} | {contactPhone}</p>
      <p style={{ color: 'var(--footer-text-color, #aaa)', fontSize: 13 }}>© {new Date().getFullYear()} {siteName}. All rights reserved.</p>
    </footer>
  );
}