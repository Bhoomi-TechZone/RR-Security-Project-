import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  FileBarChart,
  ClipboardCheck,
  Users,
  Receipt,
  WalletCards,
  Download,
  Filter,
  Calendar,
  Building,
  CheckCircle2,
  FileSpreadsheet,
  FileText,
  Search
} from 'lucide-react';
import styles from './ClientReports.module.css';
import { useClientAuth } from '../../context/ClientAuthContext';
import {
  CLIENT_REPORTS_METADATA,
  CLIENT_ATTENDANCE_RECORDS,
  CLIENT_EMPLOYEES_LIST,
  CLIENT_BILLING_INVOICES
} from '../../data/clientPortalData';
import Toast from '../../components/common/Toast';
import StatusBadge from '../../components/common/StatusBadge';

// Mock read-only payroll records for ABC Security Services workforce
const CLIENT_PAYROLL_RECORDS = [
  {
    id: 'pay-001',
    employeeCode: 'EMP001',
    employeeName: 'Rahul Kumar',
    designation: 'Security Supervisor',
    daysWorked: 30,
    grossSalary: 30000,
    pfDeduction: 1800,
    esicDeduction: 225,
    netPayable: 27975,
    status: 'Disbursed'
  },
  {
    id: 'pay-002',
    employeeCode: 'EMP002',
    employeeName: 'Amit Sharma',
    designation: 'Security Officer',
    daysWorked: 30,
    grossSalary: 28000,
    pfDeduction: 1800,
    esicDeduction: 210,
    netPayable: 25990,
    status: 'Disbursed'
  },
  {
    id: 'pay-003',
    employeeCode: 'EMP006',
    employeeName: 'Vikram Singh',
    designation: 'CCTV Specialist',
    daysWorked: 30,
    grossSalary: 29000,
    pfDeduction: 1800,
    esicDeduction: 217,
    netPayable: 26983,
    status: 'Disbursed'
  },
  {
    id: 'pay-004',
    employeeCode: 'EMP011',
    employeeName: 'Deepak Verma',
    designation: 'Armed Guard',
    daysWorked: 28,
    grossSalary: 32000,
    pfDeduction: 1800,
    esicDeduction: 240,
    netPayable: 29960,
    status: 'Disbursed'
  },
  {
    id: 'pay-005',
    employeeCode: 'EMP015',
    employeeName: 'Suresh Rawat',
    designation: 'Patrol Officer',
    daysWorked: 30,
    grossSalary: 24000,
    pfDeduction: 1800,
    esicDeduction: 180,
    netPayable: 22020,
    status: 'Disbursed'
  }
];

