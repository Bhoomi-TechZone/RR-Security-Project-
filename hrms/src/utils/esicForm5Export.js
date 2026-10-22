import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * =========================================================================
 * ESIC FORM 5 RETURN OF CONTRIBUTIONS EXPORTER (PDF, EXCEL, CSV)
 * FORM 5 [REGULATION 26, ESI REGULATIONS, 1950]
 * Exact reproduction of statutory Document:
 * - Page 1: Form 5 Header, Employer Particulars, Contribution Period,
 *           Declaration, Share Totals, 6-Month Challan Table, Instructions,
 *           and Declarations (a) to (j).
 * - Page 2: Wage Components (k) & (l), CA Certificate, 10-Column Insured
 *           Persons Contribution Table, and Official Use Box.
 * =========================================================================
 */

export const downloadEsicForm5Excel = (reportData = {}, options = {}) => {
  const safeData = reportData || {};
  const records = safeData.records || [];
  const companyInfo = safeData.companyInfo || {};
  const period = safeData.period || {};
  const contributions = safeData.contributions || {};
  const challans = safeData.challans || [];
  const totals = safeData.totals || {};

  const companyName = companyInfo?.name || 'RR SECURITY & FACILITIES';
  const companyAddress = companyInfo?.address || '';
  const employerCode = companyInfo?.employerCode || '20001853160000999';

  const aoa = [
    ['FORM 5 - RETURN OF CONTRIBUTIONS'],
    ['EMPLOYEES’ STATE INSURANCE CORPORATION (Regulation 26)'],
    [''],
    ["Employer's Code No.:", employerCode, '', 'Name of Branch Office:', companyInfo.branchOffice || 'MAYAPURI / BADARPUR'],
    ['Name & Address of Factory / Establishment:', `${companyName}, ${companyAddress}`],
    ['Particulars of Principal Employer:', companyInfo.principalEmployer?.name || 'MR. RAM NIWAS', 'Designation:', companyInfo.principalEmployer?.designation || 'PROPRIETOR'],
    ['Residential Address:', companyInfo.principalEmployer?.address || companyAddress],
    ['Contribution Period from:', period.label || 'OCTOBER, 2025 TO MARCH, 2026'],
    [''],
    ["Employees' Share:", `Rs. ${contributions.employeesShare || 0}`, "Employer's Share:", `Rs. ${contributions.employersShare || 0}`, 'Total Contribution:', `Rs. ${contributions.totalContribution || 0}`],
    ['Total Amount Paid:', `Rs. ${safeData.totalAmountPaid || 0}`],
    [''],
    ['--- DETAILS OF CHALLANS (6 MONTHS) ---'],
    ['Sl.No.', 'Month', 'Date of Challan', 'Amount', 'Name of the Bank and Branch'],
  ];

  challans.forEach((ch, idx) => {
    aoa.push([
      ch.slNo || idx + 1,
      ch.month || '',
      ch.dateOfChallan || '',
      ch.amount || 0,
      ch.bankAndBranch || '',
    ]);
  });

  aoa.push(['', '', 'Total Amount Paid:', safeData.totalAmountPaid || 0, '']);
  aoa.push(['']);
  aoa.push(['--- INSURED PERSONS CONTRIBUTION RETURN (10 COLUMNS) ---']);
  aoa.push([
    'Serial Number',
    'Insurance Number',
    'Name of the Insured Person',
    'No. Of Days for which wages paid',
    'Total amount of Wages paid (Rs.)',
    "Employee's Contribution Deducted (Rs.)",
    'Average Daily wages (Rs.)',
    'Whether Still Continues Working',
    'Name of the Dispensary',
    'Remarks',
  ]);

  records.forEach((row, idx) => {
    aoa.push([
      row.srNo || idx + 1,
      row.insuranceNo || '',
      row.employeeName || '',
      row.daysPaid || 0,
      row.wagesPaid || 0,
      row.employeeContribution || 0,
      row.averageDailyWages || 0,
      row.continuesWorking || 'YES',
      row.dispensary || '',
      row.remarks || '—',
    ]);
  });

  aoa.push([
    'Total',
    '',
    `${records.length} Employees`,
    totals.totalDays || 0,
    totals.totalWages || 0,
    totals.totalEmployeeShare || 0,
    totals.overallAvgDailyWage || 0,
    '',
    '',
    '',
  ]);

  const ws = XLSX.utils.aoa_to_sheet(aoa);
  ws['!cols'] = [
    { wch: 10 },
    { wch: 22 },
    { wch: 30 },
    { wch: 20 },
    { wch: 22 },
    { wch: 24 },
    { wch: 18 },
    { wch: 16 },
    { wch: 24 },
    { wch: 20 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'ESIC Form 5 Return');

  const cleanPeriod = (period.label || 'Half_Yearly').replace(/[^0-9A-Za-z]/g, '_');
  XLSX.writeFile(wb, `ESIC_Form_5_Return_Contributions_${cleanPeriod}.xlsx`);
};

export const downloadEsicForm5Csv = (reportData = {}, options = {}) => {
  const safeData = reportData || {};
  const records = safeData.records || [];
  const companyInfo = safeData.companyInfo || {};
  const period = safeData.period || {};

  const lines = [
    `"FORM 5 - RETURN OF CONTRIBUTIONS (Regulation 26)"`,
    `"EMPLOYEES' STATE INSURANCE CORPORATION"`,
    `"Employer Code: ${companyInfo?.employerCode || '20001853160000999'}","Branch Office: ${companyInfo?.branchOffice || 'MAYAPURI'}"`,
    `"Factory / Establishment: ${companyInfo?.name || 'RR SECURITY & FACILITIES'}"`,
    `"Contribution Period: ${period.label || 'OCTOBER TO MARCH'}"`,
    ``,
    `"Serial Number","Insurance Number","Name of the Insured Person","No. Of Days for which wages paid","Total amount of Wages paid","Employee's Contribution Deducted","Average Daily wages","Whether Still Continues Working","Name of the Dispensary","Remarks"`,
  ];

  records.forEach((row, idx) => {
    lines.push([
      `"${row.srNo || idx + 1}"`,
      `"${row.insuranceNo || ''}"`,
      `"${row.employeeName || ''}"`,
      `"${row.daysPaid || 0}"`,
      `"${row.wagesPaid || 0}"`,
      `"${row.employeeContribution || 0}"`,
      `"${row.averageDailyWages || 0}"`,
      `"${row.continuesWorking || 'YES'}"`,
      `"${row.dispensary || ''}"`,
      `"${row.remarks || ''}"`,
    ].join(','));
  });

  const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + lines.join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  const cleanPeriod = (period.label || 'Half_Yearly').replace(/[^0-9A-Za-z]/g, '_');
  link.setAttribute('download', `ESIC_Form_5_Return_Contributions_${cleanPeriod}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * High-Fidelity Official PDF Generator matching Images 1 & 2
 */
export const downloadEsicForm5Pdf = async (reportData = {}, options = {}) => {
  const safeData = reportData || {};
  const records = safeData.records || [];
  const companyInfo = safeData.companyInfo || {};
  const period = safeData.period || {};
  const contributions = safeData.contributions || {};
  const challans = safeData.challans || [];
  const declarations = safeData.declarations || {};
  const wageComponents = safeData.wageComponents || {};
  const totals = safeData.totals || {};

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginX = 35;
  const safeWidth = pageWidth - marginX * 2 - 10; // 515 pt safe printable boundary
  const contentWidth = safeWidth;

  // ==========================================
  // PAGE 1: STATUTORY RETURN & SUMMARY
  // ==========================================
  let y = 20;

  // Header Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.text('FORM 5', pageWidth / 2, y, { align: 'center' });
  doc.setFontSize(9.5);
  doc.text('RETURN OF CONTRIBUTIONS', pageWidth / 2, y + 10, { align: 'center' });
  doc.setFontSize(9);
  doc.text("EMPLOYEES' STATE INSURANCE CORPORATION", pageWidth / 2, y + 20, { align: 'center' });
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7.5);
  doc.text('(Regulation 26)', pageWidth / 2, y + 29, { align: 'center' });

  // Top-Right Employer Code & Branch Office
  const rightMetaX = pageWidth - 235;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text("Employer's Code No.", rightMetaX, y + 36);
  doc.text(":", rightMetaX + 85, y + 36);
  doc.setFont('helvetica', 'bold');
  doc.text(String(companyInfo.employerCode || '20001853160000999'), rightMetaX + 92, y + 36);

  doc.setFont('helvetica', 'normal');
  doc.text('Name of Branch Office', rightMetaX, y + 46);
  doc.text(":", rightMetaX + 85, y + 46);
  doc.setFont('helvetica', 'bold');
  doc.text(String(companyInfo.branchOffice || 'MAYAPURI'), rightMetaX + 92, y + 46);

  y += 56;

  // Name & Address of Establishment
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text('Name and Address of the factory or establishment:', marginX, y);
  doc.setFont('helvetica', 'bold');
  doc.text((companyInfo.name || 'RR SECURITY & FACILITIES').toUpperCase(), marginX + 195, y);
  
  const addressLines = doc.splitTextToSize((companyInfo.address || 'G-75/A, GROUND FLOOR, BLOCK-G, M.B.EXTN. BADARPUR, NEW DELHI - 110044').toUpperCase(), safeWidth - 195);
  doc.setFont('helvetica', 'bold');
  doc.text(addressLines, marginX + 195, y + 9);

  y += 11 + addressLines.length * 8;

  // Particulars of Principal Employer
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text('Particulars of the Principal employer(s)', marginX, y);
  y += 9;

  doc.text('(a) Name', marginX, y);
  doc.setFont('helvetica', 'bold');
  doc.text(`: ${(companyInfo.principalEmployer?.name || 'MR. RAM NIWAS').toUpperCase()}`, marginX + 105, y);
  y += 9;

  doc.setFont('helvetica', 'normal');
  doc.text('(b) Designation', marginX, y);
  doc.setFont('helvetica', 'bold');
  doc.text(`: ${(companyInfo.principalEmployer?.designation || 'PROPRIETOR / AUTHORISED SIGNATORY').toUpperCase()}`, marginX + 105, y);
  y += 9;

  doc.setFont('helvetica', 'normal');
  doc.text('(c) Residential Address', marginX, y);
  doc.setFont('helvetica', 'bold');
  const resLines = doc.splitTextToSize(`: ${(companyInfo.principalEmployer?.address || companyInfo.address || 'NEW DELHI').toUpperCase()}`, safeWidth - 105);
  doc.text(resLines, marginX + 105, y);
  y += resLines.length * 8;

  // Contribution Period
  doc.setFont('helvetica', 'normal');
  doc.text('Contribution Period from', marginX, y);
  doc.setFont('helvetica', 'bold');
  doc.text(`: ${(period.label || 'OCTOBER, 2026 TO MARCH, 2027').toUpperCase()}`, marginX + 105, y);
  y += 11;

  // Statutory Declaration Paragraph (Cleanly wrapped without justify)
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  const declText = "I furnish below the details of the Employer's and Employee's share of contribution in respect of the under mentioned insured persons. I hereby declare that the return includes each and every employee, employed directly or through an immediate employer or in connection with the work of the factory / establishment or any work connected with the administration of the factory / establishment or purchase of raw materials, sale or distribution of finished products etc. to whom the ESI Act, 1948 applies, in the contribution period to which this return relates and that the contributions in respect of employer's and employee's share have been correctly paid in accordance with the provisions of the Act and Regulations.";
  const splitDecl = doc.splitTextToSize(declText, safeWidth);
  doc.text(splitDecl, marginX, y);
  y += splitDecl.length * 7.5 + 4;

  // Contributions Summary Line
  doc.setFontSize(7.5);
  doc.text("Employees's Share :", marginX, y);
  doc.setFont('helvetica', 'bold');
  doc.text(`Rs. ${(contributions.employeesShare || 0).toFixed(2)}`, marginX + 80, y);

  doc.setFont('helvetica', 'normal');
  doc.text("Employer's Share :", marginX + 175, y);
  doc.setFont('helvetica', 'bold');
  doc.text(`Rs. ${(contributions.employersShare || 0).toFixed(2)}`, marginX + 250, y);

  doc.setFont('helvetica', 'normal');
  doc.text('Total Contribution :', marginX + 345, y);
  doc.setFont('helvetica', 'bold');
  doc.text(`Rs. ${(contributions.totalContribution || safeData.totalAmountPaid || 0).toFixed(2)}`, marginX + 425, y);

  y += 11;

  // Challans Table
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('Details of Challans :', marginX, y);
  y += 4;

  const challanRows = (challans.length ? challans : [
    { slNo: 1, month: 'OCTOBER', dateOfChallan: '15.11.2026', amount: 470, bankAndBranch: 'SBI MAYAPURI' },
    { slNo: 2, month: 'NOVEMBER', dateOfChallan: '15.12.2026', amount: 470, bankAndBranch: 'SBI MAYAPURI' },
    { slNo: 3, month: 'DECEMBER', dateOfChallan: '15.01.2027', amount: 470, bankAndBranch: 'SBI MAYAPURI' },
    { slNo: 4, month: 'JANUARY', dateOfChallan: '15.02.2027', amount: 470, bankAndBranch: 'SBI MAYAPURI' },
    { slNo: 5, month: 'FEBRUARY', dateOfChallan: '15.03.2027', amount: 470, bankAndBranch: 'SBI OKHLA IND AREA' },
    { slNo: 6, month: 'MARCH', dateOfChallan: '15.04.2027', amount: 470, bankAndBranch: 'SBI OKHLA IND AREA' },
  ]).map((c) => {
    const rawBank = c.bankAndBranch || companyInfo.bankNameAndBranch || '';
    const cleanBank = (rawBank && !rawBank.includes('—') && rawBank.trim()) ? rawBank : 'SBI MAYAPURI';
    return [
      c.slNo,
      c.month,
      c.dateOfChallan,
      Number(c.amount || 0).toFixed(2),
      cleanBank,
    ];
  });

  autoTable(doc, {
    startY: y,
    head: [['Sl.No.', 'Month', 'Date of Challan', 'Amount', 'Name of the Bank\nand Branch']],
    body: challanRows,
    theme: 'plain',
    styles: {
      font: 'helvetica',
      fontSize: 6.8,
      cellPadding: 1.5,
      lineWidth: 0.5,
      lineColor: [0, 0, 0],
      valign: 'middle',
    },
    headStyles: {
      font: 'helvetica',
      fontStyle: 'bold',
      fillColor: [255, 255, 255],
      textColor: [0, 0, 0],
      halign: 'center',
      cellPadding: 1.8,
    },
    columnStyles: {
      0: { cellWidth: 35, halign: 'center' },
      1: { cellWidth: 120, halign: 'left' },
      2: { cellWidth: 90, halign: 'center' },
      3: { cellWidth: 100, halign: 'right' },
      4: { cellWidth: 165, halign: 'left' },
    },
    margin: { left: marginX, right: marginX },
  });

  y = doc.lastAutoTable.finalY + 6;

  // Total amount paid
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text(`Total amount paid : Rs. ${(safeData.totalAmountPaid || contributions.totalContribution || 0).toFixed(2)}`, marginX + 510, y, { align: 'right' });
  y += 9;

  // Important Instructions
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.2);
  doc.text("Important Instructions : Information to be given in 'Remarks Column (No. 9)'", marginX, y);
  y += 7;
  const instLines = [
    '(i) If any I.P. is appointed for the first time and / or leaves during the contribution period indicate "A ............. (date)" and / or "L .............. (date)"',
    '(ii) Please indicate Insurance Nos. in ascending order.',
    '(iii) Figures in Columns 4,5 & 6 shall be in respect of wage periods ended during the contribution period.',
    '(iv) Invariably strike totals of Columns 4, 5 and 6 of the Return.',
    '(v) No overwriting shall be made. Any corrections, if made, should be signed by the employer.',
    '(vi) Every page of this Return should bear full signature and rubber stamp of the employer.',
    '(vii) Daily wages in Column 7 of the return shall be calculated by dividing figures in Column 5 by figures in Column 4 to two decimal places.',
    '',
    'For *CP ending 31st March, due date is 12th May | For CP ending 30th September, due date is 11th November.',
  ];
  instLines.forEach((line) => {
    if (line === '') {
      y += 2;
    } else {
      const wrapped = doc.splitTextToSize(line, safeWidth);
      doc.text(wrapped, marginX, y);
      y += wrapped.length * 6.5;
    }
  });

  y += 3;

  // Statutory Declarations (a) to (j)
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.2);
  doc.text('I declare that', marginX, y);
  y += 6.5;

  const declItems = [
    '(a) All the Records and Registers have been maintained as per provisions contained in ESI Act, Rules & Regulations framed therein.',
    `(b) During the period of return  __${declarations.declarationFormsSubmitted || 'NIL'}__  No. of Declaration forms have been submitted.`,
    `(c) During the above period  __${declarations.ticsReceived || 'NIL'}__  No. of TICs have been received.`,
    `(d) During the above period  __${declarations.picsReceived || 'NIL'}__  No. of PICs have been received.`,
    `(e) During the above period  __${declarations.picsDistributed || 'NIL'}__  No. of PICs have been distributed amongst the eligible IPs.`,
    `(f) During the above period  __${declarations.accidentsReported || 'NIL'}__  accidents have been reported to the concerned Branch Office.`,
    `(g) During the period  __${String(declarations.coveredEmployeesCount || records.length).padStart(2, '0')}__  No. of employees directly employed by us have been covered and a total wages of Rs.${(declarations.coveredEmployeesWages || totals.totalWages || 0).toFixed(2)} have been paid to such employees.`,
    `(h) During the period  __${declarations.uncoveredEmployeesCount || 'NIL'}__  No. of employees directly employed by us have not been covered and a total wages of Rs. ${declarations.uncoveredEmployeesWages || 'NIL'} have been paid to such employees.`,
    `(i) During the period  __${declarations.immediateEmployerCoveredCount || 'NIL'}__  No. of employees employed through immediate employer have been covered and a total wages of Rs. ${declarations.immediateEmployerCoveredWages || 'NIL'} have been paid to such employees.`,
    `(j) During the period  __${declarations.immediateEmployerUncoveredCount || 'NIL'}__  No. of employees employed through immediate employer have not been covered and a total wages of Rs. ${declarations.immediateEmployerUncoveredWages || 'NIL'} have been paid to such employees.`,
  ];

  declItems.forEach((d) => {
    const wrapped = doc.splitTextToSize(d, safeWidth);
    doc.text(wrapped, marginX, y);
    y += wrapped.length * 6.5 + 1;
  });

  // ==========================================
  // PAGE 2: WAGE COMPONENTS, CA CERTIFICATE, & 10-COL TABLE
  // ==========================================
  doc.addPage();
  y = 25;

  // (k) & (l) Wage Components
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text('(k) Following components of wages have been taken into consideration for the purpose of payment of contribution:', marginX, y);
  y += 9;
  const compK = wageComponents.considered || ['1. Basic Wages', '2. Dearness Allowance (DA)', '3. HRA / Retaining Allowance'];
  compK.forEach((item, i) => {
    doc.text(`   ${i + 1}. ${item.replace(/^[0-9.]+\s*/, '')}`, marginX, y);
    y += 8.5;
  });

  doc.text('(l) Following components of wages have not been taken into consideration for the purpose of payment of contribution:', marginX, y);
  y += 9;
  const compL = wageComponents.notConsidered || ['1. Washing Allowance / Conveyance / Overtime', '2. Travelling Allowance / Reimbursements', '3. Ex-gratia / Annual Bonus'];
  compL.forEach((item, i) => {
    doc.text(`   ${i + 1}. ${item.replace(/^[0-9.]+\s*/, '')}`, marginX, y);
    y += 8.5;
  });

  y += 4;
  doc.setFontSize(7);
  const legalText = 'The above mentioned information is based on records and any information if found incorrect will render me liable for prosecutions under provisions of ESI Act and action for recovery of contribution due along-with interest and damages as per provisions of the ESI Act.';
  const splitLegal = doc.splitTextToSize(legalText, contentWidth);
  doc.text(splitLegal, marginX, y);
  y += splitLegal.length * 8 + 4;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text(`FOR ${(companyInfo.name || 'RR SECURITY & FACILITIES').toUpperCase()}`, pageWidth - marginX, y, { align: 'right' });
  y += 14;

  doc.text(`Place: ${companyInfo.place || 'NEW DELHI'}`, marginX, y);
  doc.text('AUTHOURISED SIGNATORY', pageWidth - marginX, y, { align: 'right' });
  y += 10;
  doc.text(`Date: ${companyInfo.date || '12.09.2026'}`, marginX, y);
  y += 14;

  // Certificate by Chartered Accountant Box
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('CERTIFICATE BY CHARTERED ACCOUNTANT', pageWidth / 2, y, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.text('(To be submitted in case of employers employing 40 or more employees)', pageWidth / 2, y + 8, { align: 'center' });
  y += 18;

  const caText = `Certified that I have verified the above return from the Records & Registers of M/s ${(companyInfo.name || 'RR SECURITY & FACILITIES').toUpperCase()} and found it to be correct.`;
  const caLines = doc.splitTextToSize(caText, safeWidth);
  doc.text(caLines, marginX, y);
  y += caLines.length * 8 + 4;
  doc.text('Signature & Seal of the Chartered Accountant with Membership No.', pageWidth - marginX, y, { align: 'right' });
  y += 14;

  // 10-COLUMN STATUTORY TABLE MATCHING IMAGE 2 EXACTLY
  const tableData = records.map((r, idx) => [
    r.srNo || idx + 1,
    r.insuranceNo || '—',
    r.employeeName || '—',
    r.daysPaid || 0,
    r.wagesPaidRs || Math.floor(r.wagesPaid || 0),
    r.wagesPaidP || '00',
    r.employeeContributionRs || Math.floor(r.employeeContribution || 0),
    r.employeeContributionP || '00',
    r.averageDailyWagesRs || Math.floor(r.averageDailyWages || 0),
    r.averageDailyWagesP || '00',
    r.continuesWorking || 'YES',
    r.dispensary || 'NAJAFGARH',
    r.remarks || '—',
  ]);

  // Grand Total Row
  const totalRow = [
    'Total',
    '',
    '',
    totals.totalDays || records.reduce((s, r) => s + (r.daysPaid || 0), 0),
    Math.floor(totals.totalWages || 0),
    '00',
    Math.floor(totals.totalEmployeeShare || 0),
    '00',
    Math.floor(totals.overallAvgDailyWage || 0),
    '00',
    '',
    '',
    '',
  ];

  autoTable(doc, {
    startY: y,
    head: [
      [
        { content: 'Serial\nNumber', rowSpan: 2, styles: { halign: 'center' } },
        { content: 'Insurance\nNumber', rowSpan: 2, styles: { halign: 'center' } },
        { content: 'Name of the Insured\nPerson', rowSpan: 2, styles: { halign: 'center' } },
        { content: 'No. Of Days\nfor which wages\npaid', rowSpan: 2, styles: { halign: 'center' } },
        { content: 'Total amount of Wages paid', colSpan: 2, styles: { halign: 'center' } },
        { content: "Employee's Contribution\nDeducted", colSpan: 2, styles: { halign: 'center' } },
        { content: 'Average Daily wages', colSpan: 2, styles: { halign: 'center' } },
        { content: 'Whether Still\nContinues Working', rowSpan: 2, styles: { halign: 'center' } },
        { content: 'Name of the Dispensary', rowSpan: 2, styles: { halign: 'center' } },
        { content: 'Remarks', rowSpan: 2, styles: { halign: 'center' } },
      ],
      [
        { content: 'Rs.', styles: { halign: 'center' } },
        { content: 'P', styles: { halign: 'center' } },
        { content: 'Rs.', styles: { halign: 'center' } },
        { content: 'P', styles: { halign: 'center' } },
        { content: 'Rs.', styles: { halign: 'center' } },
        { content: 'P', styles: { halign: 'center' } },
      ],
      [
        '1', '2', '3', '4',
        { content: '5', colSpan: 2, styles: { halign: 'center' } },
        { content: '6', colSpan: 2, styles: { halign: 'center' } },
        { content: '7', colSpan: 2, styles: { halign: 'center' } },
        '8', '9', '10'
      ],
    ],
    body: [...tableData, totalRow],
    theme: 'plain',
    styles: {
      font: 'helvetica',
      fontSize: 6.8,
      cellPadding: 2,
      lineWidth: 0.5,
      lineColor: [0, 0, 0],
      valign: 'middle',
    },
    headStyles: {
      font: 'helvetica',
      fontStyle: 'bold',
      fillColor: [255, 255, 255],
      textColor: [0, 0, 0],
      lineWidth: 0.5,
      lineColor: [0, 0, 0],
    },
    columnStyles: {
      0: { cellWidth: 26, halign: 'center' },
      1: { cellWidth: 62, halign: 'center' },
      2: { cellWidth: 95, halign: 'left' },
      3: { cellWidth: 42, halign: 'center' },
      4: { cellWidth: 38, halign: 'right' },
      5: { cellWidth: 16, halign: 'center' },
      6: { cellWidth: 32, halign: 'right' },
      7: { cellWidth: 16, halign: 'center' },
      8: { cellWidth: 32, halign: 'right' },
      9: { cellWidth: 16, halign: 'center' },
      10: { cellWidth: 38, halign: 'center' },
      11: { cellWidth: 65, halign: 'left' },
      12: { cellWidth: 45, halign: 'center' },
    },
    margin: { left: marginX, right: marginX, bottom: 90 },
    didParseCell: (data) => {
      // Bold the total row
      if (data.row.index === tableData.length) {
        data.cell.styles.fontStyle = 'bold';
      }
    },
  });

  const finalY = doc.lastAutoTable.finalY + 8;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.text('*Date of appointment and leaving the job may be given in remarks column.', marginX, finalY);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('Signature of the Employer', pageWidth - marginX, finalY + 12, { align: 'right' });

  // Official Use Box
  let offY = finalY + 18;
  if (offY + 65 > pageHeight - 15) {
    doc.addPage();
    offY = 25;
  }
  doc.setLineWidth(0.5);
  doc.line(marginX, offY, pageWidth - marginX, offY);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('(FOR OFFICIAL USE)', pageWidth / 2, offY + 9, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.text('1. Entitlement position marked.', marginX, offY + 20);
  doc.text('Countersignature ....................................................', pageWidth - marginX, offY + 20, { align: 'right' });

  doc.text('2. Total of Col. 5 of Return checked and Found correct/correct amount is indicated.', marginX, offY + 31);
  doc.text("3. Checked the amount of Employer's/Employee's contribution paid which is in order / observation memo enclosed.", marginX, offY + 42);

  doc.setFont('helvetica', 'bold');
  doc.text('U.D.C.                   Head Clerk                   Branch Officer', pageWidth - marginX, offY + 54, { align: 'right' });

  // Output
  const cleanPeriod = (period.label || 'Half_Yearly').replace(/[^0-9A-Za-z]/g, '_');
  const fileName = `ESIC_Form_5_Return_Contributions_${cleanPeriod}.pdf`;

  if (options.mode === 'print') {
    doc.autoPrint();
    const blobUrl = doc.output('bloburl');
    window.open(blobUrl, '_blank');
  } else {
    doc.save(fileName);
  }
};
