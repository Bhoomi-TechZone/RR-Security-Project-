import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Receipt, Plus, Download, Tag, BarChart3, Check, X, AlertCircle
} from 'lucide-react';
import styles from './Reimbursements.module.css';

import AdminLayout from '../../components/layout/AdminLayout';
import Toast from '../../components/common/Toast';
import ConfirmModal from '../../components/common/ConfirmModal';

import { mockEmployees } from '../../data/employeeData';
import {
  INITIAL_EXPENSE_TYPES,
  INITIAL_REIMBURSEMENT_CLAIMS,
  calculateReimbursementMetrics
} from '../../data/reimbursementData';

// Modular Reusable Components
import ReimbursementSummaryCards from '../../components/reimbursements/ReimbursementSummaryCards';
import ReimbursementFilters from '../../components/reimbursements/ReimbursementFilters';
import ReimbursementTable from '../../components/reimbursements/ReimbursementTable';
import ReimbursementForm from '../../components/reimbursements/ReimbursementForm';
import ReimbursementDetailsDrawer from '../../components/reimbursements/ReimbursementDetailsDrawer';
import ReimbursementPaymentForm from '../../components/reimbursements/ReimbursementPaymentForm';
import ExpenseTypeManager from '../../components/reimbursements/ExpenseTypeManager';
import ReimbursementReports from '../../components/reimbursements/ReimbursementReports';

