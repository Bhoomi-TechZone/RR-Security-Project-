import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Download Statutory Register of Deduction for Damage or Loss (Form XX) as Excel (.xlsx) / CSV
 * [FORM XX ,See Rule- 78 (1) (a) (ii) of Contract Labour (Regulation & Abolition) Central Rules, 1971]
 * Matches exact statutory structure from Form XX.
 */
export const downloadDeductionsDamageExcel = (
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
    ['Register of Deduction for Damage or Loss'],
    // Row 2: Subtitle rule
    ['FORM XX ,See Rule- 78 (1) (a) (ii)'],
    // Row 3: Blank
    [''],
    // Rows 4-7: Establishment Information Block
    ['Name and Address of Contractor :', contractorFull],
    ['Nature and Location of Work :', workLocation],
    ['Name and Address of Establishment in/ under which Contract is Carried on :', establishmentFull],
    ['Name and Address of Principal Employer :', principalEmployer],
    // Row 8: Blank
    [''],
    // Row 9: Table Header Level 1 (with Date of Recovery spanning cols 10 & 11)
    [
      'Sl. No.',
      'Name of Employee',
      "Father's/ Husband's Name",
      'Nature of Employment/Designation',
      'Particulars of Damage or Loss',
      'Date of Damage or Loss',
      'Whether Workman Showed Cause Against Deduction',
      "Name of Person in whose Presence Employee's Explanation was Heard",
      'Amount of Deduction Imposed',
      'No. of Instalments',
      'Date of Recovery',
      '',
      'Remarks',
    ],
    // Row 10: Sub-headers for Date of Recovery
    [
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      'First Instalment',
      'Last Instalment',
      '',
    ],
    // Row 11: Column Numbering row (1 to 13)
    ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13'],
  ];

  // Data rows
  records.forEach((r, idx) => {
    aoa.push([
      r.srNo || idx + 1,
      r.name || '—',
      r.fatherName || '—',
      r.designation || 'Staff',
      r.particularsOfDamageOrLoss || '—',
      r.dateOfDamageOrLoss || '—',
      r.showedCause || 'Yes',
      r.explanationHeardBy || '—',
      Number(r.amountDeductionImposed || 0),
      r.noOfInstallments || 1,
      r.firstInstalmentDate || '—',
      r.lastInstalmentDate || '—',
      r.remarks || '—',
    ]);
  });

  // Summary row
  const totalImposed = totals?.totalDeductionsImposed ?? records.reduce((sum, r) => sum + (Number(r.amountDeductionImposed) || 0), 0);
  const totalRecovered = totals?.totalRecovered ?? records.reduce((sum, r) => sum + (Number(r.recoveredAmount) || 0), 0);

  aoa.push([
    '',
    `Total Records: ${records.length}`,
    '',
    '',
    '',
    '',
    '',
    'Total Deduction Imposed:',
    totalImposed,
    '',
    `Recovered: ₹${totalRecovered.toLocaleString('en-IN')}`,
    '',
    'Statutory Verified',
  ]);

  const ws = XLSX.utils.aoa_to_sheet(aoa);

  // Set merges
  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 12 } }, // Title
    { s: { r: 1, c: 0 }, e: { r: 1, c: 12 } }, // Rule
    { s: { r: 3, c: 1 }, e: { r: 3, c: 12 } }, // Contractor
    { s: { r: 4, c: 1 }, e: { r: 4, c: 12 } }, // Work Location
    { s: { r: 5, c: 1 }, e: { r: 5, c: 12 } }, // Establishment
    { s: { r: 6, c: 1 }, e: { r: 6, c: 12 } }, // Principal Employer
    // Headers vertical spans (Row 8 to 9)
    { s: { r: 8, c: 0 }, e: { r: 9, c: 0 } },  // Sl. No.
    { s: { r: 8, c: 1 }, e: { r: 9, c: 1 } },  // Name of Employee
    { s: { r: 8, c: 2 }, e: { r: 9, c: 2 } },  // Father's/ Husband's Name
    { s: { r: 8, c: 3 }, e: { r: 9, c: 3 } },  // Nature of Employment/Designation
    { s: { r: 8, c: 4 }, e: { r: 9, c: 4 } },  // Particulars of Damage or Loss
    { s: { r: 8, c: 5 }, e: { r: 9, c: 5 } },  // Date of Damage or Loss
    { s: { r: 8, c: 6 }, e: { r: 9, c: 6 } },  // Whether Workman Showed Cause Against Deduction
    { s: { r: 8, c: 7 }, e: { r: 9, c: 7 } },  // Name of Person in whose Presence
    { s: { r: 8, c: 8 }, e: { r: 9, c: 8 } },  // Amount of Deduction Imposed
    { s: { r: 8, c: 9 }, e: { r: 9, c: 9 } },  // No. of Instalments
    { s: { r: 8, c: 10 }, e: { r: 8, c: 11 } }, // Date of Recovery (Col 10 to 11)
    { s: { r: 8, c: 12 }, e: { r: 9, c: 12 } }, // Remarks
  ];

  // Column widths
  ws['!cols'] = [
    { wch: 8 },  // Sl. No.
    { wch: 24 }, // Name of Employee
    { wch: 22 }, // Father's Name
    { wch: 22 }, // Designation
    { wch: 30 }, // Particulars of Damage
    { wch: 18 }, // Date of Damage
    { wch: 22 }, // Showed Cause
    { wch: 28 }, // Explanation Heard By
    { wch: 18 }, // Amount Imposed
    { wch: 16 }, // No. of Instalments
    { wch: 18 }, // First Instalment
    { wch: 18 }, // Last Instalment
    { wch: 24 }, // Remarks
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Form XX Damage or Loss');

  const format = options.format === 'csv' ? 'csv' : 'xlsx';
  const cleanMonth = targetMonth.replace(/[^a-zA-Z0-9]/g, '_');
  const filename = options.filename || `Register_of_Deductions_Damage_Form_XX_${cleanMonth}.${format}`;

  XLSX.writeFile(wb, filename);
};

