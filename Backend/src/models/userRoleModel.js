import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userRoleSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: [true, 'User ID is required'],
      trim: true,
      index: true,
    },
    companyId: {
      type: String,
      required: [true, 'Company ID is required'],
      trim: true,
      index: true,
    },
    companyName: {
      type: String,
      default: '',
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
      default: '',
      lowercase: true,
      trim: true,
    },
    mobile: {
      type: String,
      default: '',
      trim: true,
    },
    password: {
      type: String,
      default: '',
      select: false,
    },
    isExistingEmployee: {
      type: Boolean,
      default: false,
    },
    employeeId: {
      type: String,
      default: null,
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
      enum: ['Active', 'Inactive', 'Suspended'],
      default: 'Active',
      trim: true,
    },
    createdOn: {
      type: String,
      default: () => new Date().toISOString().split('T')[0],
    },
    lastLogin: {
      type: String,
      default: null,
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
    initials: {
      type: String,
      default: '',
    },
    avatarTone: {
      type: String,
      default: 'primary',
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc, ret) {
        ret.id = ret._id ? ret._id.toString() : ret.userId;
        delete ret.password;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Auto-calculate initials & hash password before saving
userRoleSchema.pre('save', async function () {
  if (this.name && !this.initials) {
    this.initials = this.name
      .split(' ')
      .filter(Boolean)
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  if (this.isModified('password') && this.password) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
});

userRoleSchema.methods.comparePassword = async function (enteredPassword) {
  if (!this.password) return false;
  try {
    const isMatch = await bcrypt.compare(enteredPassword, this.password);
    if (isMatch) return true;
  } catch (_) {}
  return this.password === enteredPassword;
};

// Use existing 'userroles' collection so no new Atlas collection is created
const UserRole = mongoose.model('UserRole', userRoleSchema, 'userroles');
export default UserRole;
