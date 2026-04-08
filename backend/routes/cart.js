// code in this file is written by worapol สุดหล่อ
const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { verifyToken } = require('../middlewares/authMiddleware');

// Get cart items - by worapol สุดหล่อ
router.get('/', verifyToken, async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT c.*, p.name, p.price AS original_price,
             CASE WHEN p.discount_percent > 0 THEN p.price * (1 - p.discount_percent / 100) ELSE p.price END AS price,
             p.discount_percent, 
             COALESCE(p.image_url, (SELECT image_url FROM product_images WHERE product_id = p.id LIMIT 1)) as image_url
      FROM cart_items c
      JOIN products p ON c.product_id = p.id
      WHERE c.user_id = ?
    `, [req.user.id]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add/Update cart item - by worapol สุดหล่อ
router.post('/', verifyToken, async (req, res) => {
  const { productId, quantity, size, replace } = req.body;
  try {
    // Check if item already exists - by worapol สุดหล่อ
    const [existing] = await pool.query(
      'SELECT id, quantity FROM cart_items WHERE user_id = ? AND product_id = ? AND size = ?',
      [req.user.id, productId, size]
    );

    if (existing.length > 0) {
      if (replace) {
        // Overwrite quantity (used by Cart page) - by worapol สุดหล่อ
        await pool.query(
          'UPDATE cart_items SET quantity = ? WHERE id = ?',
          [quantity, existing[0].id]
        );
      } else {
        // Increment quantity (used by Add to Cart button) - by worapol สุดหล่อ
        await pool.query(
          'UPDATE cart_items SET quantity = quantity + ? WHERE id = ?',
          [quantity, existing[0].id]
        );
      }
    } else {
      // Insert new - by worapol สุดหล่อ
      await pool.query(
        'INSERT INTO cart_items (user_id, product_id, quantity, size) VALUES (?, ?, ?, ?)',
        [req.user.id, productId, quantity, size]
      );
    }
    res.json({ message: 'Cart updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Sync local cart to DB (Bulk add) - by worapol สุดหล่อ
router.post('/sync', verifyToken, async (req, res) => {
  const { items } = req.body; // Array of { id: productId, quantity, size } - by worapol สุดหล่อ
  if (!items || !Array.isArray(items)) return res.status(400).json({ error: 'Invalid items' });

  try {
    for (const item of items) {
      const [existing] = await pool.query(
        'SELECT id, quantity FROM cart_items WHERE user_id = ? AND product_id = ? AND size = ?',
        [req.user.id, item.id, item.size]
      );

      if (existing.length > 0) {
        // If exists, maybe we merge or keep DB? Let's merge (sum quantities) - by worapol สุดหล่อ
        await pool.query(
          'UPDATE cart_items SET quantity = quantity + ? WHERE id = ?',
          [item.quantity, existing[0].id]
        );
      } else {
        await pool.query(
          'INSERT INTO cart_items (user_id, product_id, quantity, size) VALUES (?, ?, ?, ?)',
          [req.user.id, item.id, item.quantity, item.size]
        );
      }
    }
    res.json({ message: 'Cart synced' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete specific item - by worapol สุดหล่อ
router.delete('/:productId/:size', verifyToken, async (req, res) => {
  const { productId, size } = req.params;
  try {
    await pool.query(
      'DELETE FROM cart_items WHERE user_id = ? AND product_id = ? AND size = ?',
      [req.user.id, productId, size]
    );
    res.json({ message: 'Item removed' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Clear cart - by worapol สุดหล่อ
router.delete('/', verifyToken, async (req, res) => {
  try {
    await pool.query('DELETE FROM cart_items WHERE user_id = ?', [req.user.id]);
    res.json({ message: 'Cart cleared' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
