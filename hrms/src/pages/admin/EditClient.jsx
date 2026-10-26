import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import AdminLayout from '../../components/layout/AdminLayout';
import CompanyForm from '../../components/companies/CompanyForm';
import Toast from '../../components/common/Toast';
import { useCompany } from '../../context/CompanyContext';
import { authService } from '../../services/authService';
import clientService from '../../services/clientService';
import styles from './Companies.module.css';

const API_BASE_URL = import.meta.env.VITE_API_URL;

/**
 * EditClient Page
 * Dedicated full-page workflow for editing an existing client company.
 */
function EditClient() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { activeCompany } = useCompany();
  const isUserPanel = location.pathname.startsWith('/user');
  const basePath = isUserPanel ? '/user/clients' : '/admin/clients';

  const currentCompanyId = activeCompany?.companyId || activeCompany?.id || '';

  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ message: '', type: 'success' });

  useEffect(() => {
    let isMounted = true;
    const fetchClient = async () => {
      try {
        setLoading(true);
        // Try fetching via clientService or direct API
        const token = authService.getToken();
        let clientData = null;

        if (token) {
          try {
            const res = await fetch(`${API_BASE_URL}/clients/${id}`, {
              headers: {
                'Authorization': `Bearer ${token}`,
                'x-company-id': currentCompanyId
              }
            });
            const data = await res.json();
            if (res.ok && data.client) {
              clientData = data.client;
            }
          } catch (e) {}
        }

        // Fallback to localStorage if not found on server
        if (!clientData && currentCompanyId) {
          try {
            const stored = localStorage.getItem(`novaspark_clients_${currentCompanyId}`);
            if (stored) {
              const list = JSON.parse(stored);
              clientData = list.find((c) => (c.id || c.clientId || c._id) === id);
            }
          } catch (e) {}
        }

        if (isMounted) {
          if (clientData) {
            setCompany(clientData);
          } else {
            setToast({ message: 'Client not found.', type: 'error' });
            setTimeout(() => navigate(basePath), 1500);
          }
        }
      } catch (err) {
        if (isMounted) {
          setToast({ message: 'Error loading client details.', type: 'error' });
          setTimeout(() => navigate(basePath), 1500);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    if (id) {
      fetchClient();
    }
    return () => { isMounted = false; };
  }, [id, currentCompanyId, basePath, navigate]);

  const handleSubmit = async (formData) => {
    const token = authService.getToken();
    const clientKey = company?.id || company?.clientId || company?._id || id;
    try {
      let updatedClient = null;

      if (token) {
        const res = await fetch(`${API_BASE_URL}/clients/${clientKey}`, {
          method: 'PUT',
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
          throw new Error(data.message || 'Failed to update client');
        }
        updatedClient = data.client;
      }

      if (!updatedClient) {
        updatedClient = {
          ...company,
          ...formData,
          companyId: currentCompanyId
        };
      }

      // Sync local storage cache
      try {
        const stored = localStorage.getItem(`novaspark_clients_${currentCompanyId}`);
        const parsed = stored ? JSON.parse(stored) : [];
        const next = parsed.map((c) => 
          ((c.id || c.clientId || c._id) === clientKey) ? updatedClient : c
        );
        localStorage.setItem(`novaspark_clients_${currentCompanyId}`, JSON.stringify(next));
      } catch (e) {}

      window.dispatchEvent(new CustomEvent('clients-updated'));
      setToast({ message: `✓ Client "${updatedClient.name || 'Client'}" updated successfully!`, type: 'success' });

      setTimeout(() => {
        navigate(basePath);
      }, 1000);
    } catch (err) {
      console.error('Error updating client:', err);
      setToast({ message: err.message || 'Failed to update client.', type: 'error' });
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
          <span className={styles.crumbActive}>{company?.name || 'Edit Client'}</span>
        </nav>

        {/* Full-Page Client Form */}
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
            Loading client details...
          </div>
        ) : company ? (
          <CompanyForm
            isOpen={true}
            isPageMode={true}
            onClose={handleClose}
            onSubmit={handleSubmit}
            company={company}
          />
        ) : null}
      </div>
    </AdminLayout>
  );
}

export default EditClient;
