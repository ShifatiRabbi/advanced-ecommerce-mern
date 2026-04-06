import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useProduct, useRelatedProducts } from '../hooks/useProducts';
import { useWishlistStore } from '../store/wishlistStore';
import { useAuthStore } from '../store/authStore';

export default function ProductPage() {
  const { slug } = useParams();
  const navigate = useNavigate();

  const { data: product, isLoading, isError } = useProduct(slug);
  const { data: related = [] } = useRelatedProducts(slug);

  const { toggle, isWishlisted, fetchWishlist } = useWishlistStore();
  const { user } = useAuthStore();

  const [activeImg, setActiveImg] = useState(0);
  const [qty, setQty] = useState(1);

  useEffect(() => { if (user) fetchWishlist(); }, [user]);

  if (isLoading) return <div style={{ padding: 80, textAlign: 'center' }}>Loading...</div>;
  if (isError || !product) return <div style={{ padding: 80, textAlign: 'center' }}>Product not found.</div>;

  const discount = product.discountPrice
    ? Math.round(((product.price - product.discountPrice) / product.price) * 100)
    : 0;

  const finalPrice = product.discountPrice || product.price;

  return (
    <>
      <Helmet>
        <title>{product.meta?.title || product.name}</title>
        <meta name="description" content={product.meta?.description || product.shortDesc || product.description?.slice(0, 160)} />
        <meta name="keywords" content={product.meta?.keywords?.join(', ') || product.tags?.join(', ')} />
        <meta property="og:title" content={product.name} />
        <meta property="og:image" content={product.images?.[0]?.url} />
        <meta property="og:description" content={product.shortDesc} />
      </Helmet>

      <div style={styles.page}>
        <div style={styles.grid}>
          {/* Images */}
          <div style={styles.imageSection}>
            <div style={styles.mainImgWrap}>
              {product.images?.[activeImg] ? (
                <img src={product.images[activeImg].url} alt={product.name} style={styles.mainImg} />
              ) : (
                <div style={styles.imgPlaceholder}>No image</div>
              )}
              {discount > 0 && <span style={styles.discBadge}>{discount}% OFF</span>}
            </div>

            {product.images?.length > 1 && (
              <div style={styles.thumbRow}>
                {product.images.map((img, i) => (
                  <img
                    key={i}
                    src={img.url}
                    alt=""
                    style={{ ...styles.thumb, ...(activeImg === i && styles.thumbActive) }}
                    onClick={() => setActiveImg(i)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div style={styles.infoSection}>
            <nav style={styles.breadcrumb}>
              <Link to="/">Home</Link> / <Link to="/shop">Shop</Link> / {product.category?.name} / {product.name}
            </nav>

            {product.brand && <p style={styles.brandLabel}>{product.brand.name}</p>}
            <h1 style={styles.title}>{product.name}</h1>

            <div style={styles.ratingRow}>
              {'★'.repeat(Math.round(product.ratings?.average || 0))}
              {'☆'.repeat(5 - Math.round(product.ratings?.average || 0))}
              <span style={{ marginLeft: 8, fontSize: 13, color: '#888' }}>
                ({product.ratings?.count || 0} reviews)
              </span>
            </div>

            <div style={styles.priceBlock}>
              <span style={styles.finalPrice}>৳{finalPrice.toLocaleString()}</span>
              {product.discountPrice && (
                <span style={styles.origPrice}>৳{product.price.toLocaleString()}</span>
              )}
            </div>

            {product.shortDesc && <p style={styles.shortDesc}>{product.shortDesc}</p>}

            <div style={styles.stockRow}>
              <span style={{ color: product.stock > 0 ? '#38a169' : '#e53e3e', fontWeight: 600 }}>
                {product.stock > 0 ? `In Stock (${product.stock})` : 'Out of Stock'}
              </span>
            </div>

            {product.stock > 0 && (
              <div style={styles.addToCart}>
                <div style={styles.qtyRow}>
                  <button onClick={() => setQty((q) => Math.max(1, q - 1))} style={styles.qtyBtn}>−</button>
                  <span style={styles.qtyVal}>{qty}</span>
                  <button onClick={() => setQty((q) => Math.min(product.stock, q + 1))} style={styles.qtyBtn}>+</button>
                </div>

                <button style={styles.cartBtn}>Add to Cart</button>

                {/* ❤️ HEART BUTTON */}
                <button
                  onClick={() => user ? toggle(product._id) : navigate('/login')}
                  style={{
                    padding: '12px 16px',
                    border: '1px solid #e2e2e2',
                    borderRadius: 8,
                    cursor: 'pointer',
                    fontSize: 18,
                    background: isWishlisted(product._id) ? '#fff0f0' : '#fff',
                    color: isWishlisted(product._id) ? '#e53e3e' : '#888'
                  }}
                >
                  {isWishlisted(product._id) ? '♥' : '♡'}
                </button>
              </div>
            )}

            {product.tags?.length > 0 && (
              <div style={styles.tags}>
                {product.tags.map((tag) => (
                  <Link key={tag} to={`/shop?search=${tag}`} style={styles.tag}>
                    {tag}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Description */}
        {product.description && (
          <section style={styles.descSection}>
            <h2 style={styles.sectionTitle}>Product Description</h2>
            <p style={styles.descText}>{product.description}</p>
          </section>
        )}

        {/* Related */}
        {related.length > 0 && (
          <section style={styles.relatedSection}>
            <h2 style={styles.sectionTitle}>Related Products</h2>
            <div style={styles.relatedGrid}>
              {related.map((p) => (
                <Link key={p._id} to={`/product/${p.slug}`} style={styles.relatedCard}>
                  {p.images?.[0] && (
                    <img src={p.images[0].url} alt={p.name} style={styles.relatedImg} />
                  )}
                  <p style={styles.relatedName}>{p.name}</p>
                  <p style={styles.relatedPrice}>
                    ৳{(p.discountPrice || p.price).toLocaleString()}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  );
}

const styles = {
  page:         { maxWidth: 1200, margin: '0 auto', padding: '32px 24px' },
  grid:         { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, marginBottom: 48 },
  imageSection: {},
  mainImgWrap:  { position: 'relative', borderRadius: 12, overflow: 'hidden', aspectRatio: '1', background: '#f5f5f5' },
  mainImg:      { width: '100%', height: '100%', objectFit: 'cover' },
  imgPlaceholder:{ display:'flex', alignItems:'center', justifyContent:'center', height:'100%', color:'#aaa' },
  discBadge:    { position:'absolute', top:12, left:12, background:'#e53e3e', color:'#fff', padding:'4px 10px', borderRadius:6, fontSize:13, fontWeight:700 },
  thumbRow:     { display: 'flex', gap: 8, marginTop: 12 },
  thumb:        { width: 68, height: 68, objectFit: 'cover', borderRadius: 8, border: '2px solid transparent', cursor: 'pointer' },
  thumbActive:  { borderColor: '#1a1a1a' },
  infoSection:  {},
  breadcrumb:   { fontSize: 13, color: '#888', marginBottom: 12 },
  brandLabel:   { fontSize: 13, color: '#888', marginBottom: 4 },
  title:        { fontSize: 28, fontWeight: 700, margin: '0 0 12px', lineHeight: 1.2 },
  ratingRow:    { fontSize: 18, color: '#f6ad55', marginBottom: 16 },
  priceBlock:   { display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 16 },
  finalPrice:   { fontSize: 32, fontWeight: 700 },
  origPrice:    { fontSize: 18, color: '#aaa', textDecoration: 'line-through' },
  shortDesc:    { fontSize: 15, color: '#555', lineHeight: 1.7, marginBottom: 16 },
  stockRow:     { marginBottom: 20 },
  addToCart:    { display: 'flex', gap: 16, alignItems: 'center', marginBottom: 24 },
  qtyRow:       { display: 'flex', alignItems: 'center', border: '1px solid #e2e2e2', borderRadius: 8, overflow: 'hidden' },
  qtyBtn:       { width: 36, height: 44, background: 'none', border: 'none', fontSize: 18, cursor: 'pointer' },
  qtyVal:       { width: 44, textAlign: 'center', fontSize: 16, fontWeight: 600 },
  cartBtn:      { flex: 1, padding: '12px 24px', background: '#1a1a1a', color: '#fff', border: 'none', borderRadius: 8, fontSize: 16, fontWeight: 600, cursor: 'pointer' },
  tags:         { display: 'flex', gap: 8, flexWrap: 'wrap' },
  tag:          { padding: '4px 12px', background: '#f5f5f5', borderRadius: 20, fontSize: 13, color: '#555', textDecoration: 'none' },
  descSection:  { borderTop: '1px solid #eee', paddingTop: 32, marginBottom: 40 },
  sectionTitle: { fontSize: 22, fontWeight: 700, marginBottom: 16 },
  descText:     { fontSize: 15, lineHeight: 1.8, color: '#444' },
  relatedSection:{ borderTop: '1px solid #eee', paddingTop: 32 },
  relatedGrid:  { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 16 },
  relatedCard:  { textDecoration: 'none', color: 'inherit' },
  relatedImg:   { width: '100%', aspectRatio: '1', objectFit: 'cover', borderRadius: 8, background: '#f5f5f5' },
  relatedName:  { fontSize: 14, fontWeight: 600, marginTop: 8, marginBottom: 4 },
  relatedPrice: { fontSize: 14, color: '#e53e3e', fontWeight: 700 },
};