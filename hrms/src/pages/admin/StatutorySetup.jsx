import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { 
  Landmark, Shield, Award, FileText, Gift, HeartHandshake, 
  HelpCircle, CheckCircle2, AlertCircle, Plus, Search, Edit2, 
  Trash2, Save, ArrowRight, Sparkles, Layers, SlidersHorizontal,
  Calendar, Check, ToggleLeft, ToggleRight, Clock, ArrowUpRight, Loader2
} from 'lucide-react';
import styles from './StatutorySetup.module.css';

import AdminLayout from '../../components/layout/AdminLayout';
import StatusBadge from '../../components/common/StatusBadge';
import Toast from '../../components/common/Toast';
import ConfirmModal from '../../components/common/ConfirmModal';

import PTSlabModal from '../../components/statutorySetup/PTSlabModal';
import LWFStateModal from '../../components/statutorySetup/LWFStateModal';

import { useCompany } from '../../context/CompanyContext';
import statutoryService from '../../services/statutoryService';

const TABS = [
  { id: 'overview', label: 'Overview', icon: SlidersHorizontal },
  { id: 'pf', label: 'PF', icon: Landmark, name: 'Provident Fund (PF)' },
  { id: 'esi', label: 'ESI', icon: Shield, name: 'Employee State Insurance (ESI)' },
  { id: 'pt', label: 'PT', icon: Layers, name: 'Professional Tax (PT)' },
  { id: 'tds', label: 'TDS', icon: FileText, name: 'Tax Deducted at Source (TDS)' },
  { id: 'bonus', label: 'Bonus', icon: Gift, name: 'Statutory Bonus' },
  { id: 'gratuity', label: 'Gratuity', icon: HeartHandshake, name: 'Gratuity' },
  { id: 'lwf', label: 'LWF', icon: Landmark, name: 'Labour Welfare Fund (LWF)' }
];

const INITIAL_PF = {
  enabled: true,
  employeeContribution: 12,
  employerContribution: 12,
  epsContribution: 8.33,
  epfEmployerContribution: 3.67,
  edliContribution: 0.5,
  adminCharges: 0.5,
  wageCeiling: 15000,
  wageCeilingRestricted: true,
  allowVPF: true,
  vpfMaxPercentage: 100,
  effectiveDate: '2026-04-01',
  status: 'active',
  createdBy: 'System SuperAdmin',
  createdDate: '2025-04-01',
  lastUpdatedBy: 'Admin',
  lastUpdatedDate: '2026-04-01'
};

const INITIAL_ESI = {
  enabled: true,
  employeeContribution: 0.75,
  employerContribution: 3.25,
  wageEligibilityLimit: 21000,
  disabilityWageLimit: 25000,
  effectiveDate: '2026-04-01',
  status: 'active',
  notes: 'Applicable to all staff drawing gross monthly wage up to ₹21,000.',
  createdBy: 'System SuperAdmin',
  createdDate: '2025-04-01',
  lastUpdatedBy: 'Admin',
  lastUpdatedDate: '2026-04-01'
};

const INITIAL_PT = {
  enabled: true,
  status: 'active',
  effectiveDate: '2026-04-01',
  lastUpdatedBy: 'Admin',
  lastUpdatedDate: '2026-04-01'
};

const INITIAL_TDS = {
  enabled: true,
  defaultTaxRegime: 'New Regime',
  effectiveFinancialYear: '2026-2027',
  standardDeductionNewRegime: 75000,
  standardDeductionOldRegime: 50000,
  investmentDeclarationRequired: true,
  proofSubmissionDeadline: '2027-01-31',
  monthlyTDSThreshold: 500000,
  status: 'active',
  lastUpdatedBy: 'Admin',
  lastUpdatedDate: '2026-04-01'
};

const INITIAL_BONUS = {
  enabled: true,
  calculationMethod: 'Percentage of Basic',
  bonusPercentage: 8.33,
  maximumBonusPercentage: 20.0,
  statutoryWageCeiling: 7000,
  minimumServiceDays: 30,
  disbursementSchedule: 'Annual (Diwali / Puja Festival)',
  effectiveDate: '2026-04-01',
  status: 'active',
  lastUpdatedBy: 'Admin',
  lastUpdatedDate: '2026-04-01'
};

const INITIAL_GRATUITY = {
  enabled: true,
  eligibilityYears: 5,
  calculationBasis: 'Basic + DA',
  formulaMethod: '15 Days × (Last Drawn Basic + DA) × Completed Years / 26',
  maximumTaxExemptionLimit: 2000000,
  effectiveDate: '2026-04-01',
  status: 'active',
  lastUpdatedBy: 'Admin',
  lastUpdatedDate: '2026-04-01'
};

const INITIAL_LWF = {
  enabled: true,
  status: 'active',
  effectiveDate: '2026-04-01',
  lastUpdatedBy: 'Admin',
  lastUpdatedDate: '2026-04-01'
};