function ClientReports() {
  const location = useLocation();
  const { clientCompany } = useClientAuth();

  // Parse query param e.g. /client/reports?type=attendance
  const queryType = new URLSearchParams(location.search).get('type');

  const [activeReportId, setActiveReportId] = useState(
    queryType ? `${queryType}-report` : 'attendance-report'
  );

  const [periodFilter, setPeriodFilter] = useState('Aug 2026');
  const [deptFilter, setDeptFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  useEffect(() => {
    if (queryType) {
      const match = CLIENT_REPORTS_METADATA.find(
        (r) => r.id.startsWith(queryType) || r.id === `${queryType}-report`
      );
      if (match) setActiveReportId(match.id);
    }
  }, [queryType]);

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
  };

  const handleExport = (format) => {
    const reportObj = CLIENT_REPORTS_METADATA.find((r) => r.id === activeReportId);
    showToast(
      `${reportObj?.title || 'Report'} exported as ${format} for ${clientCompany?.name}.`,
      'success'
    );
  };

  const currentReport = CLIENT_REPORTS_METADATA.find((r) => r.id === activeReportId);

  return (
    <div className={styles.container}>
      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ show: false, message: '', type: 'success' })}
        />
      )}

      {/* Header */}
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Company Reports</h1>
          <p className={styles.pageSubtitle}>
            Downloadable workforce, attendance, billing, and read-only payroll reports scoped to your organization.
          </p>
        </div>

        <div className={styles.exportBtnGroup}>
          <button
            type="button"
            className={styles.exportBtn}
            onClick={() => handleExport('Excel')}
          >
            <FileSpreadsheet size={15} color="#16a34a" />
            <span>Export Excel</span>
          </button>
          <button
            type="button"
            className={styles.exportBtn}
            onClick={() => handleExport('PDF')}
          >
            <FileText size={15} color="#dc2626" />
            <span>Export PDF</span>
          </button>
        </div>
      </div>

      {/* 4 Report Cards */}
      <div className={styles.reportCardsGrid}>
        {CLIENT_REPORTS_METADATA.map((rpt) => {
          const isSelected = rpt.id === activeReportId;
          return (
            <div
              key={rpt.id}
              className={`${styles.reportCard} ${isSelected ? styles.reportCardActive : ''}`}
              onClick={() => setActiveReportId(rpt.id)}
            >
              <div className={styles.reportCardTop}>
                <div className={`${styles.reportIconWrap} ${styles[`tone_${rpt.accent}`]}`}>
                  <FileBarChart size={18} />
                </div>
                {isSelected && (
                  <span className={styles.activeTag}>
                    <CheckCircle2 size={12} /> Active Preview
                  </span>
                )}
              </div>
              <h3 className={styles.reportCardTitle}>{rpt.title}</h3>
              {/* <p className={styles.reportCardDesc}>{rpt.description}</p> */}
              <div className={styles.reportCardFooter}>
                <span className={styles.recordCount}>{rpt.recordCount} Records</span>
                <span className={styles.lastGen}>Updated: {rpt.lastGenerated}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Preview Section Header & Filters */}
      <div className={styles.previewCard}>
        <div className={styles.previewHeader}>
          <div>
            <h2 className={styles.previewTitle}>{currentReport?.title}</h2>
            <p className={styles.previewSubtitle}>
              Data Scope: <strong>{clientCompany?.name}</strong> • Period: {periodFilter}
            </p>
          </div>

          <div className={styles.filterControls}>
            <div className={styles.searchBox}>
              <Search size={14} className={styles.searchIcon} />
              <input
                type="text"
                placeholder="Search report records..."
                className={styles.searchInput}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <select
              className={styles.selectInput}
              value={periodFilter}
              onChange={(e) => setPeriodFilter(e.target.value)}
            >
              <option value="Aug 2026">August 2026</option>
              <option value="Jul 2026">July 2026</option>
              <option value="Jun 2026">June 2026</option>
              <option value="Q2 2026">Q2 2026 (Apr - Jun)</option>
              <option value="YTD 2026">YTD 2026</option>
            </select>
          </div>
        </div>

        {/* Dynamic Report Data Table depending on active report */}
        <div className={styles.tableResponsive}>
          {activeReportId === 'attendance-report' && (
            <table className={styles.dataTable}>
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Assigned Site</th>
                  <th>Shift</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>In Time</th>
                  <th>Out Time</th>
                  <th>Total Hours</th>
                </tr>
              </thead>
              <tbody>
                {CLIENT_ATTENDANCE_RECORDS.map((rec) => (
                  <tr key={rec.id}>
                    <td>
                      <strong>{rec.employeeName}</strong>
                      <span className={styles.subCode}>{rec.employeeCode}</span>
                    </td>
                    <td>{rec.site}</td>
                    <td>{rec.shift}</td>
                    <td>{rec.date}</td>
                    <td><StatusBadge status={rec.status} /></td>
                    <td>{rec.inTime}</td>
                    <td>{rec.outTime}</td>
                    <td><strong>{rec.workingHours}</strong></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activeReportId === 'employee-master-report' && (
            <table className={styles.dataTable}>
              <thead>
                <tr>
                  <th>Employee Code</th>
                  <th>Name</th>
                  <th>Designation</th>
                  <th>Department</th>
                  <th>Assigned Site</th>
                  <th>Joining Date</th>
                  <th>Police Verification</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {CLIENT_EMPLOYEES_LIST.map((emp) => (
                  <tr key={emp.id}>
                    <td><span className={styles.codePill}>{emp.employeeCode}</span></td>
                    <td><strong>{emp.name}</strong></td>
                    <td>{emp.designation}</td>
                    <td>{emp.department}</td>
                    <td>{emp.site}</td>
                    <td>{emp.joiningDate}</td>
                    <td><span className={styles.verifiedText}>{emp.policeVerification}</span></td>
                    <td><StatusBadge status={emp.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activeReportId === 'billing-report' && (
            <table className={styles.dataTable}>
              <thead>
                <tr>
                  <th>Invoice No.</th>
                  <th>Billing Period</th>
                  <th>Personnel Count</th>
                  <th>Gross Amount</th>
                  <th>Paid Amount</th>
                  <th>Pending Amount</th>
                  <th>Due Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {CLIENT_BILLING_INVOICES.map((inv) => (
                  <tr key={inv.id}>
                    <td><span className={styles.codePill}>{inv.invoiceNo}</span></td>
                    <td><strong>{inv.billingPeriod}</strong></td>
                    <td>{inv.totalManpowerCount} Pax</td>
                    <td><strong>₹{inv.grossAmount.toLocaleString('en-IN')}</strong></td>
                    <td><span className={styles.paidText}>₹{inv.paidAmount.toLocaleString('en-IN')}</span></td>
                    <td>
                      <span className={inv.pendingAmount > 0 ? styles.pendingText : styles.settledText}>
                        ₹{inv.pendingAmount.toLocaleString('en-IN')}
                      </span>
                    </td>
                    <td>{inv.dueDate}</td>
                    <td><StatusBadge status={inv.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activeReportId === 'payroll-report' && (
            <>
              <div className={styles.readOnlyPayrollBanner}>
                <WalletCards size={16} />
                <span>
                  <strong>Read-Only Client View:</strong> Wage and statutory disbursement statement for personnel deployed at {clientCompany?.name}. Payroll calculations and statutory setups are managed centrally by HRMS Admin.
                </span>
              </div>
              <table className={styles.dataTable}>
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Designation</th>
                    <th>Days Worked</th>
                    <th>Gross Salary</th>
                    <th>PF Deduction</th>
                    <th>ESIC Deduction</th>
                    <th>Net Disbursed</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {CLIENT_PAYROLL_RECORDS.map((pay) => (
                    <tr key={pay.id}>
                      <td>
                        <strong>{pay.employeeName}</strong>
                        <span className={styles.subCode}>{pay.employeeCode}</span>
                      </td>
                      <td>{pay.designation}</td>
                      <td>{pay.daysWorked} Days</td>
                      <td>₹{pay.grossSalary.toLocaleString('en-IN')}</td>
                      <td>₹{pay.pfDeduction.toLocaleString('en-IN')}</td>
                      <td>₹{pay.esicDeduction.toLocaleString('en-IN')}</td>
                      <td><strong>₹{pay.netPayable.toLocaleString('en-IN')}</strong></td>
                      <td><StatusBadge status="Approved" text={pay.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default ClientReports;
