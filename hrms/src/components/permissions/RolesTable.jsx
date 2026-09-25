import React, { useState } from 'react';
import {
  Eye,
  Shield,
  ShieldCheck,
  ShieldAlert,
  KeyRound,
  MoreVertical,
  Edit2,
  Copy,
  Users,
  Power,
  Trash2,
  Lock,
  Sparkles,
  Search,
  Filter,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Clock
} from 'lucide-react';
import styles from './RolesTable.module.css';
import Dropdown from '../common/Dropdown';
import { countRolePermissions, getEnabledModulesCount } from '../../data/rolesPermissionsData';

function RolesTable({
  roles = [],
  onViewRole,
  onEditPermissions,
  onEditRoleInfo,
  onDuplicateRole,
  onViewUsers,
  onToggleStatus,
  onDeleteRole
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  const filteredRoles = roles.filter(role => {
    const matchesSearch = 
      role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (role.description && role.description.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = 
      statusFilter === 'all' || 
      (statusFilter === 'active' && role.status === 'Active') ||
      (statusFilter === 'inactive' && role.status === 'Inactive');

    const matchesType = 
      typeFilter === 'all' || 
      role.type === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  const handleResetFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setTypeFilter('all');
  };

  return (
    <div className={styles.container}>
      {/* Table Filter Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.searchWrapper}>
          <Search size={16} className={styles.searchIcon} />
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search roles by title or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            aria-label="Search roles"
          />
          {searchTerm && (
            <button 
              type="button" 
              className={styles.clearSearchBtn}
              onClick={() => setSearchTerm('')}
              aria-label="Clear search"
            >
              ×
            </button>
          )}
        </div>

        <div className={styles.filtersGroup}>
          <div className={styles.selectWrapper}>
            <select
              className={styles.select}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Filter by role status"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div className={styles.selectWrapper}>
            <select
              className={styles.select}
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              aria-label="Filter by role type"
            >
              <option value="all">All Types</option>
              <option value="system">System Roles</option>
              <option value="custom">Custom Roles</option>
            </select>
          </div>

          {(searchTerm || statusFilter !== 'all' || typeFilter !== 'all') && (
            <button
              type="button"
              className={styles.resetBtn}
              onClick={handleResetFilters}
              title="Reset all filters"
            >
              <RotateCcw size={14} />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Roles Table */}
      <div className={styles.tableCard}>
        <div className={styles.tableResponsive}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Role Name</th>
                <th>Type</th>
                <th>Description</th>
                <th>Assigned Users</th>
                <th>Permissions</th>
                <th>Status</th>
                <th>Created On</th>
                <th className={styles.thActions}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRoles.length === 0 ? (
                <tr>
                  <td colSpan={8} className={styles.emptyTd}>
                    <div className={styles.emptyState}>
                      <ShieldAlert size={36} className={styles.emptyIcon} />
                      <h3>No roles found</h3>
                      <p>Try adjusting your search criteria or filter selections.</p>
                      <button 
                        type="button" 
                        className={styles.emptyResetBtn}
                        onClick={handleResetFilters}
                      >
                        Clear Filters
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredRoles.map((role) => {
                  const isSystem = role.type === 'system';
                  const isActive = role.status === 'Active';
                  const totalPerms = countRolePermissions(role);
                  const enabledMods = getEnabledModulesCount(role);

                  return (
                    <tr key={role.id} className={styles.row}>
                      <td>
                        <div className={styles.roleNameCell}>
                          <div className={`${styles.roleIconBadge} ${isSystem ? styles.systemIcon : styles.customIcon}`}>
                            {isSystem ? <Shield size={16} /> : <KeyRound size={16} />}
                          </div>
                          <div>
                            <strong className={styles.roleNameText}>{role.name}</strong>
                            {isSystem && (
                              <span className={styles.protectedIndicator} title="System role is protected from deletion">
                                <Lock size={10} /> Protected
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      <td>
                        <span className={`${styles.typeBadge} ${isSystem ? styles.badgeSystem : styles.badgeCustom}`}>
                          {isSystem ? 'System' : 'Custom'}
                        </span>
                      </td>

                      <td>
                        <p className={styles.descText} title={role.description}>
                          {role.description || '—'}
                        </p>
                      </td>

                      <td>
                        <button
                          type="button"
                          className={styles.userCountBtn}
                          onClick={() => onViewUsers && onViewUsers(role)}
                          title={`View ${role.usersCount || 0} users assigned to ${role.name}`}
                        >
                          <Users size={14} />
                          <span>{role.usersCount || 0} Users</span>
                        </button>
                      </td>

                      <td>
                        <div className={styles.permCell}>
                          <strong className={styles.permCountText}>{totalPerms}</strong>
                          <span className={styles.permSubText}>
                            ({enabledMods} {enabledMods === 1 ? 'module' : 'modules'})
                          </span>
                        </div>
                      </td>

                      <td>
                        <span className={`${styles.statusBadge} ${isActive ? styles.statusActive : styles.statusInactive}`}>
                          {isActive ? (
                            <>
                              <span className={styles.statusDotActive} />
                              Active
                            </>
                          ) : (
                            <>
                              <span className={styles.statusDotInactive} />
                              Inactive
                            </>
                          )}
                        </span>
                      </td>

                      <td>
                        <span className={styles.dateText}>
                          {role.createdOn || '—'}
                        </span>
                      </td>

                      <td className={styles.tdActions}>
                        <div className={styles.actionBtns}>
                          <button
                            type="button"
                            className={styles.btnView}
                            onClick={() => onViewRole(role)}
                            title="View role details"
                          >
                            <Eye size={14} />
                            <span>View</span>
                          </button>

                          <button
                            type="button"
                            className={styles.btnPermissions}
                            onClick={() => onEditPermissions(role)}
                            title="Configure role permissions"
                          >
                            <KeyRound size={14} />
                            <span>Permissions</span>
                          </button>

                          {/* Row Actions Dropdown */}
                          <Dropdown
                            align="right"
                            trigger={
                              <button
                                type="button"
                                className={styles.btnMore}
                                aria-label={`Actions for ${role.name}`}
                              >
                                <MoreVertical size={16} />
                              </button>
                            }
                          >
                            <ul className={styles.dropdownMenu}>
                              <li className={styles.dropdownItem}>
                                <button
                                  type="button"
                                  className={styles.dropdownBtn}
                                  onClick={() => onViewRole(role)}
                                >
                                  <Eye size={14} />
                                  <span>View Details</span>
                                </button>
                              </li>

                              <li className={styles.dropdownItem}>
                                <button
                                  type="button"
                                  className={styles.dropdownBtn}
                                  onClick={() => onEditPermissions(role)}
                                >
                                  <KeyRound size={14} />
                                  <span>Edit Permissions</span>
                                </button>
                              </li>

                              {!isSystem && (
                                <li className={styles.dropdownItem}>
                                  <button
                                    type="button"
                                    className={styles.dropdownBtn}
                                    onClick={() => onEditRoleInfo(role)}
                                  >
                                    <Edit2 size={14} />
                                    <span>Edit Role Info</span>
                                  </button>
                                </li>
                              )}

                              <li className={styles.dropdownItem}>
                                <button
                                  type="button"
                                  className={styles.dropdownBtn}
                                  onClick={() => onDuplicateRole(role)}
                                >
                                  <Copy size={14} />
                                  <span>Duplicate Role</span>
                                </button>
                              </li>

                              <li className={styles.dropdownItem}>
                                <button
                                  type="button"
                                  className={styles.dropdownBtn}
                                  onClick={() => onViewUsers && onViewUsers(role)}
                                >
                                  <Users size={14} />
                                  <span>View Assigned Users</span>
                                </button>
                              </li>

                              {!isSystem && (
                                <>
                                  <li className={styles.dropdownDivider} />
                                  <li className={styles.dropdownItem}>
                                    <button
                                      type="button"
                                      className={`${styles.dropdownBtn} ${isActive ? styles.btnDeactivate : styles.btnActivate}`}
                                      onClick={() => onToggleStatus(role)}
                                    >
                                      <Power size={14} />
                                      <span>{isActive ? 'Deactivate Role' : 'Activate Role'}</span>
                                    </button>
                                  </li>

                                  <li className={styles.dropdownItem}>
                                    <button
                                      type="button"
                                      className={`${styles.dropdownBtn} ${styles.btnDelete}`}
                                      onClick={() => onDeleteRole(role)}
                                    >
                                      <Trash2 size={14} />
                                      <span>Delete Role</span>
                                    </button>
                                  </li>
                                </>
                              )}
                            </ul>
                          </Dropdown>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Responsive Mobile Cards List */}
        <div className={styles.mobileList}>
          {filteredRoles.map(role => {
            const isSystem = role.type === 'system';
            const isActive = role.status === 'Active';
            const totalPerms = countRolePermissions(role);
            const enabledMods = getEnabledModulesCount(role);

            return (
              <div key={role.id} className={styles.mobileCard}>
                <div className={styles.mobileCardHeader}>
                  <div className={styles.roleNameCell}>
                    <div className={`${styles.roleIconBadge} ${isSystem ? styles.systemIcon : styles.customIcon}`}>
                      {isSystem ? <Shield size={16} /> : <KeyRound size={16} />}
                    </div>
                    <div>
                      <strong className={styles.roleNameText}>{role.name}</strong>
                      <span className={`${styles.typeBadge} ${isSystem ? styles.badgeSystem : styles.badgeCustom}`}>
                        {isSystem ? 'System' : 'Custom'}
                      </span>
                    </div>
                  </div>

                  <span className={`${styles.statusBadge} ${isActive ? styles.statusActive : styles.statusInactive}`}>
                    {role.status}
                  </span>
                </div>

                <p className={styles.descTextMobile}>{role.description || 'No description provided.'}</p>

                <div className={styles.mobileGrid}>
                  <div className={styles.mobileGridItem}>
                    <span className={styles.mobileLabel}>Assigned Users</span>
                    <strong className={styles.mobileValue}>{role.usersCount || 0} Users</strong>
                  </div>
                  <div className={styles.mobileGridItem}>
                    <span className={styles.mobileLabel}>Permissions</span>
                    <strong className={styles.mobileValue}>{totalPerms} in {enabledMods} modules</strong>
                  </div>
                  <div className={styles.mobileGridItem}>
                    <span className={styles.mobileLabel}>Created On</span>
                    <span className={styles.mobileValue}>{role.createdOn || '—'}</span>
                  </div>
                </div>

                <div className={styles.mobileActions}>
                  <button
                    type="button"
                    className={styles.mobileBtnSecondary}
                    onClick={() => onViewRole(role)}
                  >
                    <Eye size={14} />
                    <span>View</span>
                  </button>

                  <button
                    type="button"
                    className={styles.mobileBtnPrimary}
                    onClick={() => onEditPermissions(role)}
                  >
                    <KeyRound size={14} />
                    <span>Permissions</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default RolesTable;
