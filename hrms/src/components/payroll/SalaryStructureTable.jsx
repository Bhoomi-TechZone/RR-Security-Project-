import React from 'react';
import { Eye, Edit3 } from 'lucide-react';
import Avatar from '../common/Avatar';
import { formatRupee } from '../../utils/payrollUtils';
import styles from './SalaryStructureTable.module.css';

export default function SalaryStructureTable({
  records = [],
  onViewStructure,
  onEditStructure
}) {
  return (
    <div className={styles.tableCard}>
      <div className={styles.tableResponsive}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Employee</th>
              <th>Employee ID</th>
              <th>Basic</th>
              <th>HRA</th>
              <th>Allowances</th>
              <th>Gross Salary</th>
              <th>PF</th>
              <th>ESI</th>
              <th>Other Deductions</th>
              <th>Net Salary</th>
              <th className={styles.thActions}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {records.map((row) => {
              const totalAllowances = (row.transportAllowance || 0) + (row.otherAllowance || 0);
              const fixedGross = (row.basicSalary || 0) + (row.hra || 0) + totalAllowances;
              const fixedDeductions = (row.pf || 0) + (row.esi || 0) + (row.otherDeduction || 0);
              const fixedNet = fixedGross - fixedDeductions;

              return (
                <tr key={row.id} className={styles.row}>
                  <td>
                    <div
                      className={styles.employeeCell}
                      onClick={() => onViewStructure(row)}
                      role="button"
                      tabIndex={0}
                    >
                      <Avatar initials={row.initials} name={row.employeeName} size="sm" />
                      <div className={styles.empInfo}>
                        <span className={styles.empName}>{row.employeeName}</span>
                        <span className={styles.empSub}>{row.designation}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={styles.idCode}>{row.employeeId}</span>
                  </td>
                  <td>{formatRupee(row.basicSalary)}</td>
                  <td>{formatRupee(row.hra)}</td>
                  <td>{formatRupee(totalAllowances)}</td>
                  <td>
                    <strong className={styles.grossText}>{formatRupee(fixedGross)}</strong>
                  </td>
                  <td className={styles.deductText}>-{formatRupee(row.pf)}</td>
                  <td className={styles.deductText}>-{formatRupee(row.esi)}</td>
                  <td className={styles.deductText}>-{formatRupee(row.otherDeduction)}</td>
                  <td>
                    <strong className={styles.netText}>{formatRupee(fixedNet)}</strong>
                  </td>
                  <td className={styles.tdActions}>
                    <div className={styles.actionBtns}>
                      <button
                        type="button"
                        className={styles.viewBtn}
                        onClick={() => onViewStructure(row)}
                        title="View Structure"
                      >
                        <Eye size={15} />
                      </button>
                      <button
                        type="button"
                        className={styles.editBtn}
                        onClick={() => onEditStructure(row)}
                        title="Edit Salary Structure"
                      >
                        <Edit3 size={15} />
                        <span>Edit</span>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile view */}
      <div className={styles.mobileList}>
        {records.map((row) => {
          const totalAllowances = (row.transportAllowance || 0) + (row.otherAllowance || 0);
          const fixedGross = (row.basicSalary || 0) + (row.hra || 0) + totalAllowances;
          const fixedDeductions = (row.pf || 0) + (row.esi || 0) + (row.otherDeduction || 0);
          const fixedNet = fixedGross - fixedDeductions;

          return (
            <div key={row.id} className={styles.mobileCard}>
              <div className={styles.mobileHeader}>
                <div className={styles.employeeCell}>
                  <Avatar initials={row.initials} name={row.employeeName} size="sm" />
                  <div>
                    <span className={styles.empName}>{row.employeeName}</span>
                    <span className={styles.idCode}>{row.employeeId}</span>
                  </div>
                </div>
                <button
                  type="button"
                  className={styles.mobileEditBtn}
                  onClick={() => onEditStructure(row)}
                >
                  <Edit3 size={14} />
                  <span>Edit</span>
                </button>
              </div>

              <div className={styles.mobileGrid}>
                <div className={styles.mobileRow}>
                  <span>Basic + HRA</span>
                  <span>{formatRupee(row.basicSalary)} + {formatRupee(row.hra)}</span>
                </div>
                <div className={styles.mobileRow}>
                  <span>Allowances</span>
                  <span>{formatRupee(totalAllowances)}</span>
                </div>
                <div className={styles.mobileRow}>
                  <span>Fixed Gross</span>
                  <strong className={styles.grossText}>{formatRupee(fixedGross)}</strong>
                </div>
                <div className={styles.mobileRow}>
                  <span>PF + ESI + Other</span>
                  <span className={styles.deductText}>-{formatRupee(fixedDeductions)}</span>
                </div>
                <div className={`${styles.mobileRow} ${styles.mobileNetRow}`}>
                  <span>Base Net Pay</span>
                  <strong className={styles.netText}>{formatRupee(fixedNet)}</strong>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
