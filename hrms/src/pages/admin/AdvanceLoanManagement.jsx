import { useMemo, useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  BadgeIndianRupee,
  Clock3,
  FileText,
  MoreVertical,
  Plus,
  Search,
  WalletCards,
  X,
  Loader2,
  RefreshCw,
  Download
} from 'lucide-react';
import AdminLayout from '../../components/layout/AdminLayout';
import EmptyState from '../../components/common/EmptyState';
import Pagination from '../../components/common/Pagination';
import Toast from '../../components/common/Toast';
import { usePermissions } from '../../context/PermissionContext';
import { useCompany } from '../../context/CompanyContext';
import { advanceLoanService } from '../../services/advanceLoanService';
import { employeeService } from '../../services/employeeService';
import { clientService } from '../../services/clientService';
import styles from './AdvanceLoanManagement.module.css';

const PAGE_SIZE = 8;

const money = (value) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(Number(value || 0));

const dateLabel = (value) => {
  if (!value) return '—';
  try {
    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).format(new Date(value.includes('T') ? value : `${value}T00:00:00`));
  } catch {
    return value;
  }
};

const getEmpDisplayName = (emp) => {
  if (!emp) return '';
  if (emp.name) return emp.name;
  const first = emp.personalInfo?.firstName || '';
  const last = emp.personalInfo?.lastName || '';
  const full = `${first} ${last}`.trim();
  return full || emp.employeeId || 'Employee';
};

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

