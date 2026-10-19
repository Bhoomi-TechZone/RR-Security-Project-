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
  employeeCode = '',
  letterType = '',
  issueDate = '',
  mode = 'download',
}) {
  const companyName = company?.name || company?.companyName || 'RR Security & Facilities';
  // Smart address formatting to avoid duplicating city, state, or pinCode if address already contains them
  const rawAddr = (company?.address || '').trim();
  const city = (company?.city || '').trim();
  const state = (company?.state || '').trim();
  const pinCode = (company?.pinCode || '').trim();

  let formattedAddress = rawAddr;
  if (!formattedAddress) {
    formattedAddress = [city, state, pinCode].filter(Boolean).join(', ');
  } else {
    const lowerAddr = rawAddr.toLowerCase();
    if (city && !lowerAddr.includes(city.toLowerCase())) {
      formattedAddress += `, ${city}`;
    }
    if (state && !lowerAddr.includes(state.toLowerCase())) {
      formattedAddress += `, ${state}`;
    }
    if (pinCode && !formattedAddress.includes(pinCode)) {
      formattedAddress += ` - ${pinCode}`;
    }
  }
  const companyAddress = formattedAddress || 'Plot 45, Sector 18, Gurugram, Haryana - 122008';

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
  const formatDateDisplay = (dateVal) => {
    if (!dateVal) return '';
    const str = String(dateVal).trim();
    if (/\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\b/i.test(str)) return str;
    const d = new Date(str);
    if (isNaN(d.getTime())) return str;
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const formattedDate = issueDate ? formatDateDisplay(issueDate) : new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
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
  const watermarkText = (
    letterType === 'experience-letter' || title?.toUpperCase().includes('EXPERIENCE')
      ? 'EXPERIENCE'
      : letterType === 'appointment-letter' || title?.toUpperCase().includes('APPOINTMENT')
      ? 'APPOINTMENT'
      : letterType === 'joining-letter' || title?.toUpperCase().includes('JOINING')
      ? 'JOINING'
      : (letterType === 'full-final-letter' || title?.toUpperCase().includes('FINAL') || title?.toUpperCase().includes('SETTLEMENT'))
      ? 'F&F CLEARANCE'
      : title?.replace(/LETTER|CERTIFICATE|STATEMENT/gi, '').trim() || 'OFFICIAL'
  ).toUpperCase();
  doc.text(watermarkText, pageWidth / 2, pageHeight / 2, {
    align: 'center',
    angle: 35,
  });
  doc.restoreGraphicsState();

  // --- Header Section ---
  const headerY = 36;

  // Render Dynamic Company Logo or Fallback Initials Badge
  let logoRenderWidth = 44;
  let logoRenderHeight = 44;

  if (logoInfo?.dataUrl) {
    try {
      if (logoInfo.naturalWidth && logoInfo.naturalHeight) {
        const aspect = logoInfo.naturalWidth / logoInfo.naturalHeight;
        if (aspect >= 1) {
          logoRenderWidth = Math.min(85, 44 * aspect);
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

      const logoOffsetY = headerY + 2;
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
      doc.roundedRect(marginX, headerY + 2, 44, 44, 4, 4, 'F');
      doc.setTextColor(56, 189, 248);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text(initials, marginX + 22, headerY + 28, { align: 'center' });
      logoRenderWidth = 44;
      logoRenderHeight = 44;
    }
  } else {
    // Elegant Initials Badge
    doc.setFillColor(15, 23, 42); // Dark Navy #0f172a
    doc.roundedRect(marginX, headerY + 2, 44, 44, 4, 4, 'F');
    doc.setTextColor(56, 189, 248); // Sky 400
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text(initials, marginX + 22, headerY + 28, { align: 'center' });
    logoRenderWidth = 44;
    logoRenderHeight = 44;
  }

  const rightX = pageWidth - marginX;

  // Measure dynamic width for Right Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  const titleMeasureWidth = doc.getTextWidth(title.toUpperCase());
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  const dateMeasureWidth = doc.getTextWidth(`Date: ${formattedDate}`);
  doc.setFontSize(7.5);
  const refMeasureWidth = doc.getTextWidth(finalRefNo) + 14;
  const rightBlockWidth = Math.max(titleMeasureWidth, dateMeasureWidth, refMeasureWidth, 130);

  const textStartX = marginX + logoRenderWidth + 12;
  const maxCompanyWidth = rightX - rightBlockWidth - textStartX - 16;

  // Render Left Header: Company Information with dynamic Y cursor
  let leftY = headerY;

  // 1. Company Name
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(15, 23, 42);
  leftY += 12;
  const compNameLines = doc.splitTextToSize(companyName.toUpperCase(), maxCompanyWidth);
  for (let i = 0; i < compNameLines.length; i++) {
    if (i > 0) leftY += 13;
    doc.text(compNameLines[i], textStartX, leftY);
  }

  // 2. Company Address
  if (companyAddress) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    const addrLines = doc.splitTextToSize(companyAddress, maxCompanyWidth);
    for (let i = 0; i < addrLines.length; i++) {
      leftY += 10;
      doc.text(addrLines[i], textStartX, leftY);
    }
  }

  // 3. Contact line: Email • Phone
  const emailPhone = [companyEmail, companyPhone].filter(Boolean).join('  •  ');
  if (emailPhone) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    const epLines = doc.splitTextToSize(emailPhone, maxCompanyWidth);
    for (let i = 0; i < epLines.length; i++) {
      leftY += 9.5;
      doc.text(epLines[i], textStartX, leftY);
    }
  }

  // 4. Tax identifiers: GSTIN | PAN
  const taxParts = [];
  if (companyGstin) taxParts.push(`GSTIN: ${companyGstin}`);
  if (companyPan) taxParts.push(`PAN: ${companyPan}`);
  if (taxParts.length > 0) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    const taxStr = taxParts.join('  |  ');
    const taxLines = doc.splitTextToSize(taxStr, maxCompanyWidth);
    for (let i = 0; i < taxLines.length; i++) {
      leftY += 9.5;
      doc.text(taxLines[i], textStartX, leftY);
    }
  }

  // Render Right Header: Document Title, Date, Reference No with dynamic Y cursor
  let rightY = headerY;

  // 1. Document Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  const titleLines = doc.splitTextToSize(title.toUpperCase(), rightBlockWidth);
  for (let i = 0; i < titleLines.length; i++) {
    rightY += 12;
    doc.text(titleLines[i], rightX, rightY, { align: 'right' });
  }

  // 2. Date
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  rightY += 13;
  doc.text(`Date: ${formattedDate}`, rightX, rightY, { align: 'right' });

  // 3. Reference No badge
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  rightY += 13;
  const refText = finalRefNo;
  const refTextWidth = doc.getTextWidth(refText);
  const badgePadX = 6;
  const badgeH = 13;
  const badgeW = refTextWidth + (badgePadX * 2);
  const badgeX = rightX - badgeW;
  const badgeY = rightY - 9.5;

  doc.setFillColor(241, 245, 249); // #f1f5f9
  doc.roundedRect(badgeX, badgeY, badgeW, badgeH, 2, 2, 'F');
  doc.setTextColor(100, 116, 139); // #64748b
  doc.text(refText, rightX - badgePadX, rightY, { align: 'right' });
  rightY += 3;

  // Divider Line cleanly placed below both left and right headers
  const headerBottomY = Math.max(leftY, rightY, headerY + 2 + logoRenderHeight);
  const dividerY = headerBottomY + 11;
  doc.setDrawColor(15, 23, 42);
  doc.setLineWidth(1.5);
  doc.line(marginX, dividerY, pageWidth - marginX, dividerY);

  // --- Body Paragraphs ---
  let cursorY = dividerY + 20;
  const bottomLimit = pageHeight - 110;

  // Split content by lines / paragraphs - sanitize Indian Rupee symbol & ISO dates
  let cleanContent = (content || '')
    .replace(/₹\s?/g, 'Rs. ')
    .replace(/\b(\d{4}-\d{2}-\d{2})\b/g, (match, dateStr) => formatDateDisplay(dateStr));

  // If there's an empty gap like "from ... to ." or "duties on after", fix gracefully
  if (issueDate || formattedDate) {
    const fallbackDate = formattedDate || formatDateDisplay(issueDate);
    cleanContent = cleanContent
      .replace(/to\s+\./g, `to ${fallbackDate}.`)
      .replace(/duties\s+on\s+after/g, `duties on ${fallbackDate} after`);
  }
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
  let signY = Math.max(cursorY + 18, pageHeight - 95);

  // If signatory pushes past bottom, add new page
  if (signY > pageHeight - 45) {
    doc.addPage();
    signY = pageHeight - 95;
  }

  // Dashed separator line above signatory section matching Template Setup
  if (typeof doc.setLineDash === 'function') {
    doc.setLineDash([3, 3], 0);
  }
  doc.setDrawColor(203, 213, 225); // #cbd5e1
  doc.setLineWidth(0.75);
  doc.line(marginX, signY - 14, pageWidth - marginX, signY - 14);
  if (typeof doc.setLineDash === 'function') {
    doc.setLineDash([], 0);
  }

  const signWidth = 140;
  const signatoryName = company?.signatoryName || 'Authorized Signatory';
  const signatoryDesignation = company?.signatoryDesignation || 'Director - Human Resources';

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

  // Right Signatory: Adapt based on letter type
  const isExp = letterType === 'experience-letter' || title?.toUpperCase().includes('EXPERIENCE');
  const isAppt = letterType === 'appointment-letter' || title?.toUpperCase().includes('APPOINTMENT');
  const rightSignX = pageWidth - marginX - signWidth;

  if (isExp) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text(`Employee Name: ${employeeName}`, rightSignX, signY + 11);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(`ID: ${employeeCode || ''}`, rightSignX, signY + 21);
  } else if (isAppt) {
    doc.line(rightSignX, signY, rightSignX + signWidth, signY);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text('Candidate Acceptance Signature', rightSignX, signY + 11);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(`${employeeName} ${employeeCode ? `(${employeeCode})` : ''}`, rightSignX, signY + 21);
  } else {
    doc.line(rightSignX, signY, rightSignX + signWidth, signY);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text('Employee Acknowledgement', rightSignX, signY + 11);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(`Signature & Date (${employeeName})`, rightSignX, signY + 21);
  }

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
