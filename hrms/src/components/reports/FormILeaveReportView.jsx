import React, { useState, useMemo } from 'react';
import {
  FileSpreadsheet,
  FileText,
  Printer,
  Calendar,
  Users,
  CheckCircle2,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import {
  downloadFormILeaveExcel,
  downloadFormILeaveCsv,
  downloadFormILeavePdf,
} from '../../utils/formILeaveExport';
import styles from './FormILeaveReportView.module.css';

/**
 * Statutory Register of Leave (Form I - Delhi Shops & Establishments Act) Interactive View
 * [FORM I, See Rule 14 of Delhi Shops and Establishments Rules, 1954]
 * Matches exact 11-column dual-section layout (Casual or Sickness Leave & Privilege Leave)
 * and header fields (Name & Establishment, Date of Employment, Name of Employee) shown in Image 1.
 */
export default function FormILeaveReportView({
  records = [],
  companyInfo = {},
  period = {},
  totals = {},
  selectedEmployeeData = null,
  employees = [],
  filters = {},
}) {
  // If employees list is provided, default to the selected employee or first employee
  const employeeList = useMemo(() => {
    if (employees && employees.length > 0) return employees;
    if (selectedEmployeeData) return [selectedEmployeeData];
    return [
      {
        employeeId: 'RRS-001',
        name: 'RAMESH KUMAR',
        displayName: 'RAMESH KUMAR (RRS-001)',
        dateOfEmployment: '15/03/2021',
        rows: records,
        balances: { remainingPrivilege: 11, remainingCasual: 7 },
        totals: {
          casualTotalAvailed: 5,
          privilegeTotalAvailed: 4,
          totalAvailed: 9,
        },
      },
    ];
  }, [employees, selectedEmployeeData, records]);

  const [selectedEmpId, setSelectedEmpId] = useState(
    selectedEmployeeData?.employeeId || employeeList[0]?.employeeId || 'RRS-001'
  );

  // Active employee data for Form I ledger
  const activeEmployee = useMemo(() => {
    return (
      employeeList.find((e) => e.employeeId === selectedEmpId) ||
      employeeList[0] ||
      {}
    );
  }, [employeeList, selectedEmpId]);

  const activeRows = activeEmployee.rows || [];
  const establishmentName =
    activeEmployee.establishmentName ||
    companyInfo?.name ||
    'RR SECURITY & FACILITIES';
  const employeeName = activeEmployee.displayName || activeEmployee.name || 'EMPLOYEE';
  const dateOfEmployment = activeEmployee.dateOfEmployment || '15/03/2021';

  // KPI Calculations
  const totalEmployeesCount = employeeList.length;
  const casualAvailed = activeRows.reduce(
    (sum, r) => sum + (Number(r.casualTotalAvailed) || 0),
    0
  );
  const privilegeAvailed = activeRows.reduce(
    (sum, r) => sum + (Number(r.privilegeTotalAvailed) || 0),
    0
  );
  const privilegeBalance =
    activeEmployee.balances?.remainingPrivilege ??
    Math.max(0, 15 - privilegeAvailed);

  // Export handlers
  const handleExportExcel = () => {
    downloadFormILeaveExcel(activeEmployee, companyInfo, period, { format: 'xlsx' });
  };

  const handleExportCsv = () => {
    downloadFormILeaveCsv(activeEmployee, companyInfo, period, { format: 'csv' });
  };

  const handleDownloadPdf = () => {
    downloadFormILeavePdf(activeEmployee, companyInfo, period, { mode: 'download' });
  };

  const handlePrint = () => {
    downloadFormILeavePdf(activeEmployee, companyInfo, period, { mode: 'print' });
  };

  // Filler rows to match format appearance
  const minRows = Math.max(8, activeRows.length);
  const fillerCount = Math.max(0, minRows - activeRows.length);

  return (
    <div className={styles.container}>
      {/* 1. KPI Summary Cards */}
      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <div className={`${styles.kpiIconWrap} ${styles.kpiIconBlue}`}>
            <Users size={20} />
          </div>
          <div className={styles.kpiContent}>
            <span className={styles.kpiLabel}>Registered Employees</span>
            <span className={styles.kpiValue}>{totalEmployeesCount}</span>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={`${styles.kpiIconWrap} ${styles.kpiIconGreen}`}>
            <Clock size={20} />
          </div>
          <div className={styles.kpiContent}>
            <span className={styles.kpiLabel}>Casual / Sick Availed</span>
            <span className={styles.kpiValue}>{casualAvailed} Days</span>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={`${styles.kpiIconWrap} ${styles.kpiIconOrange}`}>
            <Calendar size={20} />
          </div>
          <div className={styles.kpiContent}>
            <span className={styles.kpiLabel}>Privilege Leave Availed</span>
            <span className={styles.kpiValue}>{privilegeAvailed} Days</span>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={`${styles.kpiIconWrap} ${styles.kpiIconPurple}`}>
            <ShieldCheck size={20} />
          </div>
          <div className={styles.kpiContent}>
            <span className={styles.kpiLabel}>Privilege Leave Balance</span>
            <span className={styles.kpiValue}>{privilegeBalance} Days</span>
          </div>
        </div>
      </div>

      {/* 2. Action & Filter Toolbar */}
      <div className={styles.toolbarCard}>
        <div className={styles.toolbarLeft}>
          <label style={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>
            Select Employee Ledger:
          </label>
          <select
            className={styles.filterSelect}
            value={selectedEmpId}
            onChange={(e) => setSelectedEmpId(e.target.value)}
          >
            {employeeList.map((emp) => (
              <option key={emp.employeeId} value={emp.employeeId}>
                {emp.displayName || `${emp.name} (${emp.employeeId})`}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.toolbarRight}>
          <button
            type="button"
            className={styles.btnSecondary}
            onClick={handleExportExcel}
            title="Download Form I as Excel (.xlsx)"
          >
            <FileSpreadsheet size={15} />
            <span>Excel</span>
          </button>
          <button
            type="button"
            className={styles.btnSecondary}
            onClick={handleExportCsv}
            title="Download Form I as CSV (.csv)"
          >
            <FileText size={15} />
            <span>CSV</span>
          </button>
          <button
            type="button"
            className={styles.btnSecondary}
            onClick={handleDownloadPdf}
            title="Download Form I as PDF"
          >
            <FileText size={15} />
            <span>PDF</span>
          </button>
          <button
            type="button"
            className={styles.btnPrimary}
            onClick={handlePrint}
            title="Print Form I Register of Leave"
          >
            <Printer size={15} />
            <span>Print</span>
          </button>
        </div>
      </div>

      {/* 3. Statutory Form I Sheet matching Image 1 */}
      <div className={styles.sheetCard}>
        {/* Centered Heading */}
        <div className={styles.sheetTitleBlock}>
          <div className={styles.romanOne}>I</div>
          <div className={styles.formTitle}>FORM I</div>
          <div className={styles.formRule}>(See Rule 14)</div>
          <div className={styles.registerTitle}>Register of Leave</div>
        </div>

        {/* Header Fields matching Image 1 */}
        <div className={styles.headerFieldsBlock}>
          <div className={styles.fieldLine}>
            <div className={styles.fieldItem}>
              <span className={styles.fieldLabel}>Name and Establishment</span>
              <span className={styles.fieldValue}>{establishmentName}</span>
            </div>
            <div className={styles.fieldItem}>
              <span className={styles.fieldLabel}>Date of Employment</span>
              <span className={styles.fieldValue}>{dateOfEmployment}</span>
            </div>
          </div>
          <div className={styles.fieldLine}>
            <div className={styles.fieldItem}>
              <span className={styles.fieldLabel}>Name of Employee</span>
              <span className={styles.fieldValue}>{employeeName}</span>
            </div>
          </div>
        </div>

        {/* 11-Column Dual-Section Table matching Image 1 */}
        <div className={styles.tableWrapper}>
          <table className={styles.formITable}>
            <thead>
              {/* Level 1: Two Super Headers */}
              <tr>
                <th colSpan={5} className={styles.superHeaderCasual}>
                  Casual or Sickness Leave
                </th>
                <th colSpan={6} className={styles.superHeaderPrivilege}>
                  Privilege Leave
                </th>
              </tr>
              {/* Level 2: 11 Columns */}
              <tr>
                {/* 1 */}
                <th className={styles.subHeaderCell} style={{ width: '8%' }}>
                  Amount of<br />Leave
                </th>
                {/* 2 */}
                <th className={styles.subHeaderCell} style={{ width: '10%' }}>
                  Date of<br />Application if<br />any
                </th>
                {/* 3 */}
                <th className={styles.subHeaderCell} style={{ width: '8%' }}>
                  Leave Availed<br />From
                </th>
                {/* 4 */}
                <th className={styles.subHeaderCell} style={{ width: '8%' }}>
                  Leave Availed<br />To
                </th>
                {/* 5 */}
                <th className={styles.subHeaderCell} style={{ width: '8%' }}>
                  Total Leave<br />Availed
                </th>

                {/* 6 */}
                <th className={styles.subHeaderCell} style={{ width: '9%' }}>
                  Date of<br />Application
                </th>
                {/* 7 */}
                <th className={styles.subHeaderCell} style={{ width: '15%' }}>
                  Whether<br />Application<br />Granted or<br />Refused<br />Fully or<br />Partly
                </th>
                {/* 8 */}
                <th className={styles.subHeaderCell} style={{ width: '8%' }}>
                  Leave Availed<br />From
                </th>
                {/* 9 */}
                <th className={styles.subHeaderCell} style={{ width: '8%' }}>
                  Leave Availed<br />To
                </th>
                {/* 10 */}
                <th className={styles.subHeaderCell} style={{ width: '8%' }}>
                  Total Availed
                </th>
                {/* 11 */}
                <th className={styles.subHeaderCell} style={{ width: '10%' }}>
                  Balance at<br />the end of<br />the year
                </th>
              </tr>
            </thead>
            <tbody>
              {activeRows.length > 0 ? (
                activeRows.map((row, idx) => (
                  <tr key={row.rowId || `form-i-row-${idx}`}>
                    {/* Casual or Sickness Leave */}
                    <td className={styles.textCenter}>
                      {row.casualAmountOfLeave !== undefined ? row.casualAmountOfLeave : '—'}
                    </td>
                    <td className={styles.textCenter}>
                      {row.casualDateOfApplication || '—'}
                    </td>
                    <td className={styles.textCenter}>
                      {row.casualFrom || '—'}
                    </td>
                    <td className={styles.textCenter}>
                      {row.casualTo || '—'}
                    </td>
                    <td className={styles.textCenter}>
                      {row.casualTotalAvailed !== '—' && row.casualTotalAvailed !== undefined ? (
                        <span className={styles.boldBadgeCasual}>
                          {row.casualTotalAvailed}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>

                    {/* Privilege Leave */}
                    <td className={styles.textCenter}>
                      {row.privilegeDateOfApplication || '—'}
                    </td>
                    <td className={styles.textCenter}>
                      {row.privilegeGrantedOrRefused && row.privilegeGrantedOrRefused !== '—' ? (
                        <span
                          className={
                            row.privilegeGrantedOrRefused.toLowerCase().includes('refused')
                              ? styles.statusRejected
                              : styles.statusApproved
                          }
                        >
                          {row.privilegeGrantedOrRefused}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className={styles.textCenter}>
                      {row.privilegeFrom || '—'}
                    </td>
                    <td className={styles.textCenter}>
                      {row.privilegeTo || '—'}
                    </td>
                    <td className={styles.textCenter}>
                      {row.privilegeTotalAvailed !== '—' && row.privilegeTotalAvailed !== undefined ? (
                        <span className={styles.boldBadgePrivilege}>
                          {row.privilegeTotalAvailed}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className={styles.textCenter} style={{ fontWeight: 700 }}>
                      {row.privilegeBalanceAtEnd !== undefined ? row.privilegeBalanceAtEnd : '—'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={11} className={styles.textCenter} style={{ padding: '24px', color: '#64748b' }}>
                    No leave ledger records found for this employee.
                  </td>
                </tr>
              )}

              {/* Filler rows to match format appearance in Image 1 */}
              {Array.from({ length: fillerCount }).map((_, fIdx) => (
                <tr key={`filler-${fIdx}`} className={styles.emptyRow}>
                  <td>&nbsp;</td>
                  <td>&nbsp;</td>
                  <td>&nbsp;</td>
                  <td>&nbsp;</td>
                  <td>&nbsp;</td>
                  <td>&nbsp;</td>
                  <td>&nbsp;</td>
                  <td>&nbsp;</td>
                  <td>&nbsp;</td>
                  <td>&nbsp;</td>
                  <td>&nbsp;</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className={styles.tableTotalRow}>
                <td colSpan={4} style={{ textAlign: 'right', fontWeight: 800 }}>
                  Total Casual/Sick Availed:
                </td>
                <td className={styles.textCenter} style={{ color: '#1d4ed8' }}>
                  {casualAvailed}
                </td>
                <td colSpan={4} style={{ textAlign: 'right', fontWeight: 800 }}>
                  Total Privilege Availed:
                </td>
                <td className={styles.textCenter} style={{ color: '#7e22ce' }}>
                  {privilegeAvailed}
                </td>
                <td className={styles.textCenter} style={{ color: '#0f172a' }}>
                  Bal: {privilegeBalance}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
