import React, { useMemo, useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  BarChart3,
  Building2,
  CalendarClock,
  CheckCircle2,
  Database,
  Download,
  FileBarChart,
  FileCheck,
  Filter,
  Printer,
  Search,
  X
} from 'lucide-react';
import AdminLayout from '../../components/layout/AdminLayout';
import Pagination from '../../components/common/Pagination';
import Toast from '../../components/common/Toast';
import { mockCompanies } from '../../data/companyData';
import { mockEmployees, mockDepartments } from '../../data/employeeData';
import { attendanceReportData } from '../../data/attendanceReportData';
import { payrollReportData } from '../../data/payrollReportData';
import { inventoryReportData } from '../../data/inventoryReportData';
import { billingReportData } from '../../data/billingReportData';
import styles from './Reports.module.css';

const PAGE_SIZE = 8;
const DEFAULT_PERIOD = {
  fromDate: '2026-08-01',
  toDate: '2026-08-31',
  quickRange: 'This Month'
};

const currencyFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0
});

const formatDate = (value) => {
  if (!value) return '—';
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }).format(date);
};

const formatCurrency = (value) => {
  if (typeof value === 'number') return currencyFormatter.format(value);
  if (!value) return '₹0';
  return value;
};

const statusClassName = (status) => {
  const normalized = String(status || '').toLowerCase();
  if (['approved', 'processed', 'completed', 'good', 'active'].includes(normalized)) return styles.statusApproved;
  if (['pending'].includes(normalized)) return styles.statusPending;
  if (['rejected', 'low', 'inactive'].includes(normalized)) return styles.statusRejected;
  return styles.statusNeutral;
};

const reportCategories = [
  {
    id: 'attendance',
    name: 'Attendance Report',
    description: 'View employee attendance records and attendance summary.',
    records: attendanceReportData.length,
    accent: 'blue',
    icon: FileBarChart
  },
  {
    id: 'payroll',
    name: 'Payroll Report',
    description: 'View employee salary, payroll, deductions and net salary details.',
    records: payrollReportData.length,
    accent: 'green',
    icon: BarChart3
  },
  {
    id: 'billing',
    name: 'Company-wise Billing Report',
    description: 'View billing information grouped by client/company.',
    records: billingReportData.length,
    accent: 'purple',
    icon: Building2
  },
  {
    id: 'employee',
    name: 'Employee Master Report',
    description: 'View employee master information and assigned company details.',
    records: mockEmployees.length,
    accent: 'indigo',
    icon: FileCheck
  },
  {
    id: 'inventory',
    name: 'Inventory Report',
    description: 'View inventory stock, issued items and return information.',
    records: inventoryReportData.length,
    accent: 'amber',
    icon: Database
  }
];

const employeeOptions = mockEmployees.map((employee) => ({
  value: employee.employeeId,
  label: `${employee.name} — ${employee.employeeId}`
}));

