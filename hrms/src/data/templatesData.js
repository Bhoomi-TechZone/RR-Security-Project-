/**
 * Default Data & Centralized Placeholders for Admin Templates Management
 */

export const TEMPLATE_PLACEHOLDERS = [
  { key: '{{employeeName}}', label: 'Employee Name', sample: 'Rahul Kumar', category: 'Employee' },
  { key: '{{employeeCode}}', label: 'Employee Code', sample: 'RR-1042', category: 'Employee' },
  { key: '{{designation}}', label: 'Designation', sample: 'Security Officer', category: 'Job' },
  { key: '{{department}}', label: 'Department', sample: 'Security Operations', category: 'Job' },
  { key: '{{location}}', label: 'Work Location / Site', sample: 'DLF Cyber City, Tower B, Gurugram', category: 'Job' },
  { key: '{{reportingManager}}', label: 'Reporting Manager', sample: 'Vikram Singh (Head of Operations)', category: 'Job' },
  { key: '{{joiningDate}}', label: 'Joining Date', sample: '15 Jan 2024', category: 'Dates' },
  { key: '{{lastWorkingDate}}', label: 'Last Working Date', sample: '31 Aug 2026', category: 'Dates' },
  { key: '{{currentDate}}', label: 'Current Date', sample: '04 Sep 2026', category: 'Dates' },
  { key: '{{salary}}', label: 'Monthly Gross Salary', sample: '₹28,500', category: 'Compensation' },
  { key: '{{ctc}}', label: 'Annual CTC', sample: '₹3,42,000', category: 'Compensation' },
  { key: '{{probationPeriod}}', label: 'Probation Period', sample: '6 Months', category: 'Terms' },
  { key: '{{noticePeriod}}', label: 'Notice Period', sample: '30 Days', category: 'Terms' },
  { key: '{{workingHours}}', label: 'Working Hours', sample: '9:00 AM - 6:00 PM (Rotational Shift)', category: 'Terms' },
  { key: '{{companyName}}', label: 'Company Name', sample: 'RR Security & Allied Services Pvt. Ltd.', category: 'Company' },
  { key: '{{companyAddress}}', label: 'Company Address', sample: 'Plot 45, Sector 18, Gurugram, Haryana - 122008', category: 'Company' },
  { key: '{{signatoryName}}', label: 'Signatory Name', sample: 'Amitabh Sharma', category: 'Signatory' },
  { key: '{{signatoryDesignation}}', label: 'Signatory Designation', sample: 'Director - Human Resources', category: 'Signatory' },
  { key: '{{leaveType}}', label: 'Leave Type', sample: 'Earned Leave (EL)', category: 'Leave' },
  { key: '{{leaveFrom}}', label: 'Leave From', sample: '10 Sep 2026', category: 'Leave' },
  { key: '{{leaveTo}}', label: 'Leave To', sample: '12 Sep 2026', category: 'Leave' },
  { key: '{{amount}}', label: 'Claim / Transaction Amount', sample: '₹4,250', category: 'Compensation' },
  { key: '{{settlementAmount}}', label: 'Net Settlement Amount', sample: '₹34,800', category: 'Compensation' }
];

export const mockSalarySlipConfig = {
  templateName: 'Standard Corporate Payslip',
  status: 'Active',
  isDefault: true,
  companyInfo: {
    showLogo: true,
    showCompanyName: true,
    showAddress: true,
    showContact: true,
    showGstPan: true
  },
  employeeInfo: {
    showName: true,
    showEmpCode: true,
    showDepartment: true,
    showDesignation: true,
    showLocation: true,
    showJoiningDate: true,
    showBankDetails: true,
    showUanPf: true,
    showEsiNo: true
  },
  salaryInfo: {
    showPayPeriod: true,
    showEarnings: true,
    showDeductions: true,
    showGrossSalary: true,
    showNetSalary: true,
    showEmployerContribution: true,
    showReimbursements: true
  },
  attendanceInfo: {
    showWorkingDays: true,
    showPresentDays: true,
    showPaidLeave: true,
    showLwp: true,
    showAbsentDays: true,
    showOvertimeHours: true
  },
  statutoryInfo: {
    showPf: true,
    showEsi: true,
    showPt: true,
    showTds: true
  },
  footerInfo: {
    showNotes: true,
    customNotes: 'This is a computer-generated salary slip and does not require a physical signature unless mandated for statutory submission.',
    showAuthorizedSignatory: true,
    signatoryLabel: 'Authorized Signatory',
    showGeneratedTimestamp: true
  },
  lastUpdated: '2026-03-01 11:30 AM'
};

