import mongoose from 'mongoose';

const auditTrailSchema = new mongoose.Schema({
  action: { type: String, required: true },
  by: { type: String, default: 'Admin' },
  date: { type: String, default: () => new Date().toISOString().slice(0, 10) },
  notes: { type: String, default: '' },
}, { _id: false });

const reimbursementClaimSchema = new mongoose.Schema({
  companyId: {
    type: String,
    required: true,
    index: true,
  },
  adminEmail: {
    type: String,
    lowercase: true,
    trim: true,
  },
  claimId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  employeeId: {
    type: String,
    required: true,
    index: true,
  },
  employeeCode: {
    type: String,
    default: '',
  },
  employeeName: {
    type: String,
    required: true,
  },
  department: {
    type: String,
    default: 'General',
  },
  designation: {
    type: String,
    default: 'Staff',
  },
  site: {
    type: String,
    default: 'Main Site',
  },
  clientName: {
    type: String,
    default: 'RR Security',
  },
  expenseType: {
    type: String,
    required: true,
  },
  expenseCategory: {
    type: String,
    default: 'Operations',
  },
  expenseDate: {
    type: String,
    required: true,
  },
  claimMonth: {
    type: String,
    default: '',
  },
  claimYear: {
    type: Number,
    default: () => new Date().getFullYear(),
  },
  claimedAmount: {
    type: Number,
    required: true,
    min: 0,
  },
  approvedAmount: {
    type: Number,
    default: 0,
    min: 0,
  },
  currency: {
    type: String,
    default: 'INR',
  },
  description: {
    type: String,
    default: '',
  },
  receiptNumber: {
    type: String,
    default: '',
  },
  merchantName: {
    type: String,
    default: '',
  },
  billAttachmentUrl: {
    type: String,
    default: '',
  },
  receiptsCount: {
    type: Number,
    default: 1,
  },
  approvalStatus: {
    type: String,
    enum: ['Pending Approval', 'Approved', 'Rejected', 'Sent Back', 'Draft'],
    default: 'Pending Approval',
    index: true,
  },
  paymentStatus: {
    type: String,
    enum: ['Unpaid', 'Ready for Payment', 'Processing', 'Paid'],
    default: 'Unpaid',
    index: true,
  },
  paymentMethod: {
    type: String,
    enum: ['Bank Transfer', 'Direct Deposit', 'Cash', 'Payroll Adjustment', 'UPI', 'Cheque', '—'],
    default: '—',
  },
  paymentReference: {
    type: String,
    default: '',
  },
  paymentDate: {
    type: String,
    default: '',
  },
  paidAmount: {
    type: Number,
    default: 0,
  },
  payrollMonth: {
    type: String,
    default: '',
  },
  includedInPayroll: {
    type: Boolean,
    default: false,
  },
  approverName: {
    type: String,
    default: '',
  },
  approverRemarks: {
    type: String,
    default: '',
  },
  approvedDate: {
    type: String,
    default: '',
  },
  rejectionReason: {
    type: String,
    default: '',
  },
  sendBackReason: {
    type: String,
    default: '',
  },
  auditTrail: [auditTrailSchema],
}, {
  timestamps: true,
});

const expenseTypeSchema = new mongoose.Schema({
  companyId: {
    type: String,
    required: true,
    index: true,
  },
  name: {
    type: String,
    required: true,
  },
  code: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    default: 'Operations',
  },
  maxLimit: {
    type: Number,
    default: 50000,
  },
  requiresReceipt: {
    type: Boolean,
    default: true,
  },
  taxExempt: {
    type: Boolean,
    default: true,
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive'],
    default: 'Active',
  },
  description: {
    type: String,
    default: '',
  },
}, {
  timestamps: true,
});

export const ReimbursementClaim = mongoose.model('ReimbursementClaim', reimbursementClaimSchema);
export const ExpenseType = mongoose.model('ExpenseType', expenseTypeSchema);

export default {
  ReimbursementClaim,
  ExpenseType,
};
