import React, { useState, useRef } from 'react';
import { X, UploadCloud, FileSpreadsheet, Download, CheckCircle, AlertTriangle, FileText } from 'lucide-react';
import * as XLSX from 'xlsx';
import styles from './AttendanceImportModal.module.css';

/**
 * AttendanceImportModal
 * Supports uploading both Excel (.xlsx, .xls) and CSV (.csv) files.
 * Provides sample template download in both Excel (.xlsx) and CSV formats.
 * Standardizes date formats (DD-MM-YYYY, DD/MM/YYYY, YYYY-MM-DD, Excel date numbers) to standard ISO YYYY-MM-DD.
 */
function AttendanceImportModal({ onClose, onImport, activeCompanyName = 'RR Security' }) {
  const defaultMonth = new Date().toISOString().slice(0, 7);
  const todayDate = new Date().toISOString().split('T')[0];

  const [targetMonth, setTargetMonth] = useState(defaultMonth);
  const [defaultDate, setDefaultDate] = useState(todayDate);
  const [file, setFile] = useState(null);
  const [parsedRows, setParsedRows] = useState([]);
  const [parseError, setParseError] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  // Normalize any date format to YYYY-MM-DD
  const normalizeDate = (val) => {
    if (!val) return defaultDate;

    // If it's an Excel numeric date serial
    if (typeof val === 'number') {
      try {
        const dateObj = new Date(Math.round((val - 25569) * 86400 * 1000));
        if (!isNaN(dateObj.getTime())) {
          return dateObj.toISOString().split('T')[0];
        }
      } catch {
        // continue
      }
    }

    const str = String(val).trim();
    if (!str) return defaultDate;

    // ISO format: YYYY-MM-DD or YYYY/MM/DD
    if (/^\d{4}[-/]\d{1,2}[-/]\d{1,2}$/.test(str)) {
      const [y, m, d] = str.split(/[-/]/);
      return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    }

    // Common Indian/UK format: DD-MM-YYYY or DD/MM/YYYY
    if (/^\d{1,2}[-/]\d{1,2}[-/]\d{4}$/.test(str)) {
      const [d, m, y] = str.split(/[-/]/);
      return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    }

    // If only DD-MM is given without year, append targetMonth's year
    if (/^\d{1,2}[-/]\d{1,2}$/.test(str)) {
      const [d, m] = str.split(/[-/]/);
      const year = targetMonth.split('-')[0] || new Date().getFullYear();
      return `${year}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    }

    return defaultDate;
  };

  // Standardize time format: e.g. "09:05AM" -> "09:05 AM" or 0.378 (Excel decimal time)
  const normalizeTime = (val) => {
    if (!val && val !== 0) return '';
    
    // Excel decimal time fraction (e.g. 0.378472 -> 09:05 AM)
    if (typeof val === 'number' && val >= 0 && val <= 1) {
      const totalMinutes = Math.round(val * 24 * 60);
      const hours = Math.floor(totalMinutes / 60);
      const mins = totalMinutes % 60;
      const period = hours >= 12 ? 'PM' : 'AM';
      const displayHours = hours % 12 || 12;
      return `${String(displayHours).padStart(2, '0')}:${String(mins).padStart(2, '0')} ${period}`;
    }

    let str = String(val).trim();
    if (!str) return '';

    // Check for "09:05AM" without space
    const matchAmpm = str.match(/^(\d{1,2}):(\d{2})\s*(AM|PM|am|pm)$/i);
    if (matchAmpm) {
      const h = String(matchAmpm[1]).padStart(2, '0');
      const m = matchAmpm[2];
      const p = matchAmpm[3].toUpperCase();
      return `${h}:${m} ${p}`;
    }

    // Check for 24-hour "17:00" or "09:05"
    const match24 = str.match(/^(\d{1,2}):(\d{2})$/);
    if (match24) {
      const h = Number(match24[1]);
      const m = match24[2];
      const p = h >= 12 ? 'PM' : 'AM';
      const displayH = h % 12 || 12;
      return `${String(displayH).padStart(2, '0')}:${m} ${p}`;
    }

    return str;
  };

  // Helper to calculate working hours string
  const calculateHours = (inTime, outTime, providedHours) => {
    if (providedHours && String(providedHours).trim()) {
      const hStr = String(providedHours).trim();
      if (/^\d+(\.\d+)?$/.test(hStr)) {
        const num = Number(hStr);
        const h = Math.floor(num);
        const m = Math.round((num - h) * 60);
        return `${h}h ${String(m).padStart(2, '0')}m`;
      }
      return hStr.includes('h') ? hStr : `${hStr}h 00m`;
    }

    if (!inTime || !outTime) return '0h 00m';
    try {
      const parseTimeMinutes = (timeStr) => {
        const cleaned = String(timeStr).trim().toUpperCase();
        const isPM = cleaned.includes('PM');
        const isAM = cleaned.includes('AM');
        const numbers = cleaned.replace(/[^0-9:]/g, '');
        let [hours, mins] = numbers.split(':').map(Number);
        if (isNaN(hours)) return null;
        if (isNaN(mins)) mins = 0;
        if (isPM && hours < 12) hours += 12;
        if (isAM && hours === 12) hours = 0;
        return hours * 60 + mins;
      };

      const inMins = parseTimeMinutes(inTime);
      const outMins = parseTimeMinutes(outTime);
      if (inMins !== null && outMins !== null && outMins > inMins) {
        const diff = outMins - inMins;
        const h = Math.floor(diff / 60);
        const m = diff % 60;
        return `${h}h ${String(m).padStart(2, '0')}m`;
      }
    } catch {
      // ignore
    }
    return '8h 00m';
  };

  // Download Sample Template as genuine Excel (.xlsx)
  const handleDownloadExcelSample = () => {
    const sampleData = [
      {
        'Employee ID': 'EMP-001',
        'Employee Name': 'Rishab Sharma',
        'Client Name': 'TNT Company',
        'Site': 'Gurgaon HQ',
        'Department': 'Security',
        'Date': defaultDate,
        'Check In': '09:00 AM',
        'Check Out': '05:00 PM',
        'Working Hours': '8',
        'Status': 'Present'
      },
      {
        'Employee ID': 'EMP-002',
        'Employee Name': 'Amit Kumar',
        'Client Name': 'TNT Company',
        'Site': 'Main Gate',
        'Department': 'Security',
        'Date': defaultDate,
        'Check In': '09:15 AM',
        'Check Out': '05:00 PM',
        'Working Hours': '8',
        'Status': 'Present'
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(sampleData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Attendance');
    XLSX.writeFile(workbook, `Attendance_Template_${targetMonth}.xlsx`);
  };

  // Download Sample Template as CSV (.csv)
  const handleDownloadCsvSample = () => {
    const csvContent = 'Employee ID,Employee Name,Client Name,Site,Department,Date,Check In,Check Out,Working Hours,Status\n' +
      `EMP-001,Rishab Sharma,TNT Company,Gurgaon HQ,Security,${defaultDate},09:00 AM,05:00 PM,8,Present\n` +
      `EMP-002,Amit Kumar,TNT Company,Main Gate,Security,${defaultDate},09:15 AM,05:00 PM,8,Present\n`;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Attendance_Template_${targetMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Unified parser for both Excel (.xlsx, .xls) and CSV (.csv)
  const processFileData = (rawRows) => {
    setParseError('');
    if (!rawRows || rawRows.length === 0) {
      setParseError('The uploaded file contains no readable data rows.');
      setParsedRows([]);
      return;
    }

    const headers = Object.keys(rawRows[0] || {});
    const normalizeHeader = (h) => String(h).toLowerCase().replace(/[^a-z0-9]/g, '');

    const findKey = (possibleNames) => {
      return headers.find(h => {
        const norm = normalizeHeader(h);
        return possibleNames.some(p => norm.includes(p));
      });
    };

    const empIdKey = findKey(['employeeid', 'empid', 'id', 'code']);
    const empNameKey = findKey(['employeename', 'name', 'employee']);
    const companyKey = findKey(['companyname', 'company', 'client']);
    const siteKey = findKey(['site', 'location']);
    const deptKey = findKey(['department', 'dept']);
    const dateKey = findKey(['date', 'day']);
    const checkInKey = findKey(['checkin', 'intime', 'in']);
    const checkOutKey = findKey(['checkout', 'outtime', 'out']);
    const hoursKey = findKey(['workinghours', 'hours', 'totalhours']);
    const statusKey = findKey(['status']);

    const formattedRows = [];

    rawRows.forEach((row, i) => {
      const empId = (empIdKey ? row[empIdKey] : row[headers[0]]) || `EMP${String(i + 1).padStart(3, '0')}`;
      const empName = (empNameKey ? row[empNameKey] : row[headers[1]]) || 'Employee';
      const companyName = (companyKey ? row[companyKey] : '') || activeCompanyName;
      const site = (siteKey ? row[siteKey] : '') || 'Main Site';
      const department = (deptKey ? row[deptKey] : '') || 'Security';

      const rawDate = dateKey ? row[dateKey] : defaultDate;
      const rowDate = normalizeDate(rawDate);

      const checkIn = normalizeTime(checkInKey ? row[checkInKey] : '');
      const checkOut = normalizeTime(checkOutKey ? row[checkOutKey] : '');

      let rawStatus = String(statusKey && row[statusKey] !== undefined ? row[statusKey] : '').toLowerCase();
      let status = 'present';
      if (rawStatus.includes('absent')) status = 'absent';
      else if (rawStatus.includes('half')) status = 'halfDay';
      else if (rawStatus.includes('leave')) status = 'onLeave';
      else if (rawStatus.includes('late')) status = 'late';
      else if (!checkIn && !checkOut && rawStatus !== 'present') status = 'absent';

      const workingHours = calculateHours(checkIn, checkOut, hoursKey ? row[hoursKey] : null);

      const initials = String(empName)
        .split(' ')
        .map((n) => n[0])
        .join('')
        .substring(0, 2)
        .toUpperCase() || 'EM';

      formattedRows.push({
        id: `ATT-IMP-${Date.now()}-${i + 1}`,
        employeeId: String(empId).trim(),
        employeeName: String(empName).trim(),
        initials,
        companyName: String(companyName).trim(),
        companyId: 'comp-1',
        site: String(site).trim(),
        department: String(department).trim(),
        date: rowDate,
        checkIn: checkIn || null,
        checkOut: checkOut || null,
        workingHours,
        status,
        lateMinutes: status === 'late' ? 15 : 0,
        earlyOutMinutes: 0
      });
    });

    if (formattedRows.length === 0) {
      setParseError('No valid employee attendance records could be extracted.');
    }

    setParsedRows(formattedRows);
  };

  // Read file as ArrayBuffer for XLSX (handles .xlsx, .xls, and .csv universally)
  const readFile = (fileObj) => {
    setFile(fileObj);
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array', cellDates: false });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const json = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
        processFileData(json);
      } catch (err) {
        console.error('Error parsing spreadsheet file:', err);
        setParseError('Failed to read file. Please ensure it is a valid Excel (.xlsx/.xls) or CSV (.csv) file.');
        setParsedRows([]);
      }
    };

    reader.readAsArrayBuffer(fileObj);
  };

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    const name = selected.name.toLowerCase();
    if (!name.endsWith('.xlsx') && !name.endsWith('.xls') && !name.endsWith('.csv')) {
      setParseError('Please upload a valid Excel (.xlsx, .xls) or CSV (.csv) file.');
      return;
    }
    readFile(selected);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) {
      const name = dropped.name.toLowerCase();
      if (!name.endsWith('.xlsx') && !name.endsWith('.xls') && !name.endsWith('.csv')) {
        setParseError('Please drop a valid .xlsx, .xls, or .csv file.');
        return;
      }
      readFile(dropped);
    }
  };

  const handleClearFile = () => {
    setFile(null);
    setParsedRows([]);
    setParseError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (parsedRows.length === 0) return;

    // Use the parsed date from the first record as target active date if available
    const firstDate = parsedRows[0]?.date || defaultDate;

    onImport({
      month: targetMonth,
      date: firstDate,
      records: parsedRows
    });
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'present': return `${styles.statusTag} ${styles.statusPresent}`;
      case 'absent': return `${styles.statusTag} ${styles.statusAbsent}`;
      case 'halfDay': return `${styles.statusTag} ${styles.statusHalfDay}`;
      case 'onLeave': return `${styles.statusTag} ${styles.statusLeave}`;
      case 'late': return `${styles.statusTag} ${styles.statusLate}`;
      default: return styles.statusTag;
    }
  };

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true">
      <div className={styles.modal}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <div className={styles.headerIcon}>
              <UploadCloud size={22} />
            </div>
            <div>
              <h3 className={styles.title}>Import Attendance Records</h3>
              <p className={styles.sub}>Upload monthly or daily attendance from Excel (.xlsx/.xls) or CSV</p>
            </div>
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className={styles.body}>
          {/* Target Period Controls */}
          <div className={styles.configGrid}>
            <div className={styles.formGroup}>
              <label className={styles.label}>
                <FileSpreadsheet size={15} color="#2563eb" />
                Target Month *
              </label>
              <input
                type="month"
                className={styles.input}
                value={targetMonth}
                onChange={(e) => setTargetMonth(e.target.value)}
                required
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>
                <CheckCircle size={15} color="#16a34a" />
                Default Record Date
              </label>
              <input
                type="date"
                className={styles.input}
                value={defaultDate}
                onChange={(e) => setDefaultDate(e.target.value)}
              />
            </div>
          </div>

          {/* Sample Template Download Options */}
          <div className={styles.templateDownloadCard}>
            <div className={styles.templateInfo}>
              <FileText size={18} />
              <span>Download official attendance template with all required columns:</span>
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button
                type="button"
                className={styles.downloadBtn}
                onClick={handleDownloadExcelSample}
                title="Download genuine Excel format"
              >
                <Download size={14} />
                Download Excel Template (.xlsx)
              </button>
              <button
                type="button"
                className={styles.downloadBtn}
                onClick={handleDownloadCsvSample}
                title="Download standard CSV format"
              >
                <Download size={14} />
                Download CSV (.csv)
              </button>
            </div>
          </div>

          {/* File Upload Dropzone */}
          {!file ? (
            <div
              className={`${styles.dropzone} ${isDragging ? styles.dropzoneActive : ''}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                style={{ display: 'none' }}
                onChange={handleFileChange}
              />
              <UploadCloud className={styles.dropzoneIcon} />
              <div className={styles.dropzoneTitle}>Click to upload or drag & drop Excel / CSV file</div>
              <div className={styles.dropzoneDesc}>Supports Microsoft Excel (.xlsx, .xls) and CSV (.csv) formats</div>
            </div>
          ) : (
            <div className={styles.fileActiveBar}>
              <div className={styles.fileDetails}>
                <FileSpreadsheet size={22} color="#2563eb" />
                <div>
                  <div className={styles.fileName}>{file.name}</div>
                  <div className={styles.fileMeta}>
                    {(file.size / 1024).toFixed(1)} KB &bull; {parsedRows.length} employee records parsed
                  </div>
                </div>
              </div>
              <button
                type="button"
                className={styles.clearFileBtn}
                onClick={handleClearFile}
              >
                Remove File
              </button>
            </div>
          )}

          {/* Error Banner */}
          {parseError && (
            <div className={styles.errorBanner} role="alert">
              <AlertTriangle size={18} />
              <span>{parseError}</span>
            </div>
          )}

          {/* Preview Table with Separate Columns */}
          {parsedRows.length > 0 && (
            <div className={styles.previewContainer}>
              <div className={styles.previewHeader}>
                <span className={styles.previewTitle}>Parsed Records Preview ({parsedRows.length} employees)</span>
                <div className={styles.previewBadges}>
                  <span className={styles.badgeSuccess}>
                    ✓ Ready to Import ({parsedRows.length})
                  </span>
                </div>
              </div>

              <div className={styles.tableWrap}>
                <table className={styles.previewTable}>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Employee ID</th>
                      <th>Employee Name</th>
                      <th>Client</th>
                      <th>Site</th>
                      <th>Department</th>
                      <th>Date</th>
                      <th>Check In</th>
                      <th>Check Out</th>
                      <th>Working Hours</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedRows.map((row, idx) => (
                      <tr key={row.id || idx}>
                        <td style={{ color: '#94a3b8' }}>{idx + 1}</td>
                        <td style={{ fontWeight: 600 }}>{row.employeeId}</td>
                        <td>{row.employeeName}</td>
                        <td>{row.companyName}</td>
                        <td>{row.site}</td>
                        <td>{row.department}</td>
                        <td>{row.date}</td>
                        <td>{row.checkIn || '—'}</td>
                        <td>{row.checkOut || '—'}</td>
                        <td>{row.workingHours || '—'}</td>
                        <td>
                          <span className={getStatusBadgeClass(row.status)}>
                            {row.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Footer Navigation */}
          <footer className={styles.footer}>
            <button
              type="button"
              className={styles.cancelBtn}
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={styles.importBtn}
              disabled={parsedRows.length === 0}
            >
              <UploadCloud size={16} />
              Import {parsedRows.length > 0 ? `${parsedRows.length} Records` : 'Attendance'}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}

export default AttendanceImportModal;
