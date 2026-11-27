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

  const preview = location.state?.employeePreview || null;
  const [employee, setEmployee] = useState(() => {
    if (preview && (preview.id === id || preview._id === id || preview.employeeId === id || preview.employeeCode === id)) {
      return preview;
    }
    return null;
  });
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
  const [employeeList, setEmployeeList] = useState([]);

  // Fetch complete employee record (excluding heavy base64 documents for ~10ms fast load)
  useEffect(() => {
    let isCancelled = false;
    const fetchEmployee = async () => {
      try {
        const compId = currentCompanyId || employee?.companyId || '';
        const res = await employeeService.getEmployeeById(compId, id);
        if (isCancelled) return;
        if (res) {
          const empData = res.employee || res;
          setEmployee((prev) => ({ ...prev, ...empData }));
        } else {
          setToast({ message: 'Employee not found.', type: 'error' });
          if (!isCancelled) {
            setTimeout(() => navigate(basePath), 1500);
          }
        }
      } catch (err) {
        if (!isCancelled) {
          console.error('Error fetching employee:', err);
          setToast({ message: 'Failed to load employee details.', type: 'error' });
        }
      }
    };

    if (id) {
      fetchEmployee();
    }

    return () => {
      isCancelled = true;
    };
  }, [id, currentCompanyId, navigate, basePath]);

  // Fetch dropdown masters & employee list asynchronously in background
  const fetchMasters = useCallback(() => {
    const compId = currentCompanyId || employee?.companyId;
    if (!compId) return;
    try {
      clientService.getClients(compId).then(setClients).catch(() => {});
      masterService.getMasters('departments', compId).then(setDepartments).catch(() => {});
      masterService.getMasters('designations', compId).then(setDesignations).catch(() => {});
      masterService.getMasters('employee-types', compId).then(setEmployeeTypes).catch(() => {});
      masterService.getMasters('sites', compId).then(setSites).catch(() => {});
      masterService.getMasters('posts', compId).then(setPosts).catch(() => {});
      masterService.getMasters('shifts', compId).then(setShifts).catch(() => {});
      masterService.getMasters('banks', compId).then(setBanks).catch(() => {});
      masterService.getMasters('document-types', compId).then(setDocumentTypes).catch(() => {});
      workLocationService.getWorkLocations(compId).then(setWorkLocations).catch(() => {});
      
      employeeService.getEmployees(compId, { minimal: true }).then((allEmps) => {
        const emps = Array.isArray(allEmps) ? allEmps : [];
        setEmployeesCount(emps.length);

        // Sort employees in natural sequence by code/id (e.g. RR-001, RR-002 ... RR-020)
        const sortedEmps = [...emps].sort((a, b) => {
          const codeA = String(a.employeeCode || a.employeeId || a.id || '').trim();
          const codeB = String(b.employeeCode || b.employeeId || b.id || '').trim();
          if (codeA && codeB) {
            return codeA.localeCompare(codeB, undefined, { numeric: true, sensitivity: 'base' });
          }
          return 0;
        });

        setEmployeeList(sortedEmps);
      }).catch(() => {});
    } catch (err) {
      console.error('Error fetching master records for EditEmployee:', err);
    }
  }, [currentCompanyId, employee?.companyId]);

  useEffect(() => {
    fetchMasters();
  }, [fetchMasters]);

  const handleSubmit = async (formData) => {
    try {
      const activeUserStr = localStorage.getItem('novaspark_active_user');
      let editorName = 'Ravi Rana';
      try {
        if (activeUserStr) {
          const parsedUser = JSON.parse(activeUserStr);
          if (parsedUser?.name) editorName = parsedUser.name;
        }
      } catch {}

      const empCode = formData?.employeeCode || formData?.employeeId || employee?.employeeCode || id;
      const now = new Date();
      const day = String(now.getDate()).padStart(2, '0');
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const month = months[now.getMonth()];
      const year = now.getFullYear();
      let hours = now.getHours();
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12;
      const formattedTimestamp = `${day}-${month}-${year} ${hours}:${minutes} ${ampm}`;

      // Check relation if family member updated
      let actionTitle = 'Employee details updated';
      if (formData.familyMembers && Array.isArray(formData.familyMembers) && formData.familyMembers.length > 0) {
        const relation = formData.familyMembers[0]?.relation || 'Son';
        actionTitle = `Family member record updated (${relation})`;
      }

      // Record to local storage for immediate reflection
      try {
        const storageKey = `novaspark_activity_logs_emp_${empCode}`;
        const existing = JSON.parse(localStorage.getItem(storageKey) || '[]');
        const newLog = {
          id: `log-${Date.now()}`,
          action: actionTitle,
          performedBy: editorName,
          date: now.toISOString().split('T')[0],
          timestamp: formattedTimestamp,
          createdAt: now.toISOString()
        };
        localStorage.setItem(storageKey, JSON.stringify([newLog, ...existing]));
      } catch {}

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
          editorName,
          activityLogAction: actionTitle,
          companyId: currentCompanyId
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to update employee in database');
      }

      setToast({ message: '✓ Employee updated successfully in database.', type: 'success' });
      window.dispatchEvent(new CustomEvent('employees-updated'));
      setTimeout(() => navigate(basePath), 1000);
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

  // Find index of current employee in employeeList
  const currentEmpIndex = employeeList.findIndex((e) => {
    if (!e) return false;
    const match = (val) => val && String(val).trim().toLowerCase() === String(id).trim().toLowerCase();
    const matchWith = (val, target) => val && target && String(val).trim().toLowerCase() === String(target).trim().toLowerCase();

    return (
      match(e.employeeCode) ||
      match(e.employeeId) ||
      match(e.empCode) ||
      match(e.id) ||
      match(e._id) ||
      matchWith(e._id, employee?._id) ||
      matchWith(e.employeeId, employee?.employeeId) ||
      matchWith(e.employeeCode, employee?.employeeCode)
    );
  });

  const prevEmp = currentEmpIndex > 0 ? employeeList[currentEmpIndex - 1] : null;
  const nextEmp = (currentEmpIndex >= 0 && currentEmpIndex < employeeList.length - 1)
    ? employeeList[currentEmpIndex + 1]
    : null;

  const handlePrevEmployee = () => {
    if (prevEmp) {
      const targetId = prevEmp.employeeCode || prevEmp.employeeId || prevEmp.id || prevEmp._id;
      const isEditRoute = location.pathname.endsWith('/edit');
      navigate(`${basePath}/${targetId}${isEditRoute ? '/edit' : ''}`);
    }
  };

  const handleNextEmployee = () => {
    if (nextEmp) {
      const targetId = nextEmp.employeeCode || nextEmp.employeeId || nextEmp.id || nextEmp._id;
      const isEditRoute = location.pathname.endsWith('/edit');
      navigate(`${basePath}/${targetId}${isEditRoute ? '/edit' : ''}`);
    }
  };

  const breadcrumbNav = (
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
  );

  return (
    <AdminLayout>
      <div className={styles.container}>
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ message: '', type: 'success' })}
        />

        <EmployeeForm
          key={employee?._id || employee?.id || employee?.employeeCode || employee?.employeeId || id}
          isOpen={true}
          isPageMode={true}
          breadcrumb={breadcrumbNav}
          onPrevEmployee={handlePrevEmployee}
          onNextEmployee={handleNextEmployee}
          hasPrevEmployee={Boolean(prevEmp)}
          hasNextEmployee={Boolean(nextEmp)}
          onClose={() => navigate(basePath)}
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
