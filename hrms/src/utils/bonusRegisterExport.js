import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Download Bonus Register (Form C) as statutory Excel (.xlsx) / CSV file
 * Matches exact layout from Image 1:
 * - FORM C
 * - [See rule 4(c)]
 * - Bonus paid to employees for the accounting year ending on April - YYYY to March - YYYY.
 * - Columns 1 to 16 with numbered subheaders and Grand Total row.
 */
export const downloadBonusRegisterExcel = (
  records = [],
  companyInfo = {},
  period = {},
  totals = {},
  options = {}
) => {
  const companyName = (companyInfo.name || 'RR SECURITY & FACILITIES').toUpperCase();
  const companyAddress = companyInfo.address || 'G-75/A, Ground Floor, Block-G M.B. EXTN., Badarpur New Delhi-110044';
  const accountingYear =
    period.accountingYear ||
    `April - ${new Date().getFullYear() - 1} to March - ${new Date().getFullYear()}`;
  const accountingYearEnding =
    period.accountingYearEnding ||
    (period.endYear ? `31 Mar ${period.endYear}` : '31 Mar 2026');
  const workingDaysInYear = period.workingDaysInYear || companyInfo.workingDaysInYear || 365;

  // 1. Construct Array-of-Arrays (AOA) matching Image 2
  const aoa = [
    // Row 1: Title
    ['FORM C'],
    // Row 2: Subtitle rule
    ['[See Rule 4(C)]'],
    // Row 3: Main header
    [`Bonus paid to employees for the accounting year ending on the ${accountingYearEnding}`],
    // Row 4: Establishment Name
    ['Name of the establishment:', `${companyName} ${companyAddress}`],
    // Row 5: Working days
    ['No. of working days in the year:', workingDaysInYear],
    // Row 6: Empty spacer
    [],
    // Row 7: Column Header Names matching Image 2
    [
      'SL. NO',
      'Name of the employee',
      "Father's Name",
      'Whether he has completed 15 years of age at the beginning of the financial',
      'Designation',
      'No. of days worked in the year',
      'Total salary wage in respect of the accounting year',
      'Amount of bonus payable under Section 10 or Section 11, as the case may be',
      'Puja bonus or other customary bonus paid during the accounting',
      'Interim bonus or bonus paid in advance',
      'Amount of income tax deducted',
      'Deduction on account of financial loss if any, caused by misconduct',
      'Total sum deducted under Columns 9, 10,10-A and 11',
      'Net amount payable (column 8 minus Column 12)',
      'Amount actually paid',
      'Due on which paid',
      'Signature/Thumb impression of the employee',
    ],
    // Row 8: Column Numbers matching Image 2
    [
      '1',
      '2',
      '3',
      '4',
      '5',
      '6',
      '7',
      '8',
      '9',
      '10',
      '10-A',
      '11',
      '12',
      '13',
      '14',
      '15',
      '16',
    ],
  ];

  // Totals accumulators
  let sumDaysWorked = 0;
  let sumWages = 0;
  let sumBonusPayable = 0;
  let sumCol9 = 0;
  let sumCol10 = 0;
  let sumCol10A = 0;
  let sumCol11 = 0;
  let sumDeductions = 0;
  let sumNetPayable = 0;
  let sumAmountPaid = 0;

  records.forEach((r, idx) => {
    const srNo = r.srNo || idx + 1;
    const empDisplayName =
      r.displayName ||
      (r.employeeCode
        ? `${r.name} (${r.employeeCode})`
        : r.employeeId
        ? `${r.name} (${r.employeeId})`
        : r.name || '');
    const fatherName = r.fatherName || '';
    const completed15 = (r.completed15Years || 'YES').toUpperCase();
    const designation = r.designation || 'Staff';
    const daysWorked = Number(r.daysWorked) || 0;
    const totalWages = Number(r.totalWages) || 0;
    const bonusPayable = Number(r.bonusPayable) || 0;
    const col9 = Number(r.pujaBonusDeduction) || 0;
    const col10 = Number(r.interimBonusAdvance) || 0;
    const col10A = Number(r.taxDeducted) || 0;
    const col11 = Number(r.financialLossMisconduct) || 0;
    const totalDeduct = Number(r.totalDeductions) || col9 + col10 + col10A + col11;
    const netPayable = Number(r.netPayable) || Math.max(0, bonusPayable - totalDeduct);
    const amountPaid = Number(r.amountPaid) || netPayable;
    const paymentDate = r.paymentDate || `31-Mar-${period.endYear || new Date().getFullYear()}`;

    sumDaysWorked += daysWorked;
    sumWages += totalWages;
    sumBonusPayable += bonusPayable;
    sumCol9 += col9;
    sumCol10 += col10;
    sumCol10A += col10A;
    sumCol11 += col11;
    sumDeductions += totalDeduct;
    sumNetPayable += netPayable;
    sumAmountPaid += amountPaid;

    aoa.push([
      srNo,
      empDisplayName,
      fatherName,
      completed15,
      designation,
      Number(daysWorked.toFixed(2)),
      Number(totalWages.toFixed(2)),
      Number(bonusPayable.toFixed(2)),
      Number(col9.toFixed(2)),
      Number(col10.toFixed(2)),
      Number(col10A.toFixed(2)),
      Number(col11.toFixed(2)),
      Number(totalDeduct.toFixed(2)),
      Number(netPayable.toFixed(2)),
      Number(amountPaid.toFixed(2)),
      paymentDate,
      '',
    ]);
  });

  // Grand Total Row matching Image 2
  const grandTotalRowIndex = aoa.length;
  aoa.push([
    'Grand Total',
    '',
    '',
    '',
    '',
    Number(sumDaysWorked.toFixed(2)),
    Number(sumWages.toFixed(2)),
    Number(sumBonusPayable.toFixed(2)),
    Number(sumCol9.toFixed(2)),
    Number(sumCol10.toFixed(2)),
    Number(sumCol10A.toFixed(2)),
    Number(sumCol11.toFixed(2)),
    Number(sumDeductions.toFixed(2)),
    Number(sumNetPayable.toFixed(2)),
    Number(sumAmountPaid.toFixed(2)),
    '',
    '',
  ]);

  const ws = XLSX.utils.aoa_to_sheet(aoa);

  // Set merges for header and grand total
  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 16 } }, // Title
    { s: { r: 1, c: 0 }, e: { r: 1, c: 16 } }, // Subtitle rule
    { s: { r: 2, c: 0 }, e: { r: 2, c: 16 } }, // Year header
    { s: { r: 3, c: 1 }, e: { r: 3, c: 16 } }, // Establishment
    { s: { r: 4, c: 1 }, e: { r: 4, c: 16 } }, // Working days
    { s: { r: grandTotalRowIndex, c: 0 }, e: { r: grandTotalRowIndex, c: 4 } }, // Grand Total label cols 1-5
  ];

  // Set column widths
  ws['!cols'] = [
    { wch: 8 },  // 1: SL. NO
    { wch: 28 }, // 2: Name of the employee
    { wch: 20 }, // 3: Father's Name
    { wch: 22 }, // 4: Age 15+
    { wch: 18 }, // 5: Designation
    { wch: 14 }, // 6: No. of days worked
    { wch: 18 }, // 7: Total salary wage
    { wch: 18 }, // 8: Bonus Payable under Sec 10/11
    { wch: 16 }, // 9: Puja bonus
    { wch: 16 }, // 10: Interim bonus
    { wch: 16 }, // 10-A: Tax Deducted
    { wch: 22 }, // 11: Financial Loss
    { wch: 18 }, // 12: Total sum deducted
    { wch: 18 }, // 13: Net amount payable
    { wch: 18 }, // 14: Amount actually paid
    { wch: 16 }, // 15: Due on which paid
    { wch: 22 }, // 16: Signature/Thumb impression
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Form C - Bonus Register');

  const cleanYear = accountingYear.replace(/[^a-zA-Z0-9]/g, '_');
  const format = options.format === 'csv' ? 'csv' : 'xlsx';
  const filename = options.filename || `Form_C_Bonus_Paid_${cleanYear}.${format}`;

  if (format === 'csv') {
    const csvContent = XLSX.utils.sheet_to_csv(ws);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } else {
    XLSX.writeFile(wb, filename);
  }
};

