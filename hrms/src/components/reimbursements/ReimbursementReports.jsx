import React, { useState, useMemo } from 'react';
import { Download } from 'lucide-react';
import styles from '../../pages/admin/Reimbursements.module.css';

export default function ReimbursementReports({ claims, expenseTypes, onExport }) {
  const [reportView, setReportView] = useState('expense-type'); // 'expense-type', 'department', 'client-site', 'employee'

  // Aggregations
  const expenseTypeReport = useMemo(() => {
    return expenseTypes.map(t => {
      const matched = claims.filter(c => c.expenseType === t.name);
      const totalClaimed = matched.reduce((s, c) => s + (Number(c.amount) || 0), 0);
      const totalApproved = matched.reduce((s, c) => s + (Number(c.approvedAmount) || 0), 0);
      const totalPaid = matched.reduce((s, c) => s + (Number(c.paidAmount) || 0), 0);
      return {
        name: t.name,
        code: t.code,
        count: matched.length,
        totalClaimed,
        totalApproved,
        totalPaid
      };
    });
  }, [claims, expenseTypes]);

  const departmentReport = useMemo(() => {
    const depts = Array.from(new Set(claims.map(c => c.department).filter(Boolean)));
    return depts.map(dept => {
      const matched = claims.filter(c => c.department === dept);
      const totalClaimed = matched.reduce((s, c) => s + (Number(c.amount) || 0), 0);
      const totalApproved = matched.reduce((s, c) => s + (Number(c.approvedAmount) || 0), 0);
      const totalPaid = matched.reduce((s, c) => s + (Number(c.paidAmount) || 0), 0);
      return {
        department: dept,
        count: matched.length,
        totalClaimed,
        totalApproved,
        totalPaid
      };
    });
  }, [claims]);

  const siteReport = useMemo(() => {
    const sites = Array.from(new Set(claims.map(c => c.site).filter(Boolean)));
    return sites.map(site => {
      const matched = claims.filter(c => c.site === site);
      const client = matched[0]?.client || 'ABC Security';
      const totalClaimed = matched.reduce((s, c) => s + (Number(c.amount) || 0), 0);
      const totalApproved = matched.reduce((s, c) => s + (Number(c.approvedAmount) || 0), 0);
      const totalPaid = matched.reduce((s, c) => s + (Number(c.paidAmount) || 0), 0);
      return {
        site,
        client,
        count: matched.length,
        totalClaimed,
        totalApproved,
        totalPaid
      };
    });
  }, [claims]);

  const employeeReport = useMemo(() => {
    const empIds = Array.from(new Set(claims.map(c => c.employeeCode).filter(Boolean)));
    return empIds.map(code => {
      const matched = claims.filter(c => c.employeeCode === code);
      const name = matched[0]?.employeeName || code;
      const dept = matched[0]?.department || '';
      const totalClaimed = matched.reduce((s, c) => s + (Number(c.amount) || 0), 0);
      const totalApproved = matched.reduce((s, c) => s + (Number(c.approvedAmount) || 0), 0);
      const totalPaid = matched.reduce((s, c) => s + (Number(c.paidAmount) || 0), 0);
      return {
        code,
        name,
        dept,
        count: matched.length,
        totalClaimed,
        totalApproved,
        totalPaid
      };
    });
  }, [claims]);

  return (
    <div className={styles.reportsContainer}>
      
      {/* Sub-nav view selector & Export */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div className={styles.reportsSubnav}>
          <button
            type="button"
            className={`${styles.reportNavBtn} ${reportView === 'expense-type' ? styles.reportNavBtnActive : ''}`}
            onClick={() => setReportView('expense-type')}
          >
            By Expense Category
          </button>
          <button
            type="button"
            className={`${styles.reportNavBtn} ${reportView === 'department' ? styles.reportNavBtnActive : ''}`}
            onClick={() => setReportView('department')}
          >
            By Department
          </button>
          <button
            type="button"
            className={`${styles.reportNavBtn} ${reportView === 'client-site' ? styles.reportNavBtnActive : ''}`}
            onClick={() => setReportView('client-site')}
          >
            By Client / Site
          </button>
          <button
            type="button"
            className={`${styles.reportNavBtn} ${reportView === 'employee' ? styles.reportNavBtnActive : ''}`}
            onClick={() => setReportView('employee')}
          >
            By Employee
          </button>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            className={styles.btnSecondary}
            style={{ fontSize: '12px', padding: '6px 12px' }}
            onClick={() => onExport('excel')}
          >
            <Download size={13} />
            <span>Excel</span>
          </button>
          <button
            type="button"
            className={styles.btnSecondary}
            style={{ fontSize: '12px', padding: '6px 12px' }}
            onClick={() => onExport('pdf')}
          >
            <Download size={13} />
            <span>PDF</span>
          </button>
        </div>
      </div>

      {/* Reports Table based on active subview */}
      <div className={styles.tableContainer}>
        {reportView === 'expense-type' && (
          <table className={styles.dataTable}>
            <thead>
              <tr>
                <th>Expense Category</th>
                <th>Code</th>
                <th>Total Claims Filed</th>
                <th>Total Claimed Amount</th>
                <th>Total Approved Amount</th>
                <th>Total Settled Amount</th>
              </tr>
            </thead>
            <tbody>
              {expenseTypeReport.map(r => (
                <tr key={r.name}>
                  <td><strong>{r.name}</strong></td>
                  <td><code>{r.code}</code></td>
                  <td>{r.count} claims</td>
                  <td>₹{r.totalClaimed.toLocaleString()}</td>
                  <td style={{ color: '#16a34a', fontWeight: 600 }}>₹{r.totalApproved.toLocaleString()}</td>
                  <td style={{ color: '#15803d', fontWeight: 700 }}>₹{r.totalPaid.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {reportView === 'department' && (
          <table className={styles.dataTable}>
            <thead>
              <tr>
                <th>Department</th>
                <th>Claims Submitted</th>
                <th>Total Claimed Amount</th>
                <th>Total Approved Amount</th>
                <th>Total Settled Amount</th>
              </tr>
            </thead>
            <tbody>
              {departmentReport.map(r => (
                <tr key={r.department}>
                  <td><strong>{r.department}</strong></td>
                  <td>{r.count} claims</td>
                  <td>₹{r.totalClaimed.toLocaleString()}</td>
                  <td style={{ color: '#16a34a', fontWeight: 600 }}>₹{r.totalApproved.toLocaleString()}</td>
                  <td style={{ color: '#15803d', fontWeight: 700 }}>₹{r.totalPaid.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {reportView === 'client-site' && (
          <table className={styles.dataTable}>
            <thead>
              <tr>
                <th>Site / Location</th>
                <th>Client Enterprise</th>
                <th>Claims Submitted</th>
                <th>Total Claimed</th>
                <th>Total Approved</th>
                <th>Total Paid</th>
              </tr>
            </thead>
            <tbody>
              {siteReport.map(r => (
                <tr key={r.site}>
                  <td><strong>{r.site}</strong></td>
                  <td>{r.client}</td>
                  <td>{r.count} claims</td>
                  <td>₹{r.totalClaimed.toLocaleString()}</td>
                  <td style={{ color: '#16a34a', fontWeight: 600 }}>₹{r.totalApproved.toLocaleString()}</td>
                  <td style={{ color: '#15803d', fontWeight: 700 }}>₹{r.totalPaid.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {reportView === 'employee' && (
          <table className={styles.dataTable}>
            <thead>
              <tr>
                <th>Employee Code</th>
                <th>Employee Name</th>
                <th>Department</th>
                <th>Claims Filed</th>
                <th>Total Claimed</th>
                <th>Total Approved</th>
                <th>Total Paid</th>
              </tr>
            </thead>
            <tbody>
              {employeeReport.map(r => (
                <tr key={r.code}>
                  <td><code>{r.code}</code></td>
                  <td><strong>{r.name}</strong></td>
                  <td>{r.dept}</td>
                  <td>{r.count} claims</td>
                  <td>₹{r.totalClaimed.toLocaleString()}</td>
                  <td style={{ color: '#16a34a', fontWeight: 600 }}>₹{r.totalApproved.toLocaleString()}</td>
                  <td style={{ color: '#15803d', fontWeight: 700 }}>₹{r.totalPaid.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

    </div>
  );
}
