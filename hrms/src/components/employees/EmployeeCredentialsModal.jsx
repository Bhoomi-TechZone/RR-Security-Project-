import React, { useState, useEffect, useRef } from 'react';
import { X, Key, Eye, EyeOff, Sparkles, ShieldCheck, Copy, Check, Lock, Loader2 } from 'lucide-react';
import styles from './EmployeeCredentialsModal.module.css';

/**
 * EmployeeCredentialsModal Component
 * Allows admin to view Employee Login ID, set/reset login password, and toggle portal access.
 */
function EmployeeCredentialsModal({
  isOpen,
  employee,
  onClose,
  onSave
}) {
  const [password, setPassword] = useState('');
  const [enablePortalAccess, setEnablePortalAccess] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const modalRef = useRef(null);

  useEffect(() => {
    if (isOpen && employee) {
      const existingPass = employee.savedPassword || employee.password || '';
      setPassword(existingPass);
      setEnablePortalAccess(employee.enablePortalAccess !== false && employee.enablePortalAccess !== 'false');
      setShowPassword(false);
      setCopied(false);
      setError('');
      setIsSubmitting(false);
    }
  }, [isOpen, employee]);

  useEffect(() => {
    if (isOpen && modalRef.current) {
      modalRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !employee) return null;

  const loginId = employee.employeeId || employee.employeeCode || employee.id || '';
  const empName = employee.name || 'Employee';
  const initial = empName.charAt(0).toUpperCase();

  const handleGeneratePassword = () => {
    const prefix = (empName ? empName.trim().split(' ')[0] : 'Emp').replace(/[^a-zA-Z]/g, '') || 'Emp';
    const cleanPrefix = prefix.charAt(0).toUpperCase() + prefix.slice(1).toLowerCase();
    const cleanCode = (employee.employeeCode || employee.employeeId || '123').replace(/[^a-zA-Z0-9]/g, '');
    const generated = `${cleanPrefix}@${cleanCode || '2026'}`;
    setPassword(generated);
    setShowPassword(true);
    setError('');
  };

  const handleCopyLoginId = () => {
    if (loginId) {
      navigator.clipboard.writeText(loginId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password && password.length < 6) {
      setError('Please enter a secure password with at least 6 characters.');
      return;
    }

    if (!password && enablePortalAccess && !employee.password && !employee.savedPassword) {
      setError('Please set an account password for this employee to enable login access.');
      return;
    }

    setIsSubmitting(true);
    setError('');
    try {
      await onSave(employee.id || employee._id || employee.employeeId, {
        ...(password ? { password } : {}),
        enablePortalAccess: Boolean(enablePortalAccess)
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to update credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-labelledby="credentials-modal-title">
      <div
        ref={modalRef}
        tabIndex="-1"
        className={styles.modal}
        onClick={(e) => e.stopPropagation()}
      >
        <header className={styles.header}>
          <div className={styles.headerTitleRow}>
            <div className={styles.iconWrap}>
              <Key size={18} strokeWidth={2.2} />
            </div>
            <div>
              <h2 id="credentials-modal-title" className={styles.title}>Employee Login Credentials</h2>
              <p className={styles.subtitle}>View, change password and manage self-service portal access</p>
            </div>
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close modal">
            <X size={16} />
          </button>
        </header>

        <form onSubmit={handleSubmit} className={styles.form}>
          {/* Employee Summary Card */}
          <div className={styles.employeeCard}>
            <div className={styles.avatarBox}>
              {employee.employeePhoto && employee.employeePhoto.startsWith('data:') ? (
                <img src={employee.employeePhoto} alt={empName} className={styles.avatarImg} />
              ) : (
                <span>{initial}</span>
              )}
            </div>
            <div className={styles.empMeta}>
              <div className={styles.empNameRow}>
                <span className={styles.empName}>{empName}</span>
                <span className={styles.empIdBadge}>ID: {loginId}</span>
              </div>
              <div className={styles.empSub}>
                {employee.designation || 'Staff'} • {employee.department || 'Operations'} • {employee.clientName || employee.companyName || 'RR Security'}
              </div>
            </div>
          </div>

          {error && <div className={styles.errorAlert} role="alert">{error}</div>}

          {/* Login Username / ID (Read-only) */}
          <div className={styles.field}>
            <div className={styles.fieldLabelRow}>
              <label htmlFor="cred-login-id" className={styles.fieldLabel}>
                Employee Login ID / Username
              </label>
              <button
                type="button"
                className={styles.quickGenBtn}
                onClick={handleCopyLoginId}
                title="Copy login ID to clipboard"
              >
                {copied ? <Check size={12} color="#16a34a" /> : <Copy size={12} />}
                <span>{copied ? 'Copied' : 'Copy ID'}</span>
              </button>
            </div>
            <div className={styles.inputWrapper}>
              <input
                id="cred-login-id"
                type="text"
                className={`${styles.input} ${styles.readOnlyInput}`}
                value={loginId}
                readOnly
                disabled
                tabIndex="-1"
              />
            </div>
          </div>

          {/* View / Change Password */}
          <div className={styles.field}>
            <div className={styles.fieldLabelRow}>
              <label htmlFor="cred-password" className={styles.fieldLabel}>
                Account Password *
              </label>
              <button
                type="button"
                className={styles.quickGenBtn}
                onClick={handleGeneratePassword}
                title="Auto-generate a new secure password"
              >
                <Sparkles size={12} />
                <span>Generate New</span>
              </button>
            </div>
            <div className={styles.inputWrapper}>
              <input
                id="cred-password"
                type={showPassword ? 'text' : 'password'}
                className={`${styles.input} ${styles.inputWithBtn}`}
                placeholder="Enter or change password (min 6 chars, e.g. Emp@123)"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError('');
                }}
                autoComplete="new-password"
              />
              <button
                type="button"
                className={styles.inputActionBtn}
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'View password'}
                title={showPassword ? 'Hide password' : 'View password'}
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {/* Portal Access Status */}
          <div className={styles.field}>
            <label htmlFor="cred-portal-access" className={styles.fieldLabel}>
              Self-Service Portal Access
            </label>
            <select
              id="cred-portal-access"
              className={styles.select}
              value={enablePortalAccess ? 'true' : 'false'}
              onChange={(e) => setEnablePortalAccess(e.target.value === 'true')}
            >
              <option value="true">Enabled (Employee can login)</option>
              <option value="false">Disabled (Login blocked)</option>
            </select>
          </div>

          {/* Login Guideline Banner */}
          <div className={styles.infoBanner}>
            <ShieldCheck size={18} style={{ flexShrink: 0, marginTop: '1px', color: '#2563eb' }} />
            <div>
              The employee can log into the self-service portal at <strong>/login</strong> using their <strong>Employee ID ({loginId})</strong> or <strong>Email ({employee.email || 'corporate email'})</strong> with this password.
            </div>
          </div>

          {/* Action Buttons */}
          <div className={styles.actions}>
            <button type="button" className={styles.cancelBtn} onClick={onClose} disabled={isSubmitting}>
              Cancel
            </button>
            <button type="submit" className={styles.submitBtn} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 size={14} className={styles.spinner} />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Lock size={14} />
                  <span>Save Credentials</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EmployeeCredentialsModal;
