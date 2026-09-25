import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import styles from './Pagination.module.css';

/**
 * Pagination Component
 * Displays pagination controls below tables.
 */
function Pagination({
  currentPage,
  totalItems,
  itemsPerPage,
  onPageChange,
  label = 'companies'
}) {
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  if (totalPages <= 1) return null;

  const startIdx = (currentPage - 1) * itemsPerPage + 1;
  const endIdx = Math.min(currentPage * itemsPerPage, totalItems);

  const getPages = () => {
    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }
    return pages;
  };

  return (
    <div className={styles.paginationContainer}>
      <div className={styles.info}>
        Showing <span className={styles.highlight}>{startIdx}</span>–
        <span className={styles.highlight}>{endIdx}</span> of{' '}
        <span className={styles.highlight}>{totalItems}</span> {label}
      </div>
      
      <div className={styles.controls}>
        <button
          className={styles.pageBtn}
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          aria-label="Previous page"
        >
          <ChevronLeft size={16} />
          <span>Previous</span>
        </button>

        {getPages().map((page) => (
          <button
            key={page}
            className={`${styles.pageNumber} ${
              page === currentPage ? styles.active : ''
            }`}
            onClick={() => onPageChange(page)}
          >
            {page}
          </button>
        ))}

        <button
          className={styles.pageBtn}
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          aria-label="Next page"
        >
          <span>Next</span>
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}

export default Pagination;
