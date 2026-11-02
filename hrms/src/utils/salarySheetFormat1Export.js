import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

// Helper to filter records by selectedOptions (recordScope and excludeHoldSalary)
export function filterRecordsByOptions(records = [], selectedOptions = {}) {
  let list = Array.isArray(records) ? [...records] : [];
  const scope = selectedOptions.recordScope || 'active';
  const excludeHold = selectedOptions.excludeHoldSalary !== false;

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
}

// Helper to calculate dynamic totals from filtered records
export function calculateDynamicTotals(records = [], originalTotals = {}) {
  let totalWo = 0, totalPh = 0, totalPd = 0, totalPl = 0, totalCl = 0, totalSl = 0, totalMlAdj = 0;
  let grandBasic = 0, grandDa = 0, grandHra = 0, grandConv = 0, grandSpAll = 0, grandOthAll = 0, grandOtPib = 0;
  let grandGross = 0, grandPf = 0, grandEsi = 0, grandPt = 0, grandIt = 0, grandLwf = 0;
  let grandAdvance = 0, grandLoan = 0, grandFood = 0, grandOthDed = 0, grandEMbill = 0;
  let grandDeductions = 0, grandNet = 0, totalRateTotal = 0;

  records.forEach((r) => {
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
    ...originalTotals,
    totalWo, totalPh, totalPd, totalPl, totalCl, totalSl, totalMlAdj,
    totalRateTotal,
    grandBasic, grandDa, grandHra, grandConv, grandSpAll, grandOthAll, grandOtPib,
    grandGross, grandPf, grandEsi, grandPt, grandIt, grandLwf,
    grandAdvance, grandLoan, grandFood, grandOthDed, grandEMbill,
    grandDeductions, grandNet,
  };
}

/**
 * Downloads Salary Sheet (Format 1) as Excel Spreadsheet (.xlsx) or CSV (.csv)
 * Strictly formats columns, rows and summaries as per selectedOptions
 */
export const downloadSalarySheetFormat1Excel = (
  records = [],
  companyInfo = {},
  period = {},
  totals = {},
  pfSummary = {},
  esiSummary = {},
  ptSummary = {},
  earningSummary = {},
  deductionSummary = {},
  options = {}
) => {
  const selectedOptions = options?.selectedOptions || {};
  const activeRecords = filterRecordsByOptions(records, selectedOptions);
  const activeTotals = calculateDynamicTotals(activeRecords, totals);

  const statutoryConfig = options.statutoryConfig || {};
  const activePfRate = Array.isArray(statutoryConfig?.pf?.pfRates) ? statutoryConfig.pf.pfRates.find(r => r.enabled) : null;
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

  const activeEsiRate = Array.isArray(statutoryConfig?.esi?.esiRates) ? statutoryConfig.esi.esiRates.find(r => r.enabled) : null;
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

  const companyName = companyInfo?.name || companyInfo?.companyName || '';
  const companyAddress = companyInfo?.address && companyInfo.address !== '—' ? companyInfo.address : '';
  const pfNo = companyInfo?.employerPfCode || companyInfo?.pfCode || companyInfo?.pfNo || '—';
  const esiNo = companyInfo?.employerEsiCode || companyInfo?.esiCode || companyInfo?.esiNo || '—';
  const monthLabel = period?.monthLabel || period?.month || 'Current Month';
  const toDate = period?.toDate || new Date().toISOString().slice(0, 10);

  const aoa = [
    // Statutory Rules
    ['', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '(1) Form under Rule - 6 of Equal Remuneration Rules 1976.'],
    ['', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '(2) Form under Rule - 21(4),25(2),26(1) and 26(2) of Gujarat Minimum Wages Rules 1961'],
    ['', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '(3) Form under Rule - 6 of Payment of Wages Gujarat Rules, 1963.'],
    ['', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '(4) Form 17 under Rule - 78 of Contract Labour (Regulation & Abolition) Gujarat, Rules 1972'],
    ['', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '(5) Form under Rule - 52(2) of Inter State Migrant Workers (Gujarat) Rules 1981'],
    [''],
    // Company Header
    [companyName],
    [companyAddress],
    [`PF No :- ${pfNo}`, '', `Date of Payment :- ${toDate}`, '', '', 'Wage/Salary Register', '', '', '', '', '', '', '', '', '', `For The Month Of  ${monthLabel}`],
    [`ESI No :- ${esiNo}`],
    [''],
    // Table Headers
    [
      'Sr. No.',
      'Employee Details',
      'Emp. ID',
      'Details of Attendance',
      'Rate of Wages',
      'Earnings - BASIC / DA',
      'Earnings - HRA / OTH.All',
      'Earnings - CONV',
      'Earnings - SP.All / OT/PIB',
      'Gross Salary',
      `Deduction - P.F (${pfEmployeeRate}%) / ESI (${esiEmployeeRate}%)`,
      'Deduction - P.T. / I.T. / LWF',
      'Deduction - Advance / Loan / Food',
      'Deduction - Oth.Ded / E/Mbill',
      'Gross Deduct.',
      'Net Payable',
      'Signature / Bank Details'
    ]
  ];

  // Records
  activeRecords.forEach((row, idx) => {
    const att = row.attendance || {};
    const rate = row.rateOfWages || {};
    const earn = row.earnings || {};
    const ded = row.deductions || {};

    const empLines = [];
    if (selectedOptions.name !== false && row.name) empLines.push(row.name);
    if (selectedOptions.designation !== false && row.designation) empLines.push(row.designation);
    if (selectedOptions.department !== false && row.department) empLines.push(row.department);
    if (selectedOptions.fatherHusbandName !== false && (row.fatherHusbandName || row.fatherName)) empLines.push(`F/H: ${row.fatherHusbandName || row.fatherName}`);
    if (selectedOptions.site !== false && (row.site || row.siteLocation || row.clientName)) empLines.push(`Site: ${row.site || row.siteLocation || row.clientName}`);
    if (selectedOptions.dutyPost && row.dutyPost) empLines.push(`Post: ${row.dutyPost}`);
    if (selectedOptions.joiningDate && row.joiningDate) empLines.push(`DOJ: ${row.joiningDate}`);
    if (selectedOptions.gender && row.gender) empLines.push(`Sex: ${row.gender}`);
    if (selectedOptions.uan !== false && row.uan) empLines.push(`UAN No:${row.uan}`);
    if (selectedOptions.pfNo !== false && row.pfNo) empLines.push(`PF.No ${row.pfNo}`);
    if (selectedOptions.esiNo !== false && row.esiNo) empLines.push(`ESI No:${row.esiNo}`);
    if (selectedOptions.pan && row.pan) empLines.push(`PAN: ${row.pan}`);
    if (selectedOptions.aadhaar && row.aadhaar) empLines.push(`Aadhaar: ${row.aadhaar}`);
    const empInfoText = empLines.join('\n');

    const attLines = [];
    if (selectedOptions.attWd !== false) attLines.push(`WD: ${att.wd || '0.00'}`);
    if (selectedOptions.attWo !== false) attLines.push(`WO: ${att.wo || '0.00'}`);
    if (selectedOptions.attPh !== false) attLines.push(`PH: ${att.ph || '0.00'}`);
    if (selectedOptions.attPd !== false) attLines.push(`PD: ${att.pd || '0.00'}`);
    if (selectedOptions.attPl !== false) attLines.push(`PL: ${att.pl || '0.00'}`);
    if (selectedOptions.attCl !== false) attLines.push(`CL: ${att.cl || '0.00'}`);
    if (selectedOptions.attSl !== false) attLines.push(`SL: ${att.sl || '0.00'}`);
    if (selectedOptions.attMlAdj !== false && (att.mlAdj || selectedOptions.attMlAdj === true)) attLines.push(`ML/Adj: ${att.mlAdj || '0.00'}`);
    if (selectedOptions.attTot !== false) attLines.push(`TOT: ${att.tot || '0.00'}`);
    const attText = attLines.join('\n');

    const rateLines = [];
    if (selectedOptions.rateBasic !== false) rateLines.push(`BASIC: ${rate.basic || 0}`);
    if (selectedOptions.rateDa !== false) rateLines.push(`DA: ${rate.da || 0}`);
    if (selectedOptions.rateHra !== false) rateLines.push(`HRA: ${rate.hra || 0}`);
    if (selectedOptions.rateConv !== false) rateLines.push(`CONV: ${rate.conv || 0}`);
    if (selectedOptions.rateSpAll !== false) rateLines.push(`SP.All: ${rate.spAll || 0}`);
    if (selectedOptions.rateOthAll !== false) rateLines.push(`OTH.All: ${rate.othAll || 0}`);
    if (selectedOptions.rateTotal !== false) rateLines.push(`Total: ${rate.total || 0}`);
    const rateText = rateLines.join('\n');

    const grossLines = [];
    if (selectedOptions.grossSalary !== false) grossLines.push(String(row.grossSalary || 0));
    if (selectedOptions.pfWage !== false && row.pfWage > 0) grossLines.push(`P ${row.pfWage}`);
    if (selectedOptions.esiWage !== false && row.esiWage > 0) grossLines.push(`E ${row.esiWage}`);
    const grossText = grossLines.join('\n') || '—';

    const bankLines = [];
    if (selectedOptions.bankName !== false && row.bankName) bankLines.push(row.bankName);
    if (selectedOptions.bankAccountNo !== false && row.bankAccountNo) bankLines.push(row.bankAccountNo);
    if (selectedOptions.ifsc && row.ifsc) bankLines.push(`IFSC: ${row.ifsc}`);
    if (selectedOptions.paymentMode && row.paymentMode) bankLines.push(`Mode: ${row.paymentMode}`);
    if (selectedOptions.signature !== false) bankLines.push('Sign: ________');
    const bankText = bankLines.length ? `Bank\n${bankLines.join('\n')}` : '—';

    const earnBasicDa = `${selectedOptions.earnBasic !== false ? (earn.basic || 0) : '—'}\n${selectedOptions.earnDa !== false ? (earn.da || 0) : '—'}`;
    const earnHraOth = `${selectedOptions.earnHra !== false ? (earn.hra || 0) : '—'}\n${selectedOptions.earnOthAll !== false ? (earn.othAll || 0) : '—'}`;
    const earnConvVal = `${selectedOptions.earnConv !== false ? (earn.conv || 0) : '—'}`;
    const earnSpOt = `${selectedOptions.earnSpAll !== false ? (earn.spAll || 0) : '—'}\n${selectedOptions.earnOtPib !== false ? (earn.otPib || 0) : '—'}`;

    const dedPfEsi = `${selectedOptions.dedPf !== false ? (ded.pf || 0) : '—'}\n${selectedOptions.dedEsi !== false ? (ded.esi || 0) : '—'}`;
    const dedPtItLwf = `${selectedOptions.dedPt !== false ? (ded.pt || 0) : '—'}\n${selectedOptions.dedIt !== false ? (ded.it || 0) : '—'}\n${selectedOptions.dedLwf !== false ? (ded.lwf || 0) : '—'}`;
    const dedAdvLoanFood = `${selectedOptions.dedAdvance !== false ? (ded.advance || 0) : '—'}\n${selectedOptions.dedLoan !== false ? (ded.loan || 0) : '—'}\n${selectedOptions.dedFood !== false ? (ded.food || 0) : '—'}`;
    const dedOthEM = `${selectedOptions.dedOthDed !== false ? (ded.othDed || 0) : '—'}\n${selectedOptions.dedEMbill !== false ? (ded.eMbill || 0) : '—'}`;

    aoa.push([
      selectedOptions.srNo !== false ? (row.srNo || idx + 1) : '—',
      empInfoText,
      selectedOptions.employeeId !== false ? (row.employeeId || '') : '—',
      attText,
      rateText,
      earnBasicDa,
      earnHraOth,
      earnConvVal,
      earnSpOt,
      grossText,
      dedPfEsi,
      dedPtItLwf,
      dedAdvLoanFood,
      dedOthEM,
      selectedOptions.grossDeduct !== false ? (row.grossDeduct || 0) : '—',
      selectedOptions.netPayable !== false ? (row.netPayable || 0) : '—',
      bankText
    ]);
  });

  // Grand Total Row
  if (activeRecords.length > 0) {
    const attTotalLines = [];
    if (selectedOptions.attWo !== false) attTotalLines.push(`Total WO: ${(activeTotals.totalWo || 0).toFixed(2)}`);
    if (selectedOptions.attPh !== false) attTotalLines.push(`Total PH: ${(activeTotals.totalPh || 0).toFixed(2)}`);
    if (selectedOptions.attPd !== false) attTotalLines.push(`Total PD: ${(activeTotals.totalPd || 0).toFixed(2)}`);
    if (selectedOptions.attPl !== false) attTotalLines.push(`Total PL: ${(activeTotals.totalPl || 0).toFixed(2)}`);
    if (selectedOptions.attCl !== false) attTotalLines.push(`Total CL: ${(activeTotals.totalCl || 0).toFixed(2)}`);
    if (selectedOptions.attSl !== false) attTotalLines.push(`Total SL: ${(activeTotals.totalSl || 0).toFixed(2)}`);
    if (selectedOptions.attMlAdj !== false && (activeTotals.totalMlAdj || selectedOptions.attMlAdj === true)) attTotalLines.push(`ML/Adj: ${(activeTotals.totalMlAdj || 0).toFixed(2)}`);

    aoa.push([
      'Grand Total',
      '',
      '',
      attTotalLines.join('\n'),
      selectedOptions.rateTotal !== false ? (activeTotals.totalRateTotal || '') : '',
      `${selectedOptions.earnBasic !== false ? (activeTotals.grandBasic || 0) : '—'}\n${selectedOptions.earnDa !== false ? (activeTotals.grandDa || 0) : '—'}`,
      `${selectedOptions.earnHra !== false ? (activeTotals.grandHra || 0) : '—'}\n${selectedOptions.earnOthAll !== false ? (activeTotals.grandOthAll || 0) : '—'}`,
      selectedOptions.earnConv !== false ? (activeTotals.grandConv || 0) : '—',
      `${selectedOptions.earnSpAll !== false ? (activeTotals.grandSpAll || 0) : '—'}\n${selectedOptions.earnOtPib !== false ? (activeTotals.grandOtPib || 0) : '—'}`,
      selectedOptions.grossSalary !== false ? (activeTotals.grandGross || 0) : '—',
      `${selectedOptions.dedPf !== false ? (activeTotals.grandPf || 0) : '—'}\n${selectedOptions.dedEsi !== false ? (activeTotals.grandEsi || 0) : '—'}`,
      `${selectedOptions.dedPt !== false ? (activeTotals.grandPt || 0) : '—'}\n${selectedOptions.dedIt !== false ? (activeTotals.grandIt || 0) : '—'}\n${selectedOptions.dedLwf !== false ? (activeTotals.grandLwf || 0) : '—'}`,
      `${selectedOptions.dedAdvance !== false ? (activeTotals.grandAdvance || 0) : '—'}\n${selectedOptions.dedLoan !== false ? (activeTotals.grandLoan || 0) : '—'}\n${selectedOptions.dedFood !== false ? (activeTotals.grandFood || 0) : '—'}`,
      `${selectedOptions.dedOthDed !== false ? (activeTotals.grandOthDed || 0) : '—'}\n${selectedOptions.dedEMbill !== false ? (activeTotals.grandEMbill || 0) : '—'}`,
      selectedOptions.grossDeduct !== false ? (activeTotals.grandDeductions || 0) : '—',
      selectedOptions.netPayable !== false ? (activeTotals.grandNet || 0) : '—',
      `For ${companyName}`
    ]);
  }

  // Summary sections (Page 2) as per selectedOptions
  if (selectedOptions.showPfSummary !== false || selectedOptions.showEsiSummary !== false || selectedOptions.showPtSummary !== false || selectedOptions.showEarningDeductionStatement !== false) {
    aoa.push(['']);
    aoa.push(['']);
    aoa.push(['STATUTORY SUMMARIES']);

    if (selectedOptions.showPfSummary !== false) {
      aoa.push(['PF SUMMARY']);
      aoa.push(['PF Wages', 'Strn.', 'EE', 'ER (Diff)', 'A/C - 1', 'A/C 10', 'A/C 2', 'A/C - 21', 'A/C - 22']);
      aoa.push([
        pfSummary.pfWages || 0,
        pfSummary.strn || 0,
        pfSummary.ee || 0,
        pfSummary.erDiff || 0,
        pfSummary.ac1 || 0,
        pfSummary.ac10 || 0,
        pfSummary.ac2 || 0,
        pfSummary.ac21 || 0,
        pfSummary.ac22 || 0
      ]);
    }

    if (selectedOptions.showEsiSummary !== false) {
      aoa.push(['ESI SUMMARY']);
      aoa.push(['ESI Wages', 'Strn', 'EE Share', 'ER.Share', 'Total ESI']);
      aoa.push([
        esiSummary.esiWages || 0,
        esiSummary.strn || 0,
        esiSummary.eeShare || 0,
        esiSummary.erShare || 0,
        esiSummary.total || 0
      ]);
    }

    if (selectedOptions.showPtSummary !== false) {
      aoa.push(['P.T. SUMMARY']);
      aoa.push(['PT Amount', 'PT Count']);
      aoa.push([ptSummary.amount || 0, ptSummary.count || 0]);
    }

    if (selectedOptions.showEarningDeductionStatement !== false) {
      aoa.push(['CONSOLIDATED STATEMENT']);
      aoa.push(['Component', 'Earnings (INR)', 'Deductions (INR)']);
      aoa.push(['Basic / PF', earningSummary.basic || activeTotals.grandBasic || 0, deductionSummary.pf || activeTotals.grandPf || 0]);
      aoa.push(['DA / ESI', earningSummary.da || activeTotals.grandDa || 0, deductionSummary.esi || activeTotals.grandEsi || 0]);
      aoa.push(['HRA / PT', earningSummary.hra || activeTotals.grandHra || 0, deductionSummary.pt || activeTotals.grandPt || 0]);
      aoa.push(['Gross / Gross Deductions', activeTotals.grandGross || 0, activeTotals.grandDeductions || 0]);
      aoa.push(['Net Payable Salary', activeTotals.grandNet || 0, '']);
    }
  }

  const ws = XLSX.utils.aoa_to_sheet(aoa);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Wage Salary Register');

  const fileName = `Salary_Sheet_Format_1_${String(monthLabel).replace(/\s+/g, '_')}.${options.format === 'csv' ? 'csv' : 'xlsx'}`;

  if (options.format === 'csv') {
    const csvContent = XLSX.utils.sheet_to_csv(ws);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } else {
    XLSX.writeFile(wb, fileName);
  }
};

export const downloadSalarySheetFormat1Csv = (records, companyInfo, period, totals, pfSummary, esiSummary, ptSummary, earningSummary, deductionSummary, options = {}) => {
  return downloadSalarySheetFormat1Excel(records, companyInfo, period, totals, pfSummary, esiSummary, ptSummary, earningSummary, deductionSummary, { ...options, format: 'csv' });
};

/**
 * Downloads Salary Sheet (Format 1) as Official Multi-Page PDF
 * Strictly respects selectedOptions for all columns, details, attendance, rates, earnings, deductions, and Page 2 summaries
 */
export const downloadSalarySheetFormat1Pdf = async (
  records = [],
  companyInfo = {},
  period = {},
  totals = {},
  pfSummary = {},
  esiSummary = {},
  ptSummary = {},
  earningSummary = {},
  deductionSummary = {},
  options = {}
) => {
  const selectedOptions = options?.selectedOptions || {};
  const activeRecords = filterRecordsByOptions(records, selectedOptions);
  const activeTotals = calculateDynamicTotals(activeRecords, totals);

  const statutoryConfig = options.statutoryConfig || {};
  const activePfRate = Array.isArray(statutoryConfig?.pf?.pfRates) ? statutoryConfig.pf.pfRates.find(r => r.enabled) : null;
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

  const activeEsiRate = Array.isArray(statutoryConfig?.esi?.esiRates) ? statutoryConfig.esi.esiRates.find(r => r.enabled) : null;
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

  const companyName = companyInfo?.name || companyInfo?.companyName || '';
  const companyAddress = companyInfo?.address && companyInfo.address !== '—' ? companyInfo.address : '';
  const pfNo = companyInfo?.employerPfCode || companyInfo?.pfCode || companyInfo?.pfNo || '—';
  const esiNo = companyInfo?.employerEsiCode || companyInfo?.esiCode || companyInfo?.esiNo || '—';
  const monthLabel = period?.monthLabel || period?.month || 'Current Month';
  const toDate = period?.toDate || new Date().toISOString().slice(0, 10);

  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'pt',
    format: 'a3',
  });

  // Top Right Statutory Rules
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(40, 40, 40);
  const rules = [
    '(1) Form under Rule - 6 of Equal Remuneration Rules 1976.',
    '(2) Form under Rule - 21(4),25(2),26(1) and 26(2) of Gujarat Minimum Wages Rules 1961',
    '(3) Form under Rule - 6 of Payment of Wages Gujarat Rules, 1963.',
    '(4) Form 17 under Rule - 78 of Contract Labour (Regulation & Abolition) Gujarat, Rules 1972',
    '(5) Form under Rule - 52(2) of Inter State Migrant Workers (Gujarat) Rules 1981',
  ];
  let ruleY = 24;
  rules.forEach((r) => {
    doc.text(r, 1150, ruleY, { align: 'right' });
    ruleY += 10;
  });

  // Company Info Header
  doc.setFontSize(15);
  doc.setFont('helvetica', 'bold');
  doc.text(companyName, 30, 30);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(companyAddress, 30, 43);

  // Sub Header
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text(`PF No :- ${pfNo}`, 30, 60);
  doc.text(`ESI No :- ${esiNo}`, 30, 72);
  doc.text(`Date of Payment :- ${toDate}`, 160, 60);

  doc.setFontSize(14);
  doc.text('Wage/Salary Register', 590, 66, { align: 'center' });

  doc.setFontSize(11);
  doc.text(`For The Month Of  ${monthLabel}`, 1150, 66, { align: 'right' });

  // Main Multi-Tier Table
  const tableHead = [
    [
      { content: 'Sr.\nNo.', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
      { content: 'Employee Name\nDesignation\nDepartment', rowSpan: 2, styles: { halign: 'left', valign: 'middle' } },
      { content: 'Emp. ID', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
      { content: 'Details\nof\nAttendance', rowSpan: 2, styles: { halign: 'left', valign: 'middle' } },
      { content: 'Rate of\nWages', rowSpan: 2, styles: { halign: 'left', valign: 'middle' } },
      { content: 'Earnings', colSpan: 4, styles: { halign: 'center', fillColor: [240, 240, 240] } },
      { content: 'Gross\nSalary', rowSpan: 2, styles: { halign: 'right', valign: 'middle' } },
      { content: 'Deduction', colSpan: 4, styles: { halign: 'center', fillColor: [240, 240, 240] } },
      { content: 'Gross\nDeduct.', rowSpan: 2, styles: { halign: 'right', valign: 'middle' } },
      { content: 'Net\nPayable', rowSpan: 2, styles: { halign: 'right', valign: 'middle' } },
      { content: 'Signature', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
    ],
    [
      { content: 'BASIC\nDA', styles: { halign: 'right' } },
      { content: 'HRA\nOTH.All', styles: { halign: 'right' } },
      { content: 'CONV', styles: { halign: 'right' } },
      { content: 'SP.All\nOT/PIB', styles: { halign: 'right' } },
      { content: `P.F (${pfEmployeeRate}%)\nESI (${esiEmployeeRate}%)`, styles: { halign: 'right' } },
      { content: 'P.T.\nI.T. / LWF', styles: { halign: 'right' } },
      { content: 'Advance\nLoan / Food', styles: { halign: 'right' } },
      { content: 'Oth.Ded\nE/Mbill', styles: { halign: 'right' } },
    ],
  ];

  const tableBody = activeRecords.map((row, idx) => {
    const att = row.attendance || {};
    const rate = row.rateOfWages || {};
    const earn = row.earnings || {};
    const ded = row.deductions || {};

    const empLines = [];
    if (selectedOptions.name !== false && row.name) empLines.push(row.name);
    if (selectedOptions.designation !== false && row.designation) empLines.push(row.designation);
    if (selectedOptions.department !== false && row.department) empLines.push(row.department);
    if (selectedOptions.fatherHusbandName !== false && (row.fatherHusbandName || row.fatherName)) empLines.push(`F/H: ${row.fatherHusbandName || row.fatherName}`);
    if (selectedOptions.site !== false && (row.site || row.siteLocation || row.clientName)) empLines.push(`Site: ${row.site || row.siteLocation || row.clientName}`);
    if (selectedOptions.dutyPost && row.dutyPost) empLines.push(`Post: ${row.dutyPost}`);
    if (selectedOptions.joiningDate && row.joiningDate) empLines.push(`DOJ: ${row.joiningDate}`);
    if (selectedOptions.gender && row.gender) empLines.push(`Sex: ${row.gender}`);
    if (selectedOptions.uan !== false && row.uan) empLines.push(`UAN No:${row.uan}`);
    if (selectedOptions.pfNo !== false && row.pfNo) empLines.push(`PF.No ${row.pfNo}`);
    if (selectedOptions.esiNo !== false && row.esiNo) empLines.push(`ESI No:${row.esiNo}`);
    if (selectedOptions.pan && row.pan) empLines.push(`PAN: ${row.pan}`);
    if (selectedOptions.aadhaar && row.aadhaar) empLines.push(`Aadhaar: ${row.aadhaar}`);
    const empText = empLines.join('\n');

    const attLines = [];
    if (selectedOptions.attWd !== false) attLines.push(`WD ${att.wd || '0.00'}`);
    if (selectedOptions.attWo !== false) attLines.push(`WO ${att.wo || '0.00'}`);
    if (selectedOptions.attPh !== false) attLines.push(`PH ${att.ph || '0.00'}`);
    if (selectedOptions.attPd !== false) attLines.push(`PD ${att.pd || '0.00'}`);
    if (selectedOptions.attPl !== false) attLines.push(`PL ${att.pl || '0.00'}`);
    if (selectedOptions.attCl !== false) attLines.push(`CL ${att.cl || '0.00'}`);
    if (selectedOptions.attSl !== false) attLines.push(`SL ${att.sl || '0.00'}`);
    if (selectedOptions.attMlAdj !== false && (att.mlAdj || selectedOptions.attMlAdj === true)) attLines.push(`ML/Adj ${att.mlAdj || '0.00'}`);
    if (selectedOptions.attTot !== false) attLines.push(`TOT ${att.tot || '0.00'}`);
    const attText = attLines.join('\n');

    const rateLines = [];
    if (selectedOptions.rateBasic !== false) rateLines.push(`BASIC ${rate.basic || 0}`);
    if (selectedOptions.rateDa !== false) rateLines.push(`DA ${rate.da || 0}`);
    if (selectedOptions.rateHra !== false) rateLines.push(`HRA ${rate.hra || 0}`);
    if (selectedOptions.rateConv !== false) rateLines.push(`CONV ${rate.conv || 0}`);
    if (selectedOptions.rateSpAll !== false) rateLines.push(`SP.All ${rate.spAll || 0}`);
    if (selectedOptions.rateOthAll !== false) rateLines.push(`OTH.All ${rate.othAll || 0}`);
    if (selectedOptions.rateTotal !== false) rateLines.push(`Total ${rate.total || 0}`);
    const rateText = rateLines.join('\n');

    const grossLines = [];
    if (selectedOptions.grossSalary !== false) grossLines.push((row.grossSalary || 0).toLocaleString('en-IN'));
    if (selectedOptions.pfWage !== false && row.pfWage > 0) grossLines.push(`P ${(row.pfWage || 0).toLocaleString('en-IN')}`);
    if (selectedOptions.esiWage !== false && row.esiWage > 0) grossLines.push(`E ${(row.esiWage || 0).toLocaleString('en-IN')}`);
    const grossText = grossLines.join('\n') || '—';

    const bankLines = [];
    if (selectedOptions.bankName !== false && row.bankName) bankLines.push(row.bankName);
    if (selectedOptions.bankAccountNo !== false && row.bankAccountNo) bankLines.push(row.bankAccountNo);
    if (selectedOptions.ifsc && row.ifsc) bankLines.push(`IFSC: ${row.ifsc}`);
    if (selectedOptions.paymentMode && row.paymentMode) bankLines.push(`Mode: ${row.paymentMode}`);
    if (selectedOptions.signature !== false) bankLines.push('Sign: ________');
    const signText = bankLines.length ? `Bank\n${bankLines.join('\n')}` : '—';

    return [
      selectedOptions.srNo !== false ? (row.srNo || idx + 1) : '—',
      empText,
      selectedOptions.employeeId !== false ? (row.employeeId || '') : '—',
      attText,
      rateText,
      `${selectedOptions.earnBasic !== false ? (earn.basic || 0) : '—'}\n${selectedOptions.earnDa !== false ? (earn.da || 0) : '—'}`,
      `${selectedOptions.earnHra !== false ? (earn.hra || 0) : '—'}\n${selectedOptions.earnOthAll !== false ? (earn.othAll || 0) : '—'}`,
      selectedOptions.earnConv !== false ? (earn.conv || 0) : '—',
      `${selectedOptions.earnSpAll !== false ? (earn.spAll || 0) : '—'}\n${selectedOptions.earnOtPib !== false ? (earn.otPib || 0) : '—'}`,
      grossText,
      `${selectedOptions.dedPf !== false ? (ded.pf || 0) : '—'}\n${selectedOptions.dedEsi !== false ? (ded.esi || 0) : '—'}`,
      `${selectedOptions.dedPt !== false ? (ded.pt || 0) : '—'}\n${selectedOptions.dedIt !== false ? (ded.it || 0) : '—'}\n${selectedOptions.dedLwf !== false ? (ded.lwf || 0) : '—'}`,
      `${selectedOptions.dedAdvance !== false ? (ded.advance || 0) : '—'}\n${selectedOptions.dedLoan !== false ? (ded.loan || 0) : '—'}\n${selectedOptions.dedFood !== false ? (ded.food || 0) : '—'}`,
      `${selectedOptions.dedOthDed !== false ? (ded.othDed || 0) : '—'}\n${selectedOptions.dedEMbill !== false ? (ded.eMbill || 0) : '—'}`,
      selectedOptions.grossDeduct !== false ? (row.grossDeduct || 0).toLocaleString('en-IN') : '—',
      selectedOptions.netPayable !== false ? (row.netPayable || 0).toLocaleString('en-IN') : '—',
      signText,
    ];
  });

  // Grand Total Row
  if (activeRecords.length > 0) {
    const attTotalLines = [];
    if (selectedOptions.attWo !== false) attTotalLines.push(`Total WO ${(activeTotals.totalWo || 0).toFixed(2)}`);
    if (selectedOptions.attPh !== false) attTotalLines.push(`Total PH ${(activeTotals.totalPh || 0).toFixed(2)}`);
    if (selectedOptions.attPd !== false) attTotalLines.push(`Total PD ${(activeTotals.totalPd || 0).toFixed(2)}`);
    if (selectedOptions.attPl !== false) attTotalLines.push(`Total PL ${(activeTotals.totalPl || 0).toFixed(2)}`);
    if (selectedOptions.attCl !== false) attTotalLines.push(`Total CL ${(activeTotals.totalCl || 0).toFixed(2)}`);
    if (selectedOptions.attSl !== false) attTotalLines.push(`Total SL ${(activeTotals.totalSl || 0).toFixed(2)}`);
    if (selectedOptions.attMlAdj !== false && (activeTotals.totalMlAdj || selectedOptions.attMlAdj === true)) attTotalLines.push(`ML/Adj ${(activeTotals.totalMlAdj || 0).toFixed(2)}`);

    tableBody.push([
      { content: 'Grand Total', colSpan: 3, styles: { halign: 'center', fontStyle: 'bold' } },
      { content: attTotalLines.join('\n'), styles: { fontStyle: 'bold' } },
      { content: selectedOptions.rateTotal !== false ? String(activeTotals.totalRateTotal || '') : '', styles: { fontStyle: 'bold' } },
      { content: `${selectedOptions.earnBasic !== false ? (activeTotals.grandBasic || 0) : '—'}\n${selectedOptions.earnDa !== false ? (activeTotals.grandDa || 0) : '—'}`, styles: { halign: 'right', fontStyle: 'bold' } },
      { content: `${selectedOptions.earnHra !== false ? (activeTotals.grandHra || 0) : '—'}\n${selectedOptions.earnOthAll !== false ? (activeTotals.grandOthAll || 0) : '—'}`, styles: { halign: 'right', fontStyle: 'bold' } },
      { content: selectedOptions.earnConv !== false ? String(activeTotals.grandConv || 0) : '—', styles: { halign: 'right', fontStyle: 'bold' } },
      { content: `${selectedOptions.earnSpAll !== false ? (activeTotals.grandSpAll || 0) : '—'}\n${selectedOptions.earnOtPib !== false ? (activeTotals.grandOtPib || 0) : '—'}`, styles: { halign: 'right', fontStyle: 'bold' } },
      { content: selectedOptions.grossSalary !== false ? (activeTotals.grandGross || 0).toLocaleString('en-IN') : '—', styles: { halign: 'right', fontStyle: 'bold' } },
      { content: `${selectedOptions.dedPf !== false ? (activeTotals.grandPf || 0) : '—'}\n${selectedOptions.dedEsi !== false ? (activeTotals.grandEsi || 0) : '—'}`, styles: { halign: 'right', fontStyle: 'bold' } },
      { content: `${selectedOptions.dedPt !== false ? (activeTotals.grandPt || 0) : '—'}\n${selectedOptions.dedIt !== false ? (activeTotals.grandIt || 0) : '—'}\n${selectedOptions.dedLwf !== false ? (activeTotals.grandLwf || 0) : '—'}`, styles: { halign: 'right', fontStyle: 'bold' } },
      { content: `${selectedOptions.dedAdvance !== false ? (activeTotals.grandAdvance || 0) : '—'}\n${selectedOptions.dedLoan !== false ? (activeTotals.grandLoan || 0) : '—'}\n${selectedOptions.dedFood !== false ? (activeTotals.grandFood || 0) : '—'}`, styles: { halign: 'right', fontStyle: 'bold' } },
      { content: `${selectedOptions.dedOthDed !== false ? (activeTotals.grandOthDed || 0) : '—'}\n${selectedOptions.dedEMbill !== false ? (activeTotals.grandEMbill || 0) : '—'}`, styles: { halign: 'right', fontStyle: 'bold' } },
      { content: selectedOptions.grossDeduct !== false ? (activeTotals.grandDeductions || 0).toLocaleString('en-IN') : '—', styles: { halign: 'right', fontStyle: 'bold' } },
      { content: selectedOptions.netPayable !== false ? (activeTotals.grandNet || 0).toLocaleString('en-IN') : '—', styles: { halign: 'right', fontStyle: 'bold' } },
      { content: `For ${companyName}`, styles: { halign: 'center', fontStyle: 'bold' } },
    ]);
  }

  autoTable(doc, {
    startY: 85,
    head: tableHead,
    body: tableBody,
    theme: 'grid',
    styles: {
      fontSize: 8,
      cellPadding: 3,
      textColor: [0, 0, 0],
      lineColor: [0, 0, 0],
      lineWidth: 0.5,
      overflow: 'linebreak',
    },
    headStyles: {
      fillColor: [255, 255, 255],
      textColor: [0, 0, 0],
      fontStyle: 'bold',
      lineColor: [0, 0, 0],
      lineWidth: 0.5,
    },
  });

  // Page 2 Summarization Sheet
  const hasPage2Selected =
    selectedOptions.showPfSummary !== false ||
    selectedOptions.showEsiSummary !== false ||
    selectedOptions.showPtSummary !== false ||
    selectedOptions.showWorkforceStrength !== false ||
    selectedOptions.showEarningDeductionStatement !== false ||
    selectedOptions.showNetPayHighlight !== false ||
    selectedOptions.showSignatures !== false;

  if (hasPage2Selected) {
    doc.addPage();

    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(companyName, 30, 40);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(companyAddress, 30, 54);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`Wage/Salary Register Summarization - ${monthLabel}`, 30, 72);

    let currentY = 90;

    // 1. PF Summary Statement
    if (selectedOptions.showPfSummary !== false) {
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('PF SUMMARY STATEMENT', 30, currentY);
      currentY += 8;

      const pfSummaryHead = [
        ['PF Wages', 'Subscribers', `Employee (${pfEmployeeRate}%)`, `Employer (Diff ${pfEmployerRate}%)`, 'A/C 1', `A/C 10 (${pfPensionRate}%)`, `A/C 2 (${pfAdminRate}%)`, `A/C 21 (${pfEdliRate}%)`, 'A/C 22', 'Total Challan (INR)']
      ];
      const totalChallan = (pfSummary.ac1 || 0) + (pfSummary.ac10 || 0) + (pfSummary.ac2 || 0) + (pfSummary.ac21 || 0) + (pfSummary.ac22 || 0) + (pfSummary.ee || 0);
      const pfSummaryBody = [
        [
          (pfSummary.pfWages || 0).toLocaleString('en-IN'),
          pfSummary.strn || activeRecords.length,
          (pfSummary.ee || 0).toLocaleString('en-IN'),
          (pfSummary.erDiff || 0).toLocaleString('en-IN'),
          (pfSummary.ac1 || 0).toLocaleString('en-IN'),
          (pfSummary.ac10 || 0).toLocaleString('en-IN'),
          (pfSummary.ac2 || 0).toLocaleString('en-IN'),
          (pfSummary.ac21 || 0).toLocaleString('en-IN'),
          (pfSummary.ac22 || 0).toLocaleString('en-IN'),
          totalChallan.toLocaleString('en-IN')
        ]
      ];

      autoTable(doc, {
        startY: currentY,
        head: pfSummaryHead,
        body: pfSummaryBody,
        theme: 'grid',
        styles: { fontSize: 8, cellPadding: 4, halign: 'center' },
        headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0] }
      });
      currentY = doc.lastAutoTable.finalY + 20;
    }

    // 2. ESI & PT Summary Statements
    if (selectedOptions.showEsiSummary !== false || selectedOptions.showPtSummary !== false) {
      const dualHead = [
        ['ESI SUMMARY', '', '', '', 'PROFESSIONAL TAX (P.T.) SUMMARY', '']
      ];
      const dualSubHead = [
        ['ESI Wages', 'Employees', `EE Share (${esiEmployeeRate}%)`, `ER Share (${esiEmployerRate}%)`, 'PT Amount', 'PT Subscribers']
      ];
      const dualBody = [
        [
          (esiSummary.esiWages || 0).toLocaleString('en-IN'),
          esiSummary.strn || activeRecords.length,
          (esiSummary.eeShare || 0).toLocaleString('en-IN'),
          (esiSummary.erShare || 0).toLocaleString('en-IN'),
          (ptSummary.amount || 0).toLocaleString('en-IN'),
          ptSummary.count || activeRecords.length
        ]
      ];

      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('ESI & P.T. STATUTORY STATEMENTS', 30, currentY);
      currentY += 8;

      autoTable(doc, {
        startY: currentY,
        head: [...dualHead, ...dualSubHead],
        body: dualBody,
        theme: 'grid',
        styles: { fontSize: 8, cellPadding: 4, halign: 'center' },
        headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0] }
      });
      currentY = doc.lastAutoTable.finalY + 20;
    }

    // 3. Consolidated Earnings & Deductions Statement
    if (selectedOptions.showEarningDeductionStatement !== false) {
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('CONSOLIDATED EARNINGS & DEDUCTIONS BREAKDOWN', 30, currentY);
      currentY += 8;

      const compHead = [['Earnings Component', 'Amount (INR)', 'Deductions Component', 'Amount (INR)']];
      const compBody = [
        ['Basic Wages', (earningSummary.basic || activeTotals.grandBasic || 0).toLocaleString('en-IN'), 'Provident Fund (P.F)', (deductionSummary.pf || activeTotals.grandPf || 0).toLocaleString('en-IN')],
        ['Dearness Allowance (DA)', (earningSummary.da || activeTotals.grandDa || 0).toLocaleString('en-IN'), 'Employee State Insurance (ESI)', (deductionSummary.esi || activeTotals.grandEsi || 0).toLocaleString('en-IN')],
        ['House Rent Allowance (HRA)', (earningSummary.hra || activeTotals.grandHra || 0).toLocaleString('en-IN'), 'Professional Tax (P.T.)', (deductionSummary.pt || activeTotals.grandPt || 0).toLocaleString('en-IN')],
        ['Conveyance Allowance', (earningSummary.conv || activeTotals.grandConv || 0).toLocaleString('en-IN'), 'Income Tax (I.T. / TDS)', (deductionSummary.it || activeTotals.grandIt || 0).toLocaleString('en-IN')],
        ['Special Allowance', (earningSummary.spAll || activeTotals.grandSpAll || 0).toLocaleString('en-IN'), 'Labour Welfare Fund (LWF)', (deductionSummary.lwf || activeTotals.grandLwf || 0).toLocaleString('en-IN')],
        ['Other Allowances', (earningSummary.othAll || activeTotals.grandOthAll || 0).toLocaleString('en-IN'), 'Salary Advance Recovery', (deductionSummary.advance || activeTotals.grandAdvance || 0).toLocaleString('en-IN')],
        ['Gross Earnings', (activeTotals.grandGross || 0).toLocaleString('en-IN'), 'Gross Deductions Total', (activeTotals.grandDeductions || 0).toLocaleString('en-IN')],
        [{ content: 'Net Salary Payable', colSpan: 2, styles: { fontStyle: 'bold' } }, { content: `INR ${(activeTotals.grandNet || 0).toLocaleString('en-IN')}`, colSpan: 2, styles: { fontStyle: 'bold', halign: 'right' } }]
      ];

      autoTable(doc, {
        startY: currentY,
        head: compHead,
        body: compBody,
        theme: 'grid',
        styles: { fontSize: 8, cellPadding: 3 },
        headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0] }
      });
      currentY = doc.lastAutoTable.finalY + 30;
    }

    // 4. Verification Signatures
    if (selectedOptions.showSignatures !== false) {
      if (currentY + 60 > 800) {
        doc.addPage();
        currentY = 50;
      }
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text('Prepared By: ____________________', 60, currentY + 30);
      doc.text('Checked By: ____________________', 460, currentY + 30);
      doc.text(`For ${companyName} (Authorized Signatory): ____________________`, 820, currentY + 30);
    }
  }

  const fileName = `Salary_Sheet_Format_1_${String(monthLabel).replace(/\s+/g, '_')}.pdf`;
  doc.save(fileName);
};
