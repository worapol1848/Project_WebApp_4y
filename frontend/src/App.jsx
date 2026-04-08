// code in this file is written by worapol สุดหล่อ
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ProtectedRoute } from './components/ProtectedRoute';

import { LanguageProvider } from './context/LanguageContext';
import NavbarSwitcher from './components/NavbarSwitcher';
import FooterSwitcher from './components/FooterSwitcher';
import ScrollToTop from './components/ScrollToTop';
import Home from './pages/user/Home';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminProducts from './pages/admin/AdminProducts';
import AdminOrders from './pages/admin/AdminOrders';
import MyOrders from './pages/user/MyOrders';
import ProductDetail from './pages/user/ProductDetail';
import AdminProductDetail from './pages/admin/AdminProductDetail';
import AuthPage from './pages/user/AuthPage';
import Profile from './pages/user/Profile';
import Cart from './pages/user/Cart';
import Wishlist from './pages/user/Wishlist';
import Payment from './pages/user/Payment';
import Products from './pages/user/Products';
import AdminRevenue from './pages/admin/AdminRevenue';
import AdminBestSellers from './pages/admin/AdminBestSellers';
import AdminLogs from './pages/admin/AdminLogs';
import AdminInventory from './pages/admin/AdminInventory';
import FaceScanner from './pages/admin/FaceScanner';
import SuperAdminManage from './pages/admin/SuperAdminManage';

// A special protector for user-facing routes - by worapol สุดหล่อ
const UserRoute = ({ children }) => {
  const { user, loading } = React.useContext(AuthContext);
  if (loading) return null;
  
  // If a regular admin tries to access user pages, send them back to the admin dashboard - by worapol สุดหล่อ
  if (user && user.role === 'admin') {
    return <Navigate to="/admin" replace />;
  }
  
  // Users and Super Admins (and Guests) can view user pages - by worapol สุดหล่อ
  return children;
};

function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <ToastProvider>
          <Router>
            <ScrollToTop />
            <div className="app-container">
              <NavbarSwitcher />
              <Routes>
                <Route path="/login" element={<AuthPage />} />
                <Route path="/register" element={<AuthPage />} />

                {/* User Routes - Protected from regular admins */}
                <Route path="/" element={<UserRoute><Home /></UserRoute>} />
                <Route path="/products" element={<UserRoute><Products /></UserRoute>} />
                <Route path="/product/:id" element={<UserRoute><ProductDetail /></UserRoute>} />
                
                <Route path="/profile" element={
                  <ProtectedRoute><UserRoute><Profile /></UserRoute></ProtectedRoute>
                } />
                <Route path="/cart" element={
                  <ProtectedRoute><UserRoute><Cart /></UserRoute></ProtectedRoute>
                } />
                <Route path="/wishlist" element={
                  <ProtectedRoute><UserRoute><Wishlist /></UserRoute></ProtectedRoute>
                } />
                <Route path="/payment" element={
                  <ProtectedRoute><UserRoute><Payment /></UserRoute></ProtectedRoute>
                } />
                <Route path="/myorders" element={
                  <ProtectedRoute><UserRoute><MyOrders /></UserRoute></ProtectedRoute>
                } />

                {/* Admin Routes */}
                <Route path="/admin" element={
                  <ProtectedRoute requireAdmin={true}><AdminDashboard /></ProtectedRoute>
                } />
                <Route path="/admin/dashboard" element={
                  <ProtectedRoute requireAdmin={true}><AdminDashboard /></ProtectedRoute>
                } />
                <Route path="/admin/products" element={
                  <ProtectedRoute requireAdmin={true}><AdminProducts /></ProtectedRoute>
                } />
                <Route path="/admin/inventory" element={
                  <ProtectedRoute requireAdmin={true}><AdminInventory /></ProtectedRoute>
                } />
                <Route path="/admin/orders" element={
                  <ProtectedRoute requireAdmin={true}><AdminOrders /></ProtectedRoute>
                } />
                <Route path="/admin/revenue" element={
                  <ProtectedRoute requireAdmin={true}><AdminRevenue /></ProtectedRoute>
                } />
                <Route path="/admin/bestsellers" element={
                  <ProtectedRoute requireAdmin={true}><AdminBestSellers /></ProtectedRoute>
                } />
                <Route path="/admin/logs" element={
                  <ProtectedRoute requireSuperAdmin={true}><AdminLogs /></ProtectedRoute>
                } />
                <Route path="/admin/product/:id" element={
                  <ProtectedRoute requireAdmin={true}><AdminProductDetail /></ProtectedRoute>
                } />
                <Route path="/superadmin/face-scan/:userId?" element={
                  <ProtectedRoute requireSuperAdmin={true}><FaceScanner /></ProtectedRoute>
                } />
                <Route path="/superadmin/manage" element={
                  <ProtectedRoute requireSuperAdmin={true}><SuperAdminManage /></ProtectedRoute>
                } />
              </Routes>
              <FooterSwitcher />
            </div>
          </Router>
        </ToastProvider>
      </LanguageProvider>
    </AuthProvider>
  );
}

export default App;
