import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { downloadElementAsPdf } from './domPdfExportUtil';

/**
 * Statutory Register of Payment of Wages (Salary Sheet Format 2) Exporter
 * FORM - IV [Payment of Wages Rules, 1971]
 * Matches exact layout and columns from user-provided Image 2 & Image 3.
 */

export const downloadSalarySheetFormat2Excel = (
  records = [],
  companyInfo = {},
  period = {},
  totals = {},
  pfSummary = {},
  esiSummary = {},
  lwfSummary = {},
  options = {}
) => {
  const companyName = companyInfo?.name || companyInfo?.companyName || '—';
  const companyAddress = companyInfo?.address || '—';
  const pfNo = companyInfo?.pfNo || '—';
  const esiNo = companyInfo?.esiNo || companyInfo?.esicNo || '—';
  const monthLabel = period?.monthLabel || period?.month || '—';

  const clientName =
    options?.clientInfo?.name ||
    options?.clientName ||
    companyInfo?.clientInfo?.name ||
    (options?.filters?.company && options.filters.company !== 'All Companies' ? options.filters.company : null) ||
    records[0]?.clientName ||
    records[0]?.site ||
    companyName;

  const clientLocation =
    options?.clientInfo?.location ||
    options?.clientInfo?.address ||
    options?.clientLocation ||
    companyInfo?.clientInfo?.location ||
    records[0]?.clientLocation ||
    records[0]?.siteLocation ||
    records[0]?.site ||
    '';

  const aoa = [
    // Header
    [companyName, '', '', 'REGISTER OF PAYMENT OF WAGES', '', '', `Clint Name: ${clientName}`],
    [companyAddress, '', '', 'FORM - IV [Payment of Wages Rules, 1971]', '', '', clientLocation],
    [`PF CODE: ${pfNo}`, '', '', `Wages For The Month Of: ${monthLabel}`, '', '', ''],
    [`ESI CODE: ${esiNo}`],
    [''],
    // Table Headers
    [
      'Sr. No',
      'Emp. Code / Employee Name / Father/Husband Name / Desig / Dept / ESI / UAN / Mode / A/C / DOB / DOJ / Aadhaar',
      'ATTENDANCE (Month Day, Present, EL, CL, W.Off, Holiday, SL, LWP, Payable, OT)',
      'RATE OF PAY (BASIC, D.A., HRA, CONV ALLO, ARREAR, SPEC ALLO, DW, BONUS, LEAVE, Total)',
      'EARNINGS (BASIC, D.A., HRA, CONV ALLO, ARREAR, SPEC ALLOW, DW, BONUS, LEAVE, UNI ALLOW, OT, Total)',
      'DEDUCTION (PF, ESI, LWF, ADVANCE, OTHER DED, UNI, NIGHT SLP, LOAN, ADVANCE, Total)',
      'NET PAYABLE',
      'Signature'
    ]
  ];

  records.forEach((row, idx) => {
    const att = row.attendance || {};
    const rate = row.rateOfWages || {};
    const earn = row.earnings || {};
    const ded = row.deductions || {};

    const empDetailsText = [
      `Emp Code: ${row.employeeId || ''}`,
      `Name: ${row.name || ''}`,
      `Father/Husband: ${row.fatherHusbandName || '-'} | Mode: ${row.paymentMode || 'Bank'}`,
      `Desig: ${row.designation || ''} | A/c: ${row.bankAccountNo || '-'}`,
      `Dept: ${row.department || ''} | DOB: ${row.dob || '-'}`,
      `ESI No: ${row.esiNo || '-'} | DOJ: ${row.doj || '-'}`,
      `UAN: ${row.uan || '-'} | Aadhaar: ${row.aadhaar || '-'}`
    ].join('\n');

    const attText = [
      `Month Day: ${att.wd || '31'}`,
      `Present: ${att.pd || '0'} | EL: ${att.pl || '0'}`,
      `W.Off: ${att.wo || '0'} | CL: ${att.cl || '0'}`,
      `Holiday: ${att.ph || '0'} | SL: ${att.sl || '0'}`,
      `LWP: 0 | OT: 0`,
      `Payable: ${att.tot || att.pd || '0'}`
    ].join('\n');

    const rateText = [
      `BASIC: ${rate.basic || 0}`,
      `D.A.: ${rate.da || 0} | SPEC ALLO: ${rate.spAll || 0}`,
      `HRA: ${rate.hra || 0} | DW: 0`,
      `CONV ALLO: ${rate.conv || 0} | BONUS: 0`,
      `ARREAR: 0 | LEAVE: 0`,
      `Total : ${rate.total || 0}`
    ].join('\n');

    const earnText = [
      `BASIC: ${earn.basic || 0}`,
      `D.A.: ${earn.da || 0} | SPEC ALLOW: ${earn.spAll || 0}`,
      `HRA: ${earn.hra || 0} | DW: 0`,
      `CONV ALLO: ${earn.conv || 0} | BONUS: 0`,
      `ARREAR: 0 | LEAVE: 0`,
      `UNI ALLOW: 0 | OT AMOUNT: ${earn.otPib || 0}`,
      `Total : ${row.grossSalary || 0}`
    ].join('\n');

    const dedText = [
      `PF: ${ded.pf || 0} | UNI: 0`,
      `ESI: ${ded.esi || 0} | NIGHT SLP: 0`,
      `LWF: ${ded.lwf || 0} | LOAN: ${ded.loan || 0}`,
      `ADVANCE: ${ded.advance || 0} | ADVANCE: 0`,
      `OTHER DED: ${ded.othDed || 0}`,
      `Total : ${row.grossDeduct || 0}`
    ].join('\n');

    aoa.push([
      row.srNo || idx + 1,
      empDetailsText,
      attText,
      rateText,
      earnText,
      dedText,
      row.netPayable || 0,
      ''
    ]);
  });

  // Totals Row
  aoa.push([
    'Total',
    '',
    `Month Days: ${records.length * 31}\nPresent: ${totals.totalPd || 0}\nPayable: ${totals.totalTot || 0}`,
    `Total : ${totals.totalRateTotal || totals.grandGross || 0}`,
    `Total : ${totals.grandGross || 0}`,
    `PF: ${totals.grandPf || 0}\nESI: ${totals.grandEsi || 0}\nTotal : ${totals.grandDeductions || 0}`,
    totals.grandNet || 0,
    ''
  ]);

  aoa.push(['']);
  aoa.push(['']);

  // Bottom Summary (Image 3)
  aoa.push(['PF SUMMARY', '', 'ESI SUMMARY', '', 'LWF SUMMARY']);
  aoa.push([
    `TOTAL EPF EMPLOYEES: ${pfSummary.strn || 0}`,
    '',
    `TOTAL ESIC EMPOLYEES: ${esiSummary.strn || records.length}`,
    '',
    `TOTAL LWF EMPLOYEES: ${lwfSummary.totalLwfEmployees || 0}`
  ]);
  aoa.push([
    `EPF WAGES: ${pfSummary.pfWages || 0}`,
    '',
    `ESI WAGES: ${esiSummary.esiWages || 0}`,
    '',
    `EMPLOYEE SAHRE OF LWF: ${lwfSummary.employeeShare || 0}`
  ]);
  aoa.push([
    `A/C NO. 1(EE_12%): ${pfSummary.ee || 0}`,
    '',
    `EE_WAGES_0.75%: ${esiSummary.eeShare || 0}`,
    '',
    `EMPLOYER SHARE OF LWF: ${lwfSummary.employerShare || 0}`
  ]);
  aoa.push([
    `A/C NO. 1(ER_3.67%): ${pfSummary.erDiff || 0}`,
    '',
    `EE_OT_0.75%: 0`
  ]);
  aoa.push([
    `A/C NO. 2(0.50%): ${pfSummary.ac2 || 0}`,
    '',
    `ER_3.25%: ${esiSummary.erShare || 0}`
  ]);
  aoa.push([
    `A/C NO. 10(8.33%): ${pfSummary.ac10 || 0}`
  ]);
  aoa.push([
    `A/C NO. 21(0.50%): ${pfSummary.ac21 || 0}`
  ]);
  aoa.push([
    `TOTAL EPF CONTRIBUTIO: ${pfSummary.total || 0}`,
    '',
    `TOTAL ESIC CONTRIBUTI: ${esiSummary.totalEsi || 0}`
  ]);

  const ws = XLSX.utils.aoa_to_sheet(aoa);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Register_Payment_Wages');

  const fileName = `Salary_Sheet_Format_2_${String(monthLabel).replace(/\s+/g, '_')}.${options.format === 'csv' ? 'csv' : 'xlsx'}`;

  if (options.format === 'csv') {
    XLSX.writeFile(wb, fileName, { bookType: 'csv' });
  } else {
    XLSX.writeFile(wb, fileName);
  }
};

