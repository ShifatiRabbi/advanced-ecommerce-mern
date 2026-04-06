import { useState } from 'react';
import { Link, NavLink, useNavigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';

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
  { label: 'Settings',   path: '/settings' },
];

export default function AdminLayout() {
  const { user, clearUser } = useAuthStore();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = async () => {
    try { await api.post('/auth/logout'); } catch {}
    clearUser();
    navigate('/login');
  };

  return (
    <div style={s.shell}>
      <aside style={{ ...s.sidebar, width: collapsed ? 60 : 220 }}>
        <div style={s.sidebarHead}>
          {!collapsed && <span style={s.logo}>ShopAdmin</span>}
          <button onClick={() => setCollapsed(c => !c)} style={s.collapseBtn}>
            {collapsed ? '›' : '‹'}
          </button>
        </div>

        <nav style={s.nav}>
          {NAV.map((item) => (
            <NavLink key={item.path} to={item.path}
              style={({ isActive }) => ({ ...s.navLink, ...(isActive && s.navLinkActive) })}>
              {!collapsed && item.label}
              {collapsed && item.label.charAt(0)}
            </NavLink>
          ))}
        </nav>

        <div style={s.sidebarFooter}>
          {!collapsed && <p style={s.userName}>{user?.name}</p>}
          <button onClick={handleLogout} style={s.logoutBtn}>
            {collapsed ? '⏻' : 'Logout'}
          </button>
        </div>
      </aside>

      <div style={s.main}>
        <header style={s.topbar}>
          <div style={s.breadcrumb} id="admin-breadcrumb" />
          <div style={s.topbarRight}>
            <span style={s.roleTag}>{user?.role}</span>
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
  shell:          { display: 'flex', minHeight: '100vh', fontFamily: 'system-ui, sans-serif' },
  sidebar:        { background: '#111', color: '#fff', display: 'flex', flexDirection: 'column', transition: 'width .2s', flexShrink: 0, overflow: 'hidden' },
  sidebarHead:    { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 14px', borderBottom: '1px solid #222' },
  logo:           { fontWeight: 700, fontSize: 16, letterSpacing: '-0.02em' },
  collapseBtn:    { background: 'none', border: 'none', color: '#888', fontSize: 18, cursor: 'pointer', padding: '0 4px' },
  nav:            { flex: 1, overflowY: 'auto', padding: '8px 0' },
  navLink:        { display: 'block', padding: '9px 16px', color: '#aaa', textDecoration: 'none', fontSize: 14, transition: 'color .15s, background .15s', borderRadius: 0, whiteSpace: 'nowrap' },
  navLinkActive:  { color: '#fff', background: '#222' },
  sidebarFooter:  { borderTop: '1px solid #222', padding: 14 },
  userName:       { fontSize: 12, color: '#666', marginBottom: 8 },
  logoutBtn:      { background: 'none', border: '1px solid #333', color: '#888', padding: '6px 12px', borderRadius: 6, cursor: 'pointer', fontSize: 13, width: '100%' },
  main:           { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  topbar:         { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 24px', height: 52, borderBottom: '1px solid #eee', background: '#fff', flexShrink: 0 },
  breadcrumb:     { fontSize: 13, color: '#888' },
  topbarRight:    { display: 'flex', alignItems: 'center', gap: 12 },
  roleTag:        { fontSize: 11, fontWeight: 700, padding: '3px 8px', background: '#f1f5f9', borderRadius: 4, textTransform: 'uppercase', color: '#475569' },
  settingsLink:   { fontSize: 13, color: '#666', textDecoration: 'none' },
  content:        { flex: 1, overflowY: 'auto', padding: 24, background: '#f8f9fa' },
};