import mongoose from 'mongoose';

// Employee Payroll Breakdown Schema
const payrollRecordSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    employeeId: { type: String, required: true, index: true },
    employeeName: { type: String, required: true },
    initials: { type: String, default: 'EM' },
    designation: { type: String, default: 'Staff' },
    department: { type: String, default: 'Operations' },
    clientName: { type: String, default: 'RR Security' },
    companyName: { type: String, default: 'RR Security' },
    site: { type: String, default: 'Main Site' },
    dutyPost: { type: String, default: '' },
    joiningDate: { type: String, default: '' },
    pan: { type: String, default: '' },
    uan: { type: String, default: '' },
    pfNo: { type: String, default: '' },
    esicNo: { type: String, default: '' },
    bankName: { type: String, default: '' },
    bankAccountNo: { type: String, default: '' },
    ifscCode: { type: String, default: '' },

    // Attendance & Working Days Metrics
    totalDaysInMonth: { type: Number, default: 30 },
    presentDays: { type: Number, default: 0 },
    paidDays: { type: Number, default: 0 },
    lopDays: { type: Number, default: 0 },
    overtimeHours: { type: Number, default: 0 },
    overtimeRate: { type: Number, default: 0 },
    overtimePay: { type: Number, default: 0 },

    // Earnings
    earnings: {
      basic: { type: Number, default: 0 },
      vda: { type: Number, default: 0 },
      hra: { type: Number, default: 0 },
      conveyance: { type: Number, default: 0 },
      otherAllowance: { type: Number, default: 0 },
      specialAllowance: { type: Number, default: 0 },
      bonus: { type: Number, default: 0 },
      overtime: { type: Number, default: 0 },
      arrears: { type: Number, default: 0 },
      totalGross: { type: Number, default: 0 },
    },

    // Deductions
    deductions: {
      pfEmployee: { type: Number, default: 0 },
      pfEmployer: { type: Number, default: 0 },
      esiEmployee: { type: Number, default: 0 },
      esiEmployer: { type: Number, default: 0 },
      pt: { type: Number, default: 0 },
      tds: { type: Number, default: 0 },
      lwf: { type: Number, default: 0 },
      advances: { type: Number, default: 0 },
      loanEmi: { type: Number, default: 0 },
      otherDeductions: { type: Number, default: 0 },
      totalDeductions: { type: Number, default: 0 },
    },

    netSalary: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['Calculated', 'Processed', 'Pending', 'On Hold', 'Paid'],
      default: 'Calculated',
    },
    remarks: { type: String, default: '' },
  },
  { _id: false }
);

