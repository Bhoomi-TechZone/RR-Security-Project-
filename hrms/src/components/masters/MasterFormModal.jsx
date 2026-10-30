import React, { useState, useEffect, useRef } from 'react';
import { X, Save, Loader2 } from 'lucide-react';
import { MANPOWER_SERVICE_OPTIONS } from '../../data/masters/clientData';
import styles from './MasterFormModal.module.css';

/**
 * MasterFormModal Component
 * Reusable modal for adding or editing all 12 Master categories.
 */
function MasterFormModal({
  isOpen,
  onClose,
  onSubmit,
  activeTab,
  editingItem = null,
  departments = [],
  clients = [],
  workLocations = [],
  componentCategory = 'earning',
  isSubmitting = false
}) {
  const [formData, setFormData] = useState({});
  const [branchInput, setBranchInput] = useState('');
  const [errors, setErrors] = useState({});
  const [internalSubmitting, setInternalSubmitting] = useState(false);
  const modalRef = useRef(null);

  const submitting = isSubmitting || internalSubmitting;
  const isEdit = !!editingItem;

  useEffect(() => {
    if (isOpen) {
      setInternalSubmitting(false);
      setErrors({});
      setBranchInput('');
      if (editingItem) {
        setFormData({
          ...editingItem,
          type: editingItem.type || componentCategory || 'earning',
          branchList: Array.isArray(editingItem.branchList) ? editingItem.branchList : [],
          shortName: editingItem.shortName || editingItem.code || '',
          componentType: editingItem.componentType || (['Paid Days', 'Paid Hours', 'Fixed Salary', 'Daily Salary', 'Rate Based', 'Variable'].includes(editingItem.type) ? editingItem.type : '') || '',
          deductionType: editingItem.deductionType || editingItem.componentType || '',
          status: editingItem.status || 'active',
          excludeFromGrossSalary: Boolean(editingItem.excludeFromGrossSalary),
          hideInCtcReports: Boolean(editingItem.hideInCtcReports),
          notPayable: Boolean(editingItem.notPayable),
          excludeHolidays: Boolean(editingItem.excludeHolidays),
          excludeWeekoffs: Boolean(editingItem.excludeWeekoffs),
          excludeFromCtc: Boolean(editingItem.excludeFromCtc),
          paybackOnExit: Boolean(editingItem.paybackOnExit)
        });
      } else {
        // Defaults for Add per activeTab
        const defaultState = { status: 'active' };

        if (activeTab === 'banks') {
          defaultState.branches = 0;
          defaultState.branchList = [];
        } else if (activeTab === 'designations') {
          const firstDept = departments.find(d => !d.status || d.status === 'active') || (departments.length > 0 ? departments[0] : null);
          defaultState.department = firstDept ? firstDept.name : '';
        } else if (activeTab === 'sites') {
          const firstClient = clients.find(c => !c.status || c.status === 'active') || (clients.length > 0 ? clients[0] : null);
          const firstLoc = workLocations.find(l => !l.status || l.status === 'active') || (workLocations.length > 0 ? workLocations[0] : null);
          defaultState.clientId = firstClient ? String(firstClient.id || firstClient._id || firstClient.clientId || '') : '';
          defaultState.clientName = firstClient ? (firstClient.name || firstClient.clientName || '') : '';
          defaultState.workLocationId = firstLoc ? String(firstLoc.id || firstLoc._id || firstLoc.locationId || '') : '';
          defaultState.workLocationName = firstLoc ? (firstLoc.locationName || firstLoc.name || '') : '';
          defaultState.minimumManpower = 12;
          defaultState.state = firstLoc?.state || 'Karnataka';
          defaultState.city = firstLoc?.city || 'Bangalore';
        } else if (activeTab === 'shifts') {
          defaultState.shiftType = 'day';
          defaultState.startTime = '06:00';
          defaultState.endTime = '14:00';
          defaultState.breakDuration = 30;
          defaultState.gracePeriod = 15;
        } else if (activeTab === 'leave-types') {
          defaultState.paidType = 'paid';
          defaultState.annualQuota = 12;
          defaultState.carryForward = false;
          defaultState.encashment = false;
          defaultState.maxAccumulation = 12;
        } else if (activeTab === 'holidays') {
          defaultState.holidayType = 'national';
          defaultState.applicableLocation = 'All Locations';
          defaultState.date = new Date().toISOString().split('T')[0];
        } else if (activeTab === 'salary-components') {
          defaultState.type = componentCategory || 'earning';
          defaultState.name = '';
          defaultState.shortName = '';
          defaultState.code = '';
          defaultState.componentType = '';
          defaultState.deductionType = '';
          defaultState.status = 'active';
          defaultState.excludeFromGrossSalary = false;
          defaultState.hideInCtcReports = false;
          defaultState.notPayable = false;
          defaultState.excludeHolidays = false;
          defaultState.excludeWeekoffs = false;
          defaultState.excludeFromCtc = false;
          defaultState.paybackOnExit = false;
          defaultState.calculationType = 'fixed';
          defaultState.taxable = 'taxable';
        } else if (activeTab === 'document-types') {
          defaultState.requiredType = 'required';
          defaultState.expiryRequired = false;
          defaultState.verificationRequired = true;
        }

        setFormData(defaultState);
      }
    }
  }, [isOpen, editingItem, activeTab, departments, clients, workLocations, componentCategory]);

  useEffect(() => {
    if (isOpen && modalRef.current) {
      modalRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const validate = () => {
    const newErrors = {};

    if (!formData.name?.trim()) {
      newErrors.name = 'Name is required.';
    }

    if (activeTab === 'banks') {
      if (!formData.code?.trim()) newErrors.code = 'Short code is required.';
    } else if (activeTab === 'designations') {
      if (!formData.department?.trim()) newErrors.department = 'Department is required.';
    } else if (activeTab === 'sites') {
      if (!formData.clientId) newErrors.clientId = 'Client is required.';
      if (formData.pinCode && !/^\d{6}$/.test(formData.pinCode.trim())) {
        newErrors.pinCode = 'Must be a 6-digit Indian PIN code.';
      }
    } else if (activeTab === 'shifts') {
      if (!formData.startTime) newErrors.startTime = 'Start time is required.';
      if (!formData.endTime) newErrors.endTime = 'End time is required.';
    } else if (activeTab === 'leave-types') {
      if (!formData.code?.trim()) newErrors.code = 'Leave code is required.';
      if (!formData.paidType) newErrors.paidType = 'Paid / Unpaid is required.';
    } else if (activeTab === 'holidays') {
      if (!formData.date) newErrors.date = 'Holiday date is required.';
    } else if (activeTab === 'salary-components') {
      if (!formData.name?.trim()) newErrors.name = 'Name is required.';
      if (!formData.shortName?.trim() && !formData.code?.trim()) newErrors.shortName = 'Short Name (Alias) is required.';
      const isDed = isEdit ? (editingItem?.type === 'deduction' || formData.type === 'deduction') : componentCategory === 'deduction';
      if (isDed) {
        if (!formData.deductionType && !formData.componentType) {
          newErrors.deductionType = 'Deduction Type is required.';
        }
      } else {
        if (!formData.componentType) {
          newErrors.componentType = 'Component Type is required.';
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    if (!validate()) return;
    const payload = { ...formData };
    if (activeTab === 'salary-components') {
      const alias = (payload.shortName || payload.code || '').trim();
      payload.code = alias;
      payload.shortName = alias;
      const isDed = isEdit ? (editingItem?.type === 'deduction' || payload.type === 'deduction') : componentCategory === 'deduction';
      payload.type_kind = isDed ? 'deduction' : 'earning';
      payload.type = 'salary-components';
      payload.masterCategory = 'salary-components';
      if (isDed) {
        payload.deductionType = payload.deductionType || payload.componentType || 'Fixed';
        payload.componentType = payload.deductionType;
      } else {
        payload.componentType = payload.componentType || 'Fixed Salary';
      }
    }
    try {
      setInternalSubmitting(true);
      await onSubmit(payload);
    } catch (err) {
      console.error('Submit error:', err);
    } finally {
      setInternalSubmitting(false);
    }
  };

  const getTitle = () => {
    const action = isEdit ? 'Edit' : 'Add';
    switch (activeTab) {
      case 'banks': return `${action} Bank`;
      case 'client-services':
      case 'clients': return isEdit ? 'Edit Service' : 'Add Services';
      case 'departments': return `${action} Department`;
      case 'designations': return `${action} Designation`;
      case 'employee-types': return `${action} Employee Type`;
      case 'sites': return `${action} Site`;
      case 'posts': return `${action} Post`;
      case 'shifts': return `${action} Shift`;
      case 'leave-types': return `${action} Leave Type`;
      case 'holidays': return `${action} Holiday`;
      case 'salary-components': {
        const isDed = isEdit ? (editingItem?.type === 'deduction' || formData.type === 'deduction') : componentCategory === 'deduction';
        return `${action} ${isDed ? 'Deduction' : 'Component'}`;
      }
      case 'document-types': return `${action} Document Type`;
      default: return `${action} Record`;
    }
  };

  const handleServiceToggle = (service) => {
    const current = formData.servicesRequired || [];
    if (current.includes(service)) {
      setFormData({
        ...formData,
        servicesRequired: current.filter((s) => s !== service)
      });
    } else {
      setFormData({
        ...formData,
        servicesRequired: [...current, service]
      });
    }
  };

  const handleAddBranch = () => {
    if (!branchInput.trim()) return;
    const currentList = Array.isArray(formData.branchList) ? formData.branchList : [];
    if (!currentList.includes(branchInput.trim())) {
      const nextList = [...currentList, branchInput.trim()];
      setFormData({
        ...formData,
        branchList: nextList,
        branches: nextList.length
      });
    }
    setBranchInput('');
  };

  const handleRemoveBranch = (indexToRemove) => {
    const currentList = Array.isArray(formData.branchList) ? formData.branchList : [];
    const nextList = currentList.filter((_, idx) => idx !== indexToRemove);
    setFormData({
      ...formData,
      branchList: nextList,
      branches: nextList.length
    });
  };

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-labelledby="master-form-title">
      <div
        ref={modalRef}
        tabIndex="-1"
        className={styles.modal}
        onClick={(e) => e.stopPropagation()}
      >
        <header className={styles.header}>
          <h2 id="master-form-title" className={styles.title}>{getTitle()}</h2>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close modal" disabled={submitting}>
            <X size={16} />
          </button>
        </header>

        <form onSubmit={handleSubmit} className={styles.form}>
          {/* 1. BANKS */}
          {activeTab === 'banks' && (
            <>
              <div className={styles.field}>
                <label className={styles.label}>Bank Name <span className={styles.required}>*</span></label>
                <input
                  type="text"
                  className={`${styles.input} ${errors.name ? styles.inputError : ''}`}
                  placeholder="e.g. State Bank of India"
                  value={formData.name || ''}
                  onChange={(e) => {
                    setFormData({ ...formData, name: e.target.value });
                    if (errors.name) setErrors({ ...errors, name: null });
                  }}
                />
                {errors.name && <span className={styles.errorText}>{errors.name}</span>}
              </div>

              <div className={styles.row}>
                <div className={styles.field}>
                  <label className={styles.label}>Short Code <span className={styles.required}>*</span></label>
                  <input
                    type="text"
                    className={`${styles.input} ${errors.code ? styles.inputError : ''}`}
                    placeholder="e.g. SBI, HDFC"
                    value={formData.code || ''}
                    onChange={(e) => {
                      setFormData({ ...formData, code: e.target.value.toUpperCase() });
                      if (errors.code) setErrors({ ...errors, code: null });
                    }}
                  />
                  {errors.code && <span className={styles.errorText}>{errors.code}</span>}
                </div>

                <div className={styles.field}>
                  <label className={styles.label}>Total Branches Count</label>
                  <input
                    type="number"
                    className={styles.input}
                    readOnly
                    tabIndex={-1}
                    style={{
                      background: 'var(--surface, #f8fafc)',
                      color: 'var(--text-secondary, #64748b)',
                      cursor: 'not-allowed',
                      fontWeight: 600
                    }}
                    value={Array.isArray(formData.branchList) ? formData.branchList.length : (formData.branches || 0)}
                  />
                </div>
              </div>

              {/* Multiple Branches Field */}
              <div className={styles.field}>
                <label className={styles.label}>
                  Branch Names (Add multiple branches)
                </label>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                  <input
                    type="text"
                    className={styles.input}
                    placeholder="e.g. Connaught Place, Cyber City, MG Road"
                    value={branchInput}
                    onChange={(e) => setBranchInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddBranch();
                      }
                    }}
                  />
                  <button
                    type="button"
                    className={styles.addMemberBtn || styles.cancelBtn}
                    style={{
                      whiteSpace: 'nowrap',
                      padding: '0 16px',
                      height: '42px',
                      background: 'var(--primary, #2563eb)',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '6px',
                      fontWeight: 500,
                      cursor: 'pointer'
                    }}
                    onClick={handleAddBranch}
                  >
                    + Add Branch
                  </button>
                </div>

                {/* Branches Chips */}
                {Array.isArray(formData.branchList) && formData.branchList.length > 0 ? (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
                    {formData.branchList.map((branch, idx) => (
                      <span
                        key={idx}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '4px 10px',
                          background: 'rgba(59, 130, 246, 0.1)',
                          color: '#2563eb',
                          borderRadius: '16px',
                          fontSize: '12.5px',
                          fontWeight: 500,
                          border: '1px solid rgba(59, 130, 246, 0.25)'
                        }}
                      >
                        {branch}
                        <button
                          type="button"
                          onClick={() => handleRemoveBranch(idx)}
                          style={{
                            border: 'none',
                            background: 'transparent',
                            color: '#ef4444',
                            cursor: 'pointer',
                            padding: 0,
                            display: 'flex',
                            alignItems: 'center'
                          }}
                          title="Remove branch"
                        >
                          <X size={13} />
                        </button>
                      </span>
                    ))}
                  </div>
                ) : (
                  <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                    No branch names added yet. Type a branch name and click "+ Add Branch" or press Enter.
                  </span>
                )}
              </div>
            </>
          )}

          {/* 2. CLIENT SERVICES */}
          {(activeTab === 'client-services' || activeTab === 'clients') && (
            <>
              <div className={styles.field}>
                <label className={styles.label}>
                  Service Name <span className={styles.required}>*</span>
                </label>
                <input
                  type="text"
                  className={`${styles.input} ${errors.name ? styles.inputError : ''}`}
                  placeholder="e.g. Security Guard, Housekeeping, Facility Management"
                  value={formData.name || ''}
                  onChange={(e) => {
                    setFormData({ ...formData, name: e.target.value });
                    if (errors.name) setErrors({ ...errors, name: null });
                  }}
                />
                {errors.name && <span className={styles.errorText}>{errors.name}</span>}
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Description</label>
                <textarea
                  className={styles.textarea || styles.input}
                  rows={3}
                  placeholder="Enter details about this service category..."
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
            </>
          )}

          {/* 3. DEPARTMENTS */}
          {activeTab === 'departments' && (
            <>
              <div className={styles.row}>
                <div className={styles.field}>
                  <label className={styles.label}>Department Name <span className={styles.required}>*</span></label>
                  <input
                    type="text"
                    className={`${styles.input} ${errors.name ? styles.inputError : ''}`}
                    placeholder="e.g. Security, Operations"
                    value={formData.name || ''}
                    onChange={(e) => {
                      setFormData({ ...formData, name: e.target.value });
                      if (errors.name) setErrors({ ...errors, name: null });
                    }}
                  />
                  {errors.name && <span className={styles.errorText}>{errors.name}</span>}
                </div>

                <div className={styles.field}>
                  <label className={styles.label}>Department Code</label>
                  <input
                    type="text"
                    className={styles.input}
                    placeholder="e.g. SEC, OPS"
                    value={formData.code || ''}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  />
                </div>
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Description</label>
                <textarea
                  className={styles.textarea}
                  rows="3"
                  placeholder="Department scope and operational responsibilities..."
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
            </>
          )}

          {/* 4. DESIGNATIONS */}
          {activeTab === 'designations' && (
            <>
              <div className={styles.row}>
                <div className={styles.field}>
                  <label className={styles.label}>Designation Name <span className={styles.required}>*</span></label>
                  <input
                    type="text"
                    className={`${styles.input} ${errors.name ? styles.inputError : ''}`}
                    placeholder="e.g. Security Guard"
                    value={formData.name || ''}
                    onChange={(e) => {
                      setFormData({ ...formData, name: e.target.value });
                      if (errors.name) setErrors({ ...errors, name: null });
                    }}
                  />
                  {errors.name && <span className={styles.errorText}>{errors.name}</span>}
                </div>

                <div className={styles.field}>
                  <label className={styles.label}>Designation Code</label>
                  <input
                    type="text"
                    className={styles.input}
                    placeholder="e.g. SG, SUP"
                    value={formData.code || ''}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  />
                </div>
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Department <span className={styles.required}>*</span></label>
                <select
                  className={`${styles.select} ${errors.department ? styles.inputError : ''}`}
                  value={formData.department || ''}
                  onChange={(e) => {
                    setFormData({ ...formData, department: e.target.value });
                    if (errors.department) setErrors({ ...errors, department: null });
                  }}
                >
                  <option value="">Select Department</option>
                  {departments
                    .filter((dept) => !dept.status || dept.status === 'active' || dept.name === formData.department)
                    .map((dept) => (
                      <option key={dept.id || dept.name} value={dept.name}>{dept.name}</option>
                    ))}
                </select>
                {errors.department && <span className={styles.errorText}>{errors.department}</span>}
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Description</label>
                <textarea
                  className={styles.textarea}
                  rows="3"
                  placeholder="Designation job role details..."
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
            </>
          )}

          {/* 5. EMPLOYEE TYPES */}
          {activeTab === 'employee-types' && (
            <>
              <div className={styles.row}>
                <div className={styles.field}>
                  <label className={styles.label}>Employee Type Name <span className={styles.required}>*</span></label>
                  <input
                    type="text"
                    className={`${styles.input} ${errors.name ? styles.inputError : ''}`}
                    placeholder="e.g. Permanent, Contract, Probation"
                    value={formData.name || ''}
                    onChange={(e) => {
                      setFormData({ ...formData, name: e.target.value });
                      if (errors.name) setErrors({ ...errors, name: null });
                    }}
                  />
                  {errors.name && <span className={styles.errorText}>{errors.name}</span>}
                </div>

                <div className={styles.field}>
                  <label className={styles.label}>Type Code</label>
                  <input
                    type="text"
                    className={styles.input}
                    placeholder="e.g. PERM, CONT"
                    value={formData.code || ''}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  />
                </div>
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Description</label>
                <textarea
                  className={styles.textarea}
                  rows="3"
                  placeholder="Employment terms, benefit eligibility, or tenure rules..."
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
            </>
          )}

          {/* 6. SITES */}
          {activeTab === 'sites' && (
            <>
              <div className={styles.row}>
                <div className={styles.field}>
                  <label className={styles.label}>Site Name <span className={styles.required}>*</span></label>
                  <input
                    type="text"
                    className={`${styles.input} ${errors.name ? styles.inputError : ''}`}
                    placeholder="e.g. DLF Cyber City - Tower B"
                    value={formData.name || ''}
                    onChange={(e) => {
                      setFormData({ ...formData, name: e.target.value });
                      if (errors.name) setErrors({ ...errors, name: null });
                    }}
                  />
                  {errors.name && <span className={styles.errorText}>{errors.name}</span>}
                </div>

                <div className={styles.field}>
                  <label className={styles.label}>Site Code</label>
                  <input
                    type="text"
                    className={styles.input}
                    placeholder="e.g. SITE-DLF-01"
                    value={formData.code || ''}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  />
                </div>
              </div>

              <div className={styles.row}>
                <div className={styles.field}>
                  <label className={styles.label}>Client <span className={styles.required}>*</span></label>
                  <select
                    className={`${styles.select} ${errors.clientId ? styles.inputError : ''}`}
                    value={formData.clientId || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      const selected = clients.find(c => String(c.id || c._id || c.clientId) === String(val));
                      setFormData({
                        ...formData,
                        clientId: val,
                        clientName: selected ? (selected.name || selected.clientName || '') : ''
                      });
                      if (errors.clientId) setErrors({ ...errors, clientId: null });
                    }}
                  >
                    <option value="">Select Client</option>
                    {clients
                      .filter((c) => !c.status || c.status === 'active' || String(c.id || c._id || c.clientId) === String(formData.clientId))
                      .map((c) => {
                        const cId = String(c.id || c._id || c.clientId);
                        const cName = c.name || c.clientName || 'Unnamed Client';
                        return (
                          <option key={cId} value={cId}>{cName}</option>
                        );
                      })}
                  </select>
                  {errors.clientId && <span className={styles.errorText}>{errors.clientId}</span>}
                </div>

                <div className={styles.field}>
                  <label className={styles.label}>Work Location / Branch</label>
                  <select
                    className={styles.select}
                    value={formData.workLocationId || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      const selected = workLocations.find(l => String(l.id || l._id || l.locationId) === String(val));
                      setFormData({
                        ...formData,
                        workLocationId: val,
                        workLocationName: selected ? (selected.locationName || selected.name || '') : '',
                        ...(selected?.city ? { city: selected.city } : {}),
                        ...(selected?.state ? { state: selected.state } : {})
                      });
                    }}
                  >
                    <option value="">All Branches</option>
                    {workLocations
                      .filter((loc) => !loc.status || loc.status === 'active' || String(loc.id || loc._id || loc.locationId) === String(formData.workLocationId))
                      .map((loc) => {
                        const locId = String(loc.id || loc._id || loc.locationId);
                        const locName = loc.locationName || loc.name || 'Unnamed Location';
                        return (
                          <option key={locId} value={locId}>{locName}</option>
                        );
                      })}
                  </select>
                </div>
              </div>

              <div className={styles.row}>
                <div className={styles.field}>
                  <label className={styles.label}>Site Contact Person</label>
                  <input
                    type="text"
                    className={styles.input}
                    placeholder="e.g. Vikram Joshi (Chief Security)"
                    value={formData.contactPerson || ''}
                    onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                  />
                </div>

                <div className={styles.field}>
                  <label className={styles.label}>Contact Number</label>
                  <input
                    type="text"
                    className={styles.input}
                    placeholder="+91 98765 43210"
                    value={formData.contactNumber || ''}
                    onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                  />
                </div>
              </div>

              <div className={styles.rowThree}>
                <div className={styles.field}>
                  <label className={styles.label}>City</label>
                  <input
                    type="text"
                    className={styles.input}
                    placeholder="City"
                    value={formData.city || ''}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  />
                </div>

                <div className={styles.field}>
                  <label className={styles.label}>State</label>
                  <input
                    type="text"
                    className={styles.input}
                    placeholder="State"
                    value={formData.state || ''}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  />
                </div>

                <div className={styles.field}>
                  <label className={styles.label}>PIN Code</label>
                  <input
                    type="text"
                    maxLength="6"
                    className={`${styles.input} ${errors.pinCode ? styles.inputError : ''}`}
                    placeholder="6-digit PIN"
                    value={formData.pinCode || ''}
                    onChange={(e) => {
                      setFormData({ ...formData, pinCode: e.target.value.replace(/\D/g, '') });
                      if (errors.pinCode) setErrors({ ...errors, pinCode: null });
                    }}
                  />
                  {errors.pinCode && <span className={styles.errorText}>{errors.pinCode}</span>}
                </div>
              </div>

              <div className={styles.row}>
                <div className={styles.field}>
                  <label className={styles.label}>Site Address</label>
                  <input
                    type="text"
                    className={styles.input}
                    placeholder="Complete site physical address"
                    value={formData.address || ''}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>

                <div className={styles.field}>
                  <label className={styles.label}>Min Manpower Requirement</label>
                  <input
                    type="number"
                    min="1"
                    className={styles.input}
                    placeholder="e.g. 24"
                    value={formData.minimumManpower || 12}
                    onChange={(e) => setFormData({ ...formData, minimumManpower: parseInt(e.target.value, 10) || 0 })}
                  />
                </div>
              </div>
            </>
          )}

          {/* 7. POSTS */}
          {activeTab === 'posts' && (
            <>
              <div className={styles.row}>
                <div className={styles.field}>
                  <label className={styles.label}>Post Name <span className={styles.required}>*</span></label>
                  <input
                    type="text"
                    className={`${styles.input} ${errors.name ? styles.inputError : ''}`}
                    placeholder="e.g. Security Guard, Gate Guard, CCTV Operator"
                    value={formData.name || ''}
                    onChange={(e) => {
                      setFormData({ ...formData, name: e.target.value });
                      if (errors.name) setErrors({ ...errors, name: null });
                    }}
                  />
                  {errors.name && <span className={styles.errorText}>{errors.name}</span>}
                </div>

                <div className={styles.field}>
                  <label className={styles.label}>Post Code</label>
                  <input
                    type="text"
                    className={styles.input}
                    placeholder="e.g. POST-SG"
                    value={formData.code || ''}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  />
                </div>
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Description</label>
                <textarea
                  className={styles.textarea}
                  rows="3"
                  placeholder="Post operational scope and duties..."
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
            </>
          )}

          {/* 8. SHIFTS */}
          {activeTab === 'shifts' && (
            <>
              <div className={styles.rowThree}>
                <div className={styles.field}>
                  <label className={styles.label}>Shift Name <span className={styles.required}>*</span></label>
                  <input
                    type="text"
                    className={`${styles.input} ${errors.name ? styles.inputError : ''}`}
                    placeholder="e.g. Morning Shift"
                    value={formData.name || ''}
                    onChange={(e) => {
                      setFormData({ ...formData, name: e.target.value });
                      if (errors.name) setErrors({ ...errors, name: null });
                    }}
                  />
                  {errors.name && <span className={styles.errorText}>{errors.name}</span>}
                </div>

                <div className={styles.field}>
                  <label className={styles.label}>Shift Code</label>
                  <input
                    type="text"
                    className={styles.input}
                    placeholder="e.g. MORN"
                    value={formData.code || ''}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  />
                </div>

                <div className={styles.field}>
                  <label className={styles.label}>Shift Type <span className={styles.required}>*</span></label>
                  <select
                    className={styles.select}
                    value={formData.shiftType || formData.type || 'day'}
                    onChange={(e) => setFormData({ ...formData, shiftType: e.target.value, type: e.target.value })}
                  >
                    <option value="day">Day Shift</option>
                    <option value="night">Night Shift</option>
                    <option value="rotational">Rotational Shift</option>
                  </select>
                </div>
              </div>

              <div className={styles.row}>
                <div className={styles.field}>
                  <label className={styles.label}>Start Time <span className={styles.required}>*</span></label>
                  <input
                    type="time"
                    className={`${styles.input} ${errors.startTime ? styles.inputError : ''}`}
                    value={formData.startTime || '06:00'}
                    onChange={(e) => {
                      setFormData({ ...formData, startTime: e.target.value });
                      if (errors.startTime) setErrors({ ...errors, startTime: null });
                    }}
                  />
                  {errors.startTime && <span className={styles.errorText}>{errors.startTime}</span>}
                </div>

                <div className={styles.field}>
                  <label className={styles.label}>End Time <span className={styles.required}>*</span></label>
                  <input
                    type="time"
                    className={`${styles.input} ${errors.endTime ? styles.inputError : ''}`}
                    value={formData.endTime || '14:00'}
                    onChange={(e) => {
                      setFormData({ ...formData, endTime: e.target.value });
                      if (errors.endTime) setErrors({ ...errors, endTime: null });
                    }}
                  />
                  {errors.endTime && <span className={styles.errorText}>{errors.endTime}</span>}
                </div>

                <div className={styles.field}>
                  <label className={styles.label}>Break (Mins)</label>
                  <input
                    type="number"
                    className={styles.input}
                    min="0"
                    step="5"
                    value={formData.breakDuration ?? 30}
                    onChange={(e) => setFormData({ ...formData, breakDuration: parseInt(e.target.value, 10) || 0 })}
                  />
                </div>

                <div className={styles.field}>
                  <label className={styles.label}>Grace Period (Mins)</label>
                  <input
                    type="number"
                    className={styles.input}
                    min="0"
                    step="5"
                    value={formData.gracePeriod ?? 15}
                    onChange={(e) => setFormData({ ...formData, gracePeriod: parseInt(e.target.value, 10) || 0 })}
                  />
                </div>
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Description</label>
                <textarea
                  className={styles.textarea}
                  rows="3"
                  placeholder="Shift operational details..."
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
            </>
          )}

          {/* 9. LEAVE TYPES */}
          {activeTab === 'leave-types' && (
            <>
              <div className={styles.row}>
                <div className={styles.field}>
                  <label className={styles.label}>Leave Type Name <span className={styles.required}>*</span></label>
                  <input
                    type="text"
                    className={`${styles.input} ${errors.name ? styles.inputError : ''}`}
                    placeholder="e.g. Casual Leave, Sick Leave"
                    value={formData.name || ''}
                    onChange={(e) => {
                      setFormData({ ...formData, name: e.target.value });
                      if (errors.name) setErrors({ ...errors, name: null });
                    }}
                  />
                  {errors.name && <span className={styles.errorText}>{errors.name}</span>}
                </div>

                <div className={styles.field}>
                  <label className={styles.label}>Leave Code <span className={styles.required}>*</span></label>
                  <input
                    type="text"
                    className={`${styles.input} ${errors.code ? styles.inputError : ''}`}
                    placeholder="e.g. CL, SL, EL"
                    value={formData.code || ''}
                    onChange={(e) => {
                      setFormData({ ...formData, code: e.target.value.toUpperCase() });
                      if (errors.code) setErrors({ ...errors, code: null });
                    }}
                  />
                  {errors.code && <span className={styles.errorText}>{errors.code}</span>}
                </div>
              </div>

              <div className={styles.rowThree}>
                <div className={styles.field}>
                  <label className={styles.label}>Paid / Unpaid <span className={styles.required}>*</span></label>
                  <select
                    className={styles.select}
                    value={formData.paidType || 'paid'}
                    onChange={(e) => setFormData({ ...formData, paidType: e.target.value })}
                  >
                    <option value="paid">Paid Leave</option>
                    <option value="unpaid">Unpaid (LWP)</option>
                  </select>
                </div>

                <div className={styles.field}>
                  <label className={styles.label}>Annual Quota (Days)</label>
                  <input
                    type="number"
                    min="0"
                    className={styles.input}
                    value={formData.annualQuota ?? 12}
                    onChange={(e) => setFormData({ ...formData, annualQuota: parseInt(e.target.value, 10) || 0 })}
                  />
                </div>

                <div className={styles.field}>
                  <label className={styles.label}>Max Accumulation</label>
                  <input
                    type="number"
                    min="0"
                    className={styles.input}
                    value={formData.maxAccumulation ?? 12}
                    onChange={(e) => setFormData({ ...formData, maxAccumulation: parseInt(e.target.value, 10) || 0 })}
                  />
                </div>
              </div>

              <div className={styles.row}>
                <div className={styles.field}>
                  <label className={styles.label}>Carry Forward to Next Year</label>
                  <select
                    className={styles.select}
                    value={formData.carryForward ? 'true' : 'false'}
                    onChange={(e) => setFormData({ ...formData, carryForward: e.target.value === 'true' })}
                  >
                    <option value="false">No (Lapses at year-end)</option>
                    <option value="true">Yes (Carry forward)</option>
                  </select>
                </div>

                <div className={styles.field}>
                  <label className={styles.label}>Encashment Allowed</label>
                  <select
                    className={styles.select}
                    value={formData.encashment ? 'true' : 'false'}
                    onChange={(e) => setFormData({ ...formData, encashment: e.target.value === 'true' })}
                  >
                    <option value="false">No Encashment</option>
                    <option value="true">Yes Encashable</option>
                  </select>
                </div>
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Description</label>
                <textarea
                  className={styles.textarea}
                  rows="3"
                  placeholder="Leave policy notes and application conditions..."
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
            </>
          )}

          {/* 10. HOLIDAYS */}
          {activeTab === 'holidays' && (
            <>
              <div className={styles.row}>
                <div className={styles.field}>
                  <label className={styles.label}>Holiday Name <span className={styles.required}>*</span></label>
                  <input
                    type="text"
                    className={`${styles.input} ${errors.name ? styles.inputError : ''}`}
                    placeholder="e.g. Republic Day, Diwali"
                    value={formData.name || ''}
                    onChange={(e) => {
                      setFormData({ ...formData, name: e.target.value });
                      if (errors.name) setErrors({ ...errors, name: null });
                    }}
                  />
                  {errors.name && <span className={styles.errorText}>{errors.name}</span>}
                </div>

                <div className={styles.field}>
                  <label className={styles.label}>Holiday Date <span className={styles.required}>*</span></label>
                  <input
                    type="date"
                    className={`${styles.input} ${errors.date ? styles.inputError : ''}`}
                    value={formData.date || ''}
                    onChange={(e) => {
                      setFormData({ ...formData, date: e.target.value });
                      if (errors.date) setErrors({ ...errors, date: null });
                    }}
                  />
                  {errors.date && <span className={styles.errorText}>{errors.date}</span>}
                </div>
              </div>

              <div className={styles.row}>
                <div className={styles.field}>
                  <label className={styles.label}>Holiday Type</label>
                  <select
                    className={styles.select}
                    value={formData.holidayType || 'national'}
                    onChange={(e) => setFormData({ ...formData, holidayType: e.target.value })}
                  >
                    <option value="national">National Holiday</option>
                    <option value="festival">Festival Holiday</option>
                    <option value="company">Company Holiday</option>
                    <option value="optional">Optional Holiday</option>
                  </select>
                </div>

                <div className={styles.field}>
                  <label className={styles.label}>Applicable Location / Branch</label>
                  <select
                    className={styles.select}
                    value={formData.applicableLocation || 'All Locations'}
                    onChange={(e) => setFormData({ ...formData, applicableLocation: e.target.value })}
                  >
                    <option value="All Locations">All Locations / All Branches</option>
                    {workLocations.map((loc) => (
                      <option key={loc.id} value={loc.locationName}>{loc.locationName}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Description</label>
                <textarea
                  className={styles.textarea}
                  rows="3"
                  placeholder="Holiday celebration notes..."
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
            </>
          )}

          {/* 11. SALARY COMPONENTS & DEDUCTIONS */}
          {activeTab === 'salary-components' && (() => {
            const isDed = isEdit ? (editingItem?.type === 'deduction' || formData.type === 'deduction') : componentCategory === 'deduction';
            return (
              <>
                <div className={styles.salaryFormRow}>
                  <label className={styles.salaryFormLabel}>
                    Name <span className={styles.requiredStar}>*</span>
                  </label>
                  <div className={styles.salaryFormInputWrapper}>
                    <input
                      type="text"
                      className={`${styles.salaryFormInput} ${errors.name ? styles.inputError : ''}`}
                      placeholder=""
                      value={formData.name || ''}
                      onChange={(e) => {
                        setFormData({ ...formData, name: e.target.value });
                        if (errors.name) setErrors({ ...errors, name: null });
                      }}
                    />
                    {errors.name && <span className={styles.errorText}>{errors.name}</span>}
                  </div>
                </div>

                <div className={styles.salaryFormRow}>
                  <label className={styles.salaryFormLabel}>
                    Short Name (Alias) <span className={styles.requiredStar}>*</span>
                  </label>
                  <div className={styles.salaryFormInputWrapper}>
                    <input
                      type="text"
                      className={`${styles.salaryFormInputShort} ${errors.shortName ? styles.inputError : ''}`}
                      placeholder=""
                      value={formData.shortName || formData.code || ''}
                      onChange={(e) => {
                        setFormData({ ...formData, shortName: e.target.value, code: e.target.value });
                        if (errors.shortName) setErrors({ ...errors, shortName: null });
                      }}
                    />
                    {errors.shortName && <span className={styles.errorText}>{errors.shortName}</span>}
                  </div>
                </div>

                {isDed ? (
                  <>
                    <div className={styles.salaryFormRow}>
                      <label className={styles.salaryFormLabel}>
                        Deduction Type <span className={styles.requiredStar}>*</span>
                      </label>
                      <div className={styles.salaryFormInputWrapper}>
                        <select
                          className={`${styles.salaryFormSelect} ${errors.deductionType ? styles.inputError : ''}`}
                          value={formData.deductionType || formData.componentType || ''}
                          onChange={(e) => {
                            setFormData({ ...formData, deductionType: e.target.value, componentType: e.target.value });
                            if (errors.deductionType) setErrors({ ...errors, deductionType: null });
                          }}
                        >
                          <option value="">- Select -</option>
                          <option value="Fixed">Fixed</option>
                          <option value="Variable">Variable</option>
                          <option value="Percent Based">Percent Based</option>
                          <option value="Strike Based">Strike Based</option>
                          <option value="Attendance Based">Attendance Based</option>
                          <option value="Time Based">Time Based</option>
                        </select>
                        {errors.deductionType && <span className={styles.errorText}>{errors.deductionType}</span>}
                      </div>
                    </div>

                    <div className={styles.salaryTogglesList}>
                      <label className={styles.salaryToggleItem}>
                        <div className={styles.salarySwitch}>
                          <input
                            type="checkbox"
                            checked={formData.status === 'active'}
                            onChange={(e) => setFormData({ ...formData, status: e.target.checked ? 'active' : 'inactive' })}
                          />
                          <span className={styles.salarySlider}></span>
                        </div>
                        <span className={styles.salaryToggleLabel}>
                          Active
                        </span>
                      </label>

                      <label className={styles.salaryToggleItem}>
                        <div className={styles.salarySwitch}>
                          <input
                            type="checkbox"
                            checked={Boolean(formData.excludeFromCtc)}
                            onChange={(e) => setFormData({ ...formData, excludeFromCtc: e.target.checked })}
                          />
                          <span className={styles.salarySlider}></span>
                        </div>
                        <span className={styles.salaryToggleLabel}>
                          Exclude from CTC
                          <span
                            className={styles.infoBadge}
                            title="Exclude this deduction from CTC computation."
                          >
                            i
                          </span>
                        </span>
                      </label>

                      <label className={styles.salaryToggleItem}>
                        <div className={styles.salarySwitch}>
                          <input
                            type="checkbox"
                            checked={Boolean(formData.paybackOnExit)}
                            onChange={(e) => setFormData({ ...formData, paybackOnExit: e.target.checked })}
                          />
                          <span className={styles.salarySlider}></span>
                        </div>
                        <span className={styles.salaryToggleLabel}>
                          Payback on Exit
                          <span
                            className={styles.infoBadge}
                            title="Reimburse or settle accumulated deductions upon employee separation."
                          >
                            i
                          </span>
                        </span>
                      </label>
                    </div>
                  </>
                ) : (
                  <>
                    <div className={styles.salaryFormRow}>
                      <label className={styles.salaryFormLabel}>
                        Component Type <span className={styles.requiredStar}>*</span>
                      </label>
                      <div className={styles.salaryFormInputWrapper}>
                        <select
                          className={`${styles.salaryFormSelect} ${errors.componentType ? styles.inputError : ''}`}
                          value={formData.componentType || ''}
                          onChange={(e) => {
                            setFormData({ ...formData, componentType: e.target.value });
                            if (errors.componentType) setErrors({ ...errors, componentType: null });
                          }}
                        >
                          <option value="">- Select -</option>
                          <option value="Paid Days">Paid Days</option>
                          <option value="Paid Hours">Paid Hours</option>
                          <option value="Fixed Salary">Fixed Salary</option>
                          <option value="Daily Salary">Daily Salary</option>
                          <option value="Rate Based">Rate Based</option>
                          <option value="Variable">Variable</option>
                        </select>
                        {errors.componentType && <span className={styles.errorText}>{errors.componentType}</span>}

                        {['Paid Days', 'Paid Hours', 'Daily Salary'].includes(formData.componentType) && (
                          <div className={styles.salarySubTogglesRow}>
                            <label className={styles.salaryToggleInline}>
                              <div className={styles.salarySwitch}>
                                <input
                                  type="checkbox"
                                  checked={Boolean(formData.excludeHolidays)}
                                  onChange={(e) => setFormData({ ...formData, excludeHolidays: e.target.checked })}
                                />
                                <span className={styles.salarySlider}></span>
                              </div>
                              <span className={styles.salaryToggleLabelText}>Exclude Holidays</span>
                            </label>

                            <label className={styles.salaryToggleInline}>
                              <div className={styles.salarySwitch}>
                                <input
                                  type="checkbox"
                                  checked={Boolean(formData.excludeWeekoffs)}
                                  onChange={(e) => setFormData({ ...formData, excludeWeekoffs: e.target.checked })}
                                />
                                <span className={styles.salarySlider}></span>
                              </div>
                              <span className={styles.salaryToggleLabelText}>Exclude Weekoffs</span>
                            </label>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className={styles.salaryTogglesList}>
                      <label className={styles.salaryToggleItem}>
                        <div className={styles.salarySwitch}>
                          <input
                            type="checkbox"
                            checked={formData.status === 'active'}
                            onChange={(e) => setFormData({ ...formData, status: e.target.checked ? 'active' : 'inactive' })}
                          />
                          <span className={styles.salarySlider}></span>
                        </div>
                        <span className={styles.salaryToggleLabel}>
                          Active
                          <span
                            className={styles.infoBadge}
                            title="Active components are available in pay groups and payroll calculations."
                          >
                            i
                          </span>
                        </span>
                      </label>

                      <label className={styles.salaryToggleItem}>
                        <div className={styles.salarySwitch}>
                          <input
                            type="checkbox"
                            checked={Boolean(formData.excludeFromGrossSalary)}
                            onChange={(e) => setFormData({ ...formData, excludeFromGrossSalary: e.target.checked })}
                          />
                          <span className={styles.salarySlider}></span>
                        </div>
                        <span className={styles.salaryToggleLabel}>
                          Exclude from Gross Salary
                          <span
                            className={styles.infoBadge}
                            title="Exclude this component when calculating the total gross salary."
                          >
                            i
                          </span>
                        </span>
                      </label>

                      <label className={styles.salaryToggleItem}>
                        <div className={styles.salarySwitch}>
                          <input
                            type="checkbox"
                            checked={Boolean(formData.hideInCtcReports)}
                            onChange={(e) => setFormData({ ...formData, hideInCtcReports: e.target.checked })}
                          />
                          <span className={styles.salarySlider}></span>
                        </div>
                        <span className={styles.salaryToggleLabel}>
                          Hide in CTC Reports
                          <span
                            className={styles.infoBadge}
                            title="Hide this salary component from employee CTC statements and reports."
                          >
                            i
                          </span>
                        </span>
                      </label>

                      <label className={styles.salaryToggleItem}>
                        <div className={styles.salarySwitch}>
                          <input
                            type="checkbox"
                            checked={Boolean(formData.notPayable)}
                            onChange={(e) => setFormData({ ...formData, notPayable: e.target.checked })}
                          />
                          <span className={styles.salarySlider}></span>
                        </div>
                        <span className={styles.salaryToggleLabel}>
                          Not Payable
                          <span
                            className={styles.infoBadge}
                            title="Component used for statutory or tracking calculation only and not disbursed to employee."
                          >
                            i
                          </span>
                        </span>
                      </label>
                    </div>
                  </>
                )}
              </>
            );
          })()}

          {/* 12. DOCUMENT TYPES */}
          {activeTab === 'document-types' && (
            <>
              <div className={styles.row}>
                <div className={styles.field}>
                  <label className={styles.label}>Document Type Name <span className={styles.required}>*</span></label>
                  <input
                    type="text"
                    className={`${styles.input} ${errors.name ? styles.inputError : ''}`}
                    placeholder="e.g. Aadhaar Card, Police Verification"
                    value={formData.name || ''}
                    onChange={(e) => {
                      setFormData({ ...formData, name: e.target.value });
                      if (errors.name) setErrors({ ...errors, name: null });
                    }}
                  />
                  {errors.name && <span className={styles.errorText}>{errors.name}</span>}
                </div>

                <div className={styles.field}>
                  <label className={styles.label}>Document Code</label>
                  <input
                    type="text"
                    className={styles.input}
                    placeholder="e.g. DOC-AADHAAR"
                    value={formData.code || ''}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  />
                </div>
              </div>

              <div className={styles.rowThree}>
                <div className={styles.field}>
                  <label className={styles.label}>Mandatory / Optional</label>
                  <select
                    className={styles.select}
                    value={formData.requiredType || 'required'}
                    onChange={(e) => setFormData({ ...formData, requiredType: e.target.value })}
                  >
                    <option value="required">Mandatory Document</option>
                    <option value="optional">Optional Document</option>
                  </select>
                </div>

                <div className={styles.field}>
                  <label className={styles.label}>Expiry Tracking</label>
                  <select
                    className={styles.select}
                    value={formData.expiryRequired ? 'true' : 'false'}
                    onChange={(e) => setFormData({ ...formData, expiryRequired: e.target.value === 'true' })}
                  >
                    <option value="false">No Expiry</option>
                    <option value="true">Track Expiry Date</option>
                  </select>
                </div>

                <div className={styles.field}>
                  <label className={styles.label}>Verification Required</label>
                  <select
                    className={styles.select}
                    value={formData.verificationRequired ? 'true' : 'false'}
                    onChange={(e) => setFormData({ ...formData, verificationRequired: e.target.value === 'true' })}
                  >
                    <option value="true">Yes Verification Required</option>
                    <option value="false">No Verification</option>
                  </select>
                </div>
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Description</label>
                <textarea
                  className={styles.textarea}
                  rows="3"
                  placeholder="Verification criteria and acceptable formats..."
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
            </>
          )}

          {/* COMMON STATUS FIELD */}
          {activeTab !== 'salary-components' && (
            <div className={styles.field}>
              <label className={styles.label}>Status</label>
              <div className={styles.radioGroup}>
                <label className={styles.radioLabel}>
                  <input
                    type="radio"
                    name="status"
                    value="active"
                    checked={formData.status === 'active'}
                    onChange={() => setFormData({ ...formData, status: 'active' })}
                  />
                  <span>Active</span>
                </label>
                <label className={styles.radioLabel}>
                  <input
                    type="radio"
                    name="status"
                    value="inactive"
                    checked={formData.status === 'inactive'}
                    onChange={() => setFormData({ ...formData, status: 'inactive' })}
                  />
                  <span>Inactive</span>
                </label>
              </div>
            </div>
          )}

          <footer className={styles.footer}>
            {activeTab === 'salary-components' ? (
              <div className={styles.salaryFooterActions}>
                <button
                  type="button"
                  className={styles.salaryCloseBtnText}
                  onClick={onClose}
                  disabled={submitting}
                >
                  Close
                </button>
                <button
                  type="submit"
                  className={styles.salarySaveBtn}
                  disabled={submitting}
                >
                  {submitting ? <Loader2 size={16} className={styles.spinner} /> : <Save size={16} />}
                  <span>{submitting ? 'Saving...' : 'Save'}</span>
                </button>
              </div>
            ) : (
              <>
                <button
                  type="button"
                  className={styles.cancelBtn}
                  onClick={onClose}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={styles.submitBtn}
                  disabled={submitting}
                >
                  {submitting && <Loader2 size={16} className={styles.spinner} />}
                  <span>{submitting ? (isEdit ? 'Saving...' : 'Creating...') : (isEdit ? 'Save Changes' : 'Create Record')}</span>
                </button>
              </>
            )}
          </footer>
        </form>
      </div>
    </div>
  );
}

export default MasterFormModal;
