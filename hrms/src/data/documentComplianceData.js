/**
 * Master Data & Configurations for Admin Document & Compliance Module
 */

export const DOCUMENT_CATEGORIES = [
  'All Categories',
  'Identity',
  'Address',
  'Education',
  'Employment',
  'Compliance',
  'Training',
  'Security',
  'Other'
];

export const APPLICABLE_AUDIENCES = [
  'All Employees',
  'Security Guards',
  'Gunmen / Armed Guards',
  'Supervisors & Field Officers',
  'Branch Managers',
  'Admin & HR Staff',
  'Site-Specific Workforce'
];

export const VERIFICATION_METHODS = [
  'Manual Verification',
  'HR Verification',
  'Admin Verification',
  'External Agency Verification',
  'Police Department Verification',
  'Document Number / Portal Verification'
];

export const VERIFIER_ROLES = [
  'HR',
  'Admin',
  'Reporting Manager',
  'Site Supervisor',
  'Compliance Officer'
];

export const EXPIRY_DAY_OPTIONS = [
  { label: '7 Days Before', value: 7 },
  { label: '15 Days Before', value: 15 },
  { label: '30 Days Before', value: 30 },
  { label: '45 Days Before', value: 45 },
  { label: '60 Days Before', value: 60 }
];

export const mockDocumentMasterList = [
  {
    id: 'doc-1',
    name: 'Aadhaar Card',
    code: 'DOC-AADHAAR',
    category: 'Identity',
    applicableTo: 'All Employees',
    mandatory: true,
    verificationRequired: true,
    expiryApplicable: false,
    multipleAllowed: false,
    description: 'Mandatory 12-digit Indian national identity proof with biometric & address verification',
    status: 'Active',
    lastUpdated: '2026-03-01 10:30 AM'
  },
  {
    id: 'doc-2',
    name: 'PAN Card',
    code: 'DOC-PAN',
    category: 'Identity',
    applicableTo: 'All Employees',
    mandatory: true,
    verificationRequired: true,
    expiryApplicable: false,
    multipleAllowed: false,
    description: 'Permanent Account Number required for tax deduction at source (TDS) and statutory compliance',
    status: 'Active',
    lastUpdated: '2026-03-01 10:30 AM'
  },
  {
    id: 'doc-3',
    name: 'Passport',
    code: 'DOC-PASSPORT',
    category: 'Identity',
    applicableTo: 'All Employees',
    mandatory: false,
    verificationRequired: true,
    expiryApplicable: true,
    multipleAllowed: false,
    description: 'Republic of India international passport for overseas deputations or executive identity proof',
    status: 'Active',
    lastUpdated: '2026-02-28 04:15 PM'
  },
  {
    id: 'doc-4',
    name: 'Voter ID Card',
    code: 'DOC-VOTER',
    category: 'Identity',
    applicableTo: 'All Employees',
    mandatory: false,
    verificationRequired: true,
    expiryApplicable: false,
    multipleAllowed: false,
    description: 'Election Commission of India voter identity card for secondary KYC',
    status: 'Active',
    lastUpdated: '2026-02-25 11:20 AM'
  },
  {
    id: 'doc-5',
    name: 'Driving Licence',
    code: 'DOC-DL',
    category: 'Identity',
    applicableTo: 'Security Guards',
    mandatory: false,
    verificationRequired: true,
    expiryApplicable: true,
    multipleAllowed: false,
    description: 'Commercial/Private Motor Vehicle driving permit for quick response team (QRT) drivers and patrol guards',
    status: 'Active',
    lastUpdated: '2026-02-26 02:40 PM'
  },
  {
    id: 'doc-6',
    name: 'Police Verification Certificate',
    code: 'DOC-PVC',
    category: 'Compliance',
    applicableTo: 'Security Guards',
    mandatory: true,
    verificationRequired: true,
    expiryApplicable: true,
    multipleAllowed: false,
    description: 'Local police station or SP office background clearance mandatory under PSARA Act',
    status: 'Active',
    lastUpdated: '2026-03-02 09:15 AM'
  },
  {
    id: 'doc-7',
    name: 'Permanent Address Proof',
    code: 'DOC-ADDR',
    category: 'Address',
    applicableTo: 'All Employees',
    mandatory: true,
    verificationRequired: true,
    expiryApplicable: false,
    multipleAllowed: true,
    description: 'Electricity bill, ration card, domicile certificate or rent agreement for background verification',
    status: 'Active',
    lastUpdated: '2026-02-27 01:10 PM'
  },
  {
    id: 'doc-8',
    name: 'Educational / 10th Certificate',
    code: 'DOC-EDU-10',
    category: 'Education',
    applicableTo: 'All Employees',
    mandatory: true,
    verificationRequired: true,
    expiryApplicable: false,
    multipleAllowed: false,
    description: 'Matriculation/10th Board marksheet verifying candidate date of birth and basic literacy standard',
    status: 'Active',
    lastUpdated: '2026-02-24 03:00 PM'
  },
  {
    id: 'doc-9',
    name: 'Degree / Diploma Certificate',
    code: 'DOC-DEGREE',
    category: 'Education',
    applicableTo: 'Supervisors & Field Officers',
    mandatory: false,
    verificationRequired: true,
    expiryApplicable: false,
    multipleAllowed: true,
    description: 'Higher education graduation certificate for managerial and field supervisory roles',
    status: 'Active',
    lastUpdated: '2026-02-20 12:30 PM'
  },
  {
    id: 'doc-10',
    name: 'PSARA Security Training Certificate',
    code: 'DOC-TRAIN-PSARA',
    category: 'Training',
    applicableTo: 'Security Guards',
    mandatory: true,
    verificationRequired: true,
    expiryApplicable: true,
    multipleAllowed: false,
    description: 'Recognized 20-day basic security and fire-safety training certification under PSARA guidelines',
    status: 'Active',
    lastUpdated: '2026-03-01 04:45 PM'
  },
  {
    id: 'doc-11',
    name: 'Gun / Arms Licence',
    code: 'DOC-ARMS',
    category: 'Security',
    applicableTo: 'Gunmen / Armed Guards',
    mandatory: true,
    verificationRequired: true,
    expiryApplicable: true,
    multipleAllowed: false,
    description: 'Valid District Magistrate (DM) sanctioned Arms License for 12 Bore DBBL / .32 Revolver',
    status: 'Active',
    lastUpdated: '2026-03-02 11:00 AM'
  },
  {
    id: 'doc-12',
    name: 'Medical Fitness Certificate',
    code: 'DOC-MED',
    category: 'Compliance',
    applicableTo: 'All Employees',
    mandatory: true,
    verificationRequired: true,
    expiryApplicable: true,
    multipleAllowed: false,
    description: 'Registered Medical Practitioner (MBBS) fitness certificate including eyesight & hearing assessment',
    status: 'Active',
    lastUpdated: '2026-02-25 05:20 PM'
  },
  {
    id: 'doc-13',
    name: 'Previous Experience Letter',
    code: 'DOC-EXP',
    category: 'Employment',
    applicableTo: 'Supervisors & Field Officers',
    mandatory: false,
    verificationRequired: true,
    expiryApplicable: false,
    multipleAllowed: true,
    description: 'Service and relieving certificate from previous employers documenting industry experience',
    status: 'Active',
    lastUpdated: '2026-02-22 02:15 PM'
  },
  {
    id: 'doc-14',
    name: 'Character / Sarpanch Certificate',
    code: 'DOC-CHAR',
    category: 'Compliance',
    applicableTo: 'Security Guards',
    mandatory: false,
    verificationRequired: true,
    expiryApplicable: true,
    multipleAllowed: false,
    description: 'Character testimonial issued by Village Sarpanch, Gazetted Officer, or Municipal Councilor',
    status: 'Active',
    lastUpdated: '2026-02-18 10:00 AM'
  }
];

