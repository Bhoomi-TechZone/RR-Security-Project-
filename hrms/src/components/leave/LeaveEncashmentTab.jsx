import React, { useState, useMemo, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Trash2,
  Check,
  Download,
  History,
  Clock,
  X,
  FileSpreadsheet
} from 'lucide-react';
import styles from './LeaveEncashmentTab.module.css';

const MONTH_NAMES = [
  'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN',
  'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'
];

const STORAGE_HISTORY_KEY = 'novaspark_leave_encashment_history';

// Default reference employees for mock data & testing
const DEFAULT_EMPLOYEES = [
  {
    id: 'emp_001',
    employeeCode: 'RRS001',
    name: 'Bandna Rana',
    clientName: 'DLF CyberCity Tech Park',
    client: 'DLF CyberCity Tech Park',
    location: 'Head Office',
    department: 'Security',
    designation: 'Security Supervisor',
    basic: 15000,
    da: 0,
    hra: 3000,
    conveyance: 1000,
    specialAllowance: 1000,
    otherAllowance: 0,
    leaveBalances: {
      EL: 24,
      CL: 6,
      SL: 8,
      PL: 15
    }
  },
  {
    id: 'emp_002',
    employeeCode: 'RRS002',
    name: 'Mahesh Chandra Sharma',
    clientName: 'HDFC Bank Cash Vault',
    client: 'HDFC Bank Cash Vault',
    location: 'Head Office',
    department: 'Security',
    designation: 'Head Armoured Guard',
    basic: 20000,
    da: 0,
    hra: 4000,
    conveyance: 1000,
    specialAllowance: 1500,
    otherAllowance: 0,
    leaveBalances: {
      EL: 30,
      CL: 8,
      SL: 10,
      PL: 18
    }
  },
  {
    id: 'emp_003',
    employeeCode: 'RRS003',
    name: 'Harish Babulal Patel',
    clientName: 'Max Super Speciality Hospital',
    client: 'Max Super Speciality Hospital',
    location: 'Bareilly HQ',
    department: 'Facility Management',
    designation: 'Facility Supervisor',
    basic: 18000,
    da: 1000,
    hra: 3500,
    conveyance: 800,
    specialAllowance: 1000,
    otherAllowance: 0,
    leaveBalances: {
      EL: 18,
      CL: 4,
      SL: 6,
      PL: 12
    }
  },
  {
    id: 'emp_004',
    employeeCode: 'RRS004',
    name: 'Surender Kumar Verma',
    clientName: 'Tata Consultancy Services Campus',
    client: 'Tata Consultancy Services Campus',
    location: 'Noida Branch',
    department: 'Security',
    designation: 'Patrol Guard Grade 1',
    basic: 16500,
    da: 500,
    hra: 3000,
    conveyance: 800,
    specialAllowance: 1000,
    otherAllowance: 0,
    leaveBalances: {
      EL: 22,
      CL: 5,
      SL: 7,
      PL: 14
    }
  },
  {
    id: 'emp_005',
    employeeCode: 'EMP001',
    name: 'Rahul Kumar',
    clientName: 'ABC Security Services',
    client: 'ABC Security Services',
    location: 'Site Gate 1',
    department: 'Security',
    designation: 'Security Guard',
    basic: 16000,
    da: 1000,
    hra: 4000,
    conveyance: 1000,
    specialAllowance: 1500,
    otherAllowance: 0,
    leaveBalances: {
      EL: 16,
      CL: 3,
      SL: 5,
      PL: 10
    }
  },
  {
    id: 'emp_006',
    employeeCode: 'EMP002',
    name: 'Amit Sharma',
    clientName: 'HDFC Bank Cash Vault',
    client: 'HDFC Bank Cash Vault',
    location: 'Noida Branch',
    department: 'Operations',
    designation: 'Operations Supervisor',
    basic: 18500,
    da: 1500,
    hra: 5000,
    conveyance: 1200,
    specialAllowance: 2000,
    otherAllowance: 500,
    leaveBalances: {
      EL: 20,
      CL: 7,
      SL: 9,
      PL: 15
    }
  }
];

