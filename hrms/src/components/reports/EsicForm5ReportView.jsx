import React from 'react';
import {
  FileText,
  FileSpreadsheet,
  Printer,
  Download,
  Users,
  ShieldCheck,
  Building,
  CreditCard,
} from 'lucide-react';
import {
  downloadEsicForm5Pdf,
  downloadEsicForm5Excel,
  downloadEsicForm5Csv,
} from '../../utils/esicForm5Export';
import styles from './EsicForm5ReportView.module.css';

/**
 * =========================================================================
 * ESIC FORM 5 RETURN OF CONTRIBUTIONS VIEW (Regulation 26)
 * High-fidelity statutory UI matching official ESIC Form 5:
 * - Page 1: Form 5 Header, Employer Details, Principal Employer Particulars,
 *           Contribution Period, Statutory Declaration, Share Totals,
 *           6-Month Challan Table, Instructions, and Declarations (a) to (j).
 * - Page 2: Wage Components (k) & (l), Liability clause, CA Certificate,
 *           10-Column Insured Persons Contribution Return Table, and
 *           (FOR OFFICIAL USE) section.
 * =========================================================================
 */
export default function EsicForm5ReportView({
  reportData = {},
  filters = {},
}) {
  const safeData = reportData || {};
  const records = safeData.records || [];
  const companyInfo = safeData.companyInfo || {};
  const clientInfo = safeData.clientInfo || {};
  const period = safeData.period || {};
  const contributions = safeData.contributions || {};
  const challans = safeData.challans || [];
  const declarations = safeData.declarations || {};
  const wageComponents = safeData.wageComponents || {};
  const totals = safeData.totals || {};

  const companyName = clientInfo?.name || companyInfo?.name || 'RR SECURITY & FACILITIES';
  const companyAddress = clientInfo?.address || companyInfo?.address || 'B-279 PATEL GARDEN EXTN. KAKROLA MORE, NEW DELHI - 110059';
  const employerCode = companyInfo?.employerCode || '11001002790000905';
  const branchOffice = companyInfo?.branchOffice || 'MAYAPURI';
  const principalEmployer = companyInfo?.principalEmployer || {
    name: 'MR. RAM NIWAS',
    designation: 'PROPRIETOR',
    address: 'B-279 PATEL GARDEN EXTN. KAKROLA MORE UTTAM NAGAR NEW DELHI - 110059',
  };

  const periodLabel = period.label || 'OCTOBER, 2025 TO MARCH, 2026';
  const place = companyInfo?.place || 'NEW DELHI';
  const reportDate = companyInfo?.date || period.reportDate || '12.09.2026';

  const formatCurrency = (val) => Number(val || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const handleDownloadPdf = async () => {
    await downloadEsicForm5Pdf(safeData, { mode: 'download' });
  };

  const handlePrint = async () => {
    await downloadEsicForm5Pdf(safeData, { mode: 'print' });
  };

  const handleDownloadExcel = () => {
    downloadEsicForm5Excel(safeData);
  };

  const handleDownloadCsv = () => {
    downloadEsicForm5Csv(safeData);
  };

  return (
    <div className={styles.container}>
      {/* 1. Quick KPI Summary Cards */}
      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <div className={styles.kpiInfo}>
            <span className={styles.kpiLabel}>Covered Insured Persons</span>
            <span className={styles.kpiValue}>
              {declarations.coveredEmployeesCount ?? records.length} Employees
            </span>
          </div>
          <div className={`${styles.kpiIcon} ${styles.iconBlue}`}>
            <Users size={20} />
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiInfo}>
            <span className={styles.kpiLabel}>Total Wages Paid</span>
            <span className={styles.kpiValue}>
              ₹ {formatCurrency(totals.totalWages || declarations.coveredEmployeesWages)}
            </span>
          </div>
          <div className={`${styles.kpiIcon} ${styles.iconGreen}`}>
            <CreditCard size={20} />
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiInfo}>
            <span className={styles.kpiLabel}>Total ESI Contribution</span>
            <span className={styles.kpiValue}>
              ₹ {formatCurrency(contributions.totalContribution || safeData.totalAmountPaid)}
            </span>
          </div>
          <div className={`${styles.kpiIcon} ${styles.iconIndigo}`}>
            <ShieldCheck size={20} />
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiInfo}>
            <span className={styles.kpiLabel}>Challans Filed (6M)</span>
            <span className={styles.kpiValue}>
              {challans.length} Months Verified
            </span>
          </div>
          <div className={`${styles.kpiIcon} ${styles.iconOrange}`}>
            <Building size={20} />
          </div>
        </div>
      </div>

      {/* 2. Action Bar */}
      <div className={styles.actionBar}>
        <div className={styles.actionTitle}>
          <FileText size={18} color="#2563eb" />
          <span>ESIC Form 5 - Statutory Return of Contributions (Regulation 26)</span>
        </div>
        <div className={styles.actionButtons}>
          <button
            type="button"
            className={styles.btnPrimary}
            onClick={handleDownloadPdf}
            title="Download Official Statutory PDF (Exact Template)"
          >
            <Download size={14} />
            <span>Export PDF</span>
          </button>
          <button
            type="button"
            className={styles.btnSuccess}
            onClick={handleDownloadExcel}
            title="Export Excel Worksheet"
          >
            <FileSpreadsheet size={14} />
            <span>Export Excel</span>
          </button>
          <button
            type="button"
            className={styles.btnOutline}
            onClick={handleDownloadCsv}
            title="Export Clean CSV"
          >
            <Download size={14} />
            <span>CSV</span>
          </button>
          <button
            type="button"
            className={styles.btnOutline}
            onClick={handlePrint}
            title="Print Official Form 5 Document"
          >
            <Printer size={14} />
            <span>Print</span>
          </button>
        </div>
      </div>

      {/* 3. Official Document Sheet */}
      <div className={styles.paperCard}>
        {/* ========================================================= */}
        {/* PAGE 1: STATUTORY RETURN & SUMMARY                        */}
        {/* ========================================================= */}
        <div className={styles.formHeader}>
          <div className={styles.formTitle}>FORM 5</div>
          <div className={styles.formSubtitle}>RETURN OF CONTRIBUTIONS</div>
          <div className={styles.orgTitle}>EMPLOYEES' STATE INSURANCE CORPORATION</div>
          <div className={styles.regulationTag}>(Regulation 26)</div>

          <div className={styles.headerMetaRight}>
            <div className={styles.metaRow}>
              <span className={styles.metaRowLabel}>Employer's Code No. :</span>
              <span className={styles.metaRowVal}>{employerCode}</span>
            </div>
            <div className={styles.metaRow} style={{ marginTop: '4px' }}>
              <span className={styles.metaRowLabel}>Name of Branch Office:</span>
              <span className={styles.metaRowVal}>{branchOffice}</span>
            </div>
          </div>
        </div>

        {/* Factory / Establishment & Principal Employer info */}
        <div className={styles.sectionBlock}>
          <div className={styles.fieldGrid}>
            <div className={styles.fieldLabel}>Name and Address of the factory or establishment:</div>
            <div className={styles.fieldVal}>
              <div>{companyName}</div>
              <div style={{ fontWeight: 600, fontSize: '11px', textTransform: 'uppercase' }}>
                {companyAddress}
              </div>
            </div>
          </div>
        </div>

        <div className={styles.sectionBlock}>
          <div style={{ fontWeight: 700, marginBottom: '4px' }}>
            Particulars of the Principal employer(s)
          </div>
          <div className={styles.fieldGrid}>
            <div className={styles.fieldLabel}>(a) Name</div>
            <div className={styles.fieldVal}>: {principalEmployer.name}</div>

            <div className={styles.fieldLabel}>(b) Designation</div>
            <div className={styles.fieldVal}>: {principalEmployer.designation}</div>

            <div className={styles.fieldLabel}>(c) Residential Address</div>
            <div className={styles.fieldVal}>: {principalEmployer.address}</div>

            <div className={styles.fieldLabel} style={{ marginTop: '4px' }}>
              Contribution Period from
            </div>
            <div className={styles.fieldVal} style={{ marginTop: '4px' }}>
              : {periodLabel}
            </div>
          </div>
        </div>

        {/* Statutory Declaration Paragraph */}
        <p className={styles.declarationPara}>
          I furnish below the details of the Employer's and Employee's share of contribution in respect of the under mentioned insured persons. I hereby declare that the return includes each and every employee, employed directly or through an immediate employer or in connection with the work of the factory / establishment or any work connected with the administration of the factory / establishment or purchase of raw materials, sale or distribution of finished products etc. to whom the ESI Act, 1948 applies, in the contribution period to which this return relates and that the contributions in respect of employer's and employee's share have been correctly paid in accordance with the provisions of the Act and Regulations.
        </p>

        {/* Contributions Summary Bar */}
        <div className={styles.contributionBar}>
          <div>
            Employees's Share : <u>Rs. {formatCurrency(contributions.employeesShare)}</u>
          </div>
          <div>
            Employer's Share : <u>Rs. {formatCurrency(contributions.employersShare)}</u>
          </div>
          <div>
            Total Contribution : <u>Rs. {formatCurrency(contributions.totalContribution)}</u>
          </div>
        </div>

        {/* 6-Month Challan Details Table */}
        <div style={{ fontWeight: 700, fontSize: '12px', marginBottom: '6px' }}>
          Details of Challans :
        </div>
        <table className={styles.challanTable}>
          <thead>
            <tr>
              <th style={{ width: '8%' }}>Sl.No.</th>
              <th style={{ width: '28%' }}>Month</th>
              <th style={{ width: '20%' }}>Date of Challan</th>
              <th style={{ width: '18%' }}>Amount</th>
              <th style={{ width: '26%' }}>Name of the Bank and Branch</th>
            </tr>
          </thead>
          <tbody>
            {challans.map((ch, idx) => (
              <tr key={ch.slNo || idx}>
                <td style={{ textAlign: 'center' }}>{ch.slNo || idx + 1}</td>
                <td>{ch.month}</td>
                <td style={{ textAlign: 'center' }}>{ch.dateOfChallan}</td>
                <td style={{ textAlign: 'right' }}>{Number(ch.amount || 0).toFixed(2)}</td>
                <td>{ch.bankAndBranch && !ch.bankAndBranch.includes('—') && ch.bankAndBranch.trim() ? ch.bankAndBranch : 'SBI MAYAPURI'}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className={styles.totalPaidLine}>
          Total amount paid : <u>Rs. {formatCurrency(safeData.totalAmountPaid || contributions.totalContribution)}</u>
        </div>

        {/* Important Instructions */}
        <div className={styles.instructionsBlock}>
          <div className={styles.instructionsTitle}>
            Important Instructions : Information to be given in 'Remarks Column (No. 9)'
          </div>
          <div>(i) If any I.P. is appointed for the first time and / or leaves during the contribution period indicate "A ............. (date)" and / or "L .............. (date)"</div>
          <div>(ii) Please indicate Insurance Nos. in ascending order.</div>
          <div>(iii) Figures in Columns 4,5 & 6 shall be in respect of wage periods ended during the contribution period.</div>
          <div>(iv) Invariably strike totals of Columns 4, 5 and 6 of the Return.</div>
          <div>(v) No overwriting shall be made. Any corrections, if made, should be signed by the employer.</div>
          <div>(vi) Every page of this Return should bear full signature and rubber stamp of the employer.</div>
          <div>(vii) Daily wages in Column 7 of the return shall be calculated by dividing figures in Column 5 by figures in Column 4 to two decimal places.</div>
          <div style={{ marginTop: '4px', fontWeight: 600 }}>
            For *CP ending 31st March, due date is 12th May. <br />
            For CP ending 30th September, due date is 11th November.
          </div>
        </div>

        {/* Declarations (a) to (j) */}
        <div className={styles.declarationsList}>
          <div style={{ fontWeight: 700, marginBottom: '4px' }}>I declare that</div>
          <div className={styles.declarationItem}>
            (a) All the Records and Registers have been maintained as per provisions contained in ESI Act, Rules & Regulations framed therein.
          </div>
          <div className={styles.declarationItem}>
            (b) During the period of return <u>&nbsp;{declarations.declarationFormsSubmitted || 'NIL'}&nbsp;</u> No. of Declaration forms have been submitted.
          </div>
          <div className={styles.declarationItem}>
            (c) During the above period <u>&nbsp;{declarations.ticsReceived || 'NIL'}&nbsp;</u> No. of TICs have been received.
          </div>
          <div className={styles.declarationItem}>
            (d) During the above period <u>&nbsp;{declarations.picsReceived || 'NIL'}&nbsp;</u> No. of PICs have been received.
          </div>
          <div className={styles.declarationItem}>
            (e) During the above period <u>&nbsp;{declarations.picsDistributed || 'NIL'}&nbsp;</u> No. of PICs have been distributed amongst the eligible IPs.
          </div>
          <div className={styles.declarationItem}>
            (f) During the above period <u>&nbsp;{declarations.accidentsReported || 'NIL'}&nbsp;</u> accidents have been reported to the concerned Branch Office.
          </div>
          <div className={styles.declarationItem}>
            (g) During the period <u>&nbsp;{String(declarations.coveredEmployeesCount || records.length).padStart(2, '0')}&nbsp;</u> No. of employees directly employed by us have been covered and a total wages of <b>Rs. {formatCurrency(declarations.coveredEmployeesWages || totals.totalWages)}</b> have been paid to such employees.
          </div>
          <div className={styles.declarationItem}>
            (h) During the period <u>&nbsp;{declarations.uncoveredEmployeesCount || 'NIL'}&nbsp;</u> No. of employees directly employed by us have not been covered and a total wages of Rs. <u>&nbsp;{declarations.uncoveredEmployeesWages || 'NIL'}&nbsp;</u> have been paid to such employees.
          </div>
          <div className={styles.declarationItem}>
            (i) During the period <u>&nbsp;{declarations.immediateEmployerCoveredCount || 'NIL'}&nbsp;</u> No. of employees employed through immediate employer have been covered and a total wages of Rs. <u>&nbsp;{declarations.immediateEmployerCoveredWages || 'NIL'}&nbsp;</u> have been paid to such employees.
          </div>
          <div className={styles.declarationItem}>
            (j) During the period <u>&nbsp;{declarations.immediateEmployerUncoveredCount || 'NIL'}&nbsp;</u> No. of employees employed through immediate employer have not been covered and a total wages of Rs. <u>&nbsp;{declarations.immediateEmployerUncoveredWages || 'NIL'}&nbsp;</u> have been paid to such employees.
          </div>
        </div>

        {/* ========================================================= */}
        {/* PAGE 2 DIVIDER                                            */}
        {/* ========================================================= */}
        <hr className={styles.pageDivider} />

        {/* Wage components (k) & (l) */}
        <div className={styles.wageComponentsBlock}>
          <div>(k) Following components of wages have been taken into consideration for the purpose of payment of contribution:</div>
          <ol className={styles.componentList}>
            {(wageComponents.considered || ['Basic Wages', 'Dearness Allowance (DA)', 'HRA / Retaining Allowance']).map((comp, idx) => (
              <li key={idx}>{comp.replace(/^[0-9.]+\s*/, '')}</li>
            ))}
          </ol>

          <div>(l) Following components of wages have not been taken into consideration for the purpose of payment of contribution:</div>
          <ol className={styles.componentList}>
            {(wageComponents.notConsidered || ['Washing Allowance / Conveyance / Overtime', 'Travelling Allowance / Reimbursements', 'Ex-gratia / Annual Bonus']).map((comp, idx) => (
              <li key={idx}>{comp.replace(/^[0-9.]+\s*/, '')}</li>
            ))}
          </ol>

          <p className={styles.liabilityClause}>
            The above mentioned information is based on records and any information if found incorrect will render me liable for prosecutions under provisions of ESI Act and action for recovery of contribution due along-with interest and damages as per provisions of the ESI Act.
          </p>
        </div>

        {/* Employer Sign & Date/Place */}
        <div style={{ textAlign: 'right', fontWeight: 700, fontSize: '12px', marginBottom: '14px' }}>
          FOR {companyName.toUpperCase()}
        </div>

        <div className={styles.employerSignBlock}>
          <div>
            <div>Place: {place}</div>
            <div style={{ marginTop: '4px' }}>Date: {reportDate}</div>
          </div>
          <div>
            AUTHOURISED SIGNATORY
          </div>
        </div>

        {/* Certificate by Chartered Accountant Box */}
        <div className={styles.caCertBlock}>
          <div className={styles.caCertTitle}>CERTIFICATE BY CHARTERED ACCOUNTANT</div>
          <div className={styles.caCertSub}>(To be submitted in case of employers employing 40 or more employees)</div>
          <div>
            Certified that I have verified the above return from the Records & Registers of M/s <b>{companyName.toUpperCase()}</b> and found it to be correct.
          </div>
          <div className={styles.caSignLine}>
            Signature & Seal of the Chartered Accountant with Membership No.
          </div>
        </div>

        {/* 10-COLUMN STATUTORY TABLE MATCHING IMAGE 2 EXACTLY */}
        <div className={styles.statutoryTableWrap}>
          <table className={styles.statutoryTable}>
            <thead>
              <tr>
                <th rowSpan="2" style={{ width: '4%' }}>Serial Number</th>
                <th rowSpan="2" style={{ width: '11%' }}>Insurance Number</th>
                <th rowSpan="2" style={{ width: '18%' }}>Name of the Insured Person</th>
                <th rowSpan="2" style={{ width: '8%' }}>No. Of Days for which wages paid</th>
                <th colSpan="2" style={{ width: '13%' }}>Total amount of Wages paid</th>
                <th colSpan="2" style={{ width: '11%' }}>Employee's Contribution Deducted</th>
                <th colSpan="2" style={{ width: '11%' }}>Average Daily wages</th>
                <th rowSpan="2" style={{ width: '8%' }}>Whether Still Continues Working</th>
                <th rowSpan="2" style={{ width: '11%' }}>Name of the Dispensary</th>
                <th rowSpan="2" style={{ width: '6%' }}>Remarks</th>
              </tr>
              <tr>
                <th style={{ width: '9%' }}>Rs.</th>
                <th style={{ width: '4%' }}>P</th>
                <th style={{ width: '7%' }}>Rs.</th>
                <th style={{ width: '4%' }}>P</th>
                <th style={{ width: '7%' }}>Rs.</th>
                <th style={{ width: '4%' }}>P</th>
              </tr>
              <tr style={{ background: '#f8fafc', fontWeight: 700 }}>
                <th>1</th>
                <th>2</th>
                <th>3</th>
                <th>4</th>
                <th colSpan="2">5</th>
                <th colSpan="2">6</th>
                <th colSpan="2">7</th>
                <th>8</th>
                <th>9</th>
                <th>10</th>
              </tr>
            </thead>
            <tbody>
              {records.length > 0 ? (
                records.map((r, idx) => (
                  <tr key={r.employeeId || idx}>
                    <td style={{ textAlign: 'center' }}>{r.srNo || idx + 1}</td>
                    <td style={{ textAlign: 'center', fontWeight: 600 }}>{r.insuranceNo || '—'}</td>
                    <td style={{ fontWeight: 600 }}>{r.employeeName || '—'}</td>
                    <td style={{ textAlign: 'center' }}>{r.daysPaid ?? 0}</td>
                    <td style={{ textAlign: 'right' }}>{r.wagesPaidRs ?? Math.floor(r.wagesPaid || 0)}</td>
                    <td style={{ textAlign: 'center' }}>{r.wagesPaidP || '00'}</td>
                    <td style={{ textAlign: 'right' }}>{r.employeeContributionRs ?? Math.floor(r.employeeContribution || 0)}</td>
                    <td style={{ textAlign: 'center' }}>{r.employeeContributionP || '00'}</td>
                    <td style={{ textAlign: 'right' }}>{r.averageDailyWagesRs ?? Math.floor(r.averageDailyWages || 0)}</td>
                    <td style={{ textAlign: 'center' }}>{r.averageDailyWagesP || '00'}</td>
                    <td style={{ textAlign: 'center', fontWeight: 600 }}>{r.continuesWorking || 'YES'}</td>
                    <td>{r.dispensary || 'NAJAFGARH'}</td>
                    <td style={{ textAlign: 'center' }}>{r.remarks || '—'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="13" style={{ textAlign: 'center', padding: '16px', color: '#64748b' }}>
                    No insured persons found for the selected contribution period.
                  </td>
                </tr>
              )}

              {/* Total Row */}
              <tr className={styles.tableTotalRow}>
                <td style={{ textAlign: 'center' }}>Total</td>
                <td></td>
                <td style={{ fontWeight: 700 }}>{records.length} Employees</td>
                <td style={{ textAlign: 'center' }}>{totals.totalDays || 0}</td>
                <td style={{ textAlign: 'right' }}>{Math.floor(totals.totalWages || 0)}</td>
                <td style={{ textAlign: 'center' }}>00</td>
                <td style={{ textAlign: 'right' }}>{Math.floor(totals.totalEmployeeShare || 0)}</td>
                <td style={{ textAlign: 'center' }}>00</td>
                <td style={{ textAlign: 'right' }}>{Math.floor(totals.overallAvgDailyWage || 0)}</td>
                <td style={{ textAlign: 'center' }}>00</td>
                <td></td>
                <td></td>
                <td></td>
              </tr>
            </tbody>
          </table>
        </div>

        <div style={{ fontSize: '10px', fontStyle: 'italic', marginBottom: '14px' }}>
          *Date of appointment and leaving the job may be given in remarks column.
        </div>

        <div style={{ textAlign: 'right', fontWeight: 700, fontSize: '12px', marginBottom: '20px' }}>
          Signature of the Employer
        </div>

        {/* FOR OFFICIAL USE Section */}
        <div className={styles.officialUseBox}>
          <div className={styles.officialTitle}>(FOR OFFICIAL USE)</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>1. Entitlement position marked.</div>
            <div style={{ fontSize: '11px', color: '#334155' }}>
              Countersignature ....................................................
            </div>
          </div>
          <div>2. Total of Col. 5 of Return checked and Found correct/correct amount is indicated.</div>
          <div>
            3. Checked the amount of Employer's/Employee's contribution paid which is in order / observation memo enclosed.
          </div>

          <div className={styles.officialFooter}>
            <span>U.D.C.</span>
            <span>Head Clerk</span>
            <span>Branch Officer</span>
          </div>
        </div>
      </div>
    </div>
  );
}
