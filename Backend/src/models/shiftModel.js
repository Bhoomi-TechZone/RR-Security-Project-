import mongoose from 'mongoose';

const shiftSchema = new mongoose.Schema(
  {
    shiftId: {
      type: String,
      trim: true
    },
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
    name: {
      type: String,
      required: [true, 'Shift name is required'],
      trim: true
    },
    type: {
      type: String,
      enum: ['day', 'night', 'rotational'],
      default: 'day'
    },
    startTime: {
      type: String,
      trim: true
    },
    endTime: {
      type: String,
      trim: true
    },
    gracePeriod: {
      type: Number,
      default: 15
    },
    breakDuration: {
      type: Number,
      default: 30
    },
    color: {
      type: String,
      default: '#2563eb'
    },
    description: {
      type: String,
      trim: true,
      default: ''
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active'
    }
  },
  {
    timestamps: true
  }
);

// Compound index for unique shift names per company
shiftSchema.index({ companyId: 1, adminEmail: 1, name: 1 }, { unique: true });

shiftSchema.methods.toJSON = function () {
  const obj = this.toObject();
  obj.id = obj._id.toString();
  return obj;
};

const Shift = mongoose.model('Shift', shiftSchema);
export default Shift;
