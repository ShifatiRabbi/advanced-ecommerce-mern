import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AdminLayout from './layout/AdminLayout';
import AuthGuard  from './components/AuthGuard';

const Login        = lazy(() => import('./pages/Auth/Login'));
const Dashboard    = lazy(() => import('./pages/Dashboard/Dashboard'));
const OrderList    = lazy(() => import('./pages/Orders/OrderList'));
const ProductList  = lazy(() => import('./pages/Products/ProductList'));
const AddProduct   = lazy(() => import('./pages/Products/AddProduct'));
const CategoryList = lazy(() => import('./pages/Categories/CategoryList'));
const BrandList    = lazy(() => import('./pages/Brands/BrandList'));
const Inventory    = lazy(() => import('./pages/Inventory/Inventory'));
const Customers    = lazy(() => import('./pages/Customers/Customers'));
const Employees    = lazy(() => import('./pages/Employees/Employees'));
const Offers       = lazy(() => import('./pages/Offers/Offers'));
const Delivery     = lazy(() => import('./pages/Delivery/Delivery'));
const PaymentList  = lazy(() => import('./pages/Payments/PaymentList'));
const Blog         = lazy(() => import('./pages/Blog/Blog'));
const Settings     = lazy(() => import('./pages/Settings/Settings'));

const Guarded = ({ children, role }) => (
  <AuthGuard requiredRole={role}>{children}</AuthGuard>
);

export default function App() {
  return (
    <Suspense fallback={<div style={{ padding: 40, textAlign: 'center' }}>Loading...</div>}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Guarded><AdminLayout /></Guarded>}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard"  element={<Dashboard />} />
          <Route path="orders"     element={<OrderList />} />
          <Route path="products"   element={<ProductList />} />
          <Route path="products/add" element={<AddProduct />} />
          <Route path="categories" element={<CategoryList />} />
          <Route path="brands"     element={<BrandList />} />
          <Route path="inventory"  element={<Inventory />} />
          <Route path="customers"  element={<Customers />} />
          <Route path="employees"  element={<Guarded role="admin"><Employees /></Guarded>} />
          <Route path="offers"     element={<Offers />} />
          <Route path="delivery"   element={<Delivery />} />
          <Route path="payments"   element={<PaymentList />} />
          <Route path="blog"       element={<Blog />} />
          <Route path="settings"   element={<Settings />} />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Suspense>
  );
}