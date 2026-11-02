import React, { useState, useEffect, useMemo } from 'react';
import { 
  Landmark, Plus, Edit2, Trash2, Info, CheckCircle2, 
  SlidersHorizontal, FileText, Sparkles 
} from 'lucide-react';
import styles from '../../pages/admin/StatutorySetup.module.css';
import LWFStateModal from './LWFStateModal';
import LWFRulesModal from './LWFRulesModal';
import { useCompany } from '../../context/CompanyContext';
import masterService from '../../services/masterService';
import statutoryService from '../../services/statutoryService';

const DEFAULT_LWF_RULES = [
  {
    id: 'lwf-mh-1',
    state: 'Maharashtra',
    enabled: true,
    status: 'active',
    employeeContribution: 12,
    employerContribution: 36,
    frequency: 'Half-Yearly',
    deductionMonths: 'June & December',
    wageCeiling: 0,
    effectiveDate: '2026-04-01',
    description: 'Maharashtra Labour Welfare Fund Act (1:3 Employer Ratio, June & Dec cycles)'
  },
  {
    id: 'lwf-ka-1',
    state: 'Karnataka',
    enabled: true,
    status: 'active',
    employeeContribution: 20,
    employerContribution: 40,
    frequency: 'Yearly',
    deductionMonths: 'December only',
    wageCeiling: 0,
    effectiveDate: '2026-04-01',
    description: 'Karnataka Labour Welfare Fund Act (1:2 Employer Ratio, December annual cycle)'
  },
  {
    id: 'lwf-hr-1',
    state: 'Haryana',
    enabled: true,
    status: 'active',
    employeeContribution: 25,
    employerContribution: 50,
    frequency: 'Monthly',
    deductionMonths: 'Every Month',
    wageCeiling: 0,
    effectiveDate: '2026-04-01',
    description: 'Haryana Labour Welfare Board (1:2 Employer Ratio, Monthly remittance)'
  },
  {
    id: 'lwf-gj-1',
    state: 'Gujarat',
    enabled: true,
    status: 'active',
    employeeContribution: 6,
    employerContribution: 18,
    frequency: 'Half-Yearly',
    deductionMonths: 'June & December',
    wageCeiling: 0,
    effectiveDate: '2026-04-01',
    description: 'Gujarat Labour Welfare Fund (1:3 Employer Ratio, June & Dec cycles)'
  },
  {
    id: 'lwf-tn-1',
    state: 'Tamil Nadu',
    enabled: true,
    status: 'active',
    employeeContribution: 20,
    employerContribution: 40,
    frequency: 'Yearly',
    deductionMonths: 'December only',
    wageCeiling: 0,
    effectiveDate: '2026-04-01',
    description: 'Tamil Nadu Labour Welfare Board (1:2 Employer Ratio, December annual cycle)'
  }
];

/**
 * LWFConfigurationTab Component
 * Specialized 2-Column Statutory Layout for Labour Welfare Fund (LWF):
 * - Left: Salary Component Applicability (Wage Base)
 * - Right: State LWF Contribution Rules + LWF Rules & Compliance Modal
 */
