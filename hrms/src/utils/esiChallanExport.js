import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Statutory ESI Challan Exporter
 * E. S. I. C. Pay-in-Slip for Contribution (SBI Account No. 1)
 * Matches exact layout from reference image:
 * - Blue top banner with ORIGINAL / CHALLAN NO
 * - Bank Details, Particulars of Cash / Cheque box
 * - Amount in words
 * - Establishment & Employer Code details
 * - Employee count & wage/contribution grid
 * - Bank Acknowledgement receipt section
 */

const formatCurr = (val) => {
  const n = Number(val) || 0;
  return n.toFixed(2);
};

export const downloadEsiChallanExcel = (challanData = {}, options = {}) => {
  const totals = challanData.totals || {};
  const comp = challanData.companyInfo || {};
  const records = challanData.records || [];

  const aoaChallan = [
    ['E. S. I. C.'],
    ['ORIGINAL', '', '', 'CHALLAN NO:', challanData.challanNo || ''],
    ['For Bank'],
    ["Employee's State Insurance Fund Account No. 1"],
    ['Pay-in-Slip for Contribution'],
    [challanData.bankName || 'State Bank of India'],
    [''],
    ['Particulars of Cash / Cheque No.', 'Amount', 'Station :', challanData.station || 'NEW DELHI'],
    [challanData.chequeNo ? `Cheque No. ${challanData.chequeNo}` : 'By Cash/Transfer', formatCurr(totals.totalContribution), 'Dated :', challanData.date || ''],
    ['', '', 'Paid in to the credit of the Fund'],
    ['Total', formatCurr(totals.totalContribution), 'Account No. 1 Rs.', formatCurr(totals.totalContribution)],
    [''],
    [`(${totals.totalAmountWords || 'Rupees Zero Only'})`],
    ['in Cash/by Cheque (on realisation) for Payment of contributions as per details given below under the Employee\'s State Insurance Act 1948'],
    [`For the month of   ${challanData.monthName || ''}`],
    ['', '', 'Deposited by'],
    ['', '', `For ${comp.name || 'RR SECURITY & FACILITIES'}`],
    [''],
    [`Employer's Code No : ${comp.employerCode || '20001853160000999'}`],
    ['Name & Address of Factory/Establishment'],
    [comp.name || '', '', '', '(Signatory)'],
    [comp.address || ''],
    [''],
    ['No. of Employee\'s', totals.employeeCount || records.length],
    ['Total Wages', `Rs. ${formatCurr(totals.totalWages)}`],
    ['Employee\'s Contribution (0.75%)', `Rs. ${formatCurr(totals.employeeContribution)}`],
    ['Employer\'s Contribution (3.25%)', `Rs. ${formatCurr(totals.employerContribution)}`],
    ['Total', `Rs. ${formatCurr(totals.totalContribution)}`],
    ['--------------------------------------------------------------------------------------------------'],
    ['(for use in Bank)'],
    ['ACKNOWLEDGEMENT'],
    ['(to be filled by Depositor)'],
    [`Received Payment with Cash/Cheque/Draft No. : ${challanData.chequeNo || '—'}`, '', `Dated : ${challanData.date || ''}`],
    [`For Rs. ${formatCurr(totals.totalContribution)}, ${totals.totalAmountWords || ''}`],
    ['Drawn on :'],
    ['(Bank in favour of Employee\'s State Insurance Fund Account No. 1)'],
    ['S. No. in Bank Scroll :'],
    [`Dated : ${challanData.date || ''}`]
  ];

  const wsChallan = XLSX.utils.aoa_to_sheet(aoaChallan);
  wsChallan['!cols'] = [{ wch: 36 }, { wch: 18 }, { wch: 28 }, { wch: 22 }];

  // Sheet 2: Employee Breakdown
  const aoaEmployees = [
    ['ESI Challan - Insured Employee Contribution Breakdown'],
    [`Month : ${challanData.monthName || ''}`, `Employer : ${comp.name || ''}`, `Code : ${comp.employerCode || ''}`],
    [''],
    ['Sl No', 'Employee ID', 'Name', 'Designation', 'Department', 'ESIC IP Number', 'Dispensary', 'Days', 'Gross Wages', 'Employee Share (0.75%)', 'Employer Share (3.25%)', 'Total Contribution']
  ];

  records.forEach((r, idx) => {
    aoaEmployees.push([
      r.srNo || idx + 1,
      r.employeeId || '',
      r.name || '',
      r.designation || '',
      r.department || '',
      r.insuranceNo || '',
      r.dispensary || '',
      r.daysWorked || 0,
      r.grossWages || 0,
      r.employeeShare || 0,
      r.employerShare || 0,
      r.totalShare || 0,
    ]);
  });

  aoaEmployees.push([
    '', 'Total', `${totals.employeeCount || records.length} Employees`, '', '', '', '', '',
    totals.totalWages || 0,
    totals.employeeContribution || 0,
    totals.employerContribution || 0,
    totals.totalContribution || 0,
  ]);

  const wsEmployees = XLSX.utils.aoa_to_sheet(aoaEmployees);
  wsEmployees['!cols'] = [
    { wch: 8 }, { wch: 14 }, { wch: 26 }, { wch: 20 }, { wch: 18 },
    { wch: 20 }, { wch: 20 }, { wch: 8 }, { wch: 14 }, { wch: 16 }, { wch: 16 }, { wch: 16 }
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, wsChallan, 'ESI Challan');
  XLSX.utils.book_append_sheet(wb, wsEmployees, 'Employee Breakdown');

  const filename = `ESI_Challan_${(challanData.month || 'month').replace('-', '_')}.xlsx`;
  XLSX.writeFile(wb, filename);
};

