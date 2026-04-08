// code in this file is written by worapol สุดหล่อ
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { useLanguage } from '../../context/LanguageContext';
import './MyOrders.css';

const MyOrders = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();
  const { t, language } = useLanguage();
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [orderToConfirm, setOrderToConfirm] = useState(null);

  // Review states - by worapol สุดหล่อ
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewItem, setReviewItem] = useState(null);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [commentText, setCommentText] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  // Pagination states - by worapol สุดหล่อ
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Refund states - by worapol สุดหล่อ
  const [isRefundModalOpen, setIsRefundModalOpen] = useState(false);
  const [refundOrderId, setRefundOrderId] = useState(null);
  const [bankName, setBankName] = useState('');
  const [bankAccountName, setBankAccountName] = useState('');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [submittingRefund, setSubmittingRefund] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await api.get('/orders/myorders');
      setOrders(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmReceipt = async () => {
    try {
      await api.put(`/orders/${orderToConfirm}/deliver`);
      showToast(t('success'), 'success');
      setIsConfirmModalOpen(false);
      setOrderToConfirm(null);
      fetchOrders();
    } catch (err) {
      showToast(err.response?.data?.message || t('error'), 'error');
    }
  };

  const openConfirmModal = (id) => {
    setOrderToConfirm(id);
    setIsConfirmModalOpen(true);
  };

  const openReviewModal = (orderId, item) => {
    setReviewItem({
      order_id: orderId,
      product_id: item.product_id,
      name: item.name,
      size: item.size,
      quantity: item.quantity,
      image_url: item.image_url
    });
    setRating(0);
    setHoverRating(0);
    setCommentText('');
    setIsReviewModalOpen(true);
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (rating === 0) {
      showToast(t('rev_rate'), 'error');
      return;
    }
    setSubmittingReview(true);
    try {
      await api.post(`/comments/${reviewItem.product_id}`, {
        rating,
        comment: commentText,
        size: reviewItem.size,
        quantity: reviewItem.quantity,
        order_id: reviewItem.order_id
      });
      showToast(t('rev_success'), 'success');
      setIsReviewModalOpen(false);
      setReviewItem(null);
      fetchOrders(); // Refresh to update is_reviewed status - by worapol สุดหล่อ
    } catch (err) {
      showToast(err.response?.data?.message || t('error'), 'error');
    } finally {
      setSubmittingReview(false);
    }
  };

  const openRefundModal = (orderId) => {
    setRefundOrderId(orderId);
    setBankName('');
    setBankAccountName('');
    setBankAccountNumber('');
    setIsRefundModalOpen(true);
  };

  const handleRefundInfoSubmit = async (e) => {
    e.preventDefault();
    if (!bankName || !bankAccountName || !bankAccountNumber) {
      showToast(t('error'), 'error');
      return;
    }
    setSubmittingRefund(true);
    try {
      await api.put(`/orders/${refundOrderId}/refund-info`, {
        bank_name: bankName,
        bank_account_name: bankAccountName,
        bank_account_number: bankAccountNumber
      });
      showToast(t('ref_success'), 'success');
      setIsRefundModalOpen(false);
      fetchOrders();
    } catch (err) {
      showToast(err.response?.data?.message || t('error'), 'error');
    } finally {
      setSubmittingRefund(false);
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending': return t('st_pending');
      case 'shipped': return t('st_shipped');
      case 'arrived': return t('st_arrived');
      case 'delivered': return t('st_delivered');
      case 'cancelled': return t('st_cancelled');
      case 'refunded': return t('st_refunded');
      default: return status;
    }
  };

  // Pagination Logic - by worapol สุดหล่อ
  const indexOfLastOrder = currentPage * itemsPerPage;
  const indexOfFirstOrder = indexOfLastOrder - itemsPerPage;
  const currentOrders = orders.slice(indexOfFirstOrder, indexOfLastOrder);
  const totalPages = Math.ceil(orders.length / itemsPerPage);

  const paginate = (pageNumber) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) return (
    <div className="orders-container">
      <div className="orders-placeholder">
        <div className="shimmer" style={{ width: '100%', height: '200px', borderRadius: '12px' }}></div>
        <div className="shimmer" style={{ width: '100%', height: '200px', borderRadius: '12px', marginTop: '1rem' }}></div>
      </div>
    </div>
  );

  return (
    <div className="orders-container">
      <h1 className="page-title">{t('ord_title')}</h1>
      <div className="orders-list">
        {orders.length === 0 ? (
          <div className="no-orders">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#ddd" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"></path>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <path d="M16 10a4 4 0 0 1-8 0"></path>
            </svg>
            <p>{t('ord_no_history')}</p>
            <button className="shop-now-btn" onClick={() => navigate('/')}>{t('ord_shop_now')}</button>
          </div>
        ) : (
          currentOrders.map(order => (
            <div key={order.id} className="order-card-premium">
              <div className="order-header-main">
                <div className="order-summary-info">
                  <span className="order-id-label">{t('ord_number')} #{order.id}</span>
                  <p className="order-date-label">
                    {new Date(order.created_at).toLocaleDateString(language === 'th' ? 'th-TH' : 'en-US', {
                      year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
                    })}
                  </p>
                </div>
                <div className="order-status-wrapper">
                  <span className={`status-pill status-${order.status}`}>
                    {getStatusText(order.status)}
                  </span>
                </div>
              </div>

              <div className="order-items-list">
                {order.items && order.items.map((item, idx) => (
                  <div key={idx} className="order-single-item">
                    <div className="item-img-box">
                      <img src={item.image_url ? `http://localhost:5000${item.image_url}` : 'https://via.placeholder.com/80'} alt={item.name} />
                    </div>
                    <div className="item-details-box">
                      <h4>{item.name}</h4>
                      <p className="item-meta">{t('size')}: {item.size || 'N/A'} | {t('quantity')}: {item.quantity}</p>
                    </div>
                    <div className="item-price-box" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                      <span>฿{Number(item.price_at_purchase).toLocaleString()}</span>
                      {order.status === 'delivered' && (
                        item.is_reviewed > 0 ? (
                          <span style={{ fontSize: '0.85rem', color: '#10b981', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M12 2L14.4 9.6L22 12L14.4 14.4L12 22L9.6 14.4L2 12L9.6 9.6L12 2Z" fill="#10B981" />
                              <circle cx="5" cy="5" r="1.5" fill="#f59e0b" />
                              <circle cx="19" cy="5" r="1.5" fill="#f59e0b" />
                              <circle cx="5" cy="19" r="1.5" fill="#f59e0b" />
                              <circle cx="19" cy="19" r="1.5" fill="#f59e0b" />
                            </svg>
                            {t('ord_reviewed')}
                          </span>
                        ) : (
                          <button
                            className="write-review-btn-small"
                            onClick={() => openReviewModal(order.id, item)}
                          >
                            {t('ord_write_review')}
                          </button>
                        )
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="order-footer-premium">
                <div className="total-label-box">
                  <span className="total-text">{t('ord_total')}</span>
                  <span className="total-amount-large">฿{Number(order.total_amount).toLocaleString()}</span>
                </div>
                {order.status === 'arrived' && (
                  <button className="confirm-delivery-btn" onClick={() => openConfirmModal(order.id)}>
                    {t('ord_confirm_receipt')}
                  </button>
                )}
              </div>

              {order.status === 'cancelled' && (
                <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ color: '#b91c1c', fontSize: '0.9rem' }}>
                      <strong>{t('ord_cancel_reason')}:</strong> {order.cancel_reason ? order.cancel_reason : t('ord_not_specified')}
                    </div>
                  </div>
                  
                  <div style={{ marginTop: '1rem', borderTop: '1px solid rgba(185, 28, 28, 0.1)', paddingTop: '0.75rem' }}>
                    {order.bank_account_number ? (
                      <div style={{ backgroundColor: '#fff', padding: '0.75rem', borderRadius: '8px', border: '1px solid #fecaca' }}>
                        <p style={{ margin: 0, fontSize: '0.85rem', color: '#666', fontWeight: 'bold' }}>{t('ord_refund_info')}:</p>
                        <p style={{ margin: '4px 0 0 0', fontSize: '0.9rem', color: '#111' }}>{order.bank_name} - {order.bank_account_number}</p>
                        <p style={{ margin: 0, fontSize: '0.85rem', color: '#111' }}>{t('ref_acc_name')}: {order.bank_account_name}</p>
                        <span style={{ display: 'inline-block', marginTop: '6px', fontSize: '0.75rem', color: '#888', fontStyle: 'italic' }}>* {t('ord_refund_pending')}</span>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.85rem', color: '#b91c1c', fontWeight: 'bold' }}>{t('ord_refund_no_info')}</span>
                        <button 
                          className="write-review-btn-small" 
                          style={{ backgroundColor: '#111', color: '#fff', border: 'none' }}
                          onClick={() => openRefundModal(order.id)}
                        >
                          {t('ord_provide_refund')}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {order.status === 'refunded' && (
                <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '12px', color: '#047857', textAlign: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontWeight: 'bold' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
                    {t('ord_refund_done')}
                  </div>
                  <p style={{ margin: '5px 0 0 0', fontSize: '0.85rem', opacity: 0.8 }}>{t('ord_refund_check_bank')}</p>
                </div>
              )}
            </div>
          ))
        )}

        {/* Pagination UI */}
        {totalPages > 1 && (
          <div className="pagination-container">
            <button 
              className="pagination-btn" 
              onClick={() => paginate(currentPage - 1)} 
              disabled={currentPage === 1}
            >
              &laquo; {t('previous')}
            </button>
            
            <div className="pagination-numbers">
              {[...Array(totalPages)].map((_, i) => (
                <button 
                  key={i + 1} 
                  className={`pagination-number ${currentPage === i + 1 ? 'active' : ''}`}
                  onClick={() => paginate(i + 1)}
                >
                  {i + 1}
                </button>
              ))}
            </div>

            <button 
              className="pagination-btn" 
              onClick={() => paginate(currentPage + 1)} 
              disabled={currentPage === totalPages}
            >
              {t('next')} &raquo;
            </button>
          </div>
        )}

        {/* Minimalist Confirmation Modal */}
        {isConfirmModalOpen && (
          <div className="order-modal-overlay">
            <div className="order-modal-content minimalist-confirm">
              <div className="order-modal-body" style={{ textAlign: 'center' }}>
                <div className="confirm-icon-modern">
                  <svg width="60" height="60" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="#10b981" strokeWidth="1.5" />
                    <path d="M8 12L11 15L16 9" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <h3>{t('conf_receipt_title')}</h3>
                <p>{t('conf_receipt_msg')}</p>
              </div>
              <div className="order-modal-footer-minimal">
                <button className="btn-cancel-minimal" onClick={() => setIsConfirmModalOpen(false)}>{t('cancel')}</button>
                <button className="btn-confirm-minimal" onClick={handleConfirmReceipt}>{t('conf_receipt_btn')}</button>
              </div>
            </div>
          </div>
        )}

        {/* Review Modal */}
        {isReviewModalOpen && reviewItem && (
          <div className="order-modal-overlay">
            <div className="order-modal-content review-modal-content">
              <div className="order-modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid #f0f0f0', paddingBottom: '1rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.25rem' }}>{t('rev_title')}</h3>
                <button type="button" className="close-modal-btn" onClick={() => setIsReviewModalOpen(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>&times;</button>
              </div>
              <form onSubmit={handleSubmitReview}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                  <img src={reviewItem.image_url ? `http://localhost:5000${reviewItem.image_url}` : 'https://via.placeholder.com/60'} alt="product" style={{ width: '60px', height: '60px', objectFit: 'contain', borderRadius: '8px', border: '1px solid #eee' }} />
                  <div>
                    <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '1rem' }}>{reviewItem.name}</h4>
                    <p style={{ margin: 0, color: '#666', fontSize: '0.85rem' }}>{t('size')}: {reviewItem.size || 'N/A'} | {t('quantity')}: {reviewItem.quantity}</p>
                  </div>
                </div>

                <div className="rating-selection" style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
                  <p style={{ marginBottom: '0.5rem', fontWeight: 'bold' }}>{t('rev_rate')}</p>
                  <div className="stars-input" style={{ fontSize: '2rem', cursor: 'pointer', color: '#ddd' }}>
                    {[1, 2, 3, 4, 5].map((s) => (
                      <span
                        key={s}
                        className={`input-star ${(hoverRating || rating) >= s ? 'active' : ''}`}
                        onClick={() => setRating(s)}
                        onMouseEnter={() => setHoverRating(s)}
                        onMouseLeave={() => setHoverRating(0)}
                        style={{ color: (hoverRating || rating) >= s ? '#f59e0b' : '#ddd', transition: 'color 0.2s' }}
                      >
                        ★
                      </span>
                    ))}
                  </div>
                </div>

                <div className="comment-input-area" style={{ marginBottom: '1.5rem' }}>
                  <textarea
                    placeholder={t('rev_placeholder')}
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    style={{ width: '100%', minHeight: '100px', padding: '1rem', borderRadius: '8px', border: '1px solid #ddd', boxSizing: 'border-box', fontFamily: 'inherit', resize: 'vertical' }}
                  ></textarea>
                </div>

                <div className="order-modal-footer-minimal" style={{ display: 'flex', gap: '1rem' }}>
                  <button type="button" className="btn-cancel-minimal" onClick={() => setIsReviewModalOpen(false)} style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', border: '1px solid #ddd', background: '#fff', cursor: 'pointer', fontWeight: 'bold' }}>{t('cancel')}</button>
                  <button type="submit" className="btn-confirm-minimal" disabled={submittingReview} style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', border: 'none', background: '#2ecc71', color: 'white', cursor: submittingReview ? 'not-allowed' : 'pointer', fontWeight: 'bold', opacity: submittingReview ? 0.7 : 1 }}>
                    {submittingReview ? t('rev_submitting') : t('rev_submit')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Refund Bank Info Modal */}
        {isRefundModalOpen && (
          <div className="order-modal-overlay">
            <div className="order-modal-content review-modal-content">
              <div className="order-modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid #f0f0f0', paddingBottom: '1rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.25rem' }}>{t('ref_title')}</h3>
                <button type="button" className="close-modal-btn" onClick={() => setIsRefundModalOpen(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>&times;</button>
              </div>
              <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '1.5rem' }}>{t('ref_desc')} ({refundOrderId})</p>
              
              <form onSubmit={handleRefundInfoSubmit}>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>{t('ref_bank')}</label>
                  <select 
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ddd', fontSize: '0.9rem' }}
                  >
                    <option value="">{t('ref_select_bank')}</option>
                    <option value="K-Bank">{t('pay_bank_kbank')}</option>
                    <option value="SCB">{t('pay_bank_scb')}</option>
                    <option value="BBL">{t('pay_bank_bbl')}</option>
                    <option value="KTB">{t('pay_bank_ktb')}</option>
                    <option value="BAY">{t('pay_bank_bay')}</option>
                    <option value="ttb">{t('pay_bank_ttb')}</option>
                    <option value="PromptPay">{t('pay_qr_code')}</option>
                  </select>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>{t('ref_acc_name')}</label>
                  <input 
                    type="text"
                    value={bankAccountName}
                    onChange={(e) => setBankAccountName(e.target.value)}
                    placeholder={t('ref_acc_name_ph')}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ddd', fontSize: '0.9rem' }}
                  />
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>{t('ref_acc_num')}</label>
                  <input 
                    type="text"
                    value={bankAccountNumber}
                    onChange={(e) => setBankAccountNumber(e.target.value)}
                    placeholder={t('ref_acc_num_ph')}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ddd', fontSize: '0.9rem' }}
                  />
                </div>

                <div className="order-modal-footer-minimal" style={{ display: 'flex', gap: '1rem' }}>
                  <button type="button" className="btn-cancel-minimal" onClick={() => setIsRefundModalOpen(false)} style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', border: '1px solid #ddd', background: '#fff', cursor: 'pointer', fontWeight: 'bold' }}>{t('cancel')}</button>
                  <button type="submit" className="btn-confirm-minimal" disabled={submittingRefund} style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', border: 'none', background: '#111', color: 'white', cursor: submittingRefund ? 'not-allowed' : 'pointer', fontWeight: 'bold', opacity: submittingRefund ? 0.7 : 1 }}>
                    {submittingRefund ? t('ref_submitting') : t('ref_submit')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyOrders;
