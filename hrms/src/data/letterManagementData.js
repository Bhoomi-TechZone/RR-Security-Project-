import { mockEmployees } from './employeeData';
import {
  mockAppointmentLetterConfig,
  mockJoiningLetterConfig,
  mockExperienceLetterConfig,
  mockFullFinalLetterConfig
} from './templatesData';

export const LETTER_TYPES = [
  {
    id: 'appointment-letter',
    name: 'Appointment Letter',
    shortName: 'Appointment',
    code: 'APPT',
    color: '#2563eb',
    bgColor: '#eff6ff',
    borderColor: '#bfdbfe',
    description: 'Formal employment offer and terms of appointment',
    templateKey: 'novaspark_template_appointment'
  },
  {
    id: 'joining-letter',
    name: 'Joining Letter',
    shortName: 'Joining',
    code: 'JOIN',
    color: '#16a34a',
    bgColor: '#f0fdf4',
    borderColor: '#bbf7d0',
    description: 'Official confirmation of employee joining and site posting',
    templateKey: 'novaspark_template_joining'
  },
  {
    id: 'experience-letter',
    name: 'Experience Letter',
    shortName: 'Experience',
    code: 'EXP',
    color: '#9333ea',
    bgColor: '#faf5ff',
    borderColor: '#e9d5ff',
    description: 'Service completion and experience certificate',
    templateKey: 'novaspark_template_experience'
  },
  {
    id: 'full-final-letter',
    name: 'Full & Final Letter',
    shortName: 'Full & Final',
    code: 'FNF',
    color: '#ea580c',
    bgColor: '#fff7ed',
    borderColor: '#fed7aa',
    description: 'Final dues clearance and settlement statement',
    templateKey: 'novaspark_template_full_final'
  }
];

export const LETTER_STATUSES = ['All', 'Issued', 'Sent', 'Draft', 'Downloaded', 'Revoked'];

// Helper to get active template configuration
export function getTemplateConfig(letterTypeId) {
  try {
    if (letterTypeId === 'appointment-letter') {
      const saved = localStorage.getItem('novaspark_template_appointment');
      return saved ? JSON.parse(saved) : mockAppointmentLetterConfig;
    }
    if (letterTypeId === 'joining-letter') {
      const saved = localStorage.getItem('novaspark_template_joining');
      return saved ? JSON.parse(saved) : mockJoiningLetterConfig;
    }
    if (letterTypeId === 'experience-letter') {
      const saved = localStorage.getItem('novaspark_template_experience');
      return saved ? JSON.parse(saved) : mockExperienceLetterConfig;
    }
    if (letterTypeId === 'full-final-letter') {
      const saved = localStorage.getItem('novaspark_template_full_final');
      return saved ? JSON.parse(saved) : mockFullFinalLetterConfig;
    }
  } catch (e) {
    console.warn('Error reading template config:', e);
  }
  return null;
}

