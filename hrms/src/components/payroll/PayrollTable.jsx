import React, { useState, useEffect, useRef } from 'react';
import { MoreVertical, Eye, Calculator, CheckCircle, FileText, AlertTriangle, Edit, Printer } from 'lucide-react';
import Avatar from '../common/Avatar';
import { formatRupee } from '../../utils/payrollUtils';
import styles from './PayrollTable.module.css';

export default function PayrollTable({
  records = [],
  onViewDetails,
  onCalculateSalary,
  onApprovePayroll,
  onEditPayroll,
  onGenerateSlip,
  onViewSlip,
  onResolveIssue
}) {
  const [activeMenuId, setActiveMenuId] = useState(null);
  const menuRef = useRef(null);

  // Close popup menu on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setActiveMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case 'processed':
        return <span className={`${styles.badge} ${styles.badgeProcessed}`}>Processed</span>;
      case 'calculated':
        return <span className={`${styles.badge} ${styles.badgeCalculated}`}>Calculated</span>;
      case 'on_hold':
      case 'on hold':
        return <span className={`${styles.badge} ${styles.badgeOnHold}`}>On Hold</span>;
      case 'pending':
      default:
        return <span className={`${styles.badge} ${styles.badgePending}`}>Pending</span>;
    }
  };

  return (
    <div className={styles.tableCard}>
      {/* Desktop / Tablet Table View */}
      <div className={styles.tableResponsive}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Employee</th>
              <th>Employee ID</th>
              <th>Client</th>
              <th>Department</th>
              <th>Days Worked</th>
              <th>Overtime</th>
              <th>Gross Salary</th>
              <th>Deductions</th>
              <th>Net Salary</th>
              <th>Payroll Status</th>
              <th className={styles.thActions}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {records.map((row) => (
              <tr key={row.id} className={styles.row}>
                {/* Employee */}
                <td>
                  <div
                    className={styles.employeeCell}
                    onClick={() => onViewDetails(row)}
                    role="button"
                    tabIndex={0}
                  >
                    <Avatar initials={row.initials} name={row.employeeName} size="sm" />
                    <div className={styles.empInfo}>
                      <span className={styles.empName}>{row.employeeName}</span>
                      <span className={styles.empDesignation}>{row.designation}</span>
                    </div>
                  </div>
                </td>

                {/* ID */}
                <td>
                  <span className={styles.idCode}>{row.employeeId}</span>
                </td>

                {/* Client */}
                <td>
                  <span className={styles.clientText} title={row.clientName}>
                    {row.clientName}
                  </span>
                </td>

                {/* Department */}
                <td>
                  <span className={styles.deptText}>{row.department}</span>
                </td>

                {/* Days Worked */}
                <td>
                  <div className={styles.daysCell}>
                    <span className={styles.daysMain}>{row.presentDays} / {row.workingDays}</span>
                    <span className={styles.daysSub}>Paid: {row.paidDays}</span>
                  </div>
                </td>

                {/* Overtime */}
                <td>
                  <div className={styles.otCell}>
                    <span className={styles.otAmount}>{formatRupee(row.overtimeAmount)}</span>
                    {row.overtimeHours > 0 && (
                      <span className={styles.otHours}>{row.overtimeHours} hrs</span>
                    )}
                  </div>
                </td>

                {/* Gross Salary */}
                <td>
                  <span className={styles.grossAmount}>{formatRupee(row.grossSalary)}</span>
                </td>

                {/* Deductions */}
                <td>
                  <span className={styles.deductionAmount}>{formatRupee(row.totalDeductions)}</span>
                </td>

                {/* Net Salary */}
                <td>
                  <strong className={styles.netAmount}>{formatRupee(row.netSalary)}</strong>
                </td>

                {/* Payroll Status */}
                <td>
                  {getStatusBadge(row.status)}
                </td>

                {/* Actions */}
                <td className={styles.tdActions}>
                  <div className={styles.actionMenuWrap} ref={activeMenuId === row.id ? menuRef : null}>
                    <button
                      type="button"
                      className={styles.iconBtn}
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveMenuId(activeMenuId === row.id ? null : row.id);
                      }}
                      aria-label="Payroll Actions"
                    >
                      <MoreVertical size={16} />
                    </button>

                    {activeMenuId === row.id && (
                      <div className={styles.actionDropdown}>
                        <button
                          type="button"
                          onClick={() => {
                            setActiveMenuId(null);
                            onViewDetails(row);
                          }}
                        >
                          <Eye size={14} />
                          <span>View Details</span>
                        </button>

                        {row.status === 'pending' && (
                          <button
                            type="button"
                            className={styles.actionPrimary}
                            onClick={() => {
                              setActiveMenuId(null);
                              onCalculateSalary(row);
                            }}
                          >
                            <Calculator size={14} />
                            <span>Calculate Salary</span>
                          </button>
                        )}

                        {row.status === 'calculated' && (
                          <>
                            <button
                              type="button"
                              onClick={() => {
                                setActiveMenuId(null);
                                onEditPayroll(row);
                              }}
                            >
                              <Edit size={14} />
                              <span>Edit Payroll</span>
                            </button>
                            <button
                              type="button"
                              className={styles.actionSuccess}
                              onClick={() => {
                                setActiveMenuId(null);
                                onApprovePayroll(row);
                              }}
                            >
                              <CheckCircle size={14} />
                              <span>Approve Payroll</span>
                            </button>
                          </>
                        )}

                        {row.status === 'processed' && (
                          <>
                            <button
                              type="button"
                              onClick={() => {
                                setActiveMenuId(null);
                                onViewSlip(row);
                              }}
                            >
                              <FileText size={14} />
                              <span>View Slip</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setActiveMenuId(null);
                                onGenerateSlip(row);
                              }}
                            >
                              <Printer size={14} />
                              <span>Generate Slip</span>
                            </button>
                          </>
                        )}

                        {(row.status === 'on_hold' || row.status === 'on hold') && (
                          <button
                            type="button"
                            className={styles.actionWarning}
                            onClick={() => {
                              setActiveMenuId(null);
                              onResolveIssue(row);
                            }}
                          >
                            <AlertTriangle size={14} />
                            <span>Resolve Issue</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card Layout */}
      <div className={styles.mobileCardsList}>
        {records.map((row) => (
          <div key={row.id} className={styles.mobileCard}>
            <div className={styles.mobileCardTop}>
              <div className={styles.mobileEmp}>
                <Avatar initials={row.initials} name={row.employeeName} size="sm" />
                <div>
                  <span className={styles.mobileEmpName}>{row.employeeName}</span>
                  <span className={styles.mobileEmpId}>{row.employeeId}</span>
                </div>
              </div>
              {getStatusBadge(row.status)}
            </div>

            <div className={styles.mobileClient}>{row.clientName}</div>

            <div className={styles.mobileDataGrid}>
              <div className={styles.mobileDataRow}>
                <span>Paid Days</span>
                <strong>{row.paidDays} / {row.workingDays}</strong>
              </div>
              <div className={styles.mobileDataRow}>
                <span>Overtime</span>
                <span>{formatRupee(row.overtimeAmount)}</span>
              </div>
              <div className={styles.mobileDataRow}>
                <span>Gross Salary</span>
                <span>{formatRupee(row.grossSalary)}</span>
              </div>
              <div className={styles.mobileDataRow}>
                <span>Deductions</span>
                <span className={styles.textDanger}>-{formatRupee(row.totalDeductions)}</span>
              </div>
              <div className={`${styles.mobileDataRow} ${styles.mobileNetRow}`}>
                <span>Net Salary</span>
                <strong className={styles.mobileNetValue}>{formatRupee(row.netSalary)}</strong>
              </div>
            </div>

            <div className={styles.mobileCardFooter}>
              <button
                type="button"
                className={styles.mobileDetailBtn}
                onClick={() => onViewDetails(row)}
              >
                View Details
              </button>

              {row.status === 'pending' && (
                <button
                  type="button"
                  className={styles.mobilePrimaryBtn}
                  onClick={() => onCalculateSalary(row)}
                >
                  Calculate Salary
                </button>
              )}
              {row.status === 'calculated' && (
                <button
                  type="button"
                  className={styles.mobileSuccessBtn}
                  onClick={() => onApprovePayroll(row)}
                >
                  Approve Payroll
                </button>
              )}
              {row.status === 'processed' && (
                <button
                  type="button"
                  className={styles.mobileOutlineBtn}
                  onClick={() => onViewSlip(row)}
                >
                  View Slip
                </button>
              )}
              {(row.status === 'on_hold' || row.status === 'on hold') && (
                <button
                  type="button"
                  className={styles.mobileWarningBtn}
                  onClick={() => onResolveIssue(row)}
                >
                  Resolve Issue
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
