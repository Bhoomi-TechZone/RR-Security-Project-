import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

/**
 * Format currency with Indian Comma separators
 */
function formatINR(val) {
  const num = Math.round(Number(val) || 0);
  return num.toLocaleString('en-IN');
}

/**
 * Download or Print official Bank Transfer Letter PDF
 * Matches exact format from user reference:
 * - Date
 * - To The Manager, Bank Name, Branch
 * - SUB : TRANSFER OF FUNDS TO SALARY ACCOUNT
 * - Dear Sir, Cheque details, Amount in words, Salary month
 * - For Company Name, AUTHORISED SIGNATORY, Enclosures
 * - Page 2+: Attached List of Beneficiary Account Holders
 */
export async function downloadBankTransferLetterPdf(
  letterData = {},
  records = [],
  companyInfo = {},
  options = {}
) {
  const mode = options.mode || 'download';
  const info = letterData || {};
  const comp = companyInfo || {};

  const companyName = (info.companyName || comp.name || 'RR SECURITY AND FACILITIES').toUpperCase();
  const companyAddress = comp.address || 'G-75/A, Ground Floor, Block-G, M.B. EXTN., Badarpur New Delhi-110044';
  const companyPhone = comp.phone || '9891325151, 9891325252';
  const companyEmail = comp.email || 'Office.rrsf@gmail.com';

  const letterDate = info.letterDate || '07/10/2026';
  const recipientTitle = info.recipientTitle || 'The Manager';
  const bankName = (info.bankName || 'HDFC BANK').toUpperCase();
  const bankBranch = info.bankBranch || 'Mohan Estate New Delhi';
  const subject = info.subject || 'TRANSFER OF FUNDS TO SALARY ACCOUNT';
  const chequeNo = info.chequeNo || '000040';
  const chequeDate = info.chequeDate || letterDate;
  const totalAmount = Math.round(Number(info.totalAmount || 0));
  const totalAmountFormatted = `Rs.${totalAmount}`;
  const totalAmountWords = info.totalAmountWords || 'Zero Only';
  const salaryMonth = info.salaryMonth || '9-2026';
  const salaryMonthLabel = info.salaryMonthLabel || 'September 2026';
  const signatory = info.signatory || 'AUTHORISED SIGNATORY';

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 595.28 pt
  const pageHeight = doc.internal.pageSize.getHeight(); // 841.89 pt
  const marginX = 54; // 0.75 in
  let currentY = 50;

  // --- Official Company Header / Letterhead ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(24, 43, 73);
  doc.text(companyName, marginX, currentY);

  currentY += 15;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  doc.text(companyAddress, marginX, currentY);

  currentY += 13;
  doc.text(`Phone: ${companyPhone}  |  Email: ${companyEmail}`, marginX, currentY);

  currentY += 10;
  doc.setDrawColor(37, 99, 235);
  doc.setLineWidth(1.5);
  doc.line(marginX, currentY, pageWidth - marginX, currentY);

  currentY += 28;

  // --- Date ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(20, 20, 20);
  doc.text(`Date ${letterDate}`, marginX, currentY);

  currentY += 26;

  // --- Recipient Block ---
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(30, 30, 30);
  doc.text('To,', marginX, currentY);
  currentY += 16;
  doc.text(recipientTitle, marginX, currentY);
  currentY += 16;
  doc.setFont('helvetica', 'bold');
  doc.text(bankName, marginX, currentY);
  currentY += 16;
  doc.setFont('helvetica', 'normal');
  doc.text(bankBranch, marginX, currentY);

  currentY += 34;

  // --- Subject ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text(`SUB : ${subject}`, marginX, currentY);

  currentY += 30;

  // --- Salutation ---
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.text('Dear Sir,', marginX, currentY);

  currentY += 24;

  // --- Body Paragraph ---
  const bodyLine1 = `We are enclosing herewith our Cheque No.${chequeNo} dt. ${chequeDate} for ${totalAmountFormatted}`;
  doc.text(bodyLine1, marginX, currentY);

  currentY += 20;
  const wordsLine = `( Rupees ${totalAmountWords} )`;
  doc.setFont('helvetica', 'bold');
  doc.text(wordsLine, marginX, currentY);

  currentY += 22;
  doc.setFont('helvetica', 'normal');
  const bodyLine2 = `Salary for the month of ${salaryMonth} Please credit the saving accounts as per list`;
  doc.text(bodyLine2, marginX, currentY);

  currentY += 18;
  doc.text('Enclosed', marginX, currentY);

  currentY += 30;

  // --- Complimentary Close ---
  doc.text('Thanking you,', marginX, currentY);
  currentY += 20;
  doc.text('Yours faithfully,', marginX, currentY);
  currentY += 20;
  doc.setFont('helvetica', 'bold');
  doc.text(`For ${companyName}`, marginX, currentY);

  // Signature gap
  currentY += 56;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.text(signatory, marginX, currentY);

  currentY += 32;

  // --- Enclosures ---
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text('Encls:', marginX, currentY);
  currentY += 14;
  doc.text('  1) Cheque', marginX, currentY);
  currentY += 14;
  doc.text('  2) List of Account Holders', marginX, currentY);

  // --- Page 2+: Attached List of Beneficiary Account Holders ---
  if (Array.isArray(records) && records.length > 0) {
    doc.addPage();

    let page2Y = 40;

    // Header on Annexure page
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(24, 43, 73);
    doc.text(companyName, marginX, page2Y);

    page2Y += 16;
    doc.setFontSize(11);
    doc.setTextColor(37, 99, 235);
    doc.text('ANNEXURE — LIST OF BENEFICIARY ACCOUNT HOLDERS (SALARY DISBURSEMENT)', marginX, page2Y);

    page2Y += 14;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(90, 90, 90);
    doc.text(`Salary Month: ${salaryMonthLabel} (${salaryMonth})  |  Bank: ${bankName}  |  Cheque No: ${chequeNo} dt. ${chequeDate}`, marginX, page2Y);

    page2Y += 12;

    const tableColumns = [
      { header: 'Sr.', dataKey: 'srNo' },
      { header: 'Emp ID', dataKey: 'employeeId' },
      { header: 'Employee Name', dataKey: 'employeeName' },
      { header: 'Designation', dataKey: 'designation' },
      { header: 'Bank Name', dataKey: 'bankName' },
      { header: 'Saving A/c No.', dataKey: 'accountNumber' },
      { header: 'IFSC Code', dataKey: 'ifsc' },
      { header: 'Net Amount (₹)', dataKey: 'netSalary' },
    ];

    const tableRows = records.map((r, idx) => ({
      srNo: idx + 1,
      employeeId: r.employeeCode || r.employeeId || '—',
      employeeName: (r.employeeName || 'EMPLOYEE').toUpperCase(),
      designation: r.designation || 'Staff',
      bankName: r.bankName || bankName,
      accountNumber: r.accountNumber || '—',
      ifsc: r.ifsc || '—',
      netSalary: `₹${formatINR(r.netSalary || 0)}`,
    }));

    autoTable(doc, {
      startY: page2Y,
      columns: tableColumns,
      body: tableRows,
      theme: 'grid',
      styles: {
        fontSize: 8.5,
        cellPadding: 4,
        lineColor: [200, 205, 215],
        lineWidth: 0.5,
        textColor: [30, 41, 59],
        overflow: 'linebreak',
      },
      headStyles: {
        fillColor: [30, 58, 138],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8.5,
        halign: 'center',
      },
      columnStyles: {
        srNo: { halign: 'center', cellWidth: 26 },
        employeeId: { halign: 'center', cellWidth: 50 },
        employeeName: { halign: 'left', cellWidth: 100, fontStyle: 'bold' },
        designation: { halign: 'left', cellWidth: 65 },
        bankName: { halign: 'left', cellWidth: 70 },
        accountNumber: { halign: 'center', cellWidth: 85, fontStyle: 'bold' },
        ifsc: { halign: 'center', cellWidth: 50 },
        netSalary: { halign: 'right', cellWidth: 60, fontStyle: 'bold', textColor: [22, 101, 52] },
      },
      foot: [
        [
          { content: 'GRAND TOTAL', colSpan: 7, styles: { halign: 'right', fontStyle: 'bold', fontSize: 9 } },
          { content: `₹${formatINR(totalAmount)}`, styles: { halign: 'right', fontStyle: 'bold', fontSize: 9, textColor: [22, 101, 52] } },
        ],
      ],
      footStyles: {
        fillColor: [241, 245, 249],
        lineColor: [148, 163, 184],
        lineWidth: 1,
      },
      didDrawPage: (data) => {
        // Page footer on annexure
        const pageCount = doc.internal.getNumberOfPages();
        doc.setFontSize(8);
        doc.setTextColor(140, 140, 140);
        doc.text(
          `Page ${data.pageNumber} of ${pageCount}  |  For ${companyName} — Authorized Signatory`,
          marginX,
          pageHeight - 20
        );
      },
    });
  }

  const filename = `Bank_Transfer_Letter_${salaryMonth.replace('-', '_')}_${chequeNo}.pdf`;

  if (mode === 'print') {
    const pdfBlob = doc.output('blob');
    const blobUrl = URL.createObjectURL(pdfBlob);
    const printWindow = window.open(blobUrl, '_blank');
    if (printWindow) {
      printWindow.onload = () => {
        printWindow.focus();
        printWindow.print();
      };
    }
    return;
  }

  doc.save(filename);
}

