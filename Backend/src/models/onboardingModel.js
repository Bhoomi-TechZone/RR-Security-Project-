import mongoose from 'mongoose';

const documentItemSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ['Pending', 'Uploaded', 'Verified', 'Rejected'],
      default: 'Pending'
    },
    number: { type: String, default: '' },
    documentName: { type: String, default: '' },
    bankName: { type: String, default: '' },
    ifsc: { type: String, default: '' },
    accountNumber: { type: String, default: '' },
    refNo: { type: String, default: '' },
    clearanceDate: { type: String, default: '' },
    fileUrl: { type: String, default: '' },
    photoFront: { type: String, default: '' },
    photoBack: { type: String, default: '' },
    photo: { type: String, default: '' }
  },
  { _id: false }
);

const uniformKitSchema = new mongoose.Schema(
  {
    shirtSize: { type: String, default: '' },
    trouserSize: { type: String, default: '' },
    bootSize: { type: String, default: '' },
    capIssued: { type: Boolean, default: false },
    badgeIssued: { type: Boolean, default: false },
    whistleIssued: { type: Boolean, default: false },
    batonIssued: { type: Boolean, default: false },
    torchIssued: { type: Boolean, default: false },
    idCardGenerated: { type: Boolean, default: false }
  },
  { _id: false }
);

const onboardingSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    candidateId: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    companyId: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    companyName: {
      type: String,
      default: '',
      trim: true
    },
    adminEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true
    },
    candidateName: {
      type: String,
      required: true,
      trim: true
    },
    mobile: {
      type: String,
      default: '',
      trim: true
    },
    email: {
      type: String,
      default: '',
      trim: true
    },
    presentAddress: {
      type: String,
      default: '',
      trim: true
    },
    address: {
      type: String,
      default: '',
      trim: true
    },
    city: {
      type: String,
      default: '',
      trim: true
    },
    state: {
      type: String,
      default: '',
      trim: true
    },
    pincode: {
      type: String,
      default: '',
      trim: true
    },
    fatherHusbandName: {
      type: String,
      default: '',
      trim: true
    },
    dob: {
      type: String,
      default: '',
      trim: true
    },
    gender: {
      type: String,
      default: 'Male',
      trim: true
    },
    jobCategory: {
      type: String,
      default: 'Security Guard'
    },
    appliedFor: {
      type: String,
      default: 'Security Guard'
    },
    offeredSalary: {
      type: Number,
      default: 0
    },
    offeredDesignation: {
      type: String,
      default: ''
    },
    proposedJoiningDate: {
      type: String,
      default: ''
    },
    assignedClient: {
      type: String,
      default: ''
    },
    assignedSite: {
      type: String,
      default: ''
    },
    assignedShift: {
      type: String,
      default: ''
    },
    stage: {
      type: String,
      enum: [
        'offer_accepted',
        'document_verification',
        'uniform_allocation',
        'ready_to_deploy',
        'completed'
      ],
      default: 'offer_accepted',
      index: true
    },
    photo: {
      type: String,
      default: ''
    },
    documents: {
      aadhaar: { type: documentItemSchema, default: () => ({}) },
      pan: { type: documentItemSchema, default: () => ({}) },
      bankProof: { type: documentItemSchema, default: () => ({}) },
      policeVerification: { type: documentItemSchema, default: () => ({}) },
      educationCertificate: { type: documentItemSchema, default: () => ({}) },
      experienceRelieving: { type: documentItemSchema, default: () => ({}) }
    },
    uniformKit: {
      type: uniformKitSchema,
      default: () => ({})
    },
    isConvertedToEmployee: {
      type: Boolean,
      default: false,
      index: true
    },
    createdEmployeeCode: {
      type: String,
      default: ''
    },
    selfSubmitted: {
      type: Boolean,
      default: false,
      index: true
    },
    selfSubmittedAt: {
      type: Date
    },
    bankName: {
      type: String,
      default: ''
    },
    accountNumber: {
      type: String,
      default: ''
    },
    ifsc: {
      type: String,
      default: ''
    },
    accountHolder: {
      type: String,
      default: ''
    },
    aadhaar: {
      type: String,
      default: ''
    },
    pan: {
      type: String,
      default: ''
    },
    notes: {
      type: String,
      default: ''
    },
    linkExpiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 24 * 60 * 60 * 1000)
    },
    invitationSentAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

// Compound index for strict multi-tenant isolation and fast lookup
onboardingSchema.index({ companyId: 1, adminEmail: 1, createdAt: -1 });
onboardingSchema.index({ companyId: 1, adminEmail: 1, stage: 1 });
onboardingSchema.index({ companyId: 1, adminEmail: 1, candidateId: 1 });

const Onboarding = mongoose.model('Onboarding', onboardingSchema);
export default Onboarding;

