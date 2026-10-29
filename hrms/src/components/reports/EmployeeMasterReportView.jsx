import React, { useMemo } from 'react';
import {
  Users,
  UserCheck,
  UserX,
  Building,
} from 'lucide-react';
import styles from './EmployeeMasterReportView.module.css';

/**
 * Helper to format date strings cleanly
 */
function formatDate(value) {
  if (!value || value === '—') return '—';
  const str = String(value);
  const date = new Date(str.includes('T') ? str : `${str}T00:00:00`);
  if (Number.isNaN(date.getTime())) return str;
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

/**
 * Format currency with configured amount rounding
 */
function formatCurrency(amount, rounding = '0 decimals') {
  const num = Number(amount || 0);
  const decimals = rounding === '2 decimals' ? 2 : 0;
  return `₹${num.toLocaleString('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;
}

/**
 * Employee Master Interactive Table View
 * Salary & Workforce Module
 * Dynamically renders only the columns selected in the Report Options panel.
 */
export default function EmployeeMasterReportView({
  records = [],
  rows = [],
  selectedOptions = {},
  companyInfo = {},
}) {
  const opt = selectedOptions;

  // Total pool of records (for accurate KPI calculation)
  const poolRecords = records && records.length > 0 ? records : rows;

  // Active / Inactive breakdown
  const activeCount = useMemo(() => {
    return poolRecords.filter((r) => String(r.status || 'Active').toLowerCase() === 'active').length;
  }, [poolRecords]);

  const inactiveCount = poolRecords.length - activeCount;

  const totalClients = useMemo(() => {
    const set = new Set();
    poolRecords.forEach((r) => {
      const c = r.companyName || r.clientName;
      if (c && c !== '—') set.add(c);
    });
    return set.size || 1;
  }, [poolRecords]);

  // Filter rows according to Report Options "Records to Include" toggles
  const filteredRows = useMemo(() => {
    const base = rows && rows.length > 0 ? rows : records;
    return base.filter((item) => {
      const isAct = String(typeof item.status === 'object' ? item.status?.name : item.status || 'Active').toLowerCase() === 'active';
      if (opt.recordScope === 'active' || opt.excludeInactive) {
        return isAct;
      }
      if (opt.recordScope === 'inactive') {
        return !isAct;
      }
      return true; // 'all'
    });
  }, [rows, records, opt.recordScope, opt.excludeInactive]);

  const hasBankingCol = opt.bankName !== false || opt.accountNumber !== false || opt.ifsc !== false;
  const hasStatutoryCol = opt.uan !== false || opt.pfNo !== false || opt.esicNo !== false;
  const hasAddressCol = opt.presentAddress !== false || opt.permanentAddress !== false || opt.cityState !== false;

  return (
    <div className={styles.container}>
      {/* KPI Cards Row */}
      <div className={`${styles.kpiGrid} no-print`} data-no-print="true">
        <div className={styles.kpiCard}>
          <div className={`${styles.kpiIconWrap} ${styles.kpiIconBlue}`}>
            <Users size={22} />
          </div>
          <div className={styles.kpiContent}>
            <span className={styles.kpiLabel}>Total Employees</span>
            <span className={styles.kpiValue}>{poolRecords.length} Guards</span>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={`${styles.kpiIconWrap} ${styles.kpiIconGreen}`}>
            <UserCheck size={22} />
          </div>
          <div className={styles.kpiContent}>
            <span className={styles.kpiLabel}>Active Workforce</span>
            <span className={styles.kpiValue}>{activeCount} Enrolled</span>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={`${styles.kpiIconWrap} ${styles.kpiIconOrange}`}>
            <UserX size={22} />
          </div>
          <div className={styles.kpiContent}>
            <span className={styles.kpiLabel}>Inactive Records</span>
            <span className={styles.kpiValue}>{inactiveCount} Staff</span>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={`${styles.kpiIconWrap} ${styles.kpiIconPurple}`}>
            <Building size={22} />
          </div>
          <div className={styles.kpiContent}>
            <span className={styles.kpiLabel}>Deployment Units</span>
            <span className={styles.kpiValue}>{totalClients} Clients / Sites</span>
          </div>
        </div>
      </div>

      {/* Dynamic Data Table */}
      <div className={styles.tableWrap} id="printable-employee-master-table">
        <table className={styles.dataTable}>
          <thead>
            <tr>
              {opt.showSrNo !== false && <th style={{ width: '45px', textAlign: 'center' }}>Sr.</th>}
              {opt.name !== false && <th>Employee Name</th>}
              {opt.employeeCode !== false && <th>Emp. Code / ID</th>}
              {opt.gender !== false && <th>Gender</th>}
              {opt.dob !== false && <th>Date of Birth</th>}
              {opt.joiningDate !== false && <th>Joining Date</th>}
              {opt.maritalStatus !== false && <th>Marital Status</th>}
              {opt.bloodGroup !== false && <th>Blood Group</th>}
              {opt.qualification !== false && <th>Qualification</th>}
              {opt.language !== false && <th>Languages</th>}
              {opt.fatherHusbandName !== false && <th>Father / Husband</th>}
              {opt.nomineeDetails !== false && <th>Nominee Details</th>}
              {opt.companyName !== false && <th>Company / Client</th>}
              {opt.department !== false && <th>Department</th>}
              {opt.designation !== false && <th>Designation</th>}
              {opt.siteLocation !== false && <th>Site Location</th>}
              {opt.grossSalary !== false && <th style={{ textAlign: 'right' }}>Gross Wage</th>}
              {opt.contact !== false && <th>Contact</th>}
              {opt.pan !== false && <th>PAN</th>}
              {opt.aadhaar !== false && <th>Aadhaar</th>}
              {hasBankingCol && <th>Bank & Account</th>}
              {hasStatutoryCol && <th>Statutory (PF / ESI)</th>}
              {hasAddressCol && <th>Residential Address</th>}
              {opt.status !== false && <th>Status</th>}
            </tr>
          </thead>
          <tbody>
            {filteredRows.length === 0 ? (
              <tr>
                <td colSpan={24} className={styles.emptyState}>
                  No employee master records match the selected options and filters.
                </td>
              </tr>
            ) : (
              filteredRows.map((item, idx) => {
                const name = typeof item.name === 'object' ? item.name?.name : (item.name || '—');
                const comp = typeof item.companyName === 'object' ? item.companyName?.name : (item.companyName || item.clientName || '—');
                const dept = typeof item.department === 'object' ? item.department?.name : (item.department || '—');
                const desig = typeof item.designation === 'object' ? item.designation?.name : (item.designation || '—');
                const status = typeof item.status === 'object' ? item.status?.name : (item.status || 'Active');
                const code = item.employeeCode || item.employeeId || `EMP${idx + 1}`;
                const isAct = String(status).toLowerCase() === 'active';

                return (
                  <tr key={item.id || item.employeeId ? `${item.id || item.employeeId}-${idx}` : `emp-${idx}`}>
                    {/* Sr. No */}
                    {opt.showSrNo !== false && (
                      <td style={{ textAlign: 'center', color: '#64748b', fontWeight: 600 }}>
                        {idx + 1}
                      </td>
                    )}

                    {/* Employee Name & Avatar */}
                    {opt.name !== false && (
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                          {opt.showAvatar !== false && (
                            <div className={styles.avatarCircle}>
                              {name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <div style={{ fontWeight: 600, color: '#0f172a' }}>{name}</div>
                            {item.email && opt.email !== false && (
                              <div className={styles.subText}>{item.email}</div>
                            )}
                          </div>
                        </div>
                      </td>
                    )}

                    {/* Employee Code / ID */}
                    {opt.employeeCode !== false && (
                      <td className={styles.monoText}>{code}</td>
                    )}

                    {/* Gender */}
                    {opt.gender !== false && (
                      <td>{item.gender || '—'}</td>
                    )}

                    {/* DOB */}
                    {opt.dob !== false && (
                      <td>{formatDate(item.dob)}</td>
                    )}

                    {/* Joining Date */}
                    {opt.joiningDate !== false && (
                      <td>{formatDate(item.joiningDate)}</td>
                    )}

                    {/* Marital Status */}
                    {opt.maritalStatus !== false && (
                      <td>{item.maritalStatus || '—'}</td>
                    )}

                    {/* Blood Group */}
                    {opt.bloodGroup !== false && (
                      <td>{item.bloodGroup || '—'}</td>
                    )}

                    {/* Qualification */}
                    {opt.qualification !== false && (
                      <td>{item.qualification || item.education || '—'}</td>
                    )}

                    {/* Language */}
                    {opt.language !== false && (
                      <td>{item.language || '—'}</td>
                    )}

                    {/* Father / Husband Name */}
                    {opt.fatherHusbandName !== false && (
                      <td>
                        <div>{item.fatherHusbandName || '—'}</div>
                        {opt.fatherHusbandRelation !== false && item.fatherHusbandRelation && (
                          <div className={styles.subText}>({item.fatherHusbandRelation})</div>
                        )}
                      </td>
                    )}

                    {/* Nominee Details */}
                    {opt.nomineeDetails !== false && (
                      <td>
                        {item.familyMemberName ? (
                          <div>
                            <div>{item.familyMemberName} {item.relation ? `(${item.relation})` : ''}</div>
                            {item.nomineeSharePercent && (
                              <div className={styles.subText}>Share: {item.nomineeSharePercent}%</div>
                            )}
                          </div>
                        ) : '—'}
                      </td>
                    )}

                    {/* Company / Client */}
                    {opt.companyName !== false && (
                      <td style={{ fontWeight: 500 }}>{comp}</td>
                    )}

                    {/* Department */}
                    {opt.department !== false && (
                      <td>{dept}</td>
                    )}

                    {/* Designation */}
                    {opt.designation !== false && (
                      <td>{desig}</td>
                    )}

                    {/* Site Location */}
                    {opt.siteLocation !== false && (
                      <td>{item.siteLocation || item.site || '—'}</td>
                    )}

                    {/* Gross Salary */}
                    {opt.grossSalary !== false && (
                      <td style={{ textAlign: 'right', fontWeight: 600, color: '#047857' }}>
                        {formatCurrency(item.grossSalary, opt.amountRounding)}
                      </td>
                    )}

                    {/* Contact */}
                    {opt.contact !== false && (
                      <td>
                        <div>{item.contact || item.mobile || '—'}</div>
                        {opt.alternateMobile !== false && item.alternateMobile && (
                          <div className={styles.subText}>Alt: {item.alternateMobile}</div>
                        )}
                      </td>
                    )}

                    {/* PAN */}
                    {opt.pan !== false && (
                      <td className={styles.monoText}>{item.pan || '—'}</td>
                    )}

                    {/* Aadhaar */}
                    {opt.aadhaar !== false && (
                      <td className={styles.monoText}>{item.aadhaar || '—'}</td>
                    )}

                    {/* Bank & Account */}
                    {hasBankingCol && (
                      <td style={{ fontSize: '11px' }}>
                        {opt.bankName !== false && <div><strong>{item.bankName || 'Bank'}</strong></div>}
                        {opt.accountNumber !== false && <div className={styles.monoText}>{item.accountNumber || '—'}</div>}
                        {opt.ifsc !== false && item.ifsc && <div className={styles.subText}>IFSC: {item.ifsc}</div>}
                      </td>
                    )}

                    {/* Statutory (PF / ESI / UAN) */}
                    {hasStatutoryCol && (
                      <td style={{ fontSize: '11px' }}>
                        {opt.uan !== false && <div>UAN: <span className={styles.monoText}>{item.uan || '—'}</span></div>}
                        {opt.pfNo !== false && <div>PF: <span className={styles.monoText}>{item.pfNo || '—'}</span></div>}
                        {opt.esicNo !== false && item.esicNo && <div>ESI: <span className={styles.monoText}>{item.esicNo}</span></div>}
                      </td>
                    )}

                    {/* Residential Address */}
                    {hasAddressCol && (
                      <td style={{ fontSize: '11px', maxWidth: '200px', lineHeight: 1.35 }}>
                        {opt.presentAddress !== false && <div>{item.presentAddress || item.permanentAddress || '—'}</div>}
                        {opt.permanentAddress !== false && item.permanentAddress && item.permanentAddress !== item.presentAddress && (
                          <div className={styles.subText}>Perm: {item.permanentAddress}</div>
                        )}
                      </td>
                    )}

                    {/* Status */}
                    {opt.status !== false && (
                      <td>
                        {opt.showStatusBadge !== false ? (
                          <span className={`${styles.statusBadge} ${isAct ? styles.statusActive : styles.statusInactive}`}>
                            {status}
                          </span>
                        ) : (
                          <span>{status}</span>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