/**
 * Download Bank Transfer Letter & Beneficiaries Excel Spreadsheet
 */
export function downloadBankTransferLetterExcel(
  letterData = {},
  records = [],
  companyInfo = {},
  options = {}
) {
  const info = letterData || {};
  const comp = companyInfo || {};
  const companyName = (info.companyName || comp.name || 'RR SECURITY AND FACILITIES').toUpperCase();
  const bankName = (info.bankName || 'HDFC BANK').toUpperCase();
  const chequeNo = info.chequeNo || '000040';
  const chequeDate = info.chequeDate || '07/10/2026';
  const totalAmount = Math.round(Number(info.totalAmount || 0));
  const salaryMonth = info.salaryMonth || '9-2026';

  const wb = XLSX.utils.book_new();

  // Sheet 1: Bank Advice Letter Summary
  const letterSummaryRows = [
    [companyName],
    ['OFFICIAL BANK TRANSFER ADVICE LETTER'],
    [],
    ['Date', info.letterDate || '07/10/2026'],
    ['To', info.recipientTitle || 'The Manager'],
    ['Bank Name', bankName],
    ['Branch', info.bankBranch || 'Mohan Estate New Delhi'],
    ['Subject', info.subject || 'TRANSFER OF FUNDS TO SALARY ACCOUNT'],
    [],
    ['Cheque No.', chequeNo],
    ['Cheque Date', chequeDate],
    ['Total Amount (Rs.)', totalAmount],
    ['Amount in Words', info.totalAmountWords || ''],
    ['Salary Month', salaryMonth],
    ['Total Beneficiaries', records.length],
    [],
    ['Authorized Signatory', companyName],
  ];

  const wsLetter = XLSX.utils.aoa_to_sheet(letterSummaryRows);
  XLSX.utils.book_append_sheet(wb, wsLetter, 'Transfer Advice');

  // Sheet 2: Detailed Account Holders Schedule
  const scheduleRows = [
    [companyName],
    [`SALARY DISBURSEMENT BENEFICIARY SCHEDULE - ${salaryMonth}`],
    [`Cheque No: ${chequeNo} dt. ${chequeDate}  |  Bank: ${bankName}  |  Total Amount: Rs.${totalAmount}`],
    [],
    [
      'Sr. No.',
      'Employee ID',
      'Employee Name',
      'Designation',
      'Department',
      'Client / Site',
      'Bank Name',
      'Saving Account Number',
      'IFSC Code',
      'Net Salary (Rs.)',
      'Status',
    ],
  ];

  records.forEach((r, idx) => {
    scheduleRows.push([
      idx + 1,
      r.employeeCode || r.employeeId || '',
      r.employeeName || '',
      r.designation || '',
      r.department || '',
      r.clientName || '',
      r.bankName || bankName,
      r.accountNumber || '',
      r.ifsc || '',
      Number(r.netSalary || 0),
      r.status || 'Processed',
    ]);
  });

  scheduleRows.push([]);
  scheduleRows.push(['', '', '', '', '', '', '', '', 'GRAND TOTAL', totalAmount, '']);

  const wsSchedule = XLSX.utils.aoa_to_sheet(scheduleRows);
  XLSX.utils.book_append_sheet(wb, wsSchedule, 'Account Holders List');

  const filename = `Bank_Transfer_Report_${salaryMonth.replace('-', '_')}.xlsx`;
  XLSX.writeFile(wb, filename);
}

