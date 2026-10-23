import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Statutory EPFO PF Form 6A (Revised) Export Utility
 * (Consolidated Annual Statement of Contribution for the Currency Period)
 *
 * Statutory References:
 * - EMPLOYEES' PROVIDENT FUND SCHEME, 1952 (PARAGRAPH 43)
 * - THE EMPLOYEES' PENSION SCHEME, 1995 [PARAGRAPH 20(4)]
 */

export function downloadPfForm6APdf(reportData = {}, options = {}) {
  const comp = reportData.companyInfo || {};
  const members = reportData.members || reportData.records || [];
  const period = reportData.period || { label: '01-May-2026 To 30-Apr-2027' };
  const statutoryRate = reportData.statutoryRate || '12%';
  const totals = reportData.totals || {};
  const remittances = reportData.remittances || [];
  const remittanceTotals = reportData.remittanceTotals || {};
  const cert = reportData.certification || {};
  const mode = options.mode || 'download';

  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'pt',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 841.89 pt
  const pageHeight = doc.internal.pageSize.getHeight(); // 595.28 pt
  const marginX = 36;
  const contentWidth = pageWidth - marginX * 2; // ~769.89 pt

  const formatRupee = (val) => {
    const num = Number(val || 0);
    return num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  /* =========================================================
     PAGE 1: FORM 6A MEMBER STATEMENT OF CONTRIBUTIONS
     ========================================================= */
  let y = 30;

  // 1. Top Right Box: Form - 6A REVISED
  const boxWidth = 96;
  const boxHeight = 32;
  const boxX = pageWidth - marginX - boxWidth;
  const boxY = y;
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(1);
  doc.rect(boxX, boxY, boxWidth, boxHeight);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('Form - 6A', boxX + boxWidth / 2, boxY + 12, { align: 'center' });
  doc.setFontSize(8);
  doc.text('REVISED', boxX + boxWidth / 2, boxY + 24, { align: 'center' });

  // 2. Centered Titles
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.text("EMPLOYEES' PROVIDENT FUND SCHEME, 1952 (PARAGRAPH 43)", pageWidth / 2, y + 10, { align: 'center' });
  doc.setFontSize(9);
  doc.text('AND', pageWidth / 2, y + 22, { align: 'center' });
  doc.text("THE EMPLOYEES' PENSION SCHEME, 1995 [PARAGRAPH 20(4)]", pageWidth / 2, y + 34, { align: 'center' });

  y += 50;

  // 3. Subheaders: Currency period & Rate
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('Annual Statement of Contribution for the Currency period from', marginX, y);
  doc.setFont('helvetica', 'bold');
  doc.text(period.label || '01-May-2026 To 30-Apr-2027', marginX + 235, y);

  doc.setFont('helvetica', 'normal');
  doc.text(`Statutory Rate of Contribution: ${statutoryRate}`, pageWidth - marginX - 220, y);

  y += 16;

  // 4. Establishment Name, Address & Code
  const estName = comp.name || 'RR Security & Facilities';
  const estAddress = comp.address || 'G-75/a, Gali No. 04 Block G Molarband Extn. Badarpur SOUTH DELHI - 110044';
  const estCode = comp.establishmentCode || comp.employerPfCode || 'PFNOTAVAILABLE';

  doc.text('Name and Address of the Establishment : ', marginX, y);
  const addrLines = doc.splitTextToSize(`${estName}\n${estAddress.replace(/[\r\n]+/g, ', ')}`, 360);
  doc.text(addrLines, marginX + 175, y);

  y += Math.max(addrLines.length * 9.5 + 4, 22);

  doc.setFont('helvetica', 'normal');
  doc.text('Code No. of the Establishment : ', marginX, y);
  doc.setFont('helvetica', 'bold');
  doc.text(estCode, marginX + 175, y);

  y += 14;

  // 5. 9-Column Member Statement Table with Hierarchy
  const statementHeaders = [
    [
      { content: 'Sl No', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
      { content: 'Account.\nNo.', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
      { content: 'Name of the Member', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
      {
        content: 'Wages retaining,\nallowance(if any)\nand D.A.\nincluding\nCash values of\nfood concession\npaid during the\ncurrency period',
        rowSpan: 2,
        styles: { halign: 'center', valign: 'middle' }
      },
      {
        content: "Amount of Worker's Contributions\ndeducted from the Wages",
        colSpan: 3,
        styles: { halign: 'center', valign: 'middle' }
      },
      {
        content: "Employer's Contributions",
        colSpan: 3,
        styles: { halign: 'center', valign: 'middle' }
      },
      { content: 'Refund\nof\nAdvance', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
      { content: 'Rate of  Higher\nVoluntary\nContribution  if\nany', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
      { content: 'Remarks', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } }
    ],
    [
      { content: 'EPF\na', styles: { halign: 'center' } },
      { content: 'EPS\nb', styles: { halign: 'center' } },
      { content: 'Total\nc', styles: { halign: 'center' } },
      { content: 'EPF\na', styles: { halign: 'center' } },
      { content: 'EPS\nb', styles: { halign: 'center' } },
      { content: 'Total\nc', styles: { halign: 'center' } }
    ],
    [
      { content: '1', styles: { halign: 'center' } },
      { content: '2', styles: { halign: 'center' } },
      { content: '3', styles: { halign: 'center' } },
      { content: '4', styles: { halign: 'center' } },
      { content: '5', colSpan: 3, styles: { halign: 'center' } },
      { content: '6', colSpan: 3, styles: { halign: 'center' } },
      { content: '7', styles: { halign: 'center' } },
      { content: '8', styles: { halign: 'center' } },
      { content: '9', styles: { halign: 'center' } }
    ]
  ];

  const statementBody = members.map((m, i) => [
    { content: String(m.slNo || i + 1), styles: { halign: 'center' } },
    { content: m.accountNo || '—', styles: { halign: 'left' } },
    { content: m.name || '—', styles: { halign: 'left', fontStyle: 'bold' } },
    { content: formatRupee(m.wages), styles: { halign: 'right' } },
    { content: formatRupee(m.workerContribution?.epf), styles: { halign: 'right' } },
    { content: formatRupee(m.workerContribution?.eps), styles: { halign: 'right' } },
    { content: formatRupee(m.workerContribution?.total), styles: { halign: 'right', fontStyle: 'bold' } },
    { content: formatRupee(m.employerContribution?.epf), styles: { halign: 'right' } },
    { content: formatRupee(m.employerContribution?.eps), styles: { halign: 'right' } },
    { content: formatRupee(m.employerContribution?.total), styles: { halign: 'right', fontStyle: 'bold' } },
    { content: m.refundOfAdvance ? formatRupee(m.refundOfAdvance) : '', styles: { halign: 'right' } },
    { content: m.voluntaryRate || '', styles: { halign: 'center' } },
    { content: m.remarks || '', styles: { halign: 'left' } }
  ]);

  // Total summary row
  statementBody.push([
    { content: 'Total', colSpan: 3, styles: { halign: 'right', fontStyle: 'bold' } },
    { content: formatRupee(totals.wages), styles: { halign: 'right', fontStyle: 'bold' } },
    { content: formatRupee(totals.workerEpf), styles: { halign: 'right', fontStyle: 'bold' } },
    { content: formatRupee(totals.workerEps), styles: { halign: 'right', fontStyle: 'bold' } },
    { content: formatRupee(totals.workerTotal), styles: { halign: 'right', fontStyle: 'bold' } },
    { content: formatRupee(totals.employerEpf), styles: { halign: 'right', fontStyle: 'bold' } },
    { content: formatRupee(totals.employerEps), styles: { halign: 'right', fontStyle: 'bold' } },
    { content: formatRupee(totals.employerTotal), styles: { halign: 'right', fontStyle: 'bold' } },
    { content: totals.refundOfAdvance ? formatRupee(totals.refundOfAdvance) : '', styles: { halign: 'right', fontStyle: 'bold' } },
    { content: '', styles: { halign: 'center' } },
    { content: '', styles: { halign: 'left' } }
  ]);

  autoTable(doc, {
    startY: y,
    head: statementHeaders,
    body: statementBody,
    theme: 'plain',
    margin: { left: marginX, right: marginX, bottom: 40 },
    tableWidth: contentWidth,
    styles: {
      fontSize: 7,
      textColor: [15, 23, 42],
      lineColor: [180, 190, 205],
      lineWidth: 0.65,
      cellPadding: 3,
    },
    headStyles: {
      textColor: [15, 23, 42],
      fontStyle: 'bold',
      lineColor: [140, 150, 165],
      lineWidth: 0.75,
      fillColor: false,
    },
    columnStyles: {
      0: { cellWidth: 26 },  // Sl No
      1: { cellWidth: 84 },  // Account No
      2: { cellWidth: 105 }, // Member Name
      3: { cellWidth: 68 },  // Wages
      4: { cellWidth: 46 },  // Worker EPF
      5: { cellWidth: 38 },  // Worker EPS
      6: { cellWidth: 46 },  // Worker Total
      7: { cellWidth: 46 },  // Employer EPF
      8: { cellWidth: 46 },  // Employer EPS
      9: { cellWidth: 46 },  // Employer Total
      10: { cellWidth: 44 }, // Refund of Advance
      11: { cellWidth: 65 }, // Rate of Voluntary
      12: { cellWidth: 110 } // Remarks
    }
  });

  /* =========================================================
     PAGE 2: RECONCILIATION OF REMITTANCES & CERTIFICATION
     ========================================================= */
  doc.addPage();
  let y2 = 30;

  // Remittance Table Header block
  const remTableWidth = 475;
  const remHeaders = [
    [
      { content: 'Reconciliation of Remittances', colSpan: 2, styles: { halign: 'center', fontStyle: 'bold' } },
      { content: 'Total Rs.\n(Admn. Charges Rs.\nat 0.5% of wages )', colSpan: 3, styles: { halign: 'center', fontStyle: 'bold' } },
      { content: 'Contributions\nAggregate\nRs. ( )', colSpan: 3, styles: { halign: 'center', fontStyle: 'bold' } }
    ],
    [
      { content: 'No', styles: { halign: 'center' } },
      { content: 'Month', styles: { halign: 'center' } },
      { content: 'EPF contribution\nincluding refund\nof advances\nA/c No. 1\n(Rs.)', styles: { halign: 'center' } },
      { content: 'Pension Fund\ncontributions\nA/c. No 10\n(Rs.)', styles: { halign: 'center' } },
      { content: 'EDLI\ncontribution\nA/c. No 21\n(Rs.)', styles: { halign: 'center' } },
      { content: 'Admn.\ncharges\nA/c No 2\n(Rs.)', styles: { halign: 'center' } },
      { content: 'EDLI ADM\ncharges\n0.01%\n(Rs.)', styles: { halign: 'center' } },
      { content: 'Date of\nRemittances', styles: { halign: 'center' } }
    ]
  ];

  const remBody = remittances.map((r) => [
    { content: String(r.no || ''), styles: { halign: 'center' } },
    { content: r.month || '', styles: { halign: 'left' } },
    { content: formatRupee(r.ac1), styles: { halign: 'right' } },
    { content: formatRupee(r.ac10), styles: { halign: 'right' } },
    { content: formatRupee(r.ac21), styles: { halign: 'right' } },
    { content: formatRupee(r.ac2), styles: { halign: 'right' } },
    { content: formatRupee(r.ac22), styles: { halign: 'right' } },
    { content: r.dateOfRemittance || '', styles: { halign: 'center' } }
  ]);

  // Total remittance row
  remBody.push([
    { content: '', styles: { halign: 'center' } },
    { content: 'Total', styles: { halign: 'right', fontStyle: 'bold' } },
    { content: formatRupee(remittanceTotals.totalAc1), styles: { halign: 'right', fontStyle: 'bold' } },
    { content: formatRupee(remittanceTotals.totalAc10), styles: { halign: 'right', fontStyle: 'bold' } },
    { content: formatRupee(remittanceTotals.totalAc21), styles: { halign: 'right', fontStyle: 'bold' } },
    { content: formatRupee(remittanceTotals.totalAc2), styles: { halign: 'right', fontStyle: 'bold' } },
    { content: formatRupee(remittanceTotals.totalAc22), styles: { halign: 'right', fontStyle: 'bold' } },
    { content: '', styles: { halign: 'center' } }
  ]);

  autoTable(doc, {
    startY: y2,
    head: remHeaders,
    body: remBody,
    theme: 'plain',
    margin: { left: marginX, right: pageWidth - marginX - remTableWidth },
    tableWidth: remTableWidth,
    styles: {
      fontSize: 6.8,
      textColor: [15, 23, 42],
      lineColor: [180, 190, 205],
      lineWidth: 0.65,
      cellPadding: 2.5,
    },
    headStyles: {
      textColor: [15, 23, 42],
      fontStyle: 'bold',
      lineColor: [140, 150, 165],
      lineWidth: 0.75,
      fillColor: false,
    },
    columnStyles: {
      0: { cellWidth: 20 },
      1: { cellWidth: 80 },
      2: { cellWidth: 70 },
      3: { cellWidth: 62 },
      4: { cellWidth: 54 },
      5: { cellWidth: 54 },
      6: { cellWidth: 54 },
      7: { cellWidth: 81 }
    }
  });

  // Right Side Certification Box
  const certX = marginX + remTableWidth + 14;
  const certWidth = contentWidth - remTableWidth - 14;
  let certY = y2 + 4;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text(`Aggregate of total costs 5 + 6 + 7 Rs. ${formatRupee(cert.aggregateTotalCosts || totals.aggregateCosts)}`, certX, certY);
  certY += 14;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text(`i)  Total number of contribution cards enclosed [Form 3A (Revised)]:  ${cert.totalCardsEnclosed || members.length}`, certX, certY);
  certY += 13;

  const certLines = doc.splitTextToSize(
    `ii) Certified that Form 3A duly completed of all the members listed in this statement are enclosed., except those already sent during the course of the currency period for the final settlement of the concerned member's account vide 'Remarks' furnished against the names of the respective members above.`,
    certWidth
  );
  doc.text(certLines, certX, certY);
  certY += certLines.length * 9.5 + 45;

  doc.setFont('helvetica', 'bold');
  doc.text('Signature of Employer', certX + certWidth / 2, certY, { align: 'center' });
  certY += 10;
  doc.setFont('helvetica', 'normal');
  doc.text('(with office seal)', certX + certWidth / 2, certY, { align: 'center' });

  // Bottom Notes
  let notesY = doc.lastAutoTable.finalY + 16;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.text('Note :', marginX, notesY);

  doc.setFont('helvetica', 'normal');
  const n1 = doc.splitTextToSize(
    'i) The names of all members, including those who had left the services during the currency period , should be included in this statement. Where the Form 3A in respect of such member had left the service were already sent to the Regional Office for the purpose of final settlement of their accounts,the fact should be stated against the members in the \'Remarks column above thus "Form 3A already sent in the month of ...............200 ".',
    contentWidth - 28
  );
  doc.text(n1, marginX + 28, notesY);
  notesY += n1.length * 8 + 4;

  const n2 = doc.splitTextToSize(
    'ii) In case of substantial variation in the wages/contribution of any members as compared to those shown in previous months statement, the reason should be explained adquately in the \'Remarks\' column.',
    contentWidth - 28
  );
  doc.text(n2, marginX + 28, notesY);
  notesY += n2.length * 8 + 4;

  const n3 = doc.splitTextToSize(
    'iii) In respect of those members who have not opted for Pension Fund their entire employers contribution @ 8 1/3% or 10% as the case may be should be shown under column No. 6.',
    contentWidth - 28
  );
  doc.text(n3, marginX + 28, notesY);

  const filename = `PF_Form_6A_${(period.label || 'Annual').replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;

  if (mode === 'print') {
    doc.autoPrint();
    const blobUrl = doc.output('bloburl');
    const printWindow = window.open(blobUrl, '_blank');
    if (printWindow) {
      printWindow.focus();
    }
  } else {
    doc.save(filename);
  }
}

/**
 * Download PF Form 6A as multi-sheet Excel spreadsheet
 */
export function downloadPfForm6AExcel(reportData = {}, options = {}) {
  const comp = reportData.companyInfo || {};
  const members = reportData.members || reportData.records || [];
  const period = reportData.period || { label: '01-May-2026 To 30-Apr-2027' };
  const totals = reportData.totals || {};
  const remittances = reportData.remittances || [];
  const remTotals = reportData.remittanceTotals || {};

  // Sheet 1: Member Statement
  const s1Data = [
    ['Form - 6A REVISED', '', '', '', '', '', '', '', '', '', '', '', ''],
    ["EMPLOYEES' PROVIDENT FUND SCHEME, 1952 (PARAGRAPH 43)", '', '', '', '', '', '', '', '', '', '', '', ''],
    ['AND', '', '', '', '', '', '', '', '', '', '', '', ''],
    ["THE EMPLOYEES' PENSION SCHEME, 1995 [PARAGRAPH 20(4)]", '', '', '', '', '', '', '', '', '', '', '', ''],
    [`Annual Statement of Contribution for the Currency period from ${period.label || ''}`, '', '', '', '', '', 'Statutory Rate of Contribution: 12%', '', '', '', '', '', ''],
    ['Name and Address of the Establishment :', `${comp.name || 'RR Security & Facilities'}, ${comp.address || ''}`, '', '', '', '', '', '', '', '', '', '', ''],
    ['Code No. of the Establishment :', comp.establishmentCode || comp.employerPfCode || 'PFNOTAVAILABLE', '', '', '', '', '', '', '', '', '', '', ''],
    [],
    [
      'Sl No',
      'Account. No.',
      'Name of the Member',
      'Wages retaining, allowance(if any) and D.A.',
      "Worker's EPF (a)",
      "Worker's EPS (b)",
      "Worker's Total (c)",
      "Employer's EPF (a)",
      "Employer's EPS (b)",
      "Employer's Total (c)",
      'Refund of Advance',
      'Rate of Higher Voluntary',
      'Remarks'
    ],
    ['1', '2', '3', '4', '5a', '5b', '5c', '6a', '6b', '6c', '7', '8', '9']
  ];

  members.forEach((m, i) => {
    s1Data.push([
      m.slNo || i + 1,
      m.accountNo || '—',
      m.name || '—',
      m.wages || 0,
      m.workerContribution?.epf || 0,
      m.workerContribution?.eps || 0,
      m.workerContribution?.total || 0,
      m.employerContribution?.epf || 0,
      m.employerContribution?.eps || 0,
      m.employerContribution?.total || 0,
      m.refundOfAdvance || 0,
      m.voluntaryRate || 'Nil',
      m.remarks || ''
    ]);
  });

  s1Data.push([
    'Total',
    '',
    '',
    totals.wages || 0,
    totals.workerEpf || 0,
    totals.workerEps || 0,
    totals.workerTotal || 0,
    totals.employerEpf || 0,
    totals.employerEps || 0,
    totals.employerTotal || 0,
    totals.refundOfAdvance || 0,
    '',
    ''
  ]);

  const ws1 = XLSX.utils.aoa_to_sheet(s1Data);
  ws1['!cols'] = [
    { wch: 8 },  // Sl No
    { wch: 22 }, // Account No
    { wch: 24 }, // Name
    { wch: 18 }, // Wages
    { wch: 14 }, // Worker EPF
    { wch: 14 }, // Worker EPS
    { wch: 14 }, // Worker Total
    { wch: 14 }, // Employer EPF
    { wch: 14 }, // Employer EPS
    { wch: 14 }, // Employer Total
    { wch: 16 }, // Refund of Advance
    { wch: 18 }, // Rate Voluntary
    { wch: 22 }  // Remarks
  ];

  // Sheet 2: Reconciliation of Remittances
  const s2Data = [
    ['Reconciliation of Remittances', '', '', '', '', '', '', ''],
    [
      'No',
      'Month',
      'EPF contrib inc refund (A/c 1)',
      'Pension Fund (A/c 10)',
      'EDLI contrib (A/c 21)',
      'Admn charges (A/c 2)',
      'EDLI ADM (0.01%)',
      'Date of Remittances'
    ]
  ];

  remittances.forEach((r) => {
    s2Data.push([
      r.no || '',
      r.month || '',
      r.ac1 || 0,
      r.ac10 || 0,
      r.ac21 || 0,
      r.ac2 || 0,
      r.ac22 || 0,
      r.dateOfRemittance || ''
    ]);
  });

  s2Data.push([
    '',
    'Total',
    remTotals.totalAc1 || 0,
    remTotals.totalAc10 || 0,
    remTotals.totalAc21 || 0,
    remTotals.totalAc2 || 0,
    remTotals.totalAc22 || 0,
    ''
  ]);

  s2Data.push([]);
  s2Data.push([`Aggregate of total costs 5 + 6 + 7: Rs. ${totals.aggregateCosts || 0}`, '', '', '', '', '', '', '']);
  s2Data.push([`Total number of contribution cards enclosed [Form 3A (Revised)]: ${members.length}`, '', '', '', '', '', '', '']);

  const ws2 = XLSX.utils.aoa_to_sheet(s2Data);
  ws2['!cols'] = [
    { wch: 6 },
    { wch: 20 },
    { wch: 20 },
    { wch: 18 },
    { wch: 16 },
    { wch: 16 },
    { wch: 16 },
    { wch: 18 }
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws1, 'Form 6A Statement');
  XLSX.utils.book_append_sheet(wb, ws2, 'Remittance Reconciliation');

  const filename = `PF_Form_6A_${(period.label || 'Annual').replace(/[^a-zA-Z0-9]/g, '_')}.xlsx`;
  XLSX.writeFile(wb, filename);
}

/**
 * Download PF Form 6A as CSV
 */
export function downloadPfForm6ACsv(reportData = {}, options = {}) {
  const members = reportData.members || reportData.records || [];
  const period = reportData.period || { label: 'Annual' };

  const rows = [
    [
      'Sl No',
      'Account No',
      'Name of Member',
      'Wages',
      'Worker EPF',
      'Worker EPS',
      'Worker Total',
      'Employer EPF',
      'Employer EPS',
      'Employer Total',
      'Refund of Advance',
      'Rate Voluntary',
      'Remarks'
    ]
  ];

  members.forEach((m, i) => {
    rows.push([
      m.slNo || i + 1,
      `"${m.accountNo || ''}"`,
      `"${m.name || ''}"`,
      m.wages || 0,
      m.workerContribution?.epf || 0,
      m.workerContribution?.eps || 0,
      m.workerContribution?.total || 0,
      m.employerContribution?.epf || 0,
      m.employerContribution?.eps || 0,
      m.employerContribution?.total || 0,
      m.refundOfAdvance || 0,
      `"${m.voluntaryRate || 'Nil'}"`,
      `"${m.remarks || ''}"`
    ]);
  });

  const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(e => e.join(',')).join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `PF_Form_6A_${(period.label || 'Annual').replace(/[^a-zA-Z0-9]/g, '_')}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
