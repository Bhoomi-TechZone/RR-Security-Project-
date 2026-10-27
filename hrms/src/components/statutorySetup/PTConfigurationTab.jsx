import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Edit2, Trash2, Info } from 'lucide-react';
import styles from '../../pages/admin/StatutorySetup.module.css';
import PTRateModal, { ALL_INDIAN_STATES_AND_UTS } from './PTRateModal';
import { useCompany } from '../../context/CompanyContext';
import { mockSalaryComponents } from '../../data/masters/salaryComponentData';
import masterService from '../../services/masterService';

const DEFAULT_PT_SLABS = [
  {
    id: 'pt-bihar-1',
    state: 'Bihar',
    startDate: '2023-04-01',
    displayDate: '01-Apr-2023',
    salaryAbove: 25000,
    taxAmount: 1000,
    gender: 'All Genders',
    month: 'Sep'
  },
  {
    id: 'pt-bihar-2',
    state: 'Bihar',
    startDate: '2023-04-01',
    displayDate: '01-Apr-2023',
    salaryAbove: 41667,
    taxAmount: 2000,
    gender: 'All Genders',
    month: 'Sep'
  },
  {
    id: 'pt-bihar-3',
    state: 'Bihar',
    startDate: '2023-04-01',
    displayDate: '01-Apr-2023',
    salaryAbove: 83333,
    taxAmount: 3000,
    gender: 'All Genders',
    month: 'Sep'
  },
  {
    id: 'pt-mh-1',
    state: 'Maharashtra',
    startDate: '2023-04-01',
    displayDate: '01-Apr-2023',
    salaryAbove: 7500,
    taxAmount: 175,
    gender: 'Male',
    month: 'All Months'
  },
  {
    id: 'pt-mh-2',
    state: 'Maharashtra',
    startDate: '2023-04-01',
    displayDate: '01-Apr-2023',
    salaryAbove: 10000,
    taxAmount: 200,
    gender: 'All Genders',
    month: 'All Months'
  },
  {
    id: 'pt-mh-3',
    state: 'Maharashtra',
    startDate: '2023-04-01',
    displayDate: '01-Apr-2023',
    salaryAbove: 10000,
    taxAmount: 300,
    gender: 'All Genders',
    month: 'February'
  },
  {
    id: 'pt-kar-1',
    state: 'Karnataka',
    startDate: '2023-04-01',
    displayDate: '01-Apr-2023',
    salaryAbove: 15000,
    taxAmount: 200,
    gender: 'All Genders',
    month: 'All Months'
  }
];

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

