import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Edit2, Trash2, Info } from 'lucide-react';
import styles from '../../pages/admin/StatutorySetup.module.css';
import PTRateModal, { ALL_INDIAN_STATES_AND_UTS } from './PTRateModal';
import { useCompany } from '../../context/CompanyContext';
import masterService from '../../services/masterService';
import statutoryService from '../../services/statutoryService';

const formatPTDate = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const day = String(d.getDate()).padStart(2, '0');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = months[d.getMonth()];
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
};

function PTConfigurationTab({
  showToast,
  ptConfig,
  setPTConfig,
  ptSlabs: parentPTSlabs = [],
  setPTSlabs: setParentPTSlabs,
  compId
}) {
  const { activeCompany } = useCompany();
  const companyId = compId || activeCompany?.companyId || activeCompany?.id || 'RRS8392014SEC';

  // Dynamic raw salary components from MongoDB Masters
  const [rawComponents, setRawComponents] = useState([]);

  // Calculate On state (Gross Salary vs Earned Salary) directly from MongoDB
  const [calculateOn, setCalculateOn] = useState(() => {
    return ptConfig?.calculateOn || 'Gross Salary';
  });

  // Selected components for PT calculation directly from MongoDB
  const [selectedComponentIds, setSelectedComponentIds] = useState(() => {
    return Array.isArray(ptConfig?.selectedComponentIds) ? ptConfig.selectedComponentIds : [];
  });

  // State selection in PT Rates card (persisted to localStorage to survive page refreshes)
  const [selectedState, setSelectedState] = useState(() => {
    try {
      return localStorage.getItem('novaspark_pt_selected_state') || '';
    } catch {
      return '';
    }
  });

  // Dynamic PT Slabs State from MongoDB
  const [ptSlabs, setPtSlabs] = useState(() => {
    return Array.isArray(parentPTSlabs) ? parentPTSlabs : [];
  });

  const [isPTRateModalOpen, setIsPTRateModalOpen] = useState(false);
  const [editingPTSlab, setEditingPTSlab] = useState(null);

  // States that have configured slabs
  const configuredStates = useMemo(() => {
    const list = Array.from(new Set(ptSlabs.map((s) => s.state).filter(Boolean)));
    return list;
  }, [ptSlabs]);

  // Synchronize state when companyId or ptConfig changes (tenant isolation)
  useEffect(() => {
    if (ptConfig) {
      if (ptConfig.calculateOn) {
        setCalculateOn(ptConfig.calculateOn);
      }
      if (Array.isArray(ptConfig.selectedComponentIds)) {
        setSelectedComponentIds(ptConfig.selectedComponentIds);
      }
    }
  }, [ptConfig, companyId]);

  // Synchronize parent slabs when parentPTSlabs changes & auto-select state if not set
  useEffect(() => {
    if (Array.isArray(parentPTSlabs)) {
      setPtSlabs(parentPTSlabs);
      if (parentPTSlabs.length > 0) {
        setSelectedState((prev) => {
          if (prev) return prev;
          try {
            const saved = localStorage.getItem('novaspark_pt_selected_state');
            if (saved && parentPTSlabs.some((s) => s.state === saved)) {
              return saved;
            }
          } catch {}
          return parentPTSlabs[0]?.state || '';
        });
      }
    }
  }, [parentPTSlabs]);

  // Auto-select first configured state if selectedState is blank or was deleted
  useEffect(() => {
    if (configuredStates.length > 0) {
      setSelectedState((prev) => {
        if (prev && (configuredStates.includes(prev) || ALL_INDIAN_STATES_AND_UTS.includes(prev))) {
          return prev;
        }
        try {
          const saved = localStorage.getItem('novaspark_pt_selected_state');
          if (saved && configuredStates.includes(saved)) {
            return saved;
          }
        } catch {}
        return configuredStates[0] || '';
      });
    }
  }, [configuredStates]);

  const handleStateChange = (newState) => {
    setSelectedState(newState);
    try {
      if (newState) {
        localStorage.setItem('novaspark_pt_selected_state', newState);
      }
    } catch {}
  };

  // Load PT config and slabs directly from MongoDB if not passed or when company changes
  useEffect(() => {
    let isMounted = true;
    if (companyId) {
      statutoryService
        .getStatutoryConfig(companyId)
        .then((config) => {
          if (!isMounted) return;
          if (config?.pt) {
            if (config.pt.calculateOn) setCalculateOn(config.pt.calculateOn);
            if (Array.isArray(config.pt.selectedComponentIds)) {
              setSelectedComponentIds(config.pt.selectedComponentIds);
            }
            if (setPTConfig) setPTConfig(config.pt);
          }
          if (Array.isArray(config?.ptSlabs)) {
            setPtSlabs(config.ptSlabs);
            if (setParentPTSlabs) setParentPTSlabs(config.ptSlabs);
          }
        })
        .catch((err) => {
          console.error('Failed to load PT config from database:', err);
        });
    }
    return () => {
      isMounted = false;
    };
  }, [companyId, setPTConfig, setParentPTSlabs]);

  // Dynamically load company-specific salary components from MongoDB Masters
  useEffect(() => {
    let isMounted = true;
    const fetchCompanySalaryComponents = async () => {
      if (!companyId) return;
      try {
        const data = await masterService.getMasters('salary-components', companyId, true);
        if (isMounted) {
          setRawComponents(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        if (isMounted) setRawComponents([]);
      }
    };

    fetchCompanySalaryComponents();

    const handleSync = () => fetchCompanySalaryComponents();
    window.addEventListener('salary-components-updated', handleSync);
    window.addEventListener('masters-updated', handleSync);

    return () => {
      isMounted = false;
      window.removeEventListener('salary-components-updated', handleSync);
      window.removeEventListener('masters-updated', handleSync);
    };
  }, [companyId]);

  // Only show components added in Salary Components (excluding deductions)
  const applicableSalaryComponents = useMemo(() => {
    return rawComponents.filter((c) => (c.type || 'earning') !== 'deduction');
  }, [rawComponents]);

  // Format component name cleanly: e.g. "Basic Salary - General" or "Dearness Allowance - DA"
  const formatComponentName = (c) => {
    const name = c.name || '';
    const alias = c.shortName || c.code || '';
    if (!alias) return name;
    const cleanName = name.replace(/\s*\([^)]*\)/g, '').trim();
    if (cleanName.toLowerCase() === alias.toLowerCase()) return cleanName;
    return `${cleanName} - ${alias}`;
  };

  // Determine badge styling based on component type
  const getComponentBadgeInfo = (c) => {
    const rawType = c.componentType || c.calculationType || 'Paid Days';
    const lower = rawType.toLowerCase();

    if (
      lower.includes('paid days') ||
      lower.includes('paid') ||
      lower.includes('fixed salary') ||
      lower.includes('days')
    ) {
      return { label: rawType, className: styles.paidDaysBadge };
    }
    if (lower.includes('system')) {
      return { label: rawType, className: styles.systemBadge };
    }
    return { label: rawType, className: styles.variableBadge };
  };

  const isSelected = (comp) => {
    const id = String(comp.id || comp._id || '');
    const code = String(comp.code || comp.shortName || '').toLowerCase();
    return selectedComponentIds.includes(id) || (code && selectedComponentIds.includes(code));
  };

  // Toggle PT Applicability and immediately persist to MongoDB Atlas
  const handleTogglePTApplicability = async (comp) => {
    const id = String(comp.id || comp._id || comp.code || comp.shortName || '');
    const code = String(comp.code || comp.shortName || '').toLowerCase();

    const alreadySelected = selectedComponentIds.includes(id) || (code && selectedComponentIds.includes(code));
    const next = alreadySelected
      ? selectedComponentIds.filter((x) => x !== id && x !== code)
      : [...selectedComponentIds, id];

    setSelectedComponentIds(next);

    try {
      await statutoryService.savePTApplicability(companyId, {
        selectedComponentIds: next,
        calculateOn,
      });

      if (setPTConfig) {
        setPTConfig((prev) => ({
          ...prev,
          selectedComponentIds: next,
          calculateOn,
        }));
      }

      if (showToast) {
        showToast('✓ Salary component PT applicability saved to database.');
      }
    } catch (err) {
      console.error('Failed to save PT applicability to database:', err);
      if (showToast) showToast('Failed to save applicability changes to database.', 'danger');
    }
  };

  // Change Calculate On and immediately persist to MongoDB Atlas
  const handleCalculateOnChange = async (e) => {
    const val = e.target.value;
    setCalculateOn(val);

    try {
      await statutoryService.savePTApplicability(companyId, {
        selectedComponentIds,
        calculateOn: val,
      });

      if (setPTConfig) {
        setPTConfig((prev) => ({
          ...prev,
          calculateOn: val,
          selectedComponentIds,
        }));
      }

      if (showToast) showToast(`✓ PT calculation basis set to ${val}.`);
    } catch (err) {
      console.error('Failed to save PT calculateOn to database:', err);
      if (showToast) showToast('Failed to save calculation basis to database.', 'danger');
    }
  };

  // Filter slabs for the selected state
  const stateSlabs = useMemo(() => {
    if (!selectedState) return [];
    return ptSlabs.filter((s) => s.state === selectedState);
  }, [ptSlabs, selectedState]);

  // Determine effective date for state
  const stateEffectiveDate = useMemo(() => {
    if (stateSlabs.length > 0) {
      const slabWithDate = stateSlabs.find((s) => s.startDate || s.effectiveFrom);
      if (slabWithDate) {
        return formatPTDate(slabWithDate.startDate || slabWithDate.effectiveFrom);
      }
    }
    return '01-Apr-2023';
  }, [stateSlabs]);

  const handleOpenAddPTSlab = () => {
    setEditingPTSlab(null);
    setIsPTRateModalOpen(true);
  };

  const handleOpenEditPTSlab = (slab) => {
    setEditingPTSlab(slab);
    setIsPTRateModalOpen(true);
  };

  // Delete PT slab from MongoDB Atlas
  const handleDeletePTSlab = async (slabId) => {
    const cleanId = String(slabId || '').trim();
    if (!cleanId) return;

    if (!window.confirm('Are you sure you want to delete this Professional Tax slab?')) {
      return;
    }

    const previousSlabs = [...ptSlabs];
    const updated = ptSlabs.filter((s) => String(s.id || s._id || '').trim() !== cleanId);
    setPtSlabs(updated);
    if (setParentPTSlabs) setParentPTSlabs(updated);

    try {
      const res = await statutoryService.deletePTSlab(companyId, cleanId);
      const finalSlabs = Array.isArray(res?.ptSlabs) ? res.ptSlabs : updated;
      setPtSlabs(finalSlabs);
      if (setParentPTSlabs) setParentPTSlabs(finalSlabs);
      if (showToast) showToast('✓ Professional Tax slab deleted from database.');
    } catch (err) {
      console.error('Failed to delete PT slab from database:', err);
      setPtSlabs(previousSlabs);
      if (setParentPTSlabs) setParentPTSlabs(previousSlabs);
      if (showToast) showToast('Failed to delete PT slab from database.', 'danger');
    }
  };

  // Add / Edit PT slab and persist to MongoDB Atlas
  const handleSavePTSlab = async (slabData) => {
    const formattedDate = formatPTDate(slabData.startDate || slabData.effectiveFrom);
    const completeData = {
      ...slabData,
      displayDate: formattedDate,
      startDate: slabData.startDate || slabData.effectiveFrom,
      effectiveFrom: slabData.effectiveFrom || slabData.startDate,
      salaryAbove: Number(slabData.salaryAbove !== undefined && slabData.salaryAbove !== '' ? slabData.salaryAbove : slabData.minSalary) || 0,
      minSalary: Number(slabData.salaryAbove !== undefined && slabData.salaryAbove !== '' ? slabData.salaryAbove : slabData.minSalary) || 0,
      taxAmount: Number(slabData.taxAmount) || 0,
    };

    const targetId = String(completeData.id || completeData._id || '').trim();
    const exists = ptSlabs.some((s) => String(s.id || s._id || '').trim() === targetId);
    const updatedSlabs = exists
      ? ptSlabs.map((s) => (String(s.id || s._id || '').trim() === targetId ? completeData : s))
      : [completeData, ...ptSlabs];

    setPtSlabs(updatedSlabs);
    if (setParentPTSlabs) setParentPTSlabs(updatedSlabs);

    if (slabData.state) {
      handleStateChange(slabData.state);
    }

    try {
      const res = await statutoryService.savePTSlab(companyId, completeData);
      const finalSlabs = Array.isArray(res?.ptSlabs) ? res.ptSlabs : updatedSlabs;
      setPtSlabs(finalSlabs);
      if (setParentPTSlabs) setParentPTSlabs(finalSlabs);

      if (showToast) {
        showToast(
          editingPTSlab
            ? '✓ Professional Tax slab updated successfully in database.'
            : '✓ New Professional Tax slab added successfully in database.'
        );
      }
    } catch (err) {
      console.error('Failed to save PT slab to database:', err);
      if (showToast) showToast('Failed to save PT slab to database.', 'danger');
    }

    setIsPTRateModalOpen(false);
    setEditingPTSlab(null);
  };

  return (
    <>
      {/* PT Rate Modal */}
      <PTRateModal
        isOpen={isPTRateModalOpen}
        onClose={() => {
          setIsPTRateModalOpen(false);
          setEditingPTSlab(null);
        }}
        onSubmit={handleSavePTSlab}
        editingItem={editingPTSlab}
        selectedState={selectedState}
      />

      <div className={styles.pfGridContainer}>
        {/* LEFT COLUMN: Salary Component Applicability */}
        <div className={styles.pfColumnLeft}>
          <div className={styles.pfSectionCard}>
            <div
              className={styles.pfCardHeader}
              style={{ borderBottom: 'none', padding: '16px 20px 10px 20px' }}
            >
              <div className={styles.ptHeaderLeft}>
                <h3 className={styles.pfCardTitle}>
                  Salary Component Applicability
                  <span
                    className={styles.infoIconPurple}
                    title="Select components included in the Professional Tax calculation wage base"
                  >
                    <Info size={15} />
                  </span>
                </h3>

                <div className={styles.ptCalculateOnWrap}>
                  <label className={styles.ptCalculateLabel}>
                    Calculate on
                    <span
                      className={styles.infoIconPurple}
                      title="Choose whether PT is calculated on Gross Salary or actual Earned Salary"
                    >
                      <Info size={14} />
                    </span>
                  </label>
                  <select
                    className={styles.ptCalculateSelect}
                    value={calculateOn}
                    onChange={handleCalculateOnChange}
                  >
                    <option value="Gross Salary">Gross Salary</option>
                    <option value="Earned Salary">Earned Salary</option>
                  </select>
                </div>
              </div>
            </div>

            <table className={styles.pfTable}>
              <thead>
                <tr>
                  <th>NAME</th>
                  <th style={{ textAlign: 'center' }}>TYPE</th>
                  <th style={{ textAlign: 'center', width: '80px' }}>SELECT</th>
                </tr>
              </thead>
              <tbody>
                {applicableSalaryComponents.length === 0 ? (
                  <tr>
                    <td
                      colSpan={3}
                      style={{ textAlign: 'center', padding: '24px', color: '#64748b' }}
                    >
                      No salary components configured. Please add components in Masters &gt; Salary Components.
                    </td>
                  </tr>
                ) : (
                  applicableSalaryComponents.map((comp, idx) => {
                    const badge = getComponentBadgeInfo(comp);
                    const checked = isSelected(comp);
                    return (
                      <tr key={comp.id || comp._id || `comp-${idx}`}>
                        <td className={styles.componentNameCell}>
                          {formatComponentName(comp)}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span className={badge.className}>
                            {badge.label}
                          </span>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <input
                            type="checkbox"
                            className={styles.ptCheckboxInput}
                            checked={checked}
                            onChange={() => handleTogglePTApplicability(comp)}
                          />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* RIGHT COLUMN: Professional Tax Rates */}
        <div className={styles.pfColumnRight}>
          <div className={styles.pfSectionCard} style={{ padding: '20px' }}>
            <h3 className={styles.pfCardTitle} style={{ marginBottom: '14px' }}>
              Professional Tax Rates
            </h3>

            {/* State Selector & Add Button */}
            <div className={styles.ptStateSelectRow}>
              <select
                className={styles.ptStateSelect}
                value={selectedState}
                onChange={(e) => handleStateChange(e.target.value)}
              >
                <option value="">- Select State -</option>
                {configuredStates.length > 0 && (
                  <optgroup label="States With Configured Slabs">
                    {configuredStates.map((st) => {
                      const count = ptSlabs.filter((s) => s.state === st).length;
                      return (
                        <option key={`cfg-${st}`} value={st}>
                          {st} ({count} {count === 1 ? 'slab' : 'slabs'})
                        </option>
                      );
                    })}
                  </optgroup>
                )}
                <optgroup label="All States & UTs">
                  {ALL_INDIAN_STATES_AND_UTS.map((st) => (
                    <option key={`all-${st}`} value={st}>
                      {st}
                    </option>
                  ))}
                </optgroup>
              </select>

              <button
                type="button"
                className={styles.pfAddNewBtn}
                onClick={handleOpenAddPTSlab}
              >
                <Plus size={14} />
                <span>Add</span>
              </button>
            </div>

            {/* If no state is selected */}
            {!selectedState ? (
              <div className={styles.ptEmptyState}>
                <p style={{ margin: '0 0 10px 0', color: '#64748b' }}>
                  Select a state above to show rates
                </p>
                {configuredStates.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center', marginTop: '8px' }}>
                    <span style={{ fontSize: '0.82rem', color: '#64748b', alignSelf: 'center' }}>
                      Configured:
                    </span>
                    {configuredStates.map((st) => (
                      <button
                        key={`chip-${st}`}
                        type="button"
                        onClick={() => handleStateChange(st)}
                        style={{
                          background: '#f8fafc',
                          border: '1px solid #cbd5e1',
                          borderRadius: '6px',
                          padding: '4px 10px',
                          fontSize: '0.82rem',
                          fontWeight: 600,
                          color: '#1e293b',
                          cursor: 'pointer'
                        }}
                      >
                        {st} ({ptSlabs.filter((s) => s.state === st).length})
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div>
                {/* Effective From */}
                <div className={styles.ptEffectiveFrom}>
                  Effective From: {stateEffectiveDate}
                </div>

                {/* Slabs List */}
                {stateSlabs.length === 0 ? (
                  <div className={styles.ptEmptyState} style={{ fontStyle: 'italic' }}>
                    No PT slabs configured for {selectedState}. Click &quot;Add&quot; to configure slabs.
                  </div>
                ) : (
                  <table className={styles.ptSlabsTable}>
                    <tbody>
                      {stateSlabs.map((slab) => (
                        <tr key={slab.id || slab._id}>
                          <td style={{ width: '30%' }}>
                            <div className={styles.ptSlabHeader}>Base Salary</div>
                            <div className={styles.ptSlabVal}>
                              &gt; {slab.salaryAbove !== undefined ? slab.salaryAbove : slab.minSalary}
                            </div>
                          </td>
                          <td style={{ width: '25%' }}>
                            <div className={styles.ptSlabHeader}>Tax Amount</div>
                            <div className={styles.ptSlabVal}>{slab.taxAmount}</div>
                          </td>
                          <td style={{ width: '30%' }}>
                            <div className={styles.ptSlabHeader}>{slab.gender || 'All Genders'}</div>
                            <div className={styles.ptSlabVal}>{slab.month || 'All Months'}</div>
                          </td>
                          <td style={{ textAlign: 'right', width: '15%' }}>
                            <div
                              className={styles.actionsCell}
                              style={{ justifyContent: 'flex-end' }}
                            >
                              <button
                                type="button"
                                className={`${styles.actionCircleBtn} ${styles.editCircleBtn}`}
                                title="Edit PT Slab"
                                onClick={() => handleOpenEditPTSlab(slab)}
                              >
                                <Edit2 size={13} />
                              </button>
                              <button
                                type="button"
                                className={`${styles.actionCircleBtn} ${styles.deleteCircleBtn}`}
                                title="Delete PT Slab"
                                onClick={() => handleDeletePTSlab(slab.id || slab._id)}
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {/* Important Instructions Box (Screenshots 1 & 4) */}
            <div className={styles.ptInstructionsBox}>
              <div className={styles.ptInstructionsTitle}>Important Instructions</div>
              <ul className={styles.ptInstructionsList}>
                <li>
                  When inserting rates for a <u>specific month</u>, make sure you insert all slabs for that month.
                </li>
                <li>
                  Rates for specific month will override rates for &apos;All Months&apos;.
                </li>
                <li>
                  When inserting rate for a <u>specific gender</u>, make sure you insert all slabs for that gender and other genders as well. <u>DO NOT</u> add rates for &apos;All Genders&apos; in such cases.
                </li>
                <li>
                  Rates for specific gender will override rates for &apos;All Genders&apos;.
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default PTConfigurationTab;
