import React, { useState, useMemo, useEffect } from 'react';
import {
  FileSpreadsheet,
  FileText,
  Printer,
  Calendar,
  Users,
  CheckCircle2,
  Clock,
  ShieldCheck,
  ChevronDown,
  Info,
  BarChart2,
} from 'lucide-react';
import {
  downloadFormILeaveExcel,
  downloadFormILeaveCsv,
  downloadFormILeavePdf,
} from '../../utils/formILeaveExport';
import styles from './FormILeaveReportView.module.css';

/**
 * Statutory Register of Leave — Form I (Delhi Shops & Establishments Act, 1954)
 * [FORM I, See Rule 14 of Delhi Shops and Establishments Rules, 1954]
 *
 * Fully dynamic: integrated with MongoDB leave data per employee per year.
 * Features: employee-wise ledger, entitlement summary bars, export PDF/Excel/CSV, print.
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
  // Build the employee list from API response — only real dynamic data
  const employeeList = useMemo(() => {
    if (employees && employees.length > 0) return employees;
    if (selectedEmployeeData && (selectedEmployeeData.employeeId || selectedEmployeeData.name)) {
      return [selectedEmployeeData];
    }
    if (records && records.length > 0) {
      return [
        {
          employeeId: filters.employee || '',
          name: filters.employee || 'Employee',
          displayName: filters.employee || 'Employee',
          dateOfEmployment: '—',
          rows: records,
          balances: {},
          entitlements: { casualSickness: 12, privilege: 15 },
          totals: totals || { casualTotalAvailed: 0, privilegeTotalAvailed: 0, totalAvailed: 0 },
        },
      ];
    }
    return [];
  }, [employees, selectedEmployeeData, records, filters.employee, totals]);

  const [selectedEmpId, setSelectedEmpId] = useState(
    selectedEmployeeData?.employeeId || employeeList[0]?.employeeId || ''
  );

  // Sync selection when data changes
  useEffect(() => {
    if (
      selectedEmployeeData?.employeeId &&
      selectedEmployeeData.employeeId !== selectedEmpId
    ) {
      setSelectedEmpId(selectedEmployeeData.employeeId);
    } else if (employeeList.length > 0 && !employeeList.some((e) => e.employeeId === selectedEmpId)) {
      setSelectedEmpId(employeeList[0].employeeId);
    }
  }, [selectedEmployeeData, employeeList, selectedEmpId]);

  const activeEmployee = useMemo(
    () =>
      employeeList.find((e) => e.employeeId === selectedEmpId) ||
      employeeList[0] ||
      null,
    [employeeList, selectedEmpId]
  );

  const activeRows = activeEmployee?.rows || [];
  const establishmentName =
    activeEmployee?.establishmentName || companyInfo?.name || filters?.company || '—';
  const employeeName =
    activeEmployee?.displayName || activeEmployee?.name || '—';
  const dateOfEmployment = activeEmployee?.dateOfEmployment || '—';

  // KPIs from live data
  // KPIs from live data
  const totalEmployeesCount = employeeList.length;
  const casualAvailed =
    activeEmployee?.totals?.casualTotalAvailed ??
    activeRows.reduce((sum, r) => sum + (Number(r.casualTotalAvailed) || 0), 0);
  const privilegeAvailed =
    activeEmployee?.totals?.privilegeTotalAvailed ??
    activeRows.reduce((sum, r) => sum + (Number(r.privilegeTotalAvailed) || 0), 0);
  const casualEntitled = activeEmployee?.entitlements?.casualSickness ?? 12;
  const privilegeEntitled = activeEmployee?.entitlements?.privilege ?? 15;
  const privilegeBalance =
    activeEmployee?.balances?.remainingPrivilege ?? Math.max(0, privilegeEntitled - privilegeAvailed);
  const casualBalance =
    activeEmployee?.balances?.remainingCasual ?? Math.max(0, casualEntitled - casualAvailed);

  const reportYear = period?.year || new Date().getFullYear();

  // Export handlers
  const handleExportExcel = () =>
    activeEmployee && downloadFormILeaveExcel(activeEmployee, companyInfo, period, { format: 'xlsx' });
  const handleExportCsv = () =>
    activeEmployee && downloadFormILeaveCsv(activeEmployee, companyInfo, period, { format: 'csv' });
  const handleDownloadPdf = () =>
    activeEmployee && downloadFormILeavePdf(activeEmployee, companyInfo, period, { mode: 'download' });
  const handlePrint = () =>
    activeEmployee && downloadFormILeavePdf(activeEmployee, companyInfo, period, { mode: 'print' });

  const classifyRow = (row) => {
    if (row.leaveTypeBadge) return row.leaveTypeBadge;
    if (row.privilegeTotalAvailed !== '—' && row.privilegeTotalAvailed !== undefined && row.privilegeTotalAvailed !== null)
      return 'Privilege Leave';
    if (row.casualTotalAvailed !== '—' && row.casualTotalAvailed !== undefined && row.casualTotalAvailed !== null)
      return 'Casual Leave';
    return null;
  };

  if (employeeList.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.actBanner}>
          <Info size={14} />
          <span>
            <strong>FORM I</strong>&nbsp;(See Rule 14) — Statutory Register of Leave under{' '}
            <strong>Delhi Shops &amp; Establishments Act, 1954</strong>. Report Year:{' '}
            <strong>{reportYear}</strong>
          </span>
        </div>
        <div className={styles.sheetCard} style={{ padding: '60px 24px', textAlign: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
            <Users size={36} style={{ color: '#94a3b8' }} />
            <h3 style={{ margin: 0, fontSize: '16px', color: '#1e293b', fontWeight: 600 }}>
              No Leave Records Found
            </h3>
            <p style={{ margin: 0, fontSize: '13px', color: '#64748b', maxWidth: '440px', lineHeight: 1.5 }}>
              No employee leave records found in the database for the selected filters in <strong>{reportYear}</strong>.
              Please select a different company, department, or month above and click <strong>Generate Report</strong>.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>

      {/* Act Info Banner */}
      <div className={styles.actBanner}>
        <Info size={14} />
        <span>
          <strong>FORM I</strong>&nbsp;(See Rule 14) — Statutory Register of Leave under{' '}
          <strong>Delhi Shops &amp; Establishments Act, 1954</strong>. Report Year:{' '}
          <strong>{reportYear}</strong>
        </span>
      </div>

      {/* KPI Cards */}
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
            <span className={styles.kpiValue}>
              {casualAvailed} <small>/ {casualEntitled} Days</small>
            </span>
          </div>
        </div>
        <div className={styles.kpiCard}>
          <div className={`${styles.kpiIconWrap} ${styles.kpiIconOrange}`}>
            <Calendar size={20} />
          </div>
          <div className={styles.kpiContent}>
            <span className={styles.kpiLabel}>Privilege Leave Availed</span>
            <span className={styles.kpiValue}>
              {privilegeAvailed} <small>/ {privilegeEntitled} Days</small>
            </span>
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

      {/* Entitlement Progress Bars */}
      <div className={styles.entitlementBar}>
        <div className={styles.entitlementItem}>
          <span className={styles.entLabel}>
            <BarChart2 size={12} /> Casual / Sick Leave
          </span>
          <div className={styles.progressWrap}>
            <div
              className={`${styles.progressFill} ${styles.progressCasual}`}
              style={{ width: `${Math.min(100, (casualAvailed / casualEntitled) * 100)}%` }}
            />
          </div>
          <span className={styles.entCount}>
            {casualAvailed}/{casualEntitled}d used &nbsp;·&nbsp; {casualBalance}d remaining
          </span>
        </div>
        <div className={styles.entitlementItem}>
          <span className={styles.entLabel}>
            <BarChart2 size={12} /> Privilege Leave
          </span>
          <div className={styles.progressWrap}>
            <div
              className={`${styles.progressFill} ${styles.progressPrivilege}`}
              style={{ width: `${Math.min(100, (privilegeAvailed / privilegeEntitled) * 100)}%` }}
            />
          </div>
          <span className={styles.entCount}>
            {privilegeAvailed}/{privilegeEntitled}d used &nbsp;·&nbsp; {privilegeBalance}d remaining
          </span>
        </div>
      </div>

      {/* Toolbar */}
      <div className={styles.toolbarCard}>
        <div className={styles.toolbarLeft}>
          <label className={styles.toolbarLabel}>Employee Ledger:</label>
          <div className={styles.selectWrap}>
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
            <ChevronDown size={14} className={styles.selectIcon} />
          </div>
          {activeEmployee.designation && (
            <span className={styles.empDesigBadge}>{activeEmployee.designation}</span>
          )}
          {activeEmployee.department && (
            <span className={styles.empDeptBadge}>{activeEmployee.department}</span>
          )}
        </div>
        <div className={styles.toolbarRight}>
          <button type="button" className={styles.btnSecondary} onClick={handleExportExcel} title="Excel">
            <FileSpreadsheet size={14} /><span>Excel</span>
          </button>
          <button type="button" className={styles.btnSecondary} onClick={handleExportCsv} title="CSV">
            <FileText size={14} /><span>CSV</span>
          </button>
          <button type="button" className={styles.btnSecondary} onClick={handleDownloadPdf} title="PDF">
            <FileText size={14} /><span>PDF</span>
          </button>
          <button type="button" className={styles.btnPrimary} onClick={handlePrint} title="Print">
            <Printer size={14} /><span>Print</span>
          </button>
        </div>
      </div>

      {/* Statutory Form I Sheet */}
      <div className={styles.sheetCard}>
        <div className={styles.sheetTitleBlock}>
          <div className={styles.romanOne}>I</div>
          <div className={styles.formTitle}>FORM I</div>
          <div className={styles.formRule}>(See Rule 14)</div>
          <div className={styles.registerTitle}>Register of Leave</div>
        </div>

        <div className={styles.headerFieldsBlock}>
          <div className={styles.fieldLine}>
            <div className={styles.fieldItem}>
              <span className={styles.fieldLabel}>Name and Establishment</span>
              <span className={styles.fieldDots}>..........</span>
              <span className={styles.fieldValue}>{establishmentName}</span>
            </div>
            <div className={styles.fieldItem}>
              <span className={styles.fieldLabel}>Date of Employment</span>
              <span className={styles.fieldDots}>..........</span>
              <span className={styles.fieldValue}>{dateOfEmployment}</span>
            </div>
          </div>
          <div className={styles.fieldLine}>
            <div className={styles.fieldItem}>
              <span className={styles.fieldLabel}>Name of Employee</span>
              <span className={styles.fieldDots}>..........</span>
              <span className={styles.fieldValue}>{employeeName}</span>
            </div>
            <div className={styles.fieldItem}>
              <span className={styles.fieldLabel}>Year</span>
              <span className={styles.fieldDots}>..........</span>
              <span className={styles.fieldValue}>{reportYear}</span>
            </div>
          </div>
        </div>

        {/* 11-Column Dual-Section Leave Table */}
        <div className={styles.tableWrapper}>
          <table className={styles.formITable}>
            <thead>
              <tr>
                <th colSpan={5} className={styles.superHeaderCasual}>
                  Casual or Sickness Leave
                </th>
                <th colSpan={6} className={styles.superHeaderPrivilege}>
                  Privilege Leave
                </th>
              </tr>
              <tr>
                <th className={styles.subHeaderCell} style={{ width: '8%' }}>Amount of<br />Leave</th>
                <th className={styles.subHeaderCell} style={{ width: '10%' }}>Date of<br />Application if<br />any</th>
                <th className={styles.subHeaderCell} style={{ width: '8%' }}>Leave Availed<br />From</th>
                <th className={styles.subHeaderCell} style={{ width: '8%' }}>Leave Availed<br />To</th>
                <th className={styles.subHeaderCell} style={{ width: '8%' }}>Total Leave<br />Availed</th>
                <th className={styles.subHeaderCell} style={{ width: '9%' }}>Date of<br />Application</th>
                <th className={styles.subHeaderCell} style={{ width: '15%' }}>Whether<br />Application<br />Granted or<br />Refused<br />Fully or<br />Partly</th>
                <th className={styles.subHeaderCell} style={{ width: '8%' }}>Leave Availed<br />From</th>
                <th className={styles.subHeaderCell} style={{ width: '8%' }}>Leave Availed<br />To</th>
                <th className={styles.subHeaderCell} style={{ width: '8%' }}>Total Availed</th>
                <th className={styles.subHeaderCell} style={{ width: '10%' }}>Balance at<br />the end of<br />the year</th>
              </tr>
            </thead>
            <tbody>
              {activeRows.length > 0 ? (
                activeRows.map((row, idx) => {
                  const rowType = classifyRow(row);
                  return (
                    <tr
                      key={row.rowId || `form-i-row-${idx}`}
                      className={
                        rowType === 'Privilege Leave'
                          ? styles.rowPrivilege
                          : rowType
                          ? styles.rowCasual
                          : ''
                      }
                    >
                      <td className={styles.textCenter}>
                        {row.casualAmountOfLeave !== undefined && row.casualAmountOfLeave !== '—'
                          ? row.casualAmountOfLeave
                          : <span className={styles.dash}>—</span>}
                      </td>
                      <td className={styles.textCenter}>
                        {row.casualDateOfApplication && row.casualDateOfApplication !== '—'
                          ? row.casualDateOfApplication
                          : <span className={styles.dash}>—</span>}
                      </td>
                      <td className={styles.textCenter}>
                        {row.casualFrom && row.casualFrom !== '—'
                          ? row.casualFrom
                          : <span className={styles.dash}>—</span>}
                      </td>
                      <td className={styles.textCenter}>
                        {row.casualTo && row.casualTo !== '—'
                          ? row.casualTo
                          : <span className={styles.dash}>—</span>}
                      </td>
                      <td className={styles.textCenter}>
                        {row.casualTotalAvailed !== '—' && row.casualTotalAvailed !== undefined && row.casualTotalAvailed !== null ? (
                          <span className={styles.boldBadgeCasual}>{row.casualTotalAvailed}</span>
                        ) : (
                          <span className={styles.dash}>—</span>
                        )}
                      </td>
                      <td className={styles.textCenter}>
                        {row.privilegeDateOfApplication && row.privilegeDateOfApplication !== '—'
                          ? row.privilegeDateOfApplication
                          : <span className={styles.dash}>—</span>}
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
                          <span className={styles.dash}>—</span>
                        )}
                      </td>
                      <td className={styles.textCenter}>
                        {row.privilegeFrom && row.privilegeFrom !== '—'
                          ? row.privilegeFrom
                          : <span className={styles.dash}>—</span>}
                      </td>
                      <td className={styles.textCenter}>
                        {row.privilegeTo && row.privilegeTo !== '—'
                          ? row.privilegeTo
                          : <span className={styles.dash}>—</span>}
                      </td>
                      <td className={styles.textCenter}>
                        {row.privilegeTotalAvailed !== '—' && row.privilegeTotalAvailed !== undefined && row.privilegeTotalAvailed !== null ? (
                          <span className={styles.boldBadgePrivilege}>{row.privilegeTotalAvailed}</span>
                        ) : (
                          <span className={styles.dash}>—</span>
                        )}
                      </td>
                      <td className={`${styles.textCenter} ${styles.balanceCell}`}>
                        {row.privilegeBalanceAtEnd !== undefined && row.privilegeBalanceAtEnd !== '—'
                          ? row.privilegeBalanceAtEnd
                          : <span className={styles.dash}>—</span>}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan={11}
                    className={styles.textCenter}
                    style={{ padding: '28px 16px', color: '#64748b', fontSize: '13px' }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                      <CheckCircle2 size={24} style={{ color: '#94a3b8' }} />
                      <span>
                        No leave records found for <strong>{employeeName}</strong> in{' '}
                        <strong>{reportYear}</strong>.
                      </span>
                      <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                        Use filters above and click "Generate Report" to load live data.
                      </span>
                    </div>
                  </td>
                </tr>
              )}

            </tbody>
            <tfoot>
              <tr className={styles.tableTotalRow}>
                <td colSpan={4} style={{ textAlign: 'right', fontWeight: 800, fontSize: '12px' }}>
                  Total Casual/Sick Availed:
                </td>
                <td className={styles.textCenter} style={{ color: '#1d4ed8', fontWeight: 800 }}>
                  {casualAvailed}
                </td>
                <td colSpan={4} style={{ textAlign: 'right', fontWeight: 800, fontSize: '12px' }}>
                  Total Privilege Availed:
                </td>
                <td className={styles.textCenter} style={{ color: '#7e22ce', fontWeight: 800 }}>
                  {privilegeAvailed}
                </td>
                <td className={styles.textCenter} style={{ color: '#0f172a', fontWeight: 800 }}>
                  Bal: {privilegeBalance}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Statutory Footer Note */}
        <div className={styles.statutoryNote}>
          <span>
            * Per <strong>Delhi Shops &amp; Establishments Act, 1954</strong> — §22(1)(a): Privilege Leave
            (1 day / 20 days worked); §22(1)(b): Casual Leave (12 days/year); §22(1)(c): Sick Leave (12 days/year).
          </span>
        </div>
      </div>
    </div>
  );
}