import React, { useMemo } from 'react';
import styles from './EmployeeFormSteps.module.css';

function BankDetailsStep({ data, onChange, errors, banks = [] }) {
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

  return (
    <div className={styles.stepContainer}>
      <div className={styles.threeColumnGrid}>
        {/* Bank Name Dropdown */}
        <div className={styles.fieldGroup}>
          <label htmlFor="bank-name" className={styles.label}>Bank Name</label>
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

        {/* Branch Name Dropdown */}
        <div className={styles.fieldGroup}>
          <label htmlFor="bank-branch" className={styles.label}>Branch Name</label>
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

        {/* Account Holder Name */}
        <div className={styles.fieldGroup}>
          <label htmlFor="bank-holder" className={styles.label}>Account Holder Name</label>
          <input
            id="bank-holder"
            type="text"
            className={styles.input}
            placeholder="Name as in Bank Account"
            value={data.accountHolder || ''}
            onChange={(e) => handleChange('accountHolder', e.target.value)}
          />
        </div>

        {/* Account Number */}
        <div className={styles.fieldGroup}>
          <label htmlFor="bank-account" className={styles.label}>Account Number</label>
          <input
            id="bank-account"
            type="text"
            className={styles.input}
            placeholder="Bank Account Number"
            value={data.accountNumber || ''}
            onChange={(e) => handleChange('accountNumber', e.target.value)}
          />
        </div>

        {/* IFSC Code */}
        <div className={styles.fieldGroup}>
          <label htmlFor="bank-ifsc" className={styles.label}>IFSC Code</label>
          <input
            id="bank-ifsc"
            type="text"
            className={styles.input}
            placeholder="e.g. SBIN0001234"
            value={data.ifsc || ''}
            onChange={(e) => handleChange('ifsc', e.target.value.toUpperCase())}
          />
        </div>

        {/* Payment Mode */}
        <div className={styles.fieldGroup}>
          <label htmlFor="bank-payment" className={styles.label}>Payment Mode</label>
          <select
            id="bank-payment"
            className={styles.select}
            value={data.paymentMode || ''}
            onChange={(e) => handleChange('paymentMode', e.target.value)}
          >
            <option value="">Select</option>
            <option value="Bank Transfer">Bank Transfer</option>
            <option value="Cash">Cash</option>
            <option value="Cheque">Cheque</option>
            <option value="UPI / NEFT">UPI / NEFT</option>
          </select>
        </div>
      </div>
    </div>
  );
}

export default BankDetailsStep;
