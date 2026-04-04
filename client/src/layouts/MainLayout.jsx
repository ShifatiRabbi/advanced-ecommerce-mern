import { lazy, Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import { useLayout } from '../hooks/useLayout';

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

  const headerKey = layout?.header || 'header1';
  const footerKey = layout?.footer || 'footer1';

  const Header = HEADERS[headerKey] ?? HEADERS.header1;
  const Footer = FOOTERS[footerKey] ?? FOOTERS.footer1;

  if (isLoading) return <div style={{ minHeight: '100vh' }} />;

  return (
    <>
      <Suspense fallback={null}><Header /></Suspense>
      <main>
        <Outlet />
      </main>
      <Suspense fallback={null}><Footer /></Suspense>
    </>
  );
}