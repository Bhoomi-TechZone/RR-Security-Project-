import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Statutory Form-II [Rules 21 (4)]
 * REGISTER OF DEDUCTIONS FOR DAMAGE OR LOSS CAUSED TO THE EMPLOYER
 * BY THE NEGLECT OR DEFAULT OF THE EMPLOYED PERSONS
 * Salary Reports Module
 */

export const downloadFormIIDeductionsDamageExcel = (
  records = [],
  employer = '',
  period = {},
  totals = {},
  options = {}
) => {
  const employerName = typeof employer === 'object' ? employer.name : (employer || 'RR SECURITY & FACILITIES');
  const targetPeriod = period.monthLabel || period.month || 'Current Period';

  const aoa = [
    ['FORM-II'],
    ['[Rules 21 (4)]'],
    ['REGISTER OF DEDUCTIONS FOR DAMAGE OR LOSS CAUSED TO THE EMPLOYER BY THE NEGLECT OR DEFAULT OF THE EMPLOYED PERSONS'],
    [''],
    [`Employer : ${employerName}`, '', '', '', '', '', '', '', '', '', `Period: ${targetPeriod}`],
    [''],
    [
      'S. No.',
      'Name',
      "Father's/ Husband's Name",
      'Sex',
      'Department',
      'Damage or loss caused with date',
      'Whether worker showed cause against deductions, if so, enter date',
      'Date and amount of deductions imposed',
      'Date and amount of fine imposed',
      'Date on which fine realised',
      'Remarks',
    ],
    ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11'],
  ];

  const minRows = Math.max(records.length, 5);
  for (let i = 0; i < minRows; i++) {
    const r = records[i];
    if (r) {
      aoa.push([
        r.srNo || i + 1,
        r.name || '',
        r.fatherHusbandName || '',
        r.sex || '',
        r.department || '',
        r.damageLossWithDate || '',
        r.showedCauseWithDate || '',
        r.dateAndAmountDeduction || '',
        r.dateAndAmountFine || '',
        r.dateFineRealised || '',
        r.remarks || '',
      ]);
    } else {
      aoa.push([
        i < 5 ? String(i + 1) : '*',
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
      ]);
    }
  }

  // Totals Row if records exist
  if (records.length > 0) {
    const totalDeductions = totals.totalDeductionsImposed || records.reduce((s, r) => s + (Number(r.deductionAmount) || 0), 0);
    const totalFines = totals.totalFinesImposed || records.reduce((s, r) => s + (Number(r.fineAmount) || 0), 0);
    const totalRealised = totals.totalRealised || records.reduce((s, r) => s + (Number(r.recoveredAmount) || 0), 0);

    aoa.push([
      'Total',
      `${records.length} Employees`,
      '',
      '',
      '',
      '',
      '',
      `₹${totalDeductions.toLocaleString('en-IN')}`,
      `₹${totalFines.toLocaleString('en-IN')}`,
      `₹${totalRealised.toLocaleString('en-IN')}`,
      '',
    ]);
  }

  const ws = XLSX.utils.aoa_to_sheet(aoa);

  // Column widths
  ws['!cols'] = [
    { wch: 8 },  // S. No.
    { wch: 22 }, // Name
    { wch: 22 }, // Father's Name
    { wch: 10 }, // Sex
    { wch: 16 }, // Department
    { wch: 32 }, // Damage or loss
    { wch: 32 }, // Showed cause
    { wch: 24 }, // Deductions imposed
    { wch: 22 }, // Fine imposed
    { wch: 18 }, // Fine realised
    { wch: 20 }, // Remarks
  ];

  const wb = XLSX.utils.book_new();
  const sheetName = 'Form II - Damage Register';
  XLSX.utils.book_append_sheet(wb, ws, sheetName);

  const fileFormat = (options.format || 'xlsx').toLowerCase();
  const fileName = `Register_of_Deductions_Form_II_${targetPeriod.replace(/[^a-zA-Z0-9]/g, '_')}.${fileFormat}`;

  if (fileFormat === 'csv') {
    XLSX.writeFile(wb, fileName, { bookType: 'csv' });
  } else {
    XLSX.writeFile(wb, fileName);
  }
};

export const downloadFormIIDeductionsDamageCsv = (
  records = [],
  employer = '',
  period = {},
  totals = {},
  options = {}
) => {
  return downloadFormIIDeductionsDamageExcel(records, employer, period, totals, { ...options, format: 'csv' });
};

