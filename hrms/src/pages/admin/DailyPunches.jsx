import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Building2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Download,
  Edit3,
  Fingerprint,
  Info,
  KeyRound,
  MapPin,
  MoreHorizontal,
  Plus,
  ScanFace,
  Search,
  Trash2,
  Upload,
  User,
  X
} from 'lucide-react';
import * as XLSX from 'xlsx';
import AdminLayout from '../../components/layout/AdminLayout';
import Toast from '../../components/common/Toast';
import { useCompany } from '../../context/CompanyContext';
import employeeService from '../../services/employeeService';
import { clientService } from '../../services/clientService';
import attendanceService from '../../services/attendanceService';
import {
  BIOMETRIC_DEVICES,
  BIOMETRIC_METHODS,
  DEFAULT_BIOMETRIC_DEPTS,
  generateSamplePunchLogs
} from '../../data/biometricAttendanceData';
import styles from './DailyPunches.module.css';

const PAGE_SIZE = 10;

const shiftIsoDate = (isoDate, delta) => {
  const [y, m, day] = String(isoDate || '').split('-').map(Number);
  if (!y || !m || !day) return isoDate;
  const d = new Date(y, m - 1, day + delta);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const formatMixedDate = (isoDate) => {
  if (!isoDate) return '—';
  const d = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(d.getTime())) return isoDate;
  const day = String(d.getDate()).padStart(2, '0');
  const mon = d.toLocaleString('en-US', { month: 'short' });
  const yr = d.getFullYear();
  return `${day}-${mon}-${yr}`;
};

const formatTime24Sec = (val) => {
  if (!val) return '';
  const s = String(val).trim();
  const ampm = s.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)$/i);
  if (ampm) {
    let hh = parseInt(ampm[1], 10);
    const mm = ampm[2];
    const ss = ampm[3] || '00';
    const mer = ampm[4].toUpperCase();
    if (mer === 'PM' && hh < 12) hh += 12;
    if (mer === 'AM' && hh === 12) hh = 0;
    return `${String(hh).padStart(2, '0')}:${mm}:${ss}`;
  }
  const hms = s.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (hms) {
    return `${hms[1].padStart(2, '0')}:${hms[2]}:${hms[3] || '00'}`;
  }
  return s;
};

const calcWorkDuration = (inTime, outTime) => {
  if (!inTime || !outTime) return '0:00';
  const toMin = (t) => {
    const clean = String(t).trim();
    const ampmMatch = clean.match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)$/i);
    if (ampmMatch) {
      let hh = parseInt(ampmMatch[1], 10);
      const mm = parseInt(ampmMatch[2], 10);
      const mer = ampmMatch[3].toUpperCase();
      if (mer === 'PM' && hh < 12) hh += 12;
      if (mer === 'AM' && hh === 12) hh = 0;
      return hh * 60 + mm;
    }
    const parts = clean.split(':');
    return (parseInt(parts[0], 10) || 0) * 60 + (parseInt(parts[1], 10) || 0);
  };
  const diff = Math.max(0, toMin(outTime) - toMin(inTime));
  const hrs = Math.floor(diff / 60);
  const mins = diff % 60;
  return `${hrs}:${String(mins).padStart(2, '0')}`;
};

