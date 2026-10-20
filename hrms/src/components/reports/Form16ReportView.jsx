import React, { useMemo } from 'react';
import { FileText } from 'lucide-react';
import styles from './Form16ReportView.module.css';

/**
 * Format currency amount with two decimal places
 */
function formatAmount(val) {
  const num = Number(val) || 0;
  const isNegative = num < 0;
  const absVal = Math.abs(num);

  const formatted = absVal.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return isNegative ? `-${formatted}` : formatted;
}

/**
 * Single Employee Form 16 Part B Sheet Component
 */
function Form16SheetItem({ record, globalCompanyInfo, globalPeriod, filters }) {
  // Resolve dynamic employer company details
  const comp = record.companyInfo || globalCompanyInfo || {};
  const filterCompName =
    filters?.company && filters.company !== 'All Companies' ? filters.company : null;
  const employerName = record.companyName || filterCompName || comp.name || 'RR SECURITY & FACILITIES';
  const employerAddress =
    record.companyAddress ||
    comp.address ||
    'G-75/A Street No 04 Block-G M.B. Extn.,\nBadarpur, New Delhi-110044';

  const employeeName = record.name || record.employeeName || '—';
  const employeePan = record.pan
    ? record.pan.toLowerCase().startsWith('pan')
      ? record.pan
      : `Pan: ${record.pan}`
    : 'Pan: N/A';

  const financialYear = record.financialYear || globalPeriod?.financialYear || '2025-2026';
  const assessmentYear = record.assessmentYear || globalPeriod?.assessmentYear || '2026-2027';

  const particulars = record.particulars || {};
  const grossSalary = particulars.grossSalary ?? 0;
  const standardDeduction = particulars.standardDeduction ?? -50000;
  const totalTaxableIncome = particulars.totalTaxableIncome ?? Math.max(0, grossSalary + standardDeduction);
  const totalTaxPayable = particulars.totalTaxPayable ?? 0;
  const totalTdsRemitted = particulars.totalTdsRemitted ?? 0;

  const certification = record.certification || {};
  const certDate = certification.date || new Date().toLocaleDateString('en-GB');
  const certPlace = certification.place || comp.city || 'Head Office';

  return (
    <article className={styles.documentSheet}>
      {/* 1. Header Titles */}
      <h1 className={styles.titleMain}>FORM NO. 16 - PART B</h1>
      <p className={styles.subTitleRule}>
        [See rule 31(1)(a)] Certificate under section 203 of the Income-tax Act, 1961 for tax
        deducted at source from income chargeable under the head &quot;Salaries&quot;
      </p>

      {/* Horizontal Divider */}
      <div className={styles.dividerLine} />

      {/* Underlined Section Title */}
      <div className={styles.sectionTitleUnderline}>
        DETAILS OF SALARY PAID AND ANY OTHER INCOME AND TAX DEDUCTED
      </div>

      {/* 2. Top 4-Quadrant Information Table */}
      <table className={styles.infoGridTable}>
        <tbody>
          <tr>
            <td className={styles.cellHeaderLeft}>
              Employer Name &amp; Address
            </td>
            <td className={styles.cellDataLeft}>
              <div className={styles.boldName}>{employerName}</div>
              <div>{employerAddress}</div>
            </td>
            <td className={styles.cellHeaderRight}>
              Employee Name &amp; Address
            </td>
            <td className={styles.cellDataRight}>
              <div className={styles.boldName}>{employeeName}</div>
              <div>{employeePan}</div>
              {record.address && <div>{record.address}</div>}
            </td>
          </tr>
          <tr>
            <td className={styles.cellHeaderLeft}>Financial Year</td>
            <td className={styles.cellDataLeft}>{financialYear}</td>
            <td className={styles.cellHeaderRight}>Assessment Year</td>
            <td className={styles.cellDataRight}>{assessmentYear}</td>
          </tr>
        </tbody>
      </table>

      {/* 3. Particulars and Amounts Table */}
      <table className={styles.particularsTable}>
        <thead>
          <tr>
            <th>Category / Particulars</th>
            <th className={styles.amountHeader}>Amount (₹)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>1. Gross Salary (as per provisions contained in section 17(1))</td>
            <td className={styles.amountCell}>{formatAmount(grossSalary)}</td>
          </tr>
          <tr>
            <td>2. Less: Standard Deduction u/s 16(ia)</td>
            <td className={styles.amountCell}>{formatAmount(standardDeduction)}</td>
          </tr>
          <tr className={styles.boldRow}>
            <td>3. Total Taxable Income Chargeable under &quot;Salaries&quot;</td>
            <td className={styles.amountCell}>{formatAmount(totalTaxableIncome)}</td>
          </tr>
          <tr>
            <td>4. Total Tax Payable / Net Tax Liability</td>
            <td className={styles.amountCell}>{formatAmount(totalTaxPayable)}</td>
          </tr>
          <tr className={styles.boldRow}>
            <td>5. Total Tax Deducted at Source (TDS Remitted)</td>
            <td className={styles.amountCell}>{formatAmount(totalTdsRemitted)}</td>
          </tr>
        </tbody>
      </table>

      {/* 4. Certification Statement */}
      <p className={styles.certificationBlock}>
        I, <strong>{employerName}</strong>, working in the capacity of Employer, do hereby certify
        that a sum of <strong>₹{formatAmount(totalTdsRemitted)}</strong> has been deducted at
        source and paid to the credit of the Central Government.
      </p>

      {/* 5. Footer Sign-off Block */}
      <div className={styles.footerRow}>
        <div className={styles.footerLeft}>
          <div>Date: {certDate}</div>
          <div>Place: {certPlace}</div>
        </div>

        <div className={styles.footerRight}>
          <div className={styles.signLine} />
          <div className={styles.signTitle}>Signature of Person Responsible for Deduction</div>
          <div className={styles.signSub}>Designation: Authorized Signatory</div>
        </div>
      </div>
    </article>
  );
}

