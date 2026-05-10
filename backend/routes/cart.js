const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { verifyToken } = require('../middlewares/authMiddleware');


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


router.post('/', verifyToken, async (req, res) => {
  const { productId, quantity, size, replace } = req.body;
  try {
    
    const [existing] = await pool.query(
      'SELECT id, quantity FROM cart_items WHERE user_id = ? AND product_id = ? AND size = ?',
      [req.user.id, productId, size]
    );

    if (existing.length > 0) {
      if (replace) {
        
        await pool.query(
          'UPDATE cart_items SET quantity = ? WHERE id = ?',
          [quantity, existing[0].id]
        );
      } else {
        
        await pool.query(
          'UPDATE cart_items SET quantity = quantity + ? WHERE id = ?',
          [quantity, existing[0].id]
        );
      }
    } else {
      
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


router.post('/sync', verifyToken, async (req, res) => {
  const { items } = req.body; 
  if (!items || !Array.isArray(items)) return res.status(400).json({ error: 'Invalid items' });

  try {
    for (const item of items) {
      const [existing] = await pool.query(
        'SELECT id, quantity FROM cart_items WHERE user_id = ? AND product_id = ? AND size = ?',
        [req.user.id, item.id, item.size]
      );

      if (existing.length > 0) {
        
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


router.delete('/', verifyToken, async (req, res) => {
  try {
    await pool.query('DELETE FROM cart_items WHERE user_id = ?', [req.user.id]);
    res.json({ message: 'Cart cleared' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
