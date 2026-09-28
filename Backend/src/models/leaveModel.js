import mongoose from 'mongoose';

const leaveSchema = new mongoose.Schema(
  {
    leaveId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    companyId: {
      type: String,
      required: true,
      index: true,
    },
    adminEmail: {
      type: String,
      required: true,
      lowercase: true,
      index: true,
    },
    employeeId: {
      type: String,
      required: [true, 'Employee ID is required'],
      trim: true,
      index: true,
    },
    employeeName: {
      type: String,
      required: [true, 'Employee Name is required'],
      trim: true,
    },
    employeeAvatar: {
      type: String,
      default: null,
    },
    initials: {
      type: String,
      default: 'EM',
      trim: true,
    },
    employeeRole: {
      type: String,
      default: 'Security Personnel',
      trim: true,
    },
    department: {
      type: String,
      default: 'Security',
      trim: true,
    },
    site: {
      type: String,
      default: 'Main Site',
      trim: true,
    },
    clientName: {
      type: String,
      default: 'RR Security',
      trim: true,
    },
    leaveCode: {
      type: String,
      required: true,
      default: 'CL',
      trim: true,
    },
    leaveType: {
      type: String,
      required: true,
      default: 'Casual Leave',
      trim: true,
    },
    category: {
      type: String,
      enum: ['Paid', 'Unpaid', 'Special'],
      default: 'Paid',
    },
    durationType: {
      type: String,
      enum: ['Full Day', 'Half Day', 'Short Leave', 'Multiple Days'],
      default: 'Full Day',
    },
    halfDayType: {
      type: String,
      default: null,
    },
    shortLeaveTime: {
      start: { type: String, default: null },
      end: { type: String, default: null },
    },
    fromDate: {
      type: String,
      required: [true, 'From Date is required'],
    },
    toDate: {
      type: String,
      required: [true, 'To Date is required'],
    },
    days: {
      type: Number,
      required: true,
      default: 1,
    },
    dateBreakdown: [
      {
        date: { type: String, required: true },
        dayType: { type: String, default: 'Full Day' },
        units: { type: Number, default: 1 },
      },
    ],
    reason: {
      type: String,
      required: [true, 'Reason for leave is required'],
      trim: true,
    },
    remarks: {
      type: String,
      default: null,
      trim: true,
    },
    handoverNotes: {
      type: String,
      default: null,
      trim: true,
    },
    supportingDocName: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: [
        'Approved',
        'Pending',
        'Pending Supervisor Approval',
        'Pending HR Approval',
        'Rejected',
        'Cancelled',
        'Sent Back',
      ],
      default: 'Pending',
      index: true,
    },
    appliedBy: {
      type: String,
      default: 'Admin',
    },
    workflowStage: {
      type: Number,
      default: 1,
    },
    currentApprover: {
      type: String,
      default: 'Site Supervisor',
    },
    processedOn: {
      type: String,
      default: null,
    },
    processedBy: {
      type: String,
      default: null,
    },
    rejectionReason: {
      type: String,
      default: null,
    },
    sendBackReason: {
      type: String,
      default: null,
    },
    timeline: [
      {
        stage: { type: String, required: true },
        actor: { type: String, default: 'System' },
        status: { type: String, default: 'Pending' },
        timestamp: { type: String, default: null },
        remarks: { type: String, default: null },
      },
    ],
    attendanceImpact: {
      status: { type: String, default: 'Leave' },
      dailyCode: { type: String, default: 'L-CL' },
      dateRange: { type: String, default: '' },
      stage: { type: String, default: 'Attendance Update' },
      remarks: { type: String, default: '' },
      paidLeaveDays: { type: Number, default: 1 },
    },
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

leaveSchema.index({ companyId: 1, employeeId: 1, fromDate: 1 });

const Leave = mongoose.model('Leave', leaveSchema);
export default Leave;
