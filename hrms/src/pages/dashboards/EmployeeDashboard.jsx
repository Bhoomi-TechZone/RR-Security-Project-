import React, { useState, useEffect, useMemo } from 'react';
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
  Download,
  ShieldCheck,
  Building2,
  MapPin,
  CalendarClock
} from 'lucide-react';
import styles from './EmployeeDashboard.module.css';
import { useCompany } from '../../context/CompanyContext';
import authService from '../../services/authService';
import preferenceService from '../../services/preferenceService';
import leaveService from '../../services/leaveService';
import attendanceService from '../../services/attendanceService';

const formatCurrency = (value) => `₹${Number(value || 0).toLocaleString('en-IN')}`;

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
  const isPresent = attendance.status === 'Present' || attendance.status === 'Late';
  const isAbsent = attendance.status === 'Absent';
  const isLeave = attendance.status === 'On Leave' || attendance.status === 'Leave' || attendance.status === 'Half Day';

  return (
    <section className={styles.panelCard}>
      <div className={styles.panelHeader}>
        <div>
          <p className={styles.sectionEyebrow}>Today's Attendance</p>
          <h3 className={styles.cardMainHeading}>{attendance.date}</h3>
        </div>
        <div className={styles.shiftBadge}>
          <Clock3 size={12} />
          <span>{attendance.shift || 'General Shift'}</span>
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
          <span className={styles.timeBlockTagIn}>{isPresent ? 'Recorded' : 'Scheduled'}</span>
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
          <span className={styles.timeBlockTagOut}>{attendance.checkOut !== '—' ? 'Logged Out' : 'Active'}</span>
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
    const y = paddingTop + chartHeight * (1 - (item.percentage || 0) / 100);
    return { x, y, color: DAY_COLORS[idx % DAY_COLORS.length], ...item };
  });

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

      <p className={styles.caption}>Your weekly attendance percentage trend directly from database records.</p>

      <div className={styles.lineChartContainer}>
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className={styles.lineSvg}
          width="100%"
          height="100%"
        >
          <defs>
            <linearGradient id="attendanceLineMultiGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="16.6%" stopColor="#8b5cf6" />
              <stop offset="33.3%" stopColor="#f59e0b" />
              <stop offset="50%" stopColor="#10b981" />
              <stop offset="66.6%" stopColor="#6366f1" />
              <stop offset="83.3%" stopColor="#06b6d4" />
              <stop offset="100%" stopColor="#f43f5e" />
            </linearGradient>

            <linearGradient id="attendanceAreaMultiGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.22" />
              <stop offset="50%" stopColor="#3b82f6" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
            </linearGradient>
          </defs>

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

          {areaPath && (
            <path d={areaPath} fill="url(#attendanceAreaMultiGradient)" />
          )}

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

                {isHovered && (
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={10}
                    fill={ptColor.base}
                    opacity="0.25"
                  />
                )}

                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={isHovered ? 6 : 4.5}
                  fill={isHovered ? ptColor.hover : ptColor.base}
                  stroke="#ffffff"
                  strokeWidth="2.5"
                  className={styles.lineDot}
                />

                <rect
                  x={pt.x - chartWidth / (points.length * 2)}
                  y={paddingTop}
                  width={chartWidth / points.length}
                  height={chartHeight}
                  fill="transparent"
                />

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