function LWFConfigurationTab({ showToast, lwfConfig, setLWFConfig, lwfRules: parentLWFRules = [], setLWFRules: setParentLWFRules, compId }) {
  const { activeCompany } = useCompany();
  const companyId = compId || activeCompany?.companyId || activeCompany?.id || 'RRS8392014SEC';

  // Dynamic raw salary components from MongoDB Masters
  const [rawComponents, setRawComponents] = useState([]);

  // Selected components for LWF calculation directly from MongoDB
  const [selectedComponentIds, setSelectedComponentIds] = useState(() => {
    if (Array.isArray(lwfConfig?.selectedComponentIds)) {
      return lwfConfig.selectedComponentIds;
    }
    return [];
  });

  // State selection filter for LWF Rules card
  const [selectedStateFilter, setSelectedStateFilter] = useState('All States');

  // Dynamic LWF Rules from MongoDB
  const [lwfRules, setLwfRules] = useState(() => {
    if (Array.isArray(parentLWFRules) && parentLWFRules.length > 0) {
      return parentLWFRules;
    }
    return DEFAULT_LWF_RULES;
  });

  // Modal States
  const [isStateModalOpen, setIsStateModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);

  // General LWF Rules State
  const [generalRules, setGeneralRules] = useState({
    deductionSchedule: lwfConfig?.deductionSchedule || 'Half-Yearly (June & December)',
    employerRatio: lwfConfig?.employerRatio || '1:3 (MH Standard)',
    autoDeductPayroll: lwfConfig?.autoDeductPayroll !== undefined ? Boolean(lwfConfig.autoDeductPayroll) : true,
    prorateOnExit: lwfConfig?.prorateOnExit !== undefined ? Boolean(lwfConfig.prorateOnExit) : true,
    defaultState: lwfConfig?.defaultState || 'Maharashtra',
    effectiveDate: lwfConfig?.effectiveDate || ''
  });

  const [isSavingRules, setIsSavingRules] = useState(false);

  // Sync state whenever parentLWFRules or lwfConfig changes
  useEffect(() => {
    if (Array.isArray(parentLWFRules) && parentLWFRules.length > 0) {
      setLwfRules(parentLWFRules);
    }
  }, [parentLWFRules]);

  useEffect(() => {
    if (lwfConfig) {
      if (Array.isArray(lwfConfig.selectedComponentIds)) {
        setSelectedComponentIds(lwfConfig.selectedComponentIds);
      }
      setGeneralRules({
        deductionSchedule: lwfConfig.deductionSchedule || 'Half-Yearly (June & December)',
        employerRatio: lwfConfig.employerRatio || '1:3 (MH Standard)',
        autoDeductPayroll: lwfConfig.autoDeductPayroll !== undefined ? Boolean(lwfConfig.autoDeductPayroll) : true,
        prorateOnExit: lwfConfig.prorateOnExit !== undefined ? Boolean(lwfConfig.prorateOnExit) : true,
        defaultState: lwfConfig.defaultState || 'Maharashtra',
        effectiveDate: lwfConfig.effectiveDate || ''
      });
    }
  }, [lwfConfig, companyId]);

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

          // If no selectedComponentIds exist yet, automatically select earning components by default
          if ((!lwfConfig?.selectedComponentIds || lwfConfig.selectedComponentIds.length === 0) && list.length > 0) {
            const defaultLwfCompIds = list
              .filter(c => (c.type || 'earning') !== 'deduction')
              .map(c => String(c.id || c._id || ''));

            if (defaultLwfCompIds.length > 0) {
              setSelectedComponentIds(defaultLwfCompIds);
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
  }, [companyId, lwfConfig]);

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
  const handleToggleLWFApplicability = async (comp) => {
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
      await statutoryService.updateModule(companyId, 'lwf', {
        ...lwfConfig,
        selectedComponentIds: next
      });
      if (setLWFConfig) {
        setLWFConfig((prev) => ({
          ...prev,
          selectedComponentIds: next
        }));
      }
      if (showToast) {
        showToast('✓ Salary component LWF applicability updated.');
      }
    } catch (err) {
      console.error('Failed to update LWF component applicability:', err);
      if (showToast) showToast('Failed to save component selection to database.', 'danger');
    }
  };

  // State options for filter dropdown
  const allStates = useMemo(() => {
    const list = Array.from(new Set(lwfRules.map(r => r.state).filter(Boolean)));
    return ['All States', ...list];
  }, [lwfRules]);

  // Filtered LWF rules by selected state
  const filteredLWFRules = useMemo(() => {
    if (selectedStateFilter === 'All States') return lwfRules;
    return lwfRules.filter(r => r.state === selectedStateFilter);
  }, [lwfRules, selectedStateFilter]);

  // Add / Edit State LWF Rule
  const handleOpenAddRule = () => {
    setEditingRule(null);
    setIsStateModalOpen(true);
  };

  const handleOpenEditRule = (rule) => {
    setEditingRule(rule);
    setIsStateModalOpen(true);
  };

  const handleSaveRule = async (ruleData) => {
    try {
      const res = await statutoryService.saveLWFRule(companyId, ruleData);
      const updatedList = res?.lwfRules || (
        lwfRules.some(r => (r.id || r._id) === ruleData.id)
          ? lwfRules.map(r => (r.id || r._id) === ruleData.id ? ruleData : r)
          : [ruleData, ...lwfRules]
      );

      setLwfRules(updatedList);
      if (setParentLWFRules) setParentLWFRules(updatedList);
      if (showToast) {
        showToast(editingRule ? '✓ State LWF rule updated.' : '✓ New State LWF rule added.');
      }
    } catch (err) {
      console.error('Failed to save LWF rule:', err);
      // Fallback local state update
      const targetId = String(ruleData.id || ruleData._id || '').trim();
      const exists = lwfRules.some(r => String(r.id || r._id || '').trim() === targetId);
      const fallbackList = exists
        ? lwfRules.map(r => String(r.id || r._id || '').trim() === targetId ? ruleData : r)
        : [ruleData, ...lwfRules];
      setLwfRules(fallbackList);
      if (setParentLWFRules) setParentLWFRules(fallbackList);
      if (showToast) showToast('✓ LWF rule updated locally.');
    }

    setIsStateModalOpen(false);
    setEditingRule(null);
  };

  // Delete State LWF Rule
  const handleDeleteRule = async (ruleId) => {
    try {
      const res = await statutoryService.deleteLWFRule(companyId, ruleId);
      const updatedList = res?.lwfRules || lwfRules.filter(r => (r.id || r._id) !== ruleId);
      setLwfRules(updatedList);
      if (setParentLWFRules) setParentLWFRules(updatedList);
      if (showToast) {
        showToast('✓ LWF rule deleted.');
      }
    } catch (err) {
      console.error('Failed to delete LWF rule:', err);
      const fallbackList = lwfRules.filter(r => (r.id || r._id) !== ruleId);
      setLwfRules(fallbackList);
      if (setParentLWFRules) setParentLWFRules(fallbackList);
      if (showToast) showToast('✓ LWF rule removed.');
    }
  };

  // Save LWF Rules from Modal
  const handleSaveRulesFromModal = async (updatedRules) => {
    setIsSavingRules(true);
    try {
      const payload = {
        ...lwfConfig,
        ...updatedRules,
        lwfRules,
        selectedComponentIds
      };
      await statutoryService.updateModule(companyId, 'lwf', payload);
      setGeneralRules(updatedRules);
      if (setLWFConfig) {
        setLWFConfig((prev) => ({
          ...prev,
          ...payload,
          lastUpdatedDate: new Date().toLocaleDateString('en-GB')
        }));
      }
      setIsRulesModalOpen(false);
      if (showToast) {
        showToast('✓ Labour Welfare Fund (LWF) settings saved successfully.');
      }
    } catch (err) {
      console.error('Failed to save LWF rules:', err);
      if (showToast) showToast('Failed to save LWF settings.', 'danger');
    } finally {
      setIsSavingRules(false);
    }
  };

  // Reset to default statutory rules
  const handleResetDefaultRules = async () => {
    setLwfRules(DEFAULT_LWF_RULES);
    if (setParentLWFRules) setParentLWFRules(DEFAULT_LWF_RULES);

    try {
      await statutoryService.updateModule(companyId, 'lwf', {
        ...lwfConfig,
        lwfRules: DEFAULT_LWF_RULES
      });
      if (setLWFConfig) {
        setLWFConfig((prev) => ({
          ...prev,
          lwfRules: DEFAULT_LWF_RULES
        }));
      }
      if (showToast) {
        showToast('✓ LWF rules restored to standard statutory defaults.');
      }
    } catch (err) {
      if (showToast) showToast('Failed to reset default LWF rules.', 'danger');
    }
  };


  return (
    <>
      {/* State LWF Add / Edit Modal */}
      <LWFStateModal
        isOpen={isStateModalOpen}
        onClose={() => {
          setIsStateModalOpen(false);
          setEditingRule(null);
        }}
        onSubmit={handleSaveRule}
        editingItem={editingRule}
        defaultState={selectedStateFilter !== 'All States' ? selectedStateFilter : 'Maharashtra'}
      />

      {/* LWF Rules & Compliance Modal */}
      <LWFRulesModal
        isOpen={isRulesModalOpen}
        onClose={() => setIsRulesModalOpen(false)}
        initialSettings={generalRules}
        onSave={handleSaveRulesFromModal}
        isSaving={isSavingRules}
        lastUpdatedDate={lwfConfig?.lastUpdatedDate}
        lastUpdatedBy={lwfConfig?.lastUpdatedBy}
      />

      {/* =========================================================================
          MAIN 2-COLUMN STATUTORY GRID: Left Applicability | Right State LWF Rules
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
                          onClick={() => handleToggleLWFApplicability(comp)}
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
                              onChange={() => handleToggleLWFApplicability(comp)}
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
              <span>Components checked above form the Statutory Labour Welfare Fund (LWF) Gross Wage Base.</span>
            </div>
          </div>
        </div>

        {/* =========================================================================
            RIGHT COLUMN: State LWF Contribution Rules & Settings
        ========================================================================= */}
        <div className={styles.pfColumnRight}>
          {/* Card: LWF Rules */}
          <div className={styles.pfSectionCard} style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h3 className={styles.pfCardTitle} style={{ margin: 0 }}>
                  State LWF Contribution Rules
                </h3>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {/* State Filter Selector */}
                <select
                  value={selectedStateFilter}
                  onChange={(e) => setSelectedStateFilter(e.target.value)}
                  style={{
                    height: '34px',
                    padding: '0 28px 0 10px',
                    fontSize: '12px',
                    fontWeight: 600,
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    background: '#ffffff',
                    color: '#334155',
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                >
                  {allStates.map(st => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>

                <button
                  type="button"
                  className={styles.pfAddNewBtn}
                  onClick={handleOpenAddRule}
                >
                  <Plus size={15} />
                  <span>Add State LWF Rule</span>
                </button>
              </div>
            </div>

            {/* Rules Table with STATUS */}
            <div className={styles.tableCard}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>STATUS</th>
                    <th>STATE / DEDUCTION CYCLE</th>
                    <th style={{ textAlign: 'center' }}>EMPLOYEE SHARE</th>
                    <th style={{ textAlign: 'center' }}>EMPLOYER SHARE</th>
                    <th style={{ textAlign: 'center' }}>FREQUENCY</th>
                    <th style={{ textAlign: 'right' }}>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLWFRules.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '24px', color: '#64748b' }}>
                        No LWF rules found for {selectedStateFilter}. Click "Add State LWF Rule" to configure.
                      </td>
                    </tr>
                  ) : (
                    filteredLWFRules.map((rule, rIdx) => {
                      const isAct = rule.enabled !== false && rule.status !== 'inactive';
                      return (
                        <tr key={rule.id || rule._id || `lwf-rule-${rIdx}`}>
                          <td>
                            <span className={isAct ? styles.statusEnabled : styles.statusDisabled}>
                              <span className={`${styles.statusDot} ${isAct ? styles.statusDotEnabled : styles.statusDotDisabled}`} />
                              <span>{isAct ? 'Enabled' : 'Disabled'}</span>
                            </span>
                          </td>
                          <td>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                              <span style={{ fontWeight: 600, color: '#0f172a' }}>
                                {rule.state}
                              </span>
                              <span style={{ fontSize: '11px', color: '#64748b' }}>
                                Cycle: {rule.deductionMonths || 'June & December'}
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
                              background: '#eff6ff',
                              color: '#2563eb'
                            }}>
                              ₹{Number(rule.employeeContribution ?? 12).toFixed(2)}
                            </span>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <span style={{
                              display: 'inline-block',
                              padding: '2px 9px',
                              borderRadius: '4px',
                              fontWeight: 700,
                              fontSize: '12px',
                              background: '#fef2f2',
                              color: '#dc2626'
                            }}>
                              ₹{Number(rule.employerContribution ?? 36).toFixed(2)}
                            </span>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <span className={styles.cycleBadge}>
                              {rule.frequency || 'Half-Yearly'}
                            </span>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <div style={{ display: 'inline-flex', gap: '6px' }}>
                              <button
                                type="button"
                                className={styles.editIconBtn}
                                title="Edit LWF Rule"
                                onClick={() => handleOpenEditRule(rule)}
                              >
                                <Edit2 size={13} />
                              </button>
                              <button
                                type="button"
                                className={styles.deleteIconBtn}
                                title="Delete LWF Rule"
                                onClick={() => handleDeleteRule(rule.id || rule._id)}
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
                <strong>Labour Welfare Fund (LWF) Compliance:</strong> State-mandated welfare contribution. Employee and employer contribute as per respective state labour welfare boards (e.g. MH: ₹12/₹36 half-yearly in June &amp; Dec, KA: ₹20/₹40 annually in Dec, HR: ₹25/₹50 monthly).
              </span>
            </div>

            {/* Quick Rules Summary Strip with Standard #c14436 Button */}
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
                  States: <strong style={{ color: '#047857', background: '#dcfce7', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 700 }}>{allStates.length - 1} States Configured</strong>
                </span>
                <span style={{ color: '#cbd5e1' }}>•</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  Schedule: <strong style={{ color: '#1e40af', background: '#dbeafe', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 700 }}>{generalRules.deductionSchedule}</strong>
                </span>
                <span style={{ color: '#cbd5e1' }}>•</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  Ratio: <strong style={{ color: '#7c3aed', background: '#f5f3ff', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 700 }}>{generalRules.employerRatio}</strong>
                </span>
              </div>

              {/* Consistent Color LWF Rules & Settings Button (#c14436) */}
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
                <span>LWF Rules &amp; Settings</span>
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
                Reset to Standard State LWF Statutory Defaults
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default LWFConfigurationTab;

