import { useState, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useProducts, useCategories, useBrands } from '../hooks/useProducts';
import { useTranslation } from 'react-i18next';
import { ProductCardSkeleton } from '../components/Skeleton';
import { useSiteSettings } from '../hooks/useSiteSettings';
const SORTS = [
  { value: 'newest',     label: 'Newest' },
  { value: 'price_asc',  label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'popular',    label: 'Most Popular' },
];

const toNumber = (value, fallback = 0) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

const getDefaultVariantOption = (product) => {
  if (!product?.variants?.length) return null;
  return product.variants.map((variant) => {
    const options = variant.options || [];
    const defaultIdx = variant.defaultOptionIndex ?? 0;
    return options[defaultIdx] || options[0] || null;
  }).filter(Boolean);
};

const getDisplayPricing = (product) => {
  const baseRegular = toNumber(product.basePrice ?? product.price, 0);
  const baseSale = product.discountPrice !== null && product.discountPrice !== undefined
    ? toNumber(product.discountPrice, 0)
    : null;

  const defaultOptions = getDefaultVariantOption(product);
  if (!defaultOptions?.length) {
    const regularPrice = baseRegular;
    const salePrice = baseSale;
    return { regularPrice, salePrice, displayPrice: salePrice ?? regularPrice };
  }

  let regularTotal = 0;
  let saleTotal = 0;
  let hasAnySale = false;

  defaultOptions.forEach((opt) => {
    const optRegular = opt?.regularPrice !== null && opt?.regularPrice !== undefined
      ? toNumber(opt.regularPrice, 0)
      : baseRegular + toNumber(opt?.priceModifier, 0);
    const optSale = opt?.salePrice !== null && opt?.salePrice !== undefined
      ? toNumber(opt.salePrice, 0)
      : (baseSale !== null ? baseSale + toNumber(opt?.priceModifier, 0) : null);

    regularTotal += optRegular;
    if (optSale !== null) {
      saleTotal += optSale;
      hasAnySale = true;
    }
  });

  const regularPrice = regularTotal;
  const salePrice = hasAnySale ? saleTotal : null;
  return { regularPrice, salePrice, displayPrice: salePrice ?? regularPrice };
};

function ProductCard({ product }) {
  const { regularPrice, salePrice, displayPrice } = getDisplayPricing(product);
  const discount = salePrice !== null && regularPrice > 0
    ? Math.round(((regularPrice - salePrice) / regularPrice) * 100)
    : 0;

  return (
    <Link to={`/product/${product.slug}`} style={styles.card} className="shop-product-card" id={`shop-product-card-${product._id}`}>
      <div style={styles.imgWrap}>
        {product.images?.[0] ? (
          <img src={product.images[0].url} alt={product.name} style={styles.img} loading="lazy" />
        ) : (
          <div style={styles.imgPlaceholder}>No image</div>
        )}
        {discount > 0 && <span style={styles.badge}>{discount}% OFF</span>}
      </div>
      <div style={styles.cardBody}>
        <p style={styles.cardCat}>{product.category?.name}</p>
        <h3 style={styles.cardTitle}>{product.name}</h3>
        <p style={styles.cardBrand}>{product.brand?.name}</p>
        <div style={styles.priceRow}>
          {salePrice !== null ? (
            <>
              <span style={styles.discountPrice}>৳{salePrice.toLocaleString()}</span>
              <span style={styles.originalPrice}>৳{regularPrice.toLocaleString()}</span>
            </>
          ) : (
            <span style={styles.price}>৳{displayPrice.toLocaleString()}</span>
          )}
        </div>
        {(product.totalStock ?? product.stock ?? 0) === 0 && <p style={styles.outOfStock}>Out of stock</p>}
      </div>
    </Link>
  );
}

