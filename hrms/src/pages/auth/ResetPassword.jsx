import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Zap, Lock, CheckCircle2, AlertCircle, ArrowLeft, KeyRound } from 'lucide-react';
import PasswordInput from '../../components/common/PasswordInput';
import PrimaryButton from '../../components/common/PrimaryButton';
import AlertMessage from '../../components/common/AlertMessage';
import authService from '../../services/authService';
import styles from './ResetPassword.module.css';

function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [verifying, setVerifying] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [accountInfo, setAccountInfo] = useState(null);
  const [verifyError, setVerifyError] = useState('');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Verify token on mount
  useEffect(() => {
    async function checkToken() {
      if (!token) {
        setVerifying(false);
        setTokenValid(false);
        setVerifyError('No password reset token was provided in the link.');
        return;
      }

      try {
        const data = await authService.verifyResetToken(token);
        setAccountInfo(data);
        setTokenValid(true);
      } catch (err) {
        setTokenValid(false);
        setVerifyError(err.message || 'This password reset link is invalid or has expired.');
      } finally {
        setVerifying(false);
      }
    }

    checkToken();
  }, [token]);

  function validate() {
    const errs = {};
    if (!newPassword) {
      errs.newPassword = 'New password is required.';
    } else if (newPassword.length < 6) {
      errs.newPassword = 'Password must be at least 6 characters long.';
    }

    if (!confirmPassword) {
      errs.confirmPassword = 'Please confirm your new password.';
    } else if (newPassword !== confirmPassword) {
      errs.confirmPassword = 'Passwords do not match.';
    }

    return errs;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});
    setLoading(true);

    try {
      await authService.resetPassword({ token, newPassword });
      setSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 3500);
    } catch (err) {
      setErrors({ form: err.message || 'Failed to reset password. Please try again.' });
    } finally {
      setLoading(false);
    }
  }

  const roleLabel = {
    admin: 'Administrator',
    employee: 'Employee',
    client: 'Client',
    user: 'User'
  }[accountInfo?.userType] || accountInfo?.userType || 'Account';

  return (
    <main className={styles.page} aria-label="Reset Password">
      <div className={styles.card}>
        
        {/* Top Brand Header */}
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

        {/* Body */}
        <section className={styles.body}>
          {verifying ? (
            <div className={styles.loadingBox}>
              <div className={styles.spinner} />
              <span>Verifying reset token security...</span>
            </div>
          ) : !tokenValid ? (
            <>
              <span className={styles.iconBadge} style={{ background: '#fef2f2', borderColor: '#fecaca', color: '#dc2626' }}>
                <AlertCircle size={26} strokeWidth={2} />
              </span>
              <h1 className={styles.heading}>Invalid or Expired Link</h1>
              <p className={styles.subheading}>
                {verifyError || 'This password reset link is invalid, expired, or has already been used.'}
              </p>
              <AlertMessage
                type="error"
                title="Action Required"
                message="Password reset links expire after 60 minutes for security. Please request a fresh reset link."
              />
              <Link to="/forgot-password" style={{ textDecoration: 'none' }}>
                <PrimaryButton type="button">
                  Request New Reset Link
                </PrimaryButton>
              </Link>
              <Link to="/login" className={styles.backLink}>
                <ArrowLeft size={15} strokeWidth={2} />
                Back to Login
              </Link>
            </>
          ) : success ? (
            <>
              <div className={styles.iconBadgeSuccess}>
                <CheckCircle2 size={32} strokeWidth={2.2} />
              </div>
              <h1 className={styles.heading}>Password Reset Successful!</h1>
              <p className={styles.subheading}>
                Your password has been successfully updated. You can now use your new password to sign in.
              </p>
              <AlertMessage
                type="success"
                title="Redirecting"
                message="Redirecting you to the sign-in page in a few seconds..."
              />
              <Link to="/login" style={{ textDecoration: 'none' }}>
                <PrimaryButton type="button">
                  Sign In Now &rarr;
                </PrimaryButton>
              </Link>
            </>
          ) : (
            <>
              <span className={styles.iconBadge} aria-hidden="true">
                <KeyRound size={24} strokeWidth={2} />
              </span>

              <h1 className={styles.heading}>Choose New Password</h1>
              <p className={styles.subheading}>
                Please choose a strong password to protect your portal access.
              </p>

              {accountInfo && (
                <div className={styles.userCard}>
                  <span className={styles.userName}>
                    {accountInfo.name} ({accountInfo.identifier || accountInfo.email})
                  </span>
                  <span className={styles.userBadge}>{roleLabel}</span>
                </div>
              )}

              {errors.form && (
                <AlertMessage
                  type="error"
                  title="Reset Failed"
                  message={errors.form}
                />
              )}

              <form className={styles.form} onSubmit={handleSubmit} noValidate>
                <div className={styles.fieldGroup}>
                  <label htmlFor="new-password" className={styles.label}>
                    New Password
                  </label>
                  <PasswordInput
                    id="new-password"
                    placeholder="Enter at least 6 characters"
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      if (errors.newPassword) setErrors((prev) => ({ ...prev, newPassword: '' }));
                    }}
                    error={errors.newPassword}
                    disabled={loading}
                  />
                  <p className={styles.hint}>Must be at least 6 characters long.</p>
                </div>

                <div className={styles.fieldGroup}>
                  <label htmlFor="confirm-password" className={styles.label}>
                    Confirm New Password
                  </label>
                  <PasswordInput
                    id="confirm-password"
                    placeholder="Re-enter your new password"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (errors.confirmPassword) setErrors((prev) => ({ ...prev, confirmPassword: '' }));
                    }}
                    error={errors.confirmPassword}
                    disabled={loading}
                  />
                </div>

                <PrimaryButton
                  type="submit"
                  loading={loading}
                  loadingText="Updating Password..."
                >
                  Save New Password &rarr;
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

export default ResetPassword;
