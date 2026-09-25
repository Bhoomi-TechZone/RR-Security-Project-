import React, { useEffect, useRef } from 'react';
import { CheckCircle, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import styles from './Toast.module.css';

/**
 * Toast Component for notifications.
 * Displays temporary success, error, warning, or info messages with auto-dismiss and close button.
 */
function Toast({ message, type = 'success', onClose, duration = 3000, show }) {
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    // If explicitly marked as not showing or message is empty, do nothing
    if (show === false || !message) return;

    const timer = setTimeout(() => {
      if (onCloseRef.current) {
        onCloseRef.current();
      }
    }, duration);

    return () => clearTimeout(timer);
  }, [message, duration, show]);

  // Hide if show is explicitly false or message is empty
  if (show === false || !message) return null;

  const handleClose = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (onClose) {
      onClose();
    }
  };

  const getIcon = () => {
    if (type === 'success') return <CheckCircle size={18} />;
    if (type === 'error' || type === 'danger') return <AlertCircle size={18} />;
    if (type === 'warning') return <AlertTriangle size={18} />;
    return <Info size={18} />;
  };

  const variantClass = type === 'danger' ? styles.error : (styles[type] || styles.success);

  return (
    <div className={`${styles.toast} ${variantClass}`} role="alert" onClick={(e) => e.stopPropagation()}>
      <div className={styles.icon}>
        {getIcon()}
      </div>
      <div className={styles.content}>
        <p className={styles.message}>{message}</p>
      </div>
      <button
        type="button"
        className={styles.closeBtn}
        onClick={handleClose}
        aria-label="Close notification"
      >
        <X size={15} />
      </button>
    </div>
  );
}

export default Toast;
