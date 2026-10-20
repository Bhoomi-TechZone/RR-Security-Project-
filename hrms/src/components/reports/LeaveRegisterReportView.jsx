import React, { useState, useMemo } from 'react';
import {
  FileSpreadsheet,
  FileText,
  Printer,
  Calendar,
  Users,
  CheckCircle2,
  Clock,
  Search,
} from 'lucide-react';
import {
  downloadLeaveRegisterExcel,
  downloadLeaveRegisterCsv,
  downloadLeaveRegisterPdf,
} from '../../utils/leaveRegisterExport';
import styles from './LeaveRegisterReportView.module.css';

/**
 * Statutory Register of Leave Interactive View
 * [Form I under Delhi Shops & Establishments Act / Form XXV under Factories Rules]
 * Matches exact structure and layout shown in statutory Register of Leave reference (Image 1).
 */
export default function LeaveRegisterReportView({
  records = [],
  companyInfo = {},
  period = {},
  totals = {},
  statutoryNotes = [],
  filters = {},
}) {
  const [selectedEmployee, setSelectedEmployee] = useState('All');
  const [selectedLeaveType, setSelectedLeaveType] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  const establishmentName = companyInfo?.name || 'RR SECURITY & FACILITIES';
  const establishmentAddress =
    companyInfo?.address ||
    'G-75/A, Ground Floor, Block-G M.B. EXTN., Badarpur New Delhi-110044';
  const registrationNo =
    companyInfo?.registrationNo ||
    companyInfo?.gstin ||
    companyInfo?.pan ||
    'DL-SHOPS/110044/2016';

  // Build unique employees for dropdown filter
  const uniqueEmployees = useMemo(() => {
    const map = new Map();
    records.forEach((r) => {
      const id = r.employeeId || r.employeeName;
      if (id && !map.has(id)) {
        map.set(id, { id, name: r.employeeName, code: r.employeeId });
      }
    });
    return Array.from(map.values());
  }, [records]);

  // Filtered records
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      // Employee filter
      if (
        selectedEmployee !== 'All' &&
        r.employeeId !== selectedEmployee &&
        r.employeeName !== selectedEmployee
      ) {
        return false;
      }

      // Leave Type filter
      if (selectedLeaveType !== 'All') {
        const lt = (r.leaveType || '').toLowerCase();
        const lc = (r.leaveCode || '').toLowerCase();
        const target = selectedLeaveType.toLowerCase();
        if (!lt.includes(target) && !lc.includes(target)) {
          return false;
        }
      }

      // Search term
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matches =
          (r.employeeName && r.employeeName.toLowerCase().includes(q)) ||
          (r.employeeId && r.employeeId.toLowerCase().includes(q)) ||
          (r.dateOfApplication && r.dateOfApplication.toLowerCase().includes(q)) ||
          (r.appliedFrom && r.appliedFrom.toLowerCase().includes(q)) ||
          (r.appliedTo && r.appliedTo.toLowerCase().includes(q)) ||
          (r.leaveType && r.leaveType.toLowerCase().includes(q));
        if (!matches) return false;
      }

      return true;
    });
  }, [records, selectedEmployee, selectedLeaveType, searchTerm]);

  // Dynamic KPI Stats
  const totalApplications = filteredRecords.length;
  const totalDays = filteredRecords.reduce((sum, r) => sum + (Number(r.noOfDays) || 0), 0);
  const uniqueEmpCount = new Set(filteredRecords.map((r) => r.employeeId)).size;
  const avgEntitled = filteredRecords.length > 0
    ? (filteredRecords.reduce((sum, r) => sum + (Number(r.entitledDays) || 0), 0) / filteredRecords.length).toFixed(1)
    : 12;

  // Handlers for export
  const handleExportExcel = () => {
    downloadLeaveRegisterExcel(
      filteredRecords,
      companyInfo,
      period,
      { totalDays, totalApplications },
      { format: 'xlsx' }
    );
  };

  const handleExportCsv = () => {
    downloadLeaveRegisterCsv(
      filteredRecords,
      companyInfo,
      period,
      { totalDays, totalApplications },
      { format: 'csv' }
    );
  };

  const handlePrint = () => {
    downloadLeaveRegisterPdf(
      filteredRecords,
      companyInfo,
      period,
      { totalDays, totalApplications },
      { mode: 'print' }
    );
  };

  const handleDownloadPdf = () => {
    downloadLeaveRegisterPdf(
      filteredRecords,
      companyInfo,
      period,
      { totalDays, totalApplications },
      { mode: 'download' }
    );
  };

  // Minimum row count so table looks like the full register sheet in Image 1
  const minRows = Math.max(8, filteredRecords.length);
  const fillerCount = Math.max(0, minRows - filteredRecords.length);

  return (
    <div className={styles.container}>
      {/* 1. KPI Summary Cards */}
      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <div className={`${styles.kpiIconWrap} ${styles.kpiIconBlue}`}>
            <Calendar size={20} />
          </div>
          <div className={styles.kpiContent}>
            <span className={styles.kpiLabel}>Total Applications</span>
            <span className={styles.kpiValue}>{totalApplications}</span>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={`${styles.kpiIconWrap} ${styles.kpiIconGreen}`}>
            <Clock size={20} />
          </div>
          <div className={styles.kpiContent}>
            <span className={styles.kpiLabel}>Total Leave Days</span>
            <span className={styles.kpiValue}>{totalDays} Days</span>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={`${styles.kpiIconWrap} ${styles.kpiIconOrange}`}>
            <Users size={20} />
          </div>
          <div className={styles.kpiContent}>
            <span className={styles.kpiLabel}>Employees on Leave</span>
            <span className={styles.kpiValue}>{uniqueEmpCount}</span>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={`${styles.kpiIconWrap} ${styles.kpiIconPurple}`}>
            <CheckCircle2 size={20} />
          </div>
          <div className={styles.kpiContent}>
            <span className={styles.kpiLabel}>Avg. Entitlement</span>
            <span className={styles.kpiValue}>{avgEntitled} Days</span>
          </div>
        </div>
      </div>

      {/* 2. Action & Filter Toolbar */}
      <div className={styles.toolbarCard}>
        <div className={styles.toolbarLeft}>
          {/* Employee Filter */}
          <select
            className={styles.filterSelect}
            value={selectedEmployee}
            onChange={(e) => setSelectedEmployee(e.target.value)}
          >
            <option value="All">All Employees ({records.length})</option>
            {uniqueEmployees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.name} ({emp.code})
              </option>
            ))}
          </select>

          {/* Leave Type Filter */}
          <select
            className={styles.filterSelect}
            value={selectedLeaveType}
            onChange={(e) => setSelectedLeaveType(e.target.value)}
          >
            <option value="All">All Leave Types</option>
            <option value="Casual Leave">Casual Leave (CL)</option>
            <option value="Sick Leave">Sick Leave (SL)</option>
            <option value="Earned Leave">Earned Leave (EL)</option>
          </select>

          {/* Search Input */}
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search dates, names, ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className={styles.toolbarRight}>
          <button
            type="button"
            className={styles.btnSecondary}
            onClick={handleExportExcel}
            title="Download Excel (.xlsx)"
          >
            <FileSpreadsheet size={15} />
            <span>Excel</span>
          </button>
          <button
            type="button"
            className={styles.btnSecondary}
            onClick={handleExportCsv}
            title="Download CSV"
          >
            <FileText size={15} />
            <span>CSV</span>
          </button>
          <button
            type="button"
            className={styles.btnSecondary}
            onClick={handleDownloadPdf}
            title="Download PDF"
          >
            <FileText size={15} />
            <span>PDF</span>
          </button>
          <button
            type="button"
            className={styles.btnPrimary}
            onClick={handlePrint}
            title="Print Register of Leave"
          >
            <Printer size={15} />
            <span>Print</span>
          </button>
        </div>
      </div>

      {/* 3. Statutory Register Card Matching Image 1 */}
      <div className={styles.sheetCard}>
        <div className={styles.sheetHeader}>
          <h2 className={styles.sheetTitle}>REGISTER OF LEAVE</h2>
          <p className={styles.sheetSubtitle}>
            [Form I - Delhi Shops & Establishments Act / Form XXV - Factories Rules]
          </p>
        </div>

        {/* Top Establishment Box (Image 1 Header Box with 3 rows) */}
        <div className={styles.establishmentBox}>
          <div className={styles.establishmentRow}>
            <span className={styles.fieldLabel}>Name of the Establishment/Shop :</span>
            <span className={styles.fieldValue}>{establishmentName}</span>
          </div>
          <div className={styles.establishmentRow}>
            <span className={styles.fieldLabel}>Address :</span>
            <span className={styles.fieldValue}>{establishmentAddress}</span>
          </div>
          <div className={styles.establishmentRow}>
            <span className={styles.fieldLabel}>Registration No :</span>
            <span className={styles.fieldValue}>{registrationNo}</span>
          </div>
        </div>

        {/* Statutory 5-Column Table */}
        <div className={styles.tableWrapper}>
          <table className={styles.statutoryTable}>
            <thead>
              {/* Row 1: 5 Columns */}
              <tr>
                <th className={styles.colHeaderMain} style={{ width: '18%' }}>
                  Date of application
                </th>
                <th className={styles.colHeaderMain} style={{ width: '18%' }}>
                  Applied From
                </th>
                <th className={styles.colHeaderMain} style={{ width: '18%' }}>
                  Applied to
                </th>
                <th className={styles.colHeaderMain} style={{ width: '16%' }}>
                  No. of days
                </th>
                <th className={styles.colHeaderMain} style={{ width: '30%' }}>
                  No. of days to which the employee is entitled
                </th>
              </tr>
              {/* Row 2: Column Numbers 1 to 5 */}
              <tr>
                <th className={styles.colHeaderNum}>1</th>
                <th className={styles.colHeaderNum}>2</th>
                <th className={styles.colHeaderNum}>3</th>
                <th className={styles.colHeaderNum}>4</th>
                <th className={styles.colHeaderNum}>5</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.length > 0 ? (
                filteredRecords.map((r, idx) => {
                  const isCL = (r.leaveCode === 'CL') || (r.leaveType && r.leaveType.toLowerCase().includes('casual'));
                  const isSL = (r.leaveCode === 'SL') || (r.leaveType && r.leaveType.toLowerCase().includes('sick'));

                  return (
                    <tr key={r.leaveId ? `${r.leaveId}-${idx}` : `leave-${idx}`}>
                      {/* Col 1: Date of application */}
                      <td className={styles.textCenter}>
                        <strong>{r.dateOfApplication || '—'}</strong>
                        <div className={styles.empSubLabel}>
                          {r.employeeName} ({r.employeeId})
                        </div>
                      </td>

                      {/* Col 2: Applied From */}
                      <td className={styles.textCenter}>
                        {r.appliedFrom || '—'}
                      </td>

                      {/* Col 3: Applied to */}
                      <td className={styles.textCenter}>
                        {r.appliedTo || '—'}
                      </td>

                      {/* Col 4: No. of days */}
                      <td className={styles.textCenter}>
                        <span className={styles.daysBadge}>
                          {r.noOfDays} {r.noOfDays === 1 ? 'Day' : 'Days'}
                        </span>
                      </td>

                      {/* Col 5: No. of days to which the employee is entitled */}
                      <td className={styles.textCenter}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                          <span className={styles.entitledBadge}>
                            {r.entitledDays || 12} Days
                          </span>
                          <span
                            className={
                              isSL
                                ? styles.typeBadgeSL
                                : isCL
                                ? styles.typeBadgeCL
                                : styles.typeBadgeEL
                            }
                          >
                            {r.leaveCode || (isSL ? 'SL' : isCL ? 'CL' : 'EL')}
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className={styles.textCenter} style={{ padding: '24px', color: '#64748b' }}>
                    No leave records found matching current selection.
                  </td>
                </tr>
              )}

              {/* Filler rows to match format appearance */}
              {Array.from({ length: fillerCount }).map((_, fIdx) => (
                <tr key={`filler-${fIdx}`} className={styles.emptyRow}>
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
                <td className={styles.textCenter} style={{ fontWeight: 800 }}>
                  Total Applications: {filteredRecords.length}
                </td>
                <td></td>
                <td style={{ textAlign: 'right', fontWeight: 800 }}>Total Days:</td>
                <td className={styles.textCenter} style={{ fontWeight: 800, color: '#1d4ed8' }}>
                  {totalDays} Days
                </td>
                <td className={styles.textCenter} style={{ color: '#475569' }}>
                  Avg Entitlement: {avgEntitled} Days
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* 4. Bottom Statutory Notes (Matching Image 1 Verbatim) */}
        <div className={styles.notesSection}>
          <div className={styles.noteItem}>
            Note: Sick Leave (Same as the statement for leave with wages).
          </div>
          <div className={styles.noteItem}>
            Casual Leave ( Same as the statement for leave with wages)
          </div>
        </div>
      </div>
    </div>
  );
}
