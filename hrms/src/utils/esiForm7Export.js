import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Statutory ESI - Form 7 - Half Yearly Report (Option 1) Exporter
 * FORM 7 [REGULATION - 32, APPENDIX - F]
 * REGISTER OF EMPLOYEES & HALF-YEARLY RETURN OF ESI CONTRIBUTIONS
 * Matches exact 29-column structure and bottom summary rows from statutory template.
 */

export const downloadEsiForm7Excel = (
  records = [],
  companyInfo = {},
  period = {},
  totals = {},
  monthlySummaries = [],
  options = {}
) => {
  const months = period?.months || [
    { name: 'April' },
    { name: 'May' },
    { name: 'June' },
    { name: 'July' },
    { name: 'August' },
    { name: 'September' },
  ];

  const m1 = months[0]?.name || 'Month 1';
  const m2 = months[1]?.name || 'Month 2';
  const m3 = months[2]?.name || 'Month 3';
  const m4 = months[3]?.name || 'Month 4';
  const m5 = months[4]?.name || 'Month 5';
  const m6 = months[5]?.name || 'Month 6';

  const periodLabel = period?.label || '01 Apr 2026 To 30 Sep 2026';
  const form6Date = options.form6SubmittedDate || '............................................';

  const aoa = [
    // Top Statutory Header
    ['FORM 7', '', '', '', '', '', '', '', '', '', '', '', '', '', 'REGISTER OF EMPLOYEES', '', '', '', '', '', '', '', '', '', `Form 6 Submitted on Date: ${form6Date}`],
    ['', '', '', '', '', '', '', '', '', '', '', '', '', '', 'REGULATION - 32          APPENDIX - F', '', '', '', '', '', '', '', '', '', `Contribution for the Year  ${periodLabel}`],
    [''],
    // Multi-tier Table Header Level 1
    [
      'Sl.\nNo',
      'Insurance\nNo',
      'Name of\nInsured\nPerson',
      'Occupa-\ntion',
      'Dept\nand\nshift\nif any',
      'If appointed\nduring the\ncontr.\nperiod\ndate of\nAppt.',
      m1, '', '',
      m2, '', '',
      m3, '', '',
      m4, '', '',
      m5, '', '',
      m6, '', '',
      'Total No.\nof days\nin contri\nbution\nperiod\nfor which\nwages\npaid /\npayable',
      'Total\namount of\nwages\npaid/\npayable in\nthe contri\nbution\nperiod',
      'Total\nemployees\ncontri\nbution in\nthe\ncontrib\nution\nperiod',
      'Daily\nwages\nCol.\n26 / 25',
      'Particulars\nof E.S.I\nDispensary\nRemarks'
    ],
    // Table Header Level 2
    [
      '', '', '', '', '', '',
      'No\nof\nDays', 'Total\namt of\nwages\npaid/\npayable', 'Empl.\nshare\nof\ncontri\nbution',
      'No\nof\nDays', 'Total\namt of\nwages\npaid/\npayable', 'Empl.\nshare\nof\ncontri\nbution',
      'No\nof\nDays', 'Total\namt of\nwages\npaid/\npayable', 'Empl.\nshare\nof\ncontri\nbution',
      'No\nof\nDays', 'Total\namt of\nwages\npaid/\npayable', 'Empl.\nshare\nof\ncontri\nbution',
      'No\nof\nDays', 'Total\namt of\nwages\npaid/\npayable', 'Empl.\nshare\nof\ncontri\nbution',
      'No\nof\nDays', 'Total\namt of\nwages\npaid/\npayable', 'Empl.\nshare\nof\ncontri\nbution',
      '', '', '', '', ''
    ],
    // Table Header Level 3 (Numbered Columns 1 to 29 matching Image 1)
    [
      '1', '2', '3', '4', '5', '6',
      '7', '8', '9', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21', '22', '23', '24',
      '25', '26', '27', '28', '29'
    ]
  ];

  // Employee Data Rows
  records.forEach((row, idx) => {
    const m = row.months || [];
    aoa.push([
      row.srNo || idx + 1,
      row.insuranceNo || '—',
      row.name || '',
      row.occupation || '',
      row.department || '',
      row.dateOfAppointment || '',
      // Month 1
      m[0]?.days ?? 0,
      m[0]?.wages ?? 0,
      m[0]?.employeeShare ?? 0,
      // Month 2
      m[1]?.days ?? 0,
      m[1]?.wages ?? 0,
      m[1]?.employeeShare ?? 0,
      // Month 3
      m[2]?.days ?? 0,
      m[2]?.wages ?? 0,
      m[2]?.employeeShare ?? 0,
      // Month 4
      m[3]?.days ?? 0,
      m[3]?.wages ?? 0,
      m[3]?.employeeShare ?? 0,
      // Month 5
      m[4]?.days ?? 0,
      m[4]?.wages ?? 0,
      m[4]?.employeeShare ?? 0,
      // Month 6
      m[5]?.days ?? 0,
      m[5]?.wages ?? 0,
      m[5]?.employeeShare ?? 0,
      // Totals
      row.totalDays ?? 0,
      row.totalWages ?? 0,
      row.totalEmployeeContribution ?? 0,
      row.dailyWage ?? 0,
      row.dispensaryRemarks || ''
    ]);
  });

  // Summary Rows at Bottom (Matching Image 1)
  const summaries = monthlySummaries.length === 6 ? monthlySummaries : [
    { totalWages: 0, totalEmployeeShare: 0, contributingEmployeesCount: 0 },
    { totalWages: 0, totalEmployeeShare: 0, contributingEmployeesCount: 0 },
    { totalWages: 0, totalEmployeeShare: 0, contributingEmployeesCount: 0 },
    { totalWages: 0, totalEmployeeShare: 0, contributingEmployeesCount: 0 },
    { totalWages: 0, totalEmployeeShare: 0, contributingEmployeesCount: 0 },
    { totalWages: 0, totalEmployeeShare: 0, contributingEmployeesCount: 0 },
  ];

  // Row 1: Grand Total of Wages and Employee's share of contribution 0.75%
  aoa.push([
    "Grand Total of Wages and Employee's share of contribution 0.75%", '', '', '', '', '',
    '', summaries[0].totalWages || 0, summaries[0].totalEmployeeShare || 0,
    '', summaries[1].totalWages || 0, summaries[1].totalEmployeeShare || 0,
    '', summaries[2].totalWages || 0, summaries[2].totalEmployeeShare || 0,
    '', summaries[3].totalWages || 0, summaries[3].totalEmployeeShare || 0,
    '', summaries[4].totalWages || 0, summaries[4].totalEmployeeShare || 0,
    '', summaries[5].totalWages || 0, summaries[5].totalEmployeeShare || 0,
    totals.grandTotalDays || 0,
    totals.grandTotalWages || 0,
    totals.grandTotalEmployeeContribution || 0,
    totals.overallDailyWage || 0,
    ''
  ]);

  // Row 2: Total number of Employees who have contributed
  aoa.push([
    'Total number of Employees who have contributed', '', '', '', '', '',
    '', '', summaries[0].contributingEmployeesCount || 0,
    '', '', summaries[1].contributingEmployeesCount || 0,
    '', '', summaries[2].contributingEmployeesCount || 0,
    '', '', summaries[3].contributingEmployeesCount || 0,
    '', '', summaries[4].contributingEmployeesCount || 0,
    '', '', summaries[5].contributingEmployeesCount || 0,
    '', '', '', '', ''
  ]);

  // Row 3: Total Employer's share of contribution 3.25%
  aoa.push([
    "Total Employer's share of contribution 3.25%", '', '', '', '', '',
    totals.grandTotalEmployerContribution || 0, '', '',
    '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''
  ]);

  // Row 4: Total Value of contribution paid : Challan Number and Date
  aoa.push([
    'Total Value of contribution paid : Challan Number and Date', '', '', '', '', '',
    totals.grandTotalContribution || (Number(totals.grandTotalEmployeeContribution || 0) + Number(totals.grandTotalEmployerContribution || 0)), '', '',
    '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''
  ]);

  const ws = XLSX.utils.aoa_to_sheet(aoa);

  // Set merges for multi-tier headers and summary rows
  ws['!merges'] = [
    // Header Row 1 & 2 Center & Right
    { s: { r: 0, c: 0 }, e: { r: 0, c: 5 } },
    { s: { r: 0, c: 14 }, e: { r: 0, c: 18 } },
    { s: { r: 0, c: 24 }, e: { r: 0, c: 28 } },
    { s: { r: 1, c: 14 }, e: { r: 1, c: 18 } },
    { s: { r: 1, c: 24 }, e: { r: 1, c: 28 } },

    // Top table headers (Row 3, 4)
    { s: { r: 3, c: 0 }, e: { r: 4, c: 0 } },
    { s: { r: 3, c: 1 }, e: { r: 4, c: 1 } },
    { s: { r: 3, c: 2 }, e: { r: 4, c: 2 } },
    { s: { r: 3, c: 3 }, e: { r: 4, c: 3 } },
    { s: { r: 3, c: 4 }, e: { r: 4, c: 4 } },
    { s: { r: 3, c: 5 }, e: { r: 4, c: 5 } },
    // Month 1..6 col spans
    { s: { r: 3, c: 6 }, e: { r: 3, c: 8 } },
    { s: { r: 3, c: 9 }, e: { r: 3, c: 11 } },
    { s: { r: 3, c: 12 }, e: { r: 3, c: 14 } },
    { s: { r: 3, c: 15 }, e: { r: 3, c: 17 } },
    { s: { r: 3, c: 18 }, e: { r: 3, c: 20 } },
    { s: { r: 3, c: 21 }, e: { r: 3, c: 23 } },
    // Trailing cols
    { s: { r: 3, c: 24 }, e: { r: 4, c: 24 } },
    { s: { r: 3, c: 25 }, e: { r: 4, c: 25 } },
    { s: { r: 3, c: 26 }, e: { r: 4, c: 26 } },
    { s: { r: 3, c: 27 }, e: { r: 4, c: 27 } },
    { s: { r: 3, c: 28 }, e: { r: 4, c: 28 } },

    // Summary Rows Merges (Bottom)
    { s: { r: aoa.length - 4, c: 0 }, e: { r: aoa.length - 4, c: 5 } },
    { s: { r: aoa.length - 3, c: 0 }, e: { r: aoa.length - 3, c: 5 } },
    { s: { r: aoa.length - 2, c: 0 }, e: { r: aoa.length - 2, c: 5 } },
    { s: { r: aoa.length - 1, c: 0 }, e: { r: aoa.length - 1, c: 5 } },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'ESI_Form_7');

  const fileName = `ESI_Form_7_Half_Yearly_${String(periodLabel).replace(/[^a-zA-Z0-9_-]/g, '_')}.${options.format === 'csv' ? 'csv' : 'xlsx'}`;

  if (options.format === 'csv') {
    XLSX.writeFile(wb, fileName, { bookType: 'csv' });
  } else {
    XLSX.writeFile(wb, fileName);
  }
};

