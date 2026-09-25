import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Plus } from 'lucide-react';
import styles from './Companies.module.css';

import AdminLayout from '../../components/layout/AdminLayout';
import CompanySummaryCards from '../../components/companies/CompanySummaryCards';
import CompanyFilters from '../../components/companies/CompanyFilters';
import CompanyTable from '../../components/companies/CompanyTable';
import CompanyForm from '../../components/companies/CompanyForm';
import ConfirmModal from '../../components/common/ConfirmModal';
import Pagination from '../../components/common/Pagination';
import Toast from '../../components/common/Toast';

import { useCompany } from '../../context/CompanyContext';
import authService from '../../services/authService';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

function Companies() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { activeCompany } = useCompany();

  const currentCompanyId = activeCompany?.companyId || activeCompany?.id || 'RRS8392014SEC';

  // 100% Dynamic State — No static mock data
  const [companies, setCompanies] = useState(() => {
    const key = `novaspark_clients_${currentCompanyId}`;
    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {}
    }
    return [];
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState(() => searchParams.get('status') || 'all');
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Form Modal States
  const [isFormOpen, setIsFormOpen] = useState(() => searchParams.get('action') === 'add');
  const [editingCompany, setEditingCompany] = useState(null);

  // Sync with searchParams when route/query changes
  useEffect(() => {
    const urlStatus = searchParams.get('status');
    if (urlStatus) {
      setStatusFilter(urlStatus);
    } else {
      setStatusFilter('all');
    }

    if (searchParams.get('action') === 'add') {
      setEditingCompany(null);
      setIsFormOpen(true);
    }
  }, [searchParams]);

  // Confirm Modal States
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    description: '',
    confirmLabel: '',
    variant: 'danger',
    company: null,
    actionType: null // 'activate' | 'deactivate'
  });

  // Toast notification state
  const [toast, setToast] = useState({ message: '', type: 'success' });

  const itemsPerPage = 8;

  // Fetch clients dynamically from Backend API for current company profile
  const fetchBackendClients = useCallback(async () => {
    const token = authService.getToken();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE_URL}/clients`, {
        headers: {
          'Authorization': `Bearer ${token || ''}`,
          'x-company-id': currentCompanyId
        }
      });

      if (res.ok) {
        const data = await res.json();
        const clientList = Array.isArray(data.clients) ? data.clients : [];
        setCompanies(clientList);
        localStorage.setItem(`novaspark_clients_${currentCompanyId}`, JSON.stringify(clientList));
      } else {
        const errData = await res.json().catch(() => ({}));
        // If no clients found in backend, fall back to local store for this company
        const key = `novaspark_clients_${currentCompanyId}`;
        const saved = localStorage.getItem(key);
        if (saved) {
          try {
            setCompanies(JSON.parse(saved));
          } catch (e) {
            setCompanies([]);
          }
        } else {
          setCompanies([]);
        }
        if (res.status !== 404 && res.status !== 400) {
          setError(errData.message || 'Failed to load clients.');
        }
      }
    } catch (err) {
      // Offline fallback to company storage
      const key = `novaspark_clients_${currentCompanyId}`;
      const saved = localStorage.getItem(key);
      if (saved) {
        try {
          setCompanies(JSON.parse(saved));
        } catch (e) {
          setCompanies([]);
        }
      } else {
        setCompanies([]);
      }
    } finally {
      setLoading(false);
    }
  }, [currentCompanyId]);

  // Fetch when company profile changes
  useEffect(() => {
    fetchBackendClients();
  }, [fetchBackendClients]);

  // Handle Toast Trigger helper
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  // Reset all filters
  const handleResetFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setCurrentPage(1);
    showToast('Filters reset successfully.', 'success');
  };

  // Filter companies based on search and status
  const filteredCompanies = companies.filter((c) => {
    if (!c || !c.name) return false;
    const matchesSearch =
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.gstin && c.gstin.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (c.contactPerson && c.contactPerson.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus =
      statusFilter === 'all' || (c.status && c.status.toLowerCase() === statusFilter.toLowerCase());

    return matchesSearch && matchesStatus;
  });

  // Pagination bounds
  const paginatedCompanies = filteredCompanies.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Trigger page change reset on filters search
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  // Handle Form actions (add or edit submit)
  const handleFormSubmit = async (formData) => {
    const token = authService.getToken();

    if (editingCompany) {
      // Edit mode
      const targetId = editingCompany._id || editingCompany.id || editingCompany.clientId;
      const updatedClient = {
        ...editingCompany,
        ...formData,
        companyId: currentCompanyId
      };

      if (token && targetId) {
        try {
          await fetch(`${API_BASE_URL}/clients/${targetId}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
              'x-company-id': currentCompanyId
            },
            body: JSON.stringify(formData)
          });
        } catch (e) {}
      }

      setCompanies((prev) => {
        const next = prev.map((c) =>
          ((c._id && c._id === targetId) || c.id === targetId || c.clientId === targetId)
            ? updatedClient
            : c
        );
        localStorage.setItem(`novaspark_clients_${currentCompanyId}`, JSON.stringify(next));
        return next;
      });

      showToast(`✓ Client "${formData.name}" updated successfully.`, 'success');
    } else {
      // Add mode
      const localId = `CLI-${Date.now().toString().slice(-6)}`;
      let newClient = {
        id: localId,
        clientId: localId,
        companyId: currentCompanyId,
        companyName: activeCompany?.name || 'Company Profile',
        employees: 0,
        ...formData
      };

      if (token) {
        try {
          const res = await fetch(`${API_BASE_URL}/clients`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
              'x-company-id': currentCompanyId
            },
            body: JSON.stringify({
              ...formData,
              companyId: currentCompanyId
            })
          });
          const data = await res.json();
          if (res.ok && data.client) {
            newClient = data.client;
          }
        } catch (e) {}
      }

      setCompanies((prev) => {
        const next = [newClient, ...prev];
        localStorage.setItem(`novaspark_clients_${currentCompanyId}`, JSON.stringify(next));
        return next;
      });

      showToast(`✓ Client "${newClient.name}" created for ${activeCompany?.name || 'Company'}!`, 'success');
    }

    setIsFormOpen(false);
    setEditingCompany(null);
  };

  // Handle single action menu choices
  const handleActionClick = (actionType, company) => {
    if (actionType === 'view') {
      navigate(`/admin/clients/${company.id || company.clientId || company._id}`);
    } else if (actionType === 'edit') {
      setEditingCompany(company);
      setIsFormOpen(true);
    } else if (actionType === 'employees') {
      navigate(`/admin/employees?companyId=${company.id || company.clientId || company._id}`);
    } else if (actionType === 'deactivate') {
      setConfirmModal({
        isOpen: true,
        title: 'Deactivate Client?',
        description: `Are you sure you want to deactivate ${company.name}? The client will no longer be treated as an active client.`,
        confirmLabel: 'Deactivate',
        variant: 'danger',
        company,
        actionType: 'deactivate'
      });
    } else if (actionType === 'activate') {
      setConfirmModal({
        isOpen: true,
        title: 'Activate Client?',
        description: `Are you sure you want to activate ${company.name}? This will restore the client to active state.`,
        confirmLabel: 'Activate',
        variant: 'primary',
        company,
        actionType: 'activate'
      });
    }
  };

  // Confirm dialog primary execution
  const handleConfirmAction = async () => {
    const { company, actionType } = confirmModal;
    if (!company) return;

    const newStatus = actionType === 'deactivate' ? 'inactive' : 'active';
    const targetId = company._id || company.id || company.clientId;
    const token = authService.getToken();

    if (token && targetId) {
      try {
        await fetch(`${API_BASE_URL}/clients/${targetId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'x-company-id': currentCompanyId
          },
          body: JSON.stringify({ status: newStatus })
        });
      } catch (e) {}
    }

    setCompanies((prev) => {
      const next = prev.map((c) =>
        ((c._id && c._id === targetId) || c.id === targetId || c.clientId === targetId)
          ? { ...c, status: newStatus }
          : c
      );
      localStorage.setItem(`novaspark_clients_${currentCompanyId}`, JSON.stringify(next));
      return next;
    });

    showToast(`✓ Client ${actionType === 'deactivate' ? 'deactivated' : 'activated'} successfully.`, 'success');

    setConfirmModal({
      isOpen: false,
      title: '',
      description: '',
      confirmLabel: '',
      variant: 'danger',
      company: null,
      actionType: null
    });
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

        {/* Modal / Dialog triggers */}
        <CompanyForm
          isOpen={isFormOpen}
          onClose={() => {
            setIsFormOpen(false);
            setEditingCompany(null);
          }}
          onSubmit={handleFormSubmit}
          company={editingCompany}
        />

        <ConfirmModal
          isOpen={confirmModal.isOpen}
          title={confirmModal.title}
          description={confirmModal.description}
          confirmLabel={confirmModal.confirmLabel}
          variant={confirmModal.variant}
          onConfirm={handleConfirmAction}
          onCancel={() =>
            setConfirmModal((prev) => ({ ...prev, isOpen: false }))
          }
        />

        {/* Breadcrumb nav header */}
        <div className={styles.breadcrumb} role="navigation" aria-label="Breadcrumb">
          <span className={styles.crumbLink} onClick={() => navigate('/admin/dashboard')}>
            Dashboard
          </span>
          <span className={styles.separator}>/</span>
          <span className={styles.crumbActive}>Clients</span>
        </div>

        {/* Page Header block */}
        <header className={styles.header}>
          <div className={styles.titleArea}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h1 className={styles.title}>Clients</h1>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: '700',
                  color: '#1d4ed8',
                  background: '#eff6ff',
                  border: '1px solid #bfdbfe',
                  padding: '3px 9px',
                  borderRadius: '6px',
                  letterSpacing: '0.04em'
                }}
                title={`Company Profile ID: ${currentCompanyId}`}
              >
                {activeCompany?.name || 'RR Security'} ({currentCompanyId})
              </span>
            </div>
            <p className={styles.description}>
              Manage client companies and workforce assigned to <strong>{activeCompany?.name || 'this company'}</strong>.
            </p>
          </div>
          <button
            className={styles.addBtn}
            onClick={() => {
              setEditingCompany(null);
              setIsFormOpen(true);
            }}
            aria-label="Add a new client"
          >
            <Plus size={16} />
            <span>Add Client</span>
          </button>
        </header>

        {/* Statistics Cards */}
        <CompanySummaryCards companies={companies} />

        {/* Filters and Search toolbar */}
        <CompanyFilters
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          onResetFilters={handleResetFilters}
          activeCount={companies.filter((c) => c.status === 'active').length}
          inactiveCount={companies.filter((c) => c.status === 'inactive').length}
        />

        {/* Table representation */}
        <CompanyTable
          companies={paginatedCompanies}
          loading={loading}
          error={error}
          onRetry={() => fetchBackendClients()}
          onAction={handleActionClick}
          onResetFilters={handleResetFilters}
        />

        {/* Bottom Pagination */}
        {filteredCompanies.length > itemsPerPage && (
          <Pagination
            currentPage={currentPage}
            totalPages={Math.ceil(filteredCompanies.length / itemsPerPage)}
            onPageChange={setCurrentPage}
            totalItems={filteredCompanies.length}
            itemsPerPage={itemsPerPage}
          />
        )}
      </div>
    </AdminLayout>
  );
}

export default Companies;
