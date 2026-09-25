import React from 'react';
import { X, Calculator, User, DollarSign, Calendar, ShieldCheck, CheckCheck, RefreshCw, FileText } from 'lucide-react';
import styles from './ArrearsDetailsDrawer.module.css';

export default function ArrearsDetailsDrawer({
  isOpen,
  onClose,
  arrear,
  record,
  onIncludeInPayroll,
  onRecalculate
}) {
  const arr = record || arrear;
  if (!isOpen || !arr) return null;

  const arrId = arr.arrearId || arr.id;
  const clientName = arr.client || arr.clientName || '—';
  const siteName = arr.site || arr.siteName || '—';
  const revRate = arr.revisedRate ?? arr.newRate ?? (arr.oldRate + (arr.difference || arr.rateDifference || 0));
  const diff = arr.difference ?? arr.rateDifference ?? (revRate - (arr.oldRate || 0));
  const pStatus = arr.payrollStatus || 'Pending Calculation';
  const amount = arr.arrearAmount ?? Math.round((diff / 30) * (arr.applicableDays || 30));

  return (
    <div className={styles.overlay} onClick={onClose}>
      <aside className={styles.drawer} onClick={(e) => e.stopPropagation()}>
        
        {/* Drawer Header */}
        <div className={styles.header}>
          <div className={styles.headerInfo}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 className={styles.title}>{arrId}</h2>
              <span style={{ fontSize: '12px', padding: '3px 8px', borderRadius: '4px', background: pStatus === 'Included in Payroll' ? '#dcfce7' : '#eef2ff', color: pStatus === 'Included in Payroll' ? '#15803d' : '#4338ca', fontWeight: 600 }}>
                {pStatus}
              </span>
            </div>
            {arr.revisionId && (
              <p className={styles.subtitle}>
                Linked to Rate Revision: <strong>{arr.revisionId}</strong>
              </p>
            )}
          </div>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        {/* Drawer Body */}
        <div className={styles.body}>
          
          {/* 1. Employee Details */}
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>
              <User size={15} />
              <span>Employee Information</span>
            </h3>
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Employee Code</span>
                <span className={styles.infoValue}>{arr.employeeCode}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Employee Name</span>
                <span className={styles.infoValue}>{arr.employeeName}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Client Enterprise</span>
                <span className={styles.infoValue}>{clientName}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Site Location</span>
                <span className={styles.infoValue}>{siteName}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Designation</span>
                <span className={styles.infoValue}>{arr.designation}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Arrear Month</span>
                <span className={styles.infoValue} style={{ fontWeight: 700, color: '#0f172a' }}>{arr.arrearMonth || 'August 2026'}</span>
              </div>
            </div>
          </section>

          {/* 2. Rate Difference Breakdown */}
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>
              <DollarSign size={15} />
              <span>Rate Difference Summary</span>
            </h3>
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '14px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
              <div>
                <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Previous Rate</span>
                <div style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', fontFamily: 'Consolas, monospace' }}>
                  ₹{Number(arr.oldRate || 0).toLocaleString()}
                </div>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Revised Rate</span>
                <div style={{ fontSize: '16px', fontWeight: 700, color: '#4f46e5', fontFamily: 'Consolas, monospace' }}>
                  ₹{Number(revRate || 0).toLocaleString()}
                </div>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Monthly Difference</span>
                <div style={{ fontSize: '16px', fontWeight: 700, color: '#16a34a', fontFamily: 'Consolas, monospace' }}>
                  +₹{Number(diff || 0).toLocaleString()}
                </div>
              </div>
            </div>
          </section>

          {/* 3. Arrears Calculation Formula */}
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>
              <Calculator size={15} />
              <span>Arrear Formula &amp; Calculation</span>
            </h3>
            
            <div style={{ background: '#eef2ff', border: '1px solid #c7d2fe', borderRadius: '8px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <span style={{ fontSize: '11.5px', fontWeight: 700, color: '#4338ca', textTransform: 'uppercase' }}>
                Standard Calculation Formula
              </span>
              <code style={{ fontSize: '13.5px', color: '#1e1b4b', fontWeight: 700, background: 'white', padding: '8px 12px', borderRadius: '6px', border: '1px solid #e0e7ff', display: 'block' }}>
                Arrear = (New Rate - Old Rate) × Applicable Days / Month Days
              </code>
              <p style={{ margin: '4px 0 0', fontSize: '12.5px', color: '#3730a3', lineHeight: '1.4' }}>
                {arr.calculationNotes || `Calculated for ${arr.applicableDays || 30} applicable days based on monthly difference.`}
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginTop: '12px' }}>
              <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Applicable Days</span>
                <div style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>{arr.applicableDays || 30} Days</div>
              </div>
              <div style={{ background: '#f0fdf4', padding: '12px', borderRadius: '6px', border: '1px solid #bbf7d0' }}>
                <span style={{ fontSize: '11px', color: '#166534', textTransform: 'uppercase', fontWeight: 600 }}>Payable Arrear Amount</span>
                <div style={{ fontSize: '18px', fontWeight: 800, color: '#15803d', fontFamily: 'Consolas, monospace' }}>
                  ₹{Number(amount || 0).toLocaleString()}
                </div>
              </div>
            </div>
          </section>

          {/* 4. Statutory & Payroll Integration */}
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>
              <ShieldCheck size={15} />
              <span>Statutory Compliance &amp; Payroll Head</span>
            </h3>
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>PF Deductible</span>
                <span className={styles.infoValue}>{arr.pfApplicable !== false ? 'Yes (Applicable on Arrear Basic)' : 'No'}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>ESI Deductible</span>
                <span className={styles.infoValue}>{arr.esiApplicable ? 'Yes (Applicable on Arrear Gross)' : 'No (Wage Exceeded)'}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Salary Slip Head</span>
                <span className={styles.infoValue}>Arrears / Rate Revision Diff</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Target Payroll Cycle</span>
                <span className={styles.infoValue}>{arr.payrollMonth || 'August 2026'} Payroll Batch</span>
              </div>
            </div>
          </section>

        </div>

        {/* Drawer Footer Actions */}
        <div className={styles.footer}>
          <div>
            <button type="button" className={styles.secondaryBtn} onClick={onClose}>
              Close
            </button>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {pStatus !== 'Included in Payroll' && onRecalculate && (
              <button
                type="button"
                className={styles.secondaryBtn}
                onClick={() => onRecalculate(arr)}
              >
                <RefreshCw size={14} />
                <span>Recalculate</span>
              </button>
            )}

            {pStatus === 'Calculated' && onIncludeInPayroll && (
              <button
                type="button"
                className={styles.primaryBtn}
                onClick={() => onIncludeInPayroll(arr)}
              >
                <CheckCheck size={15} />
                <span>Include in Payroll</span>
              </button>
            )}
          </div>
        </div>

      </aside>
    </div>
  );
}
