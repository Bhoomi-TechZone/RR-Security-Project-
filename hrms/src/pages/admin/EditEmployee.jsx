import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import AdminLayout from '../../components/layout/AdminLayout';
import EmployeeForm from '../../components/employees/EmployeeForm';
import Toast from '../../components/common/Toast';
import { useCompany } from '../../context/CompanyContext';
import { authService } from '../../services/authService';
import masterService from '../../services/masterService';
import clientService from '../../services/clientService';
import workLocationService from '../../services/workLocationService';
import employeeService from '../../services/employeeService';
import styles from './Employees.module.css';

const API_BASE_URL = import.meta.env.VITE_API_URL;

/**
 * EditEmployee Page
 * Loads the employee by ID from MongoDB and saves updates directly to backend API.
 */
function EditEmployee() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { activeCompany } = useCompany();
  const isUserPanel = location.pathname.startsWith('/user');
  const basePath = isUserPanel ? '/user/employees' : '/admin/employees';

  const currentCompanyId = activeCompany?.companyId || activeCompany?.id || '';

  const [employee, setEmployee] = useState(null);
  const [toast, setToast] = useState({ message: '', type: 'success' });
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
  const [employeesCount, setEmployeesCount] = useState(0);

  // Fetch employee record
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
          setTimeout(() => navigate(basePath), 1500);
        }
      } catch (err) {
        console.error('Error fetching employee:', err);
        setToast({ message: 'Failed to load employee details.', type: 'error' });
      }
    };

    if (id) {
      fetchEmployee();
    }
  }, [id, currentCompanyId, navigate, basePath]);

  // Fetch dropdown masters
  const fetchMasters = useCallback(async () => {
    if (!currentCompanyId) return;
    try {
      clientService.getClients(currentCompanyId).then(setClients).catch(() => {});
      masterService.getMasters('departments', currentCompanyId).then(setDepartments).catch(() => {});
      masterService.getMasters('designations', currentCompanyId).then(setDesignations).catch(() => {});
      masterService.getMasters('employee-types', currentCompanyId).then(setEmployeeTypes).catch(() => {});
      masterService.getMasters('sites', currentCompanyId).then(setSites).catch(() => {});
      masterService.getMasters('posts', currentCompanyId).then(setPosts).catch(() => {});
      masterService.getMasters('shifts', currentCompanyId).then(setShifts).catch(() => {});
      masterService.getMasters('banks', currentCompanyId).then(setBanks).catch(() => {});
      masterService.getMasters('document-types', currentCompanyId).then(setDocumentTypes).catch(() => {});
      workLocationService.getWorkLocations(currentCompanyId).then(setWorkLocations).catch(() => {});
      
      const allEmps = await employeeService.getEmployees(currentCompanyId);
      setEmployeesCount(Array.isArray(allEmps) ? allEmps.length : 0);
    } catch (err) {
      console.error('Error fetching master records for EditEmployee:', err);
    }
  }, [currentCompanyId]);

  useEffect(() => {
    fetchMasters();
  }, [fetchMasters]);

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
      window.dispatchEvent(new CustomEvent('employees-updated'));
      setTimeout(() => navigate(`${basePath}/${id}`), 1000);
    } catch (err) {
      console.error('Error updating employee:', err);
      setToast({ message: err.message || 'Failed to update employee.', type: 'error' });
    }
  };

  if (!employee) {
    return (
      <AdminLayout>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '300px', gap: '12px' }}>
          <div style={{ width: '32px', height: '32px', border: '3px solid #e2e8f0', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          <span style={{ color: '#64748b', fontSize: '14px' }}>Loading employee from database...</span>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className={styles.container}>
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ message: '', type: 'success' })}
        />

        {/* Breadcrumb Navigation */}
        <nav className={styles.breadcrumb} aria-label="Breadcrumb">
          <Link to={isUserPanel ? "/user/dashboard" : "/admin/dashboard"} className={styles.crumbLink}>
            Dashboard
          </Link>
          <span className={styles.separator}>/</span>
          <span className={styles.crumbLink}>Workforce</span>
          <span className={styles.separator}>/</span>
          <Link to={basePath} className={styles.crumbLink}>
            Employees
          </Link>
          <span className={styles.separator}>/</span>
          <span className={styles.crumbActive}>Edit {employee.name || 'Employee'}</span>
        </nav>

        <EmployeeForm
          isOpen={true}
          isPageMode={true}
          onClose={() => navigate(`${basePath}/${id}`)}
          onSubmit={handleSubmit}
          employee={employee}
          clients={clients}
          departments={departments}
          designations={designations}
          employeeTypes={employeeTypes}
          sites={sites}
          posts={posts}
          shifts={shifts}
          banks={banks}
          documentTypes={documentTypes}
          workLocations={workLocations}
          employeesCount={employeesCount}
        />
      </div>
    </AdminLayout>
  );
}

export default EditEmployee;
