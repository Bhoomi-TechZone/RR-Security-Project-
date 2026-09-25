import React from 'react';
import { User, Briefcase, DollarSign, Landmark, Home, FileText, Edit2 } from 'lucide-react';
import styles from './EmployeeFormSteps.module.css';

const INR = (val) => `₹${Number(val || 0).toLocaleString('en-IN')}`;

/**
 * EmployeeReview — Step 07 of the Add/Edit Employee form.
 * Comprehensive summary of all entered employee data before final submission.
 */
function EmployeeReview({ data, onEditStep }) {
  const licenseList = Array.isArray(data.licenseList) && data.licenseList.length > 0
    ? data.licenseList.filter(l => l.licenseNo || l.photo)
    : (data.drivingLicenseNo
        ? [{
            licenseType: data.licenseType || data.drivingLicenseType || 'Driving License',
            licenseNo: data.drivingLicenseNo,
            expiryDate: data.dlExpiryDate,
            photo: data.drivingLicenseCopy
          }]
        : []);

  const familyMembers = Array.isArray(data.familyMembers) && data.familyMembers.length > 0
    ? data.familyMembers
    : [];

  const documentList = Array.isArray(data.documentList) && data.documentList.length > 0
    ? data.documentList
    : [];

  return (
    <div className={styles.stepContainer}>
      <div className={styles.reviewSections}>
        {/* Step 1: Personal / Basic Information */}
        <div className={styles.reviewSection}>
          <div className={styles.reviewSectionHeader}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <User size={16} />
              <span>01. Basic Details</span>
            </div>
            {onEditStep && (
              <button
                type="button"
                className={styles.addMemberBtn}
                style={{ padding: '3px 8px', fontSize: '12px' }}
                onClick={() => onEditStep(0)}
              >
                <Edit2 size={12} /> Edit
              </button>
            )}
          </div>
          <div className={styles.reviewBody}>
            <ReviewRow label="Employee Name" value={data.name || '—'} />
            <ReviewRow label="Father/Husband Name" value={`${data.fatherHusbandName || '—'}${data.fatherHusbandRelation ? ` (${data.fatherHusbandRelation})` : ''}`} />
            <ReviewRow label="Gender" value={data.gender || '—'} />
            <ReviewRow label="Date of Birth" value={data.dob || '—'} />
            <ReviewRow label="Blood Group" value={data.bloodGroup || '—'} />
            <ReviewRow label="Marital Status" value={data.maritalStatus || '—'} />
            {data.maritalStatus === 'Married' && (
              <ReviewRow label="Spouse Name" value={data.spouseName || '—'} />
            )}
            <ReviewRow label="Aadhaar No." value={data.aadhaar || '—'} />
            <ReviewRow label="PAN No." value={data.pan || '—'} />
            <ReviewRow label="Religion" value={data.religion || '—'} />
            <ReviewRow label="Nationality" value={data.nationality || '—'} />
            <ReviewRow label="Mobile" value={data.mobile || data.contact || '—'} />
            <ReviewRow label="Emergency Mobile No." value={data.emergencyMobile || data.alternateMobile || '—'} />
            <ReviewRow label="Email" value={data.email || '—'} />
            <ReviewRow label="Photo" value={data.employeePhoto || '—'} />
          </div>
        </div>

        {/* Step 2: Employment Details */}
        <div className={styles.reviewSection}>
          <div className={styles.reviewSectionHeader}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Briefcase size={16} />
              <span>02. Employment Details</span>
            </div>
            {onEditStep && (
              <button
                type="button"
                className={styles.addMemberBtn}
                style={{ padding: '3px 8px', fontSize: '12px' }}
                onClick={() => onEditStep(1)}
              >
                <Edit2 size={12} /> Edit
              </button>
            )}
          </div>
          <div className={styles.reviewBody}>
            <ReviewRow label="Client / Company" value={data.companyName || data.companyId || '—'} />
            <ReviewRow label="Employee Type" value={data.employeeType || '—'} />
            <ReviewRow label="Designation" value={data.designation || '—'} />
            <ReviewRow label="Department" value={data.department || '—'} />
            <ReviewRow label="Site / Location" value={data.siteLocation || '—'} />
            <ReviewRow label="Duty Post" value={data.dutyPost || '—'} />
            <ReviewRow label="Shift" value={data.shift || '—'} />
            <ReviewRow label="Reporting Supervisor" value={data.reportingSupervisor || '—'} />
            <ReviewRow label="Joining Location" value={data.joiningLocation || '—'} />
            <ReviewRow label="Previous Experience" value={data.previousExperience || '—'} />
            <ReviewRow label="Language (Read + Write)" value={data.language || '—'} />
            <ReviewRow label="Qualification" value={data.qualification || '—'} />
            <ReviewRow label="Technical Qualification" value={data.technicalQualification || '—'} />
            <ReviewRow label="Employee Status" value={data.employeeStatus || '—'} />
            {data.exitDate && <ReviewRow label="Exit Date" value={data.exitDate} />}
            {data.exitReason && <ReviewRow label="Exit Reason" value={data.exitReason} />}
            {!data.exitDate && !data.exitReason && data.exitDateReason && (
              <ReviewRow label="Exit Date / Reason" value={data.exitDateReason} />
            )}
          </div>
        </div>

        {/* Step 3: Salary Details */}
        <div className={styles.reviewSection}>
          <div className={styles.reviewSectionHeader}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <DollarSign size={16} />
              <span>03. Salary Details</span>
            </div>
            {onEditStep && (
              <button
                type="button"
                className={styles.addMemberBtn}
                style={{ padding: '3px 8px', fontSize: '12px' }}
                onClick={() => onEditStep(2)}
              >
                <Edit2 size={12} /> Edit
              </button>
            )}
          </div>
          <div className={styles.reviewBody}>
            <ReviewRow label="Salary Type" value={data.salaryType || '—'} />
            <ReviewRow label="Salary Structure" value={data.salaryStructureType || '—'} />
            <ReviewRow label="Basic Salary" value={INR(data.basic)} />
            <ReviewRow label="HRA" value={INR(data.hra)} />
            <ReviewRow label="Conveyance" value={INR(data.conveyance)} />
            <ReviewRow label="Other Allowance" value={INR(data.otherAllowance)} />
            <ReviewRow label="Special Allowance" value={INR(data.specialAllowance)} />
            <ReviewRow label="Gross Salary" value={INR(data.grossSalary)} />
            <ReviewRow label="Minimum Wage Category" value={data.minimumWageCategory || '—'} />
            <ReviewRow label="Effective From" value={data.salaryEffectiveFrom || '—'} />
            <ReviewRow label="PF Applicable" value={data.pfApplicable === true || data.pfApplicable === 'Yes' ? `Yes (UAN: ${data.uan || '—'}, PF No: ${data.pfNo || '—'})` : 'No'} />
            <ReviewRow label="ESI Applicable" value={data.esiApplicable === true || data.esiApplicable === 'Yes' ? `Yes (ESIC: ${data.esicNo || '—'}, Dispensary: ${data.dispensaryNo || '—'})` : 'No'} />
            <ReviewRow label="TDS Applicable" value={data.tdsApplicable === true || data.tdsApplicable === 'Yes' ? `Yes (PAN: ${data.pan || '—'})` : 'No'} />
            <ReviewRow label="LWF Applicable" value={data.lwfApplicable === true || data.lwfApplicable === 'Yes' || data.lwf === true || data.lwf === 'Yes' ? `Yes${data.lwfNo ? ` (LWF No: ${data.lwfNo})` : typeof data.lwf === 'string' && data.lwf !== 'Yes' && data.lwf !== 'No' && data.lwf ? ` (${data.lwf})` : ''}` : 'No'} />
          </div>
        </div>

        {/* Step 4: Bank Details */}
        <div className={styles.reviewSection}>
          <div className={styles.reviewSectionHeader}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Landmark size={16} />
              <span>04. Bank Details</span>
            </div>
            {onEditStep && (
              <button
                type="button"
                className={styles.addMemberBtn}
                style={{ padding: '3px 8px', fontSize: '12px' }}
                onClick={() => onEditStep(3)}
              >
                <Edit2 size={12} /> Edit
              </button>
            )}
          </div>
          <div className={styles.reviewBody}>
            <ReviewRow label="Bank Name" value={data.bankName || '—'} />
            <ReviewRow label="Branch Name" value={data.branchName || '—'} />
            <ReviewRow label="Account Holder" value={data.accountHolder || '—'} />
            <ReviewRow label="Account Number" value={data.accountNumber || '—'} />
            <ReviewRow label="IFSC Code" value={data.ifsc || '—'} />
            <ReviewRow label="Payment Mode" value={data.paymentMode || '—'} />
          </div>
        </div>

        {/* Step 5: Address & Family */}
        <div className={styles.reviewSection}>
          <div className={styles.reviewSectionHeader}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Home size={16} />
              <span>05. Address & Family</span>
            </div>
            {onEditStep && (
              <button
                type="button"
                className={styles.addMemberBtn}
                style={{ padding: '3px 8px', fontSize: '12px' }}
                onClick={() => onEditStep(4)}
              >
                <Edit2 size={12} /> Edit
              </button>
            )}
          </div>
          <div className={styles.reviewBody}>
            <ReviewRow label="Present Address" value={data.presentAddress || '—'} />
            <ReviewRow label="Permanent Address" value={data.permanentAddress || '—'} />
            <div style={{ marginTop: '8px' }}>
              <strong style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Family Members ({familyMembers.length}):</strong>
              {familyMembers.map((m, mIdx) => (
                <div key={mIdx} style={{ margin: '6px 0', padding: '6px 10px', background: 'var(--surface)', borderRadius: '4px', border: '1px solid var(--border)', fontSize: '13px' }}>
                  <strong>#{mIdx + 1} {m.name || 'Unnamed'}</strong> ({m.relation || 'Relation N/A'}) • DOB: {m.dob || m.dobAge || '—'} • Aadhaar: {m.aadhaarNumber || '—'} • Nominee: {m.nomineeYesNo || 'No'} {m.nomineeSharePercent ? `(${m.nomineeSharePercent}%)` : ''}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Step 6: Licenses, Documents & Remarks */}
        <div className={styles.reviewSection}>
          <div className={styles.reviewSectionHeader}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileText size={16} />
              <span>06. Licenses, Documents & Remarks</span>
            </div>
            {onEditStep && (
              <button
                type="button"
                className={styles.addMemberBtn}
                style={{ padding: '3px 8px', fontSize: '12px' }}
                onClick={() => onEditStep(5)}
              >
                <Edit2 size={12} /> Edit
              </button>
            )}
          </div>
          <div className={styles.reviewBody}>
            {licenseList.length > 0 && (
              <div style={{ marginBottom: '8px' }}>
                <strong style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Licenses ({licenseList.length}):</strong>
                {licenseList.map((lic, lIdx) => (
                  <div key={lIdx} style={{ margin: '6px 0', padding: '6px 10px', background: 'var(--surface)', borderRadius: '4px', border: '1px solid var(--border)', fontSize: '13px' }}>
                    <strong>#{lIdx + 1} {lic.licenseType || 'License'}</strong>: {lic.licenseNo || '—'} {lic.expiryDate ? `(Exp: ${lic.expiryDate})` : ''} {lic.photo ? `• File: ${lic.photo}` : ''}
                  </div>
                ))}
              </div>
            )}
            <div style={{ marginTop: '8px', marginBottom: '8px' }}>
              <strong style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Uploaded Documents ({documentList.length}):</strong>
              {documentList.map((doc, dIdx) => (
                <div key={dIdx} style={{ margin: '6px 0', padding: '6px 10px', background: 'var(--surface)', borderRadius: '4px', border: '1px solid var(--border)', fontSize: '13px' }}>
                  <strong>#{dIdx + 1} {doc.name || 'Document'}</strong>: {doc.photo || 'No file chosen'}
                </div>
              ))}
            </div>
            <ReviewRow label="Remarks" value={data.remarks || '—'} />
          </div>
        </div>
      </div>
    </div>
  );
}

function ReviewRow({ label, value }) {
  return (
    <div className={styles.reviewRow}>
      <span className={styles.reviewLabel}>{label}</span>
      <span className={styles.reviewValue}>{value}</span>
    </div>
  );
}

export default EmployeeReview;