// Helper to fill placeholders in template text
export function renderLetterBody(rawTemplateText, employee = {}, company = {}, customVars = {}) {
  if (!rawTemplateText) return '';

  const compName = company?.name || employee?.companyName || 'RR Security & Allied Services Pvt. Ltd.';
  const compAddress = company?.address || 'Plot 45, Sector 18, Gurugram, Haryana - 122008';
  const compEmail = company?.email || 'admin@rrsecurity.com';
  const compPhone = company?.phone || '+91 98765 43210';
  const compGstin = company?.gstin || '07AAAAA0000A1Z5';
  const compPan = company?.pan || 'AAACR1234F';

  const placeholders = {
    '{{companyName}}': compName,
    '{{companyAddress}}': compAddress,
    '{{companyEmail}}': compEmail,
    '{{companyPhone}}': compPhone,
    '{{companyGstin}}': compGstin,
    '{{companyPan}}': compPan,
    '{{currentDate}}': customVars.issueDate || new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
    '{{employeeName}}': employee?.name || customVars.employeeName || 'Rahul Kumar',
    '{{employeeCode}}': employee?.employeeCode || employee?.employeeId || customVars.employeeCode || 'EMP001',
    '{{designation}}': customVars.designation || employee?.designation || 'Security Officer',
    '{{department}}': customVars.department || employee?.department || 'Operations',
    '{{location}}': customVars.location || employee?.siteLocation || employee?.joiningLocation || 'DLF Cyber City, Tower B, Gurugram',
    '{{reportingManager}}': customVars.reportingManager || employee?.reportingSupervisor || 'Vikram Singh (Head of Operations)',
    '{{joiningDate}}': customVars.joiningDate || employee?.joiningDate || '15 Jan 2025',
    '{{lastWorkingDate}}': customVars.lastWorkingDate || '28 Feb 2026',
    '{{salary}}': customVars.salary || (employee?.grossSalary ? `₹${Number(employee.grossSalary).toLocaleString('en-IN')}` : '₹30,000'),
    '{{ctc}}': customVars.ctc || (employee?.grossSalary ? `₹${(Number(employee.grossSalary) * 12).toLocaleString('en-IN')}` : '₹3,60,000'),
    '{{probationPeriod}}': customVars.probationPeriod || '6 Months',
    '{{noticePeriod}}': customVars.noticePeriod || '30 Days',
    '{{workingHours}}': customVars.workingHours || (employee?.shift ? `${employee.shift} Shift (9 hrs)` : '9:00 AM - 6:00 PM'),
    '{{signatoryName}}': customVars.signatoryName || 'Amitabh Sharma',
    '{{signatoryDesignation}}': customVars.signatoryDesignation || 'Director - Human Resources',
    '{{settlementAmount}}': customVars.settlementAmount || '₹38,450'
  };

  let rendered = rawTemplateText;
  Object.entries(placeholders).forEach(([key, val]) => {
    rendered = rendered.split(key).join(val || '');
  });

  return rendered;
}

