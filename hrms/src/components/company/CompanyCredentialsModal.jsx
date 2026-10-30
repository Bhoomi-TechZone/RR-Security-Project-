import React, { useState, useEffect } from 'react';
import {
  KeyRound, X, Copy, Check, Eye, EyeOff, Send, Mail,
  ShieldCheck, AlertCircle, CheckCircle2, Globe, ExternalLink
} from 'lucide-react';
import styles from './CompanyCredentialsModal.module.css';

const API_BASE_URL = import.meta.env.VITE_API_URL;

function CompanyCredentialsModal({ isOpen, company, onClose }) {
  const [loading, setLoading] = useState(false);
  const [credentials, setCredentials] = useState(null);
  const [adminEmail, setAdminEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [copiedKey, setCopiedKey] = useState(null);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [feedback, setFeedback] = useState(null); // { type: 'success' | 'error', message: string }

  const compId = company?.companyId || company?.id;

  useEffect(() => {
    if (!isOpen || !compId) {
      setCredentials(null);
      setAdminEmail('');
      setPassword('');
      setShowPassword(false);
      setFeedback(null);
      return;
    }

    const fetchCredentials = async () => {
      setLoading(true);
      setFeedback(null);
      try {
        const token = localStorage.getItem('novaspark_auth_token');
        const res = await fetch(`${API_BASE_URL}/companies/${compId}/credentials`, {
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          }
        });

        const data = await res.json();

        // Determine password with local & backend fallbacks
        const initialPassword =
          data?.credentials?.password ||
          localStorage.getItem(`novaspark_company_password_${compId}`) ||
          company.adminInitialPassword ||
          company.adminPassword ||
          company.password ||
          `${(company.code || company.name?.substring(0, 3) || 'Apex').toUpperCase()}@123`;

        // Determine email with company & local fallbacks
        const initialEmail =
          data?.credentials?.adminEmail ||
          company.adminEmail ||
          localStorage.getItem(`novaspark_company_admin_email_${compId}`) ||
          company.email ||
          '';

        if (data.success && data.credentials) {
          setCredentials(data.credentials);
        } else {
          setCredentials({
            companyId: compId,
            companyName: company.name,
            adminEmail: initialEmail,
            password: initialPassword,
            status: company.status || 'Active'
          });
        }

        setAdminEmail(initialEmail);
        setPassword(initialPassword);
      } catch (err) {
        console.warn('Could not fetch credentials from API, using fallback data:', err);
        const initialEmail =
          company.adminEmail ||
          localStorage.getItem(`novaspark_company_admin_email_${compId}`) ||
          company.email ||
          '';

        const initialPassword =
          localStorage.getItem(`novaspark_company_password_${compId}`) ||
          company.adminInitialPassword ||
          company.adminPassword ||
          company.password ||
          `${(company.code || company.name?.substring(0, 3) || 'Apex').toUpperCase()}@123`;

        setCredentials({
          companyId: compId,
          companyName: company.name,
          adminEmail: initialEmail,
          password: initialPassword,
          status: company.status || 'Active'
        });
        setAdminEmail(initialEmail);
        setPassword(initialPassword);
      } finally {
        setLoading(false);
      }
    };

    fetchCredentials();
  }, [isOpen, compId, company]);

  if (!isOpen || !company) return null;

  const handleCopy = (text, key) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleSendNotification = async () => {
    const targetEmail = adminEmail.trim();
    if (!targetEmail) {
      setFeedback({
        type: 'error',
        message: 'Please provide an email address where credentials should be delivered.'
      });
      return;
    }

    if (!password.trim()) {
      setFeedback({
        type: 'error',
        message: 'Please enter a password to send to the admin.'
      });
      return;
    }

    setSendingEmail(true);
    setFeedback(null);

    try {
      const token = localStorage.getItem('novaspark_auth_token');
      const originLoginUrl = `${window.location.origin}/login`;
      const res = await fetch(`${API_BASE_URL}/companies/${compId}/send-credentials`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          password: password.trim(),
          recipientEmail: targetEmail,
          sendToEmail: targetEmail,
          loginUrl: originLoginUrl
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        // Cache updated password & email in localStorage for instant retrieval
        localStorage.setItem(`novaspark_company_password_${compId}`, password.trim());
        localStorage.setItem(`novaspark_company_admin_email_${compId}`, targetEmail);

        setFeedback({
          type: 'success',
          message: data.message || `Credentials and login portal link successfully sent to ${targetEmail}!`
        });
      } else {
        setFeedback({
          type: 'error',
          message: data.message || 'Failed to dispatch email notification.'
        });
      }
    } catch (err) {
      console.error('Error dispatching credentials email:', err);
      setFeedback({
        type: 'error',
        message: err.message || 'Network error while attempting to send email notification.'
      });
    } finally {
      setSendingEmail(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose} role="dialog" aria-modal="true">
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <div className={styles.iconBadge}>
              <KeyRound size={22} />
            </div>
            <div>
              <h2 className={styles.title}>Company Admin Credentials</h2>
              <p className={styles.subtitle}>
                Manage login credentials and dispatch notification email to company admin
              </p>
            </div>
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close modal">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className={styles.body}>
          {/* Company Mini Card */}
          <div className={styles.companyBanner}>
            <div className={styles.companyInfo}>
              <div className={styles.companyAvatar}>
                {company.logo ? (
                  <img src={company.logo} alt={company.name} className={styles.avatarImg} />
                ) : (
                  company.code ? company.code.substring(0, 3) : company.name.substring(0, 2).toUpperCase()
                )}
              </div>
              <div>
                <div className={styles.companyName}>{company.name}</div>
                <div className={styles.companyCode}>ID: {compId} • Code: {company.code}</div>
              </div>
            </div>
            <span
              className={styles.statusPill}
              style={{
                background: company.status === 'Inactive' ? '#fee2e2' : '#f0fdf4',
                color: company.status === 'Inactive' ? '#b91c1c' : '#15803d',
                borderColor: company.status === 'Inactive' ? '#fecaca' : '#bbf7d0',
              }}
            >
              {company.status || 'Active'}
            </span>
          </div>

          {/* Feedback Banner */}
          {feedback && (
            <div className={`${styles.alertBox} ${feedback.type === 'success' ? styles.alertSuccess : styles.alertError}`}>
              {feedback.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
              <span>{feedback.message}</span>
            </div>
          )}

          {/* Credentials Container */}
          <div className={styles.credCard}>
            {/* Editable Admin Email */}
            <div className={styles.credRow}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className={styles.credLabel}>
                  <Mail size={14} color="#2563eb" /> Administrator Email (Send To)
                </label>
                <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 500 }}>
                  Editable
                </span>
              </div>
              <div className={styles.credValueBox}>
                <input
                  type="email"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  placeholder="Enter administrator email address"
                  className={styles.credInput}
                />
                <div className={styles.credActions}>
                  <button
                    type="button"
                    className={`${styles.iconBtn} ${copiedKey === 'email' ? styles.copied : ''}`}
                    onClick={() => handleCopy(adminEmail, 'email')}
                    title="Copy Email"
                  >
                    {copiedKey === 'email' ? <Check size={14} /> : <Copy size={14} />}
                  </button>
                </div>
              </div>
              <span style={{ fontSize: '11.5px', color: '#64748b' }}>
                Shows the admin email added with company. You can change this to any email to redirect the notification.
              </span>
            </div>

            {/* Admin Password */}
            <div className={styles.credRow}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className={styles.credLabel}>
                  <KeyRound size={14} color="#2563eb" /> Admin Password
                </label>
                <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 500 }}>
                  {showPassword ? 'Visible' : 'Hidden'}
                </span>
              </div>
              <div className={styles.credValueBox}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={loading ? 'Fetching credentials...' : 'Enter or update password'}
                  className={styles.credInput}
                />
                <div className={styles.credActions}>
                  <button
                    type="button"
                    className={styles.iconBtn}
                    onClick={() => setShowPassword(!showPassword)}
                    title={showPassword ? 'Hide Password' : 'Show Password'}
                  >
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                  <button
                    type="button"
                    className={`${styles.iconBtn} ${copiedKey === 'pwd' ? styles.copied : ''}`}
                    onClick={() => handleCopy(password, 'pwd')}
                    disabled={!password}
                    title="Copy Password"
                  >
                    {copiedKey === 'pwd' ? <Check size={14} /> : <Copy size={14} />}
                  </button>
                </div>
              </div>
              <span style={{ fontSize: '11.5px', color: '#64748b' }}>
                Set during company creation. You can edit this to assign a new password.
              </span>
            </div>

            {/* Portal Login Link */}
            <div className={styles.credRow} style={{ marginTop: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className={styles.credLabel}>
                  <Globe size={14} color="#2563eb" /> Portal Login Link (Included in Email)
                </label>
                <a
                  href={`${window.location.origin}/login`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    fontSize: '11px',
                    color: '#2563eb',
                    fontWeight: 600,
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '3px'
                  }}
                >
                  <span>Open Page</span>
                  <ExternalLink size={11} />
                </a>
              </div>
              <div className={styles.credValueBox} style={{ background: '#f8fafc' }}>
                <input
                  type="text"
                  value={`${window.location.origin}/login`}
                  readOnly
                  className={styles.credInput}
                  style={{ color: '#2563eb', fontWeight: 600, cursor: 'text' }}
                />
                <div className={styles.credActions}>
                  <button
                    type="button"
                    className={`${styles.iconBtn} ${copiedKey === 'loginUrl' ? styles.copied : ''}`}
                    onClick={() => handleCopy(`${window.location.origin}/login`, 'loginUrl')}
                    title="Copy Portal Login URL"
                  >
                    {copiedKey === 'loginUrl' ? <Check size={14} /> : <Copy size={14} />}
                  </button>
                </div>
              </div>
              <span style={{ fontSize: '11.5px', color: '#64748b' }}>
                Company admin will receive this link to sign in directly to their isolated workspace.
              </span>
            </div>
          </div>

          {/* Security & Notification Notice */}
          <div className={styles.securityNote}>
            <ShieldCheck size={18} style={{ flexShrink: 0, marginTop: 1 }} />
            <div>
              Clicking <strong>Send Notification</strong> will dispatch an onboarding email containing the <strong>Portal Login Link</strong> ({window.location.origin}/login), username, password, and complete company details directly to <strong>{adminEmail || 'the specified email'}</strong>.
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <button
            type="button"
            className={styles.closeModalBtn}
            onClick={onClose}
          >
            Close
          </button>
          <button
            type="button"
            className={styles.sendBtn}
            onClick={handleSendNotification}
            disabled={sendingEmail || !password.trim() || !adminEmail.trim()}
          >
            {sendingEmail ? (
              <>
                <div className={styles.spinner} />
                <span>Sending Email...</span>
              </>
            ) : (
              <>
                <Send size={15} />
                <span>Send Notification</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default CompanyCredentialsModal;
