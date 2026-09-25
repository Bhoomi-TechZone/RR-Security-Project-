import mongoose from 'mongoose';

const roleSchema = new mongoose.Schema(
  {
    roleId: {
      type: String,
      trim: true,
      index: true,
    },
    companyId: {
      type: String,
      required: [true, 'Admin Company ID is required for role association'],
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
    name: {
      type: String,
      required: [true, 'Role name is required'],
      trim: true,
    },
    type: {
      type: String,
      enum: ['system', 'custom'],
      default: 'custom',
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    status: {
      type: String,
      default: 'Active',
      trim: true,
    },
    permissions: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    usersCount: {
      type: Number,
      default: 0,
    },
    createdOn: {
      type: String,
      default: () =>
        new Date().toISOString().split('T')[0],
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc, ret) {
        ret.id = ret.roleId || ret._id.toString();
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Auto-assign unique roleId before save if not present
roleSchema.pre('save', function () {
  if (!this.roleId) {
    this.roleId = `ROLE-${Date.now().toString().slice(-6)}`;
  }
});

const Role = mongoose.model('Role', roleSchema);
export default Role;
