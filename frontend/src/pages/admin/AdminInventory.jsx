import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';
import { useToast } from '../../context/ToastContext';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import './AdminInventory.css';

const AdminInventory = () => {
  const { t } = useLanguage();
  const { showToast } = useToast();
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);

  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const getPageNumbers = () => {
    const totalPages = Math.ceil(inventory.length / itemsPerPage);
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    const pages = [];
    for (let i = startPage; i <= endPage; i++) {
      if (i > 0) pages.push(i);
    }
    return pages;
  };

  const handleExportPDF = () => {
    try {
      const doc = new jsPDF('l', 'mm', 'a4');
      const today = new Date();
      const reportDate = today.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
      const reportTime = today.toLocaleTimeString('en-US', { hour12: false });
      const reportId = `INV-${today.getFullYear()}${(today.getMonth() + 1).toString().padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`;

      
      doc.setFillColor(79, 70, 229);
      doc.rect(14, 15, 2, 25, 'F');

      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(17, 24, 39);
      doc.text('VELLIN', 20, 25);

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(107, 114, 128);
      doc.text('Inventory Control & Quality Assurance', 20, 31);
      doc.text('123 Business Parkway, Suite 500, Bangkok, TH', 20, 36);

      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(31, 41, 55);
      doc.text('PRODUCT INVENTORY & FINANCIAL SUMMARY', 283, 30, { align: 'right' });

      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(107, 114, 128);
      doc.text(`Document ID: ${reportId}`, 283, 36, { align: 'right' });
      doc.text(`Generated: ${reportDate} | ${reportTime}`, 283, 41, { align: 'right' });
      doc.text(`Source: Admin Dashboard / Inventory Management`, 283, 46, { align: 'right' });

      doc.setDrawColor(229, 231, 235);
      doc.setLineWidth(0.5);
      doc.line(14, 50, 283, 50);

      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(31, 41, 55);
      doc.text('DOCUMENT STATUS:', 14, 58);
      doc.setTextColor(79, 70, 229);
      doc.text('OFFICIAL STOCK RECORD', 55, 58);

      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(107, 114, 128);
      doc.text('No specific filters applied. Full catalog audit.', 14, 63);

      
      const exportData = inventory.map(item => {
        const soldRev = item.total_sold_revenue || (item.total_sold * item.price) || 0;
        const remainVal = item.remaining_value || (item.remaining_stock * item.price) || 0;
        const totalVal = item.total_potential_value || ((item.total_sold + item.remaining_stock) * item.price) || 0;
        
        const categoryLabel = item.category === 'shoe' ? t('nav_shoes') : (item.category === 'apparel' ? t('nav_apparel') : item.category);
        const productInfo = `${item.product_code}\n${item.name}\n${item.brand} - ${categoryLabel}`;

        return [
          productInfo,
          Number(item.price).toLocaleString(),
          item.total_quantity,
          item.total_sold,
          item.remaining_stock,
          Number(soldRev).toLocaleString(),
          Number(remainVal).toLocaleString(),
          Number(totalVal).toLocaleString()
        ];
      });

      autoTable(doc, {
        startY: 68,
        head: [
          [
            { content: 'Product', rowSpan: 2, styles: { halign: 'left', valign: 'middle' } },
            { content: 'Price', rowSpan: 2, styles: { halign: 'right', valign: 'middle' } },
            { content: 'PRODUCTS (QTY)', colSpan: 3, styles: { halign: 'center', fillColor: [240, 253, 244], textColor: [21, 128, 61] } },
            { content: 'FINANCIAL SUMMARY (THB)', colSpan: 3, styles: { halign: 'center', fillColor: [239, 246, 255], textColor: [29, 78, 216] } }
          ],
          [
            { content: 'Total Qty', styles: { halign: 'center' } },
            { content: 'Sold (Qty)', styles: { halign: 'center' } },
            { content: 'Remain (Qty)', styles: { halign: 'center' } },
            { content: 'Sold Revenue', styles: { halign: 'right' } },
            { content: 'Stock Value', styles: { halign: 'right' } },
            { content: 'Grand Total', styles: { halign: 'right' } }
          ]
        ],
        body: exportData,
        theme: 'grid',
        headStyles: {
          fillColor: [31, 41, 55],
          textColor: 255,
          fontSize: 8,
          fontStyle: 'bold',
          halign: 'center',
          lineColor: [200, 200, 200],
          lineWidth: 0.1
        },
        styles: {
          fontSize: 7.5,
          cellPadding: 3,
          valign: 'middle',
          lineColor: [180, 180, 180],
          lineWidth: 0.1
        },
        columnStyles: {
          0: { cellWidth: 70 },
          1: { cellWidth: 25, halign: 'right', fontStyle: 'bold' },
          2: { cellWidth: 20, halign: 'center' },
          3: { cellWidth: 20, halign: 'center' },
          4: { cellWidth: 20, halign: 'center' },
          5: { cellWidth: 30, halign: 'right' },
          6: { cellWidth: 30, halign: 'right' },
          7: { cellWidth: 30, halign: 'right', fontStyle: 'bold' }
        },
        alternateRowStyles: {
          fillColor: [250, 250, 251]
        }
      });

      
      const finalY = doc.lastAutoTable.finalY + 30;
      doc.setDrawColor(203, 213, 225);
      doc.setLineWidth(0.3);

      doc.line(14, finalY, 84, finalY);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(107, 114, 128);
      doc.text('Inventory Supervisor Verification', 14, finalY + 5);
      doc.text(`Signed Date: ${today.toLocaleDateString()}`, 14, finalY + 10);

      doc.line(213, finalY, 283, finalY);
      doc.text('Warehouse Manager Approval', 213, finalY + 5);
      doc.text(`Signed Date: ${today.toLocaleDateString()}`, 213, finalY + 10);

      
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(7);
        doc.setTextColor(156, 163, 175);
        doc.text('VELLIN Internal Inventory Control Document - System Generated', 14, 204);
        doc.text(`Page ${i} of ${pageCount}`, 283, 204, { align: 'right' });
      }

      doc.save(`Vellin_Inventory_Audit_${today.toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error("PDF Export Error:", error);
      showToast("Failed to generate PDF audit report", "error");
    }
  };

  
  const [totalPotentialValue, setTotalPotentialValue] = useState(0);
  const [totalRemainingValue, setTotalRemainingValue] = useState(0);
  const [totalItemsOriginal, setTotalItemsOriginal] = useState(0);
  const [totalItemsRemaining, setTotalItemsRemaining] = useState(0);

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const res = await api.get('/dashboard/inventory-summary');
      setInventory(res.data);

      let soldVal = 0;
      let remainVal = 0;
      let itemsOrg = 0;
      let itemsRemain = 0;
      let totalPotentialVal = 0;

      res.data.forEach(item => {
        soldVal += item.total_sold_revenue;
        remainVal += item.remaining_value;
        itemsOrg += item.total_quantity;
        itemsRemain += item.remaining_stock;
        totalPotentialVal += item.total_potential_value;
      });

      setTotalPotentialValue(totalPotentialVal);
      setTotalRemainingValue(remainVal);
      setTotalItemsOriginal(itemsOrg);
      setTotalItemsRemaining(soldVal);
      setInventory(res.data.map(item => ({ ...item, total_remaining_qty: item.remaining_stock }))); 

    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.error || t('error'), 'error');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(price);
  };

  if (loading) {
    return <div className="admin-page"><div className="admin-container"><p>{t('loading')}</p></div></div>;
  }

  return (
    <div className="admin-page">
      <div className="admin-container">
        <div className="admin-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h1 className="admin-title" style={{ margin: 0 }}>{t('inv_title')}</h1>
          <button 
            onClick={handleExportPDF}
            className="export-pdf-btn"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              backgroundColor: '#6366F1',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            {t('adm_export_pdf') || 'Export PDF'}
          </button>
        </div>

        <div className="inventory-stats-grid">
          <div className="stat-card">
            <h3 className="stat-card-title">{t('inv_th_total_qty')}</h3>
            <p className="stat-value">{totalItemsOriginal} <span className="unit-text">{t('pd_items_unit')}</span></p>
          </div>
          <div className="stat-card success">
            <h3 className="stat-card-title">{t('inv_th_sold')}</h3>
            <p className="stat-value">{formatPrice(totalItemsRemaining)}</p>
            <span className="stat-sub-label">{t('inv_th_sold_qty')}: {inventory.reduce((sum, item) => sum + item.total_sold, 0)} {t('pd_items_unit')}</span>
          </div>
          <div className="stat-card info">
            <h3 className="stat-card-title">{t('inv_th_remain')}</h3>
            <p className="stat-value">{formatPrice(totalRemainingValue)}</p>
            <span className="stat-sub-label">{t('inv_th_remain_qty')}: {inventory.reduce((sum, item) => sum + item.remaining_stock, 0)} {t('pd_items_unit')}</span>
          </div>
          <div className="stat-card warning">
            <h3 className="stat-card-title">{t('inv_th_total_val')}</h3>
            <p className="stat-value">{formatPrice(totalPotentialValue)}</p>
          </div>
        </div>

        <div className="table-responsive">
          <table className="admin-table inventory-split-table">
            <thead>
              <tr className="header-group-row">
                <th rowSpan="2">{t('inv_th_product')}</th>
                <th rowSpan="2">{t('inv_th_price')}</th>
                <th colSpan="3" className="group-header qty-group">{t('nav_products')} (Qty)</th>
                <th colSpan="3" className="group-header financial-group">{t('adm_financial_summary') || 'Financial Summary (฿)'}</th>
              </tr>
              <tr className="header-sub-row">
                <th className="sub-th">{t('inv_th_total_qty')}</th>
                <th className="sub-th">{t('inv_th_sold_qty')}</th>
                <th className="sub-th">{t('inv_th_remain_qty')}</th>
                <th className="sub-th">{t('inv_th_sold')}</th>
                <th className="sub-th">{t('inv_th_remain')}</th>
                <th className="sub-th">{t('inv_th_total_val')}</th>
              </tr>
            </thead>
            <tbody>
              {(() => {
                const indexOfLastItem = currentPage * itemsPerPage;
                const indexOfFirstItem = indexOfLastItem - itemsPerPage;
                const currentItems = inventory.slice(indexOfFirstItem, indexOfLastItem);

                if (currentItems.length === 0) {
                  return (
                    <tr>
                      <td colSpan="8" style={{ textAlign: 'center', padding: '2rem' }}>
                        {t('nav_no_found')}
                      </td>
                    </tr>
                  );
                }

                return currentItems.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div className="inv-product-cell">
                        <img 
                          src={item.image_url?.startsWith('/uploads') ? `http://localhost:5000${item.image_url}` : item.image_url} 
                          alt={item.name} 
                          className="inv-product-img" 
                        />
                        <div className="inv-product-info">
                          <span className="inv-code">{item.product_code}</span>
                          <span className="inv-name">{item.name}</span>
                          <span className="inv-brand">{item.brand} - {item.category === 'shoe' ? t('nav_shoes') : (item.category === 'apparel' ? t('nav_apparel') : item.category)}</span>
                        </div>
                      </div>
                    </td>
                    <td className="price-td unit-price-col"><strong>{formatPrice(item.price)}</strong></td>
                    <td className="center-td"><strong>{item.total_quantity}</strong></td>
                    <td className="center-td">{item.total_sold}</td>
                    <td className="center-td">
                      <span className={`qty-remain-badge ${item.remaining_stock === 0 ? 'out' : ''}`}>
                        {item.remaining_stock}
                      </span>
                    </td>
                    <td className="right-td highlight-sold">{formatPrice(item.total_sold_revenue || (item.total_sold * item.price) || 0)}</td>
                    <td className="right-td highlight-remain">{formatPrice(item.remaining_value || (item.remaining_stock * item.price) || 0)}</td>
                    <td className="right-td highlight-total">{formatPrice(item.total_potential_value || ((item.total_sold + item.remaining_stock) * item.price) || 0)}</td>
                  </tr>
                ));
              })()}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls - Standardized and Sliding Window */}
        {inventory.length > itemsPerPage && (
          <div className="pagination" style={{ marginTop: '1.5rem', justifyContent: 'center' }}>
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="page-btn"
            >
              {t('adm_prev') || 'Prev'}
            </button>

            {getPageNumbers().map(pageNum => (
              <button
                key={pageNum}
                onClick={() => setCurrentPage(pageNum)}
                className={`page-btn ${currentPage === pageNum ? 'active' : ''}`}
              >
                {pageNum}
              </button>
            ))}

            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(inventory.length / itemsPerPage)))}
              disabled={currentPage === Math.ceil(inventory.length / itemsPerPage)}
              className="page-btn"
            >
              {t('adm_next') || 'Next'}
            </button>

            <div className="page-jump">
              <span>{t('adm_page_label') || (useLanguage().language === 'th' ? 'หน้า:' : 'Page:')}</span>
              <select
                value={currentPage}
                onChange={(e) => setCurrentPage(Number(e.target.value))}
                className="page-select"
              >
                {[...Array(Math.ceil(inventory.length / itemsPerPage))].map((_, i) => (
                  <option key={i + 1} value={i + 1}>{i + 1}</option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminInventory;
