import { useQuery }      from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import api               from '../services/api';
import { useAddToCart }  from '../hooks/useAddToCart';

const useCardStyle = () =>
  useQuery({
    queryKey: ['product-card-style'],
    queryFn:  () => api.get('/settings/product-card-style').then(r => r.data.data),
    staleTime: 1000 * 60 * 5,
    placeholderData: 'style1',
  });

// Shared add-to-cart button logic
function AddCartBtn({ product, fullWidth = false }) {
  const addToCart = useAddToCart();
  const navigate  = useNavigate();
  const hasVariants = product.variants?.length > 0;
  const outOfStock  = (product.totalStock ?? product.stock ?? 0) === 0;

  const style = {
    width: fullWidth ? '100%' : 'auto',
    padding: '8px 16px',
    background: outOfStock ? '#e5e7eb'
               : hasVariants ? '#fff'
               : '#2e7d32',
    color: outOfStock ? '#9ca3af'
          : hasVariants ? '#2e7d32'
          : '#fff',
    border: hasVariants && !outOfStock ? '1.5px solid #2e7d32' : 'none',
    borderRadius: 'var(--btn-radius, 8px)',
    fontSize: 13, fontWeight: 600,
    cursor: outOfStock ? 'not-allowed' : 'pointer',
  };

  if (outOfStock) return <button disabled style={style}>Out of Stock</button>;
  if (hasVariants) {
    return (
      <button onClick={() => navigate(`/product/${product.slug}`)} style={style}>
        View Options
      </button>
    );
  }
  return (
    <button
      onClick={(e) => { e.preventDefault(); addToCart(product, 1, {}); }}
      style={style}>
      + Add to Cart
    </button>
  );
}

