import React from 'react';
import {
  Building2, X, Copy, Check, ShieldCheck, Mail, Phone, MapPin,
  FileText, Landmark, Calendar, Globe, Clock, DollarSign
} from 'lucide-react';
import styles from './ViewCompanyDetailsModal.module.css';

function ViewCompanyDetailsModal({ isOpen, company, onClose }) {
  const [copiedKey, setCopiedKey] = React.useState(null);

  if (!isOpen || !company) return null;

  const handleCopy = (text, key) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const compId = company.companyId || company.id;
  const isDefault = Boolean(company.isDefault || compId === 'RRS8392014SEC');

  return (
    <div className={styles.overlay} onClick={onClose} role="dialog" aria-modal="true">
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <div className={styles.logoAvatar}>
              {company.logo ? (
                <img src={company.logo} alt={company.name} className={styles.logoImg} />
              ) : (
                company.code ? company.code.substring(0, 3) : (company.name || 'CO').substring(0, 2).toUpperCase()
              )}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 className={styles.title}>{company.name}</h2>
                {isDefault && <span className={styles.masterPill}>Master Entity</span>}
                <span
                  className={styles.statusPill}
                  style={{
                    background: company.status === 'Inactive' ? '#fee2e2' : '#f0fdf4',
                    color: company.status === 'Inactive' ? '#b91c1c' : '#15803d',
                    borderColor: company.status === 'Inactive' ? '#fecaca' : '#bbf7d0',
                  }}
                >
                  {company.status || 'Active'}
                </span>
              </div>
              <p className={styles.subtitle}>
                Code: <strong>{company.code}</strong> • {company.industry || 'Security & Facilities'}
              </p>
            </div>
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close modal">
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className={styles.body}>
          {/* Company ID highlight bar */}
          <div className={styles.idBanner}>
            <span className={styles.idLabel}>Company ID:</span>
            <span className={styles.idValue}>{compId}</span>
            <button
              type="button"
              className={styles.copyIdBtn}
              onClick={() => handleCopy(compId, 'compId')}
              title="Copy ID"
            >
              {copiedKey === 'compId' ? <Check size={14} color="#16a34a" /> : <Copy size={14} />}
              <span>{copiedKey === 'compId' ? 'Copied' : 'Copy'}</span>
            </button>
          </div>

          {/* Section 1: Contact & Address */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>
              <Mail size={16} /> Contact & Location Information
            </h3>
            <div className={styles.grid2}>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Admin Login Email</span>
                <span className={styles.infoValue} style={{ color: '#1d4ed8', fontWeight: 600 }}>
                  {company.adminEmail || company.email || '—'}
                </span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Official Company Email</span>
                <span className={styles.infoValue}>{company.email || '—'}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Primary Phone</span>
                <span className={styles.infoValue}>{company.phone || '—'}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Alternate Contact / Phone</span>
                <span className={styles.infoValue}>{company.alternatePhone || company.alternateContact || '—'}</span>
              </div>
              <div className={styles.infoItem} style={{ gridColumn: 'span 2' }}>
                <span className={styles.infoLabel}>Official Address</span>
                <span className={styles.infoValue}>
                  {[company.address, company.city, company.state, company.pinCode].filter(Boolean).join(', ') || '—'}
                </span>
              </div>
            </div>
          </div>

          {/* Section 2: Statutory & Tax Identifiers */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>
              <FileText size={16} /> Statutory & Regulatory Identifiers
            </h3>
            <div className={styles.grid3}>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>GSTIN</span>
                <span className={styles.infoValueMono}>{company.gstin || '—'}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>PAN</span>
                <span className={styles.infoValueMono}>{company.pan || '—'}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>TAN</span>
                <span className={styles.infoValueMono}>{company.tan || '—'}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Employer PF Code</span>
                <span className={styles.infoValueMono}>{company.employerPfCode || '—'}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Employer ESI Code</span>
                <span className={styles.infoValueMono}>{company.employerEsiCode || '—'}</span>
              </div>
            </div>
          </div>

          {/* Section 3: Localization & Workspace Settings */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>
              <Globe size={16} /> Regional & System Preferences
            </h3>
            <div className={styles.grid3}>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Currency</span>
                <span className={styles.infoValue}>{company.currency || 'INR (₹)'}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Time Zone</span>
                <span className={styles.infoValue}>{company.timeZone || 'Asia/Kolkata (IST)'}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Date Format</span>
                <span className={styles.infoValue}>{company.dateFormat || 'DD/MM/YYYY'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className={styles.footer}>
          <button type="button" className={styles.closeActionBtn} onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default ViewCompanyDetailsModal;
