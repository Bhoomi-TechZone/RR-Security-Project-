import jsPDF from 'jspdf';

/**
 * Helper to draw a clean vector checkbox
 */
function drawCheckbox(doc, x, y, size = 12, checked = false) {
  doc.setDrawColor(20, 20, 20);
  doc.setLineWidth(0.9);
  doc.setFillColor(255, 255, 255);
  doc.rect(x, y, size, size, 'FD');

  if (checked) {
    doc.setDrawColor(10, 10, 10);
    doc.setLineWidth(1.6);
    // Draw crisp vector checkmark
    doc.line(x + 2.5, y + size * 0.52, x + size * 0.42, y + size - 2.5);
    doc.line(x + size * 0.42, y + size - 2.5, x + size - 2, y + 2.5);
  }
}

/**
 * Generate and download or print Statutory EPF Form 11 - Declaration Form
 * STRICT REQUIREMENTS:
 * 1. PDF only
 * 2. NO LOGO (Per explicit user instruction)
 * 3. Exact 2-page statutory Form 11 layout matching EPFO specifications
 * 4. Fills the entire page without blank bottom gaps
 *
 * @param {Object|Array} inputRecord - Single record or array of employee records
 * @param {Object} globalCompanyInfo - Fallback company details
 * @param {Object} options - { mode: 'download' | 'print', filename: string }
 */
