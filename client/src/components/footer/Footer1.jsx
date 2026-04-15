// minimal dark

import { Link } from 'react-router-dom';
import { useSiteSettings } from '../../hooks/useSiteSettings';
import { useMenu } from '../../hooks/useMenu';
export default function Footer1() {
  const settings = useSiteSettings();
  const siteName = settings?.siteName || 'ShopBD';
  const contactPhone = settings?.phone || 'N/A';
  const contactEmail = settings?.email || settings?.adminEmail || 'N/A';
  const contactAddress = settings?.siteAddress || 'N/A';
  const { data: menuData } = useMenu('footer');
  const menuItems = menuData?.items || [
    { id: '1', label: 'About Us', url: '/about', target: '_self' },
    { id: '2', label: 'Privacy', url: '/privacy', target: '_self' },
    { id: '3', label: 'Terms', url: '/terms', target: '_self' },
    { id: '4', label: 'Contact', url: '/contact', target: '_self' },
  ];

  return (
    <footer className="client-component-footer1" id="client-component-footer1" style={{ background: 'var(--footer-bg, #111)', color: 'var(--footer-text-color, #888)', padding: '40px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 40 }}>
        <div>
          <h3 style={{ color: 'var(--header-text-color, #fff)', marginBottom: 12 }}>{siteName}</h3>
          <p style={{ fontSize: 14, lineHeight: 1.7 }}>Bangladesh's trusted online store. Quality products, fast delivery.</p>
          <p style={{ marginTop: 12, fontSize: 13, lineHeight: 1.7 }}>
            {contactAddress}<br />
            {contactEmail}<br />
            {contactPhone}
          </p>
        </div>
        {[
          { title: 'Explore', links: menuItems.slice(0, 4) },
          { title: 'Support', links: menuItems.slice(4, 8) },
          { title: 'More', links: menuItems.slice(8, 12) },
        ].map(col => (
          <div key={col.title}>
            <h4 style={{ color: 'var(--header-text-color, #fff)', marginBottom: 12, fontSize: 14 }}>{col.title}</h4>
            {col.links.map((item) => <Link key={item.id} to={item.url} target={item.target} style={{ display: 'block', color: 'var(--footer-text-color, #888)', textDecoration: 'none', marginBottom: 8, fontSize: 14 }}>{item.label}</Link>)}
          </div>
        ))}
      </div>
      <div style={{ maxWidth: 1200, margin: '24px auto 0', borderTop: '1px solid var(--color-border, #222)', paddingTop: 20, fontSize: 13 }}>
        © {new Date().getFullYear()} {siteName}. All rights reserved.
      </div>
    </footer>
  );
}