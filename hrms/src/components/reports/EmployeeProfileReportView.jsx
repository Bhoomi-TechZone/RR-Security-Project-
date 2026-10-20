import React, { useMemo } from 'react';
import {
  Download,
  Printer,
  Shield,
  User,
  FileText
} from 'lucide-react';
import styles from './EmployeeProfileReportView.module.css';

/**
 * Format date string to clean DD/MM/YYYY
 */
function formatDate(dateStr) {
  if (!dateStr || dateStr === '-') return '—';
  const str = String(dateStr).trim();
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(str)) return str;
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
    const [y, m, d] = str.split('T')[0].split('-');
    return `${d}/${m}/${y}`;
  }
  const d = new Date(str);
  if (isNaN(d.getTime())) return str;
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Calculate age from DOB
 */
function calculateAge(dobStr) {
  if (!dobStr || dobStr === '-') return '—';
  const str = String(dobStr).trim();
  if (/^\d{1,2}$/.test(str)) return str;

  let birthDate;
  if (/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/.test(str)) {
    const [, d, m, y] = str.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
    birthDate = new Date(`${y}-${m}-${d}`);
  } else {
    birthDate = new Date(str);
  }

  if (isNaN(birthDate.getTime())) return '—';
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age > 0 ? String(age) : '—';
}

/**
 * Single Employee Profile Document Sheet Item (Matching Screenshot 3)
 */
