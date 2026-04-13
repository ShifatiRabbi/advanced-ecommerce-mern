import { useState, useRef, useCallback, useEffect } from 'react';
import { useParams, Link, useNavigate }              from 'react-router-dom';
import { Helmet }                                    from 'react-helmet-async';
import { useQuery }                                  from '@tanstack/react-query';
import api                                           from '../services/api';
import { useAddToCart }                              from '../hooks/useAddToCart';
import ProductTimer                                  from '../components/ProductTimer';
import MarqueeBar                                    from '../components/MarqueeBar';
import ReviewSection                                 from '../components/ReviewSection';

export default function ProductPage() {
  const { slug }    = useParams();
  const navigate    = useNavigate();
  const addToCart   = useAddToCart();

  const [activeImg,     setActiveImg]     = useState(0);
  const [qty,           setQty]           = useState(1);
  const [selVariants,   setSelVariants]   = useState({});  // { 'Size': { label:'XL', priceModifier:50, stock:10 } }
  const [zoomPos,       setZoomPos]       = useState({ x: 50, y: 50 });
  const [isZooming,     setIsZooming]     = useState(false);
  const imgRef = useRef(null);

  const { data: product, isLoading } = useQuery({
    queryKey: ['product', slug],
    queryFn:  () => api.get(`/products/slug/${slug}`).then(r => r.data.data),
    enabled:  !!slug,
  });

  const { data: related = [] } = useQuery({
    queryKey: ['related', product?._id],
    queryFn:  () => api.get(`/products/${product._id}/related`).then(r => r.data.data),
    enabled:  !!product?._id,
  });

  // ── Auto-select default variant option on load ────────────────────────────
  useEffect(() => {
    if (!product?.variants?.length) return;
    const defaults = {};
    product.variants.forEach(variant => {
      const defIdx = variant.defaultOptionIndex ?? 0;
      // pick default if in stock, else first in-stock
      const opt =
        (variant.options?.[defIdx]?.stock !== 0 ? variant.options?.[defIdx] : null) ??
        variant.options?.find(o => o.stock !== 0) ??
        variant.options?.[0];
      if (opt) defaults[variant.name] = opt;
    });
    setSelVariants(defaults);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product]);

  useEffect(() => {
    setActiveImg(0);
  }, [slug, selVariants]);

  // ── Zoom on hover ──────────────────────────────────────────────────────────
  const handleMouseMove = useCallback((e) => {
    const rect = imgRef.current?.getBoundingClientRect();
    if (!rect) return;
    setZoomPos({
      x: Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100)),
      y: Math.max(0, Math.min(100, ((e.clientY - rect.top)  / rect.height) * 100)),
    });
  }, []);

  if (isLoading) return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 20px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40 }}>
        {[1, 2].map(n => (
          <div key={n} style={{ background: '#f3f4f6', borderRadius: 12, height: 420, animation: 'pulse 1.5s ease-in-out infinite' }} />
        ))}
      </div>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}`}</style>
    </div>
  );

  if (!product) return (
    <div style={{ textAlign: 'center', padding: '80px 24px' }}>
      <p style={{ marginBottom: 16, color: '#6b7280' }}>Product not found.</p>
      <Link to="/shop" style={{ color: '#2e7d32', fontWeight: 700 }}>Browse Shop</Link>
    </div>
  );

  // ── Price calculations ─────────────────────────────────────────────────────
  const baseRegularPrice = product.basePrice ?? product.price ?? 0;
  const basePrice    = product.discountPrice ?? baseRegularPrice;
  const variantAdj   = Object.values(selVariants).reduce((s, o) => s + (o?.priceModifier ?? 0), 0);
  const displayPrice = basePrice + variantAdj;
  const discount     = product.discountPrice
    ? Math.round(((product.price - product.discountPrice) / product.price) * 100) : 0;

  // Price range across all variants (shown before selection)
  const allPrices = product.variants?.flatMap(v =>
    (v.options || []).map(o => basePrice + (o.priceModifier ?? 0))
  ) ?? [];
  const minPrice = allPrices.length ? Math.min(...allPrices) : basePrice;
  const maxPrice = allPrices.length ? Math.max(...allPrices) : basePrice;
  const hasRange = minPrice !== maxPrice;

  // Total selected variants count vs total variants required
  const variantsSelected  = Object.keys(selVariants).length;
  const variantsRequired  = product.variants?.length ?? 0;
  const allVariantsChosen = variantsSelected >= variantsRequired;

  const handleAddToCart = () => addToCart(product, qty, selVariants);
  const handleBuyNow    = () => {
    const ok = addToCart(product, qty, selVariants);
    if (ok) navigate('/checkout');
  };

  const selectedVariantImage =
    Object.values(selVariants).find((opt) => opt?.images?.[0]?.url)?.images?.[0]?.url
    || null;
  const galleryImages = selectedVariantImage
    ? [{ url: selectedVariantImage }, ...(product.images || [])]
    : (product.images || []);
  const currentImage = galleryImages[activeImg];
  const selectedStocks = Object.values(selVariants)
    .map((opt) => opt?.stock)
    .filter((stock) => Number.isFinite(stock));
  const availableStock = selectedStocks.length
    ? Math.min(...selectedStocks)
    : (product.totalStock ?? product.stock ?? 0);

  return (
    <>
      <Helmet>
        <title>{product.meta?.title || product.name}</title>
        <meta name="description" content={product.meta?.description || product.shortDesc || ''} />
      </Helmet>

      <MarqueeBar position="below-header" productId={product._id} categoryId={product.category?._id} />

      <div style={S.page}>

        {/* Breadcrumb */}
        <nav style={S.breadcrumb}>
          <Link to="/" style={S.breadLink}>Home</Link>
          <span style={S.sep}> › </span>
          <Link to="/shop" style={S.breadLink}>Products</Link>
          {product.category && <>
            <span style={S.sep}> › </span>
            <Link to={`/shop?category=${product.category._id}`} style={S.breadLink}>
              {product.category.name}
            </Link>
          </>}
          <span style={S.sep}> › </span>
          <span style={{ color: '#374151', fontSize: 13 }}>{product.name}</span>
        </nav>

        <Link to="/shop" style={{ display: 'inline-block', fontSize: 13, color: '#2e7d32', textDecoration: 'none', marginBottom: 16 }}>
          ‹ All Products
        </Link>

        {/* ── Two-column layout ───────────────────────────────────────────── */}
        <div style={S.grid}>

          {/* ── LEFT: Images ──────────────────────────────────────────────── */}
          <div>
            {/* Main image with zoom */}
            <div
              ref={imgRef}
              style={{ ...S.mainImg, cursor: isZooming ? 'crosshair' : 'default' }}
              onMouseMove={handleMouseMove}
              onMouseEnter={() => setIsZooming(true)}
              onMouseLeave={() => setIsZooming(false)}>

              {discount > 0 && (
                <span style={S.discBadge}>{discount}% OFF</span>
              )}

              {currentImage ? (
                <>
                  {/* Base image */}
                  <img
                    src={currentImage.url}
                    alt={product.name}
                    style={{
                      position: 'absolute', inset: 0,
                      width: '100%', height: '100%', objectFit: 'cover',
                      opacity: isZooming ? 0 : 1, transition: 'opacity .15s',
                    }} />
                  {/* Zoomed view */}
                  <div style={{
                    position: 'absolute', inset: 0,
                    backgroundImage:    `url(${currentImage.url})`,
                    backgroundRepeat:   'no-repeat',
                    backgroundSize:     '250%',
                    backgroundPosition: `${zoomPos.x}% ${zoomPos.y}%`,
                    opacity: isZooming ? 1 : 0,
                    transition: 'opacity .15s',
                  }} />
                </>
              ) : (
                <div style={{ position: 'absolute', inset: 0, background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af' }}>
                  No image
                </div>
              )}

              <span style={S.imgCounter}>
                {activeImg + 1} / {galleryImages.length || 1}
              </span>
            </div>

            {/* Thumbnails */}
            {galleryImages.length > 1 && (
              <div style={S.thumbRow}>
                {galleryImages.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImg(i)}
                    style={{ ...S.thumb, ...(activeImg === i ? S.thumbActive : {}) }}>
                    <img src={img.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── RIGHT: Info ───────────────────────────────────────────────── */}
          <div>
            {product.brand && (
              <p style={{ fontSize: 13, color: '#6b7280', margin: '0 0 6px' }}>{product.brand.name}</p>
            )}

            <h1 style={S.title}>{product.name}</h1>

            {/* Rating */}
            {product.ratings?.count > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                <span style={{ color: '#f59e0b', fontSize: 18 }}>
                  {'★'.repeat(Math.round(product.ratings.average))}
                  {'☆'.repeat(5 - Math.round(product.ratings.average))}
                </span>
                <span style={{ fontSize: 13, color: '#6b7280' }}>
                  ({product.ratings.count} reviews)
                </span>
              </div>
            )}

            {/* Price */}
            <div style={S.priceBlock}>
              {allVariantsChosen || !product.variants?.length ? (
                /* Show exact selected price */
                <>
                  <span style={S.priceMain}>৳{displayPrice.toLocaleString()}</span>
                  {product.discountPrice && (
                    <span style={S.priceOrig}>৳{product.price.toLocaleString()}</span>
                  )}
                  {discount > 0 && (
                    <span style={S.discPill}>{discount}% OFF</span>
                  )}
                </>
              ) : (
                /* Show range before selection */
                <>
                  <span style={S.priceMain}>
                    ৳{minPrice.toLocaleString()}
                    {hasRange && ` – ৳${maxPrice.toLocaleString()}`}
                  </span>
                  {product.discountPrice && (
                    <span style={S.priceOrig}>৳{product.price.toLocaleString()}</span>
                  )}
                </>
              )}
            </div>

            {/* Timer */}
            <ProductTimer
              productId={product._id}
              categoryId={product.category?._id}
              position="above-price" />

            {/* ── Variant selector rows ──────────────────────────────────── */}
            {product.variants?.map(variant => (
              <div key={variant.name} style={{ marginBottom: 18 }}>
                <p style={{ fontSize: 13, fontWeight: 700, margin: '0 0 8px', color: '#111' }}>
                  Select {variant.name}:
                  {selVariants[variant.name] && (
                    <span style={{ fontWeight: 400, color: '#6b7280', marginLeft: 8 }}>
                      {selVariants[variant.name].label}
                    </span>
                  )}
                </p>
                {variant.options?.map((opt) => {
                  const isSelected = selVariants[variant.name]?.label === opt.label;
                  const isOOS      = opt.stock === 0;
                  const optPrice   = basePrice + (opt.priceModifier ?? 0);

                  return (
                    <div
                      key={opt.label}
                      onClick={() => { if (!isOOS) setSelVariants(p => ({ ...p, [variant.name]: opt })); }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        border: `${isSelected ? 2 : 1}px solid ${isSelected ? '#2e7d32' : '#e5e7eb'}`,
                        borderRadius: 8, padding: '9px 12px', marginBottom: 6,
                        cursor: isOOS ? 'not-allowed' : 'pointer',
                        background: isSelected ? '#f0fdf4' : '#fff',
                        opacity: isOOS ? 0.5 : 1,
                        transition: 'border-color .15s, background .15s',
                      }}>

                      {/* Radio indicator */}
                      <div style={{
                        width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
                        border: `2px solid ${isSelected ? '#2e7d32' : '#d1d5db'}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: isSelected ? '#2e7d32' : '#fff',
                      }}>
                        {isSelected && <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#fff' }} />}
                      </div>

                      {/* Variant thumbnail */}
                      {(opt.images?.[0]?.url || product.images?.[0]?.url) && (
                        <div style={{ width: 36, height: 36, borderRadius: 4, overflow: 'hidden', flexShrink: 0 }}>
                          <img src={opt.images?.[0]?.url || product.images?.[0]?.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                      )}

                      {/* Label + badges */}
                      <div style={{ flex: 1 }}>
                        <span style={{ fontWeight: 600, fontSize: 14 }}>{opt.label}</span>
                        {isOOS ? (
                          <span style={{ marginLeft: 8, fontSize: 11, color: '#dc2626', fontWeight: 600 }}>Out of stock</span>
                        ) : (
                          <>
                            {discount > 0 && (
                              <span style={{ marginLeft: 8, fontSize: 11, background: '#dc2626', color: '#fff', padding: '1px 6px', borderRadius: 3, fontWeight: 700 }}>
                                {discount}% OFF
                              </span>
                            )}
                            <span style={{ marginLeft: 8, fontSize: 12, color: '#6b7280' }}>({opt.stock} left)</span>
                          </>
                        )}
                      </div>

                      {/* Price for this option */}
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        {product.discountPrice && (
                          <div style={{ fontSize: 11, color: '#9ca3af', textDecoration: 'line-through' }}>
                            ৳{(product.price + (opt.priceModifier ?? 0)).toLocaleString()}
                          </div>
                        )}
                        <div style={{ fontWeight: 700, fontSize: 15, color: '#111' }}>
                          ৳{optPrice.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}

            {/* Timer below price */}
            <ProductTimer
              productId={product._id}
              categoryId={product.category?._id}
              position="below-price" />

            {/* Stock badge */}
            <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 16,
              color: availableStock > 0 ? '#2e7d32' : '#dc2626' }}>
              {availableStock > 0 ? `In Stock (${availableStock} available)` : 'Out of Stock'}
            </p>

            {/* Qty + Add to Cart + Buy Now */}
            <div style={S.actionRow}>
              <div style={S.qtyWrap}>
                <button style={S.qtyBtn} onClick={() => setQty(q => Math.max(1, q - 1))}>−</button>
                <span style={S.qtyNum}>{qty}</span>
                <button style={S.qtyBtn} onClick={() => setQty(q => q + 1)}>+</button>
              </div>
              <button
                onClick={handleAddToCart}
                disabled={availableStock === 0}
                style={{ ...S.btnOutline, flex: 1, opacity: availableStock === 0 ? 0.5 : 1 }}>
                🛒 Add to Cart
              </button>
              <button
                onClick={handleBuyNow}
                disabled={availableStock === 0}
                style={{ ...S.btnSolid, flex: 1, opacity: availableStock === 0 ? 0.5 : 1 }}>
                ⚡ Buy Now
              </button>
            </div>

            {/* Trust badges */}
            <div style={S.trustRow}>
              {[
                { icon: '🚚', label: 'Fast Delivery', sub: '2-5 days' },
                { icon: '✅', label: '100% Original', sub: 'Guaranteed' },
                { icon: '↩️', label: 'Easy Return',   sub: '7 days' },
              ].map(b => (
                <div key={b.label} style={S.trustItem}>
                  <span style={{ fontSize: 18 }}>{b.icon}</span>
                  <div>
                    <p style={{ fontSize: 12, fontWeight: 700, margin: 0 }}>{b.label}</p>
                    <p style={{ fontSize: 11, color: '#9ca3af', margin: 0 }}>{b.sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Product Details — full width ─────────────────────────────────── */}
        <section style={S.section}>
          <h2 style={S.secTitle}>Product Details</h2>
          <div style={S.detailGrid}>
            {[
              { k: 'Brand',    v: product.brand?.name },
              { k: 'Category', v: product.category?.name },
              { k: 'SKU',      v: product.sku },
              { k: 'Stock',    v: product.stock },
              { k: 'Tags',     v: product.tags?.join(', ') },
            ].filter(r => r.v).map(r => (
              <div key={r.k} style={S.detailRow}>
                <span style={S.detailKey}>{r.k}:</span>
                <span style={{ fontSize: 14, color: '#374151' }}>{r.v}</span>
              </div>
            ))}
          </div>
          {product.description && (
            <div
              dangerouslySetInnerHTML={{ __html: product.description }}
              style={{ marginTop: 20, fontSize: 15, lineHeight: 1.8, color: '#374151' }} />
          )}
        </section>

        {/* ── Reviews ────────────────────────────────────────────────────────── */}
        <ReviewSection product={product} />

        {/* ── Related Products ─────────────────────────────────────────────── */}
        {related.length > 0 && (
          <section style={S.section}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
              <div style={{ width: 4, height: 22, background: '#2e7d32', borderRadius: 2 }} />
              <span style={{ fontSize: 12, fontWeight: 700, color: '#2e7d32', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Related</span>
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 800, margin: '0 0 20px' }}>Related Products</h2>
            <div style={S.relatedGrid}>
              {related.map(p => <RelatedCard key={p._id} product={p} />)}
            </div>
          </section>
        )}
      </div>
    </>
  );
}

// ── Related product card with Add to Cart ────────────────────────────────────
function RelatedCard({ product }) {
  const addToCart = useAddToCart();
  const navigate  = useNavigate();
  const price     = product.discountPrice ?? product.price;
  const discount  = product.discountPrice
    ? Math.round(((product.price - product.discountPrice) / product.price) * 100) : 0;

  return (
    <div style={{ border: '1px solid #e5e7eb', borderRadius: 10, overflow: 'hidden', background: '#fff' }}>
      <Link to={`/product/${product.slug}`} style={{ display: 'block', aspectRatio: '1', overflow: 'hidden', background: '#f5f5f5', position: 'relative' }}>
        {product.images?.[0] && (
          <img src={product.images[0].url} alt={product.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform .3s' }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.06)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }} />
        )}
        {discount > 0 && (
          <span style={{ position: 'absolute', top: 8, right: 8, background: '#dc2626', color: '#fff', fontSize: 11, fontWeight: 700, padding: '2px 7px', borderRadius: 4 }}>
            {discount}%
          </span>
        )}
      </Link>
      <div style={{ padding: '10px 12px' }}>
        <Link to={`/product/${product.slug}`}
          style={{ textDecoration: 'none', color: '#111', fontSize: 13, fontWeight: 600, marginBottom: 6, lineHeight: 1.3,
            overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
          {product.name}
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
          <span style={{ fontSize: 15, fontWeight: 800, color: '#2e7d32' }}>৳{price.toLocaleString()}</span>
          {product.discountPrice && (
            <span style={{ fontSize: 12, color: '#9ca3af', textDecoration: 'line-through' }}>৳{product.price.toLocaleString()}</span>
          )}
        </div>
        {/* If no variants, show direct Add to Cart; if variants, go to product page */}
        {product.variants?.length > 0 ? (
          <button
            onClick={() => navigate(`/product/${product.slug}`)}
            style={{ width: '100%', padding: '8px', background: '#2e7d32', color: '#fff', border: 'none', borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            View Options
          </button>
        ) : (
          <button
            onClick={() => addToCart(product, 1, {})}
            disabled={product.stock === 0}
            style={{ width: '100%', padding: '8px', background: product.stock === 0 ? '#e5e7eb' : '#2e7d32', color: product.stock === 0 ? '#9ca3af' : '#fff', border: 'none', borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: product.stock === 0 ? 'not-allowed' : 'pointer' }}>
            {product.stock === 0 ? 'Out of Stock' : '+ Add to Cart'}
          </button>
        )}
      </div>
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const S = {
  page:       { maxWidth: 1200, margin: '0 auto', padding: '16px 20px 60px' },
  breadcrumb: { display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 2, fontSize: 13, marginBottom: 6 },
  breadLink:  { color: '#2e7d32', textDecoration: 'none' },
  sep:        { color: '#d1d5db' },
  grid:       { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40, marginBottom: 48, alignItems: 'start' },
  mainImg:    { position: 'relative', aspectRatio: '1', overflow: 'hidden', borderRadius: 8, border: '1px solid #e5e7eb', background: '#fafafa', marginBottom: 10 },
  discBadge:  { position: 'absolute', top: 12, right: 12, zIndex: 3, background: '#dc2626', color: '#fff', fontSize: 13, fontWeight: 800, padding: '4px 10px', borderRadius: 4 },
  imgCounter: { position: 'absolute', bottom: 10, right: 14, background: 'rgba(0,0,0,.4)', color: '#fff', fontSize: 12, padding: '2px 8px', borderRadius: 20 },
  thumbRow:   { display: 'flex', gap: 8, flexWrap: 'wrap' },
  thumb:      { width: 64, height: 64, borderRadius: 6, overflow: 'hidden', border: '2px solid #e5e7eb', cursor: 'pointer', padding: 0, background: '#fafafa', flexShrink: 0 },
  thumbActive:{ borderColor: '#2e7d32' },
  title:      { fontSize: 22, fontWeight: 800, lineHeight: 1.3, margin: '0 0 10px', color: '#111' },
  priceBlock: { display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 16, flexWrap: 'wrap' },
  priceMain:  { fontSize: 28, fontWeight: 900, color: '#2e7d32' },
  priceOrig:  { fontSize: 16, color: '#9ca3af', textDecoration: 'line-through' },
  discPill:   { fontSize: 12, fontWeight: 700, background: '#dc2626', color: '#fff', padding: '3px 8px', borderRadius: 4 },
  actionRow:  { display: 'flex', gap: 8, marginBottom: 20, alignItems: 'stretch', flexWrap: 'wrap' },
  qtyWrap:    { display: 'flex', alignItems: 'center', border: '1px solid #d1d5db', borderRadius: 8, overflow: 'hidden', height: 44, flexShrink: 0 },
  qtyBtn:     { width: 40, height: '100%', border: 'none', background: '#f9fafb', fontSize: 20, cursor: 'pointer', fontWeight: 700, color: '#374151' },
  qtyNum:     { width: 44, textAlign: 'center', fontSize: 16, fontWeight: 700 },
  btnOutline: { height: 44, border: '2px solid #2e7d32', background: '#fff', color: '#2e7d32', fontWeight: 700, fontSize: 14, borderRadius: 8, cursor: 'pointer', transition: 'background .15s' },
  btnSolid:   { height: 44, background: '#2e7d32', color: '#fff', border: 'none', fontWeight: 700, fontSize: 14, borderRadius: 8, cursor: 'pointer' },
  trustRow:   { display: 'flex', gap: 8 },
  trustItem:  { flex: 1, display: 'flex', alignItems: 'center', gap: 8, border: '1px solid #e5e7eb', borderRadius: 8, padding: '8px 10px', background: '#fafafa' },
  section:    { marginBottom: 48 },
  secTitle:   { fontSize: 18, fontWeight: 800, margin: '0 0 16px', paddingBottom: 10, borderBottom: '2px solid #e5e7eb' },
  detailGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px 32px' },
  detailRow:  { display: 'flex', gap: 8, padding: '7px 0', borderBottom: '1px solid #f3f4f6', fontSize: 14 },
  detailKey:  { fontWeight: 700, color: '#111', minWidth: 90, flexShrink: 0 },
  relatedGrid:{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: 16 },
};