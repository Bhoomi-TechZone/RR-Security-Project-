import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useLocation, useSearchParams, useNavigate } from 'react-router-dom';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  CircleCheck,
  Download,
  Layers3,
  MoreVertical,
  Plus,
  Search,
  UserRoundX,
  Users,
  X,
  Trash2,
  Edit2
} from 'lucide-react';
import AdminLayout from '../../components/layout/AdminLayout';
import EmptyState from '../../components/common/EmptyState';
import Pagination from '../../components/common/Pagination';
import StatusBadge from '../../components/common/StatusBadge';
import Toast from '../../components/common/Toast';
import Dropdown from '../../components/common/Dropdown';
import { useCompany } from '../../context/CompanyContext';
import { shiftService } from '../../services/shiftService';
import { authService } from '../../services/authService';
import styles from './ShiftManagement.module.css';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://backendhrmspayroll.bhoomitechzone.shop/api';
const PAGE_SIZE = 10;
const getTodayDate = () => new Date().toISOString().split('T')[0];

const formatDate = (value) => {
  if (!value) return '—';
  try {
    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).format(new Date(`${value}T00:00:00`));
  } catch {
    return value;
  }
};

const displayType = (type) => {
  if (!type) return '—';
  const t = String(type).toLowerCase();
  if (t === 'rotational') return 'Rotational';
  if (t === 'night') return 'Night';
  return 'Day';
};

const displayTime = (value) => {
  if (!value) return 'Variable';
  try {
    const [hours, minutes] = value.split(':').map(Number);
    if (isNaN(hours) || isNaN(minutes)) return value;
    const suffix = hours >= 12 ? 'PM' : 'AM';
    const hour = hours % 12 || 12;
    return `${String(hour).padStart(2, '0')}:${String(minutes).padStart(2, '0')} ${suffix}`;
  } catch {
    return value;
  }
};

const timeRange = (item) => {
  if (!item) return 'Variable';
  return item.startTime
    ? `${displayTime(item.startTime)} - ${displayTime(item.endTime)}`
    : 'Variable';
};

function SummaryCards({ stats, patterns, roster }) {
  const totalShifts = stats?.totalShifts ?? patterns.length;
  const activeShifts = stats?.activeShifts ?? patterns.filter(p => p.status === 'active').length;
  const assigned = stats?.employeesAssigned ?? new Set(roster.filter(r => r.status !== 'unassigned').map(r => r.employeeId)).size;
  const unassigned = stats?.unassignedEmployees ?? roster.filter(r => r.status === 'unassigned').length;

  const cards = [
    { label: 'Total Shifts', value: totalShifts, icon: Layers3, tone: styles.blue },
    {
      label: 'Active Shifts',
      value: activeShifts,
      icon: CircleCheck,
      tone: styles.green
    },
    { label: 'Employees Assigned', value: assigned, icon: Users, tone: styles.purple },
    {
      label: 'Unassigned Employees',
      value: unassigned,
      icon: UserRoundX,
      tone: styles.orange
    }
  ];

  return (
    <div className={styles.summaryGrid}>
      {cards.map(({ label, value, icon: Icon, tone }) => (
        <div className={styles.summaryCard} key={label}>
          <span className={`${styles.iconWrap} ${tone}`}>
            <Icon size={30} strokeWidth={3} />
          </span>
          <div>
            <span className={styles.summaryLabel}>{label}</span>
            <strong className={styles.summaryNumber}>{value}</strong>
          </div>
        </div>
      ))}
    </div>
  );
}

