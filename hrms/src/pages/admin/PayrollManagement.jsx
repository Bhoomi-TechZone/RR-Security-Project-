import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  WalletCards, Play, History, Download, Plus, FileSpreadsheet,
  ChevronRight, RefreshCw, Printer, AlertCircle, FileText
} from 'lucide-react';
import AdminLayout from '../../components/layout/AdminLayout';
import Toast from '../../components/common/Toast';
import EmptyState from '../../components/common/EmptyState';
import Pagination from '../../components/common/Pagination';

// Payroll sub-components
import PayrollPeriodSelector from '../../components/payroll/PayrollPeriodSelector';
import PayrollSummaryCards from '../../components/payroll/PayrollSummaryCards';
import PayrollStatusBanner from '../../components/payroll/PayrollStatusBanner';
import PayrollFilters from '../../components/payroll/PayrollFilters';
import PayrollTable from '../../components/payroll/PayrollTable';
import PayrollDetailsDrawer from '../../components/payroll/PayrollDetailsDrawer';
import RunPayrollModal from '../../components/payroll/RunPayrollModal';
import ApprovePayrollModal from '../../components/payroll/ApprovePayrollModal';
import SalaryStructureTable from '../../components/payroll/SalaryStructureTable';
import SalaryStructureDrawer from '../../components/payroll/SalaryStructureDrawer';
import SalaryStructureModal from '../../components/payroll/SalaryStructureModal';
import SalarySlipsTable from '../../components/payroll/SalarySlipsTable';
import GenerateSlipsModal from '../../components/payroll/GenerateSlipsModal';
import SalarySlipPreview from '../../components/payroll/SalarySlipPreview';
import StatutoryReports from '../../components/payroll/StatutoryReports';
import StatutoryDownloadModal from '../../components/payroll/StatutoryDownloadModal';
import PayrollHistoryModal from '../../components/payroll/PayrollHistoryModal';
import PayrollAnalytics from '../../components/payroll/PayrollAnalytics';
import PayrollExportModal from '../../components/payroll/PayrollExportModal';
import PayrollIssueModal from '../../components/payroll/PayrollIssueModal';

// Rate Revision & Arrears Components
import RateRevisionSummaryCards from '../../components/payroll/RateRevisionSummaryCards';
import RateRevisionFilters from '../../components/payroll/RateRevisionFilters';
import RateRevisionTable from '../../components/payroll/RateRevisionTable';
import RateRevisionForm from '../../components/payroll/RateRevisionForm';
import RateRevisionDetailsDrawer from '../../components/payroll/RateRevisionDetailsDrawer';
import ArrearsSummaryCards from '../../components/payroll/ArrearsSummaryCards';
import ArrearsFilters from '../../components/payroll/ArrearsFilters';
import ArrearsTable from '../../components/payroll/ArrearsTable';
import ArrearsDetailsDrawer from '../../components/payroll/ArrearsDetailsDrawer';

// Mock Data
import { mockPayrollRecords } from '../../data/payrollData';
import { mockSalarySlips } from '../../data/salarySlipData';
import { mockPFRecords, mockESIRecords, mockStatutorySummary } from '../../data/statutoryData';
import { mockPayrollHistory } from '../../data/payrollHistoryData';
import { mockCompanies } from '../../data/companyData';
import { mockDepartments } from '../../data/masters/departmentData';
import { mockDesignations } from '../../data/masters/designationData';
import { mockEmployees } from '../../data/employeeData';
import {
  INITIAL_RATE_REVISIONS,
  INITIAL_ARREARS_RECORDS,
  calculateRateRevisionMetrics,
  calculateArrearsMetrics
} from '../../data/rateRevisionData';

import styles from './PayrollManagement.module.css';

const PAYROLL_STORAGE_KEY = 'novaspark_payroll_records';
const SLIPS_STORAGE_KEY = 'novaspark_salary_slips';
const RATE_REVISION_STORAGE_KEY = 'novaspark_rate_revisions';
const ARREARS_STORAGE_KEY = 'novaspark_arrears_records';
const PAGE_SIZE = 8;

