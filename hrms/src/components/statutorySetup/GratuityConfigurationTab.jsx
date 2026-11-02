import React, { useState, useEffect, useMemo } from 'react';
import { 
  HeartHandshake, Plus, Edit2, Trash2, Info, CheckCircle2, 
  SlidersHorizontal, FileText, Sparkles 
} from 'lucide-react';
import styles from '../../pages/admin/StatutorySetup.module.css';
import GratuityRateModal from './GratuityRateModal';
import GratuityRulesModal from './GratuityRulesModal';
import { useCompany } from '../../context/CompanyContext';
import masterService from '../../services/masterService';
import statutoryService from '../../services/statutoryService';

const DEFAULT_GRATUITY_RATES = [
  {
    id: 'gratuity-rate-1',
    enabled: true,
    status: 'active',
    effectiveDate: '2026-04-01',
    displayDate: '01-Apr-2026',
    eligibilityYears: 5,
    calculationBasis: 'Basic + DA',
    workingDaysPerMonth: 26,
    gratuityDaysPerYear: 15,
    maximumTaxExemptionLimit: 2000000,
    monthlyAccrualRate: 4.81,
    serviceRounding: '6+ months counts as 1 full year',
    description: 'Payment of Gratuity Act, 1972 (15/26 days per completed year, Max ₹20L exemption ceiling)'
  }
];

/**
 * GratuityConfigurationTab Component
 * Specialized 2-Column Statutory Layout for Payment of Gratuity Act, 1972:
 * - Left: Salary Component Applicability (Wage base: Basic + DA)
 * - Right: Gratuity Benefit Rules + Gratuity Rules & Compliance Settings
 */
