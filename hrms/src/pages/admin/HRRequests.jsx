import React, { useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  ArrowLeftRight,
  HelpCircle,
  RotateCcw,
  Landmark,
  Plane,
  Coins,
  Timer,
  CalendarClock,
  Receipt,
  Calculator,
  Package,
  Shirt,
  FileSignature,
  MapPin,
  UserMinus,
  X,
  CheckCircle2,
  FileText
} from 'lucide-react';
import AdminLayout from '../../components/layout/AdminLayout';
import { REQUEST_CATEGORIES, getStoredHubRequests } from '../../data/requestHubData';
import styles from './HRRequests.module.css';

const CATEGORY_ICONS = {
  'attendance-correction': RotateCcw,
  leaves: Plane,
  'leave-encashment': Coins,
  overtime: Timer,
  'shift-change': CalendarClock,
  loans: Landmark,
  reimbursement: Receipt,
  'it-declaration': Calculator,
  'asset-requisition': Package,
  uniform: Shirt,
  'letter-request': FileSignature,
  'transfer-request': MapPin,
  resignation: UserMinus
};

function HRRequests() {
  const navigate = useNavigate();
  const location = useLocation();
  const isUserPanel = location.pathname.startsWith('/user');
  const [showHelpDrawer, setShowHelpDrawer] = useState(false);

  const pendingCounts = useMemo(() => {
    const counts = {};
    getStoredHubRequests().forEach((req) => {
      if (req.status === 'Pending') {
        counts[req.categoryId] = (counts[req.categoryId] || 0) + 1;
      }
    });
    return counts;
  }, []);

  const handleCardClick = (card) => {
    const targetPath = isUserPanel ? card.userPath : card.adminPath;
    const backTo = isUserPanel ? '/user/hr-management/requests' : '/admin/hr-management/requests';
    navigate(targetPath, {
      state: {
        fromRequestsHub: true,
        backTo
      }
    });
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
                Manage all employee requests across HR, Attendance, Payroll, and Operations.
              </p>
            </div>
          </div>

          <button
            type="button"
            className={styles.readHelpBtn}
            onClick={() => setShowHelpDrawer(true)}
          >
            <HelpCircle size={15} />
            <span>Read Help</span>
          </button>
        </div>

        {/* Request Cards Grid */}
        <div className={styles.cardsGrid}>
          {REQUEST_CATEGORIES.map((card) => {
            const Icon = CATEGORY_ICONS[card.id] || FileText;
            const pendingCount = pendingCounts[card.id] || 0;
            return (
              <div
                key={card.id}
                className={styles.requestCard}
                onClick={() => handleCardClick(card)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleCardClick(card);
                  }
                }}
                title={card.description}
              >
                {pendingCount > 0 && (
                  <span
                    className={styles.countBadge}
                    aria-label={`${pendingCount} pending requests`}
                  >
                    {pendingCount}
                  </span>
                )}
                <Icon size={26} strokeWidth={1.6} className={styles.cardIcon} />
                <h3 className={styles.cardLabel}>{card.title}</h3>
              </div>
            );
          })}
        </div>

        {/* Read Help Slide-Over Drawer */}
        {showHelpDrawer && (
          <div className={styles.drawerBackdrop} onClick={() => setShowHelpDrawer(false)}>
            <aside
              className={styles.helpDrawer}
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-label="HR Requests Guide"
            >
              <div className={styles.drawerHeader}>
                <div>
                  <h3 className={styles.drawerTitle}>HR Requests Guide</h3>
                  <p className={styles.drawerSubtitle}>
                    Overview of all employee request categories & approval workflows
                  </p>
                </div>
                <button
                  type="button"
                  className={styles.closeBtn}
                  onClick={() => setShowHelpDrawer(false)}
                  aria-label="Close"
                >
                  <X size={18} />
                </button>
              </div>

              <div className={styles.drawerBody}>
                {REQUEST_CATEGORIES.map((cat) => (
                  <div key={cat.id} className={styles.helpItem}>
                    <CheckCircle2 size={18} className={styles.helpItemIcon} />
                    <div>
                      <strong>{cat.title}</strong>
                      <span>{cat.description}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className={styles.drawerFooter}>
                <button
                  type="button"
                  className={styles.gotItBtn}
                  onClick={() => setShowHelpDrawer(false)}
                >
                  Got It
                </button>
              </div>
            </aside>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

export default HRRequests;
