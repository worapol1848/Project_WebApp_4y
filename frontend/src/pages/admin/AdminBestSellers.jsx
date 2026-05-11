import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import api from '../../services/api';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import './AdminDashboard.css';
import './AdminBestSellers.css';

const RankBadge = ({ rank }) => {
  const getColors = () => {
    switch (rank) {
      case 1: return { main: '#FBBF24', border: '#D97706', text: '#92400E' };
      case 2: return { main: '#94A3B8', border: '#475569', text: '#1E293B' };
      case 3: return { main: '#B45309', border: '#78350F', text: '#451A03' };
      default: return { main: '#F1F5F9', border: '#CBD5E1', text: '#475569' };
    }
  };

  const colors = getColors();

  return (
    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="rank-svg">
      <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
        fill={colors.main}
        stroke={colors.border}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <text x="50%" y="65%" textAnchor="middle" fill={colors.text} fontSize="8" fontWeight="bold" fontFamily="Arial">{rank}</text>
    </svg>
  );
};

const AdminBestSellers = () => {
  const { t } = useLanguage();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedBrand, setSelectedBrand] = useState('All');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const itemsPerPage = 5;

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/dashboard');
        setStats(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', maximumFractionDigits: 0 }).format(amount);
  };

  const handleExportPDF = async () => {
    try {
      if (bestSellers.length === 0) {
        alert("No data available to export.");
        return;
      }

      const doc = new jsPDF('l', 'mm', 'a4'); 
      const today = new Date();
      const reportDate = today.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
      const reportTime = today.toLocaleTimeString('en-US', { hour12: false });
      const reportId = `BST-${today.getFullYear()}${(today.getMonth() + 1).toString().padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`;

      
      doc.setFillColor(16, 185, 129); 
      doc.rect(14, 15, 2, 25, 'F');

      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(17, 24, 39);
      doc.text('VELLIN', 20, 25);

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(107, 114, 128);
      doc.text('Official Catalog & Performance Hub', 20, 31);
      doc.text('123 Business Parkway, Suite 500, Bangkok, TH', 20, 36);

      
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(31, 41, 55);
      doc.text('BEST SELLERS PERFORMANCE AUDIT', 283, 30, { align: 'right' });

      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(107, 114, 128);
      doc.text(`Document ID: ${reportId}`, 283, 36, { align: 'right' });
      doc.text(`Generated: ${reportDate} | ${reportTime}`, 283, 41, { align: 'right' });
      doc.text(`Source: Admin Dashboard / Top Products Showcase`, 283, 46, { align: 'right' });

      
      doc.setDrawColor(229, 231, 235);
      doc.setLineWidth(0.5);
      doc.line(14, 48, 283, 48);

      
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(31, 41, 55);
      doc.text('REPORT CONTEXT:', 14, 55);
      doc.setFont('helvetica', 'normal');
      doc.text(`Comparative analysis of ${bestSellers.length} products. Filter: ${selectedBrand === 'All' ? 'All Brands' : `Brand - ${selectedBrand}`}. Sorted by Sales Qty.`, 45, 55);

      
      const sortedBestSellers = [...bestSellers].sort((a, b) => b.total_sold - a.total_sold);

      const tableData = sortedBestSellers.map((p, idx) => [
        { content: (idx + 1).toString(), styles: { fontStyle: 'bold', halign: 'center' } },
        p.product_code || 'N/A',
        p.name,
        p.brand || '-',
        p.category || '-',
        { content: `${p.total_sold} Units`, styles: { halign: 'center', fontStyle: 'bold' } },
        { content: `THB ${Number(p.total_revenue || 0).toLocaleString()}`, styles: { halign: 'right' } },
        { content: idx === 0 ? 'PEAK' : idx < 3 ? 'TOP TIER' : 'STABLE', styles: { halign: 'center', textColor: idx < 3 ? [16, 185, 129] : [107, 114, 128] } }
      ]);

      autoTable(doc, {
        startY: 62,
        head: [['Rank', 'Product ID', 'Product Description', 'Brand', 'Category', 'Units Sold', 'Total Revenue', 'Status']],
        body: tableData,
        theme: 'grid',
        headStyles: {
          fillColor: [31, 41, 55], 
          textColor: 255,
          fontSize: 9,
          fontStyle: 'bold',
          halign: 'center',
          cellPadding: 4
        },
        styles: {
          fontSize: 8.5,
          cellPadding: 3,
          valign: 'middle',
          lineColor: [229, 231, 235]
        },
        columnStyles: {
          0: { cellWidth: 15 },
          1: { cellWidth: 30 },
          2: { cellWidth: 70 },
          5: { cellWidth: 25 },
          6: { cellWidth: 35 },
          7: { cellWidth: 25 }
        },
        alternateRowStyles: {
          fillColor: [250, 250, 251]
        },
        margin: { top: 62, bottom: 40 }
      });


      
      const finalY = doc.lastAutoTable.finalY || 150;
      const signatureY = finalY + 30;
      const safeSignatureY = signatureY < 165 ? 165 : signatureY;

      doc.setDrawColor(203, 213, 225);
      doc.setLineWidth(0.3);
      
      
      doc.line(14, safeSignatureY, 84, safeSignatureY);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(107, 114, 128);
      doc.text('Authorized Signature (Department Head)', 14, safeSignatureY + 5);
      doc.text('Date: ____________________', 14, safeSignatureY + 10);

      
      doc.line(213, safeSignatureY, 283, safeSignatureY);
      doc.text('Inventory Operations Review', 213, safeSignatureY + 5);
      doc.text('Date: ____________________', 213, safeSignatureY + 10);

      
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setDrawColor(229, 231, 235);
        doc.setLineWidth(0.5);
        doc.line(14, 198, 283, 198);

        doc.setFontSize(8);
        doc.setTextColor(107, 114, 128);
        doc.text(`VELLIN Official Performance Analytics - Internal Use Only`, 14, 204);
        doc.text(`Page ${i} of ${pageCount}`, 283, 204, { align: 'right' });
      }

      doc.save(`Vellin_BestSellers_Report_${new Date().toISOString().split('T')[0]}.pdf`);

      
      try {
        await api.post('/logs/manual', {
          action: 'Export PDF',
          entity_type: 'BEST SELLERS',
          entity_id: 'SYSTEM_REPORT',
          details: {
            report_name: 'Best Sellers Performance Audit',
            report_id: reportId,
            products_count: bestSellers.length,
            generated_at: new Date().toLocaleString('th-TH')
          }
        });
      } catch (logErr) {
        console.error('Failed to log PDF export:', logErr);
      }

    } catch (err) {
      console.error('PDF Export Error:', err);
      alert('Failed to generate PDF. Please try again.');
    }
  };

  // When selectedBrand changes, reset page to 1
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedBrand]);

  if (loading) return <div className="admin-container">{t('adm_loading_best_sellers')}</div>;

  const allBestSellers = (stats?.bestSellers || []).sort((a, b) => {
    if (b.total_sold !== a.total_sold) {
      return b.total_sold - a.total_sold;
    }
    return b.total_revenue - a.total_revenue;
  });

  const uniqueBrands = ['All', ...new Set(allBestSellers.map(p => p.brand).filter(Boolean))];

  const bestSellers = selectedBrand === 'All' 
    ? allBestSellers 
    : allBestSellers.filter(p => p.brand === selectedBrand);

  const topOne = bestSellers[0];
  const topTwoThree = bestSellers.slice(1, 3);


  
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = bestSellers.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(bestSellers.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const getPageNumbers = () => {
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

  return (
    <div className="admin-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2 className="dashboard-title" style={{ margin: 0 }}>{t('adm_top_products_showcase')}</h2>
        
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          <div className="custom-dropdown-container" ref={dropdownRef}>
            <div 
              className={`custom-dropdown-header ${isDropdownOpen ? 'open' : ''}`}
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            >
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px', color: '#6366F1' }}>
                  <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
                </svg>
                <span>{selectedBrand === 'All' ? (t('adm_filter_all_brands') || 'All Brands') : selectedBrand}</span>
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: '12px', transition: 'transform 0.2s ease', transform: isDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </div>
            {isDropdownOpen && (
              <div className="custom-dropdown-list">
                {uniqueBrands.map(b => (
                  <div 
                    key={b} 
                    className={`custom-dropdown-item ${selectedBrand === b ? 'active' : ''}`}
                    onClick={() => { setSelectedBrand(b); setIsDropdownOpen(false); }}
                  >
                    <span>{b === 'All' ? (t('adm_filter_all_brands') || 'All Brands') : b}</span>
                    {selectedBrand === b && (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6366F1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={handleExportPDF}
            className="export-pdf-btn"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            {t('adm_print_hub_report')}
          </button>
        </div>
      </div>

      {topOne && (
        <div className="podium-container">
          {/* Top 2 */}
          {topTwoThree[0] && (
            <div className="podium-item place-2">
              <div className="podium-rank-svg"><RankBadge rank={2} /></div>
              <div className="podium-img-wrapper">
                <img src={topTwoThree[0].image_url ? `http://localhost:5000${topTwoThree[0].image_url}` : 'https://via.placeholder.com/150'} alt={topTwoThree[0].name} />
              </div>
              <h4 className="podium-name">{topTwoThree[0].name}</h4>
              <p className="podium-pid">{topTwoThree[0].product_code || 'No ID'}</p>
              <div className="podium-stats">
                <div className="podium-sales-focus">{topTwoThree[0].total_sold} {t('adm_units')}</div>
                <div className="podium-rev">{formatCurrency(topTwoThree[0].total_revenue)}</div>
              </div>
            </div>
          )}

          {/* Top 1 */}
          <div className="podium-item place-1">
            <div className="podium-crown-medal"><RankBadge rank={1} /></div>
            <div className="podium-img-wrapper">
              <img src={topOne.image_url ? `http://localhost:5000${topOne.image_url}` : 'https://via.placeholder.com/200'} alt={topOne.name} />
            </div>
            <h4 className="podium-name">{topOne.name}</h4>
            <p className="podium-pid" style={{ color: '#D97706', fontWeight: 'bold' }}>{topOne.product_code || 'No ID'}</p>
            <p className="podium-brand">{topOne.brand || topOne.category || 'Premium'}</p>
            <div className="podium-stats">
              <div className="podium-sales-focus premium-sales-focus">{topOne.total_sold} {t('adm_units_sold')}</div>
              <div className="podium-rev premium-rev">{t('adm_revenue_label')} {formatCurrency(topOne.total_revenue)}</div>
            </div>
            <div className="podium-label">{t('adm_top_performance')}</div>
          </div>

          {/* Top 3 */}
          {topTwoThree[1] && (
            <div className="podium-item place-3">
              <div className="podium-rank-svg"><RankBadge rank={3} /></div>
              <div className="podium-img-wrapper">
                <img src={topTwoThree[1].image_url ? `http://localhost:5000${topTwoThree[1].image_url}` : 'https://via.placeholder.com/150'} alt={topTwoThree[1].name} />
              </div>
              <h4 className="podium-name">{topTwoThree[1].name}</h4>
              <p className="podium-pid">{topTwoThree[1].product_code || 'No ID'}</p>
              <div className="podium-stats">
                <div className="podium-sales-focus">{topTwoThree[1].total_sold} {t('adm_units')}</div>
                <div className="podium-rev">{formatCurrency(topTwoThree[1].total_revenue)}</div>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="dashboard-sections" style={{ gridTemplateColumns: '1fr', marginTop: '3rem' }}>
        <div className="section-card">
          <h3 style={{ display: 'flex', alignItems: 'center' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#6366F1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '10px' }}>
              <path d="M12 20v-6M6 20V10M18 20V4" />
            </svg>
            {t('adm_full_catalog_performance')}
          </h3>
          <div className="section-content">
            {!bestSellers || bestSellers.length === 0 ? (
              <p className="no-data">{t('adm_no_sales_data')}</p>
            ) : (
              <div className="bestsellers-table-wrapper">
                <table className="styled-table">
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'center', width: '80px' }}>{t('adm_rank')}</th>
                      <th style={{ textAlign: 'center', width: '120px' }}>{t('adm_product_id')}</th>
                      <th style={{ textAlign: 'left' }}>{t('adm_product_details')}</th>
                      <th style={{ textAlign: 'center' }}>{t('adm_category')}</th>
                      <th style={{ textAlign: 'center', width: '120px' }}>{t('adm_sales_volume')}</th>
                      <th style={{ textAlign: 'right', width: '150px' }}>{t('adm_revenue_gross')}</th>
                      <th style={{ textAlign: 'center', width: '120px' }}>{t('adm_status')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentItems.map((p, idx) => {
                      const absoluteIndex = indexOfFirstItem + idx;
                      return (
                        <tr key={`${p.id}-${absoluteIndex}`}>
                          <td style={{ textAlign: 'center' }}>
                            <RankBadge rank={absoluteIndex + 1} />
                          </td>
                          <td>
                            <span className="product-id-badge">{p.product_code || 'N/A'}</span>
                          </td>
                          <td>
                            <div className="product-table-cell">
                              <img src={p.image_url ? `http://localhost:5000${p.image_url}` : 'https://via.placeholder.com/60'} alt={p.name} className="product-mini-thumbnail" />
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                <span className="product-name" style={{ fontSize: '1rem' }}>{p.name}</span>
                                {p.brand && <span className="product-brand">{p.brand}</span>}
                              </div>
                            </div>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <span className="category-pill">{p.category || '-'}</span>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <div className="units-pill-prominent">
                              <span className="units-count">{p.total_sold}</span>
                              <span className="units-label">{t('adm_sold')}</span>
                            </div>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <span className="revenue-text-secondary">{formatCurrency(p.total_revenue)}</span>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <span className={`status-pill ${absoluteIndex < 3 ? 'status-top' : 'status-stable'}`}>
                              {absoluteIndex === 0 ? t('adm_status_peak') : absoluteIndex < 3 ? t('adm_status_top_tier') : t('adm_status_stable')}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Pagination Controls - Moved Outside and Added Sliding Window */}
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

export default AdminBestSellers;
