// code in this file is written by worapol สุดหล่อ
import React, { useState, useEffect, useContext } from 'react';
import api from '../../services/api';
import MiniCalendar from '../../components/MiniCalendar';
import { LanguageContext } from '../../context/LanguageContext';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import './AdminDashboard.css';

const COLORS = ['#6366F1', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#3B82F6', '#64748B'];

const AdminDashboard = () => {
  const { t } = useContext(LanguageContext);
  const today = new Date().toISOString().split('T')[0]; // Using ISO string for date format - by worapol สุดหล่อ
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // Daily Sales State - by worapol สุดหล่อ
  const [selectedDate, setSelectedDate] = useState(today);
  const [dailyStats, setDailyStats] = useState(null);
  const [fetchingDaily, setFetchingDaily] = useState(false);
  const [salesStats, setSalesStats] = useState([]);
  const [fetchingStats, setFetchingStats] = useState(true);
  const [chartView, setChartView] = useState('week'); // 'week', 'month', 'year' - by worapol สุดหล่อ
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [showYearDropdown, setShowYearDropdown] = useState(false);
  const [lowStockFilter, setLowStockFilter] = useState('size'); // 'size', 'total' - by worapol สุดหล่อ

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    fetchSalesStats(chartView, selectedYear);
  }, [chartView, selectedYear]);

  useEffect(() => {
    if (selectedDate) fetchDailyStats(selectedDate);
  }, [selectedDate]);

  // Handle outside click for year dropdown - by worapol สุดหล่อ
  useEffect(() => {
    const handleClickOutside = () => setShowYearDropdown(false);
    if (showYearDropdown) {
      window.addEventListener('click', handleClickOutside);
    }
    return () => window.removeEventListener('click', handleClickOutside);
  }, [showYearDropdown]);

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

  if (loading) return <div>{t('loading')}</div>;

  // Prepare data for brand chart - by worapol สุดหล่อ
  const brandData = stats?.brandStats?.map(item => ({
    name: item.brand,
    value: parseFloat(item.total_revenue)
  })) || [];

  return (
    <div className="admin-container">
      <h2 className="dashboard-title">{t('adm_dashboard')} {t('adm_overview')}</h2>

      {/* Main Stats Row - by worapol สุดหล่อ */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))' }}>
        <div className="stat-card minimal-card">
          <div className="stat-icon icon-green"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg></div>
          <p className="stat-value">{Number(stats?.totalProducts || 0).toLocaleString()}</p>
          <h3 className="stat-label">{t('adm_products') || 'Products'}</h3>
        </div>

        <div className="stat-card minimal-card">
          <div className="stat-icon" style={{ color: '#8B5CF6' }}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg></div>
          <p className="stat-value">{Number(stats?.totalUsers || 0).toLocaleString()}</p>
          <h3 className="stat-label">{t('adm_customer') || 'Customers'}</h3>
        </div>
      </div>

      {/* Order Status Combined Block - by worapol สุดหล่อ */}
      <div className="section-card order-status-block" style={{ marginBottom: '2.5rem', padding: '1.5rem 2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid #F1F5F9', paddingBottom: '1rem' }}>
          <h3 style={{ margin: 0, display: 'flex', alignItems: 'center' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#6366F1" strokeWidth="2" style={{ marginRight: '10px' }}>
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line>
            </svg>
            {t('adm_orders') || 'Orders Overview'}
          </h3>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.85rem', color: '#94A3B8', fontWeight: 500 }}>{t('adm_total_orders') || 'Total Orders'}</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1E293B' }}>{Number(stats?.totalOrders || 0).toLocaleString()}</div>
          </div>
        </div>
        
        <div className="order-stats-container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2rem' }}>
          <div className="order-status-item">
            <div className="status-label-group">
              <div className="status-dot" style={{ background: '#10B981' }}></div>
              <span className="status-text">{t('adm_delivered_orders') || 'Completed'}</span>
            </div>
            <div className="status-value-group">
              <span className="status-number">{Number(stats?.totalDeliveredOrders || 0).toLocaleString()}</span>
              <span className="status-unit">{t('adm_units') || 'Orders'}</span>
            </div>
            <div className="status-progress-bg"><div className="status-progress-bar" style={{ width: `${(stats?.totalDeliveredOrders / stats?.totalOrders) * 100}%`, background: '#10B981' }}></div></div>
          </div>

          <div className="order-status-item">
            <div className="status-label-group">
              <div className="status-dot" style={{ background: '#F59E0B' }}></div>
              <span className="status-text">{t('adm_pending_orders') || 'Pending'}</span>
            </div>
            <div className="status-value-group">
              <span className="status-number">{Number(stats?.totalPendingOrders || 0).toLocaleString()}</span>
              <span className="status-unit">{t('adm_units') || 'Orders'}</span>
            </div>
            <div className="status-progress-bg"><div className="status-progress-bar" style={{ width: `${(stats?.totalPendingOrders / stats?.totalOrders) * 100}%`, background: '#F59E0B' }}></div></div>
          </div>

          <div className="order-status-item">
            <div className="status-label-group">
              <div className="status-dot" style={{ background: '#3B82F6' }}></div>
              <span className="status-text">{t('adm_shipped_orders') || 'Remaining'}</span>
            </div>
            <div className="status-value-group">
              <span className="status-number">{Number(stats?.totalShippedOrders || 0).toLocaleString()}</span>
              <span className="status-unit">{t('adm_units') || 'Orders'}</span>
            </div>
            <div className="status-progress-bg"><div className="status-progress-bar" style={{ width: `${(stats?.totalShippedOrders / stats?.totalOrders) * 100}%`, background: '#3B82F6' }}></div></div>
          </div>
        </div>
      </div>

      <div className="chart-section section-card">
        <div className="chart-header">
          <h3>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6366F1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px', verticalAlign: 'middle' }}>
              <path d="M3 3v18h18"></path><path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3"></path>
            </svg>
            {t('adm_revenue')} {chartView === 'week' ? t('adm_forecast_7_days') : `${t('adm_trend_year')} ${selectedYear}`}
          </h3>
          <div className="chart-view-toggle">
            <button className={`toggle-btn ${chartView === 'week' ? 'active' : ''}`} onClick={() => setChartView('week')}>{t('week') || 'Week'}</button>
            <button className={`toggle-btn ${chartView === 'year' ? 'active' : ''}`} onClick={() => setChartView('year')}>{t('month') || 'Month'}</button>
            <div className="custom-dropdown-container">
              <button className={`toggle-btn year-toggle ${chartView === 'year' ? 'active' : ''}`} onClick={(e) => { e.stopPropagation(); setShowYearDropdown(!showYearDropdown); }}>{selectedYear}</button>
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
        <div className="chart-container" style={{ width: '100%', height: 350, marginTop: '1.5rem' }}>
          {fetchingStats ? <div className="chart-loading">{t('loading')}</div> : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesStats}>
                <defs><linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#6366F1" stopOpacity={0.1} /><stop offset="95%" stopColor="#6366F1" stopOpacity={0} /></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12 }} tickFormatter={(value) => `฿${value >= 1000 ? (value / 1000) + 'k' : value}`} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', padding: '12px' }} itemStyle={{ color: '#6366F1', fontWeight: 'bold' }} />
                <Area type="monotone" dataKey="revenue" stroke="#6366F1" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" animationDuration={1500} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Revenue Summary Block - by worapol สุดหล่อ */}
      <div className="section-card revenue-summary-block" style={{ marginBottom: '2.5rem', padding: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '2rem' }}>
          <div style={{ width: '45px', height: '45px', background: '#FDF2F8', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '15px' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#EC4899" strokeWidth="2">
              <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline>
            </svg>
          </div>
          <h3 style={{ margin: 0 }}>{t('adm_revenue_hub') || 'Revenue Performance Hub'}</h3>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-around', background: '#F8FAFC', borderRadius: '20px', padding: '2rem', border: '1px solid #F1F5F9' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.85rem', color: '#64748B', fontWeight: 600, marginBottom: '0.5rem' }}>{t('adm_lifetime_revenue') || 'Gross Revenue'}</div>
            <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#10B981', letterSpacing: '-1px' }}>฿{Number(stats?.totalSales || 0).toLocaleString()}</div>
          </div>
          <div style={{ width: '1px', background: '#E2E8F0', height: '60px', alignSelf: 'center' }}></div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.85rem', color: '#64748B', fontWeight: 600, marginBottom: '0.5rem' }}>{t('adm_total_items_sold') || 'Inventory Velocity'}</div>
            <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#1E293B', letterSpacing: '-1px' }}>{Number(stats?.totalProductsSold || 0).toLocaleString()} <span style={{ fontSize: '1rem', color: '#94A3B8', fontWeight: 500 }}>{t('adm_items') || 'Items'}</span></div>
          </div>
        </div>
      </div>

      <div className="dashboard-sections">
        {/* Brand Performance Donut Chart */}
        <div className="section-card">
          <h3>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6366F1" strokeWidth="2" style={{ marginRight: '8px', verticalAlign: 'middle' }}>
              <circle cx="12" cy="12" r="10"></circle><path d="M12 2a10 10 0 0 1 10 10"></path>
            </svg>
            {t('adm_sales_by_brand')}
          </h3>
          <div className="chart-container" style={{ width: '100%', height: 300, display: 'flex', alignItems: 'center' }}>
            {brandData.length === 0 ? <div className="no-data" style={{ margin: 'auto' }}>{t('adm_no_brand_data')}</div> : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={brandData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    animationDuration={1500}
                  >
                    {brandData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => `฿${Number(value).toLocaleString()}`}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                  />
                  <Legend verticalAlign="bottom" height={36}/>
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
          <div className="brand-performance-summary">
            <p style={{ margin: 0, fontSize: '0.9rem', color: '#64748B' }}>
              {t('adm_top_brand')}: <span style={{ fontWeight: 700, color: '#6366F1' }}>{brandData[0]?.name || 'N/A'}</span>
            </p>
          </div>
        </div>

        {/* Low Stock Alerts Table */}
        <div className="section-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ margin: 0 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2" style={{ marginRight: '8px', verticalAlign: 'middle' }}>
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line>
              </svg>
              {t('adm_low_stock_alerts')}
            </h3>
            <div className="chart-view-toggle" style={{ margin: 0 }}>
              <button className={`toggle-btn ${lowStockFilter === 'size' ? 'active' : ''}`} onClick={() => setLowStockFilter('size')}>{t('adm_by_size')}</button>
              <button className={`toggle-btn ${lowStockFilter === 'total' ? 'active' : ''}`} onClick={() => setLowStockFilter('total')}>{t('adm_by_total')}</button>
            </div>
          </div>
          <div className="table-container" style={{ width: '100%', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #E2E8F0', textAlign: 'left' }}>
                  <th style={{ padding: '12px 8px', color: '#64748B' }}>{t('inv_th_product')}</th>
                  <th style={{ padding: '12px 8px', color: '#64748B', textAlign: 'right' }}>Stock</th>
                </tr>
              </thead>
              <tbody>
                {!stats?.lowStock || stats.lowStock.filter(p => lowStockFilter === 'total' ? p.isTotal : !p.isTotal).length === 0 ? (
                  <tr><td colSpan="2" style={{ padding: '20px', textAlign: 'center', color: '#94A3B8' }}>{t('adm_all_stock_sufficient')}</td></tr>
                ) : (
                  stats.lowStock
                    .filter(p => lowStockFilter === 'total' ? p.isTotal : !p.isTotal)
                    .slice(0, 8)
                    .map((p, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #F1F5F9' }}>
                        <td style={{ padding: '12px 8px', color: '#334155' }}>
                          {p.name} {lowStockFilter === 'size' && <span style={{ fontSize: '0.8rem', color: '#94A3B8' }}>({p.size || 'N/A'})</span>}
                        </td>
                        <td style={{ padding: '12px 8px', color: '#EF4444', fontWeight: 'bold', textAlign: 'right' }}>{Number(p.stock || 0).toLocaleString()}</td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Best Sellers Table */}
        <div className="section-card">
          <h3>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" style={{ marginRight: '8px', verticalAlign: 'middle' }}>
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
            </svg>
            {t('adm_bestsellers')}
          </h3>
          <div className="table-container" style={{ width: '100%', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #E2E8F0', textAlign: 'left' }}>
                  <th style={{ padding: '12px 8px', color: '#64748B' }}>{t('adm_rank')}</th>
                  <th style={{ padding: '12px 8px', color: '#64748B' }}>{t('inv_th_product')}</th>
                  <th style={{ padding: '12px 8px', color: '#64748B', textAlign: 'right' }}>{t('adm_sold')}</th>
                </tr>
              </thead>
              <tbody>
                {!stats?.bestSellers || stats.bestSellers.length === 0 ? (
                  <tr><td colSpan="3" style={{ padding: '20px', textAlign: 'center', color: '#94A3B8' }}>{t('adm_no_sales_data')}</td></tr>
                ) : (
                  stats.bestSellers.map((p, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '12px 8px' }}><span className={`rank-badge rank-${idx + 1}`}>{idx + 1}</span></td>
                      <td style={{ padding: '12px 8px', color: '#334155', fontWeight: '500' }}>{p.name}</td>
                      <td style={{ padding: '12px 8px', textAlign: 'right' }}><span className="sales-pill">{Number(p.total_sold || 0).toLocaleString()} {t('adm_sold_lower')}</span></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Daily Sales Card */}
        <div className="section-card">
          <h3>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2" style={{ marginRight: '8px', verticalAlign: 'middle' }}>
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
            {t('adm_daily_performance')}
          </h3>
          <div className="daily-calendar-wrapper" style={{ marginBottom: '0.5rem' }}>
            <MiniCalendar compact={true} selectedDate={selectedDate} onChange={(newDate) => setSelectedDate(newDate)} />
          </div>
          <div className="daily-stats-inset">
            <div className="inset-row"><span className="inset-label">{t('adm_revenue_target')}</span><span className="inset-value price">฿{Number(dailyStats?.sales || 0).toLocaleString()}</span></div>
            <div className="inset-row"><span className="inset-label">{t('adm_order_volume')}</span><span className="inset-value">{Number(dailyStats?.orderCount || 0).toLocaleString()} {t('adm_units')}</span></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
