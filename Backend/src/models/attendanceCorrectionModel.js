import mongoose from 'mongoose';

const attendanceCorrectionSchema = new mongoose.Schema(
  {
    correctionId: {
      type: String,
      trim: true,
      index: true,
    },
    attendanceId: {
      type: String,
      trim: true,
    },
    employeeId: {
      type: String,
      required: true,
      trim: true,
    },
    employeeName: {
      type: String,
      required: true,
      trim: true,
    },
    initials: {
      type: String,
      default: 'EM',
    },
    clientName: {
      type: String,
      default: '',
    },
    companyName: {
      type: String,
      default: '',
    },
    site: {
      type: String,
      default: 'Main Site',
    },
    date: {
      type: String,
      required: true,
    },
    originalCheckIn: {
      type: String,
      default: null,
    },
    originalCheckOut: {
      type: String,
      default: null,
    },
    originalStatus: {
      type: String,
      default: 'present',
    },
    requestedCheckIn: {
      type: String,
      default: null,
    },
    requestedCheckOut: {
      type: String,
      default: null,
    },
    requestedStatus: {
      type: String,
      default: 'Present',
    },
    category: {
      type: String,
      default: 'General',
    },
    reason: {
      type: String,
      required: [true, 'Please provide a reason for the correction'],
      trim: true,
    },
    rejectReason: {
      type: String,
      default: '',
      trim: true,
    },
    adminRemarks: {
      type: String,
      default: '',
      trim: true,
    },
    reviewedBy: {
      type: String,
      default: '',
      trim: true,
    },
    reviewedAt: {
      type: String,
      default: '',
    },
    submittedAt: {
      type: String,
      default: () => new Date().toISOString(),
    },
    submittedBy: {
      type: String,
      default: 'Employee',
    },
    status: {
      type: String,
      enum: ['pendingCorrection', 'approved', 'rejected'],
      default: 'pendingCorrection',
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

const AttendanceCorrection = mongoose.model('AttendanceCorrection', attendanceCorrectionSchema);
export default AttendanceCorrection;
