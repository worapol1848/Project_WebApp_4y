import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { useLanguage } from '../../context/LanguageContext';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './AdminDashboard.css';
import './AdminOrders.css';


import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

const AdminOrders = () => {
  const { t } = useLanguage();
  const { showToast } = useToast();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [orderToShip, setOrderToShip] = useState(null);
  const [isDeliverModalOpen, setIsDeliverModalOpen] = useState(false);
  const [orderToDeliver, setOrderToDeliver] = useState(null);
  const [isRefundConfirmOpen, setIsRefundConfirmOpen] = useState(false);
  const [orderToRefund, setOrderToRefund] = useState(null);
  const [isFullMapOpen, setIsFullMapOpen] = useState(false);
  const [refundSlip, setRefundSlip] = useState(null);
  const [isRefunding, setIsRefunding] = useState(false);

  
  const [slipFilter, setSlipFilter] = useState('all'); 
  const [statusFilter, setStatusFilter] = useState('all');

  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    setCurrentPage(1);
  }, [slipFilter, statusFilter]);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await api.get('/orders');
      setOrders(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleShipOrder = async (orderId) => {
    try {
      await api.put(`/orders/${orderId}/ship`);
      showToast(t('adm_order_shipped') || 'Order marked as shipped', 'success');
      setIsConfirmModalOpen(false);
      setOrderToShip(null);
      fetchOrders();
      if (selectedOrder && selectedOrder.id === orderId) {
        handleViewDetails(orderId);
      }
    } catch (err) {
      showToast(err.response?.data?.message || t('adm_order_update_failed') || 'Failed to update order', 'error');
    }
  };

  const openShipConfirm = (e, id) => {
    if (e && e.stopPropagation) e.stopPropagation();
    setOrderToShip(id);
    setIsConfirmModalOpen(true);
  };

  const handleDeliverOrder = async (orderId) => {
    try {
      await api.put(`/orders/${orderId}/deliver-admin`);
      showToast(t('adm_order_arrived'), 'success');
      setIsDeliverModalOpen(false);
      setOrderToDeliver(null);
      fetchOrders();
      if (selectedOrder && selectedOrder.id === orderId) {
        handleViewDetails(orderId);
      }
    } catch (err) {
      showToast(err.response?.data?.message || t('adm_order_update_failed') || 'Failed to update order', 'error');
    }
  };

  const openDeliverConfirm = (e, id) => {
    if (e && e.stopPropagation) e.stopPropagation();
    setOrderToDeliver(id);
    setIsDeliverModalOpen(true);
  };

  const handleViewDetails = async (id) => {
    try {
      const res = await api.get(`/orders/${id}`);
      setSelectedOrder(res.data);
    } catch (err) {
      showToast(err.response?.data?.message || t('adm_order_fetch_failed') || 'Failed to fetch order details', 'error');
    }
  };

  const closeDetailsModal = () => {
    setSelectedOrder(null);
  };

  const handleCancelClick = (e, id) => {
    if (e && e.stopPropagation) e.stopPropagation();
    
    const orderId = id || e;
    setOrderToCancel(orderId);
    setCancelReason('');
    setIsCancelModalOpen(true);
  };

  const handleConfirmCancel = async () => {
    try {
      await api.put(`/orders/${orderToCancel}/cancel`, { cancel_reason: cancelReason });
      showToast(t('adm_order_cancelled') || 'Order cancelled successfully', 'success');
      setIsCancelModalOpen(false);
      setOrderToCancel(null);
      fetchOrders();
      if (selectedOrder && selectedOrder.id === orderToCancel) {
        handleViewDetails(orderToCancel);
      }
    } catch (err) {
      showToast(err.response?.data?.message || t('adm_order_update_failed') || 'Failed to cancel order', 'error');
    }
  };

  const handleToggleVerifySlip = async (e, id, currentStatus) => {
    if (e && e.stopPropagation) e.stopPropagation();
    try {
      const newStatus = !currentStatus;
      await api.put(`/orders/${id}/verify-slip`, { verified: newStatus });
      showToast(newStatus ? (t('adm_slip_verified') || 'ตรวจสลิปเรียบร้อยแล้ว') : (t('adm_slip_unverified') || 'ยกเลิกการตรวจสลิป'), 'success');
      fetchOrders();
    } catch (err) {
      showToast(err.response?.data?.message || t('adm_slip_update_failed') || 'ไม่สามารถอัปเดตสถานะสลิปได้', 'error');
    }
  };

  const handleRefundOrder = async (orderId) => {
    if (isRefunding) return;
    setIsRefunding(true);
    try {
      const formData = new FormData();
      if (refundSlip) {
        formData.append('refund_slip', refundSlip);
      }

      await api.put(`/orders/${orderId}/refund-complete`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      showToast(t('adm_order_refunded') || 'Order marked as Refunded', 'success');
      setIsRefundConfirmOpen(false);
      setOrderToRefund(null);
      setRefundSlip(null);
      fetchOrders();
      if (selectedOrder && selectedOrder.id === orderId) {
        handleViewDetails(orderId);
      }
    } catch (err) {
      showToast(err.response?.data?.message || t('adm_order_update_failed') || 'Failed to update order', 'error');
    } finally {
      setIsRefunding(false);
    }
  };

  const openRefundConfirm = (e, id) => {
    if (e && e.stopPropagation) e.stopPropagation();
    setOrderToRefund(id);
    setRefundSlip(null);
    setIsRefundConfirmOpen(true);
  };

  
  const indexOfLastOrder = currentPage * itemsPerPage;
  const indexOfFirstOrder = indexOfLastOrder - itemsPerPage;

  const paginate = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const getPageNumbers = () => {
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPagesCount, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    const pages = [];
    for (let i = startPage; i <= endPage; i++) {
      if (i > 0) pages.push(i);
    }
    return pages;
  };




  const filteredOrders = orders.filter(order => {
    const matchSlip = slipFilter === 'all' ||
      (slipFilter === 'verified' && order.slip_verified) ||
      (slipFilter === 'pending' && !order.slip_verified);

    const matchStatus = statusFilter === 'all' || order.status === statusFilter;

    return matchSlip && matchStatus;
  });

  const currentOrders = filteredOrders.slice(indexOfFirstOrder, indexOfLastOrder);
  const totalPagesCount = Math.ceil(filteredOrders.length / itemsPerPage);

  if (loading) return <div>Loading Orders...</div>;

  return (
    <div className="admin-orders-container">
      <h2>{t('adm_manage_orders') || 'Manage Customer Orders'}</h2>

      <div className="order-filters-container">
        <div className="filter-header-row">
          <div className="status-legend-premium">
            <div className="legend-item">
              <span className="legend-icon pending">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
              </span>
              {t('adm_pending') || 'Pending'}
            </div>
            <div className="legend-item">
              <span className="legend-icon shipped"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><rect x="1" y="3" width="15" height="13" /><polyline points="16 8 20 8 23 11 23 16 16 16 16 8" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" /></svg></span>
              {t('adm_shipped') || 'Shipped'}
            </div>
            <div className="legend-item">
              <span className="legend-icon arrived"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg></span>
              {t('adm_arrived') || 'Arrived'}
            </div>
            <div className="legend-item">
              <span className="legend-icon delivered"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg></span>
              {t('adm_completed') || 'Completed'}
            </div>
            <div className="legend-item">
              <span className="legend-icon cancelled"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg></span>
              {t('adm_cancelled') || 'Cancelled'}
            </div>
            <div className="legend-item">
              <span className="legend-icon refunded">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><path d="M12 2L3 7V17L12 22L21 17V7L12 2Z" /><path d="M12 22V12" /><path d="M21 7L12 12L3 7" /></svg>
              </span>
              {t('adm_refunded') || 'Refunded'}
            </div>
          </div>
        </div>

        <div className="order-filters-container">
          <div className="filter-group">
            <label className="filter-label">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6366F1" strokeWidth="2.5"><path d="M12 2v20M17 5H12M12 19h5" /></svg>
              {t('adm_pay_verify') || 'Payment Verification'}
            </label>
            <div className="filter-options">
              <button className={`filter-btn-pill ${slipFilter === 'all' ? 'active' : ''}`} onClick={() => setSlipFilter('all')}>
                <span className="dot all"></span> {t('adm_all_orders') || 'All Orders'}
              </button>
              <button className={`filter-btn-pill ${slipFilter === 'pending' ? 'active' : ''}`} onClick={() => setSlipFilter('pending')}>
                <span className="dot pending"></span> {t('adm_pending_check') || 'Pending Check'}
              </button>
              <button className={`filter-btn-pill ${slipFilter === 'verified' ? 'active' : ''}`} onClick={() => setSlipFilter('verified')}>
                <span className="dot verified"></span> {t('adm_verified_only') || 'Verified Only'}
              </button>
            </div>
          </div>

          <div className="filter-line-separator"></div>

          <div className="filter-group">
            <label className="filter-label">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6366F1" strokeWidth="2.5"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" /></svg>
              {t('adm_ship_status') || 'Shipping Status'}
            </label>
            <div className="filter-options">
              <button className={`filter-btn-pill ${statusFilter === 'all' ? 'active' : ''}`} onClick={() => setStatusFilter('all')}>
                {t('adm_all_status') || 'All Status'}
              </button>
              <button className={`filter-btn-pill pending ${statusFilter === 'pending' ? 'active' : ''}`} onClick={() => setStatusFilter('pending')}>
                {t('adm_pending') || 'Pending'}
              </button>
              <button className={`filter-btn-pill shipped ${statusFilter === 'shipped' ? 'active' : ''}`} onClick={() => setStatusFilter('shipped')}>
                {t('adm_shipped') || 'Shipped'}
              </button>
              <button className={`filter-btn-pill arrived ${statusFilter === 'arrived' ? 'active' : ''}`} onClick={() => setStatusFilter('arrived')}>
                {t('adm_arrived') || 'Arrived'}
              </button>
              <button className={`filter-btn-pill delivered ${statusFilter === 'delivered' ? 'active' : ''}`} onClick={() => setStatusFilter('delivered')}>
                {t('adm_completed') || 'Completed'}
              </button>
              <button className={`filter-btn-pill cancelled ${statusFilter === 'cancelled' ? 'active' : ''}`} onClick={() => setStatusFilter('cancelled')}>
                {t('adm_cancelled') || 'Cancelled'}
              </button>
              <button className={`filter-btn-pill refunded ${statusFilter === 'refunded' ? 'active' : ''}`} style={{ borderColor: statusFilter === 'refunded' ? '#F97316' : '#eee' }} onClick={() => setStatusFilter('refunded')}>
                {t('adm_refunded') || 'Refunded'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="table-responsive">
        <table className="orders-table">
          <colgroup>
            <col style={{ width: '46px' }} />
            <col style={{ width: '130px' }} />
            <col style={{ width: '180px' }} />
            <col style={{ width: '160px' }} />
            <col style={{ width: '110px' }} />
            <col style={{ width: '140px' }} />
            <col style={{ width: '130px' }} />
            <col style={{ width: 'auto' }} />
          </colgroup>
          <thead>
            <tr>
              <th className="status-strip-th">&nbsp;</th>
              <th>{t('adm_order_id') || 'Order ID'}</th>
              <th>{t('adm_customer') || 'Customer'}</th>
              <th>{t('adm_date') || 'Date'}</th>
              <th>{t('adm_total') || 'Total'}</th>
              <th>{t('adm_status') || 'Status'}</th>
              <th>{t('adm_pay_verify') || 'Slip Check'}</th>
              <th style={{ textAlign: 'center' }}>{t('adm_table_actions') || 'Actions'}</th>
            </tr>
          </thead>
          <tbody>
            {currentOrders.length === 0 ? (
              <tr><td colSpan="8" className="text-center">{t('adm_no_orders_found') || 'No orders found matching your filters.'}</td></tr>
            ) : currentOrders.map((order, index) => {
              return (
                <tr
                  key={order.id}
                  onClick={() => handleViewDetails(order.id)}
                  style={{ cursor: 'pointer' }}
                  className={`order-row-premium status-${order.status || 'pending'}`}
                >
                  <td className={`status-strip-column ${order.status || 'pending'}`}>
                    <div className="status-icon-centered">
                      {order.status === 'pending' && <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>}
                      {order.status === 'shipped' && <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13" /><polyline points="16 8 20 8 23 11 23 16 16 16 16 8" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" /></svg>}
                      {order.status === 'arrived' && <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>}
                      {order.status === 'delivered' && <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>}
                      {order.status === 'cancelled' && <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>}
                      {order.status === 'refunded' && <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L3 7V17L12 22L21 17V7L12 2Z" /><path d="M12 22V12" /><path d="M21 7L12 12L3 7" /></svg>}
                    </div>
                  </td>
                  <td>
                    <span className="order-id-code-premium">ORD-{String(order.id).padStart(4, '0')}</span>
                  </td>
                  <td className="capitalize">
                    <div className="customer-name-premium">{order.username}</div>
                    <div className="customer-full-premium">{order.full_name || '-'}</div>
                  </td>
                  <td className="date-premium">{new Date(order.created_at).toLocaleString('th-TH')}</td>
                  <td className="total-premium">฿{Number(order.total_amount).toLocaleString()}</td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span className={`status-badge-premium badge-${order.status}`}>
                        {order.status === 'pending' ? t('adm_pending') :
                          order.status === 'shipped' ? t('adm_shipped') :
                            order.status === 'arrived' ? t('adm_arrived') :
                              order.status === 'delivered' ? t('adm_completed') :
                                order.status === 'cancelled' ? t('adm_cancelled') :
                                  order.status === 'refunded' ? t('adm_refunded') : order.status}
                      </span>
                      {order.bank_account_number && order.status === 'cancelled' && (
                        <span style={{ fontSize: '0.7rem', color: '#6366f1', fontWeight: 'bold', marginTop: '4px' }}>
                          ● {t('adm_bank_notified') || 'Bank Account Notified'}
                        </span>
                      )}
                    </div>
                  </td>
                  <td onClick={(e) => e.stopPropagation()}>
                    <div className="slip-action-container-premium">
                      {order.slip_url ? (
                        <>
                          <a
                            href={order.slip_url ? `http://localhost:5000${order.slip_url}` : '#'}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="premium-action-btn view-slip"
                            title={t('adm_slip_view_hint') || "View Slip"}
                          >
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                              <polyline points="14 2 14 8 20 8" />
                            </svg>
                          </a>
                          <button
                            className={`premium-action-btn verify-toggle ${order.slip_verified ? 'verified' : 'unverified'}`}
                            onClick={(e) => handleToggleVerifySlip(e, order.id, order.slip_verified)}
                            title={order.slip_verified ? (t('adm_verified_hint') || "Verified") : (t('adm_pending_hint') || "Pending")}
                          >
                            {order.slip_verified ? (
                              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                            ) : (
                              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="12" y1="4" x2="12" y2="13" />
                                <line x1="12" y1="19" x2="12.01" y2="19" />
                              </svg>
                            )}
                          </button>
                        </>
                      ) : (
                        <span className="no-slip-text">{t('adm_no_slip') || 'No Slip'}</span>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="premium-actions-row" onClick={(e) => e.stopPropagation()}>
                      <button className="premium-icon-btn info" onClick={() => handleViewDetails(order.id)} title={t('view_detail') || "View Details"}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
                        </svg>
                      </button>

                      {/* Show cancel button ONLY if it's pending. If shipped or later, hide it. */}
                      {order.status === 'pending' && (
                        <button className="premium-icon-btn cancel" onClick={(e) => handleCancelClick(e, order.id)} title={t('adm_cancel_order') || "Cancel Order"}>
                          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10" />
                            <line x1="15" y1="9" x2="9" y2="15" />
                            <line x1="9" y1="9" x2="15" y2="15" />
                          </svg>
                        </button>
                      )}

                      {order.status !== 'cancelled' && order.status !== 'delivered' && order.status !== 'refunded' && (
                        <>
                          {(order.status === 'pending' || !order.status) && (
                            <button className="premium-icon-btn ship" onClick={(e) => openShipConfirm(e, order.id)} title={t("adm_ship")}>
                              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="2" y="3" width="15" height="13" />
                                <path d="M17 8h4l3 3v5h-7V8z" />
                                <circle cx="7" cy="18" r="2" />
                                <circle cx="17" cy="18" r="2" />
                              </svg>
                            </button>
                          )}

                          {order.status === 'shipped' && (
                            <button className="premium-icon-btn deliver" onClick={(e) => openDeliverConfirm(e, order.id)} title={t("adm_arrive")}>
                              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                                <circle cx="12" cy="10" r="3" />
                              </svg>
                            </button>
                          )}
                        </>
                      )}

                      {order.status === 'cancelled' && order.bank_account_number && (
                        <button 
                          className="refund-confirm-btn-pill" 
                          onClick={(e) => openRefundConfirm(e, order.id)} 
                          title="ยืนยันคืนเงินสำเร็จ"
                        >
                          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" style={{ marginRight: '10px' }}>
                            <path d="M12 2L3 7V17L12 22L21 17V7L12 2Z" />
                            <path d="M12 22V12" />
                            <path d="M21 7L12 12L3 7" />
                          </svg>
                          {t('adm_confirm_refund') || "Confirm Refund"}
                        </button>
                      )}

                      {order.status === 'delivered' && (
                        <div className="order-finalized-badge success">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="5" style={{ marginRight: '6px' }}><polyline points="20 6 9 17 4 12" /></svg>
                          {t('adm_finalized') || 'Finalized'}
                        </div>
                      )}
                      
                      {(order.status === 'cancelled' || order.status === 'refunded') && (
                        <div className="order-finalized-badge danger">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="5" style={{ marginRight: '6px' }}><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                          {t('adm_cancelled') || 'Cancelled'}
                        </div>
                      )}

                      {order.status === 'refunded' && (
                        <div className="order-finalized-badge success" style={{ backgroundColor: '#FFF7ED', color: '#F97316', borderColor: '#FFEDD5' }}>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="5" style={{ marginRight: '6px' }}><polyline points="20 6 9 17 4 12" /></svg>
                          {t('adm_refund_success') || 'Refunded'}
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls - Standardized and Sliding Window */}
      {totalPagesCount > 1 && (
        <div className="pagination">
          <button
            onClick={() => paginate(currentPage - 1)}
            disabled={currentPage === 1}
            className="page-btn"
          >
            {t('adm_prev') || 'Prev'}
          </button>

          {getPageNumbers().map(pageNum => (
            <button
              key={pageNum}
              onClick={() => paginate(pageNum)}
              className={`page-btn ${currentPage === pageNum ? 'active' : ''}`}
            >
              {pageNum}
            </button>
          ))}

          <button
            onClick={() => paginate(currentPage + 1)}
            disabled={currentPage === totalPagesCount}
            className="page-btn"
          >
            {t('adm_next') || 'Next'}
          </button>

          <div className="page-jump">
            <span>{t('adm_page_label') || (useLanguage().language === 'th' ? 'หน้า:' : 'Page:')}</span>
            <select
              value={currentPage}
              onChange={(e) => paginate(Number(e.target.value))}
              className="page-select"
            >
              {[...Array(totalPagesCount)].map((_, i) => (
                <option key={i + 1} value={i + 1}>{i + 1}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-content">
            <div className="admin-modal-header">
              <h3>{t('adm_order_details') || 'Order Details'} #{selectedOrder.id}</h3>
              <button className="close-modal-btn" onClick={closeDetailsModal}>&times;</button>
            </div>
             <div className="admin-modal-body">
               <div className="order-details-grid">
                <div className="order-info-section">
                  <h4>{t('adm_cust_info') || 'Customer & Shipping Info'}</h4>
                  <div className="info-grid">
                    <div className="info-row">
                      <span className="info-label">Username:</span>
                      <span className="info-value">{selectedOrder.username}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">ชื่อ-นามสกุล:</span>
                      <span className="info-value">{selectedOrder.full_name || '-'}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">เบอร์โทรศัพท์:</span>
                      <span className="info-value">{selectedOrder.phone || '-'}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">ที่อยู่:</span>
                      <span className="info-value">
                        {`${selectedOrder.address || '-'} ${selectedOrder.sub_district || ''} ${selectedOrder.district || ''} ${selectedOrder.province || ''} ${selectedOrder.postal_code || ''}`.trim()}
                      </span>
                    </div>
                  </div>

                  {selectedOrder.latitude && selectedOrder.longitude ? (
                    <div className="admin-order-map">
                      <p><strong>{t('adm_map_pos_label') || 'Map Position'}:</strong></p>
                      <div 
                        className="mini-map-container" 
                        style={{ height: '300px', borderRadius: '16px', overflow: 'hidden', marginTop: '10px', position: 'relative', cursor: 'pointer', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}
                        onClick={() => setIsFullMapOpen(true)}
                        title="คลิกเพื่อขยายแผนที่"
                      >
                        <MapContainer
                          center={[parseFloat(selectedOrder.latitude), parseFloat(selectedOrder.longitude)]}
                          zoom={15}
                          style={{ height: '100%', width: '100%', pointerEvents: 'none' }}
                          scrollWheelZoom={false}
                          dragging={false}
                          zoomControl={false}
                        >
                          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                          <Marker position={[parseFloat(selectedOrder.latitude), parseFloat(selectedOrder.longitude)]} />
                        </MapContainer>
                        <div style={{ position: 'absolute', bottom: '15px', right: '15px', zIndex: 1000, background: 'rgba(255,255,255,0.95)', padding: '8px 16px', borderRadius: '10px', fontSize: '0.85rem', fontWeight: 'bold', color: '#2563EB', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', border: '1px solid #BFDBFE' }}>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>
                          {t('adm_map_expand') || 'Expand Map'}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="admin-order-map" style={{ marginTop: '15px' }}>
                      <p><strong>ตำแหน่งบนแผนที่:</strong></p>
                      <div style={{ padding: '20px', backgroundColor: '#f9fafb', borderRadius: '12px', border: '1px dashed #ccc', textAlign: 'center', color: '#666' }}>
                        {t('adm_no_coords') || 'No map coordinates found.'}
                      </div>
                    </div>
                  )}
                </div>
                {selectedOrder.bank_account_number ? (
                  <div className="order-info-section refund-box-premium">
                    <h4>{t('adm_refund_info') || 'Refund Information'}</h4>
                    <div className="info-grid">
                      <div className="info-row">
                        <span className="info-label">{t('h_bank') || 'Bank'}:</span>
                        <span className="info-value">{selectedOrder.bank_name || '-'}</span>
                      </div>
                      <div className="info-row">
                        <span className="info-label">{t('h_acc_name') || 'Account Name'}:</span>
                        <span className="info-value">{selectedOrder.bank_account_name || '-'}</span>
                      </div>
                      <div className="info-row">
                        <span className="info-label">{t('h_acc_num') || 'Account Number'}:</span>
                        <span className="info-value highlight-orange">{selectedOrder.bank_account_number || '-'}</span>
                      </div>
                      <div className="info-row" style={{ marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid #FFEDD5' }}>
                        <span className="info-label">{t('adm_reason') || 'Reason'}:</span>
                        <span className="info-value" style={{ color: '#991B1B' }}>
                          {selectedOrder.cancel_reason || <span style={{ fontStyle: 'italic', opacity: 0.5 }}>ยังไม่ได้ระบุ</span>}
                        </span>
                      </div>
                      {selectedOrder.refund_slip_url && (
                        <div className="info-row" style={{ marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid #FFEDD5', flexDirection: 'column', alignItems: 'flex-start' }}>
                          <span className="info-label" style={{ marginBottom: '8px' }}>{t('pay_upload_slip') || 'Refund Slip'}:</span>
                          <a href={`http://localhost:5000${selectedOrder.refund_slip_url}`} target="_blank" rel="noopener noreferrer">
                            <img 
                              src={`http://localhost:5000${selectedOrder.refund_slip_url}`} 
                              alt="Refund Slip" 
                              style={{ maxWidth: '100%', borderRadius: '8px', border: '1px solid #E2E8F0', cursor: 'pointer' }} 
                            />
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="order-items-section">
                <h4>{t('adm_items') || 'Order Items'}</h4>
                <table className="mini-items-table">
                  <thead>
                    <tr>
                      <th>{t('inv_th_item') || 'Item'}</th>
                      <th>{t('inv_th_size') || 'Size'}</th>
                      <th>{t('inv_th_quantity') || 'Qty'}</th>
                      <th>{t('inv_th_price') || 'Price'}</th>
                      <th>{t('inv_th_total') || 'Total'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedOrder.items && selectedOrder.items.map((item, idx) => (
                      <tr key={idx}>
                        <td>
                          <div className="td-item-info">
                            <img src={item.image_url ? `http://localhost:5000${item.image_url}` : 'https://via.placeholder.com/40'} alt={item.name} className="mini-item-img" />
                            <span>{item.name}</span>
                          </div>
                        </td>
                        <td>{item.size || '-'}</td>
                        <td>{item.quantity}</td>
                        <td>฿{Number(item.price_at_purchase).toLocaleString()}</td>
                        <td>฿{(Number(item.price_at_purchase) * item.quantity).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="order-summary-section">
                <div className="summary-row">
                  <span>{t('adm_total_pay') || 'Total Payment'}:</span>
                  <span className="modal-total-amount">฿{Number(selectedOrder.total_amount).toLocaleString()}</span>
                </div>
                <div className="summary-row">
                  <span>{t('adm_curr_status') || 'Current Status'}:</span>
                  <span className={`status badge-${selectedOrder.status}`}>
                    {selectedOrder.status === 'pending' ? 'รอดำเนินการ' :
                      selectedOrder.status === 'shipped' ? 'จัดส่งแล้ว' :
                        selectedOrder.status === 'arrived' ? 'ถึงที่หมายแล้ว (รอการยืนยัน)' :
                          selectedOrder.status === 'delivered' ? 'สำเร็จแล้ว' :
                          selectedOrder.status === 'cancelled' ? 'ยกเลิก' :
                          selectedOrder.status === 'refunded' ? 'คืนเงินแล้ว' : selectedOrder.status}
                  </span>
                </div>
                {(selectedOrder.status === 'cancelled' || selectedOrder.status === 'refunded') && (
                  <div className="summary-row" style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '2px dashed #E2E8F0', alignItems: 'flex-start' }}>
                    <span style={{ minWidth: '100px' }}>{t('adm_reason') || 'Reason'}:</span>
                    <span style={{ color: '#DC2626', textAlign: 'right', fontWeight: '800' }}>
                      {selectedOrder.cancel_reason || t('adm_not_specified')}
                    </span>
                  </div>
                )}
              </div>
            </div>
            <div className="admin-modal-footer">
              {/* Modal Cancel Button: Only show if pending */}
              {selectedOrder.status === 'pending' && (
                <button className="admin-cancel-btn" onClick={() => handleCancelClick(selectedOrder.id)}>
                  {t('adm_cancel_order') || 'Cancel Order'}
                </button>
              )}

              {selectedOrder.status !== 'cancelled' && selectedOrder.status !== 'delivered' && selectedOrder.status !== 'refunded' && (
                <>
                  {(selectedOrder.status === 'pending' || !selectedOrder.status) && (
                    <button className="ship-btn" onClick={(e) => openShipConfirm(e, selectedOrder.id)}>
                      {t('adm_shipped') || 'Ship Product'}
                    </button>
                  )}
                  {selectedOrder.status === 'shipped' && (
                    <button className="deliver-btn" onClick={(e) => openDeliverConfirm(e, selectedOrder.id)}>
                      {t('adm_order_arrived') || 'Mark as Arrived'}
                    </button>
                  )}
                  {selectedOrder.status === 'arrived' && (
                    <div className="waiting-badge">{t('adm_wait_confirm') || 'Waiting for customer confirmation'}</div>
                  )}
                </>
              )}

              {selectedOrder.status === 'cancelled' && selectedOrder.bank_account_number && (
                <button className="deliver-btn" style={{ backgroundColor: '#6366f1' }} onClick={(e) => openRefundConfirm(e, selectedOrder.id)}>
                  {t('adm_confirm_refund') || 'Confirm Refund Success'}
                </button>
              )}

              {selectedOrder.status === 'refunded' && (
                <div className="order-finalized-badge" style={{ backgroundColor: '#FFF7ED', color: '#F97316', borderColor: '#FFEDD5', padding: '10px 20px', fontSize: '1rem', fontWeight: 'bold' }}>
                  {t('adm_order_refunded') || 'Refunded to customer'}
                </div>
              )}

              {selectedOrder.status === 'delivered' && (
                <div className="order-finalized-badge success" style={{ padding: '10px 20px', fontSize: '1rem', fontWeight: 'bold' }}>
                  {t('adm_finalized') || 'Order Completed'}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Minimalist Confirmation Modal */}
      {/* Shipping Confirmation Modal */}
      {isConfirmModalOpen && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-content">
            <div className="admin-modal-header">
              <h3>{t('adm_confirm_ship') || 'Confirm Shipping'} #{orderToShip}</h3>
              <button className="close-modal-btn" onClick={() => setIsConfirmModalOpen(false)}>&times;</button>
            </div>
            <div className="admin-modal-body" style={{ textAlign: 'center' }}>
              <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'center' }}>
                <div style={{ background: '#EFF6FF', padding: '20px', borderRadius: '50%' }}>
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13" /><polyline points="16 8 20 8 23 11 23 16 16 16 16 8" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" /></svg>
                </div>
              </div>
              <p style={{ fontSize: '1.1rem', color: '#444', marginBottom: '0.5rem' }}>{t('adm_confirm_ship_msg') || 'Change status to Shipped?'}</p>
            </div>
            <div className="admin-modal-footer">
              <button className="modal-btn secondary" onClick={() => setIsConfirmModalOpen(false)}>{t('cancel') || 'Cancel'}</button>
              <button className="modal-btn success" onClick={() => handleShipOrder(orderToShip)}>{t('confirm') || 'Confirm'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Delivery Confirmation Modal */}
      {isDeliverModalOpen && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-content">
            <div className="admin-modal-header">
              <h3>{t('adm_confirm_arrived') || 'Confirm Arrival'}</h3>
              <button className="close-modal-btn" onClick={() => setIsDeliverModalOpen(false)}>&times;</button>
            </div>
            <div className="admin-modal-body" style={{ textAlign: 'center' }}>
              <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'center' }}>
                <div style={{ background: '#F0FDF4', padding: '20px', borderRadius: '50%' }}>
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
                </div>
              </div>
              <p style={{ fontSize: '1.1rem', color: '#444', marginBottom: '0.5rem' }}>{t('adm_confirm_arrived_msg') || 'Confirm product reached destination?'}</p>
            </div>
            <div className="admin-modal-footer">
              <button className="modal-btn secondary" onClick={() => setIsDeliverModalOpen(false)}>{t('no_not_yet') || 'Not yet'}</button>
              <button className="modal-btn success" onClick={() => handleDeliverOrder(orderToDeliver)}>{t('confirm') || 'Confirm'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Order Modal */}
      {isCancelModalOpen && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-content">
            <div className="admin-modal-header">
              <h3>{t('adm_cancel_order') || 'Cancel Order'} #{orderToCancel}</h3>
              <button className="close-modal-btn" onClick={() => setIsCancelModalOpen(false)}>&times;</button>
            </div>
            <div className="admin-modal-body">
              <h4>{t('adm_reason_label') || 'Reason for cancellation'}:</h4>
              <textarea
                className="reason-textarea"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder={t('adm_cancel_reason_ph') || "Reason..."}
              ></textarea>
              <p className="modal-notice">{t('adm_cancel_notice') || 'Customer will be notified'}</p>
            </div>
            <div className="admin-modal-footer">
              <button className="modal-btn secondary" onClick={() => setIsCancelModalOpen(false)}>{t('back') || 'Back'}</button>
              <button className="modal-btn danger" onClick={handleConfirmCancel}>{t('adm_cancel_order') || 'Confirm Cancel'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Refund Confirmation Modal */}
      {isRefundConfirmOpen && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-content">
            <div className="admin-modal-header">
              <h3>{t('adm_confirm_refund') || 'Confirm Refund Success'}</h3>
              <button className="close-modal-btn" onClick={() => setIsRefundConfirmOpen(false)}>&times;</button>
            </div>
            <div className="admin-modal-body" style={{ textAlign: 'center' }}>
              <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'center' }}>
                <div style={{ background: '#EEF2FF', padding: '20px', borderRadius: '50%' }}>
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L3 7V17L12 22L21 17V7L12 2Z" /><path d="M12 22V12" /><path d="M21 7L12 12L3 7" /></svg>
                </div>
              </div>
              <p style={{ fontSize: '1.1rem', color: '#444', marginBottom: '1rem' }}>{t('adm_confirm_refund_msg') || 'Confirm refund transferred?'}</p>
              
              <div className="refund-upload-section" style={{ marginTop: '20px', padding: '15px', backgroundColor: '#F8FAFC', borderRadius: '12px', border: '1px dashed #CBD5E1' }}>
                <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold', color: '#475569' }}>
                  {t('pay_upload_slip') || 'Upload Refund Slip'}
                </label>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={(e) => setRefundSlip(e.target.files[0])}
                  style={{ display: 'none' }}
                  id="refund-slip-input"
                />
                <label htmlFor="refund-slip-input" className="premium-upload-btn" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 20px', backgroundColor: '#FFF', border: '1px solid #E2E8F0', borderRadius: '8px', fontSize: '0.9rem', color: '#6366F1', fontWeight: '600', transition: 'all 0.2s' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                  {refundSlip ? refundSlip.name : (t('pay_attach_slip') || 'Attach Slip')}
                </label>
                {refundSlip && (
                  <div style={{ marginTop: '10px' }}>
                    <img src={URL.createObjectURL(refundSlip)} alt="Preview" style={{ maxWidth: '100px', borderRadius: '8px', border: '2px solid #6366F1' }} />
                  </div>
                )}
              </div>
            </div>
            <div className="admin-modal-footer">
              <button className="modal-btn secondary" onClick={() => setIsRefundConfirmOpen(false)} disabled={isRefunding}>{t('no') || 'No'}</button>
              <button 
                className="modal-btn success" 
                style={{ backgroundColor: '#6366f1' }} 
                onClick={() => handleRefundOrder(orderToRefund)}
                disabled={isRefunding}
              >
                {isRefunding ? (t('loading') || 'Processing...') : (t('adm_refund_success') || 'Refunded')}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Full Map Expand Modal */}
      {isFullMapOpen && selectedOrder && selectedOrder.latitude && selectedOrder.longitude && (
        <div className="admin-modal-overlay" style={{ zIndex: 2000 }} onClick={() => setIsFullMapOpen(false)}>
          <div className="admin-modal-content" style={{ width: '90%', height: '90vh', maxWidth: 'none', flexDirection: 'column', position: 'relative' }} onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header" style={{ flexShrink: 0 }}>
              <h3>{t('adm_map_pos_label') || 'Shipping Map'} ({t('adm_coords') || 'Coords'}: {selectedOrder.latitude}, {selectedOrder.longitude})</h3>
              <button className="close-modal-btn" onClick={() => setIsFullMapOpen(false)}>&times;</button>
            </div>
            <div className="admin-modal-body" style={{ flexGrow: 1, padding: 0, height: '100%' }}>
              <MapContainer
                center={[parseFloat(selectedOrder.latitude), parseFloat(selectedOrder.longitude)]}
                zoom={16}
                style={{ height: '100%', width: '100%' }}
                scrollWheelZoom={true}
                dragging={true}
                zoomControl={true}
              >
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <Marker position={[parseFloat(selectedOrder.latitude), parseFloat(selectedOrder.longitude)]} />
              </MapContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOrders;
