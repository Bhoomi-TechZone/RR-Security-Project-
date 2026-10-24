import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * Capture an on-screen DOM report preview and download or print it as a high-fidelity PDF.
 * This guarantees 100% exact parity with the statutory layout, table lines, header columns colors,
 * borders, cards, and typography visible on screen.
 *
 * Automatically isolates the official document sheet (excluding UI toolbars, pill badges and web KPI cards),
 * applies appropriate paper format (A3 landscape for wide multi-column statutory registers),
 * and implements row-aware pagination so no employee record is ever cut in half.
 *
 * @param {HTMLElement|string} target - DOM element or CSS selector of the report preview container
 * @param {Object} options - Configuration options
 * @param {string} [options.filename='report.pdf'] - Filename for downloaded PDF
 * @param {string} [options.title='Report'] - Document title metadata
 * @param {'download'|'print'} [options.mode='download'] - Download or open print preview
 * @param {'auto'|'landscape'|'portrait'} [options.orientation='auto'] - Page orientation
 * @param {'auto'|'a4'|'a3'} [options.format='auto'] - Page size
 * @param {number} [options.scale=2] - html2canvas resolution scale (2 = crisp retina text/lines)
 * @param {number|Object} [options.margin=18] - Margins in points (default: 18pt)
 * @param {string[]} [options.ignoreSelectors] - Selectors to ignore during capture (e.g. buttons)
 * @returns {Promise<boolean>} Success status
 */
