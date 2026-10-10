import mongoose from 'mongoose';

const overtimeSchema = new mongoose.Schema(
  {
    overtimeId: {
      type: String,
      unique: true,
      index: true,
      trim: true,
    },
    companyId: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    adminEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    employeeId: {
      type: String,
      required: [true, 'Employee ID is required'],
      index: true,
      trim: true,
    },
    employeeName: {
      type: String,
      required: [true, 'Employee Name is required'],
      trim: true,
    },
    clientName: {
      type: String,
      default: '',
      trim: true,
    },
    clientId: {
      type: String,
      default: '',
      trim: true,
    },
    site: {
      type: String,
      default: 'Main Site',
      trim: true,
    },
    department: {
      type: String,
      default: 'Security',
      trim: true,
    },
    designation: {
      type: String,
      default: 'Security Guard',
      trim: true,
    },
    date: {
      type: String, // YYYY-MM-DD
      required: [true, 'Overtime date is required'],
      index: true,
    },
    shift: {
      type: String,
      default: 'Day Shift',
      trim: true,
    },
    startTime: {
      type: String,
      default: '18:00',
    },
    endTime: {
      type: String,
      default: '22:00',
    },
    overtimeHours: {
      type: Number,
      required: [true, 'Overtime hours are required'],
      default: 0,
    },
    overtimeRate: {
      type: Number,
      default: 150,
    },
    overtimeAmount: {
      type: Number,
      default: 0,
    },
    reason: {
      type: String,
      default: 'Staff Shortage / Extended Shift Duty',
      trim: true,
    },
    dutyPost: {
      type: String,
      default: '',
      trim: true,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
      index: true,
    },
    approvedBy: {
      type: String,
      default: '',
      trim: true,
    },
    approvedAt: {
      type: String,
      default: '',
    },
    rejectionReason: {
      type: String,
      default: '',
      trim: true,
    },
    remarks: {
      type: String,
      default: '',
      trim: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (doc, ret) => {
        ret.id = ret.overtimeId || ret._id.toString();
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Pre-save to auto-calculate overtimeAmount and overtimeId
overtimeSchema.pre('save', function () {
  if (!this.overtimeId) {
    this.overtimeId = `OT-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;
  }
  if (this.overtimeHours && this.overtimeRate) {
    this.overtimeAmount = Math.round(this.overtimeHours * this.overtimeRate);
  }
});

const Overtime = mongoose.model('Overtime', overtimeSchema);
export default Overtime;
