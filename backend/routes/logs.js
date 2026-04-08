// code in this file is written by worapol สุดหล่อ
const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { verifyToken, isAdmin } = require('../middlewares/authMiddleware');
const { logAdminAction } = require('../utils/logger');

// Get all admin logs - by worapol สุดหล่อ
router.get('/', verifyToken, isAdmin, async (req, res) => {
  try {
    const [logs] = await db.query(`
      SELECT l.*, u.username as admin_name 
      FROM admin_logs l
      JOIN users u ON l.admin_id = u.id
      ORDER BY l.created_at DESC
      LIMIT 100
    `);

    // Parse details safely - by worapol สุดหล่อ
    const parsedLogs = logs.map(log => {
      let detailsObj = null;
      if (log.details) {
        try {
          detailsObj = JSON.parse(log.details);
        } catch (e) {
          detailsObj = log.details;
        }
      }
      return {
        ...log,
        details: detailsObj
      };
    });

    res.json(parsedLogs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Manual log from frontend (e.g. for PDF exports) - by worapol สุดหล่อ
router.post('/manual', verifyToken, isAdmin, async (req, res) => {
  const { action, entity_type, entity_id, details } = req.body;
  try {
    await logAdminAction(req.user.id, action, entity_type, entity_id, details);
    res.json({ message: 'Log recorded successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
