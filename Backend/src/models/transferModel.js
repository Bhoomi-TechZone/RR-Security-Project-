import mongoose from 'mongoose';

const transferSchema = new mongoose.Schema(
  {
    companyId: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    transferId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    employeeId: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    employeeMongoId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
    },
    employeeName: {
      type: String,
      required: true,
      trim: true,
    },
    designation: {
      type: String,
      default: 'Staff',
      trim: true,
    },
    department: {
      type: String,
      default: 'General',
      trim: true,
    },
    fromClientId: {
      type: String,
      default: '',
      trim: true,
    },
    fromClient: {
      type: String,
      default: 'Not Assigned',
      trim: true,
    },
    fromSite: {
      type: String,
      default: 'Headquarters',
      trim: true,
    },
    toClientId: {
      type: String,
      default: '',
      trim: true,
    },
    toClient: {
      type: String,
      required: true,
      trim: true,
    },
    toSite: {
      type: String,
      required: true,
      trim: true,
    },
    effectiveDate: {
      type: String, // Format: YYYY-MM-DD
      required: true,
      trim: true,
    },
    reason: {
      type: String,
      default: 'Project Reassignment',
      trim: true,
    },
    remarks: {
      type: String,
      default: '',
      trim: true,
    },
    transferredBy: {
      type: String,
      default: 'Administrator',
      trim: true,
    },
    status: {
      type: String,
      enum: ['Completed', 'Pending', 'Cancelled'],
      default: 'Completed',
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc, ret) {
        ret.id = ret.transferId || ret._id.toString();
        ret.date = ret.effectiveDate;
        delete ret.__v;
        return ret;
      },
    },
  }
);

transferSchema.index({ companyId: 1, effectiveDate: -1 });

export default mongoose.model('Transfer', transferSchema);