export async function downloadEpfForm11Pdf(
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
  const marginX = 34;
  const contentWidth = pageWidth - marginX * 2; // 527.28 pt

  records.forEach((emp, empIdx) => {
    // Each employee gets exactly 2 pages
    if (empIdx > 0) {
      doc.addPage();
    }

    const comp = emp.companyInfo || globalCompanyInfo || {};
    const companyCity = comp.city || 'New Delhi';
    const companyName = (
      globalCompanyInfo?.name ||
      comp.name ||
      emp.adminCompanyName ||
      'RR SECURITY & FACILITIES'
    ).toUpperCase();

    const empName = emp.name || emp.employeeName || '—';
    const fatherSpouseName = emp.fatherHusbandName || emp.fatherName || emp.spouseName || '—';
    const isFather = emp.isFather !== false && !emp.isSpouse;
    const isSpouse = Boolean(emp.isSpouse);
    const dob = emp.dob || '—';
    const gender = emp.gender || 'Male';
    const maritalStatus = emp.maritalStatus || 'Married';
    const email = emp.email || '';
    const mobile = emp.mobile || emp.contact || '';
    const isEarlierPf = emp.isEarlierPfMember || (emp.previousPfNo || emp.uan ? 'Yes' : 'No');
    const isEarlierEps = emp.isEarlierEpsMember || (emp.previousPfNo || emp.uan ? 'Yes' : 'No');
    const uan = emp.uan || '';
    const prevPfNo = emp.previousPfNo || '';
    const prevExitDate = emp.previousExitDate || '';
    const schemeCertNo = emp.schemeCertificateNo || '';
    const ppoNo = emp.ppoNo || '';
    const intlWorker = emp.internationalWorker || 'No';
    const countryOrigin = emp.countryOfOrigin || 'India';
    const passportNo = emp.passportNo || '';
    const passportValidity = emp.passportValidity || '';
    const bankAccountNo = emp.bankAccountNo || '—';
    const ifscCode = emp.ifscCode || '—';
    const aadhaar = emp.aadhaar || '';
    const pan = emp.pan || '';
    const enrolledDate = emp.firstEnrolledDate || emp.joiningDate || '';
    const firstWages = emp.firstEpfWages || '15000';
    const isBefore2014 = emp.isMemberBefore2014 || 'Yes';
    const isEpfWithdrawn = emp.isEpfWithdrawn || 'No';
    const isEpsWithdrawn = emp.isEpsWithdrawn || 'No';
    const isPost2014Withdrawn = emp.isPost2014Withdrawn || 'No';
    const joiningDate = emp.joiningDate || '';
    const allottedPfNo = emp.allottedPfNo || (comp.employerPfCode ? `${comp.employerPfCode}/001` : '—');
    const todayDate = new Date().toLocaleDateString('en-GB');

    // =========================================================================
    // PAGE 1: PARTICULARS OF MEMBER & KYC DETAILS (NO LOGO)
    // =========================================================================

    // Top Right Reference
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(15, 23, 42);
    doc.text('New Form : 11 - Declaration Form', pageWidth - marginX, 28, { align: 'right' });
    doc.setFontSize(8.5);
    doc.text('(To be retained by the employer for future reference)', pageWidth - marginX, 40, { align: 'right' });

    // Dynamic Generating Company Name
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(10, 15, 30);
    doc.text(companyName, pageWidth / 2, 53, { align: 'center' });

    // Main Heading (Centered, NO LOGO)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11.5);
    doc.text("EMPLOYEES' PROVIDENT FUND ORGANISATION", pageWidth / 2, 67, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.text("Employees' Provident Fund Scheme, 1952 (Paragraph 34 & 57) and", pageWidth / 2, 79, { align: 'center' });
    doc.text("Employees' Pension Scheme, 1995 (Paragraph 24)", pageWidth / 2, 90, { align: 'center' });

    doc.setFontSize(7.6);
    doc.text('(Declaration by a person taking up Employment in any Establishment on which EPF Scheme, 1952 and for EPS,', pageWidth / 2, 101, { align: 'center' });
    doc.text('1995 is applicable)', pageWidth / 2, 111, { align: 'center' });

    // -------------------------------------------------------------------------
    // TABLE: ITEMS 1 TO 12 (Carefully proportioned to fill the whole A4 page)
    // -------------------------------------------------------------------------
    let curY = 116;
    const col1W = 28; // Serial Number
    const col2W = 270; // Description / Labels
    const col3W = contentWidth - col1W - col2W; // Values (~229 pt)

    const x1 = marginX;
    const x2 = marginX + col1W;
    const x3 = x2 + col2W;
    const xEnd = marginX + contentWidth;

    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.75);

    // Row 1: Name of Member
    const r1H = 26;
    doc.rect(x1, curY, contentWidth, r1H);
    doc.line(x2, curY, x2, curY + r1H);
    doc.line(x3, curY, x3, curY + r1H);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.text('1.', x1 + 5, curY + 16);
    doc.text('Name of Member', x2 + 6, curY + 16);
    doc.setFont('helvetica', 'bold');
    doc.text(empName, x3 + 6, curY + 16);
    curY += r1H;

    // Row 2: Father's / Spouse's Name with checkboxes
    const r2H = 42;
    doc.rect(x1, curY, contentWidth, r2H);
    doc.line(x2, curY, x2, curY + r2H);
    doc.line(x3, curY, x3, curY + r2H);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.text('2.', x1 + 5, curY + 18);

    doc.text("Father's Name", x2 + 6, curY + 18);
    drawCheckbox(doc, x2 + 75, curY + 8, 12, isFather);

    doc.text("Spouse's Name", x2 + 104, curY + 18);
    drawCheckbox(doc, x2 + 185, curY + 8, 12, isSpouse);

    doc.setFontSize(7.5);
    doc.setTextColor(70, 70, 70);
    doc.text('(Please tick whichever applicable)', x2 + 6, curY + 34);
    doc.setTextColor(0, 0, 0);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.text(fatherSpouseName, x3 + 6, curY + 22);
    curY += r2H;

    // Row 3: Date of Birth
    const r3H = 24;
    doc.rect(x1, curY, contentWidth, r3H);
    doc.line(x2, curY, x2, curY + r3H);
    doc.line(x3, curY, x3, curY + r3H);

    doc.text('3.', x1 + 5, curY + 15);
    doc.text('Date of Birth (dd/mm/yyyy)', x2 + 6, curY + 15);
    doc.text(dob, x3 + 6, curY + 15);
    curY += r3H;

    // Row 4: Gender
    const r4H = 24;
    doc.rect(x1, curY, contentWidth, r4H);
    doc.line(x2, curY, x2, curY + r4H);
    doc.line(x3, curY, x3, curY + r4H);

    doc.text('4.', x1 + 5, curY + 15);
    doc.text('Gender (Male / Female / Transgender)', x2 + 6, curY + 15);
    doc.text(gender, x3 + 6, curY + 15);
    curY += r4H;

    // Row 5: Marital Status
    const r5H = 26;
    doc.rect(x1, curY, contentWidth, r5H);
    doc.line(x2, curY, x2, curY + r5H);
    doc.line(x3, curY, x3, curY + r5H);

    doc.text('5.', x1 + 5, curY + 16);
    doc.text('Marital Status ? (Single/Married/Widow/Widower/Divorcee)', x2 + 6, curY + 16);
    doc.text(maritalStatus, x3 + 6, curY + 16);
    curY += r5H;

    // Row 6: eMail ID & Mobile No
    const r6SubH = 24;
    const r6H = r6SubH * 2;
    doc.rect(x1, curY, contentWidth, r6H);
    doc.line(x2, curY, x2, curY + r6H);
    doc.line(x3, curY, x3, curY + r6H);
    doc.line(x2, curY + r6SubH, xEnd, curY + r6SubH);

    doc.text('6.', x1 + 5, curY + 26);
    doc.text('(a) eMail ID', x2 + 6, curY + 15);
    doc.text(email || '—', x3 + 6, curY + 15);

    doc.text('(b) Mobile No', x2 + 6, curY + r6SubH + 15);
    doc.text(mobile || '—', x3 + 6, curY + r6SubH + 15);
    curY += r6H;

    // Row 7: Earlier member of EPF Scheme
    const r7H = 30;
    doc.rect(x1, curY, contentWidth, r7H);
    doc.line(x2, curY, x2, curY + r7H);
    doc.line(x3, curY, x3, curY + r7H);

    doc.text('7.', x1 + 5, curY + 18);
    doc.text("Whether earlier member of the Employee's Provident", x2 + 6, curY + 13);
    doc.text('Fund Scheme, 1952 ?', x2 + 6, curY + 24);
    doc.text(isEarlierPf, x3 + 6, curY + 18);
    curY += r7H;

    // Row 8: Earlier member of EPS
    const r8H = 30;
    doc.rect(x1, curY, contentWidth, r8H);
    doc.line(x2, curY, x2, curY + r8H);
    doc.line(x3, curY, x3, curY + r8H);

    doc.text('8.', x1 + 5, curY + 18);
    doc.text("Whether earlier member of the Employee's Pension", x2 + 6, curY + 13);
    doc.text('Scheme, 1995 ?', x2 + 6, curY + 24);
    doc.text(isEarlierEps, x3 + 6, curY + 18);
    curY += r8H;

    // Row 9: Previous Employment details (a to e)
    const r9SubH = 22;
    const r9H = r9SubH * 6; // 132 pt
    doc.rect(x1, curY, contentWidth, r9H);
    doc.line(x2, curY, x2, curY + r9H);
    doc.line(x3, curY, x3, curY + r9H);

    doc.text('9.', x1 + 5, curY + 48);

    let subY = curY;
    // 9 title
    doc.setFont('helvetica', 'bold');
    doc.text('Previous Employment details ?', x2 + 6, subY + 15);
    subY += r9SubH;
    doc.line(x2, subY, xEnd, subY);

    // a) UAN
    doc.setFont('helvetica', 'normal');
    doc.text('a) Universal Account Number (UAN)', x2 + 6, subY + 15);
    doc.text(uan || '—', x3 + 6, subY + 15);
    subY += r9SubH;
    doc.line(x2, subY, xEnd, subY);

    // b) Previous PF Account Number
    doc.text('b) Previous PF Account Number', x2 + 6, subY + 15);
    doc.text(prevPfNo || '—', x3 + 6, subY + 15);
    subY += r9SubH;
    doc.line(x2, subY, xEnd, subY);

    // c) Date of Exit
    doc.text('c) Date of Exit from previous Employment ? (dd/mm/yyyy)', x2 + 6, subY + 15);
    doc.text(prevExitDate || '—', x3 + 6, subY + 15);
    subY += r9SubH;
    doc.line(x2, subY, xEnd, subY);

    // d) Scheme Certificate No
    doc.text('d) Scheme Certificate No (If issued)', x2 + 6, subY + 15);
    doc.text(schemeCertNo || '—', x3 + 6, subY + 15);
    subY += r9SubH;
    doc.line(x2, subY, xEnd, subY);

    // e) Pension Payment Order (PPO)
    doc.text('e) Pension Payment Order (PPO) (If issued)', x2 + 6, subY + 15);
    doc.text(ppoNo || '—', x3 + 6, subY + 15);

    curY += r9H;

    // Row 10: International Worker details (a to d)
    const r10SubH = 22;
    const r10H = r10SubH * 4; // 88 pt
    doc.rect(x1, curY, contentWidth, r10H);
    doc.line(x2, curY, x2, curY + r10H);
    doc.line(x3, curY, x3, curY + r10H);

    doc.text('10.', x1 + 5, curY + 36);

    subY = curY;
    // a) International Worker
    doc.text('a) International Worker', x2 + 6, subY + 15);
    doc.text(intlWorker, x3 + 6, subY + 15);
    subY += r10SubH;
    doc.line(x2, subY, xEnd, subY);

    // b) Country of origin
    doc.text('b) If Yes, state country of origin (name of other country)', x2 + 6, subY + 15);
    doc.text(intlWorker === 'Yes' ? countryOrigin : 'India', x3 + 6, subY + 15);
    subY += r10SubH;
    doc.line(x2, subY, xEnd, subY);

    // c) Passport No.
    doc.text('c) Passport No.', x2 + 6, subY + 15);
    doc.text(passportNo || '—', x3 + 6, subY + 15);
    subY += r10SubH;
    doc.line(x2, subY, xEnd, subY);

    // d) Validity of passport
    doc.text('d) Validity of passport (dd/mm/yyyy) to (dd/mm/yyyy)', x2 + 6, subY + 15);
    doc.text(passportValidity || '—', x3 + 6, subY + 15);

    curY += r10H;

    // Row 11: KYC Details (a to c)
    const r11SubH = 24;
    const r11HeaderH = 28;
    const r11H = r11HeaderH + r11SubH * 3; // 100 pt
    doc.rect(x1, curY, contentWidth, r11H);
    doc.line(x2, curY, x2, curY + r11H);
    doc.line(x3, curY, x3, curY + r11H);

    doc.text('11.', x1 + 5, curY + 44);

    subY = curY;
    // Header for KYC
    doc.setFont('helvetica', 'bold');
    doc.text('KYC Details :', x2 + 6, subY + 13);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.8);
    doc.text('(attach self attested copies of', x2 + 70, subY + 12);
    doc.text("following KYC's)", x2 + 70, subY + 22);

    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8.2);
    doc.setTextColor(140, 140, 140);
    doc.text('Must Enclose Scan copy for the following documents', x3 + 6, subY + 17);
    doc.setTextColor(0, 0, 0);

    subY += r11HeaderH;
    doc.line(x2, subY, xEnd, subY);

    // a) Bank Account No. & IFS Code
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.text('a) Bank Account No. & IFS Code', x2 + 6, subY + 15);
    doc.text(bankAccountNo, x3 + 6, subY + 11);
    doc.setFontSize(7.5);
    doc.text(ifscCode, x3 + 6, subY + 21);
    doc.setFontSize(8.5);

    subY += r11SubH;
    doc.line(x2, subY, xEnd, subY);

    // b) AADHAR Number
    doc.text('b) AADHAR Number', x2 + 6, subY + 15);
    doc.text(aadhaar || '—', x3 + 6, subY + 15);

    subY += r11SubH;
    doc.line(x2, subY, xEnd, subY);

    // c) PAN
    doc.text('c) Permanent Account Number (PAN), If available', x2 + 6, subY + 15);
    doc.text(pan || '—', x3 + 6, subY + 15);

    curY += r11H;

    // -------------------------------------------------------------------------
    // Row 12: Special 6-Column Subtable (Proportioned to reach the page bottom)
    // -------------------------------------------------------------------------
    const r12H_header = 60;
    const r12H_val = 32;
    const r12H = r12H_header + r12H_val; // 92 pt

    doc.rect(x1, curY, contentWidth, r12H);
    doc.line(x2, curY, x2, curY + r12H);

    doc.text('12.', x1 + 5, curY + 38);

    // 6 Sub-columns
    const subW = (contentWidth - col1W) / 6; // ~83.2 pt each
    const c1X = x2;
    const c2X = c1X + subW;
    const c3X = c2X + subW;
    const c4X = c3X + subW;
    const c5X = c4X + subW;
    const c6X = c5X + subW;

    // Draw vertical column dividers
    doc.line(c2X, curY, c2X, curY + r12H);
    doc.line(c3X, curY, c3X, curY + r12H);
    doc.line(c4X, curY, c4X, curY + r12H);
    doc.line(c5X, curY, c5X, curY + r12H);
    doc.line(c6X, curY, c6X, curY + r12H);

    // Horizontal line separating header and value row
    doc.line(x2, curY + r12H_header, xEnd, curY + r12H_header);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.4);

    // Column 1 Header
    doc.text('First EPF', c1X + subW / 2, curY + 15, { align: 'center' });
    doc.text('Member', c1X + subW / 2, curY + 27, { align: 'center' });
    doc.text('Enrolled Date', c1X + subW / 2, curY + 39, { align: 'center' });

    // Column 2 Header
    doc.text('First Employment', c2X + subW / 2, curY + 15, { align: 'center' });
    doc.text('EPF', c2X + subW / 2, curY + 27, { align: 'center' });
    doc.text('Wages', c2X + subW / 2, curY + 39, { align: 'center' });

    // Column 3 Header
    doc.text('Are you EPF', c3X + subW / 2, curY + 14, { align: 'center' });
    doc.text('Member', c3X + subW / 2, curY + 25, { align: 'center' });
    doc.text('before', c3X + subW / 2, curY + 36, { align: 'center' });
    doc.text('01/09/2014', c3X + subW / 2, curY + 47, { align: 'center' });

    // Column 4 Header
    doc.text('If Yes, EPF', c4X + subW / 2, curY + 17, { align: 'center' });
    doc.text('Amount', c4X + subW / 2, curY + 29, { align: 'center' });
    doc.text('Withdrawn?', c4X + subW / 2, curY + 41, { align: 'center' });

    // Column 5 Header
    doc.text('If Yes, EPS', c5X + subW / 2, curY + 14, { align: 'center' });
    doc.text('(Pension)', c5X + subW / 2, curY + 25, { align: 'center' });
    doc.text('Amount', c5X + subW / 2, curY + 36, { align: 'center' });
    doc.text('Withdrawn?', c5X + subW / 2, curY + 47, { align: 'center' });

    // Column 6 Header
    doc.text('After Sep 2014', c6X + subW / 2, curY + 12, { align: 'center' });
    doc.text('earned EPS', c6X + subW / 2, curY + 22, { align: 'center' });
    doc.text('(Pension)', c6X + subW / 2, curY + 32, { align: 'center' });
    doc.text('Amount', c6X + subW / 2, curY + 42, { align: 'center' });
    doc.text('Withdrawn before', c6X + subW / 2, curY + 52, { align: 'center' });

    // Values Row
    const valY = curY + r12H_header + 19;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);

    const numWages = Number(String(firstWages || '').replace(/[^\d.]/g, ''));
    const displayWages = numWages > 0 ? `Rs. ${numWages.toLocaleString('en-IN')}` : (firstWages ? `Rs. ${firstWages}` : '—');

    doc.text(enrolledDate || '—', c1X + subW / 2, valY, { align: 'center' });
    doc.text(displayWages, c2X + subW / 2, valY, { align: 'center' });
    doc.text(isBefore2014 || 'Yes', c3X + subW / 2, valY, { align: 'center' });
    doc.text(isEpfWithdrawn || 'No', c4X + subW / 2, valY, { align: 'center' });
    doc.text(isEpsWithdrawn || 'No', c5X + subW / 2, valY, { align: 'center' });
    doc.text(isPost2014Withdrawn || 'No', c6X + subW / 2, valY, { align: 'center' });

    // =========================================================================
    // PAGE 2: UNDERTAKING & DECLARATION BY PRESENT EMPLOYER (NO LOGO)
    // =========================================================================
    doc.addPage();

    // Top Right Reference
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(15, 23, 42);
    doc.text('New Form : 11 - Declaration Form', pageWidth - marginX, 28, { align: 'right' });
    doc.setFontSize(8.5);
    doc.text('(To be retained by the employer for future reference)', pageWidth - marginX, 40, { align: 'right' });

    // Dynamic Generating Company Name
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(10, 15, 30);
    doc.text(companyName, pageWidth / 2, 53, { align: 'center' });

    // Main Heading (Centered, NO LOGO)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11.5);
    doc.text("EMPLOYEES' PROVIDENT FUND ORGANISATION", pageWidth / 2, 67, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.text("Employees' Provident Fund Scheme, 1952 (Paragraph 34 & 57) and", pageWidth / 2, 79, { align: 'center' });
    doc.text("Employees' Pension Scheme, 1995 (Paragraph 24)", pageWidth / 2, 90, { align: 'center' });

    doc.setFontSize(7.6);
    doc.text('(Declaration by a person taking up Employment in any Establishment on which EPF Scheme, 1952 and for EPS,', pageWidth / 2, 101, { align: 'center' });
    doc.text('1995 is applicable)', pageWidth / 2, 111, { align: 'center' });

    let p2Y = 135;

    // -------------------------------------------------------------------------
    // SECTION: UNDERTAKING
    // -------------------------------------------------------------------------
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('UNDERTAKING', pageWidth / 2, p2Y, { align: 'center' });
    const utW = doc.getTextWidth('UNDERTAKING');
    doc.setLineWidth(0.8);
    doc.line(pageWidth / 2 - utW / 2, p2Y + 2, pageWidth / 2 + utW / 2, p2Y + 2);

    p2Y += 24;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.75);
    doc.setTextColor(20, 20, 20);

    const undertakingTextX = marginX + 38;

    // Item 1
    doc.text('1) Certified that the particulars are true to the best of my knowledge', undertakingTextX, p2Y);
    p2Y += 18;

    // Item 2
    doc.text('2) I authorise EPFO to use my Aadhar for verification / authentication / eKYC purpose for service delivery', undertakingTextX, p2Y);
    p2Y += 18;

    // Item 3
    doc.text('3) Kindly transfer the fund and service details, if applicable, from the previous PF account as declared above to', undertakingTextX, p2Y);
    p2Y += 14;
    doc.text('the present PF account.', undertakingTextX + 11, p2Y);
    p2Y += 14;
    doc.text('(The transfer would be possible only if the identified KYC details approved by previous employer has been', undertakingTextX + 11, p2Y);
    p2Y += 14;
    doc.text('verified by present employer using his Digital Signature)', undertakingTextX + 11, p2Y);
    p2Y += 18;

    // Item 4
    doc.text('4) In case of changes in above details, the same will be intimated to employer at the earliest.', undertakingTextX, p2Y);
    p2Y += 38;

    // Date, Place, Member Signature Line
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(`Date :  ${todayDate}`, marginX + 14, p2Y);
    doc.text('Signature of Member', pageWidth - marginX - 14, p2Y, { align: 'right' });

    p2Y += 18;
    doc.text(`Place :  ${companyCity}`, marginX + 14, p2Y);

    p2Y += 46;

    // -------------------------------------------------------------------------
    // SECTION: DECLARATION BY PRESENT EMPLOYER
    // -------------------------------------------------------------------------
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('DECLARATION BY PRESENT EMPLOYER', pageWidth / 2, p2Y, { align: 'center' });
    const dpeW = doc.getTextWidth('DECLARATION BY PRESENT EMPLOYER');
    doc.line(pageWidth / 2 - dpeW / 2, p2Y + 2, pageWidth / 2 + dpeW / 2, p2Y + 2);

    p2Y += 28;

    // Point A
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.text('A.', marginX + 14, p2Y);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.75);
    const textA1 = `The member Mr./Ms./Mrs. ${empName} Has joined on ${joiningDate || todayDate} and has been alloted PF Number`;
    doc.text(textA1, marginX + 36, p2Y);
    p2Y += 15;
    doc.setFont('helvetica', 'bold');
    doc.text(allottedPfNo, marginX + 36, p2Y);
    doc.setFont('helvetica', 'normal');

    p2Y += 18;
    doc.text('In case the person was earlier not a member of EPF Scheme, 1952 and EPS, 1995: ((Post allotment of UAN)', marginX + 36, p2Y);
    p2Y += 14;
    doc.text(`The UAN alloted or the member is) ${uan ? `: ${uan}` : ''}`, marginX + 36, p2Y);

    p2Y += 28;

    // Point B
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.text('B.', marginX + 14, p2Y);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.75);
    doc.text('Please Tick the Appropriate Option : The KYC details of the above member in the JAN database', marginX + 36, p2Y);

    p2Y += 20;
    // 3 Options with checkboxes
    const optBoxSize = 13;
    const optY = p2Y;

    // Option 1: Have not been uploaded
    drawCheckbox(doc, marginX + 36, optY, optBoxSize, false);
    doc.text('Have not been uploaded', marginX + 36 + optBoxSize + 6, optY + 10);

    // Option 2: Have been uploaded but not approved
    drawCheckbox(doc, marginX + 185, optY, optBoxSize, false);
    doc.text('Have been uploaded but not', marginX + 185 + optBoxSize + 6, optY + 7);
    doc.text('approved', marginX + 185 + optBoxSize + 6, optY + 17);

    // Option 3: Have been uploaded and approved with DSC
    drawCheckbox(doc, marginX + 335, optY, optBoxSize, true);
    doc.text('Have been uploaded and', marginX + 335 + optBoxSize + 6, optY + 7);
    doc.text('approved with DSC', marginX + 335 + optBoxSize + 6, optY + 17);

    p2Y += 42;

    // Point C
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.text('C.', marginX + 14, p2Y);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.75);
    doc.text('In case the person was earlier a member of EPF Scheme, 1952 and EPS 1995;', marginX + 36, p2Y);

    p2Y += 20;

    // Sub-option C1
    drawCheckbox(doc, marginX + 36, p2Y, optBoxSize, true);
    doc.text('The KYC details of the above member in the UAN database have been approved with Digital Signature', marginX + 36 + optBoxSize + 6, p2Y + 8);
    doc.text('Certificate and transfer request has been generated on portal', marginX + 36 + optBoxSize + 6, p2Y + 20);

    p2Y += 32;

    // Sub-option C2
    drawCheckbox(doc, marginX + 36, p2Y, optBoxSize, false);
    doc.text('As the DSC of establishment are not registered with EPFO, the member has been informed to file physical', marginX + 36 + optBoxSize + 6, p2Y + 8);
    doc.text('claim (Form-13) for transfer of funds from his previous establishment.', marginX + 36 + optBoxSize + 6, p2Y + 20);

    p2Y += 60;

    // Bottom Date & Employer Sign with Seal
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(`Date :  ${todayDate}`, marginX + 14, p2Y);

    doc.text('Signate of Employer with Seal of Establishment', pageWidth - marginX - 14, p2Y, { align: 'right' });
  });

  const rawFileName =
    records.length === 1
      ? `EPF_Form_11_${(records[0].name || 'Employee').replace(/\s+/g, '_')}.pdf`
      : `EPF_Form_11_Declarations_${records.length}_Employees.pdf`;

  const finalFileName = options.filename || rawFileName;

  if (mode === 'print') {
    doc.autoPrint();
    const blobUrl = doc.output('bloburl');
    window.open(blobUrl, '_blank');
  } else {
    doc.save(finalFileName);
  }
}