/**
 * Download or Print Bonus Register (Form C) as printable PDF
 * Statutory landscape layout with complete 16 columns matching Image 2.
 */
export const downloadBonusRegisterPdf = (
  records = [],
  companyInfo = {},
  period = {},
  totals = {},
  options = {}
) => {
  const mode = options.mode || 'download';
  const companyName = (companyInfo.name || 'RR SECURITY & FACILITIES').toUpperCase();
  const companyAddress = companyInfo.address || 'G-75/A, Ground Floor, Block-G M.B. EXTN., Badarpur New Delhi-110044';
  const accountingYear =
    period.accountingYear ||
    `April - ${new Date().getFullYear() - 1} to March - ${new Date().getFullYear()}`;
  const accountingYearEnding =
    period.accountingYearEnding ||
    (period.endYear ? `31 Mar ${period.endYear}` : '31 Mar 2026');
  const workingDaysInYear = period.workingDaysInYear || companyInfo.workingDaysInYear || 365;

  // Landscape A3 gives optimal fidelity for 16-column wide statutory registers
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'pt',
    format: 'a3',
  });

  const pageWidth = doc.internal.pageSize.getWidth();

  // 1. Official Header matching Image 2
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(17, 24, 39);
  doc.text('FORM C', pageWidth / 2, 38, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(55, 65, 81);
  doc.text('[See Rule 4(C)]', pageWidth / 2, 53, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11.5);
  doc.setTextColor(17, 24, 39);
  doc.text(
    `Bonus paid to employees for the accounting year ending on the ${accountingYearEnding}`,
    pageWidth / 2,
    69,
    { align: 'center' }
  );

  // Subheader: Establishment Name & Working Days
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(17, 24, 39);
  doc.text(`Name of the establishment: `, 28, 88);
  doc.setFont('helvetica', 'normal');
  doc.text(`${companyName} ${companyAddress}`, 160, 88);

  doc.setFont('helvetica', 'bold');
  doc.text(`No. of working days in the year: `, 28, 102);
  doc.setFont('helvetica', 'normal');
  doc.text(`${workingDaysInYear}`, 180, 102);

  // 2. Prepare 2-level Table Header matching Image 2
  const head = [
    [
      { content: 'SL. NO', rowSpan: 2, styles: { halign: 'center' } },
      { content: 'Name of the employee', rowSpan: 2, styles: { halign: 'left' } },
      { content: "Father's Name", rowSpan: 2, styles: { halign: 'left' } },
      { content: 'Whether he has completed 15 years of age at the beginning of the financial', rowSpan: 2, styles: { halign: 'center' } },
      { content: 'Designation', rowSpan: 2, styles: { halign: 'left' } },
      { content: 'No. of days worked in the year', rowSpan: 2, styles: { halign: 'right' } },
      { content: 'Total salary wage in respect of the accounting year', rowSpan: 2, styles: { halign: 'right' } },
      { content: 'Amount of bonus payable under Section 10 or Section 11, as the case may be', rowSpan: 2, styles: { halign: 'right' } },
      { content: 'Deductions', colSpan: 4, styles: { halign: 'center', fontStyle: 'bold' } },
      { content: 'Total sum deducted under Columns 9, 10,10-A and 11', rowSpan: 2, styles: { halign: 'right' } },
      { content: 'Net amount payable (column 8 minus Column 12)', rowSpan: 2, styles: { halign: 'right' } },
      { content: 'Amount actually paid', rowSpan: 2, styles: { halign: 'right' } },
      { content: 'Due on which paid', rowSpan: 2, styles: { halign: 'center' } },
      { content: 'Signature/Thumb impression of the employee', rowSpan: 2, styles: { halign: 'center' } },
    ],
    [
      { content: 'Puja bonus or other customary bonus paid during the accounting', styles: { halign: 'right' } },
      { content: 'Interim bonus or bonus paid in advance', styles: { halign: 'right' } },
      { content: 'Amount of income tax deducted', styles: { halign: 'right' } },
      { content: 'Deduction on account of financial loss if any, caused by misconduct', styles: { halign: 'right' } },
    ],
    [
      '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '10-A', '11', '12', '13', '14', '15', '16'
    ]
  ];

  let sumDaysWorked = 0;
  let sumWages = 0;
  let sumBonusPayable = 0;
  let sumCol9 = 0;
  let sumCol10 = 0;
  let sumCol10A = 0;
  let sumCol11 = 0;
  let sumDeductions = 0;
  let sumNetPayable = 0;
  let sumAmountPaid = 0;

  const body = records.map((r, idx) => {
    const srNo = r.srNo || idx + 1;
    const empDisplayName =
      r.displayName ||
      (r.employeeCode
        ? `${r.name} (${r.employeeCode})`
        : r.employeeId
        ? `${r.name} (${r.employeeId})`
        : r.name || '');
    const fatherName = r.fatherName || '';
    const completed15 = (r.completed15Years || 'YES').toUpperCase();
    const designation = r.designation || 'Staff';
    const daysWorked = Number(r.daysWorked) || 0;
    const totalWages = Number(r.totalWages) || 0;
    const bonusPayable = Number(r.bonusPayable) || 0;
    const col9 = Number(r.pujaBonusDeduction) || 0;
    const col10 = Number(r.interimBonusAdvance) || 0;
    const col10A = Number(r.taxDeducted) || 0;
    const col11 = Number(r.financialLossMisconduct) || 0;
    const totalDeduct = Number(r.totalDeductions) || col9 + col10 + col10A + col11;
    const netPayable = Number(r.netPayable) || Math.max(0, bonusPayable - totalDeduct);
    const amountPaid = Number(r.amountPaid) || netPayable;
    const paymentDate = r.paymentDate || `31-Mar-${period.endYear || new Date().getFullYear()}`;

    sumDaysWorked += daysWorked;
    sumWages += totalWages;
    sumBonusPayable += bonusPayable;
    sumCol9 += col9;
    sumCol10 += col10;
    sumCol10A += col10A;
    sumCol11 += col11;
    sumDeductions += totalDeduct;
    sumNetPayable += netPayable;
    sumAmountPaid += amountPaid;

    return [
      srNo,
      empDisplayName,
      fatherName,
      completed15,
      designation,
      daysWorked.toFixed(2),
      totalWages.toFixed(2),
      bonusPayable.toFixed(2),
      col9.toFixed(2),
      col10.toFixed(2),
      col10A.toFixed(2),
      col11.toFixed(2),
      totalDeduct.toFixed(2),
      netPayable.toFixed(2),
      amountPaid.toFixed(2),
      paymentDate,
      '',
    ];
  });

  const foot = [
    [
      { content: 'Grand Total', colSpan: 5, styles: { halign: 'center', fontStyle: 'bold' } },
      { content: sumDaysWorked.toFixed(2), styles: { halign: 'right', fontStyle: 'bold' } },
      { content: sumWages.toFixed(2), styles: { halign: 'right', fontStyle: 'bold' } },
      { content: sumBonusPayable.toFixed(2), styles: { halign: 'right', fontStyle: 'bold' } },
      { content: sumCol9.toFixed(2), styles: { halign: 'right', fontStyle: 'bold' } },
      { content: sumCol10.toFixed(2), styles: { halign: 'right', fontStyle: 'bold' } },
      { content: sumCol10A.toFixed(2), styles: { halign: 'right', fontStyle: 'bold' } },
      { content: sumCol11.toFixed(2), styles: { halign: 'right', fontStyle: 'bold' } },
      { content: sumDeductions.toFixed(2), styles: { halign: 'right', fontStyle: 'bold' } },
      { content: sumNetPayable.toFixed(2), styles: { halign: 'right', fontStyle: 'bold' } },
      { content: sumAmountPaid.toFixed(2), styles: { halign: 'right', fontStyle: 'bold' } },
      { content: '—', styles: { halign: 'center' } },
      { content: '—', styles: { halign: 'center' } },
    ]
  ];

  autoTable(doc, {
    startY: 114,
    head,
    body,
    foot,
    theme: 'grid',
    styles: {
      fontSize: 7.2,
      font: 'helvetica',
      textColor: [0, 0, 0],
      lineColor: [0, 0, 0],
      lineWidth: 0.5,
      cellPadding: 4,
      valign: 'middle',
    },
    headStyles: {
      fillColor: [255, 255, 255],
      textColor: [0, 0, 0],
      fontStyle: 'bold',
      lineColor: [0, 0, 0],
      lineWidth: 0.7,
      halign: 'center',
    },
    footStyles: {
      fillColor: [255, 255, 255],
      textColor: [0, 0, 0],
      fontStyle: 'bold',
      lineColor: [0, 0, 0],
      lineWidth: 0.7,
    },
    alternateRowStyles: {
      fillColor: [255, 255, 255],
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 26 },
      1: { halign: 'left', cellWidth: 90 },
      2: { halign: 'left', cellWidth: 65 },
      3: { halign: 'center', cellWidth: 46 },
      4: { halign: 'left', cellWidth: 60 },
      5: { halign: 'right', cellWidth: 42 },
      6: { halign: 'right', cellWidth: 54 },
      7: { halign: 'right', cellWidth: 52 },
      8: { halign: 'right', cellWidth: 42 },
      9: { halign: 'right', cellWidth: 44 },
      10: { halign: 'right', cellWidth: 44 },
      11: { halign: 'right', cellWidth: 52 },
      12: { halign: 'right', cellWidth: 48 },
      13: { halign: 'right', cellWidth: 52 },
      14: { halign: 'right', cellWidth: 52 },
      15: { halign: 'center', cellWidth: 50 },
      16: { halign: 'center', cellWidth: 70 },
    },
    margin: { left: 24, right: 24, bottom: 30 },
  });

  if (mode === 'print') {
    doc.autoPrint();
    const blobUrl = doc.output('bloburl');
    const printWindow = window.open(blobUrl, '_blank');
    if (printWindow) {
      printWindow.focus();
    }
  } else {
    const cleanYear = accountingYear.replace(/[^a-zA-Z0-9]/g, '_');
    const filename = options.filename || `Form_C_Bonus_Paid_${cleanYear}.pdf`;
    doc.save(filename);
  }
};
