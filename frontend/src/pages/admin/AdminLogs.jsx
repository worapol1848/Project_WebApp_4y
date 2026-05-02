// code in this file is written by worapol สุดหล่อ
import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';
import './AdminLogs.css';

const AdminLogs = () => {
  const { t } = useLanguage();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const res = await api.get('/logs');
      setLogs(res.data);
    } catch (err) {
      console.error('Error fetching logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const { language } = useLanguage();
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' };
    return new Date(dateString).toLocaleDateString(language === 'th' ? 'th-TH' : 'en-US', options);
  };

  const isThai = useLanguage().language === 'th';

  const actionTranslations = isThai ? {
    'CREATE': 'สร้างใหม่',
    'UPDATE': 'แก้ไขปรับปรุง',
    'DELETE': 'ลบข้อมูล',
    'UPDATE_STATUS': 'อัปเดตสถานะ',
    'CANCEL': 'ยกเลิกคำสั่งซื้อ',
    'Export PDF': 'ส่งออกไฟล์ PDF',
    'LOGIN': 'เข้าสู่ระบบ',
    'LOGOUT': 'ออกจากระบบ'
  } : {
    'CREATE': 'Create',
    'UPDATE': 'Update',
    'DELETE': 'Delete',
    'UPDATE_STATUS': 'Update Status',
    'CANCEL': 'Cancel Order',
    'Export PDF': 'Export PDF',
    'LOGIN': 'Login',
    'LOGOUT': 'Logout'
  };

  const keyTranslations = isThai ? {
    'name': 'ชื่อ/รายการ',
    'category': 'หมวดหมู่',
    'brand': 'แบรนด์',
    'stock': 'สต๊อกสินค้า',
    'sizes': 'รายละเอียดไซส์',
    'changes': 'การเปลี่ยนแปลง',
    'new_status': 'สถานะใหม่',
    'cancel_reason': 'เหตุผลการยกเลิก',
    'price': 'ราคา',
    'report_name': 'ชื่อรายงาน',
    'report_id': 'รหัสรายงาน',
    'products_count': 'จำนวนสินค้า',
    'generated_at': 'วันที่สร้าง',
    'month': 'เดือน',
    'year': 'ปี'
  } : {
    'name': 'Name',
    'category': 'Category',
    'brand': 'Brand',
    'stock': 'Stock',
    'sizes': 'Sizes',
    'changes': 'Changes',
    'new_status': 'New Status',
    'cancel_reason': 'Cancel Reason',
    'price': 'Price',
    'report_name': 'Report Name',
    'report_id': 'Report ID',
    'products_count': 'Products Count',
    'generated_at': 'Generated At',
    'month': 'Month',
    'year': 'Year'
  };

  const statusTranslations = isThai ? {
    'pending': 'รอดำเนินการ (Pending)',
    'shipped': 'จัดส่งแล้ว (Shipped)',
    'arrived': 'ถึงที่หมาย (Arrived)',
    'delivered': 'สำเร็จแล้ว (Delivered)',
    'cancelled': 'ยกเลิก (Cancelled)',
    'refunded': 'คืนเงินแล้ว (Refunded)'
  } : {
    'pending': 'Pending',
    'shipped': 'Shipped',
    'arrived': 'Arrived',
    'delivered': 'Delivered',
    'cancelled': 'Cancelled',
    'refunded': 'Refunded'
  };

  const entityTranslations = isThai ? {
    'PRODUCT': 'สินค้า',
    'ORDER': 'ออเดอร์',
    'PRODUCTS': 'คลังสินค้า',
    'BEST SELLERS': 'สินค้าขายดี',
    'REVENUE': 'รายได้',
    'USER': 'ผู้ใช้งาน',
    'ADMIN': 'แอดมิน'
  } : {
    'PRODUCT': 'Product',
    'ORDER': 'Order',
    'PRODUCTS': 'Inventory',
    'BEST SELLERS': 'Best Sellers',
    'REVENUE': 'Revenue',
    'USER': 'User',
    'ADMIN': 'Admin'
  };

  const formatValue = (key, val) => {
    if (key === 'new_status' && statusTranslations[val]) return statusTranslations[val];
    if (key === 'changes' && typeof val === 'string') {
      const changesList = val.split(' | ');
      return (
        <ul className="changes-list">
          {changesList.map((ch, idx) => {
            let translatedCh = ch;
            if (isThai) {
              translatedCh = ch.replace(/General profile updates/ig, 'อัปเดตโปรไฟล์ทั่วไป')
                               .replace(/Stock updated/ig, 'อัปเดตจำนวนสินค้า (สต็อก)')
                               .replace(/Price changed/ig, 'แก้ไขราคาสินค้า')
                               .replace(/Price updated/ig, 'อัปเดตราคา')
                               .replace(/Sizes updated/ig, 'อัปเดตไซส์และสัดส่วน')
                               .replace(/Colors updated/ig, 'อัปเดตสีสินค้า')
                               .replace(/Images updated/ig, 'อัปเดตรูปภาพสินค้า')
                               .replace(/Brand updated/ig, 'แก้ไขแบรนด์')
                               .replace(/Category updated/ig, 'แก้ไขหมวดหมู่')
                               .replace(/Discount updated/ig, 'แก้ไขส่วนลด (%)')
                               .replace(/Status updated/ig, 'อัปเดตสถานะ')
                               .replace(/Name updated/ig, 'แก้ไขชื่อสินค้า')
                               .replace(/Description updated/ig, 'แก้ไขรายละเอียดสินค้า')
                               .replace(/Details updated/ig, 'อัปเดตข้อมูลทั่วไป');
            }
            return <li key={idx}>- {translatedCh}</li>;
          })}
        </ul>
      );
    }
    if (isThai && typeof val === 'string') {
        return val.replace('PRODUCT INVENTORY AUDIT', 'การตรวจสอบคลังสินค้าประจำงวด')
                  .replace('Best Sellers Performance Audit', 'การตรวจสอบประสิทธิภาพสินค้าขายดี')
                  .replace('Revenue Performance Audit', 'การตรวจสอบประสิทธิภาพรายได้')
                  .replace('Monthly Daily Performance Log', 'บันทึกประสิทธิภาพรายวันประจำเดือน');
    }
    return String(val);
  };

  const renderActionBadge = (action) => {
    let colorClass = '';
    switch (action) {
      case 'CREATE': colorClass = 'action-create'; break;
      case 'UPDATE': colorClass = 'action-update'; break;
      case 'DELETE': colorClass = 'action-delete'; break;
      case 'UPDATE_STATUS': colorClass = 'action-status'; break;
      case 'CANCEL': colorClass = 'action-cancel'; break;
      case 'Export PDF': colorClass = 'action-status'; break;
      default: colorClass = 'action-default'; break;
    }
    return <span className={`log-action-badge ${colorClass}`}>{actionTranslations[action] || action.replace('_', ' ')}</span>;
  };

  const renderDetails = (details) => {
    if (!details) return <span className="text-muted">-</span>;
    if (typeof details === 'object') {
      const filtered = Object.entries(details).filter(([k, v]) => v !== undefined && v !== null && v !== '' && k !== '0' && k !== '1');
      if (filtered.length === 0) return <span className="text-muted">-</span>;

      return (
        <div className="log-details-grid">
          {filtered.map(([key, value]) => (
            <div className={`log-detail-row ${key === 'changes' ? 'log-detail-changes' : ''}`} key={key}>
              <span className="log-detail-key">{keyTranslations[key] || key}:</span>
              <span className="log-detail-value">{formatValue(key, value)}</span>
            </div>
          ))}
        </div>
      );
    }
    return String(details);
  };

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const getPageNumbers = () => {
    const maxVisiblePages = 5;
    const totalPagesCount = Math.ceil(logs.length / itemsPerPage);
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

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentLogs = logs.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(logs.length / itemsPerPage);

  if (loading) return <div className="admin-container">{t('adm_logs_loading')}</div>;

  return (
    <div className="admin-container">
      <h2 className="dashboard-title">{t('adm_logs_title')}</h2>
      <p className="logs-description">{t('adm_logs_desc')}</p>

      <div className="section-card logs-card">
        <div className="table-container" style={{ width: '100%', overflowX: 'auto' }}>
          <table className="logs-table">
            <thead>
              <tr>
                <th>{t('adm_logs_th_datetime')}</th>
                <th>{t('adm_logs_th_admin')}</th>
                <th>{t('adm_logs_th_action')}</th>
                <th>{t('adm_logs_th_entity')}</th>
                <th>{t('adm_logs_th_target')}</th>
                <th>{t('adm_logs_th_details')}</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center empty-logs">{t('adm_logs_no_activity')}</td>
                </tr>
              ) : (
                currentLogs.map(log => (
                  <tr key={log.id}>
                    <td className="log-time">{formatDate(log.created_at)}</td>
                    <td>
                      <div className="log-admin-content">
                        <div className="admin-avatar-small">
                          {log.admin_name ? log.admin_name.charAt(0).toUpperCase() : '?'}
                        </div>
                        <span>{log.admin_name || `${isThai ? 'รหัส' : 'ID'}: ${log.admin_id}`}</span>
                      </div>
                    </td>
                    <td>{renderActionBadge(log.action)}</td>
                    <td className="log-entity-type">
                      <span className={`entity-badge entity-${log.entity_type.toLowerCase()}`}>
                        {entityTranslations[log.entity_type] || log.entity_type}
                      </span>
                    </td>
                    <td><span className="entity-id-badge">#{log.entity_id || '-'}</span></td>
                    <td className="log-details-cell">{renderDetails(log.details)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination Controls - Matching AdminProducts Style and Moved Outside */}
      {totalPages > 1 && (
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
            disabled={currentPage === totalPages}
            className="page-btn"
          >
            {t('adm_next') || 'Next'}
          </button>

          <div className="page-jump">
            <span>{t('adm_page_label') || (isThai ? 'หน้า:' : 'Page:')}</span>
            <select
              value={currentPage}
              onChange={(e) => paginate(Number(e.target.value))}
              className="page-select"
            >
              {[...Array(totalPages)].map((_, i) => (
                <option key={i + 1} value={i + 1}>{i + 1}</option>
              ))}
            </select>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminLogs;
