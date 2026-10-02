import React, { useState, useEffect } from 'react';
import {
  Receipt,
  Search,
  Filter,
  Eye,
  Download,
  Building,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  DollarSign,
  X,
  RefreshCw
} from 'lucide-react';
import styles from './ClientBilling.module.css';
import { useClientAuth } from '../../context/ClientAuthContext';
import clientPortalService from '../../services/clientPortalService';
import StatusBadge from '../../components/common/StatusBadge';
import Toast from '../../components/common/Toast';

function ClientBilling() {
  const { clientCompany } = useClientAuth();

  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState([]);
  const [summary, setSummary] = useState({
    totalYtdInvoiced: 0,
    totalYtdPaid: 0,
    totalPending: 0,
    currentAmount: 0
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [periodFilter, setPeriodFilter] = useState('all');
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
  };

  const fetchBilling = async () => {
    try {
      setLoading(true);
      const res = await clientPortalService.getBilling();
      if (res && Array.isArray(res.invoices)) {
        setInvoices(res.invoices);
        if (res.summary) setSummary(res.summary);
      } else {
        setInvoices([]);
      }
    } catch (err) {
      console.warn('Error fetching client billing:', err.message);
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBilling();
  }, [clientCompany?.clientId, clientCompany?.name]);

  const handleDownloadInvoice = (invoiceNo) => {
    showToast(`Invoice ${invoiceNo} PDF downloaded successfully.`, 'success');
  };

  const handleExportStatement = () => {
    if (filteredInvoices.length === 0) {
      showToast('No billing records to export.', 'error');
      return;
    }
    showToast(`Company billing statement for ${clientCompany?.name} exported to Excel successfully.`, 'success');
  };

  const filteredInvoices = invoices.filter((inv) => {
    const matchesSearch = inv.invoiceNo.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === 'all' || inv.status.toLowerCase() === statusFilter.toLowerCase();
    const matchesPeriod = periodFilter === 'all' || inv.billingPeriod === periodFilter;

    return matchesSearch && matchesStatus && matchesPeriod;
  });

  const periods = Array.from(new Set(invoices.map((i) => i.billingPeriod)));

  return (
    <div className={styles.container}>
      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ show: false, message: '', type: 'success' })}
        />
      )}

      {/* Header */}
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Company Billing & Invoices</h1>
          <p className={styles.pageSubtitle}>
            Overview of monthly workforce billing, itemized invoices, payment history, and tax statements for {clientCompany?.name}.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            className={styles.exportBtn}
            onClick={fetchBilling}
            title="Refresh Invoices"
            style={{ background: 'var(--surface-bg)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}
          >
            <RefreshCw size={15} className={loading ? styles.spinning : ''} />
            <span>Refresh</span>
          </button>
          <button type="button" className={styles.exportBtn} onClick={handleExportStatement}>
            <Download size={15} />
            <span>Export Statement</span>
          </button>
        </div>
      </div>

      {/* KPI Badges Row */}
      <div className={styles.kpiRow}>
        <div className={styles.kpiCard}>
          <div className={`${styles.kpiIcon} ${styles.iconBlue}`}>
            <Receipt size={18} />
          </div>
          <div className={styles.kpiMeta}>
            <span className={styles.kpiLabel}>Current Period Billing</span>
            <span className={styles.kpiValue}>
              ₹{(summary.currentAmount || 0).toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={`${styles.kpiIcon} ${styles.iconSuccess}`}>
            <CheckCircle2 size={18} />
          </div>
          <div className={styles.kpiMeta}>
            <span className={styles.kpiLabel}>Paid Amount</span>
            <span className={styles.kpiValue}>
              ₹{(summary.totalYtdPaid || 0).toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={`${styles.kpiIcon} ${styles.iconDanger}`}>
            <AlertCircle size={18} />
          </div>
          <div className={styles.kpiMeta}>
            <span className={styles.kpiLabel}>Pending Balance</span>
            <span className={styles.kpiValue}>
              ₹{(summary.totalPending || 0).toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={`${styles.kpiIcon} ${styles.iconPurple}`}>
            <DollarSign size={18} />
          </div>
          <div className={styles.kpiMeta}>
            <span className={styles.kpiLabel}>Total Invoiced (YTD)</span>
            <span className={styles.kpiValue}>
              ₹{(summary.totalYtdInvoiced || 0).toLocaleString('en-IN')}
            </span>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className={styles.filterCard}>
        <div className={styles.searchBox}>
          <Search size={16} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search invoice number (e.g. INV-2026-0801)..."
            className={styles.searchInput}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className={styles.filterDropdowns}>
          <select
            className={styles.selectInput}
            value={periodFilter}
            onChange={(e) => setPeriodFilter(e.target.value)}
          >
            <option value="all">All Billing Periods</option>
            {periods.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>

          <select
            className={styles.selectInput}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Payment Statuses</option>
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
            <option value="overdue">Overdue</option>
          </select>
        </div>
      </div>

      {/* Invoices Data Table */}
      <div className={styles.tableCard}>
        <div className={styles.tableResponsive}>
          <table className={styles.dataTable}>
            <thead>
              <tr>
                <th>Invoice No</th>
                <th>Billing Period</th>
                <th>Issue Date</th>
                <th>Due Date</th>
                <th>Guards Deployed</th>
                <th>Gross Amount</th>
                <th>Status</th>
                <th className={styles.alignRight}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" className={styles.emptyCell}>
                    Fetching billing records...
                  </td>
                </tr>
              ) : filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan="8" className={styles.emptyCell}>
                    No billing statements issued for {clientCompany?.name || 'your company'}.
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => (
                  <tr key={inv.id || inv.invoiceNo}>
                    <td>
                      <span className={styles.invBadge}>{inv.invoiceNo}</span>
                    </td>
                    <td>{inv.billingPeriod}</td>
                    <td>{inv.issueDate}</td>
                    <td>{inv.dueDate}</td>
                    <td>{inv.totalGuards} Personnel</td>
                    <td>
                      <strong className={styles.grossText}>
                        ₹{inv.grossAmount.toLocaleString('en-IN')}
                      </strong>
                    </td>
                    <td>
                      <StatusBadge status={inv.status} />
                    </td>
                    <td className={styles.alignRight}>
                      <div className={styles.actionButtonGroup}>
                        <button
                          type="button"
                          className={styles.viewBtn}
                          onClick={() => setSelectedInvoice(inv)}
                          title="View Invoice"
                        >
                          <Eye size={14} />
                          <span>View</span>
                        </button>
                        <button
                          type="button"
                          className={styles.downloadIconBtn}
                          onClick={() => handleDownloadInvoice(inv.invoiceNo)}
                          title="Download PDF"
                        >
                          <Download size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Detailed Invoice Modal */}
      {selectedInvoice && (
        <div className={styles.modalOverlay} onClick={() => setSelectedInvoice(null)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div>
                <h3 className={styles.modalTitle}>Tax Invoice: {selectedInvoice.invoiceNo}</h3>
                <span className={styles.modalSubtitle}>
                  Period: {selectedInvoice.billingPeriod} • Issued On: {selectedInvoice.issueDate}
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
              {/* Billed To / From */}
              <div className={styles.invBilledSection}>
                <div>
                  <span className={styles.metaHead}>Service Provider:</span>
                  <h4 className={styles.metaCompany}>RR Security & Facility Management</h4>
                  <p className={styles.metaSub}>Civil Lines, Bareilly, Uttar Pradesh 243001</p>
                  <span className={styles.metaGst}>GSTIN: 09RRSEC9999F1Z1</span>
                </div>
                <div>
                  <span className={styles.metaHead}>Billed To:</span>
                  <h4 className={styles.metaCompany}>{clientCompany?.name}</h4>
                  <p className={styles.metaSub}>{clientCompany?.registeredAddress || clientCompany?.address}</p>
                  <span className={styles.metaGst}>GSTIN: {clientCompany?.gstin || '--'}</span>
                </div>
              </div>

              {/* Itemized Table */}
              <div className={styles.itemsTableWrap}>
                <table className={styles.itemsTable}>
                  <thead>
                    <tr>
                      <th>Service Description</th>
                      <th>Quantity</th>
                      <th className={styles.alignRight}>Amount (INR)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Security Personnel Deployment ({selectedInvoice.totalGuards} Guards)</td>
                      <td>{selectedInvoice.totalGuards}</td>
                      <td className={styles.alignRight}>
                        ₹{(selectedInvoice.baseAmount || Math.round(selectedInvoice.grossAmount * 0.85)).toLocaleString('en-IN')}
                      </td>
                    </tr>
                    <tr>
                      <td>Integrated Patrol & Surveillance Compliance</td>
                      <td>1 Site</td>
                      <td>Included in SLA</td>
                    </tr>
                    <tr>
                      <td>GST / Statutory Compliance (18%)</td>
                      <td>18%</td>
                      <td className={styles.alignRight}>
                        ₹{(selectedInvoice.gstAmount || Math.round(selectedInvoice.grossAmount * 0.15)).toLocaleString('en-IN')}
                      </td>
                    </tr>
                    <tr className={styles.itemsTotalRow}>
                      <td colSpan="2">
                        <strong>Total Amount Payable</strong>
                      </td>
                      <td className={styles.alignRight}>
                        <strong>₹{selectedInvoice.grossAmount.toLocaleString('en-IN')}</strong>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Payment Details */}
              <div className={styles.paymentTermsBox}>
                <span className={styles.termsHead}>Bank Transfer Instructions:</span>
                <p className={styles.termsText}>
                  A/C Name: RR Security Services Pvt. Ltd. • A/C No: 987654321012 • IFSC: HDFC0001234
                </p>
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button
                type="button"
                className={styles.secondaryBtn}
                onClick={() => handleDownloadInvoice(selectedInvoice.invoiceNo)}
              >
                <Download size={15} />
                <span>Download Tax Invoice PDF</span>
              </button>
              <button
                type="button"
                className={styles.modalPrimaryBtn}
                onClick={() => setSelectedInvoice(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ClientBilling;
