// code in this file is written by worapol สุดหล่อ
import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { AuthContext } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import './AdminProductDetail.css';

const AdminProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { user } = useContext(AuthContext);
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mainImage, setMainImage] = useState(null);

  // Edit Modal State - by worapol สุดหล่อ
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    discount_percent: 0,
    product_code: '',
    category: '',
    brand: '',
    images: []
  });
  const [sizes, setSizes] = useState([]);
  const [sizeGuide, setSizeGuide] = useState([]);
  const [galleryImages, setGalleryImages] = useState([]); // {id, url, isNew, file} - by worapol สุดหล่อ
  const [deletedImageIds, setDeletedImageIds] = useState([]);
  const [sizeType, setSizeType] = useState('shoe'); // 'shoe' or 'apparel' - by worapol สุดหล่อ
  const [lengthUnit, setLengthUnit] = useState('in'); // 'in' or 'cm' - by worapol สุดหล่อ
  const [activeExtraColumns, setActiveExtraColumns] = useState([]);
  const [showColDropdown, setShowColDropdown] = useState(false);
  const [customColumnInput, setCustomColumnInput] = useState('');
  const [customColumns, setCustomColumns] = useState([]);
  const [comments, setComments] = useState([]);

  const predefinedExtraColOptions = sizeType === 'shoe'
    ? [{ key: 'size_cm', label: 'Length (ความยาว)' }, { key: 'uk', label: 'UK' }, { key: 'us', label: 'US' }, { key: 'eu', label: 'EU' }, { key: 'usw', label: 'USW' }, { key: 'jp', label: 'JP' }]
    : [{ key: 'chest_cm', label: 'Chest (รอบอก)' }, { key: 'size_cm', label: 'Length (ความยาว)' }, { key: 'height', label: 'Height (ส่วนสูง)' }, { key: 'waist', label: 'Waist (เอว)' }, { key: 'hip', label: 'Hip (สะโพก)' }];

  const extraColOptions = [...predefinedExtraColOptions, ...customColumns];

  const handleAddCustomColumn = (e) => {
    e.preventDefault();
    if (!customColumnInput.trim()) return;
    const key = customColumnInput.trim().toLowerCase().replace(/[^a-z0-9]/g, '_');
    if (extraColOptions.find(o => o.key === key)) {
      setCustomColumnInput('');
      return;
    }
    const newCol = { key, label: customColumnInput.trim() };
    setCustomColumns([...customColumns, newCol]);
    setCustomColumnInput('');
    if (!activeExtraColumns.includes(key)) {
      handleToggleExtraColumn(key);
    }
  };

  const handleToggleExtraColumn = (colKey) => {
    if (activeExtraColumns.includes(colKey)) {
      setActiveExtraColumns(activeExtraColumns.filter(c => c !== colKey));
      setSizeGuide(prev => prev.map(s => {
        const newS = { ...s };
        delete newS[colKey];
        return newS;
      }));
    } else {
      setActiveExtraColumns([...activeExtraColumns, colKey]);
      setSizeGuide(prev => prev.map(s => ({ ...s, [colKey]: '' })));
    }
  };

  useEffect(() => {
    fetchProduct();
    fetchComments();
  }, [id]);

  const handleTypeChange = (type) => {
    setSizeType(type);
    if (type === 'apparel') {
      setLengthUnit('in');
      setActiveExtraColumns(['chest_cm', 'size_cm']);
    } else {
      setLengthUnit('cm');
      setActiveExtraColumns(['size_cm']);
    }
    setCustomColumns([]);
  };

  const [draggedItem, setDraggedItem] = useState(null);

  const handleDragStart = (e, index, type) => {
    setDraggedItem({ index, type });
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e, index, type) => {
    e.preventDefault();
    if (!draggedItem || draggedItem.type !== type || draggedItem.index === index) return;

    if (type === 'guide') {
      const newList = [...sizeGuide];
      const movedItem = newList[draggedItem.index];
      newList.splice(draggedItem.index, 1);
      newList.splice(index, 0, movedItem);
      setSizeGuide(newList);
    } else {
      const newList = [...sizes];
      const movedItem = newList[draggedItem.index];
      newList.splice(draggedItem.index, 1);
      newList.splice(index, 0, movedItem);
      setSizes(newList);
    }
    setDraggedItem(null);
  };

  const fetchComments = async () => {
    try {
      const res = await api.get(`/comments/${id}`);
      setComments(res.data);
    } catch (err) {
      console.error('Failed to fetch comments', err);
    }
  };

  const renderStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(<span key={i} className={`star ${i <= rating ? 'filled' : ''}`}>★</span>);
    }
    return stars;
  };

  const fetchProduct = async () => {
    try {
      const res = await api.get(`/products/${id}`);
      setProduct(res.data);
    } catch (err) {
      console.error('Failed to fetch product details:', err);
      showToast('Product not found', 'error');
      navigate('/admin/products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (product) {
      setMainImage(product.image_url);
    }
  }, [product]);

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      try {
        await api.delete(`/products/${id}`);
        showToast("Product deleted successfully");
        navigate('/admin/products');
      } catch (err) {
        console.error(err);
        showToast("Failed to delete product", "error");
      }
    }
  };

  const handleEdit = () => {
    setFormData({
      name: product.name,
      description: product.description,
      price: product.price,
      discount_percent: product.discount_percent || 0,
      product_code: product.product_code || '',
      category: product.category || '',
      brand: product.brand || '',
      images: []
    });
    setSizes(product.sizes || []);
    let sg = [];
    let initialExtraCols = new Set();
    let parsedCustomCols = [];
    if (product.size_guide) {
      try {
        sg = JSON.parse(product.size_guide);
        sg.forEach(item => {
          Object.keys(item).forEach(k => {
            if (k !== 'size') initialExtraCols.add(k);
          });
        });
      } catch (e) { sg = []; }
    }
    setSizeGuide(sg);

    // Parse custom columns out of the initial extra cols - by worapol สุดหล่อ
    const pType = product.product_type || (product.sizes?.some(s => s.chest_cm) ? 'apparel' : 'shoe');
    const predefinedKeys = pType === 'shoe' ? ['size_cm', 'uk', 'us', 'eu', 'usw', 'jp'] : ['chest_cm', 'size_cm', 'height', 'waist', 'hip'];
    initialExtraCols.forEach(k => {
      if (!predefinedKeys.includes(k)) {
        parsedCustomCols.push({ key: k, label: k.replace(/_/g, ' ') });
      }
    });
    setCustomColumns(parsedCustomCols);
    setActiveExtraColumns(Array.from(initialExtraCols));

    const initialGallery = [];
    if (product.image_url) {
      initialGallery.push({ id: 'primary', image_url: product.image_url, isNew: false });
    }
    if (product.images) {
      product.images.forEach(img => {
        if (img.image_url !== product.image_url) {
          initialGallery.push({ ...img, isNew: false });
        }
      });
    }
    setGalleryImages(initialGallery);
    setDeletedImageIds([]);

    // Auto-detect size type based on existing data or product field - by worapol สุดหล่อ
    const hasChest = product.sizes?.some(s => s.chest_cm);
    const initialType = product.product_type || (hasChest ? 'apparel' : 'shoe');
    setSizeType(initialType);

    // Auto detect unit based on first guide item if any - by worapol สุดหล่อ
    if (sg.length > 0 && sg[0].size_cm?.includes('cm')) {
      setLengthUnit('cm');
    } else {
      setLengthUnit('in');
    }

    setShowModal(true);
  };

  const handleInputChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'images') {
      const newFiles = Array.from(files).map(file => ({
        id: `new-${Date.now()}-${Math.random()}`,
        image_url: URL.createObjectURL(file),
        isNew: true,
        file: file
      }));
      setGalleryImages(prev => [...prev, ...newFiles]);
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleRemoveImage = (img) => {
    if (!img.isNew) {
      setDeletedImageIds(prev => [...prev, img.id]);
    }
    setGalleryImages(prev => prev.filter(item => item.id !== img.id));
  };

  const moveImage = (index, direction) => {
    const newGallery = [...galleryImages];
    const newIndex = index + direction;
    if (newIndex >= 0 && newIndex < newGallery.length) {
      [newGallery[index], newGallery[newIndex]] = [newGallery[newIndex], newGallery[index]];
      setGalleryImages(newGallery);
    }
  };

  const handleAddSize = () => setSizes([...sizes, { size: '', size_cm: '', chest_cm: '', stock: '' }]);

  const handleSizeChange = (index, field, value) => {
    setSizes(prev => prev.map((s, i) => i === index ? { ...s, [field]: value } : s));
  };

  const handleRemoveSize = (index) => setSizes(sizes.filter((_, i) => i !== index));

  const handleAddGuide = () => {
    setSizeGuide([...sizeGuide, { size: '', size_cm: '', chest_cm: '' }]);
  };

  const handleGuideChange = (index, field, value) => {
    setSizeGuide(prev => prev.map((s, i) => i === index ? { ...s, [field]: value } : s));
  };

  const handleRemoveGuide = (index) => {
    setSizeGuide(sizeGuide.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = new FormData();
    data.append('name', formData.name);
    data.append('description', formData.description);
    data.append('price', formData.price);
    data.append('discount_percent', formData.discount_percent || 0);
    data.append('product_code', formData.product_code);
    data.append('category', formData.category);
    data.append('brand', formData.brand);

    // Auto-sync size fields from guide - by worapol สุดหล่อ
    const finalSizes = sizes.map(s => {
      const match = sizeGuide.find(g => g.size === s.size) || {};
      return {
        ...s,
        chest_cm: match.chest_cm || '',
        size_cm: match.size_cm || ''
      };
    });

    data.append('sizes', JSON.stringify(finalSizes));
    data.append('product_type', sizeType);
    data.append('size_guide', JSON.stringify(sizeGuide));


    // Send images order and files - by worapol สุดหล่อ
    const newFiles = galleryImages.filter(img => img.isNew).map(img => img.file);
    newFiles.forEach(file => data.append('images', file));

    // Send full image order (urls) - by worapol สุดหล่อ
    const imagesOrder = galleryImages.map(img => img.isNew ? 'NEW_FILE' : img.image_url);
    data.append('imagesOrder', JSON.stringify(imagesOrder));

    if (deletedImageIds.length > 0) data.append('deletedImageIds', JSON.stringify(deletedImageIds));

    try {
      await api.put(`/products/${id}`, data);
      showToast('Product updated successfully!');
      setShowModal(false);
      fetchProduct();
    } catch (err) {
      showToast('Update failed', 'error');
    }
  };

  const allImages = product ? [
    ...(product.image_url ? [{ id: 'primary', image_url: product.image_url }] : []),
    ...(product.images || [])
  ].filter((v, i, a) => a.findIndex(v2 => (v2.image_url === v.image_url)) === i) : [];

  const handleNextImage = () => {
    const currentIndex = allImages.findIndex(img => img.image_url === mainImage);
    const nextIndex = (currentIndex + 1) % allImages.length;
    setMainImage(allImages[nextIndex].image_url);
  };

  const handlePrevImage = () => {
    const currentIndex = allImages.findIndex(img => img.image_url === mainImage);
    const prevIndex = (currentIndex - 1 + allImages.length) % allImages.length;
    setMainImage(allImages[prevIndex].image_url);
  };

  if (loading) {
    return <div className="product-detail-loading">Loading Product Details...</div>;
  }

  if (!product) return null;

  return (
    <div className="product-detail-container">
      <div className="nav-actions">
        <button className="back-btn-new" onClick={() => navigate(-1)}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          <span>Back</span>
        </button>
      </div>

      <div className="product-detail-card">
        <div className="product-detail-top">
          {/* Left: Product Images Gallery */}
          <div className="product-gallery">
            <div className="main-image-container">
              <div className="product-image-wrapper">
                <img
                  src={mainImage ? `http://localhost:5000${mainImage}` : 'https://via.placeholder.com/600x400?text=No+Image'}
                  alt={product.name}
                  className="product-detail-img"
                />
              </div>

              {allImages.length > 1 && (
                <div className="carousel-nav">
                  <button className="nav-arrow" onClick={handlePrevImage} title="Previous">&#10094;</button>
                  <button className="nav-arrow" onClick={handleNextImage} title="Next">&#10095;</button>
                </div>
              )}
            </div>

            {allImages.length > 1 && (
              <div className="product-thumbnails">
                {allImages.map((img, idx) => (
                  <div
                    key={img.id || idx}
                    className={`thumbnail-wrapper ${mainImage === img.image_url ? 'active' : ''}`}
                    onClick={() => setMainImage(img.image_url)}
                  >
                    <img
                      src={`http://localhost:5000${img.image_url}`}
                      alt={`${product.name} thumbnail ${idx + 1}`}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right: Product Info */}
          <div className="product-info-wrapper">
            <div className="product-meta">
              {product.brand && <span className="meta-brand">{product.brand}</span>}
              {product.product_code && <span className="meta-code">Code: {product.product_code}</span>}
            </div>

            <h1 className="product-title">{product.name}</h1>

            {product.category && (
              <p className="product-category-label">Category: {product.category}</p>
            )}

            <div className="product-price-row">
              <div className="admin-price-container">
                {product.discount_percent > 0 ? (
                  <div className="price-with-discount">
                    <div className="prices-stack">
                      <span className="price-old">฿{Number(product.price).toLocaleString()}</span>
                      <span className="price-new">฿{Number(product.price * (1 - product.discount_percent / 100)).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</span>
                    </div>
                    <span className="discount-badge-small">-{product.discount_percent}%</span>
                  </div>
                ) : (
                  <span className="product-price">฿{Number(product.price).toLocaleString()}</span>
                )}
              </div>
              <span className={`product-status ${product.stock === 0 ? 'out-stock' : product.stock < 5 ? 'low-stock' : 'in-stock'}`}>
                {product.stock === 0 ? 'Out of Stock' : `In Stock (${product.stock})`}
              </span>
            </div>

            {product.variants && product.variants.length > 1 && (
              <div className="variants-section">
                <h3 style={{ fontSize: '0.9rem', color: '#6B7280', textTransform: 'uppercase', marginBottom: '0.75rem' }}>Variants / Colors</h3>
                <div className="variant-options-grid">
                  {product.variants.map(v => (
                    <div
                      key={v.id}
                      className={`variant-option ${v.id === product.id ? 'active' : ''}`}
                      onClick={() => v.id !== product.id && navigate(`/admin/product/${v.id}`)}
                      title={v.name}
                    >
                      <img src={`http://localhost:5000${v.image_url}`} alt={v.name} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {product.sizes && product.sizes.length > 0 && (
              <div className="product-sizes-section">
                <h3>Available Sizes</h3>
                <div className="size-options-grid">
                  {product.sizes.map(s => (
                    <div key={s.id} className={`size-option ${s.stock === 0 ? 'sold-out' : ''}`}>
                      <span className="size-name">{s.size}</span>
                      <span className={`size-qty ${Number(s.stock) < 5 ? 'qty-low' : 'qty-good'}`}>{s.stock} left</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bottom: Description & Actions */}
        <div className="product-detail-bottom">
          <div className="product-description-container">
            <h2 className="section-heading">Product Details</h2>
            <div className="product-description-content">
              {product.description ? (
                <p>{product.description}</p>
              ) : (
                <p className="no-desc">No description available for this product.</p>
              )}
            </div>
          </div>

          {(() => {
            let guideData = [];
            if (product.size_guide) {
              try {
                guideData = JSON.parse(product.size_guide);
              } catch (e) { }
            }
            if (!guideData || guideData.length === 0) {
              guideData = product.sizes || [];
            }

            if (guideData.length === 0) return null;

            const productType = product.product_type || (guideData.some(s => s.chest_cm) ? 'apparel' : 'shoe');
            const extraColOptions = productType === 'shoe'
              ? [{ key: 'size_cm', label: 'Length (ความยาว)' }, { key: 'uk', label: 'UK' }, { key: 'us', label: 'US' }, { key: 'eu', label: 'EU' }, { key: 'usw', label: 'USW' }, { key: 'jp', label: 'JP' }]
              : [{ key: 'chest_cm', label: 'Chest (รอบอก)' }, { key: 'size_cm', label: 'Length (ความยาว)' }, { key: 'height', label: 'Height (ส่วนสูง)' }, { key: 'waist', label: 'Waist (เอว)' }, { key: 'hip', label: 'Hip (สะโพก)' }];

            const extraKeys = new Set();
            guideData.forEach(item => {
              Object.keys(item).forEach(k => {
                if (!['size', 'size_cm', 'chest_cm', 'stock', 'id', 'product_id', 'created_at', 'updated_at'].includes(k)) extraKeys.add(k);
              });
            });
            const extraColumns = Array.from(extraKeys);

            return (
              <div className="size-guide-section">
                <h2 className="section-heading">Size Guide (ตารางเทียบไซส์)</h2>
                <div className="size-guide-table-wrapper">
                  <table className="size-guide-table">
                    <thead>
                      <tr>
                        <th>Size (ไซส์)</th>
                        {guideData.some(s => s.chest_cm) && <th>Chest (รอบอก)</th>}
                        {guideData.some(s => s.size_cm) && <th>Length (ความยาว)</th>}
                        {extraColumns.map(col => (
                          <th key={col}>{extraColOptions.find(o => o.key === col)?.label || col.toUpperCase()}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {guideData.map((s, index) => (
                        <tr key={index}>
                          <td><strong>{s.size}</strong></td>
                          {guideData.some(sz => sz.chest_cm) && <td>{s.chest_cm ? (s.chest_cm.includes('in') || s.chest_cm.includes('cm') ? s.chest_cm : `${s.chest_cm} in`) : '-'}</td>}
                          {guideData.some(sz => sz.size_cm) && <td>{s.size_cm ? (s.size_cm.includes('in') || s.size_cm.includes('cm') ? s.size_cm : (productType === 'apparel' || s.chest_cm ? `${s.size_cm} in` : `${s.size_cm} cm`)) : '-'}</td>}
                          {extraColumns.map(col => (
                            <td key={col}>{s[col] || '-'}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })()}

          {/* Admin Comments Section (View Only) */}
          <div className="product-comments-container" style={{ marginTop: '3rem' }}>
            <div className="comments-header-row">
              <h2 className="section-heading" style={{ marginBottom: '1rem' }}>Customer Reviews</h2>
            </div>

            <div className="comments-list">
              {comments.length > 0 ? (
                comments.map((c) => (
                  <div key={c.id} className="comment-item" style={{ marginBottom: '1.5rem', padding: '1.5rem', border: '1px solid #eee', borderRadius: '12px', backgroundColor: '#fafafa' }}>
                    <div className="comment-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <div className="user-info-stack">
                        <span className="comment-user" style={{ fontWeight: '700', color: '#111', marginRight: '10px' }}>{c.username}</span>
                        <div className="comment-stars-display" style={{ display: 'inline-flex', alignItems: 'center', color: '#f59e0b', gap: '8px' }}>
                          <div>{renderStars(c.rating || 5)}</div>
                          {(c.size || c.quantity) && (
                            <span style={{ fontSize: '0.8rem', color: '#888', background: '#f0f0f0', padding: '2px 6px', borderRadius: '4px' }}>
                              {c.size ? `ไซส์: ${c.size}` : ''} {c.quantity ? `(จำนวน: ${c.quantity})` : ''}
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="comment-date" style={{ color: '#888', fontSize: '0.85rem' }}>{new Date(c.created_at).toLocaleDateString('th-TH')}</span>
                    </div>
                    <p className="comment-text" style={{ color: '#555', marginTop: '0.5rem', lineHeight: '1.5' }}>{c.comment}</p>
                  </div>
                ))
              ) : (
                <p className="no-comments" style={{ color: '#888', fontStyle: 'italic' }}>ยังไม่มีความคิดเห็นสำหรับสินค้านี้</p>
              )}
            </div>
          </div>

          {user?.role === 'admin' && (
            <div className="product-actions-bottom-right">
              <button className="action-btn edit-btn" onClick={handleEdit}>Edit</button>
              <button className="action-btn delete-btn" onClick={handleDelete}>Delete</button>
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <div className="admin-product-overlay">
          <div className="admin-wide-modal-content">
            <h3 style={{ marginBottom: '1.5rem', fontWeight: 700 }}>Edit Product Details</h3>
            <form onSubmit={handleSubmit}>
              <div className="modal-grid">
                {/* Column 1: Basic Info */}
                <div className="modal-col">
                  <div className="form-group">
                    <label>Product Name</label>
                    <input type="text" name="name" value={formData.name} onChange={handleInputChange} required />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Code</label>
                      <input type="text" name="product_code" value={formData.product_code} onChange={handleInputChange} />
                    </div>
                    <div className="form-group">
                      <label>Price (฿)</label>
                      <input type="number" name="price" value={formData.price} onChange={handleInputChange} min="0" step="0.01" required />
                    </div>
                    <div className="form-group">
                      <label>Discount (%)</label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input type="number" name="discount_percent" value={formData.discount_percent} onChange={handleInputChange} min="0" max="100" />
                        {formData.price && formData.discount_percent > 0 && (
                          <span style={{ fontSize: '0.9rem', color: '#10B981', fontWeight: 'bold', whiteSpace: 'nowrap' }}>
                            = ฿{(formData.price - (formData.price * formData.discount_percent / 100)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Category</label>
                      <input type="text" name="category" value={formData.category} onChange={handleInputChange} />
                    </div>
                    <div className="form-group">
                      <label>Brand</label>
                      <input type="text" name="brand" value={formData.brand} onChange={handleInputChange} />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Description</label>
                    <textarea name="description" value={formData.description} onChange={handleInputChange} rows="5" required></textarea>
                  </div>

                  <div className="form-group" style={{ marginTop: '1rem' }}>
                    <label>Manage Gallery (The first image is the cover, use ◀ ▶ to reorder)</label>
                    <div className="image-preview-grid">
                      {galleryImages.map((img, index) => (
                        <div key={img.id} className={`preview-item ${index === 0 ? 'is-primary' : ''}`}>
                          <img src={img.isNew ? img.image_url : `http://localhost:5000${img.image_url}`} alt="Gallery" />
                          {index === 0 && <div className="primary-badge">Cover</div>}
                          <div className="image-reorder-controls">
                            <button type="button" onClick={() => moveImage(index, -1)} disabled={index === 0}>◀</button>
                            <button type="button" onClick={() => moveImage(index, 1)} disabled={index === galleryImages.length - 1}>▶</button>
                          </div>
                          <button type="button" className="remove-preview-btn" onClick={() => handleRemoveImage(img)} title="Remove">&times;</button>
                        </div>
                      ))}
                    </div>

                    <div className="upload-container">
                      <input type="file" name="images" id="modal-images-upload" multiple accept="image/*" onChange={handleInputChange} style={{ display: 'none' }} />
                      <label htmlFor="modal-images-upload" className="upload-label">
                        <span>+ Add Photos</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Column 2: Sizes & Gallery */}
                <div className="modal-col">
                  {/* กล่องใหญ่ที่ 1: จัดการสต๊อก (Stock Management) */}
                  <div className="management-container">
                    <div className="management-header">
                      <div className="header-with-toggle">
                        <h3>Stock</h3>
                      </div>
                      <button type="button" className="btn-add-entry" onClick={handleAddSize}>+ Add Stock</button>
                    </div>


                    <div className="entries-list">
                      {sizes.length > 0 && (
                        <div className={`entry-grid-header ${sizeType === 'apparel' ? 'apparel-stock' : 'shoe-stock'}`} style={{ gridTemplateColumns: `30px 1fr ${activeExtraColumns.includes('chest_cm') ? '1fr ' : ''}${activeExtraColumns.includes('size_cm') ? '1fr ' : ''}1fr 44px` }}>
                          <span></span>
                          <span>Size (ไซส์)</span>
                          {activeExtraColumns.includes('chest_cm') && <span>Chest (รอบอก/{lengthUnit === 'in' ? 'นิ้ว' : 'cm'})</span>}
                          {activeExtraColumns.includes('size_cm') && <span>Length (ความยาว/{sizeType === 'shoe' ? 'cm' : 'นิ้ว'})</span>}
                          <span>Stock (จำนวน)</span>
                          <span></span>
                        </div>
                      )}
                      {sizes.map((s, index) => {
                        const matchedGuide = sizeGuide.find(g => g.size === s.size);
                        const displayChest = matchedGuide ? matchedGuide.chest_cm : '';
                        const displayLength = matchedGuide ? matchedGuide.size_cm : '';
                        return (
                          <div
                            key={`stock-${index}`}
                            className={`entry-grid ${sizeType === 'apparel' ? 'apparel-stock' : 'shoe-stock'}`}
                            style={{ gridTemplateColumns: `30px 1fr ${activeExtraColumns.includes('chest_cm') ? '1fr ' : ''}${activeExtraColumns.includes('size_cm') ? '1fr ' : ''}1fr 44px` }}
                            draggable
                            onDragStart={(e) => handleDragStart(e, index, 'stock')}
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, index, 'stock')}
                          >
                            <div className="drag-handle" style={{ cursor: 'grab', color: '#9CA3AF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>⠿</div>
                            <input type="text" className="entry-input" placeholder="Size" value={s.size} onChange={(e) => handleSizeChange(index, 'size', e.target.value)} required />
                            {activeExtraColumns.includes('chest_cm') && (
                              <input type="text" className="entry-input input-disabled" placeholder="Chest (อิงตารางไซส์)" value={displayChest || ''} disabled title="อ้างอิงรอบอก จากตารางไซส์" />
                            )}
                            {activeExtraColumns.includes('size_cm') && (
                              <input type="text" className="entry-input input-disabled" placeholder={sizeType === 'shoe' ? "Length (อิงตารางไซส์)" : "Length (อิงตารางไซส์)"} value={displayLength || ''} disabled title="อ้างอิงความยาว จากตารางไซส์" />
                            )}
                            <input type="number" className="entry-input" placeholder="สต๊อก" value={s.stock} onChange={(e) => handleSizeChange(index, 'stock', e.target.value)} min="0" required />
                            <button type="button" className="btn-remove-entry" onClick={() => handleSizeChange(index, 'size', '') && handleRemoveSize(index)}>✕</button>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* กล่องใหญ่ที่ 2: ตารางเทียบไซส์ (Size Guide) */}
                  <div className="management-container">
                    <div className="management-header">
                      <div className="header-with-toggle">
                        <h3>ตารางไซส์</h3>
                        <div className="size-type-toggle">
                          <button type="button" className={`type-btn ${sizeType === 'shoe' ? 'active' : ''}`} onClick={() => handleTypeChange('shoe')}>Shoes</button>
                          <button type="button" className={`type-btn ${sizeType === 'apparel' ? 'active' : ''}`} onClick={() => handleTypeChange('apparel')}>Apparel</button>
                        </div>
                        {sizeType === 'apparel' && (
                          <div className="size-type-toggle" style={{ marginLeft: '1rem' }}>
                            <button type="button" className={`type-btn ${lengthUnit === 'in' ? 'active' : ''}`} onClick={() => setLengthUnit('in')}>นิ้ว</button>
                            <button type="button" className={`type-btn ${lengthUnit === 'cm' ? 'active' : ''}`} onClick={() => setLengthUnit('cm')}>cm</button>
                          </div>
                        )}
                      </div>
                      <div className="header-actions-buttons" style={{ position: 'relative' }}>
                        <button type="button" className="btn-add-entry" onClick={() => setShowColDropdown(!showColDropdown)}>+ Add Column</button>
                        {showColDropdown && (
                          <div style={{ position: 'absolute', top: '100%', right: '110px', marginTop: '4px', background: 'white', border: '1px solid #E5E7EB', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', padding: '0.5rem', zIndex: 10, display: 'flex', flexDirection: 'column', gap: '4px', minWidth: '140px' }}>
                            {extraColOptions.map(opt => (
                              <label key={opt.key} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: '4px 8px', borderRadius: '4px', background: activeExtraColumns.includes(opt.key) ? '#EFF6FF' : 'transparent' }}>
                                <input type="checkbox" checked={activeExtraColumns.includes(opt.key)} onChange={() => handleToggleExtraColumn(opt.key)} style={{ margin: 0 }} />
                                <span style={{ fontSize: '0.85rem', color: '#374151', textTransform: 'capitalize' }}>{opt.label}</span>
                              </label>
                            ))}
                            <div style={{ borderTop: '1px solid #E5E7EB', margin: '4px 0' }}></div>
                            <div style={{ display: 'flex', gap: '4px', padding: '4px', alignItems: 'center' }}>
                              <input type="text" placeholder="Custom..." value={customColumnInput} onChange={e => setCustomColumnInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddCustomColumn(e)} style={{ flex: 1, padding: '4px 6px', fontSize: '0.8rem', border: '1px solid #D1D5DB', borderRadius: '4px' }} />
                              <button type="button" onClick={handleAddCustomColumn} style={{ padding: '4px 8px', fontSize: '0.8rem', background: '#3B82F6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Add</button>
                            </div>
                          </div>
                        )}
                        <button type="button" className="btn-add-entry" onClick={handleAddGuide}>+ Add Guide Entry</button>
                      </div>
                    </div>


                    <div className="entries-list">
                      {sizeGuide.length > 0 && (
                        <div className={`entry-grid-header ${sizeType === 'apparel' ? 'apparel-guide' : 'shoe-guide'}`} style={{ gridTemplateColumns: `30px 1fr ${activeExtraColumns.includes('chest_cm') ? '1fr ' : ''}${activeExtraColumns.includes('size_cm') ? '1fr ' : ''}${activeExtraColumns.filter(c => c !== 'chest_cm' && c !== 'size_cm').map(() => '1fr ').join('')}44px` }}>
                          <span></span>
                          <span>Size (ไซส์)</span>
                          {activeExtraColumns.includes('chest_cm') && <span>Chest (รอบอก/{lengthUnit === 'in' ? 'นิ้ว' : 'cm'})</span>}
                          {activeExtraColumns.includes('size_cm') && <span>Length (ความยาว/{sizeType === 'shoe' ? 'cm' : lengthUnit === 'in' ? 'นิ้ว' : 'cm'})</span>}
                          {activeExtraColumns.filter(c => c !== 'chest_cm' && c !== 'size_cm').map(col => (
                            <span key={col} style={{ textTransform: 'capitalize' }}>{extraColOptions.find(o => o.key === col)?.label || col.replace(/_/g, ' ')}</span>
                          ))}
                          <span></span>
                        </div>
                      )}
                      {sizeGuide.map((s, index) => (
                        <div
                          key={`guide-${index}`}
                          className={`entry-grid ${sizeType === 'apparel' ? 'apparel-guide' : 'shoe-guide'}`}
                          style={{ gridTemplateColumns: `30px 1fr ${activeExtraColumns.includes('chest_cm') ? '1fr ' : ''}${activeExtraColumns.includes('size_cm') ? '1fr ' : ''}${activeExtraColumns.filter(c => c !== 'chest_cm' && c !== 'size_cm').map(() => '1fr ').join('')}44px` }}
                          draggable
                          onDragStart={(e) => handleDragStart(e, index, 'guide')}
                          onDragOver={handleDragOver}
                          onDrop={(e) => handleDrop(e, index, 'guide')}
                        >
                          <div className="drag-handle" style={{ cursor: 'grab', color: '#9CA3AF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>⠿</div>
                          <input type="text" className="entry-input" placeholder="Size" value={s.size} onChange={(e) => handleGuideChange(index, 'size', e.target.value)} required />
                          {activeExtraColumns.includes('chest_cm') && (
                            <input type="text" className="entry-input" placeholder={lengthUnit === 'in' ? "Chest (นิ้ว)" : "Chest (cm)"} value={(s.chest_cm || '').replace(/ (in|cm)$/, '')} onChange={(e) => {
                              const v = e.target.value;
                              const unit = lengthUnit === 'in' ? ' in' : ' cm';
                              handleGuideChange(index, 'chest_cm', v ? v + unit : '');
                            }} />
                          )}
                          {activeExtraColumns.includes('size_cm') && (
                            <input type="text" className="entry-input" placeholder={sizeType === 'shoe' ? "Length (cm)" : (lengthUnit === 'in' ? "Length (นิ้ว)" : "Length (cm)")} value={(s.size_cm || '').replace(/ (in|cm)$/, '')} onChange={(e) => {
                              const v = e.target.value;
                              const unit = sizeType === 'shoe' ? ' cm' : (lengthUnit === 'in' ? ' in' : ' cm');
                              handleGuideChange(index, 'size_cm', v ? v + unit : '');
                            }} />
                          )}
                          {activeExtraColumns.filter(c => c !== 'chest_cm' && c !== 'size_cm').map(col => (
                            <input key={col} type="text" className="entry-input" placeholder={extraColOptions.find(o => o.key === col)?.label || col.replace(/_/g, ' ')} value={s[col] || ''} onChange={(e) => handleGuideChange(index, col, e.target.value)} />
                          ))}
                          <button type="button" className="btn-remove-entry" onClick={() => handleRemoveGuide(index)}>✕</button>
                        </div>
                      ))}
                    </div>
                  </div>


                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="cancel-btn" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="save-btn">Apply Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProductDetail;
