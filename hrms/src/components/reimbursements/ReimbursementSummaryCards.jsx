import React from 'react';
import { 
  Receipt, Clock, CheckCircle2, XCircle, 
  Wallet, CheckCheck, Calendar, DollarSign 
} from 'lucide-react';
import styles from '../../pages/admin/Reimbursements.module.css';

export default function ReimbursementSummaryCards({ metrics }) {
  return (
    <section className={styles.metricsGrid} aria-label="Summary Metrics">
      <div className={styles.metricCard}>
        <div className={styles.metricTop}>
          <span className={styles.metricLabel}>Total Claims</span>
          <span className={styles.metricIconWrap} style={{ background: '#eef2ff', color: '#4f46e5' }}>
            <Receipt size={16} />
          </span>
        </div>
        <div className={styles.metricValue}>{metrics.totalClaims}</div>
        <div className={styles.metricSubtext}>All submissions</div>
      </div>

      <div className={styles.metricCard}>
        <div className={styles.metricTop}>
          <span className={styles.metricLabel}>Pending Approval</span>
          <span className={styles.metricIconWrap} style={{ background: '#fef9c3', color: '#854d0e' }}>
            <Clock size={16} />
          </span>
        </div>
        <div className={styles.metricValue} style={{ color: '#d97706' }}>{metrics.pendingApproval}</div>
        <div className={styles.metricSubtext}>In review workflow</div>
      </div>

      <div className={styles.metricCard}>
        <div className={styles.metricTop}>
          <span className={styles.metricLabel}>Approved</span>
          <span className={styles.metricIconWrap} style={{ background: '#dcfce7', color: '#15803d' }}>
            <CheckCircle2 size={16} />
          </span>
        </div>
        <div className={styles.metricValue} style={{ color: '#16a34a' }}>{metrics.approved}</div>
        <div className={styles.metricSubtext}>Passed checks</div>
      </div>

      <div className={styles.metricCard}>
        <div className={styles.metricTop}>
          <span className={styles.metricLabel}>Rejected</span>
          <span className={styles.metricIconWrap} style={{ background: '#fee2e2', color: '#b91c1c' }}>
            <XCircle size={16} />
          </span>
        </div>
        <div className={styles.metricValue} style={{ color: '#dc2626' }}>{metrics.rejected}</div>
        <div className={styles.metricSubtext}>Declined claims</div>
      </div>

      <div className={styles.metricCard}>
        <div className={styles.metricTop}>
          <span className={styles.metricLabel}>Pending Payment</span>
          <span className={styles.metricIconWrap} style={{ background: '#eff6ff', color: '#2563eb' }}>
            <Wallet size={16} />
          </span>
        </div>
        <div className={styles.metricValue} style={{ color: '#2563eb' }}>{metrics.pendingPayment}</div>
        <div className={styles.metricSubtext}>Ready for settlement</div>
      </div>

      <div className={styles.metricCard}>
        <div className={styles.metricTop}>
          <span className={styles.metricLabel}>Total Paid</span>
          <span className={styles.metricIconWrap} style={{ background: '#f0fdf4', color: '#166534' }}>
            <CheckCheck size={16} />
          </span>
        </div>
        <div className={styles.metricValue} style={{ color: '#15803d' }}>
          ₹{metrics.paidAmount.toLocaleString()}
        </div>
        <div className={styles.metricSubtext}>Disbursed payouts</div>
      </div>

      <div className={styles.metricCard}>
        <div className={styles.metricTop}>
          <span className={styles.metricLabel}>This Month Claims</span>
          <span className={styles.metricIconWrap} style={{ background: '#f8fafc', color: '#64748b' }}>
            <Calendar size={16} />
          </span>
        </div>
        <div className={styles.metricValue}>{metrics.thisMonthClaims}</div>
        <div className={styles.metricSubtext}>Current billing cycle</div>
      </div>

      <div className={styles.metricCard}>
        <div className={styles.metricTop}>
          <span className={styles.metricLabel}>Month Reimbursed</span>
          <span className={styles.metricIconWrap} style={{ background: '#ecfdf5', color: '#059669' }}>
            <DollarSign size={16} />
          </span>
        </div>
        <div className={styles.metricValue} style={{ color: '#059669' }}>
          ₹{metrics.thisMonthReimbursed.toLocaleString()}
        </div>
        <div className={styles.metricSubtext}>Settled this month</div>
      </div>
    </section>
  );
}
