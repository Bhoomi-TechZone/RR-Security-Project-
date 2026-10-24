import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { downloadElementAsPdf } from './domPdfExportUtil';

/**
 * =========================================================================
 * STATUTORY PF SUMMARY REPORT EXPORTER (PDF ONLY)
 * Matches the official layout:
 * - Top Center: RR SECURITY & FACILITIES
 * - Subtitle: PF Summary Report Form month: {MONTH},{YEAR} To {MONTH},{YEAR}
 * - Top Right: Page # 1
 * - Separators: Dashed lines (------------------------------------------------)
 * - Two-tier header: Account numbers on row 1, Statutory rates on row 2
 * - Data Rows: SrNo | Location Name | Month | TotEmp | Atten. | PF Wages | A/C 1 | 3.67 | A/C 10 | A/C 21 | A/C 2 | A/C 22 | Total Amt | Year
 * - Grand Total: Summarizes employees, attendance, wages, and all 6 PF accounts
 * =========================================================================
 */

export const downloadPfSummaryReportPdf = async (reportData = {}, options = {}) => {
  // Live DOM preview capture for exact layout/styling match
  if (typeof document !== 'undefined') {
    const previewEl = document.querySelector('#report-preview-capture-area') || document.querySelector('[class*="PfSummaryReportView_container"]');
    if (previewEl) {
      const ok = await downloadElementAsPdf(previewEl, {
        filename: `PF_Summary_Report_${reportData?.monthName || 'Current'}_${reportData?.year || ''}.pdf`,
        title: 'PF Summary Report',
        mode: options.mode || 'download',
        orientation: 'landscape',
        format: 'a4',
      });
      if (ok) return;
    }
  }

  const safeData = reportData || {};
  const locations = safeData.locations || safeData.records || [];
  const grandTotal = safeData.grandTotal || {};
  const comp = safeData.companyInfo || {};
  const companyName = safeData.companyName || comp.name || 'RR SECURITY & FACILITIES';

  const monthName = (safeData.monthName || 'SEPTEMBER').toUpperCase();
  const year = safeData.year || 2026;
  const headerSubtitle = safeData.headerSubtitle ||
    `PF Summary Report Form month: ${monthName},${year} To ${monthName},${year}`;

  // Landscape A4 for wide statutory statement (841.89 pt x 595.28 pt)
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'pt',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const marginX = 24;
  const usableWidth = pageWidth - marginX * 2; // ~793.89 pt

  let startY = 32;

  // 1. Company Name (Indented / Centered in top portion)
  doc.setFont('courier', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(30, 30, 30);
  doc.text(companyName.toUpperCase(), pageWidth / 2, startY, { align: 'center' });

  // 2. Subtitle: PF Summary Report Form month: ...
  doc.setFont('courier', 'normal');
  doc.setFontSize(9.5);
  doc.text(headerSubtitle, marginX, startY + 16);

  // 3. Top Right: Page # 1
  doc.text('Page # 1', pageWidth - marginX, startY + 30, { align: 'right' });

  startY += 36;

  // Format number to 2 decimal places e.g. "150134.00"
  const fmt2 = (val) => {
    const num = Number(val || 0);
    return isNaN(num) ? '0.00' : num.toFixed(2);
  };

  // Format integer e.g. "14"
  const fmtInt = (val) => {
    const num = Number(val || 0);
    return isNaN(num) ? '0' : String(Math.round(num));
  };

  // 4. Build Body Rows
  const bodyRows = locations.map((loc, idx) => [
    fmtInt(loc.srNo || idx + 1),
    loc.locationName || '',
    (loc.month || monthName).toUpperCase(),
    fmtInt(loc.totEmp || 0),
    fmt2(loc.atten || 0),
    fmt2(loc.pfWages || 0),
    fmt2(loc.ac1_12 || loc.ac1 || 0),
    fmt2(loc.epf_3_67 || loc.ac3_67 || 0),
    fmt2(loc.ac10_8_33 || loc.ac10 || 0),
    fmt2(loc.ac21_0_5 || loc.ac21 || 0),
    fmt2(loc.ac2_0_5 || loc.ac2 || 0),
    fmt2(loc.ac22_0 || loc.ac22 || 0),
    fmt2(loc.totalAmt || 0),
    String(loc.year || year),
  ]);

  // Grand Total Row matching the image
  bodyRows.push([
    '',
    { content: 'Grand Total', styles: { fontStyle: 'bold', halign: 'left' } },
    '',
    { content: fmtInt(grandTotal.totEmp || 0), styles: { fontStyle: 'bold', halign: 'center' } },
    { content: fmt2(grandTotal.atten || 0), styles: { fontStyle: 'bold', halign: 'right' } },
    { content: fmt2(grandTotal.pfWages || 0), styles: { fontStyle: 'bold', halign: 'right' } },
    { content: fmt2(grandTotal.ac1_12 || grandTotal.ac1 || 0), styles: { fontStyle: 'bold', halign: 'right' } },
    { content: fmt2(grandTotal.epf_3_67 || grandTotal.ac3_67 || 0), styles: { fontStyle: 'bold', halign: 'right' } },
    { content: fmt2(grandTotal.ac10_8_33 || grandTotal.ac10 || 0), styles: { fontStyle: 'bold', halign: 'right' } },
    { content: fmt2(grandTotal.ac21_0_5 || grandTotal.ac21 || 0), styles: { fontStyle: 'bold', halign: 'right' } },
    { content: fmt2(grandTotal.ac2_0_5 || grandTotal.ac2 || 0), styles: { fontStyle: 'bold', halign: 'right' } },
    { content: fmt2(grandTotal.ac22_0 || grandTotal.ac22 || 0), styles: { fontStyle: 'bold', halign: 'right' } },
    { content: fmt2(grandTotal.totalAmt || 0), styles: { fontStyle: 'bold', halign: 'right' } },
    '',
  ]);

  // Table Headers
  const headRows = [
    [
      { content: 'SrNo', styles: { halign: 'left' } },
      { content: 'Location Name', styles: { halign: 'left' } },
      { content: 'Month', styles: { halign: 'left' } },
      { content: 'TotEmp', styles: { halign: 'center' } },
      { content: 'Atten.', styles: { halign: 'right' } },
      { content: 'PF Wages', styles: { halign: 'right' } },
      { content: 'A/C 1', styles: { halign: 'right' } },
      { content: '', styles: { halign: 'right' } },
      { content: 'A/C 10', styles: { halign: 'right' } },
      { content: 'A/C 21', styles: { halign: 'right' } },
      { content: 'A/C 2', styles: { halign: 'right' } },
      { content: 'A/C 22', styles: { halign: 'right' } },
      { content: 'Total Amt', styles: { halign: 'right' } },
      { content: 'Year', styles: { halign: 'center' } },
    ],
    [
      { content: '', styles: { halign: 'left' } },
      { content: '', styles: { halign: 'left' } },
      { content: '', styles: { halign: 'left' } },
      { content: '', styles: { halign: 'center' } },
      { content: '', styles: { halign: 'right' } },
      { content: '', styles: { halign: 'right' } },
      { content: '12.00', styles: { halign: 'right' } },
      { content: '3.67', styles: { halign: 'right' } },
      { content: '8.33', styles: { halign: 'right' } },
      { content: '0.50', styles: { halign: 'right' } },
      { content: '0.50', styles: { halign: 'right' } },
      { content: '0.00', styles: { halign: 'right' } },
      { content: '', styles: { halign: 'right' } },
      { content: '', styles: { halign: 'center' } },
    ],
  ];

  autoTable(doc, {
    startY,
    head: headRows,
    body: bodyRows,
    theme: 'plain',
    styles: {
      font: 'courier',
      fontSize: 8,
      cellPadding: { top: 3.5, bottom: 3.5, left: 3, right: 3 },
      textColor: [20, 20, 20],
      overflow: 'ellipsize',
    },
    headStyles: {
      font: 'courier',
      fontStyle: 'normal',
      fontSize: 8,
      fillColor: [255, 255, 255],
      textColor: [20, 20, 20],
    },
    columnStyles: {
      0: { cellWidth: 32, halign: 'left' },
      1: { cellWidth: 165, halign: 'left' },
      2: { cellWidth: 68, halign: 'left' },
      3: { cellWidth: 42, halign: 'center' },
      4: { cellWidth: 50, halign: 'right' },
      5: { cellWidth: 68, halign: 'right' },
      6: { cellWidth: 54, halign: 'right' },
      7: { cellWidth: 48, halign: 'right' },
      8: { cellWidth: 54, halign: 'right' },
      9: { cellWidth: 48, halign: 'right' },
      10: { cellWidth: 48, halign: 'right' },
      11: { cellWidth: 46, halign: 'right' },
      12: { cellWidth: 64, halign: 'right' },
      13: { cellWidth: 40, halign: 'center' },
    },
    didDrawCell: (data) => {
      const { cell, section, row } = data;

      // Draw dashed horizontal line above header row 0
      if (section === 'head' && row.index === 0) {
        doc.setDrawColor(90, 90, 90);
        doc.setLineWidth(0.6);
        doc.setLineDash([3, 2], 0);
        doc.line(cell.x, cell.y, cell.x + cell.width, cell.y);
      }

      // Draw dashed horizontal line below header row 1
      if (section === 'head' && row.index === 1) {
        doc.setDrawColor(90, 90, 90);
        doc.setLineWidth(0.6);
        doc.setLineDash([3, 2], 0);
        doc.line(cell.x, cell.y + cell.height, cell.x + cell.width, cell.y + cell.height);
      }

      // Draw dashed line above Grand Total row
      if (section === 'body' && row.index === bodyRows.length - 1) {
        doc.setDrawColor(90, 90, 90);
        doc.setLineWidth(0.6);
        doc.setLineDash([3, 2], 0);
        doc.line(cell.x, cell.y, cell.x + cell.width, cell.y);
        doc.line(cell.x, cell.y + cell.height, cell.x + cell.width, cell.y + cell.height);
      }

      // Reset line dash
      doc.setLineDash([], 0);
    },
    margin: { left: marginX, right: marginX },
  });

  const cleanMonth = (monthName || 'Monthly').replace(/\s+/g, '_');
  const filename = `PF_Summary_Report_${cleanMonth}_${year}.pdf`;

  if (options.mode === 'print') {
    doc.autoPrint();
    const blobUrl = doc.output('bloburl');
    window.open(blobUrl, '_blank');
  } else {
    doc.save(filename);
  }
};
