// code in this file is written by worapol สุดหล่อ
const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { verifyToken } = require('../middlewares/authMiddleware');

// Get wishlist items - by worapol สุดหล่อ
router.get('/', verifyToken, async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT p.id, p.name, p.price, p.discount_percent, 
             COALESCE(p.image_url, (SELECT image_url FROM product_images WHERE product_id = p.id LIMIT 1)) as image_url,
             w.id AS wishlist_row_id
      FROM wishlist_items w
      JOIN products p ON w.product_id = p.id
      WHERE w.user_id = ?
`, [req.user.id]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add to wishlist - by worapol สุดหล่อ
router.post('/', verifyToken, async (req, res) => {
  const { productId } = req.body;
  try {
    await pool.query(
      'INSERT IGNORE INTO wishlist_items (user_id, product_id) VALUES (?, ?)',
      [req.user.id, productId]
    );
    res.json({ message: 'Wishlist updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Sync local wishlist - by worapol สุดหล่อ
router.post('/sync', verifyToken, async (req, res) => {
  const { itemIds } = req.body; // Array of product ids - by worapol สุดหล่อ
  if (!itemIds || !Array.isArray(itemIds)) return res.status(400).json({ error: 'Invalid items' });

  try {
    for (const pid of itemIds) {
      await pool.query(
        'INSERT IGNORE INTO wishlist_items (user_id, product_id) VALUES (?, ?)',
        [req.user.id, pid]
      );
    }
    res.json({ message: 'Wishlist synced' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Remove from wishlist - by worapol สุดหล่อ
router.delete('/:productId', verifyToken, async (req, res) => {
  const { productId } = req.params;
  try {
    await pool.query(
      'DELETE FROM wishlist_items WHERE user_id = ? AND product_id = ?',
      [req.user.id, productId]
    );
    res.json({ message: 'Item removed' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
