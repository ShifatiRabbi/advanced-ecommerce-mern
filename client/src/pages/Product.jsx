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

  const [selectedVariants, setSelectedVariants] = useState({});

  const selectVariantOption = (variantName, option) => {
    setSelectedVariants(prev => ({ ...prev, [variantName]: option }));
  };

  const variantPriceAdj = Object.values(selectedVariants).reduce(
    (sum, opt) => sum + (opt.priceModifier || 0),
    0
  );

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

            {/* Variant Picker */}
            {product.variants?.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                {product.variants.map((variant) => (
                  <div key={variant.name} style={{ marginBottom: 14 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: '#374151' }}>
                      {variant.name}
                      {selectedVariants[variant.name] && (
                        <span style={{ fontWeight: 400, color: '#6b7280', marginLeft: 8 }}>
                          — {selectedVariants[variant.name].label}
                        </span>
                      )}
                    </p>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {variant.options?.map((opt) => {
                        const isSelected = selectedVariants[variant.name]?.label === opt.label;
                        const outOfStock = opt.stock === 0;
                        return (
                          <button
                            key={opt.label}
                            onClick={() => !outOfStock && selectVariantOption(variant.name, opt)}
                            disabled={outOfStock}
                            style={{
                              padding: '7px 16px',
                              border: `2px solid ${isSelected ? '#111827' : '#d1d5db'}`,
                              borderRadius: 8,
                              background: isSelected ? '#111827' : '#fff',
                              color: isSelected ? '#fff' : outOfStock ? '#d1d5db' : '#374151',
                              cursor: outOfStock ? 'not-allowed' : 'pointer',
                              fontSize: 14,
                              fontWeight: isSelected ? 600 : 400,
                              textDecoration: outOfStock ? 'line-through' : 'none',
                              position: 'relative',
                            }}>
                            {opt.label}
                            {opt.priceModifier !== 0 && (
                              <span style={{ fontSize: 11, marginLeft: 4, opacity: 0.8 }}>
                                {opt.priceModifier > 0 ? '+' : ''}৳{opt.priceModifier}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
                {variantPriceAdj !== 0 && (
                  <p style={{ fontSize: 13, color: '#059669', fontWeight: 600 }}>
                    Variant adjustment: {variantPriceAdj > 0 ? '+' : ''}৳{variantPriceAdj}
                  </p>
                )}
              </div>
            )}

            {/* Add to Cart and WishList */}
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
          </div>
        </div>
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