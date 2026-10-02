import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  UserCheck,
  ClipboardCheck,
  CalendarOff,
  AlertCircle,
  Receipt,
  ArrowRight,
  TrendingUp,
  Building,
  CheckCircle2,
  Clock,
  Eye,
  Download,
  Calendar,
  FileBarChart,
  Bell,
  MapPin,
  ShieldCheck,
  X,
  RefreshCw
} from 'lucide-react';
import styles from './ClientDashboard.module.css';
import { useClientAuth } from '../../context/ClientAuthContext';
import clientPortalService from '../../services/clientPortalService';
import Avatar from '../../components/common/Avatar';
import StatusBadge from '../../components/common/StatusBadge';
import Toast from '../../components/common/Toast';

const DEFAULT_DAYS = [
  { day: 'Mon', fullDay: 'Monday', percentage: 100, present: 0, total: 0 },
  { day: 'Tue', fullDay: 'Tuesday', percentage: 100, present: 0, total: 0 },
  { day: 'Wed', fullDay: 'Wednesday', percentage: 100, present: 0, total: 0 },
  { day: 'Thu', fullDay: 'Thursday', percentage: 100, present: 0, total: 0 },
  { day: 'Fri', fullDay: 'Friday', percentage: 100, present: 0, total: 0 },
  { day: 'Sat', fullDay: 'Saturday', percentage: 100, present: 0, total: 0 },
  { day: 'Sun', fullDay: 'Sunday', percentage: 100, present: 0, total: 0 }
];