const reportMeta = {
  attendance: {
    title: 'Attendance Report',
    description: 'Employee attendance report for the selected period.',
    filters: ['date', 'company', 'department', 'employee'],
    summaryCards: [
      { label: 'Total Employees', value: '1,250', icon: FileBarChart, tone: styles.cardBlue },
      { label: 'Present Days', value: '30,450', icon: CheckCircle2, tone: styles.cardGreen },
      { label: 'Absent Days', value: '1,240', icon: X, tone: styles.cardOrange },
      { label: 'Leave Days', value: '1,180', icon: CalendarClock, tone: styles.cardPurple }
    ],
    placeholder: 'Search employee...'
  },
  payroll: {
    title: 'Payroll Report',
    description: 'Employee payroll report for the selected period.',
    filters: ['date', 'company', 'department', 'employee'],
    summaryCards: [
      { label: 'Employees Processed', value: '1,184', icon: FileBarChart, tone: styles.cardBlue },
      { label: 'Gross Payroll', value: '₹5,20,00,000', icon: CheckCircle2, tone: styles.cardGreen },
      { label: 'Total Deductions', value: '₹37,50,000', icon: Database, tone: styles.cardPurple },
      { label: 'Net Payroll', value: '₹4,82,50,000', icon: BarChart3, tone: styles.cardOrange }
    ],
    placeholder: 'Search employee or employee ID...'
  },
  billing: {
    title: 'Company-wise Billing Report',
    description: 'View billing information grouped by client/company.',
    filters: ['date', 'company'],
    summaryCards: [
      { label: 'Total Companies', value: '18', icon: Building2, tone: styles.cardBlue },
      { label: 'Total Employees', value: '1,250', icon: FileCheck, tone: styles.cardGreen },
      { label: 'Total Billing', value: '₹1,84,50,000', icon: Database, tone: styles.cardPurple },
      { label: 'Pending Billing', value: '₹12,40,000', icon: CalendarClock, tone: styles.cardOrange }
    ],
    placeholder: 'Search company...'
  },
  employee: {
    title: 'Employee Master Report',
    description: 'View employee master information and assigned company details.',
    filters: ['company', 'department', 'employee'],
    summaryCards: [
      { label: 'Total Employees', value: '1,250', icon: FileBarChart, tone: styles.cardBlue },
      { label: 'Active', value: '1,184', icon: CheckCircle2, tone: styles.cardGreen },
      { label: 'Inactive', value: '66', icon: X, tone: styles.cardRed },
      { label: 'Clients', value: '18', icon: Building2, tone: styles.cardPurple }
    ],
    placeholder: 'Search employee...'
  },
  inventory: {
    title: 'Inventory Report',
    description: 'View inventory stock, issued items and return information.',
    filters: ['company', 'department', 'employee', 'date'],
    summaryCards: [
      { label: 'Total Items', value: '428', icon: FileBarChart, tone: styles.cardBlue },
      { label: 'Available Stock', value: '286', icon: CheckCircle2, tone: styles.cardGreen },
      { label: 'Issued Items', value: '118', icon: Database, tone: styles.cardPurple },
      { label: 'Pending Returns', value: '24', icon: CalendarClock, tone: styles.cardOrange }
    ],
    placeholder: 'Search item...'
  }
};

const defaultReportSummaryCards = [
  { label: 'Available Reports', value: '5', icon: FileBarChart, tone: styles.cardBlue },
  { label: 'Generated Today', value: '12', icon: CheckCircle2, tone: styles.cardGreen },
  { label: 'Total Companies', value: '18', icon: Building2, tone: styles.cardPurple },
  { label: 'Total Records', value: '12,480', icon: Database, tone: styles.cardOrange }
];

const detailMap = {
  attendance: attendanceReportData,
  payroll: payrollReportData,
  billing: billingReportData,
  employee: mockEmployees,
  inventory: inventoryReportData
};

const formatCompanyName = (companyName) => companyName || 'All Companies';

function ReportSummaryCards() {
  return (
    <div className={styles.summaryGrid}>
      {defaultReportSummaryCards.map(({ label, value, icon: Icon, tone }) => (
        <div key={label} className={styles.summaryCard}>
          <div className={styles.summaryContent}>
            <span className={styles.summaryLabel}>{label}</span>
            <strong className={styles.summaryValue}>{value}</strong>
          </div>
          <span className={`${styles.summaryIcon} ${tone}`}>
            <Icon size={20} />
          </span>
        </div>
      ))}
    </div>
  );
}

