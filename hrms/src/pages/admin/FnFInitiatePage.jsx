import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  User,
  Calendar,
  Building2,
  CheckCircle2,
  Clock,
  ShieldAlert,
  IndianRupee,
  FileText,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Layers,
  Check,
  CreditCard,
  Printer,
  ShieldCheck,
  FileCheck2,
  Loader2
} from 'lucide-react';
import AdminLayout from '../../components/layout/AdminLayout';
import UserLayout from '../../components/layout/UserLayout';
import Toast from '../../components/common/Toast';
import { useCompany } from '../../context/CompanyContext';
import employeeService from '../../services/employeeService';
import clientService from '../../services/clientService';
import {
  EXIT_TYPES,
  SEPARATION_REASONS,
  CLEARANCE_DEPARTMENTS,
  APPROVAL_STAGES,
  getStoredFnF,
  saveStoredFnF
} from '../../data/fnfData';
import styles from './FnFInitiatePage.module.css';

const formatINR = (val) => `₹${Number(val || 0).toLocaleString('en-IN')}`;

// Number to Words in Indian Rupees
function inWordsINR(num) {
  const a = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const n = Math.round(Number(num) || 0);
  if (n === 0) return 'Zero Rupees Only';
  if (n < 0) return 'Negative ' + inWordsINR(-n);

  function convertSection(v) {
    if (v === 0) return '';
    if (v < 20) return a[v] + ' ';
    if (v < 100) return b[Math.floor(v / 10)] + (v % 10 !== 0 ? ' ' + a[v % 10] : '') + ' ';
    return a[Math.floor(v / 100)] + ' Hundred ' + (v % 100 !== 0 ? convertSection(v % 100) : '');
  }

  let words = '';
  const crore = Math.floor(n / 10000000);
  const lakh = Math.floor((n % 10000000) / 100000);
  const thousand = Math.floor((n % 100000) / 1000);
  const remainder = n % 1000;

  if (crore > 0) words += convertSection(crore) + 'Crore ';
  if (lakh > 0) words += convertSection(lakh) + 'Lakh ';
  if (thousand > 0) words += convertSection(thousand) + 'Thousand ';
  if (remainder > 0) words += convertSection(remainder);

  return (words.trim() + ' Rupees Only');
}

