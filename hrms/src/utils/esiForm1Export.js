import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Statutory ESI Form 1 Declaration Form & Temporary Identity Card (TIC) Exporter
 * FORM - 1 [REGULATION 11 & 12, ESI (GENERAL) REGULATIONS, 1950]
 * Exact 2-page statutory form reproducing:
 * Page 1: Insured Person Particulars, Employer Particulars, Nominee, Signatures, Family Table, TIC Card
 * Page 2: Statutory Instructions, Branch Office Use Only Box, Family Particulars Table
 */

export const downloadEsiForm1Excel = (formData = {}, options = {}) => {
  const emp = formData.selectedEmployeeData || {};
  const comp = formData.companyInfo || {};
  const nom = emp.nominee || {};
  const fam = emp.familyRows || [];

  const aoa = [
    ['FORM - 1 : DECLARATION FORM (ESI CORPORATION)'],
    [`Employer's Code No. : ${comp.employerCode || '20001853160000999'}`],
    [''],
    ["(A) INSURED PERSON'S PARTICULARS", '', "(B) EMPLOYER'S PARTICULARS", ''],
    ['1. Insurance No.', emp.insuranceNo || '—', '10. Date of Appointment', emp.appointmentDate || '—'],
    ['2. Name (in block capital)', emp.name || '—', '11. Name & Address of Employer', comp.name || '—'],
    ["3. Father's / Husband's Name", emp.fatherHusbandName || '—', '', comp.address || '—'],
    ['4. Date of Birth', emp.dob || '—', '12. Previous Employment Details', ''],
    ['5. Marital Status', emp.maritalStatus || 'Single', '  Previous Ins. No.', emp.previousEmployment?.prevInsuranceNo || '—'],
    ['6. Sex', emp.gender || 'M', '  Emplrs. Code No.', emp.previousEmployment?.prevEmployerCode || '—'],
    ['7. Present Address', emp.presentAddress?.line || '—', '  Previous Employer', emp.previousEmployment?.prevEmployerDetails || '—'],
    ['  City / State / Pin', `${emp.presentAddress?.city || ''}, ${emp.presentAddress?.state || ''} - ${(emp.presentAddress?.pin || []).join('')}`, '', ''],
    ['8. Permanent Address', emp.permanentAddress?.line || '—', 'Branch Office', emp.branchOffice || 'DELHI'],
    ['  City / State / Pin', `${emp.permanentAddress?.city || ''}, ${emp.permanentAddress?.state || ''} - ${(emp.permanentAddress?.pin || []).join('')}`, 'Dispensary', emp.dispensary || 'LOCAL DISPENSARY'],
    [''],
    ['(C) DETAILS OF NOMINEE (u/s 71 of ESI Act 1948 / Rule 56(2))'],
    ['Name of Nominee', nom.name || '—'],
    ['Relationship with Insured Person', nom.relationship || '—'],
    ['Address of Nominee', nom.address || '—'],
    [''],
    ['(D) FAMILY PARTICULARS OF INSURED PERSON'],
    ['Sl No', 'Name', 'Date of Birth', 'Relationship', 'Residing with him/her (Yes/No)', 'Place of Residence Town', 'State']
  ];

  fam.forEach((f, i) => {
    aoa.push([
      f.slNo || i + 1,
      f.name || '—',
      f.dob || '—',
      f.relationship || '—',
      f.residingWith || '—',
      f.residenceTown || '—',
      f.residenceState || '—'
    ]);
  });

  aoa.push(['']);
  aoa.push(['TEMPORARY IDENTITY CARD (TIC) DETAILS']);
  aoa.push(['Name', emp.name || '—', 'Date of Entry', emp.appointmentDate || '—']);
  aoa.push(['Ins. No.', emp.insuranceNo || '—', 'Date of Birth', emp.dob || '—']);
  aoa.push(["Father's/Husband's Name", emp.fatherHusbandName || '—', 'Dispensary', emp.dispensary || '—']);
  aoa.push(['Employer Name & Code', `${comp.name || ''} (${comp.employerCode || ''})`, 'Validity', '3 Months from Date of Appointment']);

  const ws = XLSX.utils.aoa_to_sheet(aoa);
  ws['!cols'] = [{ wch: 30 }, { wch: 32 }, { wch: 30 }, { wch: 32 }];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'ESI Form 1');
  XLSX.writeFile(wb, `ESI_Form_1_Declaration_${(emp.name || 'Employee').replace(/\s+/g, '_')}.xlsx`);
};

