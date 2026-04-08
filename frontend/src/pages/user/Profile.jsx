// code in this file is written by worapol สุดหล่อ
import React, { useState, useEffect, useContext, useRef } from 'react';
import api from '../../services/api';
import { AuthContext } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useLanguage } from '../../context/LanguageContext';
import './Profile.css';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for Leaflet default icon issues in React - by worapol สุดหล่อ
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
let DefaultIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// Component to handle map movement programmatically (e.g., searching) - by worapol สุดหล่อ
const MapController = ({ targetCoords, zoom }) => {
  const map = useMap();
  useEffect(() => {
    if (targetCoords) {
      map.setView(targetCoords, zoom);
      // Ensure Leaflet recalculates size if container was hidden/resized - by worapol สุดหล่อ
      setTimeout(() => map.invalidateSize(), 100);
    }
  }, [targetCoords, map, zoom]);
  return null;
};

// Main Map Logic Component - by worapol สุดหล่อ
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
    address: '', sub_district: '', district: '', province: '', postal_code: ''
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
  const [isFullMapOpen, setIsFullMapOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [hasMovedManually, setHasMovedManually] = useState(false);

  // Core Map State - by worapol สุดหล่อ
  const [mapCoords, setMapCoords] = useState([13.7367, 100.5231]);
  const searchTimeout = useRef(null);

  // State for editing address in modal - by worapol สุดหล่อ
  const [editAddress, setEditAddress] = useState({});

  // Target for MapController (only changes when we WANT map to jump) - by worapol สุดหล่อ
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
        setTargetCoords(newCoords); // Only jump map for search results - by worapol สุดหล่อ
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
        // Set initial lastSearchQuery so it doesn't warp immediately - by worapol สุดหล่อ
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
      // Save map coordinates along with address - by worapol สุดหล่อ
      const finalAddress = {
        ...editAddress,
        latitude: mapCoords[0],
        longitude: mapCoords[1]
      };
      await api.put('/auth/profile', finalAddress);
      await fetchProfile(); // Refresh from server to be 100% sure - by worapol สุดหล่อ
      showToast(t('prof_address_success'));
      setIsAddressModalOpen(false);
    } catch (err) {
      showToast(t('error'), 'error');
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

  if (loading) return <div className="profile-container" style={{ marginTop: '120px' }}>{t('loading')}...</div>;

  return (
    <div className="profile-container">
      <h2>{t('prof_title')}</h2>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2.5rem' }}>
        <div style={{ background: '#e0f0ff', padding: '1.5rem', borderRadius: '50%', boxShadow: '0 8px 25px rgba(0,122,255,0.15)' }}>
          <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="#007aff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
          </svg>
        </div>
      </div>
      <div className="profile-section">
        <h3>{t('prof_account_info')}</h3>
        <div className="form-group"><label>{t('username')}</label><div className="read-only-text">{profile.username}</div></div>
        <div className="form-group"><label>{t('email')}</label><div className="read-only-text">{profile.email || t('prof_no_email')}</div></div>
        <div className="form-group" style={{ marginTop: '1rem' }}>
          <button type="button" className="password-change-link" onClick={() => setIsPasswordModalOpen(true)}>{t('prof_change_pw')}</button>
        </div>
      </div>

      <div className="profile-section">
        <h3>{t('prof_shipping_addr')}</h3>
        {profile.full_name ? (
          <div className="address-display-card" style={{ background: '#f9f9f9', padding: '1.5rem', borderRadius: '12px', border: '1px solid #eee' }}>
            <p style={{ fontWeight: '600', marginBottom: '0.5rem', fontSize: '1.1rem' }}>{profile.full_name}</p>
            <p style={{ color: '#666', marginBottom: '1rem' }}>{profile.phone}</p>
            <p style={{ fontSize: '0.95rem', color: '#444', lineHeight: '1.6' }}>
              {profile.address}<br />
              {profile.sub_district}, {profile.district}<br />
              {profile.province}, {profile.postal_code}
            </p>

            {profile.latitude && profile.longitude && (
              <div className="profile-map-preview" style={{ marginTop: '1.5rem', height: '200px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #ddd' }}>
                <MapContainer
                  center={[profile.latitude, profile.longitude]}
                  zoom={15}
                  style={{ height: '100%' }}
                  zoomControl={false}
                  dragging={false}
                  touchZoom={false}
                  scrollWheelZoom={false}
                  doubleClickZoom={false}
                >
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <Marker position={[profile.latitude, profile.longitude]} />
                </MapContainer>
              </div>
            )}
          </div>
        ) : <p style={{ color: '#999', fontSize: '0.9rem' }}>{t('prof_no_address')}</p>}
        <button type="button" className="save-btn" style={{ background: '#fff', color: '#000', border: '1px solid #28a745', marginTop: '1rem', fontWeight: '500' }}
          onClick={() => {
            setEditAddress(profile || {});
            if (profile?.latitude && profile?.longitude) {
              setMapCoords([parseFloat(profile.latitude), parseFloat(profile.longitude)]);
              setTargetCoords([parseFloat(profile.latitude), parseFloat(profile.longitude)]);
            }
            setHasMovedManually(false);
            lastSearchQuery.current = [profile?.district, profile?.province].filter(Boolean).join(', ');
            setIsAddressModalOpen(true);
          }}>
          {profile.full_name ? t('prof_edit_address') : t('prof_add_address')}
        </button>
      </div>

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
                <h4>{t('prof_shipping_addr')}</h4>
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
    </div>
  );
};

export default Profile;