export default function FnFInitiatePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const isAdmin = !location.pathname.startsWith('/user');
  const basePath = isAdmin ? '/admin/payroll' : '/user/payroll';
  const LayoutComponent = isAdmin ? AdminLayout : UserLayout;

  const { activeCompanyId } = useCompany();
  const [employees, setEmployees] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const notify = (message, type = 'success') => setToast({ message, type });

  const [activeTab, setActiveTab] = useState('exit_details'); // 'exit_details' | 'clearance_attendance' | 'finances' | 'approvals_payout'
  const [selectedEmpId, setSelectedEmpId] = useState('');

  // 11-Step Form State
  const [formData, setFormData] = useState({
    // Step 1: Initiation & Employee
    employeeCode: '',
    employeeName: '',
    designation: '',
    client: '',
    site: '',
    department: '',
    dateOfJoining: '',
    tenureYears: 1.0,
    monthlyGrossSalary: 22000,
    basicSalary: 15000,
    perDayWage: 846.15,

    // Step 2: Exit Details
    exitType: 'Resignation',
    resignationDate: new Date().toISOString().slice(0, 10),
    lastWorkingDay: new Date(Date.now() + 15 * 86400000).toISOString().slice(0, 10),
    noticePeriodRequiredDays: 30,
    noticePeriodServedDays: 30,
    noticeShortfallDays: 0,
    separationReason: SEPARATION_REASONS[0],
    remarks: '',

    // Step 3: 6 Department Clearances
    clearances: {
      hr: { status: 'Cleared', clearedBy: 'HR Desk', clearedDate: new Date().toISOString().slice(0, 10), remarks: 'ID & credentials checked' },
      operations: { status: 'Cleared', clearedBy: 'Site Ops Lead', clearedDate: new Date().toISOString().slice(0, 10), remarks: 'Duty handed over' },
      accounts: { status: 'Cleared', clearedBy: 'Accounts Exec', clearedDate: new Date().toISOString().slice(0, 10), remarks: 'No pending imprest' },
      admin: { status: 'Cleared', clearedBy: 'Admin Team', clearedDate: new Date().toISOString().slice(0, 10), remarks: 'Biometric access revoked' },
      inventory: { status: 'Pending', clearedBy: 'Store Incharge', clearedDate: '', remarks: 'Uniform inspection scheduled' },
      client: { status: 'Cleared', clearedBy: 'Client Site Lead', clearedDate: new Date().toISOString().slice(0, 10), remarks: 'Client NOC issued' }
    },

    // Step 4: Attendance & Leave Verification
    attendance: {
      presentDays: 15,
      absentDays: 1,
      overtimeHours: 0,
      weeklyOffs: 4,
      holidays: 1,
      leaveBalance: 8
    },

    // Step 5: Salary & Arrear Dues
    salaryDues: {
      pendingSalary: 12692,
      overtimePay: 0,
      incentives: 0,
      arrears: 0,
      bonus: 0
    },

    // Step 6: Deductions
    deductions: {
      noticeRecovery: 0,
      advanceRecovery: 0,
      loanRecovery: 0,
      uniformPenalty: 0,
      otherDeductions: 0
    },

    // Step 7: Statutory & Benefits
    statutoryBenefits: {
      employeePf: 1800,
      employeeEsi: 165,
      gratuityAmount: 0,
      leaveEncashment: 6769
    },

    // Step 9: Approval Workflow
    approvalWorkflow: {
      currentStage: 'hr_review',
      isFullyApproved: false,
      stages: {
        hr_review: { status: 'Pending', approver: 'HR Manager', date: '' },
        ops_review: { status: 'Pending', approver: 'Operations Manager', date: '' },
        accounts_review: { status: 'Pending', approver: 'Accounts Head', date: '' },
        final_approval: { status: 'Pending', approver: 'Director / Management', date: '' }
      }
    },

    // Step 10: Payment Processing
    payment: {
      mode: 'Bank Transfer (NEFT)',
      paymentDate: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
      bankName: 'HDFC Bank',
      accountNo: '50100482910482',
      ifsc: 'HDFC0001248',
      utrNo: '',
      status: 'Pending Clearance'
    },

    // Step 11: Documents to generate
    documents: {
      fnfStatementGenerated: true,
      relievingLetterGenerated: true,
      exitPayslipGenerated: true
    }
  });

  // Fetch employees list on mount
  useEffect(() => {
    async function loadEmployees() {
      try {
        setIsLoading(true);
        const res = await employeeService.getEmployees(activeCompanyId);
        if (Array.isArray(res) && res.length > 0) {
          setEmployees(res);
        } else {
          // Fallback mock employees
          setEmployees([
            { id: 'e101', employeeCode: 'RR-101', name: 'Rajesh Kumar Verma', designation: 'Armed Guard', clientName: 'DLF CyberCity Tech Park', grossSalary: 24000, basicSalary: 15000, joiningDate: '2022-03-15' },
            { id: 'e102', employeeCode: 'RR-102', name: 'Amit Kumar Singh', designation: 'Security Guard', clientName: 'Advant Navis Business Park', grossSalary: 20000, basicSalary: 14000, joiningDate: '2024-01-10' },
            { id: 'e103', employeeCode: 'RR-103', name: 'Manoj Dayal Sharma', designation: 'Field Supervisor', clientName: 'Logix Blossom Greens', grossSalary: 28000, basicSalary: 18000, joiningDate: '2020-05-20' },
            { id: 'e104', employeeCode: 'RR-104', name: 'Sunil Prasad', designation: 'Head Guard', clientName: 'Jaypee Greens Kensington', grossSalary: 22500, basicSalary: 15000, joiningDate: '2023-08-01' }
          ]);
        }
      } catch (err) {
        console.warn('Error loading employees:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadEmployees();
  }, [activeCompanyId]);

  // When selecting an employee from the dropdown
  const handleEmployeeChange = (e) => {
    const empId = e.target.value;
    setSelectedEmpId(empId);
    if (!empId) return;

    const emp = employees.find((item) => (item.id || item.employeeId || item._id) === empId);
    if (!emp) return;

    const gross = Number(emp.grossSalary || emp.salary || emp.earnings?.totalGross || 22000);
    const basic = Number(emp.basicSalary || emp.basic || emp.earnings?.basic || Math.round(gross * 0.5));
    const dailyWage = Math.round((gross / 26) * 100) / 100;
    const joiningDate = emp.joiningDate || emp.dateOfJoining || '2023-01-01';

    // Calculate tenure in years
    const joinDateObj = new Date(joiningDate);
    const today = new Date();
    const tenureYears = Math.max(0.5, Math.round(((today - joinDateObj) / (1000 * 60 * 60 * 24 * 365.25)) * 10) / 10);

    const presentDays = 15;
    const leaveBalance = 6;
    const pendingSalary = Math.round(presentDays * dailyWage);
    const leaveEncashment = Math.round(leaveBalance * dailyWage);

    let gratuity = 0;
    if (tenureYears >= 5) {
      gratuity = Math.round(((15 * basic) / 26) * tenureYears);
    }

    setFormData((prev) => ({
      ...prev,
      employeeCode: emp.employeeCode || emp.code || emp.employeeId || 'RR-000',
      employeeName: emp.name || emp.employeeName || `${emp.personalInfo?.firstName || ''} ${emp.personalInfo?.lastName || ''}`.trim() || 'Employee',
      designation: emp.designation || emp.role || 'Security Staff',
      client: emp.clientName || emp.assignedClient || emp.client || 'Corporate Client',
      site: emp.siteName || emp.assignedSite || 'Main Site',
      department: emp.department || 'Security Operations',
      dateOfJoining: joiningDate,
      tenureYears,
      monthlyGrossSalary: gross,
      basicSalary: basic,
      perDayWage: dailyWage,
      attendance: {
        ...prev.attendance,
        presentDays,
        leaveBalance
      },
      salaryDues: {
        ...prev.salaryDues,
        pendingSalary
      },
      statutoryBenefits: {
        ...prev.statutoryBenefits,
        leaveEncashment,
        gratuityAmount: gratuity,
        employeePf: Math.min(1800, Math.round(basic * 0.12)),
        employeeEsi: gross <= 21000 ? Math.round(gross * 0.0075) : 0
      }
    }));
  };

  // Recompute financials helper
  const recomputeFinancials = (updated) => {
    const dailyWage = updated.perDayWage || 846.15;
    const basic = updated.basicSalary || 15000;
    const tenure = updated.tenureYears || 1;

    // Notice shortfall
    const reqNotice = Number(updated.noticePeriodRequiredDays || 0);
    const srvNotice = Number(updated.noticePeriodServedDays || 0);
    const shortfall = Math.max(0, reqNotice - srvNotice);
    updated.noticeShortfallDays = shortfall;
    updated.deductions.noticeRecovery = Math.round(shortfall * dailyWage);

    // Pending salary
    const present = Number(updated.attendance.presentDays || 0);
    updated.salaryDues.pendingSalary = Math.round(present * dailyWage);

    // OT pay (double hourly rate standard)
    const otHrs = Number(updated.attendance.overtimeHours || 0);
    const hourlyWage = Math.round((dailyWage / 8) * 100) / 100;
    updated.salaryDues.overtimePay = Math.round(otHrs * (hourlyWage * 2));

    // Leave encashment
    const lvBalance = Number(updated.attendance.leaveBalance || 0);
    updated.statutoryBenefits.leaveEncashment = Math.round(lvBalance * dailyWage);

    // Gratuity
    if (tenure >= 5) {
      updated.statutoryBenefits.gratuityAmount = Math.round(((15 * basic) / 26) * tenure);
    } else {
      updated.statutoryBenefits.gratuityAmount = 0;
    }

    return updated;
  };

  // Clearance department update
  const handleClearanceChange = (deptKey, field, value) => {
    setFormData((prev) => ({
      ...prev,
      clearances: {
        ...prev.clearances,
        [deptKey]: {
          ...prev.clearances[deptKey],
          [field]: value
        }
      }
    }));
  };

  // Calculations for Earnings, Deductions, and Net
  const totalEarnings =
    Number(formData.salaryDues.pendingSalary || 0) +
    Number(formData.salaryDues.overtimePay || 0) +
    Number(formData.salaryDues.incentives || 0) +
    Number(formData.salaryDues.arrears || 0) +
    Number(formData.salaryDues.bonus || 0) +
    Number(formData.statutoryBenefits.leaveEncashment || 0) +
    Number(formData.statutoryBenefits.gratuityAmount || 0);

  const totalDeductions =
    Number(formData.deductions.noticeRecovery || 0) +
    Number(formData.deductions.advanceRecovery || 0) +
    Number(formData.deductions.loanRecovery || 0) +
    Number(formData.deductions.uniformPenalty || 0) +
    Number(formData.deductions.otherDeductions || 0) +
    Number(formData.statutoryBenefits.employeePf || 0) +
    Number(formData.statutoryBenefits.employeeEsi || 0);

  const netPayable = Math.max(0, totalEarnings - totalDeductions);

  // Submit Handler
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.employeeName) {
      alert('Please select an employee.');
      setActiveTab('exit_details');
      return;
    }

    const clearanceValues = Object.values(formData.clearances);
    const hasPendingClearance = clearanceValues.some((c) => c.status !== 'Cleared' && c.status !== 'Waived');
    const initialStatus = hasPendingClearance ? 'Pending Clearance' : 'Pending Approval';

    const newRecord = {
      id: `fnf-${Date.now()}`,
      settlementId: `FNF-2026-${Math.floor(100 + Math.random() * 900)}`,
      employeeId: selectedEmpId,
      ...formData,
      finalSettlement: {
        totalEarnings,
        totalDeductions,
        netPayable
      },
      totalEarnings,
      totalDeductions,
      netSettlementAmount: netPayable,
      settlementStatus: initialStatus,
      createdAt: new Date().toISOString()
    };

    const existing = getStoredFnF();
    const updated = [newRecord, ...existing];
    saveStoredFnF(updated);

    notify(`✓ Full & Final settlement initiated for ${formData.employeeName} (${newRecord.settlementId}).`, 'success');

    setTimeout(() => {
      navigate(`${basePath}?tab=fnf`);
    }, 500);
  };

  return (
    <LayoutComponent>
      <div style={{ maxWidth: '1360px', margin: '0 auto', padding: '0 8px 32px' }}>
        {toast && (
          <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
        )}

        {/* Dynamic Breadcrumbs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '13px', margin: '14px 0 16px', color: '#64748b' }}>
          <Link to="/admin/dashboard" style={{ color: '#64748b', textDecoration: 'none' }}>Dashboard</Link>
          <ChevronRight size={14} />
          <Link to={basePath} style={{ color: '#2563eb', textDecoration: 'none' }}>Payroll</Link>
          <ChevronRight size={14} />
          <Link to={`${basePath}?tab=fnf`} style={{ color: '#2563eb', textDecoration: 'none' }}>Full &amp; Final (FnF)</Link>
          <ChevronRight size={14} />
          <strong style={{ color: '#0f172a' }}>Initiate Settlement</strong>
        </div>

        {/* Page Card */}
        <div style={{
          background: '#ffffff',
          borderRadius: 12,
          border: '1px solid #e2e8f0',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)',
          overflow: 'hidden'
        }}>
          {/* Page Header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '18px 24px',
            borderBottom: '1px solid #e2e8f0',
            background: '#ffffff',
            flexWrap: 'wrap',
            gap: 12
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button
                type="button"
                onClick={() => navigate(`${basePath}?tab=fnf`)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 36,
                  height: 36,
                  borderRadius: 8,
                  border: '1px solid #cbd5e1',
                  background: '#ffffff',
                  cursor: 'pointer',
                  color: '#475569'
                }}
                title="Back to FnF Settlement List"
              >
                <ChevronLeft size={18} />
              </button>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: '#0f172a' }}>
                    Initiate Full &amp; Final (FnF) Settlement
                  </h1>
                  <span style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: 12,
                    background: '#eff6ff',
                    color: '#1d4ed8',
                    border: '1px solid #bfdbfe'
                  }}>
                    11-Step Lifecycle
                  </span>
                </div>
                <p style={{ margin: '3px 0 0', fontSize: '13px', color: '#64748b' }}>
                  Complete employee exit initiation, 6-department clearances, attendance dues, statutory recoveries and settlement voucher.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button
                type="button"
                onClick={() => navigate(`${basePath}?tab=fnf`)}
                style={{
                  padding: '8px 16px',
                  borderRadius: 6,
                  border: '1px solid #cbd5e1',
                  background: '#ffffff',
                  color: '#475569',
                  fontWeight: 600,
                  fontSize: '13px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                style={{
                  padding: '8px 20px',
                  borderRadius: 6,
                  border: 'none',
                  background: '#059669',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: '13px',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  boxShadow: '0 1px 3px rgba(5,150,105,0.2)'
                }}
              >
                <Check size={16} />
                <span>Save &amp; Initiate Settlement</span>
              </button>
            </div>
          </div>

          {/* Stepper Tabs Bar */}
          <div style={{
            display: 'flex',
            borderBottom: '1px solid #e2e8f0',
            background: '#f8fafc',
            padding: '0 24px',
            overflowX: 'auto'
          }}>
            {[
              { id: 'exit_details', step: 'Step 1 & 2', label: 'Exit & Notice Details' },
              { id: 'clearance_attendance', step: 'Step 3 & 4', label: '6-Dept Clearances & Attendance' },
              { id: 'finances', step: 'Step 5, 6, 7 & 8', label: 'Earnings, Deductions & Net Payable' },
              { id: 'approvals_payout', step: 'Step 9, 10 & 11', label: 'Approvals & Payment Processing' }
            ].map((t) => {
              const isActive = activeTab === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setActiveTab(t.id)}
                  style={{
                    padding: '14px 20px',
                    border: 'none',
                    borderBottom: isActive ? '3px solid #2563eb' : '3px solid transparent',
                    background: 'none',
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    whiteSpace: 'nowrap'
                  }}
                >
                  <span style={{ display: 'block', fontSize: '10.5px', textTransform: 'uppercase', fontWeight: 700, color: isActive ? '#2563eb' : '#94a3b8', letterSpacing: '0.04em' }}>
                    {t.step}
                  </span>
                  <span style={{ fontSize: '13.5px', fontWeight: isActive ? 700 : 500, color: isActive ? '#0f172a' : '#64748b' }}>
                    {t.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Page Form Body */}
          <form onSubmit={handleSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 24 }}>

            {/* TAB 1: EXIT & NOTICE DETAILS */}
            {activeTab === 'exit_details' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {/* Employee Selection Box */}
                <div style={{ background: '#f8fafc', padding: 18, borderRadius: 10, border: '1px solid #e2e8f0' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>
                    Select Separating Employee <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <select
                    value={selectedEmpId}
                    onChange={handleEmployeeChange}
                    required
                    style={{
                      width: '100%',
                      height: 42,
                      borderRadius: 8,
                      border: '1px solid #cbd5e1',
                      padding: '0 12px',
                      fontSize: '13.5px',
                      outline: 'none',
                      background: '#ffffff'
                    }}
                  >
                    <option value="">-- Choose Employee to Exit --</option>
                    {employees.map((emp) => {
                      const idVal = emp.id || emp.employeeId || emp._id;
                      const name = emp.name || emp.employeeName || `${emp.personalInfo?.firstName || ''} ${emp.personalInfo?.lastName || ''}`.trim() || idVal;
                      const code = emp.employeeCode || emp.code || emp.employeeId || '';
                      return (
                        <option key={idVal} value={idVal}>
                          {name} {code ? `(${code})` : ''} — {emp.designation || 'Staff'} ({emp.clientName || 'Main Client'})
                        </option>
                      );
                    })}
                  </select>

                  {formData.employeeName && (
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(5, 1fr)',
                      gap: 14,
                      marginTop: 14,
                      padding: '14px 18px',
                      background: '#ffffff',
                      borderRadius: 8,
                      border: '1px solid #e2e8f0',
                      fontSize: '12.5px'
                    }}>
                      <div>
                        <span style={{ color: '#64748b', display: 'block', fontSize: '11px' }}>Role / Designation</span>
                        <strong style={{ color: '#0f172a' }}>{formData.designation}</strong>
                      </div>
                      <div>
                        <span style={{ color: '#64748b', display: 'block', fontSize: '11px' }}>Client &amp; Site</span>
                        <strong style={{ color: '#2563eb' }}>{formData.client} ({formData.site})</strong>
                      </div>
                      <div>
                        <span style={{ color: '#64748b', display: 'block', fontSize: '11px' }}>Joining Date &amp; Tenure</span>
                        <strong style={{ color: '#0f172a' }}>{formData.dateOfJoining} ({formData.tenureYears} yrs)</strong>
                      </div>
                      <div>
                        <span style={{ color: '#64748b', display: 'block', fontSize: '11px' }}>Gross Salary</span>
                        <strong style={{ color: '#16a34a' }}>{formatINR(formData.monthlyGrossSalary)}/mo</strong>
                      </div>
                      <div>
                        <span style={{ color: '#64748b', display: 'block', fontSize: '11px' }}>Daily Wage Rate</span>
                        <strong style={{ color: '#16a34a' }}>{formatINR(formData.perDayWage)}/day</strong>
                      </div>
                    </div>
                  )}
                </div>

                {/* Exit Dates & Category */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                      Step 1: Exit Mode / Type <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <select
                      value={formData.exitType}
                      onChange={(e) => setFormData((p) => ({ ...p, exitType: e.target.value }))}
                      style={{ width: '100%', height: 38, borderRadius: 6, border: '1px solid #cbd5e1', padding: '0 10px', fontSize: '13px' }}
                    >
                      {EXIT_TYPES.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                      Separation Reason Category <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <select
                      value={formData.separationReason}
                      onChange={(e) => setFormData((p) => ({ ...p, separationReason: e.target.value }))}
                      style={{ width: '100%', height: 38, borderRadius: 6, border: '1px solid #cbd5e1', padding: '0 8px', fontSize: '12px' }}
                    >
                      {SEPARATION_REASONS.map((r) => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                      Notice / Resignation Date <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type="date"
                      value={formData.resignationDate}
                      onChange={(e) => setFormData((p) => ({ ...p, resignationDate: e.target.value }))}
                      style={{ width: '100%', height: 38, borderRadius: 6, border: '1px solid #cbd5e1', padding: '0 10px', fontSize: '13px' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                      Last Working Day (LWD) <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type="date"
                      value={formData.lastWorkingDay}
                      onChange={(e) => setFormData((p) => ({ ...p, lastWorkingDay: e.target.value }))}
                      style={{ width: '100%', height: 38, borderRadius: 6, border: '1px solid #cbd5e1', padding: '0 10px', fontSize: '13px' }}
                    />
                  </div>
                </div>

                {/* Notice Period Details */}
                <div style={{ background: '#f8fafc', padding: 18, borderRadius: 10, border: '1px solid #e2e8f0' }}>
                  <span style={{ fontSize: '12.5px', fontWeight: 700, color: '#0f172a', textTransform: 'uppercase', display: 'block', marginBottom: 12 }}>
                    Step 2: Notice Period Compliance &amp; Shortfall Recovery
                  </span>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', color: '#475569', marginBottom: 4 }}>
                        Notice Required (Days)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={formData.noticePeriodRequiredDays}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setFormData((p) => recomputeFinancials({ ...p, noticePeriodRequiredDays: val }));
                        }}
                        style={{ width: '100%', height: 38, borderRadius: 6, border: '1px solid #cbd5e1', padding: '0 10px', fontSize: '13px' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', color: '#475569', marginBottom: 4 }}>
                        Notice Actually Served (Days)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={formData.noticePeriodServedDays}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setFormData((p) => recomputeFinancials({ ...p, noticePeriodServedDays: val }));
                        }}
                        style={{ width: '100%', height: 38, borderRadius: 6, border: '1px solid #cbd5e1', padding: '0 10px', fontSize: '13px' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', color: '#475569', marginBottom: 4 }}>
                        Shortfall Notice Days (Recovery)
                      </label>
                      <div style={{
                        height: 38,
                        display: 'flex',
                        alignItems: 'center',
                        padding: '0 12px',
                        background: formData.noticeShortfallDays > 0 ? '#fef2f2' : '#f0fdf4',
                        border: `1px solid ${formData.noticeShortfallDays > 0 ? '#fca5a5' : '#bbf7d0'}`,
                        borderRadius: 6,
                        fontWeight: 700,
                        color: formData.noticeShortfallDays > 0 ? '#b91c1c' : '#15803d',
                        fontSize: '13px'
                      }}>
                        {formData.noticeShortfallDays} days shortfall {formData.noticeShortfallDays > 0 ? `(-${formatINR(formData.deductions.noticeRecovery)})` : '(No deduction)'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Handover Remarks */}
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                    Exit Initiation &amp; Post Handover Remarks
                  </label>
                  <textarea
                    rows={3}
                    value={formData.remarks}
                    onChange={(e) => setFormData((p) => ({ ...p, remarks: e.target.value }))}
                    placeholder="e.g. Guard post handover complete. ID card surrendered. Replacement guard deployed for DLF CyberCity..."
                    style={{ width: '100%', borderRadius: 8, border: '1px solid #cbd5e1', padding: '10px 12px', fontSize: '13px' }}
                  />
                </div>
              </div>
            )}

            {/* TAB 2: 6-DEPARTMENT CLEARANCES & ATTENDANCE */}
            {activeTab === 'clearance_attendance' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {/* 6-Department Clearance Table */}
                <div style={{ border: '1px solid #e2e8f0', borderRadius: 10, overflow: 'hidden' }}>
                  <div style={{ padding: '12px 18px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>
                        Step 3: 6-Department No-Dues Clearance Checklist
                      </span>
                      <span style={{ fontSize: '12px', color: '#64748b', display: 'block', marginTop: 2 }}>
                        All 6 departments must clear before final payout approval
                      </span>
                    </div>
                    <span style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      padding: '3px 9px',
                      borderRadius: 14,
                      background: '#ecfdf5',
                      color: '#059669',
                      border: '1px solid #a7f3d0'
                    }}>
                      6 Departments Required
                    </span>
                  </div>

                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', fontSize: '12.5px', borderCollapse: 'collapse' }}>
                      <thead style={{ background: '#f1f5f9', color: '#475569', textAlign: 'left' }}>
                        <tr>
                          <th style={{ padding: '10px 14px', width: '220px' }}>Department</th>
                          <th style={{ padding: '10px 14px' }}>Clearance Scope / Requirements</th>
                          <th style={{ padding: '10px 14px', width: '140px' }}>Status</th>
                          <th style={{ padding: '10px 14px', width: '200px' }}>Sign-off Officer</th>
                          <th style={{ padding: '10px 14px', width: '240px' }}>Remarks / Voucher Ref</th>
                        </tr>
                      </thead>
                      <tbody>
                        {CLEARANCE_DEPARTMENTS.map((dept) => {
                          const clr = formData.clearances[dept.key] || { status: 'Pending', clearedBy: '', remarks: '' };
                          const isCleared = clr.status === 'Cleared' || clr.status === 'Waived';
                          return (
                            <tr key={dept.key} style={{ borderBottom: '1px solid #f1f5f9' }}>
                              <td style={{ padding: '10px 14px', fontWeight: 600, color: '#0f172a' }}>
                                {dept.name}
                              </td>
                              <td style={{ padding: '10px 14px', color: '#64748b', fontSize: '12px' }}>
                                {dept.description}
                              </td>
                              <td style={{ padding: '10px 14px' }}>
                                <select
                                  value={clr.status}
                                  onChange={(e) => handleClearanceChange(dept.key, 'status', e.target.value)}
                                  style={{
                                    height: 32,
                                    borderRadius: 6,
                                    border: `1px solid ${isCleared ? '#86efac' : '#fde68a'}`,
                                    background: isCleared ? '#f0fdf4' : '#fffbeb',
                                    color: isCleared ? '#166534' : '#b45309',
                                    fontWeight: 700,
                                    fontSize: '12px',
                                    padding: '0 8px'
                                  }}
                                >
                                  <option value="Cleared">Cleared</option>
                                  <option value="Pending">Pending</option>
                                  <option value="Waived">Waived</option>
                                </select>
                              </td>
                              <td style={{ padding: '10px 14px' }}>
                                <input
                                  type="text"
                                  value={clr.clearedBy}
                                  onChange={(e) => handleClearanceChange(dept.key, 'clearedBy', e.target.value)}
                                  placeholder="Signee officer name"
                                  style={{ width: '100%', height: 32, borderRadius: 5, border: '1px solid #cbd5e1', padding: '0 8px', fontSize: '12px' }}
                                />
                              </td>
                              <td style={{ padding: '10px 14px' }}>
                                <input
                                  type="text"
                                  value={clr.remarks}
                                  onChange={(e) => handleClearanceChange(dept.key, 'remarks', e.target.value)}
                                  placeholder="Inspection notes"
                                  style={{ width: '100%', height: 32, borderRadius: 5, border: '1px solid #cbd5e1', padding: '0 8px', fontSize: '12px' }}
                                />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Step 4: Attendance Verification */}
                <div style={{ background: '#f8fafc', padding: 18, borderRadius: 10, border: '1px solid #e2e8f0' }}>
                  <span style={{ fontSize: '12.5px', fontWeight: 700, color: '#0f172a', textTransform: 'uppercase', display: 'block', marginBottom: 12 }}>
                    Step 4: Attendance &amp; Leave Verification (Exit Month)
                  </span>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 14 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', color: '#475569', marginBottom: 4 }}>
                        Present Days
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="31"
                        value={formData.attendance.presentDays}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setFormData((p) => {
                            const updated = { ...p, attendance: { ...p.attendance, presentDays: val } };
                            return recomputeFinancials(updated);
                          });
                        }}
                        style={{ width: '100%', height: 38, borderRadius: 6, border: '1px solid #cbd5e1', padding: '0 10px', fontSize: '13px' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', color: '#475569', marginBottom: 4 }}>
                        Absent Days
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={formData.attendance.absentDays}
                        onChange={(e) => setFormData((p) => ({ ...p, attendance: { ...p.attendance, absentDays: Number(e.target.value) } }))}
                        style={{ width: '100%', height: 38, borderRadius: 6, border: '1px solid #cbd5e1', padding: '0 10px', fontSize: '13px' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', color: '#475569', marginBottom: 4 }}>
                        Overtime (Hours)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={formData.attendance.overtimeHours}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setFormData((p) => {
                            const updated = { ...p, attendance: { ...p.attendance, overtimeHours: val } };
                            return recomputeFinancials(updated);
                          });
                        }}
                        style={{ width: '100%', height: 38, borderRadius: 6, border: '1px solid #cbd5e1', padding: '0 10px', fontSize: '13px' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', color: '#475569', marginBottom: 4 }}>
                        Weekly Offs
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={formData.attendance.weeklyOffs}
                        onChange={(e) => setFormData((p) => ({ ...p, attendance: { ...p.attendance, weeklyOffs: Number(e.target.value) } }))}
                        style={{ width: '100%', height: 38, borderRadius: 6, border: '1px solid #cbd5e1', padding: '0 10px', fontSize: '13px' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', color: '#475569', marginBottom: 4 }}>
                        Holidays
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={formData.attendance.holidays}
                        onChange={(e) => setFormData((p) => ({ ...p, attendance: { ...p.attendance, holidays: Number(e.target.value) } }))}
                        style={{ width: '100%', height: 38, borderRadius: 6, border: '1px solid #cbd5e1', padding: '0 10px', fontSize: '13px' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', color: '#475569', marginBottom: 4 }}>
                        EL Leave Balance (Days)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={formData.attendance.leaveBalance}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setFormData((p) => {
                            const updated = { ...p, attendance: { ...p.attendance, leaveBalance: val } };
                            return recomputeFinancials(updated);
                          });
                        }}
                        style={{ width: '100%', height: 38, borderRadius: 6, border: '1px solid #cbd5e1', padding: '0 10px', fontSize: '13px' }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: EARNINGS, DEDUCTIONS, STATUTORY & LIVE NET PAYABLE */}
            {activeTab === 'finances' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {/* Step 5: Earnings */}
                <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: 18 }}>
                  <span style={{ fontSize: '12.5px', fontWeight: 700, color: '#166534', textTransform: 'uppercase', display: 'block', marginBottom: 12 }}>
                    Step 5: Salary &amp; Arrear Accruals (Payable)
                  </span>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', color: '#166534', marginBottom: 4 }}>
                        Pending Salary (₹)
                      </label>
                      <input
                        type="number"
                        value={formData.salaryDues.pendingSalary}
                        onChange={(e) => setFormData((p) => ({ ...p, salaryDues: { ...p.salaryDues, pendingSalary: Number(e.target.value) } }))}
                        style={{ width: '100%', height: 38, borderRadius: 6, border: '1px solid #86efac', padding: '0 10px', fontSize: '13px' }}
                      />
                      <span style={{ fontSize: '11px', color: '#15803d', marginTop: 2, display: 'block' }}>
                        {formData.attendance.presentDays} days earned
                      </span>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', color: '#166534', marginBottom: 4 }}>
                        Overtime Pay (₹)
                      </label>
                      <input
                        type="number"
                        value={formData.salaryDues.overtimePay}
                        onChange={(e) => setFormData((p) => ({ ...p, salaryDues: { ...p.salaryDues, overtimePay: Number(e.target.value) } }))}
                        style={{ width: '100%', height: 38, borderRadius: 6, border: '1px solid #86efac', padding: '0 10px', fontSize: '13px' }}
                      />
                      <span style={{ fontSize: '11px', color: '#15803d', marginTop: 2, display: 'block' }}>
                        {formData.attendance.overtimeHours} hrs OT
                      </span>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', color: '#166534', marginBottom: 4 }}>
                        Incentives (₹)
                      </label>
                      <input
                        type="number"
                        value={formData.salaryDues.incentives}
                        onChange={(e) => setFormData((p) => ({ ...p, salaryDues: { ...p.salaryDues, incentives: Number(e.target.value) } }))}
                        style={{ width: '100%', height: 38, borderRadius: 6, border: '1px solid #86efac', padding: '0 10px', fontSize: '13px' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', color: '#166534', marginBottom: 4 }}>
                        Arrears (₹)
                      </label>
                      <input
                        type="number"
                        value={formData.salaryDues.arrears}
                        onChange={(e) => setFormData((p) => ({ ...p, salaryDues: { ...p.salaryDues, arrears: Number(e.target.value) } }))}
                        style={{ width: '100%', height: 38, borderRadius: 6, border: '1px solid #86efac', padding: '0 10px', fontSize: '13px' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', color: '#166534', marginBottom: 4 }}>
                        Bonus / Ex-Gratia (₹)
                      </label>
                      <input
                        type="number"
                        value={formData.salaryDues.bonus}
                        onChange={(e) => setFormData((p) => ({ ...p, salaryDues: { ...p.salaryDues, bonus: Number(e.target.value) } }))}
                        style={{ width: '100%', height: 38, borderRadius: 6, border: '1px solid #86efac', padding: '0 10px', fontSize: '13px' }}
                      />
                    </div>
                  </div>
                </div>

                {/* Step 6: Deductions */}
                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: 18 }}>
                  <span style={{ fontSize: '12.5px', fontWeight: 700, color: '#991b1b', textTransform: 'uppercase', display: 'block', marginBottom: 12 }}>
                    Step 6: Authorized Recoveries &amp; Deductions
                  </span>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', color: '#991b1b', marginBottom: 4 }}>
                        Notice Shortfall Pay (₹)
                      </label>
                      <input
                        type="number"
                        value={formData.deductions.noticeRecovery}
                        onChange={(e) => setFormData((p) => ({ ...p, deductions: { ...p.deductions, noticeRecovery: Number(e.target.value) } }))}
                        style={{ width: '100%', height: 38, borderRadius: 6, border: '1px solid #fca5a5', padding: '0 10px', fontSize: '13px' }}
                      />
                      <span style={{ fontSize: '11px', color: '#991b1b', marginTop: 2, display: 'block' }}>
                        {formData.noticeShortfallDays} days shortfall
                      </span>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', color: '#991b1b', marginBottom: 4 }}>
                        Advance Recovery (₹)
                      </label>
                      <input
                        type="number"
                        value={formData.deductions.advanceRecovery}
                        onChange={(e) => setFormData((p) => ({ ...p, deductions: { ...p.deductions, advanceRecovery: Number(e.target.value) } }))}
                        style={{ width: '100%', height: 38, borderRadius: 6, border: '1px solid #fca5a5', padding: '0 10px', fontSize: '13px' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', color: '#991b1b', marginBottom: 4 }}>
                        Loan Outstanding (₹)
                      </label>
                      <input
                        type="number"
                        value={formData.deductions.loanRecovery}
                        onChange={(e) => setFormData((p) => ({ ...p, deductions: { ...p.deductions, loanRecovery: Number(e.target.value) } }))}
                        style={{ width: '100%', height: 38, borderRadius: 6, border: '1px solid #fca5a5', padding: '0 10px', fontSize: '13px' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', color: '#991b1b', marginBottom: 4 }}>
                        Uniform / Kit Penalty (₹)
                      </label>
                      <input
                        type="number"
                        value={formData.deductions.uniformPenalty}
                        onChange={(e) => setFormData((p) => ({ ...p, deductions: { ...p.deductions, uniformPenalty: Number(e.target.value) } }))}
                        style={{ width: '100%', height: 38, borderRadius: 6, border: '1px solid #fca5a5', padding: '0 10px', fontSize: '13px' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', color: '#991b1b', marginBottom: 4 }}>
                        Other Recoveries (₹)
                      </label>
                      <input
                        type="number"
                        value={formData.deductions.otherDeductions}
                        onChange={(e) => setFormData((p) => ({ ...p, deductions: { ...p.deductions, otherDeductions: Number(e.target.value) } }))}
                        style={{ width: '100%', height: 38, borderRadius: 6, border: '1px solid #fca5a5', padding: '0 10px', fontSize: '13px' }}
                      />
                    </div>
                  </div>
                </div>

                {/* Step 7: Statutory Benefits */}
                <div style={{ background: '#f5f3ff', border: '1px solid #ddd6fe', borderRadius: 10, padding: 18 }}>
                  <span style={{ fontSize: '12.5px', fontWeight: 700, color: '#6d28d9', textTransform: 'uppercase', display: 'block', marginBottom: 12 }}>
                    Step 7: Statutory Dues &amp; Terminal Benefits
                  </span>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', color: '#6d28d9', marginBottom: 4 }}>
                        Leave Encashment (₹)
                      </label>
                      <input
                        type="number"
                        value={formData.statutoryBenefits.leaveEncashment}
                        onChange={(e) => setFormData((p) => ({ ...p, statutoryBenefits: { ...p.statutoryBenefits, leaveEncashment: Number(e.target.value) } }))}
                        style={{ width: '100%', height: 38, borderRadius: 6, border: '1px solid #c4b5fd', padding: '0 10px', fontSize: '13px' }}
                      />
                      <span style={{ fontSize: '11px', color: '#6d28d9', marginTop: 2, display: 'block' }}>
                        {formData.attendance.leaveBalance} EL days encashed
                      </span>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', color: '#6d28d9', marginBottom: 4 }}>
                        Gratuity Benefit (₹)
                      </label>
                      <input
                        type="number"
                        value={formData.statutoryBenefits.gratuityAmount}
                        onChange={(e) => setFormData((p) => ({ ...p, statutoryBenefits: { ...p.statutoryBenefits, gratuityAmount: Number(e.target.value) } }))}
                        style={{ width: '100%', height: 38, borderRadius: 6, border: '1px solid #c4b5fd', padding: '0 10px', fontSize: '13px' }}
                      />
                      <span style={{ fontSize: '11px', color: '#6d28d9', marginTop: 2, display: 'block' }}>
                        {formData.tenureYears >= 5 ? `Eligible (${formData.tenureYears} yrs service)` : 'Tenure < 5 yrs (N/A)'}
                      </span>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', color: '#6d28d9', marginBottom: 4 }}>
                        Exit Month Employee PF (₹)
                      </label>
                      <input
                        type="number"
                        value={formData.statutoryBenefits.employeePf}
                        onChange={(e) => setFormData((p) => ({ ...p, statutoryBenefits: { ...p.statutoryBenefits, employeePf: Number(e.target.value) } }))}
                        style={{ width: '100%', height: 38, borderRadius: 6, border: '1px solid #c4b5fd', padding: '0 10px', fontSize: '13px' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', color: '#6d28d9', marginBottom: 4 }}>
                        Exit Month Employee ESI (₹)
                      </label>
                      <input
                        type="number"
                        value={formData.statutoryBenefits.employeeEsi}
                        onChange={(e) => setFormData((p) => ({ ...p, statutoryBenefits: { ...p.statutoryBenefits, employeeEsi: Number(e.target.value) } }))}
                        style={{ width: '100%', height: 38, borderRadius: 6, border: '1px solid #c4b5fd', padding: '0 10px', fontSize: '13px' }}
                      />
                    </div>
                  </div>
                </div>

                {/* Step 8: Live Net Payable Box */}
                <div style={{
                  background: 'linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 100%)',
                  border: '2px solid #059669',
                  borderRadius: 12,
                  padding: '20px 24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  boxShadow: '0 4px 12px rgba(5,150,105,0.08)'
                }}>
                  <div>
                    <span style={{ fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#047857' }}>
                      Step 8: Final Net Settlement Amount Payable (Total Earnings - Deductions)
                    </span>
                    <div style={{ fontSize: '32px', fontWeight: 900, color: '#065f46', marginTop: 4 }}>
                      {formatINR(netPayable)}
                    </div>
                    <div style={{ fontSize: '13.5px', color: '#047857', marginTop: 4, fontWeight: 600 }}>
                      Amount in Words: <em>{inWordsINR(netPayable)}</em>
                    </div>
                    <div style={{ fontSize: '12.5px', color: '#065f46', marginTop: 4 }}>
                      Total Earnings: <strong>{formatINR(totalEarnings)}</strong> | Total Deductions: <strong style={{ color: '#dc2626' }}>{formatINR(totalDeductions)}</strong>
                    </div>
                  </div>
                  <div style={{
                    width: 58,
                    height: 58,
                    borderRadius: '50%',
                    background: '#d1fae5',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#059669'
                  }}>
                    <IndianRupee size={32} />
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: APPROVALS & PAYMENT SETUP */}
            {activeTab === 'approvals_payout' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {/* Step 9: 4-Tier Approval Workflow */}
                <div style={{ border: '1px solid #e2e8f0', borderRadius: 10, padding: 18, background: '#f8fafc' }}>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', textTransform: 'uppercase', display: 'block', marginBottom: 12 }}>
                    Step 9: 4-Tier Approval Workflow Setup
                  </span>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
                    {APPROVAL_STAGES.map((st, i) => (
                      <div key={st.id} style={{ background: '#ffffff', padding: 14, borderRadius: 8, border: '1px solid #cbd5e1' }}>
                        <div style={{ fontSize: '11px', fontWeight: 700, color: '#2563eb' }}>Stage {i + 1}</div>
                        <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#0f172a', marginTop: 3 }}>{st.label}</div>
                        <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: 2 }}>{st.role}</div>
                        <div style={{ marginTop: 8, fontSize: '11px', color: '#b45309', fontWeight: 600 }}>
                          ⏳ Queued on save
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Step 10: Payment Processing Setup */}
                <div style={{ background: '#ffffff', padding: 18, borderRadius: 10, border: '1px solid #e2e8f0' }}>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', textTransform: 'uppercase', display: 'block', marginBottom: 12 }}>
                    Step 10: Payment Processing Mode &amp; Account Details
                  </span>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', color: '#475569', marginBottom: 4 }}>
                        Disbursement Mode
                      </label>
                      <select
                        value={formData.payment.mode}
                        onChange={(e) => setFormData((p) => ({ ...p, payment: { ...p.payment, mode: e.target.value } }))}
                        style={{ width: '100%', height: 38, borderRadius: 6, border: '1px solid #cbd5e1', padding: '0 10px', fontSize: '13px' }}
                      >
                        <option value="Bank Transfer (NEFT)">Bank Transfer (NEFT)</option>
                        <option value="Bank Transfer (RTGS)">Bank Transfer (RTGS)</option>
                        <option value="Company Cheque">Company Cheque</option>
                        <option value="Cash Voucher">Cash Voucher</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', color: '#475569', marginBottom: 4 }}>
                        Target Payout Date
                      </label>
                      <input
                        type="date"
                        value={formData.payment.paymentDate}
                        onChange={(e) => setFormData((p) => ({ ...p, payment: { ...p.payment, paymentDate: e.target.value } }))}
                        style={{ width: '100%', height: 38, borderRadius: 6, border: '1px solid #cbd5e1', padding: '0 10px', fontSize: '13px' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', color: '#475569', marginBottom: 4 }}>
                        Bank Name
                      </label>
                      <input
                        type="text"
                        value={formData.payment.bankName}
                        onChange={(e) => setFormData((p) => ({ ...p, payment: { ...p.payment, bankName: e.target.value } }))}
                        placeholder="e.g. HDFC Bank"
                        style={{ width: '100%', height: 38, borderRadius: 6, border: '1px solid #cbd5e1', padding: '0 10px', fontSize: '13px' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', color: '#475569', marginBottom: 4 }}>
                        Account Number
                      </label>
                      <input
                        type="text"
                        value={formData.payment.accountNo}
                        onChange={(e) => setFormData((p) => ({ ...p, payment: { ...p.payment, accountNo: e.target.value } }))}
                        style={{ width: '100%', height: 38, borderRadius: 6, border: '1px solid #cbd5e1', padding: '0 10px', fontSize: '13px' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', color: '#475569', marginBottom: 4 }}>
                        IFSC Code
                      </label>
                      <input
                        type="text"
                        value={formData.payment.ifsc}
                        onChange={(e) => setFormData((p) => ({ ...p, payment: { ...p.payment, ifsc: e.target.value } }))}
                        style={{ width: '100%', height: 38, borderRadius: 6, border: '1px solid #cbd5e1', padding: '0 10px', fontSize: '13px' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', color: '#475569', marginBottom: 4 }}>
                        Net Payable Payout
                      </label>
                      <div style={{
                        height: 38,
                        display: 'flex',
                        alignItems: 'center',
                        padding: '0 12px',
                        background: '#ecfdf5',
                        borderRadius: 6,
                        border: '1px solid #a7f3d0',
                        fontWeight: 800,
                        color: '#065f46',
                        fontSize: '14px'
                      }}>
                        {formatINR(netPayable)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Step 11: Final Documents */}
                <div style={{ background: '#f8fafc', padding: 18, borderRadius: 10, border: '1px solid #e2e8f0' }}>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', textTransform: 'uppercase', display: 'block', marginBottom: 10 }}>
                    Step 11: Final Documents &amp; Closure Artifacts
                  </span>
                  <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '13px', color: '#1e293b', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={formData.documents.fnfStatementGenerated}
                        onChange={(e) => setFormData((p) => ({ ...p, documents: { ...p.documents, fnfStatementGenerated: e.target.checked } }))}
                      />
                      Generate F&amp;F Statement Voucher
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '13px', color: '#1e293b', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={formData.documents.relievingLetterGenerated}
                        onChange={(e) => setFormData((p) => ({ ...p, documents: { ...p.documents, relievingLetterGenerated: e.target.checked } }))}
                      />
                      Prepare Relieving &amp; Service Letter
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '13px', color: '#1e293b', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={formData.documents.exitPayslipGenerated}
                        onChange={(e) => setFormData((p) => ({ ...p, documents: { ...p.documents, exitPayslipGenerated: e.target.checked } }))}
                      />
                      Generate Exit Month Final Payslip
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Step Controls Footer */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingTop: 16,
              borderTop: '1px solid #e2e8f0',
              marginTop: 10
            }}>
              <button
                type="button"
                onClick={() => navigate(`${basePath}?tab=fnf`)}
                style={{ padding: '9px 18px', borderRadius: 6, border: '1px solid #cbd5e1', background: '#ffffff', cursor: 'pointer', fontSize: '13.5px' }}
              >
                Cancel
              </button>

              <div style={{ display: 'flex', gap: 12 }}>
                {activeTab !== 'exit_details' && (
                  <button
                    type="button"
                    onClick={() => {
                      const tabs = ['exit_details', 'clearance_attendance', 'finances', 'approvals_payout'];
                      const currIdx = tabs.indexOf(activeTab);
                      if (currIdx > 0) setActiveTab(tabs[currIdx - 1]);
                    }}
                    style={{
                      padding: '9px 18px',
                      borderRadius: 6,
                      border: '1px solid #cbd5e1',
                      background: '#ffffff',
                      cursor: 'pointer',
                      fontSize: '13.5px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6
                    }}
                  >
                    <ArrowLeft size={15} /> Previous Step
                  </button>
                )}

                {activeTab !== 'approvals_payout' ? (
                  <button
                    type="button"
                    onClick={() => {
                      const tabs = ['exit_details', 'clearance_attendance', 'finances', 'approvals_payout'];
                      const currIdx = tabs.indexOf(activeTab);
                      if (currIdx < tabs.length - 1) setActiveTab(tabs[currIdx + 1]);
                    }}
                    style={{
                      padding: '9px 20px',
                      borderRadius: 6,
                      border: 'none',
                      background: '#2563eb',
                      color: '#ffffff',
                      fontWeight: 600,
                      cursor: 'pointer',
                      fontSize: '13.5px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6
                    }}
                  >
                    Next Step <ArrowRight size={15} />
                  </button>
                ) : (
                  <button
                    type="submit"
                    style={{
                      padding: '9px 24px',
                      borderRadius: 6,
                      border: 'none',
                      background: '#059669',
                      color: '#ffffff',
                      fontWeight: 700,
                      cursor: 'pointer',
                      fontSize: '13.5px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      boxShadow: '0 2px 4px rgba(5,150,105,0.2)'
                    }}
                  >
                    <Check size={16} /> Save &amp; Initiate Settlement
                  </button>
                )}
              </div>
            </div>

          </form>
        </div>
      </div>
    </LayoutComponent>
  );
}

