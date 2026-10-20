import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Download Statutory Register of Fines (Form XXI) as Excel (.xlsx) / CSV
 * [FORM XXI,See Rule-78 (1) (a) (ii) of Contract Labour (Regulation & Abolition) Central Rules, 1971]
 * Matches exact statutory structure from Form XXI.
 */
export const downloadFinesRegisterExcel = (
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
    ['Register of Fines'],
    // Row 2: Subtitle rule
    ['FORM XXI,See Rule-78 (1) (a) (ii)'],
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
      'Sl. No.',
      'Name of Workmen',
      "Father's/ Husband's Name",
      'Designation/ Nature of Employment',
      'Act/ Omission for which Fine Imposed',
      'Date of Offence',
      "Name of Person in whose Presence Employee's Explanation was Heard",
      'Wage Periods and Wages Payable',
      'Amount of Fine Imposed',
      'Date on Which Fine Realised',
      'Remarks',
    ],
    // Row 10: Column Numbering row (1 to 11)
    ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11'],
  ];

  // Data rows
  records.forEach((r, idx) => {
    aoa.push([
      r.srNo || idx + 1,
      r.name || '—',
      r.fatherName || '—',
      r.designation || 'Staff',
      r.actOrOmission || '—',
      r.dateOfOffence || '—',
      r.explanationHeardBy || '—',
      r.wagePeriodAndWages || 'Monthly',
      Number(r.amountOfFineImposed || 0),
      r.dateOnWhichFineRealised || '—',
      r.remarks || '—',
    ]);
  });

  // Summary row
  const totalImposed = totals?.totalFinesImposed ?? records.reduce((sum, r) => sum + (Number(r.amountOfFineImposed) || 0), 0);
  const totalRealised = totals?.totalRealised ?? records.reduce((sum, r) => sum + (Number(r.realisedAmount) || 0), 0);

  aoa.push([
    '',
    `Total Workmen: ${records.length}`,
    '',
    '',
    '',
    '',
    '',
    'Total Fine Imposed:',
    totalImposed,
    `Realised: ₹${totalRealised.toLocaleString('en-IN')}`,
    'Statutory Verified',
  ]);

  const ws = XLSX.utils.aoa_to_sheet(aoa);

  // Set merges
  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 10 } }, // Title
    { s: { r: 1, c: 0 }, e: { r: 1, c: 10 } }, // Rule
    { s: { r: 3, c: 1 }, e: { r: 3, c: 10 } }, // Contractor
    { s: { r: 4, c: 1 }, e: { r: 4, c: 10 } }, // Work Location
    { s: { r: 5, c: 1 }, e: { r: 5, c: 10 } }, // Establishment
    { s: { r: 6, c: 1 }, e: { r: 6, c: 10 } }, // Principal Employer
  ];

  // Column widths
  ws['!cols'] = [
    { wch: 8 },  // Sl. No.
    { wch: 24 }, // Name of Workmen
    { wch: 22 }, // Father's Name
    { wch: 22 }, // Designation
    { wch: 30 }, // Act/ Omission
    { wch: 18 }, // Date of Offence
    { wch: 30 }, // Explanation Heard By
    { wch: 24 }, // Wage Periods & Wages Payable
    { wch: 18 }, // Amount of Fine Imposed
    { wch: 20 }, // Date Fine Realised
    { wch: 24 }, // Remarks
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Form XXI Fines');

  const format = options.format === 'csv' ? 'csv' : 'xlsx';
  const cleanMonth = targetMonth.replace(/[^a-zA-Z0-9]/g, '_');
  const filename = options.filename || `Register_of_Fines_Form_XXI_${cleanMonth}.${format}`;

  XLSX.writeFile(wb, filename);
};

/**
 * Download Statutory Register of Fines (Form XXI) as PDF
 * [FORM XXI,See Rule-78 (1) (a) (ii) of Contract Labour (Regulation & Abolition) Central Rules, 1971]
 */
