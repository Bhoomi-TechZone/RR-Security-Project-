import React, { useState, useEffect, useRef } from 'react';
import { X, RefreshCw } from 'lucide-react';
import styles from './TransferEmployeeModal.module.css';

/**
 * TransferEmployeeModal Component
 * Allows transferring an employee to a different client company, site, and effective date.
 */
function TransferEmployeeModal({
  isOpen,
  employee,
  onClose,
  onTransfer,
  clients = []
}) {
  const [targetCompanyId, setTargetCompanyId] = useState('');
  const [site, setSite] = useState('');
  const [effectiveDate, setEffectiveDate] = useState('');
  const [error, setError] = useState('');
  
  const modalRef = useRef(null);

  // Initialize form when open
  useEffect(() => {
    if (isOpen && employee) {
      setTargetCompanyId('');
      setSite('');
      setEffectiveDate(new Date().toISOString().split('T')[0]); // Default to today
      setError('');
    }
  }, [isOpen, employee]);

  // Focus modal for keyboard navigation when opened
  useEffect(() => {
    if (isOpen && modalRef.current) {
      modalRef.current.focus();
    }
  }, [isOpen]);

  // Escape key closes modal
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !employee) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!targetCompanyId) {
      setError('Please select a company to transfer to.');
      return;
    }
    if (!site.trim()) {
      setError('Please specify the site name.');
      return;
    }
    if (!effectiveDate) {
      setError('Please select an effective date.');
      return;
    }

    const selectedCompany = clients.find(c => (c.clientId === targetCompanyId || c.id === targetCompanyId || c._id === targetCompanyId));
    if (!selectedCompany) {
      setError('Invalid company selected.');
      return;
    }

    const targetClientId = selectedCompany.clientId || selectedCompany.id || selectedCompany._id;
    onTransfer(employee.id || employee._id || employee.employeeId, {
      clientId: targetClientId,
      clientName: selectedCompany.name,
      companyId: targetClientId,
      companyName: selectedCompany.name,
      site: site.trim(),
      siteLocation: site.trim(),
      effectiveDate
    });
  };

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-labelledby="transfer-modal-title">
      <div 
        ref={modalRef}
        tabIndex="-1"
        className={styles.modal} 
        onClick={(e) => e.stopPropagation()}
      >
        <header className={styles.header}>
          <div className={styles.headerTitleRow}>
            <div className={styles.iconWrap}>
              <RefreshCw size={18} strokeWidth={2.5} />
            </div>
            <h2 id="transfer-modal-title" className={styles.title}>Transfer Employee</h2>
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close modal">
            <X size={16} />
          </button>
        </header>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.employeeSummary}>
            <div className={styles.summaryRow}>
              <span className={styles.label}>Employee:</span>
              <span className={styles.value}>{employee.name} ({employee.employeeId})</span>
            </div>
            <div className={styles.summaryRow}>
              <span className={styles.label}>Current Company:</span>
              <span className={styles.value}>{employee.companyName || employee.clientName || 'N/A'}</span>
            </div>
            <div className={styles.summaryRow}>
              <span className={styles.label}>Current Site:</span>
              <span className={styles.value}>{employee.site || employee.siteLocation || 'N/A'}</span>
            </div>
          </div>

          <hr className={styles.divider} />

          <h3 className={styles.sectionTitle}>Transfer Details</h3>

          {error && <div className={styles.errorAlert} role="alert">{error}</div>}

          <div className={styles.field}>
            <label htmlFor="transfer-company" className={styles.fieldLabel}>Transfer To Client Company *</label>
            <div className={styles.selectWrapper}>
              <select
                id="transfer-company"
                className={styles.select}
                value={targetCompanyId}
                onChange={(e) => {
                  setTargetCompanyId(e.target.value);
                  setError('');
                }}
                required
              >
                <option value="">Select Client Company</option>
                {clients.map((c) => {
                  const val = c.clientId || c.id || c._id;
                  return (
                    <option key={val} value={val}>
                      {c.name}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          <div className={styles.field}>
            <label htmlFor="transfer-site" className={styles.fieldLabel}>Site *</label>
            <input
              id="transfer-site"
              type="text"
              className={styles.input}
              placeholder="e.g. Main Gate, Warehouse A"
              value={site}
              onChange={(e) => {
                setSite(e.target.value);
                setError('');
              }}
              required
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="transfer-date" className={styles.fieldLabel}>Effective Date *</label>
            <input
              id="transfer-date"
              type="date"
              className={styles.input}
              value={effectiveDate}
              onChange={(e) => {
                setEffectiveDate(e.target.value);
                setError('');
              }}
              required
            />
          </div>

          <div className={styles.actions}>
            <button type="button" className={styles.cancelBtn} onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className={styles.submitBtn}>
              Transfer Employee
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default TransferEmployeeModal;
