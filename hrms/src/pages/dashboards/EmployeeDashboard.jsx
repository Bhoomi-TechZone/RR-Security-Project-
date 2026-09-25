import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  CalendarCheck,
  CalendarDays,
  CalendarX,
  Clock3,
  FileText,
  FileWarning,
  IndianRupee,
  ChevronRight,
  LogIn,
  LogOut,
  CheckCircle2,
  Eye,
  Download
} from 'lucide-react';
import styles from './EmployeeDashboard.module.css';
import { employeeDashboardData } from '../../data/employeeDashboardData';

const formatCurrency = (value) => `₹${value.toLocaleString('en-IN')}`;

function EmployeeProfileCard({ employee }) {
  return (
    <div className={styles.profileCard}>
      <div className={styles.profileAvatar}>{employee.initials}</div>
      <div className={styles.profileInfo}>
        <h2>{employee.name}</h2>
        <p>Employee ID: {employee.employeeId}</p>
        <p>{employee.designation}</p>
        <p>{employee.department} • {employee.company}</p>
      </div>
    </div>
  );
}

function SummaryCard({ icon: Icon, label, value, meta, tone = 'default' }) {
  return (
    <article className={`${styles.summaryCard} ${styles[tone] || ''}`}>
      <div className={styles.summaryIconWrap}>
        <Icon size={18} strokeWidth={2} />
      </div>
      <div className={styles.summaryContent}>
        <span className={styles.summaryLabel}>{label}</span>
        <strong className={styles.summaryValue}>{value}</strong>
        <span className={styles.summaryMeta}>{meta}</span>
      </div>
    </article>
  );
}

function AttendanceStatusCard({ attendance }) {
  return (
    <section className={styles.panelCard}>
      <div className={styles.panelHeader}>
        <div>
          <p className={styles.sectionEyebrow}>Today's Attendance</p>
          <h3 className={styles.cardMainHeading}>{attendance.date}</h3>
        </div>
        <div className={styles.shiftBadge}>
          <Clock3 size={12} />
          <span>General Shift</span>
        </div>
      </div>

      <div className={styles.attendanceHeroRow}>
        <div className={styles.statusLivePill}>
          <span className={styles.statusDotLive} />
          <span>{attendance.status}</span>
        </div>
        <div className={styles.workingHoursCapsule}>
          <Clock3 size={14} className={styles.capsuleIcon} />
          <span>Hours: <strong>{attendance.workingHours}</strong></span>
        </div>
      </div>

      <div className={styles.timeBlockGrid}>
        <div className={styles.timeBlockCardIn}>
          <div className={styles.timeBlockLeftGroup}>
            <div className={styles.timeBlockIconIn}>
              <LogIn size={15} />
            </div>
            <div className={styles.timeBlockTextGroup}>
              <span className={styles.timeBlockLabel}>CHECK IN</span>
              <strong className={styles.timeBlockValue}>{attendance.checkIn}</strong>
            </div>
          </div>
          <span className={styles.timeBlockTagIn}>On Time</span>
        </div>

        <div className={styles.timeBlockCardOut}>
          <div className={styles.timeBlockLeftGroup}>
            <div className={styles.timeBlockIconOut}>
              <LogOut size={15} />
            </div>
            <div className={styles.timeBlockTextGroup}>
              <span className={styles.timeBlockLabel}>CHECK OUT</span>
              <strong className={styles.timeBlockValue}>{attendance.checkOut}</strong>
            </div>
          </div>
          <span className={styles.timeBlockTagOut}>Logged Out</span>
        </div>
      </div>
    </section>
  );
}