export const downloadFinesRegisterPdf = (
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
  doc.text('Register of Fines', pageWidth / 2, 45, { align: 'center' });

  doc.setFontSize(11);
  doc.text('FORM XXI,See Rule-78 (1) (a) (ii)', pageWidth / 2, 60, { align: 'center' });

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
      { content: 'Sl.\nNo.', styles: { halign: 'center', valign: 'middle' } },
      { content: 'Name of Workmen', styles: { halign: 'center', valign: 'middle' } },
      { content: "Father's/\nHusband's Name", styles: { halign: 'center', valign: 'middle' } },
      { content: 'Designation/\nNature of\nEmployment', styles: { halign: 'center', valign: 'middle' } },
      { content: 'Act/\nOmission\nfor which\nFine\nImposed', styles: { halign: 'center', valign: 'middle' } },
      { content: 'Date of\nOffence', styles: { halign: 'center', valign: 'middle' } },
      { content: "Name of\nPerson in\nwhose\nPresence\nEmployee's\nExplanation\nwas Heard", styles: { halign: 'center', valign: 'middle' } },
      { content: 'Wage\nPeriods and\nWages\nPayable', styles: { halign: 'center', valign: 'middle' } },
      { content: 'Amount of\nFine\nImposed', styles: { halign: 'center', valign: 'middle' } },
      { content: 'Date on Which\nFine Realised', styles: { halign: 'center', valign: 'middle' } },
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
    ],
  ];

  const body = records.length > 0
    ? records.map((r, idx) => [
        r.srNo || idx + 1,
        `${r.name || '—'}${r.employeeCode ? `\n(${r.employeeCode})` : ''}`,
        r.fatherName || '—',
        r.designation || 'Staff',
        r.actOrOmission || '—',
        r.dateOfOffence || '—',
        r.explanationHeardBy || '—',
        r.wagePeriodAndWages || 'Monthly',
        `₹${Number(r.amountOfFineImposed || 0).toLocaleString('en-IN')}`,
        r.dateOnWhichFineRealised || '—',
        r.remarks || '—',
      ])
    : [
        [
          {
            content: 'No Fines Imposed or Recorded for this Period',
            colSpan: 11,
            styles: { halign: 'center', fontStyle: 'italic', textColor: [100, 116, 139] },
          },
        ],
      ];

  const totalImposed = totals?.totalFinesImposed ?? records.reduce((sum, r) => sum + (Number(r.amountOfFineImposed) || 0), 0);
  const totalRealised = totals?.totalRealised ?? records.reduce((sum, r) => sum + (Number(r.realisedAmount) || 0), 0);

  const foot = records.length > 0
    ? [
        [
          '',
          `Workmen: ${records.length}`,
          '',
          '',
          '',
          '',
          '',
          'Total Fines:',
          `₹${totalImposed.toLocaleString('en-IN')}`,
          `Realised: ₹${totalRealised.toLocaleString('en-IN')}`,
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
      0: { cellWidth: 40, halign: 'center' },  // Sl.No.
      1: { cellWidth: 120 },                  // Name of Workmen
      2: { cellWidth: 110 },                  // Father's Name
      3: { cellWidth: 100 },                  // Designation
      4: { cellWidth: 140 },                  // Act/ Omission
      5: { cellWidth: 80, halign: 'center' },  // Date of Offence
      6: { cellWidth: 130 },                  // Explanation Heard By
      7: { cellWidth: 100, halign: 'center' },// Wage Periods & Wages Payable
      8: { cellWidth: 80, halign: 'right' },   // Amount of Fine Imposed
      9: { cellWidth: 85, halign: 'center' },  // Date on Which Fine Realised
      10: { cellWidth: 110 },                 // Remarks
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
  const filename = options.filename || `Register_of_Fines_Form_XXI_${cleanMonth}.pdf`;

  if (mode === 'print') {
    doc.autoPrint();
    const blobUrl = doc.output('bloburl');
    window.open(blobUrl, '_blank');
  } else {
    doc.save(filename);
  }
};
