import { useState } from 'react'
import { Eye, EyeOff, AlertCircle, Lock } from 'lucide-react'
import styles from './PasswordInput.module.css'
import formStyles from './FormInput.module.css'

/**
 * PasswordInput — Password field with show/hide toggle
 *
 * Props:
 *   id          - unique element id
 *   label       - field label (default: "Password")
 *   placeholder - placeholder text
 *   value       - controlled value
 *   onChange    - change handler
 *   error       - error message string
 *   disabled    - disables the input
 */
function PasswordInput({
  id = 'password',
  label = 'Password',
  placeholder = 'Enter your password',
  value,
  onChange,
  error,
  disabled = false,
}) {
  const [visible, setVisible] = useState(false)

  return (
    <div className={formStyles.fieldGroup}>
      {label && (
        <label htmlFor={id} className={formStyles.label}>
          {label}
        </label>
      )}
      <div className={styles.wrapper}>
        {/* Lock icon on the left */}
        <span className={styles.iconLeft} aria-hidden="true">
          <Lock size={17} strokeWidth={2} />
        </span>

        <input
          id={id}
          type={visible ? 'text' : 'password'}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          disabled={disabled}
          autoComplete="current-password"
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          className={[
            styles.input,
            error ? styles.inputError : '',
          ]
            .filter(Boolean)
            .join(' ')}
        />

        {/* Eye toggle button */}
        <button
          type="button"
          className={styles.toggleBtn}
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? 'Hide password' : 'Show password'}
          tabIndex={0}
          disabled={disabled}
        >
          {visible ? (
            <EyeOff size={17} strokeWidth={2} />
          ) : (
            <Eye size={17} strokeWidth={2} />
          )}
        </button>
      </div>

      {error && (
        <span id={`${id}-error`} className={formStyles.errorText} role="alert">
          <AlertCircle size={13} strokeWidth={2.2} />
          {error}
        </span>
      )}
    </div>
  )
}

export default PasswordInput