function StatutorySetup() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const isFromOrgSettings = location.state?.fromOrganisationSettings === true;

  const { activeCompany } = useCompany();
  const compId = activeCompany?.companyId || activeCompany?.id || 'RRS8392014SEC';

  // Active Tab from query param or default 'overview'
  const initialTab = searchParams.get('tab') || 'overview';
  const [activeTab, setActiveTab] = useState(initialTab);

  // Sync tab with URL
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && TABS.some(t => t.id === tabParam)) {
      setActiveTab(tabParam);
    } else {
      setActiveTab('overview');
    }
  }, [searchParams]);

  const handleTabChange = (newTab) => {
    setActiveTab(newTab);
    setSearchParams(newTab === 'overview' ? {} : { tab: newTab }, { state: location.state });
  };

  // Loading and saving states
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Dynamic States loaded directly from MongoDB
  const [pfConfig, setPFConfig] = useState(INITIAL_PF);
  const [esiConfig, setESIConfig] = useState(INITIAL_ESI);
  const [ptConfig, setPTConfig] = useState(INITIAL_PT);
  const [ptSlabs, setPTSlabs] = useState([]);
  const [tdsConfig, setTDSConfig] = useState(INITIAL_TDS);
  const [bonusConfig, setBonusConfig] = useState(INITIAL_BONUS);
  const [gratuityConfig, setGratuityConfig] = useState(INITIAL_GRATUITY);
  const [lwfConfig, setLWFConfig] = useState(INITIAL_LWF);
  const [lwfRules, setLWFRules] = useState([]);

  // Filtering states for PT & LWF tables
  const [selectedPTState, setSelectedPTState] = useState('All States');
  const [ptSearch, setPTSearch] = useState('');
  const [selectedLWFState, setSelectedLWFState] = useState('All States');

  // Modals & UI States
  const [isPTSlabModalOpen, setIsPTSlabModalOpen] = useState(false);
  const [editingPTSlab, setEditingPTSlab] = useState(null);

  const [isLWFModalOpen, setIsLWFModalOpen] = useState(false);
  const [editingLWFRule, setEditingLWFRule] = useState(null);

  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    description: '',
    confirmLabel: '',
    variant: 'danger',
    moduleKey: null,
    targetState: null
  });

  const [toast, setToast] = useState({ message: '', type: 'success' });
  const showToast = (message, type = 'success') => setToast({ message, type });

  // Fetch dynamic statutory configuration from MongoDB
  const fetchStatutoryConfig = useCallback(async () => {
    try {
      setIsLoading(true);
      const config = await statutoryService.getStatutoryConfig(compId);
      if (config) {
        if (config.pf) setPFConfig(config.pf);
        if (config.esi) setESIConfig(config.esi);
        if (config.pt) setPTConfig(config.pt);
        if (Array.isArray(config.ptSlabs)) setPTSlabs(config.ptSlabs);
        if (config.tds) setTDSConfig(config.tds);
        if (config.bonus) setBonusConfig(config.bonus);
        if (config.gratuity) setGratuityConfig(config.gratuity);
        if (config.lwf) setLWFConfig(config.lwf);
        if (Array.isArray(config.lwfRules)) setLWFRules(config.lwfRules);
      }
    } catch (err) {
      console.error('Failed to load statutory config from database:', err);
      showToast('Failed to load statutory configuration.', 'danger');
    } finally {
      setIsLoading(false);
    }
  }, [compId]);

  useEffect(() => {
    fetchStatutoryConfig();
  }, [fetchStatutoryConfig]);

  // Toggle Module Enable / Disable in MongoDB
  const triggerModuleToggle = (moduleKey, currentStatus) => {
    const nextStatus = !currentStatus;
    const moduleName = TABS.find(t => t.id === moduleKey)?.name || moduleKey.toUpperCase();

    if (!nextStatus) {
      // Confirm before disabling
      setConfirmModal({
        isOpen: true,
        title: `Disable ${moduleName}?`,
        description: `Are you sure you want to disable ${moduleName}? Once disabled, statutory deductions for ${moduleName} will not be processed in upcoming payroll cycles.`,
        confirmLabel: 'Disable Module',
        variant: 'danger',
        moduleKey,
        targetState: false
      });
    } else {
      applyModuleToggle(moduleKey, true);
    }
  };

  const applyModuleToggle = async (moduleKey, enabled) => {
    try {
      setIsSaving(true);
      const res = await statutoryService.toggleModule(compId, moduleKey, enabled);
      if (res?.config) {
        if (res.config[moduleKey]) {
          if (moduleKey === 'pf') setPFConfig(res.config.pf);
          else if (moduleKey === 'esi') setESIConfig(res.config.esi);
          else if (moduleKey === 'pt') setPTConfig(res.config.pt);
          else if (moduleKey === 'tds') setTDSConfig(res.config.tds);
          else if (moduleKey === 'bonus') setBonusConfig(res.config.bonus);
          else if (moduleKey === 'gratuity') setGratuityConfig(res.config.gratuity);
          else if (moduleKey === 'lwf') setLWFConfig(res.config.lwf);
        }
      }
      showToast(`✓ ${moduleKey.toUpperCase()} configuration ${enabled ? 'enabled' : 'disabled'} successfully.`);
    } catch (err) {
      showToast(`Failed to update module status: ${err.message}`, 'danger');
    } finally {
      setIsSaving(false);
      setConfirmModal(prev => ({ ...prev, isOpen: false }));
    }
  };

  // General Module Save Handlers
  const handleSaveModule = async (e, moduleKey, moduleData, successMessage) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      const res = await statutoryService.updateModule(compId, moduleKey, moduleData);
      if (res?.config && res.config[moduleKey]) {
        if (moduleKey === 'pf') setPFConfig(res.config.pf);
        else if (moduleKey === 'esi') setESIConfig(res.config.esi);
        else if (moduleKey === 'pt') setPTConfig(res.config.pt);
        else if (moduleKey === 'tds') setTDSConfig(res.config.tds);
        else if (moduleKey === 'bonus') setBonusConfig(res.config.bonus);
        else if (moduleKey === 'gratuity') setGratuityConfig(res.config.gratuity);
        else if (moduleKey === 'lwf') setLWFConfig(res.config.lwf);
      }
      showToast(successMessage || `✓ ${moduleKey.toUpperCase()} settings saved successfully.`);
    } catch (err) {
      showToast(`Failed to save settings: ${err.message}`, 'danger');
    } finally {
      setIsSaving(false);
    }
  };

  // PT Slabs Filtering
  const filteredPTSlabs = ptSlabs.filter(s => {
    const matchesState = selectedPTState === 'All States' || s.state === selectedPTState;
    const matchesSearch = !ptSearch.trim() || 
      s.state.toLowerCase().includes(ptSearch.toLowerCase()) ||
      String(s.taxAmount).includes(ptSearch);
    return matchesState && matchesSearch;
  });

  const ptStatesList = ['All States', ...new Set(ptSlabs.map(s => s.state))];

  // PT Slab Submissions directly to MongoDB
  const handlePTSlabSubmit = async (formData) => {
    try {
      setIsSaving(true);
      const payload = {
        id: editingPTSlab?.id,
        ...formData
      };
      const res = await statutoryService.savePTSlab(compId, payload);
      if (res?.ptSlabs) {
        setPTSlabs(res.ptSlabs);
      }
      showToast(editingPTSlab ? '✓ Professional Tax slab updated successfully.' : '✓ New Professional Tax slab added successfully.');
      setIsPTSlabModalOpen(false);
      setEditingPTSlab(null);
    } catch (err) {
      showToast(`Failed to save PT slab: ${err.message}`, 'danger');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeletePTSlab = async (slabId) => {
    try {
      setIsSaving(true);
      const res = await statutoryService.deletePTSlab(compId, slabId);
      if (res?.ptSlabs) {
        setPTSlabs(res.ptSlabs);
      }
      showToast('✓ PT Slab removed.');
    } catch (err) {
      showToast(`Failed to delete PT slab: ${err.message}`, 'danger');
    } finally {
      setIsSaving(false);
    }
  };

  // LWF Submissions directly to MongoDB
  const handleLWFSubmit = async (formData) => {
    try {
      setIsSaving(true);
      const payload = {
        id: editingLWFRule?.id,
        ...formData
      };
      const res = await statutoryService.saveLWFRule(compId, payload);
      if (res?.lwfRules) {
        setLWFRules(res.lwfRules);
      }
      showToast(editingLWFRule ? '✓ LWF State rule updated.' : '✓ New LWF State rule added.');
      setIsLWFModalOpen(false);
      setEditingLWFRule(null);
    } catch (err) {
      showToast(`Failed to save LWF rule: ${err.message}`, 'danger');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteLWFRule = async (ruleId) => {
    try {
      setIsSaving(true);
      const res = await statutoryService.deleteLWFRule(compId, ruleId);
      if (res?.lwfRules) {
        setLWFRules(res.lwfRules);
      }
      showToast('✓ LWF rule removed.');
    } catch (err) {
      showToast(`Failed to delete LWF rule: ${err.message}`, 'danger');
    } finally {
      setIsSaving(false);
    }
  };

  const lwfStatesList = ['All States', ...new Set(lwfRules.map(r => r.state))];
  const filteredLWFRules = lwfRules.filter(r => 
    selectedLWFState === 'All States' || r.state === selectedLWFState
  );

  return (
    <AdminLayout>
      <div className={styles.container}>
        {/* Toast Alert */}
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ message: '', type: 'success' })}
        />

        {/* PT Slab Modal */}
        <PTSlabModal
          isOpen={isPTSlabModalOpen}
          onClose={() => { setIsPTSlabModalOpen(false); setEditingPTSlab(null); }}
          onSubmit={handlePTSlabSubmit}
          editingItem={editingPTSlab}
          selectedState={selectedPTState !== 'All States' ? selectedPTState : 'Maharashtra'}
        />

        {/* LWF Modal */}
        <LWFStateModal
          isOpen={isLWFModalOpen}
          onClose={() => { setIsLWFModalOpen(false); setEditingLWFRule(null); }}
          onSubmit={handleLWFSubmit}
          editingItem={editingLWFRule}
        />

        {/* Disable Confirmation Modal */}
        <ConfirmModal
          isOpen={confirmModal.isOpen}
          title={confirmModal.title}
          description={confirmModal.description}
          confirmLabel={confirmModal.confirmLabel}
          variant={confirmModal.variant}
          onConfirm={() => applyModuleToggle(confirmModal.moduleKey, confirmModal.targetState)}
          onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        />

        {/* Breadcrumbs */}
        <div className={styles.breadcrumb} role="navigation" aria-label="Breadcrumb">
          <span className={styles.crumbLink} onClick={() => navigate('/admin/dashboard')}>
            Dashboard
          </span>
          <span className={styles.separator}>/</span>
          <span className={styles.crumbLink} onClick={() => navigate('/admin/payroll-setup')}>
            Payroll Setup
          </span>
          <span className={styles.separator}>/</span>
          <span className={styles.crumbActive}>Statutory Setup</span>
        </div>

        {/* Page Header */}
        <header className={styles.header}>
          <div className={styles.titleArea}>
            <div className={styles.titleWithBadge}>
              <h1 className={styles.title}>Statutory Setup</h1>
              <span className={styles.complianceBadge}>Compliance & Statutory Rules</span>
            </div>
            <p className={styles.description}>
              Configure statutory deductions, employee contributions, state tax slabs and compliance calculation rules.
            </p>
          </div>

          {!isFromOrgSettings && (
            <div className={styles.headerActions}>
              <button
                type="button"
                className={styles.mastersLinkBtn}
                onClick={() => navigate('/admin/masters')}
                title="View Salary Components in Masters"
              >
                <span>Masters Components</span>
                <ArrowUpRight size={15} />
              </button>
            </div>
          )}
        </header>

        {isLoading ? (
          <div className={styles.loadingState}>
            <Loader2 size={32} className="spin" style={{ animation: 'spin 1s linear infinite' }} />
            <span>Loading statutory configuration...</span>
          </div>
        ) : (
          <>
            {/* TAB 0: OVERVIEW LANDING VIEW */}
            {activeTab === 'overview' && (
              <div className={styles.overviewContainer}>
                <div className={styles.overviewGrid}>
                  {/* 1. PF Card */}
                  <div className={`${styles.moduleCard} ${pfConfig.enabled ? styles.cardActive : styles.cardDisabled}`}>
                    <div className={styles.cardHeader}>
                      <h3 className={styles.moduleName}>Provident Fund (PF)</h3>
                      <div className={styles.statusToggleWrap}>
                        <button
                          type="button"
                          className={styles.toggleBtn}
                          onClick={() => triggerModuleToggle('pf', pfConfig.enabled)}
                          disabled={isSaving}
                          title={pfConfig.enabled ? 'Click to Disable' : 'Click to Enable'}
                        >
                          {pfConfig.enabled ? <ToggleRight size={24} color="#10b981" /> : <ToggleLeft size={24} color="#94a3b8" />}
                        </button>
                        <span className={`${styles.statusPill} ${pfConfig.enabled ? styles.pillActive : styles.pillDisabled}`}>
                          {pfConfig.enabled ? 'Enabled' : 'Disabled'}
                        </span>
                      </div>
                    </div>
                    <p className={styles.moduleSub}>Employee & Employer EPF contributions with wage ceiling limits</p>
                    <div className={styles.cardMetric}>
                      <span className={styles.metricLabel}>Contribution:</span>
                      <span className={styles.metricVal}>{pfConfig.employeeContribution}% (Emp) / {pfConfig.employerContribution}% (Empr)</span>
                    </div>
                    <div className={styles.cardFooter}>
                      <span className={styles.effectiveText}>Effective: {pfConfig.effectiveDate}</span>
                      <button type="button" className={styles.configureBtn} onClick={() => handleTabChange('pf')}>
                        <span>Configure</span>
                        <ArrowRight size={14} />
                      </button>
                    </div>
                  </div>

                  {/* 2. ESI Card */}
                  <div className={`${styles.moduleCard} ${esiConfig.enabled ? styles.cardActive : styles.cardDisabled}`}>
                    <div className={styles.cardHeader}>
                      <h3 className={styles.moduleName}>Employee State Insurance (ESI)</h3>
                      <div className={styles.statusToggleWrap}>
                        <button
                          type="button"
                          className={styles.toggleBtn}
                          onClick={() => triggerModuleToggle('esi', esiConfig.enabled)}
                          disabled={isSaving}
                        >
                          {esiConfig.enabled ? <ToggleRight size={24} color="#10b981" /> : <ToggleLeft size={24} color="#94a3b8" />}
                        </button>
                        <span className={`${styles.statusPill} ${esiConfig.enabled ? styles.pillActive : styles.pillDisabled}`}>
                          {esiConfig.enabled ? 'Enabled' : 'Disabled'}
                        </span>
                      </div>
                    </div>
                    <p className={styles.moduleSub}>Healthcare insurance for employees drawing gross wages up to ₹21,000</p>
                    <div className={styles.cardMetric}>
                      <span className={styles.metricLabel}>Contribution:</span>
                      <span className={styles.metricVal}>{esiConfig.employeeContribution}% (Emp) / {esiConfig.employerContribution}% (Empr)</span>
                    </div>
                    <div className={styles.cardFooter}>
                      <span className={styles.effectiveText}>Effective: {esiConfig.effectiveDate}</span>
                      <button type="button" className={styles.configureBtn} onClick={() => handleTabChange('esi')}>
                        <span>Configure</span>
                        <ArrowRight size={14} />
                      </button>
                    </div>
                  </div>

                  {/* 3. PT Card */}
                  <div className={`${styles.moduleCard} ${ptConfig.enabled ? styles.cardActive : styles.cardDisabled}`}>
                    <div className={styles.cardHeader}>
                      <h3 className={styles.moduleName}>Professional Tax (PT)</h3>
                      <div className={styles.statusToggleWrap}>
                        <button
                          type="button"
                          className={styles.toggleBtn}
                          onClick={() => triggerModuleToggle('pt', ptConfig.enabled)}
                          disabled={isSaving}
                        >
                          {ptConfig.enabled ? <ToggleRight size={24} color="#10b981" /> : <ToggleLeft size={24} color="#94a3b8" />}
                        </button>
                        <span className={`${styles.statusPill} ${ptConfig.enabled ? styles.pillActive : styles.pillDisabled}`}>
                          {ptConfig.enabled ? 'Enabled' : 'Disabled'}
                        </span>
                      </div>
                    </div>
                    <p className={styles.moduleSub}>State-specific tax slabs applied to monthly gross earnings</p>
                    <div className={styles.cardMetric}>
                      <span className={styles.metricLabel}>Configured:</span>
                      <span className={styles.metricVal}>{ptSlabs.length} Slabs across {ptStatesList.length - 1} States</span>
                    </div>
                    <div className={styles.cardFooter}>
                      <span className={styles.effectiveText}>Effective: {ptConfig.effectiveDate}</span>
                      <button type="button" className={styles.configureBtn} onClick={() => handleTabChange('pt')}>
                        <span>Configure</span>
                        <ArrowRight size={14} />
                      </button>
                    </div>
                  </div>

                  {/* 4. TDS Card */}
                  <div className={`${styles.moduleCard} ${tdsConfig.enabled ? styles.cardActive : styles.cardDisabled}`}>
                    <div className={styles.cardHeader}>
                      <h3 className={styles.moduleName}>Tax Deducted at Source (TDS)</h3>
                      <div className={styles.statusToggleWrap}>
                        <button
                          type="button"
                          className={styles.toggleBtn}
                          onClick={() => triggerModuleToggle('tds', tdsConfig.enabled)}
                          disabled={isSaving}
                        >
                          {tdsConfig.enabled ? <ToggleRight size={24} color="#10b981" /> : <ToggleLeft size={24} color="#94a3b8" />}
                        </button>
                        <span className={`${styles.statusPill} ${tdsConfig.enabled ? styles.pillActive : styles.pillDisabled}`}>
                          {tdsConfig.enabled ? 'Enabled' : 'Disabled'}
                        </span>
                      </div>
                    </div>
                    <p className={styles.moduleSub}>Income tax withholding regimes, standard deductions, and declaration workflows</p>
                    <div className={styles.cardMetric}>
                      <span className={styles.metricLabel}>Regime:</span>
                      <span className={styles.metricVal}>{tdsConfig.defaultTaxRegime} ({tdsConfig.effectiveFinancialYear})</span>
                    </div>
                    <div className={styles.cardFooter}>
                      <span className={styles.effectiveText}>Std Ded: ₹{tdsConfig.standardDeductionNewRegime.toLocaleString()}</span>
                      <button type="button" className={styles.configureBtn} onClick={() => handleTabChange('tds')}>
                        <span>Configure</span>
                        <ArrowRight size={14} />
                      </button>
                    </div>
                  </div>

                  {/* 5. Bonus Card */}
                  <div className={`${styles.moduleCard} ${bonusConfig.enabled ? styles.cardActive : styles.cardDisabled}`}>
                    <div className={styles.cardHeader}>
                      <h3 className={styles.moduleName}>Statutory Bonus</h3>
                      <div className={styles.statusToggleWrap}>
                        <button
                          type="button"
                          className={styles.toggleBtn}
                          onClick={() => triggerModuleToggle('bonus', bonusConfig.enabled)}
                          disabled={isSaving}
                        >
                          {bonusConfig.enabled ? <ToggleRight size={24} color="#10b981" /> : <ToggleLeft size={24} color="#94a3b8" />}
                        </button>
                        <span className={`${styles.statusPill} ${bonusConfig.enabled ? styles.pillActive : styles.pillDisabled}`}>
                          {bonusConfig.enabled ? 'Enabled' : 'Disabled'}
                        </span>
                      </div>
                    </div>
                    <p className={styles.moduleSub}>Payment of Bonus Act compliance rates, wage ceiling, and eligibility rules</p>
                    <div className={styles.cardMetric}>
                      <span className={styles.metricLabel}>Rate:</span>
                      <span className={styles.metricVal}>{bonusConfig.bonusPercentage}% (Min 8.33% - Max 20%)</span>
                    </div>
                    <div className={styles.cardFooter}>
                      <span className={styles.effectiveText}>Ceiling: ₹{bonusConfig.statutoryWageCeiling.toLocaleString()}</span>
                      <button type="button" className={styles.configureBtn} onClick={() => handleTabChange('bonus')}>
                        <span>Configure</span>
                        <ArrowRight size={14} />
                      </button>
                    </div>
                  </div>

                  {/* 6. Gratuity Card */}
                  <div className={`${styles.moduleCard} ${gratuityConfig.enabled ? styles.cardActive : styles.cardDisabled}`}>
                    <div className={styles.cardHeader}>
                      <h3 className={styles.moduleName}>Gratuity</h3>
                      <div className={styles.statusToggleWrap}>
                        <button
                          type="button"
                          className={styles.toggleBtn}
                          onClick={() => triggerModuleToggle('gratuity', gratuityConfig.enabled)}
                          disabled={isSaving}
                        >
                          {gratuityConfig.enabled ? <ToggleRight size={24} color="#10b981" /> : <ToggleLeft size={24} color="#94a3b8" />}
                        </button>
                        <span className={`${styles.statusPill} ${gratuityConfig.enabled ? styles.pillActive : styles.pillDisabled}`}>
                          {gratuityConfig.enabled ? 'Enabled' : 'Disabled'}
                        </span>
                      </div>
                    </div>
                    <p className={styles.moduleSub}>Payment of Gratuity Act rules for employee retirement and separation</p>
                    <div className={styles.cardMetric}>
                      <span className={styles.metricLabel}>Eligibility:</span>
                      <span className={styles.metricVal}>{gratuityConfig.eligibilityYears} Years Continuous Service</span>
                    </div>
                    <div className={styles.cardFooter}>
                      <span className={styles.effectiveText}>Basis: {gratuityConfig.calculationBasis}</span>
                      <button type="button" className={styles.configureBtn} onClick={() => handleTabChange('gratuity')}>
                        <span>Configure</span>
                        <ArrowRight size={14} />
                      </button>
                    </div>
                  </div>

                  {/* 7. LWF Card */}
                  <div className={`${styles.moduleCard} ${lwfConfig.enabled ? styles.cardActive : styles.cardDisabled}`}>
                    <div className={styles.cardHeader}>
                      <h3 className={styles.moduleName}>Labour Welfare Fund (LWF)</h3>
                      <div className={styles.statusToggleWrap}>
                        <button
                          type="button"
                          className={styles.toggleBtn}
                          onClick={() => triggerModuleToggle('lwf', lwfConfig.enabled)}
                          disabled={isSaving}
                        >
                          {lwfConfig.enabled ? <ToggleRight size={24} color="#10b981" /> : <ToggleLeft size={24} color="#94a3b8" />}
                        </button>
                        <span className={`${styles.statusPill} ${lwfConfig.enabled ? styles.pillActive : styles.pillDisabled}`}>
                          {lwfConfig.enabled ? 'Enabled' : 'Disabled'}
                        </span>
                      </div>
                    </div>
                    <p className={styles.moduleSub}>State-mandated welfare fund contributions and deduction frequency rules</p>
                    <div className={styles.cardMetric}>
                      <span className={styles.metricLabel}>Rules:</span>
                      <span className={styles.metricVal}>{lwfRules.length} Active State Rules</span>
                    </div>
                    <div className={styles.cardFooter}>
                      <span className={styles.effectiveText}>Effective: {lwfConfig.effectiveDate}</span>
                      <button type="button" className={styles.configureBtn} onClick={() => handleTabChange('lwf')}>
                        <span>Configure</span>
                        <ArrowRight size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 1: PF CONFIGURATION */}
            {activeTab === 'pf' && (
              <div className={styles.configContainer}>
                <div className={styles.configHeader}>
                  <div>
                    <h2 className={styles.configTitle}>Provident Fund (PF) Settings</h2>
                    <p className={styles.configSub}>Configure employee and employer EPF contribution percentages and ceiling bounds</p>
                  </div>
                  <div className={styles.toggleControl}>
                    <span className={styles.toggleLabel}>Module Status:</span>
                    <button
                      type="button"
                      className={styles.toggleBtn}
                      onClick={() => triggerModuleToggle('pf', pfConfig.enabled)}
                      disabled={isSaving}
                    >
                      {pfConfig.enabled ? <ToggleRight size={28} color="#10b981" /> : <ToggleLeft size={28} color="#94a3b8" />}
                    </button>
                    <StatusBadge status={pfConfig.enabled ? 'active' : 'inactive'} />
                  </div>
                </div>

                <form
                  onSubmit={(e) => handleSaveModule(e, 'pf', pfConfig, '✓ PF configuration saved successfully.')}
                  className={styles.configForm}
                >
                  <div className={styles.formGrid}>
                    <div className={styles.field}>
                      <label className={styles.label}>Employee Contribution (%) <span className={styles.required}>*</span></label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        className={styles.input}
                        value={pfConfig.employeeContribution}
                        onChange={(e) => setPFConfig({ ...pfConfig, employeeContribution: Number(e.target.value) })}
                        required
                      />
                      <span className={styles.fieldHint}>Standard statutory deduction is 12% of Basic + DA</span>
                    </div>

                    <div className={styles.field}>
                      <label className={styles.label}>Employer Contribution (%) <span className={styles.required}>*</span></label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        className={styles.input}
                        value={pfConfig.employerContribution}
                        onChange={(e) => setPFConfig({ ...pfConfig, employerContribution: Number(e.target.value) })}
                        required
                      />
                      <span className={styles.fieldHint}>Split: 8.33% EPS (Pension) + 3.67% EPF</span>
                    </div>

                    <div className={styles.field}>
                      <label className={styles.label}>PF Wage Ceiling (₹) <span className={styles.required}>*</span></label>
                      <input
                        type="number"
                        min="0"
                        className={styles.input}
                        value={pfConfig.wageCeiling}
                        onChange={(e) => setPFConfig({ ...pfConfig, wageCeiling: Number(e.target.value) })}
                        required
                      />
                      <span className={styles.fieldHint}>Statutory ceiling limit (Default ₹15,000)</span>
                    </div>

                    <div className={styles.field}>
                      <label className={styles.label}>Effective From Date <span className={styles.required}>*</span></label>
                      <input
                        type="date"
                        className={styles.input}
                        value={pfConfig.effectiveDate}
                        onChange={(e) => setPFConfig({ ...pfConfig, effectiveDate: e.target.value })}
                        required
                      />
                      <span className={styles.fieldHint}>Date from which this configuration takes effect</span>
                    </div>

                    <div className={styles.field}>
                      <label className={styles.label}>Voluntary Provident Fund (VPF)</label>
                      <select
                        className={styles.select}
                        value={pfConfig.allowVPF ? 'true' : 'false'}
                        onChange={(e) => setPFConfig({ ...pfConfig, allowVPF: e.target.value === 'true' })}
                      >
                        <option value="true">Allowed (Employees can contribute beyond 12%)</option>
                        <option value="false">Disabled</option>
                      </select>
                    </div>

                    <div className={styles.field}>
                      <label className={styles.label}>Restrict PF to Wage Ceiling</label>
                      <select
                        className={styles.select}
                        value={pfConfig.wageCeilingRestricted ? 'true' : 'false'}
                        onChange={(e) => setPFConfig({ ...pfConfig, wageCeilingRestricted: e.target.value === 'true' })}
                      >
                        <option value="true">Yes (Calculate maximum on ₹15,000)</option>
                        <option value="false">No (Calculate on actual earned basic)</option>
                      </select>
                    </div>
                  </div>

                  {/* Audit Info */}
                  <div className={styles.auditBar}>
                    <span>Created: {pfConfig.createdDate} by {pfConfig.createdBy}</span>
                    <span>Last Updated: {pfConfig.lastUpdatedDate} by {pfConfig.lastUpdatedBy}</span>
                  </div>

                  <div className={styles.formActions}>
                    <button type="submit" className={styles.saveBtn} disabled={isSaving}>
                      <Save size={16} />
                      <span>{isSaving ? 'Saving...' : 'Save PF Settings'}</span>
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* TAB 2: ESI CONFIGURATION */}
            {activeTab === 'esi' && (
              <div className={styles.configContainer}>
                <div className={styles.configHeader}>
                  <div>
                    <h2 className={styles.configTitle}>Employee State Insurance (ESI) Settings</h2>
                    <p className={styles.configSub}>Configure healthcare contribution percentages and wage eligibility thresholds</p>
                  </div>
                  <div className={styles.toggleControl}>
                    <span className={styles.toggleLabel}>Module Status:</span>
                    <button
                      type="button"
                      className={styles.toggleBtn}
                      onClick={() => triggerModuleToggle('esi', esiConfig.enabled)}
                      disabled={isSaving}
                    >
                      {esiConfig.enabled ? <ToggleRight size={28} color="#10b981" /> : <ToggleLeft size={28} color="#94a3b8" />}
                    </button>
                    <StatusBadge status={esiConfig.enabled ? 'active' : 'inactive'} />
                  </div>
                </div>

                <form
                  onSubmit={(e) => handleSaveModule(e, 'esi', esiConfig, '✓ ESI configuration saved successfully.')}
                  className={styles.configForm}
                >
                  <div className={styles.formGrid}>
                    <div className={styles.field}>
                      <label className={styles.label}>Employee Contribution (%) <span className={styles.required}>*</span></label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        className={styles.input}
                        value={esiConfig.employeeContribution}
                        onChange={(e) => setESIConfig({ ...esiConfig, employeeContribution: Number(e.target.value) })}
                        required
                      />
                      <span className={styles.fieldHint}>Statutory rate is 0.75% of Gross Wages</span>
                    </div>

                    <div className={styles.field}>
                      <label className={styles.label}>Employer Contribution (%) <span className={styles.required}>*</span></label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        className={styles.input}
                        value={esiConfig.employerContribution}
                        onChange={(e) => setESIConfig({ ...esiConfig, employerContribution: Number(e.target.value) })}
                        required
                      />
                      <span className={styles.fieldHint}>Statutory rate is 3.25% of Gross Wages</span>
                    </div>

                    <div className={styles.field}>
                      <label className={styles.label}>Salary / Wage Eligibility Limit (₹) <span className={styles.required}>*</span></label>
                      <input
                        type="number"
                        min="0"
                        className={styles.input}
                        value={esiConfig.wageEligibilityLimit}
                        onChange={(e) => setESIConfig({ ...esiConfig, wageEligibilityLimit: Number(e.target.value) })}
                        required
                      />
                      <span className={styles.fieldHint}>Employees with gross salary up to ₹21,000 are covered</span>
                    </div>

                    <div className={styles.field}>
                      <label className={styles.label}>Disability Wage Limit (₹)</label>
                      <input
                        type="number"
                        min="0"
                        className={styles.input}
                        value={esiConfig.disabilityWageLimit}
                        onChange={(e) => setESIConfig({ ...esiConfig, disabilityWageLimit: Number(e.target.value) })}
                      />
                      <span className={styles.fieldHint}>Special limit for persons with disabilities (₹25,000)</span>
                    </div>

                    <div className={styles.field}>
                      <label className={styles.label}>Effective From Date <span className={styles.required}>*</span></label>
                      <input
                        type="date"
                        className={styles.input}
                        value={esiConfig.effectiveDate}
                        onChange={(e) => setESIConfig({ ...esiConfig, effectiveDate: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className={styles.infoAlert}>
                    <HelpCircle size={18} />
                    <span>
                      <strong>Note:</strong> ESI deduction is computed on gross earned wage (excluding annual bonus and overtime). If an employee's daily wage is under ₹176, employee contribution is exempted.
                    </span>
                  </div>

                  {/* Audit Info */}
                  <div className={styles.auditBar}>
                    <span>Created: {esiConfig.createdDate} by {esiConfig.createdBy}</span>
                    <span>Last Updated: {esiConfig.lastUpdatedDate} by {esiConfig.lastUpdatedBy}</span>
                  </div>

                  <div className={styles.formActions}>
                    <button type="submit" className={styles.saveBtn} disabled={isSaving}>
                      <Save size={16} />
                      <span>{isSaving ? 'Saving...' : 'Save ESI Settings'}</span>
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* TAB 3: PT SLABS CONFIGURATION */}
            {activeTab === 'pt' && (
              <div className={styles.configContainer}>
                <div className={styles.configHeader}>
                  <div>
                    <h2 className={styles.configTitle}>Professional Tax (PT) Slabs</h2>
                    <p className={styles.configSub}>State-wise salary range slabs and monthly tax deduction amounts</p>
                  </div>
                  <div className={styles.toggleControl}>
                    <span className={styles.toggleLabel}>Module Status:</span>
                    <button
                      type="button"
                      className={styles.toggleBtn}
                      onClick={() => triggerModuleToggle('pt', ptConfig.enabled)}
                      disabled={isSaving}
                    >
                      {ptConfig.enabled ? <ToggleRight size={28} color="#10b981" /> : <ToggleLeft size={28} color="#94a3b8" />}
                    </button>
                    <StatusBadge status={ptConfig.enabled ? 'active' : 'inactive'} />
                  </div>
                </div>

                {/* Toolbar */}
                <div className={styles.ptToolbar}>
                  <div className={styles.ptFilters}>
                    <div className={styles.stateSelectWrap}>
                      <label className={styles.miniLabel}>Filter by State:</label>
                      <select
                        className={styles.stateSelect}
                        value={selectedPTState}
                        onChange={(e) => setSelectedPTState(e.target.value)}
                      >
                        {ptStatesList.map(st => (
                          <option key={st} value={st}>{st}</option>
                        ))}
                      </select>
                    </div>

                    <div className={styles.ptSearchWrap}>
                      <Search size={16} className={styles.searchIcon} />
                      <input
                        type="text"
                        className={styles.ptSearchInput}
                        placeholder="Search state or tax amount..."
                        value={ptSearch}
                        onChange={(e) => setPTSearch(e.target.value)}
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    className={styles.addSlabBtn}
                    onClick={() => { setEditingPTSlab(null); setIsPTSlabModalOpen(true); }}
                  >
                    <Plus size={16} />
                    <span>Add PT Slab</span>
                  </button>
                </div>

                {/* Slabs Table */}
                <div className={styles.tableCard}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>State</th>
                        <th>Salary Range (₹)</th>
                        <th>Monthly Tax Amount</th>
                        <th>February Special Rate</th>
                        <th>Effective Date</th>
                        <th>Status</th>
                        <th className={styles.textCenter}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPTSlabs.length === 0 ? (
                        <tr>
                          <td colSpan={7} style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                            No Professional Tax slabs configured for the selected filter.
                          </td>
                        </tr>
                      ) : (
                        filteredPTSlabs.map((slab) => (
                          <tr key={slab.id}>
                            <td><span className={styles.stateBadge}>{slab.state}</span></td>
                            <td>
                              <span className={styles.rangeText}>
                                ₹{slab.minSalary.toLocaleString()} - {slab.maxSalary >= 9999999 ? 'Above' : `₹${slab.maxSalary.toLocaleString()}`}
                              </span>
                            </td>
                            <td>
                              <span className={styles.taxAmountVal}>
                                {slab.taxAmount === 0 ? 'Exempt (₹0)' : `₹${slab.taxAmount} / month`}
                              </span>
                            </td>
                            <td>
                              <span className={styles.febText}>
                                {slab.februaryTaxAmount ? `₹${slab.februaryTaxAmount} (Feb)` : 'Same as Regular'}
                              </span>
                            </td>
                            <td><span className={styles.dateText}>{slab.effectiveFrom}</span></td>
                            <td><StatusBadge status={slab.status} /></td>
                            <td className={styles.textCenter}>
                              <div style={{ display: 'inline-flex', gap: '8px' }}>
                                <button
                                  type="button"
                                  className={styles.editIconBtn}
                                  title="Edit Slab"
                                  onClick={() => { setEditingPTSlab(slab); setIsPTSlabModalOpen(true); }}
                                >
                                  <Edit2 size={14} />
                                </button>
                                <button
                                  type="button"
                                  className={styles.deleteIconBtn}
                                  title="Delete Slab"
                                  onClick={() => handleDeletePTSlab(slab.id)}
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 4: TDS CONFIGURATION */}
            {activeTab === 'tds' && (
              <div className={styles.configContainer}>
                <div className={styles.configHeader}>
                  <div>
                    <h2 className={styles.configTitle}>Tax Deducted at Source (TDS) Settings</h2>
                    <p className={styles.configSub}>Income tax withholding regimes, standard deductions, and declaration workflows</p>
                  </div>
                  <div className={styles.toggleControl}>
                    <span className={styles.toggleLabel}>Module Status:</span>
                    <button
                      type="button"
                      className={styles.toggleBtn}
                      onClick={() => triggerModuleToggle('tds', tdsConfig.enabled)}
                      disabled={isSaving}
                    >
                      {tdsConfig.enabled ? <ToggleRight size={28} color="#10b981" /> : <ToggleLeft size={28} color="#94a3b8" />}
                    </button>
                    <StatusBadge status={tdsConfig.enabled ? 'active' : 'inactive'} />
                  </div>
                </div>

                <form
                  onSubmit={(e) => handleSaveModule(e, 'tds', tdsConfig, '✓ TDS configuration saved successfully.')}
                  className={styles.configForm}
                >
                  <div className={styles.formGrid}>
                    <div className={styles.field}>
                      <label className={styles.label}>Default Tax Regime <span className={styles.required}>*</span></label>
                      <select
                        className={styles.select}
                        value={tdsConfig.defaultTaxRegime}
                        onChange={(e) => setTDSConfig({ ...tdsConfig, defaultTaxRegime: e.target.value })}
                      >
                        <option value="New Regime">New Tax Regime (Section 115BAC - Default)</option>
                        <option value="Old Regime">Old Tax Regime (With Chapter VI-A Deductions)</option>
                      </select>
                      <span className={styles.fieldHint}>Employees can optionally switch regime in declarations</span>
                    </div>

                    <div className={styles.field}>
                      <label className={styles.label}>Effective Financial Year <span className={styles.required}>*</span></label>
                      <select
                        className={styles.select}
                        value={tdsConfig.effectiveFinancialYear}
                        onChange={(e) => setTDSConfig({ ...tdsConfig, effectiveFinancialYear: e.target.value })}
                      >
                        <option value="2026-2027">FY 2026-2027 (AY 2027-2028)</option>
                        <option value="2025-2026">FY 2025-2026 (AY 2026-2027)</option>
                      </select>
                    </div>

                    <div className={styles.field}>
                      <label className={styles.label}>Standard Deduction - New Regime (₹) <span className={styles.required}>*</span></label>
                      <input
                        type="number"
                        min="0"
                        className={styles.input}
                        value={tdsConfig.standardDeductionNewRegime}
                        onChange={(e) => setTDSConfig({ ...tdsConfig, standardDeductionNewRegime: Number(e.target.value) })}
                        required
                      />
                      <span className={styles.fieldHint}>Budget 2024 revised standard deduction is ₹75,000</span>
                    </div>

                    <div className={styles.field}>
                      <label className={styles.label}>Standard Deduction - Old Regime (₹) <span className={styles.required}>*</span></label>
                      <input
                        type="number"
                        min="0"
                        className={styles.input}
                        value={tdsConfig.standardDeductionOldRegime}
                        onChange={(e) => setTDSConfig({ ...tdsConfig, standardDeductionOldRegime: Number(e.target.value) })}
                        required
                      />
                      <span className={styles.fieldHint}>Standard deduction under old regime is ₹50,000</span>
                    </div>

                    <div className={styles.field}>
                      <label className={styles.label}>Require Employee Investment Declaration</label>
                      <select
                        className={styles.select}
                        value={tdsConfig.investmentDeclarationRequired ? 'true' : 'false'}
                        onChange={(e) => setTDSConfig({ ...tdsConfig, investmentDeclarationRequired: e.target.value === 'true' })}
                      >
                        <option value="true">Yes (Enable 80C, 80D, HRA proof submissions)</option>
                        <option value="false">No (Direct TDS deduction on standard slabs)</option>
                      </select>
                    </div>

                    <div className={styles.field}>
                      <label className={styles.label}>Proof Submission Deadline</label>
                      <input
                        type="date"
                        className={styles.input}
                        value={tdsConfig.proofSubmissionDeadline}
                        onChange={(e) => setTDSConfig({ ...tdsConfig, proofSubmissionDeadline: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* Audit Info */}
                  <div className={styles.auditBar}>
                    <span>Last Updated: {tdsConfig.lastUpdatedDate} by {tdsConfig.lastUpdatedBy}</span>
                  </div>

                  <div className={styles.formActions}>
                    <button type="submit" className={styles.saveBtn} disabled={isSaving}>
                      <Save size={16} />
                      <span>{isSaving ? 'Saving...' : 'Save TDS Settings'}</span>
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* TAB 5: BONUS CONFIGURATION */}
            {activeTab === 'bonus' && (
              <div className={styles.configContainer}>
                <div className={styles.configHeader}>
                  <div>
                    <h2 className={styles.configTitle}>Statutory Bonus Settings</h2>
                    <p className={styles.configSub}>Payment of Bonus Act compliance rates, wage ceiling, and eligibility rules</p>
                  </div>
                  <div className={styles.toggleControl}>
                    <span className={styles.toggleLabel}>Module Status:</span>
                    <button
                      type="button"
                      className={styles.toggleBtn}
                      onClick={() => triggerModuleToggle('bonus', bonusConfig.enabled)}
                      disabled={isSaving}
                    >
                      {bonusConfig.enabled ? <ToggleRight size={28} color="#10b981" /> : <ToggleLeft size={28} color="#94a3b8" />}
                    </button>
                    <StatusBadge status={bonusConfig.enabled ? 'active' : 'inactive'} />
                  </div>
                </div>

                <form
                  onSubmit={(e) => handleSaveModule(e, 'bonus', bonusConfig, '✓ Bonus configuration saved successfully.')}
                  className={styles.configForm}
                >
                  <div className={styles.formGrid}>
                    <div className={styles.field}>
                      <label className={styles.label}>Calculation Method <span className={styles.required}>*</span></label>
                      <select
                        className={styles.select}
                        value={bonusConfig.calculationMethod}
                        onChange={(e) => setBonusConfig({ ...bonusConfig, calculationMethod: e.target.value })}
                      >
                        <option value="Percentage of Basic">Percentage of Basic Salary</option>
                        <option value="Fixed Amount">Fixed Amount per Employee</option>
                        <option value="Configured Amount">Configured Amount by Pay Group</option>
                      </select>
                    </div>

                    <div className={styles.field}>
                      <label className={styles.label}>Statutory Bonus Rate (%) <span className={styles.required}>*</span></label>
                      <input
                        type="number"
                        step="0.01"
                        min="8.33"
                        max="20"
                        className={styles.input}
                        value={bonusConfig.bonusPercentage}
                        onChange={(e) => setBonusConfig({ ...bonusConfig, bonusPercentage: Number(e.target.value) })}
                        required
                      />
                      <span className={styles.fieldHint}>Minimum statutory bonus is 8.33% (Max 20%)</span>
                    </div>

                    <div className={styles.field}>
                      <label className={styles.label}>Statutory Wage Ceiling (₹) <span className={styles.required}>*</span></label>
                      <input
                        type="number"
                        min="0"
                        className={styles.input}
                        value={bonusConfig.statutoryWageCeiling}
                        onChange={(e) => setBonusConfig({ ...bonusConfig, statutoryWageCeiling: Number(e.target.value) })}
                        required
                      />
                      <span className={styles.fieldHint}>Wage ceiling for bonus computation (₹7,000 or Minimum Wage)</span>
                    </div>

                    <div className={styles.field}>
                      <label className={styles.label}>Minimum Service Requirement (Days) <span className={styles.required}>*</span></label>
                      <input
                        type="number"
                        min="1"
                        className={styles.input}
                        value={bonusConfig.minimumServiceDays}
                        onChange={(e) => setBonusConfig({ ...bonusConfig, minimumServiceDays: Number(e.target.value) })}
                        required
                      />
                      <span className={styles.fieldHint}>Minimum 30 working days required in the accounting year</span>
                    </div>

                    <div className={styles.field}>
                      <label className={styles.label}>Disbursement Schedule</label>
                      <input
                        type="text"
                        className={styles.input}
                        value={bonusConfig.disbursementSchedule}
                        onChange={(e) => setBonusConfig({ ...bonusConfig, disbursementSchedule: e.target.value })}
                      />
                    </div>

                    <div className={styles.field}>
                      <label className={styles.label}>Effective From Date <span className={styles.required}>*</span></label>
                      <input
                        type="date"
                        className={styles.input}
                        value={bonusConfig.effectiveDate}
                        onChange={(e) => setBonusConfig({ ...bonusConfig, effectiveDate: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  {/* Audit Info */}
                  <div className={styles.auditBar}>
                    <span>Last Updated: {bonusConfig.lastUpdatedDate} by {bonusConfig.lastUpdatedBy}</span>
                  </div>

                  <div className={styles.formActions}>
                    <button type="submit" className={styles.saveBtn} disabled={isSaving}>
                      <Save size={16} />
                      <span>{isSaving ? 'Saving...' : 'Save Bonus Settings'}</span>
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* TAB 6: GRATUITY CONFIGURATION */}
            {activeTab === 'gratuity' && (
              <div className={styles.configContainer}>
                <div className={styles.configHeader}>
                  <div>
                    <h2 className={styles.configTitle}>Gratuity Configuration</h2>
                    <p className={styles.configSub}>Payment of Gratuity Act retirement benefit computation basis and eligibility</p>
                  </div>
                  <div className={styles.toggleControl}>
                    <span className={styles.toggleLabel}>Module Status:</span>
                    <button
                      type="button"
                      className={styles.toggleBtn}
                      onClick={() => triggerModuleToggle('gratuity', gratuityConfig.enabled)}
                      disabled={isSaving}
                    >
                      {gratuityConfig.enabled ? <ToggleRight size={28} color="#10b981" /> : <ToggleLeft size={28} color="#94a3b8" />}
                    </button>
                    <StatusBadge status={gratuityConfig.enabled ? 'active' : 'inactive'} />
                  </div>
                </div>

                <form
                  onSubmit={(e) => handleSaveModule(e, 'gratuity', gratuityConfig, '✓ Gratuity configuration saved successfully.')}
                  className={styles.configForm}
                >
                  <div className={styles.formGrid}>
                    <div className={styles.field}>
                      <label className={styles.label}>Eligibility Period (Years) <span className={styles.required}>*</span></label>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        className={styles.input}
                        value={gratuityConfig.eligibilityYears}
                        onChange={(e) => setGratuityConfig({ ...gratuityConfig, eligibilityYears: Number(e.target.value) })}
                        required
                      />
                      <span className={styles.fieldHint}>Statutory requirement is 5 years of continuous service</span>
                    </div>

                    <div className={styles.field}>
                      <label className={styles.label}>Calculation Basis <span className={styles.required}>*</span></label>
                      <select
                        className={styles.select}
                        value={gratuityConfig.calculationBasis}
                        onChange={(e) => setGratuityConfig({ ...gratuityConfig, calculationBasis: e.target.value })}
                      >
                        <option value="Basic + DA">Basic Salary + Dearness Allowance (DA)</option>
                        <option value="Basic Salary">Basic Salary Only</option>
                      </select>
                    </div>

                    <div className={styles.field}>
                      <label className={styles.label}>Maximum Tax Exemption Limit (₹) <span className={styles.required}>*</span></label>
                      <input
                        type="number"
                        min="0"
                        className={styles.input}
                        value={gratuityConfig.maximumTaxExemptionLimit}
                        onChange={(e) => setGratuityConfig({ ...gratuityConfig, maximumTaxExemptionLimit: Number(e.target.value) })}
                        required
                      />
                      <span className={styles.fieldHint}>Maximum tax-exempt ceiling is ₹20,00,000 (20 Lakhs)</span>
                    </div>

                    <div className={styles.field}>
                      <label className={styles.label}>Effective From Date <span className={styles.required}>*</span></label>
                      <input
                        type="date"
                        className={styles.input}
                        value={gratuityConfig.effectiveDate}
                        onChange={(e) => setGratuityConfig({ ...gratuityConfig, effectiveDate: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className={styles.formulaBanner}>
                    <span className={styles.formulaTitle}>Gratuity Formula:</span>
                    <code className={styles.formulaCode}>{gratuityConfig.formulaMethod}</code>
                  </div>

                  {/* Audit Info */}
                  <div className={styles.auditBar}>
                    <span>Last Updated: {gratuityConfig.lastUpdatedDate} by {gratuityConfig.lastUpdatedBy}</span>
                  </div>

                  <div className={styles.formActions}>
                    <button type="submit" className={styles.saveBtn} disabled={isSaving}>
                      <Save size={16} />
                      <span>{isSaving ? 'Saving...' : 'Save Gratuity Settings'}</span>
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* TAB 7: LWF CONFIGURATION */}
            {activeTab === 'lwf' && (
              <div className={styles.configContainer}>
                <div className={styles.configHeader}>
                  <div>
                    <h2 className={styles.configTitle}>Labour Welfare Fund (LWF) State Rules</h2>
                    <p className={styles.configSub}>Configure state-wise employee & employer contributions and deduction frequencies</p>
                  </div>
                  <div className={styles.toggleControl}>
                    <span className={styles.toggleLabel}>Module Status:</span>
                    <button
                      type="button"
                      className={styles.toggleBtn}
                      onClick={() => triggerModuleToggle('lwf', lwfConfig.enabled)}
                      disabled={isSaving}
                    >
                      {lwfConfig.enabled ? <ToggleRight size={28} color="#10b981" /> : <ToggleLeft size={28} color="#94a3b8" />}
                    </button>
                    <StatusBadge status={lwfConfig.enabled ? 'active' : 'inactive'} />
                  </div>
                </div>

                {/* Toolbar */}
                <div className={styles.ptToolbar}>
                  <div className={styles.stateSelectWrap}>
                    <label className={styles.miniLabel}>Filter State:</label>
                    <select
                      className={styles.stateSelect}
                      value={selectedLWFState}
                      onChange={(e) => setSelectedLWFState(e.target.value)}
                    >
                      {lwfStatesList.map(st => (
                        <option key={st} value={st}>{st}</option>
                      ))}
                    </select>
                  </div>

                  <button
                    type="button"
                    className={styles.addSlabBtn}
                    onClick={() => { setEditingLWFRule(null); setIsLWFModalOpen(true); }}
                  >
                    <Plus size={16} />
                    <span>Add State LWF Rule</span>
                  </button>
                </div>

                {/* LWF Rules Table */}
                <div className={styles.tableCard}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>State</th>
                        <th>Employee Share</th>
                        <th>Employer Share</th>
                        <th>Frequency</th>
                        <th>Deduction Month(s)</th>
                        <th>Effective Date</th>
                        <th>Status</th>
                        <th className={styles.textCenter}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredLWFRules.length === 0 ? (
                        <tr>
                          <td colSpan={8} style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                            No Labour Welfare Fund rules configured for the selected filter.
                          </td>
                        </tr>
                      ) : (
                        filteredLWFRules.map((rule) => (
                          <tr key={rule.id}>
                            <td><span className={styles.stateBadge}>{rule.state}</span></td>
                            <td><span className={styles.taxAmountVal}>₹{rule.employeeContribution}</span></td>
                            <td><span className={styles.taxAmountVal}>₹{rule.employerContribution}</span></td>
                            <td><span className={styles.cycleBadge}>{rule.frequency}</span></td>
                            <td><span className={styles.descSub}>{rule.deductionMonths || '—'}</span></td>
                            <td><span className={styles.dateText}>{rule.effectiveDate}</span></td>
                            <td><StatusBadge status={rule.status} /></td>
                            <td className={styles.textCenter}>
                              <div style={{ display: 'inline-flex', gap: '8px' }}>
                                <button
                                  type="button"
                                  className={styles.editIconBtn}
                                  title="Edit LWF Rule"
                                  onClick={() => { setEditingLWFRule(rule); setIsLWFModalOpen(true); }}
                                >
                                  <Edit2 size={14} />
                                </button>
                                <button
                                  type="button"
                                  className={styles.deleteIconBtn}
                                  title="Delete Rule"
                                  onClick={() => handleDeleteLWFRule(rule.id)}
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </AdminLayout>
  );
}

export default StatutorySetup;
