// code in this file is written by worapol สุดหล่อ
import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import MiniCalendar from '../../components/MiniCalendar';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import './AdminDashboard.css';

const CHART_COLORS = ['#6366F1', '#10B981', '#F59E0B', '#EF4444', '#3B82F6', '#8B5CF6'];

const AdminRevenue = () => {
  const today = new Date().toISOString().split('T')[0];
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [salesStats, setSalesStats] = useState([]);
  const [fetchingStats, setFetchingStats] = useState(true);
  const [chartView, setChartView] = useState('week');
  const [chartType, setChartType] = useState('area'); // 'area', 'bar', 'pie' - by worapol สุดหล่อ
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [showYearDropdown, setShowYearDropdown] = useState(false);
  const [showBrandDropdown, setShowBrandDropdown] = useState(false);
  const [brands, setBrands] = useState([]);
  const [selectedBrand, setSelectedBrand] = useState('All');

  const handleExportPDF = async () => {
    try {
      if (selectedProducts.length === 0) {
        alert("Please select at least one product to export.");
        return;
      }

      const doc = new jsPDF('l', 'mm', 'a4'); // Landscape for better visibility - by worapol สุดหล่อ
      const today = new Date();
      const reportDate = today.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
      const reportTime = today.toLocaleTimeString('en-US', { hour12: false });
      const reportId = `REV-${today.getFullYear()}${(today.getMonth() + 1).toString().padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`;

      // --- BRANDING & HEADER --- - by worapol สุดหล่อ
      // Sidebar accent line - by worapol สุดหล่อ
      doc.setFillColor(79, 70, 229); // Indigo 600 - by worapol สุดหล่อ
      doc.rect(14, 15, 2, 25, 'F');

      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(17, 24, 39);
      doc.text('VELLIN', 20, 25);

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(107, 114, 128);
      doc.text('Official Financial Units & Inventory Analysis', 20, 31);
      doc.text('123 Business Parkway, Suite 500, Bangkok, TH', 20, 36);

      // Report Title - Centered logic - by worapol สุดหล่อ
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(31, 41, 55);
      doc.text('REVENUE PERFORMANCE AUDIT', 283, 30, { align: 'right' });

      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(107, 114, 128);
      doc.text(`Document ID: ${reportId}`, 283, 36, { align: 'right' });
      doc.text(`Generated: ${reportDate} | ${reportTime}`, 283, 41, { align: 'right' });
      doc.text(`Source: Admin Dashboard / Revenue Breakdown`, 283, 46, { align: 'right' });

      // Horizontal Divider - by worapol สุดหล่อ
      doc.setDrawColor(229, 231, 235);
      doc.setLineWidth(0.5);
      doc.line(14, 48, 283, 48);

      // Metadata Info - by worapol สุดหล่อ
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(31, 41, 55);
      doc.text('REPORT SCOPE:', 14, 55);
      doc.setFont('helvetica', 'normal');
      doc.text(`Analysis covering ${selectedProducts.length} items. Filter: ${selectedBrand !== 'All' ? `Brand [${selectedBrand}]` : 'Full Catalog'}. Sorted by Revenue.`, 45, 55);

      doc.setFont('helvetica', 'bold');
      doc.text('PREPARED BY:', 14, 60);
      doc.setFont('helvetica', 'normal');
      doc.text('System Administrator - VELLIN ERP Hub', 45, 60);

      // --- DATA PREPARATION --- - by worapol สุดหล่อ
      const selectedData = revenueDetails
        .filter(item => selectedProducts.includes(item.product_name))
        .sort((a, b) => parseFloat(b.total_revenue) - parseFloat(a.total_revenue));
      const exportData = selectedData.map(item => [
        item.product_code || 'N/A',
        item.product_name,
        item.last_sold_date ? new Date(item.last_sold_date).toLocaleDateString() : '-',
        item.brand || '-',
        item.category.toUpperCase(),
        { content: item.total_quantity.toLocaleString(), styles: { halign: 'center' } },
        { content: `THB ${Number(item.total_revenue || 0).toLocaleString()}`, styles: { halign: 'right' } }
      ]);

      // --- TABLE DESIGN --- - by worapol สุดหล่อ
      autoTable(doc, {
        startY: 65,
        head: [['Product ID', 'Product Description', 'Last Sold', 'Brand', 'Category', 'Units Sold', 'Total Revenue']],
        body: exportData,
        theme: 'grid',
        headStyles: {
          fillColor: [31, 41, 55], // Deep Slate 800 - by worapol สุดหล่อ
          textColor: 255,
          fontSize: 9,
          fontStyle: 'bold',
          halign: 'center',
          cellPadding: 4
        },
        styles: {
          fontSize: 8,
          cellPadding: 3,
          valign: 'middle',
          lineColor: [229, 231, 235]
        },
        columnStyles: {
          0: { cellWidth: 25, fontStyle: 'bold' },
          1: { cellWidth: 70 },
          2: { halign: 'center', cellWidth: 25 },
          3: { halign: 'center', cellWidth: 30 },
          4: { halign: 'center', cellWidth: 30 },
          5: { cellWidth: 25 },
          6: { cellWidth: 40, fontStyle: 'bold' }
        },
        alternateRowStyles: {
          fillColor: [250, 250, 251]
        },
        margin: { top: 65, bottom: 40 }
      });

      // --- TOTALS & SUMMARY --- - by worapol สุดหล่อ
      const totalRevenue = selectedData.reduce((sum, item) => sum + parseFloat(item.total_revenue), 0);
      const totalUnits = selectedData.reduce((sum, item) => sum + parseInt(item.total_quantity), 0);
      const finalY = doc.lastAutoTable.finalY || 150;

      // Summary Box - by worapol สุดหล่อ
      const summaryBoxY = finalY + 10;
      doc.setFillColor(248, 250, 252);
      doc.rect(203, summaryBoxY, 80, 22, 'F');
      doc.setDrawColor(226, 232, 240);
      doc.rect(203, summaryBoxY, 80, 22, 'S');

      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.text('Total Volume:', 208, summaryBoxY + 8);
      doc.text(`${totalUnits.toLocaleString()} Units`, 278, summaryBoxY + 8, { align: 'right' });

      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text('NET REVENUE (THB):', 208, summaryBoxY + 16);
      doc.text(`THB ${totalRevenue.toLocaleString()}`, 278, summaryBoxY + 16, { align: 'right' });

      // --- SIGNATURE SECTION --- - by worapol สุดหล่อ
      const signatureY = finalY + 45;
      
      // Prevent signature from overlaying the summary - by worapol สุดหล่อ
      const safeSignatureY = signatureY < 165 ? 165 : signatureY;

      doc.setDrawColor(203, 213, 225);
      doc.setLineWidth(0.3);
      
      // Admin Signature - by worapol สุดหล่อ
      doc.line(14, safeSignatureY, 84, safeSignatureY);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(107, 114, 128);
      doc.text('Authorized Signature (Administrator)', 14, safeSignatureY + 5);
      doc.text(`Signed Date: ${today.toLocaleDateString()} ________________`, 14, safeSignatureY + 10);

      // Financial Officer Signature - by worapol สุดหล่อ
      doc.line(213, safeSignatureY, 283, safeSignatureY);
      doc.text('Reporting Officer Approval', 213, safeSignatureY + 5);
      doc.text(`Signed Date: ${today.toLocaleDateString()} ________________`, 213, safeSignatureY + 10);

      // --- FOOTER & PERSISTENT ELEMENTS --- - by worapol สุดหล่อ
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setDrawColor(229, 231, 235);
        doc.setLineWidth(0.5);
        doc.line(14, 198, 283, 198); // Landscape Footer line - by worapol สุดหล่อ

        doc.setFontSize(8);
        doc.setTextColor(107, 114, 128);
        doc.setFont('helvetica', 'normal');
        doc.text(`VELLIN Official Financial Document - Confidential & Restricted`, 14, 204);
        doc.text(`Page ${i} of ${pageCount}`, 283, 204, { align: 'right' });
      }

      // Save PDF - by worapol สุดหล่อ
      doc.save(`Vellin_Revenue_Audit_${new Date().toISOString().split('T')[0]}.pdf`);

      // 🔍 LOG ACTION to Activity Logs - by worapol สุดหล่อ
      try {
        await api.post('/logs/manual', {
          action: 'Export PDF',
          entity_type: 'REVENUE',
          entity_id: 'SYSTEM_REPORT',
          details: {
            report_name: 'Revenue Performance Audit',
            report_id: reportId,
            products_count: selectedProducts.length,
            generated_at: new Date().toLocaleString('th-TH')
          }
        });
      } catch (logErr) {
        console.error('Failed to log PDF export:', logErr);
      }

    } catch (error) {
      console.error("PDF Export Error:", error);
      alert("Something went wrong while generating the PDF. Please try again.");
    }
  };

  const exportMonthlyPDF = async () => {
    try {
      const doc = new jsPDF('p', 'mm', 'a4');
      const today = new Date();
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const monthStr = monthNames[reportMonth - 1];
      const reportDate = today.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
      const reportId = `MTH-${reportYear}${String(reportMonth).padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`;

      doc.setFillColor(16, 185, 129);
      doc.rect(14, 15, 2, 25, 'F');
      
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(17, 24, 39);
      doc.text('VELLIN', 20, 25);
      
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(107, 114, 128);
      doc.text('Performance Tracking & Data Analytics', 20, 31);
      doc.text('123 Business Parkway, Suite 500, Bangkok, TH', 20, 36);

      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(31, 41, 55);
      doc.text('MONTHLY PERFORMANCE LOG', 196, 30, { align: 'right' });

      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(107, 114, 128);
      doc.text(`Document ID: ${reportId}`, 196, 36, { align: 'right' });
      doc.text(`Generated: ${reportDate}`, 196, 41, { align: 'right' });
      doc.text(`For Period: ${monthStr} ${reportYear}`, 196, 46, { align: 'right' });

      doc.setDrawColor(229, 231, 235);
      doc.setLineWidth(0.5);
      doc.line(14, 50, 196, 50);

      const tableData = monthlyReport.map(row => [
        new Date(row.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }),
        Number(row.order_count).toLocaleString(),
        `${Number(row.total_items).toLocaleString()} items`,
        Number(row.daily_revenue || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      ]);

      const totalOrders = monthlyReport.reduce((s, r) => s + r.order_count, 0);
      const totalItems = monthlyReport.reduce((s, r) => s + parseInt(r.total_items || 0), 0);
      const totalRevenue = monthlyReport.reduce((s, r) => s + parseFloat(r.daily_revenue || 0), 0);

      tableData.push([
        { content: 'MONTHLY TOTAL', styles: { fontStyle: 'bold', fillColor: [248, 250, 252] } },
        { content: Number(totalOrders).toLocaleString(), styles: { fontStyle: 'bold', fillColor: [248, 250, 252], halign: 'right' } },
        { content: `${Number(totalItems).toLocaleString()} items`, styles: { fontStyle: 'bold', textColor: [59, 130, 246], fillColor: [248, 250, 252], halign: 'right' } },
        { content: Number(totalRevenue).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }), styles: { fontStyle: 'bold', textColor: [16, 185, 129], fillColor: [248, 250, 252], halign: 'right' } }
      ]);

      autoTable(doc, {
        startY: 58,
        head: [['Date', 'Orders', 'Units Sold', 'Daily Revenue (THB)']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [31, 41, 55], textColor: 255, fontSize: 9, fontStyle: 'bold' },
        styles: { fontSize: 8, cellPadding: 4, valign: 'middle' },
        columnStyles: {
          0: { cellWidth: 50 },
          1: { cellWidth: 30, halign: 'right' },
          2: { cellWidth: 40, halign: 'right' },
          3: { cellWidth: 50, halign: 'right' }
        },
        alternateRowStyles: { fillColor: [250, 250, 251] }
      });

      const finalY = doc.lastAutoTable.finalY + 30;
      doc.setDrawColor(203, 213, 225);
      doc.setLineWidth(0.3);

      doc.line(14, finalY, 84, finalY);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(107, 114, 128);
      doc.text('Authorized Signature (Administrator)', 14, finalY + 5);
      doc.text(`Signed Date: ${today.toLocaleDateString()}`, 14, finalY + 10);

      doc.line(126, finalY, 196, finalY);
      doc.text('Reporting Officer Approval', 126, finalY + 5);
      doc.text(`Signed Date: ${today.toLocaleDateString()}`, 126, finalY + 10);

      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(7);
        doc.setTextColor(156, 163, 175);
        doc.text('VELLIN Internal Performance Report', 14, 285);
        doc.text(`Page ${i} of ${pageCount}`, 196, 285, { align: 'right' });
      }

      doc.save(`Vellin_MonthlyLog_${reportYear}_${String(reportMonth).padStart(2, '0')}.pdf`);

      await api.post('/logs/manual', {
        action: 'Export PDF',
        entity_type: 'REVENUE',
        entity_id: 'MONTHLY_REPORT',
        details: { report_name: 'Monthly Daily Performance Log', month: reportMonth, year: reportYear }
      });
    } catch (error) {
      console.error("PDF Export Error:", error);
      alert("Failed to generate PDF monthly report.");
    }
  };


  const [selectedDate, setSelectedDate] = useState(today);
  const [dailyStats, setDailyStats] = useState(null);
  const [fetchingDaily, setFetchingDaily] = useState(false);
  const [revenueDetails, setRevenueDetails] = useState([]);
  const [fetchingDetails, setFetchingDetails] = useState(true);
  const [tableLimit, setTableLimit] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [selectedProducts, setSelectedProducts] = useState([]);

  const [monthlyReport, setMonthlyReport] = useState([]);
  const [reportMonth, setReportMonth] = useState(new Date().getMonth() + 1);
  const [reportYear, setReportYear] = useState(new Date().getFullYear());
  const [fetchingReport, setFetchingReport] = useState(false);

  const fetchMonthlyReport = async (month, year) => {
    setFetchingReport(true);
    try {
      const res = await api.get(`/dashboard/monthly-report?month=${month}&year=${year}`);
      setMonthlyReport(res.data);
    } catch (err) { console.error(err); } finally { setFetchingReport(false); }
  };

  useEffect(() => {
    fetchMonthlyReport(reportMonth, reportYear);
  }, [reportMonth, reportYear]);

  useEffect(() => {
    fetchStats();
    fetchBrands();
  }, []);

  useEffect(() => {
    fetchRevenueDetails(tableLimit, selectedBrand);
  }, [tableLimit, selectedBrand]);

  const fetchRevenueDetails = async (limit = tableLimit, brand = selectedBrand) => {
    setFetchingDetails(true);
    try {
      let url = limit ? `/dashboard/revenue-details?limit=${limit}` : '/dashboard/revenue-details';
      if (brand && brand !== 'All') {
        url += (url.includes('?') ? '&' : '?') + `brand=${encodeURIComponent(brand)}`;
      }
      const res = await api.get(url);
      setRevenueDetails(res.data);
      // Automatically select all when data is fetched - by worapol สุดหล่อ
      setSelectedProducts(res.data.map(item => item.product_name));
    } catch (err) {
      console.error(err);
    } finally {
      setFetchingDetails(false);
      setCurrentPage(1); // Reset to first page on new fetch - by worapol สุดหล่อ
    }
  };

  const fetchBrands = async () => {
    try {
      const res = await api.get('/dashboard/brands');
      setBrands(['All', ...res.data]);
    } catch (err) {
      console.error('Error fetching brands:', err);
    }
  };

  const toggleSelectAll = () => {
    if (selectedProducts.length === revenueDetails.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(revenueDetails.map(item => item.product_name));
    }
  };

  const toggleProductSelection = (name) => {
    setSelectedProducts(prev =>
      prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]
    );
  };

  useEffect(() => {
    fetchSalesStats(chartView, selectedYear);
  }, [chartView, selectedYear]);

  useEffect(() => {
    if (selectedDate) fetchDailyStats(selectedDate);
  }, [selectedDate]);

  useEffect(() => {
    const handleClickOutside = () => {
      setShowYearDropdown(false);
      setShowBrandDropdown(false);
    };
    if (showYearDropdown || showBrandDropdown) {
      window.addEventListener('click', handleClickOutside);
    }
    return () => window.removeEventListener('click', handleClickOutside);
  }, [showYearDropdown, showBrandDropdown]);

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

  const fetchDailyStats = async (date) => {
    setFetchingDaily(true);
    try {
      const res = await api.get(`/dashboard/daily-sales?date=${date}`);
      setDailyStats(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setFetchingDaily(false);
    }
  };

  const fetchSalesStats = async (type = 'week', year = selectedYear) => {
    setFetchingStats(true);
    try {
      const res = await api.get(`/dashboard/sales-stats?type=${type}&year=${year}`);
      setSalesStats(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setFetchingStats(false);
    }
  };

  const renderMainChart = () => {
    if (chartType === 'area') {
      return (
        <AreaChart data={salesStats}>
          <defs>
            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366F1" stopOpacity={0.1} />
              <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12 }} dy={10} />
          <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12 }} tickFormatter={(val) => `฿${val >= 1000 ? (val / 1000) + 'k' : val}`} />
          <Tooltip
            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
            formatter={(val) => [`฿${val.toLocaleString()}`, 'Revenue']}
          />
          <Area type="monotone" dataKey="revenue" stroke="#6366F1" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" animationDuration={1000} />
        </AreaChart>
      );
    } else if (chartType === 'bar') {
      return (
        <BarChart data={salesStats}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12 }} dy={10} />
          <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12 }} tickFormatter={(val) => `฿${val >= 1000 ? (val / 1000) + 'k' : val}`} />
          <Tooltip
            cursor={{ fill: '#f3f4f6' }}
            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
            formatter={(val) => [`฿${val.toLocaleString()}`, 'Revenue']}
          />
          <Bar dataKey="revenue" fill="#6366F1" radius={[4, 4, 0, 0]} animationDuration={1000} />
        </BarChart>
      );
    } else {
      return (
        <PieChart>
          <Pie
            data={salesStats.filter(d => d.revenue > 0)}
            dataKey="revenue"
            cx="50%"
            cy="50%"
            outerRadius={120}
            fill="#8884d8"
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            animationDuration={1000}
          >
            {salesStats.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(val) => `฿${val.toLocaleString()}`} />
          <Legend />
        </PieChart>
      );
    }
  };

  if (loading) return <div className="admin-container">Loading Reports...</div>;

  const calcTrend = (current, previous) => {
    if (!previous || previous === 0) return current > 0 ? { val: '+100', dir: 'up' } : { val: '0.0', dir: 'flat' };
    const diff = ((current - previous) / previous) * 100;
    return {
      val: diff > 0 ? `+${diff.toFixed(1)}` : diff.toFixed(1),
      dir: diff > 0 ? 'up' : diff < 0 ? 'down' : 'flat'
    };
  };

  const todayTrend = stats ? calcTrend(stats.todaySales, stats.yesterdaySales) : { val: '0', dir: 'flat' };
  const monthTrend = stats ? calcTrend(stats.thisMonthSales, stats.lastMonthSales) : { val: '0', dir: 'flat' };

  return (
    <div className="admin-container">
      <h2 className="dashboard-title">Revenue Performance Hub</h2>

      <div className="revenue-split-layout">
        {/* Left Sidebar: Controls and Quick Stats */}
        <aside className="revenue-sidebar">

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Today's Revenue Card */}
            <div className="section-card" style={{ padding: '1.5rem', borderLeft: '4px solid #F59E0B' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <p style={{ color: '#64748B', fontSize: '0.85rem', fontWeight: '600', textTransform: 'uppercase', margin: 0 }}>Today's Revenue</p>
                <div style={{
                  padding: '4px 8px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px',
                  backgroundColor: todayTrend.dir === 'up' ? '#D1FAE5' : todayTrend.dir === 'down' ? '#FEE2E2' : '#F1F5F9',
                  color: todayTrend.dir === 'up' ? '#059669' : todayTrend.dir === 'down' ? '#DC2626' : '#64748B'
                }}>
                  {todayTrend.dir === 'up' && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="18 15 12 9 6 15"></polyline></svg>}
                  {todayTrend.dir === 'down' && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="6 9 12 15 18 9"></polyline></svg>}
                  {todayTrend.val}%
                </div>
              </div>
              <p style={{ fontSize: '2rem', fontWeight: '800', color: '#1E293B', margin: '0.5rem 0' }}>
                ฿{Number(stats?.todaySales || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <p style={{ fontSize: '0.8rem', color: '#94A3B8', margin: 0 }}>vs yesterday (฿{Number(stats?.yesterdaySales || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })})</p>
            </div>

            {/* This Month's Revenue Card */}
            <div className="section-card" style={{ padding: '1.5rem', borderLeft: '4px solid #6366F1' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <p style={{ color: '#64748B', fontSize: '0.85rem', fontWeight: '600', textTransform: 'uppercase', margin: 0 }}>This Month</p>
                <div style={{
                  padding: '4px 8px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px',
                  backgroundColor: monthTrend.dir === 'up' ? '#D1FAE5' : monthTrend.dir === 'down' ? '#FEE2E2' : '#F1F5F9',
                  color: monthTrend.dir === 'up' ? '#059669' : monthTrend.dir === 'down' ? '#DC2626' : '#64748B'
                }}>
                  {monthTrend.dir === 'up' && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="18 15 12 9 6 15"></polyline></svg>}
                  {monthTrend.dir === 'down' && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="6 9 12 15 18 9"></polyline></svg>}
                  {monthTrend.val}%
                </div>
              </div>
              <p style={{ fontSize: '2rem', fontWeight: '800', color: '#1E293B', margin: '0.5rem 0' }}>
                ฿{Number(stats?.thisMonthSales || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <p style={{ fontSize: '0.8rem', color: '#94A3B8', margin: 0 }}>vs last month (฿{Number(stats?.lastMonthSales || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })})</p>
            </div>

            {/* Lifetime Overview Row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '0.5rem' }}>
              <div className="section-card" style={{ padding: '1.25rem 1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                <p style={{ color: '#64748B', fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase', margin: '0 0 0.5rem 0' }}>Lifetime Revenue</p>
                <p style={{ fontSize: '1.2rem', fontWeight: '800', color: '#10B981', margin: 0 }}>฿{Number(stats?.totalSales || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              </div>
              <div className="section-card" style={{ padding: '1.25rem 1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                <p style={{ color: '#64748B', fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase', margin: '0 0 0.5rem 0' }}>Total Items</p>
                <p style={{ fontSize: '1.2rem', fontWeight: '800', color: '#3B82F6', margin: 0 }}>{Number(stats?.totalProductsSold || 0).toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="section-card daily-sales-section" style={{ width: '100%', padding: '1.75rem' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '1.5rem' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: 'middle' }}>
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
              Daily Sales Calendar
            </h3>
            <div className="daily-calendar-wrapper" style={{ margin: '0 0 2.5rem 0' }}>
              <MiniCalendar selectedDate={selectedDate} onChange={(newDate) => setSelectedDate(newDate)} />
            </div>
            <div className="daily-stats-inset" style={{ padding: '1rem' }}>
              <div className="inset-row"><span className="inset-label">Sales:</span><span className="inset-value price" style={{ fontSize: '1.1rem' }}>฿{Number(dailyStats?.sales || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
              <div className="inset-row"><span className="inset-label">Orders:</span><span className="inset-value">{Number(dailyStats?.orderCount || 0).toLocaleString()} items</span></div>
            </div>

            <div className="time-analysis-box" style={{ marginTop: '1.5rem', background: '#F8FAFC', borderRadius: '12px', padding: '15px' }}>
              <h4 style={{ fontSize: '0.9rem', color: '#1E293B', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6366F1" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                Peak Hours ({selectedDate})
              </h4>
              <div className="table-container" style={{ width: '100%', overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #E2E8F0', textAlign: 'left' }}>
                      <th style={{ padding: '8px 4px', color: '#64748B', fontWeight: '600' }}>Time Slot</th>
                      <th style={{ padding: '8px 4px', color: '#64748B', fontWeight: '600', textAlign: 'right' }}>Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dailyStats?.hourlyStats?.filter(h => h.revenue > 0).length > 0 ? (
                      dailyStats.hourlyStats.filter(h => h.revenue > 0)
                        .sort((a, b) => b.revenue - a.revenue)
                        .slice(0, 5)
                        .map((h, i) => (
                          <tr key={i} style={{ borderBottom: '1px solid #F1F5F9' }}>
                            <td style={{ padding: '10px 4px', color: '#475569', fontWeight: '500' }}>{h.time}</td>
                            <td style={{ padding: '10px 4px', color: '#10B981', fontWeight: '700', textAlign: 'right' }}>฿{h.revenue.toLocaleString()}</td>
                          </tr>
                        ))
                    ) : (
                      <tr>
                        <td colSpan="2" style={{ padding: '20px 0', color: '#94A3B8', textAlign: 'center', fontStyle: 'italic' }}>No sales data.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </aside>

        {/* Right Main Content: Chart and Detailed Summary */}
        <main className="revenue-main">
          <div className="chart-section section-card" style={{ margin: 0 }}>
            <div className="chart-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingBottom: '24px', borderBottom: '1px solid #F1F5F9' }}>
              <div className="chart-title-group">
                <h3 style={{ margin: 0, fontSize: '1.4rem', fontWeight: '800', color: '#1E293B', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#6366F1" strokeWidth="2.5"><path d="M12 20V10M18 20V4M6 20v-4" /></svg>
                  Revenue Statistics Analysis (THB)
                </h3>
                <p style={{ margin: '6px 0 0 0', fontSize: '0.875rem', color: '#64748B', fontWeight: '500', opacity: 0.8 }}>
                  Viewing Status: <span style={{ color: '#4F46E5', fontWeight: '700' }}>{chartView === 'week' ? 'Weekly Summary' : `Monthly Performance Breakdown (${selectedYear})`}</span>
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <div className="chart-type-selector" style={{ display: 'flex', background: '#F1F5F9', padding: '5px', borderRadius: '10px' }}>
                  <button className={`type-btn ${chartType === 'area' ? 'active' : ''}`} onClick={() => setChartType('area')}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 12L18 4L14 12L10 8L6 16H2V22H22V12Z" /></svg>
                  </button>
                  <button className={`type-btn ${chartType === 'bar' ? 'active' : ''}`} onClick={() => setChartType('bar')} style={{ marginLeft: '5px' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 20V10M12 20V4M6 20v-4" /></svg>
                  </button>
                  <button className={`type-btn ${chartType === 'pie' ? 'active' : ''}`} onClick={() => setChartType('pie')} style={{ marginLeft: '5px' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10" /><path d="M12 12L16 8M12 12V4" /></svg>
                  </button>
                </div>
                <div className="chart-view-toggle">
                  <button className={`toggle-btn ${chartView === 'week' ? 'active' : ''}`} onClick={() => setChartView('week')}>Week</button>
                  <button className={`toggle-btn ${chartView === 'year' && !showYearDropdown ? 'active' : ''}`} onClick={() => setChartView('year')}>Month</button>
                  <div className="custom-dropdown-container">
                    <button className={`toggle-btn year-toggle ${chartView === 'year' ? 'active' : ''}`} onClick={(e) => { e.stopPropagation(); setShowYearDropdown(!showYearDropdown); }}>
                      {selectedYear}
                    </button>
                    {showYearDropdown && (
                      <div className="year-dropdown-menu">
                        {[2024, 2025, 2026, 2027].map(y => (
                          <div key={y} className={`year-item ${selectedYear == y ? 'active' : ''}`} onClick={() => { setSelectedYear(y); setChartView('year'); setShowYearDropdown(false); }}>{y}</div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="chart-container" style={{ width: '100%', height: 400, marginTop: '1.5rem' }}>
              {fetchingStats ? <div className="chart-loading">Loading chart data...</div> : (
                <ResponsiveContainer width="100%" height="100%">
                  {renderMainChart()}
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="section-card summary-section">
            <h3>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: 'middle' }}>
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="16"></line>
                <line x1="8" y1="12" x2="16" y2="12"></line>
              </svg>
              Revenue Strategy Summary
            </h3>
            <div className="summary-inset-box" style={{ flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', padding: '2rem' }}>
              <div style={{ textAlign: 'center' }}>
                <span className="summary-inset-label" style={{ display: 'block', marginBottom: '8px' }}>Total Sales Revenue:</span>
                <span className="summary-inset-value revenue" style={{ fontSize: '1.8rem' }}>฿{Number(stats?.totalSales || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div style={{ width: '1px', height: '50px', background: '#E2E8F0' }}></div>
              <div style={{ textAlign: 'center' }}>
                <span className="summary-inset-label" style={{ display: 'block', marginBottom: '8px' }}>Total Items Sold:</span>
                <span className="summary-inset-value items" style={{ fontSize: '1.8rem' }}>{Number(stats?.totalProductsSold || 0).toLocaleString()}</span>
              </div>
            </div>
            <p style={{ fontSize: '0.9rem', color: '#64748B', marginTop: '1.5rem', lineHeight: '1.6', textAlign: 'left', background: '#F8FAFC', padding: '15px', borderRadius: '12px', borderLeft: '4px solid #F59E0B' }}>
              This summary represents the accumulated performance across all business cycles. Use the chart above to identify growth trends and peak performance months. Your store is currently showing stable growth patterns.
            </p>
          </div>

          <div className="section-card revenue-report-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ margin: 0 }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6366F1" strokeWidth="2" style={{ marginRight: '8px', verticalAlign: 'middle' }}>
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                </svg>
                Detailed Revenue Breakdown
              </h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div className="custom-dropdown-container">
                    <button
                      className="toggle-btn"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '8px 14px',
                        background: '#F3F4F6',
                        borderRadius: '10px',
                        border: 'none',
                        fontSize: '0.85rem',
                        fontWeight: '700',
                        color: selectedBrand === 'All' ? '#6B7280' : '#6366F1',
                        cursor: 'pointer',
                        minWidth: '100px',
                        justifyContent: 'space-between'
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowBrandDropdown(!showBrandDropdown);
                      }}
                    >
                      <span>{selectedBrand === 'All' ? 'All Brands' : selectedBrand}</span>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" style={{ transition: 'transform 0.2s', transform: showBrandDropdown ? 'rotate(180deg)' : 'rotate(0)' }}>
                        <path d="M6 9l6 6 6-6" />
                      </svg>
                    </button>
                    {showBrandDropdown && (
                      <div className="year-dropdown-menu" style={{ minWidth: '140px' }}>
                        {brands.map(b => (
                          <div
                            key={b}
                            className={`year-item ${selectedBrand === b ? 'active' : ''}`}
                            onClick={() => {
                              setSelectedBrand(b);
                              setShowBrandDropdown(false);
                            }}
                          >
                            {b === 'All' ? 'All Brands' : b}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <button
                  onClick={handleExportPDF}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 16px',
                    backgroundColor: '#6366F1',
                    color: 'white',
                    border: 'none',
                    borderRadius: '10px',
                    fontWeight: '600',
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    boxShadow: '0 4px 12px rgba(99, 102, 241, 0.2)'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#4F46E5'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#6366F1'}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="7 10 12 15 17 10"></polyline>
                    <line x1="12" y1="15" x2="12" y2="3"></line>
                  </svg>
                  Export PDF
                </button>
              </div>
            </div>
            <div className="table-container" style={{ width: '100%', overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.95rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #E2E8F0', textAlign: 'left' }}>
                    <th style={{ padding: '15px 10px', width: '40px' }}>
                      <input
                        type="checkbox"
                        checked={revenueDetails.length > 0 && selectedProducts.length === revenueDetails.length}
                        onChange={toggleSelectAll}
                        style={{ cursor: 'pointer', transform: 'scale(1.2)' }}
                      />
                    </th>
                    <th style={{ padding: '15px 10px', color: '#64748B', fontWeight: '600', width: '120px' }}>Product ID</th>
                    <th style={{ padding: '15px 10px', color: '#64748B', fontWeight: '600' }}>Product Name</th>
                    <th style={{ padding: '15px 10px', color: '#64748B', fontWeight: '600' }}>Last Sold</th>
                    <th style={{ padding: '15px 10px', color: '#64748B', fontWeight: '600' }}>Category</th>
                    <th style={{ padding: '15px 10px', color: '#64748B', fontWeight: '600', textAlign: 'right' }}>Units Sold</th>
                    <th style={{ padding: '15px 10px', color: '#64748B', fontWeight: '600', textAlign: 'right' }}>Revenue contribution</th>
                  </tr>
                </thead>
                <tbody>
                  {fetchingDetails ? (
                    <tr><td colSpan="6" style={{ padding: '30px', textAlign: 'center', color: '#94A3B8' }}>Fetching revenue data...</td></tr>
                  ) : revenueDetails.length > 0 ? (
                    (() => {
                      const itemsPerPage = 10; // Define items per page - by worapol สุดหล่อ
                      const indexOfLast = currentPage * itemsPerPage;
                      const indexOfFirst = indexOfLast - itemsPerPage;
                      const currentItems = revenueDetails.slice(indexOfFirst, indexOfLast);

                      return currentItems.map((item, idx) => {
                        const isSelected = selectedProducts.includes(item.product_name);
                        return (
                          <tr
                            key={idx}
                            className={isSelected ? "" : "no-print-row"}
                            style={{
                              borderBottom: '1px solid #F1F5F9',
                              transition: 'background-color 0.2s',
                              opacity: isSelected ? 1 : 0.6
                            }}
                            onMouseOver={(e) => isSelected && (e.currentTarget.style.backgroundColor = '#F8FAFC')}
                            onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                          >
                            <td style={{ padding: '15px 10px' }}>
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleProductSelection(item.product_name)}
                                style={{ cursor: 'pointer', transform: 'scale(1.1)' }}
                              />
                            </td>
                            <td style={{ padding: '15px 10px' }}>
                              <span style={{
                                display: 'inline-block',
                                padding: '4px 10px',
                                backgroundColor: '#EFF6FF',
                                color: '#1D4ED8',
                                borderRadius: '8px',
                                fontSize: '0.85rem',
                                fontWeight: '700',
                                fontFamily: 'monospace'
                              }}>
                                {item.product_code || 'N/A'}
                              </span>
                            </td>
                            <td style={{ padding: '15px 10px', fontWeight: '500', color: '#1E293B' }}>{item.product_name}</td>
                            <td style={{ padding: '15px 10px', fontSize: '0.85rem' }}>
                              <div style={{ color: '#1E293B', fontWeight: '600' }}>
                                {item.last_sold_date ? new Date(item.last_sold_date).toLocaleDateString() : 'N/A'}
                              </div>
                              <div style={{ color: '#94A3B8', fontSize: '0.75rem' }}>
                                {item.last_sold_date ? new Date(item.last_sold_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                              </div>
                            </td>
                            <td style={{ padding: '15px 10px' }}>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <span style={{ padding: '2px 8px', borderRadius: '12px', fontSize: '0.7rem', fontWeight: '700', backgroundColor: '#F3F4F6', color: '#6B7280', width: 'fit-content' }}>
                                  {item.brand || 'NO BRAND'}
                                </span>
                                <span style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: '600', backgroundColor: item.category === 'shoe' ? '#EEF2FF' : '#F0FDF4', color: item.category === 'shoe' ? '#4F46E5' : '#16A34A', width: 'fit-content' }}>
                                  {item.category.toUpperCase()}
                                </span>
                              </div>
                            </td>
                            <td style={{ padding: '15px 10px', textAlign: 'right', fontWeight: '600', color: '#475569' }}>{Number(item.total_quantity).toLocaleString()}</td>
                            <td style={{ padding: '15px 10px', textAlign: 'right', fontWeight: '800', color: '#10B981' }}>฿{Number(item.total_revenue).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                          </tr>
                        );
                      });
                    })()
                  ) : (
                    <tr><td colSpan="7" style={{ padding: '30px', textAlign: 'center', color: '#94A3B8' }}>No revenue data found for this selection.</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination for Revenue Details */}
            {!fetchingDetails && revenueDetails.length > itemsPerPage && (
              <div className="pagination" style={{ display: 'flex', justifyContent: 'center', marginTop: '2rem', gap: '8px' }}>
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="page-btn"
                >
                  Prev
                </button>
                {Array.from({ length: Math.ceil(revenueDetails.length / itemsPerPage) }, (_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`page-btn ${currentPage === i + 1 ? 'active' : ''}`}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(revenueDetails.length / itemsPerPage)))}
                  disabled={currentPage === Math.ceil(revenueDetails.length / itemsPerPage)}
                  className="page-btn"
                >
                  Next
                </button>
              </div>
            )}
          </div>

          {/* NEW SECTION: Monthly Daily Performance Log */}
          <div className="section-card" style={{ marginTop: '2.5rem', marginBottom: '2.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div className="chart-title-group">
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                  Monthly Daily Performance Log
                </h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: '#64748B' }}>Breakdown of sales and units sold for each day in a month</p>
              </div>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <div className="chart-view-toggle">
                  {[2024, 2025, 2026].map(y => (
                    <button 
                      key={y} 
                      className={`toggle-btn ${reportYear === y ? 'active' : ''}`}
                      onClick={() => setReportYear(y)}
                      style={{ padding: '6px 12px' }}
                    >
                      {y}
                    </button>
                  ))}
                </div>
                <button
                  onClick={exportMonthlyPDF}
                  className="export-pdf-btn"
                  title="Export this month's data as PDF"
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 16px', background: '#4F46E5', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', fontSize: '0.85rem', cursor: 'pointer', boxShadow: '0 4px 6px -1px rgba(79,70,229,0.2)' }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                  Export PDF
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginBottom: '2rem', padding: '10px', background: '#F8FAFC', borderRadius: '12px' }}>
              {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((m, idx) => (
                <button
                  key={m}
                  onClick={() => setReportMonth(idx + 1)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: 'none',
                    fontSize: '0.85rem',
                    fontWeight: reportMonth === idx + 1 ? '700' : '500',
                    backgroundColor: reportMonth === idx + 1 ? '#4F46E5' : 'transparent',
                    color: reportMonth === idx + 1 ? 'white' : '#64748B',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    flex: '1',
                    textAlign: 'center',
                    minWidth: '60px'
                  }}
                >
                  {m}
                </button>
              ))}
            </div>

            <div className="table-container" style={{ maxHeight: '500px', overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                <thead style={{ position: 'sticky', top: 0, backgroundColor: 'white', zIndex: 10 }}>
                  <tr style={{ borderBottom: '2px solid #E2E8F0', textAlign: 'left' }}>
                    <th style={{ padding: '12px 10px', color: '#64748B' }}>Date</th>
                    <th style={{ padding: '12px 10px', color: '#64748B', textAlign: 'right' }}>Orders</th>
                    <th style={{ padding: '12px 10px', color: '#64748B', textAlign: 'right' }}>Units Sold</th>
                    <th style={{ padding: '12px 10px', color: '#64748B', textAlign: 'right' }}>Daily Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {fetchingReport ? (
                    <tr><td colSpan="4" style={{ padding: '40px', textAlign: 'center', color: '#94A3B8' }}>Loading monthly summary...</td></tr>
                  ) : monthlyReport.length > 0 ? (
                    <>
                      {monthlyReport.map((row, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid #F1F5F9' }}>
                          <td style={{ padding: '12px 10px', fontWeight: '600', color: '#1E293B' }}>
                            {new Date(row.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </td>
                          <td style={{ padding: '12px 10px', textAlign: 'right', color: '#64748B' }}>{Number(row.order_count).toLocaleString()}</td>
                          <td style={{ padding: '12px 10px', textAlign: 'right', fontWeight: '700', color: '#3B82F6' }}>{Number(row.total_items).toLocaleString()} items</td>
                          <td style={{ padding: '12px 10px', textAlign: 'right', fontWeight: '800', color: '#10B981' }}>฿{Number(row.daily_revenue || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        </tr>
                      ))}
                      <tr style={{ backgroundColor: '#F8FAFC', fontWeight: '800' }}>
                        <td style={{ padding: '15px 10px' }}>MONTHLY TOTAL</td>
                        <td style={{ padding: '15px 10px', textAlign: 'right' }}>{Number(monthlyReport.reduce((s, r) => s + r.order_count, 0)).toLocaleString()}</td>
                        <td style={{ padding: '15px 10px', textAlign: 'right', color: '#3B82F6' }}>{Number(monthlyReport.reduce((s, r) => s + parseInt(r.total_items || 0), 0)).toLocaleString()} items</td>
                        <td style={{ padding: '15px 10px', textAlign: 'right', color: '#10B981', fontSize: '1.1rem' }}>
                          ฿{Number(monthlyReport.reduce((s, r) => s + parseFloat(r.daily_revenue || 0), 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                      </tr>
                    </>
                  ) : (
                    <tr><td colSpan="4" style={{ padding: '40px', textAlign: 'center', color: '#94A3B8', fontStyle: 'italic' }}>No sales data found for {reportMonth}/{reportYear}.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminRevenue;
