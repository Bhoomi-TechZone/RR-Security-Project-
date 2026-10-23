import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Statutory EPFO PF Form 5 Export Utility
 * (Return of Employees qualifying for membership of the Employees' Provident Fund,
 *  Employees' Pension Fund & EDLI for the first time during the month)
 *
 * Statutory Reference:
 * [Paragraph 36(2)(a) of EPF Scheme, 1952 & Paragraph 20(4) of EPS, 1995]
 */

export function downloadPfForm5Pdf(reportData = {}, options = {}) {
  const comp = reportData.companyInfo || {};
  const records = reportData.records || [];
  const monthLabel = reportData.monthLabel || 'May 2026';
  const generatedDate = reportData.generatedDate || new Date().toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }).replace(/ /g, ' ');
  const mode = options.mode || 'download';

  // Orientation landscape gives ample width for all 9 statutory columns
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

  // 1. Top Centered Bordered Box for "FORM 5"
  const formBoxWidth = 760;
  const formBoxHeight = 22;
  const formBoxX = (pageWidth - formBoxWidth) / 2;
  doc.setDrawColor(30, 41, 59);
  doc.setLineWidth(1);
  doc.rect(formBoxX, y, formBoxWidth, formBoxHeight);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('FORM 5', pageWidth / 2, y + 15, { align: 'center' });

  y += 34;

  // 2. Organization & Statutory Scheme Headers
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.text("Employees' Provident Fund Organisation", pageWidth / 2, y, { align: 'center' });

  y += 14;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text(
    "THE EMPLOYEES' PROVIDENT FUND SCHEME, 1952 [Paragraph 36(2)(a)] AND THE EMPLOYEES' PENSION SCHEME, 1995 [Paragraph 20(4)]",
    pageWidth / 2,
    y,
    { align: 'center' }
  );

  y += 18;

  // 3. Subtitle / Return Statement
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(30, 41, 59);
  const introText = `Return of Employees' qualifying for membership of the Employees' Provident Fund, Employees' Pension Fund & Employees' Deposit Linked Insurance Fund for the first time during the month of   ${monthLabel}`;
  doc.text(introText, marginX, y);

  y += 16;

  // 4. Establishment Name, Address & Code No
  const estName = comp.name || 'RR Security & Facilities';
  const estAddress = comp.address || 'G-75/a, Gali No. 04 Block G Molarband Extn. Badarpur SOUTH DELHI - 110044';
  const estCode = comp.establishmentCode || comp.employerPfCode || 'PFNOTAVAILABLE';

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('Name and Address of the Factory / Estt: ', marginX, y);

  // Print Est Name and wrapped address
  doc.setFont('helvetica', 'normal');
  const addressLines = doc.splitTextToSize(
    `${estName}\n${estAddress.replace(/[\r\n]+/g, ', ')}`,
    380
  );
  doc.text(addressLines, marginX + 170, y);

  // Right side: CODE NO. of the Factory/ Estt:
  const codeLabel = 'CODE NO. of the Factory/ Estt:';
  doc.text(codeLabel, pageWidth - marginX - 260, y);
  doc.setFont('helvetica', 'bold');
  doc.text(estCode, pageWidth - marginX - 120, y);

  const addressHeight = addressLines.length * 10;
  y += Math.max(addressHeight + 6, 26);

  // 5. 9-Column Statutory Table
  const tableHeaders = [
    [
      { content: 'Sl\nNo', styles: { halign: 'center', valign: 'middle' } },
      { content: 'Account No', styles: { halign: 'center', valign: 'middle' } },
      { content: 'Name of Employee', styles: { halign: 'center', valign: 'middle' } },
      {
        content: "Father's Name (or\nHusband's Name\nin case of married woman)",
        styles: { halign: 'center', valign: 'middle' }
      },
      { content: 'Date of Birth', styles: { halign: 'center', valign: 'middle' } },
      { content: 'Sex', styles: { halign: 'center', valign: 'middle' } },
      { content: 'Date of\njoining the Fund', styles: { halign: 'center', valign: 'middle' } },
      {
        content: 'Total period of previous\nservice as on the date\nof joining the Fund\n(Enclose scheme certificate if\napplicable)',
        styles: { halign: 'center', valign: 'middle' }
      },
      { content: 'Remarks', styles: { halign: 'center', valign: 'middle' } }
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
      { content: '9', styles: { halign: 'center' } }
    ]
  ];

  const tableBody = records.map((r, i) => [
    { content: String(r.slNo || i + 1), styles: { halign: 'center' } },
    { content: r.accountNo || '—', styles: { halign: 'left' } },
    { content: r.name || '—', styles: { halign: 'left', fontStyle: 'bold' } },
    { content: r.fatherHusbandName || '—', styles: { halign: 'left' } },
    { content: r.dob || '—', styles: { halign: 'center' } },
    { content: r.sex || 'M', styles: { halign: 'center' } },
    { content: r.dateOfJoiningFund || '', styles: { halign: 'center' } },
    { content: r.previousService || '', styles: { halign: 'center' } },
    { content: r.remarks || '', styles: { halign: 'left' } }
  ]);

  if (tableBody.length === 0) {
    tableBody.push([
      {
        content: `NIL Return: No new employees qualified for EPF/EPS membership during ${monthLabel}`,
        colSpan: 9,
        styles: { halign: 'center', fontStyle: 'italic', textColor: [100, 116, 139], minCellHeight: 28 }
      }
    ]);
  }

  autoTable(doc, {
    startY: y,
    head: tableHeaders,
    body: tableBody,
    theme: 'plain',
    margin: { left: marginX, right: marginX, bottom: 65 },
    tableWidth: contentWidth,
    styles: {
      fontSize: 7.5,
      textColor: [15, 23, 42],
      lineColor: [180, 190, 205],
      lineWidth: 0.65,
      cellPadding: 4,
    },
    headStyles: {
      textColor: [15, 23, 42],
      fontStyle: 'bold',
      lineColor: [140, 150, 165],
      lineWidth: 0.75,
      fillColor: false,
    },
    columnStyles: {
      0: { cellWidth: 32 },  // Sl No
      1: { cellWidth: 105 }, // Account No
      2: { cellWidth: 120 }, // Name of Employee
      3: { cellWidth: 125 }, // Father's Name
      4: { cellWidth: 70 },  // Date of Birth
      5: { cellWidth: 32 },  // Sex
      6: { cellWidth: 75 },  // Date of joining
      7: { cellWidth: 110 }, // Previous service
      8: { cellWidth: 100 }, // Remarks
    },
    didDrawPage: (data) => {
      const footerY = pageHeight - 45;

      // Bottom row: Date, Stamp, Signature, Page Number
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(30, 41, 59);

      // Left: Date : 13 Sep, 2026
      doc.text(`Date :    ${generatedDate}`, marginX, footerY);

      // Center: Stamp of the Factory / Estt.
      doc.text('Stamp of the Factory / Estt.', pageWidth * 0.42, footerY);

      // Right: Signature
      doc.text(
        'Signature of the Employer or other Authorised Officer of the Factory / Establishment',
        pageWidth - marginX - 320,
        footerY
      );

      // Page Number at bottom right
      doc.setFontSize(7.5);
      doc.text(
        `Page   ${data.pageNumber}   of   ${doc.internal.getNumberOfPages()}`,
        pageWidth - marginX - 50,
        pageHeight - 18,
        { align: 'right' }
      );
    }
  });

  const filename = `PF_Form_5_${monthLabel.replace(/\s+/g, '_')}.pdf`;

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
 * Download PF Form 5 as statutory Excel spreadsheet
 */
