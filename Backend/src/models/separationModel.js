import mongoose from 'mongoose';

const clearanceSchema = new mongoose.Schema({
  status: {
    type: String,
    enum: ['Pending', 'Cleared', 'Rejected'],
    default: 'Pending'
  },
  clearedBy: {
    type: String,
    default: 'Pending Assignment'
  },
  clearedDate: {
    type: String,
    default: '—'
  },
  remarks: {
    type: String,
    default: ''
  }
}, { _id: false });

const approvalStageSchema = new mongoose.Schema({
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected'],
    default: 'Pending'
  },
  approver: {
    type: String,
    default: ''
  },
  date: {
    type: String,
    default: '—'
  },
  remarks: {
    type: String,
    default: ''
  }
}, { _id: false });

const separationSchema = new mongoose.Schema({
  companyId: {
    type: String,
    required: true,
    index: true,
    trim: true
  },
  settlementId: {
    type: String,
    required: true,
    index: true,
    trim: true
  },
  employeeId: {
    type: String,
    required: true,
    index: true,
    trim: true
  },
  employeeCode: {
    type: String,
    default: '',
    index: true
  },
  employeeName: {
    type: String,
    required: true,
    trim: true
  },
  avatar: {
    type: String,
    default: null
  },
  designation: {
    type: String,
    default: 'Staff Member'
  },
  department: {
    type: String,
    default: 'Security'
  },
  client: {
    type: String,
    default: ''
  },
  site: {
    type: String,
    default: ''
  },
  dateOfJoining: {
    type: String,
    default: ''
  },
  exitType: {
    type: String,
    enum: [
      'Resignation',
      'Termination',
      'Absconding',
      'Retirement',
      'Contract End',
      'Medical Ground',
      'Other'
    ],
    default: 'Resignation'
  },
  resignationDate: {
    type: String,
    required: true
  },
  lastWorkingDay: {
    type: String,
    required: true
  },
  separationReason: {
    type: String,
    required: true,
    trim: true
  },
  noticePeriodRequiredDays: {
    type: Number,
    default: 30
  },
  noticePeriodServedDays: {
    type: Number,
    default: 0
  },
  noticeShortfallDays: {
    type: Number,
    default: 0
  },
  monthlyGrossSalary: {
    type: Number,
    default: 0
  },
  basicSalary: {
    type: Number,
    default: 0
  },
  perDayWage: {
    type: Number,
    default: 0
  },
  tenureYears: {
    type: Number,
    default: 0
  },
  tryingToRetain: {
    type: Boolean,
    default: false
  },
  isRetained: {
    type: Boolean,
    default: false
  },
  retentionRemarks: {
    type: String,
    default: ''
  },
  clearances: {
    hr: { type: clearanceSchema, default: () => ({}) },
    operations: { type: clearanceSchema, default: () => ({}) },
    accounts: { type: clearanceSchema, default: () => ({}) },
    admin: { type: clearanceSchema, default: () => ({}) },
    inventory: { type: clearanceSchema, default: () => ({}) },
    client: { type: clearanceSchema, default: () => ({}) }
  },
  attendance: {
    presentDays: { type: Number, default: 0 },
    absentDays: { type: Number, default: 0 },
    overtimeHours: { type: Number, default: 0 },
    weeklyOffs: { type: Number, default: 0 },
    holidays: { type: Number, default: 0 },
    leaveBalance: { type: Number, default: 0 }
  },
  salaryDues: {
    pendingSalary: { type: Number, default: 0 },
    overtimePay: { type: Number, default: 0 },
    incentives: { type: Number, default: 0 },
    arrears: { type: Number, default: 0 },
    bonus: { type: Number, default: 0 }
  },
  deductions: {
    noticeRecovery: { type: Number, default: 0 },
    advanceRecovery: { type: Number, default: 0 },
    loanRecovery: { type: Number, default: 0 },
    uniformPenalty: { type: Number, default: 0 },
    otherDeductions: { type: Number, default: 0 }
  },
  statutoryBenefits: {
    employeePf: { type: Number, default: 0 },
    employeeEsi: { type: Number, default: 0 },
    gratuityAmount: { type: Number, default: 0 },
    leaveEncashment: { type: Number, default: 0 }
  },
  finalSettlement: {
    totalEarnings: { type: Number, default: 0 },
    totalDeductions: { type: Number, default: 0 },
    netPayable: { type: Number, default: 0 }
  },
  approvalWorkflow: {
    currentStage: {
      type: String,
      default: 'hr_review'
    },
    isFullyApproved: {
      type: Boolean,
      default: false
    },
    stages: {
      hr_review: { type: approvalStageSchema, default: () => ({ approver: 'HR Manager' }) },
      ops_review: { type: approvalStageSchema, default: () => ({ approver: 'Operations Head' }) },
      accounts_review: { type: approvalStageSchema, default: () => ({ approver: 'Accounts Head' }) },
      final_approval: { type: approvalStageSchema, default: () => ({ approver: 'Managing Director' }) }
    }
  },
  payment: {
    mode: { type: String, default: 'Bank Transfer (NEFT)' },
    paymentDate: { type: String, default: '' },
    bankName: { type: String, default: '' },
    accountNo: { type: String, default: '' },
    ifsc: { type: String, default: '' },
    utrNo: { type: String, default: '' },
    status: { type: String, default: 'Pending' }
  },
  documents: {
    fnfStatementGenerated: { type: Boolean, default: false },
    relievingLetterGenerated: { type: Boolean, default: false },
    exitPayslipGenerated: { type: Boolean, default: false }
  },
  settlementStatus: {
    type: String,
    enum: [
      'Pending Clearance',
      'Pending Approval',
      'Approved for Payout',
      'Settled / Disbursed',
      'Cancelled'
    ],
    default: 'Pending Clearance',
    index: true
  },
  remarks: {
    type: String,
    default: ''
  },
  isRehired: {
    type: Boolean,
    default: false
  },
  rehireDate: {
    type: String,
    default: ''
  },
  createdBy: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Composite index for fast company-isolated querying
separationSchema.index({ companyId: 1, settlementStatus: 1 });
separationSchema.index({ companyId: 1, lastWorkingDay: 1 });
separationSchema.index({ companyId: 1, employeeId: 1 });

const Separation = mongoose.model('Separation', separationSchema);

export default Separation;

