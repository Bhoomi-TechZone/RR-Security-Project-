import React, { useState, useEffect, useRef } from 'react';
import { X, Key, Eye, EyeOff, Sparkles, ShieldCheck, Copy, Check, Lock, Loader2 } from 'lucide-react';
import styles from './ClientCredentialsModal.module.css';

/**
 * ClientCredentialsModal Component
 * Allows admin to view Client ID, set/reset login password, and toggle client portal access.
 */
function ClientCredentialsModal({
  isOpen,
  client,
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
    if (isOpen && client) {
      const existingPass = client.savedPassword || client.password || '';
      setPassword(existingPass);
      setEnablePortalAccess(client.enablePortalAccess !== false && client.enablePortalAccess !== 'false');
      setShowPassword(false);
      setCopied(false);
      setError('');
      setIsSubmitting(false);
    }
  }, [isOpen, client]);

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

  if (!isOpen || !client) return null;

  const clientId = client.clientId || client.id || '';
  const clientName = client.name || 'Client';
  const initial = (client.initials || clientName.substring(0, 2)).toUpperCase();

  const handleGeneratePassword = () => {
    const cleanName = (clientName ? clientName.trim().split(' ')[0] : 'Client').replace(/[^a-zA-Z]/g, '') || 'Client';
    const cleanPrefix = cleanName.charAt(0).toUpperCase() + cleanName.slice(1).toLowerCase();
    const cleanCode = (clientId || '001').replace(/[^a-zA-Z0-9]/g, '');
    const generated = `${cleanPrefix}@${cleanCode || '2026'}`;
    setPassword(generated);
    setShowPassword(true);
    setError('');
  };

  const handleCopyClientId = () => {
    if (clientId) {
      navigator.clipboard.writeText(clientId);
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

    if (!password && enablePortalAccess && !client.password && !client.savedPassword) {
      setError('Please set an account password for this client to enable portal login access.');
      return;
    }

    setIsSubmitting(true);
    setError('');
    try {
      await onSave(client.id || client._id || client.clientId, {
        ...(password ? { password } : {}),
        enablePortalAccess: Boolean(enablePortalAccess)
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to update client credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-labelledby="client-credentials-modal-title">
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
              <h2 id="client-credentials-modal-title" className={styles.title}>Client Login Credentials</h2>
              <p className={styles.subtitle}>View, set password and manage client portal login access</p>
            </div>
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close modal">
            <X size={16} />
          </button>
        </header>

        <form onSubmit={handleSubmit} className={styles.form}>
          {/* Client Summary Card */}
          <div className={styles.clientCard}>
            <div className={styles.avatarBox}>
              <span>{initial}</span>
            </div>
            <div className={styles.clientMeta}>
              <div className={styles.clientNameRow}>
                <span className={styles.clientName}>{clientName}</span>
                <span className={styles.clientIdBadge}>{clientId}</span>
              </div>
              <div className={styles.clientSub}>
                Contact: {client.contactPerson || 'N/A'} {client.contactNumber ? `• ${client.contactNumber}` : ''}
              </div>
            </div>
          </div>

          {error && <div className={styles.errorAlert} role="alert">{error}</div>}

          {/* Client Login ID (Read-only) */}
          <div className={styles.field}>
            <div className={styles.fieldLabelRow}>
              <label htmlFor="cred-client-id" className={styles.fieldLabel}>
                Client Login ID / Username
              </label>
              <button
                type="button"
                className={styles.quickGenBtn}
                onClick={handleCopyClientId}
                title="Copy Client ID to clipboard"
              >
                {copied ? <Check size={12} color="#16a34a" /> : <Copy size={12} />}
                <span>{copied ? 'Copied' : 'Copy ID'}</span>
              </button>
            </div>
            <div className={styles.inputWrapper}>
              <input
                id="cred-client-id"
                type="text"
                className={`${styles.input} ${styles.readOnlyInput}`}
                value={clientId}
                readOnly
                disabled
                tabIndex="-1"
              />
            </div>
          </div>

          {/* Set / View Password */}
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
                placeholder="Enter or change password (min 6 chars, e.g. Tech@001)"
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
              Client Portal Login Access
            </label>
            <select
              id="cred-portal-access"
              className={styles.select}
              value={enablePortalAccess ? 'true' : 'false'}
              onChange={(e) => setEnablePortalAccess(e.target.value === 'true')}
            >
              <option value="true">Enabled (Client can login)</option>
              <option value="false">Disabled (Login blocked)</option>
            </select>
          </div>

          {/* Login Guideline Banner */}
          <div className={styles.infoBanner}>
            <ShieldCheck size={18} style={{ flexShrink: 0, marginTop: '1px', color: '#2563eb' }} />
            <div>
              The client representative can log into the client portal at <strong>/login</strong> using their <strong>Client ID ({clientId})</strong> with this password.
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

export default ClientCredentialsModal;
