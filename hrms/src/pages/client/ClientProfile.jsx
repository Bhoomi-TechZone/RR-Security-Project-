import React, { useState } from 'react';
import {
  Building2,
  Building,
  Mail,
  Phone,
  MapPin,
  Calendar,
  FileCheck,
  ShieldCheck,
  Info,
  Clock,
  Layers,
  Award,
  Edit2,
  X,
  Save,
  CheckCircle2
} from 'lucide-react';
import styles from './ClientProfile.module.css';
import { useClientAuth } from '../../context/ClientAuthContext';
import clientPortalService from '../../services/clientPortalService';
import StatusBadge from '../../components/common/StatusBadge';
import Toast from '../../components/common/Toast';

function ClientProfile() {
  const { clientCompany, clientUser, refreshProfile, setClientCompany } = useClientAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const [formData, setFormData] = useState({
    contactPerson: clientCompany?.contactPerson || '',
    contactNumber: clientCompany?.contactNumber || '',
    email: clientCompany?.email || '',
    address: clientCompany?.registeredAddress || clientCompany?.address || ''
  });

  const handleOpenEdit = () => {
    setFormData({
      contactPerson: clientCompany?.contactPerson || '',
      contactNumber: clientCompany?.contactNumber || '',
      email: clientCompany?.email || '',
      address: clientCompany?.registeredAddress || clientCompany?.address || ''
    });
    setIsEditing(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const updated = await clientPortalService.updateProfile(formData);
      if (updated) {
        setClientCompany((prev) => ({ ...prev, ...updated }));
        await refreshProfile();
      }
      setToast({
        show: true,
        message: 'Authorized contact and address details updated successfully.',
        type: 'success'
      });
      setIsEditing(false);
    } catch (err) {
      setToast({
        show: true,
        message: err.message || 'Failed to update profile.',
        type: 'error'
      });
    } finally {
      setSaving(false);
    }
  };

  const initials = (clientCompany?.contactPerson || clientCompany?.name || 'CC')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className={styles.container}>
      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ show: false, message: '', type: 'success' })}
        />
      )}

      {/* Header */}
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>{clientCompany?.name}</h1>
          <p className={styles.pageSubtitle}>
            Official company profile, registered addresses, contract SLAs, and authorized contact details.
          </p>
        </div>

        <button
          type="button"
          className={styles.modalPrimaryBtn || styles.primaryBtn}
          onClick={handleOpenEdit}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 18px',
            background: 'var(--primary-color, #2563eb)',
            color: '#fff',
            borderRadius: '8px',
            border: 'none',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: '13px'
          }}
        >
          <Edit2 size={15} />
          <span>Edit Contact Details</span>
        </button>
      </div>

      {/* Main Profile Grid */}
      <div className={styles.grid}>
        {/* Left Column: Core Company & Contract Details */}
        <div className={styles.colMain}>
          {/* Card 1: Corporate Identity */}
          <section className={styles.profileCard}>
            <div className={styles.cardHeader}>
              <div className={styles.cardHeaderLeft}>
                <div className={styles.cardIconWrap}>
                  <Building2 size={20} />
                </div>
                <div>
                  <h2 className={styles.cardTitle}>Corporate Identity</h2>
                  <p className={styles.cardSubtitle}>Registration and tax identifier details</p>
                </div>
              </div>
              <StatusBadge status="Active" text="Contract Active" />
            </div>

            <div className={styles.fieldsGrid}>
              <div className={styles.field}>
                <span className={styles.fieldLabel}>Display Name</span>
                <span className={styles.fieldValue}>{clientCompany?.name}</span>
              </div>

              <div className={styles.field}>
                <span className={styles.fieldLabel}>Legal Entity Name</span>
                <span className={styles.fieldValue}>{clientCompany?.legalName || `${clientCompany?.name} Pvt. Ltd.`}</span>
              </div>

              <div className={styles.field}>
                <span className={styles.fieldLabel}>Client Code / ID</span>
                <span className={styles.fieldCode}>{clientCompany?.clientCode || clientCompany?.clientId}</span>
              </div>

              <div className={styles.field}>
                <span className={styles.fieldLabel}>Industry / Sector</span>
                <span className={styles.fieldValue}>{clientCompany?.industry || 'Security & Facility Management'}</span>
              </div>

              <div className={styles.field}>
                <span className={styles.fieldLabel}>GSTIN</span>
                <span className={styles.fieldValueMono}>{clientCompany?.gstin || '09ABCDE1234F1Z5'}</span>
              </div>

              <div className={styles.field}>
                <span className={styles.fieldLabel}>Permanent Account Number (PAN)</span>
                <span className={styles.fieldValueMono}>{clientCompany?.pan || 'ABCDE1234F'}</span>
              </div>
            </div>
          </section>

          {/* Card 2: Contract & Service Agreement */}
          <section className={styles.profileCard}>
            <div className={styles.cardHeader}>
              <div className={styles.cardHeaderLeft}>
                <div className={`${styles.cardIconWrap} ${styles.iconPurple}`}>
                  <FileCheck size={20} />
                </div>
                <div>
                  <h2 className={styles.cardTitle}>Contract & Service Level Agreement</h2>
                  <p className={styles.cardSubtitle}>Manpower engagement validity and SLA tier</p>
                </div>
              </div>
            </div>

            <div className={styles.fieldsGrid}>
              <div className={styles.field}>
                <span className={styles.fieldLabel}>Contract Start Date</span>
                <span className={styles.fieldValue}>{clientCompany?.contractStartDate || '2026-01-01'}</span>
              </div>

              <div className={styles.field}>
                <span className={styles.fieldLabel}>Contract Expiry Date</span>
                <span className={styles.fieldValue}>{clientCompany?.contractEndDate || '2027-01-01'}</span>
              </div>

              <div className={styles.field}>
                <span className={styles.fieldLabel}>Service Tier / SLA</span>
                <span className={styles.fieldValueBadge}>
                  <Award size={13} color="#2563eb" />
                  {clientCompany?.serviceTier || 'Enterprise SLA - 24/7 Security & Patrol'}
                </span>
              </div>

              <div className={styles.field}>
                <span className={styles.fieldLabel}>Deployment Mode</span>
                <span className={styles.fieldValue}>Dedicated On-site Guarding & Biometric Verification</span>
              </div>
            </div>
          </section>

          {/* Card 3: Operating Sites */}
          <section className={styles.profileCard}>
            <div className={styles.cardHeader}>
              <div className={styles.cardHeaderLeft}>
                <div className={`${styles.cardIconWrap} ${styles.iconTeal}`}>
                  <MapPin size={20} />
                </div>
                <div>
                  <h2 className={styles.cardTitle}>Approved Operating Sites</h2>
                  <p className={styles.cardSubtitle}>Authorized locations where personnel are actively deployed</p>
                </div>
              </div>
            </div>

            <div className={styles.sitesList}>
              {(clientCompany?.operatingSites || [
                'Main Facility & Perimeter Gate',
                'Corporate Headquarters',
                'Warehouse & Logistics Block'
              ]).map((site, index) => (
                <div key={index} className={styles.siteItem}>
                  <div className={styles.siteNum}>{index + 1}</div>
                  <div className={styles.siteInfo}>
                    <span className={styles.siteName}>{site}</span>
                    <span className={styles.siteStatus}>Active Patrol Area</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Right Column: Contact Person & Addresses */}
        <div className={styles.colSide}>
          {/* Card 4: Authorized Representative */}
          <section className={styles.profileCard}>
            <div className={styles.cardHeader}>
              <div className={styles.cardHeaderLeft}>
                <div className={`${styles.cardIconWrap} ${styles.iconGreen}`}>
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <h2 className={styles.cardTitle}>Authorized Contact</h2>
                  <p className={styles.cardSubtitle}>Primary client liaison</p>
                </div>
              </div>
            </div>

            <div className={styles.contactDetails}>
              <div className={styles.contactAvatarRow}>
                <div className={styles.avatarLarge}>{initials}</div>
                <div>
                  <h3 className={styles.contactName}>{clientCompany?.contactPerson || clientCompany?.name || 'Authorized Representative'}</h3>
                  <span className={styles.contactRole}>{clientCompany?.designation || 'Client Representative'}</span>
                </div>
              </div>

              <div className={styles.contactRow}>
                <Phone size={15} className={styles.contactIcon} />
                <span>{clientCompany?.contactNumber || '--'}</span>
              </div>

              <div className={styles.contactRow}>
                <Mail size={15} className={styles.contactIcon} />
                <span>{clientCompany?.email || '--'}</span>
              </div>

              <div className={styles.contactRow}>
                <Mail size={15} className={styles.contactIcon} />
                <span>Billing: {clientCompany?.billingEmail || clientCompany?.email || '--'}</span>
              </div>
            </div>
          </section>

          {/* Card 5: Registered & Billing Addresses */}
          <section className={styles.profileCard}>
            <div className={styles.cardHeader}>
              <div className={styles.cardHeaderLeft}>
                <div className={`${styles.cardIconWrap} ${styles.iconAmber}`}>
                  <MapPin size={20} />
                </div>
                <div>
                  <h2 className={styles.cardTitle}>Addresses</h2>
                  <p className={styles.cardSubtitle}>Billing and registered locations</p>
                </div>
              </div>
            </div>

            <div className={styles.addressSection}>
              <div className={styles.addressBox}>
                <span className={styles.addressLabel}>Registered Address</span>
                <p className={styles.addressText}>{clientCompany?.registeredAddress || clientCompany?.address || 'Not specified'}</p>
              </div>

              <div className={styles.addressBox}>
                <span className={styles.addressLabel}>Billing Address</span>
                <p className={styles.addressText}>{clientCompany?.billingAddress || clientCompany?.address || 'Not specified'}</p>
              </div>
            </div>
          </section>

          {/* Card 6: Admin Managed Note */}
          <div className={styles.readOnlyNoticeBox}>
            <Info size={16} className={styles.noticeIcon} />
            <div className={styles.noticeText}>
              <strong>Managed Profile:</strong> Company registration, contracts, and tax entities are managed securely by RR Security Administrator. You can edit your representative contact info anytime.
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {isEditing && (
        <div className={styles.modalOverlay || styles.modalBackdrop} style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          backdropFilter: 'blur(3px)'
        }} onClick={() => setIsEditing(false)}>
          <div style={{
            background: 'var(--surface-bg, #ffffff)',
            borderRadius: '12px',
            width: '100%',
            maxWidth: '520px',
            padding: '24px',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)',
            border: '1px solid var(--border-color, #e2e8f0)'
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>Edit Authorized Contact</h3>
                <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>
                  Update primary representative details for {clientCompany?.name}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>
                  Contact Representative Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.contactPerson}
                  onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '6px',
                    border: '1px solid var(--border-color, #cbd5e1)',
                    background: 'var(--input-bg, #ffffff)',
                    fontSize: '13px'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>
                  Contact Phone Number
                </label>
                <input
                  type="text"
                  required
                  value={formData.contactNumber}
                  onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '6px',
                    border: '1px solid var(--border-color, #cbd5e1)',
                    background: 'var(--input-bg, #ffffff)',
                    fontSize: '13px'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>
                  Corporate Email
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '6px',
                    border: '1px solid var(--border-color, #cbd5e1)',
                    background: 'var(--input-bg, #ffffff)',
                    fontSize: '13px'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>
                  Registered / Operating Address
                </label>
                <textarea
                  rows="3"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '6px',
                    border: '1px solid var(--border-color, #cbd5e1)',
                    background: 'var(--input-bg, #ffffff)',
                    fontSize: '13px',
                    resize: 'vertical'
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  style={{
                    padding: '9px 16px',
                    borderRadius: '6px',
                    border: '1px solid var(--border-color, #cbd5e1)',
                    background: 'var(--surface-bg)',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: '13px'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  style={{
                    padding: '9px 20px',
                    borderRadius: '6px',
                    border: 'none',
                    background: 'var(--primary-color, #2563eb)',
                    color: '#fff',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: '13px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <Save size={15} />
                  <span>{saving ? 'Saving...' : 'Save Changes'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ClientProfile;