export default function PayrollManagement() {
  const [searchParams] = useSearchParams();

  // Month State
  const [selectedMonth, setSelectedMonth] = useState('2026-08');

  // Active Tab
  const [activeTab, setActiveTab] = useState(() => searchParams.get('tab') || 'processing'); // 'processing' | 'structure' | 'rate-revision' | 'arrears' | 'slips' | 'statutory'

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam) {
      setActiveTab(tabParam);
    } else {
      setActiveTab('processing');
    }
  }, [searchParams]);

  // Payroll Records State
  const [records, setRecords] = useState(() => {
    try {
      const saved = localStorage.getItem(PAYROLL_STORAGE_KEY);
      return saved ? JSON.parse(saved) : mockPayrollRecords;
    } catch {
      return mockPayrollRecords;
    }
  });

  // Salary Slips State
  const [slips, setSlips] = useState(() => {
    try {
      const saved = localStorage.getItem(SLIPS_STORAGE_KEY);
      return saved ? JSON.parse(saved) : mockSalarySlips;
    } catch {
      return mockSalarySlips;
    }
  });

  // Rate Revision State
  const [revisions, setRevisions] = useState(() => {
    try {
      const saved = localStorage.getItem(RATE_REVISION_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      return INITIAL_RATE_REVISIONS;
    } catch {
      return INITIAL_RATE_REVISIONS;
    }
  });

  // Arrears Records State
  const [arrears, setArrears] = useState(() => {
    try {
      const saved = localStorage.getItem(ARREARS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      return INITIAL_ARREARS_RECORDS;
    } catch {
      return INITIAL_ARREARS_RECORDS;
    }
  });

  const saveRevisions = (updated) => {
    setRevisions(updated);
    try {
      localStorage.setItem(RATE_REVISION_STORAGE_KEY, JSON.stringify(updated));
    } catch (e) { console.error(e); }
  };

  const saveArrears = (updated) => {
    setArrears(updated);
    try {
      localStorage.setItem(ARREARS_STORAGE_KEY, JSON.stringify(updated));
    } catch (e) { console.error(e); }
  };

  // Payroll Filters State
  const [search, setSearch] = useState('');
  const [clientFilter, setClientFilter] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [desigFilter, setDesigFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Rate Revision Filters State
  const [revSearch, setRevSearch] = useState('');
  const [revClientFilter, setRevClientFilter] = useState('');
  const [revStatusFilter, setRevStatusFilter] = useState('');

  // Arrears Filters State
  const [arrSearch, setArrSearch] = useState('');
  const [arrClientFilter, setArrClientFilter] = useState('');
  const [arrStatusFilter, setArrStatusFilter] = useState('');

  // Modals & Drawers State for Rate Revision & Arrears
  const [selectedRevision, setSelectedRevision] = useState(null);
  const [isRevisionDrawerOpen, setIsRevisionDrawerOpen] = useState(false);
  const [isRevisionFormOpen, setIsRevisionFormOpen] = useState(false);
  const [editingRevision, setEditingRevision] = useState(null);

  const [selectedArrear, setSelectedArrear] = useState(null);
  const [isArrearDrawerOpen, setIsArrearDrawerOpen] = useState(false);

  const [rejectRevisionRecord, setRejectRevisionRecord] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  // Rate Revision & Arrears Metrics
  const rateRevMetrics = useMemo(() => calculateRateRevisionMetrics(revisions), [revisions]);
  const arrearsMetrics = useMemo(() => calculateArrearsMetrics(arrears), [arrears]);

  // Slips Filters State
  const [slipSearch, setSlipSearch] = useState('');
  const [slipClientFilter, setSlipClientFilter] = useState('');
  const [slipDeptFilter, setSlipDeptFilter] = useState('');
  const [slipStatusFilter, setSlipStatusFilter] = useState('');

  // Pagination State
  const [page, setPage] = useState(1);

  // Modals & Drawers State
  const [selectedPayroll, setSelectedPayroll] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);

  const [approveRecord, setApproveRecord] = useState(null);
  const [isRunPayrollOpen, setIsRunPayrollOpen] = useState(false);

  const [selectedStructure, setSelectedStructure] = useState(null);
  const [isStructureDrawerOpen, setIsStructureDrawerOpen] = useState(false);
  const [editStructureRecord, setEditStructureRecord] = useState(null);

  const [selectedSlip, setSelectedSlip] = useState(null);
  const [isGenerateSlipsOpen, setIsGenerateSlipsOpen] = useState(false);

  const [statutoryDownloadType, setStatutoryDownloadType] = useState('combined');
  const [isStatutoryDownloadOpen, setIsStatutoryDownloadOpen] = useState(false);

  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);

  const [issueRecord, setIssueRecord] = useState(null);

  // Toast State
  const [toast, setToast] = useState(null);

  const notify = (message, type = 'success') => {
    setToast({ message, type });
  };

  // Month Display label
  const monthLabel = useMemo(() => {
    if (selectedMonth === '2026-08') return 'August 2026';
    if (selectedMonth === '2026-07') return 'July 2026';
    if (selectedMonth === '2026-06') return 'June 2026';
    if (selectedMonth === '2026-05') return 'May 2026';
    const [y, m] = selectedMonth.split('-');
    const date = new Date(parseInt(y, 10), parseInt(m, 10) - 1, 1);
    return date.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
  }, [selectedMonth]);

  // Dynamic KPI Summary for selected month
  const summaryKPI = useMemo(() => {
    const totalEmployees = 1250;
    const processedEmployees = records.filter(r => r.status === 'processed').length * 59 + 1; // scaled for 1250 demo
    const pendingEmployees = totalEmployees - Math.min(totalEmployees, processedEmployees);
    const totalNetPayroll = records.reduce((sum, r) => sum + (r.netSalary || 0), 0) * 59;

    return {
      totalEmployees,
      processedEmployees: Math.min(totalEmployees, processedEmployees),
      pendingEmployees: Math.max(0, pendingEmployees),
      totalNetPayroll: totalNetPayroll || 48250000
    };
  }, [records]);

  // Overall banner cycle status
  const cycleStatus = useMemo(() => {
    const processed = records.filter(r => r.status === 'processed').length;
    if (processed === records.length) return 'Processed';
    if (processed > 0) return 'Processing';
    return 'Draft';
  }, [records]);

  // Filtered Payroll Records for Tab 1
  const filteredPayroll = useMemo(() => {
    return records.filter((item) => {
      const q = search.toLowerCase().trim();
      if (q && !`${item.employeeName} ${item.employeeId} ${item.clientName} ${item.department}`.toLowerCase().includes(q)) {
        return false;
      }
      if (clientFilter && item.clientName !== clientFilter) return false;
      if (deptFilter && item.department !== deptFilter) return false;
      if (desigFilter && item.designation !== desigFilter) return false;
      if (statusFilter && item.status !== statusFilter) return false;
      return true;
    });
  }, [records, search, clientFilter, deptFilter, desigFilter, statusFilter]);

  // Filtered Salary Structure Records for Tab 2
  const filteredStructure = useMemo(() => {
    return records.filter((item) => {
      const q = search.toLowerCase().trim();
      if (q && !`${item.employeeName} ${item.employeeId} ${item.clientName} ${item.department}`.toLowerCase().includes(q)) {
        return false;
      }
      if (clientFilter && item.clientName !== clientFilter) return false;
      if (deptFilter && item.department !== deptFilter) return false;
      if (desigFilter && item.designation !== desigFilter) return false;
      return true;
    });
  }, [records, search, clientFilter, deptFilter, desigFilter]);

  // Filtered Rate Revisions for Tab 3
  const filteredRevisions = useMemo(() => {
    return revisions.filter((item) => {
      const q = revSearch.toLowerCase().trim();
      const clientName = item.client || item.clientName || '';
      const status = item.status || item.revisionStatus || '';
      const revId = item.revisionId || item.id || '';

      if (q && !`${item.employeeName} ${item.employeeCode} ${clientName} ${item.designation} ${revId}`.toLowerCase().includes(q)) {
        return false;
      }
      if (revClientFilter && clientName !== revClientFilter) return false;
      if (revStatusFilter && status !== revStatusFilter) return false;
      return true;
    });
  }, [revisions, revSearch, revClientFilter, revStatusFilter]);

  // Filtered Arrears for Tab 4
  const filteredArrears = useMemo(() => {
    return arrears.filter((item) => {
      const q = arrSearch.toLowerCase().trim();
      const clientName = item.client || item.clientName || '';
      const pStatus = item.payrollStatus || '';
      const arrId = item.arrearId || item.id || '';
      const revId = item.revisionId || '';

      if (q && !`${item.employeeName} ${item.employeeCode} ${clientName} ${item.designation} ${arrId} ${revId}`.toLowerCase().includes(q)) {
        return false;
      }
      if (arrClientFilter && clientName !== arrClientFilter) return false;
      if (arrStatusFilter && pStatus !== arrStatusFilter) return false;
      return true;
    });
  }, [arrears, arrSearch, arrClientFilter, arrStatusFilter]);

  // Filtered Salary Slips for Tab 5
  const filteredSlips = useMemo(() => {
    return slips.filter((slip) => {
      const q = slipSearch.toLowerCase().trim();
      if (q && !`${slip.employeeName} ${slip.employeeId} ${slip.clientName} ${slip.slipNumber}`.toLowerCase().includes(q)) {
        return false;
      }
      if (slipClientFilter && slip.clientName !== slipClientFilter) return false;
      if (slipDeptFilter && slip.department !== slipDeptFilter) return false;
      if (slipStatusFilter && slip.status.toLowerCase() !== slipStatusFilter.toLowerCase()) return false;
      return true;
    });
  }, [slips, slipSearch, slipClientFilter, slipDeptFilter, slipStatusFilter]);

  // Active paginated rows
  const activeRows = activeTab === 'processing'
    ? filteredPayroll
    : activeTab === 'structure'
      ? filteredStructure
      : activeTab === 'rate-revision'
        ? filteredRevisions
        : activeTab === 'arrears'
          ? filteredArrears
          : filteredSlips;

  const paginatedRows = activeRows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Reset Filters
  const handleResetFilters = () => {
    setSearch('');
    setClientFilter('');
    setDeptFilter('');
    setDesigFilter('');
    setStatusFilter('');
    setRevSearch('');
    setRevClientFilter('');
    setRevStatusFilter('');
    setArrSearch('');
    setArrClientFilter('');
    setArrStatusFilter('');
    setSlipSearch('');
    setSlipClientFilter('');
    setSlipDeptFilter('');
    setSlipStatusFilter('');
    setPage(1);
    notify('Filters reset.', 'info');
  };

  // Actions: Rate Revision Handlers
  const handleSaveRevision = (revData) => {
    let updated;
    const revId = revData.revisionId || revData.id || `REV-2026-${Date.now().toString().slice(-3)}`;
    const normalizedRev = {
      ...revData,
      id: revData.id || `rev-${Date.now()}`,
      revisionId: revId,
      status: revData.status || 'Pending Approval',
      revisionStatus: revData.status || 'Pending Approval',
      client: revData.client || revData.clientName,
      clientName: revData.client || revData.clientName,
      site: revData.site || revData.siteName,
      siteName: revData.site || revData.siteName,
    };

    if (editingRevision) {
      updated = revisions.map(r => (r.id === normalizedRev.id || r.revisionId === normalizedRev.revisionId) ? normalizedRev : r);
      notify(`✓ Rate revision updated for ${normalizedRev.employeeName}.`, 'success');
    } else {
      updated = [normalizedRev, ...revisions];
      // Generate linked arrear record
      const newArrear = {
        id: `arr-${Date.now()}`,
        arrearId: `ARR-2026-${Date.now().toString().slice(-3)}`,
        revisionId: revId,
        employeeCode: normalizedRev.employeeCode,
        employeeName: normalizedRev.employeeName,
        client: normalizedRev.client,
        clientName: normalizedRev.client,
        site: normalizedRev.site,
        siteName: normalizedRev.site,
        designation: normalizedRev.designation,
        oldRate: normalizedRev.oldRate,
        revisedRate: normalizedRev.newRate,
        newRate: normalizedRev.newRate,
        difference: normalizedRev.rateDifference,
        rateDifference: normalizedRev.rateDifference,
        applicableDays: 30,
        arrearMonth: normalizedRev.effectiveFrom ? normalizedRev.effectiveFrom.slice(0, 7) : 'August 2026',
        arrearAmount: normalizedRev.rateDifference,
        pfApplicable: true,
        esiApplicable: true,
        payrollStatus: 'Pending Calculation',
        calculationNotes: `Generated from Rate Revision ${revId}`,
        createdAt: new Date().toISOString().slice(0, 10)
      };
      saveArrears([newArrear, ...arrears]);
      notify(`✓ New rate revision submitted for ${normalizedRev.employeeName}. Linked arrear record created.`, 'success');
    }
    saveRevisions(updated);
    setIsRevisionFormOpen(false);
    setEditingRevision(null);
  };

  const handleApproveRevision = (rev) => {
    const revKey = rev.revisionId || rev.id;
    const updated = revisions.map(r => (r.id === rev.id || r.revisionId === rev.revisionId) ? {
      ...r,
      status: 'Approved',
      revisionStatus: 'Approved',
      approvedBy: 'Admin User',
      approvalDate: new Date().toISOString().slice(0, 10),
      rejectionReason: null
    } : r);
    saveRevisions(updated);

    // Update linked arrear to Calculated
    const updatedArrears = arrears.map(a => (a.revisionId === rev.revisionId || a.revisionId === rev.id) ? {
      ...a,
      payrollStatus: a.payrollStatus === 'Pending Calculation' ? 'Calculated' : a.payrollStatus
    } : a);
    saveArrears(updatedArrears);

    if (selectedRevision && (selectedRevision.id === rev.id || selectedRevision.revisionId === rev.revisionId)) {
      setSelectedRevision({
        ...selectedRevision,
        status: 'Approved',
        revisionStatus: 'Approved',
        approvedBy: 'Admin User',
        approvalDate: new Date().toISOString().slice(0, 10),
        rejectionReason: null
      });
    }

    notify(`✓ Revision ${revKey} approved for ${rev.employeeName}. Linked arrears ready for payroll.`, 'success');
  };

  const handleInitiateRejectRevision = (rev) => {
    setRejectRevisionRecord(rev);
    setRejectReason('');
  };

  const handleConfirmRejectRevision = () => {
    if (!rejectReason.trim()) {
      notify('Please provide a mandatory reason for rejection.', 'error');
      return;
    }
    const rev = rejectRevisionRecord;
    const updated = revisions.map(r => (r.id === rev.id || r.revisionId === rev.revisionId) ? {
      ...r,
      status: 'Rejected',
      revisionStatus: 'Rejected',
      approvedBy: 'Admin User',
      approvalDate: new Date().toISOString().slice(0, 10),
      rejectionReason: rejectReason.trim()
    } : r);
    saveRevisions(updated);

    const updatedArrears = arrears.map(a => (a.revisionId === rev.revisionId || a.revisionId === rev.id) ? {
      ...a,
      payrollStatus: 'Pending Calculation',
      remarks: `Revision Rejected: ${rejectReason.trim()}`
    } : a);
    saveArrears(updatedArrears);

    if (selectedRevision && (selectedRevision.id === rev.id || selectedRevision.revisionId === rev.revisionId)) {
      setSelectedRevision({
        ...selectedRevision,
        status: 'Rejected',
        revisionStatus: 'Rejected',
        approvedBy: 'Admin User',
        approvalDate: new Date().toISOString().slice(0, 10),
        rejectionReason: rejectReason.trim()
      });
    }

    setRejectRevisionRecord(null);
    setRejectReason('');
    notify(`Revision rejected for ${rev.employeeName}.`, 'info');
  };

  // Actions: Arrears Handlers
  const handleIncludeInPayroll = (arrear) => {
    const updated = arrears.map(a => a.id === arrear.id ? {
      ...a,
      payrollStatus: 'Included in Payroll'
    } : a);
    saveArrears(updated);

    if (selectedArrear && selectedArrear.id === arrear.id) {
      setSelectedArrear({ ...selectedArrear, payrollStatus: 'Included in Payroll' });
    }

    notify(`✓ Arrear ₹${Number(arrear.arrearAmount).toLocaleString('en-IN')} included in upcoming payroll cycle for ${arrear.employeeName}.`, 'success');
  };

  const handleRecalculateArrear = (arrear) => {
    const updated = arrears.map(a => a.id === arrear.id ? {
      ...a,
      payrollStatus: 'Calculated'
    } : a);
    saveArrears(updated);
    notify(`✓ Arrear recalculated for ${arrear.employeeName}.`, 'success');
  };

  // Actions: Calculate Salary for an Employee
  const handleCalculateSalary = (record) => {
    setIsCalculating(true);
    notify(`Calculating salary for ${record.employeeName}...`, 'info');

    setTimeout(() => {
      const updated = records.map((item) =>
        item.id === record.id ? { ...item, status: 'calculated' } : item
      );
      setRecords(updated);
      try {
        localStorage.setItem(PAYROLL_STORAGE_KEY, JSON.stringify(updated));
      } catch (e) { console.error(e); }

      setIsCalculating(false);
      if (selectedPayroll && selectedPayroll.id === record.id) {
        setSelectedPayroll({ ...selectedPayroll, status: 'calculated' });
      }
      notify('✓ Salary calculated successfully.', 'success');
    }, 700);
  };

  // Actions: Approve Payroll
  const handleConfirmApprove = (record) => {
    const updated = records.map((item) =>
      item.id === record.id
        ? { ...item, status: 'processed', generatedDate: '2026-08-31' }
        : item
    );
    setRecords(updated);

    // Also update corresponding slip
    const updatedSlips = slips.map((s) =>
      s.payrollId === record.id || s.employeeId === record.employeeId
        ? { ...s, status: 'Generated', generatedDate: '31 Aug 2026' }
        : s
    );
    setSlips(updatedSlips);

    try {
      localStorage.setItem(PAYROLL_STORAGE_KEY, JSON.stringify(updated));
      localStorage.setItem(SLIPS_STORAGE_KEY, JSON.stringify(updatedSlips));
    } catch (e) { console.error(e); }

    setApproveRecord(null);
    if (selectedPayroll && selectedPayroll.id === record.id) {
      setSelectedPayroll({ ...selectedPayroll, status: 'processed' });
    }
    notify('✓ Payroll approved successfully.', 'success');
  };

  // Actions: Run Payroll Batch (Completing whole cycle)
  const handleCompleteRunPayroll = () => {
    const updated = records.map((item) => ({
      ...item,
      status: 'processed',
      generatedDate: '2026-08-31',
      holdReason: null
    }));
    setRecords(updated);

    const updatedSlips = slips.map((s) => ({
      ...s,
      status: 'Generated',
      generatedDate: '31 Aug 2026'
    }));
    setSlips(updatedSlips);

    try {
      localStorage.setItem(PAYROLL_STORAGE_KEY, JSON.stringify(updated));
      localStorage.setItem(SLIPS_STORAGE_KEY, JSON.stringify(updatedSlips));
    } catch (e) { console.error(e); }

    setActiveTab('slips');
    notify(`✓ ${monthLabel} payroll processed successfully. Slips generated.`, 'success');
  };

  // Actions: Save Edited Salary Structure
  const handleSaveSalaryStructure = (updatedRecord) => {
    const updated = records.map((item) =>
      item.id === updatedRecord.id ? updatedRecord : item
    );
    setRecords(updated);

    // Also refresh slips
    const updatedSlips = slips.map((s) =>
      s.payrollId === updatedRecord.id || s.employeeId === updatedRecord.employeeId
        ? {
            ...s,
            earnings: {
              ...s.earnings,
              basicSalary: updatedRecord.basicSalary,
              hra: updatedRecord.hra,
              transportAllowance: updatedRecord.transportAllowance,
              otherAllowance: updatedRecord.otherAllowance,
              grossSalary: updatedRecord.grossSalary
            },
            deductions: {
              ...s.deductions,
              pf: updatedRecord.pf,
              esi: updatedRecord.esi,
              otherDeduction: updatedRecord.otherDeduction,
              totalDeductions: updatedRecord.totalDeductions
            },
            netSalary: updatedRecord.netSalary
          }
        : s
    );
    setSlips(updatedSlips);

    try {
      localStorage.setItem(PAYROLL_STORAGE_KEY, JSON.stringify(updated));
      localStorage.setItem(SLIPS_STORAGE_KEY, JSON.stringify(updatedSlips));
    } catch (e) { console.error(e); }

    setEditStructureRecord(null);
    notify('✓ Salary structure updated successfully.', 'success');
  };

  // Actions: Batch Generate Slips
  const handleBatchGenerateSlips = () => {
    const updatedSlips = slips.map((s) => ({
      ...s,
      status: 'Generated',
      generatedDate: '31 Aug 2026'
    }));
    setSlips(updatedSlips);
    try {
      localStorage.setItem(SLIPS_STORAGE_KEY, JSON.stringify(updatedSlips));
    } catch (e) { console.error(e); }

    setIsGenerateSlipsOpen(false);
    notify('✓ Salary slips generated successfully.', 'success');
  };

  // Actions: Generate Single Slip
  const handleGenerateSingleSlip = (slip) => {
    const updatedSlips = slips.map((s) =>
      s.id === slip.id ? { ...s, status: 'Generated', generatedDate: '31 Aug 2026' } : s
    );
    setSlips(updatedSlips);
    try {
      localStorage.setItem(SLIPS_STORAGE_KEY, JSON.stringify(updatedSlips));
    } catch (e) { console.error(e); }

    notify(`✓ Salary slip generated for ${slip.employeeName}.`, 'success');
  };

  // Actions: Download Slip PDF simulation
  const handleDownloadSlip = (slip) => {
    notify(`Preparing salary slip for ${slip.employeeName}...`, 'info');
    setTimeout(() => {
      notify(`✓ Salary slip ready for download (${slip.employeeId}).`, 'success');
    }, 600);
  };

  // Actions: Resolve On Hold Issue
  const handleResolveIssue = (record, resolution) => {
    const updated = records.map((item) =>
      item.id === record.id
        ? { ...item, status: 'calculated', holdReason: null }
        : item
    );
    setRecords(updated);
    try {
      localStorage.setItem(PAYROLL_STORAGE_KEY, JSON.stringify(updated));
    } catch (e) { console.error(e); }

    setIssueRecord(null);
    if (selectedPayroll && selectedPayroll.id === record.id) {
      setSelectedPayroll({ ...selectedPayroll, status: 'calculated', holdReason: null });
    }
    notify('✓ Issue resolved. Salary calculated successfully.', 'success');
  };

  // Actions: Export Report simulation
  const handleExportReport = ({ format, reportType }) => {
    setIsExportOpen(false);
    notify(`Preparing ${reportType} report in ${format.toUpperCase()} format...`, 'info');
    setTimeout(() => {
      notify(`✓ Payroll report exported successfully (${format.toUpperCase()}).`, 'success');
    }, 700);
  };

  // Actions: Download Statutory Return simulation
  const handleDownloadStatutory = ({ reportType, format }) => {
    setIsStatutoryDownloadOpen(false);
    notify(`Generating statutory return (${reportType.toUpperCase()})...`, 'info');
    setTimeout(() => {
      notify('✓ Statutory report downloaded successfully.', 'success');
    }, 700);
  };

  return (
    <AdminLayout>
      <div className={styles.container}>
        {/* Toast Alert */}
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}

        {/* Breadcrumb */}
        <div className={styles.breadcrumb}>
          <span>Dashboard</span>
          <ChevronRight size={14} />
          <strong>Payroll</strong>
        </div>

        {/* Master Page Header */}
        <header className={styles.pageHeader}>
          <div className={styles.headerTitles}>
            <h1 className={styles.title}>Payroll Management</h1>
            <p className={styles.subtitle}>
              Process monthly salaries, manage salary slips and statutory payroll reports.
            </p>
          </div>
          <div className={styles.headerActions}>
            <button
              type="button"
              className={styles.secondaryBtn}
              onClick={() => setIsHistoryOpen(true)}
            >
              <History size={16} />
              <span>Payroll History</span>
            </button>
            <button
              type="button"
              className={styles.primaryBtn}
              onClick={() => setIsRunPayrollOpen(true)}
            >
              <Play size={16} />
              <span>Run Payroll</span>
            </button>
          </div>
        </header>

        {/* 1. Payroll Period Selector */}
        <PayrollPeriodSelector
          selectedMonth={selectedMonth}
          onMonthChange={(newMonth) => {
            setSelectedMonth(newMonth);
            notify(`Payroll cycle switched to ${newMonth}.`, 'info');
          }}
        />

        {/* 2. Payroll Summary KPI Cards */}
        <PayrollSummaryCards summary={summaryKPI} />

        {/* 3. Payroll Status Banner */}
        <PayrollStatusBanner
          monthLabel={monthLabel}
          status={cycleStatus}
          processedCount={summaryKPI.processedEmployees}
          totalCount={summaryKPI.totalEmployees}
          onContinueProcessing={() => setIsRunPayrollOpen(true)}
        />

        {/* TAB 1: PAYROLL PROCESSING */}
        {activeTab === 'processing' && (
          <section className={styles.tabSection}>
            <div className={styles.tabHeaderRow}>
              <div>
                <h2 className={styles.tabHeading}>Payroll Processing</h2>
                <p className={styles.tabSubtext}>
                  Review employee salary calculations before processing payroll.
                </p>
              </div>
              <div className={styles.tabActions}>
                <button
                  type="button"
                  className={styles.outlineBtn}
                  onClick={() => setIsExportOpen(true)}
                >
                  <Download size={15} />
                  <span>Export Payroll</span>
                </button>
                <button
                  type="button"
                  className={styles.tabPrimaryBtn}
                  onClick={() => setIsRunPayrollOpen(true)}
                >
                  <Play size={15} />
                  <span>Run Payroll</span>
                </button>
              </div>
            </div>

            {/* Filters */}
            <PayrollFilters
              search={search}
              onSearchChange={(v) => { setSearch(v); setPage(1); }}
              client={clientFilter}
              onClientChange={(v) => { setClientFilter(v); setPage(1); }}
              department={deptFilter}
              onDepartmentChange={(v) => { setDeptFilter(v); setPage(1); }}
              designation={desigFilter}
              onDesignationChange={(v) => { setDesigFilter(v); setPage(1); }}
              status={statusFilter}
              onStatusChange={(v) => { setStatusFilter(v); setPage(1); }}
              onReset={handleResetFilters}
              companies={mockCompanies}
              departments={mockDepartments}
              designations={mockDesignations}
              showStatusFilter={true}
            />

            {/* Table */}
            {paginatedRows.length > 0 ? (
              <PayrollTable
                records={paginatedRows}
                onViewDetails={(rec) => {
                  setSelectedPayroll(rec);
                  setIsDetailsOpen(true);
                }}
                onCalculateSalary={handleCalculateSalary}
                onApprovePayroll={(rec) => setApproveRecord(rec)}
                onEditPayroll={(rec) => {
                  setSelectedPayroll(rec);
                  setIsDetailsOpen(true);
                }}
                onGenerateSlip={(rec) => {
                  const slip = slips.find(s => s.payrollId === rec.id || s.employeeId === rec.employeeId);
                  if (slip) handleGenerateSingleSlip(slip);
                }}
                onViewSlip={(rec) => {
                  const slip = slips.find(s => s.payrollId === rec.id || s.employeeId === rec.employeeId);
                  if (slip) setSelectedSlip(slip);
                }}
                onResolveIssue={(rec) => setIssueRecord(rec)}
              />
            ) : (
              <EmptyState
                title="No payroll records found"
                description="No employee salary records match your filter criteria."
                actionLabel="Reset Filters"
                onAction={handleResetFilters}
              />
            )}

            {/* Pagination */}
            <Pagination
              currentPage={page}
              totalItems={filteredPayroll.length}
              itemsPerPage={PAGE_SIZE}
              onPageChange={setPage}
              label="employees"
            />
          </section>
        )}

        {/* TAB 2: SALARY STRUCTURE */}
        {activeTab === 'structure' && (
          <section className={styles.tabSection}>
            <div className={styles.tabHeaderRow}>
              <div>
                <h2 className={styles.tabHeading}>Salary Structure</h2>
                <p className={styles.tabSubtext}>
                  View employee salary components used for payroll calculation.
                </p>
              </div>
            </div>

            {/* Filters */}
            <PayrollFilters
              search={search}
              onSearchChange={(v) => { setSearch(v); setPage(1); }}
              client={clientFilter}
              onClientChange={(v) => { setClientFilter(v); setPage(1); }}
              department={deptFilter}
              onDepartmentChange={(v) => { setDeptFilter(v); setPage(1); }}
              designation={desigFilter}
              onDesignationChange={(v) => { setDesigFilter(v); setPage(1); }}
              status=""
              onStatusChange={() => {}}
              onReset={handleResetFilters}
              companies={mockCompanies}
              departments={mockDepartments}
              designations={mockDesignations}
              showStatusFilter={false}
            />

            {/* Table */}
            {paginatedRows.length > 0 ? (
              <SalaryStructureTable
                records={paginatedRows}
                onViewStructure={(rec) => {
                  setSelectedStructure(rec);
                  setIsStructureDrawerOpen(true);
                }}
                onEditStructure={(rec) => setEditStructureRecord(rec)}
              />
            ) : (
              <EmptyState
                title="No salary structures found"
                description="Try modifying search or department filters."
                actionLabel="Reset Filters"
                onAction={handleResetFilters}
              />
            )}

            <Pagination
              currentPage={page}
              totalItems={filteredStructure.length}
              itemsPerPage={PAGE_SIZE}
              onPageChange={setPage}
              label="salary structures"
            />
          </section>
        )}

        {/* TAB 3: RATE REVISION */}
        {activeTab === 'rate-revision' && (
          <section className={styles.tabSection}>
            <div className={styles.tabHeaderRow}>
              <div>
                <h2 className={styles.tabHeading}>Rate Revision Management</h2>
                <p className={styles.tabSubtext}>
                  Track employee salary and wage revisions, component breakdowns, and multi-level approvals.
                </p>
              </div>
              <div className={styles.tabActions}>
                <button
                  type="button"
                  className={styles.tabPrimaryBtn}
                  onClick={() => {
                    setEditingRevision(null);
                    setIsRevisionFormOpen(true);
                  }}
                >
                  <Plus size={15} />
                  <span>New Rate Revision</span>
                </button>
              </div>
            </div>

            {/* Revision Summary Cards */}
            <RateRevisionSummaryCards metrics={rateRevMetrics} />

            {/* Filters */}
            <RateRevisionFilters
              search={revSearch}
              onSearchChange={(v) => { setRevSearch(v); setPage(1); }}
              client={revClientFilter}
              onClientChange={(v) => { setRevClientFilter(v); setPage(1); }}
              status={revStatusFilter}
              onStatusChange={(v) => { setRevStatusFilter(v); setPage(1); }}
              onReset={handleResetFilters}
              companies={mockCompanies}
            />

            {/* Rate Revision Table */}
            {paginatedRows.length > 0 ? (
              <RateRevisionTable
                records={paginatedRows}
                onView={(rec) => {
                  setSelectedRevision(rec);
                  setIsRevisionDrawerOpen(true);
                }}
                onApprove={handleApproveRevision}
                onReject={handleInitiateRejectRevision}
              />
            ) : (
              <EmptyState
                title="No rate revisions found"
                description="No rate revision records match your active search or filters."
                actionLabel="Reset Filters"
                onAction={handleResetFilters}
              />
            )}

            <Pagination
              currentPage={page}
              totalItems={filteredRevisions.length}
              itemsPerPage={PAGE_SIZE}
              onPageChange={setPage}
              label="rate revisions"
            />
          </section>
        )}

        {/* TAB 4: ARREARS CALCULATION */}
        {activeTab === 'arrears' && (
          <section className={styles.tabSection}>
            <div className={styles.tabHeaderRow}>
              <div>
                <h2 className={styles.tabHeading}>Arrears Calculation & Processing</h2>
                <p className={styles.tabSubtext}>
                  Review retroactive salary adjustments calculated from approved rate revisions and include them in payroll.
                </p>
              </div>
            </div>

            {/* Arrears Summary Cards */}
            <ArrearsSummaryCards metrics={arrearsMetrics} />

            {/* Filters */}
            <ArrearsFilters
              search={arrSearch}
              onSearchChange={(v) => { setArrSearch(v); setPage(1); }}
              client={arrClientFilter}
              onClientChange={(v) => { setArrClientFilter(v); setPage(1); }}
              status={arrStatusFilter}
              onStatusChange={(v) => { setArrStatusFilter(v); setPage(1); }}
              onReset={handleResetFilters}
              companies={mockCompanies}
            />

            {/* Arrears Table */}
            {paginatedRows.length > 0 ? (
              <ArrearsTable
                records={paginatedRows}
                onView={(rec) => {
                  setSelectedArrear(rec);
                  setIsArrearDrawerOpen(true);
                }}
                onIncludeInPayroll={handleIncludeInPayroll}
                onRecalculate={handleRecalculateArrear}
              />
            ) : (
              <EmptyState
                title="No arrears records found"
                description="No arrears records match your active search or filters."
                actionLabel="Reset Filters"
                onAction={handleResetFilters}
              />
            )}

            <Pagination
              currentPage={page}
              totalItems={filteredArrears.length}
              itemsPerPage={PAGE_SIZE}
              onPageChange={setPage}
              label="arrear records"
            />
          </section>
        )}

        {/* TAB 3: SALARY SLIPS */}
        {activeTab === 'slips' && (
          <section className={styles.tabSection}>
            <div className={styles.tabHeaderRow}>
              <div>
                <h2 className={styles.tabHeading}>Salary Slips</h2>
                <p className={styles.tabSubtext}>
                  Generate, preview and download monthly salary slips.
                </p>
              </div>
              <div className={styles.tabActions}>
                <button
                  type="button"
                  className={styles.outlineBtn}
                  onClick={() => setIsExportOpen(true)}
                >
                  <Download size={15} />
                  <span>Export</span>
                </button>
                <button
                  type="button"
                  className={styles.tabPrimaryBtn}
                  onClick={() => setIsGenerateSlipsOpen(true)}
                >
                  <Printer size={15} />
                  <span>Generate Slips</span>
                </button>
              </div>
            </div>

            {/* Slips Filters */}
            <PayrollFilters
              search={slipSearch}
              onSearchChange={(v) => { setSlipSearch(v); setPage(1); }}
              client={slipClientFilter}
              onClientChange={(v) => { setSlipClientFilter(v); setPage(1); }}
              department={slipDeptFilter}
              onDepartmentChange={(v) => { setSlipDeptFilter(v); setPage(1); }}
              designation=""
              onDesignationChange={() => {}}
              status={slipStatusFilter}
              onStatusChange={(v) => { setSlipStatusFilter(v); setPage(1); }}
              onReset={handleResetFilters}
              companies={mockCompanies}
              departments={mockDepartments}
              designations={mockDesignations}
              showStatusFilter={true}
            />

            {/* Slips Table */}
            {paginatedRows.length > 0 ? (
              <SalarySlipsTable
                slips={paginatedRows}
                onViewSlip={(slip) => setSelectedSlip(slip)}
                onDownloadSlip={handleDownloadSlip}
                onPrintSlip={(slip) => setSelectedSlip(slip)}
                onGenerateSingleSlip={handleGenerateSingleSlip}
              />
            ) : (
              <EmptyState
                title="No salary slips found"
                description="Generate salary slips for the current month or adjust your search filter."
                actionLabel="Generate Slips"
                onAction={() => setIsGenerateSlipsOpen(true)}
              />
            )}

            <Pagination
              currentPage={page}
              totalItems={filteredSlips.length}
              itemsPerPage={PAGE_SIZE}
              onPageChange={setPage}
              label="salary slips"
            />
          </section>
        )}

        {/* TAB 4: STATUTORY REPORTS */}
        {activeTab === 'statutory' && (
          <section className={styles.tabSection}>
            <div className={styles.tabHeaderRow}>
              <div>
                <h2 className={styles.tabHeading}>Statutory Reports</h2>
                <p className={styles.tabSubtext}>
                  Generate payroll compliance reports for PF and ESI.
                </p>
              </div>
            </div>

            <StatutoryReports
              pfRecords={mockPFRecords}
              esiRecords={mockESIRecords}
              summary={mockStatutorySummary}
              selectedMonth={selectedMonth}
              monthLabel={monthLabel}
              companies={mockCompanies}
              departments={mockDepartments}
              onOpenDownloadModal={(type) => {
                setStatutoryDownloadType(type);
                setIsStatutoryDownloadOpen(true);
              }}
            />
          </section>
        )}

        {/* Bottom Analytics Section */}
        <PayrollAnalytics />

        {/* MODALS & DRAWERS */}
        {/* 1. Payroll Details Drawer */}
        {isDetailsOpen && selectedPayroll && (
          <PayrollDetailsDrawer
            record={selectedPayroll}
            onClose={() => setIsDetailsOpen(false)}
            onCalculateSalary={handleCalculateSalary}
            onApprovePayroll={(rec) => setApproveRecord(rec)}
            onViewSlip={(rec) => {
              const slip = slips.find(s => s.payrollId === rec.id || s.employeeId === rec.employeeId);
              if (slip) setSelectedSlip(slip);
            }}
            onDownloadSlip={handleDownloadSlip}
            onResolveIssue={(rec) => setIssueRecord(rec)}
            isCalculating={isCalculating}
          />
        )}

        {/* 2. Approve Confirmation Modal */}
        {approveRecord && (
          <ApprovePayrollModal
            isOpen={Boolean(approveRecord)}
            record={approveRecord}
            onClose={() => setApproveRecord(null)}
            onConfirm={handleConfirmApprove}
          />
        )}

        {/* 3. Run Payroll Modal */}
        {isRunPayrollOpen && (
          <RunPayrollModal
            isOpen={isRunPayrollOpen}
            onClose={() => setIsRunPayrollOpen(false)}
            selectedMonth={selectedMonth}
            monthLabel={monthLabel}
            companies={mockCompanies}
            departments={mockDepartments}
            onComplete={handleCompleteRunPayroll}
            onViewIssues={() => {
              setStatusFilter('on_hold');
              setActiveTab('processing');
            }}
          />
        )}

        {/* 4. Salary Structure Details Drawer */}
        {isStructureDrawerOpen && selectedStructure && (
          <SalaryStructureDrawer
            record={selectedStructure}
            onClose={() => setIsStructureDrawerOpen(false)}
            onEdit={(rec) => setEditStructureRecord(rec)}
          />
        )}

        {/* 5. Edit Salary Structure Modal */}
        {editStructureRecord && (
          <SalaryStructureModal
            isOpen={Boolean(editStructureRecord)}
            record={editStructureRecord}
            onClose={() => setEditStructureRecord(null)}
            onSave={handleSaveSalaryStructure}
          />
        )}

        {/* 6. Generate Slips Batch Modal */}
        {isGenerateSlipsOpen && (
          <GenerateSlipsModal
            isOpen={isGenerateSlipsOpen}
            onClose={() => setIsGenerateSlipsOpen(false)}
            selectedMonth={selectedMonth}
            monthLabel={monthLabel}
            companies={mockCompanies}
            departments={mockDepartments}
            onConfirm={handleBatchGenerateSlips}
          />
        )}

        {/* 7. Salary Slip Preview Modal */}
        {selectedSlip && (
          <SalarySlipPreview
            isOpen={Boolean(selectedSlip)}
            slip={selectedSlip}
            onClose={() => setSelectedSlip(null)}
            onDownload={handleDownloadSlip}
          />
        )}

        {/* 8. Statutory Download Modal */}
        {isStatutoryDownloadOpen && (
          <StatutoryDownloadModal
            isOpen={isStatutoryDownloadOpen}
            initialType={statutoryDownloadType}
            monthLabel={monthLabel}
            onClose={() => setIsStatutoryDownloadOpen(false)}
            onDownload={handleDownloadStatutory}
          />
        )}

        {/* 9. Payroll History Modal */}
        {isHistoryOpen && (
          <PayrollHistoryModal
            isOpen={isHistoryOpen}
            historyData={mockPayrollHistory}
            onClose={() => setIsHistoryOpen(false)}
            onSelectMonth={(m) => {
              setSelectedMonth(m);
              notify(`Switched to cycle ${m}`, 'info');
            }}
            onViewSlips={() => setActiveTab('slips')}
            onViewStatutory={() => setActiveTab('statutory')}
            onExportHistory={(item) => {
              notify(`Exporting history for ${item.month}...`, 'info');
              setTimeout(() => notify('✓ Export complete.', 'success'), 600);
            }}
          />
        )}

        {/* 10. Payroll Export Modal */}
        {isExportOpen && (
          <PayrollExportModal
            isOpen={isExportOpen}
            selectedMonth={selectedMonth}
            monthLabel={monthLabel}
            companies={mockCompanies}
            departments={mockDepartments}
            onClose={() => setIsExportOpen(false)}
            onExport={handleExportReport}
          />
        )}

        {/* 11. Payroll Issue Resolve Modal */}
        {issueRecord && (
          <PayrollIssueModal
            isOpen={Boolean(issueRecord)}
            record={issueRecord}
            onClose={() => setIssueRecord(null)}
            onResolve={handleResolveIssue}
          />
        )}

        {/* 12. Rate Revision Form Modal */}
        {isRevisionFormOpen && (
          <RateRevisionForm
            isOpen={isRevisionFormOpen}
            onClose={() => {
              setIsRevisionFormOpen(false);
              setEditingRevision(null);
            }}
            onSave={handleSaveRevision}
            initialData={editingRevision}
            employees={mockEmployees}
            companies={mockCompanies}
          />
        )}

        {/* 13. Rate Revision Details Drawer */}
        {isRevisionDrawerOpen && selectedRevision && (
          <RateRevisionDetailsDrawer
            isOpen={isRevisionDrawerOpen}
            onClose={() => {
              setIsRevisionDrawerOpen(false);
              setSelectedRevision(null);
            }}
            record={selectedRevision}
            onApprove={handleApproveRevision}
            onReject={handleInitiateRejectRevision}
          />
        )}

        {/* 14. Arrears Details Drawer */}
        {isArrearDrawerOpen && selectedArrear && (
          <ArrearsDetailsDrawer
            isOpen={isArrearDrawerOpen}
            onClose={() => {
              setIsArrearDrawerOpen(false);
              setSelectedArrear(null);
            }}
            record={selectedArrear}
            onIncludeInPayroll={handleIncludeInPayroll}
            onRecalculate={handleRecalculateArrear}
          />
        )}

        {/* 15. Reject Revision Confirmation Modal */}
        {rejectRevisionRecord && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(15, 23, 42, 0.65)',
              backdropFilter: 'blur(4px)',
              zIndex: 1000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '1rem'
            }}
            onClick={() => setRejectRevisionRecord(null)}
          >
            <div
              style={{
                backgroundColor: 'var(--surface, #ffffff)',
                borderRadius: '16px',
                width: '100%',
                maxWidth: '480px',
                padding: '1.5rem',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                border: '1px solid var(--border, #e2e8f0)'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '10px',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    color: '#ef4444',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <AlertCircle size={22} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-main, #0f172a)' }}>
                    Reject Rate Revision
                  </h3>
                  <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--text-muted, #64748b)' }}>
                    {rejectRevisionRecord.employeeName} ({rejectRevisionRecord.employeeCode})
                  </p>
                </div>
              </div>

              <p style={{ fontSize: '0.875rem', color: 'var(--text-main, #334155)', marginBottom: '1rem', lineHeight: 1.5 }}>
                Please provide the mandatory rejection reason. This reason will be logged on the revision audit trail and shared with payroll administrators.
              </p>

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text-main, #1e293b)', marginBottom: '0.375rem' }}>
                  Rejection Reason <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <textarea
                  rows={3}
                  placeholder="E.g., Rate revision exceeds client contract limit. Resubmit with approved Annexure A."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.625rem 0.75rem',
                    borderRadius: '8px',
                    border: '1px solid var(--border, #cbd5e1)',
                    fontSize: '0.875rem',
                    color: 'var(--text-main, #0f172a)',
                    backgroundColor: 'var(--surface, #ffffff)',
                    resize: 'vertical',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setRejectRevisionRecord(null)}
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: '8px',
                    border: '1px solid var(--border, #cbd5e1)',
                    backgroundColor: 'transparent',
                    color: 'var(--text-main, #334155)',
                    fontWeight: 500,
                    cursor: 'pointer',
                    fontSize: '0.875rem'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmRejectRevision}
                  disabled={!rejectReason.trim()}
                  style={{
                    padding: '0.5rem 1.25rem',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: rejectReason.trim() ? '#ef4444' : '#cbd5e1',
                    color: '#ffffff',
                    fontWeight: 600,
                    cursor: rejectReason.trim() ? 'pointer' : 'not-allowed',
                    fontSize: '0.875rem'
                  }}
                >
                  Confirm Rejection
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
