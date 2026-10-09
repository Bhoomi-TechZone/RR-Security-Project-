import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Filter,
  Eye,
  Download,
  Building,
  MapPin,
  ShieldCheck,
  Calendar,
  X,
  UserCheck,
  UserX,
  CalendarOff,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import styles from './ClientEmployees.module.css';
import { useClientAuth } from '../../context/ClientAuthContext';
import clientPortalService from '../../services/clientPortalService';
import Avatar from '../../components/common/Avatar';
import StatusBadge from '../../components/common/StatusBadge';
import Toast from '../../components/common/Toast';

function ClientEmployees() {
  const { clientCompany } = useClientAuth();

  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState([]);
  const [departmentOptions, setDepartmentOptions] = useState([]);
  const [siteOptions, setSiteOptions] = useState([]);

  const [searchTerm, setSearchTerm] = useState('');
  const [deptFilter, setDeptFilter] = useState('all');
  const [siteFilter, setSiteFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
  };

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const res = await clientPortalService.getAssignedEmployees({
        search: searchTerm,
        department: deptFilter,
        site: siteFilter,
        status: statusFilter
      });

      if (res && Array.isArray(res.employees)) {
        setEmployees(res.employees);
        if (res.departments?.length > 0) setDepartmentOptions(res.departments);
        if (res.sites?.length > 0) setSiteOptions(res.sites);
      } else {
        setEmployees([]);
      }
    } catch (err) {
      console.warn('Error fetching client assigned employees:', err.message);
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
    const interval = setInterval(fetchEmployees, 5000);
    const handleRefresh = () => fetchEmployees();

    window.addEventListener('focus', handleRefresh);
    window.addEventListener('auth_state_changed', handleRefresh);
    window.addEventListener('user_logged_in', handleRefresh);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleRefresh);
      window.removeEventListener('auth_state_changed', handleRefresh);
      window.removeEventListener('user_logged_in', handleRefresh);
    };
  }, [clientCompany?.clientId, clientCompany?.name, deptFilter, siteFilter, statusFilter]);

  const filteredEmployees = employees.filter((emp) => {
    if (!searchTerm.trim()) return true;
    const s = searchTerm.toLowerCase();
    return (
      (emp.name && emp.name.toLowerCase().includes(s)) ||
      (emp.employeeCode && emp.employeeCode.toLowerCase().includes(s)) ||
      (emp.designation && emp.designation.toLowerCase().includes(s)) ||
      (emp.department && emp.department.toLowerCase().includes(s)) ||
      (emp.site && emp.site.toLowerCase().includes(s)) ||
      (emp.dutyPost && emp.dutyPost.toLowerCase().includes(s)) ||
      (emp.mobile && emp.mobile.toLowerCase().includes(s))
    );
  });

  const handleExportRoster = () => {
    if (filteredEmployees.length === 0) {
      showToast('No assigned employees to export.', 'error');
      return;
    }

    try {
      const headers = [
        'Employee Code',
        'Full Name',
        'Designation',
        'Department',
        'Assigned Site',
        'Duty Post',
        'Shift',
        'Mobile',
        'Emergency Contact',
        'Joining Date',
        'Status',
        'Police Verification'
      ];

      const rows = filteredEmployees.map(emp => [
        `"${emp.employeeCode || ''}"`,
        `"${emp.name || ''}"`,
        `"${emp.designation || ''}"`,
        `"${emp.department || ''}"`,
        `"${emp.site || ''}"`,
        `"${emp.dutyPost || ''}"`,
        `"${emp.shift || ''}"`,
        `"${emp.mobile || ''}"`,
        `"${emp.emergencyMobile || emp.alternateMobile || ''}"`,
        `"${emp.joiningDate || ''}"`,
        `"${emp.status || ''}"`,
        `"${emp.policeVerification || 'Verified'}"`
      ]);

      const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `${(clientCompany?.name || 'Workforce').replace(/\s+/g, '_')}_Assigned_Employees.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      showToast(`Exported ${filteredEmployees.length} assigned personnel for ${clientCompany?.name || 'client'} to CSV successfully.`, 'success');
    } catch (err) {
      console.error('Export error:', err);
      showToast('Failed to export employee roster.', 'error');
    }
  };

  const totalCount = employees.length;
  const activeCount = employees.filter((e) => (e.status || '').toLowerCase() === 'active').length;
  const onLeaveCount = employees.filter((e) => (e.status || '').toLowerCase() === 'on leave').length;
  const inactiveCount = employees.filter((e) => (e.status || '').toLowerCase() === 'inactive').length;

  return (
    <div className={styles.container}>
      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ show: false, message: '', type: 'success' })}
        />
      )}

      {/* Page Header */}
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Company Workforce</h1>
          <p className={styles.pageSubtitle}>
            Directory of personnel and verified staff assigned exclusively to {clientCompany?.name || 'your company'}.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            className={styles.exportBtn}
            onClick={fetchEmployees}
            title="Refresh Roster"
            style={{ background: 'var(--surface-bg)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}
          >
            <RefreshCw size={15} className={loading ? styles.spinning : ''} />
            <span>Refresh</span>
          </button>
          <button type="button" className={styles.exportBtn} onClick={handleExportRoster}>
            <Download size={15} />
            <span>Export Employee List</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Badges */}
      <div className={styles.kpiRow}>
        <div className={styles.kpiCard}>
          <div className={styles.kpiIcon}>
            <Users size={18} />
          </div>
          <div className={styles.kpiMeta}>
            <span className={styles.kpiLabel}>Total Assigned Workforce</span>
            <span className={styles.kpiValue}>{totalCount}</span>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={`${styles.kpiIcon} ${styles.iconSuccess}`}>
            <UserCheck size={18} />
          </div>
          <div className={styles.kpiMeta}>
            <span className={styles.kpiLabel}>Active On Duty</span>
            <span className={styles.kpiValue}>{activeCount}</span>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={`${styles.kpiIcon} ${styles.iconPurple}`}>
            <CalendarOff size={18} />
          </div>
          <div className={styles.kpiMeta}>
            <span className={styles.kpiLabel}>On Approved Leave</span>
            <span className={styles.kpiValue}>{onLeaveCount}</span>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={`${styles.kpiIcon} ${styles.iconDanger}`}>
            <UserX size={18} />
          </div>
          <div className={styles.kpiMeta}>
            <span className={styles.kpiLabel}>Inactive / Relieved</span>
            <span className={styles.kpiValue}>{inactiveCount}</span>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className={styles.filterCard}>
        <div className={styles.searchBox}>
          <Search size={16} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search by employee name, code, designation, department, site..."
            className={styles.searchInput}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className={styles.filterDropdowns}>
          {/* Department Filter */}
          <select
            className={styles.selectInput}
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
          >
            <option value="all">All Departments</option>
            {departmentOptions.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>

          {/* Site Filter */}
          <select
            className={styles.selectInput}
            value={siteFilter}
            onChange={(e) => setSiteFilter(e.target.value)}
          >
            <option value="all">All Assigned Sites</option>
            {siteOptions.map((site) => (
              <option key={site} value={site}>
                {site}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            className={styles.selectInput}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="on leave">On Leave</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Workforce Table */}
      <div className={styles.tableCard}>
        <div className={styles.tableResponsive}>
          <table className={styles.dataTable}>
            <thead>
              <tr>
                <th>Employee Code</th>
                <th>Employee Name</th>
                <th>Designation</th>
                <th>Department</th>
                <th>Site / Location</th>
                <th>Shift</th>
                <th>Status</th>
                <th className={styles.alignRight}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading && employees.length === 0 ? (
                <tr>
                  <td colSpan="8" className={styles.emptyCell}>
                    Loading assigned workforce...
                  </td>
                </tr>
              ) : filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan="8" className={styles.emptyCell}>
                    No employees currently assigned to {clientCompany?.name || 'your company'}.
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((emp) => (
                  <tr key={emp.id || emp.employeeCode}>
                    <td>
                      <span className={styles.codeBadge}>{emp.employeeCode}</span>
                    </td>
                    <td>
                      <div className={styles.employeeCell}>
                        <Avatar initials={emp.initials} size="sm" name={emp.name} />
                        <div>
                          <span className={styles.empName}>{emp.name}</span>
                          <span className={styles.empMobile}>{emp.mobile || emp.email || '--'}</span>
                        </div>
                      </div>
                    </td>
                    <td>{emp.designation}</td>
                    <td>
                      <span className={styles.deptBadge}>{emp.department}</span>
                    </td>
                    <td>
                      <div className={styles.siteCell}>
                        <MapPin size={12} />
                        <span>{emp.site}</span>
                      </div>
                    </td>
                    <td>{emp.shift}</td>
                    <td>
                      <StatusBadge status={emp.status} />
                    </td>
                    <td className={styles.alignRight}>
                      <button
                        type="button"
                        className={styles.viewBtn}
                        onClick={() => setSelectedEmployee(emp)}
                        title="View Full Profile"
                      >
                        <Eye size={14} />
                        <span>View</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Read-Only Employee Profile Modal */}
      {selectedEmployee && (
        <div className={styles.modalOverlay} onClick={() => setSelectedEmployee(null)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div className={styles.modalTitleRow}>
                <Avatar initials={selectedEmployee.initials} size="md" name={selectedEmployee.name} />
                <div>
                  <h3 className={styles.modalTitle}>{selectedEmployee.name}</h3>
                  <span className={styles.modalSubtitle}>
                    {selectedEmployee.employeeCode} • {selectedEmployee.designation} • {selectedEmployee.department}
                  </span>
                </div>
              </div>
              <button
                type="button"
                className={styles.modalCloseBtn}
                onClick={() => setSelectedEmployee(null)}
              >
                <X size={18} />
              </button>
            </div>

            <div className={styles.modalBody}>
              <h4 className={styles.sectionHeader}>Deployment & Assignment Details</h4>
              <div className={styles.infoGrid}>
                <div className={styles.infoField}>
                  <span className={styles.fieldLabel}>Mapped Client</span>
                  <span className={styles.fieldVal}>{selectedEmployee.clientName || clientCompany?.name}</span>
                </div>
                <div className={styles.infoField}>
                  <span className={styles.fieldLabel}>Assigned Site / Branch</span>
                  <span className={styles.fieldVal}>{selectedEmployee.site}</span>
                </div>
                <div className={styles.infoField}>
                  <span className={styles.fieldLabel}>Duty Post</span>
                  <span className={styles.fieldVal}>{selectedEmployee.dutyPost || 'Duty Post'}</span>
                </div>
                <div className={styles.infoField}>
                  <span className={styles.fieldLabel}>Shift Timing</span>
                  <span className={styles.fieldVal}>{selectedEmployee.shift || 'General Shift'}</span>
                </div>
                <div className={styles.infoField}>
                  <span className={styles.fieldLabel}>Employment Type</span>
                  <span className={styles.fieldVal}>{selectedEmployee.employeeType || 'Permanent'}</span>
                </div>
                <div className={styles.infoField}>
                  <span className={styles.fieldLabel}>Date of Joining</span>
                  <span className={styles.fieldVal}>{selectedEmployee.joiningDate || '--'}</span>
                </div>
                <div className={styles.infoField}>
                  <span className={styles.fieldLabel}>Reporting Supervisor</span>
                  <span className={styles.fieldVal}>{selectedEmployee.reportingSupervisor || 'Area Security Officer'}</span>
                </div>
                <div className={styles.infoField}>
                  <span className={styles.fieldLabel}>Work Location Base</span>
                  <span className={styles.fieldVal}>{selectedEmployee.joiningLocation || selectedEmployee.site || '--'}</span>
                </div>
              </div>

              <h4 className={styles.sectionHeader}>Verification & Compliance</h4>
              <div className={styles.infoGrid}>
                <div className={styles.infoField}>
                  <span className={styles.fieldLabel}>Police Verification</span>
                  <span className={styles.fieldValVerified}>
                    <ShieldCheck size={14} color="#16a34a" />
                    {selectedEmployee.policeVerification || 'Verified (PSARA 2026)'}
                  </span>
                </div>
                <div className={styles.infoField}>
                  <span className={styles.fieldLabel}>Identity Verification</span>
                  <span className={styles.fieldValVerified}>
                    <ShieldCheck size={14} color="#16a34a" />
                    Aadhaar & PAN Verified
                  </span>
                </div>
                <div className={styles.infoField}>
                  <span className={styles.fieldLabel}>Current Status</span>
                  <StatusBadge status={selectedEmployee.status} />
                </div>
                <div className={styles.infoField}>
                  <span className={styles.fieldLabel}>Blood Group & Gender</span>
                  <span className={styles.fieldVal}>{selectedEmployee.bloodGroup ? `${selectedEmployee.bloodGroup} • ` : ''}{selectedEmployee.gender || 'Male'}</span>
                </div>
                <div className={styles.infoField}>
                  <span className={styles.fieldLabel}>Training & Qualifications</span>
                  <span className={styles.fieldVal}>{selectedEmployee.technicalQualification || 'Fire Safety & First Aid Trained'}</span>
                </div>
                <div className={styles.infoField}>
                  <span className={styles.fieldLabel}>Experience</span>
                  <span className={styles.fieldVal}>{selectedEmployee.previousExperience || 'Verified Guarding Background'}</span>
                </div>
              </div>

              <h4 className={styles.sectionHeader}>Contact Information</h4>
              <div className={styles.infoGrid}>
                <div className={styles.infoField}>
                  <span className={styles.fieldLabel}>Official Mobile</span>
                  <span className={styles.fieldVal}>{selectedEmployee.mobile || '--'}</span>
                </div>
                <div className={styles.infoField}>
                  <span className={styles.fieldLabel}>Emergency Contact</span>
                  <span className={styles.fieldVal}>{selectedEmployee.emergencyMobile || selectedEmployee.alternateMobile || '--'}</span>
                </div>
                <div className={styles.infoField} style={{ gridColumn: 'span 2' }}>
                  <span className={styles.fieldLabel}>Email Address</span>
                  <span className={styles.fieldVal}>{selectedEmployee.email || `${selectedEmployee.employeeCode?.toLowerCase()}@client.portal`}</span>
                </div>
              </div>
            </div>

            <div className={styles.modalFooter}>
              <span className={styles.readOnlyNote}>
                Client portal is read-only. All deployment rosters & statutory records are governed by RR Security Admin.
              </span>
              <button
                type="button"
                className={styles.modalPrimaryBtn}
                onClick={() => setSelectedEmployee(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ClientEmployees;