export const downloadFormIIDeductionsDamagePdf = (
  records = [],
  employer = '',
  period = {},
  totals = {},
  options = {}
) => {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'pt',
    format: 'a4',
  });

  const employerName = typeof employer === 'object' ? employer.name : (employer || 'RR SECURITY & FACILITIES');
  const targetPeriod = period.monthLabel || period.month || 'Current Period';

  // Title Block matching Image 2
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('FORM-II', doc.internal.pageSize.getWidth() / 2, 35, { align: 'center' });

  doc.setFontSize(10.5);
  doc.setFont('helvetica', 'bold');
  doc.text('[Rules 21 (4)]', doc.internal.pageSize.getWidth() / 2, 50, { align: 'center' });

  doc.setFontSize(9.5);
  doc.text(
    'REGISTER OF DEDUCTIONS FOR DAMAGE OR LOSS CAUSED TO THE EMPLOYER',
    doc.internal.pageSize.getWidth() / 2,
    64,
    { align: 'center' }
  );
  doc.text(
    'BY THE NEGLECT OR DEFAULT OF THE EMPLOYED PERSONS',
    doc.internal.pageSize.getWidth() / 2,
    77,
    { align: 'center' }
  );

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(`Employer : ${employerName}`, doc.internal.pageSize.getWidth() / 2, 96, { align: 'center' });

  const tableData = [];
  const minRows = Math.max(records.length, 5);

  for (let i = 0; i < minRows; i++) {
    const r = records[i];
    if (r) {
      tableData.push([
        String(r.srNo || i + 1),
        r.name || '',
        r.fatherHusbandName || '',
        r.sex || '',
        r.department || '',
        r.damageLossWithDate || '',
        r.showedCauseWithDate || '',
        r.dateAndAmountDeduction || '',
        r.dateAndAmountFine || '',
        r.dateFineRealised || '',
        r.remarks || '',
      ]);
    } else {
      tableData.push([
        i < 5 ? String(i + 1) : '*',
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
      ]);
    }
  }

  // Totals row if records present
  if (records.length > 0) {
    const totalDeductions = totals.totalDeductionsImposed || records.reduce((s, r) => s + (Number(r.deductionAmount) || 0), 0);
    const totalFines = totals.totalFinesImposed || records.reduce((s, r) => s + (Number(r.fineAmount) || 0), 0);
    const totalRealised = totals.totalRealised || records.reduce((s, r) => s + (Number(r.recoveredAmount) || 0), 0);

    tableData.push([
      'Total',
      `${records.length} Employees`,
      '',
      '',
      '',
      '',
      '',
      `₹${totalDeductions.toLocaleString('en-IN')}`,
      `₹${totalFines.toLocaleString('en-IN')}`,
      `₹${totalRealised.toLocaleString('en-IN')}`,
      '',
    ]);
  }

  autoTable(doc, {
    startY: 108,
    head: [
      [
        'S.\nNo.',
        'Name',
        "Father's/\nHusband's\nName",
        'Sex',
        'Department',
        'Damage or\nloss caused\nwith date',
        'Whether worker\nshowed cause\nagainst deductions,\nif so, enter date',
        'Date and\namount of\ndeductions\nimposed',
        'Date and\namount\nof fine\nimposed',
        'Date on\nwhich\nfine\nrealised',
        'Remarks',
      ],
      ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11'],
    ],
    body: tableData,
    theme: 'grid',
    styles: {
      fontSize: 8,
      cellPadding: 4,
      textColor: [0, 0, 0],
      lineColor: [0, 0, 0],
      lineWidth: 0.5,
      halign: 'left',
      valign: 'middle',
    },
    headStyles: {
      fillColor: [255, 255, 255],
      textColor: [0, 0, 0],
      fontStyle: 'bold',
      halign: 'center',
      valign: 'middle',
      lineWidth: 0.5,
      lineColor: [0, 0, 0],
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 32 },  // S. No.
      1: { cellWidth: 85 },                   // Name
      2: { cellWidth: 80 },                   // Father's Name
      3: { halign: 'center', cellWidth: 38 },  // Sex
      4: { cellWidth: 65 },                   // Department
      5: { cellWidth: 100 },                  // Damage/loss with date
      6: { cellWidth: 95 },                   // Showed cause
      7: { cellWidth: 80 },                   // Deductions imposed
      8: { cellWidth: 70 },                   // Fine imposed
      9: { cellWidth: 65 },                   // Fine realised
      10: { cellWidth: 70 },                  // Remarks
    },
    didDrawPage: (data) => {
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(
        `Generated: ${new Date().toLocaleDateString('en-IN')} | Period: ${targetPeriod} | Form II [Rules 21(4)]`,
        40,
        doc.internal.pageSize.getHeight() - 20
      );
      doc.text(
        `Page ${data.pageNumber} of ${doc.internal.getNumberOfPages()}`,
        doc.internal.pageSize.getWidth() - 80,
        doc.internal.pageSize.getHeight() - 20
      );
    },
  });

  if (options.mode === 'print') {
    doc.autoPrint();
    const blobUrl = doc.output('bloburl');
    window.open(blobUrl, '_blank');
  } else {
    doc.save(`Register_of_Deductions_Form_II_${targetPeriod.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);
  }
};
