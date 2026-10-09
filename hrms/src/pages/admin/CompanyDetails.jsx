import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Users, ClipboardCheck, CreditCard, Info, ArrowRight, Building2 } from 'lucide-react';
import styles from './CompanyDetails.module.css';

import AdminLayout from '../../components/layout/AdminLayout';
import CompanyDetailsHeader from '../../components/companies/CompanyDetailsHeader';
import CompanyOverview from '../../components/companies/CompanyOverview';
import CompanyForm from '../../components/companies/CompanyForm';
import ClientCredentialsModal from '../../components/companies/ClientCredentialsModal';
import ConfirmModal from '../../components/common/ConfirmModal';
import EmptyState from '../../components/common/EmptyState';
import Toast from '../../components/common/Toast';
import StatusBadge from '../../components/common/StatusBadge';

import { useCompany } from '../../context/CompanyContext';
import authService from '../../services/authService';
import clientService from '../../services/clientService';
import employeeService from '../../services/employeeService';

const API_BASE_URL = import.meta.env.VITE_API_URL;

function CompanyDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { activeCompany } = useCompany();

  const currentCompanyId = activeCompany?.companyId || activeCompany?.id;

  const [company, setCompany] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  // Form / Modal States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isCredentialsOpen, setIsCredentialsOpen] = useState(false);

  // Toast Notification state
  const [toast, setToast] = useState({ message: '', type: 'success' });

  // Fetch client details purely dynamically from API and company store
  const fetchClientDetails = useCallback(async () => {
    setLoading(true);
    setNotFound(false);
    let foundClient = null;

    // 1. Fetch live from backend database API
    try {
      if (currentCompanyId) {
        foundClient = await clientService.getClientById(currentCompanyId, id);
      }
    } catch (e) {
      console.warn('Direct client lookup failed, checking client list:', e);
    }

    if (!foundClient && currentCompanyId) {
      try {
        const allClients = await clientService.getClients(currentCompanyId);
        if (Array.isArray(allClients)) {
          foundClient = allClients.find((c) =>
            c && (c.id === id || c.clientId === id || c._id === id || String(c.id) === String(id))
          );
        }
      } catch (e) {
        console.warn('Could not fetch clients list:', e);
      }
    }

    // 2. Fallback to active company local cache if offline
    if (!foundClient) {
      try {
        const saved = localStorage.getItem(`novaspark_clients_${currentCompanyId}`);
        if (saved) {
          const list = JSON.parse(saved);
          if (Array.isArray(list)) {
            foundClient = list.find((c) =>
              c && (c.id === id || c.clientId === id || c._id === id || String(c.id) === String(id))
            );
          }
        }
      } catch (e) { }
    }

    if (foundClient) {
      setCompany(foundClient);
    } else {
      setNotFound(true);
    }

    // Fetch live workforce employees dynamically
    let empsList = [];
    try {
      if (currentCompanyId) {
        const liveEmps = await employeeService.getEmployees(currentCompanyId);
        if (Array.isArray(liveEmps)) {
          empsList = liveEmps;
        }
      }
    } catch (e) {
      try {
        const saved = localStorage.getItem(`novaspark_employees_${currentCompanyId}`);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) empsList = parsed;
        }
      } catch (_) {}
    }

    setEmployees(empsList);
    setLoading(false);
  }, [id, currentCompanyId]);

  useEffect(() => {
    fetchClientDetails();
  }, [fetchClientDetails]);

  // Sync back local company changes to Master list & backend
  const updateCompanyInMaster = async (updatedCompany) => {
    const targetId = updatedCompany._id || updatedCompany.id || updatedCompany.clientId;
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
          body: JSON.stringify(updatedCompany)
        });
      } catch (e) { }
    }

    const key = `novaspark_clients_${currentCompanyId}`;
    try {
      const saved = localStorage.getItem(key);
      if (saved) {
        const list = JSON.parse(saved);
        if (Array.isArray(list)) {
          const next = list.map((c) =>
            ((c._id && c._id === targetId) || c.id === targetId || c.clientId === targetId)
              ? updatedCompany
              : c
          );
          localStorage.setItem(key, JSON.stringify(next));
        }
      }
    } catch (e) { }
  };

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  const handleEditSubmit = async (formData) => {
    const updated = {
      ...company,
      ...formData
    };
    await updateCompanyInMaster(updated);
    setCompany(updated);
    setIsFormOpen(false);
    showToast('✓ Client updated successfully.', 'success');
  };

  const handleStatusToggle = () => {
    setIsConfirmOpen(true);
  };

  const handleConfirmStatusToggle = async () => {
    const nextStatus = company.status === 'active' ? 'inactive' : 'active';
    const updated = {
      ...company,
      status: nextStatus
    };
    await updateCompanyInMaster(updated);
    setCompany(updated);
    setIsConfirmOpen(false);
    showToast(
      `✓ Client ${nextStatus === 'active' ? 'activated' : 'deactivated'} successfully.`,
      'success'
    );
  };

  // Handle Save Credentials (Password & Portal Access)
  const handleSaveCredentials = async (targetClientId, credentialsData) => {
    const token = authService.getToken();
    const targetId = targetClientId || company?._id || company?.clientId || company?.id;
    if (token && targetId) {
      const res = await fetch(`${API_BASE_URL}/clients/${targetId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-company-id': currentCompanyId
        },
        body: JSON.stringify(credentialsData)
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to save client credentials');
      }
    }

    const updated = {
      ...company,
      ...credentialsData,
      savedPassword: credentialsData.password || company.savedPassword,
      password: credentialsData.password || company.savedPassword
    };
    setCompany(updated);
    await updateCompanyInMaster(updated);
    await fetchClientDetails();
    window.dispatchEvent(new CustomEvent('clients-updated'));
    showToast('✓ Client login credentials saved successfully.', 'success');
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className={styles.loadingWrapper}>
          <div className={styles.spinner} />
          <span>Loading client details...</span>
        </div>
      </AdminLayout>
    );
  }

  if (notFound || !company) {
    return (
      <AdminLayout>
        <div className={styles.container}>
          <EmptyState
            icon={Building2}
            title="Client Not Found"
            description="The requested client details could not be loaded or the client no longer exists."
            actionLabel="Back to Clients"
            onAction={() => navigate('/admin/clients')}
          />
        </div>
      </AdminLayout>
    );
  }

  const clientEmployees = employees.filter((e) =>
    e && (
      e.companyId === company.id ||
      e.companyId === company.clientId ||
      e.companyId === company._id ||
      e.clientId === company.id ||
      e.clientId === company.clientId ||
      e.clientId === company._id ||
      (e.clientName && company.name && e.clientName.toLowerCase() === company.name.toLowerCase()) ||
      (e.companyName && company.name && e.companyName.toLowerCase() === company.name.toLowerCase())
    )
  );

  const tabs = [
    { id: 'overview', name: 'Overview', icon: Info },
    { id: 'employees', name: 'Employees', icon: Users },
    { id: 'attendance', name: 'Attendance', icon: ClipboardCheck },
    { id: 'billing', name: 'Billing', icon: CreditCard }
  ];

  return (
    <AdminLayout>
      <div className={styles.container}>
        {/* Toast Alert */}
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ message: '', type: 'success' })}
        />

        {/* Modal Overlays */}
        <CompanyForm
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          onSubmit={handleEditSubmit}
          company={company}
        />

        <ClientCredentialsModal
          isOpen={isCredentialsOpen}
          client={company}
          onClose={() => setIsCredentialsOpen(false)}
          onSave={handleSaveCredentials}
        />

        <ConfirmModal
          isOpen={isConfirmOpen}
          title={company.status === 'active' ? 'Deactivate Client?' : 'Activate Client?'}
          description={
            company.status === 'active'
              ? `Are you sure you want to deactivate ${company.name}? The client will no longer be treated as an active client.`
              : `Are you sure you want to activate ${company.name}? This will restore the client to active state.`
          }
          confirmLabel={company.status === 'active' ? 'Deactivate' : 'Activate'}
          variant={company.status === 'active' ? 'danger' : 'primary'}
          onConfirm={handleConfirmStatusToggle}
          onCancel={() => setIsConfirmOpen(false)}
        />

        {/* Breadcrumbs */}
        <div className={styles.breadcrumb} role="navigation" aria-label="Breadcrumb">
          <span className={styles.crumbLink} onClick={() => navigate('/admin/dashboard')}>
            Dashboard
          </span>
          <span className={styles.separator}>/</span>
          <span className={styles.crumbLink} onClick={() => navigate('/admin/clients')}>
            Clients
          </span>
          <span className={styles.separator}>/</span>
          <span className={styles.crumbActive}>{company.name}</span>
        </div>

        {/* Profile Card Header */}
        <CompanyDetailsHeader
          company={company}
          onEdit={() => setIsFormOpen(true)}
          onToggleStatus={handleStatusToggle}
          onOpenCredentials={() => setIsCredentialsOpen(true)}
        />

        {/* Tabs switcher menu */}
        <div className={styles.tabsWrapper}>
          <div className={styles.tabsList} role="tablist">
            {tabs.map((tab) => {
              const TabIcon = tab.icon;
              return (
                <button
                  key={tab.id}
                  role="tab"
                  aria-selected={activeTab === tab.id}
                  className={`${styles.tabBtn} ${activeTab === tab.id ? styles.tabActive : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <TabIcon size={16} />
                  <span>{tab.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Dynamic Tab Panel content */}
        <div className={styles.tabPanel} role="tabpanel">
          {activeTab === 'overview' && (
            <CompanyOverview 
              company={{ 
                ...company, 
                employees: clientEmployees.length > 0 ? clientEmployees.length : (company.employees || 0) 
              }} 
            />
          )}

          {activeTab === 'employees' && (
            <div className={styles.employeesSection}>
              <div className={styles.sectionHeader}>
                <h3 className={styles.sectionTitle}>Workforce List ({clientEmployees.length})</h3>
                <button
                  className={styles.manageBtn}
                  onClick={() => navigate(`/admin/employees?companyId=${company.id || company.clientId || company._id}`)}
                >
                  <span>Manage Workforce</span>
                  <ArrowRight size={14} />
                </button>
              </div>

              {clientEmployees.length === 0 ? (
                <EmptyState
                  icon={Users}
                  title="No employees assigned"
                  description={`No active or inactive employees are currently assigned to ${company.name}.`}
                  actionLabel="Go to Employees Management"
                  onAction={() => navigate(`/admin/employees?companyId=${company.id || company.clientId || company._id}`)}
                />
              ) : (
                <div className={styles.tableWrapper}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Employee</th>
                        <th>ID</th>
                        <th>Department</th>
                        <th>Designation</th>
                        <th>Contact</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {clientEmployees.map((emp) => (
                        <tr
                          key={emp._id || emp.id || emp.employeeCode}
                          className={styles.clickableRow}
                          onClick={() => navigate(`/admin/employees/${emp._id || emp.id || emp.employeeCode}`)}
                        >
                          <td className={styles.empNameCell}>{emp.name}</td>
                          <td className={styles.empIdCell}>{emp.employeeId || emp.employeeCode}</td>
                          <td>{emp.department || '—'}</td>
                          <td>{emp.designation || '—'}</td>
                          <td>{emp.contact || emp.mobile || '—'}</td>
                          <td>
                            <StatusBadge status={emp.status} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'attendance' && (
            <EmptyState
              icon={ClipboardCheck}
              title="Attendance Records"
              description="Daily workforce attendance reports and logs will show up in this space."
            />
          )}

          {activeTab === 'billing' && (
            <EmptyState
              icon={CreditCard}
              title="Billing & Invoicing"
              description="Invoices, payroll charge slips, and contracting billing statements will be accessible here."
            />
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

export default CompanyDetails;
