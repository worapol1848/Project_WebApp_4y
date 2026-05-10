import React, { useContext } from 'react';
import { useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import UserNavbar from './UserNavbar';
import AdminNavbar from './AdminNavbar';

const NavbarSwitcher = () => {
  const { user } = useContext(AuthContext);
  const location = useLocation();

  if (['/login', '/register'].includes(location.pathname) || location.pathname.includes('/face-scan')) {
    return null;
  }

  
  if ((location.pathname.startsWith('/admin') || location.pathname.startsWith('/superadmin')) && !location.pathname.includes('/face-scan')) {
    if (user && (user.role === 'admin' || user.role === 'superadmin')) {
      return <AdminNavbar />;
    }
    return null;
  }

  return <UserNavbar />;
};

export default NavbarSwitcher;
