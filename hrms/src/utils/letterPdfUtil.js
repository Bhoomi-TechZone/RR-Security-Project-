import jsPDF from 'jspdf';

/**
 * Load an image source and convert to dataURL with dimensions
 */
const loadImageInfo = (src) => {
  return new Promise((resolve) => {
    if (!src || typeof src !== 'string') return resolve(null);

    // If already base64 data URI
    if (src.startsWith('data:image/')) {
      const img = new Image();
      img.onload = () => {
        const format = src.includes('image/jpeg') || src.includes('image/jpg') ? 'JPEG' : 'PNG';
        resolve({
          dataUrl: src,
          naturalWidth: img.naturalWidth || 50,
          naturalHeight: img.naturalHeight || 50,
          format,
        });
      };
      img.onerror = () => {
        resolve({
          dataUrl: src,
          naturalWidth: 50,
          naturalHeight: 50,
          format: 'PNG',
        });
      };
      img.src = src;
      return;
    }

    // If external or relative URL
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
        resolve({
          dataUrl,
          naturalWidth: canvas.width,
          naturalHeight: canvas.height,
          format: 'PNG',
        });
      } catch (err) {
        console.warn('Canvas conversion failed, passing raw src:', err);
        resolve({
          dataUrl: src,
          naturalWidth: img.naturalWidth || 50,
          naturalHeight: img.naturalHeight || 50,
          format: 'PNG',
        });
      }
    };
    img.onerror = () => {
      console.warn('Could not load company logo from:', src);
      resolve(null);
    };
    img.src = src;
  });
};

/**
 * Generate and download or print a professional, dynamic corporate letterhead PDF
 * @param {Object} params
 * @param {string} [params.title] - Document Title (e.g., 'APPOINTMENT LETTER')
 * @param {Object} [params.company] - Active company object (name, address, logo, email, etc.)
 * @param {string} [params.content] - Rendered letter body content
 * @param {string} [params.referenceNo] - Reference number
 * @param {string} [params.employeeName] - Candidate / employee name
 * @param {string} [params.mode] - 'download' (default) or 'print'
 */
