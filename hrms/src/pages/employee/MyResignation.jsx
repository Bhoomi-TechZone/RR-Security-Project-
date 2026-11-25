import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  UserCheck,
  FileCheck2,
  Clock,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import Toast from '../../components/common/Toast';
import RequestBackButton from '../../components/common/RequestBackButton';
import { useCompany } from '../../context/CompanyContext';
import authService from '../../services/authService';
import employeeService from '../../services/employeeService';
import separationService from '../../services/separationService';
import {
  SEPARATION_REASONS,
  getStoredFnF,
  saveStoredFnF
} from '../../data/fnfData';
import { addHubRequest } from '../../data/requestHubData';
import styles from '../admin/FnFInitiatePage.module.css';

const EMPLOYEE_EXIT_REASONS = SEPARATION_REASONS.filter(
  (r) => r !== 'Death' && r !== 'Termination'
);

function formatDateDisplay(dateStr) {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr.length === 10 ? `${dateStr}T12:00:00` : dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const day = String(d.getDate()).padStart(2, '0');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${day}-${months[d.getMonth()]}-${d.getFullYear()}`;
  } catch (_) {
    return dateStr;
  }
}

function toDateInputValue(d) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function MyResignation() {
  const { activeCompanyId, activeCompany } = useCompany();
  const currentUser = authService.getCurrentUser() || {};
  const companyId = activeCompanyId || currentUser?.companyId || 'RRS8392014SEC';

  const [toast, setToast] = useState(null);
  const notify = (message, type = 'success') => setToast({ message, type });

  const [empProfile, setEmpProfile] = useState(() => ({
    id: currentUser?.employeeId || currentUser?.id || currentUser?._id || '',
    code: currentUser?.employeeCode || currentUser?.employeeId || currentUser?.id || 'EMP',
    name: currentUser?.name || currentUser?.fullName || currentUser?.employeeName || 'Employee',
    designation: currentUser?.designation || currentUser?.role || 'Staff Member',
    department: currentUser?.department || 'Operations',
    location: currentUser?.siteLocation || currentUser?.site || currentUser?.workLocation || 'Main Facility',
    clientName: currentUser?.clientName || activeCompany?.name || 'Company',
    dateOfJoining: currentUser?.joiningDate || currentUser?.dateOfJoining || '',
    noticeDays: Number(currentUser?.noticePeriod) || 30,
    avatar: currentUser?.employeePhoto || currentUser?.profilePhoto || currentUser?.avatar || null
  }));

  const [myExits, setMyExits] = useState([]);
  const [loadingExits, setLoadingExits] = useState(true);

  // Form Fields matching Admin Initiate Separation Form
  const today = useMemo(() => new Date(), []);
  const initialLastWorking = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + (Number(currentUser?.noticePeriod) || 30));
    return d;
  }, [currentUser?.noticePeriod]);

  const [resignationDate, setResignationDate] = useState(() => toDateInputValue(today));
  const [lastWorkingDate, setLastWorkingDate] = useState(() => toDateInputValue(initialLastWorking));
  const [reasonOfExit, setReasonOfExit] = useState('');
  const [remarks, setRemarks] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load live employee profile & submitted exit records
  const loadData = useCallback(async () => {
    setLoadingExits(true);
    try {
      const [allEmps, sepRes] = await Promise.all([
        employeeService.getEmployees(companyId).catch(() => []),
        separationService.getSeparations({}, companyId).catch(() => null)
      ]);

      const curId = String(currentUser?.employeeId || currentUser?.id || currentUser?._id || '').trim().toLowerCase();
      const curCode = String(currentUser?.employeeCode || '').trim().toLowerCase();
      const curEmail = String(currentUser?.email || '').trim().toLowerCase();
      const curName = String(currentUser?.name || currentUser?.employeeName || '').trim().toLowerCase();

      if (Array.isArray(allEmps) && allEmps.length > 0) {
        const matched = allEmps.find((item) => {
          const iId = String(item.id || item._id || item.employeeId || '').trim().toLowerCase();
          const iCode = String(item.employeeCode || item.code || '').trim().toLowerCase();
          const iEmail = String(item.email || '').trim().toLowerCase();
          const iName = String(item.name || '').trim().toLowerCase();
          return (
            (curCode && iCode && iCode === curCode) ||
            (curId && iId && iId === curId) ||
            (curEmail && iEmail && iEmail === curEmail) ||
            (curName && iName && iName === curName)
          );
        });

        if (matched) {
          const resolvedNotice = Number(matched.noticePeriod) || 30;
          setEmpProfile({
            id: matched.id || matched._id || matched.employeeId || curId,
            code: matched.employeeCode || matched.code || curCode || 'EMP',
            name: matched.name || empProfile.name,
            designation: matched.designation || 'Staff Member',
            department: matched.department || 'Operations',
            location: matched.siteLocation || matched.site || matched.joiningLocation || matched.location || '—',
            clientName: matched.clientName || matched.companyName || activeCompany?.name || '—',
            dateOfJoining: matched.joiningDate || matched.dateOfJoining || '',
            noticeDays: resolvedNotice,
            avatar: matched.employeePhoto || matched.profilePhoto || matched.avatar || null
          });
        }
      }

      const rawExits = sepRes?.data?.length ? sepRes.data : getStoredFnF();
      const mine = (rawExits || []).filter((rec) => {
        if (rec.settlementStatus === 'Cancelled') return false;
        const rId = String(rec.employeeId || '').trim().toLowerCase();
        const rCode = String(rec.employeeCode || '').trim().toLowerCase();
        const rName = String(rec.employeeName || '').trim().toLowerCase();
        return (
          (curCode && (rCode === curCode || rId === curCode)) ||
          (curId && (rId === curId || rCode === curId)) ||
          (curName && rName === curName)
        );
      });
      setMyExits(mine);
    } catch (err) {
      console.warn('Failed to load resignation data:', err);
    } finally {
      setLoadingExits(false);
    }
  }, [companyId, activeCompany?.name]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const noticeDays = empProfile.noticeDays || 30;

  // Dynamic Notice & Timeline Summary Calculation (matches Admin Initiate Separation)
  const timelineSummary = useMemo(() => {
    if (!resignationDate || !lastWorkingDate) {
      return { valid: false, days: 0, text: 'Select resignation and last working dates to calculate notice timeline.' };
    }
    const d1 = new Date(`${resignationDate}T00:00:00`);
    const d2 = new Date(`${lastWorkingDate}T00:00:00`);
    const diffDays = Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return {
        valid: false,
        days: 0,
        text: 'Last working date cannot be earlier than resignation date.'
      };
    }

    if (diffDays === noticeDays) {
      return {
        valid: true,
        days: diffDays,
        text: `${diffDays} day(s) between resignation and last working date — aligned with the standard notice period`
      };
    }
    if (diffDays < noticeDays) {
      const shortfall = noticeDays - diffDays;
      return {
        valid: true,
        days: diffDays,
        text: `${diffDays} day(s) between resignation and last working date — notice shortfall of ${shortfall} day(s)`
      };
    }
    const extended = diffDays - noticeDays;
    return {
      valid: true,
      days: diffDays,
      text: `${diffDays} day(s) between resignation and last working date — notice extended by ${extended} day(s)`
    };
  }, [resignationDate, lastWorkingDate, noticeDays]);

  const activePendingExit = useMemo(
    () => myExits.find((r) => !['Settled / Disbursed', 'Cancelled'].includes(r.settlementStatus)),
    [myExits]
  );

  const handleSubmitResignation = async (e) => {
    e.preventDefault();
    if (!resignationDate) {
      notify('Please select the resignation date.', 'error');
      return;
    }
    if (!lastWorkingDate) {
      notify('Please select your last working date.', 'error');
      return;
    }
    if (!timelineSummary.valid) {
      notify('Last working date cannot be earlier than resignation date.', 'error');
      return;
    }
    if (!reasonOfExit) {
      notify('Please choose a reason for exit.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        employeeId: empProfile.id || empProfile.code,
        employeeCode: empProfile.code,
        employeeName: empProfile.name,
        avatar: empProfile.avatar || null,
        designation: empProfile.designation || 'Staff Member',
        client: empProfile.clientName || 'Corporate Client',
        site: empProfile.location || 'Main Site',
        department: empProfile.department || 'General',
        dateOfJoining: empProfile.dateOfJoining || '',
        exitType: 'Resignation',
        resignationDate,
        lastWorkingDay: lastWorkingDate,
        separationReason: reasonOfExit,
        noticePeriodRequiredDays: noticeDays,
        tryingToRetain: false,
        remarks: remarks.trim()
      };

      let createdRecord = null;
      try {
        const res = await separationService.createSeparation(payload, companyId);
        createdRecord = res?.data;
      } catch (apiErr) {
        console.warn('Backend separation submit notice:', apiErr.message);
      }

      const fallbackRecord = createdRecord || {
        ...payload,
        id: `fnf-${Date.now()}`,
        settlementId: `SEP-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
        settlementStatus: 'Pending Clearance',
        createdAt: new Date().toISOString()
      };

      try {
        const existingRecords = getStoredFnF();
        saveStoredFnF([fallbackRecord, ...existingRecords]);
      } catch (_) {}

      addHubRequest({
        id: fallbackRecord.settlementId || `REQ-RES-${Math.floor(9910 + Math.random() * 80)}`,
        categoryId: 'resignation',
        categoryLabel: 'Resignation / Exit',
        employeeId: empProfile.code,
        employeeName: empProfile.name,
        designation: empProfile.designation,
        site: empProfile.location,
        submittedDate: resignationDate,
        summary: `Resignation Notice (Proposed LWD: ${formatDateDisplay(lastWorkingDate)})`,
        amountOrMetric: `LWD: ${formatDateDisplay(lastWorkingDate)}`,
        priority: 'High',
        stage: 'Pending Clearance',
        status: 'Pending',
        reason: `${reasonOfExit}${remarks.trim() ? ` — ${remarks.trim()}` : ''}`,
        remarks: remarks.trim(),
        details: {
          'Resignation Date': formatDateDisplay(resignationDate),
          'Last Working Date': formatDateDisplay(lastWorkingDate),
          'Reason of Exit': reasonOfExit,
          'Notice Period': `${noticeDays} days (${timelineSummary.days} days served)`
        }
      });

      notify('✓ Resignation / Exit request submitted successfully! HR & Admin have been notified.', 'success');
      setReasonOfExit('');
      setRemarks('');
      await loadData();
    } catch (err) {
      console.error('Error submitting resignation:', err);
      notify(err.message || 'Failed to submit exit request. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.container} style={{ padding: '24px 24px 40px' }}>
      {/* Breadcrumb Navigation */}
      <div className={styles.breadcrumb}>
        <Link to="/employee/dashboard">Employee Portal</Link>
        <span>/</span>
        <strong>Resignation / Exit</strong>
      </div>

      {/* Header Row */}
      <div className={styles.pageHeader}>
        <div className={styles.headerLeft}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <RequestBackButton />
            <div className={styles.titleGroup}>
              <h1 className={styles.title}>Resignation / Exit Request</h1>
              <p className={styles.subtitle}>
                Submit your resignation schedule, review notice period timeline, and track clearance status.
              </p>
            </div>
          </div>
        </div>
      </div>

      {activePendingExit && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '14px 18px',
            borderRadius: '10px',
            backgroundColor: '#eff6ff',
            border: '1px solid #bfdbfe',
            color: '#1e40af',
            fontSize: '0.88rem'
          }}
        >
          <AlertCircle size={18} style={{ flexShrink: 0 }} />
          <div>
            <strong>Active Exit Request ({activePendingExit.settlementId || 'Pending'}):</strong>{' '}
            Your separation request ({activePendingExit.separationReason}) with Last Working Date{' '}
            <strong>{formatDateDisplay(activePendingExit.lastWorkingDay)}</strong> is currently{' '}
            <strong>{activePendingExit.settlementStatus || 'Pending Clearance'}</strong>.
          </div>
        </div>
      )}

      {/* 2-Column Grid matching Admin Initiate Separation */}
      <div className={styles.loadedGrid}>
        {/* Left Card: Exit Information Form */}
        <div className={styles.formCard}>
          <div className={styles.iconHeader}>
            <div className={styles.iconBox}>
              <FileText size={20} />
            </div>
            <div>
              <h3 className={styles.panelTitle}>Separation & Exit Information</h3>
              <p className={styles.panelSubtitle}>
                Capture your resignation timeline, reason for separation, and handover remarks.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmitResignation} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Resignation Date & Last Working Date */}
            <div className={styles.datesRow}>
              <div className={styles.fieldGroup}>
                <label className={styles.inputLabel}>
                  Resignation Date <span className={styles.required}>*</span>
                </label>
                <input
                  type="date"
                  className={styles.dateInput}
                  value={resignationDate}
                  onChange={(e) => setResignationDate(e.target.value)}
                  required
                />
              </div>
              <div className={styles.fieldGroup}>
                <label className={styles.inputLabel}>
                  Last Working Date <span className={styles.required}>*</span>
                </label>
                <input
                  type="date"
                  className={styles.dateInput}
                  value={lastWorkingDate}
                  onChange={(e) => setLastWorkingDate(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Notice Period & Timeline Summary Banner */}
            <div className={styles.noticeBanner}>
              <div className={styles.bannerNoticeCol}>
                <span className={styles.bannerLabel}>NOTICE PERIOD</span>
                <span className={styles.bannerNoticeDays}>{noticeDays} days</span>
              </div>
              <div className={styles.bannerSummaryCol}>
                <span className={styles.bannerLabel}>TIMELINE SUMMARY</span>
                <span className={styles.bannerSummaryText}>{timelineSummary.text}</span>
              </div>
            </div>

            {/* Reason of Exit */}
            <div className={styles.fieldGroup}>
              <label className={styles.inputLabel}>
                Reason of Exit <span className={styles.required}>*</span>
              </label>
              <select
                className={styles.selectInput}
                value={reasonOfExit}
                onChange={(e) => setReasonOfExit(e.target.value)}
                required
              >
                <option value="">- Select -</option>
                {EMPLOYEE_EXIT_REASONS.map((reason) => (
                  <option key={reason} value={reason}>
                    {reason}
                  </option>
                ))}
              </select>
            </div>

            {/* Remarks */}
            <div className={styles.fieldGroup}>
              <label className={styles.inputLabel}>Remarks</label>
              <textarea
                className={styles.textarea}
                placeholder="Add any context, operational notes, or handover remarks relevant to this exit..."
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                rows={3}
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className={styles.submitBtn}
              disabled={isSubmitting}
            >
              <FileCheck2 size={16} />
              <span>{isSubmitting ? 'Submitting Request...' : 'Submit Exit Request'}</span>
            </button>
          </form>
        </div>

        {/* Right Card: Employee Snapshot */}
        <div className={styles.profileCard}>
          <div className={styles.iconHeader}>
            <div className={styles.iconBox}>
              <UserCheck size={20} />
            </div>
            <div>
              <h3 className={styles.panelTitle}>Employee Snapshot</h3>
              <p className={styles.panelSubtitle}>
                Your employment profile linked with this separation request.
              </p>
            </div>
          </div>

          <div className={styles.avatarSection}>
            {empProfile.avatar ? (
              <img
                src={empProfile.avatar}
                alt={empProfile.name}
                className={styles.avatarImg}
              />
            ) : (
              <div className={styles.avatarFallback}>
                {empProfile.name
                  ? empProfile.name
                      .split(' ')
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join('')
                      .toUpperCase()
                  : 'EM'}
              </div>
            )}
            <h2 className={styles.empName}>{empProfile.name}</h2>
            <span className={styles.empCodeBadge}>{empProfile.code}</span>
          </div>

          <div className={styles.snapshotGrid}>
            <div className={styles.snapshotBox}>
              <span className={styles.boxLabel}>JOINED</span>
              <span className={styles.boxValue}>{formatDateDisplay(empProfile.dateOfJoining)}</span>
            </div>

            <div className={styles.snapshotBox}>
              <span className={styles.boxLabel}>DESIGNATION</span>
              <span className={styles.boxValue}>{empProfile.designation || '—'}</span>
            </div>

            <div className={styles.snapshotBox}>
              <span className={styles.boxLabel}>DEPARTMENT</span>
              <span className={styles.boxValue}>{empProfile.department || '—'}</span>
            </div>

            <div className={styles.snapshotBox}>
              <span className={styles.boxLabel}>LOCATION</span>
              <span className={styles.boxValue}>{empProfile.location || '—'}</span>
            </div>

            <div className={`${styles.snapshotBox} ${styles.fullWidthBox}`}>
              <span className={styles.boxLabel}>CLIENT COMPANY</span>
              <span className={styles.boxValue}>{empProfile.clientName || '—'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Submitted Exit Requests Status Table */}
      <div className={styles.formCard} style={{ marginTop: '4px' }}>
        <div className={styles.iconHeader} style={{ marginBottom: '4px' }}>
          <div className={styles.iconBox}>
            <Clock size={20} />
          </div>
          <div>
            <h3 className={styles.panelTitle}>My Submitted Exit Requests</h3>
            <p className={styles.panelSubtitle}>
              Track clearance progress and status of your resignation submissions.
            </p>
          </div>
        </div>

        {loadingExits ? (
          <div style={{ padding: '20px', textAlign: 'center', color: '#64748b', fontSize: '0.88rem' }}>
            Loading your exit requests...
          </div>
        ) : myExits.length === 0 ? (
          <div style={{ padding: '20px', textAlign: 'center', color: '#64748b', fontSize: '0.88rem', background: '#f8fafc', borderRadius: '8px' }}>
            You have not submitted any resignation or exit request yet.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left', color: '#475569' }}>
                  <th style={{ padding: '10px 14px' }}>Ref ID</th>
                  <th style={{ padding: '10px 14px' }}>Resignation Date</th>
                  <th style={{ padding: '10px 14px' }}>Last Working Date</th>
                  <th style={{ padding: '10px 14px' }}>Exit Reason</th>
                  <th style={{ padding: '10px 14px' }}>Notice Days</th>
                  <th style={{ padding: '10px 14px' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {myExits.map((rec) => (
                  <tr key={rec._id || rec.id || rec.settlementId} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '12px 14px', fontFamily: 'monospace', fontWeight: 600 }}>
                      {rec.settlementId || rec.id}
                    </td>
                    <td style={{ padding: '12px 14px' }}>{formatDateDisplay(rec.resignationDate)}</td>
                    <td style={{ padding: '12px 14px', fontWeight: 600 }}>{formatDateDisplay(rec.lastWorkingDay)}</td>
                    <td style={{ padding: '12px 14px' }}>
                      <div>{rec.separationReason || '—'}</div>
                      {rec.remarks && (
                        <small style={{ color: '#64748b', fontSize: '0.75rem' }}>{rec.remarks}</small>
                      )}
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      {rec.noticePeriodServedDays ?? rec.noticePeriodRequiredDays ?? 30} / {rec.noticePeriodRequiredDays ?? 30} days
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '3px 10px',
                          borderRadius: '999px',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          backgroundColor: rec.settlementStatus === 'Settled / Disbursed' ? '#dcfce7' : '#fef3c7',
                          color: rec.settlementStatus === 'Settled / Disbursed' ? '#166534' : '#92400e'
                        }}
                      >
                        <CheckCircle2 size={12} />
                        {rec.settlementStatus || 'Pending Clearance'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