export const mockVerificationRules = [
  {
    id: 'vr-1',
    documentId: 'doc-1',
    documentName: 'Aadhaar Card',
    category: 'Identity',
    verificationRequired: true,
    verificationMethod: 'Document Number / Portal Verification',
    verifierRole: 'HR',
    verificationDeadline: '3 Days from Joining',
    validity: 'Lifetime (No Expiry)',
    requireBeforeActivation: true,
    reverifyAfterExpiry: false,
    remarks: 'Online UIDAI portal number authentication required',
    status: 'Active',
    lastUpdated: '2026-03-01 10:30 AM'
  },
  {
    id: 'vr-2',
    documentId: 'doc-2',
    documentName: 'PAN Card',
    category: 'Identity',
    verificationRequired: true,
    verificationMethod: 'Document Number / Portal Verification',
    verifierRole: 'HR',
    verificationDeadline: '5 Days from Joining',
    validity: 'Lifetime (No Expiry)',
    requireBeforeActivation: true,
    reverifyAfterExpiry: false,
    remarks: 'Verify with NSDL/Income Tax database for name match',
    status: 'Active',
    lastUpdated: '2026-03-01 10:30 AM'
  },
  {
    id: 'vr-3',
    documentId: 'doc-6',
    documentName: 'Police Verification Certificate',
    category: 'Compliance',
    verificationRequired: true,
    verificationMethod: 'Police Department Verification',
    verifierRole: 'Compliance Officer',
    verificationDeadline: '30 Days from Joining',
    validity: '1 Year (365 Days)',
    requireBeforeActivation: true,
    reverifyAfterExpiry: true,
    remarks: 'Mandatory PSARA statutory compliance before deploying on client site',
    status: 'Active',
    lastUpdated: '2026-03-02 09:15 AM'
  },
  {
    id: 'vr-4',
    documentId: 'doc-10',
    documentName: 'PSARA Security Training Certificate',
    category: 'Training',
    verificationRequired: true,
    verificationMethod: 'HR Verification',
    verifierRole: 'HR',
    verificationDeadline: '7 Days from Joining',
    validity: '3 Years',
    requireBeforeActivation: true,
    reverifyAfterExpiry: true,
    remarks: 'Verify institute accreditation & registration code',
    status: 'Active',
    lastUpdated: '2026-03-01 04:45 PM'
  },
  {
    id: 'vr-5',
    documentId: 'doc-11',
    documentName: 'Gun / Arms Licence',
    category: 'Security',
    verificationRequired: true,
    verificationMethod: 'Admin Verification',
    verifierRole: 'Admin',
    verificationDeadline: 'Immediate (Before Deployment)',
    validity: 'As Per License Renewal Stamp',
    requireBeforeActivation: true,
    reverifyAfterExpiry: true,
    remarks: 'Inspect original booklet, DM seal & weapon serial number',
    status: 'Active',
    lastUpdated: '2026-03-02 11:00 AM'
  },
  {
    id: 'vr-6',
    documentId: 'doc-12',
    documentName: 'Medical Fitness Certificate',
    category: 'Compliance',
    verificationRequired: true,
    verificationMethod: 'HR Verification',
    verifierRole: 'HR',
    verificationDeadline: '15 Days from Joining',
    validity: '1 Year',
    requireBeforeActivation: false,
    reverifyAfterExpiry: true,
    remarks: 'Ensure vision and hearing test clearance attached',
    status: 'Active',
    lastUpdated: '2026-02-25 05:20 PM'
  },
  {
    id: 'vr-7',
    documentId: 'doc-5',
    documentName: 'Driving Licence',
    category: 'Identity',
    verificationRequired: true,
    verificationMethod: 'Document Number / Portal Verification',
    verifierRole: 'Reporting Manager',
    verificationDeadline: '7 Days from Joining',
    validity: 'As Per RTO Expiry',
    requireBeforeActivation: false,
    reverifyAfterExpiry: true,
    remarks: 'Verify Sarathi Parivahan portal record for driver category',
    status: 'Active',
    lastUpdated: '2026-02-26 02:40 PM'
  }
];

