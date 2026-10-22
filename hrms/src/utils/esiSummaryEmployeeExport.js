import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * =========================================================================
 * EMPLOYEE WISE MONTHLY ESI REPORT EXPORTER (PDF, EXCEL, CSV)
 * Matches the statutory format:
 * - Header: Company/Client Name, EMPLOYEE WISE MONTHLY ESI REPORT, FOR THE MONTH OF :M,YYYY
 * - Columns: Sr#, Code, ESI Code, Employee Name, Days, ESI Wages, Employee ESI@ 0.75%, EXEMPTED EMPLYOEES WAGES :
 * - Total Row: Total :Count, Days, ESI Wages, Employee ESI, Exempted Wages
 * - Summary Box: TOTAL EARNING, EXEMPTED EMPLOYEES WAGES, ESI WAGES,
 *                EMPLOYEES CONTRIBUTION (0.75%), EMPLOYERS CONTRIBUTION (3.25%), TOTAL CONTRIBUTION (4%)
 * =========================================================================
 */

export const downloadEsiSummaryEmployeeExcel = (reportData = {}, options = {}) => {
  const safeData = reportData || {};
  const records = safeData.records || [];
  const totals = safeData.totals || {};
  const companyInfo = safeData.companyInfo || {};
  const clientInfo = safeData.clientInfo || {};
  const period = safeData.period || {};

  const headerCompanyName = clientInfo?.name || companyInfo?.name || 'RR SECURITY & FACILITIES';
  const monthLabel = period.monthLabel || `FOR THE MONTH OF :${period.monthNum || ''},${period.year || ''}`;

  const aoa = [
    [headerCompanyName],
    ['EMPLOYEE WISE MONTHLY ESI REPORT'],
    [monthLabel],
    [''],
    ['Sr#', 'Code', 'ESI Code', 'Employee Name', 'Days', 'ESI Wages', 'Employee ESI@ 0.75%', 'EXEMPTED EMPLYOEES WAGES :'],
  ];

  records.forEach((row, idx) => {
    aoa.push([
      row.srNo || idx + 1,
      row.employeeCode || '',
      row.esiCode || '',
      row.employeeName || '',
      row.days || 0,
      row.esiWages || 0,
      row.employeeEsi || 0,
      row.exemptedWages || 0,
    ]);
  });

  // Total Row
  aoa.push([
    `Total :${totals.count || records.length}`,
    '',
    '',
    '',
    totals.days || 0,
    totals.esiWages || 0,
    totals.employeeEsi || 0,
    totals.exemptedWages || 0,
  ]);

  aoa.push(['']);

  // Summary Block
  aoa.push(['', '', '', 'TOTAL EARNING                  :', totals.totalEarning || 0]);
  aoa.push(['', '', '', 'EXEEMPTED EMPLYOEES WAGES :', totals.exemptedWages || 0]);
  aoa.push(['', '', '', 'ESI WAGES                      :', totals.esiWages || 0]);
  aoa.push(['', '', '', 'EMPLOYEES CONTRIBUTION  : 0.75%', totals.employeeEsi || 0]);
  aoa.push(['', '', '', 'EMPLOYERS CONTRIBUTION  : 3.25%', totals.employerEsi || 0]);
  aoa.push(['', '', '', 'TOTAL CONTRIBUTION      : 4%', totals.totalContribution || 0]);

  const ws = XLSX.utils.aoa_to_sheet(aoa);
  ws['!cols'] = [
    { wch: 8 },
    { wch: 12 },
    { wch: 16 },
    { wch: 28 },
    { wch: 10 },
    { wch: 14 },
    { wch: 22 },
    { wch: 26 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'ESI Employee Summary');

  const cleanMonth = (period.month || 'Monthly').replace(/-/g, '_');
  XLSX.writeFile(wb, `ESI_Summary_Employee_Wise_${cleanMonth}.xlsx`);
};

export const downloadEsiSummaryEmployeeCsv = (reportData = {}, options = {}) => {
  const safeData = reportData || {};
  const records = safeData.records || [];
  const totals = safeData.totals || {};
  const companyInfo = safeData.companyInfo || {};
  const clientInfo = safeData.clientInfo || {};
  const period = safeData.period || {};

  const headerCompanyName = clientInfo?.name || companyInfo?.name || 'RR SECURITY & FACILITIES';
  const monthLabel = period.monthLabel || `FOR THE MONTH OF :${period.monthNum || ''},${period.year || ''}`;

  const lines = [
    `"${headerCompanyName}"`,
    `"EMPLOYEE WISE MONTHLY ESI REPORT"`,
    `"${monthLabel}"`,
    ``,
    `"Sr#","Code","ESI Code","Employee Name","Days","ESI Wages","Employee ESI@ 0.75%","EXEMPTED EMPLYOEES WAGES :"`,
  ];

  records.forEach((row, idx) => {
    lines.push([
      `"${row.srNo || idx + 1}"`,
      `"${row.employeeCode || ''}"`,
      `"${row.esiCode || ''}"`,
      `"${row.employeeName || ''}"`,
      `"${row.days || 0}"`,
      `"${row.esiWages || 0}"`,
      `"${row.employeeEsi || 0}"`,
      `"${row.exemptedWages || 0}"`,
    ].join(','));
  });

  lines.push([
    `"Total :${totals.count || records.length}"`,
    `""`,
    `""`,
    `""`,
    `"${totals.days || 0}"`,
    `"${totals.esiWages || 0}"`,
    `"${totals.employeeEsi || 0}"`,
    `"${totals.exemptedWages || 0}"`,
  ].join(','));

  lines.push(``);
  lines.push(`"","","","TOTAL EARNING                  :","${totals.totalEarning || 0}"`);
  lines.push(`"","","","EXEEMPTED EMPLYOEES WAGES :","${totals.exemptedWages || 0}"`);
  lines.push(`"","","","ESI WAGES                      :","${totals.esiWages || 0}"`);
  lines.push(`"","","","EMPLOYEES CONTRIBUTION  : 0.75%","${totals.employeeEsi || 0}"`);
  lines.push(`"","","","EMPLOYERS CONTRIBUTION  : 3.25%","${totals.employerEsi || 0}"`);
  lines.push(`"","","","TOTAL CONTRIBUTION      : 4%","${totals.totalContribution || 0}"`);

  const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + lines.join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  const cleanMonth = (period.month || 'Monthly').replace(/-/g, '_');
  link.setAttribute('download', `ESI_Summary_Employee_Wise_${cleanMonth}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const downloadEsiSummaryEmployeePdf = (reportData = {}, options = {}) => {
  const safeData = reportData || {};
  const records = safeData.records || [];
  const totals = safeData.totals || {};
  const companyInfo = safeData.companyInfo || {};
  const clientInfo = safeData.clientInfo || {};
  const period = safeData.period || {};

  const headerCompanyName = clientInfo?.name || companyInfo?.name || 'RR SECURITY & FACILITIES';
  const monthLabel = period.monthLabel || `FOR THE MONTH OF :${period.monthNum || ''},${period.year || ''}`;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 595.28 pt
  const marginX = 26;
  const contentWidth = pageWidth - marginX * 2; // 543.28 pt

  let startY = 28;

  // Header Box (Exact 3-Row Bordered Header)
  const headerBoxH = 54;
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(1);
  doc.rect(marginX, startY, contentWidth, headerBoxH);

  doc.line(marginX, startY + 18, marginX + contentWidth, startY + 18);
  doc.line(marginX, startY + 36, marginX + contentWidth, startY + 36);

  // Line 1: Company Name
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text(headerCompanyName.toUpperCase(), pageWidth / 2, startY + 13, { align: 'center' });

  // Line 2: Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('EMPLOYEE WISE MONTHLY ESI REPORT', pageWidth / 2, startY + 30, { align: 'center' });

  // Line 3: Month
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text(monthLabel.toUpperCase(), pageWidth / 2, startY + 48, { align: 'center' });

  startY += headerBoxH + 8;

  // Prepare Body Rows
  const bodyRows = records.map((r, i) => [
    String(r.srNo || i + 1),
    r.employeeCode || '',
    r.esiCode || '',
    r.employeeName || '',
    String(r.days || 0),
    String(r.esiWages || 0),
    String(r.employeeEsi || 0),
    String(r.exemptedWages || 0),
  ]);

  // Total Row
  bodyRows.push([
    {
      content: `Total :${totals.count || records.length}`,
      colSpan: 4,
      styles: { fontStyle: 'bold', halign: 'left' },
    },
    { content: String(totals.days || 0), styles: { fontStyle: 'bold', halign: 'center' } },
    { content: String(totals.esiWages || 0), styles: { fontStyle: 'bold', halign: 'right' } },
    { content: String(totals.employeeEsi || 0), styles: { fontStyle: 'bold', halign: 'right' } },
    { content: String(totals.exemptedWages || 0), styles: { fontStyle: 'bold', halign: 'right' } },
  ]);

  // Append 6-line Summary Block inside the table structure
  const summaryRows = [
    [
      { content: '', colSpan: 3, styles: { border: 0 } },
      { content: 'TOTAL EARNING                  :', colSpan: 2, styles: { fontStyle: 'bold', halign: 'left' } },
      { content: String(totals.totalEarning || 0), colSpan: 2, styles: { fontStyle: 'bold', halign: 'right' } },
      { content: '', styles: { border: 0 } },
    ],
    [
      { content: '', colSpan: 3, styles: { border: 0 } },
      { content: 'EXEEMPTED EMPLYOEES WAGES :', colSpan: 2, styles: { fontStyle: 'bold', halign: 'left' } },
      { content: String(totals.exemptedWages || 0), colSpan: 2, styles: { fontStyle: 'bold', halign: 'right' } },
      { content: '', styles: { border: 0 } },
    ],
    [
      { content: '', colSpan: 3, styles: { border: 0 } },
      { content: 'ESI WAGES                      :', colSpan: 2, styles: { fontStyle: 'bold', halign: 'left' } },
      { content: String(totals.esiWages || 0), colSpan: 2, styles: { fontStyle: 'bold', halign: 'right' } },
      { content: '', styles: { border: 0 } },
    ],
    [
      { content: '', colSpan: 3, styles: { border: 0 } },
      { content: 'EMPLOYEES CONTRIBUTION  : 0.75%', colSpan: 2, styles: { fontStyle: 'bold', halign: 'left' } },
      { content: String(totals.employeeEsi || 0), colSpan: 2, styles: { fontStyle: 'bold', halign: 'right' } },
      { content: '', styles: { border: 0 } },
    ],
    [
      { content: '', colSpan: 3, styles: { border: 0 } },
      { content: 'EMPLOYERS CONTRIBUTION  : 3.25%', colSpan: 2, styles: { fontStyle: 'bold', halign: 'left' } },
      { content: String(totals.employerEsi || 0), colSpan: 2, styles: { fontStyle: 'bold', halign: 'right' } },
      { content: '', styles: { border: 0 } },
    ],
    [
      { content: '', colSpan: 3, styles: { border: 0 } },
      { content: 'TOTAL CONTRIBUTION      : 4%', colSpan: 2, styles: { fontStyle: 'bold', halign: 'left' } },
      { content: String(totals.totalContribution || 0), colSpan: 2, styles: { fontStyle: 'bold', halign: 'right' } },
      { content: '', styles: { border: 0 } },
    ],
  ];

  summaryRows.forEach((row) => bodyRows.push(row));

  // AutoTable Config
  autoTable(doc, {
    startY,
    head: [
      [
        { content: 'Sr#', styles: { halign: 'center' } },
        { content: 'Code', styles: { halign: 'center' } },
        { content: 'ESI Code', styles: { halign: 'center' } },
        { content: 'Employee Name', styles: { halign: 'left' } },
        { content: 'Days', styles: { halign: 'center' } },
        { content: 'ESI Wages', styles: { halign: 'right' } },
        { content: 'Employee\nESI@ 0.75%', styles: { halign: 'right' } },
        { content: 'EXEMPTED\nEMPLYOEES\nWAGES :', styles: { halign: 'right' } },
      ],
    ],
    body: bodyRows,
    theme: 'plain',
    styles: {
      font: 'helvetica',
      fontSize: 7.5,
      cellPadding: 3,
      lineWidth: 0.8,
      lineColor: [0, 0, 0],
      overflow: 'linebreak',
    },
    headStyles: {
      fillColor: [255, 255, 255],
      textColor: [0, 0, 0],
      fontStyle: 'bold',
      lineWidth: 0.8,
      lineColor: [0, 0, 0],
      valign: 'middle',
    },
    columnStyles: {
      0: { cellWidth: 28, halign: 'center' },
      1: { cellWidth: 46, halign: 'center' },
      2: { cellWidth: 72, halign: 'center' },
      3: { cellWidth: 144, halign: 'left' },
      4: { cellWidth: 38, halign: 'center' },
      5: { cellWidth: 62, halign: 'right' },
      6: { cellWidth: 68, halign: 'right' },
      7: { cellWidth: 85.28, halign: 'right' },
    },
    margin: { left: marginX, right: marginX },
  });

  if (options.mode === 'print') {
    doc.autoPrint();
    const blobUrl = doc.output('bloburl');
    window.open(blobUrl, '_blank');
  } else {
    const cleanMonth = (period.month || 'Monthly').replace(/-/g, '_');
    doc.save(`ESI_Summary_Employee_Wise_${cleanMonth}.pdf`);
  }
};
