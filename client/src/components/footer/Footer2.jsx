// light with newsletter

import { useState } from 'react';
import { Link }     from 'react-router-dom';
export default function Footer2() {
  const [email, setEmail] = useState('');
  const [done,  setDone]  = useState(false);
  return (
    <footer className="client-component-footer2" id="client-component-footer2" style={{ background: '#f8f9fa', borderTop: '1px solid #eee', padding: '48px 40px 24px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, marginBottom: 40 }}>
          <div>
            <h3 style={{ marginBottom: 12 }}>ShopBD Newsletter</h3>
            <p style={{ color: '#666', marginBottom: 16, fontSize: 14 }}>Subscribe for exclusive deals and updates.</p>
            {done ? <p style={{ color: '#38a169', fontWeight: 600 }}>Subscribed! Thank you.</p> : (
              <div style={{ display: 'flex', gap: 8 }}>
                <input value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com"
                  style={{ flex: 1, padding: '10px 14px', border: '1px solid #e2e2e2', borderRadius: 8, fontSize: 14 }} />
                <button onClick={() => setDone(true)} style={{ padding: '10px 20px', background: '#111', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14 }}>Subscribe</button>
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: 48 }}>
            <div>
              <h4 style={{ marginBottom: 12, fontSize: 14 }}>Quick Links</h4>
              {[['Home', '/'], ['Shop', '/shop'], ['Blog', '/blog'], ['Contact', '/contact']].map(([l, to]) =>
                <Link key={to} to={to} style={{ display: 'block', color: '#666', textDecoration: 'none', marginBottom: 8, fontSize: 14 }}>{l}</Link>)}
            </div>
            <div>
              <h4 style={{ marginBottom: 12, fontSize: 14 }}>Account</h4>
              {[['My Orders', '/my-orders'], ['Wishlist', '/wishlist'], ['Profile', '/profile']].map(([l, to]) =>
                <Link key={to} to={to} style={{ display: 'block', color: '#666', textDecoration: 'none', marginBottom: 8, fontSize: 14 }}>{l}</Link>)}
            </div>
          </div>
        </div>
        <div style={{ borderTop: '1px solid #eee', paddingTop: 20, fontSize: 13, color: '#888', textAlign: 'center' }}>
          © {new Date().getFullYear()} ShopBD — Made with care in Bangladesh
        </div>
      </div>
    </footer>
  );
}