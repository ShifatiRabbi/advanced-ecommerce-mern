import { useState, useRef, useCallback, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import { useCartStore } from '../store/cartStore';
import { useAuthStore } from '../store/authStore';
import ProductTimer from '../components/ProductTimer';
import MarqueeBar from '../components/MarqueeBar';
import ReviewSection from '../components/ReviewSection';
import { useWishlistStore } from '../store/wishlistStore';
import { useMemo } from 'react';

export default function ProductPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { addItem } = useCartStore();
  const { user } = useAuthStore();

  const [activeImg, setActiveImg] = useState(0);
  const [qty, setQty] = useState(1);
  const [selVariants, setSelVariants] = useState({});
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });
  const [isZooming, setIsZooming] = useState(false);
  const { toggle, isWishlisted, fetchWishlist } = useWishlistStore();
  const imgRef = useRef(null);

  const { data: product, isLoading, isError } = useQuery({
    queryKey: ['product', slug],
    queryFn: () => api.get(`/products/slug/${slug}`).then(r => r.data.data),
    enabled: !!slug,
  });

  const { data: related = [] } = useQuery({
    queryKey: ['related', slug],
    queryFn: () => api.get(`/products/slug/${slug}/related`).then(r => r.data.data),
    enabled: !!slug,
  });

  // Compute variant price range
  const allVariantPrices = product?.variants?.flatMap(v =>
    v.options?.map(o => (product.discountPrice || product.price) + (o.priceModifier || 0)) || []
  ) || [];

  const minVariantPrice = allVariantPrices.length
    ? Math.min(...allVariantPrices)
    : (product?.discountPrice || product?.price || 0);

  const maxVariantPrice = allVariantPrices.length
    ? Math.max(...allVariantPrices)
    : (product?.discountPrice || product?.price || 0);

  const hasVariantRange = minVariantPrice !== maxVariantPrice;

  // Default select first available option for each variant on mount
  // useEffect(() => {
  //   if (!product?.variants?.length) return;

  //   const defaults = {};
  //   product.variants.forEach(variant => {
  //     if (!variant.options?.length) return;

  //     const defaultIdx = variant.defaultOptionIndex ?? 0;
  //     let selectedOpt = variant.options[defaultIdx];

  //     // If default option is out of stock, pick the first in-stock option
  //     if (!selectedOpt || selectedOpt.stock <= 0) {
  //       selectedOpt = variant.options.find(o => o.stock > 0);
  //     }

  //     if (selectedOpt) {
  //       defaults[variant.name] = selectedOpt;
  //     }
  //   });

  //   setSelVariants(defaults);
  // }, [product]);
  const defaultVariants = useMemo(() => {
    if (!product?.variants?.length) return {};

    const defaults = {};

    product.variants.forEach(variant => {
      if (!variant.options?.length) return;

      const defaultIdx = variant.defaultOptionIndex ?? 0;
      let selectedOpt = variant.options[defaultIdx];

      if (!selectedOpt || selectedOpt.stock <= 0) {
        selectedOpt = variant.options.find(o => o.stock > 0);
      }

      if (selectedOpt) {
        defaults[variant.name] = selectedOpt;
      }
    });

    return defaults;
  }, [product]);

  useEffect(() => {
    setSelVariants(defaultVariants);
  }, [defaultVariants]);

  useEffect(() => { if (user) fetchWishlist(); }, [user, fetchWishlist]);

  const handleMouseMove = useCallback((e) => {
    const rect = imgRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomPos({ x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) });
  }, []);

  if (isLoading) return <div style={ps.loadingPage}>Loading...</div>;
  if (isError || !product) return (
    <div style={ps.loadingPage}>
      Product not found. <Link to="/shop">Browse shop</Link>
    </div>
  );

  const discount = product.discountPrice
    ? Math.round(((product.price - product.discountPrice) / product.price) * 100)
    : 0;

  const finalBasePrice = product.discountPrice || product.price;
  const variantAdj = Object.values(selVariants).reduce((sum, opt) => sum + (opt?.priceModifier || 0), 0);
  const displayPrice = finalBasePrice + variantAdj;

  const handleAddToCart = () => addItem({ ...product, selectedVariants: selVariants }, qty);
  const handleBuyNow = () => { handleAddToCart(); navigate('/checkout'); };

  // Determine if we should show selected price or price range
  const hasSelectedVariants = Object.keys(selVariants).length > 0 || !product.variants?.length;

  return (
    <>
      <Helmet>
        <title>{product.meta?.title || product.name}</title>
        <meta name="description" content={product.meta?.description || product.shortDesc} />
        {product.images?.[0] && <meta property="og:image" content={product.images[0].url} />}
        <meta name="keywords" content={product.meta?.keywords?.join(', ') || product.tags?.join(', ')} />
        <meta property="og:title" content={product.name} />
        <meta property="og:image" content={product.images?.[0]?.url} />
        <meta property="og:description" content={product.shortDesc} />
      </Helmet>

      <MarqueeBar position="below-header" page="/product" productId={product._id} categoryId={product.category?._id} />

      <div style={ps.page}>
        {/* Breadcrumb */}
        <nav style={ps.breadcrumb}>
          <Link to="/" style={ps.breadLink}>Home</Link>
          <span style={ps.breadSep}> › </span>
          <Link to="/shop" style={ps.breadLink}>Products</Link>
          <span style={ps.breadSep}> › </span>
          <span style={ps.breadCurrent}>{product.name}</span>
        </nav>
        <Link to="/shop" style={ps.backLink}>‹ All Products</Link>

        <div style={ps.mainGrid}>
          {/* Image Column */}
          <div style={ps.imageCol}>
            <div
              ref={imgRef}
              style={{
                ...ps.mainImgWrap,
                cursor: isZooming ? 'zoom-in' : 'crosshair',
              }}
              onMouseMove={handleMouseMove}
              onMouseEnter={() => setIsZooming(true)}
              onMouseLeave={() => setIsZooming(false)}
            >
              {discount > 0 && <span style={ps.discBadge}>{discount}% OFF</span>}

              {product.images?.[activeImg] && (
                <img
                  src={product.images[activeImg].url}
                  alt={product.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
              )}

              {isZooming && product.images?.[activeImg] && (
                <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      backgroundImage: `url(${product.images[activeImg].url})`,
                      backgroundSize: '250%',
                      backgroundPosition: `${zoomPos.x}% ${zoomPos.y}%`,
                      backgroundRepeat: 'no-repeat',
                      opacity: 0.92,
                    }}
                  />
                </div>
              )}

              <div style={ps.imgCounter}>
                {activeImg + 1} / {product.images?.length || 1}
              </div>
            </div>

            {product.images?.length > 1 && (
              <div style={ps.thumbStrip}>
                {product.images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImg(i)}
                    style={{
                      ...ps.thumb,
                      ...(activeImg === i && ps.thumbActive),
                    }}
                  >
                    <img src={img.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info Column */}
          <div style={ps.infoCol}>
            {product.brand && (
              <p style={ps.brandLine}>
                <Link to={`/shop?brand=${product.brand._id}`} style={{ color: '#2e7d32', fontWeight: 700, textDecoration: 'none' }}>
                  {product.brand.name}
                </Link>
              </p>
            )}

            <h1 style={ps.title}>{product.name}</h1>

            <div style={ps.ratingRow}>
              {'★'.repeat(Math.round(product.ratings?.average || 0))}
              {'☆'.repeat(5 - Math.round(product.ratings?.average || 0))}
              <span style={{ marginLeft: 6, fontSize: 13, color: '#666' }}>
                ({product.ratings?.count || 0} reviews)
              </span>
            </div>

            {/* Updated Price Section */}
            <div style={ps.priceRow}>
              {hasSelectedVariants ? (
                // Show selected variant price
                <>
                  <span style={ps.finalPrice}>৳{displayPrice.toLocaleString()}</span>
                  {product.discountPrice && (
                    <span style={ps.origPrice}>৳{product.price.toLocaleString()}</span>
                  )}
                  {discount > 0 && <span style={ps.discPill}>{discount}% OFF</span>}
                </>
              ) : (
                // Show price range before selection
                <>
                  <span style={ps.finalPrice}>
                    ৳{minVariantPrice.toLocaleString()}
                    {hasVariantRange && ` – ৳${maxVariantPrice.toLocaleString()}`}
                  </span>
                  {product.discountPrice && (
                    <span style={ps.origPrice}>৳{product.price.toLocaleString()}</span>
                  )}
                </>
              )}
            </div>

            <ProductTimer productId={product._id} categoryId={product.category?._id} position="above-price" />

            {/* Variant Selectors */}
            {product.variants?.map(variant => (
              <div key={variant.name} style={ps.variantBlock}>
                <p style={ps.variantLabel}>Select {variant.name}:</p>
                {variant.options?.map(opt => {
                  const isSelected = selVariants[variant.name]?.label === opt.label;
                  const isOOS = opt.stock === 0;

                  return (
                    <label
                      key={opt.label}
                      style={{
                        ...ps.variantRow,
                        ...(isSelected && ps.variantRowActive),
                        ...(isOOS && ps.variantRowOOS),
                      }}
                      onClick={() => !isOOS && setSelVariants(prev => ({ ...prev, [variant.name]: opt }))}
                    >
                      <div style={ps.variantRadio}>
                        <div style={{
                          width: 14, height: 14, borderRadius: '50%',
                          border: `2px solid ${isSelected ? '#2e7d32' : '#ccc'}`,
                          background: isSelected ? '#2e7d32' : '#fff',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          {isSelected && <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff' }} />}
                        </div>
                      </div>

                      <div style={{ width: 36, height: 36, borderRadius: 4, overflow: 'hidden', background: '#f5f5f5', flexShrink: 0 }}>
                        {product.images?.[0] && <img src={product.images[0].url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                      </div>

                      <div style={{ flex: 1 }}>
                        <span style={{ fontWeight: 600, fontSize: 14 }}>{opt.label}</span>
                        {isOOS && <span style={{ marginLeft: 8, fontSize: 12, color: '#dc2626' }}>Out of stock</span>}
                        {discount > 0 && !isOOS && (
                          <span style={{ marginLeft: 8, fontSize: 11, background: '#dc2626', color: '#fff', padding: '1px 6px', borderRadius: 4, fontWeight: 700 }}>
                            {discount}% OFF
                          </span>
                        )}
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        {opt.priceModifier !== 0 && (
                          <span style={{ fontSize: 11, color: '#888', textDecoration: 'line-through', display: 'block' }}>
                            ৳{(finalBasePrice + (opt.priceModifier || 0)).toLocaleString()}
                          </span>
                        )}
                        <span style={{ fontWeight: 700, fontSize: 15, color: '#111' }}>
                          ৳{(finalBasePrice + (opt.priceModifier || 0)).toLocaleString()}
                        </span>
                      </div>
                    </label>
                  );
                })}
              </div>
            ))}

            {/* Stock Status */}
            <p style={{
              fontSize: 14,
              fontWeight: 600,
              marginBottom: 16,
              color: product.stock > 0 ? '#2e7d32' : '#dc2626'
            }}>
              {product.stock > 0 ? `In Stock (${product.stock} available)` : 'Out of Stock'}
            </p>

            {/* Quantity + Buttons */}
            {product.stock > 0 && (
              <div style={ps.actionRow}>
                <div style={ps.qtyControl}>
                  <button style={ps.qtyBtn} onClick={() => setQty(q => Math.max(1, q - 1))}>−</button>
                  <span style={ps.qtyVal}>{qty}</span>
                  <button style={ps.qtyBtn} onClick={() => setQty(q => Math.min(product.stock, q + 1))}>+</button>
                </div>
                <button onClick={handleAddToCart} style={ps.addCartBtn}>
                  🛒 Add to Cart
                </button>
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
                <button onClick={handleBuyNow} style={ps.buyNowBtn}>
                  ⚡ Buy Now
                </button>
              </div>
            )}

            {/* Trust Badges */}
            <div style={ps.trustRow}>
              {[
                { icon: '🚚', title: 'Fast Delivery', sub: '2-5 days' },
                { icon: '✅', title: '100% Original', sub: 'With guarantee' },
                { icon: '↩️', title: 'Easy Return', sub: 'Within 7 days' },
              ].map(b => (
                <div key={b.title} style={ps.trustBadge}>
                  <span style={{ fontSize: 20 }}>{b.icon}</span>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 700, margin: 0 }}>{b.title}</p>
                    <p style={{ fontSize: 11, color: '#888', margin: 0 }}>{b.sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Product Details */}
        <section style={ps.detailSection}>
          <h2 style={ps.sectionTitle}>Product Details</h2>
          <div style={ps.detailGrid}>
            {[
              { label: 'Brand', value: product.brand?.name },
              { label: 'Category', value: product.category?.name },
              { label: 'SKU', value: product.sku },
              { label: 'Weight', value: product.weight ? `${product.weight}g` : null },
              { label: 'Stock', value: product.stock },
              { label: 'Tags', value: product.tags?.join(', ') },
            ].filter(r => r.value).map(row => (
              <div key={row.label} style={ps.detailRow}>
                <span style={ps.detailKey}>{row.label}:</span>
                <span style={ps.detailVal}>{row.value}</span>
              </div>
            ))}
          </div>
          {product.description && (
            <div
              style={{ marginTop: 20, fontSize: 15, lineHeight: 1.8, color: '#333' }}
              dangerouslySetInnerHTML={{ __html: product.description }}
            />
          )}
        </section>

        <ReviewSection product={product} />

        {/* Related Products */}
        {related.length > 0 && (
          <section style={ps.relatedSection}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <div style={{ width: 4, height: 24, background: '#2e7d32', borderRadius: 2 }} />
              <span style={{ fontSize: 12, fontWeight: 700, color: '#2e7d32', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Related</span>
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 20px' }}>Related Products</h2>
            <div style={ps.relatedGrid}>
              {related.map(p => (
                <div key={p._id} style={ps.relatedCard}>
                  <Link to={`/product/${p.slug}`} style={{ display: 'block', aspectRatio: '1', overflow: 'hidden', background: '#f5f5f5' }}>
                    {p.images?.[0] && (
                      <img
                        src={p.images[0].url}
                        alt={p.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform .3s' }}
                        onMouseEnter={e => e.target.style.transform = 'scale(1.05)'}
                        onMouseLeave={e => e.target.style.transform = 'scale(1)'}
                      />
                    )}
                  </Link>
                  <div style={{ padding: '12px 10px' }}>
                    <Link to={`/product/${p.slug}`} style={{ textDecoration: 'none', color: '#111', fontSize: 14, fontWeight: 600, display: 'block', marginBottom: 6, lineHeight: 1.3 }}>
                      {p.name}
                    </Link>
                    <p style={{ fontSize: 16, fontWeight: 700, margin: '0 0 10px', color: '#2e7d32' }}>
                      ৳{(p.discountPrice || p.price).toLocaleString()}
                    </p>
                    <button
                      onClick={() => { addItem(p, 1); navigate('/checkout'); }}
                      style={{ width: '100%', padding: '9px', background: '#2e7d32', color: '#fff', border: 'none', borderRadius: 6, fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                    >
                      ⚡ Buy Now
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  );
}

// Styles (unchanged)
const ps = {
  loadingPage: { padding: '80px 24px', textAlign: 'center' },
  page: { maxWidth: 1200, margin: '0 auto', padding: '16px 20px 48px' },
  breadcrumb: { fontSize: 13, color: '#666', marginBottom: 6, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 2 },
  breadLink: { color: '#2e7d32', textDecoration: 'none' },
  breadSep: { color: '#ccc' },
  breadCurrent: { color: '#333' },
  backLink: { display: 'inline-block', fontSize: 13, color: '#2e7d32', textDecoration: 'none', marginBottom: 16 },
  mainGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40, marginBottom: 48, alignItems: 'start' },
  imageCol: {},
  mainImgWrap: { position: 'relative', aspectRatio: '1', overflow: 'hidden', borderRadius: 8, border: '1px solid #eee', background: '#fafafa', marginBottom: 10 },
  discBadge: { position: 'absolute', top: 12, right: 12, zIndex: 3, background: '#dc2626', color: '#fff', fontSize: 13, fontWeight: 800, padding: '4px 10px', borderRadius: 4 },
  imgCounter: { position: 'absolute', bottom: 10, right: 14, background: 'rgba(0,0,0,0.45)', color: '#fff', fontSize: 12, padding: '3px 8px', borderRadius: 20 },
  thumbStrip: { display: 'flex', gap: 8, flexWrap: 'wrap' },
  thumb: { width: 64, height: 64, borderRadius: 6, overflow: 'hidden', border: '2px solid #eee', cursor: 'pointer', background: '#fafafa', padding: 0, flexShrink: 0 },
  thumbActive: { borderColor: '#2e7d32' },
  infoCol: {},
  brandLine: { fontSize: 14, margin: '0 0 6px' },
  title: { fontSize: 22, fontWeight: 800, lineHeight: 1.3, margin: '0 0 10px', color: '#111' },
  ratingRow: { fontSize: 18, color: '#f59e0b', marginBottom: 12, display: 'flex', alignItems: 'center' },
  priceRow: { display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 16, flexWrap: 'wrap' },
  finalPrice: { fontSize: 28, fontWeight: 800, color: '#2e7d32', fontFamily: 'sans-serif' },
  origPrice: { fontSize: 16, color: '#999', textDecoration: 'line-through' },
  discPill: { fontSize: 12, fontWeight: 700, background: '#dc2626', color: '#fff', padding: '3px 8px', borderRadius: 4 },
  variantBlock: { marginBottom: 16 },
  variantLabel: { fontSize: 14, fontWeight: 700, marginBottom: 8, color: '#222' },
  variantRow: { display: 'flex', alignItems: 'center', gap: 10, border: '1px solid #e5e7eb', borderRadius: 8, padding: '10px 12px', marginBottom: 6, cursor: 'pointer', transition: 'border-color .15s' },
  variantRowActive: { border: '2px solid #2e7d32', background: '#f0fdf4' },
  variantRowOOS: { opacity: 0.5, cursor: 'not-allowed' },
  variantRadio: { flexShrink: 0 },
  actionRow: { display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' },
  qtyControl: { display: 'flex', alignItems: 'center', border: '1px solid #d1d5db', borderRadius: 8, overflow: 'hidden', height: 44 },
  qtyBtn: { width: 40, height: '100%', background: '#f9fafb', border: 'none', fontSize: 18, cursor: 'pointer', fontWeight: 700 },
  qtyVal: { width: 48, textAlign: 'center', fontSize: 16, fontWeight: 700 },
  addCartBtn: { flex: 1, minWidth: 140, height: 44, border: '2px solid #2e7d32', background: '#fff', color: '#2e7d32', fontWeight: 700, fontSize: 15, borderRadius: 8, cursor: 'pointer' },
  buyNowBtn: { flex: 1, minWidth: 140, height: 44, background: '#2e7d32', color: '#fff', border: 'none', fontWeight: 700, fontSize: 15, borderRadius: 8, cursor: 'pointer' },
  trustRow: { display: 'flex', gap: 10, marginTop: 16 },
  trustBadge: { flex: 1, display: 'flex', alignItems: 'center', gap: 8, border: '1px solid #e5e7eb', borderRadius: 8, padding: '10px 10px', background: '#fafafa' },
  detailSection: { marginBottom: 48 },
  sectionTitle: { fontSize: 18, fontWeight: 800, margin: '0 0 16px', paddingBottom: 10, borderBottom: '2px solid #e5e7eb' },
  detailGrid: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '4px 32px', marginBottom: 16 },
  detailRow: { display: 'flex', gap: 8, padding: '6px 0', borderBottom: '1px solid #f3f4f6', fontSize: 14 },
  detailKey: { fontWeight: 700, color: '#333', minWidth: 100, flexShrink: 0 },
  detailVal: { color: '#555' },
  relatedSection: { marginBottom: 48 },
  relatedGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 },
  relatedCard: { border: '1px solid #e5e7eb', borderRadius: 10, overflow: 'hidden', background: '#fff' },
};