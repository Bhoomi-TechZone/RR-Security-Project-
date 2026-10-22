import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { numberToIndianWords } from './payrollUtils';

/**
 * Official Employee Payslip PDF Exporter
 * Matches exact statutory payslip document layout from reference image:
 * - Outer border
 * - Circular logo on the left, centered P A Y S L I P header with company branding
 * - Two-column metadata block (Employee profile & statutory/bank accounts)
 * - 5-column Earnings & Deductions table (ALLOWANCE | RATE | PAYABLE | DEDUCTIONS | AMOUNT)
 * - Net salary in Indian words + NET SALARY box
 * - Attendance summary strip (Month Days, Present, W.Off, LWP, Payable, Holiday, CL, SL, EL)
 * - Authorised Signatory block
 */
export function downloadEmployeePayslipPdf(slip, companyInfo = {}, period = {}, options = {}) {
  const { mode = 'download' } = options;
  if (!slip) return;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginX = 28;
  const marginY = 28;
  const contentWidth = pageWidth - marginX * 2;

  // 1. Outer Box Border (Exact match to reference)
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(1.2);
  const boxHeight = pageHeight - marginY * 2;
  doc.rect(marginX, marginY, contentWidth, boxHeight);

  // 2. Resolve Company Details
  const comp = slip.companyInfo || companyInfo || {};
  const compName = (comp.name || 'RR SECURITY & FACILITIES').toUpperCase();
  const compAddr = (comp.address || 'G-75/A, BLOCK-G M.B.EXTN., BADARPUR NEW DELHI-110044').toUpperCase();
  const compPhone = comp.phone ? `TEL NO. ${comp.phone}` : 'TEL NO. 9891325151';
  const compPan = comp.pan || 'DSNHP3718318000';
  const compEsic = comp.esic || comp.registrationNo || '20001853160000999';

  // Left Circular Logo (matching reference circle)
  const logoCircleX = marginX + 44;
  const logoCircleY = marginY + 44;
  const logoRadius = 28;
  doc.setDrawColor(37, 99, 235); // Blue ring
  doc.setLineWidth(1.5);
  doc.circle(logoCircleX, logoCircleY, logoRadius);

  // Inner logo text
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(37, 99, 235);
  doc.text('RR SECURITY', logoCircleX, logoCircleY - 2, { align: 'center' });
  doc.setFontSize(6);
  doc.text('& FACILITIES', logoCircleX, logoCircleY + 7, { align: 'center' });

  // Center Header Texts
  const headerCenterX = marginX + contentWidth / 2 + 18;
  let curY = marginY + 18;

  // Underlined P A Y S L I P
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  doc.text('P A Y S L I P', headerCenterX, curY, { align: 'center' });
  doc.setLineWidth(0.8);
  doc.line(headerCenterX - 55, curY + 2, headerCenterX + 55, curY + 2);

  curY += 14;
  doc.setFontSize(11);
  doc.text(compName, headerCenterX, curY, { align: 'center' });

  curY += 11;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text(compAddr, headerCenterX, curY, { align: 'center' });

  curY += 10;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(compPhone, headerCenterX, curY, { align: 'center' });

  curY += 10;
  doc.text(compPan, headerCenterX, curY, { align: 'center' });

  curY += 10;
  doc.text(compEsic, headerCenterX, curY, { align: 'center' });

  // Divider line below header
  const headerBottomY = marginY + 84;
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.8);
  doc.line(marginX, headerBottomY, marginX + contentWidth, headerBottomY);

  // Payslip for the Month row
  const monthRowY = headerBottomY + 13;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('Payslip for the Month', marginX + 8, monthRowY);
  doc.text(':', marginX + 115, monthRowY);
  doc.setFont('helvetica', 'bold');
  const monthTitle = slip.salaryMonth || period?.monthLabel || 'Current Month';
  doc.text(monthTitle, marginX + 125, monthRowY);

  // Divider line below Month row
  const monthDividerY = headerBottomY + 18;
  doc.line(marginX, monthDividerY, marginX + contentWidth, monthDividerY);

  // 3. Two-Column Metadata Box
  const metaBoxY = monthDividerY;
  const metaHeight = 105;
  const colDividerX = marginX + contentWidth * 0.52;

  // Center vertical divider
  doc.line(colDividerX, metaBoxY, colDividerX, metaBoxY + metaHeight);

  // Divider line below meta box
  const metaBottomY = metaBoxY + metaHeight;
  doc.line(marginX, metaBottomY, marginX + contentWidth, metaBottomY);

  // Left column fields
  const leftColX = marginX + 8;
  const leftColonX = marginX + 96;
  const leftValX = marginX + 104;
  let metaY = metaBoxY + 12;
  const metaGap = 12.5;

  const leftFields = [
    { label: 'Employee Code', colon: ':', val: slip.employeeCode || '—' },
    { label: 'Emp. Card No.', colon: ':', val: slip.empCardNo || '—' },
    { label: 'Employee Name', colon: ':', val: slip.employeeName || '—', bold: true },
    { label: 'Father/Husb. Name', colon: ':', val: slip.fatherHusbandName || '—' },
    { label: 'Designation', colon: ':', val: slip.designation || '—' },
    { label: 'Department', colon: ':', val: slip.department || '—' },
    { label: 'Location', colon: ':', val: slip.location || '—' },
    { label: 'Date of Joining', colon: ':', val: slip.dateOfJoining || '—' },
  ];

  leftFields.forEach((f) => {
    doc.setFont('helvetica', f.bold ? 'bold' : 'normal');
    doc.setFontSize(8.5);
    doc.text(f.label, leftColX, metaY);
    doc.text(f.colon, leftColonX, metaY);
    doc.text(String(f.val), leftValX, metaY, { maxWidth: colDividerX - leftValX - 6 });
    metaY += metaGap;
  });

  // Right column fields
  const rightColX = colDividerX + 8;
  const rightColonX = colDividerX + 78;
  const rightValX = colDividerX + 86;
  metaY = metaBoxY + 12;

  const rightFields = [
    { label: 'Payment Mode', colon: ':', val: slip.paymentMode || 'Bank' },
    { label: 'A/C No.', colon: ':', val: slip.accountNo || '—', bold: true },
    { label: 'Bank Name', colon: ':', val: slip.bankName || '—' },
    { label: 'IFSC Code', colon: ':', val: slip.ifscCode || '—' },
    { label: 'ESI No.', colon: ':', val: slip.esiNo || '—' },
    { label: 'UAN', colon: ':', val: slip.uan || '—', bold: true },
    { label: 'PAN No.', colon: ':', val: slip.pan || '—' },
    { label: 'LWF No.', colon: ':', val: slip.lwfNo || '—' },
    { label: 'Days Paid', colon: ':', val: String(slip.daysPaid ?? '30'), bold: true },
  ];

  rightFields.forEach((f) => {
    doc.setFont('helvetica', f.bold ? 'bold' : 'normal');
    doc.setFontSize(8.5);
    doc.text(f.label, rightColX, metaY);
    doc.text(f.colon, rightColonX, metaY);
    doc.text(String(f.val), rightValX, metaY, { maxWidth: marginX + contentWidth - rightValX - 6 });
    metaY += metaGap;
  });

  // 4. 5-Column Earnings & Deductions Table
  // ALLOWANCE (40%) | RATE (12%) | PAYABLE (12%) | DEDUCTIONS (24%) | AMOUNT (12%)
  const allowances = slip.allowances || [];
  const deductions = slip.deductions || [];
  const maxRows = Math.max(allowances.length, deductions.length, 5);

  const tableBody = [];
  for (let i = 0; i < maxRows; i++) {
    const a = allowances[i];
    const d = deductions[i];
    tableBody.push([
      a ? a.name : '',
      a && a.rate !== undefined ? Number(a.rate).toLocaleString('en-IN') : '',
      a && a.payable !== undefined ? Number(a.payable).toLocaleString('en-IN') : '',
      d ? d.name : '',
      d && d.amount !== undefined ? Number(d.amount).toLocaleString('en-IN') : '',
    ]);
  }

  // Total Row
  tableBody.push([
    'Total :',
    Number(slip.totalRate || 0).toLocaleString('en-IN'),
    Number(slip.totalPayable || 0).toLocaleString('en-IN'),
    '',
    Number(slip.totalDeductions || 0).toLocaleString('en-IN'),
  ]);

  autoTable(doc, {
    startY: metaBottomY,
    margin: { left: marginX, right: marginX },
    tableWidth: contentWidth,
    head: [['ALLOWANCE', 'RATE', 'PAYABLE', 'DEDUCTIONS', 'AMOUNT']],
    body: tableBody,
    theme: 'plain',
    styles: {
      font: 'helvetica',
      fontSize: 8,
      cellPadding: 4,
      textColor: [0, 0, 0],
      lineColor: [0, 0, 0],
      lineWidth: 0.6,
    },
    headStyles: {
      font: 'helvetica',
      fontStyle: 'bold',
      fontSize: 8.5,
      halign: 'center',
      fillColor: false,
      textColor: [0, 0, 0],
      lineWidth: 0.8,
    },
    columnStyles: {
      0: { halign: 'left', cellWidth: contentWidth * 0.40, fontStyle: 'bold' },
      1: { halign: 'right', cellWidth: contentWidth * 0.12 },
      2: { halign: 'right', cellWidth: contentWidth * 0.12, fontStyle: 'bold' },
      3: { halign: 'left', cellWidth: contentWidth * 0.24, fontStyle: 'bold' },
      4: { halign: 'right', cellWidth: contentWidth * 0.12 },
    },
    didParseCell: (data) => {
      // Style total row
      if (data.row.index === tableBody.length - 1) {
        data.cell.styles.fontStyle = 'bold';
        if (data.column.index === 0) data.cell.styles.halign = 'right';
      }
    },
  });

  const tableBottomY = doc.lastAutoTable.finalY;

  // 5. Net Salary & In-Words Strip
  const netBoxY = tableBottomY;
  const netBoxHeight = 22;
  doc.rect(marginX, netBoxY, contentWidth, netBoxHeight);

  // Left: Words
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  const wordsText = slip.netSalaryWords || numberToIndianWords(slip.netSalary || 0);
  doc.text(wordsText, marginX + 8, netBoxY + 14, { maxWidth: contentWidth * 0.65 });

  // Right: NET SALARY : <val>
  const netRightX = marginX + contentWidth - 8;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  const netFormatted = Number(slip.netSalary || 0).toLocaleString('en-IN');
  doc.text(`NET SALARY :   ${netFormatted}`, netRightX, netBoxY + 14, { align: 'right' });

  // 6. Attendance Details Row
  const attY = netBoxY + netBoxHeight;
  const attHeight = 30;
  doc.rect(marginX, attY, contentWidth, attHeight);

  const att = slip.attendanceDetails || {};
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('Att. Details :', marginX + 8, attY + 12);

  doc.setFont('helvetica', 'normal');
  const attLine1 = [
    `Month Days : ${att.monthDays || 30}`,
    `Present : ${att.present || 30}`,
    `W.Off : ${att.wOff !== undefined ? att.wOff : ''}`,
    `LWP : ${att.lwp !== undefined ? att.lwp : ''}`,
    `Payable : ${att.payable || 30}`,
  ].join('    ');
  doc.text(attLine1, marginX + 70, attY + 12);

  const attLine2 = [
    `Holiday : ${att.holiday || ''}`,
    `CL : ${att.cl || ''}`,
    `SL : ${att.sl || ''}`,
    `EL : ${att.el || ''}`,
  ].join('    ');
  doc.text(attLine2, marginX + 70, attY + 23);

  // 7. Authorised Signatory block
  const signatoryY = marginY + boxHeight - 20;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('Authorised Signatory', marginX + contentWidth - 14, signatoryY, { align: 'right' });

  // Mode output
  const fileName = `Payslip_${slip.employeeCode || slip.employeeId || 'Staff'}_${slip.salaryMonth?.replace(/\s+|\//g, '_') || 'Official'}.pdf`;
  if (mode === 'print') {
    doc.autoPrint();
    const blobUrl = doc.output('bloburl');
    window.open(blobUrl, '_blank');
  } else {
    doc.save(fileName);
  }
}
