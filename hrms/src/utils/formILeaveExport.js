import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Download Statutory Register of Leave (Form I - Delhi Shops & Establishments Act)
 * [FORM I, See Rule 14 of Delhi Shops and Establishments Rules, 1954]
 * Matches exact 11-column dual-section layout from statutory reference image.
 */
export const downloadFormILeaveExcel = (
  employeeData = {},
  companyInfo = {},
  period = {},
  options = {}
) => {
  const emp = employeeData || {};
  const establishmentName =
    emp.establishmentName ||
    companyInfo?.name ||
    '—';
  const employeeName = emp.displayName || emp.name || '—';
  const dateOfEmployment = emp.dateOfEmployment || '—';
  const records = emp.rows || [];

  const aoa = [
    // Centered Title Block
    ['I'],
    ['FORM I'],
    ['(See Rule 14)'],
    ['Register of Leave'],
    [''],
    // Header Line 1 & Line 2 matching Image 1
    ['Name and Establishment :', establishmentName, '', '', '', '', 'Date of Employment :', dateOfEmployment],
    ['Name of Employee :', employeeName],
    [''],
    // Table Header Level 1 (Two sections)
    [
      'Casual or Sickness Leave',
      '',
      '',
      '',
      '',
      'Privilege Leave',
      '',
      '',
      '',
      '',
      '',
    ],
    // Table Header Level 2 (11 columns)
    [
      'Amount of Leave',
      'Date of Application if any',
      'Leave Availed (From)',
      'Leave Availed (To)',
      'Total Leave Availed',
      'Date of Application',
      'Whether Application Granted or Refused Fully or Partly',
      'Leave Availed (From)',
      'Leave Availed (To)',
      'Total Availed',
      'Balance at the end of the year',
    ],
  ];

  // Data rows
  records.forEach((r) => {
    aoa.push([
      r.casualAmountOfLeave !== undefined ? r.casualAmountOfLeave : '—',
      r.casualDateOfApplication || '—',
      r.casualFrom || '—',
      r.casualTo || '—',
      r.casualTotalAvailed !== undefined ? r.casualTotalAvailed : '—',
      r.privilegeDateOfApplication || '—',
      r.privilegeGrantedOrRefused || '—',
      r.privilegeFrom || '—',
      r.privilegeTo || '—',
      r.privilegeTotalAvailed !== undefined ? r.privilegeTotalAvailed : '—',
      r.privilegeBalanceAtEnd !== undefined ? r.privilegeBalanceAtEnd : '—',
    ]);
  });

  // Totals Row
  const totalCasual = records.reduce((s, r) => s + (Number(r.casualTotalAvailed) || 0), 0);
  const totalPrivilege = records.reduce((s, r) => s + (Number(r.privilegeTotalAvailed) || 0), 0);

  aoa.push([
    '',
    '',
    'Total:',
    '',
    totalCasual,
    '',
    '',
    'Total:',
    '',
    totalPrivilege,
    emp.balances?.remainingPrivilege ?? '—',
  ]);

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(aoa);

  // Merges for headers
  ws['!merges'] = [
    { s: { r: 8, c: 0 }, e: { r: 8, c: 4 } }, // Merge Casual or Sickness Leave across cols 0..4
    { s: { r: 8, c: 5 }, e: { r: 8, c: 10 } }, // Merge Privilege Leave across cols 5..10
  ];

  // Set column widths
  ws['!cols'] = [
    { wch: 16 }, // Amount of Leave
    { wch: 22 }, // Date of Application if any
    { wch: 16 }, // From
    { wch: 16 }, // To
    { wch: 18 }, // Total Leave Availed
    { wch: 20 }, // Date of Application
    { wch: 28 }, // Whether Application Granted or Refused
    { wch: 16 }, // From
    { wch: 16 }, // To
    { wch: 16 }, // Total Availed
    { wch: 24 }, // Balance at end of year
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Form I - Register of Leave');

  const empSlug = (emp.employeeId || 'Employee').replace(/[^a-zA-Z0-9]/g, '_');
  const fileName = `Register_of_Leave_Form_I_${empSlug}_${period?.year || 2026}.${options.format === 'csv' ? 'csv' : 'xlsx'}`;

  if (options.format === 'csv') {
    XLSX.writeFile(wb, fileName, { bookType: 'csv' });
  } else {
    XLSX.writeFile(wb, fileName);
  }
};

/**
 * Download Statutory Register of Leave (Form I) as CSV
 */
export const downloadFormILeaveCsv = (
  employeeData = {},
  companyInfo = {},
  period = {},
  options = {}
) => {
  return downloadFormILeaveExcel(employeeData, companyInfo, period, {
    ...options,
    format: 'csv',
  });
};

/**
 * Download / Print Statutory Register of Leave (Form I - Delhi Shops & Establishments Act) as PDF
 * Landscape layout matching the exact statutory reference format.
 */
export const downloadFormILeavePdf = (
  employeeData = {},
  companyInfo = {},
  period = {},
  options = {}
) => {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const emp = employeeData || {};
  const establishmentName =
    emp.establishmentName ||
    companyInfo?.name ||
    '—';
  const employeeName = emp.displayName || emp.name || '—';
  const dateOfEmployment = emp.dateOfEmployment || '—';
  const records = emp.rows || [];

  const marginX = 12;
  let currentY = 14;
  const pageWidth = doc.internal.pageSize.getWidth();
  const contentWidth = pageWidth - marginX * 2;

  // Title Block (Matching Image 1 Centered Layout)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(20, 20, 20);
  doc.text('I', pageWidth / 2, currentY, { align: 'center' });
  currentY += 5;

  doc.setFontSize(12);
  doc.text('FORM I', pageWidth / 2, currentY, { align: 'center' });
  currentY += 5;

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(9);
  doc.text('(See Rule 14)', pageWidth / 2, currentY, { align: 'center' });
  currentY += 5;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Register of Leave', pageWidth / 2, currentY, { align: 'center' });
  currentY += 9;

  // Header Details Line 1 & Line 2
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.text(`Name and Establishment :  ${establishmentName}`, marginX, currentY);
  doc.text(`Date of Employment :  ${dateOfEmployment}`, pageWidth - marginX - 70, currentY);
  currentY += 6;

  doc.text(`Name of Employee :  ${employeeName}`, marginX, currentY);
  currentY += 7;

  // 11 Columns matching Image 1
  const headRows = [
    [
      { content: 'Casual or Sickness Leave', colSpan: 5, styles: { halign: 'center', fontStyle: 'bold' } },
      { content: 'Privilege Leave', colSpan: 6, styles: { halign: 'center', fontStyle: 'bold' } },
    ],
    [
      { content: 'Amount of Leave', styles: { halign: 'center' } },
      { content: 'Date of Application if any', styles: { halign: 'center' } },
      { content: 'Leave Availed\nFrom', styles: { halign: 'center' } },
      { content: 'Leave Availed\nTo', styles: { halign: 'center' } },
      { content: 'Total Leave Availed', styles: { halign: 'center' } },
      { content: 'Date of Application', styles: { halign: 'center' } },
      { content: 'Whether Application Granted or Refused Fully or Partly', styles: { halign: 'center' } },
      { content: 'Leave Availed\nFrom', styles: { halign: 'center' } },
      { content: 'Leave Availed\nTo', styles: { halign: 'center' } },
      { content: 'Total Availed', styles: { halign: 'center' } },
      { content: 'Balance at the end of the year', styles: { halign: 'center' } },
    ],
  ];

  const bodyRows = records.map((r) => [
    { content: String(r.casualAmountOfLeave ?? '—'), styles: { halign: 'center' } },
    { content: String(r.casualDateOfApplication ?? '—'), styles: { halign: 'center' } },
    { content: String(r.casualFrom ?? '—'), styles: { halign: 'center' } },
    { content: String(r.casualTo ?? '—'), styles: { halign: 'center' } },
    { content: String(r.casualTotalAvailed ?? '—'), styles: { halign: 'center', fontStyle: 'bold' } },
    { content: String(r.privilegeDateOfApplication ?? '—'), styles: { halign: 'center' } },
    { content: String(r.privilegeGrantedOrRefused ?? '—'), styles: { halign: 'center' } },
    { content: String(r.privilegeFrom ?? '—'), styles: { halign: 'center' } },
    { content: String(r.privilegeTo ?? '—'), styles: { halign: 'center' } },
    { content: String(r.privilegeTotalAvailed ?? '—'), styles: { halign: 'center', fontStyle: 'bold' } },
    { content: String(r.privilegeBalanceAtEnd ?? '—'), styles: { halign: 'center', fontStyle: 'bold' } },
  ]);

  if (bodyRows.length === 0) {
    bodyRows.push([
      {
        content: `No leave transactions recorded for this employee in ${period?.year || new Date().getFullYear()}.`,
        colSpan: 11,
        styles: { halign: 'center', fontStyle: 'italic', textColor: [120, 120, 120], minCellHeight: 8 },
      },
    ]);
  }

  const totalCasual = records.reduce((s, r) => s + (Number(r.casualTotalAvailed) || 0), 0);
  const totalPrivilege = records.reduce((s, r) => s + (Number(r.privilegeTotalAvailed) || 0), 0);

  const footRows = [
    [
      { content: 'Total:', colSpan: 4, styles: { halign: 'right', fontStyle: 'bold' } },
      { content: String(totalCasual), styles: { halign: 'center', fontStyle: 'bold' } },
      { content: '', colSpan: 4, styles: { halign: 'right', fontStyle: 'bold' } },
      { content: String(totalPrivilege), styles: { halign: 'center', fontStyle: 'bold' } },
      { content: String(emp.balances?.remainingPrivilege ?? '—'), styles: { halign: 'center', fontStyle: 'bold' } },
    ],
  ];

  autoTable(doc, {
    startY: currentY,
    margin: { left: marginX, right: marginX, bottom: 15 },
    theme: 'grid',
    head: headRows,
    body: bodyRows,
    foot: footRows,
    headStyles: {
      fillColor: [255, 255, 255],
      textColor: [20, 20, 20],
      fontStyle: 'bold',
      lineColor: [40, 40, 40],
      lineWidth: 0.35,
      fontSize: 8,
      cellPadding: 2,
    },
    bodyStyles: {
      textColor: [20, 20, 20],
      lineColor: [60, 60, 60],
      lineWidth: 0.25,
      fontSize: 8,
      cellPadding: 2.5,
    },
    footStyles: {
      fillColor: [248, 249, 250],
      textColor: [20, 20, 20],
      lineColor: [40, 40, 40],
      lineWidth: 0.3,
      fontSize: 8,
    },
    columnStyles: {
      0: { cellWidth: 20 },
      1: { cellWidth: 26 },
      2: { cellWidth: 21 },
      3: { cellWidth: 21 },
      4: { cellWidth: 20 },
      5: { cellWidth: 26 },
      6: { cellWidth: 38 },
      7: { cellWidth: 21 },
      8: { cellWidth: 21 },
      9: { cellWidth: 20 },
      10: { cellWidth: 'auto' },
    },
  });

  if (options.mode === 'print') {
    doc.autoPrint();
    const pdfBlob = doc.output('blob');
    const pdfUrl = URL.createObjectURL(pdfBlob);
    window.open(pdfUrl, '_blank');
  } else {
    const empSlug = (emp.employeeId || 'Employee').replace(/[^a-zA-Z0-9]/g, '_');
    doc.save(`Register_of_Leave_Form_I_${empSlug}_${period?.year || 2026}.pdf`);
  }
};
