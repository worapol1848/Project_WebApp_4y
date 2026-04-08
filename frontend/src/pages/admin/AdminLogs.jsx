// code in this file is written by worapol สุดหล่อ
import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import './AdminLogs.css';

const AdminLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

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
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  const actionTranslations = {
    'CREATE': 'สร้างใหม่',
    'UPDATE': 'แก้ไขปรับปรุง',
    'DELETE': 'ลบข้อมูล',
    'UPDATE_STATUS': 'อัปเดตสถานะ',
    'CANCEL': 'ยกเลิกคำสั่งซื้อ'
  };

  const keyTranslations = {
    'name': 'ชื่อ/รายการ',
    'category': 'หมวดหมู่',
    'brand': 'แบรนด์',
    'stock': 'สต๊อกสินค้า',
    'sizes': 'รายละเอียดไซส์',
    'changes': 'การเปลี่ยนแปลง',
    'new_status': 'สถานะใหม่ (New Status)',
    'cancel_reason': 'เหตุผลการยกเลิก',
    'price': 'ราคา'
  };

  const statusTranslations = {
    'shipped': 'จัดส่งแล้ว (Shipped)',
    'arrived': 'ถึงที่หมาย (Arrived)',
    'cancelled': 'ยกเลิก (Cancelled)'
  };

  const formatValue = (key, val) => {
    if (key === 'new_status' && statusTranslations[val]) return statusTranslations[val];
    if (key === 'changes' && typeof val === 'string') {
      const changesList = val.split(' | ');
      return (
        <ul className="changes-list">
          {changesList.map((ch, idx) => <li key={idx}>- {ch}</li>)}
        </ul>
      );
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

  if (loading) return <div className="admin-container">Loading Activity Logs...</div>;

  return (
    <div className="admin-container">
      <h2 className="dashboard-title">Activity Logs (ประวัติการใช้งานระบบ)</h2>
      <p className="logs-description">ตรวจจับและบันทึกทุกการเคลื่อนไหวของแอดมิน ทั้งการจัดการสินค้า อัปเดตสต๊อก และระบบออเดอร์ทั้งหมด</p>

      <div className="section-card logs-card">
        <div className="table-container" style={{ width: '100%', overflowX: 'auto' }}>
          <table className="logs-table">
            <thead>
              <tr>
                <th>Date & Time</th>
                <th>Admin</th>
                <th>Action</th>
                <th>Target</th>
                <th>Entity ID</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center empty-logs">No recent activity.</td>
                </tr>
              ) : (
                logs.map(log => (
                  <tr key={log.id}>
                    <td className="log-time">{formatDate(log.created_at)}</td>
                    <td>
                      <div className="log-admin-content">
                        <div className="admin-avatar-small">
                          {log.admin_name ? log.admin_name.charAt(0).toUpperCase() : '?'}
                        </div>
                        <span>{log.admin_name || `ID: ${log.admin_id}`}</span>
                      </div>
                    </td>
                    <td>{renderActionBadge(log.action)}</td>
                    <td className="log-entity-type">
                      <span className={`entity-badge entity-${log.entity_type.toLowerCase()}`}>
                        {log.entity_type === 'PRODUCT' ? 'สินค้า' : log.entity_type === 'ORDER' ? 'ออเดอร์' : log.entity_type}
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
    </div>
  );
};

export default AdminLogs;
