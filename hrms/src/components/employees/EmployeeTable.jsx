import React from 'react';
import {
  MapPin,
  Building2,
  CheckCircle2,
  Edit2,
  BadgeCheck
} from 'lucide-react';
import EmployeeActionMenu from './EmployeeActionMenu';
import EmptyState from '../common/EmptyState';
import styles from './EmployeeTable.module.css';

const AVATAR_PALETTES = [
  { bg: '#e0f2fe', text: '#0369a1' }, // Sky
  { bg: '#dbeafe', text: '#1d4ed8' }, // Blue
  { bg: '#ede9fe', text: '#6d28d9' }, // Purple
  { bg: '#fce7f3', text: '#be185d' }, // Pink
  { bg: '#dcfce7', text: '#15803d' }, // Green
  { bg: '#fef3c7', text: '#b45309' }, // Amber
  { bg: '#ccfbf1', text: '#0f766e' }, // Teal
];

const getInitials = (name) => {
  if (!name) return 'EM';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const getAvatarPalette = (name = '') => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % AVATAR_PALETTES.length;
  return AVATAR_PALETTES[index];
};

const formatDisplayEmployeeId = (id) => {
  if (!id) return '—';
  const str = String(id).trim();
  const match = str.match(/^([A-Za-z]+)(\d+)$/);
  if (match) {
    return `${match[1].toUpperCase()}-${match[2]}`;
  }
  return str;
};

const formatJoiningDate = (dateStr) => {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const day = String(d.getDate()).padStart(2, '0');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  } catch {
    return dateStr;
  }
};

/**
 * EmployeeTable Component
 * Updated to match modern placement and employee row design with
 * avatar/initials, placement location/dept, formatted joining date,
 * quick edit and Options dropdown.
 */
