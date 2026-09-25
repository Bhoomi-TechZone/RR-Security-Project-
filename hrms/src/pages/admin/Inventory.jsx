import React, { useMemo, useState, useEffect } from 'react';
import {
  Download, MoreVertical, Package, PackageCheck, PackageOpen, Plus,
  RotateCcw, Search, X, AlertTriangle, ShieldCheck, DollarSign,
  ArrowRightLeft, FileSpreadsheet, User, Eye, Edit3, ArrowUpRight, ShieldAlert, CheckCircle,
  Shirt, Shield, Trash2
} from 'lucide-react';
import AdminLayout from '../../components/layout/AdminLayout';
import EmptyState from '../../components/common/EmptyState';
import Pagination from '../../components/common/Pagination';
import Toast from '../../components/common/Toast';
import { mockEmployees } from '../../data/employeeData';
import { mockCompanies } from '../../data/companyData';
import {
  INVENTORY_CATEGORIES,
  INVENTORY_SIZES,
  INVENTORY_COLORS,
  INVENTORY_UNITS,
  mockInventoryMasterItems,
  mockIssuedUniforms,
  mockReturnRecords,
  mockStockMovements,
  mockExitClearances
} from '../../data/inventoryMasterData';

import InventoryItemModal from '../../components/inventory/InventoryItemModal';
import InventoryIssueModal from '../../components/inventory/InventoryIssueModal';
import InventoryReturnModal from '../../components/inventory/InventoryReturnModal';
import EmployeeAssetModal from '../../components/inventory/EmployeeAssetModal';
import AssetClearanceModal from '../../components/inventory/AssetClearanceModal';
import StockMovementTable from '../../components/inventory/StockMovementTable';
import InventoryReportsModal from '../../components/inventory/InventoryReportsModal';
import InventoryDetailsDrawer from '../../components/inventory/InventoryDetailsDrawer';

import styles from './Inventory.module.css';

