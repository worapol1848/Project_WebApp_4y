import React, { useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import './OrderSuccess.css';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
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

const OrderSuccess = () => {
  const { t } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  
  const { 
    orderId, 
    orderItems, 
    subtotal, 
    discount, 
    shippingFee, 
    shippingMethod, 
    total, 
    shippingAddress 
  } = location.state || {};

  useEffect(() => {
    // If someone tries to access this page without state, we can still show a generic success
    // but typically we'd just leave it or redirect.
  }, []);

  return (
    <div className="order-success-page">
      <div className="order-success-container">
        <div className="success-header">
          <div className="success-icon-wrapper">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
          </div>
          <h1>{t('order_success_title') || 'Thank You for Your Order!'}</h1>
          <p className="success-subtitle">{t('order_success_desc') || 'Your payment has been successfully processed.'}</p>
          {orderId && <p className="order-number">{t('order_id') || 'Order ID'}: #{orderId}</p>}
        </div>

        {location.state ? (
          <div className="order-details-card section-glass">
            <h3>{t('pay_summary') || 'Order Summary'}</h3>
            
            <div className="success-items-list">
              {orderItems?.map((item, idx) => (
                <div key={idx} className="success-item">
                  <div className="success-item-img">
                    <img src={item.image_url ? `http://localhost:5000${item.image_url}` : 'https://via.placeholder.com/60'} alt={item.name} />
                  </div>
                  <div className="success-item-info">
                    <p className="item-name">{item.name}</p>
                    {item.size && <p className="item-size">{t('pd_select_size') || 'Size'}: {item.size}</p>}
                    <p className="item-qty">Qty: {item.quantity}</p>
                  </div>
                  <div className="success-item-price">
                    ฿{(item.price * item.quantity).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>

            <div className="success-divider"></div>

            <div className="success-shipping-info">
              <div className="info-block">
                <h4>{t('prof_shipping_addr') || 'Shipping Address'}</h4>
                {shippingAddress ? (
                  <>
                    <p><strong>{shippingAddress.full_name}</strong> ({shippingAddress.phone})</p>
                    <p>{shippingAddress.address} {shippingAddress.sub_district}</p>
                    <p>{shippingAddress.district} {shippingAddress.province} {shippingAddress.postal_code}</p>
                    {shippingAddress.latitude && shippingAddress.longitude && (
                      <div className="success-map-wrapper">
                        <MapContainer 
                          center={[parseFloat(shippingAddress.latitude), parseFloat(shippingAddress.longitude)]} 
                          zoom={15} 
                          style={{ height: '100%', width: '100%' }} 
                          zoomControl={false} 
                          scrollWheelZoom={false} 
                          dragging={false} 
                          doubleClickZoom={false}
                        >
                          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                          <Marker position={[parseFloat(shippingAddress.latitude), parseFloat(shippingAddress.longitude)]} />
                        </MapContainer>
                      </div>
                    )}
                  </>
                ) : (
                  <p>N/A</p>
                )}
              </div>
              <div className="info-block">
                <h4>{t('pay_shipping_via') || 'Shipping Method'}</h4>
                <p style={{ textTransform: 'uppercase', fontWeight: 'bold', color: '#2563EB' }}>{shippingMethod === 'ems' ? 'EMS' : 'MESSENGER'}</p>
              </div>
            </div>

            <div className="success-divider"></div>

            <div className="success-totals">
              <div className="total-row">
                <span>{t('cart_subtotal') || 'Subtotal'}</span>
                <span>฿{subtotal?.toLocaleString()}</span>
              </div>
              {discount > 0 && (
                <div className="total-row discount">
                  <span>{t('cart_discount') || 'Discount'}</span>
                  <span>-฿{discount?.toLocaleString()}</span>
                </div>
              )}
              <div className="total-row">
                <span>{t('cart_shipping') || 'Shipping Fee'}</span>
                <span>฿{shippingFee?.toLocaleString()}</span>
              </div>
              <div className="success-divider"></div>
              <div className="total-row grand-total">
                <span>{t('cart_total') || 'Total'}</span>
                <span className="amount">฿{total?.toLocaleString()}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="order-details-card section-glass" style={{ textAlign: 'center', padding: '2rem' }}>
            <p>{t('order_success_check_history') || 'You can check your order details in the Order History page.'}</p>
          </div>
        )}

        <div className="success-actions">
          <Link to="/" className="btn-home">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
            {t('back_home') || 'Back to Home'}
          </Link>
          <Link to="/myorders" className="btn-history">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
            {t('nav_my_orders') || 'View Order History'}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default OrderSuccess;
