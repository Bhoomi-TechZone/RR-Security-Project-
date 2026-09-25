import React from 'react';
import { X, User, DollarSign, Calendar, ShieldCheck, Check, XCircle, FileText, ArrowRight } from 'lucide-react';
import styles from './RateRevisionDetailsDrawer.module.css';
import StatusBadge from '../common/StatusBadge';

export default function RateRevisionDetailsDrawer({
  isOpen,
  onClose,
  revision,
  record,
  onApprove,
  onReject
}) {
  const rev = record || revision;
  if (!isOpen || !rev) return null;

  const revId = rev.revisionId || rev.id;
  const clientName = rev.client || rev.clientName || '—';
  const siteName = rev.site || rev.siteName || '—';
  const status = rev.status || rev.revisionStatus || 'Pending Approval';

  return (
    <div className={styles.overlay} onClick={onClose}>
      <aside className={styles.drawer} onClick={(e) => e.stopPropagation()}>
        
        {/* Drawer Header */}
        <div className={styles.header}>
          <div className={styles.headerInfo}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 className={styles.title}>{revId}</h2>
              <StatusBadge status={status} />
            </div>
            <p className={styles.subtitle}>
              Created on {rev.createdAt || 'Recent'}
            </p>
          </div>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        {/* Drawer Body */}
        <div className={styles.body}>
          
          {/* 1. Employee Information */}
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>
              <User size={15} />
              <span>Employee Details</span>
            </h3>
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Employee Code</span>
                <span className={styles.infoValue}>{rev.employeeCode}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Employee Name</span>
                <span className={styles.infoValue}>{rev.employeeName}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Client Enterprise</span>
                <span className={styles.infoValue}>{clientName}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Site / Work Location</span>
                <span className={styles.infoValue}>{siteName}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Designation</span>
                <span className={styles.infoValue}>{rev.designation}</span>
              </div>
            </div>
          </section>

          {/* 2. Previous vs Revised Salary Comparison */}
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>
              <DollarSign size={15} />
              <span>Salary / Rate Comparison</span>
            </h3>
            
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', background: 'var(--surface-hover, #f8fafc)', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border, #e2e8f0)' }}>
                <thead>
                  <tr style={{ background: '#f1f5f9', color: '#475569', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>
                    <th style={{ padding: '10px 14px' }}>Salary Component</th>
                    <th style={{ padding: '10px 14px' }}>Previous Rate</th>
                    <th style={{ padding: '10px 14px' }}>Revised Rate</th>
                    <th style={{ padding: '10px 14px' }}>Difference</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '8px 14px', fontWeight: 600 }}>Basic Salary</td>
                    <td style={{ padding: '8px 14px', fontFamily: 'Consolas, monospace' }}>₹{rev.oldBasic?.toLocaleString()}</td>
                    <td style={{ padding: '8px 14px', fontFamily: 'Consolas, monospace', fontWeight: 600 }}>₹{rev.newBasic?.toLocaleString()}</td>
                    <td style={{ padding: '8px 14px', fontFamily: 'Consolas, monospace', color: '#16a34a' }}>+₹{(rev.newBasic - rev.oldBasic)?.toLocaleString()}</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '8px 14px', fontWeight: 600 }}>VDA</td>
                    <td style={{ padding: '8px 14px', fontFamily: 'Consolas, monospace' }}>₹{rev.oldVda?.toLocaleString()}</td>
                    <td style={{ padding: '8px 14px', fontFamily: 'Consolas, monospace', fontWeight: 600 }}>₹{rev.newVda?.toLocaleString()}</td>
                    <td style={{ padding: '8px 14px', fontFamily: 'Consolas, monospace', color: '#16a34a' }}>+₹{(rev.newVda - rev.oldVda)?.toLocaleString()}</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '8px 14px', fontWeight: 600 }}>HRA</td>
                    <td style={{ padding: '8px 14px', fontFamily: 'Consolas, monospace' }}>₹{rev.oldHra?.toLocaleString()}</td>
                    <td style={{ padding: '8px 14px', fontFamily: 'Consolas, monospace', fontWeight: 600 }}>₹{rev.newHra?.toLocaleString()}</td>
                    <td style={{ padding: '8px 14px', fontFamily: 'Consolas, monospace', color: '#16a34a' }}>+₹{(rev.newHra - rev.oldHra)?.toLocaleString()}</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '8px 14px', fontWeight: 600 }}>Other Allowances</td>
                    <td style={{ padding: '8px 14px', fontFamily: 'Consolas, monospace' }}>₹{rev.oldOtherAllowance?.toLocaleString()}</td>
                    <td style={{ padding: '8px 14px', fontFamily: 'Consolas, monospace', fontWeight: 600 }}>₹{rev.newOtherAllowance?.toLocaleString()}</td>
                    <td style={{ padding: '8px 14px', fontFamily: 'Consolas, monospace', color: '#16a34a' }}>+₹{(rev.newOtherAllowance - rev.oldOtherAllowance)?.toLocaleString()}</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '8px 14px', fontWeight: 600 }}>OT Rate (per hour)</td>
                    <td style={{ padding: '8px 14px', fontFamily: 'Consolas, monospace' }}>₹{rev.oldOtRate} / hr</td>
                    <td style={{ padding: '8px 14px', fontFamily: 'Consolas, monospace', fontWeight: 600 }}>₹{rev.newOtRate} / hr</td>
                    <td style={{ padding: '8px 14px', fontFamily: 'Consolas, monospace', color: '#16a34a' }}>+₹{rev.newOtRate - rev.oldOtRate} / hr</td>
                  </tr>
                  <tr style={{ background: '#eef2ff', fontWeight: 700 }}>
                    <td style={{ padding: '10px 14px', color: '#1e1b4b' }}>Total Gross Rate</td>
                    <td style={{ padding: '10px 14px', fontFamily: 'Consolas, monospace' }}>₹{rev.oldGross?.toLocaleString()}</td>
                    <td style={{ padding: '10px 14px', fontFamily: 'Consolas, monospace', color: '#4f46e5' }}>₹{rev.newGross?.toLocaleString()}</td>
                    <td style={{ padding: '10px 14px', fontFamily: 'Consolas, monospace', color: '#16a34a' }}>+₹{rev.rateDifference?.toLocaleString()}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* 3. Revision Information & Timeline */}
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>
              <Calendar size={15} />
              <span>Revision Details</span>
            </h3>
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Effective From Date</span>
                <span className={styles.infoValue} style={{ color: '#4f46e5', fontWeight: 700 }}>
                  {rev.effectiveFrom}
                </span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Revision Reason</span>
                <span className={styles.infoValue}>{rev.revisionReason}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Authorized By</span>
                <span className={styles.infoValue}>{rev.approvedBy || 'Pending Approval'}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Authorization Date</span>
                <span className={styles.infoValue}>{rev.approvalDate || 'Pending'}</span>
              </div>
              <div className={styles.infoItem} style={{ gridColumn: '1 / -1' }}>
                <span className={styles.infoLabel}>Remarks</span>
                <span className={styles.infoValue}>{rev.remarks || 'None'}</span>
              </div>
            </div>

            {rev.rejectionReason && (
              <div style={{ marginTop: '12px', padding: '10px 14px', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '6px', color: '#991b1b', fontSize: '12.5px' }}>
                <strong>Rejection Reason:</strong> {rev.rejectionReason}
              </div>
            )}
          </section>

          {/* 4. Arrear Summary */}
          {(status === 'Approved' || status === 'Effective') && (
            <section className={styles.section}>
              <h3 className={styles.sectionTitle}>
                <ShieldCheck size={15} />
                <span>Arrear Derivation Summary</span>
              </h3>
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '12px 16px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                <div>
                  <span style={{ fontSize: '11px', color: '#166534', textTransform: 'uppercase', fontWeight: 600 }}>Rate Difference</span>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: '#15803d' }}>+₹{rev.rateDifference?.toLocaleString()}/mo</div>
                </div>
                <div>
                  <span style={{ fontSize: '11px', color: '#166534', textTransform: 'uppercase', fontWeight: 600 }}>Effective Month</span>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: '#15803d' }}>{rev.effectiveFrom}</div>
                </div>
                <div>
                  <span style={{ fontSize: '11px', color: '#166534', textTransform: 'uppercase', fontWeight: 600 }}>Arrear Pipeline</span>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#15803d' }}>Mapped to Arrears tab</div>
                </div>
              </div>
            </section>
          )}

        </div>

        {/* Drawer Footer Actions */}
        <div className={styles.footer}>
          <div>
            <button type="button" className={styles.secondaryBtn} onClick={onClose}>
              Close
            </button>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {(status === 'Pending' || status === 'Pending Approval') && (
              <>
                <button
                  type="button"
                  className={styles.secondaryBtn}
                  style={{ color: '#dc2626', borderColor: '#fca5a5' }}
                  onClick={() => onReject && onReject(rev)}
                >
                  <XCircle size={15} />
                  <span>Reject</span>
                </button>
                <button
                  type="button"
                  className={styles.primaryBtn}
                  style={{ background: '#16a34a' }}
                  onClick={() => onApprove && onApprove(rev)}
                >
                  <Check size={15} />
                  <span>Approve Revision</span>
                </button>
              </>
            )}
          </div>
        </div>

      </aside>
    </div>
  );
}
