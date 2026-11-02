import React, { useState } from 'react';
import {
  FileText,
  Download,
  Printer,
  Calendar,
  Building2,
  Users,
  Search,
  IndianRupee,
  Layers,
} from 'lucide-react';
import { downloadPfSummaryReportPdf } from '../../utils/pfSummaryReportExport';
import styles from './PfSummaryReportView.module.css';

/**
 * =========================================================================
 * STATUTORY PF SUMMARY REPORT (PDF ONLY) VIEW COMPONENT
 * =========================================================================
 */
export default function PfSummaryReportView({
  reportData = {},
  filters = {},
}) {
  const [searchTerm, setSearchTerm] = useState('');

  const safeData = reportData || {};
  const locations = safeData.locations || safeData.records || [];
  const grandTotal = safeData.grandTotal || {};
  const companyInfo = safeData.companyInfo || {};
  const companyName = companyInfo.name || safeData.companyName || '';

  const monthName = (safeData.monthName || 'SEPTEMBER').toUpperCase();
  const year = safeData.year || 2026;
  const headerSubtitle = safeData.headerSubtitle ||
    `PF Summary Report Form month: ${monthName},${year} To ${monthName},${year}`;

  const filteredLocations = locations.filter((loc) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      (loc.locationName && loc.locationName.toLowerCase().includes(term)) ||
      (loc.month && loc.month.toLowerCase().includes(term)) ||
      String(loc.srNo || '').includes(term)
    );
  });

  const handleDownloadPdf = () => {
    downloadPfSummaryReportPdf(safeData, { mode: 'download' });
  };

  const handlePrintPdf = () => {
    downloadPfSummaryReportPdf(safeData, { mode: 'print' });
  };

  const fmt2 = (val) => {
    const num = Number(val || 0);
    return isNaN(num) ? '0.00' : num.toFixed(2);
  };

  const fmtInt = (val) => {
    const num = Number(val || 0);
    return isNaN(num) ? '0' : String(Math.round(num));
  };

  const totalLocations = locations.length;
  const totalEmployees = grandTotal.totEmp || locations.reduce((s, l) => s + (l.totEmp || 0), 0);
  const totalWages = grandTotal.pfWages || locations.reduce((s, l) => s + (l.pfWages || 0), 0);
  const totalContribution = grandTotal.totalAmt || locations.reduce((s, l) => s + (l.totalAmt || 0), 0);

  return (
    <div className={styles.container}>
      {/* 3. Search Bar */}
      <div className={styles.searchSection}>
        <div className={styles.searchBox}>
          <Search size={16} className={styles.searchIcon} />
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search location by name or month..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button
              type="button"
              className={styles.clearSearchBtn}
              onClick={() => setSearchTerm('')}
            >
              ×
            </button>
          )}
        </div>
        <div className={styles.showingText}>
          Showing <strong>{filteredLocations.length}</strong> of {locations.length} locations
        </div>
      </div>

      {/* 4. Document / Printout Preview matching User Screenshot */}
      <div className={styles.paperPreview}>
        <div className={styles.paperHeader}>
          <div className={styles.companyTitle}>{companyName.toUpperCase()}</div>
          <div className={styles.subTitleRow}>
            <span className={styles.subTitleText}>{headerSubtitle}</span>
            <span className={styles.pageNumber}>Page # 1</span>
          </div>
        </div>

        <div className={styles.tableScroll}>
          <table className={styles.statementTable}>
            <thead>
              <tr className={styles.dashedTopRow}>
                <th className={styles.thLeft}>SrNo</th>
                <th className={styles.thLeft}>Location Name</th>
                <th className={styles.thLeft}>Month</th>
                <th className={styles.thCenter}>TotEmp</th>
                <th className={styles.thRight}>Atten.</th>
                <th className={styles.thRight}>PF Wages</th>
                <th className={styles.thRight}>A/C 1</th>
                <th className={styles.thRight}></th>
                <th className={styles.thRight}>A/C 10</th>
                <th className={styles.thRight}>A/C 21</th>
                <th className={styles.thRight}>A/C 2</th>
                <th className={styles.thRight}>A/C 22</th>
                <th className={styles.thRight}>Total Amt</th>
                <th className={styles.thCenter}>Year</th>
              </tr>
              <tr className={styles.dashedBottomRow}>
                <th></th>
                <th></th>
                <th></th>
                <th></th>
                <th></th>
                <th></th>
                <th className={styles.thRight}>12.00</th>
                <th className={styles.thRight}>3.67</th>
                <th className={styles.thRight}>8.33</th>
                <th className={styles.thRight}>0.50</th>
                <th className={styles.thRight}>0.50</th>
                <th className={styles.thRight}>0.00</th>
                <th></th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filteredLocations.length === 0 ? (
                <tr>
                  <td colSpan="14" className={styles.emptyCell}>
                    No location records found matching your filter criteria.
                  </td>
                </tr>
              ) : (
                filteredLocations.map((row, idx) => (
                  <tr key={row.locationName || idx} className={styles.dataRow}>
                    <td className={styles.tdLeft}>{fmtInt(row.srNo || idx + 1)}</td>
                    <td className={styles.tdLeftBold}>{row.locationName}</td>
                    <td className={styles.tdLeft}>{(row.month || monthName).toUpperCase()}</td>
                    <td className={styles.tdCenter}>{fmtInt(row.totEmp)}</td>
                    <td className={styles.tdRight}>{fmt2(row.atten)}</td>
                    <td className={styles.tdRight}>{fmt2(row.pfWages)}</td>
                    <td className={styles.tdRight}>{fmt2(row.ac1_12 || row.ac1)}</td>
                    <td className={styles.tdRight}>{fmt2(row.epf_3_67 || row.ac3_67)}</td>
                    <td className={styles.tdRight}>{fmt2(row.ac10_8_33 || row.ac10)}</td>
                    <td className={styles.tdRight}>{fmt2(row.ac21_0_5 || row.ac21)}</td>
                    <td className={styles.tdRight}>{fmt2(row.ac2_0_5 || row.ac2)}</td>
                    <td className={styles.tdRight}>{fmt2(row.ac22_0 || row.ac22)}</td>
                    <td className={styles.tdRightBold}>{fmt2(row.totalAmt)}</td>
                    <td className={styles.tdCenter}>{row.year || year}</td>
                  </tr>
                ))
              )}
            </tbody>
            <tfoot>
              <tr className={styles.grandTotalRow}>
                <td></td>
                <td className={styles.grandTotalLabel}>Grand Total</td>
                <td></td>
                <td className={styles.tdCenterBold}>{fmtInt(grandTotal.totEmp || totalEmployees)}</td>
                <td className={styles.tdRightBold}>{fmt2(grandTotal.atten)}</td>
                <td className={styles.tdRightBold}>{fmt2(grandTotal.pfWages || totalWages)}</td>
                <td className={styles.tdRightBold}>{fmt2(grandTotal.ac1_12 || grandTotal.ac1)}</td>
                <td className={styles.tdRightBold}>{fmt2(grandTotal.epf_3_67 || grandTotal.ac3_67)}</td>
                <td className={styles.tdRightBold}>{fmt2(grandTotal.ac10_8_33 || grandTotal.ac10)}</td>
                <td className={styles.tdRightBold}>{fmt2(grandTotal.ac21_0_5 || grandTotal.ac21)}</td>
                <td className={styles.tdRightBold}>{fmt2(grandTotal.ac2_0_5 || grandTotal.ac2)}</td>
                <td className={styles.tdRightBold}>{fmt2(grandTotal.ac22_0 || grandTotal.ac22)}</td>
                <td className={styles.tdRightBold} style={{ color: '#dc2626' }}>
                  {fmt2(grandTotal.totalAmt || totalContribution)}
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
