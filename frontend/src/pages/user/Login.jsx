// code in this file is written by worapol สุดหล่อ
import React, { useState, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import {
  TextField,
  Button,
  Box,
  Typography,
  Container,
  Paper,
  Link,
  Alert
} from "@mui/material";
import { useToast } from '../../context/ToastContext';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);

  const { login } = useContext(AuthContext);
  const { showToast } = useToast();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      const user = await login(username, password);
      showToast(`${t('auth_login_success')}, ${user.username}!`);
      if (user.role === 'admin') navigate('/admin');
      else navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || t('auth_login_failed'));
    }
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 8, mb: 4 }}>
        <Paper elevation={6} sx={{ p: 4, borderRadius: 4 }}>
          <Typography variant="h4" align="center" gutterBottom sx={{ fontWeight: 800, color: '#1F2937' }}>
            {t('auth_welcome')}
          </Typography>
          <Typography variant="body2" align="center" sx={{ mb: 3, color: '#6B7280' }}>
            {t('auth_sign_in_desc')}
          </Typography>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <form onSubmit={handleLogin}>
            <TextField
              label={t('auth_username')}
              fullWidth
              margin="normal"
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
              variant="outlined"
            />
            <TextField
              label={t('auth_password')}
              type="password"
              fullWidth
              margin="normal"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              variant="outlined"
            />

            <Button
              type="submit"
              variant="contained"
              fullWidth
              size="large"
              sx={{
                mt: 3,
                mb: 2,
                py: 1.5,
                borderRadius: 2,
                bgcolor: '#10B981',
                '&:hover': { bgcolor: '#059669' },
                textTransform: 'none',
                fontSize: '1.1rem',
                fontWeight: 600
              }}
            >
              {t('auth_sign_in')}
            </Button>

            <Box sx={{ textAlign: 'center', mt: 2 }}>
              <Typography variant="body2" color="text.secondary">
                {t('auth_dont_have_acc')}{' '}
                <Link href="/register" sx={{ color: '#10B981', fontWeight: 600, textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>
                  {t('auth_register_now')}
                </Link>
              </Typography>
            </Box>
          </form>
        </Paper>
      </Box>
    </Container>
  );
};

export default Login;