function PatternSummary({ patterns, stats }) {
  const counts = ['day', 'night', 'rotational'].map((type) => ({
    type,
    count: stats?.patternsByType?.[type] ?? patterns.filter((item) => (item.type || 'day').toLowerCase() === type).length
  }));

  return (
    <section className={styles.patternSummary}>
      <div className={styles.sectionHeader}>
        <div>
          <h2 className={styles.sectionTitle}>Shift Patterns</h2>
          <p className={styles.sectionSubtext}>Configured workforce patterns for active company profile</p>
        </div>
      </div>
      <div className={styles.patternSummaryGrid}>
        {counts.map(({ type, count }) => (
          <div className={styles.patternSummaryItem} key={type}>
            <span className={`${styles.patternDot} ${styles[type]}`} />
            <div>
              <strong>{displayType(type)}</strong>
              <span>{count} shifts</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function Filters({ values, setValue, onReset, patterns, clients, sites, departments }) {
  const field = (label, key, options, placeholder) => (
    <div className={styles.field}>
      <label className={styles.fieldLabel}>{label}</label>
      <select
        className={styles.select}
        value={values[key]}
        onChange={(event) => setValue(key, event.target.value)}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value || option} value={option.value || option}>
            {option.label || option}
          </option>
        ))}
      </select>
    </div>
  );

  return (
    <div className={styles.filterCard}>
      <div className={styles.filterGrid}>
        <div className={styles.field}>
          <label className={styles.fieldLabel}>Search</label>
          <div className={styles.searchBox}>
            <Search size={16} />
            <input
              className={styles.input}
              value={values.search}
              onChange={(event) => setValue('search', event.target.value)}
              placeholder="Search employee or employee ID..."
            />
          </div>
        </div>

        {field(
          'Client',
          'client',
          clients.map((c) => ({ value: c.name, label: c.name })),
          'All Clients'
        )}
        {field('Site', 'site', sites, 'All Sites')}
        {field('Department', 'department', departments, 'All Departments')}
        {field(
          'Shift',
          'shift',
          patterns.map((item) => ({ value: item.name, label: item.name })),
          'All Shifts'
        )}
        {field(
          'Shift Type',
          'shiftType',
          [
            { value: 'day', label: 'Day' },
            { value: 'night', label: 'Night' },
            { value: 'rotational', label: 'Rotational' }
          ],
          'All Types'
        )}
        {field(
          'Status',
          'status',
          [
            { value: 'active', label: 'Active' },
            { value: 'inactive', label: 'Inactive' },
            { value: 'assigned', label: 'Assigned' },
            { value: 'unassigned', label: 'Unassigned' }
          ],
          'All Status'
        )}

        <div className={styles.field}>
          <label className={styles.fieldLabel}>Date</label>
          <input
            className={styles.input}
            type="date"
            value={values.date}
            onChange={(event) => setValue('date', event.target.value)}
          />
        </div>

        <button type="button" className={styles.resetBtn} onClick={onReset}>
          Reset Filters
        </button>
      </div>
    </div>
  );
}

function RosterTable({ rows, onView, onEdit, onChange, onAssign, onUnassign }) {
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
              <th>Department</th>
              <th>Shift</th>
              <th>Shift Type</th>
              <th>Time</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id || row._id || `${row.employeeId}-${row.date}`}>
                <td>
                  <div className={styles.employeeCell}>
                    <span className={styles.avatar}>{row.initials || (row.employeeName ? row.employeeName.substring(0, 2).toUpperCase() : 'EM')}</span>
                    <strong>{row.employeeName}</strong>
                  </div>
                </td>
                <td className={styles.muted}>{row.employeeId}</td>
                <td>{row.clientName || '—'}</td>
                <td>{row.site || '—'}</td>
                <td>{row.department || 'Security'}</td>
                <td className={styles.shiftName}>{row.shiftName}</td>
                <td>
                  <span
                    className={`${styles.typeBadge} ${styles[(row.shiftType || 'unassigned').toLowerCase()]
                      }`}
                  >
                    {row.shiftType ? displayType(row.shiftType) : '—'}
                  </span>
                </td>
                <td className={styles.timeValue}>{timeRange(row)}</td>
                <td>
                  <StatusBadge
                    status={row.status === 'unassigned' ? 'pending' : row.status}
                  >
                    {row.status === 'unassigned'
                      ? 'Unassigned'
                      : row.status === 'active'
                        ? 'Active'
                        : 'Inactive'}
                  </StatusBadge>
                </td>
                <td className={styles.actionCell} onClick={(e) => e.stopPropagation()}>
                  <Dropdown
                    align="right"
                    trigger={
                      <button
                        type="button"
                        className={styles.iconButton}
                        aria-label="Open shift actions"
                      >
                        <MoreVertical size={17} />
                      </button>
                    }
                  >
                    <div className={styles.actionMenuList}>
                      <button
                        type="button"
                        className={styles.menuItemBtn}
                        onClick={() => onView(row)}
                      >
                        View Details
                      </button>
                      {row.status === 'unassigned' ? (
                        <button
                          type="button"
                          className={styles.menuItemBtn}
                          onClick={() => onAssign(row)}
                        >
                          Assign Shift
                        </button>
                      ) : (
                        <>
                          <button
                            type="button"
                            className={styles.menuItemBtn}
                            onClick={() => onEdit(row)}
                          >
                            Edit Roster
                          </button>
                          <button
                            type="button"
                            className={styles.menuItemBtn}
                            onClick={() => onChange(row)}
                          >
                            Change Shift
                          </button>
                          <button
                            type="button"
                            className={styles.menuItemBtn}
                            onClick={() => onUnassign(row)}
                          >
                            Unassign Employee
                          </button>
                        </>
                      )}
                    </div>
                  </Dropdown>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function DetailsDrawer({ record, onClose, onEdit, onChange }) {
  if (!record) return null;

  const detailFields = [
    ['Client', record.clientName || '—'],
    ['Site', record.site || '—'],
    ['Department', record.department || 'Security'],
    ['Shift', record.shiftName || 'Unassigned'],
    ['Shift Type', record.shiftType ? displayType(record.shiftType) : 'Unassigned'],
    ['Shift Date', formatDate(record.startDate || record.date)],
    ...(record.endDate && record.endDate !== (record.startDate || record.date)
      ? [['Shift End Date', formatDate(record.endDate)]]
      : []),
    ['Start Time', displayTime(record.startTime)],
    ['End Time', displayTime(record.endTime)]
  ];

  return (
    <>
      <div
        className={styles.drawerOverlay}
        onClick={onClose}
        aria-hidden="true"
      />
      <aside className={styles.drawer}>
        <div className={styles.drawerHeader}>
          <h2>Shift Assignment Details</h2>
          <button
            type="button"
            className={styles.closeButton}
            aria-label="Close details"
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>
        <div className={styles.drawerBody}>
          <h3>{record.employeeName}</h3>
          <p className={styles.muted}>{record.employeeId}</p>
          {detailFields.map(([label, value]) => (
            <div className={styles.detailRow} key={label}>
              <span>{label}</span>
              <strong>{value}</strong>
            </div>
          ))}
          <div className={styles.detailRow}>
            <span>Status</span>
            <StatusBadge
              status={record.status === 'unassigned' ? 'pending' : record.status}
            >
              {record.status === 'unassigned' ? 'Unassigned' : record.status}
            </StatusBadge>
          </div>
        </div>
        {record.status !== 'unassigned' && (
          <div className={styles.drawerActions}>
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={() => onEdit(record)}
            >
              Edit Roster
            </button>
            <button
              type="button"
              className={styles.primaryButton}
              onClick={() => onChange(record)}
            >
              Change Shift
            </button>
          </div>
        )}
      </aside>
    </>
  );
}

function ShiftForm({ open, editing, onClose, onSave }) {
  const empty = {
    name: '',
    type: 'day',
    startTime: '',
    endTime: '',
    gracePeriod: 15,
    breakDuration: 30,
    status: 'active',
    description: ''
  };

  const [form, setForm] = useState(empty);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (editing) {
      setForm({
        name: editing.name || '',
        type: editing.type || 'day',
        startTime: editing.startTime || '',
        endTime: editing.endTime || '',
        gracePeriod: editing.gracePeriod ?? 15,
        breakDuration: editing.breakDuration ?? 30,
        status: editing.status || 'active',
        description: editing.description || '',
        id: editing.id || editing._id
      });
    } else {
      setForm(empty);
    }
  }, [editing, open]);

  if (!open) return null;

  const update = (key, value) =>
    setForm((current) => ({ ...current, [key]: value }));

  const save = () => {
    const next = {};
    if (!form.name.trim()) next.name = 'Shift name is required.';
    if (!form.type) next.type = 'Shift type is required.';
    if (!form.startTime && form.type !== 'rotational') next.startTime = 'Start time is required.';
    if (!form.endTime && form.type !== 'rotational') next.endTime = 'End time is required.';
    setErrors(next);
    if (!Object.keys(next).length) {
      onSave({
        ...form,
        name: form.name.trim(),
        id: editing?.id || editing?._id
      });
    }
  };

  return (
    <Modal title={editing ? 'Edit Shift' : 'Add Shift'} onClose={onClose}>
      <div className={styles.formGrid}>
        <FormField label="Shift Name" error={errors.name}>
          <input
            className={styles.input}
            value={form.name}
            onChange={(event) => update('name', event.target.value)}
            placeholder="Enter shift name (e.g. Morning Patrol Shift)"
          />
        </FormField>
        <FormField label="Shift Type" error={errors.type}>
          <select
            className={styles.select}
            value={form.type}
            onChange={(event) => update('type', event.target.value)}
          >
            <option value="day">Day</option>
            <option value="night">Night</option>
            <option value="rotational">Rotational</option>
          </select>
        </FormField>
        <FormField label="Start Time" error={errors.startTime}>
          <input
            className={styles.input}
            type="time"
            value={form.startTime || ''}
            onChange={(event) => update('startTime', event.target.value)}
          />
        </FormField>
        <FormField label="End Time" error={errors.endTime}>
          <input
            className={styles.input}
            type="time"
            value={form.endTime || ''}
            onChange={(event) => update('endTime', event.target.value)}
          />
        </FormField>
        <FormField label="Grace Period (minutes)">
          <input
            className={styles.input}
            type="number"
            min="0"
            value={form.gracePeriod}
            onChange={(event) => update('gracePeriod', event.target.value)}
          />
        </FormField>
        <FormField label="Break Duration (minutes)">
          <input
            className={styles.input}
            type="number"
            min="0"
            value={form.breakDuration}
            onChange={(event) => update('breakDuration', event.target.value)}
          />
        </FormField>
        <FormField label="Status">
          <label className={styles.switchLabel}>
            <input
              type="checkbox"
              checked={form.status === 'active'}
              onChange={(event) =>
                update('status', event.target.checked ? 'active' : 'inactive')
              }
            />{' '}
            Active
          </label>
        </FormField>
        <FormField label="Description" full>
          <textarea
            className={styles.textarea}
            value={form.description}
            onChange={(event) => update('description', event.target.value)}
            placeholder="Enter shift description..."
          />
        </FormField>
      </div>
      <ModalActions
        onClose={onClose}
        onSave={save}
        saveLabel={editing ? 'Save Changes' : 'Save Shift'}
      />
    </Modal>
  );
}

