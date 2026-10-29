import React, { useState } from 'react';
import {
  FileText,
  FileSpreadsheet,
  Download,
  ShieldCheck,
  Building2,
  Calendar,
  Users,
  Loader2,
} from 'lucide-react';
import {
  downloadSalarySheetFormat2Pdf,
  downloadSalarySheetFormat2Excel,
  downloadSalarySheetFormat2Csv,
} from '../../utils/salarySheetFormat2Export';
import SalarySheetFormat2Options from './SalarySheetFormat2Options';
import { getDefaultSelectedOptions } from './salarySheetFormat2Config';
import styles from './SalarySheetFormat2View.module.css';

/**
 * Statutory Register of Payment of Wages (Salary Sheet Format 2) View
 * FORM - IV [Payment of Wages Rules, 1971]
 * Matches exact format from user's reference images (Images 2 & 3).
 * Fully dynamic rendering powered by live MongoDB calculations and configurable Report Options.
 */
export default function SalarySheetFormat2View({
  records = [],
  companyInfo = {},
  clientInfo = {},
  establishmentInfo = {},
  period = {},
  totals = {},
  pfSummary = {},
  esiSummary = {},
  lwfSummary = {},
  filters = {},
  selectedOptions: propSelectedOptions,
  onOptionsChange,
  showOptions = false,
}) {
  const [internalSelectedOptions, setInternalSelectedOptions] = useState(() => getDefaultSelectedOptions());
  const selectedOptions = propSelectedOptions || internalSelectedOptions;
  const setSelectedOptions = onOptionsChange || setInternalSelectedOptions;

  const companyName = companyInfo?.name || companyInfo?.companyName || 'RR SECURITY & FACILITIES';
  const companyAddress =
    companyInfo?.address && companyInfo.address !== '—'
      ? companyInfo.address
      : 'G-75/A, GROUND FLOOR, BLOCK-G, M.B. EXTN., BADARPUR, NEW DELHI, 110044';
  // Resolve configured company statutory codes strictly from Company Setup
  let savedSetup = {};
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem('novaspark_company_setup') : null;
    if (raw) savedSetup = JSON.parse(raw);
  } catch (e) {}

  let adminCompanies = [];
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem('novaspark_admin_companies') : null;
    if (raw) adminCompanies = JSON.parse(raw);
  } catch (e) {}
  const localDefaultComp = adminCompanies.find(c => c.isDefault) || adminCompanies[0] || {};

  const cleanPf = [
    companyInfo?.employerPfCode,
    companyInfo?.pfCode,
    companyInfo?.pfNo,
    companyInfo?.epfNo,
    savedSetup?.employerPfCode,
    savedSetup?.pfCode,
    localDefaultComp?.employerPfCode,
    localDefaultComp?.pfCode,
  ].find((v) => v && typeof v === 'string' && !['—', '-', '–', 'null', 'undefined', 'N/A', 'NA', ''].includes(v.trim()));
  const pfNo = cleanPf || '—';

  const cleanEsi = [
    companyInfo?.employerEsiCode,
    companyInfo?.esiCode,
    companyInfo?.esicNo,
    companyInfo?.esiNo,
    savedSetup?.employerEsiCode,
    savedSetup?.esiCode,
    localDefaultComp?.employerEsiCode,
    localDefaultComp?.esiCode,
  ].find((v) => v && typeof v === 'string' && !['—', '-', '–', 'null', 'undefined', 'N/A', 'NA', ''].includes(v.trim()));
  const esiNo = cleanEsi || '—';
  const monthLabel = period?.monthLabel || period?.month || filters?.month || '';

  const clientName =
    clientInfo?.name ||
    clientInfo?.clientName ||
    establishmentInfo?.establishmentName ||
    (filters?.company && filters.company !== 'All Companies' ? filters.company : null) ||
    records[0]?.clientName ||
    records[0]?.site ||
    'All Clients';

  const clientLocation =
    clientInfo?.location ||
    clientInfo?.address ||
    establishmentInfo?.establishmentAddress ||
    records[0]?.clientLocation ||
    records[0]?.siteLocation ||
    records[0]?.site ||
    '';

  const companyInitials = companyName
    ? companyName.split(' ').filter(Boolean).map((w) => w[0]).slice(0, 2).join('').toUpperCase()
    : 'RR';
  const companyLogo = companyInfo?.logo;

  const grandGross = totals?.grandGross ?? records.reduce((s, r) => s + (Number(r.grossSalary) || 0), 0);
  const grandDeductions = totals?.grandDeductions ?? records.reduce((s, r) => s + (Number(r.grossDeduct) || 0), 0);
  const grandNet = totals?.grandNet ?? records.reduce((s, r) => s + (Number(r.netPayableNumber ?? r.netPayable) || 0), 0);

  const [downloadingFormat, setDownloadingFormat] = useState(null);

  // Exporters with dynamic loading spinner
  const handleDownloadPdf = async () => {
    if (downloadingFormat) return;
    try {
      setDownloadingFormat('pdf');
      await new Promise((r) => setTimeout(r, 60));
      await downloadSalarySheetFormat2Pdf(
        records,
        companyInfo,
        period,
        totals,
        pfSummary,
        esiSummary,
        lwfSummary,
        { mode: 'download', clientInfo, filters, options: selectedOptions }
      );
    } catch (err) {
      console.error('PDF export failed:', err);
    } finally {
      setDownloadingFormat(null);
    }
  };

  const handleDownloadExcel = async () => {
    if (downloadingFormat) return;
    try {
      setDownloadingFormat('excel');
      await new Promise((r) => setTimeout(r, 80));
      await downloadSalarySheetFormat2Excel(
        records,
        companyInfo,
        period,
        totals,
        pfSummary,
        esiSummary,
        lwfSummary,
        { format: 'xlsx', clientInfo, filters, options: selectedOptions }
      );
      await new Promise((r) => setTimeout(r, 300));
    } catch (err) {
      console.error('Excel export failed:', err);
    } finally {
      setDownloadingFormat(null);
    }
  };

  const handleDownloadCsv = async () => {
    if (downloadingFormat) return;
    try {
      setDownloadingFormat('csv');
      await new Promise((r) => setTimeout(r, 80));
      await downloadSalarySheetFormat2Csv(
        records,
        companyInfo,
        period,
        totals,
        pfSummary,
        esiSummary,
        lwfSummary,
        { clientInfo, filters, options: selectedOptions }
      );
      await new Promise((r) => setTimeout(r, 300));
    } catch (err) {
      console.error('CSV export failed:', err);
    } finally {
      setDownloadingFormat(null);
    }
  };

  return (
    <div className={styles.container}>
      {/* Top Action Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.toolbarLeft}>
          <span className={styles.badge}>
            <ShieldCheck size={15} />
            FORM - IV [Payment of Wages Rules, 1971] (Salary Sheet Format 2)
          </span>
          <span className={styles.metaText}>
            Period: <strong>{monthLabel}</strong>
          </span>
          <span className={styles.metaText}>
            Client: <strong>{clientName}</strong>
          </span>
          <span className={styles.metaText}>
            Records: <strong>{records.length} Employees</strong>
          </span>
        </div>

        <div className={styles.toolbarRight}>
          <button
            type="button"
            className={`${styles.actionBtn} ${styles.btnPdf}`}
            onClick={handleDownloadPdf}
            disabled={Boolean(downloadingFormat)}
            title="Download Official PDF Report"
          >
            {downloadingFormat === 'pdf' ? (
              <>
                <Loader2 size={14} className={styles.spinner} /> Generating PDF...
              </>
            ) : (
              <>
                <Download size={14} /> PDF
              </>
            )}
          </button>
          <button
            type="button"
            className={`${styles.actionBtn} ${styles.btnExcel}`}
            onClick={handleDownloadExcel}
            disabled={Boolean(downloadingFormat)}
            title="Download Excel Workbook (.xlsx)"
          >
            {downloadingFormat === 'excel' ? (
              <>
                <Loader2 size={14} className={styles.spinner} /> Preparing Excel...
              </>
            ) : (
              <>
                <FileSpreadsheet size={14} /> Excel
              </>
            )}
          </button>
          <button
            type="button"
            className={`${styles.actionBtn} ${styles.btnCsv}`}
            onClick={handleDownloadCsv}
            disabled={Boolean(downloadingFormat)}
            title="Download CSV"
          >
            {downloadingFormat === 'csv' ? (
              <>
                <Loader2 size={14} className={styles.spinner} /> Exporting CSV...
              </>
            ) : (
              <>
                <FileText size={14} /> CSV
              </>
            )}
          </button>
        </div>
      </div>

      {/* Dynamic Report Options UI (Frontend Configurable Options Panel) */}
      {showOptions && (
        <SalarySheetFormat2Options
          selectedOptions={selectedOptions}
          onChange={setSelectedOptions}
          onReset={() => setSelectedOptions(getDefaultSelectedOptions())}
        />
      )}

      {/* Document Paper Layout matching Image 2 */}
      <div className={styles.paper}>
        {/* Outer Top Box matching Image 2 */}
        <div className={styles.topBox}>
          {/* Left Column: Logo & Company Code Info */}
          <div className={styles.companyCol}>
            <div className={styles.logoCircle}>
              {companyLogo ? (
                <img src={companyLogo} alt="Logo" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
              ) : (
                companyInitials
              )}
            </div>
            <div className={styles.companyText}>
              <h1 className={styles.companyName}>{companyName}</h1>
              {companyAddress && companyAddress !== '—' && <p className={styles.companyAddr}>{companyAddress}</p>}
              {pfNo && pfNo !== '—' && <div className={styles.codeText}>PF CODE: {pfNo}</div>}
              {esiNo && esiNo !== '—' && <div className={styles.codeText}>ESI CODE: {esiNo}</div>}
            </div>
          </div>

          {/* Center Column: Register Title & Period */}
          <div className={styles.titleCol}>
            <h2 className={styles.mainTitle}>REGISTER OF PAYMENT OF WAGES</h2>
            <div className={styles.subTitle}>FORM - IV [Payment of Wages Rules, 1971]</div>
            <div className={styles.monthTitle}>Wages For The Month Of: {monthLabel}</div>
          </div>

          {/* Right Column: Client & Location */}
          <div className={styles.clientCol}>
            <div className={styles.clientTitle}>Clint Name: {clientName}</div>
            {clientLocation && clientLocation !== '—' && <div className={styles.clientLoc}>{clientLocation}</div>}
          </div>
        </div>

        {/* Main Multi-Column Table matching Image 2 */}
        <div className={styles.tableWrap}>
          <table className={styles.salaryTable}>
            <thead>
              <tr>
                <th style={{ width: '28px' }}>Sr.<br />No</th>
                <th style={{ minWidth: '220px' }}>
                  <div style={{ fontWeight: 800 }}>Emp. Code / Card No.</div>
                  <div style={{ fontWeight: 800 }}>Employee Name</div>
                  <div className={styles.dualRow} style={{ marginTop: '2px', fontWeight: 'normal', fontSize: '0.66rem' }}>
                    <div>Father/Husband Name</div>
                    <div>Payment Mode</div>
                  </div>
                  <div className={styles.dualRow} style={{ fontWeight: 'normal', fontSize: '0.66rem' }}>
                    <div>Designation</div>
                    <div>Account No.</div>
                  </div>
                  <div className={styles.dualRow} style={{ fontWeight: 'normal', fontSize: '0.66rem' }}>
                    <div>Department</div>
                    <div>DOB</div>
                  </div>
                  <div className={styles.dualRow} style={{ fontWeight: 'normal', fontSize: '0.66rem' }}>
                    <div>ESI No.</div>
                    <div>DOJ</div>
                  </div>
                  <div className={styles.dualRow} style={{ fontWeight: 'normal', fontSize: '0.66rem' }}>
                    <div>UAN</div>
                    <div>Aadhaar No.</div>
                  </div>
                </th>
                <th style={{ minWidth: '130px' }}>
                  <div style={{ fontWeight: 800 }}>ATTENDANCE</div>
                  <div className={styles.attHeaderRow} style={{ marginTop: '2px', fontSize: '0.66rem' }}>
                    <div>Month Day</div>
                    <div></div>
                  </div>
                  <div className={styles.attHeaderRow} style={{ fontSize: '0.66rem' }}>
                    <div>Present</div>
                    <div>EL</div>
                  </div>
                  <div className={styles.attHeaderRow} style={{ fontSize: '0.66rem' }}>
                    <div>W.Off</div>
                    <div>CL</div>
                  </div>
                  <div className={styles.attHeaderRow} style={{ fontSize: '0.66rem' }}>
                    <div>Holiday</div>
                    <div>SL</div>
                  </div>
                  <div className={styles.attHeaderRow} style={{ fontSize: '0.66rem' }}>
                    <div>LWP</div>
                    <div></div>
                  </div>
                  <div className={styles.attHeaderRow} style={{ fontSize: '0.66rem' }}>
                    <div>Payable</div>
                    <div>OT</div>
                  </div>
                </th>
                <th style={{ minWidth: '140px' }}>
                  <div style={{ fontWeight: 800 }}>RATE OF PAY</div>
                  <div className={styles.dualRow} style={{ marginTop: '2px', fontSize: '0.66rem' }}>
                    <div>BASIC</div>
                    <div>SPEC ALLO</div>
                  </div>
                  <div className={styles.dualRow} style={{ fontSize: '0.66rem' }}>
                    <div>D.A.</div>
                    <div>DW</div>
                  </div>
                  <div className={styles.dualRow} style={{ fontSize: '0.66rem' }}>
                    <div>HRA</div>
                    <div>BONUS</div>
                  </div>
                  <div className={styles.dualRow} style={{ fontSize: '0.66rem' }}>
                    <div>CONV ALLO</div>
                    <div>LEAVE</div>
                  </div>
                  <div className={styles.dualRow} style={{ fontSize: '0.66rem' }}>
                    <div>ARREAR</div>
                    <div></div>
                  </div>
                </th>
                <th style={{ minWidth: '150px' }}>
                  <div style={{ fontWeight: 800 }}>E A R N I N G S</div>
                  <div className={styles.dualRow} style={{ marginTop: '2px', fontSize: '0.66rem' }}>
                    <div>BASIC</div>
                    <div>SPEC ALLOW</div>
                  </div>
                  <div className={styles.dualRow} style={{ fontSize: '0.66rem' }}>
                    <div>D.A.</div>
                    <div>DW</div>
                  </div>
                  <div className={styles.dualRow} style={{ fontSize: '0.66rem' }}>
                    <div>HRA</div>
                    <div>BONUS</div>
                  </div>
                  <div className={styles.dualRow} style={{ fontSize: '0.66rem' }}>
                    <div>CONV ALLO</div>
                    <div>LEAVE</div>
                  </div>
                  <div className={styles.dualRow} style={{ fontSize: '0.66rem' }}>
                    <div>ARREAR</div>
                    <div>UNI ALLOW</div>
                  </div>
                  <div className={styles.dualRow} style={{ fontSize: '0.66rem' }}>
                    <div></div>
                    <div>OT AMOUNT</div>
                  </div>
                </th>
                <th style={{ minWidth: '140px' }}>
                  <div style={{ fontWeight: 800 }}>D E D U C T I O N</div>
                  <div className={styles.dualRow} style={{ marginTop: '2px', fontSize: '0.66rem' }}>
                    <div>PF</div>
                    <div>UNI</div>
                  </div>
                  <div className={styles.dualRow} style={{ fontSize: '0.66rem' }}>
                    <div>ESI</div>
                    <div>NIGHT SLP</div>
                  </div>
                  <div className={styles.dualRow} style={{ fontSize: '0.66rem' }}>
                    <div>LWF</div>
                    <div>LOAN</div>
                  </div>
                  <div className={styles.dualRow} style={{ fontSize: '0.66rem' }}>
                    <div>ADVANCE</div>
                    <div>ADVANCE</div>
                  </div>
                  <div className={styles.dualRow} style={{ fontSize: '0.66rem' }}>
                    <div>OTHER DED</div>
                    <div></div>
                  </div>
                </th>
                <th style={{ minWidth: '90px' }}>
                  <div style={{ fontWeight: 800 }}>NET PAYABLE</div>
                  <div style={{ marginTop: '2.5rem', fontWeight: 'normal', fontSize: '0.66rem' }}>
                    Signature
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {records.map((row, idx) => {
                const att = row.attendance || {};
                const rate = row.rateOfWages || {};
                const earn = row.earnings || {};
                const ded = row.deductions || {};

                return (
                  <tr key={row.employeeId ? `${row.employeeId}-${idx}` : `row2-${idx}`}>
                    {/* 1. Sr. No */}
                    <td className={styles.center} style={{ fontWeight: 700 }}>
                      {selectedOptions.srNo !== false ? (row.srNo || idx + 1) : '—'}
                    </td>

                    {/* 2. Employee Details Block */}
                    <td>
                      <div className={styles.empDetailsBlock}>
                        {selectedOptions.employeeId !== false && <div style={{ fontWeight: 700 }}>{row.employeeId}</div>}
                        {selectedOptions.name !== false && <div className={styles.empNameText}>{row.name}</div>}
                        {(selectedOptions.fatherHusbandName !== false || selectedOptions.paymentMode !== false) && (
                          <div className={styles.dualRow}>
                            <div className={styles.dualRowLeft}>{selectedOptions.fatherHusbandName !== false ? (row.fatherHusbandName || '-') : ''}</div>
                            <div className={styles.dualRowRight}>{selectedOptions.paymentMode !== false ? (row.paymentMode || 'Bank') : ''}</div>
                          </div>
                        )}
                        {(selectedOptions.designation !== false || selectedOptions.bankAccountNo !== false) && (
                          <div className={styles.dualRow}>
                            <div className={styles.dualRowLeft}>{selectedOptions.designation !== false ? row.designation : ''}</div>
                            <div className={styles.dualRowRight} style={{ fontFamily: 'monospace' }}>{selectedOptions.bankAccountNo !== false ? (row.bankAccountNo || '-') : ''}</div>
                          </div>
                        )}
                        {(selectedOptions.department !== false || selectedOptions.dob !== false) && (
                          <div className={styles.dualRow}>
                            <div className={styles.dualRowLeft}>{selectedOptions.department !== false ? row.department : ''}</div>
                            <div className={styles.dualRowRight}>{selectedOptions.dob !== false ? (row.dob || '-') : ''}</div>
                          </div>
                        )}
                        {(selectedOptions.esiNo !== false || selectedOptions.doj !== false) && (
                          <div className={styles.dualRow}>
                            <div className={styles.dualRowLeft}>{selectedOptions.esiNo !== false ? (row.esiNo || '-') : ''}</div>
                            <div className={styles.dualRowRight}>{selectedOptions.doj !== false ? (row.doj || '-') : ''}</div>
                          </div>
                        )}
                        {(selectedOptions.uan !== false || selectedOptions.aadhaar !== false) && (
                          <div className={styles.dualRow}>
                            <div className={styles.dualRowLeft}>{selectedOptions.uan !== false ? (row.uan || '-') : ''}</div>
                            <div className={styles.dualRowRight}>{selectedOptions.aadhaar !== false ? (row.aadhaar || '-') : ''}</div>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* 3. ATTENDANCE */}
                    <td>
                      <div className={styles.attendanceBlock}>
                        <div className={styles.attValuesRow}>
                          <div>{selectedOptions.attWd !== false ? (att.wd || '31') : ''}</div>
                          <div></div>
                        </div>
                        <div className={styles.attValuesRow}>
                          <div>{selectedOptions.attPd !== false ? (att.pd || '0') : ''}</div>
                          <div>{selectedOptions.attEl !== false ? (att.el || att.pl || '') : ''}</div>
                        </div>
                        <div className={styles.attValuesRow}>
                          <div>{selectedOptions.attWo !== false ? (att.wo || '') : ''}</div>
                          <div>{selectedOptions.attCl !== false ? (att.cl || '') : ''}</div>
                        </div>
                        <div className={styles.attValuesRow}>
                          <div>{selectedOptions.attPh !== false ? (att.ph || '') : ''}</div>
                          <div>{selectedOptions.attSl !== false ? (att.sl || '') : ''}</div>
                        </div>
                        <div className={styles.attValuesRow}>
                          <div>{selectedOptions.attLwp ? (att.lwp || '') : ''}</div>
                          <div>{selectedOptions.attOt ? (att.ot || '') : ''}</div>
                        </div>
                        <div className={styles.attBottomRow}>
                          <div>{selectedOptions.attTot !== false ? (att.tot || att.pd || '0') : ''}</div>
                          <div></div>
                        </div>
                      </div>
                    </td>

                    {/* 4. RATE OF PAY */}
                    <td>
                      <div className={styles.dualSubGrid}>
                        <div className={styles.subColItem}>
                          <span>{selectedOptions.rateBasic !== false ? (rate.basic || 0) : ''}</span>
                        </div>
                        <div>{selectedOptions.rateSpAll !== false && rate.spAll ? rate.spAll : ''}</div>
                      </div>
                      <div className={styles.subGridTotal}>
                        Total : {selectedOptions.rateTotal !== false ? (rate.total || rate.basic || 0) : '—'}
                      </div>
                    </td>

                    {/* 5. E A R N I N G S */}
                    <td>
                      <div className={styles.dualSubGrid}>
                        <div className={styles.subColItem}>
                          <span>{selectedOptions.earnBasic !== false ? (earn.basic || 0) : ''}</span>
                        </div>
                        <div>{selectedOptions.earnSpAll !== false && earn.spAll ? earn.spAll : ''}</div>
                      </div>
                      <div className={styles.subGridTotal}>
                        Total : {selectedOptions.grossSalary !== false ? (row.grossSalary || earn.basic || 0) : '—'}
                      </div>
                    </td>

                    {/* 6. D E D U C T I O N */}
                    <td>
                      <div className={styles.dualSubGrid}>
                        <div>
                          {selectedOptions.dedPf !== false && ded.pf > 0 && <div>{ded.pf}</div>}
                          {selectedOptions.dedEsi !== false && ded.esi > 0 && <div>{ded.esi}</div>}
                          {selectedOptions.dedLwf !== false && ded.lwf > 0 && <div>{ded.lwf}</div>}
                          {selectedOptions.dedAdvance !== false && ded.advance > 0 && <div>{ded.advance}</div>}
                        </div>
                        <div>
                          {selectedOptions.dedUni !== false && ded.uni > 0 && <div>{ded.uni}</div>}
                          {selectedOptions.dedNightSlp !== false && ded.nightSlp > 0 && <div>{ded.nightSlp}</div>}
                          {selectedOptions.dedLoan !== false && ded.loan > 0 && <div>{ded.loan}</div>}
                          {selectedOptions.dedOtherDed !== false && ded.otherDed > 0 && <div>{ded.otherDed}</div>}
                        </div>
                      </div>
                      <div className={styles.subGridTotal}>
                        Total : {selectedOptions.grossDeduct !== false ? (row.grossDeduct || 0) : '—'}
                      </div>
                    </td>

                    {/* 7. NET PAYABLE */}
                    <td className={styles.center}>
                      <div style={{ fontWeight: 800, fontSize: '0.82rem' }}>
                        {selectedOptions.netPayable !== false ? (row.netPayable || 0).toLocaleString('en-IN') : '—'}
                      </div>
                      {selectedOptions.signature !== false && (
                        <div style={{ fontSize: '0.65rem', color: '#94a3b8', marginTop: '6px' }}>
                          Signature
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}

              {/* Total Row matching Image 2 */}
              {records.length > 0 && (
                <tr className={styles.totalRow}>
                  <td colSpan="2" style={{ fontWeight: 900 }}>
                    Total
                  </td>

                  {/* Attendance Totals */}
                  <td>
                    <div className={styles.attendanceBlock}>
                      <div>{records.length * 31}</div>
                      <div>{totals.totalPd || 0}</div>
                      <div style={{ marginTop: '1.5rem', fontWeight: 900, borderTop: '1px solid #000', paddingTop: '2px' }}>
                        {selectedOptions.attTot !== false ? (totals.totalTot || totals.totalPd || 0) : '—'}
                      </div>
                    </div>
                  </td>

                  {/* Rate Totals */}
                  <td>
                    <div>{totals.totalRateTotal || totals.grandGross || 0}</div>
                    <div style={{ marginTop: '2.5rem', fontWeight: 900, borderTop: '1px solid #000', paddingTop: '2px', textAlign: 'right' }}>
                      Total : {selectedOptions.rateTotal !== false ? (totals.totalRateTotal || totals.grandGross || 0) : '—'}
                    </div>
                  </td>

                  {/* Earnings Totals */}
                  <td>
                    <div>{totals.grandGross || 0}</div>
                    <div style={{ marginTop: '2.5rem', fontWeight: 900, borderTop: '1px solid #000', paddingTop: '2px', textAlign: 'right' }}>
                      Total : {selectedOptions.grossSalary !== false ? (totals.grandGross || 0) : '—'}
                    </div>
                  </td>

                  {/* Deductions Totals */}
                  <td>
                    {totals.grandPf > 0 && <div>{totals.grandPf}</div>}
                    {totals.grandEsi > 0 && <div>{totals.grandEsi}</div>}
                    <div style={{ marginTop: totals.grandPf > 0 ? '1.5rem' : '2.5rem', fontWeight: 900, borderTop: '1px solid #000', paddingTop: '2px', textAlign: 'right' }}>
                      Total : {selectedOptions.grossDeduct !== false ? (totals.grandDeductions || 0) : '—'}
                    </div>
                  </td>

                  {/* Net Payable Total */}
                  <td className={styles.center} style={{ fontSize: '0.88rem' }}>
                    {selectedOptions.netPayable !== false ? (totals.grandNet || 0).toLocaleString('en-IN') : '—'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Bottom Statutory Summary Section matching Image 3 */}
        <div className={styles.bottomSection}>
          {/* Box 1: PF SUMMARY */}
          {selectedOptions.showPfSummary !== false && (
            <div className={styles.summaryBox}>
              <div className={styles.summaryHeader}>PF SUMMARY</div>
              <div className={styles.summaryRow}>
                <span>TOTAL EPF EMPLOYEES</span>
                <span>{pfSummary.strn || 0}</span>
              </div>
              <div className={styles.summaryRow}>
                <span>EPF WAGES</span>
                <span>{pfSummary.pfWages || 0}</span>
              </div>
              <div className={styles.summaryRow}>
                <span>A/C NO. 1(EE_12%)</span>
                <span>{pfSummary.ee || 0}</span>
              </div>
              <div className={styles.summaryRow}>
                <span>A/C NO. 1(ER_3.67%)</span>
                <span>{pfSummary.erDiff || 0}</span>
              </div>
              <div className={styles.summaryRow}>
                <span>A/C NO. 2(0.50%)</span>
                <span>{pfSummary.ac2 || 0}</span>
              </div>
              <div className={styles.summaryRow}>
                <span>A/C NO. 10(8.33%)</span>
                <span>{pfSummary.ac10 || 0}</span>
              </div>
              <div className={styles.summaryRow}>
                <span>A/C NO. 21(0.50%)</span>
                <span>{pfSummary.ac21 || 0}</span>
              </div>
              <div className={styles.summaryRowBold}>
                <span>TOTAL EPF CONTRIBUTIO</span>
                <span>{pfSummary.total || 0}</span>
              </div>
            </div>
          )}

          {/* Box 2: ESI SUMMARY */}
          {selectedOptions.showEsiSummary !== false && (
            <div className={styles.summaryBox}>
              <div className={styles.summaryHeader}>ESI SUMMARY</div>
              <div className={styles.summaryRow}>
                <span>TOTAL ESIC EMPOLYEES</span>
                <span>{esiSummary.strn || records.length}</span>
              </div>
              <div className={styles.summaryRow}>
                <span>ESI WAGES</span>
                <span>{esiSummary.esiWages || 0}</span>
              </div>
              <div className={styles.summaryRow}>
                <span>EE_WAGES_0.75%</span>
                <span>{esiSummary.eeShare || 0}</span>
              </div>
              <div className={styles.summaryRow}>
                <span>EE_OT_0.75%</span>
                <span>0</span>
              </div>
              <div className={styles.summaryRow}>
                <span>ER_3.25%</span>
                <span>{esiSummary.erShare || 0}</span>
              </div>
              <div style={{ flex: 1 }}></div>
              <div className={styles.summaryRowBold}>
                <span>TOTAL ESIC CONTRIBUTI</span>
                <span>{esiSummary.totalEsi || 0}</span>
              </div>
            </div>
          )}

          {/* Box 3: LWF SUMMARY */}
          {selectedOptions.showLwfSummary !== false && (
            <div className={styles.summaryBox}>
              <div className={styles.summaryHeader}>LWF SUMMARY</div>
              <div className={styles.summaryRow}>
                <span>TOTAL LWF EMPLOYEES</span>
                <span>{lwfSummary.totalLwfEmployees || 0}</span>
              </div>
              <div className={styles.summaryRow}>
                <span>EMPLOYEE SAHRE OF LWF</span>
                <span>{lwfSummary.employeeShare || 0}</span>
              </div>
              <div className={styles.summaryRow}>
                <span>EMPLOYER SHARE OF LWF</span>
                <span>{lwfSummary.employerShare || 0}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