export const mockExpiryAlertConfig = {
  enabled: true,
  defaultAlertDays: 30, // 30 Days before
  customDays: 30,
  recipients: {
    admin: true,
    hr: true,
    reportingManager: true,
    siteSupervisor: false
  },
  channels: {
    inApp: true,
    email: true
  },
  repeatReminder: true,
  repeatFrequencyDays: 7,
  lastUpdated: '2026-03-01 12:00 PM'
};

export const mockExpiryRules = [
  {
    id: 'er-1',
    documentId: 'doc-11',
    documentName: 'Gun / Arms Licence',
    category: 'Security',
    alertDays: 45,
    escalationLevel: 'Admin & HR',
    repeatFrequency: 'Every 3 Days',
    channels: 'In-App + Email',
    status: 'Active'
  },
  {
    id: 'er-2',
    documentId: 'doc-6',
    documentName: 'Police Verification Certificate',
    category: 'Compliance',
    alertDays: 30,
    escalationLevel: 'HR & Manager',
    repeatFrequency: 'Every 7 Days',
    channels: 'In-App + Email',
    status: 'Active'
  },
  {
    id: 'er-3',
    documentId: 'doc-10',
    documentName: 'PSARA Security Training Certificate',
    category: 'Training',
    alertDays: 30,
    escalationLevel: 'HR & Supervisor',
    repeatFrequency: 'Every 7 Days',
    channels: 'In-App + Email',
    status: 'Active'
  },
  {
    id: 'er-4',
    documentId: 'doc-5',
    documentName: 'Driving Licence',
    category: 'Identity',
    alertDays: 15,
    escalationLevel: 'Reporting Manager',
    repeatFrequency: 'Every 5 Days',
    channels: 'In-App',
    status: 'Active'
  },
  {
    id: 'er-5',
    documentId: 'doc-12',
    documentName: 'Medical Fitness Certificate',
    category: 'Compliance',
    alertDays: 15,
    escalationLevel: 'HR',
    repeatFrequency: 'Every 7 Days',
    channels: 'In-App + Email',
    status: 'Active'
  },
  {
    id: 'er-6',
    documentId: 'doc-3',
    documentName: 'Passport',
    category: 'Identity',
    alertDays: 60,
    escalationLevel: 'Admin & HR',
    repeatFrequency: 'Every 15 Days',
    channels: 'Email',
    status: 'Active'
  }
];

