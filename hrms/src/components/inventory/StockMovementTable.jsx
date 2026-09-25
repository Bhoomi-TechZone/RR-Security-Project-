import React, { useState, useMemo } from 'react';
import { Search, Filter, ArrowDownLeft, ArrowUpRight, AlertTriangle, ShieldAlert, Sliders, Calendar, Download } from 'lucide-react';
import styles from './StockMovementTable.module.css';

export default function StockMovementTable({ movements = [], items = [] }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const filteredMovements = useMemo(() => {
    return movements.filter((m) => {
      const matchSearch =
        m.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.itemCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (m.reference && m.reference.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (m.employeeName && m.employeeName.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchType = typeFilter === 'ALL' || m.movementType === typeFilter;

      return matchSearch && matchType;
    });
  }, [movements, searchTerm, typeFilter]);

  const totalPages = Math.ceil(filteredMovements.length / itemsPerPage) || 1;
  const paginatedMovements = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredMovements.slice(start, start + itemsPerPage);
  }, [filteredMovements, currentPage]);

  const getMovementBadge = (type) => {
    switch (type) {
      case 'Stock IN':
      case 'Opening Stock':
        return (
          <span className={styles.typeIn}>
            <ArrowDownLeft size={13} /> {type}
          </span>
        );
      case 'Issue OUT':
        return (
          <span className={styles.typeOut}>
            <ArrowUpRight size={13} /> {type}
          </span>
        );
      case 'Return IN':
        return (
          <span className={styles.typeReturn}>
            <ArrowDownLeft size={13} /> {type}
          </span>
        );
      case 'Damaged':
        return (
          <span className={styles.typeDamaged}>
            <AlertTriangle size={13} /> Damaged
          </span>
        );
      case 'Lost':
        return (
          <span className={styles.typeLost}>
            <ShieldAlert size={13} /> Lost Asset
          </span>
        );
      case 'Stock Adjustment':
        return (
          <span className={styles.typeAdjust}>
            <Sliders size={13} /> Adjustment
          </span>
        );
      default:
        return <span className={styles.typeDefault}>{type}</span>;
    }
  };

  return (
    <div className={styles.container}>
      {/* Search & Filters Bar */}
      <div className={styles.filterBar}>
        <div className={styles.searchWrap}>
          <Search size={16} className={styles.searchIcon} />
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search by Item, Code, Employee, Reference ID..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>

        <div className={styles.filterGroup}>
          <select
            className={styles.selectFilter}
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="ALL">All Movement Types</option>
            <option value="Opening Stock">Opening Stock</option>
            <option value="Stock IN">Stock IN (Restock)</option>
            <option value="Issue OUT">Issue OUT (Uniform Issue)</option>
            <option value="Return IN">Return IN (Restockable)</option>
            <option value="Damaged">Damaged Asset</option>
            <option value="Lost">Lost Asset</option>
            <option value="Stock Adjustment">Stock Adjustment</option>
          </select>

          <span className={styles.countBadge}>{filteredMovements.length} Movements</span>
        </div>
      </div>

      {/* Movements Table */}
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Date & Time</th>
              <th>Movement Type</th>
              <th>Item & Code</th>
              <th>Change Qty</th>
              <th>Stock Before → After</th>
              <th>Employee / Location</th>
              <th>Reference ID</th>
              <th>Performed By</th>
            </tr>
          </thead>
          <tbody>
            {paginatedMovements.length === 0 ? (
              <tr>
                <td colSpan={8} className={styles.noData}>
                  No stock movement records found matching criteria.
                </td>
              </tr>
            ) : (
              paginatedMovements.map((m) => {
                const isPositive = m.quantityChange > 0;
                return (
                  <tr key={m.id}>
                    <td>
                      <div className={styles.dateCell}>{m.date}</div>
                    </td>
                    <td>{getMovementBadge(m.movementType)}</td>
                    <td>
                      <div className={styles.itemName}>{m.itemName}</div>
                      <div className={styles.itemCode}>{m.itemCode}</div>
                    </td>
                    <td>
                      <span className={isPositive ? styles.qtyPos : styles.qtyNeg}>
                        {isPositive ? `+${m.quantityChange}` : m.quantityChange}
                      </span>
                    </td>
                    <td>
                      <div className={styles.stockFlow}>
                        <span>{m.balanceBefore ?? '-'}</span>
                        <span className={styles.flowArrow}>→</span>
                        <strong>{m.balanceAfter ?? '-'}</strong>
                      </div>
                    </td>
                    <td>
                      {m.employeeName ? (
                        <div className={styles.empInfo}>
                          <span className={styles.empName}>{m.employeeName}</span>
                          <span className={styles.siteName}>{m.site || m.location}</span>
                        </div>
                      ) : (
                        <span className={styles.locText}>{m.location || 'Central Warehouse'}</span>
                      )}
                    </td>
                    <td>
                      <span className={styles.refCode}>{m.reference || m.id}</span>
                    </td>
                    <td>
                      <span className={styles.performerText}>{m.performedBy}</span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className={styles.pagination}>
          <span className={styles.pageInfo}>
            Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
            {Math.min(currentPage * itemsPerPage, filteredMovements.length)} of {filteredMovements.length} movements
          </span>
          <div className={styles.pageBtnGroup}>
            <button
              type="button"
              className={styles.pageBtn}
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => (
              <button
                key={pg}
                type="button"
                className={`${styles.pageBtn} ${currentPage === pg ? styles.pageBtnActive : ''}`}
                onClick={() => setCurrentPage(pg)}
              >
                {pg}
              </button>
            ))}
            <button
              type="button"
              className={styles.pageBtn}
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
