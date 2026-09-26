import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  User, Briefcase, FileText, CreditCard, IndianRupee,
  Edit2, ArrowLeftRight, Download, Power, CheckCircle, Clock,
  Phone, MapPin, Building2, Layers, Hash, Landmark, Upload, X
} from 'lucide-react';
import styles from './EmployeeDetails.module.css';

import AdminLayout from '../../components/layout/AdminLayout';
import StatusBadge from '../../components/common/StatusBadge';
import ConfirmModal from '../../components/common/ConfirmModal';
import TransferEmployeeModal from '../../components/employees/TransferEmployeeModal';
import EmployeeForm from '../../components/employees/EmployeeForm';
import Toast from '../../components/common/Toast';

import { useCompany } from '../../context/CompanyContext';
import { authService } from '../../services/authService';
import { downloadEmployeeProfile } from '../../utils/employeeProfileExport';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://backendhrmspayroll.bhoomitechzone.shop/api';
const INR = (val) => `₹${Number(val || 0).toLocaleString('en-IN')}`;

const DOCUMENT_TYPES = [
  { key: 'aadhaarCard', label: 'Aadhaar Card' },
  { key: 'panCard', label: 'PAN Card' },
  { key: 'bankProof', label: 'Bank Proof' },
  { key: 'addressProof', label: 'Address Proof' },
  { key: 'policeVerification', label: 'Police Verification', guardOnly: true },
  { key: 'educationCertificate', label: 'Education Certificate' },
  { key: 'experienceCertificate', label: 'Experience Certificate' },
  { key: 'appointmentLetter', label: 'Appointment Letter' },
  { key: 'photo', label: 'Photo' },
  { key: 'otherDocuments', label: 'Other Documents' },
  { key: 'employeeSignature', label: 'Employee Signature' },
  { key: 'hrAdminVerification', label: 'HR/Admin Verification' }
];

const TABS = [
  { id: 'overview', label: 'Basic Details', icon: User },
  { id: 'employment', label: 'Employment', icon: Briefcase },
  { id: 'statutory', label: 'Statutory & Bank', icon: CreditCard },
  { id: 'address', label: 'Address & Family', icon: MapPin },
  { id: 'salary', label: 'Salary Structure', icon: IndianRupee },
  { id: 'documents', label: 'Documents', icon: FileText }
];

function EmployeeDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { activeCompany } = useCompany();

  const [employee, setEmployee] = useState(null);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false, title: '', description: '', confirmLabel: '', variant: 'danger', actionType: null
  });
  const [toast, setToast] = useState({ message: '', type: 'success' });

  const showToast = (msg, type = 'success') => setToast({ message: msg, type });

  const currentCompanyId = activeCompany?.companyId || activeCompany?.id || '';

  const fetchEmployeeData = async () => {
    setLoading(true);
    try {
      const token = authService.getToken();
      const res = await fetch(`${API_BASE_URL}/employees/${id}`, {
        headers: {
          'Authorization': `Bearer ${token || ''}`,
          'x-company-id': currentCompanyId
        }
      });
      const data = await res.json();
      if (res.ok && data.success && data.employee) {
        setEmployee(data.employee);
      }
    } catch (err) {
      console.error('Error fetching employee details:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchClients = async () => {
    try {
      const token = authService.getToken();
      const res = await fetch(`${API_BASE_URL}/clients`, {
        headers: {
          'Authorization': `Bearer ${token || ''}`,
          'x-company-id': currentCompanyId
        }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setClients(data.clients || []);
      }
    } catch (err) {
      console.error('Error fetching clients:', err);
    }
  };

  useEffect(() => {
    if (id) {
      fetchEmployeeData();
      fetchClients();
    }
  }, [id, currentCompanyId]);

  const updateEmployee = async (updateData) => {
    try {
      const token = authService.getToken();
      const res = await fetch(`${API_BASE_URL}/employees/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token || ''}`,
          'x-company-id': currentCompanyId
        },
        body: JSON.stringify(updateData)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setEmployee(data.employee);
        return data.employee;
      } else {
        throw new Error(data.message || 'Failed to update employee');
      }
    } catch (err) {
      console.error('Error updating employee:', err);
      showToast(err.message || 'Failed to update employee.', 'error');
      throw err;
    }
  };

  const handleEditSubmit = async (formData) => {
    try {
      await updateEmployee(formData);
      showToast('✓ Employee updated successfully.', 'success');
      setIsEditOpen(false);
    } catch (err) {
      // handled in updateEmployee
    }
  };

  const handleTransfer = async (empId, transferData) => {
    try {
      await updateEmployee({
        clientId: transferData.clientId || transferData.companyId,
        clientName: transferData.clientName || transferData.companyName,
        companyName: transferData.clientName || transferData.companyName,
        siteLocation: transferData.siteLocation || transferData.site
      });
      showToast('✓ Employee transferred successfully.', 'success');
      setIsTransferOpen(false);
    } catch (err) {
      showToast('Failed to transfer employee.', 'error');
    }
  };

  const handleToggleStatus = () => {
    const isAct = String(employee.status || '').toLowerCase() === 'active';
    setConfirmModal({
      isOpen: true,
      title: isAct ? 'Deactivate Employee?' : 'Activate Employee?',
      description: isAct
        ? `Are you sure you want to deactivate ${employee.name}?`
        : `Are you sure you want to activate ${employee.name}?`,
      confirmLabel: isAct ? 'Deactivate' : 'Activate',
      variant: isAct ? 'danger' : 'primary',
      actionType: isAct ? 'deactivate' : 'activate'
    });
  };

  const handleConfirmAction = async () => {
    const newStatus = confirmModal.actionType === 'deactivate' ? 'Inactive' : 'Active';
    try {
      await updateEmployee({ status: newStatus });
      setConfirmModal(prev => ({ ...prev, isOpen: false }));
      showToast(
        newStatus === 'Inactive'
          ? '✓ Employee deactivated successfully.'
          : '✓ Employee activated successfully.',
        'success'
      );
    } catch (err) {
      // handled
    }
  };

  const handleDocumentSimulateUpload = (key, file) => {
    if (!file) return;
    const updatedDocs = {
      ...(employee.documents || {}),
      [key]: {
        status: 'uploaded',
        date: new Date().toISOString().split('T')[0],
        fileName: file.name,
        fileSize: (file.size / 1024).toFixed(1) + ' KB'
      }
    };
    updateEmployee({ documents: updatedDocs, remarks: employee.remarks || '' });
  };

  if (!employee) {
    return (
      <AdminLayout>
        <div className={styles.loadingWrapper}>
          <div className={styles.spinner} />
          <span>Loading employee profile...</span>
        </div>
      </AdminLayout>
    );
  }

  const isActive = String(employee.status || '').toLowerCase() === 'active';
  const isSecurityGuard = employee.designation === 'Security Guard';
  const salary = employee;
  const docs = employee.documents || {};

  const totalEarnings = (employee.basic || 0) + (employee.hra || 0) + (employee.conveyance || 0) + (employee.otherAllowance || 0) + (employee.specialAllowance || 0);
  const estimatedNet = totalEarnings - 0; // No deductions in new structure

  return (
    <AdminLayout>
      <div className={styles.container}>
        {/* Toast */}
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ message: '', type: 'success' })}
        />

        {/* Edit Form */}
        <EmployeeForm
          isOpen={isEditOpen}
          onClose={() => setIsEditOpen(false)}
          onSubmit={handleEditSubmit}
          employee={employee}
          clients={clients}
        />

        {/* Transfer Modal */}
        <TransferEmployeeModal
          isOpen={isTransferOpen}
          employee={employee}
          onClose={() => setIsTransferOpen(false)}
          onTransfer={handleTransfer}
          clients={clients}
        />

        {/* Confirm Modal */}
        <ConfirmModal
          isOpen={confirmModal.isOpen}
          title={confirmModal.title}
          description={confirmModal.description}
          confirmLabel={confirmModal.confirmLabel}
          variant={confirmModal.variant}
          onConfirm={handleConfirmAction}
          onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        />

        {/* Breadcrumb */}
        <div className={styles.breadcrumb} role="navigation" aria-label="Breadcrumb">
          <span className={styles.crumbLink} onClick={() => navigate('/admin/dashboard')}>Dashboard</span>
          <span className={styles.separator}>/</span>
          <span className={styles.crumbLink} onClick={() => navigate('/admin/employees')}>Employees</span>
          <span className={styles.separator}>/</span>
          <span className={styles.crumbActive}>{employee.name}</span>
        </div>

        {/* Profile Header Card */}
        <div className={styles.profileCard}>
          <div className={styles.profileLeft}>
            <div className={styles.profileAvatar}>
              {employee.photo ? (
                <img src={employee.photo} alt={employee.name} className={styles.profileAvatarImg} />
              ) : (
                <span>{employee.initials || employee.name.substring(0, 2).toUpperCase()}</span>
              )}
            </div>
            <div className={styles.profileInfo}>
              <h1 className={styles.profileName}>{employee.name}</h1>
              <div className={styles.profileMeta}>
                <span className={styles.profileId}>{employee.employeeId}</span>
                <span className={styles.profileDot}>•</span>
                <span className={styles.profileDesignation}>{employee.designation}</span>
              </div>
              <div className={styles.profileMeta}>
                <Building2 size={14} className={styles.metaIcon} />
                <span className={styles.profileCompany}>{employee.companyName || employee.clientName}</span>
              </div>
              <StatusBadge status={employee.status} />
            </div>
          </div>
          <div className={styles.profileActions}>
            <button
              className={styles.editBtn}
              onClick={() => setIsEditOpen(true)}
              aria-label="Edit employee"
            >
              <Edit2 size={15} />
              <span>Edit Employee</span>
            </button>
            <button
              className={styles.transferBtn}
              onClick={() => setIsTransferOpen(true)}
              aria-label="Transfer employee"
            >
              <ArrowLeftRight size={15} />
              <span>Transfer</span>
            </button>
            <button
              className={styles.downloadBtn}
              onClick={() => downloadEmployeeProfile(employee, activeCompany)}
              aria-label="Download profile"
            >
              <Download size={15} />
              <span>Download</span>
            </button>
            <button
              className={`${styles.statusToggleBtn} ${isActive ? styles.deactivateBtn : styles.activateBtn}`}
              onClick={handleToggleStatus}
              aria-label={isActive ? 'Deactivate employee' : 'Activate employee'}
            >
              <Power size={15} />
              <span>{isActive ? 'Deactivate' : 'Activate'}</span>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className={styles.tabsWrapper}>
          <div className={styles.tabsList} role="tablist">
            {TABS.map((tab) => {
              const TabIcon = tab.icon;
              return (
                <button
                  key={tab.id}
                  role="tab"
                  aria-selected={activeTab === tab.id}
                  className={`${styles.tabBtn} ${activeTab === tab.id ? styles.tabActive : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <TabIcon size={15} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Panels */}
        <div className={styles.tabPanel} role="tabpanel">

          {/* OVERVIEW / BASIC DETAILS TAB */}
          {activeTab === 'overview' && (
            <div className={styles.twoColGrid}>
              <div className={styles.infoCard}>
                <h3 className={styles.infoCardTitle}>Personal Information</h3>
                <div className={styles.infoRows}>
                  <InfoRow icon={<User size={15} />} label="Full Name" value={employee.name} />
                  <InfoRow icon={<Hash size={15} />} label="Employee ID" value={employee.employeeId} />
                  <InfoRow icon={<Hash size={15} />} label="Employee Code" value={employee.employeeCode} />
                  <InfoRow label="Father/Husband Name" value={employee.fatherHusbandName || 'N/A'} />
                  <InfoRow label="Gender" value={employee.gender || 'N/A'} />
                  <InfoRow label="DOB" value={employee.dob || 'N/A'} />
                  <InfoRow label="Blood Group" value={employee.bloodGroup || 'N/A'} />
                  <InfoRow label="Marital Status" value={employee.maritalStatus || 'N/A'} />
                  {employee.maritalStatus === 'Married' && employee.spouseName && (
                    <InfoRow label="Spouse Name" value={employee.spouseName} />
                  )}
                  <InfoRow label="Aadhaar No." value={employee.aadhaar || 'N/A'} />
                  <InfoRow label="PAN No." value={employee.pan || 'N/A'} />
                  <InfoRow label="Religion" value={employee.religion || 'N/A'} />
                  <InfoRow label="Nationality" value={employee.nationality || 'Indian'} />
                </div>
              </div>
              <div className={styles.infoCard}>
                <h3 className={styles.infoCardTitle}>Contact Information</h3>
                <div className={styles.infoRows}>
                  <InfoRow icon={<Phone size={15} />} label="Mobile" value={employee.mobile} />
                  <InfoRow icon={<Phone size={15} />} label="Emergency Mobile No." value={employee.emergencyMobile || employee.alternateMobile || 'N/A'} />
                  <InfoRow label="Email" value={employee.email || 'N/A'} />
                  <InfoRow label="Joining Date" value={employee.joiningDate || 'N/A'} />
                </div>
              </div>
            </div>
          )}

          {/* EMPLOYMENT TAB */}
          {activeTab === 'employment' && (
            <div className={styles.twoColGrid}>
              <div className={styles.infoCard}>
                <h3 className={styles.infoCardTitle}>Company & Department</h3>
                <div className={styles.infoRows}>
                  <InfoRow icon={<Building2 size={15} />} label="Company" value={employee.companyName} />
                  <InfoRow icon={<Layers size={15} />} label="Department" value={employee.department} />
                  <InfoRow icon={<Briefcase size={15} />} label="Designation" value={employee.designation} />
                  <InfoRow label="Employee Type" value={employee.employeeType || 'N/A'} />
                  <InfoRow icon={<MapPin size={15} />} label="Site/Location" value={employee.siteLocation || 'N/A'} />
                  <InfoRow label="Duty Post" value={employee.dutyPost || 'N/A'} />
                </div>
              </div>
              <div className={styles.infoCard}>
                <h3 className={styles.infoCardTitle}>Work Details</h3>
                <div className={styles.infoRows}>
                  <InfoRow label="Shift" value={employee.shift || 'N/A'} />
                  <InfoRow label="Reporting Supervisor" value={employee.reportingSupervisor || 'N/A'} />
                  <InfoRow label="Joining Date" value={employee.joiningDate || 'N/A'} />
                  <InfoRow label="Joining Location" value={employee.joiningLocation || 'N/A'} />
                  <InfoRow label="Previous Experience" value={employee.previousExperience || 'N/A'} />
                  <InfoRow label="Language (Read + Write)" value={employee.language || 'N/A'} />
                  <InfoRow label="Qualification" value={employee.qualification || 'N/A'} />
                  <InfoRow label="Technical Qualification" value={employee.technicalQualification || 'N/A'} />
                  <InfoRow label="Status" value={employee.employeeStatus || 'N/A'} />
                  {employee.exitDate && <InfoRow label="Exit Date" value={employee.exitDate} />}
                  {employee.exitReason && <InfoRow label="Exit Reason" value={employee.exitReason} />}
                </div>
              </div>
            </div>
          )}

          {/* DOCUMENTS TAB */}
          {activeTab === 'documents' && (
            <div className={styles.documentsGridNew}>
              {Array.isArray(employee.documentList) && employee.documentList.length > 0 ? (
                employee.documentList.map((doc, dIdx) => (
                  <div key={dIdx} className={styles.docCard}>
                    <div className={styles.docCardHeader}>
                      <div className={styles.docIcon}>
                        <FileText size={18} />
                      </div>
                      <div className={styles.docMeta}>
                        <span className={styles.docLabel}>{doc.name || `Document #${dIdx + 1}`}</span>
                        <span className={styles.docDate}>
                          {doc.photo ? `File: ${doc.photo}` : 'No file attached'}
                        </span>
                      </div>
                      {doc.photo && (
                        <span className={styles.uploadedBadge}>
                          <CheckCircle size={13} /> Uploaded
                        </span>
                      )}
                    </div>
                    {doc.photo && (
                      <div className={styles.docCardFooter}>
                        <div className={styles.docActions}>
                          <button className={styles.docBtn} onClick={() => alert(`View ${doc.name || 'document'} (demo)`)}>View</button>
                          <button className={styles.docBtn} onClick={() => alert(`Download ${doc.name || 'document'} (demo)`)}>
                            <Download size={13} /> Download
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                DOCUMENT_TYPES.map((docType) => {
                  const doc = docs[docType.key] || { status: 'uploaded', date: new Date().toISOString().split('T')[0] };
                  const isGuardDoc = docType.guardOnly;
                  const isNotApplicable = isGuardDoc && !isSecurityGuard;
                  const isUploaded = !isNotApplicable;
                  const normalizedDoc = {
                    ...doc,
                    status: isUploaded ? 'uploaded' : 'not_required',
                    date: doc.date || new Date().toISOString().split('T')[0],
                    fileName: doc.fileName || `${docType.label}.pdf`,
                    fileSize: doc.fileSize || '1.2 KB'
                  };

                  return (
                    <div
                      key={docType.key}
                      className={`${styles.docCard} ${isNotApplicable ? styles.docCardMuted : ''}`}
                    >
                      <div className={styles.docCardHeader}>
                        <div className={styles.docIcon}>
                          <FileText size={18} />
                        </div>

                        <div className={styles.docMeta}>
                          <span className={styles.docLabel}>{docType.label}</span>
                          {isUploaded ? (
                            <span className={styles.docDate}>Uploaded: {normalizedDoc.date}</span>
                          ) : (
                            <span className={styles.docDate}>Not required</span>
                          )}
                          {isGuardDoc && !isNotApplicable && (
                            <span className={styles.requiredBadge}>Required</span>
                          )}
                          {isNotApplicable && (
                            <span className={styles.naNote}>Not required</span>
                          )}
                        </div>

                        {isUploaded ? (
                          <span className={styles.uploadedBadge}>
                            <CheckCircle size={13} /> Uploaded
                          </span>
                        ) : null}
                      </div>

                      {isUploaded && (
                        <div className={styles.docCardFooter}>
                          <div className={styles.docActions}>
                            <button className={styles.docBtn} onClick={() => alert('View document (demo)')}>View</button>
                            <button className={styles.docBtn} onClick={() => alert('Download document (demo)')}>
                              <Download size={13} /> Download
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* STATUTORY & BANK TAB */}
          {activeTab === 'statutory' && (
            <div className={styles.twoColGrid}>
              <div className={styles.infoCard}>
                <h3 className={styles.infoCardTitle}>Statutory Details</h3>
                <div className={styles.infoRows}>
                  <InfoRow label="Aadhaar" value={employee.aadhaar || 'N/A'} />
                  <InfoRow label="PAN" value={employee.pan || 'N/A'} />
                  <InfoRow label="PF Applicable" value={employee.pfApplicable ? 'Yes' : 'No'} />
                  {employee.pfApplicable && (
                    <>
                      <InfoRow label="UAN" value={employee.uan || 'N/A'} />
                      <InfoRow label="PF Number" value={employee.pfNo || 'N/A'} />
                    </>
                  )}
                  <InfoRow label="ESI Applicable" value={employee.esiApplicable ? 'Yes' : 'No'} />
                  {employee.esiApplicable && (
                    <>
                      <InfoRow label="ESI Number" value={employee.esicNo || 'N/A'} />
                      <InfoRow label="Dispensary Name" value={employee.dispensaryNo || 'N/A'} />
                    </>
                  )}
                  <InfoRow label="LWF" value={employee.lwf || (employee.lwfApplicable ? 'Yes' : 'N/A')} />
                  <InfoRow label="TDS Applicable" value={employee.tdsApplicable ? 'Yes' : 'No'} />
                  {employee.drivingLicenseNo && (
                    <>
                      <InfoRow label="Driving License No." value={employee.drivingLicenseNo} />
                      <InfoRow label="DL Expiry Date" value={employee.dlExpiryDate || 'N/A'} />
                    </>
                  )}
                  {employee.armedLicenseNo && (
                    <>
                      <InfoRow label="Armed License No." value={employee.armedLicenseNo} />
                      <InfoRow label="AL Expiry Date" value={employee.alExpiryDate || 'N/A'} />
                    </>
                  )}
                </div>
              </div>
              <div className={styles.infoCard}>
                <h3 className={styles.infoCardTitle}>Bank Details</h3>
                <div className={styles.infoRows}>
                  <InfoRow icon={<Landmark size={15} />} label="Bank Name" value={employee.bankName || 'N/A'} />
                  <InfoRow label="Branch Name" value={employee.branchName || employee.branch || 'N/A'} />
                  <InfoRow icon={<User size={15} />} label="Account Holder" value={employee.accountHolder || 'N/A'} />
                  <InfoRow icon={<CreditCard size={15} />} label="Account Number" value={employee.accountNumber || 'N/A'} />
                  <InfoRow icon={<Hash size={15} />} label="IFSC Code" value={employee.ifsc || 'N/A'} />
                  <InfoRow label="Payment Mode" value={employee.paymentMode || 'N/A'} />
                </div>
              </div>
            </div>
          )}

          {/* ADDRESS & FAMILY TAB */}
          {activeTab === 'address' && (
            <div className={styles.twoColGrid}>
              <div className={styles.infoCard}>
                <h3 className={styles.infoCardTitle}>Address</h3>
                <div className={styles.infoRows}>
                  <InfoRow icon={<MapPin size={15} />} label="Present Address" value={employee.presentAddress || 'N/A'} />
                  <InfoRow icon={<MapPin size={15} />} label="Permanent Address" value={employee.permanentAddress || 'N/A'} />
                  <InfoRow label="Same as Present" value={employee.sameAsPresentAddress ? 'Yes' : 'No'} />
                </div>
              </div>
              <div className={styles.infoCard}>
                <h3 className={styles.infoCardTitle}>Family & Nominee</h3>
                {Array.isArray(employee.familyMembers) && employee.familyMembers.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {employee.familyMembers.map((member, mIdx) => (
                      <div key={mIdx} style={{ padding: '10px 12px', background: 'var(--surface-alt)', borderRadius: '6px', border: '1px solid var(--border)' }}>
                        <div style={{ fontWeight: 700, fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px', textTransform: 'uppercase' }}>
                          Member #{mIdx + 1}
                        </div>
                        <div className={styles.infoRows}>
                          <InfoRow label="Name" value={member.name || member.familyMemberName || 'N/A'} />
                          <InfoRow label="Relation" value={member.relation || 'N/A'} />
                          <InfoRow label="DOB" value={member.dob || member.dobAge || 'N/A'} />
                          {member.aadhaarNumber && <InfoRow label="Aadhaar Number" value={member.aadhaarNumber} />}
                          {member.address && <InfoRow label="Address" value={member.address} />}
                          <InfoRow label="Nominee" value={member.nomineeYesNo || member.nominee || 'No'} />
                          {member.nomineeSharePercent && (
                            <InfoRow label="Nominee Share %" value={`${member.nomineeSharePercent}%`} />
                          )}
                          {member.aadhaarPhoto && <InfoRow label="Aadhaar Photo" value={member.aadhaarPhoto} />}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className={styles.infoRows}>
                    <InfoRow label="Family Member Name" value={employee.familyMemberName || 'N/A'} />
                    <InfoRow label="Relation" value={employee.relation || 'N/A'} />
                    <InfoRow label="DOB" value={employee.dob || employee.dobAge || 'N/A'} />
                    <InfoRow label="Nominee" value={employee.nomineeYesNo || 'N/A'} />
                    <InfoRow label="Nominee Share %" value={employee.nomineeSharePercent || 'N/A'} />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* SALARY STRUCTURE TAB */}
          {activeTab === 'salary' && (
            <div className={styles.salaryLayout}>
              <div className={styles.salaryBreakdown}>
                <h3 className={styles.infoCardTitle}>Salary Breakdown</h3>
                <div className={styles.salaryRows}>
                  <SalaryRow label="Basic" value={INR(employee.basic)} type="earning" />
                  <SalaryRow label="HRA" value={INR(employee.hra)} type="earning" />
                  <SalaryRow label="Conveyance" value={INR(employee.conveyance)} type="earning" />
                  <SalaryRow label="Other Allowance" value={INR(employee.otherAllowance)} type="earning" />
                  <SalaryRow label="Special Allowance" value={INR(employee.specialAllowance)} type="earning" />
                  <SalaryRow label="Overtime Rate" value={`${INR(employee.overtimeRate)}/hr`} type="neutral" />
                  <SalaryRow label="Bonus" value={INR(employee.bonus)} type="earning" />
                  <SalaryRow label="Gratuity" value={INR(employee.gratuity)} type="neutral" />
                </div>
              </div>
              <div className={styles.salaryNetCard}>
                <h3 className={styles.salaryNetTitle}>Summary</h3>
                <div className={styles.salaryNetRows}>
                  <div className={styles.salaryNetRow}>
                    <span>Gross Salary</span>
                    <span className={styles.earningsVal}>{INR(employee.grossSalary)}</span>
                  </div>
                  <div className={styles.salaryNetRow}>
                    <span>Calculated Total</span>
                    <span className={styles.earningsVal}>{INR(totalEarnings)}</span>
                  </div>
                  <div className={`${styles.salaryNetRow} ${styles.netFinalRow}`}>
                    <span>Salary Type</span>
                    <span className={styles.netVal}>{employee.salaryType}</span>
                  </div>
                </div>
                <div className={styles.salaryInfo}>
                  <span>Effective From: {employee.salaryEffectiveFrom || 'N/A'}</span>
                  <span>Minimum Wage Category: {employee.minimumWageCategory || 'N/A'}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

function InfoRow({ icon, label, value }) {
  return (
    <div className={styles.infoRow}>
      <div className={styles.infoRowIcon}>{icon}</div>
      <div className={styles.infoRowContent}>
        <span className={styles.infoRowLabel}>{label}</span>
        <span className={styles.infoRowValue}>{value || 'N/A'}</span>
      </div>
    </div>
  );
}

function SalaryRow({ label, value, type }) {
  const cls = type === 'earning' ? styles.salaryEarning : type === 'deduction' ? styles.salaryDeduction : styles.salaryNeutral;
  return (
    <div className={styles.salaryRow}>
      <span className={styles.salaryLabel}>{label}</span>
      <span className={`${styles.salaryValue} ${cls}`}>{value}</span>
    </div>
  );
}

export default EmployeeDetails;
