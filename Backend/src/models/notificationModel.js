import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  companyId: {
    type: String,
    required: true,
    index: true,
    trim: true
  },
  adminEmail: {
    type: String,
    lowercase: true,
    trim: true
  },
  recipientRole: {
    type: String,
    enum: ['admin', 'client', 'employee', 'all'],
    default: 'admin',
    index: true
  },
  recipientId: {
    type: String,
    default: 'admin',
    index: true
  },
  type: {
    type: String,
    enum: [
      'asset-request',
      'uniform-request',
      'reimbursement',
      'advance-loan',
      'leave-application',
      'leave-approval',
      'attendance-correction',
      'salary-processed',
      'document-expiry',
      'general'
    ],
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  message: {
    type: String,
    required: true,
    trim: true
  },
  employeeId: {
    type: String,
    default: ''
  },
  employeeName: {
    type: String,
    default: ''
  },
  clientName: {
    type: String,
    default: ''
  },
  targetModule: {
    type: String,
    default: ''
  },
  targetUrl: {
    type: String,
    default: ''
  },
  referenceId: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['unread', 'read'],
    default: 'unread',
    index: true
  },
  actionStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'none'],
    default: 'pending',
    index: true
  },
  actionTakenAt: {
    type: Date,
    default: null
  },
  actionTakenBy: {
    type: String,
    default: null
  },
  priority: {
    type: String,
    enum: ['normal', 'important', 'urgent'],
    default: 'normal'
  },
  date: {
    type: String,
    default: () => new Date().toISOString().slice(0, 10)
  }
}, {
  timestamps: true
});

const Notification = mongoose.model('Notification', notificationSchema);
export default Notification;