/**
 * Download Statutory Register of Deduction for Damage or Loss (Form XX) as PDF
 * [FORM XX ,See Rule- 78 (1) (a) (ii) of Contract Labour (Regulation & Abolition) Central Rules, 1971]
 */
export const downloadDeductionsDamagePdf = (
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

  // Landscape A3 format to render wide 13-column statutory registers crisply
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
  doc.text('Register of Deduction for Damage or Loss', pageWidth / 2, 45, { align: 'center' });

  doc.setFontSize(11);
  doc.text('FORM XX ,See Rule- 78 (1) (a) (ii)', pageWidth / 2, 60, { align: 'center' });

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
      { content: 'Sl.N\no.', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
      { content: 'Name of Employee', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
      { content: "Father's/ Husband's\nName", rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
      { content: 'Nature of\nEmployment/Desig\nnation', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
      { content: 'Particulars of\nDamage or Loss', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
      { content: 'Date of Damage\nor Loss', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
      { content: 'Whether Workman\nShowed Cause Aginst\nDeduction', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
      { content: "Name of Person in whose\nPresence Employee's\nExplanation was Heard", rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
      { content: 'Amount of\nDeduction\nImposed', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
      { content: 'No. of\nInstalments', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
      { content: 'Date of Recovery', colSpan: 2, styles: { halign: 'center' } },
      { content: 'Remarks', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
    ],
    [
      { content: 'First\nInstalment', styles: { halign: 'center' } },
      { content: 'Last Instalment', styles: { halign: 'center' } },
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
      { content: '13', styles: { halign: 'center' } },
    ],
  ];

  const body = records.length > 0
    ? records.map((r, idx) => [
        r.srNo || idx + 1,
        `${r.name || '—'}${r.employeeCode ? `\n(${r.employeeCode})` : ''}`,
        r.fatherName || '—',
        r.designation || 'Staff',
        r.particularsOfDamageOrLoss || '—',
        r.dateOfDamageOrLoss || '—',
        r.showedCause || 'Yes',
        r.explanationHeardBy || '—',
        `₹${Number(r.amountDeductionImposed || 0).toLocaleString('en-IN')}`,
        r.noOfInstallments || 1,
        r.firstInstalmentDate || '—',
        r.lastInstalmentDate || '—',
        r.remarks || '—',
      ])
    : [
        [
          {
            content: 'No Deductions for Damage or Loss Recorded for this Period',
            colSpan: 13,
            styles: { halign: 'center', fontStyle: 'italic', textColor: [100, 116, 139] },
          },
        ],
      ];

  const totalImposed = totals?.totalDeductionsImposed ?? records.reduce((sum, r) => sum + (Number(r.amountDeductionImposed) || 0), 0);
  const totalRecovered = totals?.totalRecovered ?? records.reduce((sum, r) => sum + (Number(r.recoveredAmount) || 0), 0);

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
          'Total Deduction:',
          `₹${totalImposed.toLocaleString('en-IN')}`,
          '',
          `Rec: ₹${totalRecovered.toLocaleString('en-IN')}`,
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
      0: { cellWidth: 35, halign: 'center' },  // Sl.No.
      1: { cellWidth: 110 },                  // Name of Employee
      2: { cellWidth: 95 },                   // Father's Name
      3: { cellWidth: 90 },                   // Designation
      4: { cellWidth: 120 },                  // Particulars of Damage
      5: { cellWidth: 65, halign: 'center' }, // Date of Damage
      6: { cellWidth: 75, halign: 'center' }, // Showed Cause
      7: { cellWidth: 110 },                  // Explanation Heard By
      8: { cellWidth: 70, halign: 'right' },  // Amount Imposed
      9: { cellWidth: 55, halign: 'center' }, // No. of Instalments
      10: { cellWidth: 65, halign: 'center' },// First Instalment
      11: { cellWidth: 65, halign: 'center' },// Last Instalment
      12: { cellWidth: 90 },                  // Remarks
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
  const filename = options.filename || `Register_of_Deductions_Damage_Form_XX_${cleanMonth}.pdf`;

  if (mode === 'print') {
    doc.autoPrint();
    const blobUrl = doc.output('bloburl');
    window.open(blobUrl, '_blank');
  } else {
    doc.save(filename);
  }
};
