import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Format currency amount with two decimal places
 */
function formatAmount(val) {
  const num = Number(val) || 0;
  const isNegative = num < 0;
  const absVal = Math.abs(num);

  const formatted = absVal.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return isNegative ? `-${formatted}` : formatted;
}

/**
 * Generate and download or print Form 16 Part B PDF
 *
 * @param {Object|Array} inputRecord - Single record or array of records
 * @param {Object} globalCompanyInfo - Fallback company details
 * @param {Object} globalPeriod - Period metadata (FY / AY)
 * @param {Object} options - { mode: 'download' | 'print', filename: string }
 */
export async function downloadForm16Pdf(
  inputRecord,
  globalCompanyInfo = {},
  globalPeriod = {},
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
  const pageHeight = doc.internal.pageSize.getHeight(); // 841.89 pt
  const marginX = 40;
  const contentWidth = pageWidth - marginX * 2; // ~515 pt

  records.forEach((record, pageIdx) => {
    if (pageIdx > 0) {
      doc.addPage();
    }

    // Dynamic Employer details resolution
    const comp = record.companyInfo || globalCompanyInfo || {};
    const employerName =
      options.companyName || record.companyName || comp.name || 'RR SECURITY & FACILITIES';
    const employerAddress =
      options.companyAddress ||
      record.companyAddress ||
      comp.address ||
      'G-75/A Street No 04 Block-G M.B. Extn.,\nBadarpur, New Delhi-110044';

    const employeeName = record.name || record.employeeName || '—';
    const employeePan = record.pan
      ? record.pan.toLowerCase().startsWith('pan')
        ? record.pan
        : `Pan: ${record.pan}`
      : 'Pan: N/A';

    const financialYear = record.financialYear || globalPeriod?.financialYear || '2025-2026';
    const assessmentYear = record.assessmentYear || globalPeriod?.assessmentYear || '2026-2027';

    const particulars = record.particulars || {};
    const grossSalary = particulars.grossSalary ?? 0;
    const standardDeduction = particulars.standardDeduction ?? -50000;
    const totalTaxableIncome =
      particulars.totalTaxableIncome ?? Math.max(0, grossSalary + standardDeduction);
    const totalTaxPayable = particulars.totalTaxPayable ?? 0;
    const totalTdsRemitted = particulars.totalTdsRemitted ?? 0;

    const certification = record.certification || {};
    const certDate = certification.date || new Date().toLocaleDateString('en-GB');
    const certPlace = certification.place || comp.city || 'Head Office';

    let curY = 50;

    // 1. Header Titles
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text('FORM NO. 16 - PART B', pageWidth / 2, curY, { align: 'center' });

    curY += 15;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(20, 20, 20);
    const subText =
      '[See rule 31(1)(a)] Certificate under section 203 of the Income-tax Act, 1961 for tax deducted at source from income chargeable under the head "Salaries"';
    const splitSub = doc.splitTextToSize(subText, contentWidth);
    doc.text(splitSub, pageWidth / 2, curY, { align: 'center' });

    curY += splitSub.length * 10 + 6;

    // Horizontal Line across
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(2);
    doc.line(marginX, curY, marginX + contentWidth, curY);

    curY += 16;

    // Underlined Section Header
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(0, 0, 0);
    const secTitle = 'DETAILS OF SALARY PAID AND ANY OTHER INCOME AND TAX DEDUCTED';
    doc.text(secTitle, pageWidth / 2, curY, { align: 'center' });
    const secWidth = doc.getTextWidth(secTitle);
    doc.setLineWidth(0.8);
    doc.line(pageWidth / 2 - secWidth / 2, curY + 2, pageWidth / 2 + secWidth / 2, curY + 2);

    curY += 14;

    // 2. Information Table (4-Quadrant)
    const empDetailsText = `${employeeName}\n${employeePan}${record.address ? '\n' + record.address : ''}`;

    autoTable(doc, {
      startY: curY,
      margin: { left: marginX, right: marginX },
      theme: 'plain',
      tableLineColor: [0, 0, 0],
      tableLineWidth: 1.5,
      styles: {
        fontSize: 8.5,
        textColor: [0, 0, 0],
        lineColor: [0, 0, 0],
        lineWidth: 1,
        cellPadding: 6,
        valign: 'top',
        overflow: 'linebreak',
      },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 125 },
        1: { cellWidth: 175 },
        2: { fontStyle: 'bold', cellWidth: 105 },
        3: { cellWidth: 110 },
      },
      body: [
        [
          'Employer Name &\nAddress',
          `${employerName}\n${employerAddress}`,
          'Employee Name &\nAddress',
          empDetailsText,
        ],
        [
          'Financial Year',
          financialYear,
          'Assessment Year',
          assessmentYear,
        ],
      ],
      didDrawPage: (data) => {
        curY = data.cursor.y;
      },
    });

    curY += 14;

    // 3. Particulars & Amounts Table
    autoTable(doc, {
      startY: curY,
      margin: { left: marginX, right: marginX },
      theme: 'plain',
      tableLineColor: [0, 0, 0],
      tableLineWidth: 1.5,
      headStyles: {
        fontStyle: 'bold',
        fontSize: 9,
        textColor: [0, 0, 0],
        lineColor: [0, 0, 0],
        lineWidth: 1,
        cellPadding: 6,
      },
      styles: {
        fontSize: 8.5,
        textColor: [0, 0, 0],
        lineColor: [0, 0, 0],
        lineWidth: 1,
        cellPadding: 5.5,
      },
      columnStyles: {
        0: { cellWidth: 385 },
        1: { cellWidth: 130, halign: 'right' },
      },
      head: [['Category / Particulars', 'Amount (₹)']],
      body: [
        [
          '1. Gross Salary (as per provisions contained in section 17(1))',
          formatAmount(grossSalary),
        ],
        [
          '2. Less: Standard Deduction u/s 16(ia)',
          formatAmount(standardDeduction),
        ],
        [
          '3. Total Taxable Income Chargeable under "Salaries"',
          formatAmount(totalTaxableIncome),
        ],
        [
          '4. Total Tax Payable / Net Tax Liability',
          formatAmount(totalTaxPayable),
        ],
        [
          '5. Total Tax Deducted at Source (TDS Remitted)',
          formatAmount(totalTdsRemitted),
        ],
      ],
      didParseCell: (data) => {
        if (data.section === 'body' && (data.row.index === 2 || data.row.index === 4)) {
          data.cell.styles.fontStyle = 'bold';
        }
      },
      didDrawPage: (data) => {
        curY = data.cursor.y;
      },
    });

    curY += 24;

    // 4. Certification Statement
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.8);
    doc.setTextColor(0, 0, 0);

    const certText = `I, ${employerName}, working in the capacity of Employer, do hereby certify that a sum of Rs. ${formatAmount(totalTdsRemitted)} has been deducted at source and paid to the credit of the Central Government.`;
    const splitCert = doc.splitTextToSize(certText, contentWidth);
    doc.text(splitCert, marginX, curY);

    curY += splitCert.length * 12 + 36;

    // 5. Footer & Signature Block
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(0, 0, 0);

    // Left
    doc.text(`Date: ${certDate}`, marginX, curY);
    doc.text(`Place: ${certPlace}`, marginX, curY + 12);

    // Right Signature
    const rightX = marginX + contentWidth;
    doc.setLineWidth(1);
    doc.line(rightX - 220, curY - 2, rightX, curY - 2);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.8);
    doc.text('Signature of Person Responsible for Deduction', rightX, curY + 12, {
      align: 'right',
    });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text('Designation: Authorized Signatory', rightX, curY + 23, { align: 'right' });
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
    const empPart = records.length === 1 && singleRec?.name
      ? `_${singleRec.name.replace(/\s+/g, '_')}_${singleRec.employeeId || 'EMP'}`
      : `_All_Employees`;
    const filename = options.filename || `Form_16_Part_B${empPart}.pdf`;
    doc.save(filename);
  }
}
