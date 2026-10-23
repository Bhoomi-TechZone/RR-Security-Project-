import React, { useState, useMemo } from 'react';
import {
  FileSpreadsheet,
  Download,
  Search,
  ShieldCheck,
  Calendar,
  Users
} from 'lucide-react';
import { downloadPfEcrExcel } from '../../utils/pfEcrExport';
import styles from './PfEcrReportView.module.css';

/**
 * Statutory EPFO PF ECR (Electronic Challan cum Return) View
 * Excel ONLY format per explicit user instruction.
 * 11 Standard Columns:
 * UAN | MEMBAR_NAME | GROSS_WAGES | EPF_WAGES | EPS_WAGES | EDLI_WAGES | EPF_CONTRI_REMITTED | EPS_CONTRI_REMITTED | EPF_EPS_DIFF_REMITTED | NCP_DAYS | REFUND_OF_ADVANCES
 */
export default function PfEcrReportView({
  reportData = {},
  filters = {}
}) {
  const records = reportData.records || [];
  const monthLabel = reportData.monthLabel || 'Current Month';
  const totals = reportData.totals || {};
  const summaryCards = reportData.summaryCards || [];

  const [searchQuery, setSearchQuery] = useState('');

  const filteredRecords = useMemo(() => {
    if (!searchQuery.trim()) return records;
    const q = searchQuery.toLowerCase().trim();
    return records.filter(
      (r) =>
        String(r.uan || '').toLowerCase().includes(q) ||
        String(r.memberName || '').toLowerCase().includes(q) ||
        String(r.employeeId || '').toLowerCase().includes(q)
    );
  }, [records, searchQuery]);

  const handleDownloadExcel = () => {
    downloadPfEcrExcel({
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
            <span>EPFO Statutory PF ECR</span>
          </span>

          <span className={`${styles.badge} ${styles.badgeSuccess}`}>
            <Calendar size={15} />
            <span>{monthLabel}</span>
          </span>

          <span className={`${styles.badge} ${styles.badgeInfo}`}>
            <Users size={15} />
            <span>{records.length} Members</span>
          </span>
        </div>

        <div className={styles.toolbarRight}>
          <div className={styles.searchInputWrapper}>
            <Search size={14} className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search UAN, Member Name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
              aria-label="Search ECR Records"
            />
          </div>

          <button
            type="button"
            className={styles.excelBtn}
            onClick={handleDownloadExcel}
            title="Download Official PF ECR Excel (.xlsx)"
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
            <span>ECR Sheet (11 Columns)</span>
          </div>
          <div style={{ fontSize: '12px', color: '#64748b' }}>
            Showing {filteredRecords.length} of {records.length} member records
          </div>
        </div>

        <div className={styles.spreadsheetWrap}>
          <table className={styles.excelTable}>
            <thead>
              {/* Excel Column Letters (A through K) */}
              <tr className={styles.letterRow}>
                <th className={styles.rowNumberCol}>#</th>
                <th>A</th>
                <th>B</th>
                <th>C</th>
                <th>D</th>
                <th>E</th>
                <th>F</th>
                <th>G</th>
                <th>H</th>
                <th>I</th>
                <th>J</th>
                <th>K</th>
              </tr>

              {/* Row 1 Headers (Exact column names from reference image) */}
              <tr className={styles.headerRow}>
                <th className={styles.rowNumberCol}>1</th>
                <th>UAN</th>
                <th>MEMBAR_NAME</th>
                <th className={styles.headerRight}>GROSS_WAGES</th>
                <th className={styles.headerRight}>EPF_WAGES</th>
                <th className={styles.headerRight}>EPS_WAGES</th>
                <th className={styles.headerRight}>EDLI_WAGES</th>
                <th className={styles.headerRight}>EPF_CONTRI_REMITTED</th>
                <th className={styles.headerRight}>EPS_CONTRI_REMITTED</th>
                <th className={styles.headerRight}>EPF_EPS_DIFF_REMITTED</th>
                <th className={styles.headerCenter}>NCP_DAYS</th>
                <th className={styles.headerCenter}>REFUND_OF_ADVANCES</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.map((row, idx) => (
                <tr key={idx}>
                  <td className={styles.rowNumberCol}>{idx + 2}</td>
                  <td className={styles.uanCell}>{row.uan}</td>
                  <td className={styles.nameCell}>{row.memberName}</td>
                  <td className={styles.numCell}>{Number(row.grossWages || 0).toLocaleString('en-IN')}</td>
                  <td className={styles.numCell}>{Number(row.epfWages || 0).toLocaleString('en-IN')}</td>
                  <td className={styles.numCell}>{Number(row.epsWages || 0).toLocaleString('en-IN')}</td>
                  <td className={styles.numCell}>{Number(row.edliWages || 0).toLocaleString('en-IN')}</td>
                  <td className={styles.numCell}>{Number(row.epfContriRemitted || 0).toLocaleString('en-IN')}</td>
                  <td className={styles.numCell}>{Number(row.epsContriRemitted || 0).toLocaleString('en-IN')}</td>
                  <td className={styles.numCell}>{Number(row.epfEpsDiffRemitted || 0).toLocaleString('en-IN')}</td>
                  <td className={styles.centerCell}>{row.ncpDays ?? 0}</td>
                  <td className={styles.centerCell}>{row.refundOfAdvances ?? 0}</td>
                </tr>
              ))}

              {/* Total Row */}
              {records.length > 0 && (
                <tr className={styles.totalRow}>
                  <td className={styles.rowNumberCol}>Σ</td>
                  <td colSpan={2} style={{ textAlign: 'left', fontWeight: 700 }}>
                    TOTAL ({filteredRecords.length} Members)
                  </td>
                  <td className={styles.numCell}>
                    {Number(totals.totalGrossWages || 0).toLocaleString('en-IN')}
                  </td>
                  <td className={styles.numCell}>
                    {Number(totals.totalEpfWages || 0).toLocaleString('en-IN')}
                  </td>
                  <td className={styles.numCell}>
                    {Number(totals.totalEpsWages || 0).toLocaleString('en-IN')}
                  </td>
                  <td className={styles.numCell}>
                    {Number(totals.totalEdliWages || 0).toLocaleString('en-IN')}
                  </td>
                  <td className={styles.numCell}>
                    {Number(totals.totalEpfContri || 0).toLocaleString('en-IN')}
                  </td>
                  <td className={styles.numCell}>
                    {Number(totals.totalEpsContri || 0).toLocaleString('en-IN')}
                  </td>
                  <td className={styles.numCell}>
                    {Number(totals.totalDiff || 0).toLocaleString('en-IN')}
                  </td>
                  <td className={styles.centerCell}>{totals.totalNcpDays || 0}</td>
                  <td className={styles.centerCell}>0</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
