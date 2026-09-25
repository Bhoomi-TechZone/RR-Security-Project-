import React from 'react';
import { useLocation } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import styles from './BackToOrganisationSettings.module.css';

/**
 * Global helper to dispatch custom event to open Organisation Settings modal
 */
export const openOrganisationSettingsModal = () => {
  window.dispatchEvent(new CustomEvent('open-organisation-settings'));
};

/**
 * Global helper to dispatch custom event to close Organisation Settings modal
 */
export const closeOrganisationSettingsModal = () => {
  window.dispatchEvent(new CustomEvent('close-organisation-settings'));
};

/**
 * BackToOrganisationSettings Component
 * 
 * Shows a compact "Back to Organisation Settings" button on destination pages.
 * Clicking it reopens the Organisation Settings modal without refreshing the page.
 */
export default function BackToOrganisationSettings({
  alwaysShow = true,
  label = 'Back to Organisation Settings',
  className = ''
}) {
  const location = useLocation();

  // Check if navigation came from organisation settings or if alwaysShow is enabled
  const cameFromOrganisationSettings = location.state?.fromOrganisationSettings === true;

  if (!alwaysShow && !cameFromOrganisationSettings) {
    return null;
  }

  const handleClick = (e) => {
    e.preventDefault();
    openOrganisationSettingsModal();
  };

  return (
    <button
      type="button"
      className={`btn btn-sm ${styles.backBtn} ${className}`}
      onClick={handleClick}
      title="Back to Organisation Settings"
      aria-label="Back to Organisation Settings"
    >
      <ArrowLeft size={14} className={styles.icon} />
      <span>{label}</span>
    </button>
  );
}
