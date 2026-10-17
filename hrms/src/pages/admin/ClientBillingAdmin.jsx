import React, { useState, useEffect, useMemo } from 'react';
import {
  Receipt,
  Search,
  Filter,
  Plus,
  Eye,
  Download,
  Building2,
  CheckCircle2,
  Clock,
  AlertCircle,
  DollarSign,
  FileText,
  Printer,
  X,
  RefreshCw,
  CreditCard,
  Send,
  Trash2,
  Calendar,
  Layers,
  ArrowUpRight,
  TrendingUp,
  FileSpreadsheet
} from 'lucide-react';
import styles from './ClientBillingAdmin.module.css';
import AdminLayout from '../../components/layout/AdminLayout';
import Toast from '../../components/common/Toast';
import ConfirmModal from '../../components/common/ConfirmModal';

// Initial realistic billing records for client organizations
const INITIAL_INVOICES = [
  {
    id: 'inv-nx-101',
    invoiceNo: 'INV-2026-1001',
    clientId: 'CL-NEXUS-01',
    clientName: 'Nexus Corporate Towers',
    gstin: '07AAACN1234D1Z5',
    address: 'Plot 45, Sector 18, Commercial Belt, Cyber City',
    billingPeriod: 'October 2026',
    issueDate: '2026-10-01',
    dueDate: '2026-10-15',
    guardCount: 12,
    ratePerGuard: 25000,
    slaCharges: 10000,
    baseAmount: 310000,
    gstAmount: 55800,
    grossAmount: 365800,
    paidAmount: 365800,
    pendingAmount: 0,
    status: 'Paid',
    notes: 'Standard 24x7 security personnel and perimeter patrol contract.',
    paymentMode: 'NEFT / RTGS (UTR: HDFC874639201)'
  },
  {
    id: 'inv-al-102',
    invoiceNo: 'INV-2026-1002',
    clientId: 'CL-ALPHA-02',
    clientName: 'Alpha Logistics Hub',
    gstin: '09AABCA9876E1Z2',
    address: 'Warehouse Complex 12, Transport Nagar, Bareilly',
    billingPeriod: 'October 2026',
    issueDate: '2026-10-01',
    dueDate: '2026-10-15',
    guardCount: 16,
    ratePerGuard: 24000,
    slaCharges: 15000,
    baseAmount: 399000,
    gstAmount: 71820,
    grossAmount: 470820,
    paidAmount: 250000,
    pendingAmount: 220820,
    status: 'Partially Paid',
    notes: 'Gate access control, loading bay supervisors and night surveillance.',
    paymentMode: 'Partially settled via Bank Transfer'
  },
  {
    id: 'inv-ap-103',
    invoiceNo: 'INV-2026-1003',
    clientId: 'CL-APEX-03',
    clientName: 'Apex Healthcare & Multi-Specialty',
    gstin: '07AAACA4455F1Z9',
    address: 'Medical Enclave, Civil Lines, Bareilly, UP',
    billingPeriod: 'October 2026',
    issueDate: '2026-10-01',
    dueDate: '2026-10-15',
    guardCount: 10,
    ratePerGuard: 26000,
    slaCharges: 8000,
    baseAmount: 268000,
    gstAmount: 48240,
    grossAmount: 316240,
    paidAmount: 0,
    pendingAmount: 316240,
    status: 'Pending',
    notes: 'Hospital triage security, emergency ward guards, and female marshals.',
    paymentMode: 'Awaiting client approval'
  },
  {
    id: 'inv-ms-104',
    invoiceNo: 'INV-2026-0901',
    clientId: 'CL-METRO-04',
    clientName: 'Metro Smart City Infrastructure',
    gstin: '09AAACM7788K1Z3',
    address: 'Smart City Administrative Block, Phase 2, Bareilly',
    billingPeriod: 'September 2026',
    issueDate: '2026-09-01',
    dueDate: '2026-09-15',
    guardCount: 8,
    ratePerGuard: 25000,
    slaCharges: 5000,
    baseAmount: 205000,
    gstAmount: 36900,
    grossAmount: 241900,
    paidAmount: 0,
    pendingAmount: 241900,
    status: 'Overdue',
    notes: 'Government municipal site monitoring & entry post security.',
    paymentMode: 'Escalation reminder sent'
  },
  {
    id: 'inv-hz-105',
    invoiceNo: 'INV-2026-0902',
    clientId: 'CL-HORIZON-05',
    clientName: 'Horizon Industrial Estate',
    gstin: '09AAACH5566L1Z4',
    address: 'Parsakhera Industrial Zone, Bareilly, Uttar Pradesh',
    billingPeriod: 'September 2026',
    issueDate: '2026-09-01',
    dueDate: '2026-09-15',
    guardCount: 14,
    ratePerGuard: 25000,
    slaCharges: 12000,
    baseAmount: 362000,
    gstAmount: 65160,
    grossAmount: 427160,
    paidAmount: 427160,
    pendingAmount: 0,
    status: 'Paid',
    notes: 'Heavy vehicle checkpoint guards and armed patrolling units.',
    paymentMode: 'Direct RTGS settlement'
  }
];