export const downloadEsiChallanCsv = (challanData = {}, options = {}) => {
  const totals = challanData.totals || {};
  const comp = challanData.companyInfo || {};
  const records = challanData.records || [];

  const lines = [
    `"E. S. I. C. - CHALLAN"`,
    `"Month","${challanData.monthName || ''}"`,
    `"Challan No","${challanData.challanNo || ''}"`,
    `"Date","${challanData.date || ''}"`,
    `"Bank","${challanData.bankName || 'State Bank of India'}"`,
    `"Account","Employee's State Insurance Fund Account No. 1"`,
    `"Employer Name","${comp.name || ''}"`,
    `"Employer Code","${comp.employerCode || ''}"`,
    `"No. of Employees","${totals.employeeCount || records.length}"`,
    `"Total Wages","${formatCurr(totals.totalWages)}"`,
    `"Employee Contribution (0.75%)","${formatCurr(totals.employeeContribution)}"`,
    `"Employer Contribution (3.25%)","${formatCurr(totals.employerContribution)}"`,
    `"Total Contribution Payable","${formatCurr(totals.totalContribution)}"`,
    `"Amount in Words","${totals.totalAmountWords || ''}"`,
    ``,
    `"Sl No","Employee ID","Name","ESIC No","Dispensary","Days","Gross Wages","Employee Share","Employer Share","Total Contribution"`
  ];

  records.forEach((r, idx) => {
    lines.push([
      `"${r.srNo || idx + 1}"`,
      `"${r.employeeId || ''}"`,
      `"${r.name || ''}"`,
      `"${r.insuranceNo || ''}"`,
      `"${r.dispensary || ''}"`,
      `"${r.daysWorked || 0}"`,
      `"${formatCurr(r.grossWages)}"`,
      `"${formatCurr(r.employeeShare)}"`,
      `"${formatCurr(r.employerShare)}"`,
      `"${formatCurr(r.totalShare)}"`
    ].join(','));
  });

  const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + lines.join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `ESI_Challan_${(challanData.month || 'month').replace('-', '_')}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * PDF Generator & Print Utility for ESI Challan
 * Supports individual copies or All 4 copies (Original, Duplicate, Triplicate, Quadruplicate)
 */
export const downloadEsiChallanPdf = (challanData = {}, options = {}) => {
  const totals = challanData.totals || {};
  const comp = challanData.companyInfo || {};
  const records = challanData.records || [];

  const copyTypes = options.copyType === 'all'
    ? [
        { label: 'ORIGINAL', desc: 'For Bank' },
        { label: 'DUPLICATE', desc: 'To be sent by the Bank to Regional Office of ESIC' },
        { label: 'TRIPLICATE', desc: 'To be returned to the Depositor for employer records' },
        { label: 'QUADRUPLICATE', desc: 'To be returned to Depositor for his own record' }
      ]
    : [
        {
          label: (options.copyType || 'ORIGINAL').toUpperCase(),
          desc: options.copyTypeDesc || 'For Bank'
        }
      ];

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginX = 36;
  const contentWidth = pageWidth - marginX * 2;

  copyTypes.forEach((copy, cIdx) => {
    if (cIdx > 0) doc.addPage();

    let y = 30;

    // 1. Top E. S. I. C. text
    doc.setFont('courier', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(20, 20, 20);
    doc.text('E.  S.  I.  C.', marginX + 40, y);
    y += 14;

    // 2. Blue Banner Bar matching Image 2
    doc.setFillColor(0, 110, 210);
    doc.rect(marginX, y, contentWidth, 18, 'F');
    doc.setFont('courier', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(255, 255, 255);
    doc.text(copy.label, marginX + 10, y + 13);
    doc.text(`CHALLAN NO   ${challanData.challanNo || ''}`, contentWidth + marginX - 10, y + 13, { align: 'right' });
    y += 26;

    // 3. Bank & Header info
    doc.setTextColor(0, 0, 0);
    doc.setFont('courier', 'normal');
    doc.setFontSize(10);
    doc.text(copy.desc, marginX + 10, y);
    y += 14;

    doc.setFont('courier', 'bold');
    doc.setFontSize(11);
    doc.text("Employee's State Insurance Fund Account No. 1", pageWidth / 2, y, { align: 'center' });
    y += 14;
    doc.setFontSize(10);
    doc.text('Pay-in-Slip for Contribution', pageWidth / 2, y, { align: 'center' });
    y += 13;
    doc.text(challanData.bankName || 'State Bank of India', pageWidth / 2, y, { align: 'center' });
    y += 16;

    // 4. Particulars Box matching Image 2
    const boxX = marginX + 10;
    const boxW = contentWidth - 20;
    const boxY = y;
    const boxH = 68;
    const splitX = boxX + 130;
    const midX = boxX + 230;

    doc.setDrawColor(80, 80, 80);
    doc.setLineWidth(0.8);
    doc.rect(boxX, boxY, boxW, boxH);

    // Inner lines
    doc.line(boxX, boxY + 18, boxX + 230, boxY + 18); // below header
    doc.line(boxX, boxY + 50, boxX + 230, boxY + 50); // above total
    doc.line(splitX, boxY, splitX, boxY + boxH); // between Particulars and Amount
    doc.line(midX, boxY, midX, boxY + boxH); // between Amount and Station

    // Box Text
    doc.setFont('courier', 'bold');
    doc.setFontSize(8.5);
    doc.text('Particulars of Cash /', boxX + 6, boxY + 10);
    doc.text('Cheque No.', boxX + 6, boxY + 16);
    doc.text('Amount', splitX + 50, boxY + 13, { align: 'right' });

    // Station & Dated on right side
    doc.text(`Station : ${challanData.station || 'NEW DELHI'}`, midX + 10, boxY + 12);
    doc.line(midX, boxY + 18, boxX + boxW, boxY + 18);
    doc.text(`Dated   : ${challanData.date || ''}`, midX + 10, boxY + 28);
    doc.text('Paid in to the credit of the Fund', midX + 10, boxY + 45);
    doc.text(`Account No. 1 Rs.    ${formatCurr(totals.totalContribution)}`, midX + 10, boxY + 58);

    // Amount inside box
    doc.setFont('courier', 'normal');
    const chequeLabel = challanData.chequeNo ? `Chq: ${challanData.chequeNo}` : '';
    if (chequeLabel) doc.text(chequeLabel, boxX + 6, boxY + 34);
    doc.text(formatCurr(totals.totalContribution), splitX + 85, boxY + 34, { align: 'right' });

    doc.setFont('courier', 'bold');
    doc.text('Total', boxX + 60, boxY + 62);
    doc.text(formatCurr(totals.totalContribution), splitX + 85, boxY + 62, { align: 'right' });

    y = boxY + boxH + 16;

    // 5. Amount in words & statutory statement
    doc.setFont('courier', 'bold');
    doc.setFontSize(9.5);
    doc.text(`(${totals.totalAmountWords || 'Rupees Zero Only'})`, marginX + 10, y);
    y += 13;

    doc.setFont('courier', 'normal');
    doc.setFontSize(9);
    const statutoryNote = 'in Cash/by Cheque (on realisation) for Payment of contributions as per details given below under the Employee\'s State Insurance Act 1948';
    doc.text(statutoryNote, marginX + 10, y, { maxWidth: contentWidth - 20 });
    y += 22;

    doc.setFont('courier', 'bold');
    doc.setFontSize(9.5);
    doc.text(`For the month of   ${challanData.monthName || ''}`, marginX + 10, y);
    y += 4;

    // Deposited by (Right Aligned)
    doc.setFont('courier', 'normal');
    doc.setFontSize(9);
    doc.text('Deposited by', contentWidth + marginX - 10, y, { align: 'right' });
    y += 12;
    doc.setFont('courier', 'bold');
    doc.text(`For ${comp.name || 'RR SECURITY & FACILITIES'}`, contentWidth + marginX - 10, y, { align: 'right' });
    y += 18;

    // 6. Employer Code and Name & Address
    doc.setFont('courier', 'bold');
    doc.setFontSize(9.5);
    doc.text(`Employer's Code No : ${comp.employerCode || '20001853160000999'}`, marginX + 10, y);
    y += 14;

    doc.setFont('courier', 'normal');
    doc.setFontSize(9);
    doc.text('Name & Address of Factory/Establishment', marginX + 10, y);
    y += 13;

    doc.setFont('courier', 'bold');
    doc.text(comp.name || 'RR SECURITY & FACILITIES', marginX + 10, y);
    doc.text('(Signatory)', contentWidth + marginX - 40, y);
    y += 12;

    doc.setFont('courier', 'normal');
    doc.text(comp.address || 'G-75/A, BLOCK-G M.B.EXTN., BADARPUR NEW DELHI-110044', marginX + 10, y, { maxWidth: contentWidth * 0.65 });
    y += 24;

    // 7. Statutory Wages & Contribution Table matching Image 2
    const gridX = marginX + 10;
    const gridValX = marginX + 280;

    doc.setFont('courier', 'normal');
    doc.setFontSize(9.5);

    doc.text("No. of Employee's", gridX, y);
    doc.setFont('courier', 'bold');
    doc.text(String(totals.employeeCount || records.length || 0), gridValX, y, { align: 'right' });
    y += 14;

    doc.setFont('courier', 'normal');
    doc.text('Total Wages', gridX, y);
    doc.text('Rs.', gridValX - 65, y);
    doc.setFont('courier', 'bold');
    doc.text(formatCurr(totals.totalWages), gridValX, y, { align: 'right' });
    y += 14;

    doc.setFont('courier', 'normal');
    doc.text("Employee's Contribution (0.75%)", gridX, y);
    doc.text('Rs.', gridValX - 65, y);
    doc.setFont('courier', 'bold');
    doc.text(formatCurr(totals.employeeContribution), gridValX, y, { align: 'right' });
    y += 14;

    doc.setFont('courier', 'normal');
    doc.text("Employer's Contribution (3.25%)", gridX, y);
    doc.text('Rs.', gridValX - 65, y);
    doc.setFont('courier', 'bold');
    doc.text(formatCurr(totals.employerContribution), gridValX, y, { align: 'right' });
    y += 14;

    doc.setFont('courier', 'bold');
    doc.text('Total', gridX, y);
    doc.text('Rs.', gridValX - 65, y);
    doc.text(formatCurr(totals.totalContribution), gridValX, y, { align: 'right' });
    y += 20;

    // 8. Dashed Divider Line matching Image 2
    doc.setLineDash([3, 2], 0);
    doc.setLineWidth(0.6);
    doc.line(marginX + 10, y, contentWidth + marginX - 10, y);
    doc.setLineDash([], 0);
    y += 18;

    // 9. Bank Acknowledgement Section matching Image 2
    doc.setFont('courier', 'normal');
    doc.setFontSize(8.5);
    doc.text('(for use in Bank)', marginX + 10, y);
    y += 12;

    doc.setFont('courier', 'bold');
    doc.setFontSize(10.5);
    doc.text('ACKNOWLEDGEMENT', pageWidth / 2, y, { align: 'center' });
    y += 12;
    doc.setFontSize(8.5);
    doc.setFont('courier', 'normal');
    doc.text('(to be filled by Depositor)', pageWidth / 2, y, { align: 'center' });
    y += 18;

    doc.setFont('courier', 'normal');
    doc.setFontSize(9);
    doc.text(`Received Payment with Cash/Cheque/Draft No. ${challanData.chequeNo || '___________________'}`, marginX + 10, y);
    doc.text(`Dated : ${challanData.date || '____________'}`, contentWidth + marginX - 10, y, { align: 'right' });
    y += 16;

    doc.setFont('courier', 'bold');
    doc.text(`For Rs. ${formatCurr(totals.totalContribution)}, ${totals.totalAmountWords || ''}`, marginX + 10, y, { maxWidth: contentWidth - 20 });
    y += 15;

    doc.setFont('courier', 'normal');
    doc.text('Drawn on ,', marginX + 10, y);
    y += 15;

    doc.text("(Bank in favour of Employee's State Insurance Fund Account No. 1)", marginX + 10, y);
    y += 18;

    doc.text('S. No. in Bank Scroll', marginX + 10, y);
    y += 18;

    doc.text(`Dated : ${challanData.date || ''}`, marginX + 10, y);
  });

  if (options.mode === 'print') {
    doc.autoPrint();
    const blobUrl = doc.output('bloburl');
    window.open(blobUrl, '_blank');
  } else {
    doc.save(`ESI_Challan_${(challanData.month || 'month').replace('-', '_')}.pdf`);
  }
};
