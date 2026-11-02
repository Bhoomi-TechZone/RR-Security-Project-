import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, Edit2, Trash2, Info, CheckCircle2, AlertCircle, 
  HelpCircle, Save, ShieldCheck, FileText, Sparkles, SlidersHorizontal, Calculator 
} from 'lucide-react';
import styles from '../../pages/admin/StatutorySetup.module.css';
import TDSSlabModal from './TDSSlabModal';
import TDSRulesModal from './TDSRulesModal';
import { useCompany } from '../../context/CompanyContext';
import masterService from '../../services/masterService';
import statutoryService from '../../services/statutoryService';

const DEFAULT_NEW_REGIME_SLABS = [
  { id: 'new-1', regime: 'New Regime', enabled: true, status: 'active', minIncome: 0, maxIncome: 300000, taxRate: 0, cessRate: 4, rebateApplicable: true, description: 'Nil Rate (Up to ₹3,00,000)' },
  { id: 'new-2', regime: 'New Regime', enabled: true, status: 'active', minIncome: 300001, maxIncome: 700000, taxRate: 5, cessRate: 4, rebateApplicable: true, description: '5% (Sec 87A rebate applies up to ₹7L - Zero Tax)' },
  { id: 'new-3', regime: 'New Regime', enabled: true, status: 'active', minIncome: 700001, maxIncome: 1000000, taxRate: 10, cessRate: 4, rebateApplicable: false, description: '10% Tax rate' },
  { id: 'new-4', regime: 'New Regime', enabled: true, status: 'active', minIncome: 1000001, maxIncome: 1200000, taxRate: 15, cessRate: 4, rebateApplicable: false, description: '15% Tax rate' },
  { id: 'new-5', regime: 'New Regime', enabled: true, status: 'active', minIncome: 1200001, maxIncome: 1500000, taxRate: 20, cessRate: 4, rebateApplicable: false, description: '20% Tax rate' },
  { id: 'new-6', regime: 'New Regime', enabled: true, status: 'active', minIncome: 1500001, maxIncome: 99999999, isAbove: true, taxRate: 30, cessRate: 4, rebateApplicable: false, description: 'Above ₹15,00,000 (30% Max bracket)' }
];

const DEFAULT_OLD_REGIME_SLABS = [
  { id: 'old-1', regime: 'Old Regime', enabled: true, status: 'active', minIncome: 0, maxIncome: 250000, taxRate: 0, cessRate: 4, rebateApplicable: true, description: 'Nil Rate (Up to ₹2,50,000)' },
  { id: 'old-2', regime: 'Old Regime', enabled: true, status: 'active', minIncome: 250001, maxIncome: 500000, taxRate: 5, cessRate: 4, rebateApplicable: true, description: '5% (Sec 87A rebate applies up to ₹5L)' },
  { id: 'old-3', regime: 'Old Regime', enabled: true, status: 'active', minIncome: 500001, maxIncome: 1000000, taxRate: 20, cessRate: 4, rebateApplicable: false, description: '20% Tax rate' },
  { id: 'old-4', regime: 'Old Regime', enabled: true, status: 'active', minIncome: 1000001, maxIncome: 99999999, isAbove: true, taxRate: 30, cessRate: 4, rebateApplicable: false, description: 'Above ₹10,00,000 (30% Tax rate)' }
];

/**
 * TDSConfigurationTab Component
 * Specialized 2-Column Statutory Layout for Tax Deducted at Source (TDS):
 * - Left: Salary Component Applicability (Taxable Gross Wage Base)
 * - Right: Slabs Configuration (New Regime Section 115BAC vs Old Regime) + Rules Modal (Option 1)
 */
