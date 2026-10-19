import mongoose from 'mongoose';

const letterSchema = new mongoose.Schema(
  {
    letterId: {
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
    refNo: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    letterType: {
      type: String,
      required: true,
      enum: ['appointment-letter', 'joining-letter', 'experience-letter', 'full-final-letter'],
      index: true,
    },
    templateName: {
      type: String,
      default: '',
      trim: true,
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
      trim: true,
    },
    employeeCode: {
      type: String,
      required: true,
      trim: true,
    },
    designation: {
      type: String,
      default: '',
      trim: true,
    },
    department: {
      type: String,
      default: '',
      trim: true,
    },
    location: {
      type: String,
      default: '',
      trim: true,
    },
    issueDate: {
      type: String,
      required: true,
      default: () => new Date().toISOString().split('T')[0],
    },
    joiningDate: {
      type: String,
      default: '',
    },
    lastWorkingDate: {
      type: String,
      default: '',
    },
    ctc: {
      type: String,
      default: '',
    },
    salary: {
      type: String,
      default: '',
    },
    settlementAmount: {
      type: String,
      default: '',
    },
    probationPeriod: {
      type: String,
      default: '6 Months',
    },
    noticePeriod: {
      type: String,
      default: '30 Days',
    },
    workingHours: {
      type: String,
      default: '9:00 AM - 6:00 PM',
    },
    reportingManager: {
      type: String,
      default: '',
    },
    signatoryName: {
      type: String,
      default: 'Amitabh Sharma',
    },
    signatoryDesignation: {
      type: String,
      default: 'Director - HR',
    },
    status: {
      type: String,
      enum: ['Draft', 'Issued', 'Sent', 'Downloaded', 'Revoked'],
      default: 'Issued',
      index: true,
    },
    subject: {
      type: String,
      default: '',
    },
    headerTitle: {
      type: String,
      default: '',
    },
    content: {
      type: String,
      default: '',
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for querying by company and letter type
letterSchema.index({ companyId: 1, letterType: 1 });
letterSchema.index({ companyId: 1, status: 1 });

const Letter = mongoose.model('Letter', letterSchema);
export default Letter;
