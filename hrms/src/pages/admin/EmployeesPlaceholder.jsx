import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Users, ArrowLeft } from 'lucide-react';
import AdminLayout from '../../components/layout/AdminLayout';
import EmptyState from '../../components/common/EmptyState';
import styles from './Companies.module.css';

function EmployeesPlaceholder() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const companyId = searchParams.get('companyId');

  return (
    <AdminLayout>
      <div className={styles.container}>
        <div className={styles.breadcrumb}>
          <span className={styles.crumbLink} onClick={() => navigate('/admin/dashboard')}>
            Dashboard
          </span>
          <span className={styles.separator}>/</span>
          <span className={styles.crumbLink} onClick={() => navigate('/admin/clients')}>
            Clients
          </span>
          <span className={styles.separator}>/</span>
          <span className={styles.crumbActive}>Employees</span>
        </div>

        <button 
          className={styles.resetBtn} 
          onClick={() => navigate('/admin/clients')}
          style={{ marginBottom: '24px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
        >
          <ArrowLeft size={16} />
          <span>Back to Clients</span>
        </button>

        <EmptyState
          icon={Users}
          title="Employees List Placeholder"
          description={`Workforce profiles${companyId ? ` for Client ID: ${companyId}` : ''} will be available here when the Employee Management module is integrated.`}
          actionLabel="Go to Clients"
          onAction={() => navigate('/admin/clients')}
        />
      </div>
    </AdminLayout>
  );
}

export default EmployeesPlaceholder;
