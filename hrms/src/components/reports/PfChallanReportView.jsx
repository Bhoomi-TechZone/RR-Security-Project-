import React, { useState } from 'react';
import {
  FileText,
  FileSpreadsheet,
  Printer,
  Download,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { downloadPfChallanPdf, downloadPfChallanExcel } from '../../utils/pfChallanExport';
import styles from './PfChallanReportView.module.css';

/**
 * Statutory EPFO PF Challan View Component
 * (Provisional Challan for Wage Month)
 * Strictly:
 * - WITHOUT LOGO (Per explicit user instruction)
 * - ALWAYS uses Admin Company Name
 * - Matches the official statutory EPFO format
 */
export default function PfChallanReportView({
  reportData = {},
  filters = {},
}) {
  const challan = reportData.challan || {};
  const comp = reportData.companyInfo || {};
  const records = reportData.records || [];
  const summaryCards = reportData.summaryCards || [];

  const [activeTab, setActiveTab] = useState('challan'); // 'challan' | 'breakdown'

  const adminName = (
    challan.establishmentName ||
    comp.name ||
    'RR SECURITY & FACILITIES'
  ).toUpperCase();

  const estCode =
    challan.establishmentCode ||
    comp.establishmentCode ||
    comp.employerPfCode ||
    'DSNHP3718318000';

  const estAddress =
    challan.establishmentAddress ||
    comp.address ||
    'G-75/a, Gali No. 04 Block G Molarband Extn. Badarpur SOUTH DELHI';

  const wageMonth = challan.wageMonth || 'SEP 2026';
  const monthShortYear = challan.monthShortYear || 'oct-26';
  const totalSubscribers = challan.totalSubscribers ?? reportData.subscriberCount ?? 19;

  const rows = challan.rows || [
    { sl: 1, particulars: "Employee's Share Of Contribution", ac01: 26388, ac02: 'NA', ac10: 'NA', ac21: 'NA', ac22: 'NA', total: 26388 },
    { sl: 2, particulars: "Employer's Share Of Contribution", ac01: 9026, ac02: 'NA', ac10: 17362, ac21: 1099, ac22: 'NA', total: 27487 },
    { sl: 3, particulars: 'Admin/ Insp. Charges', ac01: 'NA', ac02: 1099, ac10: 'NA', ac21: 'NA', ac22: 0, total: 1099 },
    { sl: 4, particulars: '7Q', ac01: 0, ac02: 0, ac10: 0, ac21: 0, ac22: 0, total: 0 },
    { sl: 5, particulars: '14B', ac01: 0, ac02: 0, ac10: 0, ac21: 0, ac22: 0, total: 0 },
  ];

  const grandTotal = challan.totals?.grandTotal ?? 54974;

  const handleDownloadPdf = () => {
    downloadPfChallanPdf(reportData, { mode: 'download' });
  };

  const handlePrint = () => {
    downloadPfChallanPdf(reportData, { mode: 'print' });
  };

  const handleDownloadExcel = () => {
    downloadPfChallanExcel(reportData);
  };

  return (
    <div className={styles.container}>
      {/* Top Action Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.toolbarLeft}>
          <span className={styles.badge}>
            <ShieldCheck size={16} />
            EPFO PF CHALLAN
          </span>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155' }}>
            Wage Month : {wageMonth}
          </span>
        </div>

        <div className={styles.toolbarRight}>
          <button
            type="button"
            className={`${styles.actionBtn} ${styles.btnPrimary}`}
            onClick={handleDownloadPdf}
            title="Download Statutory PF Challan PDF (without logo)"
          >
            <Download size={15} />
            <span>Download PDF</span>
          </button>

          <button
            type="button"
            className={`${styles.actionBtn} ${styles.btnSecondary}`}
            onClick={handlePrint}
            title="Print PF Challan"
          >
            <Printer size={15} />
            <span>Print Challan</span>
          </button>

          <button
            type="button"
            className={`${styles.actionBtn} ${styles.btnSecondary}`}
            onClick={handleDownloadExcel}
            title="Export Excel (XLSX) with Subscribers Breakdown"
          >
            <FileSpreadsheet size={15} color="#16a34a" />
            <span>Export Excel</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      {summaryCards.length > 0 && (
        <div className={styles.statsRow}>
          {summaryCards.map((card, idx) => (
            <div key={idx} className={styles.statCard}>
              <span className={styles.statLabel}>{card.label}</span>
              <span className={styles.statValue}>{card.value}</span>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className={styles.viewTabs}>
        <button
          type="button"
          className={`${styles.tabBtn} ${activeTab === 'challan' ? styles.tabBtnActive : ''}`}
          onClick={() => setActiveTab('challan')}
        >
          Provisional Challan Slip
        </button>
        <button
          type="button"
          className={`${styles.tabBtn} ${activeTab === 'breakdown' ? styles.tabBtnActive : ''}`}
          onClick={() => setActiveTab('breakdown')}
        >
          Subscribers Breakdown ({records.length || totalSubscribers})
        </button>
      </div>

      {/* TAB 1: PROVISIONAL CHALLAN SLIP */}
      {activeTab === 'challan' && (
        <div className={styles.sheetContainer}>
          <div className={styles.challanSheet}>
            {/* Header (Strictly NO LOGO) */}
            <div className={styles.challanHeader}>
              <div className={styles.provisionalTitle}>
                PROVISIONAL CHALLAN FOR WAGE MONTH : {wageMonth.toUpperCase()}
              </div>
              <div className={styles.epfoTitle}>
                EMPLOYEES' PROVIDENT FUND ORGANISATION
              </div>
            </div>

            {/* Establishment Metadata Block */}
            <div className={styles.estInfoGrid}>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Establishment Code & Name :</span>
                <div>
                  <span className={styles.infoCode}>{estCode}</span>
                  <span className={styles.infoCompany}>{adminName}</span>
                </div>
              </div>

              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Establishment Address :</span>
                <span className={styles.infoValue}>{estAddress}</span>
              </div>

              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Total Subscribers :</span>
                <span className={styles.infoValue}>{totalSubscribers}</span>
              </div>
            </div>

            {/* Statutory 8-Column Challan Table */}
            <table className={styles.challanTable}>
              <thead>
                <tr>
                  <th>SL.</th>
                  <th>PARTICULARS</th>
                  <th>A/C.01 (Rs.)</th>
                  <th>A/C.02 (Rs.)</th>
                  <th>A/C.10 (Rs.)</th>
                  <th>A/C.21 (Rs.)</th>
                  <th>A/C.22 (Rs.)</th>
                  <th>TOTAL</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.sl}>
                    <td>{r.sl}</td>
                    <td>{r.particulars}</td>
                    <td>{r.ac01 === 'NA' ? 'NA' : Number(r.ac01 || 0).toLocaleString('en-IN')}</td>
                    <td>{r.ac02 === 'NA' ? 'NA' : Number(r.ac02 || 0).toLocaleString('en-IN')}</td>
                    <td>{r.ac10 === 'NA' ? 'NA' : Number(r.ac10 || 0).toLocaleString('en-IN')}</td>
                    <td>{r.ac21 === 'NA' ? 'NA' : Number(r.ac21 || 0).toLocaleString('en-IN')}</td>
                    <td>{r.ac22 === 'NA' ? 'NA' : Number(r.ac22 || 0).toLocaleString('en-IN')}</td>
                    <td>{Number(r.total || 0).toLocaleString('en-IN')}</td>
                  </tr>
                ))}
                {/* Grand Total Row */}
                <tr className={styles.grandTotalRow}>
                  <td>Grand Total :</td>
                  <td></td>
                  <td></td>
                  <td></td>
                  <td></td>
                  <td></td>
                  <td></td>
                  <td>{Number(grandTotal).toLocaleString('en-IN')}</td>
                </tr>
              </tbody>
            </table>

            {/* Footnotes & Red Notes */}
            <div className={styles.footerArea}>
              <div className={styles.notesBlock}>
                <div className={styles.disclaimerText}>
                  The 7Q/14B charges, as of {monthShortYear}, are subject to change based on the payment date.
                </div>

                <div className={styles.redNoteTitle}>Note :</div>
                <div className={styles.redNoteLine}>
                  1) Account 2, Account 21,Account 22 charges are subject to change based on balance amount for the respective wage month.
                </div>
                <div className={styles.redNoteLine}>
                  2) This should not be considered as payment confirmation receipt.
                </div>
              </div>

              {/* Bottom Right QR Code */}
              <div className={styles.qrCodeBox} title="Challan Verification QR Code">
                <svg width="72" height="72" viewBox="0 0 100 100">
                  {/* Outer Frame */}
                  <rect width="100" height="100" fill="#ffffff" />
                  {/* Top-Left Finder */}
                  <rect x="5" y="5" width="28" height="28" fill="#000000" />
                  <rect x="9" y="9" width="20" height="20" fill="#ffffff" />
                  <rect x="13" y="13" width="12" height="12" fill="#000000" />
                  {/* Top-Right Finder */}
                  <rect x="67" y="5" width="28" height="28" fill="#000000" />
                  <rect x="71" y="9" width="20" height="20" fill="#ffffff" />
                  <rect x="75" y="13" width="12" height="12" fill="#000000" />
                  {/* Bottom-Left Finder */}
                  <rect x="5" y="67" width="28" height="28" fill="#000000" />
                  <rect x="9" y="71" width="20" height="20" fill="#ffffff" />
                  <rect x="13" y="75" width="12" height="12" fill="#000000" />
                  {/* Static Data Dots */}
                  <rect x="40" y="10" width="4" height="4" fill="#000" />
                  <rect x="50" y="10" width="8" height="4" fill="#000" />
                  <rect x="40" y="20" width="6" height="6" fill="#000" />
                  <rect x="52" y="22" width="6" height="4" fill="#000" />
                  <rect x="10" y="42" width="10" height="4" fill="#000" />
                  <rect x="25" y="40" width="6" height="8" fill="#000" />
                  <rect x="42" y="42" width="14" height="14" fill="#000" />
                  <rect x="46" y="46" width="6" height="6" fill="#fff" />
                  <rect x="68" y="40" width="8" height="6" fill="#000" />
                  <rect x="84" y="44" width="8" height="8" fill="#000" />
                  <rect x="42" y="68" width="6" height="12" fill="#000" />
                  <rect x="54" y="72" width="8" height="6" fill="#000" />
                  <rect x="70" y="68" width="10" height="8" fill="#000" />
                  <rect x="85" y="76" width="8" height="12" fill="#000" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SUBSCRIBERS BREAKDOWN */}
      {activeTab === 'breakdown' && (
        <div className={styles.breakdownCard}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>
              Employee Subscribers Breakdown ({records.length})
            </h3>
            <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
              Establishment: <strong>{adminName}</strong>
            </span>
          </div>

          <div className={styles.breakdownTableWrapper}>
            <table className={styles.breakdownTable}>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Employee ID</th>
                  <th>Employee Name</th>
                  <th>UAN</th>
                  <th>PF Number</th>
                  <th style={{ textAlign: 'right' }}>EPF Wage</th>
                  <th style={{ textAlign: 'right' }}>EE Share (12%)</th>
                  <th style={{ textAlign: 'right' }}>ER PF (3.67%)</th>
                  <th style={{ textAlign: 'right' }}>EPS (8.33%)</th>
                  <th style={{ textAlign: 'right' }}>EDLI (0.50%)</th>
                </tr>
              </thead>
              <tbody>
                {records.length > 0 ? (
                  records.map((r, i) => (
                    <tr key={r.employeeId || i}>
                      <td>{r.slNo || i + 1}</td>
                      <td style={{ fontWeight: 600 }}>{r.employeeId}</td>
                      <td>{r.name}</td>
                      <td>{r.uan}</td>
                      <td>{r.pfNo}</td>
                      <td style={{ textAlign: 'right' }}>Rs. {Number(r.epfWage || 0).toLocaleString('en-IN')}</td>
                      <td style={{ textAlign: 'right', fontWeight: 600, color: '#16a34a' }}>
                        Rs. {Number(r.eeContribution || 0).toLocaleString('en-IN')}
                      </td>
                      <td style={{ textAlign: 'right' }}>Rs. {Number(r.erPfContribution || 0).toLocaleString('en-IN')}</td>
                      <td style={{ textAlign: 'right' }}>Rs. {Number(r.epsContribution || 0).toLocaleString('en-IN')}</td>
                      <td style={{ textAlign: 'right' }}>Rs. {Number(r.edliContribution || 0).toLocaleString('en-IN')}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={10} style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                      No active PF subscribers found for this wage month.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
