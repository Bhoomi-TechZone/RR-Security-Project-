import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Edit2, Trash2, CheckCircle2, XCircle, PlusCircle } from 'lucide-react';
import styles from '../../pages/admin/StatutorySetup.module.css';
import PFRateModal from './PFRateModal';
import { useCompany } from '../../context/CompanyContext';
import { mockSalaryComponents } from '../../data/masters/salaryComponentData';
import masterService from '../../services/masterService';

const DEFAULT_PF_RATES = [
  {
    id: 'rate-1',
    enabled: true,
    effectiveDate: '2026-09-01',
    displayDate: '01-Sep-2026',
    employeeRate: 12,
    employerRate: 3.67,
    pensionRate: 8.33,
    seniorEmployeeRate: 12,
    seniorEmployerRate: 3.67,
    seniorPensionRate: 8.33,
    edliAdminRate: 1,
    wageCeiling: 15000,
    seniorAge: 58
  },
  {
    id: 'rate-2',
    enabled: false,
    effectiveDate: '1975-04-01',
    displayDate: '01-Apr-1975',
    employeeRate: 12,
    employerRate: 3.67,
    pensionRate: 8.33,
    seniorEmployeeRate: 12,
    seniorEmployerRate: 3.67,
    seniorPensionRate: 8.33,
    edliAdminRate: 1,
    wageCeiling: 0,
    seniorAge: 58
  }
];

const formatPFDate = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const day = String(d.getDate()).padStart(2, '0');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = months[d.getMonth()];
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
};

