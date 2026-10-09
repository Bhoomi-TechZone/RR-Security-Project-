import mongoose from 'mongoose';

const inventoryRequestSchema = new mongoose.Schema(
  {
    recordType: {
      type: String,
      default: 'request',
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
    requestId: {
      type: String,
      required: true,
      index: true,
      trim: true
    },
    requestDate: {
      type: String,
      required: true,
      default: () => new Date().toISOString().slice(0, 10)
    },
    requestType: {
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
    designation: {
      type: String,
      default: 'Security Staff'
    },
    department: {
      type: String,
      default: 'Operations'
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
      default: ''
    },
    itemCode: {
      type: String,
      default: ''
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
    quantity: {
      type: Number,
      required: true,
      default: 1
    },
    unit: {
      type: String,
      default: 'Pcs'
    },
    reason: {
      type: String,
      default: 'New Joining'
    },
    urgency: {
      type: String,
      enum: ['Normal', 'High', 'Urgent'],
      default: 'Normal'
    },
    deliveryLocation: {
      type: String,
      default: 'Assigned Site Location'
    },
    notes: {
      type: String,
      default: ''
    },
    status: {
      type: String,
      enum: ['Pending Review', 'Approved', 'Assigned', 'Rejected', 'Cancelled'],
      default: 'Pending Review',
      index: true
    },
    adminRemarks: {
      type: String,
      default: ''
    },
    assignedIssueId: {
      type: String,
      default: ''
    },
    actionDate: {
      type: String,
      default: null
    },
    actionBy: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true,
    strict: false
  }
);

inventoryRequestSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret.requestId || ret._id.toString();
    if (!ret.requestId) ret.requestId = ret.id;
    return ret;
  }
});

// Use unified 'inventories' collection
const InventoryRequest = mongoose.model('InventoryRequest', inventoryRequestSchema, 'inventories');

export default InventoryRequest;
