import React, { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
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
  workLocations = []
}) {
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});
  const modalRef = useRef(null);

  const isEdit = !!editingItem;

  useEffect(() => {
    if (isOpen) {
      setErrors({});
      if (editingItem) {
        setFormData({ ...editingItem });
      } else {
        // Defaults for Add per activeTab
        const defaultState = { status: 'active' };

        if (activeTab === 'banks') {
          defaultState.branches = 1;
        } else if (activeTab === 'clients') {
          defaultState.servicesRequired = ['Security Guard Services', 'Security Supervisor Services'];
          defaultState.state = 'Karnataka';
          defaultState.city = 'Bangalore';
        } else if (activeTab === 'designations') {
          defaultState.department = departments.length > 0 ? departments[0].name : '';
        } else if (activeTab === 'sites') {
          defaultState.clientId = clients.length > 0 ? String(clients[0].id) : '';
          defaultState.clientName = clients.length > 0 ? clients[0].name : '';
          defaultState.workLocationId = workLocations.length > 0 ? workLocations[0].id : '';
          defaultState.workLocationName = workLocations.length > 0 ? workLocations[0].locationName : '';
          defaultState.minimumManpower = 12;
          defaultState.state = 'Karnataka';
          defaultState.city = 'Bangalore';
        } else if (activeTab === 'shifts') {
          defaultState.startTime = '06:00';
          defaultState.endTime = '14:00';
          defaultState.breakDuration = 30;
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
          defaultState.type = 'earning';
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
  }, [isOpen, editingItem, activeTab, departments, clients, workLocations]);

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
    } else if (activeTab === 'clients') {
      if (!formData.contactPerson?.trim()) newErrors.contactPerson = 'Contact person is required.';
      if (formData.pinCode && !/^\d{6}$/.test(formData.pinCode.trim())) {
        newErrors.pinCode = 'Must be a 6-digit Indian PIN code.';
      }
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
      if (!formData.code?.trim()) newErrors.code = 'Component code is required.';
      if (!formData.type) newErrors.type = 'Component type is required.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    onSubmit(formData);
  };

  const getTitle = () => {
    const action = isEdit ? 'Edit' : 'Add';
    switch (activeTab) {
      case 'banks': return `${action} Bank`;
      case 'clients': return `${action} Client`;
      case 'departments': return `${action} Department`;
      case 'designations': return `${action} Designation`;
      case 'employee-types': return `${action} Employee Type`;
      case 'sites': return `${action} Site`;
      case 'posts': return `${action} Post`;
      case 'shifts': return `${action} Shift`;
      case 'leave-types': return `${action} Leave Type`;
      case 'holidays': return `${action} Holiday`;
      case 'salary-components': return `${action} Salary Component`;
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
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close modal">
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
                  <label className={styles.label}>Number of Branches</label>
                  <input
                    type="number"
                    className={styles.input}
                    min="1"
                    value={formData.branches || 1}
                    onChange={(e) => setFormData({ ...formData, branches: parseInt(e.target.value, 10) || 1 })}
                  />
                </div>
              </div>
            </>
          )}

          {/* 2. CLIENTS */}
          {activeTab === 'clients' && (
            <>
              <div className={styles.row}>
                <div className={styles.field}>
                  <label className={styles.label}>Client / Company Name <span className={styles.required}>*</span></label>
                  <input
                    type="text"
                    className={`${styles.input} ${errors.name ? styles.inputError : ''}`}
                    placeholder="e.g. Tech Mahindra Ltd"
                    value={formData.name || ''}
                    onChange={(e) => {
                      setFormData({ ...formData, name: e.target.value });
                      if (errors.name) setErrors({ ...errors, name: null });
                    }}
                  />
                  {errors.name && <span className={styles.errorText}>{errors.name}</span>}
                </div>

                <div className={styles.field}>
                  <label className={styles.label}>Client Code</label>
                  <input
                    type="text"
                    className={styles.input}
                    placeholder="e.g. CLI-001"
                    value={formData.code || ''}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  />
                </div>
              </div>

              <div className={styles.row}>
                <div className={styles.field}>
                  <label className={styles.label}>Contact Person <span className={styles.required}>*</span></label>
                  <input
                    type="text"
                    className={`${styles.input} ${errors.contactPerson ? styles.inputError : ''}`}
                    placeholder="e.g. Rahul Sharma"
                    value={formData.contactPerson || ''}
                    onChange={(e) => {
                      setFormData({ ...formData, contactPerson: e.target.value });
                      if (errors.contactPerson) setErrors({ ...errors, contactPerson: null });
                    }}
                  />
                  {errors.contactPerson && <span className={styles.errorText}>{errors.contactPerson}</span>}
                </div>

                <div className={styles.field}>
                  <label className={styles.label}>Phone Number</label>
                  <input
                    type="text"
                    className={styles.input}
                    placeholder="+91 98765 43210"
                    value={formData.contactNumber || ''}
                    onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                  />
                </div>
              </div>

              <div className={styles.row}>
                <div className={styles.field}>
                  <label className={styles.label}>Email Address</label>
                  <input
                    type="email"
                    className={styles.input}
                    placeholder="client@company.com"
                    value={formData.email || ''}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>

                <div className={styles.field}>
                  <label className={styles.label}>Contract Start Date</label>
                  <input
                    type="date"
                    className={styles.input}
                    value={formData.contractStartDate || ''}
                    onChange={(e) => setFormData({ ...formData, contractStartDate: e.target.value })}
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

              <div className={styles.field}>
                <label className={styles.label}>Address</label>
                <input
                  type="text"
                  className={styles.input}
                  placeholder="Registered office / site address"
                  value={formData.address || ''}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Services Required (Multi-Select)</label>
                <div className={styles.servicesGrid}>
                  {MANPOWER_SERVICE_OPTIONS.map((srv) => {
                    const isChecked = (formData.servicesRequired || []).includes(srv);
                    return (
                      <label key={srv} className={`${styles.serviceCheckbox} ${isChecked ? styles.serviceChecked : ''}`}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleServiceToggle(srv)}
                        />
                        <span>{srv}</span>
                      </label>
                    );
                  })}
                </div>
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
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.name}>{dept.name}</option>
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
                      const selected = clients.find(c => String(c.id) === e.target.value);
                      setFormData({
                        ...formData,
                        clientId: e.target.value,
                        clientName: selected ? selected.name : ''
                      });
                      if (errors.clientId) setErrors({ ...errors, clientId: null });
                    }}
                  >
                    <option value="">Select Client</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                  {errors.clientId && <span className={styles.errorText}>{errors.clientId}</span>}
                </div>

                <div className={styles.field}>
                  <label className={styles.label}>Work Location / Branch</label>
                  <select
                    className={styles.select}
                    value={formData.workLocationId || ''}
                    onChange={(e) => {
                      const selected = workLocations.find(l => l.id === e.target.value);
                      setFormData({
                        ...formData,
                        workLocationId: e.target.value,
                        workLocationName: selected ? selected.locationName : ''
                      });
                    }}
                  >
                    <option value="">All Branches</option>
                    {workLocations.map((loc) => (
                      <option key={loc.id} value={loc.id}>{loc.locationName}</option>
                    ))}
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
              <div className={styles.row}>
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
              </div>

              <div className={styles.rowThree}>
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
                    value={formData.breakDuration || 30}
                    onChange={(e) => setFormData({ ...formData, breakDuration: parseInt(e.target.value, 10) || 0 })}
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

          {/* 11. SALARY COMPONENTS */}
          {activeTab === 'salary-components' && (
            <>
              <div className={styles.row}>
                <div className={styles.field}>
                  <label className={styles.label}>Component Name <span className={styles.required}>*</span></label>
                  <input
                    type="text"
                    className={`${styles.input} ${errors.name ? styles.inputError : ''}`}
                    placeholder="e.g. Basic Salary, HRA, PF"
                    value={formData.name || ''}
                    onChange={(e) => {
                      setFormData({ ...formData, name: e.target.value });
                      if (errors.name) setErrors({ ...errors, name: null });
                    }}
                  />
                  {errors.name && <span className={styles.errorText}>{errors.name}</span>}
                </div>

                <div className={styles.field}>
                  <label className={styles.label}>Component Code <span className={styles.required}>*</span></label>
                  <input
                    type="text"
                    className={`${styles.input} ${errors.code ? styles.inputError : ''}`}
                    placeholder="e.g. BASIC, HRA, PF"
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
                  <label className={styles.label}>Component Type <span className={styles.required}>*</span></label>
                  <select
                    className={styles.select}
                    value={formData.type || 'earning'}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  >
                    <option value="earning">Earning (+)</option>
                    <option value="deduction">Deduction (-)</option>
                  </select>
                </div>

                <div className={styles.field}>
                  <label className={styles.label}>Calculation Type</label>
                  <select
                    className={styles.select}
                    value={formData.calculationType || 'fixed'}
                    onChange={(e) => setFormData({ ...formData, calculationType: e.target.value })}
                  >
                    <option value="fixed">Fixed Amount</option>
                    <option value="percentage_basic">% of Basic</option>
                    <option value="percentage_gross">% of Gross</option>
                    <option value="variable">Variable / Slab</option>
                  </select>
                </div>

                <div className={styles.field}>
                  <label className={styles.label}>Taxable Status</label>
                  <select
                    className={styles.select}
                    value={formData.taxable || 'taxable'}
                    onChange={(e) => setFormData({ ...formData, taxable: e.target.value })}
                  >
                    <option value="taxable">Taxable</option>
                    <option value="non-taxable">Non-Taxable / Exempt</option>
                  </select>
                </div>
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Default Value / Formula</label>
                <input
                  type="text"
                  className={styles.input}
                  placeholder="e.g. 50% of Basic, 12% of Basic, or Fixed Value"
                  value={formData.defaultValue || ''}
                  onChange={(e) => setFormData({ ...formData, defaultValue: e.target.value })}
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Description</label>
                <textarea
                  className={styles.textarea}
                  rows="2"
                  placeholder="Statutory compliance rules and calculation instructions..."
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
            </>
          )}

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

          <footer className={styles.footer}>
            <button type="button" className={styles.cancelBtn} onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className={styles.submitBtn}>
              {isEdit ? 'Save Changes' : 'Create Record'}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}

export default MasterFormModal;
