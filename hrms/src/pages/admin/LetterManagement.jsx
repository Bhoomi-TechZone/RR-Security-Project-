import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  FileSignature,
  FileCheck,
  UserCheck,
  Award,
  HeartHandshake,
  Plus,
  Search,
  Filter,
  Eye,
  Printer,
  Download,
  Mail,
  Edit3,
  Trash2,
  SlidersHorizontal,
  ChevronRight,
  X,
  Send,
  CheckCircle2,
  AlertCircle,
  FileText
} from 'lucide-react';
import styles from './LetterManagement.module.css';
import AdminLayout from '../../components/layout/AdminLayout';
import { useCompany } from '../../context/CompanyContext';
import { mockEmployees } from '../../data/employeeData';
import {
  LETTER_TYPES,
  LETTER_STATUSES,
  mockIssuedLetters,
  getTemplateConfig,
  renderLetterBody
} from '../../data/letterManagementData';

function LetterManagement() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { activeCompany } = useCompany();

  // Active Type Tab: 'all' or one of LETTER_TYPES id ('appointment-letter', 'joining-letter', etc.)
  const typeParam = searchParams.get('type') || 'all';
  const [activeTab, setActiveTab] = useState(typeParam);

  // Sync tab with URL search parameter
  useEffect(() => {
    const currentType = searchParams.get('type') || 'all';
    setActiveTab(currentType);
  }, [searchParams]);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    if (tabId === 'all') {
      setSearchParams({});
    } else {
      setSearchParams({ type: tabId });
    }
  };

  // State for letters catalog
  const [letters, setLetters] = useState(() => {
    const saved = localStorage.getItem('novaspark_issued_letters');
    return saved ? JSON.parse(saved) : mockIssuedLetters;
  });

  const saveLetters = (updated) => {
    setLetters(updated);
    localStorage.setItem('novaspark_issued_letters', JSON.stringify(updated));
  };

  // Filter & Search states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [deptFilter, setDeptFilter] = useState('All');

  // Modals state
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedLetter, setSelectedLetter] = useState(null);

  // Toast notification state
  const [toastMessage, setToastMessage] = useState(null);
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Form State for Generating / Editing Letter
  const initialFormState = {
    letterType: 'appointment-letter',
    employeeId: '',
    employeeName: '',
    employeeCode: '',
    designation: '',
    department: '',
    location: '',
    issueDate: new Date().toISOString().split('T')[0],
    joiningDate: new Date().toISOString().split('T')[0],
    lastWorkingDate: '',
    ctc: '₹3,60,000',
    salary: '₹30,000',
    settlementAmount: '₹35,000',
    signatoryName: 'Amitabh Sharma',
    signatoryDesignation: 'Director - HR',
    customNotes: ''
  };

  const [formData, setFormData] = useState(initialFormState);
  const [showLivePreview, setShowLivePreview] = useState(false);

  // When selecting an employee from the dropdown, auto-fill fields
  const handleEmployeeSelect = (empId) => {
    const emp = mockEmployees.find((e) => e.id === empId || e.employeeId === empId);
    if (!emp) return;

    const gross = emp.grossSalary ? Number(emp.grossSalary) : 30000;
    const ctcAnnual = gross * 12;

    setFormData((prev) => ({
      ...prev,
      employeeId: emp.id || emp.employeeId,
      employeeName: emp.name,
      employeeCode: emp.employeeCode || emp.employeeId,
      designation: emp.designation || 'Staff',
      department: emp.department || 'Operations',
      location: emp.siteLocation || emp.joiningLocation || 'Main Site',
      joiningDate: emp.joiningDate || prev.joiningDate,
      salary: `₹${gross.toLocaleString('en-IN')}`,
      ctc: `₹${ctcAnnual.toLocaleString('en-IN')}`
    }));
  };

  // Open Generate Modal
  const handleOpenGenerate = (typePreset = null) => {
    setFormData({
      ...initialFormState,
      letterType: typePreset || (activeTab !== 'all' ? activeTab : 'appointment-letter')
    });
    setShowLivePreview(false);
    setIsGenerateModalOpen(true);
  };

  // Open Preview Modal
  const handleOpenPreview = (letter) => {
    setSelectedLetter(letter);
    setIsPreviewModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (letter) => {
    setSelectedLetter(letter);
    setFormData({
      letterType: letter.letterType,
      employeeId: letter.employeeId,
      employeeName: letter.employeeName,
      employeeCode: letter.employeeCode,
      designation: letter.designation,
      department: letter.department,
      location: letter.location,
      issueDate: letter.issueDate,
      joiningDate: letter.joiningDate || '',
      lastWorkingDate: letter.lastWorkingDate || '',
      ctc: letter.ctc || '',
      salary: letter.salary || '',
      settlementAmount: letter.settlementAmount || '',
      signatoryName: letter.signatoryName || 'Amitabh Sharma',
      signatoryDesignation: letter.signatoryDesignation || 'Director - HR',
      customNotes: ''
    });
    setIsEditModalOpen(true);
  };

  // Generate / Save New Letter
  const handleSaveGenerate = (isDraft = false) => {
    if (!formData.employeeName || !formData.designation) {
      alert('Please fill employee details before issuing letter.');
      return;
    }

    const typeConfig = LETTER_TYPES.find((t) => t.id === formData.letterType);
    const code = typeConfig ? typeConfig.code : 'LET';
    const randomSeq = String(Math.floor(1000 + Math.random() * 9000));
    const refNo = `NS/${code}/${new Date().getFullYear()}/${randomSeq}`;

    // Generate letter body content from template
    const templateConfig = getTemplateConfig(formData.letterType);
    const rawContent = templateConfig?.content || '';
    const generatedContent = renderLetterBody(
      rawContent,
      {
        name: formData.employeeName,
        employeeCode: formData.employeeCode,
        designation: formData.designation,
        department: formData.department,
        siteLocation: formData.location,
        companyName: activeCompany?.name
      },
      activeCompany,
      {
        issueDate: formData.issueDate,
        joiningDate: formData.joiningDate,
        lastWorkingDate: formData.lastWorkingDate,
        salary: formData.salary,
        ctc: formData.ctc,
        settlementAmount: formData.settlementAmount,
        signatoryName: formData.signatoryName,
        signatoryDesignation: formData.signatoryDesignation
      }
    );

    const subject = templateConfig?.subject
      ? renderLetterBody(templateConfig.subject, { name: formData.employeeName, employeeCode: formData.employeeCode, designation: formData.designation })
      : `${typeConfig?.name || 'Letter'} - ${formData.employeeName}`;

    const newLetter = {
      id: `let-${Date.now()}`,
      refNo,
      letterType: formData.letterType,
      employeeId: formData.employeeId || 'custom',
      employeeName: formData.employeeName,
      employeeCode: formData.employeeCode,
      designation: formData.designation,
      department: formData.department,
      location: formData.location,
      issueDate: formData.issueDate,
      joiningDate: formData.joiningDate,
      lastWorkingDate: formData.lastWorkingDate,
      ctc: formData.ctc,
      salary: formData.salary,
      settlementAmount: formData.settlementAmount,
      signatoryName: formData.signatoryName,
      signatoryDesignation: formData.signatoryDesignation,
      status: isDraft ? 'Draft' : 'Issued',
      subject,
      content: generatedContent,
      createdAt: new Date().toISOString()
    };

    const updated = [newLetter, ...letters];
    saveLetters(updated);
    setIsGenerateModalOpen(false);
    showToast(`✓ ${typeConfig?.name || 'Letter'} ${isDraft ? 'saved as Draft' : 'issued successfully'}!`);
  };

  // Save Edited Letter
  const handleSaveEdit = () => {
    if (!selectedLetter) return;

    const updated = letters.map((item) => {
      if (item.id === selectedLetter.id) {
        return {
          ...item,
          letterType: formData.letterType,
          employeeName: formData.employeeName,
          employeeCode: formData.employeeCode,
          designation: formData.designation,
          department: formData.department,
          location: formData.location,
          issueDate: formData.issueDate,
          joiningDate: formData.joiningDate,
          lastWorkingDate: formData.lastWorkingDate,
          ctc: formData.ctc,
          salary: formData.salary,
          settlementAmount: formData.settlementAmount,
          signatoryName: formData.signatoryName,
          signatoryDesignation: formData.signatoryDesignation
        };
      }
      return item;
    });

    saveLetters(updated);
    setIsEditModalOpen(false);
    showToast('✓ Letter details updated successfully.');
  };

  // Delete Letter
  const handleDeleteLetter = (letterId) => {
    if (window.confirm('Are you sure you want to delete this issued letter?')) {
      const updated = letters.filter((l) => l.id !== letterId);
      saveLetters(updated);
      showToast('Letter deleted successfully.');
    }
  };

  // Mark Letter as Sent
  const handleSendEmail = (letter) => {
    const updated = letters.map((l) => (l.id === letter.id ? { ...l, status: 'Sent' } : l));
    saveLetters(updated);
    if (selectedLetter && selectedLetter.id === letter.id) {
      setSelectedLetter({ ...selectedLetter, status: 'Sent' });
    }
    showToast(`✓ Letter sent to ${letter.employeeName}'s registered email.`);
  };

  // Download / Print action
  const handlePrint = (letter) => {
    const updated = letters.map((l) => (l.id === letter.id && l.status === 'Draft' ? { ...l, status: 'Downloaded' } : l));
    saveLetters(updated);
    window.print();
  };

  // Filtered Letters list
  const filteredLetters = useMemo(() => {
    return letters.filter((item) => {
      // Tab filter
      if (activeTab !== 'all' && item.letterType !== activeTab) {
        return false;
      }
      // Status filter
      if (statusFilter !== 'All' && item.status !== statusFilter) {
        return false;
      }
      // Department filter
      if (deptFilter !== 'All' && item.department !== deptFilter) {
        return false;
      }
      // Search term
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchesName = item.employeeName?.toLowerCase().includes(q);
        const matchesCode = item.employeeCode?.toLowerCase().includes(q);
        const matchesRef = item.refNo?.toLowerCase().includes(q);
        const matchesDesig = item.designation?.toLowerCase().includes(q);
        if (!matchesName && !matchesCode && !matchesRef && !matchesDesig) {
          return false;
        }
      }
      return true;
    });
  }, [letters, activeTab, statusFilter, deptFilter, searchTerm]);

  // Unique departments for filter
  const departmentsList = useMemo(() => {
    const depts = new Set(letters.map((l) => l.department).filter(Boolean));
    return ['All', ...Array.from(depts)];
  }, [letters]);

  // Statistics Calculation
  const stats = useMemo(() => {
    return {
      total: letters.length,
      appointment: letters.filter((l) => l.letterType === 'appointment-letter').length,
      joining: letters.filter((l) => l.letterType === 'joining-letter').length,
      experience: letters.filter((l) => l.letterType === 'experience-letter').length,
      fullFinal: letters.filter((l) => l.letterType === 'full-final-letter').length
    };
  }, [letters]);

  // Helper to get type icon
  const getTypeIcon = (typeId, size = 16) => {
    switch (typeId) {
      case 'appointment-letter':
        return <FileCheck size={size} />;
      case 'joining-letter':
        return <UserCheck size={size} />;
      case 'experience-letter':
        return <Award size={size} />;
      case 'full-final-letter':
        return <HeartHandshake size={size} />;
      default:
        return <FileText size={size} />;
    }
  };

  // Render preview letter text for modal
  const renderPreviewContent = (letter) => {
    if (letter.content) return letter.content;
    const templateConfig = getTemplateConfig(letter.letterType);
    return renderLetterBody(
      templateConfig?.content || '',
      {
        name: letter.employeeName,
        employeeCode: letter.employeeCode,
        designation: letter.designation,
        department: letter.department,
        siteLocation: letter.location,
        companyName: activeCompany?.name
      },
      activeCompany,
      {
        issueDate: letter.issueDate,
        joiningDate: letter.joiningDate,
        lastWorkingDate: letter.lastWorkingDate,
        salary: letter.salary,
        ctc: letter.ctc,
        settlementAmount: letter.settlementAmount,
        signatoryName: letter.signatoryName,
        signatoryDesignation: letter.signatoryDesignation
      }
    );
  };

  return (
    <AdminLayout>
      <div className={styles.pageContainer}>
        {/* Toast Notification */}
        {toastMessage && (
          <div className={styles.toast}>
            <CheckCircle2 size={18} color="#22c55e" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Page Header */}
        <div className={styles.pageHeader}>
          <div className={styles.headerLeft}>
            <div className={styles.breadcrumb}>
              <span>Settings</span>
              <ChevronRight size={12} />
              <span>Letter Management</span>
            </div>
          <h1 className={styles.pageTitle}>Letter Management</h1>
          <p className={styles.pageSubtitle}>
            Generate, issue, preview, and track official employee letters formatted from Template Setup.
          </p>
        </div>

        <div className={styles.headerActions}>
          <button
            type="button"
            className={styles.primaryBtn}
            onClick={() => handleOpenGenerate()}
          >
            <Plus size={16} />
            <span>Generate New Letter</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className={styles.statsGrid}>
        {/* Total Letters */}
        <div
          className={`${styles.statCard} ${styles.cardTotal} ${activeTab === 'all' ? styles.statCardActive : ''}`}
          onClick={() => handleTabChange('all')}
        >
          <div className={styles.statHeader}>
            <div className={styles.statIconWrap} style={{ background: '#ffffff', color: '#475569', border: '1px solid #e2e8f0' }}>
              <FileSignature size={18} />
            </div>
            <span className={styles.statBadge} style={{ background: '#e2e8f0', color: '#334155' }}>
              Catalog
            </span>
          </div>
          <div className={styles.statFooter}>
            <span className={styles.statTitle}>Total Issued</span>
            <span className={styles.statValue}>{stats.total}</span>
          </div>
        </div>

        {/* Appointment Letters */}
        <div
          className={`${styles.statCard} ${styles.cardAppt} ${activeTab === 'appointment-letter' ? styles.statCardActive : ''}`}
          onClick={() => handleTabChange('appointment-letter')}
        >
          <div className={styles.statHeader}>
            <div className={styles.statIconWrap} style={{ background: '#ffffff', color: '#2563eb', border: '1px solid #bfdbfe' }}>
              <FileCheck size={18} />
            </div>
            <span className={styles.statBadge} style={{ background: '#dbeafe', color: '#1e40af' }}>
              APPT
            </span>
          </div>
          <div className={styles.statFooter}>
            <span className={styles.statTitle}>Appointment</span>
            <span className={styles.statValue}>{stats.appointment}</span>
          </div>
        </div>

        {/* Joining Letters */}
        <div
          className={`${styles.statCard} ${styles.cardJoin} ${activeTab === 'joining-letter' ? styles.statCardActive : ''}`}
          onClick={() => handleTabChange('joining-letter')}
        >
          <div className={styles.statHeader}>
            <div className={styles.statIconWrap} style={{ background: '#ffffff', color: '#16a34a', border: '1px solid #bbf7d0' }}>
              <UserCheck size={18} />
            </div>
            <span className={styles.statBadge} style={{ background: '#dcfce7', color: '#15803d' }}>
              JOIN
            </span>
          </div>
          <div className={styles.statFooter}>
            <span className={styles.statTitle}>Joining Letters</span>
            <span className={styles.statValue}>{stats.joining}</span>
          </div>
        </div>

        {/* Experience Letters */}
        <div
          className={`${styles.statCard} ${styles.cardExp} ${activeTab === 'experience-letter' ? styles.statCardActive : ''}`}
          onClick={() => handleTabChange('experience-letter')}
        >
          <div className={styles.statHeader}>
            <div className={styles.statIconWrap} style={{ background: '#ffffff', color: '#9333ea', border: '1px solid #e9d5ff' }}>
              <Award size={18} />
            </div>
            <span className={styles.statBadge} style={{ background: '#f3e8ff', color: '#7e22ce' }}>
              EXP
            </span>
          </div>
          <div className={styles.statFooter}>
            <span className={styles.statTitle}>Experience Letters</span>
            <span className={styles.statValue}>{stats.experience}</span>
          </div>
        </div>

        {/* Full & Final Settlement */}
        <div
          className={`${styles.statCard} ${styles.cardFnf} ${activeTab === 'full-final-letter' ? styles.statCardActive : ''}`}
          onClick={() => handleTabChange('full-final-letter')}
        >
          <div className={styles.statHeader}>
            <div className={styles.statIconWrap} style={{ background: '#ffffff', color: '#ea580c', border: '1px solid #fed7aa' }}>
              <HeartHandshake size={18} />
            </div>
            <span className={styles.statBadge} style={{ background: '#ffedd5', color: '#c2410c' }}>
              FNF
            </span>
          </div>
          <div className={styles.statFooter}>
            <span className={styles.statTitle}>Full & Final</span>
            <span className={styles.statValue}>{stats.fullFinal}</span>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className={styles.tabsContainer}>
        <button
          type="button"
          className={`${styles.tabBtn} ${activeTab === 'all' ? styles.tabBtnActive : ''}`}
          onClick={() => handleTabChange('all')}
        >
          <span>All Letters</span>
          <span className={styles.tabCount}>{stats.total}</span>
        </button>

        {LETTER_TYPES.map((type) => {
          const count =
            type.id === 'appointment-letter'
              ? stats.appointment
              : type.id === 'joining-letter'
              ? stats.joining
              : type.id === 'experience-letter'
              ? stats.experience
              : stats.fullFinal;

          return (
            <button
              key={type.id}
              type="button"
              className={`${styles.tabBtn} ${activeTab === type.id ? styles.tabBtnActive : ''}`}
              onClick={() => handleTabChange(type.id)}
            >
              {getTypeIcon(type.id, 15)}
              <span>{type.name}</span>
              <span className={styles.tabCount}>{count}</span>
            </button>
          );
        })}
      </div>

      {/* Filters Toolbar */}
      <div className={styles.toolbarCard}>
        <div className={styles.toolbarLeft}>
          <div className={styles.searchWrap}>
            <Search size={15} className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search by Employee, Code, Ref No. or Designation..."
              className={styles.searchInput}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <select
            className={styles.selectFilter}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            {LETTER_STATUSES.map((st) => (
              <option key={st} value={st}>
                Status: {st}
              </option>
            ))}
          </select>

          <select
            className={styles.selectFilter}
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
          >
            {departmentsList.map((dept) => (
              <option key={dept} value={dept}>
                Dept: {dept}
              </option>
            ))}
          </select>

          {(searchTerm || statusFilter !== 'All' || deptFilter !== 'All') && (
            <button
              type="button"
              className={styles.resetBtn}
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('All');
                setDeptFilter('All');
              }}
            >
              Reset Filters
            </button>
          )}
        </div>

        <div className={styles.toolbarRight}>
          <span className={styles.countLabel}>
            Showing {filteredLetters.length} of {letters.length} letters
          </span>
        </div>
      </div>

      {/* Letters Data Table */}
      <div className={styles.tableCard}>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Reference No & Date</th>
                <th>Employee Details</th>
                <th>Letter Type</th>
                <th>Authorized Signatory</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredLetters.length > 0 ? (
                filteredLetters.map((letter) => {
                  const typeObj = LETTER_TYPES.find((t) => t.id === letter.letterType);
                  return (
                    <tr key={letter.id}>
                      {/* Ref No & Date */}
                      <td>
                        <div className={styles.refNoCell}>
                          <span className={styles.refNo}>{letter.refNo}</span>
                          <span className={styles.issueDate}>Issued: {letter.issueDate}</span>
                        </div>
                      </td>

                      {/* Employee Details */}
                      <td>
                        <div className={styles.empCell}>
                          <div className={styles.empAvatar}>
                            {letter.employeeName
                              .split(' ')
                              .map((n) => n[0])
                              .join('')
                              .toUpperCase()}
                          </div>
                          <div className={styles.empInfo}>
                            <span className={styles.empName}>{letter.employeeName}</span>
                            <span className={styles.empMeta}>
                              {letter.employeeCode} • {letter.designation} ({letter.department})
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Letter Type */}
                      <td>
                        <span
                          className={styles.letterTypeBadge}
                          style={{
                            background: typeObj?.bgColor || '#f1f5f9',
                            color: typeObj?.color || '#334155',
                            borderColor: typeObj?.borderColor || '#cbd5e1'
                          }}
                        >
                          {getTypeIcon(letter.letterType, 13)}
                          <span>{typeObj?.name || letter.letterType}</span>
                        </span>
                      </td>

                      {/* Signatory */}
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontWeight: 600, fontSize: '13px' }}>{letter.signatoryName}</span>
                          <span style={{ fontSize: '11px', color: '#64748b' }}>{letter.signatoryDesignation}</span>
                        </div>
                      </td>

                      {/* Status */}
                      <td>
                        <span className={`${styles.statusBadge} ${styles[`status${letter.status}`] || ''}`}>
                          <span className={styles.statusDot} />
                          <span>{letter.status}</span>
                        </span>
                      </td>

                      {/* Actions */}
                      <td>
                        <div className={styles.actionsCell} style={{ justifyContent: 'flex-end' }}>
                          <button
                            type="button"
                            className={styles.actionIconBtn}
                            onClick={() => handleOpenPreview(letter)}
                            title="Preview Letterhead Document"
                          >
                            <Eye size={15} />
                          </button>

                          <button
                            type="button"
                            className={styles.actionIconBtn}
                            onClick={() => {
                              setSelectedLetter(letter);
                              handlePrint(letter);
                            }}
                            title="Print / Save PDF"
                          >
                            <Printer size={15} />
                          </button>

                          <button
                            type="button"
                            className={styles.actionIconBtn}
                            onClick={() => handleSendEmail(letter)}
                            title="Send Letter to Employee Email"
                          >
                            <Mail size={15} />
                          </button>

                          <button
                            type="button"
                            className={styles.actionIconBtn}
                            onClick={() => handleOpenEdit(letter)}
                            title="Edit Details"
                          >
                            <Edit3 size={15} />
                          </button>

                          <button
                            type="button"
                            className={`${styles.actionIconBtn} ${styles.actionIconBtnDanger}`}
                            onClick={() => handleDeleteLetter(letter.id)}
                            title="Delete Letter"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6}>
                    <div className={styles.emptyState}>
                      <div className={styles.emptyIcon}>
                        <FileSignature size={24} />
                      </div>
                      <h4 className={styles.emptyTitle}>No letters found</h4>
                      <p className={styles.emptyDesc}>
                        No letters match your current filters. Try resetting the filters or generate a new letter for an employee.
                      </p>
                      <button
                        type="button"
                        className={styles.primaryBtn}
                        onClick={() => handleOpenGenerate()}
                        style={{ marginTop: '8px' }}
                      >
                        <Plus size={15} />
                        <span>Issue First Letter</span>
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================= MODAL 1: GENERATE NEW LETTER ================= */}
      {isGenerateModalOpen && (
        <div className={styles.backdrop} onClick={() => setIsGenerateModalOpen(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div className={styles.modalTitleWrap}>
                <div className={styles.modalHeaderIcon}>
                  <FileSignature size={20} />
                </div>
                <div>
                  <h3 className={styles.modalTitle}>Generate New Letter</h3>
                  <p className={styles.modalSubtitle}>
                    Issue an official document using configured templates from Template Setup.
                  </p>
                </div>
              </div>
              <button
                type="button"
                className={styles.closeBtn}
                onClick={() => setIsGenerateModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <div className={styles.modalBody}>
              {/* Step 1: Select Letter Type */}
              <div className={styles.formGroup}>
                <label htmlFor="letterTypeSelect" className={styles.label}>
                  Select Letter Type <span className={styles.required}>*</span>
                </label>
                <select
                  id="letterTypeSelect"
                  className={styles.select}
                  value={formData.letterType}
                  onChange={(e) => setFormData({ ...formData, letterType: e.target.value })}
                >
                  {LETTER_TYPES.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.name} — {type.description}
                    </option>
                  ))}
                </select>
              </div>

              {/* Step 2: Select Employee */}
              <div className={styles.formGroup}>
                <label className={styles.label}>
                  Select Employee <span className={styles.required}>*</span>
                </label>
                <select
                  className={styles.select}
                  value={formData.employeeId}
                  onChange={(e) => handleEmployeeSelect(e.target.value)}
                >
                  <option value="">-- Choose registered employee to auto-fill --</option>
                  {mockEmployees.map((emp) => (
                    <option key={emp.id || emp.employeeCode} value={emp.id || emp.employeeCode}>
                      {emp.name} ({emp.employeeCode || emp.employeeId}) — {emp.designation}
                    </option>
                  ))}
                </select>
              </div>

              {/* Step 3: Fields Grid */}
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Employee Name</label>
                  <input
                    type="text"
                    className={styles.input}
                    value={formData.employeeName}
                    onChange={(e) => setFormData({ ...formData, employeeName: e.target.value })}
                    placeholder="e.g. Rahul Kumar"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Employee Code</label>
                  <input
                    type="text"
                    className={styles.input}
                    value={formData.employeeCode}
                    onChange={(e) => setFormData({ ...formData, employeeCode: e.target.value })}
                    placeholder="e.g. EMP001"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Designation</label>
                  <input
                    type="text"
                    className={styles.input}
                    value={formData.designation}
                    onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                    placeholder="e.g. Security Guard"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Department</label>
                  <input
                    type="text"
                    className={styles.input}
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    placeholder="e.g. Security / Operations"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Site / Work Location</label>
                  <input
                    type="text"
                    className={styles.input}
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="e.g. Sector 18, Gurugram"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Issue Date</label>
                  <input
                    type="date"
                    className={styles.input}
                    value={formData.issueDate}
                    onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
                  />
                </div>

                {/* Conditional Fields depending on Letter Type */}
                {formData.letterType === 'appointment-letter' && (
                  <>
                    <div className={styles.formGroup}>
                      <label className={styles.label}>Annual CTC</label>
                      <input
                        type="text"
                        className={styles.input}
                        value={formData.ctc}
                        onChange={(e) => setFormData({ ...formData, ctc: e.target.value })}
                        placeholder="₹3,60,000"
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label className={styles.label}>Monthly Gross Salary</label>
                      <input
                        type="text"
                        className={styles.input}
                        value={formData.salary}
                        onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                        placeholder="₹30,000"
                      />
                    </div>
                  </>
                )}

                {(formData.letterType === 'appointment-letter' || formData.letterType === 'joining-letter') && (
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Joining Date</label>
                    <input
                      type="date"
                      className={styles.input}
                      value={formData.joiningDate}
                      onChange={(e) => setFormData({ ...formData, joiningDate: e.target.value })}
                    />
                  </div>
                )}

                {(formData.letterType === 'experience-letter' || formData.letterType === 'full-final-letter') && (
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Last Working Date</label>
                    <input
                      type="date"
                      className={styles.input}
                      value={formData.lastWorkingDate}
                      onChange={(e) => setFormData({ ...formData, lastWorkingDate: e.target.value })}
                    />
                  </div>
                )}

                {formData.letterType === 'full-final-letter' && (
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Net Settlement Amount</label>
                    <input
                      type="text"
                      className={styles.input}
                      value={formData.settlementAmount}
                      onChange={(e) => setFormData({ ...formData, settlementAmount: e.target.value })}
                      placeholder="₹35,000"
                    />
                  </div>
                )}

                <div className={styles.formGroup}>
                  <label className={styles.label}>Authorized Signatory</label>
                  <input
                    type="text"
                    className={styles.input}
                    value={formData.signatoryName}
                    onChange={(e) => setFormData({ ...formData, signatoryName: e.target.value })}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Signatory Designation</label>
                  <input
                    type="text"
                    className={styles.input}
                    value={formData.signatoryDesignation}
                    onChange={(e) => setFormData({ ...formData, signatoryDesignation: e.target.value })}
                  />
                </div>
              </div>

              {/* Live Preview Toggle */}
              <div>
                <button
                  type="button"
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#2563eb',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: 0
                  }}
                  onClick={() => setShowLivePreview(!showLivePreview)}
                >
                  <Eye size={14} />
                  <span>{showLivePreview ? 'Hide Letter Preview' : 'Show Live Letter Preview'}</span>
                </button>

                {showLivePreview && (
                  <div
                    style={{
                      marginTop: '10px',
                      padding: '14px',
                      background: '#f8fafc',
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0',
                      fontSize: '12px',
                      whiteSpace: 'pre-wrap',
                      maxHeight: '180px',
                      overflowY: 'auto',
                      color: '#334155',
                      lineHeight: 1.5
                    }}
                  >
                    {renderLetterBody(
                      getTemplateConfig(formData.letterType)?.content || '',
                      {
                        name: formData.employeeName || 'Rahul Kumar',
                        employeeCode: formData.employeeCode || 'EMP001',
                        designation: formData.designation || 'Security Officer',
                        department: formData.department || 'Operations',
                        siteLocation: formData.location || 'Gurugram'
                      },
                      activeCompany,
                      {
                        issueDate: formData.issueDate,
                        joiningDate: formData.joiningDate,
                        lastWorkingDate: formData.lastWorkingDate,
                        salary: formData.salary,
                        ctc: formData.ctc,
                        settlementAmount: formData.settlementAmount,
                        signatoryName: formData.signatoryName,
                        signatoryDesignation: formData.signatoryDesignation
                      }
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button
                type="button"
                className={styles.cancelBtn}
                onClick={() => setIsGenerateModalOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className={styles.cancelBtn}
                onClick={() => handleSaveGenerate(true)}
              >
                Save as Draft
              </button>
              <button
                type="button"
                className={styles.primaryBtn}
                onClick={() => handleSaveGenerate(false)}
              >
                <FileSignature size={15} />
                <span>Issue & Generate Letter</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL 2: OFFICIAL LETTERHEAD PREVIEW ================= */}
      {isPreviewModalOpen && selectedLetter && (
        <div className={styles.backdrop} onClick={() => setIsPreviewModalOpen(false)}>
          <div className={`${styles.modal} ${styles.previewModal}`} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div className={styles.modalTitleWrap}>
                <div className={styles.modalHeaderIcon}>
                  <FileText size={20} />
                </div>
                <div>
                  <h3 className={styles.modalTitle}>
                    {LETTER_TYPES.find((t) => t.id === selectedLetter.letterType)?.name || 'Letterhead Document'}
                  </h3>
                  <p className={styles.modalSubtitle}>
                    {selectedLetter.refNo} • {selectedLetter.employeeName} ({selectedLetter.employeeCode})
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  type="button"
                  className={styles.cancelBtn}
                  style={{ padding: '6px 12px', fontSize: '12px' }}
                  onClick={() => handlePrint(selectedLetter)}
                  title="Print official letterhead copy"
                >
                  <Printer size={14} style={{ marginRight: '5px' }} />
                  Print
                </button>

                <button
                  type="button"
                  className={styles.cancelBtn}
                  style={{ padding: '6px 12px', fontSize: '12px' }}
                  onClick={() => handleSendEmail(selectedLetter)}
                  title="Send to employee"
                >
                  <Mail size={14} style={{ marginRight: '5px' }} />
                  Email
                </button>

                <button
                  type="button"
                  className={styles.closeBtn}
                  onClick={() => setIsPreviewModalOpen(false)}
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className={styles.modalBody} style={{ background: '#f1f5f9', padding: '24px' }}>
              {/* Document Sheet */}
              <div className={styles.documentSheet} id="letter-document-sheet">
                {/* Letterhead */}
                <div className={styles.docLetterhead}>
                  <div className={styles.docCompanyDetails}>
                    <h2 className={styles.docCompanyName}>
                      {activeCompany?.name || 'RR Security & Allied Services Pvt. Ltd.'}
                    </h2>
                    <p className={styles.docCompanyMeta}>
                      {activeCompany?.address || 'Plot 45, Sector 18, Gurugram, Haryana - 122008'}
                    </p>
                    <p className={styles.docCompanyMeta}>
                      Email: {activeCompany?.email || 'admin@rrsecurity.com'} | Tel: {activeCompany?.phone || '+91 98765 43210'}
                    </p>
                    {activeCompany?.gstin && (
                      <p className={styles.docCompanyMeta}>
                        GSTIN: {activeCompany.gstin} | PAN: {activeCompany.pan || 'AAACR1234F'}
                      </p>
                    )}
                  </div>
                  {activeCompany?.logo && (
                    <img src={activeCompany.logo} alt="Company Logo" className={styles.docLogo} />
                  )}
                </div>

                {/* Header Banner */}
                <div className={styles.docHeaderBanner}>
                  <span className={styles.docHeaderTitle}>
                    {LETTER_TYPES.find((t) => t.id === selectedLetter.letterType)?.name.toUpperCase()}
                  </span>
                </div>

                {/* Reference and Date Row */}
                <div className={styles.docMetaRow}>
                  <div>
                    <strong>Ref No: </strong>
                    <span>{selectedLetter.refNo}</span>
                  </div>
                  <div>
                    <strong>Date: </strong>
                    <span>{selectedLetter.issueDate}</span>
                  </div>
                </div>

                {/* Addressee Info */}
                <div style={{ marginBottom: '20px', fontSize: '13px' }}>
                  <p style={{ margin: '0 0 2px', fontWeight: 700 }}>To,</p>
                  <p style={{ margin: '0 0 2px', fontWeight: 700 }}>{selectedLetter.employeeName}</p>
                  <p style={{ margin: '0 0 2px' }}>Employee Code: {selectedLetter.employeeCode}</p>
                  <p style={{ margin: '0 0 2px' }}>Designation: {selectedLetter.designation}</p>
                  <p style={{ margin: '0 0 2px' }}>Department: {selectedLetter.department}</p>
                  <p style={{ margin: '0' }}>Location: {selectedLetter.location}</p>
                </div>

                {/* Subject */}
                {selectedLetter.subject && (
                  <div className={styles.docSubject}>
                    Subject: {selectedLetter.subject}
                  </div>
                )}

                {/* Main Body */}
                <div className={styles.docBodyContent}>
                  {renderPreviewContent(selectedLetter)}
                </div>

                {/* Signatory Section */}
                <div className={styles.docSignatorySection}>
                  <div className={styles.docSignatoryBlock}>
                    <div className={styles.docSealSim}>Official Seal</div>
                    <span style={{ fontWeight: 700, color: '#0f172a' }}>{selectedLetter.signatoryName}</span>
                    <span style={{ fontSize: '11px', color: '#64748b' }}>{selectedLetter.signatoryDesignation}</span>
                    <span style={{ fontSize: '11px', color: '#64748b' }}>
                      {activeCompany?.name || 'RR Security & Allied Services Pvt. Ltd.'}
                    </span>
                  </div>

                  <div style={{ textAlign: 'right', fontSize: '11px', color: '#64748b' }}>
                    <p style={{ margin: '0 0 40px', fontWeight: 600 }}>Employee Acceptance Signature</p>
                    <p style={{ margin: 0, borderTop: '1px solid #cbd5e1', paddingTop: '4px' }}>
                      Signature & Date
                    </p>
                  </div>
                </div>

                {/* Disclaimer */}
                <div className={styles.docFooterDisclaimer}>
                  This is an official document issued by NovaSpark HRMS on behalf of {activeCompany?.name || 'RR Security Services'}.
                </div>
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button
                type="button"
                className={styles.cancelBtn}
                onClick={() => setIsPreviewModalOpen(false)}
              >
                Close Preview
              </button>
              <button
                type="button"
                className={styles.primaryBtn}
                onClick={() => handlePrint(selectedLetter)}
              >
                <Printer size={15} />
                <span>Print Document</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL 3: EDIT LETTER ================= */}
      {isEditModalOpen && selectedLetter && (
        <div className={styles.backdrop} onClick={() => setIsEditModalOpen(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div className={styles.modalTitleWrap}>
                <div className={styles.modalHeaderIcon}>
                  <Edit3 size={20} />
                </div>
                <div>
                  <h3 className={styles.modalTitle}>Edit Letter Details</h3>
                  <p className={styles.modalSubtitle}>{selectedLetter.refNo}</p>
                </div>
              </div>
              <button
                type="button"
                className={styles.closeBtn}
                onClick={() => setIsEditModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <div className={styles.modalBody}>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Employee Name</label>
                  <input
                    type="text"
                    className={styles.input}
                    value={formData.employeeName}
                    onChange={(e) => setFormData({ ...formData, employeeName: e.target.value })}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Employee Code</label>
                  <input
                    type="text"
                    className={styles.input}
                    value={formData.employeeCode}
                    onChange={(e) => setFormData({ ...formData, employeeCode: e.target.value })}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Designation</label>
                  <input
                    type="text"
                    className={styles.input}
                    value={formData.designation}
                    onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Department</label>
                  <input
                    type="text"
                    className={styles.input}
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Issue Date</label>
                  <input
                    type="date"
                    className={styles.input}
                    value={formData.issueDate}
                    onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Signatory Name</label>
                  <input
                    type="text"
                    className={styles.input}
                    value={formData.signatoryName}
                    onChange={(e) => setFormData({ ...formData, signatoryName: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button
                type="button"
                className={styles.cancelBtn}
                onClick={() => setIsEditModalOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className={styles.primaryBtn}
                onClick={handleSaveEdit}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  </AdminLayout>
  );
}

export default LetterManagement;