/**
 * Main Form 16 Part B Report View
 */
export default function Form16ReportView({
  records = [],
  companyInfo = {},
  period = {},
  filters = {},
}) {
  const selectedEmpFilter = filters?.employee;
  const isAllEmployees = !selectedEmpFilter || selectedEmpFilter === 'All Employees';

  // Filter target employee if a specific employee was selected
  const targetEmployee = useMemo(() => {
    if (!records.length) return null;
    if (!isAllEmployees && selectedEmpFilter) {
      const targetTerm = selectedEmpFilter.includes('—')
        ? selectedEmpFilter.split('—')[0].trim().toLowerCase()
        : selectedEmpFilter.trim().toLowerCase();

      return (
        records.find((r) => {
          const idMatch = String(r.employeeId || '').toLowerCase() === targetTerm;
          const nameMatch = String(r.name || '').toLowerCase().includes(targetTerm);
          return idMatch || nameMatch;
        }) || records[0]
      );
    }
    return records[0];
  }, [records, selectedEmpFilter, isAllEmployees]);

  const employeesToRender = useMemo(() => {
    if (!isAllEmployees && targetEmployee) {
      return [targetEmployee];
    }
    return records;
  }, [records, isAllEmployees, targetEmployee]);

  if (!records || records.length === 0) {
    return (
      <div className={styles.emptyState}>
        <FileText size={40} color="#94a3b8" style={{ marginBottom: '12px' }} />
        <h4 className={styles.emptyTitle}>No Form 16 (Part B) Records Found</h4>
        <p className={styles.emptyText}>
          No employee records match your selected filters (Company:{' '}
          {filters?.company || 'All Companies'}, Department:{' '}
          {filters?.department || 'All Departments'}).
        </p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {employeesToRender.map((rec, idx) => (
        <Form16SheetItem
          key={rec.employeeId || rec.srNo || idx}
          record={rec}
          globalCompanyInfo={companyInfo}
          globalPeriod={period}
          filters={filters}
        />
      ))}
    </div>
  );
}
