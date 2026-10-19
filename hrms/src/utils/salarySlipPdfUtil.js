import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { numberToIndianWords } from './payrollUtils';

/**
 * Load an image source and convert to dataURL with dimensions
 */
const loadImageInfo = (src) => {
  return new Promise((resolve) => {
    if (!src || typeof src !== 'string') return resolve(null);

    // If already base64 data URI
    if (src.startsWith('data:image/')) {
      const img = new Image();
      img.onload = () => {
        const format = src.includes('image/jpeg') || src.includes('image/jpg') ? 'JPEG' : 'PNG';
        resolve({
          dataUrl: src,
          naturalWidth: img.naturalWidth || 40,
          naturalHeight: img.naturalHeight || 40,
          format,
        });
      };
      img.onerror = () => {
        resolve({
          dataUrl: src,
          naturalWidth: 40,
          naturalHeight: 40,
          format: 'PNG',
        });
      };
      img.src = src;
      return;
    }

    // If external or relative URL
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || 40;
        canvas.height = img.naturalHeight || 40;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        const dataUrl = canvas.toDataURL('image/png');
        resolve({
          dataUrl,
          naturalWidth: canvas.width,
          naturalHeight: canvas.height,
          format: 'PNG',
        });
      } catch (err) {
        console.warn('Canvas conversion failed, passing raw src:', err);
        resolve({
          dataUrl: src,
          naturalWidth: img.naturalWidth || 40,
          naturalHeight: img.naturalHeight || 40,
          format: 'PNG',
        });
      }
    };
    img.onerror = () => {
      console.warn('Could not load company logo from:', src);
      resolve(null);
    };
    img.src = src;
  });
};

/**
 * Format amounts cleanly for PDF (avoiding Unicode symbol encoding bugs)
 */
const formatAmt = (val) => {
  const n = Math.round(Number(val || 0));
  return n.toLocaleString('en-IN');
};

/**
 * Generate and download or print a professional, single-page A4 Salary Slip PDF
 * @param {Object} params
 * @param {Object} params.slip - The salary slip object
 * @param {Object} [params.company] - Company details (name, address, email, etc.)
 * @param {Object} [params.config] - Optional visibility & template configuration
 * @param {string} [params.mode] - 'download' (default) or 'print'
 */
