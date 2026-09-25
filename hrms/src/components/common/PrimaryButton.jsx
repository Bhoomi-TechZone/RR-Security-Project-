import styles from './PrimaryButton.module.css'

/**
 * PrimaryButton — Full-width primary action button
 *
 * Props:
 *   type     - button type (default: "submit")
 *   onClick  - click handler
 *   disabled - disables the button
 *   loading  - shows loading spinner with loadingText
 *   loadingText - text shown during loading (default: "Signing in...")
 *   children - button label content
 */
function PrimaryButton({
  type = 'submit',
  onClick,
  disabled = false,
  loading = false,
  loadingText = 'Signing in...',
  children,
}) {
  const isDisabled = disabled || loading

  return (
    <button
      type={type}
      className={styles.btn}
      onClick={onClick}
      disabled={isDisabled}
      aria-busy={loading}
    >
      {loading ? (
        <>
          <span className={styles.spinner} aria-hidden="true" />
          {loadingText}
        </>
      ) : (
        children
      )}
    </button>
  )
}

export default PrimaryButton
