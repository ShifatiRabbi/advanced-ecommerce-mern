//  compact centered

import { Link } from 'react-router-dom';
export default function Footer3() {
  return (
    <footer style={{ background: '#fff', borderTop: '1px solid #eee', padding: '32px 40px', textAlign: 'center' }}>
      <Link to="/" style={{ fontWeight: 800, fontSize: 20, color: '#111', textDecoration: 'none', display: 'block', marginBottom: 16 }}>ShopBD</Link>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginBottom: 16, flexWrap: 'wrap' }}>
        {[['Shop', '/shop'], ['Blog', '/blog'], ['Contact', '/contact'], ['Privacy', '/privacy'], ['Terms', '/terms']].map(([l, to]) =>
          <Link key={to} to={to} style={{ color: '#666', textDecoration: 'none', fontSize: 14 }}>{l}</Link>)}
      </div>
      <p style={{ color: '#aaa', fontSize: 13 }}>© {new Date().getFullYear()} ShopBD. All rights reserved.</p>
    </footer>
  );
}