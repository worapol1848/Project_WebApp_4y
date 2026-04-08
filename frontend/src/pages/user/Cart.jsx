// code in this file is written by worapol สุดหล่อ
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { useLanguage } from '../../context/LanguageContext';
import './Cart.css';

const Cart = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { t } = useLanguage();
  const [cartItems, setCartItems] = useState([]);
  const [profile, setProfile] = useState(null);
  const [shippingMethod, setShippingMethod] = useState('');
  const [shippingFee, setShippingFee] = useState(0);
  const user = JSON.parse(localStorage.getItem('user'));
  const cartKey = user ? `cart_${user.id}` : 'cart_guest';

  useEffect(() => {
    fetchCart();
  }, [user]);

  const fetchCart = async () => {
    if (user) {
      try {
        const res = await api.get('/cart');
        setCartItems(res.data);
      } catch (err) {
        console.error("Error fetching cart from DB:", err);
      }
    } else {
      const savedCart = localStorage.getItem(cartKey);
      if (savedCart) {
        setCartItems(JSON.parse(savedCart));
      }
    }
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get('/auth/profile');
        setProfile(res.data);
        if (res.data.province && res.data.address && res.data.sub_district && res.data.district) {
          const isBkk = res.data.province.includes('กรุงเทพ') || res.data.province.toLowerCase().includes('bangkok');
          if (isBkk) {
            setShippingMethod('messenger');
            setShippingFee(60);
          } else {
            setShippingMethod('ems');
            setShippingFee(150);
          }
        } else {
          setShippingMethod('');
          setShippingFee(0);
        }
      } catch (err) {
        console.error("Error fetching profile:", err);
      }
    };
    if (user) fetchProfile();
  }, []);

  const saveCart = async (items) => {
    setCartItems(items);
    if (!user) {
      localStorage.setItem(cartKey, JSON.stringify(items));
    }
    window.dispatchEvent(new Event('cartUpdated'));
  };

  const updateQuantity = async (id, productId, size, delta) => {
    const item = cartItems.find(i => i.id === id && i.size === size);
    if (!item) return;
    const newQty = Math.max(1, item.quantity + delta);

    if (user) {
      try {
        await api.post('/cart', { productId, quantity: newQty, size, replace: true });
        fetchCart();
      } catch (err) {
        showToast(t('error'), 'error');
      }
    } else {
      const newItems = cartItems.map(i => {
        if ((i.product_id === productId || i.id === productId) && i.size === size) {
          return { ...i, quantity: newQty };
        }
        return i;
      });
      saveCart(newItems);
    }
  };

  const removeItem = async (productId, size) => {
    if (user) {
      try {
        await api.delete(`/cart/${productId}/${size}`);
        fetchCart();
      } catch (err) {
        showToast(t('error'), 'error');
      }
    } else {
      const newItems = cartItems.filter(item => !((item.product_id === productId || item.id === productId) && item.size === size));
      saveCart(newItems);
    }
    showToast(t('cart_remove_success'));
  };

  const totalPrice = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0) + (cartItems.length > 0 ? shippingFee : 0);

  const handleCheckout = async () => {
    try {
      const orderData = {
        items: cartItems.map(item => ({
          productId: item.product_id || item.id,
          quantity: item.quantity,
          size: item.size
        }))
      };

      await api.post('/orders', orderData);
      showToast(t('pay_success'), "success");
      localStorage.removeItem(cartKey);
      setCartItems([]);
      window.dispatchEvent(new Event('cartUpdated'));
      navigate('/myorders');
    } catch (err) {
      showToast(err.response?.data?.message || t('pay_failed'), "error");
    }
  };

  return (
    <div className="cart-page-container">
      <h1 className="cart-title">{t('cart_title')}</h1>

      {cartItems.length === 0 ? (
        <div className="empty-cart-state">
          <div className="empty-icon">🛒</div>
          <p>{t('cart_empty')}</p>
          <button className="go-shopping-btn" onClick={() => navigate('/')}>{t('cart_go_shop')}</button>
        </div>
      ) : (
        <div className="cart-layout">
          <div className="cart-items-section">
            {cartItems.map((item, idx) => (
              <div key={`${item.id}-${item.size}-${idx}`} className="cart-item-card">
                <div className="cart-item-image">
                  <img src={item.image_url ? `http://localhost:5000${item.image_url}` : 'https://via.placeholder.com/100'} alt={item.name} />
                </div>
                <div className="cart-item-info">
                  <h3>{item.name}</h3>
                  <p className="cart-item-meta">{t('size')}: {item.size}</p>
                  <div className="cart-item-price-stack">
                    {item.discount_percent > 0 ? (
                      <span className="cart-old-price">฿{Number(item.original_price).toLocaleString()}</span>
                    ) : (
                      <span className="cart-item-price-unit">฿{Number(item.price).toLocaleString()}</span>
                    )}
                  </div>
                </div>
                <div className="cart-item-controls">
                  <div className="qty-picker">
                    <button onClick={() => updateQuantity(item.id, item.product_id, item.size, -1)}>−</button>
                    <span>{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, item.product_id, item.size, 1)}>+</button>
                  </div>
                  <button className="remove-item-btn" onClick={() => removeItem(item.product_id, item.size)} title={t('remove')}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6"></polyline>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                  </button>
                </div>
                <div className="cart-item-subtotal">
                  <div className="subtotal-stack">
                    {item.discount_percent > 0 && (
                      <span className="cart-discount-badge">-{item.discount_percent}%</span>
                    )}
                    <span className={item.discount_percent > 0 ? "subtotal-new" : ""}>
                      ฿{Number(item.price * item.quantity).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="cart-summary-section">
            <div className="summary-card">
              <h2>{t('cart_summary')}</h2>
              <div className="summary-row">
                <span>{t('cart_subtotal')}</span>
                <span>฿{cartItems.reduce((acc, item) => acc + ((item.original_price || item.price) * item.quantity), 0).toLocaleString()}</span>
              </div>
              {cartItems.reduce((acc, item) => acc + ((item.original_price ? (item.original_price - item.price) : 0) * item.quantity), 0) > 0 && (
                <div className="summary-row discount-row">
                  <span>{t('cart_discount')}</span>
                  <span className="discount-amount">-฿{cartItems.reduce((acc, item) => acc + ((item.original_price ? (item.original_price - item.price) : 0) * item.quantity), 0).toLocaleString()}</span>
                </div>
              )}
              <div className="summary-row">
                <span>{t('cart_shipping')}</span>
                {shippingMethod ? (
                   shippingFee > 0 ? (
                     <span>฿{shippingFee.toLocaleString()}</span>
                   ) : (
                     <span className="free-shipping">{t('cart_free')}</span>
                   )
                ) : (
                   <span className="pending-shipping" style={{ fontSize: '0.85rem', color: '#64748b' }}>{t('cart_shipping_pending')}</span>
                )}
              </div>
              
              <div className="cart-shipping-methods-info">
                  <div className={`ship-method-badge ${shippingMethod === 'ems' ? 'active' : ''}`}>
                      <div className="ship-dot"></div>
                      <span>{t('ship_ems_title')}</span>
                  </div>
                  <div className={`ship-method-badge ${shippingMethod === 'messenger' ? 'active' : ''}`}>
                      <div className="ship-dot"></div>
                      <span>{t('ship_messenger_title')}</span>
                  </div>
              </div>
              <div className="summary-divider"></div>
              <div className="summary-row total-row">
                <span>{t('cart_total')}</span>
                <span className="total-amount">฿{totalPrice.toLocaleString()}</span>
              </div>
              <button className="checkout-btn" onClick={() => navigate('/payment')}>{t('cart_checkout')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cart;