// Monthly Payroll Run Schema
const payrollRunSchema = new mongoose.Schema(
  {
    companyId: {
      type: String,
      required: true,
      index: true,
    },
    month: {
      type: String, // Format: YYYY-MM (e.g., "2026-08")
      required: true,
      index: true,
    },
    adminEmail: {
      type: String,
      default: '',
      lowercase: true,
    },
    status: {
      type: String,
      enum: ['Draft', 'Calculated', 'Pending Approval', 'Approved', 'Processed', 'Paid'],
      default: 'Calculated',
    },
    approvalStatus: {
      type: String,
      enum: ['Draft', 'Pending Approval', 'Approved', 'Rejected'],
      default: 'Draft',
    },
    approvedBy: { type: String, default: '' },
    approvedAt: { type: String, default: '' },
    totalEmployees: { type: Number, default: 0 },
    totalGross: { type: Number, default: 0 },
    totalDeductions: { type: Number, default: 0 },
    totalNet: { type: Number, default: 0 },
    totalOvertime: { type: Number, default: 0 },
    totalPF: { type: Number, default: 0 },
    totalESI: { type: Number, default: 0 },
    totalPT: { type: Number, default: 0 },
    totalTDS: { type: Number, default: 0 },
    records: [payrollRecordSchema],
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

payrollRunSchema.index({ companyId: 1, month: 1 }, { unique: true });

// Salary Slip Schema
const salarySlipSchema = new mongoose.Schema(
  {
    companyId: { type: String, required: true, index: true },
    slipNumber: { type: String, required: true, index: true },
    employeeId: { type: String, required: true, index: true },
    employeeName: { type: String, required: true },
    month: { type: String, required: true }, // "2026-08"
    monthLabel: { type: String, default: '' }, // "August 2026"
    designation: { type: String, default: '' },
    department: { type: String, default: '' },
    clientName: { type: String, default: '' },
    site: { type: String, default: '' },
    bankName: { type: String, default: '' },
    bankAccountNo: { type: String, default: '' },
    pan: { type: String, default: '' },
    uan: { type: String, default: '' },
    pfNo: { type: String, default: '' },
    esicNo: { type: String, default: '' },
    workingDays: { type: Number, default: 30 },
    presentDays: { type: Number, default: 0 },
    paidDays: { type: Number, default: 0 },
    lopDays: { type: Number, default: 0 },
    grossSalary: { type: Number, default: 0 },
    totalDeductions: { type: Number, default: 0 },
    netSalary: { type: Number, default: 0 },
    netSalaryInWords: { type: String, default: '' },
    earningsBreakdown: { type: mongoose.Schema.Types.Mixed, default: {} },
    deductionsBreakdown: { type: mongoose.Schema.Types.Mixed, default: {} },
    companyName: { type: String, default: '' },
    companyAddress: { type: String, default: '' },
    companyEmail: { type: String, default: '' },
    companyPhone: { type: String, default: '' },
    companyGstin: { type: String, default: '' },
    companyPan: { type: String, default: '' },
    companyLogo: { type: String, default: null },
    status: { type: String, enum: ['Draft', 'Generated', 'Published', 'Emailed'], default: 'Generated' },
    generatedDate: { type: String, default: '' },
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

salarySlipSchema.index({ companyId: 1, employeeId: 1, month: 1 }, { unique: true });

// Rate Revision Schema
const rateRevisionSchema = new mongoose.Schema(
  {
    companyId: { type: String, required: true, index: true },
    revisionId: { type: String, required: true, unique: true },
    employeeId: { type: String, required: true, index: true },
    employeeName: { type: String, required: true },
    designation: { type: String, default: '' },
    department: { type: String, default: '' },
    clientName: { type: String, default: '' },
    previousGross: { type: Number, required: true, default: 0 },
    revisedGross: { type: Number, required: true, default: 0 },
    incrementAmount: { type: Number, default: 0 },
    incrementPercentage: { type: Number, default: 0 },
    effectiveDate: { type: String, required: true },
    reason: { type: String, default: 'Annual Performance Appraisal' },
    approvedBy: { type: String, default: 'Management' },
    status: { type: String, enum: ['Draft', 'Pending Approval', 'Approved', 'Applied', 'Rejected'], default: 'Approved' },
    remarks: { type: String, default: '' },
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

// Arrears Schema
const arrearSchema = new mongoose.Schema(
  {
    companyId: { type: String, required: true, index: true },
    arrearId: { type: String, required: true, unique: true },
    employeeId: { type: String, required: true, index: true },
    employeeName: { type: String, required: true },
    designation: { type: String, default: '' },
    department: { type: String, default: '' },
    fromMonth: { type: String, required: true }, // "2026-04"
    toMonth: { type: String, required: true },   // "2026-06"
    monthsCount: { type: Number, default: 1 },
    monthlyDifference: { type: Number, default: 0 },
    totalArrearAmount: { type: Number, required: true, default: 0 },
    disbursementMonth: { type: String, required: true }, // "2026-08"
    reason: { type: String, default: 'Retrospective Wage Revision' },
    status: { type: String, enum: ['Pending', 'Approved', 'Paid', 'Cancelled'], default: 'Pending' },
    approvedBy: { type: String, default: '' },
    remarks: { type: String, default: '' },
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

export const PayrollRun = mongoose.model('PayrollRun', payrollRunSchema);
export const SalarySlip = mongoose.model('SalarySlip', salarySlipSchema);
export const RateRevision = mongoose.model('RateRevision', rateRevisionSchema);
export const Arrear = mongoose.model('Arrear', arrearSchema);

export default {
  PayrollRun,
  SalarySlip,
  RateRevision,
  Arrear,
};
