// centered logo with category mega nav

import { Link, useNavigate } from 'react-router-dom';
import { useCartStore }      from '../../store/cartStore';
import { useCategories }     from '../../hooks/useProducts';

export default function Header3() {
  const { itemCount }  = useCartStore();
  const { data: cats } = useCategories();
  return (
    <header style={{ background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
      <div style={{ textAlign: 'center', padding: '16px 0 8px', borderBottom: '1px solid #f0f0f0' }}>
        <Link to="/" style={{ fontSize: 28, fontWeight: 900, color: '#111', textDecoration: 'none', letterSpacing: '-0.04em' }}>SHOPBD</Link>
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 8, padding: '8px 40px', flexWrap: 'wrap' }}>
        <Link to="/shop" style={navStyle}>All Products</Link>
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
const navStyle = { padding: '6px 14px', borderRadius: 20, fontSize: 13, color: '#555', textDecoration: 'none', background: '#f9f9f9' };