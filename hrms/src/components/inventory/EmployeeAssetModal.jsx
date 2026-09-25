import React, { useMemo } from 'react';
import { X, User, Building2, MapPin, Briefcase, DollarSign, Package, AlertCircle, ShieldAlert, CheckCircle2 } from 'lucide-react';
import styles from './EmployeeAssetModal.module.css';

export default function EmployeeAssetModal({
  isOpen,
  employee = null,
  issuedList = [],
  onClose,
  onOpenReturn
}) {
  if (!isOpen || !employee) return null;

  // Find all assets issued to this employee
  const employeeAssets = useMemo(() => {
    return issuedList.filter((i) => i.employeeId === employee.employeeId);
  }, [issuedList, employee]);

  const summary = useMemo(() => {
    let totalAssets = 0;
    let totalValue = 0;
    let pendingReturns = 0;
    let damagedCount = 0;
    let lostCount = 0;

    employeeAssets.forEach((ast) => {
      totalAssets += Number(ast.quantity || 0);
      totalValue += Number(ast.totalAmount || (ast.quantity * ast.rate) || 0);
      const pending = ast.pendingQuantity ?? (ast.quantity - (ast.returnedQuantity || 0));
      pendingReturns += Math.max(0, pending);
      if (ast.status === 'Damaged') damagedCount += Number(ast.quantity || 0);
      if (ast.status === 'Lost') lostCount += Number(ast.quantity || 0);
    });

    return {
      totalAssets,
      totalValue,
      pendingReturns,
      damagedCount,
      lostCount
    };
  }, [employeeAssets]);

  return (
    <div className={styles.overlay} onClick={onClose} role="dialog" aria-modal="true">
      <div className={styles.drawer} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerTitleWrap}>
            <div className={styles.headerAvatar}>
              {(employee.name || employee.employeeName || 'EM').slice(0, 2).toUpperCase()}
            </div>
            <div>
              <h2 className={styles.title}>{employee.name || employee.employeeName}</h2>
              <p className={styles.subtitle}>
                {employee.employeeId} • {employee.designation || 'Security Guard'} • {employee.department || 'Security & Operations'}
              </p>
            </div>
          </div>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className={styles.body}>
          {/* Employee Info Header Bar */}
          <div className={styles.infoBanner}>
            <div className={styles.infoItem}>
              <Building2 size={15} className={styles.infoIcon} />
              <div>
                <span className={styles.infoLabel}>Client / Company</span>
                <span className={styles.infoVal}>{employee.companyName || employee.client || 'ABC Security Services'}</span>
              </div>
            </div>
            <div className={styles.infoItem}>
              <MapPin size={15} className={styles.infoIcon} />
              <div>
                <span className={styles.infoLabel}>Site / Deployment</span>
                <span className={styles.infoVal}>{employee.site || employee.workLocation || 'Main Facility'}</span>
              </div>
            </div>
            <div className={styles.infoItem}>
              <Briefcase size={15} className={styles.infoIcon} />
              <div>
                <span className={styles.infoLabel}>Status</span>
                <span className={styles.infoBadgeActive}>Active Personnel</span>
              </div>
            </div>
          </div>

          {/* KPI Cards */}
          <div className={styles.kpiGrid}>
            <div className={styles.kpiCard}>
              <div className={styles.kpiIconBlue}>
                <Package size={18} />
              </div>
              <div>
                <span className={styles.kpiLabel}>Total Assets Issued</span>
                <span className={styles.kpiVal}>{summary.totalAssets} units</span>
              </div>
            </div>

            <div className={styles.kpiCard}>
              <div className={styles.kpiIconGreen}>
                <DollarSign size={18} />
              </div>
              <div>
                <span className={styles.kpiLabel}>Total Asset Value</span>
                <span className={styles.kpiVal}>₹{summary.totalValue.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <div className={styles.kpiCard}>
              <div className={styles.kpiIconOrange}>
                <AlertCircle size={18} />
              </div>
              <div>
                <span className={styles.kpiLabel}>Pending Returns</span>
                <span className={styles.kpiValOrange}>{summary.pendingReturns} units</span>
              </div>
            </div>

            <div className={styles.kpiCard}>
              <div className={styles.kpiIconRed}>
                <ShieldAlert size={18} />
              </div>
              <div>
                <span className={styles.kpiLabel}>Damaged / Lost</span>
                <span className={styles.kpiValRed}>{summary.damagedCount + summary.lostCount} units</span>
              </div>
            </div>
          </div>

          {/* Assets Table */}
          <div className={styles.tableSection}>
            <div className={styles.sectionHeader}>
              <h3 className={styles.sectionTitle}>Currently Assigned Uniform & Assets</h3>
              <span className={styles.recordCount}>{employeeAssets.length} Records</span>
            </div>

            {employeeAssets.length === 0 ? (
              <div className={styles.emptyState}>
                <Package size={36} color="#94a3b8" />
                <p>No inventory or uniform items currently assigned to this employee.</p>
              </div>
            ) : (
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Item & Code</th>
                      <th>Category</th>
                      <th>Size / Color</th>
                      <th>Issued Qty</th>
                      <th>Pending Qty</th>
                      <th>Issue Date</th>
                      <th>Asset Value</th>
                      <th>Status</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {employeeAssets.map((ast) => {
                      const pending = ast.pendingQuantity ?? (ast.quantity - (ast.returnedQuantity || 0));
                      return (
                        <tr key={ast.id}>
                          <td>
                            <div className={styles.itemName}>{ast.itemName}</div>
                            <div className={styles.itemCode}>{ast.itemCode || ast.itemId}</div>
                          </td>
                          <td>
                            <span className={styles.catBadge}>{ast.category}</span>
                          </td>
                          <td>
                            <span className={styles.sizeTag}>{ast.size || 'Free Size'}</span>
                            {ast.color && <span className={styles.colorTag}>{ast.color}</span>}
                          </td>
                          <td>
                            <strong>{ast.quantity}</strong>
                          </td>
                          <td>
                            <span className={pending > 0 ? styles.pendingBadge : styles.clearedBadge}>
                              {pending}
                            </span>
                          </td>
                          <td>{ast.issueDate}</td>
                          <td>
                            <strong>₹{((ast.quantity || 1) * (ast.rate || 0)).toLocaleString('en-IN')}</strong>
                          </td>
                          <td>
                            <span
                              className={`${styles.statusBadge} ${
                                ast.status === 'Returned' || ast.status === 'Fully Returned'
                                  ? styles.statusReturned
                                  : ast.status === 'Partially Returned'
                                  ? styles.statusPartial
                                  : ast.status === 'Damaged'
                                  ? styles.statusDamaged
                                  : ast.status === 'Lost'
                                  ? styles.statusLost
                                  : styles.statusIssued
                              }`}
                            >
                              {ast.status}
                            </span>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            {pending > 0 && onOpenReturn && (
                              <button
                                type="button"
                                className={styles.btnActionReturn}
                                onClick={() => {
                                  onClose();
                                  onOpenReturn(ast);
                                }}
                              >
                                Return
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <button type="button" className={styles.btnClose} onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
