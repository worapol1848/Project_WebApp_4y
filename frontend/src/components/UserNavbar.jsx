// code in this file is written by worapol สุดหล่อ
import React, { useContext, useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import LanguageSwitcher from './LanguageSwitcher';
import './UserNavbar.css';

const UserNavbar = () => {
  const { user, logout } = useContext(AuthContext);
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [allProducts, setAllProducts] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [filters, setFilters] = useState({ brands: [], categories: [], productTypes: [] });
  
  // Price Slider State - by worapol สุดหล่อ
  const minPossible = 0;
  const maxPossible = 100000;
  const [sliderMin, setSliderMin] = useState(minPossible);
  const [sliderMax, setSliderMax] = useState(maxPossible);

  const userMenuRef = useRef(null);
  const searchResultsRef = useRef(null);

  // Reset states on route change - by worapol สุดหล่อ
  useEffect(() => {
    setIsUserMenuOpen(false);
    setIsSearchOpen(false);
    setIsSearching(false);
    setSearchTerm('');
  }, [location.pathname]);

  // Click outside listeners - by worapol สุดหล่อ
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
      if (searchResultsRef.current && !searchResultsRef.current.contains(event.target)) {
        setIsSearching(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Hide/Show on scroll - by worapol สุดหล่อ
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }
      setLastScrollY(currentScrollY);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  useEffect(() => {
    updateCartCount();
    updateWishlistCount();
    window.addEventListener('cartUpdated', updateCartCount);
    window.addEventListener('wishlistUpdated', updateWishlistCount);
    return () => {
      window.removeEventListener('cartUpdated', updateCartCount);
      window.removeEventListener('wishlistUpdated', updateWishlistCount);
    };
  }, [user]);

  const updateCartCount = async () => {
    if (user) {
      try {
        const res = await api.get('/cart');
        const count = res.data.reduce((sum, item) => sum + (item.quantity || 1), 0);
        setCartCount(count);
      } catch (err) {
        setCartCount(0);
      }
    } else {
      const items = JSON.parse(localStorage.getItem('cart_guest') || '[]');
      const count = items.reduce((sum, item) => sum + (item.quantity || 1), 0);
      setCartCount(count);
    }
  };

  const updateWishlistCount = async () => {
    if (user) {
      try {
        const res = await api.get('/wishlist');
        setWishlistCount((res.data || []).length);
      } catch (err) {
        console.error("Failed to update wishlist count:", err);
      }
    } else {
      const wishKey = user ? `wishlist_${user.id}` : 'wishlist_guest';
      const items = JSON.parse(localStorage.getItem(wishKey) || '[]');
      setWishlistCount(items.length);
    }
  };

  // Fetch Filters (Brands & Categories) - by worapol สุดหล่อ
  useEffect(() => {
    api.get('/products/filters')
      .then(res => setFilters(res.data))
      .catch(err => console.error('Error fetching filters:', err));
  }, []);

  // Search Logic - by worapol สุดหล่อ
  useEffect(() => {
    if (isSearchOpen && allProducts.length === 0) {
      api.get('/products').then(res => setAllProducts(res.data)).catch(err => console.error(err));
    }
  }, [isSearchOpen, allProducts.length]);

  useEffect(() => {
    const term = searchTerm.toLowerCase().trim();
    if (term.length > 0) {
      setIsSearching(true);
      const filtered = allProducts.filter(p => p.name?.toLowerCase().includes(term));
      setSearchResults(filtered.slice(0, 8));
    } else {
      setSearchResults([]);
      setIsSearching(false);
    }
  }, [searchTerm, allProducts]);

  const handleSliderChange = (e, type) => {
    const value = parseInt(e.target.value);
    const minGap = 1000;
    if (type === 'min') {
      if (value < sliderMax - minGap) setSliderMin(value);
    } else {
      if (value > sliderMin + minGap) setSliderMax(value);
    }
  };

  const applyPriceFilter = () => {
    navigate(`/products?minPrice=${sliderMin}&maxPrice=${sliderMax}`);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className={`navbar-user ${isVisible ? 'navbar-visible' : 'navbar-hidden'}`}>
      <div className="nav-container">

        <div className="nav-left">
          <Link to="/" className="nav-logo-link">
            <span className="logo-text">VELIN</span>
          </Link>
          <div className="nav-links">
            <Link to="/" className="nav-link">{t('nav_home')}</Link>
            <Link to="/products" className="nav-link">{t('nav_products')}</Link>
            
            {/* Mega Menu Dropdown */}
            <div className="nav-dropdown-wrapper">
              <button className="nav-link dropdown-trigger">
                {t('nav_categories')}
                <svg className="dropdown-arrow-animated" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: '3px' }}>
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </button>
              <div className="mega-menu">
                <div className="mega-menu-content">
                    <div className="mega-column">
                      <h4>{t('nav_brands')}</h4>
                      <Link to="/products?brand=Adidas">Adidas</Link>
                      <Link to="/products?brand=Asics">Asics</Link>
                      <Link to="/products?brand=Converse">Converse</Link>
                      <Link to="/products?brand=New Balance">New Balance</Link>
                      <Link to="/products?brand=Nike">Nike</Link>
                      <Link to="/products?brand=Puma">Puma</Link>
                      <Link to="/products?brand=Stussy">Stussy</Link>
                    </div>
                  {filters.productTypes.length > 0 && (
                    <div className="mega-column">
                      <h4>{t('nav_product_types')}</h4>
                      {filters.productTypes.map(type => (
                        <Link key={type} to={`/products?type=${type}`}>
                          {type === 'apparel' ? t('nav_apparel') : type === 'shoe' ? t('nav_shoes') : type}
                        </Link>
                      ))}
                    </div>
                  )}
                  <div className="mega-column">
                    <h4>{t('nav_recommended')}</h4>
                    <Link to="/products?sort=newest">{t('nav_newest')}</Link>
                    <Link to="/products?sort=popular">{t('nav_popular')}</Link>
                    <Link to="/products?sale=true" className="sale-link">{t('nav_promo')}</Link>
                  </div>
                </div>
              </div>
            </div>

            {/* Price Range Dropdown */}
            <div className="nav-dropdown-wrapper">
              <button className="nav-link dropdown-trigger">
                {t('nav_price')}
                <svg className="dropdown-arrow-animated" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: '3px' }}>
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </button>
              <div className="standard-dropdown">
                <div className="price-slider-container">
                  <div className="slider-values" style={{ marginBottom: '15px' }}>
                    <div className="val-group">
                      <span className="val-label">{t('nav_min')}</span>
                      <span className="val-amount">฿{sliderMin.toLocaleString()}</span>
                    </div>
                    <div className="val-group" style={{ textAlign: 'right' }}>
                      <span className="val-label">{t('nav_max')}</span>
                      <span className="val-amount">฿{sliderMax.toLocaleString()}</span>
                    </div>
                  </div>
                  
                  <div className="slider-track-wrapper">
                    <div 
                      className="slider-track-highlight" 
                      style={{ 
                        left: `${(sliderMin / maxPossible) * 100}%`, 
                        right: `${100 - (sliderMax / maxPossible) * 100}%` 
                    }}
                    ></div>
                    <div className="range-input-wrapper">
                      <input 
                        type="range" 
                        min={minPossible} 
                        max={maxPossible} 
                        value={sliderMin} 
                        step="1000"
                        onChange={(e) => handleSliderChange(e, 'min')}
                        className="min-range"
                      />
                      <input 
                        type="range" 
                        min={minPossible} 
                        max={maxPossible} 
                        value={sliderMax} 
                        step="1000"
                        onChange={(e) => handleSliderChange(e, 'max')}
                        className="max-range"
                      />
                    </div>
                  </div>
                  
                  <button className="apply-price-btn" onClick={applyPriceFilter} style={{ marginTop: '25px', padding: '12px', background: '#000', borderRadius: '12px' }}>
                    {t('nav_search_price')}
                  </button>

                  <div className="price-presets" style={{ marginTop: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', borderTop: '1px solid rgba(0,0,0,0.05)', paddingTop: '15px' }}>
                    <Link to="/products?maxPrice=5000" style={{ fontSize: '0.75rem', color: '#666', textDecoration: 'none', background: 'rgba(0,0,0,0.03)', padding: '6px', borderRadius: '6px', textAlign: 'center' }}>{t('nav_under')} 5,000</Link>
                    <Link to="/products?minPrice=5000&maxPrice=10000" style={{ fontSize: '0.75rem', color: '#666', textDecoration: 'none', background: 'rgba(0,0,0,0.03)', padding: '6px', borderRadius: '6px', textAlign: 'center' }}>5,000 - 10,000</Link>
                    <Link to="/products?minPrice=10000&maxPrice=50000" style={{ fontSize: '0.75rem', color: '#666', textDecoration: 'none', background: 'rgba(0,0,0,0.03)', padding: '6px', borderRadius: '6px', textAlign: 'center' }}>10,000 - 50,000</Link>
                    <Link to="/products?minPrice=50000" style={{ fontSize: '0.75rem', color: '#666', textDecoration: 'none', background: 'rgba(0,0,0,0.03)', padding: '6px', borderRadius: '6px', textAlign: 'center' }}>50,000 {t('nav_up')}</Link>
                  </div>
                </div>
              </div>
            </div>

            {user && <Link to="/myorders" className="nav-link">{t('nav_my_orders')}</Link>}
          </div>
        </div>

        <div className="nav-right">
          
          {/* Sliding Search */}
          <div className={`nav-sliding-search ${isSearchOpen ? 'open' : ''}`} ref={searchResultsRef}>
            <button className="nav-icon-btn" onClick={() => setIsSearchOpen(!isSearchOpen)}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </button>
            <input
              type="text"
              placeholder={t('nav_search_placeholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="nav-search-input"
            />
            {isSearchOpen && isSearching && (
              <div className="search-dropdown">
                {searchResults.length === 0 ? (
                  <div className="dropdown-header">{t('nav_no_found')}</div>
                ) : (
                  searchResults.map(item => (
                    <div key={item.id} className="search-item" onClick={() => navigate(`/product/${item.id}`)}>
                      <img src={item.image_url ? `http://localhost:5000${item.image_url}` : 'https://via.placeholder.com/40'} alt="" />
                      <div className="search-item-info">
                        <p className="search-item-name">{item.name}</p>
                        <p className="search-item-price">฿{Number(item.price).toLocaleString()}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Auth Controls */}
          {user ? (
            <>
              {/* Wishlist */}
              <Link to="/wishlist" className="nav-icon-btn wishlist-nav-link">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"></path>
                </svg>
              </Link>

              {/* Cart */}
              <Link to="/cart" className="nav-icon-btn bag-icon-container">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"></path>
                  <line x1="3" y1="6" x2="21" y2="6"></line>
                  <path d="M16 10a4 4 0 0 1-8 0"></path>
                </svg>
                {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
              </Link>

              {/* User Profile */}
              <div className="user-dropdown-container" ref={userMenuRef}>
                <button className="user-menu-trigger" onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                  <span className="user-name">{user.username}</span>
                </button>
                {isUserMenuOpen && (
                  <div className="user-dropdown-menu">
                    <div className="dropdown-header">
                      <p className="dropdown-user-role">{t('nav_user_acc')}</p>
                      <p className="dropdown-user-name">{user.username}</p>
                    </div>
                    <div className="dropdown-divider"></div>
                    {(user.role === 'admin' || user.role === 'superadmin') && (
                      <Link to="/admin" className="dropdown-link admin-access-link" style={{ color: '#6366f1', fontWeight: '700' }}>{t('adm_dashboard')}</Link>
                    )}
                    <Link to="/profile" className="dropdown-link">{t('nav_profile')}</Link>
                    <button className="btn-logout dropdown-link logout-link" onClick={handleLogout}>{t('nav_logout')}</button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <Link to="/login" className="nav-link guest-login-btn">
              {t('nav_login_reg')}
            </Link>
          )}

          <LanguageSwitcher />
        </div>

      </div>
    </nav>
  );
};

export default UserNavbar;
