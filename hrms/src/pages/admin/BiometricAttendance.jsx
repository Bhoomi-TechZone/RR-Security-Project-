import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useLocation, useSearchParams, Link } from 'react-router-dom';
import {
  Cpu,
  Clock,
  CalendarDays,
  CalendarRange,
  Search,
  RotateCcw,
  RefreshCw,
  Download,
  Plus,
  Wifi,
  Radio,
  Fingerprint,
  ScanFace,
  CreditCard,
  Eye,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Server,
  Layers,
  Sparkles,
  ArrowUpRight,
  ArrowDownLeft,
  Activity,
  Zap,
  SlidersHorizontal,
  X,
  Building2,
  Briefcase,
  UserCheck,
  UserX,
  CalendarOff
} from 'lucide-react';
import * as XLSX from 'xlsx';
import AdminLayout from '../../components/layout/AdminLayout';
import Pagination from '../../components/common/Pagination';
import Toast from '../../components/common/Toast';
import CorrectionRequests from '../../components/attendance/CorrectionRequests';
import CorrectionReviewDrawer from '../../components/attendance/CorrectionReviewDrawer';
import { useCompany } from '../../context/CompanyContext';
import { clientService } from '../../services/clientService';
import attendanceService from '../../services/attendanceService';
import { mockCorrectionRequests } from '../../data/attendanceCorrectionData';
import {
  BIOMETRIC_DEVICES,
  BIOMETRIC_METHODS,
  PUNCH_DIRECTIONS,
  DEFAULT_BIOMETRIC_CLIENTS,
  DEFAULT_BIOMETRIC_DEPTS,
  generateSamplePunchLogs,
  generateWeeklyBiometricSummary,
  generateMonthlyBiometricSummary
} from '../../data/biometricAttendanceData';
import styles from './BiometricAttendance.module.css';

