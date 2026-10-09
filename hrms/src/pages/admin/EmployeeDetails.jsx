import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  User, Briefcase, FileText, CreditCard, IndianRupee,
  Edit2, ArrowLeftRight, Download, Power, CheckCircle, Clock,
  Phone, MapPin, Building2, Layers, Hash, Landmark, Upload, X, Eye,
  Shield, Award, MessageSquare, Calendar, Key, Trash2
} from 'lucide-react';
import styles from './EmployeeDetails.module.css';

import AdminLayout from '../../components/layout/AdminLayout';
import StatusBadge from '../../components/common/StatusBadge';
import ConfirmModal from '../../components/common/ConfirmModal';
import TransferEmployeeModal from '../../components/employees/TransferEmployeeModal';
import EmployeeCredentialsModal from '../../components/employees/EmployeeCredentialsModal';
import EmployeeForm from '../../components/employees/EmployeeForm';
import Toast from '../../components/common/Toast';

import { useCompany } from '../../context/CompanyContext';
import { authService } from '../../services/authService';
import { downloadEmployeeProfile } from '../../utils/employeeProfileExport';

const API_BASE_URL = import.meta.env.VITE_API_URL;
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

  // Consolidate all licenses dynamically
  const activeLicenses = React.useMemo(() => {
    if (!employee) return [];
    const list = Array.isArray(employee.licenseList) ? [...employee.licenseList] : [];
    if (Array.isArray(employee.licenses)) {
      employee.licenses.forEach(lic => {
        if (!list.some(l => l.licenseNo && l.licenseNo === lic.licenseNo)) {
          list.push(lic);
        }
      });
    }
    // Fallback: Check if armedLicenseNo exists but not in licenseList
    if (employee.armedLicenseNo && !list.some(l => l.licenseType === 'Arms / Gun License' || l.licenseNo === employee.armedLicenseNo)) {
      list.push({
        licenseType: 'Arms / Gun License',
        licenseNo: employee.armedLicenseNo,
        expiryDate: employee.alExpiryDate || '',
        photo: employee.armedLicenseCopy || ''
      });
    }
    // Fallback: Check if drivingLicenseNo exists
    if (employee.drivingLicenseNo && !list.some(l => (l.licenseType?.includes('Driving') || l.licenseType === 'Driving License') || l.licenseNo === employee.drivingLicenseNo)) {
      list.push({
        licenseType: employee.drivingLicenseType || employee.licenseType || 'Driving License',
        licenseNo: employee.drivingLicenseNo,
        expiryDate: employee.dlExpiryDate || '',
        photo: employee.drivingLicenseCopy || ''
      });
    }
    return list.filter(l => l && (l.licenseNo || l.photo || (l.licenseType && l.licenseType !== 'Driving License')));
  }, [employee]);

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [isCredentialsOpen, setIsCredentialsOpen] = useState(false);
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false, title: '', description: '', confirmLabel: '', variant: 'danger', actionType: null
  });
  const [isProcessingAction, setIsProcessingAction] = useState(false);
  const [toast, setToast] = useState({ message: '', type: 'success' });

  const showToast = (msg, type = 'success') => setToast({ message: msg, type });

  const [previewModal, setPreviewModal] = useState({
    isOpen: false,
    title: '',
    url: '',
    fileName: '',
    isImage: false,
    isPdf: false
  });

  const getCleanDocLabel = (photoStr) => {
    if (!photoStr) return 'No file attached';
    if (photoStr.startsWith('data:image/png')) return 'Attached Image (PNG)';
    if (photoStr.startsWith('data:image/jpeg') || photoStr.startsWith('data:image/jpg')) return 'Attached Image (JPG)';
    if (photoStr.startsWith('data:image/webp')) return 'Attached Image (WEBP)';
    if (photoStr.startsWith('data:image/')) return 'Attached Image';
    if (photoStr.startsWith('data:application/pdf')) return 'Attached Document (PDF)';
    if (photoStr.startsWith('data:')) return 'Attached File';
    return `File: ${photoStr}`;
  };

  const handleViewDocument = (docName, fileUrl) => {
    if (!fileUrl) {
      showToast('No document file attached to view.', 'error');
      return;
    }
    const isImage = fileUrl.startsWith('data:image/') || /\.(png|jpe?g|webp|gif|svg)$/i.test(fileUrl);
    const isPdf = fileUrl.startsWith('data:application/pdf') || /\.pdf$/i.test(fileUrl);

    setPreviewModal({
      isOpen: true,
      title: docName || 'Document Preview',
      url: fileUrl,
      fileName: `${(employee?.name || 'Employee').replace(/\s+/g, '_')}_${(docName || 'document').replace(/\s+/g, '_')}`,
      isImage,
      isPdf
    });
  };

  const handleDownloadDocument = (docName, fileUrl) => {
    if (!fileUrl) {
      showToast('No document file attached to download.', 'error');
      return;
    }
    try {
      let ext = '.png';
      if (fileUrl.startsWith('data:image/jpeg') || fileUrl.startsWith('data:image/jpg')) ext = '.jpg';
      else if (fileUrl.startsWith('data:image/webp')) ext = '.webp';
      else if (fileUrl.startsWith('data:application/pdf') || /\.pdf$/i.test(fileUrl)) ext = '.pdf';
      else if (fileUrl.includes('.') && !fileUrl.startsWith('data:')) {
        ext = fileUrl.substring(fileUrl.lastIndexOf('.'));
      }

      const cleanEmpName = (employee?.name || 'Employee').replace(/[^a-zA-Z0-9_-]/g, '_');
      const cleanDocName = (docName || 'Document').replace(/[^a-zA-Z0-9_-]/g, '_');
      const filename = `${cleanEmpName}_${cleanDocName}${ext}`;

      const link = document.createElement('a');
      link.href = fileUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast(`✓ Downloaded ${filename}`, 'success');
    } catch (err) {
      console.error('Download error:', err);
      showToast('Failed to download document.', 'error');
    }
  };

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

  const handleSaveCredentials = async (empId, credentialsData) => {
    try {
      await updateEmployee({
        password: credentialsData.password,
        enablePortalAccess: credentialsData.enablePortalAccess,
      });
      showToast(`✓ Credentials updated successfully for ${employee?.name || 'employee'}.`, 'success');
      setIsCredentialsOpen(false);
    } catch (err) {
      showToast(err.message || 'Failed to update credentials.', 'error');
      throw err;
    }
  };

  const handleDeleteEmployee = () => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Employee?',
      description: `Are you sure you want to permanently delete ${employee.name} (${employee.employeeId || id})? This action will remove all data from the database and cannot be undone.`,
      confirmLabel: 'Delete Employee',
      variant: 'danger',
      actionType: 'delete'
    });
  };

  const handleConfirmAction = async () => {
    setIsProcessingAction(true);
    if (confirmModal.actionType === 'delete') {
      try {
        const token = authService.getToken();
        const res = await fetch(`${API_BASE_URL}/employees/${id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token || ''}`,
            'x-company-id': currentCompanyId
          }
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Failed to delete employee');
        showToast('✓ Employee deleted permanently.', 'success');
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        setTimeout(() => navigate('/admin/employees'), 900);
      } catch (err) {
        showToast(err.message || 'Failed to delete employee.', 'error');
      } finally {
        setIsProcessingAction(false);
      }
    } else {
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
      } finally {
        setIsProcessingAction(false);
      }
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

        {/* Credentials Modal */}
        <EmployeeCredentialsModal
          isOpen={isCredentialsOpen}
          employee={employee}
          onClose={() => setIsCredentialsOpen(false)}
          onSave={handleSaveCredentials}
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
          loading={isProcessingAction}
          onConfirm={handleConfirmAction}
          onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        />

        {/* Document Preview Modal */}
        {previewModal.isOpen && (
          <div className={styles.modalOverlay} onClick={() => setPreviewModal(prev => ({ ...prev, isOpen: false }))}>
            <div className={styles.previewCard} onClick={(e) => e.stopPropagation()}>
              <div className={styles.previewHeader}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <FileText size={20} color="var(--primary)" />
                  <div>
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {previewModal.title}
                    </h3>
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                      {employee?.name} ({employee?.employeeId})
                    </span>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    type="button"
                    className={styles.docBtn}
                    style={{ background: 'var(--primary)', color: '#ffffff', borderColor: 'var(--primary)' }}
                    onClick={() => handleDownloadDocument(previewModal.title, previewModal.url)}
                  >
                    <Download size={14} /> Download
                  </button>
                  <button
                    type="button"
                    className={styles.closeBtn}
                    onClick={() => setPreviewModal(prev => ({ ...prev, isOpen: false }))}
                    aria-label="Close Preview"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>
              <div className={styles.previewBody}>
                {previewModal.isImage ? (
                  <div className={styles.imagePreviewWrap}>
                    <img src={previewModal.url} alt={previewModal.title} className={styles.fullPreviewImg} />
                  </div>
                ) : previewModal.isPdf ? (
                  <iframe
                    src={previewModal.url}
                    title={previewModal.title}
                    className={styles.pdfFrame}
                  />
                ) : (
                  <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                    <FileText size={48} color="var(--text-muted)" style={{ margin: '0 auto 16px' }} />
                    <p style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{previewModal.title}</p>
                    <button
                      type="button"
                      className={styles.docBtn}
                      onClick={() => handleDownloadDocument(previewModal.title, previewModal.url)}
                    >
                      <Download size={14} /> Download File
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

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
              {employee.employeePhoto || employee.photo ? (
                <img
                  src={employee.employeePhoto || employee.photo}
                  alt={employee.name}
                  className={styles.profileAvatarImg}
                />
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
                <span className={styles.profileCompany}>{employee.companyName || employee.clientName || 'Direct Deployment'}</span>
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
              onClick={() => setIsCredentialsOpen(true)}
              aria-label="Manage login credentials"
            >
              <Key size={15} />
              <span>Credentials</span>
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
              className={`${styles.statusToggleBtn} ${styles.deactivateBtn}`}
              onClick={handleDeleteEmployee}
              aria-label="Delete employee"
              style={{ color: '#ef4444', borderColor: '#fca5a5', backgroundColor: '#fef2f2' }}
            >
              <Trash2 size={15} />
              <span>Delete</span>
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
                  <InfoRow icon={<Building2 size={15} />} label="Company" value={employee.companyName || employee.clientName || 'N/A'} />
                  <InfoRow icon={<Layers size={15} />} label="Department" value={employee.department} />
                  <InfoRow icon={<Briefcase size={15} />} label="Designation" value={employee.designation} />
                  <InfoRow label="Employee Type" value={employee.employeeType || 'N/A'} />
                  <InfoRow icon={<MapPin size={15} />} label="Client Address" value={employee.clientAddress || employee.siteLocation || employee.site || employee.address || 'N/A'} />
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
                  <InfoRow label="Status" value={employee.employeeStatus || employee.status || 'Active'} />
                  {employee.exitDate && <InfoRow label="Exit Date" value={employee.exitDate} />}
                  {employee.exitReason && <InfoRow label="Exit Reason" value={employee.exitReason} />}
                </div>
              </div>
            </div>
          )}

          {/* DOCUMENTS TAB */}
          {activeTab === 'documents' && (
            <div>
              {/* 1. LICENSES & PERMITS SECTION */}
              {activeLicenses.length > 0 && (
                <div style={{ marginBottom: '28px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Shield size={18} color="var(--primary)" />
                      <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>Licenses & Permits</h3>
                    </div>
                    <span style={{ fontSize: '12px', background: 'var(--surface-alt)', padding: '2px 8px', borderRadius: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                      {activeLicenses.length} {activeLicenses.length === 1 ? 'License' : 'Licenses'}
                    </span>
                  </div>

                  <div className={styles.documentsGridNew}>
                    {activeLicenses.map((lic, lIdx) => (
                      <div key={lIdx} className={styles.docCard}>
                        <div className={styles.docCardHeader}>
                          <div className={styles.docIcon} style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#2563eb' }}>
                            <Shield size={18} />
                          </div>
                          <div className={styles.docMeta}>
                            <span className={styles.docLabel}>{lic.licenseType || `License #${lIdx + 1}`}</span>
                            <span className={styles.docDate}>
                              {lic.licenseNo ? `No: ${lic.licenseNo}` : 'No number specified'} {lic.expiryDate ? `• Exp: ${lic.expiryDate}` : ''}
                            </span>
                          </div>
                          {lic.photo && (
                            <span className={styles.uploadedBadge}>
                              <CheckCircle size={13} /> Uploaded
                            </span>
                          )}
                        </div>

                        {/* Thumbnail preview if image */}
                        {lic.photo && lic.photo.startsWith('data:image/') && (
                          <div style={{ padding: '0 16px 12px', cursor: 'pointer' }} onClick={() => handleViewDocument(lic.licenseType || 'License', lic.photo)}>
                            <img
                              src={lic.photo}
                              alt={lic.licenseType}
                              style={{ maxHeight: '110px', width: '100%', objectFit: 'contain', background: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0' }}
                            />
                          </div>
                        )}

                        {lic.photo && (
                          <div className={styles.docCardFooter}>
                            <div className={styles.docActions}>
                              <button
                                type="button"
                                className={styles.docBtn}
                                onClick={() => handleViewDocument(lic.licenseType || 'License', lic.photo)}
                              >
                                <Eye size={13} /> View
                              </button>
                              <button
                                type="button"
                                className={styles.docBtn}
                                onClick={() => handleDownloadDocument(lic.licenseType || 'License', lic.photo)}
                              >
                                <Download size={13} /> Download
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 2. IDENTIFICATION & ATTACHED DOCUMENTS SECTION */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FileText size={18} color="var(--primary)" />
                    <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>Identification & Proof Documents</h3>
                  </div>
                </div>

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
                              {getCleanDocLabel(doc.photo)}
                            </span>
                          </div>
                          {doc.photo && (
                            <span className={styles.uploadedBadge}>
                              <CheckCircle size={13} /> Uploaded
                            </span>
                          )}
                        </div>

                        {/* Thumbnail preview if image */}
                        {doc.photo && doc.photo.startsWith('data:image/') && (
                          <div style={{ padding: '0 16px 12px', cursor: 'pointer' }} onClick={() => handleViewDocument(doc.name, doc.photo)}>
                            <img
                              src={doc.photo}
                              alt={doc.name}
                              style={{ maxHeight: '110px', width: '100%', objectFit: 'contain', background: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0' }}
                            />
                          </div>
                        )}

                        {doc.photo && (
                          <div className={styles.docCardFooter}>
                            <div className={styles.docActions}>
                              <button
                                type="button"
                                className={styles.docBtn}
                                onClick={() => handleViewDocument(doc.name, doc.photo)}
                              >
                                <Eye size={13} /> View
                              </button>
                              <button
                                type="button"
                                className={styles.docBtn}
                                onClick={() => handleDownloadDocument(doc.name, doc.photo)}
                              >
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

                      const docFileUrl = doc.url || doc.photo || (docType.key === 'photo' ? (employee.employeePhoto || employee.photo) : null);

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
                                <button
                                  type="button"
                                  className={styles.docBtn}
                                  onClick={() => {
                                    if (docFileUrl) {
                                      handleViewDocument(docType.label, docFileUrl);
                                    } else {
                                      showToast(`Viewing standard template for ${docType.label}.`, 'info');
                                    }
                                  }}
                                >
                                  <Eye size={13} /> View
                                </button>
                                <button
                                  type="button"
                                  className={styles.docBtn}
                                  onClick={() => {
                                    if (docFileUrl) {
                                      handleDownloadDocument(docType.label, docFileUrl);
                                    } else {
                                      showToast(`Generating document download for ${docType.label}...`, 'success');
                                    }
                                  }}
                                >
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
              </div>

              {/* 3. VERIFICATION REMARKS SECTION */}
              {employee.remarks && (
                <div style={{ marginTop: '24px', padding: '16px', background: 'var(--surface-alt)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <MessageSquare size={16} color="var(--text-secondary)" />
                    <strong style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Verification Remarks & Notes:</strong>
                  </div>
                  <p style={{ margin: 0, fontSize: '13.5px', color: 'var(--text-primary)', whiteSpace: 'pre-line' }}>
                    {employee.remarks}
                  </p>
                </div>
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
                  {activeLicenses.length > 0 ? (
                    activeLicenses.map((lic, idx) => (
                      <React.Fragment key={idx}>
                        <InfoRow label={`${lic.licenseType || 'License'} No.`} value={lic.licenseNo || 'N/A'} />
                        {lic.expiryDate && <InfoRow label={`${lic.licenseType || 'License'} Expiry`} value={lic.expiryDate} />}
                      </React.Fragment>
                    ))
                  ) : (
                    <>
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
