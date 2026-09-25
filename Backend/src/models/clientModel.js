import mongoose from 'mongoose';

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
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc, ret) {
        ret.id = ret.clientId || ret._id.toString();
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Auto-assign unique clientId before save if not present
clientSchema.pre('save', function () {
  if (!this.clientId) {
    this.clientId = `CLI-${Date.now().toString().slice(-6)}`;
  }
});

const Client = mongoose.model('Client', clientSchema);
export default Client;
