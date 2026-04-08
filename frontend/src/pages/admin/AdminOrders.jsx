// code in this file is written by worapol สุดหล่อ
import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './AdminOrders.css';

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

const AdminOrders = () => {
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

  // Filters - by worapol สุดหล่อ
  const [slipFilter, setSlipFilter] = useState('all'); // all, verified, pending - by worapol สุดหล่อ
  const [statusFilter, setStatusFilter] = useState('all');

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
      showToast('Order marked as shipped', 'success');
      setIsConfirmModalOpen(false);
      setOrderToShip(null);
      fetchOrders();
      if (selectedOrder && selectedOrder.id === orderId) {
        handleViewDetails(orderId);
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update order', 'error');
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
      showToast('แจ้งลูกคว่าสินค้าส่งถึงที่หมายแล้วเรียบร้อย', 'success');
      setIsDeliverModalOpen(false);
      setOrderToDeliver(null);
      fetchOrders();
      if (selectedOrder && selectedOrder.id === orderId) {
        handleViewDetails(orderId);
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update order', 'error');
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
      showToast(err.response?.data?.message || 'Failed to fetch order details', 'error');
    }
  };

  const closeDetailsModal = () => {
    setSelectedOrder(null);
  };

  const handleCancelClick = (e, id) => {
    if (e && e.stopPropagation) e.stopPropagation();
    // If e is actually the id (called from modal) - by worapol สุดหล่อ
    const orderId = id || e;
    setOrderToCancel(orderId);
    setCancelReason('');
    setIsCancelModalOpen(true);
  };

  const handleConfirmCancel = async () => {
    try {
      await api.put(`/orders/${orderToCancel}/cancel`, { cancel_reason: cancelReason });
      showToast('Order cancelled successfully', 'success');
      setIsCancelModalOpen(false);
      setOrderToCancel(null);
      fetchOrders();
      if (selectedOrder && selectedOrder.id === orderToCancel) {
        handleViewDetails(orderToCancel);
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to cancel order', 'error');
    }
  };

  const handleToggleVerifySlip = async (e, id, currentStatus) => {
    if (e && e.stopPropagation) e.stopPropagation();
    try {
      const newStatus = !currentStatus;
      await api.put(`/orders/${id}/verify-slip`, { verified: newStatus });
      showToast(newStatus ? 'ตรวจสลิปเรียบร้อยแล้ว' : 'ยกเลิกการตรวจสลิป', 'success');
      fetchOrders();
    } catch (err) {
      showToast(err.response?.data?.message || 'ไม่สามารถอัปเดตสถานะสลิปได้', 'error');
    }
  };

  const handleRefundOrder = async (orderId) => {
    try {
      await api.put(`/orders/${orderId}/refund-complete`);
      showToast('Order marked as Refunded', 'success');
      setIsRefundConfirmOpen(false);
      setOrderToRefund(null);
      fetchOrders();
      if (selectedOrder && selectedOrder.id === orderId) {
        handleViewDetails(orderId);
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update order', 'error');
    }
  };

  const openRefundConfirm = (e, id) => {
    if (e && e.stopPropagation) e.stopPropagation();
    setOrderToRefund(id);
    setIsRefundConfirmOpen(true);
  };

  const filteredOrders = orders.filter(order => {
    const matchSlip = slipFilter === 'all' ||
      (slipFilter === 'verified' && order.slip_verified) ||
      (slipFilter === 'pending' && !order.slip_verified);

    const matchStatus = statusFilter === 'all' || order.status === statusFilter;

    return matchSlip && matchStatus;
  });

  if (loading) return <div>Loading Orders...</div>;

  return (
    <div className="admin-orders-container">
      <h2>Manage Customer Orders</h2>

      <div className="order-filters-container">
        <div className="filter-header-row">
          <div className="status-legend-premium">
            <div className="legend-item">
              <span className="legend-icon pending">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
              </span>
              รอดำเนินการ
            </div>
            <div className="legend-item">
              <span className="legend-icon shipped"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><rect x="1" y="3" width="15" height="13" /><polyline points="16 8 20 8 23 11 23 16 16 16 16 8" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" /></svg></span>
              จัดส่งแล้ว
            </div>
            <div className="legend-item">
              <span className="legend-icon arrived"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg></span>
              ถึงที่หมาย
            </div>
            <div className="legend-item">
              <span className="legend-icon delivered"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg></span>
              สำเร็จแล้ว
            </div>
            <div className="legend-item">
              <span className="legend-icon cancelled"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg></span>
              ยกเลิก
            </div>
            <div className="legend-item">
              <span className="legend-icon refunded">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><path d="M12 2L3 7V17L12 22L21 17V7L12 2Z" /><path d="M12 22V12" /><path d="M21 7L12 12L3 7" /></svg>
              </span>
              คืนเงิน
            </div>
          </div>
        </div>

        <div className="order-filters-container">
          <div className="filter-group">
            <label className="filter-label">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6366F1" strokeWidth="2.5"><path d="M12 2v20M17 5H12M12 19h5" /></svg>
              Payment Verification
            </label>
            <div className="filter-options">
              <button className={`filter-btn-pill ${slipFilter === 'all' ? 'active' : ''}`} onClick={() => setSlipFilter('all')}>
                <span className="dot all"></span> All Orders
              </button>
              <button className={`filter-btn-pill ${slipFilter === 'pending' ? 'active' : ''}`} onClick={() => setSlipFilter('pending')}>
                <span className="dot pending"></span> Pending Check
              </button>
              <button className={`filter-btn-pill ${slipFilter === 'verified' ? 'active' : ''}`} onClick={() => setSlipFilter('verified')}>
                <span className="dot verified"></span> Verified Only
              </button>
            </div>
          </div>

          <div className="filter-line-separator"></div>

          <div className="filter-group">
            <label className="filter-label">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6366F1" strokeWidth="2.5"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" /></svg>
              Shipping Status
            </label>
            <div className="filter-options">
              <button className={`filter-btn-pill ${statusFilter === 'all' ? 'active' : ''}`} onClick={() => setStatusFilter('all')}>
                All Status
              </button>
              <button className={`filter-btn-pill pending ${statusFilter === 'pending' ? 'active' : ''}`} onClick={() => setStatusFilter('pending')}>
                Pending
              </button>
              <button className={`filter-btn-pill shipped ${statusFilter === 'shipped' ? 'active' : ''}`} onClick={() => setStatusFilter('shipped')}>
                Shipped
              </button>
              <button className={`filter-btn-pill arrived ${statusFilter === 'arrived' ? 'active' : ''}`} onClick={() => setStatusFilter('arrived')}>
                Arrived
              </button>
              <button className={`filter-btn-pill delivered ${statusFilter === 'delivered' ? 'active' : ''}`} onClick={() => setStatusFilter('delivered')}>
                Completed
              </button>
              <button className={`filter-btn-pill cancelled ${statusFilter === 'cancelled' ? 'active' : ''}`} onClick={() => setStatusFilter('cancelled')}>
                Cancelled
              </button>
              <button className={`filter-btn-pill refunded ${statusFilter === 'refunded' ? 'active' : ''}`} style={{ borderColor: statusFilter === 'refunded' ? '#F97316' : '#eee' }} onClick={() => setStatusFilter('refunded')}>
                Refunded
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
              <th>Order ID</th>
              <th>Customer</th>
              <th>Date</th>
              <th>Total</th>
              <th>Status</th>
              <th>Slip Check</th>
              <th style={{ textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.length === 0 ? (
              <tr><td colSpan="8" className="text-center">No orders found matching your filters.</td></tr>
            ) : filteredOrders.map((order, index) => {
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
                        {order.status === 'pending' ? 'รอดำเนินการ' :
                          order.status === 'shipped' ? 'จัดส่งแล้ว' :
                            order.status === 'arrived' ? 'ถึงที่หมาย' :
                              order.status === 'delivered' ? 'สำเร็จแล้ว' :
                                order.status === 'cancelled' ? 'ยกเลิก' :
                                  order.status === 'refunded' ? 'คืนเงิน' : order.status}
                      </span>
                      {order.bank_account_number && order.status === 'cancelled' && (
                        <span style={{ fontSize: '0.7rem', color: '#6366f1', fontWeight: 'bold', marginTop: '4px' }}>
                          ● แจ้งเลขบัญชีแล้ว
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
                            title="ส่องดูรูปสลิป"
                          >
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                              <polyline points="14 2 14 8 20 8" />
                            </svg>
                          </a>
                          <button
                            className={`premium-action-btn verify-toggle ${order.slip_verified ? 'verified' : 'unverified'}`}
                            onClick={(e) => handleToggleVerifySlip(e, order.id, order.slip_verified)}
                            title={order.slip_verified ? "อนุมัติแล้ว" : "รอยืนยัน"}
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
                        <span className="no-slip-text">ไม่มีสลิป</span>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="premium-actions-row" onClick={(e) => e.stopPropagation()}>
                      <button className="premium-icon-btn info" onClick={() => handleViewDetails(order.id)} title="ดูรายละเอียด">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
                        </svg>
                      </button>

                      {/* Show cancel button ONLY if it's pending. If shipped or later, hide it. */}
                      {order.status === 'pending' && (
                        <button className="premium-icon-btn cancel" onClick={(e) => handleCancelClick(e, order.id)} title="ยกเลิกออเดอร์">
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
                            <button className="premium-icon-btn ship" onClick={(e) => openShipConfirm(e, order.id)} title="จัดส่ง">
                              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="2" y="3" width="15" height="13" />
                                <path d="M17 8h4l3 3v5h-7V8z" />
                                <circle cx="7" cy="18" r="2" />
                                <circle cx="17" cy="18" r="2" />
                              </svg>
                            </button>
                          )}

                          {order.status === 'shipped' && (
                            <button className="premium-icon-btn deliver" onClick={(e) => openDeliverConfirm(e, order.id)} title="ถึงที่หมาย">
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
                          ยืนยันคืนเงิน
                        </button>
                      )}

                      {order.status === 'delivered' && (
                        <div className="order-finalized-badge success">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="5" style={{ marginRight: '6px' }}><polyline points="20 6 9 17 4 12" /></svg>
                          เสร็จสิ้น
                        </div>
                      )}
                      
                      {(order.status === 'cancelled' || order.status === 'refunded') && (
                        <div className="order-finalized-badge danger">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="5" style={{ marginRight: '6px' }}><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                          ยกเลิกแล้ว
                        </div>
                      )}

                      {order.status === 'refunded' && (
                        <div className="order-finalized-badge success" style={{ backgroundColor: '#FFF7ED', color: '#F97316', borderColor: '#FFEDD5' }}>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="5" style={{ marginRight: '6px' }}><polyline points="20 6 9 17 4 12" /></svg>
                          คืนเงิน
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

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-content">
            <div className="admin-modal-header">
              <h3>รายละเอียดคำสั่งซื้อ #{selectedOrder.id}</h3>
              <button className="close-modal-btn" onClick={closeDetailsModal}>&times;</button>
            </div>
             <div className="admin-modal-body">
               <div className="order-details-grid">
                <div className="order-info-section">
                  <h4>ข้อมูลลูกค้าและที่อยู่จัดส่ง</h4>
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
                      <p><strong>ตำแหน่งบนแผนที่:</strong></p>
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
                          ขยายแผนที่
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="admin-order-map" style={{ marginTop: '15px' }}>
                      <p><strong>ตำแหน่งบนแผนที่:</strong></p>
                      <div style={{ padding: '20px', backgroundColor: '#f9fafb', borderRadius: '12px', border: '1px dashed #ccc', textAlign: 'center', color: '#666' }}>
                        ไม่พบข้อมูลพิกัดบนแผนที่ (ลูกค้ายังไม่ได้ปักหมุดที่อยู่)
                      </div>
                    </div>
                  )}
                </div>
                {selectedOrder.bank_account_number ? (
                  <div className="order-info-section refund-box-premium">
                    <h4>ข้อมูลการคืนเงิน</h4>
                    <div className="info-grid">
                      <div className="info-row">
                        <span className="info-label">ธนาคาร:</span>
                        <span className="info-value">{selectedOrder.bank_name || '-'}</span>
                      </div>
                      <div className="info-row">
                        <span className="info-label">ชื่อบัญชี:</span>
                        <span className="info-value">{selectedOrder.bank_account_name || '-'}</span>
                      </div>
                      <div className="info-row">
                        <span className="info-label">เลขบัญชี:</span>
                        <span className="info-value highlight-orange">{selectedOrder.bank_account_number || '-'}</span>
                      </div>
                      <div className="info-row" style={{ marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid #FFEDD5' }}>
                        <span className="info-label">เหตุผล:</span>
                        <span className="info-value" style={{ color: '#991B1B' }}>
                          {selectedOrder.cancel_reason || <span style={{ fontStyle: 'italic', opacity: 0.5 }}>ยังไม่ได้ระบุ</span>}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="order-items-section">
                <h4>รายการสินค้า</h4>
                <table className="mini-items-table">
                  <thead>
                    <tr>
                      <th>สินค้า</th>
                      <th>ไซส์</th>
                      <th>จำนวน</th>
                      <th>ราคา/ชิ้น</th>
                      <th>รวม</th>
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
                  <span>ยอดชำระรวม:</span>
                  <span className="modal-total-amount">฿{Number(selectedOrder.total_amount).toLocaleString()}</span>
                </div>
                <div className="summary-row">
                  <span>สถานะปัจจุบัน:</span>
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
                    <span style={{ minWidth: '100px' }}>เหตุผล:</span>
                    <span style={{ color: '#DC2626', textAlign: 'right', fontWeight: '800' }}>
                      {selectedOrder.cancel_reason || '(ไม่ได้ระบุสาเหตุ)'}
                    </span>
                  </div>
                )}
              </div>
            </div>
            <div className="admin-modal-footer">
              {/* Modal Cancel Button: Only show if pending */}
              {selectedOrder.status === 'pending' && (
                <button className="admin-cancel-btn" onClick={() => handleCancelClick(selectedOrder.id)}>
                  ยกเลิกคำสั่งซื้อ
                </button>
              )}

              {selectedOrder.status !== 'cancelled' && selectedOrder.status !== 'delivered' && selectedOrder.status !== 'refunded' && (
                <>
                  {(selectedOrder.status === 'pending' || !selectedOrder.status) && (
                    <button className="ship-btn" onClick={(e) => openShipConfirm(e, selectedOrder.id)}>
                      จัดส่งสินค้า (Ship)
                    </button>
                  )}
                  {selectedOrder.status === 'shipped' && (
                    <button className="deliver-btn" onClick={(e) => openDeliverConfirm(e, selectedOrder.id)}>
                      แจ้งสินค้าถึงที่หมาย
                    </button>
                  )}
                  {selectedOrder.status === 'arrived' && (
                    <div className="waiting-badge">รอการยืนยันรับสินค้าจากลูกค้า</div>
                  )}
                </>
              )}

              {selectedOrder.status === 'cancelled' && selectedOrder.bank_account_number && (
                <button className="deliver-btn" style={{ backgroundColor: '#6366f1' }} onClick={(e) => openRefundConfirm(e, selectedOrder.id)}>
                  ยืนยันการคืนเงินสำเร็จ
                </button>
              )}

              {selectedOrder.status === 'refunded' && (
                <div className="order-finalized-badge" style={{ backgroundColor: '#FFF7ED', color: '#F97316', borderColor: '#FFEDD5', padding: '10px 20px', fontSize: '1rem', fontWeight: 'bold' }}>
                  คืนเงินให้ลูกค้าเรียบร้อยแล้ว
                </div>
              )}

              {selectedOrder.status === 'delivered' && (
                <div className="order-finalized-badge success" style={{ padding: '10px 20px', fontSize: '1rem', fontWeight: 'bold' }}>
                  ออเดอร์เสร็จสมบูรณ์แล้ว
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
              <h3>ยืนยันการจัดส่งออเดอร์ #{orderToShip}</h3>
              <button className="close-modal-btn" onClick={() => setIsConfirmModalOpen(false)}>&times;</button>
            </div>
            <div className="admin-modal-body" style={{ textAlign: 'center' }}>
              <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'center' }}>
                <div style={{ background: '#EFF6FF', padding: '20px', borderRadius: '50%' }}>
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13" /><polyline points="16 8 20 8 23 11 23 16 16 16 16 8" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" /></svg>
                </div>
              </div>
              <p style={{ fontSize: '1.1rem', color: '#444', marginBottom: '0.5rem' }}>คุณต้องการเปลี่ยนสถานะเป็น <strong>"จัดส่งแล้ว"</strong> ใช่หรือไม่?</p>
            </div>
            <div className="admin-modal-footer">
              <button className="modal-btn secondary" onClick={() => setIsConfirmModalOpen(false)}>ยกเลิก</button>
              <button className="modal-btn success" onClick={() => handleShipOrder(orderToShip)}>ยืนยันจัดส่ง</button>
            </div>
          </div>
        </div>
      )}

      {/* Delivery Confirmation Modal */}
      {isDeliverModalOpen && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-content">
            <div className="admin-modal-header">
              <h3>ยืนยันสินค้าถึงที่หมาย</h3>
              <button className="close-modal-btn" onClick={() => setIsDeliverModalOpen(false)}>&times;</button>
            </div>
            <div className="admin-modal-body" style={{ textAlign: 'center' }}>
              <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'center' }}>
                <div style={{ background: '#F0FDF4', padding: '20px', borderRadius: '50%' }}>
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
                </div>
              </div>
              <p style={{ fontSize: '1.1rem', color: '#444', marginBottom: '0.5rem' }}>คุณต้องการแจ้งว่าสินค้าถึงพิกัดออเดอร์ #{orderToDeliver} แล้วใช่หรือไม่?</p>
            </div>
            <div className="admin-modal-footer">
              <button className="modal-btn secondary" onClick={() => setIsDeliverModalOpen(false)}>ยังก่อน</button>
              <button className="modal-btn success" onClick={() => handleDeliverOrder(orderToDeliver)}>ยืนยัน</button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Order Modal */}
      {isCancelModalOpen && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-content">
            <div className="admin-modal-header">
              <h3>ยกเลิกคำสั่งซื้อ #{orderToCancel}</h3>
              <button className="close-modal-btn" onClick={() => setIsCancelModalOpen(false)}>&times;</button>
            </div>
            <div className="admin-modal-body">
              <h4>ระบุเหตุผลในการยกเลิก (ถ้ามี):</h4>
              <textarea
                className="reason-textarea"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="เช่น สินค้าหมด, ข้อมูลไม่ถูกต้อง..."
              ></textarea>
              <p className="modal-notice">ระบบจะส่งข้อความแจ้งเตือนเหตุผลนี้ให้ลูกค้าทราบ</p>
            </div>
            <div className="admin-modal-footer">
              <button className="modal-btn secondary" onClick={() => setIsCancelModalOpen(false)}>ย้อนกลับ</button>
              <button className="modal-btn danger" onClick={handleConfirmCancel}>ยืนยันการยกเลิก</button>
            </div>
          </div>
        </div>
      )}

      {/* Refund Confirmation Modal */}
      {isRefundConfirmOpen && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-content">
            <div className="admin-modal-header">
              <h3>ยืนยันการคืนเงินสำเร็จ</h3>
              <button className="close-modal-btn" onClick={() => setIsRefundConfirmOpen(false)}>&times;</button>
            </div>
            <div className="admin-modal-body" style={{ textAlign: 'center' }}>
              <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'center' }}>
                <div style={{ background: '#EEF2FF', padding: '20px', borderRadius: '50%' }}>
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L3 7V17L12 22L21 17V7L12 2Z" /><path d="M12 22V12" /><path d="M21 7L12 12L3 7" /></svg>
                </div>
              </div>
              <p style={{ fontSize: '1.1rem', color: '#444', marginBottom: '0.5rem' }}>คุณได้ทำการโอนเงินคืนให้ลูกค้าออเดอร์ #{orderToRefund} แล้วใช่หรือไม่?</p>
            </div>
            <div className="admin-modal-footer">
              <button className="modal-btn secondary" onClick={() => setIsRefundConfirmOpen(false)}>ยังไม่ได้คืน</button>
              <button className="modal-btn success" style={{ backgroundColor: '#6366f1' }} onClick={() => handleRefundOrder(orderToRefund)}>คืนเงินสำเร็จแล้ว</button>
            </div>
          </div>
        </div>
      )}
      {/* Full Map Expand Modal */}
      {isFullMapOpen && selectedOrder && selectedOrder.latitude && selectedOrder.longitude && (
        <div className="admin-modal-overlay" style={{ zIndex: 2000 }} onClick={() => setIsFullMapOpen(false)}>
          <div className="admin-modal-content" style={{ width: '90%', height: '90vh', maxWidth: 'none', flexDirection: 'column', position: 'relative' }} onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header" style={{ flexShrink: 0 }}>
              <h3>แผนที่จัดส่ง (พิกัด: {selectedOrder.latitude}, {selectedOrder.longitude})</h3>
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