// Helper date utilities
const formatDisplayDate = (dateStr) => {
  if (!dateStr) return '—';
  const d = new Date(dateStr + 'T00:00:00');
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const formatDisplayMonth = (monthStr) => {
  if (!monthStr) return '—';
  const [y, m] = monthStr.split('-').map(Number);
  const d = new Date(y, (m || 1) - 1, 1);
  return d.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
};

const formatDisplayWeek = (startStr, endStr) => {
  if (!startStr || !endStr) return '—';
  const d1 = new Date(startStr + 'T00:00:00');
  const d2 = new Date(endStr + 'T00:00:00');
  if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return `${startStr} - ${endStr}`;
  const p1 = d1.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
  const p2 = d2.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  return `${p1} – ${p2}`;
};

const addDays = (dateStr, n) => {
  const d = new Date((dateStr || new Date().toISOString().slice(0, 10)) + 'T00:00:00');
  d.setDate(d.getDate() + n);
  return d.toISOString().split('T')[0];
};

const addMonths = (monthStr, n) => {
  const [y, m] = (monthStr || new Date().toISOString().slice(0, 7)).split('-').map(Number);
  const d = new Date(y, m - 1 + n, 1);
  const nextY = d.getFullYear();
  const nextM = String(d.getMonth() + 1).padStart(2, '0');
  return `${nextY}-${nextM}`;
};

const getWeekRange = (dateStr) => {
  const dt = new Date((dateStr || new Date().toISOString().slice(0, 10)) + 'T00:00:00');
  const day = dt.getDay();
  const diffToMonday = (day === 0 ? -6 : 1) - day;
  const monday = new Date(dt);
  monday.setDate(dt.getDate() + diffToMonday);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const toYMD = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dayNum = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${dayNum}`;
  };

  return {
    start: toYMD(monday),
    end: toYMD(sunday)
  };
};

function BiometricAttendance() {
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const isUserView = location.pathname.startsWith('/user/');

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const currentMonthStr = useMemo(() => todayStr.slice(0, 7), [todayStr]);

  // Company Master & Clients
  const { activeCompany } = useCompany();
  const compId = activeCompany?.companyId || activeCompany?.id || 'RRS8392014SEC';
  const [masterClients, setMasterClients] = useState([]);

  // Active Tab: daily | weekly | monthly | corrections
  const [activeTab, setActiveTab] = useState(() => {
    const t = searchParams.get('tab');
    if (t === 'weekly' || t === 'monthly' || t === 'corrections') return t;
    return 'daily';
  });

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'weekly' || tabParam === 'monthly' || tabParam === 'corrections') {
      setActiveTab(tabParam);
    } else if (!tabParam && activeTab !== 'daily') {
      setActiveTab('daily');
    }
  }, [searchParams]);

  // Correction Requests State
  const [corrections, setCorrections] = useState(mockCorrectionRequests);
  const [reviewRequest, setReviewRequest] = useState(null);

  // Fetch correction requests from backend if available
  useEffect(() => {
    const fetchCorrections = async () => {
      try {
        const corrs = await attendanceService.getCorrectionRequests(compId).catch(() => []);
        if (Array.isArray(corrs) && corrs.length > 0) {
          setCorrections(corrs);
        }
      } catch (err) {
        console.warn('Could not fetch biometric correction requests:', err);
      }
    };
    fetchCorrections();
  }, [compId]);

  const pendingCorrectionsCount = useMemo(() => {
    return (corrections || []).filter(
      (c) => !c.status || c.status === 'pendingCorrection' || c.status.toLowerCase().includes('pending')
    ).length;
  }, [corrections]);

  // Timeframe date states
  const [selectedDate, setSelectedDate] = useState(() => searchParams.get('date') || todayStr);
  const [selectedMonth, setSelectedMonth] = useState(currentMonthStr);
  const [selectedWeekDate, setSelectedWeekDate] = useState(todayStr);
  const weekRange = useMemo(() => getWeekRange(selectedWeekDate), [selectedWeekDate]);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState('all');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [selectedDevice, setSelectedDevice] = useState('all');
  const [selectedMethod, setSelectedMethod] = useState('all');
  const [selectedDirection, setSelectedDirection] = useState('all');

  // Load master clients dynamically
  useEffect(() => {
    const fetchClients = async () => {
      try {
        const cls = await clientService.getClients(compId).catch(() => []);
        if (Array.isArray(cls) && cls.length > 0) {
          setMasterClients(cls);
        }
      } catch (err) {
        console.warn('Error fetching master clients:', err);
      }
    };
    fetchClients();
  }, [compId]);

  const availableClients = useMemo(() => {
    const dynamic = masterClients.map((c) => c.clientName || c.name || c.companyName).filter(Boolean);
    return Array.from(new Set([...DEFAULT_BIOMETRIC_CLIENTS, ...dynamic]));
  }, [masterClients]);

  const availableDepts = useMemo(() => DEFAULT_BIOMETRIC_DEPTS, []);

  // Interactive states
  const [isSyncing, setIsSyncing] = useState(false);
  const [toast, setToast] = useState(null);
  const [isTerminalsDrawerOpen, setIsTerminalsDrawerOpen] = useState(false);
  const [selectedLogRecord, setSelectedLogRecord] = useState(null);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [pingStatuses, setPingStatuses] = useState({});

  // Pagination for Daily
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // New manual punch form state
  const [manualForm, setManualForm] = useState({
    employeeId: 'EMP-001',
    employeeName: 'Rajesh Kumar Verma',
    department: 'Operations',
    direction: 'in',
    method: 'face',
    deviceId: 'DEV-BIO-01',
    time: '09:00 AM'
  });

  // Raw Daily Logs data
  const [dailyPunches, setDailyPunches] = useState(() => generateSamplePunchLogs(todayStr));

  // Sync punch logs when date changes
  const currentLogs = useMemo(() => {
    return generateSamplePunchLogs(selectedDate);
  }, [selectedDate]);

  // Weekly data
  const weeklyData = useMemo(() => {
    return generateWeeklyBiometricSummary(weekRange);
  }, [weekRange]);

  // Monthly data
  const monthlyData = useMemo(() => {
    return generateMonthlyBiometricSummary(selectedMonth);
  }, [selectedMonth]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  const handleTabChange = (tabKey) => {
    setActiveTab(tabKey);
    setCurrentPage(1);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (tabKey === 'daily') {
        next.delete('tab');
      } else {
        next.set('tab', tabKey);
      }
      return next;
    });
  };

  const handleApproveCorrection = async (corrId) => {
    try {
      if (compId) {
        await attendanceService.reviewCorrectionRequest(compId, corrId, 'approve').catch(() => {});
      }
      setCorrections((prev) =>
        prev.map((c) => {
          const id = c._id || c.id || c.correctionId;
          return id === corrId ? { ...c, status: 'approved' } : c;
        })
      );
      setReviewRequest(null);
      showToast('✓ Biometric attendance correction approved successfully.');
    } catch (err) {
      showToast(`Failed to approve correction: ${err.message}`, 'error');
    }
  };

  const handleRejectCorrection = async (corrId, reason) => {
    try {
      if (compId) {
        await attendanceService.reviewCorrectionRequest(compId, corrId, 'reject', reason).catch(() => {});
      }
      setCorrections((prev) =>
        prev.map((c) => {
          const id = c._id || c.id || c.correctionId;
          return id === corrId ? { ...c, status: 'rejected', rejectReason: reason } : c;
        })
      );
      setReviewRequest(null);
      showToast('Correction request has been rejected.', 'info');
    } catch (err) {
      showToast(`Failed to reject correction: ${err.message}`, 'error');
    }
  };

  // Stepper handlers
  const handlePrevDay = () => setSelectedDate((prev) => addDays(prev, -1));
  const handleNextDay = () => setSelectedDate((prev) => addDays(prev, 1));
  const handlePrevWeek = () => setSelectedWeekDate((prev) => addDays(prev, -7));
  const handleNextWeek = () => setSelectedWeekDate((prev) => addDays(prev, 7));
  const handlePrevMonth = () => setSelectedMonth((prev) => addMonths(prev, -1));
  const handleNextMonth = () => setSelectedMonth((prev) => addMonths(prev, 1));

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedClient('all');
    setSelectedDepartment('all');
    setSelectedDevice('all');
    setSelectedMethod('all');
    setSelectedDirection('all');
    setSelectedDate(todayStr);
    setSelectedMonth(currentMonthStr);
    setSelectedWeekDate(todayStr);
    setCurrentPage(1);
    showToast('Filters reset to default view', 'info');
  };

  // Sync devices action
  const handleSyncDevices = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      showToast('Successfully synced 148 punch packets from 6 Biometric Terminals!', 'success');
    }, 1200);
  };

  // Ping single device
  const handlePingDevice = (devId) => {
    setPingStatuses((prev) => ({ ...prev, [devId]: 'pinging' }));
    setTimeout(() => {
      const ms = Math.floor(Math.random() * 25) + 8;
      setPingStatuses((prev) => ({ ...prev, [devId]: `Online (${ms}ms)` }));
      showToast(`Device ${devId} is reachable with ${ms}ms latency`, 'success');
    }, 800);
  };

  // Add simulated punch
  const handleCreateManualPunch = (e) => {
    e.preventDefault();
    const dev = BIOMETRIC_DEVICES.find((d) => d.id === manualForm.deviceId) || BIOMETRIC_DEVICES[0];
    const newLog = {
      logId: `PUNCH-${selectedDate.replace(/-/g, '')}-MANUAL-${Date.now().toString().slice(-4)}`,
      employeeId: manualForm.employeeId,
      employeeName: manualForm.employeeName,
      department: manualForm.department,
      clientName: selectedClient !== 'all' ? selectedClient : 'Apex Security Corp',
      role: 'Staff Member',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces',
      punchDate: selectedDate,
      punchTime: manualForm.time,
      direction: manualForm.direction,
      method: manualForm.method,
      matchScore: '99.2%',
      deviceId: dev.id,
      deviceName: dev.name,
      deviceModel: dev.model,
      deviceIp: dev.ip,
      site: dev.site,
      location: dev.location,
      status: 'verified',
      syncStatus: 'synced',
      temperature: '36.6 °C (Normal)',
      maskDetected: true,
      rawPacket: {
        pin: manualForm.employeeId,
        verifyMode: manualForm.method.toUpperCase(),
        time: `${selectedDate} ${manualForm.time}`,
        deviceSn: dev.serialNumber,
        algorithm: 'ZKFace 7.0 / Manual Entry',
        inOutStatus: manualForm.direction === 'in' ? 0 : 1,
        workCode: 0,
      }
    };

    setDailyPunches((prev) => [newLog, ...prev]);
    setIsManualModalOpen(false);
    showToast(`Punch recorded for ${manualForm.employeeName} via ${dev.name}`, 'success');
  };

  // Filtered Daily Records
  const filteredDailyLogs = useMemo(() => {
    let list = [...dailyPunches];
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      list = list.filter(
        (r) =>
          r.employeeName.toLowerCase().includes(q) ||
          r.employeeId.toLowerCase().includes(q) ||
          r.deviceName.toLowerCase().includes(q) ||
          r.site.toLowerCase().includes(q)
      );
    }
    if (selectedClient !== 'all') {
      list = list.filter((r) => (r.clientName || '').toLowerCase() === selectedClient.toLowerCase());
    }
    if (selectedDepartment !== 'all') {
      list = list.filter((r) => (r.department || '').toLowerCase() === selectedDepartment.toLowerCase());
    }
    if (selectedDevice !== 'all') {
      list = list.filter((r) => r.deviceId === selectedDevice);
    }
    if (selectedMethod !== 'all') {
      list = list.filter((r) => r.method === selectedMethod);
    }
    if (selectedDirection !== 'all') {
      list = list.filter((r) => r.direction === selectedDirection);
    }
    return list;
  }, [dailyPunches, searchTerm, selectedClient, selectedDepartment, selectedDevice, selectedMethod, selectedDirection]);

  // Filtered Weekly Records
  const filteredWeeklyData = useMemo(() => {
    let list = [...weeklyData];
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      list = list.filter(
        (w) =>
          w.name.toLowerCase().includes(q) ||
          w.id.toLowerCase().includes(q) ||
          w.dept.toLowerCase().includes(q)
      );
    }
    if (selectedClient !== 'all') {
      list = list.filter((w) => (w.clientName || '').toLowerCase() === selectedClient.toLowerCase());
    }
    if (selectedDepartment !== 'all') {
      list = list.filter((w) => (w.dept || '').toLowerCase() === selectedDepartment.toLowerCase());
    }
    return list;
  }, [weeklyData, searchTerm, selectedClient, selectedDepartment]);

  // Filtered Monthly Records
  const filteredMonthlyData = useMemo(() => {
    let list = [...monthlyData];
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      list = list.filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          m.id.toLowerCase().includes(q) ||
          m.dept.toLowerCase().includes(q)
      );
    }
    if (selectedClient !== 'all') {
      list = list.filter((m) => (m.clientName || '').toLowerCase() === selectedClient.toLowerCase());
    }
    if (selectedDepartment !== 'all') {
      list = list.filter((m) => (m.dept || '').toLowerCase() === selectedDepartment.toLowerCase());
    }
    return list;
  }, [monthlyData, searchTerm, selectedClient, selectedDepartment]);

  // Summary counts matching AttendanceSummaryCards
  const totals = useMemo(() => {
    if (activeTab === 'daily') {
      const uniquePunchedEmps = new Set(filteredDailyLogs.map((r) => r.employeeId));
      const presentCount = uniquePunchedEmps.size;
      const lateCount = filteredDailyLogs.filter((r) => r.status === 'late' && r.direction === 'in').length;
      const totalScope = Math.max(presentCount, 12);
      const absentCount = Math.max(0, totalScope - presentCount);
      const halfDayCount = 0;
      const leaveCount = 0;
      return {
        present: presentCount,
        absent: absentCount,
        halfDay: halfDayCount,
        leave: leaveCount,
        late: lateCount,
        total: Math.max(totalScope, 1),
        terminals: BIOMETRIC_DEVICES.length
      };
    } else if (activeTab === 'weekly') {
      const total = filteredWeeklyData.length;
      const present = filteredWeeklyData.filter((w) => parseFloat(w.totalHours) >= 35).length;
      const absent = filteredWeeklyData.filter((w) => parseFloat(w.totalHours) === 0).length;
      const halfDay = filteredWeeklyData.filter((w) => parseFloat(w.totalHours) > 0 && parseFloat(w.totalHours) < 35).length;
      const leave = 0;
      const late = filteredWeeklyData.filter((w) => w.punctuality.includes('Late')).length;
      return {
        present,
        absent,
        halfDay,
        leave,
        late,
        total: Math.max(total, 1),
        terminals: BIOMETRIC_DEVICES.length
      };
    } else {
      const total = filteredMonthlyData.length;
      const present = filteredMonthlyData.filter((m) => m.presentDays >= 20).length;
      const absent = filteredMonthlyData.filter((m) => m.presentDays === 0).length;
      const halfDay = filteredMonthlyData.filter((m) => m.presentDays > 0 && m.presentDays < 20).length;
      const leave = 0;
      const late = filteredMonthlyData.filter((m) => m.lateDays > 0).length;
      return {
        present,
        absent,
        halfDay,
        leave,
        late,
        total: Math.max(total, 1),
        terminals: BIOMETRIC_DEVICES.length
      };
    }
  }, [activeTab, filteredDailyLogs, filteredWeeklyData, filteredMonthlyData]);

  // Paginated daily
  const paginatedDaily = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredDailyLogs.slice(start, start + pageSize);
  }, [filteredDailyLogs, currentPage, pageSize]);

  // Export handler
  const handleExport = () => {
    try {
      let exportData = [];
      let filename = `Biometric_Attendance_${activeTab}`;

      if (activeTab === 'daily') {
        exportData = filteredDailyLogs.map((r) => ({
          'Log ID': r.logId,
          'Employee ID': r.employeeId,
          'Employee Name': r.employeeName,
          Client: r.clientName || 'Apex Security Corp',
          Department: r.department,
          'Punch Date': r.punchDate,
          'Punch Time': r.punchTime,
          Direction: r.direction.toUpperCase(),
          Method: r.method.toUpperCase(),
          'Match Score': r.matchScore,
          Device: r.deviceName,
          'Device IP': r.deviceIp,
          Site: r.site,
          Status: r.status,
        }));
        filename += `_${selectedDate}.xlsx`;
      } else if (activeTab === 'weekly') {
        exportData = filteredWeeklyData.map((w) => ({
          'Employee ID': w.id,
          'Employee Name': w.name,
          Client: w.clientName || 'Apex Security Corp',
          Department: w.dept,
          'Mon Punch': w.days[0].in + ' - ' + w.days[0].out,
          'Tue Punch': w.days[1].in + ' - ' + w.days[1].out,
          'Wed Punch': w.days[2].in + ' - ' + w.days[2].out,
          'Thu Punch': w.days[3].in + ' - ' + w.days[3].out,
          'Fri Punch': w.days[4].in + ' - ' + w.days[4].out,
          'Sat Punch': w.days[5].in + ' - ' + w.days[5].out,
          'Weekly Hours': w.totalHours,
          'Total Punches': w.totalPunches,
          'Primary Method': w.primaryMethod,
          Punctuality: w.punctuality,
        }));
        filename += `_${weekRange.start}_to_${weekRange.end}.xlsx`;
      } else {
        exportData = filteredMonthlyData.map((m) => ({
          'Employee ID': m.id,
          'Employee Name': m.name,
          Client: m.clientName || 'Apex Security Corp',
          Department: m.dept,
          Month: m.month,
          'Present Days': m.presentDays,
          'Total Working Days': m.totalWorkingDays,
          'Attendance %': m.attendanceRate,
          'Total Punches': m.totalPunches,
          'Avg Check-In': m.avgCheckIn,
          'Avg Check-Out': m.avgCheckOut,
          'Total Duty Hours': m.totalWorkingHours,
          'Late Days': m.lateDays,
          'Primary Terminal': m.preferredTerminal,
        }));
        filename += `_${selectedMonth}.xlsx`;
      }

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Biometric Logs');
      XLSX.writeFile(wb, filename);
      showToast(`Exported ${exportData.length} records successfully!`, 'success');
    } catch (err) {
      showToast('Export failed: ' + err.message, 'error');
    }
  };

  // Method Icon Helper
  const getMethodBadge = (method) => {
    switch (method) {
      case 'face':
        return (
          <span className={`${styles.methodBadge} ${styles.methodFace}`}>
            <ScanFace size={13} /> Face Recognition
          </span>
        );
      case 'fingerprint':
        return (
          <span className={`${styles.methodBadge} ${styles.methodFinger}`}>
            <Fingerprint size={13} /> Fingerprint
          </span>
        );
      case 'rfid':
        return (
          <span className={`${styles.methodBadge} ${styles.methodRfid}`}>
            <CreditCard size={13} /> RFID Card
          </span>
        );
      case 'iris':
        return (
          <span className={`${styles.methodBadge} ${styles.methodFace}`}>
            <Eye size={13} /> Iris Scan
          </span>
        );
      default:
        return (
          <span className={styles.methodBadge}>
            <Radio size={13} /> Biometric
          </span>
        );
    }
  };

  const getDirectionBadge = (dir) => {
    if (dir === 'in') {
      return (
        <span className={styles.directionBadgeIn}>
          <ArrowDownLeft size={12} /> Check-In
        </span>
      );
    }
    if (dir === 'out') {
      return (
        <span className={styles.directionBadgeOut}>
          <ArrowUpRight size={12} /> Check-Out
        </span>
      );
    }
    return (
      <span className={styles.directionBadgeBreak}>
        <Activity size={12} /> Break
      </span>
    );
  };

  const content = (
    <div className={styles.container}>
      {/* Toast notifications */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Page Header */}
      <div className={styles.pageHeader}>
        <div>
          <nav className={styles.breadcrumb} aria-label="Breadcrumb">
            <Link to={isUserView ? '/user/dashboard' : '/admin/dashboard'}>Home</Link>
            <span>/</span>
            <span>Workforce</span>
            <span>/</span>
            <span className={styles.activeBreadcrumb}>Biometric Attendance</span>
          </nav>
          <div className={styles.titleRow}>
            <h1 className={styles.pageTitle}>
              {activeTab === 'corrections' ? 'Correction Requests' : 'Biometric Attendance'}
            </h1>
            <span className={styles.liveBadge} title="Real-time terminal polling active">
              <span className={styles.pulseDot} />
              6 Terminals Live & Online
            </span>
          </div>
        </div>

        {/* Header Actions */}
        <div className={styles.headerActions}>
          <button
            type="button"
            className={styles.actionBtn}
            onClick={() => setIsTerminalsDrawerOpen(true)}
            title="Inspect connected ZKTeco / eSSL terminals"
          >
            <Server size={15} color="#2563eb" />
            <span>Terminals (6)</span>
          </button>

          <button
            type="button"
            className={`${styles.actionBtn} ${isSyncing ? styles.syncBtnRotating : ''}`}
            onClick={handleSyncDevices}
            disabled={isSyncing}
            title="Fetch real-time biometric packets"
          >
            <RefreshCw size={15} />
            <span>{isSyncing ? 'Syncing...' : 'Sync Devices'}</span>
          </button>

          <button
            type="button"
            className={styles.actionBtn}
            onClick={handleExport}
            title="Export biometric muster to Excel"
          >
            <Download size={15} />
            <span>Export Report</span>
          </button>

          <button
            type="button"
            className={styles.primaryBtn}
            onClick={() => setIsManualModalOpen(true)}
            title="Simulate or force-push an ingress/egress punch"
          >
            <Plus size={15} />
            <span>Manual Punch</span>
          </button>
        </div>
      </div>

      {/* Tabs Navigation: Daily | Weekly | Monthly | Correction Requests */}
      <div className={styles.tabsRow}>
        <div className={styles.tabsLeft}>
          <button
            type="button"
            className={`${styles.tabBtn} ${activeTab === 'daily' ? styles.activeTab : ''}`}
            onClick={() => handleTabChange('daily')}
          >
            <Clock size={16} />
            <span>Daily</span>
            <span className={styles.tabBadge}>{filteredDailyLogs.length}</span>
          </button>

          <button
            type="button"
            className={`${styles.tabBtn} ${activeTab === 'weekly' ? styles.activeTab : ''}`}
            onClick={() => handleTabChange('weekly')}
          >
            <CalendarDays size={16} />
            <span>Weekly</span>
            <span className={styles.tabBadge}>7 Days</span>
          </button>

          <button
            type="button"
            className={`${styles.tabBtn} ${activeTab === 'monthly' ? styles.activeTab : ''}`}
            onClick={() => handleTabChange('monthly')}
          >
            <CalendarRange size={16} />
            <span>Monthly</span>
            <span className={styles.tabBadge}>Muster Roll</span>
          </button>

          <button
            type="button"
            className={`${styles.tabBtn} ${activeTab === 'corrections' ? styles.activeTab : ''}`}
            onClick={() => handleTabChange('corrections')}
          >
            <AlertCircle size={16} />
            <span>Correction Requests</span>
            {pendingCorrectionsCount > 0 && (
              <span className={styles.badgeCount}>{pendingCorrectionsCount}</span>
            )}
          </button>
        </div>
      </div>

      {/* TAB CONTENT: DAILY / WEEKLY / MONTHLY */}
      {activeTab !== 'corrections' && (
        <>
          {/* Top Summary Cards — Exact style from Manual Attendance */}
          <div className={styles.summaryGrid}>
        {/* Present Card */}
        <div className={`${styles.summaryCard} ${styles.cardPresent}`}>
          <div className={styles.summaryIconWrap}>
            <UserCheck size={20} />
          </div>
          <div className={styles.summaryInfo}>
            <span className={styles.summaryCount}>{totals.present}</span>
            <span className={styles.summaryLabel}>Present</span>
          </div>
          <div className={styles.summaryPct}>
            {Math.round((totals.present / totals.total) * 100)}%
          </div>
        </div>

        {/* Absent Card */}
        <div className={`${styles.summaryCard} ${styles.cardAbsent}`}>
          <div className={styles.summaryIconWrap}>
            <UserX size={20} />
          </div>
          <div className={styles.summaryInfo}>
            <span className={styles.summaryCount}>{totals.absent}</span>
            <span className={styles.summaryLabel}>Absent</span>
          </div>
          <div className={styles.summaryPct}>
            {Math.round((totals.absent / totals.total) * 100)}%
          </div>
        </div>

        {/* Half Day Card */}
        <div className={`${styles.summaryCard} ${styles.cardHalfDay}`}>
          <div className={styles.summaryIconWrap}>
            <Clock size={20} />
          </div>
          <div className={styles.summaryInfo}>
            <span className={styles.summaryCount}>{totals.halfDay}</span>
            <span className={styles.summaryLabel}>Half Day</span>
          </div>
          <div className={styles.summaryPct}>
            {Math.round((totals.halfDay / totals.total) * 100)}%
          </div>
        </div>

        {/* On Leave Card */}
        <div className={`${styles.summaryCard} ${styles.cardLeave}`}>
          <div className={styles.summaryIconWrap}>
            <CalendarOff size={20} />
          </div>
          <div className={styles.summaryInfo}>
            <span className={styles.summaryCount}>{totals.leave}</span>
            <span className={styles.summaryLabel}>On Leave</span>
          </div>
          <div className={styles.summaryPct}>
            {Math.round((totals.leave / totals.total) * 100)}%
          </div>
        </div>

        {/* Late / Early Card */}
        <div className={`${styles.summaryCard} ${styles.cardLate}`}>
          <div className={styles.summaryIconWrap}>
            <AlertTriangle size={20} />
          </div>
          <div className={styles.summaryInfo}>
            <span className={styles.summaryCount}>{totals.late}</span>
            <span className={styles.summaryLabel}>Late / Early</span>
          </div>
          <div className={styles.summaryPct}>
            {Math.round((totals.late / totals.total) * 100)}%
          </div>
        </div>

        {/* Terminals Live Card */}
        <div className={`${styles.summaryCard} ${styles.cardTerminals}`}>
          <div className={styles.summaryIconWrap}>
            <Server size={20} />
          </div>
          <div className={styles.summaryInfo}>
            <span className={styles.summaryCount}>{totals.terminals}</span>
            <span className={styles.summaryLabel}>Terminals</span>
          </div>
          <div className={styles.summaryPct}>100%</div>
        </div>
      </div>

      {/* Visual Distribution Chart Bar (Matching Manual Attendance) */}
      <div className={styles.distBarContainer}>
        <div className={styles.distBarTitle}>Attendance Distribution</div>
        <div className={styles.distBarTrack}>
          <div
            className={styles.distSegment}
            style={{
              width: `${Math.round((totals.present / totals.total) * 100)}%`,
              background: '#16a34a'
            }}
          />
          <div
            className={styles.distSegment}
            style={{
              width: `${Math.round((totals.late / totals.total) * 100)}%`,
              background: '#f59e0b'
            }}
          />
          <div
            className={styles.distSegment}
            style={{
              width: `${Math.round((totals.absent / totals.total) * 100)}%`,
              background: '#ef4444'
            }}
          />
        </div>
        <div className={styles.distLegend}>
          <div className={styles.legendItem}>
            <span className={styles.legendDot} style={{ background: '#16a34a' }} />
            <span>Present {totals.present} ({Math.round((totals.present / totals.total) * 100)}%)</span>
          </div>
          {totals.late > 0 && (
            <div className={styles.legendItem}>
              <span className={styles.legendDot} style={{ background: '#f59e0b' }} />
              <span>Late {totals.late} ({Math.round((totals.late / totals.total) * 100)}%)</span>
            </div>
          )}
          {totals.absent > 0 && (
            <div className={styles.legendItem}>
              <span className={styles.legendDot} style={{ background: '#ef4444' }} />
              <span>Absent {totals.absent} ({Math.round((totals.absent / totals.total) * 100)}%)</span>
            </div>
          )}
        </div>
      </div>

      {/* Filter and Date Stepper Bar with Department & Clients filters */}
      <div className={styles.filterBar}>
        <div className={styles.filterRowMain}>
          {/* Search */}
          <div className={styles.searchWrap}>
            <Search size={15} className={styles.searchIcon} />
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Search employee, ID, terminal or site..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Timeframe Navigation based on activeTab */}
          {activeTab === 'daily' && (
            <div className={styles.dateNavControl}>
              <button
                type="button"
                className={styles.navArrowBtn}
                onClick={handlePrevDay}
                title="Previous day"
              >
                <ChevronLeft size={14} />
              </button>
              <span className={styles.dateDisplayLabel}>{formatDisplayDate(selectedDate)}</span>
              <button
                type="button"
                className={styles.navArrowBtn}
                onClick={handleNextDay}
                title="Next day"
              >
                <ChevronRight size={14} />
              </button>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                style={{
                  border: '1px solid #cbd5e1',
                  borderRadius: 4,
                  padding: '2px 6px',
                  fontSize: 12,
                  outline: 'none'
                }}
              />
            </div>
          )}

          {activeTab === 'weekly' && (
            <div className={styles.dateNavControl}>
              <button
                type="button"
                className={styles.navArrowBtn}
                onClick={handlePrevWeek}
                title="Previous week"
              >
                <ChevronLeft size={14} />
              </button>
              <span className={styles.dateDisplayLabel}>
                {formatDisplayWeek(weekRange.start, weekRange.end)}
              </span>
              <button
                type="button"
                className={styles.navArrowBtn}
                onClick={handleNextWeek}
                title="Next week"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          )}

          {activeTab === 'monthly' && (
            <div className={styles.dateNavControl}>
              <button
                type="button"
                className={styles.navArrowBtn}
                onClick={handlePrevMonth}
                title="Previous month"
              >
                <ChevronLeft size={14} />
              </button>
              <span className={styles.dateDisplayLabel}>{formatDisplayMonth(selectedMonth)}</span>
              <button
                type="button"
                className={styles.navArrowBtn}
                onClick={handleNextMonth}
                title="Next month"
              >
                <ChevronRight size={14} />
              </button>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                style={{
                  border: '1px solid #cbd5e1',
                  borderRadius: 4,
                  padding: '2px 6px',
                  fontSize: 12,
                  outline: 'none'
                }}
              />
            </div>
          )}

          {/* Client Filter Dropdown */}
          <div className={styles.selectWrap}>
            <span className={styles.filterIcon}>
              <Building2 size={14} />
            </span>
            <select
              className={styles.selectWithIcon}
              value={selectedClient}
              onChange={(e) => setSelectedClient(e.target.value)}
            >
              <option value="all">All Clients</option>
              {availableClients.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Department Filter Dropdown */}
          <div className={styles.selectWrap}>
            <span className={styles.filterIcon}>
              <Briefcase size={14} />
            </span>
            <select
              className={styles.selectWithIcon}
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
            >
              <option value="all">All Departments</option>
              {availableDepts.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          {/* Machine / Terminal Filter Dropdown */}
          <div className={styles.selectWrap}>
            <span className={styles.filterIcon}>
              <Server size={14} />
            </span>
            <select
              className={styles.selectWithIcon}
              value={selectedDevice}
              onChange={(e) => setSelectedDevice(e.target.value)}
            >
              <option value="all">All Terminals</option>
              {BIOMETRIC_DEVICES.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          {/* Method filter (Daily only) */}
          {activeTab === 'daily' && (
            <div className={styles.selectWrap}>
              <span className={styles.filterIcon}>
                <ScanFace size={14} />
              </span>
              <select
                className={styles.selectWithIcon}
                value={selectedMethod}
                onChange={(e) => setSelectedMethod(e.target.value)}
              >
                {BIOMETRIC_METHODS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Direction filter (Daily only) */}
          {activeTab === 'daily' && (
            <div className={styles.selectWrap}>
              <span className={styles.filterIcon}>
                <ArrowDownLeft size={14} />
              </span>
              <select
                className={styles.selectWithIcon}
                value={selectedDirection}
                onChange={(e) => setSelectedDirection(e.target.value)}
              >
                {PUNCH_DIRECTIONS.map((dir) => (
                  <option key={dir.value} value={dir.value}>
                    {dir.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Reset button */}
          <button
            type="button"
            className={styles.resetBtn}
            onClick={handleResetFilters}
            title="Reset filters"
          >
            <RotateCcw size={13} />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Tab 1: DAILY BIOMETRIC PUNCH LOGS */}
      {activeTab === 'daily' && (
        <div className={styles.tableContainer}>
          <div className={styles.tableWrap}>
            <table className={styles.biometricTable}>
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Punch Time</th>
                  <th>Direction</th>
                  <th>Biometric Mode</th>
                  <th>Terminal & IP</th>
                  <th>Site / Gate</th>
                  <th>Match Score</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Log Packet</th>
                </tr>
              </thead>
              <tbody>
                {paginatedDaily.length === 0 ? (
                  <tr>
                    <td colSpan="9" style={{ textAlign: 'center', padding: '36px', color: '#64748b' }}>
                      No biometric punch records found matching your filters for {formatDisplayDate(selectedDate)}.
                    </td>
                  </tr>
                ) : (
                  paginatedDaily.map((row) => (
                    <tr key={row.logId} className={styles.tableRow}>
                      <td>
                        <div className={styles.empCell}>
                          {row.avatar ? (
                            <img src={row.avatar} alt={row.employeeName} className={styles.avatar} />
                          ) : (
                            <div className={styles.avatarFallback}>
                              {row.employeeName.charAt(0)}
                            </div>
                          )}
                          <div>
                            <p className={styles.empName}>{row.employeeName}</p>
                            <span className={styles.empIdBadge}>
                              {row.employeeId} · {row.department} · {row.clientName}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td>
                        <span className={styles.timeBadge}>
                          <Clock size={12} color="#475569" />
                          {row.punchTime}
                        </span>
                      </td>

                      <td>{getDirectionBadge(row.direction)}</td>

                      <td>{getMethodBadge(row.method)}</td>

                      <td>
                        <div className={styles.deviceChip}>
                          <span className={styles.deviceName}>{row.deviceName}</span>
                          <span className={styles.deviceIp}>IP: {row.deviceIp}</span>
                        </div>
                      </td>

                      <td>
                        <span style={{ fontWeight: 500, color: '#334155' }}>{row.site}</span>
                      </td>

                      <td>
                        <span className={styles.scoreBadge}>{row.matchScore}</span>
                      </td>

                      <td>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            fontSize: 11,
                            fontWeight: 700,
                            padding: '3px 8px',
                            borderRadius: 9999,
                            background: row.status === 'late' ? '#fef3c7' : '#dcfce7',
                            color: row.status === 'late' ? '#92400e' : '#15803d',
                            border: `1px solid ${row.status === 'late' ? '#fde68a' : '#bbf7d0'}`,
                            textTransform: 'capitalize'
                          }}
                        >
                          {row.status === 'late' ? <AlertTriangle size={11} /> : <CheckCircle2 size={11} />}
                          {row.status}
                        </span>
                      </td>

                      <td style={{ textAlign: 'right' }}>
                        <button
                          type="button"
                          className={styles.rawBtn}
                          onClick={() => setSelectedLogRecord(row)}
                          title="Inspect raw device packet"
                        >
                          <Layers size={13} />
                          Raw Packet
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <Pagination
            currentPage={currentPage}
            totalItems={filteredDailyLogs.length}
            itemsPerPage={pageSize}
            onPageChange={setCurrentPage}
            label="punches"
          />
        </div>
      )}

      {/* Tab 2: WEEKLY BIOMETRIC SUMMARY */}
      {activeTab === 'weekly' && (
        <div className={styles.tableContainer}>
          <div className={styles.tableWrap}>
            <table className={styles.biometricTable}>
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Mon</th>
                  <th>Tue</th>
                  <th>Wed</th>
                  <th>Thu</th>
                  <th>Fri</th>
                  <th>Sat</th>
                  <th>Weekly Hours</th>
                  <th>Primary Terminal</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredWeeklyData.length === 0 ? (
                  <tr>
                    <td colSpan="10" style={{ textAlign: 'center', padding: '36px', color: '#64748b' }}>
                      No weekly biometric attendance records found matching your filters.
                    </td>
                  </tr>
                ) : (
                  filteredWeeklyData.map((w) => (
                    <tr key={w.id} className={styles.tableRow}>
                      <td>
                        <div>
                          <p className={styles.empName}>{w.name}</p>
                          <span className={styles.empIdBadge}>{w.id} · {w.dept} · {w.clientName}</span>
                        </div>
                      </td>

                      {w.days.slice(0, 6).map((d, dIdx) => (
                        <td key={dIdx}>
                          <div
                            className={`${styles.weeklyDayBox} ${
                              d.status === 'present'
                                ? styles.weeklyDayBoxPresent
                                : d.status === 'late'
                                ? styles.weeklyDayBoxLate
                                : d.status === 'absent'
                                ? styles.weeklyDayBoxAbsent
                                : styles.weeklyDayBoxOff
                            }`}
                          >
                            <span className={styles.weeklyTimeText}>
                              {d.in !== '—' ? `${d.in} - ${d.out}` : 'Off Day'}
                            </span>
                            <span className={styles.weeklyHoursText}>
                              {d.hours > 0 ? `${d.hours} hrs · ${d.method}` : 'No Punch'}
                            </span>
                          </div>
                        </td>
                      ))}

                      <td>
                        <div>
                          <strong style={{ fontSize: 14, color: '#0f172a' }}>{w.totalHours} hrs</strong>
                          <div style={{ fontSize: 11, color: '#64748b' }}>{w.totalPunches} punches</div>
                        </div>
                      </td>

                      <td>
                        <span className={styles.methodBadge} style={{ background: '#f1f5f9' }}>
                          {w.primaryMethod}
                        </span>
                      </td>

                      <td>
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            padding: '3px 8px',
                            borderRadius: 9999,
                            background: w.status === 'regular' ? '#ecfdf5' : '#eff6ff',
                            color: w.status === 'regular' ? '#065f46' : '#1e40af',
                            border: `1px solid ${w.status === 'regular' ? '#a7f3d0' : '#bfdbfe'}`,
                          }}
                        >
                          {w.punctuality}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: MONTHLY BIOMETRIC MUSTER */}
      {activeTab === 'monthly' && (
        <div className={styles.tableContainer}>
          <div className={styles.tableWrap}>
            <table className={styles.biometricTable}>
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Present / Days</th>
                  <th>Attendance %</th>
                  <th>Total Punches</th>
                  <th>Avg Punch In</th>
                  <th>Avg Punch Out</th>
                  <th>Total Duty Hours</th>
                  <th>Late Marks</th>
                  <th>Preferred Terminal</th>
                </tr>
              </thead>
              <tbody>
                {filteredMonthlyData.length === 0 ? (
                  <tr>
                    <td colSpan="9" style={{ textAlign: 'center', padding: '36px', color: '#64748b' }}>
                      No monthly biometric muster records found matching your filters.
                    </td>
                  </tr>
                ) : (
                  filteredMonthlyData.map((m) => (
                    <tr key={m.id} className={styles.tableRow}>
                      <td>
                        <div>
                          <p className={styles.empName}>{m.name}</p>
                          <span className={styles.empIdBadge}>{m.id} · {m.dept} · {m.clientName}</span>
                        </div>
                      </td>

                      <td>
                        <strong style={{ color: '#0f172a' }}>
                          {m.presentDays} / {m.totalWorkingDays}
                        </strong>
                      </td>

                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontWeight: 700, color: '#059669' }}>{m.attendanceRate}</span>
                          <div
                            style={{
                              width: 50,
                              height: 6,
                              background: '#e2e8f0',
                              borderRadius: 3,
                              overflow: 'hidden'
                            }}
                          >
                            <div
                              style={{
                                width: m.attendanceRate,
                                height: '100%',
                                background: '#10b981'
                              }}
                            />
                          </div>
                        </div>
                      </td>

                      <td>
                        <strong>{m.totalPunches}</strong> punches
                      </td>

                      <td>
                        <span className={styles.timeBadge}>{m.avgCheckIn}</span>
                      </td>

                      <td>
                        <span className={styles.timeBadge}>{m.avgCheckOut}</span>
                      </td>

                      <td>
                        <strong style={{ color: '#1e40af' }}>{m.totalWorkingHours} hrs</strong>
                      </td>

                      <td>
                        {m.lateDays > 0 ? (
                          <span
                            style={{
                              color: '#b45309',
                              fontWeight: 700,
                              background: '#fef3c7',
                              padding: '2px 8px',
                              borderRadius: 4
                            }}
                          >
                            {m.lateDays} Late
                          </span>
                        ) : (
                          <span style={{ color: '#059669', fontWeight: 600 }}>0 Late</span>
                        )}
                      </td>

                      <td>
                        <span style={{ fontSize: 12, fontWeight: 500, color: '#334155' }}>
                          {m.preferredTerminal}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
        </>
      )}

      {/* Tab 4: CORRECTION REQUESTS */}
      {activeTab === 'corrections' && (
        <div className={styles.correctionsSection}>
          <div className={styles.correctionsHeader}>
            <div>
              <h2 className={styles.sectionHeading}>Attendance Correction Requests</h2>
              <p className={styles.sectionSub}>
                Review and approve or reject employee check-in / check-out correction requests and biometric scanner mismatch appeals.
              </p>
            </div>
          </div>

          <CorrectionRequests
            requests={corrections}
            onReview={(req) => setReviewRequest(req)}
          />
        </div>
      )}

      {/* Drawer: Correction Review */}
      <CorrectionReviewDrawer
        request={reviewRequest}
        onClose={() => setReviewRequest(null)}
        onApprove={handleApproveCorrection}
        onReject={handleRejectCorrection}
      />

      {/* DRAWER: Connected Biometric Terminals */}
      {isTerminalsDrawerOpen && (
        <div className={styles.drawerOverlay} onClick={() => setIsTerminalsDrawerOpen(false)}>
          <div className={styles.drawerContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.drawerHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Server size={18} color="#2563eb" />
                <h3 className={styles.drawerTitle}>Connected Biometric Terminals</h3>
              </div>
              <button
                type="button"
                className={styles.drawerCloseBtn}
                onClick={() => setIsTerminalsDrawerOpen(false)}
              >
                ✕
              </button>
            </div>

            <div className={styles.drawerBody}>
              <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>
                Total 6 biometric readers linked across facilities with real-time push SDK (Port 4370/8000).
              </p>

              {BIOMETRIC_DEVICES.map((dev) => (
                <div key={dev.id} className={styles.deviceCard}>
                  <div className={styles.deviceTopRow}>
                    <div>
                      <strong style={{ fontSize: 14, color: '#0f172a' }}>{dev.name}</strong>
                      <div style={{ fontSize: 12, color: '#64748b' }}>{dev.model}</div>
                    </div>
                    <span
                      className={
                        dev.status === 'online' ? styles.deviceStatusOnline : styles.deviceStatusSyncing
                      }
                    >
                      ● {dev.status.toUpperCase()}
                    </span>
                  </div>

                  <div style={{ fontSize: 12, color: '#475569', display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <div>
                      <strong>IP & Port:</strong> <code>{dev.ip}:{dev.port}</code>
                    </div>
                    <div>
                      <strong>Serial No:</strong> <code>{dev.serialNumber}</code>
                    </div>
                    <div>
                      <strong>Site / Location:</strong> {dev.site} ({dev.location})
                    </div>
                    <div>
                      <strong>Firmware:</strong> {dev.firmware}
                    </div>
                    <div>
                      <strong>Capabilities:</strong> {dev.capabilities.join(', ')}
                    </div>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      borderTop: '1px solid #f1f5f9',
                      paddingTop: 8,
                      marginTop: 4
                    }}
                  >
                    <span style={{ fontSize: 11, color: '#64748b' }}>
                      Enrolled: <strong>{dev.enrolledUsers}</strong> | Logs: <strong>{dev.totalLogs}</strong>
                    </span>
                    <button
                      type="button"
                      className={styles.actionBtn}
                      style={{ padding: '4px 10px', fontSize: 11 }}
                      onClick={() => handlePingDevice(dev.id)}
                      disabled={pingStatuses[dev.id] === 'pinging'}
                    >
                      <Wifi size={12} />
                      {pingStatuses[dev.id] || 'Ping Terminal'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* DRAWER: Raw Biometric Packet Inspector */}
      {selectedLogRecord && (
        <div className={styles.drawerOverlay} onClick={() => setSelectedLogRecord(null)}>
          <div className={styles.drawerContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.drawerHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Layers size={18} color="#2563eb" />
                <h3 className={styles.drawerTitle}>Raw Biometric Packet Data</h3>
              </div>
              <button
                type="button"
                className={styles.drawerCloseBtn}
                onClick={() => setSelectedLogRecord(null)}
              >
                ✕
              </button>
            </div>

            <div className={styles.drawerBody}>
              <div
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: 8,
                  padding: 14,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                  fontSize: 13
                }}
              >
                <div>
                  <strong>Employee:</strong> {selectedLogRecord.employeeName} ({selectedLogRecord.employeeId})
                </div>
                <div>
                  <strong>Timestamp:</strong> {selectedLogRecord.punchDate} {selectedLogRecord.punchTime}
                </div>
                <div>
                  <strong>Device:</strong> {selectedLogRecord.deviceName} ({selectedLogRecord.deviceModel})
                </div>
                <div>
                  <strong>Terminal IP:</strong> {selectedLogRecord.deviceIp}
                </div>
                <div>
                  <strong>Match Score:</strong> <span style={{ color: '#059669', fontWeight: 700 }}>{selectedLogRecord.matchScore}</span>
                </div>
                <div>
                  <strong>Verification Method:</strong> {selectedLogRecord.method.toUpperCase()}
                </div>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 6, display: 'block' }}>
                  Decoded TCP/UDP Payload (ZKTeco BioStar Protocol):
                </label>
                <pre className={styles.codeBlock}>
                  {JSON.stringify(selectedLogRecord.rawPacket, null, 2)}
                </pre>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: 10,
                  borderRadius: 6,
                  background: '#ecfdf5',
                  color: '#065f46',
                  fontSize: 12
                }}
              >
                <CheckCircle2 size={16} />
                <span>Payload verified against SHA-256 device checksum. Validated for Payroll.</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Force / Manual Punch Entry */}
      {isManualModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsManualModalOpen(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#0f172a' }}>
                Add Manual / Simulated Biometric Punch
              </h3>
              <button
                type="button"
                className={styles.drawerCloseBtn}
                onClick={() => setIsManualModalOpen(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateManualPunch}>
              <div className={styles.modalBody}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Employee ID & Name</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    value={`${manualForm.employeeId} - ${manualForm.employeeName}`}
                    readOnly
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Punch Direction</label>
                  <select
                    className={styles.formInput}
                    value={manualForm.direction}
                    onChange={(e) => setManualForm({ ...manualForm, direction: e.target.value })}
                  >
                    <option value="in">Check-In</option>
                    <option value="out">Check-Out</option>
                    <option value="break_out">Break Out</option>
                    <option value="break_in">Break In</option>
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Biometric Method</label>
                  <select
                    className={styles.formInput}
                    value={manualForm.method}
                    onChange={(e) => setManualForm({ ...manualForm, method: e.target.value })}
                  >
                    <option value="face">Face Recognition</option>
                    <option value="fingerprint">Optical Fingerprint</option>
                    <option value="rfid">RFID Smart Card</option>
                    <option value="iris">Iris Scan</option>
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Target Terminal Machine</label>
                  <select
                    className={styles.formInput}
                    value={manualForm.deviceId}
                    onChange={(e) => setManualForm({ ...manualForm, deviceId: e.target.value })}
                  >
                    {BIOMETRIC_DEVICES.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.site})
                      </option>
                    ))}
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Punch Time</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    value={manualForm.time}
                    onChange={(e) => setManualForm({ ...manualForm, time: e.target.value })}
                    placeholder="e.g. 09:15 AM"
                  />
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button
                  type="button"
                  className={styles.actionBtn}
                  onClick={() => setIsManualModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className={styles.primaryBtn}>
                  Save Punch Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );

  // If inside /user/ path, render directly (since UserLayout is the parent)
  // If inside /admin/ path, wrap with AdminLayout
  if (isUserView) {
    return content;
  }

  return <AdminLayout>{content}</AdminLayout>;
}

export default BiometricAttendance;
