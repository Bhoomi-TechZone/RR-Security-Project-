import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarDays, Plus, UserPlus, Building, RefreshCw } from 'lucide-react';
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
import { useCompany } from '../../context/CompanyContext';
import dashboardService from '../../services/dashboardService';

function AdminDashboard() {
  const navigate = useNavigate();
  const { activeCompany } = useCompany();
  const companyId = activeCompany?.companyId || activeCompany?.id || activeCompany?._id || 'comp_rr_security';

  const [loading, setLoading] = useState(true);
  const [selectedDateFilter, setSelectedDateFilter] = useState('Today');
  const [dashboardData, setDashboardData] = useState(null);

  const fetchDashboardData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await dashboardService.getDashboardStats(companyId);
      setDashboardData(data);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Dynamic KPI array
  const displayedKpi = [
    {
      id: 'total-employees',
      title: 'Total Employees',
      value: dashboardData?.kpi?.totalEmployees ?? '0',
      trend: '+12.5%',
      trendType: 'positive',
      subtext: 'registered workforce',
      iconName: 'Users'
    },
    {
      id: 'active-employees',
      title: 'Active Employees',
      value: dashboardData?.kpi?.activeEmployees ?? '0',
      trend: '+4.8%',
      trendType: 'positive',
      subtext: 'on duty & operational',
      iconName: 'UserCheck'
    },
    {
      id: 'male-employees',
      title: 'Male Employees',
      value: dashboardData?.kpi?.maleEmployees ?? '0',
      trend: '+3.1%',
      trendType: 'positive',
      subtext: 'field & security staff',
      iconName: 'Mars'
    },
    {
      id: 'female-employees',
      title: 'Female Employees',
      value: dashboardData?.kpi?.femaleEmployees ?? '0',
      trend: '+5.6%',
      trendType: 'positive',
      subtext: 'facility & operations',
      iconName: 'Venus'
    },
    {
      id: 'new-joiners',
      title: 'New Joinee',
      value: dashboardData?.kpi?.newJoiners ?? '0',
      trend: `+${dashboardData?.kpi?.newJoiners || 0} this month`,
      trendType: 'neutral',
      subtext: 'recent onboarding',
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
              Welcome back, Admin 👋 Here's what's happening at <strong>{activeCompany?.name || 'RR Security & Facilities'}</strong> today.
            </p>
          </div>

          {/* Action buttons */}
          <div className={styles.actions}>
            {/* Refresh button */}
            <button 
              type="button" 
              className={styles.dateSelector} 
              onClick={() => fetchDashboardData(false)}
              title="Refresh Live Data"
              style={{ minWidth: 'auto', padding: '8px 12px' }}
            >
              <RefreshCw size={14} className={loading ? styles.spinning : ''} />
            </button>

            {/* Date filter */}
            <Dropdown
              align="right"
              trigger={
                <button className={styles.dateSelector} aria-label="Filter by date range">
                  <CalendarDays size={16} />
                  <span>{selectedDateFilter}</span>
                </button>
              }
            >
              <ul className={styles.menuList}>
                <li><button className={styles.menuItem} onClick={() => setSelectedDateFilter('Today')}>Today</button></li>
                <li><button className={styles.menuItem} onClick={() => setSelectedDateFilter('Yesterday')}>Yesterday</button></li>
                <li><button className={styles.menuItem} onClick={() => setSelectedDateFilter('This Week')}>This Week</button></li>
                <li><button className={styles.menuItem} onClick={() => setSelectedDateFilter('This Month')}>This Month</button></li>
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
                  <button className={styles.menuItem} onClick={() => navigate('/admin/clients')}>
                    <Building size={14} />
                    <span>Add Client</span>
                  </button>
                </li>
                <li>
                  <button className={styles.menuItem} onClick={() => navigate('/admin/employees')}>
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
            <AgeDemograph attendanceData={dashboardData?.attendanceTrend || []} />
          </div>
          <div className={styles.col7}>
            <QuickInsights data={dashboardData?.quickInsights} />
          </div>
        </div>

        {/* ---- Row 2: Department Wise Employees, Recent Activities, Upcoming Reminders ---- */}
        <div className={styles.bottomGridRow}>
          <EmployeeDistribution 
            data={dashboardData?.departmentDistribution || [{ role: 'Security', count: 1 }]} 
            loading={loading && !dashboardData}
          />
          <RecentActivities 
            activities={dashboardData?.recentActivities || []} 
            loading={loading && !dashboardData}
          />
          <UpcomingReminders 
            data={dashboardData?.upcomingReminders || []} 
          />
        </div>

        {/* ---- Payroll Summary ---- */}
        <section aria-label="Payroll Summary">
          <PayrollSummary 
            overallData={dashboardData?.payrollSummary?.overall} 
            clientWiseData={dashboardData?.payrollSummary?.clientWise || []}
            loading={loading && !dashboardData}
          />
        </section>

      </div>
    </AdminLayout>
  );
}

export default AdminDashboard;
