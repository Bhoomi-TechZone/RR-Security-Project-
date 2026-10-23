import * as XLSX from 'xlsx';

/**
 * Statutory Location-Wise Monthly PF Summary Report Export Utility
 * Generates exact Excel (.xlsx) file matching statutory enterprise payroll specifications:
 * - Header metadata: Company Name, PF Summary Report Form month: {FROM_MONTH} To {TO_MONTH}
 * - 14 Columns with merged headers:
 *   SrNo | Location Name | Month | TotEmp | Atten. | PF Wages | A/C 1 (12 / 3.67) | A/C 10 (8.33) | A/C 21 (0.5) | A/C 2 (0.5) | A/C 22 (0) | Total Amt | Year
 * - Grand Total row
 *
 * NOTE: User explicit instruction: "it should be only in excel format"
 */
export function downloadPfLocationWiseExcel(reportData = {}) {
  const locations = reportData.locations || [];
  const grandTotal = reportData.grandTotal || {};
  const companyName = reportData.companyName || 'RR SECURITY & FACILITIES';
  const headerSubtitle = reportData.headerSubtitle || 'PF Summary Report Form month: SEPTEMBER,2026 To SEPTEMBER,2026';
  const monthLabel = reportData.monthLabel || 'Current_Month';

  const sheetData = [
    // Row 1: Company Title
    [companyName],
    // Row 2: Report Subtitle
    [headerSubtitle],
    // Row 3: Header Row 1
    [
      'SrNo',
      'Location Name',
      'Month',
      'TotEmp',
      'Atten.',
      'PF Wages',
      'A/C 1',
      '',
      'A/C 10',
      'A/C 21',
      'A/C 2',
      'A/C 22',
      'Total Amt',
      'Year'
    ],
    // Row 4: Header Row 2 (Sub-rates)
    [
      '',
      '',
      '',
      '',
      '',
      '',
      '12',
      '3.67',
      '8.33',
      '0.5',
      '0.5',
      '0',
      '',
      ''
    ]
  ];

  // Data Rows
  locations.forEach((loc, idx) => {
    sheetData.push([
      loc.srNo || idx + 1,
      loc.locationName || '',
      loc.month || '',
      Number(loc.totEmp) || 0,
      Number(loc.atten) || 0,
      Number(loc.pfWages) || 0,
      Number(loc.ac1_12) || 0,
      Number(loc.epf_3_67) || 0,
      Number(loc.ac10_8_33) || 0,
      Number(loc.ac21_0_5) || 0,
      Number(loc.ac2_0_5) || 0,
      Number(loc.ac22_0) || 0,
      Number(loc.totalAmt) || 0,
      loc.year || 2026,
    ]);
  });

  // Grand Total Row
  sheetData.push([
    '',
    'Grand Total',
    '',
    Number(grandTotal.totEmp) || 0,
    Number(grandTotal.atten) || 0,
    Number(grandTotal.pfWages) || 0,
    Number(grandTotal.ac1_12) || 0,
    Number(grandTotal.epf_3_67) || 0,
    Number(grandTotal.ac10_8_33) || 0,
    Number(grandTotal.ac21_0_5) || 0,
    Number(grandTotal.ac2_0_5) || 0,
    Number(grandTotal.ac22_0) || 0,
    Number(grandTotal.totalAmt) || 0,
    '',
  ]);

  const worksheet = XLSX.utils.aoa_to_sheet(sheetData);

  // Column Widths
  worksheet['!cols'] = [
    { wch: 7 },  // SrNo
    { wch: 32 }, // Location Name
    { wch: 14 }, // Month
    { wch: 9 },  // TotEmp
    { wch: 9 },  // Atten.
    { wch: 14 }, // PF Wages
    { wch: 10 }, // 12
    { wch: 10 }, // 3.67
    { wch: 10 }, // 8.33
    { wch: 9 },  // 0.5
    { wch: 9 },  // 0.5
    { wch: 9 },  // 0
    { wch: 13 }, // Total Amt
    { wch: 8 },  // Year
  ];

  // Merges for headers
  worksheet['!merges'] = [
    // A1:N1
    { s: { r: 0, c: 0 }, e: { r: 0, c: 13 } },
    // A2:N2
    { s: { r: 1, c: 0 }, e: { r: 1, c: 13 } },
    // SrNo: A3:A4
    { s: { r: 2, c: 0 }, e: { r: 3, c: 0 } },
    // Location Name: B3:B4
    { s: { r: 2, c: 1 }, e: { r: 3, c: 1 } },
    // Month: C3:C4
    { s: { r: 2, c: 2 }, e: { r: 3, c: 2 } },
    // TotEmp: D3:D4
    { s: { r: 2, c: 3 }, e: { r: 3, c: 3 } },
    // Atten.: E3:E4
    { s: { r: 2, c: 4 }, e: { r: 3, c: 4 } },
    // PF Wages: F3:F4
    { s: { r: 2, c: 5 }, e: { r: 3, c: 5 } },
    // A/C 1: G3:H3
    { s: { r: 2, c: 6 }, e: { r: 2, c: 7 } },
    // Total Amt: M3:M4
    { s: { r: 2, c: 12 }, e: { r: 3, c: 12 } },
    // Year: N3:N4
    { s: { r: 2, c: 13 }, e: { r: 3, c: 13 } },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'LocationWise_PF');

  const safeFilename = `PF_Report_Location_Wise_${String(monthLabel).replace(/[^a-zA-Z0-9]/g, '_')}.xlsx`;
  XLSX.writeFile(workbook, safeFilename);
}
