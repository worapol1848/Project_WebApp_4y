import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';
import { useLanguage } from '../../context/LanguageContext';
import VelinLogo from '../../components/VelinLogo';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, IconButton, Typography } from '@mui/material';
import api from '../../services/api';
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

  const [showFaceScanWarning, setShowFaceScanWarning] = useState(false);

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
      
      
      if (user.role === 'user') {
        try {
          
          const localCart = JSON.parse(localStorage.getItem('cart_guest') || '[]');
          if (localCart.length > 0) {
            await api.post('/cart/sync', { items: localCart });
            localStorage.removeItem('cart_guest');
          }

          
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

      
      const role = (user.role || '').toLowerCase();
      
      if (role === 'superadmin') {
        
        setShowFaceScanWarning(true);
      } else {
        // For other roles, show toast immediately
        showToast(`${t('auth_login_success')}, ${user.username}!`);
        if (role === 'admin') {
          navigate('/admin');
        } else {
          navigate('/');
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || t('auth_login_failed'));
      showToast(err.response?.data?.message || t('auth_login_failed'), 'error');
    }
  };

  const handleProceedToScan = () => {
    setShowFaceScanWarning(false);
    navigate('/superadmin/face-scan');
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
      const res = await api.post('/auth/register', {
        username: registerData.username,
        email: registerData.email,
        password: registerData.password
      });
      if (res.status === 201 || res.status === 200) {
        showToast(t('auth_reg_success'));
        setIsActive(false);
        navigate('/login');
      }
    } catch (err) {
      setError(err.response?.data?.message || t('auth_reg_failed'));
      showToast(err.response?.data?.message || t('auth_reg_failed'), "error");
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
        <button 
          className="back-to-home-btn" 
          onClick={() => navigate('/')}
        >
          <i className='bx bx-arrow-back'></i>
          {t('auth_back_home')}
        </button>
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
        open={showFaceScanWarning} 
        onClose={() => setShowFaceScanWarning(false)}
        PaperProps={{ sx: { borderRadius: '24px', p: 2, maxWidth: '400px' } }}
      >
        <DialogTitle sx={{ fontWeight: 800, textAlign: 'center', color: '#1F2937' }}>
          การยืนยันตัวตนระดับสูง
        </DialogTitle>
        <DialogContent>
          <Typography align="center" sx={{ color: '#4B5563', fontSize: '1.1rem', mb: 2 }}>
            ระบบตรวจพบสิทธิ์ **Super Admin**
          </Typography>
          <Typography align="center" sx={{ color: '#6B7280' }}>
            คุณต้องทำการสแกนใบหน้าเพื่อเข้าสู่ระบบจัดการ หากสแกนหน้าไม่ผ่านจะไม่สามารถเข้าใช้งานได้
          </Typography>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 3 }}>
          <Button 
            variant="contained" 
            onClick={handleProceedToScan}
            sx={{ 
              bgcolor: '#10B981', 
              '&:hover': { bgcolor: '#059669' },
              px: 4, 
              py: 1.5, 
              borderRadius: '12px',
              fontWeight: 700,
              fontSize: '1rem'
            }}
          >
            เริ่มการสแกนใบหน้า
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default AuthPage;
