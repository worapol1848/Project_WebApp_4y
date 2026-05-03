// code in this file is written by worapol สุดหล่อ
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const upload = require('../config/upload');
const { logAdminAction } = require('../utils/logger');


// Register User - by worapol สุดหล่อ
router.post('/register', async (req, res) => {
  const { username, password, email } = req.body;
  try {
    const [rows] = await db.query('SELECT * FROM users WHERE username = ?', [username]);
    if (rows.length > 0) return res.status(400).json({ message: 'Username already exists' });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    await db.query(
      'INSERT INTO users (username, password, email, role, preferred_language) VALUES (?, ?, ?, ?, ?)',
      [username, hashedPassword, email, 'user', 'en']
    );
    res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Login User - by worapol สุดหล่อ
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const [rows] = await db.query('SELECT * FROM users WHERE username = ?', [username]);
    if (rows.length === 0) return res.status(400).json({ message: 'Invalid credentials' });

    const user = rows[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({ token, user: { id: user.id, username: user.username, role: user.role, profile_image: user.profile_image } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const { verifyToken, isSuperAdmin } = require('../middlewares/authMiddleware');

// Get Profile - by worapol สุดหล่อ
router.get('/profile', verifyToken, async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT username, email, full_name, phone, address, sub_district, district, province, postal_code, latitude, longitude, preferred_language, profile_image FROM users WHERE id = ?',
      [req.user.id]
    );
    if (rows.length === 0) return res.status(404).json({ message: 'User not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update Profile - by worapol สุดหล่อ
router.put('/profile', verifyToken, async (req, res) => {
  const {
    full_name, phone, address, sub_district, district, province, postal_code, latitude, longitude, preferred_language
  } = req.body;
  try {
    // We update only the fields provided, keeping others the same. - by worapol สุดหล่อ
    // However, to keep it simple and robust, we fetch current values first or use COALESCE in SQL. - by worapol สุดหล่อ
    await db.query(
      `UPDATE users SET 
        full_name = COALESCE(?, full_name), 
        phone = COALESCE(?, phone), 
        address = COALESCE(?, address), 
        sub_district = COALESCE(?, sub_district), 
        district = COALESCE(?, district), 
        province = COALESCE(?, province), 
        postal_code = COALESCE(?, postal_code), 
        latitude = COALESCE(?, latitude), 
        longitude = COALESCE(?, longitude),
        preferred_language = COALESCE(?, preferred_language)
      WHERE id = ?`,
      [
        full_name || null, 
        phone || null, 
        address || null, 
        sub_district || null, 
        district || null, 
        province || null, 
        postal_code || null, 
        latitude || null, 
        longitude || null, 
        preferred_language || null, 
        req.user.id
      ]
    );
    res.json({ message: 'Profile updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update Profile Image - by worapol สุดหล่อ
router.put('/profile-image', verifyToken, upload.single('profile_image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    const imageUrl = `/uploads/${req.file.filename}`;
    await db.query('UPDATE users SET profile_image = ? WHERE id = ?', [imageUrl, req.user.id]);
    res.json({ message: 'Profile image updated successfully', profile_image: imageUrl });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Change Password - by worapol สุดหล่อ
router.put('/change-password', verifyToken, async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  try {
    const [rows] = await db.query('SELECT password FROM users WHERE id = ?', [req.user.id]);
    const user = rows[0];

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Incorrect old password' });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await db.query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, req.user.id]);
    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get Face Data - by worapol สุดหล่อ
router.get('/face-data', verifyToken, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT face_descriptor FROM users WHERE id = ?', [req.user.id]);
    res.json({ face_descriptor: rows[0]?.face_descriptor || null });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update Face Data - by worapol สุดหล่อ
router.put('/face-data', verifyToken, async (req, res) => {
  try {
    const { face_descriptor } = req.body;
    await db.query('UPDATE users SET face_descriptor = ? WHERE id = ?', [face_descriptor ? JSON.stringify(face_descriptor) : null, req.user.id]);
    res.json({ message: 'Face data updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin Management Routes (Super Admin Only) - by worapol สุดหล่อ

// Get all admins - by worapol สุดหล่อ
router.get('/admins', verifyToken, isSuperAdmin, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT id, username, role, email, full_name, phone, profile_image, (face_descriptor IS NOT NULL) as hasFaceData FROM users WHERE role IN ("admin", "superadmin")');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update Face Data for specific admin (Super Admin only) - by worapol สุดหล่อ
router.put('/admins/:id/face-data', verifyToken, isSuperAdmin, async (req, res) => {
  try {
    const { face_descriptor } = req.body;
    await db.query('UPDATE users SET face_descriptor = ? WHERE id = ?', [face_descriptor ? JSON.stringify(face_descriptor) : null, req.params.id]);
    res.json({ message: 'Face data updated for admin successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add new admin - by worapol สุดหล่อ
router.post('/admins', verifyToken, isSuperAdmin, upload.single('profile_image'), async (req, res) => {
  const { username, password, email, role, full_name, phone } = req.body;
  const profile_image = req.file ? `/uploads/${req.file.filename}` : null;
  try {
    const [existing] = await db.query('SELECT * FROM users WHERE username = ?', [username]);
    if (existing.length > 0) return res.status(400).json({ message: 'Username already exists' });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const [result] = await db.query(
      'INSERT INTO users (username, password, email, role, full_name, phone, profile_image) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [username, hashedPassword, email, role || 'admin', full_name || null, phone || null, profile_image]
    );
    await logAdminAction(req.user.id, 'CREATE', 'ADMIN', result.insertId, { username, role });
    res.status(201).json({ message: 'Admin added successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update admin - by worapol สุดหล่อ
router.put('/admins/:id', verifyToken, isSuperAdmin, upload.single('profile_image'), async (req, res) => {
  const { username, email, role, password, old_password, full_name, phone } = req.body;
  const adminId = req.params.id;
  const profile_image = req.file ? `/uploads/${req.file.filename}` : null;
  
  try {
    if (password) {
      if (!old_password) {
        return res.status(400).json({ message: 'Current password is required to set a new password.' });
      }
      const [existing] = await db.query('SELECT password FROM users WHERE id = ?', [adminId]);
      if (existing.length === 0) return res.status(404).json({ message: 'Admin not found.' });
      
      const validPassword = await bcrypt.compare(old_password, existing[0].password);
      if (!validPassword) {
        return res.status(400).json({ message: 'Incorrect current password.' });
      }
    }

    let query = 'UPDATE users SET username = ?, email = ?, role = ?, full_name = ?, phone = ?';
    let params = [username, email, role, full_name || null, phone || null];

    if (profile_image) {
      query += ', profile_image = ?';
      params.push(profile_image);
    }

    // Clear face data if role is changed to something other than superadmin - by worapol สุดหล่อ
    if (role !== 'superadmin') {
      query += ', face_descriptor = NULL';
    }

    if (password) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      query += ', password = ?';
      params.push(hashedPassword);
    }

    query += ' WHERE id = ?';
    params.push(adminId);

    await db.query(query, params);
    await logAdminAction(req.user.id, 'UPDATE', 'ADMIN', adminId, { username, role, full_name });
    res.json({ message: 'Admin updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete admin - by worapol สุดหล่อ
router.delete('/admins/:id', verifyToken, isSuperAdmin, async (req, res) => {
  const adminId = req.params.id;
  try {
    // Prevent deleting self - by worapol สุดหล่อ
    if (parseInt(adminId) === req.user.id) {
      return res.status(400).json({ message: 'Not allowed to delete yourself' });
    }
    const [adminCheck] = await db.query('SELECT username FROM users WHERE id = ?', [adminId]);
    const usernameToDelete = adminCheck.length > 0 ? adminCheck[0].username : 'Unknown';
    
    await db.query('DELETE FROM users WHERE id = ?', [adminId]);
    await logAdminAction(req.user.id, 'DELETE', 'ADMIN', adminId, { username: usernameToDelete });
    res.json({ message: 'Admin deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Reset admin face data - by worapol สุดหล่อ
router.put('/admins/:id/reset-face', verifyToken, isSuperAdmin, async (req, res) => {
  const adminId = req.params.id;
  try {
    await db.query('UPDATE users SET face_descriptor = NULL WHERE id = ?', [adminId]);
    res.json({ message: 'Face data reset successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
