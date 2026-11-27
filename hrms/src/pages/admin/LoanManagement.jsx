import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Eye,
  FileSpreadsheet,
  HandCoins,
  Pencil,
  PlusCircle,
  Save,
  Trash2,
  X
} from 'lucide-react';
import * as XLSX from 'xlsx';
import AdminLayout from '../../components/layout/AdminLayout';
import RequestBackButton from '../../components/common/RequestBackButton';
import Toast from '../../components/common/Toast';
import { useCompany } from '../../context/CompanyContext';
import { advanceLoanService } from '../../services/advanceLoanService';
import { employeeService } from '../../services/employeeService';
import styles from './LoanManagement.module.css';

const LOANS_UI_STORAGE_KEY = 'novaspark_loans_redesign_ui_v1';

function InfoTooltip({ text }) {
  return (
    <span className={styles.infoTooltipWrap} tabIndex={0} aria-label={text}>
      <span className={styles.infoCircle}>i</span>
      <span className={styles.infoTooltipBox} role="tooltip">
        {text}
      </span>
    </span>
  );
}

const INTEREST_METHODS = [
  'Interest Free',
  'Fixed Rate',
  'Monthly Reducing'
];

const DEFAULT_SAMPLE_LOANS = [
  {
    id: 'LN-1001',
    employeeId: 'RRS001',
    employeeName: 'Bandna Rana',
    designation: 'HR Manager',
    department: 'Human Resources',
    loanAmount: 5000,
    issueDate: '2026-11-26',
    deductionStart: '2026-12-26',
    installmentsCount: 5,
    interestMethod: 'Interest Free',
    addedInSalary: false
  },
  {
    id: 'LN-1002',
    employeeId: 'RRS001',
    employeeName: 'Bandna Rana',
    designation: 'HR Manager',
    department: 'Human Resources',
    loanAmount: 5000,
    issueDate: '2026-11-25',
    deductionStart: '2026-12-25',
    installmentsCount: 5,
    interestMethod: 'Interest Free',
    addedInSalary: true
  },
  {
    id: 'LN-1003',
    employeeId: 'RRS001',
    employeeName: 'Bandna Rana',
    designation: 'HR Manager',
    department: 'Human Resources',
    loanAmount: 6000,
    issueDate: '2026-11-25',
    deductionStart: '2026-12-25',
    installmentsCount: 6,
    interestMethod: 'Interest Free',
    addedInSalary: false
  },
  {
    id: 'LN-1004',
    employeeId: 'RRS002',
    employeeName: 'Shikha',
    designation: 'Manager',
    department: 'Marketing',
    loanAmount: 5000,
    issueDate: '2026-11-16',
    deductionStart: '2026-12-16',
    installmentsCount: 5,
    interestMethod: 'Interest Free',
    addedInSalary: false
  },
  {
    id: 'LN-1005',
    employeeId: 'RRS001',
    employeeName: 'Bandna Rana',
    designation: 'HR Manager',
    department: 'Human Resources',
    loanAmount: 10000,
    issueDate: '2026-11-16',
    deductionStart: '2026-12-16',
    installmentsCount: 5,
    interestMethod: 'Fixed Rate 5%',
    addedInSalary: true
  }
];

const formatUpperDate = (dateStr) => {
  if (!dateStr) return '—';
  const d = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(d.getTime())) return dateStr;
  const day = String(d.getDate()).padStart(2, '0');
  const mon = d.toLocaleString('en-US', { month: 'short' }).toUpperCase();
  const yr = d.getFullYear();
  return `${day}-${mon}-${yr}`;
};

const formatMixedDate = (dateStr) => {
  if (!dateStr) return '—';
  const d = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(d.getTime())) return dateStr;
  const day = String(d.getDate()).padStart(2, '0');
  const mon = d.toLocaleString('en-US', { month: 'short' });
  const yr = d.getFullYear();
  return `${day}-${mon}-${yr}`;
};