export const mockPoliceVerificationConfig = {
  enabled: true,
  mandatoryFor: 'Security Guards', // 'All Employees' | 'Security Guards' | 'Supervisors & Field Officers' | 'Site-Specific Workforce'
  verificationAuthority: 'Local Police Station / SP Office (PSARA Recognized)',
  verificationDeadline: 30, // Days from joining
  validityPeriodYears: 1, // 1 Year validity
  reverificationRequired: true,
  blockDeploymentIfPending: true,
  supportingDocuments: [
    { id: 'pvd-1', name: 'Aadhaar Card Copy', required: 'Mandatory', description: 'Clear self-attested front & back photocopy' },
    { id: 'pvd-2', name: 'Permanent Address Proof', required: 'Mandatory', description: 'Electricity bill / Domicile / Ration card' },
    { id: 'pvd-3', name: 'Passport Size Photographs (4 Nos)', required: 'Mandatory', description: 'Recent white background studio color photos' },
    { id: 'pvd-4', name: 'Police Verification Form (Signed & Fingerprinted)', required: 'Mandatory', description: 'Official Form I & II under PSARA rules' },
    { id: 'pvd-5', name: 'Character / Sarpanch Certificate', required: 'Optional', description: 'Local dignitary character endorsement letter' },
    { id: 'pvd-6', name: 'Previous Employer Clearance NOC', required: 'Optional', description: 'Relieving slip confirming no criminal dispute' }
  ],
  stages: [
    { stage: 1, name: 'Document Submitted', desc: 'Candidate submits application dossier and identity proofs to HR' },
    { stage: 2, name: 'Verification Pending', desc: 'HR logs dossier and generates dispatch letter for police jurisdiction' },
    { stage: 3, name: 'Verification In Progress', desc: 'Local police station conducts field enquiry and crime check' },
    { stage: 4, name: 'Verified', desc: 'Clearance certificate stamped & uploaded to employee compliance file' },
    { stage: 5, name: 'Rejected', desc: 'Adverse report or mismatched identification detected' }
  ],
  lastUpdated: '2026-03-02 09:15 AM'
};
