import * as XLSX from 'xlsx';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * =========================================================================
 * ESIC FORM 3 RETURN OF DECLARATION FORM EXPORTER (PDF, EXCEL, CSV)
 * FORM 3 [REGULATION 14, ESI REGULATIONS, 1950]
 * Uses the exact statutory template: /ESIC Form3_Return_Declaration_ESI.pdf
 * Coordinates calibrated directly against template vector content streams:
 * - Page 0 (Cover Sheet): Header, Employer Box, Declaration, Place/Date, and Row 1
 * - Page 1 (Continuation Sheet): 17 rows per page, Continuation & Signature footer
 * =========================================================================
 */

export const downloadEsicForm3Excel = (reportData = {}, options = {}) => {
  const safeData = reportData || {};
  const records = safeData.records || [];
  const companyInfo = safeData.companyInfo || {};
  const clientInfo = safeData.clientInfo || {};
  const period = safeData.period || {};

  const companyName = clientInfo?.name || companyInfo?.name || 'RR SECURITY & FACILITIES';
  const companyAddress = clientInfo?.address || companyInfo?.address || '';
  const employerCode = companyInfo?.employerCode || '20001853160000999';

  const aoa = [
    ['EMPLOYEES’ STATE INSURANCE CORPORATION'],
    ['FORM 3 [REGULATION 14] - RETURN OF DECLARATION FORM (IN DUPLICATE)'],
    [''],
    ['Name & Address of Factory / Establishment:', `${companyName}, ${companyAddress}`],
    ["Employer's Code No.:", employerCode],
    ['Local Office:', companyInfo.localOffice || 'Local Office Badarpur / Okhla, New Delhi'],
    ['Place:', companyInfo.place || 'New Delhi', 'Date:', companyInfo.date || period.declarationDate || ''],
    [''],
    [
      'S. No.',
      'Name of the Employee',
      'Distinguishing No. with employer if any',
      "Father's or Husband's Name",
      'Insurance No. allotted by Corporation',
    ],
  ];

  records.forEach((row, idx) => {
    aoa.push([
      row.srNo || idx + 1,
      row.employeeName || '',
      row.distinguishingNo || '',
      row.fatherHusbandName || '',
      row.insuranceNo || '',
    ]);
  });

  const ws = XLSX.utils.aoa_to_sheet(aoa);
  ws['!cols'] = [
    { wch: 8 },
    { wch: 30 },
    { wch: 22 },
    { wch: 28 },
    { wch: 24 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'ESIC Form 3 Return');

  const cleanMonth = (period.month || 'Monthly').replace(/-/g, '_');
  XLSX.writeFile(wb, `ESIC_Form_3_Declaration_Return_${cleanMonth}.xlsx`);
};

export const downloadEsicForm3Csv = (reportData = {}, options = {}) => {
  const safeData = reportData || {};
  const records = safeData.records || [];
  const companyInfo = safeData.companyInfo || {};
  const clientInfo = safeData.clientInfo || {};
  const period = safeData.period || {};

  const companyName = clientInfo?.name || companyInfo?.name || 'RR SECURITY & FACILITIES';
  const companyAddress = clientInfo?.address || companyInfo?.address || '';
  const employerCode = companyInfo?.employerCode || '20001853160000999';

  const lines = [
    `"EMPLOYEES' STATE INSURANCE CORPORATION"`,
    `"FORM 3 [REGULATION 14] - RETURN OF DECLARATION FORM"`,
    `"Name & Address: ${companyName}, ${companyAddress}"`,
    `"Employer's Code No.: ${employerCode}"`,
    ``,
    `"S. No.","Name of the Employee","Distinguishing No. with employer","Father's or Husband's Name","Insurance No. allotted by Corporation"`,
  ];

  records.forEach((row, idx) => {
    lines.push([
      `"${row.srNo || idx + 1}"`,
      `"${row.employeeName || ''}"`,
      `"${row.distinguishingNo || ''}"`,
      `"${row.fatherHusbandName || ''}"`,
      `"${row.insuranceNo || ''}"`,
    ].join(','));
  });

  const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + lines.join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  const cleanMonth = (period.month || 'Monthly').replace(/-/g, '_');
  link.setAttribute('download', `ESIC_Form_3_Declaration_Return_${cleanMonth}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Dynamic PDF Generator using the official template:
 * D:\RR-Security-Project-\hrms\public\ESIC Form3_Return_Declaration_ESI.pdf
 */
export const downloadEsicForm3Pdf = async (reportData = {}, options = {}) => {
  const safeData = reportData || {};
  const records = safeData.records || [];
  const companyInfo = safeData.companyInfo || {};
  const clientInfo = safeData.clientInfo || {};
  const period = safeData.period || {};

  const companyName = clientInfo?.name || companyInfo?.name || 'RR SECURITY & FACILITIES';
  const companyAddress = clientInfo?.address || companyInfo?.address || 'G-75/A, BLOCK-G, M.B.EXTN., BADARPUR, NEW DELHI-110044';
  const employerCode = String(companyInfo?.employerCode || '20001853160000999').replace(/\s/g, '');
  const place = companyInfo?.place || 'NEW DELHI';
  const localOffice = companyInfo?.localOffice || 'Badarpur / Okhla, New Delhi';
  const declarationDate = companyInfo?.date || period.declarationDate || '21/10/2026';
  const designation = companyInfo?.designation || 'Authorized Signatory';

  try {
    // 1. Fetch template PDF
    const templateUrl = encodeURI('/ESIC Form3_Return_Declaration_ESI.pdf');
    const response = await fetch(templateUrl);

    if (!response.ok) {
      throw new Error(`Template not found at ${templateUrl} (status: ${response.status})`);
    }

    const templateBytes = await response.arrayBuffer();
    const templateDoc = await PDFDocument.load(templateBytes);

    // 2. Create target document & embed fonts
    const pdfDoc = await PDFDocument.create();
    const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const textColor = rgb(0, 0, 0);

    // Template Page 0: Cover Sheet (Contains Header, Box, Declaration, & Row 1)
    // Template Page 1: Continuation Sheet (Contains Header & 17 Rows)
    const [page0Template, page1Template] = await pdfDoc.copyPages(templateDoc, [0, 1]);

    // Helper to draw text with a clean opaque white rectangle to mask underlying template dotted lines
    const drawCleanText = (targetPage, text, { x, y, size = 7.5, font = helvetica, color = textColor, maskPadding = 0.5, maskYOffset = 5.0, maskHeight = null }) => {
      if (!text) return;
      const str = String(text);
      const textWidth = font.widthOfTextAtSize(str, size);
      const h = maskHeight || (size + 4.5);
      targetPage.drawRectangle({
        x: x - maskPadding,
        y: y - maskYOffset,
        width: textWidth + maskPadding * 2,
        height: h,
        color: rgb(1, 1, 1),
      });
      targetPage.drawText(str, {
        x,
        y,
        size,
        font,
        color,
      });
    };

    // --- PAGE 0: Cover Sheet ---
    const page0 = pdfDoc.addPage(page0Template);

    // 1. Establishment Name (Line 1 on dotted line after Hindi label: x = 185, y = 740)
    drawCleanText(page0, companyName.toUpperCase().slice(0, 50), {
      x: 185,
      y: 740,
      size: 8,
      font: helveticaBold,
      color: textColor,
    });

    // Establishment Address (Line 2 on dotted line after English label: x = 230, y = 726)
    if (companyAddress) {
      page0.drawText(companyAddress.toUpperCase().slice(0, 65), {
        x: 230,
        y: 726,
        size: 7.5,
        font: helvetica,
        color: textColor,
      });
    }

    // 2. Employer Code No. (Centered inside the 17 square boxes: y = 701.5, x = 127.5 + i * 13.15)
    const cleanEmployerCode = employerCode.replace(/[^0-9A-Za-z]/g, '');
    for (let i = 0; i < Math.min(cleanEmployerCode.length, 17); i++) {
      const digit = cleanEmployerCode[i];
      const boxX = 127.5 + i * 13.15;
      page0.drawText(digit, {
        x: boxX,
        y: 701.5,
        size: 8.5,
        font: helveticaBold,
        color: textColor,
      });
    }

    // 3. Declaration Dates on dotted lines (aligned at x = 490)
    // Hindi line 2 dotted line after "... में दिनांक" (x = 490, y = 659)
    drawCleanText(page0, declarationDate, {
      x: 490,
      y: 659,
      size: 7.5,
      font: helveticaBold,
      color: textColor,
    });
    // English line 2 dotted line after "... Act, 1948 on" (x = 490, y = 601)
    drawCleanText(page0, declarationDate, {
      x: 490,
      y: 601,
      size: 7.5,
      font: helveticaBold,
      color: textColor,
    });

    // 4. Place, Local Office, Signature, Date, Designation Block
    // Row 1 (y = 535.0): स्थान Place, हस्ताक्षर Signature (shifted upward)
    // Col 1: स्थान Place
    drawCleanText(page0, place.toUpperCase(), {
      x: 88,
      y: 535.0,
      size: 7.5,
      font: helveticaBold,
      color: textColor,
    });
    // Col 3: हस्ताक्षर Signature
    drawCleanText(page0, 'Authorized Signatory', {
      x: 466,
      y: 535.0,
      size: 7.5,
      font: helveticaBold,
      color: textColor,
    });

    // Row 2 (y = 521.0): दिनांक Date, Local Office, पद Designation (shifted upward)
    // Col 1: दिनांक Date (aligned vertically with Place at x = 88)
    drawCleanText(page0, declarationDate, {
      x: 88,
      y: 521.0,
      size: 7.5,
      font: helveticaBold,
      color: textColor,
    });
    // Col 2: Local Office (moved downside to Row 2 after "Local Office" label at x = 260)
    const cleanLocalOffice = localOffice.replace(/^Local\s*Office\s*:?/i, '').trim();
    drawCleanText(page0, cleanLocalOffice.slice(0, 34), {
      x: 260,
      y: 521.0,
      size: 7.0,
      font: helvetica,
      color: textColor,
    });
    // Col 3: पद Designation (aligned vertically with Signature at x = 466)
    const cleanDesignation = designation.includes('Authorized') ? 'Authorized Signatory' : designation;
    drawCleanText(page0, cleanDesignation, {
      x: 466,
      y: 521.0,
      size: 7.5,
      font: helvetica,
      color: textColor,
    });

    // 5. Page 0 Table Slot: Leave blank so all employee records are cleanly listed on the Continuation Sheet (Page 1)

    // --- CONTINUATION PAGES (All records starting from Row 1) ---
    // Template Page 1 has 17 continuation rows spaced exactly at 18.0 pt intervals
    const CONTINUATION_ROWS_PER_PAGE = 17;
    let recIdx = 0;

    while (recIdx < records.length) {
      const [contTemplate] = await pdfDoc.copyPages(templateDoc, [1]);
      const contPage = pdfDoc.addPage(contTemplate);

      const recordsThisPage = Math.min(CONTINUATION_ROWS_PER_PAGE, records.length - recIdx);

      for (let k = 0; k < recordsThisPage; k++) {
        const rec = records[recIdx];
        const rowY = 722 - k * 18.0;

        const sr = String(rec.srNo || (recIdx + 1));
        const name = (rec.employeeName || '').toUpperCase().slice(0, 26);
        const code = String(rec.distinguishingNo || rec.employeeCode || '').slice(0, 14);
        const father = (rec.fatherHusbandName || '—').toUpperCase().slice(0, 24);
        const ins = String(rec.insuranceNo || '').trim();

        // Col 1: S. No. (centered in x = 28..50)
        contPage.drawText(sr, {
          x: 39 - sr.length * 2.5,
          y: rowY,
          size: 7.5,
          font: helvetica,
          color: textColor,
        });

        // Col 2: Name (left x = 55)
        contPage.drawText(name, {
          x: 55,
          y: rowY,
          size: 7.5,
          font: helveticaBold,
          color: textColor,
        });

        // Col 3: Distinguishing No. (centered in x = 200..285)
        contPage.drawText(code, {
          x: 242.5 - code.length * 2.5,
          y: rowY,
          size: 7.5,
          font: helvetica,
          color: textColor,
        });

        // Col 4: Father's Name (left x = 290)
        contPage.drawText(father, {
          x: 290,
          y: rowY,
          size: 7.5,
          font: helvetica,
          color: textColor,
        });

        // Col 5: Insurance No. (centered in x = 410..566)
        if (ins) {
          contPage.drawText(ins, {
            x: 488 - ins.length * 2.5,
            y: rowY,
            size: 7.5,
            font: helveticaBold,
            color: textColor,
          });
        }

        recIdx++;
      }

      // Continuation Footer Signature (dotted line starts at x = 485, y = 383)
      drawCleanText(contPage, 'Authorized Signatory', {
        x: 488,
        y: 384,
        size: 7.5,
        font: helveticaBold,
        color: textColor,
      });
    }

    // Save and Download / Print
    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const cleanMonth = (period.month || 'Monthly').replace(/-/g, '_');
    const fileName = `ESIC_Form_3_Declaration_Return_${cleanMonth}.pdf`;

    if (options.mode === 'print') {
      const blobUrl = URL.createObjectURL(blob);
      const printWindow = window.open(blobUrl, '_blank');
      if (printWindow) printWindow.focus();
    } else {
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
    }
  } catch (error) {
    console.error('Error in downloadEsicForm3Pdf:', error);
    renderCleanJsPdfFallback(reportData, options);
  }
};

/**
 * Clean English statutory fallback in case template fetch fails
 */
function renderCleanJsPdfFallback(reportData, options) {
  const safeData = reportData || {};
  const records = safeData.records || [];
  const companyInfo = safeData.companyInfo || {};
  const clientInfo = safeData.clientInfo || {};
  const period = safeData.period || {};

  const companyName = clientInfo?.name || companyInfo?.name || 'RR SECURITY & FACILITIES';
  const companyAddress = clientInfo?.address || companyInfo?.address || 'G-75/A, BLOCK-G, M.B.EXTN., BADARPUR, NEW DELHI-110044';
  const employerCode = companyInfo?.employerCode || '20001853160000999';
  const place = companyInfo?.place || 'NEW DELHI';
  const localOffice = companyInfo?.localOffice || 'Badarpur / Okhla, New Delhi';
  const declarationDate = companyInfo?.date || period.declarationDate || '21/10/2026';
  const designation = companyInfo?.designation || 'Authorized Signatory';

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginX = 36;
  const contentWidth = pageWidth - marginX * 2;

  let y = 32;

  // Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('EMPLOYEES’ STATE INSURANCE CORPORATION', pageWidth / 2, y + 10, { align: 'center' });
  doc.setFontSize(10);
  doc.text('FORM 3 - RETURN OF DECLARATION FORM', pageWidth / 2, y + 24, { align: 'center' });
  doc.setFontSize(8.5);
  doc.text('[REGULATION 14, ESI REGULATIONS, 1950]', pageWidth / 2, y + 36, { align: 'center' });

  doc.setFontSize(8.5);
  doc.text('In Duplicate\nForm 3', pageWidth - marginX, y + 12, { align: 'right' });

  y += 54;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('Name & Address of factory or Establishment:', marginX, y);
  y += 11;
  doc.setFont('helvetica', 'normal');
  doc.text(`${companyName}, ${companyAddress}`, marginX, y);
  y += 14;

  doc.setFont('helvetica', 'bold');
  doc.text(`Employer's Code No.:  ${employerCode}`, marginX, y);
  y += 14;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  const declarationText = `I send herewith Declaration Forms in respect of the employees mentioned below. I hereby declare that every person employed as an employee within the meaning of Section 2(9) of the Employees' State Insurance Act, 1948 on ${declarationDate} in this factory or establishment and in respect of remuneration not exceeding the statutory wage ceiling per month has been included in this list (excepting only those in respect of whom declaration forms have been sent in the past).`;
  const splitText = doc.splitTextToSize(declarationText, contentWidth);
  doc.text(splitText, marginX, y);
  y += splitText.length * 9 + 6;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text(`Place: ${place}        Date: ${declarationDate}        Local Office: ${localOffice}`, marginX, y);
  doc.text(`Signature: .................................       Designation: ${designation}`, marginX + 310, y);
  y += 16;

  const bodyRows = records.map((r, i) => [
    String(r.srNo || i + 1),
    r.employeeName || '',
    r.distinguishingNo || '',
    r.fatherHusbandName || '',
    r.insuranceNo || 'Pending Allotment',
  ]);

  autoTable(doc, {
    startY: y,
    head: [
      [
        { content: 'S. No.', styles: { halign: 'center' } },
        { content: 'Name of the Employee', styles: { halign: 'left' } },
        { content: 'Distinguishing No. with employer', styles: { halign: 'center' } },
        { content: 'Father’s or Husband’s Name', styles: { halign: 'left' } },
        { content: 'Insurance No. allotted by Corporation', styles: { halign: 'center' } },
      ],
    ],
    body: bodyRows,
    theme: 'plain',
    styles: {
      font: 'helvetica',
      fontSize: 7.5,
      cellPadding: 4,
      lineWidth: 0.8,
      lineColor: [0, 0, 0],
    },
    headStyles: {
      font: 'helvetica',
      fontStyle: 'bold',
      fillColor: [255, 255, 255],
      textColor: [0, 0, 0],
      lineWidth: 0.8,
      lineColor: [0, 0, 0],
    },
    columnStyles: {
      0: { cellWidth: 34, halign: 'center' },
      1: { cellWidth: 140, halign: 'left' },
      2: { cellWidth: 105, halign: 'center' },
      3: { cellWidth: 125, halign: 'left' },
      4: { cellWidth: 119.28, halign: 'center' },
    },
    margin: { left: marginX, right: marginX, bottom: 35 },
    didDrawPage: () => {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text('Encl. Declaration Form', marginX, pageHeight - 20);
      doc.text('P.T.O. / Continuation', pageWidth - marginX, pageHeight - 20, { align: 'right' });
    },
  });

  const cleanMonth = (period.month || 'Monthly').replace(/-/g, '_');
  if (options.mode === 'print') {
    doc.autoPrint();
    const blobUrl = doc.output('bloburl');
    window.open(blobUrl, '_blank');
  } else {
    doc.save(`ESIC_Form_3_Declaration_Return_${cleanMonth}.pdf`);
  }
}
