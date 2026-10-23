import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * =========================================================================
 * STATUTORY PF FORM 2 (REVISED) - NOMINATION AND DECLARATION FORM
 * (For Unexempted/Exempted Establishment)
 * Exact 2-page statutory EPFO layout matching official specifications:
 * - Page 1: Personal Details, PART A (EPF) 6-column nomination table & subscriber certificate
 * - Page 2: PART B (EPS) family details, pension nomination table & employer certification
 * - Perfectly aligned table format in both preview and downloaded PDF
 * =========================================================================
 */

export async function downloadPfForm2Pdf(
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
  const pageHeight = doc.internal.pageSize.getHeight(); // 841.89 pt
  const marginX = 36;
  const contentWidth = pageWidth - marginX * 2; // ~523.28 pt

  records.forEach((emp, empIdx) => {
    if (empIdx > 0) {
      doc.addPage();
    }

    const comp = emp.companyInfo || globalCompanyInfo || {};
    const companyName = (
      comp.name ||
      emp.adminCompanyName ||
      'RR SECURITY & FACILITIES'
    ).toUpperCase();
    const companyAddress = (
      comp.address ||
      'G-75/a, Gali No. 04 Block G Molarband Extn. Badarpur SOUTH DELHI - 110044'
    );
    const city = comp.city || 'Delhi';
    const todayStr = new Date().toLocaleDateString('en-GB');

    // Employee Data
    const empName = (emp.name || emp.employeeName || '').toUpperCase();
    const fatherSpouse = emp.fatherHusbandName || emp.fatherName || emp.spouseName || '—';
    const dob = emp.dob || '—';
    const gender = (emp.gender || 'Male').toUpperCase();
    const doj = emp.joiningDate || '—';
    const maritalStatus = (emp.maritalStatus || 'Married').toUpperCase();
    const pfAccountNo = emp.allottedPfNo || emp.pfNo || emp.uan || '—';
    const permAddress = emp.permanentAddress || emp.address || '—';
    const tempAddress = emp.temporaryAddress || emp.presentAddress || permAddress || '—';

    // Nominees (Part A - EPF)
    const epfNominees = emp.epfNominees && emp.epfNominees.length > 0
      ? emp.epfNominees
      : [];

    // Family Members (Part B - EPS)
    const epsFamilyMembers = emp.epsFamilyMembers && emp.epsFamilyMembers.length > 0
      ? emp.epsFamilyMembers
      : [];

    // Pension Nominees (Part B - EPS Table 2)
    const epsNominees = emp.epsNominees && emp.epsNominees.length > 0
      ? emp.epsNominees
      : [];

    // -------------------------------------------------------------
    // PAGE 1: HEADER & PART A (EPF)
    // -------------------------------------------------------------
    let curY = 32;

    // Header Box 1: FORM NO. 2 (Revised) (Double line box)
    const box1W = 190;
    const box1H = 22;
    const box1X = (pageWidth - box1W) / 2;
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(1.2);
    doc.rect(box1X, curY, box1W, box1H);
    doc.setLineWidth(0.5);
    doc.rect(box1X + 2, curY + 2, box1W - 4, box1H - 4);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.text('FORM NO. 2 (Revised)', pageWidth / 2, curY + 15, { align: 'center' });

    curY += box1H + 8;

    // Header Box 2: NOMINATION AND DECLARATION FORM (Double line box matching statutory form)
    const box2W = 260;
    const box2H = 22;
    const box2X = (pageWidth - box2W) / 2;
    doc.setLineWidth(1.2);
    doc.rect(box2X, curY, box2W, box2H);
    doc.setLineWidth(0.5);
    doc.rect(box2X + 2, curY + 2, box2W - 4, box2H - 4);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.text('NOMINATION AND DECLARATION FORM', pageWidth / 2, curY + 15, { align: 'center' });

    // Generous breathing space after box to prevent any congestion
    curY += box2H + 16;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.text('(For Unexempted/Exempted Establishment)', pageWidth / 2, curY, { align: 'center' });
    curY += 13;

    doc.text(
      'Declaration and Nomination Form under the Employees Provident Fund & Employees Pension Scheme',
      pageWidth / 2,
      curY,
      { align: 'center' }
    );
    curY += 12;

    doc.setFontSize(7.8);
    doc.text(
      '(Paragraph 33 and 61 (1) of the Employees Provident Fund Scheme, 1952 & Paragraph 18 of the Employees Pension Scheme, 1995)',
      pageWidth / 2,
      curY,
      { align: 'center' }
    );
    curY += 22;

    // Personal Details Fields helper with clean baseline and single continuous underline
    const drawUnderlineField = (label, value, x, y, width) => {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.text(label, x, y);
      const labelW = doc.getTextWidth(label) + 4;
      const lineStart = x + labelW;
      const lineEnd = x + width;

      // Draw value on exact same baseline
      doc.setFont('helvetica', 'bold');
      const maxValW = Math.max(10, lineEnd - lineStart - 6);
      let valStr = String(value || '');
      while (doc.getTextWidth(valStr) > maxValW && valStr.length > 3) {
        valStr = valStr.substring(0, valStr.length - 4) + '...';
      }
      doc.text(valStr, lineStart + 3, y);

      // Draw underline directly below baseline
      doc.setLineWidth(0.6);
      doc.line(lineStart, y + 2, lineEnd, y + 2);
    };

    // 1. Name
    drawUnderlineField('1. Name', empName, marginX, curY, contentWidth);
    curY += 10;

    // (In capital letters) - Centered directly on the page under member name line
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.text('(In capital letters)', pageWidth / 2, curY, { align: 'center' });
    curY += 15;

    // 2. S/o, W/o, D/o Name
    drawUnderlineField('2. S/o, W/o, D/o Name', fatherSpouse, marginX, curY, contentWidth);
    curY += 17;

    // 3. Date of Birth, 4. Sex, 5. Date of Joining
    const col3W = contentWidth / 3;
    drawUnderlineField('3. Date of Birth', dob, marginX, curY, col3W - 8);
    drawUnderlineField('4. Sex', gender, marginX + col3W, curY, col3W - 14);
    drawUnderlineField('5. Date of Joining', doj, marginX + col3W * 2, curY, col3W + 22);
    curY += 17;

    // 6. Marital Status, 7. P.F. Account No.
    const col2W = contentWidth / 2;
    drawUnderlineField('6. Marital Status', maritalStatus, marginX, curY, col2W - 10);
    drawUnderlineField('7. P.F. Account No.', pfAccountNo, marginX + col2W, curY, col2W + 10);
    curY += 17;

    // 8. (A) Address Permanent (Clean multi-line underline support)
    const permLabel = '8. (A) Address Permanent';
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.text(permLabel, marginX, curY);
    const permLabelW = doc.getTextWidth(permLabel) + 4;
    const permLineStart = marginX + permLabelW;
    const permLineEnd = marginX + contentWidth;

    const permLines = doc.splitTextToSize(permAddress, permLineEnd - permLineStart);
    doc.setFont('helvetica', 'bold');
    doc.text(permLines[0] || '', permLineStart + 3, curY - 1);
    doc.setLineWidth(0.6);
    doc.line(permLineStart, curY + 2, permLineEnd, curY + 2);
    curY += 12;

    // Continuation line
    if (permLines.length > 1) {
      doc.text(permLines.slice(1).join(' '), marginX + 24, curY - 1);
    }
    doc.line(marginX + 20, curY + 2, marginX + contentWidth, curY + 2);
    curY += 14;

    // (B) Address Temporary
    const tempLabel = '(B) Address Temporary';
    doc.setFont('helvetica', 'normal');
    doc.text(tempLabel, marginX + 16, curY);
    const tempLabelW = doc.getTextWidth(tempLabel) + 4;
    const tempLineStart = marginX + 16 + tempLabelW;
    const tempLineEnd = marginX + contentWidth;

    const tempLines = doc.splitTextToSize(tempAddress, tempLineEnd - tempLineStart);
    doc.setFont('helvetica', 'bold');
    doc.text(tempLines[0] || '', tempLineStart + 3, curY - 1);
    doc.line(tempLineStart, curY + 2, tempLineEnd, curY + 2);
    curY += 12;

    // Continuation line
    if (tempLines.length > 1) {
      doc.text(tempLines.slice(1).join(' '), marginX + 24, curY - 1);
    }
    doc.line(marginX + 20, curY + 2, marginX + contentWidth, curY + 2);
    curY += 20;

    // PART A (EPF)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.text('PART A (EPF)', pageWidth / 2, curY, { align: 'center' });
    curY += 8;

    // Build PART A (EPF) Table Rows (padded to at least 6 rows)
    const partABody = [];
    const minRowsA = 6;
    const maxEntriesA = Math.max(epfNominees.length, minRowsA);

    for (let i = 0; i < maxEntriesA; i++) {
      const nom = epfNominees[i];
      if (nom) {
        partABody.push([
          nom.name || '',
          nom.address || '',
          nom.relation || '',
          nom.dob || '',
          nom.share || '100%',
          nom.guardianInfo || '—',
        ]);
      } else {
        partABody.push(['', '', '', '', '', '']);
      }
    }

    // Perfectly aligned Table 1: exact width 523 pt matching margins
    autoTable(doc, {
      startY: curY,
      tableWidth: contentWidth,
      head: [
        [
          { content: 'Name of the\nNominee/Nominees', styles: { halign: 'center' } },
          { content: 'Address', styles: { halign: 'center' } },
          { content: 'Nominees\nrelation\nwith the\nmember', styles: { halign: 'center' } },
          { content: 'Date of Birth', styles: { halign: 'center' } },
          { content: 'Total amount\nof share of\nAccumulation\nin PF to be\npaid to each\nNominee', styles: { halign: 'center' } },
          { content: 'If the Nominee\nis a minor,\nName &\nRelationship &\nAddress of the\nguardian who\nmay receive the\namount during\nminority of\nnominee', styles: { halign: 'center' } },
        ],
        [
          { content: '1', styles: { halign: 'center' } },
          { content: '2', styles: { halign: 'center' } },
          { content: '3', styles: { halign: 'center' } },
          { content: '4', styles: { halign: 'center' } },
          { content: '5', styles: { halign: 'center' } },
          { content: '6', styles: { halign: 'center' } },
        ],
      ],
      body: partABody,
      theme: 'grid',
      styles: {
        font: 'helvetica',
        fontSize: 7.2,
        cellPadding: 2.8,
        textColor: [0, 0, 0],
        lineColor: [0, 0, 0],
        lineWidth: 0.5,
        minCellHeight: 18,
        overflow: 'linebreak',
      },
      headStyles: {
        fillColor: [255, 255, 255],
        textColor: [0, 0, 0],
        fontStyle: 'normal',
        fontSize: 7.2,
        lineColor: [0, 0, 0],
        lineWidth: 0.5,
      },
      columnStyles: {
        0: { cellWidth: 95, halign: 'left' },
        1: { cellWidth: 140, halign: 'left' },
        2: { cellWidth: 68, halign: 'center' },
        3: { cellWidth: 58, halign: 'center' },
        4: { cellWidth: 72, halign: 'center' },
        5: { cellWidth: 90, halign: 'left' },
      },
      margin: { left: marginX, right: marginX },
    });

    curY = doc.lastAutoTable.finalY + 16;

    // Declarations at bottom of Page 1
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.text(
      '1.     *Certified that I have no family as defined in para 2(g) of the Employee\'s Provident Fund Scheme,',
      marginX,
      curY
    );
    curY += 10;
    doc.text(
      '        1952 and should I acquire a family hereafter the above nomination should be deemed as cancelled.',
      marginX,
      curY
    );
    curY += 12;

    doc.text('2.     *Certified that my father/mother is/are dependent upon me.', marginX, curY);
    curY += 46;

    // Footer signature Page 1
    doc.line(marginX, curY, marginX + 150, curY);
    doc.line(pageWidth - marginX - 195, curY, pageWidth - marginX, curY);

    doc.text('*Strike out whichever is not applicable', marginX, curY + 11);
    doc.text('Signature or thumb impression of the subscriber', pageWidth - marginX - 195, curY + 11);

    // -------------------------------------------------------------
    // PAGE 2: PART B (EPS) & CERTIFICATE BY EMPLOYER
    // -------------------------------------------------------------
    doc.addPage();
    curY = 36;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.text('PART B (EPS) (Para 18)', pageWidth / 2, curY, { align: 'center' });
    curY += 13;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(
      'I hereby furnish below particulars of the members of my family who would be eligible to receive widow children pension in the event of my death.',
      marginX,
      curY
    );
    curY += 10;

    // Family Member Table (Part B Table 1) - Padded to 5 rows
    const partB1Body = [];
    const minRowsB1 = 5;
    const maxEntriesB1 = Math.max(epsFamilyMembers.length, minRowsB1);

    for (let i = 0; i < maxEntriesB1; i++) {
      const fam = epsFamilyMembers[i];
      if (fam) {
        partB1Body.push([
          String(fam.slNo || i + 1),
          fam.name || '',
          fam.address || '',
          fam.dob || '',
          fam.relation || '',
        ]);
      } else {
        partB1Body.push([String(i + 1), '', '', '', '']);
      }
    }

    autoTable(doc, {
      startY: curY,
      tableWidth: contentWidth,
      head: [
        [
          { content: '', styles: { halign: 'center' } },
          { content: 'Name and Address of the Family member(s)', colSpan: 2, styles: { halign: 'center' } },
          { content: '', styles: { halign: 'center' } },
          { content: '', styles: { halign: 'center' } },
        ],
        [
          { content: 'Sl. No.', styles: { halign: 'center' } },
          { content: 'Name', styles: { halign: 'center' } },
          { content: 'Address', styles: { halign: 'center' } },
          { content: 'Date of Birth', styles: { halign: 'center' } },
          { content: 'Relationship\nwith\nmember', styles: { halign: 'center' } },
        ],
        [
          { content: '1', styles: { halign: 'center' } },
          { content: '2', styles: { halign: 'center' } },
          { content: '3', styles: { halign: 'center' } },
          { content: '4', styles: { halign: 'center' } },
          { content: '5', styles: { halign: 'center' } },
        ],
      ],
      body: partB1Body,
      theme: 'grid',
      styles: {
        font: 'helvetica',
        fontSize: 7.2,
        cellPadding: 2.8,
        textColor: [0, 0, 0],
        lineColor: [0, 0, 0],
        lineWidth: 0.5,
        minCellHeight: 14,
        overflow: 'linebreak',
      },
      headStyles: {
        fillColor: [255, 255, 255],
        textColor: [0, 0, 0],
        fontStyle: 'normal',
        fontSize: 7.2,
        lineColor: [0, 0, 0],
        lineWidth: 0.5,
      },
      columnStyles: {
        0: { cellWidth: 35, halign: 'center' },
        1: { cellWidth: 140, halign: 'left' },
        2: { cellWidth: 165, halign: 'left' },
        3: { cellWidth: 75, halign: 'center' },
        4: { cellWidth: 108, halign: 'center' },
      },
      margin: { left: marginX, right: marginX },
    });

    curY = doc.lastAutoTable.finalY + 12;

    // EPS Clause
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.text(
      '** Certified that I have no family as defined in Para 2 (vii) of Employees\' Pension Sheme, 1995 and should',
      marginX,
      curY
    );
    curY += 9;
    doc.text(
      'I acquire a family hereafter I shall furnish particulars thereon in the above form.',
      marginX,
      curY
    );
    curY += 10;
    doc.text(
      'I hereby nominate the following person for receiving the monthly pension (admissible under Para 16 2(a) (i)',
      marginX,
      curY
    );
    curY += 9;
    doc.text(
      '& (ii) in event of my death without leaving any eligible family member for receiving pension.',
      marginX,
      curY
    );
    curY += 10;

    // Pension Nominee Table (Part B Table 2) - Padded to 6 rows
    const partB2Body = [];
    const minRowsB2 = 6;
    const maxEntriesB2 = Math.max(epsNominees.length, minRowsB2);

    for (let i = 0; i < maxEntriesB2; i++) {
      const pNom = epsNominees[i];
      if (pNom) {
        partB2Body.push([
          String(pNom.slNo || i + 1),
          pNom.nameAndAddress || '',
          pNom.dob || '',
          pNom.relation || '',
        ]);
      } else {
        partB2Body.push([String(i + 1), '', '', '']);
      }
    }

    autoTable(doc, {
      startY: curY,
      tableWidth: contentWidth,
      head: [
        [
          { content: 'Sl. No.', styles: { halign: 'center' } },
          { content: 'Name & address of the Nominee', styles: { halign: 'center' } },
          { content: 'Date of\nbirth', styles: { halign: 'center' } },
          { content: 'Relationship with the member.', styles: { halign: 'center' } },
        ],
        [
          { content: '1', styles: { halign: 'center' } },
          { content: '2', styles: { halign: 'center' } },
          { content: '3', styles: { halign: 'center' } },
          { content: '4', styles: { halign: 'center' } },
        ],
      ],
      body: partB2Body,
      theme: 'grid',
      styles: {
        font: 'helvetica',
        fontSize: 7.2,
        cellPadding: 2.8,
        textColor: [0, 0, 0],
        lineColor: [0, 0, 0],
        lineWidth: 0.5,
        minCellHeight: 14,
        overflow: 'linebreak',
      },
      headStyles: {
        fillColor: [255, 255, 255],
        textColor: [0, 0, 0],
        fontStyle: 'normal',
        fontSize: 7.2,
        lineColor: [0, 0, 0],
        lineWidth: 0.5,
      },
      columnStyles: {
        0: { cellWidth: 35, halign: 'center' },
        1: { cellWidth: 265, halign: 'left' },
        2: { cellWidth: 85, halign: 'center' },
        3: { cellWidth: 138, halign: 'center' },
      },
      margin: { left: marginX, right: marginX },
    });

    curY = doc.lastAutoTable.finalY + 16;

    // Date & Subscriber Signature
    doc.text(`Date : - ${todayStr}`, marginX, curY);
    curY += 12;

    doc.line(marginX, curY, marginX + 150, curY);
    doc.line(pageWidth - marginX - 195, curY, pageWidth - marginX, curY);
    doc.text('Signature or thumb impression of the subscriber', pageWidth - marginX - 195, curY + 10);
    curY += 22;

    // CERTIFICATE BY EMPLOYER
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.text('CERTIFICATE BY EMPLOYER', pageWidth / 2, curY, { align: 'center' });
    curY += 13;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    const certText = `Certified that the above declaration and nomination has been signed/thumb impressed before me by Shri/Smt./Kum ${empName || '____________________________________'} employed in my establishment after he/she has read the entries have read over to him/her by me and got confirmed by him/her.`;
    doc.text(doc.splitTextToSize(certText, contentWidth), marginX, curY);
    curY += 34;

    // Signatures Block
    const leftX = marginX;
    const rightX = pageWidth / 2 + 10;

    // Employer signature
    doc.setFontSize(7.5);
    doc.text('Signature of the employer or other', rightX, curY);
    curY += 9;
    doc.text('Authorized officers of the establishment :- _______________________', rightX, curY);

    // Place & Designation
    doc.text(`Place : ${city}`, leftX, curY + 16);
    doc.text('Designation :- Authorized Signatory', rightX, curY + 16);

    // Dated & Establishment Stamp
    doc.text(`Dated :- ${todayStr}`, leftX, curY + 36);
    doc.text('Name and address of the factory', rightX, curY + 32);
    doc.text(`Establishment or rubber stamp there of : ${companyName}`, rightX, curY + 41);
    doc.text(`${companyAddress}`, rightX, curY + 50);
  });

  const filename = records.length === 1
    ? `PF_Form_2_Revised_${(records[0]?.employeeId || records[0]?.name || 'Form2').replace(/\s+/g, '_')}.pdf`
    : `PF_Form_2_Revised_All_Employees_${new Date().getFullYear()}.pdf`;

  if (mode === 'print') {
    doc.autoPrint();
    const blobUrl = doc.output('bloburl');
    window.open(blobUrl, '_blank');
  } else {
    doc.save(filename);
  }
}
