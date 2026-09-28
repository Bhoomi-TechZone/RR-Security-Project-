import mongoose from 'mongoose';

const inventoryReturnSchema = new mongoose.Schema(
  {
    recordType: {
      type: String,
      default: 'return',
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
    returnId: {
      type: String,
      required: true,
      index: true,
      trim: true
    },
    issueId: {
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
    size: {
      type: String,
      default: 'Free Size'
    },
    returnedQuantity: {
      type: Number,
      required: true,
      default: 1
    },
    condition: {
      type: String,
      enum: ['Good', 'New', 'Fair', 'Damaged', 'Lost'],
      default: 'Good'
    },
    returnDate: {
      type: String,
      required: true,
      default: () => new Date().toISOString().slice(0, 10)
    },
    returnValue: {
      type: Number,
      default: 0
    },
    totalReturnValue: {
      type: Number,
      default: 0
    },
    recoveryCharge: {
      type: Number,
      default: 0
    },
    returnedBy: {
      type: String,
      default: 'Store Admin'
    },
    receivedBy: {
      type: String,
      default: 'Store Admin'
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

inventoryReturnSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret.returnId || ret._id.toString();
    if (!ret.returnId) ret.returnId = ret.id;
    return ret;
  }
});

// Use unified 'inventories' collection
const InventoryReturn = mongoose.model('InventoryReturn', inventoryReturnSchema, 'inventories');

export default InventoryReturn;
