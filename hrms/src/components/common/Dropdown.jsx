import React, { useState, useEffect, useRef } from 'react';
import styles from './Dropdown.module.css';

/**
 * Dropdown Component
 * Handles toggling, layout, and automatic close on outside clicks.
 */
function Dropdown({ trigger, children, align = 'right', className = '' }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className={`${styles.dropdown} ${className}`} ref={dropdownRef}>
      <div 
        onClick={() => setIsOpen(!isOpen)} 
        className={styles.trigger}
        role="button"
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        {trigger}
      </div>
      
      {isOpen && (
        <div 
          className={`${styles.menu} ${styles[align]}`}
          onClick={() => setIsOpen(false)}
        >
          {children}
        </div>
      )}
    </div>
  );
}

export default Dropdown;
