import mongoose from 'mongoose';

const payGroupSchema = new mongoose.Schema({
  companyId: {
    type: String,
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  code: {
    type: String,
    required: true,
    trim: true
  },
  paySchedule: {
    type: String,
    required: true
  },
  payCycle: {
    type: String,
    required: true
  },
  payDay: {
    type: String,
    required: true
  },
  salaryCalculationMethod: {
    type: String,
    required: true
  },
  salaryComponentIds: {
    type: [String],
    default: []
  },
  description: {
    type: String,
    default: ''
  },
  employeeCount: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  }
}, {
  timestamps: true
});

const payScheduleSchema = new mongoose.Schema({
  companyId: {
    type: String,
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  }
}, {
  timestamps: true
});

const payCycleSchema = new mongoose.Schema({
  companyId: {
    type: String,
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  frequency: {
    type: String,
    enum: ['Monthly', 'Weekly', 'Bi-Weekly', 'Daily'],
    default: 'Monthly'
  },
  cycleStartDay: {
    type: Number,
    default: 1
  },
  cycleEndDay: {
    type: Number,
    default: 31
  },
  description: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  }
}, {
  timestamps: true
});

const payDayConfigSchema = new mongoose.Schema({
  companyId: {
    type: String,
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  payDayType: {
    type: String,
    enum: ['Fixed Day', 'Last Working Day', 'Last Calendar Day'],
    default: 'Fixed Day'
  },
  fixedDay: {
    type: Number,
    default: null
  },
  description: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  }
}, {
  timestamps: true
});

const salaryCalculationMethodSchema = new mongoose.Schema({
  companyId: {
    type: String,
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  code: {
    type: String,
    required: true,
    trim: true
  },
  formula: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  isDefault: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

export const PayGroup = mongoose.model('PayGroup', payGroupSchema);
export const PaySchedule = mongoose.model('PaySchedule', payScheduleSchema);
export const PayCycle = mongoose.model('PayCycle', payCycleSchema);
export const PayDayConfig = mongoose.model('PayDayConfig', payDayConfigSchema);
export const SalaryCalculationMethod = mongoose.model('SalaryCalculationMethod', salaryCalculationMethodSchema);
