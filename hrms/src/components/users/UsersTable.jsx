import React, { useState } from 'react';
import {
  Users,
  Search,
  RotateCcw,
  Eye,
  Edit2,
  MoreVertical,
  KeyRound,
  UserX,
  UserCheck,
  AlertOctagon,
  Key,
  Mail,
  Phone,
  Clock,
  Shield
} from 'lucide-react';
import styles from './UsersTable.module.css';
import Avatar from '../common/Avatar';
import Dropdown from '../common/Dropdown';

function UsersTable({
  users = [],
  roles = [],
  onViewUser,
  onEditUser,
  onChangeRole,
  onToggleStatus,
  onSuspendUser,
  onResetAccess,
  onAddUser,
  externalStatusFilter = 'all'
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState(
    externalStatusFilter === 'active' || externalStatusFilter === 'inactive' ? externalStatusFilter : 'all'
  );

  React.useEffect(() => {
    if (externalStatusFilter === 'active' || externalStatusFilter === 'inactive') {
      setStatusFilter(externalStatusFilter);
    } else if (externalStatusFilter === 'all') {
      setStatusFilter('all');
    }
  }, [externalStatusFilter]);

  const filteredUsers = users.filter(user => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      user.name.toLowerCase().includes(term) ||
      user.email.toLowerCase().includes(term) ||
      user.userId.toLowerCase().includes(term) ||
      (user.username && user.username.toLowerCase().includes(term));

    const matchesRole = roleFilter === 'all' || user.roleId === roleFilter;
    const matchesStatus = statusFilter === 'all' || user.status.toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleResetFilters = () => {
    setSearchTerm('');
    setRoleFilter('all');
    setStatusFilter('all');
  };

  const hasActiveFilters = searchTerm || roleFilter !== 'all' || statusFilter !== 'all';

  return (
    <div className={styles.container}>
      {/* Search and Filters Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.searchWrapper}>
          <Search size={16} className={styles.searchIcon} />
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search users by name, username, ID, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            aria-label="Search users"
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
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              aria-label="Filter by role"
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
              aria-label="Filter by account status"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              className={styles.resetBtn}
              onClick={handleResetFilters}
            >
              <RotateCcw size={14} />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Users Table Card */}
      <div className={styles.tableCard}>
        <div className={styles.tableResponsive}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>User</th>
                <th>User ID</th>
                <th>Assigned Role</th>
                <th>Email</th>
                <th>Status</th>
                <th>Created On</th>
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
                      <p>Try adjusting your search query or filter parameters.</p>
                      {hasActiveFilters && (
                        <button
                          type="button"
                          className={styles.emptyResetBtn}
                          onClick={handleResetFilters}
                        >
                          Clear Filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredUsers.map(user => {
                  const roleObj = roles.find(r => r.id === user.roleId || r.name === user.roleName);
                  const isSystemRole = roleObj?.type === 'system';
                  const isActive = user.status === 'Active';
                  const isSuspended = user.status === 'Suspended';

                  return (
                    <tr key={user.id} className={styles.row}>
                      {/* User Avatar + Name + Username */}
                      <td>
                        <div className={styles.userCell}>
                          <Avatar initials={user.initials} name={user.name} size="md" />
                          <div className={styles.userInfo}>
                            <strong className={styles.userName}>{user.name}</strong>
                            <span className={styles.userUsername}>@{user.username || user.userId.toLowerCase()}</span>
                          </div>
                        </div>
                      </td>

                      {/* User ID */}
                      <td>
                        <span className={styles.idBadge}>{user.userId}</span>
                      </td>

                      {/* Role Badge */}
                      <td>
                        <span className={`${styles.roleBadge} ${isSystemRole ? styles.badgeSystem : styles.badgeCustom}`}>
                          {user.roleName}
                        </span>
                      </td>

                      {/* Email */}
                      <td>
                        <span className={styles.emailText} title={user.email}>
                          {user.email}
                        </span>
                      </td>

                      {/* Status */}
                      <td>
                        <span className={`${styles.statusBadge} ${
                          isActive ? styles.statusActive : isSuspended ? styles.statusSuspended : styles.statusInactive
                        }`}>
                          <span className={`${styles.statusDot} ${
                            isActive ? styles.dotActive : isSuspended ? styles.dotSuspended : styles.dotInactive
                          }`} />
                          {user.status}
                        </span>
                      </td>

                      {/* Created On */}
                      <td>
                        <div className={styles.dateCell}>
                          <span className={styles.createdDate}>{user.createdOn || '—'}</span>
                          {user.lastLogin && (
                            <span className={styles.lastLoginText} title={`Last login: ${user.lastLogin}`}>
                              <Clock size={11} /> {user.lastLogin.split(' ')[0]}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className={styles.tdActions}>
                        <div className={styles.actionBtns}>
                          <button
                            type="button"
                            className={styles.btnView}
                            onClick={() => onViewUser(user)}
                            title="View user details"
                          >
                            <Eye size={14} />
                            <span>View</span>
                          </button>

                          <button
                            type="button"
                            className={styles.btnEdit}
                            onClick={() => onEditUser(user)}
                            title="Edit user"
                          >
                            <Edit2 size={14} />
                            <span>Edit</span>
                          </button>

                          <Dropdown
                            align="right"
                            trigger={
                              <button
                                type="button"
                                className={styles.btnMore}
                                aria-label={`More options for ${user.name}`}
                              >
                                <MoreVertical size={16} />
                              </button>
                            }
                          >
                            <ul className={styles.dropdownMenu}>
                              <li className={styles.dropdownItem}>
                                <button type="button" className={styles.dropdownBtn} onClick={() => onViewUser(user)}>
                                  <Eye size={14} /><span>View Details & Access</span>
                                </button>
                              </li>
                              <li className={styles.dropdownItem}>
                                <button type="button" className={styles.dropdownBtn} onClick={() => onEditUser(user)}>
                                  <Edit2 size={14} /><span>Edit User Info</span>
                                </button>
                              </li>
                              <li className={styles.dropdownItem}>
                                <button type="button" className={styles.dropdownBtn} onClick={() => onChangeRole(user)}>
                                  <KeyRound size={14} /><span>Change Role</span>
                                </button>
                              </li>
                              <li className={styles.dropdownDivider} />
                              <li className={styles.dropdownItem}>
                                <button
                                  type="button"
                                  className={`${styles.dropdownBtn} ${isActive ? styles.btnDeactivate : styles.btnActivate}`}
                                  onClick={() => onToggleStatus(user)}
                                >
                                  {isActive ? <UserX size={14} /> : <UserCheck size={14} />}
                                  <span>{isActive ? 'Deactivate User' : 'Activate User'}</span>
                                </button>
                              </li>
                              <li className={styles.dropdownItem}>
                                <button
                                  type="button"
                                  className={`${styles.dropdownBtn} ${styles.btnSuspend}`}
                                  onClick={() => onSuspendUser(user)}
                                >
                                  <AlertOctagon size={14} />
                                  <span>{isSuspended ? 'Unsuspend User' : 'Suspend Access'}</span>
                                </button>
                              </li>
                              <li className={styles.dropdownItem}>
                                <button type="button" className={styles.dropdownBtn} onClick={() => onResetAccess(user)}>
                                  <Key size={14} /><span>Reset Login Access</span>
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

        {/* Mobile Card View */}
        <div className={styles.mobileList}>
          {filteredUsers.map(user => {
            const roleObj = roles.find(r => r.id === user.roleId || r.name === user.roleName);
            const isSystemRole = roleObj?.type === 'system';
            const isActive = user.status === 'Active';
            const isSuspended = user.status === 'Suspended';

            return (
              <div key={user.id} className={styles.mobileCard}>
                <div className={styles.mobileCardHeader}>
                  <div className={styles.userCell}>
                    <Avatar initials={user.initials} name={user.name} size="md" />
                    <div className={styles.userInfo}>
                      <strong className={styles.userName}>{user.name}</strong>
                      <span className={styles.userUsername}>@{user.username || user.userId.toLowerCase()}</span>
                    </div>
                  </div>
                  <span className={`${styles.statusBadge} ${
                    isActive ? styles.statusActive : isSuspended ? styles.statusSuspended : styles.statusInactive
                  }`}>
                    {user.status}
                  </span>
                </div>

                <div className={styles.mobileGrid}>
                  <div className={styles.mobileGridItem}>
                    <span className={styles.mobileLabel}>User ID</span>
                    <strong className={styles.mobileValue}>{user.userId}</strong>
                  </div>
                  <div className={styles.mobileGridItem}>
                    <span className={styles.mobileLabel}>Role</span>
                    <strong className={styles.mobileValue}>{user.roleName}</strong>
                  </div>
                  <div className={styles.mobileGridItem} style={{ gridColumn: '1 / -1' }}>
                    <span className={styles.mobileLabel}>Email</span>
                    <span className={styles.mobileValueText}>{user.email}</span>
                  </div>
                </div>

                <div className={styles.mobileActions}>
                  <button type="button" className={styles.mobileBtnSecondary} onClick={() => onViewUser(user)}>
                    <Eye size={14} /><span>View</span>
                  </button>
                  <button type="button" className={styles.mobileBtnPrimary} onClick={() => onEditUser(user)}>
                    <Edit2 size={14} /><span>Edit</span>
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

export default UsersTable;
