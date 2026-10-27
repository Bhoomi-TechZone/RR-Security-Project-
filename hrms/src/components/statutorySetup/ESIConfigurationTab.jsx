import React, { useState, useEffect, useMemo } from 'react';
import { PlusCircle, Edit2, Trash2, CheckCircle2, XCircle } from 'lucide-react';
import styles from '../../pages/admin/StatutorySetup.module.css';
import ESIRateModal from './ESIRateModal';
import { useCompany } from '../../context/CompanyContext';
import { mockSalaryComponents } from '../../data/masters/salaryComponentData';
import masterService from '../../services/masterService';

const DEFAULT_ESI_RATES = [
  {
    id: 'esi-rate-1',
    enabled: true,
    effectiveDate: '2026-04-01',
    displayDate: '01-Apr-2026',
    employeeContribution: 0.75,
    employerContribution: 3.25,
    eligibilityWageCeiling: 21000,
    deductionWageCeiling: 0
  }
];

const formatESIDate = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const day = String(d.getDate()).padStart(2, '0');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = months[d.getMonth()];
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
};

function ESIConfigurationTab({ showToast, esiConfig, setESIConfig, compId }) {
  const { activeCompany } = useCompany();
  const companyId = compId || activeCompany?.companyId || activeCompany?.id || 'RRS8392014SEC';

  // Load raw salary components from Master / localStorage / fallback (identical to PF)
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

  // Selected components for ESI applicability
  const [selectedComponentIds, setSelectedComponentIds] = useState(() => {
    try {
      const saved = localStorage.getItem(`novaspark_esi_selected_components_${companyId}`);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return [];
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

  // Format component name: e.g. "Basic Salary - Basic" or "House Rent Allowance - HRA"
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
    const id = String(comp.id || '');
    const code = String(comp.code || comp.shortName || '').toLowerCase();
    return selectedComponentIds.includes(id) || selectedComponentIds.includes(code);
  };

  const handleToggleESIApplicability = (comp) => {
    const id = String(comp.id || '');
    const code = String(comp.code || comp.shortName || '').toLowerCase();

    setSelectedComponentIds((prev) => {
      const alreadySelected = prev.includes(id) || (code && prev.includes(code));
      const next = alreadySelected
        ? prev.filter((x) => x !== id && x !== code)
        : [...prev, id];
      try {
        localStorage.setItem(
          `novaspark_esi_selected_components_${companyId}`,
          JSON.stringify(next)
        );
      } catch (e) {
        console.error('Failed to save ESI selected components', e);
      }
      return next;
    });
  };

  // ESI Rate Changes State
  const [esiRateChanges, setEsiRateChanges] = useState(() => {
    try {
      const saved = localStorage.getItem(`novaspark_esi_rates_${companyId}`);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return DEFAULT_ESI_RATES;
  });

  const [isESIRateModalOpen, setIsESIRateModalOpen] = useState(false);
  const [editingESIRate, setEditingESIRate] = useState(null);

  const handleOpenAddESIRate = () => {
    setEditingESIRate(null);
    setIsESIRateModalOpen(true);
  };

  const handleOpenEditESIRate = (rateItem) => {
    setEditingESIRate(rateItem);
    setIsESIRateModalOpen(true);
  };

  const handleDeleteESIRate = (rateId) => {
    setEsiRateChanges((prev) => {
      const updated = prev.filter((r) => r.id !== rateId);
      try {
        localStorage.setItem(`novaspark_esi_rates_${companyId}`, JSON.stringify(updated));
      } catch (e) {
        console.error('Failed to delete ESI rate', e);
      }
      return updated;
    });
    if (showToast) showToast('✓ ESI Rate Change entry deleted.');
  };

  const handleSaveESIRate = (rateData) => {
    const formattedDate = formatESIDate(rateData.effectiveDate);
    const completeData = {
      ...rateData,
      displayDate: formattedDate
    };

    setEsiRateChanges((prev) => {
      const exists = prev.some((r) => r.id === completeData.id);
      const updated = exists
        ? prev.map((r) => (r.id === completeData.id ? completeData : r))
        : [completeData, ...prev];
      try {
        localStorage.setItem(`novaspark_esi_rates_${companyId}`, JSON.stringify(updated));
      } catch (e) {
        console.error('Failed to save ESI rate', e);
      }
      return updated;
    });

    if (setESIConfig && completeData.enabled) {
      setESIConfig((prev) => ({
        ...prev,
        enabled: true,
        employeeContribution: completeData.employeeContribution,
        employerContribution: completeData.employerContribution,
        wageEligibilityLimit: completeData.eligibilityWageCeiling,
        effectiveDate: completeData.effectiveDate
      }));
    }

    setIsESIRateModalOpen(false);
    setEditingESIRate(null);
    if (showToast) {
      showToast(
        editingESIRate
          ? '✓ ESI Rate Change updated successfully.'
          : '✓ New ESI Rate Change added successfully.'
      );
    }
  };

  return (
    <>
      {/* ESI Rate Change Modal */}
      <ESIRateModal
        isOpen={isESIRateModalOpen}
        onClose={() => {
          setIsESIRateModalOpen(false);
          setEditingESIRate(null);
        }}
        onSubmit={handleSaveESIRate}
        editingItem={editingESIRate}
      />

      <div className={styles.pfGridContainer}>
        {/* LEFT COLUMN: Salary Component Applicability */}
        <div className={styles.pfColumnLeft}>
          <div className={styles.pfSectionCard}>
            <div
              className={styles.pfCardHeader}
              style={{ borderBottom: 'none', padding: '18px 20px 10px 20px' }}
            >
              <h3 className={styles.pfCardTitle}>Salary Component Applicability</h3>
            </div>

            <table className={styles.pfTable}>
              <thead>
                <tr>
                  <th>COMPONENT</th>
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
                            className={styles.checkboxInput}
                            checked={checked}
                            onChange={() => handleToggleESIApplicability(comp)}
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

        {/* RIGHT COLUMN: ESI Rate Changes */}
        <div className={styles.pfColumnRight}>
          <div className={styles.pfSectionCard}>
            <div className={styles.pfCardHeader}>
              <h3 className={styles.pfCardTitle}>ESI Rate Changes</h3>
              <button
                type="button"
                className={styles.pfAddNewBtn}
                onClick={handleOpenAddESIRate}
              >
                <PlusCircle size={15} />
                <span>Add New</span>
              </button>
            </div>

            <table className={styles.pfTable}>
              <thead>
                <tr>
                  <th>STATUS</th>
                  <th>EFFECTIVE FROM</th>
                  <th>SETTINGS</th>
                  <th style={{ textAlign: 'right' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {esiRateChanges.map((rate) => (
                  <tr key={rate.id}>
                    <td>
                      {rate.enabled ? (
                        <span className={styles.statusEnabled}>
                          <CheckCircle2 size={15} color="#10b981" />
                          <span>Enabled</span>
                        </span>
                      ) : (
                        <span className={styles.statusDisabled}>
                          <XCircle size={15} color="#f43f5e" />
                          <span>Disabled</span>
                        </span>
                      )}
                    </td>
                    <td>{rate.displayDate || formatESIDate(rate.effectiveDate)}</td>
                    <td className={styles.ratesCell}>
                      {rate.employeeContribution}% | {rate.employerContribution}% | {rate.eligibilityWageCeiling}
                    </td>
                    <td>
                      <div
                        className={styles.actionsCell}
                        style={{ justifyContent: 'flex-end' }}
                      >
                        <button
                          type="button"
                          className={`${styles.actionCircleBtn} ${styles.editCircleBtn}`}
                          title="Edit ESI Rate"
                          onClick={() => handleOpenEditESIRate(rate)}
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          type="button"
                          className={`${styles.actionCircleBtn} ${styles.deleteCircleBtn}`}
                          title="Delete ESI Rate"
                          onClick={() => handleDeleteESIRate(rate.id)}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}

export default ESIConfigurationTab;

