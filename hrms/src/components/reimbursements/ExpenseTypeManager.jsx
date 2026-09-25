import React, { useState } from 'react';
import { Plus, Edit2, CheckCircle2, X, Check } from 'lucide-react';
import styles from '../../pages/admin/Reimbursements.module.css';
import StatusBadge from '../common/StatusBadge';

export default function ExpenseTypeManager({
  expenseTypes,
  onSaveExpenseType,
  onToggleStatus
}) {
  const [modalState, setModalState] = useState({ isOpen: false, data: null });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: '#0f172a' }}>
            Configured Expense Categories &amp; Policy Limits
          </h2>
          <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 0' }}>
            Define policy caps, receipt mandatory rules, and GL billing codes for claims.
          </p>
        </div>
        <button
          type="button"
          className={styles.btnPrimary}
          onClick={() => setModalState({ isOpen: true, data: null })}
        >
          <Plus size={15} />
          <span>Add Expense Type</span>
        </button>
      </div>

      <div className={styles.tableContainer}>
        <table className={styles.dataTable}>
          <thead>
            <tr>
              <th style={{ minWidth: '180px' }}>Expense Type</th>
              <th style={{ minWidth: '80px' }}>Code</th>
              <th style={{ minWidth: '300px' }}>Description</th>
              <th style={{ minWidth: '140px', whiteSpace: 'nowrap' }}>Max Policy Limit</th>
              <th style={{ minWidth: '150px', whiteSpace: 'nowrap' }}>Receipt Required</th>
              <th style={{ minWidth: '100px', whiteSpace: 'nowrap' }}>Status</th>
              <th style={{ textAlign: 'right', minWidth: '140px', whiteSpace: 'nowrap' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {expenseTypes.map((type) => (
              <tr key={type.id}>
                <td style={{ whiteSpace: 'nowrap' }}>
                  <strong style={{ color: '#0f172a' }}>{type.name}</strong>
                </td>
                <td style={{ whiteSpace: 'nowrap' }}>
                  <code style={{ background: '#eef2ff', color: '#4338ca', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>
                    {type.code}
                  </code>
                </td>
                <td style={{ color: '#475569', fontSize: '12.5px', lineHeight: '1.4', wordBreak: 'break-word', whiteSpace: 'normal', minWidth: '280px' }}>
                  {type.description}
                </td>
                <td style={{ whiteSpace: 'nowrap' }}>
                  <strong style={{ color: '#0f172a', fontFamily: 'Consolas, monospace', fontSize: '13.5px' }}>
                    ₹{type.maxLimit.toLocaleString()}
                  </strong>
                </td>
                <td style={{ whiteSpace: 'nowrap' }}>
                  {type.requiresReceipt ? (
                    <span style={{ fontSize: '12px', color: '#15803d', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <CheckCircle2 size={13} /> Yes (Mandatory)
                    </span>
                  ) : (
                    <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 500 }}>
                      Optional
                    </span>
                  )}
                </td>
                <td style={{ whiteSpace: 'nowrap' }}>
                  <StatusBadge status={type.status} />
                </td>
                <td style={{ whiteSpace: 'nowrap' }}>
                  <div className={styles.actionBtns}>
                    <button
                      type="button"
                      className={styles.iconBtn}
                      title="Edit Category"
                      onClick={() => setModalState({ isOpen: true, data: type })}
                    >
                      <Edit2 size={13} />
                    </button>
                    <button
                      type="button"
                      className={styles.btnOutlinePrimary}
                      style={{ padding: '4px 8px', fontSize: '11.5px' }}
                      onClick={() => onToggleStatus(type)}
                    >
                      {type.status === 'Active' ? 'Deactivate' : 'Activate'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Expense Type Edit Modal */}
      {modalState.isOpen && (
        <ExpenseTypeDialog
          initialData={modalState.data}
          onClose={() => setModalState({ isOpen: false, data: null })}
          onSave={(data) => {
            onSaveExpenseType(data);
            setModalState({ isOpen: false, data: null });
          }}
        />
      )}
    </div>
  );
}

function ExpenseTypeDialog({ initialData, onClose, onSave }) {
  const [name, setName] = useState(initialData?.name || '');
  const [code, setCode] = useState(initialData?.code || '');
  const [maxLimit, setMaxLimit] = useState(initialData?.maxLimit || 5000);
  const [requiresReceipt, setRequiresReceipt] = useState(initialData?.requiresReceipt ?? true);
  const [description, setDescription] = useState(initialData?.description || '');
  const [status, setStatus] = useState(initialData?.status || 'Active');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...(initialData || {}),
      name,
      code: code.toUpperCase(),
      maxLimit: Number(maxLimit),
      requiresReceipt,
      description,
      status
    });
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>
            {initialData ? `Edit Expense Category: ${initialData.name}` : 'Add New Expense Category'}
          </h3>
          <button type="button" className={styles.iconBtn} onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className={styles.modalBody}>
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label className={styles.label}>
                  Expense Type Name <span className={styles.requiredStar}>*</span>
                </label>
                <input
                  type="text"
                  className={styles.input}
                  placeholder="e.g. Travel / Conveyance"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>
                  Category Code <span className={styles.requiredStar}>*</span>
                </label>
                <input
                  type="text"
                  className={styles.input}
                  placeholder="e.g. TRV, FUEL"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>
                  Max Policy Cap (₹) <span className={styles.requiredStar}>*</span>
                </label>
                <input
                  type="number"
                  className={styles.input}
                  min={0}
                  value={maxLimit}
                  onChange={(e) => setMaxLimit(e.target.value)}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Category Status</label>
                <select
                  className={styles.select}
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Description / Scope</label>
              <textarea
                className={styles.textarea}
                placeholder="Clarify what expenditures fall under this head..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#334155', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={requiresReceipt}
                onChange={(e) => setRequiresReceipt(e.target.checked)}
              />
              Bill / Receipt upload is mandatory for this category
            </label>
          </div>

          <div className={styles.modalFooter}>
            <button type="button" className={styles.btnSecondary} onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className={styles.btnPrimary}>
              <Check size={15} />
              <span>Save Category</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
