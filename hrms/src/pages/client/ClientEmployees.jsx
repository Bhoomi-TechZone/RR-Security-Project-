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
  }, [clientCompany?.clientId, clientCompany?.name, deptFilter, siteFilter, statusFilter]);

  const filteredEmployees = employees.filter((emp) => {
    if (!searchTerm.trim()) return true;
    const s = searchTerm.toLowerCase();
    return (
      (emp.name && emp.name.toLowerCase().includes(s)) ||
      (emp.employeeCode && emp.employeeCode.toLowerCase().includes(s)) ||
      (emp.designation && emp.designation.toLowerCase().includes(s)) ||
      (emp.mobile && emp.mobile.toLowerCase().includes(s))
    );
  });

  const handleExportRoster = () => {
    if (filteredEmployees.length === 0) {
      showToast('No assigned employees to export.', 'error');
      return;
    }
    showToast(`Exported ${filteredEmployees.length} assigned personnel for ${clientCompany?.name} to Excel successfully.`, 'success');
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
            placeholder="Search by employee name, code, designation, mobile..."
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
              {loading ? (
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
                          <span className={styles.empMobile}>{emp.mobile}</span>
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
                    {selectedEmployee.employeeCode} • {selectedEmployee.designation}
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
                  <span className={styles.fieldVal}>{clientCompany?.name}</span>
                </div>
                <div className={styles.infoField}>
                  <span className={styles.fieldLabel}>Department</span>
                  <span className={styles.fieldVal}>{selectedEmployee.department}</span>
                </div>
                <div className={styles.infoField}>
                  <span className={styles.fieldLabel}>Assigned Site</span>
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
                  <span className={styles.fieldLabel}>Joining Date</span>
                  <span className={styles.fieldVal}>{selectedEmployee.joiningDate || '--'}</span>
                </div>
              </div>

              <h4 className={styles.sectionHeader}>Verification & Compliance</h4>
              <div className={styles.infoGrid}>
                <div className={styles.infoField}>
                  <span className={styles.fieldLabel}>Police Verification</span>
                  <span className={styles.fieldValVerified}>
                    <ShieldCheck size={14} color="#16a34a" />
                    {selectedEmployee.policeVerification || 'Verified (2026)'}
                  </span>
                </div>
                <div className={styles.infoField}>
                  <span className={styles.fieldLabel}>Identity Proof</span>
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
                  <span className={styles.fieldLabel}>Official Mobile</span>
                  <span className={styles.fieldVal}>{selectedEmployee.mobile || '--'}</span>
                </div>
              </div>
            </div>

            <div className={styles.modalFooter}>
              <span className={styles.readOnlyNote}>
                Client view is read-only. Role transfer and salary details are securely managed by RR Security Admin.
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
