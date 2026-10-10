import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Download,
  ChevronLeft,
  ChevronRight,
  Search,
  Plus,
  MoreVertical,
  X,
  Timer,
  Clock3,
  CircleCheck,
  IndianRupee,
  CalendarDays,
  Filter,
  Save,
  Trash2,
  Check,
  AlertCircle,
  RefreshCw,
  Eye
} from 'lucide-react';
import AdminLayout from '../../components/layout/AdminLayout';
import Pagination from '../../components/common/Pagination';
import StatusBadge from '../../components/common/StatusBadge';
import Toast from '../../components/common/Toast';
import EmptyState from '../../components/common/EmptyState';
import { usePermissions } from '../../context/PermissionContext';
import { useCompany } from '../../context/CompanyContext';
import overtimeService from '../../services/overtimeService';
import { employeeService } from '../../services/employeeService';
import { clientService } from '../../services/clientService';
import { generateReportPdf } from '../../utils/pdfExportUtil';
import { generateReportExcel } from '../../utils/excelExportUtil';
import styles from './Overtime.module.css';

const PAGE_SIZE = 10;
const SITES = ['Main Gate', 'Warehouse', 'Office Building', 'Hospital Block', 'Parking Area', 'Main Site', 'HQ Tower'];
const DEPARTMENTS = ['Security', 'Operations', 'Administration', 'HR', 'Accounts', 'Housekeeping', 'Facility Management'];

const formatCurrency = (value) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(value || 0);

const formatDate = (dateString) => {
  if (!dateString) return '—';
  const date = new Date(dateString.includes('T') ? dateString : `${dateString}T00:00:00`);
  if (Number.isNaN(date.getTime())) return dateString;
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
};

const asHoursLabel = (hours) => {
  const rounded = Number(hours || 0);
  if (Number.isInteger(rounded)) return `${rounded}h`;
  const whole = Math.floor(rounded);
  const minutes = Math.round((rounded - whole) * 60);
  return minutes > 0 ? `${whole}h ${minutes}m` : `${whole}h`;
};

function OvertimeSummaryCards({ summary }) {
  const cards = [
    { label: 'Total Overtime', value: `${asHoursLabel(summary?.totalHours || 0)} hrs`, icon: Timer, tone: styles.blue },
    { label: 'Pending', value: `${asHoursLabel(summary?.pendingHours || 0)} hrs`, icon: Clock3, tone: styles.yellow },
    { label: 'Approved', value: `${asHoursLabel(summary?.approvedHours || 0)} hrs`, icon: CircleCheck, tone: styles.green },
    { label: 'OT Amount', value: formatCurrency(summary?.totalAmount || 0), icon: IndianRupee, tone: styles.purple },
  ];

  return (
    <div className={styles.summaryGrid}>
      {cards.map(({ label, value, icon: Icon, tone }) => (
        <div key={label} className={styles.summaryCard}>
          <div className={styles.summaryValue}>
            <span className={styles.summaryLabel}>{label}</span>
            <span className={styles.summaryNumber}>{value}</span>
          </div>
          <div className={`${styles.iconWrap} ${tone}`}>
            <Icon size={20} />
          </div>
        </div>
      ))}
    </div>
  );
}

