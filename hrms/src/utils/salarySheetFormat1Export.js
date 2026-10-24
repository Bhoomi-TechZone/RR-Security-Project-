import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { downloadElementAsPdf } from './domPdfExportUtil';

/**
 * Statutory Wage / Salary Register (Salary Sheet Format 1) Exporter
 * Compliant with:
 * (1) Form under Rule - 6 of Equal Remuneration Rules 1976.
 * (2) Form under Rule - 21(4),25(2),26(1) and 26(2) of Gujarat Minimum Wages Rules 1961
 * (3) Form under Rule - 6 of Payment of Wages Gujarat Rules, 1963.
 * (4) Form 17 under Rule - 78 of Contract Labour (Regulation & Abolition) Gujarat, Rules 1972
 * (5) Form under Rule - 52(2) of Inter State Migrant Workers (Gujarat) Rules 1981
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
  const companyName = companyInfo?.name || companyInfo?.companyName || 'RR Security & Facilities';
  const companyAddress =
    companyInfo?.address && companyInfo.address !== '—'
      ? companyInfo.address
      : 'G-75/A, GROUND FLOOR, BLOCK-G, M.B. EXTN., BADARPUR, NEW DELHI, 110044';
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
  const monthLabel = period?.monthLabel || period?.month || 'Current Month';
  const toDate = period?.toDate || new Date().toISOString().slice(0, 10);

  const clientName =
    options?.clientInfo?.name ||
    options?.clientName ||
    companyInfo?.clientInfo?.name ||
    (options?.filters?.company && options.filters.company !== 'All Companies' ? options.filters.company : null) ||
    records[0]?.clientName ||
    records[0]?.site ||
    '';

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
    [`PF No :- ${pfNo}`, '', `Date of Payment :- ${toDate}`, '', '', '', '', 'Wage/Salary Register', '', '', '', '', '', '', `For The Month Of ${monthLabel}`],
    [`ESI No :- ${esiNo}`],
    [''],
    // Table Header Level 1
    [
      'Sr. No.',
      'Employee Name / Designation / Dept / UAN / PF / ESI',
      'Emp. ID',
      'Details of Attendance',
      'Rate of Wages',
      'Earnings - BASIC / DA',
      'Earnings - HRA / OTH.All',
      'Earnings - CONV',
      'Earnings - SP.All / OT/PIB',
      'Gross Salary',
      'Deduction - P.F / ESI',
      'Deduction - P.T. / I.T. / LWF',
      'Deduction - Advance / LOAN / Food',
      'Deduction - Oth.Ded / E/Mbill',
      'Gross Deduct.',
      'Net Payable',
      'Signature / Bank Details'
    ]
  ];

  // Records
  records.forEach((row, idx) => {
    const att = row.attendance || {};
    const rate = row.rateOfWages || {};
    const earn = row.earnings || {};
    const ded = row.deductions || {};

    const empInfoText = [
      row.name,
      row.designation,
      row.department,
      row.uan ? `UAN: ${row.uan}` : '',
      row.pfNo ? `PF: ${row.pfNo}` : '',
      row.esiNo ? `ESI: ${row.esiNo}` : ''
    ].filter(Boolean).join('\n');

    const attText = `WD: ${att.wd || '0.00'}\nWO: ${att.wo || '0.00'}\nPH: ${att.ph || '0.00'}\nPD: ${att.pd || '0.00'}\nPL: ${att.pl || '0.00'}\nCL: ${att.cl || '0.00'}\nSL: ${att.sl || '0.00'}\nML/Adj: ${att.mlAdj || '0.00'}\nTOT: ${att.tot || '0.00'}`;

    const rateText = `BASIC: ${rate.basic || 0}\nDA: ${rate.da || 0}\nHRA: ${rate.hra || 0}\nCONV: ${rate.conv || 0}\nSP.All: ${rate.spAll || 0}\nOTH.All: ${rate.othAll || 0}\nTotal: ${rate.total || 0}`;

    const grossText = `${row.grossSalary || 0}\nP ${row.pfWage || 0}\nE ${row.esiWage || 0}`;

    const bankText = `Bank\n${row.bankName || '—'}\n${row.bankAccountNo || '—'}`;

    aoa.push([
      row.srNo || idx + 1,
      empInfoText,
      row.employeeId || '',
      attText,
      rateText,
      `${earn.basic || 0}\n${earn.da || 0}`,
      `${earn.hra || 0}\n${earn.othAll || 0}`,
      `${earn.conv || 0}`,
      `${earn.spAll || 0}\n${earn.otPib || 0}`,
      grossText,
      `${ded.pf || 0}\n${ded.esi || 0}`,
      `${ded.pt || 0}\n${ded.it || 0}\n${ded.lwf || 0}`,
      `${ded.advance || 0}\n${ded.loan || 0}\n${ded.food || 0}`,
      `${ded.othDed || 0}\n${ded.eMbill || 0}`,
      row.grossDeduct || 0,
      row.netPayable || 0,
      bankText
    ]);
  });

  // Grand Total Row
  aoa.push([
    'Grand Total',
    '',
    '',
    `Total WO: ${(totals.totalWo || 0).toFixed(2)}\nTotal PH: ${(totals.totalPh || 0).toFixed(2)}\nTotal PD: ${(totals.totalPd || 0).toFixed(2)}\nTotal PL: ${(totals.totalPl || 0).toFixed(2)}\nTotal CL: ${(totals.totalCl || 0).toFixed(2)}\nTotal S.L.: ${(totals.totalSl || 0).toFixed(2)}\nML/Adj: ${(totals.totalMlAdj || 0).toFixed(2)}`,
    totals.totalRateTotal || '',
    `${totals.grandBasic || 0}\n${totals.grandDa || 0}`,
    `${totals.grandHra || 0}\n${totals.grandOthAll || 0}`,
    `${totals.grandConv || 0}`,
    `${totals.grandSpAll || 0}\n${totals.grandOtPib || 0}`,
    totals.grandGross || 0,
    `${totals.grandPf || 0}\n${totals.grandEsi || 0}`,
    `${totals.grandPt || 0}\n${totals.grandIt || 0}\n${totals.grandLwf || 0}`,
    `${totals.grandAdvance || 0}\n${totals.grandLoan || 0}\n${totals.grandFood || 0}`,
    `${totals.grandOthDed || 0}\n${totals.grandEMbill || 0}`,
    totals.grandDeductions || 0,
    totals.grandNet || 0,
    `For ${companyName}`
  ]);

  aoa.push(['']);
  aoa.push(['']);

  // Bottom Summary Section: PF Summary, ESI Summary, PT Summary, Earning & Deduction Summary, Net Pay
  aoa.push(['PF SUMMARY', '', '', '', '', '', '', '', '', 'ESI Summary', '', '', '', 'P.T. Summary', '', 'Earning Summary', 'Deduction Summary']);
  aoa.push([
    'PF Wages', 'Strn.', 'EE', 'ER (Diff)', 'A/C - 1', 'A/C 10', 'A/C 2', 'A/C - 21', 'A/C - 22',
    'ESI Wages', 'Strn', 'EE Share', 'ER.Share',
    'PT Amount', 'PT Count',
    `BASIC: ${earningSummary.basic || totals.grandBasic || 0}`,
    `P.F: ${deductionSummary.pf || totals.grandPf || 0}`
  ]);

  aoa.push([
    pfSummary.pfWages || 0,
    pfSummary.strn || 0,
    pfSummary.ee || 0,
    pfSummary.erDiff || 0,
    pfSummary.ac1 || 0,
    pfSummary.ac10 || 0,
    pfSummary.ac2 || 0,
    pfSummary.ac21 || 0,
    pfSummary.ac22 || 0,
    esiSummary.esiWages || 0,
    esiSummary.strn || 0,
    esiSummary.eeShare || 0,
    esiSummary.erShare || 0,
    ptSummary.ptAmount || totals.grandPt || 0,
    ptSummary.ptCount || 0,
    `DA: ${earningSummary.da || totals.grandDa || 0}`,
    `ESI: ${deductionSummary.esi || totals.grandEsi || 0}`
  ]);

  aoa.push([
    'Total PF:', pfSummary.total || 0, '', '', '', '', '', '', '',
    'Total ESI:', esiSummary.totalEsi || 0, '', '',
    '', '',
    `HRA: ${earningSummary.hra || totals.grandHra || 0}`,
    `P.T.: ${deductionSummary.pt || totals.grandPt || 0}`
  ]);

  aoa.push([
    '', '', '', '', '', '', '', '', '', '', '', '', '', '', '',
    `CONV: ${earningSummary.conv || totals.grandConv || 0}`,
    `I.T.: ${deductionSummary.it || totals.grandIt || 0}`
  ]);

  aoa.push([
    '', '', '', '', '', '', '', '', '', '', '', '', '', '', '',
    `SP.All: ${earningSummary.spAll || totals.grandSpAll || 0}`,
    `LOAN: ${deductionSummary.loan || totals.grandLoan || 0}`
  ]);

  aoa.push([
    '', '', '', '', '', '', '', '', '', '', '', '', '', '', '',
    `OTH.All: ${earningSummary.othAll || totals.grandOthAll || 0}`,
    `Advance: ${deductionSummary.advance || totals.grandAdvance || 0}`
  ]);

  aoa.push([
    '', '', '', '', '', '', '', '', '', '', '', '', '', '', '',
    `OT/PIB: ${earningSummary.otPib || totals.grandOtPib || 0}`,
    `LWF: ${deductionSummary.lwf || totals.grandLwf || 0}`
  ]);

  aoa.push([
    '', '', '', '', '', '', '', '', '', '', '', '', '', '', '',
    `Gross Salary: ${earningSummary.grossSalary || totals.grandGross || 0}`,
    `Gross Ded.: ${deductionSummary.grossDed || totals.grandDeductions || 0}`
  ]);

  aoa.push([
    '', '', '', '', '', '', '', '', '', '', '', '', '', '', '',
    'NET PAY:', totals.grandNet || 0
  ]);

  const ws = XLSX.utils.aoa_to_sheet(aoa);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Wage_Salary_Register');

  const fileName = `Salary_Sheet_Format_1_${String(monthLabel).replace(/\s+/g, '_')}.${options.format === 'csv' ? 'csv' : 'xlsx'}`;

  if (options.format === 'csv') {
    XLSX.writeFile(wb, fileName, { bookType: 'csv' });
  } else {
    XLSX.writeFile(wb, fileName);
  }
};

export const downloadSalarySheetFormat1Csv = (records, companyInfo, period, totals, pfSummary, esiSummary, ptSummary, earningSummary, deductionSummary) => {
  downloadSalarySheetFormat1Excel(records, companyInfo, period, totals, pfSummary, esiSummary, ptSummary, earningSummary, deductionSummary, { format: 'csv' });
};

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
  // Live preview capture for exact styling/layout parity
  if (typeof document !== 'undefined') {
    const previewEl = document.querySelector('#report-preview-capture-area') || document.querySelector('[class*="SalarySheetFormat1View_paperSheet"]');
    if (previewEl) {
      const cleanMonth = (period?.monthLabel || period?.month || 'Current').replace(/[^a-zA-Z0-9_-]/g, '_');
      const ok = await downloadElementAsPdf(previewEl, {
        filename: `Wage_Salary_Register_${cleanMonth}.pdf`,
        title: 'Wage/Salary Register',
        mode: options.mode || 'download',
        orientation: 'landscape',
        format: 'a3',
      });
      if (ok) return;
    }
  }

  const companyName = companyInfo?.name || companyInfo?.companyName || 'RR Security & Facilities';
  const companyAddress =
    companyInfo?.address && companyInfo.address !== '—'
      ? companyInfo.address
      : 'G-75/A, GROUND FLOOR, BLOCK-G, M.B. EXTN., BADARPUR, NEW DELHI, 110044';
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
  const monthLabel = period?.monthLabel || period?.month || 'Current Month';
  const toDate = period?.toDate || new Date().toISOString().slice(0, 10);

  const clientName =
    options?.clientInfo?.name ||
    options?.clientName ||
    companyInfo?.clientInfo?.name ||
    (options?.filters?.company && options.filters.company !== 'All Companies' ? options.filters.company : null) ||
    records[0]?.clientName ||
    records[0]?.site ||
    '';

  // If print mode requested, trigger window print with dedicated stylesheet
  if (options.mode === 'print') {
    window.print();
    return;
  }

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
      { content: 'P.F\nESI', styles: { halign: 'right' } },
      { content: 'P.T.\nI.T.\nLWF', styles: { halign: 'right' } },
      { content: 'Advance\nLOAN\nFood', styles: { halign: 'right' } },
      { content: 'Oth.Ded\nE/Mbill', styles: { halign: 'right' } },
    ],
  ];

  const tableBody = records.map((row, idx) => {
    const att = row.attendance || {};
    const rate = row.rateOfWages || {};
    const earn = row.earnings || {};
    const ded = row.deductions || {};

    const empText = [
      row.name,
      row.designation,
      row.department,
      row.uan ? `UAN No:${row.uan}` : '',
      row.pfNo ? `PF No:${row.pfNo}` : '',
      row.esiNo ? `ESI No:${row.esiNo}` : '',
    ].filter(Boolean).join('\n');

    const attText = `WD ${att.wd || '0.00'}\nWO ${att.wo || '0.00'}\nPH ${att.ph || '0.00'}\nPD ${att.pd || '0.00'}\nPL ${att.pl || '0.00'}\nCL ${att.cl || '0.00'}\nS.L. ${att.sl || '0.00'}\nML/Adj ${att.mlAdj || '0.00'}\nTOT ${att.tot || '0.00'}`;

    const rateText = `BASIC ${rate.basic || 0}\nDA ${rate.da || 0}\nHRA ${rate.hra || 0}\nCONV ${rate.conv || 0}\nSP.All ${rate.spAll || 0}\nOTH.All ${rate.othAll || 0}\nTotal ${rate.total || 0}`;

    const grossText = `${(row.grossSalary || 0).toLocaleString('en-IN')}\nP ${(row.pfWage || 0).toLocaleString('en-IN')}\nE ${(row.esiWage || 0).toLocaleString('en-IN')}`;

    const signText = `Bank\n${row.bankName || '—'}\n${row.bankAccountNo || '—'}`;

    return [
      row.srNo || idx + 1,
      empText,
      row.employeeId || '',
      attText,
      rateText,
      `${earn.basic || 0}\n${earn.da || 0}`,
      `${earn.hra || 0}\n${earn.othAll || 0}`,
      `${earn.conv || 0}`,
      `${earn.spAll || 0}\n${earn.otPib || 0}`,
      grossText,
      `${ded.pf || 0}\n${ded.esi || 0}`,
      `${ded.pt || 0}\n${ded.it || 0}\n${ded.lwf || 0}`,
      `${ded.advance || 0}\n${ded.loan || 0}\n${ded.food || 0}`,
      `${ded.othDed || 0}\n${ded.eMbill || 0}`,
      (row.grossDeduct || 0).toLocaleString('en-IN'),
      (row.netPayable || 0).toLocaleString('en-IN'),
      signText,
    ];
  });

  // Grand Total Row
  const attTotalText = `Total WO ${(totals.totalWo || 0).toFixed(2)}\nTotal PH ${(totals.totalPh || 0).toFixed(2)}\nTotal PD ${(totals.totalPd || 0).toFixed(2)}\nTotal PL ${(totals.totalPl || 0).toFixed(2)}\nTotal CL ${(totals.totalCl || 0).toFixed(2)}\nTotal S.L. ${(totals.totalSl || 0).toFixed(2)}\nML/Adj ${(totals.totalMlAdj || 0).toFixed(2)}`;

  tableBody.push([
    { content: 'Grand Total', colSpan: 3, styles: { halign: 'center', fontStyle: 'bold' } },
    { content: attTotalText, styles: { fontStyle: 'bold' } },
    { content: '', styles: { fontStyle: 'bold' } },
    { content: `${totals.grandBasic || 0}\n${totals.grandDa || 0}`, styles: { halign: 'right', fontStyle: 'bold' } },
    { content: `${totals.grandHra || 0}\n${totals.grandOthAll || 0}`, styles: { halign: 'right', fontStyle: 'bold' } },
    { content: `${totals.grandConv || 0}`, styles: { halign: 'right', fontStyle: 'bold' } },
    { content: `${totals.grandSpAll || 0}\n${totals.grandOtPib || 0}`, styles: { halign: 'right', fontStyle: 'bold' } },
    { content: `${(totals.grandGross || 0).toLocaleString('en-IN')}`, styles: { halign: 'right', fontStyle: 'bold' } },
    { content: `${totals.grandPf || 0}\n${totals.grandEsi || 0}`, styles: { halign: 'right', fontStyle: 'bold' } },
    { content: `${totals.grandPt || 0}\n${totals.grandIt || 0}\n${totals.grandLwf || 0}`, styles: { halign: 'right', fontStyle: 'bold' } },
    { content: `${totals.grandAdvance || 0}\n${totals.grandLoan || 0}\n${totals.grandFood || 0}`, styles: { halign: 'right', fontStyle: 'bold' } },
    { content: `${totals.grandOthDed || 0}\n${totals.grandEMbill || 0}`, styles: { halign: 'right', fontStyle: 'bold' } },
    { content: `${(totals.grandDeductions || 0).toLocaleString('en-IN')}`, styles: { halign: 'right', fontStyle: 'bold' } },
    { content: `${(totals.grandNet || 0).toLocaleString('en-IN')}`, styles: { halign: 'right', fontStyle: 'bold' } },
    { content: `For ${companyName}`, styles: { halign: 'center', fontStyle: 'bold' } },
  ]);

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

  // Dedicated Page 2: Statutory Summary & Reconciliation Sheet
  doc.addPage('a3', 'landscape');

  // Page 2 Header
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(companyName, 30, 32);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.text(companyAddress, 30, 44);

  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('WAGE / SALARY REGISTER — STATUTORY SUMMARY & RECONCILIATION STATEMENT', 590, 44, { align: 'center' });

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.text(`PF No :- ${pfNo}   |   ESI No :- ${esiNo}   |   Date of Payment :- ${toDate}`, 30, 60);
  doc.text(`For The Month Of: ${monthLabel}${clientName ? `   |   Client: ${clientName}` : ''}`, 1150, 60, { align: 'right' });

  const finalY = 72;

  // 1. PF Summary Table
  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'bold');
  doc.text('PF SUMMARY STATEMENT', 30, finalY);

  autoTable(doc, {
    startY: finalY + 4,
    margin: { left: 30 },
    tableWidth: 420,
    head: [
      ['PF Wages', 'Strn.', 'EE (12%)', 'ER (Diff)', 'A/C - 1', 'A/C 10', 'A/C 2', 'A/C - 21', 'A/C - 22', 'Total'],
    ],
    body: [
      [
        (pfSummary.pfWages || 0).toLocaleString('en-IN'),
        pfSummary.strn || 0,
        (pfSummary.ee || 0).toLocaleString('en-IN'),
        (pfSummary.erDiff || 0).toLocaleString('en-IN'),
        (pfSummary.ac1 || 0).toLocaleString('en-IN'),
        (pfSummary.ac10 || 0).toLocaleString('en-IN'),
        (pfSummary.ac2 || 0).toLocaleString('en-IN'),
        (pfSummary.ac21 || 0).toLocaleString('en-IN'),
        (pfSummary.ac22 || 0).toLocaleString('en-IN'),
        (pfSummary.total || 0).toLocaleString('en-IN'),
      ],
      [
        (pfSummary.pfWages || 0).toLocaleString('en-IN'),
        '',
        '',
        '',
        '',
        '',
        '',
        (pfSummary.pfWages || 0).toLocaleString('en-IN'),
        '',
        '',
      ],
    ],
    theme: 'grid',
    styles: { fontSize: 8, halign: 'right', valign: 'middle', cellPadding: 4, lineColor: [0, 0, 0], lineWidth: 0.5 },
    headStyles: { fillColor: [248, 250, 252], textColor: [0, 0, 0], fontStyle: 'bold', valign: 'middle', cellPadding: 4 },
  });

  // 2. ESI Summary Table
  const esiY = doc.lastAutoTable.finalY + 12;
  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'bold');
  doc.text('ESI SUMMARY', 30, esiY);

  autoTable(doc, {
    startY: esiY + 4,
    margin: { left: 30 },
    tableWidth: 260,
    head: [['ESI Wages', 'Strn', 'EE Share (0.75%)', 'ER.Share (3.25%)', 'Total ESI (4%)']],
    body: [
      [
        (esiSummary.esiWages || 0).toLocaleString('en-IN'),
        esiSummary.strn || 0,
        (esiSummary.eeShare || 0).toLocaleString('en-IN'),
        (esiSummary.erShare || 0).toLocaleString('en-IN'),
        (esiSummary.totalEsi || 0).toLocaleString('en-IN'),
      ],
    ],
    theme: 'grid',
    styles: { fontSize: 8, halign: 'right', valign: 'middle', cellPadding: 4, lineColor: [0, 0, 0], lineWidth: 0.5 },
    headStyles: { fillColor: [248, 250, 252], textColor: [0, 0, 0], fontStyle: 'bold', valign: 'middle', cellPadding: 4 },
  });

  // 3. P.T. Summary Table
  doc.text('P.T. SUMMARY', 310, esiY);
  autoTable(doc, {
    startY: esiY + 4,
    margin: { left: 310 },
    tableWidth: 140,
    head: [['P.T. Head', 'Count', 'Total Amount']],
    body: [
      ['PT Deducted', `${ptSummary.ptCount || 0}`, `₹${(ptSummary.ptAmount || 0).toLocaleString('en-IN')}`],
      ['PT Total', `${ptSummary.ptCount || 0}`, `₹${(ptSummary.ptAmount || 0).toLocaleString('en-IN')}`],
    ],
    theme: 'grid',
    styles: { fontSize: 8, halign: 'right', valign: 'middle', cellPadding: 4, lineColor: [0, 0, 0], lineWidth: 0.5 },
    headStyles: { fillColor: [248, 250, 252], textColor: [0, 0, 0], fontStyle: 'bold', valign: 'middle', cellPadding: 4 },
  });

  // 4. Earning Summary & Deduction Summary Side-by-Side Box
  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'bold');
  doc.text('EARNING & DEDUCTION STATEMENT', 520, finalY);

  autoTable(doc, {
    startY: finalY + 4,
    margin: { left: 520 },
    tableWidth: 380,
    head: [
      [{ content: 'EARNING SUMMARY (₹)', colSpan: 2 }, { content: 'DEDUCTION SUMMARY (₹)', colSpan: 2 }],
    ],
    body: [
      ['BASIC', `${(earningSummary.basic || totals.grandBasic || 0).toLocaleString('en-IN')}`, 'P.F', `${(deductionSummary.pf || totals.grandPf || 0).toLocaleString('en-IN')}`],
      ['DA', `${(earningSummary.da || totals.grandDa || 0).toLocaleString('en-IN')}`, 'ESI', `${(deductionSummary.esi || totals.grandEsi || 0).toLocaleString('en-IN')}`],
      ['HRA', `${(earningSummary.hra || totals.grandHra || 0).toLocaleString('en-IN')}`, 'P.T.', `${(deductionSummary.pt || totals.grandPt || 0).toLocaleString('en-IN')}`],
      ['CONV', `${(earningSummary.conv || totals.grandConv || 0).toLocaleString('en-IN')}`, 'I.T.', `${(deductionSummary.it || totals.grandIt || 0).toLocaleString('en-IN')}`],
      ['SP.All', `${(earningSummary.spAll || totals.grandSpAll || 0).toLocaleString('en-IN')}`, 'LOAN', `${(deductionSummary.loan || totals.grandLoan || 0).toLocaleString('en-IN')}`],
      ['OTH.All', `${(earningSummary.othAll || totals.grandOthAll || 0).toLocaleString('en-IN')}`, 'Advance', `${(deductionSummary.advance || totals.grandAdvance || 0).toLocaleString('en-IN')}`],
      ['OT/PIB', `${(earningSummary.otPib || totals.grandOtPib || 0).toLocaleString('en-IN')}`, 'LWF', `${(deductionSummary.lwf || totals.grandLwf || 0).toLocaleString('en-IN')}`],
      ['—', '—', 'Oth.Ded', `${(deductionSummary.othDed || totals.grandOthDed || 0).toLocaleString('en-IN')}`],
      ['—', '—', 'Food', `${(deductionSummary.food || totals.grandFood || 0).toLocaleString('en-IN')}`],
      ['—', '—', 'E/Mbill', `${(deductionSummary.eMbill || totals.grandEMbill || 0).toLocaleString('en-IN')}`],
      [
        { content: `Gross Salary: ₹${(earningSummary.grossSalary || totals.grandGross || 0).toLocaleString('en-IN')}`, colSpan: 2, styles: { fontStyle: 'bold' } },
        { content: `Gross Ded.: ₹${(deductionSummary.grossDed || totals.grandDeductions || 0).toLocaleString('en-IN')}`, colSpan: 2, styles: { fontStyle: 'bold' } },
      ],
    ],
    theme: 'grid',
    styles: { fontSize: 8, halign: 'right', valign: 'middle', cellPadding: 4, lineColor: [0, 0, 0], lineWidth: 0.5 },
    headStyles: { fillColor: [241, 245, 249], textColor: [0, 0, 0], fontStyle: 'bold', valign: 'middle', cellPadding: 4 },
  });

  // 5. Net Pay Highlight Box
  doc.text('NET SALARY DISBURSED', 930, finalY);
  autoTable(doc, {
    startY: finalY + 4,
    margin: { left: 930 },
    tableWidth: 220,
    head: [['NET SALARY DISBURSED']],
    body: [
      [{ content: `₹${(totals.grandNet || 0).toLocaleString('en-IN')}`, styles: { fontSize: 16, fontStyle: 'bold', halign: 'center' } }],
    ],
    theme: 'grid',
    styles: { lineColor: [0, 0, 0], lineWidth: 1.5 },
    headStyles: { fillColor: [241, 245, 249], textColor: [0, 0, 0], fontStyle: 'bold', halign: 'center' },
  });

  // Signatory Verification Block on Page 2
  const signY = 280;
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.text('PREPARED BY', 120, signY, { align: 'center' });
  doc.line(50, signY + 30, 190, signY + 30);
  doc.setFont('helvetica', 'normal');
  doc.text('HR / Payroll Executive', 120, signY + 40, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.text('CHECKED & VERIFIED BY', 580, signY, { align: 'center' });
  doc.line(500, signY + 30, 660, signY + 30);
  doc.setFont('helvetica', 'normal');
  doc.text('Finance & Accounts Officer', 580, signY + 40, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.text(`FOR ${companyName.toUpperCase()}`, 1030, signY, { align: 'center' });
  doc.line(950, signY + 30, 1110, signY + 30);
  doc.setFont('helvetica', 'normal');
  doc.text('Authorised Signatory', 1030, signY + 40, { align: 'center' });

  doc.save(`Salary_Sheet_Format_1_${String(monthLabel).replace(/\s+/g, '_')}.pdf`);
};
