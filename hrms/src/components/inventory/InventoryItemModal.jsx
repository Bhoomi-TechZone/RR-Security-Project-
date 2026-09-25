import React, { useState, useEffect, useRef } from 'react';
import { X, Package, Sparkles, AlertCircle, Upload, Image as ImageIcon, Trash2, Shirt, Shield } from 'lucide-react';
import {
  INVENTORY_CATEGORIES,
  INVENTORY_SIZES,
  INVENTORY_COLORS,
  INVENTORY_UNITS,
  INVENTORY_BRANDS
} from '../../data/inventoryMasterData';
import styles from './InventoryItemModal.module.css';

const UNIFORM_CATEGORIES = ['Uniform', 'Accessory', 'Other'];
const ASSET_CATEGORIES = ['Equipment', 'Security Kit', 'Safety Gear', 'ID Card', 'Other'];

export default function InventoryItemModal({
  isOpen,
  mode = 'add', // 'add' | 'edit'
  itemType = 'uniform', // 'uniform' | 'asset'
  initialData = null,
  existingItems = [],
  onClose,
  onSave
}) {
  const fileInputRef = useRef(null);

  const activeItemType = initialData
    ? (initialData.category === 'Uniform' || initialData.category === 'Accessory' ? 'uniform' : 'asset')
    : itemType;

  const isUniform = activeItemType === 'uniform';

  const [formData, setFormData] = useState({
    purchaseDate: new Date().toISOString().slice(0, 10),
    billNumber: '',
    billPhoto: null,
    billPhotoName: '',
    itemCode: '',
    itemName: '',
    category: isUniform ? 'Uniform' : 'Equipment',
    size: isUniform ? 'L' : 'Standard',
    color: isUniform ? 'Navy Blue' : 'Black',
    quantity: isUniform ? 50 : 20,
    unit: isUniform ? 'Pcs' : 'Set',
    brand: isUniform ? 'NovaGear' : '',
    purchaseRate: isUniform ? 450 : 1200,
    minimumStock: isUniform ? 20 : 5,
    openingStock: isUniform ? 50 : 20,
    warrantyStartDate: '',
    warrantyEndDate: '',
    clientName: 'Central Stock',
    activeStatus: 'Active',
    description: ''
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initialData) {
      setFormData({
        purchaseDate: initialData.purchaseDate || new Date().toISOString().slice(0, 10),
        billNumber: initialData.billNumber || '',
        billPhoto: initialData.billPhoto || null,
        billPhotoName: initialData.billPhotoName || (initialData.billPhoto ? 'Bill_Receipt.jpg' : ''),
        itemCode: initialData.itemCode || '',
        itemName: initialData.itemName || '',
        category: initialData.category || (isUniform ? 'Uniform' : 'Equipment'),
        size: initialData.size || (isUniform ? 'Free Size' : 'Standard'),
        color: initialData.color || (isUniform ? 'Navy Blue' : 'Black'),
        quantity: initialData.quantity ?? initialData.openingStock ?? initialData.totalQuantity ?? (isUniform ? 50 : 20),
        unit: initialData.unit || (isUniform ? 'Pcs' : 'Set'),
        brand: initialData.brand || (isUniform ? 'NovaGear' : ''),
        purchaseRate: initialData.purchaseRate ?? 0,
        minimumStock: initialData.minimumStock ?? (isUniform ? 10 : 5),
        openingStock: initialData.openingStock ?? initialData.quantity ?? initialData.totalQuantity ?? 0,
        warrantyStartDate: initialData.warrantyStartDate || initialData.warrantyStart || '',
        warrantyEndDate: initialData.warrantyEndDate || initialData.warrantyEnd || '',
        clientName: initialData.clientName || 'Central Stock',
        activeStatus: initialData.activeStatus || 'Active',
        description: initialData.description || ''
      });
    } else {
      setFormData({
        purchaseDate: new Date().toISOString().slice(0, 10),
        billNumber: '',
        billPhoto: null,
        billPhotoName: '',
        itemCode: '',
        itemName: '',
        category: isUniform ? 'Uniform' : 'Equipment',
        size: isUniform ? 'L' : 'Standard',
        color: isUniform ? 'Navy Blue' : 'Black',
        quantity: isUniform ? 50 : 20,
        unit: isUniform ? 'Pcs' : 'Set',
        brand: isUniform ? 'NovaGear' : '',
        purchaseRate: isUniform ? 450 : 1200,
        minimumStock: isUniform ? 20 : 5,
        openingStock: isUniform ? 50 : 20,
        warrantyStartDate: '',
        warrantyEndDate: '',
        clientName: 'Central Stock',
        activeStatus: 'Active',
        description: ''
      });
    }
    setErrors({});
  }, [initialData, isOpen, itemType, isUniform]);

  if (!isOpen) return null;

  const handleChange = (field, value) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };
      if (field === 'quantity') {
        updated.openingStock = value;
      } else if (field === 'openingStock') {
        updated.quantity = value;
      }
      return updated;
    });
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setFormData((prev) => ({
          ...prev,
          billPhoto: reader.result,
          billPhotoName: file.name
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveFile = () => {
    setFormData((prev) => ({
      ...prev,
      billPhoto: null,
      billPhotoName: ''
    }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const nextErrors = {};

    if (!formData.itemCode.trim()) {
      nextErrors.itemCode = isUniform
        ? 'Uniform Code is required (e.g. UNI-SHT-L)'
        : 'Item Identity Number is required (e.g. AST-WT-01)';
    } else if (
      mode === 'add' &&
      existingItems.some((itm) => itm.itemCode?.toLowerCase() === formData.itemCode.trim().toLowerCase())
    ) {
      nextErrors.itemCode = isUniform
        ? 'Uniform Code must be unique. This code already exists.'
        : 'Item Identity Number must be unique. This number already exists.';
    }

    if (!formData.itemName.trim()) {
      nextErrors.itemName = isUniform ? 'Uniform Item Name is required.' : 'Asset Item Name is required.';
    }

    if (formData.quantity === '' || Number(formData.quantity) < 0) {
      nextErrors.quantity = 'Quantity must be 0 or greater.';
    }

    if (formData.purchaseRate === '' || Number(formData.purchaseRate) < 0) {
      nextErrors.purchaseRate = 'Valid purchase rate (>= 0) is required.';
    }

    if (formData.minimumStock === '' || Number(formData.minimumStock) < 0) {
      nextErrors.minimumStock = 'Minimum stock level must be 0 or greater.';
    }

    if (formData.warrantyStartDate && formData.warrantyEndDate && formData.warrantyEndDate < formData.warrantyStartDate) {
      nextErrors.warrantyEndDate = 'Warranty End Date cannot be before Warranty Start Date.';
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    const finalQuantity = Number(formData.quantity ?? formData.openingStock ?? 0);

    const payload = {
      ...formData,
      itemCode: formData.itemCode.trim().toUpperCase(),
      itemName: formData.itemName.trim(),
      quantity: finalQuantity,
      openingStock: finalQuantity,
      totalQuantity: finalQuantity,
      purchaseRate: Number(formData.purchaseRate),
      minimumStock: Number(formData.minimumStock),
      warrantyStartDate: formData.warrantyStartDate || null,
      warrantyEndDate: formData.warrantyEndDate || null
    };

    onSave(payload);
  };

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true">
      <div className={styles.modalCard}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerTitleWrap}>
            <div className={styles.headerIcon}>
              {isUniform ? <Shirt size={20} /> : <Shield size={20} />}
            </div>
            <div>
              <h2 className={styles.title}>
                {mode === 'add'
                  ? (isUniform ? 'Add Uniform Item' : 'Add Asset Item')
                  : (isUniform ? 'Edit Uniform Item' : 'Edit Asset Item')}
              </h2>
              <p className={styles.subtitle}>
                {isUniform
                  ? 'Configure uniform attire, clothing, size, fabric specifications, rate, and threshold levels'
                  : 'Configure security gear, electronics, tools & equipment specifications, rate, and threshold levels'}
              </p>
            </div>
          </div>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form id="inventoryItemForm" onSubmit={handleSubmit} className={styles.body}>
          {/* Purchase Details: Purchase Date, Bill Number, Add Bill Photo */}
          <div className={styles.grid3}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Purchase Date</label>
              <input
                type="date"
                className={styles.input}
                value={formData.purchaseDate}
                onChange={(e) => handleChange('purchaseDate', e.target.value)}
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Bill Number</label>
              <input
                type="text"
                placeholder="e.g. INV-2026-089"
                className={styles.input}
                value={formData.billNumber}
                onChange={(e) => handleChange('billNumber', e.target.value)}
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Add Bill Photo</label>
              <div className={styles.fileUploadBox}>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,.pdf"
                  className={styles.hiddenInput}
                  onChange={handleFileChange}
                />
                {!formData.billPhotoName ? (
                  <button
                    type="button"
                    className={styles.fileUploadBtn}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload size={14} />
                    <span>Upload Bill</span>
                  </button>
                ) : (
                  <div className={styles.filePreview}>
                    <ImageIcon size={14} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                    <span title={formData.billPhotoName}>{formData.billPhotoName}</span>
                    <button
                      type="button"
                      className={styles.removeFileBtn}
                      onClick={handleRemoveFile}
                      title="Remove bill photo"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {isUniform ? (
            <>
              {/* Uniform Row 1: Item Name & Uniform Code */}
              <div className={styles.grid2}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>
                    Uniform Item Name <span className={styles.req}>*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Security Guard Shirt (Navy Blue)"
                    className={`${styles.input} ${errors.itemName ? styles.inputError : ''}`}
                    value={formData.itemName}
                    onChange={(e) => handleChange('itemName', e.target.value)}
                  />
                  {errors.itemName && <span className={styles.errorText}>{errors.itemName}</span>}
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>
                    Uniform Code <span className={styles.req}>*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. UNI-SHT-L"
                    className={`${styles.input} ${errors.itemCode ? styles.inputError : ''}`}
                    value={formData.itemCode}
                    onChange={(e) => handleChange('itemCode', e.target.value.toUpperCase())}
                    disabled={mode === 'edit'}
                  />
                  {errors.itemCode && <span className={styles.errorText}>{errors.itemCode}</span>}
                </div>
              </div>

              {/* Uniform Row 2: Category, Size, Color */}
              <div className={styles.grid3}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Category <span className={styles.req}>*</span></label>
                  <select
                    className={styles.select}
                    value={formData.category}
                    onChange={(e) => handleChange('category', e.target.value)}
                  >
                    {UNIFORM_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Size</label>
                  <select
                    className={styles.select}
                    value={formData.size}
                    onChange={(e) => handleChange('size', e.target.value)}
                  >
                    {INVENTORY_SIZES.map((sz) => (
                      <option key={sz} value={sz}>{sz}</option>
                    ))}
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Color</label>
                  <select
                    className={styles.select}
                    value={formData.color}
                    onChange={(e) => handleChange('color', e.target.value)}
                  >
                    {INVENTORY_COLORS.map((col) => (
                      <option key={col} value={col}>{col}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Uniform Row 3: Quantity, Unit of Measurement, Brand, Purchase Rate */}
              <div className={styles.grid4}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>
                    Quantity <span className={styles.req}>*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="50"
                    className={`${styles.input} ${errors.quantity ? styles.inputError : ''}`}
                    value={formData.quantity}
                    onChange={(e) => handleChange('quantity', e.target.value)}
                    disabled={mode === 'edit'}
                  />
                  {errors.quantity && <span className={styles.errorText}>{errors.quantity}</span>}
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Unit of Measurement</label>
                  <select
                    className={styles.select}
                    value={formData.unit}
                    onChange={(e) => handleChange('unit', e.target.value)}
                  >
                    {INVENTORY_UNITS.map((u) => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Brand</label>
                  <input
                    type="text"
                    placeholder="e.g. NovaGear"
                    className={styles.input}
                    value={formData.brand}
                    onChange={(e) => handleChange('brand', e.target.value)}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>
                    Purchase Rate (₹) <span className={styles.req}>*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    placeholder="450"
                    className={`${styles.input} ${errors.purchaseRate ? styles.inputError : ''}`}
                    value={formData.purchaseRate}
                    onChange={(e) => handleChange('purchaseRate', e.target.value)}
                  />
                  {errors.purchaseRate && <span className={styles.errorText}>{errors.purchaseRate}</span>}
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Asset Row 1: Asset Item Name, Brand (Normal input), Item Identity Number */}
              <div className={styles.grid3}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>
                    Asset Item Name <span className={styles.req}>*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Motorola Walkie-Talkie Set 5W"
                    className={`${styles.input} ${errors.itemName ? styles.inputError : ''}`}
                    value={formData.itemName}
                    onChange={(e) => handleChange('itemName', e.target.value)}
                  />
                  {errors.itemName && <span className={styles.errorText}>{errors.itemName}</span>}
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Brand</label>
                  <input
                    type="text"
                    placeholder="e.g. Motorola / CP Plus / Honeywell"
                    className={styles.input}
                    value={formData.brand}
                    onChange={(e) => handleChange('brand', e.target.value)}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>
                    Item Identity Number <span className={styles.req}>*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. AST-WT-01 / EQ-TORCH-PRO"
                    className={`${styles.input} ${errors.itemCode ? styles.inputError : ''}`}
                    value={formData.itemCode}
                    onChange={(e) => handleChange('itemCode', e.target.value.toUpperCase())}
                    disabled={mode === 'edit'}
                  />
                  {errors.itemCode && <span className={styles.errorText}>{errors.itemCode}</span>}
                </div>
              </div>

              {/* Asset Row 2: Category, Quantity, Unit, Purchase Rate */}
              <div className={styles.grid4}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Category <span className={styles.req}>*</span></label>
                  <select
                    className={styles.select}
                    value={formData.category}
                    onChange={(e) => handleChange('category', e.target.value)}
                  >
                    {ASSET_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>
                    Quantity <span className={styles.req}>*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="20"
                    className={`${styles.input} ${errors.quantity ? styles.inputError : ''}`}
                    value={formData.quantity}
                    onChange={(e) => handleChange('quantity', e.target.value)}
                    disabled={mode === 'edit'}
                  />
                  {errors.quantity && <span className={styles.errorText}>{errors.quantity}</span>}
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Unit of Measurement</label>
                  <select
                    className={styles.select}
                    value={formData.unit}
                    onChange={(e) => handleChange('unit', e.target.value)}
                  >
                    {INVENTORY_UNITS.map((u) => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>
                    Purchase Rate (₹) <span className={styles.req}>*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    placeholder="1200"
                    className={`${styles.input} ${errors.purchaseRate ? styles.inputError : ''}`}
                    value={formData.purchaseRate}
                    onChange={(e) => handleChange('purchaseRate', e.target.value)}
                  />
                  {errors.purchaseRate && <span className={styles.errorText}>{errors.purchaseRate}</span>}
                </div>
              </div>

              {/* Asset Row 3: Warranty Start Date & Warranty End Date */}
              <div className={styles.grid2}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Warranty Start Date</label>
                  <input
                    type="date"
                    className={styles.input}
                    value={formData.warrantyStartDate}
                    onChange={(e) => handleChange('warrantyStartDate', e.target.value)}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Warranty End Date</label>
                  <input
                    type="date"
                    className={`${styles.input} ${errors.warrantyEndDate ? styles.inputError : ''}`}
                    value={formData.warrantyEndDate}
                    onChange={(e) => handleChange('warrantyEndDate', e.target.value)}
                  />
                  {errors.warrantyEndDate && (
                    <span className={styles.errorText}>{errors.warrantyEndDate}</span>
                  )}
                </div>
              </div>
            </>
          )}

          <div className={styles.grid2}>
            <div className={styles.formGroup}>
              <label className={styles.label}>
                Minimum Stock Alert Level <span className={styles.req}>*</span>
              </label>
              <input
                type="number"
                min="0"
                placeholder={isUniform ? '15' : '5'}
                className={`${styles.input} ${errors.minimumStock ? styles.inputError : ''}`}
                value={formData.minimumStock}
                onChange={(e) => handleChange('minimumStock', e.target.value)}
              />
              {errors.minimumStock && <span className={styles.errorText}>{errors.minimumStock}</span>}
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Master Status</label>
              <select
                className={styles.select}
                value={formData.activeStatus}
                onChange={(e) => handleChange('activeStatus', e.target.value)}
              >
                <option value="Active">Active (Available for Issue)</option>
                <option value="Inactive">Inactive (Archived)</option>
              </select>
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Specifications / Item Remarks</label>
            <textarea
              rows="2"
              placeholder={
                isUniform
                  ? 'Enter specifications, fabric blend, sizes, or washing guidelines...'
                  : 'Enter device model, serial number, warranty, or storage guidelines...'
              }
              className={styles.textarea}
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
            />
          </div>
        </form>

        {/* Footer */}
        <div className={styles.footer}>
          <button type="button" className={styles.cancelBtn} onClick={onClose}>
            Cancel
          </button>
          <button type="submit" form="inventoryItemForm" className={styles.saveBtn}>
            <Sparkles size={15} />
            <span>
              {mode === 'add'
                ? (isUniform ? 'Save Uniform Item' : 'Save Asset Item')
                : (isUniform ? 'Update Uniform Item' : 'Update Asset Item')}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
