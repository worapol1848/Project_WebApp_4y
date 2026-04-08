// code in this file is written by worapol สุดหล่อ
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../../services/api';
import { AuthContext } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import {
  Dialog,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography
} from '@mui/material';
import { useLanguage } from '../../context/LanguageContext';
import './Home.css';

const PromoSlider = ({ products, navigate }) => {
  // Use products with discounts or low stock as "Recommended/Best Sellers" - by worapol สุดหล่อ
  let promoProducts = products?.filter(p => p.discount_percent > 0 || p.stock < 20) || [];
  if (promoProducts.length < 4) {
    promoProducts = [...promoProducts, ...(products || [])];
  }
  promoProducts = promoProducts.slice(0, 4); // force 4 faces for the 3D cube - by worapol สุดหล่อ

  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (promoProducts.length <= 1) return;
    const timer = setInterval(() => {
      setCurrent((prev) => prev - 1);
    }, 5000);
    return () => clearInterval(timer);
  }, [promoProducts.length, current]);

  const nextSlide = (e) => {
    e.stopPropagation();
    setCurrent((prev) => prev - 1);
  };

  const prevSlide = (e) => {
    e.stopPropagation();
    setCurrent((prev) => prev + 1);
  };

  if (!promoProducts || promoProducts.length < 4) return null;

  // Calculate the currently visible face index (0 to 3) for the nav dots - by worapol สุดหล่อ
  const activeIdx = ((current % 4) + 4) % 4;

  return (
    <div className="promo-slider-container featured-card cube-system">
      <div 
        className="promo-cube" 
        style={{ transform: `translateZ(-50cqw) rotateY(${current * 90}deg)` }}
      >
        {promoProducts.map((product, idx) => {
          const imgUrl = product.image_url ? `http://localhost:5000${product.image_url.replace(/\\/g, '/')}` : 'https://via.placeholder.com/800x800?text=No+Image';
          return (
            <div
              key={`${product.id}-${idx}`}
              className="promo-cube-face"
              style={{
                transform: `rotateY(${idx * 90}deg) translateZ(50cqw)`,
                backgroundImage: `url("${encodeURI(imgUrl)}")`
              }}
              onClick={() => navigate(`/product/${product.id}`)}
            />
          );
        })}
      </div>
      
      {/* Navigation Arrows */}
      <button className="promo-arrow promo-arrow-left" onClick={prevSlide}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6"></polyline>
        </svg>
      </button>
      <button className="promo-arrow promo-arrow-right" onClick={nextSlide}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 18 15 12 9 6"></polyline>
        </svg>
      </button>

      <div className="promo-slider-nav">
        {promoProducts.map((_, idx) => {
          // Calculate shortest path for jump - by worapol สุดหล่อ
          let diff = (idx - activeIdx);
          if (diff > 2) diff -= 4;
          if (diff < -2) diff += 4;
          return (
            <button 
              key={idx} 
              className={idx === activeIdx ? 'active' : ''} 
              onClick={() => setCurrent(c => c - diff)}
            />
          );
        })}
      </div>
    </div>
  );
};

