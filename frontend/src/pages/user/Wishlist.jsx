// code in this file is written by worapol สุดหล่อ
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { useLanguage } from '../../context/LanguageContext';
import './Wishlist.css';

const Wishlist = () => {
  const [wishlistItems, setWishlistItems] = useState([]);
  const user = JSON.parse(localStorage.getItem('user'));
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { t } = useLanguage();

  useEffect(() => {
    fetchWishlist();
  }, [user]);

  const fetchWishlist = async () => {
    if (user) {
      try {
        const res = await api.get('/wishlist');
        setWishlistItems(res.data);
      } catch (err) {
        console.error("Wishlist fetch failed:", err);
      }
    } else {
      const wishKey = user ? `wishlist_${user.id}` : 'wishlist_guest';
      const items = JSON.parse(localStorage.getItem(wishKey) || '[]');
      setWishlistItems(items);
    }
  };

  const removeFromWishlist = async (id) => {
    if (user) {
      try {
        await api.delete(`/wishlist/${id}`);
        fetchWishlist();
      } catch (err) {
        showToast(t('error'), 'error');
      }
    } else {
      const wishKey = user ? `wishlist_${user.id}` : 'wishlist_guest';
      const updated = wishlistItems.filter(item => item.id !== id);
      localStorage.setItem(wishKey, JSON.stringify(updated));
      setWishlistItems(updated);
    }
    window.dispatchEvent(new Event('wishlistUpdated'));
    showToast(t('wish_removed'), 'info');
  };

  return (
    <div className="wishlist-container">
      <div className="wishlist-header">
        <h1>{t('nav_wishlist')} ({wishlistItems.length})</h1>
        <p>{t('wish_subtitle')}</p>
      </div>

      {wishlistItems.length === 0 ? (
        <div className="empty-wishlist">
          <div className="empty-icon">❤️</div>
          <h2>{t('wish_empty')}</h2>
          <p>{t('wish_empty_desc')}</p>
          <button className="go-back-btn" onClick={() => navigate('/')}>{t('h_go_home')}</button>
        </div>
      ) : (
        <div className="wishlist-grid">
          {wishlistItems.map(item => (
            <div key={item.id} className="wishlist-card">
              <div className="wishlist-image" onClick={() => navigate(`/product/${item.id}`)}>
                <img src={item.image_url ? `http://localhost:5000${item.image_url}` : 'https://via.placeholder.com/300x200?text=No+Image'} alt={item.name} />
                <button className="remove-wish-btn" onClick={(e) => {
                  e.stopPropagation();
                  removeFromWishlist(item.id);
                }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="#ff3b30" stroke="#ff3b30" strokeWidth="2">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l8.78-8.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                  </svg>
                </button>
              </div>
              <div className="wishlist-info">
                <Link to={`/product/${item.id}`}>
                  <h3 className="wishlist-item-name">{item.name}</h3>
                </Link>
                <div className="wishlist-price-row">
                   {item.discount_percent > 0 ? (
                     <div className="wishlist-price discounted">
                       <span className="current">฿{Number(item.price * (1 - item.discount_percent / 100)).toLocaleString()}</span>
                       <span className="original">฿{Number(item.price).toLocaleString()}</span>
                     </div>
                   ) : (
                     <span className="wishlist-price">฿{Number(item.price).toLocaleString()}</span>
                   )}
                </div>
                <button className="view-detail-btn" onClick={() => navigate(`/product/${item.id}`)}>
                  {t('view_detail')}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Wishlist;
