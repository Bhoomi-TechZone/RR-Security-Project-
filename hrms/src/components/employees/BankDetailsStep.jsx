import React, { useMemo } from 'react';
import { Download, HelpCircle, CheckCircle2, Building2, CreditCard, Info } from 'lucide-react';
import { useCompany } from '../../context/CompanyContext';
import { downloadEmployeeProfile } from '../../utils/employeeProfileExport';
import styles from './BankDetailsStep.module.css';

function BankDetailsStep({ data, onChange, errors = {}, banks = [] }) {
  const { activeCompany } = useCompany();

  const handleChange = (field, value) => {
    onChange({ ...data, [field]: value });
  };

  // Derive active banks strictly from dynamic database master records (no hardcoded fallbacks)
  const bankList = useMemo(() => {
    if (banks && banks.length > 0) {
      return banks
        .filter(b => typeof b === 'string' || !b.status || b.status === 'active' || b.name === data.bankName)
        .map(b => (typeof b === 'string' ? b : b.name || b.bankName || b));
    }
    return [];
  }, [banks, data.bankName]);

  // Resolve currently selected bank object strictly from master records
  const selectedBankObj = useMemo(() => {
    if (!data.bankName || !banks || banks.length === 0) return null;
    return banks.find(b => (typeof b === 'object' && (b.name || b.bankName) === data.bankName)) || null;
  }, [banks, data.bankName]);

  // Derive available branches strictly from the selected bank's database branchList
  const availableBranches = useMemo(() => {
    if (selectedBankObj && Array.isArray(selectedBankObj.branchList) && selectedBankObj.branchList.length > 0) {
      return selectedBankObj.branchList.filter(Boolean);
    }
    return [];
  }, [selectedBankObj]);

  const handleBankChange = (newBankName) => {
    const matchedBank = banks.find(b => (typeof b === 'object' && (b.name || b.bankName) === newBankName));
    const firstBranch = matchedBank?.branchList?.[0] || '';
    onChange({
      ...data,
      bankName: newBankName,
      branchName: matchedBank?.branchList?.length > 0
        ? (data.branchName && matchedBank.branchList.includes(data.branchName) ? data.branchName : firstBranch)
        : ''
    });
  };

  const handleDownloadStatement = () => {
    downloadEmployeeProfile(data, activeCompany);
  };

  const maskedAccount = data.accountNumber && String(data.accountNumber).length > 4
    ? `•••• •••• •••• ${String(data.accountNumber).slice(-4)}`
    : (data.accountNumber || '•••• •••• •••• ••••');

  const isBankComplete = Boolean(
    data.bankName &&
    data.accountNumber &&
    data.ifsc &&
    (data.accountHolder || data.name)
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
                  value={data.bankName || ''}
                  onChange={(e) => handleBankChange(e.target.value)}
                >
                  <option value="">
                    {bankList.length > 0 ? 'Select Bank' : 'No active banks found in Masters'}
                  </option>
                  {bankList.map((bName) => (
                    <option key={bName} value={bName}>
                      {bName}
                    </option>
                  ))}
                  {data.bankName && !bankList.includes(data.bankName) && (
                    <option value={data.bankName}>{data.bankName}</option>
                  )}
                </select>
              </div>
            </div>

            {/* Branch Name Dropdown */}
            <div className={styles.formRow}>
              <label htmlFor="bank-branch" className={styles.rowLabel}>
                <span>Branch Name</span>
              </label>
              <div className={styles.rowControl}>
                <select
                  id="bank-branch"
                  className={styles.select}
                  value={data.branchName || ''}
                  onChange={(e) => handleChange('branchName', e.target.value)}
                  disabled={!data.bankName}
                >
                  <option value="">
                    {!data.bankName
                      ? 'Select a Bank first'
                      : availableBranches.length > 0
                      ? 'Select Branch'
                      : 'No branches added for this bank in Masters'}
                  </option>
                  {availableBranches.map((branch) => (
                    <option key={branch} value={branch}>
                      {branch}
                    </option>
                  ))}
                  {data.branchName && !availableBranches.includes(data.branchName) && (
                    <option value={data.branchName}>{data.branchName}</option>
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
                  placeholder="Name as in Bank Account"
                  value={data.accountHolder || ''}
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
                  placeholder="Bank Account Number"
                  value={data.accountNumber || ''}
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
                  placeholder="e.g. SBIN0001234"
                  value={data.ifsc || ''}
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
                  value={data.paymentMode || ''}
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
                  {data.bankName || 'BANK ACCOUNT'}
                </span>
                <div className={styles.bankCardChip} />
              </div>
              <div className={styles.bankCardNumber}>{maskedAccount}</div>
              <div className={styles.bankCardBottom}>
                <div>
                  <div className={styles.bankCardHolderLabel}>ACCOUNT HOLDER</div>
                  <div className={styles.bankCardHolderName}>
                    {data.accountHolder || data.name || 'EMPLOYEE NAME'}
                  </div>
                </div>
                <span className={styles.bankCardMode}>
                  {data.paymentMode || 'Bank Transfer'}
                </span>
              </div>
            </div>

            <div className={styles.summaryList}>
              <div className={styles.summaryRow}>
                <span className={styles.summaryLabel}>Bank Name</span>
                <span className={styles.summaryValue}>{data.bankName || '—'}</span>
              </div>
              <div className={styles.summaryRow}>
                <span className={styles.summaryLabel}>Branch</span>
                <span className={styles.summaryValue}>{data.branchName || '—'}</span>
              </div>
              <div className={styles.summaryRow}>
                <span className={styles.summaryLabel}>IFSC Code</span>
                <span className={styles.summaryValue}>{data.ifsc || '—'}</span>
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
