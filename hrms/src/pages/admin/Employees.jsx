import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { Plus, Users, UploadCloud } from 'lucide-react';
import styles from './Employees.module.css';

import AdminLayout from '../../components/layout/AdminLayout';
import EmployeeFilters from '../../components/employees/EmployeeFilters';
import EmployeeTable from '../../components/employees/EmployeeTable';
import TransferEmployeeModal from '../../components/employees/TransferEmployeeModal';
import EmployeeCredentialsModal from '../../components/employees/EmployeeCredentialsModal';
import EmployeePayslipModal from '../../components/employees/EmployeePayslipModal';
import EmployeeImportModal from '../../components/employees/EmployeeImportModal';
import ConfirmModal from '../../components/common/ConfirmModal';
import Pagination from '../../components/common/Pagination';
import Toast from '../../components/common/Toast';
import EmptyState from '../../components/common/EmptyState';

import { useCompany } from '../../context/CompanyContext';
import { usePermissions } from '../../context/PermissionContext';
import { authService } from '../../services/authService';
import masterService from '../../services/masterService';
import clientService from '../../services/clientService';
import workLocationService from '../../services/workLocationService';
import { downloadEmployeeProfile } from '../../utils/employeeProfileExport';
import { downloadEmployeeIdCardPdf } from '../../utils/idCardExport';

const API_BASE_URL = import.meta.env.VITE_API_URL;
const ITEMS_PER_PAGE = 10;

