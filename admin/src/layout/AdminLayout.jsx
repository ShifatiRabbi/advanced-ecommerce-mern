import { useState } from 'react';
import { Link, NavLink, useNavigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';
import { setAccessToken } from '../services/api';

const MENU = [
  {
    label: 'Dashboard',
    path: '/dashboard',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.25">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1v-5m10-10l2 2m-2-2v10a1 1 0 01-1 1v-5m-6 0a1 1 0 001-1v5" />
      </svg>
    ),
  },
  {
    label: 'Orders',
    path: '/orders',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.25">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2" />
      </svg>
    ),
  },
  {
    label: 'Catalog',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.25">
        <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m-8-4v10l8 4m-8-10l8-4" />
      </svg>
    ),
    children: [
      { label: 'Products', path: '/products' },
      { label: 'Categories', path: '/categories' },
      { label: 'Brands', path: '/brands' },
      { label: 'Inventory', path: '/inventory' },
    ],
  },
  {
    label: 'Customers',
    path: '/customers',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.25">
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 01-5.356-1.857M17 20H7m5-2v-2m-5 2v-2a3 3 0 015.356-1.857M7 20H2v-2a3 3 0 015.356-1.857" />
      </svg>
    ),
  },
  {
    label: 'Messages',
    path: '/messages',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.25">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2 2 2 0 01-2-2 2 2 0 012-2 2 2 0 01-2-2 2 2 0 012-2 2 2 0 01-2-2z" />
      </svg>
    ),
  },
  {
    label: 'Sales',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.25">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
      </svg>
    ),
    children: [
      { label: 'Offers', path: '/offers' },
      { label: 'Payments', path: '/payments' },
    ],
  },
  {
    label: 'Delivery',
    path: '/delivery',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.25">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m-8 4H4m0 0l4 4m-4-4l4-4" />
      </svg>
    ),
  },
  {
    label: 'Marketing',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.25">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2" />
      </svg>
    ),
    children: [
      { label: 'Marketing', path: '/marketing' },
      { label: 'Blog', path: '/blog' },
      { label: 'SEO', path: '/seo' },
      { label: 'Email Templates', path: '/email-templates' },
    ],
  },
  {
    label: 'Appearance',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.25">
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2 2 2 0 01-2-2 2 2 0 012-2 2 2 0 01-2-2 2 2 0 012-2 2 2 0 01-2-2 2 2 0 012-2zM17 21a4 4 0 01-4-4V5a2 2 0 012-2 2 2 0 01-2-2 2 2 0 012-2 2 2 0 01-2-2 2 2 0 012-2z" />
      </svg>
    ),
    children: [
      { label: 'Theme', path: '/theme' },
      { label: 'Pages', path: '/pages' },
      { label: 'Menu Builder', path: '/menu' },
      { label: 'Checkout Builder', path: '/checkout-builder' },
      { label: 'Slider Builder', path: '/slider-builder' },
      { label: 'Marquee', path: '/marquee' },
      { label: 'Timer', path: '/timer' },
      { label: 'Custom Code', path: '/custom-code' },
    ],
  },
  {
    label: 'Employees',
    path: '/employees',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.25">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M5 19.5l-1.5-1.5L5 19.5zM17 19.5l1.5-1.5L17 19.5z" />
      </svg>
    ),
  },
  {
    label: 'Settings',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.25">
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 002.573-1.066c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 00.817 1.194 1.724 1.724 0 01.817 1.194c-.94 1.543.827 3.31 2.37 2.37 1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 01-2.573 1.066 1.724 1.724 0 01-.817 1.194 1.724 1.724 0 01-.817 1.194c-.94 1.543.827 3.31 2.37 2.37 1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 01-2.573 1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 01-.817-1.194 1.724 1.724 0 01-.817-1.194c-.94-1.543.827-3.31 2.37-2.37 1.756-.426 1.756-2.924 0-3.35a1.724 1.724 0 01-2.573-1.066 1.724 1.724 0 01-.817-1.194z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    children: [
      { label: 'General Settings', path: '/general' },
      { label: 'Other Settings', path: '/settings' },
    ],
  },
];

