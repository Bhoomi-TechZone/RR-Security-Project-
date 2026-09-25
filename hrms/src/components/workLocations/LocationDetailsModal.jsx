import React, { useEffect, useRef } from 'react';
import { X, MapPin } from 'lucide-react';
import StatusBadge from '../common/StatusBadge';
import styles from './LocationDetailsModal.module.css';

/**
 * LocationDetailsModal Component
 * Displays detailed information about a work location
 */
function LocationDetailsModal({ isOpen, onClose, location = null }) {
  const modalRef = useRef(null);

  useEffect(() => {
    if (isOpen && modalRef.current) {
      modalRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !location) return null;

  const getLocationTypeLabel = (type) => {
    const typeMap = {
      'head-office': 'Head Office',
      'branch': 'Branch',
      'office': 'Office'
    };
    return typeMap[type] || type;
  };

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" onClick={onClose}>
      <div 
        ref={modalRef}
        tabIndex="-1"
        className={styles.modal} 
        onClick={(e) => e.stopPropagation()}
      >
        <header className={styles.header}>
          <div className={styles.titleRow}>
            <div className={styles.iconBox}>
              <MapPin size={20} />
            </div>
            <h2 className={styles.title}>Work Location Details</h2>
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close details">
            <X size={16} />
          </button>
        </header>

        <div className={styles.content}>
          <div className={styles.detailsList}>
            <div className={styles.detailRow}>
              <span className={styles.label}>Location Name</span>
              <span className={styles.value}>{location.locationName}</span>
            </div>

            <div className={styles.detailRow}>
              <span className={styles.label}>Location Type</span>
              <span className={styles.value}>{getLocationTypeLabel(location.locationType)}</span>
            </div>

            <div className={styles.detailRow}>
              <span className={styles.label}>Address</span>
              <span className={styles.value}>{location.address}</span>
            </div>

            <div className={styles.detailRow}>
              <span className={styles.label}>City</span>
              <span className={styles.value}>{location.city}</span>
            </div>

            <div className={styles.detailRow}>
              <span className={styles.label}>State</span>
              <span className={styles.value}>{location.state}</span>
            </div>

            <div className={styles.detailRow}>
              <span className={styles.label}>PIN Code</span>
              <span className={styles.value}>{location.pinCode}</span>
            </div>

            <div className={styles.detailRow}>
              <span className={styles.label}>Status</span>
              <StatusBadge status={location.status} />
            </div>
          </div>

          {location.createdOn && (
            <div className={styles.metadata}>
              <h3 className={styles.metaTitle}>Metadata</h3>
              <div className={styles.metaGrid}>
                {location.createdOn && (
                  <div className={styles.metaItem}>
                    <span className={styles.metaLabel}>Created On</span>
                    <span className={styles.metaValue}>{location.createdOn}</span>
                  </div>
                )}
                {location.lastUpdated && (
                  <div className={styles.metaItem}>
                    <span className={styles.metaLabel}>Last Updated</span>
                    <span className={styles.metaValue}>{location.lastUpdated}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <footer className={styles.footer}>
          <button
            type="button"
            onClick={onClose}
            className={styles.closeActionBtn}
          >
            Close
          </button>
        </footer>
      </div>
    </div>
  );
}

export default LocationDetailsModal;
