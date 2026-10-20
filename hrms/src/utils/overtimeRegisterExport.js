import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Download Statutory Register of Overtime (Form XXIII) as Excel (.xlsx) / CSV
 * [FORM XXIII, See Rule 78 (1) (a) (iii) of Contract Labour (Regulation & Abolition) Central Rules, 1971]
 * Matches exact statutory structure from Form XXIII.
 */
export const downloadOvertimeRegisterExcel = (
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

  const aoa = [
    // Row 1: Title
    ['REGISTER OF OVERTIME'],
    // Row 2: Subtitle rule
    ['FORM XXIII, See Rule 78 (1) (a) (iii)'],
    // Row 3: Blank
    [''],
    // Rows 4-7: Establishment Information Block
    ['Name and Address of Contractor :', contractorFull],
    ['Nature and Location of Work :', workLocation],
    ['Name and Address of Establishment in/ under which Contract is Carried on :', establishmentFull],
    ['Name and Address of Principal Employer :', principalEmployer],
    // Row 8: Blank
    [''],
    // Row 9: Table Header Level 1 (Matching Image 1)
    [
      'Sl. No',
      'Name Of the Employee',
      "Father's/ Husband's Name",
      'Sex',
      'Designation / Nature of Employment',
      'Dates on which Overtime Worked',
      'Total Overtime Worked or Production in Case of Piece--Rates',
      'Normal Rate of Wages',
      'Overtime Rate of Wages',
      'Overtime Earnings',
      'Date on which Overtime Wages Paid',
      'Remarks',
    ],
    // Row 10: Column Numbering row (1 to 12)
    ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
  ];

  // Data rows
  records.forEach((r, idx) => {
    aoa.push([
      r.srNo || idx + 1,
      r.name || '—',
      r.fatherName || '—',
      r.sex || 'Male',
      r.designation || 'Staff',
      r.datesOnWhichOvertimeWorked || '—',
      r.totalOvertimeWorked || `${r.totalOvertimeHours || 0} hrs`,
      r.normalRateOfWages || '—',
      r.overtimeRateOfWages || '—',
      Number(r.overtimeEarnings || 0),
      r.dateOnWhichOvertimeWagesPaid || '—',
      r.remarks || '—',
    ]);
  });

  // Summary row
  const totalHours = totals?.totalOvertimeHours ?? records.reduce((sum, r) => sum + (Number(r.totalOvertimeHours) || 0), 0);
  const totalEarnings = totals?.totalOvertimeEarnings ?? records.reduce((sum, r) => sum + (Number(r.overtimeEarnings) || 0), 0);

  aoa.push([
    '',
    `Total Workmen: ${records.length}`,
    '',
    '',
    '',
    'Total OT Hours:',
    `${totalHours} hrs`,
    '',
    'Total OT Earnings:',
    totalEarnings,
    '',
    'Statutory Verified',
  ]);

  const ws = XLSX.utils.aoa_to_sheet(aoa);

  // Set merges
  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 11 } }, // Title
    { s: { r: 1, c: 0 }, e: { r: 1, c: 11 } }, // Rule
    { s: { r: 3, c: 1 }, e: { r: 3, c: 11 } }, // Contractor
    { s: { r: 4, c: 1 }, e: { r: 4, c: 11 } }, // Work Location
    { s: { r: 5, c: 1 }, e: { r: 5, c: 11 } }, // Establishment
    { s: { r: 6, c: 1 }, e: { r: 6, c: 11 } }, // Principal Employer
  ];

  // Column widths
  ws['!cols'] = [
    { wch: 8 },  // Sl. No
    { wch: 24 }, // Name Of the Employee
    { wch: 22 }, // Father's Name
    { wch: 10 }, // Sex
    { wch: 24 }, // Designation
    { wch: 22 }, // Dates on which OT Worked
    { wch: 28 }, // Total OT Worked
    { wch: 26 }, // Normal Rate
    { wch: 22 }, // OT Rate
    { wch: 18 }, // OT Earnings
    { wch: 22 }, // Date Wages Paid
    { wch: 24 }, // Remarks
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Form XXIII Overtime');

  const format = options.format === 'csv' ? 'csv' : 'xlsx';
  const cleanMonth = targetMonth.replace(/[^a-zA-Z0-9]/g, '_');
  const filename = options.filename || `Register_of_Overtime_Form_XXIII_${cleanMonth}.${format}`;

  XLSX.writeFile(wb, filename);
};

