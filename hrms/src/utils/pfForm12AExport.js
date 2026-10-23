import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Statutory EPFO PF Form 12A (Revised) Export Utility (PDF ONLY per explicit user request)
 * Monthly statement of EPF, EPS, and EDLI payments & subscribers movement
 *
 * Statutory References:
 * - EMPLOYEES' PROVIDENT FUND AND MISC. PRO. ACT 1952
 * - EMPLOYEES' PENSION SCHEME 1995 [PARA 20(4)]
 */

export function downloadPfForm12APdf(reportData = {}, options = {}) {
  const comp = reportData.companyInfo || {};
  const monthLabel = reportData.monthLabel || 'May 2026';
  const currencyPeriod = reportData.currencyPeriod || '01 April 2026 to 31 March 2027';
  const statutoryRate = reportData.statutoryRate || '12%';
  const accountRows = reportData.accountRows || [];
  const subscribersMovement = reportData.subscribersMovement || [];
  const employeeCounts = reportData.employeeCounts || { contract: 0, rest: 0, total: 0 };
  const bankInfo = reportData.bankInfo || { name: 'State Bank of India', address: 'EPFO Collection Account, Main Branch' };
  const mode = options.mode || 'download';

  // Format Helper for Currency/Numbers
  const formatVal = (v) => {
    if (v === null || v === undefined) return '-Nil-';
    if (typeof v === 'string') return v;
    return Number(v).toFixed(2);
  };

  const formatInt = (v) => {
    if (v === null || v === undefined) return '0';
    return String(v);
  };

  // Orientation landscape provides exact fit for wide 7-column Table 1 and Table 2
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'pt',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // ~841.89 pt
  const pageHeight = doc.internal.pageSize.getHeight(); // ~595.28 pt
  const marginX = 36;
  const contentWidth = pageWidth - marginX * 2; // ~769.89 pt

  let y = 28;

  // 1. Top Right: ( ONLY FOR ESTABLISHMENT )
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59);
  doc.text('( ONLY FOR  ESTABLISHMENT )', pageWidth - marginX, y, { align: 'right' });

  // 2. Centered Titles
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(15, 23, 42);
  doc.text("EMPLOYEES' PROVIDENT FUND ORGANISATION", pageWidth / 2, y + 4, { align: 'center' });

  y += 18;
  doc.setFontSize(12);
  doc.text('FORM 12-A (REVISED)', pageWidth / 2, y, { align: 'center' });

  y += 14;
  doc.setFontSize(8.5);
  doc.text("EMPLOYEES' PROVIDENT FUND AND MISC. PRO. ACT 1952 - EMPLOYEES' PENSION SCHEME 1995 [PARA 20(4)]", pageWidth / 2, y, { align: 'center' });

  y += 20;

  // 3. Three-Column Meta Section
  // Left: Establishment Name, Address, Code No.
  const leftX = marginX;
  const colWidthLeft = 240;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text('Name and Address of the Establishment', leftX, y);

  const estName = comp.name || 'RR Security & Facilities';
  const estAddress = comp.address || 'G-75/a, Gali No. 04 Block G Molarband Extn. Badarpur, SOUTH DELHI - 110044';
  const estCode = comp.establishmentCode || comp.employerPfCode || 'PFNOTAVAILABLE';

  let currentLeftY = y + 12;
  doc.setFont('helvetica', 'bold');
  doc.text(estName, leftX, currentLeftY);

  currentLeftY += 11;
  doc.setFont('helvetica', 'normal');
  const addressLines = doc.splitTextToSize(estAddress.replace(/[\r\n]+/g, ', '), colWidthLeft);
  doc.text(addressLines, leftX, currentLeftY);
  currentLeftY += addressLines.length * 10 + 6;

  doc.setFont('helvetica', 'normal');
  doc.text('Code No. ', leftX, currentLeftY);
  doc.setFont('helvetica', 'bold');
  doc.text(estCode, leftX + doc.getTextWidth('Code No. '), currentLeftY);

  // Middle: Currency period, Statement month, Statutory rate
  const midX = marginX + 270;
  let currentMidY = y;

  doc.setFont('helvetica', 'normal');
  doc.text('Currency period from ', midX, currentMidY);
  doc.setFont('helvetica', 'bold');
  doc.text(currencyPeriod, midX + doc.getTextWidth('Currency period from '), currentMidY);

  currentMidY += 20;
  doc.setFont('helvetica', 'normal');
  doc.text('Statement of contribution for the month of ', midX, currentMidY);
  doc.setFont('helvetica', 'bold');
  doc.text(monthLabel, midX + doc.getTextWidth('Statement of contribution for the month of '), currentMidY);

  currentMidY += 20;
  doc.setFont('helvetica', 'normal');
  doc.text('Statutory rate of contribution: ', midX, currentMidY);
  doc.setFont('helvetica', 'bold');
  doc.text(statutoryRate, midX + doc.getTextWidth('Statutory rate of contribution: '), currentMidY);

  // Right: ( To be filled by EPFO ), Group Code, Establishment Status
  const rightX = pageWidth - marginX - 160;
  let currentRightY = y;

  doc.setFont('helvetica', 'normal');
  doc.text('( To be filled by EPFO)', rightX, currentRightY);

  currentRightY += 20;
  doc.text('Group Code', rightX, currentRightY);

  currentRightY += 20;
  doc.text('Establishment Status', rightX, currentRightY);

  y = Math.max(currentLeftY, currentMidY, currentRightY) + 16;

  // 4. Table 1: Account Particulars, Wages, Contributions & Admin Charges
  // Multi-tier header matching reference image:
  // Row 1: Particulars (rowspan 2) | Wages... (rowspan 2) | Amount of contribution (colspan 2) | Amount of contribution remitted (colspan 3) | Amount of administrative charges due (rowspan 2) | Amount of administrative charges remitted (rowspan 2) | Date of remittance... (rowspan 2)
  // Row 2: Recovered from Employees | Payable by Employer | Employees' contribution | VPF | Employer's contribution
  // Row 3: 1 | 2 | 3 (colspan 2) | 4 (colspan 3) | 5 | 6 | 7
  const table1Headers = [
    [
      { content: 'Particulars', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
      { content: 'Wages on which\ncontributions\nare payable', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
      { content: 'Amount of contribution', colSpan: 2, styles: { halign: 'center', valign: 'middle' } },
      { content: 'Amount of contribution remitted', colSpan: 3, styles: { halign: 'center', valign: 'middle' } },
      { content: 'Amount of\nadministrative\ncharges due', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
      { content: 'Amount of\nadministrative\ncharges\nremitted', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
      { content: 'Date of remittance\n(Enclose triple\ncopies\nof challans)', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
    ],
    [
      { content: 'Recovered\nfrom the\nEmployees', styles: { halign: 'center', valign: 'middle' } },
      { content: 'Payable\nby the\nEmployer', styles: { halign: 'center', valign: 'middle' } },
      { content: "Employees'\ncontribution", styles: { halign: 'center', valign: 'middle' } },
      { content: 'VPF', styles: { halign: 'center', valign: 'middle' } },
      { content: "Employer's\ncontribution", styles: { halign: 'center', valign: 'middle' } },
    ],
    [
      { content: '1', styles: { halign: 'center' } },
      { content: '2', styles: { halign: 'center' } },
      { content: '3', colSpan: 2, styles: { halign: 'center' } },
      { content: '4', colSpan: 3, styles: { halign: 'center' } },
      { content: '5', styles: { halign: 'center' } },
      { content: '6', styles: { halign: 'center' } },
      { content: '7', styles: { halign: 'center' } },
    ],
  ];

  const table1Body = accountRows.map((row) => [
    { content: row.accountName || '', styles: { halign: 'left', fontStyle: 'bold' } },
    { content: row.wages > 0 ? Number(row.wages).toFixed(2) : (row.wages === 0 ? '0.00' : '-Nil-'), styles: { halign: 'right' } },
    { content: formatVal(row.recoveredFromEmployees), styles: { halign: 'center' } },
    { content: formatVal(row.payableByEmployer), styles: { halign: 'center' } },
    { content: formatVal(row.remittedEmployees), styles: { halign: 'center' } },
    { content: formatVal(row.vpf), styles: { halign: 'center' } },
    { content: formatVal(row.remittedEmployer), styles: { halign: 'center' } },
    { content: formatVal(row.adminChargesDue), styles: { halign: 'center' } },
    { content: formatVal(row.adminChargesRemitted), styles: { halign: 'center' } },
    { content: row.dateOfRemittance || '', styles: { halign: 'center' } },
  ]);

  autoTable(doc, {
    startY: y,
    margin: { left: marginX, right: marginX },
    tableWidth: contentWidth,
    head: table1Headers,
    body: table1Body,
    theme: 'plain',
    styles: {
      font: 'helvetica',
      fontSize: 7.5,
      textColor: [15, 23, 42],
      lineWidth: 0.75,
      lineColor: [0, 0, 0],
      cellPadding: { top: 3.5, bottom: 3.5, left: 3, right: 3 },
      overflow: 'linebreak',
    },
    headStyles: {
      fillColor: [255, 255, 255],
      textColor: [0, 0, 0],
      fontStyle: 'bold',
      lineWidth: 0.75,
      lineColor: [0, 0, 0],
    },
    columnStyles: {
      0: { cellWidth: 92 },
      1: { cellWidth: 88 },
      2: { cellWidth: 70 },
      3: { cellWidth: 64 },
      4: { cellWidth: 72 },
      5: { cellWidth: 50 },
      6: { cellWidth: 72 },
      7: { cellWidth: 80 },
      8: { cellWidth: 80 },
      9: { cellWidth: 101 },
    },
  });

  y = doc.lastAutoTable.finalY + 12;

  // 5. Middle Information Section (Total Employees & Bank Information)
  const empColX = marginX;
  const bankColX = marginX + 250;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(`Total No. of Employees        ${employeeCounts.total || 0}`, empColX, y);
  doc.text('(a) Contract', empColX, y + 12);
  doc.text('(b) Rest', empColX, y + 24);
  doc.text(`(c) Total                     ${employeeCounts.total || 0}`, empColX, y + 36);

  // Bank Info
  doc.text('Name and Address of the', bankColX, y);
  doc.text('bank in which the amount', bankColX, y + 10);
  doc.text('is remitted', bankColX, y + 20);

  doc.setFont('helvetica', 'bold');
  doc.text(bankInfo.name || 'State Bank of India', bankColX + 130, y);
  doc.setFont('helvetica', 'normal');
  doc.text(bankInfo.address || 'EPFO Collection Account', bankColX + 130, y + 10);

  y += 46;

  // 6. Table 2: Details of Subscribers Movement (EPF, EPS, EDLI) & Signature Block
  const table2Width = 580;
  const table2Headers = [
    [
      { content: 'Details of Subscribers', styles: { halign: 'left', fontStyle: 'bold' } },
      { content: 'EPF', styles: { halign: 'center', fontStyle: 'bold' } },
      { content: 'EPS', styles: { halign: 'center', fontStyle: 'bold' } },
      { content: 'EDLI', styles: { halign: 'center', fontStyle: 'bold' } },
    ],
  ];

  const table2Body = subscribersMovement.map((row) => [
    { content: row.particulars || '', styles: { halign: 'left' } },
    { content: formatInt(row.epf), styles: { halign: 'center' } },
    { content: formatInt(row.eps), styles: { halign: 'center' } },
    { content: formatInt(row.edli), styles: { halign: 'center' } },
  ]);

  autoTable(doc, {
    startY: y,
    margin: { left: marginX, right: pageWidth - marginX - table2Width },
    tableWidth: table2Width,
    head: table2Headers,
    body: table2Body,
    theme: 'plain',
    styles: {
      font: 'helvetica',
      fontSize: 8,
      textColor: [15, 23, 42],
      lineWidth: 0.75,
      lineColor: [0, 0, 0],
      cellPadding: { top: 3.5, bottom: 3.5, left: 4, right: 4 },
    },
    headStyles: {
      fillColor: [255, 255, 255],
      textColor: [0, 0, 0],
      fontStyle: 'bold',
      lineWidth: 0.75,
      lineColor: [0, 0, 0],
    },
    columnStyles: {
      0: { cellWidth: 280 },
      1: { cellWidth: 100 },
      2: { cellWidth: 100 },
      3: { cellWidth: 100 },
    },
  });

  // Signature Block to the right of Table 2 (matching reference image)
  const signX = pageWidth - marginX - 140;
  const signY = y + 45;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text('Signature of the Employer', signX, signY, { align: 'center' });
  doc.text('(with office seal)', signX, signY + 12, { align: 'center' });

  // 7. Output according to mode
  const safeFilename = `PF_Form_12A_${String(monthLabel).replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;

  if (mode === 'print') {
    const pdfBlobUrl = doc.output('bloburl');
    const printWindow = window.open(pdfBlobUrl, '_blank');
    if (printWindow) {
      printWindow.onload = () => {
        printWindow.focus();
        printWindow.print();
      };
    }
  } else {
    doc.save(safeFilename);
  }
}
