import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Download, MoreVertical, Package, PackageCheck, PackageOpen, Plus,
  RotateCcw, Search, X, AlertTriangle, ShieldCheck, DollarSign,
  ArrowRightLeft, FileSpreadsheet, User, Eye, Edit3, ArrowUpRight, ShieldAlert, CheckCircle,
  Shirt, Shield, Trash2, Loader2
} from 'lucide-react';
import AdminLayout from '../../components/layout/AdminLayout';
import EmptyState from '../../components/common/EmptyState';
import Pagination from '../../components/common/Pagination';
import Toast from '../../components/common/Toast';
import {
  INVENTORY_CATEGORIES,
  INVENTORY_SIZES,
  INVENTORY_COLORS,
  INVENTORY_UNITS
} from '../../data/inventoryMasterData';
import { useCompany } from '../../context/CompanyContext';
import inventoryService from '../../services/inventoryService';

import InventoryItemModal from '../../components/inventory/InventoryItemModal';
import InventoryIssueModal from '../../components/inventory/InventoryIssueModal';
import InventoryReturnModal from '../../components/inventory/InventoryReturnModal';
import EmployeeAssetModal from '../../components/inventory/EmployeeAssetModal';
import AssetClearanceModal from '../../components/inventory/AssetClearanceModal';
import StockMovementTable from '../../components/inventory/StockMovementTable';
import InventoryReportsModal from '../../components/inventory/InventoryReportsModal';
import InventoryDetailsDrawer from '../../components/inventory/InventoryDetailsDrawer';

import styles from './Inventory.module.css';

const PAGE_SIZE = 8;

const formatDate = (value) => {
  if (!value) return '—';
  try {
    return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(`${value}T00:00:00`));
  } catch {
    return value;
  }
};

const stockStatus = (item) => {
  if (item.status === 'Inactive') return 'inactive';
  if ((item.availableQuantity ?? 0) === 0) return 'out-of-stock';
  if ((item.availableQuantity ?? 0) <= (item.minimumStock ?? 0)) return 'low-stock';
  return 'in-stock';
};

const formatStatusText = (status) => {
  switch (status) {
    case 'in-stock':
    case 'In Stock':
      return 'In Stock';
    case 'low-stock':
    case 'Low Stock':
      return 'Low Stock';
    case 'out-of-stock':
    case 'Out of Stock':
      return 'Out of Stock';
    case 'inactive':
    case 'Inactive':
      return 'Inactive';
    case 'Issued':
      return 'Issued';
    case 'Partially Returned':
      return 'Partially Returned';
    case 'Returned':
    case 'Fully Returned':
      return 'Returned';
    case 'Damaged':
      return 'Damaged';
    case 'Lost':
      return 'Lost';
    default:
      return status;
  }
};

const getStatusBadgeClass = (status) => {
  const norm = String(status).toLowerCase();
  if (norm.includes('in-stock') || norm === 'in stock' || norm === 'good' || norm === 'fully cleared' || norm === 'returned' || norm === 'fully returned') {
    return styles.inStock;
  }
  if (norm.includes('low-stock') || norm === 'low stock' || norm.includes('partial') || norm === 'partially cleared' || norm === 'damaged') {
    return styles.lowStock;
  }
  if (norm.includes('out-of-stock') || norm === 'out of stock' || norm === 'lost' || norm === 'pending' || norm === 'inactive') {
    return styles.outStock;
  }
  return styles.inStock;
};

// Summary Cards Component
function EnhancedSummaryCards({ items, issued, returns, onLowStockClick }) {
  const totalStockQty = items.reduce((sum, item) => sum + (Number(item.totalQuantity) || (Number(item.availableQuantity || 0) + Number(item.issuedQuantity || 0))), 0);
  const availableStockQty = items.reduce((sum, item) => sum + Number(item.availableQuantity || 0), 0);
  const issuedQty = issued.reduce((sum, item) => sum + (Number(item.quantity || 0) - Number(item.returnedQuantity || 0)), 0);
  const pendingReturnsCount = issued.filter((item) => (item.pendingQuantity ?? (item.quantity - (item.returnedQuantity || 0))) > 0).length;
  const lowStockCount = items.filter((item) => (item.availableQuantity || 0) <= (item.minimumStock || 0) && item.status !== 'Inactive').length;
  const totalValuation = items.reduce((sum, item) => sum + (Number(item.availableQuantity || 0) * Number(item.purchaseRate || 0)), 0);

  const cards = [
    { label: 'Total Items', value: totalStockQty, subtext: `${items.length} Master SKUs`, icon: Package, tone: styles.blue },
    { label: 'Available Stock', value: availableStockQty, subtext: 'Ready for Issue', icon: PackageCheck, tone: styles.green },
    { label: 'Issued Items', value: issuedQty, subtext: 'In Field Use', icon: PackageOpen, tone: styles.purple },
    { label: 'Pending Returns', value: pendingReturnsCount, subtext: 'Active personnel custody', icon: RotateCcw, tone: styles.orange },
    { label: 'Low Stock Items', value: lowStockCount, subtext: 'Reorder required', icon: AlertTriangle, tone: styles.orange, onClick: onLowStockClick },
    { label: 'Total Stock Value', value: `₹${(totalValuation / 1000).toFixed(1)}k`, subtext: `₹${totalValuation.toLocaleString('en-IN')}`, icon: DollarSign, tone: styles.green }
  ];

  return (
    <div className={styles.summaryGrid6}>
      {cards.map(({ label, value, subtext, icon: Icon, tone, onClick }) => (
        <div
          className={`${styles.summaryCard} ${onClick ? styles.clickableCard : ''}`}
          key={label}
          onClick={onClick}
          title={onClick ? 'Click to filter list' : undefined}
        >
          <div>
            <span className={styles.summaryLabel}>{label}</span>
            <strong className={styles.summaryNumber}>{value}</strong>
            <span className={styles.summarySubtext}>{subtext}</span>
          </div>
          <span className={`${styles.iconWrap} ${tone}`}>
            <Icon size={20} />
          </span>
        </div>
      ))}
    </div>
  );
}

