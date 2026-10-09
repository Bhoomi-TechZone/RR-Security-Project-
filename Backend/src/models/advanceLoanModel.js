import mongoose from 'mongoose';

const auditTrailSchema = new mongoose.Schema({
  action: { type: String, required: true },
  by: { type: String, default: 'Admin' },
  date: { type: String, default: () => new Date().toISOString().slice(0, 10) },
  notes: { type: String, default: '' }
}, { _id: false });

const installmentSchema = new mongoose.Schema({
  month: { type: String, required: true }, // e.g. "2026-09"
  amount: { type: Number, required: true },
  status: { type: String, enum: ['pending', 'deducted', 'skipped'], default: 'pending' },
  deductionDate: { type: String, default: null },
  payslipId: { type: String, default: null }
}, { _id: false });

const advanceLoanRequestSchema = new mongoose.Schema({
  companyId: {
    type: String,
    required: true,
    index: true
  },
  adminEmail: {
    type: String,
    lowercase: true,
    trim: true
  },
  requestId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  employeeId: {
    type: String,
    required: true,
    index: true
  },
  employeeCode: {
    type: String,
    default: ''
  },
  employeeName: {
    type: String,
    required: true
  },
  initials: {
    type: String,
    default: ''
  },
  department: {
    type: String,
    default: 'Operations'
  },
  designation: {
    type: String,
    default: 'Staff'
  },
  site: {
    type: String,
    default: 'Main Site'
  },
  clientId: {
    type: String,
    default: ''
  },
  clientName: {
    type: String,
    default: 'RR Security'
  },
  currentSalary: {
    type: Number,
    default: 0
  },
  type: {
    type: String,
    enum: ['advance', 'loan'],
    required: true,
    index: true
  },
  amount: {
    type: Number,
    required: true,
    min: 1
  },
  interestRate: {
    type: Number,
    default: 0
  },
  totalInterest: {
    type: Number,
    default: 0
  },
  totalRepayable: {
    type: Number,
    required: true,
    min: 1
  },
  reason: {
    type: String,
    required: true
  },
  otherReason: {
    type: String,
    default: ''
  },
  requestDate: {
    type: String,
    required: true,
    default: () => new Date().toISOString().slice(0, 10)
  },
  deductionMethod: {
    type: String,
    enum: ['salary-adjustment', 'monthly-emi'],
    default: 'salary-adjustment'
  },
  adjustmentMonth: {
    type: String,
    default: ''
  },
  emiAmount: {
    type: Number,
    default: 0
  },
  numberOfMonths: {
    type: Number,
    default: 1
  },
  firstDeductionMonth: {
    type: String,
    default: ''
  },
  approvedAmount: {
    type: Number,
    default: 0
  },
  approvedDate: {
    type: String,
    default: null
  },
  approvedBy: {
    type: String,
    default: null
  },
  deductedAmount: {
    type: Number,
    default: 0
  },
  remainingAmount: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'completed'],
    default: 'pending',
    index: true
  },
  rejectionReason: {
    type: String,
    default: null
  },
  remarks: {
    type: String,
    default: ''
  },
  auditTrail: {
    type: [auditTrailSchema],
    default: []
  }
}, {
  timestamps: true
});

const deductionScheduleSchema = new mongoose.Schema({
  companyId: {
    type: String,
    required: true,
    index: true
  },
  requestId: {
    type: String,
    required: true,
    index: true
  },
  employeeId: {
    type: String,
    required: true,
    index: true
  },
  employeeName: {
    type: String,
    required: true
  },
  initials: {
    type: String,
    default: ''
  },
  clientName: {
    type: String,
    default: 'RR Security'
  },
  type: {
    type: String,
    enum: ['advance', 'loan'],
    required: true
  },
  approvedAmount: {
    type: Number,
    required: true
  },
  monthlyDeduction: {
    type: Number,
    required: true
  },
  totalMonths: {
    type: Number,
    required: true,
    default: 1
  },
  deductedAmount: {
    type: Number,
    default: 0
  },
  remainingAmount: {
    type: Number,
    required: true
  },
  nextDeductionMonth: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'paused'],
    default: 'active',
    index: true
  },
  installments: {
    type: [installmentSchema],
    default: []
  }
}, {
  timestamps: true
});

const deductionHistorySchema = new mongoose.Schema({
  companyId: {
    type: String,
    required: true,
    index: true
  },
  requestId: {
    type: String,
    required: true,
    index: true
  },
  employeeId: {
    type: String,
    required: true,
    index: true
  },
  employeeName: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['advance', 'loan'],
    required: true
  },
  month: {
    type: String,
    required: true
  },
  deductionDate: {
    type: String,
    required: true,
    default: () => new Date().toISOString().slice(0, 10)
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  salaryMonth: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['deducted', 'pending', 'failed'],
    default: 'deducted'
  },
  payrollCycleId: {
    type: String,
    default: ''
  },
  remarks: {
    type: String,
    default: 'Salary deduction'
  }
}, {
  timestamps: true
});

export const AdvanceLoanRequest = mongoose.model('AdvanceLoanRequest', advanceLoanRequestSchema);
export const DeductionSchedule = mongoose.model('DeductionSchedule', deductionScheduleSchema);
export const DeductionHistory = mongoose.model('DeductionHistory', deductionHistorySchema);