function FormField({ label, error, children, full }) {
  return (
    <div className={`${styles.formField} ${full ? styles.full : ''}`}>
      <label className={styles.fieldLabel}>{label}</label>
      {children}
      {error && <span className={styles.error}>{error}</span>}
    </div>
  );
}

function Modal({ title, children, onClose }) {
  return (
    <div className={styles.modalOverlay} role="dialog" aria-modal="true">
      <div className={styles.modalCard}>
        <div className={styles.modalHeader}>
          <h2>{title}</h2>
          <button
            type="button"
            className={styles.closeButton}
            aria-label="Close modal"
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function ModalActions({ onClose, onSave, saveLabel }) {
  return (
    <div className={styles.modalActions}>
      <button type="button" className={styles.secondaryButton} onClick={onClose}>
        Cancel
      </button>
      <button type="button" className={styles.primaryButton} onClick={onSave}>
        {saveLabel}
      </button>
    </div>
  );
}

function AssignModal({ open, editing, patterns, employees, clients, sites, onClose, onSave }) {
  const initialEmployee = editing?.employeeId
    ? employees.find((item) => (item.employeeId === editing.employeeId || item._id === editing.employeeId))
    : null;

  const empty = {
    clientName: editing?.clientName || initialEmployee?.companyName || initialEmployee?.clientName || '',
    employeeId: editing?.employeeId || '',
    site: editing?.site || initialEmployee?.siteLocation || initialEmployee?.site || '',
    shiftId: editing?.shiftId ? String(editing.shiftId) : '',
    startDate: editing?.startDate || editing?.date || getTodayDate(),
    endDate: editing?.endDate || editing?.date || getTodayDate(),
    date: editing?.date || editing?.startDate || getTodayDate()
  };

  const [form, setForm] = useState(empty);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (editing) {
      setForm({
        clientName: editing.clientName || '',
        employeeId: editing.employeeId || '',
        site: editing.site || '',
        shiftId: editing.shiftId ? String(editing.shiftId) : '',
        startDate: editing.startDate || editing.date || getTodayDate(),
        endDate: editing.endDate || editing.date || getTodayDate(),
        date: editing.date || editing.startDate || getTodayDate()
      });
    } else {
      setForm(empty);
    }
  }, [editing, open]);

  if (!open) return null;

  const selectedEmployeeObj = employees.find((item) => (item.employeeId === form.employeeId || item._id === form.employeeId));

  // Available employees (filtered by selected client if any, otherwise all)
  const availableEmployees = form.clientName
    ? employees.filter(
      (item) =>
        item.companyName === form.clientName ||
        item.clientName === form.clientName ||
        item.clientId === form.clientName ||
        item.companyId === form.clientName
    )
    : employees;

  const handleClientChange = (clientName) => {
    setForm((current) => {
      const empBelongs = employees.some(
        (item) =>
          (item.employeeId === current.employeeId || item._id === current.employeeId) &&
          (item.companyName === clientName || item.clientName === clientName)
      );

      return {
        ...current,
        clientName,
        employeeId: empBelongs ? current.employeeId : ''
      };
    });
    if (errors.clientName) {
      setErrors((prev) => ({ ...prev, clientName: null }));
    }
  };

  const handleEmployeeChange = (employeeId) => {
    const selectedEmp = employees.find((item) => (item.employeeId === employeeId || item._id === employeeId));
    setForm((current) => ({
      ...current,
      employeeId,
      clientName: current.clientName || selectedEmp?.clientName || selectedEmp?.companyName || '',
      site: current.site || selectedEmp?.siteLocation || selectedEmp?.site || ''
    }));
    if (errors.employeeId) {
      setErrors((prev) => ({ ...prev, employeeId: null }));
    }
  };

  const update = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
    if (errors[key]) {
      setErrors((prev) => ({ ...prev, [key]: null }));
    }
  };

  const save = () => {
    const next = {};
    if (!form.employeeId) next.employeeId = 'Employee selection is required.';
    if (!form.shiftId) next.shiftId = 'Shift selection is required.';
    if (!form.startDate && !form.date) next.startDate = 'Shift start date is required.';
    if (!form.endDate) next.endDate = 'Shift end date is required.';
    if (form.startDate && form.endDate && form.startDate > form.endDate) {
      next.endDate = 'End date cannot be earlier than start date.';
    }
    setErrors(next);
    if (!Object.keys(next).length) {
      onSave({
        ...form,
        date: form.startDate || form.date,
        startDate: form.startDate || form.date,
        endDate: form.endDate,
        shiftId: form.shiftId,
        employee: selectedEmployeeObj
      });
    }
  };

  return (
    <Modal
      title={editing ? 'Edit Roster Assignment' : 'Assign Employee to Shift'}
      onClose={onClose}
    >
      <div className={styles.formGrid}>
        {/* 1. Client Select */}
        <FormField label="Client (Optional Filter)" error={errors.clientName}>
          <select
            className={styles.select}
            value={form.clientName}
            onChange={(event) => handleClientChange(event.target.value)}
            disabled={Boolean(editing)}
          >
            <option value="">All Clients / Companies</option>
            {clients.map((item) => (
              <option key={item.id || item._id || item.name} value={item.name}>
                {item.name}
              </option>
            ))}
          </select>
        </FormField>

        {/* 2. Employee Select */}
        <FormField label="Employee *" error={errors.employeeId}>
          <select
            className={styles.select}
            value={form.employeeId}
            onChange={(event) => handleEmployeeChange(event.target.value)}
            disabled={Boolean(editing)}
          >
            <option value="">Select employee</option>
            {(availableEmployees.length > 0 ? availableEmployees : employees).map((item) => (
              <option key={item.employeeId || item._id} value={item.employeeId}>
                {item.name} — ({item.employeeId || item.employeeCode || 'ID'})
              </option>
            ))}
          </select>
        </FormField>

        {/* 3. Site */}
        <FormField label="Site / Location" error={errors.site}>
          <input
            className={styles.input}
            list="site-suggestions"
            placeholder="e.g. Main Gate, Building 4, Warehouse A"
            value={form.site}
            onChange={(event) => update('site', event.target.value)}
          />
          <datalist id="site-suggestions">
            {sites.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
        </FormField>

        {/* 4. Department */}
        <FormField label="Department">
          <input
            className={styles.input}
            readOnly
            value={selectedEmployeeObj?.department || 'Security'}
            placeholder="Department"
          />
        </FormField>

        {/* 5. Shift */}
        <FormField label="Shift *" error={errors.shiftId}>
          <select
            className={styles.select}
            value={form.shiftId}
            onChange={(event) => update('shiftId', event.target.value)}
          >
            <option value="">Select shift</option>
            {patterns.map((item) => (
              <option key={item.id || item._id || item.shiftId} value={item.shiftId || item._id || item.id}>
                {item.name} — {timeRange(item)}
              </option>
            ))}
          </select>
        </FormField>

        {/* 6. Shift Start Date */}
        <FormField label="Shift Start Date *" error={errors.startDate || errors.date}>
          <input
            className={styles.input}
            type="date"
            value={form.startDate || form.date || ''}
            onChange={(event) => {
              update('startDate', event.target.value);
              update('date', event.target.value);
            }}
          />
        </FormField>

        {/* 7. Shift End Date */}
        <FormField label="Shift End Date *" error={errors.endDate}>
          <input
            className={styles.input}
            type="date"
            value={form.endDate || ''}
            onChange={(event) => update('endDate', event.target.value)}
          />
        </FormField>
      </div>
      <ModalActions
        onClose={onClose}
        onSave={save}
        saveLabel={editing ? 'Save Changes' : 'Assign Employee'}
      />
    </Modal>
  );
}

