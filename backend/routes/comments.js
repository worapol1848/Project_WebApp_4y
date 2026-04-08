// code in this file is written by worapol สุดหล่อ
const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { verifyToken } = require('../middlewares/authMiddleware');

// Get all comments for a product (Public) - by worapol สุดหล่อ
router.get('/:productId', async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM product_comments WHERE product_id = ? ORDER BY created_at DESC',
      [req.params.productId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Post a new comment (User only) - by worapol สุดหล่อ
router.post('/:productId', verifyToken, async (req, res) => {
  const { comment, rating, size, quantity, order_id } = req.body;
  const productId = req.params.productId;
  const userId = req.user.id;
  const username = req.user.username;

  const starRating = parseInt(rating) || 0;

  if (starRating < 1 || starRating > 5) {
    return res.status(400).json({ message: 'Please provide a valid rating (1-5 stars)' });
  }

  const safeComment = (comment && comment.trim() !== '') ? comment.trim() : '-';

  try {
    // Optional: Check if user has purchased the item? (More advanced) - by worapol สุดหล่อ
    // For now, any logged-in user can comment. - by worapol สุดหล่อ

    const [result] = await db.query(
      'INSERT INTO product_comments (product_id, user_id, username, rating, comment, size, quantity, order_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [productId, userId, username, starRating, safeComment, size || null, quantity || null, order_id || null]
    );

    res.status(201).json({
      id: result.insertId,
      productId,
      userId,
      username,
      rating: starRating,
      comment: safeComment,
      size: size || null,
      quantity: quantity || null,
      order_id: order_id || null,
      created_at: new Date()
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
