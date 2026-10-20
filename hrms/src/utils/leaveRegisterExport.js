import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Download Statutory Register of Leave (Form I / Form XXV) as Excel (.xlsx) or CSV (.csv)
 * Matches the exact statutory 5-column layout shown in user-uploaded Register of Leave reference.
 */
export const downloadLeaveRegisterExcel = (
  records = [],
  companyInfo = {},
  period = {},
  totals = {},
  options = {}
) => {
  const establishmentName = companyInfo?.name || 'RR SECURITY & FACILITIES';
  const establishmentAddress =
    companyInfo?.address ||
    'G-75/A, Ground Floor, Block-G M.B. EXTN., Badarpur New Delhi-110044';
  const registrationNo =
    companyInfo?.registrationNo ||
    companyInfo?.gstin ||
    companyInfo?.pan ||
    'DL-SHOPS/110044/2016';

  const aoa = [
    // Top Establishment Box (Image 1 Header Box)
    ['Name of the Establishment/Shop :', establishmentName],
    ['Address :', establishmentAddress],
    ['Registration No :', registrationNo],
    [''],
    // 5 Columns matching Image 1
    [
      'Date of application',
      'Applied From',
      'Applied to',
      'No. of days',
      'No. of days to which the employee is entitled',
    ],
    // Numbered column row 1 to 5
    ['1', '2', '3', '4', '5'],
  ];

  // Records
  records.forEach((r) => {
    aoa.push([
      r.dateOfApplication || '—',
      r.appliedFrom || '—',
      r.appliedTo || '—',
      Number(r.noOfDays) || 0,
      Number(r.entitledDays) || 12,
    ]);
  });

  // Summary Row
  const totalDays = totals?.totalDays ?? records.reduce((s, r) => s + (Number(r.noOfDays) || 0), 0);
  aoa.push([
    `Total Applications: ${records.length}`,
    '',
    'Total Days:',
    totalDays,
    '',
  ]);

  // Bottom Statutory Notes (Matching Image 1)
  aoa.push(['']);
  aoa.push(['Note: Sick Leave (Same as the statement for leave with wages).']);
  aoa.push(['Casual Leave ( Same as the statement for leave with wages)']);

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(aoa);

  // Set column widths
  ws['!cols'] = [
    { wch: 22 }, // Date of application
    { wch: 18 }, // Applied From
    { wch: 18 }, // Applied to
    { wch: 16 }, // No. of days
    { wch: 45 }, // No. of days entitled
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Register of Leave');

  const fileName = `Register_of_Leave_${period?.month || 'Period'}.${options.format === 'csv' ? 'csv' : 'xlsx'}`;

  if (options.format === 'csv') {
    XLSX.writeFile(wb, fileName, { bookType: 'csv' });
  } else {
    XLSX.writeFile(wb, fileName);
  }
};

/**
 * Download Statutory Register of Leave as CSV
 */
export const downloadLeaveRegisterCsv = (
  records = [],
  companyInfo = {},
  period = {},
  totals = {},
  options = {}
) => {
  return downloadLeaveRegisterExcel(records, companyInfo, period, totals, {
    ...options,
    format: 'csv',
  });
};

/**
 * Generate Printable / Downloadable Statutory Register of Leave PDF (jsPDF + autoTable)
 * Replicates the exact statutory 5-column layout, establishment header box, and bottom notes.
 */
export const downloadLeaveRegisterPdf = (
  records = [],
  companyInfo = {},
  period = {},
  totals = {},
  options = {}
) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const establishmentName = companyInfo?.name || 'RR SECURITY & FACILITIES';
  const establishmentAddress =
    companyInfo?.address ||
    'G-75/A, Ground Floor, Block-G M.B. EXTN., Badarpur New Delhi-110044';
  const registrationNo =
    companyInfo?.registrationNo ||
    companyInfo?.gstin ||
    companyInfo?.pan ||
    'DL-SHOPS/110044/2016';

  const marginX = 14;
  let currentY = 16;
  const pageWidth = doc.internal.pageSize.getWidth();
  const contentWidth = pageWidth - marginX * 2;

  // Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('REGISTER OF LEAVE', pageWidth / 2, currentY, { align: 'center' });
  currentY += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  doc.text('Form I (Delhi Shops & Establishments Act) / Form XXV (Factories Rules)', pageWidth / 2, currentY, { align: 'center' });
  currentY += 8;

  // Draw Top Establishment Box (Image 1 Header Box with 3 rows)
  doc.setDrawColor(30, 30, 30);
  doc.setLineWidth(0.35);

  const boxHeight = 27;
  const rowHeight = 9;

  // Outer Box
  doc.rect(marginX, currentY, contentWidth, boxHeight);

  // Row 1 Divider
  doc.line(marginX, currentY + rowHeight, marginX + contentWidth, currentY + rowHeight);
  // Row 2 Divider
  doc.line(marginX, currentY + rowHeight * 2, marginX + contentWidth, currentY + rowHeight * 2);

  // Row 1 Text
  doc.setTextColor(20, 20, 20);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text('Name of the Establishment/Shop :', marginX + 3, currentY + 6);
  doc.setFont('helvetica', 'normal');
  doc.text(` ${establishmentName}`, marginX + 62, currentY + 6);

  // Row 2 Text
  doc.setFont('helvetica', 'bold');
  doc.text('Address :', marginX + 3, currentY + rowHeight + 6);
  doc.setFont('helvetica', 'normal');
  doc.text(` ${establishmentAddress}`, marginX + 22, currentY + rowHeight + 6);

  // Row 3 Text
  doc.setFont('helvetica', 'bold');
  doc.text('Registration No :', marginX + 3, currentY + rowHeight * 2 + 6);
  doc.setFont('helvetica', 'normal');
  doc.text(` ${registrationNo}`, marginX + 36, currentY + rowHeight * 2 + 6);

  currentY += boxHeight + 8;

  // 5 Columns matching Image 1
  const headRows = [
    [
      { content: 'Date of application', styles: { halign: 'center', valign: 'middle' } },
      { content: 'Applied From', styles: { halign: 'center', valign: 'middle' } },
      { content: 'Applied to', styles: { halign: 'center', valign: 'middle' } },
      { content: 'No. of days', styles: { halign: 'center', valign: 'middle' } },
      { content: 'No. of days to which the employee is entitled', styles: { halign: 'center', valign: 'middle' } },
    ],
    [
      { content: '1', styles: { halign: 'center', fontStyle: 'bold' } },
      { content: '2', styles: { halign: 'center', fontStyle: 'bold' } },
      { content: '3', styles: { halign: 'center', fontStyle: 'bold' } },
      { content: '4', styles: { halign: 'center', fontStyle: 'bold' } },
      { content: '5', styles: { halign: 'center', fontStyle: 'bold' } },
    ],
  ];

  const bodyRows = records.map((r) => [
    { content: r.dateOfApplication || '—', styles: { halign: 'center' } },
    { content: r.appliedFrom || '—', styles: { halign: 'center' } },
    { content: r.appliedTo || '—', styles: { halign: 'center' } },
    { content: String(r.noOfDays || 1), styles: { halign: 'center', fontStyle: 'bold' } },
    { content: String(r.entitledDays || 12), styles: { halign: 'center' } },
  ]);

  // If table has empty rows to make it look full like Image 1:
  const minRows = Math.max(10, bodyRows.length);
  for (let i = bodyRows.length; i < minRows; i++) {
    bodyRows.push([
      { content: '', styles: { minCellHeight: 8 } },
      { content: '', styles: { minCellHeight: 8 } },
      { content: '', styles: { minCellHeight: 8 } },
      { content: '', styles: { minCellHeight: 8 } },
      { content: '', styles: { minCellHeight: 8 } },
    ]);
  }

  const totalDays = totals?.totalDays ?? records.reduce((s, r) => s + (Number(r.noOfDays) || 0), 0);
  const footRows = [
    [
      { content: `Total Records: ${records.length}`, styles: { halign: 'left', fontStyle: 'bold' } },
      { content: '', styles: { halign: 'center' } },
      { content: 'Total Days:', styles: { halign: 'right', fontStyle: 'bold' } },
      { content: String(totalDays), styles: { halign: 'center', fontStyle: 'bold' } },
      { content: '', styles: { halign: 'center' } },
    ],
  ];

  autoTable(doc, {
    startY: currentY,
    margin: { left: marginX, right: marginX, bottom: 25 },
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
      fontSize: 9,
      cellPadding: 3,
    },
    bodyStyles: {
      textColor: [20, 20, 20],
      lineColor: [60, 60, 60],
      lineWidth: 0.25,
      fontSize: 9,
      cellPadding: 3,
    },
    footStyles: {
      fillColor: [248, 249, 250],
      textColor: [20, 20, 20],
      lineColor: [40, 40, 40],
      lineWidth: 0.3,
      fontSize: 9,
    },
    columnStyles: {
      0: { cellWidth: 34 },
      1: { cellWidth: 34 },
      2: { cellWidth: 34 },
      3: { cellWidth: 28 },
      4: { cellWidth: 'auto' },
    },
    didDrawPage: (data) => {
      // Bottom notes on last page or bottom of table
    },
  });

  const finalY = doc.lastAutoTable.finalY + 8;
  const pageHeight = doc.internal.pageSize.getHeight();

  let notesY = finalY;
  if (notesY + 16 > pageHeight) {
    doc.addPage();
    notesY = 20;
  }

  // Statutory Notes matching Image 1 exactly
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(30, 30, 30);
  doc.text('Note: Sick Leave (Same as the statement for leave with wages).', marginX, notesY);
  notesY += 6;
  doc.text('Casual Leave ( Same as the statement for leave with wages)', marginX, notesY);

  if (options.mode === 'print') {
    doc.autoPrint();
    const pdfBlob = doc.output('blob');
    const pdfUrl = URL.createObjectURL(pdfBlob);
    window.open(pdfUrl, '_blank');
  } else {
    doc.save(`Register_of_Leave_${period?.month || 'Report'}.pdf`);
  }
};
