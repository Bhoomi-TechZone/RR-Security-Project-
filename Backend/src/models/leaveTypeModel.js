import mongoose from 'mongoose';

const leaveTypeSchema = new mongoose.Schema(
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
    code: {
      type: String,
      required: [true, 'Leave code is required'],
      trim: true,
      uppercase: true,
    },
    name: {
      type: String,
      required: [true, 'Leave type name is required'],
      trim: true,
    },
    category: {
      type: String,
      enum: ['Paid', 'Unpaid', 'Special'],
      default: 'Paid',
    },
    quota: {
      type: Number,
      default: 12,
    },
    accrual: {
      type: String,
      enum: ['Monthly', 'Quarterly', 'Annual', 'None'],
      default: 'Annual',
    },
    carryForward: {
      type: Boolean,
      default: false,
    },
    maxCarryForward: {
      type: Number,
      default: 0,
    },
    requiresProof: {
      type: Boolean,
      default: false,
    },
    description: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['Active', 'Inactive'],
      default: 'Active',
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

leaveTypeSchema.index({ companyId: 1, code: 1 }, { unique: true });

const LeaveType = mongoose.model('LeaveType', leaveTypeSchema);
export default LeaveType;
