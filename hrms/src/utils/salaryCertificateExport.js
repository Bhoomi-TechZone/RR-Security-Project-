import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import hrLogo from '../assets/hrlogo.png';

/**
 * Format currency with Indian Comma separators and two decimals
 */
function formatAmount(val) {
  const num = Number(val) || 0;
  return num.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
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
 * Generate and download or print Salary Certificate PDF
 *
 * @param {Object|Array} inputRecord - Single record or array of records
 * @param {Object} globalCompanyInfo - Fallback company details
 * @param {Object} options - { mode: 'download' | 'print', filename: string, companyName: string, companyAddress: string }
 */
export async function downloadSalaryCertificatePdf(
  inputRecord,
  globalCompanyInfo = {},
  options = {}
) {
  const records = Array.isArray(inputRecord) ? inputRecord : [inputRecord];
  if (!records.length) return;

  const mode = options.mode || 'download';

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 595.28 pt
  const marginX = 46;
  const contentWidth = pageWidth - marginX * 2; // ~503 pt

  // Try pre-loading logo
  const logoSrc = options.logo || globalCompanyInfo?.logo || hrLogo;
  const logoInfo = await loadImageInfo(logoSrc).catch(() => null);

  records.forEach((record, pageIdx) => {
    if (pageIdx > 0) {
      doc.addPage();
    }

    const comp = record.companyInfo || globalCompanyInfo || {};
    const employerName =
      options.companyName ||
      record.companyName ||
      comp.name ||
      'RR Security & Facilities';

    const employerAddress =
      options.companyAddress ||
      record.companyAddress ||
      comp.address ||
      'G-75/A Block-G M.B. Extn Badarpur New Delhi Delhi 110044 India';

    const employeeName = record.name || record.employeeName || '—';
    const employeeId = record.employeeId || record.employeeCode || '—';
    const employeeAddress =
      record.address ||
      record.presentAddress ||
      record.permanentAddress ||
      '—';

    const date =
      record.date ||
      new Date().toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });

    const b = record.salaryBreakup || {};
    const basicM = b.basic?.monthly ?? Number(record.basic || 0);
    const basicA = b.basic?.annual ?? basicM * 12;

    const hraM = b.hra?.monthly ?? Number(record.hra || 0);
    const hraA = b.hra?.annual ?? hraM * 12;

    const convM = b.conveyance?.monthly ?? Number(record.conveyance || 0);
    const convA = b.conveyance?.annual ?? convM * 12;

    const fixedM = b.fixed?.monthly ?? 0;
    const fixedA = b.fixed?.annual ?? fixedM * 12;

    const otM = b.overtime?.monthly ?? 0;
    const otA = b.overtime?.annual ?? otM * 12;

    const totalM = b.total?.monthly ?? (record.monthlyCtc || basicM + hraM + convM + fixedM + otM);
    const totalA = b.total?.annual ?? (record.annualCtc || totalM * 12);

    let curY = 46;

    // 1. Top Company Header (Name & Address on Left, Logo on Right)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13.5);
    doc.setTextColor(30, 41, 59);
    doc.text(employerName, marginX, curY);

    curY += 14;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(71, 85, 105);
    const splitAddr = doc.splitTextToSize(employerAddress, contentWidth - 110);
    doc.text(splitAddr, marginX, curY);

    // Draw logo if available
    if (logoInfo?.dataUrl) {
      try {
        const logoW = 85;
        const logoH = 36;
        doc.addImage(
          logoInfo.dataUrl,
          logoInfo.format || 'PNG',
          marginX + contentWidth - logoW,
          40,
          logoW,
          logoH
        );
      } catch {
        // ignore image error
      }
    }

    curY = Math.max(curY + splitAddr.length * 10 + 12, 86);

    // Header divider line
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(1);
    doc.line(marginX, curY, marginX + contentWidth, curY);

    curY += 28;

    // 2. Document Title: SALARY CERTIFICATE
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(15, 23, 42);
    doc.text('SALARY CERTIFICATE', marginX, curY);

    curY += 24;

    // 3. Sub-bar: To Whom it may concern & Date
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(30, 41, 59);
    doc.text('To Whom it may concern', marginX, curY);
    doc.text(`Date: ${date}`, marginX + contentWidth, curY, { align: 'right' });

    curY += 22;

    // 4. Certification Statement
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.2);
    doc.setTextColor(30, 41, 59);

    const statement = `This is to certify that ${employeeName} (Employee ID: ${employeeId}), residing at ${employeeAddress}, is working at ${employerName} and is earning Rs. ${formatAmount(totalA)} as CTC annually. The salary break-up is as given below:`;
    const splitStatement = doc.splitTextToSize(statement, contentWidth);
    doc.text(splitStatement, marginX, curY);

    curY += splitStatement.length * 13 + 14;

    // 5. Salary Breakup Table
    autoTable(doc, {
      startY: curY,
      margin: { left: marginX, right: marginX },
      theme: 'plain',
      styles: {
        fontSize: 9,
        textColor: [30, 41, 59],
        cellPadding: { top: 7.5, bottom: 7.5, left: 4, right: 4 },
        lineColor: [203, 213, 225],
        lineWidth: 0,
        valign: 'middle',
      },
      headStyles: {
        fontStyle: 'bold',
        fontSize: 8.5,
        textColor: [51, 65, 85],
        cellPadding: { top: 8, bottom: 8, left: 4, right: 4 },
        lineColor: [203, 213, 225],
        lineWidth: { top: 1, bottom: 1 },
      },
      columnStyles: {
        0: { cellWidth: contentWidth * 0.5 },
        1: { cellWidth: contentWidth * 0.25, halign: 'right' },
        2: { cellWidth: contentWidth * 0.25, halign: 'right' },
      },
      head: [['EARNINGS', 'MONTHLY AMOUNT', 'ANNUAL AMOUNT']],
      body: [
        ['Basic', `Rs. ${formatAmount(basicM)}`, `Rs. ${formatAmount(basicA)}`],
        ['House Rent Allowance', `Rs. ${formatAmount(hraM)}`, `Rs. ${formatAmount(hraA)}`],
        ['Conveyance Allowance', `Rs. ${formatAmount(convM)}`, `Rs. ${formatAmount(convA)}`],
        ['Fixed Allowance', `Rs. ${formatAmount(fixedM)}`, `Rs. ${formatAmount(fixedA)}`],
        ['Overtime Allowance', `Rs. ${formatAmount(otM)}`, `Rs. ${formatAmount(otA)}`],
        ['TOTAL CTC', `Rs. ${formatAmount(totalM)}`, `Rs. ${formatAmount(totalA)}`],
      ],
      didParseCell: (data) => {
        if (data.section === 'body' && data.row.index === 5) {
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.lineWidth = { top: 1, bottom: 1 };
          data.cell.styles.lineColor = [203, 213, 225];
        }
      },
      didDrawPage: (data) => {
        curY = data.cursor.y;
      },
    });

    curY += 28;

    // 6. Confirmation Statement
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.2);
    doc.setTextColor(51, 65, 85);
    const confirmText =
      'We hereby confirm that all the above details provided are as per our records, This certificate is being issued upon the request of the above employee for whatever legal purpose it may serve them best.';
    const splitConfirm = doc.splitTextToSize(confirmText, contentWidth);
    doc.text(splitConfirm, marginX, curY);

    curY += splitConfirm.length * 13 + 55;

    // 7. Signatory Block
    const rightX = marginX + contentWidth;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(30, 41, 59);
    doc.text(`For ${employerName}`, rightX, curY, { align: 'right' });

    curY += 36;
    doc.setDrawColor(71, 85, 105);
    doc.setLineWidth(0.8);
    doc.line(rightX - 170, curY, rightX, curY);

    curY += 12;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('Authorized Signatory', rightX, curY, { align: 'right' });
  });

  // Action based on mode
  if (mode === 'print') {
    doc.autoPrint();
    const blobUrl = doc.output('bloburl');
    const printWindow = window.open(blobUrl, '_blank');
    if (printWindow) {
      printWindow.focus();
    }
  } else {
    const singleRec = records[0];
    const empPart =
      records.length === 1 && singleRec?.name
        ? `_${singleRec.name.replace(/\s+/g, '_')}_${singleRec.employeeId || 'EMP'}`
        : `_All_Employees`;
    const filename = options.filename || `Salary_Certificate${empPart}.pdf`;
    doc.save(filename);
  }
}

export default downloadSalaryCertificatePdf;
