import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  PackageOpen,
  AlertTriangle,
  CheckCircle,
  Plus,
  Trash2,
  Package,
  Layers,
  Calculator,
  Shirt,
  Shield
} from 'lucide-react';
import { mockEmployees } from '../../data/employeeData';
import styles from './InventoryIssueModal.module.css';

const UNIFORM_CATEGORIES = ['Uniform', 'Accessory', 'Other'];
const ASSET_CATEGORIES = ['Equipment', 'Security Kit', 'Safety Gear', 'ID Card', 'Other'];

export default function InventoryIssueModal({
  isOpen,
  mode = 'add', // 'add' | 'edit'
  issueType = 'uniform', // 'uniform' | 'asset'
  initialItem = null,
  initialIssue = null,
  items = [],
  employees = mockEmployees,
  onClose,
  onSave
}) {
  const [selectedEmpId, setSelectedEmpId] = useState('');
  const [issueDate, setIssueDate] = useState('2026-08-26');
  const [expectedReturnDate, setExpectedReturnDate] = useState('');
  const [issuedBy, setIssuedBy] = useState('Store Admin (Vikas)');
  const [remarks, setRemarks] = useState('');
  const [errors, setErrors] = useState({});

  // Deduction / Return Method state
  const isUniform = issueType === 'uniform';
  const [deductionMethod, setDeductionMethod] = useState(() => (issueType === 'asset' ? 'fnf' : 'salary-adjustment'));
  const [adjustmentMonth, setAdjustmentMonth] = useState('2026-09');
  const [numberOfMonths, setNumberOfMonths] = useState(3);
  const [emiAmount, setEmiAmount] = useState('');
  const [firstDeductionMonth, setFirstDeductionMonth] = useState('2026-09');

  // Multi-item rows state
  const [issueItems, setIssueItems] = useState([]);

  // Filter items based on issueType
  const availableCategoryItems = useMemo(() => {
    if (issueType === 'uniform') {
      const filtered = items.filter(
        (i) => i.category === 'Uniform' || i.category === 'Accessory' || i.category === 'Clothing'
      );
      return filtered.length > 0 ? filtered : items;
    } else if (issueType === 'asset') {
      const filtered = items.filter(
        (i) => i.category !== 'Uniform' && i.category !== 'Clothing'
      );
      return filtered.length > 0 ? filtered : items;
    }
    return items;
  }, [items, issueType]);

  useEffect(() => {
    if (employees.length > 0 && !selectedEmpId) {
      setSelectedEmpId(employees[0].employeeId);
    }
  }, [employees, selectedEmpId, isOpen]);

  // Helper to find item robustly by id, itemId, or itemCode
  const getItemByValue = (val) => {
    if (!val && val !== 0) return null;
    return items.find(
      (i) =>
        String(i.id) === String(val) ||
        String(i.itemId) === String(val) ||
        String(i.itemCode) === String(val)
    );
  };

  useEffect(() => {
    if (!isOpen) return;

    if (mode === 'edit' && initialIssue) {
      setSelectedEmpId(initialIssue.employeeId || (employees[0]?.employeeId ?? ''));
      setIssueDate(initialIssue.issueDate || '2026-08-26');
      setExpectedReturnDate(initialIssue.expectedReturnDate || '');
      setIssuedBy(initialIssue.issuedBy || 'Store Admin');
      setRemarks(initialIssue.remarks || '');
      setDeductionMethod(initialIssue.deductionMethod || (isUniform ? 'salary-adjustment' : 'fnf'));
      setAdjustmentMonth(initialIssue.adjustmentMonth || '2026-09');
      setNumberOfMonths(initialIssue.numberOfMonths || 3);
      setEmiAmount(initialIssue.emiAmount ? String(initialIssue.emiAmount) : '');
      setFirstDeductionMonth(initialIssue.firstDeductionMonth || '2026-09');

      const itm = getItemByValue(initialIssue.itemId || initialIssue.itemCode) || initialIssue;
      setIssueItems([
        {
          rowId: `row-${initialIssue.id || Date.now()}`,
          itemId: itm.id || itm.itemId || initialIssue.itemId || '',
          itemCode: itm.itemCode || itm.itemId || initialIssue.itemCode || '',
          category: itm.category || initialIssue.category || (isUniform ? 'Uniform' : 'Equipment'),
          brand: itm.brand || initialIssue.brand || '',
          condition: initialIssue.condition || 'New',
          quantity: initialIssue.quantity || 1,
          rate: initialIssue.rate || initialIssue.issueRate || itm.purchaseRate || 450
        }
      ]);
      setErrors({});
      return;
    }

    if (initialItem) {
      const itm = getItemByValue(initialItem.id || initialItem.itemId || initialItem.itemCode) || initialItem;
      setIssueItems([
        {
          rowId: `row-${Date.now()}-1`,
          itemId: itm.id || itm.itemId || '',
          itemCode: itm.itemCode || itm.itemId || '',
          category: itm.category || (isUniform ? 'Uniform' : 'Equipment'),
          brand: itm.brand || '',
          condition: 'New',
          quantity: 1,
          rate: itm.purchaseRate || 450
        }
      ]);
    } else if (availableCategoryItems.length > 0) {
      const firstAvail = availableCategoryItems.find((i) => i.availableQuantity > 0) || availableCategoryItems[0];
      setIssueItems([
        {
          rowId: `row-${Date.now()}-1`,
          itemId: firstAvail.id || firstAvail.itemId || '',
          itemCode: firstAvail.itemCode || firstAvail.itemId || '',
          category: firstAvail.category || (isUniform ? 'Uniform' : 'Equipment'),
          brand: firstAvail.brand || '',
          condition: 'New',
          quantity: 1,
          rate: firstAvail.purchaseRate || 450
        }
      ]);
    } else {
      setIssueItems([]);
    }
    setErrors({});
  }, [initialItem, initialIssue, mode, availableCategoryItems, isOpen, issueType, items, employees]);

  const selectedEmployee = useMemo(() => {
    return employees.find((e) => e.employeeId === selectedEmpId) || employees[0];
  }, [employees, selectedEmpId]);

  // Aggregate quantity needed per itemId across all rows
  const aggregatedQuantities = useMemo(() => {
    const map = {};
    issueItems.forEach((row) => {
      if (row.itemId) {
        map[row.itemId] = (map[row.itemId] || 0) + Number(row.quantity || 0);
      }
    });
    return map;
  }, [issueItems]);

  // Calculate totals
  const totalItemsCount = issueItems.length;
  const totalQuantitySum = useMemo(() => {
    return issueItems.reduce((sum, row) => sum + Number(row.quantity || 0), 0);
  }, [issueItems]);

  const grandTotalAssetValue = useMemo(() => {
    return issueItems.reduce((sum, row) => {
      const q = Number(row.quantity || 0);
      const r = Number(row.rate || 0);
      return sum + Number((q * r).toFixed(2));
    }, 0);
  }, [issueItems]);

  // Auto calculate EMI
  const autoEmi = useMemo(() => {
    const total = grandTotalAssetValue || 0;
    const months = Math.max(1, Number(numberOfMonths || 1));
    if (total <= 0) return 0;
    return Math.ceil(total / months);
  }, [grandTotalAssetValue, numberOfMonths]);

  // Update EMI amount when autoEmi or deductionMethod changes
  useEffect(() => {
    if (deductionMethod === 'monthly-emi') {
      setEmiAmount(autoEmi > 0 ? String(autoEmi) : '');
    }
  }, [autoEmi, deductionMethod]);

  if (!isOpen) return null;

  const handleAddItemRow = () => {
    const firstAvail = availableCategoryItems.find((i) => (i.availableQuantity || 0) > 0) || availableCategoryItems[0];
    const newRow = {
      rowId: `row-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      itemId: firstAvail ? (firstAvail.id || firstAvail.itemId) : '',
      itemCode: firstAvail?.itemCode || firstAvail?.itemId || '',
      category: firstAvail?.category || (issueType === 'uniform' ? 'Uniform' : 'Equipment'),
      brand: firstAvail?.brand || '',
      condition: 'New',
      quantity: 1,
      rate: firstAvail?.purchaseRate || 450
    };
    setIssueItems((prev) => [...prev, newRow]);
  };

  const handleRemoveItemRow = (rowId) => {
    if (issueItems.length <= 1) return;
    setIssueItems((prev) => prev.filter((r) => r.rowId !== rowId));
  };

  const handleRowChange = (rowId, field, value) => {
    setIssueItems((prev) =>
      prev.map((row) => {
        if (row.rowId === rowId) {
          const updated = { ...row, [field]: value };
          if (field === 'itemId') {
            const itm = getItemByValue(value);
            if (itm) {
              updated.rate = itm.purchaseRate || 0;
              updated.itemCode = itm.itemCode || itm.itemId || '';
              updated.category = itm.category || (issueType === 'uniform' ? 'Uniform' : 'Equipment');
              updated.brand = itm.brand || '';
            } else {
              updated.rate = 0;
              updated.itemCode = '';
              updated.category = '';
              updated.brand = '';
            }
          }
          return updated;
        }
        return row;
      })
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const nextErrors = {};

    if (!selectedEmpId) nextErrors.employee = 'Please select an employee.';
    if (!issueDate) nextErrors.issueDate = 'Issue date is required.';

    if (!issueItems.length) {
      nextErrors.general = `Please add at least one ${isUniform ? 'uniform' : 'asset'} item to issue.`;
    }

    let hasExceededStock = false;
    issueItems.forEach((row, idx) => {
      const itm = getItemByValue(row.itemId);
      const originalIssuedQty =
        mode === 'edit' && initialIssue && (initialIssue.itemId === row.itemId || initialIssue.itemCode === row.itemCode)
          ? Number(initialIssue.quantity || 0)
          : 0;
      const avail = (itm?.availableQuantity ?? 0) + originalIssuedQty;
      const totalRequested = aggregatedQuantities[row.itemId] || 0;

      if (!row.itemId) {
        nextErrors[`item_${row.rowId}`] = `Item selection is required for Item #${idx + 1}.`;
      }
      if (Number(row.quantity) <= 0) {
        nextErrors[`quantity_${row.rowId}`] = `Quantity must be at least 1 for Item #${idx + 1}.`;
      } else if (totalRequested > avail) {
        hasExceededStock = true;
        nextErrors[`quantity_${row.rowId}`] = `Total requested (${totalRequested}) exceeds available stock (${avail} ${itm?.unit || 'Pcs'}).`;
      }
    });

    // Deduction / Return validations
    if (isUniform) {
      const effectiveEmi = Number(emiAmount || autoEmi || 0);
      if (!deductionMethod) {
        nextErrors.deductionMethod = 'Deduction method is required.';
      } else if (deductionMethod === 'salary-adjustment') {
        if (!adjustmentMonth) nextErrors.adjustmentMonth = 'Adjustment month is required.';
      } else if (deductionMethod === 'monthly-emi') {
        if (!numberOfMonths || Number(numberOfMonths) <= 0) {
          nextErrors.numberOfMonths = 'Number of months must be at least 1.';
        }
        if (effectiveEmi <= 0 && grandTotalAssetValue > 0) {
          nextErrors.emiAmount = 'EMI amount is required.';
        }
        if (!firstDeductionMonth) {
          nextErrors.firstDeductionMonth = 'First deduction month is required.';
        }
      }
    } else {
      if (!deductionMethod) {
        nextErrors.deductionMethod = 'Return method is required.';
      }
    }

    if (Object.keys(nextErrors).length > 0 || hasExceededStock) {
      setErrors(nextErrors);
      return;
    }

    // Build payload records
    const payloads = issueItems.map((row, idx) => {
      const currentItem = getItemByValue(row.itemId) || items[0];
      const rowQty = Number(row.quantity);
      const rowRate = Number(row.rate);
      const rowTotal = Number((rowQty * rowRate).toFixed(2));
      const effectiveEmi = Number(emiAmount || autoEmi || 0);

      return {
        id: mode === 'edit' && initialIssue?.id ? initialIssue.id : `ISS-2026-${Math.floor(1000 + Math.random() * 9000)}-${idx + 1}`,
        issueDate,
        expectedReturnDate: null,
        issueType,
        employeeId: selectedEmployee.employeeId,
        employeeName: selectedEmployee.name || selectedEmployee.employeeName,
        initials: (selectedEmployee.name || selectedEmployee.employeeName || 'EM').slice(0, 2).toUpperCase(),
        clientId: selectedEmployee.companyId || (mode === 'edit' ? initialIssue?.clientId : 'c001'),
        clientName: selectedEmployee.companyName || selectedEmployee.client || (mode === 'edit' ? initialIssue?.clientName : 'ABC Security Services'),
        site: selectedEmployee.site || selectedEmployee.workLocation || (mode === 'edit' ? initialIssue?.site : 'Main Gate / Site A'),
        department: selectedEmployee.department || 'Security',
        designation: selectedEmployee.designation || 'Security Guard',
        itemId: currentItem?.itemId || currentItem?.id || row.itemId,
        itemCode: currentItem?.itemCode || currentItem?.itemId || row.itemCode || '',
        itemName: currentItem?.itemName || 'Asset Item',
        category: row.category || currentItem?.category || (isUniform ? 'Uniform' : 'Equipment'),
        brand: currentItem?.brand || row.brand || '',
        size: currentItem?.size || 'Free Size',
        color: currentItem?.color || 'Navy Blue',
        unit: currentItem?.unit || 'Pcs',
        quantity: rowQty,
        rate: rowRate,
        issueRate: rowRate,
        totalAmount: rowTotal,
        issuedBy: issuedBy.trim() || 'Store Admin',
        condition: row.condition || 'New',
        returnedQuantity: mode === 'edit' && initialIssue?.returnedQuantity !== undefined ? initialIssue.returnedQuantity : 0,
        pendingQuantity: mode === 'edit' && initialIssue?.returnedQuantity !== undefined ? Math.max(0, rowQty - initialIssue.returnedQuantity) : rowQty,
        status: mode === 'edit' && initialIssue?.status ? initialIssue.status : 'Issued',
        deductionMethod: isUniform ? deductionMethod : 'At the Date of Full & Final Settlement',
        adjustmentMonth: isUniform && deductionMethod === 'salary-adjustment' ? adjustmentMonth : null,
        emiAmount: isUniform && deductionMethod === 'monthly-emi' ? effectiveEmi : (isUniform && deductionMethod === 'salary-adjustment' ? rowTotal : 0),
        numberOfMonths: isUniform && deductionMethod === 'monthly-emi' ? Number(numberOfMonths) : 1,
        firstDeductionMonth: isUniform && deductionMethod === 'monthly-emi' ? firstDeductionMonth : null,
        remarks: remarks.trim() || `Issued for ${selectedEmployee.name || selectedEmployee.employeeName}`
      };
    });

    onSave(payloads, mode === 'edit');
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
                {mode === 'edit'
                  ? `Edit Issued Item (${initialIssue?.id || 'Record'})`
                  : (isUniform ? 'Issue Uniform Items' : 'Issue Asset Items')}
              </h2>
              <p className={styles.subtitle}>
                {mode === 'edit'
                  ? 'Modify personnel assignment, allocated quantity, rate, deduction schedule, or return dates'
                  : isUniform
                  ? 'Allocate uniform gear, shirts, trousers & attire to employee and deduct quantity from live inventory'
                  : 'Allocate company assets, electronics & security equipment to employee and deduct quantity from live inventory'}
              </p>
            </div>
          </div>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <form id="issueItemForm" onSubmit={handleSubmit} className={styles.body}>
          {/* 1. Employee Selection & Details Card */}
          <div className={styles.formGroup}>
            <label className={styles.label}>
              Select Employee <span className={styles.req}>*</span>
            </label>
            <select
              className={styles.select}
              value={selectedEmpId}
              onChange={(e) => setSelectedEmpId(e.target.value)}
            >
              {employees.map((emp) => (
                <option key={emp.employeeId} value={emp.employeeId}>
                  {emp.employeeId} — {emp.name || emp.employeeName} ({emp.designation || 'Staff'} • {emp.site || 'Site'})
                </option>
              ))}
            </select>
            {errors.employee && <span className={styles.errorText}>{errors.employee}</span>}
          </div>

          <div className={styles.grid3}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Client / Company</label>
              <input
                type="text"
                className={styles.input}
                value={selectedEmployee?.companyName || selectedEmployee?.client || 'ABC Security Services'}
                readOnly
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Work Site / Location</label>
              <input
                type="text"
                className={styles.input}
                value={selectedEmployee?.site || selectedEmployee?.workLocation || 'Main Gate / Site A'}
                readOnly
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Department / Role</label>
              <input
                type="text"
                className={styles.input}
                value={`${selectedEmployee?.department || 'Security'} • ${selectedEmployee?.designation || 'Guard'}`}
                readOnly
              />
            </div>
          </div>

          {/* 2. Issue Date & Issued By */}
          <div className={styles.grid2}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Issue Date <span className={styles.req}>*</span></label>
              <input
                type="date"
                className={`${styles.input} ${errors.issueDate ? styles.inputError : ''}`}
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
              />
              {errors.issueDate && <span className={styles.errorText}>{errors.issueDate}</span>}
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Issued By / Store Manager</label>
              <input
                type="text"
                className={styles.input}
                value={issuedBy}
                onChange={(e) => setIssuedBy(e.target.value)}
                placeholder="e.g. Vikas Sharma (Store Admin)"
              />
            </div>
          </div>

          {/* 3. Multi-Item Rows Section */}
          <div className={styles.itemsSection}>
            <div className={styles.itemsSectionHeader}>
              <span className={styles.sectionTitle}>
                <Layers size={16} style={{ color: 'var(--primary, #2563eb)' }} />
                {isUniform ? 'Uniform Items to Issue' : 'Asset Items to Issue'} ({issueItems.length})
              </span>
              {mode !== 'edit' && (
                <button
                  type="button"
                  className={styles.addItemHeaderBtn}
                  onClick={handleAddItemRow}
                >
                  <Plus size={14} />
                  <span>{isUniform ? 'Add Another Uniform' : 'Add Another Asset'}</span>
                </button>
              )}
            </div>

            {issueItems.map((row, index) => {
              const currentItem = getItemByValue(row.itemId);
              const availableStock = currentItem?.availableQuantity ?? 0;
              const rowTotal = Number((Number(row.quantity || 0) * Number(row.rate || 0)).toFixed(2));
              const isRowExceeded = (aggregatedQuantities[row.itemId] || 0) > availableStock;

              return (
                <div key={row.rowId} className={styles.itemBlock}>
                  <div className={styles.itemBlockHeader}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className={styles.itemIndexBadge}>{isUniform ? 'Uniform' : 'Asset'} #{index + 1}</span>
                      {currentItem && (
                        <span className={styles.itemStockInfo}>
                          Available: <strong>{availableStock} {currentItem.unit || 'Pcs'}</strong>
                        </span>
                      )}
                    </div>

                    {issueItems.length > 1 && (
                      <button
                        type="button"
                        className={styles.removeItemBtn}
                        onClick={() => handleRemoveItemRow(row.rowId)}
                        title="Remove this item"
                      >
                        <Trash2 size={13} />
                        <span>Remove</span>
                      </button>
                    )}
                  </div>

                  {/* Row 1: Select Item, Uniform Code / Item Identity Number, Category, and Brand */}
                  <div className={styles.grid4}>
                    <div className={styles.formGroup}>
                      <label className={styles.label}>
                        {isUniform ? 'Select Uniform Item' : 'Select Asset Item'} <span className={styles.req}>*</span>
                      </label>
                      <select
                        className={styles.select}
                        value={row.itemId}
                        onChange={(e) => handleRowChange(row.rowId, 'itemId', e.target.value)}
                      >
                        {availableCategoryItems.map((itm) => (
                          <option key={itm.id || itm.itemId} value={itm.id || itm.itemId}>
                            {itm.itemName} [{itm.itemCode || itm.itemId}] {itm.brand ? `• ${itm.brand}` : ''} (Avail: {itm.availableQuantity} {itm.unit || 'Pcs'})
                          </option>
                        ))}
                      </select>
                      {errors[`item_${row.rowId}`] && (
                        <span className={styles.errorText}>{errors[`item_${row.rowId}`]}</span>
                      )}
                    </div>

                    <div className={styles.formGroup}>
                      <label className={styles.label}>
                        {isUniform ? 'Uniform Code' : 'Item Identity Number'}
                      </label>
                      <input
                        type="text"
                        className={styles.input}
                        readOnly
                        value={currentItem?.itemCode || currentItem?.itemId || row.itemCode || ''}
                        placeholder="Auto-fetched"
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label className={styles.label}>Category</label>
                      <select
                        className={styles.select}
                        value={row.category || currentItem?.category || (isUniform ? 'Uniform' : 'Equipment')}
                        onChange={(e) => handleRowChange(row.rowId, 'category', e.target.value)}
                      >
                        {(isUniform ? UNIFORM_CATEGORIES : ASSET_CATEGORIES).map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className={styles.formGroup}>
                      <label className={styles.label}>Brand</label>
                      <input
                        type="text"
                        className={styles.input}
                        readOnly
                        value={currentItem?.brand || row.brand || ''}
                        placeholder="Auto-fetched"
                      />
                    </div>
                  </div>

                  {/* Row 2: Item Condition (Assets only), Issue Quantity, Rate per Unit & Total Value */}
                  <div className={isUniform ? styles.grid3 : styles.grid4}>
                    {!isUniform && (
                      <div className={styles.formGroup}>
                        <label className={styles.label}>Item Condition</label>
                        <select
                          className={styles.select}
                          value={row.condition}
                          onChange={(e) => handleRowChange(row.rowId, 'condition', e.target.value)}
                        >
                          <option value="New">Brand New</option>
                          <option value="Good">Good / Serviced</option>
                          <option value="Used">Used / Refurbished</option>
                        </select>
                      </div>
                    )}

                    <div className={styles.formGroup}>
                      <label className={styles.label}>
                        Issue Quantity <span className={styles.req}>*</span>
                      </label>
                      <input
                        type="number"
                        min="1"
                        max={availableStock}
                        className={`${styles.input} ${isRowExceeded || errors[`quantity_${row.rowId}`] ? styles.inputError : ''}`}
                        value={row.quantity}
                        onChange={(e) => handleRowChange(row.rowId, 'quantity', e.target.value)}
                      />
                      {errors[`quantity_${row.rowId}`] && (
                        <span className={styles.errorText}>{errors[`quantity_${row.rowId}`]}</span>
                      )}
                    </div>

                    <div className={styles.formGroup}>
                      <label className={styles.label}>Rate per Unit (₹)</label>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        className={styles.input}
                        value={row.rate}
                        onChange={(e) => handleRowChange(row.rowId, 'rate', e.target.value)}
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label className={styles.label}>Total {isUniform ? 'Uniform' : 'Asset'} Value (₹)</label>
                      <input
                        type="text"
                        className={styles.input}
                        readOnly
                        value={`₹ ${rowTotal.toLocaleString('en-IN')}`}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Grand Total Bar */}
          <div className={styles.grandTotalBar}>
            <div className={styles.grandTotalItem}>
              <span>Total {isUniform ? 'Uniforms' : 'Assets'}</span>
              <strong>{totalItemsCount} {totalItemsCount === 1 ? (isUniform ? 'Uniform' : 'Asset') : (isUniform ? 'Uniforms' : 'Assets')}</strong>
            </div>
            <div className={styles.grandTotalItem}>
              <span>Total Units</span>
              <strong>{totalQuantitySum} Units</strong>
            </div>
            <div className={styles.grandTotalItem}>
              <span>Grand Total Value</span>
              <strong style={{ color: '#1e40af', fontSize: '17px' }}>
                ₹ {grandTotalAssetValue.toLocaleString('en-IN')}
              </strong>
            </div>
          </div>

          {/* 4. Deduction & Recovery / Return Method Section */}
          <div className={styles.deductionSection}>
            <div className={styles.deductionHeader}>
              <span className={styles.sectionTitle}>
                <Calculator size={16} style={{ color: 'var(--primary, #2563eb)' }} />
                {isUniform ? 'Deduction Method' : 'Return Method'}
              </span>
            </div>

            <div className={styles.deductionCard}>
              <div className={isUniform && deductionMethod === 'salary-adjustment' ? styles.grid2 : ''}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>
                    {isUniform ? 'Deduction Method' : 'Return Method'} <span className={styles.req}>*</span>
                  </label>
                  {isUniform ? (
                    <select
                      className={styles.select}
                      value={deductionMethod}
                      onChange={(e) => {
                        const method = e.target.value;
                        setDeductionMethod(method);
                        if (method === 'monthly-emi') {
                          setEmiAmount(autoEmi > 0 ? String(autoEmi) : '');
                        }
                      }}
                    >
                      <option value="salary-adjustment">Salary Adjustment (Full in single month)</option>
                      <option value="monthly-emi">Monthly EMI (Multi-Month Installments)</option>
                      <option value="no-deduction">No Deduction (Company Provided / Free)</option>
                    </select>
                  ) : (
                    <select
                      className={styles.select}
                      value={deductionMethod}
                      onChange={(e) => setDeductionMethod(e.target.value)}
                    >
                      <option value="fnf">At the Date of Full & Final Settlement</option>
                    </select>
                  )}
                  {errors.deductionMethod && (
                    <span className={styles.errorText}>{errors.deductionMethod}</span>
                  )}
                </div>

                {isUniform && deductionMethod === 'salary-adjustment' && (
                  <div className={styles.formGroup}>
                    <label className={styles.label}>
                      Adjustment Month <span className={styles.req}>*</span>
                    </label>
                    <input
                      type="month"
                      className={`${styles.input} ${errors.adjustmentMonth ? styles.inputError : ''}`}
                      value={adjustmentMonth}
                      onChange={(e) => setAdjustmentMonth(e.target.value)}
                    />
                    {errors.adjustmentMonth && (
                      <span className={styles.errorText}>{errors.adjustmentMonth}</span>
                    )}
                  </div>
                )}

                {isUniform && deductionMethod === 'no-deduction' && (
                  <div className={styles.freeNoticeCol}>
                    <span className={styles.freeNoticeText}>
                      ✓ Items provided at zero salary deduction (Company Cost / Free Issue).
                    </span>
                  </div>
                )}

                {!isUniform && (
                  <div className={styles.freeNoticeCol} style={{ marginTop: '8px' }}>
                    <span className={styles.freeNoticeText}>
                      ✓ Asset return and physical audit will be verified at the Date of Full & Final (F&F) Settlement.
                    </span>
                  </div>
                )}
              </div>

              {deductionMethod === 'monthly-emi' && (
                <>
                  <div className={styles.grid3}>
                    <div className={styles.formGroup}>
                      <label className={styles.label}>
                        Number of Months <span className={styles.req}>*</span>
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="36"
                        className={`${styles.input} ${errors.numberOfMonths ? styles.inputError : ''}`}
                        value={numberOfMonths}
                        onChange={(e) => setNumberOfMonths(e.target.value)}
                        placeholder="e.g. 3"
                      />
                      {errors.numberOfMonths && (
                        <span className={styles.errorText}>{errors.numberOfMonths}</span>
                      )}
                    </div>

                    <div className={styles.formGroup}>
                      <label className={styles.label}>
                        EMI Amount (₹ / Month) <span className={styles.req}>*</span>
                      </label>
                      <input
                        type="number"
                        min="1"
                        className={`${styles.input} ${errors.emiAmount ? styles.inputError : ''}`}
                        value={emiAmount}
                        onChange={(e) => setEmiAmount(e.target.value)}
                        placeholder="Auto-calculated"
                      />
                      {errors.emiAmount && (
                        <span className={styles.errorText}>{errors.emiAmount}</span>
                      )}
                    </div>

                    <div className={styles.formGroup}>
                      <label className={styles.label}>
                        First Deduction Month <span className={styles.req}>*</span>
                      </label>
                      <input
                        type="month"
                        className={`${styles.input} ${errors.firstDeductionMonth ? styles.inputError : ''}`}
                        value={firstDeductionMonth}
                        onChange={(e) => setFirstDeductionMonth(e.target.value)}
                      />
                      {errors.firstDeductionMonth && (
                        <span className={styles.errorText}>{errors.firstDeductionMonth}</span>
                      )}
                    </div>
                  </div>

                  {/* Live Simulation Preview */}
                  <div className={styles.previewBox}>
                    <div className={styles.previewGrid}>
                      <div className={styles.previewItem}>
                        <span>Total {isUniform ? 'Uniform' : 'Asset'} Value</span>
                        <strong>₹ {grandTotalAssetValue.toLocaleString('en-IN')}</strong>
                      </div>
                      <div className={styles.previewItem}>
                        <span>Monthly EMI</span>
                        <strong>
                          ₹ {Number(emiAmount || autoEmi).toLocaleString('en-IN')}{' '}
                          <small>({numberOfMonths} {Number(numberOfMonths) === 1 ? 'Month' : 'Months'})</small>
                        </strong>
                      </div>
                      <div className={styles.previewItem}>
                        <span>Total Deduction</span>
                        <strong style={{ color: '#2563eb' }}>
                          ₹ {(Number(emiAmount || autoEmi) * Math.max(1, Number(numberOfMonths || 1))).toLocaleString('en-IN')}
                        </strong>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Remarks */}
          <div className={styles.formGroup}>
            <label className={styles.label}>Remarks / Acknowledgement Note</label>
            <input
              type="text"
              placeholder={
                isUniform
                  ? 'e.g. Annual uniform kit & security attire issue for Site A gate duty'
                  : 'e.g. Security gear, walkie-talkie & asset issue for Site A duty'
              }
              className={styles.input}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
            />
          </div>
        </form>

        {/* Footer */}
        <div className={styles.footer}>
          <button type="button" className={styles.cancelBtn} onClick={onClose}>
            Cancel
          </button>
          <button
            type="submit"
            form="issueItemForm"
            className={styles.saveBtn}
          >
            <CheckCircle size={15} />
            <span>
              {mode === 'edit'
                ? 'Update Issue Record'
                : isUniform
                ? `Confirm & Issue ${totalItemsCount > 1 ? `${totalItemsCount} Uniforms` : 'Uniform'}`
                : `Confirm & Issue ${totalItemsCount > 1 ? `${totalItemsCount} Assets` : 'Asset'}`}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