const Home = () => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { user } = React.useContext(AuthContext);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isBuyModalOpen, setIsBuyModalOpen] = useState(false);
  const [productToBuy, setProductToBuy] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [currentSlide, setCurrentSlide] = useState(0);
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

  const heroSlides = [
    {
      id: 13,
      image: '/Travis Scott x Air Jordan 1 Low OG WMNS “Olive”.png',
      subtitle: t('h_exclusive_drop'),
      title: t('h_cactus_jack'),
      desc: t('h_ts_desc'),
      link: '/product/13'
    },
    {
      isCollection: true,
      variants: [11, 8, 12, 9, 10], // IDs for Green, Maroon, Blue, Dark Grey, Oat - by worapol สุดหล่อ
      image: '/4 model.png',
      subtitle: t('h_new_coll_2026'),
      title: t('h_adidas_title'),
      desc: t('h_adidas_desc'),
      link: '/product/11'
    }
  ];

  useEffect(() => {
    fetchProducts();
    fetchWishlist();

    const handleUpdate = () => fetchWishlist();
    window.addEventListener('wishlistUpdated', handleUpdate);
    return () => window.removeEventListener('wishlistUpdated', handleUpdate);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 8000);
    return () => clearInterval(timer);
  }, [currentSlide, heroSlides.length]);

  const fetchProducts = async () => {
    try {
      const res = await api.get('/products');
      setProducts(res.data);
    } catch (err) {
      console.error('Failed to fetch products', err);
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
      setWishlist([]); // Clear if not logged in - by worapol สุดหล่อ
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

    if (user) {
      // If user is logged in, send to backend API - by worapol สุดหล่อ
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
        fetchProducts();
      } catch (err) {
        showToast(err.response?.data?.message || t('error'), 'error');
      }
    } else {
      // Fallback for guest (though openBuyModal prevents it, keep for safety or future use) - by worapol สุดหล่อ
      const cartItem = {
        id: productToBuy.id,
        name: productToBuy.name,
        original_price: productToBuy.price,
        discount_percent: productToBuy.discount_percent || 0,
        price: productToBuy.discount_percent > 0 ? productToBuy.price * (1 - productToBuy.discount_percent / 100) : productToBuy.price,
        image_url: productToBuy.image_url,
        size: selectedSize.size,
        quantity: quantity
      };

      const cartKey = 'cart_guest';
      const currentCart = JSON.parse(localStorage.getItem(cartKey) || '[]');
      const existingItemIdx = currentCart.findIndex(item => item.id === productToBuy.id && item.size === selectedSize.size);

      if (existingItemIdx > -1) {
        currentCart[existingItemIdx].quantity += quantity;
      } else {
        currentCart.push(cartItem);
      }

      localStorage.setItem(cartKey, JSON.stringify(currentCart));
      window.dispatchEvent(new Event('cartUpdated'));
      showToast(`${t('cart_add_success')} ${productToBuy.name}`, "success");
      setIsBuyModalOpen(false);
      setProductToBuy(null);
      setSelectedSize(null);
      setQuantity(1);
    }
  };


  if (loading) return <div className="loading-screen">{t('h_loading_exp')}</div>;

  return (
    <div className="home-bg">
      {/* Premium Hero Banner Slider */}
      <div className="hero-banner-container">
        {heroSlides.map((slide, index) => (
          <div 
            key={index}
            className={`hero-slide ${index === currentSlide ? 'active' : ''}`}
            style={{ 
              backgroundImage: `linear-gradient(rgba(0,0,0,0.2), rgba(0,0,0,0.45)), url("${encodeURI(slide.image)}")`,
              backgroundAttachment: 'fixed'
            }}
          >
            <div className="hero-content">
              <span className="hero-subtitle">{slide.subtitle}</span>
              <h1 className="hero-title">{slide.title.split('\n').map((line, i) => <React.Fragment key={i}>{line}<br/></React.Fragment>)}</h1>
              <p className="hero-desc">{slide.desc}</p>
              
              {/* Integrated Landing Card (Below Description) or Collection Grid */}
              {slide.isCollection ? (
                <div className="landing-collection-grid">
                  {slide.variants.map((vId) => {
                    const productData = products.find(p => p.id === vId);
                    const thumb = productData?.image_url 
                      ? `http://localhost:5000${productData.image_url}` 
                      : slide.image;
                    
                    return (
                      <div key={vId} className="inline-tile collection-variant" onClick={() => navigate(`/product/${vId}`)}>
                        <img src={thumb} alt="" />
                        <div className="inline-tile-info">
                          <span className="tile-action">• {t('h_shop_now')}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="landing-card-inline-cta" onClick={() => navigate(slide.link)}>
                  {(() => {
                    const productData = products.find(p => p.id === slide.id);
                    const actualThumb = productData?.image_url 
                      ? `http://localhost:5000${productData.image_url}` 
                      : slide.image;

                    return (
                      <div className="inline-tile">
                        <img src={actualThumb} alt="" />
                        <div className="inline-tile-info">
                          <span className="tile-action">• {t('h_shop_now')}</span>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>

          </div>
        ))}

        {/* Persistent Shop the Drop CTA (Always Visible) */}
        <div className="hero-cta-section bottom-right-fixed">
          <button 
            className="hero-btn premium-cta" 
            onClick={() => {
              const el = document.getElementById('latest-releases');
              if(el) el.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            {t('h_shop_drop')}
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: '10px' }}>
              <polyline points="7 13 12 18 17 13"></polyline>
              <polyline points="7 6 12 11 17 6"></polyline>
            </svg>
          </button>
        </div>

        {/* Slider Indicators */}
        <div className="hero-indicators-bar">
          {heroSlides.map((_, index) => (
            <div 
              key={index} 
              className={`indicator-segment ${index === currentSlide ? 'active' : ''}`}
              onClick={() => setCurrentSlide(index)}
            >
              <div className="segment-fill"></div>
            </div>
          ))}
        </div>
      </div>

      <div className="home-container" id="latest-releases">
        <div className="home-lookbook-header centered-aesthetic">
          <span className="section-pre-title">{t('h_collection')}</span>
          <h2>{t('h_lookbook')}</h2>
          <div className="section-divider-minimal"></div>
          <p>{t('h_lookbook_desc')}</p>
        </div>

        <div className="products-grid">
          {/* Pure image sliding block occupying the left section, with actual recommended products */}
          <PromoSlider products={products} navigate={navigate} />

          {products.map((product) => (
            <div 
              key={product.id}
              className="product-card normal-card"
              onClick={() => navigate(`/product/${product.id}`)}
            >
              <div className="product-image">
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
                
                <p className="sub-tagline">{product.stock > 0 ? `${product.stock} ${t('h_items_left')}` : t('h_out_of_stock')}</p>

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
      </div>

      {/* Minimalist Buy Modal with Size & Qty */}
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
                  <button
                    onClick={() => setQuantity(Math.min(selectedSize?.stock || 1, quantity + 1))}
                    disabled={!selectedSize || quantity >= selectedSize.stock}
                  >+</button>
                </div>
              </div>

              <div className="modal-buy-footer">
                <button
                  className={`modal-confirm-buy ${!selectedSize ? 'disabled' : ''}`}
                  disabled={!selectedSize}
                  onClick={handleOrder}
                >
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
          <Typography variant="h6" fontWeight="1000" sx={{ color: '#111827', mb: 1.5 }}>
            {confirmDialog.title}
          </Typography>
          <Typography variant="body2" sx={{ color: '#6B7280', px: 2, lineHeight: 1.6, fontWeight: '500' }}>
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

export default Home;