function EmployeeProfileSheetItem({ employee, companyName, companyLogo }) {
  const photoSrc = employee.employeePhoto || employee.photo || employee.avatar || employee.profilePhoto || null;

  // Family Members Table Body
  const familyList = useMemo(() => {
    if (Array.isArray(employee.familyMembers) && employee.familyMembers.length > 0) {
      const valid = employee.familyMembers.filter(m => m && (m.name || m.familyMemberName || m.relation));
      if (valid.length > 0) {
        return valid.map((m, i) => ({
          srNo: i + 1,
          name: m.name || m.familyMemberName || '—',
          relation: m.relation || '—',
          dob: formatDate(m.dob || m.dobAge),
          age: m.age || calculateAge(m.dob || m.dobAge),
          nominee: m.nomineeYesNo || m.nominee || 'Yes',
          share: m.nomineeSharePercent ? `${m.nomineeSharePercent}%` : (m.sharePercent ? `${m.sharePercent}%` : '—')
        }));
      }
    }

    if (employee.familyMemberName) {
      return [{
        srNo: 1,
        name: employee.familyMemberName,
        relation: employee.relation || 'Relative',
        dob: formatDate(employee.dobAge || ''),
        age: calculateAge(employee.dobAge || ''),
        nominee: employee.nomineeYesNo || 'Yes',
        share: employee.nomineeSharePercent ? `${employee.nomineeSharePercent}%` : '100%'
      }];
    }

    if (employee.fatherHusbandName && employee.fatherHusbandName !== '-') {
      return [{
        srNo: 1,
        name: employee.fatherHusbandName,
        relation: employee.fatherHusbandRelation || 'Father/Husband',
        dob: '—',
        age: '—',
        nominee: employee.nomineeYesNo || '—',
        share: employee.nomineeSharePercent ? `${employee.nomineeSharePercent}%` : '—'
      }];
    }

    return [{
      srNo: 1,
      name: 'No family records registered',
      relation: '—',
      dob: '—',
      age: '—',
      nominee: '—',
      share: '—'
    }];
  }, [employee]);

  return (
    <div className={styles.paperWrap}>
      <div className={styles.paperSheet}>
        {/* Header */}
        <div className={styles.docHeader}>
          <div className={styles.companyBranding}>
            <div className={styles.logoBadge}>
              {companyLogo ? (
                <img src={companyLogo} alt={companyName} className={styles.logoImg} />
              ) : (
                <Shield size={24} />
              )}
            </div>
            <div className={styles.companyText}>
              <h2 className={styles.companyTitle}>{companyName}</h2>
              <span className={styles.companySubtitle}>EMPLOYEE INFORMATION</span>
            </div>
          </div>

          <div className={styles.officialBadge}>
            Official Profile
          </div>
        </div>

        <div className={styles.headerDivider} />

        {/* Hero Employee Identity Card */}
        <div className={styles.heroCard}>
          <div className={styles.heroLeft}>
            <div className={styles.photoBox}>
              {photoSrc ? (
                <img src={photoSrc} alt={employee.name} className={styles.photoImg} />
              ) : (
                <div className={styles.avatarFallback}>
                  <User size={30} />
                </div>
              )}
            </div>
            <div className={styles.heroDetails}>
              <h3 className={styles.empName}>{employee.name || '—'}</h3>
              <span className={styles.empDesignation}>{employee.designation || 'Staff'}</span>
              <span className={styles.empGender}>{employee.gender || 'Male'}</span>
            </div>
          </div>

          <div className={styles.heroRight}>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Employee Code</span>
              <span className={styles.metaValue}>{employee.employeeCode || employee.employeeId || '—'}</span>
            </div>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Joining Date</span>
              <span className={styles.metaValue}>{formatDate(employee.joiningDate)}</span>
            </div>
          </div>
        </div>

        {/* Section 1: Personal Information */}
        <div className={styles.sectionBlock}>
          <h4 className={styles.sectionHeader}>Personal Information</h4>
          <table className={styles.infoGridTable}>
            <tbody>
              <tr>
                <td className={styles.colLabel}>EMPLOYEE NAME</td>
                <td className={styles.colValue}>{employee.name || '—'}</td>
                <td className={styles.colLabel}>FATHER / HUSBAND NAME</td>
                <td className={styles.colValue}>{employee.fatherHusbandName || employee.fatherName || employee.spouseName || '—'}</td>
              </tr>
              <tr>
                <td className={styles.colLabel}>GENDER</td>
                <td className={styles.colValue}>{employee.gender || 'Male'}</td>
                <td className={styles.colLabel}>MARITAL STATUS</td>
                <td className={styles.colValue}>{employee.maritalStatus || 'Married'}</td>
              </tr>
              <tr>
                <td className={styles.colLabel}>MOBILE NUMBER</td>
                <td className={styles.colValue}>{employee.contact || employee.mobile || '—'}</td>
                <td className={styles.colLabel}>EMERGENCY CONTACT</td>
                <td className={styles.colValue}>{employee.alternateMobile || employee.emergencyMobile || employee.emergencyContact || '—'}</td>
              </tr>
              <tr>
                <td className={styles.colLabel}>AADHAAR NUMBER</td>
                <td className={styles.colValue}>{employee.aadhaar || employee.aadhaarNumber || '—'}</td>
                <td className={styles.colLabel}>EDUCATION</td>
                <td className={styles.colValue}>{employee.qualification || employee.education || employee.technicalQualification || '—'}</td>
              </tr>
              <tr>
                <td className={styles.colLabel}>LANGUAGE</td>
                <td className={styles.colValue}>{employee.language || employee.languages || 'Hindi and English'}</td>
                <td className={styles.colLabel}>EMAIL</td>
                <td className={styles.colValue}>{employee.email || '—'}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Section 2: Employment & Payroll */}
        <div className={styles.sectionBlock}>
          <h4 className={styles.sectionHeader}>Employment & Payroll</h4>
          <table className={styles.infoGridTable}>
            <tbody>
              <tr>
                <td className={styles.colLabel}>CLIENT NAME</td>
                <td className={styles.colValue}>{employee.clientName || employee.companyName || companyName}</td>
                <td className={styles.colLabel}>LOCATION</td>
                <td className={styles.colValue}>{employee.siteLocation || employee.site || employee.joiningLocation || 'Office'}</td>
              </tr>
              <tr>
                <td className={styles.colLabel}>BANK NAME</td>
                <td className={styles.colValue}>{employee.bankName || '—'}</td>
                <td className={styles.colLabel}>BANK A/C NO.</td>
                <td className={styles.colValue} style={{ fontFamily: 'monospace', fontWeight: 600 }}>
                  {employee.accountNumber || employee.accountNo || employee.bankAccount || '—'}
                </td>
              </tr>
              <tr>
                <td className={styles.colLabel}>IFSC</td>
                <td className={styles.colValue} style={{ fontFamily: 'monospace' }}>
                  {employee.ifsc || employee.ifscCode || '—'}
                </td>
                <td className={styles.colLabel}>PAN NO.</td>
                <td className={styles.colValue} style={{ fontFamily: 'monospace', fontWeight: 600 }}>
                  {employee.pan || employee.panNumber || '—'}
                </td>
              </tr>
              <tr>
                <td className={styles.colLabel}>UAN</td>
                <td className={styles.colValue} style={{ fontFamily: 'monospace' }}>
                  {employee.uan || employee.uanNo || '—'}
                </td>
                <td className={styles.colLabel}>ESIC</td>
                <td className={styles.colValue} style={{ fontFamily: 'monospace' }}>
                  {employee.esicNo || employee.esic || employee.esiNo || '—'}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Section 3: Address Details */}
        <div className={styles.sectionBlock}>
          <h4 className={styles.sectionHeader}>Address Details</h4>
          <div className={styles.addressBoxGrid}>
            <div className={styles.addressCard}>
              <div className={styles.addressLabel}>Present Address</div>
              <p className={styles.addressText}>{employee.presentAddress || employee.currentAddress || employee.address || '—'}</p>
            </div>
            <div className={styles.addressCard}>
              <div className={styles.addressLabel}>Permanent Address</div>
              <p className={styles.addressText}>{employee.permanentAddress || employee.presentAddress || employee.address || '—'}</p>
            </div>
          </div>
        </div>

        {/* Section 4: Family Details */}
        <div className={styles.sectionBlock}>
          <h4 className={styles.sectionHeader}>Family Details</h4>
          <table className={styles.familyTable}>
            <thead>
              <tr>
                <th style={{ width: '36px', textAlign: 'center' }}>#</th>
                <th>Family Member</th>
                <th>Relation</th>
                <th>DOB</th>
                <th>Age</th>
                <th>Nominee</th>
                <th>Share %</th>
              </tr>
            </thead>
            <tbody>
              {familyList.map((m, idx) => (
                <tr key={idx}>
                  <td className={styles.textCenter} style={{ fontWeight: 600 }}>{m.srNo}</td>
                  <td style={{ fontWeight: 600 }}>{m.name}</td>
                  <td>{m.relation}</td>
                  <td>{m.dob}</td>
                  <td>{m.age}</td>
                  <td>{m.nominee}</td>
                  <td style={{ fontWeight: 700 }}>{m.share}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Section 5: Declaration */}
        <div className={styles.sectionBlock}>
          <h4 className={styles.sectionHeader}>Declaration</h4>
          <div className={styles.declarationCard}>
            <p className={styles.declarationText}>
              I, <strong>{(employee.name || employee.employeeName || '—').toUpperCase()}</strong>, hereby declare that the information contained in this employee record is true and correct to the best of my knowledge. I agree to inform the management of any change in the information provided and to comply with the policies and conditions of service of {companyName}.
            </p>
          </div>
        </div>

        {/* Signatures Area */}
        <div className={styles.signaturesGrid}>
          <div className={styles.signatureItem}>
            <div className={styles.signatureLine} />
            <span className={styles.sigTitle}>EMPLOYEE SIGNATURE</span>
            <span className={styles.sigSub}>( Signature of Employee )</span>
          </div>
          <div className={styles.signatureItem}>
            <div className={styles.signatureLine} />
            <span className={styles.sigTitle}>HR / AUTHORIZED SIGNATORY</span>
            <span className={styles.sigSub}>( Seal & Signatory )</span>
          </div>
          <div className={styles.signatureItem}>
            <div className={styles.signatureLine} />
            <span className={styles.sigTitle}>DATE</span>
            <span className={styles.sigSub}>( Date of Issuance )</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Main Employee Profile Report View Component
 * Uses strictly the top Report Filters (Company/Client, Department, Employee)
 */
export default function EmployeeProfileReportView({
  records = [],
  companyInfo = {},
  filters = {},
  onExportEmployeePdf,
  onPrintEmployeePdf,
}) {
  const selectedEmpFilter = filters?.employee;
  const isAllEmployees = !selectedEmpFilter || selectedEmpFilter === 'All Employees';

  // Resolve target employee based strictly on top filters
  const targetEmployee = useMemo(() => {
    if (!records.length) return null;
    if (!isAllEmployees && selectedEmpFilter) {
      const targetTerm = selectedEmpFilter.includes('—')
        ? selectedEmpFilter.split('—')[1].trim().toLowerCase()
        : selectedEmpFilter.trim().toLowerCase();

      return records.find((r) => {
        const idMatch = String(r.employeeId || r.employeeCode || '').toLowerCase() === targetTerm;
        const nameMatch = String(r.name || '').toLowerCase().includes(targetTerm);
        return idMatch || nameMatch;
      }) || records[0];
    }
    return records[0];
  }, [records, selectedEmpFilter, isAllEmployees]);

  // If a specific employee is chosen, display that profile; otherwise render filtered employee profiles
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
        <h4 className={styles.emptyTitle}>No Employee Profile Found</h4>
        <p className={styles.emptyText}>
          No employee records match your selected filters (Company: {filters?.company || 'All Companies'}, Department: {filters?.department || 'All Departments'}).
        </p>
      </div>
    );
  }

  const companyName = (companyInfo?.name || employeesToRender[0]?.companyName || employeesToRender[0]?.clientName || 'RR SECURITY & FACILITIES').toUpperCase();
  const companyLogo = companyInfo?.logo || companyInfo?.logoUrl || localStorage.getItem('novaspark_company_logo_preview');

  return (
    <div className={styles.container}>
      {/* Render Document Sheets strictly per selected filter */}
      {employeesToRender.map((emp, idx) => (
        <EmployeeProfileSheetItem
          key={emp.employeeId || emp.id || idx}
          employee={emp}
          companyName={companyName}
          companyLogo={companyLogo}
        />
      ))}
    </div>
  );
}
