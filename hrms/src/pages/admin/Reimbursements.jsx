import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Receipt, Plus, Download, Tag, BarChart3, Check, X, AlertCircle, Loader2, RefreshCw
} from 'lucide-react';
import styles from './Reimbursements.module.css';

import AdminLayout from '../../components/layout/AdminLayout';
import Toast from '../../components/common/Toast';
import ConfirmModal from '../../components/common/ConfirmModal';
import { usePermissions } from '../../context/PermissionContext';
import { useCompany } from '../../context/CompanyContext';

// Services
import reimbursementService from '../../services/reimbursementService';
import employeeService from '../../services/employeeService';

import { calculateReimbursementMetrics } from '../../data/reimbursementData';

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
  const { canAdd, canEdit, canDelete, canExport, canApprove } = usePermissions();
  const { activeCompanyId, activeCompany } = useCompany();
  const compId = activeCompanyId || activeCompany?.companyId || 'RRS8392014SEC';

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

  // Dynamic MongoDB State
  const [claimsList, setClaimsList] = useState([]);
  const [expenseTypes, setExpenseTypes] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

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

  // Fetch all live data from MongoDB
  const fetchReimbursementData = useCallback(async () => {
    if (!compId) return;
    try {
      setIsLoading(true);
      const [claims, types, emps] = await Promise.all([
        reimbursementService.getClaims(compId),
        reimbursementService.getExpenseTypes(compId),
        employeeService.getEmployees(compId),
      ]);
      setClaimsList(claims || []);
      setExpenseTypes(types || []);
      setEmployees(emps || []);
    } catch (err) {
      console.error('Failed to load reimbursement data from database:', err);
      showToast(err.message || 'Failed to load reimbursements', 'danger');
    } finally {
      setIsLoading(false);
    }
  }, [compId]);

  useEffect(() => {
    fetchReimbursementData();
  }, [fetchReimbursementData]);

  // Extract unique departments and sites from live employees and claims
  const departments = useMemo(() => {
    const depts = new Set([
      ...employees.map(e => e.department).filter(Boolean),
      ...claimsList.map(c => c.department).filter(Boolean)
    ]);
    return ['All', ...Array.from(depts)];
  }, [employees, claimsList]);

  const locations = useMemo(() => {
    const locs = new Set([
      ...employees.map(e => e.site || e.siteLocation || e.joiningLocation).filter(Boolean),
      ...claimsList.map(c => c.site).filter(Boolean)
    ]);
    return ['All', ...Array.from(locs)];
  }, [employees, claimsList]);

  // Summary Metrics calculated dynamically from real claims
  const metrics = useMemo(() => {
    const normalized = claimsList.map(c => ({
      ...c,
      id: c._id || c.id || c.claimId,
      amount: Number(c.claimedAmount || c.amount || 0),
      approvedAmount: Number(c.approvedAmount || 0),
      paidAmount: Number(c.paidAmount || 0),
      date: c.expenseDate || '',
    }));
    return calculateReimbursementMetrics(normalized);
  }, [claimsList]);

  // Filtered Claims
  const filteredClaims = useMemo(() => {
    return claimsList.map(c => ({
      ...c,
      id: c._id || c.id || c.claimId,
      amount: Number(c.claimedAmount || c.amount || 0),
      approvedAmount: Number(c.approvedAmount || 0),
      paidAmount: Number(c.paidAmount || 0),
      submittedDate: c.createdAt ? new Date(c.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '',
      approvalHistory: Array.isArray(c.auditTrail) && c.auditTrail.length > 0 ? c.auditTrail.map(a => ({
        action: a.action,
        person: a.by,
        role: 'Approver',
        date: a.date,
        time: '',
        comment: a.notes
      })) : []
    })).filter(claim => {
      // Search
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || 
        (claim.claimId && claim.claimId.toLowerCase().includes(q)) ||
        (claim.employeeCode && claim.employeeCode.toLowerCase().includes(q)) ||
        (claim.employeeName && claim.employeeName.toLowerCase().includes(q)) ||
        (claim.expenseType && claim.expenseType.toLowerCase().includes(q)) ||
        (claim.merchantName && claim.merchantName.toLowerCase().includes(q));

      // Sub Status Filter
      let matchesSubStatus = true;
      if (subStatusFilter === 'Pending Approval') {
        matchesSubStatus = claim.approvalStatus === 'Pending Approval' || claim.approvalStatus === 'Submitted' || (claim.approvalStatus && claim.approvalStatus.includes('Pending'));
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
      const matchesLoc = selectedLocation === 'All' || (claim.site && claim.site.includes(selectedLocation));
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

  // 1. Submit New / Edited Claim in MongoDB
  const handleSaveClaim = async (claimData) => {
    try {
      if (editingClaim) {
        const idToUpdate = editingClaim._id || editingClaim.id || editingClaim.claimId;
        await reimbursementService.updateClaim(compId, idToUpdate, claimData);
        showToast(`✓ Reimbursement claim ${claimData.claimId || editingClaim.claimId} updated successfully.`);
      } else {
        const created = await reimbursementService.createClaim(compId, claimData);
        showToast(`✓ Reimbursement claim ${created?.claimId || 'created'} saved successfully.`);
      }
      setIsCreateModalOpen(false);
      setEditingClaim(null);
      fetchReimbursementData();
    } catch (err) {
      showToast(err.message || 'Failed to save reimbursement claim', 'danger');
    }
  };

  // 2. Approve Claim Handler in MongoDB
  const handleApproveClaim = async (claimId, approvedAmt, remark) => {
    try {
      await reimbursementService.reviewClaim(compId, claimId, {
        action: 'approve',
        approvedAmount: Number(approvedAmt),
        remarks: remark
      });
      setApproveModalClaim(null);
      if (selectedClaimForDrawer) setSelectedClaimForDrawer(null);
      showToast(`✓ Claim approved for ₹${Number(approvedAmt).toLocaleString('en-IN')}.`);
      fetchReimbursementData();
    } catch (err) {
      showToast(err.message || 'Failed to approve claim', 'danger');
    }
  };

  // 3. Reject Claim Handler in MongoDB
  const handleRejectClaim = async (claimId, reason) => {
    try {
      await reimbursementService.reviewClaim(compId, claimId, {
        action: 'reject',
        rejectionReason: reason
      });
      setRejectModalClaim(null);
      if (selectedClaimForDrawer) setSelectedClaimForDrawer(null);
      showToast('Claim rejected.', 'info');
      fetchReimbursementData();
    } catch (err) {
      showToast(err.message || 'Failed to reject claim', 'danger');
    }
  };

  // 4. Send Back Claim Handler in MongoDB
  const handleSendBackClaim = async (claimId, reason) => {
    try {
      await reimbursementService.reviewClaim(compId, claimId, {
        action: 'send_back',
        sendBackReason: reason
      });
      setSendBackModalClaim(null);
      if (selectedClaimForDrawer) setSelectedClaimForDrawer(null);
      showToast('Claim sent back for employee correction.', 'info');
      fetchReimbursementData();
    } catch (err) {
      showToast(err.message || 'Failed to send back claim', 'danger');
    }
  };

  // 5. Process Payment Handler in MongoDB
  const handleProcessPayment = async (claimId, paymentData) => {
    try {
      await reimbursementService.processPayment(compId, claimId, {
        paidAmount: Number(paymentData.paidAmount),
        paymentDate: paymentData.paymentDate,
        paymentMethod: paymentData.paymentMode || paymentData.paymentMethod || 'Bank Transfer',
        paymentReference: paymentData.transactionNumber || paymentData.paymentReference,
        payrollMonth: paymentData.payrollMonth,
        remarks: paymentData.remarks
      });
      setPaymentModalClaim(null);
      if (selectedClaimForDrawer) setSelectedClaimForDrawer(null);
      showToast(`✓ Payment of ₹${Number(paymentData.paidAmount).toLocaleString('en-IN')} processed successfully!`);
      fetchReimbursementData();
    } catch (err) {
      showToast(err.message || 'Failed to record payment', 'danger');
    }
  };

  // --- EXPENSE TYPE CRUD HANDLERS IN MONGODB ---
  const handleSaveExpenseType = async (typeData) => {
    try {
      await reimbursementService.saveExpenseType(compId, typeData);
      showToast(`✓ Expense category "${typeData.name}" saved successfully.`);
      fetchReimbursementData();
    } catch (err) {
      showToast(err.message || 'Failed to save expense category', 'danger');
    }
  };

  const handleToggleExpenseTypeStatus = async (type) => {
    try {
      const nextStatus = type.status === 'Active' ? 'Inactive' : 'Active';
      await reimbursementService.saveExpenseType(compId, { ...type, status: nextStatus });
      showToast(`Expense category "${type.name}" marked ${nextStatus}.`);
      fetchReimbursementData();
    } catch (err) {
      showToast(err.message || 'Failed to update expense category status', 'danger');
    }
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
              onClick={fetchReimbursementData}
              disabled={isLoading}
              title="Refresh Records"
            >
              <RefreshCw size={15} className={isLoading ? styles.spinning : ''} />
              <span>Refresh</span>
            </button>
            {canExport('reimbursements') && (
              <button
                type="button"
                className={styles.btnSecondary}
                onClick={() => handleExport('excel')}
                title="Export Reimbursement Register"
              >
                <Download size={15} />
                <span>Export Report</span>
              </button>
            )}
            {canAdd('reimbursements') && (
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
            )}
          </div>
        </header>

        {/* Loading Indicator */}
        {isLoading && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '1rem', color: '#64748b' }}>
            <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
            <span>Loading live reimbursement data...</span>
          </div>
        )}

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
            employees={employees}
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
  const claimAmount = Number(claim.claimedAmount || claim.amount || 0);
  const [approvedAmt, setApprovedAmt] = useState(claimAmount);
  const [remark, setRemark] = useState('');
  const [varianceReason, setVarianceReason] = useState('');

  const hasVariance = Number(approvedAmt) !== claimAmount;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (hasVariance && !varianceReason.trim()) {
      alert('Please provide a variance reason when approved amount differs from claimed amount.');
      return;
    }
    const finalRemark = hasVariance 
      ? `Approved: ₹${approvedAmt} (Variance Note: ${varianceReason}). ${remark}`
      : (remark || 'Approved as claimed.');
    onApprove(claim._id || claim.id || claim.claimId, approvedAmt, finalRemark);
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
                <span className={styles.infoVal}>{claim.employeeName} ({claim.employeeCode || claim.employeeId})</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Expense Category</span>
                <span className={styles.infoVal}>{claim.expenseType}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Claimed Amount</span>
                <span className={styles.infoVal} style={{ fontSize: '15px' }}>₹{claimAmount.toLocaleString('en-IN')}</span>
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
                max={claimAmount}
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
  const claimAmount = Number(claim.claimedAmount || claim.amount || 0);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!reason.trim()) {
      alert('Rejection reason is mandatory.');
      return;
    }
    onReject(claim._id || claim.id || claim.claimId, reason);
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
                You are rejecting claim <strong>{claim.claimId}</strong> for <strong>{claim.employeeName}</strong> (₹{claimAmount.toLocaleString('en-IN')}).
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
    onSendBack(claim._id || claim.id || claim.claimId, reason);
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
