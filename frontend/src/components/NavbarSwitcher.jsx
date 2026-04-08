// code in this file is written by worapol สุดหล่อ
import React, { useContext } from 'react';
import { useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import UserNavbar from './UserNavbar';
import AdminNavbar from './AdminNavbar';

const NavbarSwitcher = () => {
  const { user } = useContext(AuthContext);
  const location = useLocation();

  if (['/login', '/register'].includes(location.pathname)) {
    return null;
  }

  // Hide navbar entirely on all superadmin routes to make it clean and focused - by worapol สุดหล่อ
  if (location.pathname.startsWith('/superadmin')) {
    return null;
  }

  // Admin navbar only for admin routes - by worapol สุดหล่อ
  if (location.pathname.startsWith('/admin') || location.pathname.startsWith('/superadmin')) {
    if (user && (user.role === 'admin' || user.role === 'superadmin')) {
      return <AdminNavbar />;
    }
    return null;
  }

  return <UserNavbar />;
};

export default NavbarSwitcher;
