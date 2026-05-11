import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Typography, Button, Paper, Avatar, Grid, Divider, CircularProgress } from '@mui/material';
import api from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';

const SuperAdminProfileView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const isThai = language === 'th';
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAdmin = async () => {
      try {
        const res = await api.get('/auth/admins');
        const found = res.data.find(a => a.id === parseInt(id));
        setAdmin(found);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAdmin();
  }, [id]);

  if (loading) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', bgcolor: '#F3F4F6' }}>
        <CircularProgress sx={{ color: '#111827' }} />
      </Box>
    );
  }

  if (!admin) {
    return (
      <Box sx={{ minHeight: '100vh', p: 5, textAlign: 'center', bgcolor: '#F3F4F6' }}>
        <Typography variant="h5" sx={{ color: '#EF4444', mb: 3 }}>{isThai ? 'ไม่พบข้อมูลผู้ใช้' : 'User not found'}</Typography>
        <Button variant="contained" onClick={() => navigate('/superadmin/directory')} sx={{ bgcolor: '#111827', borderRadius: '12px' }}>
          {t('back') || 'Back'}
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{
      minHeight: '100vh',
      backgroundColor: '#F3F4F6', 
      p: { xs: 2, md: 5 },
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center'
    }}>
      <Box sx={{ width: '100%', maxWidth: '800px', mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" fontWeight="1000" sx={{ color: '#111827' }}>
          {isThai ? 'ข้อมูลบุคลากร' : 'Personnel Profile'}
        </Typography>
        <Button
          variant="contained"
          startIcon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>}
          onClick={() => navigate('/superadmin/directory')}
          sx={{
            bgcolor: '#fff',
            color: '#374151',
            borderRadius: '16px',
            px: 3, py: 1.5,
            textTransform: 'none',
            fontWeight: '800',
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
            '&:hover': { bgcolor: '#f9fafb', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }
          }}
        >
          {t('back') || 'Back'}
        </Button>
      </Box>

      <Paper elevation={0} sx={{
        width: '100%',
        maxWidth: '800px',
        backgroundColor: '#fff',
        borderRadius: '32px',
        p: { xs: 3, md: 6 },
        boxShadow: '0 20px 25px -5px rgba(0,0,0,0.05), 0 10px 10px -5px rgba(0,0,0,0.02)',
        border: '1px solid #E5E7EB'
      }}>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, alignItems: 'center', gap: 4, mb: 5 }}>
          <Avatar
            src={admin.profile_image ? `http://localhost:5000${admin.profile_image}` : null}
            sx={{ width: 140, height: 140, border: '4px solid #F3F4F6', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontSize: '3.5rem', fontWeight: 'bold' }}
          >
            {admin.username?.charAt(0).toUpperCase()}
          </Avatar>
          <Box sx={{ textAlign: { xs: 'center', md: 'left' } }}>
            <Typography variant="h3" fontWeight="900" sx={{ color: '#111827', mb: 1 }}>{admin.full_name || admin.username}</Typography>
            <Typography variant="h6" sx={{ color: '#6B7280', mb: 2 }}>@{admin.username}</Typography>
            <Box sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 1,
              backgroundColor: admin.role === 'superadmin' ? '#F5F3FF' : '#F0F9FF',
              color: admin.role === 'superadmin' ? '#7C3AED' : '#0EA5E9',
              px: 3, py: 1,
              borderRadius: '16px',
              fontSize: '0.85rem',
              fontWeight: '800',
              border: '1.5px solid',
              borderColor: admin.role === 'superadmin' ? '#DDD6FE' : '#BAE6FD'
            }}>
              <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'currentColor' }} />
              {admin.role.toUpperCase()}
            </Box>
          </Box>
        </Box>

        <Divider sx={{ my: 4, borderColor: '#F3F4F6', borderWidth: '1px' }} />

        <Grid container spacing={4}>
          <Grid item xs={12} sm={6}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Typography sx={{ color: '#9CA3AF', fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px' }}>
                {t('email') || 'Email'}
              </Typography>
              <Typography sx={{ color: '#1F2937', fontSize: '1.1rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                {admin.email || '-'}
              </Typography>
            </Box>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Typography sx={{ color: '#9CA3AF', fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px' }}>
                {isThai ? 'เบอร์โทรศัพท์' : 'Phone'}
              </Typography>
              <Typography sx={{ color: '#1F2937', fontSize: '1.1rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                {admin.phone || '-'}
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={12}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, p: 3, bgcolor: '#F8FAFC', borderRadius: '20px', border: '1px solid #E2E8F0' }}>
              <Typography sx={{ color: '#9CA3AF', fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', mb: 1 }}>
                {t('adm_table_biometrics') || 'Biometrics'}
              </Typography>
              
              {admin.role === 'superadmin' ? (
                admin.hasFaceData ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, color: '#059669' }}>
                    <Box sx={{ bgcolor: '#D1FAE5', p: 1, borderRadius: '50%', display: 'flex' }}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    </Box>
                    <Typography sx={{ fontSize: '1.1rem', fontWeight: '800' }}>{isThai ? 'ลงทะเบียนข้อมูลใบหน้าแล้ว' : 'Face Data Registered'}</Typography>
                  </Box>
                ) : (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, color: '#DC2626' }}>
                    <Box sx={{ bgcolor: '#FEE2E2', p: 1, borderRadius: '50%', display: 'flex' }}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                    </Box>
                    <Typography sx={{ fontSize: '1.1rem', fontWeight: '800' }}>{isThai ? 'ยังไม่ลงทะเบียนข้อมูลใบหน้า' : 'Face Data Required'}</Typography>
                  </Box>
                )
              ) : (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, color: '#475569' }}>
                  <Box sx={{ bgcolor: '#E2E8F0', p: 1, borderRadius: '50%', display: 'flex' }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                  </Box>
                  <Typography sx={{ fontSize: '1.1rem', fontWeight: '800' }}>{t('adm_biometrics_standard') || 'Standard Security'}</Typography>
                </Box>
              )}
            </Box>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

export default SuperAdminProfileView;
