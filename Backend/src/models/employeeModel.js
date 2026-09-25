import mongoose from 'mongoose';

const employeeSchema = new mongoose.Schema(
  {
    employeeId: {
      type: String,
      required: [true, 'Employee ID is required'],
      trim: true,
      index: true,
    },
    companyId: {
      type: String,
      required: [true, 'Admin Company ID is required for employee association'],
      index: true,
      trim: true,
    },
    clientId: {
      type: String,
      default: '',
      index: true,
      trim: true,
    },
    clientName: {
      type: String,
      default: '',
      trim: true,
    },
    adminEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    name: {
      type: String,
      required: [true, 'Employee Name is required'],
      trim: true,
    },
    fatherHusbandName: { type: String, default: '' },
    fatherHusbandRelation: { type: String, default: '' },
    gender: { type: String, default: 'Male' },
    dob: { type: String, default: '' },
    contact: { type: String, default: '' },
    email: { type: String, default: '' },
    maritalStatus: { type: String, default: '' },
    bloodGroup: { type: String, default: '' },
    nationality: { type: String, default: 'Indian' },
    employeePhoto: { type: String, default: '' },

    // Employment
    employeeType: { type: String, default: 'Permanent' },
    department: { type: String, default: 'Security' },
    designation: { type: String, default: 'Security Guard' },
    siteLocation: { type: String, default: '' },
    dutyPost: { type: String, default: '' },
    shift: { type: String, default: '' },
    joiningDate: { type: String, default: '' },
    reportingSupervisor: { type: String, default: '' },
    qualification: { type: String, default: '' },
    status: {
      type: String,
      enum: ['Active', 'Inactive', 'On Leave', 'Terminated'],
      default: 'Active',
    },

    // Salary & Statutory
    salaryType: { type: String, default: 'Monthly' },
    salaryStructureType: { type: String, default: 'Regular' },
    grossSalary: { type: Number, default: 0 },
    basic: { type: Number, default: 0 },
    vda: { type: Number, default: 0 },
    hra: { type: Number, default: 0 },
    conveyance: { type: Number, default: 0 },
    otherAllowance: { type: Number, default: 0 },
    specialAllowance: { type: Number, default: 0 },
    pan: { type: String, default: '' },
    aadhaar: { type: String, default: '' },
    uan: { type: String, default: '' },
    pfNo: { type: String, default: '' },
    esicNo: { type: String, default: '' },

    // Bank Details
    bankName: { type: String, default: '' },
    branchName: { type: String, default: '' },
    accountNumber: { type: String, default: '' },
    ifsc: { type: String, default: '' },
    accountHolder: { type: String, default: '' },

    // Addresses
    presentAddress: { type: String, default: '' },
    permanentAddress: { type: String, default: '' },
    familyMembers: { type: Array, default: [] },
    documents: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc, ret) {
        ret.id = ret.employeeId || ret._id.toString();
        delete ret.__v;
        return ret;
      },
    },
  }
);

const Employee = mongoose.model('Employee', employeeSchema);
export default Employee;
