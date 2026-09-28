import mongoose from 'mongoose';

const leaveBalanceSchema = new mongoose.Schema(
  {
    companyId: {
      type: String,
      required: true,
      index: true,
    },
    adminEmail: {
      type: String,
      required: true,
      lowercase: true,
    },
    employeeId: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    employeeName: {
      type: String,
      required: true,
    },
    department: {
      type: String,
      default: 'Security',
    },
    policyName: {
      type: String,
      default: 'Standard Security Staff Policy',
    },
    balances: {
      type: mongoose.Schema.Types.Mixed,
      default: {
        CL: { opening: 8, accrued: 4, used: 0, pending: 0 },
        SL: { opening: 6, accrued: 2, used: 0, pending: 0 },
        EL: { opening: 10, accrued: 5, used: 0, pending: 0 },
        LWP: { opening: 0, accrued: 0, used: 0, pending: 0 },
      },
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

leaveBalanceSchema.index({ companyId: 1, employeeId: 1 }, { unique: true });

const LeaveBalance = mongoose.model('LeaveBalance', leaveBalanceSchema);
export default LeaveBalance;
