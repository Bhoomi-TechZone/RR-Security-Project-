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
              const basic = row.basicSalary ?? row.basic ?? row.earnings?.basic ?? 0;
              const hra = row.hra ?? row.earnings?.hra ?? 0;
              const vda = row.vda ?? row.earnings?.vda ?? 0;
              const transportAllowance = row.transportAllowance ?? row.conveyance ?? row.earnings?.conveyance ?? 0;
              const otherAllowance = row.otherAllowance ?? row.earnings?.otherAllowance ?? 0;
              const specialAllowance = row.specialAllowance ?? row.earnings?.specialAllowance ?? 0;
              const totalAllowances = transportAllowance + otherAllowance + vda + specialAllowance;
              const fixedGross = row.grossSalary ?? row.earnings?.totalGross ?? (basic + hra + totalAllowances);
              const pf = row.pf ?? row.deductions?.pfEmployee ?? 0;
              const esi = row.esi ?? row.deductions?.esiEmployee ?? 0;
              const otherDeduction = row.otherDeduction ?? row.deductions?.otherDeductions ?? ((row.deductions?.pt || 0) + (row.deductions?.tds || 0));
              const fixedDeductions = row.totalDeductions ?? row.deductions?.totalDeductions ?? (pf + esi + otherDeduction);
              const fixedNet = row.netSalary ?? Math.max(0, fixedGross - fixedDeductions);

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
                  <td>{formatRupee(basic)}</td>
                  <td>{formatRupee(hra)}</td>
                  <td>{formatRupee(totalAllowances)}</td>
                  <td>
                    <strong className={styles.grossText}>{formatRupee(fixedGross)}</strong>
                  </td>
                  <td className={styles.deductText}>-{formatRupee(pf)}</td>
                  <td className={styles.deductText}>-{formatRupee(esi)}</td>
                  <td className={styles.deductText}>-{formatRupee(otherDeduction)}</td>
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
          const basic = row.basicSalary ?? row.basic ?? row.earnings?.basic ?? 0;
          const hra = row.hra ?? row.earnings?.hra ?? 0;
          const vda = row.vda ?? row.earnings?.vda ?? 0;
          const transportAllowance = row.transportAllowance ?? row.conveyance ?? row.earnings?.conveyance ?? 0;
          const otherAllowance = row.otherAllowance ?? row.earnings?.otherAllowance ?? 0;
          const specialAllowance = row.specialAllowance ?? row.earnings?.specialAllowance ?? 0;
          const totalAllowances = transportAllowance + otherAllowance + vda + specialAllowance;
          const fixedGross = row.grossSalary ?? row.earnings?.totalGross ?? (basic + hra + totalAllowances);
          const pf = row.pf ?? row.deductions?.pfEmployee ?? 0;
          const esi = row.esi ?? row.deductions?.esiEmployee ?? 0;
          const otherDeduction = row.otherDeduction ?? row.deductions?.otherDeductions ?? ((row.deductions?.pt || 0) + (row.deductions?.tds || 0));
          const fixedDeductions = row.totalDeductions ?? row.deductions?.totalDeductions ?? (pf + esi + otherDeduction);
          const fixedNet = row.netSalary ?? Math.max(0, fixedGross - fixedDeductions);

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
                  <span>{formatRupee(basic)} + {formatRupee(hra)}</span>
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
