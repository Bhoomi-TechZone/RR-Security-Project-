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
  CalendarRange,
  CalendarCheck2,
  CreditCard,
  Clock4,
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
  'time-relaxation': Clock4,
  leaves: Plane,
  'leave-encashment': Coins,
  'comp-off': CalendarCheck2,
  overtime: Timer,
  'shift-change': CalendarClock,
  'week-off-change': CalendarRange,
  loans: Landmark,
  reimbursement: Receipt,
  'it-declaration': Calculator,
  'bank-change': CreditCard,
  'asset-requisition': Package,
  uniform: Shirt,
  'letter-request': FileSignature,
  'transfer-request': MapPin,
  resignation: UserMinus
};

const QUICK_REQUEST_TYPES = [
  { id: 'shift-change', label: 'Shift Change / Swap' },
  { id: 'week-off-change', label: 'Week Off Change' },
  { id: 'time-relaxation', label: 'Time Relaxation' },
  { id: 'bank-change', label: 'Bank Account Change' },
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
  const [hubRequests, setHubRequests] = useState(() => getStoredHubRequests());
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  useEffect(() => {
    const sync = () => setHubRequests(getStoredHubRequests());
    window.addEventListener('storage', sync);
    window.addEventListener('novaspark:hub-requests-updated', sync);
    return () => {
      window.removeEventListener('storage', sync);
      window.removeEventListener('novaspark:hub-requests-updated', sync);
    };
  }, []);

  const pendingCounts = useMemo(() => {
    const counts = {};
    const curId = String(employeeId || '').toLowerCase();
    hubRequests.forEach((req) => {
      const rId = String(req.employeeId || '').toLowerCase();
      const belongsToEmployee = !curId || rId === curId || rId === 'rrs0104' || rId.startsWith('rrs');
      if (belongsToEmployee && req.status === 'Pending') {
        counts[req.categoryId] = (counts[req.categoryId] || 0) + 1;
      }
    });
    return counts;
  }, [employeeId, hubRequests]);

  const [quickForm, setQuickForm] = useState({
    currentShift: 'Night Shift (08 PM – 08 AM)',
    requestedShift: 'Morning Shift (08 AM – 08 PM)',
    effectiveFrom: new Date().toISOString().slice(0, 10),
    effectiveTo: new Date().toISOString().slice(0, 10),
    swapWith: '',
    currentWeekOff: new Date().toISOString().slice(0, 10),
    requestedWeekOff: new Date().toISOString().slice(0, 10),
    relaxationDate: new Date().toISOString().slice(0, 10),
    relaxationType: 'Late Arrival',
    relaxationDuration: '30 Minutes',
    bankName: '',
    accountNumber: '',
    ifscCode: '',
    currentSite: currentUser?.site || 'DLF CyberCity Tech Park',
    preferredSite: '',
    preferredDate: new Date().toISOString().slice(0, 10),
    reason: ''
  });

  const showToast = (message, type = 'success') => setToast({ show: true, message, type });

  useEffect(() => {
    const action = searchParams.get('action');
    if (
      action &&
      ['shift-change', 'week-off-change', 'time-relaxation', 'bank-change', 'transfer-request'].includes(action)
    ) {
      setQuickModalType(action);
    }
  }, [searchParams]);

  const employeeCards = REQUEST_CATEGORIES.filter((cat) => !cat.adminOnly);

  const handleCardClick = (card) => {
    navigate(`/employee/requests/${card.id}`);
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
    } else if (quickModalType === 'week-off-change') {
      const id = `REQ-WOC-${Math.floor(8100 + Math.random() * 800)}`;
      newEntry = {
        id,
        categoryId: 'week-off-change',
        categoryLabel: 'Week Off Change',
        employeeId,
        employeeName,
        designation: currentUser?.designation || 'Staff Member',
        site: quickForm.currentSite,
        submittedDate: today,
        summary: `Week Off Change: ${formatDate(quickForm.currentWeekOff)} → ${formatDate(quickForm.requestedWeekOff)}`,
        amountOrMetric: '1 Day Swap',
        priority: 'Normal',
        stage: 'Pending Supervisor Approval',
        status: 'Pending',
        reason: quickForm.reason.trim(),
        remarks: '',
        details: {
          'Current Week Off': formatDate(quickForm.currentWeekOff),
          'Requested Week Off': formatDate(quickForm.requestedWeekOff),
          ...(quickForm.swapWith ? { 'Reliever Guard': quickForm.swapWith } : {})
        }
      };
    } else if (quickModalType === 'time-relaxation') {
      const id = `REQ-TRL-${Math.floor(8400 + Math.random() * 500)}`;
      newEntry = {
        id,
        categoryId: 'time-relaxation',
        categoryLabel: 'Time Relaxation',
        employeeId,
        employeeName,
        designation: currentUser?.designation || 'Staff Member',
        site: quickForm.currentSite,
        submittedDate: today,
        summary: `${quickForm.relaxationType} Relaxation (${quickForm.relaxationDuration}) on ${formatDate(quickForm.relaxationDate)}`,
        amountOrMetric: quickForm.relaxationDuration,
        priority: 'Normal',
        stage: 'Pending Supervisor Approval',
        status: 'Pending',
        reason: quickForm.reason.trim(),
        remarks: '',
        details: {
          Date: formatDate(quickForm.relaxationDate),
          'Relaxation Type': quickForm.relaxationType,
          'Duration Requested': quickForm.relaxationDuration
        }
      };
    } else if (quickModalType === 'bank-change') {
      if (!quickForm.bankName.trim() || !quickForm.accountNumber.trim() || !quickForm.ifscCode.trim()) {
        showToast('Please enter Bank Name, Account Number, and IFSC Code.', 'error');
        return;
      }
      const id = `REQ-BNK-${Math.floor(8300 + Math.random() * 600)}`;
      const maskedAcc = `XXXX XXXX ${quickForm.accountNumber.trim().slice(-4)}`;
      newEntry = {
        id,
        categoryId: 'bank-change',
        categoryLabel: 'Bank Change',
        employeeId,
        employeeName,
        designation: currentUser?.designation || 'Staff Member',
        site: quickForm.currentSite,
        submittedDate: today,
        summary: `Salary Account Update: ${quickForm.bankName.trim()} (${maskedAcc})`,
        amountOrMetric: 'Bank Update',
        priority: 'High',
        stage: 'Pending Payroll Verification',
        status: 'Pending',
        reason: quickForm.reason.trim(),
        remarks: '',
        details: {
          'New Bank': quickForm.bankName.trim(),
          'Account No': maskedAcc,
          'IFSC Code': quickForm.ifscCode.trim().toUpperCase()
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
      const updated = addHubRequest(newEntry);
      setHubRequests(updated);
      window.dispatchEvent(new Event('novaspark:hub-requests-updated'));
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
            <ArrowLeftRight size={18} strokeWidth={2} className={styles.headerIcon} />
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

              {quickModalType === 'week-off-change' && (
                <>
                  <div className={styles.formGrid2}>
                    <div className={styles.field}>
                      <label className={styles.fieldLabel}>Current Week Off Date</label>
                      <input
                        type="date"
                        className={styles.selectInput}
                        value={quickForm.currentWeekOff}
                        onChange={(e) => setQuickForm({ ...quickForm, currentWeekOff: e.target.value })}
                      />
                    </div>
                    <div className={styles.field}>
                      <label className={styles.fieldLabel}>Requested Week Off Date</label>
                      <input
                        type="date"
                        className={styles.selectInput}
                        value={quickForm.requestedWeekOff}
                        onChange={(e) => setQuickForm({ ...quickForm, requestedWeekOff: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className={styles.field}>
                    <label className={styles.fieldLabel}>Reliever Colleague (Optional)</label>
                    <input
                      type="text"
                      className={styles.selectInput}
                      value={quickForm.swapWith}
                      onChange={(e) => setQuickForm({ ...quickForm, swapWith: e.target.value })}
                      placeholder="Colleague Name / Employee Code"
                    />
                  </div>
                </>
              )}

              {quickModalType === 'time-relaxation' && (
                <div className={styles.formGrid2}>
                  <div className={styles.field}>
                    <label className={styles.fieldLabel}>Date</label>
                    <input
                      type="date"
                      className={styles.selectInput}
                      value={quickForm.relaxationDate}
                      onChange={(e) => setQuickForm({ ...quickForm, relaxationDate: e.target.value })}
                    />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.fieldLabel}>Relaxation Type</label>
                    <select
                      className={styles.selectInput}
                      value={quickForm.relaxationType}
                      onChange={(e) => setQuickForm({ ...quickForm, relaxationType: e.target.value })}
                    >
                      <option>Late Arrival</option>
                      <option>Early Departure</option>
                      <option>Short Leave Grace</option>
                    </select>
                  </div>
                  <div className={styles.field}>
                    <label className={styles.fieldLabel}>Duration Requested</label>
                    <select
                      className={styles.selectInput}
                      value={quickForm.relaxationDuration}
                      onChange={(e) => setQuickForm({ ...quickForm, relaxationDuration: e.target.value })}
                    >
                      <option>15 Minutes</option>
                      <option>30 Minutes</option>
                      <option>45 Minutes</option>
                      <option>1 Hour</option>
                      <option>2 Hours</option>
                    </select>
                  </div>
                </div>
              )}

              {quickModalType === 'bank-change' && (
                <div className={styles.formGrid2}>
                  <div className={styles.field}>
                    <label className={styles.fieldLabel}>New Bank Name *</label>
                    <input
                      type="text"
                      className={styles.selectInput}
                      value={quickForm.bankName}
                      onChange={(e) => setQuickForm({ ...quickForm, bankName: e.target.value })}
                      placeholder="e.g., HDFC Bank"
                      required
                    />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.fieldLabel}>Account Number *</label>
                    <input
                      type="text"
                      className={styles.selectInput}
                      value={quickForm.accountNumber}
                      onChange={(e) => setQuickForm({ ...quickForm, accountNumber: e.target.value })}
                      placeholder="Enter bank account number"
                      required
                    />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.fieldLabel}>IFSC Code *</label>
                    <input
                      type="text"
                      className={styles.selectInput}
                      value={quickForm.ifscCode}
                      onChange={(e) => setQuickForm({ ...quickForm, ifscCode: e.target.value })}
                      placeholder="e.g., HDFC0001420"
                      required
                    />
                  </div>
                </div>
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