export default function AdminLayout() {
  const { user, clearUser } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [expanded, setExpanded] = useState(new Set());

  const toggleExpanded = (label) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(label)) {
        next.delete(label);
      } else {
        next.add(label);
      }
      return next;
    });
  };

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Ignore errors during logout
    }
    setAccessToken(null);
    clearUser();
    navigate('/login');
  };

  const isChildActive = (children) => {
    if (!children) return false;
    return children.some((child) => child.path === location.pathname);
  };

  return (
    <div style={s.shell} className="admin-layout-shell" id="admin-layout-shell">
      {/* SIDEBAR */}
      <aside
        style={{
          ...s.sidebar,
          width: collapsed ? 72 : 260,
          boxShadow: '10px 0 15px -3px rgb(0 0 0 / 0.1)',
        }}
        className="admin-layout-sidebar"
        id="admin-layout-sidebar"
      >
        {/* HEADER */}
        <div style={s.sidebarHead} className="admin-layout-sidebar-head" id="admin-layout-sidebar-head">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {!collapsed && (
              <span style={s.logo}>
                <span style={{ color: '#22d3ee' }}>Shop</span>Admin
              </span>
            )}
            {collapsed && (
              <span style={{ fontSize: 22, fontWeight: 700, color: '#22d3ee', marginLeft: 4 }}>S</span>
            )}
          </div>
          <button
            onClick={() => setCollapsed((c) => !c)}
            style={s.collapseBtn}
            aria-label="Toggle sidebar"
          >
            {collapsed ? '›' : '‹'}
          </button>
        </div>

        {/* NAVIGATION */}
        <nav style={s.nav} className="admin-layout-nav" id="admin-layout-nav">
          {MENU.map((item) => {
            const hasChildren = Boolean(item.children?.length);
            const isExpanded = expanded.has(item.label);
            const childActive = hasChildren && isChildActive(item.children);
            const leafActive = !hasChildren && item.path && location.pathname === item.path;
            const isActive = leafActive || childActive;

            // COLLAPSED MODE — icon-only with tooltip
            if (collapsed) {
              if (!hasChildren && item.path) {
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    title={item.label}
                    style={({ isActive: active }) => ({
                      ...s.navItemCollapsed,
                      ...(active && s.navItemActive),
                    })}
                  >
                    {item.icon}
                  </NavLink>
                );
              }
              // Parent in collapsed mode
              return (
                <div
                  key={item.label}
                  title={item.label}
                  style={{
                    ...s.navItemCollapsed,
                    ...(isActive && s.navItemActive),
                  }}
                  onClick={() => {
                    setCollapsed(false);
                    if (hasChildren) toggleExpanded(item.label);
                  }}
                >
                  {item.icon}
                </div>
              );
            }

            // EXPANDED MODE
            if (!hasChildren && item.path) {
              // Top-level leaf
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  style={({ isActive: active }) => ({
                    ...s.navLink,
                    ...(active && s.navLinkActive),
                  })}
                >
                  <span style={s.iconWrapper}>{item.icon}</span>
                  <span style={s.label}>{item.label}</span>
                </NavLink>
              );
            }

            // Parent with children
            if (hasChildren) {
              return (
                <div key={item.label} style={s.parentContainer}>
                  {/* Parent row */}
                  <div
                    style={{
                      ...s.parentLink,
                      ...(isActive && s.navLinkActive),
                    }}
                    onClick={() => toggleExpanded(item.label)}
                  >
                    <span style={s.iconWrapper}>{item.icon}</span>
                    <span style={s.label}>{item.label}</span>
                    <span
                      style={{
                        ...s.chevron,
                        transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                      }}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth="3"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </span>
                  </div>

                  {/* Animated submenu */}
                  <div
                    style={{
                      ...s.submenu,
                      maxHeight: isExpanded ? `${item.children.length * 52 + 8}px` : '0',
                    }}
                  >
                    {item.children.map((child) => (
                      <NavLink
                        key={child.path}
                        to={child.path}
                        style={({ isActive: active }) => ({
                          ...s.subNavLink,
                          ...(active && s.subNavLinkActive),
                        })}
                      >
                        {child.label}
                      </NavLink>
                    ))}
                  </div>
                </div>
              );
            }

            return null;
          })}
        </nav>

        {/* FOOTER */}
        <div style={s.sidebarFooter} className="admin-layout-sidebar-footer" id="admin-layout-sidebar-footer">
          {!collapsed && (
            <>
              <div style={s.userInfo}>
                <p style={s.userName}>{user?.name}</p>
                <p style={s.userEmail}>{user?.email}</p>
              </div>
            </>
          )}
          <button onClick={handleLogout} style={s.logoutBtn} title={collapsed ? 'Logout' : undefined}>
            {collapsed ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4V7m-4 4V7" />
              </svg>
            ) : (
              'Logout'
            )}
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div style={s.main} className="admin-layout-main" id="admin-layout-main">
        {/* TOPBAR */}
        <header style={s.topbar} className="admin-layout-topbar" id="admin-layout-topbar">
          <div style={s.topbarLeft}>
            <div style={{ fontSize: 14, color: '#64748b', fontWeight: 500 }}>
              Welcome back,{' '}
              <strong style={{ color: '#0f172a' }}>{user?.name || 'Admin'}</strong>
            </div>
          </div>

          <div style={s.topbarRight}>
            <span style={s.roleTag}>{user?.role?.toUpperCase() || 'ADMIN'}</span>
            <Link to="/settings" style={s.settingsLink}>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" style={{ marginRight: 4 }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 002.573-1.066c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 00.817 1.194 1.724 1.724 0 01.817 1.194c-.94 1.543.827 3.31 2.37 2.37 1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 01-2.573 1.066 1.724 1.724 0 01-.817 1.194 1.724 1.724 0 01-.817 1.194c-.94 1.543.827-3.31 2.37-2.37 1.756-.426 1.756-2.924 0-3.35a1.724 1.724 0 01-2.573-1.066 1.724 1.724 0 01-.817-1.194 1.724 1.724 0 01-.817-1.194z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Settings
            </Link>
          </div>
        </header>

        {/* PAGE CONTENT */}
        <main style={s.content} className="admin-layout-content" id="admin-layout-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

