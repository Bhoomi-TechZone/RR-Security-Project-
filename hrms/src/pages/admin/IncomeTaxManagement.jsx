import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  ChevronRight,
  RotateCcw,
  Sparkles
} from 'lucide-react';
import AdminLayout from '../../components/layout/AdminLayout';
import Toast from '../../components/common/Toast';
import styles from './IncomeTaxManagement.module.css';

// Sub-item Tab Components
import ITDeclarationTab from '../../components/incometax/ITDeclarationTab';
import ITExemptionsTab from '../../components/incometax/ITExemptionsTab';
import ITChallanTab from '../../components/incometax/ITChallanTab';
import TDSReturnTab from '../../components/incometax/TDSReturnTab';

// Data & Storage helpers
import {
  getStoredDeclarations,
  saveStoredDeclarations,
  getStoredExemptions,
  saveStoredExemptions,
  getStoredChallans,
  saveStoredChallans,
  getStoredReturns,
  saveStoredReturns,
  INITIAL_IT_DECLARATIONS,
  INITIAL_IT_EXEMPTIONS,
  INITIAL_IT_CHALLANS,
  INITIAL_TDS_RETURNS
} from '../../data/incomeTaxData';

const SUB_ITEM_META = {
  declaration: {
    title: 'IT Declaration',
    subtitle: 'Manage employee Form 12BB declarations, tax regime selection, Section 80C & Chapter VI-A deductions, and proof verification.'
  },
  exemptions: {
    title: 'IT Exemptions',
    subtitle: 'Section 10 statutory exemptions ledger, LTA, and interactive Section 10(13A) HRA exemption simulator.'
  },
  challan: {
    title: 'IT Challan',
    subtitle: 'Monthly TDS remittances via Challan ITNS 281, BSR code verification, and OLTAS CIN tracking.'
  },
  'tds-return': {
    title: 'TDS Return',
    subtitle: 'Quarterly Form 24Q dashboard, provisional receipt tracking (PRN token), and Annexure I & II salary breakdown.'
  }
};

export default function IncomeTaxManagement() {
  const [searchParams] = useSearchParams();

  // Active sub-item driven directly by query parameter `?tab=` from Sidebar navigation
  const currentTabParam = searchParams.get('tab') || 'declaration';
  const [activeTab, setActiveTab] = useState(currentTabParam);

  // Sync state if URL changes externally or through sidebar clicks
  useEffect(() => {
    const tabFromUrl = searchParams.get('tab') || 'declaration';
    setActiveTab(tabFromUrl);
  }, [searchParams]);

  // Toast Notification state
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
  };

  // State loaded from LocalStorage
  const [declarations, setDeclarations] = useState(() => getStoredDeclarations());
  const [exemptions, setExemptions] = useState(() => getStoredExemptions());
  const [challans, setChallans] = useState(() => getStoredChallans());
  const [tdsReturns, setTdsReturns] = useState(() => getStoredReturns());

  // Handlers for IT Declaration updates (verification, approval, reject)
  const handleUpdateDeclaration = (updatedDecl) => {
    const nextList = declarations.map((d) =>
      d.declarationId === updatedDecl.declarationId ? updatedDecl : d
    );
    setDeclarations(nextList);
    saveStoredDeclarations(nextList);
    showToast(`✓ Declaration for ${updatedDecl.employeeName} updated to "${updatedDecl.status}".`);
  };

  // Handlers for IT Challan additions
  const handleAddChallan = (newChallan) => {
    const nextList = [newChallan, ...challans];
    setChallans(nextList);
    saveStoredChallans(nextList);
    showToast(`✓ Challan ITNS 281 (${newChallan.challanNo || newChallan.challanId}) recorded successfully.`);
  };

  // Reset to initial baseline data
  const handleResetData = () => {
    if (window.confirm('Reset all Income Tax & TDS data to default statutory baseline demo records?')) {
      saveStoredDeclarations(INITIAL_IT_DECLARATIONS);
      saveStoredExemptions(INITIAL_IT_EXEMPTIONS);
      saveStoredChallans(INITIAL_IT_CHALLANS);
      saveStoredReturns(INITIAL_TDS_RETURNS);
      setDeclarations(INITIAL_IT_DECLARATIONS);
      setExemptions(INITIAL_IT_EXEMPTIONS);
      setChallans(INITIAL_IT_CHALLANS);
      setTdsReturns(INITIAL_TDS_RETURNS);
      showToast('Baseline Income Tax demo data re-initialized.', 'info');
    }
  };

  const currentMeta = SUB_ITEM_META[activeTab] || SUB_ITEM_META.declaration;

  return (
    <AdminLayout>
      <div className={styles.container}>
        {/* Toast Alert */}
        {toast.show && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast({ ...toast, show: false })}
          />
        )}

        {/* Breadcrumb Navigation */}
        <div className={styles.breadcrumb}>
          <Link to="/admin/payroll">Payroll Management</Link>
          <ChevronRight size={14} />
          <span>Income Tax</span>
          <ChevronRight size={14} />
          <span className={styles.breadcrumbCurrent}>{currentMeta.title}</span>
        </div>

        {/* Page Top Header (Clean typography without title icon) */}
        <div className={styles.pageHeader}>
          <div className={styles.headerLeft}>
            <div className={styles.headerTitleRow}>
              <h1 className={styles.title}>{currentMeta.title}</h1>
              <span className={styles.fyPill}>
                <Sparkles size={12} color="#2563eb" />
                FY 2026-2027 (AY 2027-2028)
              </span>
            </div>
            <p className={styles.subtitle}>
              {currentMeta.subtitle}
            </p>
          </div>

          <div className={styles.headerRight}>
            <button
              type="button"
              className={styles.btnSecondary}
              onClick={handleResetData}
              title="Reset sample IT data"
            >
              <RotateCcw size={14} />
              <span>Reset Baseline Data</span>
            </button>
          </div>
        </div>

        {/* Content Display Area (Purely driven by sidebar navigation) */}
        <div className={styles.tabContent}>
          {activeTab === 'declaration' && (
            <ITDeclarationTab
              declarations={declarations}
              onUpdateDeclaration={handleUpdateDeclaration}
              onNotify={showToast}
            />
          )}

          {activeTab === 'exemptions' && (
            <ITExemptionsTab
              exemptions={exemptions}
              onNotify={showToast}
            />
          )}

          {activeTab === 'challan' && (
            <ITChallanTab
              challans={challans}
              onAddChallan={handleAddChallan}
              onNotify={showToast}
            />
          )}

          {activeTab === 'tds-return' && (
            <TDSReturnTab
              returns={tdsReturns}
              onNotify={showToast}
            />
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
