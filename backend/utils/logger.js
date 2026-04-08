// code in this file is written by worapol สุดหล่อ
const db = require('../config/db');

async function logAdminAction(admin_id, action, entity_type, entity_id, details) {
  try {
    const detailsStr = details ? JSON.stringify(details) : null;
    await db.query(
      'INSERT INTO admin_logs (admin_id, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?)',
      [admin_id, action, entity_type, entity_id, detailsStr]
    );
  } catch (error) {
    console.error('Error logging admin action:', error.message);
  }
}

module.exports = { logAdminAction };
