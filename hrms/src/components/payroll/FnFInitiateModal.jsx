import React, { useState, useEffect } from 'react';
import {
  X,
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
  Check
} from 'lucide-react';
import styles from './FnFInitiateModal.module.css';
import {
  EXIT_TYPES,
  SEPARATION_REASONS,
  CLEARANCE_DEPARTMENTS,
  APPROVAL_STAGES
} from '../../data/fnfData';

const formatINR = (val) => `₹${Number(val || 0).toLocaleString('en-IN')}`;

export default function FnFInitiateModal({
  isOpen,
  onClose,
  employees = [],
  onSave
}) {
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

    // Initial default days
    const presentDays = 15;
    const leaveBalance = 6;
    const pendingSalary = Math.round(presentDays * dailyWage);
    const leaveEncashment = Math.round(leaveBalance * dailyWage);

    // Gratuity calculation: (15 * basic / 26) * tenureYears (if tenure >= 5)
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

    // OT pay
    const otHrs = Number(updated.attendance.overtimeHours || 0);
    const hourlyWage = Math.round((dailyWage / 8) * 100) / 100;
    updated.salaryDues.overtimePay = Math.round(otHrs * (hourlyWage * 2)); // Double OT rate standard

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

  // Submit Handler
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.employeeName) {
      alert('Please select an employee.');
      setActiveTab('exit_details');
      return;
    }

    // Determine initial settlement status
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
      // Backward compatibility fields
      totalEarnings,
      totalDeductions,
      netSettlementAmount: netPayable,
      settlementStatus: initialStatus
    };

    onSave(newRecord);
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(15, 23, 42, 0.7)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1050,
      padding: '16px'
    }}>
      <div style={{
        background: '#ffffff',
        borderRadius: '14px',
        width: '100%',
        maxWidth: '860px',
        maxHeight: '92vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          padding: '18px 24px',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#ffffff'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>
                Initiate Full &amp; Final (FnF) Settlement
              </h2>
              <span style={{
                background: '#eff6ff',
                color: '#1d4ed8',
                fontSize: '11px',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: 12,
                border: '1px solid #bfdbfe'
              }}>
                11-Step Lifecycle
              </span>
            </div>
            <p style={{ margin: '3px 0 0', fontSize: '12.5px', color: '#64748b' }}>
              Complete exit initiation, 6-dept clearances, attendance dues, statutory recoveries and settlement voucher
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 4 }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid #e2e8f0',
          background: '#f8fafc',
          padding: '0 16px'
        }}>
          {[
            { id: 'exit_details', label: '1. Exit & Notice Details' },
            { id: 'clearance_attendance', label: '2. 6-Dept Clearances & Attendance' },
            { id: 'finances', label: '3. Earnings, Deductions & Net' },
            { id: 'approvals_payout', label: '4. Approvals & Payment Setup' }
          ].map((t) => {
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTab(t.id)}
                style={{
                  padding: '12px 16px',
                  border: 'none',
                  borderBottom: isActive ? '2px solid #2563eb' : '2px solid transparent',
                  background: 'none',
                  fontSize: '12.5px',
                  fontWeight: isActive ? 700 : 500,
                  color: isActive ? '#2563eb' : '#64748b',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}>

          {/* TAB 1: EXIT INITIATION & NOTICE DETAILS */}
          {activeTab === 'exit_details' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Employee Selection */}
              <div style={{ background: '#f8fafc', padding: 14, borderRadius: 8, border: '1px solid #e2e8f0' }}>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#0f172a', marginBottom: 6 }}>
                  Select Separating Employee <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <select
                  value={selectedEmpId}
                  onChange={handleEmployeeChange}
                  required
                  style={{
                    width: '100%',
                    height: 38,
                    borderRadius: 6,
                    border: '1px solid #cbd5e1',
                    padding: '0 10px',
                    fontSize: '13px',
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
                        {name} {code ? `(${code})` : ''} — {emp.designation || 'Staff'} ({emp.clientName || 'Main'})
                      </option>
                    );
                  })}
                </select>

                {formData.employeeName && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginTop: 12, padding: '10px 12px', background: '#ffffff', borderRadius: 6, border: '1px solid #e2e8f0', fontSize: '11.5px' }}>
                    <div><span style={{ color: '#64748b' }}>Role:</span> <strong style={{ color: '#0f172a' }}>{formData.designation}</strong></div>
                    <div><span style={{ color: '#64748b' }}>Client:</span> <strong style={{ color: '#2563eb' }}>{formData.client}</strong></div>
                    <div><span style={{ color: '#64748b' }}>Tenure:</span> <strong style={{ color: '#0f172a' }}>{formData.tenureYears} yrs</strong></div>
                    <div><span style={{ color: '#64748b' }}>Gross/Wage:</span> <strong style={{ color: '#16a34a' }}>{formatINR(formData.monthlyGrossSalary)}/mo ({formatINR(formData.perDayWage)}/d)</strong></div>
                  </div>
                )}
              </div>

              {/* Step 1 & 2 Inputs: Exit Type, Dates, Notice */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
                {/* Exit Type */}
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: 4 }}>
                    Step 1: Exit Type / Separation Mode <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <select
                    value={formData.exitType}
                    onChange={(e) => setFormData((p) => ({ ...p, exitType: e.target.value }))}
                    style={{ width: '100%', height: 36, borderRadius: 6, border: '1px solid #cbd5e1', padding: '0 8px', fontSize: '12.5px' }}
                  >
                    {EXIT_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                {/* Separation Reason */}
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: 4 }}>
                    Separation Reason <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <select
                    value={formData.separationReason}
                    onChange={(e) => setFormData((p) => ({ ...p, separationReason: e.target.value }))}
                    style={{ width: '100%', height: 36, borderRadius: 6, border: '1px solid #cbd5e1', padding: '0 8px', fontSize: '12px' }}
                  >
                    {SEPARATION_REASONS.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>

                {/* Resignation Date */}
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: 4 }}>
                    Resignation / Notice Tender Date <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.resignationDate}
                    onChange={(e) => setFormData((p) => ({ ...p, resignationDate: e.target.value }))}
                    style={{ width: '100%', height: 36, borderRadius: 6, border: '1px solid #cbd5e1', padding: '0 8px', fontSize: '12.5px' }}
                  />
                </div>

                {/* Last Working Day (LWD) */}
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: 4 }}>
                    Last Working Day (LWD) <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.lastWorkingDay}
                    onChange={(e) => setFormData((p) => ({ ...p, lastWorkingDay: e.target.value }))}
                    style={{ width: '100%', height: 36, borderRadius: 6, border: '1px solid #cbd5e1', padding: '0 8px', fontSize: '12.5px' }}
                  />
                </div>
              </div>

              {/* Notice Period Details & Shortfall */}
              <div style={{ background: '#f8fafc', padding: 14, borderRadius: 8, border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#334155', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>
                  Notice Period Compliance &amp; Shortfall
                </span>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11.5px', color: '#64748b', marginBottom: 3 }}>
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
                      style={{ width: '100%', height: 34, borderRadius: 6, border: '1px solid #cbd5e1', padding: '0 8px', fontSize: '12.5px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11.5px', color: '#64748b', marginBottom: 3 }}>
                      Notice Served (Days)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.noticePeriodServedDays}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setFormData((p) => recomputeFinancials({ ...p, noticePeriodServedDays: val }));
                      }}
                      style={{ width: '100%', height: 34, borderRadius: 6, border: '1px solid #cbd5e1', padding: '0 8px', fontSize: '12.5px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11.5px', color: '#64748b', marginBottom: 3 }}>
                      Shortfall Days (Auto Notice Recovery)
                    </label>
                    <div style={{
                      height: 34,
                      display: 'flex',
                      alignItems: 'center',
                      padding: '0 10px',
                      background: formData.noticeShortfallDays > 0 ? '#fef2f2' : '#f0fdf4',
                      border: `1px solid ${formData.noticeShortfallDays > 0 ? '#fca5a5' : '#bbf7d0'}`,
                      borderRadius: 6,
                      fontWeight: 700,
                      color: formData.noticeShortfallDays > 0 ? '#b91c1c' : '#15803d',
                      fontSize: '12.5px'
                    }}>
                      {formData.noticeShortfallDays} days {formData.noticeShortfallDays > 0 ? `(-${formatINR(formData.deductions.noticeRecovery)})` : '(No deduction)'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Remarks */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: 4 }}>
                  Exit Initiation Remarks / Handover Notes
                </label>
                <textarea
                  rows={2}
                  value={formData.remarks}
                  onChange={(e) => setFormData((p) => ({ ...p, remarks: e.target.value }))}
                  placeholder="e.g. Guard post handover underway. ID card surrendered. Replacement guard assigned for DLF site."
                  style={{ width: '100%', borderRadius: 6, border: '1px solid #cbd5e1', padding: '8px', fontSize: '12.5px' }}
                />
              </div>
            </div>
          )}

          {/* TAB 2: 6-DEPARTMENT CLEARANCES & ATTENDANCE VERIFICATION */}
          {activeTab === 'clearance_attendance' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Step 3: 6-Department Clearances Table */}
              <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, overflow: 'hidden' }}>
                <div style={{ padding: '10px 14px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '12.5px', fontWeight: 700, color: '#0f172a' }}>
                    Step 3: 6-Department No-Dues &amp; Clearance Sign-offs
                  </span>
                  <span style={{ fontSize: '11px', color: '#64748b' }}>All 6 departments must clear before final payout</span>
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse' }}>
                    <thead style={{ background: '#f1f5f9', color: '#475569', textAlign: 'left' }}>
                      <tr>
                        <th style={{ padding: '8px 12px' }}>Department</th>
                        <th style={{ padding: '8px 12px' }}>Clearance Scope</th>
                        <th style={{ padding: '8px 12px' }}>Status</th>
                        <th style={{ padding: '8px 12px' }}>Cleared By / Signee</th>
                        <th style={{ padding: '8px 12px' }}>Sign-off Remarks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {CLEARANCE_DEPARTMENTS.map((dept) => {
                        const clr = formData.clearances[dept.key] || { status: 'Pending', clearedBy: '', remarks: '' };
                        return (
                          <tr key={dept.key} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '8px 12px', fontWeight: 600, color: '#0f172a', whiteSpace: 'nowrap' }}>
                              {dept.name}
                            </td>
                            <td style={{ padding: '8px 12px', color: '#64748b', fontSize: '11px' }}>
                              {dept.description}
                            </td>
                            <td style={{ padding: '8px 12px' }}>
                              <select
                                value={clr.status}
                                onChange={(e) => handleClearanceChange(dept.key, 'status', e.target.value)}
                                style={{
                                  height: 30,
                                  borderRadius: 5,
                                  border: `1px solid ${clr.status === 'Cleared' ? '#86efac' : '#fde68a'}`,
                                  background: clr.status === 'Cleared' ? '#f0fdf4' : '#fffbeb',
                                  color: clr.status === 'Cleared' ? '#166534' : '#b45309',
                                  fontWeight: 700,
                                  fontSize: '11px',
                                  padding: '0 6px'
                                }}
                              >
                                <option value="Cleared">Cleared</option>
                                <option value="Pending">Pending</option>
                                <option value="Waived">Waived</option>
                              </select>
                            </td>
                            <td style={{ padding: '8px 12px' }}>
                              <input
                                type="text"
                                value={clr.clearedBy}
                                onChange={(e) => handleClearanceChange(dept.key, 'clearedBy', e.target.value)}
                                placeholder="Approver name"
                                style={{ width: '100%', height: 28, borderRadius: 4, border: '1px solid #cbd5e1', padding: '0 6px', fontSize: '11.5px' }}
                              />
                            </td>
                            <td style={{ padding: '8px 12px' }}>
                              <input
                                type="text"
                                value={clr.remarks}
                                onChange={(e) => handleClearanceChange(dept.key, 'remarks', e.target.value)}
                                placeholder="Remarks / voucher ref"
                                style={{ width: '100%', height: 28, borderRadius: 4, border: '1px solid #cbd5e1', padding: '0 6px', fontSize: '11.5px' }}
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Step 4: Attendance & Leave Verification Grid */}
              <div style={{ background: '#f8fafc', padding: 14, borderRadius: 8, border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '12.5px', fontWeight: 700, color: '#0f172a', textTransform: 'uppercase', display: 'block', marginBottom: 10 }}>
                  Step 4: Attendance &amp; Leave Verification (Exit Month)
                </span>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 10 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', color: '#475569', marginBottom: 3 }}>
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
                      style={{ width: '100%', height: 34, borderRadius: 6, border: '1px solid #cbd5e1', padding: '0 8px', fontSize: '12px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', color: '#475569', marginBottom: 3 }}>
                      Absent Days
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.attendance.absentDays}
                      onChange={(e) => setFormData((p) => ({ ...p, attendance: { ...p.attendance, absentDays: Number(e.target.value) } }))}
                      style={{ width: '100%', height: 34, borderRadius: 6, border: '1px solid #cbd5e1', padding: '0 8px', fontSize: '12px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', color: '#475569', marginBottom: 3 }}>
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
                      style={{ width: '100%', height: 34, borderRadius: 6, border: '1px solid #cbd5e1', padding: '0 8px', fontSize: '12px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', color: '#475569', marginBottom: 3 }}>
                      Weekly Offs
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.attendance.weeklyOffs}
                      onChange={(e) => setFormData((p) => ({ ...p, attendance: { ...p.attendance, weeklyOffs: Number(e.target.value) } }))}
                      style={{ width: '100%', height: 34, borderRadius: 6, border: '1px solid #cbd5e1', padding: '0 8px', fontSize: '12px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', color: '#475569', marginBottom: 3 }}>
                      Holidays
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.attendance.holidays}
                      onChange={(e) => setFormData((p) => ({ ...p, attendance: { ...p.attendance, holidays: Number(e.target.value) } }))}
                      style={{ width: '100%', height: 34, borderRadius: 6, border: '1px solid #cbd5e1', padding: '0 8px', fontSize: '12px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', color: '#475569', marginBottom: 3 }}>
                      Leave Bal (EL Days)
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
                      style={{ width: '100%', height: 34, borderRadius: 6, border: '1px solid #cbd5e1', padding: '0 8px', fontSize: '12px' }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SALARY DUES, DEDUCTIONS, STATUTORY & NET CALCULATION */}
          {activeTab === 'finances' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Step 5: Earnings & Salary Dues */}
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: 14 }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#166534', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>
                  Step 5: Salary &amp; Arrear Accruals (Payable)
                </span>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', color: '#166534', marginBottom: 3 }}>
                      Pending Salary (₹)
                    </label>
                    <input
                      type="number"
                      value={formData.salaryDues.pendingSalary}
                      onChange={(e) => setFormData((p) => ({ ...p, salaryDues: { ...p.salaryDues, pendingSalary: Number(e.target.value) } }))}
                      style={{ width: '100%', height: 34, borderRadius: 6, border: '1px solid #86efac', padding: '0 8px', fontSize: '12px' }}
                    />
                    <span style={{ fontSize: '10px', color: '#15803d' }}>{formData.attendance.presentDays} days earned</span>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', color: '#166534', marginBottom: 3 }}>
                      Overtime Pay (₹)
                    </label>
                    <input
                      type="number"
                      value={formData.salaryDues.overtimePay}
                      onChange={(e) => setFormData((p) => ({ ...p, salaryDues: { ...p.salaryDues, overtimePay: Number(e.target.value) } }))}
                      style={{ width: '100%', height: 34, borderRadius: 6, border: '1px solid #86efac', padding: '0 8px', fontSize: '12px' }}
                    />
                    <span style={{ fontSize: '10px', color: '#15803d' }}>{formData.attendance.overtimeHours} hrs OT</span>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', color: '#166534', marginBottom: 3 }}>
                      Incentives / Allowances (₹)
                    </label>
                    <input
                      type="number"
                      value={formData.salaryDues.incentives}
                      onChange={(e) => setFormData((p) => ({ ...p, salaryDues: { ...p.salaryDues, incentives: Number(e.target.value) } }))}
                      style={{ width: '100%', height: 34, borderRadius: 6, border: '1px solid #86efac', padding: '0 8px', fontSize: '12px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', color: '#166534', marginBottom: 3 }}>
                      Arrears (₹)
                    </label>
                    <input
                      type="number"
                      value={formData.salaryDues.arrears}
                      onChange={(e) => setFormData((p) => ({ ...p, salaryDues: { ...p.salaryDues, arrears: Number(e.target.value) } }))}
                      style={{ width: '100%', height: 34, borderRadius: 6, border: '1px solid #86efac', padding: '0 8px', fontSize: '12px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', color: '#166534', marginBottom: 3 }}>
                      Bonus / Ex-Gratia (₹)
                    </label>
                    <input
                      type="number"
                      value={formData.salaryDues.bonus}
                      onChange={(e) => setFormData((p) => ({ ...p, salaryDues: { ...p.salaryDues, bonus: Number(e.target.value) } }))}
                      style={{ width: '100%', height: 34, borderRadius: 6, border: '1px solid #86efac', padding: '0 8px', fontSize: '12px' }}
                    />
                  </div>
                </div>
              </div>

              {/* Step 6: Deductions & Recoveries */}
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: 14 }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#991b1b', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>
                  Step 6: Authorized Recoveries &amp; Deductions
                </span>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', color: '#991b1b', marginBottom: 3 }}>
                      Notice Pay Recovery (₹)
                    </label>
                    <input
                      type="number"
                      value={formData.deductions.noticeRecovery}
                      onChange={(e) => setFormData((p) => ({ ...p, deductions: { ...p.deductions, noticeRecovery: Number(e.target.value) } }))}
                      style={{ width: '100%', height: 34, borderRadius: 6, border: '1px solid #fca5a5', padding: '0 8px', fontSize: '12px' }}
                    />
                    <span style={{ fontSize: '10px', color: '#991b1b' }}>{formData.noticeShortfallDays} days shortfall</span>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', color: '#991b1b', marginBottom: 3 }}>
                      Advance Recovery (₹)
                    </label>
                    <input
                      type="number"
                      value={formData.deductions.advanceRecovery}
                      onChange={(e) => setFormData((p) => ({ ...p, deductions: { ...p.deductions, advanceRecovery: Number(e.target.value) } }))}
                      style={{ width: '100%', height: 34, borderRadius: 6, border: '1px solid #fca5a5', padding: '0 8px', fontSize: '12px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', color: '#991b1b', marginBottom: 3 }}>
                      Loan Outstanding (₹)
                    </label>
                    <input
                      type="number"
                      value={formData.deductions.loanRecovery}
                      onChange={(e) => setFormData((p) => ({ ...p, deductions: { ...p.deductions, loanRecovery: Number(e.target.value) } }))}
                      style={{ width: '100%', height: 34, borderRadius: 6, border: '1px solid #fca5a5', padding: '0 8px', fontSize: '12px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', color: '#991b1b', marginBottom: 3 }}>
                      Uniform / Asset Penalty (₹)
                    </label>
                    <input
                      type="number"
                      value={formData.deductions.uniformPenalty}
                      onChange={(e) => setFormData((p) => ({ ...p, deductions: { ...p.deductions, uniformPenalty: Number(e.target.value) } }))}
                      style={{ width: '100%', height: 34, borderRadius: 6, border: '1px solid #fca5a5', padding: '0 8px', fontSize: '12px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', color: '#991b1b', marginBottom: 3 }}>
                      Other Deductions (₹)
                    </label>
                    <input
                      type="number"
                      value={formData.deductions.otherDeductions}
                      onChange={(e) => setFormData((p) => ({ ...p, deductions: { ...p.deductions, otherDeductions: Number(e.target.value) } }))}
                      style={{ width: '100%', height: 34, borderRadius: 6, border: '1px solid #fca5a5', padding: '0 8px', fontSize: '12px' }}
                    />
                  </div>
                </div>
              </div>

              {/* Step 7: Statutory Dues & Terminal Benefits */}
              <div style={{ background: '#f5f3ff', border: '1px solid #ddd6fe', borderRadius: 8, padding: 14 }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#6d28d9', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>
                  Step 7: Statutory Dues &amp; Terminal Benefits
                </span>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', color: '#6d28d9', marginBottom: 3 }}>
                      Leave Encashment (₹)
                    </label>
                    <input
                      type="number"
                      value={formData.statutoryBenefits.leaveEncashment}
                      onChange={(e) => setFormData((p) => ({ ...p, statutoryBenefits: { ...p.statutoryBenefits, leaveEncashment: Number(e.target.value) } }))}
                      style={{ width: '100%', height: 34, borderRadius: 6, border: '1px solid #c4b5fd', padding: '0 8px', fontSize: '12px' }}
                    />
                    <span style={{ fontSize: '10px', color: '#6d28d9' }}>{formData.attendance.leaveBalance} EL days encashed</span>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', color: '#6d28d9', marginBottom: 3 }}>
                      Gratuity (₹)
                    </label>
                    <input
                      type="number"
                      value={formData.statutoryBenefits.gratuityAmount}
                      onChange={(e) => setFormData((p) => ({ ...p, statutoryBenefits: { ...p.statutoryBenefits, gratuityAmount: Number(e.target.value) } }))}
                      style={{ width: '100%', height: 34, borderRadius: 6, border: '1px solid #c4b5fd', padding: '0 8px', fontSize: '12px' }}
                    />
                    <span style={{ fontSize: '10px', color: '#6d28d9' }}>
                      {formData.tenureYears >= 5 ? `Eligible (${formData.tenureYears} yrs)` : 'Tenure < 5 yrs (N/A)'}
                    </span>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', color: '#6d28d9', marginBottom: 3 }}>
                      Exit Month PF Deduction (₹)
                    </label>
                    <input
                      type="number"
                      value={formData.statutoryBenefits.employeePf}
                      onChange={(e) => setFormData((p) => ({ ...p, statutoryBenefits: { ...p.statutoryBenefits, employeePf: Number(e.target.value) } }))}
                      style={{ width: '100%', height: 34, borderRadius: 6, border: '1px solid #c4b5fd', padding: '0 8px', fontSize: '12px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', color: '#6d28d9', marginBottom: 3 }}>
                      Exit Month ESI Deduction (₹)
                    </label>
                    <input
                      type="number"
                      value={formData.statutoryBenefits.employeeEsi}
                      onChange={(e) => setFormData((p) => ({ ...p, statutoryBenefits: { ...p.statutoryBenefits, employeeEsi: Number(e.target.value) } }))}
                      style={{ width: '100%', height: 34, borderRadius: 6, border: '1px solid #c4b5fd', padding: '0 8px', fontSize: '12px' }}
                    />
                  </div>
                </div>
              </div>

              {/* Step 8: Final Settlement Live Summary Card */}
              <div style={{
                background: '#ecfdf5',
                border: '2px solid #059669',
                borderRadius: 8,
                padding: '14px 18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div>
                  <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#047857' }}>
                    Step 8: Final Net Settlement Amount (Total Earnings - Deductions)
                  </span>
                  <div style={{ fontSize: '26px', fontWeight: 900, color: '#065f46', marginTop: 2 }}>
                    {formatINR(netPayable)}
                  </div>
                  <div style={{ fontSize: '12px', color: '#047857', marginTop: 3 }}>
                    Total Earnings: <strong>{formatINR(totalEarnings)}</strong> | Total Deductions: <strong style={{ color: '#dc2626' }}>{formatINR(totalDeductions)}</strong>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#059669', background: '#ffffff', padding: '4px 10px', borderRadius: 20, border: '1px solid #a7f3d0' }}>
                    Auto Computed
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: APPROVAL WORKFLOW & PAYMENT SETUP */}
          {activeTab === 'approvals_payout' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Step 9: 4-Stage Approval Chain Preview */}
              <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: 14, background: '#f8fafc' }}>
                <span style={{ fontSize: '12.5px', fontWeight: 700, color: '#0f172a', textTransform: 'uppercase', display: 'block', marginBottom: 10 }}>
                  Step 9: 4-Tier Approval Workflow
                </span>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
                  {APPROVAL_STAGES.map((st, i) => (
                    <div key={st.id} style={{ background: '#ffffff', padding: 10, borderRadius: 6, border: '1px solid #cbd5e1' }}>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: '#2563eb' }}>Stage {i + 1}</div>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a', marginTop: 2 }}>{st.label}</div>
                      <div style={{ fontSize: '10.5px', color: '#64748b', marginTop: 2 }}>{st.role}</div>
                      <div style={{ marginTop: 6, fontSize: '10.5px', color: '#b45309', fontWeight: 600 }}>
                        ⏳ Queued on save
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Step 10: Payment Processing Mode & Bank Details */}
              <div style={{ background: '#ffffff', padding: 14, borderRadius: 8, border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '12.5px', fontWeight: 700, color: '#0f172a', textTransform: 'uppercase', display: 'block', marginBottom: 10 }}>
                  Step 10: Payment Processing Setup
                </span>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11.5px', color: '#475569', marginBottom: 3 }}>
                      Disbursement Mode
                    </label>
                    <select
                      value={formData.payment.mode}
                      onChange={(e) => setFormData((p) => ({ ...p, payment: { ...p.payment, mode: e.target.value } }))}
                      style={{ width: '100%', height: 34, borderRadius: 6, border: '1px solid #cbd5e1', padding: '0 8px', fontSize: '12px' }}
                    >
                      <option value="Bank Transfer (NEFT)">Bank Transfer (NEFT)</option>
                      <option value="Bank Transfer (RTGS)">Bank Transfer (RTGS)</option>
                      <option value="Company Cheque">Company Cheque</option>
                      <option value="Cash Voucher">Cash Voucher</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11.5px', color: '#475569', marginBottom: 3 }}>
                      Target Payout Date
                    </label>
                    <input
                      type="date"
                      value={formData.payment.paymentDate}
                      onChange={(e) => setFormData((p) => ({ ...p, payment: { ...p.payment, paymentDate: e.target.value } }))}
                      style={{ width: '100%', height: 34, borderRadius: 6, border: '1px solid #cbd5e1', padding: '0 8px', fontSize: '12px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11.5px', color: '#475569', marginBottom: 3 }}>
                      Bank Name
                    </label>
                    <input
                      type="text"
                      value={formData.payment.bankName}
                      onChange={(e) => setFormData((p) => ({ ...p, payment: { ...p.payment, bankName: e.target.value } }))}
                      placeholder="e.g. HDFC Bank"
                      style={{ width: '100%', height: 34, borderRadius: 6, border: '1px solid #cbd5e1', padding: '0 8px', fontSize: '12px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11.5px', color: '#475569', marginBottom: 3 }}>
                      Account Number
                    </label>
                    <input
                      type="text"
                      value={formData.payment.accountNo}
                      onChange={(e) => setFormData((p) => ({ ...p, payment: { ...p.payment, accountNo: e.target.value } }))}
                      style={{ width: '100%', height: 34, borderRadius: 6, border: '1px solid #cbd5e1', padding: '0 8px', fontSize: '12px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11.5px', color: '#475569', marginBottom: 3 }}>
                      IFSC Code
                    </label>
                    <input
                      type="text"
                      value={formData.payment.ifsc}
                      onChange={(e) => setFormData((p) => ({ ...p, payment: { ...p.payment, ifsc: e.target.value } }))}
                      style={{ width: '100%', height: 34, borderRadius: 6, border: '1px solid #cbd5e1', padding: '0 8px', fontSize: '12px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11.5px', color: '#475569', marginBottom: 3 }}>
                      Net Payable to Disburse
                    </label>
                    <div style={{ height: 34, display: 'flex', alignItems: 'center', padding: '0 10px', background: '#ecfdf5', borderRadius: 6, border: '1px solid #a7f3d0', fontWeight: 800, color: '#065f46', fontSize: '13px' }}>
                      {formatINR(netPayable)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 11: Final Documents to Auto-Generate */}
              <div style={{ background: '#f8fafc', padding: 14, borderRadius: 8, border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '12.5px', fontWeight: 700, color: '#0f172a', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>
                  Step 11: Final Documents &amp; Closure Artifacts
                </span>
                <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '12.5px', color: '#1e293b', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={formData.documents.fnfStatementGenerated}
                      onChange={(e) => setFormData((p) => ({ ...p, documents: { ...p.documents, fnfStatementGenerated: e.target.checked } }))}
                    />
                    Generate F&amp;F Statement Voucher
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '12.5px', color: '#1e293b', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={formData.documents.relievingLetterGenerated}
                      onChange={(e) => setFormData((p) => ({ ...p, documents: { ...p.documents, relievingLetterGenerated: e.target.checked } }))}
                    />
                    Prepare Relieving &amp; Experience Letter
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '12.5px', color: '#1e293b', cursor: 'pointer' }}>
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

          {/* Modal Footer Controls */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: 12,
            borderTop: '1px solid #e2e8f0',
            marginTop: 'auto'
          }}>
            <button
              type="button"
              onClick={onClose}
              style={{ padding: '8px 16px', borderRadius: 6, border: '1px solid #cbd5e1', background: '#ffffff', cursor: 'pointer', fontSize: '13px' }}
            >
              Cancel
            </button>

            <div style={{ display: 'flex', gap: 10 }}>
              {activeTab !== 'exit_details' && (
                <button
                  type="button"
                  onClick={() => {
                    const tabs = ['exit_details', 'clearance_attendance', 'finances', 'approvals_payout'];
                    const currIdx = tabs.indexOf(activeTab);
                    if (currIdx > 0) setActiveTab(tabs[currIdx - 1]);
                  }}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 6,
                    border: '1px solid #cbd5e1',
                    background: '#ffffff',
                    cursor: 'pointer',
                    fontSize: '13px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6
                  }}
                >
                  <ArrowLeft size={14} /> Back
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
                    padding: '8px 18px',
                    borderRadius: 6,
                    border: 'none',
                    background: '#2563eb',
                    color: '#ffffff',
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontSize: '13px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6
                  }}
                >
                  Next Step <ArrowRight size={14} />
                </button>
              ) : (
                <button
                  type="submit"
                  style={{
                    padding: '8px 22px',
                    borderRadius: 6,
                    border: 'none',
                    background: '#059669',
                    color: '#ffffff',
                    fontWeight: 700,
                    cursor: 'pointer',
                    fontSize: '13px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6
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
  );
}
