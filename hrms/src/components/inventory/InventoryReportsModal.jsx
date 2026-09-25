import React, { useState, useMemo } from 'react';
import { X, FileSpreadsheet, FileText, Download, Printer, Filter, CheckCircle2, Calendar, Search, Package } from 'lucide-react';
import styles from './InventoryReportsModal.module.css';

const REPORT_TYPES = [
  { id: 'current_stock', name: '1. Current Stock Report', desc: 'Real-time stock on hand, min level thresholds, and stock status' },
  { id: 'size_wise', name: '2. Size-wise Stock Report', desc: 'Breakdown of inventory by size variants across categories' },
  { id: 'item_wise', name: '3. Item-wise Stock Report', desc: 'Comprehensive item specifications, issued vs remaining qty' },
  { id: 'location_wise', name: '4. Location-wise Stock Report', desc: 'Stock allocation by client sites and central warehouses' },
  { id: 'employee_asset', name: '5. Employee-wise Asset Report', desc: 'All assets currently issued to active personnel' },
  { id: 'movement', name: '6. IN/OUT Movement Report', desc: 'Audit trail of inward, issue out, and returns' },
  { id: 'issue_register', name: '7. Uniform Issue Register', desc: 'Log of issued uniform and accessories with employee details' },
  { id: 'return_register', name: '8. Uniform Return Register', desc: 'Return log, condition assessment, and restock records' },
  { id: 'damaged_lost', name: '9. Damaged / Lost Asset Report', desc: 'Audit of unserviceable, damaged, and missing equipment' },
  { id: 'valuation', name: '10. Stock Valuation Report', desc: 'Financial valuation by category: Qty × Purchase Rate' },
  { id: 'low_stock', name: '11. Low Stock Alert Report', desc: 'Items requiring immediate purchase or replenishment' },
  { id: 'exit_clearance', name: '12. Employee Exit Clearance Report', desc: 'Asset handover status for exiting staff' }
];

