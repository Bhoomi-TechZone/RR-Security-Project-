import { useMemo, useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  BadgeIndianRupee,
  Clock3,
  FileText,
  MoreVertical,
  Plus,
  Search,
  WalletCards,
  X
} from 'lucide-react';
import AdminLayout from '../../components/layout/AdminLayout';
import EmptyState from '../../components/common/EmptyState';
import Pagination from '../../components/common/Pagination';
import Toast from '../../components/common/Toast';
import { mockCompanies } from '../../data/companyData';
import { mockEmployees } from '../../data/employeeData';
import { mockAdvanceLoanRequests } from '../../data/advanceLoanData';
import { mockDeductionSchedules } from '../../data/deductionData';
import { mockDeductionHistory } from '../../data/deductionHistoryData';
import styles from './AdvanceLoanManagement.module.css';

const REQUEST_KEY = 'novaspark_advance_loan_requests';
const SCHEDULE_KEY = 'novaspark_deduction_schedules';
const HISTORY_KEY = 'novaspark_deduction_history';
const PAGE_SIZE = 8;
const DEFAULT_FROM = '2026-08-01';
const DEFAULT_TO = '2026-08-24';

const money = (value) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(Number(value || 0));

const dateLabel = (value) =>
  value
    ? new Intl.DateTimeFormat('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      }).format(new Date(`${value}T00:00:00`))
    : '—';

const typeLabel = (value) => (value === 'loan' ? 'Loan' : 'Advance');

const statusLabel = (value) =>
  ({
    pending: 'Pending',
    approved: 'Approved',
    rejected: 'Rejected',
    completed: 'Completed',
    active: 'Active',
    paused: 'Paused',
    deducted: 'Deducted'
  }[value] || value);

const typeClass = (value) => (value === 'loan' ? styles.loan : styles.advance);
const statusClass = (value) => styles[value] || styles.pending;

function SummaryCards({ requests }) {
  const total = requests.length;
  const pending = requests.filter((item) => item.status === 'pending').length;
  const approved = requests
    .filter((item) => ['approved', 'completed'].includes(item.status))
    .reduce((sum, item) => sum + item.approvedAmount, 0);
  const outstanding = requests
    .filter((item) => ['approved', 'completed'].includes(item.status))
    .reduce((sum, item) => sum + item.remainingAmount, 0);

  const cards = [
    { label: 'Total Requests', value: total, icon: FileText, tone: styles.blue },
    { label: 'Pending Approval', value: pending, icon: Clock3, tone: styles.yellow },
    { label: 'Approved Amount', value: money(approved), icon: BadgeIndianRupee, tone: styles.green },
    { label: 'Outstanding Amount', value: money(outstanding), icon: WalletCards, tone: styles.purple }
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

function Overview({ requests }) {
  const totals = ['advance', 'loan'].map((type) => {
    const list = requests.filter((item) => item.type === type);
    return {
      type,
      count: list.length,
      amount: list.reduce((sum, item) => sum + item.amount, 0)
    };
  });
  const states = ['approved', 'pending', 'rejected'];

  return (
    <section className={styles.overviewCard}>
      <div className={styles.sectionHeader}>
        <div>
          <h2 className={styles.sectionTitle}>Advance &amp; Loan Overview</h2>
          <p className={styles.sectionSubtext}>Requests and approval distribution</p>
        </div>
      </div>
      <div className={styles.overviewGrid}>
        {totals.map((item) => (
          <div className={styles.overviewTile} key={item.type}>
            <span className={`${styles.typeBadge} ${typeClass(item.type)}`}>
              {typeLabel(item.type)}
            </span>
            <strong>{item.count} Requests</strong>
            <span>{money(item.amount)}</span>
          </div>
        ))}
        <div className={styles.statusSummary}>
          {states.map((state) => (
            <span key={state}>
              <i className={`${styles.statusDot} ${statusClass(state)}`} />
              {statusLabel(state)}{' '}
              <strong>
                {requests.filter((item) => item.status === state).length}
              </strong>
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

function Filters({ values, setValue, reset }) {
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
              placeholder="Search employee, employee ID or request ID..."
            />
          </div>
        </div>

        {field(
          'Request Type',
          'type',
          [
            { value: 'advance', label: 'Advance' },
            { value: 'loan', label: 'Loan' }
          ],
          'All Types'
        )}

        {field(
          'Client',
          'client',
          mockCompanies.map((item) => item.name),
          'All Clients'
        )}

        {field(
          'Employee',
          'employee',
          mockEmployees.map((item) => ({
            value: item.employeeId,
            label: `${item.name} — ${item.employeeId}`
          })),
          'All Employees'
        )}

        {field(
          'Approval Status',
          'status',
          [
            { value: 'pending', label: 'Pending' },
            { value: 'approved', label: 'Approved' },
            { value: 'rejected', label: 'Rejected' },
            { value: 'completed', label: 'Completed' }
          ],
          'All Status'
        )}

        <div className={styles.field}>
          <label className={styles.fieldLabel}>From Date</label>
          <input
            className={styles.input}
            type="date"
            value={values.fromDate}
            onChange={(event) => setValue('fromDate', event.target.value)}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.fieldLabel}>To Date</label>
          <input
            className={styles.input}
            type="date"
            value={values.toDate}
            onChange={(event) => setValue('toDate', event.target.value)}
          />
        </div>

        <button type="button" className={styles.resetButton} onClick={reset}>
          Reset Filters
        </button>
      </div>
    </div>
  );
}

function RequestTable({
  rows,
  onView,
  onApprove,
  onReject,
  onEdit,
  onSchedule,
  onHistory
}) {
  const [menu, setMenu] = useState(null);

  return (
    <div className={styles.tableCard}>
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Request ID</th>
              <th>Employee</th>
              <th>Client</th>
              <th>Type</th>
              <th>Amount</th>
              <th>Reason</th>
              <th>Request Date</th>
              <th>EMI / Deduction</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td className={styles.muted}>{row.requestId}</td>
                <td>
                  <div className={styles.employeeCell}>
                    <span className={styles.avatar}>{row.initials}</span>
                    <div>
                      <strong>{row.employeeName}</strong>
                      <small>{row.employeeId}</small>
                    </div>
                  </div>
                </td>
                <td>{row.clientName}</td>
                <td>
                  <span className={`${styles.typeBadge} ${typeClass(row.type)}`}>
                    {typeLabel(row.type)}
                  </span>
                </td>
                <td className={styles.amount}>{money(row.amount)}</td>
                <td className={styles.reason} title={row.reason}>
                  {row.reason}
                </td>
                <td>{dateLabel(row.requestDate)}</td>
                <td>
                  {row.deductionMethod === 'salary-adjustment'
                    ? 'Salary Adjustment'
                    : `${money(row.emiAmount)} × ${row.numberOfMonths}`}
                </td>
                <td>
                  <span
                    className={`${styles.statusBadge} ${statusClass(row.status)}`}
                  >
                    {statusLabel(row.status)}
                  </span>
                </td>
                <td className={styles.actionCell}>
                  <button
                    type="button"
                    className={styles.iconButton}
                    aria-label="Open request actions"
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
                      {row.status === 'pending' && (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              onApprove(row);
                              setMenu(null);
                            }}
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              onReject(row);
                              setMenu(null);
                            }}
                          >
                            Reject
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              onEdit(row);
                              setMenu(null);
                            }}
                          >
                            Edit Request
                          </button>
                        </>
                      )}
                      {['approved', 'completed'].includes(row.status) && (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              onSchedule(row);
                              setMenu(null);
                            }}
                          >
                            View Deduction Schedule
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              onHistory(row);
                              setMenu(null);
                            }}
                          >
                            View Deduction History
                          </button>
                        </>
                      )}
                      {row.status === 'rejected' && (
                        <button
                          type="button"
                          onClick={() => {
                            onView(row);
                            setMenu(null);
                          }}
                        >
                          View Rejection Reason
                        </button>
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

function Modal({ title, onClose, children }) {
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

function FormField({ label, error, children, full = false }) {
  return (
    <div className={`${styles.formField} ${full ? styles.full : ''}`}>
      <label className={styles.fieldLabel}>{label}</label>
      {children}
      {error && <span className={styles.error}>{error}</span>}
    </div>
  );
}

function ModalActions({ close, save, label }) {
  return (
    <div className={styles.modalActions}>
      <button type="button" className={styles.secondaryButton} onClick={close}>
        Cancel
      </button>
      <button type="button" className={styles.primaryButton} onClick={save}>
        {label}
      </button>
    </div>
  );
}

function RequestForm({ request, onClose, onSave }) {
  const reqType = request?.type || 'advance';
  const isEditing = Boolean(request?.id);

  const calculateEmi = (amt, rateVal, numMonths) => {
    const p = Number(amt || 0);
    const r = reqType === 'loan' ? Number(rateVal || 0) : 0;
    const n = Math.max(1, Number(numMonths || 1));
    if (p <= 0) return '';
    const interest = Math.round((p * r * (n / 12)) / 100);
    const total = p + interest;
    return Math.ceil(total / n);
  };

  const initialAmount = isEditing ? request.amount : '';
  const initialRate = isEditing ? (request.interestRate ?? 0) : (reqType === 'loan' ? 0 : '');
  const initialMonths = isEditing ? (request.numberOfMonths || 1) : (reqType === 'loan' ? 6 : 1);
  const initialEmi = isEditing
    ? request.emiAmount
    : reqType === 'loan' && initialAmount
    ? calculateEmi(initialAmount, initialRate, initialMonths)
    : '';

  const [form, setForm] = useState(
    isEditing
      ? { ...request }
      : {
          employeeId: '',
          type: reqType,
          amount: initialAmount,
          interestRate: initialRate,
          reason: 'Emergency',
          otherReason: '',
          deductionMethod: reqType === 'loan' ? 'monthly-emi' : 'salary-adjustment',
          emiAmount: initialEmi,
          numberOfMonths: initialMonths,
          firstDeductionMonth: '2026-09',
          adjustmentMonth: '2026-09',
          remarks: ''
        }
  );

  const [errors, setErrors] = useState({});
  const employee = mockEmployees.find((item) => item.employeeId === form.employeeId);

  const update = (key, value) => {
    setForm((current) => {
      const next = { ...current, [key]: value };
      if (['amount', 'interestRate', 'numberOfMonths', 'deductionMethod'].includes(key)) {
        if (next.deductionMethod === 'monthly-emi') {
          const newAmt = key === 'amount' ? value : next.amount;
          const newRate = key === 'interestRate' ? value : next.interestRate;
          const newMonths = key === 'numberOfMonths' ? value : next.numberOfMonths;
          next.emiAmount = calculateEmi(newAmt, newRate, newMonths);
        }
      }
      return next;
    });
  };

  const save = () => {
    const next = {};
    const autoEmi = calculateEmi(form.amount, form.interestRate, form.numberOfMonths);
    const effectiveEmi = Number(form.emiAmount || autoEmi || 0);

    if (!form.employeeId) next.employeeId = 'Employee is required.';
    if (Number(form.amount) <= 0) next.amount = 'Amount must be greater than ₹0.';
    if (reqType === 'loan' && (form.interestRate === '' || Number(form.interestRate) < 0)) {
      next.interestRate = 'Valid interest rate is required.';
    }
    if (!form.reason) next.reason = 'Reason is required.';
    if (form.reason === 'Other' && !form.otherReason?.trim()) {
      next.otherReason = 'Specify reason is required.';
    }
    if (!form.deductionMethod) {
      next.deductionMethod = 'Deduction method is required.';
    }
    if (form.deductionMethod === 'monthly-emi' && effectiveEmi <= 0) {
      next.emiAmount = 'EMI amount is required.';
    }
    if (form.deductionMethod === 'monthly-emi' && Number(form.numberOfMonths) <= 0) {
      next.numberOfMonths = 'Number of months is required.';
    }
    if (!form.firstDeductionMonth && form.deductionMethod === 'monthly-emi') {
      next.firstDeductionMonth = 'First deduction month is required.';
    }
    setErrors(next);
    if (!Object.keys(next).length) {
      onSave({
        ...form,
        type: reqType,
        employee,
        amount: Number(form.amount),
        interestRate: reqType === 'loan' ? Number(form.interestRate || 0) : undefined,
        emiAmount:
          form.deductionMethod === 'monthly-emi'
            ? effectiveEmi
            : Number(form.amount),
        numberOfMonths:
          form.deductionMethod === 'monthly-emi'
            ? Number(form.numberOfMonths)
            : 1,
        reason: form.reason === 'Other' ? form.otherReason.trim() : form.reason
      });
    }
  };

  const principal = Number(form.amount || 0);
  const rate = reqType === 'loan' ? Number(form.interestRate || 0) : 0;
  const months = form.deductionMethod === 'monthly-emi' ? Math.max(1, Number(form.numberOfMonths || 1)) : 1;
  const totalInterest = Math.round((principal * rate * (months / 12)) / 100);
  const currentEmi = form.deductionMethod === 'monthly-emi'
    ? Number(form.emiAmount || calculateEmi(form.amount, form.interestRate, form.numberOfMonths) || 0)
    : principal;
  const totalDeduction = form.deductionMethod === 'monthly-emi'
    ? (currentEmi * months)
    : principal;

  return (
    <Modal
      title={isEditing ? `Edit ${typeLabel(reqType)} Request` : `${typeLabel(reqType)} Request`}
      onClose={onClose}
    >
      <div className={styles.formGrid}>
        <FormField label="Employee" error={errors.employeeId}>
          <select
            className={styles.select}
            value={form.employeeId}
            onChange={(event) => update('employeeId', event.target.value)}
          >
            <option value="">Select Employee</option>
            {mockEmployees.map((item) => (
              <option key={item.employeeId} value={item.employeeId}>
                {item.name} — {item.employeeId}
              </option>
            ))}
          </select>
        </FormField>

        <FormField label="Client">
          <input
            className={styles.input}
            readOnly
            value={employee?.companyName || request?.clientName || ''}
            placeholder={form.employeeId ? '' : 'Auto-filled from employee'}
          />
        </FormField>

        <FormField label="Department">
          <input
            className={styles.input}
            readOnly
            value={employee?.department || request?.department || ''}
            placeholder={form.employeeId ? '' : 'Auto-filled from employee'}
          />
        </FormField>

        <FormField label="Designation">
          <input
            className={styles.input}
            readOnly
            value={employee?.designation || request?.designation || ''}
            placeholder={form.employeeId ? '' : 'Auto-filled from employee'}
          />
        </FormField>

        <FormField label="Current Salary">
          <input
            className={styles.input}
            readOnly
            value={employee ? money(employee.salaryStructure?.basic) : ''}
            placeholder={form.employeeId ? '' : 'Auto-filled from employee'}
          />
        </FormField>

        <FormField label={`${typeLabel(reqType)} Amount`} error={errors.amount}>
          <input
            className={styles.input}
            type="number"
            min="1"
            value={form.amount}
            onChange={(event) => update('amount', event.target.value)}
            placeholder="Enter amount"
          />
        </FormField>

        {reqType === 'loan' && (
          <FormField label="Rate of Interest (%)" error={errors.interestRate}>
            <input
              className={styles.input}
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={form.interestRate ?? ''}
              onChange={(event) => update('interestRate', event.target.value)}
              placeholder="e.g. 0, 5, 8.5"
            />
          </FormField>
        )}

        <FormField label="Reason" error={errors.reason}>
          <select
            className={styles.select}
            value={form.reason}
            onChange={(event) => update('reason', event.target.value)}
          >
            <option>Medical / Personal</option>
            <option>Emergency</option>
            <option>Education</option>
            <option>Family Expense</option>
            <option>Travel</option>
            <option>Personal Loan</option>
            <option>Other</option>
          </select>
        </FormField>

        {form.reason === 'Other' && (
          <FormField label="Specify Reason" error={errors.otherReason}>
            <textarea
              className={styles.textarea}
              value={form.otherReason}
              onChange={(event) => update('otherReason', event.target.value)}
            />
          </FormField>
        )}

        <FormField label="Deduction Method" error={errors.deductionMethod}>
          <select
            className={styles.select}
            value={form.deductionMethod}
            onChange={(event) => update('deductionMethod', event.target.value)}
          >
            <option value="salary-adjustment">Salary Adjustment</option>
            <option value="monthly-emi">Monthly EMI</option>
          </select>
        </FormField>

        {form.deductionMethod === 'salary-adjustment' ? (
          <FormField label="Adjustment Month">
            <input
              className={styles.input}
              type="month"
              value={form.adjustmentMonth}
              onChange={(event) => update('adjustmentMonth', event.target.value)}
            />
          </FormField>
        ) : (
          <>
            <FormField label="EMI Amount" error={errors.emiAmount}>
              <input
                className={styles.input}
                type="number"
                min="1"
                value={form.emiAmount}
                onChange={(event) => update('emiAmount', event.target.value)}
                placeholder="Auto-calculated"
              />
            </FormField>

            <FormField label="Number of Months" error={errors.numberOfMonths}>
              <input
                className={styles.input}
                type="number"
                min="1"
                value={form.numberOfMonths}
                onChange={(event) => update('numberOfMonths', event.target.value)}
              />
            </FormField>

            <FormField
              label="First Deduction Month"
              error={errors.firstDeductionMonth}
            >
              <input
                className={styles.input}
                type="month"
                value={form.firstDeductionMonth}
                onChange={(event) => update('firstDeductionMonth', event.target.value)}
              />
            </FormField>

            <div className={`${styles.preview} ${styles.full}`}>
              <div className={styles.previewGrid}>
                <div>
                  <span>{typeLabel(reqType)} Amount</span>
                  <strong>{money(principal)}</strong>
                </div>
                {reqType === 'loan' && (
                  <div>
                    <span>Interest ({rate}% p.a.)</span>
                    <strong>{money(totalInterest)}</strong>
                  </div>
                )}
                <div>
                  <span>Monthly EMI ({months} {months === 1 ? 'Month' : 'Months'})</span>
                  <strong>{money(currentEmi)}</strong>
                </div>
                <div>
                  <span>Total Deduction</span>
                  <strong>{money(totalDeduction)}</strong>
                </div>
              </div>
            </div>
          </>
        )}

        <FormField label="Remarks" full>
          <textarea
            className={styles.textarea}
            value={form.remarks}
            onChange={(event) => update('remarks', event.target.value)}
            placeholder="Additional remarks..."
          />
        </FormField>
      </div>

      <ModalActions close={onClose} save={save} label={isEditing ? 'Save Changes' : `Submit ${typeLabel(reqType)} Request`} />
    </Modal>
  );
}

function DetailsDrawer({ request, onClose, onApprove, onReject }) {
  if (!request) return null;

  const isLoan = request.type === 'loan';
  const totalInterest = isLoan
    ? Math.round(
        (Number(request.amount || 0) *
          Number(request.interestRate || 0) *
          (Number(request.numberOfMonths || 1) / 12)) /
          100
      )
    : 0;
  const totalPayable = Number(request.amount || 0) + totalInterest;

  const basicFields = [
    ['Client', request.clientName],
    ['Request Type', typeLabel(request.type)],
    [`${typeLabel(request.type)} Principal`, money(request.amount)],
    ...(isLoan && request.interestRate !== undefined && request.interestRate !== null
      ? [
          ['Rate of Interest', `${request.interestRate}% per annum`],
          ['Total Interest', money(totalInterest)],
          ['Total Repayable', money(totalPayable)]
        ]
      : []),
    ['Reason', request.reason],
    ['Request Date', dateLabel(request.requestDate)],
    [
      'Deduction',
      request.deductionMethod === 'salary-adjustment'
        ? 'Salary Adjustment'
        : `${money(request.emiAmount)} × ${request.numberOfMonths} months`
    ]
  ];

  const approvedFields = [
    ['Approved Amount', money(request.approvedAmount)],
    ['Approved Date', dateLabel(request.approvedDate)],
    ['Monthly Deduction', money(request.emiAmount)],
    ['Number of Deductions', request.numberOfMonths],
    ['Remaining Amount', money(request.remainingAmount)]
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
          <h2>Advance / Loan Details</h2>
          <button
            type="button"
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Close details"
          >
            <X size={20} />
          </button>
        </div>

        <div className={styles.drawerBody}>
          <h3>{request.requestId}</h3>
          <p className={styles.muted}>
            {request.employeeName} · {request.employeeId}
          </p>

          {basicFields.map(([label, value]) => (
            <div className={styles.detailRow} key={label}>
              <span>{label}</span>
              <strong>{value}</strong>
            </div>
          ))}

          <div className={styles.detailRow}>
            <span>Approval Status</span>
            <span className={`${styles.statusBadge} ${statusClass(request.status)}`}>
              {statusLabel(request.status)}
            </span>
          </div>

          {request.status === 'rejected' && (
            <div className={styles.rejectionBox}>{request.rejectionReason}</div>
          )}

          {['approved', 'completed'].includes(request.status) && (
            <>
              {approvedFields.map(([label, value]) => (
                <div className={styles.detailRow} key={label}>
                  <span>{label}</span>
                  <strong>{value}</strong>
                </div>
              ))}
            </>
          )}
        </div>

        {request.status === 'pending' && (
          <div className={styles.drawerActions}>
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={() => onReject(request)}
            >
              Reject
            </button>
            <button
              type="button"
              className={styles.primaryButton}
              onClick={() => onApprove(request)}
            >
              Approve
            </button>
          </div>
        )}
      </aside>
    </>
  );
}

function ApproveModal({ request, onClose, onConfirm }) {
  if (!request) return null;

  return (
    <Modal title="Approve Request?" onClose={onClose}>
      <p className={styles.modalText}>
        Are you sure you want to approve <strong>{request.requestId}</strong> for{' '}
        {request.employeeName}?
      </p>
      <div className={styles.confirmBox}>
        <span>Amount</span>
        <strong>{money(request.amount)}</strong>
        <span>Deduction</span>
        <strong>
          {request.deductionMethod === 'salary-adjustment'
            ? 'Salary Adjustment'
            : `${money(request.emiAmount)} × ${request.numberOfMonths}`}
        </strong>
      </div>
      <ModalActions close={onClose} save={onConfirm} label="Approve Request" />
    </Modal>
  );
}

function RejectModal({ request, reason, setReason, onClose, onConfirm }) {
  if (!request) return null;

  return (
    <Modal title="Reject Request" onClose={onClose}>
      <div className={styles.confirmBox}>
        <span>Request ID</span>
        <strong>{request.requestId}</strong>
      </div>
      <label className={styles.fieldLabel}>Rejection Reason</label>
      <textarea
        className={styles.textarea}
        value={reason}
        onChange={(event) => setReason(event.target.value)}
        placeholder="Enter reason..."
      />
      <ModalActions close={onClose} save={onConfirm} label="Reject Request" />
    </Modal>
  );
}

function ScheduleTable({ schedules, onView }) {
  return (
    <div className={styles.tableCard}>
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Employee</th>
              <th>Request ID</th>
              <th>Type</th>
              <th>Approved Amount</th>
              <th>Monthly Deduction</th>
              <th>Total Months</th>
              <th>Paid / Deducted</th>
              <th>Remaining</th>
              <th>Next Deduction</th>
              <th>Status</th>
              <th>Progress</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {schedules.map((item) => {
              const percent = item.approvedAmount
                ? Math.min(
                    100,
                    Math.round((item.deductedAmount / item.approvedAmount) * 100)
                  )
                : 0;

              return (
                <tr key={item.id}>
                  <td>
                    {item.employeeName}
                    <small className={styles.block}>{item.employeeId}</small>
                  </td>
                  <td className={styles.muted}>{item.requestId}</td>
                  <td>
                    <span className={`${styles.typeBadge} ${typeClass(item.type)}`}>
                      {typeLabel(item.type)}
                    </span>
                  </td>
                  <td>{money(item.approvedAmount)}</td>
                  <td>{money(item.monthlyDeduction)}</td>
                  <td>{item.totalMonths}</td>
                  <td>{money(item.deductedAmount)}</td>
                  <td>{money(item.remainingAmount)}</td>
                  <td>Sep 2026</td>
                  <td>
                    <span
                      className={`${styles.statusBadge} ${statusClass(item.status)}`}
                    >
                      {statusLabel(item.status)}
                    </span>
                  </td>
                  <td>
                    <div className={styles.progress}>
                      <span style={{ width: `${percent}%` }} />
                    </div>
                    <small>{percent}%</small>
                  </td>
                  <td>
                    <button
                      type="button"
                      className={styles.smallAction}
                      onClick={() => onView(item)}
                    >
                      View Schedule
                    </button>
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

function HistoryTable({ rows }) {
  return (
    <div className={styles.tableCard}>
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Employee</th>
              <th>Request ID</th>
              <th>Type</th>
              <th>Month</th>
              <th>Deduction Date</th>
              <th>Amount</th>
              <th>Salary Month</th>
              <th>Status</th>
              <th>Remarks</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((item) => (
              <tr key={item.id}>
                <td>
                  {item.employeeName}
                  <small className={styles.block}>{item.employeeId}</small>
                </td>
                <td className={styles.muted}>{item.requestId}</td>
                <td>{typeLabel(item.type)}</td>
                <td>{item.month}</td>
                <td>{dateLabel(item.deductionDate)}</td>
                <td className={styles.amount}>{money(item.amount)}</td>
                <td>{item.salaryMonth}</td>
                <td>
                  <span
                    className={`${styles.statusBadge} ${statusClass(item.status)}`}
                  >
                    {statusLabel(item.status)}
                  </span>
                </td>
                <td>{item.remarks}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ScheduleDrawer({ schedule, onClose }) {
  if (!schedule) return null;

  const months = Array.from({ length: schedule.totalMonths }, (_, index) => ({
    month: `2026-${String(9 + index).padStart(2, '0')}`,
    status:
      index < Math.ceil(schedule.deductedAmount / schedule.monthlyDeduction)
        ? 'Deducted'
        : 'Pending'
  }));

  return (
    <Modal title="Deduction Schedule" onClose={onClose}>
      <div className={styles.scheduleIntro}>
        <strong>{schedule.employeeName}</strong>
        <span>
          {schedule.requestId} · {typeLabel(schedule.type)}
        </span>
        <span>Approved Amount: {money(schedule.approvedAmount)}</span>
        <span>Monthly Deduction: {money(schedule.monthlyDeduction)}</span>
      </div>
      <table className={styles.innerTable}>
        <thead>
          <tr>
            <th>Month</th>
            <th>Amount</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {months.map((item) => (
            <tr key={item.month}>
              <td>{item.month}</td>
              <td>{money(schedule.monthlyDeduction)}</td>
              <td>{item.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Modal>
  );
}

function ExportModal({ onClose, onExport }) {
  const [format, setFormat] = useState('excel');
  const [reportType, setReportType] = useState('requests');

  return (
    <Modal title="Export Advance & Loan Report" onClose={onClose}>
      <div className={styles.formGrid}>
        <FormField label="Report Type">
          <select
            className={styles.select}
            value={reportType}
            onChange={(event) => setReportType(event.target.value)}
          >
            <option value="requests">Advance &amp; Loan Requests</option>
            <option value="approved">Approved Requests</option>
            <option value="schedule">Deduction Schedule</option>
            <option value="history">Deduction History</option>
            <option value="outstanding">Outstanding Amount</option>
          </select>
        </FormField>

        <FormField label="From Date">
          <input className={styles.input} type="date" defaultValue={DEFAULT_FROM} />
        </FormField>

        <FormField label="To Date">
          <input className={styles.input} type="date" defaultValue={DEFAULT_TO} />
        </FormField>

        <FormField label="Client">
          <select className={styles.select}>
            <option>All Clients</option>
            {mockCompanies.map((item) => (
              <option key={item.id}>{item.name}</option>
            ))}
          </select>
        </FormField>

        <FormField label="Employee">
          <select className={styles.select}>
            <option>All Employees</option>
            {mockEmployees.map((item) => (
              <option key={item.employeeId}>{item.name}</option>
            ))}
          </select>
        </FormField>

        <FormField label="Request Type">
          <select className={styles.select}>
            <option>All Types</option>
            <option>Advance</option>
            <option>Loan</option>
          </select>
        </FormField>

        <FormField label="Approval Status">
          <select className={styles.select}>
            <option>All Status</option>
            <option>Pending</option>
            <option>Approved</option>
            <option>Rejected</option>
          </select>
        </FormField>

        <FormField label="Format" full>
          <div className={styles.radioRow}>
            {['excel', 'csv', 'pdf'].map((item) => (
              <label key={item}>
                <input
                  type="radio"
                  checked={format === item}
                  onChange={() => setFormat(item)}
                />{' '}
                {item.toUpperCase()}
              </label>
            ))}
          </div>
        </FormField>
      </div>
      <ModalActions
        close={onClose}
        save={() => onExport({ format, reportType })}
        label="Export Report"
      />
    </Modal>
  );
}

function AdvanceLoanManagement() {
  const [requests, setRequests] = useState(() => {
    try {
      return (
        JSON.parse(localStorage.getItem(REQUEST_KEY)) || mockAdvanceLoanRequests
      );
    } catch {
      return mockAdvanceLoanRequests;
    }
  });

  const [schedules, setSchedules] = useState(() => {
    try {
      return (
        JSON.parse(localStorage.getItem(SCHEDULE_KEY)) || mockDeductionSchedules
      );
    } catch {
      return mockDeductionSchedules;
    }
  });

  const [history] = useState(() => {
    try {
      return (
        JSON.parse(localStorage.getItem(HISTORY_KEY)) || mockDeductionHistory
      );
    } catch {
      return mockDeductionHistory;
    }
  });

  const [searchParams] = useSearchParams();
  const [tab, setTab] = useState(() => searchParams.get('tab') || 'all');

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam) {
      setTab(tabParam);
    } else {
      setTab('all');
    }
  }, [searchParams]);
  const [filters, setFilters] = useState({
    search: '',
    type: '',
    client: '',
    employee: '',
    status: '',
    fromDate: DEFAULT_FROM,
    toDate: DEFAULT_TO
  });
  const [page, setPage] = useState(1);
  const [requestModal, setRequestModal] = useState(false);
  const [details, setDetails] = useState(null);
  const [approve, setApprove] = useState(null);
  const [reject, setReject] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [scheduleDetails, setScheduleDetails] = useState(null);
  const [exportOpen, setExportOpen] = useState(false);
  const [toast, setToast] = useState(null);

  const notify = (message, type = 'success') => setToast({ message, type });

  const setFilter = (key, value) => {
    setPage(1);
    setFilters((current) => ({ ...current, [key]: value }));
  };

  const reset = () => {
    setPage(1);
    setFilters({
      search: '',
      type: '',
      client: '',
      employee: '',
      status: '',
      fromDate: DEFAULT_FROM,
      toDate: DEFAULT_TO
    });
  };

  const filteredRequests = useMemo(() => {
    return requests.filter((item) => {
      const query = filters.search.toLowerCase().trim();
      if (
        query &&
        !`${item.requestId} ${item.employeeName} ${item.employeeId}`
          .toLowerCase()
          .includes(query)
      ) {
        return false;
      }
      if (tab === 'advances' && item.type !== 'advance') return false;
      if (tab === 'loans' && item.type !== 'loan') return false;
      if (filters.type && item.type !== filters.type) return false;
      if (filters.client && item.clientName !== filters.client) return false;
      if (filters.employee && item.employeeId !== filters.employee) return false;
      if (filters.status && item.status !== filters.status) return false;
      if (filters.fromDate && item.requestDate < filters.fromDate) return false;
      if (filters.toDate && item.requestDate > filters.toDate) return false;
      return true;
    });
  }, [requests, filters, tab]);

  const filteredSchedules = schedules.filter(
    (item) =>
      (!filters.employee || item.employeeId === filters.employee) &&
      (!filters.client || item.clientName === filters.client) &&
      (!filters.type || item.type === filters.type)
  );

  const filteredHistory = history.filter(
    (item) =>
      (!filters.employee || item.employeeId === filters.employee) &&
      (!filters.client || item.clientName === filters.client) &&
      (!filters.type || item.type === filters.type)
  );

  const activeRows =
    tab === 'schedule'
      ? filteredSchedules
      : tab === 'history'
      ? filteredHistory
      : filteredRequests;

  const rows = activeRows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const saveRequest = (data) => {
    const isEditing = Boolean(requestModal?.id);
    const isLoan = data.type === 'loan';
    const totalInterest = isLoan
      ? Math.round(
          (Number(data.amount || 0) *
            Number(data.interestRate || 0) *
            (Number(data.numberOfMonths || 1) / 12)) /
            100
        )
      : 0;
    const totalRepayable = Number(data.amount || 0) + totalInterest;

    const payload = {
      id: requestModal?.id || Date.now(),
      requestId:
        requestModal?.requestId || `REQ-${Date.now().toString().slice(-4)}`,
      employeeId: data.employee.employeeId,
      employeeName: data.employee.name,
      initials: data.employee.initials,
      clientId: data.employee.companyId,
      clientName: data.employee.companyName,
      department: data.employee.department,
      designation: data.employee.designation,
      currentSalary: data.employee.salaryStructure?.basic || 20000,
      type: data.type,
      amount: data.amount,
      interestRate: data.interestRate,
      totalInterest,
      totalRepayable,
      reason: data.reason,
      requestDate: DEFAULT_TO,
      deductionMethod: data.deductionMethod,
      adjustmentMonth: data.adjustmentMonth,
      emiAmount: data.emiAmount,
      numberOfMonths: data.numberOfMonths,
      firstDeductionMonth: data.firstDeductionMonth,
      approvedAmount: 0,
      approvedDate: null,
      deductedAmount: 0,
      remainingAmount: totalRepayable,
      status: 'pending',
      rejectionReason: null,
      remarks: data.remarks
    };

    setRequests((current) =>
      isEditing
        ? current.map((item) => (item.id === requestModal.id ? payload : item))
        : [payload, ...current]
    );

    setRequestModal(false);
    notify(
      isEditing
        ? '✓ Request updated successfully.'
        : `✓ ${typeLabel(data.type)} request submitted successfully.`
    );
  };

  const confirmApprove = () => {
    if (!approve) return;
    const isLoan = approve.type === 'loan';
    const totalInterest = isLoan
      ? Math.round(
          (Number(approve.amount || 0) *
            Number(approve.interestRate || 0) *
            (Number(approve.numberOfMonths || 1) / 12)) /
            100
        )
      : 0;
    const totalRepayable = Number(approve.amount || 0) + totalInterest;

    const schedule = {
      id: Date.now(),
      requestId: approve.requestId,
      employeeId: approve.employeeId,
      employeeName: approve.employeeName,
      initials: approve.initials,
      clientName: approve.clientName,
      type: approve.type,
      approvedAmount: totalRepayable,
      monthlyDeduction: approve.emiAmount,
      totalMonths: approve.numberOfMonths,
      deductedAmount: 0,
      remainingAmount: totalRepayable,
      nextDeductionMonth: '2026-09',
      status: 'active'
    };

    setRequests((current) =>
      current.map((item) =>
        item.id === approve.id
          ? {
              ...item,
              status: 'approved',
              approvedAmount: totalRepayable,
              approvedDate: DEFAULT_TO,
              remainingAmount: totalRepayable
            }
          : item
      )
    );

    setSchedules((current) => [schedule, ...current]);
    setApprove(null);
    setDetails(null);
    notify('✓ Request approved successfully.');
  };

  const confirmReject = () => {
    if (!reject) return;
    if (!rejectReason.trim()) {
      notify('Rejection reason is required.', 'danger');
      return;
    }

    setRequests((current) =>
      current.map((item) =>
        item.id === reject.id
          ? {
              ...item,
              status: 'rejected',
              rejectionReason: rejectReason.trim()
            }
          : item
      )
    );

    setReject(null);
    setDetails(null);
    setRejectReason('');
    notify('✓ Request rejected.');
  };

  const exportReport = () => {
    setExportOpen(false);
    notify('Preparing report...');
    setTimeout(() => notify('✓ Report exported successfully.'), 500);
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
          <strong>Advances &amp; Loans</strong>
        </div>

        <header className={styles.pageHeader}>
          <div>
            <h1>Advance &amp; Loan Management</h1>
            <p>
              Manage employee advances, loans, approvals and salary deductions.
            </p>
          </div>
          <div className={styles.headerActions}>
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={() => setTab('history')}
            >
              Deduction History
            </button>
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={() => setRequestModal({ type: 'loan' })}
            >
              <Plus size={16} /> Request Loan
            </button>
            <button
              type="button"
              className={styles.primaryButton}
              onClick={() => setRequestModal({ type: 'advance' })}
            >
              <Plus size={16} /> Request Advance
            </button>
          </div>
        </header>

        <SummaryCards requests={requests} />
        <Overview requests={requests} />

        <div className={styles.infoCard}>
          <strong>Salary Adjustment</strong>
          <span>
            Approved advances and loan deductions will be adjusted against the
            employee&apos;s monthly salary. This is a frontend representation
            only.
          </span>
        </div>

        {tab !== 'schedule' && tab !== 'history' && (
          <section className={styles.sectionIntro}>
            <div>
              <h2 className={styles.sectionTitle}>Advance &amp; Loan Requests</h2>
              <p className={styles.sectionSubtext}>
                View and manage employee financial requests.
              </p>
            </div>
            <div className={styles.introActions}>
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={() => setExportOpen(true)}
              >
                Export Report
              </button>
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={() => setRequestModal({ type: 'loan' })}
              >
                <Plus size={16} /> Request Loan
              </button>
              <button
                type="button"
                className={styles.primaryButton}
                onClick={() => setRequestModal({ type: 'advance' })}
              >
                <Plus size={16} /> Request Advance
              </button>
            </div>
          </section>
        )}

        {(tab === 'schedule' || tab === 'history') && (
          <section className={styles.sectionIntro}>
            <div>
              <h2 className={styles.sectionTitle}>
                {tab === 'schedule'
                  ? 'Deduction Schedule'
                  : 'Deduction History'}
              </h2>
              <p className={styles.sectionSubtext}>
                {tab === 'schedule'
                  ? 'Track approved advances and loans against monthly salary.'
                  : 'View previously recorded salary deductions.'}
              </p>
            </div>
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={() => setExportOpen(true)}
            >
              Export Report
            </button>
          </section>
        )}

        {tab !== 'schedule' && tab !== 'history' && (
          <Filters values={filters} setValue={setFilter} reset={reset} />
        )}

        {tab === 'schedule' || tab === 'history' ? (
          <Filters values={filters} setValue={setFilter} reset={reset} />
        ) : null}

        {rows.length ? (
          tab === 'schedule' ? (
            <ScheduleTable schedules={rows} onView={setScheduleDetails} />
          ) : tab === 'history' ? (
            <HistoryTable rows={rows} />
          ) : (
            <RequestTable
              rows={rows}
              onView={setDetails}
              onApprove={setApprove}
              onReject={(request) => {
                setReject(request);
                setRejectReason('');
              }}
              onEdit={setRequestModal}
              onSchedule={(request) =>
                setScheduleDetails(
                  schedules.find((item) => item.requestId === request.requestId)
                )
              }
              onHistory={() => setTab('history')}
            />
          )
        ) : (
          <div className={styles.emptyWrap}>
            <EmptyState
              title={
                tab === 'schedule'
                  ? 'No active deduction schedules found.'
                  : tab === 'history'
                  ? 'No deduction history found.'
                  : 'No advance or loan requests found.'
              }
              description="Try changing your filters."
              actionLabel="Reset Filters"
              onAction={reset}
            />
          </div>
        )}

        <Pagination
          currentPage={page}
          totalItems={activeRows.length}
          itemsPerPage={PAGE_SIZE}
          onPageChange={setPage}
          label={
            tab === 'schedule'
              ? 'schedules'
              : tab === 'history'
              ? 'history records'
              : 'requests'
          }
        />

        <div className={styles.analyticsGrid}>
          <section className={styles.analyticsCard}>
            <h2 className={styles.sectionTitle}>Pending Approvals</h2>
            <p>
              {requests.filter((item) => item.status === 'pending').length}{' '}
              requests are waiting for approval.
            </p>
            {requests
              .filter((item) => item.status === 'pending')
              .slice(0, 4)
              .map((item) => (
                <button
                  type="button"
                  className={styles.pendingRow}
                  key={item.id}
                  onClick={() => setDetails(item)}
                >
                  <span>
                    {item.requestId} · {item.employeeName}
                  </span>
                  <strong>{money(item.amount)}</strong>
                </button>
              ))}
          </section>

          <section className={styles.analyticsCard}>
            <h2 className={styles.sectionTitle}>Monthly Deduction Summary</h2>
            <p>September 2026</p>
            <div className={styles.deductionNumbers}>
              <span>
                Expected <strong>{money(245000)}</strong>
              </span>
              <span>
                Deducted <strong>{money(180000)}</strong>
              </span>
              <span>
                Remaining <strong>{money(65000)}</strong>
              </span>
            </div>
          </section>
        </div>

        <DetailsDrawer
          request={details}
          onClose={() => setDetails(null)}
          onApprove={setApprove}
          onReject={(request) => {
            setReject(request);
            setRejectReason('');
          }}
        />

        {Boolean(requestModal) && (
          <RequestForm
            key={`request-${requestModal?.id || requestModal?.type || 'new'}`}
            request={requestModal}
            onClose={() => setRequestModal(false)}
            onSave={saveRequest}
          />
        )}

        {approve && (
          <ApproveModal
            request={approve}
            onClose={() => setApprove(null)}
            onConfirm={confirmApprove}
          />
        )}

        {reject && (
          <RejectModal
            request={reject}
            reason={rejectReason}
            setReason={setRejectReason}
            onClose={() => setReject(null)}
            onConfirm={confirmReject}
          />
        )}

        {scheduleDetails && (
          <ScheduleDrawer
            schedule={scheduleDetails}
            onClose={() => setScheduleDetails(null)}
          />
        )}

        {exportOpen && (
          <ExportModal
            onClose={() => setExportOpen(false)}
            onExport={exportReport}
          />
        )}
      </div>
    </AdminLayout>
  );
}

export default AdvanceLoanManagement;
