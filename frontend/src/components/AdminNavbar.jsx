// code in this file is written by worapol สุดหล่อ
import React, { useContext, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import VelinLogo from './VelinLogo';
import './AdminNavbar.css';

const AdminNavbar = () => {
  const { user, logout } = useContext(AuthContext);
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [isLocked, setIsLocked] = React.useState(true); // Locked means pinned open - by worapol สุดหล่อ
  const [isHovered, setIsHovered] = React.useState(false);
  const [isProductsOpen, setIsProductsOpen] = React.useState(
    location.pathname.includes('/admin/product') || location.pathname.includes('/admin/inventory')
  );

  const isCollapsed = !isLocked && !isHovered;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Add body class for admin layout offset - by worapol สุดหล่อ
  useEffect(() => {
    if (user && (user.role === 'admin' || user.role === 'superadmin')) {
      document.body.classList.add('admin-active-layout');
      if (isCollapsed) {
        document.body.classList.add('admin-active-layout-collapsed');
      } else {
        document.body.classList.remove('admin-active-layout-collapsed');
      }
    } else {
      document.body.classList.remove('admin-active-layout');
      document.body.classList.remove('admin-active-layout-collapsed');
    }
    return () => {
      document.body.classList.remove('admin-active-layout');
      document.body.classList.remove('admin-active-layout-collapsed');
    };
  }, [user, isCollapsed]);

  if (!user || (user.role !== 'admin' && user.role !== 'superadmin')) return null;

  return (
    <aside
      className={`navbar-admin ${isCollapsed ? 'collapsed' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="nav-container-admin">
        <div className="nav-top">
          <div className="nav-header">
            <Link to="/admin" className="nav-logo-link">
              <VelinLogo className="admin-logo-svg" textColor="#111111" iconOnly={isCollapsed} width={isCollapsed ? undefined : 114} height={isCollapsed ? undefined : 38} />
            </Link>
            <button className={`lock-btn ${isLocked ? 'locked' : ''}`} onClick={() => setIsLocked(!isLocked)} title={isLocked ? "Unlock Sidebar" : "Lock Sidebar Open"}>
              {isLocked ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 9.9-1"></path>
                </svg>
              )}
            </button>
          </div>
          

          <div className="nav-divider"></div>
          <div className="nav-links">
            {!location.pathname.startsWith('/superadmin') && (
              <>
                <Link to="/admin" className={`nav-link ${location.pathname === '/admin' ? 'active' : ''}`} title={t('adm_dashboard')}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="7" height="9" rx="1"></rect><rect x="14" y="3" width="7" height="5" rx="1"></rect><rect x="14" y="12" width="7" height="9" rx="1"></rect><rect x="3" y="16" width="7" height="5" rx="1"></rect>
                  </svg>
                  <span className="nav-text">{t('adm_dashboard')}</span>
                </Link>
                <div className="nav-group">
                  <div 
                    className={`nav-link ${location.pathname.includes('/admin/product') || location.pathname.includes('/admin/inventory') ? 'active' : ''}`} 
                    onClick={() => setIsProductsOpen(!isProductsOpen)}
                    style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="16.5" y1="9.4" x2="7.5" y2="4.21"></line><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
                      <span className="nav-text" style={{ fontSize: '1rem', fontWeight: '500' }}>{t('adm_products')}</span>
                    </div>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: isProductsOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s', opacity: isCollapsed ? 0 : 1 }}>
                      <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                  </div>
                  {isProductsOpen && !isCollapsed && (
                    <div className="nav-submenu" style={{ display: 'flex', flexDirection: 'column', paddingLeft: '2.5rem', marginTop: '0.2rem', gap: '0.2rem' }}>
                      <Link to="/admin/products" className={`nav-link ${location.pathname === '/admin/products' ? 'active-sub' : ''}`} style={{ padding: '0.6rem 1rem', fontSize: '0.9rem', color: '#111', fontWeight: '700', borderRadius: '8px' }}>
                        {t('adm_products')}
                      </Link>
                      <Link to="/admin/inventory" className={`nav-link ${location.pathname.includes('/admin/inventory') ? 'active-sub' : ''}`} style={{ padding: '0.6rem 1rem', fontSize: '0.9rem', color: '#111', fontWeight: '700', borderRadius: '8px' }}>
                        {t('adm_inventory_summary')}
                      </Link>
                    </div>
                  )}
                </div>
                <Link to="/admin/orders" className={`nav-link ${location.pathname.includes('/admin/order') ? 'active' : ''}`} title={t('adm_orders')}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
                  <span className="nav-text">{t('adm_orders')}</span>
                </Link>
                <Link to="/admin/revenue" className={`nav-link ${location.pathname.includes('/admin/revenue') ? 'active' : ''}`} title={t('adm_revenue')}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"></path><path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3"></path></svg>
                  <span className="nav-text">{t('adm_revenue')}</span>
                </Link>
                <Link to="/admin/bestsellers" className={`nav-link ${location.pathname.includes('/admin/bestsellers') ? 'active' : ''}`} title={t('adm_bestsellers')}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                  <span className="nav-text">{t('adm_bestsellers')}</span>
                </Link>
                {user.role === 'superadmin' && (
                  <Link to="/admin/logs" className={`nav-link ${location.pathname.includes('/admin/logs') ? 'active' : ''}`} title={t('adm_logs')}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
                    <span className="nav-text">{t('adm_logs')}</span>
                  </Link>
                )}

                {user.role === 'superadmin' && (
                  <Link to="/superadmin/face-scan" className="nav-link special-link" title={t('adm_personnel')}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                    <span className="nav-text" style={{ color: '#8B5CF6', fontWeight: '800' }}>{t('adm_personnel')}</span>
                  </Link>
                )}
              </>
            )}

            {location.pathname.startsWith('/superadmin') && user.role === 'superadmin' && (
              <>
                <Link to="/superadmin/manage" className={`nav-link ${location.pathname === '/superadmin/manage' ? 'active' : ''}`} title={t('adm_manage')}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                  <span className="nav-text">{t('adm_manage')}</span>
                </Link>
                <div className="nav-divider"></div>
                <Link to="/admin" className="nav-link" title={t('adm_sales_dash')}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
                  <span className="nav-text">{t('adm_sales_dash')}</span>
                </Link>
              </>
            )}
          </div>
        </div>

        <div className="nav-bottom">
          <div className="admin-nav-controls">
            <div className="admin-profile-circle">{user.username.charAt(0).toUpperCase()}</div>
            <div className="admin-info">
              <span className="admin-label">{user.role === 'superadmin' ? 'Super Admin' : 'Admin'}</span>
              <span className="admin-name">{user.username}</span>
            </div>
          </div>
          <button className="admin-logout-btn" onClick={handleLogout} title={t('nav_logout')}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
            <span className="nav-text">{t('nav_logout')}</span>
          </button>
        </div>
      </div>
    </aside>
  );
};

export default AdminNavbar;