export default function Reimbursements() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Active Main Tab ('claims', 'expense-types', 'reports')
  const initialTab = searchParams.get('tab') || 'claims';
  const [activeTab, setActiveTab] = useState(initialTab);

  // --- SEARCH & FILTER STATE FOR CLAIMS ---
  const [searchQuery, setSearchQuery] = useState('');
  const [subStatusFilter, setSubStatusFilter] = useState('All');
  const [selectedDepartment, setSelectedDepartment] = useState('All');
  const [selectedLocation, setSelectedLocation] = useState('All');
  const [selectedExpenseType, setSelectedExpenseType] = useState('All');
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState('All');
  const [selectedMonth, setSelectedMonth] = useState('');

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && ['claims', 'expense-types', 'reports'].includes(tabParam)) {
      setActiveTab(tabParam);
    } else {
      setActiveTab('claims');
    }

    const statusParam = searchParams.get('status');
    if (statusParam) {
      if (statusParam.toLowerCase() === 'pending' || statusParam.toLowerCase() === 'pending-approval') {
        setSubStatusFilter('Pending Approval');
      } else if (statusParam.toLowerCase() === 'approved') {
        setSubStatusFilter('Approved');
      } else if (statusParam.toLowerCase() === 'paid') {
        setSubStatusFilter('Paid');
      } else if (statusParam.toLowerCase() === 'ready-for-payment' || statusParam.toLowerCase() === 'payment') {
        setSubStatusFilter('Ready for Payment');
      } else {
        setSubStatusFilter('All');
      }
    } else {
      setSubStatusFilter('All');
    }
  }, [searchParams]);

  const handleTabChange = (newTab) => {
    setActiveTab(newTab);
    setSearchParams(newTab === 'claims' ? {} : { tab: newTab });
  };

  // --- STATE FOR CLAIMS & EXPENSE TYPES ---
  const [claimsList, setClaimsList] = useState(() => {
    const saved = localStorage.getItem('novaspark_reimbursements');
    return saved ? JSON.parse(saved) : INITIAL_REIMBURSEMENT_CLAIMS;
  });

  const [expenseTypes, setExpenseTypes] = useState(() => {
    const saved = localStorage.getItem('novaspark_expense_types');
    return saved ? JSON.parse(saved) : INITIAL_EXPENSE_TYPES;
  });

  const saveClaims = (updated) => {
    setClaimsList(updated);
    localStorage.setItem('novaspark_reimbursements', JSON.stringify(updated));
  };

  const saveExpenseTypes = (updated) => {
    setExpenseTypes(updated);
    localStorage.setItem('novaspark_expense_types', JSON.stringify(updated));
  };

  // --- TOAST NOTIFICATION STATE ---
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
  };

  // --- DRAWER & MODAL STATES ---
  const [selectedClaimForDrawer, setSelectedClaimForDrawer] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingClaim, setEditingClaim] = useState(null);

  // Action Modals
  const [approveModalClaim, setApproveModalClaim] = useState(null);
  const [rejectModalClaim, setRejectModalClaim] = useState(null);
  const [sendBackModalClaim, setSendBackModalClaim] = useState(null);
  const [paymentModalClaim, setPaymentModalClaim] = useState(null);

  // Confirmation Dialog
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  // Extract unique departments and sites from mockEmployees
  const departments = useMemo(() => {
    const depts = new Set(mockEmployees.map(e => e.department).filter(Boolean));
    return ['All', ...Array.from(depts)];
  }, []);

  const locations = useMemo(() => {
    const locs = new Set(mockEmployees.map(e => e.siteLocation || e.joiningLocation).filter(Boolean));
    return ['All', ...Array.from(locs)];
  }, []);

  // Summary Metrics
  const metrics = useMemo(() => calculateReimbursementMetrics(claimsList), [claimsList]);

  // Filtered Claims
  const filteredClaims = useMemo(() => {
    return claimsList.filter(claim => {
      // Search
      const q = searchQuery.toLowerCase();
      const matchesSearch = !searchQuery || 
        claim.claimId.toLowerCase().includes(q) ||
        claim.employeeCode.toLowerCase().includes(q) ||
        claim.employeeName.toLowerCase().includes(q) ||
        claim.expenseType.toLowerCase().includes(q);

      // Sub Status Filter
      let matchesSubStatus = true;
      if (subStatusFilter === 'Pending Approval') {
        matchesSubStatus = claim.approvalStatus.includes('Pending') || claim.approvalStatus === 'Submitted';
      } else if (subStatusFilter === 'Approved') {
        matchesSubStatus = claim.approvalStatus === 'Approved';
      } else if (subStatusFilter === 'Ready for Payment') {
        matchesSubStatus = claim.approvalStatus === 'Approved' && claim.paymentStatus !== 'Paid';
      } else if (subStatusFilter === 'Paid') {
        matchesSubStatus = claim.paymentStatus === 'Paid';
      } else if (subStatusFilter === 'Rejected / Sent Back') {
        matchesSubStatus = claim.approvalStatus === 'Rejected' || claim.approvalStatus === 'Sent Back';
      }

      // Dropdown Filters
      const matchesDept = selectedDepartment === 'All' || claim.department === selectedDepartment;
      const matchesLoc = selectedLocation === 'All' || claim.site.includes(selectedLocation);
      const matchesType = selectedExpenseType === 'All' || claim.expenseType === selectedExpenseType;
      const matchesPayment = selectedPaymentStatus === 'All' || claim.paymentStatus === selectedPaymentStatus;
      const matchesMonth = !selectedMonth || (claim.expenseDate && claim.expenseDate.startsWith(selectedMonth));

      return matchesSearch && matchesSubStatus && matchesDept && matchesLoc && matchesType && matchesPayment && matchesMonth;
    });
  }, [claimsList, searchQuery, subStatusFilter, selectedDepartment, selectedLocation, selectedExpenseType, selectedPaymentStatus, selectedMonth]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setSubStatusFilter('All');
    setSelectedDepartment('All');
    setSelectedLocation('All');
    setSelectedExpenseType('All');
    setSelectedPaymentStatus('All');
    setSelectedMonth('');
  };

  // --- ACTIONS HANDLERS ---

  // 1. Submit New / Edited Claim
  const handleSaveClaim = (claimData) => {
    if (editingClaim) {
      const updated = claimsList.map(c => c.id === claimData.id ? claimData : c);
      saveClaims(updated);
      showToast(`Reimbursement claim ${claimData.claimId} updated successfully.`);
    } else {
      const newClaimId = `CLM-2026-${String(claimsList.length + 1).padStart(3, '0')}`;
      const newEntry = {
        ...claimData,
        id: `clm-${Date.now()}`,
        claimId: newClaimId,
        submittedDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        approvalStatus: 'Pending Manager Approval',
        currentApprover: 'Reporting Manager',
        paymentStatus: 'Unpaid',
        paidAmount: 0,
        approvedAmount: 0,
        approvalHistory: [
          {
            action: 'Submitted',
            person: claimData.employeeName,
            role: 'Employee',
            date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            comment: claimData.purpose || 'Claim submitted with receipts.'
          }
        ]
      };
      saveClaims([newEntry, ...claimsList]);
      showToast(`Reimbursement claim ${newClaimId} created successfully.`);
    }
    setIsCreateModalOpen(false);
    setEditingClaim(null);
  };

  // 2. Approve Claim Handler
  const handleApproveClaim = (claimId, approvedAmt, remark) => {
    const nowStrDate = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const nowStrTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const updated = claimsList.map(c => {
      if (c.id === claimId) {
        let nextStatus = 'Approved';
        let nextApprover = 'Accounts Department';

        if (c.approvalStatus === 'Pending Manager Approval' || c.approvalStatus === 'Submitted') {
          nextStatus = 'Pending HR/Admin Approval';
          nextApprover = 'HR / Admin Head';
        } else if (c.approvalStatus === 'Pending HR/Admin Approval') {
          nextStatus = 'Pending Accounts Verification';
          nextApprover = 'Accounts Department';
        } else {
          nextStatus = 'Approved';
          nextApprover = 'Ready for Payment';
        }

        const newHistory = [
          ...c.approvalHistory,
          {
            action: nextStatus === 'Approved' ? 'Verified & Approved' : 'Approved',
            person: 'Admin HR',
            role: 'HR/Admin',
            date: nowStrDate,
            time: nowStrTime,
            comment: remark || `Approved amount ₹${approvedAmt.toLocaleString()}. Forwarded to next stage.`
          }
        ];

        return {
          ...c,
          approvedAmount: Number(approvedAmt),
          approvalStatus: nextStatus,
          currentApprover: nextApprover,
          approvalHistory: newHistory
        };
      }
      return c;
    });

    saveClaims(updated);
    if (selectedClaimForDrawer && selectedClaimForDrawer.id === claimId) {
      setSelectedClaimForDrawer(updated.find(c => c.id === claimId));
    }
    setApproveModalClaim(null);
    showToast(`Claim ${approveModalClaim?.claimId} approved successfully.`);
  };

  // 3. Reject Claim Handler
  const handleRejectClaim = (claimId, reason) => {
    const nowStrDate = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const nowStrTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const updated = claimsList.map(c => {
      if (c.id === claimId) {
        return {
          ...c,
          approvalStatus: 'Rejected',
          currentApprover: 'Closed',
          rejectionReason: reason,
          approvalHistory: [
            ...c.approvalHistory,
            {
              action: 'Rejected',
              person: 'Admin HR',
              role: 'HR/Admin',
              date: nowStrDate,
              time: nowStrTime,
              comment: `Rejection Reason: ${reason}`
            }
          ]
        };
      }
      return c;
    });

    saveClaims(updated);
    if (selectedClaimForDrawer && selectedClaimForDrawer.id === claimId) {
      setSelectedClaimForDrawer(updated.find(c => c.id === claimId));
    }
    setRejectModalClaim(null);
    showToast(`Claim ${rejectModalClaim?.claimId} has been rejected.`, 'info');
  };

  // 4. Send Back Claim Handler
  const handleSendBackClaim = (claimId, reason) => {
    const nowStrDate = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const nowStrTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const updated = claimsList.map(c => {
      if (c.id === claimId) {
        return {
          ...c,
          approvalStatus: 'Sent Back',
          currentApprover: `${c.employeeName} (Awaiting Correction)`,
          sendBackReason: reason,
          approvalHistory: [
            ...c.approvalHistory,
            {
              action: 'Sent Back',
              person: 'Admin HR',
              role: 'HR/Admin',
              date: nowStrDate,
              time: nowStrTime,
              comment: `Correction required: ${reason}`
            }
          ]
        };
      }
      return c;
    });

    saveClaims(updated);
    if (selectedClaimForDrawer && selectedClaimForDrawer.id === claimId) {
      setSelectedClaimForDrawer(updated.find(c => c.id === claimId));
    }
    setSendBackModalClaim(null);
    showToast(`Claim ${sendBackModalClaim?.claimId} sent back for employee correction.`, 'info');
  };

  // 5. Process Payment Handler
  const handleProcessPayment = (claimId, paymentData) => {
    const nowStrDate = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const nowStrTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const updated = claimsList.map(c => {
      if (c.id === claimId) {
        return {
          ...c,
          paymentStatus: 'Paid',
          paidAmount: Number(paymentData.paidAmount),
          paymentDate: paymentData.paymentDate,
          paymentMode: paymentData.paymentMode,
          transactionNumber: paymentData.transactionNumber,
          payrollIncluded: paymentData.payrollIncluded,
          payrollMonth: paymentData.payrollMonth,
          reimbursementHead: paymentData.reimbursementHead,
          approvalHistory: [
            ...c.approvalHistory,
            {
              action: 'Payment Completed',
              person: 'Accounts Officer',
              role: 'Accounts',
              date: nowStrDate,
              time: nowStrTime,
              comment: `Settled ₹${Number(paymentData.paidAmount).toLocaleString()} via ${paymentData.paymentMode} (${paymentData.transactionNumber || 'Cash/Manual'}).`
            }
          ]
        };
      }
      return c;
    });

    saveClaims(updated);
    if (selectedClaimForDrawer && selectedClaimForDrawer.id === claimId) {
      setSelectedClaimForDrawer(updated.find(c => c.id === claimId));
    }
    setPaymentModalClaim(null);
    showToast(`Payment of ₹${paymentData.paidAmount} processed successfully for ${paymentModalClaim?.claimId}!`);
  };

  // --- EXPENSE TYPE CRUD HANDLERS ---
  const handleSaveExpenseType = (typeData) => {
    if (typeData.id) {
      const updated = expenseTypes.map(t => t.id === typeData.id ? typeData : t);
      saveExpenseTypes(updated);
      showToast(`Expense category "${typeData.name}" updated.`);
    } else {
      const newType = {
        ...typeData,
        id: `exp-${Date.now()}`
      };
      saveExpenseTypes([...expenseTypes, newType]);
      showToast(`Expense category "${typeData.name}" added successfully.`);
    }
  };

  const handleToggleExpenseTypeStatus = (type) => {
    const nextStatus = type.status === 'Active' ? 'Inactive' : 'Active';
    const updated = expenseTypes.map(t => t.id === type.id ? { ...t, status: nextStatus } : t);
    saveExpenseTypes(updated);
    showToast(`Expense category "${type.name}" marked ${nextStatus}.`);
  };

  const handleExport = (type) => {
    showToast(`Exporting Reimbursements ${type.toUpperCase()} report...`, 'info');
  };

  return (
    <AdminLayout>
      <div className={styles.pageContainer}>
        
        {/* Toast Notification */}
        {toast.show && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast({ ...toast, show: false })}
          />
        )}

        {/* Confirmation Modal */}
        <ConfirmModal
          isOpen={confirmModal.isOpen}
          title={confirmModal.title}
          message={confirmModal.message}
          onConfirm={() => {
            confirmModal.onConfirm();
            setConfirmModal({ ...confirmModal, isOpen: false });
          }}
          onCancel={() => setConfirmModal({ ...confirmModal, isOpen: false })}
          confirmText="Confirm"
          confirmType="primary"
        />

        {/* Page Header */}
        <header className={styles.pageHeader}>
          <div className={styles.headerLeft}>
            <nav className={styles.breadcrumb} aria-label="Breadcrumb">
              <button 
                type="button" 
                className={styles.breadcrumbLink}
                onClick={() => navigate('/admin/dashboard')}
              >
                Admin
              </button>
              <span>/</span>
              <button 
                type="button" 
                className={styles.breadcrumbLink}
                onClick={() => navigate('/admin/payroll')}
              >
                Payroll
              </button>
              <span>/</span>
              <span>Reimbursements</span>
            </nav>
            <h1 className={styles.pageTitle}>Reimbursement Management</h1>
            <p className={styles.pageSubtitle}>
              Manage employee expense claims, multi-tier approvals, payments and reimbursement records.
            </p>
          </div>

          <div className={styles.headerActions}>
            <button
              type="button"
              className={styles.btnSecondary}
              onClick={() => handleExport('excel')}
              title="Export Reimbursement Register"
            >
              <Download size={15} />
              <span>Export Report</span>
            </button>
            <button
              type="button"
              className={styles.btnPrimary}
              onClick={() => {
                setEditingClaim(null);
                setIsCreateModalOpen(true);
              }}
            >
              <Plus size={16} />
              <span>Create Reimbursement</span>
            </button>
          </div>
        </header>

        {/* Reusable Component 1: ReimbursementSummaryCards */}
        <ReimbursementSummaryCards metrics={metrics} />

        {/* TAB 1: ALL CLAIMS VIEW */}
        {activeTab === 'claims' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            {/* Reusable Component 2: ReimbursementFilters */}
            <ReimbursementFilters
              claimsCount={claimsList.length}
              metrics={metrics}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              subStatusFilter={subStatusFilter}
              setSubStatusFilter={setSubStatusFilter}
              selectedDepartment={selectedDepartment}
              setSelectedDepartment={setSelectedDepartment}
              selectedLocation={selectedLocation}
              setSelectedLocation={setSelectedLocation}
              selectedExpenseType={selectedExpenseType}
              setSelectedExpenseType={setSelectedExpenseType}
              selectedPaymentStatus={selectedPaymentStatus}
              setSelectedPaymentStatus={setSelectedPaymentStatus}
              selectedMonth={selectedMonth}
              setSelectedMonth={setSelectedMonth}
              departments={departments}
              locations={locations}
              expenseTypes={expenseTypes}
              onReset={handleResetFilters}
            />

            {/* Reusable Component 3: ReimbursementTable */}
            <ReimbursementTable
              claims={filteredClaims}
              onViewDetails={(claim) => setSelectedClaimForDrawer(claim)}
              onApprove={(claim) => setApproveModalClaim(claim)}
              onReject={(claim) => setRejectModalClaim(claim)}
              onProcessPayment={(claim) => setPaymentModalClaim(claim)}
            />

          </div>
        )}

        {/* TAB 2: EXPENSE TYPES MASTER */}
        {activeTab === 'expense-types' && (
          <ExpenseTypeManager
            expenseTypes={expenseTypes}
            onSaveExpenseType={handleSaveExpenseType}
            onToggleStatus={handleToggleExpenseTypeStatus}
          />
        )}

        {/* TAB 3: REPORTS & ANALYTICS */}
        {activeTab === 'reports' && (
          <ReimbursementReports
            claims={claimsList}
            expenseTypes={expenseTypes}
            onExport={handleExport}
          />
        )}

        {/* Reusable Component 4: ReimbursementDetailsDrawer */}
        {selectedClaimForDrawer && (
          <ReimbursementDetailsDrawer
            claim={selectedClaimForDrawer}
            onClose={() => setSelectedClaimForDrawer(null)}
            onApprove={(c) => setApproveModalClaim(c)}
            onReject={(c) => setRejectModalClaim(c)}
            onSendBack={(c) => setSendBackModalClaim(c)}
            onProcessPayment={(c) => setPaymentModalClaim(c)}
            onToast={showToast}
          />
        )}

        {/* Reusable Component 5: ReimbursementForm (Create / Edit Modal) */}
        {isCreateModalOpen && (
          <ReimbursementForm
            isOpen={isCreateModalOpen}
            onClose={() => {
              setIsCreateModalOpen(false);
              setEditingClaim(null);
            }}
            onSave={handleSaveClaim}
            editingClaim={editingClaim}
            expenseTypes={expenseTypes}
            employees={mockEmployees}
          />
        )}

        {/* Reusable Component 6: ReimbursementPaymentForm (Process Payment Modal) */}
        {paymentModalClaim && (
          <ReimbursementPaymentForm
            claim={paymentModalClaim}
            onClose={() => setPaymentModalClaim(null)}
            onProcess={(claimId, data) => handleProcessPayment(claimId, data)}
          />
        )}

        {/* APPROVE CLAIM MODAL */}
        {approveModalClaim && (
          <ApproveClaimDialog
            claim={approveModalClaim}
            onClose={() => setApproveModalClaim(null)}
            onApprove={(claimId, approvedAmt, remark) => handleApproveClaim(claimId, approvedAmt, remark)}
          />
        )}

        {/* REJECT CLAIM MODAL (MANDATORY REASON) */}
        {rejectModalClaim && (
          <RejectClaimDialog
            claim={rejectModalClaim}
            onClose={() => setRejectModalClaim(null)}
            onReject={(claimId, reason) => handleRejectClaim(claimId, reason)}
          />
        )}

        {/* SEND BACK CLAIM MODAL (MANDATORY CORRECTION REASON) */}
        {sendBackModalClaim && (
          <SendBackClaimDialog
            claim={sendBackModalClaim}
            onClose={() => setSendBackModalClaim(null)}
            onSendBack={(claimId, reason) => handleSendBackClaim(claimId, reason)}
          />
        )}

      </div>
    </AdminLayout>
  );
}

