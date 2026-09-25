import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { 
  Building2, Users, MapPin, Layers, DollarSign, Landmark, 
  SlidersHorizontal, FileText, ShieldCheck, Hash, 
  Search, ArrowUpRight, X, Sparkles, LayoutDashboard
} from 'lucide-react';
import { closeOrganisationSettingsModal } from '../common/BackToOrganisationSettings';
import styles from './OrganizationSettingsModal.module.css';

const SETTINGS_SECTIONS = [
  {
    id: 'company-setup',
    title: 'Company Setup',
    icon: Building2,
    badgeTheme: styles.themeGreen,
    headerTheme: styles.themeGreenHeader,
    items: [
      { name: 'Company Profile', route: '/admin/company-setup?section=company-profile' },
      { name: 'Logo', route: '/admin/company-setup?section=logo' },
      { name: 'Employee Code', route: '/admin/company-setup?section=employee-code' },
      { name: 'Address', route: '/admin/company-setup?section=address' },
      { name: 'Contact Details', route: '/admin/company-setup?section=contact-details' },
      { name: 'PAN / TAN / GST', route: '/admin/company-setup?section=pan-tan-gst' },
      { name: 'Regional Settings', route: '/admin/company-setup?section=regional-settings' }
    ]
  },
  {
    id: 'users-roles',
    title: 'Users & Roles',
    icon: Users,
    badgeTheme: styles.themeBlue,
    headerTheme: styles.themeBlueHeader,
    items: [
      { name: 'Users', route: '/admin/users' },
      { name: 'Roles', route: '/admin/roles-permissions?tab=roles' },
      { name: 'Permissions', route: '/admin/roles-permissions?tab=permissions' },
      { name: 'Module-wise Access', route: '/admin/roles-permissions?tab=permissions' },
      { name: 'Site/Branch-wise Access', route: '/admin/roles-permissions?tab=permissions' }
    ]
  },
  {
    id: 'work-locations',
    title: 'Work Locations',
    icon: MapPin,
    badgeTheme: styles.themeTeal,
    headerTheme: styles.themeTealHeader,
    items: [
      { name: 'Office/Branch', route: '/admin/work-locations' },
      { name: 'Location Name', route: '/admin/work-locations' },
      { name: 'Address', route: '/admin/work-locations' },
      { name: 'State', route: '/admin/work-locations' },
      { name: 'City', route: '/admin/work-locations' },
      { name: 'PIN Code', route: '/admin/work-locations' }
    ]
  },
  {
    id: 'masters',
    title: 'Masters',
    icon: Layers,
    badgeTheme: styles.themeIndigo,
    headerTheme: styles.themeIndigoHeader,
    items: [
      { name: 'Department', route: '/admin/masters?tab=departments' },
      { name: 'Designation', route: '/admin/masters?tab=designations' },
      { name: 'Employee Type', route: '/admin/masters?tab=employee-types' },
      { name: 'Client', route: '/admin/clients' },
      { name: 'Site', route: '/admin/masters?tab=sites' },
      { name: 'Post', route: '/admin/masters?tab=posts' },
      { name: 'Shift', route: '/admin/shifts?tab=patterns' },
      { name: 'Leave Type', route: '/admin/leave?tab=master' },
      { name: 'Holiday', route: '/admin/masters?tab=holidays' },
      { name: 'Salary Components', route: '/admin/masters?tab=salary-components' },
      { name: 'Document Types', route: '/admin/masters?tab=document-types' }
    ]
  },
  {
    id: 'payroll-setup',
    title: 'Payroll Setup',
    icon: DollarSign,
    badgeTheme: styles.themeAmber,
    headerTheme: styles.themeAmberHeader,
    items: [
      { name: 'Pay Schedule', route: '/admin/payroll-setup?tab=pay-schedules' },
      { name: 'Pay Cycle', route: '/admin/payroll-setup?tab=pay-cycles' },
      { name: 'Pay Day', route: '/admin/payroll-setup?tab=pay-days' },
      { name: 'Salary Calculation Method', route: '/admin/payroll-setup?tab=calculation-methods' },
      { name: 'Pay Groups', route: '/admin/payroll-setup?tab=pay-groups' },
      { name: 'Salary Components', route: '/admin/masters?tab=salary-components' }
    ]
  },
  {
    id: 'statutory-setup',
    title: 'Statutory Setup',
    icon: Landmark,
    badgeTheme: styles.themeRose,
    headerTheme: styles.themeRoseHeader,
    items: [
      { name: 'PF', route: '/admin/statutory-setup?tab=pf' },
      { name: 'ESI', route: '/admin/statutory-setup?tab=esi' },
      { name: 'PT', route: '/admin/statutory-setup?tab=pt' },
      { name: 'TDS', route: '/admin/statutory-setup?tab=tds' },
      { name: 'Bonus', route: '/admin/statutory-setup?tab=bonus' },
      { name: 'Gratuity', route: '/admin/statutory-setup?tab=gratuity' },
      { name: 'LWF', route: '/admin/statutory-setup?tab=lwf' }
    ]
  },
  {
    id: 'preferences',
    title: 'Preferences',
    icon: SlidersHorizontal,
    badgeTheme: styles.themePurple,
    headerTheme: styles.themePurpleHeader,
    items: [
      { name: 'Employee Portal', route: '/admin/preferences?tab=employee-portal' },
      { name: 'Reporting Manager Permissions', route: '/admin/preferences?tab=reporting-manager' },
      { name: 'Email Settings', route: '/admin/preferences?tab=email' },
      { name: 'Notification Settings', route: '/admin/preferences?tab=notifications' },
      { name: 'Approval Settings', route: '/admin/preferences?tab=approvals' }
    ]
  },
  {
    id: 'templates',
    title: 'Templates',
    icon: FileText,
    badgeTheme: styles.themeEmerald,
    headerTheme: styles.themeEmeraldHeader,
    items: [
      { name: 'Salary Slip', route: '/admin/templates?tab=salary-slip' },
      { name: 'Appointment Letter', route: '/admin/templates?tab=appointment-letter' },
      { name: 'Joining Letter', route: '/admin/templates?tab=joining-letter' },
      { name: 'Experience Letter', route: '/admin/templates?tab=experience-letter' },
      { name: 'Full & Final Letter', route: '/admin/templates?tab=full-final-letter' },
      { name: 'Email Templates', route: '/admin/templates?tab=email' }
    ]
  },
  {
    id: 'document-compliance',
    title: 'Document & Compliance',
    icon: ShieldCheck,
    badgeTheme: styles.themeCyan,
    headerTheme: styles.themeCyanHeader,
    items: [
      { name: 'Document Master', route: '/admin/document-compliance?tab=document-master' },
      { name: 'Verification Rules', route: '/admin/document-compliance?tab=verification-rules' },
      { name: 'Expiry Alert', route: '/admin/document-compliance?tab=expiry-alert' },
      { name: 'Police Verification', route: '/admin/document-compliance?tab=police-verification' }
    ]
  }
];

