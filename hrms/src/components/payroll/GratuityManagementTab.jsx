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
  FileCheck2,
  CalendarDays,
  Send
} from 'lucide-react';
import styles from './GratuityManagementTab.module.css';
import {
  GRATUITY_CONSTANTS,
  SEPARATION_TYPES,
  GRATUITY_STATUSES,
  calculateGratuityDetails,
  getStoredGratuity,
  saveStoredGratuity,
  calculateGratuityMetrics
} from '../../data/gratuityData';

const formatINR = (val) => `₹${Number(val || 0).toLocaleString('en-IN')}`;

export default function GratuityManagementTab({
  employees = [],
  onNotify
}) {
  const [records, setRecords] = useState(() => getStoredGratuity());
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // Modals & Drawers
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // New Gratuity Claim Form State
  const [formState, setFormState] = useState({
    selectedEmpId: '',
    employeeName: '',
    employeeCode: '',
    designation: '',
    department: '',
    clientName: '',
    joiningDate: '2019-01-15',
    exitDate: new Date().toISOString().slice(0, 10),
    lastDrawnBasic: 20000,
    separationReason: SEPARATION_TYPES[0],
    formFSubmitted: true,
    nomineeName: '',
    nomineeRelation: 'Spouse',
    bankAccountNo: '',
    ifsc: '',
    bankName: '',
    remarks: ''
  });

  // Calculate live preview in modal
  const liveCalculation = calculateGratuityDetails({
    joiningDate: formState.joiningDate,
    exitDate: formState.exitDate,
    lastDrawnBasic: formState.lastDrawnBasic,
    separationReason: formState.separationReason
  });

  // KPI Metrics
  const metrics = calculateGratuityMetrics(records);

  // Filter records
  const filteredRecords = records.filter((r) => {
    const matchesSearch =
      r.employeeName?.toLowerCase().includes(search.toLowerCase()) ||
      r.employeeCode?.toLowerCase().includes(search.toLowerCase()) ||
      r.claimId?.toLowerCase().includes(search.toLowerCase()) ||
      r.clientName?.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === 'All' || r.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Handle Employee select in modal
  const handleEmployeeSelect = (empId) => {
    const emp = employees.find((e) => (e.id || e._id || e.employeeId) === empId);
    if (!emp) return;

    const basicSalary = emp.basicSalary || emp.salary?.basic || 18000;
    const doj = emp.joiningDate || emp.dateOfJoining || '2019-06-01';

    setFormState((prev) => ({
      ...prev,
      selectedEmpId: empId,
      employeeName: emp.name || emp.employeeName || 'Staff Member',
      employeeCode: emp.employeeCode || emp.code || 'RR-EMP-000',
      designation: emp.designation || 'Security Personnel',
      department: emp.department || 'Operations',
      clientName: emp.clientName || emp.companyName || 'Corporate Client',
      joiningDate: doj,
      lastDrawnBasic: basicSalary,
      nomineeName: emp.emergencyContact?.name || emp.fatherName || 'Nominee Beneficiary',
      bankAccountNo: emp.bankDetails?.accountNumber || emp.bankAccountNo || '30495829104',
      ifsc: emp.bankDetails?.ifscCode || emp.ifsc || 'SBIN0004210',
      bankName: emp.bankDetails?.bankName || 'State Bank of India'
    }));
  };

  // Submit New Gratuity Claim
  const handleSaveClaim = (e) => {
    e.preventDefault();

    if (!formState.employeeName) {
      alert('Please enter or select an employee.');
      return;
    }

    if (!liveCalculation.isEligible) {
      const confirmIneligible = window.confirm(
        'Warning: The employee has completed less than 5 years of service and is not eligible under Section 4(1) of Payment of Gratuity Act. Do you still wish to submit?'
      );
      if (!confirmIneligible) return;
    }

    const nextId = `GRAT-2026-${String(records.length + 1).padStart(3, '0')}`;
    const newRecord = {
      id: `grat_${Date.now()}`,
      claimId: nextId,
      employeeId: formState.selectedEmpId || 'EMP-MANUAL',
      employeeCode: formState.employeeCode || 'RR-SEC-000',
      employeeName: formState.employeeName,
      designation: formState.designation,
      department: formState.department,
      clientName: formState.clientName,
      joiningDate: formState.joiningDate,
      exitDate: formState.exitDate,
      tenureYears: liveCalculation.tenureYears,
      tenureMonths: liveCalculation.tenureMonths,
      roundedYears: liveCalculation.roundedYears,
      isEligible: liveCalculation.isEligible,
      lastDrawnBasic: formState.lastDrawnBasic,
      gratuityAmount: liveCalculation.gratuityAmount,
      taxExemptAmount: liveCalculation.taxExemptAmount,
      taxableAmount: liveCalculation.taxableAmount,
      netPayable: liveCalculation.netPayable,
      separationReason: formState.separationReason,
      formFSubmitted: formState.formFSubmitted,
      nomineeName: formState.nomineeName,
      nomineeRelation: formState.nomineeRelation,
      nomineeSharePercent: 100,
      bankDetails: {
        accountNo: formState.bankAccountNo || '30495829104',
        ifsc: formState.ifsc || 'SBIN0004210',
        bankName: formState.bankName || 'State Bank of India',
        branch: 'Branch Desk'
      },
      status: 'Pending HR Verification',
      paymentMode: 'NEFT Transfer',
      utrNumber: '—',
      disbursedDate: '—',
      appliedDate: new Date().toISOString().slice(0, 10),
      hrApprover: '—',
      accountsApprover: '—',
      remarks: formState.remarks || 'Standard statutory claim.'
    };

    const nextList = [newRecord, ...records];
    setRecords(nextList);
    saveStoredGratuity(nextList);
    setIsApplyModalOpen(false);

    if (onNotify) {
      onNotify(`✓ Gratuity claim (${newRecord.claimId}) for ${newRecord.employeeName} submitted successfully.`, 'success');
    }
  };

  // Quick Approve Claim (HR -> Accounts)
  const handleApprove = (record) => {
    let nextStatus = 'Approved by Accounts';
    let hrApprover = record.hrApprover;
    let accountsApprover = record.accountsApprover;

    if (record.status === 'Pending HR Verification') {
      nextStatus = 'Approved by Accounts';
      hrApprover = 'HR Desk (Verified)';
      accountsApprover = 'Finance Accounts Lead (Sanctioned)';
    }

    const updated = {
      ...record,
      status: nextStatus,
      hrApprover,
      accountsApprover
    };

    const nextList = records.map((r) => (r.id === record.id ? updated : r));
    setRecords(nextList);
    saveStoredGratuity(nextList);
    if (selectedRecord && selectedRecord.id === record.id) {
      setSelectedRecord(updated);
    }

    if (onNotify) {
      onNotify(`✓ Gratuity claim ${record.claimId} approved for disbursement.`, 'success');
    }
  };

  // Disburse Claim (Payment Settlement)
  const handleDisburse = (record) => {
    const utr = prompt('Enter Bank UTR / Cheque Reference Number:', `NEFT${Date.now().toString().slice(-8)}`);
    if (!utr) return;

    const updated = {
      ...record,
      status: 'Disbursed & Settled',
      utrNumber: utr,
      disbursedDate: new Date().toISOString().slice(0, 10),
      accountsApprover: 'Disbursement Desk (Settled)'
    };

    const nextList = records.map((r) => (r.id === record.id ? updated : r));
    setRecords(nextList);
    saveStoredGratuity(nextList);
    if (selectedRecord && selectedRecord.id === record.id) {
      setSelectedRecord(updated);
    }

    if (onNotify) {
      onNotify(`✓ Gratuity claim ${record.claimId} marked as Disbursed & Settled (UTR: ${utr}).`, 'success');
    }
  };

  // Print Form L Voucher
  const handlePrintVoucher = (record) => {
    const printWin = window.open('', '_blank', 'width=850,height=900');
    if (!printWin) return;

    const contentHtml = `
      <html>
        <head>
          <title>Form L - Notice of Determination of Gratuity (${record.claimId})</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 30px; color: #0f172a; line-height: 1.5; }
            .header { text-align: center; border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 20px; }
            .title { font-size: 18px; font-weight: 800; text-transform: uppercase; margin: 0; }
            .sub { font-size: 12px; color: #475569; margin-top: 4px; }
            table { width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 13px; }
            th, td { border: 1px solid #cbd5e1; padding: 8px 12px; text-align: left; }
            th { background: #f1f5f9; font-weight: 700; }
            .total-row { font-weight: 800; background: #f8fafc; font-size: 14px; }
            .sign-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 50px; }
            .sign-box { border-top: 1px solid #0f172a; text-align: center; font-size: 12px; padding-top: 6px; }
            .stamp { border: 2px solid #16a34a; color: #16a34a; font-weight: 800; font-size: 13px; display: inline-block; padding: 4px 12px; border-radius: 4px; text-transform: uppercase; margin-top: 15px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">FORM L</div>
            <div class="sub">[See sub-rule (1) of Rule 8 of Payment of Gratuity (Central) Rules, 1972]</div>
            <div style="font-weight: 700; margin-top: 8px; font-size: 14px;">NOTICE OF DETERMINATION OF AMOUNT OF GRATUITY</div>
          </div>

          <p><strong>To:</strong> ${record.employeeName} (${record.employeeCode})<br/>
          <strong>Designation:</strong> ${record.designation} | <strong>Unit:</strong> ${record.clientName}</p>

          <p>This is to inform you that under the <strong>Payment of Gratuity Act, 1972</strong>, the gratuity payable upon cessation of your employment has been calculated as per statutory provisions detailed below:</p>

          <table>
            <tr><th>Particulars</th><th>Statutory Details</th></tr>
            <tr><td>Date of Appointment (Joining)</td><td>${record.joiningDate}</td></tr>
            <tr><td>Date of Separation</td><td>${record.exitDate}</td></tr>
            <tr><td>Continuous Service Rendered</td><td>${record.tenureYears} Years, ${record.tenureMonths} Months</td></tr>
            <tr><td>Completed Years for Gratuity (6-Month Rounding Rule)</td><td><strong>${record.roundedYears} Years</strong></td></tr>
            <tr><td>Last Drawn Monthly Basic Wage (+ DA)</td><td>₹${Number(record.lastDrawnBasic).toLocaleString('en-IN')}</td></tr>
            <tr><td>Daily Wage Rate (Basic / 26 Working Days)</td><td>₹${((record.lastDrawnBasic / 26)).toFixed(2)}</td></tr>
            <tr><td>Statutory Multiplier Factor</td><td>15 Days per Completed Year</td></tr>
            <tr class="total-row"><td>Gross Gratuity Payable: (15 × Basic × Years) / 26</td><td>₹${Number(record.gratuityAmount).toLocaleString('en-IN')}</td></tr>
            <tr><td>Exemption under Section 10(10) (Max ₹20,00,000)</td><td>₹${Number(record.taxExemptAmount).toLocaleString('en-IN')} (Tax-Free)</td></tr>
            <tr class="total-row"><td>Net Amount Disbursed / Payable</td><td>₹${Number(record.netPayable).toLocaleString('en-IN')}</td></tr>
          </table>

          <p><strong>Bank Account for Disbursement:</strong> A/c No: ${record.bankDetails?.accountNo || '—'} | IFSC: ${record.bankDetails?.ifsc || '—'} (${record.bankDetails?.bankName || 'Bank'})<br/>
          <strong>Payment Mode & Reference:</strong> ${record.paymentMode} | UTR: ${record.utrNumber || 'Pending'}</p>

          <div>
            <div class="stamp">✓ STATUTORY AUDIT VERIFIED</div>
          </div>

          <div class="sign-grid">
            <div class="sign-box">Authorized Signatory<br/><strong>HR Operations & Legal Desk</strong></div>
            <div class="sign-box">Authorized Signatory<br/><strong>Finance & Accounts Controller</strong></div>
          </div>
        </body>
      </html>
    `;

    printWin.document.open();
    printWin.document.write(contentHtml);
    printWin.document.close();
    printWin.focus();
    setTimeout(() => printWin.print(), 300);
  };

  // Export Gratuity Ledger to CSV
  const handleExportCSV = () => {
    const headers = [
      'Claim ID',
      'Employee Code',
      'Employee Name',
      'Designation',
      'Client',
      'Joining Date',
      'Exit Date',
      'Tenure Years',
      'Tenure Months',
      'Rounded Years',
      'Last Basic Wage',
      'Gratuity Amount',
      'Tax Exempt Amount',
      'Net Payable',
      'Status',
      'UTR Number',
      'Disbursed Date'
    ];

    const rows = filteredRecords.map((r) => [
      r.claimId,
      r.employeeCode,
      `"${r.employeeName}"`,
      `"${r.designation}"`,
      `"${r.clientName}"`,
      r.joiningDate,
      r.exitDate,
      r.tenureYears,
      r.tenureMonths,
      r.roundedYears,
      r.lastDrawnBasic,
      r.gratuityAmount,
      r.taxExemptAmount,
      r.netPayable,
      `"${r.status}"`,
      r.utrNumber,
      r.disbursedDate
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Gratuity_Register_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    if (onNotify) onNotify('✓ Gratuity register exported to CSV successfully.', 'info');
  };

  return (
    <div className={styles.container}>
      {/* 4 KPI Metrics Grid */}
      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <div className={styles.kpiLabelPrimary}>Total Gratuity Fund</div>
          <div className={styles.kpiValuePrimary}>{formatINR(metrics.totalLiabilityAmount)}</div>
          <div className={styles.kpiSubtextPrimary}>Total statutory claims & provisions</div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiLabelSuccess}>Disbursed & Settled</div>
          <div className={styles.kpiValueSuccess}>{formatINR(metrics.totalDisbursedAmount)}</div>
          <div className={styles.kpiSubtextSuccess}>{metrics.disbursedCount} claims settled with Form L</div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiLabelWarning}>Pending Claims</div>
          <div className={styles.kpiValueWarning}>{metrics.pendingCount}</div>
          <div className={styles.kpiSubtextWarning}>Awaiting HR / Accounts sign-off</div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiLabel}>Eligible Workforce (5+ Yrs)</div>
          <div className={styles.kpiValue}>{metrics.eligibleCount}</div>
          <div className={styles.kpiSubtext}>Continuous service compliance</div>
        </div>
      </div>

      {/* Statutory Policy Compliance Notice Banner */}
      <div className={styles.policyBanner}>
        <div className={styles.policyBannerText}>
          <ShieldCheck size={18} color="#16a34a" style={{ flexShrink: 0 }} />
          <div>
            <strong>Payment of Gratuity Act, 1972 Compliance:</strong> Formula: <code>(15 × Last Basic Wage × Completed Service Years) / 26</code>. 5 years continuous service required (waived for demise/disablement). 6+ months tenure is rounded to 1 full year. Tax-exempt up to ₹20,00,000 u/s 10(10).
          </div>
        </div>
        <span className={styles.statutoryBadge}>
          Form F & Form L Compliant
        </span>
      </div>

      {/* Filter & Action Toolbar */}
      <div className={styles.filterBar}>
        <div className={styles.filterLeft}>
          <div className={styles.searchBox}>
            <Search size={15} className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search by Employee ID, Name, Claim ID, Client..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select
            className={styles.selectField}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            {GRATUITY_STATUSES.map((st) => (
              <option key={st} value={st}>
                Status: {st}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.filterRight}>
          <button
            type="button"
            className={styles.btnSecondary}
            onClick={handleExportCSV}
            title="Download CSV register"
          >
            <Download size={14} />
            <span>Export Register</span>
          </button>

          <button
            type="button"
            className={styles.btnPrimary}
            onClick={() => setIsApplyModalOpen(true)}
          >
            <Plus size={15} />
            <span>Calculate & File Claim</span>
          </button>
        </div>
      </div>

      {/* Gratuity Ledger Table Card */}
      <div className={styles.tableCard}>
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Claim ID</th>
                <th>Employee Details</th>
                <th>Client / Unit</th>
                <th>Service Tenure</th>
                <th>Last Basic (+DA)</th>
                <th>Gratuity Amount</th>
                <th>Tax Status</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: '36px', color: '#64748b' }}>
                    No gratuity records matching current filters.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <div className={styles.empCode}>{r.claimId}</div>
                      <span style={{ fontSize: '11px', color: '#64748b' }}>{r.appliedDate}</span>
                    </td>
                    <td>
                      <div className={styles.empName}>{r.employeeName}</div>
                      <div className={styles.empSub}>{r.employeeCode} • {r.designation}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: '#1e293b' }}>{r.clientName}</div>
                      <span style={{ fontSize: '11px', color: '#64748b' }}>{r.department}</span>
                    </td>
                    <td>
                      <div>
                        {r.isEligible ? (
                          <span className={styles.tenurePill}>
                            {r.tenureYears}y {r.tenureMonths}m → <strong>{r.roundedYears} Yrs</strong>
                          </span>
                        ) : (
                          <span className={styles.tenureNotEligible}>
                            {r.tenureYears}y {r.tenureMonths}m (Ineligible)
                          </span>
                        )}
                      </div>
                      <span style={{ fontSize: '10.5px', color: '#64748b' }}>
                        {r.joiningDate} to {r.exitDate}
                      </span>
                    </td>
                    <td>
                      <strong style={{ color: '#0f172a' }}>{formatINR(r.lastDrawnBasic)}</strong>
                      <div style={{ fontSize: '10.5px', color: '#64748b' }}>
                        Rate: {formatINR(r.lastDrawnBasic / 26)}/day
                      </div>
                    </td>
                    <td>
                      <div className={styles.amountText}>{formatINR(r.gratuityAmount)}</div>
                      <span style={{ fontSize: '10.5px', color: '#16a34a' }}>
                        (15 × {r.roundedYears} × Basic)/26
                      </span>
                    </td>
                    <td>
                      <span className={styles.taxPill}>Sec 10(10) Exempt</span>
                    </td>
                    <td>
                      {r.status === 'Disbursed & Settled' && (
                        <span className={styles.badgeDisbursed}>
                          <CheckCircle2 size={12} /> Settled
                        </span>
                      )}
                      {r.status === 'Approved by Accounts' && (
                        <span className={styles.badgeApproved}>
                          <Check size={12} /> Approved
                        </span>
                      )}
                      {r.status === 'Pending HR Verification' && (
                        <span className={styles.badgePending}>
                          <Clock size={12} /> In Review
                        </span>
                      )}
                      {r.status === 'Rejected' && (
                        <span className={styles.badgeRejected}>
                          <AlertTriangle size={12} /> Rejected
                        </span>
                      )}
                    </td>
                    <td>
                      <div className={styles.actionGroup}>
                        <button
                          type="button"
                          className={styles.btnActionView}
                          onClick={() => {
                            setSelectedRecord(r);
                            setIsDrawerOpen(true);
                          }}
                          title="View Form L Notice & Settlement Statement"
                        >
                          <Eye size={12} /> Notice Form L
                        </button>

                        {r.status === 'Pending HR Verification' && (
                          <button
                            type="button"
                            className={styles.btnActionApprove}
                            onClick={() => handleApprove(r)}
                            title="Approve gratuity claim"
                          >
                            <Check size={12} /> Approve
                          </button>
                        )}

                        {r.status === 'Approved by Accounts' && (
                          <button
                            type="button"
                            style={{
                              padding: '5px 10px',
                              borderRadius: 6,
                              border: 'none',
                              background: '#2563eb',
                              color: '#ffffff',
                              fontSize: '12px',
                              fontWeight: 600,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4
                            }}
                            onClick={() => handleDisburse(r)}
                            title="Mark as disbursed with UTR"
                          >
                            <CreditCard size={12} /> Disburse
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* "+ Calculate & File Gratuity Claim" Modal */}
      {isApplyModalOpen && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modalCard}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Calculate & File Gratuity Claim</h2>
              <button
                type="button"
                className={styles.modalCloseBtn}
                onClick={() => setIsApplyModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveClaim}>
              <div className={styles.modalBody}>
                {/* Employee Selector */}
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Select Employee</label>
                  <select
                    className={styles.formInput}
                    value={formState.selectedEmpId}
                    onChange={(e) => handleEmployeeSelect(e.target.value)}
                  >
                    <option value="">-- Choose Employee (Pre-fill Profile & Salary) --</option>
                    {employees.map((emp) => (
                      <option key={emp.id || emp._id || emp.employeeId} value={emp.id || emp._id || emp.employeeId}>
                        {emp.employeeCode || emp.code || 'EMP'} - {emp.name || emp.employeeName} ({emp.designation || 'Staff'})
                      </option>
                    ))}
                  </select>
                </div>

                <div className={styles.formGrid2}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Employee Name *</label>
                    <input
                      type="text"
                      className={styles.formInput}
                      value={formState.employeeName}
                      onChange={(e) => setFormState({ ...formState, employeeName: e.target.value })}
                      required
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Employee Code</label>
                    <input
                      type="text"
                      className={styles.formInput}
                      value={formState.employeeCode}
                      onChange={(e) => setFormState({ ...formState, employeeCode: e.target.value })}
                    />
                  </div>
                </div>

                <div className={styles.formGrid2}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Client / Site Location</label>
                    <input
                      type="text"
                      className={styles.formInput}
                      value={formState.clientName}
                      onChange={(e) => setFormState({ ...formState, clientName: e.target.value })}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Designation</label>
                    <input
                      type="text"
                      className={styles.formInput}
                      value={formState.designation}
                      onChange={(e) => setFormState({ ...formState, designation: e.target.value })}
                    />
                  </div>
                </div>

                <div className={styles.formGrid2}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Date of Joining (DOJ) *</label>
                    <input
                      type="date"
                      className={styles.formInput}
                      value={formState.joiningDate}
                      onChange={(e) => setFormState({ ...formState, joiningDate: e.target.value })}
                      required
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Date of Separation / Exit *</label>
                    <input
                      type="date"
                      className={styles.formInput}
                      value={formState.exitDate}
                      onChange={(e) => setFormState({ ...formState, exitDate: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className={styles.formGrid2}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Last Drawn Basic Wage (+DA) (₹) *</label>
                    <input
                      type="number"
                      className={styles.formInput}
                      value={formState.lastDrawnBasic}
                      onChange={(e) => setFormState({ ...formState, lastDrawnBasic: Number(e.target.value) })}
                      min="1000"
                      required
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Reason for Separation *</label>
                    <select
                      className={styles.formInput}
                      value={formState.separationReason}
                      onChange={(e) => setFormState({ ...formState, separationReason: e.target.value })}
                    >
                      {SEPARATION_TYPES.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Real-time Calculation Breakdown Preview Card */}
                <div className={styles.calculationPreviewCard}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Coins size={15} color="#2563eb" />
                      Statutory Gratuity Calculation Preview
                    </span>
                    {liveCalculation.isEligible ? (
                      <span style={{ fontSize: '11px', fontWeight: 700, color: '#166534', background: '#dcfce7', padding: '2px 8px', border: '1px solid #bbf7d0', borderRadius: 4 }}>
                        ✓ Eligible (5+ Yrs / Waived)
                      </span>
                    ) : (
                      <span style={{ fontSize: '11px', fontWeight: 700, color: '#b91c1c', background: '#fee2e2', padding: '2px 8px', border: '1px solid #fecaca', borderRadius: 4 }}>
                        ✕ Tenure Less than 5 Years
                      </span>
                    )}
                  </div>

                  <div className={styles.previewRow}>
                    <span>Service Tenure:</span>
                    <span>
                      {liveCalculation.tenureYears} Years, {liveCalculation.tenureMonths} Months
                      {liveCalculation.tenureMonths >= 6 && (
                        <strong style={{ color: '#2563eb', marginLeft: 4 }}>
                          (Rounded up to {liveCalculation.roundedYears} Years)
                        </strong>
                      )}
                    </span>
                  </div>

                  <div className={styles.previewRow}>
                    <span>Daily Wage Rate (Basic / 26):</span>
                    <span>{formatINR(liveCalculation.dailyRate)} / day</span>
                  </div>

                  <div className={styles.previewRow}>
                    <span>Statutory Formula Applied:</span>
                    <code>(15 × {formatINR(formState.lastDrawnBasic)} × {liveCalculation.roundedYears}) / 26</code>
                  </div>

                  <div className={styles.previewRowBold}>
                    <span>Calculated Gratuity Payable:</span>
                    <span style={{ fontSize: '16px', color: '#16a34a' }}>
                      {formatINR(liveCalculation.gratuityAmount)}
                    </span>
                  </div>

                  <div className={styles.previewRow}>
                    <span style={{ fontSize: '11.5px', color: '#64748b' }}>Section 10(10) Tax Exemption:</span>
                    <span style={{ fontSize: '11.5px', fontWeight: 600, color: '#166534' }}>
                      {formatINR(liveCalculation.taxExemptAmount)} (100% Tax-Free)
                    </span>
                  </div>
                </div>

                {/* Nominee & Bank Details Section */}
                <div className={styles.formGrid2}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Nominee Name (Form F)</label>
                    <input
                      type="text"
                      className={styles.formInput}
                      placeholder="Nominee Name"
                      value={formState.nomineeName}
                      onChange={(e) => setFormState({ ...formState, nomineeName: e.target.value })}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Nominee Relationship</label>
                    <select
                      className={styles.formInput}
                      value={formState.nomineeRelation}
                      onChange={(e) => setFormState({ ...formState, nomineeRelation: e.target.value })}
                    >
                      <option value="Spouse">Spouse</option>
                      <option value="Son">Son</option>
                      <option value="Daughter">Daughter</option>
                      <option value="Father">Father</option>
                      <option value="Mother">Mother</option>
                      <option value="Brother">Brother</option>
                    </select>
                  </div>
                </div>

                <div className={styles.formGrid2}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Bank Account No</label>
                    <input
                      type="text"
                      className={styles.formInput}
                      placeholder="E.g. 30495829104"
                      value={formState.bankAccountNo}
                      onChange={(e) => setFormState({ ...formState, bankAccountNo: e.target.value })}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Bank IFSC Code</label>
                    <input
                      type="text"
                      className={styles.formInput}
                      placeholder="E.g. SBIN0004210"
                      value={formState.ifsc}
                      onChange={(e) => setFormState({ ...formState, ifsc: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button
                  type="button"
                  className={styles.btnSecondary}
                  onClick={() => setIsApplyModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={styles.btnPrimary}
                >
                  Submit Gratuity Claim
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Form L Notice & Gratuity Settlement Voucher Drawer */}
      {isDrawerOpen && selectedRecord && (
        <div className={styles.drawerBackdrop} onClick={() => setIsDrawerOpen(false)}>
          <div className={styles.drawerCard} onClick={(e) => e.stopPropagation()}>
            <div className={styles.drawerHeader}>
              <div>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>
                  Form L Notice & Settlement Statement
                </h3>
                <span style={{ fontSize: '12px', color: '#64748b' }}>
                  Claim Reference: {selectedRecord.claimId}
                </span>
              </div>
              <button
                type="button"
                className={styles.modalCloseBtn}
                onClick={() => setIsDrawerOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <div className={styles.drawerBody}>
              {/* Printable Form L Notice Box */}
              <div className={styles.voucherPrintBox}>
                <div className={styles.voucherHeader}>
                  <h4 className={styles.voucherTitle}>FORM L — NOTICE OF DETERMINATION OF GRATUITY</h4>
                  <div className={styles.voucherSubtitle}>
                    [See Rule 8(1) of Payment of Gratuity (Central) Rules, 1972]
                  </div>
                </div>

                <div className={styles.voucherMetaGrid}>
                  <div><strong>Employee:</strong> {selectedRecord.employeeName}</div>
                  <div><strong>Code:</strong> {selectedRecord.employeeCode}</div>
                  <div><strong>Designation:</strong> {selectedRecord.designation}</div>
                  <div><strong>Department:</strong> {selectedRecord.department}</div>
                  <div><strong>Client Unit:</strong> {selectedRecord.clientName}</div>
                  <div><strong>Reason:</strong> {selectedRecord.separationReason}</div>
                </div>

                <div className={styles.voucherSectionTitle}>1. Service Tenure & Statutory Eligibility</div>
                <div className={styles.voucherRow}>
                  <span>Date of Joining:</span>
                  <strong>{selectedRecord.joiningDate}</strong>
                </div>
                <div className={styles.voucherRow}>
                  <span>Date of Cessation / Exit:</span>
                  <strong>{selectedRecord.exitDate}</strong>
                </div>
                <div className={styles.voucherRow}>
                  <span>Actual Tenure:</span>
                  <span>{selectedRecord.tenureYears} Years, {selectedRecord.tenureMonths} Months</span>
                </div>
                <div className={styles.voucherRow}>
                  <span>Completed Service Years (Rounded as per Law):</span>
                  <strong style={{ color: '#2563eb' }}>{selectedRecord.roundedYears} Completed Years</strong>
                </div>

                <div className={styles.voucherSectionTitle}>2. Wage Computation & Statutory Multiplier</div>
                <div className={styles.voucherRow}>
                  <span>Last Drawn Monthly Basic Wage (+DA):</span>
                  <strong>{formatINR(selectedRecord.lastDrawnBasic)}</strong>
                </div>
                <div className={styles.voucherRow}>
                  <span>Statutory Divisor (Working Days):</span>
                  <span>26 Days</span>
                </div>
                <div className={styles.voucherRow}>
                  <span>Calculated Daily Wage Rate:</span>
                  <span>{formatINR(selectedRecord.lastDrawnBasic / 26)}</span>
                </div>
                <div className={styles.voucherRow}>
                  <span>Statutory Multiplier Rate:</span>
                  <span>15 Days per Completed Year</span>
                </div>

                <div className={styles.voucherTotalRow}>
                  <span>Statutory Gratuity Amount:</span>
                  <span>{formatINR(selectedRecord.gratuityAmount)}</span>
                </div>

                <div className={styles.voucherRow}>
                  <span>Tax Exemption Limit u/s 10(10):</span>
                  <span style={{ color: '#16a34a', fontWeight: 600 }}>
                    {formatINR(selectedRecord.taxExemptAmount)} (Exempt)
                  </span>
                </div>

                <div className={styles.voucherTotalRow} style={{ borderBottom: '2px solid #0f172a' }}>
                  <span>Net Payable Amount:</span>
                  <span style={{ color: '#16a34a' }}>{formatINR(selectedRecord.netPayable)}</span>
                </div>

                <div className={styles.voucherSectionTitle}>3. Nominee & Bank Account For Credit</div>
                <div className={styles.voucherRow}>
                  <span>Nominee (Form F):</span>
                  <span>{selectedRecord.nomineeName} ({selectedRecord.nomineeRelation})</span>
                </div>
                <div className={styles.voucherRow}>
                  <span>Bank Account No:</span>
                  <strong>{selectedRecord.bankDetails?.accountNo || '—'}</strong>
                </div>
                <div className={styles.voucherRow}>
                  <span>Bank & IFSC:</span>
                  <span>{selectedRecord.bankDetails?.bankName} ({selectedRecord.bankDetails?.ifsc})</span>
                </div>
                <div className={styles.voucherRow}>
                  <span>Payment Status:</span>
                  <strong>{selectedRecord.status}</strong>
                </div>
                {selectedRecord.utrNumber && selectedRecord.utrNumber !== '—' && (
                  <div className={styles.voucherRow}>
                    <span>Bank UTR Reference:</span>
                    <strong style={{ color: '#16a34a' }}>{selectedRecord.utrNumber}</strong>
                  </div>
                )}

                <div className={styles.signBlock}>
                  <div className={styles.signLine}>
                    HR Approver: {selectedRecord.hrApprover || 'Pending'}<br/>
                    <strong>HR Legal & Operations Sign-off</strong>
                  </div>
                  <div className={styles.signLine}>
                    Accounts: {selectedRecord.accountsApprover || 'Pending'}<br/>
                    <strong>Finance & Treasury Sign-off</strong>
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.drawerFooter}>
              <button
                type="button"
                className={styles.btnSecondary}
                onClick={() => handlePrintVoucher(selectedRecord)}
              >
                <Printer size={14} /> Print Notice Form L
              </button>

              <div style={{ display: 'flex', gap: 10 }}>
                {selectedRecord.status === 'Pending HR Verification' && (
                  <button
                    type="button"
                    className={styles.btnActionApprove}
                    style={{ padding: '8px 16px', fontSize: '13px' }}
                    onClick={() => handleApprove(selectedRecord)}
                  >
                    <Check size={14} /> Approve Gratuity
                  </button>
                )}

                {selectedRecord.status === 'Approved by Accounts' && (
                  <button
                    type="button"
                    className={styles.btnPrimary}
                    onClick={() => handleDisburse(selectedRecord)}
                  >
                    <CreditCard size={14} /> Settle & Disburse
                  </button>
                )}

                <button
                  type="button"
                  className={styles.btnSecondary}
                  onClick={() => setIsDrawerOpen(false)}
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

