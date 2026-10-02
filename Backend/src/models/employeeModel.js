import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const employeeSchema = new mongoose.Schema(
  {
    employeeId: {
      type: String,
      required: [true, 'Employee ID is required'],
      trim: true,
      index: true,
    },
    employeeCode: {
      type: String,
      trim: true,
      index: true,
    },
    companyId: {
      type: String,
      required: [true, 'Admin Company ID is required for employee association'],
      index: true,
      trim: true,
    },
    companyName: {
      type: String,
      default: '',
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
    mobile: { type: String, default: '' },
    alternateMobile: { type: String, default: '' },
    emergencyMobile: { type: String, default: '' },
    email: { type: String, default: '' },
    maritalStatus: { type: String, default: '' },
    spouseName: { type: String, default: '' },
    bloodGroup: { type: String, default: '' },
    religion: { type: String, default: '' },
    nationality: { type: String, default: 'Indian' },
    employeePhoto: { type: String, default: '' },
    photo: { type: String, default: '' },

    // Portal Access & Authentication Credentials
    password: {
      type: String,
      default: '',
      select: false,
    },
    savedPassword: {
      type: String,
      default: '',
    },
    enablePortalAccess: {
      type: Boolean,
      default: true,
    },
    role: {
      type: String,
      default: 'employee',
    },

    // Employment
    employeeType: { type: String, default: 'Permanent' },
    department: { type: String, default: 'Security' },
    designation: { type: String, default: 'Security Guard' },
    siteLocation: { type: String, default: '' },
    site: { type: String, default: '' },
    dutyPost: { type: String, default: '' },
    shift: { type: String, default: '' },
    joiningDate: { type: String, default: '' },
    reportingSupervisor: { type: String, default: '' },
    joiningLocation: { type: String, default: '' },
    previousExperience: { type: String, default: '' },
    language: { type: String, default: '' },
    qualification: { type: String, default: '' },
    technicalQualification: { type: String, default: '' },
    employeeStatus: { type: String, default: 'Active' },
    status: {
      type: String,
      default: 'Active',
    },
    exitDate: { type: String, default: '' },
    exitReason: { type: String, default: '' },
    exitDateReason: { type: String, default: '' },

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
    minimumWageCategory: { type: String, default: '' },
    overtimeRate: { type: Number, default: 0 },
    bonus: { type: Number, default: 0 },
    gratuity: { type: Number, default: 0 },
    salaryEffectiveFrom: { type: String, default: '' },
    pan: { type: String, default: '' },
    aadhaar: { type: String, default: '' },
    uan: { type: String, default: '' },
    pfNo: { type: String, default: '' },
    esicNo: { type: String, default: '' },
    dispensaryNo: { type: String, default: '' },
    pfApplicable: { type: mongoose.Schema.Types.Mixed, default: false },
    esiApplicable: { type: mongoose.Schema.Types.Mixed, default: false },
    lwf: { type: String, default: '' },
    lwfApplicable: { type: mongoose.Schema.Types.Mixed, default: false },
    tdsApplicable: { type: mongoose.Schema.Types.Mixed, default: false },

    // Licenses
    licenseList: { type: Array, default: [] },
    licenseType: { type: String, default: '' },
    drivingLicenseType: { type: String, default: '' },
    drivingLicenseNo: { type: String, default: '' },
    dlExpiryDate: { type: String, default: '' },
    drivingLicenseCopy: { type: String, default: '' },
    armedLicenseNo: { type: String, default: '' },
    alExpiryDate: { type: String, default: '' },

    // Bank Details
    bankName: { type: String, default: '' },
    branchName: { type: String, default: '' },
    accountNumber: { type: String, default: '' },
    ifsc: { type: String, default: '' },
    accountHolder: { type: String, default: '' },
    paymentMode: { type: String, default: '' },

    // Addresses & Family
    presentAddress: { type: String, default: '' },
    permanentAddress: { type: String, default: '' },
    sameAsPresentAddress: { type: Boolean, default: false },
    familyMembers: { type: Array, default: [] },
    familyMemberName: { type: String, default: '' },
    relation: { type: String, default: '' },
    dobAge: { type: String, default: '' },
    address: { type: String, default: '' },
    nomineeYesNo: { type: String, default: '' },
    nomineeSharePercent: { type: String, default: '' },

    // Documents & Notes
    documentList: { type: Array, default: [] },
    documents: { type: mongoose.Schema.Types.Mixed, default: {} },
    remarks: { type: String, default: '' },
  },
  {
    timestamps: true,
    strict: false,
    toJSON: {
      transform: function (doc, ret) {
        ret.id = ret.employeeId || ret._id.toString();
        ret.photo = ret.employeePhoto || ret.photo || '';
        ret.employeePhoto = ret.employeePhoto || ret.photo || '';
        ret.companyName = ret.companyName || ret.clientName || '';
        ret.clientName = ret.clientName || ret.companyName || '';
        ret.siteLocation = ret.siteLocation || ret.site || '';
        ret.site = ret.siteLocation || ret.site || '';
        ret.contact = ret.contact || ret.mobile || '';
        ret.mobile = ret.mobile || ret.contact || '';
        ret.enablePortalAccess = doc.enablePortalAccess !== false && doc.enablePortalAccess !== 'false';
        ret.password = doc.savedPassword || ret.savedPassword || '';
        ret.savedPassword = doc.savedPassword || ret.savedPassword || '';
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Auto-hash password before saving
employeeSchema.pre('save', async function () {
  if (this.isModified('password') && this.password) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
});

// Method to verify password on employee login
employeeSchema.methods.comparePassword = async function (enteredPassword) {
  if (!this.password) return false;
  return await bcrypt.compare(enteredPassword, this.password);
};

const Employee = mongoose.model('Employee', employeeSchema);
export default Employee;
