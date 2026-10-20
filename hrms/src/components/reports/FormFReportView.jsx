import React, { useMemo } from 'react';
import { FileText } from 'lucide-react';
import styles from './FormFReportView.module.css';

/**
 * Single Employee Form F Gratuity Nomination Sheet Item
 */
function FormFSheetItem({ record, globalCompanyInfo, filters }) {
  // Dynamic employer resolution
  const comp = record.companyInfo || globalCompanyInfo || {};
  const filterCompName =
    filters?.company && filters.company !== 'All Companies' ? filters.company : null;
  const employerName = (
    record.companyName ||
    filterCompName ||
    comp.name ||
    'RR SECURITY & FACILITIES'
  ).toUpperCase();

  const employerAddress =
    record.companyAddress ||
    comp.address ||
    'G-75/A Street No 04 Block-G M.B. Extn., Badarpur, New Delhi-110044';

  const employeeName = record.name || record.employeeName || '—';
  const employeeUpperName = employeeName.toUpperCase();

  const sexMaritalStatus =
    record.sexMaritalStatus ||
    `${record.gender || '—'} | ${record.maritalStatus || '—'}`;

  const deptDesig =
    record.deptDesig ||
    (record.department && record.designation
      ? `${record.department} / ${record.designation}`
      : record.department || record.designation || '—');

  const appointmentDate = record.appointmentDate || record.joiningDate || '—';

  const permanentAddress =
    record.permanentAddress ||
    record.presentAddress ||
    record.address ||
    '—';

  const nominees =
    Array.isArray(record.nominees) && record.nominees.length > 0
      ? record.nominees
      : [];

  const todayDate =
    record.date ||
    new Date().toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });

  return (
    <article className={styles.documentSheet}>
      {/* 1. Header Titles */}
      <h1 className={styles.titleMain}>FORM &apos;F&apos;</h1>
      <p className={styles.subTitleRule}>
        [See sub-rule (1) of Rule 6] - NOMINATION UNDER PAYMENT OF GRATUITY ACT, 1972
      </p>

      {/* 2. To Employer Section */}
      <div className={styles.toSection}>
        <div className={styles.toLabel}>To,</div>
        <div className={styles.employerName}>{employerName}</div>
        <div className={styles.employerAddress}>{employerAddress}</div>
      </div>

      {/* 3. Nomination Opening Paragraph */}
      <p className={styles.nominationStatement}>
        I, <strong>{employeeUpperName}</strong>, whose particulars are given in the statement below,
        hereby nominate the person(s) mentioned below to receive the gratuity payable after my death
        in respect of my service in the establishment.
      </p>

      {/* 4. Statement & Particulars Section */}
      <div className={styles.sectionHeading}>STATEMENT &amp; PARTICULARS OF EMPLOYEE:</div>
      <table className={styles.particularsTable}>
        <tbody>
          <tr>
            <td className={styles.fieldLabelCell}>1. Name of Employee</td>
            <td className={styles.fieldValueCell}>{employeeName}</td>
          </tr>
          <tr>
            <td className={styles.fieldLabelCell}>2. Sex &amp; Marital Status</td>
            <td className={styles.fieldValueCell}>{sexMaritalStatus}</td>
          </tr>
          <tr>
            <td className={styles.fieldLabelCell}>3. Department / Designation</td>
            <td className={styles.fieldValueCell}>{deptDesig}</td>
          </tr>
          <tr>
            <td className={styles.fieldLabelCell}>4. Date of Appointment</td>
            <td className={styles.fieldValueCell}>{appointmentDate}</td>
          </tr>
          <tr>
            <td className={styles.fieldLabelCell}>5. Permanent Address</td>
            <td className={styles.fieldValueCell}>{permanentAddress}</td>
          </tr>
        </tbody>
      </table>

      {/* 5. Nominee Details Section */}
      <div className={styles.sectionHeading}>NOMINEE DETAILS:</div>
      <table className={styles.nomineeTable}>
        <thead>
          <tr>
            <th style={{ width: '28%' }}>Name of Nominee(s)</th>
            <th style={{ width: '32%' }}>Relationship with Employee</th>
            <th style={{ width: '18%' }}>Age of Nominee</th>
            <th style={{ width: '22%' }}>Proportion of Gratuity (%)</th>
          </tr>
        </thead>
        <tbody>
          {nominees.map((nom, index) => (
            <tr key={index}>
              <td>{nom.name || '—'}</td>
              <td>{nom.relationship || '—'}</td>
              <td>{nom.age || '—'}</td>
              <td>{nom.proportion || '—'}</td>
            </tr>
          ))}
          {nominees.length === 0 && (
            <tr>
              <td colSpan="4" style={{ textAlign: 'center', color: '#94a3b8', fontStyle: 'italic', padding: '12px' }}>
                No nominees recorded
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* 6. Employee Signature Block */}
      <div className={styles.signatureRow}>
        <div className={styles.dateBlock}>Date: {todayDate}</div>
        <div className={styles.empSignBlock}>
          <div className={styles.empSignLine} />
          <div className={styles.empSignLabel}>
            Signature / Thumb Impression of Employee
          </div>
        </div>
      </div>

      {/* 7. Horizontal Dashed Divider */}
      <hr className={styles.dashedDivider} />

      {/* 8. Employer Certificate Section */}
      <div className={styles.certificateSection}>
        <div className={styles.certificateTitle}>CERTIFICATE BY EMPLOYER:</div>
        <p className={styles.certificateText}>
          Certified that the particulars of the employee written above have been verified and
          recorded in the office of {employerName}.
        </p>

        <div className={styles.employerSignBlock}>
          <div className={styles.employerSignLabel}>
            Signature of Employer / Authorized Officer
          </div>
        </div>
      </div>
    </article>
  );
}

/**
 * Main Form F Gratuity Nomination Report View
 */
export default function FormFReportView({
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
        <h4 className={styles.emptyTitle}>No Form F Gratuity Records Found</h4>
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
        <FormFSheetItem
          key={rec.employeeId || rec.srNo || idx}
          record={rec}
          globalCompanyInfo={companyInfo}
          filters={filters}
        />
      ))}
    </div>
  );
}