function EmployeeTable({
  employees = [],
  loading = false,
  onAction,
  onResetFilters,
  startIndex = 0
}) {
  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.thIndex}>#</th>
                <th className={styles.thEmployee}>Employee</th>
                <th className={styles.thDesignation}>Designation</th>
                <th className={styles.thPlacement}>Placement</th>
                <th className={styles.thJoining}>Joining</th>
                <th className={styles.thActions}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {[1, 2, 3, 4, 5].map((idx) => (
                <tr key={idx} className={styles.skeletonRow}>
                  <td><div className={styles.skeletonBarShort} style={{ width: '20px' }} /></td>
                  <td>
                    <div className={styles.skeletonEmployee}>
                      <div className={styles.skeletonAvatar} />
                      <div className={styles.skeletonTextStack}>
                        <div className={styles.skeletonBarShort} style={{ width: '130px' }} />
                        <div className={styles.skeletonBarShort} style={{ width: '70px', height: '10px' }} />
                      </div>
                    </div>
                  </td>
                  <td><div className={styles.skeletonBarShort} style={{ width: '100px' }} /></td>
                  <td>
                    <div className={styles.skeletonTextStack}>
                      <div className={styles.skeletonBarShort} style={{ width: '150px' }} />
                      <div className={styles.skeletonBarShort} style={{ width: '110px', height: '10px' }} />
                    </div>
                  </td>
                  <td><div className={styles.skeletonBarShort} style={{ width: '85px' }} /></td>
                  <td><div className={styles.skeletonActionGroup} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (employees.length === 0) {
    return (
      <div className={styles.emptyWrapper}>
        <EmptyState
          title="No employees found"
          description="Try changing your search or filters to locate employee profiles."
          actionLabel="Reset Filters"
          onAction={onResetFilters}
        />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Desktop / Tablet Grid Table */}
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.thIndex}>#</th>
              <th className={styles.thEmployee}>Employee</th>
              <th className={styles.thDesignation}>Designation</th>
              <th className={styles.thPlacement}>Placement</th>
              <th className={styles.thJoining}>Joining</th>
              <th className={styles.thActions}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {employees.map((employee, idx) => {
              const empKey = employee.id || employee._id || employee.employeeId || idx;
              const empCode = formatDisplayEmployeeId(employee.employeeCode || employee.employeeId);
              const isInactive = String(employee.status || employee.employeeStatus || '').toLowerCase() === 'inactive';
              const avatarColor = getAvatarPalette(employee.name);
              const initials = getInitials(employee.name);
              
              const siteLocation = employee.siteLocation || employee.site || employee.location || employee.joiningLocation || employee.clientName || employee.companyName || 'General Deployment';
              const department = employee.department || employee.clientUnit || employee.businessUnit || 'Operations';

              return (
                <tr
                  key={empKey}
                  className={`${styles.tableRow} ${isInactive ? styles.inactiveRow : ''}`}
                  onClick={() => onAction('view', employee)}
                  title="Click to view employee details"
                >
                  {/* # Index Column */}
                  <td className={styles.tdIndex}>
                    <span className={styles.indexNumber}>{startIndex + idx + 1}</span>
                  </td>

                  {/* Employee Column: Avatar + Name + Code + Verified */}
                  <td className={styles.tdEmployee}>
                    <div className={styles.employeeCell}>
                      {employee.employeePhoto || employee.photo ? (
                        <img
                          src={employee.employeePhoto || employee.photo}
                          alt={employee.name}
                          className={styles.avatarImg}
                        />
                      ) : (
                        <div
                          className={styles.avatarInitials}
                          style={{ backgroundColor: avatarColor.bg, color: avatarColor.text }}
                        >
                          {initials}
                        </div>
                      )}

                      <div className={styles.employeeInfo}>
                        <span
                          className={styles.employeeName}
                          title="Click to view full employee profile"
                        >
                          {employee.name || 'Unnamed Employee'}
                        </span>
                        <div className={styles.employeeMeta}>
                          <span className={styles.employeeCode}>{empCode}</span>
                          {!isInactive ? (
                            <CheckCircle2
                              size={13}
                              className={styles.verifiedIcon}
                              title="Active Verified Employee"
                            />
                          ) : (
                            <span className={styles.inactiveBadge} title="Inactive Employee">Inactive</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Designation Column */}
                  <td className={styles.tdDesignation}>
                    <div className={styles.designationCell}>
                      <span className={styles.designationBadge}>
                        <BadgeCheck size={14} className={styles.badgeIcon} />
                      </span>
                      <span className={styles.designationText}>
                        {employee.designation || '—'}
                      </span>
                    </div>
                  </td>

                  {/* Placement Column: Pin Location + Building Department */}
                  <td className={styles.tdPlacement}>
                    <div className={styles.placementCell}>
                      <div className={styles.placementRow} title={siteLocation}>
                        <MapPin size={13} className={styles.pinIcon} />
                        <span className={styles.placementPrimary}>{siteLocation}</span>
                      </div>
                      <div className={styles.placementRow} title={department}>
                        <Building2 size={13} className={styles.buildingIcon} />
                        <span className={styles.placementSecondary}>{department}</span>
                      </div>
                    </div>
                  </td>

                  {/* Joining Column */}
                  <td className={styles.tdJoining}>
                    <span className={styles.joiningDateText}>
                      {formatJoiningDate(employee.joiningDate)}
                    </span>
                  </td>

                  {/* Actions Column: Quick Edit + Options Button */}
                  <td className={styles.tdActions} onClick={(e) => e.stopPropagation()}>
                    <div className={styles.actionsCell}>
                      <button
                        type="button"
                        className={styles.quickEditBtn}
                        onClick={(e) => {
                          e.stopPropagation();
                          onAction('edit', employee);
                        }}
                        title="Edit Employee"
                        aria-label="Edit Employee"
                      >
                        <Edit2 size={13} />
                      </button>
                      <div onClick={(e) => e.stopPropagation()}>
                        <EmployeeActionMenu employee={employee} onAction={onAction} />
                      </div>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Card Layout */}
      <div className={styles.mobileList}>
        {employees.map((employee, idx) => {
          const empKey = employee.id || employee._id || employee.employeeId || idx;
          const empCode = formatDisplayEmployeeId(employee.employeeCode || employee.employeeId);
          const isInactive = String(employee.status || employee.employeeStatus || '').toLowerCase() === 'inactive';
          const avatarColor = getAvatarPalette(employee.name);
          const initials = getInitials(employee.name);
          const siteLocation = employee.siteLocation || employee.site || employee.location || employee.joiningLocation || employee.clientName || employee.companyName || 'General Deployment';
          const department = employee.department || employee.clientUnit || employee.businessUnit || 'Operations';

          return (
            <div
              key={empKey}
              className={styles.mobileCard}
              onClick={() => onAction('view', employee)}
              title="Click to view employee details"
            >
              <div className={styles.mobileCardHeader}>
                <div className={styles.mobileIndexCol}>
                  <span className={styles.indexNumber}>#{startIndex + idx + 1}</span>
                </div>
                <div className={styles.mobileEmployeeInfo}>
                  {employee.employeePhoto || employee.photo ? (
                    <img
                      src={employee.employeePhoto || employee.photo}
                      alt={employee.name}
                      className={styles.avatarImg}
                    />
                  ) : (
                    <div
                      className={styles.avatarInitials}
                      style={{ backgroundColor: avatarColor.bg, color: avatarColor.text }}
                    >
                      {initials}
                    </div>
                  )}
                  <div>
                    <h4 className={styles.employeeName}>
                      {employee.name}
                    </h4>
                    <div className={styles.employeeMeta}>
                      <span className={styles.employeeCode}>{empCode}</span>
                      {!isInactive ? (
                        <CheckCircle2 size={13} className={styles.verifiedIcon} />
                      ) : (
                        <span className={styles.inactiveBadge}>Inactive</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className={styles.mobileCardBody}>
                <div className={styles.mobileCardRow}>
                  <span className={styles.mobileLabel}>Designation:</span>
                  <div className={styles.designationCell}>
                    <BadgeCheck size={14} className={styles.badgeIcon} />
                    <span className={styles.designationText}>{employee.designation || '—'}</span>
                  </div>
                </div>

                <div className={styles.mobileCardRow}>
                  <span className={styles.mobileLabel}>Placement:</span>
                  <div className={styles.placementCell}>
                    <div className={styles.placementRow}>
                      <MapPin size={13} className={styles.pinIcon} />
                      <span>{siteLocation}</span>
                    </div>
                    <div className={styles.placementRow}>
                      <Building2 size={13} className={styles.buildingIcon} />
                      <span>{department}</span>
                    </div>
                  </div>
                </div>

                <div className={styles.mobileCardRow}>
                  <span className={styles.mobileLabel}>Joining:</span>
                  <span className={styles.joiningDateText}>{formatJoiningDate(employee.joiningDate)}</span>
                </div>
              </div>

              <div className={styles.mobileCardFooter} onClick={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  className={styles.quickEditBtn}
                  onClick={(e) => {
                    e.stopPropagation();
                    onAction('edit', employee);
                  }}
                  title="Edit Employee"
                >
                  <Edit2 size={13} />
                </button>
                <div onClick={(e) => e.stopPropagation()}>
                  <EmployeeActionMenu employee={employee} onAction={onAction} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default EmployeeTable;
