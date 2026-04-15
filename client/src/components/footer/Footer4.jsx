// full with payment icons + address

import { Link } from 'react-router-dom';
import { useSiteSettings } from '../../hooks/useSiteSettings';
import { useMenu } from '../../hooks/useMenu';
export default function Footer4() {
  const settings = useSiteSettings();
  const siteName = settings?.siteName || 'ShopBD';
  const contactPhone = settings?.phone || 'N/A';
  const contactEmail = settings?.email || settings?.adminEmail || 'N/A';
  const contactAddress = settings?.siteAddress || 'N/A';
  const { data: menuData } = useMenu('footer');
  const menuItems = menuData?.items || [
    { id: '1', label: 'About', url: '/about', target: '_self' },
    { id: '2', label: 'Blog', url: '/blog', target: '_self' },
    { id: '3', label: 'Privacy', url: '/privacy', target: '_self' },
    { id: '4', label: 'Terms', url: '/terms', target: '_self' },
    { id: '5', label: 'Contact', url: '/contact', target: '_self' },
  ];
  return (
    <footer className="client-component-footer4" id="client-component-footer4" style={{ background: 'var(--footer-bg, #1a1a2e)', color: 'var(--footer-text-color, #aaa)', padding: '48px 40px 24px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 32, marginBottom: 36 }}>
        <div>
          <h3 style={{ color: 'var(--header-text-color, #fff)', marginBottom: 12 }}>{siteName}</h3>
          <p style={{ fontSize: 13, lineHeight: 1.8 }}>{contactAddress}<br/>{contactEmail}<br/>{contactPhone}</p>
        </div>
        {[
          { title: 'Explore', links: menuItems.slice(0, 4) },
          { title: 'Customer', links: menuItems.slice(4, 8) },
          { title: 'Information', links: menuItems.slice(8, 12) },
        ].map(col => (
          <div key={col.title}>
            <h4 style={{ color: 'var(--header-text-color, #ddd)', marginBottom: 12, fontSize: 14 }}>{col.title}</h4>
            {col.links.map((item) => <Link key={item.id} to={item.url} target={item.target} style={{ display: 'block', color: 'var(--footer-text-color, #888)', textDecoration: 'none', marginBottom: 6, fontSize: 13 }}>{item.label}</Link>)}
          </div>
        ))}
      </div>
      <div style={{ maxWidth: 1200, margin: '0 auto', borderTop: '1px solid var(--color-border, #2a2a4a)', paddingTop: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13 }}>
        <span>© {new Date().getFullYear()} {siteName}</span>
        <div style={{ display: 'flex', gap: 8 }}>
          {['bKash', 'Nagad', 'Visa', 'MasterCard'].map(p => (
            <span key={p} style={{ padding: '3px 8px', background: 'var(--color-surface, #2a2a4a)', borderRadius: 4, fontSize: 11, color: 'var(--footer-text-color, #ccc)' }}>{p}</span>
          ))}
        </div>
      </div>
    </footer>
  );
}