import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { 
  ArrowLeft, ArrowRight, Search, X, Settings2, Landmark, UserCheck, 
  MapPin, Shield, CalendarDays, CalendarOff, CalendarHeart, FileCheck 
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

const ITEMS_PER_PAGE = 8;

const TAB_LABELS = {
  'banks': 'Banks',
  'clients': 'Client Master',
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
  { id: 'all', label: 'All Masters' },
  { id: 'banks', label: 'Banks' },
  { id: 'employee-types', label: 'Employee Types' },
  { id: 'sites', label: 'Sites' },
  { id: 'posts', label: 'Posts' },
  { id: 'shifts', label: 'Shifts' },
  { id: 'leave-types', label: 'Leave Types' },
  { id: 'holidays', label: 'Holidays' },
  { id: 'document-types', label: 'Document Types' }
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Explorer view filter states
  const [catalogSearch, setCatalogSearch] = useState('');
  const [explorerCategory, setExplorerCategory] = useState('all');

  const handleOpenMaster = (tabId) => {
    setSearchParams({ tab: tabId }, { state: location.state });
  };

  const handleBackToMasters = () => {
    setSearchParams({}, { state: location.state });
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
  const [salaryComponents, setSalaryComponents] = useState([]);
  const [documentTypes, setDocumentTypes] = useState([]);

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

  // Persistence for lookups caching only
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

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  // Helper to update specific tab's state
  const setTabData = useCallback((tab, data) => {
    switch (tab) {
      case 'banks': setBanks(data); break;
      case 'clients': setClients(data); break;
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
      if (tab === 'clients') {
        const clientList = await clientService.getClients(companyId);
        setClients(clientList);
        localStorage.setItem(`novaspark_clients_${companyId}`, JSON.stringify(clientList));
      } else {
        const data = await masterService.getMasters(tab, companyId);
        setTabData(tab, data);
      }
    } catch (err) {
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
    window.addEventListener('leaves-updated', handleSync);
    return () => {
      window.removeEventListener('masters-updated', handleSync);
      window.removeEventListener('shifts-updated', handleSync);
      window.removeEventListener('clients-updated', handleSync);
      window.removeEventListener('leaves-updated', handleSync);
    };
  }, [fetchMasterData, activeTab]);

  // Reset pagination when tab, search, or year filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchTerm, holidayYear]);

  // Retrieve current active dataset
  const getCurrentDataset = () => {
    switch (activeTab) {
      case 'banks': return banks;
      case 'clients': return clients;
      case 'departments': return departments;
      case 'designations': return designations;
      case 'employee-types': return employeeTypes;
      case 'sites': return sites;
      case 'posts': return posts;
      case 'shifts': return shifts;
      case 'leave-types': return leaveTypes;
      case 'holidays': return holidays;
      case 'salary-components': return salaryComponents;
      case 'document-types': return documentTypes;
      default: return [];
    }
  };

  const getMasterCount = (tabId) => {
    switch (tabId) {
      case 'banks': return banks.length;
      case 'clients': return clients.length;
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
      case 'clients':
        return dataset.filter(c =>
          c.name?.toLowerCase().includes(term) ||
          (c.code && c.code.toLowerCase().includes(term)) ||
          (c.contactPerson && c.contactPerson.toLowerCase().includes(term)) ||
          (c.city && c.city.toLowerCase().includes(term))
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
  const paginatedItems = filteredItems.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const getEntityName = () => {
    switch (activeTab) {
      case 'banks': return 'Bank';
      case 'clients': return 'Client';
      case 'departments': return 'Department';
      case 'designations': return 'Designation';
      case 'employee-types': return 'Employee Type';
      case 'sites': return 'Site';
      case 'posts': return 'Post';
      case 'shifts': return 'Shift';
      case 'leave-types': return 'Leave Type';
      case 'holidays': return 'Holiday';
      case 'salary-components': return 'Salary Component';
      case 'document-types': return 'Document Type';
      default: return 'Record';
    }
  };

  // Handle Form Submission (Add or Edit)
  const handleFormSubmit = async (formData) => {
    const entityName = getEntityName();

    try {
      if (activeTab === 'clients') {
        if (editingItem) {
          const clientId = editingItem.id || editingItem._id || editingItem.clientId;
          const updated = await clientService.updateClient(companyId, clientId, formData);
          setClients(prev => {
            const next = prev.map(c => ((c.id === clientId || c._id === clientId || c.clientId === clientId) ? { ...c, ...updated, ...formData } : c));
            localStorage.setItem(`novaspark_clients_${companyId}`, JSON.stringify(next));
            return next;
          });
          window.dispatchEvent(new CustomEvent('clients-updated'));
          showToast(`✓ Client "${formData.name || ''}" updated successfully.`, 'success');
        } else {
          const created = await clientService.createClient(companyId, formData);
          setClients(prev => {
            const next = [created, ...prev];
            localStorage.setItem(`novaspark_clients_${companyId}`, JSON.stringify(next));
            return next;
          });
          window.dispatchEvent(new CustomEvent('clients-updated'));
          showToast(`✓ Client "${created?.name || formData.name}" created successfully.`, 'success');
        }
      } else if (DYNAMIC_TABS.includes(activeTab)) {
        if (editingItem) {
          // Dynamic Edit mode
          const updated = await masterService.updateMaster(companyId, editingItem.id, formData);
          const updateList = (list) => list.map(item => item.id === editingItem.id ? updated : item);

          if (activeTab === 'banks') setBanks(updateList);
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
          showToast(`✓ ${entityName} updated successfully.`, 'success');
        } else {
          // Dynamic Add mode
          const created = await masterService.createMaster(companyId, {
            type: activeTab,
            ...formData
          });

          if (activeTab === 'banks') setBanks(prev => [created, ...prev]);
          else if (activeTab === 'departments') setDepartments(prev => [created, ...prev]);
          else if (activeTab === 'designations') setDesignations(prev => [created, ...prev]);
          else if (activeTab === 'employee-types') setEmployeeTypes(prev => [created, ...prev]);
          else if (activeTab === 'sites') setSites(prev => [created, ...prev]);
          else if (activeTab === 'posts') setPosts(prev => [created, ...prev]);
          else if (activeTab === 'shifts') setShifts(prev => [created, ...prev]);
          else if (activeTab === 'leave-types') setLeaveTypes(prev => [created, ...prev]);
          else if (activeTab === 'holidays') setHolidays(prev => [created, ...prev]);
          else if (activeTab === 'salary-components') setSalaryComponents(prev => [created, ...prev]);
          else if (activeTab === 'document-types') setDocumentTypes(prev => [created, ...prev]);

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
    }
  };

  // Handle Record Actions (View, Edit, Activate/Deactivate)
  const handleAction = (actionType, item) => {
    if (actionType === 'view') {
      if (activeTab === 'clients') {
        navigate(`/admin/clients/${item.id || item._id || item.clientId}`);
      } else {
        setSelectedItem(item);
        setIsDetailsOpen(true);
      }
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
    }
  };

  // Handle Confirm Dialog execution
  const handleConfirmAction = async () => {
    const { item, actionType } = confirmModal;
    if (!item) return;

    const newStatus = actionType === 'deactivate' ? 'inactive' : 'active';
    const entityName = getEntityName();

    try {
      if (activeTab === 'clients') {
        const clientId = item.id || item._id || item.clientId;
        await clientService.toggleClientStatus(companyId, clientId, newStatus);
        setClients(prev => {
          const next = prev.map(c => ((c.id === clientId || c._id === clientId || c.clientId === clientId) ? { ...c, status: newStatus } : c));
          localStorage.setItem(`novaspark_clients_${companyId}`, JSON.stringify(next));
          return next;
        });
        window.dispatchEvent(new CustomEvent('clients-updated'));
      } else if (DYNAMIC_TABS.includes(activeTab)) {
        const updated = await masterService.toggleMasterStatus(companyId, item.id, newStatus);
        const updateList = (list) => list.map(i => i.id === item.id ? updated : i);

        if (activeTab === 'banks') setBanks(updateList);
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
      case 'salary-components': return 'salary components';
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
            setIsFormOpen(false);
            setEditingItem(null);
          }}
          onSubmit={handleFormSubmit}
          activeTab={activeTab}
          editingItem={editingItem}
          departments={departments}
          clients={clients}
          workLocations={workLocations}
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
              <span
                className={styles.crumbLink}
                onClick={handleBackToMasters}
                style={{ color: 'var(--primary, #2563eb)', cursor: 'pointer' }}
              >
                Masters
              </span>
              <span className={styles.separator}>/</span>
              <span className={styles.crumbActive}>{TAB_LABELS[activeTab] || activeTab}</span>
            </div>

            {/* Page Header */}
            <header className={styles.header}>
              <div className={styles.titleArea}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={handleBackToMasters}
                    className={styles.secondaryButton}
                    style={{ padding: '6px 12px', fontSize: '13px' }}
                  >
                    <ArrowLeft size={15} /> Back to All Masters
                  </button>
                  {(activeTab === 'departments' || activeTab === 'designations') && (
                    <button
                      type="button"
                      onClick={() => navigate('/admin/company-setup')}
                      className={styles.secondaryButton}
                      style={{ padding: '6px 12px', fontSize: '13px' }}
                    >
                      <ArrowLeft size={15} /> Back to Company Setup
                    </button>
                  )}
                  {activeTab === 'clients' && (
                    <button
                      type="button"
                      onClick={() => navigate('/admin/clients')}
                      className={styles.secondaryButton}
                      style={{ padding: '6px 12px', fontSize: '13px' }}
                    >
                      <ArrowLeft size={15} /> Back to All Clients
                    </button>
                  )}
                  {activeTab === 'salary-components' && (
                    <button
                      type="button"
                      onClick={() => navigate('/admin/payroll-setup')}
                      className={styles.secondaryButton}
                      style={{ padding: '6px 12px', fontSize: '13px' }}
                    >
                      <ArrowLeft size={15} /> Back to Payroll Setup
                    </button>
                  )}
                </div>
                <h1 className={styles.title}>
                  {activeTab === 'departments'
                    ? 'Department Management'
                    : activeTab === 'designations'
                    ? 'Designation Management'
                    : activeTab === 'clients'
                    ? 'Client Master Management'
                    : `${TAB_LABELS[activeTab] || 'Master'} Management`}
                </h1>
                <p className={styles.description}>
                  {activeTab === 'departments'
                    ? 'Configure and manage company departments, divisions, and operational units.'
                    : activeTab === 'designations'
                    ? 'Configure employee designations, job titles, and organizational roles.'
                    : activeTab === 'clients'
                    ? 'Configure and manage organization client master records, codes, and contracted specifications.'
                    : `Configure and manage organization ${TAB_LABELS[activeTab]?.toLowerCase() || 'master'} records and configurations.`}
                </p>
              </div>
            </header>

            {/* Dynamic Summary Cards for Active Tab */}
            <MasterSummaryCards
              activeTab={activeTab}
              items={getCurrentDataset()}
            />

            {/* Toolbar with Search and Contextual Add Button */}
            <MasterToolbar
              activeTab={activeTab}
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              holidayYear={holidayYear}
              onHolidayYearChange={setHolidayYear}
              canAdd={canAdd('masters')}
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
                />

                {!loading && filteredItems.length > 0 && (
                  <Pagination
                    currentPage={currentPage}
                    totalItems={filteredItems.length}
                    itemsPerPage={ITEMS_PER_PAGE}
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
