// code in this file is written by worapol สุดหล่อ
const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

// Middleware - by worapol สุดหล่อ
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes - by worapol สุดหล่อ
app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/comments', require('./routes/comments'));
app.use('/api/logs', require('./routes/logs'));
app.use('/api/cart', require('./routes/cart'));
app.use('/api/wishlist', require('./routes/wishlist'));

// Health check endpoint - by worapol สุดหล่อ
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Velin Inventory API is running', version: 'split_v1' });
});

// Start Server - by worapol สุดหล่อ
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
