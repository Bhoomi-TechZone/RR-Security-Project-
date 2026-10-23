import * as XLSX from 'xlsx';

/**
 * Statutory Employee-Wise Monthly PF Report Export Utility
 * Generates exact Excel (.xlsx) file matching statutory enterprise payroll specifications:
 * - Header metadata: Company Name, EMPLOYEE WISE MONTHLY PF REPORT, FOR THE MONTH OF : M,YYYY, Location
 * - 14 Columns: Sr# | Code | UAN | Employee Name | Days | PF Wages | PF (12%) | EPF (3.67%) | EPS (8.33%) | Total | A/C-21 : (0.5%) : | A/C-2: (0.5%) : | A/C-22 (0.0%) : | G.Total
 * - Table Totals
 * - Bottom Account Reconciliation Box:
 *   A/C-1 (12%+3.67%)
 *   A/C-10 (8.33%)
 *   A/C-21 (0.5%)
 *   A/C-2 (0.5%)
 *   A/C-22 (0%)
 *   Total
 *
 * NOTE: User explicit instruction: "it should be in excel only"
 */
export function downloadPfEmployeeWiseExcel(reportData = {}) {
  const records = reportData.records || [];
  const totals = reportData.totals || {};
  const acSummary = reportData.accountSummary || {};
  const companyName = reportData.companyName || 'RR SECURITY & FACILITIES';
  const forMonthString = reportData.forMonthString || '9,2026';
  const locationName = reportData.locationName || 'Petal communication';
  const monthLabel = reportData.monthLabel || 'Current_Month';

  const sheetData = [
    // 1. Company Name
    [companyName],
    // 2. Report Title
    ['EMPLOYEE WISE MONTHLY PF REPORT'],
    // 3. For the Month Of
    [`FOR THE MONTH OF : ${forMonthString}`],
    // 4. Location
    [`Location: ${locationName}`],
    // 5. Empty spacer
    [],
    // 6. Header Row 1
    [
      'Sr#',
      'Code',
      'UAN',
      'Employee Name',
      'Days',
      'PF Wages',
      'PF',
      'EPF',
      'EPS',
      'Total',
      'A/C-21 :',
      'A/C-2:',
      'A/C-22',
      'G.Total'
    ],
    // 7. Header Row 2 (Sub-rates)
    [
      '',
      '',
      '',
      '',
      '',
      '',
      '12%',
      '3.67%',
      '8.33%',
      '',
      '(0.5%) :',
      '(0.5%) :',
      '(0.0%) :',
      ''
    ]
  ];

  // 8. Data Rows
  records.forEach((row, idx) => {
    sheetData.push([
      row.srNo || idx + 1,
      row.code || '',
      row.uan || '',
      row.employeeName || '',
      Number(row.days) || 0,
      Number(row.pfWages) || 0,
      Number(row.pf12) || 0,
      Number(row.epf3_67) || 0,
      Number(row.eps8_33) || 0,
      Number(row.totalEmployer) || 0,
      Number(row.ac21) || 0,
      Number(row.ac2) || 0,
      Number(row.ac22) || 0,
      Number(row.gTotal) || 0,
    ]);
  });

  // 9. Table Total Row
  sheetData.push([
    '',
    '',
    '',
    'Total :',
    records.length,
    Number(totals.totalPfWages) || 0,
    Number(totals.totalPf12) || 0,
    Number(totals.totalEpf3_67) || 0,
    Number(totals.totalEps8_33) || 0,
    Number(totals.totalEmployer) || 0,
    Number(totals.totalAc21) || 0,
    Number(totals.totalAc2) || 0,
    Number(totals.totalAc22) || 0,
    Number(totals.grandTotal) || 0,
  ]);

  // 10. Blank Spacers
  sheetData.push([]);
  sheetData.push([]);

  // 11. Bottom Account Reconciliation Box (matching screenshot)
  sheetData.push(['', '', '', 'A/C-1 (12 %+3.67 %) :', Number(acSummary.ac1) || 0]);
  sheetData.push(['', '', '', 'A/C-10 (8.33 %) :', Number(acSummary.ac10) || 0]);
  sheetData.push(['', '', '', 'A/C-21 (0.5 %) :', Number(acSummary.ac21) || 0]);
  sheetData.push(['', '', '', 'A/C-2 (0.5 %) :', Number(acSummary.ac2) || 0]);
  sheetData.push(['', '', '', 'A/C-22 (0 %) :', Number(acSummary.ac22) || 0]);
  sheetData.push([]);
  sheetData.push(['', '', '', 'Total :', Number(acSummary.total) || 0]);

  const worksheet = XLSX.utils.aoa_to_sheet(sheetData);

  // Column Widths
  worksheet['!cols'] = [
    { wch: 6 },  // Sr#
    { wch: 10 }, // Code
    { wch: 16 }, // UAN
    { wch: 24 }, // Employee Name
    { wch: 8 },  // Days
    { wch: 13 }, // PF Wages
    { wch: 10 }, // PF (12%)
    { wch: 10 }, // EPF (3.67%)
    { wch: 10 }, // EPS (8.33%)
    { wch: 10 }, // Total
    { wch: 14 }, // A/C-21 (0.5%)
    { wch: 14 }, // A/C-2 (0.5%)
    { wch: 14 }, // A/C-22 (0.0%)
    { wch: 12 }, // G.Total
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'EmployeeWise_PF');

  const safeFilename = `PF_Report_Employee_Wise_${String(monthLabel).replace(/[^a-zA-Z0-9]/g, '_')}.xlsx`;
  XLSX.writeFile(workbook, safeFilename);
}
