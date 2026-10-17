import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Zap, KeyRound, ArrowLeft, Mail, CheckCircle2, ExternalLink } from 'lucide-react';
import FormInput from '../../components/common/FormInput';
import PrimaryButton from '../../components/common/PrimaryButton';
import AlertMessage from '../../components/common/AlertMessage';
import authService from '../../services/authService';
import styles from './ForgotPassword.module.css';

/**
 * ForgotPassword Page — /forgot-password
 *
 * Supports password reset for all system roles:
 * - Admin (Corporate Email)
 * - Employee (Employee ID or Email)
 * - Client (Client ID or Email)
 * - User / Sub-admin (User ID or Email)
 */
function ForgotPassword() {
  const [identifier, setIdentifier] = useState('');
  const [error, setError]           = useState('');
  const [loading, setLoading]       = useState(false);
  const [sentResult, setSentResult] = useState(null); // { maskedEmail, identifier, userType, devResetUrl }

  function validate(value) {
    if (!value.trim()) {
      return 'Please enter your Corporate Email, Employee ID, Client ID, or User ID.';
    }
    return '';
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const err = validate(identifier);
    if (err) {
      setError(err);
      return;
    }
    setError('');
    setLoading(true);

    try {
      const result = await authService.forgotPassword(identifier.trim());
      setSentResult(result);
    } catch (apiError) {
      setError(apiError.message || 'Unable to process reset request. Please check your ID/Email.');
    } finally {
      setLoading(false);
    }
  }


  return (
    <main className={styles.page} aria-label="Forgot password">
      <div className={styles.card}>

        {/* ---- Brand header ---- */}
        <header className={styles.brandHeader}>
          <div className={styles.logoRow}>
            <span className={styles.logoIcon} aria-hidden="true">
              <Zap size={20} strokeWidth={2.5} color="#ffffff" fill="rgba(255,255,255,0.3)" />
            </span>
            <div className={styles.logoText}>
              <span className={styles.appName}>RR Security</span>
              <span className={styles.appSuffix}>HRMS Portal</span>
            </div>
          </div>
        </header>

        {/* ---- Body ---- */}
        <section className={styles.body}>
          {sentResult ? (
            <>
              <span className={styles.iconBadge} style={{ background: '#ecfdf5', borderColor: '#a7f3d0', color: '#059669' }}>
                <CheckCircle2 size={28} strokeWidth={2.2} />
              </span>

              <h1 className={styles.heading}>Reset Link Sent!</h1>
              <p className={styles.subheading}>
                We've sent password reset instructions to your registered email address:
              </p>

              <div style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                <Mail size={18} color="#2563eb" />
                <span style={{ fontWeight: 700, color: '#0f172a', fontSize: '14px' }}>
                  {sentResult.maskedEmail}
                </span>
              </div>

              <AlertMessage
                type="success"
                title="Check Your Inbox"
                message="Please check your inbox (and spam folder) and click the link to reset your password. The link will expire in 60 minutes."
              />

              {sentResult.devResetUrl && (
                <div style={{
                  background: '#eff6ff',
                  border: '1px dashed #bfdbfe',
                  borderRadius: '8px',
                  padding: '12px 14px',
                  fontSize: '12px',
                  color: '#1e40af'
                }}>
                  <div style={{ fontWeight: 700, marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>Developer Direct Link:</span>
                  </div>
                  <a
                    href={sentResult.devResetUrl}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      color: '#2563eb',
                      fontWeight: 600,
                      textDecoration: 'underline'
                    }}
                  >
                    Open Reset Password Page <ExternalLink size={12} />
                  </a>
                </div>
              )}

              <div style={{ marginTop: '6px' }}>
                <Link to="/login" className={styles.backLink}>
                  <ArrowLeft size={15} strokeWidth={2} />
                  Back to Login
                </Link>
              </div>
            </>

          ) : (
            <>
              <span className={styles.iconBadge} aria-hidden="true">
                <KeyRound size={24} strokeWidth={1.8} />
              </span>

              <h1 className={styles.heading}>Forgot Password?</h1>
              <p className={styles.subheading}>
                Enter your registered corporate email or your assigned identifier (Employee ID, Client ID, or User ID). We'll send a secure password reset link to your registered email.
              </p>

              {error && (
                <AlertMessage
                  type="error"
                  title="Request Failed"
                  message={error}
                />
              )}

              <form
                className={styles.form}
                onSubmit={handleSubmit}
                noValidate
                aria-label="Forgot password form"
              >
                <FormInput
                  id="forgot-identifier"
                  label="Corporate Email, User ID, Employee ID or Client ID"
                  type="text"
                  placeholder="e.g. admin@rrsecurity.com, EMP-001, CLI-001, USR-001"
                  value={identifier}
                  onChange={(e) => {
                    setIdentifier(e.target.value);
                    if (error) setError('');
                  }}
                  error={error}
                  disabled={loading}
                />

                <PrimaryButton
                  type="submit"
                  loading={loading}
                  loadingText="Sending Link..."
                >
                  Send Reset Link &rarr;
                </PrimaryButton>
              </form>

              <Link to="/login" className={styles.backLink}>
                <ArrowLeft size={15} strokeWidth={2} />
                Back to Login
              </Link>
            </>
          )}
        </section>
      </div>

      <footer className={styles.footer}>
        &copy; {new Date().getFullYear()} RR Security &amp; Facilities. All rights reserved.
      </footer>
    </main>
  );
}

export default ForgotPassword;
