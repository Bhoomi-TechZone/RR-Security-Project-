import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import AdminLayout from '../../components/layout/AdminLayout';
import CompanyForm from '../../components/companies/CompanyForm';
import Toast from '../../components/common/Toast';
import { useCompany } from '../../context/CompanyContext';
import { authService } from '../../services/authService';
import styles from './Companies.module.css';

const API_BASE_URL = import.meta.env.VITE_API_URL;

/**
 * AddClient Page
 * Dedicated full-page workflow for adding a new client company (no quick navigation).
 */
function AddClient() {
  const navigate = useNavigate();
  const location = useLocation();
  const { activeCompany } = useCompany();
  const isUserPanel = location.pathname.startsWith('/user');
  const basePath = isUserPanel ? '/user/clients' : '/admin/clients';

  const currentCompanyId = activeCompany?.companyId || activeCompany?.id || '';

  const [toast, setToast] = useState({ message: '', type: 'success' });

  const handleSubmit = async (formData) => {
    const token = authService.getToken();
    try {
      let createdClient = null;

      if (token) {
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
        if (!res.ok) {
          throw new Error(data.message || 'Failed to create client');
        }
        createdClient = data.client;
      }

      if (!createdClient) {
        createdClient = {
          id: formData.clientId || `CLI-${Date.now().toString().slice(-4)}`,
          clientId: formData.clientId || `CLI-${Date.now().toString().slice(-4)}`,
          companyId: currentCompanyId,
          companyName: activeCompany?.name || 'Company Profile',
          employees: 0,
          ...formData
        };
      }

      // Sync local storage cache
      try {
        const stored = localStorage.getItem(`novaspark_clients_${currentCompanyId}`);
        const parsed = stored ? JSON.parse(stored) : [];
        const next = [createdClient, ...parsed.filter((c) => (c.id || c.clientId) !== (createdClient.id || createdClient.clientId))];
        localStorage.setItem(`novaspark_clients_${currentCompanyId}`, JSON.stringify(next));
      } catch (e) {}

      window.dispatchEvent(new CustomEvent('clients-updated'));
      setToast({ message: `✓ Client "${createdClient.name || 'New Client'}" added successfully!`, type: 'success' });

      setTimeout(() => {
        navigate(basePath);
      }, 1000);
    } catch (err) {
      console.error('Error creating client:', err);
      setToast({ message: err.message || 'Failed to create client.', type: 'error' });
      throw err;
    }
  };

  const handleClose = () => {
    navigate(basePath);
  };

  return (
    <AdminLayout>
      <div className={styles.container}>
        {/* Toast Notification */}
        {toast.message && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast({ message: '', type: 'success' })}
          />
        )}

        {/* Breadcrumb Navigation */}
        <nav className={styles.breadcrumb} aria-label="Breadcrumb">
          <Link to={isUserPanel ? "/user/dashboard" : "/admin/dashboard"} className={styles.crumbLink}>
            Dashboard
          </Link>
          <span className={styles.separator}>/</span>
          <span className={styles.crumbLink}>Workforce</span>
          <span className={styles.separator}>/</span>
          <Link to={basePath} className={styles.crumbLink}>
            Clients
          </Link>
          <span className={styles.separator}>/</span>
          <span className={styles.crumbActive}>Add Client</span>
        </nav>

        {/* Full-Page Client Form (isPageMode=true, no quick navigation) */}
        <CompanyForm
          isOpen={true}
          isPageMode={true}
          onClose={handleClose}
          onSubmit={handleSubmit}
          company={null}
        />
      </div>
    </AdminLayout>
  );
}

export default AddClient;
