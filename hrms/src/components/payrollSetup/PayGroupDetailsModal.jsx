import React, { useEffect, useRef } from 'react';
import { X, DollarSign, Calendar, Layers, Clock, ShieldCheck } from 'lucide-react';
import StatusBadge from '../common/StatusBadge';
import styles from './PayGroupDetailsModal.module.css';

/**
 * PayGroupDetailsModal Component
 * Read-only view modal for Pay Group details and mapped salary components.
 */
function PayGroupDetailsModal({
  isOpen,
  onClose,
  payGroup = null,
  salaryComponents = []
}) {
  const modalRef = useRef(null);

  useEffect(() => {
    if (isOpen && modalRef.current) {
      modalRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !payGroup) return null;

  const assignedComponents = salaryComponents.filter(c => 
    (payGroup.salaryComponentIds || []).includes(c.id)
  );

  const earnings = assignedComponents.filter(c => c.type === 'earning');
  const deductions = assignedComponents.filter(c => c.type === 'deduction');

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-labelledby="paygroup-detail-title">
      <div 
        ref={modalRef}
        tabIndex="-1"
        className={styles.modal} 
        onClick={(e) => e.stopPropagation()}
      >
        <header className={styles.header}>
          <div className={styles.titleRow}>
            <div className={styles.iconBox}>
              <DollarSign size={20} />
            </div>
            <div>
              <h2 id="paygroup-detail-title" className={styles.title}>{payGroup.name}</h2>
              <span className={styles.codeBadge}>{payGroup.code}</span>
            </div>
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close modal">
            <X size={16} />
          </button>
        </header>

        <div className={styles.content}>
          {/* Main Info Grid */}
          <div className={styles.metaGrid}>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Pay Schedule</span>
              <span className={styles.metaValue}>{payGroup.paySchedule}</span>
            </div>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Pay Cycle</span>
              <span className={styles.metaValue}>{payGroup.payCycle}</span>
            </div>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Pay Day Rule</span>
              <span className={styles.metaValue}>{payGroup.payDay}</span>
            </div>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Salary Calculation</span>
              <span className={styles.metaValue}>{payGroup.salaryCalculationMethod}</span>
            </div>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Status</span>
              <div><StatusBadge status={payGroup.status} /></div>
            </div>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Covered Employees</span>
              <span className={styles.metaValue}>{payGroup.employeeCount || 0} Employees</span>
            </div>
          </div>

          {payGroup.description && (
            <div className={styles.descBox}>
              <span className={styles.descLabel}>Description:</span>
              <p className={styles.descText}>{payGroup.description}</p>
            </div>
          )}

          {/* Salary Components Breakdown */}
          <div className={styles.componentsSection}>
            <div className={styles.sectionHeader}>
              <h3 className={styles.sectionTitle}>
                Configured Salary Components ({assignedComponents.length})
              </h3>
              <span className={styles.componentSummary}>
                {earnings.length} Earnings, {deductions.length} Deductions
              </span>
            </div>

            <div className={styles.tableWrapper}>
              <table className={styles.compTable}>
                <thead>
                  <tr>
                    <th>Component Name</th>
                    <th>Code</th>
                    <th>Type</th>
                    <th>Calculation Rule</th>
                    <th>Taxable</th>
                  </tr>
                </thead>
                <tbody>
                  {assignedComponents.map((comp) => (
                    <tr key={comp.id}>
                      <td><span className={styles.compPrimary}>{comp.name}</span></td>
                      <td><span className={styles.compCodeBadge}>{comp.code}</span></td>
                      <td>
                        <span className={`${styles.typeBadge} ${comp.type === 'earning' ? styles.earning : styles.deduction}`}>
                          {comp.type === 'earning' ? '+ Earning' : '- Deduction'}
                        </span>
                      </td>
                      <td><span className={styles.calcText}>{comp.defaultValue || comp.calculationType || 'Fixed'}</span></td>
                      <td>
                        <span className={styles.taxText}>
                          {comp.taxable === 'taxable' ? 'Taxable' : 'Exempt'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <footer className={styles.footer}>
          <button type="button" className={styles.closeActionBtn} onClick={onClose}>
            Close
          </button>
        </footer>
      </div>
    </div>
  );
}

export default PayGroupDetailsModal;
