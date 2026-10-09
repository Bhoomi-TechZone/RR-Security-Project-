import React, { useState } from 'react';
import { 
  Building2, Hash, MapPin, User, Phone, Mail, Calendar, Users, 
  ShieldCheck, Clock, Briefcase, FileCheck, Lock, Layers, Landmark, 
  CreditCard, FileText, CheckCircle2, XCircle, HelpCircle, Eye, Download, X, Printer, Stamp
} from 'lucide-react';
import styles from './CompanyOverview.module.css';

/**
 * Helper to format service type names into readable strings
 */
const formatServiceType = (type) => {
  if (!type) return 'Not Specified';
  const mapping = {
    'SecurityGuard': 'Security Guard',
    'Housekeeping': 'Housekeeping',
    'Manufacturing': 'Manufacturing',
    'UnarmedSecurity': 'Unarmed Security',
    'ArmedSecurity': 'Armed Security',
    'Finance': 'Finance',
    'Retail': 'Retail',
    'Construction': 'Construction',
    'Other': 'Other Services'
  };
  return mapping[type] || type;
};

/**
 * Helper to extract PAN from 15-character Indian GSTIN
 */
const extractPAN = (gstin) => {
  if (gstin && typeof gstin === 'string' && gstin.length === 15) {
    return gstin.substring(2, 12);
  }
  return null;
};

/**
 * Helper to format dates cleanly
 */
const formatDate = (dateStr) => {
  if (!dateStr) return 'Not Specified';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};

/**
 * InfoRow Component matching Employee Details design pattern
 */
function InfoRow({ icon, label, value, highlight = false, badge = null, customContent = null }) {
  return (
    <div className={styles.infoRow}>
      <div className={styles.infoRowIcon}>
        {icon || <Building2 size={15} />}
      </div>
      <div className={styles.infoRowContent}>
        <span className={styles.infoRowLabel}>{label}</span>
        {customContent ? (
          customContent
        ) : badge ? (
          badge
        ) : (
          <span className={`${styles.infoRowValue} ${highlight ? styles.highlightVal : ''}`}>
            {value || 'N/A'}
          </span>
        )}
      </div>
    </div>
  );
}

/**
 * CompanyOverview Component
 * Displays client overview details mirroring the exact Employee Details layout & visual structure,
 * including a professional, interactive document preview and print/download modal.
 */
