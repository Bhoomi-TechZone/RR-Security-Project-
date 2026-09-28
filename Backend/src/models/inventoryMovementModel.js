import mongoose from 'mongoose';

const inventoryMovementSchema = new mongoose.Schema(
  {
    recordType: {
      type: String,
      default: 'movement',
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
    movementId: {
      type: String,
      required: true,
      index: true,
      trim: true
    },
    date: {
      type: String,
      required: true,
      default: () => new Date().toISOString().slice(0, 10)
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
    movementType: {
      type: String,
      required: true,
      trim: true
    },
    quantityChange: {
      type: Number,
      required: true
    },
    balanceBefore: {
      type: Number,
      default: 0
    },
    balanceAfter: {
      type: Number,
      default: 0
    },
    employeeId: {
      type: String,
      default: ''
    },
    employeeName: {
      type: String,
      default: ''
    },
    site: {
      type: String,
      default: ''
    },
    location: {
      type: String,
      default: 'Central Warehouse'
    },
    reference: {
      type: String,
      default: ''
    },
    performedBy: {
      type: String,
      default: 'Store Admin'
    },
    notes: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true,
    strict: false
  }
);

inventoryMovementSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret.movementId || ret._id.toString();
    if (!ret.movementId) ret.movementId = ret.id;
    return ret;
  }
});

// Use unified 'inventories' collection
const InventoryMovement = mongoose.model('InventoryMovement', inventoryMovementSchema, 'inventories');

export default InventoryMovement;
