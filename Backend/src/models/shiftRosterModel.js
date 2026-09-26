import mongoose from 'mongoose';

const shiftRosterSchema = new mongoose.Schema(
  {
    companyId: {
      type: String,
      required: true,
      index: true
    },
    adminEmail: {
      type: String,
      required: true,
      index: true
    },
    employeeId: {
      type: String,
      required: true,
      index: true
    },
    employeeName: {
      type: String,
      required: true
    },
    initials: {
      type: String,
      default: 'EM'
    },
    clientId: {
      type: String,
      default: ''
    },
    clientName: {
      type: String,
      default: ''
    },
    site: {
      type: String,
      default: 'Main Site'
    },
    department: {
      type: String,
      default: 'Security'
    },
    shiftId: {
      type: String,
      default: null
    },
    shiftName: {
      type: String,
      default: 'Unassigned'
    },
    shiftType: {
      type: String,
      enum: ['day', 'night', 'rotational', null],
      default: 'day'
    },
    startTime: {
      type: String,
      default: ''
    },
    endTime: {
      type: String,
      default: ''
    },
    date: {
      type: String, // YYYY-MM-DD
      required: true,
      index: true
    },
    startDate: {
      type: String
    },
    endDate: {
      type: String
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'unassigned'],
      default: 'active'
    }
  },
  {
    timestamps: true
  }
);

// Compound index to quickly find roster for an employee on a given date in a company
shiftRosterSchema.index({ companyId: 1, adminEmail: 1, employeeId: 1, date: 1 }, { unique: true });

shiftRosterSchema.methods.toJSON = function () {
  const obj = this.toObject();
  obj.id = obj._id.toString();
  return obj;
};

const ShiftRoster = mongoose.model('ShiftRoster', shiftRosterSchema);
export default ShiftRoster;
