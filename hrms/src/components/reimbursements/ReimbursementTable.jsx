import React from 'react';
import { Eye, Check, X, Wallet, CheckCircle2, XCircle, Clock, AlertCircle, CheckCheck, RefreshCw } from 'lucide-react';
import styles from '../../pages/admin/Reimbursements.module.css';

export default function ReimbursementTable({
  claims,
  onViewDetails,
  onApprove,
  onReject,
  onProcessPayment
}) {
  return (
    <div className={styles.tableContainer}>
      <table className={styles.dataTable}>
        <thead>
          <tr>
            <th style={{ minWidth: '130px', whiteSpace: 'nowrap' }}>Claim ID</th>
            <th style={{ minWidth: '180px', whiteSpace: 'nowrap' }}>Employee</th>
            <th style={{ minWidth: '160px' }}>Department &amp; Site</th>
            <th style={{ minWidth: '110px', whiteSpace: 'nowrap' }}>Expense Date</th>
            <th style={{ minWidth: '160px', whiteSpace: 'nowrap' }}>Expense Type</th>
            <th style={{ minWidth: '110px', whiteSpace: 'nowrap' }}>Claimed</th>
            <th style={{ minWidth: '110px', whiteSpace: 'nowrap' }}>Approved</th>
            <th style={{ minWidth: '160px', whiteSpace: 'nowrap' }}>Approval Status</th>
            <th style={{ minWidth: '110px', whiteSpace: 'nowrap' }}>Payment</th>
            <th style={{ minWidth: '160px', whiteSpace: 'nowrap' }}>Current Approver</th>
            <th style={{ textAlign: 'right', minWidth: '110px', whiteSpace: 'nowrap' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {claims.length === 0 ? (
            <tr>
              <td colSpan={11} style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                No reimbursement claims found matching the filter criteria.
              </td>
            </tr>
          ) : (
            claims.map((claim) => (
              <tr key={claim._id || claim.id || claim.claimId}>
                <td style={{ whiteSpace: 'nowrap' }}>
                  <button
                    type="button"
                    className={styles.breadcrumbLink}
                    style={{ fontWeight: 700, color: '#4f46e5', fontFamily: 'Consolas, monospace' }}
                    onClick={() => onViewDetails(claim)}
                  >
                    {claim.claimId}
                  </button>
                  <div style={{ fontSize: '11px', color: '#94a3b8' }}>{claim.submittedDate || claim.expenseDate}</div>
                </td>
                <td style={{ whiteSpace: 'nowrap' }}>
                  <div className={styles.empCell}>
                    <div className={styles.empAvatar}>
                      {(claim.employeeName || 'EM').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                    <div className={styles.empInfo}>
                      <span className={styles.empName}>{claim.employeeName}</span>
                      <span className={styles.empCode}>{claim.employeeCode || claim.employeeId}</span>
                    </div>
                  </div>
                </td>
                <td>
                  <div style={{ fontWeight: 600, color: '#0f172a' }}>{claim.department || 'General'}</div>
                  <div style={{ fontSize: '11.5px', color: '#64748b' }}>{claim.site || 'Main Site'}</div>
                </td>
                <td style={{ whiteSpace: 'nowrap' }}>
                  <span style={{ fontSize: '12.5px', color: '#334155' }}>{claim.expenseDate}</span>
                </td>
                <td style={{ whiteSpace: 'nowrap' }}>
                  <span style={{ fontSize: '12px', background: '#f1f5f9', color: '#475569', padding: '3px 8px', borderRadius: '4px', fontWeight: 600 }}>
                    {claim.expenseType}
                  </span>
                </td>
                <td style={{ whiteSpace: 'nowrap' }}>
                  <span className={styles.amountVal}>₹{Number(claim.claimedAmount || claim.amount || 0).toLocaleString('en-IN')}</span>
                </td>
                <td style={{ whiteSpace: 'nowrap' }}>
                  {Number(claim.approvedAmount || 0) > 0 ? (
                    <span className={styles.approvedAmountVal}>₹{Number(claim.approvedAmount).toLocaleString('en-IN')}</span>
                  ) : (
                    <span style={{ color: '#94a3b8', fontSize: '12.5px' }}>-</span>
                  )}
                </td>
                <td style={{ whiteSpace: 'nowrap' }}>
                  <TableApprovalBadge status={claim.approvalStatus} />
                </td>
                <td style={{ whiteSpace: 'nowrap' }}>
                  <TablePaymentBadge status={claim.paymentStatus} />
                </td>
                <td style={{ whiteSpace: 'nowrap' }}>
                  <span style={{ fontSize: '12px', color: '#475569', fontWeight: 500 }}>
                    {claim.currentApprover}
                  </span>
                </td>
                <td style={{ whiteSpace: 'nowrap' }}>
                  <div className={styles.actionBtns}>
                    {/* View Detail Drawer */}
                    <button
                      type="button"
                      className={styles.iconBtn}
                      title="View Details"
                      onClick={() => onViewDetails(claim)}
                    >
                      <Eye size={14} />
                    </button>

                    {/* Approve Action */}
                    {(claim.approvalStatus.includes('Pending') || claim.approvalStatus === 'Submitted') && (
                      <button
                        type="button"
                        className={`${styles.iconBtn} ${styles.iconBtnApprove}`}
                        title="Approve Claim"
                        onClick={() => onApprove(claim)}
                      >
                        <Check size={14} />
                      </button>
                    )}

                    {/* Reject Action */}
                    {(claim.approvalStatus.includes('Pending') || claim.approvalStatus === 'Submitted') && (
                      <button
                        type="button"
                        className={`${styles.iconBtn} ${styles.iconBtnReject}`}
                        title="Reject Claim"
                        onClick={() => onReject(claim)}
                      >
                        <X size={14} />
                      </button>
                    )}

                    {/* Process Payment Action */}
                    {claim.approvalStatus === 'Approved' && claim.paymentStatus !== 'Paid' && (
                      <button
                        type="button"
                        className={`${styles.iconBtn} ${styles.iconBtnPay}`}
                        title="Process Payment"
                        onClick={() => onProcessPayment(claim)}
                      >
                        <Wallet size={14} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

function TableApprovalBadge({ status }) {
  if (status === 'Approved') {
    return <span className={`${styles.badge} ${styles.badgeApproved}`}><CheckCircle2 size={12} /> Approved</span>;
  }
  if (status.includes('Pending') || status === 'Submitted') {
    return <span className={`${styles.badge} ${styles.badgePending}`}><Clock size={12} /> {status}</span>;
  }
  if (status === 'Rejected') {
    return <span className={`${styles.badge} ${styles.badgeRejected}`}><XCircle size={12} /> Rejected</span>;
  }
  if (status === 'Sent Back') {
    return <span className={`${styles.badge} ${styles.badgeSentBack}`}><AlertCircle size={12} /> Sent Back</span>;
  }
  return <span className={styles.badge}>{status}</span>;
}

function TablePaymentBadge({ status }) {
  if (status === 'Paid') {
    return <span className={`${styles.badge} ${styles.badgePaid}`}><CheckCheck size={12} /> Paid</span>;
  }
  if (status === 'Processing') {
    return <span className={`${styles.badge} ${styles.badgeProcessing}`}><RefreshCw size={12} /> Processing</span>;
  }
  return <span className={`${styles.badge} ${styles.badgeUnpaid}`}><Clock size={12} /> Unpaid</span>;
}
