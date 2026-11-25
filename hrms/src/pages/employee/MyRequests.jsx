import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
import Toast from '../../components/common/Toast';
import authService from '../../services/authService';
import { REQUEST_CATEGORIES, addHubRequest, getStoredHubRequests } from '../../data/requestHubData';
import styles from './MyRequests.module.css';

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

const QUICK_REQUEST_TYPES = [
  { id: 'shift-change', label: 'Shift Change / Swap' },
  { id: 'transfer-request', label: 'Transfer / Site Relocation' }
];

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  const d = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(d.getTime())) return dateStr;
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }).format(d);
};

export default function MyRequests() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const currentUser = authService.getCurrentUser() || {};
  const employeeId = currentUser?.employeeCode || currentUser?.employeeId || currentUser?.id || 'RRS0104';
  const employeeName = currentUser?.name || currentUser?.employeeName || 'Rajeshwar Dayal Singh';

  const [showHelpDrawer, setShowHelpDrawer] = useState(false);
  const [quickModalType, setQuickModalType] = useState(null);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const pendingCounts = useMemo(() => {
    const counts = {};
    const curId = String(employeeId || '').toLowerCase();
    getStoredHubRequests().forEach((req) => {
      const rId = String(req.employeeId || '').toLowerCase();
      const belongsToEmployee = !curId || rId === curId || rId === 'rrs0104' || rId.startsWith('rrs');
      if (belongsToEmployee && req.status === 'Pending') {
        counts[req.categoryId] = (counts[req.categoryId] || 0) + 1;
      }
    });
    return counts;
  }, [employeeId]);

  const [quickForm, setQuickForm] = useState({
    currentShift: 'Night Shift (08 PM – 08 AM)',
    requestedShift: 'Morning Shift (08 AM – 08 PM)',
    effectiveFrom: new Date().toISOString().slice(0, 10),
    effectiveTo: new Date().toISOString().slice(0, 10),
    swapWith: '',
    currentSite: currentUser?.site || 'DLF CyberCity Tech Park',
    preferredSite: '',
    preferredDate: new Date().toISOString().slice(0, 10),
    reason: ''
  });

  const showToast = (message, type = 'success') => setToast({ show: true, message, type });

  useEffect(() => {
    const action = searchParams.get('action');
    if (action && ['shift-change', 'transfer-request'].includes(action)) {
      setQuickModalType(action);
    }
  }, [searchParams]);

  const employeeCards = REQUEST_CATEGORIES.filter((cat) => !cat.adminOnly);

  const handleCardClick = (card) => {
    if (card.quickAction) {
      setQuickForm((prev) => ({ ...prev, reason: '' }));
      setQuickModalType(card.quickAction);
      return;
    }
    navigate(card.employeePath, {
      state: {
        fromRequestsHub: true,
        backTo: '/employee/requests'
      }
    });
  };

  const closeQuickModal = () => {
    setQuickModalType(null);
    if (searchParams.get('action')) {
      setSearchParams({});
    }
  };

  const handleQuickSubmit = (e) => {
    e.preventDefault();
    if (!quickForm.reason.trim()) {
      showToast('Please enter a reason / justification.', 'error');
      return;
    }

    const today = new Date().toISOString().slice(0, 10);
    let newEntry = null;

    if (quickModalType === 'shift-change') {
      const id = `REQ-SHF-${Math.floor(8100 + Math.random() * 1800)}`;
      newEntry = {
        id,
        categoryId: 'shift-change',
        categoryLabel: 'Shift Change / Swap',
        employeeId,
        employeeName,
        designation: currentUser?.designation || 'Staff Member',
        site: quickForm.currentSite,
        submittedDate: today,
        summary: `Shift Change: ${quickForm.currentShift.split('(')[0].trim()} → ${quickForm.requestedShift.split('(')[0].trim()}`,
        amountOrMetric: `${formatDate(quickForm.effectiveFrom)}`,
        priority: 'Normal',
        stage: 'Pending Supervisor',
        status: 'Pending',
        reason: quickForm.reason.trim(),
        remarks: '',
        details: {
          'Current Shift': quickForm.currentShift,
          'Requested Shift': quickForm.requestedShift,
          Period: `${formatDate(quickForm.effectiveFrom)} to ${formatDate(quickForm.effectiveTo)}`,
          ...(quickForm.swapWith ? { 'Swap Colleague': quickForm.swapWith } : {})
        }
      };
    } else if (quickModalType === 'transfer-request') {
      if (!quickForm.preferredSite.trim()) {
        showToast('Please specify preferred site / branch.', 'error');
        return;
      }
      const id = `REQ-TRF-${Math.floor(9100 + Math.random() * 800)}`;
      newEntry = {
        id,
        categoryId: 'transfer-request',
        categoryLabel: 'Transfer Request',
        employeeId,
        employeeName,
        designation: currentUser?.designation || 'Staff Member',
        site: quickForm.currentSite,
        submittedDate: today,
        summary: `Site Transfer: ${quickForm.currentSite} → ${quickForm.preferredSite.trim()}`,
        amountOrMetric: 'Site Change',
        priority: 'Normal',
        stage: 'Pending HR Operations',
        status: 'Pending',
        reason: quickForm.reason.trim(),
        remarks: '',
        details: {
          'Current Site': quickForm.currentSite,
          'Preferred Site': quickForm.preferredSite.trim(),
          'Preferred Date': formatDate(quickForm.preferredDate)
        }
      };
    }

    if (newEntry) {
      addHubRequest(newEntry);
      closeQuickModal();
      showToast(`✓ ${newEntry.categoryLabel} (${newEntry.id}) submitted successfully!`);
    }
  };

  return (
    <main className={styles.page}>
      <Toast
        show={toast.show}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast((prev) => ({ ...prev, show: false }))}
      />

      <div className={styles.container}>
        {/* Breadcrumb Navigation */}
        <nav className={styles.breadcrumb} aria-label="Breadcrumb">
          <span onClick={() => navigate('/employee/dashboard')}>Employee Portal</span>
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
                Track all your requests across Attendance, Leave, Payroll, Assets, and HR Services.
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
          {employeeCards.map((card) => {
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
                title={card.employeeDesc}
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
      </div>

      {/* Quick HR Request Modal (Shift Change, Transfer, Resignation) */}
      {quickModalType && (
        <div className={styles.modalBackdrop} onClick={closeQuickModal}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Submit Request</h3>
              <button type="button" className={styles.closeBtn} onClick={closeQuickModal}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleQuickSubmit} className={styles.modalBody}>
              <div className={styles.field}>
                <label className={styles.fieldLabel}>Request Type</label>
                <select
                  className={styles.selectInput}
                  value={quickModalType}
                  onChange={(e) => setQuickModalType(e.target.value)}
                >
                  {QUICK_REQUEST_TYPES.map((t) => (
                    <option key={t.id} value={t.id}>{t.label}</option>
                  ))}
                </select>
              </div>

              {quickModalType === 'shift-change' && (
                <>
                  <div className={styles.formGrid2}>
                    <div className={styles.field}>
                      <label className={styles.fieldLabel}>Current Shift</label>
                      <select
                        className={styles.selectInput}
                        value={quickForm.currentShift}
                        onChange={(e) => setQuickForm({ ...quickForm, currentShift: e.target.value })}
                      >
                        <option>Morning Shift (08 AM – 08 PM)</option>
                        <option>Night Shift (08 PM – 08 AM)</option>
                        <option>General Shift (09 AM – 06 PM)</option>
                      </select>
                    </div>
                    <div className={styles.field}>
                      <label className={styles.fieldLabel}>Requested Shift</label>
                      <select
                        className={styles.selectInput}
                        value={quickForm.requestedShift}
                        onChange={(e) => setQuickForm({ ...quickForm, requestedShift: e.target.value })}
                      >
                        <option>Morning Shift (08 AM – 08 PM)</option>
                        <option>Night Shift (08 PM – 08 AM)</option>
                        <option>General Shift (09 AM – 06 PM)</option>
                      </select>
                    </div>
                    <div className={styles.field}>
                      <label className={styles.fieldLabel}>From Date</label>
                      <input
                        type="date"
                        className={styles.selectInput}
                        value={quickForm.effectiveFrom}
                        onChange={(e) => setQuickForm({ ...quickForm, effectiveFrom: e.target.value })}
                      />
                    </div>
                    <div className={styles.field}>
                      <label className={styles.fieldLabel}>To Date</label>
                      <input
                        type="date"
                        className={styles.selectInput}
                        value={quickForm.effectiveTo}
                        onChange={(e) => setQuickForm({ ...quickForm, effectiveTo: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className={styles.field}>
                    <label className={styles.fieldLabel}>Swap With Colleague (Optional)</label>
                    <input
                      type="text"
                      className={styles.selectInput}
                      value={quickForm.swapWith}
                      onChange={(e) => setQuickForm({ ...quickForm, swapWith: e.target.value })}
                      placeholder="Colleague Name / Employee Code (if mutual swap)"
                    />
                  </div>
                </>
              )}

              {quickModalType === 'transfer-request' && (
                <div className={styles.formGrid2}>
                  <div className={styles.field}>
                    <label className={styles.fieldLabel}>Current Client / Site</label>
                    <input
                      type="text"
                      className={styles.selectInput}
                      value={quickForm.currentSite}
                      onChange={(e) => setQuickForm({ ...quickForm, currentSite: e.target.value })}
                    />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.fieldLabel}>Preferred Site / Branch *</label>
                    <input
                      type="text"
                      className={styles.selectInput}
                      value={quickForm.preferredSite}
                      onChange={(e) => setQuickForm({ ...quickForm, preferredSite: e.target.value })}
                      placeholder="e.g., Noida Sec-62 / CyberHub"
                      required
                    />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.fieldLabel}>Preferred Effective Date</label>
                    <input
                      type="date"
                      className={styles.selectInput}
                      value={quickForm.preferredDate}
                      onChange={(e) => setQuickForm({ ...quickForm, preferredDate: e.target.value })}
                    />
                  </div>
                </div>
              )}

              <div className={styles.field}>
                <label className={styles.fieldLabel}>Reason / Detailed Remarks *</label>
                <textarea
                  rows={3}
                  className={styles.textarea}
                  value={quickForm.reason}
                  onChange={(e) => setQuickForm({ ...quickForm, reason: e.target.value })}
                  placeholder="Provide clear details for your supervisor & HR team..."
                  required
                />
              </div>

              <div className={styles.modalFooter}>
                <button type="button" className={styles.cancelBtn} onClick={closeQuickModal}>
                  Cancel
                </button>
                <button type="submit" className={styles.gotItBtn}>
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Read Help Slide-Over Drawer */}
      {showHelpDrawer && (
        <div className={styles.drawerBackdrop} onClick={() => setShowHelpDrawer(false)}>
          <aside
            className={styles.helpDrawer}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Employee Requests Guide"
          >
            <div className={styles.drawerHeader}>
              <div>
                <h3 className={styles.drawerTitle}>Employee Requests Guide</h3>
                <p className={styles.drawerSubtitle}>
                  Overview of all request categories available in your portal
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
              {employeeCards.map((cat) => (
                <div key={cat.id} className={styles.helpItem}>
                  <CheckCircle2 size={18} className={styles.helpItemIcon} />
                  <div>
                    <strong>{cat.title}</strong>
                    <span>{cat.employeeDesc}</span>
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
    </main>
  );
}
