import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import { useAnalytics } from './hooks/useAnalytics';
import {  useCustomCode } from './hooks/useCustomCode';
import {  useTheme } from './hooks/useTheme';
import { useSiteSettings } from './hooks/useSiteSettings';
import GlobalLoader from './components/GlobalLoader';
import ErrorBoundary from './components/ErrorBoundary';
import SuspenseFallback from './components/SuspenseFallback';

const Home = lazy(() => import('./pages/Home'));
const Shop = lazy(() => import('./pages/Shop'));
const Product = lazy(() => import('./pages/Product'));
const NotFound = lazy(() => import('./pages/NotFound'));
const Cart          = lazy(() => import('./pages/Cart'));
const Checkout      = lazy(() => import('./pages/Checkout'));
const OrderSuccess  = lazy(() => import('./pages/OrderSuccess'));
const MyOrders      = lazy(() => import('./pages/MyOrders'));
const PaymentSuccess = lazy(() => import('./pages/payment/PaymentSuccess'));
const PaymentFail    = lazy(() => import('./pages/payment/PaymentFail'));
const PaymentCancel  = lazy(() => import('./pages/payment/PaymentFail'));
const Login         = lazy(() => import('./pages/auth/Login'));
const Register      = lazy(() => import('./pages/auth/Register'));
const UserDashboard = lazy(() => import('./pages/UserDashboard'));
const StaticPage  = lazy(() => import('./pages/StaticPage'));
const ContactPage = lazy(() => import('./pages/ContactPage'));
const BlogList   = lazy(() => import('./pages/BlogList'));
const BlogDetail = lazy(() => import('./pages/BlogDetail'));


const withBoundary = (Component) => (
  <ErrorBoundary>
    <Suspense fallback={<SuspenseFallback />}>
      <Component />
    </Suspense>
  </ErrorBoundary>
);

export default function App() {
  useTheme();
  useCustomCode();
  useAnalytics();
  useSiteSettings();
  return (
    <>
      <GlobalLoader />
      <Routes>
        <Route path="/login"    element={withBoundary(Login)} />
        <Route path="/register" element={withBoundary(Register)} />

        <Route element={<MainLayout />}>
          <Route path="/"         element={withBoundary(Home)} />
          <Route path="/shop"     element={withBoundary(Shop)} />
          <Route path="/product/:slug" element={withBoundary(Product)} />
          <Route path="/cart"     element={withBoundary(Cart)} />
          <Route path="/checkout" element={
            <ErrorBoundary>
              <Suspense fallback={<SuspenseFallback />}>
                <Checkout />
              </Suspense>
            </ErrorBoundary>
          } />
            <Route path="/order-success/:orderNumber" element={withBoundary(OrderSuccess)} />
            <Route path="/my-orders"                 element={withBoundary(MyOrders)} />
            <Route path="/payment/success" element={withBoundary(PaymentSuccess)} />
            <Route path="/payment/fail"    element={withBoundary(PaymentFail)} />
            <Route path="/payment/cancel"  element={withBoundary(PaymentFail)} />
            <Route path="/dashboard" element={withBoundary(UserDashboard)} />
            <Route path="/about"   element={withBoundary(StaticPage)} />
            <Route path="/privacy" element={withBoundary(StaticPage)} />
            <Route path="/terms"   element={withBoundary(StaticPage)} />
            <Route path="/contact" element={withBoundary(ContactPage)} />
            <Route path="/page/:key" element={withBoundary(StaticPage)} />
            <Route path="/blog"        element={withBoundary(BlogList)} />
            <Route path="/blog/:slug"  element={withBoundary(BlogDetail)} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    </>
  );
}