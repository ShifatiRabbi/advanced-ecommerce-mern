import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import { useAnalytics } from './hooks/useAnalytics';
import {  useCustomCode } from './hooks/useCustomCode';
import {  useTheme } from './hooks/useTheme';

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

export default function App() {
  useTheme();
  useCustomCode();
  useAnalytics();
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route element={<MainLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/shop"          element={<Shop />} />
          <Route path="/product/:slug" element={<Product />} />
          <Route path="/cart"                      element={<Cart />} />
          <Route path="/checkout"                  element={<Checkout />} />
          <Route path="/order-success/:orderNumber" element={<OrderSuccess />} />
          <Route path="/my-orders"                 element={<MyOrders />} />
          <Route path="/payment/success" element={<PaymentSuccess />} />
          <Route path="/payment/fail"    element={<PaymentFail />} />
          <Route path="/payment/cancel"  element={<PaymentFail />} />
          <Route path="/dashboard" element={<UserDashboard />} />
          <Route path="/about"   element={<StaticPage pageKey="about"   />} />
          <Route path="/privacy" element={<StaticPage pageKey="privacy" />} />
          <Route path="/terms"   element={<StaticPage pageKey="terms"   />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/page/:key" element={<StaticPage />} />
          <Route path="/blog"        element={<BlogList />} />
          <Route path="/blog/:slug"  element={<BlogDetail />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}