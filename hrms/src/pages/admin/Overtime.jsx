import React, { useEffect, useMemo, useState } from 'react';
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
  UserPlus
} from 'lucide-react';
import AdminLayout from '../../components/layout/AdminLayout';
import Pagination from '../../components/common/Pagination';
import StatusBadge from '../../components/common/StatusBadge';
import Toast from '../../components/common/Toast';
import EmptyState from '../../components/common/EmptyState';
import { mockOvertimeRecords } from '../../data/overtimeData';
import { mockCompanies } from '../../data/companyData';
import { mockEmployees } from '../../data/employeeData';
import styles from './Overtime.module.css';

const STORAGE_KEY = 'novaspark_overtime_records';
const PAGE_SIZE = 10;
const SITES = ['Main Gate', 'Warehouse', 'Office Building', 'Hospital Block', 'Parking Area'];

const formatCurrency = (value) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(value || 0);

const formatDate = (dateString) => {
  if (!dateString) return '—';
  const date = new Date(dateString);
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
  return `${whole}h ${minutes}m`;
};

const getSummary = (records) => {
  const totalHours = records.reduce((sum, item) => sum + Number(item.overtimeHours || 0), 0);
  const pendingHours = records
    .filter((item) => item.status === 'pending')
    .reduce((sum, item) => sum + Number(item.overtimeHours || 0), 0);
  const approvedHours = records
    .filter((item) => item.status === 'approved')
    .reduce((sum, item) => sum + Number(item.overtimeHours || 0), 0);
  const totalAmount = records.reduce((sum, item) => sum + Number(item.overtimeAmount || 0), 0);

  return {
    totalHours,
    pendingHours,
    approvedHours,
    totalAmount,
  };
};

