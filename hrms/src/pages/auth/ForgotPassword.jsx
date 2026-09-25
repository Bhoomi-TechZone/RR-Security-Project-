import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Zap, KeyRound, ArrowLeft } from 'lucide-react'
import FormInput from '../../components/common/FormInput'
import PrimaryButton from '../../components/common/PrimaryButton'
import AlertMessage from '../../components/common/AlertMessage'
import styles from './ForgotPassword.module.css'

/**
 * ForgotPassword Page — /forgot-password
 *
 * Frontend-only placeholder. No backend integration.
 * Architecture is ready for future authService.sendPasswordReset() call.
 */
function ForgotPassword() {
  const [identifier, setIdentifier] = useState('')
  const [error, setError]           = useState('')
  const [loading, setLoading]       = useState(false)
  const [sent, setSent]             = useState(false)

  function validate(value) {
    if (!value.trim()) return 'Email or Employee ID is required.'
    if (value.includes('@') && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      return 'Please enter a valid email address.'
    }
    return ''
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const err = validate(identifier)
    if (err) { setError(err); return }
    setError('')
    setLoading(true)

    // Simulate async — replace with: await authService.sendPasswordReset(identifier)
    await new Promise((r) => setTimeout(r, 900))
    setLoading(false)
    setSent(true)
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
              <span className={styles.appName}>NovaSpark</span>
              <span className={styles.appSuffix}>HRMS Platform</span>
            </div>
          </div>
        </header>

        {/* ---- Body ---- */}
        <section className={styles.body}>
          <span className={styles.iconBadge} aria-hidden="true">
            <KeyRound size={24} strokeWidth={1.8} />
          </span>

          <h1 className={styles.heading}>Forgot Password?</h1>
          <p className={styles.subheading}>
            Enter your registered email or employee ID and we'll send you a
            link to reset your password.
          </p>

          {sent ? (
            <AlertMessage
              type="success"
              title="Reset link sent!"
              message="If an account exists for this identifier, you will receive password reset instructions shortly."
            />
          ) : (
            <form
              className={styles.form}
              onSubmit={handleSubmit}
              noValidate
              aria-label="Forgot password form"
            >
              <FormInput
                id="forgot-identifier"
                label="Email or Employee ID"
                type="text"
                placeholder="Enter your email or employee ID"
                value={identifier}
                onChange={(e) => {
                  setIdentifier(e.target.value)
                  if (error) setError('')
                }}
                error={error}
                disabled={loading}
              />

              <PrimaryButton
                type="submit"
                loading={loading}
                loadingText="Sending..."
              >
                Send Reset Link
              </PrimaryButton>
            </form>
          )}

          <Link to="/login" className={styles.backLink}>
            <ArrowLeft size={15} strokeWidth={2} />
            Back to Login
          </Link>
        </section>
      </div>

      <footer className={styles.footer}>
        © {new Date().getFullYear()} NovaSpark. All rights reserved.
      </footer>
    </main>
  )
}

export default ForgotPassword
