// code in this file is written by worapol สุดหล่อ
const express = require('express');
const router = express.Router();
const db = require('../config/db');
const upload = require('../config/upload');
const { verifyToken, isAdmin } = require('../middlewares/authMiddleware');
const { logAdminAction } = require('../utils/logger');

// Get unique filters (Brands, Categories, Types) - by worapol สุดหล่อ
router.get('/filters', async (req, res) => {
  try {
    const [brands] = await db.query('SELECT DISTINCT brand FROM products WHERE brand IS NOT NULL AND brand != "" ORDER BY brand ASC');
    const [categories] = await db.query('SELECT DISTINCT category FROM products WHERE category IS NOT NULL AND category != "" ORDER BY category ASC');
    const [productTypes] = await db.query('SELECT DISTINCT product_type FROM products WHERE product_type IS NOT NULL AND product_type != "" ORDER BY product_type ASC');
    
    res.json({
      brands: brands.map(b => b.brand),
      categories: categories.map(c => c.category),
      productTypes: productTypes.map(t => t.product_type)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get products with optional filtering (Public) - by worapol สุดหล่อ
router.get('/', async (req, res) => {
  try {
    const { brand, category, type, sort, sale, minPrice, maxPrice } = req.query;
    
    let baseSelect = `
      SELECT p.*, 
      (SELECT COALESCE(AVG(rating), 0) FROM product_comments WHERE product_id = p.id) as avg_rating,
      (SELECT COUNT(*) FROM product_comments WHERE product_id = p.id) as total_reviews
    `;
    let baseFrom = 'FROM products p';
    let conditions = [];
    let params = [];

    // Filter by Brand, Category, or Type - by worapol สุดหล่อ
    if (brand) {
      conditions.push('p.brand = ?');
      params.push(brand);
    }
    if (category) {
      conditions.push('p.category = ?');
      params.push(category);
    }
    if (type) {
      conditions.push('p.product_type = ?');
      params.push(type);
    }
    
    // Filter items on Sale - by worapol สุดหล่อ
    if (sale === 'true') {
      conditions.push('p.discount_percent > 0');
    }

    // Filter by Price Range (using final price after discount) - by worapol สุดหล่อ
    // Handle NULL discount_percent using COALESCE - by worapol สุดหล่อ
    if (minPrice !== undefined && minPrice !== '') {
      const min = parseFloat(minPrice);
      if (!isNaN(min)) {
        conditions.push('(p.price * (1 - COALESCE(p.discount_percent, 0) / 100)) >= ?');
        params.push(min);
      }
    }
    if (maxPrice !== undefined && maxPrice !== '') {
      const max = parseFloat(maxPrice);
      if (!isNaN(max)) {
        conditions.push('(p.price * (1 - COALESCE(p.discount_percent, 0) / 100)) <= ?');
        params.push(max);
      }
    }

    let query = '';
    if (sort === 'popular') {
      baseSelect = 'SELECT p.*, COALESCE(SUM(oi.quantity), 0) AS total_sold';
      baseFrom += ' LEFT JOIN order_items oi ON p.id = oi.product_id';
      query = `${baseSelect} ${baseFrom}`;
      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
      }
      query += ' GROUP BY p.id ORDER BY total_sold DESC, p.created_at DESC';
    } else {
      query = `${baseSelect} ${baseFrom}`;
      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
      }
      query += ' ORDER BY p.created_at DESC';
    }

    const [products] = await db.query(query, params);
    const [shoeSizes] = await db.query('SELECT * FROM shoe_sizes');
    const [apparelSizes] = await db.query('SELECT * FROM apparel_sizes');
    const [images] = await db.query('SELECT * FROM product_images ORDER BY display_order ASC');

    // Attach sizes and images to each product - by worapol สุดหล่อ
    const productsWithDetails = products.map(p => {
      let combinedSizes = [];
      if (p.product_type === 'apparel') {
        combinedSizes = apparelSizes
          .filter(s => s.product_id === p.id)
          .map(s => ({ ...s, chest_cm: s.chest_inch, size_cm: s.length_inch }));
      } else {
        combinedSizes = shoeSizes
          .filter(s => s.product_id === p.id)
          .map(s => ({ ...s, size_cm: s.length_cm }));
      }

      return {
        ...p,
        sizes: combinedSizes,
        images: images.filter(img => img.product_id === p.id)
      };
    });

    res.json(productsWithDetails);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get product details (Public) - by worapol สุดหล่อ
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT p.*,
      (SELECT COALESCE(AVG(rating), 0) FROM product_comments WHERE product_id = p.id) as avg_rating,
      (SELECT COUNT(*) FROM product_comments WHERE product_id = p.id) as total_reviews
      FROM products p WHERE p.id = ?
    `, [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Product not found' });
    const product = rows[0];

    let sizes = [];
    if (product.product_type === 'apparel') {
      const [appRows] = await db.query('SELECT * FROM apparel_sizes WHERE product_id = ?', [req.params.id]);
      sizes = appRows.map(s => ({ ...s, chest_cm: s.chest_inch, size_cm: s.length_inch }));
    } else {
      const [shoeRows] = await db.query('SELECT * FROM shoe_sizes WHERE product_id = ?', [req.params.id]);
      sizes = shoeRows.map(s => ({ ...s, size_cm: s.length_cm }));
    }

    const [images] = await db.query('SELECT * FROM product_images WHERE product_id = ? ORDER BY display_order ASC', [req.params.id]);

    // Fetch Variants (Products with similar product_code root) - by worapol สุดหล่อ
    let variants = [];
    if (product.product_code) {
      // Find the root part (everything before the last numeric sequence) - by worapol สุดหล่อ
      const match = product.product_code.match(/^(.*?)(\d+)$/);
      const root = match ? match[1] : product.product_code;

      const [vRows] = await db.query(
        'SELECT id, name, image_url, product_code FROM products WHERE product_code LIKE ? AND product_code != ""',
        [`${root}%`]
      );
      variants = vRows;
    } else {
      // If no code, just show self as the only variant - by worapol สุดหล่อ
      variants = [{ id: product.id, name: product.name, image_url: product.image_url, product_code: product.product_code }];
    }

    res.json({ ...product, sizes, images, variants });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: Add a new product - by worapol สุดหล่อ
router.post('/', verifyToken, isAdmin, upload.array('images', 20), async (req, res) => {
  let { name, description, price, discount_percent, product_code, category, brand, sizes, product_type, size_guide, imagesOrder } = req.body;
  console.log('POST /products - Body:', { name, product_type, sizesCount: sizes ? JSON.parse(sizes).length : 0 });

  // 1. Resolve new uploads - by worapol สุดหล่อ
  let uploadedUrls = [];
  if (req.files && req.files.length > 0) {
    uploadedUrls = req.files.map(f => `/uploads/${f.filename}`);
  }

  let parsedOrder = [];
  if (imagesOrder) {
    try { parsedOrder = JSON.parse(imagesOrder); } catch (e) { parsedOrder = []; }
  }

  // 2. Map 'NEW_FILE' placeholders to actual URLs - by worapol สุดหล่อ
  let nextFileIdx = 0;
  const finalOrder = parsedOrder.map(item => {
    if (item === 'NEW_FILE') return uploadedUrls[nextFileIdx++] || null;
    return item;
  }).filter(url => url !== null);

  // If no imagesOrder provided but we have files, use files as fallback (standard add) - by worapol สุดหล่อ
  let currentImageUrl = null;
  if (finalOrder.length > 0) {
    currentImageUrl = finalOrder[0];
  } else if (uploadedUrls.length > 0) {
    currentImageUrl = uploadedUrls[0];
  }

  // 3. Parse sizes - by worapol สุดหล่อ
  let parsedSizes = [];
  if (sizes) {
    try { parsedSizes = JSON.parse(sizes); } catch (e) { parsedSizes = []; }
  }

  // 4. Calculate total stock from sizes - by worapol สุดหล่อ
  const totalStock = parsedSizes.reduce((sum, s) => sum + (parseInt(s.stock) || 0), 0);

  try {
    const [result] = await db.query(
      'INSERT INTO products (product_code, category, brand, name, description, price, discount_percent, stock, image_url, product_type, size_guide) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [product_code || null, category || null, brand || null, name, description, price, discount_percent || 0, totalStock, currentImageUrl, product_type || 'shoe', size_guide || null]
    );
    const productId = result.insertId;

    // 5. Insert sizes into separate tables - by worapol สุดหล่อ
    if (parsedSizes.length > 0) {
      if (product_type === 'apparel') {
        const sizeValues = parsedSizes.map(s => [productId, String(s.size), s.chest_cm || s.chest_inch || null, s.size_cm || s.length_inch || null, parseInt(s.stock) || 0]);
        await db.query('INSERT INTO apparel_sizes (product_id, size, chest_inch, length_inch, stock) VALUES ?', [sizeValues]);
      } else {
        const sizeValues = parsedSizes.map(s => [productId, String(s.size), s.size_cm || s.length_cm || null, parseInt(s.stock) || 0]);
        await db.query('INSERT INTO shoe_sizes (product_id, size, length_cm, stock) VALUES ?', [sizeValues]);
      }
    }

    // 6. Insert additional gallery images - by worapol สุดหล่อ
    // If we have finalOrder, use it (skipping first which is primary) - by worapol สุดหล่อ
    if (finalOrder.length > 1) {
      const galleryItems = finalOrder.slice(1);
      const galleryValues = galleryItems.map((url, idx) => [productId, url, idx]);
      await db.query('INSERT INTO product_images (product_id, image_url, display_order) VALUES ?', [galleryValues]);
    } else if (uploadedUrls.length > 1 && finalOrder.length === 0) {
      // Fallback for standard add without imagesOrder - by worapol สุดหล่อ
      const galleryValues = uploadedUrls.slice(1).map((url, idx) => [productId, url, idx]);
      await db.query('INSERT INTO product_images (product_id, image_url, display_order) VALUES ?', [galleryValues]);
    }

    const sizeDetails = parsedSizes.length > 0 ? parsedSizes.map(s => `${s.size} (qty: ${s.stock})`).join(', ') : 'none';
    await logAdminAction(req.user.id, 'CREATE', 'PRODUCT', productId, { name, category, brand, stock: totalStock, sizes: sizeDetails });

    res.status(201).json({ id: productId, message: 'Product added successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Admin: Update a product - by worapol สุดหล่อ
router.put('/:id', verifyToken, isAdmin, upload.array('images', 20), async (req, res) => {
  let { name, description, price, discount_percent, product_code, category, brand, sizes, product_type, size_guide } = req.body;
  const productId = req.params.id;
  console.log(`PUT /products/${productId} - Body:`, { name, product_type, sizes });


  try {
    const [existing] = await db.query('SELECT * FROM products WHERE id = ?', [productId]);
    if (existing.length === 0) return res.status(404).json({ message: 'Product not found' });
    const oldProduct = existing[0];

    // Fetch old sizes for diffing - by worapol สุดหล่อ
    let oldSizes = [];
    if (oldProduct.product_type === 'apparel') {
      const [rows] = await db.query('SELECT size, stock FROM apparel_sizes WHERE product_id = ?', [productId]);
      oldSizes = rows;
    } else {
      const [rows] = await db.query('SELECT size, stock FROM shoe_sizes WHERE product_id = ?', [productId]);
      oldSizes = rows;
    }

    // IMAGE LOGIC (Enhanced with Reordering) - by worapol สุดหล่อ
    let { deletedImageIds, primaryImageUrl, imagesOrder } = req.body;

    // 1. Resolve new uploads - by worapol สุดหล่อ
    let uploadedUrls = [];
    if (req.files && req.files.length > 0) {
      uploadedUrls = req.files.map(f => `/uploads/${f.filename}`);
    }

    let parsedOrder = [];
    if (imagesOrder) {
      try { parsedOrder = JSON.parse(imagesOrder); } catch (e) { parsedOrder = []; }
    }

    // 2. Map 'NEW_FILE' placeholders to actual URLs - by worapol สุดหล่อ
    let nextFileIdx = 0;
    const finalOrder = parsedOrder.map(item => {
      if (item === 'NEW_FILE') return uploadedUrls[nextFileIdx++] || null;
      return item;
    }).filter(url => url !== null);

    // 3. Determine the primary image URL - by worapol สุดหล่อ
    // The first image in finalOrder is ALWAYS the primary image now - by worapol สุดหล่อ
    let currentImageUrl = (finalOrder.length > 0) ? finalOrder[0] : (existing[0].image_url);

    // 4. Update Gallery (product_images) - by worapol สุดหล่อ
    // Clear old rows and re-insert to reflect new order and display_order - by worapol สุดหล่อ
    await db.query('DELETE FROM product_images WHERE product_id = ?', [productId]);

    // We filter out the image that is used as primary from the additional gallery - by worapol สุดหล่อ
    // (This keeps the existing logic of image_url vs product_images matching) - by worapol สุดหล่อ
    const galleryItems = finalOrder.filter(url => url !== currentImageUrl);
    if (galleryItems.length > 0) {
      const galleryValues = galleryItems.map((url, idx) => [productId, url, idx]);
      await db.query('INSERT INTO product_images (product_id, image_url, display_order) VALUES ?', [galleryValues]);
    }

    // 5. Calculate Total Stock - by worapol สุดหล่อ
    let parsedSizes = [];
    if (sizes) {
      try { parsedSizes = JSON.parse(sizes); } catch (e) { parsedSizes = []; }
    }
    const totalStock = parsedSizes.reduce((sum, s) => sum + (parseInt(s.stock) || 0), 0);

    // 6. Update main product table - by worapol สุดหล่อ
    await db.query(
      'UPDATE products SET product_code=?, category=?, brand=?, name=?, description=?, price=?, discount_percent=?, stock=?, image_url=?, product_type=?, size_guide=? WHERE id=?',
      [product_code || null, category || null, brand || null, name, description, price, discount_percent || 0, totalStock, currentImageUrl, product_type || 'shoe', size_guide || null, productId]
    );

    // Update sizes (delete from both just in case of type change) - by worapol สุดหล่อ
    await db.query('DELETE FROM shoe_sizes WHERE product_id = ?', [productId]);
    await db.query('DELETE FROM apparel_sizes WHERE product_id = ?', [productId]);

    if (parsedSizes.length > 0) {
      if (product_type === 'apparel') {
        const sizeValues = parsedSizes.map(s => [productId, String(s.size), s.chest_cm || s.chest_inch || null, s.size_cm || s.length_inch || null, parseInt(s.stock) || 0]);
        await db.query('INSERT INTO apparel_sizes (product_id, size, chest_inch, length_inch, stock) VALUES ?', [sizeValues]);
      } else {
        const sizeValues = parsedSizes.map(s => [productId, String(s.size), s.size_cm || s.length_cm || null, parseInt(s.stock) || 0]);
        await db.query('INSERT INTO shoe_sizes (product_id, size, length_cm, stock) VALUES ?', [sizeValues]);
      }
    }

    // Calculate Changes  - by worapol สุดหล่อ
    let changes = [];
    if (oldProduct.name !== name) changes.push(`Name changed`);
    if (Number(oldProduct.price) !== Number(price)) changes.push(`Price changed`);

    let oldMap = {};
    oldSizes.forEach(s => oldMap[s.size] = parseInt(s.stock));
    let newMap = {};
    parsedSizes.forEach(s => newMap[s.size] = parseInt(s.stock));

    for (let size in oldMap) {
      if (!(size in newMap)) {
        changes.push(`Removed size ${size}`);
      } else if (oldMap[size] !== newMap[size]) {
        changes.push(`Updated size ${size} qty: ${oldMap[size]} -> ${newMap[size]}`);
      }
    }
    for (let size in newMap) {
      if (!(size in oldMap)) {
        changes.push(`Added size ${size} (qty: ${newMap[size]})`);
      }
    }

    const sizeDetails = parsedSizes.length > 0 ? parsedSizes.map(s => `${s.size} (qty: ${s.stock})`).join(', ') : 'none';
    const actionDetails = {
      name,
      stock: totalStock,
      sizes: sizeDetails,
      changes: changes.length > 0 ? changes.join(' | ') : 'General profile updates'
    };

    await logAdminAction(req.user.id, 'UPDATE', 'PRODUCT', productId, actionDetails);

    res.json({ message: 'Product updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Admin: Delete a product - by worapol สุดหล่อ
router.delete('/:id', verifyToken, isAdmin, async (req, res) => {
  try {
    await db.query('DELETE FROM products WHERE id = ?', [req.params.id]);

    await logAdminAction(req.user.id, 'DELETE', 'PRODUCT', req.params.id, null);

    res.json({ message: 'Product deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
