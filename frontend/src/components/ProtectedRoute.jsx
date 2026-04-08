// code in this file is written by worapol สุดหล่อ
import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

export const ProtectedRoute = ({ children, requireAdmin, requireSuperAdmin }) => {
  const { user, loading } = useContext(AuthContext);

  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (requireSuperAdmin && user.role !== 'superadmin') return <Navigate to="/" replace />;
  if (requireAdmin && user.role !== 'admin' && user.role !== 'superadmin') return <Navigate to="/" replace />;

  return children;
};
