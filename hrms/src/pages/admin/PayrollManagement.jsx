import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  WalletCards, Play, History, Download, Plus, FileSpreadsheet,
  ChevronRight, RefreshCw, Printer, AlertCircle, FileText, Loader2
} from 'lucide-react';
import AdminLayout from '../../components/layout/AdminLayout';
import Toast from '../../components/common/Toast';
import EmptyState from '../../components/common/EmptyState';
import Pagination from '../../components/common/Pagination';
import { usePermissions } from '../../context/PermissionContext';
import { useCompany } from '../../context/CompanyContext';

// Services
import payrollService from '../../services/payrollService';
import employeeService from '../../services/employeeService';
import clientService from '../../services/clientService';
import masterService from '../../services/masterService';

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

import {
  calculateRateRevisionMetrics,
  calculateArrearsMetrics
} from '../../data/rateRevisionData';

import styles from './PayrollManagement.module.css';

const PAGE_SIZE = 8;

export default function PayrollManagement() {
  const [searchParams] = useSearchParams();
  const { canAdd, canEdit, canDelete, canApprove, canExport } = usePermissions();
  const { activeCompanyId, companies } = useCompany();

  // Current Month State default to current YYYY-MM
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  // Active Tab
  const [activeTab, setActiveTab] = useState(() => searchParams.get('tab') || 'processing');

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam) {
      setActiveTab(tabParam);
    } else {
      setActiveTab('processing');
    }
  }, [searchParams]);

  // Dynamic MongoDB State
  const [records, setRecords] = useState([]);
  const [slips, setSlips] = useState([]);
  const [revisions, setRevisions] = useState([]);
  const [arrears, setArrears] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [clientsList, setClientsList] = useState([]);
  const [deptList, setDeptList] = useState([]);
  const [desigList, setDesigList] = useState([]);
  const [payrollHistory, setPayrollHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters State
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

  // Slips Filters State
  const [slipSearch, setSlipSearch] = useState('');
  const [slipClientFilter, setSlipClientFilter] = useState('');
  const [slipDeptFilter, setSlipDeptFilter] = useState('');
  const [slipStatusFilter, setSlipStatusFilter] = useState('');

  // Modals & Drawers State
  const [selectedRevision, setSelectedRevision] = useState(null);
  const [isRevisionDrawerOpen, setIsRevisionDrawerOpen] = useState(false);
  const [isRevisionFormOpen, setIsRevisionFormOpen] = useState(false);
  const [editingRevision, setEditingRevision] = useState(null);

  const [selectedArrear, setSelectedArrear] = useState(null);
  const [isArrearDrawerOpen, setIsArrearDrawerOpen] = useState(false);

  const [rejectRevisionRecord, setRejectRevisionRecord] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  const [page, setPage] = useState(1);
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
    if (!selectedMonth) return '';
    const [y, m] = selectedMonth.split('-');
    const date = new Date(parseInt(y, 10), parseInt(m, 10) - 1, 1);
    return date.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
  }, [selectedMonth]);

  // Load live data from MongoDB
  const fetchAllPayrollData = useCallback(async () => {
    if (!activeCompanyId) return;
    setIsLoading(true);
    try {
      // 1. Fetch Payroll Records
      const payrollRes = await payrollService.getPayrollRecords(activeCompanyId, selectedMonth);
      const liveRecords = payrollRes.records || [];
      setRecords(liveRecords);

      // 2. Fetch Salary Slips
      const liveSlips = await payrollService.getSalarySlips(activeCompanyId, { month: selectedMonth });
      setSlips(liveSlips || []);

      // 3. Fetch Rate Revisions
      const liveRevisions = await payrollService.getRateRevisions(activeCompanyId);
      setRevisions(liveRevisions || []);

      // 4. Fetch Arrears
      const liveArrears = await payrollService.getArrears(activeCompanyId);
      setArrears(liveArrears || []);

      // 5. Fetch Employees for dropdowns and masters
      const liveEmployees = await employeeService.getEmployees(activeCompanyId);
      setEmployees(liveEmployees || []);

      // 6. Fetch Clients for filters
      const liveClients = await clientService.getClients(activeCompanyId);
      setClientsList(liveClients || []);

      // Derive unique departments & designations from live employees
      const depts = [...new Set(liveEmployees.map(e => e.department).filter(Boolean))];
      const desigs = [...new Set(liveEmployees.map(e => e.designation).filter(Boolean))];
      setDeptList(depts);
      setDesigList(desigs);

      // Build payroll history list
      if (payrollRes.history && Array.isArray(payrollRes.history)) {
        setPayrollHistory(payrollRes.history);
      } else {
        const monthsList = [selectedMonth];
        setPayrollHistory(monthsList.map(m => {
          const [yr, mo] = m.split('-');
          const d = new Date(parseInt(yr, 10), parseInt(mo, 10) - 1, 1);
          const mName = d.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
          const gross = liveRecords.reduce((acc, r) => acc + (r.grossSalary || 0), 0);
          const deduct = liveRecords.reduce((acc, r) => acc + (r.totalDeductions || 0), 0);
          const net = liveRecords.reduce((acc, r) => acc + (r.netSalary || 0), 0);
          return {
            id: `hist-${m}`,
            month: mName,
            monthCode: m,
            employees: liveRecords.length,
            grossPayroll: gross,
            deductions: deduct,
            netPayroll: net,
            status: liveRecords.some(r => r.status === 'processed') ? 'Processed' : 'Processing',
            processedDate: liveRecords.find(r => r.generatedDate)?.generatedDate || 'Pending'
          };
        }));
      }
    } catch (err) {
      console.error('Failed to load payroll data:', err);
      notify(err.message || 'Error loading live payroll records', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [activeCompanyId, selectedMonth]);

  useEffect(() => {
    fetchAllPayrollData();
  }, [fetchAllPayrollData]);

  // Rate Revision & Arrears Metrics computed dynamically
  const rateRevMetrics = useMemo(() => calculateRateRevisionMetrics(revisions), [revisions]);
  const arrearsMetrics = useMemo(() => calculateArrearsMetrics(arrears), [arrears]);

  // Dynamic KPI Summary for selected month
  const summaryKPI = useMemo(() => {
    const totalEmployees = records.length;
    const processedEmployees = records.filter(r => r.status === 'processed').length;
    const pendingEmployees = totalEmployees - processedEmployees;
    const totalNetPayroll = records.reduce((sum, r) => sum + (r.netSalary || 0), 0);
    const estimatedGross = records.reduce((sum, r) => sum + (r.grossSalary || 0), 0);
    const estimatedDeductions = records.reduce((sum, r) => sum + (r.totalDeductions || 0), 0);

    return {
      totalEmployees,
      processedEmployees,
      pendingEmployees: Math.max(0, pendingEmployees),
      totalNetPayroll,
      estimatedGross,
      estimatedDeductions
    };
  }, [records]);

  // Overall banner cycle status
  const cycleStatus = useMemo(() => {
    if (records.length === 0) return 'Draft';
    const processed = records.filter(r => r.status === 'processed').length;
    if (processed === records.length) return 'Processed';
    if (processed > 0) return 'Processing';
    return 'Draft';
  }, [records]);

  // Dynamic Statutory PF Records from live employee calculations
  const dynamicPFRecords = useMemo(() => {
    return records
      .filter(r => (r.pf > 0 || r.pfApplicable))
      .map(r => ({
        id: `pf-${r.id || r.employeeId}`,
        employeeId: r.employeeId,
        employeeName: r.employeeName,
        designation: r.designation || 'Staff',
        department: r.department || 'General',
        clientName: r.clientName || 'Main Client',
        initials: r.initials || r.employeeName?.slice(0, 2)?.toUpperCase() || 'EM',
        uan: r.uan || `101${(r.employeeId || '1').replace(/\D/g, '').padStart(9, '0')}`,
        pfNumber: r.pfNumber || `DL/CPM/${r.employeeId || '001'}`,
        eligibleSalary: Math.min(r.basicSalary || r.basic || 15000, 15000),
        employeePF: r.pf || 0,
        employerPF: r.pf || 0,
        totalPF: (r.pf || 0) * 2,
        status: 'Compliant'
      }));
  }, [records]);

  // Dynamic Statutory ESI Records from live employee calculations
  const dynamicESIRecords = useMemo(() => {
    return records
      .filter(r => (r.esi > 0 || r.esiApplicable))
      .map(r => ({
        id: `esi-${r.id || r.employeeId}`,
        employeeId: r.employeeId,
        employeeName: r.employeeName,
        designation: r.designation || 'Staff',
        department: r.department || 'General',
        clientName: r.clientName || 'Main Client',
        initials: r.initials || r.employeeName?.slice(0, 2)?.toUpperCase() || 'EM',
        esiNumber: r.esiNumber || `31000${(r.employeeId || '1').replace(/\D/g, '').padStart(6, '0')}`,
        eligibleSalary: r.grossSalary || 0,
        employeeESI: r.esi || 0,
        employerESI: Math.round((r.grossSalary || 0) * 0.0325),
        totalESI: (r.esi || 0) + Math.round((r.grossSalary || 0) * 0.0325),
        status: 'Compliant'
      }));
  }, [records]);

  // Statutory Summary
  const statutorySummary = useMemo(() => {
    const totalPF = dynamicPFRecords.reduce((sum, r) => sum + (r.totalPF || 0), 0);
    const totalESI = dynamicESIRecords.reduce((sum, r) => sum + (r.totalESI || 0), 0);
    const coveredCount = new Set([
      ...dynamicPFRecords.map(r => r.employeeId),
      ...dynamicESIRecords.map(r => r.employeeId)
    ]).size;

    return {
      pfContribution: totalPF,
      esiContribution: totalESI,
      employeesCovered: coveredCount,
      reportsGenerated: (dynamicPFRecords.length > 0 || dynamicESIRecords.length > 0) ? 6 : 0
    };
  }, [dynamicPFRecords, dynamicESIRecords]);

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
      if (slipStatusFilter && slip.status?.toLowerCase() !== slipStatusFilter.toLowerCase()) return false;
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
  const handleSaveRevision = async (revData) => {
    try {
      await payrollService.saveRateRevision(activeCompanyId, revData);
      notify(`✓ Rate revision saved for ${revData.employeeName}.`, 'success');
      setIsRevisionFormOpen(false);
      setEditingRevision(null);
      fetchAllPayrollData();
    } catch (err) {
      notify(err.message || 'Failed to save rate revision', 'error');
    }
  };

  const handleApproveRevision = async (rev) => {
    try {
      const revKey = rev.revisionId || rev.id;
      await payrollService.saveRateRevision(activeCompanyId, {
        ...rev,
        status: 'Approved',
        revisionStatus: 'Approved',
        approvedBy: 'Admin User',
        approvalDate: new Date().toISOString().slice(0, 10),
        rejectionReason: null
      });

      notify(`✓ Revision ${revKey} approved for ${rev.employeeName}. Linked arrears ready for payroll.`, 'success');
      setIsRevisionDrawerOpen(false);
      setSelectedRevision(null);
      fetchAllPayrollData();
    } catch (err) {
      notify(err.message || 'Failed to approve revision', 'error');
    }
  };

  const handleInitiateRejectRevision = (rev) => {
    setRejectRevisionRecord(rev);
    setRejectReason('');
  };

  const handleConfirmRejectRevision = async () => {
    if (!rejectReason.trim()) {
      notify('Please provide a mandatory reason for rejection.', 'error');
      return;
    }
    const rev = rejectRevisionRecord;
    try {
      await payrollService.saveRateRevision(activeCompanyId, {
        ...rev,
        status: 'Rejected',
        revisionStatus: 'Rejected',
        approvedBy: 'Admin User',
        approvalDate: new Date().toISOString().slice(0, 10),
        rejectionReason: rejectReason.trim()
      });

      setRejectRevisionRecord(null);
      setRejectReason('');
      setIsRevisionDrawerOpen(false);
      setSelectedRevision(null);
      notify(`Revision rejected for ${rev.employeeName}.`, 'info');
      fetchAllPayrollData();
    } catch (err) {
      notify(err.message || 'Failed to reject revision', 'error');
    }
  };

  // Actions: Arrears Handlers
  const handleIncludeInPayroll = async (arrear) => {
    try {
      await payrollService.saveArrear(activeCompanyId, {
        ...arrear,
        payrollStatus: 'Included in Payroll'
      });
      notify(`✓ Arrear ₹${Number(arrear.arrearAmount).toLocaleString('en-IN')} included in upcoming payroll cycle for ${arrear.employeeName}.`, 'success');
      if (selectedArrear && selectedArrear.id === arrear.id) {
        setSelectedArrear({ ...selectedArrear, payrollStatus: 'Included in Payroll' });
      }
      fetchAllPayrollData();
    } catch (err) {
      notify(err.message || 'Failed to include arrear in payroll', 'error');
    }
  };

  const handleRecalculateArrear = async (arrear) => {
    try {
      await payrollService.saveArrear(activeCompanyId, {
        ...arrear,
        payrollStatus: 'Calculated'
      });
      notify(`✓ Arrear recalculated for ${arrear.employeeName}.`, 'success');
      fetchAllPayrollData();
    } catch (err) {
      notify(err.message || 'Failed to recalculate arrear', 'error');
    }
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
      setIsCalculating(false);
      if (selectedPayroll && selectedPayroll.id === record.id) {
        setSelectedPayroll({ ...selectedPayroll, status: 'calculated' });
      }
      notify('✓ Salary calculated successfully.', 'success');
    }, 400);
  };

  // Actions: Approve Payroll
  const handleConfirmApprove = async (record) => {
    try {
      await payrollService.approvePayroll(activeCompanyId, selectedMonth, 'approve', `Approved for ${record.employeeName}`);
      setApproveRecord(null);
      if (selectedPayroll && selectedPayroll.id === record.id) {
        setSelectedPayroll({ ...selectedPayroll, status: 'processed' });
      }
      notify('✓ Payroll approved successfully.', 'success');
      fetchAllPayrollData();
    } catch (err) {
      notify(err.message || 'Failed to approve payroll', 'error');
    }
  };

  // Actions: Run Payroll Batch (Completing whole cycle in MongoDB)
  const handleCompleteRunPayroll = async () => {
    try {
      notify(`Processing and locking ${monthLabel} payroll...`, 'info');
      await payrollService.runPayroll(activeCompanyId, selectedMonth, records);
      await payrollService.generateSalarySlips(activeCompanyId, selectedMonth);
      setActiveTab('slips');
      notify(`✓ ${monthLabel} payroll processed successfully. Slips generated.`, 'success');
      fetchAllPayrollData();
    } catch (err) {
      notify(err.message || 'Failed to run payroll', 'error');
    }
  };

  // Actions: Save Edited Salary Structure
  const handleSaveSalaryStructure = async (updatedRecord) => {
    const updated = records.map((item) =>
      item.id === updatedRecord.id ? updatedRecord : item
    );
    setRecords(updated);
    setEditStructureRecord(null);
    notify('✓ Salary structure updated successfully.', 'success');
  };

  // Actions: Batch Generate Slips
  const handleBatchGenerateSlips = async () => {
    try {
      await payrollService.generateSalarySlips(activeCompanyId, selectedMonth);
      setIsGenerateSlipsOpen(false);
      notify('✓ Salary slips generated successfully.', 'success');
      fetchAllPayrollData();
    } catch (err) {
      notify(err.message || 'Failed to generate salary slips', 'error');
    }
  };

  // Actions: Generate Single Slip
  const handleGenerateSingleSlip = async (slip) => {
    try {
      await payrollService.generateSalarySlips(activeCompanyId, selectedMonth);
      notify(`✓ Salary slip generated for ${slip.employeeName}.`, 'success');
      fetchAllPayrollData();
    } catch (err) {
      notify(err.message || 'Failed to generate salary slip', 'error');
    }
  };

  // Actions: Download Slip PDF
  const handleDownloadSlip = (slip) => {
    notify(`Preparing salary slip for ${slip.employeeName}...`, 'info');
    setTimeout(() => {
      notify(`✓ Salary slip downloaded (${slip.employeeId || slip.slipNumber}).`, 'success');
    }, 600);
  };

  // Actions: Resolve On Hold Issue
  const handleResolveIssue = (record) => {
    const updated = records.map((item) =>
      item.id === record.id
        ? { ...item, status: 'calculated', holdReason: null }
        : item
    );
    setRecords(updated);
    setIssueRecord(null);
    if (selectedPayroll && selectedPayroll.id === record.id) {
      setSelectedPayroll({ ...selectedPayroll, status: 'calculated', holdReason: null });
    }
    notify('✓ Issue resolved. Salary calculated successfully.', 'success');
  };

  // Actions: Export Report
  const handleExportReport = ({ format, reportType }) => {
    setIsExportOpen(false);
    notify(`✓ ${reportType} report exported successfully (${format.toUpperCase()}).`, 'success');
  };

  // Actions: Download Statutory Return
  const handleDownloadStatutory = ({ reportType }) => {
    setIsStatutoryDownloadOpen(false);
    notify(`✓ Statutory return (${reportType.toUpperCase()}) downloaded successfully.`, 'success');
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
              Process live monthly salaries, manage dynamic salary slips and statutory payroll reports.
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
              className={styles.secondaryBtn}
              onClick={fetchAllPayrollData}
              disabled={isLoading}
              title="Refresh Payroll Records"
            >
              <RefreshCw size={16} className={isLoading ? styles.spinning : ''} />
              <span>Refresh</span>
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
            setPage(1);
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

        {/* Loading Indicator */}
        {isLoading && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '1.5rem', color: '#64748b' }}>
            <Loader2 size={20} className={styles.spinning} />
            <span>Loading live payroll data...</span>
          </div>
        )}

        {/* TAB 1: PAYROLL PROCESSING */}
        {!isLoading && activeTab === 'processing' && (
          <section className={styles.tabSection}>
            <div className={styles.tabHeaderRow}>
              <div>
                <h2 className={styles.tabHeading}>Payroll Processing</h2>
                <p className={styles.tabSubtext}>
                  Review employee salary calculations before processing payroll.
                </p>
              </div>
              <div className={styles.tabActions}>
                {canExport('payroll') && (
                  <button
                    type="button"
                    className={styles.outlineBtn}
                    onClick={() => setIsExportOpen(true)}
                  >
                    <Download size={15} />
                    <span>Export Payroll</span>
                  </button>
                )}
                {canAdd('payroll') && (
                  <button
                    type="button"
                    className={styles.tabPrimaryBtn}
                    onClick={() => setIsRunPayrollOpen(true)}
                  >
                    <Play size={15} />
                    <span>Run Payroll</span>
                  </button>
                )}
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
              companies={clientsList.length > 0 ? clientsList : companies}
              departments={deptList}
              designations={desigList}
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
                description={records.length === 0 ? "No active employees found for this payroll cycle. Add employees or run payroll calculation." : "No employee salary records match your filter criteria."}
                actionLabel={records.length === 0 ? "Run Payroll" : "Reset Filters"}
                onAction={records.length === 0 ? () => setIsRunPayrollOpen(true) : handleResetFilters}
              />
            )}

            {/* Pagination */}
            {filteredPayroll.length > 0 && (
              <Pagination
                currentPage={page}
                totalItems={filteredPayroll.length}
                itemsPerPage={PAGE_SIZE}
                onPageChange={setPage}
                label="employees"
              />
            )}
          </section>
        )}

        {/* TAB 2: SALARY STRUCTURE */}
        {!isLoading && activeTab === 'structure' && (
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
              companies={clientsList.length > 0 ? clientsList : companies}
              departments={deptList}
              designations={desigList}
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

            {filteredStructure.length > 0 && (
              <Pagination
                currentPage={page}
                totalItems={filteredStructure.length}
                itemsPerPage={PAGE_SIZE}
                onPageChange={setPage}
                label="salary structures"
              />
            )}
          </section>
        )}

        {/* TAB 3: RATE REVISION */}
        {!isLoading && activeTab === 'rate-revision' && (
          <section className={styles.tabSection}>
            <div className={styles.tabHeaderRow}>
              <div>
                <h2 className={styles.tabHeading}>Rate Revision Management</h2>
                <p className={styles.tabSubtext}>
                  Track employee salary and wage revisions, component breakdowns, and multi-level approvals.
                </p>
              </div>
              <div className={styles.tabActions}>
                {canAdd('payroll') && (
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
                )}
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
              companies={clientsList.length > 0 ? clientsList : companies}
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
                actionLabel="New Rate Revision"
                onAction={() => {
                  setEditingRevision(null);
                  setIsRevisionFormOpen(true);
                }}
              />
            )}

            {filteredRevisions.length > 0 && (
              <Pagination
                currentPage={page}
                totalItems={filteredRevisions.length}
                itemsPerPage={PAGE_SIZE}
                onPageChange={setPage}
                label="rate revisions"
              />
            )}
          </section>
        )}

        {/* TAB 4: ARREARS CALCULATION */}
        {!isLoading && activeTab === 'arrears' && (
          <section className={styles.tabSection}>
            <div className={styles.tabHeaderRow}>
              <div>
                <h2 className={styles.tabHeading}>Arrears Calculation &amp; Processing</h2>
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
              companies={clientsList.length > 0 ? clientsList : companies}
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

            {filteredArrears.length > 0 && (
              <Pagination
                currentPage={page}
                totalItems={filteredArrears.length}
                itemsPerPage={PAGE_SIZE}
                onPageChange={setPage}
                label="arrear records"
              />
            )}
          </section>
        )}

        {/* TAB 5: SALARY SLIPS */}
        {!isLoading && activeTab === 'slips' && (
          <section className={styles.tabSection}>
            <div className={styles.tabHeaderRow}>
              <div>
                <h2 className={styles.tabHeading}>Salary Slips</h2>
                <p className={styles.tabSubtext}>
                  Generate, preview and download monthly salary slips.
                </p>
              </div>
              <div className={styles.tabActions}>
                {canExport('payroll') && (
                  <button
                    type="button"
                    className={styles.outlineBtn}
                    onClick={() => setIsExportOpen(true)}
                  >
                    <Download size={15} />
                    <span>Export</span>
                  </button>
                )}
                {canAdd('payroll') && (
                  <button
                    type="button"
                    className={styles.tabPrimaryBtn}
                    onClick={() => setIsGenerateSlipsOpen(true)}
                  >
                    <Printer size={15} />
                    <span>Generate Slips</span>
                  </button>
                )}
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
              companies={clientsList.length > 0 ? clientsList : companies}
              departments={deptList}
              designations={desigList}
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

            {filteredSlips.length > 0 && (
              <Pagination
                currentPage={page}
                totalItems={filteredSlips.length}
                itemsPerPage={PAGE_SIZE}
                onPageChange={setPage}
                label="salary slips"
              />
            )}
          </section>
        )}

        {/* TAB 6: STATUTORY REPORTS */}
        {!isLoading && activeTab === 'statutory' && (
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
              pfRecords={dynamicPFRecords}
              esiRecords={dynamicESIRecords}
              summary={statutorySummary}
              selectedMonth={selectedMonth}
              monthLabel={monthLabel}
              companies={clientsList.length > 0 ? clientsList : companies}
              departments={deptList}
              onOpenDownloadModal={(type) => {
                setStatutoryDownloadType(type);
                setIsStatutoryDownloadOpen(true);
              }}
            />
          </section>
        )}

        {/* Bottom Analytics Section */}
        <PayrollAnalytics
          records={records}
          selectedMonth={selectedMonth}
          monthLabel={monthLabel}
        />

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
            companies={clientsList.length > 0 ? clientsList : companies}
            departments={deptList}
            employeeCount={summaryKPI.totalEmployees}
            estimatedGross={summaryKPI.estimatedGross}
            estimatedDeductions={summaryKPI.estimatedDeductions}
            estimatedNet={summaryKPI.totalNetPayroll}
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
            companies={clientsList.length > 0 ? clientsList : companies}
            departments={deptList}
            onConfirm={handleBatchGenerateSlips}
          />
        )}

        {/* 7. Salary Slip Preview Modal */}
        {selectedSlip && (
          <SalarySlipPreview
            isOpen={Boolean(selectedSlip)}
            slip={selectedSlip}
            company={
              companies.find(
                (c) =>
                  c.companyId === selectedSlip.companyId ||
                  c.name?.toLowerCase() === selectedSlip.companyName?.toLowerCase()
              ) ||
              companies.find((c) => c.companyId === activeCompanyId) ||
              companies[0] ||
              {}
            }
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
            historyData={payrollHistory}
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
            companies={clientsList.length > 0 ? clientsList : companies}
            departments={deptList}
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
            editingRevision={editingRevision}
            employees={employees}
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
                    {rejectRevisionRecord.employeeName} ({rejectRevisionRecord.employeeCode || rejectRevisionRecord.employeeId})
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
