import React, { useMemo } from 'react';
import {
  FileText,
  User,
  CreditCard,
} from 'lucide-react';
import styles from './EmployeeIdCardReportView.module.css';

/**
 * Custom SVG Security Officer Outline Emblem (Matching Image 1 Circular Badge)
 */
export function SecurityOfficerEmblem() {
  return (
    <svg
      viewBox="0 0 64 64"
      width="44"
      height="44"
      fill="none"
      stroke="#3b629b"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* Officer Cap */}
      <path d="M14 23 C16 16, 32 16, 34 23 L14 23 Z" fill="rgba(74, 111, 165, 0.12)" />
      <path d="M12 23 L36 23" />
      <path d="M16 23 Q24 27 32 23" fill="#3b629b" />
      {/* Head */}
      <circle cx="24" cy="27" r="4.5" />
      {/* Saluting Hand & Arm */}
      <path d="M10 38 L16 30 L24 25" />
      {/* Shoulders & Torso */}
      <path d="M14 48 L14 40 Q24 36 34 40 L34 48" />
      {/* Rifle Silhouette on right */}
      <line x1="42" y1="12" x2="42" y2="52" strokeWidth="2.5" />
      <line x1="39" y1="16" x2="42" y2="12" strokeWidth="2" />
      <rect x="40.5" y="22" width="3" height="14" rx="1.5" fill="#3b629b" />
      <path d="M40.5 44 L43.5 44 L43.5 52 L40.5 52 Z" fill="#3b629b" />
    </svg>
  );
}

/**
 * Single Professional Employee ID Card (Matching Image 1)
 */
export function SingleIdCardItem({ record = {}, companyInfo = {} }) {
  // Resolve configured company details dynamically
  let savedSetup = {};
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem('novaspark_company_setup') : null;
    if (raw) savedSetup = JSON.parse(raw);
  } catch (e) {}

  let adminCompanies = [];
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem('novaspark_admin_companies') : null;
    if (raw) adminCompanies = JSON.parse(raw);
  } catch (e) {}
  const localDefaultComp = adminCompanies.find(c => c.isDefault) || adminCompanies[0] || {};

  const recComp = record.companyInfo || {};

  const companyName = (
    recComp.name ||
    recComp.companyName ||
    record.companyName ||
    companyInfo?.name ||
    companyInfo?.companyName ||
    savedSetup?.companyName ||
    localDefaultComp?.name ||
    'RR SECURITY & FACILITIES'
  ).toUpperCase();

  const companyAddress =
    recComp.address ||
    record.companyAddress ||
    (companyInfo?.address && companyInfo.address !== '—' ? companyInfo.address : null) ||
    savedSetup?.address ||
    localDefaultComp?.address ||
    'G-75/A, New Delhi, Badarpur,Block-G, M.B.Extn,Badarpur,NEW DELHI,110044';

  const companyContactPhone =
    recComp.phone ||
    record.companyPhone ||
    (companyInfo?.phone && companyInfo.phone !== '—' ? companyInfo.phone : null) ||
    savedSetup?.phone ||
    savedSetup?.contactNumber ||
    localDefaultComp?.phone ||
    '9891325151';

  const companyContactEmail =
    recComp.email ||
    record.companyEmail ||
    (companyInfo?.email && companyInfo.email !== '—' ? companyInfo.email : null) ||
    savedSetup?.email ||
    localDefaultComp?.email ||
    'office.rrsf@gmail.com';

  const logo =
    recComp.logo ||
    record.companyLogo ||
    companyInfo?.logo ||
    companyInfo?.logoUrl ||
    savedSetup?.logo ||
    localDefaultComp?.logo ||
    '';

  const name = record.name || record.employeeName || '—';
  const empCode = record.employeeCode || record.employeeId || '—';
  const gender = record.gender || 'Female';
  const bloodGroup = record.bloodGroup || record.blood || 'B+ve';
  const designation = record.designation || 'Office Assistant';
  const contactNo = record.contact || record.phone || record.mobile || '9891325151';
  const email = record.email || (name && name !== '—' ? `${name.toLowerCase().replace(/[^a-z0-9]/g, '')}@gmail.com` : '—');
  const photo = record.photo || record.employeePhoto || '';

  return (
    <div className={styles.singleCard} data-id-card="true">
      {/* Top Section */}
      <div className={styles.cardTopSection}>
        {/* Emblem Badge */}
        <div className={styles.emblemCircle}>
          {logo ? (
            <img src={logo} alt={companyName} className={styles.emblemLogoImg} />
          ) : (
            <SecurityOfficerEmblem />
          )}
        </div>

        {/* Company Title */}
        <div className={styles.companyTitle}>{companyName}</div>

        {/* Employee Photo */}
        {photo ? (
          <img src={photo} alt={name} className={styles.photoCircle} />
        ) : (
          <div className={styles.photoPlaceholder}>
            <User size={56} color="#94a3b8" />
          </div>
        )}

        {/* Employee Name */}
        <div className={styles.empName}>{name}</div>

        {/* Employee Code */}
        <div className={styles.empCode}>{empCode}</div>
      </div>

      {/* Two-Column Details Grid */}
      <div className={styles.detailsGrid}>
        {/* Left Column */}
        <div className={styles.leftCol}>
          <div className={styles.metricBlock}>
            <span className={styles.metricLabel}>Gender</span>
            <span className={styles.metricValue}>{gender}</span>
          </div>

          <div className={styles.metricBlock}>
            <span className={styles.metricLabel}>Designation</span>
            <span className={styles.metricValue}>{designation}</span>
          </div>

          <div className={styles.metricBlock}>
            <span className={styles.metricLabel}>Email</span>
            <span className={styles.metricValueSmall}>{email}</span>
          </div>
        </div>

        {/* Right Column */}
        <div className={styles.rightCol}>
          <div className={styles.metricBlock}>
            <span className={styles.metricLabel}>Blood Group</span>
            <span className={styles.metricValue}>{bloodGroup}</span>
          </div>

          <div className={styles.metricBlock}>
            <span className={styles.metricLabel}>Contact No</span>
            <span className={styles.metricValue}>{contactNo}</span>
          </div>
        </div>
      </div>

      {/* Bottom Footer */}
      <div className={styles.cardFooter}>
        <div className={styles.footerAddress}>{companyAddress}</div>
        <div className={styles.footerContact}>
          {companyContactPhone} | Email: {companyContactEmail}
        </div>
      </div>
    </div>
  );
}