/**
 * Download Bank Transfer Letter as Word (.doc) Document
 */
export function downloadBankTransferLetterWord(
  letterData = {},
  records = [],
  companyInfo = {}
) {
  const info = letterData || {};
  const comp = companyInfo || {};
  const companyName = (info.companyName || comp.name || 'RR SECURITY AND FACILITIES').toUpperCase();
  const companyAddress = comp.address || 'G-75/A, Ground Floor, Block-G, M.B. EXTN., Badarpur New Delhi-110044';
  const letterDate = info.letterDate || '07/10/2026';
  const chequeNo = info.chequeNo || '000040';
  const chequeDate = info.chequeDate || letterDate;
  const totalAmount = Math.round(Number(info.totalAmount || 0));
  const totalAmountWords = info.totalAmountWords || 'Zero Only';
  const salaryMonth = info.salaryMonth || '9-2026';

  let tableHtml = '';
  if (Array.isArray(records) && records.length > 0) {
    const rowsHtml = records
      .map(
        (r, idx) => `
      <tr>
        <td style="border: 1px solid #ccc; padding: 6px; text-align: center;">${idx + 1}</td>
        <td style="border: 1px solid #ccc; padding: 6px; text-align: center;">${r.employeeCode || r.employeeId}</td>
        <td style="border: 1px solid #ccc; padding: 6px;"><b>${r.employeeName}</b></td>
        <td style="border: 1px solid #ccc; padding: 6px;">${r.bankName || info.bankName}</td>
        <td style="border: 1px solid #ccc; padding: 6px; text-align: center; font-weight: bold;">${r.accountNumber}</td>
        <td style="border: 1px solid #ccc; padding: 6px; text-align: center;">${r.ifsc}</td>
        <td style="border: 1px solid #ccc; padding: 6px; text-align: right; font-weight: bold;">₹${formatINR(r.netSalary)}</td>
      </tr>`
      )
      .join('');

    tableHtml = `
      <br style="page-break-before: always;" />
      <h3 style="color: #1e3a8a; margin-bottom: 4px;">ANNEXURE — LIST OF ACCOUNT HOLDERS</h3>
      <p style="color: #555; font-size: 10pt; margin-top: 0;">For Salary Month: ${info.salaryMonthLabel || salaryMonth} | Cheque No: ${chequeNo}</p>
      <table style="width: 100%; border-collapse: collapse; font-family: Arial, sans-serif; font-size: 9.5pt;">
        <thead>
          <tr style="background-color: #1e3a8a; color: white;">
            <th style="border: 1px solid #ccc; padding: 8px;">Sr.</th>
            <th style="border: 1px solid #ccc; padding: 8px;">Emp ID</th>
            <th style="border: 1px solid #ccc; padding: 8px;">Employee Name</th>
            <th style="border: 1px solid #ccc; padding: 8px;">Bank Name</th>
            <th style="border: 1px solid #ccc; padding: 8px;">Saving A/c No.</th>
            <th style="border: 1px solid #ccc; padding: 8px;">IFSC Code</th>
            <th style="border: 1px solid #ccc; padding: 8px;">Net Salary (₹)</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
        <tfoot>
          <tr style="background-color: #f1f5f9; font-weight: bold;">
            <td colspan="6" style="border: 1px solid #ccc; padding: 8px; text-align: right;">GRAND TOTAL</td>
            <td style="border: 1px solid #ccc; padding: 8px; text-align: right; color: #166534;">₹${formatINR(totalAmount)}</td>
          </tr>
        </tfoot>
      </table>
    `;
  }

  const htmlContent = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head><meta charset='utf-8'><title>Bank Transfer Letter</title></head>
    <body style="font-family: Arial, sans-serif; font-size: 11pt; line-height: 1.5; color: #111; margin: 40px;">
      <h2 style="color: #1e3a8a; margin-bottom: 2px;">${companyName}</h2>
      <p style="color: #555; font-size: 9.5pt; margin-top: 0;">${companyAddress}</p>
      <hr style="border: none; border-top: 2px solid #2563eb; margin-bottom: 25px;" />

      <p style="margin-bottom: 20px;"><b>Date ${letterDate}</b></p>

      <p style="margin: 0;">To,</p>
      <p style="margin: 0;">${info.recipientTitle || 'The Manager'}</p>
      <p style="margin: 0; font-weight: bold;">${info.bankName || 'HDFC BANK'}</p>
      <p style="margin: 0 0 25px 0;">${info.bankBranch || 'Mohan Estate New Delhi'}</p>

      <p style="font-weight: bold; margin-bottom: 25px;">SUB : ${info.subject || 'TRANSFER OF FUNDS TO SALARY ACCOUNT'}</p>

      <p style="margin-bottom: 15px;">Dear Sir,</p>

      <p style="margin-bottom: 15px;">
        We are enclosing herewith our Cheque No.<b>${chequeNo}</b> dt. <b>${chequeDate}</b> for <b>Rs.${totalAmount}</b>
      </p>
      <p style="margin-bottom: 15px;">
        ( Rupees <b>${totalAmountWords}</b> )
      </p>
      <p style="margin-bottom: 15px;">
        Salary for the month of <b>${salaryMonth}</b> Please credit the saving accounts as per list
      </p>
      <p style="margin-bottom: 25px;">Enclosed</p>

      <p style="margin-bottom: 15px;">Thanking you,</p>
      <p style="margin-bottom: 15px;">Yours faithfully,</p>
      <p style="font-weight: bold; margin-bottom: 40px;">For ${companyName}</p>

      <p style="font-weight: bold; margin-bottom: 25px;">${info.signatory || 'AUTHORISED SIGNATORY'}</p>

      <p style="margin: 0;">Encls:</p>
      <p style="margin: 0;">&nbsp;&nbsp;1) Cheque</p>
      <p style="margin: 0 0 30px 0;">&nbsp;&nbsp;2) List of Account Holders</p>

      ${tableHtml}
    </body>
    </html>
  `;

  const blob = new Blob(['\ufeff', htmlContent], {
    type: 'application/msword',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Bank_Transfer_Letter_${salaryMonth.replace('-', '_')}.doc`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
