// full with payment icons + address

import { Link } from 'react-router-dom';
export default function Footer4() {
  return (
    <footer style={{ background: '#1a1a2e', color: '#aaa', padding: '48px 40px 24px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 32, marginBottom: 36 }}>
        <div>
          <h3 style={{ color: '#fff', marginBottom: 12 }}>ShopBD</h3>
          <p style={{ fontSize: 13, lineHeight: 1.8 }}>Dhaka, Bangladesh<br/>support@shopbd.com<br/>01700-000000</p>
        </div>
        {[
          { title: 'Categories', links: [['Electronics', '/shop'], ['Clothing', '/shop'], ['Books', '/shop'], ['Home', '/shop']] },
          { title: 'Customer', links: [['My Account', '/profile'], ['My Orders', '/my-orders'], ['Wishlist', '/wishlist'], ['Returns', '/returns']] },
          { title: 'Information', links: [['About', '/about'], ['Blog', '/blog'], ['Privacy', '/privacy'], ['Terms', '/terms']] },
        ].map(col => (
          <div key={col.title}>
            <h4 style={{ color: '#ddd', marginBottom: 12, fontSize: 14 }}>{col.title}</h4>
            {col.links.map(([l, to]) => <Link key={to} to={to} style={{ display: 'block', color: '#888', textDecoration: 'none', marginBottom: 6, fontSize: 13 }}>{l}</Link>)}
          </div>
        ))}
      </div>
      <div style={{ maxWidth: 1200, margin: '0 auto', borderTop: '1px solid #2a2a4a', paddingTop: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13 }}>
        <span>© {new Date().getFullYear()} ShopBD</span>
        <div style={{ display: 'flex', gap: 8 }}>
          {['bKash', 'Nagad', 'Visa', 'MasterCard'].map(p => (
            <span key={p} style={{ padding: '3px 8px', background: '#2a2a4a', borderRadius: 4, fontSize: 11, color: '#ccc' }}>{p}</span>
          ))}
        </div>
      </div>
    </footer>
  );
}