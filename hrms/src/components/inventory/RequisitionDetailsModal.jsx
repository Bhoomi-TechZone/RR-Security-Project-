import React, { useState } from 'react';
import {
  X,
  User,
  Package,
  Shirt,
  Shield,
  Clock3,
  Calendar,
  MapPin,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Send,
  Loader2,
  XCircle,
  Hash,
  Layers
} from 'lucide-react';
import styles from './RequisitionDetailsModal.module.css';
import StatusBadge from '../common/StatusBadge';

export default function RequisitionDetailsModal({
  isOpen,
  request,
  items = [],
  isSubmitting = false,
  onClose,
  onApproveAndAssign,
  onReject
}) {
  const [adminRemarks, setAdminRemarks] = useState('');
  const [condition, setCondition] = useState('Brand New');
  const [serialNumber, setSerialNumber] = useState('');

  if (!isOpen || !request) return null;

  const isPending = request.status === 'Pending Review';
  const isAssigned = request.status === 'Assigned';
  const isApproved = request.status === 'Approved';
  const isRejected = request.status === 'Rejected';

  const isUniform = request.requestType === 'uniform' || request.category === 'Uniform' || request.category === 'Accessory';

  // Find matching stock item to check live warehouse availability
  const matchingStock = items.find(
    (itm) =>
      (request.itemId && (itm.id === request.itemId || itm.itemId === request.itemId || itm._id === request.itemId)) ||
      (request.itemCode && itm.itemCode === request.itemCode) ||
      itm.itemName?.toLowerCase() === request.itemName?.toLowerCase()
  );

  const availableStock = matchingStock ? Number(matchingStock.availableQuantity || 0) : null;
  const hasSufficientStock = availableStock !== null ? availableStock >= Number(request.quantity || 1) : true;

  const handleAssign = () => {
    if (onApproveAndAssign) {
      onApproveAndAssign({
        request,
        adminRemarks: adminRemarks.trim() || `Approved & Assigned to ${request.employeeName}`,
        condition,
        serialNumber: serialNumber.trim()
      });
    }
  };

  const handleReject = () => {
    if (onReject) {
      onReject(request, adminRemarks.trim() || 'Request rejected by store administration.');
    }
  };

  const initials = (request.employeeName || 'EM')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className={styles.modalBackdrop} onClick={onClose} role="dialog" aria-modal="true">
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.modalHeader}>
          <div className={styles.modalTitleGroup}>
            <div className={styles.iconCircle}>
              {isUniform ? <Shirt size={22} /> : <Shield size={22} />}
            </div>
            <div>
              <h3 className={styles.modalTitle}>Requisition Dossier #{request.requestId}</h3>
              <div className={styles.modalSubtitle}>
                <span>Applied on: {request.requestDate || '—'}</span>
                <span>•</span>
                <span
                  className={
                    request.urgency === 'Urgent'
                      ? styles.urgencyUrgent
                      : request.urgency === 'High'
                      ? styles.urgencyHigh
                      : styles.urgencyNormal
                  }
                >
                  {request.urgency || 'Normal'} Priority
                </span>
                <span>•</span>
                <StatusBadge status={request.status || 'Pending Review'} />
              </div>
            </div>
          </div>
          <button
            type="button"
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Close dialog"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className={styles.modalBody}>
          {/* SECTION 1: EMPLOYEE DOSSIER */}
          <div className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
              <h4 className={styles.sectionHeading}>
                <User size={15} /> Employee Information
              </h4>
              <span className={styles.highlightPill}>Applicant Profile</span>
            </div>

            <div className={styles.employeeProfile}>
              <div className={styles.avatar}>{initials}</div>
              <div className={styles.empDetails}>
                <h4>{request.employeeName}</h4>
                <div className={styles.empMeta}>
                  <span>ID: <strong>{request.employeeId}</strong></span>
                  <span>•</span>
                  <span>Role: <strong>{request.designation || 'Security Guard'}</strong></span>
                  <span>•</span>
                  <span>Dept: <strong>{request.department || 'Operations'}</strong></span>
                </div>
              </div>
            </div>

            <div className={styles.dataGrid}>
              <div className={styles.dataItem}>
                <span className={styles.dataLabel}>Assigned Client</span>
                <span className={styles.dataValue}>{request.clientName || 'Central Deployment'}</span>
              </div>
              <div className={styles.dataItem}>
                <span className={styles.dataLabel}>Site / Work Post</span>
                <span className={styles.dataValue}>{request.site || request.deliveryLocation || 'Main Facility'}</span>
              </div>
            </div>
          </div>

          {/* SECTION 2: REQUEST SPECIFICATIONS */}
          <div className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
              <h4 className={styles.sectionHeading}>
                <Package size={15} /> Requisition Specifications
              </h4>
              <span className={styles.highlightPill}>
                {isUniform ? 'Uniform & Apparel' : 'Asset & Equipment'}
              </span>
            </div>

            <div className={styles.dataGrid}>
              <div className={styles.dataItem}>
                <span className={styles.dataLabel}>Item Name</span>
                <span className={styles.dataValue}>{request.itemName}</span>
              </div>
              <div className={styles.dataItem}>
                <span className={styles.dataLabel}>Category</span>
                <span className={styles.dataValue}>{request.category || (isUniform ? 'Uniform' : 'Equipment')}</span>
              </div>

              {isUniform && (
                <>
                  <div className={styles.dataItem}>
                    <span className={styles.dataLabel}>Required Size</span>
                    <span className={styles.dataValue}>{request.size || 'Free Size'}</span>
                  </div>
                  <div className={styles.dataItem}>
                    <span className={styles.dataLabel}>Color</span>
                    <span className={styles.dataValue}>{request.color || 'Standard / Navy'}</span>
                  </div>
                </>
              )}

              <div className={styles.dataItem}>
                <span className={styles.dataLabel}>Requested Quantity</span>
                <span className={styles.dataValue} style={{ color: '#2563eb', fontSize: '1rem' }}>
                  {request.quantity} {request.unit || 'Pcs'}
                </span>
              </div>

              <div className={styles.dataItem}>
                <span className={styles.dataLabel}>Unit of Measurement</span>
                <span className={styles.dataValue}>{request.unit || 'Pcs'}</span>
              </div>

              {request.brand && (
                <div className={styles.dataItem}>
                  <span className={styles.dataLabel}>Brand / Make</span>
                  <span className={styles.dataValue}>{request.brand}</span>
                </div>
              )}

              <div className={styles.dataItem}>
                <span className={styles.dataLabel}>Reason for Requisition</span>
                <span className={styles.dataValue}>{request.reason || 'New Joining / Replacement'}</span>
              </div>

              {request.notes && (
                <div className={styles.dataItem} style={{ gridColumn: 'span 2' }}>
                  <span className={styles.dataLabel}>Employee Notes & Measurements</span>
                  <p style={{ margin: 0, fontSize: '0.88rem', color: '#334155', fontStyle: 'italic', background: '#ffffff', padding: '8px 12px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                    "{request.notes}"
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* SECTION 3: WAREHOUSE STOCK AVAILABILITY CHECK */}
          <div className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
              <h4 className={styles.sectionHeading}>
                <Layers size={15} /> Warehouse Stock Check
              </h4>
            </div>

            {matchingStock ? (
              <div
                className={`${styles.stockAlert} ${
                  availableStock === 0
                    ? styles.stockAlertDanger
                    : !hasSufficientStock
                    ? styles.stockAlertWarning
                    : ''
                }`}
              >
                {hasSufficientStock ? (
                  <CheckCircle2 size={18} />
                ) : (
                  <AlertTriangle size={18} />
                )}
                <div>
                  <strong>
                    {availableStock > 0
                      ? `${availableStock} ${matchingStock.unit || 'Pcs'} Available in Warehouse (${matchingStock.itemCode || matchingStock.itemName})`
                      : `Out of Stock in Warehouse (${matchingStock.itemCode || matchingStock.itemName})`}
                  </strong>
                  <div style={{ fontSize: '0.78rem', marginTop: '2px' }}>
                    {hasSufficientStock
                      ? `Stock is sufficient to fulfill the requested quantity of ${request.quantity} ${request.unit || 'Pcs'}.`
                      : `Warning: Requested ${request.quantity} ${request.unit || 'Pcs'} exceeds current available balance (${availableStock}).`}
                  </div>
                </div>
              </div>
            ) : (
              <div className={styles.stockAlert} style={{ background: '#f8fafc', borderColor: '#e2e8f0', color: '#475569' }}>
                <Package size={18} />
                <div>
                  <strong>Custom / Uncatalogued Item</strong>
                  <div style={{ fontSize: '0.78rem' }}>
                    This item will be issued as a direct custody entry upon admin approval.
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* SECTION 4: ADMIN ACTIONS / AUDIT TRAIL */}
          {isPending ? (
            <div className={styles.actionFormSection}>
              <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: '#0f172a' }}>
                Admin Decision & Issue Parameters
              </h4>

              <div className={styles.dataGrid}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Issuance Condition</label>
                  <select
                    className={styles.formSelect}
                    value={condition}
                    onChange={(e) => setCondition(e.target.value)}
                  >
                    <option value="Brand New">Brand New</option>
                    <option value="Good">Good Condition</option>
                    <option value="Refurbished">Refurbished / Serviceable</option>
                  </select>
                </div>

                {!isUniform && (
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Serial Number / Tag (Optional)</label>
                    <input
                      type="text"
                      className={styles.formInput}
                      placeholder="e.g. SN-88921 or RFID-092"
                      value={serialNumber}
                      onChange={(e) => setSerialNumber(e.target.value)}
                    />
                  </div>
                )}
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Admin Remarks / Instructions</label>
                <textarea
                  className={styles.formTextarea}
                  placeholder="Enter notes, dispatch remarks, or rejection reasoning..."
                  value={adminRemarks}
                  onChange={(e) => setAdminRemarks(e.target.value)}
                />
              </div>
            </div>
          ) : (
            <div className={styles.sectionCard} style={{ background: '#f0fdf4', borderColor: '#bbf7d0' }}>
              <div className={styles.sectionHeader} style={{ borderColor: '#bbf7d0' }}>
                <h4 className={styles.sectionHeading} style={{ color: '#166534' }}>
                  <CheckCircle2 size={15} /> Request Processed
                </h4>
                <StatusBadge status={request.status} />
              </div>
              <div className={styles.dataGrid}>
                <div className={styles.dataItem}>
                  <span className={styles.dataLabel}>Action Date</span>
                  <span className={styles.dataValue}>{request.actionDate || request.updatedAt?.slice(0, 10) || '—'}</span>
                </div>
                <div className={styles.dataItem}>
                  <span className={styles.dataLabel}>Processed By</span>
                  <span className={styles.dataValue}>{request.actionBy || 'Store Admin'}</span>
                </div>
                {request.assignedIssueId && (
                  <div className={styles.dataItem} style={{ gridColumn: 'span 2' }}>
                    <span className={styles.dataLabel}>Linked Custody Issue ID</span>
                    <span className={styles.dataValue} style={{ fontFamily: 'monospace', color: '#15803d' }}>
                      {request.assignedIssueId}
                    </span>
                  </div>
                )}
                {request.adminRemarks && (
                  <div className={styles.dataItem} style={{ gridColumn: 'span 2' }}>
                    <span className={styles.dataLabel}>Admin Remarks</span>
                    <span className={styles.dataValue}>{request.adminRemarks}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className={styles.modalFooter}>
          <button
            type="button"
            className={styles.btnSecondary}
            onClick={onClose}
            disabled={isSubmitting}
          >
            Close
          </button>

          {isPending && (
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                className={styles.btnDanger}
                onClick={handleReject}
                disabled={isSubmitting}
              >
                <XCircle size={15} /> Reject Request
              </button>

              <button
                type="button"
                className={styles.btnPrimary}
                onClick={handleAssign}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} />
                    <span>Processing Custody...</span>
                  </>
                ) : (
                  <>
                    <Send size={15} />
                    <span>Approve & Assign Custody</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
