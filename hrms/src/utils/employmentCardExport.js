import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';

/**
 * Generate and download or print Statutory Form XIV Employment Card PDF
 * [See Rule 76 of Contract Labour (Regulation & Abolition) Central Rules, 1971]
 * Matches exact structure shown in Image 1:
 * - Double outer border
 * - Form XIV / (See Rule 76) / Employment Card header
 * - 2-column bordered table with 11 statutory rows
 * - Signature of Contractor bottom right
 */
export async function downloadEmploymentCardPdf(
  inputRecord,
  globalCompanyInfo = {},
  options = {}
) {
  const records = Array.isArray(inputRecord) ? inputRecord : [inputRecord];
  if (!records.length) return;

  const mode = options.mode || 'download';
  const defaultComp = globalCompanyInfo || {};

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 595.28 pt
  const pageHeight = doc.internal.pageSize.getHeight(); // 841.89 pt

  for (let idx = 0; idx < records.length; idx++) {
    const record = records[idx];
    if (idx > 0) {
      doc.addPage();
    }

    const margin = 32;
    const boxX = margin;
    const boxY = margin;
    const boxW = pageWidth - margin * 2;
    const boxH = pageHeight - margin * 2;

    // 1. Double Outer Border (Matching Image 1)
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(1.6);
    doc.rect(boxX, boxY, boxW, boxH, 'S');

    doc.setLineWidth(0.8);
    const innerPadding = 4;
    doc.rect(
      boxX + innerPadding,
      boxY + innerPadding,
      boxW - innerPadding * 2,
      boxH - innerPadding * 2,
      'S'
    );

    const contentX = boxX + innerPadding;
    const contentW = boxW - innerPadding * 2;
    let curY = boxY + innerPadding;

    // 2. Header Block
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.setTextColor(0, 0, 0);
    doc.text('Form XIV', pageWidth / 2, curY + 24, { align: 'center' });

    doc.setFontSize(11);
    doc.text('(See Rule 76)', pageWidth / 2, curY + 40, { align: 'center' });

    doc.setFontSize(12);
    doc.text('Employment Card', pageWidth / 2, curY + 56, { align: 'center' });

    curY += 66;

    // Horizontal line separating header
    doc.setLineWidth(1);
    doc.line(contentX, curY, contentX + contentW, curY);

    // 3. Two-Column Table
    const col1W = 210;
    const col2W = contentW - col1W;

    const contractorName = record.contractorName || defaultComp.name || 'RR SECURITY & FACILITIES';
    const contractorAddress = record.contractorAddress || defaultComp.address || 'G-75/A, Ground Floor, Block-G M.B. EXTN., Badarpur New Delhi-110044';
    const contractorFull = `${contractorName}\n${contractorAddress}`;

    const establishmentName = record.establishmentName || 'Client Establishment Site';
    const establishmentAddress = record.establishmentAddress || 'Premises / Site within Delhi NCR';
    const establishmentFull = `${establishmentName}\n${establishmentAddress}`;

    const workLocation = record.workNameLocation || `Security & Facility Services, At ${establishmentName}`;
    const principalEmployer = record.principalEmployer || `The Management / Authorized Officer,\n${establishmentName}, ${establishmentAddress}`;

    const rows = [
      {
        label: 'Name and Address of Contractor :',
        value: contractorFull,
        minH: 48,
      },
      {
        label: 'Name and Address of Establishment in/ under which Contract is Carried on :',
        value: establishmentFull,
        minH: 52,
      },
      {
        label: 'Name of Work and Location of Work :',
        value: workLocation,
        minH: 38,
      },
      {
        label: 'Name and Address of Principal Employer :',
        value: principalEmployer,
        minH: 48,
      },
      {
        label: '1. Name of the Workman :',
        value: record.workmanName || record.name || record.employeeName || '—',
        minH: 32,
        isBold: true,
      },
      {
        label: '2. S.No. in the Register of Workmen Employed :',
        value: String(record.serialNoInRegister || record.employeeCode || record.employeeId || idx + 1),
        minH: 32,
      },
      {
        label: '3. Nature of Employment/Designation :',
        value: record.natureOfEmployment || record.designation || 'Staff',
        minH: 32,
      },
      {
        label: '4. Wage Rate (with particulars of unit in case of piece-work) :',
        value: record.wageRate || '—',
        minH: 38,
      },
      {
        label: '5. Wage Period :',
        value: record.wagePeriod || 'Monthly',
        minH: 30,
      },
      {
        label: '6. Tenure of Employment :',
        value: record.tenureOfEmployment || 'During the currency of the contract with Principal Employer',
        minH: 34,
      },
      {
        label: '7. Remarks :',
        value: record.remarks || '—',
        minH: 32,
      },
    ];

    const tableStartY = curY;

    rows.forEach((r) => {
      // Measure label wrapped lines
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      const labelLines = doc.splitTextToSize(r.label, col1W - 16);

      // Measure value wrapped lines
      doc.setFont('helvetica', r.isBold ? 'bold' : 'normal');
      doc.setFontSize(9.5);
      const valueLines = doc.splitTextToSize(r.value, col2W - 16);

      const neededH = Math.max(
        r.minH,
        labelLines.length * 13 + 12,
        valueLines.length * 13 + 12
      );

      // Print Label in Column 1
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.text(labelLines, contentX + 8, curY + 16);

      // Print Value in Column 2
      doc.setFont('helvetica', r.isBold ? 'bold' : 'normal');
      doc.setFontSize(9.5);
      doc.text(valueLines, contentX + col1W + 8, curY + 16);

      curY += neededH;

      // Row bottom divider
      doc.setLineWidth(0.75);
      doc.line(contentX, curY, contentX + contentW, curY);
    });

    const tableEndY = curY;

    // Vertical line between column 1 and column 2
    doc.line(contentX + col1W, tableStartY, contentX + col1W, tableEndY);

    // 4. Bottom Signature Area
    const remainingH = boxY + boxH - innerPadding - curY;
    const sigY = curY + Math.max(40, remainingH - 45);

    doc.setFont('helvetica', 'italic');
    doc.setFontSize(13);
    doc.setTextColor(17, 54, 105);
    doc.text('Kashish', contentX + contentW - 40, sigY - 14, { align: 'right' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(0, 0, 0);
    doc.text('Signature of Contractor', contentX + contentW - 20, sigY, {
      align: 'right',
    });
  }

  if (mode === 'print') {
    doc.autoPrint();
    const blobUrl = doc.output('bloburl');
    const printWindow = window.open(blobUrl, '_blank');
    if (printWindow) {
      printWindow.focus();
    }
  } else {
    const singleRec = records[0];
    const namePart =
      records.length === 1 && singleRec?.workmanName
        ? `_${singleRec.workmanName.replace(/\s+/g, '_')}`
        : `_All_Workmen`;
    const filename = options.filename || `Employment_Card_Form_XIV${namePart}.pdf`;
    doc.save(filename);
  }
}

/**
 * Generate and download Statutory Form XIV Employment Card as Excel (.xlsx) file
 */
export function downloadEmploymentCardExcel(
  records = [],
  globalCompanyInfo = {},
  options = {}
) {
  const list = Array.isArray(records) ? records : [records];
  if (!list.length) return;

  const defaultComp = globalCompanyInfo || {};
  const wb = XLSX.utils.book_new();

  // If multiple records, create summary sheet + individual formatted cards
  const aoa = [
    ['FORM XIV', ''],
    ['(See Rule 76)', ''],
    ['Employment Card', ''],
    ['', ''],
  ];

  list.forEach((rec, idx) => {
    if (idx > 0) {
      aoa.push(['', '']);
      aoa.push(['--- NEXT EMPLOYMENT CARD ---', '']);
      aoa.push(['FORM XIV', '']);
      aoa.push(['(See Rule 76)', '']);
      aoa.push(['Employment Card', '']);
    }

    const contractorFull = `${rec.contractorName || defaultComp.name || 'RR SECURITY & FACILITIES'}, ${rec.contractorAddress || defaultComp.address || 'G-75/A Badarpur New Delhi-110044'}`;
    const establishmentFull = `${rec.establishmentName || 'Client Site'}, ${rec.establishmentAddress || 'Delhi NCR'}`;

    aoa.push(['Name and Address of Contractor :', contractorFull]);
    aoa.push(['Name and Address of Establishment in/ under which Contract is Carried on :', establishmentFull]);
    aoa.push(['Name of Work and Location of Work :', rec.workNameLocation || `Security & Facility Services, At ${rec.establishmentName || 'Client Site'}`]);
    aoa.push(['Name and Address of Principal Employer :', rec.principalEmployer || `The Management, ${establishmentFull}`]);
    aoa.push(['1. Name of the Workman :', rec.workmanName || rec.name || rec.employeeName || '—']);
    aoa.push(['2. S.No. in the Register of Workmen Employed :', rec.serialNoInRegister || rec.employeeCode || `${idx + 1}`]);
    aoa.push(['3. Nature of Employment/Designation :', rec.natureOfEmployment || rec.designation || 'Staff']);
    aoa.push(['4. Wage Rate (with particulars of unit in case of piece-work) :', rec.wageRate || '—']);
    aoa.push(['5. Wage Period :', rec.wagePeriod || 'Monthly']);
    aoa.push(['6. Tenure of Employment :', rec.tenureOfEmployment || 'During the currency of the contract']);
    aoa.push(['7. Remarks :', rec.remarks || '—']);
    aoa.push(['', 'Signature of Contractor']);
  });

  const ws = XLSX.utils.aoa_to_sheet(aoa);

  // Set column widths
  ws['!cols'] = [{ wch: 42 }, { wch: 65 }];

  XLSX.utils.book_append_sheet(wb, ws, 'Form XIV Employment Card');

  const filename = options.filename || `Employment_Card_Form_XIV_${new Date().getFullYear()}.xlsx`;
  XLSX.writeFile(wb, filename);
}
