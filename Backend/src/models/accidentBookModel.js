import mongoose from 'mongoose';

const accidentBookSchema = new mongoose.Schema(
  {
    accidentId: {
      type: String,
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
      default: '',
      index: true,
    },
    employeeCode: {
      type: String,
      default: '',
    },
    // Col 2: Date of Notice
    noticeDate: {
      type: String, // YYYY-MM-DD or DD/MM/YYYY
      default: '',
    },
    // Col 3: Time of Notice
    noticeTime: {
      type: String, // HH:MM AM/PM
      default: '',
    },
    // Col 4: Name and Address of Injured Person
    injuredPersonName: {
      type: String,
      required: true,
    },
    injuredPersonAddress: {
      type: String,
      default: '',
    },
    // Col 5: Sex
    gender: {
      type: String,
      default: 'Male',
    },
    // Col 6: Age
    age: {
      type: Number,
      default: 0,
    },
    // Col 7: Insurance No. (ESIC IP Number)
    insuranceNumber: {
      type: String,
      default: '',
    },
    // Col 8: Shift, department and Occupation of the employee
    shift: {
      type: String,
      default: 'General',
    },
    department: {
      type: String,
      default: 'Security / Operations',
    },
    occupation: {
      type: String,
      default: 'Security Guard',
    },
    // Details of Injury (Cols 9 - 13)
    causeOfInjury: {
      type: String, // Col 9: Cause
      default: '',
    },
    natureOfInjury: {
      type: String, // Col 10: Nature
      default: '',
    },
    accidentDate: {
      type: String, // Col 11: Date (YYYY-MM-DD or DD/MM/YYYY)
      default: '',
    },
    accidentTime: {
      type: String, // Col 12: Time (HH:MM AM/PM)
      default: '',
    },
    accidentPlace: {
      type: String, // Col 13: Place
      default: '',
    },
    // Col 14: What exactly was the injured person doing at the time of accident
    activityAtAccidentTime: {
      type: String,
      default: '',
    },
    // Col 15: Name, occupation, address and signature or thumb impression of the person(s) giving notice
    noticeGiverDetails: {
      type: String,
      default: '',
    },
    // Col 16: Signature and designation of the person who makes the entry in the Accident Book
    entryMakerDetails: {
      type: String,
      default: '',
    },
    // Col 17: Signature and designation of the person who makes the entry in the Accident Book (or Supervisor)
    witnessOrCertifierDetails: {
      type: String,
      default: '',
    },
    // Col 18: Remarks, if any
    remarks: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
    strict: false,
  }
);

accidentBookSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret.accidentId || ret._id.toString();
    return ret;
  },
});

const AccidentBook = mongoose.models.AccidentBook || mongoose.model('AccidentBook', accidentBookSchema);

export default AccidentBook;
