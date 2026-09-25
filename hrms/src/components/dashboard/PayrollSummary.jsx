import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import styles from './PayrollSummary.module.css';

/**
 * PayrollSummary Component
 * Displays financial workforce details, net pay computations, and progress summaries.
 * Shows overall payroll data and client-wise breakdown with selector.
 * Supports skeleton loading state.
 */
function PayrollSummary({ overallData, clientWiseData, loading }) {
  const [selectedClientId, setSelectedClientId] = useState(
    clientWiseData && clientWiseData.length > 0 ? clientWiseData[0].id : null
  );

  const selectedClientData = clientWiseData?.find(c => c.id === selectedClientId);

  const renderCard = (data, isClientCard = false) => {
    if (!data) return null;

    return (
      <div className={styles.card} key={data.id || 'overall'}>
        {/* Header section with monthly badge */}
        <div className={styles.header}>
          <h3 className={styles.title}>
            {isClientCard ? `${data.clientName} - Payroll` : 'Complete Payroll Summary'}
          </h3>
          <span className={styles.monthBadge}>{data.month}</span>
        </div>

        {/* Grid containing accounts info */}
        <div className={styles.grid}>
          <div className={styles.statGroup}>
            <span className={styles.label}>Gross Salary</span>
            <span className={styles.value}>{data.grossSalary}</span>
          </div>
          
          <div className={styles.statGroup}>
            <span className={styles.label}>Deductions</span>
            <span className={`${styles.value} ${styles.deductionValue}`}>{data.deductions}</span>
          </div>

          <div className={styles.statGroup}>
            <span className={styles.label}>Net Payable</span>
            <span className={`${styles.value} ${styles.netValue}`}>{data.netPayable}</span>
          </div>
        </div>

        {/* Progress tracker section */}
        <div className={styles.progressSection}>
          <div className={styles.progressInfo}>
            <span className={styles.progressLabel}>Processed Payments</span>
            <span className={styles.progressCounts}>
              <strong>{data.processedCount.toLocaleString()}</strong> / {data.totalCount.toLocaleString()} employees
            </span>
          </div>

          {/* Bar layout */}
          <div className={styles.progressBarWrapper}>
            <div 
              className={styles.progressBar}
              style={{ width: `${data.percentage}%` }}
              role="progressbar"
              aria-valuenow={data.percentage}
              aria-valuemin="0"
              aria-valuemax="100"
              aria-label="Processed payroll percentage"
            />
            <span className={styles.progressPct}>{data.percentage}%</span>
          </div>
        </div>
      </div>
    );
  };

  const renderLoadingCard = () => (
    <div className={styles.card}>
      <div className={styles.header}>
        <div className={`${styles.skeleton} ${styles.skeletonTitle}`} style={{ width: '130px' }} />
        <div className={`${styles.skeleton} ${styles.skeletonBadge}`} style={{ width: '100px' }} />
      </div>

      <div className={styles.grid}>
        {[1, 2, 3].map((idx) => (
          <div key={idx} className={styles.statGroup}>
            <div className={`${styles.skeleton} ${styles.skeletonLabel}`} style={{ width: '80px' }} />
            <div className={`${styles.skeleton} ${styles.skeletonVal}`} style={{ width: '120px' }} />
          </div>
        ))}
      </div>

      <div className={styles.progressContainer}>
        <div className={styles.progressHeader}>
          <div className={`${styles.skeleton} ${styles.skeletonLabel}`} style={{ width: '60px' }} />
          <div className={`${styles.skeleton} ${styles.skeletonLabel}`} style={{ width: '40px' }} />
        </div>
        <div className={`${styles.skeleton} ${styles.skeletonBar}`} />
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className={styles.container}>
        {renderLoadingCard()}
        {renderLoadingCard()}
      </div>
    );
  }

  if (!overallData) {
    return (
      <div className={styles.card}>
        <h3 className={styles.title}>Payroll Summary</h3>
        <div className={styles.emptyState}>
          <p className={styles.emptyText}>No payroll summary data available.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Overall Payroll Card */}
      {renderCard(overallData, false)}

      {/* Client-wise Payroll Card with Selector */}
      {clientWiseData && clientWiseData.length > 0 && (
        <div className={styles.card}>
          {/* Header with Client Selector Dropdown */}
          <div className={styles.header}>
            <div className={styles.selectorWrapper}>
              <label htmlFor="client-select" className={styles.selectorLabel}>Select Client:</label>
              <div className={styles.selectContainer}>
                <select
                  id="client-select"
                  className={styles.clientSelect}
                  value={selectedClientId}
                  onChange={(e) => setSelectedClientId(e.target.value)}
                >
                  {clientWiseData.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.clientName}
                    </option>
                  ))}
                </select>
                <ChevronDown size={16} className={styles.selectIcon} />
              </div>
            </div>
            <span className={styles.monthBadge}>{selectedClientData?.month}</span>
          </div>

          {/* Grid containing accounts info */}
          {selectedClientData && (
            <>
              <div className={styles.grid}>
                <div className={styles.statGroup}>
                  <span className={styles.label}>Gross Salary</span>
                  <span className={styles.value}>{selectedClientData.grossSalary}</span>
                </div>
                
                <div className={styles.statGroup}>
                  <span className={styles.label}>Deductions</span>
                  <span className={`${styles.value} ${styles.deductionValue}`}>{selectedClientData.deductions}</span>
                </div>

                <div className={styles.statGroup}>
                  <span className={styles.label}>Net Payable</span>
                  <span className={`${styles.value} ${styles.netValue}`}>{selectedClientData.netPayable}</span>
                </div>
              </div>

              {/* Progress tracker section */}
              <div className={styles.progressSection}>
                <div className={styles.progressInfo}>
                  <span className={styles.progressLabel}>Processed Payments</span>
                  <span className={styles.progressCounts}>
                    <strong>{selectedClientData.processedCount.toLocaleString()}</strong> / {selectedClientData.totalCount.toLocaleString()} employees
                  </span>
                </div>

                {/* Bar layout */}
                <div className={styles.progressBarWrapper}>
                  <div 
                    className={styles.progressBar}
                    style={{ width: `${selectedClientData.percentage}%` }}
                    role="progressbar"
                    aria-valuenow={selectedClientData.percentage}
                    aria-valuemin="0"
                    aria-valuemax="100"
                    aria-label="Processed payroll percentage"
                  />
                  <span className={styles.progressPct}>{selectedClientData.percentage}%</span>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default PayrollSummary;
