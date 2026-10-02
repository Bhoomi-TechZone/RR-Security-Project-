import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const clientSchema = new mongoose.Schema(
  {
    clientId: {
      type: String,
      trim: true,
      index: true,
    },
    companyId: {
      type: String,
      required: [true, 'Admin Company ID is required for client association'],
      index: true,
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
      required: [true, 'Client name is required'],
      trim: true,
    },
    email: {
      type: String,
      default: '',
      lowercase: true,
      trim: true,
    },
    gstin: {
      type: String,
      default: '',
      trim: true,
      uppercase: true,
    },
    contactPerson: {
      type: String,
      default: '',
      trim: true,
    },
    contactNumber: {
      type: String,
      default: '',
      trim: true,
    },
    contractStartDate: {
      type: String,
      default: '',
    },
    contractEndDate: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'pending'],
      default: 'active',
    },
    address: {
      type: String,
      default: '',
      trim: true,
    },
    typeOfService: {
      type: String,
      default: '',
      trim: true,
    },
    document: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    overtimeType: {
      type: String,
      default: '',
    },
    overtimeBasis: {
      type: String,
      default: '',
    },
    compliance: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    employees: {
      type: Number,
      default: 0,
    },
    // Credentials & Portal Access
    password: {
      type: String,
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
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc, ret) {
        ret.id = ret.clientId || ret._id.toString();
        ret.enablePortalAccess = doc.enablePortalAccess !== false && doc.enablePortalAccess !== 'false';
        ret.password = doc.savedPassword || ret.savedPassword || '';
        ret.savedPassword = doc.savedPassword || ret.savedPassword || '';
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Auto-assign unique clientId before save if not present
clientSchema.pre('save', async function () {
  if (!this.clientId) {
    this.clientId = `CLI-${String(Math.floor(100 + Math.random() * 900))}`;
  }

  // Hash password if modified
  if (this.isModified('password') && this.password) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
});

// Method to verify password on client login
clientSchema.methods.comparePassword = async function (enteredPassword) {
  if (!this.password && !this.savedPassword) return false;
  if (this.password) {
    const isMatch = await bcrypt.compare(enteredPassword, this.password);
    if (isMatch) return true;
  }
  return this.savedPassword === enteredPassword;
};

const Client = mongoose.model('Client', clientSchema);
export default Client;
