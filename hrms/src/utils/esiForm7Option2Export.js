import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Statutory ESI - Form 7 - Half Yearly Report (Option 2) Exporter
 * FORM 7 [REGULATION 32] - REGISTER OF EMPLOYEES
 * Replicates Option-2 statutory layout with dual-line employee records,
 * 6-month contribution blocks (Days, Wages, Employee ESI), grand totals,
 * employer share breakdown, and challan details.
 */

const formatPeriodDates = (period = {}) => {
  const months = period?.months || [
    { name: 'April' },
    { name: 'May' },
    { name: 'June' },
    { name: 'July' },
    { name: 'August' },
    { name: 'September' },
  ];

  const firstMonth = months[0]?.name?.toUpperCase() || 'APRIL';
  const lastMonth = months[5]?.name?.toUpperCase() || 'SEPTEMBER';

  let startYear = '';
  let endYear = '';

  if (period?.fromDate && period?.toDate) {
    startYear = period.fromDate.slice(0, 4);
    endYear = period.toDate.slice(0, 4);
  } else if (months[0]?.monthStr && months[5]?.monthStr) {
    startYear = months[0].monthStr.slice(0, 4);
    endYear = months[5].monthStr.slice(0, 4);
  } else {
    const y = new Date().getFullYear();
    startYear = String(y);
    endYear = String(y);
  }

  const periodHeader = `Contribution Period From ${firstMonth} ${startYear} To ${lastMonth} ${endYear}`;
  return { months, periodHeader, startYear, endYear };
};

const formatCurr = (val) => {
  const n = Number(val) || 0;
  return n.toFixed(2);
};

const formatDays = (val) => {
  const n = Number(val) || 0;
  return n.toFixed(2);
};

/**
 * Excel (.xlsx) Exporter for Option 2
 */
