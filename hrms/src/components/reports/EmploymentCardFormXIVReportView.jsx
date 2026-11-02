import React, { useMemo, useState } from 'react';
import {
  FileText,
  FileSpreadsheet,
  Printer,
  Users,
  Building2,
  ShieldCheck,
  Award,
} from 'lucide-react';
import {
  downloadEmploymentCardPdf,
  downloadEmploymentCardExcel,
} from '../../utils/employmentCardExport';
import styles from './EmploymentCardFormXIVReportView.module.css';

/**
 * Single Form XIV Employment Card Item (matching Image 1)
 */
export function SingleEmploymentCardItem({ record, globalCompanyInfo }) {
  const defaultComp = globalCompanyInfo || {};
  const contractorName = record.contractorName || defaultComp.name || 'RR SECURITY & FACILITIES';
  const contractorAddress =
    record.contractorAddress ||
    defaultComp.address ||
    'G-75/A, Ground Floor, Block-G M.B. EXTN., Badarpur New Delhi-110044';

  const establishmentName = record.establishmentName || 'Client Establishment Site';
  const establishmentAddress = record.establishmentAddress || 'Premises / Site within Delhi NCR';

  const workNameLocation =
    record.workNameLocation || `Security & Facility Services, At ${establishmentName}`;
  const principalEmployer =
    record.principalEmployer ||
    `The Management / Authorized Officer, ${establishmentName}, ${establishmentAddress}`;

  const workmanName = (record.workmanName || record.name || record.employeeName || '—').toUpperCase();
  const serialNo =
    record.serialNoInRegister || record.employeeCode || record.employeeId || '—';
  const designation = record.natureOfEmployment || record.designation || 'Staff';
  const wageRate = record.wageRate || '—';
  const wagePeriod = record.wagePeriod || 'Monthly';
  const tenure =
    record.tenureOfEmployment ||
    'During the currency of the contract with Principal Employer';
  const remarks = record.remarks || '—';

  return (
    <article className={styles.cardOuterFrame}>
      <div className={styles.cardInnerFrame}>
        {/* Header Block */}
        <div className={styles.cardHeaderBlock}>
          <h2 className={styles.titleFormXIV}>Form XIV</h2>
          <div className={styles.ruleSub}>(See Rule 76)</div>
          <div className={styles.headingEmploymentCard}>Employment Card</div>
        </div>

        {/* Table Rows (Matching Image 1) */}
        <table className={styles.cardTable}>
          <tbody>
            <tr>
              <td className={styles.labelCol}>Name and Address of Contractor :</td>
              <td className={styles.valueCol}>
                <strong>{contractorName}</strong>
                <br />
                {contractorAddress}
              </td>
            </tr>

            <tr>
              <td className={styles.labelCol}>
                Name and Address of Establishment in/ under which Contract is Carried on :
              </td>
              <td className={styles.valueCol}>
                <strong>{establishmentName}</strong>
                <br />
                {establishmentAddress}
              </td>
            </tr>

            <tr>
              <td className={styles.labelCol}>Name of Work and Location of Work :</td>
              <td className={styles.valueCol}>{workNameLocation}</td>
            </tr>

            <tr>
              <td className={styles.labelCol}>Name and Address of Principal Employer :</td>
              <td className={styles.valueCol}>{principalEmployer}</td>
            </tr>

            <tr>
              <td className={styles.labelCol}>1. Name of the Workman :</td>
              <td className={`${styles.valueCol} ${styles.boldValue}`}>{workmanName}</td>
            </tr>

            <tr>
              <td className={styles.labelCol}>
                2. S.No. in the Register of Workmen Employed :
              </td>
              <td className={styles.valueCol}>{serialNo}</td>
            </tr>

            <tr>
              <td className={styles.labelCol}>3. Nature of Employment/Designation :</td>
              <td className={styles.valueCol}>{designation}</td>
            </tr>

            <tr>
              <td className={styles.labelCol}>
                4. Wage Rate (with particulars of unit in case of piece-work) :
              </td>
              <td className={styles.valueCol}>{wageRate}</td>
            </tr>

            <tr>
              <td className={styles.labelCol}>5. Wage Period :</td>
              <td className={styles.valueCol}>{wagePeriod}</td>
            </tr>

            <tr>
              <td className={styles.labelCol}>6. Tenure of Employment :</td>
              <td className={styles.valueCol}>{tenure}</td>
            </tr>

            <tr>
              <td className={styles.labelCol}>7. Remarks :</td>
              <td className={styles.valueCol}>{remarks}</td>
            </tr>
          </tbody>
        </table>

        {/* Signature Area */}
        <div className={styles.signatureSection}>
          <span className={styles.sigScript}>Kashish</span>
          <span className={styles.sigTitle}>Signature of Contractor</span>
        </div>
      </div>
    </article>
  );
}