export default function InventoryReportsModal({
  isOpen,
  items = [],
  issuedList = [],
  returnHistory = [],
  movements = [],
  clearances = [],
  onClose
}) {
  const [selectedReportId, setSelectedReportId] = useState('current_stock');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [format, setFormat] = useState('excel');
  const [dateRange, setDateRange] = useState({ from: '2026-08-01', to: '2026-08-31' });

  const activeReport = useMemo(() => {
    return REPORT_TYPES.find((r) => r.id === selectedReportId) || REPORT_TYPES[0];
  }, [selectedReportId]);

  // Compute table preview data according to report type
  const reportData = useMemo(() => {
    switch (selectedReportId) {
      case 'current_stock':
      case 'item_wise':
        return items
          .filter((i) => categoryFilter === 'ALL' || i.category === categoryFilter)
          .filter((i) => i.itemName.toLowerCase().includes(searchTerm.toLowerCase()) || i.itemCode.toLowerCase().includes(searchTerm.toLowerCase()))
          .map((i) => ({
            col1: i.itemCode,
            col2: i.itemName,
            col3: `${i.category} (${i.size || 'Free Size'})`,
            col4: `${i.availableQuantity} ${i.unit}`,
            col5: `₹${(i.availableQuantity * (i.purchaseRate || 0)).toLocaleString('en-IN')}`,
            col6: i.availableQuantity === 0 ? 'Out of Stock' : i.availableQuantity <= i.minimumStock ? 'Low Stock' : 'In Stock'
          }));

      case 'size_wise':
        return items
          .filter((i) => categoryFilter === 'ALL' || i.category === categoryFilter)
          .map((i) => ({
            col1: i.itemName,
            col2: i.category,
            col3: i.size || 'Standard',
            col4: `${i.availableQuantity} ${i.unit}`,
            col5: `Issued: ${i.issuedQuantity || 0}`,
            col6: i.color || 'Standard'
          }));

      case 'low_stock':
        return items
          .filter((i) => i.availableQuantity <= i.minimumStock)
          .map((i) => ({
            col1: i.itemCode,
            col2: i.itemName,
            col3: i.category,
            col4: `Current: ${i.availableQuantity} (Min: ${i.minimumStock})`,
            col5: `Shortfall: ${Math.max(0, i.minimumStock - i.availableQuantity)}`,
            col6: i.availableQuantity === 0 ? 'CRITICAL (0 Qty)' : 'REORDER REQUIRED'
          }));

      case 'valuation':
        return items
          .filter((i) => categoryFilter === 'ALL' || i.category === categoryFilter)
          .map((i) => ({
            col1: i.itemCode,
            col2: i.itemName,
            col3: `${i.availableQuantity} ${i.unit}`,
            col4: `₹${i.purchaseRate}`,
            col5: `₹${(i.availableQuantity * (i.purchaseRate || 0)).toLocaleString('en-IN')}`,
            col6: i.status || 'Active'
          }));

      case 'issue_register':
      case 'employee_asset':
        return issuedList
          .filter((iss) => iss.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) || iss.itemName.toLowerCase().includes(searchTerm.toLowerCase()))
          .map((iss) => ({
            col1: iss.id,
            col2: `${iss.employeeName} (${iss.employeeId})`,
            col3: `${iss.itemName} [${iss.size}]`,
            col4: `Qty: ${iss.quantity} (Pending: ${iss.pendingQuantity ?? (iss.quantity - (iss.returnedQuantity || 0))})`,
            col5: iss.issueDate,
            col6: iss.status
          }));

      case 'return_register':
        return returnHistory.map((ret) => ({
          col1: ret.id,
          col2: `${ret.employeeName} (${ret.employeeId})`,
          col3: `${ret.itemName} [${ret.size}]`,
          col4: `Returned: ${ret.returnedQuantity}`,
          col5: ret.returnDate,
          col6: `Condition: ${ret.condition}`
        }));

      case 'damaged_lost':
        return returnHistory
          .filter((r) => r.condition === 'Damaged' || r.condition === 'Lost')
          .map((r) => ({
            col1: r.id,
            col2: `${r.employeeName} (${r.employeeId})`,
            col3: r.itemName,
            col4: `Qty: ${r.returnedQuantity}`,
            col5: r.condition === 'Damaged' ? 'DAMAGED STOCK' : 'LOST ASSET',
            col6: r.remarks || 'Under inspection'
          }));

      case 'movement':
      case 'location_wise':
        return movements.slice(0, 50).map((m) => ({
          col1: m.date,
          col2: m.movementType,
          col3: `${m.itemName} (${m.itemCode})`,
          col4: `Qty: ${m.quantityChange > 0 ? '+' + m.quantityChange : m.quantityChange}`,
          col5: m.employeeName || m.location || 'Warehouse',
          col6: m.reference || m.performedBy
        }));

      case 'exit_clearance':
        return clearances.map((c) => ({
          col1: c.id,
          col2: `${c.employeeName} (${c.employeeId})`,
          col3: `${c.clientName} (${c.site})`,
          col4: `Exit: ${c.exitDate}`,
          col5: `Pending: ${c.assignedAssets.reduce((acc, a) => acc + a.pendingQty, 0)} items`,
          col6: c.clearanceStatus
        }));

      default:
        return [];
    }
  }, [selectedReportId, items, issuedList, returnHistory, movements, clearances, categoryFilter, searchTerm]);

  const handleExport = () => {
    // Generate CSV export
    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += `Report: ${activeReport.name}\r\nGenerated Date: ${new Date().toLocaleDateString()}\r\n\r\n`;
    csvContent += 'Column 1,Column 2,Column 3,Column 4,Column 5,Column 6\r\n';

    reportData.forEach((row) => {
      csvContent += `"${row.col1}","${row.col2}","${row.col3}","${row.col4}","${row.col5}","${row.col6}"\r\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${selectedReportId}_report_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerTitleWrap}>
            <div className={styles.headerIcon}>
              <FileSpreadsheet size={20} />
            </div>
            <div>
              <h2 className={styles.title}>Uniform & Asset Management Reports</h2>
              <p className={styles.subtitle}>Generate, filter, and export 12 comprehensive inventory & valuation reports</p>
            </div>
          </div>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        {/* Body Layout: Sidebar Reports List + Main Preview */}
        <div className={styles.bodyLayout}>
          {/* Left Report Menu */}
          <div className={styles.reportListNav}>
            <div className={styles.navHeader}>Available Reports</div>
            {REPORT_TYPES.map((rep) => (
              <button
                key={rep.id}
                type="button"
                className={`${styles.navItem} ${selectedReportId === rep.id ? styles.navItemActive : ''}`}
                onClick={() => setSelectedReportId(rep.id)}
              >
                <span className={styles.navName}>{rep.name}</span>
                <span className={styles.navDesc}>{rep.desc}</span>
              </button>
            ))}
          </div>

          {/* Right Main Preview & Options */}
          <div className={styles.reportContent}>
            <div className={styles.reportHeaderBar}>
              <div>
                <h3 className={styles.activeTitle}>{activeReport.name}</h3>
                <p className={styles.activeDesc}>{activeReport.desc}</p>
              </div>
              <div className={styles.exportControls}>
                <div className={styles.formatSelect}>
                  <label className={styles.fmtLabel}>Format:</label>
                  <select
                    className={styles.selectSmall}
                    value={format}
                    onChange={(e) => setFormat(e.target.value)}
                  >
                    <option value="excel">Excel (.CSV)</option>
                    <option value="pdf">PDF Document</option>
                  </select>
                </div>
                <button type="button" className={styles.btnExport} onClick={handleExport}>
                  <Download size={14} /> Export Report
                </button>
                <button type="button" className={styles.btnPrint} onClick={handlePrint}>
                  <Printer size={14} /> Print
                </button>
              </div>
            </div>

            {/* Filter Sub-bar */}
            <div className={styles.subFilterBar}>
              <div className={styles.searchWrap}>
                <Search size={14} className={styles.searchIcon} />
                <input
                  type="text"
                  placeholder="Filter by keyword..."
                  className={styles.searchInput}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <select
                className={styles.selectFilter}
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option value="ALL">All Categories</option>
                <option value="Uniform">Uniforms</option>
                <option value="Accessory">Accessories</option>
                <option value="Equipment">Equipments</option>
                <option value="ID Card">ID Cards</option>
                <option value="Security Kit">Security Kits</option>
                <option value="Safety Gear">Safety Gears</option>
              </select>

              <span className={styles.countBadge}>{reportData.length} Records</span>
            </div>

            {/* Table Preview */}
            <div className={styles.previewTableWrap}>
              <table className={styles.previewTable}>
                <thead>
                  <tr>
                    <th>Ref / Code</th>
                    <th>Name / Details</th>
                    <th>Category / Spec</th>
                    <th>Stock / Quantity</th>
                    <th>Valuation / Date</th>
                    <th>Status / Assessment</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.length === 0 ? (
                    <tr>
                      <td colSpan={6} className={styles.noData}>
                        No records matching filter criteria.
                      </td>
                    </tr>
                  ) : (
                    reportData.slice(0, 100).map((row, idx) => (
                      <tr key={idx}>
                        <td>
                          <strong>{row.col1}</strong>
                        </td>
                        <td>{row.col2}</td>
                        <td>{row.col3}</td>
                        <td>{row.col4}</td>
                        <td>{row.col5}</td>
                        <td>
                          <span className={styles.statusChip}>{row.col6}</span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Fixed Footer */}
        <div className={styles.footer}>
          <button type="button" className={styles.btnClose} onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
