import React from 'react';
import {
  X,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  RotateCcw,
  Building2,
  MapPin,
  FileText,
  CreditCard,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Briefcase
} from 'lucide-react';
import SiteManpowerImpactWidget from './SiteManpowerImpactWidget';
import StatusBadge from '../common/StatusBadge';
import { INITIAL_SITE_MANPOWER } from '../../data/leaveMasterData';
import styles from './LeaveApprovalDrawer.module.css';

export default function LeaveApprovalDrawer({
  selectedLeave,
  onClose,
  onSupervisorApprove,
  onHrApprove,
  onRejectClick,
  onSendBackClick
}) {
  if (!selectedLeave) return null;

  const siteInfo = selectedLeave.siteManpower || INITIAL_SITE_MANPOWER[selectedLeave.site] || {
    siteName: selectedLeave.site || 'Site Post A',
    clientName: selectedLeave.clientName,
    totalGuards: 25,
    onDuty: 20,
    onLeave: 3,
    absent: 2,
    relieverAvailable: 2,
    minimumRequired: 20
  };

  const isPendingSupervisor = selectedLeave.status === 'Pending Supervisor Approval';
  const isPendingHR = selectedLeave.status === 'Pending HR Approval';
  const isActionable = isPendingSupervisor || isPendingHR;

  return (
    <>
      <div className={styles.overlay} onClick={onClose} aria-hidden="true" />
      <aside className={styles.drawer} aria-label="Leave Request Details Drawer">
        {/* Header */}
        <div className={styles.header}>
          <div>
            <div className={styles.headerTop}>
              <span className={styles.leaveIdPill}>{selectedLeave.id}</span>
              <span className={styles.categoryPill}>{selectedLeave.category || 'Paid'} Leave</span>
            </div>
            <h3 className={styles.headerTitle}>Leave Request & Approval Review</h3>
          </div>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className={styles.body}>
          {/* Status & Current Approver Banner */}
          <div className={styles.statusBanner}>
            <div className={styles.statusBannerLeft}>
              <span className={styles.bannerLabel}>Current Workflow Stage</span>
              <span className={styles.bannerStatus}>{selectedLeave.status}</span>
            </div>
            <div className={styles.statusBannerRight}>
              <span className={styles.bannerLabel}>Assigned Reviewer</span>
              <span className={styles.bannerApprover}>{selectedLeave.currentApprover || 'HR Operations'}</span>
            </div>
          </div>

          {/* Section 1: Employee Information */}
          <div className={styles.sectionCard}>
            <h4 className={styles.sectionHeading}>
              <Briefcase size={15} />
              <span>Employee Information</span>
            </h4>
            <div className={styles.grid2}>
              <div className={styles.infoField}>
                <span className={styles.infoLabel}>Employee Name</span>
                <span className={styles.infoValHighlight}>{selectedLeave.employeeName}</span>
              </div>
              <div className={styles.infoField}>
                <span className={styles.infoLabel}>Employee Code</span>
                <span className={styles.infoVal}>{selectedLeave.employeeId}</span>
              </div>
              <div className={styles.infoField}>
                <span className={styles.infoLabel}>Department</span>
                <span className={styles.infoVal}>{selectedLeave.department}</span>
              </div>
              <div className={styles.infoField}>
                <span className={styles.infoLabel}>Designation</span>
                <span className={styles.infoVal}>{selectedLeave.designation || 'Security Guard'}</span>
              </div>
              <div className={styles.infoField}>
                <span className={styles.infoLabel}>Client</span>
                <span className={styles.infoVal}>{selectedLeave.clientName}</span>
              </div>
              <div className={styles.infoField}>
                <span className={styles.infoLabel}>Site / Location</span>
                <span className={styles.infoVal}>{selectedLeave.site || 'Site Post A'}</span>
              </div>
            </div>
          </div>

          {/* Section 2: Leave Details */}
          <div className={styles.sectionCard}>
            <h4 className={styles.sectionHeading}>
              <Calendar size={15} />
              <span>Leave Application Specifics</span>
            </h4>
            <div className={styles.grid3}>
              <div className={styles.infoField}>
                <span className={styles.infoLabel}>Leave Type</span>
                <span className={styles.infoValHighlight}>
                  {selectedLeave.leaveCode ? `[${selectedLeave.leaveCode}] ` : ''}{selectedLeave.leaveType}
                </span>
              </div>
              <div className={styles.infoField}>
                <span className={styles.infoLabel}>Duration Type</span>
                <span className={styles.infoVal}>{selectedLeave.durationType || 'Full Day'}</span>
              </div>
              <div className={styles.infoField}>
                <span className={styles.infoLabel}>Total Requested</span>
                <span className={styles.infoValHighlight}>{selectedLeave.days} Days</span>
              </div>
            </div>

            <div className={styles.grid2} style={{ marginTop: '10px' }}>
              <div className={styles.infoField}>
                <span className={styles.infoLabel}>From Date</span>
                <span className={styles.infoVal}>{selectedLeave.fromDate}</span>
              </div>
              <div className={styles.infoField}>
                <span className={styles.infoLabel}>To Date</span>
                <span className={styles.infoVal}>{selectedLeave.toDate}</span>
              </div>
            </div>

            {/* Date-wise Breakdown for multi-day */}
            {selectedLeave.dateBreakdown && selectedLeave.dateBreakdown.length > 0 && (
              <div className={styles.dateBreakdownWrap}>
                <span className={styles.dateBreakdownLabel}>Schedule Breakdown:</span>
                <div className={styles.chipsRow}>
                  {selectedLeave.dateBreakdown.map((bd, i) => (
                    <span key={i} className={styles.chip}>
                      <strong>{bd.date}:</strong> {bd.dayType} ({bd.units}d)
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className={styles.reasonBox}>
              <span className={styles.infoLabel}>Reason for Leave:</span>
              <p className={styles.reasonText}>{selectedLeave.reason}</p>
            </div>

            {selectedLeave.supportingDocName && (
              <div className={styles.docBox}>
                <FileText size={15} className={styles.docIcon} />
                <span>Attachment: <strong>{selectedLeave.supportingDocName}</strong></span>
              </div>
            )}

            {selectedLeave.remarks && (
              <div className={styles.remarksBox}>
                <span className={styles.infoLabel}>Applicant Remarks / Handover:</span>
                <p className={styles.remarksText}>{selectedLeave.remarks}</p>
              </div>
            )}
          </div>

          {/* Section 3: Site Manpower Impact */}
          <div className={styles.sectionCard}>
            <SiteManpowerImpactWidget siteInfo={siteInfo} leaveDays={selectedLeave.days} />
          </div>

          {/* Section 4: Approval Workflow Timeline */}
          <div className={styles.sectionCard}>
            <h4 className={styles.sectionHeading}>
              <ShieldCheck size={15} />
              <span>5-Stage Approval & Synchronization Timeline</span>
            </h4>

            <div className={styles.timelineList}>
              {(selectedLeave.timeline || [
                { stage: 'Employee Applied', actor: selectedLeave.employeeName, status: 'Completed', timestamp: '2026-08-28 09:30 AM', remarks: 'Submitted' },
                { stage: 'Site Supervisor Approval', actor: 'Supervisor', status: isPendingSupervisor ? 'Pending' : 'Approved', timestamp: isPendingSupervisor ? null : '2026-08-28 02:00 PM', remarks: null },
                { stage: 'HR Approval', actor: 'HR Manager', status: isPendingHR ? 'Pending' : isPendingSupervisor ? 'Queued' : 'Approved', timestamp: null, remarks: null },
                { stage: 'Attendance Update', actor: 'Automated Sync', status: 'Queued', timestamp: null, remarks: 'Attendance status prepared' },
                { stage: 'Payroll Calculation', actor: 'Payroll Engine', status: 'Queued', timestamp: null, remarks: 'Salary impact evaluated' }
              ]).map((step, idx) => {
                const isCompleted = step.status === 'Completed' || step.status === 'Approved';
                const isPending = step.status === 'Pending';
                const isRejected = step.status === 'Rejected';

                return (
                  <div key={idx} className={styles.timelineItem}>
                    <div className={styles.timelineNodeWrap}>
                      <div className={`${styles.timelineNode} ${isCompleted ? styles.nodeDone : isPending ? styles.nodePending : isRejected ? styles.nodeRejected : styles.nodeQueued}`}>
                        {idx + 1}
                      </div>
                      {idx < 4 && <div className={styles.timelineLine} />}
                    </div>
                    <div className={styles.timelineContent}>
                      <div className={styles.timelineHeader}>
                        <span className={styles.stageTitle}>{step.stage}</span>
                        <span className={`${styles.stageBadge} ${isCompleted ? styles.badgeDone : isPending ? styles.badgePending : isRejected ? styles.badgeRejected : styles.badgeQueued}`}>
                          {step.status}
                        </span>
                      </div>
                      <div className={styles.stageMeta}>
                        <span>Actor: <strong>{step.actor}</strong></span>
                        {step.timestamp && <span> • {step.timestamp}</span>}
                      </div>
                      {step.remarks && <p className={styles.stageRemarks}>&ldquo;{step.remarks}&rdquo;</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 5: Attendance & Payroll Impact */}
          <div className={styles.sectionCard}>
            <h4 className={styles.sectionHeading}>
              <CreditCard size={15} />
              <span>Attendance & Payroll Synchronization</span>
            </h4>

            <div className={styles.integrationGrid}>
              <div className={styles.integrationBox}>
                <span className={styles.intTitle}>Attendance Status Mapping</span>
                <div className={styles.intContent}>
                  <div className={styles.intRow}>
                    <span>Marked In Attendance:</span>
                    <strong>{selectedLeave.attendanceImpact?.status || `Leave (${selectedLeave.leaveCode || 'CL'})`}</strong>
                  </div>
                  <div className={styles.intRow}>
                    <span>Attendance Code:</span>
                    <span className={styles.codePill}>{selectedLeave.attendanceImpact?.dailyCode || `L-${selectedLeave.leaveCode || 'CL'}`}</span>
                  </div>
                </div>
              </div>

              <div className={styles.integrationBox}>
                <span className={styles.intTitle}>Payroll & Payable Days Impact</span>
                <div className={styles.intContent}>
                  <div className={styles.intRow}>
                    <span>Monthly Working Days:</span>
                    <strong>{selectedLeave.payrollImpact?.monthlyWorkingDays || 30} Days</strong>
                  </div>
                  <div className={styles.intRow}>
                    <span>Paid Leave Allowed:</span>
                    <strong style={{ color: '#15803d' }}>{selectedLeave.payrollImpact?.paidLeaveDays || (selectedLeave.category === 'Paid' ? selectedLeave.days : 0)} Days</strong>
                  </div>
                  <div className={styles.intRow}>
                    <span>Unpaid LWP:</span>
                    <strong style={{ color: selectedLeave.category === 'Unpaid' ? '#dc2626' : 'var(--text-muted)' }}>
                      {selectedLeave.payrollImpact?.lwpDays || (selectedLeave.category === 'Unpaid' ? selectedLeave.days : 0)} Days
                    </strong>
                  </div>
                  <div className={styles.intRow}>
                    <span>Net Payable Days:</span>
                    <strong>{selectedLeave.payrollImpact?.payableDays || 30} Days</strong>
                  </div>
                </div>
                {selectedLeave.payrollImpact?.note && (
                  <p className={styles.payrollNote}>{selectedLeave.payrollImpact.note}</p>
                )}
              </div>
            </div>
          </div>

          {/* Rejection / Send Back Reason display if any */}
          {selectedLeave.rejectionReason && (
            <div className={styles.rejectionNotice}>
              <XCircle size={18} />
              <div>
                <strong>Rejection Reason:</strong>
                <p>{selectedLeave.rejectionReason}</p>
              </div>
            </div>
          )}

          {selectedLeave.sendBackReason && (
            <div className={styles.sendBackNotice}>
              <RotateCcw size={18} />
              <div>
                <strong>Sent Back for Revision:</strong>
                <p>{selectedLeave.sendBackReason}</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className={styles.footer}>
          <button type="button" className={styles.secondaryBtn} onClick={onClose}>
            Close
          </button>

          {isPendingSupervisor && (
            <>
              <button
                type="button"
                className={styles.sendBackBtn}
                onClick={() => onSendBackClick(selectedLeave)}
              >
                <RotateCcw size={15} />
                <span>Send Back</span>
              </button>
              <button
                type="button"
                className={styles.rejectBtn}
                onClick={() => onRejectClick(selectedLeave)}
              >
                <XCircle size={15} />
                <span>Reject</span>
              </button>
              <button
                type="button"
                className={styles.approveBtn}
                onClick={() => onSupervisorApprove(selectedLeave)}
              >
                <CheckCircle size={15} />
                <span>Approve as Supervisor</span>
              </button>
            </>
          )}

          {isPendingHR && (
            <>
              <button
                type="button"
                className={styles.sendBackBtn}
                onClick={() => onSendBackClick(selectedLeave)}
              >
                <RotateCcw size={15} />
                <span>Send Back</span>
              </button>
              <button
                type="button"
                className={styles.rejectBtn}
                onClick={() => onRejectClick(selectedLeave)}
              >
                <XCircle size={15} />
                <span>Reject</span>
              </button>
              <button
                type="button"
                className={styles.approveBtn}
                onClick={() => onHrApprove(selectedLeave)}
              >
                <CheckCircle size={15} />
                <span>Final HR Sanction & Sync</span>
              </button>
            </>
          )}
        </div>
      </aside>
    </>
  );
}
