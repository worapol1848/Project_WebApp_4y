// code in this file is written by worapol สุดหล่อ
const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { verifyToken, isAdmin } = require('../middlewares/authMiddleware');

// Admin Dashboard Stats - by worapol สุดหล่อ
router.get('/', verifyToken, isAdmin, async (req, res) => {
  try {
    const [products] = await db.query('SELECT COUNT(*) as total FROM products');
    const [orders] = await db.query('SELECT COUNT(*) as total FROM orders');
    const [users] = await db.query('SELECT COUNT(*) as total FROM users');
    const [lowStockProducts] = await db.query('SELECT id, name, stock FROM products WHERE CAST(stock AS UNSIGNED) < 5 ORDER BY CAST(stock AS UNSIGNED) ASC');
    const [lowStockSizes] = await db.query(`
      SELECT p.id, p.name, sz.size, sz.stock 
      FROM (
        SELECT product_id, size, stock FROM shoe_sizes
        UNION ALL
        SELECT product_id, size, stock FROM apparel_sizes
      ) sz
      JOIN products p ON sz.product_id = p.id 
      WHERE CAST(sz.stock AS UNSIGNED) < 5 
      ORDER BY CAST(sz.stock AS UNSIGNED) ASC
    `);

    const lowStock = [];
    lowStockProducts.forEach(p => {
      lowStock.push({ id: `p-${p.id}`, name: p.name, isTotal: true, stock: p.stock });
    });
    lowStockSizes.forEach(s => {
      lowStock.push({ id: `s-${s.id}-${s.size}`, name: s.name, isTotal: false, size: s.size, stock: s.stock });
    });
    const [bestSellers] = await db.query(`
      SELECT 
        p.id, 
        p.product_code,
        p.name, 
        p.image_url, 
        p.category, 
        p.brand, 
        SUM(oi.quantity) as total_sold,
        SUM(oi.price_at_purchase * oi.quantity) as total_revenue
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      JOIN orders o ON oi.order_id = o.id
      WHERE o.status = 'delivered'
      GROUP BY p.id
      ORDER BY total_revenue DESC
      LIMIT 10
    `);

    const [brandStats] = await db.query(`
      SELECT 
        p.brand, 
        SUM(oi.quantity) as total_sold,
        SUM(oi.price_at_purchase * oi.quantity) as total_revenue
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      JOIN orders o ON oi.order_id = o.id
      WHERE o.status = 'delivered' AND p.brand IS NOT NULL AND p.brand != ""
      GROUP BY p.brand
      ORDER BY total_revenue DESC
    `);

    const [totalSalesData] = await db.query("SELECT SUM(total_amount) as total FROM orders WHERE status = 'delivered'");
    const [totalProductsSoldData] = await db.query("SELECT SUM(quantity) as total FROM order_items JOIN orders ON order_items.order_id = orders.id WHERE orders.status = 'delivered'");

    // Financial Metrics for Revenue Dashboard - by worapol สุดหล่อ
    const [todaySalesData] = await db.query("SELECT SUM(total_amount) as total FROM orders WHERE status = 'delivered' AND DATE(created_at) = CURDATE()");
    const [yesterdaySalesData] = await db.query("SELECT SUM(total_amount) as total FROM orders WHERE status = 'delivered' AND DATE(created_at) = DATE_SUB(CURDATE(), INTERVAL 1 DAY)");
    const [thisMonthSalesData] = await db.query("SELECT SUM(total_amount) as total FROM orders WHERE status = 'delivered' AND MONTH(created_at) = MONTH(CURDATE()) AND YEAR(created_at) = YEAR(CURDATE())");
    const [lastMonthSalesData] = await db.query("SELECT SUM(total_amount) as total FROM orders WHERE status = 'delivered' AND MONTH(created_at) = MONTH(DATE_SUB(CURDATE(), INTERVAL 1 MONTH)) AND YEAR(created_at) = YEAR(DATE_SUB(CURDATE(), INTERVAL 1 MONTH))");

    res.json({
      totalProducts: products[0].total,
      totalOrders: orders[0].total,
      totalUsers: users[0].total,
      totalSales: totalSalesData[0].total || 0,
      totalProductsSold: totalProductsSoldData[0].total || 0,
      todaySales: todaySalesData[0].total || 0,
      yesterdaySales: yesterdaySalesData[0].total || 0,
      thisMonthSales: thisMonthSalesData[0].total || 0,
      lastMonthSales: lastMonthSalesData[0].total || 0,
      lowStock,
      bestSellers,
      brandStats
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get sales for a specific date - by worapol สุดหล่อ
router.get('/daily-sales', verifyToken, isAdmin, async (req, res) => {
  const { date } = req.query;
  try {
    const [dailySales] = await db.query(
      "SELECT SUM(total_amount) as total, COUNT(*) as order_count FROM orders WHERE status = 'delivered' AND DATE(created_at) = ?",
      [date]
    );

    // Hourly breakdown for the selected date - by worapol สุดหล่อ
    const [hourlyData] = await db.query(`
      SELECT 
        HOUR(created_at) as hour,
        SUM(total_amount) as revenue
      FROM orders
      WHERE status = 'delivered' AND DATE(created_at) = ?
      GROUP BY hour
      ORDER BY hour ASC
    `, [date]);

    const hourlyStats = Array.from({ length: 24 }, (_, i) => {
      const match = hourlyData.find(h => h.hour === i);
      return {
        hour: i,
        time: `${i.toString().padStart(2, '0')}:00`,
        revenue: match ? parseFloat(match.revenue) : 0
      };
    });

    res.json({
      sales: dailySales[0].total || 0,
      orderCount: dailySales[0].order_count || 0,
      hourlyStats
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get weekly, monthly, or yearly sales stats for chart - by worapol สุดหล่อ
router.get('/sales-stats', verifyToken, isAdmin, async (req, res) => {
  const { type = 'week', year } = req.query;

  try {
    if (type === 'year' || type === 'calendar-year') {
      const targetYear = year || new Date().getFullYear();

      // Get sales for Jan-Dec of specified year - by worapol สุดหล่อ
      const [stats] = await db.query(`
        SELECT 
          MONTH(created_at) as month,
          SUM(total_amount) as revenue
        FROM orders 
        WHERE status = 'delivered' 
          AND YEAR(created_at) = ?
        GROUP BY month
        ORDER BY month ASC
      `, [targetYear]);

      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const dataPoints = monthNames.map((name, index) => {
        const match = stats.find(s => s.month === (index + 1));
        return {
          name,
          revenue: match ? parseFloat(match.revenue) : 0,
          fullDate: `${targetYear}-${(index + 1).toString().padStart(2, '0')}`
        };
      });

      return res.json(dataPoints);
    }

    // Default: daily stats for week or month - by worapol สุดหล่อ
    const days = type === 'month' ? 29 : 6;
    const [stats] = await db.query(`
      SELECT 
        DATE(created_at) as date, 
        SUM(total_amount) as revenue
      FROM orders 
      WHERE status = 'delivered' 
        AND created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `, [days]);

    const dataPoints = [];
    for (let i = days; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const match = stats.find(s => {
        const sDate = new Date(s.date);
        return sDate.toISOString().split('T')[0] === dateStr;
      });

      dataPoints.push({
        name: type === 'month'
          ? new Date(dateStr).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })
          : new Date(dateStr).toLocaleDateString('en-US', { weekday: 'short' }),
        revenue: match ? parseFloat(match.revenue) : 0,
        fullDate: dateStr
      });
    }

    res.json(dataPoints);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET detailed revenue breakdown for table - by worapol สุดหล่อ
router.get('/revenue-details', verifyToken, isAdmin, async (req, res) => {
  const { limit, brand } = req.query;
  const limitClause = limit ? `LIMIT ${parseInt(limit)}` : '';
  const brandValue = brand && brand !== 'All' ? brand : null;

  try {
    let query = `
      SELECT 
        p.product_code,
        p.name as product_name,
        p.category,
        p.brand,
        SUM(oi.quantity) as total_quantity,
        SUM(oi.price_at_purchase * oi.quantity) as total_revenue,
        MAX(o.created_at) as last_sold_date
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      JOIN orders o ON oi.order_id = o.id
      WHERE o.status = 'delivered'
    `;

    const queryParams = [];
    if (brandValue) {
      query += ` AND p.brand = ?`;
      queryParams.push(brandValue);
    }

    query += `
      GROUP BY p.id
      ORDER BY total_revenue DESC
      ${limitClause}
    `;

    const [revenueData] = await db.query(query, queryParams);
    res.json(revenueData);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET detailed daily breakdown for a specific month/year - by worapol สุดหล่อ
router.get('/monthly-report', verifyToken, isAdmin, async (req, res) => {
  const { month, year } = req.query;
  const targetMonth = month || (new Date().getMonth() + 1);
  const targetYear = year || new Date().getFullYear();

  try {
    const [reportData] = await db.query(`
      SELECT 
        DATE(o.created_at) as date,
        SUM(o.total_amount) as daily_revenue,
        COUNT(DISTINCT o.id) as order_count,
        SUM(oi.quantity) as total_items
      FROM orders o
      JOIN order_items oi ON o.id = oi.order_id
      WHERE o.status = 'delivered'
        AND MONTH(o.created_at) = ?
        AND YEAR(o.created_at) = ?
      GROUP BY DATE(o.created_at)
      ORDER BY date ASC
    `, [targetMonth, targetYear]);

    res.json(reportData);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET unique product brands - by worapol สุดหล่อ
router.get('/brands', verifyToken, isAdmin, async (req, res) => {
  try {
    const [brands] = await db.query('SELECT DISTINCT brand FROM products WHERE brand IS NOT NULL AND brand != "" ORDER BY brand ASC');
    res.json(brands.map(b => b.brand));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET comprehensive inventory summary - by worapol สุดหล่อ
router.get('/inventory-summary', verifyToken, isAdmin, async (req, res) => {
  try {
    const [inventoryData] = await db.query(`
      SELECT 
        p.id,
        p.product_code,
        p.name,
        p.image_url,
        p.category,
        p.brand,
        p.price,
        p.discount_percent,
        p.stock as remaining_stock,
        COALESCE((
          SELECT SUM(oi.quantity) 
          FROM order_items oi 
          JOIN orders o ON oi.order_id = o.id 
          WHERE oi.product_id = p.id AND o.status != 'cancelled'
        ), 0) as total_sold,
        (
          SELECT GROUP_CONCAT(CONCAT(s.size, ': ', s.stock) SEPARATOR ', ')
          FROM shoe_sizes s
          WHERE s.product_id = p.id
          UNION ALL
          SELECT GROUP_CONCAT(CONCAT(a.size, ': ', a.stock) SEPARATOR ', ')
          FROM apparel_sizes a
          WHERE a.product_id = p.id
          LIMIT 1
        ) as sizes_breakdown
      FROM products p
      ORDER BY p.created_at DESC
    `);

    // Calculate derived values: original_quantity, remaining_value, total_potential_value - by worapol สุดหล่อ
    const enrichedData = inventoryData.map(item => {
      const remaining_stock = parseInt(item.remaining_stock) || 0;
      const total_sold = parseInt(item.total_sold) || 0;
      const price = parseFloat(item.price) || 0;
      
      const total_quantity = remaining_stock + total_sold;
      const total_sold_revenue = total_sold * price;
      const remaining_value = remaining_stock * price;
      const total_potential_value = total_quantity * price;

      return {
        ...item,
        remaining_stock,
        total_sold,
        total_sold_revenue,
        total_quantity,
        remaining_value,
        total_potential_value
      };
    });

    res.json(enrichedData);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
