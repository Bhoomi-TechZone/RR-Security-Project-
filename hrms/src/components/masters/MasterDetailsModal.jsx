import React, { useEffect, useRef } from 'react';
import { 
  X, Landmark, Briefcase, Layers, Award, UserCheck, 
  MapPin, Shield, CalendarDays, CalendarOff, CalendarHeart, 
  DollarSign, FileCheck, FileText 
} from 'lucide-react';
import StatusBadge from '../common/StatusBadge';
import styles from './MasterDetailsModal.module.css';

/**
 * MasterDetailsModal Component
 * Displays a clean details modal for all 12 Master categories.
 */
function MasterDetailsModal({
  isOpen,
  onClose,
  activeTab,
  item = null
}) {
  const modalRef = useRef(null);

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

  if (!isOpen || !item) return null;

  const getHeaderIcon = () => {
    switch (activeTab) {
      case 'banks': return <Landmark size={20} />;
      case 'clients': return <Briefcase size={20} />;
      case 'departments': return <Layers size={20} />;
      case 'designations': return <Award size={20} />;
      case 'employee-types': return <UserCheck size={20} />;
      case 'sites': return <MapPin size={20} />;
      case 'posts': return <Shield size={20} />;
      case 'shifts': return <CalendarDays size={20} />;
      case 'leave-types': return <CalendarOff size={20} />;
      case 'holidays': return <CalendarHeart size={20} />;
      case 'salary-components': return <DollarSign size={20} />;
      case 'document-types': return <FileCheck size={20} />;
      default: return <FileText size={20} />;
    }
  };

  const getTitle = () => {
    switch (activeTab) {
      case 'banks': return 'Bank Details';
      case 'clients': return 'Client Details';
      case 'departments': return 'Department Details';
      case 'designations': return 'Designation Details';
      case 'employee-types': return 'Employee Type Details';
      case 'sites': return 'Site Details';
      case 'posts': return 'Post Details';
      case 'shifts': return 'Shift Details';
      case 'leave-types': return 'Leave Type Details';
      case 'holidays': return 'Holiday Details';
      case 'salary-components': return 'Salary Component Details';
      case 'document-types': return 'Document Type Details';
      default: return 'Record Details';
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    if (isNaN(date)) return dateStr;
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-labelledby="master-details-title">
      <div 
        ref={modalRef}
        tabIndex="-1"
        className={styles.modal} 
        onClick={(e) => e.stopPropagation()}
      >
        <header className={styles.header}>
          <div className={styles.titleRow}>
            <div className={styles.iconBox}>
              {getHeaderIcon()}
            </div>
            <h2 id="master-details-title" className={styles.title}>{getTitle()}</h2>
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close details">
            <X size={16} />
          </button>
        </header>

        <div className={styles.content}>
          {/* 1. BANKS */}
          {activeTab === 'banks' && (
            <div className={styles.detailsList}>
              <div className={styles.detailRow}>
                <span className={styles.label}>Bank Name</span>
                <span className={styles.value}>{item.name}</span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.label}>Short Code</span>
                <span className={styles.codeBadge}>{item.code}</span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.label}>Branches</span>
                <span className={styles.value}>{item.branches || 0}</span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.label}>Status</span>
                <StatusBadge status={item.status} />
              </div>
            </div>
          )}

          {/* 2. CLIENTS */}
          {activeTab === 'clients' && (
            <div className={styles.detailsList}>
              <div className={styles.detailRow}>
                <span className={styles.label}>Client Name</span>
                <span className={styles.value}>{item.name}</span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.label}>Client Code</span>
                <span className={styles.codeBadge}>{item.code || '—'}</span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.label}>Contact Person</span>
                <span className={styles.value}>{item.contactPerson || 'N/A'}</span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.label}>Phone Number</span>
                <span className={styles.value}>{item.contactNumber || 'N/A'}</span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.label}>Email Address</span>
                <span className={styles.value}>{item.email || 'N/A'}</span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.label}>Location</span>
                <span className={styles.value}>{item.city ? `${item.city}, ${item.state}` : item.address || 'N/A'}</span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.label}>Contract Start</span>
                <span className={styles.value}>{formatDate(item.contractStartDate)}</span>
              </div>
              {Array.isArray(item.servicesRequired) && (
                <div className={styles.detailRow}>
                  <span className={styles.label}>Services</span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {item.servicesRequired.map((s, i) => (
                      <span key={i} style={{ fontSize: '11px', background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              <div className={styles.detailRow}>
                <span className={styles.label}>Status</span>
                <StatusBadge status={item.status} />
              </div>
            </div>
          )}

          {/* 3. DEPARTMENTS */}
          {activeTab === 'departments' && (
            <div className={styles.detailsList}>
              <div className={styles.detailRow}>
                <span className={styles.label}>Department Name</span>
                <span className={styles.value}>{item.name}</span>
              </div>
              {item.code && (
                <div className={styles.detailRow}>
                  <span className={styles.label}>Code</span>
                  <span className={styles.codeBadge}>{item.code}</span>
                </div>
              )}
              <div className={styles.detailRow}>
                <span className={styles.label}>Employees</span>
                <span className={styles.value}>{item.employees || 0}</span>
              </div>
              {item.description && (
                <div className={styles.detailRow}>
                  <span className={styles.label}>Description</span>
                  <span className={styles.value}>{item.description}</span>
                </div>
              )}
              <div className={styles.detailRow}>
                <span className={styles.label}>Status</span>
                <StatusBadge status={item.status} />
              </div>
            </div>
          )}

          {/* 4. DESIGNATIONS */}
          {activeTab === 'designations' && (
            <div className={styles.detailsList}>
              <div className={styles.detailRow}>
                <span className={styles.label}>Designation Name</span>
                <span className={styles.value}>{item.name}</span>
              </div>
              {item.code && (
                <div className={styles.detailRow}>
                  <span className={styles.label}>Code</span>
                  <span className={styles.codeBadge}>{item.code}</span>
                </div>
              )}
              <div className={styles.detailRow}>
                <span className={styles.label}>Department</span>
                <span className={styles.deptBadge}>{item.department || 'General'}</span>
              </div>
              {item.description && (
                <div className={styles.detailRow}>
                  <span className={styles.label}>Description</span>
                  <span className={styles.value}>{item.description}</span>
                </div>
              )}
              <div className={styles.detailRow}>
                <span className={styles.label}>Status</span>
                <StatusBadge status={item.status} />
              </div>
            </div>
          )}

          {/* 5. EMPLOYEE TYPES */}
          {activeTab === 'employee-types' && (
            <div className={styles.detailsList}>
              <div className={styles.detailRow}>
                <span className={styles.label}>Employee Type</span>
                <span className={styles.value}>{item.name}</span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.label}>Code</span>
                <span className={styles.codeBadge}>{item.code}</span>
              </div>
              {item.description && (
                <div className={styles.detailRow}>
                  <span className={styles.label}>Description</span>
                  <span className={styles.value}>{item.description}</span>
                </div>
              )}
              <div className={styles.detailRow}>
                <span className={styles.label}>Status</span>
                <StatusBadge status={item.status} />
              </div>
            </div>
          )}

          {/* 6. SITES */}
          {activeTab === 'sites' && (
            <div className={styles.detailsList}>
              <div className={styles.detailRow}>
                <span className={styles.label}>Site Name</span>
                <span className={styles.value}>{item.name}</span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.label}>Site Code</span>
                <span className={styles.codeBadge}>{item.code}</span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.label}>Client Name</span>
                <span className={styles.value}>{item.clientName || 'N/A'}</span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.label}>Work Location / Branch</span>
                <span className={styles.value}>{item.workLocationName || 'All Branches'}</span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.label}>Location / Address</span>
                <span className={styles.value}>{item.address || 'N/A'}, {item.city} ({item.state}) - {item.pinCode}</span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.label}>Site Contact</span>
                <span className={styles.value}>{item.contactPerson || 'N/A'} ({item.contactNumber || 'N/A'})</span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.label}>Min Manpower</span>
                <span className={styles.value}>{item.minimumManpower || 0} Guards</span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.label}>Status</span>
                <StatusBadge status={item.status} />
              </div>
            </div>
          )}

          {/* 7. POSTS */}
          {activeTab === 'posts' && (
            <div className={styles.detailsList}>
              <div className={styles.detailRow}>
                <span className={styles.label}>Post Name</span>
                <span className={styles.value}>{item.name}</span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.label}>Post Code</span>
                <span className={styles.codeBadge}>{item.code}</span>
              </div>
              {item.description && (
                <div className={styles.detailRow}>
                  <span className={styles.label}>Description</span>
                  <span className={styles.value}>{item.description}</span>
                </div>
              )}
              <div className={styles.detailRow}>
                <span className={styles.label}>Status</span>
                <StatusBadge status={item.status} />
              </div>
            </div>
          )}

          {/* 8. SHIFTS */}
          {activeTab === 'shifts' && (
            <div className={styles.detailsList}>
              <div className={styles.detailRow}>
                <span className={styles.label}>Shift Name</span>
                <span className={styles.value}>{item.name}</span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.label}>Shift Code</span>
                <span className={styles.codeBadge}>{item.code}</span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.label}>Timings</span>
                <span className={styles.value}>{item.startTime} - {item.endTime}</span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.label}>Break Duration</span>
                <span className={styles.value}>{item.breakDuration || 0} mins</span>
              </div>
              {item.description && (
                <div className={styles.detailRow}>
                  <span className={styles.label}>Description</span>
                  <span className={styles.value}>{item.description}</span>
                </div>
              )}
              <div className={styles.detailRow}>
                <span className={styles.label}>Status</span>
                <StatusBadge status={item.status} />
              </div>
            </div>
          )}

          {/* 9. LEAVE TYPES */}
          {activeTab === 'leave-types' && (
            <div className={styles.detailsList}>
              <div className={styles.detailRow}>
                <span className={styles.label}>Leave Type</span>
                <span className={styles.value}>{item.name}</span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.label}>Code</span>
                <span className={styles.codeBadge}>{item.code}</span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.label}>Type</span>
                <span className={styles.value}>{item.paidType === 'paid' ? 'Paid Leave' : 'Unpaid (LWP)'}</span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.label}>Annual Quota</span>
                <span className={styles.value}>{item.annualQuota || 0} Days/year</span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.label}>Carry Forward</span>
                <span className={styles.value}>{item.carryForward ? 'Yes' : 'No'}</span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.label}>Max Accumulation</span>
                <span className={styles.value}>{item.maxAccumulation || 0} Days</span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.label}>Encashment Allowed</span>
                <span className={styles.value}>{item.encashment ? 'Yes' : 'No'}</span>
              </div>
              {item.description && (
                <div className={styles.detailRow}>
                  <span className={styles.label}>Description</span>
                  <span className={styles.value}>{item.description}</span>
                </div>
              )}
              <div className={styles.detailRow}>
                <span className={styles.label}>Status</span>
                <StatusBadge status={item.status} />
              </div>
            </div>
          )}

          {/* 10. HOLIDAYS */}
          {activeTab === 'holidays' && (
            <div className={styles.detailsList}>
              <div className={styles.detailRow}>
                <span className={styles.label}>Holiday Name</span>
                <span className={styles.value}>{item.name}</span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.label}>Holiday Date</span>
                <span className={styles.value}>{formatDate(item.date)}</span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.label}>Holiday Type</span>
                <span className={styles.value} style={{ textTransform: 'capitalize' }}>{item.holidayType} Holiday</span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.label}>Applicable Location</span>
                <span className={styles.value}>{item.applicableLocation || 'All Locations'}</span>
              </div>
              {item.description && (
                <div className={styles.detailRow}>
                  <span className={styles.label}>Description</span>
                  <span className={styles.value}>{item.description}</span>
                </div>
              )}
              <div className={styles.detailRow}>
                <span className={styles.label}>Status</span>
                <StatusBadge status={item.status} />
              </div>
            </div>
          )}

          {/* 11. SALARY COMPONENTS */}
          {activeTab === 'salary-components' && (
            <div className={styles.detailsList}>
              <div className={styles.detailRow}>
                <span className={styles.label}>Component Name</span>
                <span className={styles.value}>{item.name}</span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.label}>Code</span>
                <span className={styles.codeBadge}>{item.code}</span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.label}>Component Type</span>
                <span className={styles.value}>{item.type === 'earning' ? 'Earning (+)' : 'Deduction (-)'}</span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.label}>Calculation Type</span>
                <span className={styles.value}>{item.calculationType}</span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.label}>Default Value / Formula</span>
                <span className={styles.value}>{item.defaultValue || '—'}</span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.label}>Taxable</span>
                <span className={styles.value}>{item.taxable === 'taxable' ? 'Taxable' : 'Exempt'}</span>
              </div>
              {item.description && (
                <div className={styles.detailRow}>
                  <span className={styles.label}>Description</span>
                  <span className={styles.value}>{item.description}</span>
                </div>
              )}
              <div className={styles.detailRow}>
                <span className={styles.label}>Status</span>
                <StatusBadge status={item.status} />
              </div>
            </div>
          )}

          {/* 12. DOCUMENT TYPES */}
          {activeTab === 'document-types' && (
            <div className={styles.detailsList}>
              <div className={styles.detailRow}>
                <span className={styles.label}>Document Type</span>
                <span className={styles.value}>{item.name}</span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.label}>Document Code</span>
                <span className={styles.codeBadge}>{item.code}</span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.label}>Mandatory / Optional</span>
                <span className={styles.value}>{item.requiredType === 'required' ? 'Mandatory' : 'Optional'}</span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.label}>Expiry Tracking</span>
                <span className={styles.value}>{item.expiryRequired ? 'Yes' : 'No'}</span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.label}>Verification Required</span>
                <span className={styles.value}>{item.verificationRequired ? 'Yes' : 'No'}</span>
              </div>
              {item.description && (
                <div className={styles.detailRow}>
                  <span className={styles.label}>Description</span>
                  <span className={styles.value}>{item.description}</span>
                </div>
              )}
              <div className={styles.detailRow}>
                <span className={styles.label}>Status</span>
                <StatusBadge status={item.status} />
              </div>
            </div>
          )}
        </div>

        <footer className={styles.footer}>
          <button type="button" className={styles.closeActionBtn} onClick={onClose}>
            Close
          </button>
        </footer>
      </div>
    </div>
  );
}

export default MasterDetailsModal;
