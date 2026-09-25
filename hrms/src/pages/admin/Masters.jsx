import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import styles from './Masters.module.css';

import AdminLayout from '../../components/layout/AdminLayout';
import MastersTabs from '../../components/masters/MastersTabs';
import MasterSummaryCards from '../../components/masters/MasterSummaryCards';
import MasterToolbar from '../../components/masters/MasterToolbar';
import MasterTable from '../../components/masters/MasterTable';
import MasterFormModal from '../../components/masters/MasterFormModal';
import MasterDetailsModal from '../../components/masters/MasterDetailsModal';
import ConfirmModal from '../../components/common/ConfirmModal';
import Pagination from '../../components/common/Pagination';
import Toast from '../../components/common/Toast';

// Mock master data
import { mockBanks } from '../../data/masters/bankData';
import { getInitialClients } from '../../data/masters/clientData';
import { mockDepartments } from '../../data/masters/departmentData';
import { mockDesignations } from '../../data/masters/designationData';
import { mockEmployeeTypes } from '../../data/masters/employeeTypeData';
import { mockSites } from '../../data/masters/siteData';
import { mockPosts } from '../../data/masters/postData';
import { mockShiftMaster } from '../../data/masters/shiftMasterData';
import { mockLeaveTypes } from '../../data/masters/leaveTypeData';
import { mockHolidays } from '../../data/masters/holidayData';
import { mockSalaryComponents } from '../../data/masters/salaryComponentData';
import { mockDocumentTypes } from '../../data/masters/documentTypeData';
import { mockWorkLocations } from '../../data/workLocationsData';

const ITEMS_PER_PAGE = 8;

