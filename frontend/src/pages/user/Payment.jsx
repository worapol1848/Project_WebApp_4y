// code in this file is written by worapol สุดหล่อ
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { useLanguage } from '../../context/LanguageContext';
import './Payment.css';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for Leaflet default icon issues in React - by worapol สุดหล่อ
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// Component to handle map movement programmatically - by worapol สุดหล่อ
const MapController = ({ targetCoords, zoom }) => {
  const map = useMap();
  useEffect(() => {
    if (targetCoords) {
      map.setView(targetCoords, zoom);
      setTimeout(() => map.invalidateSize(), 100);
    }
  }, [targetCoords, map, zoom]);
  return null;
};

// Main Map Logic Component - by worapol สุดหล่อ
const MapLogic = ({ coords, setCoords, onManualMove }) => {
  useMapEvents({
    click(e) {
      setCoords([e.latlng.lat, e.latlng.lng]);
      if (onManualMove) onManualMove();
    }
  });

  return (
    <>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <Marker
        position={coords}
        draggable={true}
        eventHandlers={{
          dragend: (e) => {
            const { lat, lng } = e.target.getLatLng();
            setCoords([lat, lng]);
            if (onManualMove) onManualMove();
          }
        }}
      />
    </>
  );
};

const Payment = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { t, language } = useLanguage();
  const [cartItems, setCartItems] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('bank'); // 'bank' or 'qr' - by worapol สุดหล่อ
  const [slipFile, setSlipFile] = useState(null);
  const [slipPreview, setSlipPreview] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [isFullMapOpen, setIsFullMapOpen] = useState(false);
  const [editAddress, setEditAddress] = useState({});
  const [mapCoords, setMapCoords] = useState([13.7367, 100.5231]);
  const [targetCoords, setTargetCoords] = useState(null);
  const [hasMovedManually, setHasMovedManually] = useState(false);

  const searchTimeout = useRef(null);
  const lastSearchQuery = useRef('');

  const searchLocation = async (query) => {
    if (query === lastSearchQuery.current || hasMovedManually) return;
    lastSearchQuery.current = query;
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query + ', Thailand')}`);
      const data = await response.json();
      if (data && data.length > 0) {
        const newCoords = [parseFloat(data[0].lat), parseFloat(data[0].lon)];
        setMapCoords(newCoords);
        setTargetCoords(newCoords);
      }
    } catch (err) {
      console.error('Geocoding error:', err);
    }
  };
  useEffect(() => {
    const query = [editAddress.district, editAddress.province].filter(Boolean).join(', ');
    if (isAddressModalOpen && !isFullMapOpen && query.length > 3 && query !== lastSearchQuery.current && !hasMovedManually) {
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
      searchTimeout.current = setTimeout(() => searchLocation(query), 1200);
    }
  }, [editAddress.district, editAddress.province, isAddressModalOpen, isFullMapOpen, hasMovedManually]);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await api.get('/auth/profile');
      setProfile(res.data);
      setEditAddress(res.data);
      if (res.data.latitude && res.data.longitude) {
        setMapCoords([parseFloat(res.data.latitude), parseFloat(res.data.longitude)]);
        setTargetCoords([parseFloat(res.data.latitude), parseFloat(res.data.longitude)]);
      }
    } catch (err) {
      console.error("Error fetching profile:", err);
    }
  };

  const handleUpdateAddress = async () => {
    try {
      const finalAddress = {
        ...editAddress,
        latitude: mapCoords[0],
        longitude: mapCoords[1]
      };
      await api.put('/auth/profile', finalAddress);
      await fetchProfile();
      setIsAddressModalOpen(false);
      showToast(t('prof_address_success'), "success");
    } catch (err) {
      showToast(t('error'), "error");
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSlipFile(file);
      setSlipPreview(URL.createObjectURL(file));
    }
  };

  useEffect(() => {
    const fetchCart = async () => {
      const user = JSON.parse(localStorage.getItem('user'));
      if (user) {
        try {
          const res = await api.get('/cart');
          setCartItems(res.data);
          if (res.data.length === 0) navigate('/cart');
        } catch (err) {
          console.error("Error fetching cart from DB:", err);
          navigate('/cart');
        }
      } else {
        const cartKey = 'cart_guest';
        const savedCart = localStorage.getItem(cartKey);
        if (savedCart) {
          setCartItems(JSON.parse(savedCart));
        } else {
          navigate('/cart');
        }
      }
    };
    fetchCart();
  }, [navigate]);

  const [shippingMethod, setShippingMethod] = useState(''); // Empty initially - by worapol สุดหล่อ
  const [shippingFee, setShippingFee] = useState(0);

  // Auto-detect shipping method based on province - by worapol สุดหล่อ
  useEffect(() => {
    if (profile?.province && profile?.address && profile?.sub_district && profile?.district) {
      const isBkk = profile.province.includes('กรุงเทพ') || profile.province.toLowerCase().includes('bangkok');
      if (isBkk) {
        setShippingMethod('messenger');
        setShippingFee(60);
      } else {
        setShippingMethod('ems');
        setShippingFee(150);
      }
    } else {
      // Clear if no address - by worapol สุดหล่อ
      setShippingMethod('');
      setShippingFee(0);
    }
  }, [profile]);

  const cartSubtotal = cartItems.reduce((acc, item) => acc + ((item.original_price || item.price) * item.quantity), 0);
  const cartDiscount = cartItems.reduce((acc, item) => acc + ((item.original_price ? (item.original_price - item.price) : 0) * item.quantity), 0);
  const totalPrice = cartSubtotal - cartDiscount + (cartItems.length > 0 ? shippingFee : 0);

  const handlePlaceOrder = async () => {
    // Validation - by worapol สุดหล่อ
    if (!profile?.address || !profile?.sub_district || !profile?.district || !profile?.province) {
      showToast(t('pay_missing_address'), "error");
      return;
    }

    if (!shippingMethod) {
      showToast(t('pay_select_shipping'), "error");
      return;
    }

    if (!slipFile) {
      showToast(t('pay_missing_slip'), "error");
      return;
    }

    if (isProcessing) return;
    setIsProcessing(true);

    try {
      const formData = new FormData();
      const items = cartItems.map(item => ({
        productId: item.product_id || item.id,
        quantity: item.quantity,
        size: item.size
      }));

      formData.append('items', JSON.stringify(items));
      formData.append('shipping_method', shippingMethod);
      formData.append('shipping_fee', shippingFee);

      if (slipFile) {
        formData.append('slip', slipFile);
      }

      await api.post('/orders', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      showToast(t('pay_success'), "success");

      const user = JSON.parse(localStorage.getItem('user'));
      const cartKey = user ? `cart_${user.id}` : 'cart_guest';
      localStorage.removeItem(cartKey);
      window.dispatchEvent(new Event('cartUpdated'));

      setTimeout(() => {
        navigate('/myorders');
      }, 1500);
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.response?.data?.message || t('pay_failed');
      showToast(errorMsg, "error");
      setIsProcessing(false);
    }
  };

  return (
    <div className="payment-page">
      <div className="payment-container">
        <button className="back-link" onClick={() => navigate('/cart')}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          {t('pay_back_cart')}
        </button>

        <h1 className="payment-title">{t('pay_title')}</h1>

        <div className="payment-grid">
          <div className="payment-methods section-glass">
            <h3>{t('pay_method_title')}</h3>

            {/* Option 1: Bank Transfer */}
            <div className={`payment-option-group ${paymentMethod === 'bank' ? 'active' : ''}`}>
              <div
                className={`payment-option ${paymentMethod === 'bank' ? 'selected' : ''}`}
                onClick={() => setPaymentMethod('bank')}
              >
                <div className="option-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="5" width="20" height="14" rx="2" />
                    <line x1="2" y1="10" x2="22" y2="10" />
                    <line x1="7" y1="15" x2="7.01" y2="15" />
                    <line x1="12" y1="15" x2="12.01" y2="15" />
                  </svg>
                </div>
                <div className="option-info">
                  <p className="option-name">{t('pay_bank_transfer')}</p>
                  <p className="option-desc">SCB / K-Bank / Krungthai</p>
                </div>
                {paymentMethod === 'bank' && <div className="option-check">✓</div>}
              </div>

              {paymentMethod === 'bank' && (
                <div className="payment-details-box animate-fade">
                  {/* SCB */}
                  <div className="bank-info">
                    <div className="bank-logo scb-logo">
                      <img src="/scb easy.png" alt="SCB Logo" className="scb-image" />
                    </div>
                    <div className="bank-text">
                      <p><strong>{t('pay_bank_scb')}</strong></p>
                      <p className="account-number">339-277221-4</p>
                      <p className="account-name">{t('pay_acc_company')}</p>
                    </div>
                  </div>

                  {/* KBank */}
                  <div className="bank-info">
                    <div className="bank-logo kbank-logo">
                      <img src="/kasikorn bank.jpg" alt="KBank Logo" className="scb-image" />
                    </div>
                    <div className="bank-text">
                      <p><strong>{t('pay_bank_kbank')}</strong></p>
                      <p className="account-number kbank-color">098-8-76543-2</p>
                      <p className="account-name">{t('pay_acc_company')}</p>
                    </div>
                  </div>

                  {/* Krungthai */}
                  <div className="bank-info">
                    <div className="bank-logo ktb-logo">
                      <img src="/krungthai bank.png" alt="KTB Logo" className="scb-image" />
                    </div>
                    <div className="bank-text">
                      <p><strong>{t('pay_bank_ktb')}</strong></p>
                      <p className="account-number ktb-color">123-0-98765-4</p>
                      <p className="account-name">{t('pay_acc_company')}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Option 2: QR Code */}
            <div className={`payment-option-group ${paymentMethod === 'qr' ? 'active' : ''}`}>
              <div
                className={`payment-option ${paymentMethod === 'qr' ? 'selected' : ''}`}
                onClick={() => setPaymentMethod('qr')}
              >
                <div className="option-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 7V5a2 2 0 0 1 2-2h2" />
                    <path d="M17 3h2a2 2 0 0 1 2 2v2" />
                    <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
                    <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
                    <rect x="7" y="7" width="3" height="3" rx="0.5" />
                    <rect x="14" y="7" width="3" height="3" rx="0.5" />
                    <rect x="7" y="14" width="3" height="3" rx="0.5" />
                    <rect x="14" y="14" width="3" height="3" rx="0.5" />
                  </svg>
                </div>
                <div className="option-info">
                  <p className="option-name">{t('pay_qr_code')}</p>
                  <p className="option-desc">{t('pay_qr_desc')}</p>
                </div>
                {paymentMethod === 'qr' && <div className="option-check">✓</div>}
              </div>

              {paymentMethod === 'qr' && (
                <div className="payment-details-box animate-fade">
                  <div className="qr-container">
                    <p className="qr-hint">{t('pay_qr_hint')}</p>
                    <div className="qr-wrapper">
                      <img src="/payment-qr.jpg" alt="PromptPay QR Code" className="qr-image" />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="payment-option disabled">
              <div className="option-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                  <line x1="1" y1="10" x2="23" y2="10" />
                </svg>
              </div>
              <div className="option-info">
                <p className="option-name">{t('pay_credit_card')}</p>
                <p className="option-desc">COMING SOON</p>
              </div>
            </div>
          </div>

          <div className="order-summary section-glass">
            <h3>{t('pay_summary')}</h3>
            <div className="summary-items">
              {cartItems.map((item, idx) => (
                <div key={idx} className="summary-detailed-item">
                  <div className="summary-item-img-wrapper">
                    <img src={item.image_url ? `http://localhost:5000${item.image_url}` : 'https://via.placeholder.com/80'} alt={item.name} className="summary-item-img" />
                    <span className="summary-item-badge">{item.quantity}</span>
                  </div>
                  <div className="summary-item-info">
                    <p className="summary-item-name">{item.name}</p>
                    {item.size && <p className="summary-item-size">{t('pd_select_size')}: {item.size}</p>}
                  </div>
                  <div className="summary-item-price-wrapper">
                    {item.discount_percent > 0 ? (
                      <div className="summary-item-price-stack">
                        <span className="summary-discount-badge-mini">-{item.discount_percent}%</span>
                        <span className="summary-old-price">฿{(item.original_price * item.quantity).toLocaleString()}</span>
                        <span className="summary-new-price">฿{(item.price * item.quantity).toLocaleString()}</span>
                      </div>
                    ) : (
                      <p className="summary-item-price">฿{(item.price * item.quantity).toLocaleString()}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="summary-divider"></div>

            {/* Shipping Address Section */}
            <div className="payment-address-section">
              <div className="section-header">
                <h4>{t('prof_shipping_addr')}</h4>
                <button
                  className="edit-btn-small"
                  onClick={() => {
                    setEditAddress(profile || {});
                    if (profile?.latitude && profile?.longitude) {
                      setMapCoords([parseFloat(profile.latitude), parseFloat(profile.longitude)]);
                      setTargetCoords([parseFloat(profile.latitude), parseFloat(profile.longitude)]);
                    }
                    setHasMovedManually(false);
                    lastSearchQuery.current = [profile?.district, profile?.province].filter(Boolean).join(', ');
                    setIsAddressModalOpen(true);
                  }}
                >
                  {t('prof_edit_address')}
                </button>
              </div>

              <div className="address-info-box">
                {profile?.full_name ? (
                  <>
                    <p className="p-name">{profile.full_name}</p>
                    <p className="p-phone">{profile.phone}</p>
                    <p className="p-addr">
                      {profile.address} {profile.sub_district} {profile.district} {profile.province} {profile.postal_code}
                    </p>
                  </>
                ) : (
                  <p className="no-addr">{t('prof_no_address')}</p>
                )}
              </div>
            </div>

            {/* Shipping Method Section */}
            <div className="payment-shipping-method-section">
              <h4>{t('pay_shipping_via')}</h4>
              
              <div className="cart-shipping-methods-info">
                <div 
                  className={`ship-method-badge ${shippingMethod === 'ems' ? 'active' : ''}`}
                >
                  <div className="ship-dot"></div>
                  <span>{t('ship_ems_title')} (฿150)</span>
                </div>
                <div 
                  className={`ship-method-badge ${shippingMethod === 'messenger' ? 'active' : ''}`}
                >
                  <div className="ship-dot"></div>
                  <span>{t('ship_messenger_title')} (฿60)</span>
                </div>
              </div>
            </div>

              <div className="summary-footer">
                <div className="summary-row">
                  <span>{t('cart_subtotal')}</span>
                  <span>฿{cartSubtotal.toLocaleString()}</span>
                </div>
                {cartDiscount > 0 && (
                  <div className="summary-row discount-row">
                    <span>{t('cart_discount')}</span>
                    <span className="discount-amount">-฿{cartDiscount.toLocaleString()}</span>
                  </div>
                )}
                <div className="summary-row">
                  <span>{t('cart_shipping')}</span>
                  {shippingMethod ? (
                    <span>฿{shippingFee.toLocaleString()}</span>
                  ) : (
                    <span>฿0</span>
                  )}
                </div>
                <div className="summary-divider"></div>
                <div className="summary-row total">
                  <span>{t('cart_total')}</span>
                  <span className="total-price">฿{totalPrice.toLocaleString()}</span>
                </div>
              </div>

              <button
                className={`pay-now-btn ${isProcessing ? 'loading' : ''}`}
                onClick={handlePlaceOrder}
                disabled={isProcessing}
              >
                {isProcessing ? t('loading') + '...' : t('pay_confirm')}
              </button>

              {/* Slip Upload Box - Moved here */}
              <div className="slip-upload-section summary-upload">
                <h4>{t('pay_upload_slip')}</h4>
                <div className={`upload-box ${slipFile ? 'has-file' : ''}`}>
                  <input
                    type="file"
                    id="slip-upload"
                    accept="image/*"
                    onChange={handleFileChange}
                    hidden
                  />
                  <label htmlFor="slip-upload" className="upload-label">
                    {slipPreview ? (
                      <div className="preview-container">
                        <img src={slipPreview} alt="Slip Preview" className="slip-preview-img" />
                        <div className="change-overlay">{t('pay_change_slip')}</div>
                      </div>
                    ) : (
                      <div className="upload-placeholder">
                        <div className="upload-icon">
                          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20 15v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-4" />
                            <polyline points="17 8 12 3 7 8" />
                            <line x1="12" y1="3" x2="12" y2="15" />
                          </svg>
                        </div>
                        <p>{t('pay_attach_slip')}</p>
                      </div>
                    )}
                  </label>
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* Address Edit Modal (Same as Profile) */}
      {isAddressModalOpen && (
        <div className="modal-overlay">
          <div className="address-modal-content">
            <div className="address-modal-header">
              <button 
                className="back-btn" 
                onClick={() => setIsAddressModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1e293b', padding: '8px', borderRadius: '8px', transition: 'background 0.2s' }}
                onMouseOver={(e) => e.currentTarget.style.background = '#f1f5f9'}
                onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 12H5M12 19l-7-7 7-7" />
                </svg>
              </button>
              <h3 style={{ margin: 0 }}>{t('prof_edit_address_title')}</h3>
            </div>
            <div className="address-form-body">
              <div className="address-group-card">
                <h4>{t('prof_address_header')}</h4>
                <div className="form-group">
                  <label>{t('prof_full_name')}</label>
                  <input type="text" value={editAddress.full_name || ''} onChange={(e) => setEditAddress({ ...editAddress, full_name: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>{t('prof_phone')}</label>
                  <input type="text" value={editAddress.phone || ''} onChange={(e) => setEditAddress({ ...editAddress, phone: e.target.value })} />
                </div>
              </div>
              <div className="address-group-card">
                <div className="form-group">
                  <label>{t('prof_address_detail')}</label>
                  <input type="text" value={editAddress.address || ''} onChange={(e) => setEditAddress({ ...editAddress, address: e.target.value })} placeholder={t('prof_address_placeholder')} style={{ marginBottom: '1rem' }} />
                  <input type="text" value={editAddress.sub_district || ''} onChange={(e) => setEditAddress({ ...editAddress, sub_district: e.target.value })} placeholder={t('prof_sub_district')} />
                </div>
              </div>
              <div className="address-group-card">
                <div className="form-group">
                  <label>{t('prof_prov_dist_zip')}</label>
                  <input type="text" value={editAddress.district || ''} onChange={(e) => { setEditAddress({ ...editAddress, district: e.target.value }); setHasMovedManually(false); }} placeholder={t('prof_district')} style={{ marginBottom: '0.5rem' }} />
                  <input type="text" value={editAddress.province || ''} onChange={(e) => { setEditAddress({ ...editAddress, province: e.target.value }); setHasMovedManually(false); }} placeholder={t('prof_province')} style={{ marginBottom: '0.5rem' }} />
                  <input type="text" value={editAddress.postal_code || ''} onChange={(e) => setEditAddress({ ...editAddress, postal_code: e.target.value })} placeholder={t('prof_postal_code')} />
                </div>
              </div>
              <div className="address-group-card">
                <h4>{t('prof_map_location')}</h4>
                <div 
                  className="map-container-wrapper" 
                  style={{ height: '250px', position: 'relative', borderRadius: '16px', overflow: 'hidden', border: '1px solid #e2e8f0', cursor: 'pointer', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}
                  onClick={() => setIsFullMapOpen(true)}
                  title={t('prof_map_expand_hint')}
                >
                  <div style={{ pointerEvents: 'none', height: '100%', width: '100%' }}>
                    <MapContainer center={mapCoords} zoom={13} style={{ height: '100%' }} zoomControl={false} scrollWheelZoom={false} dragging={false} doubleClickZoom={false}>
                      <MapController targetCoords={targetCoords} zoom={13} />
                      <MapLogic coords={mapCoords} setCoords={setMapCoords} onManualMove={() => setHasMovedManually(true)} />
                    </MapContainer>
                  </div>
                  <div style={{ position: 'absolute', bottom: '15px', right: '15px', zIndex: 1000, background: 'rgba(255,255,255,0.95)', padding: '8px 16px', borderRadius: '10px', fontSize: '0.85rem', fontWeight: 'bold', color: '#2563EB', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', border: '1px solid #BFDBFE' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>
                    {t('prof_map_expand')}
                  </div>
                </div>
              </div>
              <div className="address-footer-btns">
                <button className="cancel-btn" onClick={() => setIsAddressModalOpen(false)}>{t('cancel')}</button>
                <button className="submit-address-btn" onClick={handleUpdateAddress}>{t('save')}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isFullMapOpen && (
        <div className="modal-overlay" style={{ zIndex: 2000 }} onClick={() => setIsFullMapOpen(false)}>
          <div className="address-modal-content" style={{ width: '90%', height: '90vh', maxWidth: 'none', display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }} onClick={(e) => e.stopPropagation()}>
            <div className="address-modal-header" style={{ flexShrink: 0, padding: '1.5rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#1e293b' }}>
                {t('prof_map_title')} ({t('prof_coords')}: {mapCoords[0].toFixed(6)}, {mapCoords[1].toFixed(6)})
              </h3>
              <button 
                onClick={() => setIsFullMapOpen(false)} 
                style={{ background: '#f1f5f9', border: 'none', width: '36px', height: '36px', borderRadius: '50%', fontSize: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748b', transition: 'all 0.2s', padding: 0 }}
                onMouseOver={(e) => { e.currentTarget.style.background = '#e2e8f0'; e.currentTarget.style.color = '#0f172a'; }}
                onMouseOut={(e) => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = '#64748b'; }}
              >
                &times;
              </button>
            </div>
            <div style={{ flexGrow: 1, padding: 0, height: '100%', position: 'relative' }}>
              <MapContainer center={mapCoords} zoom={16} style={{ height: '100%', width: '100%' }} scrollWheelZoom={true}>
                <MapController targetCoords={targetCoords} zoom={16} />
                <MapLogic coords={mapCoords} setCoords={setMapCoords} onManualMove={() => setHasMovedManually(true)} />
              </MapContainer>
            </div>
            <div style={{ padding: '1.25rem', borderTop: '1px solid #e2e8f0', background: '#f8fafc', display: 'flex', justifyContent: 'center', flexShrink: 0 }}>
              <button
                className="submit-address-btn"
                style={{ margin: 0, padding: '0.8rem 2rem', fontSize: '1.1rem', borderRadius: '12px', minWidth: '250px', background: '#2563EB', boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.2)' }}
                onClick={() => {
                  setTargetCoords([...mapCoords]);
                  setIsFullMapOpen(false);
                }}
              >
                {t('prof_map_confirm')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Payment;
