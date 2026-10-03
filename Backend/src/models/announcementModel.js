import mongoose from 'mongoose';

const announcementSchema = new mongoose.Schema(
  {
    announcementId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true
    },
    companyId: {
      type: String,
      required: [true, 'Company ID is required for announcement isolation'],
      index: true,
      trim: true
    },
    title: {
      type: String,
      required: [true, 'Announcement title is required'],
      trim: true
    },
    message: {
      type: String,
      required: [true, 'Announcement message is required'],
      trim: true
    },
    audience: {
      type: String,
      enum: ['all', 'clients', 'employees'],
      default: 'all',
      index: true
    },
    // Targeted Client (if audience === 'clients')
    companyIdTarget: {
      type: String,
      default: null,
      trim: true
    },
    companyName: {
      type: String,
      default: null,
      trim: true
    },
    targetClientId: {
      type: String,
      default: null,
      trim: true
    },
    targetClientName: {
      type: String,
      default: null,
      trim: true
    },
    // Targeted Employee (if audience === 'employees')
    employeeId: {
      type: String,
      default: null,
      trim: true
    },
    employeeName: {
      type: String,
      default: null,
      trim: true
    },
    targetDepartment: {
      type: String,
      default: null,
      trim: true
    },
    priority: {
      type: String,
      enum: ['normal', 'important', 'urgent'],
      default: 'normal'
    },
    status: {
      type: String,
      enum: ['published', 'draft', 'archived'],
      default: 'published',
      index: true
    },
    createdBy: {
      type: String,
      default: 'Admin',
      trim: true
    },
    createdDate: {
      type: String,
      default: () => new Date().toISOString().slice(0, 10)
    }
  },
  {
    timestamps: true
  }
);

// Compound index for querying by company and audience
announcementSchema.index({ companyId: 1, audience: 1, status: 1 });

const Announcement = mongoose.model('Announcement', announcementSchema);

export default Announcement;
