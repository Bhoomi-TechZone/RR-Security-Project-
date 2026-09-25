import React, { useState } from 'react';
import { X, History, MoreVertical, Eye, FileText, Download, ShieldCheck } from 'lucide-react';
import { formatRupee } from '../../utils/payrollUtils';
import styles from './PayrollHistoryModal.module.css';

export default function PayrollHistoryModal({
  isOpen,
  historyData = [],
  onClose,
  onSelectMonth,
  onViewSlips,
  onViewStatutory,
  onExportHistory
}) {
  const [activeMenuId, setActiveMenuId] = useState(null);

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true">
      <div className={styles.modal}>
        <div className={styles.header}>
          <div className={styles.titleWrap}>
            <History size={20} className={styles.icon} />
            <div>
              <h2>Payroll History</h2>
              <span className={styles.sub}>Review previous payroll disbursement cycles</span>
            </div>
          </div>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Close history modal"
          >
            <X size={20} />
          </button>
        </div>

        <div className={styles.body}>
          <div className={styles.tableResponsive}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Month</th>
                  <th>Employees</th>
                  <th>Gross Payroll</th>
                  <th>Deductions</th>
                  <th>Net Payroll</th>
                  <th>Status</th>
                  <th>Processed Date</th>
                  <th className={styles.thActions}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {historyData.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <strong className={styles.monthName}>{item.month}</strong>
                    </td>
                    <td>{item.employees?.toLocaleString('en-IN')}</td>
                    <td>{formatRupee(item.grossPayroll)}</td>
                    <td className={styles.textRed}>-{formatRupee(item.deductions)}</td>
                    <td>
                      <strong className={styles.textPrimary}>{formatRupee(item.netPayroll)}</strong>
                    </td>
                    <td>
                      {item.status === 'Processed' ? (
                        <span className={styles.badgeProcessed}>Processed</span>
                      ) : (
                        <span className={styles.badgeProcessing}>Processing</span>
                      )}
                    </td>
                    <td>
                      <span className={styles.dateText}>{item.processedDate}</span>
                    </td>
                    <td className={styles.tdActions}>
                      <div className={styles.actionMenuWrap}>
                        <button
                          type="button"
                          className={styles.iconBtn}
                          onClick={() => setActiveMenuId(activeMenuId === item.id ? null : item.id)}
                          aria-label="Actions"
                        >
                          <MoreVertical size={16} />
                        </button>

                        {activeMenuId === item.id && (
                          <div className={styles.actionDropdown}>
                            <button
                              type="button"
                              onClick={() => {
                                setActiveMenuId(null);
                                onSelectMonth(item.monthCode);
                                onClose();
                              }}
                            >
                              <Eye size={14} />
                              <span>View Summary</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setActiveMenuId(null);
                                onViewSlips(item);
                                onClose();
                              }}
                            >
                              <FileText size={14} />
                              <span>View Slips</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setActiveMenuId(null);
                                onViewStatutory(item);
                                onClose();
                              }}
                            >
                              <ShieldCheck size={14} />
                              <span>View Statutory Reports</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setActiveMenuId(null);
                                onExportHistory(item);
                              }}
                            >
                              <Download size={14} />
                              <span>Export</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className={styles.footer}>
          <button
            type="button"
            className={styles.closeModalBtn}
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