const STORAGE_KEY = 'novaspark_inventory_master_items_v2';
const ISSUED_KEY = 'novaspark_inventory_issued_v2';
const RETURNS_KEY = 'novaspark_inventory_returns_v2';
const MOVEMENTS_KEY = 'novaspark_inventory_movements_v2';
const CLEARANCE_KEY = 'novaspark_inventory_clearances_v2';
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
function CategorySummary({ items, activeCategory, onSelectCategory }) {
  const categories = INVENTORY_CATEGORIES.slice(0, 6);
  const rows = categories.map((category) => {
    const matchingItems = items.filter((item) => item.category === category);
    const total = matchingItems.reduce((sum, item) => sum + (Number(item.availableQuantity) || 0), 0);
    return { category, total, count: matchingItems.length };
  });
  const max = Math.max(...rows.map((row) => row.total), 1);

  return (
    <section className={styles.categoryCard}>
      <div className={styles.sectionHeader}>
        <div>
          <h2 className={styles.sectionTitle}>Inventory Categories</h2>
          <p className={styles.sectionSubtext}>Click any category to filter stock list instantly</p>
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
                <strong>{row.category}s</strong>
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
function Filters({ values, setValue, onReset }) {
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
              placeholder="Search item name, code, brand, SKU..."
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
            {INVENTORY_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

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

// 1. Enhanced Stock Table
function StockTable({ rows, onView, onEdit, onIssue, onToggleStatus }) {
  const [openMenuId, setOpenMenuId] = useState(null);

  return (
    <div className={styles.tableCard}>
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Item Code</th>
              <th>Item Name</th>
              <th>Category</th>
              <th>Size / Color</th>
              <th>Unit & Brand</th>
              <th>Opening</th>
              <th>Current Stock</th>
              <th>Issued</th>
              <th>Returned</th>
              <th>Min. Stock</th>
              <th>Purchase Rate</th>
              <th>Stock Value</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((item) => {
              const status = stockStatus(item);
              const currentStock = Number(item.availableQuantity ?? 0);
              const rate = Number(item.purchaseRate ?? 0);
              const stockValue = currentStock * rate;
              const isLow = currentStock <= (item.minimumStock ?? 0);

              return (
                <tr key={item.id || item.itemId}>
                  <td className={styles.codeCell}>{item.itemCode || item.itemId}</td>
                  <td>
                    <div className={styles.itemCell}>
                      <span className={styles.itemIcon}>
                        <Package size={16} />
                      </span>
                      <div>
                        <strong>{item.itemName}</strong>
                        {item.location && <span className={styles.cellSub}>{item.location}</span>}
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={styles.categoryBadge}>{item.category}</span>
                  </td>
                  <td>
                    <span className={styles.sizeTag}>{item.size || 'Free Size'}</span>
                    {item.color && <span className={styles.colorTag}>{item.color}</span>}
                  </td>
                  <td>
                    <span className={styles.unitBrand}>
                      {item.unit || 'Pcs'} • {item.brand || 'NovaGear'}
                    </span>
                  </td>
                  <td>{item.openingStock ?? item.totalQuantity ?? 0}</td>
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
  // State initialization with master data fallback
  const [items, setItems] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : mockInventoryMasterItems;
    } catch {
      return mockInventoryMasterItems;
    }
  });

  const [issued, setIssued] = useState(() => {
    try {
      const stored = localStorage.getItem(ISSUED_KEY);
      return stored ? JSON.parse(stored) : mockIssuedUniforms;
    } catch {
      return mockIssuedUniforms;
    }
  });

  const [returns, setReturns] = useState(() => {
    try {
      const stored = localStorage.getItem(RETURNS_KEY);
      return stored ? JSON.parse(stored) : mockReturnRecords;
    } catch {
      return mockReturnRecords;
    }
  });

  const [movements, setMovements] = useState(() => {
    try {
      const stored = localStorage.getItem(MOVEMENTS_KEY);
      return stored ? JSON.parse(stored) : mockStockMovements;
    } catch {
      return mockStockMovements;
    }
  });

  const [clearances, setClearances] = useState(() => {
    try {
      const stored = localStorage.getItem(CLEARANCE_KEY);
      return stored ? JSON.parse(stored) : mockExitClearances;
    } catch {
      return mockExitClearances;
    }
  });

  // Navigation & filter state
  const [tab, setTab] = useState('stock'); // 'stock' | 'issued' | 'returns' | 'movement' | 'clearance'
  const [filters, setFilters] = useState({ search: '', category: '', size: '', status: '' });
  const [page, setPage] = useState(1);
  const [toast, setToast] = useState(null);

  // Modal / Drawer states
  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [itemModalType, setItemModalType] = useState('uniform'); // 'uniform' | 'asset'
  const [editItem, setEditItem] = useState(null);

  const [issueModalOpen, setIssueModalOpen] = useState(false);
  const [issueType, setIssueType] = useState('uniform'); // 'uniform' | 'asset'
  const [issueTargetItem, setIssueTargetItem] = useState(null);
  const [editIssue, setEditIssue] = useState(null);

  const [returnModalOpen, setReturnModalOpen] = useState(false);
  const [returnTargetIssue, setReturnTargetIssue] = useState(null);

  const [employeeAssetModalOpen, setEmployeeAssetModalOpen] = useState(false);
  const [selectedEmployeeForAssets, setSelectedEmployeeForAssets] = useState(null);

  const [clearanceModalOpen, setClearanceModalOpen] = useState(false);
  const [selectedClearanceRecord, setSelectedClearanceRecord] = useState(null);

  const [reportsModalOpen, setReportsModalOpen] = useState(false);

  const [detailsDrawerOpen, setDetailsDrawerOpen] = useState(false);
  const [drawerTargetItem, setDrawerTargetItem] = useState(null);

  // Save to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.error(e);
    }
  }, [items]);

  useEffect(() => {
    try {
      localStorage.setItem(ISSUED_KEY, JSON.stringify(issued));
    } catch (e) {
      console.error(e);
    }
  }, [issued]);

  useEffect(() => {
    try {
      localStorage.setItem(RETURNS_KEY, JSON.stringify(returns));
    } catch (e) {
      console.error(e);
    }
  }, [returns]);

  useEffect(() => {
    try {
      localStorage.setItem(MOVEMENTS_KEY, JSON.stringify(movements));
    } catch (e) {
      console.error(e);
    }
  }, [movements]);

  useEffect(() => {
    try {
      localStorage.setItem(CLEARANCE_KEY, JSON.stringify(clearances));
    } catch (e) {
      console.error(e);
    }
  }, [clearances]);

  const notify = (message, type = 'success') => setToast({ message, type });

  const setFilter = (key, value) => {
    setPage(1);
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const resetFilters = () => {
    setPage(1);
    setFilters({ search: '', category: '', size: '', status: '' });
  };

  // Filtered Stock rows
  const filteredStock = useMemo(() => {
    return items.filter((item) => {
      const q = filters.search.toLowerCase().trim();
      if (q && !`${item.itemName} ${item.itemCode || item.itemId} ${item.category} ${item.brand}`.toLowerCase().includes(q)) {
        return false;
      }
      if (filters.category && item.category !== filters.category) return false;
      if (filters.size && item.size !== filters.size) return false;
      if (filters.status && stockStatus(item) !== filters.status) return false;
      return true;
    });
  }, [items, filters]);

  // Filtered Issued rows
  const filteredIssued = useMemo(() => {
    return issued.filter((item) => {
      const q = filters.search.toLowerCase().trim();
      if (q && !`${item.employeeName} ${item.employeeId} ${item.itemName} ${item.id} ${item.clientName}`.toLowerCase().includes(q)) {
        return false;
      }
      if (filters.category && item.category !== filters.category) return false;
      return true;
    });
  }, [issued, filters]);

  // Filtered Return rows
  const filteredReturns = useMemo(() => {
    return returns.filter((item) => {
      const q = filters.search.toLowerCase().trim();
      if (q && !`${item.employeeName} ${item.employeeId} ${item.itemName} ${item.id}`.toLowerCase().includes(q)) {
        return false;
      }
      if (filters.category && item.category !== filters.category) return false;
      return true;
    });
  }, [returns, filters]);

  // Active rows & pagination
  const activeRows = tab === 'stock' ? filteredStock : tab === 'issued' ? filteredIssued : tab === 'returns' ? filteredReturns : clearances;
  const pageRows = activeRows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // 1. Save or Update Item Master
  const handleSaveItemMaster = (itemData) => {
    if (editItem) {
      setItems((prev) =>
        prev.map((i) => (i.id === editItem.id || i.itemId === editItem.itemId ? { ...i, ...itemData } : i))
      );
      notify(`✓ Item "${itemData.itemName}" updated successfully.`);
    } else {
      // Check code uniqueness
      if (items.some((i) => (i.itemCode || i.itemId || '').toLowerCase() === (itemData.itemCode || '').toLowerCase())) {
        notify(`Item Code "${itemData.itemCode}" already exists. Please choose a unique code.`, 'danger');
        return;
      }
      const newItem = {
        ...itemData,
        id: `ITM-2026-${Math.floor(100 + Math.random() * 900)}`,
        availableQuantity: Number(itemData.openingStock || 0),
        issuedQuantity: 0,
        returnedQuantity: 0,
        damagedQuantity: 0,
        lostQuantity: 0
      };
      setItems((prev) => [newItem, ...prev]);

      // Add movement log for opening stock
      if (Number(itemData.openingStock) > 0) {
        const mv = {
          id: `MOV-2026-${Math.floor(1000 + Math.random() * 9000)}`,
          date: new Date().toISOString().split('T')[0],
          itemId: newItem.id,
          itemCode: newItem.itemCode,
          itemName: newItem.itemName,
          movementType: 'Opening Stock',
          quantityChange: Number(itemData.openingStock),
          balanceBefore: 0,
          balanceAfter: Number(itemData.openingStock),
          location: newItem.location || 'Central Warehouse',
          reference: 'MASTER-INIT',
          performedBy: 'Store Admin'
        };
        setMovements((prev) => [mv, ...prev]);
      }
      notify(`✓ New inventory item "${itemData.itemName}" created with ${itemData.openingStock} initial stock.`);
    }
    setItemModalOpen(false);
    setEditItem(null);
  };

  // Toggle active/inactive
  const handleToggleItemStatus = (item) => {
    const nextStatus = item.status === 'Inactive' ? 'Active' : 'Inactive';
    setItems((prev) =>
      prev.map((i) => (i.id === item.id || i.itemId === item.itemId ? { ...i, status: nextStatus } : i))
    );
    notify(`Item status changed to ${nextStatus}.`);
  };

  // 2. Handle Issue Item Out (Create or Edit)
  const handleSaveIssue = (issuePayloadOrList, isEdit = false) => {
    const list = Array.isArray(issuePayloadOrList) ? issuePayloadOrList : [issuePayloadOrList];
    if (!list.length) return;

    if (isEdit || editIssue) {
      const issuePayload = list[0];
      const original = issued.find((i) => i.id === issuePayload.id) || editIssue;
      const oldQty = Number(original?.quantity || 0);
      const newQty = Number(issuePayload.quantity || 0);
      const diff = newQty - oldQty; // positive: extra units deducted from available stock

      // Update inventory stock
      setItems((prev) =>
        prev.map((i) => {
          if (
            i.id === issuePayload.itemId ||
            i.itemId === issuePayload.itemId ||
            i.itemCode === issuePayload.itemCode
          ) {
            const avail = (i.availableQuantity ?? 0) - diff;
            const iss = (i.issuedQuantity ?? 0) + diff;
            return {
              ...i,
              availableQuantity: Math.max(0, avail),
              issuedQuantity: Math.max(0, iss)
            };
          }
          return i;
        })
      );

      // Update issue record in issued array
      setIssued((prev) =>
        prev.map((iss) =>
          iss.id === issuePayload.id
            ? {
                ...iss,
                ...issuePayload,
                pendingQuantity: Math.max(0, newQty - (iss.returnedQuantity || 0)),
                totalAmount: Number((newQty * (issuePayload.rate || issuePayload.issueRate || 450)).toFixed(2))
              }
            : iss
        )
      );

      // Log movement if quantity changed
      if (diff !== 0) {
        const mv = {
          id: `MOV-2026-${Math.floor(1000 + Math.random() * 9000)}`,
          date: issuePayload.issueDate || new Date().toISOString().split('T')[0],
          itemId: issuePayload.itemId,
          itemCode: issuePayload.itemCode,
          itemName: issuePayload.itemName,
          movementType: 'Issue Modification',
          quantityChange: -diff,
          employeeName: issuePayload.employeeName,
          employeeId: issuePayload.employeeId,
          site: issuePayload.site,
          reference: issuePayload.id,
          performedBy: issuePayload.issuedBy || 'Store Admin'
        };
        setMovements((prev) => [mv, ...prev]);
      }

      notify(`✓ Issue record "${issuePayload.id}" updated successfully.`);
      setIssueModalOpen(false);
      setEditIssue(null);
      return;
    }

    let updatedItems = [...items];
    const newIssuedRecords = [];
    const newMovements = [];

    list.forEach((issuePayload) => {
      const target = updatedItems.find(
        (i) =>
          i.id === issuePayload.itemId ||
          i.itemId === issuePayload.itemId ||
          i.itemCode === issuePayload.itemCode
      );
      if (!target) return;

      const qty = Number(issuePayload.quantity);
      const balanceBefore = target.availableQuantity;
      const balanceAfter = Math.max(0, balanceBefore - qty);

      updatedItems = updatedItems.map((i) =>
        i.id === target.id || i.itemId === target.itemId
          ? {
              ...i,
              availableQuantity: balanceAfter,
              issuedQuantity: (i.issuedQuantity || 0) + qty
            }
          : i
      );

      newIssuedRecords.push(issuePayload);

      newMovements.push({
        id: `MOV-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        date: issuePayload.issueDate,
        itemId: target.id || target.itemId,
        itemCode: target.itemCode || target.itemId,
        itemName: target.itemName,
        movementType: 'Issue OUT',
        quantityChange: -qty,
        balanceBefore,
        balanceAfter,
        employeeName: issuePayload.employeeName,
        employeeId: issuePayload.employeeId,
        site: issuePayload.site,
        reference: issuePayload.id,
        performedBy: issuePayload.issuedBy
      });
    });

    setItems(updatedItems);
    setIssued((prev) => [...newIssuedRecords, ...prev]);
    setMovements((prev) => [...newMovements, ...prev]);

    if (list.length === 1) {
      notify(`✓ Issued ${list[0].quantity} ${list[0].unit || 'Pcs'} of ${list[0].itemName} to ${list[0].employeeName}.`);
    } else {
      notify(`✓ Successfully issued ${list.length} items to ${list[0].employeeName}.`);
    }
    setIssueModalOpen(false);
    setEditIssue(null);
  };

  // Delete Issue Record and restore stock
  const handleDeleteIssue = (issueItem) => {
    const isConfirmed = window.confirm(
      `Are you sure you want to delete issue record "${issueItem.id}" for ${issueItem.employeeName}?\n\nThe issued quantity (${issueItem.quantity}) will be restored back to available stock.`
    );
    if (!isConfirmed) return;

    const unreturnedQty = Number(issueItem.quantity || 0) - Number(issueItem.returnedQuantity || 0);

    // Restore stock
    setItems((prev) =>
      prev.map((i) => {
        if (i.id === issueItem.itemId || i.itemId === issueItem.itemId || i.itemCode === issueItem.itemCode) {
          return {
            ...i,
            availableQuantity: (i.availableQuantity ?? 0) + unreturnedQty,
            issuedQuantity: Math.max(0, (i.issuedQuantity ?? 0) - Number(issueItem.quantity || 0))
          };
        }
        return i;
      })
    );

    // Remove from issued
    setIssued((prev) => prev.filter((iss) => iss.id !== issueItem.id));

    // Add movement log
    const mv = {
      id: `MOV-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      date: new Date().toISOString().split('T')[0],
      itemId: issueItem.itemId,
      itemCode: issueItem.itemCode,
      itemName: issueItem.itemName,
      movementType: 'Issue Deleted / Cancelled',
      quantityChange: +unreturnedQty,
      employeeName: issueItem.employeeName,
      employeeId: issueItem.employeeId,
      site: issueItem.site,
      reference: issueItem.id,
      performedBy: 'Store Admin'
    };
    setMovements((prev) => [mv, ...prev]);

    notify(`✓ Issue record "${issueItem.id}" deleted. Restored ${unreturnedQty} units back to stock.`);
  };

  // 3. Handle Return Item In
  const handleSaveReturn = (returnPayload) => {
    const { issueId, itemId, returnedQuantity, condition, returnedBy, totalReturnValue } = returnPayload;
    const qty = Number(returnedQuantity);

    // 1. Update issue record
    setIssued((prev) =>
      prev.map((iss) => {
        if (iss.id === issueId) {
          const newReturnedQty = (iss.returnedQuantity || 0) + qty;
          const newPending = Math.max(0, iss.quantity - newReturnedQty);
          let newStatus = 'Issued';
          if (condition === 'Damaged') newStatus = 'Damaged';
          else if (condition === 'Lost') newStatus = 'Lost';
          else if (newPending === 0) newStatus = 'Returned';
          else newStatus = 'Partially Returned';

          return {
            ...iss,
            returnedQuantity: newReturnedQty,
            pendingQuantity: newPending,
            status: newStatus
          };
        }
        return iss;
      })
    );

    // 2. Update stock only if Good / New
    const target = items.find((i) => i.id === itemId || i.itemId === itemId || i.itemCode === returnPayload.itemCode);
    const balanceBefore = target?.availableQuantity ?? 0;
    let balanceAfter = balanceBefore;

    if (target) {
      if (condition === 'Good' || condition === 'New') {
        balanceAfter = balanceBefore + qty;
        setItems((prev) =>
          prev.map((i) =>
            i.id === target.id || i.itemId === target.itemId
              ? {
                  ...i,
                  availableQuantity: balanceAfter,
                  returnedQuantity: (i.returnedQuantity || 0) + qty
                }
              : i
          )
        );
      } else if (condition === 'Damaged') {
        setItems((prev) =>
          prev.map((i) =>
            i.id === target.id || i.itemId === target.itemId
              ? { ...i, damagedQuantity: (i.damagedQuantity || 0) + qty }
              : i
          )
        );
      } else if (condition === 'Lost') {
        setItems((prev) =>
          prev.map((i) =>
            i.id === target.id || i.itemId === target.itemId
              ? { ...i, lostQuantity: (i.lostQuantity || 0) + qty }
              : i
          )
        );
      }
    }

    // 3. Append to Return History
    setReturns((prev) => [returnPayload, ...prev]);

    // 4. Append to Movement Log
    const movementType = condition === 'Damaged' ? 'Damaged' : condition === 'Lost' ? 'Lost' : 'Return IN';
    const mv = {
      id: `MOV-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      date: returnPayload.returnDate,
      itemId: target?.id || itemId,
      itemCode: target?.itemCode || returnPayload.itemCode,
      itemName: target?.itemName || returnPayload.itemName,
      movementType,
      quantityChange: condition === 'Good' || condition === 'New' ? +qty : 0,
      balanceBefore,
      balanceAfter,
      employeeName: returnPayload.employeeName,
      employeeId: returnPayload.employeeId,
      reference: returnPayload.id,
      performedBy: returnedBy
    };
    setMovements((prev) => [mv, ...prev]);

    notify(
      condition === 'Good' || condition === 'New'
        ? `✓ Return received: +${qty} units added back to available stock.`
        : `✓ Return processed: ${qty} units recorded under ${condition} status.`
    );
  };

  // 4. Handle Employee Exit Clearance approval
  const handleApproveClearance = (clearedData) => {
    setClearances((prev) =>
      prev.map((c) => (c.id === clearedData.id ? { ...c, ...clearedData } : c))
    );
    notify(`✓ Exit clearance signed off for ${clearedData.employeeName}. Certificate: ${clearedData.certificateNo}`);
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
        <div className={styles.breadcrumb}>
          <span>Dashboard</span>
          <span>/</span>
          <strong>Admin Inventory & Asset Management</strong>
        </div>

        {/* Page Header */}
        <header className={styles.pageHeader}>
          <div>
            <h1>Inventory Management</h1>
            <p>Stock registers, uniform issues, return inspection & exit clearance</p>
          </div>
          <div className={styles.headerActions}>
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={() => {
                setDrawerTargetItem(items[0]);
                setDetailsDrawerOpen(true);
              }}
            >
              <Package size={16} /> View Stock
            </button>
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={() => setReportsModalOpen(true)}
            >
              <FileSpreadsheet size={16} /> Export Report
            </button>
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
          </div>
        </header>

        {/* 6 Responsive Summary KPIs */}
        <EnhancedSummaryCards
          items={items}
          issued={issued}
          returns={returns}
          onLowStockClick={() => {
            setTab('stock');
            setFilter('status', 'low-stock');
          }}
        />

        {/* Dynamic Interactive Category Cards */}
        <CategorySummary
          items={items}
          activeCategory={filters.category}
          onSelectCategory={(cat) => setFilter('category', cat)}
        />

        {/* Primary Tabs */}
        <div className={styles.tabs} role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'stock'}
            className={tab === 'stock' ? styles.activeTab : ''}
            onClick={() => {
              setPage(1);
              setTab('stock');
            }}
          >
            Inventory Stock ({items.length})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'issued'}
            className={tab === 'issued' ? styles.activeTab : ''}
            onClick={() => {
              setPage(1);
              setTab('issued');
            }}
          >
            Issued Items ({issued.length})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'returns'}
            className={tab === 'returns' ? styles.activeTab : ''}
            onClick={() => {
              setPage(1);
              setTab('returns');
            }}
          >
            Return History ({returns.length})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'movement'}
            className={tab === 'movement' ? styles.activeTab : ''}
            onClick={() => {
              setPage(1);
              setTab('movement');
            }}
          >
            Stock Movement Audit ({movements.length})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'clearance'}
            className={tab === 'clearance' ? styles.activeTab : ''}
            onClick={() => {
              setPage(1);
              setTab('clearance');
            }}
          >
            Asset Exit Clearance ({clearances.length})
          </button>
        </div>

        {/* Section Header with Quick Actions */}
        <section className={styles.sectionIntro}>
          <div>
            <h2 className={styles.sectionTitle}>
              {tab === 'stock'
                ? 'Inventory Stock Register'
                : tab === 'issued'
                ? 'Uniform & Asset Issue Register'
                : tab === 'returns'
                ? 'Uniform & Asset Return History'
                : tab === 'movement'
                ? 'Stock Movement & Audit Trail'
                : 'Employee Exit Asset Clearance'}
            </h2>
            <p className={styles.sectionSubtext}>
              {tab === 'stock'
                ? 'Real-time stock valuation, unit metrics, reorder levels, and SKU actions.'
                : tab === 'issued'
                ? 'Personnel asset custody, issue rates, total amounts, and pending return tracking.'
                : tab === 'returns'
                ? 'Returned item logs with condition assessment (Good, Damaged, Lost).'
                : tab === 'movement'
                ? 'Complete chronological ledger of all inward, outward, and adjustment movements.'
                : 'Mandatory asset verification and clearance certificate sign-off for exiting personnel.'}
            </p>
          </div>
          <div className={styles.introActions}>
            {tab === 'stock' && (
              <>
                <button
                  type="button"
                  className={styles.primaryButton}
                  onClick={() => {
                    setIssueType('uniform');
                    const firstUniform = items.find((i) => (i.category === 'Uniform' || i.category === 'Accessory') && (i.availableQuantity || 0) > 0) || items.find((i) => i.category === 'Uniform' || i.category === 'Accessory') || items[0];
                    setIssueTargetItem(firstUniform);
                    setIssueModalOpen(true);
                  }}
                >
                  <Shirt size={16} /> Issue Uniform
                </button>
                <button
                  type="button"
                  className={styles.primaryButton}
                  onClick={() => {
                    setIssueType('asset');
                    const firstAsset = items.find((i) => i.category !== 'Uniform' && (i.availableQuantity || 0) > 0) || items.find((i) => i.category !== 'Uniform') || items[0];
                    setIssueTargetItem(firstAsset);
                    setIssueModalOpen(true);
                  }}
                >
                  <Shield size={16} /> Issue Asset
                </button>
              </>
            )}
            {tab === 'issued' && (
              <>
                <button
                  type="button"
                  className={styles.secondaryButton}
                  onClick={() => {
                    setIssueType('uniform');
                    const firstUniform = items.find((i) => (i.category === 'Uniform' || i.category === 'Accessory') && (i.availableQuantity || 0) > 0) || items.find((i) => i.category === 'Uniform' || i.category === 'Accessory') || items[0];
                    setIssueTargetItem(firstUniform);
                    setIssueModalOpen(true);
                  }}
                >
                  <Shirt size={16} /> Issue Uniform
                </button>
                <button
                  type="button"
                  className={styles.primaryButton}
                  onClick={() => {
                    setIssueType('asset');
                    const firstAsset = items.find((i) => i.category !== 'Uniform' && (i.availableQuantity || 0) > 0) || items.find((i) => i.category !== 'Uniform') || items[0];
                    setIssueTargetItem(firstAsset);
                    setIssueModalOpen(true);
                  }}
                >
                  <Shield size={16} /> Issue Asset
                </button>
              </>
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
          <Filters values={filters} setValue={setFilter} onReset={resetFilters} />
        )}

        {/* Tab Content Tables */}
        {tab === 'stock' && (
          <>
            {pageRows.length ? (
              <StockTable
                rows={pageRows}
                onView={(item) => {
                  setDrawerTargetItem(item);
                  setDetailsDrawerOpen(true);
                }}
                onEdit={(item) => {
                  const isUniform = item.category === 'Uniform' || item.category === 'Accessory';
                  setItemModalType(isUniform ? 'uniform' : 'asset');
                  setEditItem(item);
                  setItemModalOpen(true);
                }}
                onIssue={(item) => {
                  const isUniform = item.category === 'Uniform' || item.category === 'Accessory' || item.category === 'Clothing';
                  setIssueType(isUniform ? 'uniform' : 'asset');
                  setIssueTargetItem(item);
                  setIssueModalOpen(true);
                }}
                onToggleStatus={handleToggleItemStatus}
              />
            ) : (
              <div className={styles.emptyWrap}>
                <EmptyState
                  title="No inventory items found matching filters."
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
                  const emp = mockEmployees.find((e) => e.employeeId === iss.employeeId) || {
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
        <InventoryItemModal
          isOpen={itemModalOpen}
          mode={editItem ? 'edit' : 'add'}
          itemType={itemModalType}
          initialData={editItem}
          existingItems={items}
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
          employees={mockEmployees}
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
