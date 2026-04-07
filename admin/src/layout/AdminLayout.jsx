import { useState } from 'react';
import { Link, NavLink, useNavigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';
import { setAccessToken } from '../services/api';

const NAV = [
  { label: 'Dashboard',  path: '/dashboard' },
  { label: 'Orders',     path: '/orders' },
  { label: 'Products',   path: '/products' },
  { label: 'Categories', path: '/categories' },
  { label: 'Brands',     path: '/brands' },
  { label: 'Inventory',  path: '/inventory' },
  { label: 'Customers',  path: '/customers' },
  { label: 'Employees',  path: '/employees' },
  { label: 'Offers',     path: '/offers' },
  { label: 'Delivery',   path: '/delivery' },
  { label: 'Payments',   path: '/payments' },
  { label: 'Blog',       path: '/blog' },
  { label: 'SEO',        path: '/seo' },
  { label: 'Email Templates', path: '/email-templates' },
  { label: 'Marketing',  path: '/marketing' },
  { label: 'Custom Code',path: '/custom-code' },
  { label: 'Menu Builder',path: '/menu' },
  { label: 'Checkout Builder',path: '/checkout-builder' },
  { label: 'Slider Builder',path: '/slider-builder' },
  { label: 'Marquee',    path: '/marquee' },
  { label: 'Timer',      path: '/timer' },
  { label: 'Pages',      path: '/pages' },
  { label: 'Theme',      path: '/theme' },
  { label: 'General Settings',path: '/general' },
  { label: 'Other Settings', path: '/settings' },
];

export default function AdminLayout() {
  const { user, clearUser } = useAuthStore();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = async () => {
    try { await api.post('/auth/logout'); } catch {}
    setAccessToken(null);
    clearUser();
    navigate('/login');
  };

  return (
    <div style={s.shell}>
      <aside style={{ ...s.sidebar, width: collapsed ? 60 : 230 }}>
        <div style={s.sidebarHead}>
          {!collapsed && <span style={s.logo}>ShopAdmin</span>}
          <button onClick={() => setCollapsed(c => !c)} style={s.collapseBtn}>
            {collapsed ? '›' : '‹'}
          </button>
        </div>

        <nav style={s.nav}>
          {NAV.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              style={({ isActive }) => ({ ...s.navLink, ...(isActive && s.navLinkActive) })}>
              {collapsed ? item.label.charAt(0) : item.label}
            </NavLink>
          ))}
        </nav>

        <div style={s.sidebarFooter}>
          {!collapsed && (
            <>
              <p style={s.userName}>{user?.name}</p>
              <p style={s.userEmail}>{user?.email}</p>
            </>
          )}
          <button onClick={handleLogout} style={s.logoutBtn}>
            {collapsed ? '×' : 'Logout'}
          </button>
        </div>
      </aside>

      <div style={s.main}>
        <header style={s.topbar}>
          <div style={{ fontSize: 13, color: '#888' }}>
            Welcome back, <strong>{user?.name}</strong>
          </div>
          <div style={s.topbarRight}>
            <span style={s.roleTag}>{user?.role?.toUpperCase()}</span>
            <Link to="/settings" style={s.settingsLink}>Settings</Link>
          </div>
        </header>
        <main style={s.content}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}

const s = {
  shell:        { display: 'flex', minHeight: '100vh', fontFamily: 'system-ui, -apple-system, sans-serif' },
  sidebar:      { background: '#111827', color: '#fff', display: 'flex', flexDirection: 'column', transition: 'width .2s', flexShrink: 0, overflow: 'hidden' },
  sidebarHead:  { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 14px', borderBottom: '1px solid #1f2937' },
  logo:         { fontWeight: 700, fontSize: 15, letterSpacing: '-0.02em', color: '#fff' },
  collapseBtn:  { background: 'none', border: 'none', color: '#6b7280', fontSize: 18, cursor: 'pointer', padding: '0 4px', lineHeight: 1 },
  nav:          { flex: 1, overflowY: 'auto', padding: '8px 0' },
  navLink:      { display: 'block', padding: '9px 16px', color: '#9ca3af', textDecoration: 'none', fontSize: 14, whiteSpace: 'nowrap', transition: 'background .15s, color .15s' },
  navLinkActive:{ color: '#fff', background: '#1f2937' },
  sidebarFooter:{ borderTop: '1px solid #1f2937', padding: 14 },
  userName:     { fontSize: 13, color: '#e5e7eb', margin: '0 0 2px', fontWeight: 600 },
  userEmail:    { fontSize: 11, color: '#6b7280', margin: '0 0 10px' },
  logoutBtn:    { width: '100%', background: 'none', border: '1px solid #374151', color: '#9ca3af', padding: '7px 12px', borderRadius: 6, cursor: 'pointer', fontSize: 13 },
  main:         { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#f9fafb' },
  topbar:       { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 24px', height: 56, borderBottom: '1px solid #e5e7eb', background: '#fff', flexShrink: 0 },
  topbarRight:  { display: 'flex', alignItems: 'center', gap: 12 },
  roleTag:      { fontSize: 11, fontWeight: 700, padding: '3px 8px', background: '#eff6ff', borderRadius: 4, color: '#1d4ed8', letterSpacing: '0.05em' },
  settingsLink: { fontSize: 13, color: '#6b7280', textDecoration: 'none' },
  content:      { flex: 1, overflowY: 'auto', padding: 24 },
};