export const mockAppointmentLetterConfig = {
  templateName: 'Standard Executive Appointment Letter',
  status: 'Active',
  isDefault: true,
  headerTitle: 'APPOINTMENT LETTER',
  subject: 'Offer of Appointment for the position of {{designation}}',
  content: `Dear {{employeeName}},

We are pleased to offer you an appointment with {{companyName}} for the position of {{designation}} in our {{department}} department, based at {{location}}.

Your date of joining will be {{joiningDate}}.

1. REMUNERATION & BENEFITS
Your Total Annual Cost to Company (CTC) will be {{ctc}} (Monthly Gross Salary of {{salary}}), subject to statutory tax deductions and standard company payroll policies. Detailed breakdown is enclosed in Annexure A.

2. PROBATION & CONFIRMATION
You will be on probation for a period of {{probationPeriod}} from the date of joining. Upon satisfactory evaluation of your performance, your employment will be confirmed in writing.

3. WORKING HOURS & DUTY ASSIGNMENT
Your standard working schedule is {{workingHours}}. Given operational requirements, you may be deployed on rotational shifts as communicated by your reporting officer {{reportingManager}}.

4. NOTICE PERIOD & TERMINATION
During probation, either party may terminate employment by providing 15 days written notice. Post confirmation, the notice period required is {{noticePeriod}}.

Please sign and return the duplicate copy of this letter as confirmation of your acceptance.

We welcome you to {{companyName}} and look forward to a rewarding association.

Sincerely,
For {{companyName}},

{{signatoryName}}
{{signatoryDesignation}}`,
  lastUpdated: '2026-02-27 03:20 PM'
};

export const mockJoiningLetterConfig = {
  templateName: 'Official Employee Joining Letter',
  status: 'Active',
  isDefault: true,
  headerTitle: 'JOINING & ONBOARDING',
  subject: 'Joining Confirmation - Employee ID: {{employeeCode}}',
  content: `To,
{{employeeName}}
Employee ID: {{employeeCode}}
Designation: {{designation}}
Department: {{department}}

Dear {{employeeName}},

This is to officially confirm your joining at {{companyName}} on {{joiningDate}} as {{designation}}.

You will be stationed at our site/branch located at {{location}} and will report directly to {{reportingManager}}.

Terms of Onboarding:
• Verification of background check and submitted statutory documents.
• Adherence to the company code of conduct, dress code, and confidentiality protocols.
• Standard duty roster schedule: {{workingHours}}.

We are confident that your expertise will be a significant contribution to our organization.

Authorized By:
{{signatoryName}}
{{signatoryDesignation}}
{{companyName}}`,
  lastUpdated: '2026-02-26 01:10 PM'
};

export const mockExperienceLetterConfig = {
  templateName: 'Standard Service & Experience Certificate',
  status: 'Active',
  isDefault: true,
  headerTitle: 'EXPERIENCE CERTIFICATE',
  subject: 'Service & Experience Certificate - {{employeeName}}',
  content: `Date: {{currentDate}}

TO WHOMSOEVER IT MAY CONCERN

This is to certify that {{employeeName}} (Employee Code: {{employeeCode}}) was employed with {{companyName}} from {{joiningDate}} to {{lastWorkingDate}}.

During this tenure, {{employeeName}} worked as {{designation}} in the {{department}} department based out of {{location}}.

During the term of employment, {{employeeName}} performed the assigned operational duties with sincere commitment, professional diligence, and high integrity. Conduct with colleagues, supervisors, and clients was commendable.

{{employeeName}} has been relieved of all official duties on {{lastWorkingDate}} after successful handover of company assets and clearance of accounts.

We wish {{employeeName}} every success in all future professional endeavors.

For {{companyName}},

{{signatoryName}}
{{signatoryDesignation}}`,
  lastUpdated: '2026-03-02 10:00 AM'
};

export const mockFullFinalLetterConfig = {
  templateName: 'Full & Final Settlement Clearance',
  status: 'Active',
  isDefault: true,
  headerTitle: 'FULL & FINAL SETTLEMENT',
  subject: 'Final Settlement Voucher - {{employeeName}} ({{employeeCode}})',
  content: `Date: {{currentDate}}

FULL & FINAL SETTLEMENT CLEARANCE

Employee Name: {{employeeName}}
Employee Code: {{employeeCode}}
Department: {{department}}
Designation: {{designation}}
Date of Joining: {{joiningDate}}
Date of Leaving: {{lastWorkingDate}}

SETTLEMENT SUMMARY:
------------------------------------------------------------
A. EARNINGS & ACCRUALS:
   1. Unpaid Salary / Earned Days
   2. Leave Encashment
   3. Gratuity / Statutory Bonus (if applicable)
   4. Approved Expense Reimbursements

B. DEDUCTIONS & RECOVERIES:
   1. Statutory Deductions (PF / PT / TDS)
   2. Asset Clearance / ID Recovery
   3. Notice Period Recovery (if applicable)

NET PAYABLE SETTLEMENT AMOUNT: {{settlementAmount}}
------------------------------------------------------------

DECLARATION & RECEIPT:
I, {{employeeName}}, hereby acknowledge receipt of the final settlement amount and confirm that I have no outstanding claims, financial dues, or grievances against {{companyName}}.

Employee Signature: _______________________      Date: ______________

Authorized Signatory:
{{signatoryName}}
{{signatoryDesignation}}
{{companyName}}`,
  lastUpdated: '2026-02-28 05:40 PM'
};

