import mongoose from 'mongoose';

const ptSlabSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    state: { type: String, required: true, trim: true },
    minSalary: { type: Number, required: true, default: 0 },
    maxSalary: { type: Number, required: true, default: 9999999 },
    taxAmount: { type: Number, required: true, default: 0 },
    februaryTaxAmount: { type: Number, default: 0 },
    effectiveFrom: { type: String, default: '2026-04-01' },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  },
  { _id: false }
);

const lwfRuleSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    state: { type: String, required: true, trim: true },
    employeeContribution: { type: Number, required: true, default: 0 },
    employerContribution: { type: Number, required: true, default: 0 },
    frequency: { type: String, default: 'Monthly' },
    deductionMonths: { type: String, default: 'Every Month' },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    effectiveDate: { type: String, default: '2026-04-01' },
  },
  { _id: false }
);

const statutorySchema = new mongoose.Schema(
  {
    companyId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    adminEmail: {
      type: String,
      default: '',
      lowercase: true,
    },

    // 1. Provident Fund (PF) Settings
    pf: {
      enabled: { type: Boolean, default: true },
      employeeContribution: { type: Number, default: 12 },
      employerContribution: { type: Number, default: 12 },
      epsContribution: { type: Number, default: 8.33 },
      epfEmployerContribution: { type: Number, default: 3.67 },
      edliContribution: { type: Number, default: 0.5 },
      adminCharges: { type: Number, default: 0.5 },
      wageCeiling: { type: Number, default: 15000 },
      wageCeilingRestricted: { type: Boolean, default: true },
      allowVPF: { type: Boolean, default: true },
      vpfMaxPercentage: { type: Number, default: 100 },
      effectiveDate: { type: String, default: '2026-04-01' },
      status: { type: String, enum: ['active', 'inactive'], default: 'active' },
      createdBy: { type: String, default: 'System SuperAdmin' },
      createdDate: { type: String, default: '2025-04-01' },
      lastUpdatedBy: { type: String, default: 'Admin' },
      lastUpdatedDate: { type: String, default: '2026-04-01' },
    },

    // 2. Employee State Insurance (ESI) Settings
    esi: {
      enabled: { type: Boolean, default: true },
      employeeContribution: { type: Number, default: 0.75 },
      employerContribution: { type: Number, default: 3.25 },
      wageEligibilityLimit: { type: Number, default: 21000 },
      disabilityWageLimit: { type: Number, default: 25000 },
      effectiveDate: { type: String, default: '2026-04-01' },
      status: { type: String, enum: ['active', 'inactive'], default: 'active' },
      notes: { type: String, default: 'Applicable to staff drawing gross monthly wage up to ₹21,000.' },
      createdBy: { type: String, default: 'System SuperAdmin' },
      createdDate: { type: String, default: '2025-04-01' },
      lastUpdatedBy: { type: String, default: 'Admin' },
      lastUpdatedDate: { type: String, default: '2026-04-01' },
    },

    // 3. Professional Tax (PT) Settings & Slabs
    pt: {
      enabled: { type: Boolean, default: true },
      status: { type: String, enum: ['active', 'inactive'], default: 'active' },
      effectiveDate: { type: String, default: '2026-04-01' },
      lastUpdatedBy: { type: String, default: 'Admin' },
      lastUpdatedDate: { type: String, default: '2026-04-01' },
    },
    ptSlabs: [ptSlabSchema],

    // 4. Tax Deducted at Source (TDS) Settings
    tds: {
      enabled: { type: Boolean, default: true },
      defaultTaxRegime: { type: String, default: 'New Regime' },
      effectiveFinancialYear: { type: String, default: '2026-2027' },
      standardDeductionNewRegime: { type: Number, default: 75000 },
      standardDeductionOldRegime: { type: Number, default: 50000 },
      investmentDeclarationRequired: { type: Boolean, default: true },
      proofSubmissionDeadline: { type: String, default: '2027-01-31' },
      monthlyTDSThreshold: { type: Number, default: 500000 },
      status: { type: String, enum: ['active', 'inactive'], default: 'active' },
      lastUpdatedBy: { type: String, default: 'Admin' },
      lastUpdatedDate: { type: String, default: '2026-04-01' },
    },

    // 5. Statutory Bonus Settings
    bonus: {
      enabled: { type: Boolean, default: true },
      calculationMethod: { type: String, default: 'Percentage of Basic' },
      bonusPercentage: { type: Number, default: 8.33 },
      maximumBonusPercentage: { type: Number, default: 20.0 },
      statutoryWageCeiling: { type: Number, default: 7000 },
      minimumServiceDays: { type: Number, default: 30 },
      disbursementSchedule: { type: String, default: 'Annual (Diwali / Puja Festival)' },
      effectiveDate: { type: String, default: '2026-04-01' },
      status: { type: String, enum: ['active', 'inactive'], default: 'active' },
      lastUpdatedBy: { type: String, default: 'Admin' },
      lastUpdatedDate: { type: String, default: '2026-04-01' },
    },

    // 6. Gratuity Settings
    gratuity: {
      enabled: { type: Boolean, default: true },
      eligibilityYears: { type: Number, default: 5 },
      calculationBasis: { type: String, default: 'Basic + DA' },
      formulaMethod: { type: String, default: '15 Days × (Last Drawn Basic + DA) × Completed Years / 26' },
      maximumTaxExemptionLimit: { type: Number, default: 2000000 },
      effectiveDate: { type: String, default: '2026-04-01' },
      status: { type: String, enum: ['active', 'inactive'], default: 'active' },
      lastUpdatedBy: { type: String, default: 'Admin' },
      lastUpdatedDate: { type: String, default: '2026-04-01' },
    },

    // 7. Labour Welfare Fund (LWF) Settings & State Rules
    lwf: {
      enabled: { type: Boolean, default: true },
      status: { type: String, enum: ['active', 'inactive'], default: 'active' },
      effectiveDate: { type: String, default: '2026-04-01' },
      lastUpdatedBy: { type: String, default: 'Admin' },
      lastUpdatedDate: { type: String, default: '2026-04-01' },
    },
    lwfRules: [lwfRuleSchema],
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc, ret) {
        ret.id = ret._id.toString();
        delete ret.__v;
        return ret;
      },
    },
  }
);

const StatutoryConfig = mongoose.model('StatutoryConfig', statutorySchema);
export default StatutoryConfig;
