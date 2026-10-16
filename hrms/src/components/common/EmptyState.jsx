import React from 'react';
import { Search, CheckCircle, FileText, AlertCircle } from 'lucide-react';
import styles from './EmptyState.module.css';

const ICON_MAP = {
  check: CheckCircle,
  checkcircle: CheckCircle,
  search: Search,
  file: FileText,
  alert: AlertCircle,
};

/**
 * EmptyState Component
 * Displays when no results are found or no records exist.
 */
function EmptyState({ 
  icon: Icon = Search, 
  title = 'No records found', 
  description = 'Try resetting filters or adding new items.', 
  actionLabel, 
  onAction 
}) {
  const ResolvedIcon = typeof Icon === 'string' ? (ICON_MAP[Icon.toLowerCase()] || Search) : (Icon || Search);

  return (
    <div className={styles.emptyContainer}>
      <div className={styles.iconBox}>
        <ResolvedIcon size={32} />
      </div>
      <h3 className={styles.title}>{title}</h3>
      <p className={styles.description}>{description}</p>
      {actionLabel && onAction && (
        <button className={styles.actionBtn} onClick={onAction}>
          {actionLabel}
        </button>
      )}
    </div>
  );
}

export default EmptyState;