function ReportCategoryCards({ onSelectReport }) {
  return (
    <section className={styles.sectionCard}>
      <div className={styles.sectionHeader}>
        <div>
          <h2 className={styles.sectionTitle}>HRMS Reports</h2>
        </div>
      </div>
      <div className={styles.reportGrid}>
        {reportCategories.map((report) => {
          const Icon = report.icon;
          return (
            <div key={report.id} className={styles.reportCard}>
              <div className={styles.reportCardHeader}>
                <span className={`${styles.reportIcon} ${report.accent}`}>
                  <Icon size={18} />
                </span>
                <span className={styles.reportRecords}>{report.records} records</span>
              </div>
              <h4>{report.name}</h4>
              <p>{report.description}</p>
              <button type="button" className={styles.primaryButton} onClick={() => onSelectReport(report.id)}>
                View Report
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function AttendanceTable({ rows }) {
  return (
    <div className={styles.tableWrap}>
      <table className={styles.dataTable}>
        <thead>
          <tr>
            <th>Employee</th>
            <th>Employee ID</th>
            <th>Company</th>
            <th>Department</th>
            <th>Working Days</th>
            <th>Present Days</th>
            <th>Absent Days</th>
            <th>Leave Days</th>
            <th>Attendance %</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((item) => (
            <tr key={item.employeeId}>
              <td>{item.employeeName}</td>
              <td>{item.employeeId}</td>
              <td>{item.clientName}</td>
              <td>{item.department}</td>
              <td>{item.workingDays}</td>
              <td>{item.presentDays}</td>
              <td>{item.absentDays}</td>
              <td>{item.leaveDays}</td>
              <td>{item.attendancePercentage.toFixed(2)}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PayrollTable({ rows }) {
  return (
    <div className={styles.tableWrap}>
      <table className={styles.dataTable}>
        <thead>
          <tr>
            <th>Employee</th>
            <th>Employee ID</th>
            <th>Company</th>
            <th>Department</th>
            <th>Basic Salary</th>
            <th>Overtime</th>
            <th>Gross Salary</th>
            <th>Deductions</th>
            <th>Net Salary</th>
            <th>Payroll Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((item, index) => (
            <tr key={`${item.employeeId}-${index}`}>
              <td>{item.employeeName}</td>
              <td>{item.employeeId}</td>
              <td>{item.clientName}</td>
              <td>{item.department}</td>
              <td>{formatCurrency(item.basicSalary)}</td>
              <td>{formatCurrency(item.overtime)}</td>
              <td>{formatCurrency(item.grossSalary)}</td>
              <td>{formatCurrency(item.deductions)}</td>
              <td>{formatCurrency(item.netSalary)}</td>
              <td><span className={`${styles.statusBadge} ${statusClassName(item.status)}`}>{item.status}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function BillingTable({ rows }) {
  return (
    <div className={styles.tableWrap}>
      <table className={styles.dataTable}>
        <thead>
          <tr>
            <th>Company</th>
            <th>Total Employees</th>
            <th>Billing Period</th>
            <th>Total Attendance</th>
            <th>Total Overtime</th>
            <th>Gross Billing</th>
            <th>Deductions</th>
            <th>Net Billing</th>
            <th>Billing Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((item) => (
            <tr key={item.id}>
              <td>{item.companyName}</td>
              <td>{item.totalEmployees}</td>
              <td>{item.billingPeriod}</td>
              <td>{item.totalAttendance}</td>
              <td>{formatCurrency(item.overtimeAmount)}</td>
              <td>{formatCurrency(item.grossBilling)}</td>
              <td>{formatCurrency(item.deductions)}</td>
              <td>{formatCurrency(item.netBilling)}</td>
              <td><span className={`${styles.statusBadge} ${statusClassName(item.status)}`}>{item.status}</span></td>
              <td><button type="button" className={styles.linkButton}>View Details</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function EmployeeMasterTable({ rows }) {
  return (
    <div className={styles.tableWrap}>
      <table className={styles.dataTable}>
        <thead>
          <tr>
            <th>Employee</th>
            <th>Employee ID</th>
            <th>Company</th>
            <th>Department</th>
            <th>Designation</th>
            <th>Joining Date</th>
            <th>Employment Type</th>
            <th>Contact</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((item) => (
            <tr key={item.id}>
              <td>{item.name}</td>
              <td>{item.employeeId}</td>
              <td>{item.companyName}</td>
              <td>{item.department}</td>
              <td>{item.designation}</td>
              <td>{formatDate(item.joiningDate || '2025-01-12')}</td>
              <td>Full Time</td>
              <td>{item.contact || '98XXXXXX12'}</td>
              <td><span className={`${styles.statusBadge} ${statusClassName(item.status)}`}>{item.status === 'active' ? 'Active' : 'Inactive'}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function InventoryTable({ rows }) {
  return (
    <div className={styles.tableWrap}>
      <table className={styles.dataTable}>
        <thead>
          <tr>
            <th>Item</th>
            <th>Item ID</th>
            <th>Category</th>
            <th>Company</th>
            <th>Total Quantity</th>
            <th>Available</th>
            <th>Issued</th>
            <th>Damaged</th>
            <th>Lost</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((item) => (
            <tr key={item.itemId}>
              <td>{item.item}</td>
              <td>{item.itemId}</td>
              <td>{item.category}</td>
              <td>{item.client}</td>
              <td>{item.totalQuantity}</td>
              <td>{item.available}</td>
              <td>{item.issued}</td>
              <td>{item.damaged}</td>
              <td>{item.lost}</td>
              <td><span className={`${styles.statusBadge} ${statusClassName(item.status)}`}>{item.status}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ReportFilters({ selectedReport, filters, setFilter, onGenerateReport, onResetFilters }) {
  const meta = reportMeta[selectedReport] || reportMeta.attendance;
  const showDate = meta.filters.includes('date');
  const showCompany = meta.filters.includes('company');
  const showDepartment = meta.filters.includes('department');
  const showEmployee = meta.filters.includes('employee');

  return (
    <div className={styles.filterCard}>
      <div className={styles.filterHeader}>
        <div className={styles.filterTitleWrap}>
          <Filter size={16} />
          <h3>Report Filters</h3>
        </div>
      </div>

      <div className={styles.filterGrid}>
        {showDate && (
          <>
            <div className={styles.fieldGroup}>
              <label>From Date</label>
              <input type="date" value={filters.fromDate} onChange={(e) => setFilter('fromDate', e.target.value)} />
            </div>
            <div className={styles.fieldGroup}>
              <label>To Date</label>
              <input type="date" value={filters.toDate} onChange={(e) => setFilter('toDate', e.target.value)} />
            </div>
          </>
        )}

        {showCompany && (
          <div className={styles.fieldGroup}>
            <label>Company</label>
            <select value={filters.company} onChange={(e) => setFilter('company', e.target.value)}>
              <option value="All Companies">All Companies</option>
              {mockCompanies.map((company) => (
                <option key={company.id} value={company.name}>{company.name}</option>
              ))}
            </select>
          </div>
        )}

        {showDepartment && (
          <div className={styles.fieldGroup}>
            <label>Department</label>
            <select value={filters.department} onChange={(e) => setFilter('department', e.target.value)}>
              <option value="All Departments">All Departments</option>
              {mockDepartments.map((department) => (
                <option key={department} value={department}>{department}</option>
              ))}
            </select>
          </div>
        )}

        {showEmployee && (
          <div className={styles.fieldGroup}>
            <label>Employee</label>
            <select value={filters.employee} onChange={(e) => setFilter('employee', e.target.value)}>
              <option value="All Employees">All Employees</option>
              {employeeOptions.map((option) => (
                <option key={option.value} value={option.label}>{option.label}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className={styles.filterActions}>
        <button type="button" className={styles.primaryButton} onClick={onGenerateReport}>
          Generate Report
        </button>
        <button type="button" className={styles.secondaryButton} onClick={onResetFilters}>
          Reset
        </button>
      </div>
    </div>
  );
}

function ReportBody({ activeReport, searchTerm, filters, setFilter, onGenerateReport, onResetFilters, setExportOpen }) {
  const meta = reportMeta[activeReport] || reportMeta.attendance;
  const summaryCards = meta.summaryCards;

  const filteredRows = useMemo(() => {
    const dataset = detailMap[activeReport] || [];
    const query = searchTerm.toLowerCase();

    return dataset.filter((row) => {
      let matches = true;

      if (query) {
        const haystack = JSON.stringify(row).toLowerCase();
        matches = haystack.includes(query);
      }

      if (filters.company !== 'All Companies') {
        const rowCompany = row.companyName || row.clientName || row.company || '';
        if (rowCompany !== filters.company) {
          matches = false;
        }
      }

      if (filters.department !== 'All Departments' && row.department && row.department !== filters.department) {
        matches = false;
      }

      if (filters.employee !== 'All Employees') {
        const employeeLabel = `${row.employeeName || row.name || ''} — ${row.employeeId || ''}`;
        if (!employeeLabel.includes(filters.employee.split(' — ')[0] || '')) {
          matches = false;
        }
      }

      return matches;
    });
  }, [activeReport, filters, searchTerm]);

  const renderTable = () => {
    if (activeReport === 'attendance') return <AttendanceTable rows={filteredRows} />;
    if (activeReport === 'payroll') return <PayrollTable rows={filteredRows} />;
    if (activeReport === 'billing') return <BillingTable rows={filteredRows} />;
    if (activeReport === 'employee') return <EmployeeMasterTable rows={filteredRows} />;
    if (activeReport === 'inventory') return <InventoryTable rows={filteredRows} />;
    return null;
  };

  return (
    <section className={styles.reportPanel}>
      <div className={styles.reportIntroRow}>
        <div>
          <button type="button" className={styles.backLink} onClick={() => setFilter('activeReport', null)}>
            <ArrowLeft size={16} /> Back to Reports
          </button>
        </div>
        <div className={styles.reportToolbar}>
          <button type="button" className={styles.primaryButtonSmall} onClick={onGenerateReport}>Generate Report</button>
          <button type="button" className={styles.primaryButtonSmall} onClick={() => setExportOpen(true)}>
            <Download size={14} /> Export
          </button>
          <button type="button" className={styles.secondaryButton} onClick={() => window.print()}>
            <Printer size={14} /> Print
          </button>
        </div>
      </div>

      <div className={styles.reportPreviewCard}>
        {/* <div className={styles.previewHeader}>
          <div>
            <p className={styles.previewLabel}>{meta.title}</p>
            <h3>{meta.title}</h3>
          </div>
        </div> */}
        <div className={styles.previewGrid}>
          <div>
            <span>Selected Period</span>
            <strong>{filters.fromDate && filters.toDate ? `${formatDate(filters.fromDate)} - ${formatDate(filters.toDate)}` : '01 Aug 2026 - 31 Aug 2026'}</strong>
          </div>
          <div>
            <span>Company</span>
            <strong>{formatCompanyName(filters.company)}</strong>
          </div>
          <div>
            <span>Department</span>
            <strong>{filters.department}</strong>
          </div>
          <div>
            <span>Total Records</span>
            <strong>{filteredRows.length}</strong>
          </div>
        </div>
      </div>

      <div className={styles.dynamicSummaryGrid}>
        {summaryCards.map(({ label, value, icon: Icon, tone }) => (
          <div key={label} className={styles.summaryCard}>
            <div className={styles.summaryContent}>
              <span className={styles.summaryLabel}>{label}</span>
              <strong className={styles.summaryValue}>{value}</strong>
            </div>
            <span className={`${styles.summaryIcon} ${tone}`}>
              <Icon size={20} />
            </span>
          </div>
        ))}
      </div>

      <ReportFilters
        selectedReport={activeReport}
        filters={filters}
        setFilter={setFilter}
        onGenerateReport={onGenerateReport}
        onResetFilters={onResetFilters}
      />

      <div className={styles.toolbarRow}>
        <div className={styles.searchBox}>
          <Search size={15} />
          <input
            type="text"
            value={searchTerm}
            onChange={(event) => setFilter('searchTerm', event.target.value)}
            placeholder={meta.placeholder}
          />
        </div>
      </div>

      {filteredRows.length ? (
        <>
          {renderTable()}
          <Pagination currentPage={1} totalItems={filteredRows.length} itemsPerPage={PAGE_SIZE} onPageChange={() => {}} label="records" />
        </>
      ) : (
        <div className={styles.emptyStateCard}>
          <h3>No report records found.</h3>
          <p>Try changing your filters.</p>
        </div>
      )}
    </section>
  );
}

function ExportReportModal({ isOpen, onClose, selectedReport, onExport }) {
  const reportName = reportMeta[selectedReport]?.title || 'Attendance Report';
  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalCard} onClick={(event) => event.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3>Export Report</h3>
          <button type="button" className={styles.closeButton} aria-label="Close modal" onClick={onClose}><X size={18} /></button>
        </div>

        <div className={styles.modalForm}>
          <div className={styles.fieldGroup}>
            <label>Report</label>
            <input type="text" value={reportName} readOnly />
          </div>
          <div className={styles.fieldGroup}>
            <label>Period</label>
            <input type="text" value="August 2026" readOnly />
          </div>
          <div className={styles.fieldGroup}>
            <label>Company</label>
            <input type="text" value="All Companies" readOnly />
          </div>
          <div className={styles.fieldGroup}>
            <label>Format</label>
            <select defaultValue="Excel">
              <option>Excel</option>
              <option>PDF</option>
            </select>
          </div>
        </div>

        <div className={styles.modalActions}>
          <button type="button" className={styles.secondaryButton} onClick={onClose}>Cancel</button>
          <button type="button" className={styles.primaryButton} onClick={onExport}>Export</button>
        </div>
      </div>
    </div>
  );
}

function Reports() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab') || searchParams.get('type');

  const validReportTypes = ['attendance', 'payroll', 'billing', 'employee', 'inventory'];
  const initialActive = tabParam && validReportTypes.includes(tabParam) ? tabParam : null;

  const [activeReport, setActiveReport] = useState(initialActive);
  const [searchTerm, setSearchTerm] = useState('');
  const [toastMessage, setToastMessage] = useState(null);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [filters, setFilters] = useState({
    fromDate: DEFAULT_PERIOD.fromDate,
    toDate: DEFAULT_PERIOD.toDate,
    company: 'All Companies',
    department: 'All Departments',
    employee: 'All Employees'
  });

  // Sync activeReport state with URL search parameters
  useEffect(() => {
    const currentTab = searchParams.get('tab') || searchParams.get('type');
    if (currentTab && validReportTypes.includes(currentTab)) {
      setActiveReport(currentTab);
    } else {
      setActiveReport(null);
    }
  }, [searchParams]);

  const updateFilter = (key, value) => setFilters((current) => ({ ...current, [key]: value }));

  const handleSelectReport = (reportId) => {
    navigate(`/admin/reports?tab=${reportId}`);
    setSearchTerm('');
  };

  const handleBackToReports = () => {
    navigate('/admin/reports');
    setSearchTerm('');
  };

  const handleGenerateReport = () => {
    setIsGenerating(true);
    setToastMessage('Generating report...');

    window.setTimeout(() => {
      setIsGenerating(false);
      setToastMessage('✓ Report generated successfully.');
    }, 450);
  };

  const handleExport = () => {
    setToastMessage('Preparing report...');
    setTimeout(() => {
      setIsExportOpen(false);
      setToastMessage('✓ Report exported successfully.');
    }, 400);
  };

  const handleResetFilters = () => {
    setFilters({
      fromDate: DEFAULT_PERIOD.fromDate,
      toDate: DEFAULT_PERIOD.toDate,
      company: 'All Companies',
      department: 'All Departments',
      employee: 'All Employees'
    });
    setSearchTerm('');
    setToastMessage('✓ Report filters reset.');
  };

  const displayTitle = activeReport ? reportMeta[activeReport]?.title : 'Reports Management';
  const displayDescription = activeReport ? reportMeta[activeReport]?.description : 'View, generate and export HRMS reports from a single dashboard.';

  return (
    <AdminLayout>
      <div className={styles.container}>
        {toastMessage && <Toast message={toastMessage} type="success" onClose={() => setToastMessage(null)} />}

        <div className={styles.breadcrumb}>
          <span 
            onClick={() => navigate('/admin/dashboard')} 
            style={{ cursor: 'pointer' }}
          >
            Dashboard
          </span>
          <span>/</span>
          <span 
            onClick={handleBackToReports}
            style={{ 
              cursor: activeReport ? 'pointer' : 'default',
              color: activeReport ? 'var(--primary-color, #2563eb)' : 'inherit',
              fontWeight: activeReport ? 500 : 600
            }}
          >
            Reports
          </span>
          {activeReport && (
            <>
              <span>/</span>
              <strong>{reportMeta[activeReport]?.title}</strong>
            </>
          )}
        </div>

        <header className={styles.pageHeader}>
          <div className={styles.pageHeaderContent}>
            <div>
              <h1>{displayTitle}</h1>
            </div>
            <p className={styles.pageDescription}>{displayDescription}</p>
          </div>
          <button type="button" className={styles.primaryButton} onClick={() => setIsExportOpen(true)}>
            <Download size={16} /> Export Report
          </button>
        </header>

        {!activeReport ? (
          <>
            <ReportSummaryCards />
            <ReportCategoryCards onSelectReport={handleSelectReport} />
          </>
        ) : (
          <ReportBody
            activeReport={activeReport}
            searchTerm={searchTerm}
            filters={filters}
            setFilter={(key, value) => {
              if (key === 'activeReport') {
                if (value) {
                  navigate(`/admin/reports?tab=${value}`);
                } else {
                  handleBackToReports();
                }
              } else if (key === 'searchTerm') {
                setSearchTerm(value);
              } else {
                updateFilter(key, value);
              }
            }}
            onGenerateReport={handleGenerateReport}
            onResetFilters={handleResetFilters}
            setExportOpen={setIsExportOpen}
          />
        )}

        <ExportReportModal isOpen={isExportOpen} onClose={() => setIsExportOpen(false)} selectedReport={activeReport} onExport={handleExport} />
      </div>
    </AdminLayout>
  );
}

export default Reports;
