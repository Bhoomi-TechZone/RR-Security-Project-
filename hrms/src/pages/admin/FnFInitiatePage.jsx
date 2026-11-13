import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  ChevronLeft,
  User,
  Search,
  FileText,
  CheckCircle2,
  AlertCircle,
  Info,
  Calendar,
  ArrowRight,
  ShieldCheck,
  Building2,
  MapPin,
  Briefcase,
  Hash,
  UserCheck,
  CreditCard,
  FileCheck2
} from 'lucide-react';
import AdminLayout from '../../components/layout/AdminLayout';
import UserLayout from '../../components/layout/UserLayout';
import Toast from '../../components/common/Toast';
import { useCompany } from '../../context/CompanyContext';
import employeeService from '../../services/employeeService';
import separationService from '../../services/separationService';
import { mockEmployees } from '../../data/employeeData';
import {
  SEPARATION_REASONS,
  getStoredFnF,
  saveStoredFnF
} from '../../data/fnfData';
import styles from './FnFInitiatePage.module.css';

// Watchlist pre-configured high-priority staff members (fallback if not returned by live API)
const WATCHLIST_CANDIDATES = [
  {
    risk: '25%',
    id: 'emp-rrs001',
    code: 'RRS001',
    name: 'Bandna Rana',
    designation: 'HR Manager',
    department: 'Human Resources',
    location: 'G-75A Gali No 04 Badarpur New Delhi',
    clientName: 'RRS Security Services',
    dateOfJoining: '2026-01-01',
    noticeDays: 30,
    avatar: null
  },
  {
    risk: '25%',
    id: 'emp-rrs002',
    code: 'RRS002',
    name: 'Shikha',
    designation: 'Operations Coordinator',
    department: 'Field Operations',
    location: 'DLF CyberCity Tech Park, Gurugram',
    clientName: 'DLF CyberCity Tech Park',
    dateOfJoining: '2025-03-15',
    noticeDays: 30,
    avatar: null
  }
];