// Category Summary Cards
function CategorySummary({ items, activeCategory, onSelectCategory, inventoryType = 'uniform' }) {
  const categories = inventoryType === 'uniform'
    ? ['Uniform', 'Accessory', 'Clothing']
    : ['Equipment', 'ID Card', 'Safety Gear', 'Security Kit', 'Other'];

  const rows = categories
    .map((category) => {
      const matchingItems = items.filter((item) => item.category === category);
      const total = matchingItems.reduce((sum, item) => sum + (Number(item.availableQuantity) || 0), 0);
      return { category, total, count: matchingItems.length };
    })
    .filter((row) => row.count > 0 || (inventoryType === 'uniform' ? ['Uniform', 'Accessory'].includes(row.category) : ['Equipment', 'ID Card', 'Safety Gear'].includes(row.category)));

  const max = Math.max(...rows.map((row) => row.total), 1);

  return (
    <section className={styles.categoryCard}>
      <div className={styles.sectionHeader}>
        <div>
          <h2 className={styles.sectionTitle}>
            {inventoryType === 'uniform' ? 'Uniform & Apparel Categories' : 'Asset & Equipment Categories'}
          </h2>
          <p className={styles.sectionSubtext}>
            {inventoryType === 'uniform'
              ? 'Click any uniform category to filter stock list instantly'
              : 'Click any asset category to filter equipment list instantly'}
          </p>
        </div>
        {activeCategory && (
          <button
            type="button"
            className={styles.resetPill}
            onClick={() => onSelectCategory('')}
          >
            Clear Filter: <strong>{activeCategory}</strong> ✕
          </button>
        )}
      </div>
      <div className={styles.categoryGrid}>
        {rows.map((row) => {
          const isSelected = activeCategory === row.category;
          return (
            <div
              className={`${styles.categoryItem} ${isSelected ? styles.categoryItemActive : ''}`}
              key={row.category}
              onClick={() => onSelectCategory(isSelected ? '' : row.category)}
              role="button"
              tabIndex={0}
            >
              <div>
                <strong>{row.category}</strong>
                <span>{row.total} units</span>
              </div>
              <div className={styles.progress}>
                <span style={{ width: `${Math.max((row.total / max) * 100, 10)}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// Filters Bar
function Filters({ values, setValue, onReset, inventoryType = 'uniform' }) {
  const categories = inventoryType === 'uniform'
    ? ['Uniform', 'Accessory', 'Clothing']
    : ['Equipment', 'ID Card', 'Safety Gear', 'Security Kit', 'Other'];

  return (
    <div className={styles.filterCard}>
      <div className={styles.filterGrid}>
        <div className={styles.field}>
          <label className={styles.fieldLabel}>Search Master / Register</label>
          <div className={styles.searchBox}>
            <Search size={16} />
            <input
              className={styles.input}
              value={values.search}
              onChange={(e) => setValue('search', e.target.value)}
              placeholder={inventoryType === 'uniform' ? 'Search uniform name, size, brand, code...' : 'Search asset name, serial, brand, code...'}
            />
          </div>
        </div>

        <div className={styles.field}>
          <label className={styles.fieldLabel}>Category</label>
          <select
            className={styles.select}
            value={values.category}
            onChange={(e) => setValue('category', e.target.value)}
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {inventoryType === 'uniform' && (
          <div className={styles.field}>
            <label className={styles.fieldLabel}>Size Filter</label>
            <select
              className={styles.select}
              value={values.size}
              onChange={(e) => setValue('size', e.target.value)}
            >
              <option value="">All Sizes</option>
              {INVENTORY_SIZES.map((sz) => (
                <option key={sz} value={sz}>
                  {sz}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className={styles.field}>
          <label className={styles.fieldLabel}>Stock Status</label>
          <select
            className={styles.select}
            value={values.status}
            onChange={(e) => setValue('status', e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="in-stock">In Stock</option>
            <option value="low-stock">Low Stock Alert</option>
            <option value="out-of-stock">Out of Stock</option>
            <option value="inactive">Inactive Master</option>
          </select>
        </div>

        <button type="button" className={styles.resetButton} onClick={onReset}>
          Reset Filters
        </button>
      </div>
    </div>
  );
}

function DeleteItemConfirmModal({ isOpen, item, isDeleting, onClose, onConfirm }) {
  if (!isOpen || !item) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.45)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1060,
        padding: 16
      }}
      role="dialog"
      aria-modal="true"
    >
      <div
        style={{
          background: 'var(--surface, #ffffff)',
          borderRadius: 14,
          padding: '24px',
          maxWidth: 440,
          width: '100%',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          border: '1px solid var(--border-color, #e2e8f0)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: '50%',
              background: '#fef2f2',
              color: '#ef4444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Trash2 size={22} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 600, color: 'var(--text-main, #0f172a)' }}>
              Delete Inventory Item
            </h3>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted, #64748b)' }}>
              Permanent database deletion
            </p>
          </div>
        </div>

        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary, #334155)', lineHeight: 1.5, marginBottom: 20 }}>
          Are you sure you want to delete <strong>"{item.itemName}"</strong> ({item.itemCode || item.itemId}) from the database? This action cannot be undone.
        </p>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              border: '1px solid var(--border-color, #e2e8f0)',
              background: '#fff',
              color: 'var(--text-main, #334155)',
              fontWeight: 500,
              cursor: isDeleting ? 'not-allowed' : 'pointer'
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            style={{
              padding: '8px 18px',
              borderRadius: 8,
              border: 'none',
              background: '#ef4444',
              color: '#fff',
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              cursor: isDeleting ? 'not-allowed' : 'pointer'
            }}
          >
            {isDeleting && <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />}
            {isDeleting ? 'Deleting...' : 'Delete Master Item'}
          </button>
        </div>
      </div>
    </div>
  );
}

// 1. Enhanced Stock Table
function StockTable({ rows, onView, onEdit, onIssue, onToggleStatus, onDelete, inventoryType = 'uniform' }) {
  const [openMenuId, setOpenMenuId] = useState(null);
  const isUniform = inventoryType === 'uniform';

  return (
    <div className={styles.tableCard}>
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            {isUniform ? (
              <tr>
                <th>Uniform Code</th>
                <th>Uniform Item Name</th>
                <th>Category</th>
                <th>Size</th>
                <th>Color</th>
                <th>Unit & Brand</th>
                <th>Opening Qty</th>
                <th>Available Stock</th>
                <th>Issued</th>
                <th>Returned</th>
                <th>Min. Stock</th>
                <th>Purchase Rate</th>
                <th>Stock Value</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            ) : (
              <tr>
                <th>Item Identity No.</th>
                <th>Asset Item Name</th>
                <th>Brand</th>
                <th>Category</th>
                <th>Unit</th>
                <th>Opening Qty</th>
                <th>Available Stock</th>
                <th>Issued</th>
                <th>Returned</th>
                <th>Min. Stock</th>
                <th>Purchase Rate</th>
                <th>Stock Value</th>
                <th>Warranty Period</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            )}
          </thead>
          <tbody>
            {rows.map((item) => {
              const status = stockStatus(item);
              const currentStock = Number(item.availableQuantity ?? 0);
              const rate = Number(item.purchaseRate ?? 0);
              const stockValue = currentStock * rate;
              const isLow = currentStock <= (item.minimumStock ?? 0);
              const opening = item.openingStock ?? item.totalQuantity ?? item.quantity ?? 0;

              return (
                <tr key={item.id || item.itemId}>
                  <td className={styles.codeCell}>{item.itemCode || item.itemId}</td>
                  <td>
                    <div className={styles.itemCell}>
                      <span className={styles.itemIcon}>
                        {isUniform ? <Shirt size={16} /> : <Shield size={16} />}
                      </span>
                      <div>
                        <strong>{item.itemName}</strong>
                        {item.billNumber && <span className={styles.cellSub}>Bill: {item.billNumber}</span>}
                      </div>
                    </div>
                  </td>

                  {isUniform ? (
                    <>
                      <td>
                        <span className={styles.categoryBadge}>{item.category}</span>
                      </td>
                      <td>
                        <span className={styles.sizeTag}>{item.size || 'Free Size'}</span>
                      </td>
                      <td>
                        {item.color ? <span className={styles.colorTag}>{item.color}</span> : '—'}
                      </td>
                      <td>
                        <span className={styles.unitBrand}>
                          {item.unit || 'Pcs'} • {item.brand || 'NovaGear'}
                        </span>
                      </td>
                    </>
                  ) : (
                    <>
                      <td>
                        <strong>{item.brand || '—'}</strong>
                      </td>
                      <td>
                        <span className={styles.categoryBadge}>{item.category}</span>
                      </td>
                      <td>
                        <span className={styles.unitBrand}>{item.unit || 'Pcs'}</span>
                      </td>
                    </>
                  )}

                  <td>{opening} {item.unit || 'Pcs'}</td>
                  <td>
                    <strong className={isLow ? styles.textDanger : styles.available}>
                      {currentStock} {item.unit || 'Pcs'}
                    </strong>
                  </td>
                  <td>{item.issuedQuantity ?? 0}</td>
                  <td>{item.returnedQuantity ?? 0}</td>
                  <td>{item.minimumStock ?? 0}</td>
                  <td>₹{rate}</td>
                  <td>
                    <strong>₹{stockValue.toLocaleString('en-IN')}</strong>
                  </td>

                  {!isUniform && (
                    <td>
                      {item.warrantyStartDate || item.warrantyEndDate ? (
                        <div className={styles.warrantyCell}>
                          <span>{formatDate(item.warrantyStartDate)} to</span>
                          <small>{formatDate(item.warrantyEndDate)}</small>
                        </div>
                      ) : (
                        <span className={styles.cellMuted}>N/A</span>
                      )}
                    </td>
                  )}

                  <td>
                    <span className={`${styles.statusBadge} ${getStatusBadgeClass(status)}`}>
                      {formatStatusText(status)}
                    </span>
                  </td>
                  <td className={styles.actionCell}>
                    <button
                      type="button"
                      className={styles.iconButton}
                      aria-label="Open actions"
                      onClick={() => setOpenMenuId(openMenuId === (item.id || item.itemId) ? null : (item.id || item.itemId))}
                    >
                      <MoreVertical size={17} />
                    </button>
                    {openMenuId === (item.id || item.itemId) && (
                      <div className={styles.actionMenu}>
                        <button
                          type="button"
                          onClick={() => {
                            onView(item);
                            setOpenMenuId(null);
                          }}
                        >
                          <Eye size={14} style={{ marginRight: 6 }} /> View Stock Details
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            onEdit(item);
                            setOpenMenuId(null);
                          }}
                        >
                          <Edit3 size={14} style={{ marginRight: 6 }} /> Edit Item Master
                        </button>
                        {currentStock > 0 && (
                          <button
                            type="button"
                            onClick={() => {
                              onIssue(item);
                              setOpenMenuId(null);
                            }}
                          >
                            <ArrowUpRight size={14} style={{ marginRight: 6 }} /> Issue to Employee
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            onToggleStatus(item);
                            setOpenMenuId(null);
                          }}
                        >
                          {item.status === 'Inactive' ? 'Activate Item' : 'Deactivate Item'}
                        </button>
                        {onDelete && (
                          <button
                            type="button"
                            style={{ color: '#ef4444' }}
                            onClick={() => {
                              onDelete(item);
                              setOpenMenuId(null);
                            }}
                          >
                            <Trash2 size={14} style={{ marginRight: 6 }} /> Delete Item Master
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}


// 2. Enhanced Issued Items Register Table
function IssuedTable({ rows, onViewEmployee, onReturn, onEdit, onDelete, onReceipt }) {
  const [openMenuId, setOpenMenuId] = useState(null);

  return (
    <div className={styles.tableCard}>
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Issue ID</th>
              <th>Employee Code & Name</th>
              <th>Client</th>
              <th>Site / Location</th>
              <th>Item & Category</th>
              <th>Size</th>
              <th>Quantity</th>
              <th>Issue Date</th>
              <th>Rate (₹)</th>
              <th>Total Amount</th>
              <th>Issued By</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((item) => {
              const pending = item.pendingQuantity ?? (item.quantity - (item.returnedQuantity || 0));
              const totalAmount = item.totalAmount ?? ((item.quantity || 1) * (item.rate || item.issueRate || 450));

              return (
                <tr key={item.id}>
                  <td className={styles.codeCell}>{item.id}</td>
                  <td>
                    <div
                      className={styles.employeeCell}
                      onClick={() => onViewEmployee(item)}
                      role="button"
                      style={{ cursor: 'pointer' }}
                      title="Click to view Employee Asset Profile"
                    >
                      <span className={styles.avatar}>{item.initials || 'EM'}</span>
                      <div>
                        <strong className={styles.empLink}>{item.employeeName}</strong>
                        <small className={styles.block}>{item.employeeId}</small>
                      </div>
                    </div>
                  </td>
                  <td>{item.clientName || 'ABC Security'}</td>
                  <td>{item.site || 'Site A'}</td>
                  <td>
                    <div className={styles.itemName}>{item.itemName}</div>
                    <span className={styles.categoryBadge}>{item.category}</span>
                  </td>
                  <td>
                    <span className={styles.sizeTag}>{item.size || 'Free Size'}</span>
                  </td>
                  <td>
                    <strong>{item.quantity}</strong>
                    {pending > 0 && <span className={styles.pendingHint}>({pending} pend)</span>}
                  </td>
                  <td>{formatDate(item.issueDate)}</td>
                  <td>₹{item.rate || item.issueRate || 450}</td>
                  <td>
                    <strong>₹{totalAmount.toLocaleString('en-IN')}</strong>
                  </td>
                  <td>
                    <span className={styles.cellSub}>{item.issuedBy || 'Store Admin'}</span>
                  </td>
                  <td>
                    <span className={`${styles.statusBadge} ${getStatusBadgeClass(item.status)}`}>
                      {item.status}
                    </span>
                  </td>
                  <td className={styles.actionCell}>
                    <button
                      type="button"
                      className={styles.iconButton}
                      aria-label="Open actions"
                      onClick={() => setOpenMenuId(openMenuId === item.id ? null : item.id)}
                    >
                      <MoreVertical size={17} />
                    </button>
                    {openMenuId === item.id && (
                      <div className={styles.actionMenu}>
                        <button
                          type="button"
                          onClick={() => {
                            onEdit(item);
                            setOpenMenuId(null);
                          }}
                        >
                          <Edit3 size={14} style={{ marginRight: 6 }} /> Edit Issue Record
                        </button>
                        {pending > 0 && (
                          <button
                            type="button"
                            onClick={() => {
                              onReturn(item);
                              setOpenMenuId(null);
                            }}
                          >
                            <RotateCcw size={14} style={{ marginRight: 6 }} /> Return Item to Stock
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            onViewEmployee(item);
                            setOpenMenuId(null);
                          }}
                        >
                          <User size={14} style={{ marginRight: 6 }} /> View Employee Assets
                        </button>
                        <button
                          type="button"
                          style={{ color: 'var(--danger, #dc2626)' }}
                          onClick={() => {
                            onDelete(item);
                            setOpenMenuId(null);
                          }}
                        >
                          <Trash2 size={14} style={{ marginRight: 6, color: 'var(--danger, #dc2626)' }} /> Delete Issue Record
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// 3. Enhanced Return History Table
function ReturnTable({ rows }) {
  return (
    <div className={styles.tableCard}>
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Return ID</th>
              <th>Issue Ref</th>
              <th>Employee</th>
              <th>Item & Category</th>
              <th>Size</th>
              <th>Returned Qty</th>
              <th>Return Date</th>
              <th>Condition Assessment</th>
              <th>Total Value</th>
              <th>Returned / Received By</th>
              <th>Remarks</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((item) => (
              <tr key={item.id}>
                <td className={styles.codeCell}>{item.id}</td>
                <td className={styles.refCode}>{item.issueId || 'ISS-REF'}</td>
                <td>
                  <strong>{item.employeeName}</strong>
                  <small className={styles.block}>{item.employeeId}</small>
                </td>
                <td>
                  <div>{item.itemName}</div>
                  <span className={styles.categoryBadge}>{item.category}</span>
                </td>
                <td>
                  <span className={styles.sizeTag}>{item.size || 'Free Size'}</span>
                </td>
                <td>
                  <strong>{item.returnedQuantity || item.quantity}</strong>
                </td>
                <td>{formatDate(item.returnDate)}</td>
                <td>
                  <span className={`${styles.statusBadge} ${getStatusBadgeClass(item.condition)}`}>
                    {item.condition}
                  </span>
                </td>
                <td>₹{(item.totalReturnValue || (item.returnedQuantity * (item.returnValue || 450))).toLocaleString('en-IN')}</td>
                <td>
                  <span className={styles.cellSub}>{item.returnedBy || item.receivedBy || 'Admin'}</span>
                </td>
                <td className={styles.remarksCell}>{item.remarks || 'Returned'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// 4. Employee Exit Clearance Register Table
function ClearanceTable({ rows, onInspectClearance }) {
  return (
    <div className={styles.tableCard}>
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Clearance Ref</th>
              <th>Employee</th>
              <th>Designation</th>
              <th>Client / Site</th>
              <th>Exit Date</th>
              <th>Assigned Items</th>
              <th>Pending Returns</th>
              <th>Clearance Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => {
              const pendingCount = c.assignedAssets.reduce((sum, a) => sum + (a.pendingQty || 0), 0);
              return (
                <tr key={c.id}>
                  <td className={styles.codeCell}>{c.id}</td>
                  <td>
                    <strong>{c.employeeName}</strong>
                    <small className={styles.block}>{c.employeeId}</small>
                  </td>
                  <td>{c.designation}</td>
                  <td>
                    {c.clientName} ({c.site})
                  </td>
                  <td>{formatDate(c.exitDate)}</td>
                  <td>{c.assignedAssets.length} item types</td>
                  <td>
                    {pendingCount > 0 ? (
                      <span className={styles.pendingTag}>{pendingCount} items pending</span>
                    ) : (
                      <span className={styles.clearedTag}>All Cleared</span>
                    )}
                  </td>
                  <td>
                    <span className={`${styles.statusBadge} ${getStatusBadgeClass(c.clearanceStatus)}`}>
                      {c.clearanceStatus}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      type="button"
                      className={styles.smallActionPrimary}
                      onClick={() => onInspectClearance(c)}
                    >
                      Audit & Clearance
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Main Inventory Component
export default function Inventory() {
  const { activeCompany } = useCompany();
  const companyId = activeCompany?.companyId || activeCompany?.id || activeCompany?._id;

  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [issued, setIssued] = useState([]);
  const [returns, setReturns] = useState([]);
  const [movements, setMovements] = useState([]);
  const [clearances, setClearances] = useState([]);
  const [employees, setEmployees] = useState([]);

  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Navigation & filter state
  const initialTab = searchParams.get('tab') || 'stock';
  const [tab, setTab] = useState(initialTab); // 'stock' | 'issued' | 'returns' | 'movement' | 'clearance'
  const [inventoryType, setInventoryType] = useState('uniform'); // 'uniform' | 'asset'

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && ['stock', 'issued', 'returns', 'movement', 'clearance'].includes(tabParam)) {
      setTab(tabParam);
    } else {
      setTab('stock');
    }
  }, [searchParams]);

  const [filters, setFilters] = useState({ search: '', category: '', size: '', status: '' });
  const [page, setPage] = useState(1);
  const [toast, setToast] = useState(null);

  // Modal / Drawer states
  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [itemModalType, setItemModalType] = useState('uniform'); // 'uniform' | 'asset'
  const [editItem, setEditItem] = useState(null);
  const [isSavingItem, setIsSavingItem] = useState(false);

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [isDeletingItem, setIsDeletingItem] = useState(false);

  const [issueModalOpen, setIssueModalOpen] = useState(false);
  const [issueType, setIssueType] = useState('uniform'); // 'uniform' | 'asset'
  const [issueTargetItem, setIssueTargetItem] = useState(null);
  const [editIssue, setEditIssue] = useState(null);
  const [isSavingIssue, setIsSavingIssue] = useState(false);

  const [returnModalOpen, setReturnModalOpen] = useState(false);
  const [returnTargetIssue, setReturnTargetIssue] = useState(null);
  const [isSavingReturn, setIsSavingReturn] = useState(false);

  const [employeeAssetModalOpen, setEmployeeAssetModalOpen] = useState(false);
  const [selectedEmployeeForAssets, setSelectedEmployeeForAssets] = useState(null);

  const [clearanceModalOpen, setClearanceModalOpen] = useState(false);
  const [selectedClearanceRecord, setSelectedClearanceRecord] = useState(null);
  const [isApprovingClearance, setIsApprovingClearance] = useState(false);

  const [reportsModalOpen, setReportsModalOpen] = useState(false);

  const [detailsDrawerOpen, setDetailsDrawerOpen] = useState(false);
  const [drawerTargetItem, setDrawerTargetItem] = useState(null);

  const notify = (message, type = 'success') => setToast({ message, type });

  // Fetch all inventory data from MongoDB backend API
  const fetchInventoryData = useCallback(async () => {
    try {
      setLoading(true);
      const [itemsRes, issuedRes, returnsRes, movementsRes, clearancesRes, empRes] = await Promise.all([
        inventoryService.getItems(companyId),
        inventoryService.getIssuedItems(companyId),
        inventoryService.getReturnRecords(companyId),
        inventoryService.getMovements(companyId),
        inventoryService.getClearances(companyId),
        inventoryService.getEmployees(companyId)
      ]);
      setItems(itemsRes);
      setIssued(issuedRes);
      setReturns(returnsRes);
      setMovements(movementsRes);
      setClearances(clearancesRes);
      setEmployees(empRes || []);
    } catch (err) {
      console.error('Failed to load inventory data:', err);
      notify(err.message || 'Failed to load inventory from server', 'danger');
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    fetchInventoryData();
  }, [fetchInventoryData]);

  const setFilter = (key, value) => {
    setPage(1);
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const resetFilters = () => {
    setPage(1);
    setFilters({ search: '', category: '', size: '', status: '' });
  };

  const isUniformItem = (item) => {
    if (!item) return false;
    if (item.itemType === 'uniform') return true;
    if (item.itemType === 'asset') return false;
    const cat = (item.category || '').toLowerCase().trim();
    const code = (item.itemCode || item.itemId || item.id || '').toLowerCase();
    if (code.startsWith('uni-') || code.startsWith('acc-')) return true;
    if (code.startsWith('eqp-') || code.startsWith('idc-') || code.startsWith('saf-') || code.startsWith('sec-')) return false;
    return cat === 'uniform' || cat === 'accessory' || cat === 'clothing' || cat.includes('uniform');
  };

  const isAssetItem = (item) => !isUniformItem(item);

  const uniformItemsCount = useMemo(() => items.filter(isUniformItem).length, [items]);
  const assetItemsCount = useMemo(() => items.filter(isAssetItem).length, [items]);

  // Partitioned datasets based on inventoryType
  const currentBaseItems = useMemo(() => {
    return items.filter((i) => (inventoryType === 'uniform' ? isUniformItem(i) : isAssetItem(i)));
  }, [items, inventoryType]);

  const currentBaseIssued = useMemo(() => {
    return issued.filter((i) => (inventoryType === 'uniform' ? isUniformItem(i) : isAssetItem(i)));
  }, [issued, inventoryType]);

  const currentBaseReturns = useMemo(() => {
    return returns.filter((i) => (inventoryType === 'uniform' ? isUniformItem(i) : isAssetItem(i)));
  }, [returns, inventoryType]);

  // Filtered Stock rows
  const filteredStock = useMemo(() => {
    return currentBaseItems.filter((item) => {
      const q = filters.search.toLowerCase().trim();
      if (q && !`${item.itemName} ${item.itemCode || item.itemId} ${item.category} ${item.brand}`.toLowerCase().includes(q)) {
        return false;
      }
      if (filters.category && item.category !== filters.category) return false;
      if (filters.size && item.size !== filters.size) return false;
      if (filters.status && stockStatus(item) !== filters.status) return false;
      return true;
    });
  }, [currentBaseItems, filters]);

  // Filtered Issued rows
  const filteredIssued = useMemo(() => {
    return currentBaseIssued.filter((item) => {
      const q = filters.search.toLowerCase().trim();
      if (q && !`${item.employeeName} ${item.employeeId} ${item.itemName} ${item.id} ${item.clientName}`.toLowerCase().includes(q)) {
        return false;
      }
      if (filters.category && item.category !== filters.category) return false;
      return true;
    });
  }, [currentBaseIssued, filters]);

  // Filtered Return rows
  const filteredReturns = useMemo(() => {
    return currentBaseReturns.filter((item) => {
      const q = filters.search.toLowerCase().trim();
      if (q && !`${item.employeeName} ${item.employeeId} ${item.itemName} ${item.id}`.toLowerCase().includes(q)) {
        return false;
      }
      if (filters.category && item.category !== filters.category) return false;
      return true;
    });
  }, [currentBaseReturns, filters]);

  // Active rows & pagination
  const activeRows = tab === 'stock' ? filteredStock : tab === 'issued' ? filteredIssued : tab === 'returns' ? filteredReturns : clearances;
  const pageRows = activeRows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // 1. Save or Update Item Master in Backend
  const handleSaveItemMaster = async (itemData) => {
    if (isSavingItem) return;
    try {
      setIsSavingItem(true);
      if (editItem) {
        await inventoryService.updateItem(companyId, editItem.id || editItem.itemId, itemData);
        notify(`✓ Item "${itemData.itemName}" updated successfully.`);
      } else {
        await inventoryService.createItem(companyId, itemData);
        notify(`✓ New inventory item "${itemData.itemName}" created with ${itemData.openingStock || 0} initial stock.`);
      }
      setItemModalOpen(false);
      setEditItem(null);
      await fetchInventoryData();
    } catch (err) {
      notify(err.message || 'Failed to save item master', 'danger');
    } finally {
      setIsSavingItem(false);
    }
  };

  // Toggle active/inactive in Backend
  const handleToggleItemStatus = async (item) => {
    try {
      const res = await inventoryService.toggleItemStatus(companyId, item.id || item.itemId);
      notify(res.message || `Item status updated.`);
      await fetchInventoryData();
    } catch (err) {
      notify(err.message || 'Failed to toggle item status', 'danger');
    }
  };

  // Delete Item Master in Backend
  const handleDeleteItemMaster = (item) => {
    setItemToDelete(item);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDeleteItem = async () => {
    if (!itemToDelete || isDeletingItem) return;
    try {
      setIsDeletingItem(true);
      await inventoryService.deleteItem(companyId, itemToDelete.id || itemToDelete.itemId);
      notify(`✓ Inventory item "${itemToDelete.itemName}" deleted successfully.`);
      setDeleteConfirmOpen(false);
      setItemToDelete(null);
      await fetchInventoryData();
    } catch (err) {
      notify(err.message || 'Failed to delete item', 'danger');
    } finally {
      setIsDeletingItem(false);
    }
  };

  // 2. Handle Issue Item Out (Create or Edit in Backend)
  const handleSaveIssue = async (issuePayloadOrList, isEdit = false) => {
    if (isSavingIssue) return;
    const list = Array.isArray(issuePayloadOrList) ? issuePayloadOrList : [issuePayloadOrList];
    if (!list.length) return;

    try {
      setIsSavingIssue(true);
      if (isEdit || editIssue) {
        const issuePayload = list[0];
        await inventoryService.updateIssuedItem(companyId, editIssue?.id || issuePayload.id, issuePayload);
        notify(`✓ Issue record "${editIssue?.id || issuePayload.id}" updated successfully.`);
      } else {
        await inventoryService.issueItems(companyId, list);
        if (list.length === 1) {
          notify(`✓ Issued ${list[0].quantity} ${list[0].unit || 'Pcs'} of ${list[0].itemName} to ${list[0].employeeName}.`);
        } else {
          notify(`✓ Successfully issued ${list.length} items to ${list[0].employeeName}.`);
        }
      }
      setIssueModalOpen(false);
      setEditIssue(null);
      await fetchInventoryData();
    } catch (err) {
      notify(err.message || 'Failed to issue inventory items', 'danger');
    } finally {
      setIsSavingIssue(false);
    }
  };

  // Delete Issue Record and restore stock in Backend
  const handleDeleteIssue = async (issueItem) => {
    const isConfirmed = window.confirm(
      `Are you sure you want to delete issue record "${issueItem.id}" for ${issueItem.employeeName}?\n\nThe issued quantity (${issueItem.quantity}) will be restored back to available stock.`
    );
    if (!isConfirmed) return;

    try {
      const res = await inventoryService.deleteIssuedItem(companyId, issueItem.id);
      notify(res.message || `✓ Issue record "${issueItem.id}" deleted.`);
      await fetchInventoryData();
    } catch (err) {
      notify(err.message || 'Failed to delete issue record', 'danger');
    }
  };

  // 3. Handle Return Item In in Backend
  const handleSaveReturn = async (returnPayload) => {
    if (isSavingReturn) return;
    try {
      setIsSavingReturn(true);
      const res = await inventoryService.processReturn(companyId, returnPayload);
      notify(res.message || '✓ Return processed successfully.');
      setReturnModalOpen(false);
      setReturnTargetIssue(null);
      await fetchInventoryData();
    } catch (err) {
      notify(err.message || 'Failed to process return', 'danger');
    } finally {
      setIsSavingReturn(false);
    }
  };

  // 4. Handle Employee Exit Clearance approval in Backend
  const handleApproveClearance = async (clearedData) => {
    if (isApprovingClearance) return;
    try {
      setIsApprovingClearance(true);
      const res = await inventoryService.approveClearance(companyId, clearedData.id, clearedData);
      notify(res.message || `✓ Exit clearance signed off for ${clearedData.employeeName}.`);
      setClearanceModalOpen(false);
      setSelectedClearanceRecord(null);
      await fetchInventoryData();
    } catch (err) {
      notify(err.message || 'Failed to approve clearance', 'danger');
    } finally {
      setIsApprovingClearance(false);
    }
  };


  return (
    <AdminLayout>
      <div className={styles.container}>
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}

        {/* Breadcrumb */}
        <div className={styles.breadcrumb} role="navigation" aria-label="Breadcrumb">
          <button
            type="button"
            style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'var(--primary)', font: 'inherit' }}
            onClick={() => navigate('/admin/dashboard')}
          >
            Dashboard
          </button>
          <span>/</span>
          <strong>
            {tab === 'issued' ? 'Issued Items' : tab === 'returns' ? 'Return History' : tab === 'movement' ? 'Stock Movements' : tab === 'clearance' ? 'Asset Exit Clearance' : 'Inventory Stock'}
          </strong>
        </div>

        {/* Page Header */}
        <header className={styles.pageHeader}>
          <div>
            <h1>
              {tab === 'issued' ? 'Uniform & Asset Issue Register' : tab === 'returns' ? 'Uniform & Asset Return History' : tab === 'movement' ? 'Stock Movement & Audit Trail' : tab === 'clearance' ? 'Employee Exit Asset Clearance' : 'Inventory Management'}
            </h1>
            <p>
              {tab === 'issued' ? 'Track issued uniform sets, safety gear, and assigned equipment to field personnel.' : tab === 'returns' ? 'Uniform inspection logs, returned condition grading, and recovery charges.' : tab === 'movement' ? 'Detailed inbound, outbound, opening balance, and adjustment transaction audit logs.' : tab === 'clearance' ? 'Separating employee no-due asset recovery, handover approvals, and clearance certificates.' : 'Stock registers, uniform issues, return inspection & exit clearance'}
            </p>
          </div>
          <div className={styles.headerActions}>
            {tab === 'stock' && (
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={() => {
                  setDrawerTargetItem(currentBaseItems[0] || items[0]);
                  setDetailsDrawerOpen(true);
                }}
              >
                <Package size={16} /> View Stock
              </button>
            )}
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={() => setReportsModalOpen(true)}
            >
              <FileSpreadsheet size={16} /> Export Report
            </button>
            {tab === 'stock' && (
              inventoryType === 'uniform' ? (
                <button
                  type="button"
                  className={styles.primaryButton}
                  onClick={() => {
                    setItemModalType('uniform');
                    setEditItem(null);
                    setItemModalOpen(true);
                  }}
                >
                  <Plus size={16} /> Add Uniform
                </button>
              ) : (
                <button
                  type="button"
                  className={styles.primaryButton}
                  onClick={() => {
                    setItemModalType('asset');
                    setEditItem(null);
                    setItemModalOpen(true);
                  }}
                >
                  <Plus size={16} /> Add Asset
                </button>
              )
            )}
          </div>
        </header>

        {/* Sub-tabs Switcher: Uniform vs Asset */}
        {(tab === 'stock' || tab === 'issued' || tab === 'returns') && (
          <div className={styles.typeSwitcherCard}>
            <div className={styles.subTabs}>
              <button
                type="button"
                className={inventoryType === 'uniform' ? styles.subTabActive : styles.subTab}
                onClick={() => {
                  setInventoryType('uniform');
                  setPage(1);
                  setFilters((prev) => ({ ...prev, category: '', size: '' }));
                }}
              >
                <Shirt size={16} />
                <span>Uniforms ({uniformItemsCount})</span>
              </button>
              <button
                type="button"
                className={inventoryType === 'asset' ? styles.subTabActive : styles.subTab}
                onClick={() => {
                  setInventoryType('asset');
                  setPage(1);
                  setFilters((prev) => ({ ...prev, category: '', size: '' }));
                }}
              >
                <Shield size={16} />
                <span>Assets ({assetItemsCount})</span>
              </button>
            </div>
          </div>
        )}

        {/* 6 Responsive Summary KPIs */}
        <EnhancedSummaryCards
          items={currentBaseItems}
          issued={currentBaseIssued}
          returns={currentBaseReturns}
          onLowStockClick={() => {
            setTab('stock');
            setFilter('status', 'low-stock');
          }}
        />

        {/* Dynamic Interactive Category Cards */}
        {tab === 'stock' && (
          <CategorySummary
            items={currentBaseItems}
            activeCategory={filters.category}
            onSelectCategory={(cat) => setFilter('category', cat)}
            inventoryType={inventoryType}
          />
        )}

        {/* Section Header with Quick Actions */}
        <section className={styles.sectionIntro}>
          <div>
            <h2 className={styles.sectionTitle}>
              {tab === 'stock'
                ? (inventoryType === 'uniform' ? 'Uniform Stock Register' : 'Asset Stock Register')
                : tab === 'issued'
                  ? (inventoryType === 'uniform' ? 'Uniform Issue Register' : 'Asset Issue Register')
                  : tab === 'returns'
                    ? (inventoryType === 'uniform' ? 'Uniform Return History' : 'Asset Return History')
                    : tab === 'movement'
                      ? 'Stock Movement & Audit Trail'
                      : 'Employee Exit Asset Clearance'}
            </h2>
            <p className={styles.sectionSubtext}>
              {tab === 'stock'
                ? (inventoryType === 'uniform'
                  ? 'Real-time uniform stock valuation, unit metrics, sizes, reorder levels, and SKU actions.'
                  : 'Real-time company asset valuation, equipment tracking, reorder levels, and SKU actions.')
                : tab === 'issued'
                  ? (inventoryType === 'uniform'
                    ? 'Personnel uniform custody, issue rates, sizes, total amounts, and pending return tracking.'
                    : 'Personnel asset & equipment custody, issue rates, serial numbers, and pending return tracking.')
                  : tab === 'returns'
                    ? (inventoryType === 'uniform'
                      ? 'Uniform return inspection logs, returned condition grading, and recovery charges.'
                      : 'Asset return inspection logs, returned condition grading, and recovery charges.')
                    : tab === 'movement'
                      ? 'Complete chronological ledger of all inward, outward, and adjustment movements.'
                      : 'Mandatory asset verification and clearance certificate sign-off for exiting personnel.'}
            </p>
          </div>
          <div className={styles.introActions}>
            {tab === 'stock' && (
              inventoryType === 'uniform' ? (
                <button
                  type="button"
                  className={styles.primaryButton}
                  onClick={() => {
                    setIssueType('uniform');
                    const firstUniform = currentBaseItems.find((i) => (i.availableQuantity || 0) > 0) || currentBaseItems[0] || items[0];
                    setIssueTargetItem(firstUniform);
                    setIssueModalOpen(true);
                  }}
                >
                  <Shirt size={16} /> Issue Uniform
                </button>
              ) : (
                <button
                  type="button"
                  className={styles.primaryButton}
                  onClick={() => {
                    setIssueType('asset');
                    const firstAsset = currentBaseItems.find((i) => (i.availableQuantity || 0) > 0) || currentBaseItems[0] || items[0];
                    setIssueTargetItem(firstAsset);
                    setIssueModalOpen(true);
                  }}
                >
                  <Shield size={16} /> Issue Asset
                </button>
              )
            )}
            {tab === 'issued' && (
              inventoryType === 'uniform' ? (
                <button
                  type="button"
                  className={styles.primaryButton}
                  onClick={() => {
                    setIssueType('uniform');
                    const firstUniform = currentBaseItems.find((i) => (i.availableQuantity || 0) > 0) || currentBaseItems[0] || items[0];
                    setIssueTargetItem(firstUniform);
                    setIssueModalOpen(true);
                  }}
                >
                  <Shirt size={16} /> Issue Uniform
                </button>
              ) : (
                <button
                  type="button"
                  className={styles.primaryButton}
                  onClick={() => {
                    setIssueType('asset');
                    const firstAsset = currentBaseItems.find((i) => (i.availableQuantity || 0) > 0) || currentBaseItems[0] || items[0];
                    setIssueTargetItem(firstAsset);
                    setIssueModalOpen(true);
                  }}
                >
                  <Shield size={16} /> Issue Asset
                </button>
              )
            )}
            {tab === 'returns' && (
              <button
                type="button"
                className={styles.primaryButton}
                onClick={() => {
                  setReturnTargetIssue(null);
                  setReturnModalOpen(true);
                }}
              >
                <RotateCcw size={16} /> Receive Return IN
              </button>
            )}
          </div>
        </section>

        {/* Filters for Stock, Issued, Returns */}
        {tab !== 'movement' && tab !== 'clearance' && (
          <Filters
            values={filters}
            setValue={setFilter}
            onReset={resetFilters}
            inventoryType={inventoryType}
          />
        )}

        {/* Loading Spinner or Tab Content Tables */}
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 320, gap: 14, background: 'var(--surface, #fff)', borderRadius: 12, border: '1px solid var(--border-color, #e2e8f0)', padding: 32, margin: '16px 0' }}>
            <Loader2 size={34} style={{ animation: 'spin 1s linear infinite', color: 'var(--primary, #2563eb)' }} />
            <p style={{ color: 'var(--text-muted, #64748b)', fontSize: '0.95rem', margin: 0, fontWeight: 500 }}>
              Loading inventory records from MongoDB Atlas...
            </p>
          </div>
        ) : (
          <>
            {tab === 'stock' && (
              <>
                {pageRows.length ? (
                  <StockTable
                    rows={pageRows}
                    inventoryType={inventoryType}
                    onView={(item) => {
                      setDrawerTargetItem(item);
                      setDetailsDrawerOpen(true);
                    }}
                    onEdit={(item) => {
                      const isUniform = isUniformItem(item);
                      setItemModalType(isUniform ? 'uniform' : 'asset');
                      setEditItem(item);
                      setItemModalOpen(true);
                    }}
                    onIssue={(item) => {
                      const isUniform = isUniformItem(item);
                      setIssueType(isUniform ? 'uniform' : 'asset');
                      setIssueTargetItem(item);
                      setIssueModalOpen(true);
                    }}
                    onToggleStatus={handleToggleItemStatus}
                    onDelete={handleDeleteItemMaster}
                  />
                ) : (
                  <div className={styles.emptyWrap}>
                    <EmptyState
                      title={`No ${inventoryType === 'uniform' ? 'uniform' : 'asset'} items found matching filters.`}
                      description="Try adjusting your category, size, or search query."
                      actionLabel="Reset Filters"
                      onAction={resetFilters}
                    />
                  </div>
                )}
                <Pagination
                  currentPage={page}
                  totalItems={filteredStock.length}
                  itemsPerPage={PAGE_SIZE}
                  onPageChange={setPage}
                  label="SKUs"
                />
              </>
            )}

            {tab === 'issued' && (
              <>
                {pageRows.length ? (
                  <IssuedTable
                    rows={pageRows}
                    onViewEmployee={(iss) => {
                      const emp = employees.find((e) => e.employeeId === iss.employeeId) || {
                        employeeId: iss.employeeId,
                        name: iss.employeeName,
                        client: iss.clientName,
                        site: iss.site,
                        department: iss.department || 'Security',
                        designation: iss.designation || 'Security Guard'
                      };
                      setSelectedEmployeeForAssets(emp);
                      setEmployeeAssetModalOpen(true);
                    }}
                    onReturn={(iss) => {
                      setReturnTargetIssue(iss);
                      setReturnModalOpen(true);
                    }}
                    onEdit={(iss) => {
                      const isUniform = iss.category === 'Uniform' || iss.category === 'Accessory' || iss.issueType === 'uniform';
                      setIssueType(isUniform ? 'uniform' : 'asset');
                      setEditIssue(iss);
                      setIssueTargetItem(null);
                      setIssueModalOpen(true);
                    }}
                    onDelete={handleDeleteIssue}
                    onReceipt={(iss) => {
                      notify(`Receipt generated for ${iss.id}`);
                    }}
                  />
                ) : (
                  <div className={styles.emptyWrap}>
                    <EmptyState
                      title="No issued items found."
                      description="Issue inventory to active employees to see records here."
                      actionLabel="Issue First Item"
                      onAction={() => setIssueModalOpen(true)}
                    />
                  </div>
                )}
                <Pagination
                  currentPage={page}
                  totalItems={filteredIssued.length}
                  itemsPerPage={PAGE_SIZE}
                  onPageChange={setPage}
                  label="Issued Records"
                />
              </>
            )}

            {tab === 'returns' && (
              <>
                {pageRows.length ? (
                  <ReturnTable rows={pageRows} />
                ) : (
                  <div className={styles.emptyWrap}>
                    <EmptyState
                      title="No return history records found."
                      description="Items returned by employees will appear here with condition logs."
                      actionLabel="Reset Filters"
                      onAction={resetFilters}
                    />
                  </div>
                )}
                <Pagination
                  currentPage={page}
                  totalItems={filteredReturns.length}
                  itemsPerPage={PAGE_SIZE}
                  onPageChange={setPage}
                  label="Returns"
                />
              </>
            )}

            {tab === 'movement' && (
              <StockMovementTable movements={movements} items={items} />
            )}

            {tab === 'clearance' && (
              <ClearanceTable
                rows={clearances}
                onInspectClearance={(c) => {
                  setSelectedClearanceRecord(c);
                  setClearanceModalOpen(true);
                }}
              />
            )}
          </>
        )}

        {/* Low Stock Alert Footer Ribbon */}
        <div className={styles.alertRow}>
          <div className={styles.alertCard}>
            <div className={styles.alertIconWrap}>
              <AlertTriangle size={20} color="#ea580c" />
            </div>
            <div>
              <strong>Low Stock Items ({items.filter((item) => (item.availableQuantity || 0) <= (item.minimumStock || 0) && item.status !== 'Inactive').length})</strong>
              <p>Items have reached or fallen below minimum buffer levels. Reorder to prevent shortages.</p>
            </div>
            <button
              type="button"
              className={styles.alertBtn}
              onClick={() => {
                setTab('stock');
                setFilter('status', 'low-stock');
              }}
            >
              Filter Low Stock
            </button>
          </div>

          <div className={styles.overviewCard}>
            <h3 className={styles.overviewHeading}>Overall Inventory Health</h3>
            <div className={styles.overviewGrid}>
              <span>Total Master SKUs: <strong>{items.length}</strong></span>
              <span>In Stock: <strong>{items.filter((i) => (i.availableQuantity || 0) > (i.minimumStock || 0)).length}</strong></span>
              <span>Low Stock: <strong style={{ color: '#ea580c' }}>{items.filter((i) => (i.availableQuantity || 0) <= (i.minimumStock || 0) && (i.availableQuantity || 0) > 0).length}</strong></span>
              <span>Out of Stock: <strong style={{ color: '#dc2626' }}>{items.filter((i) => (i.availableQuantity || 0) === 0).length}</strong></span>
              <span>Damaged Qty: <strong>{items.reduce((s, i) => s + (i.damagedQuantity || 0), 0)}</strong></span>
            </div>
          </div>
        </div>

        {/* All Enhanced Modals & Drawers */}
        <DeleteItemConfirmModal
          isOpen={deleteConfirmOpen}
          item={itemToDelete}
          isDeleting={isDeletingItem}
          onClose={() => {
            setDeleteConfirmOpen(false);
            setItemToDelete(null);
          }}
          onConfirm={handleConfirmDeleteItem}
        />

        <InventoryItemModal
          isOpen={itemModalOpen}
          mode={editItem ? 'edit' : 'add'}
          itemType={itemModalType}
          initialData={editItem}
          existingItems={items}
          isSubmitting={isSavingItem}
          onClose={() => {
            setItemModalOpen(false);
            setEditItem(null);
          }}
          onSave={handleSaveItemMaster}
        />

        <InventoryIssueModal
          isOpen={issueModalOpen}
          mode={editIssue ? 'edit' : 'add'}
          issueType={issueType}
          initialItem={issueTargetItem}
          initialIssue={editIssue}
          items={items}
          employees={employees}
          isSubmitting={isSavingIssue}
          onClose={() => {
            setIssueModalOpen(false);
            setIssueTargetItem(null);
            setEditIssue(null);
          }}
          onSave={handleSaveIssue}
        />

        <InventoryReturnModal
          isOpen={returnModalOpen}
          issueRecord={returnTargetIssue}
          issuedList={issued}
          isSubmitting={isSavingReturn}
          onClose={() => {
            setReturnModalOpen(false);
            setReturnTargetIssue(null);
          }}
          onSave={handleSaveReturn}
        />

        <EmployeeAssetModal
          isOpen={employeeAssetModalOpen}
          employee={selectedEmployeeForAssets}
          issuedList={issued}
          onClose={() => {
            setEmployeeAssetModalOpen(false);
            setSelectedEmployeeForAssets(null);
          }}
          onOpenReturn={(ast) => {
            setReturnTargetIssue(ast);
            setReturnModalOpen(true);
          }}
        />

        <AssetClearanceModal
          isOpen={clearanceModalOpen}
          clearanceRecord={selectedClearanceRecord}
          isSubmitting={isApprovingClearance}
          onClose={() => {
            setClearanceModalOpen(false);
            setSelectedClearanceRecord(null);
          }}
          onApproveClearance={handleApproveClearance}
        />

        <InventoryReportsModal
          isOpen={reportsModalOpen}
          items={items}
          issuedList={issued}
          returnHistory={returns}
          movements={movements}
          clearances={clearances}
          onClose={() => setReportsModalOpen(false)}
        />

        <InventoryDetailsDrawer
          isOpen={detailsDrawerOpen}
          item={drawerTargetItem}
          issuedList={issued}
          movements={movements}
          onClose={() => {
            setDetailsDrawerOpen(false);
            setDrawerTargetItem(null);
          }}
          onEdit={(item) => {
            setEditItem(item);
            setItemModalOpen(true);
          }}
          onIssue={(item) => {
            setIssueTargetItem(item);
            setIssueModalOpen(true);
          }}
        />

      </div>
    </AdminLayout>
  );
}
