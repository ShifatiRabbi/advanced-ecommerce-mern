import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import { useCartStore } from '../../store/cartStore';
import { useWishlistStore } from '../../store/wishlistStore';
import { useAuthStore } from '../../store/authStore';
import { useNavigate } from 'react-router-dom';
import ProductTimer from './ProductTimer';

const useCardStyle = () => useQuery({
  queryKey: ['product-card-style'],
  queryFn:  () => api.get('/settings/product-card-style').then(r => r.data.data),
  staleTime: 1000 * 60 * 5,
});

function Style1({ product, discount, price }) {
  const { addItem } = useCartStore();
  return (
    <Link to={`/product/${product.slug}`} style={{ textDecoration: 'none', color: 'inherit', border: 'var(--card-border, 1px solid #eee)', borderRadius: 'var(--card-radius, 12px)', overflow: 'hidden', display: 'block', background: 'var(--color-surface, #fff)' }}>
      <div style={{ position: 'relative', aspectRatio: '1', overflow: 'hidden', background: '#f5f5f5' }}>
        {product.images?.[0] && <img src={product.images[0].url} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />}
        {discount > 0 && <span style={{ position: 'absolute', top: 8, left: 8, background: 'var(--color-danger,#e53e3e)', color: '#fff', fontSize: 11, fontWeight: 700, padding: '3px 7px', borderRadius: 4 }}>{discount}% OFF</span>}
      </div>
      {product._id && <div style={{ padding: '0 12px' }}><ProductTimer productId={product._id} categoryId={product.category?._id} position="product-card" /></div>}
      <div style={{ padding: '12px 14px' }}>
        <p style={{ fontSize: 11, color: 'var(--color-text-muted,#888)', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{product.category?.name}</p>
        <h3 style={{ fontSize: 14, fontWeight: 600, margin: '0 0 8px', lineHeight: 1.3, color: 'var(--color-text,#111)' }}>{product.name}</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-primary,#111)' }}>৳{price.toLocaleString()}</span>
          {product.discountPrice && <span style={{ fontSize: 13, color: '#aaa', textDecoration: 'line-through' }}>৳{product.price.toLocaleString()}</span>}
        </div>
        <button onClick={e => { e.preventDefault(); addItem(product, 1); }}
          style={{ width: '100%', padding: '8px', background: 'var(--color-primary,#111)', color: '#fff', border: 'none', borderRadius: 'var(--btn-radius,8px)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
          Add to Cart
        </button>
      </div>
    </Link>
  );
}

function Style2({ product, discount, price }) {
  const { addItem } = useCartStore();
  return (
    <div style={{ border: 'var(--card-border,1px solid #eee)', borderRadius: 'var(--card-radius,12px)', overflow: 'hidden', background: 'var(--color-surface,#fff)', display: 'flex', flexDirection: 'column' }}>
      <Link to={`/product/${product.slug}`} style={{ position: 'relative', display: 'block', aspectRatio: '4/3', overflow: 'hidden', background: '#f5f5f5' }}>
        {product.images?.[0] && <img src={product.images[0].url} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform .3s' }} onMouseEnter={e => e.target.style.transform='scale(1.05)'} onMouseLeave={e => e.target.style.transform='scale(1)'} loading="lazy" />}
        {discount > 0 && <span style={{ position: 'absolute', top: 8, right: 8, background: 'var(--color-danger,#e53e3e)', color: '#fff', fontSize: 11, fontWeight: 700, padding: '4px 8px', borderRadius: 20 }}>{discount}% OFF</span>}
      </Link>
      {product._id && <div style={{ padding: '0 12px' }}><ProductTimer productId={product._id} categoryId={product.category?._id} position="product-card" /></div>}
      <div style={{ padding: '14px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Link to={`/product/${product.slug}`} style={{ textDecoration: 'none', color: 'inherit', flex: 1 }}>
          <p style={{ fontSize: 12, color: 'var(--color-accent,#3b82f6)', margin: '0 0 6px', fontWeight: 600 }}>{product.brand?.name}</p>
          <h3 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 8px', lineHeight: 1.3 }}>{product.name}</h3>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontSize: 18, fontWeight: 800, color: 'var(--color-primary,#111)' }}>৳{price.toLocaleString()}</span>
            {product.discountPrice && <span style={{ fontSize: 13, color: '#bbb', textDecoration: 'line-through' }}>৳{product.price.toLocaleString()}</span>}
          </div>
        </Link>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => addItem(product, 1)} style={{ flex: 1, padding: '9px', background: 'var(--color-primary,#111)', color: '#fff', border: 'none', borderRadius: 'var(--btn-radius,8px)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Add to Cart</button>
          <Link to={`/product/${product.slug}`} style={{ padding: '9px 12px', border: '1px solid #e2e2e2', borderRadius: 'var(--btn-radius,8px)', textDecoration: 'none', color: '#555', fontSize: 13 }}>View</Link>
        </div>
      </div>
    </div>
  );
}

function Style3({ product, discount, price }) {
  const { addItem } = useCartStore();
  return (
    <div style={{ display: 'flex', gap: 14, border: 'var(--card-border,1px solid #eee)', borderRadius: 'var(--card-radius,12px)', padding: 14, background: 'var(--color-surface,#fff)', alignItems: 'center' }}>
      <Link to={`/product/${product.slug}`} style={{ flexShrink: 0, width: 90, height: 90, borderRadius: 8, overflow: 'hidden', background: '#f5f5f5', display: 'block' }}>
        {product.images?.[0] && <img src={product.images[0].url} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
      </Link>
      {product._id && <div style={{ padding: '0 12px' }}><ProductTimer productId={product._id} categoryId={product.category?._id} position="product-card" /></div>}

      <div style={{ flex: 1 }}>
        <Link to={`/product/${product.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
          <p style={{ fontSize: 11, color: 'var(--color-text-muted,#888)', margin: '0 0 3px', textTransform: 'uppercase' }}>{product.category?.name}</p>
          <h3 style={{ fontSize: 14, fontWeight: 600, margin: '0 0 6px' }}>{product.name}</h3>
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <span style={{ fontWeight: 700, fontSize: 16, color: 'var(--color-primary,#111)' }}>৳{price.toLocaleString()}</span>
            {product.discountPrice && <span style={{ fontSize: 12, color: '#bbb', textDecoration: 'line-through', marginLeft: 6 }}>৳{product.price.toLocaleString()}</span>}
            {discount > 0 && <span style={{ marginLeft: 6, fontSize: 11, background: '#fef2f2', color: '#dc2626', padding: '2px 6px', borderRadius: 4, fontWeight: 700 }}>{discount}%</span>}
          </div>
          <button onClick={() => addItem(product, 1)} style={{ padding: '7px 14px', background: 'var(--color-primary,#111)', color: '#fff', border: 'none', borderRadius: 'var(--btn-radius,8px)', fontSize: 13, cursor: 'pointer' }}>
            + Cart
          </button>
        </div>
      </div>
    </div>
  );
}

function Style4({ product, discount, price }) {
  const { addItem }      = useCartStore();
  const { toggle, isWishlisted } = useWishlistStore();
  const { user }         = useAuthStore();
  const navigate         = useNavigate();
  return (
    <div style={{ border: 'var(--card-border,1px solid #eee)', borderRadius: 'var(--card-radius,12px)', overflow: 'hidden', background: 'var(--color-surface,#fff)', position: 'relative' }}>
      <button onClick={() => user ? toggle(product._id) : navigate('/login')}
        style={{ position: 'absolute', top: 10, right: 10, zIndex: 2, width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.9)', border: 'none', cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', color: isWishlisted(product._id) ? '#e53e3e' : '#999' }}>
        {isWishlisted(product._id) ? '♥' : '♡'}
      </button>
      {product.stock === 0 && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(255,255,255,0.7)', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ background: '#111', color: '#fff', padding: '6px 14px', borderRadius: 20, fontSize: 13, fontWeight: 700 }}>Out of Stock</span></div>}
      <Link to={`/product/${product.slug}`} style={{ display: 'block', aspectRatio: '1', overflow: 'hidden', background: '#f5f5f5' }}>
        {product.images?.[0] && <img src={product.images[0].url} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />}
      </Link>
      {product._id && <div style={{ padding: '0 12px' }}><ProductTimer productId={product._id} categoryId={product.category?._id} position="product-card" /></div>}

      {product.ratings?.average > 0 && (
        <div style={{ position: 'absolute', bottom: 100, left: 10, background: 'rgba(0,0,0,0.6)', color: '#fff', fontSize: 12, padding: '3px 8px', borderRadius: 20 }}>
          ★ {product.ratings.average.toFixed(1)} ({product.ratings.count})
        </div>
      )}
      <div style={{ padding: '12px 14px' }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, margin: '0 0 4px', lineHeight: 1.3 }}>{product.name}</h3>
        <p style={{ fontSize: 12, color: 'var(--color-text-muted,#888)', margin: '0 0 10px' }}>{product.brand?.name}</p>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span style={{ fontSize: 16, fontWeight: 700 }}>৳{price.toLocaleString()}</span>
            {product.discountPrice && <span style={{ marginLeft: 6, fontSize: 12, color: '#bbb', textDecoration: 'line-through' }}>৳{product.price.toLocaleString()}</span>}
          </div>
          <button onClick={() => addItem(product, 1)} disabled={product.stock === 0}
            style={{ padding: '7px 16px', background: product.stock === 0 ? '#e5e7eb' : 'var(--color-primary,#111)', color: product.stock === 0 ? '#9ca3af' : '#fff', border: 'none', borderRadius: 'var(--btn-radius,8px)', fontSize: 13, cursor: product.stock === 0 ? 'not-allowed' : 'pointer', fontWeight: 600 }}>
            Cart
          </button>
        </div>
      </div>
    </div>
  );
}

const CARD_COMPONENTS = { style1: Style1, style2: Style2, style3: Style3, style4: Style4 };

export default function ProductCard({ product }) {
  const { data: activeStyle = 'style1' } = useCardStyle();
  const CardComponent = CARD_COMPONENTS[activeStyle] || Style1;
  const discount = product.discountPrice ? Math.round(((product.price - product.discountPrice) / product.price) * 100) : 0;
  const price    = product.discountPrice || product.price;
  return <CardComponent product={product} discount={discount} price={price} />;
}