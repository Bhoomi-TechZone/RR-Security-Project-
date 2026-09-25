import React from 'react';
import { Eye, Download, Printer, PlusCircle } from 'lucide-react';
import Avatar from '../common/Avatar';
import { formatRupee } from '../../utils/payrollUtils';
import styles from './SalarySlipsTable.module.css';

export default function SalarySlipsTable({
  slips = [],
  onViewSlip,
  onDownloadSlip,
  onPrintSlip,
  onGenerateSingleSlip
}) {
  return (
    <div className={styles.tableCard}>
      <div className={styles.tableResponsive}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Employee</th>
              <th>Employee ID</th>
              <th>Client</th>
              <th>Salary Month</th>
              <th>Gross Salary</th>
              <th>Deductions</th>
              <th>Net Salary</th>
              <th>Slip Status</th>
              <th>Generated Date</th>
              <th className={styles.thActions}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {slips.map((slip) => {
              const isGenerated = slip.status?.toLowerCase() === 'generated';

              return (
                <tr key={slip.id} className={styles.row}>
                  <td>
                    <div
                      className={styles.employeeCell}
                      onClick={() => isGenerated && onViewSlip(slip)}
                      role="button"
                      tabIndex={0}
                    >
                      <Avatar initials={slip.initials} name={slip.employeeName} size="sm" />
                      <div className={styles.empInfo}>
                        <span className={styles.empName}>{slip.employeeName}</span>
                        <span className={styles.empSub}>{slip.designation}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={styles.idCode}>{slip.employeeId}</span>
                  </td>
                  <td>
                    <span className={styles.clientText} title={slip.clientName}>
                      {slip.clientName}
                    </span>
                  </td>
                  <td>{slip.salaryMonth}</td>
                  <td>{formatRupee(slip.earnings?.grossSalary)}</td>
                  <td className={styles.deductText}>-{formatRupee(slip.deductions?.totalDeductions)}</td>
                  <td>
                    <strong className={styles.netText}>{formatRupee(slip.netSalary)}</strong>
                  </td>
                  <td>
                    {isGenerated ? (
                      <span className={styles.badgeGenerated}>Generated</span>
                    ) : (
                      <span className={styles.badgePending}>Pending</span>
                    )}
                  </td>
                  <td>
                    <span className={styles.dateText}>{slip.generatedDate || '—'}</span>
                  </td>
                  <td className={styles.tdActions}>
                    <div className={styles.actionBtns}>
                      {isGenerated ? (
                        <>
                          <button
                            type="button"
                            className={styles.viewBtn}
                            onClick={() => onViewSlip(slip)}
                            title="View Salary Slip"
                          >
                            <Eye size={15} />
                            <span>View</span>
                          </button>
                          <button
                            type="button"
                            className={styles.iconBtn}
                            onClick={() => onDownloadSlip(slip)}
                            title="Download PDF"
                          >
                            <Download size={14} />
                          </button>
                          <button
                            type="button"
                            className={styles.iconBtn}
                            onClick={() => onPrintSlip(slip)}
                            title="Print Slip"
                          >
                            <Printer size={14} />
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          className={styles.generateBtn}
                          onClick={() => onGenerateSingleSlip(slip)}
                          title="Generate Salary Slip"
                        >
                          <PlusCircle size={14} />
                          <span>Generate</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile list */}
      <div className={styles.mobileList}>
        {slips.map((slip) => {
          const isGenerated = slip.status?.toLowerCase() === 'generated';

          return (
            <div key={slip.id} className={styles.mobileCard}>
              <div className={styles.mobileCardHeader}>
                <div className={styles.employeeCell}>
                  <Avatar initials={slip.initials} name={slip.employeeName} size="sm" />
                  <div>
                    <span className={styles.empName}>{slip.employeeName}</span>
                    <span className={styles.idCode}>{slip.employeeId}</span>
                  </div>
                </div>
                {isGenerated ? (
                  <span className={styles.badgeGenerated}>Generated</span>
                ) : (
                  <span className={styles.badgePending}>Pending</span>
                )}
              </div>

              <div className={styles.mobileGrid}>
                <div className={styles.mobileRow}>
                  <span>Client</span>
                  <span>{slip.clientName}</span>
                </div>
                <div className={styles.mobileRow}>
                  <span>Month</span>
                  <span>{slip.salaryMonth}</span>
                </div>
                <div className={styles.mobileRow}>
                  <span>Gross Salary</span>
                  <span>{formatRupee(slip.earnings?.grossSalary)}</span>
                </div>
                <div className={styles.mobileRow}>
                  <span>Deductions</span>
                  <span className={styles.deductText}>-{formatRupee(slip.deductions?.totalDeductions)}</span>
                </div>
                <div className={`${styles.mobileRow} ${styles.mobileNetRow}`}>
                  <span>Net Salary</span>
                  <strong className={styles.netText}>{formatRupee(slip.netSalary)}</strong>
                </div>
              </div>

              <div className={styles.mobileActions}>
                {isGenerated ? (
                  <>
                    <button
                      type="button"
                      className={styles.mobilePrimaryBtn}
                      onClick={() => onViewSlip(slip)}
                    >
                      <Eye size={14} />
                      <span>View Slip</span>
                    </button>
                    <button
                      type="button"
                      className={styles.mobileOutlineBtn}
                      onClick={() => onDownloadSlip(slip)}
                    >
                      <Download size={14} />
                    </button>
                    <button
                      type="button"
                      className={styles.mobileOutlineBtn}
                      onClick={() => onPrintSlip(slip)}
                    >
                      <Printer size={14} />
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    className={styles.mobilePrimaryBtn}
                    onClick={() => onGenerateSingleSlip(slip)}
                  >
                    <PlusCircle size={14} />
                    <span>Generate Slip</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