export default function LeaveEncashmentTab({
  employees = [],
  leaveTypes = [],
  clients = [],
  departments = [],
  designations = [],
  employeeBalances = [],
  onNotify
}) {
  // Current Period Navigator State default: OCT-2026
  const [currentYear, setCurrentYear] = useState(2026);
  const [currentMonthIdx, setCurrentMonthIdx] = useState(9); // 0-indexed: 9 = OCT

  // Balance As On Navigator State default: OCT-2026
  const [balanceYear, setBalanceYear] = useState(2026);
  const [balanceMonthIdx, setBalanceMonthIdx] = useState(9);

  // Form Filter State (NovaSpark HRMS filters: Client, Location, Department, Designation)
  const [selectedClient, setSelectedClient] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedDesignation, setSelectedDesignation] = useState('');
  const [selectedLeave, setSelectedLeave] = useState(''); // Default to empty ('- Select -')
  const [selectedEmployee, setSelectedEmployee] = useState('');

  // Balance Above State (empty string handling to prevent stuck '0')
  const [balanceAbove, setBalanceAbove] = useState(0);

  // Select Components Toggles State
  const [components, setComponents] = useState({
    basic: true,
    da: false,
    hra: false,
    conveyance: false,
    specialAllowance: false,
    otherAllowance: false
  });

  // Generated Summary State
  const [isGenerated, setIsGenerated] = useState(false);
  const [summaryRows, setSummaryRows] = useState([]);

  // History Modal State
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [historyList, setHistoryList] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_HISTORY_KEY);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.warn('Failed to parse encashment history:', e);
    }
    return [
      {
        id: 'hist-001',
        period: 'SEP-2026',
        leaveType: 'EL - Earned / Privilege Leave',
        processedDate: '2026-09-30',
        eligibleCount: 1,
        totalAmount: 14994,
        status: 'Processed'
      }
    ];
  });

  // Helper: Format formatted month string e.g. OCT-2026
  const periodString = `${MONTH_NAMES[currentMonthIdx]}-${currentYear}`;
  const balanceAsOnString = `${MONTH_NAMES[balanceMonthIdx]}-${balanceYear}`;

  // Period Navigation handlers
  const handlePrevMonth = () => {
    if (currentMonthIdx === 0) {
      setCurrentMonthIdx(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonthIdx((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonthIdx === 11) {
      setCurrentMonthIdx(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonthIdx((m) => m + 1);
    }
  };

  const handlePrevBalanceMonth = () => {
    if (balanceMonthIdx === 0) {
      setBalanceMonthIdx(11);
      setBalanceYear((y) => y - 1);
    } else {
      setBalanceMonthIdx((m) => m - 1);
    }
  };

  const handleNextBalanceMonth = () => {
    if (balanceMonthIdx === 11) {
      setBalanceMonthIdx(0);
      setBalanceYear((y) => y + 1);
    } else {
      setBalanceMonthIdx((m) => m + 1);
    }
  };

  // Toggle Component checkbox
  const handleToggleComponent = (compKey) => {
    setComponents((prev) => ({
      ...prev,
      [compKey]: !prev[compKey]
    }));
  };

  // Merge dynamic employees with reference pool
  const employeePool = useMemo(() => {
    if (Array.isArray(employees) && employees.length > 0) {
      const hasRRS = employees.some((e) => (e.employeeCode || e.code) === 'RRS001');
      if (!hasRRS) {
        return [...DEFAULT_EMPLOYEES, ...employees];
      }
      return employees;
    }
    return DEFAULT_EMPLOYEES;
  }, [employees]);

  // Derived filter options matching NovaSpark HRMS
  const clientOptions = useMemo(() => {
    const set = new Set();
    if (Array.isArray(clients)) {
      clients.forEach((c) => {
        if (c?.name) set.add(c.name);
        if (c?.clientName) set.add(c.clientName);
      });
    }
    employeePool.forEach((e) => {
      if (e.clientName) set.add(e.clientName);
      if (e.client) set.add(e.client);
      if (e.companyName) set.add(e.companyName);
    });
    return Array.from(set).filter(Boolean);
  }, [clients, employeePool]);

  const locationOptions = useMemo(() => {
    const set = new Set();
    employeePool.forEach((e) => {
      if (e.location) set.add(e.location);
      if (e.siteLocation) set.add(e.siteLocation);
      if (e.site) set.add(e.site);
      if (e.branch) set.add(e.branch);
    });
    if (set.size === 0) {
      ['Head Office', 'Site Gate 1', 'Noida Branch', 'Bareilly HQ'].forEach((l) => set.add(l));
    }
    return Array.from(set).filter(Boolean);
  }, [employeePool]);

  const departmentOptions = useMemo(() => {
    const set = new Set();
    if (Array.isArray(departments)) {
      departments.forEach((d) => {
        if (d) set.add(typeof d === 'string' ? d : d.name);
      });
    }
    employeePool.forEach((e) => {
      if (e.department) set.add(e.department);
    });
    if (set.size === 0) {
      ['Security', 'Operations', 'Facility Management', 'Housekeeping', 'Administration'].forEach((d) => set.add(d));
    }
    return Array.from(set).filter(Boolean);
  }, [departments, employeePool]);

  const designationOptions = useMemo(() => {
    const set = new Set();
    if (Array.isArray(designations)) {
      designations.forEach((desig) => {
        if (desig) set.add(typeof desig === 'string' ? desig : desig.name);
      });
    }
    employeePool.forEach((e) => {
      if (e.designation) set.add(e.designation);
    });
    if (set.size === 0) {
      ['Security Supervisor', 'Head Armoured Guard', 'Security Guard', 'Facility Supervisor', 'Operations Supervisor'].forEach((d) => set.add(d));
    }
    return Array.from(set).filter(Boolean);
  }, [designations, employeePool]);

  // Dynamically filtered employee list based on selected Client, Location, Department, Designation
  const filteredEmployees = useMemo(() => {
    return employeePool.filter((emp) => {
      if (selectedClient) {
        const empClient = emp.clientName || emp.client || emp.companyName || '';
        if (empClient !== selectedClient) return false;
      }
      if (selectedLocation) {
        const empLoc = emp.location || emp.siteLocation || emp.site || emp.branch || '';
        if (empLoc !== selectedLocation) return false;
      }
      if (selectedDepartment && emp.department !== selectedDepartment) {
        return false;
      }
      if (selectedDesignation && emp.designation !== selectedDesignation) {
        return false;
      }
      return true;
    });
  }, [employeePool, selectedClient, selectedLocation, selectedDepartment, selectedDesignation]);

  // Reset employee dropdown if current selected employee is filtered out
  useEffect(() => {
    if (selectedEmployee) {
      const exists = filteredEmployees.some(
        (e) => (e.employeeCode || e.code || e.employeeId || e.id) === selectedEmployee
      );
      if (!exists) {
        setSelectedEmployee('');
      }
    }
  }, [filteredEmployees, selectedEmployee]);

  // Available leave types from Leave Master
  const availableLeaveTypes = useMemo(() => {
    if (Array.isArray(leaveTypes) && leaveTypes.length > 0) {
      return leaveTypes;
    }
    return [
      { code: 'EL', name: 'Earned / Privilege Leave' },
      { code: 'CL', name: 'Casual Leave' },
      { code: 'SL', name: 'Sick Leave' },
      { code: 'PL', name: 'Privilege Leave' }
    ];
  }, [leaveTypes]);

  // Generate Encashment Summary calculation
  const handleGenerateSummary = () => {
    if (!selectedLeave) {
      if (onNotify) onNotify('Please select a leave type from the "Select Leave" dropdown.', 'warning');
      return;
    }
    const minBalThreshold = Number(balanceAbove) || 0;

    const filtered = employeePool.filter((emp) => {
      if (selectedClient) {
        const empClient = emp.clientName || emp.client || emp.companyName || '';
        if (empClient !== selectedClient) return false;
      }
      if (selectedLocation) {
        const empLoc = emp.location || emp.siteLocation || emp.site || emp.branch || '';
        if (empLoc !== selectedLocation) return false;
      }
      if (selectedDepartment && emp.department !== selectedDepartment) {
        return false;
      }
      if (selectedDesignation && emp.designation !== selectedDesignation) {
        return false;
      }
      if (selectedEmployee) {
        const empId = emp.id || emp.employeeId || emp._id;
        const empCode = emp.employeeCode || emp.code;
        if (empId !== selectedEmployee && empCode !== selectedEmployee) return false;
      }
      return true;
    });

    const rows = filtered.map((emp, index) => {
      // Determine leave balance for the selected leave type
      const leaveCode = (selectedLeave || 'EL').toUpperCase();
      let leaveBal = 24; // Default fallback
      if (emp.leaveBalances && typeof emp.leaveBalances[leaveCode] === 'number') {
        leaveBal = emp.leaveBalances[leaveCode];
      } else if (emp.balance && typeof emp.balance === 'number') {
        leaveBal = emp.balance;
      } else if (leaveCode === 'EL') {
        leaveBal = 24 - (index * 2);
      } else if (leaveCode === 'CL') {
        leaveBal = 6;
      } else if (leaveCode === 'SL') {
        leaveBal = 8;
      }

      // Check if employee satisfies Balance Above threshold
      if (leaveBal <= minBalThreshold) return null;

      // Base salary computation based on active components
      let baseSalary = 0;
      if (components.basic) baseSalary += Number(emp.basic || 15000);
      if (components.da) baseSalary += Number(emp.da || 0);
      if (components.hra) baseSalary += Number(emp.hra || 0);
      if (components.conveyance) baseSalary += Number(emp.conveyance || 0);
      if (components.specialAllowance) baseSalary += Number(emp.specialAllowance || 0);
      if (components.otherAllowance) baseSalary += Number(emp.otherAllowance || 0);

      // Standard Indian Labour Law divisor = 26 working days
      const dailySalary = Math.round((baseSalary / 26) * 100) / 100;

      // Default encashment days: min of 15 days or total available balance
      const encashDays = Math.min(15, Math.max(1, leaveBal));
      const encashAmount = Math.round(dailySalary * encashDays);

      return {
        sn: index + 1,
        id: emp.id || emp.employeeId || `emp-${index}`,
        employeeCode: emp.employeeCode || emp.code || `RRS${String(index + 1).padStart(3, '0')}`,
        name: emp.name || emp.employeeName || 'Employee',
        leaveBalance: leaveBal,
        dailySalary,
        encashDays,
        encashAmount,
        baseSalary
      };
    }).filter(Boolean);

    // Re-index SN
    const indexedRows = rows.map((r, i) => ({ ...r, sn: i + 1 }));

    setSummaryRows(indexedRows);
    setIsGenerated(true);

    if (onNotify) {
      if (indexedRows.length > 0) {
        onNotify(`✓ Summary generated successfully: ${indexedRows.length} eligible employee(s) found.`, 'success');
      } else {
        onNotify('No eligible employees found for the chosen criteria.', 'info');
      }
    }
  };

  // Handle live edit of Encashment Days for a row
  const handleDaysChange = (id, newDaysValue) => {
    const val = newDaysValue === '' ? '' : Math.max(0, Number(newDaysValue));

    setSummaryRows((prev) =>
      prev.map((r) => {
        if (r.id === id) {
          const daysNum = Number(val) || 0;
          const encashAmount = Math.round(r.dailySalary * daysNum);
          return {
            ...r,
            encashDays: val,
            encashAmount
          };
        }
        return r;
      })
    );
  };

  // Summary Totals
  const totalEligible = summaryRows.length;
  const totalPayable = useMemo(() => {
    return summaryRows.reduce((sum, r) => sum + (Number(r.encashAmount) || 0), 0);
  }, [summaryRows]);

  // Process Encashment Action
  const handleProcess = () => {
    if (summaryRows.length === 0) {
      if (onNotify) onNotify('Cannot process: No eligible employees in summary.', 'warning');
      return;
    }

    const newRecord = {
      id: `hist-${Date.now()}`,
      period: periodString,
      leaveType: selectedLeave,
      processedDate: new Date().toISOString().slice(0, 10),
      eligibleCount: totalEligible,
      totalAmount: totalPayable,
      status: 'Processed'
    };

    const nextHistory = [newRecord, ...historyList];
    setHistoryList(nextHistory);
    try {
      localStorage.setItem(STORAGE_HISTORY_KEY, JSON.stringify(nextHistory));
    } catch (e) {
      console.warn('Failed to store encashment history:', e);
    }

    if (onNotify) {
      onNotify(
        `✓ Leave Encashment for ${periodString} (${selectedLeave}) processed successfully for ${totalEligible} employee(s). Total: ₹${totalPayable.toLocaleString('en-IN')}`,
        'success'
      );
    }
  };

  // Download Action (CSV export)
  const handleDownload = () => {
    if (summaryRows.length === 0) {
      if (onNotify) onNotify('No records available to download.', 'warning');
      return;
    }

    const headers = ['SN', 'E-CODE', 'EMPLOYEE NAME', 'LEAVE BALANCE', 'DAILY SALARY', 'ENCASHMENT DAYS', 'ENCASHMENT AMOUNT'];
    const rows = summaryRows.map((r) => [
      r.sn,
      r.employeeCode,
      `"${r.name}"`,
      r.leaveBalance,
      r.dailySalary.toFixed(2),
      r.encashDays,
      r.encashAmount.toFixed(2)
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Leave_Encashment_Summary_${periodString}_${selectedLeave}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    if (onNotify) onNotify('✓ Summary download started.', 'success');
  };

  // Delete Action
  const handleDelete = () => {
    setSummaryRows([]);
    setIsGenerated(false);
    if (onNotify) onNotify('Encashment summary cleared.', 'info');
  };

  return (
    <div className={styles.container}>
      {/* Filters Form Section */}
      <div className={styles.formSection}>
        {/* Row 1: NovaSpark HRMS Filters (Client, Location, Department, Designation) */}
        <div className={styles.gridRow4}>
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Client</label>
            <select
              className={styles.selectInput}
              value={selectedClient}
              onChange={(e) => setSelectedClient(e.target.value)}
            >
              <option value="">All Clients</option>
              {clientOptions.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Location</label>
            <select
              className={styles.selectInput}
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
            >
              <option value="">All Locations</option>
              {locationOptions.map((loc) => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
            </select>
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Department</label>
            <select
              className={styles.selectInput}
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
            >
              <option value="">All Departments</option>
              {departmentOptions.map((dept) => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Designation</label>
            <select
              className={styles.selectInput}
              value={selectedDesignation}
              onChange={(e) => setSelectedDesignation(e.target.value)}
            >
              <option value="">All Designations</option>
              {designationOptions.map((desig) => (
                <option key={desig} value={desig}>{desig}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Row 2: Payment Period, Select Leave, Employee */}
        <div className={styles.gridRowPeriodLeaveEmp}>
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Payment Period</label>
            <div className={styles.monthNav}>
              <button
                type="button"
                className={styles.monthNavBtn}
                onClick={handlePrevMonth}
                title="Previous Month"
              >
                <ChevronLeft size={16} />
              </button>
              <span className={styles.monthNavDisplay}>{periodString}</span>
              <button
                type="button"
                className={styles.monthNavBtn}
                onClick={handleNextMonth}
                title="Next Month"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Select Leave</label>
            <select
              className={styles.selectInput}
              value={selectedLeave}
              onChange={(e) => setSelectedLeave(e.target.value)}
            >
              <option value="">- Select -</option>
              {availableLeaveTypes.map((t) => (
                <option key={t.code || t.id || t._id} value={t.code || t.name}>
                  {t.code ? `${t.code} - ` : ''}{t.name}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Employee</label>
            <select
              className={styles.selectInput}
              value={selectedEmployee}
              onChange={(e) => setSelectedEmployee(e.target.value)}
            >
              <option value="">All Employees</option>
              {filteredEmployees.map((emp) => {
                const empCode = emp.employeeCode || emp.code || emp.employeeId || emp.id;
                const empName = emp.name || emp.employeeName || 'Employee';
                return (
                  <option key={emp.id || empCode} value={empCode}>
                    {empCode} - {empName}
                  </option>
                );
              })}
            </select>
          </div>
        </div>

        {/* Row 3: Select Components (Left) + Balance As On & Balance Above (Right) */}
        <div className={styles.gridRowComponentsAndBalance}>
          {/* Left: Select Components */}
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>
              Select Components
              <span className={styles.infoIcon} title="Select components included in encashment wage calculation">i</span>
            </label>
            <div className={styles.componentsScrollBox}>
              <label className={styles.componentRow}>
                <span className={styles.switch}>
                  <input
                    type="checkbox"
                    checked={components.basic}
                    onChange={() => handleToggleComponent('basic')}
                  />
                  <span className={styles.slider}></span>
                </span>
                <span className={styles.componentLabel}>Basic Salary</span>
              </label>

              <label className={styles.componentRow}>
                <span className={styles.switch}>
                  <input
                    type="checkbox"
                    checked={components.da}
                    onChange={() => handleToggleComponent('da')}
                  />
                  <span className={styles.slider}></span>
                </span>
                <span className={styles.componentLabel}>Dearness Allowance</span>
              </label>

              <label className={styles.componentRow}>
                <span className={styles.switch}>
                  <input
                    type="checkbox"
                    checked={components.hra}
                    onChange={() => handleToggleComponent('hra')}
                  />
                  <span className={styles.slider}></span>
                </span>
                <span className={styles.componentLabel}>House Rent Allowance</span>
              </label>

              <label className={styles.componentRow}>
                <span className={styles.switch}>
                  <input
                    type="checkbox"
                    checked={components.conveyance}
                    onChange={() => handleToggleComponent('conveyance')}
                  />
                  <span className={styles.slider}></span>
                </span>
                <span className={styles.componentLabel}>Conveyance Allowance</span>
              </label>

              <label className={styles.componentRow}>
                <span className={styles.switch}>
                  <input
                    type="checkbox"
                    checked={components.specialAllowance}
                    onChange={() => handleToggleComponent('specialAllowance')}
                  />
                  <span className={styles.slider}></span>
                </span>
                <span className={styles.componentLabel}>Special Allowance</span>
              </label>

              <label className={styles.componentRow}>
                <span className={styles.switch}>
                  <input
                    type="checkbox"
                    checked={components.otherAllowance}
                    onChange={() => handleToggleComponent('otherAllowance')}
                  />
                  <span className={styles.slider}></span>
                </span>
                <span className={styles.componentLabel}>Other Allowance</span>
              </label>
            </div>
          </div>

          {/* Right: Balance As On & Balance Above */}
          <div className={styles.balanceFieldsRow}>
            <div className={`${styles.fieldGroup} ${styles.balanceNavCol}`}>
              <label className={styles.fieldLabel}>
                Balance As On
                <span className={styles.infoIcon} title="Cut-off period for calculating available leave balance">i</span>
              </label>
              <div className={styles.monthNav}>
                <button
                  type="button"
                  className={styles.monthNavBtn}
                  onClick={handlePrevBalanceMonth}
                  title="Previous Cut-off Month"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className={styles.monthNavDisplay}>{balanceAsOnString}</span>
                <button
                  type="button"
                  className={styles.monthNavBtn}
                  onClick={handleNextBalanceMonth}
                  title="Next Cut-off Month"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>

            <div className={`${styles.fieldGroup} ${styles.balanceAboveCol}`}>
              <label className={styles.fieldLabel}>
                Balance Above
                <span className={styles.infoIcon} title="Minimum accumulated leave balance to qualify for encashment">i</span>
              </label>
              <input
                type="number"
                min={0}
                className={styles.balanceAboveInput}
                value={balanceAbove}
                onChange={(e) => setBalanceAbove(e.target.value === '' ? '' : Number(e.target.value))}
                onBlur={() => {
                  if (balanceAbove === '') setBalanceAbove(0);
                }}
              />
            </div>
          </div>
        </div>

        {/* Buttons Row: Generate Summary (Left) & History / Delete (Right) */}
        <div className={styles.actionRow}>
          <button
            type="button"
            className={styles.btnGenerate}
            onClick={handleGenerateSummary}
          >
            <CheckCircle2 size={16} />
            <span>Generate Summary</span>
          </button>

          <div className={styles.rightBtnGroup}>
            <button
              type="button"
              className={styles.btnHistory}
              onClick={() => setIsHistoryModalOpen(true)}
            >
              <History size={15} />
              <span>History</span>
            </button>

            <button
              type="button"
              className={styles.btnDelete}
              onClick={handleDelete}
              title="Clear generated summary"
            >
              <Trash2 size={15} />
              <span>Delete</span>
            </button>
          </div>
        </div>
      </div>

      {/* Encashment Summary Card */}
      <div className={styles.summaryCard}>
        <div className={styles.summaryHeader}>
          <h3 className={styles.summaryTitle}>Encashment Summary</h3>
          <div className={styles.summaryBadges}>
            <span>Eligible Employees: <strong className={styles.badgePill}>{totalEligible}</strong></span>
            <span>Total Payable: <strong className={styles.badgePill}>{totalPayable.toFixed(2)}</strong></span>
          </div>
        </div>

        {/* Summary Table */}
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.th}>SN</th>
                <th className={styles.th}>E-CODE</th>
                <th className={styles.th}>EMPLOYEE NAME</th>
                <th className={styles.thRight}>LEAVE BALANCE</th>
                <th className={styles.thRight}>DAILY SALARY</th>
                <th className={styles.thRight}>ENCASHMENT DAYS</th>
                <th className={styles.thRight}>ENCASHMENT AMOUNT</th>
              </tr>
            </thead>
            <tbody>
              {!isGenerated || summaryRows.length === 0 ? (
                <tr>
                  <td colSpan={7} className={styles.emptyRow}>
                    No eligible employees found
                  </td>
                </tr>
              ) : (
                summaryRows.map((row) => (
                  <tr key={row.id}>
                    <td className={styles.td}>{row.sn}</td>
                    <td className={styles.td}>
                      <strong>{row.employeeCode}</strong>
                    </td>
                    <td className={styles.td}>{row.name}</td>
                    <td className={styles.tdRight}>
                      {row.leaveBalance}
                    </td>
                    <td className={styles.tdRight}>
                      {row.dailySalary.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className={styles.tdRight}>
                      <input
                        type="number"
                        min={0}
                        max={row.leaveBalance}
                        className={styles.daysInput}
                        value={row.encashDays}
                        onChange={(e) => handleDaysChange(row.id, e.target.value)}
                      />
                    </td>
                    <td className={styles.tdRight}>
                      <strong>
                        {row.encashAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </strong>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Bottom Process & Download Actions */}
        <div className={styles.bottomActionsRow}>
          <button
            type="button"
            className={styles.btnProcess}
            onClick={handleProcess}
          >
            <Check size={16} />
            <span>Process</span>
          </button>

          <button
            type="button"
            className={styles.btnDownload}
            onClick={handleDownload}
          >
            <Download size={15} />
            <span>Download</span>
          </button>
        </div>
      </div>

      {/* History Modal */}
      {isHistoryModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsHistoryModalOpen(false)}>
          <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>
                <Clock size={18} color="#0d9488" />
                <span>Leave Encashment Run History</span>
              </h3>
              <button
                type="button"
                className={styles.modalCloseBtn}
                onClick={() => setIsHistoryModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <div className={styles.modalBody}>
              {historyList.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px', color: '#94a3b8' }}>
                  No previous encashment runs recorded.
                </div>
              ) : (
                <div className={styles.tableWrapper}>
                  <table className={styles.table} style={{ minWidth: 600 }}>
                    <thead>
                      <tr>
                        <th className={styles.th}>Batch ID</th>
                        <th className={styles.th}>Payment Period</th>
                        <th className={styles.th}>Leave Type</th>
                        <th className={styles.th}>Processed Date</th>
                        <th className={styles.thRight}>Eligible</th>
                        <th className={styles.thRight}>Total Payout</th>
                        <th className={styles.th}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {historyList.map((item) => (
                        <tr key={item.id}>
                          <td className={styles.td}>
                            <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#2563eb' }}>
                              {item.id}
                            </span>
                          </td>
                          <td className={styles.td}>{item.period}</td>
                          <td className={styles.td}>{item.leaveType}</td>
                          <td className={styles.td}>{item.processedDate}</td>
                          <td className={styles.tdRight}>{item.eligibleCount}</td>
                          <td className={styles.tdRight}>
                            <strong>₹{Number(item.totalAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
                          </td>
                          <td className={styles.td}>
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                              padding: '2px 8px',
                              borderRadius: 10,
                              fontSize: '11px',
                              fontWeight: 700,
                              background: '#ecfdf5',
                              color: '#059669',
                              border: '1px solid #a7f3d0'
                            }}>
                              {item.status || 'Processed'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className={styles.modalFooter}>
              <button
                type="button"
                className={styles.btnCloseModal}
                onClick={() => setIsHistoryModalOpen(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