/**
 * Main Dynamic Form XIV Employment Card Report View
 */
export default function EmploymentCardFormXIVReportView({
  records = [],
  companyInfo = {},
  filters = {},
}) {
  const [selectedWorkmanId, setSelectedWorkmanId] = useState('ALL');

  const selectedEmpFilter = filters?.employee;
  const isAllEmployees = !selectedEmpFilter || selectedEmpFilter === 'All Employees';

  // Filter target employee if specified from parent filters
  const filteredRecords = useMemo(() => {
    if (!records.length) return [];
    if (!isAllEmployees && selectedEmpFilter) {
      const targetTerm = selectedEmpFilter.includes('—')
        ? selectedEmpFilter.split('—')[0].trim().toLowerCase()
        : selectedEmpFilter.trim().toLowerCase();
      const idTerm = selectedEmpFilter.includes('—')
        ? selectedEmpFilter.split('—')[1].trim().toLowerCase()
        : '';

      const matched = records.filter((r) => {
        const id = String(r.employeeId || r.employeeCode || '').toLowerCase();
        const name = String(r.workmanName || r.name || '').toLowerCase();
        if (idTerm && id === idTerm) return true;
        if (targetTerm && (name.includes(targetTerm) || id.includes(targetTerm))) return true;
        return false;
      });
      return matched.length ? matched : records;
    }
    return records;
  }, [records, selectedEmpFilter, isAllEmployees]);

  // Display selection based on local dropdown
  const cardsToRender = useMemo(() => {
    if (selectedWorkmanId === 'ALL') {
      return filteredRecords;
    }
    const single = filteredRecords.find(
      (r) => String(r.employeeId || r.employeeCode) === selectedWorkmanId
    );
    return single ? [single] : filteredRecords;
  }, [filteredRecords, selectedWorkmanId]);

  const handlePrint = () => {
    downloadEmploymentCardPdf(cardsToRender, companyInfo, { mode: 'print' });
  };

  const handleExportPdf = () => {
    downloadEmploymentCardPdf(cardsToRender, companyInfo, { mode: 'download' });
  };

  const handleExportExcel = () => {
    downloadEmploymentCardExcel(cardsToRender, companyInfo);
  };

  if (!records || records.length === 0) {
    return (
      <div className={styles.emptyState}>
        <FileText size={40} color="#94a3b8" style={{ marginBottom: '10px' }} />
        <h4 className={styles.emptyTitle}>No Employment Cards Found</h4>
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
      {/* 2. Action Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.toolbarLeft}>
          <span className={styles.badgeWorkmen}>
            {records.length} {records.length === 1 ? 'Workman Card' : 'Workmen Cards'}
          </span>

          {filteredRecords.length > 1 && (
            <select
              className={styles.workmanSelector}
              value={selectedWorkmanId}
              onChange={(e) => setSelectedWorkmanId(e.target.value)}
            >
              <option value="ALL">Show All Workmen Cards ({filteredRecords.length})</option>
              {filteredRecords.map((r, i) => (
                <option key={r.employeeId || i} value={String(r.employeeId || r.employeeCode)}>
                  {r.workmanName || r.name} ({r.employeeCode || r.employeeId})
                </option>
              ))}
            </select>
          )}
        </div>

        
      </div>

      {/* 3. Cards List View */}
      <div className={styles.cardsListWrapper}>
        {cardsToRender.map((card, idx) => (
          <SingleEmploymentCardItem
            key={card.employeeId || card.employeeCode || idx}
            record={card}
            globalCompanyInfo={companyInfo}
          />
        ))}
      </div>
    </div>
  );
}
