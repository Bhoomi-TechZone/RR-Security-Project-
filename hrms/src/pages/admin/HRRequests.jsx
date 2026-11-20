import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  ArrowLeftRight,
  HelpCircle,
  RotateCcw,
  HandCoins,
  Landmark,
  Plane,
  Package,
  Shirt,
  Receipt,
  X,
  CheckCircle2
} from 'lucide-react';
import AdminLayout from '../../components/layout/AdminLayout';
import styles from './HRRequests.module.css';

function HRRequests() {
  const navigate = useNavigate();
  const location = useLocation();
  const isUserPanel = location.pathname.startsWith('/user');
  const [showHelpModal, setShowHelpModal] = useState(false);

  const requestCards = [
    {
      id: 'attendance-correction',
      title: 'Attendance Correction',
      icon: RotateCcw,
      path: isUserPanel ? '/user/attendance?tab=corrections' : '/admin/attendance?tab=corrections',
      description: 'Missed punch regularisation and shift attendance correction requests.'
    },
    {
      id: 'advances',
      title: 'Advances',
      icon: HandCoins,
      path: isUserPanel ? '/user/advances-loans?tab=advances' : '/admin/advances-loans?tab=advances',
      description: 'Short-term salary advance requests and immediate disbursements.'
    },
    {
      id: 'loans',
      title: 'Loans',
      icon: Landmark,
      path: isUserPanel ? '/user/advances-loans?tab=loans' : '/admin/advances-loans?tab=loans',
      description: 'Long-term employee loan applications and configured EMI deductions.'
    },
    {
      id: 'leaves',
      title: 'Leaves',
      icon: Plane,
      path: isUserPanel ? '/user/leave' : '/admin/leave',
      description: 'Casual, medical, annual, and compensatory leave approvals.'
    },
    {
      id: 'asset',
      title: 'Asset',
      icon: Package,
      path: isUserPanel ? '/user/inventory?tab=clearance' : '/admin/inventory?tab=clearance',
      description: 'Equipment allocations, company asset handover, and return clearance.'
    },
    {
      id: 'uniform',
      title: 'Uniform',
      icon: Shirt,
      path: isUserPanel ? '/user/inventory?tab=requests' : '/admin/inventory?tab=requests',
      description: 'Uniform requisitions, safety equipment, and replacement requests.'
    },
    {
      id: 'reimbursement',
      title: 'Reimbursement',
      icon: Receipt,
      path: isUserPanel ? '/user/reimbursements' : '/admin/reimbursements',
      description: 'Travel, food, medical, and operational expense claim approvals.'
    }
  ];

  const handleCardClick = (path) => {
    navigate(path);
  };

  return (
    <AdminLayout>
      <div className={styles.container}>
        {/* Breadcrumb Navigation */}
        <nav className={styles.breadcrumb} aria-label="Breadcrumb">
          <span onClick={() => navigate(isUserPanel ? '/user/dashboard' : '/admin/dashboard')}>
            Dashboard
          </span>
          <span className={styles.separator}>/</span>
          <span>Workforce</span>
          <span className={styles.separator}>/</span>
          <span>HR Management</span>
          <span className={styles.separator}>/</span>
          <strong>Requests</strong>
        </nav>

        {/* Page Header */}
        <div className={styles.pageHeader}>
          <div className={styles.titleWithIcon}>
            <ArrowLeftRight size={26} strokeWidth={2} className={styles.headerIcon} />
            <div className={styles.titleArea}>
              <h1 className={styles.pageTitle}>Requests</h1>
              <p className={styles.pageSubtitle}>
                View requests pending for action and download historical reports.
              </p>
            </div>
          </div>

          <button
            type="button"
            className={styles.readHelpBtn}
            onClick={() => setShowHelpModal(true)}
          >
            <HelpCircle size={15} />
            <span>Read Help</span>
          </button>
        </div>

        {/* Request Cards Grid */}
        <div className={styles.cardsGrid}>
          {requestCards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.id}
                className={styles.requestCard}
                onClick={() => handleCardClick(card.path)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleCardClick(card.path);
                  }
                }}
                title={card.description}
              >
                <Icon size={26} strokeWidth={1.6} className={styles.cardIcon} />
                <h3 className={styles.cardLabel}>{card.title}</h3>
              </div>
            );
          })}
        </div>

        {/* Read Help Informational Modal */}
        {showHelpModal && (
          <div className={styles.modalBackdrop} onClick={() => setShowHelpModal(false)}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <h3 className={styles.modalTitle}>HR Requests Guide</h3>
                <button
                  type="button"
                  className={styles.closeBtn}
                  onClick={() => setShowHelpModal(false)}
                  aria-label="Close"
                >
                  <X size={18} />
                </button>
              </div>

              <div className={styles.modalBody}>
                <div className={styles.helpItem}>
                  <CheckCircle2 size={18} className={styles.helpItemIcon} />
                  <div>
                    <strong>Attendance Correction</strong>
                    <span>Review employee regularisation applications for missed punches, biometric errors, and overtime adjustments.</span>
                  </div>
                </div>

                <div className={styles.helpItem}>
                  <CheckCircle2 size={18} className={styles.helpItemIcon} />
                  <div>
                    <strong>Advances</strong>
                    <span>Manage short-term salary advance requisitions and auto-deductions in upcoming payroll runs.</span>
                  </div>
                </div>

                <div className={styles.helpItem}>
                  <CheckCircle2 size={18} className={styles.helpItemIcon} />
                  <div>
                    <strong>Loans</strong>
                    <span>Approve company loans, specify EMI tenures, and monitor deduction schedules.</span>
                  </div>
                </div>

                <div className={styles.helpItem}>
                  <CheckCircle2 size={18} className={styles.helpItemIcon} />
                  <div>
                    <strong>Leaves</strong>
                    <span>Process daily and extended leave applications, examine leave quotas, and manage encashments.</span>
                  </div>
                </div>

                <div className={styles.helpItem}>
                  <CheckCircle2 size={18} className={styles.helpItemIcon} />
                  <div>
                    <strong>Asset</strong>
                    <span>Track company equipment, digital devices, asset allocations, and exit clearance handovers.</span>
                  </div>
                </div>

                <div className={styles.helpItem}>
                  <CheckCircle2 size={18} className={styles.helpItemIcon} />
                  <div>
                    <strong>Uniform</strong>
                    <span>Process employee requests for guard uniforms, safety shoes, tactical gear, and seasonal kits.</span>
                  </div>
                </div>

                <div className={styles.helpItem}>
                  <CheckCircle2 size={18} className={styles.helpItemIcon} />
                  <div>
                    <strong>Reimbursement</strong>
                    <span>Review submitted expense vouchers, supporting bills, travel claims, and payout approvals.</span>
                  </div>
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button
                  type="button"
                  className={styles.gotItBtn}
                  onClick={() => setShowHelpModal(false)}
                >
                  Got It
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

export default HRRequests;
