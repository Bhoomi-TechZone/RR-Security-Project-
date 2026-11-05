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
  Percent,
  CalendarDays,
  Users
} from 'lucide-react';
import styles from './BonusManagementTab.module.css';
import {
  BONUS_CONSTANTS,
  BONUS_TYPES,
  BONUS_STATUSES,
  FINANCIAL_YEARS,
  calculateBonusDetails,
  getStoredBonus,
  saveStoredBonus,
  calculateBonusMetrics
} from '../../data/bonusData';

const formatINR = (val) => `₹${Number(val || 0).toLocaleString('en-IN')}`;

export default function BonusManagementTab({
  employees = [],
  onNotify
}) {
  const [records, setRecords] = useState(() => getStoredBonus());
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [fyFilter, setFyFilter] = useState(FINANCIAL_YEARS[0]);

  // Modals & Drawers
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // New Bonus Declaration Form State
  const [formState, setFormState] = useState({
    selectedEmpId: '',
    employeeName: '',
    employeeCode: '',
    designation: '',
    department: '',
    clientName: '',
    monthlyBasic: 15000,
    workedDays: 295,
    standardYearDays: BONUS_CONSTANTS.STANDARD_YEAR_WORKING_DAYS,
    bonusPercent: 8.33,
    interimAdvance: 0,
    bonusType: BONUS_TYPES[0],
    financialYear: 'FY 2026-2027',
    remarks: ''
  });

  // Calculate live preview in modal
  const livePreview = calculateBonusDetails({
    monthlyBasic: formState.monthlyBasic,
    workedDays: formState.workedDays,
    bonusPercent: formState.bonusPercent,
    interimAdvance: formState.interimAdvance,
    standardYearDays: formState.standardYearDays
  });

  // KPI Metrics
  const metrics = calculateBonusMetrics(records);

  // Filter records
  const filteredRecords = records.filter((r) => {
    const matchesSearch =
      r.employeeName?.toLowerCase().includes(search.toLowerCase()) ||
      r.employeeCode?.toLowerCase().includes(search.toLowerCase()) ||
      r.batchId?.toLowerCase().includes(search.toLowerCase()) ||
      r.clientName?.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === 'All' || r.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Handle Employee select in modal
  const handleEmployeeSelect = (empId) => {
    const emp = employees.find((e) => (e.id || e._id || e.employeeId) === empId);
    if (!emp) return;

    const basicSalary = emp.basicSalary || emp.salary?.basic || 15000;

    setFormState((prev) => ({
      ...prev,
      selectedEmpId: empId,
      employeeName: emp.name || emp.employeeName || 'Staff Member',
      employeeCode: emp.employeeCode || emp.code || 'RR-EMP-000',
      designation: emp.designation || 'Field Staff',
      department: emp.department || 'Operations',
      clientName: emp.clientName || emp.companyName || 'Corporate Client',
      monthlyBasic: basicSalary,
      workedDays: 290
    }));
  };

  // Submit New Bonus Calculation
  const handleSaveBonus = (e) => {
    e.preventDefault();

    if (!formState.employeeName) {
      alert('Please select or specify an employee.');
      return;
    }

    if (!livePreview.isEligible) {
      const confirmIneligible = window.confirm(
        'Warning: The employee does not meet standard eligibility criteria under the Payment of Bonus Act (Basic > ₹21,000 or Worked Days < 30). Do you still wish to submit as ex-gratia?'
      );
      if (!confirmIneligible) return;
    }

    const nextId = `BON-FY26-${String(records.length + 1).padStart(3, '0')}`;
    const nextFormC = `FC-2026-${String(records.length + 80).padStart(3, '0')}`;

    const newRecord = {
      id: `bon_${Date.now()}`,
      batchId: nextId,
      employeeId: formState.selectedEmpId || 'EMP-MANUAL',
      employeeCode: formState.employeeCode || 'RR-SEC-000',
      employeeName: formState.employeeName,
      designation: formState.designation,
      department: formState.department,
      clientName: formState.clientName,
      financialYear: formState.financialYear,
      monthlyBasic: formState.monthlyBasic,
      workedDays: formState.workedDays,
      standardYearDays: formState.standardYearDays,
      calculationWageMonthly: livePreview.calculationWageMonthly,
      annualCalculationBase: livePreview.annualCalculationBase,
      bonusPercent: formState.bonusPercent,
      grossBonus: livePreview.grossBonus,
      interimAdvance: livePreview.interimAdvance,
      netBonusPayable: livePreview.netBonusPayable,
      bonusType: formState.bonusType,
      status: 'Pending Approval',
      paymentMode: 'NEFT Transfer',
      utrNumber: '—',
      disbursedDate: '—',
      approvedBy: '—',
      formCSerialNo: nextFormC,
      remarks: formState.remarks || 'Standard statutory calculation.'
    };

    const nextList = [newRecord, ...records];
    setRecords(nextList);
    saveStoredBonus(nextList);
    setIsApplyModalOpen(false);

    if (onNotify) {
      onNotify(`✓ Bonus calculation (${newRecord.batchId}) for ${newRecord.employeeName} saved successfully.`, 'success');
    }
  };

  // Approve Bonus
  const handleApprove = (record) => {
    const updated = {
      ...record,
      status: 'Approved for Payout',
      approvedBy: 'Accounts Lead (Sanctioned)'
    };

    const nextList = records.map((r) => (r.id === record.id ? updated : r));
    setRecords(nextList);
    saveStoredBonus(nextList);
    if (selectedRecord && selectedRecord.id === record.id) {
      setSelectedRecord(updated);
    }

    if (onNotify) {
      onNotify(`✓ Bonus ${record.batchId} approved for disbursement.`, 'success');
    }
  };

  // Disburse Bonus (Payment Settlement)
  const handleDisburse = (record) => {
    const utr = prompt('Enter Bank UTR / Payment Reference Number:', `NEFT${Date.now().toString().slice(-8)}`);
    if (!utr) return;

    const updated = {
      ...record,
      status: 'Disbursed & Settled',
      utrNumber: utr,
      disbursedDate: new Date().toISOString().slice(0, 10),
      approvedBy: 'Treasury Desk (Disbursed)'
    };

    const nextList = records.map((r) => (r.id === record.id ? updated : r));
    setRecords(nextList);
    saveStoredBonus(nextList);
    if (selectedRecord && selectedRecord.id === record.id) {
      setSelectedRecord(updated);
    }

    if (onNotify) {
      onNotify(`✓ Bonus ${record.batchId} marked as Disbursed (UTR: ${utr}).`, 'success');
    }
  };

  // Print Form C Statement
  const handlePrintFormC = (record) => {
    const printWin = window.open('', '_blank', 'width=850,height=900');
    if (!printWin) return;

    const contentHtml = `
      <html>
        <head>
          <title>Form C - Bonus Register Statement (${record.batchId})</title>
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
            .stamp { border: 2px solid #7c3aed; color: #7c3aed; font-weight: 800; font-size: 13px; display: inline-block; padding: 4px 12px; border-radius: 4px; text-transform: uppercase; margin-top: 15px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">FORM C</div>
            <div class="sub">[See Rule 4(c) of Payment of Bonus Rules, 1975]</div>
            <div style="font-weight: 700; margin-top: 8px; font-size: 14px;">BONUS PAID TO EMPLOYEES FOR THE ACCOUNTING YEAR ${record.financialYear}</div>
          </div>

          <p><strong>Employee Name:</strong> ${record.employeeName} (${record.employeeCode})<br/>
          <strong>Designation:</strong> ${record.designation} | <strong>Unit:</strong> ${record.clientName}<br/>
          <strong>Form C Serial No:</strong> ${record.formCSerialNo} | <strong>Scheme:</strong> ${record.bonusType}</p>

          <table>
            <tr><th>Particulars</th><th>Statutory Details</th></tr>
            <tr><td>Total Working Days in Accounting Year</td><td>${record.standardYearDays} Days</td></tr>
            <tr><td>Days Worked by the Employee (Attendance)</td><td>${record.workedDays} Days</td></tr>
            <tr><td>Actual Monthly Basic Wage (+DA)</td><td>₹${Number(record.monthlyBasic).toLocaleString('en-IN')}</td></tr>
            <tr><td>Statutory Calculation Base (Capped at ₹7,000 u/s 12)</td><td>₹${Number(record.calculationWageMonthly).toLocaleString('en-IN')} / month</td></tr>
            <tr><td>Prorated Annual Wage Base for Calculation</td><td>₹${Number(record.annualCalculationBase).toLocaleString('en-IN')}</td></tr>
            <tr><td>Statutory Bonus Percentage Declared</td><td><strong>${record.bonusPercent}%</strong> (Statutory Range: 8.33% - 20%)</td></tr>
            <tr class="total-row"><td>Gross Statutory Bonus Payable</td><td>₹${Number(record.grossBonus).toLocaleString('en-IN')}</td></tr>
            <tr><td>Deduction: Interim / Puja / Advance Paid</td><td>(-) ₹${Number(record.interimAdvance).toLocaleString('en-IN')}</td></tr>
            <tr class="total-row"><td>Net Amount of Bonus Paid / Payable</td><td>₹${Number(record.netBonusPayable).toLocaleString('en-IN')}</td></tr>
            <tr><td>Payment Mode & Bank Reference</td><td>${record.paymentMode} | UTR: ${record.utrNumber || 'Pending'}</td></tr>
            <tr><td>Date of Payment Disbursement</td><td>${record.disbursedDate || 'Scheduled'}</td></tr>
          </table>

          <div>
            <div class="stamp">✓ STATUTORY FORM C AUDITED</div>
          </div>

          <div class="sign-grid">
            <div class="sign-box">Signature of Employer / Authorized Agent<br/><strong>HR Operations & Legal Desk</strong></div>
            <div class="sign-box">Employee Signature / Acknowledgment<br/><strong>(${record.employeeName})</strong></div>
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

  // Export Form C to CSV
  const handleExportCSV = () => {
    const headers = [
      'Form C S.No',
      'Batch ID',
      'Employee Code',
      'Employee Name',
      'Designation',
      'Client',
      'Worked Days',
      'Standard Days',
      'Monthly Basic',
      'Calculation Base',
      'Annual Base',
      'Bonus %',
      'Gross Bonus',
      'Interim Advance',
      'Net Bonus',
      'Status',
      'UTR',
      'Date'
    ];

    const rows = filteredRecords.map((r) => [
      r.formCSerialNo,
      r.batchId,
      r.employeeCode,
      `"${r.employeeName}"`,
      `"${r.designation}"`,
      `"${r.clientName}"`,
      r.workedDays,
      r.standardYearDays,
      r.monthlyBasic,
      r.calculationWageMonthly,
      r.annualCalculationBase,
      r.bonusPercent,
      r.grossBonus,
      r.interimAdvance,
      r.netBonusPayable,
      `"${r.status}"`,
      r.utrNumber,
      r.disbursedDate
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Form_C_Bonus_Register_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    if (onNotify) onNotify('✓ Form C Bonus Register exported to CSV successfully.', 'info');
  };

  return (
    <div className={styles.container}>
      {/* 4 KPI Metrics Grid */}
      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <div className={styles.kpiLabelPrimary}>Total Bonus Declared</div>
          <div className={styles.kpiValuePrimary}>{formatINR(metrics.totalGrossBonus)}</div>
          <div className={styles.kpiSubtextPrimary}>Annual statutory allocation</div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiLabelSuccess}>Disbursed Net Bonus</div>
          <div className={styles.kpiValueSuccess}>{formatINR(metrics.totalNetDisbursed)}</div>
          <div className={styles.kpiSubtextSuccess}>{metrics.disbursedCount} workforce members settled</div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiLabelWarning}>Pending Disbursements</div>
          <div className={styles.kpiValueWarning}>{formatINR(metrics.totalPendingPayout)}</div>
          <div className={styles.kpiSubtextWarning}>{metrics.pendingCount} records scheduled</div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiLabelPurple}>Avg Bonus Rate</div>
          <div className={styles.kpiValuePurple}>{metrics.avgBonusPercent}%</div>
          <div className={styles.kpiSubtextPurple}>Statutory min 8.33% to max 20%</div>
        </div>
      </div>

      {/* Statutory Policy Compliance Notice Banner */}
      <div className={styles.policyBanner}>
        <div className={styles.policyBannerText}>
          <ShieldCheck size={18} color="#7c3aed" style={{ flexShrink: 0 }} />
          <div>
            <strong>Payment of Bonus Act, 1965 Compliance:</strong> Eligible for employees drawing Basic (+DA) up to <code>₹21,000/month</code> with minimum <code>30 working days</code>. Calculation base capped at <code>₹7,000/month</code> (or Min Wage). Statutory range: <strong>8.33% (Min) to 20% (Max)</strong>. Form A, B, C compliant.
          </div>
        </div>
        <span className={styles.statutoryBadge}>
          Form C Register Compliant
        </span>
      </div>

      {/* Filter & Action Toolbar */}
      <div className={styles.filterBar}>
        <div className={styles.filterLeft}>
          <div className={styles.searchBox}>
            <Search size={15} className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search by Employee ID, Name, Batch ID, Client..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select
            className={styles.selectField}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            {BONUS_STATUSES.map((st) => (
              <option key={st} value={st}>
                Status: {st}
              </option>
            ))}
          </select>

          <select
            className={styles.selectField}
            value={fyFilter}
            onChange={(e) => setFyFilter(e.target.value)}
          >
            {FINANCIAL_YEARS.map((fy) => (
              <option key={fy} value={fy}>
                {fy}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.filterRight}>
          <button
            type="button"
            className={styles.btnSecondary}
            onClick={handleExportCSV}
            title="Download Form C CSV Register"
          >
            <Download size={14} />
            <span>Export Form C</span>
          </button>

          <button
            type="button"
            className={styles.btnPrimary}
            onClick={() => setIsApplyModalOpen(true)}
          >
            <Plus size={15} />
            <span>Calculate Bonus</span>
          </button>
        </div>
      </div>

      {/* Bonus Ledger Table Card */}
      <div className={styles.tableCard}>
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Batch / Form C S.No</th>
                <th>Employee Details</th>
                <th>Client / Unit</th>
                <th>Days Worked (Ratio)</th>
                <th>Monthly Basic</th>
                <th>Calc Base</th>
                <th>Bonus %</th>
                <th>Net Bonus</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan="10" style={{ textAlign: 'center', padding: '36px', color: '#64748b' }}>
                    No bonus records matching current filters.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <div className={styles.empCode}>{r.batchId}</div>
                      <span style={{ fontSize: '11px', color: '#7c3aed', fontWeight: 600 }}>{r.formCSerialNo}</span>
                    </td>
                    <td>
                      <div className={styles.empName}>{r.employeeName}</div>
                      <div className={styles.empSub}>{r.employeeCode} • {r.designation}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: '#1e293b' }}>{r.clientName}</div>
                      <span style={{ fontSize: '11px', color: '#64748b' }}>{r.financialYear}</span>
                    </td>
                    <td>
                      <span className={styles.daysPill}>
                        {r.workedDays} / {r.standardYearDays} d
                      </span>
                      <div style={{ fontSize: '10.5px', color: '#64748b', marginTop: 2 }}>
                        {Math.round((r.workedDays / r.standardYearDays) * 100)}% service
                      </div>
                    </td>
                    <td>
                      <strong style={{ color: '#0f172a' }}>{formatINR(r.monthlyBasic)}</strong>
                    </td>
                    <td>
                      <strong style={{ color: '#2563eb' }}>{formatINR(r.calculationWageMonthly)}</strong>
                      <div style={{ fontSize: '10.5px', color: '#64748b' }}>Capped @ ₹7k</div>
                    </td>
                    <td>
                      <span className={styles.bonusPercentBadge}>{r.bonusPercent}%</span>
                    </td>
                    <td>
                      <div className={styles.amountText}>{formatINR(r.netBonusPayable)}</div>
                      {r.interimAdvance > 0 && (
                        <div style={{ fontSize: '10.5px', color: '#dc2626' }}>
                          (-{formatINR(r.interimAdvance)} adv)
                        </div>
                      )}
                    </td>
                    <td>
                      {r.status === 'Disbursed & Settled' && (
                        <span className={styles.badgeDisbursed}>
                          <CheckCircle2 size={12} /> Disbursed
                        </span>
                      )}
                      {r.status === 'Approved for Payout' && (
                        <span className={styles.badgeApproved}>
                          <Check size={12} /> Approved
                        </span>
                      )}
                      {r.status === 'Pending Approval' && (
                        <span className={styles.badgePending}>
                          <Clock size={12} /> In Review
                        </span>
                      )}
                      {r.status === 'Eligible (Calculated)' && (
                        <span className={styles.badgeEligible}>
                          <Sparkles size={12} /> Calculated
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
                          title="View Form C Register & Statement"
                        >
                          <Eye size={12} /> Form C
                        </button>

                        {(r.status === 'Pending Approval' || r.status === 'Eligible (Calculated)') && (
                          <button
                            type="button"
                            className={styles.btnActionApprove}
                            onClick={() => handleApprove(r)}
                            title="Approve bonus calculation"
                          >
                            <Check size={12} /> Approve
                          </button>
                        )}

                        {r.status === 'Approved for Payout' && (
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
                            title="Disburse bonus payment"
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

      {/* "+ Declare & Calculate Bonus" Modal */}
      {isApplyModalOpen && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modalCard}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Declare & Calculate Bonus</h2>
              <button
                type="button"
                className={styles.modalCloseBtn}
                onClick={() => setIsApplyModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveBonus}>
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
                    <label className={styles.formLabel}>Client / Unit</label>
                    <input
                      type="text"
                      className={styles.formInput}
                      value={formState.clientName}
                      onChange={(e) => setFormState({ ...formState, clientName: e.target.value })}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Financial Year</label>
                    <select
                      className={styles.formInput}
                      value={formState.financialYear}
                      onChange={(e) => setFormState({ ...formState, financialYear: e.target.value })}
                    >
                      <option value="FY 2026-2027">FY 2026-2027</option>
                      <option value="FY 2025-2026">FY 2025-2026</option>
                    </select>
                  </div>
                </div>

                <div className={styles.formGrid2}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Monthly Basic Wage (+DA) (₹) *</label>
                    <input
                      type="number"
                      className={styles.formInput}
                      value={formState.monthlyBasic}
                      onChange={(e) => setFormState({ ...formState, monthlyBasic: Number(e.target.value) })}
                      min="1000"
                      required
                    />
                    <span style={{ fontSize: '11px', color: '#64748b' }}>
                      Eligibility limit: ≤ ₹21,000/month
                    </span>
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Days Worked in Year *</label>
                    <input
                      type="number"
                      className={styles.formInput}
                      value={formState.workedDays}
                      onChange={(e) => setFormState({ ...formState, workedDays: Number(e.target.value) })}
                      min="1"
                      max="365"
                      required
                    />
                    <span style={{ fontSize: '11px', color: '#64748b' }}>
                      Min 30 days required for eligibility
                    </span>
                  </div>
                </div>

                <div className={styles.formGrid2}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Bonus Percentage (%) *</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <input
                        type="range"
                        min="8.33"
                        max="20"
                        step="0.01"
                        value={formState.bonusPercent}
                        onChange={(e) => setFormState({ ...formState, bonusPercent: Number(e.target.value) })}
                        style={{ flex: 1 }}
                      />
                      <input
                        type="number"
                        step="0.01"
                        className={styles.formInput}
                        style={{ width: '85px' }}
                        value={formState.bonusPercent}
                        onChange={(e) => setFormState({ ...formState, bonusPercent: Number(e.target.value) })}
                      />
                    </div>
                    <span style={{ fontSize: '11px', color: '#7c3aed' }}>
                      Statutory Range: 8.33% (Min) to 20.00% (Max)
                    </span>
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Interim / Festive Advance Paid (₹)</label>
                    <input
                      type="number"
                      className={styles.formInput}
                      value={formState.interimAdvance}
                      onChange={(e) => setFormState({ ...formState, interimAdvance: Number(e.target.value) })}
                      min="0"
                    />
                    <span style={{ fontSize: '11px', color: '#64748b' }}>
                      Deducted from gross bonus
                    </span>
                  </div>
                </div>

                {/* Real-time Statutory Bonus Calculation Preview Card */}
                <div className={styles.calculationPreviewCard}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#4c1d95', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Percent size={15} color="#7c3aed" />
                      Statutory Bonus Computation Preview (Act 1965)
                    </span>
                    {livePreview.isEligible ? (
                      <span style={{ fontSize: '11px', fontWeight: 700, color: '#166534', background: '#dcfce7', padding: '2px 8px', border: '1px solid #bbf7d0', borderRadius: 4 }}>
                        ✓ Eligible under Act
                      </span>
                    ) : (
                      <span style={{ fontSize: '11px', fontWeight: 700, color: '#b91c1c', background: '#fee2e2', padding: '2px 8px', border: '1px solid #fecaca', borderRadius: 4 }}>
                        ✕ Not Statutory Eligible
                      </span>
                    )}
                  </div>

                  <div className={styles.previewRow}>
                    <span>Statutory Monthly Wage Base (Capped at ₹7,000):</span>
                    <strong>{formatINR(livePreview.calculationWageMonthly)} / month</strong>
                  </div>

                  <div className={styles.previewRow}>
                    <span>Prorated Annual Wage Base ({formState.workedDays}/{formState.standardYearDays} days):</span>
                    <span>{formatINR(livePreview.annualCalculationBase)}</span>
                  </div>

                  <div className={styles.previewRow}>
                    <span>Gross Bonus ({formState.bonusPercent}% of Annual Base):</span>
                    <strong style={{ color: '#0f172a' }}>{formatINR(livePreview.grossBonus)}</strong>
                  </div>

                  {livePreview.interimAdvance > 0 && (
                    <div className={styles.previewRow}>
                      <span style={{ color: '#b91c1c' }}>Less: Interim / Festive Advance:</span>
                      <span style={{ color: '#b91c1c' }}>- {formatINR(livePreview.interimAdvance)}</span>
                    </div>
                  )}

                  <div className={styles.previewRowBold}>
                    <span>Net Bonus Payable to Employee:</span>
                    <span style={{ fontSize: '16px', color: '#16a34a' }}>
                      {formatINR(livePreview.netBonusPayable)}
                    </span>
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
                  Save Bonus Calculation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Form C Statutory Bonus Register Drawer */}
      {isDrawerOpen && selectedRecord && (
        <div className={styles.drawerBackdrop} onClick={() => setIsDrawerOpen(false)}>
          <div className={styles.drawerCard} onClick={(e) => e.stopPropagation()}>
            <div className={styles.drawerHeader}>
              <div>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>
                  Form C Statutory Bonus Register
                </h3>
                <span style={{ fontSize: '12px', color: '#64748b' }}>
                  Serial: {selectedRecord.formCSerialNo} • Batch: {selectedRecord.batchId}
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
              {/* Printable Form C Notice Box */}
              <div className={styles.voucherPrintBox}>
                <div className={styles.voucherHeader}>
                  <h4 className={styles.voucherTitle}>FORM C — BONUS REGISTER</h4>
                  <div className={styles.voucherSubtitle}>
                    [See Rule 4(c) of the Payment of Bonus Rules, 1975]
                  </div>
                </div>

                <div className={styles.voucherMetaGrid}>
                  <div><strong>Employee:</strong> {selectedRecord.employeeName}</div>
                  <div><strong>Code:</strong> {selectedRecord.employeeCode}</div>
                  <div><strong>Designation:</strong> {selectedRecord.designation}</div>
                  <div><strong>Department:</strong> {selectedRecord.department}</div>
                  <div><strong>Client Unit:</strong> {selectedRecord.clientName}</div>
                  <div><strong>Year:</strong> {selectedRecord.financialYear}</div>
                </div>

                <div className={styles.voucherSectionTitle}>1. Days Worked & Wage Details</div>
                <div className={styles.voucherRow}>
                  <span>Days Worked in the Accounting Year:</span>
                  <strong>{selectedRecord.workedDays} Days</strong>
                </div>
                <div className={styles.voucherRow}>
                  <span>Standard Year Working Days:</span>
                  <span>{selectedRecord.standardYearDays} Days</span>
                </div>
                <div className={styles.voucherRow}>
                  <span>Actual Monthly Basic Wage (+DA):</span>
                  <strong>{formatINR(selectedRecord.monthlyBasic)}</strong>
                </div>
                <div className={styles.voucherRow}>
                  <span>Statutory Calculation Base (Capped at ₹7,000):</span>
                  <strong style={{ color: '#2563eb' }}>{formatINR(selectedRecord.calculationWageMonthly)}</strong>
                </div>

                <div className={styles.voucherSectionTitle}>2. Statutory Bonus Computation</div>
                <div className={styles.voucherRow}>
                  <span>Prorated Annual Wage Base:</span>
                  <span>{formatINR(selectedRecord.annualCalculationBase)}</span>
                </div>
                <div className={styles.voucherRow}>
                  <span>Declared Bonus Rate:</span>
                  <strong>{selectedRecord.bonusPercent}%</strong>
                </div>
                <div className={styles.voucherTotalRow}>
                  <span>Gross Statutory Bonus:</span>
                  <span>{formatINR(selectedRecord.grossBonus)}</span>
                </div>

                <div className={styles.voucherRow}>
                  <span>Deduction (Interim / Advance Paid):</span>
                  <span style={{ color: '#dc2626' }}>
                    {selectedRecord.interimAdvance > 0 ? `- ${formatINR(selectedRecord.interimAdvance)}` : 'Nil'}
                  </span>
                </div>

                <div className={styles.voucherTotalRow} style={{ borderBottom: '2px solid #0f172a' }}>
                  <span>Net Bonus Payable / Paid:</span>
                  <span style={{ color: '#16a34a' }}>{formatINR(selectedRecord.netBonusPayable)}</span>
                </div>

                <div className={styles.voucherSectionTitle}>3. Payment Status & Bank Details</div>
                <div className={styles.voucherRow}>
                  <span>Payment Status:</span>
                  <strong>{selectedRecord.status}</strong>
                </div>
                <div className={styles.voucherRow}>
                  <span>Disbursement Date:</span>
                  <span>{selectedRecord.disbursedDate || 'Scheduled in Payroll'}</span>
                </div>
                {selectedRecord.utrNumber && selectedRecord.utrNumber !== '—' && (
                  <div className={styles.voucherRow}>
                    <span>Bank UTR Reference:</span>
                    <strong style={{ color: '#16a34a' }}>{selectedRecord.utrNumber}</strong>
                  </div>
                )}

                <div className={styles.signBlock}>
                  <div className={styles.signLine}>
                    Authorized Signatory<br/>
                    <strong>HR Operations & Legal Desk</strong>
                  </div>
                  <div className={styles.signLine}>
                    Acknowledged by<br/>
                    <strong>Employee Signature / Stamp</strong>
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.drawerFooter}>
              <button
                type="button"
                className={styles.btnSecondary}
                onClick={() => handlePrintFormC(selectedRecord)}
              >
                <Printer size={14} /> Print Form C
              </button>

              <div style={{ display: 'flex', gap: 10 }}>
                {(selectedRecord.status === 'Pending Approval' || selectedRecord.status === 'Eligible (Calculated)') && (
                  <button
                    type="button"
                    className={styles.btnActionApprove}
                    style={{ padding: '8px 16px', fontSize: '13px' }}
                    onClick={() => handleApprove(selectedRecord)}
                  >
                    <Check size={14} /> Approve Bonus
                  </button>
                )}

                {selectedRecord.status === 'Approved for Payout' && (
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

