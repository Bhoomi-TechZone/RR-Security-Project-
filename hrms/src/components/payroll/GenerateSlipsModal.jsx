import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  Printer,
  Calendar,
  Building2,
  Briefcase,
  Users,
  UserCheck,
  Search,
  CheckCircle,
  AlertCircle,
  Loader2,
  Check,
} from 'lucide-react';
import styles from './GenerateSlipsModal.module.css';

export default function GenerateSlipsModal({
  isOpen,
  onClose,
  selectedMonth = '',
  monthLabel = '',
  companies = [],
  clientsList = [],
  departments = [],
  employees = [],
  records = [],
  onConfirm,
}) {
  const [selectedClient, setSelectedClient] = useState('all');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [generationScope, setGenerationScope] = useState('all'); // 'all' | 'selective'
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState([]);
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Unify employees and records into a single consolidated active list
  const unifiedEmployees = useMemo(() => {
    // If records exist for this month, prioritize them as they have accurate monthly calculations
    if (records && records.length > 0) {
      return records.map((r) => {
        const empMaster = (employees || []).find(
          (e) =>
            e.employeeId === r.employeeId ||
            e.employeeCode === r.employeeId ||
            e._id === r.employeeId
        );
        const name = r.employeeName || empMaster?.name || 'Staff';
        const initials =
          r.initials ||
          name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .slice(0, 2)
            .toUpperCase() ||
          'EM';

        return {
          id: r.id || r.employeeId,
          employeeId: r.employeeId,
          name,
          initials,
          clientName: r.clientName || empMaster?.clientName || empMaster?.companyName || 'General',
          clientId: empMaster?.clientId || '',
          department: r.department || empMaster?.department || 'Operations',
          designation: r.designation || empMaster?.designation || 'Staff',
          netSalary: r.netSalary || 0,
          grossSalary: r.grossSalary || r.earnings?.totalGross || 0,
        };
      });
    }

    // Fallback to employee master list
    return (employees || []).map((emp) => {
      const name = emp.name || `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || 'Staff';
      const initials =
        (emp.name || 'EM')
          .split(' ')
          .map((n) => n[0])
          .join('')
          .slice(0, 2)
          .toUpperCase() || 'EM';

      return {
        id: emp.id || emp._id || emp.employeeId,
        employeeId: emp.employeeId || emp.employeeCode || emp._id,
        name,
        initials,
        clientName: emp.clientName || emp.companyName || 'General',
        clientId: emp.clientId || '',
        department: emp.department || 'Operations',
        designation: emp.designation || 'Staff',
        netSalary: emp.netSalary || emp.grossSalary || 0,
        grossSalary: emp.grossSalary || 0,
      };
    });
  }, [records, employees]);

  // Compile unique client list with live employee counts
  const availableClients = useMemo(() => {
    const clientsMap = new Map();

    // 1. From clientsList / companies
    const baseClients = clientsList.length > 0 ? clientsList : companies;
    baseClients.forEach((c) => {
      const name = c.name || c.clientName || c.companyName;
      if (name && !['all', 'all clients'].includes(name.toLowerCase())) {
        clientsMap.set(name.toLowerCase(), {
          id: c.clientId || c.id || name,
          name,
        });
      }
    });

    // 2. From employees
    unifiedEmployees.forEach((emp) => {
      if (emp.clientName && !['all', 'all clients', 'general'].includes(emp.clientName.toLowerCase())) {
        const key = emp.clientName.toLowerCase();
        if (!clientsMap.has(key)) {
          clientsMap.set(key, {
            id: emp.clientId || emp.clientName,
            name: emp.clientName,
          });
        }
      }
    });

    const clientArray = Array.from(clientsMap.values());

    return clientArray.map((c) => {
      const count = unifiedEmployees.filter((emp) => {
        const empC = (emp.clientName || '').toLowerCase().trim();
        const target = c.name.toLowerCase().trim();
        return empC === target || empC.includes(target) || emp.clientId === c.id;
      }).length;
      return {
        ...c,
        employeeCount: count,
      };
    });
  }, [clientsList, companies, unifiedEmployees]);

  // Filter employees matching selected client
  const employeesForSelectedClient = useMemo(() => {
    if (!selectedClient || selectedClient === 'all') {
      return unifiedEmployees;
    }
    const target = selectedClient.toLowerCase().trim();
    return unifiedEmployees.filter((emp) => {
      const empC = (emp.clientName || '').toLowerCase().trim();
      const empId = (emp.clientId || '').toLowerCase().trim();
      return empC === target || empC.includes(target) || empId === target;
    });
  }, [unifiedEmployees, selectedClient]);

  // Available departments for the selected client
  const clientDepartments = useMemo(() => {
    const set = new Set();
    employeesForSelectedClient.forEach((emp) => {
      if (emp.department) set.add(emp.department);
    });
    return Array.from(set);
  }, [employeesForSelectedClient]);

  // Filter employees matching selected department
  const filteredEmployees = useMemo(() => {
    if (!selectedDepartment || selectedDepartment === 'all') {
      return employeesForSelectedClient;
    }
    const dept = selectedDepartment.toLowerCase().trim();
    return employeesForSelectedClient.filter(
      (emp) => (emp.department || '').toLowerCase().trim() === dept
    );
  }, [employeesForSelectedClient, selectedDepartment]);

  // When selected client or department changes, update or prune selected employee IDs
  useEffect(() => {
    if (generationScope === 'selective') {
      const validIds = new Set(filteredEmployees.map((e) => e.employeeId));
      setSelectedEmployeeIds((prev) => prev.filter((id) => validIds.has(id)));
    }
  }, [selectedClient, selectedDepartment, filteredEmployees, generationScope]);

  // Search filtered list for the selective employee dropdown/picker
  const searchFilteredEmployees = useMemo(() => {
    if (!employeeSearch.trim()) return filteredEmployees;
    const q = employeeSearch.toLowerCase().trim();
    return filteredEmployees.filter((emp) =>
      `${emp.name} ${emp.employeeId} ${emp.designation} ${emp.department}`
        .toLowerCase()
        .includes(q)
    );
  }, [filteredEmployees, employeeSearch]);

  // Target count and target employees list
  const targetCount = useMemo(() => {
    if (generationScope === 'all') {
      return filteredEmployees.length;
    }
    return selectedEmployeeIds.length;
  }, [generationScope, filteredEmployees.length, selectedEmployeeIds.length]);

  if (!isOpen) return null;

  // Toggle single employee selection
  const handleToggleEmployee = (empId) => {
    setSelectedEmployeeIds((prev) =>
      prev.includes(empId) ? prev.filter((id) => id !== empId) : [...prev, empId]
    );
  };

  // Select all currently visible in search
  const handleSelectAllVisible = () => {
    const visibleIds = searchFilteredEmployees.map((e) => e.employeeId);
    setSelectedEmployeeIds((prev) => Array.from(new Set([...prev, ...visibleIds])));
  };

  // Clear all selections
  const handleClearSelection = () => {
    setSelectedEmployeeIds([]);
  };

  // Form submit handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (targetCount === 0 || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const clientName =
        selectedClient === 'all'
          ? 'All Clients'
          : availableClients.find((c) => c.name === selectedClient || c.id === selectedClient)?.name ||
            selectedClient;

      await onConfirm({
        client: selectedClient,
        clientName,
        department: selectedDepartment,
        generationType: generationScope,
        employeeIds:
          generationScope === 'selective'
            ? selectedEmployeeIds
            : filteredEmployees.map((e) => e.employeeId),
        totalEmployees: targetCount,
      });
    } catch (err) {
      console.error('Failed to submit slip generation:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true">
      <div className={styles.modal}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.titleWrap}>
            <div className={styles.iconCircle}>
              <Printer size={18} className={styles.icon} />
            </div>
            <div>
              <h2>Generate Salary Slips</h2>
              <p className={styles.subtitle}>
                Generate and finalize monthly salary slips for workforce
              </p>
            </div>
          </div>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Close modal"
            disabled={isSubmitting}
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.body}>
            {/* Row 1: Month and Client */}
            <div className={styles.gridRow}>
              {/* Month */}
              <div className={styles.field}>
                <label className={styles.label}>
                  <Calendar size={13} />
                  <span>Salary Month</span>
                </label>
                <div className={styles.inputWithIcon}>
                  <input
                    type="text"
                    className={styles.input}
                    value={monthLabel || selectedMonth || 'Current Month'}
                    readOnly
                  />
                  <span className={styles.readOnlyBadge}>Active</span>
                </div>
              </div>

              {/* Client Selection */}
              <div className={styles.field}>
                <label className={styles.label}>
                  <Building2 size={13} />
                  <span>Select Client</span>
                </label>
                <select
                  className={styles.select}
                  value={selectedClient}
                  onChange={(e) => {
                    setSelectedClient(e.target.value);
                    setSelectedDepartment('all');
                  }}
                  disabled={isSubmitting}
                >
                  <option value="all">
                    All Clients ({unifiedEmployees.length} Employees)
                  </option>
                  {availableClients.map((c) => (
                    <option key={c.id || c.name} value={c.name}>
                      {c.name} ({c.employeeCount} {c.employeeCount === 1 ? 'Employee' : 'Employees'})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Department Filter (Optional refinement) */}
            <div className={styles.field}>
              <label className={styles.label}>
                <Briefcase size={13} />
                <span>Department (Optional)</span>
              </label>
              <select
                className={styles.select}
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                disabled={isSubmitting}
              >
                <option value="all">
                  All Departments ({employeesForSelectedClient.length} Employees)
                </option>
                {(clientDepartments.length > 0 ? clientDepartments : departments).map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            {/* Scope Selection: All vs Selective */}
            <div className={styles.field}>
              <label className={styles.label}>
                <Users size={13} />
                <span>Employee Selection Mode</span>
              </label>
              <div className={styles.scopeCards}>
                {/* Option 1: All Employees */}
                <button
                  type="button"
                  className={`${styles.scopeCard} ${
                    generationScope === 'all' ? styles.scopeCardActive : ''
                  }`}
                  onClick={() => setGenerationScope('all')}
                  disabled={isSubmitting}
                >
                  <div className={styles.radioDot}>
                    {generationScope === 'all' && <div className={styles.radioDotInner} />}
                  </div>
                  <div className={styles.scopeIcon}>
                    <Users size={18} />
                  </div>
                  <div className={styles.scopeInfo}>
                    <div className={styles.scopeTitle}>All Employees</div>
                    <div className={styles.scopeSub}>
                      Generate slips for all ({filteredEmployees.length}) employees of selected client
                    </div>
                  </div>
                  <span className={styles.countPill}>{filteredEmployees.length}</span>
                </button>

                {/* Option 2: Selective Employees */}
                <button
                  type="button"
                  className={`${styles.scopeCard} ${
                    generationScope === 'selective' ? styles.scopeCardActive : ''
                  }`}
                  onClick={() => setGenerationScope('selective')}
                  disabled={isSubmitting}
                >
                  <div className={styles.radioDot}>
                    {generationScope === 'selective' && <div className={styles.radioDotInner} />}
                  </div>
                  <div className={styles.scopeIcon}>
                    <UserCheck size={18} />
                  </div>
                  <div className={styles.scopeInfo}>
                    <div className={styles.scopeTitle}>Selective Employees</div>
                    <div className={styles.scopeSub}>
                      Select specific employees from this client
                    </div>
                  </div>
                  <span className={styles.countPill}>
                    {selectedEmployeeIds.length} Selected
                  </span>
                </button>
              </div>
            </div>

            {/* Selective Employee Picker (rendered when 'selective' mode is chosen) */}
            {generationScope === 'selective' && (
              <div className={styles.selectiveSection}>
                <div className={styles.selectiveHeader}>
                  <div className={styles.searchBar}>
                    <Search size={14} className={styles.searchIcon} />
                    <input
                      type="text"
                      className={styles.searchInput}
                      placeholder="Search employees by name, ID, or designation..."
                      value={employeeSearch}
                      onChange={(e) => setEmployeeSearch(e.target.value)}
                    />
                    {employeeSearch && (
                      <button
                        type="button"
                        className={styles.searchClear}
                        onClick={() => setEmployeeSearch('')}
                      >
                        <X size={13} />
                      </button>
                    )}
                  </div>
                  <div className={styles.selectiveActions}>
                    <button
                      type="button"
                      className={styles.actionBtn}
                      onClick={handleSelectAllVisible}
                      disabled={searchFilteredEmployees.length === 0}
                    >
                      Select All ({searchFilteredEmployees.length})
                    </button>
                    <button
                      type="button"
                      className={styles.actionBtn}
                      onClick={handleClearSelection}
                      disabled={selectedEmployeeIds.length === 0}
                    >
                      Clear
                    </button>
                  </div>
                </div>

                {/* Selected Chips Bar */}
                {selectedEmployeeIds.length > 0 && (
                  <div className={styles.chipsRow}>
                    <span className={styles.chipsLabel}>Selected:</span>
                    <div className={styles.chipsList}>
                      {selectedEmployeeIds.slice(0, 4).map((id) => {
                        const emp = unifiedEmployees.find((e) => e.employeeId === id);
                        return (
                          <span key={id} className={styles.empChip}>
                            <span>{emp ? emp.name : id}</span>
                            <button
                              type="button"
                              onClick={() => handleToggleEmployee(id)}
                              aria-label="Remove"
                            >
                              <X size={12} />
                            </button>
                          </span>
                        );
                      })}
                      {selectedEmployeeIds.length > 4 && (
                        <span className={styles.moreChip}>
                          +{selectedEmployeeIds.length - 4} more
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Employee List */}
                <div className={styles.employeeList}>
                  {searchFilteredEmployees.length > 0 ? (
                    searchFilteredEmployees.map((emp) => {
                      const isChecked = selectedEmployeeIds.includes(emp.employeeId);
                      return (
                        <div
                          key={emp.employeeId}
                          className={`${styles.employeeRow} ${
                            isChecked ? styles.employeeRowChecked : ''
                          }`}
                          onClick={() => handleToggleEmployee(emp.employeeId)}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === ' ' || e.key === 'Enter') {
                              e.preventDefault();
                              handleToggleEmployee(emp.employeeId);
                            }
                          }}
                        >
                          <div className={styles.checkboxBox}>
                            {isChecked ? (
                              <div className={styles.customCheckActive}>
                                <Check size={12} strokeWidth={3} />
                              </div>
                            ) : (
                              <div className={styles.customCheck} />
                            )}
                          </div>
                          <div className={styles.empAvatar}>{emp.initials}</div>
                          <div className={styles.empDetails}>
                            <div className={styles.empNameRow}>
                              <span className={styles.empNameText}>{emp.name}</span>
                              <span className={styles.empIdBadge}>{emp.employeeId}</span>
                            </div>
                            <div className={styles.empMetaRow}>
                              <span>{emp.designation}</span>
                              <span className={styles.metaDot}>•</span>
                              <span>{emp.department}</span>
                              {selectedClient === 'all' && emp.clientName && (
                                <>
                                  <span className={styles.metaDot}>•</span>
                                  <span className={styles.clientTag}>{emp.clientName}</span>
                                </>
                              )}
                            </div>
                          </div>
                          {emp.netSalary > 0 && (
                            <div className={styles.salaryBadge}>
                              ₹{emp.netSalary.toLocaleString('en-IN')}
                            </div>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <div className={styles.emptyEmployees}>
                      <AlertCircle size={20} className={styles.emptyIcon} />
                      <p>
                        {employeeSearch
                          ? 'No employees match your search query.'
                          : 'No employees found under this client/department.'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Target Summary Box */}
            <div className={styles.statBox}>
              <div className={styles.statItem}>
                <span className={styles.statLabel}>Target Employees</span>
                <strong className={styles.statValue}>
                  {targetCount.toLocaleString('en-IN')}{' '}
                  <span className={styles.statUnit}>
                    {targetCount === 1 ? 'employee' : 'employees'}
                  </span>
                </strong>
                <span className={styles.statDesc}>
                  {generationScope === 'selective'
                    ? `${targetCount} selective employee${targetCount === 1 ? '' : 's'} from ${
                        selectedClient === 'all' ? 'all clients' : selectedClient
                      }`
                    : `All ${targetCount} employee${targetCount === 1 ? '' : 's'} from ${
                        selectedClient === 'all' ? 'all clients' : selectedClient
                      }`}
                </span>
              </div>
              <div className={styles.statStatusItem}>
                <span className={styles.statLabel}>Status</span>
                {targetCount > 0 ? (
                  <span className={styles.statusReady}>
                    <CheckCircle size={14} />
                    <span>Ready for Generation</span>
                  </span>
                ) : (
                  <span className={styles.statusWarning}>
                    <AlertCircle size={14} />
                    <span>Select At Least 1 Employee</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className={styles.footer}>
            <button
              type="button"
              className={styles.cancelBtn}
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={styles.generateBtn}
              disabled={targetCount === 0 || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className={styles.spin} />
                  <span>Generating Slips...</span>
                </>
              ) : (
                <>
                  <Printer size={16} />
                  <span>
                    Generate {targetCount > 0 ? `(${targetCount}) ` : ''}Slips
                  </span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
