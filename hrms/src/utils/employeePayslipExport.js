import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { numberToIndianWords } from './payrollUtils';

/**
 * Official Employee Payslip PDF Exporter
 * Fully dynamic and strictly respects all selected options (Header, Profile, Statutory, Bank, Columns, Net Payout, Attendance Strip, Signatory)
 */
export function downloadEmployeePayslipPdf(slip, companyInfo = {}, period = {}, options = {}) {
  const mode = options.mode || 'download';
  const opt = options.options && typeof options.options === 'object'
    ? { ...options.options }
    : { ...options };
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

  // 1. Outer Box Border
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(1.2);
  const boxHeight = pageHeight - marginY * 2;
  doc.rect(marginX, marginY, contentWidth, boxHeight);

  // 2. Resolve Company Details
  const comp = slip.companyInfo || companyInfo || {};
  const compName = (comp.name || comp.companyName || '').toUpperCase();
  const compAddr = (comp.address || '').toUpperCase();
  const compPhone = comp.phone ? `TEL NO. ${comp.phone}` : '';
  const compPan = comp.pan || comp.panNumber || '';
  const compEsic = comp.esiNo || comp.employerEsiCode || comp.registrationNo || '';

  const showHeader = opt.showCompanyHeader !== false;
  const showStatutoryCodes = opt.showCompanyStatutoryCodes !== false;

  let headerBottomY = marginY;

  if (showHeader) {
    // Left Circular Logo
    const logoCircleX = marginX + 44;
    const logoCircleY = marginY + 44;
    const logoRadius = 28;
    doc.setDrawColor(37, 99, 235);
    doc.setLineWidth(1.5);
    doc.circle(logoCircleX, logoCircleY, logoRadius);

    // Inner logo text
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(37, 99, 235);
    const nameWords = compName.split(' ');
    doc.text(nameWords[0] || 'RR SECURITY', logoCircleX, logoCircleY - 2, { align: 'center' });
    doc.setFontSize(6);
    doc.text(nameWords.slice(1).join(' ') || '& FACILITIES', logoCircleX, logoCircleY + 7, { align: 'center' });

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

    if (compAddr) {
      curY += 11;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.text(compAddr, headerCenterX, curY, { align: 'center' });
    }

    if (compPhone) {
      curY += 10;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text(compPhone, headerCenterX, curY, { align: 'center' });
    }

    if (showStatutoryCodes) {
      if (compPan) {
        curY += 10;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.text(compPan, headerCenterX, curY, { align: 'center' });
      }
      if (compEsic) {
        curY += 10;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.text(compEsic, headerCenterX, curY, { align: 'center' });
      }
    }

    headerBottomY = Math.max(marginY + 84, curY + 8);
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.8);
    doc.line(marginX, headerBottomY, marginX + contentWidth, headerBottomY);
  } else {
    // Minimal Title
    headerBottomY = marginY + 22;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.text('P A Y S L I P', marginX + contentWidth / 2, marginY + 14, { align: 'center' });
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.8);
    doc.line(marginX, headerBottomY, marginX + contentWidth, headerBottomY);
  }

  // Payslip for the Month row
  const monthRowY = headerBottomY + 13;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(0, 0, 0);
  doc.text('Payslip for the Month', marginX + 8, monthRowY);
  doc.text(':', marginX + 115, monthRowY);
  doc.setFont('helvetica', 'bold');
  const monthTitle = slip.salaryMonth || period?.monthLabel || 'Current Month';
  doc.text(monthTitle, marginX + 125, monthRowY);

  const monthDividerY = headerBottomY + 18;
  doc.line(marginX, monthDividerY, marginX + contentWidth, monthDividerY);

  // 3. Two-Column Metadata Box
  const metaBoxY = monthDividerY;
  const colDividerX = marginX + contentWidth * 0.52;

  // Left Column Fields
  const leftCandidateFields = [
    { id: 'employeeCode', label: 'Employee Code', colon: ':', val: slip.employeeCode || slip.employeeId || '—' },
    { id: 'empCardNo', label: 'Emp. Card No.', colon: ':', val: slip.empCardNo || '—' },
    { id: 'employeeName', label: 'Employee Name', colon: ':', val: slip.employeeName || slip.name || '—', bold: true },
    { id: 'fatherHusbandName', label: 'Father/Husb. Name', colon: ':', val: slip.fatherHusbandName || slip.fatherName || '—' },
    { id: 'designation', label: 'Designation', colon: ':', val: slip.designation || '—' },
    { id: 'department', label: 'Department', colon: ':', val: slip.department || '—' },
    { id: 'location', label: 'Location', colon: ':', val: slip.location || slip.site || '—' },
    { id: 'dateOfJoining', label: 'Date of Joining', colon: ':', val: slip.dateOfJoining || slip.doj || '—' },
  ];
  const leftFields = leftCandidateFields.filter((f) => opt[f.id] !== false);

  // Right Column Fields
  const rightCandidateFields = [
    { id: 'paymentMode', label: 'Payment Mode', colon: ':', val: slip.paymentMode || 'Bank' },
    { id: 'accountNo', label: 'A/C No.', colon: ':', val: slip.accountNo || slip.bankAccountNo || '—', bold: true },
    { id: 'bankName', label: 'Bank Name', colon: ':', val: slip.bankName || '—' },
    { id: 'ifscCode', label: 'IFSC Code', colon: ':', val: slip.ifscCode || slip.ifsc || '—' },
    { id: 'esiNo', label: 'ESI No.', colon: ':', val: slip.esiNo || '—' },
    { id: 'uan', label: 'UAN', colon: ':', val: slip.uan || '—', bold: true },
    { id: 'pan', label: 'PAN No.', colon: ':', val: slip.pan || '—' },
    { id: 'lwfNo', label: 'LWF No.', colon: ':', val: slip.lwfNo || '—' },
    { id: 'daysPaid', label: 'Days Paid', colon: ':', val: String(slip.daysPaid ?? '30'), bold: true },
  ];
  const rightFields = rightCandidateFields.filter((f) => opt[f.id] !== false);

  const leftColX = marginX + 8;
  const leftColonX = marginX + 94;
  const leftValX = marginX + 102;
  const maxLeftValWidth = Math.max(120, colDividerX - leftValX - 8);

  const rightColX = colDividerX + 8;
  const rightColonX = colDividerX + 78;
  const rightValX = colDividerX + 86;
  const maxRightValWidth = Math.max(120, marginX + contentWidth - rightValX - 8);

  const baseLineHeight = 11.5;
  const lineSpacing = 10;

  // Accurately measure each left field height to prevent collision with next field
  const preparedLeft = leftFields.map((f) => {
    doc.setFont('helvetica', f.bold ? 'bold' : 'normal');
    doc.setFontSize(8.5);
    const textVal = String(f.val || '—');
    const lines = doc.splitTextToSize(textVal, maxLeftValWidth);
    const height = baseLineHeight + Math.max(0, lines.length - 1) * lineSpacing;
    return { ...f, lines, height };
  });

  // Accurately measure each right field height
  const preparedRight = rightFields.map((f) => {
    doc.setFont('helvetica', f.bold ? 'bold' : 'normal');
    doc.setFontSize(8.5);
    const textVal = String(f.val || '—');
    const lines = doc.splitTextToSize(textVal, maxRightValWidth);
    const height = baseLineHeight + Math.max(0, lines.length - 1) * lineSpacing;
    return { ...f, lines, height };
  });

  const leftTotalHeight = preparedLeft.reduce((acc, cur) => acc + cur.height, 0);
  const rightTotalHeight = preparedRight.reduce((acc, cur) => acc + cur.height, 0);
  const metaHeight = Math.max(36, Math.max(leftTotalHeight, rightTotalHeight) + 14);

  // Draw vertical and bottom divider lines
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.8);
  doc.line(colDividerX, metaBoxY, colDividerX, metaBoxY + metaHeight);
  const metaBottomY = metaBoxY + metaHeight;
  doc.line(marginX, metaBottomY, marginX + contentWidth, metaBottomY);

  // Render left column without overlapping
  let curLeftY = metaBoxY + 11;
  preparedLeft.forEach((f) => {
    doc.setFont('helvetica', f.bold ? 'bold' : 'normal');
    doc.setFontSize(8.5);
    doc.text(f.label, leftColX, curLeftY);
    doc.text(f.colon, leftColonX, curLeftY);
    doc.text(f.lines, leftValX, curLeftY, { lineHeightFactor: 1.15 });
    curLeftY += f.height;
  });

  // Render right column without overlapping
  let curRightY = metaBoxY + 11;
  preparedRight.forEach((f) => {
    doc.setFont('helvetica', f.bold ? 'bold' : 'normal');
    doc.setFontSize(8.5);
    doc.text(f.label, rightColX, curRightY);
    doc.text(f.colon, rightColonX, curRightY);
    doc.text(f.lines, rightValX, curRightY, { lineHeightFactor: 1.15 });
    curRightY += f.height;
  });

  // 4. Earnings & Deductions Table
  const showAllowances = opt.showAllowances !== false;
  const showRate = opt.showRate !== false;
  const showPayable = opt.showPayable !== false;
  const showDeductions = opt.showDeductions !== false;
  const showDeductionAmount = opt.showDeductionAmount !== false;
  const showTotalRow = opt.showTotalRow !== false;

  const allowances = slip.allowances || [];
  const deductions = slip.deductions || [];
  const maxRows = Math.max(allowances.length, deductions.length, 4);

  const headRow = [];
  const colStyles = {};
  let colIdx = 0;

  if (showAllowances) {
    headRow.push('ALLOWANCE');
    colStyles[colIdx++] = { halign: 'left', fontStyle: 'bold' };
  }
  if (showRate) {
    headRow.push('RATE');
    colStyles[colIdx++] = { halign: 'right' };
  }
  if (showPayable) {
    headRow.push('PAYABLE');
    colStyles[colIdx++] = { halign: 'right', fontStyle: 'bold' };
  }
  if (showDeductions) {
    headRow.push('DEDUCTIONS');
    colStyles[colIdx++] = { halign: 'left', fontStyle: 'bold' };
  }
  if (showDeductionAmount) {
    headRow.push('AMOUNT');
    colStyles[colIdx++] = { halign: 'right' };
  }

  const tableBody = [];
  if (headRow.length > 0) {
    for (let i = 0; i < maxRows; i++) {
      const a = allowances[i];
      const d = deductions[i];
      const row = [];
      if (showAllowances) row.push(a ? a.name : '');
      if (showRate) row.push(a && a.rate !== undefined ? Number(a.rate).toLocaleString('en-IN') : '');
      if (showPayable) row.push(a && a.payable !== undefined ? Number(a.payable).toLocaleString('en-IN') : '');
      if (showDeductions) row.push(d ? d.name : '');
      if (showDeductionAmount) row.push(d && d.amount !== undefined ? Number(d.amount).toLocaleString('en-IN') : '');
      tableBody.push(row);
    }

    if (showTotalRow) {
      const totalRow = [];
      if (showAllowances) totalRow.push('Total :');
      if (showRate) totalRow.push(Number(slip.totalRate || 0).toLocaleString('en-IN'));
      if (showPayable) totalRow.push(Number(slip.totalPayable || 0).toLocaleString('en-IN'));
      if (showDeductions) totalRow.push('');
      if (showDeductionAmount) totalRow.push(Number(slip.totalDeductions || 0).toLocaleString('en-IN'));
      tableBody.push(totalRow);
    }

    autoTable(doc, {
      startY: metaBottomY,
      margin: { left: marginX, right: marginX },
      tableWidth: contentWidth,
      head: [headRow],
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
      columnStyles: colStyles,
      didParseCell: (data) => {
        if (showTotalRow && data.row.index === tableBody.length - 1) {
          data.cell.styles.fontStyle = 'bold';
          if (showAllowances && data.column.index === 0) data.cell.styles.halign = 'right';
        }
      },
    });
  }

  const tableBottomY = doc.lastAutoTable ? doc.lastAutoTable.finalY : metaBottomY;

  // 5. Net Salary & In-Words Strip
  const showWords = opt.netSalaryWords !== false;
  const showNet = opt.netSalary !== false;
  let netBoxBottomY = tableBottomY;

  if (showWords || showNet) {
    const netBoxY = tableBottomY;
    const netBoxHeight = 22;
    doc.rect(marginX, netBoxY, contentWidth, netBoxHeight);

    if (showWords) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      const wordsText = slip.netSalaryWords || numberToIndianWords(slip.netSalary || 0);
      doc.text(wordsText, marginX + 8, netBoxY + 14, { maxWidth: contentWidth * 0.65 });
    }

    if (showNet) {
      const netRightX = marginX + contentWidth - 8;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      const netFormatted = Number(slip.netSalary || 0).toLocaleString('en-IN');
      doc.text(`NET SALARY :   ${netFormatted}`, netRightX, netBoxY + 14, { align: 'right' });
    }

    netBoxBottomY = netBoxY + netBoxHeight;
  }

  // 6. Attendance Details Row
  if (opt.showAttendanceStrip !== false) {
    const attY = netBoxBottomY;
    const attHeight = 30;
    doc.rect(marginX, attY, contentWidth, attHeight);

    const att = slip.attendanceDetails || {};
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('Att. Details :', marginX + 8, attY + 12);

    doc.setFont('helvetica', 'normal');
    const line1Items = [];
    if (opt.monthDays !== false) line1Items.push(`Month Days : ${att.monthDays || 30}`);
    if (opt.present !== false) line1Items.push(`Present : ${att.present || 30}`);
    if (opt.wOff !== false) line1Items.push(`W.Off : ${att.wOff !== undefined ? att.wOff : ''}`);
    if (opt.lwp !== false) line1Items.push(`LWP : ${att.lwp !== undefined ? att.lwp : ''}`);
    if (opt.payable !== false) line1Items.push(`Payable : ${att.payable || 30}`);

    if (line1Items.length > 0) {
      doc.text(line1Items.join('    '), marginX + 70, attY + 12);
    }

    const line2Items = [];
    if (opt.holiday !== false) line2Items.push(`Holiday : ${att.holiday || ''}`);
    if (opt.cl !== false) line2Items.push(`CL : ${att.cl || ''}`);
    if (opt.sl !== false) line2Items.push(`SL : ${att.sl || ''}`);
    if (opt.el !== false) line2Items.push(`EL : ${att.el || ''}`);

    if (line2Items.length > 0) {
      doc.text(line2Items.join('    '), marginX + 70, attY + 23);
    }
  }

  // 7. Authorised Signatory Block
  if (opt.showAuthorisedSignatory !== false) {
    const signatoryY = marginY + boxHeight - 20;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text('Authorised Signatory', marginX + contentWidth - 14, signatoryY, { align: 'right' });
  }

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
