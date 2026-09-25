import mongoose from 'mongoose';

/**
 * Generate formatted Company ID:
 * First 3 letters of first word + 7 unique digits + first 3 letters of last word
 * E.g. "Quoder Service" -> "QUO0986934SER"
 */
export function generateCompanyId(companyName) {
  if (!companyName) return `CMP${Math.floor(1000000 + Math.random() * 9000000)}COR`;
  const words = companyName.trim().toUpperCase().replace(/[^A-Z0-9\s]/g, '').split(/\s+/).filter(Boolean);
  const first3 = (words[0] || 'CMP').substring(0, 3).padEnd(3, 'X');
  const last3 = (words.length > 1 ? words[words.length - 1] : (words[0].length >= 6 ? words[0].slice(-3) : words[0])).substring(0, 3).padEnd(3, 'X');
  const random7 = Math.floor(1000000 + Math.random() * 9000000);
  return `${first3}${random7}${last3}`;
}

const companySchema = new mongoose.Schema(
  {
    companyId: {
      type: String,
      unique: true,
      trim: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Please provide a company name'],
      trim: true,
    },
    code: {
      type: String,
      required: [true, 'Please provide a short company code/prefix'],
      trim: true,
      uppercase: true,
    },
    industry: {
      type: String,
      default: 'Security & Facility Management',
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Please provide official company email'],
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      default: '',
      trim: true,
    },
    address: {
      type: String,
      default: '',
      trim: true,
    },
    city: {
      type: String,
      default: '',
      trim: true,
    },
    state: {
      type: String,
      default: '',
      trim: true,
    },
    pinCode: {
      type: String,
      default: '',
      trim: true,
    },
    gstin: {
      type: String,
      default: '',
      trim: true,
      uppercase: true,
    },
    pan: {
      type: String,
      default: '',
      trim: true,
      uppercase: true,
    },
    tan: {
      type: String,
      default: '',
      trim: true,
      uppercase: true,
    },
    logo: {
      type: String,
      default: null,
    },
    adminEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ['Active', 'Inactive'],
      default: 'Active',
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc, ret) {
        ret.id = ret.companyId || ret._id.toString();
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Auto-generate companyId before save if not present
companySchema.pre('save', function () {
  if (!this.companyId) {
    this.companyId = generateCompanyId(this.name);
  }
});

const Company = mongoose.model('Company', companySchema);
export default Company;
