import { AlertTriangle, CheckCircle, Info, AlertCircle } from 'lucide-react'
import styles from './AlertMessage.module.css'

/**
 * AlertMessage — Reusable alert for error/success/warning/info states
 *
 * Props:
 *   type    - 'error' | 'success' | 'warning' | 'info'
 *   title   - bold title text (optional)
 *   message - supporting message text
 */

const ICONS = {
  error:   AlertTriangle,
  success: CheckCircle,
  warning: AlertCircle,
  info:    Info,
}

const ICON_SIZE = 18

function AlertMessage({ type = 'error', title, message }) {
  const Icon = ICONS[type] || ICONS.error

  if (!message && !title) return null

  return (
    <div
      className={`${styles.alert} ${styles[type]}`}
      role={type === 'error' ? 'alert' : 'status'}
      aria-live={type === 'error' ? 'assertive' : 'polite'}
    >
      <span className={styles.iconWrap} aria-hidden="true">
        <Icon size={ICON_SIZE} strokeWidth={2} />
      </span>
      <div className={styles.content}>
        {title && <span className={styles.title}>{title}</span>}
        {message && <span className={styles.message}>{message}</span>}
      </div>
    </div>
  )
}

export default AlertMessage
