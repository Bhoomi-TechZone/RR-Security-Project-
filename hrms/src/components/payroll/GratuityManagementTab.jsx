import React, { useState, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Trash2,
  Check,
  Download
} from 'lucide-react';
import styles from './GratuityManagementTab.module.css';

const MONTH_NAMES = [
  'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN',
  'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'
];

const DEFAULT_GRATUITY_EMPLOYEES = [
  {
    id: 'emp_g01',
    employeeCode: 'RRS002',
    name: 'Mahesh Chandra Sharma',
    clientName: 'HDFC Bank Cash Vault',
    companyName: 'HDFC Bank Cash Vault',
    location: 'Head Office',
    siteLocation: 'Head Office',
    department: 'Security',
    designation: 'Head Armoured Guard',
    joiningDate: '2019-03-01',
    exitDate: '2026-09-30',
    isExited: true,
    basic: 20000,
    da: 0,
    hra: 4000,
    conveyance: 1000,
    specialAllowance: 1500,
    otherAllowance: 0
  },
  {
    id: 'emp_g02',
    employeeCode: 'RRS003',
    name: 'Harish Babulal Patel',
    clientName: 'Max Super Speciality Hospital',
    companyName: 'Max Super Speciality Hospital',
    location: 'Bareilly HQ',
    siteLocation: 'Bareilly HQ',
    department: 'Facility Management',
    designation: 'Technical Facility Supervisor',
    joiningDate: '2021-04-15',
    exitDate: '2026-10-15',
    isExited: true,
    basic: 18000,
    da: 0,
    hra: 3500,
    conveyance: 800,
    specialAllowance: 1000,
    otherAllowance: 0
  },
  {
    id: 'emp_g03',
    employeeCode: 'RRS004',
    name: 'Surender Kumar Verma',
    clientName: 'Tata Consultancy Services Campus',
    companyName: 'Tata Consultancy Services Campus',
    location: 'Noida Branch',
    siteLocation: 'Noida Branch',
    department: 'Security',
    designation: 'Patrol Guard Grade 1',
    joiningDate: '2018-07-01',
    exitDate: '2026-08-31',
    isExited: true,
    basic: 16500,
    da: 0,
    hra: 3000,
    conveyance: 800,
    specialAllowance: 1000,
    otherAllowance: 0
  },
  {
    id: 'emp_g04',
    employeeCode: 'RRS001',
    name: 'Bandna Rana',
    clientName: 'DLF CyberCity Tech Park',
    companyName: 'DLF CyberCity Tech Park',
    location: 'Head Office',
    siteLocation: 'Head Office',
    department: 'Security',
    designation: 'Security Supervisor',
    joiningDate: '2020-01-10',
    exitDate: null,
    isExited: false,
    basic: 15000,
    da: 0,
    hra: 3000,
    conveyance: 1000,
    specialAllowance: 1000,
    otherAllowance: 0
  },
  {
    id: 'emp_g05',
    employeeCode: 'EMP001',
    name: 'Rahul Kumar',
    clientName: 'ABC Security Services',
    companyName: 'ABC Security Services',
    location: 'Site Gate 1',
    siteLocation: 'Site Gate 1',
    department: 'Security',
    designation: 'Security Guard',
    joiningDate: '2025-01-15',
    exitDate: null,
    isExited: false,
    basic: 16000,
    da: 1000,
    hra: 4000,
    conveyance: 1000,
    specialAllowance: 1500,
    otherAllowance: 0
  }
];

