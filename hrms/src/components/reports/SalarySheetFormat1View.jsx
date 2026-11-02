import React, { useState, useMemo } from 'react';
import {
  FileText,
  FileSpreadsheet,
  Download,
  Building2,
  Calendar,
  Users,
  IndianRupee,
  ShieldCheck,
  Loader2,
} from 'lucide-react';
import {
  downloadSalarySheetFormat1Pdf,
  downloadSalarySheetFormat1Excel,
  downloadSalarySheetFormat1Csv,
} from '../../utils/salarySheetFormat1Export';
import { numberToIndianWords } from '../../utils/payrollUtils';
import SalarySheetFormat1Options from './SalarySheetFormat1Options';
import { getDefaultSelectedOptions } from './salarySheetFormat1Config';
import styles from './SalarySheetFormat1View.module.css';

/**
 * Statutory Wage/Salary Register (Salary Sheet Format 1) View
 * Matches exact format from user's reference images (Images 2 & 3).
 * Fully dynamic rendering powered by live MongoDB calculations and configurable Report Options.
 */
export default function SalarySheetFormat1View({
  records = [],
  companyInfo = {},
  clientInfo = {},
  establishmentInfo = {},
  period = {},
  totals = {},
  pfSummary = {},
  esiSummary = {},
  ptSummary = {},
  earningSummary = {},
  deductionSummary = {},
  statutoryConfig = {},
  filters = {},
  selectedOptions: propSelectedOptions,
  onOptionsChange,
  showOptions = false,
}) {
  const [downloadingFormat, setDownloadingFormat] = useState(null);
  const [internalSelectedOptions, setInternalSelectedOptions] = useState(() => getDefaultSelectedOptions());
  const selectedOptions = propSelectedOptions || internalSelectedOptions;
  const setSelectedOptions = onOptionsChange || setInternalSelectedOptions;

  // Dynamic configured rates resolved from Statutory Setup / Report response
  const activePfRate = Array.isArray(statutoryConfig?.pf?.pfRates)
    ? statutoryConfig.pf.pfRates.find((r) => r.enabled)
    : null;
  const pfEmployeeRate = pfSummary?.rates?.employeeRate !== undefined
    ? pfSummary.rates.employeeRate
    : (statutoryConfig?.pf?.employeeRate !== undefined
      ? statutoryConfig.pf.employeeRate
      : (activePfRate?.employeeRate !== undefined
        ? activePfRate.employeeRate
        : (statutoryConfig?.pf?.employeeContribution !== undefined
          ? statutoryConfig.pf.employeeContribution
          : 12)));

  const pfEmployerRate = pfSummary?.rates?.employerRate !== undefined
    ? pfSummary.rates.employerRate
    : (statutoryConfig?.pf?.employerRate !== undefined
      ? statutoryConfig.pf.employerRate
      : (activePfRate?.employerRate !== undefined
        ? activePfRate.employerRate
        : (statutoryConfig?.pf?.epfEmployerContribution !== undefined
          ? statutoryConfig.pf.epfEmployerContribution
          : 3.67)));

  const pfPensionRate = pfSummary?.rates?.pensionRate !== undefined
    ? pfSummary.rates.pensionRate
    : (statutoryConfig?.pf?.pensionRate !== undefined
      ? statutoryConfig.pf.pensionRate
      : (activePfRate?.pensionRate !== undefined
        ? activePfRate.pensionRate
        : (statutoryConfig?.pf?.epsContribution !== undefined
          ? statutoryConfig.pf.epsContribution
          : 8.33)));

  const pfAdminRate = pfSummary?.rates?.adminRate !== undefined
    ? pfSummary.rates.adminRate
    : (statutoryConfig?.pf?.adminRate !== undefined
      ? statutoryConfig.pf.adminRate
      : 0.5);

  const pfEdliRate = pfSummary?.rates?.edliRate !== undefined
    ? pfSummary.rates.edliRate
    : (statutoryConfig?.pf?.edliRate !== undefined
      ? statutoryConfig.pf.edliRate
      : 0.5);

  const activeEsiRate = Array.isArray(statutoryConfig?.esi?.esiRates)
    ? statutoryConfig.esi.esiRates.find((r) => r.enabled)
    : null;
  const esiEmployeeRate = esiSummary?.rates?.employeeContribution !== undefined
    ? esiSummary.rates.employeeContribution
    : (statutoryConfig?.esi?.employeeRate !== undefined
      ? statutoryConfig.esi.employeeRate
      : (activeEsiRate?.employeeContribution !== undefined
        ? activeEsiRate.employeeContribution
        : (statutoryConfig?.esi?.employeeContribution !== undefined
          ? statutoryConfig.esi.employeeContribution
          : 0.75)));

  const esiEmployerRate = esiSummary?.rates?.employerContribution !== undefined
    ? esiSummary.rates.employerContribution
    : (statutoryConfig?.esi?.employerRate !== undefined
      ? statutoryConfig.esi.employerRate
      : (activeEsiRate?.employerContribution !== undefined
        ? activeEsiRate.employerContribution
        : (statutoryConfig?.esi?.employerContribution !== undefined
          ? statutoryConfig.esi.employerContribution
          : 3.25)));

  // Filter rows strictly as per selectedOptions (recordScope, excludeHoldSalary)
  const displayRows = useMemo(() => {
    let list = Array.isArray(records) ? records : [];
    const scope = selectedOptions?.recordScope || 'active';
    const excludeHold = selectedOptions?.excludeHoldSalary !== false;

    if (scope === 'active') {
      list = list.filter((r) => {
        const isInactive =
          r.status === 'Inactive' ||
          r.status === 'Left' ||
          r.status === 'Resigned' ||
          r.status === 'Terminated' ||
          r.isActive === false;
        return !isInactive;
      });
    } else if (scope === 'inactive') {
      list = list.filter((r) => {
        const isInactive =
          r.status === 'Inactive' ||
          r.status === 'Left' ||
          r.status === 'Resigned' ||
          r.status === 'Terminated' ||
          r.isActive === false;
        return isInactive;
      });
    }

    if (excludeHold) {
      list = list.filter((r) => {
        const isHold =
          r.salaryHold === true ||
          r.isHold === true ||
          r.holdSalary === true ||
          r.hold === true ||
          r.salaryStatus === 'HOLD' ||
          r.salaryStatus === 'Hold' ||
          r.status === 'HOLD' ||
          r.status === 'Hold';
        return !isHold;
      });
    }

    return list;
  }, [records, selectedOptions?.recordScope, selectedOptions?.excludeHoldSalary]);

  // Dynamically compute totals matching the filtered active display rows
  const dynamicTotals = useMemo(() => {
    let totalWo = 0, totalPh = 0, totalPd = 0, totalPl = 0, totalCl = 0, totalSl = 0, totalMlAdj = 0;
    let grandBasic = 0, grandDa = 0, grandHra = 0, grandConv = 0, grandSpAll = 0, grandOthAll = 0, grandOtPib = 0;
    let grandGross = 0, grandPf = 0, grandEsi = 0, grandPt = 0, grandIt = 0, grandLwf = 0;
    let grandAdvance = 0, grandLoan = 0, grandFood = 0, grandOthDed = 0, grandEMbill = 0;
    let grandDeductions = 0, grandNet = 0, totalRateTotal = 0;

    displayRows.forEach((r) => {
      const att = r.attendance || {};
      const rate = r.rateOfWages || {};
      const earn = r.earnings || {};
      const ded = r.deductions || {};

      totalWo += Number(att.wo) || 0;
      totalPh += Number(att.ph) || 0;
      totalPd += Number(att.pd) || 0;
      totalPl += Number(att.pl) || 0;
      totalCl += Number(att.cl) || 0;
      totalSl += Number(att.sl) || 0;
      totalMlAdj += Number(att.mlAdj) || 0;

      totalRateTotal += Number(rate.total) || 0;

      grandBasic += Number(earn.basic) || 0;
      grandDa += Number(earn.da) || 0;
      grandHra += Number(earn.hra) || 0;
      grandConv += Number(earn.conv) || 0;
      grandSpAll += Number(earn.spAll) || 0;
      grandOthAll += Number(earn.othAll) || 0;
      grandOtPib += Number(earn.otPib) || 0;

      grandGross += Number(r.grossSalary) || 0;

      grandPf += Number(ded.pf) || 0;
      grandEsi += Number(ded.esi) || 0;
      grandPt += Number(ded.pt) || 0;
      grandIt += Number(ded.it) || 0;
      grandLwf += Number(ded.lwf) || 0;
      grandAdvance += Number(ded.advance) || 0;
      grandLoan += Number(ded.loan) || 0;
      grandFood += Number(ded.food) || 0;
      grandOthDed += Number(ded.othDed) || 0;
      grandEMbill += Number(ded.eMbill) || 0;

      grandDeductions += Number(r.grossDeduct) || 0;
      grandNet += Number(r.netPayable) || 0;
    });

    return {
      ...totals,
      totalWo, totalPh, totalPd, totalPl, totalCl, totalSl, totalMlAdj,
      totalRateTotal,
      grandBasic, grandDa, grandHra, grandConv, grandSpAll, grandOthAll, grandOtPib,
      grandGross, grandPf, grandEsi, grandPt, grandIt, grandLwf,
      grandAdvance, grandLoan, grandFood, grandOthDed, grandEMbill,
      grandDeductions, grandNet,
    };
  }, [displayRows, totals]);

  // Dynamic PF Summary reflecting displayRows and configured rates
  const activePfSummary = useMemo(() => {
    if (displayRows.length === records.length && pfSummary?.pfWages) {
      return pfSummary;
    }
    let pfWages = 0;
    let strn = 0;
    let ee = 0;
    displayRows.forEach((r) => {
      const ded = r.deductions || {};
      const pfVal = Number(ded.pf) || 0;
      if (pfVal > 0) {
        strn++;
        ee += pfVal;
        pfWages += Number(r.pfWage) || (Number(r.earnings?.basic || 0) + Number(r.earnings?.da || 0));
      }
    });
    const erDiff = Math.round(pfWages * (pfEmployerRate / 100));
    const ac1 = ee + erDiff;
    const ac10 = Math.round(pfWages * (pfPensionRate / 100));
    const ac2 = Math.round(pfWages * (pfAdminRate / 100));
    const ac21 = Math.round(pfWages * (pfEdliRate / 100));
    const ac22 = 0;
    return {
      pfWages,
      strn,
      ee,
      erDiff,
      ac1,
      ac10,
      ac2,
      ac21,
      ac22,
      total: ac1 + ac10 + ac2 + ac21 + ac22,
    };
  }, [displayRows, records.length, pfSummary, pfEmployerRate, pfPensionRate, pfAdminRate, pfEdliRate]);

  // Dynamic ESI Summary reflecting displayRows and configured rates
  const activeEsiSummary = useMemo(() => {
    if (displayRows.length === records.length && esiSummary?.esiWages) {
      return esiSummary;
    }
    let esiWages = 0;
    let strn = 0;
    let eeShare = 0;
    displayRows.forEach((r) => {
      const ded = r.deductions || {};
      const esiVal = Number(ded.esi) || 0;
      if (esiVal > 0) {
        strn++;
        eeShare += esiVal;
        esiWages += Number(r.esiWage) || Number(r.grossSalary) || 0;
      }
    });
    const erShare = Math.round(esiWages * (esiEmployerRate / 100));
    return {
      esiWages,
      strn,
      eeShare,
      erShare,
      totalEsi: eeShare + erShare,
    };
  }, [displayRows, records.length, esiSummary, esiEmployerRate]);

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

  const companyName =
    companyInfo?.name ||
    companyInfo?.companyName ||
    savedSetup?.companyName ||
    localDefaultComp?.name ||
    '';

  const companyAddress =
    (companyInfo?.address && companyInfo.address !== '—' ? companyInfo.address : null) ||
    (savedSetup?.address && savedSetup.address !== '—' ? savedSetup.address : null) ||
    (localDefaultComp?.address && localDefaultComp.address !== '—' ? localDefaultComp.address : null) ||
    '';

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
  const toDate = period?.toDate || new Date().toISOString().slice(0, 10);

  const clientName =
    clientInfo?.name ||
    clientInfo?.clientName ||
    establishmentInfo?.establishmentName ||
    (filters?.company && filters.company !== 'All Companies' ? filters.company : null) ||
    records[0]?.clientName ||
    records[0]?.site ||
    '';

  // Exporters with dynamic loading spinner
  const handleDownloadPdf = async () => {
    if (downloadingFormat) return;
    try {
      setDownloadingFormat('pdf');
      await new Promise((r) => setTimeout(r, 60));
      await downloadSalarySheetFormat1Pdf(
        records,
        companyInfo,
        period,
        totals,
        pfSummary,
        esiSummary,
        ptSummary,
        earningSummary,
        deductionSummary,
        { mode: 'download', clientInfo, filters, selectedOptions }
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
      await downloadSalarySheetFormat1Excel(
        records,
        companyInfo,
        period,
        totals,
        pfSummary,
        esiSummary,
        ptSummary,
        earningSummary,
        deductionSummary,
        { format: 'xlsx', clientInfo, filters, selectedOptions }
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
      await downloadSalarySheetFormat1Csv(
        records,
        companyInfo,
        period,
        totals,
        pfSummary,
        esiSummary,
        ptSummary,
        earningSummary,
        deductionSummary,
        { clientInfo, filters, selectedOptions }
      );
      await new Promise((r) => setTimeout(r, 300));
    } catch (err) {
      console.error('CSV export failed:', err);
    } finally {
      setDownloadingFormat(null);
    }
  };

  const hasPage2Selected =
    selectedOptions.showPfSummary !== false ||
    selectedOptions.showEsiSummary !== false ||
    selectedOptions.showPtSummary !== false ||
    selectedOptions.showWorkforceStrength !== false ||
    selectedOptions.showEarningDeductionStatement !== false ||
    selectedOptions.showNetPayHighlight !== false ||
    selectedOptions.showSignatures !== false;

  return (
    <div className={styles.container}>
      

      {/* Dynamic Report Options UI (Frontend Configurable Options Panel) */}
      {showOptions && (
        <SalarySheetFormat1Options
          selectedOptions={selectedOptions}
          onChange={setSelectedOptions}
          onReset={() => setSelectedOptions(getDefaultSelectedOptions())}
        />
      )}

      {/* Official Statutory Document Sheet Layout (Multi-page Container) */}
      <div className={styles.printableReportContainer} data-report-sheet="true">
        {/* Page 1: Detailed Employee Register Sheet */}
        <div className={styles.paper} data-page="1">
          {/* Document Header matching Image 2 */}
          <div className={styles.docHeader}>
            <div className={styles.docCompanyInfo}>
              <h1 className={styles.docCompanyName}>{companyName}</h1>
              <p className={styles.docCompanyAddress}>{companyAddress}</p>
            </div>
            <div className={styles.statutoryRulesBlock}>
              <div>(1) Form under Rule - 6 of Equal Remuneration Rules 1976.</div>
              <div>(2) Form under Rule - 21(4),25(2),26(1) and 26(2) of Gujarat Minimum Wages Rules 1961</div>
              <div>(3) Form under Rule - 6 of Payment of Wages Gujarat Rules, 1963.</div>
              <div>(4) Form 17 under Rule - 78 of Contract Labour (Regulation &amp; Abolition) Gujarat, Rules 1972</div>
              <div>(5) Form under Rule - 52(2) of Inter State Migrant Workers (Gujarat) Rules 1981</div>
            </div>
          </div>

          {/* Sub Meta Bar */}
          <div className={styles.subMetaBar}>
            <div className={styles.metaColLeft}>
              <div>PF No :- {pfNo}</div>
              <div>ESI No :- {esiNo}</div>
              <div style={{ marginTop: '2px', fontWeight: 'normal', fontSize: '0.72rem' }}>
                Date of Payment :- {toDate}
              </div>
            </div>
            <div className={styles.metaColCenter}>
              Wage/Salary Register
            </div>
            <div className={styles.metaColRight}>
              <div>For The Month Of &nbsp;{monthLabel}</div>
              {clientName && <div style={{ fontSize: '0.72rem', marginTop: '2px', fontWeight: 600 }}>Client: {clientName}</div>}
            </div>
          </div>

          {/* Multi-Tier Salary Register Table */}
          <div className={styles.tableWrap}>
            <table className={styles.salaryTable}>
              <thead>
                <tr>
                  <th rowSpan="2" style={{ width: '28px' }}>Sr.<br />No.</th>
                  <th rowSpan="2" style={{ minWidth: '150px' }}>
                    Employee Name<br />
                    <span style={{ fontWeight: 'normal', fontSize: '0.68rem' }}>Designation<br />Department</span>
                  </th>
                  <th rowSpan="2" style={{ width: '55px' }}>Emp. ID</th>
                  <th rowSpan="2" style={{ minWidth: '95px' }}>
                    Details<br />of<br />Attendance
                  </th>
                  <th rowSpan="2" style={{ minWidth: '95px' }}>
                    Rate of<br />Wages
                  </th>
                  <th colSpan="4" className={styles.groupHeader}>Earnings</th>
                  <th rowSpan="2" style={{ minWidth: '75px' }}>
                    Gross<br />Salary
                  </th>
                  <th colSpan="4" className={styles.groupHeader}>Deduction</th>
                  <th rowSpan="2" style={{ minWidth: '65px' }}>
                    Gross<br />Deduct.
                  </th>
                  <th rowSpan="2" style={{ minWidth: '80px' }}>
                    Net<br />Payable
                  </th>
                  <th rowSpan="2" style={{ minWidth: '120px' }}>
                    Signature
                  </th>
                </tr>
                <tr>
                  {/* Earnings Sub-columns */}
                  <th className={styles.subHeader}>BASIC<br />DA</th>
                  <th className={styles.subHeader}>HRA<br />OTH.All</th>
                  <th className={styles.subHeader}>CONV</th>
                  <th className={styles.subHeader}>SP.All<br />OT/PIB</th>

                  {/* Deductions Sub-columns */}
                  <th className={styles.subHeader}>P.F ({pfEmployeeRate}%)<br />ESI ({esiEmployeeRate}%)</th>
                  <th className={styles.subHeader}>P.T.<br />I.T. / LWF</th>
                  <th className={styles.subHeader}>Advance<br />Loan / Food</th>
                  <th className={styles.subHeader}>Oth.Ded<br />E/Mbill</th>
                </tr>
              </thead>
              <tbody>
                {displayRows.map((row, idx) => {
                  const att = row.attendance || {};
                  const rate = row.rateOfWages || {};
                  const earn = row.earnings || {};
                  const ded = row.deductions || {};

                  return (
                    <tr key={row.employeeId ? `${row.employeeId}-${idx}` : `salary-row-${idx}`}>
                      {/* 1. Sr. No. */}
                      <td className={styles.center} style={{ fontWeight: 700 }}>
                        {selectedOptions.srNo !== false ? (row.srNo || idx + 1) : '—'}
                      </td>

                      {/* 2. Employee Details */}
                      <td>
                        {selectedOptions.name !== false && <div className={styles.empNameMain}>{row.name}</div>}
                        {selectedOptions.designation !== false && row.designation && <div className={styles.empSub}>{row.designation}</div>}
                        {selectedOptions.department !== false && row.department && <div className={styles.empSub} style={{ fontWeight: 600 }}>{row.department}</div>}
                        {selectedOptions.fatherHusbandName !== false && (row.fatherHusbandName || row.fatherName) && (
                          <div className={styles.empSub}>F/H: {row.fatherHusbandName || row.fatherName}</div>
                        )}
                        {selectedOptions.site !== false && (row.site || row.siteLocation || row.clientName) && (
                          <div className={styles.empSub}>Site: {row.site || row.siteLocation || row.clientName}</div>
                        )}
                        {(Boolean(selectedOptions.dutyPost)) && (row.dutyPost || row.post) && (
                          <div className={styles.empSub}>Post: {row.dutyPost || row.post}</div>
                        )}
                        {(Boolean(selectedOptions.joiningDate) || Boolean(selectedOptions.dateOfJoining)) && (row.joiningDate || row.doj) && (
                          <div className={styles.empSub}>DOJ: {row.joiningDate || row.doj}</div>
                        )}
                        {(Boolean(selectedOptions.gender) || Boolean(selectedOptions.sex)) && (
                          <div className={styles.empSub}>Sex: {row.gender || row.sex || 'Male'}</div>
                        )}
                        {selectedOptions.uan !== false && row.uan && <div className={styles.empSub}>UAN No:{row.uan}</div>}
                        {selectedOptions.pfNo !== false && row.pfNo && <div className={styles.empSub}>PF.No {row.pfNo}</div>}
                        {selectedOptions.esiNo !== false && row.esiNo && <div className={styles.empSub}>ESI No:{row.esiNo}</div>}
                        {(Boolean(selectedOptions.pan) || Boolean(selectedOptions.incomeTaxPan)) && (row.pan || row.panNo) && <div className={styles.empSub}>PAN: {row.pan || row.panNo}</div>}
                        {(Boolean(selectedOptions.aadhaar) || Boolean(selectedOptions.aadhaarNumber)) && (row.aadhaar || row.aadhaarNo) && <div className={styles.empSub}>Aadhaar: {row.aadhaar || row.aadhaarNo}</div>}
                      </td>

                      {/* 3. Emp. ID */}
                      <td className={styles.center} style={{ fontWeight: 700 }}>
                        {selectedOptions.employeeId !== false ? row.employeeId : '—'}
                      </td>

                      {/* 4. Details of Attendance */}
                      <td>
                        <div className={styles.metricList}>
                          {selectedOptions.attWd !== false && <div className={styles.metricRow}><span>WD</span><span>{att.wd || '30.00'}</span></div>}
                          {selectedOptions.attWo !== false && <div className={styles.metricRow}><span>WO</span><span>{att.wo || '0.00'}</span></div>}
                          {selectedOptions.attPh !== false && <div className={styles.metricRow}><span>PH</span><span>{att.ph || '0.00'}</span></div>}
                          {selectedOptions.attPd !== false && <div className={styles.metricRow}><span>PD</span><span>{att.pd || '0.00'}</span></div>}
                          {selectedOptions.attPl !== false && <div className={styles.metricRow}><span>PL</span><span>{att.pl || '0.00'}</span></div>}
                          {selectedOptions.attCl !== false && <div className={styles.metricRow}><span>CL</span><span>{att.cl || '0.00'}</span></div>}
                          {selectedOptions.attSl !== false && <div className={styles.metricRow}><span>S.L.</span><span>{att.sl || '0.00'}</span></div>}
                          {selectedOptions.attMlAdj !== false && (att.mlAdj || selectedOptions.attMlAdj === true) && <div className={styles.metricRow}><span>ML/Adj</span><span>{att.mlAdj || '0.00'}</span></div>}
                          {selectedOptions.attTot !== false && (
                            <div className={styles.metricTotalRow}>
                              <span>TOT</span><span>{att.tot || '0.00'}</span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* 5. Rate of Wages */}
                      <td>
                        <div className={styles.metricList}>
                          {selectedOptions.rateBasic !== false && <div className={styles.metricRow}><span>BASIC</span><span>{rate.basic || 0}</span></div>}
                          {selectedOptions.rateDa !== false && <div className={styles.metricRow}><span>DA</span><span>{rate.da || 0}</span></div>}
                          {selectedOptions.rateHra !== false && <div className={styles.metricRow}><span>HRA</span><span>{rate.hra || 0}</span></div>}
                          {selectedOptions.rateConv !== false && <div className={styles.metricRow}><span>CONV</span><span>{rate.conv || 0}</span></div>}
                          {selectedOptions.rateSpAll !== false && <div className={styles.metricRow}><span>SP.All</span><span>{rate.spAll || 0}</span></div>}
                          {selectedOptions.rateOthAll !== false && <div className={styles.metricRow}><span>OTH.All</span><span>{rate.othAll || 0}</span></div>}
                          {selectedOptions.rateTotal !== false && (
                            <div className={styles.metricTotalRow}>
                              <span>Total</span><span>{rate.total || 0}</span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* 6. Earnings - BASIC / DA */}
                      <td className={styles.stackedCell}>
                        <div>{selectedOptions.earnBasic !== false ? (earn.basic || 0) : '—'}</div>
                        <div className={styles.stackedCellSecondary}>{selectedOptions.earnDa !== false ? (earn.da || 0) : '—'}</div>
                      </td>

                      {/* 7. Earnings - HRA / OTH.All */}
                      <td className={styles.stackedCell}>
                        <div>{selectedOptions.earnHra !== false ? (earn.hra || 0) : '—'}</div>
                        <div className={styles.stackedCellSecondary}>{selectedOptions.earnOthAll !== false ? (earn.othAll || 0) : '—'}</div>
                      </td>

                      {/* 8. Earnings - CONV */}
                      <td className={styles.stackedCell}>
                        <div>{selectedOptions.earnConv !== false ? (earn.conv || 0) : '—'}</div>
                      </td>

                      {/* 9. Earnings - SP.All / OT/PIB */}
                      <td className={styles.stackedCell}>
                        <div>{selectedOptions.earnSpAll !== false ? (earn.spAll || 0) : '—'}</div>
                        <div className={styles.stackedCellSecondary}>{selectedOptions.earnOtPib !== false ? (earn.otPib || 0) : '—'}</div>
                      </td>

                      {/* 10. Gross Salary (Gross, P: pfWage, E: esiWage) */}
                      <td className={styles.grossCell}>
                        <div>{selectedOptions.grossSalary !== false ? (row.grossSalary || 0).toLocaleString('en-IN') : '—'}</div>
                        {selectedOptions.pfWage !== false && row.pfWage > 0 && <div className={styles.peBase}>P {row.pfWage.toLocaleString('en-IN')}</div>}
                        {selectedOptions.esiWage !== false && row.esiWage > 0 && <div className={styles.peBase}>E {row.esiWage.toLocaleString('en-IN')}</div>}
                      </td>

                      {/* 11. Deduction - P.F / ESI */}
                      <td className={styles.stackedCell}>
                        <div>{selectedOptions.dedPf !== false ? (ded.pf || 0) : '—'}</div>
                        <div className={styles.stackedCellSecondary}>{selectedOptions.dedEsi !== false ? (ded.esi || 0) : '—'}</div>
                      </td>

                      {/* 12. Deduction - P.T. / I.T. / LWF */}
                      <td className={styles.stackedCell}>
                        <div>{selectedOptions.dedPt !== false ? (ded.pt || 0) : '—'}</div>
                        <div className={styles.stackedCellSecondary}>{selectedOptions.dedIt !== false ? (ded.it || 0) : '—'}</div>
                        <div className={styles.stackedCellSecondary}>{selectedOptions.dedLwf !== false ? (ded.lwf || 0) : '—'}</div>
                      </td>

                      {/* 13. Deduction - Advance / LOAN / Food */}
                      <td className={styles.stackedCell}>
                        <div>{selectedOptions.dedAdvance !== false ? (ded.advance || 0) : '—'}</div>
                        <div className={styles.stackedCellSecondary}>{selectedOptions.dedLoan !== false ? (ded.loan || 0) : '—'}</div>
                        <div className={styles.stackedCellSecondary}>{selectedOptions.dedFood !== false ? (ded.food || 0) : '—'}</div>
                      </td>

                      {/* 14. Deduction - Oth.Ded / E/Mbill */}
                      <td className={styles.stackedCell}>
                        <div>{selectedOptions.dedOthDed !== false ? (ded.othDed || 0) : '—'}</div>
                        <div className={styles.stackedCellSecondary}>{selectedOptions.dedEMbill !== false ? (ded.eMbill || 0) : '—'}</div>
                      </td>

                      {/* 15. Gross Deduct. */}
                      <td className={styles.right} style={{ fontWeight: 700 }}>
                        {selectedOptions.grossDeduct !== false ? (row.grossDeduct || 0).toLocaleString('en-IN') : '—'}
                      </td>

                      {/* 16. Net Payable */}
                      <td className={styles.netPayCell}>
                        {selectedOptions.netPayable !== false ? (row.netPayable || 0).toLocaleString('en-IN') : '—'}
                      </td>

                      {/* 17. Signature / Bank */}
                      <td className={styles.bankCell}>
                        <div style={{ color: '#475569' }}>Bank</div>
                        {selectedOptions.bankName !== false && <div className={styles.bankName}>{row.bankName || '—'}</div>}
                        {selectedOptions.bankAccountNo !== false && <div className={styles.bankAc}>{row.bankAccountNo || '—'}</div>}
                        {selectedOptions.ifsc && row.ifsc && <div className={styles.bankAc} style={{ fontSize: '0.65rem' }}>IFSC: {row.ifsc}</div>}
                        {selectedOptions.paymentMode && row.paymentMode && <div className={styles.bankAc} style={{ fontSize: '0.65rem' }}>Mode: {row.paymentMode}</div>}
                        {selectedOptions.signature !== false && <div style={{ color: '#94a3b8', fontSize: '0.65rem', marginTop: '4px' }}>Sign: ________</div>}
                      </td>
                    </tr>
                  );
                })}

                {/* Grand Total Row matching Image 2 */}
                {displayRows.length > 0 && (
                  <tr className={styles.grandTotalRow}>
                    <td colSpan="3" className={styles.center} style={{ fontSize: '0.85rem' }}>
                      Grand Total
                    </td>

                    {/* Attendance Totals */}
                    <td>
                      <div className={styles.metricList}>
                        {selectedOptions.attWo !== false && <div className={styles.metricRow}><span>Total WO</span><span>{(dynamicTotals.totalWo || 0).toFixed(2)}</span></div>}
                        {selectedOptions.attPh !== false && <div className={styles.metricRow}><span>Total PH</span><span>{(dynamicTotals.totalPh || 0).toFixed(2)}</span></div>}
                        {selectedOptions.attPd !== false && <div className={styles.metricRow}><span>Total PD</span><span>{(dynamicTotals.totalPd || 0).toFixed(2)}</span></div>}
                        {selectedOptions.attPl !== false && <div className={styles.metricRow}><span>Total PL</span><span>{(dynamicTotals.totalPl || 0).toFixed(2)}</span></div>}
                        {selectedOptions.attCl !== false && <div className={styles.metricRow}><span>Total CL</span><span>{(dynamicTotals.totalCl || 0).toFixed(2)}</span></div>}
                        {selectedOptions.attSl !== false && <div className={styles.metricRow}><span>Total S.L.</span><span>{(dynamicTotals.totalSl || 0).toFixed(2)}</span></div>}
                        {selectedOptions.attMlAdj !== false && (dynamicTotals.totalMlAdj || selectedOptions.attMlAdj === true) && <div className={styles.metricRow}><span>ML/Adj</span><span>{(dynamicTotals.totalMlAdj || 0).toFixed(2)}</span></div>}
                      </div>
                    </td>

                    {/* Rate Totals */}
                    <td className={styles.right}>
                      {selectedOptions.rateTotal !== false && dynamicTotals.totalRateTotal ? dynamicTotals.totalRateTotal.toLocaleString('en-IN') : ''}
                    </td>

                    {/* Earnings Totals */}
                    <td className={styles.stackedCell}>
                      <div>{selectedOptions.earnBasic !== false ? (dynamicTotals.grandBasic || 0) : '—'}</div>
                      <div className={styles.stackedCellSecondary}>{selectedOptions.earnDa !== false ? (dynamicTotals.grandDa || 0) : '—'}</div>
                    </td>
                    <td className={styles.stackedCell}>
                      <div>{selectedOptions.earnHra !== false ? (dynamicTotals.grandHra || 0) : '—'}</div>
                      <div className={styles.stackedCellSecondary}>{selectedOptions.earnOthAll !== false ? (dynamicTotals.grandOthAll || 0) : '—'}</div>
                    </td>
                    <td className={styles.stackedCell}>
                      <div>{selectedOptions.earnConv !== false ? (dynamicTotals.grandConv || 0) : '—'}</div>
                    </td>
                    <td className={styles.stackedCell}>
                      <div>{selectedOptions.earnSpAll !== false ? (dynamicTotals.grandSpAll || 0) : '—'}</div>
                      <div className={styles.stackedCellSecondary}>{selectedOptions.earnOtPib !== false ? (dynamicTotals.grandOtPib || 0) : '—'}</div>
                    </td>

                    {/* Gross Total */}
                    <td className={styles.right} style={{ fontSize: '0.82rem' }}>
                      {selectedOptions.grossSalary !== false ? (dynamicTotals.grandGross || 0).toLocaleString('en-IN') : '—'}
                    </td>

                    {/* Deductions Totals */}
                    <td className={styles.stackedCell}>
                      <div>{selectedOptions.dedPf !== false ? (dynamicTotals.grandPf || 0) : '—'}</div>
                      <div className={styles.stackedCellSecondary}>{selectedOptions.dedEsi !== false ? (dynamicTotals.grandEsi || 0) : '—'}</div>
                    </td>
                    <td className={styles.stackedCell}>
                      <div>{selectedOptions.dedPt !== false ? (dynamicTotals.grandPt || 0) : '—'}</div>
                      <div className={styles.stackedCellSecondary}>{selectedOptions.dedIt !== false ? (dynamicTotals.grandIt || 0) : '—'}</div>
                      <div className={styles.stackedCellSecondary}>{selectedOptions.dedLwf !== false ? (dynamicTotals.grandLwf || 0) : '—'}</div>
                    </td>
                    <td className={styles.stackedCell}>
                      <div>{selectedOptions.dedAdvance !== false ? (dynamicTotals.grandAdvance || 0) : '—'}</div>
                      <div className={styles.stackedCellSecondary}>{selectedOptions.dedLoan !== false ? (dynamicTotals.grandLoan || 0) : '—'}</div>
                      <div className={styles.stackedCellSecondary}>{selectedOptions.dedFood !== false ? (dynamicTotals.grandFood || 0) : '—'}</div>
                    </td>
                    <td className={styles.stackedCell}>
                      <div>{selectedOptions.dedOthDed !== false ? (dynamicTotals.grandOthDed || 0) : '—'}</div>
                      <div className={styles.stackedCellSecondary}>{selectedOptions.dedEMbill !== false ? (dynamicTotals.grandEMbill || 0) : '—'}</div>
                    </td>

                    {/* Gross Deductions Total */}
                    <td className={styles.right} style={{ fontSize: '0.82rem' }}>
                      {selectedOptions.grossDeduct !== false ? (dynamicTotals.grandDeductions || 0).toLocaleString('en-IN') : '—'}
                    </td>

                    {/* Net Payable Total */}
                    <td className={styles.right} style={{ fontSize: '0.88rem', color: '#166534' }}>
                      {selectedOptions.netPayable !== false ? (dynamicTotals.grandNet || 0).toLocaleString('en-IN') : '—'}
                    </td>

                    {/* Signature Total */}
                    <td className={styles.center} style={{ fontSize: '0.75rem' }}>
                      For {companyName}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Page 2: Dedicated Statutory Summary & Reconciliation Sheet (Separate Document Sheet) */}
        {hasPage2Selected && (
          <div className={`${styles.paper} ${styles.summaryPageSheet}`} data-page="2">
            {/* Summary Page Document Header */}
            <div className={styles.summaryDocHeader}>
              <div className={styles.summaryDocHeaderLeft}>
                <h2 className={styles.summaryDocCompanyName}>{companyName}</h2>
                <p className={styles.summaryDocCompanyAddress}>{companyAddress}</p>
                <div className={styles.summaryDocMetaRow}>
                  <span><strong>PF No:</strong> {pfNo}</span>
                  <span><strong>ESI No:</strong> {esiNo}</span>
                  <span><strong>Date of Payment:</strong> {toDate}</span>
                </div>
              </div>
              <div className={styles.summaryDocHeaderRight}>
                <div className={styles.summaryDocTitle}>WAGE / SALARY REGISTER</div>
                <div className={styles.summaryDocBadge}>STATUTORY RECONCILIATION &amp; SUMMARY STATEMENT</div>
                <div className={styles.summaryDocMonth}>
                  For The Month Of: <strong>{monthLabel}</strong>
                </div>
                {clientName && (
                  <div className={styles.summaryDocClient}>
                    Client / Site: <strong>{clientName}</strong>
                  </div>
                )}
              </div>
            </div>

            {/* Spacious 2-Column Summary Grid */}
            <div className={styles.summaryGridWrap}>
              {/* Left Column: PF, ESI, PT Summaries & Strength */}
              <div className={styles.summaryColLeft}>
                {/* 1. PF SUMMARY */}
                {selectedOptions.showPfSummary !== false && (
                  <div className={styles.summaryBox}>
                    <div className={styles.summaryBoxHeader}>
                      <span className={styles.summaryTitle}>PF SUMMARY STATEMENT</span>
                      <span className={styles.summarySubtitle}>Employees' Provident Fund Act, 1952</span>
                    </div>
                    <table className={styles.summaryTable}>
                      <thead>
                        <tr>
                          <th>PF Wages</th>
                          <th>Strn.</th>
                          <th>EE ({pfEmployeeRate}%)</th>
                          <th>ER (Diff {pfEmployerRate}%)</th>
                          <th>A/C - 1</th>
                          <th>A/C 10 ({pfPensionRate}%)</th>
                          <th>A/C 2 ({pfAdminRate}%)</th>
                          <th>A/C - 21 ({pfEdliRate}%)</th>
                          <th>A/C - 22</th>
                          <th>Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>{(activePfSummary.pfWages || 0).toLocaleString('en-IN')}</td>
                          <td style={{ textAlign: 'center' }}>{activePfSummary.strn || 0}</td>
                          <td>{(activePfSummary.ee || 0).toLocaleString('en-IN')}</td>
                          <td>{(activePfSummary.erDiff || 0).toLocaleString('en-IN')}</td>
                          <td>{(activePfSummary.ac1 || 0).toLocaleString('en-IN')}</td>
                          <td>{(activePfSummary.ac10 || 0).toLocaleString('en-IN')}</td>
                          <td>{(activePfSummary.ac2 || 0).toLocaleString('en-IN')}</td>
                          <td>{(activePfSummary.ac21 || 0).toLocaleString('en-IN')}</td>
                          <td>{(activePfSummary.ac22 || 0).toLocaleString('en-IN')}</td>
                          <td style={{ fontWeight: 800, background: '#f8fafc' }}>
                            {(activePfSummary.total || 0).toLocaleString('en-IN')}
                          </td>
                        </tr>
                        <tr className={styles.reconciliationRow}>
                          <td>{(activePfSummary.pfWages || 0).toLocaleString('en-IN')}</td>
                          <td></td>
                          <td></td>
                          <td></td>
                          <td></td>
                          <td></td>
                          <td></td>
                          <td>{(activePfSummary.pfWages || 0).toLocaleString('en-IN')}</td>
                          <td></td>
                          <td></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}

                {/* 2. ESI & PT Summary */}
                {(selectedOptions.showEsiSummary !== false || selectedOptions.showPtSummary !== false) && (
                  <div className={styles.ptSummaryWrap}>
                    {/* ESI Summary */}
                    {selectedOptions.showEsiSummary !== false && (
                      <div className={styles.summaryBox} style={{ flex: 1.4 }}>
                        <div className={styles.summaryBoxHeader}>
                          <span className={styles.summaryTitle}>ESI SUMMARY</span>
                          <span className={styles.summarySubtitle}>ESIC Act, 1948</span>
                        </div>
                        <table className={styles.summaryTable}>
                          <thead>
                            <tr>
                              <th>ESI Wages</th>
                              <th>Strn</th>
                              <th>EE Share ({esiEmployeeRate}%)</th>
                              <th>ER.Share ({esiEmployerRate}%)</th>
                              <th>Total ESI ({(Number(esiEmployeeRate) + Number(esiEmployerRate)).toFixed(2).replace(/\.00$/, '')}%)</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td>{(activeEsiSummary.esiWages || 0).toLocaleString('en-IN')}</td>
                              <td style={{ textAlign: 'center' }}>{activeEsiSummary.strn || 0}</td>
                              <td>{(activeEsiSummary.eeShare || 0).toLocaleString('en-IN')}</td>
                              <td>{(activeEsiSummary.erShare || 0).toLocaleString('en-IN')}</td>
                              <td style={{ fontWeight: 800, background: '#f8fafc' }}>
                                {(activeEsiSummary.totalEsi || 0).toLocaleString('en-IN')}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* PT Summary */}
                    {selectedOptions.showPtSummary !== false && (
                      <div className={styles.summaryBox} style={{ flex: 0.9 }}>
                        <div className={styles.summaryBoxHeader}>
                          <span className={styles.summaryTitle}>P.T. SUMMARY</span>
                          <span className={styles.summarySubtitle}>Professional Tax</span>
                        </div>
                        <table className={styles.summaryTable}>
                          <thead>
                            <tr>
                              <th>P.T. Head</th>
                              <th>Count</th>
                              <th>Total Amount</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td style={{ textAlign: 'left', fontWeight: 600 }}>PT Deducted</td>
                              <td style={{ textAlign: 'center' }}>{ptSummary.ptCount || 0}</td>
                              <td style={{ fontWeight: 700 }}>₹{(ptSummary.ptAmount || 0).toLocaleString('en-IN')}</td>
                            </tr>
                            <tr>
                              <td style={{ textAlign: 'left', fontWeight: 600 }}>PT Total</td>
                              <td style={{ textAlign: 'center' }}>{ptSummary.ptCount || 0}</td>
                              <td style={{ fontWeight: 800, background: '#f8fafc' }}>
                                ₹{(ptSummary.ptAmount || 0).toLocaleString('en-IN')}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {/* Workforce Strength Indicators */}
                {selectedOptions.showWorkforceStrength !== false && (
                  <div className={styles.emplStrengthCard}>
                    <div className={styles.strengthItem}>
                      <span className={styles.strengthLabel}>Total Strength:</span>
                      <strong className={styles.strengthValue}>{records.length} Employees</strong>
                    </div>
                    <div className={styles.strengthItem}>
                      <span className={styles.strengthLabel}>Active Workforce:</span>
                      <span className={styles.strengthValue}>
                        {records.filter((r) => r.status !== 'Inactive').length || records.length}
                      </span>
                    </div>
                    <div className={styles.strengthItem}>
                      <span className={styles.strengthLabel}>Excluded Strength:</span>
                      <span className={styles.strengthValue}>0</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column: Earning & Deduction Summary + Net Pay Card */}
              <div className={styles.summaryColRight}>
                {selectedOptions.showEarningDeductionStatement !== false && (
                  <div className={styles.summaryBox}>
                    <div className={styles.summaryBoxHeader}>
                      <span className={styles.summaryTitle}>EARNING &amp; DEDUCTION STATEMENT</span>
                      <span className={styles.summarySubtitle}>Consolidated Monthly Breakup</span>
                    </div>
                    <table className={styles.sideBySideTable}>
                      <thead>
                        <tr>
                          <th colSpan="2" className={styles.earningColHeader}>EARNING SUMMARY (₹)</th>
                          <th colSpan="2" className={styles.deductionColHeader}>DEDUCTION SUMMARY (₹)</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className={styles.headLabel}>BASIC</td>
                          <td className={styles.right}>{(earningSummary.basic ?? totals.grandBasic ?? 0).toLocaleString('en-IN')}</td>
                          <td className={styles.headLabel}>P.F</td>
                          <td className={styles.right}>{(deductionSummary.pf ?? totals.grandPf ?? 0).toLocaleString('en-IN')}</td>
                        </tr>
                        <tr>
                          <td className={styles.headLabel}>DA</td>
                          <td className={styles.right}>{(earningSummary.da ?? totals.grandDa ?? 0).toLocaleString('en-IN')}</td>
                          <td className={styles.headLabel}>ESI</td>
                          <td className={styles.right}>{(deductionSummary.esi ?? totals.grandEsi ?? 0).toLocaleString('en-IN')}</td>
                        </tr>
                        <tr>
                          <td className={styles.headLabel}>HRA</td>
                          <td className={styles.right}>{(earningSummary.hra ?? totals.grandHra ?? 0).toLocaleString('en-IN')}</td>
                          <td className={styles.headLabel}>P.T.</td>
                          <td className={styles.right}>{(deductionSummary.pt ?? totals.grandPt ?? 0).toLocaleString('en-IN')}</td>
                        </tr>
                        <tr>
                          <td className={styles.headLabel}>CONV</td>
                          <td className={styles.right}>{(earningSummary.conv ?? totals.grandConv ?? 0).toLocaleString('en-IN')}</td>
                          <td className={styles.headLabel}>I.T. (TDS)</td>
                          <td className={styles.right}>{(deductionSummary.it ?? totals.grandIt ?? 0).toLocaleString('en-IN')}</td>
                        </tr>
                        <tr>
                          <td className={styles.headLabel}>SP.All</td>
                          <td className={styles.right}>{(earningSummary.spAll ?? totals.grandSpAll ?? 0).toLocaleString('en-IN')}</td>
                          <td className={styles.headLabel}>LOAN</td>
                          <td className={styles.right}>{(deductionSummary.loan ?? totals.grandLoan ?? 0).toLocaleString('en-IN')}</td>
                        </tr>
                        <tr>
                          <td className={styles.headLabel}>OTH.All</td>
                          <td className={styles.right}>{(earningSummary.othAll ?? totals.grandOthAll ?? 0).toLocaleString('en-IN')}</td>
                          <td className={styles.headLabel}>Advance</td>
                          <td className={styles.right}>{(deductionSummary.advance ?? totals.grandAdvance ?? 0).toLocaleString('en-IN')}</td>
                        </tr>
                        <tr>
                          <td className={styles.headLabel}>OT/PIB</td>
                          <td className={styles.right}>{(earningSummary.otPib ?? totals.grandOtPib ?? 0).toLocaleString('en-IN')}</td>
                          <td className={styles.headLabel}>LWF</td>
                          <td className={styles.right}>{(deductionSummary.lwf ?? totals.grandLwf ?? 0).toLocaleString('en-IN')}</td>
                        </tr>
                        <tr>
                          <td className={styles.headLabel}>—</td>
                          <td className={styles.right}>—</td>
                          <td className={styles.headLabel}>Oth.Ded</td>
                          <td className={styles.right}>{(deductionSummary.othDed ?? totals.grandOthDed ?? 0).toLocaleString('en-IN')}</td>
                        </tr>
                        <tr>
                          <td className={styles.headLabel}>—</td>
                          <td className={styles.right}>—</td>
                          <td className={styles.headLabel}>Food</td>
                          <td className={styles.right}>{(deductionSummary.food ?? totals.grandFood ?? 0).toLocaleString('en-IN')}</td>
                        </tr>
                        <tr>
                          <td className={styles.headLabel}>—</td>
                          <td className={styles.right}>—</td>
                          <td className={styles.headLabel}>E/Mbill</td>
                          <td className={styles.right}>{(deductionSummary.eMbill ?? totals.grandEMbill ?? 0).toLocaleString('en-IN')}</td>
                        </tr>
                        <tr className={styles.subTotalRow}>
                          <td><strong>Gross Salary</strong></td>
                          <td className={styles.right}>
                            <strong>₹{(earningSummary.grossSalary ?? totals.grandGross ?? 0).toLocaleString('en-IN')}</strong>
                          </td>
                          <td><strong>Gross Ded.</strong></td>
                          <td className={styles.right}>
                            <strong>₹{(deductionSummary.grossDed ?? totals.grandDeductions ?? 0).toLocaleString('en-IN')}</strong>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Net Pay Highlight Box */}
                {selectedOptions.showNetPayHighlight !== false && (
                  <div className={styles.netPayHighlightBox}>
                    <div className={styles.netPayHighlightText}>
                      <span className={styles.netPayHighlightLabel}>TOTAL NET SALARY DISBURSED</span>
                      <div className={styles.netPayWords}>
                        ({numberToIndianWords(totals.grandNet ?? 0)})
                      </div>
                    </div>
                    <div className={styles.netPayHighlightValue}>
                      ₹{(totals.grandNet ?? 0).toLocaleString('en-IN')}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Three-Column Statutory Signatory Verification Block */}
            {selectedOptions.showSignatures !== false && (
              <div className={styles.summarySignSection}>
                <div className={styles.signatoryCard}>
                  <div className={styles.signatoryRole}>PREPARED BY</div>
                  <div className={styles.signatoryPlaceholder}></div>
                  <div className={styles.signatoryTitle}>HR / Payroll Executive</div>
                </div>
                <div className={styles.signatoryCard}>
                  <div className={styles.signatoryRole}>CHECKED &amp; VERIFIED BY</div>
                  <div className={styles.signatoryPlaceholder}></div>
                  <div className={styles.signatoryTitle}>Finance &amp; Accounts Officer</div>
                </div>
                <div className={styles.signatoryCard}>
                  <div className={styles.signatoryRole}>FOR {companyName.toUpperCase()}</div>
                  <div className={styles.signatoryPlaceholder}></div>
                  <div className={styles.signatoryTitle}>Authorised Signatory</div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