function ChangeShiftModal({ record, patterns, onClose, onSave }) {
  const [shiftId, setShiftId] = useState(String(record?.shiftId || ''));
  const [date, setDate] = useState(record?.date || getTodayDate());

  if (!record) return null;

  return (
    <Modal title="Change Shift" onClose={onClose}>
      <div className={styles.changeSummary}>
        <span>Employee</span>
        <strong>{record.employeeName} ({record.employeeId})</strong>
        <span>Current Shift</span>
        <strong>{record.shiftName} · {timeRange(record)}</strong>
      </div>
      <div className={styles.formGrid}>
        <FormField label="New Shift">
          <select
            className={styles.select}
            value={shiftId}
            onChange={(event) => setShiftId(event.target.value)}
          >
            <option value="">Select new shift</option>
            {patterns.map((item) => (
              <option key={item.id || item._id || item.shiftId} value={item.shiftId || item._id || item.id}>
                {item.name} — {timeRange(item)}
              </option>
            ))}
          </select>
        </FormField>
        <FormField label="Effective Date">
          <input
            className={styles.input}
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
          />
        </FormField>
      </div>
      <ModalActions
        onClose={onClose}
        onSave={() => onSave({ shiftId, date })}
        saveLabel="Change Shift"
      />
    </Modal>
  );
}

function UnassignModal({ record, onClose, onConfirm }) {
  if (!record) return null;
  return (
    <Modal title="Unassign Employee?" onClose={onClose}>
      <p className={styles.modalText}>
        Are you sure you want to remove <strong>{record.employeeName}</strong> from{' '}
        {record.shiftName} on {formatDate(record.date)}?
      </p>
      <ModalActions
        onClose={onClose}
        onSave={onConfirm}
        saveLabel="Unassign"
      />
    </Modal>
  );
}

