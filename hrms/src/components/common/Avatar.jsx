import React from 'react';
import styles from './Avatar.module.css';

/**
 * Avatar Component
 * Renders user initials with dynamic background color or an optional image.
 */
function Avatar({ initials, src, size = 'md', status = 'online', name }) {
  const getBackgroundColor = (text) => {
    if (!text) return '#cbd5e1';
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      hash = text.charCodeAt(i) + ((hash << 5) - hash);
    }
    const colors = [
      '#3b82f6', // blue
      '#10b981', // emerald
      '#6366f1', // indigo
      '#f59e0b', // amber
      '#ec4899', // pink
      '#8b5cf6', // violet
      '#14b8a6', // teal
    ];
    const index = Math.abs(hash) % colors.length;
    return colors[index];
  };

  const resolvedInitials = initials || (name ? name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'U');
  const bg = src ? 'transparent' : getBackgroundColor(name || resolvedInitials);

  return (
    <div 
      className={`${styles.avatar} ${styles[size]}`} 
      style={{ backgroundColor: bg }}
      aria-label={name || "User profile avatar"}
    >
      {src ? (
        <img src={src} alt={name || "Profile"} className={styles.img} />
      ) : (
        <span className={styles.initials}>{resolvedInitials}</span>
      )}
      {status && (
        <span className={`${styles.badge} ${styles[status]}`} />
      )}
    </div>
  );
}

export default Avatar;
