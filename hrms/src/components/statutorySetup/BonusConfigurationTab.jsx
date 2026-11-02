import React, { useState, useEffect, useMemo } from 'react';
import { 
  Gift, Plus, Edit2, Trash2, Info, CheckCircle2, 
  SlidersHorizontal, FileText, Sparkles 
} from 'lucide-react';
import styles from '../../pages/admin/StatutorySetup.module.css';
import BonusRateModal from './BonusRateModal';
import BonusRulesModal from './BonusRulesModal';
import { useCompany } from '../../context/CompanyContext';
import masterService from '../../services/masterService';
import statutoryService from '../../services/statutoryService';

const DEFAULT_BONUS_RATES = [
  {
    id: 'bonus-rate-1',
    enabled: true,
    financialYear: 'FY 2026-2027',
    effectiveDate: '2026-04-01',
    bonusPercentage: 8.33,
    statutoryWageCeiling: 7000,
    eligibilityWageCeiling: 21000,
    calculationMethod: 'Percentage of Basic + DA',
    description: 'Mandatory Minimum Statutory Rate (8.33% on ₹7,000 ceiling)'
  }
];

/**
 * BonusConfigurationTab Component
 * Specialized 2-Column Statutory Layout for Payment of Bonus Act, 1965:
 * - Left: Salary Component Applicability (Wage base: Basic + DA)
 * - Right: Statutory Bonus Rates by FY + Bonus Rules & Compliance Modal
 */
