import React, { useState, useMemo } from 'react';
import {
  PlusCircle,
  Clock,
  Users,
  Search,
  DoorOpen,
  User,
  ThumbsUp,
  AlertTriangle,
  BarChart3,
  TrendingUp,
  Calendar
} from 'lucide-react';
import { calculateSeparationAnalytics } from '../../data/fnfData';
import styles from './SeparationDashboard.module.css';

export default function SeparationDashboard({
  records = [],
  onAddNewExit,
  onFilterPending,
  onFilterFinalized,
  basePath = '/admin/payroll'
}) {
  // Date range filter state (defaults matching Screenshot: 08/03/2026 to 11/11/2026 = 100 days)
  const [dateFrom, setDateFrom] = useState('2026-08-03');
  const [dateTo, setDateTo] = useState('2026-11-11');
  const [appliedDateFrom, setAppliedDateFrom] = useState('2026-08-03');
  const [appliedDateTo, setAppliedDateTo] = useState('2026-11-11');

  // Analytics calculation
  const analytics = useMemo(() => {
    return calculateSeparationAnalytics(records, appliedDateFrom, appliedDateTo);
  }, [records, appliedDateFrom, appliedDateTo]);

  // Dynamic Y-axis scaling for Date-wise Exits graph
  const { maxY, yAxisTicks } = useMemo(() => {
    const pts = analytics.dateWisePoints || [];
    const maxVal = pts.reduce((max, p) => Math.max(max, p.count), 0);
    const top = Math.max(1, maxVal);
    let ticks = [top, 0];
    if (top === 2) ticks = [2, 1, 0];
    else if (top === 3) ticks = [3, 2, 1, 0];
    else if (top > 3) ticks = [top, Math.round(top / 2), 0];
    return { maxY: top, yAxisTicks: ticks };
  }, [analytics.dateWisePoints]);

  const handleSearch = (e) => {
    if (e) e.preventDefault();
    setAppliedDateFrom(dateFrom);
    setAppliedDateTo(dateTo);
  };

  return (
    <div className={styles.dashboardWrapper}>
      {/* 1. Header with Title and 4 Pill Action Buttons */}
      <div className={styles.headerRow}>
        <div className={styles.titleGroup}>
          <h2 className={styles.title}>Separation Dashboard</h2>
          <p className={styles.subtitle}>Analyze employee exits and separation trends.</p>
        </div>

        <div className={styles.actionButtons}>
          <button
            type="button"
            className={`${styles.actionBtn} ${styles.addBtn}`}
            onClick={onAddNewExit}
            title="Initiate new employee exit / separation"
          >
            <PlusCircle size={15} />
            <span>Add New Exit</span>
          </button>

          <button
            type="button"
            className={`${styles.actionBtn} ${styles.pendingBtn}`}
            onClick={onFilterPending}
            title="View pending exits awaiting clearance or approval"
          >
            <Clock size={15} />
            <span>Pending Exits</span>
          </button>

          <button
            type="button"
            className={`${styles.actionBtn} ${styles.finalizedBtn}`}
            onClick={onFilterFinalized}
            title="View finalized and settled separation records"
          >
            <Users size={15} />
            <span>Finalized Exits</span>
          </button>
        </div>
      </div>

      {/* 2. Date Range Filter Bar */}
      <div className={styles.filterRow}>
        <form className={styles.filterInputs} onSubmit={handleSearch}>
          <div className={styles.inputGroup}>
            <label className={styles.inputLabel}>Date From</label>
            <input
              type="date"
              className={styles.dateInput}
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.inputLabel}>Date To</label>
            <input
              type="date"
              className={styles.dateInput}
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>

          <button type="submit" className={styles.searchBtn} title="Apply date filter">
            <Search size={14} />
            <span>Search</span>
          </button>
        </form>
      </div>

      {/* 3. 4 Top Metric Cards (Screenshot 1) */}
      <div className={styles.metricsGrid}>
        {/* Card 1: Total Exits */}
        <div className={styles.metricCard}>
          <div className={`${styles.iconBox} ${styles.tealIcon}`}>
            <DoorOpen size={22} />
          </div>
          <div className={styles.metricContent}>
            <span className={styles.metricLabel}>Total Exits</span>
            <span className={styles.metricValue}>{analytics.totalExits}</span>
            <div className={styles.metricSubtext}>
              {analytics.totalExits === 0 ? 'No exits' : `${analytics.totalExits} exit(s) recorded`}
            </div>
          </div>
        </div>

        {/* Card 2: Avg Tenure */}
        <div className={styles.metricCard}>
          <div className={`${styles.iconBox} ${styles.blueIcon}`}>
            <User size={22} />
          </div>
          <div className={styles.metricContent}>
            <span className={styles.metricLabel}>Avg Tenure</span>
            <span className={styles.metricValue}>
              {analytics.avgTenure} {analytics.avgTenure === 1 ? 'year' : 'years'}
            </span>
            <div className={styles.progressBarTrack}>
              <div
                className={styles.progressBarFill}
                style={{ width: `${analytics.avgTenurePct}%` }}
              />
            </div>
          </div>
        </div>

        {/* Card 3: Retention Attempts */}
        <div className={styles.metricCard}>
          <div className={`${styles.iconBox} ${styles.purpleIcon}`}>
            <ThumbsUp size={22} />
          </div>
          <div className={styles.metricContent}>
            <span className={styles.metricLabel}>Retention Attempts</span>
            <span className={styles.metricValue}>{analytics.retentionAttemptsPct}%</span>
            <div className={styles.metricSubtext}>
              <span className={styles.retainedBadge}>
                ✔ {analytics.retainedCount} retained
              </span>
              <span className={styles.exitedBadge}>
                ✖ {analytics.exitedCount} exited
              </span>
            </div>
          </div>
        </div>

        {/* Card 4: Pre-Confirmation */}
        <div className={styles.metricCard}>
          <div className={`${styles.iconBox} ${styles.peachIcon}`}>
            <AlertTriangle size={22} />
          </div>
          <div className={styles.metricContent}>
            <span className={styles.metricLabel}>Pre-Confirmation</span>
            <span className={styles.metricValue}>{analytics.preConfirmationCount}</span>
            <div className={styles.metricSubtext}>
              <span className={styles.warningBadge}>
                ⚠ {analytics.preConfirmationPct}% of exits
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Middle 2-Panel Section (Screenshot 1) */}
      <div className={styles.chartsGrid}>
        {/* Left Panel: Top Exit Reasons */}
        <div className={styles.panelCard}>
          <div className={styles.panelHeader}>
            <Clock size={16} color="#64748b" />
            <h3 className={styles.panelTitle}>Top Exit Reasons</h3>
          </div>
          <div className={styles.panelBody}>
            {analytics.topExitReasons.length > 0 ? (
              <div className={styles.reasonsList}>
                {analytics.topExitReasons.slice(0, 5).map((item, idx) => (
                  <div key={idx} className={styles.reasonItem}>
                    <div className={styles.reasonHeader}>
                      <span className={styles.reasonName}>{item.reason}</span>
                      <span className={styles.reasonStats}>
                        {item.count} ({item.percentage}%)
                      </span>
                    </div>
                    <div className={styles.reasonBarTrack}>
                      <div
                        className={styles.reasonBarFill}
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className={styles.emptyVisual}>
                <span>No exit reasons recorded in this date range.</span>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel: Employee Exits (Date Wise) */}
        <div className={styles.panelCard}>
          <div className={styles.panelHeader}>
            <BarChart3 size={16} color="#64748b" />
            <h3 className={styles.panelTitle}>Employee Exits (Date Wise)</h3>
          </div>
          <div className={styles.panelBody}>
            <div className={styles.chartWrapper}>
              {/* Y-axis Ticks Column */}
              <div className={styles.yAxisCol}>
                {yAxisTicks.map((val) => (
                  <span key={val} className={styles.yTick}>{val}</span>
                ))}
              </div>

              {/* Chart Plot Area */}
              <div className={styles.chartPlotArea}>
                {/* Horizontal Gridlines */}
                <div className={styles.gridLines}>
                  {yAxisTicks.map((val, i) => (
                    <div key={i} className={styles.gridLine} />
                  ))}
                </div>

                {/* Bars & Date Ticks */}
                <div className={styles.columnsWrapper}>
                  {analytics.dateWisePoints.map((pt, idx) => {
                    // Maximum bar height capped at 80% so it has breathing space below the top border
                    const barHeightPct = maxY > 0 && pt.count > 0 
                      ? Math.round((pt.count / maxY) * 80)
                      : 0;

                    return (
                      <div key={idx} className={styles.dateColumn}>
                        {pt.count > 0 && (
                          <div
                            className={styles.barElement}
                            style={{ height: `${barHeightPct}%` }}
                          >
                            <span className={styles.barTooltip}>
                              {pt.label}: {pt.count} exit{pt.count > 1 ? 's' : ''}
                            </span>
                          </div>
                        )}
                        <span className={styles.dateTickLabel}>{pt.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Tenure Analysis Panel (Screenshot 2) */}
      <div className={styles.tenureCard}>
        <div className={styles.panelHeader}>
          <TrendingUp size={16} color="#64748b" />
          <h3 className={styles.panelTitle}>Tenure Analysis</h3>
        </div>
        <div className={styles.tenureBody}>
          <div className={styles.tenureGrid}>
            {/* Box 1: Below 6 Months */}
            <div className={`${styles.tenureItemBox} ${styles.redZone}`}>
              <div className={styles.tenureCount}>{analytics.tenureBuckets.below6Months}</div>
              <div className={styles.tenureTitle}>Below 6 Months</div>
              <div className={styles.tenureDesc}>Onboarding or role mismatch</div>
              <div className={styles.tenureBadge}>High risk zone</div>
            </div>

            {/* Box 2: 6-24 Months */}
            <div className={`${styles.tenureItemBox} ${styles.orangeZone}`}>
              <div className={styles.tenureCount}>{analytics.tenureBuckets.months6To24}</div>
              <div className={styles.tenureTitle}>6–24 Months</div>
              <div className={styles.tenureDesc}>Employees leaving after settling in</div>
              <div className={styles.tenureBadge}>Engagement gap</div>
            </div>

            {/* Box 3: 2-5 Years */}
            <div className={`${styles.tenureItemBox} ${styles.purpleZone}`}>
              <div className={styles.tenureCount}>{analytics.tenureBuckets.years2To5}</div>
              <div className={styles.tenureTitle}>2–5 Years</div>
              <div className={styles.tenureDesc}>Mid-level experience loss</div>
              <div className={styles.tenureBadge}>Career growth concern</div>
            </div>

            {/* Box 4: 5+ Years */}
            <div className={`${styles.tenureItemBox} ${styles.greenZone}`}>
              <div className={styles.tenureCount}>{analytics.tenureBuckets.above5Years}</div>
              <div className={styles.tenureTitle}>5+ Years</div>
              <div className={styles.tenureDesc}>Senior or long-term employee exit</div>
              <div className={styles.tenureBadge}>Knowledge impact</div>
            </div>
          </div>

          {/* Right Legend */}
          <div className={styles.tenureLegend}>
            <div className={styles.legendItem}>
              <span className={`${styles.legendDot} ${styles.dotRed}`} />
              <span>Below 6 Months</span>
            </div>
            <div className={styles.legendItem}>
              <span className={`${styles.legendDot} ${styles.dotYellow}`} />
              <span>6–24 Months</span>
            </div>
            <div className={styles.legendItem}>
              <span className={`${styles.legendDot} ${styles.dotBlue}`} />
              <span>2–5 Years</span>
            </div>
            <div className={styles.legendItem}>
              <span className={`${styles.legendDot} ${styles.dotGreen}`} />
              <span>5+ Years</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

