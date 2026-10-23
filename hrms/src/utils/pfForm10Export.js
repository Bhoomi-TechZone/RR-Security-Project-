import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Statutory EPFO PF Form 10 Export Utility (PDF ONLY per explicit user request)
 * Return of members leaving service during the month
 *
 * Statutory References:
 * - THE EMPLOYEES' PROVIDENT FUNDS SCHEME, 1952 [Paragraph 36(2)(a) & (b)]
 * - THE EMPLOYEES' PENSION SCHEME, 1995 [Paragraph 20(2)]
 */

export function downloadPfForm10Pdf(reportData = {}, options = {}) {
  const comp = reportData.companyInfo || {};
  const records = reportData.records || [];
  const monthLabel = reportData.monthLabel || 'May 2026';
  const generatedDate = reportData.generatedDate || new Date().toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }).replace(/ /g, '-');
  const mode = options.mode || 'download';

  // Orientation landscape provides optimal spacing for all 7 statutory columns
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'pt',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 841.89 pt
  const pageHeight = doc.internal.pageSize.getHeight(); // 595.28 pt
  const marginX = 36;
  const contentWidth = pageWidth - marginX * 2; // ~769.89 pt

  let y = 30;

  // 1. Centered Top Box: FORM 10
  const boxWidth = 92;
  const boxHeight = 22;
  const boxX = (pageWidth - boxWidth) / 2;
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(1);
  doc.rect(boxX, y, boxWidth, boxHeight);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('FORM 10', pageWidth / 2, y + 15, { align: 'center' });

  y += 34;

  // 2. Organization & Statutory Scheme Headers
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11.5);
  doc.text('Employees Provident Fund Organization', pageWidth / 2, y, { align: 'center' });

  y += 14;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text(
    "THE EMPLOYEES' PROVIDENT FUNDS SCHEME, 1952 [Paragraph 36(2)(a) & (b)]  AND THE EMPLOYEES'  PENSION SCHEME, 1995",
    pageWidth / 2,
    y,
    { align: 'center' }
  );

  y += 12;
  doc.text('[Paragraph 20(2)]', pageWidth / 2, y, { align: 'center' });

  y += 18;

  // 3. Return Subtitle
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text(`Return of the members leaving service during the month of   ${monthLabel}`, marginX, y);

  y += 16;

  // 4. Establishment Name, Address & Code No
  const estName = comp.name || 'RR Security & Facilities';
  const estAddress = comp.address || 'G-75/a, Gali No. 04 Block G Molarband Extn. Badarpur, SOUTH DELHI - 110044';
  const estCode = comp.establishmentCode || comp.employerPfCode || 'PFNOTAVAILABLE';

  doc.setFont('helvetica', 'normal');
  doc.text('Name and Address of the Factory / ', marginX, y);
  doc.setFont('helvetica', 'bold');
  const prefixW = doc.getTextWidth('Name and Address of the Factory / ');
  
  const estAddressLines = doc.splitTextToSize(`${estName} , ${estAddress.replace(/[\r\n]+/g, ', ')}`, 380);
  doc.text(estAddressLines, marginX + prefixW, y);

  // Right side: CODE No. of the Factory/ Estt:
  doc.setFont('helvetica', 'normal');
  doc.text('CODE No. of the Factory/ Estt: ', pageWidth - marginX - 250, y);
  doc.setFont('helvetica', 'bold');
  doc.text(estCode, pageWidth - marginX - 110, y);

  const addressHeight = estAddressLines.length * 10;
  y += Math.max(addressHeight + 6, 22);

  // 5. 7-Column Statutory Table
  const tableHeaders = [
    [
      { content: 'Sl.No', styles: { halign: 'center', valign: 'middle' } },
      { content: 'Account No', styles: { halign: 'center', valign: 'middle' } },
      { content: 'Name of the Member', styles: { halign: 'center', valign: 'middle' } },
      {
        content: "Father's Name or Husband's\nName (in case of married\nwoman)",
        styles: { halign: 'center', valign: 'middle' }
      },
      { content: 'Date of Leaving Service', styles: { halign: 'center', valign: 'middle' } },
      { content: 'Reason for Leaving\nService', styles: { halign: 'center', valign: 'middle' } },
      { content: 'Remarks', styles: { halign: 'center', valign: 'middle' } }
    ],
    [
      { content: '1', styles: { halign: 'center' } },
      { content: '2', styles: { halign: 'center' } },
      { content: '3', styles: { halign: 'center' } },
      { content: '4', styles: { halign: 'center' } },
      { content: '5', styles: { halign: 'center' } },
      { content: '6', styles: { halign: 'center' } },
      { content: '7', styles: { halign: 'center' } }
    ]
  ];

  const tableBody = records.map((r, i) => [
    { content: String(r.slNo || i + 1), styles: { halign: 'center' } },
    { content: r.accountNo || '—', styles: { halign: 'left' } },
    { content: r.name || '—', styles: { halign: 'left', fontStyle: 'bold' } },
    { content: r.fatherHusbandName || '', styles: { halign: 'left' } },
    { content: r.dateOfLeaving || '—', styles: { halign: 'center' } },
    { content: r.reasonForLeaving || 'RESIGNED - C', styles: { halign: 'left' } },
    { content: r.remarks || '', styles: { halign: 'left' } }
  ]);

  if (tableBody.length === 0) {
    tableBody.push([
      {
        content: `NIL Return: No members left service during the month of ${monthLabel}`,
        colSpan: 7,
        styles: { halign: 'center', fontStyle: 'italic', textColor: [100, 116, 139], minCellHeight: 28 }
      }
    ]);
  }

  autoTable(doc, {
    startY: y,
    head: tableHeaders,
    body: tableBody,
    theme: 'plain',
    margin: { left: marginX, right: marginX, bottom: 95 },
    tableWidth: contentWidth,
    styles: {
      fontSize: 8,
      textColor: [15, 23, 42],
      lineColor: [180, 190, 205],
      lineWidth: 0.65,
      cellPadding: 4.5,
    },
    headStyles: {
      textColor: [15, 23, 42],
      fontStyle: 'bold',
      lineColor: [140, 150, 165],
      lineWidth: 0.75,
      fillColor: false,
    },
    columnStyles: {
      0: { cellWidth: 38 },  // Sl.No
      1: { cellWidth: 120 }, // Account No
      2: { cellWidth: 130 }, // Name of Member
      3: { cellWidth: 155 }, // Father's Name
      4: { cellWidth: 110 }, // Date of Leaving
      5: { cellWidth: 116 }, // Reason for Leaving
      6: { cellWidth: 100 }, // Remarks
    },
    didDrawPage: (data) => {
      let footerY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 28 : pageHeight - 90;
      if (footerY > pageHeight - 90) {
        footerY = pageHeight - 90;
      }

      // Date, Stamp, Signature line
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(30, 41, 59);

      doc.text(`Date :    ${generatedDate}`, marginX, footerY);
      doc.text('Stamp of Factory / Estt.', pageWidth * 0.35, footerY);
      doc.text('Signature of the Employeer or other Authorised\nOfficer', pageWidth - marginX - 220, footerY);

      footerY += 26;

      // Statutory Footnotes
      doc.setFontSize(6.8);
      doc.setTextColor(51, 65, 85);
      const footnote1 = doc.splitTextToSize(
        '*Please state whether the member is (a) retiring according to para (69) (1) (a) or (b) of the scheme (b) leaving India for permanent settlement abroad (c) retrenchment (d) Pt. & total disablement due to employment injury (e) discharged (f) resigning from or leaving service (g) taking up employment elsewhere (The name and address of the Employers should be stated) (h) death  (i) attained the age of 58 years',
        contentWidth
      );
      doc.text(footnote1, marginX, footerY);

      footerY += footnote1.length * 8 + 8;

      const footnote2 = doc.splitTextToSize(
        'Certified that the member mentioned at Serial No..................................................Shri...........................................................................................................was paid / not paid retrenchment compensation of Rs. ...................................................................................under the Industrial Dispute Act, 1947.',
        contentWidth
      );
      doc.text(footnote2, marginX, footerY);
    }
  });

  const filename = `PF_Form_10_${monthLabel.replace(/\s+/g, '_')}.pdf`;

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