export const downloadEsiForm7Option2Excel = (
  records = [],
  companyInfo = {},
  period = {},
  totals = {},
  monthlySummaries = [],
  options = {}
) => {
  const { months, periodHeader } = formatPeriodDates(period);

  const mHeaders = months.map((m) => {
    const namePart = (m.name || '').slice(0, 3);
    const yrPart = (m.monthStr || '').slice(0, 4);
    return yrPart ? `${namePart}, ${yrPart}` : (m.name || 'Month');
  });

  const aoa = [
    // Top Headers matching Image 1
    ['Form 7'],
    ['REGISTER OF EMPLOYEES'],
    ['(REGULATION 32)'],
    [periodHeader],
    [''],
    // Header Row 1
    [
      'Sl.',
      'Name Of Insured Person (2)',
      mHeaders[0] || 'Month 1', '', '',
      mHeaders[1] || 'Month 2', '', '',
      mHeaders[2] || 'Month 3', '', '',
      mHeaders[3] || 'Month 4', '', '',
      mHeaders[4] || 'Month 5', '', '',
      mHeaders[5] || 'Month 6', '', '',
      'Total', '', '',
      'Daily Wages',
      'Rem.'
    ],
    // Header Row 2
    [
      'No.',
      'Insurance (3)   Dispensary (3A)',
      'No. Of Days', 'Wages Paid', 'Empl. E.S.I.',
      'No. Of Days', 'Wages Paid', 'Empl. E.S.I.',
      'No. Of Days', 'Wages Paid', 'Empl. E.S.I.',
      'No. Of Days', 'Wages Paid', 'Empl. E.S.I.',
      'No. Of Days', 'Wages Paid', 'Empl. E.S.I.',
      'No. Of Days', 'Wages Paid', 'Empl. E.S.I.',
      'No. Of Days', 'Wages Paid', 'Empl. E.S.I.',
      '',
      ''
    ],
    // Header Row 3 (Column numbers 1, 4 to 24, Daily wages, Rem)
    [
      '1',
      '',
      '4', '5', '6',
      '7', '8', '9',
      '10', '11', '12',
      '13', '14', '15',
      '16', '17', '18',
      '19', '20', '21',
      '22', '23', '24',
      '',
      ''
    ]
  ];

  // Employee Rows: 2 visual rows per employee
  records.forEach((r, idx) => {
    const m = r.months || [];
    const row1 = [
      r.srNo || idx + 1,
      r.name ? String(r.name).toUpperCase() : '',
      formatDays(m[0]?.days), formatCurr(m[0]?.wages), formatCurr(m[0]?.employeeShare),
      formatDays(m[1]?.days), formatCurr(m[1]?.wages), formatCurr(m[1]?.employeeShare),
      formatDays(m[2]?.days), formatCurr(m[2]?.wages), formatCurr(m[2]?.employeeShare),
      formatDays(m[3]?.days), formatCurr(m[3]?.wages), formatCurr(m[3]?.employeeShare),
      formatDays(m[4]?.days), formatCurr(m[4]?.wages), formatCurr(m[4]?.employeeShare),
      formatDays(m[5]?.days), formatCurr(m[5]?.wages), formatCurr(m[5]?.employeeShare),
      formatDays(r.totalDays), formatCurr(r.totalWages), formatCurr(r.totalEmployeeContribution),
      formatCurr(r.dailyWage),
      r.remarks || ''
    ];

    const row2 = [
      '',
      `${r.insuranceNo || '—'}    ${r.dispensaryRemarks || ''}`.trim(),
      '', '', '',
      '', '', '',
      '', '', '',
      '', '', '',
      '', '', '',
      '', '', '',
      '', '', '',
      '',
      ''
    ];

    aoa.push(row1);
    aoa.push(row2);
  });

  // Calculate monthly aggregates
  const sumDays = [0, 0, 0, 0, 0, 0];
  const sumWages = [0, 0, 0, 0, 0, 0];
  const sumEmpEsi = [0, 0, 0, 0, 0, 0];
  const sumEmprEsi = [0, 0, 0, 0, 0, 0];

  records.forEach((r) => {
    const m = r.months || [];
    for (let i = 0; i < 6; i++) {
      sumDays[i] += Number(m[i]?.days) || 0;
      sumWages[i] += Number(m[i]?.wages) || 0;
      sumEmpEsi[i] += Number(m[i]?.employeeShare) || 0;
      sumEmprEsi[i] += Number(m[i]?.employerShare) || Math.round((Number(m[i]?.wages) || 0) * 0.0325);
    }
  });

  const grandDays = totals?.grandTotalDays ?? sumDays.reduce((a, b) => a + b, 0);
  const grandWages = totals?.grandTotalWages ?? sumWages.reduce((a, b) => a + b, 0);
  const grandEmpEsi = totals?.grandTotalEmployeeContribution ?? sumEmpEsi.reduce((a, b) => a + b, 0);
  const grandEmprEsi = totals?.grandTotalEmployerContribution ?? sumEmprEsi.reduce((a, b) => a + b, 0);
  const grandTotalContrib = grandEmpEsi + grandEmprEsi;

  // Total : row
  aoa.push([
    '',
    'Total :',
    formatDays(sumDays[0]), formatCurr(sumWages[0]), formatCurr(sumEmpEsi[0]),
    formatDays(sumDays[1]), formatCurr(sumWages[1]), formatCurr(sumEmpEsi[1]),
    formatDays(sumDays[2]), formatCurr(sumWages[2]), formatCurr(sumEmpEsi[2]),
    formatDays(sumDays[3]), formatCurr(sumWages[3]), formatCurr(sumEmpEsi[3]),
    formatDays(sumDays[4]), formatCurr(sumWages[4]), formatCurr(sumEmpEsi[4]),
    formatDays(sumDays[5]), formatCurr(sumWages[5]), formatCurr(sumEmpEsi[5]),
    formatDays(grandDays), formatCurr(grandWages), formatCurr(grandEmpEsi),
    '',
    ''
  ]);

  // Employer's Share of Contribution : row
  aoa.push([
    '',
    "Employer's Share of Contribution :",
    '', '', formatCurr(sumEmprEsi[0]),
    '', '', formatCurr(sumEmprEsi[1]),
    '', '', formatCurr(sumEmprEsi[2]),
    '', '', formatCurr(sumEmprEsi[3]),
    '', '', formatCurr(sumEmprEsi[4]),
    '', '', formatCurr(sumEmprEsi[5]),
    '', '', formatCurr(grandEmprEsi),
    '',
    ''
  ]);

  // Total Value Of Contribution : ( Rounded Off ) row
  aoa.push([
    '',
    'Total Value Of Contribution : ( Rounded Off )',
    '', '', formatCurr(sumEmpEsi[0] + sumEmprEsi[0]),
    '', '', formatCurr(sumEmpEsi[1] + sumEmprEsi[1]),
    '', '', formatCurr(sumEmpEsi[2] + sumEmprEsi[2]),
    '', '', formatCurr(sumEmpEsi[3] + sumEmprEsi[3]),
    '', '', formatCurr(sumEmpEsi[4] + sumEmprEsi[4]),
    '', '', formatCurr(sumEmpEsi[5] + sumEmprEsi[5]),
    '', '', formatCurr(grandTotalContrib),
    '',
    ''
  ]);

  // Challan rows
  aoa.push(['']);
  aoa.push(['Paid Challan No. :', options.challanNo || '']);
  const todayStr = new Date().toLocaleDateString('en-GB');
  aoa.push(['Date             :', options.submissionDate || todayStr]);

  const ws = XLSX.utils.aoa_to_sheet(aoa);

  // Set column widths
  ws['!cols'] = [
    { wch: 6 },  // Sl No
    { wch: 32 }, // Name / Insurance / Dispensary
    { wch: 9 }, { wch: 12 }, { wch: 11 }, // M1
    { wch: 9 }, { wch: 12 }, { wch: 11 }, // M2
    { wch: 9 }, { wch: 12 }, { wch: 11 }, // M3
    { wch: 9 }, { wch: 12 }, { wch: 11 }, // M4
    { wch: 9 }, { wch: 12 }, { wch: 11 }, // M5
    { wch: 9 }, { wch: 12 }, { wch: 11 }, // M6
    { wch: 9 }, { wch: 12 }, { wch: 11 }, // Total
    { wch: 12 }, // Daily Wages
    { wch: 10 }  // Rem.
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Form 7 (Option-2)');
  const filename = `ESI_Form_7_Half_Yearly_Option2_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(wb, filename);
};

/**
 * CSV Exporter for Option 2
 */
export const downloadEsiForm7Option2Csv = (
  records = [],
  companyInfo = {},
  period = {},
  totals = {},
  monthlySummaries = [],
  options = {}
) => {
  const { months, periodHeader } = formatPeriodDates(period);

  const mHeaders = months.map((m) => {
    const namePart = (m.name || '').slice(0, 3);
    const yrPart = (m.monthStr || '').slice(0, 4);
    return yrPart ? `${namePart}, ${yrPart}` : (m.name || 'Month');
  });

  const lines = [
    `"Form 7"`,
    `"REGISTER OF EMPLOYEES"`,
    `"(REGULATION 32)"`,
    `"${periodHeader}"`,
    ``,
    [
      `"Sl. No."`,
      `"Name Of Insured Person (2) / Insurance (3) / Dispensary (3A)"`,
      ...mHeaders.flatMap((h) => [`"${h} No. Of Days"`, `"${h} Wages Paid"`, `"${h} Empl. E.S.I."`]),
      `"Total No. Of Days"`, `"Total Wages Paid"`, `"Total Empl. E.S.I."`,
      `"Daily Wages"`,
      `"Rem."`
    ].join(',')
  ];

  records.forEach((r, idx) => {
    const m = r.months || [];
    const nameLine = [
      `"${r.srNo || idx + 1}"`,
      `"${r.name ? String(r.name).toUpperCase() : ''}"`,
      ...m.flatMap((mo) => [
        `"${formatDays(mo?.days)}"`,
        `"${formatCurr(mo?.wages)}"`,
        `"${formatCurr(mo?.employeeShare)}"`
      ]),
      `"${formatDays(r.totalDays)}"`,
      `"${formatCurr(r.totalWages)}"`,
      `"${formatCurr(r.totalEmployeeContribution)}"`,
      `"${formatCurr(r.dailyWage)}"`,
      `"${r.remarks || ''}"`
    ].join(',');

    const subLine = [
      `""`,
      `"${r.insuranceNo || '—'} ${r.dispensaryRemarks || ''}"`,
      ...Array(20).fill(`""`)
    ].join(',');

    lines.push(nameLine);
    lines.push(subLine);
  });

  // Calculate sums
  const sumDays = [0, 0, 0, 0, 0, 0];
  const sumWages = [0, 0, 0, 0, 0, 0];
  const sumEmpEsi = [0, 0, 0, 0, 0, 0];
  const sumEmprEsi = [0, 0, 0, 0, 0, 0];

  records.forEach((r) => {
    const m = r.months || [];
    for (let i = 0; i < 6; i++) {
      sumDays[i] += Number(m[i]?.days) || 0;
      sumWages[i] += Number(m[i]?.wages) || 0;
      sumEmpEsi[i] += Number(m[i]?.employeeShare) || 0;
      sumEmprEsi[i] += Number(m[i]?.employerShare) || Math.round((Number(m[i]?.wages) || 0) * 0.0325);
    }
  });

  const grandDays = totals?.grandTotalDays ?? sumDays.reduce((a, b) => a + b, 0);
  const grandWages = totals?.grandTotalWages ?? sumWages.reduce((a, b) => a + b, 0);
  const grandEmpEsi = totals?.grandTotalEmployeeContribution ?? sumEmpEsi.reduce((a, b) => a + b, 0);
  const grandEmprEsi = totals?.grandTotalEmployerContribution ?? sumEmprEsi.reduce((a, b) => a + b, 0);
  const grandTotalContrib = grandEmpEsi + grandEmprEsi;

  lines.push(
    [
      `""`,
      `"Total :"`,
      ...sumDays.map((d, i) => `"${formatDays(d)}","${formatCurr(sumWages[i])}","${formatCurr(sumEmpEsi[i])}"`).join(','),
      `"${formatDays(grandDays)}"`,
      `"${formatCurr(grandWages)}"`,
      `"${formatCurr(grandEmpEsi)}"`,
      `""`,
      `""`
    ].join(',')
  );

  lines.push(
    [
      `""`,
      `"Employer's Share of Contribution :"`,
      ...sumEmprEsi.map((e) => `""` + `,` + `""` + `,` + `"${formatCurr(e)}"`).join(','),
      `""`, `""`, `"${formatCurr(grandEmprEsi)}"`,
      `""`, `""`
    ].join(',')
  );

  lines.push(
    [
      `""`,
      `"Total Value Of Contribution : ( Rounded Off )"`,
      ...sumEmpEsi.map((e, i) => `""` + `,` + `""` + `,` + `"${formatCurr(e + sumEmprEsi[i])}"`).join(','),
      `""`, `""`, `"${formatCurr(grandTotalContrib)}"`,
      `""`, `""`
    ].join(',')
  );

  lines.push(``);
  lines.push(`"Paid Challan No. :","${options.challanNo || ''}"`);
  const todayStr = new Date().toLocaleDateString('en-GB');
  lines.push(`"Date             :","${options.submissionDate || todayStr}"`);

  const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + lines.join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `ESI_Form_7_Half_Yearly_Option2_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Statutory Landscape PDF Generator and Print Handler for Option 2
 */
export const downloadEsiForm7Option2Pdf = (
  records = [],
  companyInfo = {},
  period = {},
  totals = {},
  monthlySummaries = [],
  options = {}
) => {
  const { months, periodHeader } = formatPeriodDates(period);

  const mHeaders = months.map((m) => {
    const namePart = (m.name || '').slice(0, 3);
    const yrPart = (m.monthStr || '').slice(0, 4);
    return yrPart ? `${namePart}, ${yrPart}` : (m.name || 'Month');
  });

  // A4 Landscape is 842 x 595 pt
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'pt',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();

  // Top Statutory Headings
  doc.setFont('courier', 'bold');
  doc.setFontSize(13);
  doc.text('Form 7', pageWidth / 2, 28, { align: 'center' });

  doc.setFontSize(12);
  doc.text('REGISTER OF EMPLOYEES', pageWidth / 2, 43, { align: 'center' });

  doc.setFontSize(10);
  doc.text('(REGULATION 32)', pageWidth / 2, 56, { align: 'center' });

  doc.setFont('courier', 'normal');
  doc.setFontSize(9);
  doc.text(periodHeader, pageWidth / 2, 70, { align: 'center' });

  // Prepare autoTable headers
  const head = [
    // Header Row 1
    [
      { content: 'Sl.\nNo.', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
      { content: 'Name Of Insured Person (2)\nInsurance (3) Dispensary (3A)', rowSpan: 2, styles: { halign: 'left', valign: 'middle' } },
      { content: mHeaders[0], colSpan: 3, styles: { halign: 'center' } },
      { content: mHeaders[1], colSpan: 3, styles: { halign: 'center' } },
      { content: mHeaders[2], colSpan: 3, styles: { halign: 'center' } },
      { content: mHeaders[3], colSpan: 3, styles: { halign: 'center' } },
      { content: mHeaders[4], colSpan: 3, styles: { halign: 'center' } },
      { content: mHeaders[5], colSpan: 3, styles: { halign: 'center' } },
      { content: 'Total', colSpan: 3, styles: { halign: 'center' } },
      { content: 'Daily\nWages', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
      { content: 'Rem.', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } }
    ],
    // Header Row 2
    [
      { content: 'No.Of\nDays' }, { content: 'Wages\nPaid' }, { content: 'Empl.\nE.S.I.' },
      { content: 'No.Of\nDays' }, { content: 'Wages\nPaid' }, { content: 'Empl.\nE.S.I.' },
      { content: 'No.Of\nDays' }, { content: 'Wages\nPaid' }, { content: 'Empl.\nE.S.I.' },
      { content: 'No.Of\nDays' }, { content: 'Wages\nPaid' }, { content: 'Empl.\nE.S.I.' },
      { content: 'No.Of\nDays' }, { content: 'Wages\nPaid' }, { content: 'Empl.\nE.S.I.' },
      { content: 'No.Of\nDays' }, { content: 'Wages\nPaid' }, { content: 'Empl.\nE.S.I.' },
      { content: 'No.Of\nDays' }, { content: 'Wages\nPaid' }, { content: 'Empl.\nE.S.I.' }
    ],
    // Header Row 3 (Col numbers matching reference image)
    [
      { content: '1', styles: { halign: 'center' } },
      { content: '', styles: { halign: 'center' } },
      { content: '4', styles: { halign: 'center' } }, { content: '5', styles: { halign: 'center' } }, { content: '6', styles: { halign: 'center' } },
      { content: '7', styles: { halign: 'center' } }, { content: '8', styles: { halign: 'center' } }, { content: '9', styles: { halign: 'center' } },
      { content: '10', styles: { halign: 'center' } }, { content: '11', styles: { halign: 'center' } }, { content: '12', styles: { halign: 'center' } },
      { content: '13', styles: { halign: 'center' } }, { content: '14', styles: { halign: 'center' } }, { content: '15', styles: { halign: 'center' } },
      { content: '16', styles: { halign: 'center' } }, { content: '17', styles: { halign: 'center' } }, { content: '18', styles: { halign: 'center' } },
      { content: '19', styles: { halign: 'center' } }, { content: '20', styles: { halign: 'center' } }, { content: '21', styles: { halign: 'center' } },
      { content: '22', styles: { halign: 'center' } }, { content: '23', styles: { halign: 'center' } }, { content: '24', styles: { halign: 'center' } },
      { content: '', styles: { halign: 'center' } },
      { content: '', styles: { halign: 'center' } }
    ]
  ];

  // Body rows: 2 rows per employee
  const body = [];
  records.forEach((r, idx) => {
    const m = r.months || [];
    body.push([
      { content: String(r.srNo || idx + 1), styles: { halign: 'center', fontStyle: 'bold' } },
      { content: r.name ? String(r.name).toUpperCase() : '', styles: { fontStyle: 'bold' } },
      { content: formatDays(m[0]?.days), styles: { halign: 'right' } },
      { content: formatCurr(m[0]?.wages), styles: { halign: 'right' } },
      { content: formatCurr(m[0]?.employeeShare), styles: { halign: 'right' } },
      { content: formatDays(m[1]?.days), styles: { halign: 'right' } },
      { content: formatCurr(m[1]?.wages), styles: { halign: 'right' } },
      { content: formatCurr(m[1]?.employeeShare), styles: { halign: 'right' } },
      { content: formatDays(m[2]?.days), styles: { halign: 'right' } },
      { content: formatCurr(m[2]?.wages), styles: { halign: 'right' } },
      { content: formatCurr(m[2]?.employeeShare), styles: { halign: 'right' } },
      { content: formatDays(m[3]?.days), styles: { halign: 'right' } },
      { content: formatCurr(m[3]?.wages), styles: { halign: 'right' } },
      { content: formatCurr(m[3]?.employeeShare), styles: { halign: 'right' } },
      { content: formatDays(m[4]?.days), styles: { halign: 'right' } },
      { content: formatCurr(m[4]?.wages), styles: { halign: 'right' } },
      { content: formatCurr(m[4]?.employeeShare), styles: { halign: 'right' } },
      { content: formatDays(m[5]?.days), styles: { halign: 'right' } },
      { content: formatCurr(m[5]?.wages), styles: { halign: 'right' } },
      { content: formatCurr(m[5]?.employeeShare), styles: { halign: 'right' } },
      { content: formatDays(r.totalDays), styles: { halign: 'right', fontStyle: 'bold' } },
      { content: formatCurr(r.totalWages), styles: { halign: 'right', fontStyle: 'bold' } },
      { content: formatCurr(r.totalEmployeeContribution), styles: { halign: 'right', fontStyle: 'bold' } },
      { content: formatCurr(r.dailyWage), styles: { halign: 'right' } },
      { content: r.remarks || '', styles: { halign: 'center' } }
    ]);

    // Second line of employee
    body.push([
      { content: '' },
      {
        content: `${r.insuranceNo || '—'}    ${r.dispensaryRemarks || ''}`.trim(),
        styles: { fontStyle: 'normal', textColor: [60, 60, 60] }
      },
      { content: '' }, { content: '' }, { content: '' },
      { content: '' }, { content: '' }, { content: '' },
      { content: '' }, { content: '' }, { content: '' },
      { content: '' }, { content: '' }, { content: '' },
      { content: '' }, { content: '' }, { content: '' },
      { content: '' }, { content: '' }, { content: '' },
      { content: '' }, { content: '' }, { content: '' },
      { content: '' },
      { content: '' }
    ]);
  });

  // Calculate sums
  const sumDays = [0, 0, 0, 0, 0, 0];
  const sumWages = [0, 0, 0, 0, 0, 0];
  const sumEmpEsi = [0, 0, 0, 0, 0, 0];
  const sumEmprEsi = [0, 0, 0, 0, 0, 0];

  records.forEach((r) => {
    const m = r.months || [];
    for (let i = 0; i < 6; i++) {
      sumDays[i] += Number(m[i]?.days) || 0;
      sumWages[i] += Number(m[i]?.wages) || 0;
      sumEmpEsi[i] += Number(m[i]?.employeeShare) || 0;
      sumEmprEsi[i] += Number(m[i]?.employerShare) || Math.round((Number(m[i]?.wages) || 0) * 0.0325);
    }
  });

  const grandDays = totals?.grandTotalDays ?? sumDays.reduce((a, b) => a + b, 0);
  const grandWages = totals?.grandTotalWages ?? sumWages.reduce((a, b) => a + b, 0);
  const grandEmpEsi = totals?.grandTotalEmployeeContribution ?? sumEmpEsi.reduce((a, b) => a + b, 0);
  const grandEmprEsi = totals?.grandTotalEmployerContribution ?? sumEmprEsi.reduce((a, b) => a + b, 0);
  const grandTotalContrib = grandEmpEsi + grandEmprEsi;

  // Summary Row 1: Total :
  body.push([
    { content: '', styles: { fontStyle: 'bold' } },
    { content: 'Total :', styles: { fontStyle: 'bold', halign: 'left' } },
    { content: formatDays(sumDays[0]), styles: { halign: 'right', fontStyle: 'bold' } },
    { content: formatCurr(sumWages[0]), styles: { halign: 'right', fontStyle: 'bold' } },
    { content: formatCurr(sumEmpEsi[0]), styles: { halign: 'right', fontStyle: 'bold' } },
    { content: formatDays(sumDays[1]), styles: { halign: 'right', fontStyle: 'bold' } },
    { content: formatCurr(sumWages[1]), styles: { halign: 'right', fontStyle: 'bold' } },
    { content: formatCurr(sumEmpEsi[1]), styles: { halign: 'right', fontStyle: 'bold' } },
    { content: formatDays(sumDays[2]), styles: { halign: 'right', fontStyle: 'bold' } },
    { content: formatCurr(sumWages[2]), styles: { halign: 'right', fontStyle: 'bold' } },
    { content: formatCurr(sumEmpEsi[2]), styles: { halign: 'right', fontStyle: 'bold' } },
    { content: formatDays(sumDays[3]), styles: { halign: 'right', fontStyle: 'bold' } },
    { content: formatCurr(sumWages[3]), styles: { halign: 'right', fontStyle: 'bold' } },
    { content: formatCurr(sumEmpEsi[3]), styles: { halign: 'right', fontStyle: 'bold' } },
    { content: formatDays(sumDays[4]), styles: { halign: 'right', fontStyle: 'bold' } },
    { content: formatCurr(sumWages[4]), styles: { halign: 'right', fontStyle: 'bold' } },
    { content: formatCurr(sumEmpEsi[4]), styles: { halign: 'right', fontStyle: 'bold' } },
    { content: formatDays(sumDays[5]), styles: { halign: 'right', fontStyle: 'bold' } },
    { content: formatCurr(sumWages[5]), styles: { halign: 'right', fontStyle: 'bold' } },
    { content: formatCurr(sumEmpEsi[5]), styles: { halign: 'right', fontStyle: 'bold' } },
    { content: formatDays(grandDays), styles: { halign: 'right', fontStyle: 'bold' } },
    { content: formatCurr(grandWages), styles: { halign: 'right', fontStyle: 'bold' } },
    { content: formatCurr(grandEmpEsi), styles: { halign: 'right', fontStyle: 'bold' } },
    { content: '', styles: { fontStyle: 'bold' } },
    { content: '', styles: { fontStyle: 'bold' } }
  ]);

  // Summary Row 2: Employer's Share of Contribution :
  body.push([
    { content: '' },
    { content: "Employer's Share of Contribution :", styles: { fontStyle: 'bold', halign: 'left' } },
    { content: '' }, { content: '' }, { content: formatCurr(sumEmprEsi[0]), styles: { halign: 'right', fontStyle: 'bold' } },
    { content: '' }, { content: '' }, { content: formatCurr(sumEmprEsi[1]), styles: { halign: 'right', fontStyle: 'bold' } },
    { content: '' }, { content: '' }, { content: formatCurr(sumEmprEsi[2]), styles: { halign: 'right', fontStyle: 'bold' } },
    { content: '' }, { content: '' }, { content: formatCurr(sumEmprEsi[3]), styles: { halign: 'right', fontStyle: 'bold' } },
    { content: '' }, { content: '' }, { content: formatCurr(sumEmprEsi[4]), styles: { halign: 'right', fontStyle: 'bold' } },
    { content: '' }, { content: '' }, { content: formatCurr(sumEmprEsi[5]), styles: { halign: 'right', fontStyle: 'bold' } },
    { content: '' }, { content: '' }, { content: formatCurr(grandEmprEsi), styles: { halign: 'right', fontStyle: 'bold' } },
    { content: '' },
    { content: '' }
  ]);

  // Summary Row 3: Total Value Of Contribution : ( Rounded Off )
  body.push([
    { content: '' },
    { content: 'Total Value Of Contribution :\n( Rounded Off )', styles: { fontStyle: 'bold', halign: 'left' } },
    { content: '' }, { content: '' }, { content: formatCurr(sumEmpEsi[0] + sumEmprEsi[0]), styles: { halign: 'right', fontStyle: 'bold' } },
    { content: '' }, { content: '' }, { content: formatCurr(sumEmpEsi[1] + sumEmprEsi[1]), styles: { halign: 'right', fontStyle: 'bold' } },
    { content: '' }, { content: '' }, { content: formatCurr(sumEmpEsi[2] + sumEmprEsi[2]), styles: { halign: 'right', fontStyle: 'bold' } },
    { content: '' }, { content: '' }, { content: formatCurr(sumEmpEsi[3] + sumEmprEsi[3]), styles: { halign: 'right', fontStyle: 'bold' } },
    { content: '' }, { content: '' }, { content: formatCurr(sumEmpEsi[4] + sumEmprEsi[4]), styles: { halign: 'right', fontStyle: 'bold' } },
    { content: '' }, { content: '' }, { content: formatCurr(sumEmpEsi[5] + sumEmprEsi[5]), styles: { halign: 'right', fontStyle: 'bold' } },
    { content: '' }, { content: '' }, { content: formatCurr(grandTotalContrib), styles: { halign: 'right', fontStyle: 'bold' } },
    { content: '' },
    { content: '' }
  ]);

  autoTable(doc, {
    head,
    body,
    startY: 82,
    theme: 'plain',
    styles: {
      font: 'courier',
      fontSize: 6.5,
      cellPadding: 1.8,
      overflow: 'linebreak',
      lineWidth: 0.3,
      lineColor: [100, 100, 100],
      textColor: [0, 0, 0],
    },
    headStyles: {
      fillColor: [245, 245, 245],
      textColor: [0, 0, 0],
      fontStyle: 'bold',
      lineWidth: 0.5,
      lineColor: [60, 60, 60],
    },
    columnStyles: {
      0: { cellWidth: 20, halign: 'center' }, // Sl
      1: { cellWidth: 105 }, // Name / Insurance / Dispensary
      // 6 months (3 cols each = 18 cols):
      2: { cellWidth: 28 }, 3: { cellWidth: 34 }, 4: { cellWidth: 28 },
      5: { cellWidth: 28 }, 6: { cellWidth: 34 }, 7: { cellWidth: 28 },
      8: { cellWidth: 28 }, 9: { cellWidth: 34 }, 10: { cellWidth: 28 },
      11: { cellWidth: 28 }, 12: { cellWidth: 34 }, 13: { cellWidth: 28 },
      14: { cellWidth: 28 }, 15: { cellWidth: 34 }, 16: { cellWidth: 28 },
      17: { cellWidth: 28 }, 18: { cellWidth: 34 }, 19: { cellWidth: 28 },
      // Total (3 cols):
      20: { cellWidth: 28 }, 21: { cellWidth: 36 }, 22: { cellWidth: 30 },
      23: { cellWidth: 34, halign: 'right' }, // Daily Wages
      24: { cellWidth: 25, halign: 'center' }, // Rem
    },
    margin: { top: 20, right: 18, bottom: 40, left: 18 },
    didDrawPage: (data) => {
      // Bottom Challan details
      const finalY = data.cursor.y + 12;
      doc.setFont('courier', 'normal');
      doc.setFontSize(8);
      doc.text(`Paid Challan No. : ${options.challanNo || ''}`, 22, finalY);
      const todayStr = new Date().toLocaleDateString('en-GB');
      doc.text(`Date             : ${options.submissionDate || todayStr}`, 22, finalY + 12);
    }
  });

  if (options.mode === 'print') {
    doc.autoPrint();
    const blobUrl = doc.output('bloburl');
    window.open(blobUrl, '_blank');
  } else {
    doc.save(`ESI_Form_7_Half_Yearly_Option2_${new Date().toISOString().slice(0, 10)}.pdf`);
  }
};
