import mongoose from 'mongoose';

const masterSchema = new mongoose.Schema(
  {
    companyId: {
      type: String,
      required: true,
      index: true
    },
    adminEmail: {
      type: String,
      required: true,
      lowercase: true,
      index: true
    },
    type: {
      type: String,
      required: true,
      enum: [
        'banks',
        'departments',
        'designations',
        'employee-types',
        'sites',
        'posts',
        'shifts',
        'leave-types',
        'holidays',
        'salary-components',
        'document-types'
      ],
      index: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    code: {
      type: String,
      default: '',
      trim: true
    },
    description: {
      type: String,
      default: '',
      trim: true
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'Active', 'Inactive'],
      default: 'active'
    },

    // Master Type Specific Fields
    // Banks
    branches: {
      type: Number,
      default: 0
    },
    branchList: {
      type: [String],
      default: []
    },

    // Departments
    employees: {
      type: Number,
      default: 0
    },

    // Designations
    department: {
      type: String,
      default: ''
    },

    // Sites
    clientId: {
      type: String,
      default: ''
    },
    clientName: {
      type: String,
      default: ''
    },
    workLocationId: {
      type: String,
      default: ''
    },
    workLocationName: {
      type: String,
      default: ''
    },
    address: {
      type: String,
      default: ''
    },
    city: {
      type: String,
      default: ''
    },
    state: {
      type: String,
      default: ''
    },
    pinCode: {
      type: String,
      default: ''
    },
    contactPerson: {
      type: String,
      default: ''
    },
    contactNumber: {
      type: String,
      default: ''
    },
    minimumManpower: {
      type: Number,
      default: 0
    },

    // Leave Types
    paidType: {
      type: String,
      enum: ['paid', 'unpaid', 'Paid', 'Unpaid'],
      default: 'paid'
    },
    annualQuota: {
      type: Number,
      default: 0
    },
    carryForward: {
      type: Boolean,
      default: false
    },
    maxAccumulation: {
      type: Number,
      default: 0
    },
    encashment: {
      type: Boolean,
      default: false
    },

    // Holidays
    date: {
      type: String,
      default: ''
    },
    holidayType: {
      type: String,
      default: 'national'
    },
    applicableLocation: {
      type: String,
      default: 'All Locations'
    },

    // Shifts
    startTime: {
      type: String,
      default: ''
    },
    endTime: {
      type: String,
      default: ''
    },
    breakDuration: {
      type: Number,
      default: 0
    },

    // Salary Components
    type_kind: {
      type: String, // 'earning' or 'deduction'
      default: 'earning'
    },
    calculationType: {
      type: String,
      default: 'fixed'
    },
    defaultValue: {
      type: String,
      default: ''
    },
    taxable: {
      type: String,
      default: 'taxable'
    },

    // Document Types
    requiredType: {
      type: String,
      default: 'required'
    },
    expiryRequired: {
      type: Boolean,
      default: false
    },
    verificationRequired: {
      type: Boolean,
      default: true
    },

    // Additional extra properties / future customization
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        ret.id = ret._id ? ret._id.toString() : ret.id;
        // Map type_kind back to type property for salary components if applicable
        if (ret.type_kind && !ret.type_sc) {
          ret.type_sc = ret.type_kind;
        }
        delete ret._id;
        delete ret.__v;
        return ret;
      }
    }
  }
);

masterSchema.index({ companyId: 1, type: 1, createdAt: -1 });

const Master = mongoose.models.Master || mongoose.model('Master', masterSchema);

export default Master;
