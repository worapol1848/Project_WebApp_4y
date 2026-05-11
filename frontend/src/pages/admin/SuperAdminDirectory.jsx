import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Paper, Avatar, Grid, CircularProgress, CardActionArea } from '@mui/material';
import api from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';

const SuperAdminDirectory = () => {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const isThai = language === 'th';
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAdmins = async () => {
      try {
        const res = await api.get('/auth/admins');
        setAdmins(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAdmins();
  }, []);

  if (loading) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', bgcolor: '#F3F4F6' }}>
        <CircularProgress sx={{ color: '#111827' }} />
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
      <Box sx={{ width: '100%', maxWidth: '1200px', mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" fontWeight="1000" sx={{ color: '#111827' }}>
          {t('adm_admin_directory') || (isThai ? 'ข้อมูลแอดมินทั้งหมด' : 'Admin Profiles')}
        </Typography>
      </Box>

      <Grid container spacing={4} sx={{ width: '100%', maxWidth: '1200px' }}>
        {admins.map((admin) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={admin.id}>
            <Paper elevation={0} sx={{
              borderRadius: '24px',
              overflow: 'hidden',
              boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)',
              border: '1px solid #E5E7EB',
              transition: 'transform 0.2s, box-shadow 0.2s',
              '&:hover': {
                transform: 'translateY(-5px)',
                boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
              }
            }}>
              <CardActionArea 
                onClick={() => navigate(`/superadmin/admin/${admin.id}`)}
                sx={{ p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%' }}
              >
                <Avatar
                  src={admin.profile_image ? `http://localhost:5000${admin.profile_image}` : null}
                  sx={{ width: 90, height: 90, mb: 2, border: '3px solid #F3F4F6', fontSize: '2rem', fontWeight: 'bold' }}
                >
                  {admin.username?.charAt(0).toUpperCase()}
                </Avatar>
                
                <Typography variant="h6" fontWeight="900" sx={{ color: '#111827', textAlign: 'center', mb: 0.5, lineHeight: 1.2 }}>
                  {admin.full_name || admin.username}
                </Typography>
                <Typography variant="body2" sx={{ color: '#6B7280', mb: 2 }}>
                  @{admin.username}
                </Typography>

                <Box sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 1,
                  backgroundColor: admin.role === 'superadmin' ? '#F5F3FF' : '#F0F9FF',
                  color: admin.role === 'superadmin' ? '#7C3AED' : '#0EA5E9',
                  px: 2, py: 0.5,
                  borderRadius: '12px',
                  fontSize: '0.75rem',
                  fontWeight: '800',
                  border: '1.5px solid',
                  borderColor: admin.role === 'superadmin' ? '#DDD6FE' : '#BAE6FD'
                }}>
                  <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: 'currentColor' }} />
                  {admin.role.toUpperCase()}
                </Box>
              </CardActionArea>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default SuperAdminDirectory;
