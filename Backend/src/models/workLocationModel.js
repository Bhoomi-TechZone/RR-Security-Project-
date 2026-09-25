import mongoose from 'mongoose';

const workLocationSchema = new mongoose.Schema(
  {
    locationId: {
      type: String,
      trim: true,
      index: true,
    },
    companyId: {
      type: String,
      required: [true, 'Admin Company ID is required for work location association'],
      index: true,
      trim: true,
    },
    adminEmail: {
      type: String,
      required: [true, 'Admin email is required'],
      lowercase: true,
      trim: true,
      index: true,
    },
    locationName: {
      type: String,
      required: [true, 'Location name is required'],
      trim: true,
    },
    locationType: {
      type: String,
      enum: ['head-office', 'branch', 'office', 'warehouse', 'site'],
      default: 'branch',
      trim: true,
    },
    address: {
      type: String,
      required: [true, 'Address is required'],
      trim: true,
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true,
    },
    state: {
      type: String,
      required: [true, 'State is required'],
      trim: true,
    },
    pinCode: {
      type: String,
      required: [true, 'PIN code is required'],
      trim: true,
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
      trim: true,
    },
    createdOn: {
      type: String,
      default: () =>
        new Date().toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        }),
    },
    lastUpdated: {
      type: String,
      default: () =>
        new Date().toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        }),
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc, ret) {
        ret.id = ret.locationId || ret._id.toString();
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Auto-assign unique locationId before save
workLocationSchema.pre('save', function () {
  if (!this.locationId) {
    this.locationId = `LOC-${Date.now().toString().slice(-6)}`;
  }
});

const WorkLocation = mongoose.model('WorkLocation', workLocationSchema);
export default WorkLocation;
