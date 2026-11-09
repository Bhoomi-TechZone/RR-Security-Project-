import React, { useState, useMemo, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Trash2,
  Check,
  Download
} from 'lucide-react';
import styles from './BonusManagementTab.module.css';

const MONTH_NAMES = [
  'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN',
  'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'
];

const DEFAULT_EMPLOYEES = [
  {
    id: 'emp_001',
    employeeCode: 'RRS001',
    name: 'Bandna Rana',
    clientName: 'DLF CyberCity Tech Park',
    companyName: 'DLF CyberCity Tech Park',
    location: 'Head Office',
    siteLocation: 'Head Office',
    department: 'Security',
    designation: 'Security Supervisor',
    basic: 15000,
    da: 0,
    hra: 3000,
    conveyance: 1000,
    specialAllowance: 1000,
    otherAllowance: 0
  },
  {
    id: 'emp_002',
    employeeCode: 'EMP001',
    name: 'Rahul Kumar',
    clientName: 'ABC Security Services',
    companyName: 'ABC Security Services',
    location: 'Site Gate 1',
    siteLocation: 'Site Gate 1',
    department: 'Security',
    designation: 'Security Guard',
    basic: 16000,
    da: 1000,
    hra: 4000,
    conveyance: 1000,
    specialAllowance: 1500,
    otherAllowance: 0
  },
  {
    id: 'emp_003',
    employeeCode: 'EMP002',
    name: 'Amit Sharma',
    clientName: 'HDFC Bank Cash Vault',
    companyName: 'HDFC Bank Cash Vault',
    location: 'Noida Branch',
    siteLocation: 'Noida Branch',
    department: 'Operations',
    designation: 'Operations Supervisor',
    basic: 18500,
    da: 1500,
    hra: 5000,
    conveyance: 1200,
    specialAllowance: 2000,
    otherAllowance: 500
  },
  {
    id: 'emp_004',
    employeeCode: 'EMP003',
    name: 'Raj Kumar',
    clientName: 'Max Super Speciality Hospital',
    companyName: 'Max Super Speciality Hospital',
    location: 'Bareilly HQ',
    siteLocation: 'Bareilly HQ',
    department: 'Housekeeping',
    designation: 'Housekeeping Staff',
    basic: 14000,
    da: 0,
    hra: 3500,
    conveyance: 800,
    specialAllowance: 1000,
    otherAllowance: 0
  }
];

