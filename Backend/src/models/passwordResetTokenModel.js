import mongoose from 'mongoose';

const passwordResetTokenSchema = new mongoose.Schema(
  {
    token: {
      type: String,
      required: true,
      index: true,
      unique: true,
    },
    userType: {
      type: String,
      required: true,
      enum: ['admin', 'employee', 'client', 'user'],
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    userModelName: {
      type: String,
      required: true,
      enum: ['User', 'Employee', 'Client', 'UserRole'],
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    identifier: {
      type: String,
      default: '',
      trim: true,
    },
    name: {
      type: String,
      default: '',
      trim: true,
    },
    companyId: {
      type: String,
      default: '',
      trim: true,
    },
    used: {
      type: Boolean,
      default: false,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 }, // Automatically purged by MongoDB upon expiry
    },
  },
  {
    timestamps: true,
  }
);

const PasswordResetToken = mongoose.model('PasswordResetToken', passwordResetTokenSchema);
export default PasswordResetToken;
