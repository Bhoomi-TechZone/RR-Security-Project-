import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Direct PDF Generation & Download Utility for HRMS Reports
 * Downloads a real .pdf file directly to the user's browser.
 */
export const generateReportPdf = ({
  reportType = 'payroll',
  title = 'Wage & Salary Register',
  period = {},
  companyInfo = {},
  records = [],
  totals = {},
  statutoryRules = [],
  mode = 'download', // 'download' or 'print'
}) => {
  const companyName = companyInfo.name || 'RR Security & Facilities';
  const companyAddress = companyInfo.address || 'G/75A Block-G M.B. Exten. Badarpur New Delhi-110044';
  const pfNo = companyInfo.pfNo || 'DSNHP3718318000';
  const esiNo = companyInfo.esiNo || companyInfo.esicNo || '20001853160000999';
  const monthLabel = period.monthLabel || period.month || 'Current Month';
  const paymentDate = period.toDate || new Date().toISOString().slice(0, 10);

  const defaultRules = [
    '(1) Form under Rule - 5 of Equal Remuneration Rules 1976.',
    '(2) Form under Rule - 21(4) 25(2) 26(1) and 26(2) of Gujarat / Central Minimum Wages Rules 1961',
    '(3) Form under Rule - 6 of Payment of Wages (Gujarat) Rules 1963.',
    '(4) Form 17 under Rule - 78 of Contract Labour (Regulation & Abolition) Central/Gujarat Rules 1972',
    '(5) Form under Rule - 52(2) of Inter State Migrant Workers (Gujarat) Rules 1981',
  ];
  const rulesList = statutoryRules.length > 0 ? statutoryRules : defaultRules;

  // Use landscape A4 or A3 for detailed Wage Register
  const isWageRegister = reportType === 'payroll';
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'pt',
    format: isWageRegister ? 'a3' : 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();

  // Draw Header Section
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(0, 0, 0);
  doc.text(companyName.toUpperCase(), 30, 35);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(50, 50, 50);
  doc.text(companyAddress, 30, 48, { maxWidth: 400 });

  // Statutory rules on top right
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7.5);
  doc.setTextColor(80, 80, 80);
  let ruleY = 26;
  rulesList.forEach((rule) => {
    doc.text(rule, pageWidth - 30, ruleY, { align: 'right' });
    ruleY += 9.5;
  });

  // Divider Line
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(1.5);
  doc.line(30, 72, pageWidth - 30, 72);

  // Sub-header bar
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(0, 0, 0);
  doc.text(`PF No :- ${pfNo}`, 30, 86);
  doc.text(`ESI No :- ${esiNo}`, 30, 98);

  // Center Title
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text(title.toUpperCase(), pageWidth / 2, 92, { align: 'center' });

  // Right Period & Date
  doc.setFontSize(9);
  doc.text(`For The Month Of : ${monthLabel}`, pageWidth - 30, 86, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.text(`Date of Payment :- ${paymentDate}`, pageWidth - 30, 98, { align: 'right' });

  // Second Divider Line
  doc.setLineWidth(1.5);
  doc.line(30, 105, pageWidth - 30, 105);

  // Build Table Data based on reportType
  if (reportType === 'payroll') {
    const tableHeaders = [
      [
        { content: 'Sr.\nNo.', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
        { content: 'Employee Name\nDesignation / Dept / UAN / ESI', rowSpan: 2, styles: { halign: 'left', valign: 'middle' } },
        { content: 'Emp.\nID', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
        { content: 'Details of\nAttendance', rowSpan: 2, styles: { halign: 'left', valign: 'middle' } },
        { content: 'Rate of\nWages', rowSpan: 2, styles: { halign: 'left', valign: 'middle' } },
        { content: 'Earnings', colSpan: 4, styles: { halign: 'center', fillColor: [240, 243, 246] } },
        { content: 'Gross\nSalary', rowSpan: 2, styles: { halign: 'right', valign: 'middle' } },
        { content: 'Deductions', colSpan: 4, styles: { halign: 'center', fillColor: [240, 243, 246] } },
        { content: 'Gross\nDeduct.', rowSpan: 2, styles: { halign: 'right', valign: 'middle' } },
        { content: 'Net\nPayable', rowSpan: 2, styles: { halign: 'right', valign: 'middle' } },
        { content: 'Signature\n& Bank A/c', rowSpan: 2, styles: { halign: 'left', valign: 'middle' } },
      ],
      [
        { content: 'BASIC\nDA', styles: { halign: 'right', fontSize: 7 } },
        { content: 'HRA\nOTH.All', styles: { halign: 'right', fontSize: 7 } },
        { content: 'CONV', styles: { halign: 'right', fontSize: 7 } },
        { content: 'SP.All\nOT/PIB', styles: { halign: 'right', fontSize: 7 } },
        { content: 'P.F\nESI', styles: { halign: 'right', fontSize: 7 } },
        { content: 'P.T.\nI.T.\nLWF', styles: { halign: 'right', fontSize: 7 } },
        { content: 'Advance\nLOAN\nFood', styles: { halign: 'right', fontSize: 7 } },
        { content: 'Oth.Ded\nE/Mbill', styles: { halign: 'right', fontSize: 7 } },
      ],
    ];

    const tableRows = records.map((r, idx) => {
      const att = r.attendance || {};
      const rate = r.rateOfWages || {};
      const earn = r.earnings || {};
      const ded = r.deductions || {};

      const nameBlock = `${r.name}\n${r.designation || 'Staff'}\n${r.department || 'STAFF'}\nUAN: ${r.uan || '-'}\nPF: ${r.pfNo || '-'}\nESI: ${r.esiNo || '-'}`;

      const attBlock = `WD: ${att.wd || '30.00'}\nWO: ${att.wo || '0.00'}\nPH: ${att.ph || '0.00'}\nPD: ${att.pd || '30.00'}\nPL: ${att.pl || '0.00'}\nCL: ${att.cl || '0.00'}\nSL: ${att.sl || '0.00'}\nTOT: ${att.tot || '30.00'}`;

      const rateBlock = `BASIC: ${rate.basic || '0.00'}\nDA: ${rate.da || '0.00'}\nHRA: ${rate.hra || '0.00'}\nCONV: ${rate.conv || '0.00'}\nSP.All: ${rate.spAll || '0.00'}\nTotal: ${rate.total || '0.00'}`;

      const earn1 = `${earn.basic ?? 0}\n${earn.da ?? 0}`;
      const earn2 = `${earn.hra ?? 0}\n${earn.othAll ?? 0}`;
      const earn3 = `${earn.conv ?? 0}`;
      const earn4 = `${earn.spAll ?? 0}\n${earn.otPib ?? 0}`;

      const grossBlock = `${Number(r.grossSalary || 0).toLocaleString('en-IN')}\nP ${rate.total || r.grossSalary}\nE ${Number(r.grossSalary || 0).toLocaleString('en-IN')}`;

      const ded1 = `${ded.pf ?? 0}\n${ded.esi ?? 0}`;
      const ded2 = `${ded.pt ?? 0}\n${ded.it ?? 0}\n${ded.lwf ?? 0}`;
      const ded3 = `${ded.advance ?? 0}\n${ded.loan ?? 0}\n${ded.food ?? 0}`;
      const ded4 = `${ded.othDed ?? 0}\n${ded.eMbill ?? 0}`;

      const bankBlock = `Bank: ${r.bankName || 'HDFC Bank'}\nA/c: ${r.bankAccountNo || '50100636547362'}\n\nSign: _________`;

      return [
        r.srNo || idx + 1,
        nameBlock,
        r.employeeId,
        attBlock,
        rateBlock,
        earn1,
        earn2,
        earn3,
        earn4,
        grossBlock,
        ded1,
        ded2,
        ded3,
        ded4,
        Number(r.grossDeduct || 0).toLocaleString('en-IN'),
        r.netPayable || Number(r.netPayableNumber || 0).toFixed(2),
        bankBlock,
      ];
    });

    // Total Row
    tableRows.push([
      { content: `TOTAL (${records.length} EMPLOYEES)`, colSpan: 3, styles: { halign: 'center', fontStyle: 'bold' } },
      '—',
      '—',
      totals.grandBasic ? Number(totals.grandBasic).toLocaleString('en-IN') : '—',
      totals.grandHra ? Number(totals.grandHra).toLocaleString('en-IN') : '—',
      '0',
      '0',
      { content: `₹${totals.grandGross ? Number(totals.grandGross).toLocaleString('en-IN') : '0'}`, styles: { fontStyle: 'bold' } },
      totals.grandPf ? Number(totals.grandPf).toLocaleString('en-IN') : '0',
      totals.grandPt ? Number(totals.grandPt).toLocaleString('en-IN') : '0',
      '0',
      '0',
      { content: `₹${totals.grandDeductions ? Number(totals.grandDeductions).toLocaleString('en-IN') : '0'}`, styles: { fontStyle: 'bold' } },
      { content: `₹${totals.grandNet ? Number(totals.grandNet).toLocaleString('en-IN') : '0'}`, styles: { fontStyle: 'bold', textColor: [22, 101, 52] } },
      'Verified & Approved',
    ]);

    autoTable(doc, {
      head: tableHeaders,
      body: tableRows,
      startY: 112,
      margin: { left: 30, right: 30 },
      theme: 'grid',
      styles: {
        fontSize: 7.5,
        cellPadding: 4,
        textColor: [0, 0, 0],
        lineColor: [0, 0, 0],
        lineWidth: 0.75,
        overflow: 'linebreak',
      },
      headStyles: {
        fillColor: [245, 247, 250],
        textColor: [0, 0, 0],
        fontStyle: 'bold',
        fontSize: 7.5,
      },
      alternateRowStyles: {
        fillColor: [255, 255, 255],
      },
    });
  } else if (reportType === 'attendance') {
    const tableHeaders = [
      ['Sr.', 'Employee Name', 'Emp ID', 'Company / Site', 'Department', 'Designation', 'Working Days', 'Present', 'Absent', 'Leave', 'Attendance %', 'Status'],
    ];

    const tableRows = records.map((r, idx) => [
      idx + 1,
      r.employeeName,
      r.employeeId,
      r.clientName || companyName,
      r.department || 'Operations',
      r.designation || 'Staff',
      r.workingDays,
      r.presentDays,
      r.absentDays,
      r.leaveDays,
      `${r.attendancePercentage}%`,
      r.status || 'Good',
    ]);

    autoTable(doc, {
      head: tableHeaders,
      body: tableRows,
      startY: 112,
      margin: { left: 30, right: 30 },
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 5, textColor: [0, 0, 0], lineColor: [0, 0, 0], lineWidth: 0.5 },
      headStyles: { fillColor: [240, 243, 246], textColor: [0, 0, 0], fontStyle: 'bold' },
    });
  } else if (reportType === 'billing') {
    const tableHeaders = [
      ['Client / Company', 'Deployed Workforce', 'Billing Period', 'Total Man-Days', 'Overtime Amount', 'Gross Billing', 'Deductions / Taxes', 'Net Billing', 'Status'],
    ];

    const tableRows = records.map((r) => [
      r.companyName,
      `${r.totalEmployees} Guards`,
      r.billingPeriod,
      r.totalAttendance,
      `₹${Number(r.overtimeAmount || 0).toLocaleString('en-IN')}`,
      `₹${Number(r.grossBilling || 0).toLocaleString('en-IN')}`,
      `₹${Number(r.deductions || 0).toLocaleString('en-IN')}`,
      `₹${Number(r.netBilling || 0).toLocaleString('en-IN')}`,
      r.status,
    ]);

    autoTable(doc, {
      head: tableHeaders,
      body: tableRows,
      startY: 112,
      margin: { left: 30, right: 30 },
      theme: 'grid',
      styles: { fontSize: 8.5, cellPadding: 6, textColor: [0, 0, 0], lineColor: [0, 0, 0], lineWidth: 0.5 },
      headStyles: { fillColor: [240, 243, 246], textColor: [0, 0, 0], fontStyle: 'bold' },
    });
  } else if (reportType === 'employee') {
    const tableHeaders = [
      ['Employee Name', 'Emp. ID', 'Father / Husband', 'Company / Site', 'Department', 'Designation', 'Joining Date', 'Contact', 'Bank & A/C', 'UAN / PF No', 'Status'],
    ];

    const tableRows = records.map((r) => [
      r.name,
      r.employeeId,
      r.fatherHusbandName || '—',
      r.companyName,
      r.department,
      r.designation,
      r.joiningDate,
      r.contact,
      `${r.bankName || 'Bank'}\n${r.accountNumber || '—'}`,
      `UAN: ${r.uan || '—'}\nPF: ${r.pfNo || '—'}`,
      r.status,
    ]);

    autoTable(doc, {
      head: tableHeaders,
      body: tableRows,
      startY: 112,
      margin: { left: 30, right: 30 },
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 5, textColor: [0, 0, 0], lineColor: [0, 0, 0], lineWidth: 0.5 },
      headStyles: { fillColor: [240, 243, 246], textColor: [0, 0, 0], fontStyle: 'bold' },
    });
  } else if (reportType === 'overtime') {
    const tableHeaders = [
      ['Sr.', 'Employee Name', 'Emp. ID', 'Client / Company', 'Site', 'Dept', 'Date', 'OT Hours', 'OT Rate', 'OT Amount', 'Status', 'Reason'],
    ];

    const tableRows = records.map((r, idx) => [
      idx + 1,
      r.employeeName,
      r.employeeId,
      r.clientName,
      r.site || '—',
      r.department,
      r.date,
      `${r.overtimeHours} hrs`,
      `₹${Number(r.overtimeRate || 0).toLocaleString('en-IN')}/hr`,
      `₹${Number(r.overtimeAmount || 0).toLocaleString('en-IN')}`,
      (r.status || 'pending').toUpperCase(),
      r.reason || '—',
    ]);

    if (totals && totals.totalAmount !== undefined) {
      tableRows.push([
        { content: `TOTAL (${records.length} ENTRIES)`, colSpan: 7, styles: { halign: 'center', fontStyle: 'bold' } },
        { content: `${totals.totalHours || 0} hrs`, styles: { fontStyle: 'bold' } },
        '—',
        { content: `₹${Number(totals.totalAmount || 0).toLocaleString('en-IN')}`, styles: { fontStyle: 'bold', textColor: [22, 101, 52] } },
        '—',
        '—',
      ]);
    }

    autoTable(doc, {
      head: tableHeaders,
      body: tableRows,
      startY: 112,
      margin: { left: 30, right: 30 },
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 5, textColor: [0, 0, 0], lineColor: [0, 0, 0], lineWidth: 0.5 },
      headStyles: { fillColor: [240, 243, 246], textColor: [0, 0, 0], fontStyle: 'bold' },
    });
  } else {
    // Inventory & Asset Register
    const tableHeaders = [
      ['Sr.', 'Item Name & Brand', 'Item Code', 'Type / Category', 'Allocated Site', 'Unit Rate', 'Total Stock', 'Available', 'Issued', 'Damaged', 'Total Value', 'Status'],
    ];

    const tableRows = records.map((r, idx) => [
      idx + 1,
      `${r.item || r.itemName}\nBrand: ${r.brand || '—'}`,
      r.itemCode || r.itemId,
      `${r.itemType || 'ASSET'}\n${r.category || ''}`,
      `${r.client || r.location || 'Central Stock'}`,
      `₹${Number(r.unitRate || 0).toLocaleString('en-IN')}`,
      r.totalQuantity,
      r.available,
      r.issued,
      r.damaged + (r.lost || 0),
      `₹${Number(r.totalValue || (r.totalQuantity * (r.unitRate || 0))).toLocaleString('en-IN')}`,
      r.status || 'In Stock',
    ]);

    if (totals && totals.totalStockSum !== undefined) {
      tableRows.push([
        { content: `TOTAL (${records.length} ITEMS)`, colSpan: 6, styles: { halign: 'center', fontStyle: 'bold' } },
        { content: String(totals.totalStockSum || 0), styles: { fontStyle: 'bold' } },
        { content: String(totals.totalAvailableSum || 0), styles: { fontStyle: 'bold', textColor: [22, 101, 52] } },
        { content: String(totals.totalIssuedSum || 0), styles: { fontStyle: 'bold', textColor: [37, 99, 235] } },
        { content: String(totals.totalDamagedSum || 0), styles: { fontStyle: 'bold', textColor: [220, 38, 38] } },
        { content: `₹${Number(totals.totalValuationSum || 0).toLocaleString('en-IN')}`, styles: { fontStyle: 'bold', textColor: [22, 101, 52] } },
        '—',
      ]);
    }

    autoTable(doc, {
      head: tableHeaders,
      body: tableRows,
      startY: 112,
      margin: { left: 30, right: 30 },
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 5, textColor: [0, 0, 0], lineColor: [0, 0, 0], lineWidth: 0.5 },
      headStyles: { fillColor: [240, 243, 246], textColor: [0, 0, 0], fontStyle: 'bold' },
    });
  }

  // Footer
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    const pageHeight = doc.internal.pageSize.getHeight();
    doc.text(
      `Generated on ${new Date().toLocaleString('en-IN')} | ${companyName} Official System Generated Register`,
      30,
      pageHeight - 15
    );
    doc.text(`Page ${i} of ${pageCount}`, pageWidth - 30, pageHeight - 15, { align: 'right' });
  }

  const cleanFileName = `${companyName.replace(/[^a-zA-Z0-9]/g, '_')}_${title.replace(/[^a-zA-Z0-9]/g, '_')}_${monthLabel.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;

  if (mode === 'print') {
    doc.autoPrint();
    const pdfBlob = doc.output('blob');
    const pdfUrl = URL.createObjectURL(pdfBlob);
    window.open(pdfUrl, '_blank');
  } else {
    // Direct file download to user's downloads folder
    doc.save(cleanFileName);
  }
};
