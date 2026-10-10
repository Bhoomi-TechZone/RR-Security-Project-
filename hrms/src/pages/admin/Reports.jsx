import React, { useMemo, useState, useEffect, useCallback } from 'react';
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
  RefreshCw,
  X
} from 'lucide-react';
import AdminLayout from '../../components/layout/AdminLayout';
import Pagination from '../../components/common/Pagination';
import Toast from '../../components/common/Toast';
import { reportService } from '../../services/reportService';
import { generateReportPdf } from '../../utils/pdfExportUtil';
import { generateReportExcel } from '../../utils/excelExportUtil';
import styles from './Reports.module.css';

const PAGE_SIZE = 10;

const getCurrentMonthStr = () => {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${yyyy}-${mm}`;
};

const currencyFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0
});

const formatCurrency = (value) => {
  if (typeof value === 'object' && value !== null) {
    value = value.amount ?? value.value ?? value.total ?? 0;
  }
  const num = Number(value);
  if (!isNaN(num) && typeof value !== 'boolean' && value !== '' && value !== null) {
    return currencyFormatter.format(num);
  }
  if (!value) return '₹0';
  return String(value);
};

const formatDate = (value) => {
  if (typeof value === 'object' && value !== null) {
    value = value.date || value.value || '';
  }
  if (!value) return '—';
  const str = String(value);
  const date = new Date(str.includes('T') ? str : `${str}T00:00:00`);
  if (Number.isNaN(date.getTime())) return str;
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }).format(date);
};

const statusClassName = (status) => {
  const normalized = String(typeof status === 'object' ? (status?.name || status?.label || '') : (status || '')).toLowerCase();
  if (['approved', 'processed', 'completed', 'good', 'active'].includes(normalized)) return styles.statusApproved;
  if (['pending', 'average', 'low stock'].includes(normalized)) return styles.statusPending;
  if (['rejected', 'low', 'inactive', 'out of stock'].includes(normalized)) return styles.statusRejected;
  return styles.statusNeutral;
};

const reportCategoryConfigs = [
  {
    id: 'payroll',
    name: 'Payroll & Wage Register',
    description: 'Statutory Wage & Salary Register with attendance breakdown, wage rates, earnings & deductions.',
    accent: 'green',
    icon: BarChart3
  },
  {
    id: 'attendance',
    name: 'Attendance Muster Roll',
    description: 'View employee attendance records, duty hours, leaves, and attendance percentage summary.',
    accent: 'blue',
    icon: FileBarChart
  },
  {
    id: 'billing',
    name: 'Company Billing Statement',
    description: 'View billing information grouped by client/company with deployed workforce and overtime.',
    accent: 'purple',
    icon: Building2
  },
  {
    id: 'employee',
    name: 'Employee Master Register',
    description: 'View complete employee master profiles, statutory numbers (PF/ESI/UAN) and bank details.',
    accent: 'indigo',
    icon: FileCheck
  },
  {
    id: 'inventory',
    name: 'Inventory & Asset Register',
    description: 'View inventory stock, issued uniforms, assets, damaged/lost items and total valuations.',
    accent: 'amber',
    icon: Database
  }
];

const reportMeta = {
  payroll: {
    title: 'Wage & Salary Register',
    description: 'Statutory employee wage, attendance, earnings, deductions and net payable register.',
    filters: ['month', 'company', 'department', 'employee'],
    placeholder: 'Search employee by name, ID, designation...'
  },
  attendance: {
    title: 'Attendance Report',
    description: 'Employee attendance muster roll for the selected period.',
    filters: ['month', 'company', 'department', 'employee'],
    placeholder: 'Search employee name or ID...'
  },
  billing: {
    title: 'Company-wise Billing Report',
    description: 'View monthly billing statements and contract hours grouped by client company.',
    filters: ['month', 'company'],
    placeholder: 'Search client or company...'
  },
  employee: {
    title: 'Employee Master Report',
    description: 'Complete employee master register, statutory numbers and bank details.',
    filters: ['company', 'department', 'employee'],
    placeholder: 'Search employee, designation, department...'
  },
  inventory: {
    title: 'Inventory & Asset Report',
    description: 'View inventory stock, issued uniforms, assets, returns and valuations.',
    filters: ['category', 'itemType', 'status'],
    placeholder: 'Search item name, code, brand, category or location...'
  }
};

/* =========================================================
   1. Wage / Salary Register Table (Matching Image 2 Layout)
   ========================================================= */
function WageSalaryRegisterTable({ reportData }) {
  const records = reportData?.records || [];
  const company = reportData?.companyInfo || {
    name: 'RR Security & Facilities',
    address: 'G/75A Block-G M.B. Exten. Badarpur New Delhi-110044',
    pfNo: 'DSNHP3718318000',
    esiNo: '20001853160000999'
  };
  const period = reportData?.period || {};
  const totals = reportData?.totals || {};

  return (
    <div className={styles.registerPaper}>
      {/* Official Header */}
      <div className={styles.officialHeader}>
        <div className={styles.officialCompanyInfo}>
          <h2 className={styles.officialCompanyName}>{company.name || 'RR Security & Facilities'}</h2>
          <p className={styles.officialCompanyAddress}>{company.address || 'G/75A Block-G M.B. Exten. Badarpur New Delhi-110044'}</p>
        </div>
        <div className={styles.officialStatutoryRules}>
          <span>(1) Form under Rule - 5 of Equal Remuneration Rules 1976.</span>
          <span>(2) Form under Rule - 21(4) 25(2) 26(1) and 26(2) of Gujarat Minimum Wages Rules 1961</span>
          <span>(3) Form under Rule - 6 of Payment of Wages (Gujarat) Rules 1963.</span>
          <span>(4) Form 17 under Rule - 78 of Contract Labour (Regulation & Abolition) Central/Gujarat Rules 1972</span>
          <span>(5) Form under Rule - 52(2) of Inter State Migrant Workers (Gujarat) Rules 1981</span>
        </div>
      </div>

      {/* Sub Bar */}
      <div className={styles.officialSubBar}>
        <div className={styles.officialMetaLeft}>
          <div><strong>PF No :-</strong> {company.pfNo || 'DSNHP3718318000'}</div>
          <div><strong>ESI No :-</strong> {company.esiNo || '20001853160000999'}</div>
        </div>
        <div className={styles.officialMetaCenter}>
          Wage/Salary Register
        </div>
        <div className={styles.officialMetaRight}>
          <div><strong>For The Month Of :</strong> {period.monthLabel || period.month || 'Current Month'}</div>
          <div style={{ fontSize: '10.5px', color: '#475569', fontWeight: 500 }}>
            Date of Payment :- {formatDate(period.toDate || new Date().toISOString().slice(0, 10))}
          </div>
        </div>
      </div>

      {/* Multi-Tier Register Table */}
      <div className={styles.registerTableWrap}>
        <table className={styles.registerTable}>
          <thead>
            <tr>
              <th rowSpan="2" style={{ width: '32px' }}>Sr.<br />No.</th>
              <th rowSpan="2" style={{ minWidth: '170px' }}>Employee Name<br /><span style={{ fontWeight: 'normal', fontSize: '9px' }}>Designation / Department</span></th>
              <th rowSpan="2" style={{ width: '60px' }}>Emp. ID</th>
              <th rowSpan="2" style={{ minWidth: '100px' }}>Details<br />of<br />Attendance</th>
              <th rowSpan="2" style={{ minWidth: '110px' }}>Rate of<br />Wages</th>
              <th colSpan="4" style={{ background: '#f1f5f9' }}>Earnings</th>
              <th rowSpan="2" style={{ minWidth: '85px' }}>Gross<br />Salary</th>
              <th colSpan="4" style={{ background: '#f1f5f9' }}>Deduction</th>
              <th rowSpan="2" style={{ minWidth: '65px' }}>Gross<br />Deduct.</th>
              <th rowSpan="2" style={{ minWidth: '85px' }}>Net<br />Payable</th>
              <th rowSpan="2" style={{ minWidth: '120px' }}>Signature</th>
            </tr>
            <tr>
              {/* Earnings Sub-headers */}
              <th style={{ minWidth: '55px', fontSize: '9px' }}>BASIC<br />DA</th>
              <th style={{ minWidth: '55px', fontSize: '9px' }}>HRA<br />OTH.All</th>
              <th style={{ minWidth: '45px', fontSize: '9px' }}>CONV</th>
              <th style={{ minWidth: '55px', fontSize: '9px' }}>SP.All<br />OT/PIB</th>

              {/* Deduction Sub-headers */}
              <th style={{ minWidth: '50px', fontSize: '9px' }}>P.F<br />ESI</th>
              <th style={{ minWidth: '50px', fontSize: '9px' }}>P.T.<br />I.T.<br />LWF</th>
              <th style={{ minWidth: '50px', fontSize: '9px' }}>Advance<br />LOAN<br />Food</th>
              <th style={{ minWidth: '50px', fontSize: '9px' }}>Oth.Ded<br />E/Mbill</th>
            </tr>
          </thead>
          <tbody>
            {records.map((row, index) => {
              const att = row.attendance || {};
              const rate = row.rateOfWages || {};
              const earn = row.earnings || {};
              const ded = row.deductions || {};

              return (
                <tr key={row.employeeId ? `${row.employeeId}-${index}` : `wage-${index}`}>
                  {/* 1. Sr. No. */}
                  <td className={styles.textCenter}><strong>{row.srNo || index + 1}</strong></td>

                  {/* 2. Employee Details */}
                  <td className={styles.empDetailsCell}>
                    <div className={styles.empNameMain}>{row.name}</div>
                    <div className={styles.empSubText}>{row.designation}</div>
                    <div className={styles.empSubText} style={{ fontWeight: 600 }}>{row.department}</div>
                    <div className={styles.empSubText}>UAN No: {row.uan || '-'}</div>
                    <div className={styles.empSubText}>PF No: {row.pfNo || '-'}</div>
                    <div className={styles.empSubText}>ESI No: {row.esiNo || '-'}</div>
                  </td>

                  {/* 3. Emp. ID */}
                  <td className={styles.textCenter} style={{ fontWeight: 700 }}>
                    {row.employeeId}
                  </td>

                  {/* 4. Details of Attendance */}
                  <td>
                    <div className={styles.stackedMetrics}>
                      <div className={styles.stackedMetricRow}><span>WD</span><span>{att.wd || '30.00'}</span></div>
                      <div className={styles.stackedMetricRow}><span>WO</span><span>{att.wo || '0.00'}</span></div>
                      <div className={styles.stackedMetricRow}><span>PH</span><span>{att.ph || '0.00'}</span></div>
                      <div className={styles.stackedMetricRow}><span>PD</span><span>{att.pd || '30.00'}</span></div>
                      <div className={styles.stackedMetricRow}><span>PL</span><span>{att.pl || '0.00'}</span></div>
                      <div className={styles.stackedMetricRow}><span>CL</span><span>{att.cl || '0.00'}</span></div>
                      <div className={styles.stackedMetricRow}><span>S.L.</span><span>{att.sl || '0.00'}</span></div>
                      <div className={styles.stackedMetricRow}><span>ML/Adj</span><span>{att.mlAdj || '0.00'}</span></div>
                      <div className={styles.stackedMetricRow} style={{ borderTop: '1px solid #000', fontWeight: 800 }}>
                        <span>TOT</span><span>{att.tot || '30.00'}</span>
                      </div>
                    </div>
                  </td>

                  {/* 5. Rate of Wages */}
                  <td className={styles.rateWageCell}>
                    <div className={styles.stackedMetrics}>
                      <div className={styles.stackedMetricRow}><span>BASIC</span><span>{rate.basic || '0.00'}</span></div>
                      <div className={styles.stackedMetricRow}><span>DA</span><span>{rate.da || '0.00'}</span></div>
                      <div className={styles.stackedMetricRow}><span>HRA</span><span>{rate.hra || '0.00'}</span></div>
                      <div className={styles.stackedMetricRow}><span>CONV</span><span>{rate.conv || '0.00'}</span></div>
                      <div className={styles.stackedMetricRow}><span>SP.All</span><span>{rate.spAll || '0.00'}</span></div>
                      <div className={styles.stackedMetricRow}><span>OTH.All</span><span>{rate.othAll || '0.00'}</span></div>
                      <div className={styles.stackedMetricRow} style={{ borderTop: '1px solid #000', fontWeight: 800 }}>
                        <span>Total</span><span>{rate.total || '0.00'}</span>
                      </div>
                    </div>
                  </td>

                  {/* 6. Earnings (Col 1: Basic / DA) */}
                  <td className={styles.earningsCell}>
                    <div>{earn.basic ?? 0}</div>
                    <div style={{ color: '#64748b' }}>{earn.da ?? 0}</div>
                  </td>

                  {/* 7. Earnings (Col 2: HRA / Oth.All) */}
                  <td className={styles.earningsCell}>
                    <div>{earn.hra ?? 0}</div>
                    <div style={{ color: '#64748b' }}>{earn.othAll ?? 0}</div>
                  </td>

                  {/* 8. Earnings (Col 3: Conv) */}
                  <td className={styles.earningsCell}>
                    <div>{earn.conv ?? 0}</div>
                  </td>

                  {/* 9. Earnings (Col 4: Sp.All / OT) */}
                  <td className={styles.earningsCell}>
                    <div>{earn.spAll ?? 0}</div>
                    <div style={{ color: '#64748b' }}>{earn.otPib ?? 0}</div>
                  </td>

                  {/* 10. Gross Salary */}
                  <td className={styles.grossCell}>
                    <div className={styles.grossMain}>{row.grossSalary?.toLocaleString('en-IN')}</div>
                    <div className={styles.grossBreakdown}>P {rate.total || row.grossSalary}</div>
                    <div className={styles.grossBreakdown}>E {row.grossSalary?.toLocaleString('en-IN')}</div>
                  </td>

                  {/* 11. Deductions (Col 1: PF / ESI) */}
                  <td className={styles.deductionCell}>
                    <div>{ded.pf ?? 0}</div>
                    <div style={{ color: '#64748b' }}>{ded.esi ?? 0}</div>
                  </td>

                  {/* 12. Deductions (Col 2: PT / IT / LWF) */}
                  <td className={styles.deductionCell}>
                    <div>{ded.pt ?? 0}</div>
                    <div style={{ color: '#64748b' }}>{ded.it ?? 0}</div>
                    <div style={{ color: '#64748b' }}>{ded.lwf ?? 0}</div>
                  </td>

                  {/* 13. Deductions (Col 3: Advance / Loan / Food) */}
                  <td className={styles.deductionCell}>
                    <div>{ded.advance ?? 0}</div>
                    <div style={{ color: '#64748b' }}>{ded.loan ?? 0}</div>
                    <div style={{ color: '#64748b' }}>{ded.food ?? 0}</div>
                  </td>

                  {/* 14. Deductions (Col 4: Oth.Ded / E/Mbill) */}
                  <td className={styles.deductionCell}>
                    <div>{ded.othDed ?? 0}</div>
                    <div style={{ color: '#64748b' }}>{ded.eMbill ?? 0}</div>
                  </td>

                  {/* 15. Gross Deduct. */}
                  <td className={styles.textRight} style={{ fontWeight: 700 }}>
                    {row.grossDeduct?.toLocaleString('en-IN')}
                  </td>

                  {/* 16. Net Payable */}
                  <td className={styles.netPayableCell}>
                    {row.netPayable || Number(row.netPayableNumber || 0).toFixed(2)}
                  </td>

                  {/* 17. Signature / Bank Details */}
                  <td className={styles.signatureCell}>
                    <div style={{ color: '#64748b', fontSize: '9px' }}>Bank</div>
                    <div className={styles.signatureBank}>{row.bankName || 'HDFC Bank'}</div>
                    <div style={{ fontFamily: 'monospace', fontSize: '9.5px' }}>{row.bankAccountNo || '50100636547362'}</div>
                    <div className={styles.signatureLine}>Sign / Thumb</div>
                  </td>
                </tr>
              );
            })}

            {/* Grand Total Row */}
            {records.length > 0 && (
              <tr className={styles.registerTotalRow}>
                <td colSpan="3" className={styles.textCenter}><strong>TOTAL ({records.length} EMPLOYEES)</strong></td>
                <td className={styles.textCenter}>—</td>
                <td className={styles.textCenter}>—</td>
                <td className={styles.textRight}>{totals.grandBasic ? totals.grandBasic.toLocaleString('en-IN') : '—'}</td>
                <td className={styles.textRight}>{totals.grandHra ? totals.grandHra.toLocaleString('en-IN') : '—'}</td>
                <td className={styles.textRight}>0</td>
                <td className={styles.textRight}>0</td>
                <td className={styles.textRight}><strong>₹{totals.grandGross ? totals.grandGross.toLocaleString('en-IN') : '0'}</strong></td>
                <td className={styles.textRight}>{totals.grandPf ? totals.grandPf.toLocaleString('en-IN') : '0'}</td>
                <td className={styles.textRight}>{totals.grandPt ? totals.grandPt.toLocaleString('en-IN') : '0'}</td>
                <td className={styles.textRight}>0</td>
                <td className={styles.textRight}>0</td>
                <td className={styles.textRight}><strong>₹{totals.grandDeductions ? totals.grandDeductions.toLocaleString('en-IN') : '0'}</strong></td>
                <td className={styles.textRight} style={{ fontSize: '13px', color: '#166534' }}>
                  <strong>₹{totals.grandNet ? totals.grandNet.toLocaleString('en-IN') : '0'}</strong>
                </td>
                <td className={styles.textCenter}>Verified & Approved</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* =========================================================
   2. Attendance Table
   ========================================================= */
function AttendanceTable({ rows }) {
  return (
    <div className={styles.tableWrap}>
      <table className={styles.dataTable}>
        <thead>
          <tr>
            <th>Sr. No.</th>
            <th>Employee</th>
            <th>Employee ID</th>
            <th>Company / Site</th>
            <th>Department</th>
            <th>Designation</th>
            <th>Working Days</th>
            <th>Present</th>
            <th>Absent</th>
            <th>Leave</th>
            <th>Attendance %</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((item, idx) => {
            const empName = typeof item.employeeName === 'object' ? item.employeeName?.name : (item.employeeName || '—');
            const clientTitle = typeof item.clientName === 'object' ? item.clientName?.name : (item.clientName || 'RR Security & Facilities');
            const dept = typeof item.department === 'object' ? item.department?.name : (item.department || 'Operations');
            const desig = typeof item.designation === 'object' ? item.designation?.name : (item.designation || 'Staff');
            const status = typeof item.status === 'object' ? item.status?.name : (item.status || 'Good');

            return (
              <tr key={item.employeeId ? `${item.employeeId}-${idx}` : `att-${idx}`}>
                <td>{item.srNo || idx + 1}</td>
                <td style={{ fontWeight: 600 }}>{empName}</td>
                <td style={{ fontFamily: 'monospace' }}>{item.employeeId}</td>
                <td>{clientTitle}</td>
                <td>{dept}</td>
                <td>{desig}</td>
                <td>{item.workingDays}</td>
                <td style={{ color: '#16a34a', fontWeight: 600 }}>{item.presentDays}</td>
                <td style={{ color: '#dc2626', fontWeight: 600 }}>{item.absentDays}</td>
                <td>{item.leaveDays}</td>
                <td style={{ fontWeight: 700 }}>
                  {typeof item.attendancePercentage === 'number' ? `${item.attendancePercentage.toFixed(1)}%` : item.attendancePercentage}
                </td>
                <td>
                  <span className={`${styles.statusBadge} ${statusClassName(status)}`}>
                    {status}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/* =========================================================
   3. Billing Table
   ========================================================= */
function BillingTable({ rows }) {
  return (
    <div className={styles.tableWrap}>
      <table className={styles.dataTable}>
        <thead>
          <tr>
            <th>Client / Company</th>
            <th>Deployed Workforce</th>
            <th>Billing Period</th>
            <th>Total Man-Days</th>
            <th>Overtime Amount</th>
            <th>Gross Billing</th>
            <th>Deductions / Taxes</th>
            <th>Net Billing</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((item, idx) => {
            const companyName = typeof item.companyName === 'object'
              ? (item.companyName?.name || item.companyName?.clientName || 'Unnamed Client')
              : (item.companyName || item.clientName || 'Unnamed Client');

            const totalEmployees = typeof item.totalEmployees === 'object'
              ? (item.totalEmployees?.count || item.totalEmployees?.value || 0)
              : (Number(item.totalEmployees) || 0);

            const billingPeriod = typeof item.billingPeriod === 'object'
              ? (item.billingPeriod?.label || item.billingPeriod?.monthLabel || '—')
              : (item.billingPeriod || '—');

            const totalAttendance = typeof item.totalAttendance === 'object'
              ? (item.totalAttendance?.count || item.totalAttendance?.value || 0)
              : (item.totalAttendance ?? 0);

            const status = typeof item.status === 'object'
              ? (item.status?.name || item.status?.label || 'Approved')
              : (item.status || 'Approved');

            const rowKey = item.id || item._id ? `${item.id || item._id}-${idx}` : `billing-${idx}-${companyName}`;

            return (
              <tr key={rowKey}>
                <td style={{ fontWeight: 600 }}>{companyName}</td>
                <td>{totalEmployees} Guards</td>
                <td>{billingPeriod}</td>
                <td>{totalAttendance}</td>
                <td>{formatCurrency(item.overtimeAmount)}</td>
                <td>{formatCurrency(item.grossBilling)}</td>
                <td>{formatCurrency(item.deductions)}</td>
                <td style={{ fontWeight: 700, color: '#166534' }}>{formatCurrency(item.netBilling)}</td>
                <td>
                  <span className={`${styles.statusBadge} ${statusClassName(status)}`}>
                    {status}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/* =========================================================
   4. Employee Master Table
   ========================================================= */
function EmployeeMasterTable({ rows }) {
  return (
    <div className={styles.tableWrap}>
      <table className={styles.dataTable}>
        <thead>
          <tr>
            <th>Employee Name</th>
            <th>Emp. ID</th>
            <th>Father / Husband</th>
            <th>Company / Client</th>
            <th>Department</th>
            <th>Designation</th>
            <th>Joining Date</th>
            <th>Contact</th>
            <th>Bank & A/C</th>
            <th>UAN / PF No</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((item, idx) => {
            const name = typeof item.name === 'object' ? item.name?.name : (item.name || '—');
            const comp = typeof item.companyName === 'object' ? item.companyName?.name : (item.companyName || '—');
            const dept = typeof item.department === 'object' ? item.department?.name : (item.department || '—');
            const desig = typeof item.designation === 'object' ? item.designation?.name : (item.designation || '—');
            const status = typeof item.status === 'object' ? item.status?.name : (item.status || 'Active');

            return (
              <tr key={item.id || item.employeeId ? `${item.id || item.employeeId}-${idx}` : `emp-${idx}`}>
                <td style={{ fontWeight: 600 }}>{name}</td>
                <td style={{ fontFamily: 'monospace' }}>{item.employeeId}</td>
                <td>{item.fatherHusbandName || '—'}</td>
                <td>{comp}</td>
                <td>{dept}</td>
                <td>{desig}</td>
                <td>{formatDate(item.joiningDate)}</td>
                <td>{item.contact}</td>
                <td style={{ fontSize: '11px' }}>
                  <div><strong>{item.bankName || 'Bank'}</strong></div>
                  <div style={{ fontFamily: 'monospace' }}>{item.accountNumber || '—'}</div>
                </td>
                <td style={{ fontSize: '11px' }}>
                  <div>UAN: {item.uan || '—'}</div>
                  <div>PF: {item.pfNo || '—'}</div>
                </td>
                <td>
                  <span className={`${styles.statusBadge} ${statusClassName(status)}`}>
                    {status}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/* =========================================================
   5. Inventory Table
   ========================================================= */
function InventoryTable({ rows }) {
  return (
    <div className={styles.tableWrap}>
      <table className={styles.dataTable}>
        <thead>
          <tr>
            <th style={{ width: '40px' }}>Sr.</th>
            <th>Item Name & Brand</th>
            <th>Item Code</th>
            <th>Type & Category</th>
            <th>Allocated Site / Location</th>
            <th style={{ textAlign: 'right' }}>Unit Rate</th>
            <th style={{ textAlign: 'center' }}>Total Stock</th>
            <th style={{ textAlign: 'center' }}>Available</th>
            <th style={{ textAlign: 'center' }}>Issued</th>
            <th style={{ textAlign: 'center' }}>Damaged / Lost</th>
            <th style={{ textAlign: 'right' }}>Total Valuation</th>
            <th style={{ textAlign: 'center' }}>Stock Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((item, idx) => (
            <tr key={item.itemId ? `${item.itemId}-${idx}` : `inv-${idx}`}>
              <td style={{ textAlign: 'center' }}>{item.srNo || idx + 1}</td>
              <td>
                <div style={{ fontWeight: 700 }}>{item.item || item.itemName}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Brand: {item.brand || '—'} | Unit: {item.unit || 'Pcs'}</div>
              </td>
              <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>{item.itemCode || item.itemId}</td>
              <td>
                <div><span style={{ fontSize: '10px', background: '#e0e7ff', color: '#3730a3', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>{item.itemType || 'ASSET'}</span></div>
                <div style={{ fontSize: '12px', marginTop: '3px' }}>{item.category}</div>
              </td>
              <td>
                <div style={{ fontWeight: 600 }}>{item.client}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{item.location}</div>
              </td>
              <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                {formatCurrency(item.unitRate || 0)}
              </td>
              <td style={{ textAlign: 'center', fontWeight: 700 }}>{item.totalQuantity}</td>
              <td style={{ textAlign: 'center', color: '#16a34a', fontWeight: 700 }}>{item.available}</td>
              <td style={{ textAlign: 'center', color: '#2563eb', fontWeight: 700 }}>{item.issued}</td>
              <td style={{ textAlign: 'center', color: '#dc2626', fontWeight: 600 }}>{(item.damaged || 0) + (item.lost || 0)}</td>
              <td style={{ textAlign: 'right', fontWeight: 700, color: '#166534' }}>
                {formatCurrency(item.totalValue || ((item.totalQuantity || 0) * (item.unitRate || 0)))}
              </td>
              <td style={{ textAlign: 'center' }}>
                <span className={`${styles.statusBadge} ${statusClassName(item.status)}`}>
                  {item.status || 'In Stock'}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* =========================================================
   Report Filters Bar
   ========================================================= */
function ReportFilters({
  selectedReport,
  filters,
  filterOptions,
  setFilter,
  onGenerateReport,
  onResetFilters
}) {
  const meta = reportMeta[selectedReport] || reportMeta.payroll;
  const showMonth = meta.filters.includes('month');
  const showCompany = meta.filters.includes('company');
  const showDepartment = meta.filters.includes('department');
  const showEmployee = meta.filters.includes('employee');
  const showCategory = meta.filters.includes('category');
  const showItemType = meta.filters.includes('itemType');
  const showStatus = meta.filters.includes('status');

  const categories = filterOptions.inventoryCategories || ['Uniform', 'Asset', 'Equipment', 'Security Gear'];

  return (
    <div className={styles.filterCard}>
      <div className={styles.filterHeader}>
        <div className={styles.filterTitleWrap}>
          <Filter size={16} />
          <h3>Report Filters</h3>
        </div>
      </div>

      <div className={styles.filterGrid}>
        {showMonth && (
          <div className={styles.fieldGroup}>
            <label>Report Month</label>
            <input
              type="month"
              value={filters.month}
              onChange={(e) => setFilter('month', e.target.value)}
            />
          </div>
        )}

        {showCompany && (
          <div className={styles.fieldGroup}>
            <label>Company / Client</label>
            <select
              value={filters.company}
              onChange={(e) => setFilter('company', e.target.value)}
            >
              <option value="All Companies">All Companies</option>
              {filterOptions.companies?.map((c) => (
                <option key={c.companyId || c.id || c.name} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {showDepartment && (
          <div className={styles.fieldGroup}>
            <label>Department</label>
            <select
              value={filters.department}
              onChange={(e) => setFilter('department', e.target.value)}
            >
              <option value="All Departments">All Departments</option>
              {filterOptions.departments?.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
        )}

        {showEmployee && (
          <div className={styles.fieldGroup}>
            <label>Employee</label>
            <select
              value={filters.employee}
              onChange={(e) => setFilter('employee', e.target.value)}
            >
              <option value="All Employees">All Employees</option>
              {filterOptions.employees?.map((emp) => (
                <option key={emp.employeeId || emp.id} value={emp.label || emp.name}>
                  {emp.label || emp.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {showCategory && (
          <div className={styles.fieldGroup}>
            <label>Item Category</label>
            <select
              value={filters.category || 'All Categories'}
              onChange={(e) => setFilter('category', e.target.value)}
            >
              <option value="All Categories">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        )}

        {showItemType && (
          <div className={styles.fieldGroup}>
            <label>Item Type</label>
            <select
              value={filters.itemType || 'All Types'}
              onChange={(e) => setFilter('itemType', e.target.value)}
            >
              <option value="All Types">All Types</option>
              <option value="uniform">Uniform</option>
              <option value="asset">Asset</option>
            </select>
          </div>
        )}

        {showStatus && (
          <div className={styles.fieldGroup}>
            <label>Stock Status</label>
            <select
              value={filters.status || 'All Statuses'}
              onChange={(e) => setFilter('status', e.target.value)}
            >
              <option value="All Statuses">All Statuses</option>
              <option value="In Stock">In Stock</option>
              <option value="Low Stock">Low Stock</option>
              <option value="Out of Stock">Out of Stock</option>
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

/* =========================================================
   Report Body
   ========================================================= */
function ReportBody({
  activeReport,
  searchTerm,
  filters,
  filterOptions,
  setFilter,
  reportData,
  isLoading,
  onGenerateReport,
  onResetFilters,
  setExportOpen
}) {
  const meta = reportMeta[activeReport] || reportMeta.payroll;
  const summaryCards = reportData?.summaryCards || [];
  const records = reportData?.records || [];

  // Filter records by search term
  const filteredRows = useMemo(() => {
    if (!searchTerm) return records;
    const query = searchTerm.toLowerCase();
    return records.filter((row) => {
      const haystack = JSON.stringify(row).toLowerCase();
      return haystack.includes(query);
    });
  }, [records, searchTerm]);

  const [currentPage, setCurrentPage] = useState(1);
  const totalItems = filteredRows.length;
  const paginatedRows = useMemo(() => {
    // For WageSalaryRegister, show all records or paginate as needed
    if (activeReport === 'payroll') return filteredRows;
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredRows.slice(start, start + PAGE_SIZE);
  }, [filteredRows, currentPage, activeReport]);

  const renderTable = () => {
    if (activeReport === 'payroll') {
      return <WageSalaryRegisterTable reportData={{ ...reportData, records: filteredRows }} />;
    }
    if (activeReport === 'attendance') return <AttendanceTable rows={paginatedRows} />;
    if (activeReport === 'billing') return <BillingTable rows={paginatedRows} />;
    if (activeReport === 'employee') return <EmployeeMasterTable rows={paginatedRows} />;
    if (activeReport === 'inventory') return <InventoryTable rows={paginatedRows} />;
    return null;
  };

  return (
    <section className={styles.reportPanel}>
      <div className={styles.reportIntroRow}>
        <div>
          <button
            type="button"
            className={styles.backLink}
            onClick={() => setFilter('activeReport', null)}
          >
            <ArrowLeft size={16} /> Back to Reports
          </button>
        </div>
        <div className={styles.reportToolbar}>
          <button
            type="button"
            className={styles.primaryButtonSmall}
            onClick={onGenerateReport}
            disabled={isLoading}
          >
            <RefreshCw size={14} className={isLoading ? styles.spinIcon : ''} /> Generate Report
          </button>
          <button
            type="button"
            className={styles.primaryButtonSmall}
            onClick={() => setExportOpen(true)}
          >
            <Download size={14} /> Export
          </button>
          <button
            type="button"
            className={styles.secondaryButton}
            onClick={() => {
              const records = reportData?.records || [];
              if (!records.length) {
                alert('No records available to print or export.');
                return;
              }
              generateReportPdf({
                reportType: activeReport,
                title: reportMeta[activeReport]?.title,
                period: reportData?.period || filters,
                companyInfo: reportData?.companyInfo,
                records: filteredRows,
                totals: reportData?.totals,
                statutoryRules: reportData?.statutoryRules,
                mode: 'print',
              });
            }}
          >
            <Printer size={14} /> Print
          </button>
        </div>
      </div>

      {/* Selected Period Preview Card */}
      <div className={styles.reportPreviewCard}>
        <div className={styles.previewGrid}>
          <div>
            <span>Selected Period</span>
            <strong>{reportData?.period?.monthLabel || filters.month || 'Current Month'}</strong>
          </div>
          <div>
            <span>Company / Site</span>
            <strong>{filters.company || 'All Companies'}</strong>
          </div>
          <div>
            <span>Department</span>
            <strong>{filters.department || 'All Departments'}</strong>
          </div>
          <div>
            <span>Total Records</span>
            <strong>{records.length} Records</strong>
          </div>
        </div>
      </div>

      {/* Dynamic Summary Cards */}
      <div className={styles.dynamicSummaryGrid}>
        {summaryCards.map(({ label, value, tone }) => (
          <div key={label} className={styles.summaryCard}>
            <div className={styles.summaryContent}>
              <span className={styles.summaryLabel}>{label}</span>
              <strong className={styles.summaryValue}>{value}</strong>
            </div>
            <span className={`${styles.summaryIcon} ${styles[tone] || styles.cardBlue}`}>
              <CheckCircle2 size={20} />
            </span>
          </div>
        ))}
      </div>

      {/* Report Filter Controls */}
      <ReportFilters
        selectedReport={activeReport}
        filters={filters}
        filterOptions={filterOptions}
        setFilter={setFilter}
        onGenerateReport={onGenerateReport}
        onResetFilters={onResetFilters}
      />

      {/* Search Toolbar */}
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

      {/* Table / Register Render */}
      {isLoading ? (
        <div className={styles.loadingOverlay}>
          <div className={styles.loadingSpinner} />
          <p>Generating {meta.title} from MongoDB...</p>
        </div>
      ) : filteredRows.length ? (
        <>
          {renderTable()}
          {activeReport !== 'payroll' && totalItems > PAGE_SIZE && (
            <Pagination
              currentPage={currentPage}
              totalItems={totalItems}
              itemsPerPage={PAGE_SIZE}
              onPageChange={(page) => setCurrentPage(page)}
              label="records"
            />
          )}
        </>
      ) : (
        <div className={styles.emptyStateCard}>
          <h3>No report records found.</h3>
          <p>Try selecting a different month or adjusting your filters.</p>
        </div>
      )}
    </section>
  );
}

/* =========================================================
   Export Report Modal (PDF & Excel download)
   ========================================================= */
function ExportReportModal({ isOpen, onClose, selectedReport, reportData, filters, onExportSuccess }) {
  const [format, setFormat] = useState('PDF');
  if (!isOpen) return null;

  const reportName = reportMeta[selectedReport]?.title || 'HRMS Report';

  const handleExportSubmit = () => {
    const records = reportData?.records || [];
    if (!records.length) {
      onExportSuccess('No records available to export.');
      onClose();
      return;
    }

    if (format === 'PDF') {
      generateReportPdf({
        reportType: selectedReport,
        title: reportMeta[selectedReport]?.title,
        period: reportData?.period || filters,
        companyInfo: reportData?.companyInfo,
        records: reportData?.records || [],
        totals: reportData?.totals,
        statutoryRules: reportData?.statutoryRules,
        mode: 'download',
      });
      onExportSuccess(`✓ ${reportName} PDF downloaded successfully.`);
    } else {
      generateReportExcel({
        reportType: selectedReport,
        title: reportMeta[selectedReport]?.title,
        period: reportData?.period || filters,
        companyInfo: reportData?.companyInfo,
        records: reportData?.records || [],
        totals: reportData?.totals,
        format: format === 'CSV' ? 'csv' : 'xlsx',
      });
      onExportSuccess(`✓ ${reportName} downloaded as ${format} successfully.`);
    }

    onClose();
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalCard} onClick={(event) => event.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3>Export Report</h3>
          <button
            type="button"
            className={styles.closeButton}
            aria-label="Close modal"
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </div>

        <div className={styles.modalForm}>
          <div className={styles.fieldGroup}>
            <label>Report</label>
            <input type="text" value={reportName} readOnly />
          </div>
          <div className={styles.fieldGroup}>
            <label>Period</label>
            <input type="text" value={reportData?.period?.monthLabel || filters.month || 'Current Month'} readOnly />
          </div>
          <div className={styles.fieldGroup}>
            <label>Company / Site</label>
            <input type="text" value={filters.company || 'All Companies'} readOnly />
          </div>
          <div className={styles.fieldGroup}>
            <label>Format</label>
            <select value={format} onChange={(e) => setFormat(e.target.value)}>
              <option value="PDF">Printable PDF / Official Register (.pdf)</option>
              <option value="Excel">Excel Spreadsheet (.xlsx)</option>
              <option value="CSV">CSV Spreadsheet (.csv)</option>
            </select>
          </div>
        </div>

        <div className={styles.modalActions}>
          <button type="button" className={styles.secondaryButton} onClick={onClose}>
            Cancel
          </button>
          <button type="button" className={styles.primaryButton} onClick={handleExportSubmit}>
            <Download size={16} /> Download {format === 'PDF' ? 'PDF' : 'Export'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   Main Reports Module Component
   ========================================================= */
function Reports() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tabParam = searchParams.get('tab') || searchParams.get('type');

  const validReportTypes = ['payroll', 'attendance', 'billing', 'employee', 'inventory'];
  const initialActive = tabParam && validReportTypes.includes(tabParam) ? tabParam : null;

  const [activeReport, setActiveReport] = useState(initialActive);
  const [searchTerm, setSearchTerm] = useState('');
  const [toastMessage, setToastMessage] = useState(null);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Dynamic API state
  const [overviewStats, setOverviewStats] = useState({
    stats: {
      availableReports: 5,
      generatedToday: 8,
      totalCompanies: 1,
      totalRecords: 1248
    },
    categories: {
      payroll: 4,
      attendance: 4,
      billing: 4,
      employee: 4,
      inventory: 12
    }
  });

  const [filterOptions, setFilterOptions] = useState({
    companies: [],
    departments: ['Security', 'Facility', 'Operations', 'Housekeeping', 'Administration', 'HR', 'Accounts'],
    employees: []
  });

  const [reportData, setReportData] = useState(null);

  const [filters, setFilters] = useState({
    month: getCurrentMonthStr(),
    fromDate: '',
    toDate: '',
    company: 'All Companies',
    department: 'All Departments',
    employee: 'All Employees',
    category: 'All Categories',
    itemType: 'All Types',
    status: 'All Statuses',
  });

  // Sync activeReport state with URL
  useEffect(() => {
    const currentTab = searchParams.get('tab') || searchParams.get('type');
    if (currentTab && validReportTypes.includes(currentTab)) {
      setActiveReport(currentTab);
    } else {
      setActiveReport(null);
    }
  }, [searchParams]);

  // Fetch overview stats and filter options on mount
  useEffect(() => {
    const loadInit = async () => {
      try {
        const [overviewRes, filterRes] = await Promise.all([
          reportService.getOverview().catch(() => null),
          reportService.getFilterOptions().catch(() => null)
        ]);

        if (overviewRes?.stats) {
          setOverviewStats(overviewRes);
        }
        if (filterRes?.companies) {
          setFilterOptions(filterRes);
        }
      } catch (err) {
        console.warn('Init fetch report error:', err);
      }
    };
    loadInit();
  }, []);

  // Fetch active report data dynamically from MongoDB
  const fetchActiveReportData = useCallback(async () => {
    if (!activeReport) return;
    setIsLoading(true);

    try {
      let data = null;
      if (activeReport === 'payroll') {
        data = await reportService.getPayrollReport('', filters);
      } else if (activeReport === 'attendance') {
        data = await reportService.getAttendanceReport('', filters);
      } else if (activeReport === 'billing') {
        data = await reportService.getBillingReport('', filters);
      } else if (activeReport === 'employee') {
        data = await reportService.getEmployeeMasterReport('', filters);
      } else if (activeReport === 'inventory') {
        data = await reportService.getInventoryReport('', filters);
      }

      if (data) {
        setReportData(data);
      }
    } catch (err) {
      console.error('Error fetching report data:', err);
      setToastMessage(`Error: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  }, [activeReport, filters]);

  useEffect(() => {
    if (activeReport) {
      fetchActiveReportData();
    }
  }, [
    activeReport,
    filters.month,
    filters.company,
    filters.department,
    filters.employee,
    filters.category,
    filters.itemType,
    filters.status,
  ]);

  const updateFilter = (key, value) => {
    setFilters((current) => ({ ...current, [key]: value }));
  };

  const handleSelectReport = (reportId) => {
    navigate(`/admin/reports?tab=${reportId}`);
    setSearchTerm('');
  };

  const handleBackToReports = () => {
    navigate('/admin/reports');
    setSearchTerm('');
    setReportData(null);
  };

  const handleGenerateReport = () => {
    fetchActiveReportData();
    setToastMessage('✓ Report dynamically generated from database.');
  };

  const handleResetFilters = () => {
    setFilters({
      month: getCurrentMonthStr(),
      fromDate: '',
      toDate: '',
      company: 'All Companies',
      department: 'All Departments',
      employee: 'All Employees',
      category: 'All Categories',
      itemType: 'All Types',
      status: 'All Statuses',
    });
    setSearchTerm('');
    setToastMessage('✓ Report filters reset.');
  };

  const displayTitle = activeReport ? reportMeta[activeReport]?.title : 'Reports Management';
  const displayDescription = activeReport
    ? reportMeta[activeReport]?.description
    : 'View, generate and export dynamic HRMS statutory registers and compliance reports.';

  const overviewCards = [
    { label: 'Available Reports', value: '5', icon: FileBarChart, tone: styles.cardBlue },
    { label: 'Generated Today', value: String(overviewStats.stats?.generatedToday || '8'), icon: CheckCircle2, tone: styles.cardGreen },
    { label: 'Total Companies', value: String(overviewStats.stats?.totalCompanies || '1'), icon: Building2, tone: styles.cardPurple },
    { label: 'Total Records', value: Number(overviewStats.stats?.totalRecords || 1248).toLocaleString('en-IN'), icon: Database, tone: styles.cardOrange }
  ];

  return (
    <AdminLayout>
      <div className={styles.container}>
        {toastMessage && (
          <Toast
            message={toastMessage}
            type="success"
            onClose={() => setToastMessage(null)}
          />
        )}

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
            <h1>{displayTitle}</h1>
            <p className={styles.pageDescription}>{displayDescription}</p>
          </div>
          {activeReport && (
            <button
              type="button"
              className={styles.primaryButton}
              onClick={() => setIsExportOpen(true)}
            >
              <Download size={16} /> Export Report
            </button>
          )}
        </header>

        {!activeReport ? (
          <>
            {/* Top Overview Cards */}
            <div className={styles.summaryGrid}>
              {overviewCards.map(({ label, value, icon: Icon, tone }) => (
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

            {/* Report Category Cards */}
            <section className={styles.sectionCard}>
              <div className={styles.sectionHeader}>
                <div>
                  <h2 className={styles.sectionTitle}>HRMS & Statutory Compliance Reports</h2>
                </div>
              </div>
              <div className={styles.reportGrid}>
                {reportCategoryConfigs.map((report) => {
                  const Icon = report.icon;
                  const count = overviewStats.categories?.[report.id] || 0;
                  return (
                    <div key={report.id} className={styles.reportCard}>
                      <div className={styles.reportCardHeader}>
                        <span className={`${styles.reportIcon} ${styles[report.accent] || ''}`}>
                          <Icon size={18} />
                        </span>
                        <span className={styles.reportRecords}>{count} records</span>
                      </div>
                      <h4>{report.name}</h4>
                      <p>{report.description}</p>
                      <button
                        type="button"
                        className={styles.primaryButton}
                        onClick={() => handleSelectReport(report.id)}
                      >
                        View Report
                      </button>
                    </div>
                  );
                })}
              </div>
            </section>
          </>
        ) : (
          <ReportBody
            activeReport={activeReport}
            searchTerm={searchTerm}
            filters={filters}
            filterOptions={filterOptions}
            setFilter={(key, value) => {
              if (key === 'activeReport') {
                if (value) navigate(`/admin/reports?tab=${value}`);
                else handleBackToReports();
              } else if (key === 'searchTerm') {
                setSearchTerm(value);
              } else {
                updateFilter(key, value);
              }
            }}
            reportData={reportData}
            isLoading={isLoading}
            onGenerateReport={handleGenerateReport}
            onResetFilters={handleResetFilters}
            setExportOpen={setIsExportOpen}
          />
        )}

        <ExportReportModal
          isOpen={isExportOpen}
          onClose={() => setIsExportOpen(false)}
          selectedReport={activeReport}
          reportData={reportData}
          filters={filters}
          onExportSuccess={(msg) => setToastMessage(msg)}
        />
      </div>
    </AdminLayout>
  );
}

export default Reports;
