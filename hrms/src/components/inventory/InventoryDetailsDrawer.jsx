import React from 'react';
import { X, Package, ShieldCheck, Tag, DollarSign, Layers, AlertTriangle, ArrowUpRight, ArrowDownLeft, Sliders, Edit3, PlusCircle } from 'lucide-react';
import styles from './InventoryDetailsDrawer.module.css';

export default function InventoryDetailsDrawer({
  isOpen,
  item = null,
  issuedList = [],
  movements = [],
  onClose,
  onEdit,
  onIssue
}) {
  if (!isOpen || !item) return null;

  const itemMovements = movements.filter((m) => m.itemId === (item.id || item.itemId) || m.itemCode === item.itemCode);
  const itemIssues = issuedList.filter((iss) => iss.itemId === (item.id || item.itemId) || iss.itemCode === item.itemCode);

  const isLowStock = item.availableQuantity <= (item.minimumStock || 0);
  const isOut = item.availableQuantity === 0;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.drawer} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerTitleWrap}>
            <div className={styles.iconWrap}>
              <Package size={22} />
            </div>
            <div>
              <span className={styles.itemCode}>{item.itemCode || item.id}</span>
              <h2 className={styles.title}>{item.itemName}</h2>
            </div>
          </div>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        {/* Drawer Body */}
        <div className={styles.body}>
          {/* Status & Valuation Ribbon */}
          <div className={styles.ribbon}>
            <div>
              <span className={styles.ribbonLabel}>Current Status</span>
              <span
                className={`${styles.statusBadge} ${
                  isOut ? styles.statusOut : isLowStock ? styles.statusLow : styles.statusIn
                }`}
              >
                {isOut ? 'Out of Stock' : isLowStock ? 'Low Stock Alert' : 'In Stock'}
              </span>
            </div>

            <div>
              <span className={styles.ribbonLabel}>Total Asset Valuation</span>
              <span className={styles.valuationVal}>
                ₹{((item.availableQuantity || 0) * (item.purchaseRate || 0)).toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          {/* Quick Metrics Grid */}
          <div className={styles.metricsGrid}>
            <div className={styles.metricCard}>
              <span className={styles.metricLabel}>Opening Stock</span>
              <span className={styles.metricValue}>{item.openingStock || 0} {item.unit}</span>
            </div>
            <div className={styles.metricCardPrimary}>
              <span className={styles.metricLabelPrimary}>Available Stock</span>
              <span className={styles.metricValuePrimary}>{item.availableQuantity || 0} {item.unit}</span>
            </div>
            <div className={styles.metricCard}>
              <span className={styles.metricLabel}>Issued Out</span>
              <span className={styles.metricValue}>{item.issuedQuantity || 0} {item.unit}</span>
            </div>
            <div className={styles.metricCard}>
              <span className={styles.metricLabel}>Min. Stock Level</span>
              <span className={styles.metricValue}>{item.minimumStock || 0} {item.unit}</span>
            </div>
          </div>

          {/* Item Specifications */}
          <div className={styles.section}>
            <h3 className={styles.sectionHeading}>Product & Specification Details</h3>
            <div className={styles.specGrid}>
              <div className={styles.specItem}>
                <span>Category:</span>
                <strong>{item.category}</strong>
              </div>
              <div className={styles.specItem}>
                <span>Size:</span>
                <strong>{item.size || 'Free Size'}</strong>
              </div>
              <div className={styles.specItem}>
                <span>Color:</span>
                <strong>{item.color || 'Standard'}</strong>
              </div>
              <div className={styles.specItem}>
                <span>Unit:</span>
                <strong>{item.unit || 'Pcs'}</strong>
              </div>
              <div className={styles.specItem}>
                <span>Brand:</span>
                <strong>{item.brand || 'NovaGear'}</strong>
              </div>
              <div className={styles.specItem}>
                <span>Purchase Rate:</span>
                <strong>₹{item.purchaseRate || 0} / unit</strong>
              </div>
              <div className={styles.specItem}>
                <span>Location:</span>
                <strong>{item.location || 'Central Warehouse'}</strong>
              </div>
              <div className={styles.specItem}>
                <span>Master Status:</span>
                <strong>{item.status || 'Active'}</strong>
              </div>
            </div>
            {item.description && (
              <p className={styles.description}>
                <strong>Description:</strong> {item.description}
              </p>
            )}
          </div>

          {/* Recent Issues Table */}
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <h3 className={styles.sectionHeading}>Recent Personnel Deployments ({itemIssues.length})</h3>
            </div>
            {itemIssues.length === 0 ? (
              <p className={styles.emptyText}>No issue records found for this item.</p>
            ) : (
              <div className={styles.tableWrap}>
                <table className={styles.miniTable}>
                  <thead>
                    <tr>
                      <th>Employee</th>
                      <th>Qty</th>
                      <th>Issue Date</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {itemIssues.slice(0, 5).map((iss) => (
                      <tr key={iss.id}>
                        <td>
                          <strong>{iss.employeeName}</strong>
                          <div className={styles.miniSub}>{iss.employeeId}</div>
                        </td>
                        <td>{iss.quantity}</td>
                        <td>{iss.issueDate}</td>
                        <td>
                          <span className={styles.badgeSmall}>{iss.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Recent Movement Audit */}
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <h3 className={styles.sectionHeading}>Recent Stock Audit Log</h3>
            </div>
            {itemMovements.length === 0 ? (
              <p className={styles.emptyText}>No stock movements logged for this item yet.</p>
            ) : (
              <div className={styles.movementList}>
                {itemMovements.slice(0, 6).map((m) => (
                  <div key={m.id} className={styles.movementRow}>
                    <div>
                      <strong>{m.movementType}</strong>
                      <span className={styles.movementMeta}>
                        {m.date} • {m.performedBy}
                      </span>
                    </div>
                    <span className={m.quantityChange > 0 ? styles.mPos : styles.mNeg}>
                      {m.quantityChange > 0 ? `+${m.quantityChange}` : m.quantityChange}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className={styles.footer}>
          <button
            type="button"
            className={styles.btnEdit}
            onClick={() => {
              onClose();
              if (onEdit) onEdit(item);
            }}
          >
            <Edit3 size={14} /> Edit Item Master
          </button>
          <button
            type="button"
            className={styles.btnIssue}
            onClick={() => {
              onClose();
              if (onIssue) onIssue(item);
            }}
            disabled={item.availableQuantity === 0}
          >
            <PlusCircle size={14} /> Issue to Personnel
          </button>
        </div>
      </div>
    </div>
  );
}