function AttendanceOverviewCard({ attendance }) {
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const trendData = attendance.trend || [];

  const DAY_COLORS = [
    { base: '#3b82f6', hover: '#1d4ed8' }, // Mon - Blue
    { base: '#8b5cf6', hover: '#6d28d9' }, // Tue - Violet
    { base: '#f59e0b', hover: '#d97706' }, // Wed - Amber
    { base: '#10b981', hover: '#059669' }, // Thu - Emerald
    { base: '#6366f1', hover: '#4338ca' }, // Fri - Indigo
    { base: '#06b6d4', hover: '#0891b2' }, // Sat - Cyan
    { base: '#f43f5e', hover: '#e11d48' }  // Sun - Rose
  ];

  const svgWidth = 480;
  const svgHeight = 160;
  const paddingLeft = 36;
  const paddingRight = 16;
  const paddingTop = 16;
  const paddingBottom = 26;

  const chartWidth = svgWidth - paddingLeft - paddingRight;
  const chartHeight = svgHeight - paddingTop - paddingBottom;
  const gridLines = [100, 75, 50, 25, 0];

  const points = trendData.map((item, idx) => {
    const x = paddingLeft + (idx / Math.max(1, trendData.length - 1)) * chartWidth;
    const y = paddingTop + chartHeight * (1 - item.percentage / 100);
    return { x, y, color: DAY_COLORS[idx % DAY_COLORS.length], ...item };
  });

  // Generate smooth cubic bezier SVG path
  const generateSmoothPath = (pts) => {
    if (pts.length === 0) return '';
    if (pts.length === 1) return `M ${pts[0].x},${pts[0].y}`;
    let path = `M ${pts[0].x},${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i === 0 ? 0 : i - 1];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[i + 2] || p2;

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      path += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
    }
    return path;
  };

  const linePath = generateSmoothPath(points);
  const areaPath = points.length > 0
    ? `${linePath} L ${points[points.length - 1].x},${paddingTop + chartHeight} L ${points[0].x},${paddingTop + chartHeight} Z`
    : '';

  return (
    <section className={styles.panelCard}>
      <div className={styles.panelHeader}>
        <div>
          <p className={styles.sectionEyebrow}>Attendance Overview</p>
          <h3>{attendance.month}</h3>
        </div>
        <div className={styles.attendanceOverallRate}>
          <span>Overall:</span>
          <strong>{attendance.percentage}%</strong>
        </div>
      </div>

      <p className={styles.caption}>Your weekly attendance percentage trend.</p>

      {/* Multi-Color SVG Line Graph */}
      <div className={styles.lineChartContainer}>
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className={styles.lineSvg}
          width="100%"
          height="100%"
        >
          <defs>
            {/* Multi-color linear gradient for stroke */}
            <linearGradient id="attendanceLineMultiGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="16.6%" stopColor="#8b5cf6" />
              <stop offset="33.3%" stopColor="#f59e0b" />
              <stop offset="50%" stopColor="#10b981" />
              <stop offset="66.6%" stopColor="#6366f1" />
              <stop offset="83.3%" stopColor="#06b6d4" />
              <stop offset="100%" stopColor="#f43f5e" />
            </linearGradient>

            {/* Soft area gradient */}
            <linearGradient id="attendanceAreaMultiGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.22" />
              <stop offset="50%" stopColor="#3b82f6" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {gridLines.map((val, idx) => {
            const y = paddingTop + chartHeight * (1 - val / 100);
            return (
              <g key={idx} className={styles.gridGroup}>
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={svgWidth - paddingRight}
                  y2={y}
                  className={val === 0 ? styles.baseline : styles.gridLine}
                />
                <text x={paddingLeft - 8} y={y + 4} className={styles.gridLabel}>
                  {val}%
                </text>
              </g>
            );
          })}

          {/* Multi-color Area Fill */}
          {areaPath && (
            <path d={areaPath} fill="url(#attendanceAreaMultiGradient)" />
          )}

          {/* Multi-color Smooth Line Path */}
          {linePath && (
            <path
              d={linePath}
              fill="none"
              stroke="url(#attendanceLineMultiGradient)"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Data Points & Interactive hover targets */}
          {points.map((pt, idx) => {
            const isHovered = hoveredIndex === idx;
            const ptColor = pt.color || DAY_COLORS[idx % DAY_COLORS.length];

            return (
              <g
                key={idx}
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
                style={{ cursor: 'pointer' }}
              >
                {/* Vertical guideline on hover */}
                {isHovered && (
                  <line
                    x1={pt.x}
                    y1={paddingTop}
                    x2={pt.x}
                    y2={paddingTop + chartHeight}
                    stroke={ptColor.base}
                    strokeWidth="1.2"
                    strokeDasharray="3 3"
                  />
                )}

                {/* Outer glowing halo when hovered */}
                {isHovered && (
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={10}
                    fill={ptColor.base}
                    opacity="0.25"
                  />
                )}

                {/* Individual Multi-color node dot */}
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={isHovered ? 6 : 4.5}
                  fill={isHovered ? ptColor.hover : ptColor.base}
                  stroke="#ffffff"
                  strokeWidth="2.5"
                  className={styles.lineDot}
                />

                {/* Larger hit target */}
                <rect
                  x={pt.x - chartWidth / (points.length * 2)}
                  y={paddingTop}
                  width={chartWidth / points.length}
                  height={chartHeight}
                  fill="transparent"
                />

                {/* Multi-color X Axis Label */}
                <text
                  x={pt.x}
                  y={svgHeight - 6}
                  fill={isHovered ? ptColor.hover : ptColor.base}
                  style={{
                    fontSize: isHovered ? '11.5px' : '11px',
                    fontWeight: isHovered ? '700' : '600',
                    textAnchor: 'middle',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {pt.label}
                </text>
              </g>
            );
          })}

          {/* Tooltip rendered after all elements in SVG */}
          {hoveredIndex !== null && (() => {
            const activePt = points[hoveredIndex];
            if (!activePt) return null;

            const tooltipWidth = 72;
            const tooltipHeight = 22;
            const ptColor = activePt.color || DAY_COLORS[hoveredIndex % DAY_COLORS.length];

            const tooltipX = Math.max(
              6,
              Math.min(svgWidth - tooltipWidth - 6, activePt.x - tooltipWidth / 2)
            );
            const tooltipY = Math.max(2, activePt.y - tooltipHeight - 8);

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
                <circle
                  cx={tooltipX + 9}
                  cy={tooltipY + 11}
                  r={3.5}
                  fill={ptColor.base}
                />
                <text
                  x={tooltipX + 16 + (tooltipWidth - 16) / 2}
                  y={tooltipY + 15}
                  className={styles.tooltipText}
                  style={{ textAnchor: 'middle' }}
                >
                  {activePt.percentage}% ({activePt.hours})
                </text>
              </g>
            );
          })()}
        </svg>
      </div>
    </section>
  );
}

function AttendanceCalendar({ items }) {
  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <section className={styles.panelCard}>
      <div className={styles.panelHeader}>
        <div>
          <p className={styles.sectionEyebrow}>Attendance Calendar</p>
          <h3>August 2026</h3>
        </div>
      </div>

      <div className={styles.calendarGrid}>
        {weekDays.map((day) => (
          <span key={day} className={styles.calendarDayLabel}>{day}</span>
        ))}

        {items.map((item, index) => (
          <div key={`${item.day}-${item.date}-${index}`} className={`${styles.calendarCell} ${styles[item.status] || ''}`}>
            {item.status === 'weekend' ? '-' : item.date}
            {item.status !== 'weekend' && <span className={styles.dotIndicator} aria-label={item.status} />}
          </div>
        ))}
      </div>
    </section>
  );
}

function RecentLeaveRequests({ requests }) {
  const navigate = useNavigate();

  return (
    <section className={styles.panelCard}>
      <div className={styles.panelHeader}>
        <div>
          <p className={styles.sectionEyebrow}>Recent Leave Requests</p>
          <h3>Leave History</h3>
        </div>
        <button type="button" className={styles.textButton} onClick={() => navigate('/employee/leave')}>
          View All
          <ChevronRight size={14} />
        </button>
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.leaveTable}>
          <thead>
            <tr>
              <th>Leave Type</th>
              <th>From</th>
              <th>To</th>
              <th>Days</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((request) => (
              <tr key={request.id}>
                <td>{request.type}</td>
                <td>{request.from}</td>
                <td>{request.to}</td>
                <td>{request.days}</td>
                <td>
                  <span className={`${styles.statusPill} ${styles[request.status.toLowerCase()]}`}>
                    {request.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function LatestSalaryCard({ salary }) {
  const navigate = useNavigate();

  return (
    <section className={styles.panelCard}>
      <div className={styles.panelHeader}>
        <div>
          <p className={styles.sectionEyebrow}>Latest Salary Slip</p>
          <h3 className={styles.cardMainHeading}>{salary.month}</h3>
        </div>
        <span className={styles.statusPillSuccess}>
          <CheckCircle2 size={12} />
          <span>{salary.status}</span>
        </span>
      </div>

      <div className={styles.salaryStatsRow3}>
        <div className={styles.salaryStatBox}>
          <span className={styles.salaryMiniLabel}>GROSS SALARY</span>
          <strong className={styles.salaryMiniGross}>{formatCurrency(salary.gross)}</strong>
        </div>

        <div className={styles.salaryStatBoxDeduct}>
          <span className={styles.salaryMiniLabel}>DEDUCTIONS</span>
          <strong className={styles.salaryMiniDeductions}>-{formatCurrency(salary.deductions)}</strong>
        </div>

        <div className={styles.salaryStatBoxNet}>
          <span className={styles.salaryNetLabel}>NET TAKE-HOME</span>
          <strong className={styles.salaryNetHighlight}>{formatCurrency(salary.net)}</strong>
        </div>
      </div>

      <div className={styles.salaryActionsRow}>
        <button
          type="button"
          className={styles.secondaryButtonEnhanced}
          onClick={() => navigate('/employee/salary-slips')}
        >
          <Eye size={14} />
          <span>View Slip</span>
        </button>
        <button
          type="button"
          className={styles.primaryButtonEnhanced}
          onClick={() => navigate('/employee/salary-slips')}
        >
          <Download size={14} />
          <span>Download PDF</span>
        </button>
      </div>
    </section>
  );
}

function EmployeeNotifications({ notifications }) {
  const navigate = useNavigate();
  const iconMap = {
    'leave-approval': CalendarCheck,
    'salary-processed': IndianRupee,
    'document-expiry': FileWarning
  };

  return (
    <section className={styles.panelCard}>
      <div className={styles.panelHeader}>
        <div>
          <p className={styles.sectionEyebrow}>Recent Notifications</p>
          <h3>Alerts & Updates</h3>
        </div>
        <button type="button" className={styles.textButton} onClick={() => navigate('/employee/notifications')}>
          View All
          <ChevronRight size={14} />
        </button>
      </div>

      <div className={styles.notificationList}>
        {notifications.map((item) => {
          const Icon = iconMap[item.type] || Bell;
          return (
            <div key={item.id} className={`${styles.notificationItem} ${item.unread ? styles.unread : ''}`}>
              <div className={styles.notificationIcon}><Icon size={16} /></div>
              <div className={styles.notificationBody}>
                <div className={styles.notificationTopRow}>
                  <strong>{item.title}</strong>
                  <span>{item.date}</span>
                </div>
                <p>{item.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function EmployeeDashboard() {
  const data = employeeDashboardData;
  const today = new Date('2026-08-25T00:00:00');
  const dateLabel = new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(today);

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <header className={styles.pageHeader}>
          <div className={styles.welcomeSection}>
            {/* <p className={styles.kicker}>Employee Dashboard</p> */}
            <h1 className={styles.heading}>Welcome, Rahul </h1>
            <p className={styles.subheading}>
              Here&apos;s your attendance, leave and salary overview.
            </p>
          </div>

          <div className={styles.headerDateBadge}>
            <span>{dateLabel}</span>
            <button type="button" className={styles.datePill}>Today</button>
          </div>
        </header>

        <div className={styles.profileStatsRow}>
          <EmployeeProfileCard employee={data.employee} />

          <section className={styles.kpiGrid} aria-label="Employee summary cards">
            <SummaryCard icon={CalendarCheck} label="Present Days" value={data.summary.presentDays} meta={data.summary.presentMonth} />
            <SummaryCard icon={CalendarX} label="Absent Days" value={data.attendance.absentDays} meta={data.summary.presentMonth} tone="danger" />
            <SummaryCard icon={CalendarDays} label="Leave Balance" value={`${data.summary.leaveBalance} Days`} meta="Available" tone="warning" />
            <SummaryCard icon={FileText} label="Total Leave Requests" value={data.summary.totalLeaveRequests || data.leaveRequests?.length || 3} meta={`${data.summary.pendingLeaveRequests || 1} Pending`} tone="purple" />
            <SummaryCard icon={Clock3} label="Overtime" value={`${data.summary.overtimeHours} hrs`} meta="This Month" tone="info" />
            <SummaryCard icon={IndianRupee} label="Last Salary" value={formatCurrency(data.summary.lastSalary)} meta={data.summary.presentMonth} tone="success" />
          </section>
        </div>

        <div className={styles.contentGrid}>
          <div className={styles.primaryColumn}>
            <AttendanceStatusCard attendance={data.todayAttendance} />
            <LatestSalaryCard salary={data.salary} />
          </div>

          <div className={styles.secondaryColumn}>
            <AttendanceOverviewCard attendance={data.attendance} />
            <AttendanceCalendar items={data.attendanceCalendar} />
          </div>
        </div>

        <div className={styles.twoColumnGrid}>
          <RecentLeaveRequests requests={data.leaveRequests} />
          <EmployeeNotifications notifications={data.notifications} />
        </div>
      </div>
    </main>
  );
}

export default EmployeeDashboard;
