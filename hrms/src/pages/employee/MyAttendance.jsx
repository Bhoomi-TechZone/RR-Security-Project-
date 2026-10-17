import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CalendarDays, Clock, Plus, RefreshCw } from 'lucide-react';
import EmployeeAttendanceSummary from '../../components/employee/EmployeeAttendanceSummary';
import EmployeeAttendanceCalendar from '../../components/employee/EmployeeAttendanceCalendar';
import EmployeeAttendanceTable from '../../components/employee/EmployeeAttendanceTable';
import EmployeeAttendanceFilters from '../../components/employee/EmployeeAttendanceFilters';
import EmployeeAttendanceDetails from '../../components/employee/EmployeeAttendanceDetails';
import EmployeeAttendanceCorrectionModal from '../../components/employee/EmployeeAttendanceCorrectionModal';
import EmployeeCorrectionRequestsList from '../../components/employee/EmployeeCorrectionRequestsList';
import Toast from '../../components/common/Toast';
import { getMonthLabel } from '../../data/employeeAttendanceData';
import { useCompany } from '../../context/CompanyContext';
import attendanceService from '../../services/attendanceService';
import authService from '../../services/authService';
import styles from './MyAttendance.module.css';

const generateMonthOptions = () => {
  const current = new Date();
  const options = [];
  for (let i = 0; i < 6; i++) {
    const d = new Date(current.getFullYear(), current.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = `${d.toLocaleDateString('en-US', { month: 'long' })} ${d.getFullYear()}`;
    options.push({ key, label, year: d.getFullYear(), month: d.getMonth() + 1 });
  }
  return options;
};

function MyAttendance() {
  const { activeCompany } = useCompany();
  const activeUser = authService.getCurrentUser() || authService.getUser() || {};
  const compId = activeCompany?.companyId || activeCompany?.id || activeUser?.companyId || 'RRS8392014SEC';

  const [searchParams, setSearchParams] = useSearchParams();
  const availableMonths = useMemo(() => generateMonthOptions(), []);
  const initialMonth = availableMonths[0]?.key || new Date().toISOString().slice(0, 7);

  // Tabs state: 'attendance' | 'corrections' synced with URL
  const [activeTab, setActiveTab] = useState(() => (searchParams.get('tab') === 'corrections' ? 'corrections' : 'attendance'));

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'corrections') {
      setActiveTab('corrections');
    } else {
      setActiveTab('attendance');
    }
  }, [searchParams]);

  // Month & filter states
  const [monthKey, setMonthKey] = useState(initialMonth);
  const [draftMonth, setDraftMonth] = useState(initialMonth);
  const [status, setStatus] = useState('All');
  const [draftStatus, setDraftStatus] = useState('All');
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [records, setRecords] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Correction requests state
  const [correctionRequests, setCorrectionRequests] = useState([]);
  const [isLoadingCorrections, setIsLoadingCorrections] = useState(false);
  const [isCorrectionModalOpen, setIsCorrectionModalOpen] = useState(false);
  const [correctionTargetRecord, setCorrectionTargetRecord] = useState(null);

  // Notification Toast state
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  const [year, monthNumber] = monthKey.split('-').map(Number);
  const monthLabel = getMonthLabel(year, monthNumber);

  // Fetch dynamic attendance records for this month
  const fetchEmployeeAttendance = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await attendanceService.getAttendanceRecords(compId, {
        month: monthKey,
        employeeId: activeUser?.employeeId || activeUser?.id,
        search: activeUser?.employeeId || activeUser?.name || '',
      });

      const list = Array.isArray(data) ? data : (data.records || []);
      const formatted = list.map((r) => {
        const d = new Date(r.date);
        const dayName = !isNaN(d.getTime()) ? d.toLocaleDateString('en-US', { weekday: 'long' }) : '';
        let normalizedStatus = 'Present';
        if (r.status === 'absent') normalizedStatus = 'Absent';
        else if (r.status === 'halfDay') normalizedStatus = 'Half Day';
        else if (r.status === 'onLeave' || r.status === 'leave') normalizedStatus = 'Leave';
        else if (r.status === 'late') normalizedStatus = 'Late';

        return {
          id: r.id || r._id,
          date: r.date,
          day: dayName,
          status: normalizedStatus,
          checkIn: r.checkIn,
          checkOut: r.checkOut,
          workingHours: r.workingHours,
          shift: r.shift || 'General Shift',
          site: r.site || 'Main Site',
          department: r.department || 'Operations',
          employeeName: r.employeeName,
          employeeId: r.employeeId,
        };
      });
      setRecords(formatted);
    } catch (err) {
      console.warn('Failed to load employee attendance:', err.message);
      setRecords([]);
    } finally {
      setIsLoading(false);
    }
  }, [compId, monthKey, activeUser?.employeeId, activeUser?.name]);

  // Fetch Correction Requests submitted by this employee
  const fetchCorrectionRequests = useCallback(async () => {
    try {
      setIsLoadingCorrections(true);
      const allCorrections = await attendanceService.getCorrectionRequests(compId).catch(() => []);
      
      const empId = String(activeUser?.employeeId || activeUser?.id || '').toLowerCase();
      const empName = String(activeUser?.name || '').toLowerCase();

      // Filter corrections specific to this logged in employee
      const myCorrections = (allCorrections || []).filter((c) => {
        const cEmpId = String(c.employeeId || '').toLowerCase();
        const cEmpName = String(c.employeeName || '').toLowerCase();
        return (empId && cEmpId === empId) || (empName && cEmpName.includes(empName));
      });

      setCorrectionRequests(myCorrections);
    } catch (err) {
      console.warn('Failed to fetch employee correction requests:', err.message);
    } finally {
      setIsLoadingCorrections(false);
    }
  }, [compId, activeUser?.employeeId, activeUser?.id, activeUser?.name]);

  useEffect(() => {
    fetchEmployeeAttendance();
  }, [fetchEmployeeAttendance]);

  useEffect(() => {
    fetchCorrectionRequests();
  }, [fetchCorrectionRequests]);

  // Handle open correction modal from row or details drawer or header
  const handleOpenCorrection = (record = null) => {
    setCorrectionTargetRecord(record);
    setIsCorrectionModalOpen(true);
  };

  // Submit correction request to MongoDB
  const handleSubmitCorrection = async (payload) => {
    try {
      await attendanceService.submitCorrectionRequest(compId, payload);
      showToast(`✓ Correction request for ${payload.date} submitted and saved to database. Sent for Admin review.`);
      setIsCorrectionModalOpen(false);
      setCorrectionTargetRecord(null);
      await fetchCorrectionRequests();
      setActiveTab('corrections'); // Switch to corrections tab so user can see it
    } catch (err) {
      console.error('Error submitting correction to database:', err);
      showToast(`Failed to submit correction request to database: ${err.message}`, 'danger');
    }
  };

  // Compute summary statistics
  const summary = useMemo(() => {
    const present = records.filter((r) => r.status === 'Present' || r.status === 'Late').length;
    const absent = records.filter((r) => r.status === 'Absent').length;
    const leave = records.filter((r) => r.status === 'Leave').length;
    const halfDay = records.filter((r) => r.status === 'Half Day').length;
    const workingDays = records.length;
    const rate = workingDays > 0 ? Math.round(((present + halfDay * 0.5) / workingDays) * 100) : 0;

    return {
      workingDays,
      present,
      absent,
      leave,
      halfDay,
      attendanceRate: rate,
    };
  }, [records]);

  const filteredRecords = useMemo(
    () => (status === 'All' ? records : records.filter((record) => record.status.toLowerCase() === status.toLowerCase())),
    [records, status]
  );
  const paginatedRecords = filteredRecords.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const applyFilters = () => {
    setMonthKey(draftMonth);
    setStatus(draftStatus);
    setCurrentPage(1);
  };

  const resetFilters = () => {
    setDraftMonth(initialMonth);
    setDraftStatus('All');
    setMonthKey(initialMonth);
    setStatus('All');
    setCurrentPage(1);
  };

  const changeMonth = (offset) => {
    const next = new Date(year, monthNumber - 1 + offset, 1);
    const nextKey = `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}`;
    setMonthKey(nextKey);
    setDraftMonth(nextKey);
    setStatus('All');
    setDraftStatus('All');
    setCurrentPage(1);
  };

  const pendingCorrectionsCount = correctionRequests.filter(
    (r) => (r.status || '').toLowerCase().includes('pending')
  ).length;

  return (
    <main className={styles.page}>
      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div className={styles.container}>
        {/* Page Header */}
        <header className={styles.pageHeader}>
          <div>
            <p className={styles.eyebrow}>Self-Service Portal</p>
            <h1>{activeTab === 'corrections' ? 'My Correction Requests' : 'Attendance Register'}</h1>
            <p>
              {activeTab === 'corrections'
                ? 'Track the status of your submitted punch adjustments and attendance corrections.'
                : 'View your monthly punch logs, attendance statistics, and working hours.'}
            </p>
          </div>

          <div className={styles.headerActions}>
            {activeTab === 'attendance' && (
              <label className={styles.monthSelector}>
                Month
                <select
                  value={monthKey}
                  onChange={(event) => {
                    setMonthKey(event.target.value);
                    setDraftMonth(event.target.value);
                  }}
                >
                  {availableMonths.map((m) => (
                    <option key={m.key} value={m.key}>{m.label}</option>
                  ))}
                </select>
              </label>
            )}
          </div>
        </header>

        {/* VIEW 1: ATTENDANCE REGISTER */}
        {activeTab === 'attendance' && (
          <>
            <EmployeeAttendanceSummary summary={summary} />

            <section className={styles.overview}>
              <div>
                <p className={styles.eyebrow}>Attendance Overview</p>
                <h2>{monthLabel}</h2>
                <p>Your dynamic attendance summary for {monthLabel}.</p>
              </div>
              <strong className={styles.rate}>{summary.attendanceRate}%</strong>
              <div className={styles.progress}>
                <span style={{ width: `${summary.attendanceRate}%` }} />
              </div>
              <div className={styles.overviewStats}>
                <span><i className={styles.presentDot} />Present: <b>{summary.present}</b></span>
                <span><i className={styles.absentDot} />Absent: <b>{summary.absent}</b></span>
                <span><i className={styles.leaveDot} />Leave: <b>{summary.leave}</b></span>
              </div>
            </section>

            <EmployeeAttendanceCalendar
              records={records}
              monthLabel={monthLabel}
              monthKey={monthKey}
              year={year}
              monthNumber={monthNumber}
              onPreviousMonth={() => changeMonth(-1)}
              onNextMonth={() => changeMonth(1)}
            />

            <EmployeeAttendanceFilters
              draftMonth={draftMonth}
              draftStatus={draftStatus}
              months={availableMonths}
              onMonthChange={setDraftMonth}
              onStatusChange={setDraftStatus}
              onApply={applyFilters}
              onReset={resetFilters}
            />

            {isLoading ? (
              <section className={styles.loading}>Loading live attendance records...</section>
            ) : (
              <EmployeeAttendanceTable
                records={paginatedRecords}
                totalRecords={filteredRecords.length}
                currentPage={currentPage}
                pageSize={pageSize}
                onPageChange={setCurrentPage}
                onSelect={setSelectedRecord}
                onRequestCorrection={handleOpenCorrection}
              />
            )}
          </>
        )}

        {/* TAB 2: CORRECTION REQUESTS */}
        {activeTab === 'corrections' && (
          <EmployeeCorrectionRequestsList
            requests={correctionRequests}
            onRequestNew={() => handleOpenCorrection(null)}
            onRefresh={fetchCorrectionRequests}
            isLoading={isLoadingCorrections}
          />
        )}
      </div>

      {/* Details Drawer */}
      <EmployeeAttendanceDetails
        record={selectedRecord}
        onClose={() => setSelectedRecord(null)}
        onRequestCorrection={handleOpenCorrection}
      />

      {/* Correction Request Modal */}
      <EmployeeAttendanceCorrectionModal
        isOpen={isCorrectionModalOpen}
        record={correctionTargetRecord}
        employeeInfo={{
          employeeId: activeUser?.employeeId || activeUser?.id,
          name: activeUser?.name,
          companyName: activeUser?.companyName || activeCompany?.name
        }}
        onClose={() => {
          setIsCorrectionModalOpen(false);
          setCorrectionTargetRecord(null);
        }}
        onSubmit={handleSubmitCorrection}
      />
    </main>
  );
}

export default MyAttendance;