/**
 * Main Employee ID Card Report View
 */
export default function EmployeeIdCardReportView({
  records = [],
  companyInfo = {},
  filters = {},
}) {
  const selectedEmpFilter = filters?.employee;
  const isAllEmployees = !selectedEmpFilter || selectedEmpFilter === 'All Employees';

  // Filter target employee if a specific employee was selected
  const targetEmployee = useMemo(() => {
    if (!records.length) return null;
    if (!isAllEmployees && selectedEmpFilter) {
      const targetTerm = selectedEmpFilter.includes('—')
        ? selectedEmpFilter.split('—')[0].trim().toLowerCase()
        : selectedEmpFilter.trim().toLowerCase();
      const idTerm = selectedEmpFilter.includes('—')
        ? selectedEmpFilter.split('—')[1].trim().toLowerCase()
        : '';

      return (
        records.find((r) => {
          const id = String(r.employeeId || r.employeeCode || '').toLowerCase();
          const name = String(r.name || '').toLowerCase();
          if (idTerm && id === idTerm) return true;
          if (targetTerm && (name.includes(targetTerm) || id.includes(targetTerm))) return true;
          return false;
        }) || records[0]
      );
    }
    return records[0];
  }, [records, selectedEmpFilter, isAllEmployees]);

  const employeesToRender = useMemo(() => {
    if (!isAllEmployees && targetEmployee) {
      return [targetEmployee];
    }
    return records;
  }, [records, isAllEmployees, targetEmployee]);

  if (!records || records.length === 0) {
    return (
      <div className={styles.emptyState}>
        <FileText size={40} color="#94a3b8" style={{ marginBottom: '12px' }} />
        <h4 className={styles.emptyTitle}>No Employee ID Cards Found</h4>
        <p className={styles.emptyText}>
          No employee records match your selected filters (Company:{' '}
          {filters?.company || 'All Companies'}, Department:{' '}
          {filters?.department || 'All Departments'}).
        </p>
      </div>
    );
  }

  return (
    <div className={styles.container} id="report-preview-capture-area">
      {/* Controls Bar */}
      <div className={styles.controlsBar}>
        <div className={styles.controlsLeft}>
          <CreditCard size={18} color="#2563eb" />
          <span>Employee Identity Cards</span>
          <span className={styles.cardCountBadge}>
            {employeesToRender.length}{' '}
            {employeesToRender.length === 1 ? 'Card' : 'Cards'}
          </span>
        </div>
      </div>

      {/* Cards Display Grid */}
      <div className={styles.cardsGrid}>
        {employeesToRender.map((emp, idx) => (
          <SingleIdCardItem
            key={emp.employeeId || emp.employeeCode || idx}
            record={emp}
            companyInfo={companyInfo}
          />
        ))}
      </div>
    </div>
  );
}
