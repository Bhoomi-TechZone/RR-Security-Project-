import React, { useState } from 'react';
import {
  Users,
  Search,
  RotateCcw,
  UserPlus,
  UserCheck,
  Shield,
  KeyRound,
  MoreVertical,
  Edit2,
  Trash2,
  Clock,
  Building2,
  Mail,
  UserX
} from 'lucide-react';
import styles from './AssignedUsersTable.module.css';
import Avatar from '../common/Avatar';
import Dropdown from '../common/Dropdown';

function AssignedUsersTable({
  users = [],
  roles = [],
  onAssignUser,
  onChangeRole,
  onToggleUserStatus,
  onRemoveUser
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredUsers = users.filter(user => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.company.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole = roleFilter === 'all' || user.roleId === roleFilter;
    const matchesStatus = statusFilter === 'all' || user.status.toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleResetFilters = () => {
    setSearchTerm('');
    setRoleFilter('all');
    setStatusFilter('all');
  };

  return (
    <div className={styles.container}>
      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.searchWrapper}>
          <Search size={16} className={styles.searchIcon} />
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search users by name, email, employee ID or company..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            aria-label="Search users"
          />
          {searchTerm && (
            <button
              type="button"
              className={styles.clearSearchBtn}
              onClick={() => setSearchTerm('')}
            >
              ×
            </button>
          )}
        </div>

        <div className={styles.filtersGroup}>
          <div className={styles.selectWrapper}>
            <select
              className={styles.select}
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              aria-label="Filter by assigned role"
            >
              <option value="all">All Roles</option>
              {roles.map(r => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </div>

          <div className={styles.selectWrapper}>
            <select
              className={styles.select}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Filter by user status"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          {(searchTerm || roleFilter !== 'all' || statusFilter !== 'all') && (
            <button
              type="button"
              className={styles.resetBtn}
              onClick={handleResetFilters}
            >
              <RotateCcw size={14} />
              <span>Reset</span>
            </button>
          )}

          <button
            type="button"
            className={styles.btnAssignUser}
            onClick={() => onAssignUser()}
          >
            <UserPlus size={15} />
            <span>Assign Role to User</span>
          </button>
        </div>
      </div>

      {/* Users Table Card */}
      <div className={styles.tableCard}>
        <div className={styles.tableResponsive}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>User / Employee</th>
                <th>Employee ID</th>
                <th>Company / Org</th>
                <th>Assigned Role</th>
                <th>Status</th>
                <th>Assigned Date</th>
                <th className={styles.thActions}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className={styles.emptyTd}>
                    <div className={styles.emptyState}>
                      <Users size={36} className={styles.emptyIcon} />
                      <h3>No users found</h3>
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
                filteredUsers.map(user => {
                  const roleObj = roles.find(r => r.id === user.roleId);
                  const isSystemRole = roleObj?.type === 'system';
                  const isActive = user.status === 'Active';

                  return (
                    <tr key={user.id} className={styles.row}>
                      <td>
                        <div className={styles.userCell}>
                          <Avatar
                            initials={user.initials}
                            name={user.name}
                            size="md"
                          />
                          <div className={styles.userInfo}>
                            <strong className={styles.userName}>{user.name}</strong>
                            <span className={styles.userEmail}>{user.email}</span>
                          </div>
                        </div>
                      </td>

                      <td>
                        <span className={styles.idCode}>{user.employeeId}</span>
                      </td>

                      <td>
                        <span className={styles.companyText}>{user.company}</span>
                      </td>

                      <td>
                        <div className={styles.roleCell}>
                          <span className={`${styles.roleBadge} ${isSystemRole ? styles.badgeSystemRole : styles.badgeCustomRole}`}>
                            {user.roleName}
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
                        <span className={styles.dateText}>{user.assignedOn || '—'}</span>
                      </td>

                      <td className={styles.tdActions}>
                        <div className={styles.actionBtns}>
                          <button
                            type="button"
                            className={styles.btnChangeRole}
                            onClick={() => onChangeRole(user)}
                            title="Change user's assigned role"
                          >
                            <KeyRound size={13} />
                            <span>Change Role</span>
                          </button>

                          <Dropdown
                            align="right"
                            trigger={
                              <button
                                type="button"
                                className={styles.btnMore}
                                aria-label={`Actions for ${user.name}`}
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
                                  onClick={() => onChangeRole(user)}
                                >
                                  <KeyRound size={14} />
                                  <span>Change Role</span>
                                </button>
                              </li>

                              <li className={styles.dropdownItem}>
                                <button
                                  type="button"
                                  className={styles.dropdownBtn}
                                  onClick={() => onToggleUserStatus(user)}
                                >
                                  <UserX size={14} />
                                  <span>{isActive ? 'Deactivate User' : 'Activate User'}</span>
                                </button>
                              </li>

                              <li className={styles.dropdownDivider} />

                              <li className={styles.dropdownItem}>
                                <button
                                  type="button"
                                  className={`${styles.dropdownBtn} ${styles.btnDelete}`}
                                  onClick={() => onRemoveUser(user)}
                                >
                                  <Trash2 size={14} />
                                  <span>Unassign / Remove</span>
                                </button>
                              </li>
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
      </div>
    </div>
  );
}

export default AssignedUsersTable;
