import React, { useEffect } from 'react';
import { X, ExternalLink, Globe, Shield } from 'lucide-react';
import styles from './ExternalLinksDrawer.module.css';

import hrLogo from '../../assets/hrlogo.png';
import esiLogo from '../../assets/Esilogo.png';
import epfoLogo from '../../assets/Epfologo.png';
import aadharLogo from '../../assets/Aadharlogo.png';

const EXTERNAL_LINKS = [
  {
    id: 'hry-labour',
    title: 'Haryana Labour Welfare',
    subtitle: 'Labour department reference link',
    domain: 'hrylabour.gov.in',
    url: 'https://hrylabour.gov.in/',
    themeColor: '#0f766e',
    logo: hrLogo
  },
  {
    id: 'esic',
    title: 'ESIC, Payment and Challan',
    subtitle: 'ESI reference link',
    domain: 'esic.gov.in',
    url: 'https://esic.gov.in/',
    themeColor: '#881337',
    logo: esiLogo
  },
  {
    id: 'epfo-pf',
    title: '(PF) Provident Fund',
    subtitle: 'PF reference link',
    domain: 'unifiedportalemp.epfindia.gov.in',
    url: 'https://www.epfo.gov.in/',
    themeColor: '#1d4ed8',
    logo: epfoLogo
  },
  {
    id: 'uidai',
    title: 'UIDAI (Aadhaar Portal)',
    subtitle: 'Aadhaar reference link',
    domain: 'uidai.gov.in',
    url: 'https://www.uidai.gov.in/hi',
    themeColor: '#c2410c',
    logo: aadharLogo
  }
];

function PortalBadge({ item }) {
  return (
    <div className={styles.emblemBadge}>
      <img
        src={item.logo}
        alt={item.title}
        className={styles.logoImg}
      />
    </div>
  );
}

function ExternalLinksDrawer({ isOpen, onClose }) {
  // Handle escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Lock scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className={styles.drawerOverlay} onClick={onClose} role="dialog" aria-modal="true" aria-label="External Portals">
      <aside 
        className={styles.drawerPanel} 
        onClick={(e) => e.stopPropagation()}
        aria-label="Government & Statutory Links Drawer"
      >
        {/* Header */}
        <header className={styles.drawerHeader}>
          <div className={styles.headerTitleGroup}>
            <div className={styles.headerIconWrap}>
              <Globe size={18} strokeWidth={2.2} />
            </div>
            <div>
              <h2 className={styles.drawerTitle}>Government & Statutory Portals</h2>
              <p className={styles.drawerSubtitle}>Official statutory, compliance and verification portals</p>
            </div>
          </div>
          <button 
            type="button" 
            className={styles.closeBtn} 
            onClick={onClose}
            aria-label="Close portal drawer"
          >
            <X size={18} />
          </button>
        </header>

        {/* Links List */}
        <div className={styles.drawerBody}>
          <div className={styles.linksList}>
            {EXTERNAL_LINKS.map((item) => (
              <a
                key={item.id}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.linkCard}
                title={`Open ${item.title} (${item.domain})`}
              >
                <div className={styles.badgeCol}>
                  <PortalBadge item={item} />
                </div>

                <div className={styles.metaCol}>
                  <span className={styles.linkTitle}>{item.title}</span>
                  <span className={styles.linkSubtitle}>{item.subtitle}</span>
                </div>

                <div className={styles.actionCol}>
                  <span className={styles.externalIconWrap}>
                    <ExternalLink size={15} strokeWidth={2} />
                  </span>
                </div>
              </a>
            ))}
          </div>
        </div>

        {/* Footer info note */}
        <footer className={styles.drawerFooter}>
          <div className={styles.footerNote}>
            <Shield size={14} />
            <span>Links open the official portal in a new browser tab.</span>
          </div>
        </footer>
      </aside>
    </div>
  );
}

export default ExternalLinksDrawer;
