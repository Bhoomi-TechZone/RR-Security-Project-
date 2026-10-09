import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mail } from 'lucide-react'
import FormInput from '../common/FormInput'
import PasswordInput from '../common/PasswordInput'
import PrimaryButton from '../common/PrimaryButton'
import AlertMessage from '../common/AlertMessage'
import authService from '../../services/authService'
import styles from './LoginForm.module.css'

/* ============================
   Validation helpers
============================ */
function validateEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

function validate(email, password) {
  const errors = {}

  if (!email.trim()) {
    errors.email = 'Corporate Email, Employee ID or Client ID is required.'
  } else if (email.includes('@') && !validateEmail(email)) {
    errors.email = 'Please enter a valid email address or ID.'
  }

  if (!password) {
    errors.password = 'Password is required.'
  }

  return errors
}

/* ============================
   LoginForm Component
============================ */
function LoginForm() {
  const navigate = useNavigate()

  const [email, setEmail]           = useState('')
  const [password, setPassword]     = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [errors, setErrors]         = useState({})
  const [alert, setAlert]           = useState(null)  // { type, title, message }
  const [loading, setLoading]       = useState(false)

  /* ---- Form submit ---- */
  async function handleSubmit(e) {
    e.preventDefault()
    setAlert(null)

    const fieldErrors = validate(email, password)
    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors)
      return
    }
    setErrors({})

    setLoading(true)

    try {
      // Call backend authentication API
      const result = await authService.login({ email, password, rememberMe })
      
      const roleLabel = result.user?.role
        ? result.user.role.charAt(0).toUpperCase() + result.user.role.slice(1)
        : 'User'

      // Instantly dispatch auth state event to refresh all active contexts and notification listeners
      window.dispatchEvent(new CustomEvent('auth_state_changed', { detail: result.user }));
      window.dispatchEvent(new CustomEvent('user_logged_in', { detail: result.user }));

      setAlert({
        type: 'success',
        title: 'Login successful',
        message: `Welcome back, ${result.user?.name || ''}! Redirecting to ${roleLabel} Dashboard...`,
      })

      const targetPath = result.redirect || (result.user?.role === 'admin' ? '/admin/dashboard' : `/${result.user?.role}/dashboard`)
      setTimeout(() => navigate(targetPath), 400)
    } catch (err) {
      setLoading(false)
      setAlert({
        type: 'error',
        title: 'Unable to sign in',
        message: err.message || 'Please check your credentials and try again.',
      })
    }
  }

  return (
    <form
      className={styles.form}
      onSubmit={handleSubmit}
      noValidate
      aria-label="Sign in form"
    >
      {/* ---- Alert ---- */}
      {alert && (
        <AlertMessage
          type={alert.type}
          title={alert.title}
          message={alert.message}
        />
      )}

      {/* ---- Corporate Email, Employee ID or Client ID ---- */}
      <FormInput
        id="login-email"
        label="Corporate Email, Employee ID or Client ID"
        type="text"
        placeholder="Enter ID or Email"
        value={email}
        onChange={(e) => {
          setEmail(e.target.value)
          if (errors.email) setErrors((prev) => ({ ...prev, email: '' }))
        }}
        error={errors.email}
        icon={Mail}
        autoComplete="username"
        disabled={loading}
      />

      {/* ---- Password with inline Forgot ---- */}
      <div className={styles.passwordField}>
        <div className={styles.passwordLabelRow}>
          <label htmlFor="login-password" className={styles.passwordLabel}>
            Password
          </label>
          <Link to="/forgot-password" className={styles.forgotLink}>
            Forgot password?
          </Link>
        </div>
        <PasswordInput
          id="login-password"
          label=""
          placeholder="••••••••"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value)
            if (errors.password) setErrors((prev) => ({ ...prev, password: '' }))
          }}
          error={errors.password}
          disabled={loading}
        />
      </div>

      {/* ---- Remember me ---- */}
      <label className={styles.checkLabel} htmlFor="remember-me">
        <input
          id="remember-me"
          type="checkbox"
          className={styles.checkbox}
          checked={rememberMe}
          onChange={(e) => setRememberMe(e.target.checked)}
          disabled={loading}
        />
        Remember me for 30 days
      </label>

      {/* ---- Sign In button ---- */}
      <PrimaryButton
        type="submit"
        loading={loading}
        loadingText="Signing in..."
      >
        Sign In →
      </PrimaryButton>

      {/* ---- Request access ---- */}
      <p className={styles.requestAccess}>
        Don't have an account?{' '}
        <Link to="/register" className={styles.requestLink}>
          Request access
        </Link>
      </p>
    </form>
  )
}

export default LoginForm
