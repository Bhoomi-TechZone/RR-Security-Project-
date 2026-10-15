import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Format date string to clean DD/MM/YYYY
 */
function formatDate(dateStr) {
  if (!dateStr) return '—';
  const str = String(dateStr).trim();
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(str)) return str;
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
    const [y, m, d] = str.split('T')[0].split('-');
    return `${d}/${m}/${y}`;
  }
  const d = new Date(str);
  if (isNaN(d.getTime())) return str;
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Calculate age from DOB or return provided age
 */
function calculateAge(dobStr) {
  if (!dobStr) return '—';
  const str = String(dobStr).trim();
  if (/^\d{1,2}$/.test(str)) return str;

  let birthDate;
  if (/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/.test(str)) {
    const [, d, m, y] = str.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
    birthDate = new Date(`${y}-${m}-${d}`);
  } else {
    birthDate = new Date(str);
  }

  if (isNaN(birthDate.getTime())) return '—';
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age > 0 ? String(age) : '—';
}

/**
 * Load an image source and convert to dataURL with dimensions
 */
const loadImageInfo = (src) => {
  return new Promise((resolve) => {
    if (!src || typeof src !== 'string') return resolve(null);

    // Safety timeout to prevent hanging on external requests
    const timer = setTimeout(() => resolve(null), 1800);

    const finish = (result) => {
      clearTimeout(timer);
      resolve(result);
    };

    // If already base64 data URI
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

    // External or relative URL
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
      } catch (err) {
        finish({
          dataUrl: src,
          naturalWidth: img.naturalWidth || 50,
          naturalHeight: img.naturalHeight || 50,
          format: 'PNG',
        });
      }
    };
    img.onerror = () => finish(null);
    img.src = src;
  });
};

/**
 * Helper to resolve dynamic company logo
 */
function resolveCompanyLogo(company, employee) {
  const companyId = company?.companyId || company?.id || company?._id || employee?.companyId || '';
  if (company?.logo && typeof company.logo === 'string') return company.logo;
  if (company?.logoUrl && typeof company.logoUrl === 'string') return company.logoUrl;

  if (typeof window !== 'undefined') {
    if (companyId) {
      const stored = localStorage.getItem(`novaspark_company_logo_${companyId}`);
      if (stored) return stored;
    }
    const preview = localStorage.getItem('novaspark_company_logo_preview');
    if (preview) return preview;
    const defaultRrs = localStorage.getItem('novaspark_company_logo_RRS8392014SEC');
    if (defaultRrs) return defaultRrs;
  }
  return null;
}

/**
 * Helper to resolve employee photo
 */
function resolveEmployeePhoto(employee) {
  if (!employee) return null;
  if (employee.employeePhoto && typeof employee.employeePhoto === 'string') return employee.employeePhoto;
  if (employee.photo && typeof employee.photo === 'string') return employee.photo;
  if (employee.avatar && typeof employee.avatar === 'string') return employee.avatar;
  if (employee.profilePhoto && typeof employee.profilePhoto === 'string') return employee.profilePhoto;
  if (employee.documents?.photo && typeof employee.documents.photo === 'string') return employee.documents.photo;

  if (Array.isArray(employee.documentList)) {
    const photoDoc = employee.documentList.find(d => d.type === 'photo' || d.key === 'photo');
    if (photoDoc?.url) return photoDoc.url;
  }
  return null;
}

/**
 * Generate and directly download an authentic, single-page A4 Employee Profile PDF
 * matching Image 2, with dynamic employee photo, complete company branding, and executive styling.
 *
 * @param {Object} employee - The employee data record
 * @param {Object} company - Active company details from context or database
 * @param {Object} [options] - Optional configurations
 */
