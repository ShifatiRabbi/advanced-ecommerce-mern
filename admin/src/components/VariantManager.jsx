import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';

export default function VariantManager({
  productId,
  variants = [],
  onUpdate,
  isNewProduct = false,
}) {
  const qc = useQueryClient();
  const [localVariants, setLocalVariants] = useState(variants);
  const [activeVariant, setActiveVariant] = useState(0);

  // For new images (File objects) - only used in new product flow
  const [newVariantImages, setNewVariantImages] = useState({}); // e.g. "0-1": [File, File]

  const updateVariantMutation = useMutation({
    mutationFn: (data) => api.post(`/products/${productId}/variants`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['product-edit', productId] });
      onUpdate?.();
    },
  });

  const addVariant = () => {
    const newVariant = {
      name: '',
      options: [{ label: '', sku: '', priceModifier: 0, stock: 0, images: [] }],
      defaultOptionIndex: 0,
    };
    setLocalVariants([...localVariants, newVariant]);
    setActiveVariant(localVariants.length);
  };

  const removeVariant = (index) => {
    const updated = localVariants.filter((_, i) => i !== index);
    setLocalVariants(updated);
    if (activeVariant >= updated.length) setActiveVariant(Math.max(0, updated.length - 1));
  };

  const updateVariantName = (name) => {
    const updated = [...localVariants];
    updated[activeVariant] = { ...updated[activeVariant], name };
    setLocalVariants(updated);
  };

  const addOption = () => {
    const updated = [...localVariants];
    updated[activeVariant].options.push({
      label: '',
      sku: '',
      priceModifier: 0,
      stock: 0,
      images: [],
    });
    setLocalVariants(updated);
  };

  const removeOption = (optIndex) => {
    const updated = [...localVariants];
    const variant = updated[activeVariant];
    variant.options.splice(optIndex, 1);
    if (variant.defaultOptionIndex >= variant.options.length) {
      variant.defaultOptionIndex = 0;
    }
    setLocalVariants(updated);
  };

  const updateOption = (optIndex, field, value) => {
    const updated = [...localVariants];
    const variant = updated[activeVariant];
    variant.options[optIndex] = { ...variant.options[optIndex], [field]: value };
    setLocalVariants(updated);
  };

  const setDefaultOption = (optIndex) => {
    const updated = [...localVariants];
    updated[activeVariant].defaultOptionIndex = optIndex;
    setLocalVariants(updated);
  };

  // Handle image upload for specific variant + option
  const handleVariantImageUpload = (variantIndex, optionIndex, files) => {
    const fileArray = Array.from(files);

    if (isNewProduct) {
      // For new products: store File objects temporarily
      setNewVariantImages((prev) => ({
        ...prev,
        [`${variantIndex}-${optionIndex}`]: [
          ...(prev[`${variantIndex}-${optionIndex}`] || []),
          ...fileArray,
        ],
      }));
    } else {
      // For existing products: you can send files directly via FormData in save
      console.log('Upload images for existing product', variantIndex, optionIndex, fileArray);
      // You can trigger upload here or collect in saveVariants
    }

    // Optional: Preview can be handled with URL.createObjectURL
  };

  const removeNewImage = (variantIndex, optionIndex, imageIndex) => {
    setNewVariantImages((prev) => {
      const key = `${variantIndex}-${optionIndex}`;
      const updated = [...(prev[key] || [])];
      updated.splice(imageIndex, 1);
      return { ...prev, [key]: updated };
    });
  };

  const saveVariants = () => {
    if (isNewProduct) {
      // Pass both variants and new images to parent
      onUpdate?.({ variants: localVariants, newVariantImages });
      return;
    }

    // For existing product
    updateVariantMutation.mutate({ variants: localVariants });
  };

  const combinationCount = localVariants.reduce(
    (acc, v) => acc * (v.options?.length || 1),
    1
  );

  return (
    <>
    <style>{variantStyles}</style>
      <div className="variant-manager">
        <div className="variant-header">
          <h3>Product Variants</h3>
          <button className="add-variant-btn" onClick={addVariant}>
            + Add Variant (e.g. Size, Color)
          </button>
        </div>

        {localVariants.length > 0 && (
          <div className="variant-tabs">
            {localVariants.map((variant, vIndex) => (
              <div
                key={vIndex}
                className={`variant-tab ${activeVariant === vIndex ? 'active' : ''}`}
                onClick={() => setActiveVariant(vIndex)}
              >
                {variant.name || `Variant ${vIndex + 1}`}
                <button
                  className="remove-tab"
                  onClick={(e) => { e.stopPropagation(); removeVariant(vIndex); }}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}

        {localVariants.length > 0 && localVariants[activeVariant] && (
          <div className="variant-content">
            {/* Variant Name */}
            <div className="form-group">
              <label>Variant Name (e.g., Size, Color)</label>
              <input
                type="text"
                value={localVariants[activeVariant].name}
                onChange={(e) => updateVariantName(e.target.value)}
                placeholder="Size"
              />
            </div>

            <h4>Options</h4>

            {localVariants[activeVariant].options.map((option, oIndex) => (
              <div key={oIndex} className="option-row">
                <div className="option-main">
                  <input
                    type="text"
                    placeholder="Option Value (e.g., Small, Red)"
                    value={option.label}
                    onChange={(e) => updateOption(oIndex, 'label', e.target.value)}
                  />

                  <input
                    type="text"
                    placeholder="SKU"
                    value={option.sku || ''}
                    onChange={(e) => updateOption(oIndex, 'sku', e.target.value)}
                  />
                </div>

                <div className="option-pricing">
                  <div>
                    <label>Price Modifier</label>
                    <input
                      type="number"
                      value={option.priceModifier}
                      onChange={(e) => updateOption(oIndex, 'priceModifier', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <label>Stock</label>
                    <input
                      type="number"
                      value={option.stock}
                      onChange={(e) => updateOption(oIndex, 'stock', parseInt(e.target.value) || 0)}
                    />
                  </div>
                </div>

                {/* Images for this option */}
                <div className="variant-images-section">
                  <label>Images for this option</label>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) =>
                      handleVariantImageUpload(activeVariant, oIndex, e.target.files)
                    }
                  />

                  <div className="image-previews">
                    {/* Existing images (from DB) */}
                    {option.images?.map((img, idx) => (
                      <div key={idx} className="preview">
                        <img src={img.url} alt="" />
                        <button onClick={() => {/* remove existing image logic */}}>
                          ✕
                        </button>
                      </div>
                    ))}

                    {/* New uploaded images preview */}
                    {newVariantImages[`${activeVariant}-${oIndex}`]?.map((file, idx) => (
                      <div key={idx} className="preview">
                        <img src={URL.createObjectURL(file)} alt="" />
                        <button onClick={() => removeNewImage(activeVariant, oIndex, idx)}>
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="option-actions">
                  <label>
                    <input
                      type="radio"
                      name={`default-${activeVariant}`}
                      checked={localVariants[activeVariant].defaultOptionIndex === oIndex}
                      onChange={() => setDefaultOption(oIndex)}
                    />
                    Default
                  </label>
                  <button onClick={() => removeOption(oIndex)} disabled={localVariants[activeVariant].options.length === 1}>
                    Delete Option
                  </button>
                </div>
              </div>
            ))}

            <button className="add-option-btn" onClick={addOption}>
              + Add Option
            </button>

            <div className="variant-footer">
              <p><strong>{combinationCount}</strong> possible combinations</p>
              <button className="save-btn" onClick={saveVariants}>
                {isNewProduct ? 'Save to Form' : 'Save Variants'}
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

const variantStyles = `
  .variant-manager {
    background: #f8fafc;
    border-radius: 12px;
  }

  .variant-header {
    background: white;
    border-bottom: 1px solid #e2e8f0;
    padding: 16px;
  }

  .variant-tabs {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    align-items: center;
  }

  .variant-tab {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 16px;
    background: #f1f5f9;
    border: 2px solid transparent;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .variant-tab:hover {
    background: #e2e8f0;
  }

  .variant-tab.active {
    background: linear-gradient(135deg, rgba(30, 58, 95, 0.08) 0%, rgba(45, 74, 111, 0.08) 100%);
    border-color: #1e3a5f;
  }

  .variant-tab-name {
    font-size: 14px;
    font-weight: 500;
    color: #475569;
  }

  .variant-tab.active .variant-tab-name {
    color: #1e3a5f;
  }

  .variant-tab-remove {
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    border: none;
    border-radius: 4px;
    color: #94a3b8;
    cursor: pointer;
    transition: all 0.2s;
  }

  .variant-tab-remove:hover {
    background: #fee2e2;
    color: #dc2626;
  }

  .variant-tab-remove svg {
    width: 14px;
    height: 14px;
  }

  .add-variant-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 10px 16px;
    background: transparent;
    border: 2px dashed #cbd5e1;
    border-radius: 8px;
    color: #64748b;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
  }

  .add-variant-btn:hover {
    border-color: #1e3a5f;
    color: #1e3a5f;
    background: rgba(30, 58, 95, 0.05);
  }

  .add-variant-btn svg {
    width: 16px;
    height: 16px;
  }

  .variant-content {
    padding: 24px;
    background: white;
  }

  .variant-name-row {
    margin-bottom: 24px;
  }

  .field-label {
    display: block;
    font-size: 13px;
    font-weight: 600;
    color: #475569;
    margin-bottom: 8px;
  }

  .variant-name-input {
    width: 100%;
    padding: 12px 16px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    font-size: 14px;
    color: #1e293b;
    transition: all 0.2s;
  }

  .variant-name-input:focus {
    outline: none;
    border-color: #1e3a5f;
    background: white;
    box-shadow: 0 0 0 3px rgba(30, 58, 95, 0.1);
  }

  .options-section {
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    overflow: hidden;
  }

  .options-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 20px;
    background: #f8fafc;
    border-bottom: 1px solid #e2e8f0;
  }

  .options-title {
    font-size: 14px;
    font-weight: 600;
    color: #475569;
  }

  .add-option-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 14px;
    background: #1e3a5f;
    border: none;
    border-radius: 8px;
    color: white;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
  }

  .add-option-btn:hover {
    background: #2d4a6f;
    transform: translateY(-1px);
  }

  .add-option-btn svg {
    width: 14px;
    height: 14px;
  }

  .options-list {
    display: flex;
    flex-direction: column;
  }

  .option-row {
    display: grid;
    grid-template-columns: 1fr auto auto;
    gap: 16px;
    align-items: center;
    padding: 16px 20px;
    border-bottom: 1px solid #f1f5f9;
  }

  .option-row:last-child {
    border-bottom: none;
  }

  .option-info {
    flex: 1;
  }

  .option-label-input {
    width: 100%;
    padding: 10px 14px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    font-size: 14px;
    color: #1e293b;
    transition: all 0.2s;
  }

  .option-label-input:focus {
    outline: none;
    border-color: #1e3a5f;
    background: white;
  }

  .option-modifiers {
    display: flex;
    gap: 12px;
  }

  .modifier-field {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .modifier-field label {
    font-size: 11px;
    font-weight: 600;
    color: #94a3b8;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .modifier-input-wrapper {
    position: relative;
    display: flex;
    align-items: center;
  }

  .modifier-input-wrapper .currency {
    position: absolute;
    left: 10px;
    color: #64748b;
    font-size: 13px;
    font-weight: 500;
  }

  .modifier-input-wrapper input {
    width: 100px;
    padding: 8px 10px 8px 28px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    font-size: 13px;
    color: #1e293b;
    text-align: center;
  }

  .stock-input {
    width: 80px;
    padding: 8px 10px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    font-size: 13px;
    color: #1e293b;
    text-align: center;
  }

  .option-actions {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .default-checkbox {
    display: flex;
    align-items: center;
    gap: 6px;
    cursor: pointer;
  }

  .default-checkbox input {
    width: 16px;
    height: 16px;
    accent-color: #1e3a5f;
  }

  .default-checkbox span {
    font-size: 12px;
    color: #64748b;
  }

  .remove-option-btn {
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #fef2f2;
    border: none;
    border-radius: 8px;
    color: #dc2626;
    cursor: pointer;
    transition: all 0.2s;
  }

  .remove-option-btn:hover:not(:disabled) {
    background: #fee2e2;
    transform: scale(1.05);
  }

  .remove-option-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .remove-option-btn svg {
    width: 16px;
    height: 16px;
  }

  .variant-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 20px;
    padding-top: 20px;
    border-top: 1px solid #e2e8f0;
  }

  .variant-summary {
    display: flex;
    align-items: center;
  }

  .summary-label {
    padding: 6px 12px;
    background: #f0f9ff;
    color: #0369a1;
    font-size: 13px;
    font-weight: 500;
    border-radius: 6px;
  }

  .save-variants-btn {
    padding: 10px 20px;
    background: linear-gradient(135deg, #059669 0%, #047857 100%);
    border: none;
    border-radius: 10px;
    color: white;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }

  .save-variants-btn:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(5, 150, 105, 0.3);
  }

  .save-variants-btn:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
`;