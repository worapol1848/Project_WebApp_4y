// code in this file is written by worapol สุดหล่อ
const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { verifyToken, isAdmin } = require('../middlewares/authMiddleware');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { logAdminAction } = require('../utils/logger');

// Multer Config for Slips - by worapol สุดหล่อ
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = 'uploads/slips';
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, `slip-${Date.now()}${path.extname(file.originalname)}`);
  }
});

const upload = multer({ storage: storage });

// User: Create an order (Purchase) with slip - by worapol สุดหล่อ
router.post('/', verifyToken, upload.single('slip'), async (req, res) => {
    const { items: itemsRaw, shipping_method, shipping_fee } = req.body;
    let items;
    try {
      items = typeof itemsRaw === 'string' ? JSON.parse(itemsRaw) : itemsRaw;
    } catch (e) {
      return res.status(400).json({ message: 'Invalid items format' });
    }

    const userId = req.user.id;
    const slipUrl = req.file ? `/uploads/slips/${req.file.filename}` : null;

    if (!items || items.length === 0) return res.status(400).json({ message: 'Cart is empty' });

    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      let totalAmount = 0;
      const orderItemsData = [];

      for (const item of items) {
        const [productRows] = await conn.query('SELECT stock, price, discount_percent, product_type FROM products WHERE id = ?', [item.productId]);
        if (productRows.length === 0) throw new Error(`Product ID ${item.productId} not found`);
        const product = productRows[0];
        const discount = product.discount_percent || 0;
        const finalPrice = discount > 0 ? (product.price * (1 - discount / 100)) : product.price;

        if (item.size) {
          let sizeTable = product.product_type === 'apparel' ? 'apparel_sizes' : 'shoe_sizes';
          const [sizeRows] = await conn.query(`SELECT stock FROM ${sizeTable} WHERE product_id = ? AND size = ?`, [item.productId, item.size]);

          if (sizeRows.length === 0) throw new Error(`Size ${item.size} not found for Product ID ${item.productId}`);
          if (sizeRows[0].stock < item.quantity) throw new Error(`Not enough stock for Size ${item.size}`);

          await conn.query(`UPDATE ${sizeTable} SET stock = stock - ? WHERE product_id = ? AND size = ?`, [item.quantity, item.productId, item.size]);
        } else {
          if (product.stock < item.quantity) throw new Error(`Not enough stock for Product ID ${item.productId}`);
        }

        totalAmount += finalPrice * item.quantity;
        orderItemsData.push({
          productId: item.productId,
          quantity: item.quantity,
          price: finalPrice,
          size: item.size || null
        });

        await conn.query('UPDATE products SET stock = stock - ? WHERE id = ?', [item.quantity, item.productId]);
      }

      // Final Total including shipping fee - by worapol สุดหล่อ
      const finalTotalAmount = totalAmount + parseFloat(shipping_fee || 0);

      // Create Order Record with snapshot of user's current profile at time of purchase - by worapol สุดหล่อ
      const [userRows] = await conn.query(
        'SELECT full_name, phone, address, sub_district, district, province, postal_code, latitude, longitude FROM users WHERE id = ?',
        [userId]
      );
      const u = userRows[0] || {};

      const [orderResult] = await conn.query(
        `INSERT INTO orders (
          user_id, total_amount, status, slip_url, shipping_method, shipping_fee,
          shipping_full_name, shipping_phone, shipping_address, 
          shipping_sub_district, shipping_district, shipping_province, 
          shipping_postal_code, shipping_latitude, shipping_longitude
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          userId, finalTotalAmount, 'pending', slipUrl, shipping_method || 'ems', shipping_fee || 0,
          u.full_name, u.phone, u.address, 
          u.sub_district, u.district, u.province, 
          u.postal_code, u.latitude, u.longitude
        ]
      );
    const orderId = orderResult.insertId;

    for (const data of orderItemsData) {
      await conn.query(
        'INSERT INTO order_items (order_id, product_id, quantity, size, price_at_purchase) VALUES (?, ?, ?, ?, ?)',
        [orderId, data.productId, data.quantity, data.size, data.price]
      );
    }

    // NEW: Clear cart after successful order - by worapol สุดหล่อ
    await conn.query('DELETE FROM cart_items WHERE user_id = ?', [userId]);

    await conn.commit();
    res.status(201).json({ orderId, message: 'Order placed successfully' });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ error: err.message });
  } finally {
    conn.release();
  }
});

// User: Get my orders - by worapol สุดหล่อ
router.get('/myorders', verifyToken, async (req, res) => {
  try {
    const [orders] = await db.query('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC', [req.user.id]);

    // Fetch items for each order - by worapol สุดหล่อ
    const ordersWithItems = await Promise.all(orders.map(async (order) => {
      const [items] = await db.query(
        `SELECT oi.*, p.name, p.image_url,
          (SELECT COUNT(*) FROM product_comments pc 
           WHERE pc.order_id = oi.order_id 
             AND pc.product_id = oi.product_id 
             AND (pc.size = oi.size OR (pc.size IS NULL AND oi.size IS NULL) OR pc.size = '')
          ) as is_reviewed
         FROM order_items oi 
         JOIN products p ON oi.product_id = p.id 
         WHERE oi.order_id = ?`,
        [order.id]
      );
      return { ...order, items };
    }));

    res.json(ordersWithItems);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// User: Confirm Receipt - by worapol สุดหล่อ
router.put('/:id/deliver', verifyToken, async (req, res) => {
  try {
    const [result] = await db.query('UPDATE orders SET status = "delivered" WHERE id = ? AND user_id = ? AND (status = "shipped" OR status = "arrived")', [req.params.id, req.user.id]);
    if (result.affectedRows === 0) return res.status(400).json({ message: 'Order cannot be confirmed or not found' });
    res.json({ message: 'Order delivered confirmed' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// User: Save refund bank information - by worapol สุดหล่อ
router.put('/:id/refund-info', verifyToken, async (req, res) => {
  const { bank_name, bank_account_name, bank_account_number } = req.body;
  try {
    const [result] = await db.query(
      'UPDATE orders SET bank_name = ?, bank_account_name = ?, bank_account_number = ? WHERE id = ? AND user_id = ? AND status = "cancelled"',
      [bank_name, bank_account_name, bank_account_number, req.params.id, req.user.id]
    );

    if (result.affectedRows === 0) return res.status(400).json({ message: 'Cannot save refund info or order not found' });
    res.json({ message: 'Refund bank information saved successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: Get all orders - by worapol สุดหล่อ
router.get('/', verifyToken, isAdmin, async (req, res) => {
  try {
    const [orders] = await db.query(
      `SELECT o.*, u.username, COALESCE(o.shipping_full_name, u.full_name) as full_name
       FROM orders o 
       JOIN users u ON o.user_id = u.id 
       ORDER BY o.created_at DESC`
    );
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: Update order status to shipped - by worapol สุดหล่อ
router.put('/:id/ship', verifyToken, isAdmin, async (req, res) => {
  try {
    const [result] = await db.query('UPDATE orders SET status = "shipped" WHERE id = ? AND status = "pending"', [req.params.id]);
    if (result.affectedRows === 0) return res.status(400).json({ message: 'Order cannot be shipped or not found' });

    await logAdminAction(req.user.id, 'UPDATE_STATUS', 'ORDER', req.params.id, { new_status: 'shipped' });

    res.json({ message: 'Order marked as shipped' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: Update order status to arrived (at customer's location) - by worapol สุดหล่อ
router.put('/:id/deliver-admin', verifyToken, isAdmin, async (req, res) => {
  try {
    const [result] = await db.query('UPDATE orders SET status = "arrived" WHERE id = ? AND status = "shipped"', [req.params.id]);
    if (result.affectedRows === 0) return res.status(400).json({ message: 'Order cannot be marked as arrived or not found' });

    await logAdminAction(req.user.id, 'UPDATE_STATUS', 'ORDER', req.params.id, { new_status: 'arrived' });

    res.json({ message: 'Order marked as arrived (waiting for customer confirmation)' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: Mark as Refunded - by worapol สุดหล่อ
router.put('/:id/refund-complete', verifyToken, isAdmin, async (req, res) => {
  try {
    const [result] = await db.query('UPDATE orders SET status = "refunded" WHERE id = ? AND status = "cancelled"', [req.params.id]);
    if (result.affectedRows === 0) return res.status(400).json({ message: 'Order cannot be marked as refunded or not found (must be cancelled first)' });

    await logAdminAction(req.user.id, 'REFUND_COMPLETE', 'ORDER', req.params.id, { new_status: 'refunded' });

    res.json({ message: 'Order marked as refunded' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: Cancel order - by worapol สุดหล่อ
router.put('/:id/cancel', verifyToken, isAdmin, async (req, res) => {
  const { cancel_reason } = req.body;
  const orderId = req.params.id;

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const [result] = await conn.query('UPDATE orders SET status = "cancelled", cancel_reason = ? WHERE id = ? AND status != "cancelled"', [cancel_reason, orderId]);
    if (result.affectedRows === 0) throw new Error('Order cannot be cancelled or not found');

    // restore stock - by worapol สุดหล่อ
    const [items] = await conn.query('SELECT oi.product_id, oi.size, oi.quantity, p.product_type FROM order_items oi JOIN products p ON oi.product_id = p.id WHERE oi.order_id = ?', [orderId]);
    for (const item of items) {
      if (item.size) {
        let sizeTable = item.product_type === 'apparel' ? 'apparel_sizes' : 'shoe_sizes';
        await conn.query(`UPDATE ${sizeTable} SET stock = stock + ? WHERE product_id = ? AND size = ?`, [item.quantity, item.product_id, item.size]);
      } else {
        await conn.query('UPDATE products SET stock = stock + ? WHERE id = ?', [item.quantity, item.product_id]);
      }
    }

    await conn.commit();

    await logAdminAction(req.user.id, 'CANCEL', 'ORDER', orderId, { cancel_reason });

    res.json({ message: 'Order cancelled successfully' });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ error: err.message });
  } finally {
    conn.release();
  }
});

// Admin: Toggle Slip Verification - by worapol สุดหล่อ
router.put('/:id/verify-slip', verifyToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { verified } = req.body;

    const [result] = await db.query(
      'UPDATE orders SET slip_verified = ? WHERE id = ?',
      [verified, id]
    );

    if (result.affectedRows === 0) return res.status(404).json({ message: 'Order not found' });

    await logAdminAction(req.user.id, 'VERIFY_SLIP', 'ORDER', id, { verified });

    res.json({ message: verified ? 'Slip marked as verified' : 'Slip marked as unverified' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: Get specific order details - by worapol สุดหล่อ
router.get('/:id', verifyToken, isAdmin, async (req, res) => {
  try {
    const [orderRows] = await db.query(
      `SELECT o.*, u.username
       FROM orders o 
       JOIN users u ON o.user_id = u.id 
       WHERE o.id = ?`,
      [req.params.id]
    );

    if (orderRows.length === 0) return res.status(404).json({ message: 'Order not found' });
    const order = orderRows[0];

    // Map shipping columns to the format the frontend expects (matching profile keys) - by worapol สุดหล่อ
    const formattedOrder = {
      ...order,
      full_name: order.shipping_full_name,
      phone: order.shipping_phone,
      address: order.shipping_address,
      sub_district: order.shipping_sub_district,
      district: order.shipping_district,
      province: order.shipping_province,
      postal_code: order.shipping_postal_code,
      latitude: order.shipping_latitude,
      longitude: order.shipping_longitude
    };

    const [items] = await db.query(
      `SELECT oi.*, p.name, p.image_url 
       FROM order_items oi 
       JOIN products p ON oi.product_id = p.id 
       WHERE oi.order_id = ?`,
      [req.params.id]
    );

    formattedOrder.items = items;
    res.json(formattedOrder);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
