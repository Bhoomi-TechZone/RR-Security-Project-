import React, { useState, useMemo } from 'react';
import {
  FileText,
  Printer,
  ChevronLeft,
  ChevronRight,
  Users,
  ShieldCheck,
  IndianRupee,
  Clock,
  Info,
} from 'lucide-react';
import { downloadEmployeePayslipPdf } from '../../utils/employeePayslipExport';
import EmployeePayslipOptions from './EmployeePayslipOptions';
import { getDefaultSelectedOptions } from './employeePayslipConfig';
import styles from './EmployeePayslipReportView.module.css';

/**
 * Statutory Employee Payslip Interactive View
 * Salary Reports Module
 * Matches exact structure, header fields, and layout shown in reference image:
 * - Circular logo and company address / statutory codes header
 * - Payslip for the Month : <Month> / <Year>
 * - Two-column metadata block (Employee profile & statutory/bank info)
 * - 5-Column Earnings & Deductions table (ALLOWANCE | RATE | PAYABLE | DEDUCTIONS | AMOUNT)
 * - Net salary in Indian words + NET SALARY box
 * - Attendance summary strip (Month Days, Present, W.Off, LWP, Payable, Holiday, CL, SL, EL)
 * - Authorised Signatory block
 */
export default function EmployeePayslipReportView({
  records = [],
  companyInfo = {},
  period = {},
  totals = {},
  selectedEmployeeData = null,
  filters = {},
  selectedOptions: propSelectedOptions,
  onOptionsChange,
  showOptions = false,
}) {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [internalSelectedOptions, setInternalSelectedOptions] = useState(() => getDefaultSelectedOptions());
  const selectedOptions = propSelectedOptions || internalSelectedOptions;
  const setSelectedOptions = onOptionsChange || setInternalSelectedOptions;

  // Active Payslip
  const activeSlip = useMemo(() => {
    if (records && records.length > 0) {
      return records[selectedIdx] || records[0];
    }
    return selectedEmployeeData || {};
  }, [records, selectedIdx, selectedEmployeeData]);

  // Handlers
  const handleDownloadPdf = () => {
    downloadEmployeePayslipPdf(activeSlip, companyInfo, period, { mode: 'download', options: selectedOptions });
  };

  const handlePrint = () => {
    downloadEmployeePayslipPdf(activeSlip, companyInfo, period, { mode: 'print', options: selectedOptions });
  };

  const handlePrev = () => {
    if (selectedIdx > 0) setSelectedIdx(selectedIdx - 1);
  };

  const handleNext = () => {
    if (selectedIdx < records.length - 1) setSelectedIdx(selectedIdx + 1);
  };

  // Company details
  const comp = activeSlip.companyInfo || companyInfo || {};
  const compName = (comp.name || 'RR SECURITY & FACILITIES').toUpperCase();
  const compAddr = (comp.address || 'G-75/A, BLOCK-G M.B.EXTN., BADARPUR NEW DELHI-110044').toUpperCase();
  const compPhone = comp.phone ? `TEL NO. ${comp.phone}` : 'TEL NO. 9891325151';
  const compPan = comp.pan || 'DSNHP3718318000';
  const compEsic = comp.esic || comp.registrationNo || '20001853160000999';

  // Allowances & Deductions matching
  const allowances = activeSlip.allowances || [];
  const deductions = activeSlip.deductions || [];
  const maxRows = Math.max(allowances.length, deductions.length, 4);

  const tableRows = [];
  for (let i = 0; i < maxRows; i++) {
    const a = allowances[i];
    const d = deductions[i];
    tableRows.push({
      allowanceName: a ? a.name : '',
      rate: a && a.rate !== undefined ? Number(a.rate).toLocaleString('en-IN') : '',
      payable: a && a.payable !== undefined ? Number(a.payable).toLocaleString('en-IN') : '',
      deductionName: d ? d.name : '',
      amount: d && d.amount !== undefined ? Number(d.amount).toLocaleString('en-IN') : '',
    });
  }

  const att = activeSlip.attendanceDetails || {};

  return (
    <div className={styles.container}>
      {/* Statutory Act Banner */}
      <div className={styles.actBanner}>
        <Info size={15} />
        <span>
          <strong>Monthly Employee Payslip</strong> — Statutory Salary Slip matching verified HRMS format. Period:{' '}
          <strong>{activeSlip.salaryMonth || period?.monthLabel || 'Current Month'}</strong>
        </span>
      </div>

      {/* Dynamic Report Options UI (Frontend Configurable Options Panel) */}
      {showOptions && (
        <EmployeePayslipOptions
          selectedOptions={selectedOptions}
          onChange={setSelectedOptions}
          onReset={() => setSelectedOptions(getDefaultSelectedOptions())}
        />
      )}

      {/* KPI Cards */}
      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <div className={`${styles.kpiIconWrap} ${styles.kpiIconBlue}`}>
            <Users size={20} />
          </div>
          <div className={styles.kpiContent}>
            <span className={styles.kpiLabel}>Total Payslips</span>
            <span className={styles.kpiValue}>{records.length} Employees</span>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={`${styles.kpiIconWrap} ${styles.kpiIconGreen}`}>
            <IndianRupee size={20} />
          </div>
          <div className={styles.kpiContent}>
            <span className={styles.kpiLabel}>Net Salary</span>
            <span className={styles.kpiValue}>
              ₹{Number(activeSlip.netSalary || 0).toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={`${styles.kpiIconWrap} ${styles.kpiIconOrange}`}>
            <Clock size={20} />
          </div>
          <div className={styles.kpiContent}>
            <span className={styles.kpiLabel}>Days Paid</span>
            <span className={styles.kpiValue}>{activeSlip.daysPaid ?? 30} Days</span>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={`${styles.kpiIconWrap} ${styles.kpiIconPurple}`}>
            <ShieldCheck size={20} />
          </div>
          <div className={styles.kpiContent}>
            <span className={styles.kpiLabel}>Statutory Format</span>
            <span className={styles.kpiValue}>Corporate Payslip</span>
          </div>
        </div>
      </div>

      {/* Interactive Toolbar */}
      <div className={styles.toolbarCard}>
        <div className={styles.selectorWrap}>
          <label className={styles.selectLabel}>Select Employee:</label>
          <select
            className={styles.employeeSelect}
            value={selectedIdx}
            onChange={(e) => setSelectedIdx(Number(e.target.value))}
          >
            {records.map((r, i) => (
              <option key={r.id || r.employeeCode || i} value={i}>
                {r.employeeName || 'Staff'} ({r.employeeCode || r.employeeId || `RR0${i + 1}`})
              </option>
            ))}
          </select>

          <div className={styles.navBtnGroup}>
            <button
              type="button"
              className={styles.navBtn}
              onClick={handlePrev}
              disabled={selectedIdx <= 0}
              title="Previous Employee"
            >
              <ChevronLeft size={16} /> Prev
            </button>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>
              {selectedIdx + 1} / {records.length || 1}
            </span>
            <button
              type="button"
              className={styles.navBtn}
              onClick={handleNext}
              disabled={selectedIdx >= records.length - 1}
              title="Next Employee"
            >
              Next <ChevronRight size={16} />
            </button>
          </div>
        </div>

        <div className={styles.actionBtnGroup}>
          <button
            type="button"
            className={styles.btnSecondary}
            onClick={handleDownloadPdf}
            title="Download PDF Document"
          >
            <FileText size={15} />
            <span>Download PDF</span>
          </button>
          <button
            type="button"
            className={styles.btnPrimary}
            onClick={handlePrint}
            title="Print Official Payslip"
          >
            <Printer size={15} />
            <span>Print Payslip</span>
          </button>
        </div>
      </div>

      {/* ========================================================
          Exact Payslip Document Frame (Matching Image 1)
          ======================================================== */}
      <div className={styles.payslipFrameWrap}>
        <div className={styles.payslipDocument} id="printable-employee-payslip">
          {/* Top Header */}
          {selectedOptions.showCompanyHeader !== false && (
            <div className={styles.docHeader}>
              <div className={styles.docLogoCircle}>
                <span>RR SECURITY</span>
                <span style={{ fontSize: '7.5px' }}>&amp; FACILITIES</span>
              </div>

              <div className={styles.docHeaderCenter}>
                <div className={styles.titlePayslip}>P A Y S L I P</div>
                <div className={styles.compName}>{compName}</div>
                <div className={styles.compAddr}>{compAddr}</div>
                <div className={styles.compTel}>{compPhone}</div>
                {selectedOptions.showCompanyStatutoryCodes !== false && (
                  <>
                    <div className={styles.compStatutoryCodes}>{compPan}</div>
                    <div className={styles.compStatutoryCodes}>{compEsic}</div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Payslip for the Month Row */}
          <div className={styles.monthRow}>
            <span>Payslip for the Month &nbsp;:&nbsp; </span>
            <strong>{activeSlip.salaryMonth || period?.monthLabel || 'Current Month'}</strong>
          </div>

          {/* 2-Column Metadata Box */}
          <div className={styles.metadataBox}>
            {/* Left Column: Employee Profile */}
            <div className={styles.metaColLeft}>
              {selectedOptions.employeeCode !== false && (
                <div className={styles.metaField}>
                  <span className={styles.metaFieldLabel}>Employee Code</span>
                  <span className={styles.metaFieldColon}>:</span>
                  <span className={styles.metaFieldValue}>{activeSlip.employeeCode || '—'}</span>
                </div>
              )}
              {selectedOptions.empCardNo !== false && (
                <div className={styles.metaField}>
                  <span className={styles.metaFieldLabel}>Emp. Card No.</span>
                  <span className={styles.metaFieldColon}>:</span>
                  <span className={styles.metaFieldValue}>{activeSlip.empCardNo || ''}</span>
                </div>
              )}
              {selectedOptions.employeeName !== false && (
                <div className={styles.metaField}>
                  <span className={styles.metaFieldLabel}>Employee Name</span>
                  <span className={styles.metaFieldColon}>:</span>
                  <span className={`${styles.metaFieldValue} ${styles.boldValue}`}>
                    {activeSlip.employeeName || '—'}
                  </span>
                </div>
              )}
              {selectedOptions.fatherHusbandName !== false && (
                <div className={styles.metaField}>
                  <span className={styles.metaFieldLabel}>Father/Husb. Name</span>
                  <span className={styles.metaFieldColon}>:</span>
                  <span className={styles.metaFieldValue}>{activeSlip.fatherHusbandName || '—'}</span>
                </div>
              )}
              {selectedOptions.designation !== false && (
                <div className={styles.metaField}>
                  <span className={styles.metaFieldLabel}>Designation</span>
                  <span className={styles.metaFieldColon}>:</span>
                  <span className={styles.metaFieldValue}>{activeSlip.designation || '—'}</span>
                </div>
              )}
              {selectedOptions.department !== false && (
                <div className={styles.metaField}>
                  <span className={styles.metaFieldLabel}>Department</span>
                  <span className={styles.metaFieldColon}>:</span>
                  <span className={styles.metaFieldValue}>{activeSlip.department || '—'}</span>
                </div>
              )}
              {selectedOptions.location !== false && (
                <div className={styles.metaField}>
                  <span className={styles.metaFieldLabel}>Location</span>
                  <span className={styles.metaFieldColon}>:</span>
                  <span className={styles.metaFieldValue}>{activeSlip.location || '—'}</span>
                </div>
              )}
              {selectedOptions.dateOfJoining !== false && (
                <div className={styles.metaField}>
                  <span className={styles.metaFieldLabel}>Date of Joining</span>
                  <span className={styles.metaFieldColon}>:</span>
                  <span className={styles.metaFieldValue}>{activeSlip.dateOfJoining || '—'}</span>
                </div>
              )}
            </div>

            {/* Right Column: Statutory & Bank */}
            <div className={styles.metaColRight}>
              {selectedOptions.paymentMode !== false && (
                <div className={styles.metaField}>
                  <span className={styles.metaFieldLabel}>Payment Mode</span>
                  <span className={styles.metaFieldColon}>:</span>
                  <span className={styles.metaFieldValue}>{activeSlip.paymentMode || 'Bank'}</span>
                </div>
              )}
              {selectedOptions.accountNo !== false && (
                <div className={styles.metaField}>
                  <span className={styles.metaFieldLabel}>A/C No.</span>
                  <span className={styles.metaFieldColon}>:</span>
                  <span className={`${styles.metaFieldValue} ${styles.boldValue}`}>
                    {activeSlip.accountNo || '—'}
                  </span>
                </div>
              )}
              {selectedOptions.bankName !== false && (
                <div className={styles.metaField}>
                  <span className={styles.metaFieldLabel}>Bank Name</span>
                  <span className={styles.metaFieldColon}>:</span>
                  <span className={styles.metaFieldValue}>{activeSlip.bankName || '—'}</span>
                </div>
              )}
              {selectedOptions.ifscCode !== false && (
                <div className={styles.metaField}>
                  <span className={styles.metaFieldLabel}>IFSC Code</span>
                  <span className={styles.metaFieldColon}>:</span>
                  <span className={styles.metaFieldValue}>{activeSlip.ifscCode || '—'}</span>
                </div>
              )}
              {selectedOptions.esiNo !== false && (
                <div className={styles.metaField}>
                  <span className={styles.metaFieldLabel}>ESI No.</span>
                  <span className={styles.metaFieldColon}>:</span>
                  <span className={styles.metaFieldValue}>{activeSlip.esiNo || '—'}</span>
                </div>
              )}
              {selectedOptions.uan !== false && (
                <div className={styles.metaField}>
                  <span className={styles.metaFieldLabel}>UAN</span>
                  <span className={styles.metaFieldColon}>:</span>
                  <span className={`${styles.metaFieldValue} ${styles.boldValue}`}>
                    {activeSlip.uan || '—'}
                  </span>
                </div>
              )}
              {selectedOptions.pan !== false && (
                <div className={styles.metaField}>
                  <span className={styles.metaFieldLabel}>PAN No.</span>
                  <span className={styles.metaFieldColon}>:</span>
                  <span className={styles.metaFieldValue}>{activeSlip.pan || '—'}</span>
                </div>
              )}
              {selectedOptions.lwfNo !== false && (
                <div className={styles.metaField}>
                  <span className={styles.metaFieldLabel}>LWF No.</span>
                  <span className={styles.metaFieldColon}>:</span>
                  <span className={styles.metaFieldValue}>{activeSlip.lwfNo || ''}</span>
                </div>
              )}
              {selectedOptions.daysPaid !== false && (
                <div className={styles.metaField}>
                  <span className={styles.metaFieldLabel}>Days Paid</span>
                  <span className={styles.metaFieldColon}>:</span>
                  <span className={`${styles.metaFieldValue} ${styles.boldValue}`}>
                    {activeSlip.daysPaid ?? 30}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* 5-Column Earnings & Deductions Table */}
          <div className={styles.tableWrapper}>
            <table className={styles.slipTable}>
              <thead>
                <tr>
                  {selectedOptions.showAllowances !== false && <th className={styles.colAllowance}>ALLOWANCE</th>}
                  {selectedOptions.showRate !== false && <th className={styles.colRate}>RATE</th>}
                  {selectedOptions.showPayable !== false && <th className={styles.colPayable}>PAYABLE</th>}
                  {selectedOptions.showDeductions !== false && <th className={styles.colDeductions}>DEDUCTIONS</th>}
                  {selectedOptions.showDeductionAmount !== false && <th className={styles.colAmount}>AMOUNT</th>}
                </tr>
              </thead>
              <tbody>
                {tableRows.map((r, i) => (
                  <tr key={`row-${i}`}>
                    {selectedOptions.showAllowances !== false && <td className={styles.colAllowance}>{r.allowanceName}</td>}
                    {selectedOptions.showRate !== false && <td className={styles.colRate}>{r.rate}</td>}
                    {selectedOptions.showPayable !== false && <td className={styles.colPayable}>{r.payable}</td>}
                    {selectedOptions.showDeductions !== false && <td className={styles.colDeductions}>{r.deductionName}</td>}
                    {selectedOptions.showDeductionAmount !== false && <td className={styles.colAmount}>{r.amount}</td>}
                  </tr>
                ))}
                {/* Total Row */}
                {selectedOptions.showTotalRow !== false && (
                  <tr className={styles.tableTotalRow}>
                    {selectedOptions.showAllowances !== false && (
                      <td className={styles.colAllowance} style={{ textAlign: 'right' }}>
                        Total :
                      </td>
                    )}
                    {selectedOptions.showRate !== false && (
                      <td className={styles.colRate}>
                        {Number(activeSlip.totalRate || 0).toLocaleString('en-IN')}
                      </td>
                    )}
                    {selectedOptions.showPayable !== false && (
                      <td className={styles.colPayable}>
                        {Number(activeSlip.totalPayable || 0).toLocaleString('en-IN')}
                      </td>
                    )}
                    {selectedOptions.showDeductions !== false && <td className={styles.colDeductions}></td>}
                    {selectedOptions.showDeductionAmount !== false && (
                      <td className={styles.colAmount}>
                        {Number(activeSlip.totalDeductions || 0).toLocaleString('en-IN')}
                      </td>
                    )}
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Net Salary & In-Words Strip */}
          <div className={styles.summaryBox}>
            <span className={styles.wordsText}>
              {selectedOptions.netSalaryWords !== false ? (activeSlip.netSalaryWords || '—') : ''}
            </span>
            {selectedOptions.netSalary !== false && (
              <span className={styles.netSalaryText}>
                NET SALARY : &nbsp;&nbsp;{Number(activeSlip.netSalary || 0).toLocaleString('en-IN')}
              </span>
            )}
          </div>

          {/* Attendance Strip */}
          {selectedOptions.showAttendanceStrip !== false && (
            <div className={styles.attBox}>
              <div className={styles.attLine}>
                <span className={styles.attLabel}>Att. Details :</span>
                {selectedOptions.monthDays !== false && <span>Month Days : <strong>{att.monthDays || 30}</strong></span>}
                {selectedOptions.present !== false && <span>Present : <strong>{att.present || 30}</strong></span>}
                {selectedOptions.wOff !== false && <span>W.Off : <strong>{att.wOff !== undefined ? att.wOff : ''}</strong></span>}
                {selectedOptions.lwp !== false && <span>LWP : <strong>{att.lwp !== undefined ? att.lwp : ''}</strong></span>}
                {selectedOptions.payable !== false && <span>Payable : <strong>{att.payable || 30}</strong></span>}
              </div>
              <div className={styles.attLine} style={{ paddingLeft: '90px' }}>
                {selectedOptions.holiday !== false && <span>Holiday : <strong>{att.holiday || ''}</strong></span>}
                {selectedOptions.cl !== false && <span>CL : <strong>{att.cl || ''}</strong></span>}
                {selectedOptions.sl !== false && <span>SL : <strong>{att.sl || ''}</strong></span>}
                {selectedOptions.el !== false && <span>EL : <strong>{att.el || ''}</strong></span>}
              </div>
            </div>
          )}

          {/* Authorised Signatory */}
          {selectedOptions.showAuthorisedSignatory !== false && (
            <div className={styles.signatoryBox}>
              <span className={styles.signatoryLabel}>Authorised Signatory</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
