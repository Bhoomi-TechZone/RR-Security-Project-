import mongoose from 'mongoose';

const letterTemplateSchema = new mongoose.Schema(
  {
    templateId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    companyId: {
      type: String,
      required: true,
      index: true,
    },
    letterType: {
      type: String,
      required: true,
      enum: ['appointment-letter', 'joining-letter', 'experience-letter', 'full-final-letter', 'salary-slip'],
      index: true,
    },
    templateName: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ['Active', 'Inactive'],
      default: 'Active',
    },
    isDefault: {
      type: Boolean,
      default: true,
    },
    headerTitle: {
      type: String,
      default: '',
    },
    subject: {
      type: String,
      default: '',
    },
    content: {
      type: String,
      default: '',
    },
    config: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

letterTemplateSchema.index({ companyId: 1, letterType: 1 }, { unique: true });

const LetterTemplate = mongoose.model('LetterTemplate', letterTemplateSchema);
export default LetterTemplate;
