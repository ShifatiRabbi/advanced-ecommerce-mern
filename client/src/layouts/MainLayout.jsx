import { lazy, Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import { useLayout } from '../hooks/useLayout';
import SliderRenderer from '../components/SliderRenderer';
import { useLocation } from 'react-router-dom';
import MarqueeBar from '../components/MarqueeBar';

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

  const { pathname } = useLocation();
  const headerKey = layout?.header || 'header1';
  const footerKey = layout?.footer || 'footer1';

  const Header = HEADERS[headerKey] ?? HEADERS.header1;
  const Footer = FOOTERS[footerKey] ?? FOOTERS.footer1;

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