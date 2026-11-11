import mongoose from 'mongoose';

const candidateSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      index: true,
      trim: true
    },
    candidateId: {
      type: String,
      index: true,
      trim: true
    },
    companyId: {
      type: String,
      required: [true, 'Company ID is required for company data isolation'],
      index: true,
      trim: true
    },
    companyName: {
      type: String,
      default: '',
      trim: true
    },
    adminEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true
    },
    name: {
      type: String,
      required: [true, 'Candidate name is required'],
      trim: true
    },
    mobile: {
      type: String,
      required: [true, 'Mobile number is required'],
      trim: true
    },
    altMobile: {
      type: String,
      default: '',
      trim: true
    },
    whatsapp: {
      type: String,
      default: '',
      trim: true
    },
    email: {
      type: String,
      default: '',
      trim: true,
      lowercase: true
    },
    address: {
      type: String,
      default: '',
      trim: true
    },
    city: {
      type: String,
      default: '',
      trim: true
    },
    state: {
      type: String,
      default: '',
      trim: true
    },
    pincode: {
      type: String,
      default: '',
      trim: true
    },
    jobCategory: {
      type: String,
      default: 'Security Guard',
      trim: true
    },
    jobCategories: {
      type: [String],
      default: []
    },
    appliedFor: {
      type: String,
      default: 'Security Guard',
      trim: true
    },
    experience: {
      type: String,
      default: 'Experienced',
      trim: true
    },
    totalExperienceYears: {
      type: Number,
      default: 0
    },
    lastCompany: {
      type: String,
      default: '',
      trim: true
    },
    lastSalary: {
      type: Number,
      default: 0
    },
    expectedSalary: {
      type: Number,
      default: 0
    },
    minExpectedSalary: {
      type: Number,
      default: 0
    },
    maxExpectedSalary: {
      type: Number,
      default: 0
    },
    preferredLocation: {
      type: String,
      default: '',
      trim: true
    },
    photo: {
      type: String,
      default: ''
    },
    photoName: {
      type: String,
      default: ''
    },
    resumeUrl: {
      type: String,
      default: ''
    },
    resumeName: {
      type: String,
      default: ''
    },
    resumeSize: {
      type: String,
      default: ''
    },
    skills: {
      type: [String],
      default: []
    },
    source: {
      type: String,
      default: 'Walk-in',
      trim: true
    },
    registrationDate: {
      type: String,
      default: () => new Date().toISOString().split('T')[0]
    },
    status: {
      type: String,
      enum: ['applied', 'selected', 'on_hold', 'rejected', 'moved_to_onboarding'],
      default: 'applied',
      index: true
    },
    remarks: {
      type: String,
      default: ''
    },
    interviews: {
      type: Array,
      default: []
    }
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc, ret) {
        ret._id = ret._id ? ret._id.toString() : ret.id;
        delete ret.__v;
        return ret;
      }
    }
  }
);

// Compound index for strict company isolation & fast querying
candidateSchema.index({ companyId: 1, adminEmail: 1, createdAt: -1 });
candidateSchema.index({ companyId: 1, id: 1 }, { unique: true });

const Candidate = mongoose.models.Candidate || mongoose.model('Candidate', candidateSchema);

export default Candidate;