const formatDec = (num) =>
  Number(num || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

const formatInt = (num) => Number(num || 0).toLocaleString('en-IN');

const addMonthsToIso = (isoDate, offset) => {
  const base = isoDate ? new Date(`${isoDate}T00:00:00`) : new Date();
  if (Number.isNaN(base.getTime())) return isoDate;
  const d = new Date(base);
  d.setMonth(d.getMonth() + offset);
  return d.toISOString().slice(0, 10);
};

function generateScheduleRows({
  loanAmount,
  issueDate,
  deductionStart,
  installmentsCount,
  interestMethod,
  interestRate = 0
}) {
  const principalTotal = Math.max(0, Number(loanAmount) || 0);
  const count = Math.max(1, Number(installmentsCount) || 1);
  const isReducing = String(interestMethod || '').startsWith('Monthly Reducing');
  const isFixed = String(interestMethod || '').startsWith('Fixed Rate');
  const parsedRateMatch = String(interestMethod || '').match(/(\d+(?:\.\d+)?)\s*%/);
  const rate =
    interestMethod === 'Interest Free'
      ? 0
      : Number(interestRate) || (parsedRateMatch ? Number(parsedRateMatch[1]) : 5);

  const rows = [
    {
      id: 'disbursement-0',
      isDisbursement: true,
      date: issueDate,
      opening: 0,
      principal: 0,
      interest: 0,
      installment: 0,
      balance: 0,
      deductible: null
    }
  ];

  if (isReducing && rate > 0) {
    const r = rate / 100 / 12;
    const emi =
      (principalTotal * r * Math.pow(1 + r, count)) / (Math.pow(1 + r, count) - 1);
    let remaining = principalTotal;
    for (let i = 0; i < count; i++) {
      const isLast = i === count - 1;
      const opening = Number(remaining.toFixed(2));
      const intr = Number((opening * r).toFixed(2));
      const p = isLast ? opening : Number(Math.min(opening, emi - intr).toFixed(2));
      const nextBalance = Math.max(0, Number((opening - p).toFixed(2)));
      rows.push({
        id: `inst-${i + 1}`,
        isDisbursement: false,
        date: addMonthsToIso(deductionStart || issueDate, i),
        opening,
        principal: p,
        interest: intr,
        installment: Number((p + intr).toFixed(2)),
        balance: nextBalance,
        deductible: true
      });
      remaining = nextBalance;
    }
    return rows;
  }

  const totalInterest = isFixed ? Math.round((principalTotal * rate * (count / 12)) / 100) : 0;
  const basePrincipal = Math.floor((principalTotal / count) * 100) / 100;
  const baseInterest = Math.floor((totalInterest / count) * 100) / 100;

  let remainingPrincipal = principalTotal;
  for (let i = 0; i < count; i++) {
    const isLast = i === count - 1;
    const p = isLast ? Number(remainingPrincipal.toFixed(2)) : basePrincipal;
    const intr = isLast
      ? Number((totalInterest - baseInterest * (count - 1)).toFixed(2))
      : baseInterest;
    const opening = Number(remainingPrincipal.toFixed(2));
    const nextBalance = Math.max(0, Number((opening - p).toFixed(2)));
    rows.push({
      id: `inst-${i + 1}`,
      isDisbursement: false,
      date: addMonthsToIso(deductionStart || issueDate, i),
      opening,
      principal: p,
      interest: intr,
      installment: Number((p + intr).toFixed(2)),
      balance: nextBalance,
      deductible: true
    });
    remainingPrincipal = nextBalance;
  }

  return rows;
}

const getInitialLoans = (apiRequests = []) => {
  try {
    const raw = localStorage.getItem(LOANS_UI_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {
    // ignore storage errors
  }

  const mappedApi = (apiRequests || [])
    .filter((r) => r.type === 'loan')
    .map((r, idx) => {
      const issueDate = r.requestDate || new Date().toISOString().slice(0, 10);
      const deductionStart = addMonthsToIso(issueDate, 1);
      const interestMethod =
        Number(r.interestRate) > 0 ? `Fixed Rate ${r.interestRate}%` : 'Interest Free';
      const base = {
        id: r.requestId || r._id || `LN-API-${idx + 1}`,
        employeeId: r.employeeId || 'EMP001',
        employeeName: r.employeeName || 'Employee',
        designation: r.designation || 'Staff',
        department: r.department || r.clientName || 'Operations',
        loanAmount: Number(r.amount) || 5000,
        issueDate,
        deductionStart,
        installmentsCount: Math.max(1, Number(r.numberOfMonths) || 5),
        interestMethod,
        addedInSalary: false
      };
      return {
        ...base,
        schedule: generateScheduleRows(base)
      };
    });

  const seeded = (mappedApi.length ? mappedApi : DEFAULT_SAMPLE_LOANS).map((item) => ({
    ...item,
    schedule: item.schedule || generateScheduleRows(item)
  }));
  return seeded;
};

export default function LoanManagement() {
  const { company } = useCompany();
  const companyId = company?.companyId || company?.id || 'RRS8392014SEC';
  const [requests, setRequests] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'add' | 'edit'
  const [loans, setLoans] = useState(() => getInitialLoans([]));
  const [selectedLoanId, setSelectedLoanId] = useState(null);

  useEffect(() => {
    let active = true;
    const loadLoanData = async () => {
      try {
        const [reqList, empList] = await Promise.all([
          advanceLoanService.getRequests(companyId, { type: 'loan' }),
          employeeService.getEmployees(companyId)
        ]);
        if (!active) return;
        const loanReqs = (reqList || []).filter((item) => item.type === 'loan');
        setRequests(loanReqs);
        setEmployees(empList || []);
        try {
          const saved = localStorage.getItem(LOANS_UI_STORAGE_KEY);
          if (!saved && loanReqs.length) {
            setLoans(getInitialLoans(loanReqs));
          }
        } catch {
          // ignore storage errors
        }
      } catch (err) {
        console.error('Error loading loan data:', err);
      }
    };
    loadLoanData();
    return () => {
      active = false;
    };
  }, [companyId]);

  // List filters
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [employeeFilter, setEmployeeFilter] = useState('');
  const [appliedFilters, setAppliedFilters] = useState({
    fromDate: '',
    toDate: '',
    employee: ''
  });

  // Drawers / Modals
  const [prepaymentModal, setPrepaymentModal] = useState(false);
  const [prepaymentDate, setPrepaymentDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [prepaymentAmt, setPrepaymentAmt] = useState('');
  const [prepaymentDeductFromSalary, setPrepaymentDeductFromSalary] = useState(false);
  const [editInstModal, setEditInstModal] = useState(null); // installment row or null
  const [deleteConfirm, setDeleteConfirm] = useState(null); // { type, target, title, message } | null
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  // Add New Loan form state
  const todayStr = new Date().toISOString().slice(0, 10);
  const nextMonthStr = addMonthsToIso(todayStr, 1);
  const [addForm, setAddForm] = useState({
    employeeQuery: '',
    selectedEmployee: null,
    loanAmount: '',
    disbursementDate: todayStr,
    addedInSalary: false,
    deductionStart: nextMonthStr,
    installments: '',
    interestMethod: 'Interest Free',
    interestRate: '5'
  });
  const [showEmpSuggestions, setShowEmpSuggestions] = useState(false);
  const [previewSchedule, setPreviewSchedule] = useState([]);

  useEffect(() => {
    try {
      localStorage.setItem(LOANS_UI_STORAGE_KEY, JSON.stringify(loans));
    } catch {
      // ignore storage quota errors
    }
  }, [loans]);

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
  };

  // Combine employees from props + loans for search & filter
  const allEmployees = useMemo(() => {
    const map = new Map();
    (employees || []).forEach((e) => {
      const code = e.employeeId || e.employeeCode || e._id || '';
      const name =
        e.name ||
        `${e.personalInfo?.firstName || ''} ${e.personalInfo?.lastName || ''}`.trim() ||
        code;
      if (code || name) {
        map.set(code || name, {
          employeeId: code || 'EMP',
          employeeName: name,
          designation: e.designation || e.employmentInfo?.designation || 'Staff',
          department: e.department || e.employmentInfo?.department || 'Operations'
        });
      }
    });
    loans.forEach((l) => {
      if (!map.has(l.employeeId)) {
        map.set(l.employeeId, {
          employeeId: l.employeeId,
          employeeName: l.employeeName,
          designation: l.designation,
          department: l.department
        });
      }
    });
    return Array.from(map.values());
  }, [employees, loans]);

  const employeeSuggestions = useMemo(() => {
    const q = addForm.employeeQuery.trim().toLowerCase();
    if (!q) return allEmployees.slice(0, 8);
    return allEmployees
      .filter(
        (e) =>
          e.employeeName.toLowerCase().includes(q) ||
          e.employeeId.toLowerCase().includes(q)
      )
      .slice(0, 8);
  }, [allEmployees, addForm.employeeQuery]);

  const filteredLoans = useMemo(() => {
    return loans.filter((l) => {
      if (appliedFilters.fromDate && l.issueDate < appliedFilters.fromDate) return false;
      if (appliedFilters.toDate && l.issueDate > appliedFilters.toDate) return false;
      if (appliedFilters.employee && l.employeeId !== appliedFilters.employee) return false;
      return true;
    });
  }, [loans, appliedFilters]);

  const selectedLoan = useMemo(
    () => loans.find((l) => l.id === selectedLoanId) || null,
    [loans, selectedLoanId]
  );

  // Handlers for List View
  const handleApplyListFilters = () => {
    setAppliedFilters({
      fromDate,
      toDate,
      employee: employeeFilter
    });
  };

  const handleDeleteLoan = (loan) => {
    setDeleteConfirm({
      type: 'loan',
      target: loan,
      title: 'Delete Loan',
      message: `Are you sure you want to delete the loan of ${formatInt(loan.loanAmount)} for ${loan.employeeName} (${loan.employeeId})? This action cannot be undone.`
    });
  };

  const handleOpenAdd = () => {
    setAddForm({
      employeeQuery: '',
      selectedEmployee: null,
      loanAmount: '',
      disbursementDate: todayStr,
      addedInSalary: false,
      deductionStart: nextMonthStr,
      installments: '',
      interestMethod: 'Interest Free',
      interestRate: '5'
    });
    setPreviewSchedule([]);
    setViewMode('add');
  };

  const handleOpenEdit = (loan) => {
    setSelectedLoanId(loan.id);
    setViewMode('edit');
  };

  // Handlers for Add New Loan View
  const handlePreviewLoan = () => {
    if (!addForm.loanAmount || Number(addForm.loanAmount) <= 0) {
      showToast('Please enter a valid Loan Amount to preview.', 'error');
      return;
    }
    const count = Math.max(1, Number(addForm.installments) || 3);
    const rows = generateScheduleRows({
      loanAmount: Number(addForm.loanAmount),
      issueDate: addForm.disbursementDate || todayStr,
      deductionStart: addForm.deductionStart || nextMonthStr,
      installmentsCount: count,
      interestMethod: addForm.interestMethod,
      interestRate: Number(addForm.interestRate) || 0
    });
    setPreviewSchedule(rows);
  };

  const handleSaveLoan = (e) => {
    e.preventDefault();
    const emp = addForm.selectedEmployee || {
      employeeId: `RRS${Math.floor(100 + Math.random() * 899)}`,
      employeeName: addForm.employeeQuery.trim() || 'Employee',
      designation: 'Staff Member',
      department: 'Operations'
    };

    if (!addForm.employeeQuery.trim() && !addForm.selectedEmployee) {
      showToast('Please select or enter an employee.', 'error');
      return;
    }
    if (!addForm.loanAmount || Number(addForm.loanAmount) <= 0) {
      showToast('Please enter a valid Loan Amount.', 'error');
      return;
    }

    const count = Math.max(1, Number(addForm.installments) || 3);
    const methodLabel =
      addForm.interestMethod === 'Interest Free'
        ? 'Interest Free'
        : `${addForm.interestMethod} ${Number(addForm.interestRate) || 0}%`;
    const base = {
      id: `LN-${Math.floor(1000 + Math.random() * 8999)}`,
      employeeId: emp.employeeId,
      employeeName: emp.employeeName,
      designation: emp.designation || 'Staff Member',
      department: emp.department || 'Operations',
      loanAmount: Number(addForm.loanAmount),
      issueDate: addForm.disbursementDate || todayStr,
      deductionStart: addForm.deductionStart || nextMonthStr,
      installmentsCount: count,
      interestMethod: methodLabel,
      interestRate: Number(addForm.interestRate) || 0,
      addedInSalary: addForm.addedInSalary
    };
    const newLoan = {
      ...base,
      schedule:
        previewSchedule.length > 1 ? previewSchedule : generateScheduleRows(base)
    };

    setLoans((prev) => [newLoan, ...prev]);
    setViewMode('list');
    showToast(`Loan issued for ${newLoan.employeeName} (${newLoan.id}).`);
  };

  // Handlers for View / Edit Loan View
  const updateSelectedLoanSchedule = (updater) => {
    setLoans((prev) =>
      prev.map((loan) => {
        if (loan.id !== selectedLoanId) return loan;
        const nextSchedule = updater(loan.schedule || []);
        const instRows = nextSchedule.filter((r) => !r.isDisbursement);
        return {
          ...loan,
          installmentsCount: instRows.length,
          schedule: nextSchedule
        };
      })
    );
  };

  const handleToggleAddedInSalary = () => {
    setLoans((prev) =>
      prev.map((loan) =>
        loan.id === selectedLoanId
          ? { ...loan, addedInSalary: !loan.addedInSalary }
          : loan
      )
    );
    showToast('Salary sync preference updated.');
  };

  const handleToggleDeductible = (rowId) => {
    updateSelectedLoanSchedule((rows) =>
      rows.map((r) => (r.id === rowId ? { ...r, deductible: !r.deductible } : r))
    );
  };

  const handleDeleteInstallment = (row) => {
    setDeleteConfirm({
      type: 'installment',
      target: row,
      title: 'Delete Installment',
      message: `Are you sure you want to remove the installment on ${formatMixedDate(row.date)} (${formatDec(row.installment)})?`
    });
  };

  const handleConfirmDelete = () => {
    if (!deleteConfirm) return;
    if (deleteConfirm.type === 'loan') {
      const loan = deleteConfirm.target;
      setLoans((prev) => prev.filter((item) => item.id !== loan.id));
      showToast(`Loan ${loan.id} deleted.`, 'warning');
    } else if (deleteConfirm.type === 'installment') {
      const row = deleteConfirm.target;
      updateSelectedLoanSchedule((rows) => rows.filter((r) => r.id !== row.id));
      showToast('Installment removed.', 'warning');
    }
    setDeleteConfirm(null);
  };

  const handleAddInstallment = () => {
    if (!selectedLoan) return;
    const rows = selectedLoan.schedule || [];
    const lastInst = rows[rows.length - 1];
    const nextDate = addMonthsToIso(
      lastInst?.date || selectedLoan.deductionStart,
      lastInst?.isDisbursement ? 0 : 1
    );
    setEditInstModal({
      isNew: true,
      id: `inst-${Date.now()}`,
      date: nextDate,
      opening: Number(lastInst?.balance || 0),
      principal: 0,
      interest: 0,
      deductible: true
    });
  };

  const handleApplyPrepayment = (e) => {
    e.preventDefault();
    const amt = Number(prepaymentAmt);
    const pDate = prepaymentDate || todayStr;
    if (!amt || amt <= 0) {
      showToast('Enter a valid prepayment amount.', 'error');
      return;
    }
    updateSelectedLoanSchedule((rows) => {
      const disbursementRow = rows.find((r) => r.isDisbursement);
      const otherRows = rows.filter((r) => !r.isDisbursement);
      const prepayRow = {
        id: `prepay-${Date.now()}`,
        isDisbursement: false,
        date: pDate,
        opening: 0,
        principal: amt,
        interest: 0,
        installment: amt,
        balance: 0,
        deductible: Boolean(prepaymentDeductFromSalary)
      };

      const merged = [...otherRows, prepayRow].sort((a, b) =>
        String(a.date || '').localeCompare(String(b.date || ''))
      );

      let runningBalance = Number(selectedLoan?.loanAmount) || 0;
      const revised = merged.map((r) => {
        const opening = Math.max(0, Number(runningBalance.toFixed(2)));
        const p = Math.min(opening, Number(r.principal) || 0);
        const intr = Number(r.interest) || 0;
        const balance = Math.max(0, Number((opening - p).toFixed(2)));
        runningBalance = balance;
        return {
          ...r,
          opening,
          principal: p,
          installment: Number((p + intr).toFixed(2)),
          balance
        };
      });

      return disbursementRow ? [disbursementRow, ...revised] : revised;
    });
    setPrepaymentAmt('');
    setPrepaymentDeductFromSalary(false);
    setPrepaymentModal(false);
    showToast(`Prepayment of ₹${formatInt(amt)} recorded and schedule revised.`);
  };

  const handleSaveEditedInstallment = (e) => {
    e.preventDefault();
    if (!editInstModal) return;
    const principal = Number(editInstModal.principal) || 0;
    const interest = Number(editInstModal.interest) || 0;
    const installment = Number((principal + interest).toFixed(2));
    if (editInstModal.isNew) {
      const opening = Number(editInstModal.opening) || 0;
      const newRow = {
        id: editInstModal.id,
        isDisbursement: false,
        date: editInstModal.date,
        opening,
        principal,
        interest,
        installment,
        balance: Math.max(0, Number((opening - principal).toFixed(2))),
        deductible: Boolean(editInstModal.deductible)
      };
      updateSelectedLoanSchedule((rows) => [...rows, newRow]);
      setEditInstModal(null);
      showToast('New installment added.');
      return;
    }
    if (!editInstModal.deductible) {
      const action = editInstModal.nonDeductibleAction || 'divide';
      updateSelectedLoanSchedule((rows) => {
        const currentIdx = rows.findIndex((r) => r.id === editInstModal.id);
        if (currentIdx === -1) return rows;

        const remainingIndices = [];
        rows.forEach((r, idx) => {
          if (idx > currentIdx && !r.isDisbursement && r.deductible) {
            remainingIndices.push(idx);
          }
        });

        let updatedRows = rows.map((r, idx) =>
          idx === currentIdx
            ? {
                ...r,
                date: editInstModal.date,
                principal: 0,
                interest: 0,
                installment: 0,
                deductible: false
              }
            : { ...r }
        );

        if (action === 'divide' && remainingIndices.length > 0) {
          const count = remainingIndices.length;
          const baseP = Math.floor((principal / count) * 100) / 100;
          const remP = Number((principal - baseP * count).toFixed(2));
          const baseI = Math.floor((interest / count) * 100) / 100;
          const remI = Number((interest - baseI * count).toFixed(2));

          remainingIndices.forEach((targetIdx, pos) => {
            const isLast = pos === count - 1;
            const addP = baseP + (isLast ? remP : 0);
            const addI = baseI + (isLast ? remI : 0);
            const nextP = Number(((Number(updatedRows[targetIdx].principal) || 0) + addP).toFixed(2));
            const nextI = Number(((Number(updatedRows[targetIdx].interest) || 0) + addI).toFixed(2));
            updatedRows[targetIdx] = {
              ...updatedRows[targetIdx],
              principal: nextP,
              interest: nextI,
              installment: Number((nextP + nextI).toFixed(2))
            };
          });
        } else {
          const lastRow = updatedRows[updatedRows.length - 1];
          const nextDate = addMonthsToIso(lastRow?.date || editInstModal.date, 1);
          updatedRows.push({
            id: `inst-${Date.now()}`,
            isDisbursement: false,
            date: nextDate,
            opening: 0,
            principal,
            interest,
            installment,
            balance: 0,
            deductible: true
          });
        }

        let runningBalance = Number(selectedLoan?.loanAmount) || 0;
        return updatedRows.map((r) => {
          if (r.isDisbursement) return r;
          const opening = Math.max(0, Number(runningBalance.toFixed(2)));
          const p = Math.min(opening, Number(r.principal) || 0);
          const intr = Number(r.interest) || 0;
          const balance = Math.max(0, Number((opening - p).toFixed(2)));
          runningBalance = balance;
          return {
            ...r,
            opening,
            principal: p,
            installment: Number((p + intr).toFixed(2)),
            balance
          };
        });
      });
      setEditInstModal(null);
      showToast(
        action === 'divide'
          ? 'Installment skipped and divided equally among remaining installments.'
          : 'Installment skipped and new installment added at the end.'
      );
      return;
    }

    updateSelectedLoanSchedule((rows) =>
      rows.map((r) =>
        r.id === editInstModal.id
          ? {
              ...r,
              date: editInstModal.date,
              principal,
              interest,
              installment,
              deductible: Boolean(editInstModal.deductible)
            }
          : r
      )
    );
    setEditInstModal(null);
    showToast('Installment updated.');
  };

  const handleDownloadScheduleExcel = () => {
    if (!selectedLoan) return;
    const rows = (selectedLoan.schedule || []).map((r) => ({
      Date: r.isDisbursement ? formatUpperDate(r.date) : formatMixedDate(r.date),
      Opening: r.opening.toFixed(2),
      Principal: r.principal.toFixed(2),
      Interest: r.interest.toFixed(2),
      Installment: r.installment.toFixed(2),
      Balance: r.balance.toFixed(2),
      Deductible: r.isDisbursement ? '' : r.deductible ? 'Yes' : 'No'
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Repayment Schedule');
    XLSX.writeFile(wb, `${selectedLoan.employeeName}_${selectedLoan.id}_Schedule.xlsx`);
    showToast('Schedule exported to Excel.');
  };

  // Totals for View/Edit Loan table
  const scheduleTotals = useMemo(() => {
    const rows = selectedLoan?.schedule || [];
    return rows.reduce(
      (acc, r) => ({
        principal: acc.principal + (Number(r.principal) || 0),
        interest: acc.interest + (Number(r.interest) || 0),
        installment: acc.installment + (Number(r.installment) || 0)
      }),
      { principal: 0, interest: 0, installment: 0 }
    );
  }, [selectedLoan]);

  return (
    <AdminLayout>
      <div className={styles.wrapper}>
        <div className={styles.breadcrumb}>
          <span>Dashboard</span>
          <span>/</span>
          <strong>Employee Loans</strong>
        </div>
        {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast((prev) => ({ ...prev, show: false }))}
        />
      )}

      {/* ==================== VIEW 1: LOANS LIST ==================== */}
      {viewMode === 'list' && (
        <>
          <header className={styles.pageHeader}>
            <div className={styles.titleBlock}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <RequestBackButton />
                <h1 className={styles.pageTitle}>
                  <HandCoins size={18} />
                  <span>Loans</span>
                </h1>
              </div>
              <p className={styles.pageSubtitle}>
                Issue new employee loans and manage existing loans.
              </p>
            </div>

            <div className={styles.headerActions}>
              <button
                type="button"
                className={styles.addNewBtn}
                onClick={handleOpenAdd}
              >
                <PlusCircle size={15} />
                <span>Add New Loan</span>
              </button>
            </div>
          </header>

          {/* Filter Row */}
          <div className={styles.filterBar}>
            <div className={styles.dateRangeBox}>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className={styles.dateInput}
                aria-label="From Date"
              />
              <span className={styles.toDivider}>to</span>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className={styles.dateInput}
                aria-label="To Date"
              />
            </div>

            <div className={styles.empSelectGroup}>
              <select
                value={employeeFilter}
                onChange={(e) => setEmployeeFilter(e.target.value)}
                className={styles.empSelect}
                aria-label="Filter by Employee"
              >
                <option value="">All Employees</option>
                {allEmployees.map((emp) => (
                  <option key={emp.employeeId} value={emp.employeeId}>
                    {emp.employeeName} ({emp.employeeId})
                  </option>
                ))}
              </select>
              <button
                type="button"
                className={styles.viewFilterBtn}
                onClick={handleApplyListFilters}
              >
                <CheckCircle2 size={14} />
                <span>View</span>
              </button>
            </div>
          </div>

          {/* Loans Table */}
          <div className={styles.tableCard}>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>SN</th>
                    <th>EMPLOYEE</th>
                    <th>DESIGNATION</th>
                    <th>DEPARTMENT</th>
                    <th>LOAN AMOUNT</th>
                    <th>ISSUE DATE</th>
                    <th>INTEREST METHOD</th>
                    <th>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLoans.length === 0 ? (
                    <tr>
                      <td colSpan={8} className={styles.emptyCell}>
                        No loans found for the selected filters.
                      </td>
                    </tr>
                  ) : (
                    filteredLoans.map((loan, idx) => (
                      <tr key={loan.id}>
                        <td className={styles.snCell}>{idx + 1}</td>
                        <td>
                          <div className={styles.empCell}>
                            <strong>{loan.employeeName}</strong>
                            <span>{loan.employeeId}</span>
                          </div>
                        </td>
                        <td>{loan.designation || '—'}</td>
                        <td>{loan.department || '—'}</td>
                        <td className={styles.amountCell}>{formatInt(loan.loanAmount)}</td>
                        <td className={styles.dateCell}>{formatUpperDate(loan.issueDate)}</td>
                        <td>
                          <span className={styles.methodPill}>{loan.interestMethod}</span>
                        </td>
                        <td>
                          <div className={styles.circleActions}>
                            <button
                              type="button"
                              className={styles.editCircleBtn}
                              onClick={() => handleOpenEdit(loan)}
                              title="View or Edit Loan"
                              aria-label="View or Edit Loan"
                            >
                              <Pencil size={13} />
                            </button>
                            <button
                              type="button"
                              className={styles.deleteCircleBtn}
                              onClick={() => handleDeleteLoan(loan)}
                              title="Delete Loan"
                              aria-label="Delete Loan"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ==================== VIEW 2: ADD NEW LOAN ==================== */}
      {viewMode === 'add' && (
        <>
          <header className={styles.pageHeader}>
            <div className={styles.titleBlock}>
              <h1 className={styles.pageTitle}>
                <HandCoins size={18} />
                <span>Add New Loan</span>
              </h1>
              <p className={styles.pageSubtitle}>
                Select an employee and define loan parameters to issue a new loan.
              </p>
            </div>
            <button
              type="button"
              className={styles.backBtn}
              onClick={() => setViewMode('list')}
            >
              <ArrowLeft size={15} />
              <span>Back to Loans</span>
            </button>
          </header>

          <form className={styles.addLoanCard} onSubmit={handleSaveLoan}>
            <div className={styles.addLoanGrid}>
              {/* Left Form */}
              <div className={styles.formCol}>
                <div className={styles.formRow}>
                  <label>Employee</label>
                  <div className={styles.autocompleteWrap}>
                    <input
                      type="text"
                      className={styles.formInput}
                      value={addForm.employeeQuery}
                      placeholder="Type a few characters to search"
                      onFocus={() => setShowEmpSuggestions(true)}
                      onBlur={() => setTimeout(() => setShowEmpSuggestions(false), 180)}
                      onChange={(e) =>
                        setAddForm({
                          ...addForm,
                          employeeQuery: e.target.value,
                          selectedEmployee: null
                        })
                      }
                    />
                    {showEmpSuggestions && employeeSuggestions.length > 0 && (
                      <div className={styles.suggestionsList}>
                        {employeeSuggestions.map((emp) => (
                          <button
                            key={emp.employeeId}
                            type="button"
                            className={styles.suggestionItem}
                            onMouseDown={() => {
                              setAddForm({
                                ...addForm,
                                employeeQuery: `${emp.employeeName} (${emp.employeeId})`,
                                selectedEmployee: emp
                              });
                              setShowEmpSuggestions(false);
                            }}
                          >
                            <strong>{emp.employeeName}</strong>
                            <span>
                              {emp.employeeId} • {emp.designation}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className={styles.formRow}>
                  <label>Loan Amount</label>
                  <input
                    type="number"
                    min="1"
                    className={styles.formInput}
                    placeholder="10000 etc."
                    value={addForm.loanAmount}
                    onChange={(e) => setAddForm({ ...addForm, loanAmount: e.target.value })}
                  />
                </div>

                <div className={styles.formRow}>
                  <label>Disbursement Date</label>
                  <div className={styles.disbursementRow}>
                    <input
                      type="date"
                      className={styles.formInput}
                      style={{ maxWidth: 165 }}
                      value={addForm.disbursementDate}
                      onChange={(e) =>
                        setAddForm({ ...addForm, disbursementDate: e.target.value })
                      }
                    />
                    <label className={styles.toggleWrap}>
                      <input
                        type="checkbox"
                        checked={addForm.addedInSalary}
                        onChange={(e) =>
                          setAddForm({ ...addForm, addedInSalary: e.target.checked })
                        }
                      />
                      <span className={styles.toggleSlider} />
                      <span className={styles.toggleText}>
                        Add in Salary{' '}
                        <InfoTooltip text="When enabled, the disbursed loan amount will be added to the employee's salary payout for the disbursement month." />
                      </span>
                    </label>
                  </div>
                </div>

                <div className={styles.formRow}>
                  <label>Deduction Start</label>
                  <input
                    type="date"
                    className={styles.formInput}
                    style={{ maxWidth: 165 }}
                    value={addForm.deductionStart}
                    onChange={(e) =>
                      setAddForm({ ...addForm, deductionStart: e.target.value })
                    }
                  />
                </div>

                <div className={styles.formRow}>
                  <label>Installments</label>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    className={styles.formInput}
                    style={{ maxWidth: 165 }}
                    placeholder="3, 6 etc."
                    value={addForm.installments}
                    onChange={(e) => setAddForm({ ...addForm, installments: e.target.value })}
                  />
                </div>

                <div className={styles.formRow}>
                  <label>Interest Method</label>
                  <select
                    className={styles.formSelect}
                    value={addForm.interestMethod}
                    onChange={(e) =>
                      setAddForm({ ...addForm, interestMethod: e.target.value })
                    }
                  >
                    {INTEREST_METHODS.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>

                {addForm.interestMethod !== 'Interest Free' && (
                  <div className={styles.formRow}>
                    <label>Interest Rate (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.5"
                      className={styles.formInput}
                      style={{ maxWidth: 165 }}
                      placeholder="e.g., 5"
                      value={addForm.interestRate}
                      onChange={(e) =>
                        setAddForm({ ...addForm, interestRate: e.target.value })
                      }
                    />
                  </div>
                )}

                <div className={styles.formDivider} />

                <div className={styles.formBtnRow}>
                  <button
                    type="button"
                    className={styles.previewBtn}
                    onClick={handlePreviewLoan}
                  >
                    <Eye size={14} />
                    <span>Preview</span>
                  </button>
                  <button type="submit" className={styles.saveLoanBtn}>
                    <Save size={14} />
                    <span>Save Loan →</span>
                  </button>
                </div>
              </div>

              {/* Right Preview Schedule Table */}
              <div className={styles.previewCol}>
                <div className={styles.previewTableWrap}>
                  <table className={styles.previewTable}>
                    <thead>
                      <tr>
                        <th>DATE</th>
                        <th>OPENING</th>
                        <th>INSTALLMENT</th>
                        <th>PRINCIPAL</th>
                        <th>INTEREST</th>
                        <th>BALANCE</th>
                      </tr>
                    </thead>
                    <tbody>
                      {previewSchedule.length === 0 ? (
                        <tr>
                          <td colSpan={6} className={styles.previewEmpty}>
                            Click <strong>Preview</strong> to view installment schedule.
                          </td>
                        </tr>
                      ) : (
                        previewSchedule.map((r) => (
                          <tr key={r.id}>
                            <td>
                              {r.isDisbursement
                                ? formatUpperDate(r.date)
                                : formatMixedDate(r.date)}
                            </td>
                            <td>{formatDec(r.opening)}</td>
                            <td>{formatDec(r.installment)}</td>
                            <td>{formatDec(r.principal)}</td>
                            <td>{formatDec(r.interest)}</td>
                            <td>{formatDec(r.balance)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </form>
        </>
      )}

      {/* ==================== VIEW 3: VIEW OR EDIT LOAN ==================== */}
      {viewMode === 'edit' && selectedLoan && (
        <>
          <header className={styles.pageHeader}>
            <div className={styles.titleBlock}>
              <h1 className={styles.pageTitle}>
                <HandCoins size={18} />
                <span>View or Edit Loan</span>
              </h1>
              <p className={styles.pageSubtitle}>
                View loan repayment schedule and make changes.
              </p>
            </div>

            <div className={styles.headerActions}>
              <button
                type="button"
                className={styles.prepayBtn}
                onClick={() => {
                  setPrepaymentDate(todayStr);
                  setPrepaymentAmt('');
                  setPrepaymentDeductFromSalary(false);
                  setPrepaymentModal(true);
                }}
              >
                <PlusCircle size={14} />
                <span>Add Prepayment</span>
              </button>
              <button
                type="button"
                className={styles.installmentBtn}
                onClick={handleAddInstallment}
              >
                <PlusCircle size={14} />
                <span>Add Installment</span>
              </button>
              <button
                type="button"
                className={styles.greyActionBtn}
                onClick={handleDownloadScheduleExcel}
              >
                <FileSpreadsheet size={14} />
                <span>Download (Excel)</span>
              </button>
              <button
                type="button"
                className={styles.backBtn}
                onClick={() => setViewMode('list')}
              >
                <ArrowLeft size={14} />
                <span>Back</span>
              </button>
            </div>
          </header>

          {/* 7 Summary Info Cards */}
          <div className={styles.summaryCards7}>
            <div className={styles.infoCard}>
              <span>Employee Name</span>
              <strong>
                {selectedLoan.employeeName} ({selectedLoan.employeeId})
              </strong>
            </div>
            <div className={styles.infoCard}>
              <span>Loan Amount</span>
              <strong>{formatInt(selectedLoan.loanAmount)}</strong>
            </div>
            <div className={styles.infoCard}>
              <span>Loan Disbursement</span>
              <strong>{formatUpperDate(selectedLoan.issueDate)}</strong>
            </div>
            <div className={styles.infoCard}>
              <span>
                Added in Salary{' '}
                <InfoTooltip text="Indicates whether the loan disbursement amount is included in the employee's salary payout." />
              </span>
              <label className={styles.toggleWrap} style={{ marginTop: 4 }}>
                <input
                  type="checkbox"
                  checked={Boolean(selectedLoan.addedInSalary)}
                  onChange={handleToggleAddedInSalary}
                />
                <span className={styles.toggleSlider} />
              </label>
            </div>
            <div className={styles.infoCard}>
              <span>Deduction Start</span>
              <strong>{formatUpperDate(selectedLoan.deductionStart)}</strong>
            </div>
            <div className={styles.infoCard}>
              <span>Interest Method</span>
              <strong>{selectedLoan.interestMethod}</strong>
            </div>
            <div className={styles.infoCard}>
              <span>Total Installments</span>
              <strong>
                {(selectedLoan.schedule || []).filter((r) => !r.isDisbursement).length}
              </strong>
            </div>
          </div>

          {/* Schedule Table */}
          <div className={styles.tableCard}>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>DATE</th>
                    <th>OPENING</th>
                    <th>PRINCIPAL</th>
                    <th>INTEREST</th>
                    <th>INSTALLMENT</th>
                    <th>BALANCE</th>
                    <th>DEDUCTIBLE</th>
                    <th>ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {(selectedLoan.schedule || []).map((row) => (
                    <tr key={row.id}>
                      <td>
                        <strong>
                          {row.isDisbursement
                            ? formatUpperDate(row.date)
                            : formatMixedDate(row.date)}
                        </strong>
                      </td>
                      <td>{formatDec(row.opening)}</td>
                      <td>{formatDec(row.principal)}</td>
                      <td>{formatDec(row.interest)}</td>
                      <td>{formatDec(row.installment)}</td>
                      <td>{formatDec(row.balance)}</td>
                      <td>
                        {!row.isDisbursement && (
                          <button
                            type="button"
                            className={
                              row.deductible
                                ? styles.deductibleYes
                                : styles.deductibleNo
                            }
                            onClick={() => handleToggleDeductible(row.id)}
                            title="Click to toggle deductible"
                          >
                            {row.deductible ? 'Yes' : 'No'}
                          </button>
                        )}
                      </td>
                      <td>
                        {!row.isDisbursement && (
                          <div className={styles.circleActions}>
                            <button
                              type="button"
                              className={styles.editCircleBtn}
                              onClick={() =>
                                setEditInstModal({
                                  ...row,
                                  nonDeductibleAction: 'divide'
                                })
                              }
                              title="Edit Installment"
                            >
                              <Pencil size={13} />
                            </button>
                            <button
                              type="button"
                              className={styles.deleteCircleBtn}
                              onClick={() => handleDeleteInstallment(row)}
                              title="Delete Installment"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                  <tr className={styles.totalsRow}>
                    <td>
                      <strong>Totals</strong>
                    </td>
                    <td>0.00</td>
                    <td>{formatDec(scheduleTotals.principal)}</td>
                    <td>{formatDec(scheduleTotals.interest)}</td>
                    <td>{formatDec(scheduleTotals.installment)}</td>
                    <td>0.00</td>
                    <td />
                    <td />
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ==================== ADD PREPAYMENT MODAL ==================== */}
      {prepaymentModal && (
        <div className={styles.modalBackdrop} onClick={() => setPrepaymentModal(false)}>
          <form
            className={styles.editInstModal}
            onClick={(e) => e.stopPropagation()}
            onSubmit={handleApplyPrepayment}
          >
            <div className={styles.modalHeader}>
              <h3>Add Prepayment</h3>
              <button
                type="button"
                className={styles.closeIconBtn}
                onClick={() => setPrepaymentModal(false)}
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>
            <div className={styles.editInstBody} style={{ paddingTop: 18 }}>
              <div className={styles.editInstRow}>
                <label>Prepayment Date</label>
                <input
                  type="date"
                  required
                  className={styles.editInstInput}
                  value={prepaymentDate}
                  onChange={(e) => setPrepaymentDate(e.target.value)}
                />
              </div>

              <div className={styles.editInstRow}>
                <label>Amount</label>
                <input
                  type="number"
                  min="1"
                  required
                  className={styles.editInstInput}
                  value={prepaymentAmt}
                  onChange={(e) => setPrepaymentAmt(e.target.value)}
                  placeholder="0"
                />
              </div>

              <div className={styles.editInstRow}>
                <span />
                <label className={styles.toggleWrap}>
                  <input
                    type="checkbox"
                    checked={prepaymentDeductFromSalary}
                    onChange={(e) => setPrepaymentDeductFromSalary(e.target.checked)}
                  />
                  <span className={styles.toggleSlider} />
                  <span className={styles.toggleText}>Deduct from Salary</span>
                </label>
              </div>

              <div className={styles.prepayInfoBanner}>
                <span className={styles.prepayInfoDot}>i</span>
                <span>
                  This will revise the loan repayment schedule for installments falling after this
                  prepayment.
                </span>
              </div>
            </div>
            <div className={styles.editInstFooter}>
              <button
                type="button"
                className={styles.cancelLinkBtn}
                onClick={() => setPrepaymentModal(false)}
              >
                Close
              </button>
              <button type="submit" className={styles.addNewBtn}>
                Save
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ==================== EDIT INSTALLMENT MODAL ==================== */}
      {editInstModal && (
        <div className={styles.modalBackdrop} onClick={() => setEditInstModal(null)}>
          <form
            className={styles.editInstModal}
            onClick={(e) => e.stopPropagation()}
            onSubmit={handleSaveEditedInstallment}
          >
            <div className={styles.editInstHeader}>
              <button
                type="button"
                className={styles.closeIconBtn}
                onClick={() => setEditInstModal(null)}
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>
            <div className={styles.editInstBody}>
              <div className={styles.editInstRow}>
                <label>Deduction Date</label>
                <input
                  type="date"
                  required
                  className={styles.editInstInput}
                  value={editInstModal.date}
                  onChange={(e) =>
                    setEditInstModal({ ...editInstModal, date: e.target.value })
                  }
                />
              </div>

              <div className={styles.editInstRow}>
                <label>Principal</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  className={`${styles.editInstInput} ${styles.numRight}`}
                  value={editInstModal.principal}
                  onChange={(e) =>
                    setEditInstModal({ ...editInstModal, principal: e.target.value })
                  }
                />
              </div>

              <div className={styles.editInstRow}>
                <label>Interest</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  className={`${styles.editInstInput} ${styles.numRight}`}
                  value={editInstModal.interest}
                  onChange={(e) =>
                    setEditInstModal({ ...editInstModal, interest: e.target.value })
                  }
                />
              </div>

              <div className={styles.editInstRow}>
                <label>Total</label>
                <input
                  type="number"
                  readOnly
                  className={`${styles.editInstInput} ${styles.numRight}`}
                  value={
                    (Number(editInstModal.principal) || 0) +
                    (Number(editInstModal.interest) || 0)
                  }
                />
              </div>

              <div className={styles.editInstRow}>
                <span />
                <label className={styles.toggleWrap}>
                  <input
                    type="checkbox"
                    checked={Boolean(editInstModal.deductible)}
                    onChange={(e) =>
                      setEditInstModal({
                        ...editInstModal,
                        deductible: e.target.checked,
                        nonDeductibleAction: editInstModal.nonDeductibleAction || 'divide'
                      })
                    }
                  />
                  <span className={styles.toggleSlider} />
                  <span className={styles.toggleText}>
                    Deduct from Salary{' '}
                    <InfoTooltip text="When enabled, this installment will be automatically deducted from the employee's monthly salary." />
                  </span>
                </label>
              </div>

              {!editInstModal.isNew && !editInstModal.deductible && (
                <div className={styles.editInstRow}>
                  <span />
                  <div className={styles.nonDeductibleRow}>
                    <label className={styles.nonDeductibleRadio}>
                      <input
                        type="radio"
                        name="nonDeductibleAction"
                        value="divide"
                        checked={(editInstModal.nonDeductibleAction || 'divide') === 'divide'}
                        onChange={() =>
                          setEditInstModal({
                            ...editInstModal,
                            nonDeductibleAction: 'divide'
                          })
                        }
                      />
                      <span>Divide in remaining</span>
                    </label>
                    <label className={styles.nonDeductibleRadio}>
                      <input
                        type="radio"
                        name="nonDeductibleAction"
                        value="new_end"
                        checked={editInstModal.nonDeductibleAction === 'new_end'}
                        onChange={() =>
                          setEditInstModal({
                            ...editInstModal,
                            nonDeductibleAction: 'new_end'
                          })
                        }
                      />
                      <span>Add at the end</span>
                    </label>
                  </div>
                </div>
              )}
            </div>
            <div className={styles.editInstFooter}>
              <button
                type="button"
                className={styles.cancelLinkBtn}
                onClick={() => setEditInstModal(null)}
              >
                Cancel
              </button>
              <button type="submit" className={styles.addNewBtn}>
                Save
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ==================== DELETE CONFIRMATION MODAL ==================== */}
      {deleteConfirm && (
        <div className={styles.modalBackdrop} onClick={() => setDeleteConfirm(null)}>
          <div
            className={styles.confirmModal}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="loan-delete-confirm-title"
          >
            <div className={styles.confirmBody}>
              <div className={styles.confirmIconWrap}>
                <AlertTriangle size={24} />
              </div>
              <h3 id="loan-delete-confirm-title" className={styles.confirmTitle}>
                {deleteConfirm.title}
              </h3>
              <p className={styles.confirmMsg}>{deleteConfirm.message}</p>
            </div>
            <div className={styles.confirmFooter}>
              <button
                type="button"
                className={styles.confirmCancelBtn}
                onClick={() => setDeleteConfirm(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className={styles.confirmDeleteBtn}
                onClick={handleConfirmDelete}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </AdminLayout>
  );
}
