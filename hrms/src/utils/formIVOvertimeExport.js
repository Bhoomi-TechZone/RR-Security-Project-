import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Statutory Overtime Register for Workers (Form IV - Rules 25(2))
 * Salary Reports Module Export Utility
 * Matches exact layout from statutory reference image:
 * FORM IV
 * [Rules 25 (2)]
 * Overtime register for workers
 */

export const downloadFormIVOvertimeExcel = (
  records = [],
  contractor = {},
  establishment = {},
  period = {},
  totals = {},
  options = {}
) => {
  const cName = contractor?.name || '—';
  const cOffice = contractor?.regdOffice || contractor?.address || '—';
  const contractorDisplay = `${cName}, RegdOffice :- ${cOffice}`;

  const estDisplay = establishment?.carriedOn || establishment?.address || establishment?.name || '—';
  const peDisplay = establishment?.principalEmployer
    ? `${establishment.principalEmployer}, ${establishment.principalEmployerAddress || ''}`
    : '—';
  const natureWork = establishment?.natureAndLocationOfWork || '—';

  const monthUpper = period?.monthNameUpper || 'OCT';
  const yearNum = period?.year || new Date().getFullYear();
  const emptyBanner = `NO OVERTIME IN THE MONTH OF ${monthUpper} ${yearNum}`;

  const aoa = [
    // Centered Title Block
    ['FORM IV'],
    ['[Rules 25 (2)]'],
    ['Overtime register for workers'],
    [''],
    // Header Block matching Image 1
    ['Name & address of Contractor_', contractorDisplay, '', '', '', '', 'Name and address of Establishment in/ under which contract is carried on _', estDisplay],
    ['', '', '', '', '', '', 'Name and address of Principle Employer_____________', peDisplay],
    ['Nature and location of work ___', natureWork],
    [''],
    // 12 Column Headers matching Image 1
    [
      'Sl. No.',
      'Name of Workman',
      "Father's/ Husband's Name",
      'Sex',
      'Designation / Nature of employment',
      'Dates on which over time worked',
      'Total overtime worked or production in case of piece rated',
      'Normal rate of wages',
      'Overtime rate of wages',
      'Date and amount of each installment re-paid',
      'Date on which overtime wages paid',
      'Remarks',
    ],
    // Numbering row
    ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
  ];

  if (!records || records.length === 0) {
    // If no overtime in this month, display the statutory banner matching Image 1
    aoa.push(['', '', '', '', emptyBanner, '', '', '', '', '', '', '']);
  } else {
    records.forEach((r, idx) => {
      aoa.push([
        r.srNo || idx + 1,
        r.nameOfWorkman || r.name || '—',
        r.fatherHusbandName || r.fatherName || '—',
        r.sex || 'Male',
        r.designation || 'Workman',
        r.datesOnWhichOvertimeWorked || '—',
        r.totalOvertimeWorked || `${r.totalOvertimeHours || 0} hrs`,
        r.normalRateOfWages || '—',
        r.overtimeRateOfWages || '—',
        r.dateAndAmountOfInstallmentRepaid || '—',
        r.dateOnWhichOvertimeWagesPaid || '—',
        r.remarks || '—',
      ]);
    });

    // Totals Row
    const totalHours = totals?.totalOvertimeHours ?? records.reduce((s, r) => s + (Number(r.totalOvertimeHours) || 0), 0);
    const totalEarnings = totals?.totalOvertimeEarnings ?? records.reduce((s, r) => s + (Number(r.overtimeEarnings) || 0), 0);

    aoa.push([
      '',
      'Total:',
      '',
      '',
      '',
      '',
      `${totalHours} hrs`,
      '',
      `₹${totalEarnings.toLocaleString('en-IN')}`,
      '',
      '',
      '',
    ]);
  }

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(aoa);

  // Column widths
  ws['!cols'] = [
    { wch: 8 },  // Sl No
    { wch: 22 }, // Name of Workman
    { wch: 22 }, // Father's Name
    { wch: 10 }, // Sex
    { wch: 22 }, // Designation
    { wch: 18 }, // Dates worked
    { wch: 20 }, // Total OT worked
    { wch: 22 }, // Normal rate
    { wch: 18 }, // Overtime rate
    { wch: 20 }, // Installment repaid
    { wch: 18 }, // Date paid
    { wch: 16 }, // Remarks
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Form IV - Overtime Register');

  const fileName = `Overtime_Register_Form_IV_${period?.month || yearNum}.${options.format === 'csv' ? 'csv' : 'xlsx'}`;

  if (options.format === 'csv') {
    XLSX.writeFile(wb, fileName, { bookType: 'csv' });
  } else {
    XLSX.writeFile(wb, fileName);
  }
};

export const downloadFormIVOvertimeCsv = (
  records = [],
  contractor = {},
  establishment = {},
  period = {},
  totals = {},
  options = {}
) => {
  return downloadFormIVOvertimeExcel(records, contractor, establishment, period, totals, {
    ...options,
    format: 'csv',
  });
};

export const downloadFormIVOvertimePdf = (
  records = [],
  contractor = {},
  establishment = {},
  period = {},
  totals = {},
  options = {}
) => {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const cName = contractor?.name || '—';
  const cOffice = contractor?.regdOffice || contractor?.address || '—';
  const estDisplay = establishment?.carriedOn || establishment?.address || establishment?.name || '—';
  const peDisplay = establishment?.principalEmployer
    ? `${establishment.principalEmployer}, ${establishment.principalEmployerAddress || ''}`
    : '—';
  const natureWork = establishment?.natureAndLocationOfWork || '—';

  const monthUpper = period?.monthNameUpper || 'OCT';
  const yearNum = period?.year || new Date().getFullYear();
  const emptyBanner = `NO OVERTIME IN THE MONTH OF ${monthUpper} ${yearNum}`;

  const marginX = 10;
  let currentY = 12;
  const pageWidth = doc.internal.pageSize.getWidth();

  // Top Title Block (Image 1 Centered)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('FORM IV', pageWidth / 2, currentY, { align: 'center' });
  currentY += 4.5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('[Rules 25 (2)]', pageWidth / 2, currentY, { align: 'center' });
  currentY += 4.5;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.text('Overtime register for workers', pageWidth / 2, currentY, { align: 'center' });
  currentY += 7;

  // Header Details (2-column matching Image 1)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('Name & address of Contractor_', marginX, currentY);
  doc.setFont('helvetica', 'normal');
  doc.text(cName, marginX + 44, currentY);

  doc.setFont('helvetica', 'bold');
  doc.text('Name and address of Establishment in/ under which', pageWidth / 2 + 5, currentY);
  currentY += 3.5;

  doc.setFont('helvetica', 'bold');
  doc.text('RegdOffice :- ', marginX, currentY);
  doc.setFont('helvetica', 'normal');
  doc.text(cOffice, marginX + 20, currentY);

  doc.setFont('helvetica', 'bold');
  doc.text('contract is carried on _ ', pageWidth / 2 + 5, currentY);
  doc.setFont('helvetica', 'normal');
  doc.text(estDisplay, pageWidth / 2 + 40, currentY);
  currentY += 4;

  doc.setFont('helvetica', 'bold');
  doc.text('Nature and location of work ___', marginX, currentY);
  doc.setFont('helvetica', 'normal');
  doc.text(`${natureWork}___`, marginX + 44, currentY);

  doc.setFont('helvetica', 'bold');
  doc.text('Name and address of Principle Employer_____________', pageWidth / 2 + 5, currentY);
  currentY += 3.5;
  doc.setFont('helvetica', 'normal');
  doc.text(peDisplay, pageWidth / 2 + 5, currentY);
  currentY += 6;

  // 12 Column Table Headers
  const headRows = [
    [
      { content: 'Sl. No.', styles: { halign: 'center' } },
      { content: 'Name of\nWorkman', styles: { halign: 'center' } },
      { content: "Father's/\nHusband's\nName", styles: { halign: 'center' } },
      { content: 'Sex', styles: { halign: 'center' } },
      { content: 'Designation /\nNature of\nemployment', styles: { halign: 'center' } },
      { content: 'Dates on\nwhich\nover time\nworked', styles: { halign: 'center' } },
      { content: 'Total\novertime\nworked or\nproduction\nin case of\npiece rated', styles: { halign: 'center' } },
      { content: 'Normal\nrate of\nwages', styles: { halign: 'center' } },
      { content: 'Overtime\nrate of\nwages', styles: { halign: 'center' } },
      { content: 'Date and\namount\nof each\ninstallment\nre-paid', styles: { halign: 'center' } },
      { content: 'Date on\nwhich\novertime\nwages\npaid', styles: { halign: 'center' } },
      { content: 'Remarks', styles: { halign: 'center' } },
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

  const bodyRows = [];

  if (!records || records.length === 0) {
    // Blank rows with center banner exactly like Image 1
    for (let i = 0; i < 3; i++) {
      bodyRows.push(new Array(12).fill({ content: '', styles: { minCellHeight: 6 } }));
    }
    bodyRows.push([
      {
        content: emptyBanner,
        colSpan: 12,
        styles: { halign: 'center', fontStyle: 'bold', fontSize: 11, minCellHeight: 9, textColor: [30, 30, 30] },
      },
    ]);
    for (let i = 0; i < 4; i++) {
      bodyRows.push(new Array(12).fill({ content: '', styles: { minCellHeight: 6 } }));
    }
  } else {
    records.forEach((r, idx) => {
      bodyRows.push([
        { content: String(r.srNo || idx + 1), styles: { halign: 'center' } },
        { content: r.nameOfWorkman || r.name || '—', styles: { halign: 'left' } },
        { content: r.fatherHusbandName || r.fatherName || '—', styles: { halign: 'left' } },
        { content: r.sex || 'Male', styles: { halign: 'center' } },
        { content: r.designation || 'Workman', styles: { halign: 'left' } },
        { content: r.datesOnWhichOvertimeWorked || '—', styles: { halign: 'center' } },
        { content: r.totalOvertimeWorked || `${r.totalOvertimeHours || 0} hrs`, styles: { halign: 'center', fontStyle: 'bold' } },
        { content: r.normalRateOfWages || '—', styles: { halign: 'center' } },
        { content: r.overtimeRateOfWages || '—', styles: { halign: 'center', fontStyle: 'bold' } },
        { content: r.dateAndAmountOfInstallmentRepaid || '—', styles: { halign: 'center' } },
        { content: r.dateOnWhichOvertimeWagesPaid || '—', styles: { halign: 'center' } },
        { content: r.remarks || '—', styles: { halign: 'left' } },
      ]);
    });
  }

  autoTable(doc, {
    startY: currentY,
    margin: { left: marginX, right: marginX, bottom: 12 },
    theme: 'grid',
    head: headRows,
    body: bodyRows,
    headStyles: {
      fillColor: [255, 255, 255],
      textColor: [20, 20, 20],
      fontStyle: 'normal',
      lineColor: [40, 40, 40],
      lineWidth: 0.3,
      fontSize: 7.5,
      cellPadding: 1.5,
    },
    bodyStyles: {
      textColor: [20, 20, 20],
      lineColor: [60, 60, 60],
      lineWidth: 0.25,
      fontSize: 7.5,
      cellPadding: 2,
    },
    columnStyles: {
      0: { cellWidth: 12 }, // Sl No
      1: { cellWidth: 26 }, // Name
      2: { cellWidth: 24 }, // Father Name
      3: { cellWidth: 12 }, // Sex
      4: { cellWidth: 24 }, // Designation
      5: { cellWidth: 22 }, // Dates worked
      6: { cellWidth: 24 }, // Total overtime worked
      7: { cellWidth: 24 }, // Normal rate
      8: { cellWidth: 22 }, // Overtime rate
      9: { cellWidth: 26 }, // Installment repaid
      10: { cellWidth: 22 }, // Date paid
      11: { cellWidth: 'auto' }, // Remarks
    },
  });

  if (options.mode === 'print') {
    doc.autoPrint();
    const pdfBlob = doc.output('blob');
    const pdfUrl = URL.createObjectURL(pdfBlob);
    window.open(pdfUrl, '_blank');
  } else {
    doc.save(`Overtime_Register_Form_IV_${period?.month || yearNum}.pdf`);
  }
};
