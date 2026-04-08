// code in this file is written by worapol สุดหล่อ
import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';
import { useLanguage } from '../../context/LanguageContext';
import VelinLogo from '../../components/VelinLogo';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, IconButton } from '@mui/material';
import './AuthNew.css';

const AuthPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useContext(AuthContext);
  const { showToast } = useToast();
  const { t } = useLanguage();

  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [showSuperAdminPopup, setShowSuperAdminPopup] = useState(false);
  const [showFaceScanner, setShowFaceScanner] = useState(false);

  const [isActive, setIsActive] = useState(location.pathname === '/register');
  const [loginData, setLoginData] = useState({ username: '', password: '' });
  const [registerData, setRegisterData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    email: ''
  });
  const [error, setError] = useState(null);

  useEffect(() => {
    setIsActive(location.pathname === '/register');
  }, [location.pathname]);

  const handleLoginChange = (e) => {
    setLoginData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleRegisterChange = (e) => {
    setRegisterData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      const user = await login(loginData.username, loginData.password);
      
      // Sync Cart & Wishlist from LocalStorage to DB - by worapol สุดหล่อ
      if (user.role === 'user') {
        try {
          // Sync Cart - by worapol สุดหล่อ
          const localCart = JSON.parse(localStorage.getItem('cart_guest') || '[]');
          if (localCart.length > 0) {
            await api.post('/cart/sync', { items: localCart });
            localStorage.removeItem('cart_guest');
          }

          // Sync Wishlist - by worapol สุดหล่อ
          const localWish = JSON.parse(localStorage.getItem('wishlist_guest') || '[]');
          if (localWish.length > 0) {
            await api.post('/wishlist/sync', { itemIds: localWish.map(i => i.id) });
            localStorage.removeItem('wishlist_guest');
          }
          
          window.dispatchEvent(new Event('cartUpdated'));
          window.dispatchEvent(new Event('wishlistUpdated'));
        } catch (syncErr) {
          console.error("Sync failed:", syncErr);
        }
      }

      showToast(`${t('auth_login_success')}, ${user.username}!`);

      if (user.role === 'superadmin') {
        setShowSuperAdminPopup(true);
      } else if (user.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/');
      }
    } catch (err) {
      setError(err.response?.data?.message || t('auth_login_failed'));
      showToast(err.response?.data?.message || t('auth_login_failed'), 'error');
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (registerData.password !== registerData.confirmPassword) {
      setError(t('auth_pass_mismatch'));
      showToast(t('auth_pass_mismatch'), "error");
      return;
    }

    try {
      const res = await fetch("http://localhost:5000/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: registerData.username,
          email: registerData.email,
          password: registerData.password
        })
      });
      const data = await res.json();
      if (res.ok) {
        showToast(t('auth_reg_success'));
        setIsActive(false);
        navigate('/login');
      } else {
        setError(data.message || t('auth_reg_failed'));
        showToast(data.message || t('auth_reg_failed'), "error");
      }
    } catch (error) {
      setError(t('auth_conn_error'));
      showToast(t('auth_conn_error'), "error");
    }
  };

  return (
    <div className={`auth-page-wrapper ${isActive ? 'register-mode' : 'login-mode'}`}>
      {/* Ambient Glow Effects */}
      <div className="ambient-glow">
        <div className="glow-blob glow-1"></div>
        <div className="glow-blob glow-2"></div>
        <div className="glow-blob glow-3"></div>
        <div className="glow-blob glow-4"></div>
        <div className="glow-blob glow-5"></div>
      </div>

      <div className="auth-center-content">
        {/* Only show 'Back to Home' if NOT an admin, or remove entirely if requested. 
            The user wants strict separation, so we remove the back button here to enforce the wall. */}
        
        <div className={`auth-container ${isActive ? 'active' : ''}`}>

          {/* Login Form */}
          <div className="form-box login">
            <form onSubmit={handleLoginSubmit}>
              <h1>{t('auth_sign_in')}</h1>
              {error && !isActive && <div className="error-message-new">{error}</div>}
              <div className="input-box">
                <input
                  type="text"
                  name="username"
                  placeholder={t('auth_username')}
                  value={loginData.username}
                  onChange={handleLoginChange}
                  required
                />
                <i className='bx bxs-user'></i>
              </div>
              <div className="input-box">
                <input
                  type={showLoginPassword ? "text" : "password"}
                  name="password"
                  placeholder={t('auth_password')}
                  value={loginData.password}
                  onChange={handleLoginChange}
                  required
                />
                <i className={`bx ${showLoginPassword ? 'bx-hide' : 'bx-show'} password-toggle`}
                  onClick={() => setShowLoginPassword(!showLoginPassword)}></i>
                <i className='bx bxs-lock-alt' ></i>
              </div>
              <button type="submit" className="auth-btn-new">{t('auth_sign_in')}</button>
            </form>
          </div>

          {/* Register Form */}
          <div className="form-box register">
            <form onSubmit={handleRegisterSubmit}>
              <h1>{t('auth_register')}</h1>
              {error && isActive && <div className="error-message-new">{error}</div>}
              <div className="input-box">
                <input
                  type="text"
                  name="username"
                  placeholder={t('auth_username')}
                  value={registerData.username}
                  onChange={handleRegisterChange}
                  required
                />
                <i className='bx bxs-user'></i>
              </div>
              <div className="input-box">
                <input
                  type="email"
                  name="email"
                  placeholder={t('auth_email')}
                  value={registerData.email}
                  onChange={handleRegisterChange}
                  required
                />
                <i className='bx bxs-envelope' ></i>
              </div>
              <div className="input-box">
                <input
                  type={showRegisterPassword ? "text" : "password"}
                  name="password"
                  placeholder={t('auth_password')}
                  value={registerData.password}
                  onChange={handleRegisterChange}
                  required
                />
                <i className={`bx ${showRegisterPassword ? 'bx-hide' : 'bx-show'} password-toggle`}
                  onClick={() => setShowRegisterPassword(!showRegisterPassword)}></i>
                <i className='bx bxs-lock-alt' ></i>
              </div>
              <div className="input-box">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  placeholder={t('auth_confirm_password')}
                  value={registerData.confirmPassword}
                  onChange={handleRegisterChange}
                  required
                />
                <i className={`bx ${showConfirmPassword ? 'bx-hide' : 'bx-show'} password-toggle`}
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}></i>
                <i className='bx bxs-lock-alt' ></i>
              </div>
              <button type="submit" className="auth-btn-new">{t('auth_register')}</button>
            </form>
          </div>

          <div className="toggle-box">
            <div className="toggle-panel toggle-left">
              <VelinLogo className="auth-logo" textColor="#FFFFFF" />
              <p>{t('auth_dont_have_acc')}</p>
              <button
                className="btn-outline"
                onClick={() => {
                  setIsActive(true);
                  navigate('/register');
                }}
              >
                {t('auth_register')}
              </button>
            </div>

            <div className="toggle-panel toggle-right">
              <VelinLogo className="auth-logo" textColor="#FFFFFF" />
              <p>{t('auth_already_acc')}</p>
              <button
                className="btn-outline"
                onClick={() => {
                  setIsActive(false);
                  navigate('/login');
                }}
              >
                {t('auth_sign_in')}
              </button>
            </div>
          </div>
        </div>
      </div>

      <Dialog
        open={showSuperAdminPopup}
        disableEscapeKeyDown={true}
        onClose={() => {}} // Controlled close only via buttons or close icon - by worapol สุดหล่อ
        sx={{
          '& .MuiDialog-paper': {
            borderRadius: '16px',
            padding: '10px',
            backgroundColor: '#ffffff',
            boxShadow: '0px 10px 40px rgba(0,0,0,0.2)'
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: '800', fontSize: '1.6rem', color: '#111827', borderBottom: '1px solid #F3F4F6', pb: 2.5, display: 'flex', alignItems: 'center', gap: 1.5, position: 'relative' }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#6366F1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 16 16 12 12 8"></polyline><line x1="8" y1="12" x2="16" y2="12"></line></svg>
          {t('super_admin_welcome')}
          <IconButton
            onClick={() => setShowSuperAdminPopup(false)}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: '#94A3B8',
              '&:hover': { color: '#64748B' }
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ mt: 3, mb: 1 }}>
          <p style={{ fontSize: '1.1rem', color: '#4B5563', lineHeight: '1.6', margin: 0 }}>
            {t('super_admin_desc_1')} <b>Super Admin</b><br />
            {t('super_admin_desc_2')}
          </p>
        </DialogContent>
        <DialogActions sx={{ p: 4, pt: 1, display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'stretch' }}>
          <Button
            variant="outlined"
            size="large"
            onClick={() => {
              setShowSuperAdminPopup(false);
              navigate('/admin');
            }}
            sx={{
              py: 2,
              borderRadius: '14px',
              fontSize: '1rem',
              fontWeight: '600',
              borderColor: '#BFDBFE',
              backgroundColor: '#EFF6FF',
              color: '#1E40AF',
              textTransform: 'none',
              display: 'flex',
              justifyContent: 'flex-start',
              px: 3,
              '&:hover': { backgroundColor: '#DBEAFE', borderColor: '#60A5FA' }
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1E40AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>
              {t('super_admin_btn_products')}
            </Box>
          </Button>
          <Button
            variant="contained"
            size="large"
            onClick={() => {
              setShowSuperAdminPopup(false);
              navigate('/superadmin/face-scan');
            }}
            sx={{
              py: 2,
              borderRadius: '14px',
              fontSize: '1rem',
              fontWeight: 'bold',
              background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
              color: 'white',
              textTransform: 'none',
              display: 'flex',
              justifyContent: 'flex-start',
              px: 3,
              boxShadow: '0 10px 15px -3px rgba(37, 99, 235, 0.3)',
              '&:hover': { background: 'linear-gradient(135deg, #1D4ED8 0%, #1E40AF 100%)', transform: 'translateY(-1px)' },
              transition: 'all 0.2s'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
              {t('super_admin_btn_admins')}
            </Box>
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default AuthPage;