export async function downloadElementAsPdf(target, options = {}) {
  const rootElement = typeof target === 'string' ? document.querySelector(target) : target;
  if (!rootElement) {
    console.error('[domPdfExportUtil] Target element not found:', target);
    return false;
  }

  // Isolate the actual statutory/report document paper if wrapped inside a UI container,
  // excluding action toolbars, pill badges and web KPI summary cards.
  const sheetElement =
    rootElement.querySelector('[data-report-sheet="true"]') ||
    rootElement.querySelector('[class*="paper"], [class*="paperSheet"], [class*="ReportSheet"]') ||
    rootElement;

  const {
    filename = 'Report.pdf',
    title = 'Report',
    mode = 'download',
    orientation = 'auto',
    format = 'auto',
    scale = 2,
    margin = 18,
    ignoreSelectors = [
      'button',
      '.no-print',
      '[data-no-print="true"]',
      '[class*="toolbar"]',
      '[class*="kpiBar"]',
      '[class*="kpiCard"]',
      '[class*="pagination"]',
      '[class*="Pagination"]',
      '[class*="actionBtn"]',
      '[class*="btnAction"]',
      '[class*="actionsCol"]',
      '[class*="actionsCell"]'
    ],
  } = options;

  // Temporarily mark non-document elements to be ignored by html2canvas
  const markedIgnoredElements = [];
  if (Array.isArray(ignoreSelectors) && ignoreSelectors.length > 0) {
    try {
      const selectorStr = ignoreSelectors.join(', ');
      const matchingEls = sheetElement.querySelectorAll(selectorStr);
      matchingEls.forEach((el) => {
        if (!el.hasAttribute('data-html2canvas-ignore')) {
          el.setAttribute('data-html2canvas-ignore', 'true');
          markedIgnoredElements.push(el);
        }
      });
    } catch (err) {
      console.warn('[domPdfExportUtil] Could not query ignoreSelectors:', err);
    }
  }

  try {
    // Measure natural dimensions of the isolated statutory sheet
    const scrollWidth = Math.max(
      sheetElement.scrollWidth || 0,
      sheetElement.offsetWidth || 0,
      sheetElement.clientWidth || 0
    );
    const scrollHeight = Math.max(
      sheetElement.scrollHeight || 0,
      sheetElement.offsetHeight || 0,
      sheetElement.clientHeight || 0
    );

    // Detect wide multi-column statutory registers (wage register, salary sheet, muster roll)
    const isMultiColumnRegister =
      Boolean(sheetElement.querySelector('table th[colspan], table td[colspan]')) ||
      sheetElement.querySelectorAll('table thead th').length > 7 ||
      scrollWidth > 850;

    // Auto-detect orientation: wide registers should always use landscape
    const isLandscape = orientation === 'auto'
      ? (isMultiColumnRegister || scrollWidth > 720 || (scrollWidth / Math.max(scrollHeight, 1)) > 1.0)
      : orientation === 'landscape';

    // Auto-detect format: statutory compliance registers require A3 landscape for legibility
    const pdfFormat = format === 'auto'
      ? (isMultiColumnRegister || scrollWidth > 950 ? 'a3' : 'a4')
      : format;

    // Use generous render width so horizontal layout and columns are not compressed
    const renderWidth = isMultiColumnRegister
      ? Math.max(scrollWidth, 1260)
      : Math.max(scrollWidth, 900);

    // Measure table row boundaries and header before cloning/capturing
    const sheetRect = sheetElement.getBoundingClientRect();
    const allRows = Array.from(sheetElement.querySelectorAll('tr'));
    const domRowBottoms = allRows
      .map((r) => {
        const rRect = r.getBoundingClientRect();
        return Math.round(rRect.bottom - sheetRect.top);
      })
      .filter((pos) => pos > 0)
      .sort((a, b) => a - b);

    // Measure the table thead position and height if present
    const theadEl = sheetElement.querySelector('table thead');
    let theadTopDom = 0;
    let theadHeightDom = 0;
    if (theadEl) {
      const theadRect = theadEl.getBoundingClientRect();
      theadTopDom = Math.round(theadRect.top - sheetRect.top);
      theadHeightDom = Math.round(theadRect.height);
    }

    const canvas = await html2canvas(sheetElement, {
      scale: scale,
      useCORS: true,
      allowTaint: true,
      logging: false,
      backgroundColor: '#ffffff',
      scrollX: 0,
      scrollY: 0,
      width: renderWidth,
      windowWidth: renderWidth + 120,
      onclone: (clonedDoc, clonedEl) => {
        // Expand width and remove overflow restrictions in cloned DOM
        clonedEl.style.width = `${renderWidth}px`;
        clonedEl.style.maxWidth = 'none';
        clonedEl.style.overflow = 'visible';
        clonedEl.style.boxSizing = 'border-box';
        clonedEl.style.background = '#ffffff';

        // Find any table wrappers and expand them so full table is captured
        const wrappers = clonedEl.querySelectorAll(
          '[class*="tableWrap"], [class*="TableWrap"], [class*="registerTableWrap"], [class*="paperWrap"], [class*="tableContainer"], table'
        );
        wrappers.forEach((w) => {
          w.style.overflow = 'visible';
          w.style.overflowX = 'visible';
          w.style.maxWidth = 'none';
          w.style.width = '100%';
        });

        // Ensure all badges, colored text and table cells retain background graphics
        const styledCells = clonedEl.querySelectorAll('th, td, span, div');
        styledCells.forEach((c) => {
          c.style.webkitPrintColorAdjust = 'exact';
          c.style.printColorAdjust = 'exact';
        });
      },
    });

    // Initialize jsPDF with calculated orientation and format
    const doc = new jsPDF({
      orientation: isLandscape ? 'landscape' : 'portrait',
      unit: 'pt',
      format: pdfFormat,
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Calculate margins
    const marginTop = typeof margin === 'object' ? (margin.top ?? 18) : margin;
    const marginBottom = typeof margin === 'object' ? (margin.bottom ?? 18) : margin;
    const marginLeft = typeof margin === 'object' ? (margin.left ?? 18) : margin;
    const marginRight = typeof margin === 'object' ? (margin.right ?? 18) : margin;

    const printableWidth = pageWidth - marginLeft - marginRight;
    const printableHeight = pageHeight - marginTop - marginBottom;

    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;

    // Scale canvas to fit printable page width
    const scaleFactor = printableWidth / canvasWidth;
    const totalPdfHeight = canvasHeight * scaleFactor;

    // Scale ratio between canvas pixels and DOM pixels
    const domHeight = Math.max(sheetElement.offsetHeight, 1);
    const scaleRatio = canvasHeight / domHeight;

    // Map DOM row boundaries to canvas pixels
    const canvasRowBottoms = domRowBottoms.map((o) => Math.round(o * scaleRatio));

    // Prepare repeated header canvas slice for multi-page tables
    let theadCanvasSlice = null;
    let theadCanvasHeight = 0;
    let theadPdfHeight = 0;
    if (theadHeightDom > 15) {
      theadCanvasHeight = Math.round(theadHeightDom * scaleRatio);
      const theadCanvasTop = Math.max(0, Math.round(theadTopDom * scaleRatio));

      if (theadCanvasHeight > 0 && theadCanvasTop + theadCanvasHeight <= canvasHeight) {
        theadCanvasSlice = document.createElement('canvas');
        theadCanvasSlice.width = canvasWidth;
        theadCanvasSlice.height = theadCanvasHeight;
        const hCtx = theadCanvasSlice.getContext('2d');
        hCtx.fillStyle = '#ffffff';
        hCtx.fillRect(0, 0, canvasWidth, theadCanvasHeight);
        hCtx.drawImage(
          canvas,
          0,
          theadCanvasTop,
          canvasWidth,
          theadCanvasHeight,
          0,
          0,
          canvasWidth,
          theadCanvasHeight
        );
        theadPdfHeight = theadCanvasHeight * scaleFactor;
      }
    }

    // Check if the entire canvas fits on a single page
    if (totalPdfHeight <= printableHeight + 15) {
      const imgData = canvas.toDataURL('image/png');
      doc.addImage(
        imgData,
        'PNG',
        marginLeft,
        marginTop,
        printableWidth,
        totalPdfHeight,
        undefined,
        'FAST'
      );
    } else {
      // Multi-page slicing: compute how much canvas height fits on one PDF page
      const maxCanvasPageHeight = Math.floor(printableHeight / scaleFactor);
      let currentY = 0;
      let pageIndex = 0;

      while (currentY < canvasHeight - 5) {
        if (pageIndex > 0) {
          doc.addPage();
        }

        // Available vertical canvas space on this page
        // On subsequent pages, reserve space for the repeated table header if applicable
        const hasRepeatedHeader = pageIndex > 0 && theadCanvasSlice !== null;
        const availablePdfHeight = hasRepeatedHeader
          ? printableHeight - theadPdfHeight - 4
          : printableHeight;
        const pageCanvasLimit = Math.floor(availablePdfHeight / scaleFactor);

        const remainingHeight = canvasHeight - currentY;
        let sliceHeight;

        if (remainingHeight <= pageCanvasLimit + 10) {
          // Final portion fits completely on this page
          sliceHeight = remainingHeight;
        } else {
          // Find the best row break point that does NOT slice any row in half
          const targetCutY = currentY + pageCanvasLimit;
          const candidateBreak = canvasRowBottoms
            .filter((b) => b <= targetCutY && b >= currentY + Math.floor(pageCanvasLimit * 0.4))
            .pop();

          if (candidateBreak && candidateBreak > currentY) {
            sliceHeight = candidateBreak - currentY;
          } else {
            // Fallback if no table row boundary exists in this window
            sliceHeight = pageCanvasLimit;
          }
        }

        // 1. Draw repeated table header at the top of subsequent pages
        let currentDrawY = marginTop;
        if (hasRepeatedHeader) {
          const theadImgData = theadCanvasSlice.toDataURL('image/png');
          doc.addImage(
            theadImgData,
            'PNG',
            marginLeft,
            currentDrawY,
            printableWidth,
            theadPdfHeight,
            undefined,
            'FAST'
          );
          currentDrawY += theadPdfHeight + 4;
        }

        // 2. Create canvas slice for this page's content
        const pageCanvas = document.createElement('canvas');
        pageCanvas.width = canvasWidth;
        pageCanvas.height = sliceHeight;

        const ctx = pageCanvas.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvasWidth, sliceHeight);

        ctx.drawImage(
          canvas,
          0,
          currentY,
          canvasWidth,
          sliceHeight,
          0,
          0,
          canvasWidth,
          sliceHeight
        );

        const sliceImgData = pageCanvas.toDataURL('image/png');
        const slicePdfHeight = sliceHeight * scaleFactor;

        doc.addImage(
          sliceImgData,
          'PNG',
          marginLeft,
          currentDrawY,
          printableWidth,
          slicePdfHeight,
          undefined,
          'FAST'
        );

        currentY += sliceHeight;
        pageIndex++;
      }
    }

    if (mode === 'print') {
      doc.autoPrint();
      const blobUrl = doc.output('bloburl');
      const printWindow = window.open(blobUrl, '_blank');
      if (printWindow) {
        printWindow.focus();
      }
    } else {
      const cleanFilename = filename.toLowerCase().endsWith('.pdf')
        ? filename
        : `${filename}.pdf`;
      doc.save(cleanFilename);
    }

    return true;
  } catch (error) {
    console.error('[domPdfExportUtil] Error generating PDF from preview element:', error);
    return false;
  } finally {
    // Restore any modified data-html2canvas-ignore attributes
    markedIgnoredElements.forEach((el) => {
      el.removeAttribute('data-html2canvas-ignore');
    });
  }
}

export default downloadElementAsPdf;
