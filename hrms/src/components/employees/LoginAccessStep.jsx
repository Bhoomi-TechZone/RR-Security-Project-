import React, { useState } from 'react';
import {
  Key,
  Eye,
  EyeOff,
  Sparkles,
  Copy,
  Check,
  Send,
  Loader2,
  Smartphone,
  Globe,
  Mail,
  Info,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import styles from './EmployeeFormSteps.module.css';
import { authService } from '../../services/authService';
import { useCompany } from '../../context/CompanyContext';

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

  // Dispatch Login ID & Password directly to Employee Registered Email
  const handleSendEmail = async () => {
    if (!empEmail) {
      setEmailStatus({
        message: 'Please enter a valid Registered Login Email below before sending credentials.',
        type: 'error'
      });
      return;
    }

    // If password is not yet entered, generate one automatically so the employee receives valid credentials
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
    <div className={styles.stepContainer}>
      {/* Information Banner */}
      <div className={styles.credentialsBanner}>
        <Info size={16} style={{ flexShrink: 0, marginTop: 2 }} />
        <div>
          <strong>Employee Authentication Credentials</strong>
          <div>
            These credentials permit the employee to authenticate into the RR Security Mobile App and Employee Self-Service Web Portal. You can set their password and send it directly to their registered email.
          </div>
        </div>
      </div>

      {/* Main Credentials Card */}
      <div className={styles.credentialsCard}>
        <div className={styles.credentialsHeader}>
          <div className={styles.credentialsHeaderLeft}>
            <div className={styles.credentialsIconBox}>
              <Key size={18} />
            </div>
            <div>
              <h4 className={styles.credentialsTitle}>
                Login Credentials
                <span className={styles.badge} style={{ background: '#ecfdf5', color: '#059669', fontSize: 11, padding: '2px 8px', borderRadius: 4, fontWeight: 600 }}>
                  Active System Account
                </span>
              </h4>
              <p className={styles.credentialsSubtitle}>
                Manage employee portal user identity, password and dispatch credentials
              </p>
            </div>
          </div>

          {/* Send Email Action Button */}
          <button
            type="button"
            className={`${styles.sendEmailBtn} ${emailStatus.type === 'success' ? styles.sendEmailSuccess : ''}`}
            onClick={handleSendEmail}
            disabled={isSendingEmail}
            title="Dispatch login credentials directly to employee registered email"
          >
            {isSendingEmail ? (
              <>
                <Loader2 size={13} className={styles.spinner} />
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
                <span>Send Email</span>
              </>
            )}
          </button>
        </div>

        {/* Email Status Notification Banner */}
        {emailStatus.message && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 14px',
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 500,
              background: emailStatus.type === 'success' ? '#f0fdf4' : '#fef2f2',
              color: emailStatus.type === 'success' ? '#15803d' : '#b91c1c',
              border: `1px solid ${emailStatus.type === 'success' ? '#bbf7d0' : '#fecaca'}`
            }}
          >
            {emailStatus.type === 'success' ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
            <span>{emailStatus.message}</span>
          </div>
        )}

        {/* Credentials Grid */}
        <div className={styles.credentialsGrid}>
          {/* 1. Company ID */}
          <div className={styles.fieldGroup}>
            <label className={styles.label}>
              Company ID
            </label>
            <div className={styles.passwordInputWrapper}>
              <input
                type="text"
                className={styles.input}
                value={companyId || 'Not Defined'}
                readOnly
                style={{ backgroundColor: '#f8fafc', fontWeight: 600, color: '#0f172a' }}
              />
              <div className={styles.passwordActionButtons}>
                <button
                  type="button"
                  className={styles.iconButton}
                  onClick={() => handleCopy(companyId, 'companyId')}
                  title="Copy Company ID"
                  disabled={!companyId}
                >
                  {copiedCompanyId ? <Check size={14} style={{ color: '#16a34a' }} /> : <Copy size={14} />}
                </button>
              </div>
            </div>
            <span style={{ fontSize: 11, color: '#64748b' }}>
              Organization identifier required for mobile app & portal authentication
            </span>
          </div>

          {/* 2. Employee ID (Emp ID) */}
          <div className={styles.fieldGroup}>
            <label className={styles.label}>
              Emp ID (Username)
            </label>
            <div className={styles.passwordInputWrapper}>
              <input
                type="text"
                className={styles.input}
                value={empId || 'Auto-generated on save'}
                readOnly
                style={{ backgroundColor: '#f8fafc', fontWeight: 600, color: '#0f172a' }}
              />
              <div className={styles.passwordActionButtons}>
                <button
                  type="button"
                  className={styles.iconButton}
                  onClick={() => handleCopy(empId, 'empId')}
                  title="Copy Employee ID"
                  disabled={!empId}
                >
                  {copiedEmpId ? <Check size={14} style={{ color: '#16a34a' }} /> : <Copy size={14} />}
                </button>
              </div>
            </div>
            <span style={{ fontSize: 11, color: '#64748b' }}>
              Unique employee ID used to authenticate into web portal and mobile app
            </span>
          </div>

          {/* 2. Password & Change Password */}
          <div className={styles.fieldGroup}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <label className={styles.label}>
                {isEditMode ? 'Change Password' : 'Login Password'}
              </label>
              <button
                type="button"
                onClick={handleGeneratePassword}
                style={{ background: 'none', border: 'none', color: '#2563eb', fontSize: 11, fontWeight: 600, cursor: 'pointer', padding: 0 }}
                title="Auto generate password"
              >
                Auto-generate
              </button>
            </div>
            <div className={styles.passwordInputWrapper}>
              <input
                type={showPassword ? 'text' : 'password'}
                className={styles.input}
                placeholder={isEditMode ? 'Leave blank to keep existing password' : 'Enter login password'}
                value={data.password || ''}
                onChange={(e) => handleFieldChange('password', e.target.value)}
                autoComplete="new-password"
              />
              <div className={styles.passwordActionButtons}>
                <button
                  type="button"
                  className={styles.iconButton}
                  onClick={() => setShowPassword(!showPassword)}
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
                {data.password && (
                  <button
                    type="button"
                    className={styles.iconButton}
                    onClick={() => handleCopy(data.password, 'password')}
                    title="Copy password"
                  >
                    {copiedPassword ? <Check size={14} style={{ color: '#16a34a' }} /> : <Copy size={14} />}
                  </button>
                )}
              </div>
            </div>
            <span style={{ fontSize: 11, color: '#64748b' }}>
              {isEditMode
                ? 'Type a new password to update/reset. Minimum 6 characters.'
                : 'Initial login password. Minimum 6 characters.'}
            </span>
          </div>

          {/* 3. Account Registered Email */}
          <div className={styles.fieldGroup}>
            <label className={styles.label}>
              Registered Login Email <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="email"
              className={styles.input}
              placeholder="e.g. employee@company.com"
              value={data.email || ''}
              onChange={(e) => handleFieldChange('email', e.target.value)}
            />
            <span style={{ fontSize: 11, color: '#64748b' }}>
              Credentials and password notification will be dispatched here
            </span>
          </div>
        </div>

        {/* Access Permissions & Privileges */}
        <div style={{ marginTop: 12, paddingTop: 16, borderTop: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>
            Portal Access & Privileges
          </span>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
            {/* Enable Web Portal Access */}
            <label
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 12,
                padding: '12px 14px',
                border: '1px solid #e2e8f0',
                borderRadius: 8,
                background: data.enablePortalAccess !== false ? '#f8fafc' : '#ffffff',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <input
                type="checkbox"
                checked={data.enablePortalAccess !== false}
                onChange={(e) => handleFieldChange('enablePortalAccess', e.target.checked)}
                style={{ marginTop: 3 }}
              />
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600, fontSize: 13, color: '#0f172a' }}>
                  <Globe size={14} style={{ color: '#2563eb' }} />
                  <span>Enable Web Portal Access</span>
                </div>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                  Allow employee to sign in to the self-service web portal to view payslips, leave balances, and profile.
                </div>
              </div>
            </label>

            {/* Allow Mobile App Login */}
            <label
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 12,
                padding: '12px 14px',
                border: '1px solid #e2e8f0',
                borderRadius: 8,
                background: data.allowMobileAppLogin !== false ? '#f8fafc' : '#ffffff',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <input
                type="checkbox"
                checked={data.allowMobileAppLogin !== false}
                onChange={(e) => handleFieldChange('allowMobileAppLogin', e.target.checked)}
                style={{ marginTop: 3 }}
              />
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600, fontSize: 13, color: '#0f172a' }}>
                  <Smartphone size={14} style={{ color: '#059669' }} />
                  <span>Allow Mobile App Login</span>
                </div>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                  Permit mobile attendance punch-in, geo-fenced duty checks, and instant push notifications.
                </div>
              </div>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginAccessStep;
