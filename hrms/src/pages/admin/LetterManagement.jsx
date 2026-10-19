import React, { useState, useMemo, useEffect, useCallback } from 'react';
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
  FileText,
  Loader2,
  RefreshCw
} from 'lucide-react';
import styles from './LetterManagement.module.css';
import AdminLayout from '../../components/layout/AdminLayout';
import { useCompany } from '../../context/CompanyContext';
import letterService from '../../services/letterService';
import { employeeService } from '../../services/employeeService';
import { authService } from '../../services/authService';
import { generateLetterPdf } from '../../utils/letterPdfUtil';
import {
  LETTER_TYPES,
  LETTER_STATUSES,
  getTemplateConfig,
  renderLetterBody,
  formatDateDisplay
} from '../../data/letterManagementData';

function LetterManagement() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { activeCompany } = useCompany();
  const companyId = activeCompany?.companyId || activeCompany?.id || 'RRS8392014SEC';

  const activeCompId = activeCompany?.companyId || activeCompany?.id || 'RRS8392014SEC';
  const activeCompName = activeCompany?.name || 'RR Security & Facilities';
  const rawAddr = (activeCompany?.address || '').trim();
  const city = (activeCompany?.city || '').trim();
  const state = (activeCompany?.state || '').trim();
  const pinCode = (activeCompany?.pinCode || '').trim();

  let formattedAddress = rawAddr;
  if (!formattedAddress) {
    formattedAddress = [city, state, pinCode].filter(Boolean).join(', ');
  } else {
    const lowerAddr = rawAddr.toLowerCase();
    if (city && !lowerAddr.includes(city.toLowerCase())) {
      formattedAddress += `, ${city}`;
    }
    if (state && !lowerAddr.includes(state.toLowerCase())) {
      formattedAddress += `, ${state}`;
    }
    if (pinCode && !formattedAddress.includes(pinCode)) {
      formattedAddress += ` - ${pinCode}`;
    }
  }
  const activeCompAddress = formattedAddress || 'Plot 45, Sector 18, Gurugram, Haryana - 122008';
  const activeCompEmail = activeCompany?.email || 'admin@rrsecurity.com';
  const activeCompPhone = activeCompany?.phone || '+91 98765 43210';
  const activeCompGstin = activeCompany?.gstin || '';
  const activeCompPan = activeCompany?.pan || '';
  const activeCompLogo =
    activeCompany?.logo ||
    (typeof window !== 'undefined'
      ? (activeCompany?.companyId ? localStorage.getItem(`novaspark_company_logo_${activeCompany.companyId}`) : null) ||
        (activeCompany?.id ? localStorage.getItem(`novaspark_company_logo_${activeCompany.id}`) : null) ||
        localStorage.getItem(`novaspark_company_logo_${activeCompId}`) ||
        (activeCompany?.isDefault ? localStorage.getItem('novaspark_company_logo_preview') : null)
      : null) ||
    null;
  const activeCompInitials = (activeCompName.split(' ').map(w => w[0]).join('').substring(0, 3) || 'RRS').toUpperCase();

  const getLetterWatermark = (letterType, headerTitle) => {
    if (letterType === 'experience-letter' || headerTitle?.toUpperCase().includes('EXPERIENCE')) {
      return 'EXPERIENCE';
    }
    if (letterType === 'appointment-letter' || headerTitle?.toUpperCase().includes('APPOINTMENT')) {
      return 'APPOINTMENT';
    }
    if (letterType === 'joining-letter' || headerTitle?.toUpperCase().includes('JOINING')) {
      return 'JOINING';
    }
    if (letterType === 'full-final-letter' || headerTitle?.toUpperCase().includes('FINAL') || headerTitle?.toUpperCase().includes('SETTLEMENT')) {
      return 'F&F CLEARANCE';
    }
    return headerTitle?.replace(/LETTER|CERTIFICATE|STATEMENT/gi, '').trim() || 'OFFICIAL';
  };

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

  // State for letters catalog loaded dynamically from MongoDB API
  const [letters, setLetters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Real workforce registered employees from database API
  const [employees, setEmployees] = useState([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);

  // Letter templates from database / template setup
  const [templates, setTemplates] = useState({});

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
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Fetch letters from MongoDB API
  const loadLettersData = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const res = await letterService.getLetters(companyId, {
        type: activeTab,
        status: statusFilter,
        department: deptFilter,
        search: searchTerm
      });
      if (res && Array.isArray(res.letters)) {
        setLetters(res.letters);
      } else {
        setLetters([]);
      }
    } catch (err) {
      console.error('API fetch letters error:', err);
      setLetters([]);
      showToast(err.message || 'Failed to fetch letter records from server');
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, [companyId, activeTab, statusFilter, deptFilter, searchTerm]);

  // Fetch templates from MongoDB API
  const loadTemplates = useCallback(async () => {
    try {
      const tpls = await letterService.getLetterTemplates(companyId);
      if (tpls) {
        setTemplates(tpls);
      }
    } catch (err) {
      console.warn('Could not load DB templates:', err);
    }
  }, [companyId]);

  // Fetch registered employees from MongoDB API
  const loadEmployees = useCallback(async () => {
    setLoadingEmployees(true);
    try {
      const activeCId = activeCompany?.companyId || activeCompany?.id || companyId || 'RRS8392014SEC';
      const empList = await employeeService.getEmployees(activeCId);
      if (Array.isArray(empList) && empList.length > 0) {
        setEmployees(empList);
      } else {
        // Fallback directly to API if needed
        const token = authService.getToken() || localStorage.getItem('novaspark_auth_token') || localStorage.getItem('token') || '';
        const res = await fetch(`${import.meta.env.VITE_API_URL}/employees`, {
          cache: 'no-cache',
          headers: {
            'Authorization': `Bearer ${token}`,
            'x-company-id': activeCId
          }
        });
        if (res.ok) {
          const data = await res.json();
          if (data && data.success && Array.isArray(data.employees)) {
            setEmployees(data.employees);
          } else {
            setEmployees(empList || []);
          }
        } else {
          setEmployees(empList || []);
        }
      }
    } catch (err) {
      console.error('Error fetching registered employees:', err);
      setEmployees([]);
    } finally {
      setLoadingEmployees(false);
    }
  }, [activeCompany, companyId]);

  // Initial data loading - purge any legacy mock localStorage cache
  useEffect(() => {
    try {
      localStorage.removeItem('novaspark_issued_letters');
    } catch (e) {}
    loadLettersData();
    loadTemplates();
    loadEmployees();
  }, [loadLettersData, loadTemplates, loadEmployees]);

  // Available templates compiled from MongoDB templates, localStorage template configs & defaults
  const availableTemplatesList = useMemo(() => {
    return LETTER_TYPES.map((type) => {
      // 1. From MongoDB API templates
      const dbTpl = templates && templates[type.id];
      // 2. From localStorage
      let localTpl = null;
      if (type.templateKey) {
        try {
          const s = localStorage.getItem(type.templateKey);
          if (s) localTpl = JSON.parse(s);
        } catch (e) {}
      }
      // 3. Fallback to default
      const defaultTpl = getTemplateConfig(type.id) || {};

      const templateName = dbTpl?.templateName || localTpl?.templateName || defaultTpl?.templateName || type.name;
      const headerTitle = dbTpl?.headerTitle || localTpl?.headerTitle || defaultTpl?.headerTitle || type.name.toUpperCase();
      const subject = dbTpl?.subject || localTpl?.subject || defaultTpl?.subject || `Official Letter - {{employeeName}}`;
      const content = dbTpl?.content || localTpl?.content || defaultTpl?.content || '';
      const status = dbTpl?.status || localTpl?.status || defaultTpl?.status || 'Active';

      return {
        id: type.id,
        letterType: type.id,
        typeName: type.name,
        code: type.code,
        templateName,
        headerTitle,
        subject,
        content,
        status,
        color: type.color,
        bgColor: type.bgColor,
        borderColor: type.borderColor,
        description: type.description
      };
    });
  }, [templates]);

  // Helper to get active template for a given letter type
  const getActiveLetterTemplate = useCallback((typeId) => {
    const found = availableTemplatesList.find((t) => t.id === typeId);
    if (found) return found;
    return getTemplateConfig(typeId);
  }, [availableTemplatesList]);

  // Form State for Generating / Editing Letter
  const initialFormState = {
    templateId: 'appointment-letter',
    letterType: 'appointment-letter',
    templateName: 'Standard Executive Appointment Letter',
    headerTitle: 'APPOINTMENT LETTER',
    subject: '',
    content: '',
    employeeId: '',
    employeeName: '',
    employeeCode: '',
    designation: '',
    department: '',
    location: '',
    issueDate: new Date().toISOString().split('T')[0],
    joiningDate: new Date().toISOString().split('T')[0],
    lastWorkingDate: '',
    ctc: '',
    salary: '',
    settlementAmount: '',
    signatoryName: activeCompany?.signatoryName || 'Amitabh Sharma',
    signatoryDesignation: activeCompany?.signatoryDesignation || 'Director - Human Resources',
    customNotes: ''
  };

  const [formData, setFormData] = useState(initialFormState);
  const [showLivePreview, setShowLivePreview] = useState(true);

  // When selecting an employee from the dropdown, auto-fill fields from dynamic DB employee
  const handleEmployeeSelect = (empId) => {
    const emp = employees.find((e) => (
      e.id === empId ||
      e.employeeId === empId ||
      e._id === empId ||
      e.employeeCode === empId
    ));
    if (!emp) {
      setFormData((prev) => ({
        ...prev,
        employeeId: '',
        employeeName: '',
        employeeCode: '',
        designation: '',
        department: '',
        location: '',
        salary: '',
        ctc: ''
      }));
      return;
    }

    const gross = emp.grossSalary ? Number(emp.grossSalary) : (emp.salary ? Number(emp.salary) : 0);
    const ctcAnnual = gross > 0 ? gross * 12 : 0;

    const empName = emp.name || `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || '';
    const empCode = emp.employeeCode || emp.employeeId || emp.id || '';

    setFormData((prev) => ({
      ...prev,
      employeeId: emp.id || emp.employeeId || emp._id || empCode,
      employeeName: empName,
      employeeCode: empCode,
      designation: emp.designation || '',
      department: emp.department || '',
      location: emp.siteLocation || emp.joiningLocation || emp.workLocation || emp.location || '',
      joiningDate: emp.joiningDate || prev.joiningDate,
      salary: gross > 0 ? `₹${gross.toLocaleString('en-IN')}` : prev.salary,
      ctc: ctcAnnual > 0 ? `₹${ctcAnnual.toLocaleString('en-IN')}` : prev.ctc
    }));
  };

  // Open Generate Modal
  const handleOpenGenerate = (typePreset = null) => {
    const targetTypeId = typePreset || (activeTab !== 'all' ? activeTab : 'appointment-letter');
    const tpl = availableTemplatesList.find((t) => t.id === targetTypeId) || availableTemplatesList[0];

    // Ensure employees are fetched/fresh when opening modal
    if (!employees || employees.length === 0) {
      loadEmployees();
    }

    setFormData({
      ...initialFormState,
      templateId: tpl?.id || 'appointment-letter',
      letterType: tpl?.letterType || 'appointment-letter',
      templateName: tpl?.templateName || 'Standard Executive Appointment Letter',
      headerTitle: tpl?.headerTitle || 'APPOINTMENT LETTER',
      subject: tpl?.subject || '',
      content: tpl?.content || '',
      signatoryName: activeCompany?.signatoryName || 'Amitabh Sharma',
      signatoryDesignation: activeCompany?.signatoryDesignation || 'Director - Human Resources'
    });
    setShowLivePreview(true);
    setIsGenerateModalOpen(true);
  };

  // Switch template in Generate Modal
  const handleTemplateChange = (templateId) => {
    const tpl = availableTemplatesList.find((t) => t.id === templateId);
    if (!tpl) return;
    setFormData((prev) => ({
      ...prev,
      templateId: tpl.id,
      letterType: tpl.letterType,
      templateName: tpl.templateName,
      headerTitle: tpl.headerTitle,
      subject: tpl.subject,
      content: tpl.content
    }));
  };

  // Reset template content to Template Setup default
  const handleResetTemplateContent = () => {
    const tpl = availableTemplatesList.find((t) => t.id === formData.templateId);
    if (tpl) {
      setFormData((prev) => ({
        ...prev,
        content: tpl.content,
        headerTitle: tpl.headerTitle,
        subject: tpl.subject
      }));
      showToast('Letter body reset to configured template content.');
    }
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
      templateId: letter.letterType,
      letterType: letter.letterType,
      templateName: letter.templateName || '',
      headerTitle: letter.headerTitle || '',
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
      signatoryName: letter.signatoryName || '',
      signatoryDesignation: letter.signatoryDesignation || '',
      status: letter.status || 'Issued',
      content: letter.content || '',
      customNotes: ''
    });
    setIsEditModalOpen(true);
  };

  // Generate / Save New Letter to MongoDB API
  const handleSaveGenerate = async (isDraft = false) => {
    if (!formData.employeeName || !formData.designation) {
      alert('Please fill employee name and designation before issuing letter.');
      return;
    }

    const typeConfig = LETTER_TYPES.find((t) => t.id === formData.letterType);
    const code = typeConfig ? typeConfig.code : 'LET';
    const randomSeq = String(Math.floor(1000 + Math.random() * 9000));
    const refNo = `NS/${code}/${new Date().getFullYear()}/${randomSeq}`;

    // Generate letter body content using the selected template content and dynamic employee details
    const rawContent = formData.content || getActiveLetterTemplate(formData.letterType)?.content || '';
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

    const subject = formData.subject
      ? renderLetterBody(formData.subject, { name: formData.employeeName, employeeCode: formData.employeeCode, designation: formData.designation }, activeCompany, formData)
      : `${formData.templateName || typeConfig?.name || 'Letter'} - ${formData.employeeName}`;

    const payload = {
      refNo,
      letterType: formData.letterType,
      templateName: formData.templateName,
      employeeId: formData.employeeId || formData.employeeCode || 'custom',
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
      headerTitle: formData.headerTitle || typeConfig?.name?.toUpperCase() || 'OFFICIAL LETTER',
      content: generatedContent
    };

    setIsSubmitting(true);
    try {
      await letterService.createLetter(companyId, payload);
      await loadLettersData(true);
      setIsGenerateModalOpen(false);
      showToast(`✓ ${formData.templateName || typeConfig?.name || 'Letter'} ${isDraft ? 'saved as Draft' : 'issued & saved to database'}!`);
    } catch (err) {
      console.error('Error saving letter to database:', err);
      showToast(`Failed to save letter: ${err.message || 'API error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Save Edited Letter to MongoDB API
  const handleSaveEdit = async () => {
    if (!selectedLetter) return;
    const id = selectedLetter.letterId || selectedLetter._id || selectedLetter.id;
    const rawTemplate = getActiveLetterTemplate(formData.letterType)?.content || selectedLetter.content || '';
    const updatedContent = renderLetterBody(
      rawTemplate,
      {
        name: formData.employeeName,
        employeeCode: formData.employeeCode,
        designation: formData.designation,
        department: formData.department,
        siteLocation: formData.location,
        companyName: activeCompName
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

    const payload = {
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
      signatoryDesignation: formData.signatoryDesignation,
      status: formData.status || selectedLetter.status || 'Issued',
      content: updatedContent
    };

    setIsSubmitting(true);
    try {
      await letterService.updateLetter(companyId, id, payload);
      await loadLettersData(true);
      setIsEditModalOpen(false);
      showToast('✓ Letter details updated in database.');
    } catch (err) {
      console.error('Error updating letter:', err);
      showToast(`Failed to update letter: ${err.message || 'API error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Letter from MongoDB API
  const handleDeleteLetter = async (letter) => {
    const id = letter.letterId || letter._id || letter.id;
    if (window.confirm(`Are you sure you want to delete ${letter.refNo} for ${letter.employeeName}?`)) {
      try {
        await letterService.deleteLetter(companyId, id);
        await loadLettersData(true);
        showToast('✓ Letter deleted successfully from database.');
      } catch (err) {
        console.error('Error deleting letter:', err);
        showToast(`Failed to delete letter: ${err.message || 'API error'}`);
      }
    }
  };

  // Mark Letter as Sent / Email via API
  const handleSendEmail = async (letter) => {
    const id = letter.letterId || letter._id || letter.id;
    try {
      await letterService.updateLetter(companyId, id, { status: 'Sent' });
      await loadLettersData(true);
      showToast(`✓ Letter marked as Sent to ${letter.employeeName}.`);
    } catch (err) {
      console.error('Error sending letter email:', err);
      showToast(`Failed to update status: ${err.message || 'API error'}`);
    }
    if (selectedLetter && (selectedLetter.id === id || selectedLetter.letterId === id)) {
      setSelectedLetter({ ...selectedLetter, status: 'Sent' });
    }
  };

  // Download Letter as PDF
  const handleDownload = async (letter) => {
    const typeConfig = LETTER_TYPES.find((t) => t.id === letter.letterType);
    const title = letter.headerTitle || typeConfig?.name?.toUpperCase() || 'OFFICIAL LETTER';
    const content = renderPreviewContent(letter);

    await generateLetterPdf({
      title,
      company: {
        ...activeCompany,
        name: activeCompName,
        address: activeCompAddress,
        email: activeCompEmail,
        phone: activeCompPhone,
        gstin: activeCompGstin,
        pan: activeCompPan,
        signatoryName: letter.signatoryName || activeCompany?.signatoryName || 'Amitabh Sharma',
        signatoryDesignation: letter.signatoryDesignation || activeCompany?.signatoryDesignation || 'Director - Human Resources',
        logo: activeCompLogo || activeCompany?.logo
      },
      content,
      referenceNo: letter.refNo,
      employeeName: letter.employeeName,
      employeeCode: letter.employeeCode,
      letterType: letter.letterType,
      issueDate: letter.issueDate,
      mode: 'download'
    });

    if (letter.status === 'Draft') {
      const id = letter.letterId || letter._id || letter.id;
      try {
        await letterService.updateLetter(companyId, id, { status: 'Downloaded' });
        await loadLettersData(true);
      } catch (e) {}
    }
    showToast(`✓ Downloaded ${letter.refNo} as official PDF.`);
  };

  // Print Letter
  const handlePrint = async (letter) => {
    const typeConfig = LETTER_TYPES.find((t) => t.id === letter.letterType);
    const title = letter.headerTitle || typeConfig?.name?.toUpperCase() || 'OFFICIAL LETTER';
    const content = renderPreviewContent(letter);

    await generateLetterPdf({
      title,
      company: {
        ...activeCompany,
        name: activeCompName,
        address: activeCompAddress,
        email: activeCompEmail,
        phone: activeCompPhone,
        gstin: activeCompGstin,
        pan: activeCompPan,
        signatoryName: letter.signatoryName || activeCompany?.signatoryName || 'Amitabh Sharma',
        signatoryDesignation: letter.signatoryDesignation || activeCompany?.signatoryDesignation || 'Director - Human Resources',
        logo: activeCompLogo || activeCompany?.logo
      },
      content,
      referenceNo: letter.refNo,
      employeeName: letter.employeeName,
      employeeCode: letter.employeeCode,
      letterType: letter.letterType,
      issueDate: letter.issueDate,
      mode: 'print'
    });

    if (letter.status === 'Draft') {
      const id = letter.letterId || letter._id || letter.id;
      try {
        await letterService.updateLetter(companyId, id, { status: 'Downloaded' });
        await loadLettersData(true);
      } catch (e) {}
    }
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
    if (!letter) return '';
    let bodyText = letter.content || '';
    if (!bodyText || bodyText.includes('{{')) {
      const templateConfig = getActiveLetterTemplate(letter.letterType);
      bodyText = renderLetterBody(
        bodyText || templateConfig?.content || '',
        {
          name: letter.employeeName,
          employeeCode: letter.employeeCode,
          designation: letter.designation,
          department: letter.department,
          siteLocation: letter.location,
          companyName: activeCompName
        },
        activeCompany,
        {
          issueDate: letter.issueDate,
          joiningDate: letter.joiningDate,
          lastWorkingDate: letter.lastWorkingDate,
          salary: letter.salary,
          ctc: letter.ctc,
          settlementAmount: letter.settlementAmount,
          signatoryName: letter.signatoryName || activeCompany?.signatoryName,
          signatoryDesignation: letter.signatoryDesignation || activeCompany?.signatoryDesignation
        }
      );
    }
    // Clean up any remaining raw ISO date strings like "2026-10-17" into formatted "17 Oct 2026"
    bodyText = bodyText.replace(/\b(\d{4}-\d{2}-\d{2})\b/g, (match, dateStr) => {
      return formatDateDisplay(dateStr);
    });
    // Clean up empty gaps if relieving / last working date was omitted
    if (letter.issueDate) {
      const fallbackRelieveDate = formatDateDisplay(letter.lastWorkingDate) || formatDateDisplay(letter.issueDate);
      bodyText = bodyText.replace(/to\s+\./g, `to ${fallbackRelieveDate}.`);
      bodyText = bodyText.replace(/duties\s+on\s+after/g, `duties on ${fallbackRelieveDate} after`);
    }
    if (letter.location) {
      bodyText = bodyText.replace(/based\s+out\s+of\s+\./g, `based out of ${letter.location}.`);
    }
    return bodyText;
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
          <button
            type="button"
            className={styles.refreshBtn}
            onClick={() => loadLettersData()}
            title="Refresh letters from MongoDB database"
          >
            <RefreshCw size={13} className={loading ? styles.spinner : ''} style={{ marginRight: '5px' }} />
            Refresh
          </button>
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
              {loading ? (
                <tr>
                  <td colSpan={6}>
                    <div className={styles.loadingContainer}>
                      <Loader2 size={24} className={styles.spinner} />
                      <span>Loading issued letters from database...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredLetters.length > 0 ? (
                filteredLetters.map((letter) => {
                  const typeObj = LETTER_TYPES.find((t) => t.id === letter.letterType);
                  const letterKey = letter.letterId || letter._id || letter.id || letter.refNo;
                  return (
                    <tr key={letterKey}>
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
                            onClick={() => handleDownload(letter)}
                            title="Download Official PDF"
                          >
                            <Download size={15} />
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
                            onClick={() => handleDeleteLetter(letter)}
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
          <div className={`${styles.modal} ${styles.modalWide}`} onClick={(e) => e.stopPropagation()} style={{ maxWidth: '980px' }}>
            <div className={styles.modalHeader}>
              <div className={styles.modalTitleWrap}>
                <div className={styles.modalHeaderIcon}>
                  <FileSignature size={20} />
                </div>
                <div>
                  <h3 className={styles.modalTitle}>Generate New Letter</h3>
                  <p className={styles.modalSubtitle}>
                    Select an available template from Template Setup, choose an employee, and issue the document.
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
              {/* Section 1: Template Selection */}
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label htmlFor="letterTemplateSelect" className={styles.label} style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                    Select Letter Template <span className={styles.required}>*</span>
                  </label>
                  <span style={{ fontSize: '11px', fontWeight: 600, color: '#4f46e5', background: '#eef2ff', padding: '2px 8px', borderRadius: '12px' }}>
                    Template Setup Synced
                  </span>
                </div>

                <select
                  id="letterTemplateSelect"
                  className={styles.select}
                  style={{ fontWeight: 600, fontSize: '13.5px' }}
                  value={formData.templateId}
                  onChange={(e) => handleTemplateChange(e.target.value)}
                >
                  {availableTemplatesList.map((tpl) => (
                    <option key={tpl.id} value={tpl.id}>
                      {tpl.templateName} — [{tpl.headerTitle}] ({tpl.status})
                    </option>
                  ))}
                </select>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '8px', fontSize: '11.5px', color: '#64748b', flexWrap: 'wrap', gap: '6px' }}>
                  <span>
                    Template: <strong style={{ color: '#0f172a' }}>{formData.templateName}</strong> &bull; Heading: <strong style={{ color: '#0f172a' }}>{formData.headerTitle}</strong>
                  </span>
                  <button
                    type="button"
                    style={{ background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', padding: 0, fontSize: '11.5px', textDecoration: 'underline' }}
                    onClick={() => navigate(`/admin/templates?tab=${formData.letterType}`)}
                  >
                    Configure in Template Setup &rarr;
                  </button>
                </div>
              </div>

              {/* Section 2: Select Employee */}
              <div className={styles.formGroup}>
                <label className={styles.label}>
                  Select Registered Employee <span className={styles.required}>*</span>
                </label>
                <select
                  className={styles.select}
                  value={formData.employeeId}
                  onChange={(e) => handleEmployeeSelect(e.target.value)}
                  onFocus={() => {
                    if ((!employees || employees.length === 0) && !loadingEmployees) {
                      loadEmployees();
                    }
                  }}
                  onClick={() => {
                    if ((!employees || employees.length === 0) && !loadingEmployees) {
                      loadEmployees();
                    }
                  }}
                >
                  {loadingEmployees ? (
                    <option value="" disabled>Loading employees...</option>
                  ) : (
                    <option value="">-- Choose employee from database to auto-resolve placeholders --</option>
                  )}
                  {employees && employees.length > 0 ? (
                    employees.map((emp) => {
                      const empVal = emp.id || emp.employeeId || emp._id || emp.employeeCode;
                      const empCode = emp.employeeCode || emp.employeeId || emp.id || 'EMP';
                      const empName = emp.name || `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || 'Employee';
                      return (
                        <option key={empVal} value={empVal}>
                          {empName} ({empCode}) &bull; {emp.designation || 'Staff'} ({emp.department || 'Operations'})
                        </option>
                      );
                    })
                  ) : !loadingEmployees ? (
                    <option value="" disabled>No registered employees found in database. Add employees in Employee Directory first.</option>
                  ) : null}
                </select>
              </div>

              {/* Section 3: Employee & Letter Parameters */}
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Employee Name <span className={styles.required}>*</span></label>
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
                    placeholder="e.g. RR-1042"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Designation <span className={styles.required}>*</span></label>
                  <input
                    type="text"
                    className={styles.input}
                    value={formData.designation}
                    onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                    placeholder="e.g. Security Officer"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Department</label>
                  <input
                    type="text"
                    className={styles.input}
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    placeholder="e.g. Security Operations"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Site / Work Location</label>
                  <input
                    type="text"
                    className={styles.input}
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="e.g. DLF Cyber City, Tower B, Gurugram"
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

                {/* Conditional Fields depending on Template Letter Type */}
                {formData.letterType === 'appointment-letter' && (
                  <>
                    <div className={styles.formGroup}>
                      <label className={styles.label}>Annual CTC</label>
                      <input
                        type="text"
                        className={styles.input}
                        value={formData.ctc}
                        onChange={(e) => setFormData({ ...formData, ctc: e.target.value })}
                        placeholder="e.g. ₹3,42,000"
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label className={styles.label}>Monthly Gross Salary</label>
                      <input
                        type="text"
                        className={styles.input}
                        value={formData.salary}
                        onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                        placeholder="e.g. ₹28,500"
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
                      placeholder="e.g. ₹34,800"
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

              {/* Section 4: Letter Body Content & Clauses (Editable) */}
              <div className={styles.formGroup}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <label className={styles.label}>Letter Body Content &amp; Clauses (Loaded from Template Setup)</label>
                  <button
                    type="button"
                    onClick={handleResetTemplateContent}
                    style={{ background: 'none', border: 'none', color: '#4f46e5', fontSize: '11.5px', fontWeight: 600, cursor: 'pointer', padding: 0 }}
                  >
                    Reset to Template Default
                  </button>
                </div>
                <textarea
                  className={styles.textarea}
                  rows={8}
                  style={{ fontFamily: 'monospace', fontSize: '12px', lineHeight: 1.5 }}
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Template content with placeholders..."
                />
                <span style={{ fontSize: '11px', color: '#64748b' }}>
                  Dynamic placeholders like <code>{`{{employeeName}}`}</code>, <code>{`{{employeeCode}}`}</code>, <code>{`{{designation}}`}</code>, <code>{`{{department}}`}</code>, <code>{`{{location}}`}</code>, <code>{`{{joiningDate}}`}</code>, <code>{`{{salary}}`}</code>, <code>{`{{ctc}}`}</code> resolve automatically.
                </span>
              </div>

              {/* Section 5: Live Document Preview */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Eye size={15} color="#4f46e5" />
                    <span>Live Document Preview</span>
                  </span>
                  <button
                    type="button"
                    style={{ background: 'none', border: 'none', color: '#2563eb', fontSize: '12px', fontWeight: 600, cursor: 'pointer', padding: 0 }}
                    onClick={() => setShowLivePreview(!showLivePreview)}
                  >
                    {showLivePreview ? 'Hide Preview' : 'Show Live Preview'}
                  </button>
                </div>

                {showLivePreview && (
                  <div className={styles.previewPaper} style={{ margin: '0', maxWidth: '100%', minHeight: 'auto', padding: '22px 24px' }}>
                    <div className={styles.previewWatermark}>
                      {getLetterWatermark(formData.letterType, formData.headerTitle)}
                    </div>

                    <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between' }}>
                      <div>
                        {/* Company Letterhead */}
                        <div className={styles.previewPaperHeader}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                            {activeCompLogo ? (
                              <img
                                src={activeCompLogo}
                                alt={activeCompName}
                                style={{ maxHeight: '52px', maxWidth: '160px', width: 'auto', height: 'auto', objectFit: 'contain', flexShrink: 0 }}
                              />
                            ) : (
                              <div style={{ width: '46px', height: '46px', borderRadius: '8px', background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', color: '#38bdf8', fontWeight: 800, fontSize: '15px', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 2px 6px rgba(0,0,0,0.1)' }}>
                                <span>{activeCompInitials}</span>
                              </div>
                            )}
                            <div>
                              <h3 style={{ margin: '0 0 3px', fontSize: '16px', fontWeight: 800, color: '#0f172a', textTransform: 'uppercase' }}>
                                {activeCompName}
                              </h3>
                              <p style={{ margin: 0, fontSize: '11px', color: '#64748b' }}>
                                {activeCompAddress}
                              </p>
                              {(activeCompEmail || activeCompPhone) && (
                                <p style={{ margin: '3px 0 0', fontSize: '10px', color: '#94a3b8' }}>
                                  {[activeCompEmail, activeCompPhone].filter(Boolean).join(' • ')}
                                </p>
                              )}
                              {(activeCompGstin || activeCompPan) && (
                                <p style={{ margin: '2px 0 0', fontSize: '9.5px', color: '#94a3b8' }}>
                                  {[activeCompGstin ? `GSTIN: ${activeCompGstin}` : '', activeCompPan ? `PAN: ${activeCompPan}` : ''].filter(Boolean).join(' | ')}
                                </p>
                              )}
                            </div>
                          </div>

                          <div style={{ textAlign: 'right', flexShrink: 0 }}>
                            <div className={styles.previewDocTitle}>
                              {formData.headerTitle || 'OFFICIAL LETTER'}
                            </div>
                            <span style={{ fontSize: '10.5px', color: '#64748b' }}>
                              Date: {formatDateDisplay(formData.issueDate)}
                            </span>
                            <div style={{ fontSize: '9px', fontFamily: 'monospace', color: '#94a3b8', background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', marginTop: '3px' }}>
                              REF: NS/{availableTemplatesList.find(t => t.id === formData.templateId)?.code || 'LET'}/{new Date().getFullYear()}/----
                            </div>
                          </div>
                        </div>

                        {/* Rendered Live Letter Content */}
                        <div className={styles.previewDocBody} style={{ maxHeight: '260px', overflowY: 'auto' }}>
                          {renderLetterBody(
                            formData.content || '',
                            {
                              name: formData.employeeName || (formData.employeeId ? 'Employee' : '{{employeeName}}'),
                              employeeCode: formData.employeeCode || (formData.employeeId ? '' : '{{employeeCode}}'),
                              designation: formData.designation || '{{designation}}',
                              department: formData.department || '{{department}}',
                              siteLocation: formData.location || '{{location}}'
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
                      </div>

                      {/* Signatory Section */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '24px', paddingTop: '14px', borderTop: '1px dashed #cbd5e1' }}>
                        <div>
                          <div style={{ width: '130px', borderTop: '1px solid #475569', marginBottom: '6px' }} />
                          <div style={{ fontSize: '11px', fontWeight: 700, color: '#0f172a' }}>{formData.signatoryName || 'Amitabh Sharma'}</div>
                          <div style={{ fontSize: '10px', color: '#64748b' }}>{formData.signatoryDesignation || 'Director - Human Resources'} - For {activeCompName}</div>
                        </div>

                        <div style={{ textAlign: 'right' }}>
                          {formData.letterType === 'experience-letter' ? (
                            <>
                              <div style={{ fontSize: '11px', fontWeight: 600, color: '#64748b' }}>
                                Employee Name: {formData.employeeName || '{{employeeName}}'}
                              </div>
                              <div style={{ fontSize: '10px', color: '#94a3b8' }}>
                                ID: {formData.employeeCode || '{{employeeCode}}'}
                              </div>
                            </>
                          ) : formData.letterType === 'appointment-letter' ? (
                            <>
                              <div style={{ width: '130px', borderTop: '1px solid #475569', marginBottom: '6px', marginLeft: 'auto' }} />
                              <div style={{ fontSize: '11px', fontWeight: 700, color: '#0f172a' }}>Candidate Acceptance Signature</div>
                              <div style={{ fontSize: '10px', color: '#64748b' }}>{formData.employeeName || 'Candidate'} {formData.employeeCode ? `(${formData.employeeCode})` : ''}</div>
                            </>
                          ) : (
                            <>
                              <div style={{ width: '130px', borderTop: '1px solid #475569', marginBottom: '6px', marginLeft: 'auto' }} />
                              <div style={{ fontSize: '11px', fontWeight: 700, color: '#0f172a' }}>Employee Acknowledgement</div>
                              <div style={{ fontSize: '10px', color: '#64748b' }}>Signature &amp; Date ({formData.employeeName || 'Employee'})</div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button
                type="button"
                className={styles.cancelBtn}
                onClick={() => setIsGenerateModalOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="button"
                className={styles.cancelBtn}
                onClick={() => handleSaveGenerate(true)}
                disabled={isSubmitting}
              >
                Save as Draft
              </button>
              <button
                type="button"
                className={styles.primaryBtn}
                onClick={() => handleSaveGenerate(false)}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <Loader2 size={15} className={styles.spinner} />
                ) : (
                  <FileSignature size={15} />
                )}
                <span>{isSubmitting ? 'Saving to Database...' : 'Issue & Generate Letter'}</span>
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

              <button
                type="button"
                className={styles.closeBtn}
                onClick={() => setIsPreviewModalOpen(false)}
                aria-label="Close Preview"
                title="Close Preview"
              >
                <X size={18} />
              </button>
            </div>

            <div className={styles.modalBody} style={{ background: '#f8fafc', padding: '24px 20px 48px', overflowY: 'auto' }}>
              {/* Document Sheet */}
              <div className={styles.previewPaper} id="letter-document-sheet" style={{ height: 'auto', minHeight: 'fit-content', overflow: 'visible', flexShrink: 0 }}>
                {/* Watermark */}
                <div className={styles.previewWatermark}>
                  {getLetterWatermark(selectedLetter.letterType, selectedLetter.headerTitle)}
                </div>

                <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', width: '100%' }}>
                  <div>
                    {/* Dynamic Corporate Letterhead Header */}
                    <div className={styles.previewPaperHeader}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        {activeCompLogo ? (
                          <img
                            src={activeCompLogo}
                            alt={activeCompName}
                            style={{
                              maxHeight: '52px',
                              maxWidth: '160px',
                              width: 'auto',
                              height: 'auto',
                              objectFit: 'contain',
                              flexShrink: 0
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              width: '46px',
                              height: '46px',
                              borderRadius: '8px',
                              background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
                              color: '#38bdf8',
                              fontWeight: 800,
                              fontSize: '15px',
                              letterSpacing: '0.05em',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                              boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
                            }}
                          >
                            <span>{activeCompInitials}</span>
                          </div>
                        )}

                        <div>
                          <h3 style={{ margin: '0 0 3px', fontSize: '16px', fontWeight: 800, color: '#0f172a', textTransform: 'uppercase' }}>
                            {activeCompName}
                          </h3>
                          <p style={{ margin: 0, fontSize: '11px', color: '#64748b', lineHeight: 1.35, maxWidth: '340px' }}>
                            {activeCompAddress}
                          </p>
                          {(activeCompEmail || activeCompPhone) && (
                            <p style={{ margin: '3px 0 0', fontSize: '10px', color: '#94a3b8' }}>
                              {[activeCompEmail, activeCompPhone].filter(Boolean).join(' • ')}
                            </p>
                          )}
                          {(activeCompGstin || activeCompPan) && (
                            <p style={{ margin: '2px 0 0', fontSize: '9.5px', color: '#94a3b8' }}>
                              {[
                                activeCompGstin ? `GSTIN: ${activeCompGstin}` : '',
                                activeCompPan ? `PAN: ${activeCompPan}` : ''
                              ].filter(Boolean).join(' | ')}
                            </p>
                          )}
                        </div>
                      </div>

                      <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '3px', flexShrink: 0 }}>
                        <div className={styles.previewDocTitle}>
                          {selectedLetter.headerTitle || LETTER_TYPES.find((t) => t.id === selectedLetter.letterType)?.name.toUpperCase() || 'OFFICIAL LETTER'}
                        </div>
                        <span style={{ fontSize: '10.5px', color: '#64748b', fontWeight: 500 }}>
                          Date: {formatDateDisplay(selectedLetter.issueDate)}
                        </span>
                        <div style={{ fontSize: '9px', fontFamily: 'monospace', color: '#94a3b8', background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', marginTop: '3px' }}>
                          {selectedLetter.refNo}
                        </div>
                      </div>
                    </div>

                    {/* Main Body Content rendered from Template */}
                    <div className={styles.previewDocBody}>
                      {renderPreviewContent(selectedLetter)}
                    </div>
                  </div>

                  {/* Signatory Box */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '36px', paddingTop: '16px', borderTop: '1px dashed #cbd5e1' }}>
                    <div>
                      <div style={{ width: '130px', borderTop: '1px solid #475569', marginBottom: '6px' }} />
                      <div style={{ fontSize: '11px', fontWeight: 700, color: '#0f172a' }}>
                        {selectedLetter.signatoryName || activeCompany?.signatoryName || 'Amitabh Sharma'}
                      </div>
                      <div style={{ fontSize: '10px', color: '#64748b' }}>
                        {selectedLetter.signatoryDesignation || activeCompany?.signatoryDesignation || 'Director - Human Resources'} - For {activeCompName}
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      {selectedLetter.letterType === 'experience-letter' ? (
                        <>
                          <div style={{ fontSize: '11px', fontWeight: 600, color: '#64748b' }}>
                            Employee Name: {selectedLetter.employeeName}
                          </div>
                          <div style={{ fontSize: '10px', color: '#94a3b8' }}>
                            ID: {selectedLetter.employeeCode}
                          </div>
                        </>
                      ) : selectedLetter.letterType === 'appointment-letter' ? (
                        <>
                          <div style={{ width: '130px', borderTop: '1px solid #475569', marginBottom: '6px', marginLeft: 'auto' }} />
                          <div style={{ fontSize: '11px', fontWeight: 700, color: '#0f172a' }}>Candidate Acceptance Signature</div>
                          <div style={{ fontSize: '10px', color: '#64748b' }}>{selectedLetter.employeeName} ({selectedLetter.employeeCode})</div>
                        </>
                      ) : (
                        <>
                          <div style={{ width: '130px', borderTop: '1px solid #475569', marginBottom: '6px', marginLeft: 'auto' }} />
                          <div style={{ fontSize: '11px', fontWeight: 700, color: '#0f172a' }}>Employee Acknowledgement</div>
                          <div style={{ fontSize: '10px', color: '#64748b' }}>Signature &amp; Date ({selectedLetter.employeeName})</div>
                        </>
                      )}
                    </div>
                  </div>
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
                onClick={() => handleDownload(selectedLetter)}
              >
                <Download size={15} style={{ marginRight: '6px' }} />
                <span>Download PDF</span>
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
                  <label className={styles.label}>Site / Work Location</label>
                  <input
                    type="text"
                    className={styles.input}
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Letter Status</label>
                  <select
                    className={styles.select}
                    value={formData.status || 'Issued'}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  >
                    <option value="Issued">Issued</option>
                    <option value="Sent">Sent</option>
                    <option value="Draft">Draft</option>
                    <option value="Downloaded">Downloaded</option>
                    <option value="Revoked">Revoked</option>
                  </select>
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

                {formData.letterType === 'appointment-letter' && (
                  <>
                    <div className={styles.formGroup}>
                      <label className={styles.label}>Annual CTC</label>
                      <input
                        type="text"
                        className={styles.input}
                        value={formData.ctc}
                        onChange={(e) => setFormData({ ...formData, ctc: e.target.value })}
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label className={styles.label}>Monthly Gross Salary</label>
                      <input
                        type="text"
                        className={styles.input}
                        value={formData.salary}
                        onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                      />
                    </div>
                  </>
                )}

                {formData.letterType === 'full-final-letter' && (
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Settlement Amount</label>
                    <input
                      type="text"
                      className={styles.input}
                      value={formData.settlementAmount}
                      onChange={(e) => setFormData({ ...formData, settlementAmount: e.target.value })}
                    />
                  </div>
                )}

                <div className={styles.formGroup}>
                  <label className={styles.label}>Signatory Name</label>
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
            </div>

            <div className={styles.modalFooter}>
              <button
                type="button"
                className={styles.cancelBtn}
                onClick={() => setIsEditModalOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="button"
                className={styles.primaryBtn}
                onClick={handleSaveEdit}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <Loader2 size={15} className={styles.spinner} />
                ) : null}
                <span>{isSubmitting ? 'Saving...' : 'Save Changes'}</span>
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
