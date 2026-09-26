import React, { useState, useEffect, useMemo } from 'react';
import {
  ArrowLeft,
  Shield,
  KeyRound,
  Check,
  RotateCcw,
  Search,
  CheckSquare,
  Square,
  AlertCircle,
  Lock,
  Layers,
  Sparkles,
  Info,
  CheckCheck,
  XCircle,
  HelpCircle
} from 'lucide-react';
import styles from './PermissionMatrix.module.css';
import PermissionSummary from './PermissionSummary';
import { PERMISSION_MODULES, createFullPermissions, createEmptyPermissions } from '../../data/rolesPermissionsData';

// Standard action keys aligned in fixed table columns
const STANDARD_ACTIONS = [
  { key: 'view', label: 'View', headerTip: 'Read-only visibility access' },
  { key: 'add', label: 'Add / Create', headerTip: 'Permission to create new entries' },
  { key: 'edit', label: 'Edit / Update', headerTip: 'Permission to modify existing records' },
  { key: 'delete', label: 'Delete', headerTip: 'Permission to remove records' },
  { key: 'approve', label: 'Approve', headerTip: 'Permission to authorize workflows' },
];

function PermissionMatrix({
  role: directRole,
  roles = [],
  initialSelectedRoleId,
  onSavePermissions,
  onBack
}) {
  // Determine active role from direct prop or roles list
  const activeRole = useMemo(() => {
    if (directRole) return directRole;
    if (Array.isArray(roles) && roles.length > 0) {
      if (initialSelectedRoleId) {
        const found = roles.find(r => r.id === initialSelectedRoleId || r.roleId === initialSelectedRoleId);
        if (found) return found;
      }
      return roles[0];
    }
    return null;
  }, [directRole, roles, initialSelectedRoleId]);

  const [currentRole, setCurrentRole] = useState(activeRole);

  useEffect(() => {
    if (activeRole) {
      setCurrentRole(activeRole);
    }
  }, [activeRole]);

  // Working permissions state
  const [workingPerms, setWorkingPerms] = useState(() => {
    return currentRole?.permissions ? JSON.parse(JSON.stringify(currentRole.permissions)) : createEmptyPermissions();
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showUnsavedPrompt, setShowUnsavedPrompt] = useState(false);

  // Sync state if currentRole changes
  useEffect(() => {
    if (currentRole && currentRole.permissions) {
      setWorkingPerms(JSON.parse(JSON.stringify(currentRole.permissions)));
    } else {
      setWorkingPerms(createEmptyPermissions());
    }
  }, [currentRole]);

  // Check if permissions have been modified (dirty state)
  const isDirty = useMemo(() => {
    if (!currentRole || !currentRole.permissions) return false;
    return JSON.stringify(workingPerms) !== JSON.stringify(currentRole.permissions);
  }, [workingPerms, currentRole]);

  // Categories list
  const categories = useMemo(() => {
    const cats = new Set(PERMISSION_MODULES.map(m => m.category));
    return ['all', ...Array.from(cats)];
  }, []);

  // Filtered modules list
  const filteredModules = useMemo(() => {
    return PERMISSION_MODULES.filter(mod => {
      const matchesSearch = 
        mod.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        mod.description.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = 
        selectedCategory === 'all' || 
        mod.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [searchTerm, selectedCategory]);

  // Toggle single action permission
  const handleToggleAction = (moduleKey, actionKey) => {
    setWorkingPerms(prev => {
      const currentModulePerms = prev[moduleKey] || [];
      const isGranted = currentModulePerms.includes(actionKey);
      let newModulePerms;

      if (isGranted) {
        // If unchecking 'view', remove view and clear all actions for this module (since view is prerequisite)
        if (actionKey === 'view') {
          newModulePerms = [];
        } else {
          newModulePerms = currentModulePerms.filter(a => a !== actionKey);
        }
      } else {
        // Granting action
        newModulePerms = [...currentModulePerms, actionKey];
        // If enabling any action while 'view' is missing, automatically enable 'view'
        if (actionKey !== 'view' && !newModulePerms.includes('view')) {
          newModulePerms.push('view');
        }
      }

      return {
        ...prev,
        [moduleKey]: newModulePerms
      };
    });
  };

  // Module-level Select All toggle
  const handleToggleModuleSelectAll = (module) => {
    setWorkingPerms(prev => {
      const current = prev[module.key] || [];
      const allActionKeys = module.actions.map(a => a.key);
      const isAllSelected = allActionKeys.every(k => current.includes(k));

      return {
        ...prev,
        [module.key]: isAllSelected ? [] : allActionKeys
      };
    });
  };

  // Global Select All
  const handleGlobalSelectAll = () => {
    setWorkingPerms(createFullPermissions());
  };

  // Global Clear All
  const handleGlobalClearAll = () => {
    setWorkingPerms(createEmptyPermissions());
  };

  // Reset to last saved state
  const handleResetToSaved = () => {
    if (currentRole && currentRole.permissions) {
      setWorkingPerms(JSON.parse(JSON.stringify(currentRole.permissions)));
    }
  };

  // Safe navigation back
  const handleSafeBack = () => {
    if (isDirty) {
      setShowUnsavedPrompt(true);
    } else {
      onBack();
    }
  };

  const handleConfirmDiscard = () => {
    setShowUnsavedPrompt(false);
    onBack();
  };

  const handleSave = () => {
    if (currentRole && onSavePermissions) {
      onSavePermissions(currentRole.id || currentRole.roleId, workingPerms);
    }
  };

  if (!currentRole) {
    return (
      <div className={styles.matrixContainer}>
        <div style={{ padding: '60px 20px', textAlign: 'center', color: '#64748b' }}>
          <Shield size={36} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
          <h3 style={{ margin: '0 0 8px', color: '#334155' }}>No Role Selected</h3>
          <p style={{ margin: '0 0 20px', fontSize: '14px' }}>Please select a role from Configured Roles to manage its permissions.</p>
          <button type="button" className={styles.backBtn} onClick={onBack}>
            <ArrowLeft size={16} /> Back to Roles
          </button>
        </div>
      </div>
    );
  }

  const isSystem = currentRole.type === 'system';

  return (
    <div className={styles.matrixContainer}>
      {/* Role Header Banner */}
      <div className={styles.roleBanner}>
        <div className={styles.roleBannerLeft}>
          <div className={`${styles.roleIcon} ${isSystem ? styles.systemIcon : styles.customIcon}`}>
            {isSystem ? <Shield size={24} /> : <KeyRound size={24} />}
          </div>
          <div>
            <div className={styles.titleRow}>
              <h1 className={styles.roleTitle}>{currentRole.name}</h1>
              {roles && roles.length > 1 && (
                <select
                  value={currentRole.id || currentRole.roleId}
                  onChange={(e) => {
                    const selected = roles.find(r => (r.id || r.roleId) === e.target.value);
                    if (selected) {
                      setCurrentRole(selected);
                    }
                  }}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    background: '#fff',
                    color: '#334155',
                    cursor: 'pointer'
                  }}
                >
                  {roles.map(r => (
                    <option key={r.id || r.roleId} value={r.id || r.roleId}>
                      {r.name}
                    </option>
                  ))}
                </select>
              )}
              <span className={`${styles.typeBadge} ${isSystem ? styles.badgeSystem : styles.badgeCustom}`}>
                {isSystem ? 'System Role' : 'Custom Role'}
              </span>
              <span className={`${styles.statusBadge} ${currentRole.status === 'Active' ? styles.statusActive : styles.statusInactive}`}>
                {currentRole.status}
              </span>
              {isSystem && (
                <span className={styles.protectedBadge}>
                  <Lock size={12} /> System Managed
                </span>
              )}
            </div>
            <p className={styles.roleDesc}>{currentRole.description || 'Configured system access control role.'}</p>
          </div>
        </div>

        {/* Live Summary Component */}
        <div className={styles.summaryWrapper}>
          <PermissionSummary role={currentRole} permissions={workingPerms} />
        </div>
      </div>

      {/* Toolbar & Filters */}
      <div className={styles.toolbar}>
        <div className={styles.searchAndFilters}>
          <div className={styles.searchBox}>
            <Search size={16} className={styles.searchIcon} />
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Search modules..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              aria-label="Search modules"
            />
            {searchTerm && (
              <button 
                type="button" 
                className={styles.clearSearch} 
                onClick={() => setSearchTerm('')}
              >
                ×
              </button>
            )}
          </div>

          <div className={styles.categoryPills}>
            {categories.map(cat => (
              <button
                key={cat}
                type="button"
                className={`${styles.categoryPill} ${selectedCategory === cat ? styles.categoryActive : ''}`}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat === 'all' ? 'All Modules' : cat}
              </button>
            ))}
          </div>
        </div>

        {/* Bulk Action Controls */}
        <div className={styles.bulkActions}>
          <button
            type="button"
            className={styles.btnBulk}
            onClick={handleGlobalSelectAll}
            title="Enable all permissions for all modules"
          >
            <CheckCheck size={14} />
            <span>Select All</span>
          </button>
          <button
            type="button"
            className={styles.btnBulk}
            onClick={handleGlobalClearAll}
            title="Clear all permissions"
          >
            <XCircle size={14} />
            <span>Clear All</span>
          </button>
        </div>
      </div>

      {/* Permission Matrix Table Card */}
      <div className={styles.matrixTableCard}>
        <div className={styles.tableResponsive}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.thModule}>Module & Scope</th>
                <th className={styles.thSelectAll}>All</th>
                {STANDARD_ACTIONS.map(act => (
                  <th key={act.key} className={styles.thAction} title={act.headerTip}>
                    {act.label}
                  </th>
                ))}
                <th className={styles.thSpecial}>Special Operations</th>
              </tr>
            </thead>
            <tbody>
              {filteredModules.map((module) => {
                const assignedActions = workingPerms[module.key] || [];
                const hasView = assignedActions.includes('view');
                const allActionKeys = module.actions.map(a => a.key);
                const isAllSelected = allActionKeys.length > 0 && allActionKeys.every(k => assignedActions.includes(k));
                
                // Separate standard actions and special actions
                const specialActions = module.actions.filter(a => !STANDARD_ACTIONS.some(sa => sa.key === a.key));

                return (
                  <tr key={module.key} className={`${styles.row} ${hasView ? styles.rowActive : styles.rowDisabled}`}>
                    {/* Module Column */}
                    <td className={styles.tdModule}>
                      <div className={styles.moduleMeta}>
                        <div className={styles.moduleNameRow}>
                          <strong className={styles.moduleName}>{module.name}</strong>
                          <span className={styles.categoryTag}>{module.category}</span>
                        </div>
                        <p className={styles.moduleDescription}>{module.description}</p>
                      </div>
                    </td>

                    {/* Row-level Select All Checkbox */}
                    <td className={styles.tdSelectAll}>
                      <label className={styles.checkboxLabel} title={`Select all actions for ${module.name}`}>
                        <input
                          type="checkbox"
                          className={styles.hiddenCheckbox}
                          checked={isAllSelected}
                          onChange={() => handleToggleModuleSelectAll(module)}
                        />
                        <span className={`${styles.customCheckbox} ${isAllSelected ? styles.checkedBox : ''}`}>
                          {isAllSelected && '✓'}
                        </span>
                      </label>
                    </td>

                    {/* Standard Action Columns */}
                    {STANDARD_ACTIONS.map(stdAct => {
                      const actionDef = module.actions.find(a => a.key === stdAct.key);
                      const isSupported = Boolean(actionDef);
                      const isChecked = assignedActions.includes(stdAct.key);
                      
                      // Dependency logic: View is required for Add/Edit/Delete/Approve
                      const isDisabled = !isSupported || (stdAct.key !== 'view' && !hasView);

                      if (!isSupported) {
                        return (
                          <td key={stdAct.key} className={styles.tdAction}>
                            <span className={styles.notApplicable} title="Action not applicable to this module">—</span>
                          </td>
                        );
                      }

                      return (
                        <td key={stdAct.key} className={styles.tdAction}>
                          <label 
                            className={`${styles.checkboxLabel} ${isDisabled ? styles.disabledLabel : ''}`}
                            title={
                              !hasView && stdAct.key !== 'view'
                                ? 'Requires View permission to be enabled'
                                : actionDef.description
                            }
                          >
                            <input
                              type="checkbox"
                              className={styles.hiddenCheckbox}
                              checked={isChecked}
                              disabled={isDisabled}
                              onChange={() => handleToggleAction(module.key, stdAct.key)}
                            />
                            <span className={`${styles.customCheckbox} ${isChecked ? styles.checkedBox : ''} ${isDisabled ? styles.disabledBox : ''}`}>
                              {isChecked && '✓'}
                            </span>
                          </label>
                        </td>
                      );
                    })}

                    {/* Special Actions Column */}
                    <td className={styles.tdSpecial}>
                      {specialActions.length === 0 ? (
                        <span className={styles.notApplicable}>—</span>
                      ) : (
                        <div className={styles.specialActionsList}>
                          {specialActions.map(specAct => {
                            const isChecked = assignedActions.includes(specAct.key);
                            const isDisabled = !hasView;

                            return (
                              <label
                                key={specAct.key}
                                className={`${styles.specialActionPill} ${isChecked ? styles.specialGranted : ''} ${isDisabled ? styles.specialDisabled : ''}`}
                                title={!hasView ? 'Requires View permission' : specAct.description}
                              >
                                <input
                                  type="checkbox"
                                  className={styles.hiddenCheckbox}
                                  checked={isChecked}
                                  disabled={isDisabled}
                                  onChange={() => handleToggleAction(module.key, specAct.key)}
                                />
                                <span className={styles.specialPillIndicator}>{isChecked ? '✓' : '+'}</span>
                                <span>{specAct.label}</span>
                              </label>
                            );
                          })}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sticky Save / Action Footer */}
      <div className={styles.stickyFooter}>
        <div className={styles.footerStatus}>
          {isDirty ? (
            <span className={styles.dirtyNotice}>
              <AlertCircle size={15} />
              <span>You have unsaved permission changes.</span>
            </span>
          ) : (
            <span className={styles.cleanNotice}>
              <Check size={15} />
              <span>All permissions are saved.</span>
            </span>
          )}
        </div>

        <div className={styles.footerButtons}>
          <button
            type="button"
            className={styles.btnFooterCancel}
            onClick={handleSafeBack}
          >
            Cancel
          </button>

          {isDirty && (
            <button
              type="button"
              className={styles.btnFooterReset}
              onClick={handleResetToSaved}
              title="Revert all changes to last saved state"
            >
              <RotateCcw size={14} />
              <span>Reset Changes</span>
            </button>
          )}

          <button
            type="button"
            className={styles.btnFooterSave}
            onClick={handleSave}
            disabled={!isDirty}
          >
            <Check size={16} />
            <span>Save Permissions</span>
          </button>
        </div>
      </div>

      {/* Unsaved Changes Confirmation Modal */}
      {showUnsavedPrompt && (
        <div className={styles.dialogOverlay} role="dialog" aria-modal="true">
          <div className={styles.dialogModal}>
            <div className={styles.dialogIcon}>
              <AlertCircle size={24} />
            </div>
            <h3 className={styles.dialogTitle}>Unsaved Permission Changes</h3>
            <p className={styles.dialogDesc}>
              You have modified permissions for <strong>{currentRole.name}</strong> that have not been saved yet. If you leave now, your changes will be discarded.
            </p>
            <div className={styles.dialogActions}>
              <button
                type="button"
                className={styles.dialogBtnStay}
                onClick={() => setShowUnsavedPrompt(false)}
              >
                Stay on Page
              </button>
              <button
                type="button"
                className={styles.dialogBtnDiscard}
                onClick={handleConfirmDiscard}
              >
                Discard & Leave
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PermissionMatrix;
