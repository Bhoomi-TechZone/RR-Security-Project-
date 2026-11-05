import React, { useState } from 'react';
import {
  Search,
  Plus,
  Download,
  Eye,
  CheckCircle2,
  Clock,
  Printer,
  FileText,
  AlertTriangle,
  X,
  CreditCard,
  Building,
  Check,
  ShieldCheck,
  Coins,
  Sparkles,
  HelpCircle,
  FileCheck2
} from 'lucide-react';
import styles from './LeaveEncashmentTab.module.css';
import {
  ENCASHMENT_STATUSES,
  FINANCIAL_YEARS,
  ENCASHMENT_POLICY_DEFAULTS,
  getStoredEncashments,
  saveStoredEncashments,
  calculateEncashmentAmount
} from '../../data/leaveEncashmentData';

const formatINR = (val) => `₹${Number(val || 0).toLocaleString('en-IN')}`;

export default function LeaveEncashmentTab({
  employees = [],
  onNotify
}) {
  const [encashments, setEncashments] = useState(() => getStoredEncashments());
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [fyFilter, setFyFilter] = useState(FINANCIAL_YEARS[0]);

  // Modal & Drawer State
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // New Encashment Form State
  const [formState, setFormState] = useState({
    selectedEmpId: '',
    employeeName: '',
    employeeCode: '',
    designation: '',
    department: '',
    clientName: '',
    leaveType: 'EL (Earned Leave)',
    balanceBefore: 24,
    encashDays: 10,
    basicSalary: 15000,
    grossSalary: 24000,
    calculationBase: 'basic_only', // 'basic_only' | 'gross'
    payoutMonth: 'November 2026',
    remarks: 'Annual leave encashment'
  });

  // Calculate live preview for modal
  const livePreview = calculateEncashmentAmount({
    basicSalary: formState.basicSalary,
    grossSalary: formState.grossSalary,
    encashDays: formState.encashDays,
    calculationBase: formState.calculationBase,
    monthDivisor: ENCASHMENT_POLICY_DEFAULTS.monthDivisor
  });

  const remainingBalance = Math.max(0, formState.balanceBefore - formState.encashDays);
  const isBalanceViolation = remainingBalance < ENCASHMENT_POLICY_DEFAULTS.minBalanceToMaintain;
  const isQuotaViolation = formState.encashDays > ENCASHMENT_POLICY_DEFAULTS.maxDaysPerYear;

  // Filtered rows
  const filtered = encashments.filter((r) => {
    const q = search.toLowerCase().trim();
    if (q) {
      const matchName = (r.employeeName || '').toLowerCase().includes(q);
      const matchCode = (r.employeeCode || '').toLowerCase().includes(q);
      const matchId = (r.encashmentId || '').toLowerCase().includes(q);
      const matchClient = (r.clientName || '').toLowerCase().includes(q);
      if (!matchName && !matchCode && !matchId && !matchClient) return false;
    }
    if (statusFilter !== 'All' && r.status !== statusFilter) return false;
    return true;
  });

  // KPI Calculations
  const totalRequests = encashments.length;
  const pendingCount = encashments.filter((r) => r.status.includes('Pending')).length;
  const totalDaysEncashed = encashments
    .filter((r) => r.status !== 'Rejected')
    .reduce((sum, r) => sum + (Number(r.encashDays) || 0), 0);
  const totalDisbursedAmount = encashments
    .filter((r) => r.status === 'Disbursed in Payroll' || r.status.includes('Approved'))
    .reduce((sum, r) => sum + (Number(r.netPayableAmount) || 0), 0);

  // Employee Selection in Modal
  const handleEmployeeSelect = (empId) => {
    const emp = employees.find((e) => (e.id || e.employeeId || e._id) === empId);
    if (!emp) return;

    const basic = Number(emp.basicSalary || emp.basic || 15000);
    const gross = Number(emp.grossSalary || emp.salary || 24000);
    const elBal = 24; // Mock balance default

    setFormState((prev) => ({
      ...prev,
      selectedEmpId: empId,
      employeeName: emp.name || emp.employeeName || 'Employee',
      employeeCode: emp.employeeCode || emp.code || 'RR-000',
      designation: emp.designation || 'Staff',
      department: emp.department || 'Security Operations',
      clientName: emp.clientName || 'Assigned Site',
      basicSalary: basic,
      grossSalary: gross,
      balanceBefore: elBal,
      encashDays: 10
    }));
  };

  // Submit New Encashment Request
  const handleSubmitEncashment = (e) => {
    e.preventDefault();
    if (!formState.selectedEmpId && !formState.employeeName) {
      alert('Please select an employee.');
      return;
    }

    if (isBalanceViolation) {
      alert(`Policy constraint: Employee must maintain at least ${ENCASHMENT_POLICY_DEFAULTS.minBalanceToMaintain} days balance after encashment.`);
      return;
    }

    const newRecord = {
      id: `enc-${Date.now()}`,
      encashmentId: `ENC-2026-${String(encashments.length + 1).padStart(3, '0')}`,
      employeeId: formState.selectedEmpId,
      employeeCode: formState.employeeCode,
      employeeName: formState.employeeName,
      designation: formState.designation,
      department: formState.department,
      clientName: formState.clientName,
      financialYear: fyFilter,
      applyDate: new Date().toISOString().slice(0, 10),
      leaveType: formState.leaveType,
      balanceBefore: formState.balanceBefore,
      encashDays: formState.encashDays,
      balanceAfter: remainingBalance,
      basicSalary: formState.basicSalary,
      grossSalary: formState.grossSalary,
      dailyWageRate: livePreview.dailyWageRate,
      grossEncashmentAmount: livePreview.grossEncashment,
      tdsDeducted: livePreview.tdsDeducted,
      netPayableAmount: livePreview.netPayable,
      taxExemptSection10: true,
      status: 'Pending HR Approval',
      payoutPayrollMonth: formState.payoutMonth,
      remarks: formState.remarks,
      approvedBy: '—',
      approvalDate: ''
    };

    const nextList = [newRecord, ...encashments];
    setEncashments(nextList);
    saveStoredEncashments(nextList);
    setIsApplyModalOpen(false);

    if (onNotify) onNotify(`✓ Leave encashment request (${newRecord.encashmentId}) for ${newRecord.employeeName} submitted successfully.`, 'success');
  };

  // Quick Approve Handler
  const handleApprove = (record) => {
    const updated = {
      ...record,
      status: 'Approved & Ready for Payout',
      approvedBy: 'HR Head (Sanctioned)',
      approvalDate: new Date().toISOString().slice(0, 10)
    };
    const nextList = encashments.map((r) => (r.id === record.id ? updated : r));
    setEncashments(nextList);
    saveStoredEncashments(nextList);
    if (selectedRecord && selectedRecord.id === record.id) {
      setSelectedRecord(updated);
    }
    if (onNotify) onNotify(`✓ Encashment ${record.encashmentId} approved for payment disbursement.`, 'success');
  };

  // Reject Handler
  const handleReject = (record) => {
    const reason = prompt('Specify rejection / revision reason:', 'Leave balance audit mismatch');
    if (!reason) return;

    const updated = {
      ...record,
      status: 'Rejected',
      remarks: reason,
      approvedBy: 'HR Desk (Rejected)',
      approvalDate: new Date().toISOString().slice(0, 10)
    };
    const nextList = encashments.map((r) => (r.id === record.id ? updated : r));
    setEncashments(nextList);
    saveStoredEncashments(nextList);
    if (selectedRecord && selectedRecord.id === record.id) {
      setSelectedRecord(updated);
    }
    if (onNotify) onNotify(`Encashment ${record.encashmentId} marked Rejected.`, 'info');
  };

  return (
    <div className={styles.container}>
      {/* KPI Metrics Grid */}
      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <div className={styles.kpiLabel}>Total Encashment Requests</div>
          <div className={styles.kpiValue}>{totalRequests}</div>
          <div className={styles.kpiSubtext}>FY 2026-2027 Applications</div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiLabelWarning}>Pending Approvals</div>
          <div className={styles.kpiValueWarning}>{pendingCount}</div>
          <div className={styles.kpiSubtextWarning}>Awaiting HR / Supervisor review</div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiLabelPrimary}>Total Days Encashed</div>
          <div className={styles.kpiValuePrimary}>{totalDaysEncashed} Days</div>
          <div className={styles.kpiSubtextPrimary}>Earned Leave (EL) quota utilized</div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiLabelSuccess}>Total Encashment Payout</div>
          <div className={styles.kpiValueSuccess}>{formatINR(totalDisbursedAmount)}</div>
          <div className={styles.kpiSubtextSuccess}>Section 10(10AA) non-taxable dues</div>
        </div>
      </div>

      {/* Statutory Policy Notice Banner */}
      <div className={styles.policyBanner}>
        <div className={styles.policyBannerText}>
          <ShieldCheck size={18} color="#16a34a" style={{ flexShrink: 0 }} />
          <div>
            <strong>Company Leave Encashment Policy:</strong> Employees must retain a minimum of <strong>12 EL days</strong> after encashment. Maximum allowable encashment is <strong>15 days per year</strong> (Formula: <code>Basic Salary / 26 days</code>). Tax-free up to ₹25,00,000 u/s 10(10AA).
          </div>
        </div>
        <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 8px', borderRadius: 10, background: '#ffffff', color: '#166534', border: '1px solid #bbf7d0' }}>
          Statutory Compliant
        </span>
      </div>

      {/* Filter & Action Bar */}
      <div className={styles.filterBar}>
        <div className={styles.filterLeft}>
          <div className={styles.searchBox}>
            <Search size={15} className={styles.searchIcon} />
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Search by employee, code, ID or site..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select
            className={styles.selectField}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            {ENCASHMENT_STATUSES.map((st) => (
              <option key={st} value={st}>{st}</option>
            ))}
          </select>

          <select
            className={styles.selectField}
            value={fyFilter}
            onChange={(e) => setFyFilter(e.target.value)}
          >
            {FINANCIAL_YEARS.map((fy) => (
              <option key={fy} value={fy}>{fy}</option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            type="button"
            className={styles.btnApplyEncashment}
            onClick={() => setIsApplyModalOpen(true)}
          >
            <Plus size={15} /> Apply Leave Encashment
          </button>
        </div>
      </div>

      {/* Encashment Requests Ledger Table */}
      <div className={styles.tableCard}>
        <div className={styles.tableScroll}>
          <table className={styles.table}>
            <thead className={styles.tableHead}>
              <tr>
                <th className={styles.th}>Encashment ID</th>
                <th className={styles.th}>Employee</th>
                <th className={styles.th}>Leave Type</th>
                <th className={styles.thRight}>Opening Balance</th>
                <th className={styles.thRight}>Days Encashed</th>
                <th className={styles.thRight}>Balance After</th>
                <th className={styles.thRight}>Daily Wage Rate</th>
                <th className={styles.thRight}>Gross Amount</th>
                <th className={styles.th}>Sec 10(10AA)</th>
                <th className={styles.th}>Payout Status</th>
                <th className={styles.thRight}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={11} style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                    No leave encashment requests match the selected filters.
                  </td>
                </tr>
              ) : (
                filtered.map((r) => {
                  const isApproved = r.status.includes('Approved') || r.status.includes('Disbursed');
                  const isPending = r.status.includes('Pending');

                  return (
                    <tr key={r.id} className={styles.tr}>
                      <td className={styles.td}>
                        <button
                          type="button"
                          onClick={() => { setSelectedRecord(r); setIsDrawerOpen(true); }}
                          style={{
                            background: 'none',
                            border: 'none',
                            padding: 0,
                            color: '#2563eb',
                            fontWeight: 700,
                            fontFamily: 'monospace',
                            cursor: 'pointer',
                            textDecoration: 'underline'
                          }}
                        >
                          {r.encashmentId}
                        </button>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>{r.applyDate}</div>
                      </td>

                      <td className={styles.td}>
                        <div style={{ fontWeight: 600, color: '#0f172a' }}>{r.employeeName}</div>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>
                          {r.employeeCode} • {r.designation}
                        </div>
                      </td>

                      <td className={styles.td}>
                        <span style={{ fontSize: '12px', fontWeight: 600, color: '#334155' }}>
                          {r.leaveType}
                        </span>
                      </td>

                      <td className={styles.tdRight} style={{ fontWeight: 600 }}>
                        {r.balanceBefore} Days
                      </td>

                      <td className={styles.tdRight}>
                        <span style={{ fontWeight: 800, color: '#2563eb', background: '#eff6ff', padding: '2px 8px', borderRadius: 8 }}>
                          {r.encashDays} Days
                        </span>
                      </td>

                      <td className={styles.tdRight} style={{ color: r.balanceAfter < 12 ? '#dc2626' : '#166534', fontWeight: 600 }}>
                        {r.balanceAfter} Days
                      </td>

                      <td className={styles.tdRight} style={{ color: '#475569' }}>
                        {formatINR(r.dailyWageRate)}/day
                      </td>

                      <td className={styles.tdRight} style={{ fontWeight: 800, color: '#0f172a', fontSize: '13px' }}>
                        {formatINR(r.netPayableAmount)}
                      </td>

                      <td className={styles.td}>
                        <span style={{
                          display: 'inline-block',
                          padding: '2px 8px',
                          borderRadius: 10,
                          fontSize: '11px',
                          fontWeight: 700,
                          background: '#ecfdf5',
                          color: '#059669',
                          border: '1px solid #a7f3d0'
                        }}>
                          100% Tax Free
                        </span>
                      </td>

                      <td className={styles.td}>
                        <span className={
                          r.status === 'Disbursed in Payroll'
                            ? styles.badgeDisbursed
                            : isApproved
                            ? styles.badgeApproved
                            : r.status === 'Rejected'
                            ? styles.badgeRejected
                            : styles.badgePending
                        }>
                          {isApproved ? <CheckCircle2 size={12} /> : isPending ? <Clock size={12} /> : <AlertTriangle size={12} />}
                          {r.status}
                        </span>
                      </td>

                      <td className={styles.tdRight}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                          <button
                            type="button"
                            onClick={() => { setSelectedRecord(r); setIsDrawerOpen(true); }}
                            title="View statement & voucher"
                            style={{
                              padding: '5px 8px',
                              borderRadius: 5,
                              border: '1px solid #cbd5e1',
                              background: '#f8fafc',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                              fontSize: '11px',
                              fontWeight: 600
                            }}
                          >
                            <Eye size={12} /> Voucher
                          </button>

                          {isPending && (
                            <button
                              type="button"
                              onClick={() => handleApprove(r)}
                              title="Approve encashment"
                              style={{
                                padding: '5px 8px',
                                borderRadius: 5,
                                border: 'none',
                                background: '#16a34a',
                                color: '#ffffff',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4,
                                fontSize: '11px',
                                fontWeight: 600
                              }}
                            >
                              <Check size={12} /> Approve
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Apply Leave Encashment Modal */}
      {isApplyModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsApplyModalOpen(false)}>
          <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Coins size={18} style={{ color: '#2563eb' }} />
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>
                  Apply / Initiate Leave Encashment
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsApplyModalOpen(false)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitEncashment}>
              <div className={styles.modalBody}>
                {/* Employee Selection */}
                <div className={styles.formGroup}>
                  <label className={styles.label}>
                    Select Employee <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <select
                    className={styles.select}
                    value={formState.selectedEmpId}
                    onChange={(e) => handleEmployeeSelect(e.target.value)}
                    required
                  >
                    <option value="">-- Choose employee from workforce --</option>
                    {employees.length > 0 ? (
                      employees.map((emp) => (
                        <option key={emp.id || emp.employeeId || emp._id} value={emp.id || emp.employeeId || emp._id}>
                          {emp.employeeCode || emp.code || 'EMP'} - {emp.name || emp.employeeName} ({emp.designation || 'Staff'})
                        </option>
                      ))
                    ) : (
                      <>
                        <option value="e101">RR-101 - Rajesh Kumar Verma (Armed Guard)</option>
                        <option value="e102">RR-102 - Priya Nandini Sharma (HR Exec)</option>
                        <option value="e103">RR-103 - Sanjay Pratap Singh (Field Ops)</option>
                        <option value="e104">RR-104 - Mohammad Farooq (Field Supervisor)</option>
                      </>
                    )}
                  </select>
                </div>

                {/* Salary & Balance Overview */}
                <div style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: 8,
                  padding: 12,
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: 10,
                  fontSize: '12px'
                }}>
                  <div>
                    <span style={{ color: '#64748b', display: 'block', fontSize: '11px' }}>Monthly Basic Salary:</span>
                    <strong>{formatINR(formState.basicSalary)}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748b', display: 'block', fontSize: '11px' }}>Current EL Balance:</span>
                    <strong style={{ color: '#2563eb' }}>{formState.balanceBefore} Days</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748b', display: 'block', fontSize: '11px' }}>Computed Daily Wage:</span>
                    <strong>{formatINR(livePreview.dailyWageRate)}/day</strong>
                  </div>
                </div>

                {/* Encashment Parameters */}
                <div className={styles.formGrid2}>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>
                      Days to Encash (Max: {ENCASHMENT_POLICY_DEFAULTS.maxDaysPerYear} Days) <span style={{ color: '#dc2626' }}>*</span>
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={formState.balanceBefore}
                      className={styles.input}
                      value={formState.encashDays}
                      onChange={(e) => setFormState({ ...formState, encashDays: Number(e.target.value) })}
                      required
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>Calculation Basis</label>
                    <select
                      className={styles.select}
                      value={formState.calculationBase}
                      onChange={(e) => setFormState({ ...formState, calculationBase: e.target.value })}
                    >
                      <option value="basic_only">Basic Salary Only (Standard Labour Law)</option>
                      <option value="gross">Gross Monthly Salary</option>
                    </select>
                  </div>
                </div>

                {/* Real-time Calculation Summary Box */}
                <div style={{
                  background: isBalanceViolation ? '#fef2f2' : '#f0fdf4',
                  border: `1.5px solid ${isBalanceViolation ? '#fca5a5' : '#86efac'}`,
                  borderRadius: 8,
                  padding: '14px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 10
                }}>
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: isBalanceViolation ? '#dc2626' : '#166534' }}>
                      {isBalanceViolation ? '⚠ Balance Policy Violation' : '✓ Computed Encashment Value'}
                    </div>
                    <div style={{ fontSize: '20px', fontWeight: 900, color: isBalanceViolation ? '#b91c1c' : '#15803d', marginTop: 2 }}>
                      {formatINR(livePreview.netPayable)}
                    </div>
                    <div style={{ fontSize: '11px', color: '#475569', marginTop: 2 }}>
                      Formula: ({formatINR(livePreview.baseSalary)} / 26 days) × {formState.encashDays} days
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: remainingBalance < 12 ? '#dc2626' : '#166534' }}>
                      Balance After: {remainingBalance} Days
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>
                      Min 12 days required to retain
                    </div>
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Remarks / Payout Reason</label>
                  <input
                    type="text"
                    className={styles.input}
                    value={formState.remarks}
                    onChange={(e) => setFormState({ ...formState, remarks: e.target.value })}
                    placeholder="e.g. Festival leave encashment request"
                  />
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button
                  type="button"
                  onClick={() => setIsApplyModalOpen(false)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 6,
                    border: '1px solid #cbd5e1',
                    background: '#ffffff',
                    color: '#475569',
                    fontSize: '12.5px',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isBalanceViolation}
                  style={{
                    padding: '8px 18px',
                    borderRadius: 6,
                    border: 'none',
                    background: isBalanceViolation ? '#94a3b8' : '#2563eb',
                    color: '#ffffff',
                    fontSize: '12.5px',
                    fontWeight: 600,
                    cursor: isBalanceViolation ? 'not-allowed' : 'pointer'
                  }}
                >
                  Submit Encashment Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Review Drawer & Encashment Voucher Statement */}
      {isDrawerOpen && selectedRecord && (
        <div className={styles.drawerOverlay} onClick={() => setIsDrawerOpen(false)}>
          <div className={styles.drawerCard} onClick={(e) => e.stopPropagation()}>
            <div className={styles.drawerHeader}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>
                    {selectedRecord.encashmentId}
                  </h3>
                  <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: 10, background: '#eff6ff', color: '#1d4ed8' }}>
                    {selectedRecord.financialYear}
                  </span>
                </div>
                <div style={{ fontSize: '12px', color: '#64748b', marginTop: 2 }}>
                  {selectedRecord.employeeName} ({selectedRecord.employeeCode}) • {selectedRecord.designation}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsDrawerOpen(false)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <div className={styles.drawerBody}>
              {/* Voucher Top Details */}
              <div style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: 8,
                padding: 16,
                display: 'flex',
                flexDirection: 'column',
                gap: 10
              }}>
                <div style={{ fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#475569' }}>
                  Leave Encashment Statement &amp; Computation
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, fontSize: '12px' }}>
                  <div>
                    <span style={{ color: '#64748b' }}>Assigned Client / Site:</span>
                    <strong style={{ display: 'block', color: '#0f172a' }}>{selectedRecord.clientName}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748b' }}>Leave Quota Type:</span>
                    <strong style={{ display: 'block', color: '#0f172a' }}>{selectedRecord.leaveType}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748b' }}>Application Date:</span>
                    <strong style={{ display: 'block', color: '#0f172a' }}>{selectedRecord.applyDate}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748b' }}>Target Payroll Month:</span>
                    <strong style={{ display: 'block', color: '#0f172a' }}>{selectedRecord.payoutPayrollMonth}</strong>
                  </div>
                </div>
              </div>

              {/* Balance Audit */}
              <div style={{
                border: '1px solid #e2e8f0',
                borderRadius: 8,
                overflow: 'hidden'
              }}>
                <div style={{ padding: '10px 14px', background: '#f1f5f9', fontWeight: 700, fontSize: '12.5px', color: '#0f172a' }}>
                  Leave Balance Audit &amp; Deduction
                </div>
                <div style={{ padding: '12px 14px', fontSize: '12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>Earned Leave Opening Balance:</span>
                    <strong>{selectedRecord.balanceBefore} Days</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>Encashed Days Authorized:</span>
                    <strong style={{ color: '#dc2626' }}>-{selectedRecord.encashDays} Days</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed #cbd5e1', paddingTop: 6 }}>
                    <span style={{ fontWeight: 700 }}>Closing Leave Balance Retained:</span>
                    <strong style={{ color: '#166534', fontWeight: 800 }}>{selectedRecord.balanceAfter} Days</strong>
                  </div>
                </div>
              </div>

              {/* Financial Computation Breakdown */}
              <div style={{
                background: '#ecfdf5',
                border: '2px solid #059669',
                borderRadius: 8,
                padding: '14px 16px',
                display: 'flex',
                flexDirection: 'column',
                gap: 8
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: '#047857' }}>
                    Net Encashment Disbursable
                  </span>
                  <span style={{ fontSize: '11px', fontWeight: 700, background: '#ffffff', color: '#059669', padding: '2px 8px', borderRadius: 10, border: '1px solid #a7f3d0' }}>
                    Sec 10(10AA) Exempt
                  </span>
                </div>
                <div style={{ fontSize: '24px', fontWeight: 900, color: '#065f46' }}>
                  {formatINR(selectedRecord.netPayableAmount)}
                </div>
                <div style={{ fontSize: '11.5px', color: '#047857' }}>
                  Computed at daily wage of <strong>{formatINR(selectedRecord.dailyWageRate)}/day</strong> ({selectedRecord.encashDays} days).
                </div>
              </div>

              {/* Approval Info */}
              <div style={{ background: '#f8fafc', padding: 12, borderRadius: 6, border: '1px solid #e2e8f0', fontSize: '12px' }}>
                <span style={{ color: '#64748b', display: 'block' }}>Approval Status &amp; Sign-off:</span>
                <strong style={{ color: '#0f172a' }}>{selectedRecord.approvedBy}</strong>
                {selectedRecord.approvalDate && (
                  <span style={{ fontSize: '11px', color: '#64748b', marginLeft: 8 }}>
                    on {selectedRecord.approvalDate}
                  </span>
                )}
              </div>
            </div>

            <div className={styles.drawerFooter}>
              <button
                type="button"
                onClick={() => window.print()}
                style={{
                  padding: '7px 14px',
                  borderRadius: 6,
                  border: '1px solid #cbd5e1',
                  background: '#ffffff',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                <Printer size={14} /> Print Voucher
              </button>

              <div style={{ display: 'flex', gap: 10 }}>
                {selectedRecord.status.includes('Pending') && (
                  <>
                    <button
                      type="button"
                      onClick={() => handleReject(selectedRecord)}
                      style={{
                        padding: '7px 14px',
                        borderRadius: 6,
                        border: '1px solid #fca5a5',
                        background: '#fef2f2',
                        color: '#dc2626',
                        fontSize: '12.5px',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      Reject
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApprove(selectedRecord)}
                      style={{
                        padding: '7px 18px',
                        borderRadius: 6,
                        border: 'none',
                        background: '#16a34a',
                        color: '#ffffff',
                        fontSize: '12.5px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6
                      }}
                    >
                      <Check size={14} /> Approve Encashment
                    </button>
                  </>
                )}
                <button
                  type="button"
                  onClick={() => setIsDrawerOpen(false)}
                  style={{
                    padding: '7px 14px',
                    borderRadius: 6,
                    border: '1px solid #cbd5e1',
                    background: '#ffffff',
                    color: '#64748b',
                    fontSize: '12.5px',
                    cursor: 'pointer'
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

