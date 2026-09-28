import mongoose from 'mongoose';

const assignedAssetSubSchema = new mongoose.Schema(
  {
    issueId: { type: String, default: '' },
    itemId: { type: String, default: '' },
    itemCode: { type: String, default: '' },
    itemName: { type: String, default: '' },
    category: { type: String, default: '' },
    issuedQty: { type: Number, default: 0 },
    returnedQty: { type: Number, default: 0 },
    pendingQty: { type: Number, default: 0 },
    condition: { type: String, default: 'Good' },
    status: { type: String, default: 'Issued' }
  },
  { _id: false }
);

const inventoryClearanceSchema = new mongoose.Schema(
  {
    recordType: {
      type: String,
      default: 'clearance',
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
    clearanceId: {
      type: String,
      required: true,
      index: true,
      trim: true
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
    designation: {
      type: String,
      default: 'Security Guard'
    },
    clientName: {
      type: String,
      default: ''
    },
    site: {
      type: String,
      default: ''
    },
    exitDate: {
      type: String,
      default: () => new Date().toISOString().slice(0, 10)
    },
    assignedAssets: [assignedAssetSubSchema],
    recoveryDeduction: {
      type: Number,
      default: 0
    },
    clearanceStatus: {
      type: String,
      enum: ['Pending Clearance', 'Partially Cleared', 'Fully Cleared'],
      default: 'Pending Clearance'
    },
    clearedBy: {
      type: String,
      default: ''
    },
    clearedDate: {
      type: String,
      default: null
    },
    certificateNo: {
      type: String,
      default: ''
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

inventoryClearanceSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret.clearanceId || ret._id.toString();
    if (!ret.clearanceId) ret.clearanceId = ret.id;
    return ret;
  }
});

// Use unified 'inventories' collection
const InventoryClearance = mongoose.model('InventoryClearance', inventoryClearanceSchema, 'inventories');

export default InventoryClearance;
