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
 * Generate and download or print Employee ID Cards PDF (Single Professional Portrait Card)
 * Matching exact user specification from Image 1.
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

  const pageWidth = doc.internal.pageSize.getWidth();   // 595.28 pt
  const pageHeight = doc.internal.pageSize.getHeight(); // 841.89 pt

  // Card dimensions on A4: 270 pt wide x 430 pt high (matching Image 1 aspect ratio)
  const cardW = 270;
  const cardH = 430;
  const cardRadius = 14;
  const cardX = (pageWidth - cardW) / 2;
  const cardY = (pageHeight - cardH) / 2;

  // Resolve Company details from local setup fallback
  let savedSetup = {};
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem('novaspark_company_setup') : null;
    if (raw) savedSetup = JSON.parse(raw);
  } catch (e) {}

  let adminCompanies = [];
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem('novaspark_admin_companies') : null;
    if (raw) adminCompanies = JSON.parse(raw);
  } catch (e) {}
  const localDefaultComp = adminCompanies.find(c => c.isDefault) || adminCompanies[0] || {};

  for (let idx = 0; idx < records.length; idx++) {
    const record = records[idx];
    if (idx > 0) {
      doc.addPage();
    }

    const recComp = record.companyInfo || {};

    const companyName = (
      recComp.name ||
      recComp.companyName ||
      record.companyName ||
      globalCompanyInfo?.name ||
      globalCompanyInfo?.companyName ||
      savedSetup?.companyName ||
      localDefaultComp?.name ||
      'RR SECURITY & FACILITIES'
    ).toUpperCase();

    const companyAddress =
      recComp.address ||
      record.companyAddress ||
      (globalCompanyInfo?.address && globalCompanyInfo.address !== '—' ? globalCompanyInfo.address : null) ||
      savedSetup?.address ||
      localDefaultComp?.address ||
      'G-75/A, New Delhi, Badarpur,Block-G, M.B.Extn,Badarpur,NEW DELHI,110044';

    const companyPhone =
      recComp.phone ||
      record.companyPhone ||
      (globalCompanyInfo?.phone && globalCompanyInfo.phone !== '—' ? globalCompanyInfo.phone : null) ||
      savedSetup?.phone ||
      savedSetup?.contactNumber ||
      localDefaultComp?.phone ||
      '9891325151';

    const companyEmail =
      recComp.email ||
      record.companyEmail ||
      (globalCompanyInfo?.email && globalCompanyInfo.email !== '—' ? globalCompanyInfo.email : null) ||
      savedSetup?.email ||
      localDefaultComp?.email ||
      'office.rrsf@gmail.com';

    const logoSrc =
      recComp.logo ||
      record.companyLogo ||
      globalCompanyInfo?.logo ||
      globalCompanyInfo?.logoUrl ||
      savedSetup?.logo ||
      localDefaultComp?.logo ||
      '';

    let photoData = null;
    if (record.photo || record.employeePhoto) {
      photoData = await loadImageInfo(record.photo || record.employeePhoto).catch(() => null);
    }

    let logoData = null;
    if (logoSrc) {
      logoData = await loadImageInfo(logoSrc).catch(() => null);
    }

    const empCode = record.employeeCode || record.employeeId || '—';
    const name = record.name || record.employeeName || '—';
    const gender = record.gender || 'Female';
    const bloodGroup = record.bloodGroup || record.blood || 'B+ve';
    const designation = record.designation || 'Office Assistant';
    const contactNo = record.contact || record.phone || record.mobile || '9891325151';
    const email = record.email || (name ? `${name.toLowerCase().replace(/[^a-z0-9]/g, '')}@gmail.com` : '—');

    // 1. Outer Card Background & Crisp Dark Border (Matching Image 1)
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(cardX, cardY, cardW, cardH, cardRadius, cardRadius, 'F');
    doc.setDrawColor(34, 34, 34);
    doc.setLineWidth(1.8);
    doc.roundedRect(cardX, cardY, cardW, cardH, cardRadius, cardRadius, 'S');

    // 2. Circular Emblem Badge at Top Center
    const emblemR = 24;
    const emblemCX = cardX + cardW / 2;
    const emblemCY = cardY + 44;

    doc.setFillColor(248, 250, 252);
    doc.circle(emblemCX, emblemCY, emblemR, 'F');
    doc.setDrawColor(74, 111, 165);
    doc.setLineWidth(1.5);
    doc.circle(emblemCX, emblemCY, emblemR, 'S');

    if (logoData?.dataUrl) {
      try {
        const logoW = emblemR * 1.5;
        const logoH = emblemR * 1.5;
        doc.addImage(
          logoData.dataUrl,
          logoData.format || 'PNG',
          emblemCX - logoW / 2,
          emblemCY - logoH / 2,
          logoW,
          logoH
        );
      } catch {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(59, 98, 155);
        doc.text('RRSF', emblemCX, emblemCY - 2, { align: 'center' });
        doc.setFontSize(6.5);
        doc.text('SECURITY', emblemCX, emblemCY + 8, { align: 'center' });
      }
    } else {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(59, 98, 155);
      doc.text('RRSF', emblemCX, emblemCY - 2, { align: 'center' });
      doc.setFontSize(6.5);
      doc.text('SECURITY', emblemCX, emblemCY + 8, { align: 'center' });
    }

    // 3. Company Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(71, 85, 105); // slate-gray #475569
    doc.text(companyName, cardX + cardW / 2, cardY + 84, { align: 'center' });

    // 4. Employee Photo (Circular crop / rounded box)
    const photoSize = 78;
    const photoX = cardX + (cardW - photoSize) / 2;
    const photoY = cardY + 96;

    if (photoData?.dataUrl) {
      try {
        doc.addImage(
          photoData.dataUrl,
          photoData.format || 'PNG',
          photoX,
          photoY,
          photoSize,
          photoSize
        );
        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(1);
        doc.rect(photoX, photoY, photoSize, photoSize, 'S');
      } catch {
        doc.setFillColor(241, 245, 249);
        doc.rect(photoX, photoY, photoSize, photoSize, 'F');
      }
    } else {
      doc.setFillColor(241, 245, 249);
      doc.circle(cardX + cardW / 2, photoY + photoSize / 2, photoSize / 2, 'F');
      doc.setDrawColor(203, 213, 225);
      doc.setLineWidth(1);
      doc.circle(cardX + cardW / 2, photoY + photoSize / 2, photoSize / 2, 'S');
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text('[ Photo ]', cardX + cardW / 2, photoY + photoSize / 2 + 3, { align: 'center' });
    }

    // 5. Employee Name
    let currentY = photoY + photoSize + 18;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12.5);
    doc.setTextColor(51, 65, 85); // #334155
    doc.text(name, cardX + cardW / 2, currentY, { align: 'center' });

    // 6. Employee Code
    currentY += 14;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(71, 85, 105); // #475569
    doc.text(empCode, cardX + cardW / 2, currentY, { align: 'center' });

    // 7. Two-Column Details with Center Vertical Divider
    const gridTop = currentY + 12;
    const gridBottom = cardY + cardH - 58;
    const colCenterX = cardX + cardW / 2;

    // Subtle vertical divider line
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(1);
    doc.line(colCenterX, gridTop, colCenterX, gridBottom);

    const leftColX = cardX + (cardW / 4);
    const rightColX = cardX + (cardW * 3 / 4);

    // Left: Gender
    let leftY = gridTop + 14;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139);
    doc.text('Gender', leftColX, leftY, { align: 'center' });

    leftY += 12;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(51, 65, 85);
    doc.text(gender, leftColX, leftY, { align: 'center' });

    // Right: Blood Group
    let rightY = gridTop + 14;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139);
    doc.text('Blood Group', rightColX, rightY, { align: 'center' });

    rightY += 12;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(51, 65, 85);
    doc.text(bloodGroup, rightColX, rightY, { align: 'center' });

    // Left: Designation
    leftY += 18;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139);
    doc.text('Designation', leftColX, leftY, { align: 'center' });

    leftY += 12;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(51, 65, 85);
    doc.text(designation, leftColX, leftY, { align: 'center' });

    // Right: Contact No
    rightY += 18;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139);
    doc.text('Contact No', rightColX, rightY, { align: 'center' });

    rightY += 12;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(51, 65, 85);
    doc.text(contactNo, rightColX, rightY, { align: 'center' });

    // Left: Email
    leftY += 18;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139);
    doc.text('Email', leftColX, leftY, { align: 'center' });

    leftY += 11;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(51, 65, 85);
    doc.text(email, leftColX, leftY, { align: 'center' });

    // 8. Bottom Footer with Divider Line
    const footerY = cardY + cardH - 46;
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(1);
    doc.line(cardX + 16, footerY, cardX + cardW - 16, footerY);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.8);
    doc.setTextColor(100, 116, 139);
    doc.text(companyAddress, cardX + cardW / 2, footerY + 14, {
      align: 'center',
      maxWidth: cardW - 24,
    });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.2);
    doc.setTextColor(100, 116, 139);
    doc.text(`${companyPhone} | Email: ${companyEmail}`, cardX + cardW / 2, footerY + 28, {
      align: 'center',
    });
  }

  const cleanFilename = options.filename || 'Employee_ID_Cards.pdf';

  if (mode === 'print') {
    doc.autoPrint();
    const blobUrl = doc.output('bloburl');
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.src = blobUrl;
    document.body.appendChild(iframe);
    setTimeout(() => {
      try {
        iframe.contentWindow.print();
      } catch {
        doc.save(cleanFilename);
      }
    }, 400);
  } else {
    doc.save(cleanFilename);
  }
}

export default downloadEmployeeIdCardPdf;
