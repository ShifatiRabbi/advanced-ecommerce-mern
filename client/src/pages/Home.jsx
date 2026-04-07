import { lazy, Suspense } from 'react';
import { Link }           from 'react-router-dom';
import { useQuery }       from '@tanstack/react-query';
import { Helmet }         from 'react-helmet-async';
import { useFeaturedProducts } from '../hooks/useProducts';
import api from '../services/api';
import SliderRenderer from '../components/SliderRenderer';

export default function Home() {
  const { data: featured } = useFeaturedProducts(8);
  const { data: flashSale } = useQuery({ queryKey: ['flash-sale'], queryFn: () => api.get('/flash-sales/active').then(r => r.data.data) });
  const { data: heroBanners } = useQuery({ queryKey: ['banners-hero'], queryFn: () => api.get('/banners?position=hero').then(r => r.data.data) });
  const { data: seo }        = useQuery({ queryKey: ['seo'], queryFn: () => api.get('/seo/settings').then(r => r.data.data), staleTime: 1000*60*10 });

  const hero = heroBanners?.[0];

  return (
    <>
      <Helmet>
        <title>{seo?.siteName || 'ShopBD'}</title>
        <meta name="description" content={seo?.siteDesc} />
        <meta name="keywords"    content={seo?.siteKeywords} />
        <meta property="og:title"       content={seo?.siteName} />
        <meta property="og:description" content={seo?.siteDesc} />
        {seo?.ogImage && <meta property="og:image" content={seo.ogImage} />}
      </Helmet>

      {/* Hero Banner */}
      <section style={s.hero}>
        {hero ? (
          <a href={hero.link || '/shop'} style={{ display: 'block' }}>
            <img src={hero.image?.url} alt={hero.title || 'Banner'} style={{ width: '100%', maxHeight: 480, objectFit: 'cover' }} />
          </a>
        ) : (
          <div style={s.heroFallback}>
            <h1 style={s.heroTitle}>Welcome to ShopBD</h1>
            <p style={s.heroSub}>Discover amazing products at the best prices</p>
            <Link to="/shop" style={s.heroBtn}>Shop Now</Link>
          </div>
        )}
      </section>
      <SliderRenderer position="hero" page="/" />
      <SliderRenderer position="after-hero" page="/" />

      {/* Flash Sale */}
      {flashSale && flashSale.items?.length > 0 && (
        <section style={s.section}>
          <div style={s.sectionHead}>
            <h2 style={s.sectionTitle}>Flash Sale</h2>
            <FlashCountdown endTime={flashSale.endTime} />
          </div>
          <div style={s.grid}>
            {flashSale.items.slice(0, 4).map(item => (
              <Link key={item._id} to={`/product/${item.product?.slug}`} style={s.card}>
                {item.product?.images?.[0] && <img src={item.product.images[0].url} alt={item.product.name} style={s.cardImg} />}
                <div style={s.cardBody}>
                  <p style={s.cardName}>{item.product?.name}</p>
                  <div style={s.priceRow}>
                    <span style={{ fontWeight: 700, color: '#e53e3e' }}>৳{item.salePrice.toLocaleString()}</span>
                    <span style={{ textDecoration: 'line-through', color: '#aaa', fontSize: 13, marginLeft: 8 }}>৳{item.originalPrice.toLocaleString()}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Featured Products */}
      {featured && featured.length > 0 && (
        <section style={s.section}>
          <div style={s.sectionHead}>
            <h2 style={s.sectionTitle}>Featured Products</h2>
            <Link to="/shop?featured=true" style={s.viewAll}>View all →</Link>
          </div>
          <div style={s.grid}>
            {featured.slice(0, 8).map(p => (
              <Link key={p._id} to={`/product/${p.slug}`} style={s.card}>
                {p.images?.[0] && <img src={p.images[0].url} alt={p.name} style={s.cardImg} loading="lazy" />}
                <div style={s.cardBody}>
                  <p style={s.cardCat}>{p.category?.name}</p>
                  <p style={s.cardName}>{p.name}</p>
                  <div style={s.priceRow}>
                    <span style={{ fontWeight: 700 }}>৳{(p.discountPrice || p.price).toLocaleString()}</span>
                    {p.discountPrice && <span style={{ textDecoration: 'line-through', color: '#aaa', fontSize: 13, marginLeft: 8 }}>৳{p.price.toLocaleString()}</span>}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <SliderRenderer position="before-footer" page="/" />
    </>
  );
}

function FlashCountdown({ endTime }) {
  const [remaining, setRemaining] = React.useState('');
  React.useEffect(() => {
    const tick = () => {
      const diff = new Date(endTime) - new Date();
      if (diff <= 0) { setRemaining('Ended'); return; }
      const h = String(Math.floor(diff / 3600000)).padStart(2, '0');
      const m = String(Math.floor((diff % 3600000) / 60000)).padStart(2, '0');
      const s = String(Math.floor((diff % 60000) / 1000)).padStart(2, '0');
      setRemaining(`${h}:${m}:${s}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [endTime]);
  return <span style={{ fontFamily: 'monospace', fontSize: 20, fontWeight: 700, color: '#e53e3e', background: '#fff5f5', padding: '4px 12px', borderRadius: 6 }}>{remaining}</span>;
}

import React from 'react';

const s = {
  hero:        { marginBottom: 40 },
  heroFallback:{ background: '#111', color: '#fff', textAlign: 'center', padding: '80px 24px' },
  heroTitle:   { fontSize: 42, fontWeight: 800, margin: '0 0 12px' },
  heroSub:     { fontSize: 18, color: '#aaa', margin: '0 0 28px' },
  heroBtn:     { display: 'inline-block', padding: '14px 36px', background: '#fff', color: '#111', borderRadius: 8, textDecoration: 'none', fontWeight: 700, fontSize: 16 },
  section:     { maxWidth: 1200, margin: '0 auto 48px', padding: '0 24px' },
  sectionHead: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  sectionTitle:{ fontSize: 22, fontWeight: 700, margin: 0 },
  viewAll:     { fontSize: 14, color: '#555', textDecoration: 'none' },
  grid:        { display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 20 },
  card:        { textDecoration: 'none', color: 'inherit', border: '1px solid #eee', borderRadius: 10, overflow: 'hidden' },
  cardImg:     { width: '100%', aspectRatio: '1', objectFit: 'cover', background: '#f5f5f5' },
  cardBody:    { padding: '12px 14px' },
  cardCat:     { fontSize: 11, color: '#aaa', margin: '0 0 4px', textTransform: 'uppercase' },
  cardName:    { fontSize: 14, fontWeight: 600, margin: '0 0 8px', lineHeight: 1.3 },
  priceRow:    { display: 'flex', alignItems: 'center' },
};