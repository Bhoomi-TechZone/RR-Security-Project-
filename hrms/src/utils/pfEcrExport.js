import * as XLSX from 'xlsx';

/**
 * Statutory EPFO PF ECR (Electronic Challan cum Return) Export Utility
 * Generates exact 11-column Excel (.xlsx) file matching EPFO portal specifications:
 * UAN | MEMBAR_NAME | GROSS_WAGES | EPF_WAGES | EPS_WAGES | EDLI_WAGES | EPF_CONTRI_REMITTED | EPS_CONTRI_REMITTED | EPF_EPS_DIFF_REMITTED | NCP_DAYS | REFUND_OF_ADVANCES
 *
 * NOTE: User explicit requirement: "it should be only in excel it should be like this"
 */
export function downloadPfEcrExcel(reportData = {}) {
  const records = reportData.records || [];
  const monthLabel = reportData.monthLabel || 'Current_Month';

  // 1. Exact 11-Column Header matching uploaded reference image
  const headers = [
    'UAN',
    'MEMBAR_NAME',
    'GROSS_WAGES',
    'EPF_WAGES',
    'EPS_WAGES',
    'EDLI_WAGES',
    'EPF_CONTRI_REMITTED',
    'EPS_CONTRI_REMITTED',
    'EPF_EPS_DIFF_REMITTED',
    'NCP_DAYS',
    'REFUND_OF_ADVANCES',
  ];

  const sheetData = [headers];

  records.forEach((row) => {
    sheetData.push([
      row.uan,
      row.memberName,
      Number(row.grossWages) || 0,
      Number(row.epfWages) || 0,
      Number(row.epsWages) || 0,
      Number(row.edliWages) || 0,
      Number(row.epfContriRemitted) || 0,
      Number(row.epsContriRemitted) || 0,
      Number(row.epfEpsDiffRemitted) || 0,
      Number(row.ncpDays) || 0,
      Number(row.refundOfAdvances) || 0,
    ]);
  });

  const worksheet = XLSX.utils.aoa_to_sheet(sheetData);

  // Set standard column widths so data is neatly aligned
  worksheet['!cols'] = [
    { wch: 15 }, // UAN
    { wch: 24 }, // MEMBAR_NAME
    { wch: 14 }, // GROSS_WAGES
    { wch: 13 }, // EPF_WAGES
    { wch: 13 }, // EPS_WAGES
    { wch: 13 }, // EDLI_WAGES
    { wch: 22 }, // EPF_CONTRI_REMITTED
    { wch: 22 }, // EPS_CONTRI_REMITTED
    { wch: 24 }, // EPF_EPS_DIFF_REMITTED
    { wch: 12 }, // NCP_DAYS
    { wch: 22 }, // REFUND_OF_ADVANCES
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'ECR');

  const safeFilename = `PF_ECR_${String(monthLabel).replace(/[^a-zA-Z0-9]/g, '_')}.xlsx`;
  XLSX.writeFile(workbook, safeFilename);
}
