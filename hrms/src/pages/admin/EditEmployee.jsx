import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/layout/AdminLayout';
import EmployeeForm from '../../components/employees/EmployeeForm';
import Toast from '../../components/common/Toast';
import { useCompany } from '../../context/CompanyContext';
import { authService } from '../../services/authService';
import styles from './EmployeeDetails.module.css';

const API_BASE_URL = import.meta.env.VITE_API_URL;

/**
 * EditEmployee Page
 * Loads the employee by ID from MongoDB and saves updates directly to backend API.
 */
function EditEmployee() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { activeCompany } = useCompany();
  const currentCompanyId = activeCompany?.companyId || activeCompany?.id || '';

  const [employee, setEmployee] = useState(null);
  const [toast, setToast] = useState({ message: '', type: 'success' });

  useEffect(() => {
    const fetchEmployee = async () => {
      try {
        const token = authService.getToken();
        const res = await fetch(`${API_BASE_URL}/employees/${id}`, {
          headers: {
            'Authorization': `Bearer ${token || ''}`,
            'x-company-id': currentCompanyId
          }
        });
        const data = await res.json();
        if (res.ok && data.success && data.employee) {
          setEmployee(data.employee);
        } else {
          setToast({ message: data.message || 'Employee not found.', type: 'error' });
          setTimeout(() => navigate('/admin/employees'), 1500);
        }
      } catch (err) {
        console.error('Error fetching employee:', err);
        setToast({ message: 'Failed to load employee details.', type: 'error' });
      }
    };

    if (id) {
      fetchEmployee();
    }
  }, [id, currentCompanyId, navigate]);

  const handleSubmit = async (formData) => {
    try {
      const token = authService.getToken();
      const res = await fetch(`${API_BASE_URL}/employees/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token || ''}`,
          'x-company-id': currentCompanyId
        },
        body: JSON.stringify({
          ...formData,
          companyId: currentCompanyId
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to update employee in database');
      }

      setToast({ message: '✓ Employee updated successfully in database.', type: 'success' });
      setTimeout(() => navigate(`/admin/employees/${id}`), 1000);
    } catch (err) {
      console.error('Error updating employee:', err);
      setToast({ message: err.message || 'Failed to update employee.', type: 'error' });
    }
  };

  if (!employee) {
    return (
      <AdminLayout>
        <div className={styles.loadingWrapper}>
          <div className={styles.spinner} />
          <span>Loading employee from database...</span>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <Toast
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ message: '', type: 'success' })}
      />
      <EmployeeForm
        isOpen={true}
        onClose={() => navigate(`/admin/employees/${id}`)}
        onSubmit={handleSubmit}
        employee={employee}
      />
    </AdminLayout>
  );
}

export default EditEmployee;