export default function DailyPunches() {
  const location = useLocation();
  const isUserView = location.pathname.startsWith('/user');
  const { activeCompany } = useCompany();
  const companyId = activeCompany?.companyId || activeCompany?.id || 'RRS8392014SEC';

  const [employees, setEmployees] = useState([]);
  const [clients, setClients] = useState([]);
  const [punchLogs, setPunchLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters matching our Attendance module
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [clientFilter, setClientFilter] = useState('all');
  const [deptFilter, setDeptFilter] = useState('all');
  const [terminalFilter, setTerminalFilter] = useState('all');
  const [methodFilter, setMethodFilter] = useState('all');
  const [radioFilter, setRadioFilter] = useState('all'); // 'all' | 'late' | 'absent' | 'no_punches'
  const [empSearch, setEmpSearch] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');

  const [page, setPage] = useState(1);
  const [optionsOpen, setOptionsOpen] = useState(false);
  const optionsRef = useRef(null);

  // Add / View Punch Modals
  const [addModalRow, setAddModalRow] = useState(null);
  const [punchForm, setPunchForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    hh: '00',
    mm: '00',
    ss: '00',
    remarks: ''
  });
  const [viewModalRow, setViewModalRow] = useState(null);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploadPeriodDate, setUploadPeriodDate] = useState(() => new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadFormat, setUploadFormat] = useState('Excel Template');
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  useEffect(() => {
    const handleOutside = (e) => {
      if (optionsRef.current && !optionsRef.current.contains(e.target)) {
        setOptionsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [empList, clientList, attList] = await Promise.all([
        employeeService.getEmployees(companyId).catch(() => []),
        clientService.getClients(companyId).catch(() => []),
        attendanceService.getAttendanceRecords(companyId, { date: selectedDate }).catch(() => [])
      ]);
      const safeEmps = Array.isArray(empList) ? empList : [];
      const safeAtts = Array.isArray(attList) ? attList : [];
      setEmployees(safeEmps);
      setClients(Array.isArray(clientList) ? clientList : []);

      if (safeAtts.length > 0) {
        const mapped = [];
        safeAtts.forEach((rec, idx) => {
          const empCode = rec.employeeCode || rec.employeeId || '';
          const empName = rec.employeeName || rec.name || '';
          const method = rec.method || rec.punchMethod || (rec.isBiometric ? 'Fingerprint' : 'Manual');
          const dev = rec.deviceName || rec.terminal || 'Manual Entry';
          const isLate = String(rec.status || '').toLowerCase() === 'late' || Boolean(rec.isLate);
          const inT = rec.checkIn || rec.inTime || rec.punchIn;
          const outT = rec.checkOut || rec.outTime || rec.punchOut;

          if (inT) {
            mapped.push({
              id: `att-in-${rec._id || idx}`,
              empId: empCode,
              empName,
              direction: 'Check-In',
              time: formatTime24Sec(inT),
              method,
              deviceName: dev,
              client: rec.clientName || rec.client || '—',
              isLate
            });
          }
          if (outT) {
            mapped.push({
              id: `att-out-${rec._id || idx}`,
              empId: empCode,
              empName,
              direction: 'Check-Out',
              time: formatTime24Sec(outT),
              method,
              deviceName: dev,
              client: rec.clientName || rec.client || '—',
              isLate: false
            });
          }
        });
        setPunchLogs(mapped);
      } else {
        setPunchLogs(safeEmps.length > 0 ? [] : generateSamplePunchLogs(selectedDate));
      }
    } catch (err) {
      console.error('Failed to load daily punches:', err);
    } finally {
      setLoading(false);
    }
  }, [companyId, selectedDate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const departmentOptions = useMemo(() => {
    const set = new Set(DEFAULT_BIOMETRIC_DEPTS);
    employees.forEach((e) => {
      if (e.department) set.add(e.department);
    });
    return Array.from(set);
  }, [employees]);

  // Combine employees with their punches for the selected date
  const combinedRows = useMemo(() => {
    const baseEmployees =
      employees.length > 0
        ? employees.filter((e) => String(e.status || '').toLowerCase() !== 'inactive')
        : [
            { employeeId: 'RRS001', name: 'Bandna Rana', designation: 'HR Manager', department: 'Human Resources', clientName: 'Apex Security Corp' },
            { employeeId: 'RRS002', name: 'Shikha', designation: 'Manager', department: 'Marketing', clientName: 'Apex Security Corp' }
          ];

    return baseEmployees.map((emp) => {
      const code = emp.employeeCode || emp.employeeId || emp.code || '—';
      const empName = emp.name || emp.employeeName || 'Staff';
      const empPunches = punchLogs.filter(
        (p) =>
          String(p.empId || '').toLowerCase() === String(code).toLowerCase() ||
          String(p.empName || '').toLowerCase() === String(empName).toLowerCase()
      );

      const inPunch = empPunches.find((p) => p.direction === 'Check-In');
      const outPunch = [...empPunches].reverse().find((p) => p.direction === 'Check-Out');

      let attendanceCode = 'A';
      if (empPunches.length > 0) {
        attendanceCode = empPunches.some((p) => p.isLate) ? 'L' : 'P';
      }

      const workDuration =
        inPunch && outPunch ? calcWorkDuration(inPunch.time, outPunch.time) : '0:00';

      return {
        id: emp._id || code,
        employeeCode: code,
        employeeName: empName,
        designation: emp.designation || 'Staff',
        department: emp.department || 'Operations',
        client: emp.clientName || emp.client || empPunches[0]?.client || '—',
        shiftTime: emp.shiftTime || '09:00 AM - 06:00 PM',
        shiftDuration: '09:00',
        workDuration,
        punches: empPunches,
        attendanceCode
      };
    });
  }, [employees, punchLogs]);

  const filteredRows = useMemo(() => {
    const q = appliedSearch.trim().toLowerCase();
    return combinedRows.filter((row) => {
      if (clientFilter !== 'all' && row.client !== clientFilter) return false;
      if (deptFilter !== 'all' && row.department !== deptFilter) return false;
      if (terminalFilter !== 'all' && !row.punches.some((p) => p.deviceName === terminalFilter)) {
        return false;
      }
      if (methodFilter !== 'all' && !row.punches.some((p) => p.method === methodFilter)) {
        return false;
      }
      if (radioFilter === 'late' && row.attendanceCode !== 'L') return false;
      if (radioFilter === 'absent' && row.attendanceCode !== 'A') return false;
      if (radioFilter === 'no_punches' && row.punches.length > 0) return false;
      if (appliedSearch && appliedSearch !== 'all' && row.employeeCode !== appliedSearch) {
        return false;
      }
      return true;
    });
  }, [combinedRows, clientFilter, deptFilter, terminalFilter, methodFilter, radioFilter, appliedSearch]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
  const paginatedRows = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredRows.slice(start, start + PAGE_SIZE);
  }, [filteredRows, page]);

  useEffect(() => {
    setPage(1);
  }, [clientFilter, deptFilter, terminalFilter, methodFilter, radioFilter, appliedSearch, selectedDate]);

  const handleOpenAddPunch = (row) => {
    setAddModalRow(row);
    setPunchForm({
      date: selectedDate,
      hh: '00',
      mm: '00',
      ss: '00',
      remarks: ''
    });
  };

  const handleSaveManualPunch = (e) => {
    e.preventDefault();
    if (!addModalRow) return;
    const formatted = `${punchForm.hh}:${punchForm.mm}:${punchForm.ss}`;
    const mins = (parseInt(punchForm.hh, 10) || 0) * 60 + (parseInt(punchForm.mm, 10) || 0);
    const hasIn = addModalRow.punches.some((p) => p.direction === 'Check-In');
    const direction = hasIn ? 'Check-Out' : 'Check-In';
    const isLate = direction === 'Check-In' && mins > 9 * 60 + 15;

    const newPunch = {
      id: `mp-${Date.now()}`,
      empId: addModalRow.employeeCode,
      empName: addModalRow.employeeName,
      direction,
      time: formatted,
      method: 'Manual',
      deviceName: 'Manual Entry',
      client: addModalRow.client,
      remarks: punchForm.remarks,
      isLate
    };
    setPunchLogs((prev) => [...prev, newPunch]);
    setAddModalRow(null);
    setToast({ show: true, message: `Punch inserted for ${addModalRow.employeeName}.`, type: 'success' });
  };

  const handleDeletePunch = (punchId) => {
    setPunchLogs((prev) => prev.filter((p) => p.id !== punchId));
    setViewModalRow((prev) =>
      prev ? { ...prev, punches: prev.punches.filter((p) => p.id !== punchId) } : null
    );
    setToast({ show: true, message: 'Punch removed.', type: 'warning' });
  };

  const handleExportExcel = () => {
    const rows = filteredRows.map((r, i) => {
      const inP = r.punches.find((p) => p.direction === 'Check-In');
      const outP = [...r.punches].reverse().find((p) => p.direction === 'Check-Out');
      return {
        SN: i + 1,
        'Employee ID': r.employeeCode,
        'Employee Name': r.employeeName,
        Designation: r.designation,
        Department: r.department,
        Date: formatMixedDate(selectedDate),
        Shift: r.shiftTime,
        'First Punch (IN)': inP?.time || '—',
        'Last Punch (OUT)': outP?.time || '—',
        'All Punches': r.punches.map((p) => `${p.direction === 'Check-In' ? 'IN' : 'OUT'}: ${p.time} (${p.method || 'Manual'})`).join(' | ') || 'No Punches',
        'Shift Duration': r.shiftDuration,
        'Work Duration': r.workDuration,
        Attendance: r.attendanceCode
      };
    });
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Punch Time Report');
    XLSX.writeFile(wb, `Punch_Time_Report_${selectedDate}.xlsx`);
    setOptionsOpen(false);
    setToast({ show: true, message: 'Punch Time Report downloaded.', type: 'success' });
  };

  const shiftPeriodMonth = (ym, delta) => {
    const [y, m] = ym.split('-').map(Number);
    const d = new Date(y, (m || 1) - 1 + delta, 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  };

  const formatPeriodLabel = (ym) => {
    const [y, m] = ym.split('-').map(Number);
    const d = new Date(y, (m || 1) - 1, 1);
    return `${d.toLocaleString('en-US', { month: 'short' }).toUpperCase()}-${y}`;
  };

  const handleDownloadTemplate = () => {
    const sample = [
      {
        'Employee ID': 'RRS001',
        Date: selectedDate,
        'Check-In': '09:00 AM',
        'Check-Out': '06:00 PM',
        Method: 'Manual'
      }
    ];
    const ws = XLSX.utils.json_to_sheet(sample);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Punches Template');
    XLSX.writeFile(wb, `Daily_Punches_Template_${uploadPeriodDate}.xlsx`);
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!uploadFile) {
      setToast({ show: true, message: 'Please select a file to upload.', type: 'error' });
      return;
    }
    try {
      const buf = await uploadFile.arrayBuffer();
      const wb = XLSX.read(buf, { type: 'array' });
      const firstSheet = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(firstSheet);
      const imported = [];
      rows.forEach((r, idx) => {
        const empId = r['Employee ID'] || r.employeeId || r.empId;
        if (!empId) return;
        const empMatch = combinedRows.find(
          (row) => String(row.employeeCode).toLowerCase() === String(empId).toLowerCase()
        );
        const method = r.Method || r.method || 'Manual';
        if (r['Check-In']) {
          imported.push({
            id: `imp-in-${Date.now()}-${idx}`,
            empId: String(empId),
            empName: empMatch?.employeeName || String(empId),
            direction: 'Check-In',
            time: String(r['Check-In']),
            method,
            deviceName: 'Excel Import',
            client: empMatch?.client || '—',
            isLate: false
          });
        }
        if (r['Check-Out']) {
          imported.push({
            id: `imp-out-${Date.now()}-${idx}`,
            empId: String(empId),
            empName: empMatch?.employeeName || String(empId),
            direction: 'Check-Out',
            time: String(r['Check-Out']),
            method,
            deviceName: 'Excel Import',
            client: empMatch?.client || '—',
            isLate: false
          });
        }
      });
      if (imported.length > 0) {
        setPunchLogs((prev) => [...prev, ...imported]);
      }
      setUploadModalOpen(false);
      setUploadFile(null);
      setToast({
        show: true,
        message: `Uploaded ${rows.length} record(s) from ${uploadFile.name}.`,
        type: 'success'
      });
    } catch (err) {
      console.error('Upload parse error:', err);
      setToast({ show: true, message: 'Could not read the selected file.', type: 'error' });
    }
  };

  const getAttBadgeClass = (code) => {
    if (code === 'P') return styles.attPresent;
    if (code === 'L') return styles.attLate;
    if (code === 'HD') return styles.attHalf;
    return styles.attAbsent;
  };

  return (
    <AdminLayout>
      <div className={styles.container}>
        {toast.show && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast((prev) => ({ ...prev, show: false }))}
          />
        )}

        <header className={styles.pageHeader}>
          <div>
            <nav className={styles.breadcrumb} aria-label="Breadcrumb">
              <Link to={isUserView ? '/user/dashboard' : '/admin/dashboard'}>Home</Link>
              <span>/</span>
              <span>Workforce</span>
              <span>/</span>
              <span className={styles.activeBreadcrumb}>Daily Punches</span>
            </nav>
            <h1 className={styles.pageTitle}>
              <Fingerprint size={18} />
              <span>Daily Punches</span>
            </h1>
            <p className={styles.pageSubtitle}>View or edit daily time punches for a single date.</p>
          </div>
          <div className={styles.optionsWrap} ref={optionsRef}>
            <button
              type="button"
              className={styles.optionsBtn}
              onClick={() => setOptionsOpen((o) => !o)}
            >
              <span>Options</span>
              <ChevronDown size={14} />
            </button>
            {optionsOpen && (
              <div className={styles.optionsMenu}>
                <button
                  type="button"
                  className={styles.optionsMenuItem}
                  onClick={() => {
                    setOptionsOpen(false);
                    setUploadFile(null);
                    setUploadModalOpen(true);
                  }}
                >
                  <Upload size={14} />
                  <span>Upload</span>
                </button>
                <button type="button" className={styles.optionsMenuItem} onClick={handleExportExcel}>
                  <Download size={14} />
                  <span>Download</span>
                </button>
              </div>
            )}
          </div>
        </header>

        {/* 4 Attendance Module Dropdown Filters */}
        <div className={styles.dropdownsRow}>
          <div className={styles.filterField}>
            <label>Client</label>
            <select
              className={styles.filterSelect}
              value={clientFilter}
              onChange={(e) => setClientFilter(e.target.value)}
            >
              <option value="all">All Clients</option>
              {clients.map((c) => {
                const name = c.clientName || c.name;
                return (
                  <option key={c._id || name} value={name}>
                    {name}
                  </option>
                );
              })}
            </select>
          </div>

          <div className={styles.filterField}>
            <label>Department</label>
            <select
              className={styles.filterSelect}
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
            >
              <option value="all">All Departments</option>
              {departmentOptions.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.filterField}>
            <label>Biometric Terminal</label>
            <select
              className={styles.filterSelect}
              value={terminalFilter}
              onChange={(e) => setTerminalFilter(e.target.value)}
            >
              <option value="all">All Terminals</option>
              {BIOMETRIC_DEVICES.map((dev) => (
                <option key={dev.id} value={dev.name}>
                  {dev.name}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.filterField}>
            <label>Punch Method</label>
            <select
              className={styles.filterSelect}
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
            >
              <option value="all">All Methods</option>
              {BIOMETRIC_METHODS.filter((m) => m.value !== 'all').map((m) => (
                <option key={m.value} value={m.label}>
                  {m.label}
                </option>
              ))}
              <option value="Manual">Manual</option>
            </select>
          </div>
        </div>

        {/* Radio Filters */}
        <div className={styles.radioRow}>
          {[
            { key: 'all', label: 'Show All' },
            { key: 'late', label: 'Late Coming Only' },
            { key: 'absent', label: 'Absent Only' },
            { key: 'no_punches', label: 'No Punches' }
          ].map((opt) => (
            <label key={opt.key} className={styles.radioLabel}>
              <input
                type="radio"
                name="dailyPunchesFilter"
                checked={radioFilter === opt.key}
                onChange={() => setRadioFilter(opt.key)}
              />
              <span>{opt.label}</span>
            </label>
          ))}
        </div>

        {/* Date Stepper & Employee Search */}
        <div className={styles.actionFilterBar}>
          <div className={styles.dateStepper}>
            <button
              type="button"
              className={styles.stepperBtn}
              onClick={() => setSelectedDate((d) => shiftIsoDate(d, -1))}
              title="Previous Date"
            >
              <ChevronLeft size={15} />
            </button>
            <input
              type="date"
              className={styles.dateInput}
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
            <button
              type="button"
              className={styles.stepperBtn}
              onClick={() => setSelectedDate((d) => shiftIsoDate(d, 1))}
              title="Next Date"
            >
              <ChevronRight size={15} />
            </button>
          </div>

          <div className={styles.searchGroup}>
            <select
              className={styles.empSearchInput}
              value={empSearch || 'all'}
              onChange={(e) => {
                const val = e.target.value;
                setEmpSearch(val);
                setAppliedSearch(val);
              }}
              aria-label="Filter by employee"
            >
              <option value="all">All Employees</option>
              {combinedRows.map((emp) => (
                <option key={emp.id} value={emp.employeeCode}>
                  {emp.employeeName} ({emp.employeeCode})
                </option>
              ))}
            </select>
            <button
              type="button"
              className={styles.viewBtn}
              onClick={() => {
                setAppliedSearch(empSearch || 'all');
                loadData();
              }}
            >
              <Search size={14} />
              <span>View</span>
            </button>
          </div>
        </div>

        {/* Main Table */}
        <div className={styles.tableCard}>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>SN</th>
                  <th>EMPLOYEE</th>
                  <th>DEPUTATION</th>
                  <th style={{ textAlign: 'center' }}>SHIFT TIME &amp; PUNCHES</th>
                  <th style={{ textAlign: 'center' }}>DURATION</th>
                  <th style={{ textAlign: 'center' }}>ATTENDANCE</th>
                  <th style={{ textAlign: 'center' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className={styles.emptyCell}>
                      Loading daily punches...
                    </td>
                  </tr>
                ) : paginatedRows.length === 0 ? (
                  <tr>
                    <td colSpan={7} className={styles.emptyCell}>
                      No records found for the selected filters.
                    </td>
                  </tr>
                ) : (
                  paginatedRows.map((row, idx) => (
                    <tr key={`${row.id}-${idx}`}>
                      <td className={styles.snCell}>{(page - 1) * PAGE_SIZE + idx + 1}</td>
                      <td>
                        <div className={styles.empCell}>
                          <strong>{row.employeeName}</strong>
                          <span>{row.employeeCode}</span>
                        </div>
                      </td>
                      <td>
                        <div className={styles.deputationCell}>
                          <span className={styles.depLine}>
                            <User size={13} color="#0d9488" />
                            <span>{row.designation}</span>
                          </span>
                          <span className={styles.depLine}>
                            <Building2 size={13} color="#7c3aed" />
                            <span>{row.department}</span>
                          </span>
                        </div>
                      </td>
                      <td>
                        <div className={styles.shiftCell}>
                          <span className={styles.shiftPill}>{row.shiftTime}</span>
                          {row.punches.length > 0 && (
                            <div className={styles.punchPills}>
                              {row.punches.map((p) => {
                                const m = String(p.method || '').toLowerCase();
                                let IconComp = Edit3;
                                if (m.includes('finger')) IconComp = Fingerprint;
                                else if (m.includes('face')) IconComp = ScanFace;
                                else if (m.includes('rfid')) IconComp = CreditCard;
                                else if (m.includes('pin')) IconComp = KeyRound;
                                else if (m.includes('geo') || m.includes('mobile')) IconComp = MapPin;

                                return (
                                  <span
                                    key={p.id}
                                    className={styles.punchChip}
                                    title={`${p.direction} (${p.method || 'Manual'})`}
                                  >
                                    <IconComp size={13} className={styles.punchIcon} />
                                    <span>{p.time}</span>
                                  </span>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className={styles.durationCell}>
                          <span className={styles.shiftDur}>Shift: {row.shiftDuration}</span>
                          <span className={styles.workDur}>Work: {row.workDuration}</span>
                        </div>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span className={`${styles.attBadge} ${getAttBadgeClass(row.attendanceCode)}`}>
                          {row.attendanceCode}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <div className={styles.actionsCell}>
                          <button
                            type="button"
                            className={styles.addPunchBtn}
                            onClick={() => handleOpenAddPunch(row)}
                            title="Add Manual Punch"
                          >
                            <Plus size={14} />
                          </button>
                          <button
                            type="button"
                            className={styles.moreBtn}
                            onClick={() => setViewModalRow(row)}
                            title="View Punch Details"
                          >
                            <MoreHorizontal size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Punch Legend matching our Attendance Module */}
        <div className={styles.legendSection}>
          <span className={styles.legendTitle}>Punch Legend:</span>
          <div className={styles.legendStrip}>
            <span className={styles.legendChip}>
              <Fingerprint size={12} color="#2563eb" /> Fingerprint
            </span>
            <span className={styles.legendChip}>
              <ScanFace size={12} color="#7c3aed" /> Face Recognition
            </span>
            <span className={styles.legendChip}>
              <CreditCard size={12} color="#0284c7" /> RFID Card
            </span>
            <span className={styles.legendChip}>
              <KeyRound size={12} color="#ea580c" /> PIN
            </span>
            <span className={styles.legendChip}>
              <MapPin size={12} color="#16a34a" /> Mobile Geo
            </span>
            <span className={styles.legendChip}>
              <Edit3 size={12} color="#475569" /> Manual
            </span>
          </div>

          <div className={styles.legendStrip}>
            <span className={styles.legendChip} style={{ color: '#166534' }}>
              P - Present
            </span>
            <span className={styles.legendChip} style={{ color: '#b45309' }}>
              L - Late
            </span>
            <span className={styles.legendChip} style={{ color: '#dc2626' }}>
              A - Absent
            </span>
            <span className={styles.legendChip} style={{ color: '#1d4ed8' }}>
              HD - Half Day
            </span>
          </div>
        </div>

        {/* Pagination */}
        <div className={styles.paginationRow}>
          <button
            type="button"
            className={styles.pageCircleBtn}
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            aria-label="Previous page"
          >
            <ChevronLeft size={14} />
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
            <button
              key={num}
              type="button"
              className={`${styles.pageNumBtn} ${page === num ? styles.pageNumActive : ''}`}
              onClick={() => setPage(num)}
            >
              {num}
            </button>
          ))}
          <button
            type="button"
            className={styles.pageCircleBtn}
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            aria-label="Next page"
          >
            <ChevronRight size={14} />
          </button>
        </div>

        {/* Add Manual Punch Modal */}
        {addModalRow && (
          <div className={styles.modalBackdrop} onClick={() => setAddModalRow(null)}>
            <form
              className={styles.uploadModalBox}
              onClick={(e) => e.stopPropagation()}
              onSubmit={handleSaveManualPunch}
            >
              <div className={styles.uploadModalHeader}>
                <button
                  type="button"
                  className={styles.closeBtn}
                  onClick={() => setAddModalRow(null)}
                  aria-label="Close"
                >
                  <X size={20} />
                </button>
              </div>
              <div className={styles.uploadModalBody}>
                <div className={styles.uploadRow}>
                  <label>Employee Name</label>
                  <strong className={styles.insertEmpName}>{addModalRow.employeeName}</strong>
                </div>

                <div className={styles.uploadRow}>
                  <label>
                    Punch Date <span className={styles.reqStar}>*</span>
                  </label>
                  <input
                    type="date"
                    required
                    className={styles.insertDateInput}
                    value={punchForm.date}
                    onChange={(e) => setPunchForm((p) => ({ ...p, date: e.target.value }))}
                  />
                </div>

                <div className={styles.uploadRow} style={{ alignItems: 'start' }}>
                  <label style={{ paddingTop: 9 }}>
                    Punch Time <span className={styles.reqStar}>*</span>
                  </label>
                  <div className={styles.timeSelectCol}>
                    <div className={styles.timeSelectsRow}>
                      <select
                        className={styles.timeSelect}
                        value={punchForm.hh}
                        onChange={(e) => setPunchForm((p) => ({ ...p, hh: e.target.value }))}
                      >
                        {Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0')).map((h) => (
                          <option key={h} value={h}>
                            {h}
                          </option>
                        ))}
                      </select>
                      <select
                        className={styles.timeSelect}
                        value={punchForm.mm}
                        onChange={(e) => setPunchForm((p) => ({ ...p, mm: e.target.value }))}
                      >
                        {Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0')).map((m) => (
                          <option key={m} value={m}>
                            {m}
                          </option>
                        ))}
                      </select>
                      <select
                        className={styles.timeSelect}
                        value={punchForm.ss}
                        onChange={(e) => setPunchForm((p) => ({ ...p, ss: e.target.value }))}
                      >
                        {Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0')).map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </div>
                    <span className={styles.timeHelper}>(24-Hour format)</span>
                  </div>
                </div>

                <div className={styles.uploadRow}>
                  <label>Remarks</label>
                  <input
                    type="text"
                    className={styles.uploadSelect}
                    value={punchForm.remarks}
                    onChange={(e) => setPunchForm((p) => ({ ...p, remarks: e.target.value }))}
                  />
                </div>
              </div>
              <div className={styles.uploadModalFooter}>
                <button
                  type="button"
                  className={styles.closeLinkBtn}
                  onClick={() => setAddModalRow(null)}
                >
                  Cancel
                </button>
                <button type="submit" className={styles.uploadSubmitBtn}>
                  Insert
                </button>
              </div>
            </form>
          </div>
        )}

        {/* All Punches Modal */}
        {viewModalRow && (
          <div className={styles.modalBackdrop} onClick={() => setViewModalRow(null)}>
            <div className={styles.allPunchesBox} onClick={(e) => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <h3>All Punches</h3>
                <button
                  type="button"
                  className={styles.closeBtn}
                  onClick={() => setViewModalRow(null)}
                  aria-label="Close"
                >
                  <X size={20} />
                </button>
              </div>
              <div className={styles.allPunchesBody}>
                <div className={styles.allPunchesEmpWrap}>
                  <strong className={styles.allPunchesEmp}>
                    {viewModalRow.employeeName} ({viewModalRow.employeeCode})
                  </strong>
                  <span className={styles.allPunchesDate}>{formatMixedDate(selectedDate)}</span>
                </div>

                <div className={styles.allPunchesCard}>
                  {viewModalRow.punches.length === 0 ? (
                    <div className={styles.allPunchesEmpty}>
                      No punches recorded for {formatMixedDate(selectedDate)}.
                    </div>
                  ) : (
                    viewModalRow.punches.map((p) => {
                      const m = String(p.method || '').toLowerCase();
                      let IconComp = Edit3;
                      if (m.includes('finger')) IconComp = Fingerprint;
                      else if (m.includes('face')) IconComp = ScanFace;
                      else if (m.includes('rfid')) IconComp = CreditCard;
                      else if (m.includes('pin')) IconComp = KeyRound;
                      else if (m.includes('geo') || m.includes('mobile')) IconComp = MapPin;
                      const isIn = p.direction === 'Check-In';

                      return (
                        <div key={p.id} className={styles.allPunchItem}>
                          <div className={styles.allPunchLeft}>
                            <div className={styles.allPunchTimeRow}>
                              <IconComp size={15} className={styles.punchIcon} />
                              <strong>{p.time}</strong>
                            </div>
                            <span className={styles.allPunchSource}>
                              {p.deviceName || p.method || 'Manual Entry'}
                            </span>
                          </div>
                          <span className={isIn ? styles.inBadge : styles.outBadge}>
                            {isIn ? 'IN' : 'OUT'}
                          </span>
                          <button
                            type="button"
                            className={styles.punchDeleteBtn}
                            onClick={() => handleDeletePunch(p.id)}
                            title="Delete Punch"
                            aria-label="Delete Punch"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>

                <div className={styles.allPunchesNote}>
                  <Info size={14} />
                  <span>All punches for selected date are shown (no allocation by shift)</span>
                </div>
              </div>
              <div className={styles.uploadModalFooter}>
                <button
                  type="button"
                  className={styles.closeLinkBtn}
                  onClick={() => setViewModalRow(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Upload Punches Modal */}
        {uploadModalOpen && (
          <div className={styles.modalBackdrop} onClick={() => setUploadModalOpen(false)}>
            <form
              className={styles.uploadModalBox}
              onClick={(e) => e.stopPropagation()}
              onSubmit={handleUploadSubmit}
            >
              <div className={styles.uploadModalHeader}>
                <button
                  type="button"
                  className={styles.closeBtn}
                  onClick={() => setUploadModalOpen(false)}
                  aria-label="Close"
                >
                  <X size={20} />
                </button>
              </div>
              <div className={styles.uploadModalBody}>
                <div className={styles.uploadRow}>
                  <label>
                    Select Period <span className={styles.reqStar}>*</span>
                  </label>
                  <div className={styles.periodStepper}>
                    <button
                      type="button"
                      className={styles.stepperBtn}
                      onClick={() => setUploadPeriodDate((p) => shiftPeriodMonth(p, -1))}
                    >
                      <ChevronLeft size={14} />
                    </button>
                    <span className={styles.periodLabel}>{formatPeriodLabel(uploadPeriodDate)}</span>
                    <button
                      type="button"
                      className={styles.stepperBtn}
                      onClick={() => setUploadPeriodDate((p) => shiftPeriodMonth(p, 1))}
                    >
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>

                <div className={styles.uploadRow}>
                  <label>
                    Select File <span className={styles.reqStar}>*</span>
                  </label>
                  <label className={styles.filePickerBox}>
                    <input
                      type="file"
                      accept=".xlsx,.xls,.csv"
                      onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                    />
                    <span className={styles.fileChooseBtn}>Choose File</span>
                    <span className={styles.fileNameText}>
                      {uploadFile ? uploadFile.name : 'No file chosen'}
                    </span>
                  </label>
                </div>

                <div className={styles.uploadRow}>
                  <label>
                    Select Format <span className={styles.reqStar}>*</span>
                  </label>
                  <select
                    className={styles.uploadSelect}
                    value={uploadFormat}
                    onChange={(e) => setUploadFormat(e.target.value)}
                  >
                    <option value="Excel Template">Excel Template</option>
                    <option value="CSV Format">CSV Format</option>
                  </select>
                </div>

                <div className={styles.uploadRow}>
                  <span />
                  <button
                    type="button"
                    className={styles.templateLinkBtn}
                    onClick={handleDownloadTemplate}
                  >
                    <Download size={14} />
                    <span>Download Excel Template</span>
                  </button>
                </div>
              </div>
              <div className={styles.uploadModalFooter}>
                <button
                  type="button"
                  className={styles.closeLinkBtn}
                  onClick={() => setUploadModalOpen(false)}
                >
                  Close
                </button>
                <button type="submit" className={styles.uploadSubmitBtn}>
                  <Upload size={14} />
                  <span>Upload</span>
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