// Initial mock data for issued letters
export const mockIssuedLetters = [
  {
    id: 'let-001',
    refNo: 'NS/APPT/2026/0142',
    letterType: 'appointment-letter',
    employeeId: 'e001',
    employeeName: 'Rahul Kumar',
    employeeCode: 'EMP001',
    designation: 'Security Guard',
    department: 'Security',
    location: 'Sector 18, Gurugram',
    issueDate: '2026-01-15',
    joiningDate: '2026-01-15',
    ctc: '₹3,60,000',
    salary: '₹30,000',
    signatoryName: 'Amitabh Sharma',
    signatoryDesignation: 'Director - HR',
    status: 'Issued',
    subject: 'Offer of Appointment for the position of Security Guard',
    content: '',
    createdAt: '2026-01-15T10:00:00.000Z'
  },
  {
    id: 'let-002',
    refNo: 'NS/JOIN/2026/0091',
    letterType: 'joining-letter',
    employeeId: 'e001',
    employeeName: 'Rahul Kumar',
    employeeCode: 'EMP001',
    designation: 'Security Guard',
    department: 'Security',
    location: 'Sector 18, Gurugram',
    issueDate: '2026-01-15',
    joiningDate: '2026-01-15',
    signatoryName: 'Amitabh Sharma',
    signatoryDesignation: 'Director - HR',
    status: 'Sent',
    subject: 'Joining Confirmation - Employee ID: EMP001',
    content: '',
    createdAt: '2026-01-15T11:30:00.000Z'
  },
  {
    id: 'let-003',
    refNo: 'NS/APPT/2026/0143',
    letterType: 'appointment-letter',
    employeeId: 'e002',
    employeeName: 'Priya Sharma',
    employeeCode: 'EMP002',
    designation: 'Supervisor',
    department: 'Operations',
    location: 'Cyber City, Gurugram',
    issueDate: '2026-02-01',
    joiningDate: '2026-02-01',
    ctc: '₹4,80,000',
    salary: '₹40,000',
    signatoryName: 'Amitabh Sharma',
    signatoryDesignation: 'Director - HR',
    status: 'Issued',
    subject: 'Offer of Appointment for the position of Supervisor',
    content: '',
    createdAt: '2026-02-01T09:15:00.000Z'
  },
  {
    id: 'let-004',
    refNo: 'NS/JOIN/2026/0092',
    letterType: 'joining-letter',
    employeeId: 'e002',
    employeeName: 'Priya Sharma',
    employeeCode: 'EMP002',
    designation: 'Supervisor',
    department: 'Operations',
    location: 'Cyber City, Gurugram',
    issueDate: '2026-02-01',
    joiningDate: '2026-02-01',
    signatoryName: 'Amitabh Sharma',
    signatoryDesignation: 'Director - HR',
    status: 'Downloaded',
    subject: 'Joining Confirmation - Employee ID: EMP002',
    content: '',
    createdAt: '2026-02-01T10:00:00.000Z'
  },
  {
    id: 'let-005',
    refNo: 'NS/EXP/2026/0034',
    letterType: 'experience-letter',
    employeeId: 'e003',
    employeeName: 'Amit Patel',
    employeeCode: 'EMP003',
    designation: 'Housekeeping Staff',
    department: 'Housekeeping',
    location: 'Noida Branch Site',
    issueDate: '2026-02-28',
    joiningDate: '2024-03-01',
    lastWorkingDate: '2026-02-28',
    signatoryName: 'Amitabh Sharma',
    signatoryDesignation: 'Director - HR',
    status: 'Issued',
    subject: 'Service & Experience Certificate - Amit Patel',
    content: '',
    createdAt: '2026-02-28T14:20:00.000Z'
  },
  {
    id: 'let-006',
    refNo: 'NS/FNF/2026/0012',
    letterType: 'full-final-letter',
    employeeId: 'e003',
    employeeName: 'Amit Patel',
    employeeCode: 'EMP003',
    designation: 'Housekeeping Staff',
    department: 'Housekeeping',
    location: 'Noida Branch Site',
    issueDate: '2026-03-02',
    joiningDate: '2024-03-01',
    lastWorkingDate: '2026-02-28',
    settlementAmount: '₹28,650',
    signatoryName: 'Amitabh Sharma',
    signatoryDesignation: 'Director - HR',
    status: 'Issued',
    subject: 'Final Settlement Voucher - Amit Patel (EMP003)',
    content: '',
    createdAt: '2026-03-02T16:00:00.000Z'
  },
  {
    id: 'let-007',
    refNo: 'NS/APPT/2026/0144',
    letterType: 'appointment-letter',
    employeeId: 'e004',
    employeeName: 'Vikram Singh',
    employeeCode: 'EMP004',
    designation: 'Field Officer',
    department: 'Operations',
    location: 'Manesar Industrial Area',
    issueDate: '2026-03-05',
    joiningDate: '2026-03-10',
    ctc: '₹5,40,000',
    salary: '₹45,000',
    signatoryName: 'Amitabh Sharma',
    signatoryDesignation: 'Director - HR',
    status: 'Draft',
    subject: 'Offer of Appointment for the position of Field Officer',
    content: '',
    createdAt: '2026-03-05T11:45:00.000Z'
  },
  {
    id: 'let-008',
    refNo: 'NS/EXP/2026/0035',
    letterType: 'experience-letter',
    employeeId: 'e005',
    employeeName: 'Sneha Verma',
    employeeCode: 'EMP005',
    designation: 'Helpdesk Executive',
    department: 'Facility Management',
    location: 'South City, Gurugram',
    issueDate: '2026-03-12',
    joiningDate: '2024-06-01',
    lastWorkingDate: '2026-03-10',
    signatoryName: 'Amitabh Sharma',
    signatoryDesignation: 'Director - HR',
    status: 'Sent',
    subject: 'Service & Experience Certificate - Sneha Verma',
    content: '',
    createdAt: '2026-03-12T15:10:00.000Z'
  }
];