export const mockEmailTemplates = [
  {
    id: 'em-1',
    name: 'Employee Welcome & Portal Credentials',
    category: 'Onboarding',
    subject: 'Welcome to {{companyName}} - Your Self-Service Portal Access',
    body: `Hi {{employeeName}},

Welcome to the {{companyName}} team! We are thrilled to have you onboard as our new {{designation}} in {{department}}.

Your Employee Code is: {{employeeCode}}
Your Work Location is: {{location}}

You can access your employee self-service dashboard to view your attendance, shifts, leave balances, and salary slips here:
Portal URL: https://portal.novasparkhrms.com

If you need any assistance, feel free to reach out to HR or your manager {{reportingManager}}.

Best regards,
{{companyName}} HR Team`,
    status: 'Active',
    isDefault: true,
    lastUpdated: '2026-03-01 10:15 AM'
  },
  {
    id: 'em-2',
    name: 'Appointment Letter Issued',
    category: 'Onboarding',
    subject: 'Appointment Letter - {{designation}} at {{companyName}}',
    body: `Dear {{employeeName}},

Congratulations! Please find attached your formal Appointment Letter for the role of {{designation}} at {{companyName}}.

Your date of joining is confirmed as {{joiningDate}}.

Please review the attached document and return a signed acknowledgment copy at the earliest.

Warm regards,
{{signatoryName}}
{{companyName}}`,
    status: 'Active',
    isDefault: true,
    lastUpdated: '2026-02-27 04:00 PM'
  },
  {
    id: 'em-3',
    name: 'Leave Request Approved',
    category: 'Leave Management',
    subject: 'Leave Approved: {{leaveType}} from {{leaveFrom}} to {{leaveTo}}',
    body: `Dear {{employeeName}},

Your request for {{leaveType}} from {{leaveFrom}} to {{leaveTo}} has been APPROVED by your reporting manager.

Your leave balance has been adjusted accordingly. You can view your updated balance on the Employee Portal.

Regards,
{{companyName}} HRMS`,
    status: 'Active',
    isDefault: true,
    lastUpdated: '2026-02-25 11:30 AM'
  },
  {
    id: 'em-4',
    name: 'Leave Request Rejected',
    category: 'Leave Management',
    subject: 'Leave Application Status: Rejected',
    body: `Dear {{employeeName}},

We regret to inform you that your request for {{leaveType}} from {{leaveFrom}} to {{leaveTo}} could not be approved due to operational shift requirements.

Please get in touch with your supervisor {{reportingManager}} for further discussion.

Regards,
{{companyName}} Operations Team`,
    status: 'Active',
    isDefault: true,
    lastUpdated: '2026-02-20 09:45 AM'
  },
  {
    id: 'em-5',
    name: 'Salary Slip Available Notification',
    category: 'Payroll',
    subject: 'Payslip Available for Download - {{companyName}}',
    body: `Dear {{employeeName}},

Your salary slip for the recent pay cycle has been generated and is now available for download.

Net Salary Credited: {{salary}}
Employee Code: {{employeeCode}}

Log into your Employee Portal or check the attached PDF for a complete breakdown of earnings and deductions.

Sincerely,
Payroll Department
{{companyName}}`,
    status: 'Active',
    isDefault: true,
    lastUpdated: '2026-03-02 08:30 AM'
  },
  {
    id: 'em-6',
    name: 'Overtime Claim Approved',
    category: 'Overtime',
    subject: 'Overtime Claim Approved - {{employeeName}}',
    body: `Dear {{employeeName}},

Your extra duty / overtime claim for {{amount}} has been approved by {{reportingManager}} and forwarded for payroll credit in the upcoming pay run.

Regards,
Operations & Payroll Team`,
    status: 'Active',
    isDefault: false,
    lastUpdated: '2026-02-15 02:20 PM'
  },
  {
    id: 'em-7',
    name: 'Reimbursement Approved',
    category: 'Claims',
    subject: 'Reimbursement Request Approved - {{amount}}',
    body: `Dear {{employeeName}},

Your expense reimbursement claim of {{amount}} has received final approval from Accounts and is scheduled for disbursement.

Thank you,
Finance & Accounts
{{companyName}}`,
    status: 'Active',
    isDefault: true,
    lastUpdated: '2026-02-18 01:50 PM'
  },
  {
    id: 'em-8',
    name: 'Account Password Reset',
    category: 'Security',
    subject: 'Password Reset Request - {{companyName}} HRMS',
    body: `Hello {{employeeName}},

We received a request to reset your password for your {{companyName}} HRMS account ({{employeeCode}}).

Click the secure link below to reset your password. This link is valid for 15 minutes:
https://portal.novasparkhrms.com/reset-password?token=sample-token-12345

If you did not request this, please notify IT Security immediately.

Regards,
IT Security Team`,
    status: 'Active',
    isDefault: true,
    lastUpdated: '2026-02-10 11:00 AM'
  }
];

export const EMAIL_CATEGORIES = [
  'All Categories',
  'Onboarding',
  'Leave Management',
  'Payroll',
  'Overtime',
  'Claims',
  'Security'
];