function SummaryCards({ requests, tab }) {
  const currentRequests = useMemo(() => {
    if (tab === 'advances') return requests.filter((r) => r.type === 'advance');
    if (tab === 'loans') return requests.filter((r) => r.type === 'loan');
    return requests;
  }, [requests, tab]);

  const total = currentRequests.length;
  const pending = currentRequests.filter((item) => item.status === 'pending').length;
  const approved = currentRequests
    .filter((item) => ['approved', 'completed'].includes(item.status))
    .reduce((sum, item) => sum + (Number(item.approvedAmount) || Number(item.amount) || 0), 0);
  const outstanding = currentRequests
    .filter((item) => ['approved', 'completed'].includes(item.status))
    .reduce((sum, item) => sum + (Number(item.remainingAmount) || 0), 0);

  const prefix = tab === 'advances' ? 'Advance' : tab === 'loans' ? 'Loan' : 'Request';

  const cards = [
    { label: tab === 'advances' ? 'Total Advance Requests' : tab === 'loans' ? 'Total Loan Requests' : 'Total Requests', value: total, icon: FileText, tone: styles.blue },
    { label: `Pending ${prefix}s`, value: pending, icon: Clock3, tone: styles.yellow },
    { label: `Approved ${prefix} Amount`, value: money(approved), icon: BadgeIndianRupee, tone: styles.green },
    { label: `Outstanding ${prefix} Amount`, value: money(outstanding), icon: WalletCards, tone: styles.purple }
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

function Overview({ requests, tab }) {
  const isAdvances = tab === 'advances';
  const isLoans = tab === 'loans';
  const currentRequests = useMemo(() => {
    if (isAdvances) return requests.filter((r) => r.type === 'advance');
    if (isLoans) return requests.filter((r) => r.type === 'loan');
    return requests;
  }, [requests, isAdvances, isLoans]);

  const totals = (isAdvances ? ['advance'] : isLoans ? ['loan'] : ['advance', 'loan']).map((type) => {
    const list = requests.filter((item) => item.type === type);
    return {
      type,
      count: list.length,
      amount: list.reduce((sum, item) => sum + (Number(item.amount) || 0), 0)
    };
  });
  const states = ['approved', 'pending', 'rejected'];
  const title = isAdvances ? 'Salary Advance Overview' : isLoans ? 'Employee Loan Overview' : 'Advance & Loan Overview';

  return (
    <section className={styles.overviewCard}>
      <div className={styles.sectionHeader}>
        <div>
          <h2 className={styles.sectionTitle}>{title}</h2>
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
                {currentRequests.filter((item) => item.status === state).length}
              </strong>
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

function Filters({ values, setValue, reset, tab, clients, employees }) {
  const isSingleType = tab === 'advances' || tab === 'loans';

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

        {!isSingleType && field(
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
          clients.map((item) => item.clientName || item.companyName || item.name || item),
          'All Clients'
        )}

        {field(
          'Employee',
          'employee',
          employees.map((item) => ({
            value: item.employeeId || item._id,
            label: `${getEmpDisplayName(item)} — ${item.employeeId || item._id}`
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

        <button type="button" className={styles.resetBtn} onClick={reset}>
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
  onDelete,
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
              <tr key={row._id || row.id || row.requestId}>
                <td className={styles.muted}>{row.requestId}</td>
                <td>
                  <div className={styles.employeeCell}>
                    <span className={styles.avatar}>
                      {row.initials || (row.employeeName ? row.employeeName.slice(0, 2).toUpperCase() : 'EM')}
                    </span>
                    <div>
                      <strong>{row.employeeName}</strong>
                      <small>{row.employeeId}</small>
                    </div>
                  </div>
                </td>
                <td>{row.clientName || '—'}</td>
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
                    : `${money(row.emiAmount)} × ${row.numberOfMonths || 1}`}
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
                    onClick={() => setMenu(menu === (row._id || row.requestId) ? null : (row._id || row.requestId))}
                  >
                    <MoreVertical size={17} />
                  </button>
                  {menu === (row._id || row.requestId) && (
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
                          <button
                            type="button"
                            style={{ color: '#ef4444' }}
                            onClick={() => {
                              onDelete(row);
                              setMenu(null);
                            }}
                          >
                            Delete Request
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
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              onView(row);
                              setMenu(null);
                            }}
                          >
                            View Rejection Reason
                          </button>
                          <button
                            type="button"
                            style={{ color: '#ef4444' }}
                            onClick={() => {
                              onDelete(row);
                              setMenu(null);
                            }}
                          >
                            Delete Request
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

function ModalActions({ close, save, label, loading }) {
  return (
    <div className={styles.modalActions}>
      <button type="button" className={styles.secondaryButton} onClick={close} disabled={loading}>
        Cancel
      </button>
      <button type="button" className={styles.primaryButton} onClick={save} disabled={loading}>
        {loading ? <Loader2 size={16} className={styles.spin} /> : label}
      </button>
    </div>
  );
}

function RequestForm({ request, onClose, onSave, employees = [] }) {
  const reqType = request?.type || 'advance';
  const isEditing = Boolean(request?._id || request?.id);

  const calculateEmi = (amt, rateVal, numMonths) => {
    const p = Number(amt || 0);
    const r = reqType === 'loan' ? Number(rateVal || 0) : 0;
    const n = Math.max(1, Number(numMonths || 1));
    if (p <= 0) return '';
    const interest = Math.round((p * r * (n / 12)) / 100);
    const total = p + interest;
    return Math.ceil(total / n);
  };

  const currentYearMonth = new Date().toISOString().slice(0, 7);

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
          firstDeductionMonth: currentYearMonth,
          adjustmentMonth: currentYearMonth,
          remarks: ''
        }
  );

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const selectedEmployee = employees.find(
    (item) => (item.employeeId || item._id) === form.employeeId
  );

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

  const handleSave = async () => {
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
      try {
        setSubmitting(true);
        await onSave({
          ...form,
          type: reqType,
          employee: selectedEmployee,
          amount: Number(form.amount),
          interestRate: reqType === 'loan' ? Number(form.interestRate || 0) : 0,
          emiAmount:
            form.deductionMethod === 'monthly-emi'
              ? effectiveEmi
              : Number(form.amount),
          numberOfMonths:
            form.deductionMethod === 'monthly-emi'
              ? Number(form.numberOfMonths)
              : 1,
          reason: form.reason === 'Other' ? form.otherReason?.trim() : form.reason
        });
      } finally {
        setSubmitting(false);
      }
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
      title={isEditing ? `Edit ${typeLabel(reqType)} Request` : `New ${typeLabel(reqType)} Request`}
      onClose={onClose}
    >
      <div className={styles.formGrid}>
        <FormField label="Employee" error={errors.employeeId}>
          <select
            className={styles.select}
            value={form.employeeId}
            onChange={(event) => update('employeeId', event.target.value)}
            disabled={isEditing}
          >
            <option value="">Select Employee</option>
            {employees.map((item) => {
              const empId = item.employeeId || item._id;
              return (
                <option key={empId} value={empId}>
                  {getEmpDisplayName(item)} — {empId}
                </option>
              );
            })}
          </select>
        </FormField>

        <FormField label="Client">
          <input
            className={styles.input}
            readOnly
            value={
              selectedEmployee?.employmentDetails?.clientName ||
              selectedEmployee?.companyName ||
              request?.clientName ||
              'RR Security'
            }
            placeholder={form.employeeId ? '' : 'Auto-filled from employee'}
          />
        </FormField>

        <FormField label="Department">
          <input
            className={styles.input}
            readOnly
            value={
              selectedEmployee?.employmentDetails?.department ||
              selectedEmployee?.department ||
              request?.department ||
              ''
            }
            placeholder={form.employeeId ? '' : 'Auto-filled from employee'}
          />
        </FormField>

        <FormField label="Designation">
          <input
            className={styles.input}
            readOnly
            value={
              selectedEmployee?.employmentDetails?.designation ||
              selectedEmployee?.designation ||
              request?.designation ||
              ''
            }
            placeholder={form.employeeId ? '' : 'Auto-filled from employee'}
          />
        </FormField>

        <FormField label="Current Salary">
          <input
            className={styles.input}
            readOnly
            value={
              selectedEmployee
                ? money(
                    selectedEmployee.salaryStructure?.basic ||
                    selectedEmployee.salaryDetails?.basic ||
                    selectedEmployee.currentSalary ||
                    0
                  )
                : ''
            }
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
          <FormField label="Rate of Interest (% p.a.)" error={errors.interestRate}>
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

      <ModalActions
        close={onClose}
        save={handleSave}
        label={isEditing ? 'Save Changes' : `Submit ${typeLabel(reqType)} Request`}
        loading={submitting}
      />
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
    ['Client', request.clientName || 'RR Security'],
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
        : `${money(request.emiAmount)} × ${request.numberOfMonths || 1} months`
    ]
  ];

  const approvedFields = [
    ['Approved Amount', money(request.approvedAmount || request.totalRepayable || request.amount)],
    ['Approved Date', dateLabel(request.approvedDate)],
    ['Approved By', request.approvedBy || 'Admin'],
    ['Monthly Deduction', money(request.emiAmount)],
    ['Number of Deductions', request.numberOfMonths || 1],
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

          {request.auditTrail?.length > 0 && (
            <div style={{ marginTop: '1.5rem' }}>
              <h4 style={{ fontSize: '0.85rem', color: '#64748b', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Audit Trail</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem' }}>
                {request.auditTrail.map((item, idx) => (
                  <div key={idx} style={{ background: '#f8fafc', padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600 }}>
                      <span>{item.action}</span>
                      <small style={{ color: '#64748b' }}>{dateLabel(item.date)}</small>
                    </div>
                    <div style={{ color: '#475569', fontSize: '0.8rem' }}>by {item.by}: {item.notes}</div>
                  </div>
                ))}
              </div>
            </div>
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

function ApproveModal({ request, onClose, onConfirm, loading }) {
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
            : `${money(request.emiAmount)} × ${request.numberOfMonths || 1}`}
        </strong>
      </div>
      <ModalActions close={onClose} save={onConfirm} label="Approve Request" loading={loading} />
    </Modal>
  );
}

function RejectModal({ request, reason, setReason, onClose, onConfirm, loading }) {
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
      <ModalActions close={onClose} save={onConfirm} label="Reject Request" loading={loading} />
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
              const approvedAmt = Number(item.approvedAmount || 0);
              const deductedAmt = Number(item.deductedAmount || 0);
              const percent = approvedAmt
                ? Math.min(100, Math.round((deductedAmt / approvedAmt) * 100))
                : 0;

              return (
                <tr key={item._id || item.id || item.requestId}>
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
                  <td>{item.totalMonths || 1}</td>
                  <td>{money(item.deductedAmount)}</td>
                  <td>{money(item.remainingAmount)}</td>
                  <td>{item.nextDeductionMonth || 'Next Cycle'}</td>
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
              <tr key={item._id || item.id || Math.random()}>
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
                <td>{item.remarks || '—'}</td>
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

  const installments = schedule.installments?.length > 0
    ? schedule.installments
    : Array.from({ length: schedule.totalMonths || 1 }, (_, index) => ({
        month: schedule.nextDeductionMonth
          ? `${schedule.nextDeductionMonth} (+${index}m)`
          : `Month ${index + 1}`,
        amount: schedule.monthlyDeduction,
        status:
          index < Math.ceil((schedule.deductedAmount || 0) / (schedule.monthlyDeduction || 1))
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
            <th>Month / Cycle</th>
            <th>Amount</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {installments.map((item, idx) => (
            <tr key={idx}>
              <td>{item.month}</td>
              <td>{money(item.amount || schedule.monthlyDeduction)}</td>
              <td>
                <span className={`${styles.statusBadge} ${statusClass(item.status?.toLowerCase() || 'pending')}`}>
                  {item.status || 'Pending'}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Modal>
  );
}

function ExportModal({ onClose, onExport, clients = [], employees = [] }) {
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

        <FormField label="Format" full>
          <div className={styles.radioRow}>
            {['csv', 'excel', 'json'].map((item) => (
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
  const { canAdd } = usePermissions();
  const { company } = useCompany();
  const companyId = company?.companyId || company?.id || 'RRS8392014SEC';

  const [requests, setRequests] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

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
    fromDate: '',
    toDate: ''
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

  // Fetch all data from MongoDB
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [reqList, schedList, histList, statsData, empList, clientList] = await Promise.all([
        advanceLoanService.getRequests(companyId, filters),
        advanceLoanService.getSchedules(companyId),
        advanceLoanService.getHistory(companyId),
        advanceLoanService.getStats(companyId),
        employeeService.getEmployees(companyId),
        clientService.getClients(companyId)
      ]);

      setRequests(reqList || []);
      setSchedules(schedList || []);
      setHistory(histList || []);
      setStats(statsData || null);
      setEmployees(empList || []);
      setClients(clientList || []);
    } catch (err) {
      console.error('Error fetching advance/loan data from MongoDB:', err);
      notify(err.message || 'Failed to load advance & loan records', 'danger');
    } finally {
      setLoading(false);
    }
  }, [companyId, filters]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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
      fromDate: '',
      toDate: ''
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

  const filteredSchedules = useMemo(() => {
    return schedules.filter(
      (item) =>
        (!filters.employee || item.employeeId === filters.employee) &&
        (!filters.client || item.clientName === filters.client) &&
        (!filters.type || item.type === filters.type)
    );
  }, [schedules, filters]);

  const filteredHistory = useMemo(() => {
    return history.filter(
      (item) =>
        (!filters.employee || item.employeeId === filters.employee) &&
        (!filters.client || item.clientName === filters.client) &&
        (!filters.type || item.type === filters.type)
    );
  }, [history, filters]);

  const activeRows =
    tab === 'schedule'
      ? filteredSchedules
      : tab === 'history'
      ? filteredHistory
      : filteredRequests;

  const rows = activeRows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const saveRequest = async (data) => {
    const isEditing = Boolean(requestModal?._id || requestModal?.id);
    const targetId = requestModal?._id || requestModal?.id;

    try {
      if (isEditing) {
        await advanceLoanService.updateRequest(companyId, targetId, data);
        notify('✓ Request updated successfully in database.');
      } else {
        await advanceLoanService.createRequest(companyId, data);
        notify(`✓ ${typeLabel(data.type)} request submitted successfully to database.`);
      }
      setRequestModal(false);
      fetchData();
    } catch (err) {
      console.error('Error saving request:', err);
      notify(err.message || 'Failed to save request', 'danger');
    }
  };

  const confirmApprove = async () => {
    if (!approve) return;
    try {
      setActionLoading(true);
      const targetId = approve._id || approve.id || approve.requestId;
      await advanceLoanService.approveRequest(companyId, targetId);
      setApprove(null);
      setDetails(null);
      notify('✓ Request approved and added to active deduction schedules in database.');
      fetchData();
    } catch (err) {
      console.error('Error approving request:', err);
      notify(err.message || 'Failed to approve request', 'danger');
    } finally {
      setActionLoading(false);
    }
  };

  const confirmReject = async () => {
    if (!reject) return;
    if (!rejectReason.trim()) {
      notify('Rejection reason is required.', 'danger');
      return;
    }

    try {
      setActionLoading(true);
      const targetId = reject._id || reject.id || reject.requestId;
      await advanceLoanService.rejectRequest(companyId, targetId, rejectReason.trim());
      setReject(null);
      setDetails(null);
      setRejectReason('');
      notify('✓ Request marked as rejected in database.');
      fetchData();
    } catch (err) {
      console.error('Error rejecting request:', err);
      notify(err.message || 'Failed to reject request', 'danger');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (row) => {
    if (!window.confirm(`Are you sure you want to delete ${row.requestId}?`)) return;
    try {
      const targetId = row._id || row.id || row.requestId;
      await advanceLoanService.deleteRequest(companyId, targetId);
      notify('✓ Request deleted from database.');
      fetchData();
    } catch (err) {
      console.error('Error deleting request:', err);
      notify(err.message || 'Failed to delete request', 'danger');
    }
  };

  const exportReport = ({ format, reportType }) => {
    setExportOpen(false);
    try {
      let dataToExport = [];
      if (reportType === 'requests') dataToExport = requests;
      else if (reportType === 'approved') dataToExport = requests.filter(r => ['approved', 'completed'].includes(r.status));
      else if (reportType === 'schedule') dataToExport = schedules;
      else if (reportType === 'history') dataToExport = history;
      else if (reportType === 'outstanding') dataToExport = requests.filter(r => (r.remainingAmount || 0) > 0);

      if (!dataToExport.length) {
        notify('No records to export', 'danger');
        return;
      }

      if (format === 'json') {
        const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(dataToExport, null, 2));
        const dlAnchor = document.createElement('a');
        dlAnchor.setAttribute('href', dataStr);
        dlAnchor.setAttribute('download', `Advance_Loan_${reportType}_${new Date().toISOString().slice(0, 10)}.json`);
        dlAnchor.click();
      } else {
        // CSV export
        const keys = Object.keys(dataToExport[0] || {}).filter(k => typeof dataToExport[0][k] !== 'object' && k !== '__v');
        const csvContent = 'data:text/csv;charset=utf-8,' + [
          keys.join(','),
          ...dataToExport.map(row => keys.map(k => `"${(row[k] ?? '').toString().replace(/"/g, '""')}"`).join(','))
        ].join('\n');
        const dlAnchor = document.createElement('a');
        dlAnchor.setAttribute('href', encodeURI(csvContent));
        dlAnchor.setAttribute('download', `Advance_Loan_${reportType}_${new Date().toISOString().slice(0, 10)}.csv`);
        dlAnchor.click();
      }

      notify('✓ Report exported successfully.');
    } catch (err) {
      console.error('Export error:', err);
      notify('Failed to export report', 'danger');
    }
  };

  const currentMonthName = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(new Date());

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
          {tab === 'advances' ? (
            <>
              <span>Advances &amp; Loans</span>
              <span>/</span>
              <strong>Salary Advances</strong>
            </>
          ) : tab === 'loans' ? (
            <>
              <span>Advances &amp; Loans</span>
              <span>/</span>
              <strong>Employee Loans</strong>
            </>
          ) : tab === 'schedule' ? (
            <>
              <span>Advances &amp; Loans</span>
              <span>/</span>
              <strong>Deduction Schedule</strong>
            </>
          ) : tab === 'history' ? (
            <>
              <span>Advances &amp; Loans</span>
              <span>/</span>
              <strong>Deduction History</strong>
            </>
          ) : (
            <strong>Advances &amp; Loans</strong>
          )}
        </div>

        <header className={styles.pageHeader}>
          <div>
            <h1>
              {tab === 'advances'
                ? 'Salary Advances'
                : tab === 'loans'
                ? 'Employee Loans'
                : tab === 'schedule'
                ? 'Deduction Schedule'
                : tab === 'history'
                ? 'Deduction History'
                : 'Advance & Loan Management'}
            </h1>
            <p>
              {tab === 'advances'
                ? 'Manage employee salary advance requests, approval workflows and adjustments.'
                : tab === 'loans'
                ? 'Manage employee loan applications, interest calculations, EMIs and approvals.'
                : tab === 'schedule'
                ? 'Track active monthly advance and loan EMI deductions against salaries.'
                : tab === 'history'
                ? 'View previously recorded salary deductions and repayment history.'
                : 'Manage employee advances, loans, approvals and salary deductions.'}
            </p>
          </div>
          <div className={styles.headerActions}>
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={fetchData}
              title="Refresh Data from MongoDB"
            >
              <RefreshCw size={15} /> Refresh
            </button>
            {tab === 'all' && (
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={() => setTab('history')}
              >
                Deduction History
              </button>
            )}
            {canAdd('advances_loans') && tab !== 'advances' && (
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={() => setRequestModal({ type: 'loan' })}
              >
                <Plus size={16} /> Request Loan
              </button>
            )}
            {canAdd('advances_loans') && tab !== 'loans' && (
              <button
                type="button"
                className={styles.primaryButton}
                onClick={() => setRequestModal({ type: 'advance' })}
              >
                <Plus size={16} /> Request Advance
              </button>
            )}
          </div>
        </header>

        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '240px', gap: '10px' }}>
            <Loader2 size={28} className={styles.spin} />
            <span style={{ color: '#64748b', fontSize: '1rem', fontWeight: 500 }}>Connecting to MongoDB database...</span>
          </div>
        ) : (
          <>
            <SummaryCards requests={requests} tab={tab} />
            <Overview requests={requests} tab={tab} />

            <div className={styles.infoCard}>
              <strong>Salary Adjustment</strong>
              <span>
                {tab === 'advances'
                  ? "Approved advances will be deducted from the employee's next salary payout."
                  : tab === 'loans'
                  ? "Approved loans will be deducted monthly based on configured EMI schedules."
                  : "Approved advances and loan deductions will be adjusted against the employee's monthly salary."}
              </span>
            </div>

            {tab !== 'schedule' && tab !== 'history' && (
              <section className={styles.sectionIntro}>
                <div>
                  <h2 className={styles.sectionTitle}>
                    {tab === 'advances'
                      ? 'Salary Advance Requests'
                      : tab === 'loans'
                      ? 'Employee Loan Applications'
                      : 'Advance & Loan Requests'}
                  </h2>
                  <p className={styles.sectionSubtext}>
                    {tab === 'advances'
                      ? 'View and manage employee advance requests.'
                      : tab === 'loans'
                      ? 'View and manage employee loan applications.'
                      : 'View and manage employee financial requests.'}
                  </p>
                </div>
                <div className={styles.introActions}>
                  <button
                    type="button"
                    className={styles.secondaryButton}
                    onClick={() => setExportOpen(true)}
                  >
                    <Download size={15} /> Export Report
                  </button>
                  {tab !== 'advances' && (
                    <button
                      type="button"
                      className={styles.secondaryButton}
                      onClick={() => setRequestModal({ type: 'loan' })}
                    >
                      <Plus size={16} /> Request Loan
                    </button>
                  )}
                  {tab !== 'loans' && (
                    <button
                      type="button"
                      className={styles.primaryButton}
                      onClick={() => setRequestModal({ type: 'advance' })}
                    >
                      <Plus size={16} /> Request Advance
                    </button>
                  )}
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
                  <Download size={15} /> Export Report
                </button>
              </section>
            )}

            <Filters
              values={filters}
              setValue={setFilter}
              reset={reset}
              tab={tab}
              clients={clients}
              employees={employees}
            />

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
                  onDelete={handleDelete}
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
                  description="Try changing your filters or create a new request."
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
                      key={item._id || item.requestId}
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
                <p>{currentMonthName}</p>
                <div className={styles.deductionNumbers}>
                  <span>
                    Expected <strong>{money(stats?.monthlyDeduction?.expected || 0)}</strong>
                  </span>
                  <span>
                    Deducted <strong>{money(stats?.monthlyDeduction?.deducted || 0)}</strong>
                  </span>
                  <span>
                    Remaining <strong>{money(stats?.monthlyDeduction?.remaining || 0)}</strong>
                  </span>
                </div>
              </section>
            </div>
          </>
        )}

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
            key={`request-${requestModal?._id || requestModal?.id || requestModal?.type || 'new'}`}
            request={requestModal}
            employees={employees}
            onClose={() => setRequestModal(false)}
            onSave={saveRequest}
          />
        )}

        {approve && (
          <ApproveModal
            request={approve}
            onClose={() => setApprove(null)}
            onConfirm={confirmApprove}
            loading={actionLoading}
          />
        )}

        {reject && (
          <RejectModal
            request={reject}
            reason={rejectReason}
            setReason={setRejectReason}
            onClose={() => setReject(null)}
            onConfirm={confirmReject}
            loading={actionLoading}
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
            clients={clients}
            employees={employees}
            onClose={() => setExportOpen(false)}
            onExport={exportReport}
          />
        )}
      </div>
    </AdminLayout>
  );
}

export default AdvanceLoanManagement;