export async function generateSalarySlipPdf({
  slip,
  company = {},
  config = null,
  mode = 'download',
}) {
  if (!slip) return;

  // 1. Resolve Dynamic Company Details
  const companyName =
    slip.companyName ||
    company?.name ||
    slip.company ||
    slip.clientName ||
    'RR Security & Facilities';

  const companyAddress =
    slip.companyAddress ||
    [company?.address, company?.city, company?.state, company?.pinCode].filter(Boolean).join(', ') ||
    company?.address ||
    '';

  const companyEmail = slip.companyEmail || company?.email || '';
  const companyPhone = slip.companyPhone || company?.phone || '';
  const companyGstin = slip.companyGstin || company?.gstin || '';
  const companyPan = slip.companyPan || company?.pan || '';

  // Dynamic Company Logo resolution (from slip, company object, or localStorage)
  const resolvedCompanyLogo =
    slip.companyLogo ||
    company?.logo ||
    company?.logoUrl ||
    (typeof window !== 'undefined' ? localStorage.getItem('novaspark_company_logo_preview') : null) ||
    null;

  // Visibility toggles
  const showLogo = config?.companyInfo?.showLogo !== false;
  const showCompanyName = config?.companyInfo?.showCompanyName !== false;
  const showAddress = config?.companyInfo?.showAddress !== false;
  const showContact = config?.companyInfo?.showContact !== false;
  const showGstPan = config?.companyInfo?.showGstPan !== false;

  const showName = config?.employeeInfo?.showName !== false;
  const showEmpCode = config?.employeeInfo?.showEmpCode !== false;
  const showDept = config?.employeeInfo?.showDepartment !== false;
  const showDesig = config?.employeeInfo?.showDesignation !== false;
  const showLocation = config?.employeeInfo?.showLocation !== false;
  const showBank = config?.employeeInfo?.showBankDetails !== false;
  const showUanPf = config?.employeeInfo?.showUanPf !== false;
  const showEsiNo = config?.employeeInfo?.showEsiNo !== false;

  const showNotes = config?.footerInfo?.showNotes !== false;
  const customNotes =
    config?.footerInfo?.customNotes ||
    `This is a computer-generated salary slip and does not require a physical signature unless mandated for statutory submission.`;
  const showSignatory = config?.footerInfo?.showAuthorizedSignatory !== false;
  const signatoryLabel = config?.footerInfo?.signatoryLabel || 'Authorised Signatory';

  // 2. Resolve Earnings
  const earnings = slip.earnings || slip.earningsBreakdown || {};
  const basic = earnings.basic || earnings.basicSalary || 0;
  const hra = earnings.hra || 0;
  const conveyance = earnings.conveyance || earnings.conveyanceAllowance || earnings.transportAllowance || 0;
  const vda = earnings.vda || 0;
  const specialAllowance = earnings.specialAllowance || 0;
  const otherAllowance = earnings.otherAllowance || 0;
  const overtime = earnings.overtime || 0;
  const bonus = earnings.bonus || earnings.statutoryBonus || slip.bonus || 0;
  const arrears = earnings.arrears || slip.arrears || 0;
  const incentive = earnings.incentive || earnings.performanceIncentive || 0;
  const grossSalary =
    earnings.totalGross ||
    earnings.grossSalary ||
    slip.grossSalary ||
    (basic + hra + conveyance + vda + specialAllowance + otherAllowance + overtime + bonus + arrears + incentive);

  // 3. Resolve Deductions
  const deductions = slip.deductions || slip.deductionsBreakdown || {};
  const pf = deductions.pfEmployee || deductions.pf || deductions.providentFund || 0;
  const esi = deductions.esiEmployee || deductions.esi || deductions.esic || 0;
  const pt = deductions.pt || deductions.professionalTax || 0;
  const tds = deductions.tds || deductions.incomeTax || 0;
  const lwf = deductions.lwfEmployee || deductions.lwf || deductions.labourWelfareFund || 0;
  const advance = deductions.advances || deductions.advanceAdjustment || deductions.loanEmi || 0;
  const otherDeductions = deductions.otherDeductions || deductions.otherDeduction || 0;
  const totalDeductions =
    deductions.totalDeductions ||
    slip.totalDeductions ||
    (pf + esi + pt + tds + lwf + advance + otherDeductions);

  const netSalary = slip.netSalary || Math.max(0, grossSalary - totalDeductions);
  const amountInWords = numberToIndianWords(netSalary);

  const salaryMonth = slip.salaryMonth || slip.monthLabel || slip.month || 'Current Month';
  const slipNumber = slip.slipNumber || 'SLIP-OFFICIAL';
  const employeeName = slip.employeeName || 'Staff Member';
  const employeeId = slip.employeeId || slip.employeeCode || '—';
  const designation = slip.designation || 'Staff';
  const department = slip.department || 'Operations';
  const clientSite = slip.clientName || slip.site || 'Corporate';
  const bankName = slip.bankName || slip.bankDetails?.bank || '—';
  const bankAccountNo = slip.bankAccountNo || slip.bankAccount || slip.accountNumber || slip.bankDetails?.accountNumber || '—';
  const uan = slip.uan || slip.pfNo || slip.pfNumber || '—';
  const esicNo = slip.esicNo || slip.esiNumber || '—';

  const workingDays = slip.workingDays || slip.totalDaysInMonth || 30;
  const presentDays = slip.presentDays !== undefined ? slip.presentDays : (slip.paidDays ?? 0);
  const leaveDays = slip.leaveDays !== undefined ? slip.leaveDays : 0;
  const absentDays = slip.lopDays !== undefined ? slip.lopDays : (slip.absentDays || 0);
  const paidDays = slip.paidDays !== undefined ? slip.paidDays : 0;
  const overtimeHours = slip.overtimeHours || 0;

  const initials = (companyName.split(' ').map((w) => w[0]).join('').substring(0, 3) || 'RRS').toUpperCase();

  // Asynchronously load the logo if enabled
  const logoInfo = (showLogo && resolvedCompanyLogo) ? await loadImageInfo(resolvedCompanyLogo) : null;

  // 4. Initialize A4 Document (595.28 x 841.89 pt)
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginX = 32;
  const contentWidth = pageWidth - (marginX * 2);

  // Outer Decorative Border
  doc.setDrawColor(203, 213, 225); // Slate 300
  doc.setLineWidth(1);
  doc.roundedRect(marginX - 6, 24, contentWidth + 12, pageHeight - 48, 6, 6, 'S');

  // --- Header Section ---
  const headerY = 38;

  // Render Dynamic Company Logo or Fallback Initials Badge
  let logoRenderWidth = 40;
  let logoRenderHeight = 40;

  if (showLogo) {
    if (logoInfo?.dataUrl) {
      try {
        // Maintain aspect ratio within bounding box 54x40 pt
        if (logoInfo.naturalWidth && logoInfo.naturalHeight) {
          const aspect = logoInfo.naturalWidth / logoInfo.naturalHeight;
          if (aspect >= 1) {
            logoRenderWidth = Math.min(54, 40 * aspect);
            logoRenderHeight = logoRenderWidth / aspect;
            if (logoRenderHeight > 40) {
              logoRenderHeight = 40;
              logoRenderWidth = logoRenderHeight * aspect;
            }
          } else {
            logoRenderHeight = 40;
            logoRenderWidth = logoRenderHeight * aspect;
          }
        }

        const logoOffsetY = headerY + Math.max(0, (40 - logoRenderHeight) / 2);
        doc.addImage(
          logoInfo.dataUrl,
          logoInfo.format || 'PNG',
          marginX + 6,
          logoOffsetY,
          logoRenderWidth,
          logoRenderHeight,
          undefined,
          'FAST'
        );
      } catch (e) {
        console.warn('doc.addImage failed, falling back to initials badge:', e);
        doc.setFillColor(15, 23, 42);
        doc.roundedRect(marginX + 6, headerY, 40, 40, 4, 4, 'F');
        doc.setTextColor(56, 189, 248);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(13);
        doc.text(initials, marginX + 26, headerY + 25, { align: 'center' });
      }
    } else {
      // Fallback Initials Badge
      doc.setFillColor(15, 23, 42); // Dark Navy #0f172a
      doc.roundedRect(marginX + 6, headerY, 40, 40, 4, 4, 'F');
      doc.setTextColor(56, 189, 248); // Sky 400 #38bdf8
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.text(initials, marginX + 26, headerY + 25, { align: 'center' });
    }
  }

  const textStartX = (showLogo && logoInfo?.dataUrl)
    ? (marginX + 14 + logoRenderWidth)
    : (showLogo ? marginX + 54 : marginX + 6);

  const maxMetaWidth = pageWidth - marginX - 110 - textStartX;

  // Company Name
  if (showCompanyName) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42);
    doc.text(companyName, textStartX, headerY + 12);
  }

  // Address
  if (showAddress && companyAddress) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text(companyAddress, textStartX, headerY + 24, { maxWidth: maxMetaWidth });
  }

  // Contact & GST/PAN
  const contactParts = [];
  if (showContact && companyEmail) contactParts.push(`Email: ${companyEmail}`);
  if (showContact && companyPhone) contactParts.push(`Tel: ${companyPhone}`);
  if (showGstPan && companyGstin) contactParts.push(`GSTIN: ${companyGstin}`);
  if (showGstPan && companyPan) contactParts.push(`PAN: ${companyPan}`);

  if (contactParts.length > 0) {
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(contactParts.join('  |  '), textStartX, headerY + 36, { maxWidth: maxMetaWidth });
  }

  // Top Right Payslip Month Tag
  const rightTagX = pageWidth - marginX - 6;
  doc.setFillColor(15, 23, 42);
  doc.roundedRect(rightTagX - 70, headerY, 70, 18, 3, 3, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('PAYSLIP', rightTagX - 35, headerY + 12, { align: 'center' });

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(salaryMonth, rightTagX, headerY + 32, { align: 'right' });

  doc.setTextColor(100, 116, 139);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(slipNumber, rightTagX, headerY + 43, { align: 'right' });

  // Divider Line
  const dividerY = headerY + 52;
  doc.setDrawColor(15, 23, 42);
  doc.setLineWidth(1.5);
  doc.line(marginX + 6, dividerY, pageWidth - marginX - 6, dividerY);

  // --- Employee Details Box ---
  const empBoxY = dividerY + 10;
  const empBoxHeight = 72;
  doc.setFillColor(248, 250, 252); // Slate 50
  doc.setDrawColor(226, 232, 240); // Slate 200
  doc.setLineWidth(0.75);
  doc.roundedRect(marginX + 6, empBoxY, contentWidth - 12, empBoxHeight, 4, 4, 'FD');

  const col1X = marginX + 16;
  const col1ValX = marginX + 90;
  const col2X = marginX + 265;
  const col2ValX = marginX + 345;
  let rowY = empBoxY + 16;
  const rowGap = 13;

  doc.setFontSize(8.5);

  // Row 1
  if (showName) {
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text('Employee Name:', col1X, rowY);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(employeeName, col1ValX, rowY);
  }
  if (showLocation) {
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text('Client / Site:', col2X, rowY);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(clientSite, col2ValX, rowY, { maxWidth: 170 });
  }

  // Row 2
  rowY += rowGap;
  if (showEmpCode) {
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text('Employee ID:', col1X, rowY);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(37, 99, 235); // Blue 600
    doc.text(employeeId, col1ValX, rowY);
  }
  if (showBank) {
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text('Bank Name:', col2X, rowY);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 23, 42);
    doc.text(bankName, col2ValX, rowY);
  }

  // Row 3
  rowY += rowGap;
  if (showDesig) {
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text('Designation:', col1X, rowY);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 23, 42);
    doc.text(designation, col1ValX, rowY);
  }
  if (showBank) {
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text('Bank A/C No:', col2X, rowY);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(bankAccountNo, col2ValX, rowY);
  }

  // Row 4
  rowY += rowGap;
  if (showDept) {
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text('Department:', col1X, rowY);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 23, 42);
    doc.text(department, col1ValX, rowY);
  }
  if (showUanPf || showEsiNo) {
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text('UAN / ESIC:', col2X, rowY);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 23, 42);
    const statutoryLine = [showUanPf ? `UAN: ${uan}` : null, showEsiNo ? `ESIC: ${esicNo}` : null]
      .filter(Boolean)
      .join('  |  ');
    doc.text(statutoryLine || '—', col2ValX, rowY);
  }

  // --- Attendance Summary Strip ---
  const attY = empBoxY + empBoxHeight + 8;
  const attHeight = 34;
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(marginX + 6, attY, contentWidth - 12, attHeight, 4, 4, 'FD');

  const attCols = [
    { label: 'Total Days', value: String(workingDays) },
    { label: 'Present', value: String(presentDays) },
    { label: 'Leave', value: String(leaveDays) },
    { label: 'LOP / Absent', value: String(absentDays) },
    ...(overtimeHours ? [{ label: 'Overtime', value: `${overtimeHours} hrs` }] : []),
    { label: 'Paid Days', value: String(paidDays), isHighlight: true },
  ];

  const colWidth = (contentWidth - 12) / attCols.length;
  attCols.forEach((item, idx) => {
    const itemX = marginX + 6 + (idx * colWidth);
    if (item.isHighlight) {
      doc.setFillColor(239, 246, 255); // Blue 50
      doc.rect(itemX, attY, colWidth, attHeight, 'F');
    }
    if (idx > 0) {
      doc.setDrawColor(226, 232, 240);
      doc.line(itemX, attY, itemX, attY + attHeight);
    }
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(item.label, itemX + (colWidth / 2), attY + 13, { align: 'center' });

    doc.setFontSize(10.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(item.isHighlight ? 37 : 15, item.isHighlight ? 99 : 23, item.isHighlight ? 235 : 42);
    doc.text(item.value, itemX + (colWidth / 2), attY + 27, { align: 'center' });
  });

  // --- Earnings & Deductions Ledger Table ---
  const tableStartY = attY + attHeight + 8;

  // Prepare ledger lines
  const earningsList = [
    { label: 'Basic Salary', amount: basic },
    ...(hra > 0 ? [{ label: 'House Rent Allowance (HRA)', amount: hra }] : []),
    ...(vda > 0 ? [{ label: 'Variable DA (VDA)', amount: vda }] : []),
    ...(conveyance > 0 ? [{ label: 'Conveyance Allowance', amount: conveyance }] : []),
    ...(specialAllowance > 0 ? [{ label: 'Special Allowance', amount: specialAllowance }] : []),
    ...(bonus > 0 ? [{ label: 'Statutory Bonus', amount: bonus }] : []),
    ...(incentive > 0 ? [{ label: 'Incentive', amount: incentive }] : []),
    ...(arrears > 0 ? [{ label: 'Arrears', amount: arrears }] : []),
    ...(otherAllowance > 0 ? [{ label: 'Other Allowance', amount: otherAllowance }] : []),
    ...(overtime > 0 ? [{ label: 'Overtime Pay', amount: overtime }] : []),
  ];

  const deductionsList = [
    { label: 'Provident Fund (EPF)', amount: pf },
    { label: 'Employee State Insurance (ESIC)', amount: esi },
    ...(pt > 0 ? [{ label: 'Professional Tax (PT)', amount: pt }] : []),
    ...(tds > 0 ? [{ label: 'Tax Deducted at Source (TDS)', amount: tds }] : []),
    ...(lwf > 0 ? [{ label: 'Labour Welfare Fund (LWF)', amount: lwf }] : []),
    ...(advance > 0 ? [{ label: 'Advance / Loan Recovery', amount: advance }] : []),
    ...(otherDeductions > 0 ? [{ label: 'Other Deductions', amount: otherDeductions }] : []),
  ];

  const maxRows = Math.max(earningsList.length, deductionsList.length, 5);
  const tableBody = [];

  for (let i = 0; i < maxRows; i++) {
    const earn = earningsList[i];
    const ded = deductionsList[i];
    tableBody.push([
      earn ? earn.label : '',
      earn ? formatAmt(earn.amount) : '',
      ded ? ded.label : '',
      ded ? formatAmt(ded.amount) : '',
    ]);
  }

  // Total Summary Row
  tableBody.push([
    { content: 'Total Gross Salary', styles: { fontStyle: 'bold', fillColor: [248, 250, 252] } },
    { content: `Rs. ${formatAmt(grossSalary)}`, styles: { fontStyle: 'bold', halign: 'right', textColor: [22, 101, 52], fillColor: [248, 250, 252] } },
    { content: 'Total Deductions', styles: { fontStyle: 'bold', fillColor: [248, 250, 252] } },
    { content: `-Rs. ${formatAmt(totalDeductions)}`, styles: { fontStyle: 'bold', halign: 'right', textColor: [185, 28, 28], fillColor: [248, 250, 252] } },
  ]);

  autoTable(doc, {
    startY: tableStartY,
    margin: { left: marginX + 6, right: marginX + 6 },
    head: [['EARNINGS COMPONENT', 'AMOUNT (Rs.)', 'DEDUCTIONS COMPONENT', 'AMOUNT (Rs.)']],
    body: tableBody,
    theme: 'grid',
    styles: {
      fontSize: 8,
      cellPadding: 4.5,
      textColor: [30, 41, 59],
      lineColor: [226, 232, 240],
      lineWidth: 0.5,
      font: 'helvetica',
    },
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'left',
    },
    columnStyles: {
      0: { cellWidth: 165 },
      1: { cellWidth: 85, halign: 'right', fontStyle: 'bold' },
      2: { cellWidth: 165 },
      3: { cellWidth: 92, halign: 'right', fontStyle: 'bold' },
    },
  });

  const finalTableY = doc.lastAutoTable?.finalY || (tableStartY + (maxRows * 18) + 30);

  // --- Net Pay Highlight Card ---
  const netPayY = finalTableY + 8;
  const netPayHeight = 44;
  doc.setFillColor(15, 23, 42); // Dark Navy #0f172a
  doc.roundedRect(marginX + 6, netPayY, contentWidth - 12, netPayHeight, 4, 4, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184); // Slate 400
  doc.text('NET SALARY DISBURSED', marginX + 18, netPayY + 15);

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  doc.setTextColor(56, 189, 248); // Sky 400
  doc.text(`Amount in Words:  ${amountInWords}`, marginX + 18, netPayY + 31, { maxWidth: 320 });

  // Right Net Amount (clean ASCII formatting without glyph bugs, with proper right padding)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text(`Rs. ${formatAmt(netSalary)}`, pageWidth - marginX - 22, netPayY + 28, { align: 'right' });

  // --- Footer Section ---
  const footerY = pageHeight - 65;

  // Dashed Separator
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.75);
  doc.line(marginX + 6, footerY - 12, pageWidth - marginX - 6, footerY - 12);

  // Left Note
  if (showNotes) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(customNotes, marginX + 6, footerY + 4, { maxWidth: 350 });
  }

  // Right Authorized Signatory
  if (showSignatory) {
    const signX = pageWidth - marginX - 16;
    doc.setDrawColor(71, 85, 105);
    doc.setLineWidth(0.75);
    doc.line(signX - 120, footerY - 2, signX, footerY - 2);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(51, 65, 85);
    doc.text(signatoryLabel, signX - 60, footerY + 9, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text(companyName, signX - 60, footerY + 18, { align: 'center' });
  }

  // Output handling based on mode
  const cleanEmpName = employeeName.replace(/[^a-zA-Z0-9]/g, '_');
  const cleanMonth = salaryMonth.replace(/[^a-zA-Z0-9]/g, '_');
  const fileName = `Salary_Slip_${cleanEmpName}_${cleanMonth}.pdf`;

  if (mode === 'print') {
    doc.autoPrint();
    const pdfBlob = doc.output('blob');
    const pdfUrl = URL.createObjectURL(pdfBlob);
    window.open(pdfUrl, '_blank');
  } else {
    // Direct file download
    doc.save(fileName);
  }
}