export async function generateLetterPdf({
  title = 'APPOINTMENT LETTER',
  company = {},
  content = '',
  referenceNo = '',
  employeeName = 'Rahul Kumar',
  mode = 'download',
}) {
  const companyName = company?.name || company?.companyName || 'RR Security & Facilities';
  const companyAddress = [
    company?.address,
    company?.city,
    company?.state,
    company?.pinCode
  ].filter(Boolean).join(', ') || company?.address || 'Sector 18, Gurugram, Haryana - 122008';

  const companyEmail = company?.email || 'admin@rrsecurity.com';
  const companyPhone = company?.phone || '+91 9876543210';
  const companyGstin = company?.gstin || '';
  const companyPan = company?.pan || '';

  // Dynamic Company Logo resolution - isolated per company ID
  const compId = company?.companyId || company?.id || '';
  const resolvedCompanyLogo =
    company?.logo ||
    company?.companyLogo ||
    company?.logoUrl ||
    (typeof window !== 'undefined'
      ? (compId ? localStorage.getItem(`novaspark_company_logo_${compId}`) : null) ||
        (company?.isDefault ? localStorage.getItem('novaspark_company_logo_preview') : null)
      : null) ||
    null;

  const initials = (companyName.split(' ').map((w) => w[0]).join('').substring(0, 3) || 'COR').toUpperCase();
  const currentDate = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  const docPrefix = title?.toUpperCase().includes('JOIN')
    ? 'JOIN'
    : title?.toUpperCase().includes('EXPERIENCE')
    ? 'EXP'
    : (title?.toUpperCase().includes('FINAL') || title?.toUpperCase().includes('SETTLEMENT'))
    ? 'FNF'
    : 'APPT';
  const defaultSeq = docPrefix === 'JOIN' ? '018' : docPrefix === 'EXP' ? '056' : docPrefix === 'FNF' ? '009' : '042';
  const finalRefNo = referenceNo || `REF: ${docPrefix}/${initials}/${new Date().getFullYear()}/${defaultSeq}`;

  // Asynchronously load company logo
  const logoInfo = resolvedCompanyLogo ? await loadImageInfo(resolvedCompanyLogo) : null;

  // Initialize A4 Document (595.28 x 841.89 pt)
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginX = 40;
  const contentWidth = pageWidth - (marginX * 2);

  // Subtle Watermark across center
  doc.saveGraphicsState();
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(48);
  doc.setTextColor(241, 245, 249); // Very light slate
  const watermarkText = (title || 'OFFICIAL').toUpperCase();
  doc.text(watermarkText, pageWidth / 2, pageHeight / 2, {
    align: 'center',
    angle: 35,
  });
  doc.restoreGraphicsState();

  // --- Header Section ---
  const headerY = 38;

  // Render Dynamic Company Logo or Fallback Initials Badge
  let logoRenderWidth = 44;
  let logoRenderHeight = 44;

  if (logoInfo?.dataUrl) {
    try {
      if (logoInfo.naturalWidth && logoInfo.naturalHeight) {
        const aspect = logoInfo.naturalWidth / logoInfo.naturalHeight;
        if (aspect >= 1) {
          logoRenderWidth = Math.min(65, 44 * aspect);
          logoRenderHeight = logoRenderWidth / aspect;
          if (logoRenderHeight > 44) {
            logoRenderHeight = 44;
            logoRenderWidth = logoRenderHeight * aspect;
          }
        } else {
          logoRenderHeight = 44;
          logoRenderWidth = logoRenderHeight * aspect;
        }
      }

      const logoOffsetY = headerY + Math.max(0, (44 - logoRenderHeight) / 2);
      doc.addImage(
        logoInfo.dataUrl,
        logoInfo.format || 'PNG',
        marginX,
        logoOffsetY,
        logoRenderWidth,
        logoRenderHeight,
        undefined,
        'FAST'
      );
    } catch (e) {
      console.warn('doc.addImage failed, falling back to initials badge:', e);
      doc.setFillColor(15, 23, 42);
      doc.roundedRect(marginX, headerY, 44, 44, 4, 4, 'F');
      doc.setTextColor(56, 189, 248);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text(initials, marginX + 22, headerY + 28, { align: 'center' });
    }
  } else {
    // Elegant Initials Badge
    doc.setFillColor(15, 23, 42); // Dark Navy #0f172a
    doc.roundedRect(marginX, headerY, 44, 44, 4, 4, 'F');
    doc.setTextColor(56, 189, 248); // Sky 400
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text(initials, marginX + 22, headerY + 28, { align: 'center' });
  }

  const textStartX = logoInfo?.dataUrl ? marginX + logoRenderWidth + 12 : marginX + 54;
  const maxCompanyWidth = pageWidth - marginX - 140 - textStartX;

  // Company Name
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(15, 23, 42);
  doc.text(companyName.toUpperCase(), textStartX, headerY + 14);

  // Address
  if (companyAddress) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(71, 85, 105);
    doc.text(companyAddress, textStartX, headerY + 26, { maxWidth: maxCompanyWidth });
  }

  // Contact line
  const contactParts = [];
  if (companyEmail) contactParts.push(companyEmail);
  if (companyPhone) contactParts.push(companyPhone);
  if (companyGstin) contactParts.push(`GST: ${companyGstin}`);
  if (companyPan) contactParts.push(`PAN: ${companyPan}`);

  if (contactParts.length > 0) {
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(contactParts.join('  •  '), textStartX, headerY + 39, { maxWidth: maxCompanyWidth });
  }

  // Right Header: Document Title & Meta
  const rightX = pageWidth - marginX;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text(title.toUpperCase(), rightX, headerY + 14, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`Date: ${currentDate}`, rightX, headerY + 27, { align: 'right' });

  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text(finalRefNo, rightX, headerY + 39, { align: 'right' });

  // Divider Line
  const dividerY = headerY + 54;
  doc.setDrawColor(15, 23, 42);
  doc.setLineWidth(1.5);
  doc.line(marginX, dividerY, pageWidth - marginX, dividerY);

  // --- Body Paragraphs ---
  let cursorY = dividerY + 18;
  const bottomLimit = pageHeight - 110;

  // Split content by lines / paragraphs - sanitize Indian Rupee symbol for jsPDF standard fonts
  const cleanContent = (content || '').replace(/₹\s?/g, 'Rs. ');
  const rawParagraphs = cleanContent.split('\n');

  doc.setTextColor(30, 41, 59); // Slate 800

  for (let pIndex = 0; pIndex < rawParagraphs.length; pIndex++) {
    const p = rawParagraphs[pIndex].trimEnd();

    // Check if new page is needed
    if (cursorY > bottomLimit) {
      doc.addPage();
      cursorY = 40;
    }

    if (!p.trim()) {
      // Empty line / paragraph gap
      cursorY += 8;
      continue;
    }

    // Detect section headings like "1. ", "2. ", "To,", "Dear ", "Sincerely,"
    const isSectionHeading =
      /^[0-9]+\.\s+[A-Z\s&]+/.test(p) ||
      p.startsWith('Terms of ') ||
      p.startsWith('Sincerely,') ||
      p.startsWith('For ');

    if (isSectionHeading) {
      cursorY += 4;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(15, 23, 42);
    } else {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(30, 41, 59);
    }

    // Wrap paragraph text
    const lines = doc.splitTextToSize(p, contentWidth);
    for (let l = 0; l < lines.length; l++) {
      if (cursorY > bottomLimit) {
        doc.addPage();
        cursorY = 40;
      }
      doc.text(lines[l], marginX, cursorY);
      cursorY += 13.5;
    }
  }

  // --- Signatory Section at Bottom ---
  let signY = Math.max(cursorY + 16, pageHeight - 95);

  // If signatory pushes past bottom, add new page
  if (signY > pageHeight - 45) {
    doc.addPage();
    signY = pageHeight - 95;
  }

  const signWidth = 140;
  const signatoryName = company?.signatoryName || 'Authorized Signatory';
  const signatoryDesignation = company?.signatoryDesignation || 'Human Resources';

  // Left: Authorized Signatory
  doc.setDrawColor(71, 85, 105);
  doc.setLineWidth(0.75);
  doc.line(marginX, signY, marginX + signWidth, signY);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text(signatoryName, marginX, signY + 11);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`${signatoryDesignation} | For ${companyName}`, marginX, signY + 21);

  // Right: Candidate Acceptance Signature
  const rightSignX = pageWidth - marginX - signWidth;
  doc.line(rightSignX, signY, rightSignX + signWidth, signY);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text('Candidate Acceptance', rightSignX, signY + 11);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`Signature & Date (${employeeName})`, rightSignX, signY + 21);

  // Footer Tagline
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text(
    `Official System-Generated Document | ${companyName}`,
    pageWidth / 2,
    pageHeight - 16,
    { align: 'center' }
  );

  const cleanTitle = (title || 'Letter').replace(/[^a-zA-Z0-9]/g, '_');
  const cleanComp = (companyName || 'Company').replace(/[^a-zA-Z0-9]/g, '_');
  const cleanEmp = (employeeName || 'Candidate').replace(/[^a-zA-Z0-9]/g, '_');
  const fileName = `${cleanTitle}_${cleanComp}_${cleanEmp}_${new Date().toISOString().slice(0, 10)}.pdf`;

  if (mode === 'print') {
    doc.autoPrint();
    const pdfBlob = doc.output('blob');
    const pdfUrl = URL.createObjectURL(pdfBlob);
    window.open(pdfUrl, '_blank');
  } else {
    doc.save(fileName);
  }
}
