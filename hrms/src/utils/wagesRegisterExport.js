import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { downloadElementAsPdf } from './domPdfExportUtil';

/**
 * Download Statutory Register of Wages (Form XVII) as Excel (.xlsx) / CSV
 * [FORM XVII, See Rule 78 (1) (a) (i) of Contract Labour (Regulation & Abolition) Central Rules, 1971]
 * Matches exact structure shown in user-uploaded Form XVII images.
 */
export const downloadWagesRegisterExcel = (
  records = [],
  companyInfo = {},
  period = {},
  totals = {},
  pfSummary = {},
  esiSummary = {},
  establishmentInfo = {},
  options = {}
) => {
  const est = establishmentInfo || {};
  const contractorName = est.contractorName || companyInfo?.name || 'RR SECURITY & FACILITIES';
  const contractorAddress =
    est.contractorAddress ||
    companyInfo?.address ||
    'G-75/A, Ground Floor, Block-G, M.B. EXTN., Badarpur New Delhi-110044';
  const workLocation =
    est.natureAndLocationOfWork ||
    'STAR TRACK TERMINALS PVT. LTD. ICD DADRI TILPATA ROAD, DADRI GREATER NOIDA';
  const establishmentFull =
    est.establishmentName && est.establishmentAddress
      ? `${est.establishmentName}, ${est.establishmentAddress}`
      : 'STAR TRACK TERMINALS PRIVATE LIMITED, ICD DADRI, TILPATA ROAD, DADRI GREATER NOIDA 201311';
  const principalEmployer = est.principalEmployer || 'STAR TRACK TERMINALS PRIVATE LIMITED';
  const wagesPeriod = est.wagesPeriod || period?.wagesPeriod || period?.monthLabel || 'Current Period';

  const aoa = [
    // Row 1: Statutory Title
    ['FORM XVII (See rule 78 (1) (a) (i))'],
    // Row 2: Rule Title
    ['Contract Labour (Regulation & Abolition) Central Rule, 1971,        Register of Wages'],
    // Row 3: Blank
    [''],
    // Rows 4-6: Establishment Information Block
    [
      'Name and Address of Contractor :',
      `${contractorName}, ${contractorAddress}`,
      '',
      '',
      '',
      'Name and Address of establishment in/ under which contract is carrier on :',
      establishmentFull,
    ],
    [
      'Nature and location of work :',
      workLocation,
      '',
      '',
      '',
      'Name & Address of Principal Employer :',
      principalEmployer,
    ],
    ['Wages Period :', wagesPeriod, '', '', '', '', ''],
    // Row 7: Blank
    [''],
    // Row 8: Level 1 Column Headers
    [
      'Sr. No.',
      'Name of workman',
      "Father's/ Husband's Name",
      'PF No.',
      'UAN',
      'ESI No',
      'D.O.J',
      'S.No. in the register of workman',
      'Designation',
      'No. of days/ Unit of work done',
      'O.T',
      'Daily rate of wages/ Piece rate',
      'Basic',
      'HRA',
      'Conveyance',
      'V.D.A.',
      'ALLO_BON',
      'SPL_ALLO',
      'EXTRA_TIME',
      'G_W_REWA',
      'Other All',
      'O.T. Wages',
      'LEAVE_PA',
      'Total Wages Earned',
      'P.F. Deduction',
      'ESIC Deduction',
      'Other Ded.',
      'Advance',
      'Total Deduction',
      'Net Amount paid',
      'Signature/Thumb Impression of Employee',
      'Initial of contractor or his Rep. (Bank A/c)',
    ],
  ];

  // Data rows
  records.forEach((r, idx) => {
    const ern = r.earnings || {};
    const ded = r.deductions || {};
    aoa.push([
      r.srNo || idx + 1,
      r.name || '—',
      r.fatherHusbandName || '—',
      r.pfNo || '—',
      r.uan || '—',
      r.esiNo || '—',
      r.doj || '—',
      r.sNoInRegisterOfWorkman || '—',
      r.designation || 'Staff',
      Number(r.daysWorked || 0),
      r.otHours !== '' ? Number(r.otHours) : '',
      Number(r.dailyRate || 0),
      Number(ern.basic || 0),
      Number(ern.hra || 0),
      Number(ern.conveyance || 0),
      Number(ern.vda || 0),
      Number(ern.alloBon || 0),
      Number(ern.splAllo || 0),
      Number(ern.extraTime || 0),
      Number(ern.gwRewa || 0),
      Number(ern.otherAll || 0),
      Number(ern.otAmount || 0),
      Number(ern.leavePa || 0),
      Number(ern.totalEarned || 0),
      Number(ded.pf || 0),
      Number(ded.esic || 0),
      Number(ded.otherDed || 0),
      Number(ded.advance || 0),
      Number(ded.totalDeduction || 0),
      Number(r.netPaid || 0),
      '',
      r.bankAccount ? r.bankAccount.replace('\n', ' ') : '—',
    ]);
  });

  // Grand Totals row (Row matching Image 3)
  aoa.push([
    '',
    `Total Workmen: ${totals?.totalEmployees ?? records.length}`,
    '',
    '',
    '',
    '',
    '',
    '',
    'Grand Total',
    Number(totals?.grandDaysWorked ?? 0),
    totals?.grandOtHours ? Number(totals.grandOtHours) : '',
    '',
    Number(totals?.grandBasic ?? 0),
    Number(totals?.grandHra ?? 0),
    Number(totals?.grandConveyance ?? 0),
    Number(totals?.grandVda ?? 0),
    Number(totals?.grandAlloBon ?? 0),
    Number(totals?.grandSplAllo ?? 0),
    Number(totals?.grandExtraTime ?? 0),
    Number(totals?.grandGwRewa ?? 0),
    Number(totals?.grandOtherAll ?? 0),
    Number(totals?.grandOtAmount ?? 0),
    Number(totals?.grandLeavePa ?? 0),
    Number(totals?.grandGrossEarned ?? 0),
    Number(totals?.grandPf ?? 0),
    Number(totals?.grandEsic ?? 0),
    Number(totals?.grandOtherDed ?? 0),
    Number(totals?.grandAdvance ?? 0),
    Number(totals?.grandTotalDeduction ?? 0),
    Number(totals?.grandNetPaid ?? 0),
    '',
    'Verified Statutory',
  ]);

  // Blank line
  aoa.push(['']);
  aoa.push(['']);

  // Statutory Reconciliation Sections from Image 3
  const pf = pfSummary || {};
  const esi = esiSummary || {};

  aoa.push(['--- STATUTORY SUMMARY RECONCILIATION ---']);
  aoa.push(['Summary ESI :-', '', '', '', 'Summary P.F :-', '', '', '']);
  aoa.push([
    'No. of Employee',
    esi.noOfEmployees || totals?.totalEmployees || records.length,
    '',
    '',
    'Particulars',
    'A/c No. 1',
    'A/c No. 10',
    'A/c No. 21',
  ]);
  aoa.push([
    'Total Wages',
    esi.totalWages || totals?.grandGrossEarned || 0,
    '',
    '',
    'Total No. of Subscr.',
    pf.subscribersCount || records.length,
    pf.subscribersCount || records.length,
    pf.subscribersCount || records.length,
  ]);
  aoa.push([
    'Employer Contri (3.25%)',
    esi.employerContribution || 0,
    '',
    '',
    'Total Wages',
    pf.totalWages || 0,
    pf.totalWages || 0,
    pf.totalWages || 0,
  ]);
  aoa.push([
    'Employee Contri (0.75%)',
    esi.employeeContribution || totals?.grandEsic || 0,
    '',
    '',
    "Employee's share A/c 1 (12%)",
    pf.employeeShareAc1 || totals?.grandPf || 0,
    '',
    '',
  ]);
  aoa.push([
    'Total Contribution (4.0%)',
    esi.totalContribution || 0,
    '',
    '',
    "Employer's share A/c 1 (3.67%)",
    pf.employerShareAc1 || 0,
    '',
    '',
  ]);
  aoa.push([
    '',
    '',
    '',
    '',
    "Employer's share A/c 10 (8.33%)",
    pf.employerShareAc10 || 0,
    '',
    '',
  ]);
  aoa.push([
    '',
    '',
    '',
    '',
    'A/c No. 21 (EDLI 0.5%)',
    pf.ac21Edli || 0,
    '',
    '',
  ]);
  aoa.push([
    '',
    '',
    '',
    '',
    'Adm. Ch. A/c No. 2 (0.5%)',
    pf.ac2AdminCharges || 0,
    '',
    '',
  ]);
  aoa.push([
    '',
    '',
    '',
    '',
    'Total payment of PF',
    pf.totalPaymentPf || 0,
    '',
    '',
  ]);

  const ws = XLSX.utils.aoa_to_sheet(aoa);

  // Set column widths
  ws['!cols'] = [
    { wch: 6 },  // Sr No
    { wch: 22 }, // Name
    { wch: 20 }, // Father's Name
    { wch: 14 }, // PF No
    { wch: 16 }, // UAN
    { wch: 14 }, // ESI No
    { wch: 12 }, // DOJ
    { wch: 12 }, // SNo Reg
    { wch: 16 }, // Designation
    { wch: 10 }, // Days
    { wch: 8 },  // OT
    { wch: 12 }, // Daily Rate
    { wch: 12 }, // Basic
    { wch: 8 },  // HRA
    { wch: 12 }, // Conv
    { wch: 10 }, // VDA
    { wch: 10 }, // Allo Bon
    { wch: 10 }, // Spl Allo
    { wch: 10 }, // Extra Time
    { wch: 10 }, // GW Rewa
    { wch: 10 }, // Other All
    { wch: 12 }, // OT Wages
    { wch: 10 }, // Leave Pa
    { wch: 14 }, // Total Wages
    { wch: 12 }, // PF
    { wch: 10 }, // ESIC
    { wch: 10 }, // Other Ded
    { wch: 10 }, // Advance
    { wch: 12 }, // Total Ded
    { wch: 14 }, // Net Paid
    { wch: 16 }, // Signature
    { wch: 24 }, // Bank A/c
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Form XVII Register of Wages');

  const fileExt = options?.format === 'csv' ? 'csv' : 'xlsx';
  const cleanMonth = (period?.month || 'current').replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `Register_of_Wages_Form_XVII_${cleanMonth}.${fileExt}`;

  if (fileExt === 'csv') {
    XLSX.writeFile(wb, filename, { bookType: 'csv' });
  } else {
    XLSX.writeFile(wb, filename, { bookType: 'xlsx' });
  }
};

/**
 * Download Statutory Register of Wages (Form XVII) as Landscape PDF
 * or trigger direct print mode.
 */
export const downloadWagesRegisterPdf = async (
  records = [],
  companyInfo = {},
  period = {},
  totals = {},
  pfSummary = {},
  esiSummary = {},
  establishmentInfo = {},
  options = {}
) => {
  const isPrint = options?.mode === 'print';

  // Live preview capture for exact styling/layout parity
  if (typeof document !== 'undefined') {
    const previewEl = document.querySelector('#report-preview-capture-area') || document.querySelector('[class*="WagesRegisterFormXVIILReportView_paperSheet"]');
    if (previewEl) {
      const cleanMonth = (period?.monthLabel || period?.month || 'Current').replace(/[^a-zA-Z0-9_-]/g, '_');
      const ok = await downloadElementAsPdf(previewEl, {
        filename: `Form_XVII_Register_of_Wages_${cleanMonth}.pdf`,
        title: 'Form XVII Register of Wages',
        mode: isPrint ? 'print' : 'download',
        orientation: 'landscape',
        format: 'a3',
      });
      if (ok) return;
    }
  }

  // Use A3 landscape for rich readability of multi-column wage register
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a3',
  });

  const est = establishmentInfo || {};
  const contractorName = est.contractorName || companyInfo?.name || 'RR SECURITY & FACILITIES';
  const contractorAddress =
    est.contractorAddress ||
    companyInfo?.address ||
    'G-75/A, Ground Floor, Block-G, M.B. EXTN., Badarpur New Delhi-110044';
  const workLocation =
    est.natureAndLocationOfWork ||
    'STAR TRACK TERMINALS PVT. LTD. ICD DADRI TILPATA ROAD, DADRI GREATER NOIDA';
  const establishmentFull =
    est.establishmentName && est.establishmentAddress
      ? `${est.establishmentName}, ${est.establishmentAddress}`
      : 'STAR TRACK TERMINALS PRIVATE LIMITED, ICD DADRI, TILPATA ROAD, DADRI GREATER NOIDA 201311';
  const principalEmployer = est.principalEmployer || 'STAR TRACK TERMINALS PRIVATE LIMITED';
  const wagesPeriod = est.wagesPeriod || period?.wagesPeriod || period?.monthLabel || 'Current Period';

  // Header Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('FORM XVII (See rule 78 (1) (a) (i))', 210, 14, { align: 'center' });

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text('Contract Labour (Regulation & Abolition) Central Rule, 1971,        Register of Wages', 210, 20, {
    align: 'center',
  });

  // Establishment Info Box
  doc.setDrawColor(30, 41, 59);
  doc.setLineWidth(0.3);
  doc.rect(14, 24, 392, 28);

  // Vertical divider in the box
  doc.line(210, 24, 210, 52);

  doc.setFontSize(8.5);
  // Left Box Content
  doc.setFont('helvetica', 'bold');
  doc.text('Name and Address of Contractor :', 16, 29);
  doc.setFont('helvetica', 'normal');
  doc.text(`${contractorName}, ${contractorAddress}`, 64, 29, { maxWidth: 142 });

  doc.setFont('helvetica', 'bold');
  doc.text('Nature and location of work :', 16, 38);
  doc.setFont('helvetica', 'normal');
  doc.text(workLocation, 64, 38, { maxWidth: 142 });

  doc.setFont('helvetica', 'bold');
  doc.text('Wages Period :', 16, 47);
  doc.setFont('helvetica', 'bold');
  doc.text(wagesPeriod, 64, 47);

  // Right Box Content
  doc.setFont('helvetica', 'bold');
  doc.text('Name and Address of establishment in/ under which contract is carrier on :', 214, 29);
  doc.setFont('helvetica', 'normal');
  doc.text(establishmentFull, 214, 35, { maxWidth: 188 });

  doc.setFont('helvetica', 'bold');
  doc.text('Name & Address of Principal Employer :', 214, 43);
  doc.setFont('helvetica', 'normal');
  doc.text(principalEmployer, 280, 43, { maxWidth: 122 });

  // Table Body Rows
  const tableRows = records.map((r, idx) => {
    const ern = r.earnings || {};
    const ded = r.deductions || {};

    const workmanDetails = [
      r.name || '—',
      r.fatherHusbandName || '—',
      `${r.pfNo || 'PF: —'}    ${r.doj ? `DOJ: ${r.doj}` : ''}`,
      r.uan || 'UAN: —',
      r.esiNo || 'ESI: —',
    ].filter(Boolean).join('\n');

    const earningsBreakdown = [
      `Basic: ${Number(ern.basic || 0).toLocaleString('en-IN')}`,
      `V.D.A: ${Number(ern.vda || 0).toLocaleString('en-IN')}`,
      ern.splAllo ? `Spl: ${Number(ern.splAllo).toLocaleString('en-IN')}` : '',
      ern.leavePa ? `Leave: ${Number(ern.leavePa).toLocaleString('en-IN')}` : '',
      ern.otAmount ? `OT: ${Number(ern.otAmount).toLocaleString('en-IN')}` : '',
      `Total: ${Number(ern.totalEarned || 0).toLocaleString('en-IN')}`,
    ].filter(Boolean).join('\n');

    const deductionsBreakdown = [
      `PF: ${Number(ded.pf || 0).toLocaleString('en-IN')}`,
      `ESIC: ${Number(ded.esic || 0).toLocaleString('en-IN')}`,
    ].join('\n');

    const otherDedBreakdown = [
      ded.otherDed ? `Other: ${Number(ded.otherDed).toLocaleString('en-IN')}` : '',
      ded.advance ? `Adv: ${Number(ded.advance).toLocaleString('en-IN')}` : '',
      `Total: ${Number(ded.totalDeduction || 0).toLocaleString('en-IN')}`,
    ].filter(Boolean).join('\n');

    return [
      r.srNo || idx + 1,
      workmanDetails,
      r.sNoInRegisterOfWorkman || '—',
      r.designation || 'Staff',
      Number(r.daysWorked || 0).toFixed(1),
      r.otHours ? Number(r.otHours).toFixed(1) : '',
      Number(r.dailyRate || 0).toFixed(2),
      earningsBreakdown,
      deductionsBreakdown,
      otherDedBreakdown,
      Number(r.netPaid || 0).toLocaleString('en-IN'),
      '', // Signature space
      r.bankAccount || '—',
    ];
  });

  // Table Columns Setup
  autoTable(doc, {
    startY: 56,
    margin: { left: 14, right: 14, bottom: 20 },
    theme: 'grid',
    styles: {
      fontSize: 8,
      cellPadding: 2,
      textColor: [15, 23, 42],
      lineColor: [51, 65, 85],
      lineWidth: 0.2,
      valign: 'middle',
    },
    headStyles: {
      fillColor: [241, 245, 249],
      textColor: [15, 23, 42],
      fontStyle: 'bold',
      halign: 'center',
      valign: 'middle',
    },
    head: [
      [
        'Sr. No.',
        "Name of workman\nFather's/ Husband's Name\nPF No. / UAN / ESI No / D.O.J",
        'S.No. in\nregister\nof wrokman',
        'Designation',
        'No. of\ndays/ Unit\nof work\ndone',
        'O.T',
        'Daily rate\nof wages/\nPiece rate',
        'Amt. of wages earned\nBasic, VDA, Spl, Leave, OT\nTotal',
        'P.F.\nESIC',
        'Other Ded.\nAdvance\nTotal Deduction',
        'Net\nAmount\npaid',
        'Signature/Thumb\nImpression of\nEmployee',
        'Initial of\ncontractor\nor his Rep.',
      ],
    ],
    body: tableRows,
    foot: [
      [
        '',
        `Total Employees: ${totals?.totalEmployees ?? records.length}`,
        '',
        'Grand Total',
        Number(totals?.grandDaysWorked ?? 0).toFixed(1),
        totals?.grandOtHours ? Number(totals.grandOtHours).toFixed(1) : '',
        '',
        `Basic: ₹${Number(totals?.grandBasic ?? 0).toLocaleString('en-IN')}\nTotal Earned: ₹${Number(totals?.grandGrossEarned ?? 0).toLocaleString('en-IN')}`,
        `PF: ₹${Number(totals?.grandPf ?? 0).toLocaleString('en-IN')}\nESIC: ₹${Number(totals?.grandEsic ?? 0).toLocaleString('en-IN')}`,
        `Total Ded:\n₹${Number(totals?.grandTotalDeduction ?? 0).toLocaleString('en-IN')}`,
        `₹${Number(totals?.grandNetPaid ?? 0).toLocaleString('en-IN')}`,
        '',
        'Statutory Verified',
      ],
    ],
    footStyles: {
      fillColor: [226, 232, 240],
      textColor: [15, 23, 42],
      fontStyle: 'bold',
      halign: 'center',
    },
    columnStyles: {
      0: { cellWidth: 12, halign: 'center' },
      1: { cellWidth: 55, halign: 'left' },
      2: { cellWidth: 18, halign: 'center' },
      3: { cellWidth: 26, halign: 'left' },
      4: { cellWidth: 18, halign: 'center' },
      5: { cellWidth: 14, halign: 'center' },
      6: { cellWidth: 20, halign: 'right' },
      7: { cellWidth: 54, halign: 'left' },
      8: { cellWidth: 28, halign: 'left' },
      9: { cellWidth: 28, halign: 'left' },
      10: { cellWidth: 26, halign: 'right', fontStyle: 'bold' },
      11: { cellWidth: 35, halign: 'center' },
      12: { cellWidth: 58, halign: 'left' },
    },
    didDrawPage: (data) => {
      // Footer page numbering like Image 1, 2: "Page No. 1"
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.text(`Page No.      ${data.pageNumber}`, 16, 287);
    },
  });

  // Append Statutory Reconciliation Summary on final page if space allows or as summary box
  const pf = pfSummary || {};
  const esi = esiSummary || {};

  const currentY = doc.lastAutoTable.finalY + 8;
  if (currentY < 230) {
    // Render ESI and PF summary boxes side by side
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('Summary ESI :-', 16, currentY);

    autoTable(doc, {
      startY: currentY + 2,
      margin: { left: 16 },
      tableWidth: 120,
      theme: 'grid',
      styles: { fontSize: 7.5, cellPadding: 1.5 },
      body: [
        ['No. of Employee', String(esi.noOfEmployees || totals?.totalEmployees || records.length)],
        ['Total Wages', `₹${Number(esi.totalWages || totals?.grandGrossEarned || 0).toLocaleString('en-IN')}`],
        ['Employer Contri (3.25%)', `₹${Number(esi.employerContribution || 0).toLocaleString('en-IN')}`],
        ['Employee Contri (0.75%)', `₹${Number(esi.employeeContribution || totals?.grandEsic || 0).toLocaleString('en-IN')}`],
        ['Total Contribution (4.0%)', `₹${Number(esi.totalContribution || 0).toLocaleString('en-IN')}`],
      ],
    });

    doc.text('Summary P.F :-', 150, currentY);
    autoTable(doc, {
      startY: currentY + 2,
      margin: { left: 150 },
      tableWidth: 240,
      theme: 'grid',
      styles: { fontSize: 7.5, cellPadding: 1.5 },
      head: [['Particulars', 'A/c No. 1', 'A/c No. 10', 'A/c No. 21', 'A/c No. 2', 'Total']],
      body: [
        [
          'Total No. of Subscr.',
          String(pf.subscribersCount || records.length),
          String(pf.subscribersCount || records.length),
          String(pf.subscribersCount || records.length),
          '—',
          String(pf.subscribersCount || records.length),
        ],
        [
          'Total Wages',
          `₹${Number(pf.totalWages || 0).toLocaleString('en-IN')}`,
          `₹${Number(pf.totalWages || 0).toLocaleString('en-IN')}`,
          `₹${Number(pf.totalWages || 0).toLocaleString('en-IN')}`,
          '—',
          `₹${Number(pf.totalWages || 0).toLocaleString('en-IN')}`,
        ],
        [
          "Employee's share (12%)",
          `₹${Number(pf.employeeShareAc1 || totals?.grandPf || 0).toLocaleString('en-IN')}`,
          '—',
          '—',
          '—',
          `₹${Number(pf.employeeShareAc1 || totals?.grandPf || 0).toLocaleString('en-IN')}`,
        ],
        [
          "Employer's share (3.67% / 8.33%)",
          `₹${Number(pf.employerShareAc1 || 0).toLocaleString('en-IN')}`,
          `₹${Number(pf.employerShareAc10 || 0).toLocaleString('en-IN')}`,
          '—',
          '—',
          `₹${Number((pf.employerShareAc1 || 0) + (pf.employerShareAc10 || 0)).toLocaleString('en-IN')}`,
        ],
        [
          'EDLI (0.5%) & Admin (0.5%)',
          '—',
          '—',
          `₹${Number(pf.ac21Edli || 0).toLocaleString('en-IN')}`,
          `₹${Number(pf.ac2AdminCharges || 0).toLocaleString('en-IN')}`,
          `₹${Number((pf.ac21Edli || 0) + (pf.ac2AdminCharges || 0)).toLocaleString('en-IN')}`,
        ],
        [
          'Total payment of PF',
          '',
          '',
          '',
          '',
          `₹${Number(pf.totalPaymentPf || 0).toLocaleString('en-IN')}`,
        ],
      ],
    });
  }

  const cleanMonth = (period?.month || 'current').replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `Register_of_Wages_Form_XVII_${cleanMonth}.pdf`;

  if (isPrint) {
    const pdfBlob = doc.output('blob');
    const blobUrl = URL.createObjectURL(pdfBlob);
    const printWindow = window.open(blobUrl, '_blank');
    if (printWindow) {
      printWindow.addEventListener('load', () => {
        printWindow.print();
      });
    }
  } else {
    doc.save(filename);
  }
};
