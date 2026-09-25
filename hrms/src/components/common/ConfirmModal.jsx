import React, { useEffect, useRef } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import styles from './ConfirmModal.module.css';

/**
 * ConfirmModal — Reusable confirmation dialog
 * Props: isOpen, title, description, confirmLabel, variant ('danger'|'primary'), onConfirm, onCancel
 */
function ConfirmModal({ isOpen, title, description, confirmLabel = 'Confirm', variant = 'danger', onConfirm, onCancel }) {
  const confirmRef = useRef(null);

  // Focus confirm button when opened
  useEffect(() => {
    if (isOpen && confirmRef.current) {
      confirmRef.current.focus();
    }
  }, [isOpen]);

  // Escape key closes the modal
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e) => {
      if (e.key === 'Escape') onCancel();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-labelledby="confirm-modal-title">
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.iconWrap}>
          <AlertTriangle size={24} strokeWidth={2} />
        </div>
        <h2 id="confirm-modal-title" className={styles.title}>{title}</h2>
        {description && <p className={styles.description}>{description}</p>}
        <div className={styles.actions}>
          <button className={styles.cancelBtn} onClick={onCancel}>Cancel</button>
          <button
            ref={confirmRef}
            className={`${styles.confirmBtn} ${variant === 'danger' ? styles.danger : styles.primary}`}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmModal;
