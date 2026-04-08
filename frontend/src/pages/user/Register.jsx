// code in this file is written by worapol สุดหล่อ
import React, { useState } from "react";
import { TextField, Button, Box, Typography, Container, Paper, Link } from "@mui/material";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import { useToast } from "../../context/ToastContext";
import { useLanguage } from "../../context/LanguageContext";

export default function Register() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    fullName: "",
    email: ""
  });

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await api.post("/auth/register", formData);
      showToast(t('auth_reg_success'));
      navigate("/login");
    } catch (error) {
      showToast(error.response?.data?.message || t('auth_reg_failed'), "error");
    }
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 8, mb: 4 }}>
        <Paper elevation={6} sx={{ p: 4, borderRadius: 4 }}>
          <Typography variant="h4" align="center" gutterBottom sx={{ fontWeight: 800, color: '#1F2937' }}>
            {t('auth_create_acc')}
          </Typography>
          <Typography variant="body2" align="center" sx={{ mb: 3, color: '#6B7280' }}>
            {t('auth_join_desc')}
          </Typography>

          <form onSubmit={handleSubmit}>
            <TextField
              label={t('prof_full_name')}
              name="fullName"
              fullWidth
              margin="normal"
              value={formData.fullName}
              onChange={handleChange}
              required
              variant="outlined"
            />
            <TextField
              label={t('auth_email')}
              name="email"
              type="email"
              fullWidth
              margin="normal"
              value={formData.email}
              onChange={handleChange}
              required
              variant="outlined"
            />
            <TextField
              label={t('auth_username')}
              name="username"
              fullWidth
              margin="normal"
              value={formData.username}
              onChange={handleChange}
              required
              variant="outlined"
            />
            <TextField
              label={t('auth_password')}
              name="password"
              type="password"
              fullWidth
              margin="normal"
              value={formData.password}
              onChange={handleChange}
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
              {t('auth_register')}
            </Button>

            <Box sx={{ textAlign: 'center', mt: 2 }}>
              <Typography variant="body2" color="text.secondary">
                {t('auth_already_acc')}{' '}
                <Link href="/login" sx={{ color: '#10B981', fontWeight: 600, textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>
                  {t('auth_sign_in')}
                </Link>
              </Typography>
            </Box>
          </form>
        </Paper>
      </Box>
    </Container>
  );
}
