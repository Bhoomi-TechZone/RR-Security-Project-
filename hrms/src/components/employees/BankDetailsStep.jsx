import React, { useMemo } from 'react';
import { Download, HelpCircle, CheckCircle2, Building2, CreditCard, Info } from 'lucide-react';
import { useCompany } from '../../context/CompanyContext';
import { downloadEmployeeProfile } from '../../utils/employeeProfileExport';
import styles from './BankDetailsStep.module.css';

function BankDetailsStep({ data = {}, onChange, errors = {}, banks = [] }) {
  const { activeCompany } = useCompany();
  const safeData = data || {};

  const handleChange = (field, value) => {
    onChange({ ...safeData, [field]: value });
  };

  // Derive active banks strictly from dynamic database master records (no hardcoded fallbacks), deduplicated
  const bankList = useMemo(() => {
    if (banks && banks.length > 0) {
      const names = banks
        .filter(b => typeof b === 'string' || !b.status || b.status === 'active' || (safeData.bankName && b.name === safeData.bankName))
        .map(b => (typeof b === 'string' ? b : b.name || b.bankName || b))
        .filter(Boolean);
      return Array.from(new Set(names));
    }
    return [];
  }, [banks, safeData.bankName]);

  // Resolve currently selected bank object strictly from master records
  const selectedBankObj = useMemo(() => {
    if (!safeData.bankName || !banks || banks.length === 0) return null;
    return banks.find(b => (typeof b === 'object' && (b.name || b.bankName) === safeData.bankName)) || null;
  }, [banks, safeData.bankName]);

  // Derive available branches strictly from the selected bank's database branchList
  const availableBranches = useMemo(() => {
    if (selectedBankObj && Array.isArray(selectedBankObj.branchList) && selectedBankObj.branchList.length > 0) {
      return selectedBankObj.branchList.filter(Boolean);
    }
    return [];
  }, [selectedBankObj]);

  const handleBankChange = (newBankName) => {
    onChange({
      ...safeData,
      bankName: newBankName
    });
  };

  const handleDownloadStatement = () => {
    downloadEmployeeProfile(safeData, activeCompany);
  };

  const maskedAccount = safeData.accountNumber && String(safeData.accountNumber).length > 4
    ? `•••• •••• •••• ${String(safeData.accountNumber).slice(-4)}`
    : (safeData.accountNumber || '•••• •••• •••• ••••');

  const isBankComplete = Boolean(
    safeData.bankName &&
    safeData.accountNumber &&
    safeData.ifsc &&
    (safeData.accountHolder || safeData.name)
  );

  return (
    <div className={styles.wrapper}>
      {/* ========================================================
          1. SECTION HEADER (TITLE & ACTION BUTTONS)
         ======================================================== */}
      <div className={styles.headerBar}>
        <div>
          <h3 className={styles.headerTitle}>Bank Details</h3>
          <p className={styles.headerSubtitle}>Manage salary disbursement bank account, branch, IFSC and payment mode.</p>
        </div>
        <div className={styles.headerActions}>
          <button
            type="button"
            className={styles.statementBtn}
            onClick={handleDownloadStatement}
            title="Download employee profile statement"
          >
            <Download size={13} />
            <span>Statement</span>
          </button>
          <button
            type="button"
            className={styles.helpBtn}
            onClick={() => window.open('https://help.example.com', '_blank')}
            title="View bank details help documentation"
          >
            <HelpCircle size={13} />
            <span>Read Help</span>
          </button>
        </div>
      </div>

      {/* ========================================================
          2. TWO-COLUMN LAYOUT (FORM ON LEFT, SIDEBAR CARDS ON RIGHT)
         ======================================================== */}
      <div className={styles.mainLayout}>
        {/* Left Form Column */}
        <div className={styles.mainForm}>
          {/* Section: Bank Account Information */}
          <div className={styles.sectionGroup}>
            <h4 className={styles.sectionTitle}>Account Details</h4>

            {/* Bank Name Dropdown */}
            <div className={styles.formRow}>
              <label htmlFor="bank-name" className={styles.rowLabel}>
                <span>Bank Name</span>
                <span className={styles.requiredStar}>*</span>
              </label>
              <div className={styles.rowControl}>
                <select
                  id="bank-name"
                  className={styles.select}
                  value={safeData.bankName || ''}
                  onChange={(e) => handleBankChange(e.target.value)}
                >
                  <option value="">
                    {bankList.length > 0 ? 'Select Bank' : 'No active banks found in Masters'}
                  </option>
                  {bankList.map((bName, idx) => (
                    <option key={`${bName}-${idx}`} value={bName}>
                      {bName}
                    </option>
                  ))}
                  {safeData.bankName && !bankList.includes(safeData.bankName) && (
                    <option key={`custom-${safeData.bankName}`} value={safeData.bankName}>{safeData.bankName}</option>
                  )}
                </select>
              </div>
            </div>

            {/* Account Holder Name */}
            <div className={styles.formRow}>
              <label htmlFor="bank-holder" className={styles.rowLabel}>
                <span>Account Holder</span>
                <span className={styles.requiredStar}>*</span>
              </label>
              <div className={styles.rowControl}>
                <input
                  id="bank-holder"
                  type="text"
                  className={styles.input}
                  placeholder="Enter Account Holder Name"
                  value={safeData.accountHolder || ''}
                  onChange={(e) => handleChange('accountHolder', e.target.value)}
                />
              </div>
            </div>

            {/* Account Number */}
            <div className={styles.formRow}>
              <label htmlFor="bank-account" className={styles.rowLabel}>
                <span>Account Number</span>
                <span className={styles.requiredStar}>*</span>
              </label>
              <div className={styles.rowControl}>
                <input
                  id="bank-account"
                  type="text"
                  className={styles.input}
                  placeholder="Enter Account Number"
                  value={safeData.accountNumber || ''}
                  onChange={(e) => handleChange('accountNumber', e.target.value)}
                />
              </div>
            </div>

            {/* IFSC Code */}
            <div className={styles.formRow}>
              <label htmlFor="bank-ifsc" className={styles.rowLabel}>
                <span>IFSC Code</span>
                <span className={styles.requiredStar}>*</span>
              </label>
              <div className={styles.rowControl}>
                <input
                  id="bank-ifsc"
                  type="text"
                  className={styles.input}
                  placeholder="Enter IFSC Code"
                  value={safeData.ifsc || ''}
                  onChange={(e) => handleChange('ifsc', e.target.value.toUpperCase())}
                />
              </div>
            </div>

            {/* Payment Mode */}
            <div className={styles.formRow}>
              <label htmlFor="bank-payment" className={styles.rowLabel}>
                <span>Payment Mode</span>
              </label>
              <div className={styles.rowControl}>
                <select
                  id="bank-payment"
                  className={styles.select}
                  value={safeData.paymentMode || ''}
                  onChange={(e) => handleChange('paymentMode', e.target.value)}
                >
                  <option value="">Select Mode</option>
                  <option value="Bank Transfer">Bank Transfer (NEFT/RTGS/IMPS)</option>
                  <option value="UPI / NEFT">UPI / Direct Transfer</option>
                  <option value="Cheque">Cheque</option>
                  <option value="Cash">Cash</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar Cards */}
        <aside className={styles.rightSidebar}>
          {/* Card 1: Virtual Card Preview */}
          <div className={styles.sideCard}>
            <div className={styles.sideCardHeader}>
              <div>
                <h4 className={styles.sideCardTitle}>Salary Bank Account</h4>
                <div className={styles.sideCardSubtitle}>Disbursement account preview</div>
              </div>
              <CreditCard size={18} color="#2563eb" />
            </div>

            <div className={styles.bankCardPreview}>
              <div className={styles.bankCardTop}>
                <span className={styles.bankCardBankName}>
                  {safeData.bankName || 'BANK ACCOUNT'}
                </span>
                <div className={styles.bankCardChip} />
              </div>
              <div className={styles.bankCardNumber}>{maskedAccount}</div>
              <div className={styles.bankCardBottom}>
                <div>
                  <div className={styles.bankCardHolderLabel}>ACCOUNT HOLDER</div>
                  <div className={styles.bankCardHolderName}>
                    {safeData.accountHolder || safeData.name || 'EMPLOYEE NAME'}
                  </div>
                </div>
                <span className={styles.bankCardMode}>
                  {safeData.paymentMode || 'Bank Transfer'}
                </span>
              </div>
            </div>

            <div className={styles.summaryList}>
              <div className={styles.summaryRow}>
                <span className={styles.summaryLabel}>Bank Name</span>
                <span className={styles.summaryValue}>{safeData.bankName || '—'}</span>
              </div>
              {safeData.branchName && (
                <div className={styles.summaryRow}>
                  <span className={styles.summaryLabel}>Branch</span>
                  <span className={styles.summaryValue}>{safeData.branchName}</span>
                </div>
              )}
              <div className={styles.summaryRow}>
                <span className={styles.summaryLabel}>IFSC Code</span>
                <span className={styles.summaryValue}>{safeData.ifsc || '—'}</span>
              </div>
              <div className={styles.summaryRow}>
                <span className={styles.summaryLabel}>Status</span>
                {isBankComplete ? (
                  <span className={styles.badgeVerified}>
                    <CheckCircle2 size={11} />
                    <span>Complete</span>
                  </span>
                ) : (
                  <span className={styles.badgePending}>Pending Details</span>
                )}
              </div>
            </div>
          </div>

          {/* Card 2: Notice Card */}
          <div className={styles.noticeCard}>
            <Info size={16} className={styles.noticeIcon} />
            <span>
              Direct bank transfers require a valid IFSC and matching account holder name to prevent salary return or rejection during bulk NEFT disbursement.
            </span>
          </div>
        </aside>
      </div>
    </div>
  );
}

export default BankDetailsStep;
