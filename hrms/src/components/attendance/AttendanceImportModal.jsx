import React, { useState, useRef } from 'react';
import { X, UploadCloud, FileSpreadsheet, Download, CheckCircle, AlertTriangle, FileText, Info } from 'lucide-react';
import * as XLSX from 'xlsx';
import { getDaysInMonth } from './AttendanceCorrectionModal';
import styles from './AttendanceImportModal.module.css';

/**
 * AttendanceImportModal
 * Supports uploading both Excel (.xlsx, .xls) and CSV (.csv) files.
 * Provides sample template download with required columns:
 * EMPID, EMPLOYEE NAME, FATHER NAME, MONTH, YEAR, PRESENT, WEEK OFF, HOLIDAYS, CL, SL, EL
 * (CL = Casual Leave, SL = Sick Leave, EL = Earn Leave)
 */
function AttendanceImportModal({ isOpen, onClose, onImport, activeCompanyName = '', activeCompanyId = '', currentDate }) {
  if (!isOpen) return null;

  const defaultMonth = new Date().toISOString().slice(0, 7);
  const todayDate = new Date().toISOString().split('T')[0];
  const currentYear = new Date().getFullYear();
  const currentMonthName = new Intl.DateTimeFormat('en-US', { month: 'long' }).format(new Date());

  const [targetMonth, setTargetMonth] = useState(defaultMonth);
  const [defaultDate, setDefaultDate] = useState(currentDate || todayDate);
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

  // Standardize time format: e.g. "09:05AM" -> "09:05 AM"
  const normalizeTime = (val) => {
    if (!val && val !== 0) return '';

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

    const matchAmpm = str.match(/^(\d{1,2}):(\d{2})\s*(AM|PM|am|pm)$/i);
    if (matchAmpm) {
      const h = String(matchAmpm[1]).padStart(2, '0');
      const m = matchAmpm[2];
      const p = matchAmpm[3].toUpperCase();
      return `${h}:${m} ${p}`;
    }

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

  // Convert month name to two digit number
  const getMonthNum = (monthStr) => {
    if (!monthStr) return targetMonth.split('-')[1] || '01';
    const clean = String(monthStr).trim().toLowerCase();
    const months = {
      jan: '01', january: '01',
      feb: '02', february: '02',
      mar: '03', march: '03',
      apr: '04', april: '04',
      may: '05',
      jun: '06', june: '06',
      jul: '07', july: '07',
      aug: '08', august: '08',
      sep: '09', sept: '09', september: '09',
      oct: '10', october: '10',
      nov: '11', november: '11',
      dec: '12', december: '12'
    };
    if (months[clean]) return months[clean];
    const num = parseInt(clean, 10);
    if (!isNaN(num) && num >= 1 && num <= 12) {
      return String(num).padStart(2, '0');
    }
    return targetMonth.split('-')[1] || '01';
  };

  // Download Sample Template as genuine Excel (.xlsx) with exact requested columns only (no sample data)
  const handleDownloadExcelSample = () => {
    const headers = [
      [
        'EMPID',
        'EMPLOYEE NAME',
        'FATHER NAME',
        'MONTH',
        'YEAR',
        'PRESENT',
        'WEEK OFF',
        'HOLIDAYS',
        'CL',
        'SL',
        'EL',
        'LWP'
      ]
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(headers);
    // Set column widths for clean readability
    worksheet['!cols'] = [
      { wch: 14 }, // EMPID
      { wch: 22 }, // EMPLOYEE NAME
      { wch: 22 }, // FATHER NAME
      { wch: 14 }, // MONTH
      { wch: 10 }, // YEAR
      { wch: 12 }, // PRESENT
      { wch: 12 }, // WEEK OFF
      { wch: 12 }, // HOLIDAYS
      { wch: 8 },  // CL
      { wch: 8 },  // SL
      { wch: 8 },  // EL
      { wch: 8 }   // LWP
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Attendance');
    XLSX.writeFile(workbook, `Attendance_Template_${targetMonth}.xlsx`);
  };

  // Download Sample Template as CSV (.csv) with exact requested columns only (no sample data)
  const handleDownloadCsvSample = () => {
    const csvContent = 'EMPID,EMPLOYEE NAME,FATHER NAME,MONTH,YEAR,PRESENT,WEEK OFF,HOLIDAYS,CL,SL,EL,LWP\n';

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
    const normalizeHeader = (h) => String(h || '').toLowerCase().replace(/[^a-z0-9]/g, '');

    const findKey = (possibleNames) => {
      const normalizedPossibles = possibleNames.map(p => normalizeHeader(p));

      // 1. Pass 1: Exact match on normalized header names
      const exactMatch = headers.find(h => {
        const norm = normalizeHeader(h);
        return normalizedPossibles.includes(norm);
      });
      if (exactMatch) return exactMatch;

      // 2. Pass 2: Safe substring matching (only for aliases with length >= 3 to avoid collision like 'p' or 'id')
      return headers.find(h => {
        const norm = normalizeHeader(h);
        return normalizedPossibles.some(p => p.length >= 3 && (norm.startsWith(p) || norm.endsWith(p) || norm.includes(p)));
      });
    };

    // Requested fields mapping
    const empIdKey = findKey(['empid', 'employeeid', 'empcode', 'employeecode', 'employee_id', 'emp_id']);
    const empNameKey = findKey(['employeename', 'employee_name', 'empname', 'emp_name', 'name', 'employee']);
    const fatherNameKey = findKey(['fathername', 'father_name', 'fathersname', 'father', 'guardian']);
    const monthKey = findKey(['month', 'monthname', 'salarymonth', 'attmonth']);
    const yearKey = findKey(['year', 'salaryyear', 'attyear']);
    const presentKey = findKey(['present', 'presentdays', 'present_days', 'totalpresent', 'p_days', 'pdays']);
    const weekOffKey = findKey(['weekoff', 'week_off', 'wo', 'weeklyoff', 'weekly_off']);
    const holidaysKey = findKey(['holidays', 'holiday', 'publicholidays', 'public_holidays', 'hl', 'ph']);
    const clKey = findKey(['cl', 'casualleave', 'casual_leave', 'casual']);
    const slKey = findKey(['sl', 'sickleave', 'sick_leave', 'sick']);
    const elKey = findKey(['el', 'earnleave', 'earnedleave', 'earn_leave', 'pl', 'paidleave']);
    const lwpKey = findKey(['lwp', 'leavewithoutpay', 'leave_without_pay', 'lop', 'lossofpay', 'unpaid', 'unpaidleave']);

    // Legacy optional fields mapping
    const companyKey = findKey(['companyname', 'company_name', 'clientname', 'client_name', 'client', 'company']);
    const siteKey = findKey(['site', 'location', 'branch']);
    const deptKey = findKey(['department', 'dept']);
    const dateKey = findKey(['date', 'attendancedate', 'attendance_date', 'day']);
    const checkInKey = findKey(['checkin', 'check_in', 'intime', 'in_time']);
    const checkOutKey = findKey(['checkout', 'check_out', 'outtime', 'out_time']);
    const hoursKey = findKey(['workinghours', 'working_hours', 'totalhours', 'total_hours', 'hours']);
    const statusKey = findKey(['status', 'attendancestatus']);

    const parseNum = (val, fallback = 0) => {
      if (val === undefined || val === null || val === '') return fallback;
      const n = Number(String(val).trim());
      return isNaN(n) ? fallback : n;
    };

    const formattedRows = [];

    rawRows.forEach((row, i) => {
      const empId = (empIdKey ? row[empIdKey] : row[headers[0]]) || `EMP${String(i + 1).padStart(3, '0')}`;
      const empName = (empNameKey ? row[empNameKey] : row[headers[1]]) || 'Employee';
      const fatherName = fatherNameKey && row[fatherNameKey] !== undefined ? String(row[fatherNameKey]).trim() : '';
      
      const parsedMonthStr = monthKey && row[monthKey] !== undefined ? String(row[monthKey]).trim() : (targetMonth ? targetMonth.split('-')[1] : currentMonthName);
      const parsedYearStr = yearKey && row[yearKey] !== undefined ? String(row[yearKey]).trim() : (targetMonth ? targetMonth.split('-')[0] : String(currentYear));

      const present = parseNum(presentKey ? row[presentKey] : undefined, 0);
      const weekOff = parseNum(weekOffKey ? row[weekOffKey] : undefined, 0);
      const holidays = parseNum(holidaysKey ? row[holidaysKey] : undefined, 0);
      const cl = parseNum(clKey ? row[clKey] : undefined, 0);
      const sl = parseNum(slKey ? row[slKey] : undefined, 0);
      const el = parseNum(elKey ? row[elKey] : undefined, 0);
      const lwp = parseNum(lwpKey ? row[lwpKey] : undefined, 0);

      const totalPaidDays = present + weekOff + holidays + cl + sl + el;
      const workingDays = parsedMonthStr ? getDaysInMonth(parsedMonthStr, parsedYearStr) : totalPaidDays;

      const companyName = (companyKey ? row[companyKey] : '') || activeCompanyName || 'RR Security';
      const site = (siteKey ? row[siteKey] : '') || 'Main Site';
      const department = (deptKey ? row[deptKey] : '') || 'Security';

      // Determine standard date
      let rowDate = defaultDate;
      if (dateKey && row[dateKey]) {
        rowDate = normalizeDate(row[dateKey]);
      } else if (parsedYearStr && parsedMonthStr) {
        const mNum = getMonthNum(parsedMonthStr);
        rowDate = `${parsedYearStr}-${mNum}-01`;
      }

      const checkIn = normalizeTime(checkInKey ? row[checkInKey] : '');
      const checkOut = normalizeTime(checkOutKey ? row[checkOutKey] : '');

      let rawStatus = String(statusKey && row[statusKey] !== undefined ? row[statusKey] : '').toLowerCase();
      let status = 'present';
      if (rawStatus.includes('absent')) status = 'absent';
      else if (rawStatus.includes('half')) status = 'halfDay';
      else if (rawStatus.includes('leave')) status = 'onLeave';
      else if (rawStatus.includes('late')) status = 'late';
      else if (present === 0 && (cl > 0 || sl > 0 || el > 0)) status = 'onLeave';

      const workingHours = hoursKey && row[hoursKey] 
        ? String(row[hoursKey]) 
        : (present > 0 ? `${present} days` : '8h 00m');

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
        fatherName: String(fatherName).trim(),
        month: parsedMonthStr,
        year: parsedYearStr ? Number(parsedYearStr) : currentYear,
        present,
        weekOff,
        holidays,
        cl,
        sl,
        el,
        lwp,
        totalPaidDays,
        workingDays,
        initials,
        companyName: String(companyName).trim(),
        companyId: activeCompanyId,
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

    const firstDate = parsedRows[0]?.date || defaultDate;

    onImport({
      month: targetMonth,
      date: firstDate,
      records: parsedRows
    });
  };

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={styles.modal}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <div className={styles.headerIcon}>
              <UploadCloud size={22} />
            </div>
            <div>
              <h3 className={styles.title}>Import Attendance Records</h3>
              <p className={styles.sub}>
                Upload monthly or daily attendance from Excel (.xlsx/.xls) or CSV
              </p>
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
              <FileText size={20} style={{ flexShrink: 0 }} />
              <div>
                <div style={{ fontWeight: 700, fontSize: 13, color: '#166534' }}>
                  Download Sample Format
                </div>
                <div style={{ fontSize: 12, color: '#15803d' }}>
                  Download sample attendance template file in Excel or CSV format
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', flexShrink: 0 }}>
              <button
                type="button"
                className={styles.downloadBtn}
                onClick={handleDownloadExcelSample}
                title="Download Excel Template (.xlsx)"
              >
                <Download size={14} />
                Download Excel (.xlsx)
              </button>
              <button
                type="button"
                className={styles.downloadBtn}
                onClick={handleDownloadCsvSample}
                title="Download CSV Template (.csv)"
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
              <div className={styles.dropzoneDesc}>
                Supports Microsoft Excel (.xlsx, .xls) and CSV (.csv) formats
              </div>
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

          {/* Preview Table with Explicit Requested Columns */}
          {parsedRows.length > 0 && (
            <div className={styles.previewContainer}>
              <div className={styles.previewHeader}>
                <span className={styles.previewTitle}>
                  Parsed Records Preview ({parsedRows.length} Employees)
                </span>
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
                      <th>EMPID</th>
                      <th>EMPLOYEE NAME</th>
                      <th>FATHER NAME</th>
                      <th>MONTH</th>
                      <th>YEAR</th>
                      <th style={{ color: '#16a34a' }}>PRESENT</th>
                      <th style={{ color: '#2563eb' }}>WEEK OFF</th>
                      <th style={{ color: '#d97706' }}>HOLIDAYS</th>
                      <th style={{ color: '#7c3aed' }} title="Casual Leave">CL</th>
                      <th style={{ color: '#0284c7' }} title="Sick Leave">SL</th>
                      <th style={{ color: '#0d9488' }} title="Earn Leave">EL</th>
                      <th style={{ color: '#dc2626' }} title="Leave Without Pay">LWP</th>
                      <th style={{ fontWeight: 700 }}>WORKING DAYS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedRows.map((row, idx) => (
                      <tr key={row.id || idx}>
                        <td style={{ color: '#94a3b8' }}>{idx + 1}</td>
                        <td style={{ fontWeight: 700, color: '#0f172a' }}>{row.employeeId}</td>
                        <td style={{ fontWeight: 600 }}>{row.employeeName}</td>
                        <td>{row.fatherName || '—'}</td>
                        <td>{row.month || '—'}</td>
                        <td>{row.year || '—'}</td>
                        <td style={{ fontWeight: 600, color: '#15803d' }}>{row.present}</td>
                        <td style={{ color: '#1d4ed8' }}>{row.weekOff}</td>
                        <td style={{ color: '#b45309' }}>{row.holidays}</td>
                        <td style={{ color: '#6d28d9', fontWeight: 600 }}>{row.cl}</td>
                        <td style={{ color: '#0369a1', fontWeight: 600 }}>{row.sl}</td>
                        <td style={{ color: '#0f766e', fontWeight: 600 }}>{row.el}</td>
                        <td style={{ color: '#dc2626', fontWeight: 600 }}>{row.lwp}</td>
                        <td>
                          <span className={styles.badgePaidDays}>
                            {row.workingDays || row.totalPaidDays} Days
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