function Employees() {
  const navigate = useNavigate();
  const location = useLocation();
  const { activeCompany } = useCompany();
  const { canAdd, canEdit, canDelete, canExport } = usePermissions();

  const isUserPanel = location.pathname.startsWith('/user');
  const addEmployeePath = isUserPanel ? '/user/employees/add' : '/admin/employees/add';

  // SWR Instant Cache: Load cached employees synchronously so the table renders in 0 ms without skeleton wait
  const [employees, setEmployees] = useState(() => {
    try {
      const activeId = localStorage.getItem('novaspark_active_company_id') || 'RRS8392014SEC';
      const cached = sessionStorage.getItem(`novaspark_employees_${activeId}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return [];
  });
  const [clients, setClients] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [employeeTypes, setEmployeeTypes] = useState([]);
  const [sites, setSites] = useState([]);
  const [posts, setPosts] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [banks, setBanks] = useState([]);
  const [documentTypes, setDocumentTypes] = useState([]);
  const [workLocations, setWorkLocations] = useState([]);
  const [loading, setLoading] = useState(() => {
    try {
      const activeId = localStorage.getItem('novaspark_active_company_id') || 'RRS8392014SEC';
      const cached = sessionStorage.getItem(`novaspark_employees_${activeId}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return false;
      }
    } catch {}
    return true;
  });
  const [error, setError] = useState(null);

  const [searchParams] = useSearchParams();
  const companyIdParam = searchParams.get('companyId');

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [companyFilter, setCompanyFilter] = useState(companyIdParam || 'all');
  const [locationFilter, setLocationFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [designationFilter, setDesignationFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState(() => searchParams.get('status') || 'all');
  const [sortBy, setSortBy] = useState('none');
  const [sortOrder, setSortOrder] = useState('asc');
  const [currentPage, setCurrentPage] = useState(1);

  // Form / Modal State
  const [isFormOpen, setIsFormOpen] = useState(() => searchParams.get('action') === 'add');
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [transferEmployee, setTransferEmployee] = useState(null);
  const [isCredentialsOpen, setIsCredentialsOpen] = useState(false);
  const [credentialsEmployee, setCredentialsEmployee] = useState(null);
  const [isPayslipOpen, setIsPayslipOpen] = useState(false);
  const [payslipEmployee, setPayslipEmployee] = useState(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    description: '',
    confirmLabel: '',
    variant: 'danger',
    employee: null,
    actionType: null,
  });
  const [isProcessingAction, setIsProcessingAction] = useState(false);

  // Toast
  const [toast, setToast] = useState({ message: '', type: 'success' });
  const showToast = (message, type = 'success') => setToast({ message, type });

  // Sync search params to filter state
  useEffect(() => {
    if (companyIdParam) {
      setCompanyFilter(companyIdParam);
    }

    const statusParam = searchParams.get('status');
    if (statusParam) {
      setStatusFilter(statusParam);
    } else {
      setStatusFilter('all');
    }

    if (searchParams.get('action') === 'add') {
      navigate(addEmployeePath, { replace: true });
    }
  }, [searchParams, companyIdParam, addEmployeePath, navigate]);

  const currentCompanyId = activeCompany?.companyId || activeCompany?.id || '';

  // Active fetch abort controller to cancel stale in-flight requests
  const activeFetchAbortRef = useRef(null);

  // Fetch employees strictly isolated for active company (SWR background sync)
  const fetchEmployees = useCallback(async (forceLoading = false) => {
    if (!currentCompanyId) {
      setLoading(false);
      return;
    }

    // Cancel any previous pending request
    if (activeFetchAbortRef.current) {
      activeFetchAbortRef.current.abort();
    }
    const abortController = new AbortController();
    activeFetchAbortRef.current = abortController;

    // Only show skeleton if we have NO cached data to display
    setEmployees((currentList) => {
      if (currentList.length === 0 || forceLoading) {
        setLoading(true);
      }
      return currentList;
    });
    setError(null);

    try {
      const token = authService.getToken();
      const res = await fetch(`${API_BASE_URL}/employees`, {
        signal: abortController.signal,
        headers: {
          'Authorization': `Bearer ${token || ''}`,
          'x-company-id': currentCompanyId,
        },
      });

      if (abortController.signal.aborted) return;

      if (!res.ok) {
        if (res.status === 304) {
          return;
        }
        let errMsg = 'Failed to fetch employees';
        try {
          const errData = await res.json();
          errMsg = errData.message || errMsg;
        } catch (_) {}
        if (res.status !== 404) {
          setError(errMsg);
        }
        return;
      }

      const data = await res.json();
      if (data && data.success) {
        const freshList = data.employees || [];
        setEmployees(freshList);
        try {
          sessionStorage.setItem(`novaspark_employees_${currentCompanyId}`, JSON.stringify(freshList));
        } catch {}
      } else {
        if (data?.message) {
          setError(data.message);
        }
      }
    } catch (err) {
      if (err.name === 'AbortError') return;
      console.error('Error fetching employees:', err);
      setError(err.message || 'Network error while fetching employees');
    } finally {
      if (!abortController.signal.aborted) {
        setLoading(false);
      }
    }
  }, [currentCompanyId]);

  // Clean up abort controller on unmount
  useEffect(() => {
    return () => {
      if (activeFetchAbortRef.current) {
        activeFetchAbortRef.current.abort();
      }
    };
  }, []);

  // Fetch essential filter masters (clients, departments, designations, sites, locations) for table/filter view
  const fetchFilterMasters = useCallback(async () => {
    if (!currentCompanyId) return;
    try {
      clientService.getClients(currentCompanyId).then(setClients).catch(() => {});
      masterService.getMasters('departments', currentCompanyId).then(setDepartments).catch(() => {});
      masterService.getMasters('designations', currentCompanyId).then(setDesignations).catch(() => {});
      masterService.getMasters('sites', currentCompanyId).then(setSites).catch(() => {});
      workLocationService.getWorkLocations(currentCompanyId).then(setWorkLocations).catch(() => {});
    } catch (err) {
      console.error('Error fetching filter masters for employees page:', err);
    }
  }, [currentCompanyId]);

  // Lazy-fetch additional form-only masters in background or when form is opened
  const fetchFormMasters = useCallback(async () => {
    if (!currentCompanyId) return;
    try {
      masterService.getMasters('employee-types', currentCompanyId).then(setEmployeeTypes).catch(() => {});
      masterService.getMasters('sites', currentCompanyId).then(setSites).catch(() => {});
      masterService.getMasters('posts', currentCompanyId).then(setPosts).catch(() => {});
      masterService.getMasters('shifts', currentCompanyId).then(setShifts).catch(() => {});
      masterService.getMasters('banks', currentCompanyId).then(setBanks).catch(() => {});
      masterService.getMasters('document-types', currentCompanyId).then(setDocumentTypes).catch(() => {});
      workLocationService.getWorkLocations(currentCompanyId).then(setWorkLocations).catch(() => {});
    } catch (err) {
      console.error('Error fetching form masters:', err);
    }
  }, [currentCompanyId]);

  useEffect(() => {
    fetchEmployees();
    fetchFilterMasters();
  }, [fetchEmployees, fetchFilterMasters]);

  // Preload form masters when form opens or after brief idle delay
  useEffect(() => {
    if (isFormOpen) {
      fetchFormMasters();
    } else {
      const idleTimer = setTimeout(() => {
        fetchFormMasters();
      }, 1500);
      return () => clearTimeout(idleTimer);
    }
  }, [isFormOpen, fetchFormMasters]);

  // Listen to cross-module updates
  useEffect(() => {
    const handleSync = () => {
      fetchFilterMasters();
      if (isFormOpen) fetchFormMasters();
      fetchEmployees();
    };
    window.addEventListener('clients-updated', handleSync);
    window.addEventListener('locations-updated', handleSync);
    window.addEventListener('masters-updated', handleSync);
    window.addEventListener('employees-updated', handleSync);
    return () => {
      window.removeEventListener('clients-updated', handleSync);
      window.removeEventListener('locations-updated', handleSync);
      window.removeEventListener('masters-updated', handleSync);
      window.removeEventListener('employees-updated', handleSync);
    };
  }, [fetchFilterMasters, fetchFormMasters, isFormOpen, fetchEmployees]);

  // Extract unique locations from workLocations, sites, and employees
  const locationList = useMemo(() => {
    const locSet = new Set();
    (workLocations || []).forEach((w) => {
      const val = typeof w === 'string' ? w : (w.name || w.locationName || w.title);
      if (val) locSet.add(val);
    });
    (sites || []).forEach((s) => {
      const val = typeof s === 'string' ? s : (s.name || s.siteName);
      if (val) locSet.add(val);
    });
    (employees || []).forEach((e) => {
      if (e.siteLocation) locSet.add(e.siteLocation);
      if (e.location) locSet.add(e.location);
      if (e.site) locSet.add(e.site);
      if (e.workLocation) locSet.add(e.workLocation);
    });
    return Array.from(locSet).filter(Boolean).sort();
  }, [workLocations, sites, employees]);

  const handleResetFilters = () => {
    setSearchTerm('');
    setCompanyFilter('all');
    setLocationFilter('all');
    setDepartmentFilter('all');
    setDesignationFilter('all');
    setStatusFilter('all');
    setSortBy('none');
    setSortOrder('asc');
    setCurrentPage(1);
  };

  // Dynamic Filtering
  const filteredEmployees = employees.filter((e) => {
    const search = searchTerm.toLowerCase().trim();
    const matchesSearch =
      !search ||
      (e.name && e.name.toLowerCase().includes(search)) ||
      (e.contact && e.contact.toLowerCase().includes(search)) ||
      (e.employeeId && e.employeeId.toLowerCase().includes(search)) ||
      (e.email && e.email.toLowerCase().includes(search));

    const matchesCompany =
      companyFilter === 'all' ||
      e.clientId === companyFilter ||
      e.companyId === companyFilter ||
      e.clientName === companyFilter ||
      e.companyName === companyFilter;

    const matchesLocation =
      locationFilter === 'all' ||
      e.siteLocation === locationFilter ||
      e.location === locationFilter ||
      e.site === locationFilter ||
      e.workLocation === locationFilter;

    const matchesDept = departmentFilter === 'all' || e.department === departmentFilter;
    const matchesDesg = designationFilter === 'all' || e.designation === designationFilter;
    const matchesStatus =
      statusFilter === 'all' ||
      (e.status && e.status.toLowerCase() === statusFilter.toLowerCase());

    return matchesSearch && matchesCompany && matchesLocation && matchesDept && matchesDesg && matchesStatus;
  });

  // Dynamic Sorting (Name, E-Code, Date of Joining)
  const sortedEmployees = useMemo(() => {
    if (!sortBy || sortBy === 'none') return filteredEmployees;
    return [...filteredEmployees].sort((a, b) => {
      let valA = '';
      let valB = '';
      if (sortBy === 'name') {
        valA = (a.name || '').toLowerCase();
        valB = (b.name || '').toLowerCase();
      } else if (sortBy === 'code') {
        valA = (a.employeeCode || a.employeeId || '').toLowerCase();
        valB = (b.employeeCode || b.employeeId || '').toLowerCase();
      } else if (sortBy === 'doj') {
        valA = a.joiningDate ? new Date(a.joiningDate).getTime() : 0;
        valB = b.joiningDate ? new Date(b.joiningDate).getTime() : 0;
        return sortOrder === 'asc' ? valA - valB : valB - valA;
      }
      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredEmployees, sortBy, sortOrder]);

  // Pagination
  const paginatedEmployees = sortedEmployees.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Reset page on filter or sort change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, companyFilter, locationFilter, departmentFilter, designationFilter, statusFilter, sortBy, sortOrder]);

  // Add / Edit form submit to Backend API
  const handleFormSubmit = async (formData) => {
    const token = authService.getToken();
    try {
      if (editingEmployee) {
        const empId = editingEmployee.id || editingEmployee._id || editingEmployee.employeeId;
        const res = await fetch(`${API_BASE_URL}/employees/${empId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token || ''}`,
            'x-company-id': currentCompanyId,
          },
          body: JSON.stringify({
            ...formData,
            companyId: currentCompanyId,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Failed to update employee');
        showToast(data.message || '✓ Employee updated successfully.', 'success');
      } else {
        const res = await fetch(`${API_BASE_URL}/employees`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token || ''}`,
            'x-company-id': currentCompanyId,
          },
          body: JSON.stringify({
            ...formData,
            companyId: currentCompanyId,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Failed to create employee');
        showToast(data.message || '✓ Employee added successfully.', 'success');
      }
      await fetchEmployees();
      setIsFormOpen(false);
      setEditingEmployee(null);
    } catch (err) {
      console.error('Error saving employee:', err);
      showToast(err.message || 'Failed to save employee.', 'error');
    }
  };

  // Action menu handler
  const handleActionClick = (actionType, employee) => {
    if (actionType === 'view') {
      navigate(isUserPanel ? `/user/employees/${employee.id || employee._id || employee.employeeId}` : `/admin/employees/${employee.id || employee._id || employee.employeeId}`);
    } else if (actionType === 'edit') {
      const empId = employee.id || employee._id || employee.employeeId;
      navigate(isUserPanel ? `/user/employees/${empId}/edit` : `/admin/employees/${empId}/edit`);
    } else if (actionType === 'transfer') {
      const empId = employee.id || employee._id || employee.employeeId;
      navigate(isUserPanel ? `/user/employees/transfer?empId=${empId}` : `/admin/employees/transfer?empId=${empId}`);
    } else if (actionType === 'download') {
      downloadEmployeeProfile(employee, activeCompany);
    } else if (actionType === 'idcard') {
      try {
        downloadEmployeeIdCardPdf(employee, activeCompany);
      } catch (err) {
        console.error('Failed to export ID Card:', err);
        showToast('Failed to generate ID Card PDF', 'error');
      }
    } else if (actionType === 'credentials') {
      setCredentialsEmployee(employee);
      setIsCredentialsOpen(true);
    } else if (actionType === 'payslip') {
      setPayslipEmployee(employee);
      setIsPayslipOpen(true);
    } else if (actionType === 'delete' || actionType === 'deactivate') {
      setConfirmModal({
        isOpen: true,
        title: 'Deactivate Employee?',
        description: `Are you sure you want to deactivate ${employee.name} (${employee.employeeId || employee.id})? The employee will be marked as Inactive instead of being deleted, preserving statutory history.`,
        confirmLabel: 'Deactivate Employee',
        variant: 'danger',
        employee,
        actionType: 'deactivate',
      });
    } else if (actionType === 'activate') {
      setConfirmModal({
        isOpen: true,
        title: 'Activate Employee?',
        description: `Are you sure you want to activate ${employee.name}? The employee will be restored to Active status.`,
        confirmLabel: 'Activate Employee',
        variant: 'primary',
        employee,
        actionType: 'activate',
      });
    }
  };

  // Save / Update employee portal credentials
  const handleSaveCredentials = async (employeeId, credentialsData) => {
    const token = authService.getToken();
    try {
      const res = await fetch(`${API_BASE_URL}/employees/${employeeId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token || ''}`,
          'x-company-id': currentCompanyId,
        },
        body: JSON.stringify({
          password: credentialsData.password,
          enablePortalAccess: credentialsData.enablePortalAccess,
          sendWelcomeEmail: credentialsData.sendWelcomeEmail,
          recipientEmail: credentialsData.recipientEmail,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to update credentials');
      
      const successMsg = credentialsData.sendWelcomeEmail && credentialsData.recipientEmail
        ? `✓ Credentials updated and Welcome Email dispatched to ${credentialsData.recipientEmail}!`
        : `✓ Credentials updated successfully for ${credentialsEmployee?.name || 'employee'}.`;

      showToast(successMsg, 'success');
      await fetchEmployees();
      setIsCredentialsOpen(false);
      setCredentialsEmployee(null);
    } catch (err) {
      console.error('Error updating credentials:', err);
      showToast(err.message || 'Failed to update credentials', 'error');
      throw err;
    }
  };

  // Confirm delete / activate / deactivate action
  const handleConfirmAction = async () => {
    const { employee, actionType } = confirmModal;
    if (!employee) return;
    const token = authService.getToken();
    const empId = employee.id || employee._id || employee.employeeId;

    setIsProcessingAction(true);
    try {
      const isDeactivate = actionType === 'deactivate' || actionType === 'delete';
      const newStatus = isDeactivate ? 'Inactive' : 'Active';
      const res = await fetch(`${API_BASE_URL}/employees/${empId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token || ''}`,
          'x-company-id': currentCompanyId,
        },
        body: JSON.stringify({
          status: newStatus,
          employeeStatus: newStatus,
          isActive: !isDeactivate,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || `Failed to ${isDeactivate ? 'deactivate' : 'activate'} employee`);
      showToast(
        isDeactivate
          ? `✓ Employee "${employee.name}" deactivated successfully.`
          : `✓ Employee "${employee.name}" activated successfully.`,
        'success'
      );
      await fetchEmployees();
    } catch (err) {
      console.error('Error in employee action:', err);
      showToast(err.message || 'Failed to process request', 'error');
    } finally {
      setIsProcessingAction(false);
      setConfirmModal((prev) => ({ ...prev, isOpen: false }));
    }
  };

  // Transfer employee
  const handleTransfer = async (employeeId, transferData) => {
    const token = authService.getToken();
    try {
      const res = await fetch(`${API_BASE_URL}/employees/${employeeId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token || ''}`,
          'x-company-id': currentCompanyId,
        },
        body: JSON.stringify({
          clientId: transferData.clientId || transferData.companyId,
          clientName: transferData.clientName || transferData.companyName,
          companyName: transferData.clientName || transferData.companyName,
          siteLocation: transferData.siteLocation || transferData.site,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to transfer employee');
      showToast('✓ Employee transferred successfully.', 'success');
      await fetchEmployees();
      setIsTransferOpen(false);
    } catch (err) {
      console.error('Error transferring employee:', err);
      showToast(err.message || 'Failed to transfer employee', 'error');
    }
  };

  return (
    <AdminLayout bgWhite>
      <div className={styles.container}>
        {/* Toast */}
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ message: '', type: 'success' })}
        />

        {/* Credentials Modal */}
        <EmployeeCredentialsModal
          isOpen={isCredentialsOpen}
          employee={credentialsEmployee}
          onClose={() => { setIsCredentialsOpen(false); setCredentialsEmployee(null); }}
          onSave={handleSaveCredentials}
        />

        {/* Transfer Modal */}
        <TransferEmployeeModal
          isOpen={isTransferOpen}
          employee={transferEmployee}
          onClose={() => { setIsTransferOpen(false); setTransferEmployee(null); }}
          onTransfer={handleTransfer}
          clients={clients}
        />

        {/* Payslip Modal */}
        <EmployeePayslipModal
          isOpen={isPayslipOpen}
          employee={payslipEmployee}
          onClose={() => { setIsPayslipOpen(false); setPayslipEmployee(null); }}
        />

        {/* Bulk Import Modal */}
        <EmployeeImportModal
          isOpen={isImportModalOpen}
          onClose={() => setIsImportModalOpen(false)}
          onImportSuccess={(result) => {
            fetchEmployees();
            setToast({
              message: result?.message || 'Employees successfully imported!',
              type: 'success',
              timestamp: Date.now()
            });
          }}
          activeCompanyId={activeCompany?._id || activeCompany?.companyId}
          activeCompanyName={activeCompany?.name}
          employeeCodeSeries={activeCompany?.employeeCodeSeries}
          clients={clients}
          departments={departments}
          designations={designations}
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
          onCancel={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
        />

        {/* Top Bar with Breadcrumb and Compact Action Buttons */}
        <div className={styles.topBar}>
          <div className={styles.breadcrumb} role="navigation" aria-label="Breadcrumb">
            <span className={styles.crumbLink} onClick={() => navigate('/admin/dashboard')}>
              Dashboard
            </span>
            <span className={styles.separator}>/</span>
            <span className={styles.crumbActive}>Employees</span>
          </div>

          <div className={styles.headerActions}>
            {canAdd('employees') && (
              <button
                className={styles.importBtn}
                onClick={() => setIsImportModalOpen(true)}
                aria-label="Bulk import employees"
              >
                <UploadCloud size={13} />
                <span>Import</span>
              </button>
            )}
            {canAdd('employees') && (
              <button
                className={styles.addBtn}
                onClick={() => navigate(addEmployeePath)}
                aria-label="Add a new employee"
              >
                <Plus size={13} />
                <span>Add Employee</span>
              </button>
            )}
          </div>
        </div>

        {/* Filters */}
        <EmployeeFilters
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          companyFilter={companyFilter}
          onCompanyFilterChange={setCompanyFilter}
          locationFilter={locationFilter}
          onLocationFilterChange={setLocationFilter}
          departmentFilter={departmentFilter}
          onDepartmentFilterChange={setDepartmentFilter}
          designationFilter={designationFilter}
          onDesignationFilterChange={setDesignationFilter}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          sortBy={sortBy}
          onSortChange={setSortBy}
          sortOrder={sortOrder}
          onSortOrderChange={setSortOrder}
          onResetFilters={handleResetFilters}
          clients={clients}
          locations={locationList}
          departments={departments}
          designations={designations}
        />

        {/* Table / Error / Pagination / Empty State */}
        {error ? (
          <div className={styles.errorState}>
            <p className={styles.errorMsg}>{error}</p>
            <button className={styles.retryBtn} onClick={fetchEmployees}>
              Try Again
            </button>
          </div>
        ) : !loading && employees.length === 0 ? (
          <div className={styles.emptyWrap}>
            <EmptyState
              icon={Users}
              title="No employees yet"
              description={`Add your first employee for ${activeCompany?.name || 'this company profile'}.`}
              actionLabel="+ Add Employee"
              onAction={() => navigate(addEmployeePath)}
            />
          </div>
        ) : (
          <>
            <EmployeeTable
              employees={paginatedEmployees}
              loading={loading}
              onAction={handleActionClick}
              onResetFilters={handleResetFilters}
              startIndex={(currentPage - 1) * ITEMS_PER_PAGE}
              clients={clients}
            />

            {!loading && sortedEmployees.length > 0 && (
              <Pagination
                currentPage={currentPage}
                totalItems={sortedEmployees.length}
                itemsPerPage={ITEMS_PER_PAGE}
                onPageChange={setCurrentPage}
                label="employees"
              />
            )}
          </>
        )}
      </div>
    </AdminLayout>
  );
}

export default Employees;
