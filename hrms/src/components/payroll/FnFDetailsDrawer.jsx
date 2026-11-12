import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  IndianRupee,
  CheckCircle2,
  ArrowRightLeft
} from 'lucide-react';
import { useCompany } from '../../context/CompanyContext';
import employeeService from '../../services/employeeService';
import { mockEmployees } from '../../data/employeeData';
import styles from './FnFDetailsDrawer.module.css';

const formatINR = (val) => `₹${Number(val || 0).toLocaleString('en-IN')}`;

function formatDateDisplay(dateStr) {
  if (!dateStr) return '—';
  try {
    const clean = dateStr.slice(0, 10);
    const d = new Date(`${clean}T12:00:00`);
    if (isNaN(d.getTime())) return dateStr;
    const day = String(d.getDate()).padStart(2, '0');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${day}-${months[d.getMonth()]}-${d.getFullYear()}`;
  } catch (_) {
    return dateStr;
  }
}

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

  return words.trim() + ' Rupees Only';
}

// Sanitize numeric string while allowing empty string so user can cleanly clear '0'
function sanitizeNumericInput(val) {
  if (val === '' || val === null || val === undefined) return '';
  const cleaned = String(val).replace(/[^0-9.]/g, '');
  const parts = cleaned.split('.');
  if (parts.length > 2) {
    return `${parts[0]}.${parts.slice(1).join('')}`;
  }
  return cleaned;
}

function toEditableStr(num) {
  const n = Number(num);
  return n > 0 ? String(n) : '';
}

const DEFAULT_EARNING_COMPONENTS = [
  { key: 'pendingSalary', label: 'Pending Salary', module: 'Payroll Processing', hint: 'Unpaid working days / pro-rata salary' },
  { key: 'bonus', label: 'Bonus', module: 'Bonus Management', hint: 'Annual, festival, or statutory bonus payout' },
  { key: 'gratuity', label: 'Gratuity', module: 'Gratuity Management', hint: 'Statutory gratuity entitlement' },
  { key: 'leaveEncashment', label: 'Leave Encashment', module: 'Leave Management', hint: 'Unavailed EL / PL encashment value' },
  { key: 'arrears', label: 'Arrears', module: 'Payroll Arrears', hint: 'Pending salary revision or arrear dues' },
  { key: 'overtimePay', label: 'Overtime Pay', module: 'Overtime', hint: 'Approved unpaid overtime hours pay' },
  { key: 'reimbursements', label: 'Reimbursements', module: 'Reimbursements', hint: 'Approved pending expense claims' }
];

const DEFAULT_DEDUCTION_COMPONENTS = [
  { key: 'advanceLoanRecovery', label: 'Advances & Loans Recovery', module: 'Advances & Loans', hint: 'Outstanding salary advance or loan balance' },
  { key: 'noticeRecovery', label: 'Notice Period Recovery', module: 'Separation Notice', hint: 'Notice shortfall recovery if applicable' },
  { key: 'uniformPenalty', label: 'Asset / Uniform Recovery', module: 'Inventory', hint: 'Unreturned kit, uniform, or asset deduction' },
  { key: 'statutoryDeductions', label: 'Statutory Deductions (PF / ESIC / TDS)', module: 'Statutory', hint: 'Employee PF, ESIC, or tax deduction' }
];

export default function FnFDetailsDrawer({
  isOpen,
  onClose,
  record,
  employees: propEmployees,
  onSaveSettlement,
  onFinalizeSettlement,
  onDisburse
}) {
  const { activeCompanyId } = useCompany();
  const [staffList, setStaffList] = useState([]);

  // Settlement Components state
  const [earnings, setEarnings] = useState({});
  const [deductions, setDeductions] = useState({});

  // Simple Responsibility & Liability Transfer state
  const [transferToCode, setTransferToCode] = useState('');
  const [transferredTo, setTransferredTo] = useState(null); // { code, name }

  // Payout Details
  const [payoutMode, setPayoutMode] = useState('Bank Transfer (NEFT)');
  const [payoutDate, setPayoutDate] = useState(new Date().toISOString().slice(0, 10));
  const [utrNo, setUtrNo] = useState('');

  // Load active staff list for liability transfer dropdown
  useEffect(() => {
    if (!isOpen) return;
    if (Array.isArray(propEmployees) && propEmployees.length > 0) {
      setStaffList(propEmployees);
      return;
    }

    let isMounted = true;
    async function loadStaff() {
      try {
        const fetched = await employeeService.getEmployees(activeCompanyId);
        const source = Array.isArray(fetched) && fetched.length > 0 ? fetched : mockEmployees;
        if (isMounted) {
          setStaffList(source);
        }
      } catch (_) {
        if (isMounted) setStaffList(mockEmployees);
      }
    }
    loadStaff();
    return () => {
      isMounted = false;
    };
  }, [isOpen, propEmployees, activeCompanyId]);

  // Initialize drawer state when record opens/changes
  useEffect(() => {
    if (!record) return;

    const savedCfg = record.settlementComponents;
    if (savedCfg && savedCfg.earnings && savedCfg.deductions) {
      const normalizedEarnings = {};
      DEFAULT_EARNING_COMPONENTS.forEach((c) => {
        const item = savedCfg.earnings[c.key];
        normalizedEarnings[c.key] = {
          enabled: Boolean(item?.enabled),
          amount: toEditableStr(item?.amount)
        };
      });
      const normalizedDeductions = {};
      DEFAULT_DEDUCTION_COMPONENTS.forEach((c) => {
        const item = savedCfg.deductions[c.key];
        normalizedDeductions[c.key] = {
          enabled: Boolean(item?.enabled),
          amount: toEditableStr(item?.amount)
        };
      });
      setEarnings(normalizedEarnings);
      setDeductions(normalizedDeductions);
    } else {
      const sd = record.salaryDues || {};
      const sb = record.statutoryBenefits || {};
      const ded = record.deductions || {};

      const pendingSalVal = Number(sd.pendingSalary ?? record.unpaidSalary ?? 0);
      const bonusVal = Number(sd.bonus ?? record.bonusOrArrears ?? 0);
      const gratuityVal = Number(sb.gratuityAmount ?? record.gratuityAmount ?? 0);
      const leaveVal = Number(sb.leaveEncashment ?? record.leaveEncashment ?? 0);
      const arrearsVal = Number(sd.arrears ?? 0);
      const otVal = Number(sd.overtimePay ?? 0);
      const reimbVal = Number(sd.reimbursements ?? sd.incentives ?? 0);

      const hasAnyExistingVal =
        pendingSalVal + bonusVal + gratuityVal + leaveVal + arrearsVal + otVal + reimbVal > 0;

      setEarnings({
        pendingSalary: { enabled: hasAnyExistingVal ? pendingSalVal > 0 : true, amount: toEditableStr(pendingSalVal) },
        bonus: { enabled: hasAnyExistingVal ? bonusVal > 0 : true, amount: toEditableStr(bonusVal) },
        gratuity: { enabled: hasAnyExistingVal ? gratuityVal > 0 : true, amount: toEditableStr(gratuityVal) },
        leaveEncashment: { enabled: hasAnyExistingVal ? leaveVal > 0 : true, amount: toEditableStr(leaveVal) },
        arrears: { enabled: arrearsVal > 0, amount: toEditableStr(arrearsVal) },
        overtimePay: { enabled: otVal > 0, amount: toEditableStr(otVal) },
        reimbursements: { enabled: reimbVal > 0, amount: toEditableStr(reimbVal) }
      });

      const advLoanVal = Number(ded.advanceRecovery ?? 0) + Number(ded.loanRecovery ?? 0);
      const noticeRecVal = Number(ded.noticeRecovery ?? 0);
      const uniformVal = Number(ded.uniformPenalty ?? 0);
      const statVal = Number(sb.employeePf ?? 0) + Number(sb.employeeEsi ?? 0) + Number(ded.otherDeductions ?? 0);

      setDeductions({
        advanceLoanRecovery: { enabled: advLoanVal > 0, amount: toEditableStr(advLoanVal) },
        noticeRecovery: { enabled: noticeRecVal > 0, amount: toEditableStr(noticeRecVal) },
        uniformPenalty: { enabled: uniformVal > 0, amount: toEditableStr(uniformVal) },
        statutoryDeductions: { enabled: statVal > 0, amount: toEditableStr(statVal) }
      });
    }

    // Initialize Liability Transfer
    if (record.liabilityTransfer && record.liabilityTransfer.assignedToCode) {
      setTransferToCode(record.liabilityTransfer.assignedToCode);
      setTransferredTo({
        code: record.liabilityTransfer.assignedToCode,
        name: record.liabilityTransfer.assignedToName || record.liabilityTransfer.assignedToCode
      });
    } else {
      setTransferToCode('');
      setTransferredTo(null);
    }

    setPayoutMode(record.payment?.mode || 'Bank Transfer (NEFT)');
    setPayoutDate(record.payment?.paymentDate || new Date().toISOString().slice(0, 10));
    setUtrNo(record.payment?.utrNo || '');
  }, [record]);

  // Available successor employees (excluding current exiting employee)
  const successorOptions = useMemo(() => {
    const exitingCode = (record?.employeeCode || '').toLowerCase();
    const exitingName = (record?.employeeName || '').toLowerCase();

    const seen = new Set();
    const list = [];
    (staffList || []).forEach((emp) => {
      const code = emp.employeeCode || emp.code || emp.id || '';
      const name = emp.name || '';
      if (!name) return;
      if (code.toLowerCase() === exitingCode && name.toLowerCase() === exitingName) return;
      if (seen.has(code || name)) return;
      seen.add(code || name);
      list.push({
        code: code || name,
        name,
        designation: emp.designation || 'Staff'
      });
    });
    return list;
  }, [staffList, record]);

  // Totals Calculation
  const totals = useMemo(() => {
    const selectedEarnings = Object.values(earnings).filter((c) => c?.enabled);
    const selectedDeductions = Object.values(deductions).filter((c) => c?.enabled);

    const grossEarnings = selectedEarnings.reduce((sum, c) => sum + (Number(c.amount) || 0), 0);
    const totalDeductions = selectedDeductions.reduce((sum, c) => sum + (Number(c.amount) || 0), 0);
    const netPayable = Math.max(0, grossEarnings - totalDeductions);

    return {
      selectedEarningsCount: selectedEarnings.length,
      selectedDeductionsCount: selectedDeductions.length,
      grossEarnings,
      totalDeductions,
      netPayable
    };
  }, [earnings, deductions]);

  if (!isOpen || !record) return null;

  const isFinalized = record.settlementStatus === 'Settled / Disbursed';

  // Handlers for Earnings & Deductions toggles/inputs
  const toggleEarning = (key) => {
    setEarnings((prev) => ({
      ...prev,
      [key]: { ...(prev[key] || { amount: '' }), enabled: !prev[key]?.enabled }
    }));
  };

  const changeEarningAmount = (key, val) => {
    const clean = sanitizeNumericInput(val);
    setEarnings((prev) => ({
      ...prev,
      [key]: { ...(prev[key] || { enabled: true }), amount: clean }
    }));
  };

  const toggleDeduction = (key) => {
    setDeductions((prev) => ({
      ...prev,
      [key]: { ...(prev[key] || { amount: '' }), enabled: !prev[key]?.enabled }
    }));
  };

  const changeDeductionAmount = (key, val) => {
    const clean = sanitizeNumericInput(val);
    setDeductions((prev) => ({
      ...prev,
      [key]: { ...(prev[key] || { enabled: true }), amount: clean }
    }));
  };

  const handleSelectAllEarnings = (flag) => {
    setEarnings((prev) => {
      const next = {};
      DEFAULT_EARNING_COMPONENTS.forEach((c) => {
        next[c.key] = { ...(prev[c.key] || { amount: '' }), enabled: flag };
      });
      return next;
    });
  };

  // Transfer Liability Handler
  const handleTransferLiability = () => {
    if (!transferToCode) return;
    const emp = successorOptions.find((e) => e.code === transferToCode);
    setTransferredTo({
      code: transferToCode,
      name: emp ? emp.name : transferToCode
    });
  };

  // Process / Save Settlement Handler
  const handleProcess = () => {
    const getVal = (map, k) => (map[k]?.enabled ? Number(map[k].amount) || 0 : 0);

    const updatedSalaryDues = {
      pendingSalary: getVal(earnings, 'pendingSalary'),
      bonus: getVal(earnings, 'bonus'),
      arrears: getVal(earnings, 'arrears'),
      overtimePay: getVal(earnings, 'overtimePay'),
      reimbursements: getVal(earnings, 'reimbursements'),
      incentives: getVal(earnings, 'reimbursements')
    };

    const updatedStatutory = {
      ...(record.statutoryBenefits || {}),
      gratuityAmount: getVal(earnings, 'gratuity'),
      leaveEncashment: getVal(earnings, 'leaveEncashment'),
      employeePf: getVal(deductions, 'statutoryDeductions'),
      employeeEsi: 0
    };

    const updatedDeductions = {
      advanceRecovery: getVal(deductions, 'advanceLoanRecovery'),
      loanRecovery: 0,
      noticeRecovery: getVal(deductions, 'noticeRecovery'),
      uniformPenalty: getVal(deductions, 'uniformPenalty'),
      otherDeductions: 0
    };

    // Resolve transfer assignment (use confirmed transfer or selected dropdown employee)
    const selectedEmp = successorOptions.find((e) => e.code === transferToCode);
    const activeTransfer =
      transferredTo ||
      (transferToCode
        ? { code: transferToCode, name: selectedEmp ? selectedEmp.name : transferToCode }
        : null);

    const updatedRecord = {
      ...record,
      settlementComponents: {
        earnings,
        deductions
      },
      salaryDues: updatedSalaryDues,
      statutoryBenefits: updatedStatutory,
      deductions: updatedDeductions,
      liabilityTransfer: activeTransfer
        ? {
            assignedToCode: activeTransfer.code,
            assignedToName: activeTransfer.name,
            transferredAt: new Date().toISOString().slice(0, 10)
          }
        : null,
      netSettlementAmount: totals.netPayable,
      finalSettlement: {
        grossEarnings: totals.grossEarnings,
        totalDeductions: totals.totalDeductions,
        netPayable: totals.netPayable,
        inWords: inWordsINR(totals.netPayable)
      },
      settlementStatus: isFinalized ? 'Settled / Disbursed' : 'Approved for Payout',
      payment: {
        ...(record.payment || {}),
        mode: payoutMode,
        paymentDate: payoutDate || new Date().toISOString().slice(0, 10),
        utrNo: utrNo || record.payment?.utrNo || ''
      }
    };

    if (onSaveSettlement) {
      onSaveSettlement(updatedRecord);
    } else if (onFinalizeSettlement) {
      onFinalizeSettlement(updatedRecord);
    } else if (onDisburse) {
      onDisburse(updatedRecord, { mode: payoutMode, paymentDate: payoutDate, utrNo });
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <aside className={styles.drawer} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>
          <div>
            <div className={styles.headerTitleRow}>
              <h2 className={styles.title}>Process Exit Settlement</h2>
              <span className={styles.idBadge}>{record.settlementId || record.id}</span>
              <span className={isFinalized ? styles.statusBadgeSettled : styles.statusBadgePending}>
                {isFinalized ? 'Finalized' : 'Pending Settlement'}
              </span>
            </div>
            <p className={styles.subtitle}>
              {record.employeeName} ({record.employeeCode}) • {record.designation || 'Employee'} •{' '}
              Exit Date: <strong>{formatDateDisplay(record.lastWorkingDay)}</strong>
            </p>
          </div>

          <button type="button" className={styles.closeBtn} onClick={onClose} title="Close drawer">
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className={styles.body}>
          {/* Compact Employee Summary Strip */}
          <div className={styles.empStrip}>
            <div className={styles.stripItem}>
              <span className={styles.stripLabel}>Joining Date</span>
              <span className={styles.stripValue}>{formatDateDisplay(record.dateOfJoining)}</span>
            </div>
            <div className={styles.stripItem}>
              <span className={styles.stripLabel}>Resignation Date</span>
              <span className={styles.stripValue}>{formatDateDisplay(record.resignationDate)}</span>
            </div>
            <div className={styles.stripItem}>
              <span className={styles.stripLabel}>Department</span>
              <span className={styles.stripValue}>{record.department || '—'}</span>
            </div>
            <div className={styles.stripItem}>
              <span className={styles.stripLabel}>Client Company</span>
              <span className={styles.stripValue}>{record.client || '—'}</span>
            </div>
          </div>

          {/* SECTION 1: Selectable HRMS Settlement Components */}
          <div className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionTitleGroup}>
                <div className={styles.sectionIconBox}>
                  <IndianRupee size={16} />
                </div>
                <div>
                  <h3 className={styles.sectionTitle}>Full &amp; Final Settlement Components</h3>
                  <p className={styles.sectionDesc}>
                    Choose which HRMS components to include in this settlement (e.g., Bonus + Leave Encashment only, or all).
                  </p>
                </div>
              </div>

              <div className={styles.quickActions}>
                <button
                  type="button"
                  className={styles.pillBtn}
                  onClick={() => handleSelectAllEarnings(true)}
                >
                  Select All
                </button>
                <button
                  type="button"
                  className={styles.pillBtn}
                  onClick={() => handleSelectAllEarnings(false)}
                >
                  Clear All
                </button>
              </div>
            </div>

            {/* Earnings Group */}
            <div>
              <div className={styles.groupSubheading}>
                <span>Earnings &amp; Entitlements ({totals.selectedEarningsCount} selected)</span>
                <span>Subtotal: {formatINR(totals.grossEarnings)}</span>
              </div>
              <div className={styles.componentList}>
                {DEFAULT_EARNING_COMPONENTS.map((comp) => {
                  const state = earnings[comp.key] || { enabled: false, amount: '' };
                  return (
                    <div
                      key={comp.key}
                      className={`${styles.componentRow} ${
                        state.enabled ? styles.componentRowActive : styles.componentRowDisabled
                      }`}
                    >
                      <label className={styles.componentLeft}>
                        <input
                          type="checkbox"
                          className={styles.checkbox}
                          checked={Boolean(state.enabled)}
                          onChange={() => toggleEarning(comp.key)}
                        />
                        <div className={styles.compMeta}>
                          <div className={styles.compTitleRow}>
                            <span className={styles.compName}>{comp.label}</span>
                            <span className={styles.moduleTag}>{comp.module}</span>
                          </div>
                          <span className={styles.compHint}>{comp.hint}</span>
                        </div>
                      </label>

                      <div
                        className={`${styles.amountInputWrap} ${
                          !state.enabled ? styles.amountInputWrapDisabled : ''
                        }`}
                      >
                        <span className={styles.currencySymbol}>₹</span>
                        <input
                          type="text"
                          inputMode="decimal"
                          placeholder="0"
                          className={styles.amountInput}
                          disabled={!state.enabled}
                          value={state.amount ?? ''}
                          onChange={(e) => changeEarningAmount(comp.key, e.target.value)}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Deductions / Recoveries Group */}
            <div>
              <div className={styles.groupSubheading}>
                <span>Recoveries &amp; Deductions ({totals.selectedDeductionsCount} selected)</span>
                <span>Subtotal: -{formatINR(totals.totalDeductions)}</span>
              </div>
              <div className={styles.componentList}>
                {DEFAULT_DEDUCTION_COMPONENTS.map((comp) => {
                  const state = deductions[comp.key] || { enabled: false, amount: '' };
                  return (
                    <div
                      key={comp.key}
                      className={`${styles.componentRow} ${
                        state.enabled ? styles.componentRowDeductionActive : styles.componentRowDisabled
                      }`}
                    >
                      <label className={styles.componentLeft}>
                        <input
                          type="checkbox"
                          className={styles.checkbox}
                          checked={Boolean(state.enabled)}
                          onChange={() => toggleDeduction(comp.key)}
                        />
                        <div className={styles.compMeta}>
                          <div className={styles.compTitleRow}>
                            <span className={styles.compName}>{comp.label}</span>
                            <span className={styles.moduleTag}>{comp.module}</span>
                          </div>
                          <span className={styles.compHint}>{comp.hint}</span>
                        </div>
                      </label>

                      <div
                        className={`${styles.amountInputWrap} ${
                          !state.enabled ? styles.amountInputWrapDisabled : ''
                        }`}
                      >
                        <span className={styles.currencySymbol}>₹</span>
                        <input
                          type="text"
                          inputMode="decimal"
                          placeholder="0"
                          className={styles.amountInput}
                          disabled={!state.enabled}
                          value={state.amount ?? ''}
                          onChange={(e) => changeDeductionAmount(comp.key, e.target.value)}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* SECTION 2: Simple Responsibility & Liability Transfer */}
          <div className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionTitleGroup}>
                <div className={`${styles.sectionIconBox} ${styles.sectionIconAmber}`}>
                  <ArrowRightLeft size={16} />
                </div>
                <div>
                  <h3 className={styles.sectionTitle}>Responsibilities &amp; Liability Transfer</h3>
                  <p className={styles.sectionDesc}>
                    If {record.employeeName} holds Manager, HR, Supervisor, or team/asset responsibilities, select an employee to transfer them.
                  </p>
                </div>
              </div>
            </div>

            <div className={styles.transferRow}>
              <select
                className={styles.selectEmp}
                value={transferToCode}
                onChange={(e) => setTransferToCode(e.target.value)}
              >
                <option value="">-- Select Employee --</option>
                {successorOptions.map((emp) => (
                  <option key={emp.code} value={emp.code}>
                    {emp.name} ({emp.code}) — {emp.designation}
                  </option>
                ))}
              </select>

              <button
                type="button"
                className={styles.transferBtn}
                disabled={!transferToCode}
                onClick={handleTransferLiability}
              >
                <ArrowRightLeft size={14} />
                <span>Transfer</span>
              </button>
            </div>

            {transferredTo && (
              <div className={styles.transferredBanner}>
                <span>
                  ✓ Responsibilities &amp; liabilities transferred to{' '}
                  <strong>
                    {transferredTo.name} ({transferredTo.code})
                  </strong>
                </span>
                <button
                  type="button"
                  className={styles.clearTransferBtn}
                  onClick={() => {
                    setTransferredTo(null);
                    setTransferToCode('');
                  }}
                >
                  Clear
                </button>
              </div>
            )}
          </div>

          {/* SECTION 3: Live Settlement Summary & Payment Info */}
          <div className={styles.summaryBox}>
            <div className={styles.summaryLeft}>
              <span className={styles.summaryEyebrow}>Net Settlement Payable</span>
              <div className={styles.summaryWords}>{inWordsINR(totals.netPayable)}</div>
              <div className={styles.summaryMetrics}>
                <span>
                  Selected: <strong>{totals.selectedEarningsCount}</strong> Earnings,{' '}
                  <strong>{totals.selectedDeductionsCount}</strong> Deductions
                </span>
                {transferredTo && (
                  <>
                    <span>•</span>
                    <span>
                      Liability Transferred To: <strong>{transferredTo.name}</strong>
                    </span>
                  </>
                )}
              </div>
            </div>
            <div className={styles.summaryAmount}>{formatINR(totals.netPayable)}</div>
          </div>

          {/* Payout Reference Inputs */}
          <div className={styles.sectionCard}>
            <div className={styles.groupSubheading} style={{ margin: 0 }}>
              <span>Settlement Payout Mode &amp; Reference</span>
            </div>
            <div className={styles.payoutGrid}>
              <div className={styles.controlCol}>
                <label className={styles.smallLabel}>Payment Mode</label>
                <select
                  className={styles.textInput}
                  value={payoutMode}
                  onChange={(e) => setPayoutMode(e.target.value)}
                >
                  <option value="Bank Transfer (NEFT)">Bank Transfer (NEFT)</option>
                  <option value="Bank Transfer (RTGS)">Bank Transfer (RTGS)</option>
                  <option value="UPI / IMPS">UPI / IMPS</option>
                  <option value="Cheque">Cheque</option>
                  <option value="Cash">Cash</option>
                </select>
              </div>

              <div className={styles.controlCol}>
                <label className={styles.smallLabel}>Settlement Date</label>
                <input
                  type="date"
                  className={styles.textInput}
                  value={payoutDate}
                  onChange={(e) => setPayoutDate(e.target.value)}
                />
              </div>

              <div className={styles.controlCol}>
                <label className={styles.smallLabel}>UTR / Reference No.</label>
                <input
                  type="text"
                  className={styles.textInput}
                  placeholder="Optional reference number"
                  value={utrNo}
                  onChange={(e) => setUtrNo(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions: Only Process and Close */}
        <div className={styles.footer}>
          <button type="button" className={styles.btnProcess} onClick={handleProcess}>
            <CheckCircle2 size={15} />
            <span>Process</span>
          </button>

          <button type="button" className={styles.btnSecondary} onClick={onClose}>
            Close
          </button>
        </div>
      </aside>
    </div>
  );
}