export function downloadPfForm5Excel(reportData = {}, options = {}) {
  const comp = reportData.companyInfo || {};
  const records = reportData.records || [];
  const monthLabel = reportData.monthLabel || 'May 2026';
  const generatedDate = reportData.generatedDate || new Date().toLocaleDateString('en-GB');

  const wsData = [
    ['FORM 5', '', '', '', '', '', '', '', ''],
    ["Employees' Provident Fund Organisation", '', '', '', '', '', '', '', ''],
    ["THE EMPLOYEES' PROVIDENT FUND SCHEME, 1952 [Paragraph 36(2)(a)] AND THE EMPLOYEES' PENSION SCHEME, 1995 [Paragraph 20(4)]", '', '', '', '', '', '', '', ''],
    [`Return of Employees' qualifying for membership of the Employees' Provident Fund, Employees' Pension Fund & Employees' Deposit Linked Insurance Fund for the first time during the month of ${monthLabel}`, '', '', '', '', '', '', '', ''],
    [],
    ['Name and Address of the Factory / Estt:', `${comp.name || 'RR Security & Facilities'}, ${comp.address || ''}`, '', '', '', 'CODE NO. of the Factory/ Estt:', comp.establishmentCode || comp.employerPfCode || 'PFNOTAVAILABLE', '', ''],
    [],
    [
      'Sl No',
      'Account No',
      'Name of Employee',
      "Father's Name (or Husband's Name in case of married woman)",
      'Date of Birth',
      'Sex',
      'Date of joining the Fund',
      'Total period of previous service as on the date of joining the Fund (Enclose scheme certificate if applicable)',
      'Remarks'
    ],
    ['1', '2', '3', '4', '5', '6', '7', '8', '9']
  ];

  records.forEach((r, idx) => {
    wsData.push([
      r.slNo || idx + 1,
      r.accountNo || '—',
      r.name || '—',
      r.fatherHusbandName || '—',
      r.dob || '—',
      r.sex || 'M',
      r.dateOfJoiningFund || '',
      r.previousService || 'NIL',
      r.remarks || `Emp No: ${r.employeeCode || r.employeeId || ''}`
    ]);
  });

  wsData.push([]);
  wsData.push([
    `Date : ${generatedDate}`,
    '',
    '',
    'Stamp of the Factory / Estt.',
    '',
    '',
    'Signature of the Employer or other Authorised Officer of the Factory / Establishment',
    '',
    ''
  ]);

  const ws = XLSX.utils.aoa_to_sheet(wsData);

  ws['!cols'] = [
    { wch: 8 },  // Sl No
    { wch: 26 }, // Account No
    { wch: 24 }, // Name
    { wch: 26 }, // Father's Name
    { wch: 14 }, // DOB
    { wch: 8 },  // Sex
    { wch: 16 }, // Date of Joining
    { wch: 24 }, // Previous service
    { wch: 20 }, // Remarks
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'PF Form 5');

  const filename = `PF_Form_5_${monthLabel.replace(/\s+/g, '_')}.xlsx`;
  XLSX.writeFile(wb, filename);
}

/**
 * Download PF Form 5 as standard CSV
 */
export function downloadPfForm5Csv(reportData = {}, options = {}) {
  const comp = reportData.companyInfo || {};
  const records = reportData.records || [];
  const monthLabel = reportData.monthLabel || 'May 2026';

  const rows = [
    ['Sl No', 'Account No', 'Name of Employee', "Father's Name", 'Date of Birth', 'Sex', 'Date of joining the Fund', 'Total period of previous service', 'Remarks']
  ];

  records.forEach((r, i) => {
    rows.push([
      r.slNo || i + 1,
      `"${r.accountNo || ''}"`,
      `"${r.name || ''}"`,
      `"${r.fatherHusbandName || ''}"`,
      `"${r.dob || ''}"`,
      r.sex || 'M',
      `"${r.dateOfJoiningFund || ''}"`,
      `"${r.previousService || ''}"`,
      `"${r.remarks || ''}"`
    ]);
  });

  const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(e => e.join(',')).join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `PF_Form_5_${monthLabel.replace(/\s+/g, '_')}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
