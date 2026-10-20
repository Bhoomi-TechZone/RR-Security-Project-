import React, { useMemo, useState } from 'react';
import {
  FileText,
  Phone,
  MapPin,
  Mail,
  Globe,
  User,
  ShieldCheck,
  CreditCard,
  Layers,
  Sparkles
} from 'lucide-react';
import styles from './EmployeeIdCardReportView.module.css';

/**
 * Custom SVG Security Guard Outline Icon (matching Image 1 Header)
 */
function SecurityOfficerIcon() {
  return (
    <svg
      viewBox="0 0 64 64"
      width="38"
      height="38"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* Officer Cap */}
      <path d="M12 24 C14 17, 30 17, 32 24 L12 24 Z" fill="rgba(255,255,255,0.2)" />
      <path d="M10 24 L34 24" />
      <path d="M14 24 Q22 28 30 24" fill="currentColor" />
      {/* Head & Face */}
      <circle cx="22" cy="27" r="4.5" />
      {/* Saluting Hand & Arm */}
      <path d="M8 38 L14 30 L22 25" />
      {/* Shoulders & Torso */}
      <path d="M12 48 L12 40 Q22 36 32 40 L32 48" />
      {/* Rifle Silhouette on right */}
      <line x1="39" y1="12" x2="39" y2="52" strokeWidth="2.5" />
      <line x1="36" y1="16" x2="39" y2="12" strokeWidth="2" />
      <rect x="37.5" y="22" width="3" height="14" rx="1.5" fill="currentColor" />
      <path d="M37.5 44 L40.5 44 L40.5 52 L37.5 52 Z" fill="currentColor" />
    </svg>
  );
}

/**
 * Official Stamp / Seal (matching Image 1 Back)
 */
function OfficialStampSeal() {
  return (
    <svg viewBox="0 0 100 100" className={styles.stampSvg}>
      <circle cx="50" cy="50" r="46" fill="none" stroke="#113669" strokeWidth="2" />
      <circle
        cx="50"
        cy="50"
        r="42.5"
        fill="none"
        stroke="#113669"
        strokeWidth="1"
        strokeDasharray="2.5,2.5"
      />
      <circle cx="50" cy="50" r="29" fill="none" stroke="#113669" strokeWidth="1.8" />
      <text
        x="50"
        y="47"
        textAnchor="middle"
        fill="#113669"
        fontSize="12.5"
        fontWeight="900"
        fontFamily="sans-serif"
      >
        RRSF
      </text>
      <text
        x="50"
        y="58"
        textAnchor="middle"
        fill="#113669"
        fontSize="7.5"
        fontWeight="bold"
        fontFamily="sans-serif"
      >
        ★★
      </text>
      <path id="sealPathTop" d="M 17,50 A 33,33 0 0,1 83,50" fill="none" />
      <text fontSize="6.4" fontWeight="bold" fill="#113669" letterSpacing="0.6">
        <textPath href="#sealPathTop" startOffset="50%" textAnchor="middle">
          RR SECURITY &amp; FACILITIES
        </textPath>
      </text>
      <path id="sealPathBottom" d="M 83,50 A 33,33 0 0,1 17,50" fill="none" />
      <text fontSize="6.8" fontWeight="bold" fill="#113669" letterSpacing="0.8">
        <textPath href="#sealPathBottom" startOffset="50%" textAnchor="middle">
          NEW DELHI
        </textPath>
      </text>
    </svg>
  );
}

/**
 * Single Employee ID Card - FRONT
 */
