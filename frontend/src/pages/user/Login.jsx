import React, { useState, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';
import { useLanguage } from '../../context/LanguageContext';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, Box } from '@mui/material';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showFaceScanWarning, setShowFaceScanWarning] = useState(false);
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { t } = useLanguage();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const user = await login(username, password);
      
      const role = (user.role || '').toLowerCase();
      
      if (role === 'superadmin') {
        
        setShowFaceScanWarning(true);
      } else {
        showToast(`${t('auth_login_success')}, ${user.username}!`);
        if (role === 'admin') {
          navigate('/admin');
        } else {
          navigate('/');
        }
      }
    } catch (err) {
      showToast(err.response?.data?.message || t('auth_login_failed'), 'error');
    }
  };

  const handleProceedToScan = () => {
    setShowFaceScanWarning(false);
    navigate('/superadmin/face-scan');
  };

  return (
    <div className="login-container">
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder={t('auth_username')}
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
          type="password"
          placeholder={t('auth_password')}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button type="submit">{t('auth_sign_in')}</button>
      </form>

      
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

export default Login;
