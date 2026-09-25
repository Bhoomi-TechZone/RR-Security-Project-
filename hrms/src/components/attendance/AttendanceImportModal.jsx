import React, { useState, useRef } from 'react';
import { X, UploadCloud, FileSpreadsheet, Download, CheckCircle, AlertTriangle, FileText } from 'lucide-react';
import styles from './AttendanceImportModal.module.css';

/**
 * AttendanceImportModal
 * Allows admin to upload a CSV file of attendance records, configure target month/date,
 * preview parsed rows across all table columns separately, and bulk import into the system.
 */
function AttendanceImportModal({ onClose, onImport, activeCompanyName = 'RR Security' }) {
  // Current month default: YYYY-MM (e.g. "2026-09")
  const defaultMonth = new Date().toISOString().slice(0, 7);
  const todayDate = new Date().toISOString().split('T')[0];

  const [targetMonth, setTargetMonth] = useState(defaultMonth);
  const [defaultDate, setDefaultDate] = useState(todayDate);
  const [file, setFile] = useState(null);
  const [parsedRows, setParsedRows] = useState([]);
  const [parseError, setParseError] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  // Download Sample Template CSV (Only column headers, no prefilled data)
  const handleDownloadSample = () => {
    const csvContent = 'Employee ID,Employee Name,Company Name,Site,Department,Date,Check In,Check Out,Working Hours,Status\n';
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Attendance_Template_${targetMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Helper to calculate working hours string if check-in and check-out are given
  const calculateHours = (inTime, outTime) => {
    if (!inTime || !outTime) return '0h 00m';
    try {
      const parseTimeMinutes = (timeStr) => {
        const cleaned = timeStr.trim().toUpperCase();
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
    return '9h 00m';
  };

  // Parse CSV text
  const parseCSV = (text) => {
    setParseError('');
    try {
      const lines = text
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);

      if (lines.length < 2) {
        setParseError('The uploaded CSV file is empty or does not contain a header line.');
        setParsedRows([]);
        return;
      }

      // Simple CSV line splitter that handles quotes
      const splitCSVLine = (line) => {
        const result = [];
        let curr = '';
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          if (char === '"' || char === "'") {
            inQuotes = !inQuotes;
          } else if ((char === ',' || char === ';') && !inQuotes) {
            result.push(curr.trim());
            curr = '';
          } else {
            curr += char;
          }
        }
        result.push(curr.trim());
        return result;
      };

      const rawHeaders = splitCSVLine(lines[0]).map((h) => h.toLowerCase().replace(/[^a-z0-9]/g, ''));
      
      const findHeaderIndex = (...possibleNames) => {
        for (const name of possibleNames) {
          const idx = rawHeaders.findIndex((h) => h.includes(name));
          if (idx !== -1) return idx;
        }
        return -1;
      };

      const empIdIdx = findHeaderIndex('employeeid', 'empid', 'id', 'code');
      const empNameIdx = findHeaderIndex('employeename', 'name', 'employee');
      const companyIdx = findHeaderIndex('companyname', 'company', 'client');
      const siteIdx = findHeaderIndex('site', 'location');
      const deptIdx = findHeaderIndex('department', 'dept');
      const dateIdx = findHeaderIndex('date', 'day');
      const checkInIdx = findHeaderIndex('checkin', 'in', 'intime');
      const checkOutIdx = findHeaderIndex('checkout', 'out', 'outtime');
      const hoursIdx = findHeaderIndex('workinghours', 'hours', 'totalhours');
      const statusIdx = findHeaderIndex('status');

      const rows = [];

      for (let i = 1; i < lines.length; i++) {
        const cols = splitCSVLine(lines[i]);
        if (cols.length === 0 || cols.every((c) => !c)) continue;

        const empId = (empIdIdx !== -1 ? cols[empIdIdx] : cols[0]) || `EMP${String(i).padStart(3, '0')}`;
        const empName = (empNameIdx !== -1 ? cols[empNameIdx] : cols[1]) || 'Employee Name';
        const companyName = (companyIdx !== -1 ? cols[companyIdx] : '') || activeCompanyName;
        const site = (siteIdx !== -1 ? cols[siteIdx] : '') || 'Main Site';
        const department = (deptIdx !== -1 ? cols[deptIdx] : '') || 'Security';
        
        let rowDate = (dateIdx !== -1 ? cols[dateIdx] : '') || defaultDate;
        // If rowDate does not have year, prepend year from targetMonth
        if (rowDate && !rowDate.includes('-')) {
          rowDate = defaultDate;
        }

        const checkIn = (checkInIdx !== -1 ? cols[checkInIdx] : '') || '';
        const checkOut = (checkOutIdx !== -1 ? cols[checkOutIdx] : '') || '';
        
        let rawStatus = (statusIdx !== -1 ? cols[statusIdx] : '').toLowerCase() || '';
        let status = 'present';
        if (rawStatus.includes('absent')) status = 'absent';
        else if (rawStatus.includes('half')) status = 'halfDay';
        else if (rawStatus.includes('leave')) status = 'onLeave';
        else if (rawStatus.includes('late') || rawStatus.includes('early')) status = 'late';
        else if (!checkIn && !checkOut) status = 'absent';

        const workingHours = (hoursIdx !== -1 && cols[hoursIdx]) ? cols[hoursIdx] : (status === 'absent' ? '0h 00m' : calculateHours(checkIn, checkOut));

        const initials = empName
          .split(' ')
          .map((n) => n[0])
          .join('')
          .substring(0, 2)
          .toUpperCase() || 'EM';

        rows.push({
          id: `ATT-IMP-${Date.now()}-${i}`,
          employeeId: empId,
          employeeName: empName,
          initials,
          companyName,
          companyId: 'comp-1',
          site,
          department,
          date: rowDate,
          checkIn: checkIn || null,
          checkOut: checkOut || null,
          workingHours,
          status,
          lateMinutes: status === 'late' ? 15 : 0,
          earlyOutMinutes: 0
        });
      }

      if (rows.length === 0) {
        setParseError('No valid employee records could be parsed from the file.');
      }

      setParsedRows(rows);
    } catch (err) {
      console.error('CSV Parsing Error:', err);
      setParseError('Failed to parse CSV file. Please check that the file is properly formatted.');
      setParsedRows([]);
    }
  };

  // Handle File Selection
  const handleFileChange = (e) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    if (!selected.name.endsWith('.csv') && selected.type !== 'text/csv') {
      setParseError('Please upload a valid CSV (.csv) file.');
      return;
    }

    setFile(selected);
    const reader = new FileReader();
    reader.onload = (event) => {
      parseCSV(event.target.result);
    };
    reader.readAsText(selected);
  };

  // Drag & Drop
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
      if (!dropped.name.endsWith('.csv') && dropped.type !== 'text/csv') {
        setParseError('Please drop a valid .csv file.');
        return;
      }
      setFile(dropped);
      const reader = new FileReader();
      reader.onload = (event) => {
        parseCSV(event.target.result);
      };
      reader.readAsText(dropped);
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
    onImport({
      month: targetMonth,
      date: defaultDate,
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
              <p className={styles.sub}>Bulk upload monthly or daily attendance from CSV</p>
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

          {/* Sample CSV Template Downloader */}
          <div className={styles.templateDownloadCard}>
            <div className={styles.templateInfo}>
              <FileText size={18} />
              <span>Need the standard CSV format with all table columns?</span>
            </div>
            <button
              type="button"
              className={styles.downloadBtn}
              onClick={handleDownloadSample}
            >
              <Download size={14} />
              Download Sample CSV Template
            </button>
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
                accept=".csv"
                style={{ display: 'none' }}
                onChange={handleFileChange}
              />
              <UploadCloud className={styles.dropzoneIcon} />
              <div className={styles.dropzoneTitle}>Click to upload or drag & drop CSV file</div>
              <div className={styles.dropzoneDesc}>Supports standard CSV (.csv) format with column headers</div>
            </div>
          ) : (
            <div className={styles.fileActiveBar}>
              <div className={styles.fileDetails}>
                <FileSpreadsheet size={22} color="#2563eb" />
                <div>
                  <div className={styles.fileName}>{file.name}</div>
                  <div className={styles.fileMeta}>
                    {(file.size / 1024).toFixed(1)} KB &bull; {parsedRows.length} rows parsed
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
                      <th>Company / Client</th>
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