function OvertimeOverview({ summary }) {
  const items = [
    { label: 'Employees with Overtime', value: summary?.employeesWithOvertime ?? 0 },
    { label: 'Average OT / Employee', value: `${summary?.averageHoursPerEmployee ?? '0.0'} hrs` },
    { label: 'Highest OT', value: `${asHoursLabel(summary?.highestHours ?? 0)}` },
    { label: 'Pending Requests', value: summary?.pendingCount ?? 0 },
  ];

  return (
    <div className={styles.overviewCard}>
      <div className={styles.sectionHeader}>
        <h3 className={styles.sectionTitle}>Overtime Overview</h3>
      </div>
      <div className={styles.overviewGrid}>
        {items.map((item) => (
          <div key={item.label} className={styles.overviewItem}>
            <span className={styles.overviewLabel}>{item.label}</span>
            <span className={styles.overviewValue}>{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function OvertimeDateSelector({ selectedDate, setSelectedDate, onToday }) {
  const moveDate = (direction) => {
    const date = new Date(selectedDate || new Date().toISOString().slice(0, 10));
    date.setDate(date.getDate() + direction);
    setSelectedDate(date.toISOString().slice(0, 10));
  };

  return (
    <div className={styles.dateRow}>
      <div className={styles.dateSelectorWrap}>
        <span className={styles.dateLabel}>Overtime Date</span>
        <div className={styles.dateNavigator}>
          <button type="button" className={styles.dateNavBtn} onClick={() => moveDate(-1)} aria-label="Previous date">
            <ChevronLeft size={16} />
          </button>
          <div className={styles.dateValue}>{formatDate(selectedDate)}</div>
          <button type="button" className={styles.dateNavBtn} onClick={() => moveDate(1)} aria-label="Next date">
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
        <input
          type="date"
          className={styles.input}
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          aria-label="Select overtime date"
        />
        <button type="button" className={styles.inlineBtn} onClick={onToday}>Today</button>
      </div>
    </div>
  );
}

function OvertimeFilters({
  searchTerm,
  setSearchTerm,
  clientFilter,
  setClientFilter,
  siteFilter,
  setSiteFilter,
  departmentFilter,
  setDepartmentFilter,
  statusFilter,
  setStatusFilter,
  fromDate,
  setFromDate,
  toDate,
  setToDate,
  onReset,
  clientsList = [],
}) {
  return (
    <div className={styles.filterCard}>
      <div className={styles.filterToolbar}>
        <div className={styles.field}>
          <label className={styles.fieldLabel}>Search</label>
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
            <input
              className={styles.input}
              type="text"
              placeholder="Search employee or employee ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingLeft: '36px' }}
            />
          </div>
        </div>

        <div className={styles.field}>
          <label className={styles.fieldLabel}>Client</label>
          <select className={styles.select} value={clientFilter} onChange={(e) => setClientFilter(e.target.value)}>
            <option value="">All Clients</option>
            {clientsList.map((client) => (
              <option key={client.id || client._id || client.clientName || client.name} value={client.clientName || client.name}>
                {client.clientName || client.name}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.field}>
          <label className={styles.fieldLabel}>Site</label>
          <select className={styles.select} value={siteFilter} onChange={(e) => setSiteFilter(e.target.value)}>
            <option value="">All Sites</option>
            {SITES.map((site) => (
              <option key={site} value={site}>{site}</option>
            ))}
          </select>
        </div>

        <div className={styles.field}>
          <label className={styles.fieldLabel}>Department</label>
          <select className={styles.select} value={departmentFilter} onChange={(e) => setDepartmentFilter(e.target.value)}>
            <option value="">All Departments</option>
            {DEPARTMENTS.map((dept) => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
        </div>

        <div className={styles.field}>
          <label className={styles.fieldLabel}>Status</label>
          <select className={styles.select} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        <div className={styles.field}>
          <label className={styles.fieldLabel}>From Date</label>
          <input className={styles.input} type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
        </div>

        <div className={styles.field}>
          <label className={styles.fieldLabel}>To Date</label>
          <input className={styles.input} type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
        </div>

        <div className={styles.field}>
          <label className={styles.fieldLabel}>Action</label>
          <button type="button" className={styles.resetBtn} onClick={onReset}>Reset Filters</button>
        </div>
      </div>
    </div>
  );
}

function OvertimeTable({ rows, onView, onApprove, onReject, onDelete }) {
  const [openMenuId, setOpenMenuId] = useState(null);

  const getInitials = (name) => {
    if (!name) return 'OT';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className={styles.tableCard}>
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Employee</th>
              <th>Employee ID</th>
              <th>Client</th>
              <th>Site</th>
              <th>Date</th>
              <th>Regular Hours</th>
              <th>Overtime Hours</th>
              <th>OT Rate</th>
              <th>OT Amount</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const rowKey = row._id || row.overtimeId || row.id;
              return (
                <tr key={rowKey}>
                  <td>
                    <div className={styles.employeeCell}>
                      <div className={styles.employeeAvatar}>{getInitials(row.employeeName)}</div>
                      <span className={styles.employeeName}>{row.employeeName}</span>
                    </div>
                  </td>
                  <td className={styles.secondaryText}>{row.employeeId}</td>
                  <td className={styles.secondaryText}>{row.clientName || 'General Client'}</td>
                  <td className={styles.secondaryText}>{row.site || 'Main Gate'}</td>
                  <td className={styles.secondaryText}>{formatDate(row.date)}</td>
                  <td className={styles.secondaryText}>{asHoursLabel(row.regularHours || 8)}</td>
                  <td className={styles.otHours}>{asHoursLabel(row.overtimeHours)}</td>
                  <td className={styles.rateValue}>{formatCurrency(row.overtimeRate)} / hr</td>
                  <td className={styles.currencyValue}>{formatCurrency(row.overtimeAmount)}</td>
                  <td><StatusBadge status={row.status} /></td>
                  <td className={styles.actionCell}>
                    <button
                      className={styles.iconBtn}
                      aria-label="Open overtime actions"
                      onClick={() => setOpenMenuId(openMenuId === rowKey ? null : rowKey)}
                    >
                      <MoreVertical size={16} />
                    </button>

                    {openMenuId === rowKey && (
                      <div className={styles.actionMenu}>
                        <ul className={styles.menuList}>
                          <li>
                            <button
                              className={styles.menuItem}
                              onClick={() => { onView(row); setOpenMenuId(null); }}
                            >
                              <Eye size={14} style={{ marginRight: '6px' }} /> View Details
                            </button>
                          </li>
                          {row.status === 'pending' && (
                            <>
                              <li>
                                <button
                                  className={styles.menuItem}
                                  style={{ color: 'var(--success, #16a34a)' }}
                                  onClick={() => { onApprove(row); setOpenMenuId(null); }}
                                >
                                  <Check size={14} style={{ marginRight: '6px' }} /> Approve
                                </button>
                              </li>
                              <li>
                                <button
                                  className={styles.menuItem}
                                  style={{ color: 'var(--danger, #dc2626)' }}
                                  onClick={() => { onReject(row); setOpenMenuId(null); }}
                                >
                                  <X size={14} style={{ marginRight: '6px' }} /> Reject
                                </button>
                              </li>
                            </>
                          )}
                          <li>
                            <button
                              className={styles.menuItem}
                              style={{ color: 'var(--danger, #dc2626)' }}
                              onClick={() => { onDelete(row); setOpenMenuId(null); }}
                            >
                              <Trash2 size={14} style={{ marginRight: '6px' }} /> Delete
                            </button>
                          </li>
                        </ul>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function OvertimeDetailsDrawer({ selectedOvertime, onClose, onApprove, onReject }) {
  if (!selectedOvertime) return null;

  return (
    <>
      <div className={styles.drawerOverlay} onClick={onClose} aria-hidden="true" />
      <aside className={styles.drawer} aria-label="Overtime details drawer">
        <div className={styles.drawerHeader}>
          <h3 className={styles.drawerTitle}>Overtime Details</h3>
          <button className={styles.closeBtn} aria-label="Close details" onClick={onClose}><X size={20} /></button>
        </div>

        <div className={styles.drawerBody}>
          <h4 className={styles.drawerName}>{selectedOvertime.employeeName}</h4>
          <p className={styles.drawerId}>{selectedOvertime.employeeId} • {selectedOvertime.designation || 'Staff Guard'}</p>

          <div className={styles.detailGroup}>
            <span className={styles.detailLabel}>Client</span>
            <span className={styles.detailValue}>{selectedOvertime.clientName || 'General Client'}</span>
          </div>
          <div className={styles.detailGroup}>
            <span className={styles.detailLabel}>Site / Location</span>
            <span className={styles.detailValue}>{selectedOvertime.site || 'Main Site'}</span>
          </div>
          <div className={styles.detailGroup}>
            <span className={styles.detailLabel}>Department</span>
            <span className={styles.detailValue}>{selectedOvertime.department || 'Security'}</span>
          </div>
          <div className={styles.detailGroup}>
            <span className={styles.detailLabel}>Date</span>
            <span className={styles.detailValue}>{formatDate(selectedOvertime.date)}</span>
          </div>
          <div className={styles.detailGroup}>
            <span className={styles.detailLabel}>Shift / Timings</span>
            <span className={styles.detailValue}>{selectedOvertime.shift || 'General'} ({selectedOvertime.startTime || '18:00'} - {selectedOvertime.endTime || '22:00'})</span>
          </div>
          <div className={styles.detailGroup}>
            <span className={styles.detailLabel}>Overtime Hours</span>
            <span className={styles.detailValue}>{asHoursLabel(selectedOvertime.overtimeHours)}</span>
          </div>
          <div className={styles.detailGroup}>
            <span className={styles.detailLabel}>OT Rate</span>
            <span className={styles.detailValue}>{formatCurrency(selectedOvertime.overtimeRate)} / hr</span>
          </div>
          <div className={styles.detailGroup}>
            <span className={styles.detailLabel}>Overtime Amount</span>
            <span className={styles.detailValue} style={{ color: 'var(--success, #16a34a)', fontWeight: 'bold' }}>
              {formatCurrency(selectedOvertime.overtimeAmount)}
            </span>
          </div>
          <div className={styles.detailGroup}>
            <span className={styles.detailLabel}>Status</span>
            <StatusBadge status={selectedOvertime.status} />
          </div>
          {selectedOvertime.reason && (
            <div className={styles.detailGroup}>
              <span className={styles.detailLabel}>Reason</span>
              <span className={styles.detailValue}>{selectedOvertime.reason}</span>
            </div>
          )}
          {selectedOvertime.approvedBy && (
            <div className={styles.detailGroup}>
              <span className={styles.detailLabel}>Processed By</span>
              <span className={styles.detailValue}>{selectedOvertime.approvedBy}</span>
            </div>
          )}
          {selectedOvertime.rejectionReason && (
            <div className={styles.detailGroup}>
              <span className={styles.detailLabel}>Rejection Remarks</span>
              <span className={styles.detailValue} style={{ color: 'var(--danger, #dc2626)' }}>{selectedOvertime.rejectionReason}</span>
            </div>
          )}
        </div>

        {selectedOvertime.status === 'pending' && (
          <div className={styles.drawerActions}>
            <button className={styles.secondaryBtn} onClick={() => onReject(selectedOvertime)}>Reject</button>
            <button className={styles.primaryBtn} onClick={() => onApprove(selectedOvertime)}>Approve</button>
          </div>
        )}
      </aside>
    </>
  );
}

function OvertimeFormModal({
  isOpen,
  formData,
  errors,
  onChange,
  onClose,
  onSave,
  employees = [],
  clients = [],
}) {
  if (!isOpen) return null;

  const previewAmount = Number(formData.overtimeHours || 0) * Number(formData.overtimeRate || 0);

  return (
    <div className={styles.modalOverlay} role="dialog" aria-modal="true">
      <div className={`${styles.modalCard} ${styles.modalCardWide}`}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>Add Overtime Entry</h3>
          <button 
            type="button" 
            className={styles.modalCloseBtn} 
            onClick={onClose} 
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        <div className={styles.formGridFour}>
          <div className={styles.formField}>
            <label className={styles.fieldLabel}>Select Employee *</label>
            <select
              className={styles.select}
              value={formData.employeeId || ''}
              onChange={(e) => onChange('employeeId', e.target.value)}
            >
              <option value="">Select employee from DB</option>
              {employees.map((emp) => (
                <option key={emp.employeeId || emp.employeeCode || emp._id} value={emp.employeeId || emp.employeeCode}>
                  {emp.name || emp.employeeName} ({emp.employeeId || emp.employeeCode})
                </option>
              ))}
            </select>
            {errors.employeeId && <span className={styles.validation}>{errors.employeeId}</span>}
          </div>

          <div className={styles.formField}>
            <label className={styles.fieldLabel}>Client / Company</label>
            <input className={styles.input} type="text" value={formData.clientName || ''} onChange={(e) => onChange('clientName', e.target.value)} placeholder="Client Name" />
          </div>

          <div className={styles.formField}>
            <label className={styles.fieldLabel}>Site / Post *</label>
            <select className={styles.select} value={formData.site || ''} onChange={(e) => onChange('site', e.target.value)}>
              <option value="">Select site</option>
              {SITES.map((site) => (
                <option key={site} value={site}>{site}</option>
              ))}
            </select>
            {errors.site && <span className={styles.validation}>{errors.site}</span>}
          </div>

          <div className={styles.formField}>
            <label className={styles.fieldLabel}>Overtime Date *</label>
            <input className={styles.input} type="date" value={formData.date || ''} onChange={(e) => onChange('date', e.target.value)} />
            {errors.date && <span className={styles.validation}>{errors.date}</span>}
          </div>

          <div className={styles.formField}>
            <label className={styles.fieldLabel}>Shift</label>
            <select className={styles.select} value={formData.shift || 'Night Shift'} onChange={(e) => onChange('shift', e.target.value)}>
              <option value="Day Shift">Day Shift</option>
              <option value="Night Shift">Night Shift</option>
              <option value="General Shift">General Shift</option>
              <option value="Reliever Shift">Reliever Shift</option>
            </select>
          </div>

          <div className={styles.formField}>
            <label className={styles.fieldLabel}>Overtime Hours *</label>
            <input
              className={styles.input}
              type="number"
              min="0.5"
              step="0.5"
              value={formData.overtimeHours || ''}
              onChange={(e) => onChange('overtimeHours', e.target.value)}
              placeholder="e.g. 4"
            />
            {errors.overtimeHours && <span className={styles.validation}>{errors.overtimeHours}</span>}
          </div>

          <div className={styles.formField}>
            <label className={styles.fieldLabel}>OT Rate (₹/hr) *</label>
            <input
              className={styles.input}
              type="number"
              min="0"
              step="10"
              value={formData.overtimeRate || ''}
              onChange={(e) => onChange('overtimeRate', e.target.value)}
              placeholder="e.g. 150"
            />
            {errors.overtimeRate && <span className={styles.validation}>{errors.overtimeRate}</span>}
          </div>

          <div className={styles.formField}>
            <label className={styles.fieldLabel}>Department</label>
            <select className={styles.select} value={formData.department || 'Security'} onChange={(e) => onChange('department', e.target.value)}>
              {DEPARTMENTS.map((dept) => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>

          <div className={styles.formField} style={{ gridColumn: '1 / -1' }}>
            <label className={styles.fieldLabel}>Reason / Duty Description *</label>
            <textarea
              className={styles.textarea}
              value={formData.reason || ''}
              onChange={(e) => onChange('reason', e.target.value)}
              placeholder="Enter overtime reason (e.g. Reliever Guard Coverage / Shift Extension)..."
            />
            {errors.reason && <span className={styles.validation}>{errors.reason}</span>}
          </div>

          <div className={styles.formField} style={{ gridColumn: '1 / -1' }}>
            <label className={styles.fieldLabel}>Overtime Amount Preview</label>
            <div className={styles.previewBox}>
              <span>{Number(formData.overtimeHours || 0).toFixed(1)} hrs × {formatCurrency(Number(formData.overtimeRate || 0))}/hr</span>
              <span className={styles.previewValue}>{formatCurrency(previewAmount)}</span>
            </div>
          </div>
        </div>

        <div className={styles.modalActions}>
          <button className={styles.secondaryBtn} onClick={onClose}>Cancel</button>
          <button className={styles.primaryBtn} onClick={onSave}>Save Overtime Entry</button>
        </div>
      </div>
    </div>
  );
}

function ApproveOvertimeModal({ request, onClose, onConfirm }) {
  if (!request) return null;

  return (
    <div className={styles.modalOverlay} role="dialog" aria-modal="true">
      <div className={styles.modalCard}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>Approve Overtime?</h3>
          <button type="button" className={styles.modalCloseBtn} onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>
        <p className={styles.modalText}>
          Are you sure you want to approve <span className={styles.modalHighlight}>{request.employeeName}&apos;s</span> overtime request?
        </p>

        <div className={styles.modalMeta}>
          <span>Overtime</span>
          <span>{asHoursLabel(request.overtimeHours)}</span>
          <span>OT Rate: {formatCurrency(request.overtimeRate)} / hr</span>
          <span>Amount: {formatCurrency(request.overtimeAmount)}</span>
        </div>

        <div className={styles.modalActions}>
          <button className={styles.secondaryBtn} onClick={onClose}>Cancel</button>
          <button className={styles.primaryBtn} onClick={onConfirm}>Approve Overtime</button>
        </div>
      </div>
    </div>
  );
}

function RejectOvertimeModal({ request, rejectionReason, setRejectionReason, onClose, onConfirm }) {
  if (!request) return null;

  return (
    <div className={styles.modalOverlay} role="dialog" aria-modal="true">
      <div className={styles.modalCard}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>Reject Overtime Request</h3>
          <button type="button" className={styles.modalCloseBtn} onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>
        <p className={styles.modalText}>
          <span className={styles.modalHighlight}>{request.employeeName}&apos;s</span> overtime claim will be marked as rejected.
        </p>

        <label className={styles.fieldLabel}>Reason for rejection *</label>
        <textarea
          className={styles.textarea}
          value={rejectionReason}
          onChange={(e) => setRejectionReason(e.target.value)}
          placeholder="Enter reason for rejecting this claim..."
        />

        <div className={styles.modalActions}>
          <button className={styles.secondaryBtn} onClick={onClose}>Cancel</button>
          <button className={styles.primaryBtn} onClick={onConfirm}>Reject Overtime</button>
        </div>
      </div>
    </div>
  );
}

function OvertimeExportModal({ open, onClose, onExport, filters, setFilters, clients = [] }) {
  if (!open) return null;

  return (
    <div className={styles.modalOverlay} role="dialog" aria-modal="true">
      <div className={styles.modalCard}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>Export Overtime Register</h3>
          <button type="button" className={styles.modalCloseBtn} onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        <div className={styles.gridTwo}>
          <div className={styles.formField}>
            <label className={styles.fieldLabel}>From Date</label>
            <input
              type="date"
              className={styles.input}
              value={filters.fromDate}
              onChange={(e) => setFilters((prev) => ({ ...prev, fromDate: e.target.value }))}
            />
          </div>
          <div className={styles.formField}>
            <label className={styles.fieldLabel}>To Date</label>
            <input
              type="date"
              className={styles.input}
              value={filters.toDate}
              onChange={(e) => setFilters((prev) => ({ ...prev, toDate: e.target.value }))}
            />
          </div>
          <div className={styles.formField}>
            <label className={styles.fieldLabel}>Client</label>
            <select
              className={styles.select}
              value={filters.clientFilter}
              onChange={(e) => setFilters((prev) => ({ ...prev, clientFilter: e.target.value }))}
            >
              <option value="">All Clients</option>
              {clients.map((c) => (
                <option key={c.id || c._id || c.clientName || c.name} value={c.clientName || c.name}>
                  {c.clientName || c.name}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.formField}>
            <label className={styles.fieldLabel}>Status</label>
            <select
              className={styles.select}
              value={filters.statusFilter}
              onChange={(e) => setFilters((prev) => ({ ...prev, statusFilter: e.target.value }))}
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          <div className={styles.formField} style={{ gridColumn: '1 / -1' }}>
            <label className={styles.fieldLabel}>Export Format</label>
            <div style={{ display: 'flex', gap: '16px', marginTop: '6px' }}>
              {['pdf', 'excel', 'csv'].map((type) => (
                <label key={type} style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-primary)', fontWeight: 600, cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="format"
                    value={type}
                    checked={filters.format === type}
                    onChange={(e) => setFilters((prev) => ({ ...prev, format: e.target.value }))}
                  />
                  {type.toUpperCase()}
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className={styles.modalActions}>
          <button className={styles.secondaryBtn} onClick={onClose}>Cancel</button>
          <button className={styles.primaryBtn} onClick={() => onExport(filters)}>
            <Download size={16} /> Download File
          </button>
        </div>
      </div>
    </div>
  );
}

function OvertimeClientSummary({ clientData = [] }) {
  return (
    <div className={styles.summaryBlock}>
      <div className={styles.sectionHeader}>
        <h3 className={styles.sectionTitle}>Overtime by Client</h3>
        <span className={styles.sectionBadge}>{clientData.length} Clients</span>
      </div>
      <div className={styles.summaryTableWrapper}>
        <table className={styles.summaryTable}>
          <thead>
            <tr>
              <th>Client</th>
              <th>Total OT Entries</th>
              <th>OT Hours</th>
              <th>Total Amount</th>
            </tr>
          </thead>
          <tbody>
            {clientData.length === 0 ? (
              <tr><td colSpan="4" style={{ textAlign: 'center', padding: '16px', color: 'var(--text-muted)' }}>No client overtime records available.</td></tr>
            ) : (
              clientData.map((row) => (
                <tr key={row.clientName}>
                  <td style={{ fontWeight: 600 }}>{row.clientName}</td>
                  <td>{row.count}</td>
                  <td>{asHoursLabel(row.totalHours)}</td>
                  <td style={{ fontWeight: 600, color: 'var(--success, #16a34a)' }}>{formatCurrency(row.totalAmount)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function OvertimeDepartmentSummary({ deptData = [] }) {
  return (
    <div className={styles.summaryBlock}>
      <div className={styles.sectionHeader}>
        <h3 className={styles.sectionTitle}>Overtime by Department</h3>
        <span className={styles.sectionBadge}>{deptData.length} Depts</span>
      </div>
      <div className={styles.summaryTableWrapper}>
        <table className={styles.summaryTable}>
          <thead>
            <tr>
              <th>Department</th>
              <th>Entries</th>
              <th>OT Hours</th>
              <th>Total Amount</th>
            </tr>
          </thead>
          <tbody>
            {deptData.length === 0 ? (
              <tr><td colSpan="4" style={{ textAlign: 'center', padding: '16px', color: 'var(--text-muted)' }}>No department overtime records available.</td></tr>
            ) : (
              deptData.map((row) => (
                <tr key={row.department}>
                  <td style={{ fontWeight: 600 }}>{row.department}</td>
                  <td>{row.count}</td>
                  <td>{asHoursLabel(row.hours || row.totalHours)}</td>
                  <td style={{ fontWeight: 600, color: 'var(--success, #16a34a)' }}>{formatCurrency(row.amount || row.totalAmount)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Overtime() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { canAdd, canEdit, canDelete, canExport, canApprove } = usePermissions();
  const { activeCompany, company } = useCompany();

  const companyId = activeCompany?.companyId || activeCompany?.id || company?.companyId || company?.id || 'RRS8392014SEC';
  const companyName = activeCompany?.name || company?.name || 'RR Security & Facilities';

  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().slice(0, 10));
  const initialTab = searchParams.get('tab') || 'records';
  const [activeTab, setActiveTab] = useState(initialTab);

  const [overtimeRecords, setOvertimeRecords] = useState([]);
  const [summaryData, setSummaryData] = useState({
    totalHours: 0,
    pendingHours: 0,
    approvedHours: 0,
    totalAmount: 0,
    employeesWithOvertime: 0,
    averageHoursPerEmployee: '0.0',
    highestHours: 0,
    pendingCount: 0,
  });

  const [employeesList, setEmployeesList] = useState([]);
  const [clientsList, setClientsList] = useState([]);
  const [analyticsData, setAnalyticsData] = useState({ clients: [], departments: [] });

  const [searchTerm, setSearchTerm] = useState('');
  const [clientFilter, setClientFilter] = useState('');
  const [siteFilter, setSiteFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const [selectedOvertime, setSelectedOvertime] = useState(null);
  const [approveRequest, setApproveRequest] = useState(null);
  const [rejectRequest, setRejectRequest] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    employeeId: '',
    clientName: '',
    department: 'Security',
    site: 'Main Gate',
    date: selectedDate,
    shift: 'Night Shift',
    overtimeHours: 4,
    overtimeRate: 150,
    reason: '',
  });
  const [formErrors, setFormErrors] = useState({});
  const [exportFilters, setExportFilters] = useState({
    fromDate: '',
    toDate: '',
    clientFilter: '',
    statusFilter: '',
    format: 'pdf',
  });

  const showToast = (message, type = 'success') => setToast({ message, type });

  // Sync tab with URL search params
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && ['records', 'requests', 'history', 'analytics', 'all'].includes(tabParam)) {
      setActiveTab(tabParam === 'all' ? 'records' : tabParam);
    } else {
      setActiveTab('records');
    }
  }, [searchParams]);

  // Fetch Master Data (Employees & Clients)
  useEffect(() => {
    const fetchMasters = async () => {
      try {
        const [emps, cls] = await Promise.all([
          employeeService.getEmployees(companyId).catch(() => []),
          clientService.getClients(companyId).catch(() => []),
        ]);
        setEmployeesList(emps || []);
        setClientsList(cls || []);
      } catch (err) {
        console.error('Error fetching master data:', err);
      }
    };
    fetchMasters();
  }, [companyId]);

  // Fetch Dynamic Overtime Records from MongoDB
  const fetchRecords = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        search: searchTerm,
        client: clientFilter,
        site: siteFilter,
        department: departmentFilter,
      };

      if (fromDate && toDate) {
        params.fromDate = fromDate;
        params.toDate = toDate;
      } else if (activeTab !== 'analytics' && selectedDate) {
        // Filter by selected date on date-specific tabs unless custom range is given
        params.date = selectedDate;
      }

      if (activeTab === 'requests') {
        params.status = 'pending';
      } else if (activeTab === 'history') {
        // history shows approved or rejected
        if (!statusFilter) params.status = 'approved';
        else params.status = statusFilter;
      } else if (statusFilter) {
        params.status = statusFilter;
      }

      const res = await overtimeService.getOvertimeRecords(companyId, params);
      if (res.success) {
        setOvertimeRecords(res.records || []);
        if (res.summary) {
          setSummaryData(res.summary);
        }
      }

      // Also fetch analytics breakdown
      const analyticsRes = await overtimeService.getOvertimeAnalytics(companyId).catch(() => null);
      if (analyticsRes && analyticsRes.success) {
        setAnalyticsData({
          clients: analyticsRes.clients || [],
          departments: analyticsRes.departments || [],
        });
      }
    } catch (err) {
      console.error('Error fetching overtime data:', err);
      setError(err.message || 'Failed to load overtime data');
    } finally {
      setLoading(false);
    }
  }, [companyId, searchTerm, clientFilter, siteFilter, departmentFilter, statusFilter, fromDate, toDate, selectedDate, activeTab]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, clientFilter, siteFilter, departmentFilter, statusFilter, fromDate, toDate, activeTab, selectedDate]);

  const resetFilters = () => {
    setSearchTerm('');
    setClientFilter('');
    setSiteFilter('');
    setDepartmentFilter('');
    setStatusFilter('');
    setFromDate('');
    setToDate('');
    setCurrentPage(1);
  };

  const openAddOvertime = () => {
    const firstEmp = employeesList[0] || {};
    setFormData({
      employeeId: firstEmp.employeeId || firstEmp.employeeCode || '',
      clientName: firstEmp.clientName || firstEmp.companyName || (clientsList[0]?.name || 'RR Security Client'),
      department: firstEmp.department || 'Security',
      site: firstEmp.siteLocation || firstEmp.site || 'Main Gate',
      date: selectedDate || new Date().toISOString().slice(0, 10),
      shift: 'Night Shift',
      overtimeHours: 4,
      overtimeRate: Number(firstEmp.overtimeRate) || 150,
      reason: 'Shift Extension / Reliever Coverage',
    });
    setFormErrors({});
    setIsFormOpen(true);
  };

  const handleFormChange = (field, value) => {
    const next = { ...formData, [field]: value };
    if (field === 'employeeId') {
      const selectedEmp = employeesList.find(
        (e) => (e.employeeId || e.employeeCode) === value
      );
      if (selectedEmp) {
        next.clientName = selectedEmp.clientName || selectedEmp.companyName || '';
        next.department = selectedEmp.department || 'Security';
        next.site = selectedEmp.siteLocation || selectedEmp.site || 'Main Gate';
        next.overtimeRate = Number(selectedEmp.overtimeRate) || 150;
      }
    }
    setFormData(next);
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.employeeId) errors.employeeId = 'Please select an employee';
    if (!formData.site) errors.site = 'Site is required';
    if (!formData.date) errors.date = 'Date is required';
    if (formData.overtimeHours === '' || Number(formData.overtimeHours) <= 0) {
      errors.overtimeHours = 'Hours must be greater than 0';
    }
    if (formData.overtimeRate === '' || Number(formData.overtimeRate) < 0) {
      errors.overtimeRate = 'OT rate cannot be negative';
    }
    if (!formData.reason || !formData.reason.trim()) {
      errors.reason = 'Reason is required';
    }
    return errors;
  };

  const saveOvertime = async () => {
    const errors = validateForm();
    setFormErrors(errors);
    if (Object.keys(errors).length) return;

    try {
      const selectedEmp = employeesList.find(
        (e) => (e.employeeId || e.employeeCode) === formData.employeeId
      );

      const payload = {
        employeeId: formData.employeeId,
        employeeName: selectedEmp?.name || selectedEmp?.employeeName || 'Staff Guard',
        clientName: formData.clientName || selectedEmp?.clientName || 'General Client',
        site: formData.site,
        department: formData.department || selectedEmp?.department || 'Security',
        designation: selectedEmp?.designation || 'Security Guard',
        date: formData.date,
        shift: formData.shift || 'Night Shift',
        overtimeHours: Number(formData.overtimeHours),
        overtimeRate: Number(formData.overtimeRate),
        reason: formData.reason.trim(),
      };

      await overtimeService.createOvertime(companyId, payload);
      showToast('✓ Overtime request saved successfully.');
      setIsFormOpen(false);
      fetchRecords();
    } catch (err) {
      showToast(err.message || 'Failed to save overtime entry', 'danger');
    }
  };

  const handleApprove = (request) => setApproveRequest(request);
  const confirmApprove = async () => {
    if (!approveRequest) return;
    try {
      const targetId = approveRequest._id || approveRequest.overtimeId;
      await overtimeService.updateOvertimeStatus(companyId, targetId, {
        status: 'approved',
      });
      setApproveRequest(null);
      setSelectedOvertime(null);
      showToast('✓ Overtime request approved successfully.');
      fetchRecords();
    } catch (err) {
      showToast(err.message || 'Failed to approve overtime request', 'danger');
    }
  };

  const handleReject = (request) => {
    setRejectRequest(request);
    setRejectionReason('');
  };
  const confirmReject = async () => {
    if (!rejectRequest) return;
    if (!rejectionReason.trim()) {
      showToast('Rejection reason is required.', 'danger');
      return;
    }
    try {
      const targetId = rejectRequest._id || rejectRequest.overtimeId;
      await overtimeService.updateOvertimeStatus(companyId, targetId, {
        status: 'rejected',
        rejectionReason: rejectionReason.trim(),
      });
      setRejectRequest(null);
      setRejectionReason('');
      setSelectedOvertime(null);
      showToast('✓ Overtime request rejected successfully.');
      fetchRecords();
    } catch (err) {
      showToast(err.message || 'Failed to reject overtime request', 'danger');
    }
  };

  const handleDelete = async (record) => {
    if (!window.confirm(`Are you sure you want to delete overtime entry for ${record.employeeName}?`)) return;
    try {
      const targetId = record._id || record.overtimeId;
      await overtimeService.deleteOvertime(companyId, targetId);
      showToast('✓ Overtime entry deleted successfully.');
      fetchRecords();
    } catch (err) {
      showToast(err.message || 'Failed to delete overtime record', 'danger');
    }
  };

  const handleExport = async (filters) => {
    try {
      setExportModalOpen(false);
      showToast('Generating official overtime register file...');

      const exportParams = {
        fromDate: filters.fromDate,
        toDate: filters.toDate,
        client: filters.clientFilter,
        status: filters.statusFilter,
      };

      const res = await overtimeService.getOvertimeRecords(companyId, exportParams);
      const recordsToExport = res.records && res.records.length > 0 ? res.records : overtimeRecords;

      const title = 'Overtime Register & Wage Summary';
      const period = {
        month: filters.fromDate && filters.toDate ? `${filters.fromDate} to ${filters.toDate}` : selectedDate,
        monthLabel: filters.fromDate && filters.toDate ? `${formatDate(filters.fromDate)} - ${formatDate(filters.toDate)}` : formatDate(selectedDate),
      };

      const companyInfo = {
        name: companyName,
        address: 'G/75A Block-G M.B. Exten. Badarpur New Delhi-110044',
      };

      if (filters.format === 'pdf') {
        generateReportPdf({
          reportType: 'overtime',
          title,
          period,
          companyInfo,
          records: recordsToExport,
          totals: {
            totalHours: res.summary?.totalHours || summaryData.totalHours,
            totalAmount: res.summary?.totalAmount || summaryData.totalAmount,
          },
        });
      } else {
        generateReportExcel({
          reportType: 'overtime',
          title,
          period,
          companyInfo,
          records: recordsToExport,
          totals: res.summary || summaryData,
          format: filters.format === 'csv' ? 'csv' : 'xlsx',
        });
      }

      showToast('✓ Overtime register file downloaded successfully.');
    } catch (err) {
      showToast(err.message || 'Failed to export overtime register', 'danger');
    }
  };

  const paginatedRecords = useMemo(() => {
    return overtimeRecords.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  }, [overtimeRecords, currentPage]);

  if (error) {
    return (
      <AdminLayout>
        <div className={styles.container}>
          <EmptyState
            title="Unable to load overtime data."
            description={error || 'Something went wrong while connecting to the Overtime API.'}
            actionLabel="Try Again"
            onAction={fetchRecords}
          />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className={styles.container}>
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

        <div className={styles.breadcrumb} role="navigation" aria-label="Breadcrumb">
          <button 
            type="button" 
            style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'var(--primary)', font: 'inherit' }}
            onClick={() => navigate('/admin/dashboard')}
          >
            Dashboard
          </button>
          <span className={styles.separator}>/</span>
          <span className={styles.crumbActive}>
            {activeTab === 'requests' ? 'Pending Approvals' : activeTab === 'history' ? 'Overtime History' : activeTab === 'analytics' ? 'Client & Dept Analytics' : 'All Overtime'}
          </span>
        </div>

        <header className={styles.header}>
          <div className={styles.titleBlock}>
            <h1 className={styles.title}>
              {activeTab === 'requests' ? 'Pending Overtime Approvals' : activeTab === 'history' ? 'Overtime History' : activeTab === 'analytics' ? 'Client & Dept Overtime Analytics' : 'Overtime Management'}
            </h1>
            <p className={styles.subtitle}>
              {activeTab === 'requests' ? 'Review, approve or reject pending employee overtime claims.' : activeTab === 'history' ? 'Historical record of processed and approved overtime logs.' : activeTab === 'analytics' ? 'Live distribution of overtime hours and amounts across clients & departments.' : 'Review, manage and track employee overtime records.'}
            </p>
          </div>
          <div className={styles.headerActions}>
            <button
              className={styles.secondaryBtn}
              onClick={fetchRecords}
              title="Refresh overtime records"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <RefreshCw size={15} /> Refresh
            </button>
            {canAdd('overtime') && (
              <button className={styles.addBtn} onClick={openAddOvertime}>
                <Plus size={16} /> Add Overtime
              </button>
            )}
            {canExport('overtime') && (
              <button className={styles.exportBtn} onClick={() => setExportModalOpen(true)}>
                <Download size={16} /> Export Report
              </button>
            )}
          </div>
        </header>

        {loading ? (
          <div className={styles.summaryGrid}>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className={styles.summaryCard}>
                <div className={styles.summaryValue}>
                  <div className={styles.loadingBar} style={{ width: '100px', height: '14px' }} />
                  <div className={styles.loadingBar} style={{ width: '80px', height: '28px' }} />
                </div>
                <div className={`${styles.iconWrap} ${styles.blue}`} style={{ width: '42px', height: '42px' }} />
              </div>
            ))}
          </div>
        ) : (
          <OvertimeSummaryCards summary={summaryData} />
        )}

        <OvertimeOverview summary={summaryData} />
        
        {activeTab !== 'analytics' && (
          <OvertimeDateSelector
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            onToday={() => setSelectedDate(new Date().toISOString().slice(0, 10))}
          />
        )}

        <OvertimeFilters
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          clientFilter={clientFilter}
          setClientFilter={setClientFilter}
          siteFilter={siteFilter}
          setSiteFilter={setSiteFilter}
          departmentFilter={departmentFilter}
          setDepartmentFilter={setDepartmentFilter}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          fromDate={fromDate}
          setFromDate={setFromDate}
          toDate={toDate}
          setToDate={setToDate}
          onReset={resetFilters}
          clientsList={clientsList}
        />

        {loading ? (
          <div className={styles.tableCard}>
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Employee ID</th>
                    <th>Client</th>
                    <th>Site</th>
                    <th>Date</th>
                    <th>Regular Hours</th>
                    <th>Overtime Hours</th>
                    <th>OT Rate</th>
                    <th>OT Amount</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((key) => (
                    <tr key={key}>
                      {Array.from({ length: 11 }).map((_, idx) => (
                        <td key={`${key}-${idx}`}>
                          <div className={styles.loadingBar} style={{ width: idx === 0 ? '120px' : '70px', height: '12px' }} />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : overtimeRecords.length === 0 ? (
          <div className={styles.emptyWrapper}>
            <EmptyState
              title={activeTab === 'requests' ? 'No pending overtime requests found.' : 'No overtime records found.'}
              description="Try changing your filters, selected date, or click '+ Add Overtime' to create new records."
              actionLabel="Reset Filters"
              onAction={resetFilters}
            />
          </div>
        ) : (
          <>
            <OvertimeTable
              rows={paginatedRecords}
              onView={(record) => setSelectedOvertime(record)}
              onApprove={handleApprove}
              onReject={handleReject}
              onDelete={handleDelete}
            />
            <Pagination
              currentPage={currentPage}
              totalItems={overtimeRecords.length}
              itemsPerPage={PAGE_SIZE}
              onPageChange={setCurrentPage}
              label="overtime records"
            />
          </>
        )}

        <div className={styles.summarySectionRow}>
          <OvertimeClientSummary clientData={analyticsData.clients} />
          <OvertimeDepartmentSummary deptData={analyticsData.departments} />
        </div>

        <OvertimeDetailsDrawer
          selectedOvertime={selectedOvertime}
          onClose={() => setSelectedOvertime(null)}
          onApprove={handleApprove}
          onReject={handleReject}
        />

        <OvertimeFormModal
          isOpen={isFormOpen}
          formData={formData}
          errors={formErrors}
          onChange={handleFormChange}
          onClose={() => setIsFormOpen(false)}
          onSave={saveOvertime}
          employees={employeesList}
          clients={clientsList}
        />

        <ApproveOvertimeModal
          request={approveRequest}
          onClose={() => setApproveRequest(null)}
          onConfirm={confirmApprove}
        />

        <RejectOvertimeModal
          request={rejectRequest}
          rejectionReason={rejectionReason}
          setRejectionReason={setRejectionReason}
          onClose={() => setRejectRequest(null)}
          onConfirm={confirmReject}
        />

        <OvertimeExportModal
          open={exportModalOpen}
          onClose={() => setExportModalOpen(false)}
          onExport={handleExport}
          filters={exportFilters}
          setFilters={setExportFilters}
          clients={clientsList}
        />
      </div>
    </AdminLayout>
  );
}

export default Overtime;
