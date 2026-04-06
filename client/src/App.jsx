import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import { useAnalytics } from './hooks/useAnalytics';

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

export default function App() {
  useAnalytics();
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Routes>
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
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}