// ── Style 1: Classic ──────────────────────────────────────────────────────────
function Style1({ product, price, discount }) {
  return (
    <div style={{ border: 'var(--card-border,1px solid #e5e7eb)', borderRadius: 'var(--card-radius,12px)', overflow: 'hidden', background: '#fff', display: 'flex', flexDirection: 'column' }}>
      <Link to={`/product/${product.slug}`} style={{ display: 'block', aspectRatio: '1', overflow: 'hidden', background: '#f5f5f5', position: 'relative', flexShrink: 0 }}>
        {product.images?.[0] && <img src={product.images[0].url} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />}
        {discount > 0 && <span style={{ position: 'absolute', top: 8, left: 8, background: '#dc2626', color: '#fff', fontSize: 11, fontWeight: 700, padding: '2px 7px', borderRadius: 3 }}>{discount}% OFF</span>}
      </Link>
      <div style={{ padding: '12px 14px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <p style={{ fontSize: 11, color: '#9ca3af', margin: '0 0 4px', textTransform: 'uppercase' }}>{product.category?.name}</p>
        <Link to={`/product/${product.slug}`} style={{ textDecoration: 'none', color: '#111', fontSize: 14, fontWeight: 600, lineHeight: 1.3, marginBottom: 8, flex: 1, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {product.name}
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
          <span style={{ fontSize: 16, fontWeight: 700, color: '#2e7d32' }}>৳{price.toLocaleString()}</span>
          {product.discountPrice && <span style={{ fontSize: 12, color: '#9ca3af', textDecoration: 'line-through' }}>৳{product.price.toLocaleString()}</span>}
        </div>
        <AddCartBtn product={product} fullWidth />
      </div>
    </div>
  );
}

// ── Style 2: Modern ───────────────────────────────────────────────────────────
function Style2({ product, price, discount }) {
  return (
    <div style={{ border: 'var(--card-border,1px solid #e5e7eb)', borderRadius: 'var(--card-radius,12px)', overflow: 'hidden', background: '#fff' }}>
      <Link to={`/product/${product.slug}`} style={{ display: 'block', aspectRatio: '4/3', overflow: 'hidden', background: '#f5f5f5', position: 'relative' }}>
        {product.images?.[0] && <img src={product.images[0].url} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform .3s' }} onMouseEnter={e => e.target.style.transform='scale(1.06)'} onMouseLeave={e => e.target.style.transform='scale(1)'} loading="lazy" />}
        {discount > 0 && <span style={{ position: 'absolute', top: 8, right: 8, background: '#dc2626', color: '#fff', fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 20 }}>{discount}% OFF</span>}
      </Link>
      <div style={{ padding: 14 }}>
        <p style={{ fontSize: 12, color: '#2e7d32', fontWeight: 600, margin: '0 0 4px' }}>{product.brand?.name}</p>
        <Link to={`/product/${product.slug}`} style={{ textDecoration: 'none', color: '#111', fontSize: 15, fontWeight: 700, display: 'block', marginBottom: 8, lineHeight: 1.3 }}>
          {product.name}
        </Link>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span style={{ fontSize: 18, fontWeight: 800, color: '#111' }}>৳{price.toLocaleString()}</span>
            {product.discountPrice && <span style={{ fontSize: 12, color: '#9ca3af', textDecoration: 'line-through', marginLeft: 6 }}>৳{product.price.toLocaleString()}</span>}
          </div>
          <AddCartBtn product={product} />
        </div>
      </div>
    </div>
  );
}

// ── Style 3: List ─────────────────────────────────────────────────────────────
function Style3({ product, price, discount }) {
  return (
    <div style={{ display: 'flex', gap: 12, border: 'var(--card-border,1px solid #e5e7eb)', borderRadius: 'var(--card-radius,12px)', padding: 12, background: '#fff', alignItems: 'center' }}>
      <Link to={`/product/${product.slug}`} style={{ display: 'block', width: 88, height: 88, borderRadius: 6, overflow: 'hidden', background: '#f5f5f5', flexShrink: 0 }}>
        {product.images?.[0] && <img src={product.images[0].url} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
      </Link>
      <div style={{ flex: 1, minWidth: 0 }}>
        <Link to={`/product/${product.slug}`} style={{ textDecoration: 'none', color: '#111', fontWeight: 600, fontSize: 14, display: 'block', marginBottom: 4 }}>
          {product.name}
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'space-between' }}>
          <div>
            <span style={{ fontWeight: 700, fontSize: 15, color: '#2e7d32' }}>৳{price.toLocaleString()}</span>
            {product.discountPrice && <span style={{ marginLeft: 6, fontSize: 12, color: '#9ca3af', textDecoration: 'line-through' }}>৳{product.price.toLocaleString()}</span>}
            {discount > 0 && <span style={{ marginLeft: 6, fontSize: 11, background: '#fef2f2', color: '#dc2626', padding: '1px 5px', borderRadius: 3, fontWeight: 700 }}>{discount}%</span>}
          </div>
          <AddCartBtn product={product} />
        </div>
      </div>
    </div>
  );
}

// ── Style 4: Minimal ──────────────────────────────────────────────────────────
function Style4({ product, price, discount }) {
  return (
    <div style={{ border: 'var(--card-border,1px solid #e5e7eb)', borderRadius: 'var(--card-radius,12px)', overflow: 'hidden', background: '#fff', position: 'relative' }}>
      {(product.totalStock ?? product.stock ?? 0) === 0 && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,.7)', zIndex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ background: '#111', color: '#fff', padding: '5px 14px', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>Out of Stock</span>
        </div>
      )}
      <Link to={`/product/${product.slug}`} style={{ display: 'block', aspectRatio: '1', overflow: 'hidden', background: '#f5f5f5' }}>
        {product.images?.[0] && <img src={product.images[0].url} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />}
        {discount > 0 && <span style={{ position: 'absolute', top: 8, left: 8, background: '#dc2626', color: '#fff', fontSize: 11, fontWeight: 700, padding: '2px 6px', borderRadius: 3 }}>{discount}%</span>}
      </Link>
      <div style={{ padding: '10px 12px' }}>
        <Link to={`/product/${product.slug}`} style={{ textDecoration: 'none', color: '#111', fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 4, lineHeight: 1.3 }}>
          {product.name}
        </Link>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: 700, fontSize: 15, color: '#2e7d32' }}>৳{price.toLocaleString()}</span>
          <AddCartBtn product={product} />
        </div>
      </div>
    </div>
  );
}

const STYLES = { style1: Style1, style2: Style2, style3: Style3, style4: Style4 };

export default function ProductCard({ product }) {
  const { data: activeStyle = 'style1' } = useCardStyle();
  const Card     = STYLES[activeStyle] || Style1;
  const price    = product.discountPrice ?? product.price;
  const discount = product.discountPrice
    ? Math.round(((product.price - product.discountPrice) / product.price) * 100) : 0;
  return <Card product={product} price={price} discount={discount} />;
}