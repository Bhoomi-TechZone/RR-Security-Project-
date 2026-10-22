import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * =========================================================================
 * FORM 11 - ACCIDENT BOOK EXPORTER (PDF, EXCEL, CSV)
 * EMPLOYEES' STATE INSURANCE CORPORATION (Regulation 66)
 *
 * Exact statutory reproduction matching official ESIC Form 11:
 * - 18 statutory columns
 * - Dual-level header with grouped 'Details of Injury'
 * - Numbered statutory column row (1 to 18)
 * - Dynamic NIL statement when no accidents ("No Accident in the Month of <Month Year>")
 * - "Signature of the Employer" right-aligned footer
 * =========================================================================
 */

/**
 * Format date to standard DD/MM/YYYY
 */
const formatDate = (dateStr) => {
  if (!dateStr || dateStr === '—') return '—';
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) return dateStr;
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return dateStr;
  }
};

/**
 * Generate & Download Excel for Form 11 Accident Book
 */
export const downloadForm11AccidentBookExcel = (reportData = {}, options = {}) => {
  const safeData = reportData || {};
  const records = safeData.records || [];
  const company = safeData.company || {};
  const monthLabel = safeData.monthLabel || 'Current Month';
  const nilStatement = safeData.nilStatement || `No Accident in the Month of ${monthLabel}`;

  const aoa = [
    ['FORM 11'],
    ['ACCIDENT BOOK'],
    ["EMPLOYEES' STATE INSURANCE CORPORATION"],
    ['(Regulation 66)'],
    [''],
    ['Name & Address of Establishment:', `${company.name || 'RR SECURITY & FACILITIES'}, ${company.address || ''}`],
    ['ESIC Registration No:', company.esiCode || '—', '', 'Month & Year:', monthLabel],
    [''],
    // Header Row 1
    [
      'Sl.No',
      'Date of Notice',
      'Time of Notice',
      'Name and Address of Injured Person',
      'Sex',
      'Age',
      'Insurance No.',
      'Shift, department and Occupation of the employee',
      'Details of Injury',
      '',
      '',
      '',
      '',
      'What exactly was the injured person doing at the time of accident',
      'Name, occupation, address and signature or the thumb impression of the person(s) giving notice',
      'Signature and designation of the person who makes the entry in the Accident Book',
      'Signature and designation of the person who makes the entry in the Accident Book',
      'Remarks, if any',
    ],
    // Header Row 2
    [
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      'Cause',
      'Nature',
      'Date',
      'Time',
      'Place',
      '',
      '',
      '',
      '',
      '',
    ],
    // Row 3: Column numbers
    ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16', '17', '18'],
  ];

  if (records.length === 0) {
    aoa.push([nilStatement, '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '']);
  } else {
    records.forEach((row, idx) => {
      aoa.push([
        row.slNo || idx + 1,
        formatDate(row.noticeDate),
        row.noticeTime || '—',
        `${row.injuredPersonName || '—'}${row.injuredPersonAddress && row.injuredPersonAddress !== '—' ? `, ${row.injuredPersonAddress}` : ''}`,
        row.gender || row.sex || 'Male',
        row.age || '—',
        row.insuranceNumber || '—',
        row.shiftDeptOccupation || '—',
        row.causeOfInjury || '—',
        row.natureOfInjury || '—',
        formatDate(row.accidentDate),
        row.accidentTime || '—',
        row.accidentPlace || '—',
        row.activityAtAccidentTime || '—',
        row.noticeGiverDetails || '—',
        row.entryMakerDetails || '—',
        row.witnessOrCertifierDetails || row.entryMakerDetails || '—',
        row.remarks || '—',
      ]);
    });
  }

  aoa.push(['']);
  aoa.push(['', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', 'Signature of the Employer', '']);

  const ws = XLSX.utils.aoa_to_sheet(aoa);

  // Merge headers
  ws['!merges'] = [
    // Titles
    { s: { r: 0, c: 0 }, e: { r: 0, c: 17 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 17 } },
    { s: { r: 2, c: 0 }, e: { r: 2, c: 17 } },
    { s: { r: 3, c: 0 }, e: { r: 3, c: 17 } },
    // Col 1-8 RowSpan 2
    { s: { r: 8, c: 0 }, e: { r: 9, c: 0 } },
    { s: { r: 8, c: 1 }, e: { r: 9, c: 1 } },
    { s: { r: 8, c: 2 }, e: { r: 9, c: 2 } },
    { s: { r: 8, c: 3 }, e: { r: 9, c: 3 } },
    { s: { r: 8, c: 4 }, e: { r: 9, c: 4 } },
    { s: { r: 8, c: 5 }, e: { r: 9, c: 5 } },
    { s: { r: 8, c: 6 }, e: { r: 9, c: 6 } },
    { s: { r: 8, c: 7 }, e: { r: 9, c: 7 } },
    // Details of Injury ColSpan 5
    { s: { r: 8, c: 8 }, e: { r: 8, c: 12 } },
    // Col 14-18 RowSpan 2
    { s: { r: 8, c: 13 }, e: { r: 9, c: 13 } },
    { s: { r: 8, c: 14 }, e: { r: 9, c: 14 } },
    { s: { r: 8, c: 15 }, e: { r: 9, c: 15 } },
    { s: { r: 8, c: 16 }, e: { r: 9, c: 16 } },
    { s: { r: 8, c: 17 }, e: { r: 9, c: 17 } },
  ];

  if (records.length === 0) {
    // Merge NIL statement across all 18 columns
    ws['!merges'].push({ s: { r: 11, c: 0 }, e: { r: 11, c: 17 } });
  }

  // Set column widths
  ws['!cols'] = [
    { wch: 6 },  // 1. Sl.No
    { wch: 12 }, // 2. Date of Notice
    { wch: 10 }, // 3. Time of Notice
    { wch: 28 }, // 4. Name and Address
    { wch: 8 },  // 5. Sex
    { wch: 6 },  // 6. Age
    { wch: 16 }, // 7. Insurance No
    { wch: 22 }, // 8. Shift/Dept/Occ
    { wch: 18 }, // 9. Cause
    { wch: 18 }, // 10. Nature
    { wch: 12 }, // 11. Date
    { wch: 10 }, // 12. Time
    { wch: 16 }, // 13. Place
    { wch: 24 }, // 14. What doing
    { wch: 26 }, // 15. Notice giver
    { wch: 20 }, // 16. Entry maker
    { wch: 20 }, // 17. Witness
    { wch: 16 }, // 18. Remarks
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Form 11 Accident Book');

  const cleanMonth = (safeData.month || 'accident-book').replace(/[^a-zA-Z0-9_-]/g, '_');
  XLSX.writeFile(wb, `Form_11_Accident_Book_${cleanMonth}.xlsx`);
};

/**
 * Generate & Download CSV for Form 11 Accident Book
 */
export const downloadForm11AccidentBookCsv = (reportData = {}, options = {}) => {
  const safeData = reportData || {};
  const records = safeData.records || [];
  const monthLabel = safeData.monthLabel || 'Current Month';
  const nilStatement = safeData.nilStatement || `No Accident in the Month of ${monthLabel}`;

  const headers = [
    'Sl.No',
    'Date of Notice',
    'Time of Notice',
    'Name and Address of Injured Person',
    'Sex',
    'Age',
    'Insurance No.',
    'Shift, department and Occupation of the employee',
    'Details of Injury - Cause',
    'Details of Injury - Nature',
    'Details of Injury - Date',
    'Details of Injury - Time',
    'Details of Injury - Place',
    'What exactly was the injured person doing at the time of accident',
    'Name, occupation, address and signature or thumb impression of notice giver',
    'Signature and designation of person making entry',
    'Signature and designation of second certifier',
    'Remarks',
  ];

  const rows = [];
  if (records.length === 0) {
    rows.push([nilStatement, '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '']);
  } else {
    records.forEach((row, idx) => {
      rows.push([
        row.slNo || idx + 1,
        formatDate(row.noticeDate),
        row.noticeTime || '—',
        `"${(row.injuredPersonName || '—').replace(/"/g, '""')}${row.injuredPersonAddress && row.injuredPersonAddress !== '—' ? `, ${row.injuredPersonAddress.replace(/"/g, '""')}` : ''}"`,
        row.gender || row.sex || 'Male',
        row.age || '—',
        row.insuranceNumber || '—',
        `"${(row.shiftDeptOccupation || '—').replace(/"/g, '""')}"`,
        `"${(row.causeOfInjury || '—').replace(/"/g, '""')}"`,
        `"${(row.natureOfInjury || '—').replace(/"/g, '""')}"`,
        formatDate(row.accidentDate),
        row.accidentTime || '—',
        `"${(row.accidentPlace || '—').replace(/"/g, '""')}"`,
        `"${(row.activityAtAccidentTime || '—').replace(/"/g, '""')}"`,
        `"${(row.noticeGiverDetails || '—').replace(/"/g, '""')}"`,
        `"${(row.entryMakerDetails || '—').replace(/"/g, '""')}"`,
        `"${(row.witnessOrCertifierDetails || row.entryMakerDetails || '—').replace(/"/g, '""')}"`,
        `"${(row.remarks || '—').replace(/"/g, '""')}"`,
      ]);
    });
  }

  const csvContent =
    'data:text/csv;charset=utf-8,' +
    [headers.join(','), ...rows.map((e) => (Array.isArray(e) ? e.join(',') : e))].join('\n');

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  const cleanMonth = (safeData.month || 'accident-book').replace(/[^a-zA-Z0-9_-]/g, '_');
  link.setAttribute('download', `Form_11_Accident_Book_${cleanMonth}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Generate & Download Statutory Landscape PDF for Form 11 Accident Book
 * Exact reproduction matching reference image:
 * - A4 Landscape
 * - 18 Columns perfectly sized to 792 pt
 * - Grey Header (#d8d8d8)
 * - Row numbers (1 to 18)
 * - Centered "No Accident in the Month of <Month Year>" row when empty
 * - "Signature of the Employer" on bottom right
 */
export const downloadForm11AccidentBookPdf = (reportData = {}, options = {}) => {
  const safeData = reportData || {};
  const records = safeData.records || [];
  const company = safeData.company || {};
  const monthLabel = safeData.monthLabel || 'May 2026';
  const nilStatement = safeData.nilStatement || `No Accident in the Month of ${monthLabel}`;

  // Landscape A4: width = 841.89 pt, height = 595.28 pt
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'pt',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginX = 25;
  const contentWidth = pageWidth - marginX * 2; // 841.89 - 50 = 791.89 pt

  let curY = 32;

  // Title: FORM 11
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(20, 20, 20);
  doc.text('FORM 11', pageWidth / 2, curY, { align: 'center' });
  curY += 15;

  // Subtitle: ACCIDENT BOOK
  doc.setFontSize(11);
  doc.text('ACCIDENT BOOK', pageWidth / 2, curY, { align: 'center' });
  curY += 14;

  // EMPLOYEES' STATE INSURANCE CORPORATION
  doc.setFontSize(10);
  doc.text("EMPLOYEES' STATE INSURANCE CORPORATION", pageWidth / 2, curY, { align: 'center' });
  curY += 13;

  // (Regulation 66)
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(9);
  doc.setTextColor(50, 50, 50);
  doc.text('(Regulation 66)', pageWidth / 2, curY, { align: 'center' });
  curY += 16;

  // Prepare table headers matching the statutory 2-tier layout
  // Column definitions (Sum = 791 pt, marginX = 25.4 pt)
  const colWidths = [22, 40, 34, 74, 24, 22, 50, 64, 44, 44, 38, 34, 42, 64, 66, 52, 52, 45];

  const head = [
    // Header Row 1
    [
      { content: 'Sl.No', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
      { content: 'Date of\nNotice', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
      { content: 'Time of\nNotice', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
      { content: 'Name and\nAddress of\nInjured\nPerson', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
      { content: 'Sex', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
      { content: 'Age', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
      { content: 'Insurance\nNo.', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
      { content: 'Shift,\ndepartment\nand\nOccupation\nof the\nemployee', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
      { content: 'Details of Injury', colSpan: 5, styles: { halign: 'center', valign: 'middle' } },
      { content: 'What\nexactly\nwas the\ninjured\nperson\ndoing at\nthe time\nof\naccident', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
      { content: 'Name,\noccupation,\naddress\nand\nsignature\nor the\nthumb\nimpressio\nn of the\nperson(s)\ngiving\nnotice', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
      { content: 'Signature\nand\ndesignati\non of the\nperson\nwho\nmakes the\nentry in\nthe\nAccident\nBook', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
      { content: 'Signature\nand\ndesignati\non of the\nperson\nwho\nmakes the\nentry in\nthe\nAccident\nBook', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
      { content: 'Remarks,\nif any', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
    ],
    // Header Row 2 (Sub-columns under Details of Injury)
    [
      { content: 'Cause', styles: { halign: 'center', valign: 'middle' } },
      { content: 'Nature', styles: { halign: 'center', valign: 'middle' } },
      { content: 'Date', styles: { halign: 'center', valign: 'middle' } },
      { content: 'Time', styles: { halign: 'center', valign: 'middle' } },
      { content: 'Place', styles: { halign: 'center', valign: 'middle' } },
    ],
    // Header Row 3 (Column Numbers 1 to 18)
    [
      { content: '1', styles: { halign: 'center', valign: 'middle' } },
      { content: '2', styles: { halign: 'center', valign: 'middle' } },
      { content: '3', styles: { halign: 'center', valign: 'middle' } },
      { content: '4', styles: { halign: 'center', valign: 'middle' } },
      { content: '5', styles: { halign: 'center', valign: 'middle' } },
      { content: '6', styles: { halign: 'center', valign: 'middle' } },
      { content: '7', styles: { halign: 'center', valign: 'middle' } },
      { content: '8', styles: { halign: 'center', valign: 'middle' } },
      { content: '9', styles: { halign: 'center', valign: 'middle' } },
      { content: '10', styles: { halign: 'center', valign: 'middle' } },
      { content: '11', styles: { halign: 'center', valign: 'middle' } },
      { content: '12', styles: { halign: 'center', valign: 'middle' } },
      { content: '13', styles: { halign: 'center', valign: 'middle' } },
      { content: '14', styles: { halign: 'center', valign: 'middle' } },
      { content: '15', styles: { halign: 'center', valign: 'middle' } },
      { content: '16', styles: { halign: 'center', valign: 'middle' } },
      { content: '17', styles: { halign: 'center', valign: 'middle' } },
      { content: '18', styles: { halign: 'center', valign: 'middle' } },
    ],
  ];

  // Prepare table body
  const body = [];

  if (records.length === 0) {
    // Single row with colSpan 18: "No Accident in the Month of May 2026"
    body.push([
      {
        content: nilStatement,
        colSpan: 18,
        styles: {
          halign: 'center',
          valign: 'middle',
          fontStyle: 'normal',
          fontSize: 9,
          cellPadding: { top: 7, bottom: 7 },
          textColor: [40, 40, 40],
        },
      },
    ]);
  } else {
    records.forEach((row, idx) => {
      body.push([
        { content: String(row.slNo || idx + 1), styles: { halign: 'center' } },
        { content: formatDate(row.noticeDate), styles: { halign: 'center' } },
        { content: row.noticeTime || '—', styles: { halign: 'center' } },
        { content: `${row.injuredPersonName || '—'}${row.injuredPersonAddress && row.injuredPersonAddress !== '—' ? `\n${row.injuredPersonAddress}` : ''}`, styles: { halign: 'left' } },
        { content: row.gender || row.sex || 'Male', styles: { halign: 'center' } },
        { content: String(row.age || '—'), styles: { halign: 'center' } },
        { content: row.insuranceNumber || '—', styles: { halign: 'center' } },
        { content: row.shiftDeptOccupation || '—', styles: { halign: 'left' } },
        { content: row.causeOfInjury || '—', styles: { halign: 'left' } },
        { content: row.natureOfInjury || '—', styles: { halign: 'left' } },
        { content: formatDate(row.accidentDate), styles: { halign: 'center' } },
        { content: row.accidentTime || '—', styles: { halign: 'center' } },
        { content: row.accidentPlace || '—', styles: { halign: 'left' } },
        { content: row.activityAtAccidentTime || '—', styles: { halign: 'left' } },
        { content: row.noticeGiverDetails || '—', styles: { halign: 'left' } },
        { content: row.entryMakerDetails || '—', styles: { halign: 'left' } },
        { content: row.witnessOrCertifierDetails || row.entryMakerDetails || '—', styles: { halign: 'left' } },
        { content: row.remarks || '—', styles: { halign: 'left' } },
      ]);
    });
  }

  // Column styles mapped by index
  const columnStyles = {};
  colWidths.forEach((w, i) => {
    columnStyles[i] = { cellWidth: w };
  });

  autoTable(doc, {
    startY: curY,
    head: head,
    body: body,
    theme: 'grid',
    styles: {
      font: 'helvetica',
      fontSize: 6.5,
      textColor: [20, 20, 20],
      lineColor: [40, 40, 40],
      lineWidth: 0.5,
      cellPadding: 2.5,
      overflow: 'linebreak',
    },
    headStyles: {
      fillColor: [216, 216, 216], // Light gray like statutory format
      textColor: [0, 0, 0],
      fontStyle: 'normal',
      lineColor: [40, 40, 40],
      lineWidth: 0.5,
      fontSize: 6.5,
      cellPadding: 2,
    },
    columnStyles: columnStyles,
    margin: { left: marginX, right: marginX },
    didDrawPage: (data) => {
      // Signature at the bottom right of the page
      const signY = pageHeight - 35;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(30, 30, 30);
      doc.text('Signature of the Employer', pageWidth - marginX - 10, signY, { align: 'right' });
    },
  });

  const cleanMonth = (safeData.month || 'accident-book').replace(/[^a-zA-Z0-9_-]/g, '_');
  const fileName = `Form_11_Accident_Book_${cleanMonth}.pdf`;

  if (options.mode === 'print') {
    doc.autoPrint();
    const blobUrl = doc.output('bloburl');
    window.open(blobUrl, '_blank');
  } else {
    doc.save(fileName);
  }
};

export default {
  downloadForm11AccidentBookPdf,
  downloadForm11AccidentBookExcel,
  downloadForm11AccidentBookCsv,
};