export function IdCardFrontItem({ record }) {
  const empCode = record.employeeCode || record.employeeId || '—';
  const name = (record.name || record.employeeName || '—').toUpperCase();
  const desigBadge = record.designationBadge || record.designation || 'Staff';
  const phone = record.phone || record.mobile || '—';
  const photo = record.photo || record.employeePhoto || '';

  const qrData = `BEGIN:VCARD\nVERSION:3.0\nN:${name}\nFN:${name}\nORG:RR SECURITY & FACILITIES\nTITLE:${record.designation || 'Staff'}\nTEL:${phone}\nNOTE:EmpCode:${empCode}\nEND:VCARD`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&margin=4&data=${encodeURIComponent(qrData)}`;

  return (
    <div className={`${styles.idCard} ${styles.frontCard}`}>
      {/* 1. Header with deep blue wave */}
      <div className={styles.frontHeaderWrap}>
        <div className={styles.frontHeaderContent}>
          <div className={styles.guardIconWrap}>
            <SecurityOfficerIcon />
          </div>
          <div className={styles.headerDividerLine} />
          <div className={styles.companyTitleText}>
            <span>RR SECURITY</span>
            <span>&amp; FACILITIES</span>
          </div>
        </div>

        {/* Curved Wave SVG */}
        <svg
          className={styles.headerWaveSvg}
          viewBox="0 0 324 28"
          preserveAspectRatio="none"
          fill="none"
        >
          <path
            d="M0,0 Q80,24 162,14 T324,20 L324,28 L0,28 Z"
            fill="#3b82f6"
            opacity="0.4"
          />
          <path
            d="M0,0 Q100,26 180,12 T324,24 L324,28 L0,28 Z"
            fill="#ffffff"
          />
        </svg>
      </div>

      {/* 2. Employee Photo */}
      <div className={styles.photoContainer}>
        <div className={styles.photoFrame}>
          {photo ? (
            <img src={photo} alt={name} className={styles.employeeImg} />
          ) : (
            <div className={styles.photoPlaceholder}>
              <User size={64} color="#94a3b8" />
            </div>
          )}
        </div>
      </div>

      {/* 3. Details */}
      <div className={styles.empCode}>Emp. Code : {empCode}</div>
      <h3 className={styles.empName}>{name}</h3>

      <div>
        <span className={styles.designationBadge}>{desigBadge}</span>
      </div>

      <div className={styles.phoneRow}>
        <span className={styles.phoneIcon}>
          <Phone size={14} fill="#991b1b" strokeWidth={1} />
        </span>
        <span>{phone}</span>
      </div>

      {/* 4. QR Code with Google Badge Accent */}
      <div className={styles.qrWrapper}>
        <div className={styles.qrContainer}>
          <img src={qrUrl} alt="Employee QR Code" className={styles.qrImg} />
          <span className={styles.qrGoogleG}>G</span>
        </div>
      </div>

      {/* 5. Footer Blue Wave */}
      <div className={styles.frontFooterWave} />
    </div>
  );
}

/**
 * Single Employee ID Card - BACK
 */
export function IdCardBackItem({ record }) {
  const emergencyPhone = record.emergencyPhone || '—';
  const dateOfIssue = record.dateOfIssue || '—';
  const dob = record.dob || '—';
  const aadhaar = record.aadhaar || '—';
  const companyAddress =
    record.companyAddress ||
    'Office: G-75/A, Ground Floor, Block-G M.B. EXTN., Badarpur New Delhi-110044';
  const companyPhone = record.companyPhone || '9891325151, 9891325252';
  const companyEmail = record.companyEmail || 'Office.rrsf@gmail.com';
  const companyWebsite = record.companyWebsite || 'www.rrsfindia.com';

  return (
    <div className={`${styles.idCard} ${styles.backCard}`}>
      {/* Top Wave */}
      <div className={styles.backWaveTop} />

      {/* Emergency Contact */}
      <div className={styles.emergencyHeader}>EMERGENCY CONTACT</div>
      <div className={styles.emergencyPhoneRow}>
        <Phone size={17} fill="#991b1b" strokeWidth={1} />
        <span>{emergencyPhone}</span>
      </div>

      {/* Details Table */}
      <div className={styles.detailsTableWrap}>
        <table className={styles.detailsTable}>
          <tbody>
            <tr>
              <td className={styles.detailLabelCol}>Date Of Issue</td>
              <td className={styles.detailColonCol}>:</td>
              <td className={styles.detailValCol}>{dateOfIssue}</td>
            </tr>
            <tr>
              <td className={styles.detailLabelCol}>D.O.B</td>
              <td className={styles.detailColonCol}>:</td>
              <td className={styles.detailValCol}>{dob}</td>
            </tr>
            <tr>
              <td className={styles.detailLabelCol}>Addhar No.</td>
              <td className={styles.detailColonCol}>:</td>
              <td className={styles.detailValCol}>{aadhaar}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Authorised Signature & Stamp Seal */}
      <div className={styles.sigSealRow}>
        <div className={styles.sigBlock}>
          <span className={styles.signatureScript}>Kashish</span>
          <span className={styles.sigTitle}>Authorised Signature</span>
        </div>
        <div className={styles.stampSealWrap}>
          <OfficialStampSeal />
        </div>
      </div>

      {/* Emergency Communication Address */}
      <div className={styles.addressSection}>
        <div className={styles.addressHeader}>
          ADDRESS FOR COMMUNICATION IN CASE OF EMERGENCY
        </div>
        <div className={styles.companyNameSlab}>RR SECURITY &amp; FACILITIES</div>

        <div className={styles.addressItemsList}>
          <div className={styles.addressRow}>
            <MapPin size={13} className={styles.addrIcon} />
            <span>{companyAddress}</span>
          </div>
          <div className={styles.addressRow}>
            <Phone size={13} className={styles.addrIcon} />
            <span>{companyPhone}</span>
          </div>
          <div className={styles.addressRow}>
            <Mail size={13} className={styles.addrIcon} />
            <span>{companyEmail}</span>
          </div>
          <div className={styles.addressRow}>
            <Globe size={13} className={styles.addrIcon} />
            <span>{companyWebsite}</span>
          </div>
        </div>
      </div>

      {/* Bottom Wave */}
      <div className={styles.backWaveBottom} />
    </div>
  );
}

/**
 * Main Dynamic Employee ID Card Report View
 */
export default function EmployeeIdCardReportView({
  records = [],
  companyInfo = {},
  filters = {},
}) {
  const [viewMode, setViewMode] = useState('both'); // 'both' | 'front' | 'back'

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
    <div className={styles.container}>
      {/* Controls Bar for Front/Back preview */}
      <div className={styles.controlsBar}>
        <div className={styles.controlsLeft}>
          <CreditCard size={16} color="#2563eb" />
          <span>
            Displaying {employeesToRender.length}{' '}
            {employeesToRender.length === 1 ? 'ID Card' : 'ID Cards'}
          </span>
        </div>

        <div className={styles.viewModeGroup}>
          <button
            type="button"
            className={`${styles.modeBtn} ${viewMode === 'both' ? styles.modeBtnActive : ''}`}
            onClick={() => setViewMode('both')}
          >
            Front &amp; Back
          </button>
          <button
            type="button"
            className={`${styles.modeBtn} ${viewMode === 'front' ? styles.modeBtnActive : ''}`}
            onClick={() => setViewMode('front')}
          >
            Front Side
          </button>
          <button
            type="button"
            className={`${styles.modeBtn} ${viewMode === 'back' ? styles.modeBtnActive : ''}`}
            onClick={() => setViewMode('back')}
          >
            Back Side
          </button>
        </div>
      </div>

      {/* Cards Display Grid */}
      {employeesToRender.map((emp, idx) => (
        <div key={emp.employeeId || emp.employeeCode || idx} className={styles.cardsPairWrapper}>
          {(viewMode === 'both' || viewMode === 'front') && (
            <IdCardFrontItem record={emp} />
          )}
          {(viewMode === 'both' || viewMode === 'back') && (
            <IdCardBackItem record={emp} />
          )}
        </div>
      ))}
    </div>
  );
}
