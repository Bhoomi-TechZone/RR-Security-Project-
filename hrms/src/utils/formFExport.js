import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Generate and download or print Form F - Gratuity Nomination PDF
 *
 * @param {Object|Array} inputRecord - Single record or array of records
 * @param {Object} globalCompanyInfo - Fallback company details
 * @param {Object} options - { mode: 'download' | 'print', filename: string, companyName: string, companyAddress: string }
 */
export async function downloadFormFPdf(
  inputRecord,
  globalCompanyInfo = {},
  options = {}
) {
  const records = Array.isArray(inputRecord) ? inputRecord : [inputRecord];
  if (!records.length) return;

  const mode = options.mode || 'download';

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 595.28 pt
  const marginX = 42;
  const contentWidth = pageWidth - marginX * 2; // ~511 pt

  records.forEach((record, pageIdx) => {
    if (pageIdx > 0) {
      doc.addPage();
    }

    const comp = record.companyInfo || globalCompanyInfo || {};
    const employerName = (
      options.companyName ||
      record.companyName ||
      comp.name ||
      'RR SECURITY & FACILITIES'
    ).toUpperCase();

    const employerAddress =
      options.companyAddress ||
      record.companyAddress ||
      comp.address ||
      'G-75/A Street No 04 Block-G M.B. Extn., Badarpur, New Delhi-110044';

    const employeeName = record.name || record.employeeName || '—';
    const employeeUpperName = employeeName.toUpperCase();
    const sexMaritalStatus =
      record.sexMaritalStatus ||
      `${record.gender || '—'} | ${record.maritalStatus || '—'}`;
    const deptDesig =
      record.deptDesig ||
      (record.department && record.designation
        ? `${record.department} / ${record.designation}`
        : record.department || record.designation || '—');
    const appointmentDate = record.appointmentDate || record.joiningDate || '—';
    const permanentAddress =
      record.permanentAddress ||
      record.presentAddress ||
      record.address ||
      '—';

    const nominees =
      Array.isArray(record.nominees) && record.nominees.length > 0
        ? record.nominees
        : [];

    const todayDate =
      record.date ||
      new Date().toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });

    let curY = 52;

    // 1. Header Titles
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text("FORM 'F'", pageWidth / 2, curY, { align: 'center' });

    curY += 16;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 15, 15);
    const subRuleText =
      '[See sub-rule (1) of Rule 6] - NOMINATION UNDER PAYMENT OF GRATUITY ACT, 1972';
    doc.text(subRuleText, pageWidth / 2, curY, { align: 'center' });
    const subRuleWidth = doc.getTextWidth(subRuleText);
    doc.setLineWidth(0.75);
    doc.line(
      pageWidth / 2 - subRuleWidth / 2,
      curY + 2,
      pageWidth / 2 + subRuleWidth / 2,
      curY + 2
    );

    curY += 34;

    // 2. To Section
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.text('To,', marginX, curY);

    curY += 14;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text(employerName, marginX, curY);

    curY += 13;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    const splitAddr = doc.splitTextToSize(employerAddress, contentWidth);
    doc.text(splitAddr, marginX, curY);
    curY += splitAddr.length * 11 + 18;

    // 3. Nomination Paragraph
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    const introFull = `I, ${employeeUpperName}, whose particulars are given in the statement below, hereby nominate the person(s) mentioned below to receive the gratuity payable after my death in respect of my service in the establishment.`;
    const splitIntro = doc.splitTextToSize(introFull, contentWidth);
    doc.text(splitIntro, marginX, curY);

    curY += splitIntro.length * 12 + 22;

    // 4. Section Title: STATEMENT & PARTICULARS OF EMPLOYEE
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.text('STATEMENT & PARTICULARS OF EMPLOYEE:', marginX, curY);

    curY += 8;

    // 5. Particulars Table (2-column)
    autoTable(doc, {
      startY: curY,
      margin: { left: marginX, right: marginX },
      theme: 'plain',
      tableLineColor: [0, 0, 0],
      tableLineWidth: 1.2,
      styles: {
        fontSize: 9,
        textColor: [0, 0, 0],
        lineColor: [0, 0, 0],
        lineWidth: 0.8,
        cellPadding: 6,
        valign: 'middle',
      },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 175 },
        1: { cellWidth: contentWidth - 175 },
      },
      body: [
        ['1. Name of Employee', employeeName],
        ['2. Sex & Marital Status', sexMaritalStatus],
        ['3. Department / Designation', deptDesig],
        ['4. Date of Appointment', appointmentDate],
        ['5. Permanent Address', permanentAddress],
      ],
      didDrawPage: (data) => {
        curY = data.cursor.y;
      },
    });

    curY += 22;

    // 6. Section Title: NOMINEE DETAILS
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.text('NOMINEE DETAILS:', marginX, curY);

    curY += 8;

    // 7. Nominee Table (4-column)
    const nomineeBody = nominees.map((nom) => [
      nom.name || '—',
      nom.relationship || '—',
      nom.age || '—',
      nom.proportion || '—',
    ]);

    autoTable(doc, {
      startY: curY,
      margin: { left: marginX, right: marginX },
      theme: 'plain',
      tableLineColor: [0, 0, 0],
      tableLineWidth: 1.2,
      headStyles: {
        fontStyle: 'bold',
        fontSize: 9,
        textColor: [0, 0, 0],
        lineColor: [0, 0, 0],
        lineWidth: 0.8,
        cellPadding: 6.5,
      },
      styles: {
        fontSize: 9,
        textColor: [0, 0, 0],
        lineColor: [0, 0, 0],
        lineWidth: 0.8,
        cellPadding: 6.5,
        valign: 'middle',
      },
      columnStyles: {
        0: { cellWidth: 125 },
        1: { cellWidth: 165 },
        2: { cellWidth: 100 },
        3: { cellWidth: contentWidth - (125 + 165 + 100) },
      },
      head: [
        [
          'Name of Nominee(s)',
          'Relationship with Employee',
          'Age of Nominee',
          'Proportion of Gratuity (%)',
        ],
      ],
      body: nomineeBody,
      didDrawPage: (data) => {
        curY = data.cursor.y;
      },
    });

    curY += 40;

    // 8. Employee Signature & Date Block
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(`Date: ${todayDate}`, marginX, curY);

    const rightX = marginX + contentWidth;
    const signLineWidth = 190;
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(1);
    doc.line(rightX - signLineWidth, curY - 5, rightX, curY - 5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.8);
    doc.text(
      'Signature / Thumb Impression of Employee',
      rightX - signLineWidth / 2,
      curY + 10,
      { align: 'center' }
    );

    curY += 36;

    // 9. Dashed Horizontal Divider Line
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.8);
    doc.setLineDashPattern([3, 3], 0);
    doc.line(marginX, curY, marginX + contentWidth, curY);
    doc.setLineDashPattern([], 0); // reset dash pattern

    curY += 18;

    // 10. Employer Certificate Section
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.text('CERTIFICATE BY EMPLOYER:', marginX, curY);

    curY += 12;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    const certStatement = `Certified that the particulars of the employee written above have been verified and recorded in the office of ${employerName}.`;
    const splitCert = doc.splitTextToSize(certStatement, contentWidth);
    doc.text(splitCert, marginX, curY);

    curY += splitCert.length * 11 + 45;

    // 11. Employer Signature Block
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('Signature of Employer / Authorized Officer', rightX, curY, {
      align: 'right',
    });
  });

  // Action based on mode
  if (mode === 'print') {
    doc.autoPrint();
    const blobUrl = doc.output('bloburl');
    const printWindow = window.open(blobUrl, '_blank');
    if (printWindow) {
      printWindow.focus();
    }
  } else {
    const singleRec = records[0];
    const empPart =
      records.length === 1 && singleRec?.name
        ? `_${singleRec.name.replace(/\s+/g, '_')}_${singleRec.employeeId || 'EMP'}`
        : `_All_Employees`;
    const filename =
      options.filename || `Form_F_Gratuity_Nomination${empPart}.pdf`;
    doc.save(filename);
  }
}
export default downloadFormFPdf;
