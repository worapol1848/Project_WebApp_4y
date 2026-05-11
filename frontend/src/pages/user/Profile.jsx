import React, { useState, useEffect, useContext, useRef } from 'react';
import api from '../../services/api';
import { AuthContext } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useLanguage } from '../../context/LanguageContext';
import { Box, Typography, Button, Paper, Avatar, Grid, Divider } from '@mui/material';
import './Profile.css';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';


import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
let DefaultIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;


const MapController = ({ targetCoords, zoom }) => {
  const map = useMap();
  useEffect(() => {
    if (targetCoords) {
      map.setView(targetCoords, zoom);
      
      setTimeout(() => map.invalidateSize(), 100);
    }
  }, [targetCoords, map, zoom]);
  return null;
};


const MapLogic = ({ coords, setCoords, onManualMove }) => {
  useMapEvents({
    click(e) {
      setCoords([e.latlng.lat, e.latlng.lng]);
      if (onManualMove) onManualMove();
    }
  });

  return (
    <>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <Marker
        position={coords}
        draggable={true}
        eventHandlers={{
          dragend: (e) => {
            const { lat, lng } = e.target.getLatLng();
            setCoords([lat, lng]);
            if (onManualMove) onManualMove();
          }
        }}
      />
    </>
  );
};

const Profile = () => {
  const { user } = useContext(AuthContext);
  const { t } = useLanguage();
  const [profile, setProfile] = useState({
    username: '', email: '', full_name: '', phone: '',
    address: '', sub_district: '', district: '', province: '', postal_code: '',
    profile_image: ''
  });
  const { showToast } = useToast();
  const [passwords, setPasswords] = useState({
    oldPassword: '', newPassword: '', confirmPassword: ''
  });
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);
  const [isFullMapOpen, setIsFullMapOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [hasMovedManually, setHasMovedManually] = useState(false);

  
  const [mapCoords, setMapCoords] = useState([13.7367, 100.5231]);
  const searchTimeout = useRef(null);
  const fileInputRef = useRef(null);

  
  const [editAddress, setEditAddress] = useState({});

  
  const [targetCoords, setTargetCoords] = useState(null);
  const lastSearchQuery = useRef('');

  const searchLocation = async (query) => {
    if (query === lastSearchQuery.current || hasMovedManually) return;
    lastSearchQuery.current = query;

    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query + ', Thailand')}`);
      const data = await response.json();
      if (data && data.length > 0) {
        const newCoords = [parseFloat(data[0].lat), parseFloat(data[0].lon)];
        setMapCoords(newCoords);
        setTargetCoords(newCoords); 
      }
    } catch (err) {
      console.error('Geocoding error:', err);
    }
  };

  useEffect(() => {
    if (!isAddressModalOpen || isFullMapOpen || hasMovedManually) return;
    const query = [editAddress.district, editAddress.province].filter(Boolean).join(', ');
    if (query.length > 3 && query !== lastSearchQuery.current) {
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
      searchTimeout.current = setTimeout(() => searchLocation(query), 1200);
    }
  }, [editAddress.district, editAddress.province, isAddressModalOpen, isFullMapOpen, hasMovedManually]);

  const fetchProfile = async () => {
    try {
      const res = await api.get('/auth/profile');
      setProfile(res.data);
      setEditAddress(res.data);
      if (res.data.latitude && res.data.longitude) {
        const initialCoords = [parseFloat(res.data.latitude), parseFloat(res.data.longitude)];
        setMapCoords(initialCoords);
        setTargetCoords(initialCoords);
        
        lastSearchQuery.current = [res.data.district, res.data.province].filter(Boolean).join(', ');
      }
      setLoading(false);
    } catch (err) {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleUpdateProfile = async (e) => {
    if (e) e.preventDefault();
    try {
      
      const finalAddress = {
        ...editAddress,
        latitude: mapCoords[0],
        longitude: mapCoords[1]
      };
      await api.put('/auth/profile', finalAddress);
      await fetchProfile(); 
      showToast(t('prof_address_success') || 'Profile updated successfully');
      setIsAddressModalOpen(false);
      setIsEditProfileModalOpen(false);
    } catch (err) {
      showToast(t('error'), 'error');
    }
  };

  const handleDeleteAddress = async () => {
    if (window.confirm(t('prof_confirm_delete_address'))) {
      try {
        await api.delete('/auth/profile/address');
        showToast(t('success'));
        fetchProfile();
      } catch (err) {
        showToast(t('error'), 'error');
      }
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirmPassword) {
      showToast(t('prof_pw_mismatch'), 'error');
      return;
    }
    try {
      await api.put('/auth/change-password', {
        oldPassword: passwords.oldPassword, newPassword: passwords.newPassword
      });
      showToast(t('prof_pw_success'));
      setPasswords({ oldPassword: '', newPassword: '', confirmPassword: '' });
      setIsPasswordModalOpen(false);
    } catch (err) {
      showToast(err.response?.data?.message || t('error'), 'error');
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('profile_image', file);

    try {
      const res = await api.put('/auth/profile-image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setProfile(prev => ({ ...prev, profile_image: res.data.profile_image }));
      showToast(t('prof_success'));
      const localUser = JSON.parse(localStorage.getItem('user') || '{}');
      localUser.profile_image = res.data.profile_image;
      localStorage.setItem('user', JSON.stringify(localUser));
      window.dispatchEvent(new Event('profileUpdated'));
    } catch (err) {
      showToast(t('error'), 'error');
    }
  };

  if (loading) return <div className="profile-container" style={{ marginTop: '120px' }}>{t('loading')}...</div>;

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#F9FAFB', p: { xs: 2, md: 5 }, pt: { xs: 12, md: 15 }, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <Box sx={{ width: '100%', maxWidth: '800px', mb: 4, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <Typography variant="h4" fontWeight="1000" sx={{ color: '#111827' }}>
          {t('prof_title')}
        </Typography>
      </Box>

      <Paper elevation={0} sx={{
        width: '100%',
        maxWidth: '800px',
        backgroundColor: '#fff',
        borderRadius: '32px',
        p: { xs: 3, md: 6 },
        boxShadow: '0 20px 25px -5px rgba(0,0,0,0.05), 0 10px 10px -5px rgba(0,0,0,0.02)',
        border: '1px solid #E5E7EB',
        position: 'relative'
      }}>
        {/* Avatar Section */}
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, alignItems: 'center', gap: 4, mb: 5 }}>
          <Box sx={{ position: 'relative', cursor: 'pointer' }} onClick={() => fileInputRef.current.click()}>
            <Avatar
              src={profile.profile_image ? `http://localhost:5000${profile.profile_image}` : null}
              sx={{ width: 140, height: 140, border: '4px solid #F3F4F6', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontSize: '3.5rem', fontWeight: 'bold' }}
            >
              {profile.username?.charAt(0).toUpperCase()}
            </Avatar>
            <Box sx={{ position: 'absolute', bottom: 5, right: 5, bgcolor: '#007aff', color: '#fff', width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '3px solid #fff', boxShadow: '0 4px 8px rgba(0,0,0,0.15)' }}>
              <i className='bx bxs-camera' style={{ fontSize: '1.2rem' }}></i>
            </Box>
          </Box>
          <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept="image/*" onChange={handleImageUpload} />
          
          <Box sx={{ textAlign: { xs: 'center', md: 'left' } }}>
            <Typography variant="h3" fontWeight="900" sx={{ color: '#111827', mb: 1 }}>{profile.full_name || profile.username}</Typography>
            <Typography variant="h6" sx={{ color: '#6B7280', mb: 2 }}>@{profile.username}</Typography>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: { xs: 'center', md: 'flex-start' } }}>
              <Button variant="outlined" size="small" onClick={() => setIsEditProfileModalOpen(true)} sx={{ borderRadius: '12px', textTransform: 'none', fontWeight: 'bold', borderColor: '#E5E7EB', color: '#111827', '&:hover': { bgcolor: '#F9FAFB', borderColor: '#D1D5DB' } }}>
                {t('prof_edit_profile') || 'Edit Profile'}
              </Button>
              <Button variant="contained" size="small" onClick={() => setIsPasswordModalOpen(true)} sx={{ borderRadius: '12px', textTransform: 'none', fontWeight: 'bold', bgcolor: '#3B82F6', color: '#fff', '&:hover': { bgcolor: '#2563EB' }, boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.3)' }}>
                {t('prof_change_pw') || 'Change Password'}
              </Button>
            </Box>
          </Box>
        </Box>

        <Divider sx={{ my: 4, borderColor: '#F3F4F6', borderWidth: '1px' }} />

        {/* Info Grid */}
        <Grid container spacing={4} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Typography sx={{ color: '#9CA3AF', fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px' }}>
                {t('email') || 'Email'}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Typography sx={{ color: '#1F2937', fontSize: '1.1rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: 1.5, wordBreak: 'break-all' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                  {profile.email || t('prof_no_email')}
                </Typography>
              </Box>
            </Box>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Typography sx={{ color: '#9CA3AF', fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px' }}>
                {t('phone') || 'Phone'}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Typography sx={{ color: '#1F2937', fontSize: '1.1rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                  {profile.phone || '-'}
                </Typography>
              </Box>
            </Box>
          </Grid>
        </Grid>

        {/* Shipping Address at the bottom */}
        <Box sx={{ width: '100%' }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, p: 3, bgcolor: '#F8FAFC', borderRadius: '20px', border: '1px solid #E2E8F0' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography sx={{ color: '#9CA3AF', fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  {t('prof_shipping_addr')}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button size="small" variant="contained" onClick={() => {
                    setEditAddress(profile || {});
                    if (profile?.latitude && profile?.longitude) {
                      setMapCoords([parseFloat(profile.latitude), parseFloat(profile.longitude)]);
                      setTargetCoords([parseFloat(profile.latitude), parseFloat(profile.longitude)]);
                    }
                    setHasMovedManually(false);
                    lastSearchQuery.current = [profile?.district, profile?.province].filter(Boolean).join(', ');
                    setIsAddressModalOpen(true);
                  }} sx={{ borderRadius: '10px', textTransform: 'none', bgcolor: '#111827', color: '#fff', '&:hover': { bgcolor: '#374151' } }}>
                    {profile.full_name ? t('prof_edit_address') : t('prof_add_address')}
                  </Button>
                  {profile.full_name && (
                    <Button size="small" color="error" variant="outlined" onClick={handleDeleteAddress} sx={{ borderRadius: '10px', textTransform: 'none' }}>
                      {t('prof_delete_address')}
                    </Button>
                  )}
                </Box>
              </Box>

              {profile.full_name ? (
                <Box>
                  <Typography sx={{ fontWeight: '800', fontSize: '1.1rem', color: '#1F2937', mb: 0.5 }}>{profile.full_name}</Typography>
                  <Typography sx={{ color: '#4B5563', lineHeight: '1.6', fontSize: '1rem' }}>
                    {profile.address}<br />
                    {profile.sub_district}, {profile.district}<br />
                    {profile.province}, {profile.postal_code}
                  </Typography>

                  {profile.latitude && profile.longitude && (
                    <Box sx={{ mt: 3, height: '200px', borderRadius: '16px', overflow: 'hidden', border: '1px solid #E5E7EB', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                      <MapContainer center={[profile.latitude, profile.longitude]} zoom={15} style={{ height: '100%' }} zoomControl={false} dragging={false} touchZoom={false} scrollWheelZoom={false} doubleClickZoom={false}>
                        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                        <Marker position={[profile.latitude, profile.longitude]} />
                      </MapContainer>
                    </Box>
                  )}
                </Box>
              ) : (
                <Typography sx={{ color: '#9CA3AF', fontSize: '0.9rem', fontStyle: 'italic', py: 2 }}>
                  {t('prof_no_address')}
                </Typography>
              )}
            </Box>
        </Box>
      </Paper>

      {isPasswordModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button className="modal-close" onClick={() => setIsPasswordModalOpen(false)}>&times;</button>
            <div className="modal-header"><h3>{t('prof_change_pw')}</h3></div>
            <form onSubmit={handleChangePassword}>
              <div className="form-group">
                <label>{t('prof_old_pw')}</label>
                <div className="password-input-wrapper">
                  <input
                    type={showOldPassword ? "text" : "password"}
                    value={passwords.oldPassword}
                    onChange={(e) => setPasswords({ ...passwords, oldPassword: e.target.value })}
                    required
                  />
                  <i
                    className={`bx ${showOldPassword ? 'bx-hide' : 'bx-show'} password-toggle`}
                    onClick={() => setShowOldPassword(!showOldPassword)}
                  ></i>
                </div>
              </div>
              <div className="form-group">
                <label>{t('prof_new_pw')}</label>
                <div className="password-input-wrapper">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    value={passwords.newPassword}
                    onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                    required
                  />
                  <i
                    className={`bx ${showNewPassword ? 'bx-hide' : 'bx-show'} password-toggle`}
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  ></i>
                </div>
              </div>
              <div className="form-group">
                <label>{t('prof_confirm_pw')}</label>
                <div className="password-input-wrapper">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={passwords.confirmPassword}
                    onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                    required
                  />
                  <i
                    className={`bx ${showConfirmPassword ? 'bx-hide' : 'bx-show'} password-toggle`}
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  ></i>
                </div>
              </div>
              <button type="submit" className="save-btn">{t('prof_confirm_change_pw')}</button>
            </form>
          </div>
        </div>
      )}

      {isEditProfileModalOpen && (
        <div className="modal-overlay" style={{ zIndex: 3000, background: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-content" style={{ maxWidth: '400px', borderRadius: '16px', padding: '30px' }}>
            <button 
              className="modal-close" 
              onClick={() => setIsEditProfileModalOpen(false)}
              style={{ position: 'absolute', top: '15px', right: '15px', background: '#F3F4F6', color: '#111827', width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
            >
              &times;
            </button>
            <div className="modal-header" style={{ marginBottom: '24px', textAlign: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 'bold', color: '#000' }}>{t('prof_account_info') || 'Account Information'}</h3>
            </div>
            <div className="address-form-body" style={{ padding: 0 }}>
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#4B5563', marginBottom: '6px', fontWeight: '600' }}>{t('email') || 'Email'}</label>
                <input type="email" value={editAddress.email || ''} onChange={(e) => setEditAddress({ ...editAddress, email: e.target.value })} style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #E5E7EB', outline: 'none', fontSize: '1rem', color: '#111827' }} />
              </div>
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#4B5563', marginBottom: '6px', fontWeight: '600' }}>{t('full_name') || 'Full Name'}</label>
                <input type="text" value={editAddress.full_name || ''} onChange={(e) => setEditAddress({ ...editAddress, full_name: e.target.value })} style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #E5E7EB', outline: 'none', fontSize: '1rem', color: '#111827' }} />
              </div>
              <div className="form-group" style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#4B5563', marginBottom: '6px', fontWeight: '600' }}>{t('phone') || 'Phone'}</label>
                <input type="text" value={editAddress.phone || ''} onChange={(e) => setEditAddress({ ...editAddress, phone: e.target.value })} style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #E5E7EB', outline: 'none', fontSize: '1rem', color: '#111827' }} />
              </div>
              <button 
                type="button" 
                onClick={handleUpdateProfile} 
                style={{ width: '100%', background: '#111827', color: '#fff', border: 'none', borderRadius: '8px', padding: '12px', fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer' }}
              >
                {t('save') || 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {isAddressModalOpen && (
        <div className="modal-overlay">
          <div className="address-modal-content">
            <div className="address-modal-header">
              <button 
                className="back-btn" 
                onClick={() => setIsAddressModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1e293b', padding: '8px', borderRadius: '8px', transition: 'background 0.2s' }}
                onMouseOver={(e) => e.currentTarget.style.background = '#f1f5f9'}
                onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 12H5M12 19l-7-7 7-7" />
                </svg>
              </button>
              <h3 style={{ margin: 0 }}>{t('prof_edit_address_title')}</h3>
            </div>
            <div className="address-form-body">
              <div className="address-group-card">
                <h4>{t('prof_shipping_contact') || 'Recipient Information'}</h4>
                <div className="form-group"><label>{t('full_name')}</label><input type="text" value={editAddress.full_name || ''} onChange={(e) => setEditAddress({ ...editAddress, full_name: e.target.value })} /></div>
                <div className="form-group"><label>{t('phone')}</label><input type="text" value={editAddress.phone || ''} onChange={(e) => setEditAddress({ ...editAddress, phone: e.target.value })} /></div>
              </div>
              <div className="address-group-card">
                <div className="form-group">
                  <label>{t('prof_addr_detail')}</label>
                  <input type="text" value={editAddress.address || ''} onChange={(e) => setEditAddress({ ...editAddress, address: e.target.value })} placeholder={t('prof_addr_ph')} style={{ marginBottom: '1rem' }} />
                  <input type="text" value={editAddress.sub_district || ''} onChange={(e) => setEditAddress({ ...editAddress, sub_district: e.target.value })} placeholder={t('prof_sub_district')} />
                </div>
              </div>
              <div className="address-group-card">
                <div className="form-group">
                  <label>{t('prof_location_label')}</label>
                  <input type="text" value={editAddress.district || ''} onChange={(e) => { setEditAddress({ ...editAddress, district: e.target.value }); setHasMovedManually(false); }} placeholder={t('prof_district')} style={{ marginBottom: '0.5rem' }} />
                  <input type="text" value={editAddress.province || ''} onChange={(e) => { setEditAddress({ ...editAddress, province: e.target.value }); setHasMovedManually(false); }} placeholder={t('prof_province')} style={{ marginBottom: '0.5rem' }} />
                  <input type="text" value={editAddress.postal_code || ''} onChange={(e) => setEditAddress({ ...editAddress, postal_code: e.target.value })} placeholder={t('postal_code')} />
                </div>
              </div>
              <div className="address-group-card">
                <h4>{t('prof_map_pos')}</h4>
                <div 
                  className="map-container-wrapper" 
                  style={{ height: '250px', position: 'relative', borderRadius: '16px', overflow: 'hidden', border: '1px solid #e2e8f0', cursor: 'pointer', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}
                  onClick={() => setIsFullMapOpen(true)}
                  title={t('prof_map_expand_hint')}
                >
                  <div style={{ pointerEvents: 'none', height: '100%', width: '100%' }}>
                    <MapContainer center={mapCoords} zoom={13} style={{ height: '100%' }} zoomControl={false} scrollWheelZoom={false} dragging={false} doubleClickZoom={false}>
                      <MapController targetCoords={targetCoords} zoom={13} />
                      <MapLogic coords={mapCoords} setCoords={setMapCoords} onManualMove={() => setHasMovedManually(true)} />
                    </MapContainer>
                  </div>
                  <div style={{ position: 'absolute', bottom: '15px', right: '15px', zIndex: 1000, background: 'rgba(255,255,255,0.95)', padding: '8px 16px', borderRadius: '10px', fontSize: '0.85rem', fontWeight: 'bold', color: '#2563EB', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', border: '1px solid #BFDBFE' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>
                    {t('prof_map_expand')}
                  </div>
                </div>
                <div className="address-toggle-group"><span>{t('prof_set_default')}</span><label className="switch"><input type="checkbox" defaultChecked /><span className="slider"></span></label></div>
              </div>
              <div className="address-footer-btns">
                <button className="cancel-btn" onClick={() => setIsAddressModalOpen(false)}>{t('cancel')}</button>
                <button className="submit-address-btn" onClick={handleUpdateProfile}>{t('save')}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isFullMapOpen && (
        <div className="modal-overlay" style={{ zIndex: 2000 }} onClick={() => setIsFullMapOpen(false)}>
          <div className="address-modal-content" style={{ width: '90%', height: '90vh', maxWidth: 'none', display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }} onClick={(e) => e.stopPropagation()}>
            <div className="address-modal-header" style={{ flexShrink: 0, padding: '1.5rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#1e293b' }}>
                {t('prof_map_title')} ({t('prof_coords')}: {mapCoords[0].toFixed(6)}, {mapCoords[1].toFixed(6)})
              </h3>
              <button 
                onClick={() => setIsFullMapOpen(false)} 
                style={{ background: '#f1f5f9', border: 'none', width: '36px', height: '36px', borderRadius: '50%', fontSize: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748b', transition: 'all 0.2s', padding: 0 }}
                onMouseOver={(e) => { e.currentTarget.style.background = '#e2e8f0'; e.currentTarget.style.color = '#0f172a'; }}
                onMouseOut={(e) => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = '#64748b'; }}
              >
                &times;
              </button>
            </div>
            <div style={{ flexGrow: 1, padding: 0, height: '100%', position: 'relative' }}>
              <MapContainer center={mapCoords} zoom={16} style={{ height: '100%', width: '100%' }} scrollWheelZoom={true}>
                <MapController targetCoords={targetCoords} zoom={16} />
                <MapLogic coords={mapCoords} setCoords={setMapCoords} onManualMove={() => setHasMovedManually(true)} />
              </MapContainer>
            </div>
            <div style={{ padding: '1.25rem', borderTop: '1px solid #e2e8f0', background: '#f8fafc', display: 'flex', justifyContent: 'center', flexShrink: 0 }}>
              <button
                className="submit-address-btn"
                style={{ margin: 0, padding: '0.8rem 2rem', fontSize: '1.1rem', borderRadius: '12px', minWidth: '250px', background: '#2563EB', boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.2)' }}
                onClick={() => {
                  setTargetCoords([...mapCoords]);
                  setIsFullMapOpen(false);
                }}
              >
                {t('prof_confirm_pos')}
              </button>
            </div>
          </div>
        </div>
      )}
    </Box>
  );
};

export default Profile;
