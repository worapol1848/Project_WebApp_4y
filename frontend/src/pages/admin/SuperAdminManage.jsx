// code in this file is written by worapol สุดหล่อ
import React, { useEffect, useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Select, MenuItem, FormControl, InputLabel,
  CircularProgress, Box, Typography, IconButton, Tooltip,
  Paper, Grid, Card, CardContent, Divider, Fade, Grow
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../../services/api';

const SuperAdminManage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openModal, setOpenModal] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState(null);

  // Form State - by worapol สุดหล่อ
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    role: 'admin'
  });

  const fetchAdmins = async () => {
    try {
      setLoading(true);
      const res = await api.get('/auth/admins');
      setAdmins(res.data);
    } catch (err) {
      console.error('Fetch admins error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  // Auto-reopen modal if returning from face scan - by worapol สุดหล่อ
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const editId = params.get('editId');
    if (editId && admins.length > 0) {
      const targetAdmin = admins.find(a => a.id === parseInt(editId));
      if (targetAdmin) {
        // Open modal - by worapol สุดหล่อ
        setEditingAdmin(targetAdmin);
        // Force form data to be superadmin since they just scanned - by worapol สุดหล่อ
        setFormData({
          username: targetAdmin.username,
          email: targetAdmin.email || '',
          password: '',
          role: 'superadmin' // Force superadmin after scan - by worapol สุดหล่อ
        });
        setOpenModal(true);
        // Remove the query param once handled - by worapol สุดหล่อ
        navigate(location.pathname, { replace: true });
      }
    }
  }, [location.search, admins, navigate, location.pathname]);

  const handleOpenModal = (admin = null) => {
    if (admin) {
      setEditingAdmin(admin);
      setFormData({
        username: admin.username,
        email: admin.email || '',
        password: '',
        role: admin.role
      });
    } else {
      setEditingAdmin(null);
      setFormData({
        username: '',
        email: '',
        password: '',
        role: 'admin'
      });
    }
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const [confirmDialog, setConfirmDialog] = useState({ open: false, title: '', message: '', onConfirm: null, isAlert: false });

  const showAlert = (title, message) => {
    setConfirmDialog({ open: true, title, message, onConfirm: null, isAlert: true });
  };

  const showConfirm = (title, message, onConfirm) => {
    setConfirmDialog({ open: true, title, message, onConfirm, isAlert: false });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Strict Rule: Cannot be Super Admin without Face Data - by worapol สุดหล่อ
    if (formData.role === 'superadmin') {
      const currentAdmin = admins.find(a => a.id === editingAdmin?.id);
      if (!currentAdmin || !currentAdmin.hasFaceData) {
        showAlert('Security Requirement', 'ไม่สามารถปรับเป็น Super Admin ได้: เนื่องจากผู้ใช้งานคนนี้ยังไม่มีข้อมูลใบหน้าในระบบ กรุณาลงทะเบียนใบหน้าก่อนครับ');
        return;
      }
    }

    try {
      if (editingAdmin) {
        await api.put(`/auth/admins/${editingAdmin.id}`, formData);
        showAlert('Success', 'อัปเดตข้อมูลแอดมินเรียบร้อยแล้ว');
      } else {
        await api.post('/auth/admins', formData);
        showAlert('Success', 'เพิ่มแอดมินใหม่เรียบร้อยแล้ว');
      }
      handleCloseModal();
      fetchAdmins();
    } catch (err) {
      showAlert('Error', err.response?.data?.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    }
  };

  const handleDelete = async (id) => {
    showConfirm('Confirm Deletion', 'คุณแน่ใจหรือไม่ที่จะลบเจ้าหน้าที่คนนี้ออกจากระบบ? การดำเนินการนี้ไม่สามารถย้อนกลับได้', async () => {
      try {
        await api.delete(`/auth/admins/${id}`);
        fetchAdmins();
      } catch (err) {
        showAlert('Error', err.response?.data?.message || 'ไม่สามารถลบข้อมูลได้');
      }
    });
  };

  const handleResetFace = async (id, username) => {
    showConfirm('Reset Biometrics', `คุณแน่ใจหรือไม่ที่จะรีเซ็ตข้อมูลใบหน้าของ ${username}? เจ้าหน้าที่จะต้องสแกนใบหน้าใหม่ในการเข้าใช้ครั้งถัดไป`, async () => {
      try {
        await api.put(`/auth/admins/${id}/reset-face`);
        fetchAdmins();
        showAlert('Reset Successful', 'รีเซ็ตข้อมูลใบหน้าเรียบร้อยแล้ว');
      } catch (err) {
        showAlert('Error', 'เกิดข้อผิดพลาดในการรีเซ็ตข้อมูลใบหน้า');
      }
    });
  };

  // Stats - by worapol สุดหล่อ
  const totalAdmins = admins.length;
  const superAdmins = admins.filter(a => a.role === 'superadmin').length;
  const registeredFaces = admins.filter(a => a.hasFaceData).length;

  return (
    <Box sx={{
      minHeight: '100vh',
      backgroundColor: '#F3F4F6', // Lighter grey for background - by worapol สุดหล่อ
      p: { xs: 2, md: 5 },
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center'
    }}>
      {/* Premium Navbar Search Area Style */}
      <Box sx={{ width: '100%', maxWidth: '1200px', mb: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" fontWeight="1000" sx={{ color: '#111827', mb: 0.5, letterSpacing: '-0.5px' }}>
            Workforce Management
          </Typography>
          <Typography variant="body1" sx={{ color: '#6B7280', fontWeight: '500' }}>
            Personnel security and role assignment
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>}
          onClick={() => navigate('/admin')}
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
          Back to Dashboard
        </Button>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ width: '100%', maxWidth: '1200px', mb: 5 }}>
        <Grid item xs={12} md={4}>
          <Card sx={{ borderRadius: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', border: '1px solid #E5E7EB' }}>
            <CardContent sx={{ p: 4, display: 'flex', alignItems: 'center', gap: 3 }}>
              <Box sx={{ p: 2, borderRadius: '16px', bgcolor: '#EEF2FF', color: '#6366F1' }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
              </Box>
              <Box>
                <Typography variant="h3" fontWeight="900" sx={{ color: '#111827' }}>{totalAdmins}</Typography>
                <Typography variant="body2" sx={{ color: '#6B7280', fontWeight: '600' }}>Total Personnel</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ borderRadius: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', border: '1px solid #E5E7EB' }}>
            <CardContent sx={{ p: 4, display: 'flex', alignItems: 'center', gap: 3 }}>
              <Box sx={{ p: 2, borderRadius: '16px', bgcolor: '#F5F3FF', color: '#8B5CF6' }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"></path><path d="M2 17l10 5 10-5"></path><path d="M2 12l10 5 10-5"></path></svg>
              </Box>
              <Box>
                <Typography variant="h3" fontWeight="900" sx={{ color: '#111827' }}>{superAdmins}</Typography>
                <Typography variant="body2" sx={{ color: '#6B7280', fontWeight: '600' }}>Super Admins</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ borderRadius: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', border: '1px solid #E5E7EB' }}>
            <CardContent sx={{ p: 4, display: 'flex', alignItems: 'center', gap: 3 }}>
              <Box sx={{ p: 2, borderRadius: '16px', bgcolor: '#ECFDF5', color: '#10B981' }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
              </Box>
              <Box>
                <Typography variant="h3" fontWeight="900" sx={{ color: '#111827' }}>{registeredFaces}</Typography>
                <Typography variant="body2" sx={{ color: '#6B7280', fontWeight: '600' }}>Biometrics Registered</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Main Table Section */}
      <Paper elevation={0} sx={{
        width: '100%',
        maxWidth: '1200px',
        backgroundColor: '#fff',
        borderRadius: '32px',
        boxShadow: '0 20px 25px -5px rgba(0,0,0,0.05), 0 10px 10px -5px rgba(0,0,0,0.02)',
        overflow: 'hidden',
        border: '1px solid #F3F4F6'
      }}>
        <Box sx={{ p: 5 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 5 }}>
            <Box>
              <Typography variant="h5" fontWeight="900" sx={{ color: '#111827' }}>Personnel Access List</Typography>
              <Typography variant="body2" sx={{ color: '#6B7280' }}>All registered administrators and their security levels</Typography>
            </Box>
            <Button
              onClick={() => handleOpenModal()}
              variant="contained"
              startIcon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>}
              sx={{
                background: 'linear-gradient(135deg, #111827 0%, #374151 100%)',
                borderRadius: '16px',
                px: 4, py: 1.8,
                fontWeight: '800',
                textTransform: 'none',
                boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                '&:hover': { boxShadow: '0 20px 25px -5px rgba(0,0,0,0.15)' }
              }}
            >
              Add New Admin
            </Button>
          </Box>

          <Box sx={{ width: '100%', overflowX: 'auto' }}>
            {loading ? (
              <Box sx={{ py: 15, textAlign: 'center' }}>
                <CircularProgress size={50} sx={{ color: '#111827' }} />
                <Typography sx={{ mt: 2, color: '#6B7280', fontWeight: '600' }}>Loading security data...</Typography>
              </Box>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 12px' }}>
                <thead>
                  <tr style={{ textAlign: 'left' }}>
                    <th style={{ padding: '0 20px', color: '#9CA3AF', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px' }}>ID</th>
                    <th style={{ padding: '0 20px', color: '#9CA3AF', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Personnel</th>
                    <th style={{ padding: '0 20px', color: '#9CA3AF', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Permissions</th>
                    <th style={{ padding: '0 20px', color: '#9CA3AF', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Biometrics</th>
                    <th style={{ padding: '0 20px', color: '#9CA3AF', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px', textAlign: 'right' }}>Management</th>
                  </tr>
                </thead>
                <tbody>
                  {admins.map((admin) => (
                    <tr key={admin.id} style={{ backgroundColor: '#f9f9fc', transition: 'all 0.2s' }}>
                      <td style={{ padding: '24px 20px', borderTopLeftRadius: '20px', borderBottomLeftRadius: '20px', color: '#9CA3AF', fontWeight: '700' }}>
                        #{admin.id}
                      </td>
                      <td style={{ padding: '24px 20px' }}>
                        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                          <Typography fontWeight="900" sx={{ color: '#111827', fontSize: '1.05rem' }}>{admin.username}</Typography>
                          <Typography sx={{ color: '#6B7280', fontSize: '0.85rem' }}>{admin.email || 'No email provided'}</Typography>
                        </Box>
                      </td>
                      <td style={{ padding: '24px 20px' }}>
                        <Box sx={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 1,
                          backgroundColor: admin.role === 'superadmin' ? '#F5F3FF' : '#F0F9FF',
                          color: admin.role === 'superadmin' ? '#7C3AED' : '#0EA5E9',
                          px: 2, py: 0.8,
                          borderRadius: '12px',
                          fontSize: '0.75rem',
                          fontWeight: '800',
                          border: '1.5px solid',
                          borderColor: admin.role === 'superadmin' ? '#DDD6FE' : '#BAE6FD'
                        }}>
                          <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: 'currentColor' }} />
                          {admin.role.toUpperCase()}
                        </Box>
                      </td>
                      <td style={{ padding: '24px 20px' }}>
                        {admin.role === 'superadmin' ? (
                          admin.hasFaceData ? (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#10B981', bgcolor: '#ECFDF5', px: 2, py: 0.8, borderRadius: '12px', width: 'fit-content' }}>
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                              <Typography sx={{ fontSize: '0.75rem', fontWeight: '1000' }}>REGISTERED</Typography>
                            </Box>
                          ) : (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#EF4444', bgcolor: '#FEF2F2', px: 2, py: 0.8, borderRadius: '12px', width: 'fit-content' }}>
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                              <Typography sx={{ fontSize: '0.75rem', fontWeight: '1000' }}>REQUIRED</Typography>
                            </Box>
                          )
                        ) : (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#64748B', bgcolor: '#F1F5F9', px: 2, py: 0.8, borderRadius: '12px', width: 'fit-content' }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                            <Typography sx={{ fontSize: '0.75rem', fontWeight: '800' }}>STANDARD</Typography>
                          </Box>
                        )}
                      </td>
                      <td style={{ padding: '24px 20px', borderTopRightRadius: '20px', borderBottomRightRadius: '20px', textAlign: 'right' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                          {admin.role === 'superadmin' && (
                            <>
                              <Tooltip title="Reset Face Data">
                                <IconButton onClick={() => handleResetFace(admin.id, admin.username)} sx={{ color: '#F59E0B', bgcolor: '#fff', '&:hover': { bgcolor: '#FFFBEB' } }}>
                                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 4v6h-6"></path><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path></svg>
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Scan Face Now">
                                <IconButton
                                  onClick={() => navigate(`/superadmin/face-scan/${admin.id}`)}
                                  sx={{ color: '#10B981', bgcolor: '#fff', '&:hover': { bgcolor: '#ECFDF5' } }}
                                >
                                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>
                                </IconButton>
                              </Tooltip>
                            </>
                          )}
                          <Tooltip title="Edit Profile">
                            <IconButton onClick={() => handleOpenModal(admin)} sx={{ color: '#6366F1', bgcolor: '#fff', '&:hover': { bgcolor: '#F5F5FF' } }}>
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete Account">
                            <IconButton
                              onClick={() => handleDelete(admin.id)}
                              sx={{
                                color: admin.id === 1 ? '#E2E8F0' : '#EF4444',
                                bgcolor: '#fff',
                                '&:hover': { bgcolor: admin.id === 1 ? '#fff' : '#FEF2F2' }
                              }}
                              disabled={admin.id === 1}
                            >
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Box>
        </Box>
      </Paper>

      {/* Add/Edit Modal - Premium Style */}
      <Dialog
        open={openModal}
        onClose={handleCloseModal}
        maxWidth="sm"
        fullWidth
        TransitionComponent={Grow}
        PaperProps={{
          sx: { borderRadius: '32px', p: 2, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }
        }}
      >
        <DialogTitle sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          pb: 2,
          borderBottom: '1.5px solid #F3F4F6'
        }}>
          <Box>
            <Typography variant="h5" fontWeight="1000" sx={{ color: '#111827' }}>
              {editingAdmin ? 'Edit Personnel' : 'Create New Access'}
            </Typography>
            <Typography variant="body2" sx={{ color: '#6B7280' }}>Configure security credentials</Typography>
          </Box>
          <IconButton onClick={handleCloseModal} sx={{ color: '#9CA3AF' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </IconButton>
        </DialogTitle>

        <form onSubmit={handleSubmit}>
          <DialogContent sx={{ px: 3, pt: 4, display: 'flex', flexDirection: 'column', gap: 3 }}>
            <TextField
              label="Username"
              name="username"
              fullWidth
              value={formData.username}
              onChange={handleChange}
              required
              variant="outlined"
              InputProps={{ sx: { borderRadius: '16px', fontWeight: 'bold' } }}
            />
            <TextField
              label="Email Address"
              name="email"
              type="email"
              fullWidth
              value={formData.email}
              onChange={handleChange}
              variant="outlined"
              InputProps={{ sx: { borderRadius: '16px', fontWeight: 'bold' } }}
            />
            <TextField
              label={editingAdmin ? "New Password (Leave blank for no change)" : "Access Password"}
              name="password"
              type="password"
              fullWidth
              value={formData.password}
              onChange={handleChange}
              required={!editingAdmin}
              variant="outlined"
              InputProps={{ sx: { borderRadius: '16px', fontWeight: 'bold' } }}
            />
            <FormControl fullWidth variant="outlined">
              <InputLabel sx={{ fontWeight: 'bold' }}>Security Role</InputLabel>
              <Select
                name="role"
                value={formData.role}
                label="Security Role"
                onChange={handleChange}
                sx={{ borderRadius: '16px', fontWeight: 'bold' }}
              >
                <MenuItem value="admin" sx={{ fontWeight: 'bold' }}>Standard Admin (Store Ops)</MenuItem>
                <MenuItem value="superadmin" sx={{ fontWeight: 'bold' }}>Super Admin (System Core)</MenuItem>
              </Select>
            </FormControl>

            {editingAdmin && formData.role === 'superadmin' && (
              <Box sx={{
                p: 3,
                borderRadius: '24px',
                bgcolor: (editingAdmin.hasFaceData && formData.role === 'superadmin') ? '#ECFDF5' : '#F5F3FF',
                border: '1.5px dashed',
                borderColor: (editingAdmin.hasFaceData && formData.role === 'superadmin') ? '#10B981' : '#C4B5FD',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 2,
                mt: 1
              }}>
                <Typography variant="body2" sx={{ 
                  color: (editingAdmin.hasFaceData && formData.role === 'superadmin') ? '#065F46' : '#7C3AED', 
                  fontWeight: '800', 
                  textAlign: 'center' 
                }}>
                  {editingAdmin.hasFaceData && formData.role === 'superadmin'
                    ? `Biometric Face Data Recorded Successfully (ID: ${editingAdmin.id})`
                    : 'Biometric Face Data is Required for Super Admin Access'}
                </Typography>
                {!(editingAdmin.hasFaceData && formData.role === 'superadmin') ? (
                  <Button
                    variant="contained"
                    startIcon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>}
                    onClick={() => navigate(`/superadmin/face-scan/${editingAdmin.id}`)}
                    sx={{
                      bgcolor: '#7C3AED',
                      color: '#fff',
                      borderRadius: '14px',
                      px: 3, py: 1.2,
                      textTransform: 'none',
                      fontWeight: '800',
                      '&:hover': { bgcolor: '#6D28D9' }
                    }}
                  >
                    Initiate Biometric Scan
                  </Button>
                ) : (
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5 }}>
                    <Box sx={{ color: '#10B981', display: 'flex', alignItems: 'center', gap: 1 }}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                      <Typography fontWeight="900" fontSize="0.9rem">ACTIVE BIOMETRIC LOGIN</Typography>
                    </Box>
                    <Button
                      size="small"
                      onClick={() => navigate(`/superadmin/face-scan/${editingAdmin.id}`)}
                      sx={{ 
                        color: '#6366F1', 
                        textTransform: 'none', 
                        fontWeight: '700',
                        fontSize: '0.8rem',
                        textDecoration: 'underline',
                        '&:hover': { textDecoration: 'none', bgcolor: 'transparent' }
                      }}
                    >
                      Update / Re-scan Face Data
                    </Button>
                  </Box>
                )}
              </Box>
            )}
          </DialogContent>

          <DialogActions sx={{ p: 4, pt: 2, gap: 2 }}>
            <Button onClick={handleCloseModal} sx={{ color: '#6B7280', fontWeight: '900', textTransform: 'none' }}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              fullWidth
              sx={{
                background: 'linear-gradient(135deg, #111827 0%, #374151 100%)',
                px: 6, py: 2,
                borderRadius: '16px',
                fontWeight: '1000',
                textTransform: 'none',
                boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                '&:hover': { boxShadow: '0 20px 25px -5px rgba(0,0,0,0.15)' }
              }}>
              {editingAdmin ? 'Update Credentials' : 'Create Access Token'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Premium Alert/Confirm Dialog */}
      <Dialog
        open={confirmDialog.open}
        onClose={() => setConfirmDialog({ ...confirmDialog, open: false })}
        PaperProps={{ sx: { borderRadius: '28px', p: 1, maxWidth: '400px' } }}
      >
        <DialogContent sx={{ textAlign: 'center', pt: 4 }}>
          <Box sx={{
            width: 64, height: 64, borderRadius: '50%',
            bgcolor: confirmDialog.title === 'Error' ? '#FEF2F2' : '#F0F9FF',
            display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 3
          }}>
            {confirmDialog.title === 'Error' ? (
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
            ) : (
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#0EA5E9" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
            )}
          </Box>
          <Typography variant="h6" fontWeight="900" sx={{ color: '#111827', mb: 1.5 }}>
            {confirmDialog.title}
          </Typography>
          <Typography variant="body2" sx={{ color: '#6B7280', px: 2, lineHeight: 1.6 }}>
            {confirmDialog.message}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 4, pt: 1, gap: 2 }}>
          {!confirmDialog.isAlert && (
            <Button
              fullWidth
              onClick={() => setConfirmDialog({ ...confirmDialog, open: false })}
              sx={{ color: '#6B7280', fontWeight: '800', textTransform: 'none', borderRadius: '14px', py: 1.5 }}
            >
              ยกเลิก
            </Button>
          )}
          <Button
            variant="contained"
            fullWidth
            onClick={() => {
              if (confirmDialog.onConfirm) confirmDialog.onConfirm();
              setConfirmDialog({ ...confirmDialog, open: false });
            }}
            sx={{
              bgcolor: confirmDialog.title === 'Error' ? '#EF4444' : '#111827',
              color: '#fff',
              borderRadius: '16px',
              fontWeight: '1000',
              textTransform: 'none',
              py: 2,
              boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
              '&:hover': { bgcolor: confirmDialog.title === 'Error' ? '#DC2626' : '#000', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.15)' }
            }}
          >
            {confirmDialog.isAlert ? 'ตกลง' : 'ยืนยัน'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SuperAdminManage;
