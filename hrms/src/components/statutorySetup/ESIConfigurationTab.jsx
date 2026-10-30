import React, { useState, useEffect, useMemo } from 'react';
import { PlusCircle, Edit2, Trash2, CheckCircle2, XCircle } from 'lucide-react';
import styles from '../../pages/admin/StatutorySetup.module.css';
import ESIRateModal from './ESIRateModal';
import { useCompany } from '../../context/CompanyContext';
import masterService from '../../services/masterService';
import statutoryService from '../../services/statutoryService';

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
  const str = String(dateStr).trim();
  if (/^\d{2}-[A-Za-z]{3}-\d{4}$/.test(str)) return str;
  const match = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const yyyy = match[1];
    const mm = parseInt(match[2], 10) - 1;
    const dd = match[3];
    return `${dd}-${months[mm] || 'Jan'}-${yyyy}`;
  }
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

  // Dynamic raw salary components from MongoDB Masters
  const [rawComponents, setRawComponents] = useState([]);

  // Selected components for ESI applicability (strictly from MongoDB)
  const [selectedComponentIds, setSelectedComponentIds] = useState(() => {
    if (Array.isArray(esiConfig?.selectedComponentIds)) {
      return esiConfig.selectedComponentIds;
    }
    return [];
  });

  // Dynamic Rate Changes State from MongoDB
  const [esiRateChanges, setEsiRateChanges] = useState(() => {
    if (Array.isArray(esiConfig?.esiRates)) {
      return esiConfig.esiRates;
    }
    return DEFAULT_ESI_RATES;
  });

  const [isESIRateModalOpen, setIsESIRateModalOpen] = useState(false);
  const [editingESIRate, setEditingESIRate] = useState(null);

  // Synchronize state whenever companyId or esiConfig changes (tenant isolation)
  useEffect(() => {
    if (esiConfig) {
      if (Array.isArray(esiConfig.esiRates)) {
        setEsiRateChanges(esiConfig.esiRates);
      } else {
        setEsiRateChanges([]);
      }

      if (Array.isArray(esiConfig.selectedComponentIds)) {
        setSelectedComponentIds(esiConfig.selectedComponentIds);
      } else {
        setSelectedComponentIds([]);
      }
    }
  }, [esiConfig, companyId]);

  // Dynamically load company-specific salary components from MongoDB
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

  // Only show components added in Salary Components (excluding deductions like PF/ESI/PT/TDS)
  const applicableSalaryComponents = useMemo(() => {
    return rawComponents.filter((c) => (c.type || 'earning') !== 'deduction');
  }, [rawComponents]);

  // Format component name cleanly: e.g. "Basic Salary - Basic" or "House Rent Allowance - HRA"
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
    return selectedComponentIds.includes(id) || selectedComponentIds.includes(code);
  };

  // Toggle ESI Applicability and immediately persist to MongoDB Atlas
  const handleToggleESIApplicability = async (comp) => {
    const id = String(comp.id || comp._id || comp.code || comp.shortName || '');
    const code = String(comp.code || comp.shortName || '').toLowerCase();

    const alreadySelected = selectedComponentIds.includes(id) || (code && selectedComponentIds.includes(code));
    const next = alreadySelected
      ? selectedComponentIds.filter((x) => x !== id && x !== code)
      : [...selectedComponentIds, id];

    setSelectedComponentIds(next);

    try {
      await statutoryService.saveESIApplicability(companyId, next);
      if (setESIConfig) {
        setESIConfig((prev) => ({
          ...prev,
          selectedComponentIds: next
        }));
      }
      if (showToast) {
        showToast('✓ Salary component ESI applicability saved to database.');
      }
    } catch (err) {
      console.error('Failed to save ESI applicability:', err);
      if (showToast) showToast('Failed to save applicability changes to database.', 'danger');
    }
  };

  const handleOpenAddESIRate = () => {
    setEditingESIRate(null);
    setIsESIRateModalOpen(true);
  };

  const handleOpenEditESIRate = (rateItem) => {
    setEditingESIRate(rateItem);
    setIsESIRateModalOpen(true);
  };

  // Delete ESI Rate and persist to MongoDB
  const handleDeleteESIRate = async (rateId) => {
    const cleanId = String(rateId || '').trim();
    if (!cleanId) return;

    if (!window.confirm('Are you sure you want to delete this ESI rate change?')) {
      return;
    }

    const previousRates = [...esiRateChanges];
    const updated = esiRateChanges.filter((r) => String(r.id || r._id || '').trim() !== cleanId);
    setEsiRateChanges(updated);

    try {
      const res = await statutoryService.deleteESIRate(companyId, cleanId);
      const finalRates = res?.esiRates || res?.esi?.esiRates || updated;
      setEsiRateChanges(finalRates);
      if (setESIConfig) {
        setESIConfig((prev) => ({
          ...prev,
          ...(res?.esi || {}),
          esiRates: finalRates
        }));
      }
      if (showToast) showToast('✓ ESI Rate Change entry deleted from database.');
    } catch (err) {
      console.error('Failed to delete ESI rate from database:', err);
      setEsiRateChanges(previousRates);
      if (showToast) showToast('Failed to delete ESI rate change.', 'danger');
    }
  };

  // Add / Edit ESI Rate and persist to MongoDB
  const handleSaveESIRate = async (rateData) => {
    const formattedDate = formatESIDate(rateData.effectiveDate);
    const completeData = {
      ...rateData,
      displayDate: formattedDate
    };

    const targetId = String(completeData.id || completeData._id || '').trim();
    const exists = esiRateChanges.some((r) => String(r.id || r._id || '').trim() === targetId);
    const updatedRates = exists
      ? esiRateChanges.map((r) => (String(r.id || r._id || '').trim() === targetId ? completeData : r))
      : [completeData, ...esiRateChanges];

    setEsiRateChanges(updatedRates);

    try {
      const res = await statutoryService.saveESIRate(companyId, completeData);
      const finalRates = res?.esiRates || res?.esi?.esiRates || updatedRates;
      setEsiRateChanges(finalRates);

      if (setESIConfig) {
        if (res?.esi) {
          setESIConfig(res.esi);
        } else if (completeData.enabled) {
          setESIConfig((prev) => ({
            ...prev,
            enabled: true,
            employeeContribution: completeData.employeeContribution,
            employerContribution: completeData.employerContribution,
            wageEligibilityLimit: completeData.eligibilityWageCeiling,
            effectiveDate: completeData.effectiveDate,
            esiRates: finalRates
          }));
        } else {
          setESIConfig((prev) => ({
            ...prev,
            esiRates: finalRates
          }));
        }
      }

      if (showToast) {
        showToast(
          editingESIRate
            ? '✓ ESI Rate Change updated successfully in database.'
            : '✓ New ESI Rate Change added successfully in database.'
        );
      }
    } catch (err) {
      console.error('Failed to save rate to database:', err);
      if (showToast) showToast('Failed to save ESI rate change.', 'danger');
    }

    setIsESIRateModalOpen(false);
    setEditingESIRate(null);
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
                {esiRateChanges.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      style={{ textAlign: 'center', padding: '24px', color: '#64748b' }}
                    >
                      No ESI rate changes configured. Click &quot;Add New&quot; to configure rate changes.
                    </td>
                  </tr>
                ) : (
                  esiRateChanges.map((rate, idx) => {
                    const rowKey = rate.id || rate._id || `esi-rate-row-${idx}`;
                    return (
                      <tr key={rowKey}>
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
                              onClick={() => handleDeleteESIRate(rate.id || rate._id)}
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}

export default ESIConfigurationTab;

