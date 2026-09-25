import { useEffect, useMemo, useState } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
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
  X
} from 'lucide-react';
import AdminLayout from '../../components/layout/AdminLayout';
import EmptyState from '../../components/common/EmptyState';
import Pagination from '../../components/common/Pagination';
import StatusBadge from '../../components/common/StatusBadge';
import Toast from '../../components/common/Toast';
import { mockCompanies } from '../../data/companyData';
import { mockEmployees, mockDepartments } from '../../data/employeeData';
import { mockShiftPatterns, shiftDepartments, shiftSites } from '../../data/shiftData';
import { mockShiftRoster, mockUnassignedEmployees } from '../../data/shiftRosterData';
import styles from './ShiftManagement.module.css';

const ROSTER_KEY = 'novaspark_shift_roster';
const PATTERNS_KEY = 'novaspark_shift_patterns';
const PAGE_SIZE = 10;
const DEFAULT_DATE = '2026-08-24';

const formatDate = (value) => {
  if (!value) return '—';
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }).format(new Date(`${value}T00:00:00`));
};

const displayType = (type) => {
  if (type === 'rotational') return 'Rotational';
  if (type === 'night') return 'Night';
  return 'Day';
};

const displayTime = (value) => {
  if (!value) return 'Variable';
  const [hours, minutes] = value.split(':').map(Number);
  const suffix = hours >= 12 ? 'PM' : 'AM';
  const hour = hours % 12 || 12;
  return `${String(hour).padStart(2, '0')}:${String(minutes).padStart(2, '0')} ${suffix}`;
};

const timeRange = (item) => {
  return item.startTime
    ? `${displayTime(item.startTime)} - ${displayTime(item.endTime)}`
    : 'Variable';
};

