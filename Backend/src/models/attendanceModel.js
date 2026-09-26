import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema(
  {
    attendanceId: {
      type: String,
      trim: true,
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
    initials: {
      type: String,
      default: 'EM',
      trim: true,
    },
    clientName: {
      type: String,
      default: '',
      trim: true,
    },
    companyName: {
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
    date: {
      type: String, // YYYY-MM-DD
      required: [true, 'Date is required'],
      index: true,
    },
    checkIn: {
      type: String, // e.g. "09:05 AM"
      default: null,
    },
    checkOut: {
      type: String, // e.g. "05:00 PM"
      default: null,
    },
    workingHours: {
      type: String, // e.g. "8h 00m"
      default: null,
    },
    status: {
      type: String,
      enum: ['present', 'absent', 'halfDay', 'onLeave', 'late', 'pendingCorrection'],
      default: 'present',
      index: true,
    },
    lateMinutes: {
      type: Number,
      default: 0,
    },
    earlyOutMinutes: {
      type: Number,
      default: 0,
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

// Compound index to ensure uniqueness per employee per date per company
attendanceSchema.index({ companyId: 1, employeeId: 1, date: 1 }, { unique: false });

const Attendance = mongoose.model('Attendance', attendanceSchema);
export default Attendance;