function TDSConfigurationTab({ showToast, tdsConfig, setTDSConfig, compId }) {
  const { activeCompany } = useCompany();
  const companyId = compId || activeCompany?.companyId || activeCompany?.id || 'RRS8392014SEC';

  // Dynamic raw salary components from MongoDB Masters
  const [rawComponents, setRawComponents] = useState([]);

  // Calculate On state (Annual Projected Gross vs Actual Monthly Taxable Base)
  const [calculateOn, setCalculateOn] = useState(() => {
    return tdsConfig?.calculateOn || 'Annual Projected Income';
  });

  // Selected components for TDS calculation (Taxable Wage base)
  const [selectedComponentIds, setSelectedComponentIds] = useState(() => {
    if (Array.isArray(tdsConfig?.selectedComponentIds)) {
      return tdsConfig.selectedComponentIds;
    }
    return [];
  });

  // Regime tab switcher state: 'New Regime' | 'Old Regime'
  const [activeRegimeTab, setActiveRegimeTab] = useState(() => {
    return tdsConfig?.defaultTaxRegime === 'Old Regime' ? 'Old Regime' : 'New Regime';
  });

  // Dynamic Tax Slabs State (persisted in MongoDB via tdsConfig)
  const [taxSlabs, setTaxSlabs] = useState(() => {
    if (Array.isArray(tdsConfig?.taxSlabs) && tdsConfig.taxSlabs.length > 0) {
      return tdsConfig.taxSlabs;
    }
    return [...DEFAULT_NEW_REGIME_SLABS, ...DEFAULT_OLD_REGIME_SLABS];
  });

  // Modal State for Add / Edit Slab
  const [isSlabModalOpen, setIsSlabModalOpen] = useState(false);
  const [editingSlab, setEditingSlab] = useState(null);

  // Modal State for TDS Rules & Settings (Option 1)
  const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);

  // General Settings state initialized from tdsConfig
  const [generalSettings, setGeneralSettings] = useState({
    defaultTaxRegime: tdsConfig?.defaultTaxRegime || 'New Regime',
    effectiveFinancialYear: tdsConfig?.effectiveFinancialYear || '2026-2027',
    standardDeductionNewRegime: tdsConfig?.standardDeductionNewRegime ?? 75000,
    standardDeductionOldRegime: tdsConfig?.standardDeductionOldRegime ?? 50000,
    allowEmployeeRegimeSwitch: tdsConfig?.allowEmployeeRegimeSwitch ?? true,
    investmentDeclarationRequired: tdsConfig?.investmentDeclarationRequired ?? true,
    proofSubmissionDeadline: tdsConfig?.proofSubmissionDeadline || '',
    healthAndEduCessRate: tdsConfig?.healthAndEduCessRate ?? 4,
    monthlyTDSThreshold: tdsConfig?.monthlyTDSThreshold ?? 500000
  });

  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // Sync state when tdsConfig changes
  useEffect(() => {
    if (tdsConfig) {
      if (Array.isArray(tdsConfig.selectedComponentIds)) {
        setSelectedComponentIds(tdsConfig.selectedComponentIds);
      }
      if (tdsConfig.calculateOn) {
        setCalculateOn(tdsConfig.calculateOn);
      }
      if (Array.isArray(tdsConfig.taxSlabs) && tdsConfig.taxSlabs.length > 0) {
        setTaxSlabs(tdsConfig.taxSlabs);
      }
      setGeneralSettings({
        defaultTaxRegime: tdsConfig.defaultTaxRegime || 'New Regime',
        effectiveFinancialYear: tdsConfig.effectiveFinancialYear || '2026-2027',
        standardDeductionNewRegime: tdsConfig.standardDeductionNewRegime ?? 75000,
        standardDeductionOldRegime: tdsConfig.standardDeductionOldRegime ?? 50000,
        allowEmployeeRegimeSwitch: tdsConfig.allowEmployeeRegimeSwitch ?? true,
        investmentDeclarationRequired: tdsConfig.investmentDeclarationRequired ?? true,
        proofSubmissionDeadline: tdsConfig.proofSubmissionDeadline || '',
        healthAndEduCessRate: tdsConfig.healthAndEduCessRate ?? 4,
        monthlyTDSThreshold: tdsConfig.monthlyTDSThreshold ?? 500000
      });
    }
  }, [tdsConfig, companyId]);

  // Load live salary components from MongoDB Masters
  useEffect(() => {
    let isMounted = true;
    const fetchComponents = async () => {
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

    fetchComponents();
    const handleSync = () => fetchComponents();
    window.addEventListener('salary-components-updated', handleSync);
    window.addEventListener('masters-updated', handleSync);

    return () => {
      isMounted = false;
      window.removeEventListener('salary-components-updated', handleSync);
      window.removeEventListener('masters-updated', handleSync);
    };
  }, [companyId]);

  // Filter out deductions; only show earnings components that can be taxable
  const applicableSalaryComponents = useMemo(() => {
    return rawComponents.filter((c) => (c.type || 'earning') !== 'deduction');
  }, [rawComponents]);

  // Format component name: "Basic Salary - Basic"
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

  // Toggle salary component applicability and persist to MongoDB
  const handleToggleTDSApplicability = async (comp) => {
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
      await statutoryService.updateModule(companyId, 'tds', {
        ...tdsConfig,
        selectedComponentIds: next
      });
      if (setTDSConfig) {
        setTDSConfig((prev) => ({
          ...prev,
          selectedComponentIds: next
        }));
      }
      if (showToast) {
        showToast('✓ Salary component TDS applicability updated.');
      }
    } catch (err) {
      console.error('Failed to update TDS component applicability:', err);
      if (showToast) showToast('Failed to save component selection to database.', 'danger');
    }
  };

  // Toggle Calculate On basis (Annual Projected vs Monthly)
  const handleCalculateOnChange = async (e) => {
    const newVal = e.target.value;
    setCalculateOn(newVal);

    try {
      await statutoryService.updateModule(companyId, 'tds', {
        ...tdsConfig,
        calculateOn: newVal
      });
      if (setTDSConfig) {
        setTDSConfig((prev) => ({
          ...prev,
          calculateOn: newVal
        }));
      }
      if (showToast) {
        showToast(`✓ TDS calculation basis set to: ${newVal}`);
      }
    } catch (err) {
      console.error('Failed to update calculateOn:', err);
      if (showToast) showToast('Failed to save calculation basis.', 'danger');
    }
  };

  // Slabs currently active for the selected regime tab
  const activeSlabs = useMemo(() => {
    return taxSlabs.filter((s) => (s.regime || 'New Regime') === activeRegimeTab);
  }, [taxSlabs, activeRegimeTab]);

  // Open modal to Add Slab
  const handleOpenAddSlab = () => {
    setEditingSlab(null);
    setIsSlabModalOpen(true);
  };

  // Open modal to Edit Slab
  const handleOpenEditSlab = (slab) => {
    setEditingSlab(slab);
    setIsSlabModalOpen(true);
  };

  // Save / Update slab and persist to MongoDB
  const handleSaveSlab = async (slabData) => {
    const exists = taxSlabs.some((s) => (s.id || s._id) === slabData.id);
    const updatedSlabs = exists
      ? taxSlabs.map((s) => ((s.id || s._id) === slabData.id ? slabData : s))
      : [...taxSlabs, slabData];

    setTaxSlabs(updatedSlabs);

    try {
      await statutoryService.updateModule(companyId, 'tds', {
        ...tdsConfig,
        taxSlabs: updatedSlabs
      });
      if (setTDSConfig) {
        setTDSConfig((prev) => ({
          ...prev,
          taxSlabs: updatedSlabs
        }));
      }
      if (showToast) {
        showToast(editingSlab ? '✓ Income tax slab updated.' : '✓ New income tax slab added.');
      }
    } catch (err) {
      console.error('Failed to save slab:', err);
      if (showToast) showToast('Failed to save tax slab to database.', 'danger');
    }

    setIsSlabModalOpen(false);
    setEditingSlab(null);
  };

  // Delete slab and persist to MongoDB
  const handleDeleteSlab = async (slabId) => {
    const updated = taxSlabs.filter((s) => (s.id || s._id) !== slabId);
    setTaxSlabs(updated);

    try {
      await statutoryService.updateModule(companyId, 'tds', {
        ...tdsConfig,
        taxSlabs: updated
      });
      if (setTDSConfig) {
        setTDSConfig((prev) => ({
          ...prev,
          taxSlabs: updated
        }));
      }
      if (showToast) {
        showToast('✓ Income tax slab deleted.');
      }
    } catch (err) {
      console.error('Failed to delete slab:', err);
      if (showToast) showToast('Failed to delete tax slab.', 'danger');
    }
  };

  // Reset to default statutory slabs
  const handleResetDefaultSlabs = async () => {
    const defaultCombined = [...DEFAULT_NEW_REGIME_SLABS, ...DEFAULT_OLD_REGIME_SLABS];
    setTaxSlabs(defaultCombined);

    try {
      await statutoryService.updateModule(companyId, 'tds', {
        ...tdsConfig,
        taxSlabs: defaultCombined
      });
      if (setTDSConfig) {
        setTDSConfig((prev) => ({
          ...prev,
          taxSlabs: defaultCombined
        }));
      }
      if (showToast) {
        showToast('✓ Income tax slabs restored to Budget 2024 statutory defaults.');
      }
    } catch (err) {
      if (showToast) showToast('Failed to reset default slabs.', 'danger');
    }
  };

  // Save TDS Rules & Settings from Modal (Option 1)
  const handleSaveRulesFromModal = async (updatedSettings) => {
    setIsSavingSettings(true);
    try {
      const activeCalcOn = updatedSettings.calculateOn || calculateOn;
      const payload = {
        ...tdsConfig,
        ...updatedSettings,
        taxSlabs,
        selectedComponentIds,
        calculateOn: activeCalcOn
      };
      await statutoryService.updateModule(companyId, 'tds', payload);
      setGeneralSettings(updatedSettings);
      if (updatedSettings.calculateOn) {
        setCalculateOn(updatedSettings.calculateOn);
      }
      if (setTDSConfig) {
        setTDSConfig((prev) => ({
          ...prev,
          ...payload,
          lastUpdatedDate: new Date().toLocaleDateString('en-GB')
        }));
      }
      setIsRulesModalOpen(false);
      if (showToast) {
        showToast('✓ TDS rules and workflow settings saved successfully.');
      }
    } catch (err) {
      console.error('Failed to save TDS settings:', err);
      if (showToast) showToast('Failed to save TDS settings.', 'danger');
    } finally {
      setIsSavingSettings(false);
    }
  };


  const allApplicableCount = applicableSalaryComponents.length;
  const selectedCount = applicableSalaryComponents.filter(isSelected).length;

  return (
    <>
      {/* TDS Slab Add / Edit Modal */}
      <TDSSlabModal
        isOpen={isSlabModalOpen}
        onClose={() => {
          setIsSlabModalOpen(false);
          setEditingSlab(null);
        }}
        onSubmit={handleSaveSlab}
        editingItem={editingSlab}
        activeRegime={activeRegimeTab}
      />

      {/* TDS Rules & Settings Modal (Option 1) */}
      <TDSRulesModal
        isOpen={isRulesModalOpen}
        onClose={() => setIsRulesModalOpen(false)}
        initialSettings={generalSettings}
        onSave={handleSaveRulesFromModal}
        isSaving={isSavingSettings}
        lastUpdatedDate={tdsConfig?.lastUpdatedDate}
        lastUpdatedBy={tdsConfig?.lastUpdatedBy}
      />

      <div className={styles.pfGridContainer}>
        {/* =========================================================================
            LEFT COLUMN: Salary Component Applicability (Taxable Gross Wage Base)
        ========================================================================= */}
        <div className={styles.pfColumnLeft}>
          <div className={styles.pfSectionCard}>
            <div className={styles.pfCardHeader} style={{ borderBottom: 'none', padding: '18px 20px 10px 20px' }}>
              <h3 className={styles.pfCardTitle}>
                Salary Component Applicability
              </h3>
            </div>

            {/* Calculate On basis control */}
            <div style={{ padding: '14px 20px', background: '#fafbfc', borderBottom: '1px solid #edf2f7', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#1e293b' }}>Calculate On</span>
                <span style={{ fontSize: '11px', color: '#64748b' }}>Projected annual wage or monthly taxable gross</span>
              </div>
              <select
                className={styles.select}
                style={{ width: '210px', height: '36px', fontSize: '12.5px' }}
                value={calculateOn}
                onChange={handleCalculateOnChange}
              >
                <option value="Annual Projected Income">Annual Projected Income</option>
                <option value="Actual Monthly Gross">Actual Monthly Gross</option>
              </select>
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
                      <td
                        colSpan={3}
                        style={{ textAlign: 'center', padding: '24px', color: '#64748b' }}
                      >
                        No taxable salary components found.
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
                          onClick={() => handleToggleTDSApplicability(comp)}
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
                              onChange={() => handleToggleTDSApplicability(comp)}
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
              <span>Components checked above form the Taxable Gross Base for TDS deductions.</span>
            </div>
          </div>
        </div>

        {/* =========================================================================
            RIGHT COLUMN: Slabs Configuration (New vs Old Regime) + Rules Modal Link
        ========================================================================= */}
        <div className={styles.pfColumnRight}>
          {/* Card: Income Tax Slabs */}
          <div className={styles.pfSectionCard} style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h3 className={styles.pfCardTitle} style={{ margin: 0 }}>
                  <Calculator size={18} color="#2563eb" />
                  <span>Income Tax Slabs</span>
                </h3>
                <span style={{ fontSize: '12px', color: '#64748b' }}>
                  Statutory income tax slabs for FY 2026-2027 (AY 2027-2028)
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button
                  type="button"
                  className={styles.pfAddNewBtn}
                  onClick={handleOpenAddSlab}
                >
                  <Plus size={15} />
                  <span>Add Slab</span>
                </button>
              </div>
            </div>

            {/* Regime Tab Selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#f1f5f9', padding: '4px', borderRadius: '8px', marginBottom: '16px' }}>
              <button
                type="button"
                onClick={() => setActiveRegimeTab('New Regime')}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  background: activeRegimeTab === 'New Regime' ? '#ffffff' : 'transparent',
                  color: activeRegimeTab === 'New Regime' ? '#2563eb' : '#64748b',
                  boxShadow: activeRegimeTab === 'New Regime' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <span>New Regime (Section 115BAC)</span>
                <span style={{ fontSize: '10px', background: '#dbeafe', color: '#1e40af', padding: '1px 6px', borderRadius: '10px', fontWeight: 700 }}>Default</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveRegimeTab('Old Regime')}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  background: activeRegimeTab === 'Old Regime' ? '#ffffff' : 'transparent',
                  color: activeRegimeTab === 'Old Regime' ? '#2563eb' : '#64748b',
                  boxShadow: activeRegimeTab === 'Old Regime' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <span>Old Regime (With Deductions)</span>
              </button>
            </div>

            {/* Slabs Table */}
            <div className={styles.tableCard}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>STATUS</th>
                    <th>SLAB RANGE (₹)</th>
                    <th style={{ textAlign: 'center' }}>TAX RATE</th>
                    <th style={{ textAlign: 'center' }}>CESS</th>
                    <th>NOTES &amp; REBATE</th>
                    <th style={{ textAlign: 'right' }}>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {activeSlabs.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '24px', color: '#64748b' }}>
                        No tax slabs configured for {activeRegimeTab}. Click "Add Slab" or reset to default.
                      </td>
                    </tr>
                  ) : (
                    activeSlabs.map((slab, sIdx) => {
                      const isAct = slab.status !== 'inactive' && slab.enabled !== false;
                      const minFmt = `₹${slab.minIncome.toLocaleString()}`;
                      const maxFmt = slab.isAbove || slab.maxIncome >= 99999999 ? 'Above' : `₹${slab.maxIncome.toLocaleString()}`;
                      return (
                        <tr key={slab.id || slab._id || `${slab.regime}-${slab.minIncome}-${sIdx}`}>
                          <td>
                            <span className={isAct ? styles.statusEnabled : styles.statusDisabled}>
                              <span className={`${styles.statusDot} ${isAct ? styles.statusDotEnabled : styles.statusDotDisabled}`} />
                              <span>{isAct ? 'Enabled' : 'Disabled'}</span>
                            </span>
                          </td>
                          <td>
                            <span style={{ fontWeight: 600, color: '#0f172a' }}>
                              {slab.isAbove || slab.maxIncome >= 99999999 ? `${minFmt} & Above` : `${minFmt} - ${maxFmt}`}
                            </span>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <span style={{
                              display: 'inline-block',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              fontWeight: 700,
                              fontSize: '12px',
                              background: slab.taxRate === 0 ? '#ecfdf5' : slab.taxRate <= 10 ? '#eff6ff' : slab.taxRate <= 20 ? '#fffbeb' : '#fef2f2',
                              color: slab.taxRate === 0 ? '#059669' : slab.taxRate <= 10 ? '#2563eb' : slab.taxRate <= 20 ? '#d97706' : '#dc2626'
                            }}>
                              {slab.taxRate}% {slab.taxRate === 0 ? '(Nil)' : ''}
                            </span>
                          </td>
                          <td style={{ textAlign: 'center', fontSize: '12.5px', color: '#64748b' }}>
                            {slab.cessRate ?? 4}%
                          </td>
                          <td>
                            <span style={{ fontSize: '12px', color: slab.rebateApplicable ? '#059669' : '#64748b', fontWeight: slab.rebateApplicable ? 600 : 400 }}>
                              {slab.description || (slab.rebateApplicable ? 'Sec 87A rebate eligible' : 'Standard bracket')}
                            </span>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <div style={{ display: 'inline-flex', gap: '6px' }}>
                              <button
                                type="button"
                                className={styles.editIconBtn}
                                title="Edit Slab"
                                onClick={() => handleOpenEditSlab(slab)}
                              >
                                <Edit2 size={13} />
                              </button>
                              <button
                                type="button"
                                className={styles.deleteIconBtn}
                                title="Delete Slab"
                                onClick={() => handleDeleteSlab(slab.id || slab._id)}
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

            {/* Statutory Regime Notes Banner */}
            <div style={{ marginTop: '14px', padding: '12px 14px', background: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '12px', color: '#475569', lineHeight: 1.5 }}>
              {activeRegimeTab === 'New Regime' ? (
                <span>
                  <strong>Finance Act (Budget 2024 Revision):</strong> Standard deduction is ₹75,000 for salaried employees. Tax rebate under Section 87A is available up to ₹7,00,000 taxable income, resulting in zero tax liability.
                </span>
              ) : (
                <span>
                  <strong>Old Regime Provisions:</strong> Standard deduction is ₹50,000. Employees can claim Chapter VI-A deductions (80C up to ₹1.5L, 80D up to ₹25k/₹50k, 80CCD up to ₹50k) and HRA exemption under Section 10(13A).
                </span>
              )}
            </div>

            {/* Quick Rules Summary Strip */}
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
                  Default: <strong style={{ color: '#1e40af', background: '#dbeafe', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 700 }}>{generalSettings.defaultTaxRegime}</strong>
                </span>
                <span style={{ color: '#cbd5e1' }}>•</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  Std Deduction: <strong style={{ color: '#047857', background: '#dcfce7', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 700 }}>₹{Number(generalSettings.standardDeductionNewRegime || 75000).toLocaleString()} (New) / ₹{Number(generalSettings.standardDeductionOldRegime || 50000).toLocaleString()} (Old)</strong>
                </span>
                <span style={{ color: '#cbd5e1' }}>•</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  Cess: <strong style={{ color: '#7c3aed', background: '#f5f3ff', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 700 }}>{generalSettings.healthAndEduCessRate ?? 4}%</strong>
                </span>
                {generalSettings.proofSubmissionDeadline && (
                  <>
                    <span style={{ color: '#cbd5e1' }}>•</span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                      Deadline: <strong style={{ color: '#c2410c', background: '#ffedd5', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 700 }}>{generalSettings.proofSubmissionDeadline}</strong>
                    </span>
                  </>
                )}
              </div>

              {/* Colorful Vibrant TDS Rules & Settings Button */}
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
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <SlidersHorizontal size={14} color="#ffffff" strokeWidth={2.4} />
                <span>TDS Rules &amp; Settings</span>
              </button>
            </div>

            <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={handleResetDefaultSlabs}
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
                Reset to Budget 2024 Statutory Default Slabs
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default TDSConfigurationTab;
