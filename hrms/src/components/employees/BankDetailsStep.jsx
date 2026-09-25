import React from 'react';
import styles from './EmployeeFormSteps.module.css';

function BankDetailsStep({ data, onChange, errors }) {
  const handleChange = (field, value) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <div className={styles.stepContainer}>
      <div className={styles.threeColumnGrid}>
        {/* Bank Name */}
        <div className={styles.fieldGroup}>
          <label htmlFor="bank-name" className={styles.label}>Bank Name</label>
          <input
            id="bank-name"
            type="text"
            className={styles.input}
            placeholder="e.g. State Bank of India"
            value={data.bankName || ''}
            onChange={(e) => handleChange('bankName', e.target.value)}
          />
        </div>

        {/* Branch Name */}
        <div className={styles.fieldGroup}>
          <label htmlFor="bank-branch" className={styles.label}>Branch Name</label>
          <input
            id="bank-branch"
            type="text"
            className={styles.input}
            placeholder="e.g. Connaught Place"
            value={data.branchName || ''}
            onChange={(e) => handleChange('branchName', e.target.value)}
          />
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
          </select>
        </div>
      </div>
    </div>
  );
}

export default BankDetailsStep;
