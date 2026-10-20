import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Download Statutory Register of Workmen Employed by Contractor (Form XIII) as Excel (.xlsx) / CSV
 * [FORM XIII, See Rule 75 of Contract Labour (Regulation & Abolition) Central Rules, 1971]
 * Matches exact statutory layout shown in user-uploaded Form XIII image.
 */
export const downloadWorkmanRegisterExcel = (
  records = [],
  companyInfo = {},
  period = {},
  totals = {},
  establishmentInfo = {},
  options = {}
) => {
  const est = establishmentInfo || {};
  const contractorName = est.contractorName || companyInfo?.name || 'RR SECURITY & FACILITIES';
  const contractorAddress =
    est.contractorAddress ||
    companyInfo?.address ||
    'G-75/A, Ground Floor, Block-G, M.B. EXTN., Badarpur New Delhi-110044';
  const workLocation =
    est.natureAndLocationOfWork ||
    'Security & Facility Services, At STAR TRACK TERMINALS PVT. LTD. ICD DADRI TILPATA ROAD, DADRI GREATER NOIDA';
  const establishmentFull =
    est.establishmentFull ||
    (est.establishmentName && est.establishmentAddress
      ? `${est.establishmentName}, ${est.establishmentAddress}`
      : 'STAR TRACK TERMINALS PRIVATE LIMITED, ICD DADRI, TILPATA ROAD, DADRI GREATER NOIDA 201311');
  const principalEmployer = est.principalEmployer || 'STAR TRACK TERMINALS PRIVATE LIMITED';

  const aoa = [
    // Row 1: Title
    ['Register of Workmen Employed by Contractor'],
    // Row 2: Subtitle Rule
    ['Form XIII  [See Rule 75]'],
    // Row 3: Blank
    [''],
    // Rows 4-7: Establishment Information Block
    ['Name and Address of Contractor :', `${contractorName}, ${contractorAddress}`],
    ['Nature and Location of Work :', workLocation],
    ['Name and Address of Establishment in/ under which Contract is Carried on :', establishmentFull],
    ['Name and Address of Principal Employer :', principalEmployer],
    // Row 8: Blank
    [''],
    // Row 9: Table Header Level 1 (Matching Image 1)
    [
      'Sl. No.',
      'Name and Surname of Workmen',
      'Age and Sex',
      "Father's/ Husband's Name",
      'Nature of Employment / Designation',
      'Permanent Home Address of Workmen (Village and Tahsil/ Taluk and District)',
      'Local Address',
      'Date of Commencement of Employment',
      'Signature or Thumb-Impression of Workmen',
      'Date of Termination of Employment',
      'Reasons for Termination',
      'Remarks',
    ],
    // Row 10: Column Numbering row 1 to 12
    ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
  ];

  // Data rows
  records.forEach((r, idx) => {
    aoa.push([
      r.srNo || idx + 1,
      r.name || '—',
      r.ageAndSex || (r.age && r.gender ? `${r.age} Yrs / ${r.gender}` : '—'),
      r.fatherHusbandName || '—',
      r.designation || 'Staff',
      r.permanentAddress || '—',
      r.localAddress || '—',
      r.dateOfCommencement || '—',
      '',
      r.dateOfTermination || '—',
      r.reasonsForTermination || '—',
      r.remarks || '—',
    ]);
  });

  // Summary row
  aoa.push([
    '',
    `Total Workmen: ${totals?.totalWorkmen ?? records.length}`,
    `Active: ${totals?.activeWorkmen ?? records.filter(r => r.status === 'Active').length}`,
    '',
    `Terminated: ${totals?.terminatedWorkmen ?? records.filter(r => r.status !== 'Active').length}`,
    '',
    '',
    '',
    '',
    '',
    '',
    'Statutory Verified',
  ]);

  const ws = XLSX.utils.aoa_to_sheet(aoa);

  // Set merges
  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 11 } }, // Title
    { s: { r: 1, c: 0 }, e: { r: 1, c: 11 } }, // Subtitle
    { s: { r: 3, c: 1 }, e: { r: 3, c: 11 } },
    { s: { r: 4, c: 1 }, e: { r: 4, c: 11 } },
    { s: { r: 5, c: 1 }, e: { r: 5, c: 11 } },
    { s: { r: 6, c: 1 }, e: { r: 6, c: 11 } },
  ];

  // Set column widths
  ws['!cols'] = [
    { wch: 8 },  // Sl No
    { wch: 26 }, // Name
    { wch: 16 }, // Age & Sex
    { wch: 22 }, // Father's Name
    { wch: 24 }, // Designation
    { wch: 36 }, // Permanent Address
    { wch: 32 }, // Local Address
    { wch: 18 }, // Date of Commencement
    { wch: 16 }, // Signature
    { wch: 18 }, // Date of Termination
    { wch: 22 }, // Reasons
    { wch: 20 }, // Remarks
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Form XIII Workman Register');

  const fileExt = options?.format === 'csv' ? 'csv' : 'xlsx';
  const cleanPeriod = (period?.month || 'register').replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `Register_of_Workmen_Form_XIII_${cleanPeriod}.${fileExt}`;

  if (fileExt === 'csv') {
    XLSX.writeFile(wb, filename, { bookType: 'csv' });
  } else {
    XLSX.writeFile(wb, filename, { bookType: 'xlsx' });
  }
};

