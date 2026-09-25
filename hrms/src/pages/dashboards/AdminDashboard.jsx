import React, { useState } from 'react';
import { CalendarDays, Plus, UserPlus, Building } from 'lucide-react';
import styles from './Dashboard.module.css';
import AdminLayout from '../../components/layout/AdminLayout';
import StatCard from '../../components/dashboard/StatCard';
import AgeDemograph from '../../components/dashboard/AgeDemograph';
import QuickInsights from '../../components/dashboard/QuickInsights';
import EmployeeDistribution from '../../components/dashboard/EmployeeDistribution';
import RecentActivities from '../../components/dashboard/RecentActivities';
import UpcomingReminders from '../../components/dashboard/UpcomingReminders';
import PayrollSummary from '../../components/dashboard/PayrollSummary';
import Dropdown from '../../components/common/Dropdown';

// Mock data
import { 
  kpiData, 
  attendanceTrendData,
  employeeDistributionData, 
  recentActivitiesData as initialActivities,
  upcomingRemindersData,
  payrollSummaryData,
  clientWisePayrollData
} from '../../data/dashboardData';

import { useCompany } from '../../context/CompanyContext';

function AdminDashboard() {
  const { activeCompany } = useCompany();
  const [activities, setActivities] = useState(initialActivities);

  // Is this the primary seeded company or a newly created company profile?
  const isPrimary = activeCompany?.isDefault || activeCompany?.id === 'comp_rr_security';

  const displayedKpi = isPrimary
    ? kpiData
    : [
        {
          id: 'total-employees',
          title: 'Total Employees',
          value: activeCompany?.employeesCount !== undefined ? String(activeCompany.employeesCount) : '0',
          trend: '+0%',
          trendType: 'neutral',
          subtext: 'active workforce',
          iconName: 'Users'
        },
        {
          id: 'active-employees',
          title: 'Active Employees',
          value: activeCompany?.employeesCount !== undefined ? String(activeCompany.employeesCount) : '0',
          trend: '+0%',
          trendType: 'neutral',
          subtext: 'on duty',
          iconName: 'UserCheck'
        },
        {
          id: 'male-employees',
          title: 'Male Employees',
          value: '0',
          trend: '0%',
          trendType: 'neutral',
          subtext: 'staff count',
          iconName: 'Mars'
        },
        {
          id: 'female-employees',
          title: 'Female Employees',
          value: '0',
          trend: '0%',
          trendType: 'neutral',
          subtext: 'staff count',
          iconName: 'Venus'
        },
        {
          id: 'new-joiners',
          title: 'New Joiners',
          value: '0',
          trend: '+0 this month',
          trendType: 'neutral',
          subtext: 'recent onboardings',
          iconName: 'UserPlus'
        }
      ];

  return (
    <AdminLayout>
      <div className={styles.container}>

        {/* ---- Page header ---- */}
        <div className={styles.pageHeader}>
          <div className={styles.welcomeSection}>
            <h1 className={styles.heading}>Dashboard</h1>
            <p className={styles.subheading}>
              Welcome back, Admin 👋 Here's what's happening at <strong>{activeCompany.name || 'RR Security'}</strong> today.
            </p>
          </div>

          {/* Action buttons */}
          <div className={styles.actions}>
            {/* Date filter */}
            <Dropdown
              align="right"
              trigger={
                <button className={styles.dateSelector} aria-label="Filter by date range">
                  <CalendarDays size={16} />
                  <span>Today</span>
                </button>
              }
            >
              <ul className={styles.menuList}>
                <li><button className={styles.menuItem}>Today</button></li>
                <li><button className={styles.menuItem}>Yesterday</button></li>
                <li><button className={styles.menuItem}>This Week</button></li>
                <li><button className={styles.menuItem}>This Month</button></li>
              </ul>
            </Dropdown>

            {/* Quick Action */}
            <Dropdown
              align="right"
              trigger={
                <button className={styles.quickActionBtn} aria-label="Add records menu">
                  <Plus size={16} />
                  <span>Quick Action</span>
                </button>
              }
            >
              <ul className={styles.menuList}>
                <li>
                  <button className={styles.menuItem}>
                    <Building size={14} />
                    <span>Add Client</span>
                  </button>
                </li>
                <li>
                  <button className={styles.menuItem}>
                    <UserPlus size={14} />
                    <span>Add Employee</span>
                  </button>
                </li>
              </ul>
            </Dropdown>
          </div>
        </div>

        {/* ---- KPI Statistics Cards ---- */}
        <section className={styles.kpiGrid} aria-label="Key Performance Indicators">
          {displayedKpi.map((kpi) => (
            <StatCard
              key={kpi.id}
              title={kpi.title}
              value={kpi.value}
              trend={kpi.trend}
              trendType={kpi.trendType}
              subtext={kpi.subtext}
              iconName={kpi.iconName}
            />
          ))}
        </section>

        {/* ---- Row 1: Age Demograph & Quick Insights ---- */}
        <div className={styles.topGridRow}>
          <div className={styles.col5}>
            <AgeDemograph attendanceData={attendanceTrendData} />
          </div>
          <div className={styles.col7}>
            <QuickInsights />
          </div>
        </div>

        {/* ---- Row 2: Department Wise Employees, Recent Activities, Upcoming Reminders ---- */}
        <div className={styles.bottomGridRow}>
          <EmployeeDistribution data={employeeDistributionData} />
          <RecentActivities activities={activities} />
          <UpcomingReminders data={upcomingRemindersData} />
        </div>

        {/* ---- Payroll Summary ---- */}
        <section aria-label="Payroll Summary">
          <PayrollSummary 
            overallData={payrollSummaryData} 
            clientWiseData={clientWisePayrollData}
            loading={false}
          />
        </section>

      </div>
    </AdminLayout>
  );
}

export default AdminDashboard;