function PatternTable({ patterns, onEdit, onDelete }) {
  return (
    <div className={styles.tableCard}>
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Shift Name</th>
              <th>Shift Type</th>
              <th>Start Time</th>
              <th>End Time</th>
              <th>Break</th>
              <th>Grace Period</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {patterns.map((item) => (
              <tr key={item.id || item._id || item.shiftId}>
                <td className={styles.shiftName}>{item.name}</td>
                <td>
                  <span className={`${styles.typeBadge} ${styles[(item.type || 'day').toLowerCase()]}`}>
                    {displayType(item.type)}
                  </span>
                </td>
                <td>{displayTime(item.startTime)}</td>
                <td>{displayTime(item.endTime)}</td>
                <td>{item.breakDuration || 30} min</td>
                <td>{item.gracePeriod || 15} min</td>
                <td>
                  <StatusBadge status={item.status}>{item.status}</StatusBadge>
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      type="button"
                      className={styles.smallAction}
                      onClick={() => onEdit(item)}
                      title="Edit shift details"
                    >
                      <Edit2 size={13} style={{ marginRight: '4px' }} /> Edit
                    </button>
                    {onDelete && (
                      <button
                        type="button"
                        className={styles.smallAction}
                        style={{ color: 'var(--danger, #ef4444)' }}
                        onClick={() => onDelete(item)}
                        title="Delete shift"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CalendarView({ roster, selectedDate, setSelectedDate }) {
  const [month, setMonth] = useState(() => new Date(selectedDate ? `${selectedDate}T00:00:00` : new Date()));
  const [view, setView] = useState('month');
  const [dayRecords, setDayRecords] = useState(null);

  const firstDay = (month.getDay() + 6) % 7;
  const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();

  const recordsByDate = useMemo(
    () =>
      roster.reduce((map, item) => {
        if (item.date) {
          (map[item.date] ||= []).push(item);
        }
        return map;
      }, {}),
    [roster]
  );

  const shiftCounts = (date) =>
    Object.values(
      (recordsByDate[date] || []).reduce((map, item) => {
        if (item.shiftName && item.status !== 'unassigned') {
          map[item.shiftName] = (map[item.shiftName] || 0) + 1;
        }
        return map;
      }, {})
    );

  const moveMonth = (amount) =>
    setMonth((current) => new Date(current.getFullYear(), current.getMonth() + amount, 1));

  const monthLabel = new Intl.DateTimeFormat('en-US', {
    month: 'long',
    year: 'numeric'
  }).format(month);

  if (view === 'week') {
    return (
      <div className={styles.calendarCard}>
        <CalendarHeader
          label={`Week of ${formatDate(selectedDate)}`}
          onPrevious={() => {
            const d = new Date(selectedDate);
            d.setDate(d.getDate() - 7);
            setSelectedDate(d.toISOString().split('T')[0]);
          }}
          onNext={() => {
            const d = new Date(selectedDate);
            d.setDate(d.getDate() + 7);
            setSelectedDate(d.toISOString().split('T')[0]);
          }}
          onToday={() => setSelectedDate(getTodayDate())}
          view={view}
          setView={setView}
        />
        <WeekView roster={roster} />
      </div>
    );
  }

  return (
    <div className={styles.calendarCard}>
      <CalendarHeader
        label={monthLabel}
        onPrevious={() => moveMonth(-1)}
        onNext={() => moveMonth(1)}
        onToday={() => {
          setMonth(new Date());
          setSelectedDate(getTodayDate());
        }}
        view={view}
        setView={setView}
      />
      <div className={styles.calendarGrid}>
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
          <div className={styles.calendarHead} key={day}>
            {day}
          </div>
        ))}
        {Array.from({ length: firstDay }).map((_, index) => (
          <div
            className={`${styles.calendarDay} ${styles.mutedDay}`}
            key={`empty-${index}`}
          />
        ))}
        {Array.from({ length: days }, (_, index) => {
          const day = index + 1;
          const date = `${month.getFullYear()}-${String(
            month.getMonth() + 1
          ).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const records = recordsByDate[date] || [];
          const counts = shiftCounts(date);

          return (
            <button
              type="button"
              className={`${styles.calendarDay} ${date === selectedDate ? styles.selectedDay : ''
                }`}
              key={date}
              onClick={() => {
                setSelectedDate(date);
                setDayRecords(records);
              }}
            >
              <span className={styles.dayNumber}>{day}</span>
              {counts.slice(0, 3).map((count, countIndex) => (
                <span
                  className={`${styles.dayIndicator} ${styles[`indicator${countIndex}`]
                    }`}
                  key={`${date}-${countIndex}`}
                >
                  {count} employee{count > 1 ? 's' : ''}
                </span>
              ))}
              {counts.length > 3 && (
                <span className={styles.moreIndicator}>
                  + {counts.length - 3} more
                </span>
              )}
            </button>
          );
        })}
      </div>
      {dayRecords && (
        <DayDrawer
          records={dayRecords}
          date={selectedDate}
          onClose={() => setDayRecords(null)}
        />
      )}
    </div>
  );
}

function CalendarHeader({ label, onPrevious, onNext, onToday, view, setView }) {
  return (
    <div className={styles.calendarHeader}>
      <div className={styles.calendarTitle}>
        <CalendarDays size={20} />
        <h2>{label}</h2>
      </div>
      <div className={styles.calendarControls}>
        <button
          type="button"
          className={styles.iconButton}
          aria-label="Previous month"
          onClick={onPrevious}
        >
          <ChevronLeft size={18} />
        </button>
        <button
          type="button"
          className={styles.secondaryButton}
          onClick={onToday}
        >
          Today
        </button>
        <button
          type="button"
          className={styles.iconButton}
          aria-label="Next month"
          onClick={onNext}
        >
          <ChevronRight size={18} />
        </button>
        <div className={styles.viewToggle}>
          <button
            type="button"
            className={view === 'month' ? styles.toggleActive : ''}
            onClick={() => setView('month')}
          >
            Month
          </button>
          <button
            type="button"
            className={view === 'week' ? styles.toggleActive : ''}
            onClick={() => setView('week')}
          >
            Week
          </button>
        </div>
      </div>
    </div>
  );
}

function WeekView({ roster }) {
  const week = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const employees = [
    ...new Map(roster.map((item) => [item.employeeId, item])).values()
  ].slice(0, 15);

  return (
    <div className={styles.weekWrapper}>
      <table className={styles.weekTable}>
        <thead>
          <tr>
            <th>Employee</th>
            {week.map((day) => (
              <th key={day}>{day}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {employees.map((employee, employeeIndex) => (
            <tr key={employee.employeeId}>
              <td>{employee.employeeName}</td>
              {week.map((day, dayIndex) => (
                <td key={day}>
                  <span
                    className={`${styles.weekBadge} ${styles[
                      dayIndex === 6
                        ? 'off'
                        : (employee.shiftType || 'day').toLowerCase()
                    ]
                      }`}
                  >
                    {dayIndex === 6
                      ? 'Off'
                      : (employee.shiftName || 'Day Shift').replace(' Shift', '')}
                  </span>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function DayDrawer({ records, date, onClose }) {
  const groups = Object.entries(
    records.reduce((map, item) => {
      const sName = item.shiftName || 'Unassigned';
      (map[sName] ||= []).push(item);
      return map;
    }, {})
  );

  return (
    <>
      <div
        className={styles.drawerOverlay}
        onClick={onClose}
        aria-hidden="true"
      />
      <aside className={styles.drawer}>
        <div className={styles.drawerHeader}>
          <h2>{formatDate(date)}</h2>
          <button
            type="button"
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Close day details"
          >
            <X size={20} />
          </button>
        </div>
        <div className={styles.drawerBody}>
          {groups.length === 0 ? (
            <p className={styles.muted}>No shift records for this date.</p>
          ) : (
            groups.map(([name, items]) => (
              <div className={styles.dayGroup} key={name}>
                <div>
                  <strong>{name}</strong>
                  <span>{items.length} Employees</span>
                </div>
                <span className={styles.muted}>{timeRange(items[0])}</span>
                {items.slice(0, 8).map((item) => (
                  <p key={item.id || item._id || item.employeeId}>
                    {item.initials || 'EM'} {item.employeeName}
                  </p>
                ))}
              </div>
            ))
          )}
        </div>
      </aside>
    </>
  );
}

function SummarySections({ stats, roster }) {
  const siteDistribution = stats?.siteDistribution || [];
  const clientSummary = stats?.clientSummary || [];

  return (
    <div className={styles.summarySections}>
      <section className={styles.summaryBlock}>
        <h2 className={styles.sectionTitle}>Shift Distribution by Site</h2>
        {siteDistribution.length === 0 ? (
          <p className={styles.muted} style={{ padding: '16px 0' }}>No site distribution data recorded yet.</p>
        ) : (
          <table className={styles.summaryTable}>
            <thead>
              <tr>
                <th>Site</th>
                <th>Day</th>
                <th>Night</th>
                <th>Rotational</th>
              </tr>
            </thead>
            <tbody>
              {siteDistribution.map((row) => (
                <tr key={row.site}>
                  <td>{row.site}</td>
                  <td>{row.day}</td>
                  <td>{row.night}</td>
                  <td>{row.rotational}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className={styles.summaryBlock}>
        <h2 className={styles.sectionTitle}>Shift Summary by Client</h2>
        {clientSummary.length === 0 ? (
          <p className={styles.muted} style={{ padding: '16px 0' }}>No client summary recorded yet.</p>
        ) : (
          <table className={styles.summaryTable}>
            <thead>
              <tr>
                <th>Client</th>
                <th>Employees</th>
                <th>Active Shifts</th>
              </tr>
            </thead>
            <tbody>
              {clientSummary.map((row) => (
                <tr key={row.name}>
                  <td>{row.name}</td>
                  <td>{row.employees}</td>
                  <td>{row.shifts}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}

function ExportModal({ open, onClose, onExport, clients, sites, departments, patterns }) {
  const [form, setForm] = useState({
    fromDate: getTodayDate(),
    toDate: getTodayDate(),
    format: 'excel',
    client: '',
    site: '',
    department: '',
    shift: ''
  });

  if (!open) return null;

  const update = (key, value) =>
    setForm((current) => ({ ...current, [key]: value }));

  return (
    <Modal title="Export Shift Roster" onClose={onClose}>
      <div className={styles.formGrid}>
        <FormField label="From Date">
          <input
            className={styles.input}
            type="date"
            value={form.fromDate}
            onChange={(event) => update('fromDate', event.target.value)}
          />
        </FormField>
        <FormField label="To Date">
          <input
            className={styles.input}
            type="date"
            value={form.toDate}
            onChange={(event) => update('toDate', event.target.value)}
          />
        </FormField>
        <FormField label="Client">
          <select
            className={styles.select}
            value={form.client}
            onChange={(event) => update('client', event.target.value)}
          >
            <option value="">All Clients</option>
            {clients.map((item) => (
              <option key={item.id || item._id || item.name} value={item.name}>{item.name}</option>
            ))}
          </select>
        </FormField>
        <FormField label="Site">
          <select
            className={styles.select}
            value={form.site}
            onChange={(event) => update('site', event.target.value)}
          >
            <option value="">All Sites</option>
            {sites.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
        </FormField>
        <FormField label="Department">
          <select
            className={styles.select}
            value={form.department}
            onChange={(event) => update('department', event.target.value)}
          >
            <option value="">All Departments</option>
            {departments.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
        </FormField>
        <FormField label="Shift">
          <select
            className={styles.select}
            value={form.shift}
            onChange={(event) => update('shift', event.target.value)}
          >
            <option value="">All Shifts</option>
            {patterns.map((item) => (
              <option key={item.id || item._id || item.shiftId} value={item.name}>{item.name}</option>
            ))}
          </select>
        </FormField>
        <FormField label="Format" full>
          <div className={styles.radioRow}>
            {['excel', 'csv', 'pdf'].map((format) => (
              <label key={format}>
                <input
                  type="radio"
                  name="shift-format"
                  checked={form.format === format}
                  onChange={() => update('format', format)}
                />{' '}
                {format.toUpperCase()}
              </label>
            ))}
          </div>
        </FormField>
      </div>
      <ModalActions
        onClose={onClose}
        onSave={() => onExport(form)}
        saveLabel="Export"
      />
    </Modal>
  );
}

function ShiftManagement() {
  const { activeCompany } = useCompany();
  const currentCompanyId = activeCompany?.companyId || activeCompany?.id || '';

  const [patterns, setPatterns] = useState([]);
  const [roster, setRoster] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [clients, setClients] = useState([]);
  const [stats, setStats] = useState(null);

  const [searchParams, setSearchParams] = useSearchParams();
  const [tab, setTab] = useState(() => searchParams.get('tab') || 'roster');

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam) {
      setTab(tabParam);
    } else {
      setTab('roster');
    }
  }, [searchParams]);

  const [selectedDate, setSelectedDate] = useState(getTodayDate());
  const [filters, setFilters] = useState({
    search: '',
    client: '',
    site: '',
    department: '',
    shift: '',
    shiftType: '',
    status: '',
    date: getTodayDate()
  });

  const [page, setPage] = useState(1);
  const [details, setDetails] = useState(null);
  const [editingRoster, setEditingRoster] = useState(null);
  const [changingRoster, setChangingRoster] = useState(null);
  const [unassigning, setUnassigning] = useState(null);
  const [shiftFormOpen, setShiftFormOpen] = useState(false);
  const [editingShift, setEditingShift] = useState(null);
  const [assignOpen, setAssignOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(true);

  const notify = (message, type = 'success') => setToast({ message, type });

  // Fetch shifts, roster, employees, and clients dynamically from MongoDB
  const fetchData = useCallback(async () => {
    if (!currentCompanyId) return;
    setLoading(true);
    try {
      const [shiftsData, rosterData, statsData] = await Promise.all([
        shiftService.getShifts(currentCompanyId).catch(() => []),
        shiftService.getShiftRoster(filters, currentCompanyId).catch(() => ({ roster: [] })),
        shiftService.getShiftStats(filters.date, currentCompanyId).catch(() => null)
      ]);

      setPatterns(shiftsData || []);
      setRoster(rosterData.roster || []);
      setStats(statsData);

      // Fetch employees and clients
      const token = authService.getToken();
      const [empRes, clientRes] = await Promise.all([
        fetch(`${API_BASE_URL}/employees`, {
          headers: { 'Authorization': `Bearer ${token || ''}`, 'x-company-id': currentCompanyId }
        }),
        fetch(`${API_BASE_URL}/clients`, {
          headers: { 'Authorization': `Bearer ${token || ''}`, 'x-company-id': currentCompanyId }
        })
      ]);

      const [empJson, clientJson] = await Promise.all([
        empRes.json().catch(() => ({})),
        clientRes.json().catch(() => ({}))
      ]);

      if (empJson.success) setEmployees(empJson.employees || []);
      if (clientJson.success) setClients(clientJson.clients || []);
    } catch (err) {
      console.error('Error fetching shift management data:', err);
      notify('Failed to load shift records from database.', 'error');
    } finally {
      setLoading(false);
    }
  }, [currentCompanyId, filters]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Derived lists for dropdowns
  const sites = useMemo(() => {
    const s = new Set();
    employees.forEach(e => {
      if (e.siteLocation) s.add(e.siteLocation);
      if (e.site) s.add(e.site);
    });
    roster.forEach(r => {
      if (r.site) s.add(r.site);
    });
    if (s.size === 0) {
      s.add('Main Site');
      s.add('Gate 1');
      s.add('Warehouse A');
    }
    return Array.from(s);
  }, [employees, roster]);

  const departments = useMemo(() => {
    const d = new Set();
    employees.forEach(e => {
      if (e.department) d.add(e.department);
    });
    if (d.size === 0) {
      d.add('Security');
      d.add('Operations');
      d.add('Patrolling');
    }
    return Array.from(d);
  }, [employees]);

  const setFilter = (key, value) => {
    setPage(1);
    setFilters((current) => ({ ...current, [key]: value }));
  };

  const filteredRoster = useMemo(() => {
    return roster.filter((item) => {
      const query = filters.search.toLowerCase().trim();
      if (
        query &&
        !item.employeeName?.toLowerCase().includes(query) &&
        !item.employeeId?.toLowerCase().includes(query)
      ) {
        return false;
      }
      if (filters.client && item.clientName !== filters.client) return false;
      if (filters.site && item.site !== filters.site) return false;
      if (filters.department && item.department !== filters.department) return false;
      if (filters.shift && item.shiftName !== filters.shift) return false;
      if (filters.shiftType && item.shiftType !== filters.shiftType) return false;
      if (filters.status === 'assigned' && item.status === 'unassigned') return false;
      if (filters.status === 'unassigned' && item.status !== 'unassigned') return false;
      if (
        filters.status &&
        ['active', 'inactive'].includes(filters.status) &&
        item.status !== filters.status
      ) {
        return false;
      }
      if (filters.date && item.date !== filters.date) return false;
      return true;
    });
  }, [roster, filters]);

  const pageRows = filteredRoster.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const resetFilters = () => {
    setPage(1);
    setFilters({
      search: '',
      client: '',
      site: '',
      department: '',
      shift: '',
      shiftType: '',
      status: '',
      date: getTodayDate()
    });
  };

  const saveShift = async (data) => {
    try {
      if (data.id) {
        await shiftService.updateShift(data.id, data, currentCompanyId);
        notify('✓ Shift updated successfully.');
      } else {
        await shiftService.createShift(data, currentCompanyId);
        notify('✓ Shift created successfully.');
      }
      setShiftFormOpen(false);
      setEditingShift(null);
      await fetchData();
    } catch (err) {
      console.error('Error saving shift:', err);
      notify(err.message || 'Failed to save shift.', 'error');
    }
  };

  const deleteShift = async (shift) => {
    if (!window.confirm(`Are you sure you want to delete shift "${shift.name}"?`)) return;
    try {
      await shiftService.deleteShift(shift.id || shift._id, currentCompanyId);
      notify('✓ Shift deleted successfully.');
      await fetchData();
    } catch (err) {
      notify(err.message || 'Failed to delete shift.', 'error');
    }
  };

  const saveAssignment = async (data) => {
    try {
      await shiftService.assignShift(
        {
          employeeId: data.employeeId,
          employeeName: data.employee?.name || data.employeeName,
          clientId: data.employee?.clientId || data.employee?.companyId || data.clientId,
          clientName: data.employee?.clientName || data.employee?.companyName || data.clientName,
          site: data.site,
          department: data.employee?.department || data.department,
          shiftId: data.shiftId,
          startDate: data.startDate || data.date,
          endDate: data.endDate || data.startDate || data.date,
          date: data.startDate || data.date
        },
        currentCompanyId
      );

      setAssignOpen(false);
      setEditingRoster(null);
      setDetails(null);
      notify('✓ Shift assigned successfully.');
      await fetchData();
    } catch (err) {
      console.error('Error assigning shift:', err);
      notify(err.message || 'Failed to assign shift.', 'error');
    }
  };

  const changeShift = async (data) => {
    try {
      const recordId = changingRoster._id || changingRoster.id || changingRoster.employeeId;
      await shiftService.changeShift(
        recordId,
        { shiftId: data.shiftId, date: data.date },
        currentCompanyId
      );
      setChangingRoster(null);
      setDetails(null);
      notify('✓ Shift changed successfully.');
      await fetchData();
    } catch (err) {
      notify(err.message || 'Failed to change shift.', 'error');
    }
  };

  const confirmUnassign = async () => {
    try {
      const recordId = unassigning._id || unassigning.id || unassigning.employeeId;
      await shiftService.unassignEmployee(recordId, unassigning.date, currentCompanyId);
      setUnassigning(null);
      setDetails(null);
      notify('✓ Employee unassigned successfully.');
      await fetchData();
    } catch (err) {
      notify(err.message || 'Failed to unassign employee.', 'error');
    }
  };

  const exportRoster = (data) => {
    if (data.fromDate > data.toDate) {
      notify('Start date cannot be later than end date.', 'error');
      return;
    }
    setExportOpen(false);
    notify('Preparing shift roster export...');
    setTimeout(() => {
      // Trigger browser print or CSV download of filtered entries
      const rows = filteredRoster.map(r => `${r.employeeName},${r.employeeId},${r.clientName},${r.site},${r.shiftName},${r.shiftType},${r.date}`).join('\n');
      const blob = new Blob([`Employee,ID,Client,Site,Shift,Type,Date\n${rows}`], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `shift_roster_${getTodayDate()}.csv`;
      a.click();
      notify('✓ Shift roster exported successfully.');
    }, 500);
  };

  const openCalendar = () => {
    setPage(1);
    setTab('calendar');
    setSelectedDate(filters.date);
    setSearchParams({ tab: 'calendar' });
  };

  return (
    <AdminLayout>
      <div className={styles.container}>
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}

        <div className={styles.breadcrumb}>
          <span>Dashboard</span>
          <span>/</span>
          <strong>Shifts</strong>
        </div>

        <header className={styles.pageHeader}>
          <div>
            <h1>Shift Management</h1>
            <p>Create shifts, assign employees and manage workforce rosters for {activeCompany?.name || 'Active Company'}.</p>
          </div>
          <div className={styles.headerActions}>
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={openCalendar}
            >
              <CalendarDays size={16} /> Calendar View
            </button>
            <button
              type="button"
              className={styles.primaryButton}
              onClick={() => {
                setEditingShift(null);
                setShiftFormOpen(true);
              }}
            >
              <Plus size={16} /> Add Shift
            </button>
          </div>
        </header>

        {loading && !stats ? (
          <div className={styles.loadingGrid}>
            {[1, 2, 3, 4].map((item) => (
              <div className={styles.loadingCard} key={item} />
            ))}
          </div>
        ) : (
          <SummaryCards stats={stats} patterns={patterns} roster={roster} />
        )}

        <PatternSummary patterns={patterns} stats={stats} />

        {tab === 'roster' && (
          <>
            <section className={styles.sectionIntro}>
              <div>
                <h2 className={styles.sectionTitle}>Shift Roster</h2>
                <p className={styles.sectionSubtext}>
                  View and manage employee shift assignments.
                </p>
              </div>
              <div className={styles.introActions}>
                <button
                  type="button"
                  className={styles.secondaryButton}
                  onClick={() => setExportOpen(true)}
                >
                  <Download size={16} /> Export Roster
                </button>
                <button
                  type="button"
                  className={styles.primaryButton}
                  onClick={() => {
                    setEditingRoster(null);
                    setAssignOpen(true);
                  }}
                >
                  <Plus size={16} /> Assign Employee
                </button>
              </div>
            </section>

            <Filters
              values={filters}
              setValue={setFilter}
              onReset={resetFilters}
              patterns={patterns}
              clients={clients}
              sites={sites}
              departments={departments}
            />

            {loading ? (
              <div className={styles.tableCard}>
                <div className={styles.loadingTable} />
              </div>
            ) : pageRows.length ? (
              <>
                <RosterTable
                  rows={pageRows}
                  onView={setDetails}
                  onEdit={(row) => {
                    setEditingRoster(row);
                    setAssignOpen(true);
                  }}
                  onChange={setChangingRoster}
                  onAssign={(row) => {
                    setEditingRoster(row);
                    setAssignOpen(true);
                  }}
                  onUnassign={setUnassigning}
                />
                <Pagination
                  currentPage={page}
                  totalItems={filteredRoster.length}
                  itemsPerPage={PAGE_SIZE}
                  onPageChange={setPage}
                  label="assignments"
                />
              </>
            ) : (
              <div className={styles.emptyWrap}>
                <EmptyState
                  title="No shift assignments found."
                  description="Try changing your filters or date, or assign an employee to a shift."
                  actionLabel="Reset Filters"
                  onAction={resetFilters}
                />
              </div>
            )}

            {roster.filter((item) => item.status === 'unassigned').length > 0 && (
              <div className={styles.warningCard}>
                <UserRoundX size={20} />
                <div>
                  <strong>Employees Without Shift</strong>
                  <span>{roster.filter((item) => item.status === 'unassigned').length} employees currently have no shift assignment on {formatDate(filters.date)}.</span>
                </div>
                <button
                  type="button"
                  onClick={() => setFilter('status', 'unassigned')}
                >
                  View Unassigned
                </button>
              </div>
            )}
          </>
        )}

        {tab === 'patterns' && (
          <>
            <section className={styles.sectionIntro}>
              <div>
                <h2 className={styles.sectionTitle}>Shift Patterns</h2>
                <p className={styles.sectionSubtext}>
                  Create and manage configured shift timings.
                </p>
              </div>
              <button
                type="button"
                className={styles.primaryButton}
                onClick={() => {
                  setEditingShift(null);
                  setShiftFormOpen(true);
                }}
              >
                <Plus size={16} /> Add Shift
              </button>
            </section>
            {patterns.length ? (
              <PatternTable
                patterns={patterns}
                onEdit={(item) => {
                  setEditingShift(item);
                  setShiftFormOpen(true);
                }}
                onDelete={deleteShift}
              />
            ) : (
              <div className={styles.emptyWrap}>
                <EmptyState
                  title="No shifts configured."
                  description="Create your first shift to get started."
                  actionLabel="Add Shift"
                  onAction={() => setShiftFormOpen(true)}
                />
              </div>
            )}
          </>
        )}

        {tab === 'calendar' && (
          <>
            <div className={styles.calendarFilter}>
              <label className={styles.fieldLabel}>Calendar Date</label>
              <input
                className={styles.input}
                type="date"
                value={selectedDate}
                onChange={(event) => setSelectedDate(event.target.value)}
              />
            </div>
            <CalendarView
              roster={roster}
              selectedDate={selectedDate}
              setSelectedDate={setSelectedDate}
            />
          </>
        )}

        {tab !== 'calendar' && <SummarySections stats={stats} roster={roster} />}

        <DetailsDrawer
          record={details}
          onClose={() => setDetails(null)}
          onEdit={(row) => {
            setDetails(null);
            setEditingRoster(row);
            setAssignOpen(true);
          }}
          onChange={(row) => {
            setDetails(null);
            setChangingRoster(row);
          }}
        />

        <ShiftForm
          key={`shift-${shiftFormOpen}-${editingShift?.id || editingShift?._id || 'new'}`}
          open={shiftFormOpen}
          editing={editingShift}
          onClose={() => {
            setShiftFormOpen(false);
            setEditingShift(null);
          }}
          onSave={saveShift}
        />

        <AssignModal
          key={`assignment-${assignOpen}-${editingRoster?.id || editingRoster?._id || 'new'}`}
          open={assignOpen}
          editing={editingRoster}
          patterns={patterns}
          employees={employees}
          clients={clients}
          sites={sites}
          onClose={() => {
            setAssignOpen(false);
            setEditingRoster(null);
          }}
          onSave={saveAssignment}
        />

        <ChangeShiftModal
          record={changingRoster}
          patterns={patterns}
          onClose={() => setChangingRoster(null)}
          onSave={changeShift}
        />

        <UnassignModal
          record={unassigning}
          onClose={() => setUnassigning(null)}
          onConfirm={confirmUnassign}
        />

        <ExportModal
          open={exportOpen}
          onClose={() => setExportOpen(false)}
          onExport={exportRoster}
          clients={clients}
          sites={sites}
          departments={departments}
          patterns={patterns}
        />
      </div>
    </AdminLayout>
  );
}

export default ShiftManagement;