function OrganizationSettingsModal({ isOpen, onClose }) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);

  // Close on escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (selectedItem) {
          setSelectedItem(null);
        } else if (onClose) {
          onClose();
        }
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, selectedItem, onClose]);

  // Filter sections and items based on search query
  const filteredSections = useMemo(() => {
    if (!searchQuery.trim()) return SETTINGS_SECTIONS;
    const q = searchQuery.toLowerCase();

    return SETTINGS_SECTIONS.map(section => {
      const matchesSection = section.title.toLowerCase().includes(q);
      const matchingItems = section.items.filter(item => 
        item.name.toLowerCase().includes(q) || 
        (item.description && item.description.toLowerCase().includes(q))
      );

      if (matchesSection) return section;
      if (matchingItems.length > 0) {
        return { ...section, items: matchingItems };
      }
      return null;
    }).filter(Boolean);
  }, [searchQuery]);

  const handleGoToDashboard = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (onClose) onClose();
    closeOrganisationSettingsModal();
    navigate('/admin/dashboard', { state: { organisationSettingsOpen: false } });
  };

  const handleItemClick = (e, item, sectionTitle) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (item.route) {
      navigate(item.route, { state: { fromOrganisationSettings: true } });
    } else {
      setSelectedItem({
        ...item,
        sectionTitle
      });
    }
  };

  if (!isOpen) return null;

  const modalContent = (
    <div className={styles.modalOverlay} onClick={onClose} role="dialog" aria-modal="true">
      <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className={styles.modalHeader}>
          <div className={styles.titleArea}>
            <div className={styles.titleWithHome}>
              <button
                type="button"
                className={styles.homeDashboardBtn}
                onClick={handleGoToDashboard}
                title="Go to Dashboard"
                aria-label="Go to Dashboard"
              >
                <LayoutDashboard size={17} />
              </button>
              <h2 className={styles.modalTitle}>Organisation Settings</h2>
            </div>
            <p className={styles.modalSubtitle}>
              Quick navigation for company setup, user permissions, masters, statutory & templates.
            </p>
          </div>

          <div className={styles.headerActions}>
            <div className={styles.searchBox}>
              <Search size={15} className={styles.searchIcon} />
              <input
                type="text"
                className={styles.searchInput}
                placeholder="Search settings & modules..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
              />
            </div>

            <button
              type="button"
              className={styles.closeBtn}
              onClick={onClose}
              aria-label="Close Settings Modal"
            >
              <X size={19} />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className={styles.modalBody}>
          <div className={styles.settingsGrid}>
            {filteredSections.map((section) => {
              const IconComponent = section.icon;
              return (
                <div key={section.id} className={styles.moduleCol}>
                  <div className={`${styles.moduleHeader} ${section.headerTheme}`}>
                    <span className={styles.moduleTitleText}>{section.title}</span>
                  </div>

                  <ul className={styles.itemList}>
                    {section.items.map((item, idx) => (
                      <li key={idx}>
                        <button
                          type="button"
                          className={styles.itemBtn}
                          onClick={(e) => handleItemClick(e, item, section.title)}
                        >
                          <span>{item.name}</span>
                          <ArrowUpRight size={13} className={styles.itemArrow} />
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>

          {filteredSections.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b' }}>
              <p style={{ margin: 0, fontWeight: 600 }}>No settings found matching "{searchQuery}"</p>
              <p style={{ margin: '6px 0 0', fontSize: '13px' }}>Try typing another module or keyword.</p>
            </div>
          )}
        </div>

        {/* Item preview drawer/popup */}
        {selectedItem && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(15, 23, 42, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 100001,
              padding: '16px'
            }}
            onClick={() => setSelectedItem(null)}
          >
            <div
              style={{
                background: '#ffffff',
                borderRadius: '10px',
                width: '100%',
                maxWidth: '480px',
                boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Sparkles size={16} color="#2563eb" />
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#1e293b' }}>{selectedItem.name}</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedItem(null)}
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }}
                >
                  <X size={18} />
                </button>
              </div>

              <div style={{ fontSize: '13.5px', color: '#475569', lineHeight: 1.5 }}>
                <p style={{ margin: '0 0 10px', fontSize: '12px', color: '#94a3b8' }}>Section: {selectedItem.sectionTitle}</p>
                <p style={{ margin: 0 }}>{selectedItem.description || `Configuration and options for ${selectedItem.name}.`}</p>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', paddingTop: '10px', borderTop: '1px solid #f1f5f9' }}>
                <button
                  type="button"
                  style={{ padding: '6px 14px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}
                  onClick={() => setSelectedItem(null)}
                >
                  Close
                </button>
                <button
                  type="button"
                  style={{ padding: '6px 14px', borderRadius: '6px', border: 'none', background: '#2563eb', color: '#fff', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}
                  onClick={() => {
                    alert(`${selectedItem.name} settings saved successfully.`);
                    setSelectedItem(null);
                  }}
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}

export default OrganizationSettingsModal;
