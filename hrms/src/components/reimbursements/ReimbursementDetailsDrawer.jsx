import React from 'react';
import { 
  X, Layers, User, Receipt, FileCheck, FileText, 
  ExternalLink, Download, AlertCircle, XCircle, 
  ShieldCheck, CreditCard, Landmark, Wallet 
} from 'lucide-react';
import styles from '../../pages/admin/Reimbursements.module.css';

import ReimbursementApprovalStepper from './ReimbursementApprovalStepper';
import ReimbursementApprovalHistory from './ReimbursementApprovalHistory';
import ReimbursementPayrollSection from './ReimbursementPayrollSection';

export default function ReimbursementDetailsDrawer({
  claim,
  onClose,
  onApprove,
  onReject,
  onSendBack,
  onProcessPayment,
  onToast
}) {
  if (!claim) return null;

  return (
    <div className={styles.drawerOverlay} onClick={onClose}>
      <div className={styles.drawer} onClick={(e) => e.stopPropagation()}>
        
        <div className={styles.drawerHeader}>
          <div className={styles.drawerTitleWrap}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 className={styles.drawerTitle}>{claim.claimId}</h2>
              <DrawerApprovalBadge status={claim.approvalStatus} />
              <DrawerPaymentBadge status={claim.paymentStatus} />
            </div>
            <span className={styles.drawerSubtitle}>
              Submitted on {claim.submittedDate}
            </span>
          </div>
          <button
            type="button"
            className={styles.iconBtn}
            onClick={onClose}
            aria-label="Close Drawer"
          >
            <X size={16} />
          </button>
        </div>

        <div className={styles.drawerBody}>
          
          {/* Visual Approval Stepper */}
          <div className={styles.drawerSection}>
            <span className={styles.sectionTitle}>
              <Layers size={15} color="#4f46e5" />
              Approval &amp; Settlement Lifecycle
            </span>
            <ReimbursementApprovalStepper claim={claim} />
          </div>

          {/* Section A: Employee Information */}
          <div className={styles.drawerSection}>
            <span className={styles.sectionTitle}>
              <User size={15} color="#4f46e5" />
              A. Employee Information
            </span>
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Employee Code</span>
                <span className={styles.infoVal}>{claim.employeeCode}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Employee Name</span>
                <span className={styles.infoVal}>{claim.employeeName}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Department</span>
                <span className={styles.infoVal}>{claim.department}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Designation</span>
                <span className={styles.infoVal}>{claim.designation}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Client / Enterprise</span>
                <span className={styles.infoVal}>{claim.client}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Site / Work Location</span>
                <span className={styles.infoVal}>{claim.site}</span>
              </div>
            </div>
          </div>

          {/* Section B: Expense Information */}
          <div className={styles.drawerSection}>
            <span className={styles.sectionTitle}>
              <Receipt size={15} color="#4f46e5" />
              B. Expense Details
            </span>
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Expense Date</span>
                <span className={styles.infoVal}>{claim.expenseDate}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Expense Category</span>
                <span className={styles.infoVal}>{claim.expenseType}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Claimed Amount</span>
                <span className={styles.infoVal} style={{ fontSize: '15px', color: '#0f172a' }}>
                  ₹{claim.amount.toLocaleString()}
                </span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Approved Amount</span>
                <span className={styles.infoVal} style={{ fontSize: '15px', color: '#16a34a' }}>
                  {claim.approvedAmount > 0 ? `₹${claim.approvedAmount.toLocaleString()}` : 'Pending Evaluation'}
                </span>
              </div>
              <div className={styles.infoItem} style={{ gridColumn: '1 / -1' }}>
                <span className={styles.infoLabel}>Purpose / Remark</span>
                <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#334155', lineHeight: '1.5' }}>
                  {claim.purpose}
                </p>
              </div>
            </div>
          </div>

          {/* Section C: Receipt Viewer */}
          <div className={styles.drawerSection}>
            <span className={styles.sectionTitle}>
              <FileCheck size={15} color="#4f46e5" />
              C. Uploaded Bill / Receipt
            </span>
            {claim.receipt ? (
              <div className={styles.receiptCard}>
                <div className={styles.receiptLeft}>
                  <div className={styles.receiptIcon}>
                    <FileText size={20} />
                  </div>
                  <div className={styles.receiptMeta}>
                    <span className={styles.receiptName}>{claim.receipt.fileName}</span>
                    <span className={styles.receiptSize}>
                      {claim.receipt.fileSize} • Uploaded {claim.receipt.uploadedAt}
                    </span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    className={styles.btnSecondary}
                    style={{ padding: '6px 10px', fontSize: '12px' }}
                    onClick={() => onToast && onToast(`Opening ${claim.receipt.fileName}...`, 'info')}
                  >
                    <ExternalLink size={13} />
                    <span>Preview</span>
                  </button>
                  <button
                    type="button"
                    className={styles.btnSecondary}
                    style={{ padding: '6px 10px', fontSize: '12px' }}
                    onClick={() => onToast && onToast(`Downloading ${claim.receipt.fileName}...`, 'info')}
                  >
                    <Download size={13} />
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ fontSize: '12.5px', color: '#94a3b8', fontStyle: 'italic' }}>
                No receipt uploaded for this claim.
              </div>
            )}
          </div>

          {/* Rejection / Send-back Notice if present */}
          {claim.rejectionReason && (
            <div className={`${styles.calloutBox} ${styles.calloutBoxWarning}`} style={{ borderColor: '#fca5a5', background: '#fef2f2', color: '#991b1b' }}>
              <XCircle size={18} style={{ flexShrink: 0 }} />
              <div>
                <strong>Rejection Reason:</strong> {claim.rejectionReason}
              </div>
            </div>
          )}

          {claim.sendBackReason && (
            <div className={`${styles.calloutBox} ${styles.calloutBoxWarning}`}>
              <AlertCircle size={18} style={{ flexShrink: 0 }} />
              <div>
                <strong>Correction Required:</strong> {claim.sendBackReason}
              </div>
            </div>
          )}

          {/* Section D: Approval History Audit Trail */}
          <div className={styles.drawerSection}>
            <span className={styles.sectionTitle}>
              <ShieldCheck size={15} color="#4f46e5" />
              D. Approval History &amp; Audit Trail
            </span>
            <ReimbursementApprovalHistory history={claim.approvalHistory} />
          </div>

          {/* Section E: Payment Settlement Information */}
          <div className={styles.drawerSection}>
            <span className={styles.sectionTitle}>
              <CreditCard size={15} color="#4f46e5" />
              E. Payment &amp; Settlement Details
            </span>
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Payment Status</span>
                <DrawerPaymentBadge status={claim.paymentStatus} />
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Paid Amount</span>
                <span className={styles.infoVal} style={{ color: claim.paidAmount > 0 ? '#15803d' : '#64748b' }}>
                  {claim.paidAmount > 0 ? `₹${claim.paidAmount.toLocaleString()}` : 'Not Paid'}
                </span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Payment Mode</span>
                <span className={styles.infoVal}>{claim.paymentMode || 'N/A'}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Payment Date</span>
                <span className={styles.infoVal}>{claim.paymentDate || 'Pending'}</span>
              </div>
              <div className={styles.infoItem} style={{ gridColumn: '1 / -1' }}>
                <span className={styles.infoLabel}>UTR / Transaction Number</span>
                <span className={styles.infoVal} style={{ fontFamily: 'Consolas, monospace' }}>
                  {claim.transactionNumber || 'Pending settlement'}
                </span>
              </div>
            </div>
          </div>

          {/* Section F: Payroll Integration */}
          <div className={styles.drawerSection}>
            <span className={styles.sectionTitle}>
              <Landmark size={15} color="#4f46e5" />
              F. Payroll Integration
            </span>
            <ReimbursementPayrollSection claim={claim} />
          </div>

        </div>

        {/* Drawer Footer Actions */}
        <div className={styles.drawerFooter}>
          <div>
            <button
              type="button"
              className={styles.btnSecondary}
              onClick={onClose}
            >
              Close
            </button>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            {(claim.approvalStatus.includes('Pending') || claim.approvalStatus === 'Submitted') && (
              <>
                <button
                  type="button"
                  className={styles.btnSecondary}
                  onClick={() => onSendBack(claim)}
                >
                  Send Back
                </button>
                <button
                  type="button"
                  className={styles.btnDanger}
                  onClick={() => onReject(claim)}
                >
                  Reject
                </button>
                <button
                  type="button"
                  className={styles.btnSuccess}
                  onClick={() => onApprove(claim)}
                >
                  Approve Claim
                </button>
              </>
            )}

            {claim.approvalStatus === 'Approved' && claim.paymentStatus !== 'Paid' && (
              <button
                type="button"
                className={styles.btnPrimary}
                onClick={() => onProcessPayment(claim)}
              >
                <Wallet size={15} />
                <span>Process Payment</span>
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

function DrawerApprovalBadge({ status }) {
  if (status === 'Approved') {
    return <span className={`${styles.badge} ${styles.badgeApproved}`}>Approved</span>;
  }
  if (status.includes('Pending') || status === 'Submitted') {
    return <span className={`${styles.badge} ${styles.badgePending}`}>{status}</span>;
  }
  if (status === 'Rejected') {
    return <span className={`${styles.badge} ${styles.badgeRejected}`}>Rejected</span>;
  }
  if (status === 'Sent Back') {
    return <span className={`${styles.badge} ${styles.badgeSentBack}`}>Sent Back</span>;
  }
  return <span className={styles.badge}>{status}</span>;
}

function DrawerPaymentBadge({ status }) {
  if (status === 'Paid') {
    return <span className={`${styles.badge} ${styles.badgePaid}`}>Paid</span>;
  }
  if (status === 'Processing') {
    return <span className={`${styles.badge} ${styles.badgeProcessing}`}>Processing</span>;
  }
  return <span className={`${styles.badge} ${styles.badgeUnpaid}`}>Unpaid</span>;
}
