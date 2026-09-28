import mongoose from 'mongoose';

const inventoryItemSchema = new mongoose.Schema(
  {
    recordType: {
      type: String,
      default: 'item',
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
    itemId: {
      type: String,
      trim: true,
      index: true
    },
    itemCode: {
      type: String,
      required: true,
      uppercase: true,
      trim: true
    },
    itemName: {
      type: String,
      required: true,
      trim: true
    },
    itemType: {
      type: String,
      enum: ['uniform', 'asset'],
      default: 'uniform',
      index: true
    },
    category: {
      type: String,
      required: true,
      trim: true
    },
    size: {
      type: String,
      default: 'Free Size',
      trim: true
    },
    color: {
      type: String,
      default: 'Standard / N/A',
      trim: true
    },
    unit: {
      type: String,
      default: 'Pcs',
      trim: true
    },
    brand: {
      type: String,
      default: '',
      trim: true
    },
    purchaseDate: {
      type: String,
      default: () => new Date().toISOString().slice(0, 10)
    },
    billNumber: {
      type: String,
      default: '',
      trim: true
    },
    billPhoto: {
      type: String,
      default: null
    },
    billPhotoName: {
      type: String,
      default: '',
      trim: true
    },
    openingStock: {
      type: Number,
      default: 0
    },
    availableQuantity: {
      type: Number,
      default: 0
    },
    issuedQuantity: {
      type: Number,
      default: 0
    },
    returnedQuantity: {
      type: Number,
      default: 0
    },
    damagedQuantity: {
      type: Number,
      default: 0
    },
    lostQuantity: {
      type: Number,
      default: 0
    },
    minimumStock: {
      type: Number,
      default: 10
    },
    purchaseRate: {
      type: Number,
      default: 0
    },
    warrantyStartDate: {
      type: String,
      default: ''
    },
    warrantyEndDate: {
      type: String,
      default: ''
    },
    clientName: {
      type: String,
      default: 'Central Stock',
      trim: true
    },
    location: {
      type: String,
      default: 'Central Warehouse',
      trim: true
    },
    status: {
      type: String,
      enum: ['Active', 'Inactive', 'In Stock', 'Low Stock', 'Out of Stock'],
      default: 'Active'
    },
    description: {
      type: String,
      default: '',
      trim: true
    }
  },
  {
    timestamps: true,
    strict: false
  }
);

// Virtual & toJSON helper to ensure id and itemId are always present
inventoryItemSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret.itemId || ret._id.toString();
    if (!ret.itemId) ret.itemId = ret.id;
    return ret;
  }
});

// Use unified 'inventories' collection to stay strictly within Atlas collection limits
const InventoryItem = mongoose.model('InventoryItem', inventoryItemSchema, 'inventories');

export default InventoryItem;
