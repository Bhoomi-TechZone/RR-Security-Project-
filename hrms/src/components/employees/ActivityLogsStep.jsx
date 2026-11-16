import React from 'react';
import styles from './EmployeeFormSteps.module.css';

function ActivityLogsStep() {
  return (
    <div className={styles.stepContainer} style={{ minHeight: 180, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: 14 }}>
        {/* Currently shows nothing as requested */}
      </div>
    </div>
  );
}

export default ActivityLogsStep;
