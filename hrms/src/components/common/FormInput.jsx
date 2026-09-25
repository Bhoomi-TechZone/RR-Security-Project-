import { forwardRef } from 'react'
import { AlertCircle } from 'lucide-react'
import styles from './FormInput.module.css'

/**
 * FormInput — Reusable labeled text input
 *
 * Props:
 *   id          - unique element id (required for accessibility)
 *   label       - field label text
 *   type        - input type (default: "text")
 *   placeholder - placeholder text
 *   value       - controlled value
 *   onChange    - change handler
 *   error       - error message string (shows error state)
 *   icon        - Lucide icon component to show on the left
 *   disabled    - disables the input
 *   autoComplete - autocomplete attribute
 */
const FormInput = forwardRef(function FormInput(
  {
    id,
    label,
    type = 'text',
    placeholder,
    value,
    onChange,
    error,
    icon: Icon,
    disabled = false,
    autoComplete,
    ...rest
  },
  ref
) {
  return (
    <div className={styles.fieldGroup}>
      {label && (
        <label htmlFor={id} className={styles.label}>
          {label}
        </label>
      )}
      <div className={styles.inputWrapper}>
        {Icon && (
          <span className={styles.iconLeft} aria-hidden="true">
            <Icon size={17} strokeWidth={2} />
          </span>
        )}
        <input
          ref={ref}
          id={id}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          disabled={disabled}
          autoComplete={autoComplete}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          className={[
            styles.input,
            !Icon ? styles.inputNoIcon : '',
            error ? styles.inputError : '',
          ]
            .filter(Boolean)
            .join(' ')}
          {...rest}
        />
      </div>
      {error && (
        <span id={`${id}-error`} className={styles.errorText} role="alert">
          <AlertCircle size={13} strokeWidth={2.2} />
          {error}
        </span>
      )}
    </div>
  )
})

export default FormInput
