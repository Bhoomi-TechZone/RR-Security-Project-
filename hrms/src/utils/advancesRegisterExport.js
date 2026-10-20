import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Download Statutory Register of Advances (Form XXII) as Excel (.xlsx) / CSV
 * [See Rule 78(1)(a)(ii) of Contract Labour (Regulation & Abolition) Central Rules, 1971]
 * Matches exact structure shown in statutory Form XXII.
 */
export const downloadAdvancesRegisterExcel = (
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
    ['REGISTER OF ADVANCES'],
    // Row 2: Subtitle rule
    ['FORM XXII. See Rule-78 (1) (a) (ii)'],
    // Row 3: Blank
    [''],
    // Rows 4-7: Establishment Information (Matching Image 1)
    ['Name and Address of Contractor :', contractorFull],
    ['Nature and Location of Work :', workLocation],
    ['Name and Address of Establishment in/ under which Contract is Carried on :', establishmentFull],
    ['Name and Address of Principal Employer :', principalEmployer],
    // Row 8: Blank
    [''],
    // Row 9: Table Header Level 1
    [
      'Sl.No',
      'Name Of the Employee',
      "Father's/ Husband's Name",
      'Designation/Nature of Employment',
      'Wage Period and Wages Payable',
      'Date and Amount of Advance Given',
      'Purpose(s) for Which Advance made',
      'No of Instalments by which Advance to be Repaid',
      'Date and Amount of Each Instalment was Paid',
      'Date on which Last Instalment Was Repaid',
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
      r.wagePeriodAndWages || 'Monthly',
      r.dateAndAmountOfAdvance || '—',
      r.purpose || '—',
      r.noOfInstallments || '—',
      r.dateAndAmountOfEachInstallment || '—',
      r.dateOnWhichLastInstallmentRepaid || '—',
      r.remarks || '—',
    ]);
  });

  // Summary Row
  const totalAdv = totals?.totalAdvanceDisbursed ?? records.reduce((sum, r) => sum + (Number(r.advanceAmount) || 0), 0);
  const totalRec = totals?.totalRecovered ?? records.reduce((sum, r) => sum + (Number(r.recoveredAmount) || 0), 0);
  const totalBal = totals?.totalPending ?? records.reduce((sum, r) => sum + (Number(r.remainingAmount) || 0), 0);

  aoa.push([
    '',
    `Total Workforce: ${records.length}`,
    '',
    '',
    'Totals:',
    `₹${totalAdv.toLocaleString('en-IN')}`,
    '',
    '',
    `Recovered: ₹${totalRec.toLocaleString('en-IN')}`,
    `Balance: ₹${totalBal.toLocaleString('en-IN')}`,
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
    { wch: 8 },  // Sl.No
    { wch: 26 }, // Name
    { wch: 24 }, // Father's Name
    { wch: 22 }, // Designation
    { wch: 22 }, // Wage Period and Wages
    { wch: 24 }, // Date and Amount Given
    { wch: 30 }, // Purpose
    { wch: 22 }, // No of Instalments
    { wch: 32 }, // Date & Amount Each Instalment
    { wch: 24 }, // Date Last Instalment Repaid
    { wch: 26 }, // Remarks
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Register of Advances Form XXII');

  const format = options.format === 'csv' ? 'csv' : 'xlsx';
  const cleanMonth = targetMonth.replace(/[^a-zA-Z0-9]/g, '_');
  const filename = options.filename || `Register_of_Advances_Form_XXII_${cleanMonth}.${format}`;

  XLSX.writeFile(wb, filename);
};

/**
 * Download Statutory Register of Advances (Form XXII) as PDF
 * [See Rule 78(1)(a)(ii) of Contract Labour (Regulation & Abolition) Central Rules, 1971]
 */
export const downloadAdvancesRegisterPdf = (
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

  // Landscape A4 / A3 for wide statutory registers
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
  doc.setFontSize(16);
  doc.setTextColor(0, 0, 0);
  doc.text('REGISTER OF ADVANCES', pageWidth / 2, 45, { align: 'center' });

  doc.setFontSize(11);
  doc.text('FORM XXII. See Rule-78 (1) (a) (ii)', pageWidth / 2, 60, { align: 'center' });

  // 2. Establishment Info Box (Matching Image 1)
  doc.setLineWidth(1);
  doc.rect(24, 78, pageWidth - 48, 72);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
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

  // 3. Table Rows
  const head = [
    [
      'Sl.No',
      'Name Of the Employee',
      "Father's/ Husband's Name",
      'Designation/Nature of Employment',
      'Wage Period and Wages Payable',
      'Date and Amount of Advance Given',
      'Purpose(s) for Which Advance made',
      'No of Instalments by which Advance to be Repaid',
      'Date and Amount of Each Instalment was Paid',
      'Date on which Last Instalment Was Repaid',
      'Remarks',
    ],
    ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11'],
  ];

  const body = records.map((r, idx) => [
    r.srNo || idx + 1,
    `${r.name || '—'}${r.employeeCode ? `\n(${r.employeeCode})` : ''}`,
    r.fatherName || '—',
    r.designation || 'Staff',
    r.wagePeriodAndWages || 'Monthly',
    r.dateAndAmountOfAdvance || '—',
    r.purpose || '—',
    r.noOfInstallments || '—',
    r.dateAndAmountOfEachInstallment || '—',
    r.dateOnWhichLastInstallmentRepaid || '—',
    r.remarks || '—',
  ]);

  const totalAdv = totals?.totalAdvanceDisbursed ?? records.reduce((sum, r) => sum + (Number(r.advanceAmount) || 0), 0);
  const totalRec = totals?.totalRecovered ?? records.reduce((sum, r) => sum + (Number(r.recoveredAmount) || 0), 0);
  const totalBal = totals?.totalPending ?? records.reduce((sum, r) => sum + (Number(r.remainingAmount) || 0), 0);

  const foot = [
    [
      '',
      `Workforce: ${records.length}`,
      '',
      '',
      'Total Disbursed:',
      `₹${totalAdv.toLocaleString('en-IN')}`,
      '',
      '',
      `Recovered: ₹${totalRec.toLocaleString('en-IN')}`,
      `Bal: ₹${totalBal.toLocaleString('en-IN')}`,
      'Verified & Compliant',
    ],
  ];

  autoTable(doc, {
    startY: 156,
    margin: { left: 24, right: 24 },
    head,
    body,
    foot,
    theme: 'plain',
    styles: {
      lineColor: [0, 0, 0],
      lineWidth: 0.6,
      textColor: [0, 0, 0],
      font: 'helvetica',
      fontSize: 8.5,
      cellPadding: 4,
      valign: 'middle',
    },
    headStyles: {
      fillColor: [248, 250, 252],
      textColor: [0, 0, 0],
      fontStyle: 'bold',
      halign: 'center',
    },
    footStyles: {
      fillColor: [248, 250, 252],
      textColor: [0, 0, 0],
      fontStyle: 'bold',
      halign: 'center',
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 38 },
      1: { halign: 'left', cellWidth: 110, fontStyle: 'bold' },
      2: { halign: 'left', cellWidth: 100 },
      3: { halign: 'left', cellWidth: 90 },
      4: { halign: 'left', cellWidth: 90 },
      5: { halign: 'center', cellWidth: 95 },
      6: { halign: 'left', cellWidth: 110 },
      7: { halign: 'center', cellWidth: 80 },
      8: { halign: 'left', cellWidth: 130 },
      9: { halign: 'center', cellWidth: 85 },
      10: { halign: 'left' },
    },
    didDrawPage: (data) => {
      // Footer page numbering
      const str = `Page ${doc.internal.getNumberOfPages()} | Form XXII Register of Advances - RR SECURITY & FACILITIES`;
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100);
      doc.text(str, pageWidth / 2, doc.internal.pageSize.getHeight() - 14, { align: 'center' });
    },
  });

  if (mode === 'print') {
    doc.autoPrint();
    const pdfBlobUrl = doc.output('bloburl');
    window.open(pdfBlobUrl, '_blank');
  } else {
    const cleanMonth = targetMonth.replace(/[^a-zA-Z0-9]/g, '_');
    doc.save(`Register_of_Advances_Form_XXII_${cleanMonth}.pdf`);
  }
};
