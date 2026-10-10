import React, { useState, useEffect, useRef } from 'react';
import { X, Key, Eye, EyeOff, Sparkles, ShieldCheck, Copy, Check, Lock, Loader2, Mail, Send, AlertCircle } from 'lucide-react';
import styles from './ClientCredentialsModal.module.css';

// Real-time RFC compliant email regex validator
const isValidEmailAddress = (email) => {
  if (!email || typeof email !== 'string') return false;
  const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return regex.test(email.trim());
};

/**
 * ClientCredentialsModal Component
 * Allows admin to view Client ID, set/reset login password, toggle portal access,
 * and input recipient email with real-time validation to dispatch credentials.
 */
function ClientCredentialsModal({
  isOpen,
  client,
  onClose,
  onSave
}) {
  const [password, setPassword] = useState('');
  const [enablePortalAccess, setEnablePortalAccess] = useState(true);
  const [recipientEmail, setRecipientEmail] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailTouched, setEmailTouched] = useState(false);
  const modalRef = useRef(null);

  useEffect(() => {
    if (isOpen && client) {
      const existingPass = client.savedPassword || client.password || '';
      setPassword(existingPass);
      setEnablePortalAccess(client.enablePortalAccess !== false && client.enablePortalAccess !== 'false');
      setRecipientEmail((client.email || client.authorizedSignatoryEmail || client.contactPersonEmail || '').trim());
      setShowPassword(false);
      setCopied(false);
      setError('');
      setIsSubmitting(false);
      setIsSendingEmail(false);
      setEmailTouched(false);
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

  const isEmailValid = isValidEmailAddress(recipientEmail);
  const hasEmailInput = recipientEmail.trim().length > 0;
  const showEmailError = hasEmailInput && !isEmailValid;

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

  // Regular Save without sending email
  const handleSaveOnly = async (e) => {
    if (e) e.preventDefault();
    if (password && password.length < 6) {
      setError('Please enter a secure password with at least 6 characters.');
      return;
    }

    if (!password && enablePortalAccess && !client.password && !client.savedPassword) {
      setError('Please set an account password for this client to enable portal login access.');
      return;
    }

    const cleanEmail = recipientEmail.trim();
    if (cleanEmail && !isValidEmailAddress(cleanEmail)) {
      setError('Please enter a valid email address (e.g. client@company.com).');
      return;
    }

    setIsSubmitting(true);
    setError('');
    try {
      await onSave(client.id || client._id || client.clientId, {
        ...(password ? { password } : {}),
        ...(cleanEmail ? { email: cleanEmail } : {}),
        enablePortalAccess: Boolean(enablePortalAccess),
        sendWelcomeEmail: false,
        recipientEmail: cleanEmail
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to update client credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Save and Dispatch Email Notification directly to entered recipientEmail
  const handleSaveAndSendEmail = async () => {
    if (password && password.length < 6) {
      setError('Please enter a secure password with at least 6 characters.');
      return;
    }

    if (!password && enablePortalAccess && !client.password && !client.savedPassword) {
      setError('Please set an account password for this client before sending credentials.');
      return;
    }

    const cleanEmail = recipientEmail.trim();
    if (!cleanEmail || !isValidEmailAddress(cleanEmail)) {
      setError('Please enter a valid email address (e.g. client@company.com) to send credentials.');
      return;
    }

    setIsSendingEmail(true);
    setError('');
    try {
      await onSave(client.id || client._id || client.clientId, {
        ...(password ? { password } : {}),
        email: cleanEmail,
        enablePortalAccess: Boolean(enablePortalAccess),
        sendWelcomeEmail: true,
        recipientEmail: cleanEmail
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to dispatch client credentials email.');
    } finally {
      setIsSendingEmail(false);
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

        <form onSubmit={handleSaveOnly} className={styles.form}>
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
                Contact: {client.contactPerson || 'Authorized Representative'} {client.contactNumber ? `• ${client.contactNumber}` : ''}
              </div>
            </div>
          </div>

          {error && <div className={styles.errorAlert} role="alert">{error}</div>}

          {/* 2-Column Form Grid */}
          <div className={styles.formGrid}>
            {/* Left Column: Client Login ID (Read-only) */}
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

            {/* Right Column: Set / View Password */}
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
                  placeholder="Enter or generate password (min 6 chars)"
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

            {/* Left Column: Portal Access Status */}
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
              <span className={styles.fieldHint}>
                Controls whether client can access deployed workforce & billing portal.
              </span>
            </div>

            {/* Right Column: Editable Client Recipient Email Field with Real-time Validation */}
            <div className={styles.field}>
              <div className={styles.fieldLabelRow}>
                <label htmlFor="cred-email" className={styles.fieldLabel}>
                  Recipient Email Address *
                </label>
                {isEmailValid ? (
                  <span className={styles.verifiedTag}>
                    <Check size={11} strokeWidth={2.5} /> Valid Email
                  </span>
                ) : showEmailError ? (
                  <span className={styles.invalidTag}>
                    <AlertCircle size={11} strokeWidth={2.5} /> Invalid Email
                  </span>
                ) : null}
              </div>
              <div className={styles.inputWrapper}>
                <div className={`${styles.inputPrefixIcon} ${showEmailError ? styles.prefixIconError : isEmailValid ? styles.prefixIconSuccess : ''}`}>
                  <Mail size={15} />
                </div>
                <input
                  id="cred-email"
                  type="email"
                  className={`${styles.input} ${styles.inputWithPrefix} ${showEmailError ? styles.inputError : isEmailValid ? styles.inputSuccess : ''}`}
                  placeholder="Enter recipient email"
                  value={recipientEmail}
                  onChange={(e) => {
                    setRecipientEmail(e.target.value);
                    setEmailTouched(true);
                    if (error) setError('');
                  }}
                  onBlur={() => setEmailTouched(true)}
                  autoComplete="email"
                  spellCheck="false"
                />
              </div>
              {showEmailError ? (
                <span className={styles.fieldErrorHint}>
                  Please enter a valid email address (e.g. name@company.com)
                </span>
              ) : isEmailValid ? (
                <span className={styles.fieldSuccessHint}>
                  ✓ Ready to dispatch credentials to {recipientEmail.trim()}
                </span>
              ) : (
                <span className={styles.fieldHint}>
                  Please enter valid email to send credentials.
                </span>
              )}
            </div>
          </div>

          {/* Login Guideline Banner */}
          <div className={styles.infoBanner}>
            <ShieldCheck size={18} style={{ flexShrink: 0, marginTop: '1px', color: '#2563eb' }} />
            <div>
              The client representative can log into the client portal at <strong>/login</strong> using their <strong>Client ID ({clientId})</strong> or <strong>Email ({recipientEmail.trim() || 'specified email'})</strong> with this password.
            </div>
          </div>

          {/* Action Buttons */}
          <div className={styles.actions}>
            <button
              type="button"
              className={styles.cancelBtn}
              onClick={onClose}
              disabled={isSubmitting || isSendingEmail}
            >
              Cancel
            </button>

            {/* Regular Save without sending email */}
            <button
              type="submit"
              className={styles.saveOnlyBtn}
              disabled={isSubmitting || isSendingEmail}
              title="Save credentials without sending an email notification"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={14} className={styles.spinner} />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Lock size={14} />
                  <span>Save Only</span>
                </>
              )}
            </button>

            {/* Dedicated Send Notification Button (Only enabled when email is strictly valid) */}
            <button
              type="button"
              className={styles.sendEmailBtn}
              onClick={handleSaveAndSendEmail}
              disabled={isSubmitting || isSendingEmail || !isEmailValid}
              title={isEmailValid ? `Save credentials and email them to ${recipientEmail.trim()}` : 'Please enter a valid email address first'}
            >
              {isSendingEmail ? (
                <>
                  <Loader2 size={14} className={styles.spinner} />
                  <span>Sending Mail...</span>
                </>
              ) : (
                <>
                  <Send size={14} />
                  <span>Send Notification</span>
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