function PFConfigurationTab({ showToast, pfConfig, setPFConfig, compId }) {
  const { activeCompany } = useCompany();
  const companyId = compId || activeCompany?.companyId || activeCompany?.id || 'RRS8392014SEC';

  // Load raw salary components from Master / localStorage / fallback
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

  // Selected components for PF calculation
  const [selectedComponentIds, setSelectedComponentIds] = useState(() => {
    try {
      const saved = localStorage.getItem(`novaspark_pf_selected_components_${companyId}`);
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
    const id = String(comp.id || '');
    const code = String(comp.code || comp.shortName || '').toLowerCase();
    return selectedComponentIds.includes(id) || selectedComponentIds.includes(code);
  };

  const handleTogglePFApplicability = (comp) => {
    const id = String(comp.id || '');
    const code = String(comp.code || comp.shortName || '').toLowerCase();

    setSelectedComponentIds((prev) => {
      const alreadySelected = prev.includes(id) || (code && prev.includes(code));
      const next = alreadySelected
        ? prev.filter((x) => x !== id && x !== code)
        : [...prev, id];
      try {
        localStorage.setItem(
          `novaspark_pf_selected_components_${companyId}`,
          JSON.stringify(next)
        );
      } catch (e) {
        console.error('Failed to save selected components', e);
      }
      return next;
    });
  };

  // Rate Changes State
  const [pfRateChanges, setPfRateChanges] = useState(() => {
    try {
      const saved = localStorage.getItem(`novaspark_pf_rates_${companyId}`);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return DEFAULT_PF_RATES;
  });

  const [vpfEnabled, setVpfEnabled] = useState(() => {
    try {
      const saved = localStorage.getItem(`novaspark_pf_vpf_${companyId}`);
      if (saved !== null) return JSON.parse(saved);
    } catch (e) {}
    return false;
  });

  const [wageCeilingProRata, setWageCeilingProRata] = useState(() => {
    try {
      const saved = localStorage.getItem(`novaspark_pf_prorata_${companyId}`);
      if (saved !== null) return JSON.parse(saved);
    } catch (e) {}
    return false;
  });

  const [isPFRateModalOpen, setIsPFRateModalOpen] = useState(false);
  const [editingPFRate, setEditingPFRate] = useState(null);

  const handleOpenAddPFRate = () => {
    setEditingPFRate(null);
    setIsPFRateModalOpen(true);
  };

  const handleOpenEditPFRate = (rateItem) => {
    setEditingPFRate(rateItem);
    setIsPFRateModalOpen(true);
  };

  const handleDeletePFRate = (rateId) => {
    setPfRateChanges((prev) => {
      const updated = prev.filter((r) => r.id !== rateId);
      try {
        localStorage.setItem(`novaspark_pf_rates_${companyId}`, JSON.stringify(updated));
      } catch (e) {
        console.error('Failed to delete rate', e);
      }
      return updated;
    });
    if (showToast) showToast('✓ PF Rate Change entry deleted.');
  };

  const handleSavePFRate = (rateData) => {
    const formattedDate = formatPFDate(rateData.effectiveDate);
    const completeData = {
      ...rateData,
      displayDate: formattedDate
    };

    setPfRateChanges((prev) => {
      const exists = prev.some((r) => r.id === completeData.id);
      const updated = exists
        ? prev.map((r) => (r.id === completeData.id ? completeData : r))
        : [completeData, ...prev];
      try {
        localStorage.setItem(`novaspark_pf_rates_${companyId}`, JSON.stringify(updated));
      } catch (e) {
        console.error('Failed to save rate', e);
      }
      return updated;
    });

    if (setPFConfig && completeData.enabled) {
      setPFConfig((prev) => ({
        ...prev,
        enabled: true,
        employeeContribution: completeData.employeeRate,
        employerContribution:
          (completeData.employerRate || 0) + (completeData.pensionRate || 0),
        epfEmployerContribution: completeData.employerRate,
        epsContribution: completeData.pensionRate,
        wageCeiling: completeData.wageCeiling
      }));
    }

    setIsPFRateModalOpen(false);
    setEditingPFRate(null);
    if (showToast) {
      showToast(
        editingPFRate
          ? '✓ PF Rate Change updated successfully.'
          : '✓ New PF Rate Change added successfully.'
      );
    }
  };

  const handleToggleVPF = (e) => {
    const nextVal = e.target.checked;
    setVpfEnabled(nextVal);
    try {
      localStorage.setItem(`novaspark_pf_vpf_${companyId}`, JSON.stringify(nextVal));
    } catch (err) {
      console.error(err);
    }
    if (showToast) {
      showToast(`✓ Voluntary Provident Fund ${nextVal ? 'enabled' : 'disabled'}.`);
    }
  };

  const handleToggleWageCeilingProRata = (e) => {
    const nextVal = e.target.checked;
    setWageCeilingProRata(nextVal);
    try {
      localStorage.setItem(`novaspark_pf_prorata_${companyId}`, JSON.stringify(nextVal));
    } catch (err) {
      console.error(err);
    }
    if (showToast) {
      showToast(`✓ Wage ceiling pro-rata calculation ${nextVal ? 'enabled' : 'disabled'}.`);
    }
  };

  return (
    <>
      {/* PF Rate Change Modal */}
      <PFRateModal
        isOpen={isPFRateModalOpen}
        onClose={() => {
          setIsPFRateModalOpen(false);
          setEditingPFRate(null);
        }}
        onSubmit={handleSavePFRate}
        editingItem={editingPFRate}
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
                            onChange={() => handleTogglePFApplicability(comp)}
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

        {/* RIGHT COLUMN: PF Rate Changes + VPF + Wage Ceiling Enhancement */}
        <div className={styles.pfColumnRight}>
          {/* Card 1: PF Rate Changes */}
          <div className={styles.pfSectionCard}>
            <div className={styles.pfCardHeader}>
              <h3 className={styles.pfCardTitle}>PF Rate Changes</h3>
              <button
                type="button"
                className={styles.pfAddNewBtn}
                onClick={handleOpenAddPFRate}
              >
                <PlusCircle size={15} />
                <span>Add New</span>
              </button>
            </div>

            <table className={styles.pfTable}>
              <thead>
                <tr>
                  <th>STATUS</th>
                  <th>DATE</th>
                  <th>RATES</th>
                  <th style={{ textAlign: 'right' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {pfRateChanges.map((rate) => (
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
                    <td>{rate.displayDate || formatPFDate(rate.effectiveDate)}</td>
                    <td className={styles.ratesCell}>
                      {rate.employeeRate}% | {rate.employerRate}% | {rate.pensionRate}%
                    </td>
                    <td>
                      <div
                        className={styles.actionsCell}
                        style={{ justifyContent: 'flex-end' }}
                      >
                        <button
                          type="button"
                          className={`${styles.actionCircleBtn} ${styles.editCircleBtn}`}
                          title="Edit PF Rate"
                          onClick={() => handleOpenEditPFRate(rate)}
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          type="button"
                          className={`${styles.actionCircleBtn} ${styles.deleteCircleBtn}`}
                          title="Delete PF Rate"
                          onClick={() => handleDeletePFRate(rate.id)}
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

          {/* Card 2: Voluntary Provident Fund */}
          <div className={styles.pfSettingCard}>
            <div className={styles.pfSettingTitleRow}>
              <h4 className={styles.pfSettingTitle}>Voluntary Provident Fund</h4>
            </div>
            <p className={styles.pfSettingDesc}>
              Enable if you want to show VPF contributions in salary structure.
            </p>
            <div className={styles.pfToggleRow}>
              <label className={styles.pfSwitch}>
                <input
                  type="checkbox"
                  checked={vpfEnabled}
                  onChange={handleToggleVPF}
                />
                <span className={styles.pfSlider}></span>
              </label>
              <span className={styles.pfToggleLabel}>Enable VPF Contributions</span>
            </div>
          </div>

          {/* Card 3: Wage Ceiling Enhancement */}
          <div className={styles.pfSettingCard}>
            <div className={styles.pfSettingTitleRow}>
              <h4 className={styles.pfSettingTitle}>Wage Ceiling Enhancement</h4>
              <span className={styles.newBadge}>New</span>
            </div>
            <p className={styles.pfSettingDesc}>
              Enable to calculate PF on pro-rata basis for Sep&apos;26. This means that
              salary till 16th Sep will be considered as per old ceiling and from 17th
              to 30th Sep will be considered using new ceiling.
            </p>
            <div className={styles.pfToggleRow}>
              <label className={styles.pfSwitch}>
                <input
                  type="checkbox"
                  checked={wageCeilingProRata}
                  onChange={handleToggleWageCeilingProRata}
                />
                <span className={styles.pfSlider}></span>
              </label>
              <span className={styles.pfToggleLabel}>
                Enable pro-rata calculation for Sep&apos;26
              </span>
            </div>

            {/* Pro-rata Example Comparison Table (Screenshot 2) */}
            <div className={styles.exampleSection}>
              <div className={styles.exampleHeaderTitle}>Example:</div>
              <table className={styles.exampleTable}>
                <thead>
                  <tr>
                    <th>PARTICULARS</th>
                    <th>CASE 1</th>
                    <th>CASE 2</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>PF Wages Earned</td>
                    <td>18,000</td>
                    <td>25,000</td>
                  </tr>
                  <tr>
                    <td>
                      01-SEP to 16-SEP
                      <span className={styles.calcSubtext}>16 days</span>
                    </td>
                    <td>
                      8,000
                      <span className={styles.calcSubtext}>15,000 / 30 × 16</span>
                    </td>
                    <td>
                      8,000
                      <span className={styles.calcSubtext}>15,000 / 30 × 16</span>
                    </td>
                  </tr>
                  <tr>
                    <td>
                      17-SEP to 30-SEP
                      <span className={styles.calcSubtext}>14 days</span>
                    </td>
                    <td>
                      8,400
                      <span className={styles.calcSubtext}>18,000 / 30 × 14</span>
                    </td>
                    <td>
                      11,667
                      <span className={styles.calcSubtext}>25,000 / 30 × 14</span>
                    </td>
                  </tr>
                  <tr className={styles.totalRow}>
                    <td>PF Wages</td>
                    <td>
                      16,400
                      <span className={styles.calcSubtext}>8,000 + 8,400</span>
                    </td>
                    <td>
                      19,667
                      <span className={styles.calcSubtext}>8,000 + 11,667</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Notes Section (Screenshot 2) */}
            <div className={styles.notesSection}>
              <div className={styles.notesTitle}>Please Note:</div>
              <ul className={styles.notesList}>
                <li>
                  This pro-rata calculation will only affect employees having PF Wages
                  (Basic + DA) between 15,001 to 25,000.
                </li>
                <li>
                  Day count for days before and after 17th SEP will be auto-adjusted for
                  employees joining after 01-SEP-2026 and exiting before 30-SEP-2026.
                </li>
                <li>
                  Please check with your PF advisor/consultant on whether you should
                  enable this setting or not.
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default PFConfigurationTab;