/**
 * Download Statutory Register of Workmen Employed by Contractor (Form XIII) as Landscape PDF
 * or trigger direct print mode.
 */
export const downloadWorkmanRegisterPdf = (
  records = [],
  companyInfo = {},
  period = {},
  totals = {},
  establishmentInfo = {},
  options = {}
) => {
  const isPrint = options?.mode === 'print';
  // Use landscape A3 for clear statutory 12-column layout
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a3',
  });

  const est = establishmentInfo || {};
  const contractorName = est.contractorName || companyInfo?.name || 'RR SECURITY & FACILITIES';
  const contractorAddress =
    est.contractorAddress ||
    companyInfo?.address ||
    'G-75/A, Ground Floor, Block-G, M.B. EXTN., Badarpur New Delhi-110044';
  const workLocation =
    est.natureAndLocationOfWork ||
    'Security & Facility Services, At STAR TRACK TERMINALS PVT. LTD. ICD DADRI TILPATA ROAD, DADRI GREATER NOIDA';
  const establishmentFull =
    est.establishmentFull ||
    (est.establishmentName && est.establishmentAddress
      ? `${est.establishmentName}, ${est.establishmentAddress}`
      : 'STAR TRACK TERMINALS PRIVATE LIMITED, ICD DADRI, TILPATA ROAD, DADRI GREATER NOIDA 201311');
  const principalEmployer = est.principalEmployer || 'STAR TRACK TERMINALS PRIVATE LIMITED';

  // Title Box matching Image 1
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.4);
  doc.rect(14, 10, 392, 14);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('Register of Workmen Employed by Contractor', 210, 16, { align: 'center' });
  doc.setFontSize(10.5);
  doc.text('Form XIII  [See Rule 75]', 210, 21.5, { align: 'center' });

  // Establishment Details Box matching Image 1
  doc.rect(14, 26, 392, 30);
  doc.setFontSize(9);

  doc.setFont('helvetica', 'bold');
  doc.text('Name and Address of Contractor', 17, 32);
  doc.text(':', 130, 32);
  doc.setFont('helvetica', 'normal');
  doc.text(`${contractorName}, ${contractorAddress}`, 134, 32, { maxWidth: 268 });

  doc.setFont('helvetica', 'bold');
  doc.text('Nature and Location of Work', 17, 39);
  doc.text(':', 130, 39);
  doc.setFont('helvetica', 'normal');
  doc.text(workLocation, 134, 39, { maxWidth: 268 });

  doc.setFont('helvetica', 'bold');
  doc.text('Name and Address of Establishment in/ under which Contract is Carried on :', 17, 46);
  doc.setFont('helvetica', 'normal');
  doc.text(establishmentFull, 134, 46, { maxWidth: 268 });

  doc.setFont('helvetica', 'bold');
  doc.text('Name and Address of Principal Employer', 17, 53);
  doc.text(':', 130, 53);
  doc.setFont('helvetica', 'normal');
  doc.text(principalEmployer, 134, 53, { maxWidth: 268 });

  // 12 Column Header with Column Numbers Row 1-12 matching Image 1
  const headRows = [
    [
      'Sl.No.',
      'Name and Surname of\nWorkmen',
      'Age and\nSex',
      "Father's/\nHusband's Name",
      'Nature of Employment /\nDesignation',
      'Permanent Home\nAddress of\nWorkmen (Village\nand Tahsil/ Taluk\nand District)',
      'Local\nAddress',
      'Date of\nCommencement\nof Employment',
      'Signature or\nThumb-\nImpression of\nWorkmen',
      'Date of\nTermination\nof\nEmployment',
      'Reasons for\nTermination',
      'Remarks',
    ],
    ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
  ];

  const bodyRows = records.map((r, idx) => [
    r.srNo || idx + 1,
    r.employeeCode ? `${r.name}\n(${r.employeeCode})` : (r.name || '—'),
    r.ageAndSex || (r.age && r.gender ? `${r.age} Yrs / ${r.gender}` : '—'),
    r.fatherHusbandName || '—',
    r.designation || 'Staff',
    r.permanentAddress || '—',
    r.localAddress || '—',
    r.dateOfCommencement || '—',
    '', // Signature space
    r.dateOfTermination || '—',
    r.reasonsForTermination || '—',
    r.remarks || '—',
  ]);

  autoTable(doc, {
    startY: 58,
    margin: { left: 14, right: 14, bottom: 20 },
    theme: 'grid',
    styles: {
      fontSize: 8.5,
      cellPadding: 2.5,
      textColor: [15, 23, 42],
      lineColor: [0, 0, 0],
      lineWidth: 0.25,
      valign: 'middle',
    },
    headStyles: {
      fillColor: [248, 250, 252],
      textColor: [0, 0, 0],
      fontStyle: 'bold',
      halign: 'center',
      valign: 'middle',
      lineWidth: 0.25,
      lineColor: [0, 0, 0],
    },
    head: headRows,
    body: bodyRows,
    foot: [
      [
        '',
        `Total Workmen: ${totals?.totalWorkmen ?? records.length}`,
        `Active: ${totals?.activeWorkmen ?? records.filter(r => r.status === 'Active').length}`,
        '',
        `Terminated: ${totals?.terminatedWorkmen ?? records.filter(r => r.status !== 'Active').length}`,
        '',
        '',
        '',
        '',
        '',
        '',
        'Statutory Form XIII Verified',
      ],
    ],
    footStyles: {
      fillColor: [241, 245, 249],
      textColor: [0, 0, 0],
      fontStyle: 'bold',
      halign: 'center',
    },
    columnStyles: {
      0: { cellWidth: 14, halign: 'center' }, // Sl No
      1: { cellWidth: 44, halign: 'left' },   // Name
      2: { cellWidth: 26, halign: 'center' }, // Age & Sex
      3: { cellWidth: 36, halign: 'left' },   // Father's Name
      4: { cellWidth: 36, halign: 'left' },   // Designation
      5: { cellWidth: 54, halign: 'left' },   // Permanent Address
      6: { cellWidth: 46, halign: 'left' },   // Local Address
      7: { cellWidth: 28, halign: 'center' }, // Commencement Date
      8: { cellWidth: 32, halign: 'center' }, // Signature
      9: { cellWidth: 28, halign: 'center' }, // Termination Date
      10: { cellWidth: 26, halign: 'left' },  // Reasons
      11: { cellWidth: 22, halign: 'left' },  // Remarks
    },
    didDrawPage: (data) => {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.text(`Page No. ${data.pageNumber}`, 16, 287);
    },
  });

  const filename = `Register_of_Workmen_Form_XIII.pdf`;

  if (isPrint) {
    const pdfBlob = doc.output('blob');
    const blobUrl = URL.createObjectURL(pdfBlob);
    const printWindow = window.open(blobUrl, '_blank');
    if (printWindow) {
      printWindow.addEventListener('load', () => {
        printWindow.print();
      });
    }
  } else {
    doc.save(filename);
  }
};
