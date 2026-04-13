import React from 'react';

// Premium Input Component
export const Input = ({
  label,
  error,
  required,
  prefix,
  suffix,
  helpText,
  className = '',
  ...props
}) => (
  <div className={`input-group ${className}`}>
    {label && (
      <label className="input-label">
        {label}
        {required && <span className="required-mark">*</span>}
      </label>
    )}
    <div className="input-wrapper">
      {prefix && <span className="input-prefix">{prefix}</span>}
      <input
        className={`input-field ${error ? 'input-error' : ''} ${prefix ? 'has-prefix' : ''} ${suffix ? 'has-suffix' : ''}`}
        {...props}
      />
      {suffix && <span className="input-suffix">{suffix}</span>}
    </div>
    {helpText && !error && <span className="help-text">{helpText}</span>}
    {error && <span className="error-text">{error}</span>}
  </div>
);

// Premium Textarea Component
export const Textarea = ({
  label,
  error,
  required,
  helpText,
  rows = 4,
  className = '',
  ...props
}) => (
  <div className={`input-group ${className}`}>
    {label && (
      <label className="input-label">
        {label}
        {required && <span className="required-mark">*</span>}
      </label>
    )}
    <textarea
      rows={rows}
      className={`textarea-field ${error ? 'input-error' : ''}`}
      {...props}
    />
    {helpText && !error && <span className="help-text">{helpText}</span>}
    {error && <span className="error-text">{error}</span>}
  </div>
);

// Premium Select Component
export const Select = ({
  label,
  error,
  required,
  options = [],
  placeholder = 'Select an option',
  helpText,
  className = '',
  ...props
}) => (
  <div className={`input-group ${className}`}>
    {label && (
      <label className="input-label">
        {label}
        {required && <span className="required-mark">*</span>}
      </label>
    )}
    <div className="select-wrapper">
      <select className={`select-field ${error ? 'input-error' : ''}`} {...props}>
        <option value="">{placeholder}</option>
        {options.map((opt, i) => (
          <option key={i} value={opt.value || opt._id || opt}>
            {opt.label || opt.name || opt}
          </option>
        ))}
      </select>
      <svg className="select-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
      </svg>
    </div>
    {helpText && !error && <span className="help-text">{helpText}</span>}
    {error && <span className="error-text">{error}</span>}
  </div>
);

// Toggle Switch Component
export const Toggle = ({ label, checked, onChange, description }) => (
  <label className="toggle-wrapper">
    <div className="toggle-info">
      <span className="toggle-label">{label}</span>
      {description && <span className="toggle-desc">{description}</span>}
    </div>
    <div className={`toggle-switch ${checked ? 'active' : ''}`} onClick={() => onChange(!checked)}>
      <div className="toggle-slider" />
    </div>
  </label>
);

// Card Component
export const Card = ({ title, subtitle, icon, children, className = '', action }) => (
  <div className={`card ${className}`}>
    {(title || action) && (
      <div className="card-header">
        <div className="card-title-wrapper">
          {icon && <span className="card-icon">{icon}</span>}
          <div>
            <h3 className="card-title">{title}</h3>
            {subtitle && <p className="card-subtitle">{subtitle}</p>}
          </div>
        </div>
        {action && <div className="card-action">{action}</div>}
      </div>
    )}
    <div className="card-body">{children}</div>
  </div>
);

// Image Upload Component
export const ImageUpload = ({ images, onChange, maxImages = 10 }) => {
  const handleDrop = (e) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
    handleFiles(files);
  };

  const handleFiles = (files) => {
    const newImages = files.slice(0, maxImages - images.length);
    const newFileList = [...images, ...newImages];
    onChange(newFileList);
  };

  const removeImage = (index) => {
    const newImages = images.filter((_, i) => i !== index);
    onChange(newImages);
  };

  return (
    <div className="image-upload-container">
      <div
        className="image-upload-zone"
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        onClick={() => document.getElementById('multi-image-input').click()}
      >
        <input
          id="multi-image-input"
          type="file"
          multiple
          accept="image/*"
          style={{ display: 'none' }}
          onChange={(e) => handleFiles(Array.from(e.target.files))}
        />
        <div className="upload-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <p className="upload-text">Drag & drop images here or click to browse</p>
        <p className="upload-hint">Supports JPG, PNG, WebP (max {maxImages} images)</p>
      </div>

      {images.length > 0 && (
        <div className="image-preview-grid">
          {images.map((img, i) => (
            <div key={i} className="image-preview-item">
              <img
                src={typeof img === 'string' ? img : URL.createObjectURL(img)}
                alt={`Preview ${i + 1}`}
              />
              <button className="remove-image-btn" onClick={() => removeImage(i)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Tab Component
export const Tab = ({ tabs, activeTab, onChange }) => (
  <div className="tab-container">
    {tabs.map((tab) => (
      <button
        key={tab.id}
        className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
        onClick={() => onChange(tab.id)}
      >
        {tab.icon}
        {tab.label}
        {tab.count !== undefined && <span className="tab-count">{tab.count}</span>}
      </button>
    ))}
  </div>
);

// Button Component
export const Button = ({
  children,
  variant = 'primary',
  size = 'medium',
  icon,
  loading = false,
  disabled = false,
  className = '',
  ...props
}) => (
  <button
    className={`btn btn-${variant} btn-${size} ${className}`}
    disabled={disabled || loading}
    {...props}
  >
    {loading ? (
      <span className="btn-spinner" />
    ) : (
      <>
        {icon && <span className="btn-icon">{icon}</span>}
        {children}
      </>
    )}
  </button>
);

// Badge Component
export const Badge = ({ children, variant = 'default', size = 'medium' }) => (
  <span className={`badge badge-${variant} badge-${size}`}>{children}</span>
);

// Divider Component
export const Divider = ({ text }) => (
  <div className="divider">
    {text && <span className="divider-text">{text}</span>}
  </div>
);