/**
 * Download Statutory Register of Overtime (Form XXIII) as PDF
 * [FORM XXIII, See Rule 78 (1) (a) (iii) of Contract Labour (Regulation & Abolition) Central Rules, 1971]
 */
export const downloadOvertimeRegisterPdf = (
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

  // Landscape A3 format for wide statutory registers
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'pt',
    format: 'a3',
  });

  const pageWidth = doc.internal.pageSize.getWidth();

  // 1. Top Header Box
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(1.2);
  doc.rect(24, 24, pageWidth - 48, 48);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(0, 0, 0);
  doc.text('REGISTER OF OVERTIME', pageWidth / 2, 45, { align: 'center' });

  doc.setFontSize(11);
  doc.text('FORM XXIII, See Rule 78 (1) (a) (iii)', pageWidth / 2, 60, { align: 'center' });

  // 2. Establishment Info Box
  doc.setLineWidth(1);
  doc.rect(24, 78, pageWidth - 48, 72);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text('Name and Address of Contractor', 32, 94);
  doc.text('Nature and Location of Work', 32, 110);
  doc.text('Name and Address of Establishment in/ under which Contract is Carried on :', 32, 126);
  doc.text('Name and Address of Principal Employer', 32, 142);

  doc.text(':', 420, 94);
  doc.text(':', 420, 110);
  doc.text(':', 420, 126);
  doc.text(':', 420, 142);

  doc.setFont('helvetica', 'normal');
  doc.text(contractorFull, 432, 94);
  doc.text(workLocation, 432, 110);
  doc.text(establishmentFull, 432, 126);
  doc.text(principalEmployer, 432, 142);

  // 3. Multi-tier Table Headers
  const head = [
    [
      { content: 'Sl.N\no', styles: { halign: 'center', valign: 'middle' } },
      { content: 'Name Of the\nEmployee', styles: { halign: 'center', valign: 'middle' } },
      { content: "Father's/\nHusband's Name", styles: { halign: 'center', valign: 'middle' } },
      { content: 'Sex', styles: { halign: 'center', valign: 'middle' } },
      { content: 'Designation / Nature\nof Employment', styles: { halign: 'center', valign: 'middle' } },
      { content: 'Dates on\nwhich\nOvertime\nWorked', styles: { halign: 'center', valign: 'middle' } },
      { content: 'Total Overtime Worked or\nProduction in Case of\nPiece--Rates', styles: { halign: 'center', valign: 'middle' } },
      { content: 'Normal Rate of\nWages', styles: { halign: 'center', valign: 'middle' } },
      { content: 'Overtime Rate\nof Wages', styles: { halign: 'center', valign: 'middle' } },
      { content: 'Overtime\nEarnings', styles: { halign: 'center', valign: 'middle' } },
      { content: 'Date on which\nOvertime\nWages Paid', styles: { halign: 'center', valign: 'middle' } },
      { content: 'Remarks', styles: { halign: 'center', valign: 'middle' } },
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
      { content: '9', styles: { halign: 'center' } },
      { content: '10', styles: { halign: 'center' } },
      { content: '11', styles: { halign: 'center' } },
      { content: '12', styles: { halign: 'center' } },
    ],
  ];

  const body = records.length > 0
    ? records.map((r, idx) => [
        r.srNo || idx + 1,
        `${r.name || '—'}${r.employeeCode ? `\n(${r.employeeCode})` : ''}`,
        r.fatherName || '—',
        r.sex || 'Male',
        r.designation || 'Staff',
        r.datesOnWhichOvertimeWorked || '—',
        r.totalOvertimeWorked || `${r.totalOvertimeHours || 0} hrs`,
        r.normalRateOfWages || '—',
        r.overtimeRateOfWages || '—',
        `₹${Number(r.overtimeEarnings || 0).toLocaleString('en-IN')}`,
        r.dateOnWhichOvertimeWagesPaid || '—',
        r.remarks || '—',
      ])
    : [
        [
          {
            content: 'No Overtime Records Found for this Period',
            colSpan: 12,
            styles: { halign: 'center', fontStyle: 'italic', textColor: [100, 116, 139] },
          },
        ],
      ];

  const totalHours = totals?.totalOvertimeHours ?? records.reduce((sum, r) => sum + (Number(r.totalOvertimeHours) || 0), 0);
  const totalEarnings = totals?.totalOvertimeEarnings ?? records.reduce((sum, r) => sum + (Number(r.overtimeEarnings) || 0), 0);

  const foot = records.length > 0
    ? [
        [
          '',
          `Workmen: ${records.length}`,
          '',
          '',
          '',
          'Total OT Hours:',
          `${totalHours} hrs`,
          '',
          'Total OT Wages:',
          `₹${totalEarnings.toLocaleString('en-IN')}`,
          '',
          'Verified & Compliant',
        ],
      ]
    : [];

  autoTable(doc, {
    startY: 156,
    margin: { left: 24, right: 24 },
    head,
    body,
    foot,
    theme: 'plain',
    tableLineColor: [0, 0, 0],
    tableLineWidth: 0.8,
    styles: {
      fontSize: 8,
      font: 'helvetica',
      textColor: [0, 0, 0],
      lineColor: [0, 0, 0],
      lineWidth: 0.6,
      cellPadding: 4,
      valign: 'middle',
    },
    headStyles: {
      fontStyle: 'bold',
      fillColor: [255, 255, 255],
      textColor: [0, 0, 0],
      lineWidth: 0.6,
    },
    footStyles: {
      fontStyle: 'bold',
      fillColor: [248, 250, 252],
      textColor: [0, 0, 0],
      lineWidth: 0.8,
    },
    columnStyles: {
      0: { cellWidth: 35, halign: 'center' },  // Sl.No
      1: { cellWidth: 110 },                  // Name
      2: { cellWidth: 95 },                   // Father's Name
      3: { cellWidth: 50, halign: 'center' },  // Sex
      4: { cellWidth: 95 },                   // Designation
      5: { cellWidth: 80, halign: 'center' },  // Dates Worked
      6: { cellWidth: 80, halign: 'center' },  // Total OT Worked
      7: { cellWidth: 115 },                  // Normal Rate
      8: { cellWidth: 85, halign: 'center' },  // OT Rate
      9: { cellWidth: 80, halign: 'right' },   // OT Earnings
      10: { cellWidth: 85, halign: 'center' }, // Date Paid
      11: { cellWidth: 85 },                  // Remarks
    },
    didDrawPage: (data) => {
      const pageCount = doc.internal.getNumberOfPages();
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(
        `Generated from RR Security & Facilities HRMS | Page ${doc.internal.getCurrentPageInfo().pageNumber} of ${pageCount}`,
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 16,
        { align: 'center' }
      );
    },
  });

  const cleanMonth = targetMonth.replace(/[^a-zA-Z0-9]/g, '_');
  const filename = options.filename || `Register_of_Overtime_Form_XXIII_${cleanMonth}.pdf`;

  if (mode === 'print') {
    doc.autoPrint();
    const blobUrl = doc.output('bloburl');
    window.open(blobUrl, '_blank');
  } else {
    doc.save(filename);
  }
};
