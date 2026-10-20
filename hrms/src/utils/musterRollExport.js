import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Download Statutory Muster Roll (Form XVI) as Excel (.xlsx) / CSV
 * [See Rule 78(1)(a)(i) of Contract Labour (Regulation & Abolition) Central Rules, 1971]
 * Matches exact structure shown in Image 1.
 */
export const downloadMusterRollExcel = (
  records = [],
  companyInfo = {},
  period = {},
  totals = {},
  options = {}
) => {
  const defaultComp = companyInfo || {};
  const contractorFull = `${defaultComp.name || 'RR SECURITY & FACILITIES'}, ${defaultComp.address || 'G-75/A Badarpur New Delhi-110044'}`;
  const firstRec = records[0] || {};
  const establishmentFull = firstRec.establishmentFull || 'Client Establishment Site, Delhi NCR';
  const workLocation = firstRec.workNameLocation || `Security & Facility Services, At ${firstRec.establishmentName || 'Client Site'}`;
  const principalEmployer = firstRec.principalEmployer || `The Management, ${establishmentFull}`;

  const targetMonth = period.month || `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
  const daysInMonth = period.daysInMonth || 31;
  const totalCols = 4 + daysInMonth + 2; // Sl, Name, Father, Gender, days, Total, Remarks

  const aoa = [
    // Row 1: Title
    ['Muster Roll'],
    // Row 2: Subtitle rule
    ['Form XVI [See Rule 78(1)(a)(i)]'],
    // Row 3: Blank
    [''],
    // Rows 4-7: Establishment Information
    ['Name and Address of Contractor :', contractorFull],
    ['Nature and Location of Work :', workLocation],
    ['Name and Address of Establishment in/ under which Contract is Carried on :', establishmentFull],
    ['Name and Address of Principal Employer :', principalEmployer],
    // Row 8: Blank
    [''],
  ];

  // Row 9: Table Header Level 1
  const h1 = ['Sl. No.', 'Name Of Employee', "Father's/ Husband's Name", 'Gender'];
  for (let d = 1; d <= daysInMonth; d++) {
    h1.push(d === 1 ? 'Date / Units' : '');
  }
  h1.push('Total No of days/Units Worked');
  h1.push('Remarks');
  aoa.push(h1);

  // Row 10: Table Header Level 2 (Days & Column numbers)
  const h2 = ['1', '2', '3', '4'];
  for (let d = 1; d <= daysInMonth; d++) {
    h2.push(String(d));
  }
  h2.push('6');
  h2.push('7');
  aoa.push(h2);

  // Data rows
  records.forEach((r, idx) => {
    const row = [
      r.srNo || idx + 1,
      r.name || '—',
      r.fatherName || '—',
      r.gender || '—',
    ];
    for (let d = 1; d <= daysInMonth; d++) {
      row.push(r.dailyAttendance?.[d] || '—');
    }
    row.push(r.totalDaysWorked ?? 0);
    row.push(r.remarks || '—');
    aoa.push(row);
  });

  const ws = XLSX.utils.aoa_to_sheet(aoa);

  // Set merges
  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: totalCols - 1 } }, // Title
    { s: { r: 1, c: 0 }, e: { r: 1, c: totalCols - 1 } }, // Rule
    { s: { r: 3, c: 1 }, e: { r: 3, c: totalCols - 1 } }, // Contractor
    { s: { r: 4, c: 1 }, e: { r: 4, c: totalCols - 1 } }, // Work Location
    { s: { r: 5, c: 1 }, e: { r: 5, c: totalCols - 1 } }, // Establishment
    { s: { r: 6, c: 1 }, e: { r: 6, c: totalCols - 1 } }, // Principal Employer
    { s: { r: 8, c: 4 }, e: { r: 8, c: 4 + daysInMonth - 1 } }, // Date / Units super-header
  ];

  // Set column widths
  const colWidths = [
    { wch: 8 },  // Sl No
    { wch: 24 }, // Name
    { wch: 22 }, // Father's Name
    { wch: 10 }, // Gender
  ];
  for (let d = 1; d <= daysInMonth; d++) {
    colWidths.push({ wch: 4.5 }); // Day col
  }
  colWidths.push({ wch: 16 }); // Total Worked
  colWidths.push({ wch: 20 }); // Remarks
  ws['!cols'] = colWidths;

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Muster Roll Form XVI');

  const format = options.format === 'csv' ? 'csv' : 'xlsx';
  const cleanMonth = targetMonth.replace(/[^a-zA-Z0-9]/g, '_');
  const filename = options.filename || `Muster_Roll_Form_XVI_${cleanMonth}.${format}`;

  XLSX.writeFile(wb, filename);
};

/**
 * Download Statutory Muster Roll (Form XVI) as PDF
 * [See Rule 78(1)(a)(i) of Contract Labour (Regulation & Abolition) Central Rules, 1971]
 */
export const downloadMusterRollPdf = (
  records = [],
  companyInfo = {},
  period = {},
  totals = {},
  options = {}
) => {
  const mode = options.mode || 'download';
  const defaultComp = companyInfo || {};
  const contractorFull = `${defaultComp.name || 'RR SECURITY & FACILITIES'}, ${defaultComp.address || 'G-75/A Badarpur New Delhi-110044'}`;
  const firstRec = records[0] || {};
  const establishmentFull = firstRec.establishmentFull || 'Client Establishment Site, Delhi NCR';
  const workLocation = firstRec.workNameLocation || `Security & Facility Services, At ${firstRec.establishmentName || 'Client Site'}`;
  const principalEmployer = firstRec.principalEmployer || `The Management, ${establishmentFull}`;

  const targetMonth = period.month || `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
  const daysInMonth = period.daysInMonth || 31;

  // Landscape A3 gives optimal fidelity for 35+ column Muster Rolls
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'pt',
    format: 'a3',
  });

  const pageWidth = doc.internal.pageSize.getWidth();

  // 1. Top Header Box (Matching Image 1)
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(1.2);
  doc.rect(24, 24, pageWidth - 48, 48);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(0, 0, 0);
  doc.text('Muster Roll', pageWidth / 2, 45, { align: 'center' });

  doc.setFontSize(10.5);
  doc.text('Form XVI [See Rule 78(1)(a)(i)]', pageWidth / 2, 60, { align: 'center' });

  // 2. Establishment Info Box (Matching Image 1)
  doc.setLineWidth(1);
  doc.rect(24, 78, pageWidth - 48, 72);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('Name and Address of Contractor', 32, 94);
  doc.text('Nature and Location of Work', 32, 110);
  doc.text('Name and Address of Establishment in/ under which Contract is Carried on :', 32, 126);
  doc.text('Name and Address of Principal Employer', 32, 142);

  doc.text(':', 380, 94);
  doc.text(':', 380, 110);
  doc.text(':', 380, 126);
  doc.text(':', 380, 142);

  doc.setFont('helvetica', 'normal');
  doc.text(contractorFull, 392, 94);
  doc.text(workLocation, 392, 110);
  doc.text(establishmentFull, 392, 126);
  doc.text(principalEmployer, 392, 142);

  // 3. Prepare Table Headers
  const h1 = [
    { content: 'Sl.\nNo.', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
    { content: 'Name Of Employee', rowSpan: 2, styles: { halign: 'left', valign: 'middle' } },
    { content: "Father's/ Husband's\nName", rowSpan: 2, styles: { halign: 'left', valign: 'middle' } },
    { content: 'Gender', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
    { content: 'Date / Units', colSpan: daysInMonth, styles: { halign: 'center' } },
    { content: 'Total No of\ndays/Units\nWorked', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
    { content: 'Remarks', rowSpan: 2, styles: { halign: 'left', valign: 'middle' } },
  ];

  const h2 = [];
  for (let d = 1; d <= daysInMonth; d++) {
    h2.push({ content: String(d), styles: { halign: 'center' } });
  }

  // Row with column numbers (1, 2, 3, 4, 5, 6, 7) matching Image 1
  const h3 = [
    { content: '1', styles: { halign: 'center' } },
    { content: '2', styles: { halign: 'center' } },
    { content: '3', styles: { halign: 'center' } },
    { content: '4', styles: { halign: 'center' } },
    { content: '5', colSpan: daysInMonth, styles: { halign: 'center' } },
    { content: '6', styles: { halign: 'center' } },
    { content: '7', styles: { halign: 'center' } },
  ];

  const body = records.map((r, idx) => {
    const row = [
      r.srNo || idx + 1,
      r.name || '—',
      r.fatherName || '—',
      r.gender || '—',
    ];
    for (let d = 1; d <= daysInMonth; d++) {
      row.push(r.dailyAttendance?.[d] || '—');
    }
    row.push(r.totalDaysWorked ?? 0);
    row.push(r.remarks || '—');
    return row;
  });

  const columnStyles = {
    0: { halign: 'center', cellWidth: 26 },
    1: { halign: 'left', cellWidth: 90 },
    2: { halign: 'left', cellWidth: 80 },
    3: { halign: 'center', cellWidth: 42 },
  };

  const dayCellWidth = Math.max(14, Math.floor((pageWidth - 48 - 26 - 90 - 80 - 42 - 50 - 70) / daysInMonth));
  for (let d = 1; d <= daysInMonth; d++) {
    columnStyles[3 + d] = { halign: 'center', cellWidth: dayCellWidth };
  }
  columnStyles[4 + daysInMonth] = { halign: 'center', cellWidth: 50 };
  columnStyles[5 + daysInMonth] = { halign: 'left', cellWidth: 70 };

  autoTable(doc, {
    startY: 156,
    head: [h1, h2, h3],
    body,
    theme: 'grid',
    styles: {
      fontSize: 7.5,
      textColor: [0, 0, 0],
      lineColor: [0, 0, 0],
      lineWidth: 0.5,
      cellPadding: 3,
      valign: 'middle',
    },
    headStyles: {
      fillColor: [255, 255, 255],
      textColor: [0, 0, 0],
      fontStyle: 'bold',
      lineColor: [0, 0, 0],
      lineWidth: 0.6,
      halign: 'center',
    },
    columnStyles,
    margin: { left: 24, right: 24, bottom: 24 },
  });

  if (mode === 'print') {
    doc.autoPrint();
    const blobUrl = doc.output('bloburl');
    const printWindow = window.open(blobUrl, '_blank');
    if (printWindow) {
      printWindow.focus();
    }
  } else {
    const cleanMonth = targetMonth.replace(/[^a-zA-Z0-9]/g, '_');
    const filename = options.filename || `Muster_Roll_Form_XVI_${cleanMonth}.pdf`;
    doc.save(filename);
  }
};