export const downloadSalarySheetFormat2Csv = (records, companyInfo, period, totals, pfSummary, esiSummary, lwfSummary) => {
  downloadSalarySheetFormat2Excel(records, companyInfo, period, totals, pfSummary, esiSummary, lwfSummary, { format: 'csv' });
};

export const downloadSalarySheetFormat2Pdf = async (
  records = [],
  companyInfo = {},
  period = {},
  totals = {},
  pfSummary = {},
  esiSummary = {},
  lwfSummary = {},
  options = {}
) => {
  // Live preview capture for exact styling/layout parity
  if (typeof document !== 'undefined') {
    const previewEl = document.querySelector('#report-preview-capture-area') || document.querySelector('[class*="SalarySheetFormat2View_paperSheet"]');
    if (previewEl) {
      const cleanMonth = (period?.monthLabel || period?.month || 'Current').replace(/[^a-zA-Z0-9_-]/g, '_');
      const ok = await downloadElementAsPdf(previewEl, {
        filename: `Form_IV_Payment_of_Wages_${cleanMonth}.pdf`,
        title: 'Form IV Register of Payment of Wages',
        mode: options.mode || 'download',
        orientation: 'landscape',
        format: 'a3',
      });
      if (ok) return;
    }
  }

  if (options.mode === 'print') {
    window.print();
    return;
  }

  const companyName = companyInfo?.name || companyInfo?.companyName || '—';
  const companyAddress = companyInfo?.address || '—';
  const pfNo = companyInfo?.pfNo || '—';
  const esiNo = companyInfo?.esiNo || companyInfo?.esicNo || '—';
  const monthLabel = period?.monthLabel || period?.month || '—';

  const clientName =
    options?.clientInfo?.name ||
    options?.clientName ||
    companyInfo?.clientInfo?.name ||
    (options?.filters?.company && options.filters.company !== 'All Companies' ? options.filters.company : null) ||
    records[0]?.clientName ||
    records[0]?.site ||
    companyName;

  const clientLocation =
    options?.clientInfo?.location ||
    options?.clientInfo?.address ||
    options?.clientLocation ||
    companyInfo?.clientInfo?.location ||
    records[0]?.clientLocation ||
    records[0]?.siteLocation ||
    records[0]?.site ||
    '';

  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'pt',
    format: 'a3',
  });

  // Top Box Border
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(1);
  doc.rect(30, 20, 1130, 55);

  // Left Company Block
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(companyName, 40, 36);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.text(companyAddress, 40, 47);
  doc.setFont('helvetica', 'bold');
  doc.text(`PF CODE: ${pfNo}`, 40, 58);
  doc.text(`ESI CODE: ${esiNo}`, 40, 68);

  // Center Title Block
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('REGISTER OF PAYMENT OF WAGES', 595, 36, { align: 'center' });
  doc.setFontSize(8.5);
  doc.text('FORM - IV [Payment of Wages Rules, 1971]', 595, 48, { align: 'center' });
  doc.setFontSize(9);
  doc.text(`Wages For The Month Of: ${monthLabel}`, 595, 62, { align: 'center' });

  // Right Client Block
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.text(`Clint Name: ${clientName}`, 1150, 40, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.text(clientLocation, 1150, 54, { align: 'right' });

  // Main Table
  const tableHead = [
    [
      { content: 'Sr.\nNo', styles: { halign: 'center', valign: 'middle' } },
      { content: 'Emp. Code / Card No.\nEmployee Name\nFather/Husband Name        Payment Mode\nDesignation                     Account No.\nDepartment                     DOB\nESI No.                             DOJ\nUAN                                  Aadhaar No.', styles: { halign: 'left', valign: 'middle' } },
      { content: 'ATTENDANCE\nMonth Day\nPresent        EL\nW.Off           CL\nHoliday        SL\nLWP\nPayable        OT', styles: { halign: 'left', valign: 'middle' } },
      { content: 'RATE OF PAY\nBASIC           SPEC ALLO\nD.A.              DW\nHRA              BONUS\nCONV ALLO   LEAVE\nARREAR', styles: { halign: 'left', valign: 'middle' } },
      { content: 'E A R N I N G S\nBASIC           SPEC ALLOW\nD.A.              DW\nHRA              BONUS\nCONV ALLO   LEAVE\nARREAR         UNI ALLOW\n                    OT AMOUNT', styles: { halign: 'left', valign: 'middle' } },
      { content: 'D E D U C T I O N\nPF                 UNI\nESI               NIGHT SLP\nLWF              LOAN\nADVANCE      ADVANCE\nOTHER DED', styles: { halign: 'left', valign: 'middle' } },
      { content: 'NET PAYABLE\n\n\n\nSignature', styles: { halign: 'center', valign: 'middle' } },
    ]
  ];

  const tableBody = records.map((row, idx) => {
    const att = row.attendance || {};
    const rate = row.rateOfWages || {};
    const earn = row.earnings || {};
    const ded = row.deductions || {};

    const empCol = [
      `${row.employeeId || ''}`,
      `${row.name || ''}`,
      `${row.fatherHusbandName || '-'}        ${row.paymentMode || 'Bank'}`,
      `${row.designation || ''}        ${row.bankAccountNo || '-'}`,
      `${row.department || ''}        ${row.dob || '-'}`,
      `${row.esiNo || '-'}        ${row.doj || '-'}`,
      `${row.uan || '-'}        ${row.aadhaar || '-'}`
    ].join('\n');

    const attCol = [
      `${att.wd || '31'}`,
      `${att.pd || '0'}`,
      '',
      '',
      '',
      `${att.tot || att.pd || '0'}`
    ].join('\n');

    const rateCol = [
      `${rate.basic || 0}`,
      '',
      '',
      '',
      '',
      `Total : ${rate.total || rate.basic || 0}`
    ].join('\n');

    const earnCol = [
      `${earn.basic || 0}`,
      '',
      '',
      '',
      '',
      `Total : ${row.grossSalary || earn.basic || 0}`
    ].join('\n');

    const dedCol = [
      ded.pf > 0 ? `${ded.pf}` : '',
      ded.esi > 0 ? `${ded.esi}` : (ded.pf > 0 ? '' : '0'),
      '',
      '',
      '',
      `Total : ${row.grossDeduct || 0}`
    ].join('\n');

    return [
      row.srNo || idx + 1,
      empCol,
      attCol,
      rateCol,
      earnCol,
      dedCol,
      `${(row.netPayable || 0).toLocaleString('en-IN')}`
    ];
  });

  // Grand Total Row
  tableBody.push([
    { content: 'Total', styles: { fontStyle: 'bold', halign: 'center' } },
    { content: '', styles: { fontStyle: 'bold' } },
    { content: `${records.length * 31}\n${totals.totalPd || 0}\n\n\n\n${totals.totalTot || totals.totalPd || 0}`, styles: { fontStyle: 'bold' } },
    { content: `${totals.totalRateTotal || totals.grandGross || 0}\n\n\n\nTotal : ${totals.totalRateTotal || totals.grandGross || 0}`, styles: { fontStyle: 'bold' } },
    { content: `${totals.grandGross || 0}\n\n\n\nTotal : ${totals.grandGross || 0}`, styles: { fontStyle: 'bold' } },
    { content: `${totals.grandPf || 0}\n${totals.grandEsi || 0}\n\n\nTotal : ${totals.grandDeductions || 0}`, styles: { fontStyle: 'bold' } },
    { content: `${(totals.grandNet || 0).toLocaleString('en-IN')}`, styles: { fontStyle: 'bold', halign: 'center' } }
  ]);

  autoTable(doc, {
    startY: 85,
    head: tableHead,
    body: tableBody,
    theme: 'grid',
    styles: {
      fontSize: 7.5,
      cellPadding: 4,
      textColor: [0, 0, 0],
      lineColor: [0, 0, 0],
      lineWidth: 0.5,
      overflow: 'linebreak'
    },
    headStyles: {
      fillColor: [255, 255, 255],
      textColor: [0, 0, 0],
      fontStyle: 'bold',
      lineColor: [0, 0, 0],
      lineWidth: 0.5,
    }
  });

  // Image 3 Bottom Summaries (PF, ESI, LWF)
  const finalY = doc.lastAutoTable.finalY + 15;

  // Box 1: PF SUMMARY
  autoTable(doc, {
    startY: finalY,
    margin: { left: 30 },
    tableWidth: 350,
    head: [['PF SUMMARY', '']],
    body: [
      ['TOTAL EPF EMPLOYEES', `${pfSummary.strn || 0}`],
      ['EPF WAGES', `${pfSummary.pfWages || 0}`],
      ['A/C NO. 1(EE_12%)', `${pfSummary.ee || 0}`],
      ['A/C NO. 1(ER_3.67%)', `${pfSummary.erDiff || 0}`],
      ['A/C NO. 2(0.50%)', `${pfSummary.ac2 || 0}`],
      ['A/C NO. 10(8.33%)', `${pfSummary.ac10 || 0}`],
      ['A/C NO. 21(0.50%)', `${pfSummary.ac21 || 0}`],
      [{ content: 'TOTAL EPF CONTRIBUTIO', styles: { fontStyle: 'bold' } }, { content: `${pfSummary.total || 0}`, styles: { fontStyle: 'bold' } }]
    ],
    theme: 'plain',
    styles: { fontSize: 8, cellPadding: 2.5, textColor: [0, 0, 0] },
    headStyles: { fontStyle: 'bold', fontSize: 8.5 }
  });

  // Box 2: ESI SUMMARY
  autoTable(doc, {
    startY: finalY,
    margin: { left: 410 },
    tableWidth: 350,
    head: [['ESI SUMMARY', '']],
    body: [
      ['TOTAL ESIC EMPOLYEES', `${esiSummary.strn || records.length}`],
      ['ESI WAGES', `${esiSummary.esiWages || 0}`],
      ['EE_WAGES_0.75%', `${esiSummary.eeShare || 0}`],
      ['EE_OT_0.75%', '0'],
      ['ER_3.25%', `${esiSummary.erShare || 0}`],
      ['', ''],
      ['', ''],
      [{ content: 'TOTAL ESIC CONTRIBUTI', styles: { fontStyle: 'bold' } }, { content: `${esiSummary.totalEsi || 0}`, styles: { fontStyle: 'bold' } }]
    ],
    theme: 'plain',
    styles: { fontSize: 8, cellPadding: 2.5, textColor: [0, 0, 0] },
    headStyles: { fontStyle: 'bold', fontSize: 8.5 }
  });

  // Box 3: LWF SUMMARY
  autoTable(doc, {
    startY: finalY,
    margin: { left: 790 },
    tableWidth: 350,
    head: [['LWF SUMMARY', '']],
    body: [
      ['TOTAL LWF EMPLOYEES', `${lwfSummary.totalLwfEmployees || 0}`],
      ['EMPLOYEE SAHRE OF LWF', `${lwfSummary.employeeShare || 0}`],
      ['EMPLOYER SHARE OF LWF', `${lwfSummary.employerShare || 0}`]
    ],
    theme: 'plain',
    styles: { fontSize: 8, cellPadding: 2.5, textColor: [0, 0, 0] },
    headStyles: { fontStyle: 'bold', fontSize: 8.5 }
  });

  // Outer border enclosing the bottom summaries
  const bottomHeight = doc.lastAutoTable.finalY - finalY + 10;
  doc.rect(30, finalY - 5, 1130, Math.max(bottomHeight, 140));

  doc.save(`Salary_Sheet_Format_2_${String(monthLabel).replace(/\s+/g, '_')}.pdf`);
};
