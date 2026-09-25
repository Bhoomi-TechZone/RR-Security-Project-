import React, { useState } from 'react';
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
  CalendarOff
} from 'lucide-react';
import styles from './ClientEmployees.module.css';
import { useClientAuth } from '../../context/ClientAuthContext';
import { CLIENT_EMPLOYEES_LIST } from '../../data/clientPortalData';
import Avatar from '../../components/common/Avatar';
import StatusBadge from '../../components/common/StatusBadge';
import Toast from '../../components/common/Toast';

function ClientEmployees() {
  const { clientCompany } = useClientAuth();

  const [searchTerm, setSearchTerm] = useState('');
  const [deptFilter, setDeptFilter] = useState('all');
  const [siteFilter, setSiteFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
  };

  // Filtered employees list
  const filteredEmployees = CLIENT_EMPLOYEES_LIST.filter((emp) => {
    const matchesSearch =
      emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.employeeCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.designation.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDept = deptFilter === 'all' || emp.department === deptFilter;
    const matchesSite = siteFilter === 'all' || emp.site === siteFilter;
    const matchesStatus =
      statusFilter === 'all' || emp.status.toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesDept && matchesSite && matchesStatus;
  });

  const handleExportRoster = () => {
    showToast('Workforce employee roster exported to Excel successfully.', 'success');
  };

  const departments = Array.from(new Set(CLIENT_EMPLOYEES_LIST.map((e) => e.department)));
  const sites = Array.from(new Set(CLIENT_EMPLOYEES_LIST.map((e) => e.site)));

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
            Directory of personnel and verified staff assigned exclusively to your organization.
          </p>
        </div>

        <button type="button" className={styles.exportBtn} onClick={handleExportRoster}>
          <Download size={15} />
          <span>Export Employee List</span>
        </button>
      </div>

      {/* Summary KPI Badges */}
      <div className={styles.kpiRow}>
        <div className={styles.kpiCard}>
          <div className={styles.kpiIcon}>
            <Users size={18} />
          </div>
          <div className={styles.kpiMeta}>
            <span className={styles.kpiLabel}>Total Workforce</span>
            <span className={styles.kpiValue}>{CLIENT_EMPLOYEES_LIST.length}</span>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={`${styles.kpiIcon} ${styles.iconSuccess}`}>
            <UserCheck size={18} />
          </div>
          <div className={styles.kpiMeta}>
            <span className={styles.kpiLabel}>Active Staff</span>
            <span className={styles.kpiValue}>
              {CLIENT_EMPLOYEES_LIST.filter((e) => e.status === 'Active').length}
            </span>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={`${styles.kpiIcon} ${styles.iconPurple}`}>
            <CalendarOff size={18} />
          </div>
          <div className={styles.kpiMeta}>
            <span className={styles.kpiLabel}>On Leave</span>
            <span className={styles.kpiValue}>
              {CLIENT_EMPLOYEES_LIST.filter((e) => e.status === 'On Leave').length}
            </span>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={`${styles.kpiIcon} ${styles.iconDanger}`}>
            <UserX size={18} />
          </div>
          <div className={styles.kpiMeta}>
            <span className={styles.kpiLabel}>Inactive</span>
            <span className={styles.kpiValue}>
              {CLIENT_EMPLOYEES_LIST.filter((e) => e.status === 'Inactive').length}
            </span>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className={styles.filterCard}>
        <div className={styles.searchBox}>
          <Search size={16} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search by employee name, code, designation..."
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
            {departments.map((dept) => (
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
            <option value="all">All Operating Sites</option>
            {sites.map((site) => (
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
                <th>Joining Date</th>
                <th>Status</th>
                <th className={styles.alignRight}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan="8" className={styles.emptyCell}>
                    No employees found matching the selected filters.
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((emp) => (
                  <tr key={emp.id}>
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
                    <td>{emp.joiningDate}</td>
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
                  <span className={styles.fieldLabel}>Mapped Company</span>
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
                  <span className={styles.fieldVal}>{selectedEmployee.dutyPost}</span>
                </div>
                <div className={styles.infoField}>
                  <span className={styles.fieldLabel}>Shift Timing</span>
                  <span className={styles.fieldVal}>{selectedEmployee.shift}</span>
                </div>
                <div className={styles.infoField}>
                  <span className={styles.fieldLabel}>Joining Date</span>
                  <span className={styles.fieldVal}>{selectedEmployee.joiningDate}</span>
                </div>
              </div>

              <h4 className={styles.sectionHeader}>Verification & Compliance</h4>
              <div className={styles.infoGrid}>
                <div className={styles.infoField}>
                  <span className={styles.fieldLabel}>Police Verification</span>
                  <span className={styles.fieldValVerified}>
                    <ShieldCheck size={14} color="#16a34a" />
                    {selectedEmployee.policeVerification}
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
                  <span className={styles.fieldLabel}>Contact Number</span>
                  <span className={styles.fieldVal}>{selectedEmployee.mobile}</span>
                </div>
              </div>
            </div>

            <div className={styles.modalFooter}>
              <span className={styles.readOnlyNote}>
                Client view is read-only. Role transfer and salary details are managed by Admin.
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
