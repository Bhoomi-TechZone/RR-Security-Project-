import mongoose from 'mongoose';

const damageLossDeductionSchema = new mongoose.Schema(
  {
    deductionId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    companyId: {
      type: String,
      required: true,
      index: true,
    },
    adminEmail: {
      type: String,
      default: '',
      lowercase: true,
      trim: true,
    },
    employeeId: {
      type: String,
      required: true,
      index: true,
    },
    employeeCode: {
      type: String,
      default: '',
    },
    employeeName: {
      type: String,
      required: true,
    },
    fatherHusbandName: {
      type: String,
      default: '',
    },
    designation: {
      type: String,
      default: 'Staff',
    },
    department: {
      type: String,
      default: '',
    },
    particularsOfDamageOrLoss: {
      type: String,
      required: true,
    },
    dateOfDamageOrLoss: {
      type: String, // YYYY-MM-DD
      required: true,
    },
    showedCause: {
      type: String,
      enum: ['Yes', 'No', 'yes', 'no'],
      default: 'Yes',
    },
    explanationHeardBy: {
      type: String,
      default: '',
    },
    amountDeductionImposed: {
      type: Number,
      required: true,
      default: 0,
    },
    noOfInstallments: {
      type: Number,
      default: 1,
    },
    firstInstalmentDate: {
      type: String,
      default: '',
    },
    lastInstalmentDate: {
      type: String,
      default: '',
    },
    recoveredAmount: {
      type: Number,
      default: 0,
    },
    remarks: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['active', 'recovered', 'pending', 'waived'],
      default: 'active',
    },
    establishmentName: {
      type: String,
      default: '',
    },
    establishmentAddress: {
      type: String,
      default: '',
    },
    workNameLocation: {
      type: String,
      default: '',
    },
    principalEmployer: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
    strict: false,
  }
);

damageLossDeductionSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret.deductionId || ret._id.toString();
    return ret;
  },
});

const DamageLossDeduction = mongoose.model('DamageLossDeduction', damageLossDeductionSchema, 'damagelossdeductions');

export default DamageLossDeduction;
