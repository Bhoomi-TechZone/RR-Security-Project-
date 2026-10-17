import React, { useState, useRef } from 'react';
import {
  X,
  UploadCloud,
  FileSpreadsheet,
  Download,
  CheckCircle,
  AlertTriangle,
  FileText,
  Users,
  AlertCircle
} from 'lucide-react';
import * as XLSX from 'xlsx';
import employeeService from '../../services/employeeService';
import styles from './EmployeeImportModal.module.css';

/**
 * EmployeeImportModal
 * Supports bulk importing employees via Excel (.xlsx, .xls) and CSV (.csv).
 * Sample template strictly provides the 6 requested fields:
 * EMPID, EMPLOYEE NAME, GENDER, DOB, MOBILE, EMAIL
 */
function EmployeeImportModal({
  isOpen,
  onClose,
  onImportSuccess,
  activeCompanyId,
  activeCompanyName = '',
  employeeCodeSeries = null,
  clients = [],
  departments = [],
  designations = []
}) {
  if (!isOpen) return null;

  const [file, setFile] = useState(null);
  const [parsedRows, setParsedRows] = useState([]);
  const [parseError, setParseError] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Optional default assignment overrides for batch
  const [selectedClient, setSelectedClient] = useState('');
  const [selectedDept, setSelectedDept] = useState('Security');
  const [selectedDesignation, setSelectedDesignation] = useState('Security Guard');

  const fileInputRef = useRef(null);

  // Normalize any date value (Excel serial or string) to YYYY-MM-DD
  const normalizeDate = (val) => {
    if (!val && val !== 0) return '';

    // If already a JS Date object
    if (val instanceof Date) {
      if (!isNaN(val.getTime())) {
        return val.toISOString().split('T')[0];
      }
    }

    // If it's an Excel numeric date serial
    if (typeof val === 'number') {
      try {
        const dateObj = new Date(Math.round((val - 25569) * 86400 * 1000));
        if (!isNaN(dateObj.getTime())) {
          return dateObj.toISOString().split('T')[0];
        }
      } catch {
        // fallback
      }
    }

    const str = String(val).trim();
    if (!str) return '';

    // Format: YYYY-MM-DD or YYYY/MM/DD
    if (/^\d{4}[-/]\d{1,2}[-/]\d{1,2}$/.test(str)) {
      const [y, m, d] = str.split(/[-/]/);
      return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    }

    // Format: DD-MM-YYYY or DD/MM/YYYY
    if (/^\d{1,2}[-/]\d{1,2}[-/]\d{4}$/.test(str)) {
      const [d, m, y] = str.split(/[-/]/);
      return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    }

    return str;
  };

  // Clean and format mobile number
  const normalizeMobile = (val) => {
    if (!val && val !== 0) return '';
    const clean = String(val).replace(/[^0-9]/g, '');
    return clean;
  };

  // Clean gender
  const normalizeGender = (val) => {
    if (!val) return 'Male';
    const clean = String(val).trim().toLowerCase();
    if (clean.startsWith('f')) return 'Female';
    if (clean.startsWith('m')) return 'Male';
    if (clean.startsWith('o')) return 'Other';
    return 'Male';
  };

  // Format employee ID according to company employee code series rules (e.g. RR005 -> RR-005, 5 -> RR-005)
  const formatEmpIdWithSeries = (rawId) => {
    if (!rawId || String(rawId).trim().toLowerCase() === 'auto-generate') {
      return '';
    }
    const series = employeeCodeSeries || {};
    const prefix = (series.prefix || 'RR').trim().toUpperCase();
    const separator = series.separator !== undefined ? series.separator : '-';
    const padding = Number(series.padding) || 3;
    const yearFormat = series.yearFormat;
    const monthFormat = series.monthFormat;

    const str = String(rawId).trim();

    // Pure digits e.g. "5", "05", "005"
    if (/^\d+$/.test(str)) {
      const numPadded = str.padStart(padding, '0');
      const parts = [prefix];
      if (yearFormat === 'YYYY') parts.push(String(new Date().getFullYear()));
      else if (yearFormat === 'YY') parts.push(String(new Date().getFullYear()).slice(-2));
      if (monthFormat === 'MM') parts.push(String(new Date().getMonth() + 1).padStart(2, '0'));
      parts.push(numPadded);
      return parts.join(separator);
    }

    // Prefix + optional separator(s)/spaces + digits e.g. "RR005", "RR-005", "RR 5", "rr006"
    const match = str.match(/^([A-Za-z]+)?[-_/\s]*(\d+)$/);
    if (match) {
      const matchedPrefix = match[1] ? match[1].toUpperCase() : prefix;
      const matchedDigits = match[2];
      const numPadded = matchedDigits.padStart(padding, '0');
      const finalPrefix = (matchedPrefix === prefix || matchedPrefix === 'EMP' || matchedPrefix === 'RR') ? prefix : matchedPrefix;

      const parts = [finalPrefix];
      if (yearFormat === 'YYYY') parts.push(String(new Date().getFullYear()));
      else if (yearFormat === 'YY') parts.push(String(new Date().getFullYear()).slice(-2));
      if (monthFormat === 'MM') parts.push(String(new Date().getMonth() + 1).padStart(2, '0'));
      parts.push(numPadded);
      return parts.join(separator);
    }

    return str;
  };

  // 1. Download Sample Excel (.xlsx) with only the field names (no sample data)
  const handleDownloadExcelSample = () => {
    const headers = [
      ['EMPID', 'EMPLOYEE NAME', 'GENDER', 'DOB', 'MOBILE', 'EMAIL']
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(headers);
    worksheet['!cols'] = [
      { wch: 14 }, // EMPID
      { wch: 24 }, // EMPLOYEE NAME
      { wch: 12 }, // GENDER
      { wch: 14 }, // DOB
      { wch: 16 }, // MOBILE
      { wch: 28 }, // EMAIL
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Employees');
    XLSX.writeFile(workbook, 'Employee_Import_Sample.xlsx');
  };

  // 2. Download Sample CSV (.csv) with only the field names (no sample data)
  const handleDownloadCsvSample = () => {
    const csvContent = 'EMPID,EMPLOYEE NAME,GENDER,DOB,MOBILE,EMAIL\n';

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'Employee_Import_Sample.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Process rows extracted from XLSX / CSV
  const processFileData = (rawRows) => {
    setParseError('');
    if (!rawRows || rawRows.length === 0) {
      setParseError('The uploaded file contains no data rows.');
      setParsedRows([]);
      return;
    }

    const headers = Object.keys(rawRows[0] || {});
    const normalizeHeader = (h) => String(h || '').toLowerCase().replace(/[^a-z0-9]/g, '');

    const findKey = (possibleNames) => {
      const normalizedPossibles = possibleNames.map(p => normalizeHeader(p));
      const exactMatch = headers.find(h => normalizedPossibles.includes(normalizeHeader(h)));
      if (exactMatch) return exactMatch;

      return headers.find(h => {
        const norm = normalizeHeader(h);
        return normalizedPossibles.some(p => p.length >= 3 && (norm.startsWith(p) || norm.endsWith(p) || norm.includes(p)));
      });
    };

    // Keys mapping for requested 6 fields
    const empIdKey = findKey(['empid', 'emp_id', 'employeeid', 'employee_id', 'empcode', 'employeecode', 'code']);
    const empNameKey = findKey(['employeename', 'employee_name', 'empname', 'emp_name', 'name', 'fullname']);
    const genderKey = findKey(['gender', 'sex']);
    const dobKey = findKey(['dob', 'dateofbirth', 'date_of_birth', 'birthdate']);
    const mobileKey = findKey(['mobile', 'contact', 'phonenumber', 'phone_number', 'phone', 'cell']);
    const emailKey = findKey(['email', 'emailaddress', 'email_id', 'mail']);

    const formattedRows = [];

    rawRows.forEach((row, i) => {
      const rawEmpId = empIdKey && row[empIdKey] !== undefined ? String(row[empIdKey]).trim() : '';
      const formattedEmpId = formatEmpIdWithSeries(rawEmpId);
      const rawName = empNameKey && row[empNameKey] !== undefined ? String(row[empNameKey]).trim() : '';
      const rawGender = genderKey && row[genderKey] !== undefined ? normalizeGender(row[genderKey]) : 'Male';
      const rawDob = dobKey && row[dobKey] !== undefined ? normalizeDate(row[dobKey]) : '';
      const rawMobile = mobileKey && row[mobileKey] !== undefined ? normalizeMobile(row[mobileKey]) : '';
      const rawEmail = emailKey && row[emailKey] !== undefined ? String(row[emailKey]).trim().toLowerCase() : '';

      // Skip completely blank rows
      if (!rawEmpId && !rawName && !rawDob && !rawMobile && !rawEmail) {
        return;
      }

      const isValid = Boolean(rawName);

      formattedRows.push({
        id: i + 1,
        empid: formattedEmpId || rawEmpId || `Auto-generate`,
        rawEmpId,
        name: rawName,
        gender: rawGender,
        dob: rawDob,
        mobile: rawMobile,
        email: rawEmail,
        isValid,
        error: !rawName ? 'Employee Name missing' : ''
      });
    });

    if (formattedRows.length === 0) {
      setParseError('No valid employee records could be identified from the uploaded file.');
    }

    setParsedRows(formattedRows);
  };

  // Handle uploaded file
  const handleFile = (uploadedFile) => {
    if (!uploadedFile) return;

    const fileExt = uploadedFile.name.split('.').pop().toLowerCase();
    if (!['xlsx', 'xls', 'csv'].includes(fileExt)) {
      setParseError('Unsupported file type. Please upload an Excel (.xlsx, .xls) or CSV (.csv) file.');
      return;
    }

    setFile(uploadedFile);

    const reader = new FileReader();

    if (fileExt === 'csv') {
      reader.onload = (e) => {
        try {
          const text = e.target.result;
          const workbook = XLSX.read(text, { type: 'string' });
          const firstSheet = workbook.SheetNames[0];
          const rawData = XLSX.utils.sheet_to_json(workbook.Sheets[firstSheet], { defval: '' });
          processFileData(rawData);
        } catch (err) {
          console.error('Error parsing CSV:', err);
          setParseError('Failed to parse the CSV file. Please ensure valid comma-separated format.');
        }
      };
      reader.readAsText(uploadedFile);
    } else {
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array', cellDates: true });
          const firstSheet = workbook.SheetNames[0];
          const rawData = XLSX.utils.sheet_to_json(workbook.Sheets[firstSheet], { defval: '' });
          processFileData(rawData);
        } catch (err) {
          console.error('Error parsing Excel:', err);
          setParseError('Failed to parse the Excel workbook. Please check file structure.');
        }
      };
      reader.readAsArrayBuffer(uploadedFile);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleResetFile = () => {
    setFile(null);
    setParsedRows([]);
    setParseError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Submit bulk import to backend
  const handleSubmit = async () => {
    const validRows = parsedRows.filter(r => r.isValid);
    if (validRows.length === 0) {
      setParseError('There are no valid employee rows to import.');
      return;
    }

    setIsSubmitting(true);
    setParseError('');

    try {
      const selectedClientObj = clients.find(c => c.clientId === selectedClient || c._id === selectedClient);
      const clientName = selectedClientObj ? (selectedClientObj.clientName || selectedClientObj.name) : '';

      const recordsPayload = validRows.map(r => ({
        employeeId: r.empid !== 'Auto-generate' ? r.empid : '',
        name: r.name,
        gender: r.gender,
        dob: r.dob,
        mobile: r.mobile,
        email: r.email,
        clientId: selectedClient || '',
        clientName: clientName || '',
        department: selectedDept || 'Security',
        designation: selectedDesignation || 'Security Guard',
      }));

      const res = await employeeService.bulkImportEmployees(activeCompanyId, recordsPayload, {
        defaultClientId: selectedClient || '',
        defaultClientName: clientName || '',
        defaultDepartment: selectedDept || 'Security',
        defaultDesignation: selectedDesignation || 'Security Guard'
      });

      if (onImportSuccess) {
        onImportSuccess(res);
      }
      onClose();
    } catch (err) {
      console.error('Import error:', err);
      setParseError(err.message || 'Failed to complete employee import.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const validCount = parsedRows.filter(r => r.isValid).length;
  const invalidCount = parsedRows.length - validCount;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <div className={styles.headerIcon}>
              <Users size={22} />
            </div>
            <div>
              <h2 className={styles.title}>Bulk Import Employees</h2>
              <p className={styles.sub}>
                Import employee master records for {activeCompanyName || 'Company Profile'}.
              </p>
            </div>
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close modal">
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className={styles.body}>
          {/* Sample Template Card */}
          <div className={styles.templateCard}>
            <div className={styles.templateInfo}>
              <FileSpreadsheet size={24} className={styles.templateIcon} />
              <div>
                <h4 className={styles.templateTitle}>Download Sample Spreadsheet Template</h4>
                <p className={styles.templateDesc}>
                  Your file must include these 6 exact column headers:
                </p>
                <div className={styles.templateFields}>
                  <span className={styles.fieldChip}>EMPID</span>
                  <span className={styles.fieldChip}>EMPLOYEE NAME</span>
                  <span className={styles.fieldChip}>GENDER</span>
                  <span className={styles.fieldChip}>DOB</span>
                  <span className={styles.fieldChip}>MOBILE</span>
                  <span className={styles.fieldChip}>EMAIL</span>
                </div>
              </div>
            </div>
            <div className={styles.templateActions}>
              <button
                type="button"
                className={styles.downloadBtn}
                onClick={handleDownloadExcelSample}
                title="Download Excel template (.xlsx)"
              >
                <Download size={14} />
                <span>Excel (.xlsx)</span>
              </button>
              <button
                type="button"
                className={styles.downloadBtn}
                onClick={handleDownloadCsvSample}
                title="Download CSV template (.csv)"
              >
                <Download size={14} />
                <span>CSV (.csv)</span>
              </button>
            </div>
          </div>

          {/* Optional Default Assignment Defaults */}
          <div className={styles.defaultsGrid}>
            <div className={styles.fieldGroup}>
              <label className={styles.label}>Assign to Client (Optional)</label>
              <select
                className={styles.select}
                value={selectedClient}
                onChange={(e) => setSelectedClient(e.target.value)}
              >
                <option value="">-- No Client (Internal/Unassigned) --</option>
                {clients.map((c) => (
                  <option key={c.clientId || c._id} value={c.clientId || c._id}>
                    {c.clientName || c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.label}>Default Department</label>
              <select
                className={styles.select}
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
              >
                {departments && departments.length > 0 ? (
                  departments.map((d) => (
                    <option key={d.name || d} value={d.name || d}>
                      {d.name || d}
                    </option>
                  ))
                ) : (
                  <>
                    <option value="Security">Security</option>
                    <option value="Worker">Worker</option>
                    <option value="Office Staff">Office Staff</option>
                    <option value="Operations">Operations</option>
                  </>
                )}
              </select>
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.label}>Default Designation</label>
              <select
                className={styles.select}
                value={selectedDesignation}
                onChange={(e) => setSelectedDesignation(e.target.value)}
              >
                {designations && designations.length > 0 ? (
                  designations.map((d) => (
                    <option key={d.name || d} value={d.name || d}>
                      {d.name || d}
                    </option>
                  ))
                ) : (
                  <>
                    <option value="Security Guard">Security Guard</option>
                    <option value="Security Supervisor">Security Supervisor</option>
                    <option value="Helper">Helper</option>
                    <option value="Office Asst">Office Asst</option>
                  </>
                )}
              </select>
            </div>
          </div>

          {/* Dropzone or Loaded File Status */}
          {!file ? (
            <div
              className={`${styles.dropzone} ${isDragging ? styles.dropzoneActive : ''}`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls, .csv"
                style={{ display: 'none' }}
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFile(e.target.files[0]);
                  }
                }}
              />
              <div className={styles.dropzoneIcon}>
                <UploadCloud size={26} />
              </div>
              <p className={styles.dropzonePrompt}>
                Drag & drop Excel or CSV file here, or <span>browse file</span>
              </p>
              <p className={styles.dropzoneSub}>Supports .xlsx, .xls, and .csv files</p>
            </div>
          ) : (
            <div className={styles.fileLoadedCard}>
              <div className={styles.fileLoadedInfo}>
                <FileText size={22} className={styles.fileLoadedIcon} />
                <div>
                  <h5 className={styles.fileName}>{file.name}</h5>
                  <p className={styles.fileMeta}>
                    {(file.size / 1024).toFixed(1)} KB &bull; {parsedRows.length} rows loaded
                  </p>
                </div>
              </div>
              <button
                type="button"
                className={styles.removeFileBtn}
                onClick={handleResetFile}
                disabled={isSubmitting}
              >
                Change File
              </button>
            </div>
          )}

          {/* Error Message */}
          {parseError && (
            <div className={styles.alertError}>
              <AlertCircle size={18} style={{ flexShrink: 0 }} />
              <span>{parseError}</span>
            </div>
          )}

          {/* Preview Table */}
          {parsedRows.length > 0 && (
            <div className={styles.previewSection}>
              <div className={styles.previewHeader}>
                <div className={styles.previewTitle}>
                  <span>Data Preview</span>
                  <span className={styles.badgeSuccess}>
                    {validCount} ready to import
                  </span>
                  {invalidCount > 0 && (
                    <span className={styles.badgeWarning}>
                      {invalidCount} missing required name
                    </span>
                  )}
                </div>
              </div>

              <div className={styles.tableContainer}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>EMPID</th>
                      <th>EMPLOYEE NAME</th>
                      <th>GENDER</th>
                      <th>DOB</th>
                      <th>MOBILE</th>
                      <th>EMAIL</th>
                      <th>STATUS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedRows.map((row) => (
                      <tr key={row.id}>
                        <td>{row.id}</td>
                        <td style={{ fontWeight: 600 }}>{row.empid}</td>
                        <td style={{ fontWeight: 600 }}>{row.name || <span style={{ color: '#dc2626' }}>[Missing]</span>}</td>
                        <td>{row.gender}</td>
                        <td>{row.dob || '-'}</td>
                        <td>{row.mobile || '-'}</td>
                        <td>{row.email || '-'}</td>
                        <td>
                          {row.isValid ? (
                            <span className={styles.statusReady}>
                              <CheckCircle size={13} />
                              Ready
                            </span>
                          ) : (
                            <span className={styles.statusMissing}>
                              <AlertTriangle size={13} />
                              {row.error}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className={styles.footer}>
          <button
            type="button"
            className={styles.cancelBtn}
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="button"
            className={styles.submitBtn}
            onClick={handleSubmit}
            disabled={isSubmitting || validCount === 0}
          >
            {isSubmitting ? (
              <>
                <div className={styles.spinner} />
                <span>Importing...</span>
              </>
            ) : (
              <>
                <UploadCloud size={16} />
                <span>Import {validCount > 0 ? `${validCount} Employees` : 'Employees'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default EmployeeImportModal;
