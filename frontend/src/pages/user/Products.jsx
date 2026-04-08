// code in this file is written by worapol สุดหล่อ
import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import { AuthContext } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useLanguage } from '../../context/LanguageContext';
import {
  Dialog,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography
} from '@mui/material';
import './Products.css';

// Custom Products Hero featuring requested images - by worapol สุดหล่อ
const ProductsHero = ({ title }) => {
  const [current, setCurrent] = useState(0);
  const heroImages = [
    { url: '/4 model.png', subtitle: 'COLLECTION 2026' },
    { url: '/adidas.png', subtitle: 'STREETWEAR DROPS' },
    { url: '/Travis Scott x Air Jordan 1 Low OG WMNS “Olive”.png', subtitle: 'EXCLUSIVE SNEAKERS' }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % heroImages.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="products-hero-wrapper">
      <div className="products-hero-slides">
        {heroImages.map((img, idx) => (
          <div
            key={idx}
            className={`products-hero-slide ${idx === current ? 'active' : ''}`}
            style={{ 
              position: 'absolute',
              inset: 0,
              backgroundImage: `url("${img.url}")`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              opacity: idx === current ? 1 : 0,
              transition: 'opacity 1.2s ease-in-out',
              zIndex: idx === current ? 2 : 1
            }}
          >
            <div className="products-hero-overlay">
              <span className="hero-floating-badge" style={{ marginBottom: '1rem', position: 'relative', top: 0, left: 0 }}>FEATURED</span>
              <h1 className="products-hero-title">{title}</h1>
              <p className="products-hero-subtitle">{img.subtitle}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="hero-slider-dots">
        {heroImages.map((_, idx) => (
          <div 
            key={idx} 
            className={`indicator-segment ${idx === current ? 'active' : ''}`}
            onClick={() => setCurrent(idx)}
          >
            <div className="segment-fill"></div>
          </div>
        ))}
      </div>
    </div>
  );
};

const Products = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { showToast } = useToast();
  const { user } = useContext(AuthContext);
  const { t } = useLanguage();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isBuyModalOpen, setIsBuyModalOpen] = useState(false);
  const [productToBuy, setProductToBuy] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [wishlist, setWishlist] = useState([]);
  const [confirmDialog, setConfirmDialog] = useState({ open: false, title: '', message: '', onConfirm: null, isAlert: false });

  const showAlert = (titleKey, messageKey) => {
    setConfirmDialog({ 
      open: true, 
      title: t(titleKey), 
      message: t(messageKey), 
      onConfirm: null, 
      isAlert: true 
    });
  };

  const brand = searchParams.get('brand');
  const type = searchParams.get('type');
  const category = searchParams.get('category');
  const sort = searchParams.get('sort');
  const sale = searchParams.get('sale');
  const minPrice = searchParams.get('minPrice');
  const maxPrice = searchParams.get('maxPrice');

  useEffect(() => {
    fetchFilteredProducts();
    fetchWishlist();

    const handleUpdate = () => fetchWishlist();
    window.addEventListener('wishlistUpdated', handleUpdate);
    return () => window.removeEventListener('wishlistUpdated', handleUpdate);
  }, [brand, type, category, sort, sale, minPrice, maxPrice]);

  const fetchFilteredProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (brand) params.append('brand', brand);
      if (type) params.append('type', type);
      if (category) params.append('category', category);
      if (sort) params.append('sort', sort);
      if (sale) params.append('sale', sale);
      if (minPrice) params.append('minPrice', minPrice);
      if (maxPrice) params.append('maxPrice', maxPrice);

      const res = await api.get(`/products?${params.toString()}`);
      setProducts(res.data);
    } catch (err) {
      console.error('Failed to fetch filtered products', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchWishlist = async () => {
    if (user) {
      try {
        const res = await api.get('/wishlist');
        setWishlist(res.data.map(i => i.id));
      } catch (err) {
        console.error("Wishlist fetch error:", err);
      }
    } else {
      setWishlist([]);
    }
  };

  const toggleWishlist = async (product) => {
    if (!user) {
      showAlert('auth_title_wish', 'auth_msg_wish');
      return;
    }

    try {
      if (wishlist.includes(product.id)) {
        await api.delete(`/wishlist/${product.id}`);
        setWishlist(prev => prev.filter(id => id !== product.id));
        showToast(t('wish_removed'), 'info');
      } else {
        await api.post('/wishlist', { productId: product.id });
        setWishlist(prev => [...prev, product.id]);
        showToast(t('wish_added'), 'success');
      }
      window.dispatchEvent(new Event('wishlistUpdated'));
    } catch (err) {
      showToast(t('error'), 'error');
    }
  };

  const openBuyModal = (product) => {
    if (!user) {
      showAlert('auth_title_order', 'auth_msg_order');
      return;
    }
    setProductToBuy(product);
    setSelectedSize(null);
    setQuantity(1);
    setIsBuyModalOpen(true);
  };

  const handleOrder = async () => {
    if (!productToBuy || !selectedSize) return;

    try {
      await api.post('/cart', {
        productId: productToBuy.id,
        quantity: quantity,
        size: selectedSize.size
      });
      window.dispatchEvent(new Event('cartUpdated'));
      showToast(`${t('cart_add_success')} ${productToBuy.name}`, "success");
      setIsBuyModalOpen(false);
      setProductToBuy(null);
      setSelectedSize(null);
      setQuantity(1);
      fetchFilteredProducts();
    } catch (err) {
      showToast(err.response?.data?.message || t('error'), 'error');
    }
  };

  if (loading) return <div className="home-bg"><div className="products-page-container">{t('loading')}</div></div>;

  return (
    <div className="home-bg">
      <div className="products-page-container">
        
        {/* Layout 1: SHOP ALL (No filters active) */}
        {!brand && !type && !category && !sale && !sort && products.length > 0 && (
          <>
            <ProductsHero title={t('ps_all_products')} />
            
            <div className="brands-bar-wrapper">
              {[
                { name: 'Nike', icon: 'https://cdn.simpleicons.org/nike/000000' },
                { name: 'Adidas', icon: 'https://cdn.simpleicons.org/adidas/000000' },
                { name: 'New Balance', icon: 'https://cdn.simpleicons.org/newbalance/000000' },
                { name: 'Asics', icon: 'https://cdn.worldvectorlogo.com/logos/asics-1.svg' },
                { name: 'Converse', icon: 'https://cdn.worldvectorlogo.com/logos/converse-1.svg' },
                { name: 'Stussy', icon: '/Stussy logo.jpg' },
                { name: 'Puma', icon: 'https://cdn.simpleicons.org/puma/000000' }
              ].map(b => (
                <div 
                  key={b.name} 
                  className="brand-item"
                  onClick={() => navigate(`/products?brand=${b.name}`)}
                >
                  <div className="brand-logo-circle">
                    <img src={b.icon} alt={b.name} />
                  </div>
                  <span className="brand-name-text">{b.name}</span>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Layout 2: CATEGORY VIEW (Filters active) */}
        {(brand || type || category || sale || sort) && (
          <div className="category-view-container" style={{ marginBottom: '4rem' }}>
             {/* Category Cover Image & Header */}
             <div className="category-header-clean" style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
                <h2 style={{ fontSize: '3rem', fontWeight: '1000', color: '#111', textTransform: 'uppercase', marginBottom: '1.5rem', letterSpacing: '-2px' }}>
                    {brand ? brand : 
                     type === 'apparel' ? t('nav_apparel') : 
                     type === 'shoe' ? t('nav_shoes') : 
                     category ? category : 
                     sale === 'true' ? t('nav_promo') :
                     sort === 'popular' ? t('nav_popular') :
                     t('nav_categories')}
                </h2>
                
                {/* Representative Category Image (Centered/Smaller) */}
                <div style={{ maxWidth: '1000px', margin: '0 auto', height: '320px', borderRadius: '30px', overflow: 'hidden', backgroundColor: '#f0f0f0' }}>
                   <img 
                     src={
                        brand === 'Nike' ? 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=1000' :
                        brand === 'Adidas' ? 'https://images.unsplash.com/photo-1518002171953-a080ee817e1f?q=80&w=1000' :
                        brand === 'Stussy' ? '/Stussy1.png' :
                        brand === 'New Balance' ? '/NEW balance.jpg' :
                        brand === 'Converse' ? 'https://images.unsplash.com/photo-1494496195158-c3becb4f2475?q=80&w=1000' :
                        brand === 'Puma' ? '/PUMA.jpg' :
                        brand === 'Asics' ? '/ASICS.png' :
                        type === 'shoe' ? 'https://images.unsplash.com/photo-1460353581641-37baddab0fa2?q=80&w=1000' :
                        'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?q=80&w=1000'
                     } 
                     alt="Category Banner" 
                     style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                   />
                </div>

                {/* History/About Section */}
                <div style={{ maxWidth: '800px', margin: '2.5rem auto 0', textAlign: 'center' }}>
                   <div style={{ width: '40px', height: '3px', background: '#0ea5e9', margin: '0 auto 1.5rem' }}></div>
                   <p style={{ fontSize: '1.1rem', color: '#4b5563', lineHeight: '1.8', fontStyle: 'italic', fontWeight: '500' }}>
                      {brand === 'Nike' && t('ps_desc_nike')}
                      {brand === 'Adidas' && t('ps_desc_adidas')}
                      {brand === 'Stussy' && t('ps_desc_stussy')}
                      {brand === 'New Balance' && t('ps_desc_new_balance')}
                      {brand === 'Asics' && t('ps_desc_asics')}
                      {brand === 'Converse' && t('ps_desc_converse')}
                      {brand === 'Puma' && t('ps_desc_puma')}
                      {(!brand) && t('ps_desc_default')}
                   </p>
                </div>
             </div>
          </div>
        )}

        {/* Found Items Text */}
        <div className="products-found-text">
          {t('ps_found')} {products.length} {t('ps_items')}
        </div>

        {products.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem', background: '#fff', border: '1px solid #eee', borderRadius: '24px' }}>
            <h3 style={{ color: '#888' }}>{t('ps_no_products')}</h3>
            <button onClick={() => navigate('/')} style={{ marginTop: '1rem', padding: '0.8rem 1.5rem', borderRadius: '10px', background: '#111', color: '#fff', border: 'none', cursor: 'pointer' }}>
              {t('ps_go_back')}
            </button>
          </div>
        ) : (
          <div className="products-grid">
            {products.map(product => (
              <div key={product.id} className="product-card" onClick={() => navigate(`/product/${product.id}`)}>
                <div className="product-image" style={{ boxShadow: 'none' }}>
                  {product.discount_percent > 0 && (
                    <div className="discount-badge-home">-{product.discount_percent}%</div>
                  )}
                  <button 
                     className={`wishlist-btn-grid ${wishlist.includes(product.id) ? 'active' : ''}`}
                     onClick={(e) => { e.stopPropagation(); toggleWishlist(product); }}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill={wishlist.includes(product.id) ? '#ff4b4b' : 'none'} stroke={wishlist.includes(product.id) ? '#ff4b4b' : '#CBD5E0'} strokeWidth="2">
                      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"></path>
                    </svg>
                  </button>
                  <img src={product.image_url ? `http://localhost:5000${product.image_url}` : 'https://via.placeholder.com/300x200?text=No+Image'} alt={product.name} />
                </div>
                <div className="product-info">
                  <div className="product-header-row">
                    <h3>{product.name}</h3>
                    <div className="price-box-side">
                      {product.total_reviews > 0 && (
                        <div className="product-rating-card-small">
                          <div className="stars-mini">
                            {[...Array(5)].map((_, i) => (
                              <span key={i} className="star-icon-mini" style={{ color: i < Math.round(product.avg_rating) ? '#fbbf24' : '#e2e8f0' }}>★</span>
                            ))}
                          </div>
                          <span className="rating-val-mini" style={{ marginLeft: '4px' }}>{Number(product.avg_rating).toFixed(1)}</span>
                        </div>
                      )}
                      <span className="price-main">
                        ฿{product.discount_percent > 0 
                          ? Number(product.price * (1 - product.discount_percent / 100)).toLocaleString() 
                          : Number(product.price).toLocaleString()
                        }
                      </span>
                      {product.discount_percent > 0 && (
                        <span className="old-price">฿{Number(product.price).toLocaleString()}</span>
                      )}
                    </div>
                  </div>
                  
                  <p className="sub-tagline">{product.stock > 0 ? `${product.stock} ${t('h_items_left')}` : t('h_sold_out')}</p>

                  <button
                    className="buy-btn"
                    disabled={product.stock === 0}
                    onClick={(e) => { e.stopPropagation(); openBuyModal(product); }}
                  >
                    {product.stock === 0 ? t('h_sold_out') : t('h_buy_now')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {isBuyModalOpen && productToBuy && (
        <div className="order-modal-overlay">
          <div className="order-modal-content minimalist-buy-modal">
            <div className="modal-header-modern">
              <button className="close-modal-btn" onClick={() => setIsBuyModalOpen(false)}>×</button>
            </div>
            <div className="buy-modal-body">
              <div className="modal-product-summary">
                <img src={productToBuy.image_url ? `http://localhost:5000${productToBuy.image_url}` : ''} alt="" className="modal-thumb" />
                <div className="modal-pd-info">
                  <h4>{productToBuy.name}</h4>
                  <div className="modal-price">
                    {productToBuy.discount_percent > 0 ? (
                      <div className="price-with-discount">
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ textDecoration: 'line-through', color: '#9CA3AF', marginRight: '8px', fontSize: '0.9em' }}>฿{Number(productToBuy.price).toLocaleString()}</span>
                          <span style={{ color: '#10B981', fontWeight: '800', fontSize: '1.3rem' }}>฿{Number(productToBuy.price * (1 - productToBuy.discount_percent / 100)).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</span>
                        </div>
                        <span className="discount-badge-small">-{productToBuy.discount_percent}%</span>
                      </div>
                    ) : (
                      `฿${Number(productToBuy.price).toLocaleString()}`
                    )}
                  </div>
                </div>
              </div>
              <div className="modal-section">
                <label>{t('pd_select_size')}</label>
                <div className="modal-size-grid">
                  {productToBuy.sizes?.map(s => (
                    <button
                      key={s.id}
                      className={`modal-size-box ${s.stock === 0 ? 'out' : ''} ${selectedSize?.id === s.id ? 'active' : ''}`}
                      onClick={() => s.stock > 0 && setSelectedSize(s)}
                      disabled={s.stock === 0}
                    >
                      {s.size}
                    </button>
                  ))}
                </div>
              </div>
              <div className="modal-section">
                <label>{t('pd_quantity')}</label>
                <div className="modal-qty-controls">
                  <button onClick={() => setQuantity(Math.max(1, quantity - 1))}>-</button>
                  <span>{quantity}</span>
                  <button onClick={() => setQuantity(Math.min(selectedSize?.stock || 1, quantity + 1))} disabled={!selectedSize || quantity >= selectedSize.stock}>+</button>
                </div>
              </div>
              <div className="modal-buy-footer">
                <button className={`modal-confirm-buy ${!selectedSize ? 'disabled' : ''}`} disabled={!selectedSize} onClick={handleOrder}>
                  {selectedSize ? `${t('pd_add_to_cart')} (฿${Number((productToBuy.discount_percent > 0 ? productToBuy.price * (1 - productToBuy.discount_percent / 100) : productToBuy.price) * quantity).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })})` : t('pd_select_size')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Premium Alert/Confirm Dialog */}
      <Dialog
        open={confirmDialog.open}
        onClose={() => setConfirmDialog({ ...confirmDialog, open: false })}
        PaperProps={{ sx: { borderRadius: '28px', p: 1, maxWidth: '400px' } }}
      >
        <DialogContent sx={{ textAlign: 'center', pt: 4 }}>
          <Box sx={{
            width: 64, height: 64, borderRadius: '50%',
            bgcolor: confirmDialog.title === 'Error' ? '#FEF2F2' : '#F0F9FF',
            display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 3
          }}>
            {confirmDialog.title === 'Error' ? (
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
            ) : (
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#0EA5E9" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path><polyline points="10 17 15 12 10 7"></polyline><line x1="15" y1="12" x2="3" y2="12"></line></svg>
            )}
          </Box>
          <Typography variant="h6" fontWeight="900" sx={{ color: '#111827', mb: 1.5 }}>
            {confirmDialog.title}
          </Typography>
          <Typography variant="body2" sx={{ color: '#6B7280', px: 2, lineHeight: 1.6 }}>
            {confirmDialog.message}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 4, pt: 1, gap: 2 }}>
          {confirmDialog.isAlert ? (
            <>
              <Button
                variant="outlined"
                fullWidth
                onClick={() => setConfirmDialog({ ...confirmDialog, open: false })}
                sx={{
                  borderColor: '#E5E7EB',
                  color: '#374151',
                  borderRadius: '16px',
                  fontWeight: '1000',
                  textTransform: 'none',
                  py: 2,
                  '&:hover': { bgcolor: '#F9FAFB', borderColor: '#D1D5DB' }
                }}
              >
                {t('dismiss')}
              </Button>
              <Button
                variant="contained"
                fullWidth
                onClick={() => navigate('/login')}
                sx={{
                  bgcolor: '#111827',
                  color: '#fff',
                  borderRadius: '16px',
                  fontWeight: '1000',
                  textTransform: 'none',
                  py: 2,
                  '&:hover': { bgcolor: '#000' }
                }}
              >
                {t('login')}
              </Button>
            </>
          ) : (
            <Button
              variant="contained"
              fullWidth
              onClick={() => {
                if (confirmDialog.onConfirm) confirmDialog.onConfirm();
                setConfirmDialog({ ...confirmDialog, open: false });
              }}
              sx={{
                bgcolor: '#111827',
                color: '#fff',
                borderRadius: '16px',
                fontWeight: '1000',
                textTransform: 'none',
                py: 2,
                '&:hover': { bgcolor: '#000' }
              }}
            >
              {t('ok')}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default Products;
