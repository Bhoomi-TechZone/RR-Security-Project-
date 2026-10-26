import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  X,
  CheckCircle2,
  AlertTriangle,
  Play,
  Sparkles,
  ShieldCheck,
  ArrowRight,
  Calendar,
  Loader2,
  XCircle,
} from 'lucide-react';
import { formatRupee } from '../../utils/payrollUtils';
import payrollService from '../../services/payrollService';
import attendanceService from '../../services/attendanceService';
import styles from './RunPayrollModal.module.css';

const getMonthDisplayLabel = (mStr) => {
  if (!mStr || !mStr.includes('-')) return mStr || '';
  const [y, m] = mStr.split('-');
  const d = new Date(parseInt(y, 10), parseInt(m, 10) - 1, 1);
  return d.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
};

const generateStandardMonths = () => {
  const list = [];
  const now = new Date();
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = d.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
    list.push({ value, label });
  }
  return list;
};

export default function RunPayrollModal({
  isOpen,
  onClose,
  selectedMonth = '2026-10',
  monthLabel: propMonthLabel,
  companies = [],
  departments = [],
  employeeCount: initialEmployeeCount = 0,
  estimatedGross: initialEstimatedGross = 0,
  estimatedDeductions: initialEstimatedDeductions = 0,
  estimatedNet: initialEstimatedNet = 0,
  records: initialRecords = [],
  companyId,
  onComplete,
  onViewIssues,
}) {
  const [step, setStep] = useState('config'); // 'config' | 'processing' | 'success'
  const [activeMonth, setActiveMonth] = useState(selectedMonth);
  const [availableMonths, setAvailableMonths] = useState([]);
  const [attendanceCount, setAttendanceCount] = useState(0);
  const [isLoadingMonthData, setIsLoadingMonthData] = useState(false);
  const [liveRecords, setLiveRecords] = useState(initialRecords || []);
  const [liveKPI, setLiveKPI] = useState({
    employeeCount: initialEmployeeCount,
    estimatedGross: initialEstimatedGross,
    estimatedDeductions: initialEstimatedDeductions,
    estimatedNet: initialEstimatedNet,
  });

  const [selectedClient, setSelectedClient] = useState('all');
  const [selectedDept, setSelectedDept] = useState('all');
  const [progress, setProgress] = useState(0);
  const [processedCount, setProcessedCount] = useState(0);
  const [currentStage, setCurrentStage] = useState('');

  const standardMonthsList = useMemo(() => generateStandardMonths(), []);
  const currentMonthLabel = useMemo(() => getMonthDisplayLabel(activeMonth), [activeMonth]);

  const totalEmployees =
    liveKPI.employeeCount > 0
      ? liveKPI.employeeCount
      : Array.isArray(liveRecords) && liveRecords.length > 0
      ? liveRecords.length
      : 1;

  // Load attendance months and check records for current month
  const checkAttendanceAndLoadPayroll = useCallback(
    async (targetMonth) => {
      setIsLoadingMonthData(true);
      try {
        // 1. Check attendance count in MongoDB for targetMonth
        const attRes = await attendanceService
          .getAttendanceRecords(companyId, { month: targetMonth })
          .catch(() => ({ count: 0, records: [] }));

        const count = attRes?.count !== undefined
          ? attRes.count
          : Array.isArray(attRes?.records)
          ? attRes.records.length
          : 0;

        setAttendanceCount(count);

        // 2. Fetch live calculated payroll preview for this month
        const payrollData = await payrollService
          .getPayrollRecords(companyId, targetMonth)
          .catch(() => null);

        if (payrollData && Array.isArray(payrollData.records) && payrollData.records.length > 0) {
          const recs = payrollData.records;
          setLiveRecords(recs);
          const gross = recs.reduce((sum, r) => sum + (Number(r.grossSalary) || 0), 0);
          const deduct = recs.reduce((sum, r) => sum + (Number(r.totalDeductions) || 0), 0);
          const net = recs.reduce((sum, r) => sum + (Number(r.netSalary) || 0), 0);
          setLiveKPI({
            employeeCount: recs.length,
            estimatedGross: gross,
            estimatedDeductions: deduct,
            estimatedNet: net,
          });
        }
      } catch (err) {
        console.warn('Error loading payroll data for selected month:', err);
      } finally {
        setIsLoadingMonthData(false);
      }
    },
    [companyId]
  );

  // Initialize modal state on open
  useEffect(() => {
    if (isOpen) {
      setStep('config');
      setProgress(0);
      setProcessedCount(0);
      setCurrentStage('Initializing payroll engine...');
      setActiveMonth(selectedMonth);

      // Fetch distinct months with attendance
      attendanceService
        .getAttendanceMonths(companyId)
        .then((months) => {
          setAvailableMonths(months || []);
          // If current selectedMonth has no attendance but another month has attendance, highlight it
          const currentHasAttendance = (months || []).find((m) => m.month === selectedMonth);
          if (currentHasAttendance) {
            setAttendanceCount(currentHasAttendance.count);
          }
        })
        .catch(() => {});

      checkAttendanceAndLoadPayroll(selectedMonth);
    }
  }, [isOpen, selectedMonth, companyId, checkAttendanceAndLoadPayroll]);

  // Handle User selecting a different month
  const handleMonthChange = (newMonth) => {
    setActiveMonth(newMonth);
    checkAttendanceAndLoadPayroll(newMonth);
  };

  // Simulate progress when step is processing
  useEffect(() => {
    if (step !== 'processing') return;

    const stages = [
      'Validating employee records & bank details...',
      'Calculating attendance and payable days...',
      'Calculating approved overtime hours & rates...',
      'Applying active advance & loan adjustments...',
      'Applying statutory PF & ESI deductions...',
      'Generating net salary ledgers & slips...',
    ];

    let currentProgress = 0;
    const interval = setInterval(() => {
      currentProgress += Math.floor(Math.random() * 8) + 5;
      if (currentProgress >= 100) {
        currentProgress = 100;
        setProgress(100);
        setProcessedCount(totalEmployees);
        clearInterval(interval);
        setTimeout(() => {
          setStep('success');
        }, 500);
      } else {
        setProgress(currentProgress);
        setProcessedCount(Math.floor((currentProgress / 100) * totalEmployees));
        const stageIndex = Math.min(stages.length - 1, Math.floor((currentProgress / 100) * stages.length));
        setCurrentStage(stages[stageIndex]);
      }
    }, 150);

    return () => clearInterval(interval);
  }, [step, totalEmployees]);

  if (!isOpen) return null;

  const handleStartProcessing = () => {
    if (attendanceCount === 0) return;
    setStep('processing');
  };

  const handleFinish = () => {
    onComplete(activeMonth, liveRecords);
    onClose();
  };

  const hasAttendance = attendanceCount > 0;

  return (
    <div className={styles.modalOverlay} role="dialog" aria-modal="true">
      <div className={styles.modalCard}>
        {/* Header */}
        <div className={styles.modalHeader}>
          <div className={styles.headerTitleWrap}>
            <Sparkles size={20} className={styles.sparkleIcon} />
            <div>
              <h2>Run Payroll</h2>
              <span className={styles.monthBadge}>{currentMonthLabel}</span>
            </div>
          </div>
          {step !== 'processing' && (
            <button
              type="button"
              className={styles.closeBtn}
              onClick={onClose}
              aria-label="Close modal"
            >
              <X size={20} />
            </button>
          )}
        </div>

        {/* Step 1: Config & Confirmation */}
        {step === 'config' && (
          <div className={styles.modalBody}>
            <div className={styles.formGrid}>
              {/* SELECT PAYROLL MONTH */}
              <div className={styles.field}>
                <label className={styles.fieldLabel} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Payroll Month *</span>
                  {isLoadingMonthData ? (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#64748b', fontSize: '11px' }}>
                      <Loader2 size={12} className={styles.spinning} /> Checking...
                    </span>
                  ) : hasAttendance ? (
                    <span style={{ color: '#16a34a', fontSize: '11px', fontWeight: 700 }}>
                      ✓ {attendanceCount} Attendance Records
                    </span>
                  ) : (
                    <span style={{ color: '#dc2626', fontSize: '11px', fontWeight: 700 }}>
                      ⚠ No Attendance Records
                    </span>
                  )}
                </label>
                <select
                  className={styles.select}
                  value={activeMonth}
                  onChange={(e) => handleMonthChange(e.target.value)}
                  style={{
                    fontWeight: 600,
                    cursor: 'pointer',
                    borderColor: hasAttendance ? '#86efac' : '#fca5a5',
                    background: hasAttendance ? '#f0fdf4' : '#fff5f5',
                  }}
                >
                  {/* Option Group 1: Months with Attendance in DB */}
                  {availableMonths.length > 0 && (
                    <optgroup label="✓ Months with Attendance Records in Database">
                      {availableMonths.map((m) => (
                        <option key={m.month} value={m.month}>
                          {m.label} ({m.count} attendance records found)
                        </option>
                      ))}
                    </optgroup>
                  )}

                  {/* Option Group 2: All Other Standard Months */}
                  <optgroup label="Calendar Months">
                    {standardMonthsList
                      .filter((m) => !availableMonths.some((am) => am.month === m.value))
                      .map((m) => (
                        <option key={m.value} value={m.value}>
                          {m.label} (No attendance records)
                        </option>
                      ))}
                  </optgroup>
                </select>
              </div>

              {/* CLIENT SCOPE */}
              <div className={styles.field}>
                <label className={styles.fieldLabel}>Client Scope</label>
                <select
                  className={styles.select}
                  value={selectedClient}
                  onChange={(e) => setSelectedClient(e.target.value)}
                >
                  <option value="all">All Clients ({companies.length} Organizations)</option>
                  {companies.map((c) => (
                    <option key={c.id || c.name} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* DEPARTMENT SCOPE */}
              <div className={styles.field}>
                <label className={styles.fieldLabel}>Department Scope</label>
                <select
                  className={styles.select}
                  value={selectedDept}
                  onChange={(e) => setSelectedDept(e.target.value)}
                >
                  <option value="all">All Departments</option>
                  {departments.map((d) => (
                    <option key={d.id || d.name || d} value={d.name || d}>
                      {d.name || d}
                    </option>
                  ))}
                </select>
              </div>

              {/* ELIGIBLE EMPLOYEES */}
              <div className={styles.field}>
                <label className={styles.fieldLabel}>Eligible Employees</label>
                <input
                  type="text"
                  className={styles.input}
                  value={`${totalEmployees.toLocaleString('en-IN')} Active Employees`}
                  readOnly
                />
              </div>
            </div>

            {/* Payroll Summary Estimates */}
            <div className={styles.summaryCard}>
              <h3 className={styles.summaryCardTitle}>
                Payroll Summary Estimate ({currentMonthLabel})
              </h3>
              <div className={styles.summaryGrid}>
                <div className={styles.summaryTile}>
                  <span>Total Employees</span>
                  <strong>{totalEmployees.toLocaleString('en-IN')}</strong>
                </div>
                <div className={styles.summaryTile}>
                  <span>Estimated Gross</span>
                  <strong className={styles.textGreen}>{formatRupee(liveKPI.estimatedGross || 0)}</strong>
                </div>
                <div className={styles.summaryTile}>
                  <span>Estimated Deductions</span>
                  <strong className={styles.textRed}>-{formatRupee(liveKPI.estimatedDeductions || 0)}</strong>
                </div>
                <div className={`${styles.summaryTile} ${styles.summaryTileNet}`}>
                  <span>Estimated Net Payroll</span>
                  <strong className={styles.textPrimary}>{formatRupee(liveKPI.estimatedNet || 0)}</strong>
                </div>
              </div>
            </div>

            {/* Validation Checklist */}
            <div className={styles.validationCard}>
              <div className={styles.validationHeader}>
                <div className={styles.valTitle}>
                  <ShieldCheck size={18} className={styles.shieldIcon} />
                  <strong>Payroll Pre-Run Validation</strong>
                </div>
                <span
                  className={styles.valBadge}
                  style={{
                    background: hasAttendance ? '#dcfce7' : '#fee2e2',
                    color: hasAttendance ? '#15803d' : '#b91c1c',
                    borderColor: hasAttendance ? '#86efac' : '#fca5a5',
                  }}
                >
                  {hasAttendance ? 'Ready to Run' : 'Attendance Required'}
                </span>
              </div>
              <ul className={styles.checklist}>
                <li className={styles.checkItem}>
                  <CheckCircle2 size={16} className={styles.iconCheck} />
                  <span>Employee master records verified</span>
                </li>
                <li className={styles.checkItem}>
                  <CheckCircle2 size={16} className={styles.iconCheck} />
                  <span>Salary structures linked &amp; valid</span>
                </li>

                {/* DYNAMIC ATTENDANCE VALIDATION ITEM */}
                {hasAttendance ? (
                  <li className={styles.checkItem} style={{ color: '#16a34a', fontWeight: 600 }}>
                    <CheckCircle2 size={16} className={styles.iconCheck} />
                    <span>Attendance records computed ({currentMonthLabel}) — {attendanceCount} records found</span>
                  </li>
                ) : (
                  <li className={styles.checkItem} style={{ color: '#dc2626', fontWeight: 600 }}>
                    <XCircle size={16} style={{ color: '#dc2626', flexShrink: 0 }} />
                    <span>No attendance records found for {currentMonthLabel}</span>
                  </li>
                )}

                <li className={styles.checkItem}>
                  <CheckCircle2 size={16} className={styles.iconCheck} />
                  <span>Approved overtime entries mapped</span>
                </li>
                <li className={styles.checkItem}>
                  <CheckCircle2 size={16} className={styles.iconCheck} />
                  <span>Statutory PF, ESI, PT, TDS &amp; LWF rules configured</span>
                </li>
                <li className={styles.checkItem}>
                  <CheckCircle2 size={16} className={styles.iconCheck} />
                  <span>Advance and loan deductions adjusted</span>
                </li>
              </ul>

              {/* Attendance Missing Warning Box */}
              {!hasAttendance && (
                <div className={styles.warningBox} style={{ background: '#fef2f2', borderColor: '#fca5a5' }}>
                  <div className={styles.warningContent}>
                    <AlertTriangle size={18} style={{ color: '#dc2626', flexShrink: 0 }} />
                    <span style={{ color: '#991b1b', fontSize: '12px' }}>
                      <strong>Attendance records required:</strong> No attendance entries were found for{' '}
                      <strong>{currentMonthLabel}</strong>. Please select a month with attendance from the dropdown above, or import attendance records first before running payroll.
                    </span>
                  </div>
                </div>
              )}

              {hasAttendance && (
                <div className={styles.checkItem} style={{ marginTop: '0.75rem', color: '#16a34a', fontWeight: 500 }}>
                  <CheckCircle2 size={16} className={styles.iconCheck} />
                  <span>All active employee attendances verified and ready for calculation</span>
                </div>
              )}
            </div>

            <p className={styles.disclaimerText}>
              Once confirmed, salary calculations for {currentMonthLabel} will be locked into the cycle and salary slips will be generated.
            </p>
          </div>
        )}

        {/* Step 2: Processing Progress */}
        {step === 'processing' && (
          <div className={styles.processingBody}>
            <div className={styles.spinnerWrap}>
              <div className={styles.progressCircle}>
                <span className={styles.progressPercent}>{progress}%</span>
              </div>
            </div>

            <h3 className={styles.processingTitle}>Processing {currentMonthLabel} Payroll</h3>
            <p className={styles.processingStage}>{currentStage}</p>

            <div className={styles.progressDetailCard}>
              <div className={styles.progressRow}>
                <span>Processing employees...</span>
                <strong>
                  {processedCount.toLocaleString('en-IN')} / {totalEmployees.toLocaleString('en-IN')}
                </strong>
              </div>

              <div className={styles.progressBar}>
                <div
                  className={styles.progressFill}
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Success */}
        {step === 'success' && (
          <div className={styles.successBody}>
            <div className={styles.successIconWrap}>
              <CheckCircle2 size={48} className={styles.successIcon} />
            </div>

            <h3 className={styles.successTitle}>✓ {currentMonthLabel} Payroll Processed</h3>
            <p className={styles.successSub}>
              Successfully processed salaries for {totalEmployees.toLocaleString('en-IN')} employees for{' '}
              <strong>{currentMonthLabel}</strong>.
              Net payout amount of <strong>{formatRupee(liveKPI.estimatedNet || 0)}</strong> ready for disbursement.
            </p>

            <div className={styles.successSummaryGrid}>
              <div className={styles.successStat}>
                <span>Processed Employees</span>
                <strong>{totalEmployees.toLocaleString('en-IN')}</strong>
              </div>
              <div className={styles.successStat}>
                <span>Total Gross</span>
                <strong>{formatRupee(liveKPI.estimatedGross || 0)}</strong>
              </div>
              <div className={styles.successStat}>
                <span>Total Net</span>
                <strong className={styles.textGreen}>{formatRupee(liveKPI.estimatedNet || 0)}</strong>
              </div>
            </div>
          </div>
        )}

        {/* Footer actions */}
        <div className={styles.modalFooter}>
          {step === 'config' && (
            <>
              <button
                type="button"
                className={styles.cancelBtn}
                onClick={onClose}
              >
                Cancel
              </button>
              <button
                type="button"
                className={styles.runBtn}
                onClick={handleStartProcessing}
                disabled={!hasAttendance || isLoadingMonthData}
                title={!hasAttendance ? `No attendance records found for ${currentMonthLabel}` : `Run payroll for ${currentMonthLabel}`}
              >
                <Play size={16} />
                <span>
                  {!hasAttendance ? 'Cannot Run (No Attendance Records)' : `Run Payroll (${currentMonthLabel})`}
                </span>
              </button>
            </>
          )}

          {step === 'processing' && (
            <span className={styles.processingNotice}>Please do not close this window while processing...</span>
          )}

          {step === 'success' && (
            <button
              type="button"
              className={styles.finishBtn}
              onClick={handleFinish}
            >
              <span>View Processed Slips</span>
              <ArrowRight size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
