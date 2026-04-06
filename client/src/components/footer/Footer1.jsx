// minimal dark

import { Link } from 'react-router-dom';
export default function Footer1() {
  return (
    <footer style={{ background: '#111', color: '#888', padding: '40px', marginTop: 60 }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 40 }}>
        <div>
          <h3 style={{ color: '#fff', marginBottom: 12 }}>ShopBD</h3>
          <p style={{ fontSize: 14, lineHeight: 1.7 }}>Bangladesh's trusted online store. Quality products, fast delivery.</p>
        </div>
        {[
          { title: 'Shop', links: [['All Products', '/shop'], ['Featured', '/shop?featured=true'], ['New Arrivals', '/shop?sort=newest']] },
          { title: 'Support', links: [['My Orders', '/my-orders'], ['Contact', '/contact'], ['FAQ', '/faq']] },
          { title: 'Legal', links: [['Privacy Policy', '/privacy'], ['Terms', '/terms'], ['Return Policy', '/returns']] },
        ].map(col => (
          <div key={col.title}>
            <h4 style={{ color: '#fff', marginBottom: 12, fontSize: 14 }}>{col.title}</h4>
            {col.links.map(([label, to]) => <Link key={to} to={to} style={{ display: 'block', color: '#888', textDecoration: 'none', marginBottom: 8, fontSize: 14 }}>{label}</Link>)}
          </div>
        ))}
      </div>
      <div style={{ maxWidth: 1200, margin: '24px auto 0', borderTop: '1px solid #222', paddingTop: 20, fontSize: 13 }}>
        © {new Date().getFullYear()} ShopBD. All rights reserved.
      </div>
    </footer>
  );
}