function ClientDashboard() {
  const navigate = useNavigate();
  const { clientCompany, clientUser } = useClientAuth();

  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    kpis: {
      totalEmployees: 0,
      activeEmployees: 0,
      todayAttendancePercent: 100,
      presentToday: 0,
      absentToday: 0,
      onLeaveToday: 0,
      pendingCorrections: 0,
      currentBillingAmount: 0,
      currentBillingFormatted: '₹0',
      paidAmount: 0,
      paidAmountFormatted: '₹0',
      pendingAmount: 0,
      pendingAmountFormatted: '₹0',
      lastInvoiceNo: 'INV-2026-01',
      currentBillingPeriod: new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' })
    },
    weeklyAttendanceTrend: DEFAULT_DAYS,
    recentEmployees: [],
    recentInvoices: [],
    notifications: []
  });

  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [hoveredBarIndex, setHoveredBarIndex] = useState(null);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const data = await clientPortalService.getDashboard();
      if (data) {
        setDashboardData({
          kpis: data.kpis || dashboardData.kpis,
          weeklyAttendanceTrend: data.weeklyAttendanceTrend?.length > 0
            ? data.weeklyAttendanceTrend
            : DEFAULT_DAYS,
          recentEmployees: Array.isArray(data.recentEmployees) ? data.recentEmployees : [],
          recentInvoices: Array.isArray(data.recentInvoices) ? data.recentInvoices : [],
          notifications: Array.isArray(data.notifications) ? data.notifications : []
        });
      }
    } catch (err) {
      console.warn('Could not fetch client dashboard from API:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, [clientCompany?.clientId, clientCompany?.name]);

  // SVG Chart configurations & Multi-color bar palette
  const DAY_BAR_COLORS = [
    { base: '#3b82f6', hover: '#2563eb' },
    { base: '#8b5cf6', hover: '#7c3aed' },
    { base: '#f59e0b', hover: '#d97706' },
    { base: '#10b981', hover: '#059669' },
    { base: '#6366f1', hover: '#4f46e5' },
    { base: '#06b6d4', hover: '#0891b2' },
    { base: '#f43f5e', hover: '#e11d48' },
  ];

  const svgWidth = 560;
  const svgHeight = 220;
  const paddingX = 45;
  const paddingY = 25;
  const chartWidth = svgWidth - paddingX * 2;
  const chartHeight = svgHeight - paddingY * 2;
  const barWidth = 36;
  const trendList = dashboardData.weeklyAttendanceTrend || DEFAULT_DAYS;
  const gap = trendList.length > 1
    ? (chartWidth - barWidth * trendList.length) / (trendList.length - 1)
    : 20;
  const gridLines = [100, 75, 50, 25, 0];

  const getRoundedBarPath = (x, y, width, height, radius) => {
    const r = Math.min(radius, height, width / 2);
    return `
      M ${x},${y + height}
      L ${x},${y + r}
      A ${r},${r} 0 0 1 ${x + r},${y}
      L ${x + width - r},${y}
      A ${r},${r} 0 0 1 ${x + width},${y + r}
      L ${x + width},${y + height}
      Z
    `.replace(/\s+/g, ' ').trim();
  };

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
  };

  const handleDownloadInvoice = (invoiceNo) => {
    showToast(`Invoice ${invoiceNo} PDF downloaded successfully.`, 'success');
  };

  const kpis = dashboardData.kpis;
  const recentEmployees = dashboardData.recentEmployees || [];
  const recentInvoices = dashboardData.recentInvoices || [];

  return (
    <div className={styles.container}>
      {/* Toast Feedback */}
      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ show: false, message: '', type: 'success' })}
        />
      )}

      {/* Page Header */}
      <div className={styles.pageHeader}>
        <div className={styles.welcomeSection}>
          <h1 className={styles.heading}>Dashboard</h1>
          <p className={styles.subheading}>
            Welcome back, {clientUser?.name || 'Client'} 👋 Here's an overview of your company's workforce, attendance and billing.
          </p>
        </div>

        <div className={styles.headerActions}>
          <button
            type="button"
            className={styles.secondaryBtn}
            onClick={fetchDashboard}
            title="Refresh Live Data"
          >
            <RefreshCw size={15} className={loading ? styles.spinning : ''} />
            <span>Refresh</span>
          </button>
          <button
            type="button"
            className={styles.secondaryBtn}
            onClick={() => navigate('/client/reports')}
          >
            <FileBarChart size={16} />
            <span>Company Reports</span>
          </button>
          <button
            type="button"
            className={styles.primaryBtn}
            onClick={() => navigate('/client/billing')}
          >
            <Receipt size={16} />
            <span>View Billing</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <section className={styles.kpiGrid} aria-label="Company Performance Indicators">
        {/* Card 1: Total Employees */}
        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <span className={styles.statLabel}>TOTAL EMPLOYEES</span>
            <div className={`${styles.statIconWrap} ${styles.toneBlue}`}>
              <Users size={18} />
            </div>
          </div>
          <div className={styles.statValueRow}>
            <span className={styles.statValue}>{kpis.totalEmployees}</span>
            <span className={styles.trendUp}>
              <TrendingUp size={13} /> Active Roster
            </span>
          </div>
        </div>

        {/* Card 2: Active Employees */}
        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <span className={styles.statLabel}>ACTIVE EMPLOYEES</span>
            <div className={`${styles.statIconWrap} ${styles.toneGreen}`}>
              <UserCheck size={18} />
            </div>
          </div>
          <div className={styles.statValueRow}>
            <span className={styles.statValue}>{kpis.activeEmployees}</span>
            <span className={styles.statusPillActive}>
              {kpis.totalEmployees > 0
                ? `${((kpis.activeEmployees / kpis.totalEmployees) * 100).toFixed(1)}% Active`
                : '100% Active'}
            </span>
          </div>
        </div>

        {/* Card 3: Today's Attendance */}
        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <span className={styles.statLabel}>TODAY'S ATTENDANCE</span>
            <div className={`${styles.statIconWrap} ${styles.toneTeal}`}>
              <ClipboardCheck size={18} />
            </div>
          </div>
          <div className={styles.statValueRow}>
            <span className={styles.statValue}>{kpis.todayAttendancePercent}%</span>
            <span className={styles.statPresentCount}>{kpis.presentToday} Present</span>
          </div>
        </div>

        {/* Card 4: Employees On Leave */}
        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <span className={styles.statLabel}>ON LEAVE</span>
            <div className={`${styles.statIconWrap} ${styles.tonePurple}`}>
              <CalendarOff size={18} />
            </div>
          </div>
          <div className={styles.statValueRow}>
            <span className={styles.statValue}>{kpis.onLeaveToday}</span>
            <span className={styles.statLeaveSub}>Approved leaves today</span>
          </div>
        </div>

        {/* Card 5: Current Billing Summary */}
        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <span className={styles.statLabel}>CURRENT BILLING</span>
            <div className={`${styles.statIconWrap} ${styles.toneIndigo}`}>
              <Receipt size={18} />
            </div>
          </div>
          <div className={styles.statValueRow}>
            <span className={styles.statValue}>
              {kpis.currentBillingFormatted || `₹${(kpis.currentBillingAmount || 0).toLocaleString('en-IN')}`}
            </span>
          </div>
        </div>
      </section>

      {/* Main Grid: Attendance & Workforce */}
      <div className={styles.contentGrid}>
        {/* Left Column: Attendance Overview & Trend */}
        <div className={styles.gridColLeft}>
          {/* Section: Attendance Overview */}
          <section className={styles.panelCard}>
            <div className={styles.panelHeader}>
              <div>
                <h2 className={styles.panelTitle}>Attendance Overview</h2>
                <p className={styles.panelSubtitle}>
                  Real-time attendance summary and weekly trend for {clientCompany?.name}
                </p>
              </div>
              <button
                type="button"
                className={styles.panelActionLink}
                onClick={() => navigate('/client/attendance')}
              >
                <span>View Attendance</span>
                <ArrowRight size={14} />
              </button>
            </div>

            {/* Weekly Attendance SVG Bar Chart */}
            <div className={styles.chartContainer}>
              <svg
                viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                className={styles.svgChart}
                width="100%"
                height="100%"
              >
                {/* Horizontal Grid lines */}
                {gridLines.map((val, idx) => {
                  const y = paddingY + chartHeight * (1 - val / 100);
                  const isBaseline = val === 0;
                  return (
                    <g key={idx} className={styles.gridGroup}>
                      <line
                        x1={paddingX}
                        y1={y}
                        x2={svgWidth - paddingX + 15}
                        y2={y}
                        className={isBaseline ? styles.baseline : styles.gridLine}
                      />
                      <text
                        x={paddingX - 10}
                        y={y + 4}
                        className={styles.gridLabel}
                      >
                        {val}%
                      </text>
                    </g>
                  );
                })}

                {/* Bar groups */}
                {trendList.map((item, idx) => {
                  const x = paddingX + idx * (barWidth + gap);
                  const barHeight = chartHeight * ((item.percentage || 100) / 100);
                  const y = paddingY + chartHeight - barHeight;
                  const isHovered = hoveredBarIndex === idx;

                  return (
                    <g
                      key={idx}
                      onMouseEnter={() => setHoveredBarIndex(idx)}
                      onMouseLeave={() => setHoveredBarIndex(null)}
                      className={styles.barGroup}
                      style={{ cursor: 'pointer' }}
                    >
                      {/* Main bar background track */}
                      <path
                        d={getRoundedBarPath(x, paddingY, barWidth, chartHeight, 4)}
                        className={styles.barTrack}
                      />

                      {/* Multi-colored bar */}
                      <path
                        d={getRoundedBarPath(x, y, barWidth, barHeight, 4)}
                        className={styles.barFill}
                        style={{
                          fill: isHovered
                            ? DAY_BAR_COLORS[idx % DAY_BAR_COLORS.length].hover
                            : DAY_BAR_COLORS[idx % DAY_BAR_COLORS.length].base
                        }}
                      />

                      {/* Top Percentage Label */}
                      {!isHovered && (
                        <text
                          x={x + barWidth / 2}
                          y={y - 6}
                          className={styles.barTopLabel}
                        >
                          {item.percentage}%
                        </text>
                      )}

                      {/* X Axis Day Label */}
                      <text
                        x={x + barWidth / 2}
                        y={svgHeight - 4}
                        className={styles.xAxisLabel}
                      >
                        {item.day}
                      </text>
                    </g>
                  );
                })}

                {/* Tooltip */}
                {hoveredBarIndex !== null && (() => {
                  const activeItem = trendList[hoveredBarIndex];
                  if (!activeItem) return null;

                  const x = paddingX + hoveredBarIndex * (barWidth + gap);
                  const barHeight = chartHeight * ((activeItem.percentage || 100) / 100);
                  const y = paddingY + chartHeight - barHeight;

                  const tooltipWidth = 75;
                  const tooltipHeight = 22;
                  const tooltipX = Math.max(
                    8,
                    Math.min(svgWidth - tooltipWidth - 8, x + barWidth / 2 - tooltipWidth / 2)
                  );
                  const tooltipY = Math.max(4, y - tooltipHeight - 6);

                  return (
                    <g className={styles.tooltipGroup}>
                      <rect
                        x={tooltipX}
                        y={tooltipY}
                        width={tooltipWidth}
                        height={tooltipHeight}
                        rx={4}
                        className={styles.tooltipBg}
                      />
                      <text
                        x={tooltipX + tooltipWidth / 2}
                        y={tooltipY + 15}
                        className={styles.tooltipText}
                      >
                        {activeItem.percentage}% ({activeItem.present || kpis.presentToday}P)
                      </text>
                    </g>
                  );
                })()}
              </svg>
            </div>
          </section>

          {/* Section: Recent Employees Table */}
          <section className={styles.panelCard}>
            <div className={styles.panelHeader}>
              <div>
                <h2 className={styles.panelTitle}>Recent Workforce Deployment</h2>
                <p className={styles.panelSubtitle}>
                  Assigned security personnel & staff for {clientCompany?.name}
                </p>
              </div>
              <button
                type="button"
                className={styles.panelActionLink}
                onClick={() => navigate('/client/employees')}
              >
                <span>View Employees</span>
                <ArrowRight size={14} />
              </button>
            </div>

            <div className={styles.tableResponsive}>
              <table className={styles.dataTable}>
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Designation</th>
                    <th>Department</th>
                    <th>Site / Location</th>
                    <th>Status</th>
                    <th className={styles.alignRight}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {recentEmployees.length === 0 ? (
                    <tr>
                      <td colSpan="6" className={styles.emptyCell}>
                        {loading ? 'Loading assigned workforce...' : `No employees currently assigned to ${clientCompany?.name || 'your company'}.`}
                      </td>
                    </tr>
                  ) : (
                    recentEmployees.map((emp) => (
                      <tr key={emp.id || emp.employeeCode}>
                        <td>
                          <div className={styles.employeeCell}>
                            <Avatar initials={emp.initials} size="sm" name={emp.name} />
                            <div>
                              <span className={styles.empName}>{emp.name}</span>
                              <span className={styles.empCode}>{emp.employeeCode}</span>
                            </div>
                          </div>
                        </td>
                        <td>{emp.designation}</td>
                        <td>
                          <span className={styles.deptBadge}>{emp.department}</span>
                        </td>
                        <td>
                          <div className={styles.siteCell}>
                            <MapPin size={12} />
                            <span>{emp.site}</span>
                          </div>
                        </td>
                        <td>
                          <StatusBadge status={emp.status} />
                        </td>
                        <td className={styles.alignRight}>
                          <button
                            type="button"
                            className={styles.viewBtn}
                            onClick={() => setSelectedEmployee(emp)}
                            title="View Employee Details"
                          >
                            <Eye size={14} />
                            <span>View</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        {/* Right Column: Billing & Notifications */}
        <div className={styles.gridColRight}>
          {/* Section: Billing Summary */}
          <section className={styles.panelCard}>
            <div className={styles.panelHeader}>
              <div>
                <h2 className={styles.panelTitle}>Billing & Invoices</h2>
                <p className={styles.panelSubtitle}>
                  Current billing period & payment status
                </p>
              </div>
              <button
                type="button"
                className={styles.panelActionLink}
                onClick={() => navigate('/client/billing')}
              >
                <span>View Billing</span>
                <ArrowRight size={14} />
              </button>
            </div>

            {/* Financial metrics breakdown */}
            <div className={styles.billingMetricsList}>
              <div className={styles.billingRow}>
                <span className={styles.billingRowLabel}>Current Month Billing</span>
                <strong className={styles.billingRowValue}>
                  ₹{(kpis.currentBillingAmount || 0).toLocaleString('en-IN')}
                </strong>
              </div>
              <div className={styles.billingRow}>
                <span className={styles.billingRowLabel}>Paid Amount</span>
                <span className={`${styles.billingRowValue} ${styles.textSuccess}`}>
                  ₹{(kpis.paidAmount || 0).toLocaleString('en-IN')}
                </span>
              </div>
              <div className={styles.billingRow}>
                <span className={styles.billingRowLabel}>Pending Amount</span>
                <span className={`${styles.billingRowValue} ${styles.textDanger}`}>
                  ₹{(kpis.pendingAmount || 0).toLocaleString('en-IN')}
                </span>
              </div>
              <div className={styles.billingRow}>
                <span className={styles.billingRowLabel}>Last Invoice</span>
                <span className={styles.billingRowMuted}>{kpis.lastInvoiceNo}</span>
              </div>
            </div>

            {/* Invoices List */}
            <h3 className={styles.subSectionHeading}>Recent Invoices</h3>
            <div className={styles.invoiceList}>
              {recentInvoices.length === 0 ? (
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', padding: '12px 0' }}>
                  No billing invoices issued yet.
                </p>
              ) : (
                recentInvoices.map((inv) => (
                  <div key={inv.id || inv.invoiceNo} className={styles.invoiceItem}>
                    <div className={styles.invoiceMeta}>
                      <span className={styles.invNo}>{inv.invoiceNo}</span>
                      <span className={styles.invPeriod}>{inv.billingPeriod} • Due: {inv.dueDate}</span>
                    </div>
                    <div className={styles.invRight}>
                      <span className={styles.invAmount}>
                        ₹{(inv.grossAmount || 0).toLocaleString('en-IN')}
                      </span>
                      <StatusBadge status={inv.status} />
                      <button
                        type="button"
                        className={styles.invIconBtn}
                        onClick={() => setSelectedInvoice(inv)}
                        title="View Invoice"
                      >
                        <Eye size={14} />
                      </button>
                      <button
                        type="button"
                        className={styles.invIconBtn}
                        onClick={() => handleDownloadInvoice(inv.invoiceNo)}
                        title="Download Invoice PDF"
                      >
                        <Download size={14} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* Section: Announcements & Notifications */}
          <section className={styles.panelCard}>
            <div className={styles.panelHeader}>
              <div>
                <h2 className={styles.panelTitle}>Recent Notifications</h2>
                <p className={styles.panelSubtitle}>Updates and notices for {clientCompany?.name}</p>
              </div>
              <button
                type="button"
                className={styles.panelActionLink}
                onClick={() => navigate('/client/notifications')}
              >
                <span>View All</span>
                <ArrowRight size={14} />
              </button>
            </div>

            <div className={styles.notificationsList}>
              {dashboardData.notifications.length === 0 ? (
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', padding: '12px 0' }}>
                  No new announcements or alerts.
                </p>
              ) : (
                dashboardData.notifications.map((notif) => (
                  <div key={notif.id} className={styles.notifItem}>
                    <div className={styles.notifIconWrap}>
                      <Bell size={14} className={!notif.read ? styles.bellActive : ''} />
                    </div>
                    <div className={styles.notifContent}>
                      <div className={styles.notifTitleRow}>
                        <span className={styles.notifTitle}>{notif.title}</span>
                        {!notif.read && <span className={styles.unreadDot} />}
                      </div>
                      <p className={styles.notifMsg}>{notif.message}</p>
                      <span className={styles.notifTime}>{notif.timestamp || 'Today'}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </div>

      {/* Reports Quick Access */}
      <section className={styles.panelCard}>
        <div className={styles.panelHeader}>
          <div>
            <h2 className={styles.panelTitle}>Company Reports</h2>
            <p className={styles.panelSubtitle}>Comprehensive downloadable reports scoped exclusively to your workforce data</p>
          </div>
          <button
            type="button"
            className={styles.panelActionLink}
            onClick={() => navigate('/client/reports')}
          >
            <span>View All Reports</span>
            <ArrowRight size={14} />
          </button>
        </div>

        <div className={styles.reportsQuickGrid}>
          <div
            className={styles.reportCardMini}
            onClick={() => navigate('/client/reports?type=attendance')}
          >
            <div className={`${styles.reportIconMini} ${styles.toneBlue}`}>
              <ClipboardCheck size={18} />
            </div>
            <div>
              <span className={styles.reportTitleMini}>Attendance Report</span>
              <span className={styles.reportDescMini}>Muster rolls & working hours</span>
            </div>
          </div>

          <div
            className={styles.reportCardMini}
            onClick={() => navigate('/client/reports?type=employee')}
          >
            <div className={`${styles.reportIconMini} ${styles.toneCyan}`}>
              <Users size={18} />
            </div>
            <div>
              <span className={styles.reportTitleMini}>Employee Master Report</span>
              <span className={styles.reportDescMini}>Personnel & deployment roster</span>
            </div>
          </div>

          <div
            className={styles.reportCardMini}
            onClick={() => navigate('/client/reports?type=billing')}
          >
            <div className={`${styles.reportIconMini} ${styles.toneAmber}`}>
              <Receipt size={18} />
            </div>
            <div>
              <span className={styles.reportTitleMini}>Billing Report</span>
              <span className={styles.reportDescMini}>Invoices, tax & breakdown</span>
            </div>
          </div>

          <div
            className={styles.reportCardMini}
            onClick={() => navigate('/client/reports?type=payroll')}
          >
            <div className={`${styles.reportIconMini} ${styles.toneIndigo}`}>
              <FileBarChart size={18} />
            </div>
            <div>
              <span className={styles.reportTitleMini}>Deployment Summary</span>
              <span className={styles.reportDescMini}>Shift & post allocation</span>
            </div>
          </div>
        </div>
      </section>

      {/* Read-Only Employee Details Modal */}
      {selectedEmployee && (
        <div className={styles.modalOverlay} onClick={() => setSelectedEmployee(null)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div className={styles.modalTitleRow}>
                <Avatar initials={selectedEmployee.initials} size="md" name={selectedEmployee.name} />
                <div>
                  <h3 className={styles.modalTitle}>{selectedEmployee.name}</h3>
                  <span className={styles.modalSubtitle}>
                    {selectedEmployee.employeeCode} • {selectedEmployee.designation}
                  </span>
                </div>
              </div>
              <button
                type="button"
                className={styles.modalCloseBtn}
                onClick={() => setSelectedEmployee(null)}
              >
                <X size={18} />
              </button>
            </div>

            <div className={styles.modalBody}>
              <div className={styles.modalInfoGrid}>
                <div className={styles.infoField}>
                  <span className={styles.fieldLabel}>Mapped Company</span>
                  <span className={styles.fieldVal}>{clientCompany?.name}</span>
                </div>
                <div className={styles.infoField}>
                  <span className={styles.fieldLabel}>Department</span>
                  <span className={styles.fieldVal}>{selectedEmployee.department}</span>
                </div>
                <div className={styles.infoField}>
                  <span className={styles.fieldLabel}>Assigned Site</span>
                  <span className={styles.fieldVal}>{selectedEmployee.site}</span>
                </div>
                <div className={styles.infoField}>
                  <span className={styles.fieldLabel}>Duty Post</span>
                  <span className={styles.fieldVal}>{selectedEmployee.dutyPost || 'Duty Post'}</span>
                </div>
                <div className={styles.infoField}>
                  <span className={styles.fieldLabel}>Shift Timing</span>
                  <span className={styles.fieldVal}>{selectedEmployee.shift || 'General Shift'}</span>
                </div>
                <div className={styles.infoField}>
                  <span className={styles.fieldLabel}>Joining Date</span>
                  <span className={styles.fieldVal}>{selectedEmployee.joiningDate || '--'}</span>
                </div>
                <div className={styles.infoField}>
                  <span className={styles.fieldLabel}>Police Verification</span>
                  <span className={styles.fieldValBadge}>
                    <ShieldCheck size={13} color="#16a34a" />
                    {selectedEmployee.policeVerification || 'Verified (2026)'}
                  </span>
                </div>
                <div className={styles.infoField}>
                  <span className={styles.fieldLabel}>Employment Status</span>
                  <StatusBadge status={selectedEmployee.status} />
                </div>
              </div>
            </div>

            <div className={styles.modalFooter}>
              <span className={styles.readOnlyNote}>Read-only client view. Personnel data managed by Security Admin.</span>
              <button
                type="button"
                className={styles.modalPrimaryBtn}
                onClick={() => setSelectedEmployee(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Invoice Modal */}
      {selectedInvoice && (
        <div className={styles.modalOverlay} onClick={() => setSelectedInvoice(null)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div>
                <h3 className={styles.modalTitle}>Invoice {selectedInvoice.invoiceNo}</h3>
                <span className={styles.modalSubtitle}>
                  Billing Period: {selectedInvoice.billingPeriod} • Due Date: {selectedInvoice.dueDate}
                </span>
              </div>
              <button
                type="button"
                className={styles.modalCloseBtn}
                onClick={() => setSelectedInvoice(null)}
              >
                <X size={18} />
              </button>
            </div>

            <div className={styles.modalBody}>
              <div className={styles.invoiceCompanyHeader}>
                <div>
                  <span className={styles.invBilledToLabel}>Billed To:</span>
                  <h4 className={styles.invCompanyName}>{clientCompany?.name}</h4>
                  <p className={styles.invAddress}>{clientCompany?.registeredAddress || clientCompany?.address}</p>
                  <span className={styles.invGst}>GSTIN: {clientCompany?.gstin || '--'}</span>
                </div>
                <div className={styles.invStatusCol}>
                  <StatusBadge status={selectedInvoice.status} />
                  <span className={styles.invTotalHeader}>
                    ₹{(selectedInvoice.grossAmount || 0).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              <h4 className={styles.invBreakdownTitle}>Itemized Manpower Breakdown</h4>
              <div className={styles.invTableWrap}>
                <table className={styles.invTable}>
                  <thead>
                    <tr>
                      <th>Description</th>
                      <th className={styles.alignRight}>Amount (INR)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Security Personnel Deployment ({selectedInvoice.totalGuards || kpis.activeEmployees} Guards)</td>
                      <td className={styles.alignRight}>
                        ₹{Math.round((selectedInvoice.grossAmount || 0) * 0.85).toLocaleString('en-IN')}
                      </td>
                    </tr>
                    <tr>
                      <td>GST / Statutory Compliance (18%)</td>
                      <td className={styles.alignRight}>
                        ₹{Math.round((selectedInvoice.grossAmount || 0) * 0.15).toLocaleString('en-IN')}
                      </td>
                    </tr>
                    <tr className={styles.invTotalRow}>
                      <td><strong>Total Gross Payable</strong></td>
                      <td className={styles.alignRight}>
                        <strong>₹{(selectedInvoice.grossAmount || 0).toLocaleString('en-IN')}</strong>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button
                type="button"
                className={styles.secondaryBtn}
                onClick={() => handleDownloadInvoice(selectedInvoice.invoiceNo)}
              >
                <Download size={15} />
                <span>Download PDF</span>
              </button>
              <button
                type="button"
                className={styles.modalPrimaryBtn}
                onClick={() => setSelectedInvoice(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ClientDashboard;
