import React, { useState } from 'react';
import {
  Key,
  Eye,
  EyeOff,
  Copy,
  Check,
  Send,
  Loader2,
  Smartphone,
  Globe,
  HelpCircle,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
  Info
} from 'lucide-react';
import { authService } from '../../services/authService';
import { useCompany } from '../../context/CompanyContext';
import styles from './LoginAccessStep.module.css';

const API_BASE_URL = import.meta.env.VITE_API_URL;

function LoginAccessStep({ data, onChange, isEditMode = false }) {
  const { activeCompany } = useCompany();
  const [showPassword, setShowPassword] = useState(false);
  const [copiedCompanyId, setCopiedCompanyId] = useState(false);
  const [copiedEmpId, setCopiedEmpId] = useState(false);
  const [copiedPassword, setCopiedPassword] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailStatus, setEmailStatus] = useState({ message: '', type: '' });

  const companyId = data.companyId || activeCompany?.companyId || activeCompany?.id || '';
  const empId = data.employeeCode || data.employeeId || data.empCode || '';
  const empName = data.name || 'Employee';
  const empEmail = (data.email || '').trim();

  const handleFieldChange = (field, value) => {
    onChange({
      ...data,
      [field]: value
    });
    if (emailStatus.message) {
      setEmailStatus({ message: '', type: '' });
    }
  };

  const generatePasswordValue = () => {
    const prefix = (empName ? empName.trim().split(' ')[0] : 'Emp').replace(/[^a-zA-Z]/g, '') || 'Emp';
    const cleanPrefix = prefix.charAt(0).toUpperCase() + prefix.slice(1).toLowerCase();
    const cleanCode = (data.employeeCode || data.employeeId || '123').replace(/[^a-zA-Z0-9]/g, '');
    return `${cleanPrefix}@${cleanCode || '2026'}`;
  };

  const handleGeneratePassword = () => {
    const generated = generatePasswordValue();
    handleFieldChange('password', generated);
    setShowPassword(true);
  };

  const handleCopy = (text, type) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    if (type === 'companyId') {
      setCopiedCompanyId(true);
      setTimeout(() => setCopiedCompanyId(false), 2000);
    } else if (type === 'empId') {
      setCopiedEmpId(true);
      setTimeout(() => setCopiedEmpId(false), 2000);
    } else if (type === 'password') {
      setCopiedPassword(true);
      setTimeout(() => setCopiedPassword(false), 2000);
    }
  };

  const handleSendEmail = async () => {
    if (!empEmail) {
      setEmailStatus({
        message: 'Please enter a valid Registered Login Email below before sending credentials.',
        type: 'error'
      });
      return;
    }

    let passwordToSend = (data.password || '').trim();
    if (!passwordToSend) {
      passwordToSend = generatePasswordValue();
      handleFieldChange('password', passwordToSend);
    }

    setIsSendingEmail(true);
    setEmailStatus({ message: '', type: '' });

    try {
      const token = authService.getToken();
      const compId = data.companyId || activeCompany?.companyId || activeCompany?.id || '';
      const targetId = data._id || data.id;

      const endpoint = targetId
        ? `${API_BASE_URL}/employees/${targetId}/send-credentials`
        : `${API_BASE_URL}/employees/send-credentials-direct`;

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token || ''}`,
          'x-company-id': compId
        },
        body: JSON.stringify({
          recipientEmail: empEmail,
          to: empEmail,
          password: passwordToSend,
          employeeId: empId || 'EMP',
          employeeCode: empId || 'EMP',
          name: empName,
          companyId: compId,
          companyName: activeCompany?.name || data.companyName || ''
        })
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.message || 'Failed to dispatch credentials email.');
      }

      setEmailStatus({
        message: `✓ Login credentials (Username & Password) successfully sent to ${empEmail}!`,
        type: 'success'
      });
    } catch (err) {
      console.error('Failed to send employee credentials:', err);
      setEmailStatus({
        message: err.message || 'Failed to send email. Please check SMTP / internet configuration.',
        type: 'error'
      });
    } finally {
      setIsSendingEmail(false);
    }
  };

  return (
    <div className={styles.wrapper}>
      {/* ========================================================
          1. SECTION HEADER (TITLE & ACTION BUTTONS)
         ======================================================== */}
      <div className={styles.headerBar}>
        <div>
          <h3 className={styles.headerTitle}>Login Access</h3>
          <p className={styles.headerSubtitle}>Manage employee portal credentials, password setup and account permissions.</p>
        </div>
        <div className={styles.headerActions}>
          <button
            type="button"
            className={`${styles.sendEmailBtn} ${emailStatus.type === 'success' ? styles.sendEmailSuccess : ''}`}
            onClick={handleSendEmail}
            disabled={isSendingEmail}
            title="Send credentials directly to employee registered email"
          >
            {isSendingEmail ? (
              <>
                <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />
                <span>Sending Email...</span>
              </>
            ) : emailStatus.type === 'success' ? (
              <>
                <Check size={13} />
                <span>Email Sent</span>
              </>
            ) : (
              <>
                <Send size={13} />
                <span>Send Credentials</span>
              </>
            )}
          </button>
          <button
            type="button"
            className={styles.helpBtn}
            onClick={() => window.open('https://help.example.com', '_blank')}
            title="View login access documentation"
          >
            <HelpCircle size={13} />
            <span>Read Help</span>
          </button>
        </div>
      </div>

      {/* ========================================================
          2. TWO-COLUMN LAYOUT (FORM ON LEFT, SIDEBAR CARDS ON RIGHT)
         ======================================================== */}
      <div className={styles.mainLayout}>
        {/* Left Form Column */}
        <div className={styles.mainForm}>
          {/* Status Alert Notification */}
          {emailStatus.message && (
            <div className={emailStatus.type === 'success' ? styles.statusAlertSuccess : styles.statusAlertError}>
              {emailStatus.type === 'success' ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
              <span>{emailStatus.message}</span>
            </div>
          )}

          {/* Group 1: Account Credentials */}
          <div className={styles.sectionGroup}>
            <h4 className={styles.sectionTitle}>Account Credentials</h4>

            {/* Company ID */}
            <div className={styles.formRow}>
              <label className={styles.rowLabel}>
                <span>Company ID</span>
              </label>
              <div className={styles.rowControl}>
                <div className={styles.inputWithActions}>
                  <input
                    type="text"
                    className={`${styles.input} ${styles.inputReadOnly}`}
                    value={companyId || 'Not Defined'}
                    readOnly
                  />
                  <div className={styles.actionsInside}>
                    <button
                      type="button"
                      className={styles.actionIconBtn}
                      onClick={() => handleCopy(companyId, 'companyId')}
                      title="Copy Company ID"
                      disabled={!companyId}
                    >
                      {copiedCompanyId ? <Check size={13} color="#16a34a" /> : <Copy size={13} />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Employee ID (Username) */}
            <div className={styles.formRow}>
              <label className={styles.rowLabel}>
                <span>Emp ID (Username)</span>
              </label>
              <div className={styles.rowControl}>
                <div className={styles.inputWithActions}>
                  <input
                    type="text"
                    className={`${styles.input} ${styles.inputReadOnly}`}
                    value={empId || 'Auto-generated on save'}
                    readOnly
                  />
                  <div className={styles.actionsInside}>
                    <button
                      type="button"
                      className={styles.actionIconBtn}
                      onClick={() => handleCopy(empId, 'empId')}
                      title="Copy Employee ID"
                      disabled={!empId}
                    >
                      {copiedEmpId ? <Check size={13} color="#16a34a" /> : <Copy size={13} />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Login Password */}
            <div className={styles.formRow}>
              <label className={styles.rowLabel}>
                <span>{isEditMode ? 'Change Password' : 'Login Password'}</span>
                <button
                  type="button"
                  className={styles.autoGenBtn}
                  onClick={handleGeneratePassword}
                  title="Auto generate password"
                >
                  Generate
                </button>
              </label>
              <div className={styles.rowControl}>
                <div className={styles.inputWithActions}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className={styles.input}
                    placeholder={isEditMode ? 'Leave blank to keep current' : 'Enter password'}
                    value={data.password || ''}
                    onChange={(e) => handleFieldChange('password', e.target.value)}
                    autoComplete="new-password"
                  />
                  <div className={styles.actionsInside}>
                    <button
                      type="button"
                      className={styles.actionIconBtn}
                      onClick={() => setShowPassword(!showPassword)}
                      title={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff size={13} /> : <Eye size={13} />}
                    </button>
                    {data.password && (
                      <button
                        type="button"
                        className={styles.actionIconBtn}
                        onClick={() => handleCopy(data.password, 'password')}
                        title="Copy password"
                      >
                        {copiedPassword ? <Check size={13} color="#16a34a" /> : <Copy size={13} />}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Registered Login Email */}
            <div className={styles.formRow}>
              <label htmlFor="login-email" className={styles.rowLabel}>
                <span>Registered Email</span>
                <span className={styles.requiredStar}>*</span>
              </label>
              <div className={styles.rowControl}>
                <input
                  id="login-email"
                  type="email"
                  className={styles.input}
                  placeholder="e.g. employee@company.com"
                  value={data.email || ''}
                  onChange={(e) => handleFieldChange('email', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Group 2: Portal Privileges */}
          <div className={styles.sectionGroup}>
            <h4 className={styles.sectionTitle}>Portal Privileges & Access</h4>

            <div className={styles.permissionsList}>
              {/* Enable Web Portal Access */}
              <label className={`${styles.permissionCard} ${data.enablePortalAccess !== false ? styles.permissionCardActive : ''}`}>
                <input
                  type="checkbox"
                  className={styles.permissionCheckbox}
                  checked={data.enablePortalAccess !== false}
                  onChange={(e) => handleFieldChange('enablePortalAccess', e.target.checked)}
                />
                <div className={styles.permissionInfo}>
                  <div className={styles.permissionHeader}>
                    <Globe size={14} color="#2563eb" />
                    <span>Enable Web Portal Access</span>
                  </div>
                  <p className={styles.permissionDesc}>
                    Allows the employee to log in to the self-service web portal to view payslips, leave balances, and profile documents.
                  </p>
                </div>
              </label>

              {/* Allow Mobile App Login */}
              <label className={`${styles.permissionCard} ${data.allowMobileAppLogin !== false ? styles.permissionCardActive : ''}`}>
                <input
                  type="checkbox"
                  className={styles.permissionCheckbox}
                  checked={data.allowMobileAppLogin !== false}
                  onChange={(e) => handleFieldChange('allowMobileAppLogin', e.target.checked)}
                />
                <div className={styles.permissionInfo}>
                  <div className={styles.permissionHeader}>
                    <Smartphone size={14} color="#059669" />
                    <span>Allow Mobile App Login</span>
                  </div>
                  <p className={styles.permissionDesc}>
                    Permits mobile attendance check-in, geofenced duty punch, site roster view, and instant alerts.
                  </p>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Right Sidebar Cards */}
        <aside className={styles.rightSidebar}>
          {/* Card 1: Portal Access Preview Card */}
          <div className={styles.sideCard}>
            <div className={styles.sideCardHeader}>
              <div>
                <h4 className={styles.sideCardTitle}>Portal Identity</h4>
                <div className={styles.sideCardSubtitle}>Digital access credential overview</div>
              </div>
              <ShieldCheck size={18} color="#2563eb" />
            </div>

            <div className={styles.accessBadgeCard}>
              <div className={styles.accessBadgeTop}>
                <span className={styles.accessBadgeRole}>EMPLOYEE PORTAL</span>
                <span className={styles.accessBadgeStatus}>ACTIVE</span>
              </div>
              <div className={styles.accessBadgeEmpId}>{empId || 'RR-000'}</div>
              <div className={styles.accessBadgeEmpName}>{empName}</div>
            </div>

            <div className={styles.summaryList}>
              <div className={styles.summaryRow}>
                <span className={styles.summaryLabel}>Username</span>
                <span className={styles.summaryValue}>{empId || '—'}</span>
              </div>
              <div className={styles.summaryRow}>
                <span className={styles.summaryLabel}>Password</span>
                <span className={styles.summaryValue}>{data.password ? '••••••••' : (isEditMode ? 'Configured' : 'Not Set')}</span>
              </div>
              <div className={styles.summaryRow}>
                <span className={styles.summaryLabel}>Web Portal</span>
                <span className={styles.summaryValue}>{data.enablePortalAccess !== false ? 'Enabled' : 'Disabled'}</span>
              </div>
              <div className={styles.summaryRow}>
                <span className={styles.summaryLabel}>Mobile App</span>
                <span className={styles.summaryValue}>{data.allowMobileAppLogin !== false ? 'Enabled' : 'Disabled'}</span>
              </div>
            </div>
          </div>

          {/* Card 2: Security & Authentication Guidelines */}
          <div className={styles.noticeCard}>
            <Info size={16} className={styles.noticeIcon} />
            <span>
              Credentials can be dispatched via email. Upon first login, employees are authenticated via their unique Company ID, Username (Emp Code) and assigned password.
            </span>
          </div>
        </aside>
      </div>
    </div>
  );
}

export default LoginAccessStep;