// ----------------------------------------------------------------------
// ACTION DIALOGS (Approve, Reject, Send Back)
// ----------------------------------------------------------------------
function ApproveClaimDialog({ claim, onClose, onApprove }) {
  const [approvedAmt, setApprovedAmt] = useState(claim.amount);
  const [remark, setRemark] = useState('');
  const [varianceReason, setVarianceReason] = useState('');

  const hasVariance = Number(approvedAmt) !== Number(claim.amount);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (hasVariance && !varianceReason.trim()) {
      alert('Please provide a variance reason when approved amount differs from claimed amount.');
      return;
    }
    const finalRemark = hasVariance 
      ? `Approved: ₹${approvedAmt} (Variance Note: ${varianceReason}). ${remark}`
      : (remark || 'Approved as claimed.');
    onApprove(claim.id, approvedAmt, finalRemark);
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>Approve Claim — {claim.claimId}</h3>
          <button type="button" className={styles.iconBtn} onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className={styles.modalBody}>
            <div className={styles.infoGrid} style={{ background: '#f8fafc' }}>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Employee</span>
                <span className={styles.infoVal}>{claim.employeeName} ({claim.employeeCode})</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Expense Category</span>
                <span className={styles.infoVal}>{claim.expenseType}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Claimed Amount</span>
                <span className={styles.infoVal} style={{ fontSize: '15px' }}>₹{claim.amount.toLocaleString()}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Expense Date</span>
                <span className={styles.infoVal}>{claim.expenseDate}</span>
              </div>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>
                Approved Amount (₹) <span className={styles.requiredStar}>*</span>
              </label>
              <input
                type="number"
                className={styles.input}
                min={1}
                max={claim.amount}
                value={approvedAmt}
                onChange={(e) => setApprovedAmt(e.target.value)}
                required
              />
              <span className={styles.helperText}>
                You may adjust the approved amount if any portion is ineligible.
              </span>
            </div>

            {hasVariance && (
              <div className={styles.formGroup}>
                <label className={styles.label} style={{ color: '#b91c1c' }}>
                  Variance Reason <span className={styles.requiredStar}>*</span>
                </label>
                <input
                  type="text"
                  className={styles.input}
                  placeholder="e.g. Excluded personal mileage of ₹200 as per policy"
                  value={varianceReason}
                  onChange={(e) => setVarianceReason(e.target.value)}
                  required
                />
              </div>
            )}

            <div className={styles.formGroup}>
              <label className={styles.label}>Approval Remark (Optional)</label>
              <textarea
                className={styles.textarea}
                placeholder="Add optional notes for Accounts verification..."
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
              />
            </div>
          </div>

          <div className={styles.modalFooter}>
            <button type="button" className={styles.btnSecondary} onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className={styles.btnSuccess}>
              <Check size={15} />
              <span>Confirm Approval</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function RejectClaimDialog({ claim, onClose, onReject }) {
  const [reason, setReason] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!reason.trim()) {
      alert('Rejection reason is mandatory.');
      return;
    }
    onReject(claim.id, reason);
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle} style={{ color: '#dc2626' }}>
            Reject Reimbursement Claim
          </h3>
          <button type="button" className={styles.iconBtn} onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className={styles.modalBody}>
            <div className={`${styles.calloutBox} ${styles.calloutBoxWarning}`} style={{ borderColor: '#fca5a5', background: '#fef2f2', color: '#991b1b' }}>
              <AlertCircle size={18} style={{ flexShrink: 0 }} />
              <div>
                You are rejecting claim <strong>{claim.claimId}</strong> for <strong>{claim.employeeName}</strong> (₹{claim.amount.toLocaleString()}).
              </div>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>
                Rejection Reason <span className={styles.requiredStar}>*</span>
              </label>
              <textarea
                className={styles.textarea}
                placeholder="Specify the policy violation, unapproved expense reason or lack of justification..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required
              />
              <span className={styles.helperText}>This reason will be logged in the permanent audit trail.</span>
            </div>
          </div>

          <div className={styles.modalFooter}>
            <button type="button" className={styles.btnSecondary} onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className={styles.btnDanger}>
              <X size={15} />
              <span>Confirm Rejection</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function SendBackClaimDialog({ claim, onClose, onSendBack }) {
  const [reason, setReason] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!reason.trim()) {
      alert('Correction requirement is mandatory when sending back a claim.');
      return;
    }
    onSendBack(claim.id, reason);
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle} style={{ color: '#c2410c' }}>
            Send Back Claim for Correction
          </h3>
          <button type="button" className={styles.iconBtn} onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className={styles.modalBody}>
            <div className={styles.calloutBox}>
              <AlertCircle size={18} style={{ flexShrink: 0 }} />
              <div>
                Sending back claim <strong>{claim.claimId}</strong> will notify <strong>{claim.employeeName}</strong> to re-upload clear bills or amend claimed details.
              </div>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>
                Required Correction / Clarification <span className={styles.requiredStar}>*</span>
              </label>
              <textarea
                className={styles.textarea}
                placeholder="e.g. Attached receipt is blurred / GST invoice missing / date mismatch..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required
              />
            </div>
          </div>

          <div className={styles.modalFooter}>
            <button type="button" className={styles.btnSecondary} onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className={styles.btnPrimary} style={{ background: '#ea580c', borderColor: '#c2410c' }}>
              <Check size={15} />
              <span>Send Back to Employee</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