export const downloadEsiForm1Csv = (formData = {}, options = {}) => {
  const emp = formData.selectedEmployeeData || {};
  const comp = formData.companyInfo || {};
  const nom = emp.nominee || {};

  const lines = [
    `"FORM - 1 : DECLARATION FORM (ESI CORPORATION)"`,
    `"Employer Code","${comp.employerCode || ''}"`,
    `"Employee Name","${emp.name || ''}"`,
    `"Insurance No","${emp.insuranceNo || ''}"`,
    `"Father / Husband Name","${emp.fatherHusbandName || ''}"`,
    `"Date of Birth","${emp.dob || ''}"`,
    `"Gender","${emp.gender || ''}"`,
    `"Marital Status","${emp.maritalStatus || ''}"`,
    `"Date of Appointment","${emp.appointmentDate || ''}"`,
    `"Employer Name","${comp.name || ''}"`,
    `"Employer Address","${comp.address || ''}"`,
    `"Dispensary","${emp.dispensary || ''}"`,
    `"Branch Office","${emp.branchOffice || ''}"`,
    `"Nominee Name","${nom.name || ''}"`,
    `"Nominee Relationship","${nom.relationship || ''}"`,
    `"Nominee Address","${nom.address || ''}"`,
    ``,
    `"Sl No","Family Member Name","DOB","Relationship","Residing With (Yes/No)","Town","State"`
  ];

  (emp.familyRows || []).forEach((f) => {
    lines.push([
      `"${f.slNo}"`,
      `"${f.name || ''}"`,
      `"${f.dob || ''}"`,
      `"${f.relationship || ''}"`,
      `"${f.residingWith || ''}"`,
      `"${f.residenceTown || ''}"`,
      `"${f.residenceState || ''}"`
    ].join(','));
  });

  const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + lines.join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `ESI_Form_1_Declaration_${(emp.name || 'Employee').replace(/\s+/g, '_')}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * 2-Page Statutory Portrait PDF Generator
 * FORM - 1 [REGULATION 11 & 12, ESI (GENERAL) REGULATIONS, 1950]
 * Pixel-perfect, professional layout with zero text overlaps.
 */
export const downloadEsiForm1Pdf = (formData = {}, options = {}) => {
  const emp = formData.selectedEmployeeData || {};
  const comp = formData.companyInfo || {};
  const nom = emp.nominee || {};
  const fam = emp.familyRows || [];

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 595.28 pt
  const pageHeight = doc.internal.pageSize.getHeight(); // 841.89 pt
  const marginX = 26;
  const contentWidth = pageWidth - marginX * 2; // 543.28 pt

  // ==========================================
  // PAGE 1: DECLARATION FORM & TIC
  // ==========================================

  let y = 26;

  // Header Title & Form Number
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('DECLARATION FORM.', pageWidth / 2, y, { align: 'center' });
  doc.setFontSize(10);
  doc.text('FORM - 1', contentWidth + marginX, y, { align: 'right' });

  // ESIC Seal (left)
  doc.setDrawColor(0, 110, 210);
  doc.setLineWidth(1.2);
  doc.circle(marginX + 16, y - 5, 12);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(0, 110, 210);
  doc.text('ESIC', marginX + 16, y - 2, { align: 'center' });
  doc.setTextColor(0, 0, 0);

  y += 18;

  // Employer's Code No. with 17 Segmented Digit Cells
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text("Employer's code No.", marginX + 60, y);

  const rawCode = String(comp.employerCode || '20001853160000999').replace(/\D/g, '');
  const codeDigits = rawCode.split('').slice(0, 17);
  while (codeDigits.length < 17) codeDigits.push('');

  const cellW = 13.5;
  const cellH = 15;
  const gridStartX = marginX + 170;

  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.8);
  codeDigits.forEach((digit, i) => {
    const cx = gridStartX + i * cellW;
    doc.rect(cx, y - 11, cellW, cellH);
    doc.setFont('courier', 'bold');
    doc.setFontSize(9.5);
    doc.text(digit, cx + cellW / 2, y - 1, { align: 'center' });
  });

  y += 16;

  // Two Main Column Sections (A) and (B)
  const colW = contentWidth / 2 - 2;
  const col1X = marginX;
  const col2X = marginX + colW + 4;
  const secAH = 224;

  // Outer Boxes
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.8);
  doc.rect(col1X, y, colW, secAH);
  doc.rect(col2X, y, colW, secAH);

  // Section Headers
  doc.setFillColor(241, 245, 249);
  doc.rect(col1X, y, colW, 16, 'F');
  doc.rect(col2X, y, colW, 16, 'F');
  doc.line(col1X, y + 16, col1X + colW, y + 16);
  doc.line(col2X, y + 16, col2X + colW, y + 16);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text("(A) Insured Person's Particulars", col1X + 6, y + 11);
  doc.text("(B) Employer's Particulars", col2X + 6, y + 11);

  // ----------------------------------------------------
  // Section A Content (Left Column)
  // ----------------------------------------------------
  let curY = y + 16;
  const lblW = 82;

  // 1 Insurance No
  doc.line(col1X, curY + 20, col1X + colW, curY + 20);
  doc.line(col1X + lblW, curY, col1X + lblW, curY + 20);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text('1 Insurance No.', col1X + 4, curY + 13);
  doc.setFont('courier', 'bold');
  doc.setFontSize(9);
  doc.text(emp.insuranceNo || '—', col1X + lblW + 6, curY + 13);
  curY += 20;

  // 2 Name (in block capital)
  doc.line(col1X, curY + 20, col1X + colW, curY + 20);
  doc.line(col1X + lblW, curY, col1X + lblW, curY + 20);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text('2 Name (in block capital)', col1X + 4, curY + 13);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text((emp.name || '').toUpperCase(), col1X + lblW + 6, curY + 13);
  curY += 20;

  // 3 Father's / Husband's Name
  doc.line(col1X, curY + 20, col1X + colW, curY + 20);
  doc.line(col1X + lblW, curY, col1X + lblW, curY + 20);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text("3 Father's / Husband's", col1X + 4, curY + 9);
  doc.text("   Name", col1X + 4, curY + 17);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(emp.fatherHusbandName || '—', col1X + lblW + 6, curY + 13);
  curY += 20;

  // 4 Date of Birth, 5 Marital Status, 6 Sex
  doc.line(col1X, curY + 30, col1X + colW, curY + 30);
  doc.line(col1X + lblW, curY, col1X + lblW, curY + 30);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text('4 Date of Birth', col1X + 4, curY + 16);

  // DOB cells
  const dobX = col1X + lblW + 4;
  doc.setFontSize(6.5);
  doc.text('DD', dobX + 4, curY + 10);
  doc.text('MM', dobX + 22, curY + 10);
  doc.text('YY', dobX + 40, curY + 10);
  doc.rect(dobX, curY + 12, 16, 13);
  doc.rect(dobX + 18, curY + 12, 16, 13);
  doc.rect(dobX + 36, curY + 12, 22, 13);

  doc.setFont('courier', 'bold');
  doc.setFontSize(7.5);
  doc.text(emp.dobParts?.day || '', dobX + 8, curY + 21, { align: 'center' });
  doc.text(emp.dobParts?.month || '', dobX + 26, curY + 21, { align: 'center' });
  doc.text(emp.dobParts?.year ? String(emp.dobParts.year).slice(-2) : '', dobX + 47, curY + 21, { align: 'center' });

  // Marital Status & Sex
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text('5. Marital Status :', col1X + lblW + 66, curY + 12);
  doc.setFont('helvetica', 'bold');
  doc.text(emp.maritalStatus || 'Single', col1X + lblW + 125, curY + 12);

  doc.setFont('helvetica', 'normal');
  doc.text('6. Sex :', col1X + lblW + 66, curY + 24);
  doc.setFont('helvetica', 'bold');
  doc.text(emp.gender || 'M', col1X + lblW + 125, curY + 24);

  curY += 30;

  // 7 Present Address & 8 Permanent Address (Side-by-Side)
  const addrColW = colW / 2;
  doc.line(col1X, curY + 116, col1X + colW, curY + 116);
  doc.line(col1X + addrColW, curY, col1X + addrColW, curY + 116);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('7 Present Address', col1X + 4, curY + 10);
  doc.text('8. Permanent Address', col1X + addrColW + 4, curY + 10);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.text(emp.presentAddress?.line || '', col1X + 4, curY + 21, { maxWidth: addrColW - 8 });
  doc.text(emp.permanentAddress?.line || '', col1X + addrColW + 4, curY + 21, { maxWidth: addrColW - 8 });

  // PIN code boxes
  const pinBoxY = curY + 76;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.text('Pin', col1X + 4, pinBoxY + 8);
  const prPin = (Array.isArray(emp.presentAddress?.pin) ? emp.presentAddress.pin : []).slice(0, 6);
  while (prPin.length < 6) prPin.push('');
  prPin.forEach((d, i) => {
    doc.rect(col1X + 22 + i * 11, pinBoxY, 11, 11);
    doc.setFont('courier', 'bold');
    doc.text(String(d), col1X + 27.5 + i * 11, pinBoxY + 8, { align: 'center' });
  });

  doc.setFont('helvetica', 'bold');
  doc.text('Pin', col1X + addrColW + 4, pinBoxY + 8);
  const pePin = (Array.isArray(emp.permanentAddress?.pin) ? emp.permanentAddress.pin : []).slice(0, 6);
  while (pePin.length < 6) pePin.push('');
  pePin.forEach((d, i) => {
    doc.rect(col1X + addrColW + 22 + i * 11, pinBoxY, 11, 11);
    doc.setFont('courier', 'bold');
    doc.text(String(d), col1X + addrColW + 27.5 + i * 11, pinBoxY + 8, { align: 'center' });
  });

  // Email row
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.text(`e-mail: ${emp.email || '—'}`, col1X + 4, pinBoxY + 20);
  doc.text(`e-mail: ${emp.email || '—'}`, col1X + addrColW + 4, pinBoxY + 20);

  curY += 116;

  // Branch Office Row
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text(`Branch office:  ${emp.branchOffice || 'DELHI'}`, col1X + 6, curY + 12);

  // ----------------------------------------------------
  // Section B Content (Right Column)
  // ----------------------------------------------------
  let curBY = y + 16;
  const bLblW = 86;

  // 10 Date of Appointment
  doc.line(col2X, curBY + 30, col2X + colW, curBY + 30);
  doc.line(col2X + bLblW, curBY, col2X + bLblW, curBY + 30);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text('10. Date of', col2X + 4, curBY + 12);
  doc.text('     Appointment', col2X + 4, curBY + 20);

  const apptBoxX = col2X + bLblW + 6;
  doc.setFontSize(6.5);
  doc.text('Date', apptBoxX + 6, curBY + 10);
  doc.text('Month', apptBoxX + 32, curBY + 10);
  doc.text('Year', apptBoxX + 62, curBY + 10);
  doc.rect(apptBoxX, curBY + 12, 22, 13);
  doc.rect(apptBoxX + 26, curBY + 12, 22, 13);
  doc.rect(apptBoxX + 52, curBY + 12, 34, 13);

  doc.setFont('courier', 'bold');
  doc.setFontSize(7.5);
  doc.text(emp.appointmentParts?.day || '', apptBoxX + 11, curBY + 21, { align: 'center' });
  doc.text(emp.appointmentParts?.month || '', apptBoxX + 37, curBY + 21, { align: 'center' });
  doc.text(emp.appointmentParts?.year || '', apptBoxX + 69, curBY + 21, { align: 'center' });

  curBY += 30;

  // 11 Name & Address of Employer
  doc.line(col2X, curBY + 52, col2X + colW, curBY + 52);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('11. Name & Address of the employer', col2X + 4, curBY + 11);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text(comp.name || '', col2X + 8, curBY + 24);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.text(comp.address || '', col2X + 8, curBY + 34, { maxWidth: colW - 16 });

  curBY += 52;

  // 12 In case of previous employment
  doc.line(col2X, curBY + 20, col2X + colW, curBY + 20);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.text('12. In case of any previous employment please fillup the details as under:-', col2X + 4, curBY + 13);
  curBY += 20;

  const prevLblW = 95;

  // Previous Ins. No.
  doc.line(col2X, curBY + 18, col2X + colW, curBY + 18);
  doc.line(col2X + prevLblW, curBY, col2X + prevLblW, curBY + 18);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text('Previous Ins. No.', col2X + 4, curBY + 12);
  doc.text(emp.previousEmployment?.prevInsuranceNo || '—', col2X + prevLblW + 6, curBY + 12);
  curBY += 18;

  // Emplrs. Code No.
  doc.line(col2X, curBY + 18, col2X + colW, curBY + 18);
  doc.line(col2X + prevLblW, curBY, col2X + prevLblW, curBY + 18);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text('Emplrs. Code No.', col2X + 4, curBY + 12);
  doc.text(emp.previousEmployment?.prevEmployerCode || '—', col2X + prevLblW + 6, curBY + 12);
  curBY += 18;

  // 11. Name & Address of employer
  doc.line(col2X + prevLblW, curBY, col2X + prevLblW, curBY + 70);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text('11. Name & Address of', col2X + 4, curBY + 14);
  doc.text('     the employer', col2X + 4, curBY + 22);
  doc.text(emp.previousEmployment?.prevEmployerDetails || '—', col2X + prevLblW + 6, curBY + 16, { maxWidth: colW - prevLblW - 10 });

  y += secAH + 8;

  // ----------------------------------------------------
  // (c) Nominee Details (Clean AutoTable)
  // ----------------------------------------------------
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('(c) Details of the nominee u/s 71 of ESI Act 1948 / Rule 56(2) of ESI (Central) Rules 1950 for payment of cash benefit in the event of death', marginX, y);
  y += 5;

  autoTable(doc, {
    startY: y,
    head: [['NAME OF THE NOMINEE', 'RELATIONSHIP WITH INSURED PERSON', 'ADDRESS']],
    body: [[nom.name || '—', nom.relationship || '—', nom.address || emp.presentAddress?.line || '—']],
    theme: 'plain',
    styles: {
      font: 'helvetica',
      fontSize: 7,
      cellPadding: 3,
      lineWidth: 0.6,
      lineColor: [0, 0, 0],
    },
    headStyles: {
      fillColor: [241, 245, 249],
      fontStyle: 'bold',
      textColor: [0, 0, 0],
      fontSize: 7,
      halign: 'left',
    },
    columnStyles: {
      0: { cellWidth: 160, fontStyle: 'bold' },
      1: { cellWidth: 140 },
      2: { cellWidth: 243.28 },
    },
    margin: { left: marginX, right: marginX },
  });

  y = doc.lastAutoTable.finalY + 8;

  // Declaration Paragraph
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  const declText = 'hereby declare that the above particulars have been given by me and are correct to the best of my knowledge and I belief. I also under take to intimate to the corporation any change in the membership of my family within 15 days of such change having occured.';
  doc.text(declText, marginX, y, { maxWidth: contentWidth });
  y += 14;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('Counter Signature of the Employer', marginX, y);
  y += 14;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text('Signature with Seal', marginX + 30, y);
  doc.text('Signature / T.I. of I P', contentWidth + marginX - 100, y);
  y += 10;

  // ----------------------------------------------------
  // (D) Family Particulars Table (Robust AutoTable, Zero Overlap)
  // ----------------------------------------------------
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('(D) FAMILY PARTICULARS OF INSURED PERSON', marginX, y);
  y += 4;

  autoTable(doc, {
    startY: y,
    head: [
      ['Sl. No', 'Name of Family Member', 'Date of Birth', 'Relationship with IP', 'Whether Residing with IP', 'Town (If Not Residing)', 'State (If Not Residing)']
    ],
    body: fam.map((f, idx) => [
      String(f.slNo || idx + 1),
      f.name || '',
      f.dob || '',
      f.relationship || '',
      f.residingWith || (f.name ? 'Yes' : ''),
      f.residenceTown || '',
      f.residenceState || ''
    ]),
    theme: 'plain',
    styles: {
      font: 'helvetica',
      fontSize: 6.8,
      cellPadding: 2.2,
      lineWidth: 0.6,
      lineColor: [0, 0, 0],
      overflow: 'linebreak',
    },
    headStyles: {
      fillColor: [241, 245, 249],
      textColor: [0, 0, 0],
      fontStyle: 'bold',
      fontSize: 6.8,
      halign: 'center',
      valign: 'middle',
    },
    columnStyles: {
      0: { cellWidth: 26, halign: 'center' },
      1: { cellWidth: 124, fontStyle: 'bold' },
      2: { cellWidth: 58, halign: 'center' },
      3: { cellWidth: 95 },
      4: { cellWidth: 85, halign: 'center' },
      5: { cellWidth: 77 },
      6: { cellWidth: 78.28 },
    },
    margin: { left: marginX, right: marginX },
  });

  y = doc.lastAutoTable.finalY + 8;

  // ----------------------------------------------------
  // TEMPORARY IDENTITY CARD (TIC) - Clean AutoTable
  // ----------------------------------------------------
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('ESI CORPORATION', pageWidth / 2, y, { align: 'center' });
  y += 10;

  doc.setFontSize(7.5);
  doc.text('Temporary Identity Card', marginX + 10, y);
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7);
  doc.text('Valid for 3 months from the date of appointment', contentWidth + marginX, y, { align: 'right' });
  y += 4;

  const ticTableW = 430;
  const photoBoxW = 105;
  const ticStartY = y;

  autoTable(doc, {
    startY: ticStartY,
    body: [
      [
        { content: 'NAME', styles: { fontStyle: 'bold', fillColor: [248, 250, 252] } },
        { content: (emp.name || '—').toUpperCase(), colSpan: 3, styles: { fontStyle: 'bold' } },
      ],
      [
        { content: 'INS. NO', styles: { fontStyle: 'bold', fillColor: [248, 250, 252] } },
        { content: emp.insuranceNo || '—', styles: { font: 'courier', fontStyle: 'bold' } },
        { content: 'DATE OF ENTRY', styles: { fontStyle: 'bold', fillColor: [248, 250, 252] } },
        { content: emp.appointmentDate || '—' },
      ],
      [
        { content: "FATHER'S / HUSBAND'S NAME", styles: { fontStyle: 'bold', fillColor: [248, 250, 252] } },
        { content: emp.fatherHusbandName || '—' },
        { content: 'DATE OF BIRTH', styles: { fontStyle: 'bold', fillColor: [248, 250, 252] } },
        { content: emp.dob || '—' },
      ],
      [
        { content: 'BRANCH OFFICE', styles: { fontStyle: 'bold', fillColor: [248, 250, 252] } },
        { content: emp.branchOffice || 'DELHI' },
        { content: 'DISPENSARY', styles: { fontStyle: 'bold', fillColor: [248, 250, 252] } },
        { content: emp.dispensary || 'LOCAL DISPENSARY' },
      ],
      [
        { content: 'NAME, ADDRESS & CODE NO. OF THE EMPLOYER', styles: { fontStyle: 'bold', fillColor: [248, 250, 252] } },
        {
          content: `${comp.name || ''} — Code: ${comp.employerCode || '20001853160000999'}\n${comp.address || ''}`,
          colSpan: 3,
        },
      ],
    ],
    theme: 'plain',
    tableWidth: ticTableW,
    styles: {
      font: 'helvetica',
      fontSize: 6.8,
      cellPadding: 3,
      lineWidth: 0.6,
      lineColor: [0, 0, 0],
      overflow: 'linebreak',
    },
    columnStyles: {
      0: { cellWidth: 105 },
      1: { cellWidth: 125 },
      2: { cellWidth: 85 },
      3: { cellWidth: 115 },
    },
    margin: { left: marginX },
  });

  const ticTableEndY = doc.lastAutoTable.finalY;
  const ticTotalH = ticTableEndY - ticStartY;

  // Photo Box on Right (Firmly locked beside table)
  const photoBoxX = marginX + ticTableW + 8;
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.8);
  doc.rect(photoBoxX, ticStartY, photoBoxW, ticTotalH);

  doc.setDrawColor(100, 116, 139);
  doc.setLineDashPattern([2, 2], 0);
  doc.rect(photoBoxX + 6, ticStartY + 6, photoBoxW - 12, ticTotalH - 12);
  doc.setLineDashPattern([], 0); // reset dash

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(100, 116, 139);
  doc.text('Affix Photograph of\nInsured Person\nHere', photoBoxX + photoBoxW / 2, ticStartY + ticTotalH / 2 - 4, { align: 'center' });
  doc.setTextColor(0, 0, 0);

  y = ticTableEndY + 8;

  // Bottom TIC Signatures
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.text(`Validity : 3 Months from appointment`, marginX, y);
  doc.text(`Dated   : ${new Date().toLocaleDateString('en-GB')}`, marginX, y + 9);

  doc.setFont('helvetica', 'bold');
  doc.text('Signature / T.I. of I P', pageWidth / 2, y + 5, { align: 'center' });
  doc.text('Signature of B.M. with Seal', contentWidth + marginX, y + 5, { align: 'right' });

  // ==========================================
  // PAGE 2: INSTRUCTIONS & BRANCH OFFICE USE
  // ==========================================
  doc.addPage();
  let p2Y = 32;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('INSTRUCTIONS', pageWidth / 2, p2Y, { align: 'center' });
  p2Y += 16;

  const instructions = [
    '1  Submission of Form 1 is governed by regulations 11 & 12 of ESI (General) Regulations, 1950.',
    '2  "Family" means all or any one of the following relatives of an insured person namely:-\n(i) a Spouse (ii) a minor legitimate or adopted child dependent upon the I.P.: (iii) a child who is wholly dependent on the earnings of the I.P and who is (a) receiving education, till he or she attains the age of 21 years (b) an un married daughter; (iv) a child who is infirm by reason of any physical or mental abnormality or injury and is wholly dependent on the earnings of the I.P. so long as the infirmity continues; (v) dependent Parents.',
    '3  Identity Card is Non - Transferable.',
    '4  Loss of Identity Card be reported to Employer / Branch manager immediately.',
    '5  Submission of false information attracts penal action under section 84 of ESI Act, 1948.',
    '6  This form dully filled in must reach the concerned Branch office within 10 Days of appointment of an employee. Delay attracts penal action under section 85 of the Act, against the employer.',
    '7  As an insured person you and your dependent family members are entitled to full medical benefit from today itself. The other benefits in cash include (1) Sickness Benefit (2) Temporary Disablement Benefit (3) Permanent Disablement Benefit (4) Dependents Benefit and (5) Maternity Benefit (in case of women employees) subject to fulfillment of contributory conditions.',
    '8  For more details contact website of ESIC at www.esic.org.in or contact Regional office or Branch office.'
  ];

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.2);

  instructions.forEach((inst) => {
    const lines = doc.splitTextToSize(inst, contentWidth);
    doc.text(lines, marginX, p2Y);
    p2Y += lines.length * 8.5 + 4;
  });

  p2Y += 8;

  // FOR BRANCH OFFICE USE ONLY Box
  const boBoxW = 460;
  const boBoxH = 120;
  const boBoxX = pageWidth / 2 - boBoxW / 2;

  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.8);
  doc.rect(boBoxX, p2Y, boBoxW, boBoxH);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('FOR BRANCH OFFICE USE ONLY', pageWidth / 2, p2Y + 14, { align: 'center' });
  p2Y += 28;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text('1. Date of allotment of Ins. No. : _______________________________________________', boBoxX + 16, p2Y);
  p2Y += 18;
  doc.text('2. Date of issue of T.I.C : ______________________________________________________', boBoxX + 16, p2Y);
  p2Y += 18;
  doc.text('3. Name / No. of Disp. : ________________________________________________________', boBoxX + 16, p2Y);
  p2Y += 18;
  doc.text('4. Whether reciprocal Medical arrangements involved, if yes, Please indicate :', boBoxX + 16, p2Y);
  p2Y += 26;

  doc.setFont('helvetica', 'bold');
  doc.text('Signature of Branch Manager', boBoxX + boBoxW - 16, p2Y, { align: 'right' });
  p2Y += 20;

  // Additional Family Particulars Table on Page 2 (Exact Clean AutoTable)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('FAMILY PARTICULARS (CONTINUED)', marginX, p2Y);
  p2Y += 4;

  autoTable(doc, {
    startY: p2Y,
    head: [
      ['Sl. No', 'Name of Family Member', 'Date of Birth', 'Relationship with IP', 'Whether Residing with IP', 'Town (If Not Residing)', 'State (If Not Residing)']
    ],
    body: fam.map((f, idx) => [
      String(f.slNo || idx + 1),
      f.name || '',
      f.dob || '',
      f.relationship || '',
      f.residingWith || (f.name ? 'Yes' : ''),
      f.residenceTown || '',
      f.residenceState || ''
    ]),
    theme: 'plain',
    styles: {
      font: 'helvetica',
      fontSize: 6.8,
      cellPadding: 2.2,
      lineWidth: 0.6,
      lineColor: [0, 0, 0],
      overflow: 'linebreak',
    },
    headStyles: {
      fillColor: [241, 245, 249],
      textColor: [0, 0, 0],
      fontStyle: 'bold',
      fontSize: 6.8,
      halign: 'center',
      valign: 'middle',
    },
    columnStyles: {
      0: { cellWidth: 26, halign: 'center' },
      1: { cellWidth: 124, fontStyle: 'bold' },
      2: { cellWidth: 58, halign: 'center' },
      3: { cellWidth: 95 },
      4: { cellWidth: 85, halign: 'center' },
      5: { cellWidth: 77 },
      6: { cellWidth: 78.28 },
    },
    margin: { left: marginX, right: marginX },
  });

  // Mode output
  if (options.mode === 'print') {
    doc.autoPrint();
    const blobUrl = doc.output('bloburl');
    window.open(blobUrl, '_blank');
  } else {
    doc.save(`ESI_Form_1_Declaration_${(emp.name || 'Employee').replace(/\s+/g, '_')}.pdf`);
  }
};