function BonusConfigurationTab({ showToast, bonusConfig, setBonusConfig, compId }) {
  const { activeCompany } = useCompany();
  const companyId = compId || activeCompany?.companyId || activeCompany?.id || 'RRS8392014SEC';

  // Dynamic raw salary components from MongoDB Masters
  const [rawComponents, setRawComponents] = useState([]);

  // Selected components for Bonus calculation (strictly from MongoDB)
  const [selectedComponentIds, setSelectedComponentIds] = useState(() => {
    if (Array.isArray(bonusConfig?.selectedComponentIds)) {
      return bonusConfig.selectedComponentIds;
    }
    return [];
  });

  // Dynamic Bonus Rates by FY from MongoDB
  const [bonusRates, setBonusRates] = useState(() => {
    if (Array.isArray(bonusConfig?.bonusRates) && bonusConfig.bonusRates.length > 0) {
      return bonusConfig.bonusRates;
    }
    return DEFAULT_BONUS_RATES;
  });

  // Modal States
  const [isRateModalOpen, setIsRateModalOpen] = useState(false);
  const [editingRate, setEditingRate] = useState(null);
  const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);

  // General Bonus Rules State
  const [bonusRules, setBonusRules] = useState({
    calculationMethod: bonusConfig?.calculationMethod || 'Percentage of Basic + DA',
    bonusPercentage: bonusConfig?.bonusPercentage ?? 8.33,
    maximumBonusPercentage: bonusConfig?.maximumBonusPercentage ?? 20.0,
    statutoryWageCeiling: bonusConfig?.statutoryWageCeiling ?? 7000,
    eligibilityWageCeiling: bonusConfig?.eligibilityWageCeiling ?? 21000,
    minimumServiceDays: bonusConfig?.minimumServiceDays ?? 30,
    disbursementSchedule: bonusConfig?.disbursementSchedule || 'Annual (Diwali / Puja Festival)',
    disbursementDeadline: bonusConfig?.disbursementDeadline || '',
    proRataApplicable: bonusConfig?.proRataApplicable ?? true,
    effectiveDate: bonusConfig?.effectiveDate || ''
  });

  const [isSavingRules, setIsSavingRules] = useState(false);

  // Sync state whenever bonusConfig or companyId changes
  useEffect(() => {
    if (bonusConfig) {
      if (Array.isArray(bonusConfig.selectedComponentIds)) {
        setSelectedComponentIds(bonusConfig.selectedComponentIds);
      }
      if (Array.isArray(bonusConfig.bonusRates) && bonusConfig.bonusRates.length > 0) {
        setBonusRates(bonusConfig.bonusRates);
      }
      setBonusRules({
        calculationMethod: bonusConfig.calculationMethod || 'Percentage of Basic + DA',
        bonusPercentage: bonusConfig.bonusPercentage ?? 8.33,
        maximumBonusPercentage: bonusConfig.maximumBonusPercentage ?? 20.0,
        statutoryWageCeiling: bonusConfig.statutoryWageCeiling ?? 7000,
        eligibilityWageCeiling: bonusConfig.eligibilityWageCeiling ?? 21000,
        minimumServiceDays: bonusConfig.minimumServiceDays ?? 30,
        disbursementSchedule: bonusConfig.disbursementSchedule || 'Annual (Diwali / Puja Festival)',
        disbursementDeadline: bonusConfig.disbursementDeadline || '',
        proRataApplicable: bonusConfig.proRataApplicable ?? true,
        effectiveDate: bonusConfig.effectiveDate || ''
      });
    }
  }, [bonusConfig, companyId]);

  // Load live salary components from MongoDB Masters
  useEffect(() => {
    let isMounted = true;
    const fetchComponents = async () => {
      if (!companyId) return;
      try {
        const data = await masterService.getMasters('salary-components', companyId, true);
        if (isMounted) {
          const list = Array.isArray(data) ? data : [];
          setRawComponents(list);

          // If no selectedComponentIds exist yet, automatically select Basic & DA by default
          if ((!bonusConfig?.selectedComponentIds || bonusConfig.selectedComponentIds.length === 0) && list.length > 0) {
            const defaultBonusCompIds = list
              .filter(c => {
                const name = (c.name || '').toLowerCase();
                const code = (c.code || c.shortName || '').toLowerCase();
                return name.includes('basic') || name.includes('dearness') || code.includes('basic') || code.includes('da');
              })
              .map(c => String(c.id || c._id || ''));

            if (defaultBonusCompIds.length > 0) {
              setSelectedComponentIds(defaultBonusCompIds);
            }
          }
        }
      } catch (err) {
        if (isMounted) setRawComponents([]);
      }
    };

    fetchComponents();
    const handleSync = () => fetchComponents();
    window.addEventListener('salary-components-updated', handleSync);
    window.addEventListener('masters-updated', handleSync);

    return () => {
      isMounted = false;
      window.removeEventListener('salary-components-updated', handleSync);
      window.removeEventListener('masters-updated', handleSync);
    };
  }, [companyId, bonusConfig]);

  // Filter out deduction components
  const applicableSalaryComponents = useMemo(() => {
    return rawComponents.filter((c) => (c.type || 'earning') !== 'deduction');
  }, [rawComponents]);

  const formatComponentName = (c) => {
    const name = c.name || '';
    const alias = c.shortName || c.code || '';
    if (!alias) return name;
    const clean = name.replace(/\s*\([^)]*\)/g, '').trim();
    if (clean.toLowerCase() === alias.toLowerCase()) return clean;
    return `${clean} - ${alias}`;
  };

  const getComponentBadgeInfo = (c) => {
    const rawType = c.componentType || c.calculationType || 'Paid Days';
    const lower = rawType.toLowerCase();
    if (lower.includes('paid days') || lower.includes('fixed salary') || lower.includes('paid')) {
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

  // Toggle Component Applicability and persist to MongoDB
  const handleToggleBonusApplicability = async (comp) => {
    const id = String(comp.id || comp._id || '');
    const isCurrentlySelected = isSelected(comp);

    let next = [];
    if (isCurrentlySelected) {
      next = selectedComponentIds.filter((item) => item !== id && item !== (comp.code || '').toLowerCase());
    } else {
      next = [...selectedComponentIds, id];
    }

    setSelectedComponentIds(next);

    try {
      await statutoryService.updateModule(companyId, 'bonus', {
        ...bonusConfig,
        selectedComponentIds: next
      });
      if (setBonusConfig) {
        setBonusConfig((prev) => ({
          ...prev,
          selectedComponentIds: next
        }));
      }
      if (showToast) {
        showToast('✓ Salary component Bonus applicability updated.');
      }
    } catch (err) {
      console.error('Failed to update Bonus component applicability:', err);
      if (showToast) showToast('Failed to save component selection to database.', 'danger');
    }
  };

  // Add / Edit Bonus Rate
  const handleOpenAddRate = () => {
    setEditingRate(null);
    setIsRateModalOpen(true);
  };

  const handleOpenEditRate = (rate) => {
    setEditingRate(rate);
    setIsRateModalOpen(true);
  };

  const handleSaveRate = async (rateData) => {
    const targetId = String(rateData.id || rateData._id || '').trim();
    const exists = bonusRates.some((r) => String(r.id || r._id || '').trim() === targetId);
    const updatedRates = exists
      ? bonusRates.map((r) => (String(r.id || r._id || '').trim() === targetId ? rateData : r))
      : [rateData, ...bonusRates];

    setBonusRates(updatedRates);

    try {
      await statutoryService.updateModule(companyId, 'bonus', {
        ...bonusConfig,
        bonusRates: updatedRates,
        bonusPercentage: rateData.bonusPercentage,
        statutoryWageCeiling: rateData.statutoryWageCeiling,
        eligibilityWageCeiling: rateData.eligibilityWageCeiling
      });

      if (setBonusConfig) {
        setBonusConfig((prev) => ({
          ...prev,
          bonusRates: updatedRates,
          bonusPercentage: rateData.bonusPercentage,
          statutoryWageCeiling: rateData.statutoryWageCeiling,
          eligibilityWageCeiling: rateData.eligibilityWageCeiling,
          lastUpdatedDate: new Date().toLocaleDateString('en-GB')
        }));
      }

      if (showToast) {
        showToast(editingRate ? '✓ Statutory Bonus rate updated.' : '✓ New Statutory Bonus rule added.');
      }
    } catch (err) {
      console.error('Failed to save bonus rate:', err);
      if (showToast) showToast('Failed to save bonus rate to database.', 'danger');
    }

    setIsRateModalOpen(false);
    setEditingRate(null);
  };

  // Delete Bonus Rate
  const handleDeleteRate = async (rateId) => {
    const updated = bonusRates.filter((r) => (r.id || r._id) !== rateId);
    setBonusRates(updated);

    try {
      await statutoryService.updateModule(companyId, 'bonus', {
        ...bonusConfig,
        bonusRates: updated
      });
      if (setBonusConfig) {
        setBonusConfig((prev) => ({
          ...prev,
          bonusRates: updated
        }));
      }
      if (showToast) {
        showToast('✓ Bonus rule deleted.');
      }
    } catch (err) {
      console.error('Failed to delete bonus rate:', err);
      if (showToast) showToast('Failed to delete bonus rate.', 'danger');
    }
  };

  // Save Bonus Rules from Modal
  const handleSaveRulesFromModal = async (updatedRules) => {
    setIsSavingRules(true);
    try {
      const payload = {
        ...bonusConfig,
        ...updatedRules,
        bonusRates,
        selectedComponentIds
      };
      await statutoryService.updateModule(companyId, 'bonus', payload);
      setBonusRules(updatedRules);
      if (setBonusConfig) {
        setBonusConfig((prev) => ({
          ...prev,
          ...payload,
          lastUpdatedDate: new Date().toLocaleDateString('en-GB')
        }));
      }
      setIsRulesModalOpen(false);
      if (showToast) {
        showToast('✓ Statutory Bonus rules and workflow saved successfully.');
      }
    } catch (err) {
      console.error('Failed to save bonus rules:', err);
      if (showToast) showToast('Failed to save bonus rules to database.', 'danger');
    } finally {
      setIsSavingRules(false);
    }
  };

  const allApplicableCount = applicableSalaryComponents.length;
  const selectedCount = applicableSalaryComponents.filter(isSelected).length;

  return (
    <>
      {/* Bonus Rate Add / Edit Modal */}
      <BonusRateModal
        isOpen={isRateModalOpen}
        onClose={() => {
          setIsRateModalOpen(false);
          setEditingRate(null);
        }}
        onSubmit={handleSaveRate}
        editingItem={editingRate}
      />

      {/* Bonus Rules & Compliance Modal */}
      <BonusRulesModal
        isOpen={isRulesModalOpen}
        onClose={() => setIsRulesModalOpen(false)}
        initialSettings={bonusRules}
        onSave={handleSaveRulesFromModal}
        isSaving={isSavingRules}
        lastUpdatedDate={bonusConfig?.lastUpdatedDate}
        lastUpdatedBy={bonusConfig?.lastUpdatedBy}
      />

      <div className={styles.pfGridContainer}>
        {/* =========================================================================
            LEFT COLUMN: Salary Component Applicability (Wage Base for Bonus)
        ========================================================================= */}
        <div className={styles.pfColumnLeft}>
          <div className={styles.pfSectionCard}>
            <div className={styles.pfCardHeader} style={{ borderBottom: 'none', padding: '18px 20px 10px 20px' }}>
              <h3 className={styles.pfCardTitle}>
                Salary Component Applicability
              </h3>
            </div>

            {/* Salary Components Table with NAME | TYPE | SELECT */}
            <div style={{ maxHeight: '520px', overflowY: 'auto' }}>
              <table className={styles.pfTable}>
                <thead>
                  <tr>
                    <th style={{ padding: '12px 20px' }}>NAME</th>
                    <th style={{ textAlign: 'center' }}>TYPE</th>
                    <th style={{ textAlign: 'center', width: '80px' }}>SELECT</th>
                  </tr>
                </thead>
                <tbody>
                  {applicableSalaryComponents.length === 0 ? (
                    <tr>
                      <td colSpan={3} style={{ textAlign: 'center', padding: '24px', color: '#64748b' }}>
                        No earning components configured. Please add components in Masters &gt; Salary Components.
                      </td>
                    </tr>
                  ) : (
                    applicableSalaryComponents.map((comp, idx) => {
                      const badge = getComponentBadgeInfo(comp);
                      const checked = isSelected(comp);
                      const compIdStr = String(comp.id || comp._id || '');

                      return (
                        <tr 
                          key={compIdStr || `comp-${idx}`}
                          onClick={() => handleToggleBonusApplicability(comp)}
                          style={{ cursor: 'pointer', background: checked ? '#fcfdfe' : 'transparent' }}
                        >
                          <td className={styles.componentNameCell} style={{ padding: '12px 20px' }}>
                            {formatComponentName(comp)}
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <span className={badge.className}>
                              {badge.label}
                            </span>
                          </td>
                          <td style={{ textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              className={styles.checkboxInput}
                              checked={checked}
                              onChange={() => handleToggleBonusApplicability(comp)}
                            />
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div style={{ padding: '12px 20px', background: '#fafbfc', borderTop: '1px solid #edf2f7', fontSize: '11.5px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Info size={14} color="#0284c7" />
              <span>Components checked above form the Statutory Bonus Computation Wage Base (Standard: Basic + DA).</span>
            </div>
          </div>
        </div>

        {/* =========================================================================
            RIGHT COLUMN: Statutory Bonus Rates & Rules by Financial Year
        ========================================================================= */}
        <div className={styles.pfColumnRight}>
          {/* Card: Bonus Rates */}
          <div className={styles.pfSectionCard} style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h3 className={styles.pfCardTitle} style={{ margin: 0 }}>
                  Statutory Bonus Rates
                </h3>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button
                  type="button"
                  className={styles.pfAddNewBtn}
                  onClick={handleOpenAddRate}
                >
                  <Plus size={15} />
                  <span>Add Bonus Rule</span>
                </button>
              </div>
            </div>

            {/* Rates Table */}
            <div className={styles.tableCard}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>STATUS</th>
                    <th>FINANCIAL YEAR / DATE</th>
                    <th style={{ textAlign: 'center' }}>BONUS RATE</th>
                    <th style={{ textAlign: 'center' }}>COMPUTATION CEILING</th>
                    <th style={{ textAlign: 'center' }}>ELIGIBILITY LIMIT</th>
                    <th style={{ textAlign: 'right' }}>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {bonusRates.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '24px', color: '#64748b' }}>
                        No bonus rate rules configured. Click "Add Bonus Rule" to configure.
                      </td>
                    </tr>
                  ) : (
                    bonusRates.map((rate, rIdx) => {
                      const isAct = rate.enabled !== false;
                      return (
                        <tr key={rate.id || rate._id || `bonus-rate-${rIdx}`}>
                          <td>
                            <span className={isAct ? styles.statusEnabled : styles.statusDisabled}>
                              <span className={`${styles.statusDot} ${isAct ? styles.statusDotEnabled : styles.statusDotDisabled}`} />
                              <span>{isAct ? 'Enabled' : 'Disabled'}</span>
                            </span>
                          </td>
                          <td>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                              <span style={{ fontWeight: 600, color: '#0f172a' }}>
                                {rate.financialYear || 'FY 2026-2027'}
                              </span>
                              <span style={{ fontSize: '11px', color: '#64748b' }}>
                                Effective: {rate.effectiveDate || '01-Apr-2026'}
                              </span>
                            </div>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <span style={{
                              display: 'inline-block',
                              padding: '2px 9px',
                              borderRadius: '4px',
                              fontWeight: 700,
                              fontSize: '12px',
                              background: '#fdf2f8',
                              color: '#db2777'
                            }}>
                              {rate.bonusPercentage ?? 8.33}%
                            </span>
                          </td>
                          <td style={{ textAlign: 'center', fontWeight: 600, color: '#334155' }}>
                            ₹{Number(rate.statutoryWageCeiling || 7000).toLocaleString()}
                          </td>
                          <td style={{ textAlign: 'center', fontWeight: 600, color: '#334155' }}>
                            ₹{Number(rate.eligibilityWageCeiling || 21000).toLocaleString()}
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <div style={{ display: 'inline-flex', gap: '6px' }}>
                              <button
                                type="button"
                                className={styles.editIconBtn}
                                title="Edit Bonus Rule"
                                onClick={() => handleOpenEditRate(rate)}
                              >
                                <Edit2 size={13} />
                              </button>
                              <button
                                type="button"
                                className={styles.deleteIconBtn}
                                title="Delete Bonus Rule"
                                onClick={() => handleDeleteRate(rate.id || rate._id)}
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

            {/* Statutory Compliance Banner */}
            <div style={{ marginTop: '14px', padding: '12px 14px', background: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '12px', color: '#475569', lineHeight: 1.5 }}>
              <span>
                <strong>Payment of Bonus Act, 1965:</strong> Minimum statutory bonus is <strong>8.33%</strong> (equivalent to 1 month basic or ₹100), with a statutory maximum ceiling of <strong>20.0%</strong>. Bonus is applicable to employees drawing basic wages up to ₹21,000/month who have worked at least 30 days in the accounting year.
              </span>
            </div>

            {/* Quick Rules Summary Strip with Colorful Bonus Rules & Settings Button */}
            <div style={{
              marginTop: '14px',
              padding: '12px 16px',
              background: '#f8fafc',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', fontSize: '12.5px', color: '#475569' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  Statutory Rate: <strong style={{ color: '#9d174d', background: '#fce7f3', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 700 }}>{bonusRules.bonusPercentage}% - {bonusRules.maximumBonusPercentage}%</strong>
                </span>
                <span style={{ color: '#cbd5e1' }}>•</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  Computation: <strong style={{ color: '#047857', background: '#dcfce7', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 700 }}>₹{Number(bonusRules.statutoryWageCeiling || 7000).toLocaleString()}</strong>
                </span>
                <span style={{ color: '#cbd5e1' }}>•</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  Eligibility: <strong style={{ color: '#1e40af', background: '#dbeafe', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 700 }}>≤ ₹{Number(bonusRules.eligibilityWageCeiling || 21000).toLocaleString()}</strong>
                </span>
                <span style={{ color: '#cbd5e1' }}>•</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  Min Days: <strong style={{ color: '#7c3aed', background: '#f5f3ff', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 700 }}>{bonusRules.minimumServiceDays} Days</strong>
                </span>
              </div>

              {/* Colorful Vibrant Bonus Rules & Settings Button */}
              <button
                type="button"
                onClick={() => setIsRulesModalOpen(true)}
                style={{
                  background: '#c14436',
                  color: '#ffffff',
                  border: 'none',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  padding: '8px 18px',
                  borderRadius: '7px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '7px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  whiteSpace: 'nowrap',
                  letterSpacing: '0.01em'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.filter = 'brightness(1.08)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.filter = 'brightness(1)';
                }}
              >
                <SlidersHorizontal size={14} color="#ffffff" strokeWidth={2.4} />
                <span>Bonus Rules &amp; Settings</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default BonusConfigurationTab;

