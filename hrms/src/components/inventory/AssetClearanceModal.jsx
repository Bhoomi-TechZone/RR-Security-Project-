import React, { useState, useMemo } from 'react';
import { X, ShieldCheck, AlertTriangle, CheckCircle, FileText, User, Printer, Award } from 'lucide-react';
import styles from './AssetClearanceModal.module.css';

export default function AssetClearanceModal({
  isOpen,
  clearanceRecord = null,
  onClose,
  onApproveClearance
}) {
  const [remarks, setRemarks] = useState('');
  const [clearedBy, setClearedBy] = useState('HR Manager (Pooja Sharma)');

  if (!isOpen || !clearanceRecord) return null;

  const {
    employeeId,
    employeeName,
    designation,
    clientName,
    site,
    exitDate,
    assignedAssets = [],
    clearanceStatus,
    certificateNo
  } = clearanceRecord;

  // Calculate pending items
  const totalPending = useMemo(() => {
    return assignedAssets.reduce((sum, ast) => sum + (ast.pendingQty || 0), 0);
  }, [assignedAssets]);

  const canBeCleared = totalPending === 0;

  const handleApprove = () => {
    onApproveClearance({
      ...clearanceRecord,
      clearanceStatus: 'Fully Cleared',
      clearedDate: new Date().toISOString().split('T')[0],
      clearedBy,
      certificateNo: certificateNo || `NDC-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      remarks: remarks || 'All assets verified and cleared for exit settlement.'
    });
    onClose();
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerTitleWrap}>
            <div className={styles.headerIcon}>
              <ShieldCheck size={20} />
            </div>
            <div>
              <h2 className={styles.title}>Employee Exit — Asset Clearance / No Dues</h2>
              <p className={styles.subtitle}>Audit returned equipment, uniform, and issued assets for final clearance</p>
            </div>
          </div>
          <div className={styles.headerActions}>
            <button type="button" className={styles.btnPrint} onClick={handlePrint}>
              <Printer size={15} /> Print Clearance Slip
            </button>
            <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Close">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className={styles.body}>
          {/* Employee Header Banner */}
          <div className={styles.empBanner}>
            <div className={styles.empInfo}>
              <div className={styles.empAvatar}>
                {(employeeName || 'EM').slice(0, 2).toUpperCase()}
              </div>
              <div>
                <h3 className={styles.empName}>{employeeName}</h3>
                <p className={styles.empSub}>
                  {employeeId} • {designation} • {clientName} ({site})
                </p>
              </div>
            </div>
            <div className={styles.exitMeta}>
              <span className={styles.exitDate}>Exit Date: <strong>{exitDate || '2026-08-31'}</strong></span>
              <span
                className={`${styles.clearanceBadge} ${
                  clearanceStatus === 'Fully Cleared'
                    ? styles.badgeSuccess
                    : clearanceStatus === 'Partially Cleared'
                    ? styles.badgeWarning
                    : styles.badgeDanger
                }`}
              >
                {clearanceStatus}
              </span>
            </div>
          </div>

          {/* Status Alert Banner */}
          {canBeCleared ? (
            <div className={styles.alertSuccess}>
              <CheckCircle size={20} color="#16a34a" />
              <div>
                <strong>All Issued Uniform & Assets Cleared (0 Pending)</strong>
                <p>All items have been verified returned, lost charges settled, or returned in good condition. You may sign off clearance.</p>
              </div>
            </div>
          ) : (
            <div className={styles.alertWarning}>
              <AlertTriangle size={20} color="#ea580c" />
              <div>
                <strong>Asset Returns Incomplete ({totalPending} Units Pending)</strong>
                <p>Employee has pending uniform/assets. Ensure all items are received via Return In or marked as Lost before granting Full Clearance.</p>
              </div>
            </div>
          )}

          {/* Assigned Assets Verification Table */}
          <div className={styles.tableSection}>
            <h4 className={styles.tableTitle}>Asset Clearance Checklist</h4>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Item & Code</th>
                    <th>Issued Qty</th>
                    <th>Returned Qty</th>
                    <th>Pending Qty</th>
                    <th>Condition / Status</th>
                    <th>Return Status</th>
                  </tr>
                </thead>
                <tbody>
                  {assignedAssets.map((ast, idx) => (
                    <tr key={idx}>
                      <td>
                        <strong>{ast.itemName}</strong>
                      </td>
                      <td>{ast.issuedQty}</td>
                      <td>{ast.returnedQty}</td>
                      <td>
                        {ast.pendingQty > 0 ? (
                          <span className={styles.pendingTag}>{ast.pendingQty} Pending</span>
                        ) : (
                          <span className={styles.clearedTag}>0 (Cleared)</span>
                        )}
                      </td>
                      <td>
                        <span className={styles.conditionTag}>{ast.condition || 'Good / Returned'}</span>
                      </td>
                      <td>
                        <span
                          className={`${styles.itemStatusBadge} ${
                            ast.status === 'Fully Cleared' || ast.status === 'Returned'
                              ? styles.statusOk
                              : styles.statusPending
                          }`}
                        >
                          {ast.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Signoff Section */}
          <div className={styles.signoffGrid}>
            <div className={styles.field}>
              <label className={styles.label}>Verified & Cleared By</label>
              <input
                type="text"
                className={styles.input}
                value={clearedBy}
                onChange={(e) => setClearedBy(e.target.value)}
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Clearance Remarks / Recovery Notes</label>
              <input
                type="text"
                className={styles.input}
                placeholder="E.g. Full uniform returned in good condition, ID card surrendered..."
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <button type="button" className={styles.btnCancel} onClick={onClose}>
            Close
          </button>
          {clearanceStatus !== 'Fully Cleared' && (
            <button
              type="button"
              className={styles.btnApprove}
              disabled={!canBeCleared}
              onClick={handleApprove}
              title={!canBeCleared ? 'Cannot clear while items are pending' : 'Approve Clearance'}
            >
              <Award size={15} /> Grant Asset Clearance
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
