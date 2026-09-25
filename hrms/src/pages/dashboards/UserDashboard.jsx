import React from 'react';
import {
  Users,
  ClipboardCheck,
  CalendarOff,
  Timer,
  WalletCards,
  Package,
  BarChart3,
  Bell,
  Calendar,
  Clock3,
  Shield,
  ArrowRight,
  TrendingUp,
  CheckCircle2,
  Clock,
  AlertCircle,
  Sparkles,
  Layers,
  Inbox
} from 'lucide-react';
import styles from './UserDashboard.module.css';
import { useUserAuth } from '../../context/UserAuthContext';

function UserDashboard() {
  const { currentUser, canView } = useUserAuth();

  // Determine which widgets are allowed
  const hasEmployees = canView('employees');
  const hasAttendance = canView('attendance');
  const hasLeave = canView('leave');
  const hasOvertime = canView('overtime');
  const hasPayroll = canView('payroll');
  const hasInventory = canView('inventory');
  const hasReports = canView('reports');
  const hasNotifications = canView('notifications');

  // Check if any modules are enabled
  const hasAnyPermission =
    hasEmployees ||
    hasAttendance ||
    hasLeave ||
    hasOvertime ||
    hasPayroll ||
    hasInventory ||
    hasReports ||
    hasNotifications;

  // Mock weekly attendance data for visual bar chart
  const weeklyAttendance = [
    { day: 'Mon', percentage: 92, present: 115, total: 125 },
    { day: 'Tue', percentage: 95, present: 119, total: 125 },
    { day: 'Wed', percentage: 89, present: 111, total: 125 },
    { day: 'Thu', percentage: 94, present: 118, total: 125 },
    { day: 'Fri', percentage: 96, present: 120, total: 125 },
    { day: 'Sat', percentage: 91, present: 114, total: 125 },
    { day: 'Sun', percentage: 93, present: 116, total: 125 },
  ];

  // Mock recent leave requests
  const recentLeaveRequests = [
    { id: 1, name: 'Rahul Kumar', type: 'Casual Leave', days: '2 days', status: 'Pending', dates: '28-29 Aug' },
    { id: 2, name: 'Amit Sharma', type: 'Sick Leave', days: '1 day', status: 'Approved', dates: '26 Aug' },
    { id: 3, name: 'Sunita Rao', type: 'Paid Leave', days: '3 days', status: 'Pending', dates: '01-03 Sep' },
    { id: 4, name: 'Rajesh Chauhan', type: 'Sick Leave', days: '1 day', status: 'Rejected', dates: '24 Aug' },
  ];

  // Mock recent notifications
  const recentNotifications = [
    { id: 1, title: 'Attendance correction approved', time: '20 min ago', unread: true },
    { id: 2, title: 'Leave request updated for Rahul Kumar', time: '1 hour ago', unread: true },
    { id: 3, title: 'New announcement: Monthly Safety Briefing', time: '2 hours ago', unread: false },
    { id: 4, title: 'Shift schedule for September published', time: '4 hours ago', unread: false },
  ];

  // Mock recent activities
  const recentActivities = [
    { id: 1, text: 'Employee attendance marked for Site Alpha', time: '10 min ago', module: 'attendance' },
    { id: 2, text: 'Leave request approved for Amit Sharma', time: '35 min ago', module: 'leave' },
    { id: 3, text: 'Overtime claim submitted for 18 employees', time: '1 hour ago', module: 'overtime' },
    { id: 4, text: 'New announcement posted to security teams', time: '2 hours ago', module: 'notifications' },
  ];

  const firstName = currentUser?.name ? currentUser.name.split(' ')[0] : 'User';

  return (
    <div className={styles.container}>
      {/* Header Banner */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.kickerRow}>
            <span className={styles.kicker}>ROLE-BASED DASHBOARD</span>
            <span className={styles.rolePill}>
              <Shield size={12} />
              <span>{currentUser?.role || 'Custom Role'}</span>
            </span>
          </div>
          <h1 className={styles.greeting}>
            Welcome back, {firstName} 👋
          </h1>
          <p className={styles.subtitle}>
            Here's an overview of your assigned work and operational activities.
          </p>
        </div>

        <div className={styles.headerRight}>
          <div className={styles.dateCard}>
            <Calendar size={15} className={styles.dateIcon} />
            <div className={styles.dateText}>
              <strong className={styles.dateDay}>25 August 2026</strong>
              <span className={styles.dateBadge}>Today</span>
            </div>
          </div>
        </div>
      </header>

      {/* If user has no module permissions, show clean empty state */}
      {!hasAnyPermission ? (
        <section className={styles.emptyStateCard}>
          <div className={styles.emptyStateIconWrap}>
            <Inbox size={40} strokeWidth={1.5} />
          </div>
          <h2 className={styles.emptyStateTitle}>Your dashboard is ready</h2>
          <p className={styles.emptyStateDesc}>
            You currently don't have access to any additional operational modules.
            Your role permissions are managed by the system administrator.
          </p>
          <div className={styles.emptyNoticeBox}>
            <Shield size={16} />
            <span>Assigned Role: <b>{currentUser?.role}</b> (Account Active)</span>
          </div>
        </section>
      ) : (
        <>
          {/* Permission-Driven Summary KPI Grid */}
          <section className={styles.kpiGrid} aria-label="Permitted Module Metrics">
            {/* Employee Summary Widget */}
            {hasEmployees && (
              <article className={styles.kpiCard}>
                <div className={styles.kpiTop}>
                  <span className={styles.kpiTitle}>Total Employees</span>
                  <div className={`${styles.kpiIconWrap} ${styles.toneBlue}`}>
                    <Users size={20} />
                  </div>
                </div>
                <strong className={styles.kpiValue}>125</strong>
                <div className={styles.kpiMeta}>
                  <span className={styles.metaActive}>118 Active</span>
                  <span className={styles.metaDot}>•</span>
                  <span className={styles.metaMuted}>7 Inactive</span>
                </div>
              </article>
            )}

            {/* Attendance Summary Widget */}
            {hasAttendance && (
              <article className={styles.kpiCard}>
                <div className={styles.kpiTop}>
                  <span className={styles.kpiTitle}>Today's Attendance</span>
                  <div className={`${styles.kpiIconWrap} ${styles.toneGreen}`}>
                    <ClipboardCheck size={20} />
                  </div>
                </div>
                <strong className={styles.kpiValue}>94.2%</strong>
                <div className={styles.kpiMeta}>
                  <span className={styles.metaActive}>118 Present</span>
                  <span className={styles.metaDot}>•</span>
                  <span className={styles.metaWarning}>5 Absent</span>
                  <span className={styles.metaDot}>•</span>
                  <span className={styles.metaMuted}>2 Leave</span>
                </div>
              </article>
            )}

            {/* Leave Summary Widget */}
            {hasLeave && (
              <article className={styles.kpiCard}>
                <div className={styles.kpiTop}>
                  <span className={styles.kpiTitle}>Pending Leaves</span>
                  <div className={`${styles.kpiIconWrap} ${styles.toneAmber}`}>
                    <CalendarOff size={20} />
                  </div>
                </div>
                <strong className={styles.kpiValue}>8</strong>
                <div className={styles.kpiMeta}>
                  <span className={styles.metaWarning}>8 Pending</span>
                  <span className={styles.metaDot}>•</span>
                  <span className={styles.metaActive}>12 Approved</span>
                  <span className={styles.metaDot}>•</span>
                  <span className={styles.metaMuted}>2 Rejected</span>
                </div>
              </article>
            )}

            {/* Overtime Summary Widget */}
            {hasOvertime && (
              <article className={styles.kpiCard}>
                <div className={styles.kpiTop}>
                  <span className={styles.kpiTitle}>Overtime This Month</span>
                  <div className={`${styles.kpiIconWrap} ${styles.tonePurple}`}>
                    <Timer size={20} />
                  </div>
                </div>
                <strong className={styles.kpiValue}>126 hrs</strong>
                <div className={styles.kpiMeta}>
                  <span className={styles.metaWarning}>18 hrs Pending</span>
                  <span className={styles.metaDot}>•</span>
                  <span className={styles.metaActive}>108 hrs Approved</span>
                </div>
              </article>
            )}

            {/* Payroll Summary Widget */}
            {hasPayroll && (
              <article className={styles.kpiCard}>
                <div className={styles.kpiTop}>
                  <span className={styles.kpiTitle}>Payroll Status</span>
                  <div className={`${styles.kpiIconWrap} ${styles.toneEmerald}`}>
                    <WalletCards size={20} />
                  </div>
                </div>
                <strong className={styles.kpiValue}>₹42,30,000</strong>
                <div className={styles.kpiMeta}>
                  <span className={styles.metaActive}>Processed</span>
                  <span className={styles.metaDot}>•</span>
                  <span className={styles.metaMuted}>₹6,20,000 Pending</span>
                </div>
              </article>
            )}

            {/* Inventory Summary Widget */}
            {hasInventory && (
              <article className={styles.kpiCard}>
                <div className={styles.kpiTop}>
                  <span className={styles.kpiTitle}>Inventory Items</span>
                  <div className={`${styles.kpiIconWrap} ${styles.toneIndigo}`}>
                    <Package size={20} />
                  </div>
                </div>
                <strong className={styles.kpiValue}>1,248</strong>
                <div className={styles.kpiMeta}>
                  <span className={styles.metaActive}>1,102 Available</span>
                  <span className={styles.metaDot}>•</span>
                  <span className={styles.metaMuted}>146 Issued</span>
                </div>
              </article>
            )}

            {/* Reports Summary Widget */}
            {hasReports && (
              <article className={styles.kpiCard}>
                <div className={styles.kpiTop}>
                  <span className={styles.kpiTitle}>Reports Generated</span>
                  <div className={`${styles.kpiIconWrap} ${styles.toneRose}`}>
                    <BarChart3 size={20} />
                  </div>
                </div>
                <strong className={styles.kpiValue}>24</strong>
                <div className={styles.kpiMeta}>
                  <span className={styles.metaActive}>24 This Month</span>
                  <span className={styles.metaDot}>•</span>
                  <span className={styles.metaWarning}>3 Pending</span>
                </div>
              </article>
            )}
          </section>

          {/* Detailed Content Grid */}
          <div className={styles.contentGrid}>
            {/* Left Column: Attendance Overview & Leave Requests */}
            <div className={styles.mainCol}>
              {/* Attendance Overview Chart */}
              {hasAttendance && (
                <section className={styles.cardSection}>
                  <div className={styles.sectionHeader}>
                    <div>
                      <h2 className={styles.sectionHeading}>Attendance Overview</h2>
                      <span className={styles.sectionSubtext}>Weekly muster attendance trends</span>
                    </div>
                    <span className={styles.rateBadge}>This Week: 93.5% Avg</span>
                  </div>

                  <div className={styles.chartBars}>
                    {weeklyAttendance.map(item => (
                      <div key={item.day} className={styles.barCol}>
                        <span className={styles.barPercent}>{item.percentage}%</span>
                        <div className={styles.barTrack}>
                          <div
                            className={styles.barFill}
                            style={{ height: `${item.percentage}%` }}
                            title={`${item.day}: ${item.present}/${item.total} (${item.percentage}%)`}
                          />
                        </div>
                        <span className={styles.barDay}>{item.day}</span>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Recent Leave Requests */}
              {hasLeave && (
                <section className={styles.cardSection}>
                  <div className={styles.sectionHeader}>
                    <div>
                      <h2 className={styles.sectionHeading}>Recent Leave Requests</h2>
                      <span className={styles.sectionSubtext}>Requests requiring verification</span>
                    </div>
                  </div>

                  <div className={styles.tableResponsive}>
                    <table className={styles.table}>
                      <thead>
                        <tr>
                          <th>Employee</th>
                          <th>Leave Type</th>
                          <th>Duration</th>
                          <th>Dates</th>
                          <th style={{ textAlign: 'right' }}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentLeaveRequests.map(req => (
                          <tr key={req.id}>
                            <td>
                              <strong className={styles.empName}>{req.name}</strong>
                            </td>
                            <td>
                              <span className={styles.leaveType}>{req.type}</span>
                            </td>
                            <td>
                              <span className={styles.leaveDays}>{req.days}</span>
                            </td>
                            <td>
                              <span className={styles.leaveDates}>{req.dates}</span>
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              <span
                                className={`${styles.statusBadge} ${
                                  req.status === 'Approved'
                                    ? styles.statusApproved
                                    : req.status === 'Rejected'
                                    ? styles.statusRejected
                                    : styles.statusPending
                                }`}
                              >
                                {req.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              )}
            </div>

            {/* Right Column: Recent Notifications & Activities */}
            <div className={styles.sideCol}>
              {/* Recent Notifications Widget */}
              {hasNotifications && (
                <section className={styles.cardSection}>
                  <div className={styles.sectionHeader}>
                    <div>
                      <h2 className={styles.sectionHeading}>Recent Notifications</h2>
                      <span className={styles.sectionSubtext}>System alerts & notices</span>
                    </div>
                    <Bell size={16} className={styles.mutedIcon} />
                  </div>

                  <div className={styles.notificationsList}>
                    {recentNotifications.map(notif => (
                      <div
                        key={notif.id}
                        className={`${styles.notifItem} ${notif.unread ? styles.notifUnread : ''}`}
                      >
                        <div className={styles.notifDot} />
                        <div className={styles.notifContent}>
                          <span className={styles.notifTitle}>{notif.title}</span>
                          <span className={styles.notifTime}>{notif.time}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Recent Activities Section */}
              <section className={styles.cardSection}>
                <div className={styles.sectionHeader}>
                  <div>
                    <h2 className={styles.sectionHeading}>Recent Activities</h2>
                    <span className={styles.sectionSubtext}>Operational action logs</span>
                  </div>
                  <Clock size={16} className={styles.mutedIcon} />
                </div>

                <div className={styles.activityList}>
                  {recentActivities.map(act => (
                    <div key={act.id} className={styles.activityItem}>
                      <div className={styles.activityIconWrap}>
                        <CheckCircle2 size={14} />
                      </div>
                      <div className={styles.activityContent}>
                        <span className={styles.activityText}>{act.text}</span>
                        <span className={styles.activityTime}>{act.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default UserDashboard;