function CompanyOverview({ company }) {
  if (!company) return null;

  const [previewModal, setPreviewModal] = useState({
    isOpen: false,
    title: '',
    url: '',
    fileName: '',
    isImage: false,
    isPdf: false,
    isDocumentSheet: false
  });

  const pan = extractPAN(company.gstin);
  const isCompanyActive = String(company.status || '').toLowerCase() === 'active';

  // Compliance object extraction
  const compliance = company.compliance || {};

  // Overtime configurations
  const overtimeType = company.overtimeType || compliance.overtimeType;
  const overtimeBasis = company.overtimeBasis || compliance.overtimeBasis;

  // Document file details extraction
  let docName = null;
  let docUrl = null;

  if (company.document) {
    if (typeof company.document === 'string' && company.document.trim() !== '') {
      if (company.document.startsWith('data:') || company.document.startsWith('http') || company.document.startsWith('/')) {
        docUrl = company.document;
        docName = `${company.name ? company.name.replace(/\s+/g, '_') : 'Client'}_Agreement.pdf`;
      } else {
        docName = company.document;
        docUrl = company.document;
      }
    } else if (typeof company.document === 'object') {
      docName = company.document.name || 'Client_Agreement.pdf';
      docUrl = company.document.data || company.document.url || company.document.name;
    }
  }

  const handleViewDocument = (title, urlOrName) => {
    if (!urlOrName) return;

    const isBase64Data = typeof urlOrName === 'string' && urlOrName.startsWith('data:');
    const isHttpUrl = typeof urlOrName === 'string' && (urlOrName.startsWith('http://') || urlOrName.startsWith('https://') || urlOrName.startsWith('/'));
    
    const isImage = (isBase64Data && urlOrName.startsWith('data:image/')) || 
      (isHttpUrl && /\.(png|jpe?g|webp|gif|svg)$/i.test(urlOrName));
    
    const isPdf = (isBase64Data && urlOrName.startsWith('data:application/pdf')) || 
      (isHttpUrl && /\.pdf$/i.test(urlOrName));

    const isDocumentSheet = !isImage && !isPdf;

    setPreviewModal({
      isOpen: true,
      title: title || 'Client Agreement Document',
      url: urlOrName,
      fileName: docName || `${company.name || 'Client'}_Agreement.pdf`,
      isImage,
      isPdf,
      isDocumentSheet
    });
  };

  const handlePrintDocument = () => {
    window.print();
  };

  const handleDownloadDocument = (title, urlOrName) => {
    if (!urlOrName) return;
    try {
      const filename = docName || `${(company.name || 'Client').replace(/\s+/g, '_')}_Agreement.pdf`;
      if (typeof urlOrName === 'string' && urlOrName.startsWith('data:')) {
        const link = document.createElement('a');
        link.href = urlOrName;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else if (typeof urlOrName === 'string' && (urlOrName.startsWith('http') || urlOrName.startsWith('/'))) {
        window.open(urlOrName, '_blank');
      } else {
        // Generate formatted text export for document file on record
        const docContent = `
================================================================================
                    RR SECURITY & FACILITIES MANAGEMENT SERVICES
                     CLIENT SERVICE CONTRACT & AGREEMENT RECORD
================================================================================

DOCUMENT REF      : REF: AGR/${company.clientId || 'CLI'}/${new Date().getFullYear()}
DOCUMENT NAME     : ${docName || 'Client_Agreement.pdf'}
DATE OF RECORD    : ${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}
STATUS            : OFFICIALLY VERIFIED & REGISTERED ON HRMS PORTAL

--------------------------------------------------------------------------------
1. CLIENT IDENTIFICATION & PARTICULARS
--------------------------------------------------------------------------------
Client Name       : ${company.name || 'N/A'}
Client ID         : ${company.clientId || company.id || 'N/A'}
Service Scope     : ${formatServiceType(company.typeOfService)}
GSTIN             : ${company.gstin || 'N/A'}
PAN Number        : ${pan || 'N/A'}
Registered Address: ${company.address || 'N/A'}

--------------------------------------------------------------------------------
2. CONTACT & COMMUNICATION DETAILS
--------------------------------------------------------------------------------
Authorized Person : ${company.contactPerson || 'N/A'}
Contact Number    : ${company.contactNumber || 'N/A'}
Portal Login Email: ${company.email || (company.clientId ? `${company.clientId.toLowerCase()}@client.portal` : 'N/A')}

--------------------------------------------------------------------------------
3. CONTRACT TERM & DEPLOYMENT
--------------------------------------------------------------------------------
Commencement Date : ${formatDate(company.contractStartDate)}
Expiration Date   : ${formatDate(company.contractEndDate)}
Workforce Deployed: ${company.employees || 0} Total Active Personnel
Account Status    : ${isCompanyActive ? 'Active' : 'Inactive'}

--------------------------------------------------------------------------------
4. STATUTORY & WELFARE APPLICABILITY
--------------------------------------------------------------------------------
Provident Fund (PF)  : ${compliance.pf === true ? 'APPLICABLE (YES)' : compliance.pf === false ? 'EXEMPTED (NO)' : 'NOT CONFIGURED'}
State Insurance (ESI): ${compliance.esi === true ? 'APPLICABLE (YES)' : compliance.esi === false ? 'EXEMPTED (NO)' : 'NOT CONFIGURED'}
Labour Welfare (LWF) : ${compliance.lwf === true ? 'APPLICABLE (YES)' : compliance.lwf === false ? 'EXEMPTED (NO)' : 'NOT CONFIGURED'}
Tax Deducted (TDS)   : ${compliance.tds === true ? 'APPLICABLE (YES)' : compliance.tds === false ? 'EXEMPTED (NO)' : 'NOT CONFIGURED'}

--------------------------------------------------------------------------------
5. OVERTIME & BILLING RULES
--------------------------------------------------------------------------------
Overtime Policy   : ${overtimeType ? `${overtimeType} Rate` : 'Standard'}
Calculation Basis : ${overtimeBasis ? `Based on ${overtimeBasis}` : 'Standard Shift Hours'}
Portal Access     : ${company.enablePortalAccess !== false ? 'Enabled' : 'Disabled'}

================================================================================
VERIFICATION SEAL : CERTIFIED TRUE COPY - RR SECURITY & FACILITIES HRMS
================================================================================
`;
        const blob = new Blob([docContent], { type: 'text/plain;charset=utf-8' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename.endsWith('.txt') ? filename : `${filename.replace(/\.[^/.]+$/, '')}_Record.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (err) {
      console.error('Download error:', err);
    }
  };

  const formatComplianceValue = (val) => {
    if (val === true) {
      return (
        <span className={styles.badgeYes}>
          <CheckCircle2 size={12} /> Yes (Applicable)
        </span>
      );
    }
    if (val === false) {
      return (
        <span className={styles.badgeNo}>
          <XCircle size={12} /> No (Exempted)
        </span>
      );
    }
    return (
      <span className={styles.badgeUnset}>
        <HelpCircle size={12} /> Not Configured
      </span>
    );
  };

  return (
    <div className={styles.overviewContainer}>

      {/* DOCUMENT PREVIEW MODAL */}
      {previewModal.isOpen && (
        <div className={styles.modalOverlay} onClick={() => setPreviewModal(prev => ({ ...prev, isOpen: false }))}>
          <div className={styles.previewCard} onClick={(e) => e.stopPropagation()}>
            
            {/* Modal Header */}
            <div className={styles.previewHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div className={styles.previewHeaderIcon}>
                  <FileText size={20} color="var(--primary, #2563eb)" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: 'var(--text-primary, #0f172a)' }}>
                    {previewModal.title}
                  </h3>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary, #64748b)' }}>
                    {company.name} ({company.clientId || company.id}) • {previewModal.fileName}
                  </span>
                </div>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  type="button"
                  className={styles.docBtn}
                  onClick={handlePrintDocument}
                  title="Print Document"
                >
                  <Printer size={14} /> Print
                </button>
                <button
                  type="button"
                  className={styles.docBtnPrimary}
                  onClick={() => handleDownloadDocument(previewModal.title, previewModal.url)}
                  title="Download File"
                >
                  <Download size={14} /> Download
                </button>
                <button
                  type="button"
                  className={styles.closeBtn}
                  onClick={() => setPreviewModal(prev => ({ ...prev, isOpen: false }))}
                  aria-label="Close Preview"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className={styles.previewBody}>
              {previewModal.isImage ? (
                <div className={styles.imagePreviewWrap}>
                  <img src={previewModal.url} alt={previewModal.title} className={styles.fullPreviewImg} />
                </div>
              ) : previewModal.isPdf ? (
                <iframe
                  src={previewModal.url}
                  title={previewModal.title}
                  className={styles.pdfFrame}
                />
              ) : (
                /* OFFICIAL CLIENT AGREEMENT DOCUMENT SHEET */
                <div className={styles.agreementDocumentSheet}>
                  
                  {/* Agreement Header */}
                  <div className={styles.sheetHeader}>
                    <div className={styles.sheetLogoArea}>
                      <div className={styles.sheetLogoBadge}>
                        <Building2 size={24} />
                      </div>
                      <div>
                        <h2 className={styles.sheetCompanyOrg}>RR SECURITY & FACILITIES</h2>
                        <span className={styles.sheetOrgSub}>HUMAN RESOURCE & WORKFORCE MANAGEMENT SYSTEM</span>
                      </div>
                    </div>
                    <div className={styles.sheetRefBox}>
                      <div className={styles.sheetRefText}>
                        <span>DOC REF:</span>
                        <strong>AGR/{company.clientId || 'CLI'}/{new Date().getFullYear()}</strong>
                      </div>
                      <div className={styles.verifiedStamp}>
                        <CheckCircle2 size={13} />
                        <span>VERIFIED DOCUMENT</span>
                      </div>
                    </div>
                  </div>

                  <div className={styles.sheetDivider} />

                  {/* Title */}
                  <div className={styles.sheetTitleBlock}>
                    <h3 className={styles.sheetMainTitle}>CLIENT SERVICE AGREEMENT & ONBOARDING RECORD</h3>
                    <p className={styles.sheetDateMeta}>
                      Official verification certificate for <strong>{company.name}</strong> • Record: <u>{previewModal.fileName}</u>
                    </p>
                  </div>

                  {/* Section 1: Client Information */}
                  <div className={styles.sheetSection}>
                    <h4 className={styles.sheetSectionHeading}>1. Client & Organization Particulars</h4>
                    <div className={styles.sheetGrid}>
                      <div className={styles.sheetField}>
                        <span className={styles.sheetLabel}>Client Organization Name:</span>
                        <span className={styles.sheetValueBold}>{company.name || 'N/A'}</span>
                      </div>
                      <div className={styles.sheetField}>
                        <span className={styles.sheetLabel}>Client ID / Account Code:</span>
                        <span className={styles.sheetCode}>{company.clientId || company.id || 'N/A'}</span>
                      </div>
                      <div className={styles.sheetField}>
                        <span className={styles.sheetLabel}>Type of Service Contracted:</span>
                        <span className={styles.sheetValue}>{formatServiceType(company.typeOfService)}</span>
                      </div>
                      <div className={styles.sheetField}>
                        <span className={styles.sheetLabel}>Account Operating Status:</span>
                        <span className={isCompanyActive ? styles.sheetStatusActive : styles.sheetStatusInactive}>
                          {isCompanyActive ? '● Active In-Force' : '● Inactive'}
                        </span>
                      </div>
                      <div className={styles.sheetField}>
                        <span className={styles.sheetLabel}>GSTIN (GST Number):</span>
                        <span className={styles.sheetCode}>{company.gstin || 'Not Registered / N/A'}</span>
                      </div>
                      <div className={styles.sheetField}>
                        <span className={styles.sheetLabel}>PAN (Permanent Account No.):</span>
                        <span className={styles.sheetCode}>{pan || 'N/A'}</span>
                      </div>
                      <div className={`${styles.sheetField} ${styles.sheetSpan2}`}>
                        <span className={styles.sheetLabel}>Registered Physical Address:</span>
                        <span className={styles.sheetValue}>{company.address || 'No physical address provided.'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Section 2: Contact & Key Personnel */}
                  <div className={styles.sheetSection}>
                    <h4 className={styles.sheetSectionHeading}>2. Authorized Point of Contact</h4>
                    <div className={styles.sheetGrid}>
                      <div className={styles.sheetField}>
                        <span className={styles.sheetLabel}>Authorized Contact Person:</span>
                        <span className={styles.sheetValueBold}>{company.contactPerson || 'Not Provided'}</span>
                      </div>
                      <div className={styles.sheetField}>
                        <span className={styles.sheetLabel}>Primary Contact Phone:</span>
                        <span className={styles.sheetValue}>{company.contactNumber || 'Not Provided'}</span>
                      </div>
                      <div className={styles.sheetField}>
                        <span className={styles.sheetLabel}>Client Portal Login Username:</span>
                        <span className={styles.sheetValue}>{company.email || company.clientId || 'Not Configured'}</span>
                      </div>
                      <div className={styles.sheetField}>
                        <span className={styles.sheetLabel}>Portal Self-Service Access:</span>
                        <span className={styles.sheetValue}>{company.enablePortalAccess !== false ? 'Enabled' : 'Disabled'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Section 3: Contract Term & Deployment */}
                  <div className={styles.sheetSection}>
                    <h4 className={styles.sheetSectionHeading}>3. Contract Term & Workforce Scope</h4>
                    <div className={styles.sheetGrid}>
                      <div className={styles.sheetField}>
                        <span className={styles.sheetLabel}>Contract Effective Date:</span>
                        <span className={styles.sheetValueBold}>{formatDate(company.contractStartDate)}</span>
                      </div>
                      <div className={styles.sheetField}>
                        <span className={styles.sheetLabel}>Contract Expiration Date:</span>
                        <span className={styles.sheetValueBold}>{formatDate(company.contractEndDate)}</span>
                      </div>
                      <div className={styles.sheetField}>
                        <span className={styles.sheetLabel}>Assigned Active Workforce:</span>
                        <span className={styles.sheetValue}>{company.employees || 0} Deployed Personnel</span>
                      </div>
                      <div className={styles.sheetField}>
                        <span className={styles.sheetLabel}>Overtime & Duty Policy:</span>
                        <span className={styles.sheetValue}>
                          {overtimeType ? `${overtimeType} Rate` : 'Standard'} ({overtimeBasis ? `Basis: ${overtimeBasis}` : 'Standard Hours'})
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Section 4: Statutory Compliance Clauses */}
                  <div className={styles.sheetSection}>
                    <h4 className={styles.sheetSectionHeading}>4. Statutory Compliance & Applicability</h4>
                    <div className={styles.sheetComplianceTable}>
                      <div className={styles.sheetCompRow}>
                        <span>Provident Fund (PF) Applicability:</span>
                        <strong>{compliance.pf === true ? '✓ Applicable' : compliance.pf === false ? '✕ Exempted' : 'Not Configured'}</strong>
                      </div>
                      <div className={styles.sheetCompRow}>
                        <span>Employee State Insurance (ESI):</span>
                        <strong>{compliance.esi === true ? '✓ Applicable' : compliance.esi === false ? '✕ Exempted' : 'Not Configured'}</strong>
                      </div>
                      <div className={styles.sheetCompRow}>
                        <span>Labour Welfare Fund (LWF):</span>
                        <strong>{compliance.lwf === true ? '✓ Applicable' : compliance.lwf === false ? '✕ Exempted' : 'Not Configured'}</strong>
                      </div>
                      <div className={styles.sheetCompRow}>
                        <span>Tax Deducted at Source (TDS):</span>
                        <strong>{compliance.tds === true ? '✓ Applicable' : compliance.tds === false ? '✕ Exempted' : 'Not Configured'}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Signature & Seal Block */}
                  <div className={styles.sheetSignatures}>
                    <div className={styles.signatureBox}>
                      <div className={styles.signLine} />
                      <span className={styles.signTitle}>Authorized Representative</span>
                      <span className={styles.signOrg}>{company.name}</span>
                    </div>
                    <div className={styles.sealBox}>
                      <div className={styles.sealCircle}>
                        <Stamp size={28} />
                        <span>VERIFIED & SEALED</span>
                      </div>
                    </div>
                    <div className={styles.signatureBox}>
                      <div className={styles.signLine} />
                      <span className={styles.signTitle}>HR & Operations Admin</span>
                      <span className={styles.signOrg}>RR Security & Facilities</span>
                    </div>
                  </div>

                  {/* Footer note */}
                  <div className={styles.sheetFooterNote}>
                    <span>This electronic verification document was generated dynamically from the RR Security HRMS system. All contract terms are subject to master agreements.</span>
                  </div>

                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className={styles.twoColGrid}>
        
        {/* CARD 1: Company & Business Profile */}
        <div className={styles.infoCard}>
          <h3 className={styles.infoCardTitle}>Company & Business Profile</h3>
          <div className={styles.infoRows}>
            <InfoRow 
              icon={<Building2 size={15} />} 
              label="Company Name" 
              value={company.name || 'N/A'} 
            />
            <InfoRow 
              icon={<Hash size={15} />} 
              label="Client ID" 
              value={company.clientId || company.id || 'N/A'} 
              highlight={true}
            />
            <InfoRow 
              icon={<Briefcase size={15} />} 
              label="Type of Service" 
              value={formatServiceType(company.typeOfService)} 
            />
            <InfoRow 
              icon={<ShieldCheck size={15} />} 
              label="Account Status" 
              badge={
                <span className={`${styles.statusPill} ${isCompanyActive ? styles.statusActive : styles.statusInactive}`}>
                  {isCompanyActive ? 'Active' : 'Inactive'}
                </span>
              }
            />
            <InfoRow 
              icon={<Users size={15} />} 
              label="Assigned Workforce" 
              badge={
                <span className={styles.workforcePill}>
                  {company.employees || 0} Employees
                </span>
              }
            />
          </div>
        </div>

        {/* CARD 2: Contact & Location */}
        <div className={styles.infoCard}>
          <h3 className={styles.infoCardTitle}>Contact & Location</h3>
          <div className={styles.infoRows}>
            <InfoRow 
              icon={<User size={15} />} 
              label="Contact Person" 
              value={company.contactPerson || 'Not Provided'} 
            />
            <InfoRow 
              icon={<Phone size={15} />} 
              label="Contact Number" 
              value={company.contactNumber || 'Not Provided'} 
            />
            <InfoRow 
              icon={<Mail size={15} />} 
              label="Portal Email / Login" 
              value={company.email || (company.clientId ? `${company.clientId.toLowerCase()}@client.portal` : 'Not Provided')} 
            />
            <InfoRow 
              icon={<MapPin size={15} />} 
              label="Operating Address" 
              value={company.address || 'No address provided'} 
            />
          </div>
        </div>

        {/* CARD 3: Contract & Tenure */}
        <div className={styles.infoCard}>
          <h3 className={styles.infoCardTitle}>Contract & Tenure</h3>
          <div className={styles.infoRows}>
            <InfoRow 
              icon={<Calendar size={15} />} 
              label="Contract Start Date" 
              value={formatDate(company.contractStartDate)} 
            />
            <InfoRow 
              icon={<Calendar size={15} />} 
              label="Contract End Date" 
              value={formatDate(company.contractEndDate)} 
            />
            <InfoRow 
              icon={<Clock size={15} />} 
              label="Contract Status" 
              badge={
                (() => {
                  if (!company.contractStartDate && !company.contractEndDate) {
                    return <span className={styles.contractValid}>Active Contract</span>;
                  }
                  if (company.contractEndDate) {
                    const end = new Date(company.contractEndDate);
                    if (!isNaN(end.getTime()) && end < new Date()) {
                      return <span className={styles.contractExpired}>Contract Expired</span>;
                    }
                  }
                  return <span className={styles.contractValid}>Active & In-Force</span>;
                })()
              }
            />
          </div>
        </div>

        {/* CARD 4: Tax & Legal Verification (with VIEW button) */}
        <div className={styles.infoCard}>
          <h3 className={styles.infoCardTitle}>Tax & Legal Verification</h3>
          <div className={styles.infoRows}>
            <InfoRow 
              icon={<Landmark size={15} />} 
              label="GSTIN" 
              value={company.gstin || 'Not Registered / N/A'} 
              highlight={Boolean(company.gstin)}
            />
            <InfoRow 
              icon={<CreditCard size={15} />} 
              label="PAN Number" 
              value={pan || 'Derived from GSTIN or N/A'} 
            />
            <InfoRow 
              icon={<FileText size={15} />} 
              label="Uploaded Agreement" 
              customContent={
                docName ? (
                  <div className={styles.docActionRow}>
                    <span className={styles.docFileNameText}>{docName}</span>
                    <div className={styles.docButtonsGroup}>
                      <button
                        type="button"
                        className={styles.viewDocBtn}
                        onClick={() => handleViewDocument('Client Service Agreement Document', docUrl)}
                        title="View / Preview Document"
                      >
                        <Eye size={13} />
                        <span>View</span>
                      </button>
                      <button
                        type="button"
                        className={styles.downloadDocBtn}
                        onClick={() => handleDownloadDocument('Client Service Agreement Document', docUrl)}
                        title="Download Document"
                      >
                        <Download size={13} />
                        <span>Download</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <span className={styles.infoRowValue}>No document uploaded</span>
                )
              }
            />
          </div>
        </div>

        {/* CARD 5: Statutory Compliance */}
        <div className={styles.infoCard}>
          <h3 className={styles.infoCardTitle}>Statutory Compliance</h3>
          <div className={styles.infoRows}>
            <InfoRow 
              icon={<ShieldCheck size={15} />} 
              label="PF (Provident Fund)" 
              badge={formatComplianceValue(compliance.pf)} 
            />
            <InfoRow 
              icon={<ShieldCheck size={15} />} 
              label="ESI (Employee State Insurance)" 
              badge={formatComplianceValue(compliance.esi)} 
            />
            <InfoRow 
              icon={<ShieldCheck size={15} />} 
              label="LWF (Labour Welfare Fund)" 
              badge={formatComplianceValue(compliance.lwf)} 
            />
            <InfoRow 
              icon={<ShieldCheck size={15} />} 
              label="TDS (Tax Deducted at Source)" 
              badge={formatComplianceValue(compliance.tds)} 
            />
            {compliance.bonus !== undefined && compliance.bonus !== null && (
              <InfoRow 
                icon={<ShieldCheck size={15} />} 
                label="Annual Bonus" 
                badge={formatComplianceValue(compliance.bonus)} 
              />
            )}
            {compliance.gratuity !== undefined && compliance.gratuity !== null && (
              <InfoRow 
                icon={<ShieldCheck size={15} />} 
                label="Gratuity" 
                badge={formatComplianceValue(compliance.gratuity)} 
              />
            )}
          </div>
        </div>

        {/* CARD 6: Overtime & Portal Access */}
        <div className={styles.infoCard}>
          <h3 className={styles.infoCardTitle}>Overtime & Portal Access</h3>
          <div className={styles.infoRows}>
            <InfoRow 
              icon={<Clock size={15} />} 
              label="Overtime Rate" 
              value={overtimeType ? `${overtimeType} Rate` : 'Standard / Not Specified'} 
            />
            <InfoRow 
              icon={<Layers size={15} />} 
              label="Overtime Basis" 
              value={overtimeBasis ? `Based on ${overtimeBasis}` : 'Standard Shift Hours'} 
            />
            <InfoRow 
              icon={<Lock size={15} />} 
              label="Client Portal Access" 
              badge={
                <span className={`${styles.statusPill} ${company.enablePortalAccess !== false ? styles.statusActive : styles.statusInactive}`}>
                  {company.enablePortalAccess !== false ? 'Enabled' : 'Disabled'}
                </span>
              } 
            />
            <InfoRow 
              icon={<User size={15} />} 
              label="Portal Login Username" 
              value={company.email || company.clientId || 'N/A'} 
            />
          </div>
        </div>

      </div>
    </div>
  );
}

export default CompanyOverview;
