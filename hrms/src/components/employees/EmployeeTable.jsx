import React from 'react';
import StatusBadge from '../common/StatusBadge';
import EmployeeActionMenu from './EmployeeActionMenu';
import EmptyState from '../common/EmptyState';
import styles from './EmployeeTable.module.css';

/**
 * EmployeeTable Component
 * Displays a list of employees in an enterprise table for desktop,
 * and a list of cards for mobile.
 */
function EmployeeTable({
  employees = [],
  loading = false,
  onAction,
  onResetFilters
}) {
  if (loading) {
    return (
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Employee ID</th>
              <th>Employee</th>
              <th>Company</th>
              <th>Department</th>
              <th>Designation</th>
              <th>Contact</th>
              <th>Status</th>
              <th className={styles.textCenter}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {[1, 2, 3, 4, 5].map((idx) => (
              <tr key={idx} className={styles.skeletonRow}>
                <td><div className={styles.skeletonBarShort} style={{ width: '60px' }} /></td>
                <td>
                  <div className={styles.skeletonEmployee}>
                    <div className={styles.skeletonTextStack}>
                      <div className={styles.skeletonBarShort} style={{ width: '120px' }} />
                    </div>
                  </div>
                </td>
                <td><div className={styles.skeletonBarShort} style={{ width: '150px' }} /></td>
                <td><div className={styles.skeletonBarShort} style={{ width: '80px' }} /></td>
                <td><div className={styles.skeletonBarShort} style={{ width: '100px' }} /></td>
                <td><div className={styles.skeletonBarShort} style={{ width: '110px' }} /></td>
                <td><div className={styles.skeletonBadge} /></td>
                <td><div className={styles.skeletonAction} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (employees.length === 0) {
    return (
      <div className={styles.emptyWrapper}>
        <EmptyState
          title="No employees found"
          description="Try changing your search or filters to locate employee profiles."
          actionLabel="Reset Filters"
          onAction={onResetFilters}
        />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Desktop / Tablet Grid Table */}
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Employee ID</th>
              <th>Employee</th>
              <th>Company</th>
              <th>Department</th>
              <th>Designation</th>
              <th>Contact</th>
              <th>Status</th>
              <th className={styles.textCenter}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {employees.map((employee) => (
              <tr key={employee.id || employee._id || employee.employeeId}>
                <td>
                  <span role="text" className={styles.employeeId}>{employee.employeeId}</span>
                </td>
                <td>
                  <div className={String(employee.status || '').toLowerCase() === 'inactive' ? `${styles.employeeCell} ${styles.inactiveRow}` : styles.employeeCell}>
                    <span className={styles.employeeName}>{employee.name}</span>
                  </div>
                </td>
                <td>
                  <span className={styles.companyName}>{employee.clientName || employee.companyName || '—'}</span>
                </td>
                <td>
                  <span className={styles.departmentName}>{employee.department || '—'}</span>
                </td>
                <td>
                  <span className={styles.designationName}>{employee.designation || '—'}</span>
                </td>
                <td>
                  <span className={styles.contactPhone}>{employee.contact || employee.mobile || '—'}</span>
                </td>
                <td>
                  <StatusBadge status={employee.status} />
                </td>
                <td className={styles.textCenter}>
                  <EmployeeActionMenu employee={employee} onAction={onAction} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card Layout */}
      <div className={styles.mobileList}>
        {employees.map((employee) => (
          <div key={employee.id || employee._id || employee.employeeId} className={styles.mobileCard}>
            <div className={styles.cardHeader}>
              <div className={styles.employeeInfo}>
                <div className={styles.info}>
                  <span className={styles.employeeId}>{employee.employeeId}</span>
                  <h4 className={styles.employeeName}>{employee.name}</h4>
                </div>
              </div>
              <StatusBadge status={employee.status} />
            </div>

            <div className={styles.cardBody}>
              <div className={styles.cardSection}>
                <span className={styles.cardLabel}>Client / Company</span>
                <div className={styles.cardValue}>{employee.clientName || employee.companyName || '—'}</div>
              </div>

              <div className={styles.cardGrid}>
                <div>
                  <span className={styles.cardLabel}>Department</span>
                  <div className={styles.cardValue}>{employee.department}</div>
                </div>
                <div>
                  <span className={styles.cardLabel}>Designation</span>
                  <div className={styles.cardValue}>{employee.designation}</div>
                </div>
              </div>

              <div className={styles.cardFooter}>
                <div>
                  <span className={styles.cardLabel}>Contact</span>
                  <div className={styles.cardValue}>{employee.contact}</div>
                </div>
                <div className={styles.cardActions}>
                  <EmployeeActionMenu employee={employee} onAction={onAction} />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default EmployeeTable;
