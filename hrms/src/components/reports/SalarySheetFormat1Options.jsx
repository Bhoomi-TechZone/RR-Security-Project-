import React, { useState, useMemo } from 'react';
import {
  Filter,
  Save,
  Check,
  CheckSquare,
  Square,
  RotateCcw,
} from 'lucide-react';
import {
  SALARY_SHEET_FORMAT_1_LAYOUT,
  getAllSelectedOptions,
  getDefaultSelectedOptions,
  getTotalOptionsCount,
} from './salarySheetFormat1Config';
import styles from './SalarySheetFormat1Options.module.css';

/**
 * Dynamic Report Options UI for Salary Sheet (Format 1)
 * Faithfully styled to match the requested visual design:
 * - Card layout with clean borders & padding
 * - Header with cyan/blue filter icon
 * - "Records to Include" with toggle switches (active state in coral red)
 * - 4-column balanced open layout with section titles and custom blue checkboxes
 * - Bottom rounding inputs and records per page
 * - Coral-red Save button with feedback
 */
export default function SalarySheetFormat1Options({
  selectedOptions = {},
  onChange,
  onReset,
  onSave,
}) {
  const [isSavedFeedback, setIsSavedFeedback] = useState(false);

  const totalCount = useMemo(() => getTotalOptionsCount(), []);

  // Count active options
  const selectedCount = useMemo(() => {
    let count = 0;
    SALARY_SHEET_FORMAT_1_LAYOUT.forEach((col) => {
      col.sections.forEach((sec) => {
        sec.fields.forEach((f) => {
          if (selectedOptions[f.id] !== false) count++;
        });
      });
    });
    return count;
  }, [selectedOptions]);

  // Toggle individual field
  const handleToggleField = (fieldId) => {
    if (!onChange) return;
    const currentVal = selectedOptions[fieldId] !== false;
    onChange({
      ...selectedOptions,
      [fieldId]: !currentVal,
    });
  };

  // Change general property (rounding, records per page, scope)
  const handlePropChange = (key, val) => {
    if (!onChange) return;
    onChange({
      ...selectedOptions,
      [key]: val,
    });
  };

  // Handle Select All
  const handleSelectAll = () => {
    if (!onChange) return;
    onChange(getAllSelectedOptions(true, selectedOptions));
  };

  // Handle Clear All
  const handleClearAll = () => {
    if (!onChange) return;
    onChange(getAllSelectedOptions(false, selectedOptions));
  };

  // Handle Reset to Default
  const handleResetDefaults = () => {
    if (onReset) {
      onReset();
    } else if (onChange) {
      onChange(getDefaultSelectedOptions());
    }
  };

  // Handle Save
  const handleSave = () => {
    setIsSavedFeedback(true);
    if (typeof onSave === 'function') {
      onSave();
    }
    setTimeout(() => {
      setIsSavedFeedback(false);
    }, 2500);
  };

  const recordScope = selectedOptions.recordScope || 'active';
  const excludeHold = selectedOptions.excludeHoldSalary !== false;

  return (
    <div
      className={`${styles.cardContainer} no-print`}
      data-no-print="true"
      data-html2canvas-ignore="true"
    >
      <div className={styles.optionsInner}>
        {/* Top Header */}
        <div className={styles.cardHeader}>
          <div className={styles.headerTitleWrap}>
            <Filter size={18} className={styles.filterIcon} />
            <h3 className={styles.headerTitle}>Report Options</h3>
            <span className={styles.headerBadge}>
              {selectedCount} of {totalCount} Included
            </span>
          </div>
        </div>

        {/* Records to Include: Toggle Switches Row */}
        <div className={styles.recordsIncludeSection}>
          <h4 className={styles.sectionHeading}>Records to Include</h4>
          <div className={styles.toggleRow}>
            <div className={styles.toggleGroupLeft}>
              {/* All Records */}
              <label className={styles.toggleItem}>
                <span className={styles.switch}>
                  <input
                    type="checkbox"
                    checked={recordScope === 'all'}
                    onChange={() => handlePropChange('recordScope', 'all')}
                  />
                  <span className={styles.slider}></span>
                </span>
                <span className={styles.toggleLabel}>All Records</span>
              </label>

              {/* Active Records */}
              <label className={styles.toggleItem}>
                <span className={styles.switch}>
                  <input
                    type="checkbox"
                    checked={recordScope === 'active'}
                    onChange={() => handlePropChange('recordScope', 'active')}
                  />
                  <span className={styles.slider}></span>
                </span>
                <span className={styles.toggleLabel}>Active Records</span>
              </label>

              {/* Inactive Records */}
              <label className={styles.toggleItem}>
                <span className={styles.switch}>
                  <input
                    type="checkbox"
                    checked={recordScope === 'inactive'}
                    onChange={() => handlePropChange('recordScope', 'inactive')}
                  />
                  <span className={styles.slider}></span>
                </span>
                <span className={styles.toggleLabel}>Inactive Records</span>
              </label>
            </div>

            {/* Exclude HOLD Salary (Right Aligned to match 4th column) */}
            <label className={styles.toggleItem}>
              <span className={styles.switch}>
                <input
                  type="checkbox"
                  checked={excludeHold}
                  onChange={() => handlePropChange('excludeHoldSalary', !excludeHold)}
                />
                <span className={styles.slider}></span>
              </span>
              <span className={styles.toggleLabel}>Exclude HOLD Salary</span>
            </label>
          </div>
        </div>

        {/* 4-Column Options Grid */}
        <div className={styles.columnsGrid}>
          {SALARY_SHEET_FORMAT_1_LAYOUT.map((col) => (
            <div key={col.columnId} className={styles.column}>
              {col.sections.map((section) => (
                <div key={section.id} className={styles.sectionBlock}>
                  <h5 className={styles.sectionBlockTitle}>{section.title}</h5>
                  <div className={styles.checkboxList}>
                    {section.fields.map((field) => {
                      const isChecked = selectedOptions[field.id] !== false;
                      return (
                        <label key={field.id} className={styles.checkboxItem}>
                          <input
                            type="checkbox"
                            className={styles.customCheckbox}
                            checked={isChecked}
                            onChange={() => handleToggleField(field.id)}
                          />
                          <span>{field.label}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Bottom Controls Row: Amount Rounding, Unit Rounding, Records Per Page */}
        <div className={styles.bottomControlsRow}>
          <div className={styles.controlField}>
            <label className={styles.controlLabel}>Amount Rounding</label>
            <select
              className={styles.controlSelect}
              value={selectedOptions.amountRounding || '0 decimals'}
              onChange={(e) => handlePropChange('amountRounding', e.target.value)}
            >
              <option value="0 decimals">0 decimals</option>
              <option value="2 decimals">2 decimals</option>
            </select>
          </div>

          <div className={styles.controlField}>
            <label className={styles.controlLabel}>Unit Rounding</label>
            <select
              className={styles.controlSelect}
              value={selectedOptions.unitRounding || '0 decimals'}
              onChange={(e) => handlePropChange('unitRounding', e.target.value)}
            >
              <option value="0 decimals">0 decimals</option>
              <option value="2 decimals">2 decimals</option>
            </select>
          </div>

          <div className={styles.controlField}>
            <label className={styles.controlLabel}>Records Per Page</label>
            <input
              type="number"
              min="1"
              max="100"
              className={`${styles.controlInput} ${styles.controlInputNumber}`}
              value={selectedOptions.recordsPerPage || 10}
              onChange={(e) => handlePropChange('recordsPerPage', parseInt(e.target.value) || 10)}
            />
          </div>
        </div>

        {/* Bottom Actions Row: Save Button & Utility Controls */}
        <div className={styles.bottomActionsBar}>
          <div className={styles.actionsLeft}>
            <button
              type="button"
              className={`${styles.saveButton} ${isSavedFeedback ? styles.saveButtonActive : ''}`}
              onClick={handleSave}
              title="Save report options and update preview"
            >
              <Save size={14} />
              <span>{isSavedFeedback ? 'Saved!' : 'Save'}</span>
            </button>
            {isSavedFeedback && (
              <span className={styles.savedToast}>
                <Check size={14} /> Options Applied to Report
              </span>
            )}
          </div>

          <div className={styles.actionsRight}>
            <button
              type="button"
              className={styles.btnSecondary}
              onClick={handleSelectAll}
              title="Select all fields"
            >
              <CheckSquare size={13} /> Select All
            </button>
            <button
              type="button"
              className={styles.btnSecondary}
              onClick={handleClearAll}
              title="Clear all fields"
            >
              <Square size={13} /> Clear All
            </button>
            <button
              type="button"
              className={styles.btnSecondary}
              onClick={handleResetDefaults}
              title="Reset options to default"
            >
              <RotateCcw size={13} /> Reset
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
