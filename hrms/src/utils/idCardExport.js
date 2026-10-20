import jsPDF from 'jspdf';

/**
 * Load an image source and convert to dataURL with dimensions
 */
const loadImageInfo = (src) => {
  return new Promise((resolve) => {
    if (!src || typeof src !== 'string') return resolve(null);

    const timer = setTimeout(() => resolve(null), 1800);
    const finish = (result) => {
      clearTimeout(timer);
      resolve(result);
    };

    if (src.startsWith('data:image/')) {
      const img = new Image();
      img.onload = () => {
        const format = src.includes('image/jpeg') || src.includes('image/jpg') ? 'JPEG' : 'PNG';
        finish({
          dataUrl: src,
          naturalWidth: img.naturalWidth || 50,
          naturalHeight: img.naturalHeight || 50,
          format,
        });
      };
      img.onerror = () => finish(null);
      img.src = src;
      return;
    }

    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || 50;
        canvas.height = img.naturalHeight || 50;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        const dataUrl = canvas.toDataURL('image/png');
        finish({
          dataUrl,
          naturalWidth: canvas.width,
          naturalHeight: canvas.height,
          format: 'PNG',
        });
      } catch {
        finish({
          dataUrl: src,
          naturalWidth: 50,
          naturalHeight: 50,
          format: 'PNG',
        });
      }
    };
    img.onerror = () => finish(null);
    img.src = src;
  });
};

/**
 * Generate and download or print Employee ID Cards PDF (CR80 printable standard)
 *
 * @param {Object|Array} inputRecord - Single record or array of records
 * @param {Object} globalCompanyInfo - Fallback company details
 * @param {Object} options - { mode: 'download' | 'print', filename: string }
 */
