import React, { useState, useEffect } from 'react';
import { X, UserCheck, ShieldCheck, Calculator } from 'lucide-react';
import styles from './LeavePolicyAssignModal.module.css';

export default function LeavePolicyAssignModal({
  isOpen,
  onClose,
  onAssign,
  employees = [],
  policies = [],
  initialEmployee = null
}) {
  const [selectedEmpId, setSelectedEmpId] = useState('');
  const [selectedPolicy, setSelectedPolicy] = useState('');
  const [effectiveDate, setEffectiveDate] = useState('2026-09-01');
  const [openingBalances, setOpeningBalances] = useState({
    CL: 6,
    SL: 6,
    EL: 10,
    LWP: 0
  });

  const selectedEmployee = employees.find(e => (e.employeeCode || e.id) === selectedEmpId);

  useEffect(() => {
    if (initialEmployee) {
      setSelectedEmpId(initialEmployee.employeeCode || initialEmployee.id);
      setSelectedPolicy(initialEmployee.policyName || policies[0]?.name || '');
      if (initialEmployee.balances) {
        setOpeningBalances({
          CL: initialEmployee.balances.CL?.opening ?? 6,
          SL: initialEmployee.balances.SL?.opening ?? 6,
          EL: initialEmployee.balances.EL?.opening ?? 10,
          LWP: initialEmployee.balances.LWP?.opening ?? 0
        });
      }
    } else if (employees.length > 0) {
      setSelectedEmpId(employees[0].employeeCode || employees[0].id);
      setSelectedPolicy(policies[0]?.name || '');
    }
  }, [initialEmployee, employees, policies, isOpen]);

  if (!isOpen) return null;

  const handleBalanceChange = (code, val) => {
    setOpeningBalances(prev => ({
      ...prev,
      [code]: Number(val) || 0
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedEmployee) return;

    onAssign({
      employeeCode: selectedEmployee.employeeCode || selectedEmployee.id,
      policyName: selectedPolicy,
      effectiveDate,
      openingBalances
    });
  };

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true">
      <div className={styles.modalCard}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerTitleWrap}>
            <div className={styles.headerIcon}>
              <ShieldCheck size={18} />
            </div>
            <div>
              <h2 className={styles.title}>Assign Employee Leave Policy</h2>
              <p className={styles.subtitle}>Map enterprise leave quota rules & initialize opening balance</p>
            </div>
          </div>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <form id="assignPolicyForm" onSubmit={handleSubmit} className={styles.body}>
          {/* Employee Selection */}
          <div className={styles.formGroup}>
            <label className={styles.label}>Select Employee <span className={styles.req}>*</span></label>
            <select
              className={styles.select}
              value={selectedEmpId}
              onChange={(e) => setSelectedEmpId(e.target.value)}
            >
              {employees.map((emp) => (
                <option key={emp.employeeCode || emp.id} value={emp.employeeCode || emp.id}>
                  {emp.employeeCode || emp.id} - {emp.employeeName || emp.name} ({emp.designation || 'Staff'})
                </option>
              ))}
            </select>
          </div>

          {/* Employee Auto-populated Card */}
          {selectedEmployee && (
            <div className={styles.employeeInfoCard}>
              <div className={styles.infoRow}>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Category / Designation:</span>
                  <span className={styles.infoVal}>{selectedEmployee.designation || 'Security Guard'}</span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Department:</span>
                  <span className={styles.infoVal}>{selectedEmployee.department || 'Security'}</span>
                </div>
              </div>
              <div className={styles.infoRow}>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Client & Site:</span>
                  <span className={styles.infoVal}>{selectedEmployee.client} — {selectedEmployee.site}</span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Joining Date:</span>
                  <span className={styles.infoVal}>{selectedEmployee.joiningDate || '2023-01-01'}</span>
                </div>
              </div>
            </div>
          )}

          {/* Policy & Effective Date */}
          <div className={styles.grid2}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Select Leave Policy <span className={styles.req}>*</span></label>
              <select
                className={styles.select}
                value={selectedPolicy}
                onChange={(e) => setSelectedPolicy(e.target.value)}
              >
                {policies.map((pol) => (
                  <option key={pol.id} value={pol.name}>{pol.name}</option>
                ))}
              </select>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Effective From Date</label>
              <input
                type="date"
                className={styles.input}
                value={effectiveDate}
                onChange={(e) => setEffectiveDate(e.target.value)}
              />
            </div>
          </div>

          {/* Initial Opening Balances */}
          <div className={styles.balanceSection}>
            <div className={styles.balanceHeader}>
              <Calculator size={15} />
              <span>Initial / Carried Forward Opening Balance (Days)</span>
            </div>
            <div className={styles.balanceGrid}>
              <div className={styles.balanceItem}>
                <label className={styles.balanceLabel}>CL (Casual)</label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  className={styles.balanceInput}
                  value={openingBalances.CL}
                  onChange={(e) => handleBalanceChange('CL', e.target.value)}
                />
              </div>
              <div className={styles.balanceItem}>
                <label className={styles.balanceLabel}>SL (Sick)</label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  className={styles.balanceInput}
                  value={openingBalances.SL}
                  onChange={(e) => handleBalanceChange('SL', e.target.value)}
                />
              </div>
              <div className={styles.balanceItem}>
                <label className={styles.balanceLabel}>EL (Earned)</label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  className={styles.balanceInput}
                  value={openingBalances.EL}
                  onChange={(e) => handleBalanceChange('EL', e.target.value)}
                />
              </div>
              <div className={styles.balanceItem}>
                <label className={styles.balanceLabel}>LWP</label>
                <input
                  type="number"
                  min="0"
                  className={styles.balanceInput}
                  value={openingBalances.LWP}
                  onChange={(e) => handleBalanceChange('LWP', e.target.value)}
                />
              </div>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className={styles.footer}>
          <button type="button" className={styles.cancelBtn} onClick={onClose}>Cancel</button>
          <button type="submit" form="assignPolicyForm" className={styles.saveBtn}>
            <UserCheck size={16} />
            <span>Confirm Assignment</span>
          </button>
        </div>
      </div>
    </div>
  );
}
