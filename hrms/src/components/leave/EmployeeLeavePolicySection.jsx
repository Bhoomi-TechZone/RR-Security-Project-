import React, { useState } from 'react';
import { Search, UserCheck, Calculator, Info, Award, User, RefreshCw } from 'lucide-react';
import styles from './EmployeeLeavePolicySection.module.css';

export default function EmployeeLeavePolicySection({
  employeeBalances = [],
  clients = [],
  departments = [],
  onAssignPolicyClick,
  onViewEmployeeLedger
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [clientFilter, setClientFilter] = useState('');
  const [deptFilter, setDeptFilter] = useState('');

  const filteredBalances = employeeBalances.filter((item) => {
    const query = searchTerm.toLowerCase().trim();
    if (query) {
      const matchName = item.employeeName?.toLowerCase().includes(query);
      const matchCode = item.employeeCode?.toLowerCase().includes(query);
      if (!matchName && !matchCode) return false;
    }
    if (clientFilter && item.client !== clientFilter) return false;
    if (deptFilter && item.department !== deptFilter) return false;
    return true;
  });

  return (
    <div className={styles.container}>
      {/* Formula & Policy Rule Banner */}
      <div className={styles.formulaBanner}>
        <div className={styles.formulaIconWrap}>
          <Calculator size={20} />
        </div>
        <div className={styles.formulaContent}>
          <h4 className={styles.formulaTitle}>Statutory Balance Calculation Standard</h4>
          <p className={styles.formulaText}>
            <strong>Available Balance</strong> = <span>Opening Balance</span> + <span>Monthly Accrual</span> - <span>Used Leave</span> - <span>Pending Approval</span>
          </p>
          <span className={styles.formulaSub}>
            Accruals are computed on the 1st of every calendar month. LWP does not credit balance and directly impacts payable days in Payroll.
          </span>
        </div>
      </div>

      {/* Filter and Action Header */}
      <div className={styles.cardHeader}>
        <div className={styles.searchWrap}>
          <Search size={16} className={styles.searchIcon} />
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search employee by name or code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className={styles.filtersGroup}>
          <select
            className={styles.selectFilter}
            value={clientFilter}
            onChange={(e) => setClientFilter(e.target.value)}
          >
            <option value="">All Clients</option>
            {clients.map((c) => (
              <option key={c.id || c.name} value={c.name}>{c.name}</option>
            ))}
          </select>

          <select
            className={styles.selectFilter}
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
          >
            <option value="">All Departments</option>
            {departments.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>

          <button
            type="button"
            className={styles.primaryAssignBtn}
            onClick={() => onAssignPolicyClick(null)}
          >
            <UserCheck size={16} />
            <span>Assign Leave Policy</span>
          </button>
        </div>
      </div>

      {/* Balances Table */}
      <div className={styles.tableCard}>
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Employee</th>
                <th>Employee Code</th>
                <th>Department & Designation</th>
                <th>Client & Site</th>
                <th>Leave Policy</th>
                <th>CL (Casual)</th>
                <th>SL (Sick)</th>
                <th>EL (Earned)</th>
                <th>LWP (Unpaid)</th>
                <th style={{ textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredBalances.length === 0 ? (
                <tr>
                  <td colSpan="10" className={styles.noDataCell}>
                    No employee policy records found matching your filters.
                  </td>
                </tr>
              ) : (
                filteredBalances.map((item) => {
                  const cl = item.balances?.CL || { opening: 0, accrued: 0, used: 0, pending: 0, available: 0 };
                  const sl = item.balances?.SL || { opening: 0, accrued: 0, used: 0, pending: 0, available: 0 };
                  const el = item.balances?.EL || { opening: 0, accrued: 0, used: 0, pending: 0, available: 0 };
                  const lwp = item.balances?.LWP || { used: 0 };

                  const clAvail = cl.opening + cl.accrued - cl.used - cl.pending;
                  const slAvail = sl.opening + sl.accrued - sl.used - sl.pending;
                  const elAvail = el.opening + el.accrued - el.used - el.pending;

                  return (
                    <tr key={item.id || item.employeeCode}>
                      <td>
                        <div className={styles.employeeCell}>
                          <div className={styles.avatar}>
                            {item.employeeName?.slice(0, 2).toUpperCase() || 'EM'}
                          </div>
                          <div className={styles.empDetails}>
                            <span className={styles.empName}>{item.employeeName}</span>
                            <span className={styles.joiningDate}>Joined {item.joiningDate}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={styles.codePill}>{item.employeeCode}</span>
                      </td>
                      <td>
                        <div className={styles.deptCell}>
                          <span className={styles.designation}>{item.designation}</span>
                          <span className={styles.dept}>{item.department}</span>
                        </div>
                      </td>
                      <td>
                        <div className={styles.deptCell}>
                          <span className={styles.clientText}>{item.client}</span>
                          <span className={styles.siteText}>{item.site}</span>
                        </div>
                      </td>
                      <td>
                        <span className={styles.policyBadge}>{item.policyName}</span>
                      </td>

                      {/* CL Balance Pill */}
                      <td>
                        <div className={styles.balancePillWrap}>
                          <div className={styles.balanceMain}>
                            <span className={styles.availNumber}>{clAvail}</span>
                            <span className={styles.availLabel}>Avail</span>
                          </div>
                          <div className={styles.balanceDetail}>
                            <span>Used: {cl.used}</span>
                            {cl.pending > 0 && <span className={styles.pendingText}>Pend: {cl.pending}</span>}
                          </div>
                        </div>
                      </td>

                      {/* SL Balance Pill */}
                      <td>
                        <div className={styles.balancePillWrap}>
                          <div className={styles.balanceMain}>
                            <span className={styles.availNumber}>{slAvail}</span>
                            <span className={styles.availLabel}>Avail</span>
                          </div>
                          <div className={styles.balanceDetail}>
                            <span>Used: {sl.used}</span>
                            {sl.pending > 0 && <span className={styles.pendingText}>Pend: {sl.pending}</span>}
                          </div>
                        </div>
                      </td>

                      {/* EL Balance Pill */}
                      <td>
                        <div className={styles.balancePillWrap}>
                          <div className={styles.balanceMain}>
                            <span className={styles.availNumber}>{elAvail}</span>
                            <span className={styles.availLabel}>Avail</span>
                          </div>
                          <div className={styles.balanceDetail}>
                            <span>Used: {el.used}</span>
                            {el.pending > 0 && <span className={styles.pendingText}>Pend: {el.pending}</span>}
                          </div>
                        </div>
                      </td>

                      {/* LWP Pill */}
                      <td>
                        <div className={styles.lwpPill}>
                          <span className={styles.lwpNumber}>{lwp.used} Days</span>
                          <span className={styles.lwpLabel}>Salary Deduct</span>
                        </div>
                      </td>

                      {/* Action */}
                      <td>
                        <div className={styles.actionCell}>
                          <button
                            type="button"
                            className={styles.assignBtn}
                            onClick={() => onAssignPolicyClick(item)}
                            title="Edit Policy or Balance"
                          >
                            Update
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
