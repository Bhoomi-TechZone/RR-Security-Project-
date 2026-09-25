import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, AlertTriangle, Play, Sparkles, ShieldCheck, ArrowRight } from 'lucide-react';
import { formatRupee } from '../../utils/payrollUtils';
import styles from './RunPayrollModal.module.css';

export default function RunPayrollModal({
  isOpen,
  onClose,
  selectedMonth = '2026-08',
  monthLabel = 'August 2026',
  companies = [],
  departments = [],
  onComplete,
  onViewIssues
}) {
  const [step, setStep] = useState('config'); // 'config' | 'processing' | 'success'
  const [selectedClient, setSelectedClient] = useState('all');
  const [selectedDept, setSelectedDept] = useState('all');
  const [progress, setProgress] = useState(0);
  const [processedCount, setProcessedCount] = useState(0);
  const [currentStage, setCurrentStage] = useState('');
  const totalEmployees = 1250;

  // Reset state when opening modal
  useEffect(() => {
    if (isOpen) {
      setStep('config');
      setProgress(0);
      setProcessedCount(0);
      setCurrentStage('Initializing payroll engine...');
    }
  }, [isOpen]);

  // Simulate progress when step is processing
  useEffect(() => {
    if (step !== 'processing') return;

    const stages = [
      'Validating employee records & bank details...',
      'Calculating attendance and payable days...',
      'Calculating approved overtime hours & rates...',
      'Applying active advance & loan adjustments...',
      'Applying statutory PF & ESI deductions...',
      'Generating net salary ledgers & slips...'
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
  }, [step]);

  if (!isOpen) return null;

  const handleStartProcessing = () => {
    setStep('processing');
  };

  const handleFinish = () => {
    onComplete();
    onClose();
  };

  return (
    <div className={styles.modalOverlay} role="dialog" aria-modal="true">
      <div className={styles.modalCard}>
        {/* Header */}
        <div className={styles.modalHeader}>
          <div className={styles.headerTitleWrap}>
            <Sparkles size={20} className={styles.sparkleIcon} />
            <div>
              <h2>Run Payroll</h2>
              <span className={styles.monthBadge}>{monthLabel}</span>
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
              <div className={styles.field}>
                <label className={styles.fieldLabel}>Payroll Month</label>
                <input
                  type="text"
                  className={styles.input}
                  value={monthLabel}
                  readOnly
                />
              </div>

              <div className={styles.field}>
                <label className={styles.fieldLabel}>Client Scope</label>
                <select
                  className={styles.select}
                  value={selectedClient}
                  onChange={(e) => setSelectedClient(e.target.value)}
                >
                  <option value="all">All Clients (5 Organizations)</option>
                  {companies.map((c) => (
                    <option key={c.id || c.name} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

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
              <h3 className={styles.summaryCardTitle}>Payroll Summary Estimate</h3>
              <div className={styles.summaryGrid}>
                <div className={styles.summaryTile}>
                  <span>Total Employees</span>
                  <strong>{totalEmployees.toLocaleString('en-IN')}</strong>
                </div>
                <div className={styles.summaryTile}>
                  <span>Estimated Gross</span>
                  <strong className={styles.textGreen}>{formatRupee(52000000)}</strong>
                </div>
                <div className={styles.summaryTile}>
                  <span>Estimated Deductions</span>
                  <strong className={styles.textRed}>-{formatRupee(3750000)}</strong>
                </div>
                <div className={`${styles.summaryTile} ${styles.summaryTileNet}`}>
                  <span>Estimated Net Payroll</span>
                  <strong className={styles.textPrimary}>{formatRupee(48250000)}</strong>
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
                <span className={styles.valBadge}>Ready with Warnings</span>
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
                <li className={styles.checkItem}>
                  <CheckCircle2 size={16} className={styles.iconCheck} />
                  <span>Attendance records computed (31 Days)</span>
                </li>
                <li className={styles.checkItem}>
                  <CheckCircle2 size={16} className={styles.iconCheck} />
                  <span>Approved overtime entries mapped</span>
                </li>
                <li className={styles.checkItem}>
                  <CheckCircle2 size={16} className={styles.iconCheck} />
                  <span>Advance and loan deductions adjusted</span>
                </li>
              </ul>

              {/* Warning Item */}
              <div className={styles.warningBox}>
                <div className={styles.warningContent}>
                  <AlertTriangle size={16} className={styles.iconWarning} />
                  <span>2 records require attention (Missing attendance reported)</span>
                </div>
                <button
                  type="button"
                  className={styles.viewIssuesBtn}
                  onClick={() => {
                    onClose();
                    onViewIssues();
                  }}
                >
                  View Issues
                </button>
              </div>
            </div>

            <p className={styles.disclaimerText}>
              Once confirmed, salary calculations will be locked into the cycle and salary slips will be generated.
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

            <h3 className={styles.processingTitle}>Processing {monthLabel} Payroll</h3>
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

            <h3 className={styles.successTitle}>✓ {monthLabel} Payroll Processed</h3>
            <p className={styles.successSub}>
              Successfully processed salaries for {totalEmployees.toLocaleString('en-IN')} employees.
              Net payout amount of <strong>{formatRupee(48250000)}</strong> ready for disbursement.
            </p>

            <div className={styles.successSummaryGrid}>
              <div className={styles.successStat}>
                <span>Processed Employees</span>
                <strong>{totalEmployees.toLocaleString('en-IN')}</strong>
              </div>
              <div className={styles.successStat}>
                <span>Total Gross</span>
                <strong>{formatRupee(52000000)}</strong>
              </div>
              <div className={styles.successStat}>
                <span>Total Net</span>
                <strong className={styles.textGreen}>{formatRupee(48250000)}</strong>
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
              >
                <Play size={16} />
                <span>Run Payroll</span>
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
