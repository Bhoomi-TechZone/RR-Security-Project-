import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  ArrowLeftRight,
  Building2,
  Users,
  MapPin,
  Calendar,
  CheckCircle2,
  Search,
  Download,
  RefreshCw,
  Clock,
  ArrowRight,
  FileText,
  Filter,
  AlertCircle,
  Briefcase,
  Layers,
  ChevronRight,
  UserCheck
} from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import AdminLayout from '../../components/layout/AdminLayout';
import Toast from '../../components/common/Toast';
import { useCompany } from '../../context/CompanyContext';
import { usePermissions } from '../../context/PermissionContext';
import { employeeService } from '../../services/employeeService';
import { clientService } from '../../services/clientService';
import { authService } from '../../services/authService';
import { transferService } from '../../services/transferService';
import styles from './EmployeeTransfer.module.css';

const API_BASE_URL = import.meta.env.VITE_API_URL;

const TRANSFER_REASONS = [
  'Project Reassignment',
  'Client Request',
  'Site Relocation',
  'Operational Balancing',
  'Emergency Site Coverage',
  'Contract Extension / Renewal',
  'Promotion / Role Upgrade',
  'Administrative Transfer'
];

function EmployeeTransfer() {
  const { activeCompany } = useCompany();
  const { canEdit } = usePermissions();
  const [searchParams] = useSearchParams();
  const preselectedEmpId = searchParams.get('empId');

  const currentCompanyId = activeCompany?.id || activeCompany?._id || 'default';

  // Core Data States
  const [employees, setEmployees] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState({ message: '', type: 'success' });

  // Tab State: 'history' or 'allocations'
  const [activeTab, setActiveTab] = useState('history');

  // Form State for Initiating Transfer
  const [selectedEmpId, setSelectedEmpId] = useState(preselectedEmpId || '');
  const [targetClientId, setTargetClientId] = useState('');
  const [customClientName, setCustomClientName] = useState('');
  const [targetSite, setTargetSite] = useState('');
  const [effectiveDate, setEffectiveDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [reason, setReason] = useState(TRANSFER_REASONS[0]);
  const [remarks, setRemarks] = useState('');
  const [formError, setFormError] = useState('');

  // Transfer History State (stored in localStorage per company)
  const [transferHistory, setTransferHistory] = useState([]);

  // Table Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [clientFilter, setClientFilter] = useState('all');
  const [reasonFilter, setReasonFilter] = useState('all');

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  // Clear any legacy localStorage seed data to ensure pure database persistence
  useEffect(() => {
    try {
      localStorage.removeItem(`novaspark_transfers_${currentCompanyId}`);
    } catch (_) {}
  }, [currentCompanyId]);

  // Fetch Employees, Clients, and Transfer History directly from MongoDB Atlas APIs
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [empList, clientList, transferList] = await Promise.all([
        employeeService.getEmployees(currentCompanyId),
        clientService.getClients(currentCompanyId).catch(() => []),
        transferService.getTransfers(currentCompanyId).catch(() => []),
      ]);
      setEmployees(Array.isArray(empList) ? empList : []);
      setClients(Array.isArray(clientList) ? clientList : []);
      setTransferHistory(Array.isArray(transferList) ? transferList : []);
    } catch (err) {
      console.error('Error loading transfer page data from database:', err);
      showToast('Could not fetch updated employee list', 'error');
    } finally {
      setLoading(false);
    }
  }, [currentCompanyId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Selected Employee Details
  const selectedEmployee = useMemo(() => {
    if (!selectedEmpId) return null;
    return employees.find(
      (e) =>
        e.id === selectedEmpId ||
        e._id === selectedEmpId ||
        e.employeeId === selectedEmpId
    );
  }, [selectedEmpId, employees]);

  // Preselect employee if query param provided
  useEffect(() => {
    if (preselectedEmpId && employees.length > 0) {
      const match = employees.find(
        (e) =>
          e.id === preselectedEmpId ||
          e._id === preselectedEmpId ||
          e.employeeId === preselectedEmpId
      );
      if (match) {
        setSelectedEmpId(match.id || match._id || match.employeeId);
      }
    }
  }, [preselectedEmpId, employees]);

  // Handle Client Selection in Destination Box
  const handleClientChange = (e) => {
    const val = e.target.value;
    setTargetClientId(val);
    setFormError('');

    if (val === '__custom__') {
      setTargetSite('');
      return;
    }

    const matchedClient = clients.find(
      (c) => c.clientId === val || c.id === val || c._id === val || c.name === val
    );
    if (matchedClient) {
      setTargetSite(matchedClient.address || matchedClient.siteLocation || matchedClient.city || '');
    }
  };

  // Initiate Transfer Submit Handler
  const handleTransferSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!selectedEmployee) {
      setFormError('Please choose an employee to transfer.');
      return;
    }

    let finalClientName = '';
    let finalClientId = targetClientId;

    if (targetClientId === '__custom__') {
      if (!customClientName.trim()) {
        setFormError('Please enter the custom Client Company name.');
        return;
      }
      finalClientName = customClientName.trim();
      finalClientId = `CLI-${Date.now().toString().slice(-6)}`;
    } else {
      const matchedClient = clients.find(
        (c) => c.clientId === targetClientId || c.id === targetClientId || c._id === targetClientId
      );
      if (!matchedClient) {
        setFormError('Please select a valid destination Client Company.');
        return;
      }
      finalClientName = matchedClient.name;
    }

    if (!targetSite.trim()) {
      setFormError('Please enter the destination Site / Address location.');
      return;
    }

    if (!effectiveDate) {
      setFormError('Please select the transfer effective date.');
      return;
    }

    setIsSubmitting(true);
    setFormError('');

    const empId = selectedEmployee.employeeId || selectedEmployee.id || selectedEmployee._id;

    try {
      // Execute Transfer in Database via API (updates employee & creates transfer audit log in MongoDB Atlas)
      const resData = await transferService.createTransfer(
        {
          employeeId: empId,
          toClientId: finalClientId,
          toClient: finalClientName,
          toSite: targetSite.trim(),
          effectiveDate,
          reason,
          remarks: remarks.trim() || 'Workforce deployment updated.',
        },
        currentCompanyId
      );

      showToast(resData.message || `✓ ${selectedEmployee.name} successfully transferred to ${finalClientName}!`, 'success');

      // Reset form
      setSelectedEmpId('');
      setTargetClientId('');
      setCustomClientName('');
      setTargetSite('');
      setRemarks('');

      // Refresh dynamic employees and transfer history directly from database
      await fetchData();
    } catch (err) {
      console.error('Transfer execution failed:', err);
      setFormError(err.message || 'Failed to complete employee transfer.');
      showToast(err.message || 'Transfer failed', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Unique Clients for dynamic filtering
  const uniqueClients = useMemo(() => {
    const set = new Set();
    clients.forEach((c) => {
      if (c.name) set.add(c.name);
    });
    employees.forEach((e) => {
      if (e.clientName) set.add(e.clientName);
      if (e.companyName) set.add(e.companyName);
    });
    transferHistory.forEach((t) => {
      if (t.toClient) set.add(t.toClient);
      if (t.fromClient && t.fromClient !== 'Not Assigned') set.add(t.fromClient);
    });
    return Array.from(set).sort();
  }, [clients, employees, transferHistory]);

  // Filtered Transfer History
  const filteredHistory = useMemo(() => {
    return transferHistory.filter((item) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        item.employeeName?.toLowerCase().includes(q) ||
        item.employeeId?.toLowerCase().includes(q) ||
        item.fromClient?.toLowerCase().includes(q) ||
        item.toClient?.toLowerCase().includes(q) ||
        item.toSite?.toLowerCase().includes(q);

      const matchesClient =
        clientFilter === 'all' ||
        item.toClient?.toLowerCase() === clientFilter.toLowerCase() ||
        item.fromClient?.toLowerCase() === clientFilter.toLowerCase();

      const matchesReason =
        reasonFilter === 'all' ||
        item.reason?.toLowerCase() === reasonFilter.toLowerCase();

      return matchesSearch && matchesClient && matchesReason;
    });
  }, [transferHistory, searchQuery, clientFilter, reasonFilter]);

  // Filtered Allocations (Active Employees)
  const filteredAllocations = useMemo(() => {
    return employees.filter((emp) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        emp.name?.toLowerCase().includes(q) ||
        emp.employeeId?.toLowerCase().includes(q) ||
        emp.clientName?.toLowerCase().includes(q) ||
        emp.companyName?.toLowerCase().includes(q) ||
        emp.siteLocation?.toLowerCase().includes(q);

      const matchesClient =
        clientFilter === 'all' ||
        (emp.clientName && emp.clientName.toLowerCase() === clientFilter.toLowerCase()) ||
        (emp.companyName && emp.companyName.toLowerCase() === clientFilter.toLowerCase());

      return matchesSearch && matchesClient;
    });
  }, [employees, searchQuery, clientFilter]);

  // Export Transfer History to Excel
  const handleExportExcel = () => {
    if (!filteredHistory.length) {
      showToast('No records available to export', 'error');
      return;
    }

    const dataRows = filteredHistory.map((item, index) => ({
      'S.No': index + 1,
      'Transfer ID': item.id,
      'Effective Date': item.date,
      'Employee ID': item.employeeId,
      'Employee Name': item.employeeName,
      'Designation': item.designation,
      'Department': item.department,
      'Previous Client': item.fromClient,
      'Previous Site': item.fromSite,
      'New Client': item.toClient,
      'New Site': item.toSite,
      'Reason': item.reason,
      'Remarks': item.remarks,
      'Status': item.status
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Transfer Register');
    XLSX.writeFile(workbook, `Employee_Transfers_${new Date().toISOString().split('T')[0]}.xlsx`);
    showToast('✓ Transfer register exported successfully!', 'success');
  };

  // Download PDF Transfer Slip
  const handleDownloadSlip = (record) => {
    try {
      const doc = new jsPDF();

      // Header Banner
      doc.setFillColor(79, 70, 229);
      doc.rect(0, 0, 210, 28, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text(activeCompany?.name || 'NOVASPARK HRMS', 14, 13);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('OFFICIAL EMPLOYEE TRANSFER ORDER / RELOCATION SLIP', 14, 21);

      // Meta Info
      doc.setTextColor(51, 65, 85);
      doc.setFontSize(10);
      doc.text(`Reference No: ${record.id}`, 14, 38);
      doc.text(`Effective Date: ${record.date}`, 150, 38);

      // Employee Information Box
      doc.setDrawColor(226, 232, 240);
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(14, 44, 182, 34, 3, 3, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.text('Personnel Details:', 18, 52);
      doc.setFont('helvetica', 'normal');
      doc.text(`Name: ${record.employeeName}`, 18, 60);
      doc.text(`Employee Code: ${record.employeeId}`, 18, 68);
      doc.text(`Designation: ${record.designation}`, 105, 60);
      doc.text(`Department: ${record.department}`, 105, 68);

      // Transfer Route Table
      const transferRows = [
        ['Transfer Parameter', 'Previous Assignment', 'New Assignment'],
        ['Client Company', record.fromClient || '—', record.toClient || '—'],
        ['Site Location / Address', record.fromSite || '—', record.toSite || '—'],
        ['Transfer Reason', record.reason, record.reason],
        ['Status', 'Relieved', 'Active (Deployed)']
      ];

      doc.autoTable({
        startY: 85,
        head: [transferRows[0]],
        body: transferRows.slice(1),
        theme: 'striped',
        headStyles: { fillColor: [79, 70, 229], textColor: [255, 255, 255], fontStyle: 'bold' },
        styles: { fontSize: 9, cellPadding: 4 }
      });

      // Remarks & Signatures
      const finalY = doc.lastAutoTable.finalY + 12;
      doc.setFont('helvetica', 'bold');
      doc.text('Administrative Remarks:', 14, finalY);
      doc.setFont('helvetica', 'normal');
      doc.text(record.remarks || 'Standard transfer order executed under workforce deployment policy.', 14, finalY + 7);

      doc.line(14, finalY + 36, 75, finalY + 36);
      doc.text('Employee Signature', 14, finalY + 42);

      doc.line(135, finalY + 36, 196, finalY + 36);
      doc.text('Authorized HR Signatory', 135, finalY + 42);

      doc.save(`Transfer_Slip_${record.employeeId}_${record.id}.pdf`);
      showToast('✓ Transfer Order PDF downloaded', 'success');
    } catch (err) {
      console.error('PDF generation error:', err);
      showToast('Could not generate PDF slip', 'error');
    }
  };

  // Quick Action: Pre-select employee from allocations tab into transfer form
  const handleInitiateForEmployee = (emp) => {
    setSelectedEmpId(emp.id || emp._id || emp.employeeId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    showToast(`Loaded ${emp.name} into transfer initiator`, 'success');
  };

  return (
    <AdminLayout>
      <div className={styles.container}>
        {/* Toast Notification */}
        {toast.message && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast({ message: '', type: 'success' })}
          />
        )}

        {/* Breadcrumb Navigation */}
        <nav className={styles.breadcrumb} aria-label="Breadcrumb">
          <Link to="/admin/dashboard" className={styles.crumbLink}>Home</Link>
          <span className={styles.separator}>/</span>
          <span className={styles.crumbLink}>Workforce</span>
          <span className={styles.separator}>/</span>
          <Link to="/admin/employees" className={styles.crumbLink}>Employees</Link>
          <span className={styles.separator}>/</span>
          <span className={styles.crumbActive}>Transfer Employees</span>
        </nav>

        {/* Header Section */}
        <header className={styles.header}>
          <div className={styles.titleArea}>
            <h1 className={styles.title}>
              Transfer Employees
              <span className={styles.titleBadge}>Workforce Relocation</span>
            </h1>
            <p className={styles.description}>
              Reassign workforce personnel across client companies and physical sites with audit logs and transfer slips.
            </p>
          </div>

          <div className={styles.headerActions}>
            <button className={styles.refreshBtn} onClick={fetchData} title="Refresh records">
              <RefreshCw size={15} />
              <span>Refresh</span>
            </button>
            <button className={styles.exportBtn} onClick={handleExportExcel} title="Export transfer logs to Excel">
              <Download size={15} />
              <span>Export Register</span>
            </button>
          </div>
        </header>

        {/* Metric Summary Cards */}
        <section className={styles.metricsGrid}>
          <div className={styles.metricCard}>
            <div className={styles.metricIconWrap} style={{ background: 'rgba(79, 70, 229, 0.1)', color: '#4f46e5' }}>
              <ArrowLeftRight size={22} />
            </div>
            <div>
              <div className={styles.metricValue}>{transferHistory.length}</div>
              <div className={styles.metricLabel}>Transfers Recorded</div>
            </div>
          </div>

          <div className={styles.metricCard}>
            <div className={styles.metricIconWrap} style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
              <Building2 size={22} />
            </div>
            <div>
              <div className={styles.metricValue}>{clients.length || uniqueClients.length}</div>
              <div className={styles.metricLabel}>Active Client Companies</div>
            </div>
          </div>

          <div className={styles.metricCard}>
            <div className={styles.metricIconWrap} style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
              <Users size={22} />
            </div>
            <div>
              <div className={styles.metricValue}>{employees.length}</div>
              <div className={styles.metricLabel}>Workforce Headcount</div>
            </div>
          </div>

          <div className={styles.metricCard}>
            <div className={styles.metricIconWrap} style={{ background: 'rgba(14, 165, 233, 0.1)', color: '#0ea5e9' }}>
              <UserCheck size={22} />
            </div>
            <div>
              <div className={styles.metricValue}>
                {employees.filter((e) => e.clientName || e.siteLocation).length}
              </div>
              <div className={styles.metricLabel}>Deployed at Sites</div>
            </div>
          </div>
        </section>

        {/* Transfer Initiator Card */}
        <section className={styles.transferCard}>
          <div className={styles.transferCardHeader}>
            <h2 className={styles.transferCardTitle}>
              <ArrowLeftRight size={20} color="#4f46e5" />
              <span>Initiate Employee Transfer</span>
            </h2>
            <span className={styles.transferNotice}>
              Updates employee profile immediately and creates historical audit trail
            </span>
          </div>

          <form onSubmit={handleTransferSubmit} className={styles.formGrid}>
            {formError && (
              <div style={{ padding: '12px 16px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#b91c1c', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertCircle size={16} />
                <span>{formError}</span>
              </div>
            )}

            {/* Step 1: Select Employee */}
            <div className={styles.formGroup}>
              <label htmlFor="select-employee" className={styles.label}>
                Select Employee to Transfer *
              </label>
              <select
                id="select-employee"
                className={styles.select}
                value={selectedEmpId}
                onChange={(e) => {
                  setSelectedEmpId(e.target.value);
                  setFormError('');
                }}
                required
              >
                <option value="">-- Choose Employee from Workforce --</option>
                {employees.map((emp) => {
                  const idVal = emp.id || emp._id || emp.employeeId;
                  const currentClient = emp.clientName || emp.companyName || 'Unassigned';
                  const currentSite = emp.siteLocation || emp.site || '';
                  return (
                    <option key={idVal} value={idVal}>
                      {emp.employeeId ? `[${emp.employeeId}] ` : ''}
                      {emp.name} — Current: {currentClient} {currentSite ? `(${currentSite})` : ''}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Comparison Visual: Current Location -> Target Location */}
            <div className={styles.comparisonGrid}>
              {/* Box 1: Current Allocation */}
              <div className={styles.boxCurrent}>
                <div className={styles.boxHeader}>
                  <span>Current Assignment</span>
                  <span className={styles.fromTag}>From</span>
                </div>
                {selectedEmployee ? (
                  <div>
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>Employee:</span>
                      <span className={styles.infoVal}>
                        {selectedEmployee.name} ({selectedEmployee.employeeId || 'ID Pending'})
                      </span>
                    </div>
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>Role / Dept:</span>
                      <span className={styles.infoVal}>
                        {selectedEmployee.designation || 'Staff'} • {selectedEmployee.department || 'General'}
                      </span>
                    </div>
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>Client Company:</span>
                      <span className={styles.infoVal} style={{ color: '#4338ca' }}>
                        {selectedEmployee.clientName || selectedEmployee.companyName || 'Not Assigned'}
                      </span>
                    </div>
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>Site Location:</span>
                      <span className={styles.infoVal}>
                        {selectedEmployee.siteLocation || selectedEmployee.site || selectedEmployee.address || 'Head Office'}
                      </span>
                    </div>
                  </div>
                ) : (
                  <p style={{ margin: 0, color: '#94a3b8', fontSize: '13px', fontStyle: 'italic' }}>
                    Select an employee above to preview current client and site details.
                  </p>
                )}
              </div>

              {/* Indicator Arrow */}
              <div className={styles.transferIndicator}>
                <div className={styles.arrowCircle} title="Transfer Path">
                  <ArrowRight size={22} strokeWidth={2.5} />
                </div>
              </div>

              {/* Box 2: Target Location Form */}
              <div className={styles.boxDestination}>
                <div className={styles.boxHeader}>
                  <span>New Destination</span>
                  <span className={styles.toTag}>To Target</span>
                </div>

                <div className={styles.formGroup} style={{ marginBottom: '12px' }}>
                  <label htmlFor="target-client" className={styles.label}>
                    Target Client Company *
                  </label>
                  <select
                    id="target-client"
                    className={styles.select}
                    value={targetClientId}
                    onChange={handleClientChange}
                    required
                  >
                    <option value="">Select Destination Client</option>
                    {clients.map((c) => {
                      const cid = c.clientId || c.id || c._id;
                      return (
                        <option key={cid} value={cid}>
                          {c.name} {c.city ? `(${c.city})` : ''}
                        </option>
                      );
                    })}
                    <option value="__custom__">+ Enter Custom Client / Company</option>
                  </select>
                </div>

                {targetClientId === '__custom__' && (
                  <div className={styles.formGroup} style={{ marginBottom: '12px' }}>
                    <label htmlFor="custom-client-name" className={styles.label}>
                      Custom Client / Company Name *
                    </label>
                    <input
                      id="custom-client-name"
                      type="text"
                      className={styles.input}
                      placeholder="e.g. Apex Security Hub, Metro Logistics"
                      value={customClientName}
                      onChange={(e) => setCustomClientName(e.target.value)}
                      required
                    />
                  </div>
                )}

                <div className={styles.formGroup}>
                  <label htmlFor="target-site" className={styles.label}>
                    Target Site / Address Location *
                  </label>
                  <input
                    id="target-site"
                    type="text"
                    className={styles.input}
                    placeholder="Enter site name, building, floor or address"
                    value={targetSite}
                    onChange={(e) => setTargetSite(e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Additional Transfer Metadata */}
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label htmlFor="effective-date" className={styles.label}>
                  Effective Transfer Date *
                </label>
                <input
                  id="effective-date"
                  type="date"
                  className={styles.input}
                  value={effectiveDate}
                  onChange={(e) => setEffectiveDate(e.target.value)}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="transfer-reason" className={styles.label}>
                  Transfer Reason / Category *
                </label>
                <select
                  id="transfer-reason"
                  className={styles.select}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                >
                  {TRANSFER_REASONS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="transfer-remarks" className={styles.label}>
                Transfer Notes & Remarks (Optional)
              </label>
              <textarea
                id="transfer-remarks"
                className={styles.textarea}
                placeholder="Provide any additional context, customer request memo, or operational approval notes..."
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
              />
            </div>

            <div className={styles.formActions}>
              <button
                type="button"
                className={styles.cancelBtn}
                onClick={() => {
                  setSelectedEmpId('');
                  setTargetClientId('');
                  setCustomClientName('');
                  setTargetSite('');
                  setRemarks('');
                  setFormError('');
                }}
              >
                Reset Form
              </button>
              <button
                type="submit"
                className={styles.submitBtn}
                disabled={isSubmitting || !selectedEmpId}
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" />
                    <span>Processing Transfer...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={16} />
                    <span>Confirm & Transfer Employee</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </section>

        {/* Tabbed Content: Transfer History vs Current Allocations */}
        <section className={styles.contentSection}>
          <div className={styles.tabBar}>
            <button
              className={`${styles.tabBtn} ${activeTab === 'history' ? styles.tabBtnActive : ''}`}
              onClick={() => setActiveTab('history')}
            >
              <Clock size={16} />
              <span>Transfer History & Logs</span>
              <span className={styles.tabBadge}>{transferHistory.length}</span>
            </button>
            <button
              className={`${styles.tabBtn} ${activeTab === 'allocations' ? styles.tabBtnActive : ''}`}
              onClick={() => setActiveTab('allocations')}
            >
              <Users size={16} />
              <span>Current Site Allocations</span>
              <span className={styles.tabBadge}>{employees.length}</span>
            </button>
          </div>

          {/* Search & Filter Toolbar */}
          <div className={styles.toolbar}>
            <div className={styles.searchWrap}>
              <Search size={16} className={styles.searchIcon} />
              <input
                type="text"
                className={styles.searchInput}
                placeholder={
                  activeTab === 'history'
                    ? 'Search transfer logs by employee, client, site...'
                    : 'Search workforce by name, ID, site...'
                }
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className={styles.filterGroup}>
              <select
                className={styles.filterSelect}
                value={clientFilter}
                onChange={(e) => setClientFilter(e.target.value)}
              >
                <option value="all">All Clients</option>
                {uniqueClients.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>

              {activeTab === 'history' && (
                <select
                  className={styles.filterSelect}
                  value={reasonFilter}
                  onChange={(e) => setReasonFilter(e.target.value)}
                >
                  <option value="all">All Reasons</option>
                  {TRANSFER_REASONS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* TAB 1: Transfer History Table */}
          {activeTab === 'history' && (
            <div className={styles.tableResponsive}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Ref ID</th>
                    <th>Effective Date</th>
                    <th>Employee</th>
                    <th>Previous Assignment</th>
                    <th>Transferred To</th>
                    <th>Reason</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredHistory.length > 0 ? (
                    filteredHistory.map((item) => (
                      <tr key={item.id}>
                        <td>
                          <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#4f46e5' }}>
                            {item.id}
                          </span>
                        </td>
                        <td>{item.date}</td>
                        <td>
                          <div className={styles.employeeCell}>
                            <div className={styles.avatarCircle}>
                              {item.employeeName?.charAt(0) || 'E'}
                            </div>
                            <div>
                              <div className={styles.empName}>{item.employeeName}</div>
                              <div className={styles.empSub}>
                                {item.employeeId} • {item.designation}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div>
                            <span className={`${styles.routeBadge} ${styles.routeFrom}`}>
                              {item.fromClient || 'N/A'}
                            </span>
                            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '3px' }}>
                              {item.fromSite || '—'}
                            </div>
                          </div>
                        </td>
                        <td>
                          <div>
                            <span className={`${styles.routeBadge} ${styles.routeTo}`}>
                              {item.toClient || 'N/A'}
                            </span>
                            <div style={{ fontSize: '11px', color: '#059669', marginTop: '3px', fontWeight: 500 }}>
                              {item.toSite || '—'}
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className={styles.reasonBadge}>
                            {item.reason}
                          </span>
                          {item.remarks && (
                            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '3px', maxWidth: '180px' }} title={item.remarks}>
                              {item.remarks.length > 35 ? item.remarks.slice(0, 35) + '...' : item.remarks}
                            </div>
                          )}
                        </td>
                        <td>
                          <span className={styles.statusCompleted}>
                            <CheckCircle2 size={13} />
                            <span>{item.status || 'Completed'}</span>
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button
                            className={styles.actionBtn}
                            onClick={() => handleDownloadSlip(item)}
                            title="Download Transfer Order PDF"
                          >
                            <FileText size={13} />
                            <span>Slip</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="8">
                        <div className={styles.emptyState}>
                          <Clock size={36} className={styles.emptyIcon} />
                          <p style={{ margin: 0, fontWeight: 600 }}>No transfer history matches your filters.</p>
                          <p style={{ margin: '4px 0 0', fontSize: '12px' }}>
                            Transfers executed from the form above will be logged here.
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 2: Current Site Allocations Table */}
          {activeTab === 'allocations' && (
            <div className={styles.tableResponsive}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Employee ID</th>
                    <th>Employee Name</th>
                    <th>Department & Role</th>
                    <th>Current Client Company</th>
                    <th>Site / Work Location</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAllocations.length > 0 ? (
                    filteredAllocations.map((emp) => {
                      const empId = emp.id || emp._id || emp.employeeId;
                      const clientName = emp.clientName || emp.companyName || 'Not Assigned';
                      const siteLoc = emp.siteLocation || emp.site || emp.address || '—';
                      return (
                        <tr key={empId}>
                          <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>
                            {emp.employeeId || empId}
                          </td>
                          <td>
                            <div className={styles.employeeCell}>
                              <div className={styles.avatarCircle}>
                                {emp.name?.charAt(0) || 'E'}
                              </div>
                              <span className={styles.empName}>{emp.name}</span>
                            </div>
                          </td>
                          <td>
                            <div style={{ fontWeight: 500 }}>{emp.designation || 'Staff'}</div>
                            <div style={{ fontSize: '11px', color: '#64748b' }}>{emp.department || 'General'}</div>
                          </td>
                          <td>
                            <span className={`${styles.routeBadge} ${clientName !== 'Not Assigned' ? styles.routeTo : styles.routeFrom}`}>
                              {clientName}
                            </span>
                          </td>
                          <td style={{ fontSize: '13px', color: '#334155' }}>
                            {siteLoc}
                          </td>
                          <td>
                            <span
                              style={{
                                display: 'inline-block',
                                padding: '3px 8px',
                                borderRadius: '9999px',
                                fontSize: '11px',
                                fontWeight: 700,
                                background: (emp.status || 'Active').toLowerCase() === 'active' ? '#dcfce7' : '#f1f5f9',
                                color: (emp.status || 'Active').toLowerCase() === 'active' ? '#15803d' : '#64748b'
                              }}
                            >
                              {emp.status || 'Active'}
                            </span>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <button
                              className={styles.actionBtn}
                              onClick={() => handleInitiateForEmployee(emp)}
                              title="Transfer this employee to a new site"
                            >
                              <ArrowLeftRight size={13} />
                              <span>Transfer</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="7">
                        <div className={styles.emptyState}>
                          <Users size={36} className={styles.emptyIcon} />
                          <p style={{ margin: 0, fontWeight: 600 }}>No employees found matching the search criteria.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </AdminLayout>
  );
}

export default EmployeeTransfer;
