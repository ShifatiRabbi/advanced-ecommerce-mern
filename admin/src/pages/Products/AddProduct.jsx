import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import { toast } from '../../utils/toast';
import { validateSchema, required, minLen, maxLen, min } from '../../utils/validate';
import VariantManager from '../../components/VariantManager';

const PRODUCT_SCHEMA = {
  name: [v => required(v, 'Name'), v => minLen(v, 3, 'Name'), v => maxLen(v, 200, 'Name')],
  price: [v => required(v, 'Price'), v => min(Number(v), 0, 'Price')],
  category: [v => required(v, 'Category')],
  description: [v => v && maxLen(v, 5000, 'Description')].filter(Boolean),
};

const TAB_KEYS = {
  INFO: 'info',
  MEDIA: 'media',
  PRICING: 'pricing',
  VARIANTS: 'variants',
  SEO: 'seo',
  STATUS: 'status',
};

export default function AddProduct() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(TAB_KEYS.INFO);
  const [productType, setProductType] = useState('simple'); // 'simple' or 'variable'
  const [fieldErrors, setFieldErrors] = useState({});
  const [newVariantImages, setNewVariantImages] = useState({}); // from VariantManager
  // const [variants, setVariants] = useState([]);           // from VariantManager
  // const [images, setImages] = useState([]);               // main images

  // Form State
  const [form, setForm] = useState({
    name: '',
    shortDesc: '',
    description: '',
    price: '',
    discountPrice: '',
    category: '',
    brand: '',
    stock: '',
    sku: '',
    weight: '',
    isActive: true,
    isFeatured: false,
    metaTitle: '',
    metaDesc: '',
    tags: '',
  });

  const [images, setImages] = useState([]);
  const [variants, setVariants] = useState([]);

  // Queries
  const { data: categories } = useQuery({
    queryKey: ['cats'],
    queryFn: () => api.get('/categories').then(r => r.data.data),
  });

  const { data: brands } = useQuery({
    queryKey: ['brands'],
    queryFn: () => api.get('/brands').then(r => r.data.data),
  });

  // Mutation
  const mutation = useMutation({
    mutationFn: (payload) => api.post('/products', payload, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
    onSuccess: () => {
      toast.success('Product created successfully!');
      navigate('/products');
    },
    onError: (err) => {
      const data = err?.response?.data;
      if (data?.errors?.length) {
        const beErrors = Object.fromEntries(data.errors.map(e => [e.field, e.message.replace(/^"[^"]*"\s*/, '')]));
        setFieldErrors(beErrors);
      }
      toast.error(data?.message || 'Failed to create product');
    },
  });

  const set = useCallback((key, value) => {
    setForm(prev => ({ ...prev, [key]: value }));
    setFieldErrors(prev => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }, []);

  const handleImageUpload = (newImages) => {
    setImages(prev => [...prev, ...newImages].slice(0, 10));
  };

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    const validationForm = { ...form };
    
    // Remove price/stock from validation for variable products
    if (productType === 'variable') {
      delete validationForm.price;
      delete validationForm.stock;
    }

    const { errors, isValid } = validateSchema(validationForm, PRODUCT_SCHEMA);
    if (!isValid) {
      setFieldErrors(errors);
      toast.error('Please fix the errors before submitting');
      return;
    }

    const payload = new FormData();

    // ==================== BASIC INFO ====================
    payload.append('name', form.name);
    payload.append('shortDesc', form.shortDesc || '');
    payload.append('description', form.description || '');
    payload.append('category', form.category);
    payload.append('brand', form.brand || '');
    payload.append('isActive', form.isActive);
    payload.append('isFeatured', form.isFeatured);
    payload.append('productType', productType);

    // ==================== PRICING & STOCK ====================
    if (productType === 'simple') {
      payload.append('price', form.price);
      payload.append('discountPrice', form.discountPrice || '');
      payload.append('stock', form.stock || 0);
    } else {
      // For variable products - base price is useful
      payload.append('basePrice', form.price || 0);   // ← Important
    }

    // ==================== ADDITIONAL FIELDS ====================
    payload.append('sku', form.sku || '');
    payload.append('weight', form.weight || '');

    if (form.tags) {
      form.tags.split(',').map(t => t.trim()).filter(Boolean).forEach(t => {
        payload.append('tags', t);
      });
    }

    // ==================== SEO META ====================
    payload.append('meta[title]', form.metaTitle || '');
    payload.append('meta[description]', form.metaDesc || '');

    // ==================== MAIN PRODUCT IMAGES ====================
    images.forEach((img) => {
      if (img instanceof File) {
        payload.append('images', img);        // Main images (not tied to variant)
      }
    });

    // ==================== VARIANTS (Most Important) ====================
    if (productType === 'variable' && variants?.length > 0) {
      payload.append('variants', JSON.stringify(variants));

      // Append per-variant-option images
      Object.keys(newVariantImages).forEach((key) => {
        const files = newVariantImages[key]; // e.g., "0-1" → [File, File]
        files.forEach((file) => {
          payload.append(`variantImages[${key}]`, file);
        });
      });
    }

    mutation.mutate(payload);
  };

  const tabs = [
    { id: TAB_KEYS.INFO, label: 'Basic Info', icon: '📋' },
    { id: TAB_KEYS.MEDIA, label: 'Media', icon: '🖼️', count: images.length },
    { id: TAB_KEYS.PRICING, label: 'Pricing & Stock', icon: '💰' },
    { id: TAB_KEYS.VARIANTS, label: 'Variations', icon: '🎨' },
    { id: TAB_KEYS.SEO, label: 'SEO', icon: '🔍' },
    { id: TAB_KEYS.STATUS, label: 'Status', icon: '⚡' },
  ];

  return (
    <>
      <style>{styles}</style>

      <div className="product-page">
        {/* Header */}
        <div className="page-header">
          <div className="header-left">
            <button className="back-btn" onClick={() => navigate('/products')}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back
            </button>
            <div className="page-title-group">
              <h1 className="page-title">Add New Product</h1>
              <p className="page-subtitle">Create a new product with full details</p>
            </div>
          </div>
          <div className="header-actions">
            <button className="btn-secondary" onClick={() => navigate('/products')}>Cancel</button>
            <button
              className="btn-primary"
              onClick={handleSubmit}
              disabled={mutation.isPending}
            >
              {mutation.isPending ? (
                <>
                  <span className="btn-spinner" />
                  Creating...
                </>
              ) : (
                <>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  Create Product
                </>
              )}
            </button>
          </div>
        </div>

        <div className="product-layout">
          {/* Main Content */}
          <div className="product-main">
            {/* Product Type Selector */}
            <div className="product-type-selector">
              <label className="section-label">Product Type</label>
              <div className="type-options">
                <button
                  className={`type-option ${productType === 'simple' ? 'active' : ''}`}
                  onClick={() => setProductType('simple')}
                >
                  <div className="type-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                  <div className="type-info">
                    <span className="type-name">Simple Product</span>
                    <span className="type-desc">Single product with fixed pricing</span>
                  </div>
                  <div className="type-check">
                    {productType === 'simple' && (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                </button>
                <button
                  className={`type-option ${productType === 'variable' ? 'active' : ''}`}
                  onClick={() => setProductType('variable')}
                >
                  <div className="type-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                    </svg>
                  </div>
                  <div className="type-info">
                    <span className="type-name">Variable Product</span>
                    <span className="type-desc">Multiple variants with different options</span>
                  </div>
                  <div className="type-check">
                    {productType === 'variable' && (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                </button>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="tab-navigation">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  className={`tab-nav-item ${activeTab === tab.id ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <span className="tab-icon">{tab.icon}</span>
                  <span className="tab-label">{tab.label}</span>
                  {tab.count > 0 && <span className="tab-badge">{tab.count}</span>}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="tab-content">
              {/* Basic Info Tab */}
              {activeTab === TAB_KEYS.INFO && (
                <div className="content-card">
                  <div className="card-header-simple">
                    <h3>Basic Information</h3>
                    <span className="optional-tag">Required</span>
                  </div>
                  <div className="form-grid">
                    <div className="form-group full-width">
                      <label className="form-label">
                        Product Name <span className="required">*</span>
                      </label>
                      <input
                        type="text"
                        className={`form-input ${fieldErrors.name ? 'error' : ''}`}
                        placeholder="Enter product name"
                        value={form.name}
                        onChange={(e) => set('name', e.target.value)}
                      />
                      {fieldErrors.name && <span className="field-error">{fieldErrors.name}</span>}
                    </div>

                    <div className="form-group full-width">
                      <label className="form-label">Short Description</label>
                      <textarea
                        className="form-textarea short"
                        placeholder="Brief summary for product cards and listings (max 300 characters)"
                        value={form.shortDesc}
                        onChange={(e) => set('shortDesc', e.target.value)}
                        maxLength={300}
                      />
                      <span className="char-count">{form.shortDesc?.length || 0}/300</span>
                    </div>

                    <div className="form-group full-width">
                      <label className="form-label">Full Description</label>
                      <div className="rich-editor">
                        <div className="editor-toolbar">
                          <button type="button" className="toolbar-btn" title="Bold">
                            <strong>B</strong>
                          </button>
                          <button type="button" className="toolbar-btn" title="Italic">
                            <em>I</em>
                          </button>
                          <button type="button" className="toolbar-btn" title="Underline">
                            <u>U</u>
                          </button>
                          <span className="toolbar-divider" />
                          <button type="button" className="toolbar-btn" title="Bullet List">
                            •
                          </button>
                          <button type="button" className="toolbar-btn" title="Numbered List">
                            1.
                          </button>
                          <span className="toolbar-divider" />
                          <button type="button" className="toolbar-btn" title="Link">
                            🔗
                          </button>
                        </div>
                        <textarea
                          className="form-textarea rich"
                          placeholder="Detailed product description..."
                          value={form.description}
                          onChange={(e) => set('description', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Media Tab */}
              {activeTab === TAB_KEYS.MEDIA && (
                <div className="content-card">
                  <div className="card-header-simple">
                    <h3>Product Media</h3>
                    <span className="optional-tag">Up to 10 images</span>
                  </div>

                  <div
                    className="image-upload-zone"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
                      handleImageUpload(files);
                    }}
                    onClick={() => document.getElementById('product-images-input').click()}
                  >
                    <input
                      id="product-images-input"
                      type="file"
                      multiple
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={(e) => handleImageUpload(Array.from(e.target.files))}
                    />
                    <div className="upload-icon-large">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <p className="upload-title">Drag & drop images here</p>
                    <p className="upload-subtitle">or click to browse your files</p>
                    <p className="upload-hint">Supports: JPG, PNG, WebP • Max 10 images</p>
                  </div>

                  {images.length > 0 && (
                    <div className="image-preview-section">
                      <div className="preview-header">
                        <span className="preview-title">Uploaded Images</span>
                        <span className="preview-count">{images.length}/10</span>
                      </div>
                      <div className="image-grid">
                        {images.map((img, i) => (
                          <div key={i} className="image-item">
                            <img
                              src={URL.createObjectURL(img)}
                              alt={`Upload ${i + 1}`}
                            />
                            <div className="image-overlay">
                              {i === 0 && <span className="main-badge">Main</span>}
                              <button
                                className="remove-btn"
                                onClick={() => removeImage(i)}
                              >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Pricing Tab */}
              {activeTab === TAB_KEYS.PRICING && (
                <div className="content-card">
                  <div className="card-header-simple">
                    <h3>Pricing & Inventory</h3>
                    <span className="optional-tag">{productType === 'simple' ? 'Required' : 'Optional'}</span>
                  </div>

                  {productType === 'simple' ? (
                    <div className="form-grid">
                      <div className="form-group">
                        <label className="form-label">
                          Regular Price <span className="required">*</span>
                        </label>
                        <div className="input-with-prefix">
                          <span className="input-prefix-fixed">৳</span>
                          <input
                            type="number"
                            className={`form-input with-prefix ${fieldErrors.price ? 'error' : ''}`}
                            placeholder="0.00"
                            value={form.price}
                            onChange={(e) => set('price', e.target.value)}
                          />
                        </div>
                        {fieldErrors.price && <span className="field-error">{fieldErrors.price}</span>}
                      </div>

                      <div className="form-group">
                        <label className="form-label">Sale Price</label>
                        <div className="input-with-prefix">
                          <span className="input-prefix-fixed">৳</span>
                          <input
                            type="number"
                            className="form-input with-prefix"
                            placeholder="0.00"
                            value={form.discountPrice}
                            onChange={(e) => set('discountPrice', e.target.value)}
                          />
                        </div>
                        <span className="field-hint">Leave empty if not on sale</span>
                      </div>

                      <div className="form-group">
                        <label className="form-label">Stock Quantity</label>
                        <input
                          type="number"
                          className="form-input"
                          placeholder="Enter quantity"
                          value={form.stock}
                          onChange={(e) => set('stock', e.target.value)}
                          min="0"
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">SKU</label>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="e.g., SKU-001"
                          value={form.sku}
                          onChange={(e) => set('sku', e.target.value)}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="variants-pricing-notice">
                      <div className="notice-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="notice-content">
                        <h4>Variations handle pricing</h4>
                        <p>For variable products, pricing is managed through variant options in the Variations tab. Each variant can have its own price modifier.</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Variants Tab */}
              {activeTab === TAB_KEYS.VARIANTS && (
                <div className="content-card">
                  <div className="card-header-simple">
                    <h3>Product Variations</h3>
                    <span className="optional-tag">Optional</span>
                  </div>

                  {productType === 'simple' ? (
                    <div className="variants-pricing-notice">
                      <div className="notice-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="notice-content">
                        <h4>Switch to Variable Product</h4>
                        <p>Variations are only available for variable products. Switch to Variable Product type to enable variations.</p>
                      </div>
                    </div>
                  ) : (
                    <VariantManager
                      isNewProduct={true}
                      variants={variants}
                      onUpdate={({ variants: updatedVariants, newVariantImages: newImgs }) => {
                        setVariants(updatedVariants);
                        setNewVariantImages(newImgs || {});
                      }}
                    />
                  )}
                </div>
              )}

              {/* SEO Tab */}
              {activeTab === TAB_KEYS.SEO && (
                <div className="content-card">
                  <div className="card-header-simple">
                    <h3>Search Engine Optimization</h3>
                    <span className="optional-tag">Optional</span>
                  </div>

                  <div className="seo-preview">
                    <div className="seo-preview-box">
                      <p className="seo-preview-url">yourstore.com/products/<span className="url-slug">{form.name?.toLowerCase().replace(/\s+/g, '-') || 'product-slug'}</span></p>
                      <p className="seo-preview-title">{form.metaTitle || form.name || 'Product Title'}</p>
                      <p className="seo-preview-desc">{form.metaDesc || form.shortDesc || 'Product description will appear here in search results...'}</p>
                    </div>
                  </div>

                  <div className="form-grid">
                    <div className="form-group full-width">
                      <label className="form-label">Meta Title</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="SEO title for search engines (max 60 chars)"
                        value={form.metaTitle}
                        onChange={(e) => set('metaTitle', e.target.value)}
                        maxLength={60}
                      />
                      <span className="char-count">{form.metaTitle?.length || 0}/60</span>
                    </div>

                    <div className="form-group full-width">
                      <label className="form-label">Meta Description</label>
                      <textarea
                        className="form-textarea"
                        placeholder="Brief description for search engines (max 160 chars)"
                        value={form.metaDesc}
                        onChange={(e) => set('metaDesc', e.target.value)}
                        maxLength={160}
                      />
                      <span className="char-count">{form.metaDesc?.length || 0}/160</span>
                    </div>

                    <div className="form-group full-width">
                      <label className="form-label">Tags</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Enter tags separated by commas"
                        value={form.tags}
                        onChange={(e) => set('tags', e.target.value)}
                      />
                      <span className="field-hint">Helps with search and filtering</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Status Tab */}
              {activeTab === TAB_KEYS.STATUS && (
                <div className="content-card">
                  <div className="card-header-simple">
                    <h3>Product Status</h3>
                    <span className="optional-tag">Settings</span>
                  </div>

                  <div className="status-options">
                    <label className={`status-option ${form.isActive ? 'active' : ''}`}>
                      <div className="status-content">
                        <div className="status-icon">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </div>
                        <div className="status-info">
                          <span className="status-name">Publish</span>
                          <span className="status-desc">Product will be visible on your store</span>
                        </div>
                      </div>
                      <input
                        type="radio"
                        name="isActive"
                        checked={form.isActive}
                        onChange={() => set('isActive', true)}
                        className="status-radio"
                      />
                    </label>

                    <label className={`status-option ${!form.isActive ? 'active' : ''}`}>
                      <div className="status-content">
                        <div className="status-icon">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                          </svg>
                        </div>
                        <div className="status-info">
                          <span className="status-name">Draft</span>
                          <span className="status-desc">Product will be hidden from your store</span>
                        </div>
                      </div>
                      <input
                        type="radio"
                        name="isActive"
                        checked={!form.isActive}
                        onChange={() => set('isActive', false)}
                        className="status-radio"
                      />
                    </label>
                  </div>

                  <div className="additional-settings">
                    <h4>Additional Settings</h4>
                    <label className="toggle-option">
                      <div className="toggle-info">
                        <span className="toggle-title">Featured Product</span>
                        <span className="toggle-desc">Show on homepage and featured sections</span>
                      </div>
                      <div
                        className={`toggle-switch ${form.isFeatured ? 'active' : ''}`}
                        onClick={() => set('isFeatured', !form.isFeatured)}
                      >
                        <div className="toggle-slider" />
                      </div>
                    </label>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="product-sidebar">
            <div className="sidebar-card">
              <h3 className="sidebar-title">Category & Brand</h3>
              <div className="sidebar-form">
                <div className="form-group">
                  <label className="form-label">
                    Category <span className="required">*</span>
                  </label>
                  <div className="select-wrapper">
                    <select
                      className={`form-select ${fieldErrors.category ? 'error' : ''}`}
                      value={form.category}
                      onChange={(e) => set('category', e.target.value)}
                    >
                      <option value="">Select category</option>
                      {categories?.map(c => (
                        <option key={c._id} value={c._id}>{c.name}</option>
                      ))}
                    </select>
                    <svg className="select-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-9" />
                    </svg>
                  </div>
                  {fieldErrors.category && <span className="field-error">{fieldErrors.category}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label">Brand</label>
                  <div className="select-wrapper">
                    <select
                      className="form-select"
                      value={form.brand}
                      onChange={(e) => set('brand', e.target.value)}
                    >
                      <option value="">Select brand</option>
                      {brands?.map(b => (
                        <option key={b._id} value={b._id}>{b.name}</option>
                      ))}
                    </select>
                    <svg className="select-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-9" />
                    </svg>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Weight (g)</label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="Product weight"
                    value={form.weight}
                    onChange={(e) => set('weight', e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="sidebar-card tips-card">
              <h3 className="sidebar-title">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                Quick Tips
              </h3>
              <ul className="tips-list">
                <li>Use high-quality images (1200x1200px recommended)</li>
                <li>Write clear, descriptive product names</li>
                <li>Add relevant tags to improve searchability</li>
                <li>Use variants for products with multiple options</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

const styles = `
  .product-page {
    min-height: 100vh;
    background: #f8fafc;
    padding: 24px;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  }

  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 32px;
    max-width: 1400px;
    margin-left: auto;
    margin-right: auto;
  }

  .header-left {
    display: flex;
    align-items: center;
    gap: 20px;
  }

  .back-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 16px;
    background: white;
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    color: #64748b;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
  }

  .back-btn:hover {
    background: #f1f5f9;
    border-color: #cbd5e1;
  }

  .back-btn svg {
    width: 18px;
    height: 18px;
  }

  .page-title {
    font-size: 24px;
    font-weight: 700;
    color: #1e293b;
    margin: 0 0 4px 0;
  }

  .page-subtitle {
    font-size: 14px;
    color: #64748b;
    margin: 0;
  }

  .header-actions {
    display: flex;
    gap: 12px;
  }

  .btn-secondary {
    padding: 10px 20px;
    background: white;
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    color: #64748b;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
  }

  .btn-secondary:hover {
    background: #f1f5f9;
  }

  .btn-primary {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 20px;
    background: linear-gradient(135deg, #1e3a5f 0%, #2d4a6f 100%);
    border: none;
    border-radius: 10px;
    color: white;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }

  .btn-primary:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(30, 58, 95, 0.3);
  }

  .btn-primary:disabled {
    opacity: 0.7;
    cursor: not-allowed;
    transform: none;
  }

  .btn-primary svg {
    width: 18px;
    height: 18px;
  }

  .btn-spinner {
    width: 16px;
    height: 16px;
    border: 2px solid rgba(255,255,255,0.3);
    border-top-color: white;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .product-layout {
    display: grid;
    grid-template-columns: 1fr 340px;
    gap: 24px;
    max-width: 1400px;
    margin: 0 auto;
  }

  .product-main {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .product-type-selector {
    background: white;
    border-radius: 16px;
    padding: 24px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.05), 0 4px 12px rgba(0,0,0,0.03);
  }

  .section-label {
    display: block;
    font-size: 14px;
    font-weight: 600;
    color: #475569;
    margin-bottom: 16px;
  }

  .type-options {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
  }

  .type-option {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 20px;
    background: #f8fafc;
    border: 2px solid #e2e8f0;
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.2s;
    text-align: left;
  }

  .type-option:hover {
    border-color: #94a3b8;
  }

  .type-option.active {
    background: linear-gradient(135deg, rgba(30, 58, 95, 0.05) 0%, rgba(45, 74, 111, 0.05) 100%);
    border-color: #1e3a5f;
  }

  .type-icon {
    width: 48px;
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: white;
    border-radius: 12px;
    color: #1e3a5f;
  }

  .type-icon svg {
    width: 24px;
    height: 24px;
  }

  .type-info {
    flex: 1;
  }

  .type-name {
    display: block;
    font-size: 15px;
    font-weight: 600;
    color: #1e293b;
    margin-bottom: 4px;
  }

  .type-desc {
    display: block;
    font-size: 13px;
    color: #64748b;
  }

  .type-check {
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #1e3a5f;
  }

  .type-check svg {
    width: 20px;
    height: 20px;
  }

  .tab-navigation {
    display: flex;
    gap: 8px;
    background: white;
    padding: 8px;
    border-radius: 12px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  }

  .tab-nav-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 20px;
    background: transparent;
    border: none;
    border-radius: 8px;
    color: #64748b;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
  }

  .tab-nav-item:hover {
    background: #f1f5f9;
    color: #1e293b;
  }

  .tab-nav-item.active {
    background: linear-gradient(135deg, #1e3a5f 0%, #2d4a6f 100%);
    color: white;
  }

  .tab-icon {
    font-size: 16px;
  }

  .tab-badge {
    padding: 2px 8px;
    background: rgba(255,255,255,0.2);
    border-radius: 10px;
    font-size: 12px;
  }

  .tab-nav-item:not(.active) .tab-badge {
    background: #e2e8f0;
    color: #64748b;
  }

  .tab-content {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .content-card {
    background: white;
    border-radius: 16px;
    padding: 24px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.05), 0 4px 12px rgba(0,0,0,0.03);
  }

  .card-header-simple {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
  }

  .card-header-simple h3 {
    font-size: 16px;
    font-weight: 600;
    color: #1e293b;
    margin: 0;
  }

  .optional-tag {
    padding: 4px 12px;
    background: #fef3c7;
    color: #92400e;
    font-size: 12px;
    font-weight: 500;
    border-radius: 6px;
  }

  .form-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .form-group.full-width {
    grid-column: 1 / -1;
  }

  .form-label {
    font-size: 13px;
    font-weight: 600;
    color: #475569;
  }

  .required {
    color: #dc2626;
  }

  .form-input, .form-textarea, .form-select {
    padding: 12px 16px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    font-size: 14px;
    color: #1e293b;
    transition: all 0.2s;
  }

  .form-input:focus, .form-textarea:focus, .form-select:focus {
    outline: none;
    border-color: #1e3a5f;
    background: white;
    box-shadow: 0 0 0 3px rgba(30, 58, 95, 0.1);
  }

  .form-input.error, .form-select.error {
    border-color: #dc2626;
  }

  .form-textarea {
    min-height: 120px;
    resize: vertical;
  }

  .form-textarea.short {
    min-height: 80px;
  }

  .char-count {
    font-size: 12px;
    color: #94a3b8;
    text-align: right;
  }

  .field-error {
    font-size: 12px;
    color: #dc2626;
  }

  .field-hint {
    font-size: 12px;
    color: #94a3b8;
  }

  .input-with-prefix {
    position: relative;
  }

  .input-prefix-fixed {
    position: absolute;
    left: 16px;
    top: 50%;
    transform: translateY(-50%);
    color: #64748b;
    font-weight: 500;
  }

  .form-input.with-prefix {
    padding-left: 36px;
    text-align: center;
  }

  .rich-editor {
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    overflow: hidden;
  }

  .editor-toolbar {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 8px 12px;
    background: #f8fafc;
    border-bottom: 1px solid #e2e8f0;
  }

  .toolbar-btn {
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    border: none;
    border-radius: 6px;
    color: #64748b;
    cursor: pointer;
    font-size: 14px;
    transition: all 0.2s;
  }

  .toolbar-btn:hover {
    background: #e2e8f0;
    color: #1e293b;
  }

  .toolbar-divider {
    width: 1px;
    height: 20px;
    background: #e2e8f0;
    margin: 0 8px;
  }

  .rich-editor .form-textarea {
    border: none;
    border-radius: 0;
    min-height: 200px;
  }

  .rich-editor .form-textarea:focus {
    box-shadow: none;
  }

  .image-upload-zone {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 48px;
    border: 2px dashed #e2e8f0;
    border-radius: 12px;
    background: #f8fafc;
    cursor: pointer;
    transition: all 0.2s;
  }

  .image-upload-zone:hover {
    border-color: #1e3a5f;
    background: #f1f5f9;
  }

  .upload-icon-large {
    width: 64px;
    height: 64px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: white;
    border-radius: 16px;
    color: #1e3a5f;
    margin-bottom: 16px;
  }

  .upload-icon-large svg {
    width: 32px;
    height: 32px;
  }

  .upload-title {
    font-size: 16px;
    font-weight: 600;
    color: #1e293b;
    margin: 0 0 4px 0;
  }

  .upload-subtitle {
    font-size: 14px;
    color: #64748b;
    margin: 0 0 12px 0;
  }

  .upload-hint {
    font-size: 12px;
    color: #94a3b8;
    margin: 0;
  }

  .image-preview-section {
    margin-top: 24px;
  }

  .preview-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
  }

  .preview-title {
    font-size: 14px;
    font-weight: 600;
    color: #475569;
  }

  .preview-count {
    font-size: 12px;
    color: #64748b;
  }

  .image-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: 12px;
  }

  .image-item {
    position: relative;
    aspect-ratio: 1;
    border-radius: 12px;
    overflow: hidden;
    background: #f1f5f9;
  }

  .image-item img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .image-overlay {
    position: absolute;
    inset: 0;
    background: linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 50%);
    opacity: 0;
    transition: opacity 0.2s;
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    padding: 8px;
  }

  .image-item:hover .image-overlay {
    opacity: 1;
  }

  .main-badge {
    padding: 4px 10px;
    background: #1e3a5f;
    color: white;
    font-size: 10px;
    font-weight: 600;
    border-radius: 6px;
  }

  .remove-btn {
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: white;
    border: none;
    border-radius: 50%;
    color: #dc2626;
    cursor: pointer;
    transition: all 0.2s;
  }

  .remove-btn:hover {
    background: #fef2f2;
    transform: scale(1.1);
  }

  .remove-btn svg {
    width: 14px;
    height: 14px;
  }

  .variants-pricing-notice {
    display: flex;
    align-items: flex-start;
    gap: 16px;
    padding: 20px;
    background: #fef3c7;
    border-radius: 12px;
  }

  .notice-icon {
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: white;
    border-radius: 10px;
    color: #92400e;
  }

  .notice-icon svg {
    width: 20px;
    height: 20px;
  }

  .notice-content h4 {
    font-size: 14px;
    font-weight: 600;
    color: #92400e;
    margin: 0 0 4px 0;
  }

  .notice-content p {
    font-size: 13px;
    color: #a16207;
    margin: 0;
  }

  .seo-preview {
    margin-bottom: 24px;
  }

  .seo-preview-box {
    padding: 20px;
    background: #f8fafc;
    border-radius: 12px;
    border: 1px solid #e2e8f0;
  }

  .seo-preview-url {
    font-size: 12px;
    color: #1e3a5f;
    margin: 0 0 4px 0;
  }

  .url-slug {
    color: #1e3a5f;
  }

  .seo-preview-title {
    font-size: 18px;
    font-weight: 500;
    color: #1e3a5f;
    margin: 0 0 4px 0;
  }

  .seo-preview-desc {
    font-size: 13px;
    color: #64748b;
    margin: 0;
    line-height: 1.5;
  }

  .status-options {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .status-option {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 20px;
    background: #f8fafc;
    border: 2px solid #e2e8f0;
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .status-option:hover {
    border-color: #94a3b8;
  }

  .status-option.active {
    background: linear-gradient(135deg, rgba(30, 58, 95, 0.05) 0%, rgba(45, 74, 111, 0.05) 100%);
    border-color: #1e3a5f;
  }

  .status-content {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .status-icon {
    width: 44px;
    height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: white;
    border-radius: 10px;
    color: #1e3a5f;
  }

  .status-icon svg {
    width: 22px;
    height: 22px;
  }

  .status-name {
    display: block;
    font-size: 14px;
    font-weight: 600;
    color: #1e293b;
  }

  .status-desc {
    display: block;
    font-size: 12px;
    color: #64748b;
  }

  .status-radio {
    width: 20px;
    height: 20px;
    accent-color: #1e3a5f;
  }

  .additional-settings {
    margin-top: 24px;
    padding-top: 24px;
    border-top: 1px solid #e2e8f0;
  }

  .additional-settings h4 {
    font-size: 14px;
    font-weight: 600;
    color: #475569;
    margin: 0 0 16px 0;
  }

  .toggle-option {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px;
    background: #f8fafc;
    border-radius: 10px;
    cursor: pointer;
  }

  .toggle-title {
    display: block;
    font-size: 14px;
    font-weight: 500;
    color: #1e293b;
  }

  .toggle-desc {
    display: block;
    font-size: 12px;
    color: #64748b;
    margin-top: 2px;
  }

  .toggle-switch {
    width: 48px;
    height: 26px;
    background: #e2e8f0;
    border-radius: 13px;
    position: relative;
    cursor: pointer;
    transition: all 0.2s;
  }

  .toggle-switch.active {
    background: #1e3a5f;
  }

  .toggle-slider {
    position: absolute;
    top: 3px;
    left: 3px;
    width: 20px;
    height: 20px;
    background: white;
    border-radius: 50%;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    transition: all 0.2s;
  }

  .toggle-switch.active .toggle-slider {
    left: 25px;
  }

  .product-sidebar {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .sidebar-card {
    background: white;
    border-radius: 16px;
    padding: 20px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.05), 0 4px 12px rgba(0,0,0,0.03);
  }

  .sidebar-title {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 14px;
    font-weight: 600;
    color: #1e293b;
    margin: 0 0 20px 0;
  }

  .sidebar-title svg {
    width: 18px;
    height: 18px;
    color: #1e3a5f;
  }

  .sidebar-form {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .select-wrapper {
    position: relative;
  }

  .form-select {
    width: 100%;
    padding: 12px 40px 12px 16px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    font-size: 14px;
    color: #1e293b;
    appearance: none;
    cursor: pointer;
  }

  .form-select:focus {
    outline: none;
    border-color: #1e3a5f;
    background: white;
  }

  .select-arrow {
    position: absolute;
    right: 14px;
    top: 50%;
    transform: translateY(-50%);
    width: 18px;
    height: 18px;
    color: #64748b;
    pointer-events: none;
  }

  .tips-card {
    background: linear-gradient(135deg, #fef3c7 0%, #fef9f3 100%);
    border: 1px solid #fcd34d;
  }

  .tips-card .sidebar-title {
    color: #92400e;
  }

  .tips-card .sidebar-title svg {
    color: #92400e;
  }

  .tips-list {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  .tips-list li {
    position: relative;
    padding-left: 20px;
    font-size: 13px;
    color: #a16207;
    line-height: 1.6;
    margin-bottom: 10px;
  }

  .tips-list li::before {
    content: '✓';
    position: absolute;
    left: 0;
    color: #92400e;
    font-weight: 600;
  }

  .tips-list li:last-child {
    margin-bottom: 0;
  }
`;