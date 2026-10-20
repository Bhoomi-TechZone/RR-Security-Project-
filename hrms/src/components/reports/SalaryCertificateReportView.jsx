import React, { useMemo } from 'react';
import { FileText } from 'lucide-react';
import hrLogo from '../../assets/hrlogo.png';
import styles from './SalaryCertificateReportView.module.css';

/**
 * Format currency to Indian Rupees with two decimal places
 */
function formatINR(val) {
  const num = Number(val) || 0;
  return `₹${num.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Single Employee Salary Certificate Sheet Item (Matching Image 2)
 */
function SalaryCertificateSheetItem({ record, globalCompanyInfo, filters }) {
  const comp = record.companyInfo || globalCompanyInfo || {};
  const filterCompName =
    filters?.company && filters.company !== 'All Companies' ? filters.company : null;
  const employerName =
    record.companyName ||
    filterCompName ||
    comp.name ||
    'RR Security & Facilities';

  const employerAddress =
    record.companyAddress ||
    comp.address ||
    'G-75/A Block-G M.B. Extn Badarpur New Delhi Delhi 110044 India';

  const logoSrc = record.companyLogo || comp.logo || globalCompanyInfo?.logo || hrLogo;

  const employeeName = record.name || record.employeeName || '—';
  const employeeId = record.employeeId || record.employeeCode || '—';
  const employeeAddress =
    record.address ||
    record.presentAddress ||
    record.permanentAddress ||
    '—';

  const date =
    record.date ||
    new Date().toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });

  const b = record.salaryBreakup || {};
  const basicM = b.basic?.monthly ?? Number(record.basic || 0);
  const basicA = b.basic?.annual ?? basicM * 12;

  const hraM = b.hra?.monthly ?? Number(record.hra || 0);
  const hraA = b.hra?.annual ?? hraM * 12;

  const convM = b.conveyance?.monthly ?? Number(record.conveyance || 0);
  const convA = b.conveyance?.annual ?? convM * 12;

  const fixedM = b.fixed?.monthly ?? 0;
  const fixedA = b.fixed?.annual ?? fixedM * 12;

  const otM = b.overtime?.monthly ?? 0;
  const otA = b.overtime?.annual ?? otM * 12;

  const totalM = b.total?.monthly ?? (record.monthlyCtc || basicM + hraM + convM + fixedM + otM);
  const totalA = b.total?.annual ?? (record.annualCtc || totalM * 12);

  return (
    <article className={styles.documentSheet}>
      {/* 1. Header (Company details on Left, Logo on Right) */}
      <div className={styles.headerRow}>
        <div className={styles.headerLeft}>
          <h2 className={styles.companyName}>{employerName}</h2>
          <p className={styles.companyAddress}>{employerAddress}</p>
        </div>
        <div className={styles.headerRight}>
          <img
            src={logoSrc}
            alt={employerName}
            className={styles.companyLogo}
            onError={(e) => {
              if (e.target.src !== hrLogo) {
                e.target.src = hrLogo;
              }
            }}
          />
        </div>
      </div>

      <hr className={styles.headerDivider} />

      {/* 2. Document Title */}
      <h1 className={styles.titleMain}>SALARY CERTIFICATE</h1>

      {/* 3. Sub-bar (To Whom it may concern & Date) */}
      <div className={styles.metaRow}>
        <span className={styles.metaRecipient}>To Whom it may concern</span>
        <span className={styles.metaDate}>Date: {date}</span>
      </div>

      {/* 4. Certification Body */}
      <p className={styles.certParagraph}>
        This is to certify that <strong>{employeeName}</strong> (Employee ID: {employeeId}),
        residing at <strong>{employeeAddress}</strong>, is working at{' '}
        <strong>{employerName}</strong> and is earning <strong>{formatINR(totalA)}</strong> as
        CTC annually. The salary break-up is as given below:
      </p>

      {/* 5. Salary Break-up Table */}
      <table className={styles.salaryTable}>
        <thead>
          <tr>
            <th>EARNINGS</th>
            <th className={styles.textRight}>MONTHLY AMOUNT</th>
            <th className={styles.textRight}>ANNUAL AMOUNT</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Basic</td>
            <td className={styles.textRight}>{formatINR(basicM)}</td>
            <td className={styles.textRight}>{formatINR(basicA)}</td>
          </tr>
          <tr>
            <td>House Rent Allowance</td>
            <td className={styles.textRight}>{formatINR(hraM)}</td>
            <td className={styles.textRight}>{formatINR(hraA)}</td>
          </tr>
          <tr>
            <td>Conveyance Allowance</td>
            <td className={styles.textRight}>{formatINR(convM)}</td>
            <td className={styles.textRight}>{formatINR(convA)}</td>
          </tr>
          <tr>
            <td>Fixed Allowance</td>
            <td className={styles.textRight}>{formatINR(fixedM)}</td>
            <td className={styles.textRight}>{formatINR(fixedA)}</td>
          </tr>
          <tr>
            <td>Overtime Allowance</td>
            <td className={styles.textRight}>{formatINR(otM)}</td>
            <td className={styles.textRight}>{formatINR(otA)}</td>
          </tr>
          <tr className={styles.totalRow}>
            <td>TOTAL CTC</td>
            <td className={styles.textRight}>{formatINR(totalM)}</td>
            <td className={styles.textRight}>{formatINR(totalA)}</td>
          </tr>
        </tbody>
      </table>

      {/* 6. Confirmation Statement */}
      <p className={styles.confirmParagraph}>
        We hereby confirm that all the above details provided are as per our records, This
        certificate is being issued upon the request of the above employee for whatever legal
        purpose it may serve them best.
      </p>

      {/* 7. Signatory Block */}
      <div className={styles.signatoryBlock}>
        <div className={styles.signatoryCompany}>For {employerName}</div>
        <div className={styles.signatoryLine} />
        <div className={styles.signatoryTitle}>Authorized Signatory</div>
      </div>
    </article>
  );
}

/**
 * Main Salary Certificate Report View
 */
export default function SalaryCertificateReportView({
  records = [],
  companyInfo = {},
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
      const idTerm = selectedEmpFilter.includes('—')
        ? selectedEmpFilter.split('—')[1].trim().toLowerCase()
        : '';

      return (
        records.find((r) => {
          const id = String(r.employeeId || r.employeeCode || '').toLowerCase();
          const name = String(r.name || '').toLowerCase();
          if (idTerm && id === idTerm) return true;
          if (targetTerm && (name.includes(targetTerm) || id.includes(targetTerm))) return true;
          return false;
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
        <h4 className={styles.emptyTitle}>No Salary Certificate Records Found</h4>
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
        <SalaryCertificateSheetItem
          key={rec.employeeId || rec.srNo || idx}
          record={rec}
          globalCompanyInfo={companyInfo}
          filters={filters}
        />
      ))}
    </div>
  );
}
