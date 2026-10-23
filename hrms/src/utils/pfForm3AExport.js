import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Download or Print Statutory EPFO Form 3A (Revised) - Contribution Card
 * RULES:
 * 1. STRICTLY WITHOUT LOGO (No circular EPFO crest, no company logo)
 * 2. Uses Admin Company Name & Address in Establishment Block
 * 3. Exact reproduction of the statutory Form 3A (Revised) layout
 */
export async function downloadPfForm3APdf(
  reportData = {},
  options = {}
) {
  const cards = reportData.cards || (reportData.activeCard ? [reportData.activeCard] : []);
  const activeCard = reportData.activeCard || cards[0] || {};
  const comp = reportData.companyInfo || {};
  const currencyPeriod = reportData.currencyPeriod || { label: '01 Apr 2025 to 31 Mar 2026' };
  const mode = options.mode || 'download';
  const scope = options.scope || 'single'; // 'single' | 'all'

  const targetCards = scope === 'all' && cards.length > 0 ? cards : [activeCard];

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 595.28 pt
  const pageHeight = doc.internal.pageSize.getHeight(); // 841.89 pt
  const marginX = 36;
  const contentWidth = pageWidth - marginX * 2; // 523.28 pt

  targetCards.forEach((card, pageIdx) => {
    if (pageIdx > 0) {
      doc.addPage();
    }

    const empName = card.name || 'Member';
    const fatherName = card.fatherHusbandName || '-';
    const accountNo = card.accountNo || 'DSNHP3718318000/0000001';
    const adminName = (card.establishmentName || comp.name || 'RR SECURITY & FACILITIES').toUpperCase();
    const adminAddress = card.establishmentAddress || comp.address || 'G-75/a, Gali No. 04 Block G Molarband Extn. Badarpur SOUTH DELHI';
    const statutoryRate = card.statutoryRate || '12%';
    const exitDate = card.exitDate || '';
    const exitReason = card.exitReason || '';

    let y = 32;

    // 1. Top Sub-heading (Centered)
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(30, 41, 59);
    doc.text('( For Unexempted Establishments Only )', pageWidth / 2, y, { align: 'center' });

    // Top Right Box: Form - 3A (Revised)
    const boxWidth = 92;
    const boxHeight = 28;
    const boxX = pageWidth - marginX - boxWidth;
    const boxY = y - 4;
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(1);
    doc.rect(boxX, boxY, boxWidth, boxHeight);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('Form - 3A', boxX + boxWidth / 2, boxY + 11, { align: 'center' });
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('(Revised)', boxX + boxWidth / 2, boxY + 22, { align: 'center' });

    y += 20;

    // 2. Main Title (Centered, Strictly NO LOGO)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.text("EMPLOYEES' PROVIDENT FUND ORGANISATION", pageWidth / 2, y, { align: 'center' });

    y += 13;
    doc.setFontSize(9);
    doc.text('THE EMPLOYEES\' PROVIDENT FUND SCHEME, 1952 [Paras 35 & 42 ]', pageWidth / 2, y, { align: 'center' });

    y += 12;
    doc.text('AND THE EMPLOYEES\' PENSION SCHEME, 1995 [Para 19]', pageWidth / 2, y, { align: 'center' });

    y += 16;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text(`Contribution Card for currency period from ${currencyPeriod.label}`, pageWidth / 2, y, { align: 'center' });

    y += 18;

    // 3. Employee & Establishment Metadata (Two columns)
    const col1X = marginX;
    const col2X = marginX + 265;
    const labelW = 100;
    const lineGap = 13;

    doc.setFontSize(7.5);

    // Row 1
    doc.setFont('helvetica', 'bold');
    doc.text('1.  Account No.', col1X, y);
    doc.setFont('courier', 'bold');
    doc.setFontSize(8);
    doc.text(`:  ${accountNo}`, col1X + 90, y);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.text('5.  Statutory Rate of Contribution', col2X, y);
    doc.setFont('helvetica', 'normal');
    doc.text(`:  ${statutoryRate}`, col2X + 175, y);

    y += lineGap;

    // Row 2
    doc.setFont('helvetica', 'bold');
    doc.text('2.  Name / Surname', col1X, y);
    doc.setFont('helvetica', 'normal');
    doc.text(`:  ${empName.toUpperCase()}`, col1X + 90, y);

    doc.setFont('helvetica', 'bold');
    doc.text('6.  Voluntary Higher Rate of', col2X, y);
    doc.text('    Employees\' Contribution if any', col2X, y + 9);
    doc.setFont('helvetica', 'normal');
    doc.text(':  Nil', col2X + 175, y + 4);

    y += lineGap + 4;

    // Row 3
    doc.setFont('helvetica', 'bold');
    doc.text('3.  Father\'s / Husband\'s name.', col1X, y);
    doc.setFont('helvetica', 'normal');
    doc.text(`:  ${fatherName}`, col1X + 90, y);

    doc.setFont('helvetica', 'bold');
    doc.text('7.  Employees\' Contribution on', col2X, y);
    doc.text('    higher wages to EPF', col2X, y + 9);
    doc.setFont('helvetica', 'normal');
    doc.text(':  No', col2X + 175, y + 4);

    y += lineGap + 4;

    // Row 4: Establishment details
    doc.setFont('helvetica', 'bold');
    doc.text('4.  Name and Address of the', col1X, y);
    doc.text('    Factory / Establishment', col1X, y + 9);

    const estTextX = col1X + 90;
    doc.setFont('helvetica', 'bold');
    doc.text(`:  ${adminName}`, estTextX, y);
    doc.setFont('helvetica', 'normal');
    const splitAddr = doc.splitTextToSize(adminAddress, 165);
    doc.text(splitAddr, estTextX + 8, y + 10);

    doc.setFont('helvetica', 'bold');
    doc.text('8.  Voluntary Contribution to', col2X, y);
    doc.text('    Pension Fund on higher wages', col2X, y + 9);
    doc.setFont('helvetica', 'normal');
    doc.text(':  No', col2X + 175, y + 4);

    y += Math.max(34, (splitAddr.length * 9) + 12);

    // 4. Statutory Table
    const rawRows = card.monthlyRows || [];

    const formatAmt = (val) => {
      const num = Number(val || 0);
      return num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    const tableBody = rawRows.map((r, rIdx) => {
      let remarkText = '';
      if (rIdx === 3 || rIdx === 4) {
        remarkText = exitDate ? `a) Date of Leaving: ${exitDate}` : 'a) Date of Leaving Service if any';
      } else if (rIdx === 7 || rIdx === 8) {
        remarkText = exitReason ? `b) Reason: ${exitReason}` : 'b) Reasons for Leaving Service if any';
      }

      return [
        r.month,
        formatAmt(r.wages),
        formatAmt(r.eePf),
        formatAmt(r.erPf),
        formatAmt(r.erEps),
        r.refAdvance || '',
        String(r.ncpDays ?? 0),
        remarkText,
      ];
    });

    // Total Row
    const t = card.totals || {};
    tableBody.push([
      { content: '', styles: { fontStyle: 'bold' } },
      { content: formatAmt(t.wages), styles: { fontStyle: 'bold', halign: 'right' } },
      { content: formatAmt(t.eePf), styles: { fontStyle: 'bold', halign: 'right' } },
      { content: formatAmt(t.erPf), styles: { fontStyle: 'bold', halign: 'right' } },
      { content: formatAmt(t.erEps), styles: { fontStyle: 'bold', halign: 'right' } },
      { content: '', styles: { halign: 'center' } },
      { content: String(t.ncpDays ?? 0), styles: { fontStyle: 'bold', halign: 'center' } },
      { content: '', styles: { halign: 'left' } },
    ]);

    autoTable(doc, {
      startY: y,
      margin: { left: marginX, right: marginX },
      tableWidth: contentWidth,
      pageBreak: 'avoid',
      head: [
        [
          { content: 'Month', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
          { content: "MEMBER'S\nSHARE", colSpan: 2, styles: { halign: 'center' } },
          { content: "EMPLOYER'S SHARE", colSpan: 2, styles: { halign: 'center' } },
          { content: 'Ref. of\nAdvance', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
          { content: 'Period of non\ncontributory\nservice (if any)\nNo of days', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
          { content: 'Remarks', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
        ],
        [
          { content: 'Amount\nof\nWages', styles: { halign: 'center' } },
          { content: 'E.P.F', styles: { halign: 'center' } },
          { content: 'E.P.F\nContributi', styles: { halign: 'center' } },
          { content: 'Pension Fund\nContribution\n8 1/3 %', styles: { halign: 'center' } },
        ],
        [
          { content: '1', styles: { halign: 'center' } },
          { content: '2', styles: { halign: 'center' } },
          { content: '3', styles: { halign: 'center' } },
          { content: '4', styles: { halign: 'center' } },
          { content: '5', styles: { halign: 'center' } },
          { content: '6', styles: { halign: 'center' } },
          { content: '7', styles: { halign: 'center' } },
          { content: '8', styles: { halign: 'center' } },
        ],
      ],
      body: tableBody,
      theme: 'grid',
      styles: {
        fontSize: 6.8,
        textColor: [0, 0, 0],
        lineColor: [100, 100, 100],
        lineWidth: 0.5,
        cellPadding: { top: 2.5, bottom: 2.5, left: 3, right: 3 },
      },
      headStyles: {
        fontStyle: 'bold',
        textColor: [0, 0, 0],
        fillColor: [255, 255, 255],
        lineColor: [100, 100, 100],
        lineWidth: 0.5,
        fontSize: 7,
      },
      columnStyles: {
        0: { cellWidth: 78, halign: 'left' },
        1: { cellWidth: 60, halign: 'right' },
        2: { cellWidth: 50, halign: 'right' },
        3: { cellWidth: 52, halign: 'right' },
        4: { cellWidth: 62, halign: 'right' },
        5: { cellWidth: 42, halign: 'center' },
        6: { cellWidth: 55, halign: 'center' },
        7: { cellWidth: 124.28, halign: 'left' },
      },
      didDrawCell: (data) => {
        // Double line below total row
        if (data.section === 'body' && data.row.index === rawRows.length) {
          doc.setDrawColor(0, 0, 0);
          doc.setLineWidth(1);
          doc.line(data.cell.x, data.cell.y + data.cell.height, data.cell.x + data.cell.width, data.cell.y + data.cell.height);
        }
      },
    });

    const finalY = doc.lastAutoTable.finalY + 12;

    // 5. Certification and Notes
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.2);
    doc.setTextColor(20, 20, 20);

    const totalBothRemitted = Math.round(t.totalBothShares || (t.eePf + t.erPf) || 0);
    const totalEpsRemitted = Math.round(t.erEps || 0);

    doc.text(
      `Certified that the total amount of contribution (both shares) indicated in this card i.e., Rs. ${totalBothRemitted.toLocaleString('en-IN')} has already been remitted in full in E.P.F A/c No. 1 and Pension Fund A/c No. 10 Rs. ${totalEpsRemitted.toLocaleString('en-IN')}`,
      marginX,
      finalY,
      { maxWidth: contentWidth }
    );

    const cert2Y = finalY + 16;
    doc.text(
      'Certified that the difference between the total of contribution shown under Cols. 3 & 4 of the above table and that arrived at on the total wages shown in Column 2 at the prescribed rate is solely due to rounding off of the contributions to the nearest rupee under the rules.',
      marginX,
      cert2Y,
      { maxWidth: contentWidth }
    );

    const noteY = cert2Y + 20;
    doc.setFont('helvetica', 'bold');
    doc.text('NOTE:', marginX, noteY);

    doc.setFont('helvetica', 'normal');
    const note1 = '1  In respect of the Form3-A sent to the Regional Office during the course of the currency period for the purpose of the final settlement of the accounts of the member who has left service, details of date and reasons for leaving service should be furnished under Co.7(a) & (b).';
    doc.text(note1, marginX + 25, noteY, { maxWidth: contentWidth - 25 });

    const note2Y = noteY + 18;
    const note2 = '2  In respect of the members who are not members of the Pension Fund, the employer\'s share of contribution to Employees\' Provident Fund is to be shown under Co, 4(a)';
    doc.text(note2, marginX + 25, note2Y, { maxWidth: contentWidth - 25 });

    // 6. Footer Date & Signature
    const footerY = Math.min(pageHeight - 32, note2Y + 36);
    const d = new Date();
    const dateStr = `${String(d.getDate()).padStart(2, '0')}-${d.toLocaleString('en-US', { month: 'short' })}-${d.getFullYear()}`;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.text(`Date :    ${dateStr}`, marginX, footerY);

    doc.setFont('helvetica', 'bold');
    doc.text('Signature of Employer with Office Seal', pageWidth - marginX - 180, footerY);
  });

  const fileName = `PF_Form_3A_${activeCard.employeeId || 'Report'}_${new Date().toISOString().slice(0, 10)}.pdf`;

  if (mode === 'print') {
    doc.autoPrint();
    const blobUrl = doc.output('bloburl');
    window.open(blobUrl, '_blank');
  } else {
    doc.save(fileName);
  }
}

/**
 * Export Statutory PF Form 3A to Excel (.xlsx)
 */
export function downloadPfForm3AExcel(reportData = {}) {
  const cards = reportData.cards || (reportData.activeCard ? [reportData.activeCard] : []);
  const activeCard = reportData.activeCard || cards[0] || {};
  const comp = reportData.companyInfo || {};
  const currencyPeriod = reportData.currencyPeriod || { label: '01 Apr 2025 to 31 Mar 2026' };

  const adminName = (activeCard.establishmentName || comp.name || 'RR SECURITY & FACILITIES').toUpperCase();
  const adminAddress = activeCard.establishmentAddress || comp.address || 'G-75/a, Gali No. 04 Block G Molarband Extn. Badarpur SOUTH DELHI';

  const wb = XLSX.utils.book_new();

  // Sheet 1: Active Member Form 3A
  const sheetData = [
    ['( For Unexempted Establishments Only )', '', '', '', '', '', '', 'Form - 3A (Revised)'],
    ["EMPLOYEES' PROVIDENT FUND ORGANISATION"],
    ['THE EMPLOYEES\' PROVIDENT FUND SCHEME, 1952 [Paras 35 & 42 ] AND THE EMPLOYEES\' PENSION SCHEME, 1995 [Para 19]'],
    [`Contribution Card for currency period from ${currencyPeriod.label}`],
    [],
    ['1. Account No.', activeCard.accountNo || '', '', '', '5. Statutory Rate of Contribution', activeCard.statutoryRate || '12%'],
    ['2. Name / Surname', (activeCard.name || '').toUpperCase(), '', '', '6. Voluntary Higher Rate of EE Contribution', 'Nil'],
    ['3. Father\'s / Husband\'s name', activeCard.fatherHusbandName || '-', '', '', '7. EE Contribution on higher wages to EPF', 'No'],
    ['4. Factory / Establishment Name', adminName, '', '', '8. Voluntary Contribution to Pension Fund', 'No'],
    ['   Establishment Address', adminAddress],
    [],
    [
      'Month',
      'Amount of Wages',
      'Member E.P.F (12%)',
      'Employer E.P.F (3.67%)',
      'Pension Fund (8.33%)',
      'Ref. of Advance',
      'NCP Days',
      'Remarks',
    ],
    ['1', '2', '3', '4', '5', '6', '7', '8'],
  ];

  (activeCard.monthlyRows || []).forEach((r) => {
    sheetData.push([
      r.month,
      r.wages,
      r.eePf,
      r.erPf,
      r.erEps,
      r.refAdvance || '',
      r.ncpDays ?? 0,
      r.remarks || '',
    ]);
  });

  const t = activeCard.totals || {};
  sheetData.push([
    'TOTAL',
    t.wages || 0,
    t.eePf || 0,
    t.erPf || 0,
    t.erEps || 0,
    '',
    t.ncpDays || 0,
    '',
  ]);

  sheetData.push([]);
  sheetData.push([
    `Certified that the total amount of contribution (both shares) indicated in this card i.e., Rs. ${Math.round(t.totalBothShares || 0)} has already been remitted in full in E.P.F A/c No. 1 and Pension Fund A/c No. 10 Rs. ${Math.round(t.erEps || 0)}`,
  ]);
  sheetData.push([
    'Certified that the difference between the total of contribution shown under Cols. 3 & 4 and that arrived at on the total wages is solely due to rounding off.',
  ]);

  const ws = XLSX.utils.aoa_to_sheet(sheetData);
  ws['!cols'] = [
    { wch: 22 },
    { wch: 16 },
    { wch: 18 },
    { wch: 20 },
    { wch: 20 },
    { wch: 14 },
    { wch: 12 },
    { wch: 32 },
  ];
  XLSX.utils.book_append_sheet(wb, ws, 'Form 3A Card');

  // Sheet 2: Annual Summary of All Covered Members
  if (cards.length > 0) {
    const summaryHeader = [
      'Sl.',
      'Employee ID',
      'Member Name',
      'Father/Husband Name',
      'Account / PF No.',
      'UAN',
      'Total EPF Wages (Rs.)',
      'Member EPF (Rs.)',
      'Employer EPF (Rs.)',
      'Pension Fund EPS (Rs.)',
      'Total EPF A/c 1 Remitted (Rs.)',
      'Total NCP Days',
      'Exit Date',
      'Exit Reason',
    ];

    const summaryRows = cards.map((c, i) => [
      i + 1,
      c.employeeId || '',
      c.name || '',
      c.fatherHusbandName || '-',
      c.accountNo || '',
      c.uan || '-',
      c.totals?.wages || 0,
      c.totals?.eePf || 0,
      c.totals?.erPf || 0,
      c.totals?.erEps || 0,
      c.totals?.totalBothShares || 0,
      c.totals?.ncpDays || 0,
      c.exitDate || '',
      c.exitReason || '',
    ]);

    const wsSummary = XLSX.utils.aoa_to_sheet([summaryHeader, ...summaryRows]);
    wsSummary['!cols'] = [
      { wch: 6 },
      { wch: 14 },
      { wch: 24 },
      { wch: 20 },
      { wch: 22 },
      { wch: 16 },
      { wch: 18 },
      { wch: 16 },
      { wch: 16 },
      { wch: 18 },
      { wch: 22 },
      { wch: 14 },
      { wch: 14 },
      { wch: 20 },
    ];
    XLSX.utils.book_append_sheet(wb, wsSummary, 'All Members Summary');
  }

  const fileName = `PF_Form_3A_Annual_Cards_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(wb, fileName);
}
