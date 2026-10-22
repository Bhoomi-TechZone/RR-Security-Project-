import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * =========================================================================
 * LOCATION WISE ESI SUMMARY REPORT EXPORTER (PDF, EXCEL, CSV)
 * Matches the official format:
 * - Header: Company Name, ESI Summary Report From month: M.YYYY To M.YYYY, Page # 1
 * - Columns: SrNo | Location Name | Month | TotEmp | Atten. | ESI Wages | 0.75 % | 3.25 % | % | % | % | Total Amt | Year
 * - Grand Total: TotEmp, Atten., ESI Wages, 0.75 %, 3.25 %, %, %, %, Total Amt
 * =========================================================================
 */

export const downloadEsiSummaryLocationExcel = (reportData = {}, options = {}) => {
  const safeData = reportData || {};
  const records = safeData.records || [];
  const grandTotal = safeData.grandTotal || {};
  const companyInfo = safeData.companyInfo || {};
  const clientInfo = safeData.clientInfo || {};
  const period = safeData.period || {};

  const headerCompanyName = clientInfo?.name || companyInfo?.name || 'RR SECURITY & FACILITIES';
  const periodStr = period.periodStr || `From month: ${period.fromMonthNum || 9}.${period.fromYear || 2026} To ${period.toMonthNum || 9}.${period.toYear || 2026}`;

  const aoa = [
    [headerCompanyName],
    [`ESI Summary Report ${periodStr}`],
    [''],
    [
      'SrNo',
      'Location Name',
      'Month',
      'TotEmp',
      'Atten.',
      'ESI Wages',
      '0.75 %',
      '3.25 %',
      '%',
      '%',
      '%',
      'Total Amt',
      'Year',
    ],
  ];

  records.forEach((row, idx) => {
    aoa.push([
      row.srNo || idx + 1,
      row.locationName || '',
      row.month || period.monthName || '',
      Number(row.totEmp || 0),
      Number(Number(row.atten || 0).toFixed(2)),
      Number(Number(row.esiWages || 0).toFixed(2)),
      Number(Number(row.employeeEsi || 0).toFixed(2)),
      Number(Number(row.employerEsi || 0).toFixed(2)),
      0.00,
      0.00,
      0.00,
      Number(Number(row.totalAmt || 0).toFixed(2)),
      row.year || period.fromYear || new Date().getFullYear(),
    ]);
  });

  // Grand Total Row
  aoa.push([
    '',
    'Grand Total',
    '',
    Number(grandTotal.totEmp || 0),
    Number(Number(grandTotal.atten || 0).toFixed(2)),
    Number(Number(grandTotal.esiWages || 0).toFixed(2)),
    Number(Number(grandTotal.employeeEsi || 0).toFixed(2)),
    Number(Number(grandTotal.employerEsi || 0).toFixed(2)),
    0.00,
    0.00,
    0.00,
    Number(Number(grandTotal.totalAmt || 0).toFixed(2)),
    '',
  ]);

  const ws = XLSX.utils.aoa_to_sheet(aoa);
  ws['!cols'] = [
    { wch: 8 },
    { wch: 32 },
    { wch: 14 },
    { wch: 10 },
    { wch: 12 },
    { wch: 16 },
    { wch: 12 },
    { wch: 12 },
    { wch: 8 },
    { wch: 8 },
    { wch: 8 },
    { wch: 14 },
    { wch: 8 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'ESI Location Summary');

  const cleanMonth = (period.fromMonth || 'Monthly').replace(/-/g, '_');
  XLSX.writeFile(wb, `ESI_Summary_Location_Wise_${cleanMonth}.xlsx`);
};

export const downloadEsiSummaryLocationCsv = (reportData = {}, options = {}) => {
  const safeData = reportData || {};
  const records = safeData.records || [];
  const grandTotal = safeData.grandTotal || {};
  const companyInfo = safeData.companyInfo || {};
  const clientInfo = safeData.clientInfo || {};
  const period = safeData.period || {};

  const headerCompanyName = clientInfo?.name || companyInfo?.name || 'RR SECURITY & FACILITIES';
  const periodStr = period.periodStr || `From month: ${period.fromMonthNum || 9}.${period.fromYear || 2026} To ${period.toMonthNum || 9}.${period.toYear || 2026}`;

  const lines = [
    `"${headerCompanyName}"`,
    `"ESI Summary Report ${periodStr}"`,
    ``,
    `"SrNo","Location Name","Month","TotEmp","Atten.","ESI Wages","0.75 %","3.25 %","%","%","%","Total Amt","Year"`,
  ];

  records.forEach((row, idx) => {
    lines.push([
      `"${row.srNo || idx + 1}"`,
      `"${row.locationName || ''}"`,
      `"${row.month || period.monthName || ''}"`,
      `"${row.totEmp || 0}"`,
      `"${Number(row.atten || 0).toFixed(2)}"`,
      `"${Number(row.esiWages || 0).toFixed(2)}"`,
      `"${Number(row.employeeEsi || 0).toFixed(2)}"`,
      `"${Number(row.employerEsi || 0).toFixed(2)}"`,
      `"0.00"`,
      `"0.00"`,
      `"0.00"`,
      `"${Number(row.totalAmt || 0).toFixed(2)}"`,
      `"${row.year || period.fromYear || new Date().getFullYear()}"`,
    ].join(','));
  });

  lines.push([
    `""`,
    `"Grand Total"`,
    `""`,
    `"${grandTotal.totEmp || 0}"`,
    `"${Number(grandTotal.atten || 0).toFixed(2)}"`,
    `"${Number(grandTotal.esiWages || 0).toFixed(2)}"`,
    `"${Number(grandTotal.employeeEsi || 0).toFixed(2)}"`,
    `"${Number(grandTotal.employerEsi || 0).toFixed(2)}"`,
    `"0.00"`,
    `"0.00"`,
    `"0.00"`,
    `"${Number(grandTotal.totalAmt || 0).toFixed(2)}"`,
    `""`,
  ].join(','));

  const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + lines.join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  const cleanMonth = (period.fromMonth || 'Monthly').replace(/-/g, '_');
  link.setAttribute('download', `ESI_Summary_Location_Wise_${cleanMonth}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const downloadEsiSummaryLocationPdf = (reportData = {}, options = {}) => {
  const safeData = reportData || {};
  const records = safeData.records || [];
  const grandTotal = safeData.grandTotal || {};
  const companyInfo = safeData.companyInfo || {};
  const clientInfo = safeData.clientInfo || {};
  const period = safeData.period || {};

  const headerCompanyName = clientInfo?.name || companyInfo?.name || 'RR SECURITY & FACILITIES';
  const periodStr = period.periodStr || `From month: ${period.fromMonthNum || 9}.${period.fromYear || 2026} To ${period.toMonthNum || 9}.${period.toYear || 2026}`;

  // Landscape A4 for wide statutory tabular data
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'pt',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 841.89 pt
  const marginX = 28;
  const contentWidth = pageWidth - marginX * 2; // ~785.89 pt

  let startY = 32;

  // Header matching Image 1:
  // Top left: Company Name
  doc.setFont('courier', 'bold');
  doc.setFontSize(10.5);
  doc.text(headerCompanyName.toUpperCase(), marginX, startY);

  // Top right: Page # 1
  doc.setFont('courier', 'normal');
  doc.setFontSize(9.5);
  doc.text('Page # 1', pageWidth - marginX, startY + 12, { align: 'right' });

  // Subtitle: ESI Summary Report From month: M.YYYY To M.YYYY
  doc.setFont('courier', 'bold');
  doc.setFontSize(9.5);
  doc.text(`ESI Summary Report ${periodStr}`, marginX, startY + 14);

  startY += 26;

  // Body Rows
  const bodyRows = records.map((r, i) => [
    String(r.srNo || i + 1),
    r.locationName || '',
    r.month || period.monthName || '',
    String(r.totEmp || 0),
    Number(r.atten || 0).toFixed(2),
    Number(r.esiWages || 0).toFixed(2),
    Number(r.employeeEsi || 0).toFixed(2),
    Number(r.employerEsi || 0).toFixed(2),
    '0.00',
    '0.00',
    '0.00',
    Number(r.totalAmt || 0).toFixed(2),
    String(r.year || period.fromYear || 2026),
  ]);

  // Grand Total Row
  bodyRows.push([
    {
      content: 'Grand Total',
      colSpan: 3,
      styles: { fontStyle: 'bold', halign: 'left' },
    },
    { content: String(grandTotal.totEmp || 0), styles: { fontStyle: 'bold', halign: 'center' } },
    { content: Number(grandTotal.atten || 0).toFixed(2), styles: { fontStyle: 'bold', halign: 'right' } },
    { content: Number(grandTotal.esiWages || 0).toFixed(2), styles: { fontStyle: 'bold', halign: 'right' } },
    { content: Number(grandTotal.employeeEsi || 0).toFixed(2), styles: { fontStyle: 'bold', halign: 'right' } },
    { content: Number(grandTotal.employerEsi || 0).toFixed(2), styles: { fontStyle: 'bold', halign: 'right' } },
    { content: '0.00', styles: { fontStyle: 'normal', halign: 'right' } },
    { content: '0.00', styles: { fontStyle: 'normal', halign: 'right' } },
    { content: '0.00', styles: { fontStyle: 'normal', halign: 'right' } },
    { content: Number(grandTotal.totalAmt || 0).toFixed(2), styles: { fontStyle: 'bold', halign: 'right' } },
    { content: '', styles: { fontStyle: 'normal' } },
  ]);

  autoTable(doc, {
    startY,
    head: [
      [
        { content: 'SrNo', styles: { halign: 'center' } },
        { content: 'Location Name', styles: { halign: 'left' } },
        { content: 'Month', styles: { halign: 'left' } },
        { content: 'TotEmp', styles: { halign: 'center' } },
        { content: 'Atten.', styles: { halign: 'right' } },
        { content: 'ESI Wages', styles: { halign: 'right' } },
        { content: '0.75 %', styles: { halign: 'right' } },
        { content: '3.25 %', styles: { halign: 'right' } },
        { content: '%', styles: { halign: 'right' } },
        { content: '%', styles: { halign: 'right' } },
        { content: '%', styles: { halign: 'right' } },
        { content: 'Total Amt', styles: { halign: 'right' } },
        { content: 'Year', styles: { halign: 'center' } },
      ],
    ],
    body: bodyRows,
    theme: 'plain',
    styles: {
      font: 'courier',
      fontSize: 8,
      cellPadding: 3.5,
      textColor: [0, 0, 0],
      overflow: 'linebreak',
    },
    headStyles: {
      font: 'courier',
      fontStyle: 'bold',
      fontSize: 8,
      fillColor: [255, 255, 255],
      textColor: [0, 0, 0],
      lineWidth: { top: 0.8, bottom: 0.8 },
      lineColor: [60, 60, 60],
    },
    columnStyles: {
      0: { cellWidth: 32, halign: 'center' },
      1: { cellWidth: 175, halign: 'left' },
      2: { cellWidth: 70, halign: 'left' },
      3: { cellWidth: 46, halign: 'center' },
      4: { cellWidth: 54, halign: 'right' },
      5: { cellWidth: 68, halign: 'right' },
      6: { cellWidth: 54, halign: 'right' },
      7: { cellWidth: 54, halign: 'right' },
      8: { cellWidth: 40, halign: 'right' },
      9: { cellWidth: 40, halign: 'right' },
      10: { cellWidth: 40, halign: 'right' },
      11: { cellWidth: 62, halign: 'right' },
      12: { cellWidth: 50, halign: 'center' },
    },
    didDrawCell: (data) => {
      // Add dashed top/bottom lines to grand total row
      if (data.row.index === bodyRows.length - 1 && data.section === 'body') {
        doc.setDrawColor(60, 60, 60);
        doc.setLineDash([2, 2], 0);
        doc.line(data.cell.x, data.cell.y, data.cell.x + data.cell.width, data.cell.y);
        doc.line(data.cell.x, data.cell.y + data.cell.height, data.cell.x + data.cell.width, data.cell.y + data.cell.height);
        doc.setLineDash([], 0);
      }
    },
    margin: { left: marginX, right: marginX },
  });

  if (options.mode === 'print') {
    doc.autoPrint();
    const blobUrl = doc.output('bloburl');
    window.open(blobUrl, '_blank');
  } else {
    const cleanMonth = (period.fromMonth || 'Monthly').replace(/-/g, '_');
    doc.save(`ESI_Summary_Location_Wise_${cleanMonth}.pdf`);
  }
};
