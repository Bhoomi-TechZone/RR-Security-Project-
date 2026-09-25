import React, { useState } from 'react';
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
  X
} from 'lucide-react';
import styles from './ClientBilling.module.css';
import { useClientAuth } from '../../context/ClientAuthContext';
import {
  CLIENT_BILLING_INVOICES,
  CLIENT_DASHBOARD_KPIS
} from '../../data/clientPortalData';
import StatusBadge from '../../components/common/StatusBadge';
import Toast from '../../components/common/Toast';

function ClientBilling() {
  const { clientCompany } = useClientAuth();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [periodFilter, setPeriodFilter] = useState('all');
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
  };

  const handleDownloadInvoice = (invoiceNo) => {
    showToast(`Invoice ${invoiceNo} PDF downloaded successfully.`, 'success');
  };

  const handleExportStatement = () => {
    showToast('Company billing statement exported to Excel successfully.', 'success');
  };

  const filteredInvoices = CLIENT_BILLING_INVOICES.filter((inv) => {
    const matchesSearch = inv.invoiceNo.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === 'all' || inv.status.toLowerCase() === statusFilter.toLowerCase();
    const matchesPeriod = periodFilter === 'all' || inv.billingPeriod === periodFilter;

    return matchesSearch && matchesStatus && matchesPeriod;
  });

  const periods = Array.from(new Set(CLIENT_BILLING_INVOICES.map((i) => i.billingPeriod)));

  const totalYtdInvoiced = CLIENT_BILLING_INVOICES.reduce((sum, i) => sum + i.grossAmount, 0);

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
            Overview of monthly workforce billing, itemized invoices, payment history, and tax statements.
          </p>
        </div>

        <button type="button" className={styles.exportBtn} onClick={handleExportStatement}>
          <Download size={15} />
          <span>Export Billing Statement</span>
        </button>
      </div>

      {/* KPI Badges Row */}
      <div className={styles.kpiRow}>
        <div className={styles.kpiCard}>
          <div className={`${styles.kpiIcon} ${styles.iconBlue}`}>
            <Receipt size={18} />
          </div>
          <div className={styles.kpiMeta}>
            <span className={styles.kpiLabel}>Current Month Billing</span>
            <span className={styles.kpiValue}>
              ₹{CLIENT_DASHBOARD_KPIS.currentBillingAmount.toLocaleString('en-IN')}
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
              ₹{CLIENT_DASHBOARD_KPIS.paidAmount.toLocaleString('en-IN')}
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
              ₹{CLIENT_DASHBOARD_KPIS.pendingAmount.toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={`${styles.kpiIcon} ${styles.iconPurple}`}>
            <FileText size={18} />
          </div>
          <div className={styles.kpiMeta}>
            <span className={styles.kpiLabel}>Total YTD Invoiced</span>
            <span className={styles.kpiValue}>
              ₹{totalYtdInvoiced.toLocaleString('en-IN')}
            </span>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className={styles.filterCard}>
        <div className={styles.searchBox}>
          <Search size={16} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search by invoice number (e.g. INV-2026-0801)..."
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

      {/* Invoices Table */}
      <div className={styles.tableCard}>
        <div className={styles.tableResponsive}>
          <table className={styles.dataTable}>
            <thead>
              <tr>
                <th>Invoice No.</th>
                <th>Billing Period</th>
                <th>Manpower Deployed</th>
                <th>Gross Amount</th>
                <th>Paid Amount</th>
                <th>Pending Amount</th>
                <th>Due Date</th>
                <th>Status</th>
                <th className={styles.alignRight}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan="9" className={styles.emptyCell}>
                    No invoices found matching your filters.
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => (
                  <tr key={inv.id}>
                    <td>
                      <span className={styles.invBadge}>{inv.invoiceNo}</span>
                    </td>
                    <td>
                      <span className={styles.periodText}>{inv.billingPeriod}</span>
                    </td>
                    <td>{inv.totalManpowerCount} Personnel</td>
                    <td>
                      <strong>₹{inv.grossAmount.toLocaleString('en-IN')}</strong>
                    </td>
                    <td>
                      <span className={styles.paidText}>
                        ₹{inv.paidAmount.toLocaleString('en-IN')}
                      </span>
                    </td>
                    <td>
                      <span className={inv.pendingAmount > 0 ? styles.pendingText : styles.settledText}>
                        ₹{inv.pendingAmount.toLocaleString('en-IN')}
                      </span>
                    </td>
                    <td>{inv.dueDate}</td>
                    <td>
                      <StatusBadge status={inv.status} />
                    </td>
                    <td className={styles.alignRight}>
                      <div className={styles.actionBtnGroup}>
                        <button
                          type="button"
                          className={styles.actionBtn}
                          onClick={() => setSelectedInvoice(inv)}
                          title="View Itemized Breakdown"
                        >
                          <Eye size={14} />
                          <span>View</span>
                        </button>
                        <button
                          type="button"
                          className={styles.downloadBtn}
                          onClick={() => handleDownloadInvoice(inv.invoiceNo)}
                          title="Download Invoice PDF"
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

      {/* Invoice Breakdown Modal */}
      {selectedInvoice && (
        <div className={styles.modalOverlay} onClick={() => setSelectedInvoice(null)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div>
                <h3 className={styles.modalTitle}>Invoice {selectedInvoice.invoiceNo}</h3>
                <span className={styles.modalSubtitle}>
                  Period: {selectedInvoice.billingPeriod} • Issue Date: {selectedInvoice.issueDate} • Due Date: {selectedInvoice.dueDate}
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
              <div className={styles.invMetaBox}>
                <div>
                  <span className={styles.metaLabel}>Billed Client</span>
                  <h4 className={styles.clientName}>{clientCompany?.name}</h4>
                  <p className={styles.addressText}>{clientCompany?.registeredAddress}</p>
                  <span className={styles.gstText}>GSTIN: {clientCompany?.gstin}</span>
                </div>
                <div className={styles.invStatusCol}>
                  <StatusBadge status={selectedInvoice.status} />
                  <span className={styles.invAmountHeader}>
                    ₹{selectedInvoice.grossAmount.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              <h4 className={styles.sectionTitle}>Itemized Manpower Breakdown</h4>
              <div className={styles.tableWrap}>
                <table className={styles.invTable}>
                  <thead>
                    <tr>
                      <th>Description</th>
                      <th className={styles.alignRight}>Amount (INR)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedInvoice.items?.map((item, idx) => (
                      <tr key={idx}>
                        <td>{item.description}</td>
                        <td className={styles.alignRight}>
                          ₹{item.amount.toLocaleString('en-IN')}
                        </td>
                      </tr>
                    ))}
                    <tr>
                      <td>Central GST (CGST @ 9%)</td>
                      <td className={styles.alignRight}>
                        ₹{selectedInvoice.taxes.cgst.toLocaleString('en-IN')}
                      </td>
                    </tr>
                    <tr>
                      <td>State GST (SGST @ 9%)</td>
                      <td className={styles.alignRight}>
                        ₹{selectedInvoice.taxes.sgst.toLocaleString('en-IN')}
                      </td>
                    </tr>
                    <tr className={styles.invTotalRow}>
                      <td><strong>Total Gross Payable Amount</strong></td>
                      <td className={styles.alignRight}>
                        <strong>₹{selectedInvoice.grossAmount.toLocaleString('en-IN')}</strong>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button
                type="button"
                className={styles.exportBtn}
                onClick={() => handleDownloadInvoice(selectedInvoice.invoiceNo)}
              >
                <Download size={14} />
                <span>Download Invoice PDF</span>
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