export const downloadEsiForm7Csv = (records, companyInfo, period, totals, monthlySummaries, options = {}) => {
  downloadEsiForm7Excel(records, companyInfo, period, totals, monthlySummaries, { ...options, format: 'csv' });
};

export const downloadEsiForm7Pdf = (
  records = [],
  companyInfo = {},
  period = {},
  totals = {},
  monthlySummaries = [],
  options = {}
) => {
  if (options.mode === 'print') {
    window.print();
    return;
  }

  const months = period?.months || [
    { name: 'April' },
    { name: 'May' },
    { name: 'June' },
    { name: 'July' },
    { name: 'August' },
    { name: 'September' },
  ];

  const m1 = months[0]?.name || 'Apr';
  const m2 = months[1]?.name || 'May';
  const m3 = months[2]?.name || 'Jun';
  const m4 = months[3]?.name || 'Jul';
  const m5 = months[4]?.name || 'Aug';
  const m6 = months[5]?.name || 'Sep';

  const periodLabel = period?.label || '01 Apr 2026 To 30 Sep 2026';
  const form6Date = options.form6SubmittedDate || '............................................';

  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'pt',
    format: 'a3',
  });

  // Top Statutory Headers
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('FORM 7', 30, 32);

  doc.setFontSize(13);
  doc.text('REGISTER OF EMPLOYEES', 595, 32, { align: 'center' });
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.text('REGULATION - 32          APPENDIX - F', 595, 46, { align: 'center' });

  doc.setFontSize(8);
  doc.text(`Form 6 Submitted on Date: ${form6Date}`, 1150, 32, { align: 'right' });
  doc.setFont('helvetica', 'bold');
  doc.text(`Contribution for the Year  ${periodLabel}`, 1150, 46, { align: 'right' });

  // 29-Column Table Multi-Tier Header
  const tableHead = [
    [
      { content: 'Sl.\nNo', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
      { content: 'Insurance\nNo', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
      { content: 'Name of\nInsured Person', rowSpan: 2, styles: { halign: 'left', valign: 'middle' } },
      { content: 'Occupa-\ntion', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
      { content: 'Dept and\nshift if\nany', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
      { content: 'If appointed\nduring contr.\nperiod date\nof Appt.', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
      { content: m1, colSpan: 3, styles: { halign: 'center' } },
      { content: m2, colSpan: 3, styles: { halign: 'center' } },
      { content: m3, colSpan: 3, styles: { halign: 'center' } },
      { content: m4, colSpan: 3, styles: { halign: 'center' } },
      { content: m5, colSpan: 3, styles: { halign: 'center' } },
      { content: m6, colSpan: 3, styles: { halign: 'center' } },
      { content: 'Total No.\nof days in\ncontr. period\nwages paid', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
      { content: 'Total wages\npaid / payable\nin contr.\nperiod', rowSpan: 2, styles: { halign: 'right', valign: 'middle' } },
      { content: 'Total employee\ncontr. in contr.\nperiod', rowSpan: 2, styles: { halign: 'right', valign: 'middle' } },
      { content: 'Daily wages\nCol. 26 / 25', rowSpan: 2, styles: { halign: 'right', valign: 'middle' } },
      { content: 'Particulars of\nE.S.I Dispensary\n/ Remarks', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
    ],
    [
      'Days', 'Wages', 'Contr',
      'Days', 'Wages', 'Contr',
      'Days', 'Wages', 'Contr',
      'Days', 'Wages', 'Contr',
      'Days', 'Wages', 'Contr',
      'Days', 'Wages', 'Contr',
    ],
    [
      '1', '2', '3', '4', '5', '6',
      '7', '8', '9', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21', '22', '23', '24',
      '25', '26', '27', '28', '29'
    ]
  ];

  const tableBody = records.map((row, idx) => {
    const m = row.months || [];
    return [
      row.srNo || idx + 1,
      row.insuranceNo || '—',
      row.name || '',
      row.occupation || '',
      row.department || '',
      row.dateOfAppointment || '',
      m[0]?.days ?? 0, (m[0]?.wages ?? 0).toFixed(2), (m[0]?.employeeShare ?? 0).toFixed(2),
      m[1]?.days ?? 0, (m[1]?.wages ?? 0).toFixed(2), (m[1]?.employeeShare ?? 0).toFixed(2),
      m[2]?.days ?? 0, (m[2]?.wages ?? 0).toFixed(2), (m[2]?.employeeShare ?? 0).toFixed(2),
      m[3]?.days ?? 0, (m[3]?.wages ?? 0).toFixed(2), (m[3]?.employeeShare ?? 0).toFixed(2),
      m[4]?.days ?? 0, (m[4]?.wages ?? 0).toFixed(2), (m[4]?.employeeShare ?? 0).toFixed(2),
      m[5]?.days ?? 0, (m[5]?.wages ?? 0).toFixed(2), (m[5]?.employeeShare ?? 0).toFixed(2),
      row.totalDays ?? 0,
      (row.totalWages ?? 0).toFixed(2),
      (row.totalEmployeeContribution ?? 0).toFixed(2),
      (row.dailyWage ?? 0).toFixed(2),
      row.dispensaryRemarks || ''
    ];
  });

  const summaries = monthlySummaries.length === 6 ? monthlySummaries : [
    { totalWages: 0, totalEmployeeShare: 0, contributingEmployeesCount: 0 },
    { totalWages: 0, totalEmployeeShare: 0, contributingEmployeesCount: 0 },
    { totalWages: 0, totalEmployeeShare: 0, contributingEmployeesCount: 0 },
    { totalWages: 0, totalEmployeeShare: 0, contributingEmployeesCount: 0 },
    { totalWages: 0, totalEmployeeShare: 0, contributingEmployeesCount: 0 },
    { totalWages: 0, totalEmployeeShare: 0, contributingEmployeesCount: 0 },
  ];

  // Bottom Summary Rows
  const tableFoot = [
    [
      { content: "Grand Total of Wages and Employee's share of contribution 0.75%", colSpan: 6, styles: { fontStyle: 'bold' } },
      '', (summaries[0].totalWages || 0).toFixed(2), (summaries[0].totalEmployeeShare || 0).toFixed(2),
      '', (summaries[1].totalWages || 0).toFixed(2), (summaries[1].totalEmployeeShare || 0).toFixed(2),
      '', (summaries[2].totalWages || 0).toFixed(2), (summaries[2].totalEmployeeShare || 0).toFixed(2),
      '', (summaries[3].totalWages || 0).toFixed(2), (summaries[3].totalEmployeeShare || 0).toFixed(2),
      '', (summaries[4].totalWages || 0).toFixed(2), (summaries[4].totalEmployeeShare || 0).toFixed(2),
      '', (summaries[5].totalWages || 0).toFixed(2), (summaries[5].totalEmployeeShare || 0).toFixed(2),
      totals.grandTotalDays || 0,
      (totals.grandTotalWages || 0).toFixed(2),
      (totals.grandTotalEmployeeContribution || 0).toFixed(2),
      (totals.overallDailyWage || 0).toFixed(2),
      ''
    ],
    [
      { content: 'Total number of Employees who have contributed', colSpan: 6, styles: { fontStyle: 'bold' } },
      { content: `${summaries[0].contributingEmployeesCount || 0}`, colSpan: 3, styles: { halign: 'center' } },
      { content: `${summaries[1].contributingEmployeesCount || 0}`, colSpan: 3, styles: { halign: 'center' } },
      { content: `${summaries[2].contributingEmployeesCount || 0}`, colSpan: 3, styles: { halign: 'center' } },
      { content: `${summaries[3].contributingEmployeesCount || 0}`, colSpan: 3, styles: { halign: 'center' } },
      { content: `${summaries[4].contributingEmployeesCount || 0}`, colSpan: 3, styles: { halign: 'center' } },
      { content: `${summaries[5].contributingEmployeesCount || 0}`, colSpan: 3, styles: { halign: 'center' } },
      { content: '', colSpan: 5 }
    ],
    [
      { content: "Total Employer's share of contribution 3.25%", colSpan: 6, styles: { fontStyle: 'bold' } },
      { content: `₹${(totals.grandTotalEmployerContribution || 0).toLocaleString('en-IN')}`, colSpan: 23, styles: { fontStyle: 'bold' } }
    ],
    [
      { content: 'Total Value of contribution paid : Challan Number and Date', colSpan: 6, styles: { fontStyle: 'bold' } },
      { content: `₹${(totals.grandTotalContribution || 0).toLocaleString('en-IN')}`, colSpan: 23, styles: { fontStyle: 'bold' } }
    ]
  ];

  autoTable(doc, {
    startY: 58,
    margin: { left: 24, right: 24 },
    head: tableHead,
    body: tableBody,
    foot: tableFoot,
    theme: 'grid',
    styles: {
      fontSize: 6,
      cellPadding: 2,
      textColor: [0, 0, 0],
      lineColor: [100, 100, 100],
      lineWidth: 0.5,
      halign: 'center',
    },
    headStyles: {
      fillColor: [255, 255, 255],
      textColor: [0, 0, 0],
      fontStyle: 'bold',
      lineWidth: 0.5,
      lineColor: [0, 0, 0],
    },
    footStyles: {
      fillColor: [255, 255, 255],
      textColor: [0, 0, 0],
      lineWidth: 0.5,
      lineColor: [0, 0, 0],
    },
    columnStyles: {
      0: { cellWidth: 20 },
      1: { cellWidth: 50 },
      2: { cellWidth: 70, halign: 'left' },
      3: { cellWidth: 55, halign: 'left' },
      4: { cellWidth: 50 },
      5: { cellWidth: 50 },
    }
  });

  doc.save(`ESI_Form_7_Half_Yearly_${String(periodLabel).replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`);
};