function GratuityConfigurationTab({ showToast, gratuityConfig, setGratuityConfig, compId }) {
  const { activeCompany } = useCompany();
  const companyId = compId || activeCompany?.companyId || activeCompany?.id || 'RRS8392014SEC';

  // Dynamic raw salary components from MongoDB Masters
  const [rawComponents, setRawComponents] = useState([]);

  // Selected components for Gratuity calculation (strictly from MongoDB)
  const [selectedComponentIds, setSelectedComponentIds] = useState(() => {
    if (Array.isArray(gratuityConfig?.selectedComponentIds)) {
      return gratuityConfig.selectedComponentIds;
    }
    return [];
  });

  // Dynamic Gratuity Rates / Rules from MongoDB
  const [gratuityRates, setGratuityRates] = useState(() => {
    if (Array.isArray(gratuityConfig?.gratuityRates) && gratuityConfig.gratuityRates.length > 0) {
      return gratuityConfig.gratuityRates;
    }
    return DEFAULT_GRATUITY_RATES;
  });

  // Modal States
  const [isRateModalOpen, setIsRateModalOpen] = useState(false);
  const [editingRate, setEditingRate] = useState(null);
  const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);

  // General Gratuity Rules State
  const [gratuityRules, setGratuityRules] = useState({
    eligibilityYears: gratuityConfig?.eligibilityYears ?? 5,
    calculationBasis: gratuityConfig?.calculationBasis || 'Basic + DA',
    formulaMethod: gratuityConfig?.formulaMethod || '15 Days × (Last Drawn Basic + DA) × Completed Years / 26',
    gratuityDaysPerYear: gratuityConfig?.gratuityDaysPerYear ?? 15,
    workingDaysPerMonth: gratuityConfig?.workingDaysPerMonth ?? 26,
    maximumTaxExemptionLimit: gratuityConfig?.maximumTaxExemptionLimit ?? 2000000,
    monthlyAccrualRate: gratuityConfig?.monthlyAccrualRate ?? 4.81,
    serviceRounding: gratuityConfig?.serviceRounding !== undefined ? Boolean(gratuityConfig.serviceRounding) : true,
    deathDisablementWaiver: gratuityConfig?.deathDisablementWaiver !== undefined ? Boolean(gratuityConfig.deathDisablementWaiver) : true,
    effectiveDate: gratuityConfig?.effectiveDate || ''
  });

  const [isSavingRules, setIsSavingRules] = useState(false);

  // Sync state whenever gratuityConfig or companyId changes
  useEffect(() => {
    if (gratuityConfig) {
      if (Array.isArray(gratuityConfig.selectedComponentIds)) {
        setSelectedComponentIds(gratuityConfig.selectedComponentIds);
      }
      if (Array.isArray(gratuityConfig.gratuityRates) && gratuityConfig.gratuityRates.length > 0) {
        setGratuityRates(gratuityConfig.gratuityRates);
      }
      setGratuityRules({
        eligibilityYears: gratuityConfig.eligibilityYears ?? 5,
        calculationBasis: gratuityConfig.calculationBasis || 'Basic + DA',
        formulaMethod: gratuityConfig.formulaMethod || '15 Days × (Last Drawn Basic + DA) × Completed Years / 26',
        gratuityDaysPerYear: gratuityConfig.gratuityDaysPerYear ?? 15,
        workingDaysPerMonth: gratuityConfig.workingDaysPerMonth ?? 26,
        maximumTaxExemptionLimit: gratuityConfig.maximumTaxExemptionLimit ?? 2000000,
        monthlyAccrualRate: gratuityConfig.monthlyAccrualRate ?? 4.81,
        serviceRounding: gratuityConfig.serviceRounding !== undefined ? Boolean(gratuityConfig.serviceRounding) : true,
        deathDisablementWaiver: gratuityConfig.deathDisablementWaiver !== undefined ? Boolean(gratuityConfig.deathDisablementWaiver) : true,
        effectiveDate: gratuityConfig.effectiveDate || ''
      });
    }
  }, [gratuityConfig, companyId]);

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
          if ((!gratuityConfig?.selectedComponentIds || gratuityConfig.selectedComponentIds.length === 0) && list.length > 0) {
            const defaultGratuityCompIds = list
              .filter(c => {
                const name = (c.name || '').toLowerCase();
                const code = (c.code || c.shortName || '').toLowerCase();
                return name.includes('basic') || name.includes('dearness') || code.includes('basic') || code.includes('da');
              })
              .map(c => String(c.id || c._id || ''));

            if (defaultGratuityCompIds.length > 0) {
              setSelectedComponentIds(defaultGratuityCompIds);
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
  }, [companyId, gratuityConfig]);

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
  const handleToggleGratuityApplicability = async (comp) => {
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
      await statutoryService.updateModule(companyId, 'gratuity', {
        ...gratuityConfig,
        selectedComponentIds: next
      });
      if (setGratuityConfig) {
        setGratuityConfig((prev) => ({
          ...prev,
          selectedComponentIds: next
        }));
      }
      if (showToast) {
        showToast('✓ Salary component Gratuity applicability updated.');
      }
    } catch (err) {
      console.error('Failed to update Gratuity component applicability:', err);
      if (showToast) showToast('Failed to save component selection to database.', 'danger');
    }
  };

  // Add / Edit Gratuity Rule
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
    const exists = gratuityRates.some((r) => String(r.id || r._id || '').trim() === targetId);
    const updatedRates = exists
      ? gratuityRates.map((r) => (String(r.id || r._id || '').trim() === targetId ? rateData : r))
      : [rateData, ...gratuityRates];

    setGratuityRates(updatedRates);

    try {
      await statutoryService.updateModule(companyId, 'gratuity', {
        ...gratuityConfig,
        gratuityRates: updatedRates,
        eligibilityYears: rateData.eligibilityYears,
        maximumTaxExemptionLimit: rateData.maximumTaxExemptionLimit,
        calculationBasis: rateData.calculationBasis
      });

      if (setGratuityConfig) {
        setGratuityConfig((prev) => ({
          ...prev,
          gratuityRates: updatedRates,
          eligibilityYears: rateData.eligibilityYears,
          maximumTaxExemptionLimit: rateData.maximumTaxExemptionLimit,
          calculationBasis: rateData.calculationBasis,
          lastUpdatedDate: new Date().toLocaleDateString('en-GB')
        }));
      }

      if (showToast) {
        showToast(editingRate ? '✓ Gratuity rule updated.' : '✓ New Gratuity rule added.');
      }
    } catch (err) {
      console.error('Failed to save gratuity rate:', err);
      if (showToast) showToast('Failed to save gratuity rule to database.', 'danger');
    }

    setIsRateModalOpen(false);
    setEditingRate(null);
  };

  // Delete Gratuity Rate
  const handleDeleteRate = async (rateId) => {
    const updated = gratuityRates.filter((r) => (r.id || r._id) !== rateId);
    setGratuityRates(updated);

    try {
      await statutoryService.updateModule(companyId, 'gratuity', {
        ...gratuityConfig,
        gratuityRates: updated
      });
      if (setGratuityConfig) {
        setGratuityConfig((prev) => ({
          ...prev,
          gratuityRates: updated
        }));
      }
      if (showToast) {
        showToast('✓ Gratuity rule deleted.');
      }
    } catch (err) {
      console.error('Failed to delete gratuity rate:', err);
      if (showToast) showToast('Failed to delete gratuity rule.', 'danger');
    }
  };

  // Save Gratuity Rules from Modal
  const handleSaveRulesFromModal = async (updatedRules) => {
    setIsSavingRules(true);
    try {
      const payload = {
        ...gratuityConfig,
        ...updatedRules,
        gratuityRates,
        selectedComponentIds
      };
      await statutoryService.updateModule(companyId, 'gratuity', payload);
      setGratuityRules(updatedRules);
      if (setGratuityConfig) {
        setGratuityConfig((prev) => ({
          ...prev,
          ...payload,
          lastUpdatedDate: new Date().toLocaleDateString('en-GB')
        }));
      }
      setIsRulesModalOpen(false);
      if (showToast) {
        showToast('✓ Payment of Gratuity Act rules and workflow saved successfully.');
      }
    } catch (err) {
      console.error('Failed to save gratuity rules:', err);
      if (showToast) showToast('Failed to save gratuity rules.', 'danger');
    } finally {
      setIsSavingRules(false);
    }
  };

  // Reset to default statutory rules
  const handleResetDefaultRules = async () => {
    setGratuityRates(DEFAULT_GRATUITY_RATES);

    try {
      await statutoryService.updateModule(companyId, 'gratuity', {
        ...gratuityConfig,
        gratuityRates: DEFAULT_GRATUITY_RATES,
        eligibilityYears: 5,
        calculationBasis: 'Basic + DA',
        maximumTaxExemptionLimit: 2000000,
        monthlyAccrualRate: 4.81
      });
      if (setGratuityConfig) {
        setGratuityConfig((prev) => ({
          ...prev,
          gratuityRates: DEFAULT_GRATUITY_RATES,
          eligibilityYears: 5,
          calculationBasis: 'Basic + DA',
          maximumTaxExemptionLimit: 2000000,
          monthlyAccrualRate: 4.81
        }));
      }
      if (showToast) {
        showToast('✓ Gratuity rules restored to Payment of Gratuity Act 1972 statutory defaults.');
      }
    } catch (err) {
      if (showToast) showToast('Failed to reset default gratuity rules.', 'danger');
    }
  };

  const allApplicableCount = applicableSalaryComponents.length;
  const selectedCount = applicableSalaryComponents.filter(isSelected).length;

  return (
    <>
      {/* Gratuity Rate Add / Edit Modal */}
      <GratuityRateModal
        isOpen={isRateModalOpen}
        onClose={() => {
          setIsRateModalOpen(false);
          setEditingRate(null);
        }}
        onSubmit={handleSaveRate}
        editingItem={editingRate}
      />

      {/* Gratuity Rules & Compliance Modal */}
      <GratuityRulesModal
        isOpen={isRulesModalOpen}
        onClose={() => setIsRulesModalOpen(false)}
        initialSettings={gratuityRules}
        onSave={handleSaveRulesFromModal}
        isSaving={isSavingRules}
        lastUpdatedDate={gratuityConfig?.lastUpdatedDate}
        lastUpdatedBy={gratuityConfig?.lastUpdatedBy}
      />

      {/* =========================================================================
          MAIN 2-COLUMN STATUTORY GRID: Left Applicability | Right Gratuity Rates
      ========================================================================= */}
      <div className={styles.pfGridContainer}>
        {/* =========================================================================
            LEFT COLUMN: Salary Component Applicability (Wage Base)
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
                          onClick={() => handleToggleGratuityApplicability(comp)}
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
                              onChange={() => handleToggleGratuityApplicability(comp)}
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
              <span>Components checked above form the Statutory Gratuity Computation Wage Base (Standard: Basic + DA).</span>
            </div>
          </div>
        </div>

        {/* =========================================================================
            RIGHT COLUMN: Gratuity Benefit Rules & Settings
        ========================================================================= */}
        <div className={styles.pfColumnRight}>
          {/* Card: Gratuity Rules */}
          <div className={styles.pfSectionCard} style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h3 className={styles.pfCardTitle} style={{ margin: 0 }}>
                  Gratuity Benefit Rules
                </h3>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button
                  type="button"
                  className={styles.pfAddNewBtn}
                  onClick={handleOpenAddRate}
                >
                  <Plus size={15} />
                  <span>Add Gratuity Rule</span>
                </button>
              </div>
            </div>

            {/* Rates Table with STATUS */}
            <div className={styles.tableCard}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>STATUS</th>
                    <th>EFFECTIVE FROM / DATE</th>
                    <th style={{ textAlign: 'center' }}>CALCULATION BASIS</th>
                    <th style={{ textAlign: 'center' }}>FORMULA RATE</th>
                    <th style={{ textAlign: 'center' }}>MAX EXEMPTION</th>
                    <th style={{ textAlign: 'right' }}>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {gratuityRates.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '24px', color: '#64748b' }}>
                        No gratuity rules configured. Click "Add Gratuity Rule" to configure.
                      </td>
                    </tr>
                  ) : (
                    gratuityRates.map((rate, rIdx) => {
                      const isAct = rate.enabled !== false && rate.status !== 'inactive';
                      return (
                        <tr key={rate.id || rate._id || `gratuity-rate-${rIdx}`}>
                          <td>
                            <span className={isAct ? styles.statusEnabled : styles.statusDisabled}>
                              <span className={`${styles.statusDot} ${isAct ? styles.statusDotEnabled : styles.statusDotDisabled}`} />
                              <span>{isAct ? 'Enabled' : 'Disabled'}</span>
                            </span>
                          </td>
                          <td>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                              <span style={{ fontWeight: 600, color: '#0f172a' }}>
                                {rate.effectiveDate || '01-Apr-2026'}
                              </span>
                              <span style={{ fontSize: '11px', color: '#64748b' }}>
                                Min {rate.eligibilityYears || 5} Years Service
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
                              background: '#ecfdf5',
                              color: '#059669'
                            }}>
                              {rate.calculationBasis || 'Basic + DA'}
                            </span>
                          </td>
                          <td style={{ textAlign: 'center', fontWeight: 600, color: '#334155' }}>
                            <span style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center' }}>
                              <span>{rate.gratuityDaysPerYear || 15}/{rate.workingDaysPerMonth || 26} Days</span>
                              <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 500 }}>
                                ({rate.monthlyAccrualRate || 4.81}% Accrual)
                              </span>
                            </span>
                          </td>
                          <td style={{ textAlign: 'center', fontWeight: 700, color: '#0f172a' }}>
                            ₹{Number(rate.maximumTaxExemptionLimit || 2000000).toLocaleString()}
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <div style={{ display: 'inline-flex', gap: '6px' }}>
                              <button
                                type="button"
                                className={styles.editIconBtn}
                                title="Edit Gratuity Rule"
                                onClick={() => handleOpenEditRate(rate)}
                              >
                                <Edit2 size={13} />
                              </button>
                              <button
                                type="button"
                                className={styles.deleteIconBtn}
                                title="Delete Gratuity Rule"
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

            {/* Statutory Compliance Note Banner */}
            <div style={{ marginTop: '14px', padding: '12px 14px', background: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '12px', color: '#475569', lineHeight: 1.5 }}>
              <span>
                <strong>Payment of Gratuity Act, 1972:</strong> Payable upon separation after 5 continuous years of service at 15 days of last drawn wage for each completed year [15 × (Basic + DA) × Years / 26]. Maximum tax-exempt ceiling is ₹20,00,000 under Section 10(10).
              </span>
            </div>

            {/* Quick Rules Summary Strip with Consistent #c14436 Button */}
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
                  Eligibility: <strong style={{ color: '#047857', background: '#dcfce7', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 700 }}>{gratuityRules.eligibilityYears || 5} Years</strong>
                </span>
                <span style={{ color: '#cbd5e1' }}>•</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  Basis: <strong style={{ color: '#1e40af', background: '#dbeafe', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 700 }}>{gratuityRules.calculationBasis || 'Basic + DA'}</strong>
                </span>
                <span style={{ color: '#cbd5e1' }}>•</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  Max Limit: <strong style={{ color: '#7c3aed', background: '#f5f3ff', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 700 }}>₹{(Number(gratuityRules.maximumTaxExemptionLimit || 2000000) / 100000).toFixed(0)} Lakhs</strong>
                </span>
                <span style={{ color: '#cbd5e1' }}>•</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  Accrual: <strong style={{ color: '#0284c7', background: '#e0f2fe', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 700 }}>{gratuityRules.monthlyAccrualRate || 4.81}%</strong>
                </span>
              </div>

              {/* Consistent Color Gratuity Rules & Settings Button (#c14436) */}
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
                  letterSpacing: '0.01em',
                  boxShadow: '0 2px 4px rgba(193, 68, 54, 0.25)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#a8382c';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#c14436';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <SlidersHorizontal size={14} color="#ffffff" strokeWidth={2.4} />
                <span>Gratuity Rules &amp; Settings</span>
              </button>
            </div>

            <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={handleResetDefaultRules}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#64748b',
                  fontSize: '12px',
                  fontWeight: 600,
                  textDecoration: 'underline',
                  cursor: 'pointer',
                  padding: '4px'
                }}
              >
                Reset to Payment of Gratuity Act 1972 Statutory Defaults
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default GratuityConfigurationTab;