export async function downloadEmployeeIdCardPdf(
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

  // Card dimensions on A4: 228 pt wide x 360 pt high each
  const cardW = 228;
  const cardH = 360;
  const cardRadius = 12;

  for (let idx = 0; idx < records.length; idx++) {
    const record = records[idx];
    if (idx > 0) {
      doc.addPage();
    }

    // Try preloading photo and QR code
    let photoData = null;
    if (record.photo || record.employeePhoto) {
      photoData = await loadImageInfo(record.photo || record.employeePhoto).catch(() => null);
    }

    const empCode = record.employeeCode || record.employeeId || '—';
    const name = (record.name || record.employeeName || '—').toUpperCase();
    const desigBadge = record.designationBadge || record.designation || 'Staff';
    const phone = record.phone || record.mobile || '—';
    const emergencyPhone = record.emergencyPhone || '—';
    const dateOfIssue = record.dateOfIssue || '—';
    const dob = record.dob || '—';
    const aadhaar = record.aadhaar || '—';

    const qrData = `BEGIN:VCARD\nVERSION:3.0\nN:${name}\nFN:${name}\nORG:RR SECURITY & FACILITIES\nTEL:${phone}\nNOTE:${empCode}\nEND:VCARD`;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&margin=2&data=${encodeURIComponent(qrData)}`;
    const qrDataInfo = await loadImageInfo(qrUrl).catch(() => null);

    // Page title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(17, 54, 105);
    doc.text('RR SECURITY & FACILITIES — EMPLOYEE ID CARD', pageWidth / 2, 40, {
      align: 'center',
    });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139);
    doc.text('Official Dual-Sided Security Identity Card (CR80 Standard)', pageWidth / 2, 54, {
      align: 'center',
    });

    const gap = 36;
    const startX = (pageWidth - (cardW * 2 + gap)) / 2;
    const startY = 80;

    // -----------------------------------------------------------------
    // 1. FRONT SIDE CARD
    // -----------------------------------------------------------------
    const fx = startX;
    const fy = startY;

    // Outer Card Border
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(1.2);
    doc.roundedRect(fx, fy, cardW, cardH, cardRadius, cardRadius, 'S');

    // Header Deep Blue Area
    doc.setFillColor(17, 54, 105);
    doc.roundedRect(fx, fy, cardW, 80, cardRadius, cardRadius, 'F');
    // Square off bottom corners of header
    doc.rect(fx, fy + 40, cardW, 40, 'F');

    // Header Text
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(255, 255, 255);
    doc.text('RR SECURITY', fx + cardW / 2 + 10, fy + 34, { align: 'center' });
    doc.text('& FACILITIES', fx + cardW / 2 + 10, fy + 48, { align: 'center' });

    // Header Divider Line & Officer mark
    doc.setDrawColor(255, 255, 255);
    doc.setLineWidth(1);
    doc.line(fx + 56, fy + 22, fx + 56, fy + 58);
    doc.circle(fx + 36, fy + 38, 12, 'S');
    doc.setFontSize(7.5);
    doc.text('GUARD', fx + 36, fy + 41, { align: 'center' });

    // Photo Box
    const photoW = 86;
    const photoH = 104;
    const photoX = fx + (cardW - photoW) / 2;
    const photoY = fy + 65;

    doc.setFillColor(241, 245, 249);
    doc.roundedRect(photoX, photoY, photoW, photoH, 8, 8, 'F');
    doc.setDrawColor(17, 54, 105);
    doc.setLineWidth(2.5);
    doc.roundedRect(photoX, photoY, photoW, photoH, 8, 8, 'S');

    if (photoData?.dataUrl) {
      try {
        doc.addImage(photoData.dataUrl, photoData.format || 'PNG', photoX + 2, photoY + 2, photoW - 4, photoH - 4);
      } catch {
        // fallback
      }
    } else {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text('[ Photo ]', photoX + photoW / 2, photoY + photoH / 2, { align: 'center' });
    }

    // Emp Code
    let curY = photoY + photoH + 14;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(153, 27, 27); // maroon
    doc.text(`Emp. Code : ${empCode}`, fx + cardW / 2, curY, { align: 'center' });

    // Name
    curY += 14;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11.5);
    doc.setTextColor(17, 54, 105);
    doc.text(name, fx + cardW / 2, curY, { align: 'center' });

    // Designation Badge
    curY += 8;
    const badgeW = 75;
    const badgeH = 15;
    doc.setFillColor(17, 54, 105);
    doc.roundedRect(fx + (cardW - badgeW) / 2, curY, badgeW, badgeH, 4, 4, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(255, 255, 255);
    doc.text(desigBadge, fx + cardW / 2, curY + 11, { align: 'center' });

    // Phone
    curY += badgeH + 13;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(17, 54, 105);
    doc.text(`Ph: ${phone}`, fx + cardW / 2, curY, { align: 'center' });

    // QR Code
    curY += 6;
    const qrSize = 58;
    const qrx = fx + (cardW - qrSize) / 2;
    doc.setDrawColor(59, 130, 246);
    doc.setLineWidth(1.5);
    doc.roundedRect(qrx, curY, qrSize, qrSize, 6, 6, 'S');

    if (qrDataInfo?.dataUrl) {
      try {
        doc.addImage(qrDataInfo.dataUrl, 'PNG', qrx + 2, curY + 2, qrSize - 4, qrSize - 4);
      } catch {
        // fallback
      }
    }

    // Front Bottom Wave
    doc.setFillColor(17, 54, 105);
    doc.roundedRect(fx, fy + cardH - 18, cardW, 18, cardRadius, cardRadius, 'F');
    doc.rect(fx, fy + cardH - 18, cardW, 8, 'F');

    // -----------------------------------------------------------------
    // 2. BACK SIDE CARD
    // -----------------------------------------------------------------
    const bx = fx + cardW + gap;
    const by = startY;

    // Outer Border
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(1.2);
    doc.roundedRect(bx, by, cardW, cardH, cardRadius, cardRadius, 'S');

    // Back Top Wave
    doc.setFillColor(30, 64, 175);
    doc.roundedRect(bx, by, cardW, 30, cardRadius, cardRadius, 'F');
    doc.rect(bx, by + 16, cardW, 14, 'F');

    // Emergency Contact Title
    curY = by + 46;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(153, 27, 27);
    doc.text('EMERGENCY CONTACT', bx + cardW / 2, curY, { align: 'center' });

    curY += 14;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text(`Ph: ${emergencyPhone}`, bx + cardW / 2, curY, { align: 'center' });

    // Details Grid
    curY += 16;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(17, 54, 105);

    const leftColX = bx + 22;
    doc.text('Date Of Issue', leftColX, curY);
    doc.text(`: ${dateOfIssue}`, leftColX + 75, curY);

    curY += 14;
    doc.text('D.O.B', leftColX, curY);
    doc.text(`: ${dob}`, leftColX + 75, curY);

    curY += 14;
    doc.text('Addhar No.', leftColX, curY);
    doc.text(`: ${aadhaar}`, leftColX + 75, curY);

    // Signatory & Stamp Seal
    curY += 28;
    // Signature text
    doc.setFont('times', 'italic');
    doc.setFontSize(15);
    doc.setTextColor(30, 58, 138);
    doc.text('Kashish', bx + 55, curY);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(17, 54, 105);
    doc.text('Authorised Signature', bx + 55, curY + 11, { align: 'center' });

    // Stamp circle
    const stampX = bx + cardW - 55;
    const stampY = curY - 2;
    doc.setDrawColor(17, 54, 105);
    doc.setLineWidth(1.2);
    doc.circle(stampX, stampY, 18, 'S');
    doc.setLineWidth(0.6);
    doc.circle(stampX, stampY, 12, 'S');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.text('RRSF', stampX, stampY + 2.5, { align: 'center' });

    // Emergency Address Section
    curY += 34;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(17, 54, 105);
    doc.text('ADDRESS FOR COMMUNICATION IN CASE OF EMERGENCY', bx + cardW / 2, curY, {
      align: 'center',
    });

    curY += 12;
    doc.setFont('times', 'bold');
    doc.setFontSize(10.5);
    doc.text('RR SECURITY & FACILITIES', bx + cardW / 2, curY, { align: 'center' });

    curY += 12;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(17, 54, 105);

    const addrSplit = doc.splitTextToSize(
      'Office: G-75/A, Ground Floor, Block-G M.B. EXTN., Badarpur New Delhi-110044',
      cardW - 32
    );
    doc.text(addrSplit, bx + 16, curY);
    curY += addrSplit.length * 9 + 4;

    doc.text('Ph: 9891325151, 9891325252', bx + 16, curY);
    curY += 10;
    doc.text('Email: Office.rrsf@gmail.com', bx + 16, curY);
    curY += 10;
    doc.text('Web: www.rrsfindia.com', bx + 16, curY);

    // Back Bottom Wave
    doc.setFillColor(30, 64, 175);
    doc.roundedRect(bx, by + cardH - 12, cardW, 12, cardRadius, cardRadius, 'F');
    doc.rect(bx, by + cardH - 12, cardW, 6, 'F');

    // Label indicators below
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139);
    doc.text('[ FRONT SIDE ]', fx + cardW / 2, fy + cardH + 20, { align: 'center' });
    doc.text('[ BACK SIDE ]', bx + cardW / 2, by + cardH + 20, { align: 'center' });
  }

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
        ? `_${singleRec.name.replace(/\s+/g, '_')}_${singleRec.employeeCode || singleRec.employeeId || 'EMP'}`
        : `_All_Employees`;
    const filename = options.filename || `Employee_ID_Card${empPart}.pdf`;
    doc.save(filename);
  }
}

export default downloadEmployeeIdCardPdf;
