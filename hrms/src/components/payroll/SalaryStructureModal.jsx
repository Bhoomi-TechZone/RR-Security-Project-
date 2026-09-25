import React, { useState, useEffect } from 'react';
import { X, Save, IndianRupee } from 'lucide-react';
import { formatRupee } from '../../utils/payrollUtils';
import styles from './SalaryStructureModal.module.css';

export default function SalaryStructureModal({
  isOpen,
  record,
  onClose,
  onSave
}) {
  const [formData, setFormData] = useState({
    basicSalary: 0,
    hra: 0,
    transportAllowance: 0,
    otherAllowance: 0,
    pf: 0,
    esi: 0,
    otherDeduction: 0,
  });

  useEffect(() => {
    if (record) {
      setFormData({
        basicSalary: record.basicSalary || 0,
        hra: record.hra || 0,
        transportAllowance: record.transportAllowance || 0,
        otherAllowance: record.otherAllowance || 0,
        pf: record.pf || 0,
        esi: record.esi || 0,
        otherDeduction: record.otherDeduction || 0,
      });
    }
  }, [record, isOpen]);

  if (!isOpen || !record) return null;

  const handleChange = (field, value) => {
    const num = Math.max(0, parseInt(value, 10) || 0);
    setFormData((prev) => {
      const next = { ...prev, [field]: num };
      // Auto-compute PF if basic changes (optional helper)
      if (field === 'basicSalary') {
        next.pf = Math.round(num * 0.12);
        // HRA standard default 40% if wanted
      }
      return next;
    });
  };

  const totalAllowances = Number(formData.transportAllowance) + Number(formData.otherAllowance);
  const grossSalary = Number(formData.basicSalary) + Number(formData.hra) + totalAllowances;
  const totalDeductions = Number(formData.pf) + Number(formData.esi) + Number(formData.otherDeduction);
  const netSalary = grossSalary - totalDeductions;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...record,
      basicSalary: Number(formData.basicSalary),
      hra: Number(formData.hra),
      transportAllowance: Number(formData.transportAllowance),
      otherAllowance: Number(formData.otherAllowance),
      pf: Number(formData.pf),
      esi: Number(formData.esi),
      otherDeduction: Number(formData.otherDeduction),
      grossSalary,
      totalDeductions,
      netSalary: Math.max(0, netSalary)
    });
  };

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true">
      <div className={styles.modal}>
        <div className={styles.header}>
          <div>
            <h2>Edit Salary Structure</h2>
            <p className={styles.subtext}>
              {record.employeeName} ({record.employeeId}) • {record.designation}
            </p>
          </div>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.body}>
            {/* Earnings inputs */}
            <div className={styles.section}>
              <h3 className={styles.sectionHeading}>Earnings Components</h3>
              <div className={styles.grid}>
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>Basic Salary (₹)</label>
                  <input
                    type="number"
                    min="0"
                    step="500"
                    className={styles.input}
                    value={formData.basicSalary}
                    onChange={(e) => handleChange('basicSalary', e.target.value)}
                    required
                  />
                </div>

                <div className={styles.field}>
                  <label className={styles.fieldLabel}>House Rent Allowance (HRA) (₹)</label>
                  <input
                    type="number"
                    min="0"
                    step="500"
                    className={styles.input}
                    value={formData.hra}
                    onChange={(e) => handleChange('hra', e.target.value)}
                  />
                </div>

                <div className={styles.field}>
                  <label className={styles.fieldLabel}>Transport Allowance (₹)</label>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    className={styles.input}
                    value={formData.transportAllowance}
                    onChange={(e) => handleChange('transportAllowance', e.target.value)}
                  />
                </div>

                <div className={styles.field}>
                  <label className={styles.fieldLabel}>Other Allowance (₹)</label>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    className={styles.input}
                    value={formData.otherAllowance}
                    onChange={(e) => handleChange('otherAllowance', e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Deductions inputs */}
            <div className={styles.section}>
              <h3 className={styles.sectionHeading}>Deductions</h3>
              <div className={styles.grid}>
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>PF Contribution (₹)</label>
                  <input
                    type="number"
                    min="0"
                    className={styles.input}
                    value={formData.pf}
                    onChange={(e) => handleChange('pf', e.target.value)}
                  />
                </div>

                <div className={styles.field}>
                  <label className={styles.fieldLabel}>ESI Contribution (₹)</label>
                  <input
                    type="number"
                    min="0"
                    className={styles.input}
                    value={formData.esi}
                    onChange={(e) => handleChange('esi', e.target.value)}
                  />
                </div>

                <div className={styles.field}>
                  <label className={styles.fieldLabel}>Other Deduction (₹)</label>
                  <input
                    type="number"
                    min="0"
                    className={styles.input}
                    value={formData.otherDeduction}
                    onChange={(e) => handleChange('otherDeduction', e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Live calculation preview */}
            <div className={styles.previewBox}>
              <div className={styles.previewTile}>
                <span>Gross Salary</span>
                <strong className={styles.textGreen}>{formatRupee(grossSalary)}</strong>
              </div>
              <div className={styles.previewTile}>
                <span>Total Deductions</span>
                <strong className={styles.textRed}>-{formatRupee(totalDeductions)}</strong>
              </div>
              <div className={`${styles.previewTile} ${styles.previewTileNet}`}>
                <span>Net Fixed Salary</span>
                <strong className={styles.textPrimary}>{formatRupee(netSalary)}</strong>
              </div>
            </div>
          </div>

          <div className={styles.footer}>
            <button
              type="button"
              className={styles.cancelBtn}
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={styles.saveBtn}
            >
              <Save size={16} />
              <span>Save Changes</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
