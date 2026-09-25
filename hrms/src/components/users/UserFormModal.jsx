import React, { useState, useEffect } from 'react';
import {
  X,
  UserPlus,
  UserCheck,
  Shield,
  KeyRound,
  Mail,
  Phone,
  User,
  AlertCircle,
  Check,
  ExternalLink,
  Eye,
  EyeOff
} from 'lucide-react';
import styles from './UserFormModal.module.css';
import { getRolePermissionsOverview } from '../../data/adminUsersData';

function UserFormModal({
  isOpen,
  onClose,
  onSubmit,
  initialUser = null,
  isEditing = false,
  roles = [],
  onNavigateToRoles
}) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobile: '',
    username: '',
    password: '',
    confirmPassword: '',
    roleId: '',
    status: 'Active'
  });

  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (initialUser) {
        setFormData({
          name: initialUser.name || '',
          email: initialUser.email || '',
          mobile: initialUser.mobile || '',
          username: initialUser.username || '',
          password: '',
          confirmPassword: '',
          roleId: initialUser.roleId || (roles[0]?.id || ''),
          status: initialUser.status || 'Active'
        });
      } else {
        const defaultRole = roles.find(r => r.name === 'Supervisor') || roles[0];
        setFormData({
          name: '',
          email: '',
          mobile: '',
          username: '',
          password: '',
          confirmPassword: '',
          roleId: defaultRole?.id || '',
          status: 'Active'
        });
      }
      setErrors({});
      setShowPassword(false);
      setShowConfirmPassword(false);
    }
  }, [isOpen, initialUser, roles]);

  if (!isOpen) return null;

  // Selected role object & permission preview
  const selectedRole = roles.find(r => r.id === formData.roleId);
  const permissionOverview = selectedRole ? getRolePermissionsOverview(selectedRole) : [];
  const enabledModules = permissionOverview.filter(m => m.isEnabled);

  const handleNameChange = (val) => {
    setFormData(prev => {
      const updated = { ...prev, name: val };
      // Auto-suggest username if user hasn't typed a custom one yet
      if (!isEditing && (!prev.username || prev.username === prev.name.toLowerCase().replace(/\s+/g, '.'))) {
        updated.username = val.toLowerCase().trim().replace(/\s+/g, '.');
      }
      return updated;
    });
    if (errors.name) setErrors(prev => ({ ...prev, name: null }));
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Full Name is required.';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email address is required.';
    } else if (!/^[^\ s@]+@[^\ s@]+\.[^\ s@]+$/.test(formData.email.trim())) {
      newErrors.email = 'Please enter a valid email address.';
    }

    if (!formData.mobile.trim()) {
      newErrors.mobile = 'Mobile number is required.';
    }

    if (!formData.username.trim()) {
      newErrors.username = 'Username is required.';
    }

    // Password validation only on create (not edit)
    if (!isEditing) {
      if (!formData.password) {
        newErrors.password = 'Password is required.';
      } else if (formData.password.length < 8) {
        newErrors.password = 'Password must be at least 8 characters.';
      }

      if (!formData.confirmPassword) {
        newErrors.confirmPassword = 'Please confirm the password.';
      } else if (formData.password && formData.confirmPassword !== formData.password) {
        newErrors.confirmPassword = 'Passwords do not match.';
      }
    }

    if (!formData.roleId) {
      newErrors.roleId = 'Role selection is required.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    const roleObj = roles.find(r => r.id === formData.roleId);

    // IMPORTANT: Password is intentionally excluded from the submitted data object.
    // It is never stored in localStorage, never passed to the user list,
    // and never displayed anywhere outside this form.
    const { password, confirmPassword, ...safeFormData } = formData;

    onSubmit({
      ...safeFormData,
      name: safeFormData.name.trim(),
      email: safeFormData.email.trim(),
      mobile: safeFormData.mobile.trim(),
      username: safeFormData.username.trim(),
      roleName: roleObj ? roleObj.name : 'Custom Role'
    });
  };

  const title = isEditing ? 'Edit HRMS User' : 'Add New HRMS User';
  const subtitle = isEditing
    ? `Update user account and role assignment for ${initialUser?.name}`
    : 'Create a new login user account and assign role permissions';

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-labelledby="user-form-title">
      <div className={styles.modal}>
        {/* Header */}
        <div className={styles.modalHeader}>
          <div className={styles.titleRow}>
            <div className={styles.iconWrap}>
              {isEditing ? <UserCheck size={20} /> : <UserPlus size={20} />}
            </div>
            <div>
              <h2 id="user-form-title" className={styles.modalTitle}>{title}</h2>
              <p className={styles.modalSubtitle}>{subtitle}</p>
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
          {/* SECTION 1: Personal Information */}
          <div className={styles.section}>
            <h3 className={styles.sectionHeading}>
              <User size={15} />
              <span>Personal Information</span>
            </h3>

            <div className={styles.fieldsGrid}>
              <div className={styles.fieldGroupFull}>
                <label htmlFor="user-fullname" className={styles.label}>
                  Full Name <span className={styles.required}>*</span>
                </label>
                <input
                  id="user-fullname"
                  type="text"
                  className={`${styles.input} ${errors.name ? styles.inputError : ''}`}
                  placeholder="e.g. Amit Kumar"
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  autoFocus={!isEditing}
                />
                {errors.name && (
                  <span className={styles.errorText}>
                    <AlertCircle size={12} /> {errors.name}
                  </span>
                )}
              </div>

              <div className={styles.fieldGroup}>
                <label htmlFor="user-email" className={styles.label}>
                  Email Address <span className={styles.required}>*</span>
                </label>
                <input
                  id="user-email"
                  type="email"
                  className={`${styles.input} ${errors.email ? styles.inputError : ''}`}
                  placeholder="e.g. amit@example.com"
                  value={formData.email}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, email: e.target.value }));
                    if (errors.email) setErrors(prev => ({ ...prev, email: null }));
                  }}
                />
                {errors.email && (
                  <span className={styles.errorText}>
                    <AlertCircle size={12} /> {errors.email}
                  </span>
                )}
              </div>

              <div className={styles.fieldGroup}>
                <label htmlFor="user-mobile" className={styles.label}>
                  Mobile Number <span className={styles.required}>*</span>
                </label>
                <input
                  id="user-mobile"
                  type="tel"
                  className={`${styles.input} ${errors.mobile ? styles.inputError : ''}`}
                  placeholder="+91 98765 43210"
                  value={formData.mobile}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, mobile: e.target.value }));
                    if (errors.mobile) setErrors(prev => ({ ...prev, mobile: null }));
                  }}
                />
                {errors.mobile && (
                  <span className={styles.errorText}>
                    <AlertCircle size={12} /> {errors.mobile}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* SECTION 2: Account Information */}
          <div className={styles.section}>
            <h3 className={styles.sectionHeading}>
              <KeyRound size={15} />
              <span>Account Information</span>
            </h3>

            <div className={styles.fieldsGrid}>
              <div className={styles.fieldGroup}>
                <label htmlFor="user-username" className={styles.label}>
                  Username <span className={styles.required}>*</span>
                </label>
                <input
                  id="user-username"
                  type="text"
                  className={`${styles.input} ${errors.username ? styles.inputError : ''}`}
                  placeholder="e.g. amit.kumar"
                  value={formData.username}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, username: e.target.value }));
                    if (errors.username) setErrors(prev => ({ ...prev, username: null }));
                  }}
                />
                {errors.username && (
                  <span className={styles.errorText}>
                    <AlertCircle size={12} /> {errors.username}
                  </span>
                )}
              </div>

              <div className={styles.fieldGroup}>
                <label htmlFor="user-status" className={styles.label}>
                  Account Status
                </label>
                <select
                  id="user-status"
                  className={styles.select}
                  value={formData.status}
                  onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                >
                  <option value="Active">Active (Can log in)</option>
                  <option value="Inactive">Inactive (Login disabled)</option>
                  <option value="Suspended">Suspended (Temporary hold)</option>
                </select>
              </div>

              {/* Password fields — only shown when creating a new user */}
              {!isEditing && (
                <>
                  <div className={styles.fieldGroup}>
                    <label htmlFor="user-password" className={styles.label}>
                      Password <span className={styles.required}>*</span>
                    </label>
                    <div className={styles.passwordWrapper}>
                      <input
                        id="user-password"
                        type={showPassword ? 'text' : 'password'}
                        className={`${styles.input} ${styles.inputPassword} ${errors.password ? styles.inputError : ''}`}
                        placeholder="Enter temporary password"
                        value={formData.password}
                        onChange={(e) => {
                          setFormData(prev => ({ ...prev, password: e.target.value }));
                          if (errors.password) setErrors(prev => ({ ...prev, password: null }));
                          // Re-validate confirm match live
                          if (errors.confirmPassword && e.target.value === formData.confirmPassword) {
                            setErrors(prev => ({ ...prev, confirmPassword: null }));
                          }
                        }}
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        className={styles.eyeBtn}
                        onClick={() => setShowPassword(p => !p)}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        tabIndex={-1}
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {errors.password && (
                      <span className={styles.errorText}>
                        <AlertCircle size={12} /> {errors.password}
                      </span>
                    )}
                  </div>

                  <div className={styles.fieldGroup}>
                    <label htmlFor="user-confirm-password" className={styles.label}>
                      Confirm Password <span className={styles.required}>*</span>
                    </label>
                    <div className={styles.passwordWrapper}>
                      <input
                        id="user-confirm-password"
                        type={showConfirmPassword ? 'text' : 'password'}
                        className={`${styles.input} ${styles.inputPassword} ${
                          errors.confirmPassword ? styles.inputError
                          : formData.confirmPassword && formData.confirmPassword === formData.password ? styles.inputSuccess
                          : ''
                        }`}
                        placeholder="Confirm password"
                        value={formData.confirmPassword}
                        onChange={(e) => {
                          setFormData(prev => ({ ...prev, confirmPassword: e.target.value }));
                          if (errors.confirmPassword) setErrors(prev => ({ ...prev, confirmPassword: null }));
                        }}
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        className={styles.eyeBtn}
                        onClick={() => setShowConfirmPassword(p => !p)}
                        aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                        tabIndex={-1}
                      >
                        {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {errors.confirmPassword && (
                      <span className={styles.errorText}>
                        <AlertCircle size={12} /> {errors.confirmPassword}
                      </span>
                    )}
                    {!errors.confirmPassword && formData.confirmPassword && formData.confirmPassword === formData.password && (
                      <span className={styles.successText}>
                        <Check size={12} /> Passwords match
                      </span>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* SECTION 3: Access & Role Assignment */}
          <div className={styles.section}>
            <h3 className={styles.sectionHeading}>
              <Shield size={15} />
              <span>Access & Role Assignment</span>
            </h3>

            <div className={styles.fieldGroup}>
              <label htmlFor="user-role" className={styles.label}>
                Assigned Role <span className={styles.required}>*</span>
              </label>
              <select
                id="user-role"
                className={`${styles.select} ${errors.roleId ? styles.inputError : ''}`}
                value={formData.roleId}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, roleId: e.target.value }));
                  if (errors.roleId) setErrors(prev => ({ ...prev, roleId: null }));
                }}
              >
                {roles.map(r => (
                  <option key={r.id} value={r.id}>
                    {r.name} ({r.type === 'system' ? 'System Role' : 'Custom Role'})
                  </option>
                ))}
              </select>
              {errors.roleId && (
                <span className={styles.errorText}>
                  <AlertCircle size={12} /> {errors.roleId}
                </span>
              )}
            </div>

            {/* Role Permission Preview Box */}
            {selectedRole && (
              <div className={styles.permissionPreviewCard}>
                <div className={styles.previewHeader}>
                  <div>
                    <span className={styles.previewTitle}>
                      Inherited Permissions for <strong>{selectedRole.name}</strong>
                    </span>
                    <span className={styles.previewSubtitle}>
                      {enabledModules.length} modules granted access
                    </span>
                  </div>

                  {onNavigateToRoles && (
                    <button
                      type="button"
                      className={styles.btnViewFullPerms}
                      onClick={() => onNavigateToRoles(selectedRole)}
                    >
                      <span>View Full Permissions</span>
                      <ExternalLink size={12} />
                    </button>
                  )}
                </div>

                <div className={styles.previewModulesList}>
                  {enabledModules.slice(0, 6).map(mod => (
                    <div key={mod.moduleKey} className={styles.previewModuleItem}>
                      <span className={styles.previewModuleName}>{mod.moduleName}</span>
                      <span className={styles.previewActionLabels}>{mod.actionLabels}</span>
                    </div>
                  ))}
                  {enabledModules.length > 6 && (
                    <div className={styles.previewMoreCount}>
                      + {enabledModules.length - 6} additional modules enabled
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

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
              <Check size={16} />
              <span>{isEditing ? 'Save Changes' : 'Create User'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default UserFormModal;