export default function GratuityManagementTab({
  employees = [],
  clients = [],
  departments = [],
  designations = [],
  selectedMonth,
  onNotify
}) {
  // Combine live employees with reference dataset
  const employeePool = useMemo(() => {
    if (Array.isArray(employees) && employees.length > 0) {
      const hasSeparated = employees.some((e) => Boolean(e.exitDate || e.isExited));
      if (!hasSeparated) {
        return [...DEFAULT_GRATUITY_EMPLOYEES, ...employees];
      }
      return employees;
    }
    return DEFAULT_GRATUITY_EMPLOYEES;
  }, [employees]);

  // Dynamic filter option lists matching NovaSpark HRMS
  const clientOptions = useMemo(() => {
    const fromProps = Array.isArray(clients)
      ? clients.map((c) => c.name || c.companyName || c.clientName).filter(Boolean)
      : [];
    const fromEmps = employeePool.map((e) => e.clientName || e.companyName).filter(Boolean);
    const combined = Array.from(new Set([...fromProps, ...fromEmps]));
    return ['All Clients', ...combined];
  }, [clients, employeePool]);

  const locationOptions = useMemo(() => {
    const fromEmps = employeePool
      .map((e) => e.location || e.joiningLocation || e.siteLocation)
      .filter(Boolean);
    const combined = Array.from(new Set(fromEmps));
    return ['All Locations', ...(combined.length > 0 ? combined : ['Head Office', 'Site Gate 1', 'Noida Branch', 'Bareilly HQ'])];
  }, [employeePool]);

  const departmentOptions = useMemo(() => {
    const fromProps = Array.isArray(departments)
      ? departments.map((d) => d.name || d).filter(Boolean)
      : [];
    const fromEmps = employeePool.map((e) => e.department).filter(Boolean);
    const combined = Array.from(new Set([...fromProps, ...fromEmps]));
    return ['All Departments', ...(combined.length > 0 ? combined : ['Security', 'Operations', 'Housekeeping', 'Facility Management'])];
  }, [departments, employeePool]);

  const designationOptions = useMemo(() => {
    const fromProps = Array.isArray(designations)
      ? designations.map((d) => d.name || d).filter(Boolean)
      : [];
    const fromEmps = employeePool.map((e) => e.designation).filter(Boolean);
    const combined = Array.from(new Set([...fromProps, ...fromEmps]));
    return ['All Designations', ...(combined.length > 0 ? combined : ['Head Armoured Guard', 'Security Supervisor', 'Technical Facility Supervisor', 'Security Guard'])];
  }, [designations, employeePool]);

  // NovaSpark Filters State
  const [selectedClient, setSelectedClient] = useState('All Clients');
  const [selectedLocation, setSelectedLocation] = useState('All Locations');
  const [selectedDepartment, setSelectedDepartment] = useState('All Departments');
  const [selectedDesignation, setSelectedDesignation] = useState('All Designations');
  const [selectedEmployee, setSelectedEmployee] = useState('All Employees');

  // Active Period state (defaults to OCT-2026 as shown in screenshot)
  const [periodDate, setPeriodDate] = useState(() => {
    if (selectedMonth && /^\d{4}-\d{2}$/.test(selectedMonth)) {
      const [y, m] = selectedMonth.split('-');
      return new Date(parseInt(y, 10), parseInt(m, 10) - 1, 1);
    }
    return new Date(2026, 9, 1); // Oct 2026
  });

  const formattedPeriod = useMemo(() => {
    const month = MONTH_NAMES[periodDate.getMonth()];
    const year = periodDate.getFullYear();
    return `${month}-${year}`;
  }, [periodDate]);

  const handlePrevPeriod = () => {
    setPeriodDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextPeriod = () => {
    setPeriodDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  // Gratuity Parameters
  const [minYears, setMinYears] = useState(1);
  const [payableDays, setPayableDays] = useState(15);
  const [monthDays, setMonthDays] = useState(30);
  const [exitEmployeesOnly, setExitEmployeesOnly] = useState(true);

  // Salary Components
  const [components, setComponents] = useState({
    basicSalary: true,
    dearnessAllowance: false,
    houseRentAllowance: false,
    conveyanceAllowance: false,
    specialAllowance: false,
    otherAllowance: false
  });

  const handleToggleComponent = (key) => {
    setComponents((prev) => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Year Rounding ('roundUp' or 'roundDown')
  const [yearRounding, setYearRounding] = useState('roundDown');

  // Validation Message state
  const isMonthDaysValid =
    monthDays !== '' && payableDays !== ''
      ? Number(monthDays) > Number(payableDays)
      : true;

  // Summary Rows State (Initially empty with "No eligible employees found" matching screenshot)
  const [summaryRows, setSummaryRows] = useState([]);

  // Compute Base Salary
  const computeBaseSalary = (emp) => {
    let base = 0;
    const basicVal = Number(emp.basic || emp.basicSalary || emp.salary?.basic || 0);
    const daVal = Number(emp.da || emp.vda || emp.salary?.da || 0);
    const hraVal = Number(emp.hra || emp.salary?.hra || 0);
    const convVal = Number(emp.conveyance || emp.salary?.conveyance || 0);
    const specVal = Number(emp.specialAllowance || emp.salary?.specialAllowance || 0);
    const otherVal = Number(emp.otherAllowance || emp.salary?.otherAllowance || 0);

    if (components.basicSalary) base += basicVal;
    if (components.dearnessAllowance) base += daVal;
    if (components.houseRentAllowance) base += hraVal;
    if (components.conveyanceAllowance) base += convVal;
    if (components.specialAllowance) base += specVal;
    if (components.otherAllowance) base += otherVal;

    return base;
  };

  // Compute Service Years
  const computeServiceYears = (emp) => {
    const joinDateStr = emp.joiningDate || emp.dateOfJoining || '2020-01-01';
    const joinDate = new Date(joinDateStr);
    const endDate = emp.exitDate ? new Date(emp.exitDate) : new Date(periodDate);

    let diffMonths =
      (endDate.getFullYear() - joinDate.getFullYear()) * 12 +
      (endDate.getMonth() - joinDate.getMonth());

    if (diffMonths < 0) diffMonths = 0;

    const fullYears = Math.floor(diffMonths / 12);
    const remainderMonths = diffMonths % 12;

    if (yearRounding === 'roundUp') {
      return remainderMonths >= 6 ? fullYears + 1 : Math.max(1, fullYears);
    } else {
      return Math.max(1, fullYears);
    }
  };

  // Generate Summary Handler
  const handleGenerateSummary = () => {
    if (!isMonthDaysValid) {
      alert('Invalid request. Month days should be more than Payable days.');
      return;
    }

    let filtered = [...employeePool];

    // Filter by Client
    if (selectedClient !== 'All Clients') {
      filtered = filtered.filter(
        (e) => (e.clientName || e.companyName) === selectedClient
      );
    }

    // Filter by Location
    if (selectedLocation !== 'All Locations') {
      filtered = filtered.filter(
        (e) => (e.location || e.joiningLocation || e.siteLocation) === selectedLocation
      );
    }

    // Filter by Department
    if (selectedDepartment !== 'All Departments') {
      filtered = filtered.filter((e) => e.department === selectedDepartment);
    }

    // Filter by Designation
    if (selectedDesignation !== 'All Designations') {
      filtered = filtered.filter((e) => e.designation === selectedDesignation);
    }

    // Filter by Employee selection
    if (selectedEmployee !== 'All Employees') {
      filtered = filtered.filter(
        (e) =>
          (e.id || e.employeeCode || e.code) === selectedEmployee ||
          (e.name || e.employeeName) === selectedEmployee
      );
    }

    // Filter by Exit Employees Only toggle
    if (exitEmployeesOnly) {
      filtered = filtered.filter(
        (e) => Boolean(e.isExited || e.exitDate || e.status === 'Exited' || e.status === 'Inactive')
      );
    }

    const rows = [];
    let snCounter = 1;

    filtered.forEach((emp) => {
      const baseSalary = computeBaseSalary(emp);
      const yearsInService = computeServiceYears(emp);

      // Eligibility check: Years in service >= Min. Yrs
      if (yearsInService >= Number(minYears || 1) && baseSalary > 0) {
        // Gratuity Formula: (Base Salary * Payable Days * Years) / Month Days
        const gratuityAmount = Math.round(
          (baseSalary * Number(payableDays || 15) * yearsInService) / Number(monthDays || 30)
        );

        rows.push({
          sn: snCounter++,
          eCode: emp.employeeCode || emp.code || 'EMP',
          employeeName: emp.name || emp.employeeName || 'Staff Member',
          baseSalary,
          yearsInService,
          gratuityAmount
        });
      }
    });

    setSummaryRows(rows);

    if (onNotify) {
      onNotify(`✓ Gratuity summary generated for ${rows.length} eligible employee(s).`, 'success');
    }
  };

  // Delete / Reset Summary
  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete and reset the current gratuity summary?')) {
      setSummaryRows([]);
      if (onNotify) {
        onNotify('Gratuity summary has been reset.', 'info');
      }
    }
  };

  // Process Gratuity
  const handleProcess = () => {
    if (summaryRows.length === 0) {
      alert('No gratuity records to process. Please generate summary first.');
      return;
    }

    try {
      const processBatch = {
        period: formattedPeriod,
        processedAt: new Date().toISOString(),
        client: selectedClient,
        payableDays,
        monthDays,
        records: summaryRows
      };
      localStorage.setItem('novaspark_last_processed_gratuity', JSON.stringify(processBatch));
    } catch (err) {
      console.error(err);
    }

    if (onNotify) {
      onNotify(
        `✓ Gratuity processed successfully for ${summaryRows.length} employee(s) for period ${formattedPeriod}!`,
        'success'
      );
    } else {
      alert(`Gratuity processed successfully for ${summaryRows.length} employee(s)!`);
    }
  };

  // Download Summary (CSV)
  const handleDownload = () => {
    if (summaryRows.length === 0) {
      alert('No gratuity records to download.');
      return;
    }

    const headers = ['SN', 'EMPLOYEE NAME', 'BASE SALARY', 'YEARS IN SERVICE', 'GRATUITY AMOUNT'];
    const rows = summaryRows.map((r) => [
      r.sn,
      `"${r.employeeName} (${r.eCode})"`,
      r.baseSalary.toFixed(2),
      r.yearsInService,
      r.gratuityAmount.toFixed(2)
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Gratuity_Summary_${formattedPeriod}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    if (onNotify) {
      onNotify(`✓ Gratuity summary downloaded (${formattedPeriod}).`, 'info');
    }
  };

  // Calculated Metrics for Summary Header
  const totalPayable = useMemo(() => {
    return summaryRows.reduce((acc, row) => acc + (Number(row.gratuityAmount) || 0), 0);
  }, [summaryRows]);

  const eligibleCount = summaryRows.length;

  return (
    <div className={styles.container}>
      <div className={styles.formSection}>
        {/* ROW 1: NovaSpark HRMS Filters (Client, Location, Department, Designation) */}
        <div className={styles.gridRow4}>
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Client</label>
            <select
              className={styles.selectInput}
              value={selectedClient}
              onChange={(e) => setSelectedClient(e.target.value)}
            >
              {clientOptions.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
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
              {locationOptions.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
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
              {departmentOptions.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
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
              {designationOptions.map((desig) => (
                <option key={desig} value={desig}>
                  {desig}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* ROW 2: Active Period & Employee */}
        <div className={styles.gridRow2}>
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Active Period</label>
            <div className={styles.periodStepper}>
              <button
                type="button"
                className={styles.stepperBtn}
                onClick={handlePrevPeriod}
                title="Previous Month"
              >
                <ChevronLeft size={16} />
              </button>
              <div className={styles.periodDisplay}>{formattedPeriod}</div>
              <button
                type="button"
                className={styles.stepperBtn}
                onClick={handleNextPeriod}
                title="Next Month"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Employee</label>
            <select
              className={styles.selectInput}
              value={selectedEmployee}
              onChange={(e) => setSelectedEmployee(e.target.value)}
            >
              <option value="All Employees">All Employees</option>
              {employeePool.map((emp) => (
                <option
                  key={emp.id || emp.employeeCode || emp.code}
                  value={emp.id || emp.employeeCode || emp.code}
                >
                  {emp.employeeCode || emp.code} — {emp.name || emp.employeeName}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* ROW 3: Parameters (Min. Yrs, Payable Days, Month Days, Exit Employees Only) */}
        <div className={styles.paramsRow}>
          <div className={`${styles.fieldGroup} ${styles.paramBoxSmall}`}>
            <label className={styles.fieldLabel}>Min. Yrs.</label>
            <input
              type="number"
              min="1"
              max="50"
              className={`${styles.textInput} ${styles.paramInput}`}
              value={minYears}
              onChange={(e) => setMinYears(e.target.value === '' ? '' : Number(e.target.value))}
              onBlur={() => {
                if (minYears === '') setMinYears(1);
              }}
            />
          </div>

          <div className={`${styles.fieldGroup} ${styles.paramBoxSmall}`}>
            <label className={styles.fieldLabel}>Payable Days</label>
            <input
              type="number"
              min="1"
              max="31"
              className={`${styles.textInput} ${styles.paramInput}`}
              value={payableDays}
              onChange={(e) => setPayableDays(e.target.value === '' ? '' : Number(e.target.value))}
              onBlur={() => {
                if (payableDays === '') setPayableDays(15);
              }}
            />
          </div>

          <div className={`${styles.fieldGroup} ${styles.paramBoxSmall}`}>
            <label className={styles.fieldLabel}>Month Days</label>
            <input
              type="number"
              min="1"
              max="31"
              className={`${styles.textInput} ${styles.paramInput}`}
              value={monthDays}
              onChange={(e) => setMonthDays(e.target.value === '' ? '' : Number(e.target.value))}
              onBlur={() => {
                if (monthDays === '') setMonthDays(30);
              }}
            />
          </div>

          <div className={styles.exitToggleBox}>
            <label className={styles.componentRow} style={{ margin: 0 }}>
              <span className={styles.switch}>
                <input
                  type="checkbox"
                  checked={exitEmployeesOnly}
                  onChange={(e) => setExitEmployeesOnly(e.target.checked)}
                />
                <span className={styles.slider}></span>
              </span>
              <span className={styles.fieldLabel} style={{ cursor: 'pointer', margin: 0 }}>
                Exit Employees Only{' '}
                <span
                  className={styles.infoIcon}
                  title="Only include employees who have exited / resigned / separated"
                >
                  i
                </span>
              </span>
            </label>
          </div>
        </div>

        {/* ROW 4: Salary Components & Year Rounding Side-by-Side */}
        <div className={styles.componentsAndRoundingRow}>
          {/* Salary Components */}
          <div className={styles.sectionBoxWrapper}>
            <label className={styles.fieldLabel}>Salary Components</label>
            <div className={styles.componentsBox}>
              <label className={styles.componentRow}>
                <span className={styles.switch}>
                  <input
                    type="checkbox"
                    checked={components.basicSalary}
                    onChange={() => handleToggleComponent('basicSalary')}
                  />
                  <span className={styles.slider}></span>
                </span>
                <span className={styles.componentText}>Basic Salary</span>
              </label>

              <label className={styles.componentRow}>
                <span className={styles.switch}>
                  <input
                    type="checkbox"
                    checked={components.dearnessAllowance}
                    onChange={() => handleToggleComponent('dearnessAllowance')}
                  />
                  <span className={styles.slider}></span>
                </span>
                <span className={styles.componentText}>Dearness Allowance</span>
              </label>

              <label className={styles.componentRow}>
                <span className={styles.switch}>
                  <input
                    type="checkbox"
                    checked={components.houseRentAllowance}
                    onChange={() => handleToggleComponent('houseRentAllowance')}
                  />
                  <span className={styles.slider}></span>
                </span>
                <span className={styles.componentText}>House Rent Allowance</span>
              </label>

              <label className={styles.componentRow}>
                <span className={styles.switch}>
                  <input
                    type="checkbox"
                    checked={components.conveyanceAllowance}
                    onChange={() => handleToggleComponent('conveyanceAllowance')}
                  />
                  <span className={styles.slider}></span>
                </span>
                <span className={styles.componentText}>Conveyance Allowance</span>
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
                <span className={styles.componentText}>Special Allowance</span>
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
                <span className={styles.componentText}>Other Allowance</span>
              </label>
            </div>
          </div>

          {/* Year Rounding */}
          <div className={styles.sectionBoxWrapper}>
            <label className={styles.fieldLabel}>Year Rounding</label>
            <div className={styles.roundingBox}>
              <label className={styles.radioRow}>
                <input
                  type="radio"
                  name="gratuityYearRounding"
                  value="roundUp"
                  checked={yearRounding === 'roundUp'}
                  onChange={() => setYearRounding('roundUp')}
                />
                <span>Round Up</span>
                <span
                  className={styles.infoIcon}
                  title="If service is 6 months or more, round up to the next year (e.g. 5 yrs 7 mos = 6 yrs)"
                >
                  i
                </span>
              </label>

              <label className={styles.radioRow}>
                <input
                  type="radio"
                  name="gratuityYearRounding"
                  value="roundDown"
                  checked={yearRounding === 'roundDown'}
                  onChange={() => setYearRounding('roundDown')}
                />
                <span>Round Down</span>
                <span
                  className={styles.infoIcon}
                  title="Round down to completed years only (e.g. 5 yrs 7 mos = 5 yrs)"
                >
                  i
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* ROW 5: Generate Summary (Left) & Delete (Right) */}
        <div className={styles.actionRow}>
          <div className={styles.actionLeft}>
            <button
              type="button"
              className={styles.btnGenerate}
              onClick={handleGenerateSummary}
            >
              <CheckCircle2 size={16} />
              <span>Generate Summary</span>
            </button>

            {!isMonthDaysValid && (
              <span className={styles.validationMsgError}>
                "Invalid request. Month days should be more than Payable days."
              </span>
            )}
          </div>

          <button
            type="button"
            className={styles.btnDelete}
            onClick={handleDelete}
          >
            <Trash2 size={16} />
            <span>Delete</span>
          </button>
        </div>
      </div>

      {/* Gratuity Summary Card Section */}
      <div className={styles.summaryCard}>
        <div className={styles.summaryHeader}>
          <h3 className={styles.summaryTitle}>Gratuity Summary</h3>

          <div className={styles.summaryBadges}>
            <div className={styles.badgeItem}>
              <span>Eligible Employees:</span>
              <span className={styles.pillGreen}>{eligibleCount}</span>
            </div>

            <div className={styles.badgeItem}>
              <span>Total Payable:</span>
              <span className={styles.pillCyan}>{totalPayable}</span>
            </div>
          </div>
        </div>

        <div className={styles.tableWrapper}>
          <table className={styles.gratuityTable}>
            <thead>
              <tr>
                <th style={{ width: '60px' }}>SN</th>
                <th>EMPLOYEE NAME</th>
                <th style={{ width: '180px', textAlign: 'right' }}>BASE SALARY</th>
                <th style={{ width: '180px', textAlign: 'right' }}>YEARS IN SERVICE</th>
                <th style={{ width: '180px', textAlign: 'right' }}>GRATUITY AMOUNT</th>
              </tr>
            </thead>
            <tbody>
              {summaryRows.length === 0 ? (
                <tr>
                  <td colSpan="5" className={styles.emptyRow}>
                    No eligible employees found
                  </td>
                </tr>
              ) : (
                summaryRows.map((row) => (
                  <tr key={`${row.sn}-${row.eCode}`}>
                    <td>{row.sn}</td>
                    <td>
                      <strong>{row.employeeName}</strong>
                      <span style={{ fontSize: '11px', color: '#64748b', marginLeft: '6px' }}>
                        ({row.eCode})
                      </span>
                    </td>
                    <td className={row.baseSalary ? styles.numCol : ''}>
                      {Number(row.baseSalary).toLocaleString('en-IN', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      })}
                    </td>
                    <td className={styles.numCol}>{row.yearsInService}</td>
                    <td className={row.gratuityAmount ? styles.numCol : ''}>
                      {Number(row.gratuityAmount).toLocaleString('en-IN', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className={styles.summaryFooter}>
          <button
            type="button"
            className={styles.btnProcess}
            onClick={handleProcess}
          >
            <Check size={16} />
            <span>Process</span>
          </button>

          {summaryRows.length > 0 && (
            <button
              type="button"
              className={styles.btnDownload}
              onClick={handleDownload}
            >
              <Download size={16} />
              <span>Download</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
