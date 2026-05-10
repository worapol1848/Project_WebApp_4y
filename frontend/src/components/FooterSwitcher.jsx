import React from 'react';
import { useLocation } from 'react-router-dom';
import UserFooter from './UserFooter';

const FooterSwitcher = () => {
  const location = useLocation();

  
  if (['/login', '/register'].includes(location.pathname)) {
    return null;
  }

  
  if (location.pathname.startsWith('/admin') || location.pathname.startsWith('/superadmin')) {
    return null;
  }

  return <UserFooter />;
};

export default FooterSwitcher;
