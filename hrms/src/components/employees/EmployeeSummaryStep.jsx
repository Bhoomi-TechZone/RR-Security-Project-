import React, { useState, useMemo } from 'react';
import {
  CreditCard,
  Download,
  HelpCircle,
  Copy,
  Check,
  Building2,
  Briefcase,
  MapPin,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  X,
  Phone,
  Mail,
  UserCheck
} from 'lucide-react';
import styles from './EmployeeSummaryStep.module.css';
import { useCompany } from '../../context/CompanyContext';
import { downloadEmployeeIdCardPdf } from '../../utils/idCardExport';
import { downloadEmployeeProfile } from '../../utils/employeeProfileExport';

function formatDisplayDate(dateStr) {
  if (!dateStr) return 'Not Added';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const day = String(d.getDate()).padStart(2, '0');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${day}-${months[d.getMonth()]}-${d.getFullYear()}`;
  } catch {
    return dateStr;
  }
}

function EmployeeSummaryStep({ data }) {
  const { activeCompany } = useCompany();
  const [copiedField, setCopiedField] = useState('');
  const [showCompletionModal, setShowCompletionModal] = useState(false);

  // Compute profile completeness percentage dynamically based on entered data
  const completeness = useMemo(() => {
    const fields = [
      data.name,
      data.employeeCode || data.employeeId,
      data.designation,
      data.department,
      data.siteLocation || data.site || data.joiningLocation,
      data.joiningDate,
      data.gender,
      data.dob,
      data.mobile || data.contact,
      data.email,
      data.presentAddress,
      data.pan,
      data.aadhaar,
      data.bankName,
      data.accountNumber,
      data.employeePhoto
    ];
    const filled = fields.filter((f) => Boolean(f && String(f).trim())).length;
    const percent = Math.min(100, Math.max(10, Math.round((filled / fields.length) * 100)));
    return percent;
  }, [data]);

  const handleCopy = (val, fieldKey) => {
    if (!val) return;
    navigator.clipboard.writeText(val);
    setCopiedField(fieldKey);
    setTimeout(() => setCopiedField(''), 2000);
  };

  const handleDownloadIdCard = async () => {
    try {
      await downloadEmployeeIdCardPdf(data, activeCompany);
    } catch (err) {
      console.error('Failed to export ID Card:', err);
    }
  };

  const handleDownloadStatement = () => {
    try {
      downloadEmployeeProfile(data, activeCompany);
    } catch (err) {
      console.error('Failed to export Employee Statement:', err);
    }
  };

  const empName = data.name || 'New Employee';
  const empCode = data.employeeCode || data.employeeId || 'Pending';
  const empDesignation = data.designation || 'Staff / Unassigned';
  const empDepartment = data.department || 'Operations';
  const empLocation = data.siteLocation || data.site || data.joiningLocation || 'Main Location';
  const empEmail = data.email || 'Not Added';
  const empMobile = data.mobile || data.contact || 'Not Added';
  const empPhoto = data.employeePhoto || data.photo || '';

  // Confirmation date: calculated 1 year after joining or custom
  const confirmationDate = useMemo(() => {
    if (data.confirmationDate) return formatDisplayDate(data.confirmationDate);
    if (data.joiningDate) {
      try {
        const jd = new Date(data.joiningDate);
        if (!isNaN(jd.getTime())) {
          jd.setFullYear(jd.getFullYear() + 1);
          return formatDisplayDate(jd.toISOString());
        }
      } catch {}
    }
    return 'Pending';
  }, [data.joiningDate, data.confirmationDate]);

  const isExited = Boolean(
    data.exitDate ||
    data.employeeStatus === 'Inactive' ||
    data.status === 'Inactive' ||
    data.employeeStatus === 'Exited'
  );

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.titleArea}>
          <h2 className={styles.title}>Summary</h2>
          <p className={styles.subtitle}>
            Summary of employee's record (read-only mode).
          </p>
        </div>

        {/* Top-Right Action Buttons */}
        <div className={styles.headerActions}>
          <button
            type="button"
            className={styles.idCardBtn}
            onClick={handleDownloadIdCard}
            title="Download Employee ID Card"
          >
            <CreditCard size={14} />
            <span>Id Card</span>
          </button>

          <button
            type="button"
            className={styles.statementBtn}
            onClick={handleDownloadStatement}
            title="Download Employee Profile Statement"
          >
            <Download size={14} />
            <span>Statement</span>
          </button>
        </div>
      </div>

      {/* Main Two-Column Summary Layout */}
      <div className={styles.summaryGrid}>
        {/* LEFT COLUMN: Profile & Managers Card */}
        <div className={styles.leftCard}>
          {/* Top Profile Row */}
          <div className={styles.profileRow}>
            <div className={styles.profileMain}>
              <div className={styles.avatarBox}>
                {empPhoto ? (
                  <img src={empPhoto} alt={empName} className={styles.avatarImg} />
                ) : (
                  <span className={styles.avatarFallback}>
                    {empName.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>

              <div className={styles.profileInfo}>
                <h3 className={styles.employeeName}>{empName}</h3>
                <div className={styles.codeRow}>
                  <span className={styles.codeLabel}>E-Code</span>
                  <span className={styles.codeValue}>{empCode}</span>
                  {empCode !== 'Pending' && (
                    <button
                      type="button"
                      className={styles.copyIconBtn}
                      onClick={() => handleCopy(empCode, 'code')}
                      title="Copy E-Code"
                    >
                      {copiedField === 'code' ? (
                        <Check size={13} style={{ color: '#16a34a' }} />
                      ) : (
                        <Copy size={13} />
                      )}
                    </button>
                  )}
                </div>

                <div className={styles.metaItem}>
                  <Briefcase size={13} className={styles.metaIcon} />
                  <span>{empDesignation}</span>
                </div>

                <div className={styles.metaItem}>
                  <Building2 size={13} className={styles.metaIcon} />
                  <span>{empDepartment}</span>
                </div>

                <div className={styles.metaItem}>
                  <MapPin size={13} className={styles.metaIcon} />
                  <span>{empLocation}</span>
                </div>
              </div>
            </div>

            {/* Circular Progress Gauge */}
            <div className={styles.gaugeBox}>
              <svg width="68" height="68" viewBox="0 0 68 68">
                <circle
                  cx="34"
                  cy="34"
                  r="28"
                  fill="none"
                  stroke="#e2e8f0"
                  strokeWidth="5"
                />
                <circle
                  cx="34"
                  cy="34"
                  r="28"
                  fill="none"
                  stroke="#059669"
                  strokeWidth="5"
                  strokeDasharray="175.9"
                  strokeDashoffset={175.9 - (175.9 * completeness) / 100}
                  strokeLinecap="round"
                  transform="rotate(-90 34 34)"
                  style={{ transition: 'stroke-dashoffset 0.6s ease' }}
                />
                <text
                  x="34"
                  y="38"
                  textAnchor="middle"
                  fontSize="13"
                  fontWeight="700"
                  fill="#0f172a"
                >
                  {completeness}%
                </text>
              </svg>
              <span
                className={styles.gaugeText}
                onClick={() => setShowCompletionModal(true)}
              >
                <HelpCircle size={11} />
                <span>What is this?</span>
              </span>
            </div>
          </div>

          {/* Divider: Contact Info */}
          <div className={styles.sectionDivider}>
            <span className={styles.dividerPill}>Contact Info</span>
          </div>

          {/* Contact Row */}
          <div className={styles.contactRow}>
            <div className={styles.contactItem}>
              <span className={styles.contactIcon}>@</span>
              <span style={{ wordBreak: 'break-all' }}>{empEmail}</span>
              {empEmail !== 'Not Added' && (
                <button
                  type="button"
                  className={styles.copyIconBtn}
                  onClick={() => handleCopy(empEmail, 'email')}
                  title="Copy Email"
                >
                  {copiedField === 'email' ? (
                    <Check size={13} style={{ color: '#16a34a' }} />
                  ) : (
                    <Copy size={13} />
                  )}
                </button>
              )}
            </div>

            <div className={styles.contactItem}>
              <Phone size={13} className={styles.contactIcon} />
              <span>{empMobile}</span>
              {empMobile !== 'Not Added' && (
                <button
                  type="button"
                  className={styles.copyIconBtn}
                  onClick={() => handleCopy(empMobile, 'mobile')}
                  title="Copy Phone"
                >
                  {copiedField === 'mobile' ? (
                    <Check size={13} style={{ color: '#16a34a' }} />
                  ) : (
                    <Copy size={13} />
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Divider: Managers */}
          <div className={styles.sectionDivider}>
            <span className={styles.dividerPill}>Managers</span>
          </div>

          {/* Managers Box */}
          <div className={styles.managerSection}>
            <div className={styles.managerItem}>
              <span className={styles.managerLabel}>REPORTING MANAGER</span>
              <div className={styles.managerValueBox}>
                <span className={styles.questionBadge}>?</span>
                <span>{data.reportingSupervisor || 'Not Defined'}</span>
              </div>
            </div>

            <div className={styles.managerItem}>
              <span className={styles.managerLabel}>HR MANAGER</span>
              <div className={styles.managerValueBox}>
                <span className={styles.questionBadge}>?</span>
                <span>{data.hrManager || 'Not Defined'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Reports, HR Record, Contact Details */}
        <div className={styles.rightColumn}>
          {/* Direct Reports */}
          <div>
            <div className={styles.sectionDivider} style={{ justifyContent: 'flex-start' }}>
              <span className={styles.dividerPill} style={{ paddingLeft: 0 }}>Direct Reports</span>
            </div>
            <p className={styles.directReportsText}>No direct reports found</p>
          </div>

          {/* HR Record */}
          <div>
            <div className={styles.sectionDivider} style={{ justifyContent: 'flex-start' }}>
              <span className={styles.dividerPill} style={{ paddingLeft: 0 }}>HR Record</span>
            </div>

            <div className={styles.infoGrid}>
              <div className={styles.infoField}>
                <span className={styles.infoFieldLabel}>DATE OF JOINING</span>
                <span className={styles.infoFieldValue}>
                  <Calendar size={14} className={styles.calendarIcon} />
                  <span>{formatDisplayDate(data.joiningDate)}</span>
                </span>
              </div>

              <div className={styles.infoField}>
                <span className={styles.infoFieldLabel}>DATE OF CONF.</span>
                <span className={styles.infoFieldValue}>
                  <CheckCircle2 size={14} className={styles.confIcon} />
                  <span>{confirmationDate}</span>
                  <Clock size={12} style={{ color: '#94a3b8' }} />
                </span>
              </div>

              <div className={styles.infoField}>
                <span className={styles.infoFieldLabel}>DATE OF BIRTH</span>
                <span className={styles.infoFieldValue}>
                  {formatDisplayDate(data.dob)}
                </span>
              </div>

              <div className={styles.infoField}>
                <span className={styles.infoFieldLabel}>NOTICE PERIOD</span>
                <span className={styles.infoFieldValue}>
                  {data.noticePeriod || '30 day(s)'}
                </span>
              </div>
            </div>

            {/* Status indicator */}
            {isExited ? (
              <div className={styles.statusPill}>
                <AlertCircle size={12} />
                <span>Exited: {formatDisplayDate(data.exitDate)}</span>
              </div>
            ) : (
              <div className={`${styles.statusPill} ${styles.statusPillActive}`}>
                <UserCheck size={12} />
                <span>Active Roster: {data.employeeType || 'Permanent Staff'}</span>
              </div>
            )}
          </div>

          {/* Contact Details */}
          <div>
            <div className={styles.sectionDivider} style={{ justifyContent: 'flex-start' }}>
              <span className={styles.dividerPill} style={{ paddingLeft: 0 }}>Contact Details</span>
            </div>

            <div className={styles.infoGrid}>
              <div className={styles.infoField}>
                <span className={styles.infoFieldLabel}>OFFICE PHONE</span>
                <span className={styles.infoFieldValue}>
                  {data.officePhone || 'Not Added'}
                </span>
              </div>

              <div className={styles.infoField}>
                <span className={styles.infoFieldLabel}>EMERGENCY CONTACT</span>
                <span className={styles.infoFieldValue}>
                  {data.emergencyMobile || data.alternateMobile || 'Not Added'}
                </span>
              </div>

              <div className={styles.infoField}>
                <span className={styles.infoFieldLabel}>HOME PHONE</span>
                <span className={styles.infoFieldValue}>
                  {data.alternateMobile || 'Not Added'}
                </span>
              </div>

              <div className={styles.infoField}>
                <span className={styles.infoFieldLabel}>PERSONAL E-MAIL</span>
                <span className={styles.infoFieldValue} style={{ wordBreak: 'break-all' }}>
                  {data.email || 'Not Added'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Completion Help Modal */}
      {showCompletionModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.45)',
            backdropFilter: 'blur(2px)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16
          }}
          onClick={() => setShowCompletionModal(false)}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: 12,
              width: '100%',
              maxWidth: 480,
              padding: 24,
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#0f172a' }}>
                Profile Completion Score: {completeness}%
              </h3>
              <button
                type="button"
                onClick={() => setShowCompletionModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
              >
                <X size={18} />
              </button>
            </div>
            <p style={{ fontSize: 13, color: '#475569', lineHeight: 1.6, margin: 0 }}>
              The completeness score indicates how comprehensively this employee profile has been documented across personal information, identification documents, banking, and deployment site allocation.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default EmployeeSummaryStep;