// Helper to format ISO date to DD-Mon-YYYY (e.g. 01-Jan-2026)
function formatDateDisplay(dateStr) {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr.length === 10 ? `${dateStr}T12:00:00` : dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const day = String(d.getDate()).padStart(2, '0');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${day}-${months[d.getMonth()]}-${d.getFullYear()}`;
  } catch (_) {
    return dateStr;
  }
}

// Helper to format date into YYYY-MM-DD for HTML input
function toDateInputValue(d) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function FnFInitiatePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const isAdmin = !location.pathname.startsWith('/user');
  const basePath = isAdmin ? '/admin/payroll' : '/user/payroll';
  const LayoutComponent = isAdmin ? AdminLayout : UserLayout;

  const { activeCompanyId } = useCompany();
  const [employees, setEmployees] = useState([]);
  const [toast, setToast] = useState(null);

  const notify = (message, type = 'success') => setToast({ message, type });

  // Search & Autocomplete state
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchError, setSearchError] = useState('');
  const searchContainerRef = useRef(null);

  // Selected Employee
  const [selectedEmp, setSelectedEmp] = useState(null);

  // Form Fields
  const today = useMemo(() => new Date(), []);
  const initialLastWorking = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d;
  }, []);

  const [resignationDate, setResignationDate] = useState(toDateInputValue(today));
  const [lastWorkingDate, setLastWorkingDate] = useState(toDateInputValue(initialLastWorking));
  const [noticeDays, setNoticeDays] = useState(30);
  const [reasonOfExit, setReasonOfExit] = useState('');
  const [remarks, setRemarks] = useState('');
  const [tryingToRetain, setTryingToRetain] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load all employees on mount
  useEffect(() => {
    let isMounted = true;
    async function loadStaff() {
      try {
        const fetched = await employeeService.getEmployees(activeCompanyId);
        if (isMounted) {
          const list = Array.isArray(fetched) && fetched.length > 0 ? fetched : mockEmployees;

          // Map real/mock HRMS employees first so live DB details take priority
          const mapped = list.map((item) => {
            const code = item.employeeCode || item.code || item.id;
            return {
              id: item.id || item._id || code,
              code,
              name: item.name,
              designation: item.designation || '—',
              department: item.department || '—',
              location: item.siteLocation || item.site || item.joiningLocation || item.location || '—',
              clientName: item.clientName || item.companyName || '—',
              dateOfJoining: item.joiningDate || item.dateOfJoining || '',
              noticeDays: item.noticePeriod || 30,
              avatar: item.employeePhoto || item.avatar || null
            };
          });

          // Append fallback watchlist entries only if missing from fetched list
          WATCHLIST_CANDIDATES.forEach((cand) => {
            if (!mapped.some((e) => (e.code || '').toLowerCase() === cand.code.toLowerCase())) {
              mapped.push(cand);
            }
          });

          setEmployees(mapped);
        }
      } catch (err) {
        console.warn('Could not load employees via service, using standard roster:', err);
        if (isMounted) {
          setEmployees(WATCHLIST_CANDIDATES);
        }
      }
    }
    loadStaff();
    return () => {
      isMounted = false;
    };
  }, [activeCompanyId]);

  // Handle outside clicks to close autocomplete
  useEffect(() => {
    function handleClickOutside(e) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filtered suggestions based on search query
  const suggestions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return employees
      .filter((emp) => {
        const name = (emp.name || '').toLowerCase();
        const code = (emp.code || emp.employeeCode || '').toLowerCase();
        return name.includes(q) || code.includes(q);
      })
      .slice(0, 8);
  }, [searchQuery, employees]);

  // Load employee handler
  const handleLoadEmployee = (empToLoad) => {
    let target = empToLoad;

    if (!target) {
      const q = searchQuery.trim().toLowerCase();
      if (!q) {
        setSearchError('Please enter an employee name or staff code to search.');
        return;
      }

      // 1. Check exact match on code or full name
      target = employees.find((e) => {
        const name = (e.name || '').trim().toLowerCase();
        const code = (e.code || e.employeeCode || '').trim().toLowerCase();
        return name === q || code === q;
      });

      // 2. If no exact match, check partial matches
      if (!target) {
        if (suggestions.length === 1) {
          target = suggestions[0];
        } else if (suggestions.length > 1) {
          setShowSuggestions(true);
          setSearchError('Multiple matching employees found. Please select one from the list.');
          return;
        }
      }
    }

    if (!target) {
      setSearchError('No matching employee found. Please check the name or code.');
      return;
    }

    setSearchError('');
    setSelectedEmp(target);
    setSearchQuery(target.name);
    setShowSuggestions(false);

    // Set defaults from employee
    setNoticeDays(target.noticeDays || 30);
    const dRes = new Date();
    const dLast = new Date();
    dLast.setDate(dLast.getDate() + (target.noticeDays || 30));
    setResignationDate(toDateInputValue(dRes));
    setLastWorkingDate(toDateInputValue(dLast));
    notify(`Loaded profile for ${target.name} (${target.code || target.employeeCode})`, 'success');
  };

  // Quick select from watchlist chip (prefer live employee record if loaded)
  const handleSelectWatchlist = (candidate) => {
    const liveMatch = employees.find(
      (e) => (e.code || e.employeeCode || '').toLowerCase() === candidate.code.toLowerCase()
    );
    const resolved = liveMatch || candidate;

    setSearchError('');
    setSelectedEmp(resolved);
    setSearchQuery(resolved.name);
    setShowSuggestions(false);
    setNoticeDays(resolved.noticeDays || 30);
    const dRes = new Date();
    const dLast = new Date();
    dLast.setDate(dLast.getDate() + (resolved.noticeDays || 30));
    setResignationDate(toDateInputValue(dRes));
    setLastWorkingDate(toDateInputValue(dLast));
    notify(`Loaded profile for ${resolved.name} (${resolved.code})`, 'success');
  };

  // Dynamic Notice & Timeline Summary Calculation
  const timelineSummary = useMemo(() => {
    if (!resignationDate || !lastWorkingDate) {
      return { days: 0, text: 'Select resignation and last working dates to calculate notice timeline.' };
    }
    const d1 = new Date(`${resignationDate}T00:00:00`);
    const d2 = new Date(`${lastWorkingDate}T00:00:00`);
    const diffTime = d2.getTime() - d1.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return {
        days: 0,
        text: 'Last working date cannot be earlier than resignation date.'
      };
    }

    if (diffDays === noticeDays) {
      return {
        days: diffDays,
        text: `${diffDays} day(s) between resignation and last working date — aligned with the standard notice period`
      };
    } else if (diffDays < noticeDays) {
      const shortfall = noticeDays - diffDays;
      return {
        days: diffDays,
        text: `${diffDays} day(s) between resignation and last working date — notice shortfall of ${shortfall} day(s)`
      };
    } else {
      const extended = diffDays - noticeDays;
      return {
        days: diffDays,
        text: `${diffDays} day(s) between resignation and last working date — notice extended by ${extended} day(s)`
      };
    }
  }, [resignationDate, lastWorkingDate, noticeDays]);

  // Form Submit Handler
  const handleSubmitSeparation = async (e) => {
    e.preventDefault();
    if (!selectedEmp) {
      notify('Please select and load an employee first.', 'error');
      return;
    }
    if (!resignationDate) {
      notify('Please enter the resignation date.', 'error');
      return;
    }
    if (!lastWorkingDate) {
      notify('Please enter the last working date.', 'error');
      return;
    }
    if (!reasonOfExit) {
      notify('Please choose a reason for separation.', 'error');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        employeeId: selectedEmp.id || selectedEmp._id || selectedEmp.code,
        employeeCode: selectedEmp.code || selectedEmp.employeeCode || 'EMP-NEW',
        employeeName: selectedEmp.name,
        avatar: selectedEmp.avatar || null,
        designation: selectedEmp.designation || 'Staff Member',
        client: selectedEmp.clientName || selectedEmp.client || selectedEmp.companyName || 'Corporate Client',
        site: selectedEmp.location || selectedEmp.site || 'Main Site',
        department: selectedEmp.department || 'General',
        dateOfJoining: selectedEmp.dateOfJoining || '2026-01-01',
        exitType: 'Resignation',
        resignationDate: resignationDate,
        lastWorkingDay: lastWorkingDate,
        separationReason: reasonOfExit,
        noticePeriodRequiredDays: noticeDays,
        tryingToRetain: tryingToRetain,
        remarks: remarks.trim()
      };

      let createdRecord = null;
      try {
        const res = await separationService.createSeparation(payload, activeCompanyId);
        createdRecord = res?.data;
      } catch (apiErr) {
        console.warn('Backend separation create notice:', apiErr.message);
      }

      // Also sync to local storage cache
      try {
        const existingRecords = getStoredFnF();
        const fallbackRecord = createdRecord || {
          ...payload,
          id: `fnf-${Date.now()}`,
          settlementId: `FNF-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
          settlementStatus: 'Pending Clearance',
          createdAt: new Date().toISOString()
        };
        saveStoredFnF([fallbackRecord, ...existingRecords]);
      } catch (_) { }

      notify(`✓ Separation record initiated successfully for ${selectedEmp.name}!`, 'success');

      // Navigate to Pending Exits to display the newly initiated record
      setTimeout(() => {
        navigate(`${basePath}/pending-exits`);
      }, 800);
    } catch (err) {
      console.error('Error initiating separation:', err);
      notify(err.message || 'Failed to save separation record. Please try again.', 'error');
      setIsSubmitting(false);
    }
  };

  return (
    <LayoutComponent>
      <div className={styles.container}>
        {/* Breadcrumb Navigation */}
        <div className={styles.breadcrumb}>
          <Link to={isAdmin ? '/admin/dashboard' : '/user/dashboard'}>Dashboard</Link>
          <span>/</span>
          <Link to={`${basePath}?tab=fnf`}>Payroll</Link>
          <span>/</span>
          <Link to={`${basePath}?tab=fnf`}>Separation</Link>
          <span>/</span>
          <strong>Initiate Separation</strong>
        </div>

        {/* Header Row */}
        <div className={styles.pageHeader}>
          <div className={styles.headerLeft}>
            <div className={styles.titleGroup}>
              <h1 className={styles.title}>Initiate Separation</h1>
              <p className={styles.subtitle}>
                Register separation schedule, configure exit notice terms, and document retention status.
              </p>
            </div>
          </div>
          <button
            type="button"
            className={styles.backBtn}
            onClick={() => navigate(`${basePath}?tab=fnf`)}
            title="Return to Separation Dashboard"
          >
            <ChevronLeft size={16} />
            <span>Back</span>
          </button>
        </div>

        {/* Top Card: Search Employee & Retention Risk Watchlist */}
        <div className={styles.searchCard}>
          <div className={styles.searchGrid}>
            {/* Left Column: Search & Load */}
            <div className={styles.panelCol} ref={searchContainerRef}>
              <div className={styles.iconHeader}>
                <div className={styles.iconBox}>
                  <User size={20} />
                </div>
                <div>
                  <h3 className={styles.panelTitle}>Select Employee</h3>
                  <p className={styles.panelSubtitle}>
                    Search an active staff member and load their employment profile before initiating separation.
                  </p>
                </div>
              </div>

              <div className={styles.searchForm}>
                <label className={styles.inputLabel}>Employee Name or Staff Code</label>
                <div className={styles.searchGroupWrap}>
                  <div className={styles.searchGroup}>
                    <input
                      type="text"
                      className={`${styles.searchInput} ${searchError ? styles.searchInputError : ''}`}
                      placeholder="Search by name or code..."
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setShowSuggestions(true);
                        if (searchError) setSearchError('');
                      }}
                      onFocus={() => {
                        if (searchQuery.trim().length > 0) setShowSuggestions(true);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleLoadEmployee();
                        }
                      }}
                    />
                    <button
                      type="button"
                      className={styles.loadBtn}
                      onClick={() => handleLoadEmployee()}
                    >
                      <Search size={15} />
                      <span>Search</span>
                    </button>
                  </div>

                  {/* Autocomplete Dropdown */}
                  {showSuggestions && suggestions.length > 0 && (
                    <ul className={styles.suggestionsList}>
                      {suggestions.map((item) => (
                        <li
                          key={item.id || item.code}
                          className={styles.suggestionItem}
                          onClick={() => handleLoadEmployee(item)}
                        >
                          <span className={styles.suggName}>{item.name}</span>
                          <span className={styles.suggCode}>{item.code || item.employeeCode}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {searchError && (
                  <div className={styles.searchError}>
                    <AlertCircle size={14} />
                    <span>{searchError}</span>
                  </div>
                )}

                <div className={styles.helperNote}>
                  Start typing, choose the employee from suggestions, or click Search.
                </div>
              </div>
            </div>

            {/* Right Column: High-risk candidates / Watchlist */}
            <div className={styles.panelCol}>
              <h3 className={styles.panelTitle}>Retention Risk Watchlist</h3>
              <p className={styles.panelSubtitle}>
                Quick access to employees who may need early retention discussions or transition review.
              </p>
              <div className={styles.watchlistChips}>
                {WATCHLIST_CANDIDATES.map((cand) => (
                  <button
                    key={cand.code}
                    type="button"
                    className={styles.chip}
                    onClick={() => handleSelectWatchlist(cand)}
                    title={`Click to load ${cand.name} (${cand.code})`}
                  >
                    <span className={styles.chipRisk}>{cand.risk}</span>
                    <span className={styles.chipLabel}>{cand.name} ({cand.code})</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section: State 1 (Unloaded Placeholder) or State 2 (Loaded 2-Card Layout) */}
        {!selectedEmp ? (
          /* State 1: Unloaded Empty Placeholder */
          <div className={styles.emptyPlaceholderCard}>
            <div className={styles.emptyIconBox}>
              <CreditCard size={28} />
            </div>
            <h3 className={styles.emptyTitle}>Employee details will appear here</h3>
            <p className={styles.emptySubtitle}>
              Search and load an employee above to review the profile and complete separation initiation.
            </p>
          </div>
        ) : (
          /* State 2: Loaded Employee - 2-Column Grid */
          <div className={styles.loadedGrid}>
            {/* Left Card: Exit Information Form */}
            <div className={styles.formCard}>
              <div className={styles.iconHeader}>
                <div className={styles.iconBox}>
                  <FileText size={20} />
                </div>
                <div>
                  <h3 className={styles.panelTitle}>Separation & Exit Information</h3>
                  <p className={styles.panelSubtitle}>
                    Capture the resignation timeline, reason for separation, and retention status.
                  </p>
                </div>
              </div>

              <form onSubmit={handleSubmitSeparation} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Resignation Date & Last Working Date */}
                <div className={styles.datesRow}>
                  <div className={styles.fieldGroup}>
                    <label className={styles.inputLabel}>
                      Resignation Date <span className={styles.required}>*</span>
                    </label>
                    <input
                      type="date"
                      className={styles.dateInput}
                      value={resignationDate}
                      onChange={(e) => setResignationDate(e.target.value)}
                      required
                    />
                  </div>
                  <div className={styles.fieldGroup}>
                    <label className={styles.inputLabel}>
                      Last Working Date <span className={styles.required}>*</span>
                    </label>
                    <input
                      type="date"
                      className={styles.dateInput}
                      value={lastWorkingDate}
                      onChange={(e) => setLastWorkingDate(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* Notice Period & Timeline Summary Banner */}
                <div className={styles.noticeBanner}>
                  <div className={styles.bannerNoticeCol}>
                    <span className={styles.bannerLabel}>NOTICE PERIOD</span>
                    <span className={styles.bannerNoticeDays}>{noticeDays} days</span>
                  </div>
                  <div className={styles.bannerSummaryCol}>
                    <span className={styles.bannerLabel}>TIMELINE SUMMARY</span>
                    <span className={styles.bannerSummaryText}>{timelineSummary.text}</span>
                  </div>
                </div>

                {/* Reason of Exit */}
                <div className={styles.fieldGroup}>
                  <label className={styles.inputLabel}>
                    Reason of Exit <span className={styles.required}>*</span>
                  </label>
                  <select
                    className={styles.selectInput}
                    value={reasonOfExit}
                    onChange={(e) => setReasonOfExit(e.target.value)}
                    required
                  >
                    <option value="">- Select -</option>
                    {SEPARATION_REASONS.map((reason) => (
                      <option key={reason} value={reason}>
                        {reason}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Remarks */}
                <div className={styles.fieldGroup}>
                  <label className={styles.inputLabel}>Remarks</label>
                  <textarea
                    className={styles.textarea}
                    placeholder="Add any context, operational notes, or handover remarks relevant to this exit..."
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    rows={3}
                  />
                </div>

                {/* Trying to Retain Toggle Switch */}
                <div className={styles.toggleRow}>
                  <label className={styles.toggleSwitch}>
                    <input
                      type="checkbox"
                      checked={tryingToRetain}
                      onChange={(e) => setTryingToRetain(e.target.checked)}
                    />
                    <span className={styles.slider} />
                  </label>
                  <span className={styles.toggleLabel}>
                    Trying to Retain
                    <span className={styles.infoTooltipWrap} tabIndex={0}>
                      <span className={styles.infoIconTrigger} aria-label="Retention attempt info">
                        <Info size={14} />
                      </span>
                      <span className={styles.infoTooltipBox} role="tooltip">
                        Select if you are trying to retain this employee
                      </span>
                    </span>
                  </span>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  className={styles.submitBtn}
                  disabled={isSubmitting}
                >
                  <FileCheck2 size={16} />
                  <span>{isSubmitting ? 'Processing Separation...' : 'Initiate Exit'}</span>
                </button>
              </form>
            </div>

            {/* Right Card: Employee Snapshot */}
            <div className={styles.profileCard}>
              <div className={styles.iconHeader}>
                <div className={styles.iconBox}>
                  <UserCheck size={20} />
                </div>
                <div>
                  <h3 className={styles.panelTitle}>Employee Snapshot</h3>
                  <p className={styles.panelSubtitle}>
                    Quick reference information for the employee being separated.
                  </p>
                </div>
              </div>

              {/* Avatar, Full Name & Employee Code Badge */}
              <div className={styles.avatarSection}>
                {selectedEmp.avatar ? (
                  <img
                    src={selectedEmp.avatar}
                    alt={selectedEmp.name}
                    className={styles.avatarImg}
                  />
                ) : (
                  <div className={styles.avatarFallback}>
                    {selectedEmp.name
                      ? selectedEmp.name
                          .split(' ')
                          .map((n) => n[0])
                          .slice(0, 2)
                          .join('')
                          .toUpperCase()
                      : 'EM'}
                  </div>
                )}
                <h2 className={styles.empName}>{selectedEmp.name}</h2>
                <span className={styles.empCodeBadge}>
                  {selectedEmp.code || selectedEmp.employeeCode}
                </span>
              </div>

              {/* 2x2 Grid of Key Profile Metrics */}
              <div className={styles.snapshotGrid}>
                <div className={styles.snapshotBox}>
                  <span className={styles.boxLabel}>JOINED</span>
                  <span className={styles.boxValue}>
                    {formatDateDisplay(selectedEmp.dateOfJoining)}
                  </span>
                </div>

                <div className={styles.snapshotBox}>
                  <span className={styles.boxLabel}>DESIGNATION</span>
                  <span className={styles.boxValue}>{selectedEmp.designation || '—'}</span>
                </div>

                <div className={styles.snapshotBox}>
                  <span className={styles.boxLabel}>DEPARTMENT</span>
                  <span className={styles.boxValue}>{selectedEmp.department || '—'}</span>
                </div>

                <div className={styles.snapshotBox}>
                  <span className={styles.boxLabel}>LOCATION</span>
                  <span className={styles.boxValue}>{selectedEmp.location || '—'}</span>
                </div>

                <div className={`${styles.snapshotBox} ${styles.fullWidthBox}`}>
                  <span className={styles.boxLabel}>CLIENT COMPANY</span>
                  <span className={styles.boxValue}>{selectedEmp.clientName || selectedEmp.companyName || '—'}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Toast notifications */}
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
      </div>
    </LayoutComponent>
  );
}
