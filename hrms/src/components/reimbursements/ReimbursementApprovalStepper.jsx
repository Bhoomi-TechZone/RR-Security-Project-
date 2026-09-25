import React from 'react';
import { Check } from 'lucide-react';
import styles from '../../pages/admin/Reimbursements.module.css';

export default function ReimbursementApprovalStepper({ claim }) {
  const steps = [
    { title: 'Submitted', key: 'Submitted' },
    { title: 'Reporting Manager', key: 'Manager' },
    { title: 'HR / Admin', key: 'HR' },
    { title: 'Accounts Verification', key: 'Accounts' },
    { title: 'Settled / Paid', key: 'Paid' }
  ];

  const getStepStatus = (index) => {
    if (!claim) return 'inactive';

    if (claim.approvalStatus === 'Rejected') {
      return index === 0 ? 'completed' : (index === 1 ? 'rejected' : 'inactive');
    }
    if (claim.approvalStatus === 'Sent Back') {
      return index === 0 ? 'completed' : 'pending';
    }

    if (claim.paymentStatus === 'Paid') return 'completed';
    if (claim.approvalStatus === 'Approved') {
      return index <= 3 ? 'completed' : (index === 4 ? 'active' : 'inactive');
    }
    if (claim.approvalStatus === 'Pending Accounts Verification') {
      return index < 3 ? 'completed' : (index === 3 ? 'active' : 'inactive');
    }
    if (claim.approvalStatus === 'Pending HR/Admin Approval') {
      return index < 2 ? 'completed' : (index === 2 ? 'active' : 'inactive');
    }
    if (claim.approvalStatus === 'Pending Manager Approval' || claim.approvalStatus === 'Submitted') {
      return index < 1 ? 'completed' : (index === 1 ? 'active' : 'inactive');
    }
    return 'inactive';
  };

  return (
    <div className={styles.stepperContainer}>
      {steps.map((step, idx) => {
        const status = getStepStatus(idx);
        return (
          <React.Fragment key={step.key}>
            <div className={styles.stepItem}>
              <div 
                className={`
                  ${styles.stepCircle}
                  ${status === 'completed' ? styles.stepCircleCompleted : ''}
                  ${status === 'active' ? styles.stepCircleActive : ''}
                `}
                style={status === 'rejected' ? { background: '#dc2626', color: 'white' } : {}}
              >
                {status === 'completed' ? <Check size={14} /> : (idx + 1)}
              </div>
              <span className={styles.stepTitle}>{step.title}</span>
            </div>
            {idx < steps.length - 1 && (
              <div className={`${styles.stepLine} ${status === 'completed' ? styles.stepLineCompleted : ''}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
