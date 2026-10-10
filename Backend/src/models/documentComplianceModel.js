import mongoose from 'mongoose';

const complianceSchema = new mongoose.Schema(
  {
    companyId: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    companyName: {
      type: String,
      default: '',
      trim: true,
    },
    adminEmail: {
      type: String,
      default: '',
      trim: true,
    },
    // 1. Global Expiry Alert Settings
    expiryConfig: {
      enabled: { type: Boolean, default: true },
      defaultAlertDays: { type: Number, default: 30 },
      repeatFrequencyDays: { type: Number, default: 7 },
      recipients: {
        admin: { type: Boolean, default: true },
        hr: { type: Boolean, default: true },
        reportingManager: { type: Boolean, default: true },
        siteSupervisor: { type: Boolean, default: false },
      },
      channels: {
        inApp: { type: Boolean, default: true },
        email: { type: Boolean, default: true },
      },
      lastUpdated: { type: String, default: '' },
    },
    // 2. Document-Specific Expiry Alert Rules
    expiryRules: [
      {
        id: { type: String, required: true },
        documentName: { type: String, required: true },
        category: { type: String, default: 'Security License' },
        alertDays: { type: Number, default: 30 },
        escalationLevel: { type: String, default: 'Admin & HR' },
        repeatFrequency: { type: String, default: 'Every 7 Days' },
        channels: { type: String, default: 'In-App + Email' },
        status: { type: String, default: 'Active' },
      },
    ],
    // 3. Verification Rules
    verificationRules: [
      {
        id: { type: String, required: true },
        documentName: { type: String, required: true },
        category: { type: String, default: 'Identity' },
        verificationRequired: { type: Boolean, default: true },
        verificationMethod: { type: String, default: 'Physical Verification' },
        verifierRole: { type: String, default: 'HR Verifier' },
        verificationDeadline: { type: String, default: '7 Days from Joining' },
        validity: { type: String, default: '1 Year (365 Days)' },
        requireBeforeActivation: { type: Boolean, default: true },
        reverifyAfterExpiry: { type: Boolean, default: true },
        remarks: { type: String, default: '' },
        status: { type: String, default: 'Active' },
        lastUpdated: { type: String, default: '' },
      },
    ],
    // 4. Police Verification Governance Config
    policeConfig: {
      enabled: { type: Boolean, default: true },
      mandatoryFor: { type: String, default: 'Security Guards & Armed Personnel' },
      verificationAuthority: { type: String, default: 'District Police Special Branch / Local Police Station' },
      verificationDeadline: { type: Number, default: 30 },
      validityPeriodYears: { type: Number, default: 1 },
      reverificationRequired: { type: Boolean, default: true },
      blockDeploymentIfPending: { type: Boolean, default: true },
      stages: {
        type: Array,
        default: [
          { stage: 1, name: 'Dossier Submission', desc: 'Collection & validation of supporting identity, address proofs, and affidavits.' },
          { stage: 2, name: 'Police Station Dispatch', desc: 'Formal submission to relevant Commissioner / SP Office with company authorization.' },
          { stage: 3, name: 'Field Inquiry', desc: 'Police constable site / home visit inquiry and background cross-check.' },
          { stage: 4, name: 'Clearance Issuance', desc: 'Receipt of Police Clearance Certificate (PCC) or verification character report.' },
          { stage: 5, name: 'HRMS Verification', desc: 'Upload of verified PCC, certificate validity date stamping, and profile clearance.' },
        ],
      },
      supportingDocuments: {
        type: Array,
        default: [
          { id: 'sd-1', name: 'Aadhaar Card (UIDAI Verified)', required: 'Mandatory', description: 'Address and identity match check' },
          { id: 'sd-2', name: 'Permanent Address Proof', required: 'Mandatory', description: 'Village Sarpanch / Municipality residential certificate' },
          { id: 'sd-3', name: 'Self-Declaration Affidavit', required: 'Mandatory', description: 'Non-involvement in criminal proceedings notary affidavit' },
          { id: 'sd-4', name: 'Passport Size Photographs (4 Copies)', required: 'Mandatory', description: 'Recent color photos for police dossier records' },
          { id: 'sd-5', name: 'Previous Employer Clearance / Character Cert', required: 'Optional', description: 'Reference check clearance letter' },
        ],
      },
      lastUpdated: { type: String, default: '' },
    },
  },
  {
    timestamps: true,
    strict: false,
  }
);

const ComplianceConfig = mongoose.model('ComplianceConfig', complianceSchema);
export default ComplianceConfig;
