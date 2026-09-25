import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/layout/AdminLayout';
import EmployeeForm from '../../components/employees/EmployeeForm';
import Toast from '../../components/common/Toast';
import { mockEmployees } from '../../data/employeeData';
import styles from './EmployeeDetails.module.css';

/**
 * EditEmployee Page
 * Loads the employee by ID from localStorage and opens the EmployeeForm in edit mode.
 */
function EditEmployee() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [employee, setEmployee] = useState(null);
  const [toast, setToast] = useState({ message: '', type: 'success' });

  useEffect(() => {
    const saved = localStorage.getItem('novaspark_employees');
    const employees = saved ? JSON.parse(saved) : mockEmployees;
    const found = employees.find(e => e.id === id);
    if (found) {
      setEmployee(found);
    } else {
      navigate('/admin/employees');
    }
  }, [id, navigate]);

  const handleSubmit = (formData) => {
    const saved = localStorage.getItem('novaspark_employees');
    const employees = saved ? JSON.parse(saved) : mockEmployees;
    const updated = employees.map(e => e.id === id ? { ...e, ...formData } : e);
    localStorage.setItem('novaspark_employees', JSON.stringify(updated));
    setToast({ message: '✓ Employee updated successfully.', type: 'success' });
    setTimeout(() => navigate(`/admin/employees/${id}`), 1200);
  };

  if (!employee) {
    return (
      <AdminLayout>
        <div className={styles.loadingWrapper}>
          <div className={styles.spinner} />
          <span>Loading employee...</span>
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