export async function downloadEmployeeProfile(employee, company = {}, options = {}) {
  if (!employee) return;

  const mode = options?.mode || 'download';

  // 1. Resolve Company Details
  const companyName = (company?.name || employee?.companyName || employee?.clientName || 'RR SECURITY & FACILITIES').toUpperCase();

  const addrTokens = [
    company?.address,
    company?.city,
    company?.state,
    company?.pinCode ? (String(company.pinCode).startsWith('-') ? company.pinCode : `- ${company.pinCode}`) : null
  ].filter(Boolean);

  const fullCompanyAddress = addrTokens.length > 0
    ? addrTokens.join(', ')
    : (company?.address || 'G-75/A, Gali No-04 Block-G, M.B. Extn, Badarpur, New Delhi - 110044');

  const companyPhone = company?.phone || '+91 9876543210';
  const companyEmail = company?.email || 'rrsecurity@gmail.com';
  const companyGstin = company?.gstin || '09ABCDE1234F1Z5';
  const companyPan = company?.pan || 'ABCDE1234F';

  // 2. Resolve Logos & Photos in Parallel
  const rawLogo = resolveCompanyLogo(company, employee);
  const rawPhoto = resolveEmployeePhoto(employee);

  const [logoInfo, photoInfo] = await Promise.all([
    rawLogo ? loadImageInfo(rawLogo) : Promise.resolve(null),
    rawPhoto ? loadImageInfo(rawPhoto) : Promise.resolve(null),
  ]);

  // 3. Initialize jsPDF Document (A4 Portrait in Points)
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginX = 36;
  const contentWidth = pageWidth - (marginX * 2);

  // --- TOP HEADER ---
  const headerY = 28;

  // Company Logo
  if (logoInfo?.dataUrl) {
    try {
      doc.addImage(logoInfo.dataUrl, logoInfo.format || 'PNG', marginX, headerY, 44, 44);
    } catch {
      drawFallbackLogoBadge(doc, marginX, headerY);
    }
  } else {
    drawFallbackLogoBadge(doc, marginX, headerY);
  }

  // Company Text Details
  const infoX = marginX + 52;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14.5);
  doc.setTextColor(15, 43, 72); // Deep Navy #0f2b48
  doc.text(companyName, infoX, headerY + 14);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text(fullCompanyAddress, infoX, headerY + 26, { maxWidth: 300 });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text(`Phone: ${companyPhone}   •   Email: ${companyEmail}   •   GSTIN: ${companyGstin}${companyPan ? `   •   PAN: ${companyPan}` : ''}`, infoX, headerY + 37);

  // Right Official Badge
  const badgeWidth = 92;
  const badgeHeight = 16;
  const badgeX = pageWidth - marginX - badgeWidth;
  const badgeY = headerY + 6;

  doc.setFillColor(219, 234, 254); // Light blue #dbeafe
  doc.setDrawColor(191, 219, 254);
  doc.setLineWidth(0.75);
  doc.roundedRect(badgeX, badgeY, badgeWidth, badgeHeight, 8, 8, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(30, 64, 175); // Navy #1e40af
  doc.text('OFFICIAL PROFILE', badgeX + (badgeWidth / 2), badgeY + 11, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text('EMPLOYEE RECORD', badgeX + (badgeWidth / 2), badgeY + 26, { align: 'center' });

  // Navy Header Divider Line
  const dividerY = headerY + 48;
  doc.setDrawColor(30, 58, 138); // #1e3a8a
  doc.setLineWidth(2);
  doc.line(marginX, dividerY, pageWidth - marginX, dividerY);

  // --- EMPLOYEE IDENTITY & PHOTO CARD ---
  const heroY = dividerY + 10;
  const heroHeight = 60;

  doc.setDrawColor(203, 213, 225); // Border #cbd5e1
  doc.setLineWidth(0.75);
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(marginX, heroY, contentWidth, heroHeight, 5, 5, 'FD');

  // Employee Photo
  const photoX = marginX + 10;
  const photoY = heroY + 6;
  const photoW = 40;
  const photoH = 48;

  if (photoInfo?.dataUrl) {
    try {
      doc.addImage(photoInfo.dataUrl, photoInfo.format || 'JPEG', photoX, photoY, photoW, photoH);
      doc.setDrawColor(203, 213, 225);
      doc.setLineWidth(0.5);
      doc.roundedRect(photoX, photoY, photoW, photoH, 3, 3, 'S');
    } catch {
      drawFallbackAvatar(doc, photoX, photoY, photoW, photoH);
    }
  } else {
    drawFallbackAvatar(doc, photoX, photoY, photoW, photoH);
  }

  // Identity Information
  const empInfoX = photoX + photoW + 12;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(15, 23, 42); // #0f172a
  doc.text((employee.name || '—').toUpperCase(), empInfoX, heroY + 20);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(30, 58, 138); // #1e3a8a
  doc.text(employee.designation || 'Security Guard', empInfoX, heroY + 34);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(37, 99, 235); // #2563eb
  doc.text(employee.gender || 'Male', empInfoX, heroY + 47);

  // Right Metadata: Code & Joining Date
  const rightEdge = pageWidth - marginX - 16;
  const metaLabelX = rightEdge - 130;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text('Employee Code', metaLabelX, heroY + 24);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text(employee.employeeId || employee.code || '—', rightEdge, heroY + 24, { align: 'right' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text('Joining Date', metaLabelX, heroY + 44);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text(formatDate(employee.joiningDate), rightEdge, heroY + 44, { align: 'right' });

  // --- SECTION 1: PERSONAL INFORMATION ---
  let currentY = heroY + heroHeight + 9;

  autoTable(doc, {
    startY: currentY,
    margin: { left: marginX, right: marginX },
    head: [[{ content: 'Personal Information', colSpan: 4, styles: { fillColor: [248, 250, 252], textColor: [30, 58, 138], fontStyle: 'bold', fontSize: 8.5 } }]],
    body: [
      ['EMPLOYEE NAME', employee.name || '—', 'FATHER / HUSBAND NAME', employee.fatherHusbandName || employee.fatherName || employee.spouseName || '—'],
      ['GENDER', employee.gender || 'Male', 'MARITAL STATUS', employee.maritalStatus || 'Married'],
      ['MOBILE NUMBER', employee.contact || employee.mobile || '—', 'EMERGENCY CONTACT', employee.alternateMobile || employee.emergencyMobile || employee.emergencyContact || '—'],
      ['AADHAAR NUMBER', employee.aadhaar || employee.aadhaarNumber || '—', 'EDUCATION', employee.qualification || employee.education || employee.technicalQualification || '—'],
      ['LANGUAGE', employee.language || employee.languages || 'Hindi and English', 'EMAIL', employee.email || '—'],
    ],
    theme: 'grid',
    styles: { fontSize: 7.5, cellPadding: 3.5, lineColor: [203, 213, 225], lineWidth: 0.5, font: 'helvetica' },
    columnStyles: {
      0: { fontStyle: 'bold', textColor: [71, 85, 105], cellWidth: 105 },
      1: { textColor: [15, 23, 42], cellWidth: 155 },
      2: { fontStyle: 'bold', textColor: [71, 85, 105], cellWidth: 110 },
      3: { textColor: [15, 23, 42] },
    }
  });

  currentY = doc.lastAutoTable.finalY + 8;

  // --- SECTION 2: EMPLOYMENT & PAYROLL ---
  autoTable(doc, {
    startY: currentY,
    margin: { left: marginX, right: marginX },
    head: [[{ content: 'Employment & Payroll', colSpan: 4, styles: { fillColor: [248, 250, 252], textColor: [30, 58, 138], fontStyle: 'bold', fontSize: 8.5 } }]],
    body: [
      ['CLIENT NAME', employee.clientName || employee.companyName || companyName, 'LOCATION', employee.siteLocation || employee.site || employee.joiningLocation || 'Office'],
      ['BANK NAME', employee.bankName || '—', 'BANK A/C NO.', employee.accountNumber || employee.accountNo || employee.bankAccount || '—'],
      ['IFSC', employee.ifsc || employee.ifscCode || '—', 'PAN NO.', employee.pan || employee.panNumber || '—'],
      ['UAN', employee.uan || employee.uanNo || '—', 'ESIC', employee.esicNo || employee.esic || employee.esiNo || '—'],
    ],
    theme: 'grid',
    styles: { fontSize: 7.5, cellPadding: 3.5, lineColor: [203, 213, 225], lineWidth: 0.5, font: 'helvetica' },
    columnStyles: {
      0: { fontStyle: 'bold', textColor: [71, 85, 105], cellWidth: 105 },
      1: { textColor: [15, 23, 42], cellWidth: 155 },
      2: { fontStyle: 'bold', textColor: [71, 85, 105], cellWidth: 110 },
      3: { textColor: [15, 23, 42] },
    }
  });

  currentY = doc.lastAutoTable.finalY + 8;

  // --- SECTION 3: ADDRESS DETAILS ---
  autoTable(doc, {
    startY: currentY,
    margin: { left: marginX, right: marginX },
    head: [[{ content: 'Address Details', colSpan: 4, styles: { fillColor: [248, 250, 252], textColor: [30, 58, 138], fontStyle: 'bold', fontSize: 8.5 } }]],
    body: [
      ['PRESENT ADDRESS', employee.presentAddress || employee.currentAddress || employee.address || '—', 'PERMANENT ADDRESS', employee.permanentAddress || employee.presentAddress || '—'],
    ],
    theme: 'grid',
    styles: { fontSize: 7.5, cellPadding: 3.5, lineColor: [203, 213, 225], lineWidth: 0.5, font: 'helvetica' },
    columnStyles: {
      0: { fontStyle: 'bold', textColor: [71, 85, 105], cellWidth: 105 },
      1: { textColor: [15, 23, 42], cellWidth: 155 },
      2: { fontStyle: 'bold', textColor: [71, 85, 105], cellWidth: 110 },
      3: { textColor: [15, 23, 42] },
    }
  });

  currentY = doc.lastAutoTable.finalY + 8;

  // --- SECTION 4: FAMILY DETAILS ---
  let famTableBody = [];
  if (Array.isArray(employee.familyMembers) && employee.familyMembers.length > 0) {
    const valid = employee.familyMembers.filter(m => m && (m.name || m.familyMemberName || m.relation));
    if (valid.length > 0) {
      famTableBody = valid.map((m, i) => [
        String(i + 1),
        m.name || m.familyMemberName || '—',
        m.relation || '—',
        formatDate(m.dob || m.dobAge),
        m.age || calculateAge(m.dob || m.dobAge),
        m.nomineeYesNo || m.nominee || 'Yes',
        m.nomineeSharePercent ? `${m.nomineeSharePercent}%` : (m.sharePercent ? `${m.sharePercent}%` : '—')
      ]);
    }
  }

  // Fallback if no valid familyMembers
  if (famTableBody.length === 0) {
    if (employee.familyMemberName) {
      famTableBody = [['1', employee.familyMemberName, employee.relation || 'Relative', formatDate(employee.dobAge || ''), calculateAge(employee.dobAge || ''), employee.nomineeYesNo || 'Yes', employee.nomineeSharePercent ? `${employee.nomineeSharePercent}%` : '100%']];
    } else if (employee.fatherHusbandName) {
      famTableBody = [['1', employee.fatherHusbandName, employee.fatherHusbandRelation || 'Father', '—', '—', 'Yes', '100%']];
    } else {
      famTableBody = [['1', 'No family records registered', '—', '—', '—', '—', '—']];
    }
  }

  autoTable(doc, {
    startY: currentY,
    margin: { left: marginX, right: marginX },
    head: [['#', 'Family Member', 'Relation', 'DOB', 'Age', 'Nominee', 'Share %']],
    body: famTableBody,
    theme: 'grid',
    styles: { fontSize: 7.5, cellPadding: 3.5, lineColor: [203, 213, 225], lineWidth: 0.5, font: 'helvetica' },
    headStyles: { fillColor: [248, 250, 252], textColor: [71, 85, 105], fontStyle: 'bold', fontSize: 7.5 },
    columnStyles: {
      0: { halign: 'center', cellWidth: 26 },
      1: { fontStyle: 'bold', textColor: [15, 23, 42] },
      2: { textColor: [51, 65, 85] },
      3: { textColor: [51, 65, 85] },
      4: { textColor: [51, 65, 85] },
      5: { textColor: [51, 65, 85] },
      6: { fontStyle: 'bold', textColor: [15, 23, 42] },
    }
  });

  currentY = doc.lastAutoTable.finalY + 10;

  // --- SECTION 5: PROFESSIONAL DECLARATION & UNDERTAKING ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(30, 58, 138);
  doc.text('Declaration & Undertaking', marginX, currentY + 4);

  currentY += 8;
  const decBoxHeight = 36;
  doc.setFillColor(248, 250, 252); // Soft subtle tint #f8fafc
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.75);
  doc.roundedRect(marginX, currentY, contentWidth, decBoxHeight, 4, 4, 'FD');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(51, 65, 85);
  const declarationText = `I, ${(employee.name || 'EMPLOYEE').toUpperCase()}, hereby solemnly declare that all information and particulars furnished in this employee record are true, accurate, and complete to the best of my knowledge and belief. I agree to promptly notify the management of any change in my particulars, and undertake to abide by the service rules, company policies, and conditions of service of ${companyName}.`;
  doc.text(declarationText, marginX + 10, currentY + 12, { maxWidth: contentWidth - 20, lineHeightFactor: 1.45 });

  // --- SIGNATURES AREA ---
  const sigY = pageHeight - 65;
  doc.setDrawColor(51, 65, 85);
  doc.setLineWidth(1);

  const sigColWidth = 140;
  const sig1X = marginX + 10;
  const sig2X = (pageWidth / 2) - (sigColWidth / 2);
  const sig3X = pageWidth - marginX - sigColWidth - 10;

  // Signature Lines
  doc.line(sig1X, sigY, sig1X + sigColWidth, sigY);
  doc.line(sig2X, sigY, sig2X + sigColWidth, sigY);
  doc.line(sig3X, sigY, sig3X + sigColWidth, sigY);

  // Main Signature Titles
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text('EMPLOYEE SIGNATURE', sig1X + (sigColWidth / 2), sigY + 11, { align: 'center' });
  doc.text('HR / AUTHORIZED SIGNATORY', sig2X + (sigColWidth / 2), sigY + 11, { align: 'center' });
  doc.text('DATE', sig3X + (sigColWidth / 2), sigY + 11, { align: 'center' });

  // Helper Subtitles
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text('( Signature of Employee )', sig1X + (sigColWidth / 2), sigY + 20, { align: 'center' });
  doc.text('( Seal & Signatory )', sig2X + (sigColWidth / 2), sigY + 20, { align: 'center' });
  doc.text('( Date of Issuance )', sig3X + (sigColWidth / 2), sigY + 20, { align: 'center' });

  // --- FOOTER ---
  doc.setDrawColor(30, 58, 138);
  doc.setLineWidth(1);
  doc.line(marginX, pageHeight - 34, pageWidth - marginX, pageHeight - 34);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text(`${companyName}   •   Official Profile Record   •   Confidential & Proprietary   •   For Official Use Only`, pageWidth / 2, pageHeight - 22, { align: 'center' });

  // --- OUTPUT / DOWNLOAD TRIGGER ---
  const cleanName = (employee.name || 'Employee').replace(/[^a-zA-Z0-9]/g, '_');
  const fileName = `${cleanName}_Profile.pdf`;

  if (mode === 'print') {
    doc.autoPrint();
    const pdfBlob = doc.output('blob');
    const pdfUrl = URL.createObjectURL(pdfBlob);
    window.open(pdfUrl, '_blank');
  } else {
    // Direct file download to user's computer
    doc.save(fileName);
  }
}

/**
 * Draw fallback corporate shield badge when company logo is not an image
 */
function drawFallbackLogoBadge(doc, x, y) {
  doc.setFillColor(30, 58, 138); // #1e3a8a
  doc.roundedRect(x, y, 44, 44, 22, 22, 'F');

  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(1.25);
  doc.line(x + 22, y + 10, x + 33, y + 14);
  doc.line(x + 33, y + 14, x + 33, y + 26);
  doc.line(x + 33, y + 26, x + 22, y + 34);
  doc.line(x + 22, y + 34, x + 11, y + 26);
  doc.line(x + 11, y + 26, x + 11, y + 14);
  doc.line(x + 11, y + 14, x + 22, y + 10);
}

/**
 * Draw fallback avatar box when employee photo is not available
 */
function drawFallbackAvatar(doc, x, y, w, h) {
  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.5);
  doc.roundedRect(x, y, w, h, 3, 3, 'FD');

  doc.setFillColor(148, 163, 184);
  doc.circle(x + (w / 2), y + 18, 8, 'F');
  doc.roundedRect(x + 8, y + 29, w - 16, 14, 4, 4, 'F');
}

/**
 * Programmatic PDF download alias
 */
export const downloadEmployeeProfilePdf = downloadEmployeeProfile;
