import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Users, ClipboardCheck, CreditCard, Info, ArrowRight, Building2 } from 'lucide-react';
import styles from './CompanyDetails.module.css';

import AdminLayout from '../../components/layout/AdminLayout';
import CompanyDetailsHeader from '../../components/companies/CompanyDetailsHeader';
import CompanyOverview from '../../components/companies/CompanyOverview';
import CompanyForm from '../../components/companies/CompanyForm';
import ConfirmModal from '../../components/common/ConfirmModal';
import EmptyState from '../../components/common/EmptyState';
import Toast from '../../components/common/Toast';
import StatusBadge from '../../components/common/StatusBadge';

import { useCompany } from '../../context/CompanyContext';
import authService from '../../services/authService';
import { mockCompanies } from '../../data/companyData';
import { mockEmployees } from '../../data/employeeData';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://backendhrmspayroll.bhoomitechzone.shop/api';

function CompanyDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { activeCompany } = useCompany();

  const currentCompanyId = activeCompany?.companyId || activeCompany?.id || 'RRS8392014SEC';

  const [company, setCompany] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  // Form / Modal States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  // Toast Notification state
  const [toast, setToast] = useState({ message: '', type: 'success' });

  // Fetch client details from API and local storage
  const fetchClientDetails = useCallback(async () => {
    setLoading(true);
    setNotFound(false);
    let foundClient = null;

    // 1. Try local storage for fast render
    try {
      const keys = [
        `novaspark_clients_${currentCompanyId}`,
        'novaspark_companies',
        'novaspark_clients'
      ];
      for (const key of keys) {
        const saved = localStorage.getItem(key);
        if (saved) {
          const list = JSON.parse(saved);
          if (Array.isArray(list)) {
            const match = list.find((c) =>
              c && (c.id === id || c.clientId === id || c._id === id || String(c.id) === String(id))
            );
            if (match) {
              foundClient = match;
              break;
            }
          }
        }
      }
      if (!foundClient) {
        const matchMock = mockCompanies.find((c) => c.id === id || c.clientId === id);
        if (matchMock) foundClient = matchMock;
      }
    } catch (e) { }

    // 2. Fetch from backend API
    const token = authService.getToken();
    if (token) {
      try {
        const res = await fetch(`${API_BASE_URL}/clients/${id}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'x-company-id': currentCompanyId
          }
        });
        if (res.ok) {
          const data = await res.json();
          if (data.client) {
            foundClient = data.client;
          }
        } else {
          // Try fetching all clients and searching
          const allRes = await fetch(`${API_BASE_URL}/clients`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'x-company-id': currentCompanyId
            }
          });
          if (allRes.ok) {
            const allData = await allRes.json();
            const list = allData.clients || allData;
            if (Array.isArray(list)) {
              const match = list.find((c) =>
                c && (c.id === id || c.clientId === id || c._id === id || String(c.id) === String(id))
              );
              if (match) foundClient = match;
            }
          }
        }
      } catch (e) { }
    }

    if (foundClient) {
      setCompany(foundClient);
    } else {
      setNotFound(true);
    }

    // Also fetch employees
    let empsList = [];
    try {
      const empKeys = [
        `novaspark_employees_${currentCompanyId}`,
        'novaspark_employees'
      ];
      for (const key of empKeys) {
        const saved = localStorage.getItem(key);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            empsList = parsed;
            break;
          }
        }
      }
      if (empsList.length === 0) empsList = mockEmployees;
    } catch (e) { }

    if (token) {
      try {
        const empRes = await fetch(`${API_BASE_URL}/employees`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'x-company-id': currentCompanyId
          }
        });
        if (empRes.ok) {
          const empData = await empRes.json();
          if (Array.isArray(empData.employees || empData)) {
            empsList = empData.employees || empData;
          }
        }
      } catch (e) { }
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
          {activeTab === 'overview' && <CompanyOverview company={company} />}

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
