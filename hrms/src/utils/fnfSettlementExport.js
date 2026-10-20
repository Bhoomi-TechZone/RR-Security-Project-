import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { numberToIndianWords } from './payrollUtils';
import hrLogo from '../assets/hrlogo.png';

/**
 * Format currency to Indian Rupees with two decimal places
 */
function formatCurrency(amount) {
  const num = Number(amount) || 0;
  return `Rs. ${num.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Convert number to Indian Rupee Words
 */
function getAmountInWords(amount) {
  const num = Math.round(Number(amount) || 0);
  if (num === 0) return 'Indian Rupee Zero Only';
  const rawWords = numberToIndianWords(num);
  const clean = rawWords.replace(/\s*Rupees\s*Only$/i, '').trim();
  return `Indian Rupee ${clean} Only`;
}

/**
 * Load an image source and convert to dataURL with dimensions
 */
const loadImageInfo = (src) => {
  return new Promise((resolve) => {
    if (!src || typeof src !== 'string') return resolve(null);

    const timer = setTimeout(() => resolve(null), 1800);
    const finish = (result) => {
      clearTimeout(timer);
      resolve(result);
    };

    if (src.startsWith('data:image/')) {
      const img = new Image();
      img.onload = () => {
        const format = src.includes('image/jpeg') || src.includes('image/jpg') ? 'JPEG' : 'PNG';
        finish({
          dataUrl: src,
          naturalWidth: img.naturalWidth || 50,
          naturalHeight: img.naturalHeight || 50,
          format,
        });
      };
      img.onerror = () => finish(null);
      img.src = src;
      return;
    }

    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || 50;
        canvas.height = img.naturalHeight || 50;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        const dataUrl = canvas.toDataURL('image/png');
        finish({
          dataUrl,
          naturalWidth: canvas.width,
          naturalHeight: canvas.height,
          format: 'PNG',
        });
      } catch {
        finish({
          dataUrl: src,
          naturalWidth: 50,
          naturalHeight: 50,
          format: 'PNG',
        });
      }
    };
    img.onerror = () => finish(null);
    img.src = src;
  });
};

/**
 * Generate and download or print Full & Final Settlement PDF
 */
export async function downloadFnfSettlementPdf(record, globalCompanyInfo, options = {}) {
  const mode = options.mode || 'download';
  const company = record.companyInfo || globalCompanyInfo || {};
  const companyName = company.name || 'RR Security & Facilities';
  const companyAddress =
    company.address ||
    'G-75/A Block-G M.B. Extn Badarpur New Delhi Delhi 110044 India';

  const logoSrc =
    company.logo ||
    globalCompanyInfo?.logo ||
    localStorage.getItem('novaspark_company_logo_preview') ||
    hrLogo;

  const logoInfo = await loadImageInfo(logoSrc);

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 595.28 pt
  const pageHeight = doc.internal.pageSize.getHeight(); // 841.89 pt
  const marginX = 26;
  const contentWidth = pageWidth - marginX * 2;
  const topMargin = 24;

  // Outer document sheet border
  doc.setDrawColor(51, 65, 85);
  doc.setLineWidth(1);
  doc.rect(marginX, topMargin, contentWidth, pageHeight - topMargin * 2);

  // --- 1. Header Information & Logo ---
  let curY = topMargin + 16;

  // Company Name
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14.5);
  doc.setTextColor(15, 23, 42);
  doc.text(companyName, marginX + 12, curY);

  // Logo on right
  if (logoInfo?.dataUrl) {
    try {
      const maxLogoW = 110;
      const maxLogoH = 38;
      const aspect = (logoInfo.naturalWidth || 1) / (logoInfo.naturalHeight || 1);
      let renderW = maxLogoW;
      let renderH = renderW / aspect;
      if (renderH > maxLogoH) {
        renderH = maxLogoH;
        renderW = renderH * aspect;
      }
      doc.addImage(
        logoInfo.dataUrl,
        logoInfo.format || 'PNG',
        marginX + contentWidth - renderW - 12,
        curY - 10,
        renderW,
        renderH
      );
    } catch {
      // ignore logo render error
    }
  }

  // Company Address
  curY += 14;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);
  const splitAddress = doc.splitTextToSize(companyAddress, contentWidth - 140);
  doc.text(splitAddress, marginX + 12, curY);
  curY += splitAddress.length * 11 + 6;

  // --- 2. Title Banner ---
  doc.setDrawColor(51, 65, 85);
  doc.setLineWidth(0.8);
  doc.line(marginX, curY, marginX + contentWidth, curY);

  curY += 13;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text('FULL AND FINAL SETTLEMENT', pageWidth / 2, curY, { align: 'center' });

  curY += 6;
  doc.line(marginX, curY, marginX + contentWidth, curY);
  curY += 13;

  // --- 3. PAY SUMMARY ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text('PAY SUMMARY', marginX + 12, curY);
  curY += 10;

  const leftPairs = [
    ['Employee Name', record.name || record.employeeName || '—'],
    ['Designation', record.designation || 'Staff'],
    ['Date of Joining', record.dateOfJoining || '—'],
    ['Pay Period', record.payPeriod || '—'],
    ['Final Settlement Date', record.finalSettlementDate || '—'],
    ['ESI Number', record.esiNumber || record.esiNo || '—'],
  ];

  const rightPairs = [
    ['Employee ID', record.employeeId || '—'],
    ['Bank Account No', record.bankAccountNo || '—'],
    ['PF A/C Number', record.pfAccountNumber || record.pfNo || '—'],
    ['UAN', record.uan || '—'],
    ['Paid Days', String(record.paidDays ?? 0)],
    ['LOP Days', String(record.lopDays ?? 0)],
  ];

  doc.setFontSize(8);
  const rowHeight = 11.5;
  const colMid = marginX + contentWidth / 2 + 10;

  for (let i = 0; i < leftPairs.length; i++) {
    const y = curY + i * rowHeight;
    // Left
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(30, 41, 59);
    doc.text(leftPairs[i][0], marginX + 12, y);
    doc.text(':', marginX + 115, y);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(String(leftPairs[i][1]), marginX + 125, y);

    // Right
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(30, 41, 59);
    doc.text(rightPairs[i][0], colMid, y);
    doc.text(':', colMid + 95, y);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(String(rightPairs[i][1]), colMid + 105, y);
  }

  curY += leftPairs.length * rowHeight + 8;

  // --- 4. EARNINGS & DEDUCTIONS Table ---
  const earnings = record.earnings || {};
  const deductions = record.deductions || {};
  const netPay = record.netPay || {};

  const grossEarnings = Number(earnings.grossEarnings ?? record.grossSalary ?? 0);
  const totalDeductions = Number(deductions.totalDeductions ?? record.grossDeduct ?? 0);
  const netPayable = Number(netPay.netPayable ?? record.netPayableNumber ?? (grossEarnings - totalDeductions));

  const tableBody = [
    [
      'Basic',
      formatCurrency(earnings.basic ?? 0),
      formatCurrency(earnings.ytdBasic ?? 0),
      'UNIFORM',
      formatCurrency(deductions.uniform ?? 0),
      formatCurrency(deductions.ytdUniform ?? 0),
    ],
    [
      'House Rent Allowance',
      formatCurrency(earnings.hra ?? 0),
      formatCurrency(earnings.ytdHra ?? 0),
      'Income Tax',
      formatCurrency(deductions.incomeTax ?? 0),
      formatCurrency(deductions.ytdIncomeTax ?? 0),
    ],
    [
      'Conveyance Allowance',
      formatCurrency(earnings.conveyance ?? 0),
      formatCurrency(earnings.ytdConveyance ?? 0),
      deductions.pf > 0 ? 'Provident Fund (PF)' : '',
      deductions.pf > 0 ? formatCurrency(deductions.pf) : '',
      deductions.pf > 0 ? formatCurrency(deductions.ytdPf) : '',
    ],
    [
      'Fixed Allowance',
      formatCurrency(earnings.fixedAllowance ?? 0),
      formatCurrency(earnings.ytdFixedAllowance ?? 0),
      deductions.esi > 0 ? 'ESI' : '',
      deductions.esi > 0 ? formatCurrency(deductions.esi) : '',
      deductions.esi > 0 ? formatCurrency(deductions.ytdEsi) : '',
    ],
    [
      `Overtime Allowance\nHours: ${earnings.overtimeHours || '00:00'}`,
      formatCurrency(earnings.overtime ?? 0),
      formatCurrency(earnings.ytdOvertime ?? 0),
      deductions.pt > 0 ? 'Professional Tax (PT)' : '',
      deductions.pt > 0 ? formatCurrency(deductions.pt) : '',
      deductions.pt > 0 ? formatCurrency(deductions.ytdPt) : '',
    ],
    [
      'Bonus',
      formatCurrency(earnings.bonus ?? 0),
      formatCurrency(earnings.ytdBonus ?? 0),
      deductions.advanceLoan > 0 ? 'Advance / Loan EMI' : '',
      deductions.advanceLoan > 0 ? formatCurrency(deductions.advanceLoan) : '',
      deductions.advanceLoan > 0 ? formatCurrency(deductions.advanceLoan * 6) : '',
    ],
    [
      'Commission',
      formatCurrency(earnings.commission ?? 0),
      formatCurrency(earnings.ytdCommission ?? 0),
      deductions.otherDeductions > 0 ? 'Other Deductions' : '',
      deductions.otherDeductions > 0 ? formatCurrency(deductions.otherDeductions) : '',
      deductions.otherDeductions > 0 ? formatCurrency(deductions.otherDeductions * 6) : '',
    ],
    [
      'Leave Encashment',
      formatCurrency(earnings.leaveEncashment ?? 0),
      formatCurrency(earnings.ytdLeaveEncashment ?? 0),
      '',
      '',
      '',
    ],
    [
      { content: 'Gross Earnings', styles: { fontStyle: 'bold' } },
      { content: formatCurrency(grossEarnings), styles: { fontStyle: 'bold' } },
      '',
      { content: 'Total Deductions', styles: { fontStyle: 'bold' } },
      { content: formatCurrency(totalDeductions), styles: { fontStyle: 'bold' } },
      '',
    ],
  ];

  autoTable(doc, {
    startY: curY,
    margin: { left: marginX, right: marginX },
    tableWidth: contentWidth,
    head: [['EARNINGS', 'AMOUNT', 'YTD', 'DEDUCTIONS', 'AMOUNT', 'YTD']],
    body: tableBody,
    theme: 'plain',
    styles: {
      font: 'helvetica',
      fontSize: 7.8,
      cellPadding: 3.5,
      textColor: [15, 23, 42],
      lineColor: [148, 163, 184],
      lineWidth: 0.5,
    },
    headStyles: {
      fontStyle: 'bold',
      fontSize: 8,
      textColor: [15, 23, 42],
      lineColor: [51, 65, 85],
      lineWidth: 0.8,
    },
    columnStyles: {
      0: { cellWidth: contentWidth * 0.28, halign: 'left' },
      1: { cellWidth: contentWidth * 0.11, halign: 'right' },
      2: { cellWidth: contentWidth * 0.11, halign: 'right' },
      3: { cellWidth: contentWidth * 0.28, halign: 'left' },
      4: { cellWidth: contentWidth * 0.11, halign: 'right' },
      5: { cellWidth: contentWidth * 0.11, halign: 'right' },
    },
  });

  curY = doc.lastAutoTable.finalY;

  // --- 5. NET PAY Table ---
  const netPayBody = [
    ['Gross Earnings', formatCurrency(grossEarnings)],
    ['Total Deductions', `(-) ${formatCurrency(totalDeductions)}`],
    [
      { content: 'Total Net Payable', styles: { fontStyle: 'bold', fontSize: 8.5 } },
      { content: formatCurrency(netPayable), styles: { fontStyle: 'bold', fontSize: 8.5 } },
    ],
  ];

  autoTable(doc, {
    startY: curY,
    margin: { left: marginX, right: marginX },
    tableWidth: contentWidth,
    head: [['NET PAY', 'AMOUNT']],
    body: netPayBody,
    theme: 'plain',
    styles: {
      font: 'helvetica',
      fontSize: 8,
      cellPadding: 4,
      textColor: [15, 23, 42],
      lineColor: [148, 163, 184],
      lineWidth: 0.5,
    },
    headStyles: {
      fontStyle: 'bold',
      fontSize: 8.2,
      textColor: [15, 23, 42],
      lineColor: [51, 65, 85],
      lineWidth: 0.8,
    },
    columnStyles: {
      0: { cellWidth: contentWidth * 0.78, halign: 'left' },
      1: { cellWidth: contentWidth * 0.22, halign: 'right' },
    },
  });

  curY = doc.lastAutoTable.finalY;

  // --- 6. Total Net Payable in Words & Formula Banner ---
  const bannerH = 30;
  doc.setDrawColor(51, 65, 85);
  doc.setLineWidth(0.8);
  doc.rect(marginX, curY, contentWidth, bannerH);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.8);
  doc.setTextColor(15, 23, 42);
  const wordsText = `Total Net Payable ${formatCurrency(netPayable)} (${getAmountInWords(netPayable)})`;
  doc.text(wordsText, pageWidth / 2, curY + 12, { align: 'center', maxWidth: contentWidth - 20 });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('**Total Net Payable = (Gross Earnings - Total Deductions)', pageWidth / 2, curY + 23, { align: 'center' });

  curY += bannerH + 12;

  // --- 7. Sign-off / Notes ---
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);
  doc.text('Note:', marginX + 12, curY);

  curY += 32;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.2);
  doc.setTextColor(15, 23, 42);
  doc.text('Prepared By:', marginX + 30, curY);
  doc.text('Checked By:', pageWidth / 2, curY, { align: 'center' });
  doc.text('Authorised By:', marginX + contentWidth - 85, curY);

  curY += 16;

  // --- 8. Declaration By the Receiver ---
  doc.setDrawColor(203, 213, 225);
  doc.setLineDashPattern([2, 2], 0);
  doc.line(marginX + 8, curY, marginX + contentWidth - 8, curY);
  doc.setLineDashPattern([], 0);

  curY += 12;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text('Declaration By the Receiver', marginX + 12, curY);

  curY += 10;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.8);
  doc.setTextColor(51, 65, 85);
  const declarationText =
    'I, the undersigned, hereby state that I have received the above said amount as my full and final settlement out of my own free will and consent, and I have no further claims whatsoever against the company.';
  const splitDec = doc.splitTextToSize(declarationText, contentWidth - 24);
  doc.text(splitDec, marginX + 12, curY);

  curY += splitDec.length * 10 + 20;
  doc.text('Signature of the Employee: _______________________________', marginX + 12, curY);
  doc.text('Date: ________________________', marginX + contentWidth - 145, curY);

  // Output action based on mode
  if (mode === 'print') {
    doc.autoPrint();
    const blobUrl = doc.output('bloburl');
    const printWindow = window.open(blobUrl, '_blank');
    if (printWindow) {
      printWindow.focus();
    }
  } else {
    const filename = `FnF_Settlement_${(record.name || 'Employee').replace(/\s+/g, '_')}_${record.employeeId || 'EMP'}.pdf`;
    doc.save(filename);
  }
}