function OvertimeSummaryCards({ records }) {
  const summary = getSummary(records);

  const cards = [
    { label: 'Total Overtime', value: `${asHoursLabel(summary.totalHours)} hrs`, icon: Timer, tone: styles.blue },
    { label: 'Pending', value: `${asHoursLabel(summary.pendingHours)} hrs`, icon: Clock3, tone: styles.yellow },
    { label: 'Approved', value: `${asHoursLabel(summary.approvedHours)} hrs`, icon: CircleCheck, tone: styles.green },
    { label: 'OT Amount', value: formatCurrency(summary.totalAmount), icon: IndianRupee, tone: styles.purple },
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

function OvertimeOverview({ records }) {
  const employeesWithOT = new Set(records.map((item) => item.employeeId)).size;
  const average = records.length ? records.reduce((sum, item) => sum + Number(item.overtimeHours || 0), 0) / employeesWithOT : 0;
  const highest = records.length
    ? Math.max(...records.map((item) => Number(item.overtimeHours || 0)))
    : 0;
  const pendingCount = records.filter((item) => item.status === 'pending').length;

  const items = [
    { label: 'Employees with Overtime', value: employeesWithOT },
    { label: 'Average OT / Employee', value: `${average.toFixed(1)} hrs` },
    { label: 'Highest OT', value: `${asHoursLabel(highest)}` },
    { label: 'Pending Requests', value: pendingCount },
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
    const date = new Date(selectedDate);
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
            {mockCompanies.map((company) => (
              <option key={company.id} value={company.name}>{company.name}</option>
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
            {['Security', 'Operations', 'Administration', 'HR', 'Accounts', 'Housekeeping'].map((dept) => (
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

function OvertimeTable({ rows, onView, onApprove, onReject, onEdit }) {
  const [openMenuId, setOpenMenuId] = useState(null);

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
            {rows.map((row) => (
              <tr key={row.id}>
                <td>
                  <div className={styles.employeeCell}>
                    <div className={styles.employeeAvatar}>{row.initials}</div>
                    <span className={styles.employeeName}>{row.employeeName}</span>
                  </div>
                </td>
                <td className={styles.secondaryText}>{row.employeeId}</td>
                <td className={styles.secondaryText}>{row.clientName}</td>
                <td className={styles.secondaryText}>{row.site}</td>
                <td className={styles.secondaryText}>{formatDate(row.date)}</td>
                <td className={styles.secondaryText}>{asHoursLabel(row.regularHours)}</td>
                <td className={styles.otHours}>{asHoursLabel(row.overtimeHours)}</td>
                <td className={styles.rateValue}>{formatCurrency(row.overtimeRate)} / hr</td>
                <td className={styles.currencyValue}>{formatCurrency(row.overtimeAmount)}</td>
                <td><StatusBadge status={row.status} /></td>
                <td className={styles.actionCell}>
                  <button className={styles.iconBtn} aria-label="Open overtime actions" onClick={() => setOpenMenuId(openMenuId === row.id ? null : row.id)}>
                    <MoreVertical size={16} />
                  </button>

                  {openMenuId === row.id && (
                    <div className={styles.actionMenu}>
                      <ul className={styles.menuList}>
                        <li><button className={styles.menuItem} onClick={() => { onView(row); setOpenMenuId(null); }}>View Details</button></li>
                        {(row.status === 'pending' || row.status === 'rejected') && (
                          <li><button className={styles.menuItem} onClick={() => { onEdit(row); setOpenMenuId(null); }}>Edit Overtime</button></li>
                        )}
                        {row.status === 'pending' && (
                          <>
                            <li><button className={styles.menuItem} onClick={() => { onApprove(row); setOpenMenuId(null); }}>Approve</button></li>
                            <li><button className={styles.menuItem} onClick={() => { onReject(row); setOpenMenuId(null); }}>Reject</button></li>
                          </>
                        )}
                      </ul>
                    </div>
                  )}
                </td>
              </tr>
            ))}
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
          <p className={styles.drawerId}>{selectedOvertime.employeeId}</p>

          <div className={styles.detailGroup}>
            <span className={styles.detailLabel}>Client</span>
            <span className={styles.detailValue}>{selectedOvertime.clientName}</span>
          </div>
          <div className={styles.detailGroup}>
            <span className={styles.detailLabel}>Site</span>
            <span className={styles.detailValue}>{selectedOvertime.site}</span>
          </div>
          <div className={styles.detailGroup}>
            <span className={styles.detailLabel}>Date</span>
            <span className={styles.detailValue}>{formatDate(selectedOvertime.date)}</span>
          </div>
          <div className={styles.detailGroup}>
            <span className={styles.detailLabel}>Regular Hours</span>
            <span className={styles.detailValue}>{asHoursLabel(selectedOvertime.regularHours)}</span>
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
            <span className={styles.detailValue}>{formatCurrency(selectedOvertime.overtimeAmount)}</span>
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
  mode = 'add',
}) {
  if (!isOpen) return null;

  const previewAmount = Number(formData.overtimeHours || 0) * Number(formData.overtimeRate || 0);

  return (
    <div className={styles.modalOverlay} role="dialog" aria-modal="true">
      <div className={`${styles.modalCard} ${styles.modalCardWide}`}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>
            {mode === 'edit' ? 'Edit Overtime' : 'Add Overtime'}
          </h3>
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
            <label className={styles.fieldLabel}>Employee</label>
            <select className={styles.select} value={formData.employeeId || ''} onChange={(e) => onChange('employeeId', e.target.value)}>
              <option value="">Select employee</option>
              {mockEmployees.map((employee) => (
                <option key={employee.employeeId} value={employee.employeeId}>{employee.name}</option>
              ))}
            </select>
            {errors.employeeId && <span className={styles.validation}>{errors.employeeId}</span>}
          </div>

          <div className={styles.formField}>
            <label className={styles.fieldLabel}>Client</label>
            <input className={styles.input} type="text" value={formData.clientName || ''} readOnly />
          </div>

          <div className={styles.formField}>
            <label className={styles.fieldLabel}>Site</label>
            <select className={styles.select} value={formData.site || ''} onChange={(e) => onChange('site', e.target.value)}>
              <option value="">Select site</option>
              {SITES.map((site) => (
                <option key={site} value={site}>{site}</option>
              ))}
            </select>
            {errors.site && <span className={styles.validation}>{errors.site}</span>}
          </div>

          <div className={styles.formField}>
            <label className={styles.fieldLabel}>Date</label>
            <input className={styles.input} type="date" value={formData.date || ''} onChange={(e) => onChange('date', e.target.value)} />
            {errors.date && <span className={styles.validation}>{errors.date}</span>}
          </div>

          <div className={styles.formField}>
            <label className={styles.fieldLabel}>Regular Hours</label>
            <input className={styles.input} type="number" min="0" step="0.5" value={formData.regularHours || ''} onChange={(e) => onChange('regularHours', e.target.value)} />
            {errors.regularHours && <span className={styles.validation}>{errors.regularHours}</span>}
          </div>

          <div className={styles.formField}>
            <label className={styles.fieldLabel}>Overtime Hours</label>
            <input className={styles.input} type="number" min="0" step="0.5" value={formData.overtimeHours || ''} onChange={(e) => onChange('overtimeHours', e.target.value)} />
            {errors.overtimeHours && <span className={styles.validation}>{errors.overtimeHours}</span>}
          </div>

          <div className={styles.formField}>
            <label className={styles.fieldLabel}>OT Rate (₹)</label>
            <input className={styles.input} type="number" min="0" step="1" value={formData.overtimeRate || ''} onChange={(e) => onChange('overtimeRate', e.target.value)} />
            {errors.overtimeRate && <span className={styles.validation}>{errors.overtimeRate}</span>}
          </div>

          <div className={styles.formField}>
            <label className={styles.fieldLabel}>Department</label>
            <input className={styles.input} type="text" value={formData.department || ''} readOnly />
          </div>

          <div className={styles.formField} style={{ gridColumn: '1 / -1' }}>
            <label className={styles.fieldLabel}>Reason</label>
            <textarea className={styles.textarea} value={formData.reason || ''} onChange={(e) => onChange('reason', e.target.value)} placeholder="Enter reason..." />
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
          <button className={styles.primaryBtn} onClick={onSave}>{mode === 'edit' ? 'Save Changes' : 'Save Overtime'}</button>
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
          Are you sure you want to approve <span className={styles.modalHighlight}>{request.employeeName}&apos;s</span> overtime?
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
          <h3 className={styles.modalTitle}>Reject Overtime?</h3>
          <button type="button" className={styles.modalCloseBtn} onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>
        <p className={styles.modalText}>
          <span className={styles.modalHighlight}>{request.employeeName}&apos;s</span> overtime request will be rejected.
        </p>

        <label className={styles.fieldLabel}>Reason for rejection</label>
        <textarea className={styles.textarea} value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} placeholder="Enter rejection reason..." />

        <div className={styles.modalActions}>
          <button className={styles.secondaryBtn} onClick={onClose}>Cancel</button>
          <button className={styles.primaryBtn} onClick={onConfirm}>Reject Overtime</button>
        </div>
      </div>
    </div>
  );
}

function OvertimeExportModal({ open, onClose, onExport, filters, setFilters }) {
  if (!open) return null;

  return (
    <div className={styles.modalOverlay} role="dialog" aria-modal="true">
      <div className={styles.modalCard}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>Export Overtime Report</h3>
          <button type="button" className={styles.modalCloseBtn} onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        <div className={styles.gridTwo}>
          <div className={styles.formField}>
            <label className={styles.fieldLabel}>From Date</label>
            <input type="date" className={styles.input} value={filters.fromDate} onChange={(e) => setFilters((prev) => ({ ...prev, fromDate: e.target.value }))} />
          </div>
          <div className={styles.formField}>
            <label className={styles.fieldLabel}>To Date</label>
            <input type="date" className={styles.input} value={filters.toDate} onChange={(e) => setFilters((prev) => ({ ...prev, toDate: e.target.value }))} />
          </div>
          <div className={styles.formField}>
            <label className={styles.fieldLabel}>Client</label>
            <select className={styles.select} value={filters.clientFilter} onChange={(e) => setFilters((prev) => ({ ...prev, clientFilter: e.target.value }))}>
              <option value="">All Clients</option>
              {mockCompanies.map((company) => (
                <option key={company.id} value={company.name}>{company.name}</option>
              ))}
            </select>
          </div>
          <div className={styles.formField}>
            <label className={styles.fieldLabel}>Site</label>
            <select className={styles.select} value={filters.siteFilter} onChange={(e) => setFilters((prev) => ({ ...prev, siteFilter: e.target.value }))}>
              <option value="">All Sites</option>
              {SITES.map((site) => (
                <option key={site} value={site}>{site}</option>
              ))}
            </select>
          </div>
          <div className={styles.formField}>
            <label className={styles.fieldLabel}>Department</label>
            <select className={styles.select} value={filters.departmentFilter} onChange={(e) => setFilters((prev) => ({ ...prev, departmentFilter: e.target.value }))}>
              <option value="">All Departments</option>
              {['Security', 'Operations', 'Administration', 'HR', 'Accounts', 'Housekeeping'].map((dept) => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>
          <div className={styles.formField}>
            <label className={styles.fieldLabel}>Status</label>
            <select className={styles.select} value={filters.statusFilter} onChange={(e) => setFilters((prev) => ({ ...prev, statusFilter: e.target.value }))}>
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          <div className={styles.formField} style={{ gridColumn: '1 / -1' }}>
            <label className={styles.fieldLabel}>Format</label>
            <div style={{ display: 'flex', gap: '12px' }}>
              {['excel', 'csv', 'pdf'].map((type) => (
                <label key={type} style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-primary)', fontWeight: 600 }}>
                  <input type="radio" name="format" value={type} checked={filters.format === type} onChange={(e) => setFilters((prev) => ({ ...prev, format: e.target.value }))} />
                  {type.toUpperCase()}
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className={styles.modalActions}>
          <button className={styles.secondaryBtn} onClick={onClose}>Cancel</button>
          <button className={styles.primaryBtn} onClick={() => onExport(filters)}>Export Report</button>
        </div>
      </div>
    </div>
  );
}

function OvertimeClientSummary({ records }) {
  const totals = {}

  records.forEach((record) => {
    const key = record.clientName;
    if (!totals[key]) {
      totals[key] = { employees: new Set(), otHours: 0, amount: 0 };
    }
    totals[key].employees.add(record.employeeId);
    totals[key].otHours += Number(record.overtimeHours || 0);
    totals[key].amount += Number(record.overtimeAmount || 0);
  });

  const rows = Object.entries(totals).map(([client, values]) => ({
    client,
    employees: values.employees.size,
    hours: values.otHours,
    amount: values.amount,
  }));

  return (
    <div className={styles.summaryBlock}>
      <div className={styles.sectionHeader}>
        <h3 className={styles.sectionTitle}>Overtime by Client</h3>
        <span className={styles.sectionBadge}>{rows.length} Clients</span>
      </div>
      <div className={styles.summaryTableWrapper}>
        <table className={styles.summaryTable}>
          <thead>
            <tr>
              <th>Client</th>
              <th>Employees</th>
              <th>OT Hours</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.client}>
                <td>{row.client}</td>
                <td>{row.employees}</td>
                <td>{asHoursLabel(row.hours)}</td>
                <td>{formatCurrency(row.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function OvertimeDepartmentSummary({ records }) {
  const totals = {};

  records.forEach((record) => {
    const key = record.department;
    if (!totals[key]) totals[key] = { hours: 0, amount: 0 };
    totals[key].hours += Number(record.overtimeHours || 0);
    totals[key].amount += Number(record.overtimeAmount || 0);
  });

  const rows = Object.entries(totals).map(([department, values]) => ({ department, hours: values.hours, amount: values.amount }));

  return (
    <div className={styles.summaryBlock}>
      <div className={styles.sectionHeader}>
        <h3 className={styles.sectionTitle}>Overtime by Department</h3>
        <span className={styles.sectionBadge}>{rows.length} Depts</span>
      </div>
      <div className={styles.summaryTableWrapper}>
        <table className={styles.summaryTable}>
          <thead>
            <tr>
              <th>Department</th>
              <th>OT Hours</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.department}>
                <td>{row.department}</td>
                <td>{asHoursLabel(row.hours)}</td>
                <td>{formatCurrency(row.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Overtime() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [overtimeRecords, setOvertimeRecords] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : mockOvertimeRecords;
    } catch {
      return mockOvertimeRecords;
    }
  });

  const [selectedDate, setSelectedDate] = useState('2026-08-22');
  const initialTab = searchParams.get('tab') || 'records';
  const [activeTab, setActiveTab] = useState(initialTab);

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && ['records', 'requests', 'history', 'analytics'].includes(tabParam)) {
      setActiveTab(tabParam);
    } else {
      setActiveTab('records');
    }
  }, [searchParams]);

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
  const [editingOvertime, setEditingOvertime] = useState(null);
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    employeeId: '',
    clientName: '',
    department: '',
    site: '',
    date: selectedDate,
    regularHours: 8,
    overtimeHours: 1,
    overtimeRate: 150,
    reason: '',
  });
  const [formErrors, setFormErrors] = useState({});
  const [exportFilters, setExportFilters] = useState({
    fromDate: '',
    toDate: '',
    clientFilter: '',
    siteFilter: '',
    departmentFilter: '',
    statusFilter: '',
    format: 'excel',
  });

  useEffect(() => { const timer = setTimeout(() => setLoading(false), 400); return () => clearTimeout(timer); }, []);
  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(overtimeRecords)); }, [overtimeRecords]);
  useEffect(() => { setCurrentPage(1); }, [searchTerm, clientFilter, siteFilter, departmentFilter, statusFilter, fromDate, toDate, activeTab]);

  const showToast = (message, type = 'success') => setToast({ message, type });

  const userMap = useMemo(() => {
    const map = {};
    mockEmployees.forEach((employee) => {
      map[employee.employeeId] = employee;
    });
    return map;
  }, []);

  const filteredRecords = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return overtimeRecords.filter((item) => {
      if (activeTab === 'requests' && item.status !== 'pending') return false;
      if (activeTab === 'history' && item.status === 'pending') return false;
      if (query) {
        const matchesName = item.employeeName.toLowerCase().includes(query);
        const matchesId = item.employeeId.toLowerCase().includes(query);
        if (!matchesName && !matchesId) return false;
      }
      if (clientFilter && item.clientName !== clientFilter) return false;
      if (siteFilter && item.site !== siteFilter) return false;
      if (departmentFilter && item.department !== departmentFilter) return false;
      if (statusFilter && item.status !== statusFilter) return false;
      if (fromDate && item.date < fromDate) return false;
      if (toDate && item.date > toDate) return false;
      if (selectedDate && item.date !== selectedDate) return false;
      return true;
    });
  }, [overtimeRecords, searchTerm, clientFilter, siteFilter, departmentFilter, statusFilter, fromDate, toDate, selectedDate, activeTab]);

  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / PAGE_SIZE));
  const paginatedRecords = filteredRecords.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

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
    const currentEmployee = mockEmployees[0] || {};
    setEditingOvertime(null);
    setFormData({
      employeeId: currentEmployee.employeeId || '',
      clientName: currentEmployee.companyName || '',
      department: currentEmployee.department || '',
      site: currentEmployee.siteLocation || currentEmployee.site || SITES[0] || 'Main Gate',
      date: selectedDate || new Date().toISOString().slice(0, 10),
      regularHours: 8,
      overtimeHours: 1,
      overtimeRate: currentEmployee.overtimeRate || currentEmployee.salaryStructure?.overtimeRate || 150,
      reason: '',
    });
    setFormErrors({});
    setIsFormOpen(true);
  };

  const openEditOvertime = (record) => {
    setEditingOvertime(record);
    setFormData({
      employeeId: record.employeeId,
      clientName: record.clientName,
      department: record.department,
      site: record.site || 'Main Gate',
      date: record.date,
      regularHours: record.regularHours || 8,
      overtimeHours: record.overtimeHours || 1,
      overtimeRate: record.overtimeRate || 150,
      reason: record.reason || '',
    });
    setFormErrors({});
    setIsFormOpen(true);
  };

  const handleFormChange = (field, value) => {
    const next = { ...formData, [field]: value };
    if (field === 'employeeId') {
      const employee = userMap[value];
      if (employee) {
        next.clientName = employee.companyName || '';
        next.department = employee.department || '';
        next.site = employee.siteLocation || employee.site || SITES[0] || 'Main Gate';
        next.overtimeRate = employee.overtimeRate || employee.salaryStructure?.overtimeRate || 150;
      }
    }
    setFormData(next);
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.employeeId) errors.employeeId = 'Employee is required';
    if (!formData.site) errors.site = 'Site is required';
    if (!formData.date) errors.date = 'Date is required';
    if (formData.regularHours === '' || Number(formData.regularHours) < 0) errors.regularHours = 'Regular hours must be 0 or greater';
    if (formData.overtimeHours === '' || Number(formData.overtimeHours) <= 0) errors.overtimeHours = 'Overtime hours must be greater than 0';
    if (formData.overtimeRate === '' || Number(formData.overtimeRate) < 0) errors.overtimeRate = 'OT rate cannot be negative';
    if (!formData.reason || !formData.reason.trim()) errors.reason = 'Reason is required';
    return errors;
  };

  const saveOvertime = () => {
    const errors = validateForm();
    setFormErrors(errors);
    if (Object.keys(errors).length) return;

    const employee = userMap[formData.employeeId];
    const payload = {
      id: editingOvertime ? editingOvertime.id : Date.now(),
      employeeId: formData.employeeId,
      employeeName: employee?.name || 'Unknown Employee',
      initials: employee?.initials || 'UN',
      clientId: employee?.companyId || 'c000',
      clientName: employee?.companyName || formData.clientName,
      site: formData.site,
      department: employee?.department || formData.department,
      date: formData.date,
      regularHours: Number(formData.regularHours),
      overtimeHours: Number(formData.overtimeHours),
      overtimeRate: Number(formData.overtimeRate),
      overtimeAmount: Number(formData.overtimeHours) * Number(formData.overtimeRate),
      reason: formData.reason.trim(),
      status: 'pending',
      requestedOn: new Date().toISOString().slice(0, 10),
      processedOn: null,
      processedBy: null,
      rejectionReason: null,
    };

    if (editingOvertime) {
      setOvertimeRecords((prev) => prev.map((item) => item.id === editingOvertime.id ? { ...item, ...payload } : item));
      showToast('✓ Overtime record updated successfully.');
    } else {
      setOvertimeRecords((prev) => [payload, ...prev]);
      showToast('✓ Overtime record added successfully.');
    }

    setIsFormOpen(false);
    setEditingOvertime(null);
    setFormData({
      employeeId: '',
      clientName: '',
      department: '',
      site: '',
      date: selectedDate,
      regularHours: 8,
      overtimeHours: 1,
      overtimeRate: 150,
      reason: '',
    });
  };

  const handleApprove = (request) => setApproveRequest(request);
  const confirmApprove = () => {
    if (!approveRequest) return;
    setOvertimeRecords((prev) => prev.map((item) => item.id === approveRequest.id ? { ...item, status: 'approved', processedOn: new Date().toISOString().slice(0, 10), processedBy: 'Admin', rejectionReason: null } : item));
    setApproveRequest(null);
    setSelectedOvertime(null);
    showToast('✓ Overtime approved successfully.');
  };

  const handleReject = (request) => {
    setRejectRequest(request);
    setRejectionReason('');
  };
  const confirmReject = () => {
    if (!rejectRequest) return;
    if (!rejectionReason.trim()) {
      showToast('Rejection reason is required.', 'danger');
      return;
    }
    setOvertimeRecords((prev) => prev.map((item) => item.id === rejectRequest.id ? { ...item, status: 'rejected', processedOn: new Date().toISOString().slice(0, 10), processedBy: 'Admin', rejectionReason: rejectionReason.trim() } : item));
    setRejectRequest(null);
    setRejectionReason('');
    setSelectedOvertime(null);
    showToast('✓ Overtime rejected successfully.');
  };

  const handleExport = (payload) => {
    if (!payload.fromDate || !payload.toDate) {
      showToast('Please select both date range values.', 'danger');
      return;
    }

    if (payload.fromDate > payload.toDate) {
      showToast('Start date cannot be later than end date.', 'danger');
      return;
    }

    setExportModalOpen(false);
    showToast('Preparing overtime report...');
    setTimeout(() => showToast('✓ Overtime report exported successfully.'), 600);
  };

  if (error) {
    return (
      <AdminLayout>
        <div className={styles.container}>
          <EmptyState title="Unable to load overtime data." description="Something went wrong while loading overtime records." actionLabel="Try Again" onAction={() => setError(null)} />
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
            {activeTab === 'requests' ? 'Pending Approvals' : activeTab === 'history' ? 'Overtime History' : activeTab === 'analytics' ? 'Analytics' : 'All Overtime'}
          </span>
        </div>

        <header className={styles.header}>
          <div className={styles.titleBlock}>
            <h1 className={styles.title}>
              {activeTab === 'requests' ? 'Pending Overtime Approvals' : activeTab === 'history' ? 'Overtime History' : activeTab === 'analytics' ? 'Overtime Analytics' : 'Overtime Management'}
            </h1>
            <p className={styles.subtitle}>
              {activeTab === 'requests' ? 'Review, approve or reject pending employee overtime claims.' : activeTab === 'history' ? 'Historical record of processed and approved overtime logs.' : activeTab === 'analytics' ? 'Client and department-wise overtime distribution and insights.' : 'Review, manage and track employee overtime records.'}
            </p>
          </div>
          <div className={styles.headerActions}>
            <button className={styles.addBtn} onClick={openAddOvertime}><Plus size={16} /> Add Overtime</button>
            <button className={styles.exportBtn} onClick={() => setExportModalOpen(true)}><Download size={16} /> Export Report</button>
          </div>
        </header>

        {loading ? (
          <div className={styles.summaryGrid}>
            {[1,2,3,4].map((i) => (
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
          <OvertimeSummaryCards records={overtimeRecords} />
        )}

        <OvertimeOverview records={overtimeRecords} />
        
        {activeTab !== 'analytics' && (
          <OvertimeDateSelector selectedDate={selectedDate} setSelectedDate={setSelectedDate} onToday={() => setSelectedDate('2026-08-22')} />
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
        />

        {loading ? (
          <div className={styles.tableCard}>
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr><th>Employee</th><th>Employee ID</th><th>Client</th><th>Site</th><th>Date</th><th>Regular Hours</th><th>Overtime Hours</th><th>OT Rate</th><th>OT Amount</th><th>Status</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {[1,2,3,4,5,6,7,8,9,10].map((key) => (
                    <tr key={key}>
                      {Array.from({ length: 11 }).map((_, idx) => (
                        <td key={`${key}-${idx}`}><div className={styles.loadingBar} style={{ width: idx === 0 ? '120px' : '70px', height: '12px' }} /></td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className={styles.emptyWrapper}>
            <EmptyState title={activeTab === 'requests' ? 'No overtime records found.' : 'No overtime history found.'} description="Try changing your filters or selected date." actionLabel="Reset Filters" onAction={resetFilters} />
          </div>
        ) : (
          <>
            <OvertimeTable rows={paginatedRecords} onView={(record) => setSelectedOvertime(record)} onApprove={handleApprove} onReject={handleReject} onEdit={openEditOvertime} />
            <Pagination currentPage={currentPage} totalItems={filteredRecords.length} itemsPerPage={PAGE_SIZE} onPageChange={setCurrentPage} label={activeTab === 'requests' ? 'overtime records' : 'history items'} />
          </>
        )}

        <div className={styles.summarySectionRow}>
          <OvertimeClientSummary records={overtimeRecords} />
          <OvertimeDepartmentSummary records={overtimeRecords} />
        </div>

        <OvertimeDetailsDrawer selectedOvertime={selectedOvertime} onClose={() => setSelectedOvertime(null)} onApprove={handleApprove} onReject={handleReject} />
        <OvertimeFormModal isOpen={isFormOpen} formData={formData} errors={formErrors} onChange={handleFormChange} onClose={() => setIsFormOpen(false)} onSave={saveOvertime} mode={editingOvertime ? 'edit' : 'add'} />
        <ApproveOvertimeModal request={approveRequest} onClose={() => setApproveRequest(null)} onConfirm={confirmApprove} />
        <RejectOvertimeModal request={rejectRequest} rejectionReason={rejectionReason} setRejectionReason={setRejectionReason} onClose={() => setRejectRequest(null)} onConfirm={confirmReject} />
        <OvertimeExportModal open={exportModalOpen} onClose={() => setExportModalOpen(false)} onExport={handleExport} filters={exportFilters} setFilters={setExportFilters} />
      </div>
    </AdminLayout>
  );
}

export default Overtime;
