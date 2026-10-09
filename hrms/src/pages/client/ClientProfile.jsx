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
  CheckCircle2
} from 'lucide-react';
import styles from './ClientProfile.module.css';
import { useClientAuth } from '../../context/ClientAuthContext';
import StatusBadge from '../../components/common/StatusBadge';
import Toast from '../../components/common/Toast';

function ClientProfile() {
  const { clientCompany, clientUser } = useClientAuth();
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

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
              <strong>Verified Enterprise Record:</strong> Company registration, contracts, tax identifiers, and authorized representatives are managed securely by RR Security Administrator. Client access is read-only.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ClientProfile;
