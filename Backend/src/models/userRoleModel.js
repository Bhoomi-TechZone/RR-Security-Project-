import mongoose from 'mongoose';

const userRoleSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      trim: true,
      index: true,
    },
    companyId: {
      type: String,
      required: [true, 'Admin Company ID is required for user role association'],
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
      required: [true, 'User name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'User email is required'],
      lowercase: true,
      trim: true,
    },
    employeeId: {
      type: String,
      default: '',
      trim: true,
    },
    roleId: {
      type: String,
      required: [true, 'Role ID is required'],
      trim: true,
      index: true,
    },
    roleName: {
      type: String,
      default: '',
      trim: true,
    },
    department: {
      type: String,
      default: 'General',
      trim: true,
    },
    status: {
      type: String,
      default: 'Active',
      trim: true,
    },
    assignedOn: {
      type: String,
      default: () => new Date().toISOString().split('T')[0],
    },
    assignedBy: {
      type: String,
      default: 'Admin',
      trim: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc, ret) {
        ret.id = ret.userId || ret._id.toString();
        delete ret.__v;
        return ret;
      },
    },
  }
);

userRoleSchema.pre('save', function () {
  if (!this.userId) {
    this.userId = `USR-${Date.now().toString().slice(-6)}`;
  }
});

const UserRole = mongoose.model('UserRole', userRoleSchema);
export default UserRole;
