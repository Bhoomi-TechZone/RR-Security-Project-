import React, { useState, useMemo } from 'react';
import {
  FileSpreadsheet,
  Download,
  Search,
  ShieldCheck,
  Calendar,
  Building2
} from 'lucide-react';
import { downloadPfLocationWiseExcel } from '../../utils/pfLocationWiseExport';
import styles from './PfLocationWiseReportView.module.css';

/**
 * Statutory Location-Wise Monthly PF Summary Report View
 * Excel ONLY format per explicit user instruction.
 * 14 Columns matching reference screenshot:
 * SrNo | Location Name | Month | TotEmp | Atten. | PF Wages | A/C 1 (12 / 3.67) | A/C 10 (8.33) | A/C 21 (0.5) | A/C 2 (0.5) | A/C 22 (0) | Total Amt | Year
 */
export default function PfLocationWiseReportView({
  reportData = {},
  filters = {}
}) {
  const locations = reportData.locations || [];
  const grandTotal = reportData.grandTotal || {};
  const companyName = reportData.companyName || 'RR SECURITY & FACILITIES';
  const headerSubtitle = reportData.headerSubtitle || 'PF Summary Report Form month: SEPTEMBER,2026 To SEPTEMBER,2026';
  const monthName = reportData.monthName || 'SEPTEMBER';
  const year = reportData.year || 2026;
  const summaryCards = reportData.summaryCards || [];

  const [searchQuery, setSearchQuery] = useState('');

  const filteredLocations = useMemo(() => {
    if (!searchQuery.trim()) return locations;
    const q = searchQuery.toLowerCase().trim();
    return locations.filter(
      (l) =>
        String(l.locationName || '').toLowerCase().includes(q) ||
        String(l.month || '').toLowerCase().includes(q) ||
        String(l.year || '').toLowerCase().includes(q)
    );
  }, [locations, searchQuery]);

  const handleDownloadExcel = () => {
    downloadPfLocationWiseExcel({
      ...reportData,
      locations: filteredLocations.length > 0 ? filteredLocations : locations,
    });
  };

  return (
    <div className={styles.container}>
      {/* Top Action Toolbar (Excel ONLY per user requirement) */}
      <div className={styles.toolbar}>
        <div className={styles.toolbarLeft}>
          <span className={styles.badge}>
            <ShieldCheck size={16} />
            <span>EPFO PF Location Wise Summary Report</span>
          </span>

          <span className={`${styles.badge} ${styles.badgeSuccess}`}>
            <Calendar size={15} />
            <span>{monthName}, {year}</span>
          </span>

          <span className={`${styles.badge} ${styles.badgeInfo}`}>
            <Building2 size={15} />
            <span>{locations.length} Locations</span>
          </span>
        </div>

        <div className={styles.toolbarRight}>
          <div className={styles.searchInputWrapper}>
            <Search size={14} className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search Location Name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
              aria-label="Search PF Locations"
            />
          </div>

          <button
            type="button"
            className={styles.excelBtn}
            onClick={handleDownloadExcel}
            title="Download Official Location Wise PF Excel (.xlsx)"
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
            <span>Location Wise Summary Sheet (14 Columns)</span>
          </div>
          <div style={{ fontSize: '12px', color: '#64748b' }}>
            Showing {filteredLocations.length} of {locations.length} location entries
          </div>
        </div>

        <div className={styles.spreadsheetWrap}>
          {/* Centered Top Banner (matching screenshot) */}
          <div className={styles.bannerHeader}>
            <div className={styles.companyTitle}>{companyName}</div>
            <div className={styles.reportSubtitle}>{headerSubtitle}</div>
          </div>

          {/* Table */}
          <table className={styles.excelTable}>
            <thead>
              <tr>
                <th rowSpan={2} style={{ width: '45px' }}>SrNo</th>
                <th rowSpan={2} style={{ width: '220px', textAlign: 'left' }}>Location Name</th>
                <th rowSpan={2} style={{ width: '95px' }}>Month</th>
                <th rowSpan={2} style={{ width: '65px' }}>TotEmp</th>
                <th rowSpan={2} style={{ width: '65px' }}>Atten.</th>
                <th rowSpan={2} style={{ width: '95px', textAlign: 'right' }}>PF Wages</th>
                <th colSpan={2} style={{ width: '130px' }}>A/C 1</th>
                <th style={{ width: '75px' }}>A/C 10</th>
                <th style={{ width: '70px' }}>A/C 21</th>
                <th style={{ width: '70px' }}>A/C 2</th>
                <th style={{ width: '65px' }}>A/C 22</th>
                <th rowSpan={2} style={{ width: '95px', textAlign: 'right' }}>Total Amt</th>
                <th rowSpan={2} style={{ width: '65px' }}>Year</th>
              </tr>
              <tr className={styles.subRateRow}>
                <th style={{ width: '65px' }}>12</th>
                <th style={{ width: '65px' }}>3.67</th>
                <th>8.33</th>
                <th>0.5</th>
                <th>0.5</th>
                <th>0</th>
              </tr>
            </thead>
            <tbody>
              {filteredLocations.map((loc, idx) => (
                <tr key={idx}>
                  <td className={styles.textCenter}>{loc.srNo || idx + 1}</td>
                  <td className={styles.textLeft} style={{ fontWeight: 600 }}>{loc.locationName}</td>
                  <td className={styles.textCenter}>{loc.month}</td>
                  <td className={styles.textCenter} style={{ fontWeight: 600 }}>{loc.totEmp}</td>
                  <td className={styles.textCenter}>{loc.atten}</td>
                  <td className={styles.textRight}>{Number(loc.pfWages || 0).toLocaleString('en-IN')}</td>
                  <td className={styles.textRight}>{Number(loc.ac1_12 || 0).toLocaleString('en-IN')}</td>
                  <td className={styles.textRight}>{Number(loc.epf_3_67 || 0).toLocaleString('en-IN')}</td>
                  <td className={styles.textRight}>{Number(loc.ac10_8_33 || 0).toLocaleString('en-IN')}</td>
                  <td className={styles.textRight}>{Number(loc.ac21_0_5 || 0).toLocaleString('en-IN')}</td>
                  <td className={styles.textRight}>{Number(loc.ac2_0_5 || 0).toLocaleString('en-IN')}</td>
                  <td className={styles.textRight}>{Number(loc.ac22_0 || 0)}</td>
                  <td className={styles.textRight} style={{ fontWeight: 700 }}>{Number(loc.totalAmt || 0).toLocaleString('en-IN')}</td>
                  <td className={styles.textCenter}>{loc.year}</td>
                </tr>
              ))}

              {/* Grand Total Row */}
              {locations.length > 0 && (
                <tr className={styles.grandTotalRow}>
                  <td className={styles.textCenter}></td>
                  <td className={styles.textLeft} style={{ fontWeight: 700 }}>
                    Grand Total
                  </td>
                  <td className={styles.textCenter}></td>
                  <td className={styles.textCenter} style={{ fontWeight: 700 }}>
                    {grandTotal.totEmp}
                  </td>
                  <td className={styles.textCenter} style={{ fontWeight: 700 }}>
                    {grandTotal.atten}
                  </td>
                  <td className={styles.textRight} style={{ fontWeight: 700 }}>
                    {Number(grandTotal.pfWages || 0).toLocaleString('en-IN')}
                  </td>
                  <td className={styles.textRight} style={{ fontWeight: 700 }}>
                    {Number(grandTotal.ac1_12 || 0).toLocaleString('en-IN')}
                  </td>
                  <td className={styles.textRight} style={{ fontWeight: 700 }}>
                    {Number(grandTotal.epf_3_67 || 0).toLocaleString('en-IN')}
                  </td>
                  <td className={styles.textRight} style={{ fontWeight: 700 }}>
                    {Number(grandTotal.ac10_8_33 || 0).toLocaleString('en-IN')}
                  </td>
                  <td className={styles.textRight} style={{ fontWeight: 700 }}>
                    {Number(grandTotal.ac21_0_5 || 0).toLocaleString('en-IN')}
                  </td>
                  <td className={styles.textRight} style={{ fontWeight: 700 }}>
                    {Number(grandTotal.ac2_0_5 || 0).toLocaleString('en-IN')}
                  </td>
                  <td className={styles.textRight} style={{ fontWeight: 700 }}>0</td>
                  <td className={styles.textRight} style={{ fontWeight: 700 }}>
                    {Number(grandTotal.totalAmt || 0).toLocaleString('en-IN')}
                  </td>
                  <td className={styles.textCenter}></td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
