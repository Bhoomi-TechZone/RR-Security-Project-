import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, Users } from 'lucide-react';
import styles from './Employees.module.css';

import AdminLayout from '../../components/layout/AdminLayout';
import EmployeeSummaryCards from '../../components/employees/EmployeeSummaryCards';
import EmployeeFilters from '../../components/employees/EmployeeFilters';
import EmployeeTable from '../../components/employees/EmployeeTable';
import EmployeeForm from '../../components/employees/EmployeeForm';
import TransferEmployeeModal from '../../components/employees/TransferEmployeeModal';
import ConfirmModal from '../../components/common/ConfirmModal';
import Pagination from '../../components/common/Pagination';
import Toast from '../../components/common/Toast';
import EmptyState from '../../components/common/EmptyState';

import { useCompany } from '../../context/CompanyContext';
import { authService } from '../../services/authService';
import { downloadEmployeeProfile } from '../../utils/employeeProfileExport';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://backendhrmspayroll.bhoomitechzone.shop/api';
const ITEMS_PER_PAGE = 10;

function Employees() {
  const navigate = useNavigate();
  const { activeCompany } = useCompany();

  const [employees, setEmployees] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchParams] = useSearchParams();
  const companyIdParam = searchParams.get('companyId');

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [companyFilter, setCompanyFilter] = useState(companyIdParam || 'all');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [designationFilter, setDesignationFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState(() => searchParams.get('status') || 'all');
  const [currentPage, setCurrentPage] = useState(1);

  // Form / Modal State
  const [isFormOpen, setIsFormOpen] = useState(() => searchParams.get('action') === 'add');
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [transferEmployee, setTransferEmployee] = useState(null);
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    description: '',
    confirmLabel: '',
    variant: 'danger',
    employee: null,
    actionType: null,
  });

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
      setEditingEmployee(null);
      setIsFormOpen(true);
    }
  }, [searchParams, companyIdParam]);

  const currentCompanyId = activeCompany?.companyId || activeCompany?.id || '';

  // Fetch employees strictly isolated for active company
  const fetchEmployees = useCallback(async () => {
    if (!currentCompanyId) return;
    setLoading(true);
    setError(null);
    try {
      const token = authService.getToken();
      const res = await fetch(`${API_BASE_URL}/employees`, {
        headers: {
          'Authorization': `Bearer ${token || ''}`,
          'x-company-id': currentCompanyId,
        },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setEmployees(data.employees || []);
      } else {
        setEmployees([]);
        if (!res.ok && res.status !== 404) {
          setError(data.message || 'Failed to fetch employees');
        }
      }
    } catch (err) {
      console.error('Error fetching employees:', err);
      setError(err.message || 'Network error while fetching employees');
    } finally {
      setLoading(false);
    }
  }, [currentCompanyId]);

  // Fetch clients for current active company to populate client dropdowns
  const fetchClients = useCallback(async () => {
    if (!currentCompanyId) return;
    try {
      const token = authService.getToken();
      const res = await fetch(`${API_BASE_URL}/clients`, {
        headers: {
          'Authorization': `Bearer ${token || ''}`,
          'x-company-id': currentCompanyId,
        },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setClients(data.clients || []);
      }
    } catch (err) {
      console.error('Error fetching clients for employees page:', err);
    }
  }, [currentCompanyId]);

  useEffect(() => {
    fetchEmployees();
    fetchClients();
  }, [fetchEmployees, fetchClients]);

  const handleResetFilters = () => {
    setSearchTerm('');
    setCompanyFilter('all');
    setDepartmentFilter('all');
    setDesignationFilter('all');
    setStatusFilter('all');
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

    const matchesDept = departmentFilter === 'all' || e.department === departmentFilter;
    const matchesDesg = designationFilter === 'all' || e.designation === designationFilter;
    const matchesStatus =
      statusFilter === 'all' ||
      (e.status && e.status.toLowerCase() === statusFilter.toLowerCase());

    return matchesSearch && matchesCompany && matchesDept && matchesDesg && matchesStatus;
  });

  // Pagination
  const paginatedEmployees = filteredEmployees.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Reset page on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, companyFilter, departmentFilter, designationFilter, statusFilter]);

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
      navigate(`/admin/employees/${employee.id || employee._id || employee.employeeId}`);
    } else if (actionType === 'edit') {
      setEditingEmployee(employee);
      setIsFormOpen(true);
    } else if (actionType === 'transfer') {
      setTransferEmployee(employee);
      setIsTransferOpen(true);
    } else if (actionType === 'download') {
      downloadEmployeeProfile(employee, activeCompany);
    } else if (actionType === 'deactivate') {
      setConfirmModal({
        isOpen: true,
        title: 'Deactivate Employee?',
        description: `Are you sure you want to deactivate ${employee.name}? The employee will be marked as Inactive.`,
        confirmLabel: 'Deactivate',
        variant: 'danger',
        employee,
        actionType: 'deactivate',
      });
    } else if (actionType === 'activate') {
      setConfirmModal({
        isOpen: true,
        title: 'Activate Employee?',
        description: `Are you sure you want to activate ${employee.name}? The employee will be restored to Active status.`,
        confirmLabel: 'Activate',
        variant: 'primary',
        employee,
        actionType: 'activate',
      });
    }
  };

  // Confirm activate / deactivate action
  const handleConfirmAction = async () => {
    const { employee, actionType } = confirmModal;
    if (!employee) return;
    const token = authService.getToken();
    const newStatus = actionType === 'deactivate' ? 'Inactive' : 'Active';
    try {
      const empId = employee.id || employee._id || employee.employeeId;
      const res = await fetch(`${API_BASE_URL}/employees/${empId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token || ''}`,
          'x-company-id': currentCompanyId,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to update employee status');
      showToast(
        actionType === 'deactivate'
          ? '✓ Employee deactivated successfully.'
          : '✓ Employee activated successfully.',
        'success'
      );
      await fetchEmployees();
    } catch (err) {
      console.error('Error changing employee status:', err);
      showToast(err.message || 'Failed to update status', 'error');
    } finally {
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
    <AdminLayout>
      <div className={styles.container}>
        {/* Toast */}
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ message: '', type: 'success' })}
        />

        {/* Add/Edit Form */}
        <EmployeeForm
          isOpen={isFormOpen}
          onClose={() => { setIsFormOpen(false); setEditingEmployee(null); }}
          onSubmit={handleFormSubmit}
          employee={editingEmployee}
          clients={clients}
          employeesCount={employees.length}
        />

        {/* Transfer Modal */}
        <TransferEmployeeModal
          isOpen={isTransferOpen}
          employee={transferEmployee}
          onClose={() => { setIsTransferOpen(false); setTransferEmployee(null); }}
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
          onCancel={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
        />

        {/* Breadcrumb */}
        <div className={styles.breadcrumb} role="navigation" aria-label="Breadcrumb">
          <span className={styles.crumbLink} onClick={() => navigate('/admin/dashboard')}>
            Dashboard
          </span>
          <span className={styles.separator}>/</span>
          <span className={styles.crumbActive}>Employees</span>
        </div>

        {/* Page Header */}
        <header className={styles.header}>
          <div className={styles.titleArea}>
            <h1 className={styles.title}>Employees</h1>
            <p className={styles.description}>Manage employees across your client companies for {activeCompany?.name || 'Company Profile'}.</p>
          </div>
          <button
            className={styles.addBtn}
            onClick={() => { setEditingEmployee(null); setIsFormOpen(true); }}
            aria-label="Add a new employee"
          >
            <Plus size={16} />
            <span>Add Employee</span>
          </button>
        </header>

        {/* Summary Cards */}
        <EmployeeSummaryCards employees={employees} />

        {/* Filters */}
        <EmployeeFilters
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          companyFilter={companyFilter}
          onCompanyFilterChange={setCompanyFilter}
          departmentFilter={departmentFilter}
          onDepartmentFilterChange={setDepartmentFilter}
          designationFilter={designationFilter}
          onDesignationFilterChange={setDesignationFilter}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          onResetFilters={handleResetFilters}
          clients={clients}
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
              onAction={() => setIsFormOpen(true)}
            />
          </div>
        ) : (
          <>
            <EmployeeTable
              employees={paginatedEmployees}
              loading={loading}
              onAction={handleActionClick}
              onResetFilters={handleResetFilters}
            />

            {!loading && filteredEmployees.length > 0 && (
              <Pagination
                currentPage={currentPage}
                totalItems={filteredEmployees.length}
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
