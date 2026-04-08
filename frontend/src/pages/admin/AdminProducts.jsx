// code in this file is written by worapol สุดหล่อ
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import './AdminProducts.css';

const AdminProducts = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form State - by worapol สุดหล่อ
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [isDuplicating, setIsDuplicating] = useState(false);
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
  const [deletedImageIds, setDeletedImageIds] = useState([]); // Track IDs to delete on server - by worapol สุดหล่อ
  const [sizeType, setSizeType] = useState('shoe'); // 'shoe' or 'apparel' - by worapol สุดหล่อ
  const [lengthUnit, setLengthUnit] = useState('in'); // 'in' or 'cm' - by worapol สุดหล่อ
  const [activeExtraColumns, setActiveExtraColumns] = useState([]);
  const [showColDropdown, setShowColDropdown] = useState(false);
  const [customColumnInput, setCustomColumnInput] = useState('');
  const [customColumns, setCustomColumns] = useState([]);

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
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await api.get('/products');
      setProducts(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
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

    if (deletedImageIds.length > 0) {
      data.append('deletedImageIds', JSON.stringify(deletedImageIds));
    }

    try {
      if (editingId) {
        await api.put(`/products/${editingId}`, data);
        showToast('Product updated successfully!');
      } else {
        await api.post('/products', data);
        showToast('Product added successfully!');
      }
      setShowModal(false);
      resetForm();
      setIsDuplicating(false);
      fetchProducts();
    } catch (err) {
      showToast(err.response?.data?.message || err.response?.data?.error || 'Action failed', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;
    try {
      await api.delete(`/products/${id}`);
      showToast('Product deleted');
      fetchProducts();
    } catch (err) {
      showToast(err.response?.data?.message || 'Delete failed', 'error');
    }
  };

  const openEdit = (prod) => {
    setIsDuplicating(false);
    setEditingId(prod.id);
    setFormData({
      name: prod.name,
      description: prod.description,
      price: prod.price,
      discount_percent: prod.discount_percent || 0,
      product_code: prod.product_code || '',
      category: prod.category || '',
      brand: prod.brand || '',
      images: []
    });
    setSizes(prod.sizes || []);
    let sg = [];
    let initialExtraCols = new Set();
    let parsedCustomCols = [];
    if (prod.size_guide) {
      try {
        sg = JSON.parse(prod.size_guide);
        sg.forEach(item => {
          Object.keys(item).forEach(k => {
            if (k !== 'size') initialExtraCols.add(k);
          });
        });
      } catch (e) { sg = []; }
    }
    setSizeGuide(sg);

    const pType = prod.product_type || (prod.sizes?.some(s => s.chest_cm) ? 'apparel' : 'shoe');
    const predefinedKeys = pType === 'shoe' ? ['size_cm', 'uk', 'us', 'eu', 'usw', 'jp'] : ['chest_cm', 'size_cm', 'height', 'waist', 'hip'];
    initialExtraCols.forEach(k => {
      if (!predefinedKeys.includes(k)) {
        parsedCustomCols.push({ key: k, label: k.replace(/_/g, ' ') });
      }
    });
    setCustomColumns(parsedCustomCols);
    setActiveExtraColumns(Array.from(initialExtraCols));

    const initialGallery = [];
    if (prod.image_url) {
      initialGallery.push({ id: 'primary', image_url: prod.image_url, isNew: false });
    }
    if (prod.images) {
      prod.images.forEach(img => {
        if (img.image_url !== prod.image_url) {
          initialGallery.push({ ...img, isNew: false });
        }
      });
    }
    setGalleryImages(initialGallery);
    setDeletedImageIds([]);

    const hasChest = prod.sizes?.some(s => s.chest_cm);
    const initialType = prod.product_type || (hasChest ? 'apparel' : 'shoe');
    setSizeType(initialType);

    setShowModal(true);
  };

  const handleDuplicate = (prod) => {
    setIsDuplicating(true);
    console.log("Duplicating product:", prod);
    // Helper to increment number at the end of a string - by worapol สุดหล่อ
    const incrementString = (str) => {
      if (!str) return '';
      const match = str.match(/(\d+)(?!.*\d)/); // Finds the last sequence of numbers - by worapol สุดหล่อ
      if (match) {
        const numPart = match[0];
        const nextNum = (parseInt(numPart) + 1).toString().padStart(numPart.length, '0');
        return str.substring(0, match.index) + nextNum + str.substring(match.index + numPart.length);
      }
      return `${str}-1`;
    };

    setEditingId(null);
    setFormData({
      name: prod.name ? `${prod.name} (Copy)` : '',
      description: prod.description || '',
      price: prod.price || '',
      discount_percent: prod.discount_percent || 0,
      product_code: prod.product_code ? incrementString(prod.product_code) : '',
      category: prod.category || '',
      brand: prod.brand || '',
      images: []
    });

    // Clean sizes for new IDs (backend handles this) - by worapol สุดหล่อ
    const clonedSizes = (prod.sizes || []).map(s => ({
      size: s.size,
      stock: s.stock,
      chest_cm: s.chest_cm,
      size_cm: s.size_cm
    }));
    setSizes(clonedSizes);

    let sg = [];
    if (prod.size_guide) {
      try {
        sg = JSON.parse(prod.size_guide);
      } catch (e) { sg = []; }
    }
    setSizeGuide(sg);

    // Re-detect columns - by worapol สุดหล่อ
    let initialExtraCols = new Set();
    if (sg.length > 0) {
      sg.forEach(item => {
        Object.keys(item).forEach(k => {
          if (k !== 'size') initialExtraCols.add(k);
        });
      });
    }

    const pType = prod.product_type || (prod.sizes?.some(s => s.chest_cm) ? 'apparel' : 'shoe');
    const predefinedKeys = pType === 'shoe' ? ['size_cm', 'uk', 'us', 'eu', 'usw', 'jp'] : ['chest_cm', 'size_cm', 'height', 'waist', 'hip'];

    const parsedCustomCols = [];
    initialExtraCols.forEach(k => {
      if (!predefinedKeys.includes(k)) {
        parsedCustomCols.push({ key: k, label: k.replace(/_/g, ' ') });
      }
    });
    setCustomColumns(parsedCustomCols);
    setActiveExtraColumns(Array.from(initialExtraCols));

    // Clone gallery - by worapol สุดหล่อ
    const initialGallery = [];
    if (prod.image_url) {
      initialGallery.push({ id: `temp-primary-${Date.now()}`, image_url: prod.image_url, isNew: false });
    }
    if (prod.images) {
      prod.images.forEach((img, idx) => {
        if (img.image_url !== prod.image_url) {
          initialGallery.push({ ...img, id: `temp-${idx}-${Date.now()}`, isNew: false });
        }
      });
    }
    setGalleryImages(initialGallery);
    setDeletedImageIds([]);

    // Detect unit from data - by worapol สุดหล่อ
    if (sg.length > 0) {
      const firstEntry = sg[0];
      const val = firstEntry.chest_cm || firstEntry.size_cm || '';
      if (val.includes('in')) setLengthUnit('in');
      else if (val.includes('cm')) setLengthUnit('cm');
    } else {
      setLengthUnit(pType === 'shoe' ? 'cm' : 'in');
    }

    const hasChest = prod.sizes?.some(s => s.chest_cm);
    const initialType = prod.product_type || (hasChest ? 'apparel' : 'shoe');
    setSizeType(initialType);

    // Clear other UI states - by worapol สุดหล่อ
    setCustomColumnInput('');
    setShowColDropdown(false);

    setShowModal(true);
  };

  const resetForm = () => {
    setEditingId(null);
    setIsDuplicating(false);
    setFormData({ name: '', description: '', price: '', discount_percent: 0, product_code: '', category: '', brand: '', images: [] });

    // Default to shoe with default sizes for Size Guide only - by worapol สุดหล่อ
    const defaultShoe = ['38', '39', '40', '41', '42', '43', '44', '45'];
    setSizes([]);
    setSizeGuide(defaultShoe.map(size => ({ size, size_cm: '', chest_cm: '' })));

    setGalleryImages([]);
    setDeletedImageIds([]);
    setSizeType('shoe');
    setLengthUnit('cm');
    setActiveExtraColumns(['size_cm']);
    setCustomColumns([]);
    setCustomColumnInput('');
  };

  const handleTypeChange = (type) => {
    setSizeType(type);
    const setDefaults = () => {
      if (type === 'apparel') {
        const defaultApparel = ['S', 'M', 'L', 'XL'];
        setSizes([]);
        setSizeGuide(defaultApparel.map(size => ({ size, size_cm: '', chest_cm: '' })));
        setLengthUnit('in');
      } else {
        const defaultShoe = ['38', '39', '40', '41', '42', '43', '44', '45'];
        setSizes([]);
        setSizeGuide(defaultShoe.map(size => ({ size, size_cm: '', chest_cm: '' })));
        setLengthUnit('cm');
      }
    };

    if (!editingId) {
      setDefaults();
      setActiveExtraColumns(type === 'apparel' ? ['chest_cm', 'size_cm'] : ['size_cm']);
      setCustomColumns([]);
    } else if (window.confirm(`Do you want to load default sizes for ${type}? (This will replace your current sizes in the table)`)) {
      setDefaults();
      setActiveExtraColumns(type === 'apparel' ? ['chest_cm', 'size_cm'] : ['size_cm']);
      setCustomColumns([]);
    }
  };

  const handleAddSize = () => {
    setSizes([...sizes, { size: '', size_cm: '', chest_cm: '', stock: '' }]);
  };

  const handleSizeChange = (index, field, value) => {
    setSizes(prev => prev.map((s, i) => i === index ? { ...s, [field]: value } : s));
  };


  const handleRemoveSize = (index) => {
    setSizes(sizes.filter((_, i) => i !== index));
  };

  const handleAddGuide = () => {
    setSizeGuide([...sizeGuide, { size: '', size_cm: '', chest_cm: '' }]);
  };

  const handleGuideChange = (index, field, value) => {
    setSizeGuide(prev => prev.map((s, i) => i === index ? { ...s, [field]: value } : s));
  };

  const handleRemoveGuide = (index) => {
    setSizeGuide(sizeGuide.filter((_, i) => i !== index));
  };

  const handleRemoveServerImage = (imgId) => {
    setDeletedImageIds(prev => [...prev, imgId]);
    setGalleryImages(prev => prev.filter(img => img.id !== imgId));
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

  const [searchTerm, setSearchTerm] = useState('');
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);
  const [showLowSizeStockOnly, setShowLowSizeStockOnly] = useState(false);
  const [selectedBrands, setSelectedBrands] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedColors, setSelectedColors] = useState([]);
  const [showDiscountOnly, setShowDiscountOnly] = useState(false);
  const [priceRange, setPriceRange] = useState(0); // Min Price - by worapol สุดหล่อ
  const [stockRange, setStockRange] = useState(0); // Min Stock - by worapol สุดหล่อ
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  // Color extraction from names - by worapol สุดหล่อ
  const commonColors = ['Red', 'Blue', 'Green', 'Black', 'White', 'Grey', 'Gray', 'Pink', 'Yellow', 'Purple', 'Orange', 'Brown', 'Navy', 'Oat', 'Beige', 'Olive', 'Teal', 'Silver', 'Gold'];
  const availableColors = [...new Set(products.flatMap(p => {
    return commonColors.filter(color => p.name.toLowerCase().includes(color.toLowerCase()));
  }))].sort();

  const uniqueBrands = [...new Set(products.map(p => p.brand).filter(Boolean))].sort();
  const uniqueCategories = [...new Set(products.map(p => p.category).filter(Boolean))].sort();

  const handleBrandToggle = (brand) => {
    setSelectedBrands(prev =>
      prev.includes(brand) ? prev.filter(b => b !== brand) : [...prev, brand]
    );
  };

  const handleCategoryToggle = (cat) => {
    setSelectedCategories(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  const clearFilters = () => {
    setSelectedBrands([]);
    setSelectedCategories([]);
    setSelectedColors([]);
    setShowDiscountOnly(false);
    setPriceRange(0);
    setStockRange(0);
  };

  const handleToggleColor = (color) => {
    setSelectedColors(prev =>
      prev.includes(color) ? prev.filter(c => c !== color) : [...prev, color]
    );
  };

  const filteredProducts = products.filter(product => {
    // Category/Brand/Color Filters - by worapol สุดหล่อ
    if (selectedBrands.length > 0 && !selectedBrands.includes(product.brand)) {
      return false;
    }
    if (selectedCategories.length > 0 && !selectedCategories.includes(product.category)) {
      return false;
    }
    if (selectedColors.length > 0) {
      const hasColor = selectedColors.some(color => product.name.toLowerCase().includes(color.toLowerCase()));
      if (!hasColor) return false;
    }

    // Special Filters - by worapol สุดหล่อ
    if (showDiscountOnly && (!product.discount_percent || product.discount_percent <= 0)) {
      return false;
    }

    // Range Filters (Min filters: show if value >= range) - by worapol สุดหล่อ
    if (Number(product.price * (1 - (product.discount_percent || 0) / 100)) < priceRange) {
      return false;
    }
    if (Number(product.stock) < stockRange) {
      return false;
    }

    // Toggle Filters - by worapol สุดหล่อ
    if (showLowStockOnly && product.stock >= 5) {
      return false;
    }
    if (showLowSizeStockOnly) {
      const hasLowSizeStock = product.sizes && product.sizes.some(s => s.stock < 5);
      if (!hasLowSizeStock) return false;
    }

    const searchLower = searchTerm.toLowerCase().trim();

    // Check for specific prefixes - by worapol สุดหล่อ
    if (searchLower.startsWith('code')) {
      const codeSearch = searchLower.replace('code', '').replace(':', '').trim();
      return codeSearch ? (product.product_code?.toLowerCase() || '').includes(codeSearch) : true;
    }

    if (searchLower.startsWith('brand')) {
      const brandSearch = searchLower.replace('brand', '').replace(':', '').trim();
      return brandSearch ? (product.brand?.toLowerCase() || '').includes(brandSearch) : true;
    }

    if (searchLower.startsWith('price')) {
      const priceSearchStr = searchLower.replace('price', '').replace(':', '').trim();
      const priceSearchNum = parseFloat(priceSearchStr);
      return !isNaN(priceSearchNum) ? Number(product.price) === priceSearchNum : true;
    }

    if (searchLower.startsWith('stock')) {
      const stockSearchStr = searchLower.replace('stock', '').replace(':', '').trim();
      const stockSearchNum = parseInt(stockSearchStr, 10);
      return !isNaN(stockSearchNum) ? Number(product.stock) === stockSearchNum : true;
    }

    // Default: search by name or description - by worapol สุดหล่อ
    return (
      (product.name?.toLowerCase() || '').includes(searchLower) ||
      (product.description?.toLowerCase() || '').includes(searchLower)
    );
  });

  const exportToPDF = async () => {
    try {
      showToast('Generating formal inventory audit...', 'info');
      const doc = new jsPDF('l', 'mm', 'a4');
      const today = new Date();
      const reportDate = today.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
      const reportTime = today.toLocaleTimeString('en-US', { hour12: false });
      const reportId = `INV-${today.getFullYear()}${(today.getMonth() + 1).toString().padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`;

      // Determine Report Title based on filters - by worapol สุดหล่อ
      let reportTitle = "PRODUCT INVENTORY AUDIT";
      let statusLabel = "OFFICIAL STOCK RECORD";
      let accentColor = [79, 70, 229]; 

      if (showLowStockOnly || showLowSizeStockOnly) {
        reportTitle = "CRITICAL STOCK ALERT REPORT";
        statusLabel = "URGENT REPLENISHMENT REQUIRED";
        accentColor = [220, 38, 38]; 
      }

      // --- BRANDING & HEADER --- - by worapol สุดหล่อ
      doc.setFillColor(...accentColor);
      doc.rect(14, 15, 2, 25, 'F');

      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(17, 24, 39);
      doc.text('VELLIN', 20, 25);

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(107, 114, 128);
      doc.text('Inventory Control & Quality Assurance', 20, 31);
      doc.text('123 Business Parkway, Suite 500, Bangkok, TH', 20, 36);

      // Report Title - by worapol สุดหล่อ
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(31, 41, 55);
      doc.text(reportTitle, 283, 30, { align: 'right' });

      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(107, 114, 128);
      doc.text(`Document ID: ${reportId}`, 283, 36, { align: 'right' });
      doc.text(`Generated: ${reportDate} | ${reportTime}`, 283, 41, { align: 'right' });
      doc.text(`Source: Admin Dashboard / Inventory Management`, 283, 46, { align: 'right' });

      // Horizontal Divider - by worapol สุดหล่อ
      doc.setDrawColor(229, 231, 235);
      doc.setLineWidth(0.5);
      doc.line(14, 48, 283, 48);

      // Metadata & Filters - by worapol สุดหล่อ
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(31, 41, 55);
      doc.text('DOCUMENT STATUS:', 14, 54);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...accentColor);
      doc.text(statusLabel, 55, 54);

      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(107, 114, 128);
      let filterDesc = [];
      if (selectedBrands.length > 0) filterDesc.push(`Brands: ${selectedBrands.join(', ')}`);
      if (selectedCategories.length > 0) filterDesc.push(`Categories: ${selectedCategories.join(', ')}`);
      if (showDiscountOnly) filterDesc.push("Status: On Sale");
      if (searchTerm) filterDesc.push(`Search: "${searchTerm}"`);
      
      const filterText = filterDesc.length > 0 ? `Active Filters: ${filterDesc.join(' | ')}` : "No specific filters applied. Full catalog audit.";
      doc.text(filterText, 14, 59);

      // Sorting: Priority to display low stock at top for audit - by worapol สุดหล่อ
      const sortedProducts = [...filteredProducts].sort((a, b) => Number(a.stock) - Number(b.stock));

      // --- TABLE PREPARATION --- - by worapol สุดหล่อ
      const tableColumn = ["Code", "Product Description", "Category", "Brand", "Price (THB)", "Disc", "Final (THB)", "Stock", "Sizes Breakdown"];
      const tableRows = sortedProducts.map(p => {
        const finalPrice = p.discount_percent > 0
          ? p.price * (1 - p.discount_percent / 100)
          : p.price;

        const sizesDetail = (p.sizes || [])
          .map(s => `${s.size}: ${s.stock}`)
          .join(', ');

        return [
          { content: p.product_code || '-', styles: { fontStyle: 'bold' } },
          p.name,
          p.category || '-',
          p.brand || '-',
          { content: Number(p.price).toLocaleString(), styles: { halign: 'right' } },
          p.discount_percent > 0 ? `${p.discount_percent}%` : '-',
          { content: Number(finalPrice).toLocaleString(), styles: { halign: 'right', fontStyle: 'bold' } },
          { content: p.stock.toString(), styles: { halign: 'center', textColor: p.stock < 5 ? [220, 38, 38] : [31, 41, 55], fontStyle: 'bold' } },
          sizesDetail || '-'
        ];
      });

      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 65,
        margin: { left: 14, right: 14 },
        theme: 'grid',
        headStyles: {
          fillColor: [31, 41, 55],
          textColor: 255,
          fontSize: 8,
          fontStyle: 'bold',
          halign: 'center',
          cellPadding: 3
        },
        styles: { 
          fontSize: 7.5, 
          cellPadding: 2, 
          valign: 'middle',
          lineColor: [229, 231, 235]
        },
        columnStyles: {
          1: { cellWidth: 50 },
          4: { cellWidth: 20 },
          6: { cellWidth: 20 },
          7: { cellWidth: 15 },
          8: { cellWidth: 'auto' }
        },
        alternateRowStyles: {
          fillColor: [250, 250, 251]
        }
      });

      // --- SIGNATURE SECTION --- - by worapol สุดหล่อ
      const finalY = doc.lastAutoTable.finalY || 150;
      const signatureY = finalY + 25;
      const safeSignatureY = signatureY < 165 ? 165 : signatureY;

      doc.setDrawColor(203, 213, 225);
      doc.setLineWidth(0.3);
      doc.line(14, safeSignatureY, 84, safeSignatureY);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(107, 114, 128);
      doc.text('Inventory Supervisor Verification', 14, safeSignatureY + 5);
      doc.text(`Signed Date: ${today.toLocaleDateString()} ________________`, 14, safeSignatureY + 10);

      doc.line(213, safeSignatureY, 283, safeSignatureY);
      doc.text('Warehouse Manager Approval', 213, safeSignatureY + 5);
      doc.text(`Signed Date: ${today.toLocaleDateString()} ________________`, 213, safeSignatureY + 10);

      // --- FOOTER --- - by worapol สุดหล่อ
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setDrawColor(229, 231, 235);
        doc.setLineWidth(0.5);
        doc.line(14, 198, 283, 198);

        doc.setFontSize(8);
        doc.setTextColor(107, 114, 128);
        doc.text(`VELLIN Internal Inventory Control Document - System Generated`, 14, 204);
        doc.text(`Page ${i} of ${pageCount}`, 283, 204, { align: 'right' });
      }

      const fileName = reportTitle.toLowerCase().replace(/ /g, '_');
      doc.save(`${fileName}_${new Date().toISOString().split('T')[0]}.pdf`);
      showToast('Formal PDF Report Downloaded');


      // 🔍 LOG ACTION - by worapol สุดหล่อ
      try {
        await api.post('/logs/manual', {
          action: 'Export PDF',
          entity_type: 'PRODUCTS',
          entity_id: 'SYSTEM_REPORT',
          details: {
            report_name: reportTitle,
            report_id: reportId,
            products_count: filteredProducts.length,
            generated_at: new Date().toLocaleString('th-TH')
          }
        });
      } catch (logErr) {
        console.error('Failed to log PDF export:', logErr);
      }
    } catch (err) {
      console.error('PDF Export Error:', err);
      showToast('Failed to generate PDF audit report.', 'error');
    }
  };


  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Reset to first page when filters change - by worapol สุดหล่อ
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, showLowStockOnly, showLowSizeStockOnly, selectedBrands, selectedCategories, selectedColors, showDiscountOnly, priceRange, stockRange]);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredProducts.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  if (loading) return <div>Loading Products...</div>;

  return (
    <div className="admin-products-container">
      <div className="header-actions">
        <h2>Manage Products</h2>
        <div className="header-actions-right">
          {/* Custom Filter Button */}
          <div className="filter-wrapper" style={{ position: 'relative' }}>
            <button
              className={`filter-toggle-btn ${(selectedBrands.length > 0 || selectedCategories.length > 0 || selectedColors.length > 0 || showDiscountOnly || priceRange > 0 || stockRange > 0) ? 'active' : ''}`}
              onClick={() => setShowFilterDropdown(!showFilterDropdown)}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
              </svg>
              Filter {(selectedBrands.length + selectedCategories.length + selectedColors.length + (showDiscountOnly ? 1 : 0) + (priceRange > 0 ? 1 : 0) + (stockRange > 0 ? 1 : 0)) > 0 && `(${(selectedBrands.length + selectedCategories.length + selectedColors.length + (showDiscountOnly ? 1 : 0) + (priceRange > 0 ? 1 : 0) + (stockRange > 0 ? 1 : 0))})`}
            </button>

            {showFilterDropdown && (
              <div className="filter-dropdown-content">
                <div className="filter-header">
                  <span>Refine Products</span>
                  <button className="clear-filter-link" onClick={clearFilters}>Clear All</button>
                </div>

                <div className="filter-body horizontal-layout advanced-filter">
                  <div className="filter-main-sections">
                    <div className="filter-col">
                      {uniqueBrands.length > 0 && (
                        <div className="filter-section">
                          <label>Brands</label>
                          <div className="filter-options-horizontal">
                            {uniqueBrands.map(brand => (
                              <label key={brand} className="filter-pill-label">
                                <input
                                  type="checkbox"
                                  checked={selectedBrands.includes(brand)}
                                  onChange={() => handleBrandToggle(brand)}
                                />
                                <span>{brand}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      )}

                      {uniqueCategories.length > 0 && (
                        <div className="filter-section">
                          <label>Categories</label>
                          <div className="filter-options-horizontal">
                            {uniqueCategories.map(cat => (
                              <label key={cat} className="filter-pill-label">
                                <input
                                  type="checkbox"
                                  checked={selectedCategories.includes(cat)}
                                  onChange={() => handleCategoryToggle(cat)}
                                />
                                <span>{cat}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="filter-col">
                      {availableColors.length > 0 && (
                        <div className="filter-section">
                          <label>Colors (ค้นหาจากชื่อสี)</label>
                          <div className="filter-options-horizontal">
                            {availableColors.map(color => (
                              <label key={color} className="filter-pill-label color-pill">
                                <input
                                  type="checkbox"
                                  checked={selectedColors.includes(color)}
                                  onChange={() => handleToggleColor(color)}
                                />
                                <span>{color}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="filter-section">
                        <label>Special Status</label>
                        <div className="filter-options-horizontal">
                          <label className={`filter-pill-label sale-pill ${showDiscountOnly ? 'active' : ''}`}>
                            <input
                              type="checkbox"
                              checked={showDiscountOnly}
                              onChange={() => setShowDiscountOnly(!showDiscountOnly)}
                            />
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: '4px' }}>
                              <path d="M12.44 21.02c.07.01.13.02.2.02a.75.75 0 0 0 .61-1.19c-.31-.44-.54-1.07-.69-1.89-.25-1.51-.11-3.13.41-4.8.06-.21.22-.38.43-.46 2.06-.74 3.46-2.6 3.46-4.78 0-2.82-2.31-5.12-5.13-5.12-.2 0-.39.01-.58.04a.75.75 0 0 0-.64.88c.07.45.11.9.11 1.36 0 1.25-.3 2.43-.83 3.47-.63 1.25-1.56 2.3-2.73 3.09a.751.751 0 0 0-.15 1.14c.31.33.66.62 1.04.88.24.16.37.45.32.74a7.96 7.96 0 0 1-.58 2.08 7.37 7.37 0 0 1-1.63 2.45.75.75 0 0 0 .54 1.28c.19 0 .39-.02.58-.06a8.49 8.49 0 0 0 2.91-1.39c.2-.14.47-.16.69-.04 1.29.68 1.95 1.7 2.19 3.32z" />
                            </svg>
                            <span>On Sale (ลดราคา)</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="filter-divider-h"></div>

                  <div className="filter-ranges-section">
                    <div className="range-item">
                      <div className="range-header">
                        <label>Min Price (ราคาเริ่มต้น)</label>
                        <div className="price-input-wrapper">
                          <span>฿</span>
                          <input
                            type="number"
                            value={priceRange}
                            onChange={(e) => setPriceRange(Number(e.target.value))}
                            className="price-number-input"
                          />
                        </div>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100000"
                        step="100"
                        value={priceRange > 100000 ? 100000 : priceRange}
                        onChange={(e) => setPriceRange(Number(e.target.value))}
                        className="price-slider"
                      />
                      <div className="slider-labels">
                        <span>0</span>
                        <span>50k</span>
                        <span>100k+</span>
                      </div>
                    </div>

                    <div className="range-item">
                      <div className="range-header">
                        <label>Min Stock (จำนวนสต็อกเริ่มต้น)</label>
                        <div className="price-input-wrapper">
                          <input
                            type="number"
                            value={stockRange}
                            onChange={(e) => setStockRange(Number(e.target.value))}
                            className="price-number-input"
                            style={{ width: '60px' }}
                          />
                          <span style={{ fontSize: '0.7rem' }}>items</span>
                        </div>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="500"
                        step="1"
                        value={stockRange > 500 ? 500 : stockRange}
                        onChange={(e) => setStockRange(Number(e.target.value))}
                        className="price-slider stock-slider"
                      />
                      <div className="slider-labels">
                        <span>0</span>
                        <span>250</span>
                        <span>500+</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          <button
            onClick={() => {
              setShowLowStockOnly(!showLowStockOnly);
              if (!showLowStockOnly) setShowLowSizeStockOnly(false);
            }}
            style={{
              padding: '0.5rem 0.8rem',
              borderRadius: '8px',
              border: showLowStockOnly ? '1px solid #111827' : '1px solid #E5E7EB',
              background: showLowStockOnly ? '#111827' : 'white',
              color: showLowStockOnly ? 'white' : '#4B5563',
              fontWeight: '600',
              cursor: 'pointer',
              marginRight: '10px',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
            title="Filter Low Stock (< 5)"
          >
            {showLowStockOnly ? (
              <><span>✕</span> All</>
            ) : (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                  <line x1="12" y1="9" x2="12" y2="13"></line>
                  <line x1="12" y1="17" x2="12.01" y2="17"></line>
                </svg>
                Total {'<'} 5
              </>
            )}
          </button>

          <button
            onClick={() => {
              setShowLowSizeStockOnly(!showLowSizeStockOnly);
              if (!showLowSizeStockOnly) setShowLowStockOnly(false);
            }}
            style={{
              padding: '0.5rem 0.8rem',
              borderRadius: '8px',
              border: showLowSizeStockOnly ? '1px solid #111827' : '1px solid #E5E7EB',
              background: showLowSizeStockOnly ? '#111827' : 'white',
              color: showLowSizeStockOnly ? 'white' : '#4B5563',
              fontWeight: '600',
              cursor: 'pointer',
              marginRight: '10px',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
            title="Filter Low Size Stock (< 5)"
          >
            {showLowSizeStockOnly ? (
              <><span>✕</span> All Sizes</>
            ) : (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                  <line x1="12" y1="9" x2="12" y2="13"></line>
                  <line x1="12" y1="17" x2="12.01" y2="17"></line>
                </svg>
                Size {'<'} 5
              </>
            )}
          </button>
          <input
            type="text"
            placeholder="Search products..."
            className="search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button className="add-btn" onClick={() => { resetForm(); setShowModal(true); }}>
            + Add Product
          </button>
        </div>
      </div>

      <div className="table-responsive">
        <table className="products-table">
          <thead>
            <tr>
              <th>Image</th>
              <th>Code</th>
              <th>Name</th>
              <th>Category</th>
              <th>Brand</th>
              <th>Price</th>
              <th>Discount</th>
              <th>Final Price</th>
              <th>Sizes</th>
              <th>Stock</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentItems.map(p => (
              <tr key={p.id} onClick={() => navigate(`/admin/product/${p.id}`)} className="clickable-row" style={{ cursor: 'pointer' }}>
                <td>
                  <img src={p.image_url ? `http://localhost:5000${p.image_url}` : 'https://via.placeholder.com/50'} alt={p.name} className="table-img" />
                </td>
                <td>{p.product_code || '-'}</td>
                <td>{p.name}</td>
                <td>{p.category || '-'}</td>
                <td>{p.brand || '-'}</td>
                <td style={{ fontWeight: '600' }}>฿{Number(p.price).toLocaleString()}</td>
                <td style={{ color: p.discount_percent > 0 ? '#EF4444' : '#666', fontWeight: '700' }}>
                  {p.discount_percent > 0 ? `-${p.discount_percent}%` : '-'}
                </td>
                <td style={{ color: p.discount_percent > 0 ? '#10B981' : '#666', fontWeight: '800', fontSize: '1.1rem' }}>
                  {p.discount_percent > 0
                    ? `฿${Number(p.price * (1 - p.discount_percent / 100)).toLocaleString()}`
                    : '-'}
                </td>
                <td>
                  <div className="sizes-badges">
                    {p.sizes && p.sizes.length > 0 ? (
                      p.sizes.map(s => (
                        <span key={`sz-${s.id}`} className="size-badge">
                          {s.size}: <strong className={s.stock < 5 ? 'low-stock-text' : 'good-stock-text'}>{s.stock}</strong>
                        </span>
                      ))
                    ) : (
                      <span className="size-badge">N/A</span>
                    )}
                  </div>
                </td>
                <td>
                  <span className={`stock-badge ${p.stock < 5 ? 'low' : 'good'}`}>{p.stock}</span>
                </td>
                <td className="actions-cell">
                  <div className="action-buttons">
                    <button className="duplicate-btn" onClick={(e) => { e.stopPropagation(); handleDuplicate(p); }}>Add Product Color</button>
                    <button className="edit-btn" onClick={(e) => { e.stopPropagation(); openEdit(p); }}>Edit</button>
                    <button className="delete-btn" onClick={(e) => { e.stopPropagation(); handleDelete(p.id); }}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bottom-bar">
        <div className="bottom-left-actions">
          <button className="pdf-export-btn" onClick={exportToPDF}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10 9 9 9 8 9"></polyline>
            </svg>
            Print PDF Report
          </button>
        </div>

        {totalPages > 1 && (
          <div className="pagination">
            <button
              onClick={() => paginate(currentPage - 1)}
              disabled={currentPage === 1}
              className="page-btn"
            >
              Prev
            </button>

            {[...Array(totalPages)].map((_, index) => (
              <button
                key={index + 1}
                onClick={() => paginate(index + 1)}
                className={`page-btn ${currentPage === index + 1 ? 'active' : ''}`}
              >
                {index + 1}
              </button>
            ))}

            <button
              onClick={() => paginate(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="page-btn"
            >
              Next
            </button>

            <div className="page-jump">
              <span>Page:</span>
              <select
                value={currentPage}
                onChange={(e) => paginate(Number(e.target.value))}
                className="page-select"
              >
                {[...Array(totalPages)].map((_, i) => (
                  <option key={i + 1} value={i + 1}>{i + 1}</option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {showModal && (
        <div className="admin-product-overlay">
          <div className="admin-wide-modal-content">
            <h3>{editingId ? 'Edit Product' : (isDuplicating ? 'Add Product Color' : 'Add Product')}</h3>
            <form onSubmit={handleSubmit}>
              <div className="modal-grid">
                {/* Column 1: Basic Info */}
                <div className="modal-col">
                  <div className="form-group">
                    <label>Name</label>
                    <input type="text" name="name" value={formData.name} onChange={handleInputChange} required />
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Product Code</label>
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
                    <label>Manage Gallery (First is cover, use ◀ ▶)</label>
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
                      <input type="file" name="images" id="images-upload-modal" multiple accept="image/*" onChange={handleInputChange} style={{ display: 'none' }} />
                      <label htmlFor="images-upload-modal" className="upload-label">
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
                            <button type="button" className="btn-remove-entry" onClick={() => handleRemoveSize(index)}>✕</button>
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
                <button type="submit" className="save-btn">{editingId ? 'Save Changes' : (isDuplicating ? 'Add Product Color' : 'Add Product')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProducts;