const s = {
  shell: {
    display: 'flex',
    minHeight: '100vh',
    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    background: '#f8fafc',
  },

  sidebar: {
    background: '#0f172a',
    color: '#f1f5f9',
    display: 'flex',
    flexDirection: 'column',
    transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    flexShrink: 0,
    overflow: 'hidden',
    borderRight: '1px solid #1e2937',
  },

  sidebarHead: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '20px 20px 16px',
    borderBottom: '1px solid #1e2937',
    flexShrink: 0,
  },

  logo: {
    fontWeight: 700,
    fontSize: 19,
    letterSpacing: '-0.04em',
    background: 'linear-gradient(90deg, #22d3ee, #a78bfa)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },

  collapseBtn: {
    background: 'none',
    border: 'none',
    color: '#64748b',
    fontSize: 24,
    cursor: 'pointer',
    padding: '4px 8px',
    borderRadius: 6,
    transition: 'all 0.2s',
  },

  nav: {
    flex: 1,
    overflowY: 'auto',
    padding: '8px 6px',
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  },

  navLink: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '12px 20px',
    color: '#cbd5e1',
    textDecoration: 'none',
    fontSize: 14.5,
    fontWeight: 500,
    borderRadius: 8,
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
  },

  navLinkActive: {
    background: '#1e2937',
    color: '#fff',
    boxShadow: '0 1px 3px rgba(15, 23, 42, 0.3)',
  },

  navItemCollapsed: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '14px 0',
    width: '100%',
    color: '#cbd5e1',
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    borderRadius: 10,
    margin: '2px 8px',
  },

  navItemActive: {
    background: '#1e2937',
    color: '#fff',
  },

  parentContainer: {
    display: 'flex',
    flexDirection: 'column',
  },

  parentLink: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '12px 20px',
    color: '#cbd5e1',
    fontSize: 14.5,
    fontWeight: 500,
    cursor: 'pointer',
    borderRadius: 8,
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
  },

  iconWrapper: {
    display: 'flex',
    alignItems: 'center',
    flexShrink: 0,
    width: 20,
  },

  label: {
    flex: 1,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },

  chevron: {
    transition: 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
    display: 'flex',
    alignItems: 'center',
  },

  submenu: {
    overflow: 'hidden',
    transition: 'max-height 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    paddingLeft: 36,
    paddingRight: 8,
    marginTop: 2,
    marginBottom: 4,
  },

  subNavLink: {
    display: 'block',
    padding: '10px 20px',
    color: '#cbd5e1',
    textDecoration: 'none',
    fontSize: 14,
    borderRadius: 8,
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
  },

  subNavLinkActive: {
    background: '#1e2937',
    color: '#fff',
  },

  sidebarFooter: {
    borderTop: '1px solid #1e2937',
    padding: '16px 20px',
    flexShrink: 0,
  },

  userInfo: {
    marginBottom: 12,
  },

  userName: {
    fontSize: 13.5,
    color: '#e2e8f0',
    margin: 0,
    fontWeight: 600,
  },

  userEmail: {
    fontSize: 12,
    color: '#64748b',
    margin: '2px 0 0',
  },

  logoutBtn: {
    width: '100%',
    background: '#1e2937',
    border: 'none',
    color: '#e2e8f0',
    padding: '10px 16px',
    borderRadius: 8,
    cursor: 'pointer',
    fontSize: 14,
    fontWeight: 500,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    transition: 'all 0.2s',
  },

  main: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    background: '#f8fafc',
  },

  topbar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 28px',
    height: 64,
    borderBottom: '1px solid #e2e8f0',
    background: '#fff',
    flexShrink: 0,
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
  },

  topbarLeft: {
    display: 'flex',
    alignItems: 'center',
  },

  topbarRight: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
  },

  roleTag: {
    fontSize: 11,
    fontWeight: 700,
    padding: '4px 10px',
    background: '#ecfdf5',
    borderRadius: 9999,
    color: '#10b981',
    letterSpacing: '0.5px',
    textTransform: 'uppercase',
    boxShadow: '0 1px 2px rgba(16, 185, 129, 0.15)',
  },

  settingsLink: {
    display: 'flex',
    alignItems: 'center',
    fontSize: 13.5,
    color: '#64748b',
    textDecoration: 'none',
    fontWeight: 500,
    padding: '6px 14px',
    borderRadius: 9999,
    transition: 'all 0.2s',
  },

  content: {
    flex: 1,
    overflowY: 'auto',
    padding: '28px',
  },
};