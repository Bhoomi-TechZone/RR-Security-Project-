import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

/**
 * Format currency with Indian comma separators
 */
function formatINR(val) {
  const num = Math.round(Number(val) || 0);
  return num.toLocaleString('en-IN');
}

/**
 * Export Bank Transfer Report to Excel (.xlsx)
 * Exactly matches columns and layout from reference Image 1:
 * Remitter_Account_No | Remitter_Name | IFSC_Code | Amount | Bank_Account_Number | Beneficiary_Name | Beneficiary LEI Code
 */
export function downloadBankTransferReportExcel(
  remitterInfo = {},
  records = [],
  period = {},
  options = {}
) {
  const defaultRemitterAcc = remitterInfo?.remitterAccountNo || '50200094608378';
  const defaultRemitterName = (remitterInfo?.remitterName || 'RR SECURITY AND FACILITIES').toUpperCase();
  const salaryMonth = period?.salaryMonth || '9-2026';

  const wb = XLSX.utils.book_new();

  // Exactly matching columns from Image 1
  const headers = [
    'Remitter_Account_No',
    'Remitter_Name',
    'IFSC_Code',
    'Amount',
    'Bank_Account_Number',
    'Beneficiary_Name',
    'Beneficiary LEI Code',
  ];

  const rows = [headers];

  records.forEach((r) => {
    rows.push([
      String(r.remitterAccountNo || defaultRemitterAcc),
      String(r.remitterName || defaultRemitterName),
      String(r.ifscCode || r.ifsc || 'SBIN0006776').toUpperCase(),
      Number(r.amount || r.netSalary || 0),
      String(r.bankAccountNumber || r.accountNumber || ''),
      String(r.beneficiaryName || r.employeeName || '').toUpperCase(),
      String(r.beneficiaryLeiCode || r.leiCode || ''),
    ]);
  });

  const ws = XLSX.utils.aoa_to_sheet(rows);

  // Set explicit column widths matching bank layout
  ws['!cols'] = [
    { wch: 22 }, // Remitter_Account_No
    { wch: 30 }, // Remitter_Name
    { wch: 15 }, // IFSC_Code
    { wch: 12 }, // Amount
    { wch: 24 }, // Bank_Account_Number
    { wch: 26 }, // Beneficiary_Name
    { wch: 20 }, // Beneficiary LEI Code
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Bank Transfer Report');

  const filename = `Bank_Transfer_Report_${salaryMonth.replace('-', '_')}.xlsx`;
  XLSX.writeFile(wb, filename);
}

/**
 * Export Bank Transfer Report to CSV (.csv) for direct corporate banking portal upload
 */
export function downloadBankTransferReportCsv(
  remitterInfo = {},
  records = [],
  period = {}
) {
  const defaultRemitterAcc = remitterInfo?.remitterAccountNo || '50200094608378';
  const defaultRemitterName = (remitterInfo?.remitterName || 'RR SECURITY AND FACILITIES').toUpperCase();
  const salaryMonth = period?.salaryMonth || '9-2026';

  const headers = [
    'Remitter_Account_No',
    'Remitter_Name',
    'IFSC_Code',
    'Amount',
    'Bank_Account_Number',
    'Beneficiary_Name',
    'Beneficiary LEI Code',
  ];

  const escapeCsv = (val) => {
    if (val === null || val === undefined) return '';
    const str = String(val);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const lines = [headers.join(',')];

  records.forEach((r) => {
    lines.push([
      escapeCsv(r.remitterAccountNo || defaultRemitterAcc),
      escapeCsv(r.remitterName || defaultRemitterName),
      escapeCsv((r.ifscCode || r.ifsc || 'SBIN0006776').toUpperCase()),
      Number(r.amount || r.netSalary || 0),
      escapeCsv(r.bankAccountNumber || r.accountNumber || ''),
      escapeCsv((r.beneficiaryName || r.employeeName || '').toUpperCase()),
      escapeCsv(r.beneficiaryLeiCode || r.leiCode || ''),
    ].join(','));
  });

  const blob = new Blob([lines.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Bank_Transfer_Report_${salaryMonth.replace('-', '_')}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Download or Print Bank Transfer Report PDF
 * Landscape layout matching the corporate bank transfer report format
 */
export async function downloadBankTransferReportPdf(
  remitterInfo = {},
  records = [],
  period = {},
  totals = {},
  companyInfo = {},
  options = {}
) {
  const mode = options.mode || 'download';
  const defaultRemitterAcc = remitterInfo?.remitterAccountNo || '50200094608378';
  const defaultRemitterName = (remitterInfo?.remitterName || companyInfo?.name || 'RR SECURITY AND FACILITIES').toUpperCase();
  const salaryMonth = period?.salaryMonth || '9-2026';
  const salaryMonthLabel = period?.monthLabel || 'September 2026';

  const totalAmount = totals?.totalAmount ?? records.reduce((acc, r) => acc + (Number(r.amount || r.netSalary) || 0), 0);
  const totalBeneficiaries = records.length;

  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'pt',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 841.89 pt
  const pageHeight = doc.internal.pageSize.getHeight(); // 595.28 pt
  const marginX = 40;
  let currentY = 36;

  // Header Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(24, 43, 73);
  doc.text(defaultRemitterName, marginX, currentY);

  currentY += 16;
  doc.setFontSize(11);
  doc.setTextColor(37, 99, 235);
  doc.text('BANK TRANSFER REPORT — CORPORATE BULK SALARY DISBURSEMENT', marginX, currentY);

  currentY += 14;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text(
    `Remitter A/c: ${defaultRemitterAcc}  |  Month: ${salaryMonthLabel} (${salaryMonth})  |  Beneficiaries: ${totalBeneficiaries}  |  Total Amount: Rs.${formatINR(totalAmount)}`,
    marginX,
    currentY
  );

  currentY += 12;

  // AutoTable matching the exact Image 1 columns
  const tableColumns = [
    { header: 'Remitter_Account_No', dataKey: 'remitterAccountNo' },
    { header: 'Remitter_Name', dataKey: 'remitterName' },
    { header: 'IFSC_Code', dataKey: 'ifscCode' },
    { header: 'Amount (₹)', dataKey: 'amount' },
    { header: 'Bank_Account_Number', dataKey: 'bankAccountNumber' },
    { header: 'Beneficiary_Name', dataKey: 'beneficiaryName' },
    { header: 'Beneficiary LEI Code', dataKey: 'beneficiaryLeiCode' },
  ];

  const tableRows = records.map((r) => ({
    remitterAccountNo: String(r.remitterAccountNo || defaultRemitterAcc),
    remitterName: String(r.remitterName || defaultRemitterName),
    ifscCode: String(r.ifscCode || r.ifsc || '—').toUpperCase(),
    amount: formatINR(r.amount || r.netSalary || 0),
    bankAccountNumber: String(r.bankAccountNumber || r.accountNumber || '—'),
    beneficiaryName: String(r.beneficiaryName || r.employeeName || '—').toUpperCase(),
    beneficiaryLeiCode: String(r.beneficiaryLeiCode || r.leiCode || '—'),
  }));

  autoTable(doc, {
    startY: currentY,
    columns: tableColumns,
    body: tableRows,
    theme: 'grid',
    styles: {
      fontSize: 8.5,
      cellPadding: 4,
      lineColor: [203, 213, 225],
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
      remitterAccountNo: { halign: 'center', cellWidth: 105, fontStyle: 'bold' },
      remitterName: { halign: 'left', cellWidth: 155 },
      ifscCode: { halign: 'center', cellWidth: 85, fontStyle: 'bold' },
      amount: { halign: 'right', cellWidth: 70, fontStyle: 'bold', textColor: [22, 101, 52] },
      bankAccountNumber: { halign: 'center', cellWidth: 125, fontStyle: 'bold' },
      beneficiaryName: { halign: 'left', cellWidth: 140, fontStyle: 'bold' },
      beneficiaryLeiCode: { halign: 'center', cellWidth: 75 },
    },
    foot: [
      [
        { content: 'TOTAL DISBURSEMENT', colSpan: 3, styles: { halign: 'right', fontStyle: 'bold', fontSize: 9 } },
        { content: `₹${formatINR(totalAmount)}`, styles: { halign: 'right', fontStyle: 'bold', fontSize: 9, textColor: [22, 101, 52] } },
        { content: `${totalBeneficiaries} Accounts`, colSpan: 3, styles: { halign: 'center', fontStyle: 'bold', fontSize: 9 } },
      ],
    ],
    footStyles: {
      fillColor: [241, 245, 249],
      lineColor: [148, 163, 184],
      lineWidth: 1,
    },
    didDrawPage: (data) => {
      const pageCount = doc.internal.getNumberOfPages();
      doc.setFontSize(8);
      doc.setTextColor(140, 140, 140);
      doc.text(
        `Page ${data.pageNumber} of ${pageCount}  |  ${defaultRemitterName} — Corporate Bank Transfer Advice`,
        marginX,
        pageHeight - 20
      );
    },
  });

  const filename = `Bank_Transfer_Report_${salaryMonth.replace('-', '_')}.pdf`;

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
