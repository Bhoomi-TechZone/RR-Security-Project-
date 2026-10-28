import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { 
  ArrowLeft, ArrowRight, Search, X, Settings2, Landmark, UserCheck, 
  MapPin, Shield, CalendarDays, CalendarOff, CalendarHeart, FileCheck, Briefcase 
} from 'lucide-react';
import styles from './Masters.module.css';
import AdminLayout from '../../components/layout/AdminLayout';
import MasterSummaryCards from '../../components/masters/MasterSummaryCards';
import MasterToolbar from '../../components/masters/MasterToolbar';
import MasterTable from '../../components/masters/MasterTable';
import MasterFormModal from '../../components/masters/MasterFormModal';
import MasterDetailsModal from '../../components/masters/MasterDetailsModal';
import ConfirmModal from '../../components/common/ConfirmModal';
import Pagination from '../../components/common/Pagination';
import Toast from '../../components/common/Toast';
import { useCompany } from '../../context/CompanyContext';
import { usePermissions } from '../../context/PermissionContext';
import masterService from '../../services/masterService';
import { workLocationService } from '../../services/workLocationService';
import clientService from '../../services/clientService';
// Mock master data for non-dynamic / fallback datasets
import { getInitialClients } from '../../data/masters/clientData';
import { mockShiftMaster } from '../../data/masters/shiftMasterData';
import { mockWorkLocations } from '../../data/workLocationsData';
import { mockSalaryComponents } from '../../data/masters/salaryComponentData';
const ITEMS_PER_PAGE = 8;
const TAB_LABELS = {
  'banks': 'Banks',
  'client-services': 'Client Services',
  'clients': 'Client Services',
  'departments': 'Departments',
  'designations': 'Designations',
  'employee-types': 'Employee Types',
  'sites': 'Sites',
  'posts': 'Posts',
  'shifts': 'Shifts',
  'leave-types': 'Leave Types',
  'holidays': 'Holidays',
  'salary-components': 'Salary Components',
  'document-types': 'Document Types'
};
const DYNAMIC_TABS = [
  'banks',
  'client-services',
  'clients',
  'departments',
  'designations',
  'employee-types',
  'sites',
  'posts',
  'shifts',
  'leave-types',
  'holidays',
  'salary-components',
  'document-types'
];
const MASTER_CATEGORIES = [
  { id: 'all', label: 'All Masters Setup' }
];
const ALL_MASTERS_CATALOG = [
  {
    id: 'banks',
    tab: 'banks',
    title: 'Bank Master',
    desc: 'Configure company bank accounts, IFSC codes, branches and salary disbursement settings.',
    icon: Landmark,
    badge: 'Banking',
    iconBg: '#fef3c7',
    iconColor: '#d97706'
  },
  {
    id: 'client-services',
    tab: 'client-services',
    title: 'Client Services',
    desc: 'Configure operational service types provided to clients (Security Guard, Housekeeping, Facility Management, etc.).',
    icon: Briefcase,
    badge: 'Services',
    iconBg: '#eff6ff',
    iconColor: '#2563eb'
  },
  {
    id: 'employee-types',
    tab: 'employee-types',
    title: 'Employee Types',
    desc: 'Manage employment classifications such as permanent, contract, probation, and temporary.',
    icon: UserCheck,
    badge: 'Staffing',
    iconBg: '#e0f2fe',
    iconColor: '#0284c7'
  },
  {
    id: 'sites',
    tab: 'sites',
    title: 'Site Master',
    desc: 'Configure operational branch sites, client deployment locations, and geofenced zones.',
    icon: MapPin,
    badge: 'Locations',
    iconBg: '#fdf2f8',
    iconColor: '#db2777'
  },
  {
    id: 'posts',
    tab: 'posts',
    title: 'Post Master',
    desc: 'Manage on-site guard posts, workstation assignments, and designated duty checkpoints.',
    icon: Shield,
    badge: 'Security',
    iconBg: '#f1f5f9',
    iconColor: '#475569'
  },
  {
    id: 'shifts',
    tab: 'shifts',
    title: 'Shift Master',
    desc: 'Define standard shifts, rotational schedules, start/end timings, and grace periods.',
    icon: CalendarDays,
    badge: 'Attendance',
    iconBg: '#e0e7ff',
    iconColor: '#4f46e5'
  },
  {
    id: 'leave-types',
    tab: 'leave-types',
    title: 'Leave Types',
    desc: 'Configure leave categories, quotas, carry-forward policies, and encashment rules.',
    icon: CalendarOff,
    badge: 'Leaves',
    iconBg: '#fef2f2',
    iconColor: '#dc2626'
  },
  {
    id: 'holidays',
    tab: 'holidays',
    title: 'Holiday Calendar',
    desc: 'Declare national, festival, state, and optional floating holidays for the calendar year.',
    icon: CalendarHeart,
    badge: 'Calendar',
    iconBg: '#fff1f2',
    iconColor: '#e11d48'
  },
  {
    id: 'document-types',
    tab: 'document-types',
    title: 'Document Types',
    desc: 'Configure mandatory KYC, ID cards, certificates, and compliance document formats.',
    icon: FileCheck,
    badge: 'Compliance',
    iconBg: '#f8fafc',
    iconColor: '#0f172a'
  }
];
function Masters() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const isFromOrgSettings = location.state?.fromOrganisationSettings === true;
  const { canAdd, canEdit, canDelete } = usePermissions();
  const { activeCompany } = useCompany();
  const companyId = activeCompany?.companyId || activeCompany?.id || activeCompany?._id || 'comp_rr_security';
  // Active Master Tab & Explorer View Detection
  const rawTab = searchParams.get('tab');
  const isExplorerView = !rawTab;
  const activeTab = rawTab && TAB_LABELS[rawTab] ? rawTab : 'banks';
  const [searchTerm, setSearchTerm] = useState('');
  const [holidayYear, setHolidayYear] = useState('2026');
  const [currentPage, setCurrentPage] = useState(1);
  const [salaryComponentSubTab, setSalaryComponentSubTab] = useState('earnings');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  // Explorer view filter states
  const [catalogSearch, setCatalogSearch] = useState('');
  const [explorerCategory, setExplorerCategory] = useState('all');
  const handleOpenMaster = (tabId) => {
    setSearchParams({ tab: tabId }, { state: location.state });
  };
  // If navigating to /admin/masters root without a tab, redirect to Central Organization Setup
  useEffect(() => {
    if (!rawTab) {
      navigate('/admin/company-setup?category=all-masters-setup', { replace: true });
    }
  }, [rawTab, navigate]);

  const handleBackToMasters = () => {
    navigate('/admin/company-setup?category=all-masters-setup');
  };
  const handleTabChange = (tabId) => {
    setSearchParams({ tab: tabId }, { state: location.state });
  };
  // Dynamic Master Data States (Managed via API with Company Isolation & MongoDB Persistence)
  const [banks, setBanks] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [employeeTypes, setEmployeeTypes] = useState([]);
  const [sites, setSites] = useState([]);
  const [posts, setPosts] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [salaryComponents, setSalaryComponents] = useState(() => {
    const saved = localStorage.getItem(`novaspark_salary_components_${companyId}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return mockSalaryComponents;
  });
  const [documentTypes, setDocumentTypes] = useState([]);
  // Client Services Master Data State (Dynamic from MongoDB)
  const [clientServices, setClientServices] = useState([]);
  // Clients & Work Locations for Masters Lookups (Loaded dynamically from API)
  const [clients, setClients] = useState(() => {
    const saved = localStorage.getItem(`novaspark_clients_${companyId}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return [];
  });
  const [workLocations, setWorkLocations] = useState(() => {
    const saved = localStorage.getItem(`novaspark_work_locations_${companyId}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return [];
  });
  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [isSavingMaster, setIsSavingMaster] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    description: '',
    confirmLabel: '',
    variant: 'danger',
    item: null,
    actionType: null // 'activate' | 'deactivate'
  });
  // Toast
  const [toast, setToast] = useState({ message: '', type: 'success' });
  // Persistence for lookups caching
  useEffect(() => {
    if (clientServices.length > 0) {
      localStorage.setItem(`novaspark_client_services_${companyId}`, JSON.stringify(clientServices));
    }
  }, [clientServices, companyId]);
  useEffect(() => {
    if (clients.length > 0) {
      localStorage.setItem(`novaspark_clients_${companyId}`, JSON.stringify(clients));
    }
  }, [clients, companyId]);
  useEffect(() => {
    if (workLocations.length > 0) {
      localStorage.setItem(`novaspark_work_locations_${companyId}`, JSON.stringify(workLocations));
    }
  }, [workLocations, companyId]);
  useEffect(() => {
    if (salaryComponents.length > 0) {
      localStorage.setItem(`novaspark_salary_components_${companyId}`, JSON.stringify(salaryComponents));
    }
  }, [salaryComponents, companyId]);
  // Clean up any stale legacy mock client services from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`novaspark_client_services_${companyId}`);
      if (saved && (saved.includes('srv_1') || saved.includes('srv_2') || saved.includes('srv_'))) {
        localStorage.removeItem(`novaspark_client_services_${companyId}`);
      }
    } catch {}
  }, [companyId]);
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };
  // Helper to update specific tab's state
  const setTabData = useCallback((tab, data) => {
    switch (tab) {
      case 'banks': setBanks(data); break;
      case 'client-services':
      case 'clients': setClientServices(data); break;
      case 'departments': setDepartments(data); break;
      case 'designations': setDesignations(data); break;
      case 'employee-types': setEmployeeTypes(data); break;
      case 'sites': setSites(data); break;
      case 'posts': setPosts(data); break;
      case 'shifts': setShifts(data); break;
      case 'leave-types': setLeaveTypes(data); break;
      case 'holidays': setHolidays(data); break;
      case 'salary-components': setSalaryComponents(data); break;
      case 'document-types': setDocumentTypes(data); break;
      default: break;
    }
  }, []);
  // Fetch dynamic master records from API
  const fetchMasterData = useCallback(async (tab, silent = false) => {
    if (!DYNAMIC_TABS.includes(tab) || !companyId) return;
    if (!silent) setLoading(true);
    setError(null);
    try {
      if (tab === 'client-services' || tab === 'clients') {
        const data = await masterService.getMasters('client-services', companyId, true);
        const list = Array.isArray(data) ? data : [];
        setClientServices(list);
      } else {
        if (tab === 'salary-components') {
          const data = await masterService.getMasters(tab, companyId).catch(() => null);
          if (Array.isArray(data) && data.length > 0) {
            setSalaryComponents(data);
            localStorage.setItem(`novaspark_salary_components_${companyId}`, JSON.stringify(data));
          } else {
            const saved = localStorage.getItem(`novaspark_salary_components_${companyId}`);
            if (saved) {
              try {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed) && parsed.length > 0) {
                  setSalaryComponents(parsed);
                  return;
                }
              } catch (e) {}
            }
            setSalaryComponents(mockSalaryComponents);
          }
          return;
        }
        const data = await masterService.getMasters(tab, companyId);
        setTabData(tab, data);
      }
    } catch (err) {
      if (tab === 'salary-components') {
        setSalaryComponents(mockSalaryComponents);
        return;
      }
      console.error(`Error loading master ${tab}:`, err);
      if (!silent) {
        setError(err.message || 'Failed to load master records.');
        showToast(`Failed to load ${TAB_LABELS[tab] || tab}: ${err.message}`, 'error');
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, [companyId, setTabData]);
  // Load active tab data on mount or activeTab / companyId change
  useEffect(() => {
    if (DYNAMIC_TABS.includes(activeTab)) {
      fetchMasterData(activeTab);
    }
  }, [activeTab, companyId, fetchMasterData]);
  // Listen to cross-module client updates
  useEffect(() => {
    const handleClientsUpdated = () => {
      fetchMasterData('clients', true);
    };
    window.addEventListener('clients-updated', handleClientsUpdated);
    return () => window.removeEventListener('clients-updated', handleClientsUpdated);
  }, [fetchMasterData]);
  // Preload supplementary datasets (clients, work locations, departments for modals)
  useEffect(() => {
    if (companyId) {
      // Preload departments if needed for designation / site form dropdowns
      masterService.getMasters('departments', companyId)
        .then(depts => {
          if (Array.isArray(depts)) setDepartments(depts);
        })
        .catch(err => console.log('Preload depts notice:', err.message));
      // Preload clients dynamically from API
      clientService.getClients(companyId)
        .then(clientList => {
          if (Array.isArray(clientList)) {
            setClients(clientList);
            localStorage.setItem(`novaspark_clients_${companyId}`, JSON.stringify(clientList));
          }
        })
        .catch(err => console.log('Preload clients notice:', err.message));
      // Preload work locations dynamically from API
      workLocationService.getWorkLocations(companyId)
        .then(locs => {
          if (Array.isArray(locs)) {
            setWorkLocations(locs);
            localStorage.setItem(`novaspark_work_locations_${companyId}`, JSON.stringify(locs));
          }
        })
        .catch(err => console.log('Preload work locations notice:', err.message));
      // Preload all masters to calculate live counts on explorer cards and sidebar badges
      masterService.getMasters('', companyId)
        .then((allData) => {
          if (Array.isArray(allData)) {
            const grouped = {};
            DYNAMIC_TABS.forEach((t) => { grouped[t] = []; });
            allData.forEach((item) => {
              if (item.type && grouped[item.type]) {
                grouped[item.type].push(item);
              }
            });
            if (grouped['banks']?.length) setBanks(grouped['banks']);
            if (grouped['client-services']?.length) setClientServices(grouped['client-services']);
            if (grouped['departments']?.length) setDepartments(grouped['departments']);
            if (grouped['designations']?.length) setDesignations(grouped['designations']);
            if (grouped['employee-types']?.length) setEmployeeTypes(grouped['employee-types']);
            if (grouped['sites']?.length) setSites(grouped['sites']);
            if (grouped['posts']?.length) setPosts(grouped['posts']);
            if (grouped['shifts']?.length) setShifts(grouped['shifts']);
            if (grouped['leave-types']?.length) setLeaveTypes(grouped['leave-types']);
            if (grouped['holidays']?.length) setHolidays(grouped['holidays']);
            if (grouped['salary-components']?.length) setSalaryComponents(grouped['salary-components']);
            if (grouped['document-types']?.length) setDocumentTypes(grouped['document-types']);
          }
        })
        .catch((err) => console.log('Notice: Preload all masters count:', err.message));
    }
  }, [companyId]);
  // Sync event listener across modules
  useEffect(() => {
    const handleSync = (e) => {
      if (e?.detail?.tab) {
        fetchMasterData(e.detail.tab, true);
      } else {
        fetchMasterData(activeTab, true);
      }
    };
    window.addEventListener('masters-updated', handleSync);
    window.addEventListener('shifts-updated', handleSync);
    window.addEventListener('clients-updated', handleSync);
    window.addEventListener('client-services-updated', handleSync);
    window.addEventListener('leaves-updated', handleSync);
    return () => {
      window.removeEventListener('masters-updated', handleSync);
      window.removeEventListener('shifts-updated', handleSync);
      window.removeEventListener('clients-updated', handleSync);
      window.removeEventListener('client-services-updated', handleSync);
      window.removeEventListener('leaves-updated', handleSync);
    };
  }, [fetchMasterData, activeTab]);
  // Reset pagination when tab, search, or year filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchTerm, holidayYear, salaryComponentSubTab]);
  // Retrieve current active dataset
  const getCurrentDataset = () => {
    switch (activeTab) {
      case 'banks': return banks;
      case 'client-services':
      case 'clients': return clientServices;
      case 'departments': return departments;
      case 'designations': return designations;
      case 'employee-types': return employeeTypes;
      case 'sites': return sites;
      case 'posts': return posts;
      case 'shifts': return shifts;
      case 'leave-types': return leaveTypes;
      case 'holidays': return holidays;
      case 'salary-components':
        return salaryComponents.filter(c =>
          salaryComponentSubTab === 'deductions'
            ? c.type === 'deduction'
            : (c.type || 'earning') === 'earning'
        );
      case 'document-types': return documentTypes;
      default: return [];
    }
  };
  const getMasterCount = (tabId) => {
    switch (tabId) {
      case 'banks': return banks.length;
      case 'client-services':
      case 'clients': return clientServices.length;
      case 'departments': return departments.length;
      case 'designations': return designations.length;
      case 'employee-types': return employeeTypes.length;
      case 'sites': return sites.length;
      case 'posts': return posts.length;
      case 'shifts': return shifts.length;
      case 'leave-types': return leaveTypes.length;
      case 'holidays': return holidays.length;
      case 'salary-components': return salaryComponents.length;
      case 'document-types': return documentTypes.length;
      default: return 0;
    }
  };
  const getCategoryCount = (catId) => {
    if (catId === 'all') return ALL_MASTERS_CATALOG.length;
    return getMasterCount(catId);
  };
  const filteredCatalog = useMemo(() => {
    return ALL_MASTERS_CATALOG.filter((item) => {
      const matchesCategory =
        explorerCategory === 'all' || item.id === explorerCategory;
      const q = catalogSearch.trim().toLowerCase();
      const matchesSearch =
        !q ||
        item.title.toLowerCase().includes(q) ||
        item.desc.toLowerCase().includes(q) ||
        item.badge.toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [explorerCategory, catalogSearch]);
  // Filter current active dataset based on search term and holiday year
  const getFilteredItems = () => {
    let dataset = getCurrentDataset();
    if (activeTab === 'holidays' && holidayYear && holidayYear !== 'all') {
      dataset = dataset.filter(h => h.date && h.date.startsWith(holidayYear));
    }
    if (!searchTerm.trim()) return dataset;
    const term = searchTerm.toLowerCase();
    switch (activeTab) {
      case 'banks':
        return dataset.filter(b =>
          b.name?.toLowerCase().includes(term) ||
          (b.code && b.code.toLowerCase().includes(term))
        );
      case 'client-services':
      case 'clients':
        return dataset.filter(srv =>
          srv.name?.toLowerCase().includes(term) ||
          (srv.code && srv.code.toLowerCase().includes(term)) ||
          (srv.description && srv.description.toLowerCase().includes(term))
        );
      case 'departments':
        return dataset.filter(d =>
          d.name?.toLowerCase().includes(term) ||
          (d.code && d.code.toLowerCase().includes(term)) ||
          (d.description && d.description.toLowerCase().includes(term))
        );
      case 'designations':
        return dataset.filter(ds =>
          ds.name?.toLowerCase().includes(term) ||
          (ds.code && ds.code.toLowerCase().includes(term)) ||
          (ds.department && ds.department.toLowerCase().includes(term)) ||
          (ds.description && ds.description.toLowerCase().includes(term))
        );
      case 'employee-types':
        return dataset.filter(et =>
          et.name?.toLowerCase().includes(term) ||
          (et.code && et.code.toLowerCase().includes(term)) ||
          (et.description && et.description.toLowerCase().includes(term))
        );
      case 'sites':
        return dataset.filter(s =>
          s.name?.toLowerCase().includes(term) ||
          (s.code && s.code.toLowerCase().includes(term)) ||
          (s.clientName && s.clientName.toLowerCase().includes(term)) ||
          (s.city && s.city.toLowerCase().includes(term)) ||
          (s.workLocationName && s.workLocationName.toLowerCase().includes(term))
        );
      case 'posts':
        return dataset.filter(p =>
          p.name?.toLowerCase().includes(term) ||
          (p.code && p.code.toLowerCase().includes(term)) ||
          (p.description && p.description.toLowerCase().includes(term))
        );
      case 'shifts':
        return dataset.filter(sh =>
          sh.name?.toLowerCase().includes(term) ||
          (sh.code && sh.code.toLowerCase().includes(term)) ||
          (sh.description && sh.description.toLowerCase().includes(term)) ||
          (sh.startTime && sh.startTime.includes(term)) ||
          (sh.endTime && sh.endTime.includes(term))
        );
      case 'leave-types':
        return dataset.filter(lt =>
          lt.name?.toLowerCase().includes(term) ||
          (lt.code && lt.code.toLowerCase().includes(term)) ||
          (lt.paidType && lt.paidType.toLowerCase().includes(term)) ||
          (lt.description && lt.description.toLowerCase().includes(term))
        );
      case 'holidays':
        return dataset.filter(h =>
          h.name?.toLowerCase().includes(term) ||
          (h.date && h.date.includes(term)) ||
          (h.holidayType && h.holidayType.toLowerCase().includes(term)) ||
          (h.applicableLocation && h.applicableLocation.toLowerCase().includes(term)) ||
          (h.description && h.description.toLowerCase().includes(term))
        );
      case 'salary-components':
        return dataset.filter(sc =>
          sc.name?.toLowerCase().includes(term) ||
          (sc.code && sc.code.toLowerCase().includes(term)) ||
          (sc.type && sc.type.toLowerCase().includes(term)) ||
          (sc.shortName && sc.shortName.toLowerCase().includes(term)) ||
          (sc.componentType && sc.componentType.toLowerCase().includes(term)) ||
          (sc.deductionType && sc.deductionType.toLowerCase().includes(term)) ||
          (sc.description && sc.description.toLowerCase().includes(term))
        );
      case 'document-types':
        return dataset.filter(dt =>
          dt.name?.toLowerCase().includes(term) ||
          (dt.code && dt.code.toLowerCase().includes(term)) ||
          (dt.description && dt.description.toLowerCase().includes(term))
        );
      default:
        return dataset;
    }
  };
  const filteredItems = getFilteredItems();
  const earningsCount = useMemo(
    () => salaryComponents.filter((c) => (c.type || 'earning') === 'earning').length,
    [salaryComponents]
  );
  const deductionsCount = useMemo(
    () => salaryComponents.filter((c) => c.type === 'deduction').length,
    [salaryComponents]
  );
  const paginatedItems = filteredItems.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );
  const getEntityName = () => {
    switch (activeTab) {
      case 'banks': return 'Bank';
      case 'client-services':
      case 'clients': return 'Client Service';
      case 'departments': return 'Department';
      case 'designations': return 'Designation';
      case 'employee-types': return 'Employee Type';
      case 'sites': return 'Site';
      case 'posts': return 'Post';
      case 'shifts': return 'Shift';
      case 'leave-types': return 'Leave Type';
      case 'holidays': return 'Holiday';
      case 'salary-components': return salaryComponentSubTab === 'deductions' ? 'Deduction' : 'Salary Component';
      case 'document-types': return 'Document Type';
      default: return 'Record';
    }
  };
  // Handle Form Submission (Add or Edit)
  const handleFormSubmit = async (formData) => {
    if (isSavingMaster) return;
    setIsSavingMaster(true);
    const entityName = getEntityName();
    try {
      if (DYNAMIC_TABS.includes(activeTab)) {
        if (editingItem) {
          // Dynamic Edit mode
          const itemId = editingItem.id || editingItem._id;
          const updated = await masterService.updateMaster(companyId, itemId, formData);
          const merged = { ...editingItem, ...(updated || {}), ...formData, id: itemId, _id: itemId };
          const updateList = (list) => list.map(item => ((item.id || item._id) === itemId) ? merged : item);
          if (activeTab === 'banks') setBanks(updateList);
          else if (activeTab === 'client-services' || activeTab === 'clients') {
            setClientServices(updateList);
            window.dispatchEvent(new CustomEvent('client-services-updated'));
          }
          else if (activeTab === 'departments') setDepartments(updateList);
          else if (activeTab === 'designations') setDesignations(updateList);
          else if (activeTab === 'employee-types') setEmployeeTypes(updateList);
          else if (activeTab === 'sites') setSites(updateList);
          else if (activeTab === 'posts') setPosts(updateList);
          else if (activeTab === 'shifts') setShifts(updateList);
          else if (activeTab === 'leave-types') setLeaveTypes(updateList);
          else if (activeTab === 'holidays') setHolidays(updateList);
          else if (activeTab === 'salary-components') {
            setSalaryComponents(prev => {
              const next = updateList(prev);
              localStorage.setItem(`novaspark_salary_components_${companyId}`, JSON.stringify(next));
              return next;
            });
            window.dispatchEvent(new CustomEvent('salary-components-updated'));
          }
          else if (activeTab === 'document-types') setDocumentTypes(updateList);
          window.dispatchEvent(new CustomEvent('masters-updated', { detail: { tab: activeTab } }));
          if (activeTab === 'shifts') {
            window.dispatchEvent(new CustomEvent('shifts-updated'));
          }
          if (activeTab === 'leave-types') {
            window.dispatchEvent(new CustomEvent('leaves-updated'));
          }
          showToast(`✓ ${entityName} updated successfully.`, 'success');
        } else {
          // Dynamic Add mode
          const created = await masterService.createMaster(companyId, {
            type: activeTab === 'clients' ? 'client-services' : activeTab,
            ...formData
          });
          const createdItem = { ...formData, ...(created || {}), id: created?.id || created?._id, _id: created?._id || created?.id };
          const updateCreated = (prev) => [createdItem, ...prev.filter(p => (p.id || p._id) !== (createdItem.id || createdItem._id))];
          if (activeTab === 'banks') setBanks(updateCreated);
          else if (activeTab === 'client-services' || activeTab === 'clients') {
            setClientServices(updateCreated);
            window.dispatchEvent(new CustomEvent('client-services-updated'));
          }
          else if (activeTab === 'departments') setDepartments(updateCreated);
          else if (activeTab === 'designations') setDesignations(updateCreated);
          else if (activeTab === 'employee-types') setEmployeeTypes(updateCreated);
          else if (activeTab === 'sites') setSites(updateCreated);
          else if (activeTab === 'posts') setPosts(updateCreated);
          else if (activeTab === 'shifts') setShifts(updateCreated);
          else if (activeTab === 'leave-types') setLeaveTypes(updateCreated);
          else if (activeTab === 'holidays') setHolidays(updateCreated);
          else if (activeTab === 'salary-components') {
            setSalaryComponents(prev => {
              const next = updateCreated(prev);
              localStorage.setItem("novaspark_salary_components_" + companyId, JSON.stringify(next));
              return next;
            });
            window.dispatchEvent(new CustomEvent('salary-components-updated'));
          }
          else if (activeTab === 'document-types') setDocumentTypes(updateCreated);
          window.dispatchEvent(new CustomEvent('masters-updated', { detail: { tab: activeTab } }));
          if (activeTab === 'shifts') {
            window.dispatchEvent(new CustomEvent('shifts-updated'));
          }
          if (activeTab === 'leave-types') {
            window.dispatchEvent(new CustomEvent('leaves-updated'));
          }
          showToast(`✓ ${entityName} created successfully.`, 'success');
        }
      }
      setIsFormOpen(false);
      setEditingItem(null);
    } catch (err) {
      console.error('Error submitting master form:', err);
      showToast(err.message || `Failed to save ${entityName}.`, 'error');
      throw err;
    } finally {
      setIsSavingMaster(false);
    }
  };
  // Handle Record Actions (View, Edit, Activate/Deactivate, Delete)
  const handleAction = (actionType, item) => {
    if (actionType === 'view') {
      setSelectedItem(item);
      setIsDetailsOpen(true);
    } else if (actionType === 'delete') {
      setConfirmModal({
        isOpen: true,
        title: `Delete ${item.name}?`,
        description: `Are you sure you want to delete ${item.name}? This action cannot be undone.`,
        confirmLabel: 'Delete',
        variant: 'danger',
        item,
        actionType: 'delete'
      });
    } else if (actionType === 'edit') {
      setEditingItem(item);
      setIsFormOpen(true);
    } else if (actionType === 'deactivate') {
      setConfirmModal({
        isOpen: true,
        title: `Deactivate ${item.name}?`,
        description: `Are you sure you want to deactivate ${item.name}? It will be marked as inactive in system lookups.`,
        confirmLabel: 'Deactivate',
        variant: 'danger',
        item,
        actionType: 'deactivate'
      });
    } else if (actionType === 'activate') {
      setConfirmModal({
        isOpen: true,
        title: `Activate ${item.name}?`,
        description: `Are you sure you want to activate ${item.name}? It will be restored to active status.`,
        confirmLabel: 'Activate',
        variant: 'primary',
        item,
        actionType: 'activate'
      });
    } else if (actionType === 'delete') {
      setConfirmModal({
        isOpen: true,
        title: `Delete ${item.name}?`,
        description: `Are you sure you want to permanently delete "${item.name}"? This action cannot be undone.`,
        confirmLabel: 'Delete',
        variant: 'danger',
        item,
        actionType: 'delete'
      });
    }
  };
  // Handle Confirm Dialog execution
  const handleConfirmAction = async () => {
    const { item, actionType } = confirmModal;
    if (!item) return;
    const itemId = item.id || item._id;
    const entityName = getEntityName();
    try {
      if (DYNAMIC_TABS.includes(activeTab)) {
        if (actionType === 'delete') {
          await masterService.deleteMaster(companyId, itemId);
          const filterList = (list) => list.filter(i => (i.id || i._id) !== itemId);
          if (activeTab === 'banks') setBanks(filterList);
          else if (activeTab === 'client-services' || activeTab === 'clients') {
            setClientServices(filterList);
            window.dispatchEvent(new CustomEvent('client-services-updated'));
          }
          else if (activeTab === 'departments') setDepartments(filterList);
          else if (activeTab === 'designations') setDesignations(filterList);
          else if (activeTab === 'employee-types') setEmployeeTypes(filterList);
          else if (activeTab === 'sites') setSites(filterList);
          else if (activeTab === 'posts') setPosts(filterList);
          else if (activeTab === 'shifts') setShifts(filterList);
          else if (activeTab === 'leave-types') setLeaveTypes(filterList);
          else if (activeTab === 'holidays') setHolidays(filterList);
          else if (activeTab === 'salary-components') {
            setSalaryComponents(filterList);
            const saved = localStorage.getItem(`novaspark_salary_components_${companyId}`);
            if (saved) {
              try {
                const parsed = JSON.parse(saved);
                const nextList = parsed.filter(i => (i.id || i._id) !== itemId);
                localStorage.setItem(`novaspark_salary_components_${companyId}`, JSON.stringify(nextList));
              } catch (e) {}
            }
            window.dispatchEvent(new CustomEvent('salary-components-updated'));
          }
          else if (activeTab === 'document-types') setDocumentTypes(filterList);
          window.dispatchEvent(new CustomEvent('masters-updated', { detail: { tab: activeTab } }));
          showToast(`✓ ${entityName} deleted successfully.`, 'success');
          return;
        }
        const newStatus = actionType === 'deactivate' ? 'inactive' : 'active';
        await masterService.toggleMasterStatus(companyId, itemId, newStatus);
        const updateList = (list) => list.map(i => (i.id || i._id) === itemId ? { ...i, status: newStatus } : i);
        if (activeTab === 'banks') setBanks(updateList);
        else if (activeTab === 'client-services' || activeTab === 'clients') {
          setClientServices(updateList);
          window.dispatchEvent(new CustomEvent('client-services-updated'));
        }
        else if (activeTab === 'departments') setDepartments(updateList);
        else if (activeTab === 'designations') setDesignations(updateList);
        else if (activeTab === 'employee-types') setEmployeeTypes(updateList);
        else if (activeTab === 'sites') setSites(updateList);
        else if (activeTab === 'posts') setPosts(updateList);
        else if (activeTab === 'shifts') setShifts(updateList);
        else if (activeTab === 'leave-types') setLeaveTypes(updateList);
        else if (activeTab === 'holidays') setHolidays(updateList);
        else if (activeTab === 'salary-components') setSalaryComponents(updateList);
        else if (activeTab === 'document-types') setDocumentTypes(updateList);
        window.dispatchEvent(new CustomEvent('masters-updated', { detail: { tab: activeTab } }));
        if (activeTab === 'shifts') {
          window.dispatchEvent(new CustomEvent('shifts-updated'));
        }
        if (activeTab === 'leave-types') {
          window.dispatchEvent(new CustomEvent('leaves-updated'));
        }
      }
      showToast(
        `✓ ${entityName} ${actionType === 'deactivate' ? 'deactivated' : 'activated'} successfully.`,
        'success'
      );
    } catch (err) {
      console.error('Error changing master status:', err);
      showToast(err.message || `Failed to change ${entityName} status.`, 'error');
    } finally {
      setConfirmModal({
        isOpen: false,
        title: '',
        description: '',
        confirmLabel: '',
        variant: 'danger',
        item: null,
        actionType: null
      });
    }
  };
  const getPaginationLabel = () => {
    switch (activeTab) {
      case 'banks': return 'banks';
      case 'clients': return 'clients';
      case 'departments': return 'departments';
      case 'designations': return 'designations';
      case 'employee-types': return 'employee types';
      case 'sites': return 'sites';
      case 'posts': return 'posts';
      case 'shifts': return 'shifts';
      case 'leave-types': return 'leave types';
      case 'holidays': return 'holidays';
      case 'salary-components': return salaryComponentSubTab === 'deductions' ? 'deductions' : 'salary components';
      case 'document-types': return 'document types';
      default: return 'records';
    }
  };
  return (
    <AdminLayout>
      <div className={styles.container}>
        {/* Toast Alert */}
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ message: '', type: 'success' })}
        />
        {/* Add/Edit Form Modal */}
        <MasterFormModal
          isOpen={isFormOpen}
          onClose={() => {
            if (isSavingMaster) return;
            setIsFormOpen(false);
            setEditingItem(null);
          }}
          onSubmit={handleFormSubmit}
          activeTab={activeTab}
          editingItem={editingItem}
          departments={departments}
          clients={clients}
          workLocations={workLocations}
          componentCategory={salaryComponentSubTab === 'deductions' ? 'deduction' : 'earning'}
          isSubmitting={isSavingMaster}
        />
        {/* Details View Modal */}
        <MasterDetailsModal
          isOpen={isDetailsOpen}
          onClose={() => {
            setIsDetailsOpen(false);
            setSelectedItem(null);
          }}
          activeTab={activeTab}
          item={selectedItem}
        />
        {/* Confirmation Modal */}
        <ConfirmModal
          isOpen={confirmModal.isOpen}
          title={confirmModal.title}
          description={confirmModal.description}
          confirmLabel={confirmModal.confirmLabel}
          variant={confirmModal.variant}
          onConfirm={handleConfirmAction}
          onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        />
        {isExplorerView ? (
          <>
            {/* Explorer Breadcrumb */}
            <div className={styles.breadcrumb} role="navigation" aria-label="Breadcrumb">
              <span className={styles.crumbLink} onClick={() => navigate('/admin/dashboard')}>
                Dashboard
              </span>
              <span className={styles.separator}>/</span>
              <span className={styles.crumbActive}>Masters</span>
              {explorerCategory !== 'all' && (
                <>
                  <span className={styles.separator}>/</span>
                  <span className={styles.crumbActive}>
                    {MASTER_CATEGORIES.find((c) => c.id === explorerCategory)?.label}
                  </span>
                </>
              )}
            </div>
            {/* Explorer Header */}
            <header className={styles.header} style={{ marginBottom: '16px' }}>
              <div className={styles.titleArea}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Settings2 size={24} color="#2563eb" />
                  <h1 className={styles.title} style={{ fontSize: '22px' }}>System Masters</h1>
                </div>
                <p className={styles.description} style={{ marginTop: '6px' }}>
                  Configure and manage organization foundational master data, departments, designations, shifts, banks, and compliance categories.
                </p>
              </div>
            </header>
            {/* 2-Column Masters Explorer Layout */}
            <div className={styles.mastersExplorerLayout}>
              {/* Left Sidebar Filter Panel */}
              <aside className={styles.explorerSidebar}>
                <div className={styles.explorerSearchWrap}>
                  <input
                    type="text"
                    className={styles.explorerSearchInput}
                    placeholder="Search Masters"
                    value={catalogSearch}
                    onChange={(e) => setCatalogSearch(e.target.value)}
                  />
                  {catalogSearch ? (
                    <button
                      type="button"
                      className={styles.explorerClearBtn}
                      onClick={() => setCatalogSearch('')}
                      aria-label="Clear search"
                    >
                      <X size={14} />
                    </button>
                  ) : (
                    <span style={{ position: 'absolute', right: 10, color: '#94a3b8', pointerEvents: 'none', display: 'flex' }}>
                      <Search size={14} />
                    </span>
                  )}
                </div>
                <ul className={styles.categoryList}>
                  {MASTER_CATEGORIES.map((cat) => {
                    const count = getCategoryCount(cat.id);
                    const isActive = explorerCategory === cat.id;
                    return (
                      <li key={cat.id}>
                        <button
                          type="button"
                          className={`${styles.categoryBtn} ${isActive ? styles.categoryBtnActive : ''}`}
                          onClick={() => setExplorerCategory(cat.id)}
                        >
                          <span className={isActive ? styles.sidebarActiveDot : styles.sidebarDot} />
                          <span>{cat.label}</span>
                          <span className={styles.categoryBadge}>{count}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </aside>
              {/* Right Grid of Master Cards */}
              <main style={{ minWidth: 0 }}>
                {filteredCatalog.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '60px 20px', background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>No master modules found matching "{catalogSearch}".</p>
                    <button
                      type="button"
                      className={styles.secondaryButton}
                      onClick={() => { setCatalogSearch(''); setExplorerCategory('all'); }}
                      style={{ marginTop: '12px', fontSize: '13px' }}
                    >
                      Show All Masters
                    </button>
                  </div>
                ) : (
                  <div className={styles.explorerCardsGrid}>
                    {filteredCatalog.map((item) => {
                      const Icon = item.icon;
                      const count = getMasterCount(item.tab);
                      return (
                        <div key={item.id} className={styles.referenceReportCard}>
                          <div>
                            <div className={styles.cardFormatIcons}>
                              <span style={{ display: 'inline-flex', color: item.iconColor || 'var(--primary, #2563eb)' }}>
                                <Icon size={16} />
                              </span>
                              <span className={styles.recordCountPill} style={{ marginLeft: 'auto' }}>
                                {count} {count === 1 ? 'Record' : 'Records'}
                              </span>
                            </div>
                            <div className={styles.cardBody}>
                              <h4 className={styles.cardTitle}>{item.title}</h4>
                              <p className={styles.cardDesc}>{item.desc}</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            className={styles.cardOpenBtn}
                            onClick={() => handleOpenMaster(item.tab)}
                          >
                            Open <ArrowRight size={13} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </main>
            </div>
          </>
        ) : (
          <>
            {/* Active Master Management View */}
            <div className={styles.breadcrumb} role="navigation" aria-label="Breadcrumb">
              <span className={styles.crumbLink} onClick={() => navigate('/admin/dashboard')}>
                Dashboard
              </span>
              <span className={styles.separator}>/</span>
              {activeTab === 'departments' || activeTab === 'designations' ? (
                <>
                  <span
                    className={styles.crumbLink}
                    onClick={() => navigate('/admin/company-setup')}
                    style={{ color: 'var(--primary, #2563eb)', cursor: 'pointer' }}
                  >
                    Organization Setup
                  </span>
                  <span className={styles.separator}>/</span>
                </>
              ) : activeTab === 'salary-components' ? (
                <>
                  <span
                    className={styles.crumbLink}
                    onClick={() => navigate('/admin/company-setup?category=payroll-setup')}
                    style={{ color: 'var(--primary, #2563eb)', cursor: 'pointer' }}
                  >
                    Payroll Setup
                  </span>
                  <span className={styles.separator}>/</span>
                </>
              ) : (activeTab === 'client-services' || activeTab === 'clients') ? (
                <>
                  <span
                    className={styles.crumbLink}
                    onClick={() => navigate('/admin/clients')}
                    style={{ color: 'var(--primary, #2563eb)', cursor: 'pointer' }}
                  >
                    Clients
                  </span>
                  <span className={styles.separator}>/</span>
                </>
              ) : (
                <>
                  <span
                    className={styles.crumbLink}
                    onClick={handleBackToMasters}
                    style={{ color: 'var(--primary, #2563eb)', cursor: 'pointer' }}
                  >
                    All Masters Setup
                  </span>
                  <span className={styles.separator}>/</span>
                </>
              )}
              <span className={styles.crumbActive}>{TAB_LABELS[activeTab] || activeTab}</span>
            </div>
            {/* Page Header */}
            <header className={styles.header}>
              <div className={styles.titleArea}>
                <h1 className={styles.title}>
                  {activeTab === 'departments'
                    ? 'Department Management'
                    : activeTab === 'designations'
                    ? 'Designation Management'
                    : (activeTab === 'client-services' || activeTab === 'clients')
                    ? 'Client Services'
                    : `${TAB_LABELS[activeTab] || 'Master'} Management`}
                </h1>
                <p className={styles.description}>
                  {activeTab === 'departments'
                    ? 'Configure and manage company departments, divisions, and operational units.'
                    : activeTab === 'designations'
                    ? 'Configure employee designations, job titles, and organizational roles.'
                    : (activeTab === 'client-services' || activeTab === 'clients')
                    ? 'Configure operational client service categories and offerings available during client onboarding.'
                    : `Configure and manage organization ${TAB_LABELS[activeTab]?.toLowerCase() || 'master'} records and configurations.`}
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                {activeTab === 'departments' || activeTab === 'designations' ? (
                  <button
                    type="button"
                    onClick={() => navigate('/admin/company-setup')}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '7px',
                      padding: '8px 16px',
                      background: 'rgb(215 119 5)',
                      color: '#ffffff',
                      borderRadius: '8px',
                      fontSize: '12.5px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      whiteSpace: 'nowrap'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgb(180 83 9)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgb(215 119 5)';
                    }}
                  >
                    <ArrowLeft size={15} color="#fff" /> Back to Company Setup
                  </button>
                ) : activeTab === 'salary-components' ? (
                  <button
                    type="button"
                    onClick={() => navigate('/admin/company-setup?category=payroll-setup')}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '7px',
                      padding: '8px 16px',
                      background: 'rgb(215 119 5)',
                      color: '#ffffff',
                      borderRadius: '8px',
                      fontSize: '12.5px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      whiteSpace: 'nowrap'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgb(180 83 9)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgb(215 119 5)';
                    }}
                  >
                    <ArrowLeft size={15} color="#fff" /> Back to Payroll Setup
                  </button>
                ) : (activeTab === 'client-services' || activeTab === 'clients') ? (
                  <button
                    type="button"
                    onClick={() => navigate('/admin/clients')}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '7px',
                      padding: '8px 16px',
                      background: 'rgb(215 119 5)',
                      color: '#ffffff',
                      borderRadius: '8px',
                      fontSize: '12.5px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      whiteSpace: 'nowrap'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgb(180 83 9)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgb(215 119 5)';
                    }}
                  >
                    <ArrowLeft size={15} color="#fff" /> Back to Clients
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleBackToMasters}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '7px',
                      padding: '8px 16px',
                      background: 'rgb(215 119 5)',
                      color: '#ffffff',
                      borderRadius: '8px',
                      fontSize: '12.5px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      whiteSpace: 'nowrap'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgb(180 83 9)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgb(215 119 5)';
                    }}
                  >
                    <ArrowLeft size={15} color="#fff" /> Back to All Masters Setup
                  </button>
                )}
              </div>
            </header>
            {/* Dynamic Summary Cards for Active Tab */}
            <MasterSummaryCards
              activeTab={activeTab}
              items={getCurrentDataset()}
              subTab={activeTab === 'salary-components' ? salaryComponentSubTab : null}
            />
            {/* Sub-tab Switcher for Salary Components vs Deductions */}
            {activeTab === 'salary-components' && (
              <div className={styles.salarySubTabsContainer}>
                <button
                  type="button"
                  className={`${styles.salarySubTabBtn} ${salaryComponentSubTab === 'earnings' ? styles.salarySubTabBtnActive : ''}`}
                  onClick={() => setSalaryComponentSubTab('earnings')}
                >
                  Earnings
                  <span className={styles.salarySubTabBadge}>{earningsCount}</span>
                </button>
                <button
                  type="button"
                  className={`${styles.salarySubTabBtn} ${salaryComponentSubTab === 'deductions' ? styles.salarySubTabBtnActive : ''}`}
                  onClick={() => setSalaryComponentSubTab('deductions')}
                >
                  Deductions
                  <span className={styles.salarySubTabBadge}>{deductionsCount}</span>
                </button>
              </div>
            )}
            {/* Toolbar with Search and Contextual Add Button */}
            <MasterToolbar
              activeTab={activeTab}
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              holidayYear={holidayYear}
              onHolidayYearChange={setHolidayYear}
              canAdd={canAdd('masters')}
              customAddLabel={activeTab === 'salary-components' ? (salaryComponentSubTab === 'deductions' ? 'Add Deduction' : 'Add Component') : null}
              onAddNew={() => {
                setEditingItem(null);
                setIsFormOpen(true);
              }}
            />
            {/* Dynamic Master Table */}
            {error ? (
              <div className={styles.errorState}>
                <p className={styles.errorMsg}>{error}</p>
                <button className={styles.retryBtn} onClick={() => fetchMasterData(activeTab)}>
                  Try Again
                </button>
              </div>
            ) : (
              <>
                <MasterTable
                  activeTab={activeTab}
                  items={paginatedItems}
                  loading={loading}
                  onAction={handleAction}
                  onResetSearch={() => setSearchTerm('')}
                  currentPage={currentPage}
                  itemsPerPage={ITEMS_PER_PAGE}
                  subTab={activeTab === 'salary-components' ? salaryComponentSubTab : null}
                />
                {!loading && filteredItems.length > 0 && (
                  <Pagination
                    currentPage={currentPage}
                    totalItems={filteredItems.length}
                    itemsPerPage={ITEMS_PER_PAGE}
                  subTab={activeTab === 'salary-components' ? salaryComponentSubTab : null}
                    onPageChange={setCurrentPage}
                    label={getPaginationLabel()}
                  />
                )}
              </>
            )}
          </>
        )}
      </div>
    </AdminLayout>
  );
}
export default Masters;