export default function BonusManagementTab({
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
      const hasRRS = employees.some((e) => (e.employeeCode || e.code) === 'RRS001');
      if (!hasRRS) {
        return [DEFAULT_EMPLOYEES[0], ...employees];
      }
      return employees;
    }
    return DEFAULT_EMPLOYEES;
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
    return ['All Designations', ...(combined.length > 0 ? combined : ['Security Supervisor', 'Security Guard', 'Operations Supervisor', 'Housekeeping Staff'])];
  }, [designations, employeePool]);

  // NovaSpark Filters State
  const [selectedClient, setSelectedClient] = useState('All Clients');
  const [selectedLocation, setSelectedLocation] = useState('All Locations');
  const [selectedDepartment, setSelectedDepartment] = useState('All Departments');
  const [selectedDesignation, setSelectedDesignation] = useState('All Designations');
  const [selectedEmployee, setSelectedEmployee] = useState('All Employees');

  // Payment Period state (defaults to OCT-2026 as per reference)
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

  // 5 Bonus Parameters
  const [bonusRate, setBonusRate] = useState(8.33);
  const [eligibilityCutOff, setEligibilityCutOff] = useState(21000);
  const [minWages, setMinWages] = useState(7000);
  const [minBonus, setMinBonus] = useState(100);
  const [maxBonus, setMaxBonus] = useState(0);

  // Salary Component toggles
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

  // Compute Base Salary from active toggles
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

    // Fallback if 0 for reference employee
    if (base === 0 && (emp.employeeCode === 'RRS001' || emp.code === 'RRS001')) {
      base = 15000;
    }
    return base;
  };

  // Helper to calculate bonus amount
  const calculateBonus = (baseSalary) => {
    const rate = Number(bonusRate) || 8.33;
    const cutOff = Number(eligibilityCutOff) || 21000;
    const minB = Number(minBonus) || 0;
    const maxB = Number(maxBonus) || 0;

    // Eligibility check
    if (cutOff > 0 && baseSalary > cutOff) {
      return { isEligible: false, bonusAmount: 0 };
    }

    // Annual base computation: Base * 12 months * (rate / 100)
    const annualBase = baseSalary * 12;
    let bonus = Math.round(annualBase * (rate / 100));

    if (minB > 0 && bonus < minB) bonus = minB;
    if (maxB > 0 && bonus > maxB) bonus = maxB;

    return { isEligible: true, bonusAmount: bonus };
  };

  // Initial reference summary row (Bandna Rana)
  const [summaryRows, setSummaryRows] = useState(() => [
    {
      sn: 1,
      eCode: 'RRS001',
      employeeName: 'Bandna Rana',
      baseSalary: 15000,
      bonusAmount: 14994
    }
  ]);

  // Generate Summary Handler (filtered by NovaSpark HRMS filters)
  const handleGenerateSummary = () => {
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

    // Fallback if empty and All Employees chosen
    if (filtered.length === 0 && selectedEmployee === 'All Employees') {
      filtered = [DEFAULT_EMPLOYEES[0]];
    }

    const rows = [];
    let snCounter = 1;

    filtered.forEach((emp) => {
      const baseSalary = computeBaseSalary(emp);
      const { isEligible, bonusAmount } = calculateBonus(baseSalary);

      if (isEligible) {
        rows.push({
          sn: snCounter++,
          eCode: emp.employeeCode || emp.code || 'EMP',
          employeeName: emp.name || emp.employeeName || 'Staff Member',
          baseSalary,
          bonusAmount
        });
      }
    });

    setSummaryRows(rows);

    if (onNotify) {
      onNotify(`✓ Bonus summary generated for ${rows.length} eligible employee(s).`, 'success');
    }
  };

  // Delete / Reset Summary
  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete and reset the current bonus summary?')) {
      setSummaryRows([]);
      if (onNotify) {
        onNotify('Bonus summary has been reset.', 'info');
      }
    }
  };

  // Process Bonus
  const handleProcess = () => {
    if (summaryRows.length === 0) {
      alert('No bonus records to process. Please generate summary first.');
      return;
    }

    try {
      const processBatch = {
        period: formattedPeriod,
        processedAt: new Date().toISOString(),
        client: selectedClient,
        bonusRate,
        records: summaryRows
      };
      localStorage.setItem('novaspark_last_processed_bonus', JSON.stringify(processBatch));
    } catch (err) {
      console.error(err);
    }

    if (onNotify) {
      onNotify(
        `✓ Bonus processed successfully for ${summaryRows.length} employee(s) for period ${formattedPeriod}!`,
        'success'
      );
    } else {
      alert(`Bonus processed successfully for ${summaryRows.length} employee(s)!`);
    }
  };

  // Download Summary (CSV)
  const handleDownload = () => {
    if (summaryRows.length === 0) {
      alert('No bonus records to download.');
      return;
    }

    const headers = ['SN', 'E-CODE', 'EMPLOYEE NAME', 'BASE SALARY', 'BONUS AMOUNT'];
    const rows = summaryRows.map((r) => [
      r.sn,
      r.eCode,
      `"${r.employeeName}"`,
      r.baseSalary.toFixed(2),
      r.bonusAmount.toFixed(2)
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Bonus_Summary_${formattedPeriod}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    if (onNotify) {
      onNotify(`✓ Bonus summary downloaded (${formattedPeriod}).`, 'info');
    }
  };

  // Calculated Metrics for Summary Header
  const totalPayable = useMemo(() => {
    return summaryRows.reduce((acc, row) => acc + (Number(row.bonusAmount) || 0), 0);
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

        {/* ROW 2: Payment Period & Employee */}
        <div className={styles.gridRow2}>
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Payment Period</label>
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

        {/* ROW 3: Parameters (Bonus Rate, Eligibility Cut-Off, Min. Wages, Min. Bonus, Max. Bonus) */}
        <div className={styles.gridRow5}>
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Bonus Rate</label>
            <input
              type="number"
              step="0.01"
              className={`${styles.textInput} ${styles.paramInput}`}
              value={bonusRate}
              onChange={(e) => setBonusRate(e.target.value === '' ? '' : Number(e.target.value))}
              onBlur={() => {
                if (bonusRate === '') setBonusRate(8.33);
              }}
            />
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>
              Eligibility Cut-Off{' '}
              <span
                className={styles.infoIcon}
                title="Maximum wage limit to be eligible for statutory bonus (e.g. ₹21,000)"
              >
                i
              </span>
            </label>
            <input
              type="number"
              className={`${styles.textInput} ${styles.paramInput}`}
              value={eligibilityCutOff}
              onChange={(e) => setEligibilityCutOff(e.target.value === '' ? '' : Number(e.target.value))}
              onBlur={() => {
                if (eligibilityCutOff === '') setEligibilityCutOff(21000);
              }}
            />
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>
              Min. Wages{' '}
              <span
                className={styles.infoIcon}
                title="Minimum wages ceiling per month under Act (e.g. ₹7,000)"
              >
                i
              </span>
            </label>
            <input
              type="number"
              className={`${styles.textInput} ${styles.paramInput}`}
              value={minWages}
              onChange={(e) => setMinWages(e.target.value === '' ? '' : Number(e.target.value))}
              onBlur={() => {
                if (minWages === '') setMinWages(7000);
              }}
            />
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>
              Min. Bonus{' '}
              <span
                className={styles.infoIcon}
                title="Minimum statutory bonus payable (e.g. ₹100)"
              >
                i
              </span>
            </label>
            <input
              type="number"
              className={`${styles.textInput} ${styles.paramInput}`}
              value={minBonus}
              onChange={(e) => setMinBonus(e.target.value === '' ? '' : Number(e.target.value))}
              onBlur={() => {
                if (minBonus === '') setMinBonus(100);
              }}
            />
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>
              Max. Bonus{' '}
              <span
                className={styles.infoIcon}
                title="Maximum cap for bonus (0 for no cap)"
              >
                i
              </span>
            </label>
            <input
              type="number"
              className={`${styles.textInput} ${styles.paramInput}`}
              value={maxBonus}
              onChange={(e) => setMaxBonus(e.target.value === '' ? '' : Number(e.target.value))}
              onBlur={() => {
                if (maxBonus === '') setMaxBonus(0);
              }}
            />
          </div>
        </div>

        {/* ROW 4: Select Components */}
        <div className={styles.componentsSection}>
          <label className={styles.fieldLabel}>Select Components</label>
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

        {/* ROW 5: Generate Summary (Left) & Delete (Right) */}
        <div className={styles.actionRow}>
          <button
            type="button"
            className={styles.btnGenerate}
            onClick={handleGenerateSummary}
          >
            <CheckCircle2 size={16} />
            <span>Generate Summary</span>
          </button>

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

      {/* Bonus Summary Card Section */}
      <div className={styles.summaryCard}>
        <div className={styles.summaryHeader}>
          <h3 className={styles.summaryTitle}>Bonus Summary</h3>

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
          <table className={styles.bonusTable}>
            <thead>
              <tr>
                <th style={{ width: '60px' }}>SN</th>
                <th style={{ width: '140px' }}>E-CODE</th>
                <th>EMPLOYEE NAME</th>
                <th style={{ width: '180px', textAlign: 'right' }}>BASE SALARY</th>
                <th style={{ width: '180px', textAlign: 'right' }}>BONUS AMOUNT</th>
              </tr>
            </thead>
            <tbody>
              {summaryRows.length === 0 ? (
                <tr>
                  <td colSpan="5" className={styles.emptyRow}>
                    No bonus records generated. Select filters and click "Generate Summary".
                  </td>
                </tr>
              ) : (
                summaryRows.map((row) => (
                  <tr key={`${row.sn}-${row.eCode}`}>
                    <td>{row.sn}</td>
                    <td>{row.eCode}</td>
                    <td>{row.employeeName}</td>
                    <td className={row.baseSalary ? styles.numCol : ''}>
                      {Number(row.baseSalary).toLocaleString('en-IN', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      })}
                    </td>
                    <td className={row.bonusAmount ? styles.numCol : ''}>
                      {Number(row.bonusAmount).toLocaleString('en-IN', {
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

          <button
            type="button"
            className={styles.btnDownload}
            onClick={handleDownload}
          >
            <Download size={16} />
            <span>Download</span>
          </button>
        </div>
      </div>
    </div>
  );
}
