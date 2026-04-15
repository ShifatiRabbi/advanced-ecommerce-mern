// light with newsletter

import { useState } from 'react';
import { Link }     from 'react-router-dom';
import { useSiteSettings } from '../../hooks/useSiteSettings';
import { useMenu } from '../../hooks/useMenu';
export default function Footer2() {
  const [email, setEmail] = useState('');
  const [done,  setDone]  = useState(false);
  const settings = useSiteSettings();
  const siteName = settings?.siteName || 'ShopBD';
  const contactPhone = settings?.phone || 'N/A';
  const contactEmail = settings?.email || settings?.adminEmail || 'N/A';
  const contactAddress = settings?.siteAddress || 'N/A';
  const { data: menuData } = useMenu('footer');
  const menuItems = menuData?.items || [
    { id: '1', label: 'Home', url: '/', target: '_self' },
    { id: '2', label: 'Shop', url: '/shop', target: '_self' },
    { id: '3', label: 'Blog', url: '/blog', target: '_self' },
    { id: '4', label: 'Contact', url: '/contact', target: '_self' },
  ];

  return (
    <footer className="client-component-footer2" id="client-component-footer2" style={{ background: 'var(--footer-bg, #f8f9fa)', color: 'var(--footer-text-color, #666)', borderTop: '1px solid var(--color-border, #eee)', padding: '48px 40px 24px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, marginBottom: 40 }}>
          <div>
            <h3 style={{ marginBottom: 12, color: 'var(--header-text-color, #111)' }}>{siteName} Newsletter</h3>
            <p style={{ color: 'var(--footer-text-color, #666)', marginBottom: 16, fontSize: 14 }}>Subscribe for exclusive deals and updates.</p>
            {done ? <p style={{ color: '#38a169', fontWeight: 600 }}>Subscribed! Thank you.</p> : (
              <div style={{ display: 'flex', gap: 8 }}>
                <input value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com"
                  style={{ flex: 1, padding: '10px 14px', border: '1px solid var(--color-border, #e2e2e2)', borderRadius: 8, fontSize: 14 }} />
                <button onClick={() => setDone(true)} style={{ padding: '10px 20px', background: 'var(--color-primary, #111)', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14 }}>Subscribe</button>
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: 48 }}>
            <div>
              <h4 style={{ marginBottom: 12, fontSize: 14 }}>Quick Links</h4>
              {menuItems.slice(0, 4).map((item) =>
                <Link key={item.id} to={item.url} target={item.target} style={{ display: 'block', color: 'var(--footer-text-color, #666)', textDecoration: 'none', marginBottom: 8, fontSize: 14 }}>{item.label}</Link>)}
            </div>
            <div>
              <h4 style={{ marginBottom: 12, fontSize: 14 }}>Account</h4>
              {menuItems.slice(4, 8).map((item) =>
                <Link key={item.id} to={item.url} target={item.target} style={{ display: 'block', color: 'var(--footer-text-color, #666)', textDecoration: 'none', marginBottom: 8, fontSize: 14 }}>{item.label}</Link>)}
            </div>
            <div>
              <h4 style={{ marginBottom: 12, fontSize: 14 }}>Contact</h4>
              <p style={{ margin: '0 0 8px', fontSize: 13, lineHeight: 1.6 }}>{contactAddress}</p>
              <p style={{ margin: '0 0 8px', fontSize: 13 }}>{contactEmail}</p>
              <p style={{ margin: 0, fontSize: 13 }}>{contactPhone}</p>
            </div>
          </div>
        </div>
        <div style={{ borderTop: '1px solid var(--color-border, #eee)', paddingTop: 20, fontSize: 13, color: 'var(--footer-text-color, #888)', textAlign: 'center' }}>
          © {new Date().getFullYear()} {siteName} — Made with care in Bangladesh
        </div>
      </div>
    </footer>
  );
}