function SummaryCards({ roster, patterns }) {
  const assignedEmployees = new Set(
    roster.filter((item) => item.status !== 'unassigned').map((item) => item.employeeId)
  ).size;

  const cards = [
    { label: 'Total Shifts', value: patterns.length + 7, icon: Layers3, tone: styles.blue },
    {
      label: 'Active Shifts',
      value: patterns.filter((item) => item.status === 'active').length + 4,
      icon: CircleCheck,
      tone: styles.green
    },
    { label: 'Employees Assigned', value: '1,184', icon: Users, tone: styles.purple },
    {
      label: 'Unassigned Employees',
      value: Math.max(66, mockUnassignedEmployees.length + (1184 - assignedEmployees)),
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

function PatternSummary({ patterns }) {
  const counts = ['day', 'night', 'rotational'].map((type) => ({
    type,
    count: patterns.filter((item) => item.type === type).length
  }));

  return (
    <section className={styles.patternSummary}>
      <div className={styles.sectionHeader}>
        <div>
          <h2 className={styles.sectionTitle}>Shift Patterns</h2>
          <p className={styles.sectionSubtext}>Configured workforce patterns</p>
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

function Filters({ values, setValue, onReset, patterns }) {
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
          mockCompanies.map((item) => ({ value: item.name, label: item.name })),
          'All Clients'
        )}
        {field('Site', 'site', shiftSites, 'All Sites')}
        {field(
          'Department',
          'department',
          [...new Set([...shiftDepartments, ...mockDepartments])],
          'All Departments'
        )}
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
  const [menu, setMenu] = useState(null);

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
              <tr key={row.id}>
                <td>
                  <div className={styles.employeeCell}>
                    <span className={styles.avatar}>{row.initials}</span>
                    <strong>{row.employeeName}</strong>
                  </div>
                </td>
                <td className={styles.muted}>{row.employeeId}</td>
                <td>{row.clientName}</td>
                <td>{row.site}</td>
                <td>{row.department}</td>
                <td className={styles.shiftName}>{row.shiftName}</td>
                <td>
                  <span
                    className={`${styles.typeBadge} ${
                      styles[row.shiftType || 'unassigned']
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
                <td className={styles.actionCell}>
                  <button
                    type="button"
                    className={styles.iconButton}
                    aria-label="Open shift actions"
                    onClick={() => setMenu(menu === row.id ? null : row.id)}
                  >
                    <MoreVertical size={17} />
                  </button>
                  {menu === row.id && (
                    <div className={styles.actionMenu}>
                      <button
                        type="button"
                        onClick={() => {
                          onView(row);
                          setMenu(null);
                        }}
                      >
                        View Details
                      </button>
                      {row.status === 'unassigned' ? (
                        <button
                          type="button"
                          onClick={() => {
                            onAssign(row);
                            setMenu(null);
                          }}
                        >
                          Assign Shift
                        </button>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              onEdit(row);
                              setMenu(null);
                            }}
                          >
                            Edit Roster
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              onChange(row);
                              setMenu(null);
                            }}
                          >
                            Change Shift
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              onUnassign(row);
                              setMenu(null);
                            }}
                          >
                            Unassign Employee
                          </button>
                        </>
                      )}
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

function DetailsDrawer({ record, onClose, onEdit, onChange }) {
  if (!record) return null;

  const detailFields = [
    ['Client', record.clientName],
    ['Site', record.site],
    ['Department', record.department],
    ['Shift', record.shiftName],
    ['Shift Type', record.shiftType ? displayType(record.shiftType) : 'Unassigned'],
    ['Shift Start Date', formatDate(record.startDate || record.date)],
    ...(record.endDate && record.endDate !== (record.startDate || record.date)
      ? [['Shift End Date', formatDate(record.endDate)]]
      : record.endDate
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
        id: editing?.id || Date.now()
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
            placeholder="Enter shift name"
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
        <FormField label="Grace Period">
          <input
            className={styles.input}
            type="number"
            min="0"
            value={form.gracePeriod}
            onChange={(event) => update('gracePeriod', event.target.value)}
          />
        </FormField>
        <FormField label="Break Duration">
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

function AssignModal({ open, editing, patterns, onClose, onSave }) {
  const initialEmployee = editing?.employeeId
    ? mockEmployees.find((item) => item.employeeId === editing.employeeId)
    : null;

  const empty = {
    clientName: editing?.clientName || initialEmployee?.companyName || '',
    employeeId: editing?.employeeId || '',
    site: editing?.site || initialEmployee?.siteLocation || '',
    shiftId: editing?.shiftId ? String(editing.shiftId) : '',
    startDate: editing?.startDate || editing?.date || DEFAULT_DATE,
    endDate: editing?.endDate || editing?.date || DEFAULT_DATE,
    date: editing?.date || editing?.startDate || DEFAULT_DATE
  };

  const [form, setForm] = useState(empty);
  const [errors, setErrors] = useState({});

  if (!open) return null;

  const employee = mockEmployees.find((item) => item.employeeId === form.employeeId);

  // Filter employees belonging to the selected client
  const availableEmployees = form.clientName
    ? mockEmployees.filter(
        (item) =>
          item.companyName === form.clientName ||
          item.companyId === form.clientName
      )
    : [];

  const handleClientChange = (clientName) => {
    setForm((current) => {
      const empBelongs = mockEmployees.some(
        (item) =>
          item.employeeId === current.employeeId &&
          (item.companyName === clientName || item.companyId === clientName)
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
    const selectedEmp = mockEmployees.find((item) => item.employeeId === employeeId);
    setForm((current) => ({
      ...current,
      employeeId,
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
    if (!form.clientName) next.clientName = 'Client is required.';
    if (!form.employeeId) next.employeeId = 'Employee is required.';
    if (!form.site) next.site = 'Site is required.';
    if (!form.shiftId) next.shiftId = 'Shift is required.';
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
        shiftId: Number(form.shiftId),
        employee
      });
    }
  };

  return (
    <Modal
      title={editing ? 'Edit Roster' : 'Assign Employee to Shift'}
      onClose={onClose}
    >
      <div className={styles.formGrid}>
        {/* 1. Client Select */}
        <FormField label="Client" error={errors.clientName}>
          <select
            className={styles.select}
            value={form.clientName}
            onChange={(event) => handleClientChange(event.target.value)}
            disabled={Boolean(editing)}
          >
            <option value="">Select client</option>
            {mockCompanies.map((item) => (
              <option key={item.id} value={item.name}>
                {item.name}
              </option>
            ))}
          </select>
        </FormField>

        {/* 2. Employee Select (Filtered by Client) */}
        <FormField label="Employee" error={errors.employeeId}>
          <select
            className={styles.select}
            value={form.employeeId}
            onChange={(event) => handleEmployeeChange(event.target.value)}
            disabled={Boolean(editing) || !form.clientName}
          >
            <option value="">
              {form.clientName ? 'Select employee' : 'Select client first'}
            </option>
            {availableEmployees.map((item) => (
              <option key={item.employeeId} value={item.employeeId}>
                {item.name} — {item.employeeId}
              </option>
            ))}
          </select>
        </FormField>

        {/* 3. Site */}
        <FormField label="Site" error={errors.site}>
          <select
            className={styles.select}
            value={form.site}
            onChange={(event) => update('site', event.target.value)}
          >
            <option value="">Select site</option>
            {shiftSites.map((site) => (
              <option key={site} value={site}>{site}</option>
            ))}
          </select>
        </FormField>

        {/* 4. Department */}
        <FormField label="Department">
          <input
            className={styles.input}
            readOnly
            value={employee?.department || ''}
            placeholder={form.employeeId ? '' : 'Auto-filled from employee'}
          />
        </FormField>

        {/* 5. Shift */}
        <FormField label="Shift" error={errors.shiftId}>
          <select
            className={styles.select}
            value={form.shiftId}
            onChange={(event) => update('shiftId', event.target.value)}
          >
            <option value="">Select shift</option>
            {patterns.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name} — {timeRange(item)}
              </option>
            ))}
          </select>
        </FormField>

        {/* Empty placeholder to keep next fields on aligned row if needed */}
        <div style={{ display: 'none' }} />

        {/* 6. Shift Start Date */}
        <FormField label="Shift Start Date" error={errors.startDate || errors.date}>
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
        <FormField label="Shift End Date" error={errors.endDate}>
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
  const [date, setDate] = useState(record?.date || DEFAULT_DATE);

  if (!record) return null;

  return (
    <Modal title="Change Shift" onClose={onClose}>
      <div className={styles.changeSummary}>
        <span>Employee</span>
        <strong>{record.employeeName}</strong>
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
            <option value="">Select shift</option>
            {patterns.map((item) => (
              <option key={item.id} value={item.id}>
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
        onSave={() => onSave({ shiftId: Number(shiftId), date })}
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

function PatternTable({ patterns, onEdit }) {
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
              <th>Employees</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {patterns.map((item) => (
              <tr key={item.id}>
                <td className={styles.shiftName}>{item.name}</td>
                <td>
                  <span className={`${styles.typeBadge} ${styles[item.type]}`}>
                    {displayType(item.type)}
                  </span>
                </td>
                <td>{displayTime(item.startTime)}</td>
                <td>{displayTime(item.endTime)}</td>
                <td>{item.breakDuration} min</td>
                <td>{item.gracePeriod} min</td>
                <td>{Math.round(250 + item.id * 37)} Employees</td>
                <td>
                  <StatusBadge status={item.status}>{item.status}</StatusBadge>
                </td>
                <td>
                  <button
                    type="button"
                    className={styles.smallAction}
                    onClick={() => onEdit(item)}
                  >
                    Edit Shift
                  </button>
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
  const [month, setMonth] = useState(new Date('2026-08-01T00:00:00'));
  const [view, setView] = useState('month');
  const [dayRecords, setDayRecords] = useState(null);

  const firstDay = (month.getDay() + 6) % 7;
  const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();

  const recordsByDate = useMemo(
    () =>
      roster.reduce((map, item) => {
        (map[item.date] ||= []).push(item);
        return map;
      }, {}),
    [roster]
  );

  const shiftCounts = (date) =>
    Object.values(
      (recordsByDate[date] || []).reduce((map, item) => {
        map[item.shiftName] = (map[item.shiftName] || 0) + 1;
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
          label="Week of 24 Aug 2026"
          onPrevious={() => setSelectedDate('2026-08-23')}
          onNext={() => setSelectedDate('2026-08-30')}
          onToday={() => setSelectedDate(DEFAULT_DATE)}
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
        onToday={() => setMonth(new Date('2026-08-01T00:00:00'))}
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
              className={`${styles.calendarDay} ${
                date === selectedDate ? styles.selectedDay : ''
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
                  className={`${styles.dayIndicator} ${
                    styles[`indicator${countIndex}`]
                  }`}
                  key={`${date}-${countIndex}`}
                >
                  {count} employees
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
  ].slice(0, 10);

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
                    className={`${styles.weekBadge} ${
                      styles[
                        dayIndex === 6 || (employeeIndex + dayIndex) % 7 === 2
                          ? 'off'
                          : employee.shiftType
                      ]
                    }`}
                  >
                    {dayIndex === 6 || (employeeIndex + dayIndex) % 7 === 2
                      ? 'Off'
                      : employee.shiftName.replace(' Shift', '')}
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
      (map[item.shiftName] ||= []).push(item);
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
          {groups.map(([name, items]) => (
            <div className={styles.dayGroup} key={name}>
              <div>
                <strong>{name}</strong>
                <span>{items.length} Employees</span>
              </div>
              <span className={styles.muted}>{timeRange(items[0])}</span>
              {items.slice(0, 5).map((item) => (
                <p key={item.id}>
                  {item.initials} {item.employeeName}
                </p>
              ))}
            </div>
          ))}
        </div>
      </aside>
    </>
  );
}

function SummarySections({ roster }) {
  const siteRows = shiftSites.map((site) => ({
    site,
    day: roster.filter((item) => item.site === site && item.shiftType === 'day').length + 40,
    night: roster.filter((item) => item.site === site && item.shiftType === 'night').length + 24,
    rotational:
      roster.filter((item) => item.site === site && item.shiftType === 'rotational').length + 8
  }));

  const clientRows = mockCompanies.slice(0, 3).map((client, index) => ({
    name: client.name,
    employees: [520, 380, 284][index],
    shifts: [5, 4, 3][index]
  }));

  return (
    <div className={styles.summarySections}>
      <section className={styles.summaryBlock}>
        <h2 className={styles.sectionTitle}>Shift Distribution by Site</h2>
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
            {siteRows.map((row) => (
              <tr key={row.site}>
                <td>{row.site}</td>
                <td>{row.day}</td>
                <td>{row.night}</td>
                <td>{row.rotational}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className={styles.summaryBlock}>
        <h2 className={styles.sectionTitle}>Shift Summary by Client</h2>
        <table className={styles.summaryTable}>
          <thead>
            <tr>
              <th>Client</th>
              <th>Employees</th>
              <th>Active Shifts</th>
            </tr>
          </thead>
          <tbody>
            {clientRows.map((row) => (
              <tr key={row.name}>
                <td>{row.name}</td>
                <td>{row.employees}</td>
                <td>{row.shifts}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}

function ExportModal({ open, onClose, onExport }) {
  const [form, setForm] = useState({
    fromDate: DEFAULT_DATE,
    toDate: DEFAULT_DATE,
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
            {mockCompanies.map((item) => (
              <option key={item.id}>{item.name}</option>
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
            {shiftSites.map((item) => (
              <option key={item}>{item}</option>
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
            {shiftDepartments.map((item) => (
              <option key={item}>{item}</option>
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
            {mockShiftPatterns.map((item) => (
              <option key={item.id}>{item.name}</option>
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
  const [patterns, setPatterns] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(PATTERNS_KEY)) || mockShiftPatterns;
    } catch {
      return mockShiftPatterns;
    }
  });

  const [roster, setRoster] = useState(() => {
    try {
      return (
        JSON.parse(localStorage.getItem(ROSTER_KEY)) || [
          ...mockShiftRoster,
          ...mockUnassignedEmployees
        ]
      );
    } catch {
      return [...mockShiftRoster, ...mockUnassignedEmployees];
    }
  });

  const location = useLocation();
  const [searchParams] = useSearchParams();
  const isFromOrgSettings = location.state?.fromOrganisationSettings === true;

  const [tab, setTab] = useState(() => searchParams.get('tab') || 'roster');

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam) {
      setTab(tabParam);
    } else {
      setTab('roster');
    }
  }, [searchParams]);
  const [selectedDate, setSelectedDate] = useState(DEFAULT_DATE);
  const [filters, setFilters] = useState({
    search: '',
    client: '',
    site: '',
    department: '',
    shift: '',
    shiftType: '',
    status: '',
    date: DEFAULT_DATE
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

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 350);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    localStorage.setItem(PATTERNS_KEY, JSON.stringify(patterns));
  }, [patterns]);

  useEffect(() => {
    localStorage.setItem(ROSTER_KEY, JSON.stringify(roster));
  }, [roster]);

  const notify = (message, type = 'success') => setToast({ message, type });

  const setFilter = (key, value) => {
    setPage(1);
    setFilters((current) => ({ ...current, [key]: value }));
  };

  const filteredRoster = useMemo(() => {
    return roster.filter((item) => {
      const query = filters.search.toLowerCase().trim();
      if (
        query &&
        !item.employeeName.toLowerCase().includes(query) &&
        !item.employeeId.toLowerCase().includes(query)
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
      date: DEFAULT_DATE
    });
  };

  const saveShift = (data) => {
    if (
      patterns.some(
        (item) =>
          item.name.toLowerCase() === data.name.toLowerCase() && item.id !== data.id
      )
    ) {
      notify('A shift with this name already exists.', 'danger');
      return;
    }

    setPatterns((current) =>
      data.id && current.some((item) => item.id === data.id)
        ? current.map((item) => (item.id === data.id ? data : item))
        : [...current, data]
    );

    setShiftFormOpen(false);
    setEditingShift(null);
    notify(
      data.id && mockShiftPatterns.some((item) => item.id === data.id)
        ? '✓ Shift updated successfully.'
        : '✓ Shift created successfully.'
    );
  };

  const saveAssignment = (data) => {
    if (
      roster.some(
        (item) =>
          item.employeeId === data.employeeId &&
          item.date === data.date &&
          item.id !== editingRoster?.id
      )
    ) {
      notify('This employee already has a shift assigned for this date.', 'danger');
      return;
    }

    const shift = patterns.find((item) => item.id === data.shiftId);
    const next = {
      id: editingRoster?.id || Date.now(),
      employeeId: data.employeeId,
      employeeName: data.employee?.name || data.employeeName,
      initials: data.employee?.initials || 'UN',
      clientId: data.employee?.companyId || data.clientId,
      clientName: data.employee?.companyName || data.clientName,
      site: data.site,
      department: data.employee?.department || data.department,
      shiftId: shift.id,
      shiftName: shift.name,
      shiftType: shift.type,
      date: data.startDate || data.date,
      startDate: data.startDate || data.date,
      endDate: data.endDate || data.startDate || data.date,
      startTime: shift.startTime,
      endTime: shift.endTime,
      status: 'active'
    };

    setRoster((current) =>
      editingRoster
        ? current.map((item) => (item.id === editingRoster.id ? next : item))
        : [next, ...current]
    );

    setAssignOpen(false);
    setEditingRoster(null);
    setDetails(null);
    notify(
      editingRoster
        ? '✓ Roster updated successfully.'
        : '✓ Employee assigned to shift successfully.'
    );
  };

  const changeShift = (data) => {
    const shift = patterns.find((item) => item.id === data.shiftId);
    setRoster((current) =>
      current.map((item) =>
        item.id === changingRoster.id
          ? {
              ...item,
              shiftId: shift.id,
              shiftName: shift.name,
              shiftType: shift.type,
              startTime: shift.startTime,
              endTime: shift.endTime,
              date: data.date
            }
          : item
      )
    );
    setChangingRoster(null);
    setDetails(null);
    notify('✓ Shift changed successfully.');
  };

  const confirmUnassign = () => {
    setRoster((current) =>
      current.map((item) =>
        item.id === unassigning.id
          ? {
              ...item,
              shiftId: null,
              shiftName: 'Unassigned',
              shiftType: null,
              startTime: null,
              endTime: null,
              status: 'unassigned'
            }
          : item
      )
    );
    setUnassigning(null);
    setDetails(null);
    notify('✓ Employee unassigned successfully.');
  };

  const exportRoster = (data) => {
    if (data.fromDate > data.toDate) {
      notify('Start date cannot be later than end date.', 'danger');
      return;
    }
    setExportOpen(false);
    notify('Preparing shift roster...');
    setTimeout(() => notify('✓ Shift roster exported successfully.'), 500);
  };

  const openCalendar = () => {
    setPage(1);
    setTab('calendar');
    setSelectedDate(filters.date);
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
            <p>Create shifts, assign employees and manage workforce rosters.</p>
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

        {loading ? (
          <div className={styles.loadingGrid}>
            {[1, 2, 3, 4].map((item) => (
              <div className={styles.loadingCard} key={item} />
            ))}
          </div>
        ) : (
          <SummaryCards roster={roster} patterns={patterns} />
        )}

        <PatternSummary patterns={patterns} />

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
                  description="Try changing your filters or date."
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
                  <span>66 employees currently have no shift assignment.</span>
                </div>
                <button
                  type="button"
                  onClick={() => setFilter('status', 'unassigned')}
                >
                  View Employees
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

        {tab !== 'calendar' && <SummarySections roster={roster} />}

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
          key={`shift-${shiftFormOpen}-${editingShift?.id || 'new'}`}
          open={shiftFormOpen}
          editing={editingShift}
          onClose={() => {
            setShiftFormOpen(false);
            setEditingShift(null);
          }}
          onSave={saveShift}
        />

        <AssignModal
          key={`assignment-${assignOpen}-${editingRoster?.id || 'new'}`}
          open={assignOpen}
          editing={editingRoster}
          patterns={patterns}
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
        />
      </div>
    </AdminLayout>
  );
}

export default ShiftManagement;
