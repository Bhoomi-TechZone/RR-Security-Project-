import mongoose from 'mongoose';

const inventoryIssuedSchema = new mongoose.Schema(
  {
    recordType: {
      type: String,
      default: 'issued',
      index: true
    },
    companyId: {
      type: String,
      required: true,
      index: true,
      trim: true
    },
    adminEmail: {
      type: String,
      required: true,
      index: true,
      lowercase: true,
      trim: true
    },
    issueId: {
      type: String,
      required: true,
      index: true,
      trim: true
    },
    issueDate: {
      type: String,
      required: true,
      default: () => new Date().toISOString().slice(0, 10)
    },
    expectedReturnDate: {
      type: String,
      default: null
    },
    issueType: {
      type: String,
      enum: ['uniform', 'asset'],
      default: 'uniform',
      index: true
    },
    employeeId: {
      type: String,
      required: true,
      index: true,
      trim: true
    },
    employeeName: {
      type: String,
      required: true,
      trim: true
    },
    initials: {
      type: String,
      default: 'EM'
    },
    clientId: {
      type: String,
      default: ''
    },
    clientName: {
      type: String,
      default: ''
    },
    site: {
      type: String,
      default: ''
    },
    department: {
      type: String,
      default: 'Security'
    },
    designation: {
      type: String,
      default: 'Security Guard'
    },
    itemId: {
      type: String,
      required: true,
      index: true
    },
    itemCode: {
      type: String,
      required: true,
      trim: true
    },
    itemName: {
      type: String,
      required: true,
      trim: true
    },
    category: {
      type: String,
      default: 'Uniform'
    },
    brand: {
      type: String,
      default: ''
    },
    size: {
      type: String,
      default: 'Free Size'
    },
    color: {
      type: String,
      default: 'Standard / N/A'
    },
    unit: {
      type: String,
      default: 'Pcs'
    },
    quantity: {
      type: Number,
      required: true,
      default: 1
    },
    rate: {
      type: Number,
      default: 0
    },
    issueRate: {
      type: Number,
      default: 0
    },
    totalAmount: {
      type: Number,
      default: 0
    },
    returnedQuantity: {
      type: Number,
      default: 0
    },
    pendingQuantity: {
      type: Number,
      default: 1
    },
    condition: {
      type: String,
      default: 'New'
    },
    deductionMethod: {
      type: String,
      default: 'salary-adjustment'
    },
    adjustmentMonth: {
      type: String,
      default: null
    },
    numberOfMonths: {
      type: Number,
      default: 1
    },
    emiAmount: {
      type: Number,
      default: 0
    },
    firstDeductionMonth: {
      type: String,
      default: null
    },
    depositDeduction: {
      type: Number,
      default: 0
    },
    issuedBy: {
      type: String,
      default: 'Store Admin'
    },
    status: {
      type: String,
      enum: ['Issued', 'Partially Returned', 'Returned', 'Fully Returned', 'Damaged', 'Lost'],
      default: 'Issued'
    },
    remarks: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true,
    strict: false
  }
);

inventoryIssuedSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret.issueId || ret._id.toString();
    if (!ret.issueId) ret.issueId = ret.id;
    return ret;
  }
});

// Use unified 'inventories' collection
const InventoryIssued = mongoose.model('InventoryIssued', inventoryIssuedSchema, 'inventories');

export default InventoryIssued;