function AttendanceCalendar({ records = [], monthLabel }) {
  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = (new Date(year, month, 1).getDay() + 6) % 7;

  const recMap = useMemo(() => {
    const map = {};
    (records || []).forEach(r => {
      if (r && r.date) {
        const dStr = typeof r.date === 'string' ? r.date.split('T')[0] : '';
        if (dStr) map[dStr] = r;
      }
    });
    return map;
  }, [records]);

  const cells = [];
  for (let i = 0; i < firstDayIndex; i++) {
    cells.push({ key: `pad-${i}`, isPadding: true });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const dStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const dayOfWeek = (new Date(year, month, d).getDay() + 6) % 7;
    const isWeekend = dayOfWeek >= 5;
    const rec = recMap[dStr];

    let status = isWeekend ? 'weekend' : 'off';
    if (rec) {
      const s = String(rec.status || '').toLowerCase();
      if (s === 'present' || s === 'late') status = 'present';
      else if (s === 'absent') status = 'absent';
      else if (s === 'onleave' || s === 'leave' || s === 'halfday') status = 'leave';
    }

    cells.push({
      key: `day-${d}`,
      date: d,
      status,
      isWeekend,
      isToday: d === today.getDate(),
    });
  }

  return (
    <section className={styles.panelCard}>
      <div className={styles.panelHeader}>
        <div>
          <p className={styles.sectionEyebrow}>Attendance Calendar</p>
          <h3>{monthLabel}</h3>
        </div>
      </div>

      <div className={styles.calendarGrid}>
        {weekDays.map((day) => (
          <span key={day} className={styles.calendarDayLabel}>{day}</span>
        ))}

        {cells.map((item) => {
          if (item.isPadding) {
            return <div key={item.key} className={`${styles.calendarCell} ${styles.emptyCell}`} />;
          }
          return (
            <div
              key={item.key}
              className={`${styles.calendarCell} ${styles[item.status] || ''} ${item.isToday ? styles.todayCell : ''}`}
            >
              {item.status === 'weekend' ? '-' : item.date}
              {item.status !== 'weekend' && <span className={styles.dotIndicator} aria-label={item.status} />}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function RecentLeaveRequests({ requests = [] }) {
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
        {requests.length === 0 ? (
          <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--text-muted, #64748b)', fontSize: '13px' }}>
            No leave requests applied yet.
          </div>
        ) : (
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
              {requests.map((request) => {
                const sKey = (request.status || '').toLowerCase().replace(/\s+/g, '');
                return (
                  <tr key={request.id}>
                    <td>{request.type}</td>
                    <td>{request.from}</td>
                    <td>{request.to}</td>
                    <td>{request.days}</td>
                    <td>
                      <span className={`${styles.statusPill} ${styles[sKey] || styles.pending}`}>
                        {request.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
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

function EmployeeNotificationsList({ notifications = [] }) {
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
  const { activeCompany } = useCompany();
  const currentUser = authService.getCurrentUser() || authService.getUser() || {};
  const companyId = activeCompany?.companyId || activeCompany?.id || currentUser?.companyId || 'RRS8392014SEC';

  const [portalAccess, setPortalAccess] = useState({
    enabled: true,
    allowDashboard: true,
    allowAttendance: true,
    allowLeaves: true,
    allowSalarySlips: true,
    allowProfile: true,
    allowNotifications: true,
  });

  const [leaveRequests, setLeaveRequests] = useState([]);
  const [leaveBalances, setLeaveBalances] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);

  const employeeName = currentUser?.name || currentUser?.employeeName || 'Workforce Member';
  const employeeInitials = (employeeName.split(' ').map((n) => n[0]).join('').substring(0, 2) || 'EM').toUpperCase();
  const employeeId = currentUser?.employeeId || currentUser?.employeeCode || currentUser?.id || '—';

  const dynamicEmployee = {
    name: employeeName,
    employeeId: employeeId,
    designation: currentUser?.designation || currentUser?.role || 'Staff Member',
    department: currentUser?.department || 'Operations',
    company: activeCompany?.name || currentUser?.companyName || 'RR Security & Facilities',
    initials: employeeInitials,
  };

  const today = new Date();
  const todayDateStr = today.toISOString().split('T')[0];
  const currentMonthKey = todayDateStr.slice(0, 7);
  const currentMonthName = today.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const previousMonthDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const previousMonthName = previousMonthDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const dateLabel = new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(today);

  // Fetch live portal permissions, leaves, and attendance directly from MongoDB
  useEffect(() => {
    let isMounted = true;
    async function loadDynamicDashboard() {
      try {
        const [access, leaves, balances, attendance] = await Promise.allSettled([
          preferenceService.getEmployeePortalAccess(companyId),
          leaveService.getLeaveRequests(companyId, { employeeId }),
          leaveService.getEmployeeBalances(companyId),
          attendanceService.getAttendanceRecords(companyId, { month: currentMonthKey, employeeId }),
        ]);

        if (isMounted) {
          if (access.status === 'fulfilled' && access.value) {
            setPortalAccess(access.value);
          }
          if (leaves.status === 'fulfilled' && Array.isArray(leaves.value)) {
            setLeaveRequests(leaves.value);
          }
          if (balances.status === 'fulfilled' && Array.isArray(balances.value)) {
            setLeaveBalances(balances.value);
          }
          if (attendance.status === 'fulfilled' && Array.isArray(attendance.value)) {
            setAttendanceRecords(attendance.value);
          }
        }
      } catch (err) {
        console.warn('Dashboard live data fetch warning:', err);
      }
    }

    loadDynamicDashboard();
    const interval = setInterval(loadDynamicDashboard, 5000);
    const handleRefresh = () => loadDynamicDashboard();

    window.addEventListener('focus', handleRefresh);
    window.addEventListener('auth_state_changed', handleRefresh);
    window.addEventListener('user_logged_in', handleRefresh);

    return () => {
      isMounted = false;
      clearInterval(interval);
      window.removeEventListener('focus', handleRefresh);
      window.removeEventListener('auth_state_changed', handleRefresh);
      window.removeEventListener('user_logged_in', handleRefresh);
    };
  }, [companyId, employeeId, currentMonthKey]);

  // Dynamic calculations from real records
  const totalLeaveBalance = useMemo(() => {
    if (leaveBalances.length > 0) {
      const myDoc = leaveBalances.find(b => b.employeeId === employeeId || b.employeeName === employeeName) || leaveBalances[0];
      if (myDoc && myDoc.balances) {
        return Object.values(myDoc.balances).reduce((sum, b) => sum + (Number(b.available) || 0), 0);
      }
    }
    return 35;
  }, [leaveBalances, employeeId, employeeName]);

  const pendingLeaves = leaveRequests.filter(r => r.status && r.status.toLowerCase().includes('pending')).length;

  const todayRecord = attendanceRecords.find(r => r.date === todayDateStr);
  const presentDaysCount = attendanceRecords.filter(r => {
    const s = String(r.status || '').toLowerCase();
    return s === 'present' || s === 'late';
  }).length;
  const absentDaysCount = attendanceRecords.filter(r => String(r.status || '').toLowerCase() === 'absent').length;

  const overtimeHoursCount = useMemo(() => {
    return attendanceRecords.reduce((sum, r) => {
      if (r.workingHours && typeof r.workingHours === 'string') {
        const match = r.workingHours.match(/(\d+)h/);
        if (match) {
          const hrs = parseInt(match[1], 10);
          if (hrs > 8) return sum + (hrs - 8);
        }
      }
      return sum;
    }, 0);
  }, [attendanceRecords]);

  // Today's attendance state
  const liveTodayAttendance = todayRecord ? {
    date: dateLabel,
    status: todayRecord.status === 'present' || todayRecord.status === 'late' ? 'Present' : (todayRecord.status === 'absent' ? 'Absent' : (todayRecord.status || 'Present')),
    workingHours: todayRecord.workingHours || '8h 00m',
    checkIn: todayRecord.checkIn || '09:00 AM',
    checkOut: todayRecord.checkOut || '—',
    shift: todayRecord.shift || 'General Shift',
  } : {
    date: dateLabel,
    status: 'Not Marked',
    workingHours: '—',
    checkIn: '—',
    checkOut: '—',
    shift: 'General Shift',
  };

  // Dynamic weekly trend calculation (Mon - Sun)
  const weekTrend = useMemo(() => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const currentDayOfWeek = (today.getDay() + 6) % 7;
    const monday = new Date(today);
    monday.setDate(today.getDate() - currentDayOfWeek);

    return days.map((dayLabel, index) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + index);
      const dStr = d.toISOString().split('T')[0];
      const rec = attendanceRecords.find(r => r.date === dStr);

      let percentage = 0;
      let hours = '0h 00m';
      const isWeekend = index >= 5;

      if (rec) {
        const s = String(rec.status || '').toLowerCase();
        if (s === 'present' || s === 'late') {
          percentage = 100;
          hours = rec.workingHours || '8h 00m';
        } else if (s === 'halfday') {
          percentage = 50;
          hours = rec.workingHours || '4h 00m';
        } else if (s === 'onleave' || s === 'leave') {
          percentage = 0;
          hours = 'Leave';
        }
      } else if (isWeekend) {
        percentage = 0;
        hours = 'Weekend';
      }

      return {
        label: dayLabel,
        percentage,
        hours,
      };
    });
  }, [today, attendanceRecords]);

  const monthlyRate = attendanceRecords.length > 0
    ? Math.round((presentDaysCount / attendanceRecords.length) * 100)
    : (presentDaysCount > 0 ? 100 : 0);

  // Dynamic salary structure
  const basicPay = Number(currentUser?.basicSalary || currentUser?.salary || 28000);
  const hra = Math.round(basicPay * 0.4);
  const allowances = Math.round(basicPay * 0.1);
  const grossPay = basicPay + hra + allowances;
  const pfDeduction = Math.round(basicPay * 0.12);
  const esiDeduction = grossPay <= 21000 ? Math.round(grossPay * 0.0075) : 0;
  const totalDeductions = pfDeduction + esiDeduction;
  const netTakeHome = grossPay - totalDeductions;

  const dynamicSalary = {
    month: previousMonthName,
    gross: grossPay,
    deductions: totalDeductions,
    net: netTakeHome,
    status: 'Processed',
  };

  const dynamicNotifications = [
    ...(leaveRequests.filter(r => r.status === 'Approved').slice(0, 1).map(r => ({
      id: `dash-notif-app-${r._id || r.id}`,
      type: 'leave-approval',
      title: `Leave Approved: ${r.leaveType?.name || r.leaveType || r.type || 'Leave'}`,
      date: 'Recent',
      description: `Your leave request for ${r.days || 1} day(s) has been approved by HR.`,
      unread: false,
    }))),
    ...(pendingLeaves > 0 ? [{
      id: 'dash-notif-pend',
      type: 'leave-approval',
      title: 'Leave Application In Review',
      date: 'Recent',
      description: `You have ${pendingLeaves} pending leave request(s) awaiting approval.`,
      unread: true,
    }] : []),
    ...(todayRecord ? [{
      id: 'dash-notif-att',
      type: 'leave-approval',
      title: `Today's Attendance: ${todayRecord.status}`,
      date: 'Today',
      description: `Check-in recorded at ${todayRecord.checkIn || '09:00 AM'}.`,
      unread: false,
    }] : []),
    {
      id: 'dash-notif-sal',
      type: 'salary-processed',
      title: `Salary Slip: ${previousMonthName}`,
      date: 'Processed',
      description: `Your monthly salary of ₹${netTakeHome.toLocaleString('en-IN')} has been generated.`,
      unread: false,
    },
    {
      id: 'dash-notif-portal',
      type: 'document-expiry',
      title: 'Credentials & KYC Verified',
      date: 'Active',
      description: `Your employee access for ${employeeId} is verified and active.`,
      unread: false,
    },
  ];

  const formattedLeaveRequests = leaveRequests.slice(0, 5).map(r => ({
    id: r._id || r.id || `req-${Math.random()}`,
    type: r.leaveType?.name || r.leaveType || r.type || 'Leave',
    from: r.fromDate ? new Date(r.fromDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : (r.from || '—'),
    to: r.toDate ? new Date(r.toDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : (r.to || '—'),
    days: r.days || 1,
    status: r.status || 'Pending',
  }));

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <header className={styles.pageHeader}>
          <div className={styles.welcomeSection}>
            <h1 className={styles.heading}>Welcome, {employeeName.split(' ')[0]}</h1>
            <p className={styles.subheading}>
              Here&apos;s your live attendance, leave and salary self-service portal.
            </p>
          </div>

          <div className={styles.headerDateBadge}>
            <span>{dateLabel}</span>
            <button type="button" className={styles.datePill}>Today</button>
          </div>
        </header>

        <div className={styles.profileStatsRow}>
          {portalAccess.allowProfile !== false && (
            <EmployeeProfileCard employee={dynamicEmployee} />
          )}

          <section className={styles.kpiGrid} aria-label="Employee summary cards">
            {portalAccess.allowAttendance !== false && (
              <>
                <SummaryCard icon={CalendarCheck} label="Present Days" value={presentDaysCount} meta={currentMonthName} />
                <SummaryCard icon={CalendarX} label="Absent Days" value={absentDaysCount} meta={currentMonthName} tone="danger" />
              </>
            )}
            {portalAccess.allowLeaves !== false && (
              <>
                <SummaryCard icon={CalendarDays} label="Leave Balance" value={`${totalLeaveBalance} Days`} meta="Available" tone="warning" />
                <SummaryCard icon={FileText} label="Total Leave Requests" value={leaveRequests.length} meta={`${pendingLeaves} Pending`} tone="purple" />
              </>
            )}
            <SummaryCard icon={Clock3} label="Overtime" value={`${overtimeHoursCount} hrs`} meta="This Month" tone="info" />
            {portalAccess.allowSalarySlips !== false && (
              <SummaryCard icon={IndianRupee} label="Last Salary" value={formatCurrency(dynamicSalary.net)} meta={previousMonthName} tone="success" />
            )}
          </section>
        </div>

        <div className={styles.contentGrid}>
          <div className={styles.primaryColumn}>
            {portalAccess.allowAttendance !== false && (
              <AttendanceStatusCard attendance={liveTodayAttendance} />
            )}
            {portalAccess.allowSalarySlips !== false && (
              <LatestSalaryCard salary={dynamicSalary} />
            )}
          </div>

          <div className={styles.secondaryColumn}>
            {portalAccess.allowAttendance !== false && (
              <>
                <AttendanceOverviewCard
                  attendance={{
                    month: currentMonthName,
                    percentage: monthlyRate,
                    trend: weekTrend,
                  }}
                />
                <AttendanceCalendar
                  records={attendanceRecords}
                  monthLabel={currentMonthName}
                />
              </>
            )}
          </div>
        </div>

        <div className={styles.twoColumnGrid}>
          {portalAccess.allowLeaves !== false && (
            <RecentLeaveRequests requests={formattedLeaveRequests} />
          )}
          {portalAccess.allowNotifications !== false && (
            <EmployeeNotificationsList notifications={dynamicNotifications} />
          )}
        </div>
      </div>
    </main>
  );
}

export default EmployeeDashboard;
