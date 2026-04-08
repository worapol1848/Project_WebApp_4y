// code in this file is written by worapol สุดหล่อ
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogActions, Box, Typography, Button } from '@mui/material';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { useLanguage } from '../../context/LanguageContext';
import './ProductDetail.css';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { t, language } = useLanguage();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mainImage, setMainImage] = useState(null);

  const [selectedSize, setSelectedSize] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [rating, setRating] = useState(0); // Start with 0 stars - by worapol สุดหล่อ
  const [hoverRating, setHoverRating] = useState(0);
  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [authDialog, setAuthDialog] = useState({ open: false, titleKey: '', messageKey: '' });
  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    fetchProduct();
    fetchComments();
  }, [id]);

  useEffect(() => {
    if (product) {
      checkFavorites();
    }
  }, [product, user]);

  const checkFavorites = async () => {
    if (user) {
      try {
        const res = await api.get('/wishlist');
        setIsWishlisted(res.data.some(item => item.product_id === product.id));
      } catch (err) {
        console.error("Wishlist check failed:", err);
      }
    } else {
      const wishKey = user ? `wishlist_${user.id}` : 'wishlist_guest';
      const currentWish = JSON.parse(localStorage.getItem(wishKey) || '[]');
      setIsWishlisted(currentWish.some(item => item.id === product.id));
    }
  };

  const toggleWishlist = async () => {
    if (!user) {
      setAuthDialog({
        open: true,
        titleKey: 'auth_title_wish',
        messageKey: 'auth_msg_wish'
      });
      return;
    }

    if (user) {
      try {
        if (isWishlisted) {
          await api.delete(`/wishlist/${product.id}`);
          setIsWishlisted(false);
          showToast(t('wish_removed'), 'info');
        } else {
          await api.post('/wishlist', { productId: product.id });
          setIsWishlisted(true);
          showToast(t('wish_added'), 'success');
        }
        window.dispatchEvent(new Event('wishlistUpdated'));
      } catch (err) {
        showToast(t('error'), 'error');
      }
    } else {
      const wishKey = user ? `wishlist_${user.id}` : 'wishlist_guest';
      let currentWish = JSON.parse(localStorage.getItem(wishKey) || '[]');

      if (isWishlisted) {
        currentWish = currentWish.filter(item => item.id !== product.id);
        setIsWishlisted(false);
        showToast(t('wish_removed'), 'info');
      } else {
        currentWish.push({
          id: product.id,
          name: product.name,
          price: product.price,
          image_url: product.image_url,
          discount_percent: product.discount_percent
        });
        setIsWishlisted(true);
        showToast(t('wish_added'), 'success');
      }

      localStorage.setItem(wishKey, JSON.stringify(currentWish));
      window.dispatchEvent(new Event('wishlistUpdated'));
    }
  };

  const fetchComments = async () => {
    try {
      const res = await api.get(`/comments/${id}`);
      setComments(res.data);
    } catch (err) {
      console.error('Failed to fetch comments:', err);
    }
  };

  const fetchProduct = async () => {
    try {
      const res = await api.get(`/products/${id}`);
      setProduct(res.data);
    } catch (err) {
      console.error('Failed to fetch product details:', err);
      showToast(t('pd_not_found'), 'error');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (product) {
      setMainImage(product.image_url);
    }
  }, [product]);

  const handleOrder = async () => {
    if (!user) {
      setAuthDialog({
        open: true,
        titleKey: 'auth_title_order',
        messageKey: 'auth_msg_order'
      });
      return;
    }

    if (!selectedSize) {
      showToast(t('pd_select_size'), "error");
      return;
    }

    if (quantity > selectedSize.stock) {
      showToast(t('pd_stock_limit'), "error");
      return;
    }

    try {
      await api.post('/cart', {
        productId: product.id,
        quantity: quantity,
        size: selectedSize.size
      });

      window.dispatchEvent(new Event('cartUpdated'));
      showToast(`${t('cart_added')} ${quantity} ${t('pd_items_unit')}`, "success");
      setQuantity(1);
    } catch (err) {
      showToast(err.response?.data?.message || t('error'), 'error');
    }
  };

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!user) {
      setAuthDialog({
        open: true,
        titleKey: 'auth_title_comment',
        messageKey: 'auth_msg_comment'
      });
      return;
    }

    if (rating === 0) {
      showToast(t('pd_rate_error'), 'error');
      return;
    }

    setSubmittingComment(true);
    try {
      await api.post(`/comments/${product.id}`, {
        comment: newComment,
        rating: rating
      });
      setNewComment('');
      setRating(0);
      setIsCommentModalOpen(false);
      showToast(t('pd_comment_success'), 'success');
      fetchComments(); // Refresh comments list - by worapol สุดหล่อ
    } catch (err) {
      console.error('Failed to post comment:', err);
      showToast(err.response?.data?.message || err.response?.data?.error || err.message || t('error'), 'error');
    } finally {
      setSubmittingComment(false);
    }
  };

  const renderStars = (count) => {
    return [...Array(5)].map((_, i) => (
      <span key={i} className={`star ${i < count ? 'filled' : ''}`}>★</span>
    ));
  };

  const allImages = product ? [
    ...(product.image_url ? [{ id: 'primary', image_url: product.image_url }] : []),
    ...(product.images || [])
  ].filter((v, i, a) => a.findIndex(v2 => (v2.image_url === v.image_url)) === i) : [];

  const handleNextImage = () => {
    const currentIndex = allImages.findIndex(img => img.image_url === mainImage);
    const nextIndex = (currentIndex + 1) % allImages.length;
    setMainImage(allImages[nextIndex].image_url);
  };

  const handlePrevImage = () => {
    const currentIndex = allImages.findIndex(img => img.image_url === mainImage);
    const prevIndex = (currentIndex - 1 + allImages.length) % allImages.length;
    setMainImage(allImages[prevIndex].image_url);
  };

  if (loading) {
    return (
      <div className="product-detail-placeholder">
        <div className="shimmer" style={{ width: '100%', height: '500px', borderRadius: '20px' }}></div>
      </div>
    );
  }

  if (!product) return null;

  return (
    <div className="product-detail-container"
      onClick={() => {
        if (selectedSize) {
          setSelectedSize(null);
          setQuantity(1);
        }
      }}
    >
      {/* Auth Dialog */}
      <Dialog
        open={authDialog.open}
        onClose={() => setAuthDialog({ ...authDialog, open: false })}
        PaperProps={{ sx: { borderRadius: '28px', p: 1, maxWidth: '400px' } }}
      >
        <DialogContent sx={{ textAlign: 'center', pt: 4 }}>
          <Box sx={{
            width: 64, height: 64, borderRadius: '50%',
            bgcolor: '#F0F9FF',
            display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 3
          }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#0EA5E9" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
              <polyline points="10 17 15 12 10 7"></polyline>
              <line x1="15" y1="12" x2="3" y2="12"></line>
            </svg>
          </Box>
          <Typography variant="h6" fontWeight="1000" sx={{ color: '#111827', mb: 1.5 }}>
            {t(authDialog.titleKey)}
          </Typography>
          <Typography variant="body2" sx={{ color: '#6B7280', px: 2, lineHeight: 1.6, fontWeight: '500' }}>
            {t(authDialog.messageKey)}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 4, pt: 1, gap: 2 }}>
          <Button
            variant="outlined"
            fullWidth
            onClick={() => setAuthDialog({ ...authDialog, open: false })}
            sx={{
              borderColor: '#E5E7EB', color: '#374151', borderRadius: '16px', fontWeight: '1000',
              textTransform: 'none', py: 2, '&:hover': { bgcolor: '#F9FAFB', borderColor: '#D1D5DB' }
            }}
          >
            {t('dismiss')}
          </Button>
          <Button
            variant="contained"
            fullWidth
            onClick={() => navigate('/login')}
            sx={{
              bgcolor: '#111827', color: '#fff', borderRadius: '16px', fontWeight: '1000',
              textTransform: 'none', py: 2, '&:hover': { bgcolor: '#000' }
            }}
          >
            {t('login')}
          </Button>
        </DialogActions>
      </Dialog>

      <div className="nav-actions">
        <button className="back-btn-new" onClick={() => navigate(-1)}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          <span>{t('pd_back')}</span>
        </button>
      </div>

      <div className="product-detail-card">
        <div className="product-detail-top">
          <div className="product-gallery">
            <div className="main-image-container">
              <div className="product-image-wrapper">
                <img
                  src={mainImage ? `http://localhost:5000${mainImage}` : 'https://via.placeholder.com/600x400?text=No+Image'}
                  alt={product.name}
                  className="product-detail-img"
                />
              </div>
              {allImages.length > 1 && (
                <div className="carousel-nav">
                  <button className="nav-arrow" onClick={handlePrevImage}>&#10094;</button>
                  <button className="nav-arrow" onClick={handleNextImage}>&#10095;</button>
                </div>
              )}
            </div>
            {allImages.length > 1 && (
              <div className="product-thumbnails">
                {allImages.map((img, idx) => (
                  <div
                    key={img.id || idx}
                    className={`thumbnail-wrapper ${mainImage === img.image_url ? 'active' : ''}`}
                    onClick={() => setMainImage(img.image_url)}
                  >
                    <img src={`http://localhost:5000${img.image_url}`} alt="thumbnail" />
                  </div>
                ))}
              </div>
            )}
            {product.sizes && product.sizes.length > 0 && (
              <div className="product-sizes-section">
                <div className="section-header">
                  <h3>{t('pd_available_sizes')}</h3>
                  {selectedSize && <span className="selected-size-label">{t('pd_selected')}: {selectedSize.size}</span>}
                </div>
                <div className="size-options-grid">
                  {product.sizes.map(s => (
                    <div
                      key={s.id}
                      className={`size-option-new ${s.stock === 0 ? 'sold-out' : ''} ${selectedSize?.id === s.id ? 'selected' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (s.stock > 0) {
                          setSelectedSize(selectedSize?.id === s.id ? null : s);
                          setQuantity(1);
                        }
                      }}
                    >
                      <span className="size-name">{s.size}</span>
                      <span className="size-stock">{s.stock} {t('pd_items_unit')}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="product-info-wrapper">
            <div className="product-meta">
              {product.brand && <span className="meta-brand">{product.brand}</span>}
              {product.product_code && <span className="meta-code">{t('pd_code')}: {product.product_code}</span>}
            </div>
            <h1 className="product-title">{product.name}</h1>
            <p className="product-category-label">{t('pd_category')}: {product.category || 'N/A'}</p>
            <div className="status-badge-wrapper">
              <span className={`product-status ${product.stock === 0 ? 'out-stock' : 'in-stock'}`}>
                {product.stock === 0 ? t('h_sold_out') : t('pd_in_stock')}
              </span>
            </div>

            <div className="product-price-column">
              {product.total_reviews > 0 && (
                <div className="product-rating-summary-top">
                  <div className="stars-row-mini">{renderStars(Math.round(product.avg_rating))}</div>
                  <span className="rating-val-top">{Number(product.avg_rating).toFixed(1)}</span>
                  <span className="rating-count-top">({product.total_reviews} {t('pd_reviews')})</span>
                </div>
              )}
              <div className="price-container">
                {product.discount_percent > 0 ? (
                  <div className="price-with-discount">
                    <div className="prices-stack">
                      <span className="original-price-strikethrough">฿{Number(product.price).toLocaleString()}</span>
                      <span className="current-price discounted">฿{Number(product.price * (1 - product.discount_percent / 100)).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</span>
                    </div>
                    <div className="discount-badge-small">-{product.discount_percent}%</div>
                  </div>
                ) : (
                  <span className="current-price">฿{Number(product.price).toLocaleString()}</span>
                )}
              </div>
            </div>

            {product.variants && product.variants.length > 1 && (
              <div className="product-variants-section">
                <div className="section-header">
                  <h3>{t('pd_available_colors')}</h3>
                </div>
                <div className="variant-options-grid">
                  {product.variants.map(v => (
                    <div
                      key={v.id}
                      className={`variant-option ${v.id === product.id ? 'active' : ''}`}
                      onClick={() => v.id !== product.id && navigate(`/product/${v.id}`)}
                      title={v.name}
                    >
                      <img src={`http://localhost:5000${v.image_url}`} alt={v.name} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedSize && (
              <div className="quantity-section">
                <div className="section-header">
                  <h3>{t('pd_quantity')}</h3>
                </div>
                <div className="quantity-controls">
                  <button className="qty-btn" onClick={(e) => { e.stopPropagation(); setQuantity(Math.max(1, quantity - 1)); }}>-</button>
                  <span className="qty-value">{quantity}</span>
                  <button className="qty-btn" onClick={(e) => { e.stopPropagation(); setQuantity(Math.min(selectedSize.stock, quantity + 1)); }} disabled={quantity >= selectedSize.stock}>+</button>
                  <span className="qty-unit">{t('pd_items_unit')}</span>
                </div>
              </div>
            )}

            <button
              className={`add-to-cart-btn ${(!selectedSize || product.stock === 0) ? 'disabled' : ''}`}
              disabled={!selectedSize || product.stock === 0}
              onClick={(e) => { e.stopPropagation(); handleOrder(); }}
            >
              {product.stock === 0 ? t('h_sold_out') : selectedSize ? t('pd_add_to_cart') : t('pd_select_size')}
            </button>
          </div>
        </div>

        <div className="product-detail-bottom">
          <div className="product-description-container">
            <h2 className="section-heading">{t('pd_details')}</h2>
            <div className="product-description-content">
              {product.description ? <p>{product.description}</p> : <p className="no-desc">{t('pd_no_desc')}</p>}
            </div>
          </div>

          <div className="product-comments-container">
            <div className="comments-header-row">
              <div className="review-summary-header">
                <h2 className="section-heading">{t('pd_reviews')}</h2>
                {comments.length > 0 && (
                  <div className="review-stat-pills">
                    <div className="stat-pill">
                      <span className="stat-value">{(comments.reduce((sum, c) => sum + (c.rating || 5), 0) / comments.length).toFixed(1)}</span>
                      <div className="stat-stars">
                        {renderStars(Math.round(comments.reduce((sum, c) => sum + (c.rating || 5), 0) / comments.length))}
                      </div>
                    </div>
                    <div className="stat-divider"></div>
                    <div className="stat-pill">
                      <span className="stat-label">{t('pd_all_reviews')}</span>
                      <span className="stat-count">{comments.length} {t('pd_reviews')}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="comments-list">
              {comments.length > 0 ? (
                comments.map((c) => (
                  <div key={c.id} className="comment-item">
                    <div className="comment-header">
                      <div className="user-info-stack">
                        <span className="comment-user">{c.username}</span>
                        <div className="comment-stars-display" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div>{renderStars(c.rating || 5)}</div>
                          {(c.size || c.quantity) && (
                            <span style={{ fontSize: '0.8rem', color: '#888', background: '#f0f0f0', padding: '2px 6px', borderRadius: '4px' }}>
                              {c.size ? `${t('size')}: ${c.size}` : ''} {c.quantity ? `(${t('pd_quantity')}: ${c.quantity})` : ''}
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="comment-date">{new Date(c.created_at).toLocaleDateString(language === 'th' ? 'th-TH' : 'en-GB')}</span>
                    </div>
                    <p className="comment-text">{c.comment}</p>
                  </div>
                ))
              ) : (
                <p className="no-comments">{t('pd_no_reviews')}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="sasom-action-bar">
        <div className="action-bar-content">
          <div className={`wishlist-action ${isWishlisted ? 'active' : ''}`} onClick={toggleWishlist}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill={isWishlisted ? '#ff3b30' : 'none'} stroke={isWishlisted ? '#ff3b30' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"></path>
            </svg>
          </div>
          <div className="action-buttons-group">
            <button
              className="buy-btn-solid"
              onClick={() => {
                if (!selectedSize) {
                  document.querySelector('.product-sizes-section')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  showToast(t('pd_select_size'), 'info');
                } else {
                  handleOrder();
                }
              }}
            >
              {selectedSize ? `฿${Number(product.discount_percent > 0 ? product.price * (1 - product.discount_percent / 100) : product.price).toLocaleString()} • ${t('pd_add_to_cart')}` : t('pd_select_size')}
            </button>
          </div>
          <div className="info-action" onClick={() => setIsInfoModalOpen(true)}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line>
            </svg>
          </div>
        </div>
      </div>

      {isInfoModalOpen && (
        <div className="sasom-modal-overlay" onClick={() => setIsInfoModalOpen(false)}>
          <div className="sasom-modal-card" onClick={(e) => e.stopPropagation()}>
            <button className="sasom-modal-close" onClick={() => setIsInfoModalOpen(false)}>✕</button>
            <h2 className="sasom-modal-title">{t('ship_title')}</h2>
            <div className="sasom-modal-content">
              <div className="shipping-method-item">
                <div className="shipping-icon-circle">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="1" y="3" width="15" height="13"></rect><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon><circle cx="5.5" cy="18.5" r="2.5"></circle><circle cx="18.5" cy="18.5" r="2.5"></circle>
                  </svg>
                </div>
                <div className="shipping-text">
                  <h3>{t('ship_messenger_title')}</h3>
                  <p>{t('ship_messenger_desc')}</p>
                </div>
              </div>
              <div className="shipping-method-item">
                <div className="shipping-icon-circle">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line>
                  </svg>
                </div>
                <div className="shipping-text">
                  <h3>{t('ship_ems_title')}</h3>
                  <p>{t('ship_ems_desc')}</p>
                </div>
              </div>
            </div>
            <button className="sasom-modal-btn-confirm" onClick={() => setIsInfoModalOpen(false)}>{t('dismiss')}</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetail;
