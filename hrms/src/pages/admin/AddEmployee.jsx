import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
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
 * AddEmployee Page
 * Dedicated full-page multi-step workflow for adding a new employee.
 */
function AddEmployee() {
  const navigate = useNavigate();
  const location = useLocation();
  const { activeCompany } = useCompany();
  const isUserPanel = location.pathname.startsWith('/user');
  const basePath = isUserPanel ? '/user/employees' : '/admin/employees';

  const currentCompanyId = activeCompany?.companyId || activeCompany?.id || '';

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

  // Fetch all dropdown master dependencies
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
      console.error('Error fetching master records for AddEmployee:', err);
    }
  }, [currentCompanyId]);

  useEffect(() => {
    fetchMasters();
  }, [fetchMasters]);

  const handleSubmit = async (formData) => {
    const token = authService.getToken();
    try {
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
      if (!res.ok) {
        throw new Error(data.message || 'Failed to create employee');
      }

      setToast({ message: '✓ Employee added successfully!', type: 'success' });
      window.dispatchEvent(new CustomEvent('employees-updated'));

      setTimeout(() => {
        navigate(basePath);
      }, 1000);
    } catch (err) {
      console.error('Error creating employee:', err);
      setToast({ message: err.message || 'Failed to create employee.', type: 'error' });
      throw err;
    }
  };

  const handleClose = () => {
    navigate(basePath);
  };

  return (
    <AdminLayout>
      <div className={styles.container}>
        {/* Toast */}
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
            Employees
          </Link>
          <span className={styles.separator}>/</span>
          <span className={styles.crumbActive}>Add Employee</span>
        </nav>

        {/* Full-Page Multi-Step Employee Form */}
        <EmployeeForm
          isOpen={true}
          isPageMode={true}
          onClose={handleClose}
          onSubmit={handleSubmit}
          employee={null}
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

export default AddEmployee;