function PTConfigurationTab({ showToast, ptConfig, setPTConfig, compId }) {
  const { activeCompany } = useCompany();
  const companyId = compId || activeCompany?.companyId || activeCompany?.id || 'RRS8392014SEC';

  // Load raw salary components from Master / localStorage / fallback (identical to PF & ESI)
  const [rawComponents, setRawComponents] = useState(() => {
    try {
      const saved = localStorage.getItem(`novaspark_salary_components_${companyId}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    return mockSalaryComponents;
  });

  // Calculate On state (Gross Salary vs Earned Salary)
  const [calculateOn, setCalculateOn] = useState(() => {
    try {
      const saved = localStorage.getItem(`novaspark_pt_calculate_on_${companyId}`);
      if (saved) return saved;
    } catch (e) {}
    return 'Gross Salary';
  });

  // Selected components for PT calculation (by default Basic Salary & Dearness Allowance are selected in screenshot 1)
  const [selectedComponentIds, setSelectedComponentIds] = useState(() => {
    try {
      const saved = localStorage.getItem(`novaspark_pt_selected_components_${companyId}`);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    // Default: Basic Salary and Dearness Allowance
    return ['sal-1', 'basic', 'sal-2', 'da'];
  });

  // Sync salary components dynamically when updated in Masters
  useEffect(() => {
    const syncComponents = () => {
      try {
        const saved = localStorage.getItem(`novaspark_salary_components_${companyId}`);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setRawComponents(parsed);
            return;
          }
        }
      } catch (e) {
        console.error(e);
      }
      setRawComponents(mockSalaryComponents);
    };

    if (companyId) {
      masterService.getMasters('salary-components', companyId)
        .then((data) => {
          if (Array.isArray(data) && data.length > 0) {
            setRawComponents(data);
            try {
              localStorage.setItem(`novaspark_salary_components_${companyId}`, JSON.stringify(data));
            } catch (e) {}
          }
        })
        .catch(() => {});
    }

    window.addEventListener('salary-components-updated', syncComponents);
    window.addEventListener('masters-updated', syncComponents);
    window.addEventListener('storage', syncComponents);

    return () => {
      window.removeEventListener('salary-components-updated', syncComponents);
      window.removeEventListener('masters-updated', syncComponents);
      window.removeEventListener('storage', syncComponents);
    };
  }, [companyId]);

  // Only show components added in Salary Components (excluding deductions)
  const applicableSalaryComponents = useMemo(() => {
    return rawComponents.filter((c) => (c.type || 'earning') !== 'deduction');
  }, [rawComponents]);

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
    const id = String(comp.id || '');
    const code = String(comp.code || comp.shortName || '').toLowerCase();
    return selectedComponentIds.includes(id) || selectedComponentIds.includes(code);
  };

  const handleTogglePTApplicability = (comp) => {
    const id = String(comp.id || '');
    const code = String(comp.code || comp.shortName || '').toLowerCase();

    setSelectedComponentIds((prev) => {
      const alreadySelected = prev.includes(id) || (code && prev.includes(code));
      const next = alreadySelected
        ? prev.filter((x) => x !== id && x !== code)
        : [...prev, id];
      try {
        localStorage.setItem(
          `novaspark_pt_selected_components_${companyId}`,
          JSON.stringify(next)
        );
      } catch (e) {
        console.error('Failed to save PT selected components', e);
      }
      return next;
    });
  };

  const handleCalculateOnChange = (e) => {
    const val = e.target.value;
    setCalculateOn(val);
    try {
      localStorage.setItem(`novaspark_pt_calculate_on_${companyId}`, val);
    } catch (e) {}
    if (showToast) showToast(`✓ PT calculation basis set to ${val}.`);
  };

  // State selection in PT Rates card
  const [selectedState, setSelectedState] = useState('');

  // PT Slabs State
  const [ptSlabs, setPtSlabs] = useState(() => {
    try {
      const saved = localStorage.getItem(`novaspark_pt_slabs_${companyId}`);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return DEFAULT_PT_SLABS;
  });

  const [isPTRateModalOpen, setIsPTRateModalOpen] = useState(false);
  const [editingPTSlab, setEditingPTSlab] = useState(null);

  // Filter slabs for the selected state
  const stateSlabs = useMemo(() => {
    if (!selectedState) return [];
    return ptSlabs.filter((s) => s.state === selectedState);
  }, [ptSlabs, selectedState]);

  // Determine effective date for state
  const stateEffectiveDate = useMemo(() => {
    if (stateSlabs.length > 0 && stateSlabs[0].startDate) {
      return formatPTDate(stateSlabs[0].startDate);
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

  const handleDeletePTSlab = (slabId) => {
    setPtSlabs((prev) => {
      const updated = prev.filter((s) => s.id !== slabId);
      try {
        localStorage.setItem(`novaspark_pt_slabs_${companyId}`, JSON.stringify(updated));
      } catch (e) {
        console.error('Failed to delete PT slab', e);
      }
      return updated;
    });
    if (showToast) showToast('✓ Professional Tax slab deleted.');
  };

  const handleSavePTSlab = (slabData) => {
    const formattedDate = formatPTDate(slabData.startDate);
    const completeData = {
      ...slabData,
      displayDate: formattedDate
    };

    setPtSlabs((prev) => {
      const exists = prev.some((s) => s.id === completeData.id);
      const updated = exists
        ? prev.map((s) => (s.id === completeData.id ? completeData : s))
        : [...prev, completeData];
      try {
        localStorage.setItem(`novaspark_pt_slabs_${companyId}`, JSON.stringify(updated));
      } catch (e) {
        console.error('Failed to save PT slab', e);
      }
      return updated;
    });

    if (slabData.state && slabData.state !== selectedState) {
      setSelectedState(slabData.state);
    }

    setIsPTRateModalOpen(false);
    setEditingPTSlab(null);
    if (showToast) {
      showToast(
        editingPTSlab
          ? '✓ Professional Tax slab updated successfully.'
          : '✓ New Professional Tax slab added successfully.'
      );
    }
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
                  <span className={styles.infoIconPurple} title="Select components included in the Professional Tax calculation wage base">
                    <Info size={15} />
                  </span>
                </h3>

                <div className={styles.ptCalculateOnWrap}>
                  <label className={styles.ptCalculateLabel}>
                    Calculate on
                    <span className={styles.infoIconPurple} title="Choose whether PT is calculated on Gross Salary or actual Earned Salary">
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
                      <tr key={comp.id || `comp-${idx}`}>
                        <td className={styles.componentNameCell}>
                          {comp.name}
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
                onChange={(e) => setSelectedState(e.target.value)}
              >
                <option value="">- Select State -</option>
                {ALL_INDIAN_STATES_AND_UTS.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
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
                Select a state to show rates
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
                        <tr key={slab.id}>
                          <td style={{ width: '30%' }}>
                            <div className={styles.ptSlabHeader}>Base Salary</div>
                            <div className={styles.ptSlabVal}>&gt; {slab.salaryAbove}</div>
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
                                onClick={() => handleDeletePTSlab(slab.id)}
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
