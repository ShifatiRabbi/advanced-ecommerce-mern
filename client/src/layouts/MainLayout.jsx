import { lazy, Suspense, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { useLayout } from '../hooks/useLayout';
import SliderRenderer from '../components/SliderRenderer';
import { useLocation } from 'react-router-dom';
import MarqueeBar from '../components/MarqueeBar';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';
import { useCartStore } from '../store/cartStore';

function mergeServerAndLocalCart(serverItems, localItems) {
  const byKey = new Map();
  for (const it of serverItems || []) {
    if (!it?.cartKey) continue;
    const qty = Number(it.qty) || 0;
    const unit = Number(it.unitPrice) || 0;
    byKey.set(it.cartKey, { ...it, qty, unitPrice: unit, lineTotal: qty * unit });
  }
  for (const li of localItems || []) {
    if (!li?.cartKey) continue;
    const existing = byKey.get(li.cartKey);
    const unit = Number(li.unitPrice ?? existing?.unitPrice) || 0;
    const stockCap = Math.min(
      Number.isFinite(li.stock) ? li.stock : 999999,
      Number.isFinite(existing?.stock) ? existing.stock : 999999
    );
    if (existing) {
      const combinedQty = Math.min(stockCap, (existing.qty || 0) + (Number(li.qty) || 0));
      byKey.set(li.cartKey, { ...existing, qty: combinedQty, lineTotal: combinedQty * unit });
    } else {
      const q = Math.min(stockCap, Number(li.qty) || 0);
      byKey.set(li.cartKey, { ...li, qty: q, lineTotal: q * unit });
    }
  }
  return [...byKey.values()];
}

const HEADERS = {
  header1: lazy(() => import('../components/header/Header1')),
  header2: lazy(() => import('../components/header/Header2')),
  header3: lazy(() => import('../components/header/Header3')),
  header4: lazy(() => import('../components/header/Header4')),
};

const FOOTERS = {
  footer1: lazy(() => import('../components/footer/Footer1')),
  footer2: lazy(() => import('../components/footer/Footer2')),
  footer3: lazy(() => import('../components/footer/Footer3')),
  footer4: lazy(() => import('../components/footer/Footer4')),
};

export default function MainLayout() {
  const { data: layout, isLoading } = useLayout();
  const user = useAuthStore((s) => s.user);

  const { pathname } = useLocation();
  const headerKey = layout?.header || 'header1';
  const footerKey = layout?.footer || 'footer1';

  const Header = HEADERS[headerKey] ?? HEADERS.header1;
  const Footer = FOOTERS[footerKey] ?? FOOTERS.footer1;

  useEffect(() => {
    if (!user?._id || user.role === 'admin' || user.role === 'employee') return;

    let cancelled = false;
    (async () => {
      try {
        const { data } = await api.get('/auth/cart', { _silent: true });
        if (cancelled) return;
        const serverItems = data.data?.items ?? [];
        const localItems = useCartStore.getState().items;
        const merged = mergeServerAndLocalCart(serverItems, localItems);
        useCartStore.getState().replaceAll(merged);
        await api.put('/auth/cart', { items: merged }, { _silent: true });
      } catch {
        /* guest session or network */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?._id, user?.role]);

  if (isLoading) return <div style={{ minHeight: '100vh' }} className="client-main-layout-loading" id="client-main-layout-loading" />;

  return (
    <div className="client-main-layout" id="client-main-layout">
      <div className="client-main-layout-header" id="client-main-layout-header">
        <Suspense fallback={null}><Header /></Suspense>
      </div>
      <div className="client-main-layout-marquee" id="client-main-layout-marquee">
        <MarqueeBar position="below-header" page={pathname} />
      </div>
      <div className="client-main-layout-slider-after-hero" id="client-main-layout-slider-after-hero">
        <SliderRenderer position="after-hero" page={pathname} />
      </div>
      <main className="client-main-layout-content" id="client-main-layout-content">
        <Outlet />
      </main>
      <div className="client-main-layout-slider-before-footer" id="client-main-layout-slider-before-footer">
        <SliderRenderer position="before-footer" page={pathname} />
      </div>
      <div className="client-main-layout-footer" id="client-main-layout-footer">
        <Suspense fallback={null}><Footer /></Suspense>
      </div>
    </div>
  );
}