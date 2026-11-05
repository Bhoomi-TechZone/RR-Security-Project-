import React, { useState, useEffect } from 'react';
import {
  FileText,
  CheckCircle2,
  Clock,
  Sparkles,
  Upload,
  AlertCircle,
  ShieldCheck,
  Building,
  HelpCircle,
  FileCheck2,
  Trash2,
  Save,
  Send
} from 'lucide-react';
import Toast from '../../components/common/Toast';
import authService from '../../services/authService';
import {
  getStoredDeclarations,
  saveStoredDeclarations,
  TAX_REGIMES
} from '../../data/incomeTaxData';
import styles from './EmployeeTaxDeclaration.module.css';

const formatINR = (val) => `₹${Number(val || 0).toLocaleString('en-IN')}`;

export default function EmployeeTaxDeclaration() {
  const currentUser = authService.getCurrentUser() || authService.getUser() || {};
  const employeeName = currentUser.name || currentUser.employeeName || 'Rajeshwar Dayal Singh';
  const employeeCode = currentUser.employeeCode || currentUser.employeeId || 'RR-SEC-0104';
  const designation = currentUser.designation || 'Senior Security Supervisor';

  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const showToast = (message, type = 'success') => setToast({ show: true, message, type });

  // Load existing declaration or create template
  const [declarations, setDeclarations] = useState(() => getStoredDeclarations());
  const myExistingDecl = declarations.find(
    (d) => d.employeeCode === employeeCode || d.employeeName?.toLowerCase() === employeeName.toLowerCase()
  ) || {
    regime: 'New Tax Regime (Sec 115BAC)',
    status: 'Verified & Approved',
    sec80C: 75000,
    sec80D: 15000,
    hraExemption: 36000,
    homeLoanInterest: 0,
    nps80CCD: 0
  };

  // State
  const [selectedRegime, setSelectedRegime] = useState(
    myExistingDecl.regime?.includes('Old') ? 'Old Tax Regime (With Deductions)' : 'New Tax Regime (Sec 115BAC)'
  );

  const [form80C, setForm80C] = useState({
    epfVoluntary: 24000,
    lifeInsurance: 25000,
    ppf: 15000,
    elssMutualFunds: 11000,
    tuitionFees: 0,
    homeLoanPrincipal: 0
  });

  const [form80D, setForm80D] = useState({
    selfFamilyHealth: 15000,
    parentsHealth: 0
  });

  const [formHRA, setFormHRA] = useState({
    monthlyRent: 8000,
    annualRent: 96000,
    landlordName: 'Satish Narang',
    landlordPan: 'ABCDE1234F',
    rentalAddress: 'House 42, Sector 14, Gurgaon, Haryana'
  });

  const [otherDeductions, setOtherDeductions] = useState({
    homeLoanInterest: 0,
    nps80CCD: 0
  });

  const [attachedFiles, setAttachedFiles] = useState([
    { name: 'Rent_Receipts_Q1_Q2.pdf', size: '1.2 MB', section: 'Section 10(13A) HRA' },
    { name: 'LIC_Premium_Receipt.pdf', size: '480 KB', section: 'Section 80C' }
  ]);

  const [isDeclared, setIsDeclared] = useState(true);
  const [submissionStatus, setSubmissionStatus] = useState(myExistingDecl.status || 'Verified & Approved');

  // Total 80C (Capped at ₹1,50,000)
  const total80CClaimed = Object.values(form80C).reduce((a, b) => a + Number(b || 0), 0);
  const allowable80C = Math.min(total80CClaimed, 150000);

  // Total 80D
  const total80D = Number(form80D.selfFamilyHealth || 0) + Number(form80D.parentsHealth || 0);

  // Gross Deductions
  const grossDeductions =
    allowable80C +
    total80D +
    Number(formHRA.annualRent || 0) +
    Number(otherDeductions.homeLoanInterest || 0) +
    Number(otherDeductions.nps80CCD || 0);

  const handleFileUpload = (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const newItems = Array.from(files).map((f) => ({
        name: f.name,
        size: `${(f.size / (1024 * 1024)).toFixed(1)} MB`,
        section: 'General Tax Proof'
      }));
      setAttachedFiles([...attachedFiles, ...newItems]);
      showToast('✓ Document proof uploaded successfully.');
    }
  };

  const handleRemoveFile = (idx) => {
    setAttachedFiles(attachedFiles.filter((_, i) => i !== idx));
  };

  const handleSubmitDeclaration = (e) => {
    e.preventDefault();

    if (!isDeclared) {
      alert('Please check the confirmation declaration checkbox before submitting.');
      return;
    }

    const updated = {
      declarationId: myExistingDecl.declarationId || `DEC-2026-${Date.now().toString().slice(-3)}`,
      employeeId: currentUser.id || 'EMP-0104',
      employeeCode,
      employeeName,
      department: currentUser.department || 'Operations',
      clientName: currentUser.companyName || 'Corporate Client',
      regime: selectedRegime,
      financialYear: 'FY 2026-2027',
      sec80C: allowable80C,
      sec80D: total80D,
      hraExemption: Number(formHRA.annualRent || 0),
      homeLoanInterest: Number(otherDeductions.homeLoanInterest || 0),
      nps80CCD: Number(otherDeductions.nps80CCD || 0),
      totalDeductions: grossDeductions,
      proofCount: attachedFiles.length,
      status: 'Pending Verification',
      submissionDate: new Date().toISOString().slice(0, 10),
      verifiedBy: '—'
    };

    const nextList = declarations.map((d) =>
      d.employeeCode === employeeCode || d.declarationId === updated.declarationId ? updated : d
    );

    // If not found, prepend
    if (!nextList.some((d) => d.employeeCode === employeeCode)) {
      nextList.unshift(updated);
    }

    setDeclarations(nextList);
    saveStoredDeclarations(nextList);
    setSubmissionStatus('Pending Verification');
    showToast('✓ Form 12BB IT Declaration submitted to HR for statutory proof verification!', 'success');
  };

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        {toast.show && (
          <Toast message={toast.message} type={toast.type} onClose={() => setToast({ ...toast, show: false })} />
        )}

        {/* Page Top Header */}
        <header className={styles.pageHeader}>
          <div>
            <div className={styles.breadcrumb}>
              <span>Employee Portal</span> / <strong>IT Declaration (Form 12BB)</strong>
            </div>
            <h1 className={styles.pageTitle}>Income Tax Declaration & Proofs</h1>
            <p className={styles.pageSubtitle}>
              Submit statutory Form 12BB declarations for FY 2026-2027 under Section 192 of the Income Tax Act to optimize monthly TDS deductions.
            </p>
          </div>

          <span className={styles.fyPill}>
            <Sparkles size={13} /> FY 2026-2027 (AY 2027-2028)
          </span>
        </header>

        {/* Status Banner */}
        <section className={styles.statusBanner}>
          <div className={styles.statusLeft}>
            <div
              className={`${styles.statusIcon} ${
                submissionStatus.includes('Approved') || submissionStatus.includes('Verified')
                  ? styles.statusIconSuccess
                  : styles.statusIconPending
              }`}
            >
              {submissionStatus.includes('Approved') || submissionStatus.includes('Verified') ? (
                <ShieldCheck size={22} />
              ) : (
                <Clock size={22} />
              )}
            </div>
            <div>
              <div className={styles.statusTitle}>
                Declaration Status: <strong>{submissionStatus}</strong>
              </div>
              <div className={styles.statusSub}>
                {submissionStatus.includes('Approved') || submissionStatus.includes('Verified')
                  ? 'Your declared deductions and proofs are verified. Standard TDS rebate applied.'
                  : 'Your declaration has been submitted and is in the HR verification queue.'}
              </div>
            </div>
          </div>

          <div>
            <span style={{ fontSize: '11px', color: '#64748b' }}>
              Employee: <strong>{employeeName}</strong> ({employeeCode})
            </span>
          </div>
        </section>

        {/* 1. Tax Regime Selection Card */}
        <section className={styles.regimeCard}>
          <div className={styles.sectionHeader}>
            <div>
              <h2 className={styles.sectionTitle}>1. Choose Income Tax Regime</h2>
              <p className={styles.sectionSub}>
                As per Finance Act, New Tax Regime is default with reduced tax slab rates. Old Regime allows itemized 80C & HRA exemptions.
              </p>
            </div>
          </div>

          <div className={styles.regimeGrid}>
            {/* New Tax Regime Option */}
            <div
              className={`${styles.regimeOption} ${
                selectedRegime.includes('New') ? styles.regimeOptionSelected : ''
              }`}
              onClick={() => setSelectedRegime('New Tax Regime (Sec 115BAC)')}
            >
              <div className={styles.regimeTop}>
                <span className={styles.regimeName}>New Tax Regime (Section 115BAC)</span>
                <span className={styles.regimeBadge}>Government Default</span>
              </div>
              <p className={styles.regimeDesc}>
                Concessional tax slabs with standard deduction of ₹75,000. No need to submit 80C / HRA investment proofs. Nil tax up to ₹7.75 Lakhs total income.
              </p>
            </div>

            {/* Old Tax Regime Option */}
            <div
              className={`${styles.regimeOption} ${
                selectedRegime.includes('Old') ? styles.regimeOptionSelected : ''
              }`}
              onClick={() => setSelectedRegime('Old Tax Regime (With Deductions)')}
            >
              <div className={styles.regimeTop}>
                <span className={styles.regimeName}>Old Tax Regime (With Deductions)</span>
                <span style={{ fontSize: '11px', color: '#2563eb', fontWeight: 700 }}>Itemized Deductions</span>
              </div>
              <p className={styles.regimeDesc}>
                Allows full tax deductions under Chapter VI-A (80C up to ₹1.5L, 80D Mediclaim up to ₹75k, Section 10(13A) HRA, and Home Loan interest).
              </p>
            </div>
          </div>
        </section>

        {/* 2. Statutory Deductions Form 12BB (Section Details) */}
        <form onSubmit={handleSubmitDeclaration}>
          <div className={styles.formCard}>
            <div className={styles.sectionHeader}>
              <div>
                <h2 className={styles.sectionTitle}>2. Section 80C Investments (Max Limit: ₹1,50,000)</h2>
                <p className={styles.sectionSub}>
                  Enter projected investments for the financial year. Total deduction capped at ₹1,50,000 under Section 80CCE.
                </p>
              </div>
              <div>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#16a34a' }}>
                  Total Claimed: {formatINR(total80CClaimed)}
                </span>
              </div>
            </div>

            <div className={styles.formGrid3}>
              <div className={styles.formGroup}>
                <label className={styles.label}>
                  <span>Provident Fund (VPF / EPF)</span>
                </label>
                <div className={styles.currencyInput}>
                  <span className={styles.currencySymbol}>₹</span>
                  <input
                    type="number"
                    className={styles.input}
                    value={form80C.epfVoluntary}
                    onChange={(e) => setForm80C({ ...form80C, epfVoluntary: e.target.value })}
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>
                  <span>Life Insurance Premium (LIC)</span>
                </label>
                <div className={styles.currencyInput}>
                  <span className={styles.currencySymbol}>₹</span>
                  <input
                    type="number"
                    className={styles.input}
                    value={form80C.lifeInsurance}
                    onChange={(e) => setForm80C({ ...form80C, lifeInsurance: e.target.value })}
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>
                  <span>Public Provident Fund (PPF)</span>
                </label>
                <div className={styles.currencyInput}>
                  <span className={styles.currencySymbol}>₹</span>
                  <input
                    type="number"
                    className={styles.input}
                    value={form80C.ppf}
                    onChange={(e) => setForm80C({ ...form80C, ppf: e.target.value })}
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>
                  <span>ELSS Tax Saving Mutual Funds</span>
                </label>
                <div className={styles.currencyInput}>
                  <span className={styles.currencySymbol}>₹</span>
                  <input
                    type="number"
                    className={styles.input}
                    value={form80C.elssMutualFunds}
                    onChange={(e) => setForm80C({ ...form80C, elssMutualFunds: e.target.value })}
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>
                  <span>Children Tuition Fees (Max 2 Kids)</span>
                </label>
                <div className={styles.currencyInput}>
                  <span className={styles.currencySymbol}>₹</span>
                  <input
                    type="number"
                    className={styles.input}
                    value={form80C.tuitionFees}
                    onChange={(e) => setForm80C({ ...form80C, tuitionFees: e.target.value })}
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>
                  <span>Home Loan Principal Repayment</span>
                </label>
                <div className={styles.currencyInput}>
                  <span className={styles.currencySymbol}>₹</span>
                  <input
                    type="number"
                    className={styles.input}
                    value={form80C.homeLoanPrincipal}
                    onChange={(e) => setForm80C({ ...form80C, homeLoanPrincipal: e.target.value })}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 3. Section 10(13A) House Rent Allowance (HRA) */}
          <div className={styles.formCard} style={{ marginTop: '20px' }}>
            <div className={styles.sectionHeader}>
              <div>
                <h2 className={styles.sectionTitle}>3. Section 10(13A) House Rent Allowance (HRA)</h2>
                <p className={styles.sectionSub}>
                  Rent receipts are mandatory if annual rent exceeds ₹1,00,000 or if claiming monthly HRA tax exemption.
                </p>
              </div>
            </div>

            <div className={styles.formGrid2}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Monthly Rent Paid (₹)</label>
                <div className={styles.currencyInput}>
                  <span className={styles.currencySymbol}>₹</span>
                  <input
                    type="number"
                    className={styles.input}
                    value={formHRA.monthlyRent}
                    onChange={(e) => {
                      const m = Number(e.target.value) || 0;
                      setFormHRA({ ...formHRA, monthlyRent: m, annualRent: m * 12 });
                    }}
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Annual Rent (Projected)</label>
                <div className={styles.currencyInput}>
                  <span className={styles.currencySymbol}>₹</span>
                  <input
                    type="number"
                    className={styles.input}
                    value={formHRA.annualRent}
                    readOnly
                    style={{ background: '#f8fafc' }}
                  />
                </div>
              </div>
            </div>

            <div className={styles.formGrid2}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Landlord Name</label>
                <input
                  type="text"
                  className={styles.input}
                  value={formHRA.landlordName}
                  onChange={(e) => setFormHRA({ ...formHRA, landlordName: e.target.value })}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>
                  <span>Landlord PAN</span>
                  <span className={styles.labelLimit}>Mandatory if rent &gt; ₹1L/yr</span>
                </label>
                <input
                  type="text"
                  className={styles.input}
                  placeholder="e.g. ABCDE1234F"
                  value={formHRA.landlordPan}
                  onChange={(e) => setFormHRA({ ...formHRA, landlordPan: e.target.value.toUpperCase() })}
                />
              </div>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Rented Accommodation Address</label>
              <input
                type="text"
                className={styles.input}
                value={formHRA.rentalAddress}
                onChange={(e) => setFormHRA({ ...formHRA, rentalAddress: e.target.value })}
              />
            </div>
          </div>

          {/* 4. Section 80D & Other Deductions */}
          <div className={styles.formCard} style={{ marginTop: '20px' }}>
            <div className={styles.sectionHeader}>
              <div>
                <h2 className={styles.sectionTitle}>4. Section 80D Mediclaim & Other Exemptions</h2>
                <p className={styles.sectionSub}>Health insurance premiums and home loan interest deductions.</p>
              </div>
            </div>

            <div className={styles.formGrid3}>
              <div className={styles.formGroup}>
                <label className={styles.label}>
                  <span>Health Insurance (Self/Spouse/Kids)</span>
                  <span className={styles.labelLimit}>Max ₹25k</span>
                </label>
                <div className={styles.currencyInput}>
                  <span className={styles.currencySymbol}>₹</span>
                  <input
                    type="number"
                    className={styles.input}
                    value={form80D.selfFamilyHealth}
                    onChange={(e) => setForm80D({ ...form80D, selfFamilyHealth: e.target.value })}
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>
                  <span>Health Insurance (Parents)</span>
                  <span className={styles.labelLimit}>Max ₹50k</span>
                </label>
                <div className={styles.currencyInput}>
                  <span className={styles.currencySymbol}>₹</span>
                  <input
                    type="number"
                    className={styles.input}
                    value={form80D.parentsHealth}
                    onChange={(e) => setForm80D({ ...form80D, parentsHealth: e.target.value })}
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>
                  <span>Home Loan Interest u/s 24(b)</span>
                  <span className={styles.labelLimit}>Max ₹2L</span>
                </label>
                <div className={styles.currencyInput}>
                  <span className={styles.currencySymbol}>₹</span>
                  <input
                    type="number"
                    className={styles.input}
                    value={otherDeductions.homeLoanInterest}
                    onChange={(e) => setOtherDeductions({ ...otherDeductions, homeLoanInterest: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Total Deductions Summary Bar */}
            <div className={styles.deductionSummary}>
              <div>
                <span className={styles.summaryTotalLabel}>Total Chapter VI-A & Section 10 Deductions Claimed:</span>
                <div style={{ fontSize: '11px', color: '#64748b' }}>
                  Includes ₹{allowable80C.toLocaleString()} (80C) + ₹{total80D.toLocaleString()} (80D) + ₹
                  {Number(formHRA.annualRent || 0).toLocaleString()} (HRA)
                </div>
              </div>
              <div className={styles.summaryTotalVal}>{formatINR(grossDeductions)}</div>
            </div>
          </div>

          {/* 5. Document Proof Upload */}
          <div className={styles.formCard} style={{ marginTop: '20px' }}>
            <div className={styles.sectionHeader}>
              <div>
                <h2 className={styles.sectionTitle}>5. Attach Verification Proofs / Receipts</h2>
                <p className={styles.sectionSub}>Upload PDF or image proofs for Rent, LIC, PPF or Health Insurance.</p>
              </div>
            </div>

            <label className={styles.uploadZone}>
              <Upload size={24} color="#2563eb" style={{ margin: '0 auto 8px' }} />
              <div style={{ fontWeight: 600, fontSize: '13px', color: '#1e293b' }}>
                Click to browse or drop tax saving receipts here
              </div>
              <span style={{ fontSize: '11.5px', color: '#64748b' }}>
                Supported formats: PDF, JPG, PNG (Max 5MB each)
              </span>
              <input type="file" multiple onChange={handleFileUpload} style={{ display: 'none' }} />
            </label>

            {attachedFiles.length > 0 && (
              <div className={styles.uploadedList}>
                {attachedFiles.map((file, idx) => (
                  <div key={idx} className={styles.uploadedFileItem}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <FileCheck2 size={16} color="#16a34a" />
                      <span>{file.name}</span>
                      <span style={{ fontSize: '11px', color: '#64748b' }}>({file.size})</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveFile(idx)}
                      style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 2 }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 6. Legal Declaration & Submit */}
          <div className={styles.actionBar}>
            <label className={styles.declarationCheck}>
              <input
                type="checkbox"
                checked={isDeclared}
                onChange={(e) => setIsDeclared(e.target.checked)}
              />
              <span>
                I hereby declare that the information given above is true and correct in all particulars. The investments/receipts claimed above have actually been paid by me and will not be claimed by any other family member.
              </span>
            </label>

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                type="submit"
                className={styles.btnPrimary}
                disabled={!isDeclared}
              >
                <Send size={15} />
                <span>Submit Form 12BB Declaration</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </main>
  );
}

