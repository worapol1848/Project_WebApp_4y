// code in this file is written by worapol สุดหล่อ
import React from 'react';
import { useLocation } from 'react-router-dom';
import UserFooter from './UserFooter';

const FooterSwitcher = () => {
  const location = useLocation();

  // Hide footer on Auth pages - by worapol สุดหล่อ
  if (['/login', '/register'].includes(location.pathname)) {
    return null;
  }

  // Hide footer on Admin / SuperAdmin routes - by worapol สุดหล่อ
  if (location.pathname.startsWith('/admin') || location.pathname.startsWith('/superadmin')) {
    return null;
  }

  return <UserFooter />;
};

export default FooterSwitcher;
