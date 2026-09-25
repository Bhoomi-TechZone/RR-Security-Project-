import React, { useState, useEffect } from 'react';
import { X, Shield, KeyRound, AlertCircle, Copy, Check, ArrowRight } from 'lucide-react';
import styles from './RoleFormModal.module.css';

const RESERVED_NAMES = ['admin', 'employee', 'super admin', 'root'];

function RoleFormModal({
  isOpen,
  onClose,
  onSubmit,
  initialRole = null,
  isEditing = false,
  isDuplicate = false,
  existingRoles = []
}) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'Active',
    cloneFromId: '',
    goToPermissions: true
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      if (initialRole) {
        setFormData({
          name: isDuplicate ? `${initialRole.name} (Copy)` : initialRole.name,
          description: initialRole.description || '',
          status: initialRole.status || 'Active',
          cloneFromId: isDuplicate ? initialRole.id : '',
          goToPermissions: !isEditing
        });
      } else {
        setFormData({
          name: '',
          description: '',
          status: 'Active',
          cloneFromId: '',
          goToPermissions: true
        });
      }
      setErrors({});
    }
  }, [isOpen, initialRole, isEditing, isDuplicate]);

  if (!isOpen) return null;

  const validate = () => {
    const newErrors = {};
    const trimmedName = formData.name.trim();

    if (!trimmedName) {
      newErrors.name = 'Role name is required.';
    } else if (RESERVED_NAMES.includes(trimmedName.toLowerCase()) && !isEditing) {
      newErrors.name = 'This role name is reserved for system roles.';
    } else {
      // Check for uniqueness
      const isDuplicateName = existingRoles.some(r => {
        if (isEditing && r.id === initialRole?.id) return false;
        return r.name.trim().toLowerCase() === trimmedName.toLowerCase();
      });

      if (isDuplicateName) {
        newErrors.name = 'A role with this name already exists.';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    onSubmit({
      name: formData.name.trim(),
      description: formData.description.trim(),
      status: formData.status,
      cloneFromId: formData.cloneFromId || null,
      goToPermissions: formData.goToPermissions
    });
  };

  const modalTitle = isDuplicate 
    ? 'Duplicate Role' 
    : isEditing 
      ? 'Edit Role Info' 
      : 'Create New Role';

  const modalSubtitle = isDuplicate
    ? `Create a copy of "${initialRole?.name}" with its permissions`
    : isEditing
      ? 'Update role title, description and operational status'
      : 'Define a custom role to grant tailored module access';

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-labelledby="role-form-title">
      <div className={styles.modal}>
        {/* Header */}
        <div className={styles.modalHeader}>
          <div className={styles.titleRow}>
            <div className={styles.modalIconWrap}>
              {isEditing ? <KeyRound size={20} /> : <Shield size={20} />}
            </div>
            <div>
              <h2 id="role-form-title" className={styles.modalTitle}>{modalTitle}</h2>
              <p className={styles.modalSubtitle}>{modalSubtitle}</p>
            </div>
          </div>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.fieldGroup}>
            <label htmlFor="role-name" className={styles.label}>
              Role Name <span className={styles.required}>*</span>
            </label>
            <input
              id="role-name"
              type="text"
              className={`${styles.input} ${errors.name ? styles.inputError : ''}`}
              placeholder="e.g. Operations Supervisor, Field Officer, Billing Executive"
              value={formData.name}
              onChange={(e) => {
                setFormData(prev => ({ ...prev, name: e.target.value }));
                if (errors.name) setErrors(prev => ({ ...prev, name: null }));
              }}
              autoFocus
            />
            {errors.name && (
              <span className={styles.errorMessage}>
                <AlertCircle size={13} /> {errors.name}
              </span>
            )}
          </div>

          <div className={styles.fieldGroup}>
            <label htmlFor="role-description" className={styles.label}>
              Role Description
            </label>
            <textarea
              id="role-description"
              className={styles.textarea}
              rows={3}
              placeholder="Explain the scope and responsibilities assigned to this role..."
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            />
          </div>

          <div className={styles.rowTwoCols}>
            <div className={styles.fieldGroup}>
              <label htmlFor="role-status" className={styles.label}>
                Status
              </label>
              <select
                id="role-status"
                className={styles.select}
                value={formData.status}
                onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
              >
                <option value="Active">Active (Assignable to users)</option>
                <option value="Inactive">Inactive (Disabled / suspended)</option>
              </select>
            </div>

            {!isEditing && (
              <div className={styles.fieldGroup}>
                <label htmlFor="role-template" className={styles.label}>
                  Copy Permissions From (Optional)
                </label>
                <select
                  id="role-template"
                  className={styles.select}
                  value={formData.cloneFromId}
                  onChange={(e) => setFormData(prev => ({ ...prev, cloneFromId: e.target.value }))}
                >
                  <option value="">Start with Blank Permissions</option>
                  {existingRoles.map(r => (
                    <option key={r.id} value={r.id}>
                      {r.name} ({r.type === 'system' ? 'System Role' : 'Custom Role'})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {!isEditing && (
            <div className={styles.checkboxOption}>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={formData.goToPermissions}
                  onChange={(e) => setFormData(prev => ({ ...prev, goToPermissions: e.target.checked }))}
                  className={styles.checkboxInput}
                />
                <span className={styles.checkboxCustom} />
                <span className={styles.checkboxText}>
                  <strong>Open Permission Matrix immediately</strong> after creating role
                </span>
              </label>
            </div>
          )}

          {/* Footer */}
          <div className={styles.modalFooter}>
            <button
              type="button"
              className={styles.btnCancel}
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={styles.btnSubmit}
            >
              {isEditing ? (
                <>
                  <Check size={16} />
                  <span>Update Role</span>
                </>
              ) : formData.goToPermissions ? (
                <>
                  <span>Create & Configure Permissions</span>
                  <ArrowRight size={16} />
                </>
              ) : (
                <>
                  <Check size={16} />
                  <span>Create Role</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default RoleFormModal;
