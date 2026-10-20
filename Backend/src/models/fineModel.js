import mongoose from 'mongoose';

const fineDeductionSchema = new mongoose.Schema(
  {
    fineId: {
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
    actOrOmission: {
      type: String,
      required: true,
    },
    dateOfOffence: {
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
    wagePeriodAndWages: {
      type: String,
      default: 'Monthly',
    },
    amountOfFineImposed: {
      type: Number,
      required: true,
      default: 0,
    },
    dateOnWhichFineRealised: {
      type: String, // YYYY-MM-DD
      default: '',
    },
    realisedAmount: {
      type: Number,
      default: 0,
    },
    remarks: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['active', 'realised', 'pending', 'waived'],
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

fineDeductionSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret.fineId || ret._id.toString();
    return ret;
  },
});

const FineDeduction = mongoose.model('FineDeduction', fineDeductionSchema, 'finedeductions');

export default FineDeduction;