export default function Shop() {
  const settings = useSiteSettings();
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('search') || '');

  const params = {
    category: searchParams.get('category') || undefined,
    brand:    searchParams.get('brand')    || undefined,
    sort:     searchParams.get('sort')     || 'newest',
    page:     searchParams.get('page')     || 1,
    search:   searchParams.get('search')   || undefined,
    minPrice: searchParams.get('minPrice') || undefined,
    maxPrice: searchParams.get('maxPrice') || undefined,
  };

  const { data, isLoading, isError } = useProducts(params);
  const { data: categories = [] }    = useCategories();
  const { data: brands = [] }        = useBrands();

  const set = useCallback((key, val) => {
    const next = new URLSearchParams(searchParams);
    if (val) next.set(key, val); else next.delete(key);
    if (key !== 'page') next.delete('page');
    setSearchParams(next);
  }, [searchParams, setSearchParams]);

  const handleSearch = (e) => {
    e.preventDefault();
    set('search', search);
  };

  return (
    <div style={styles.page} className="shop-page client-page-shop" id="client-page-shop">
      <aside style={styles.sidebar} className="shop-sidebar" id="shop-sidebar">
        <h3 style={styles.sidebarTitle}>Categories</h3>
        <button style={{ ...styles.filterBtn, ...(! params.category && styles.filterBtnActive) }} onClick={() => set('category', '')}>All</button>
        {categories.map((c) => (
          <button key={c._id} style={{ ...styles.filterBtn, ...(params.category === c._id && styles.filterBtnActive) }} onClick={() => set('category', c._id)}>
            {c.name}
          </button>
        ))}

        <h3 style={{ ...styles.sidebarTitle, marginTop: 24 }}>Brands</h3>
        <button style={{ ...styles.filterBtn, ...(!params.brand && styles.filterBtnActive) }} onClick={() => set('brand', '')}>All</button>
        {brands.map((b) => (
          <button key={b._id} style={{ ...styles.filterBtn, ...(params.brand === b._id && styles.filterBtnActive) }} onClick={() => set('brand', b._id)}>
            {b.name}
          </button>
        ))}

        <h3 style={{ ...styles.sidebarTitle, marginTop: 24 }}>Price Range</h3>
        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <input type="number" placeholder="Min" style={styles.priceInput} defaultValue={params.minPrice} onBlur={(e) => set('minPrice', e.target.value)} />
          <input type="number" placeholder="Max" style={styles.priceInput} defaultValue={params.maxPrice} onBlur={(e) => set('maxPrice', e.target.value)} />
        </div>
      </aside>

      <main style={styles.main} className="shop-main" id="shop-main">
        <div style={styles.topBar} className="shop-topbar" id="shop-topbar">
          <form onSubmit={handleSearch} style={styles.searchForm} className="shop-search-form" id="shop-search-form">
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products..." style={styles.searchInput} />
            <button type="submit" style={styles.searchBtn}>Search</button>
          </form>
          <select value={params.sort} onChange={(e) => set('sort', e.target.value)} style={styles.sortSelect}>
            {SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>

        {/* 1. Remove the old isLoading text and replace with this: */}
        {isLoading ? (
          <div style={styles.grid} className="shop-product-grid is-loading" id="shop-product-grid-loading">
            {Array.from({ length: 8 }, (_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        ) : isError ? (
          <p style={{ padding: 40, textAlign: 'center', color: 'red' }}>
            Failed to load products.
          </p>
        ) : (
          data && (
            <>
              <p style={styles.resultCount} className="shop-result-count" id="shop-result-count">{data.pagination.total} products found on {settings?.siteName || 'ShopBD'}</p>
              <div style={styles.grid} className="shop-product-grid" id="shop-product-grid">
                {data.products.map((p) => (
                  <ProductCard key={p._id} product={p} />
                ))}
              </div>

              <div style={styles.pagination} className="shop-pagination" id="shop-pagination">
                {Array.from({ length: data.pagination.pages }, (_, i) => i + 1).map((pg) => (
                  <button
                    key={pg}
                    onClick={() => set('page', pg)}
                    style={{
                      ...styles.pageBtn,
                      ...(Number(params.page) === pg && styles.pageBtnActive),
                    }}
                  >
                    {pg}
                  </button>
                ))}
              </div>
            </>
          )
        )}
      </main>
    </div>
  );
}

const styles = {
  page:           { display: 'flex', gap: 24, padding: '24px 40px', maxWidth: 1400, margin: '0 auto' },
  sidebar:        { width: 220, flexShrink: 0 },
  sidebarTitle:   { fontSize: 14, fontWeight: 600, marginBottom: 8, marginTop: 0 },
  filterBtn:      { display: 'block', width: '100%', textAlign: 'left', padding: '6px 10px', border: '1px solid var(--color-border, #e2e2e2)', borderRadius: 'var(--input-radius, 6px)', background: 'var(--color-background, #fff)', color: 'var(--color-text, #111827)', cursor: 'pointer', marginBottom: 4, fontSize: 14 },
  filterBtnActive:{ background: 'var(--color-primary, #1a1a1a)', color: '#fff', borderColor: 'var(--color-primary, #1a1a1a)' },
  priceInput:     { width: '50%', padding: '6px 8px', border: '1px solid var(--color-border, #e2e2e2)', borderRadius: 'var(--input-radius, 6px)', fontSize: 13, color: 'var(--color-text, #111827)', background: 'var(--color-background, #fff)' },
  main:           { flex: 1 },
  topBar:         { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, gap: 12 },
  searchForm:     { display: 'flex', gap: 8, flex: 1 },
  searchInput:    { flex: 1, padding: '8px 12px', border: '1px solid var(--color-border, #e2e2e2)', borderRadius: 'var(--input-radius, 8px)', fontSize: 14, color: 'var(--color-text, #111827)', background: 'var(--color-background, #fff)' },
  searchBtn:      { padding: '8px 16px', background: 'var(--color-primary, #1a1a1a)', color: '#fff', border: 'none', borderRadius: 'var(--btn-radius, 8px)', cursor: 'pointer', fontSize: 14 },
  sortSelect:     { padding: '8px 12px', border: '1px solid var(--color-border, #e2e2e2)', borderRadius: 'var(--input-radius, 8px)', fontSize: 14, color: 'var(--color-text, #111827)', background: 'var(--color-background, #fff)' },
  resultCount:    { fontSize: 13, color: 'var(--color-text-muted, #666)', marginBottom: 16 },
  grid:           { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 20 },
  card:           { textDecoration: 'none', color: 'inherit', border: 'var(--card-border, 1px solid #eee)', borderRadius: 'var(--card-radius, 12px)', overflow: 'hidden', transition: 'box-shadow .2s', display: 'block', background: 'var(--color-surface, #fff)' },
  imgWrap:        { position: 'relative', aspectRatio: '1', overflow: 'hidden', background: 'var(--color-surface, #f5f5f5)' },
  img:            { width: '100%', height: '100%', objectFit: 'cover' },
  imgPlaceholder: { display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--color-text-muted, #aaa)', fontSize: 13 },
  badge:          { position: 'absolute', top: 8, left: 8, background: 'var(--color-danger, #e53e3e)', color: '#fff', fontSize: 11, fontWeight: 700, padding: '3px 7px', borderRadius: 4 },
  cardBody:       { padding: '12px 14px' },
  cardCat:        { fontSize: 11, color: 'var(--color-text-muted, #888)', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.05em' },
  cardTitle:      { fontSize: 15, fontWeight: 600, margin: '0 0 4px', lineHeight: 1.3, color: 'var(--color-text, #111827)' },
  cardBrand:      { fontSize: 12, color: 'var(--color-text-muted, #888)', margin: '0 0 8px' },
  priceRow:       { display: 'flex', alignItems: 'center', gap: 8 },
  price:          { fontSize: 16, fontWeight: 700 },
  discountPrice:  { fontSize: 16, fontWeight: 700, color: 'var(--color-danger, #e53e3e)' },
  originalPrice:  { fontSize: 13, color: 'var(--color-text-muted, #aaa)', textDecoration: 'line-through' },
  outOfStock:     { fontSize: 12, color: 'var(--color-danger, #e53e3e)', marginTop: 4 },
  pagination:     { display: 'flex', gap: 8, marginTop: 32, justifyContent: 'center' },
  pageBtn:        { padding: '8px 14px', border: '1px solid var(--color-border, #e2e2e2)', borderRadius: 'var(--btn-radius, 8px)', background: 'var(--color-background, #fff)', color: 'var(--color-text, #111827)', cursor: 'pointer', fontSize: 14 },
  pageBtnActive:  { background: 'var(--color-primary, #1a1a1a)', color: '#fff', borderColor: 'var(--color-primary, #1a1a1a)' },
};