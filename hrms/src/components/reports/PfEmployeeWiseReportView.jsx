import React, { useState, useMemo } from 'react';
import {
  FileSpreadsheet,
  Download,
  Search,
  ShieldCheck,
  Calendar,
  Users
} from 'lucide-react';
import { downloadPfEmployeeWiseExcel } from '../../utils/pfEmployeeWiseExport';
import styles from './PfEmployeeWiseReportView.module.css';

/**
 * Statutory Employee-Wise Monthly PF Report View
 * Excel ONLY format per explicit user instruction.
 * 14 Columns + Bottom Account Reconciliation Box matching screenshot:
 * Sr# | Code | UAN | Employee Name | Days | PF Wages | PF (12%) | EPF (3.67%) | EPS (8.33%) | Total | A/C-21 (0.5%) | A/C-2 (0.5%) | A/C-22 (0.0%) | G.Total
 */
export default function PfEmployeeWiseReportView({
  reportData = {},
  filters = {}
}) {
  const records = reportData.records || [];
  const totals = reportData.totals || {};
  const acSummary = reportData.accountSummary || {};
  const companyName = reportData.companyName || 'RR SECURITY & FACILITIES';
  const forMonthString = reportData.forMonthString || '9,2026';
  const locationName = reportData.locationName || 'Petal communication';
  const monthLabel = reportData.monthLabel || 'Current Month';
  const summaryCards = reportData.summaryCards || [];

  const [searchQuery, setSearchQuery] = useState('');

  const filteredRecords = useMemo(() => {
    if (!searchQuery.trim()) return records;
    const q = searchQuery.toLowerCase().trim();
    return records.filter(
      (r) =>
        String(r.code || '').toLowerCase().includes(q) ||
        String(r.uan || '').toLowerCase().includes(q) ||
        String(r.employeeName || '').toLowerCase().includes(q)
    );
  }, [records, searchQuery]);

  const handleDownloadExcel = () => {
    downloadPfEmployeeWiseExcel({
      ...reportData,
      records: filteredRecords.length > 0 ? filteredRecords : records,
    });
  };

  return (
    <div className={styles.container}>
      {/* Top Action Toolbar (Excel ONLY per user requirement) */}
      <div className={styles.toolbar}>
        <div className={styles.toolbarLeft}>
          <span className={styles.badge}>
            <ShieldCheck size={16} />
            <span>EPFO Employee Wise Monthly PF Report</span>
          </span>

          <span className={`${styles.badge} ${styles.badgeSuccess}`}>
            <Calendar size={15} />
            <span>FOR THE MONTH OF : {forMonthString}</span>
          </span>

          <span className={`${styles.badge} ${styles.badgeInfo}`}>
            <Users size={15} />
            <span>{records.length} Employees</span>
          </span>
        </div>

        <div className={styles.toolbarRight}>
          <div className={styles.searchInputWrapper}>
            <Search size={14} className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search Code, UAN, Name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
              aria-label="Search Employee PF Records"
            />
          </div>

          <button
            type="button"
            className={styles.excelBtn}
            onClick={handleDownloadExcel}
            title="Download Official Employee Wise PF Excel (.xlsx)"
          >
            <Download size={15} />
            <FileSpreadsheet size={15} />
            <span>Download Excel (.xlsx)</span>
          </button>
        </div>
      </div>

      {/* KPI Metric Cards */}
      {summaryCards.length > 0 && (
        <div className={styles.summaryGrid}>
          {summaryCards.map((card, idx) => (
            <div key={idx} className={`${styles.summaryCard} ${styles[card.tone] || ''}`}>
              <div className={styles.cardLabel}>{card.label}</div>
              <div className={styles.cardValue}>{card.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Spreadsheet Card */}
      <div className={styles.spreadsheetCard}>
        <div className={styles.spreadsheetTopBar}>
          <div className={styles.excelTabBadge}>
            <FileSpreadsheet size={14} />
            <span>Employee Wise PF Sheet (14 Columns)</span>
          </div>
          <div style={{ fontSize: '12px', color: '#64748b' }}>
            Showing {filteredRecords.length} of {records.length} employees
          </div>
        </div>

        <div className={styles.spreadsheetWrap}>
          {/* Header Metadata Block */}
          <div className={styles.reportHeaderBlock}>
            <div className={styles.companyTitle}>{companyName}</div>
            <div className={styles.reportSubtitle}>EMPLOYEE WISE MONTHLY PF REPORT</div>
            <div className={styles.monthMeta}>FOR THE MONTH OF : {forMonthString}</div>
            <div className={styles.locationMeta}>Location: {locationName}</div>
          </div>

          {/* Table */}
          <table className={styles.excelTable}>
            <thead>
              <tr className={styles.headerRow}>
                <th style={{ width: '40px' }}>Sr#</th>
                <th style={{ width: '65px' }}>Code</th>
                <th style={{ width: '120px' }}>UAN</th>
                <th style={{ width: '180px', textAlign: 'left' }}>Employee Name</th>
                <th style={{ width: '50px' }}>Days</th>
                <th style={{ width: '85px', textAlign: 'right' }}>PF Wages</th>
                <th style={{ width: '70px', textAlign: 'right' }}>PF</th>
                <th style={{ width: '65px', textAlign: 'right' }}>EPF</th>
                <th style={{ width: '65px', textAlign: 'right' }}>EPS</th>
                <th style={{ width: '70px', textAlign: 'right' }}>Total</th>
                <th style={{ width: '90px', textAlign: 'right' }}>A/C-21 :</th>
                <th style={{ width: '85px', textAlign: 'right' }}>A/C-2:</th>
                <th style={{ width: '85px', textAlign: 'right' }}>A/C-22</th>
                <th style={{ width: '85px', textAlign: 'right' }}>G.Total</th>
              </tr>
              <tr className={styles.subRateRow}>
                <th></th>
                <th></th>
                <th></th>
                <th></th>
                <th></th>
                <th></th>
                <th className={styles.textRight}>12%</th>
                <th className={styles.textRight}>3.67%</th>
                <th className={styles.textRight}>8.33%</th>
                <th></th>
                <th className={styles.textRight}>(0.5%) :</th>
                <th className={styles.textRight}>(0.5%) :</th>
                <th className={styles.textRight}>(0.0%) :</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.map((row, idx) => (
                <tr key={idx}>
                  <td className={styles.textCenter}>{row.srNo || idx + 1}</td>
                  <td className={styles.textCenter} style={{ fontWeight: 600 }}>{row.code}</td>
                  <td className={`${styles.uanCell} ${styles.textCenter}`}>{row.uan}</td>
                  <td className={styles.textLeft} style={{ fontWeight: 600 }}>{row.employeeName}</td>
                  <td className={styles.textCenter}>{row.days}</td>
                  <td className={styles.textRight}>{Number(row.pfWages || 0).toLocaleString('en-IN')}</td>
                  <td className={styles.textRight}>{Number(row.pf12 || 0).toLocaleString('en-IN')}</td>
                  <td className={styles.textRight}>{Number(row.epf3_67 || 0).toLocaleString('en-IN')}</td>
                  <td className={styles.textRight}>{Number(row.eps8_33 || 0).toLocaleString('en-IN')}</td>
                  <td className={styles.textRight} style={{ fontWeight: 600 }}>{Number(row.totalEmployer || 0).toLocaleString('en-IN')}</td>
                  <td className={styles.textRight}>{Number(row.ac21 || 0).toLocaleString('en-IN')}</td>
                  <td className={styles.textRight}>{Number(row.ac2 || 0).toLocaleString('en-IN')}</td>
                  <td className={styles.textRight}>{Number(row.ac22 || 0)}</td>
                  <td className={styles.textRight} style={{ fontWeight: 700 }}>{Number(row.gTotal || 0).toLocaleString('en-IN')}</td>
                </tr>
              ))}

              {/* Total Row */}
              {records.length > 0 && (
                <tr className={styles.totalRow}>
                  <td colSpan={4} style={{ textAlign: 'right', fontWeight: 700 }}>
                    Total :
                  </td>
                  <td className={styles.textCenter} style={{ fontWeight: 700 }}>
                    {records.length}
                  </td>
                  <td className={styles.textRight}>
                    {Number(totals.totalPfWages || 0).toLocaleString('en-IN')}
                  </td>
                  <td className={styles.textRight}>
                    {Number(totals.totalPf12 || 0).toLocaleString('en-IN')}
                  </td>
                  <td className={styles.textRight}>
                    {Number(totals.totalEpf3_67 || 0).toLocaleString('en-IN')}
                  </td>
                  <td className={styles.textRight}>
                    {Number(totals.totalEps8_33 || 0).toLocaleString('en-IN')}
                  </td>
                  <td className={styles.textRight}>
                    {Number(totals.totalEmployer || 0).toLocaleString('en-IN')}
                  </td>
                  <td className={styles.textRight}>
                    {Number(totals.totalAc21 || 0).toLocaleString('en-IN')}
                  </td>
                  <td className={styles.textRight}>
                    {Number(totals.totalAc2 || 0).toLocaleString('en-IN')}
                  </td>
                  <td className={styles.textRight}>0</td>
                  <td className={styles.textRight}>
                    {Number(totals.grandTotal || 0).toLocaleString('en-IN')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Bottom Account Reconciliation Box */}
          <div className={styles.reconciliationWrapper}>
            <table className={styles.reconTable}>
              <tbody>
                <tr>
                  <td className={styles.reconLabel}>A/C-1 (12 %+3.67 %) :</td>
                  <td className={styles.reconValue}>{Number(acSummary.ac1 || 0).toLocaleString('en-IN')}</td>
                </tr>
                <tr>
                  <td className={styles.reconLabel}>A/C-10 (8.33 %) :</td>
                  <td className={styles.reconValue}>{Number(acSummary.ac10 || 0).toLocaleString('en-IN')}</td>
                </tr>
                <tr>
                  <td className={styles.reconLabel}>A/C-21 (0.5 %) :</td>
                  <td className={styles.reconValue}>{Number(acSummary.ac21 || 0).toLocaleString('en-IN')}</td>
                </tr>
                <tr>
                  <td className={styles.reconLabel}>A/C-2 (0.5 %) :</td>
                  <td className={styles.reconValue}>{Number(acSummary.ac2 || 0).toLocaleString('en-IN')}</td>
                </tr>
                <tr>
                  <td className={styles.reconLabel}>A/C-22 (0 %) :</td>
                  <td className={styles.reconValue}>0</td>
                </tr>
                <tr>
                  <td colSpan={2} style={{ padding: '4px 0' }}>
                    <div className={styles.reconDivider}></div>
                  </td>
                </tr>
                <tr>
                  <td className={styles.reconLabel} style={{ fontWeight: 700 }}>Total :</td>
                  <td className={styles.reconValue} style={{ fontWeight: 700 }}>{Number(acSummary.total || 0).toLocaleString('en-IN')}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