function Masters() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const isFromOrgSettings = location.state?.fromOrganisationSettings === true;

  // Active Master Tab
  const initialTab = searchParams.get('tab') || 'banks';
  const [activeTab, setActiveTab] = useState(initialTab);
  const [searchTerm, setSearchTerm] = useState('');
  const [holidayYear, setHolidayYear] = useState('2026');
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Sync tab with URL
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setSearchParams({ tab: tabId }, { state: location.state });
  };

  // 12 Master Data collections with localStorage persistence
  const [banks, setBanks] = useState(() => {
    const saved = localStorage.getItem('novaspark_masters_banks');
    return saved ? JSON.parse(saved) : mockBanks;
  });

  const [clients, setClients] = useState(() => {
    const saved = localStorage.getItem('novaspark_masters_clients');
    return saved ? JSON.parse(saved) : getInitialClients();
  });

  const [departments, setDepartments] = useState(() => {
    const saved = localStorage.getItem('novaspark_masters_departments');
    return saved ? JSON.parse(saved) : mockDepartments;
  });

  const [designations, setDesignations] = useState(() => {
    const saved = localStorage.getItem('novaspark_masters_designations');
    return saved ? JSON.parse(saved) : mockDesignations;
  });

  const [employeeTypes, setEmployeeTypes] = useState(() => {
    const saved = localStorage.getItem('novaspark_masters_employee_types');
    return saved ? JSON.parse(saved) : mockEmployeeTypes;
  });

  const [sites, setSites] = useState(() => {
    const saved = localStorage.getItem('novaspark_masters_sites');
    return saved ? JSON.parse(saved) : mockSites;
  });

  const [posts, setPosts] = useState(() => {
    const saved = localStorage.getItem('novaspark_masters_posts');
    return saved ? JSON.parse(saved) : mockPosts;
  });

  const [shifts, setShifts] = useState(() => {
    const saved = localStorage.getItem('novaspark_masters_shifts');
    return saved ? JSON.parse(saved) : mockShiftMaster;
  });

  const [leaveTypes, setLeaveTypes] = useState(() => {
    const saved = localStorage.getItem('novaspark_masters_leave_types');
    return saved ? JSON.parse(saved) : mockLeaveTypes;
  });

  const [holidays, setHolidays] = useState(() => {
    const saved = localStorage.getItem('novaspark_masters_holidays');
    return saved ? JSON.parse(saved) : mockHolidays;
  });

  const [salaryComponents, setSalaryComponents] = useState(() => {
    const saved = localStorage.getItem('novaspark_masters_salary_components');
    return saved ? JSON.parse(saved) : mockSalaryComponents;
  });

  const [documentTypes, setDocumentTypes] = useState(() => {
    const saved = localStorage.getItem('novaspark_masters_document_types');
    return saved ? JSON.parse(saved) : mockDocumentTypes;
  });

  const [workLocations] = useState(() => {
    const saved = localStorage.getItem('novaspark_work_locations');
    return saved ? JSON.parse(saved) : mockWorkLocations;
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

  // Persistence effects for all 12 datasets
  useEffect(() => { localStorage.setItem('novaspark_masters_banks', JSON.stringify(banks)); }, [banks]);
  useEffect(() => { localStorage.setItem('novaspark_masters_clients', JSON.stringify(clients)); }, [clients]);
  useEffect(() => { localStorage.setItem('novaspark_masters_departments', JSON.stringify(departments)); }, [departments]);
  useEffect(() => { localStorage.setItem('novaspark_masters_designations', JSON.stringify(designations)); }, [designations]);
  useEffect(() => { localStorage.setItem('novaspark_masters_employee_types', JSON.stringify(employeeTypes)); }, [employeeTypes]);
  useEffect(() => { localStorage.setItem('novaspark_masters_sites', JSON.stringify(sites)); }, [sites]);
  useEffect(() => { localStorage.setItem('novaspark_masters_posts', JSON.stringify(posts)); }, [posts]);
  useEffect(() => { localStorage.setItem('novaspark_masters_shifts', JSON.stringify(shifts)); }, [shifts]);
  useEffect(() => { localStorage.setItem('novaspark_masters_leave_types', JSON.stringify(leaveTypes)); }, [leaveTypes]);
  useEffect(() => { localStorage.setItem('novaspark_masters_holidays', JSON.stringify(holidays)); }, [holidays]);
  useEffect(() => { localStorage.setItem('novaspark_masters_salary_components', JSON.stringify(salaryComponents)); }, [salaryComponents]);
  useEffect(() => { localStorage.setItem('novaspark_masters_document_types', JSON.stringify(documentTypes)); }, [documentTypes]);

  // Reset pagination when tab, search, or year filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchTerm, holidayYear]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

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
          b.name.toLowerCase().includes(term) || 
          (b.code && b.code.toLowerCase().includes(term))
        );
      case 'clients':
        return dataset.filter(c => 
          c.name.toLowerCase().includes(term) || 
          (c.code && c.code.toLowerCase().includes(term)) ||
          (c.contactPerson && c.contactPerson.toLowerCase().includes(term)) ||
          (c.city && c.city.toLowerCase().includes(term))
        );
      case 'departments':
        return dataset.filter(d => 
          d.name.toLowerCase().includes(term) || 
          (d.code && d.code.toLowerCase().includes(term)) ||
          (d.description && d.description.toLowerCase().includes(term))
        );
      case 'designations':
        return dataset.filter(ds => 
          ds.name.toLowerCase().includes(term) || 
          (ds.code && ds.code.toLowerCase().includes(term)) ||
          (ds.department && ds.department.toLowerCase().includes(term)) ||
          (ds.description && ds.description.toLowerCase().includes(term))
        );
      case 'employee-types':
        return dataset.filter(et => 
          et.name.toLowerCase().includes(term) || 
          (et.code && et.code.toLowerCase().includes(term)) ||
          (et.description && et.description.toLowerCase().includes(term))
        );
      case 'sites':
        return dataset.filter(s => 
          s.name.toLowerCase().includes(term) || 
          (s.code && s.code.toLowerCase().includes(term)) ||
          (s.clientName && s.clientName.toLowerCase().includes(term)) ||
          (s.city && s.city.toLowerCase().includes(term)) ||
          (s.workLocationName && s.workLocationName.toLowerCase().includes(term))
        );
      case 'posts':
        return dataset.filter(p => 
          p.name.toLowerCase().includes(term) || 
          (p.code && p.code.toLowerCase().includes(term)) ||
          (p.description && p.description.toLowerCase().includes(term))
        );
      case 'shifts':
        return dataset.filter(sh => 
          sh.name.toLowerCase().includes(term) || 
          (sh.code && sh.code.toLowerCase().includes(term)) ||
          (sh.description && sh.description.toLowerCase().includes(term)) ||
          (sh.startTime && sh.startTime.includes(term)) ||
          (sh.endTime && sh.endTime.includes(term))
        );
      case 'leave-types':
        return dataset.filter(lt => 
          lt.name.toLowerCase().includes(term) || 
          (lt.code && lt.code.toLowerCase().includes(term)) ||
          (lt.paidType && lt.paidType.toLowerCase().includes(term)) ||
          (lt.description && lt.description.toLowerCase().includes(term))
        );
      case 'holidays':
        return dataset.filter(h => 
          h.name.toLowerCase().includes(term) || 
          (h.date && h.date.includes(term)) ||
          (h.holidayType && h.holidayType.toLowerCase().includes(term)) ||
          (h.applicableLocation && h.applicableLocation.toLowerCase().includes(term)) ||
          (h.description && h.description.toLowerCase().includes(term))
        );
      case 'salary-components':
        return dataset.filter(sc => 
          sc.name.toLowerCase().includes(term) || 
          (sc.code && sc.code.toLowerCase().includes(term)) ||
          (sc.type && sc.type.toLowerCase().includes(term)) ||
          (sc.description && sc.description.toLowerCase().includes(term))
        );
      case 'document-types':
        return dataset.filter(dt => 
          dt.name.toLowerCase().includes(term) || 
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
  const handleFormSubmit = (formData) => {
    const entityName = getEntityName();

    if (editingItem) {
      // Edit mode
      const updateList = (list) => list.map(item => item.id === editingItem.id ? { ...item, ...formData } : item);
      if (activeTab === 'banks') setBanks(updateList);
      else if (activeTab === 'clients') setClients(updateList);
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

      showToast(`✓ ${entityName} updated successfully.`, 'success');
    } else {
      // Add mode
      const newItem = {
        id: `m-${Date.now()}`,
        ...formData
      };

      if (activeTab === 'banks') setBanks(prev => [newItem, ...prev]);
      else if (activeTab === 'clients') setClients(prev => [newItem, ...prev]);
      else if (activeTab === 'departments') setDepartments(prev => [newItem, ...prev]);
      else if (activeTab === 'designations') setDesignations(prev => [newItem, ...prev]);
      else if (activeTab === 'employee-types') setEmployeeTypes(prev => [newItem, ...prev]);
      else if (activeTab === 'sites') setSites(prev => [newItem, ...prev]);
      else if (activeTab === 'posts') setPosts(prev => [newItem, ...prev]);
      else if (activeTab === 'shifts') setShifts(prev => [newItem, ...prev]);
      else if (activeTab === 'leave-types') setLeaveTypes(prev => [newItem, ...prev]);
      else if (activeTab === 'holidays') setHolidays(prev => [newItem, ...prev]);
      else if (activeTab === 'salary-components') setSalaryComponents(prev => [newItem, ...prev]);
      else if (activeTab === 'document-types') setDocumentTypes(prev => [newItem, ...prev]);

      showToast(`✓ ${entityName} added successfully.`, 'success');
    }

    setIsFormOpen(false);
    setEditingItem(null);
  };

  // Handle Record Actions (View, Edit, Activate/Deactivate)
  const handleAction = (actionType, item) => {
    if (actionType === 'view') {
      if (activeTab === 'clients') {
        navigate(`/admin/clients/${item.id}`);
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
  const handleConfirmAction = () => {
    const { item, actionType } = confirmModal;
    if (!item) return;

    const newStatus = actionType === 'deactivate' ? 'inactive' : 'active';
    const updateList = (list) => list.map(i => i.id === item.id ? { ...i, status: newStatus } : i);

    if (activeTab === 'banks') setBanks(updateList);
    else if (activeTab === 'clients') setClients(updateList);
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

    const entityName = getEntityName();

    showToast(
      `✓ ${entityName} ${actionType === 'deactivate' ? 'deactivated' : 'activated'} successfully.`,
      'success'
    );

    setConfirmModal({
      isOpen: false,
      title: '',
      description: '',
      confirmLabel: '',
      variant: 'danger',
      item: null,
      actionType: null
    });
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

        {/* Breadcrumb nav header */}
        <div className={styles.breadcrumb} role="navigation" aria-label="Breadcrumb">
          <span className={styles.crumbLink} onClick={() => navigate('/admin/dashboard')}>
            Dashboard
          </span>
          <span className={styles.separator}>/</span>
          <span className={styles.crumbActive}>Masters</span>
        </div>

        {/* Page Header */}
        <header className={styles.header}>
          <div className={styles.titleArea}>
            <h1 className={styles.title}>Masters Management</h1>
            <p className={styles.description}>
              Configure and manage organization masters, manpower clients, sites, shifts, statutory components, and document types.
            </p>
          </div>
        </header>

        {/* Dynamic Summary Cards for Active Tab */}
        <MasterSummaryCards
          activeTab={activeTab}
          items={getCurrentDataset()}
        />

        {/* Master Switcher Tabs */}
        <MastersTabs
          activeTab={activeTab}
          onTabChange={handleTabChange}
          isFromOrgSettings={isFromOrgSettings}
        />

        {/* Toolbar with Search and Contextual Add Button */}
        <MasterToolbar
          activeTab={activeTab}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          holidayYear={holidayYear}
          onHolidayYearChange={setHolidayYear}
          onAddNew={() => {
            setEditingItem(null);
            setIsFormOpen(true);
          }}
        />

        {/* Dynamic Master Table */}
        {error ? (
          <div className={styles.errorState}>
            <p className={styles.errorMsg}>Unable to load master data. Something went wrong.</p>
            <button className={styles.retryBtn} onClick={() => setError(null)}>
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
      </div>
    </AdminLayout>
  );
}

export default Masters;