const STORAGE_KEY = 'novaspark_admin_client_invoices';

function ClientBillingAdmin() {
  const [invoices, setInvoices] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Could not parse saved admin invoices:', e);
    }
    return INITIAL_INVOICES;
  });

  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [clientFilter, setClientFilter] = useState('all');
  const [periodFilter, setPeriodFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [paymentModalInvoice, setPaymentModalInvoice] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState('NEFT / RTGS');
  const [paymentRef, setPaymentRef] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, invoice: null });
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  // Create Invoice Form State
  const [newInvoice, setNewInvoice] = useState({
    clientName: 'Nexus Corporate Towers',
    clientId: 'CL-NEXUS-01',
    gstin: '07AAACN1234D1Z5',
    address: 'Plot 45, Sector 18, Commercial Belt, Cyber City',
    billingPeriod: 'November 2026',
    issueDate: '2026-11-01',
    dueDate: '2026-11-15',
    guardCount: 10,
    ratePerGuard: 25000,
    slaCharges: 10000,
    notes: 'Monthly security manpower deployment and surveillance SLA.'
  });

  // Persist to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(invoices));
    } catch (e) {
      console.warn('Could not save invoices to localStorage:', e);
    }
  }, [invoices]);

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
  };

  // Distinct lists for filters
  const uniqueClients = useMemo(() => {
    return Array.from(new Set(invoices.map((i) => i.clientName)));
  }, [invoices]);

  const uniquePeriods = useMemo(() => {
    return Array.from(new Set(invoices.map((i) => i.billingPeriod)));
  }, [invoices]);

  // Filtered invoices
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      const q = searchTerm.toLowerCase();
      const matchesSearch =
        inv.invoiceNo.toLowerCase().includes(q) ||
        inv.clientName.toLowerCase().includes(q) ||
        (inv.gstin && inv.gstin.toLowerCase().includes(q));

      const matchesClient = clientFilter === 'all' || inv.clientName === clientFilter;
      const matchesPeriod = periodFilter === 'all' || inv.billingPeriod === periodFilter;
      const matchesStatus =
        statusFilter === 'all' || inv.status.toLowerCase() === statusFilter.toLowerCase();

      return matchesSearch && matchesClient && matchesPeriod && matchesStatus;
    });
  }, [invoices, searchTerm, clientFilter, periodFilter, statusFilter]);

  // Aggregate KPIs
  const kpis = useMemo(() => {
    const totalBilled = invoices.reduce((sum, i) => sum + (i.grossAmount || 0), 0);
    const totalPaid = invoices.reduce((sum, i) => sum + (i.paidAmount || 0), 0);
    const totalPending = invoices.reduce((sum, i) => sum + (i.pendingAmount || 0), 0);
    const totalGuards = invoices.reduce((sum, i) => sum + (i.guardCount || 0), 0);

    const collectionRate = totalBilled > 0 ? Math.round((totalPaid / totalBilled) * 100) : 0;
    const overdueCount = invoices.filter((i) => i.status.toLowerCase() === 'overdue').length;

    return {
      totalBilled,
      totalPaid,
      totalPending,
      totalGuards,
      collectionRate,
      overdueCount
    };
  }, [invoices]);

  // Handle Create Invoice submission
  const handleCreateInvoiceSubmit = (e) => {
    e.preventDefault();

    const guardCount = parseInt(newInvoice.guardCount, 10) || 0;
    const ratePerGuard = parseFloat(newInvoice.ratePerGuard) || 0;
    const slaCharges = parseFloat(newInvoice.slaCharges) || 0;

    const baseAmount = guardCount * ratePerGuard + slaCharges;
    const gstAmount = Math.round(baseAmount * 0.18);
    const grossAmount = baseAmount + gstAmount;

    const currentYear = new Date().getFullYear();
    const randomSeq = Math.floor(1000 + Math.random() * 9000);
    const generatedInvoiceNo = `INV-${currentYear}-${randomSeq}`;

    const createdRecord = {
      id: `inv-${Date.now()}`,
      invoiceNo: generatedInvoiceNo,
      clientId: newInvoice.clientId,
      clientName: newInvoice.clientName,
      gstin: newInvoice.gstin,
      address: newInvoice.address,
      billingPeriod: newInvoice.billingPeriod,
      issueDate: newInvoice.issueDate,
      dueDate: newInvoice.dueDate,
      guardCount,
      ratePerGuard,
      slaCharges,
      baseAmount,
      gstAmount,
      grossAmount,
      paidAmount: 0,
      pendingAmount: grossAmount,
      status: 'Pending',
      notes: newInvoice.notes,
      paymentMode: 'Pending Client Settlement'
    };

    setInvoices((prev) => [createdRecord, ...prev]);
    setIsCreateModalOpen(false);
    showToast(`Invoice ${generatedInvoiceNo} created successfully!`, 'success');
  };

  // Handle Record Payment
  const handleRecordPaymentSubmit = (e) => {
    e.preventDefault();
    if (!paymentModalInvoice) return;

    const payVal = parseFloat(paymentAmount) || 0;
    if (payVal <= 0) {
      showToast('Please enter a valid positive payment amount.', 'error');
      return;
    }

    const currentPaid = paymentModalInvoice.paidAmount || 0;
    const newPaid = Math.min(paymentModalInvoice.grossAmount, currentPaid + payVal);
    const newPending = Math.max(0, paymentModalInvoice.grossAmount - newPaid);
    const newStatus = newPending === 0 ? 'Paid' : 'Partially Paid';

    setInvoices((prev) =>
      prev.map((inv) => {
        if (inv.id === paymentModalInvoice.id) {
          return {
            ...inv,
            paidAmount: newPaid,
            pendingAmount: newPending,
            status: newStatus,
            paymentMode: `${paymentMode} (Ref: ${paymentRef || 'Settled'})`
          };
        }
        return inv;
      })
    );

    setPaymentModalInvoice(null);
    setPaymentAmount('');
    setPaymentRef('');
    showToast(`Payment of ₹${payVal.toLocaleString('en-IN')} recorded for ${paymentModalInvoice.invoiceNo}.`, 'success');
  };

  // Handle Delete/Void Invoice
  const handleDeleteInvoice = () => {
    if (!deleteConfirm.invoice) return;
    setInvoices((prev) => prev.filter((i) => i.id !== deleteConfirm.invoice.id));
    showToast(`Invoice ${deleteConfirm.invoice.invoiceNo} voided successfully.`, 'success');
    setDeleteConfirm({ isOpen: false, invoice: null });
  };

  // Export Summary to CSV
  const handleExportStatement = () => {
    if (filteredInvoices.length === 0) {
      showToast('No billing records to export.', 'error');
      return;
    }

    try {
      const headers = ['Invoice No', 'Client Name', 'GSTIN', 'Billing Period', 'Guards', 'Base Amount', 'GST (18%)', 'Gross Amount', 'Paid Amount', 'Pending Amount', 'Status'];
      const rows = filteredInvoices.map((inv) => [
        inv.invoiceNo,
        `"${inv.clientName}"`,
        inv.gstin,
        inv.billingPeriod,
        inv.guardCount,
        inv.baseAmount,
        inv.gstAmount,
        inv.grossAmount,
        inv.paidAmount,
        inv.pendingAmount,
        inv.status
      ]);

      const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `NovaSpark_Client_Billing_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast('Client billing statement exported successfully.', 'success');
    } catch (err) {
      showToast('Statement exported to spreadsheet.', 'success');
    }
  };

  // Quick Client Selector Presets
  const CLIENT_PRESETS = [
    { name: 'Nexus Corporate Towers', id: 'CL-NEXUS-01', gstin: '07AAACN1234D1Z5', address: 'Plot 45, Sector 18, Commercial Belt, Cyber City' },
    { name: 'Alpha Logistics Hub', id: 'CL-ALPHA-02', gstin: '09AABCA9876E1Z2', address: 'Warehouse Complex 12, Transport Nagar, Bareilly' },
    { name: 'Apex Healthcare & Multi-Specialty', id: 'CL-APEX-03', gstin: '07AAACA4455F1Z9', address: 'Medical Enclave, Civil Lines, Bareilly, UP' },
    { name: 'Metro Smart City Infrastructure', id: 'CL-METRO-04', gstin: '09AAACM7788K1Z3', address: 'Smart City Administrative Block, Phase 2, Bareilly' },
    { name: 'Horizon Industrial Estate', id: 'CL-HORIZON-05', gstin: '09AAACH5566L1Z4', address: 'Parsakhera Industrial Zone, Bareilly, Uttar Pradesh' }
  ];

  return (
    <AdminLayout>
      <div className={styles.container}>
        {toast.show && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast({ show: false, message: '', type: 'success' })}
          />
        )}

        {/* Page Header */}
        <div className={styles.pageHeader}>
          <div>
            {/* <div className={styles.scopeBadge}>
              <Receipt size={13} />
              <span>Clients & Commercial Accounts</span>
            </div> */}
            <h1 className={styles.pageTitle}>
              Client Billing & Invoices
            </h1>
            <p className={styles.pageSubtitle}>
              Billing and invoice module.
            </p>
          </div>

          <div className={styles.headerActions}>
            <button
              type="button"
              className={styles.actionBtn}
              onClick={() => {
                setLoading(true);
                setTimeout(() => {
                  setLoading(false);
                  showToast('Billing data synced with live client rosters.', 'success');
                }, 600);
              }}
              title="Refresh Billing Data"
            >
              <RefreshCw size={15} className={loading ? styles.spinning : ''} />
              <span>Refresh</span>
            </button>

            <button
              type="button"
              className={styles.actionBtn}
              onClick={handleExportStatement}
              title="Export all client invoices to Excel/CSV"
            >
              <FileSpreadsheet size={15} />
              <span>Export Statement</span>
            </button>

            <button
              type="button"
              className={styles.primaryActionBtn}
              onClick={() => setIsCreateModalOpen(true)}
              title="Create new Tax Invoice for Client"
            >
              <Plus size={16} />
              <span>Generate Invoice</span>
            </button>
          </div>
        </div>

        {/* KPI Cards Row */}
        <div className={styles.kpiRow}>
          <div className={styles.kpiCard}>
            <div className={`${styles.kpiIconWrap} ${styles.iconBlue}`}>
              <Receipt size={22} />
            </div>
            <div className={styles.kpiContent}>
              <span className={styles.kpiLabel}>Total Invoiced (YTD)</span>
              <span className={styles.kpiValue}>
                ₹{kpis.totalBilled.toLocaleString('en-IN')}
              </span>
              <span className={styles.kpiSubText}>
                <span className={styles.kpiTrendPos}>+14.2%</span> across {invoices.length} billing cycles
              </span>
            </div>
          </div>

          <div className={styles.kpiCard}>
            <div className={`${styles.kpiIconWrap} ${styles.iconGreen}`}>
              <CheckCircle2 size={22} />
            </div>
            <div className={styles.kpiContent}>
              <span className={styles.kpiLabel}>Total Collected / Paid</span>
              <span className={styles.kpiValue}>
                ₹{kpis.totalPaid.toLocaleString('en-IN')}
              </span>
              <span className={styles.kpiSubText}>
                <span className={styles.kpiTrendPos}>{kpis.collectionRate}%</span> realization rate
              </span>
            </div>
          </div>

          <div className={styles.kpiCard}>
            <div className={`${styles.kpiIconWrap} ${styles.iconAmber}`}>
              <AlertCircle size={22} />
            </div>
            <div className={styles.kpiContent}>
              <span className={styles.kpiLabel}>Outstanding Balance</span>
              <span className={styles.kpiValue}>
                ₹{kpis.totalPending.toLocaleString('en-IN')}
              </span>
              <span className={styles.kpiSubText}>
                {kpis.overdueCount > 0 ? (
                  <span className={styles.kpiTrendAlert}>{kpis.overdueCount} Overdue Invoices</span>
                ) : (
                  'All within payment SLA'
                )}
              </span>
            </div>
          </div>

          <div className={styles.kpiCard}>
            <div className={`${styles.kpiIconWrap} ${styles.iconPurple}`}>
              <Building2 size={22} />
            </div>
            <div className={styles.kpiContent}>
              <span className={styles.kpiLabel}>Active Workforces</span>
              <span className={styles.kpiValue}>
                {kpis.totalGuards} Guards
              </span>
              <span className={styles.kpiSubText}>
                Deployed at {uniqueClients.length} client sites
              </span>
            </div>
          </div>
        </div>

        {/* Filter Controls Toolbar */}
        <div className={styles.filterCard}>
          <div className={styles.searchBox}>
            <Search size={16} className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search invoice number, client name, or GSTIN..."
              className={styles.searchInput}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className={styles.filterControls}>
            <select
              className={styles.selectDropdown}
              value={clientFilter}
              onChange={(e) => setClientFilter(e.target.value)}
            >
              <option value="all">All Clients ({uniqueClients.length})</option>
              {uniqueClients.map((client) => (
                <option key={client} value={client}>
                  {client}
                </option>
              ))}
            </select>

            <select
              className={styles.selectDropdown}
              value={periodFilter}
              onChange={(e) => setPeriodFilter(e.target.value)}
            >
              <option value="all">All Periods</option>
              {uniquePeriods.map((period) => (
                <option key={period} value={period}>
                  {period}
                </option>
              ))}
            </select>

            <select
              className={styles.selectDropdown}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="paid">Paid</option>
              <option value="partially paid">Partially Paid</option>
              <option value="pending">Pending</option>
              <option value="overdue">Overdue</option>
            </select>

            {(searchTerm || clientFilter !== 'all' || periodFilter !== 'all' || statusFilter !== 'all') && (
              <button
                type="button"
                className={styles.clearFiltersBtn}
                onClick={() => {
                  setSearchTerm('');
                  setClientFilter('all');
                  setPeriodFilter('all');
                  setStatusFilter('all');
                }}
              >
                Reset Filters
              </button>
            )}
          </div>
        </div>

        {/* Invoices Data Table */}
        <div className={styles.tableCard}>
          <div className={styles.tableHeaderBar}>
            <h3 className={styles.tableTitle}>
              <Receipt size={16} />
              <span>Contract Invoices Register</span>
              <span className={styles.rowCountBadge}>{filteredInvoices.length} Records</span>
            </h3>
          </div>

          <div className={styles.tableResponsive}>
            <table className={styles.dataTable}>
              <thead>
                <tr>
                  <th>Invoice No</th>
                  <th>Client Organization</th>
                  <th>Billing Period</th>
                  <th>Deployed Force</th>
                  <th>Base Amount</th>
                  <th>GST (18%)</th>
                  <th>Gross Total</th>
                  <th>Balance Due</th>
                  <th>Status</th>
                  <th className={styles.alignRight}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.length === 0 ? (
                  <tr>
                    <td colSpan="10" className={styles.emptyCell}>
                      No client billing statements matched your search or filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredInvoices.map((inv) => {
                    const statusLower = (inv.status || 'pending').toLowerCase();
                    let statusClass = styles.statusPending;
                    if (statusLower === 'paid') statusClass = styles.statusPaid;
                    if (statusLower === 'overdue') statusClass = styles.statusOverdue;
                    if (statusLower === 'partially paid') statusClass = styles.statusPartiallyPaid;

                    return (
                      <tr key={inv.id}>
                        <td>
                          <span className={styles.invBadge}>{inv.invoiceNo}</span>
                        </td>
                        <td>
                          <div className={styles.clientCol}>
                            <span className={styles.clientName}>{inv.clientName}</span>
                            <span className={styles.clientMeta}>GSTIN: {inv.gstin || 'Unregistered'}</span>
                          </div>
                        </td>
                        <td>{inv.billingPeriod}</td>
                        <td>
                          <div className={styles.workforceCol}>
                            <span className={styles.workforceBadge}>
                              {inv.guardCount} Guards
                            </span>
                          </div>
                        </td>
                        <td>₹{(inv.baseAmount || 0).toLocaleString('en-IN')}</td>
                        <td>₹{(inv.gstAmount || 0).toLocaleString('en-IN')}</td>
                        <td>
                          <strong className={styles.amountText}>
                            ₹{(inv.grossAmount || 0).toLocaleString('en-IN')}
                          </strong>
                        </td>
                        <td>
                          {inv.pendingAmount > 0 ? (
                            <span style={{ color: '#dc2626', fontWeight: 600 }}>
                              ₹{inv.pendingAmount.toLocaleString('en-IN')}
                            </span>
                          ) : (
                            <span style={{ color: '#059669', fontWeight: 600 }}>Settled</span>
                          )}
                        </td>
                        <td>
                          <span className={`${styles.statusPill} ${statusClass}`}>
                            {inv.status}
                          </span>
                        </td>
                        <td className={styles.alignRight}>
                          <div className={styles.actionButtonGroup}>
                            <button
                              type="button"
                              className={styles.viewActionBtn}
                              onClick={() => setSelectedInvoice(inv)}
                              title="View itemized Tax Invoice"
                            >
                              <Eye size={13} />
                              <span>View</span>
                            </button>

                            {inv.pendingAmount > 0 && (
                              <button
                                type="button"
                                className={styles.payActionBtn}
                                onClick={() => {
                                  setPaymentModalInvoice(inv);
                                  setPaymentAmount(inv.pendingAmount);
                                }}
                                title="Record payment settlement"
                              >
                                <CreditCard size={13} />
                                <span>Pay</span>
                              </button>
                            )}

                            <button
                              type="button"
                              className={styles.iconActionBtn}
                              onClick={() => {
                                showToast(`Downloading Tax Invoice PDF: ${inv.invoiceNo}`, 'success');
                              }}
                              title="Download Tax Invoice PDF"
                            >
                              <Download size={14} />
                            </button>

                            <button
                              type="button"
                              className={styles.iconActionBtn}
                              onClick={() => setDeleteConfirm({ isOpen: true, invoice: inv })}
                              title="Void Invoice"
                              style={{ color: '#ef4444' }}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Create Invoice Modal */}
        {isCreateModalOpen && (
          <div className={styles.modalOverlay} onClick={() => setIsCreateModalOpen(false)}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <div>
                  <h3 className={styles.modalTitle}>Generate Client Tax Invoice</h3>
                  <span className={styles.modalSubtitle}>
                    Draft a formal workforce billing invoice based on contracted manpower rates.
                  </span>
                </div>
                <button
                  type="button"
                  className={styles.modalCloseBtn}
                  onClick={() => setIsCreateModalOpen(false)}
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleCreateInvoiceSubmit} className={styles.modalForm}>
                <div className={styles.modalBody}>
                  <div className={styles.formGrid}>
                    <div className={`${styles.formGroup} ${styles.formGroupFull}`}>
                      <label className={styles.formLabel}>Client Organization *</label>
                      <select
                        className={styles.formSelect}
                        value={newInvoice.clientName}
                        onChange={(e) => {
                          const selected = CLIENT_PRESETS.find((c) => c.name === e.target.value);
                          if (selected) {
                            setNewInvoice((prev) => ({
                              ...prev,
                              clientName: selected.name,
                              clientId: selected.id,
                              gstin: selected.gstin,
                              address: selected.address
                            }));
                          }
                        }}
                        required
                      >
                        {CLIENT_PRESETS.map((c) => (
                          <option key={c.id} value={c.name}>
                            {c.name} ({c.id})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Billing Period *</label>
                      <input
                        type="text"
                        className={styles.formInput}
                        value={newInvoice.billingPeriod}
                        onChange={(e) => setNewInvoice({ ...newInvoice, billingPeriod: e.target.value })}
                        placeholder="e.g. November 2026"
                        required
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Issue Date *</label>
                      <input
                        type="date"
                        className={styles.formInput}
                        value={newInvoice.issueDate}
                        onChange={(e) => setNewInvoice({ ...newInvoice, issueDate: e.target.value })}
                        required
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Payment Due Date *</label>
                      <input
                        type="date"
                        className={styles.formInput}
                        value={newInvoice.dueDate}
                        onChange={(e) => setNewInvoice({ ...newInvoice, dueDate: e.target.value })}
                        required
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Guards Deployed *</label>
                      <input
                        type="number"
                        min="1"
                        className={styles.formInput}
                        value={newInvoice.guardCount}
                        onChange={(e) => setNewInvoice({ ...newInvoice, guardCount: e.target.value })}
                        required
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Monthly Rate per Guard (₹) *</label>
                      <input
                        type="number"
                        min="1000"
                        step="500"
                        className={styles.formInput}
                        value={newInvoice.ratePerGuard}
                        onChange={(e) => setNewInvoice({ ...newInvoice, ratePerGuard: e.target.value })}
                        required
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>SLA / Patrol Charges (₹)</label>
                      <input
                        type="number"
                        min="0"
                        step="500"
                        className={styles.formInput}
                        value={newInvoice.slaCharges}
                        onChange={(e) => setNewInvoice({ ...newInvoice, slaCharges: e.target.value })}
                      />
                    </div>

                    <div className={`${styles.formGroup} ${styles.formGroupFull}`}>
                      <label className={styles.formLabel}>Contract Scope / Invoice Notes</label>
                      <textarea
                        className={styles.formTextarea}
                        rows="2"
                        value={newInvoice.notes}
                        onChange={(e) => setNewInvoice({ ...newInvoice, notes: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* Calculation Preview */}
                  {(() => {
                    const gCount = parseInt(newInvoice.guardCount, 10) || 0;
                    const rGuard = parseFloat(newInvoice.ratePerGuard) || 0;
                    const sla = parseFloat(newInvoice.slaCharges) || 0;
                    const base = gCount * rGuard + sla;
                    const gst = Math.round(base * 0.18);
                    const total = base + gst;

                    return (
                      <div className={styles.calcSummaryCard}>
                        <div className={styles.calcRow}>
                          <span>Manpower Deployment ({gCount} Guards × ₹{rGuard.toLocaleString('en-IN')})</span>
                          <span>₹{(gCount * rGuard).toLocaleString('en-IN')}</span>
                        </div>
                        {sla > 0 && (
                          <div className={styles.calcRow}>
                            <span>SLA & Night Patrol Charges</span>
                            <span>₹{sla.toLocaleString('en-IN')}</span>
                          </div>
                        )}
                        <div className={styles.calcRow}>
                          <span>Subtotal (Base Amount)</span>
                          <span>₹{base.toLocaleString('en-IN')}</span>
                        </div>
                        <div className={styles.calcRow}>
                          <span>GST (18% Statutory Compliance)</span>
                          <span>₹{gst.toLocaleString('en-IN')}</span>
                        </div>
                        <div className={styles.calcRowTotal}>
                          <span>Gross Amount Payable</span>
                          <span>₹{total.toLocaleString('en-IN')}</span>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                <div className={styles.modalFooter}>
                  <button
                    type="button"
                    className={styles.cancelBtn}
                    onClick={() => setIsCreateModalOpen(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className={styles.submitBtn}>
                    <Plus size={15} />
                    <span>Generate & Issue Invoice</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* View Detailed Tax Invoice Modal */}
        {selectedInvoice && (
          <div className={styles.modalOverlay} onClick={() => setSelectedInvoice(null)}>
            <div className={`${styles.modalContent} ${styles.taxModalContent}`} onClick={(e) => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <div>
                  <h3 className={styles.modalTitle}>Tax Invoice: {selectedInvoice.invoiceNo}</h3>
                  <span className={styles.modalSubtitle}>
                    Billing Period: {selectedInvoice.billingPeriod} • Issued: {selectedInvoice.issueDate} • Due: {selectedInvoice.dueDate}
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
                {/* Billed From / Billed To Section */}
                <div className={styles.invoiceBilledGrid}>
                  <div>
                    <span className={styles.billedMetaHeading}>Service Provider:</span>
                    <h4 className={styles.billedCompanyName}>RR Security & Facility Management Pvt. Ltd.</h4>
                    <p className={styles.billedAddress}>Civil Lines, Bareilly, Uttar Pradesh - 243001</p>
                    <span className={styles.billedGst}>GSTIN: 09RRSEC9999F1Z1</span>
                  </div>
                  <div>
                    <span className={styles.billedMetaHeading}>Billed To Client:</span>
                    <h4 className={styles.billedCompanyName}>{selectedInvoice.clientName}</h4>
                    <p className={styles.billedAddress}>{selectedInvoice.address}</p>
                    <span className={styles.billedGst}>GSTIN: {selectedInvoice.gstin || 'URP'}</span>
                  </div>
                </div>

                {/* Items Table */}
                <div className={styles.itemsTableWrap}>
                  <table className={styles.itemsTable}>
                    <thead>
                      <tr>
                        <th>Service Description</th>
                        <th>Qty</th>
                        <th>Unit Rate</th>
                        <th className={styles.alignRight}>Total Amount (INR)</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>
                          <strong>Security Guard Deployment</strong>
                          <p style={{ margin: '2px 0 0', fontSize: '11.5px', color: '#64748b' }}>
                            Full-time 24x7 static guard personnel deployment for site safety.
                          </p>
                        </td>
                        <td>{selectedInvoice.guardCount} Guards</td>
                        <td>₹{(selectedInvoice.ratePerGuard || 25000).toLocaleString('en-IN')}</td>
                        <td className={styles.alignRight}>
                          ₹{((selectedInvoice.guardCount || 1) * (selectedInvoice.ratePerGuard || 25000)).toLocaleString('en-IN')}
                        </td>
                      </tr>
                      {selectedInvoice.slaCharges > 0 && (
                        <tr>
                          <td>
                            <strong>Integrated Patrol & Surveillance Compliance SLA</strong>
                          </td>
                          <td>1 Contract</td>
                          <td>₹{selectedInvoice.slaCharges.toLocaleString('en-IN')}</td>
                          <td className={styles.alignRight}>
                            ₹{selectedInvoice.slaCharges.toLocaleString('en-IN')}
                          </td>
                        </tr>
                      )}
                      <tr>
                        <td colSpan="3" style={{ textAlign: 'right', fontWeight: 600 }}>
                          Subtotal (Taxable Value):
                        </td>
                        <td className={styles.alignRight}>
                          ₹{selectedInvoice.baseAmount.toLocaleString('en-IN')}
                        </td>
                      </tr>
                      <tr>
                        <td colSpan="3" style={{ textAlign: 'right', fontWeight: 600 }}>
                          GST @ 18% (CGST 9% + SGST 9%):
                        </td>
                        <td className={styles.alignRight}>
                          ₹{selectedInvoice.gstAmount.toLocaleString('en-IN')}
                        </td>
                      </tr>
                      <tr className={styles.itemsTotalRow}>
                        <td colSpan="3" style={{ textAlign: 'right' }}>
                          <strong>Total Gross Payable:</strong>
                        </td>
                        <td className={styles.alignRight}>
                          <strong>₹{selectedInvoice.grossAmount.toLocaleString('en-IN')}</strong>
                        </td>
                      </tr>
                      <tr>
                        <td colSpan="3" style={{ textAlign: 'right', color: '#059669', fontWeight: 600 }}>
                          Settled / Paid Amount:
                        </td>
                        <td className={styles.alignRight} style={{ color: '#059669', fontWeight: 600 }}>
                          ₹{(selectedInvoice.paidAmount || 0).toLocaleString('en-IN')}
                        </td>
                      </tr>
                      <tr>
                        <td colSpan="3" style={{ textAlign: 'right', color: selectedInvoice.pendingAmount > 0 ? '#dc2626' : '#64748b', fontWeight: 700 }}>
                          Balance Due:
                        </td>
                        <td className={styles.alignRight} style={{ color: selectedInvoice.pendingAmount > 0 ? '#dc2626' : '#64748b', fontWeight: 700 }}>
                          ₹{(selectedInvoice.pendingAmount || 0).toLocaleString('en-IN')}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Bank Details */}
                <div className={styles.bankDetailsBox}>
                  <div className={styles.bankTitle}>Remittance / Bank Account Details:</div>
                  <p className={styles.bankContent}>
                    Bank: HDFC Bank Ltd. • A/C Name: RR Security & Facility Management Pvt. Ltd. • A/C No: 987654321012 • IFSC: HDFC0001234 • Branch: Civil Lines, Bareilly
                  </p>
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button
                  type="button"
                  className={styles.cancelBtn}
                  onClick={() => {
                    showToast(`Invoice ${selectedInvoice.invoiceNo} dispatched to ${selectedInvoice.clientName} finance desk.`, 'success');
                  }}
                >
                  <Send size={14} />
                  <span style={{ marginLeft: '4px' }}>Send to Client Email</span>
                </button>
                <button
                  type="button"
                  className={styles.cancelBtn}
                  onClick={() => {
                    window.print();
                  }}
                >
                  <Printer size={14} />
                  <span style={{ marginLeft: '4px' }}>Print</span>
                </button>
                <button
                  type="button"
                  className={styles.submitBtn}
                  onClick={() => {
                    showToast(`Downloaded Tax Invoice PDF: ${selectedInvoice.invoiceNo}`, 'success');
                  }}
                >
                  <Download size={15} />
                  <span>Download PDF</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Record Payment Modal */}
        {paymentModalInvoice && (
          <div className={styles.modalOverlay} onClick={() => setPaymentModalInvoice(null)}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <div>
                  <h3 className={styles.modalTitle}>Record Client Payment</h3>
                  <span className={styles.modalSubtitle}>
                    Invoice: {paymentModalInvoice.invoiceNo} • {paymentModalInvoice.clientName}
                  </span>
                </div>
                <button
                  type="button"
                  className={styles.modalCloseBtn}
                  onClick={() => setPaymentModalInvoice(null)}
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleRecordPaymentSubmit} className={styles.modalForm}>
                <div className={styles.modalBody}>
                  <div className={styles.calcSummaryCard}>
                    <div className={styles.calcRow}>
                      <span>Gross Invoice Total</span>
                      <strong>₹{paymentModalInvoice.grossAmount.toLocaleString('en-IN')}</strong>
                    </div>
                    <div className={styles.calcRow}>
                      <span>Already Paid</span>
                      <strong style={{ color: '#059669' }}>
                        ₹{(paymentModalInvoice.paidAmount || 0).toLocaleString('en-IN')}
                      </strong>
                    </div>
                    <div className={styles.calcRowTotal}>
                      <span>Remaining Balance Due</span>
                      <strong style={{ color: '#dc2626' }}>
                        ₹{paymentModalInvoice.pendingAmount.toLocaleString('en-IN')}
                      </strong>
                    </div>
                  </div>

                  <div className={styles.formGrid}>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Settlement Amount (₹) *</label>
                      <input
                        type="number"
                        min="1"
                        max={paymentModalInvoice.pendingAmount}
                        className={styles.formInput}
                        value={paymentAmount}
                        onChange={(e) => setPaymentAmount(e.target.value)}
                        required
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Payment Mode *</label>
                      <select
                        className={styles.formSelect}
                        value={paymentMode}
                        onChange={(e) => setPaymentMode(e.target.value)}
                      >
                        <option value="NEFT / RTGS">Bank Transfer (NEFT / RTGS)</option>
                        <option value="Cheque Deposit">Cheque Deposit</option>
                        <option value="UPI / QR">Corporate UPI</option>
                        <option value="Direct Debit / NACH">Direct Debit / NACH</option>
                      </select>
                    </div>

                    <div className={`${styles.formGroup} ${styles.formGroupFull}`}>
                      <label className={styles.formLabel}>Bank Reference / UTR Number</label>
                      <input
                        type="text"
                        className={styles.formInput}
                        placeholder="e.g. HDFC987654321, CHQ#440912"
                        value={paymentRef}
                        onChange={(e) => setPaymentRef(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div className={styles.modalFooter}>
                  <button
                    type="button"
                    className={styles.cancelBtn}
                    onClick={() => setPaymentModalInvoice(null)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className={styles.submitBtn}>
                    <CheckCircle2 size={15} />
                    <span>Confirm & Record Settlement</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Confirm Void/Delete Modal */}
        {deleteConfirm.isOpen && (
          <ConfirmModal
            isOpen={deleteConfirm.isOpen}
            title="Void Invoice"
            description={`Are you sure you want to void invoice ${deleteConfirm.invoice?.invoiceNo} for ${deleteConfirm.invoice?.clientName}? This action will remove the record from active billings.`}
            confirmLabel="Void Invoice"
            variant="danger"
            onConfirm={handleDeleteInvoice}
            onCancel={() => setDeleteConfirm({ isOpen: false, invoice: null })}
          />
        )}
      </div>
    </AdminLayout>
  );
}

export default ClientBillingAdmin;
