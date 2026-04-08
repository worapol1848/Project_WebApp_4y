// code in this file is written by worapol สุดหล่อ
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import './UserFooter.css';

const UserFooter = () => {
  const { t } = useLanguage();
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  return (
    <footer className="user-footer">
      <div className="footer-top">
        <div className="footer-column">
          <h3>{t('f_most_popular')}</h3>
          <ul>
            <li><Link to="/product/13">Travis Scott x Air Jordan 1 Low OG Olive</Link></li>
            <li><Link to="/product/11">Adidas Originals Ctt Jacket (Light Blue)</Link></li>
            <li><Link to="/product/8">Adidas Originals Ctt Jacket (Maroon)</Link></li>
            <li><Link to="/product/12">Adidas Originals Ctt Jacket (Green)</Link></li>
            <li><Link to="/product/14">Stussy Dice Black T-Shirt</Link></li>
          </ul>
        </div>
        <div className="footer-column">
          <h3>{t('f_nike')}</h3>
          <ul>
            <li><Link to="/product/13">Travis Scott x Air Jordan 1 Low OG Olive</Link></li>
            <li><Link to="/product/4">Retro Nike Jordan 1 Low</Link></li>
          </ul>
        </div>
        <div className="footer-column">
          <h3>{t('f_apparel')}</h3>
          <ul>
            <li><Link to="/product/11">Adidas Ctt Jacket Collection</Link></li>
            <li><Link to="/product/14">Stussy Dice Series Apparel</Link></li>
          </ul>
        </div>
        <div className="footer-column">
          <h3>{t('f_popular_brands')}</h3>
          <ul>
            <li><Link to="/products?brand=Adidas">Adidas</Link></li>
            <li><Link to="/products?brand=Asics">Asics</Link></li>
            <li><Link to="/products?brand=Converse">Converse</Link></li>
            <li><Link to="/products?brand=New Balance">New Balance</Link></li>
            <li><Link to="/products?brand=Nike">Nike</Link></li>
            <li><Link to="/products?brand=Puma">Puma</Link></li>
            <li><Link to="/products?brand=Stussy">Stussy</Link></li>
          </ul>
        </div>
        <div className="footer-column social-nav-column">
          <h3>{t('f_follow_us')}</h3>
          <div className="social-icons-modern">
            <i className='bx bxl-facebook-circle'></i>
            <i className='bx bxl-instagram-alt'></i>
            <i className='bx bxl-twitter'></i>
            <i className='bx bxl-tiktok'></i>
            <i className='bx bxl-youtube'></i>
          </div>
          <p className="footer-highlight-cta">{t('f_sell_with')}</p>
        </div>
      </div>

      <div className="footer-middle">
        <div className="footer-brand-summary">
          <div className="footer-brand-logo">VELIN</div>
          <p className="brand-tagline">{t('f_tagline')}</p>
        </div>

        <div className="footer-links-group">
          <div className="footer-sub-col">
            <h3>{t('f_about')}</h3>
            <ul>
              <li><Link to="/">{t('f_our_story')}</Link></li>
              <li><Link to="/">{t('f_authenticity')}</Link></li>
              <li><Link to="/">{t('f_store_locator')}</Link></li>
              <li><Link to="/">{t('f_careers')}</Link></li>
            </ul>
          </div>
          <div className="footer-sub-col">
            <h3>{t('f_support')}</h3>
            <ul>
              <li><Link to="/">{t('f_contact')}</Link></li>
              <li><Link to="/">{t('f_help')}</Link></li>
              <li><Link to="/">{t('f_faq')}</Link></li>
              <li><span className="footer-modal-trigger" onClick={() => setIsInfoModalOpen(true)}>{t('f_shipping_info')}</span></li>
            </ul>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <div className="footer-legal">
          <span>© {t('f_copyright')}</span>
          <Link to="/">{t('f_terms')}</Link>
          <Link to="/">{t('f_privacy')}</Link>
        </div>
        <div className="payment-icons-list">
          <img src="/scb easy.png" alt="SCB" className="bank-icon-vibrant" />
          <img src="/kasikorn bank.jpg" alt="Kasikorn" className="bank-icon-vibrant" />
          <img src="/krungthai bank.png" alt="Krungthai" className="bank-icon-vibrant" />
          <span className="payment-divider">|</span>
          <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Mastercard-logo.svg/1200px-Mastercard-logo.svg.png" alt="Mastercard" className="pay-method-icon-vibrant" />
        </div>
      </div>

      {/* Global Shipping Info Modal */}
      {isInfoModalOpen && (
        <div className="sasom-modal-overlay" onClick={() => setIsInfoModalOpen(false)}>
          <div className="sasom-modal-card" onClick={(e) => e.stopPropagation()}>
            <button className="sasom-modal-close" onClick={() => setIsInfoModalOpen(false)}>✕</button>
            <h2 className="sasom-modal-title">{t('ship_title')}</h2>
            
            <div className="sasom-modal-content">
              <div className="shipping-method-item">
                <div className="shipping-icon-circle">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="1" y="3" width="15" height="13"></rect>
                    <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
                    <circle cx="5.5" cy="18.5" r="2.5"></circle>
                    <circle cx="18.5" cy="18.5" r="2.5"></circle>
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
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                    <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                    <line x1="12" y1="22.08" x2="12" y2="12"></line>
                  </svg>
                </div>
                <div className="shipping-text">
                  <h3>{t('ship_ems_title')}</h3>
                  <p>{t('ship_ems_desc')}</p>
                </div>
              </div>
            </div>

            <button className="sasom-modal-btn-confirm" onClick={() => setIsInfoModalOpen(false)}>
              {t('dismiss')}
            </button>
          </div>
        </div>
      )}
    </footer>
  );
};

export default UserFooter;
