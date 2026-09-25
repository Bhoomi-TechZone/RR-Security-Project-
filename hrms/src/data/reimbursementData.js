// NovaSpark HRMS — Reimbursement Management Mock Data & Helpers
// Ready for backend API integration

export const INITIAL_EXPENSE_TYPES = [
  {
    id: 'exp-1',
    name: 'Travel / Conveyance',
    code: 'TRV',
    maxLimit: 5000,
    requiresReceipt: true,
    status: 'Active',
    description: 'Official travel, auto, train, bus and flight ticket expenses'
  },
  {
    id: 'exp-2',
    name: 'Cab / Taxi',
    code: 'CAB',
    maxLimit: 3000,
    requiresReceipt: true,
    status: 'Active',
    description: 'Local taxi, Uber, Ola and metered commercial ride fares'
  },
  {
    id: 'exp-3',
    name: 'Fuel',
    code: 'FUEL',
    maxLimit: 4000,
    requiresReceipt: true,
    status: 'Active',
    description: 'Petrol / Diesel reimbursement for official commute and site visits'
  },
  {
    id: 'exp-4',
    name: 'Food / Meal',
    code: 'FOOD',
    maxLimit: 1500,
    requiresReceipt: true,
    status: 'Active',
    description: 'Working lunch, outstation meals and client meeting refreshments'
  },
  {
    id: 'exp-5',
    name: 'Mobile / Internet',
    code: 'TEL',
    maxLimit: 1200,
    requiresReceipt: true,
    status: 'Active',
    description: 'Monthly postpaid cellular bills and broadband connectivity allowances'
  },
  {
    id: 'exp-6',
    name: 'Hotel / Accommodation',
    code: 'HTL',
    maxLimit: 10000,
    requiresReceipt: true,
    status: 'Active',
    description: 'Outstation lodging, guest house charges and room tariff bills'
  },
  {
    id: 'exp-7',
    name: 'Uniform / Miscellaneous',
    code: 'UNIF',
    maxLimit: 2500,
    requiresReceipt: false,
    status: 'Active',
    description: 'Security guard uniform repairs, boots, laundry and safety accessories'
  },
  {
    id: 'exp-8',
    name: 'Client-site Expenses',
    code: 'SITE',
    maxLimit: 6000,
    requiresReceipt: true,
    status: 'Active',
    description: 'Emergency stationeries, guard booth supplies and on-site incidental costs'
  },
  {
    id: 'exp-9',
    name: 'Other Expenses',
    code: 'OTH',
    maxLimit: 5000,
    requiresReceipt: true,
    status: 'Active',
    description: 'Miscellaneous authorized business expenditures not covered above'
  }
];

export const PAYMENT_MODES = [
  'Bank Transfer',
  'UPI',
  'Cash',
  'Cheque',
  'Other'
];

export const REIMBURSEMENT_HEADS = [
  'Conveyance Reimbursement',
  'Medical Reimbursement',
  'Telephone Reimbursement',
  'Travel & Lodging',
  'Fuel Reimbursement',
  'Uniform Allowance',
  'Special Reimbursement'
];

export const APPROVAL_STATUSES = [
  'Draft',
  'Submitted',
  'Pending Manager Approval',
  'Pending HR/Admin Approval',
  'Pending Accounts Verification',
  'Approved',
  'Rejected',
  'Sent Back'
];

export const PAYMENT_STATUSES = [
  'Unpaid',
  'Processing',
  'Paid'
];

export const INITIAL_REIMBURSEMENT_CLAIMS = [
  {
    id: 'clm-001',
    claimId: 'CLM-2026-001',
    employeeId: 'e001',
    employeeCode: 'EMP001',
    employeeName: 'Rahul Kumar',
    department: 'Security',
    designation: 'Security Guard',
    client: 'ABC Security Services',
    site: 'Main Gate Bareilly',
    expenseDate: '2026-02-24',
    expenseType: 'Travel / Conveyance',
    amount: 2450,
    approvedAmount: 2450,
    purpose: 'Night shift emergency conveyance and patrol transit between Bareilly Gate 1 and Gate 3.',
    receipt: {
      fileName: 'Travel_Receipt_Feb24.pdf',
      fileSize: '420 KB',
      fileType: 'application/pdf',
      uploadedAt: '2026-02-25 10:15 AM',
      previewUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=60'
    },
    approvalStatus: 'Approved',
    currentApprover: 'Accounts Department',
    paymentStatus: 'Processing',
    paidAmount: 0,
    paymentDate: null,
    paymentMode: 'Bank Transfer',
    transactionNumber: '',
    payrollIncluded: true,
    payrollMonth: '2026-03',
    reimbursementHead: 'Conveyance Reimbursement',
    taxable: false,
    rejectionReason: '',
    sendBackReason: '',
    submittedDate: '2026-02-25 10:30 AM',
    approvalHistory: [
      {
        action: 'Submitted',
        person: 'Rahul Kumar',
        role: 'Employee',
        date: '25 Feb 2026',
        time: '10:30 AM',
        comment: 'Claim submitted with attached transit receipt.'
      },
      {
        action: 'Approved',
        person: 'Vikram Singh',
        role: 'Reporting Manager',
        date: '25 Feb 2026',
        time: '02:15 PM',
        comment: 'Verified with shift patrol log sheet. Approved.'
      },
      {
        action: 'Approved',
        person: 'Admin HR',
        role: 'HR/Admin',
        date: '26 Feb 2026',
        time: '11:00 AM',
        comment: 'Policy check cleared. Forwarded to Accounts.'
      },
      {
        action: 'Verified',
        person: 'Kavita Sen',
        role: 'Accounts',
        date: '26 Feb 2026',
        time: '04:45 PM',
        comment: 'GST bill details verified. Ready for payout.'
      }
    ]
  },
  {
    id: 'clm-002',
    claimId: 'CLM-2026-002',
    employeeId: 'e002',
    employeeCode: 'EMP002',
    employeeName: 'Priya Sharma',
    department: 'Admin',
    designation: 'Admin Executive',
    client: 'ABC Security Services',
    site: 'Corporate HQ',
    expenseDate: '2026-02-20',
    expenseType: 'Mobile / Internet',
    amount: 999,
    approvedAmount: 999,
    purpose: 'Monthly broadband and corporate SIM billing for remote dispatch operations.',
    receipt: {
      fileName: 'Airtel_Broadband_Feb2026.pdf',
      fileSize: '215 KB',
      fileType: 'application/pdf',
      uploadedAt: '2026-02-21 09:30 AM',
      previewUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=60'
    },
    approvalStatus: 'Approved',
    currentApprover: 'Completed',
    paymentStatus: 'Paid',
    paidAmount: 999,
    paymentDate: '2026-03-01',
    paymentMode: 'Bank Transfer',
    transactionNumber: 'UTR9832104921',
    payrollIncluded: true,
    payrollMonth: '2026-02',
    reimbursementHead: 'Telephone Reimbursement',
    taxable: false,
    rejectionReason: '',
    sendBackReason: '',
    submittedDate: '2026-02-21 09:35 AM',
    approvalHistory: [
      {
        action: 'Submitted',
        person: 'Priya Sharma',
        role: 'Employee',
        date: '21 Feb 2026',
        time: '09:35 AM',
        comment: 'Official bill attached.'
      },
      {
        action: 'Approved',
        person: 'Admin HR',
        role: 'HR/Admin',
        date: '21 Feb 2026',
        time: '12:10 PM',
        comment: 'Monthly entitlement verified.'
      },
      {
        action: 'Verified',
        person: 'Kavita Sen',
        role: 'Accounts',
        date: '22 Feb 2026',
        time: '03:30 PM',
        comment: 'Accounts cleared.'
      },
      {
        action: 'Payment Completed',
        person: 'Kavita Sen',
        role: 'Accounts',
        date: '01 Mar 2026',
        time: '10:00 AM',
        comment: 'Transferred via NEFT UTR9832104921.'
      }
    ]
  },
  {
    id: 'clm-003',
    claimId: 'CLM-2026-003',
    employeeId: 'e003',
    employeeCode: 'EMP003',
    employeeName: 'Vikram Singh',
    department: 'Operations',
    designation: 'Operations Field Officer',
    client: 'ABC Security Services',
    site: 'Site Alpha Industrial Area',
    expenseDate: '2026-02-26',
    expenseType: 'Fuel',
    amount: 3200,
    approvedAmount: 3000,
    purpose: 'Routine site audit inspections across 8 remote guard posts in industrial area.',
    receipt: {
      fileName: 'IOCL_Fuel_Receipt_26Feb.jpg',
      fileSize: '1.2 MB',
      fileType: 'image/jpeg',
      uploadedAt: '2026-02-27 11:20 AM',
      previewUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=60'
    },
    approvalStatus: 'Pending Accounts Verification',
    currentApprover: 'Accounts Department',
    paymentStatus: 'Unpaid',
    paidAmount: 0,
    paymentDate: null,
    paymentMode: 'Bank Transfer',
    transactionNumber: '',
    payrollIncluded: false,
    payrollMonth: '2026-03',
    reimbursementHead: 'Fuel Reimbursement',
    taxable: false,
    rejectionReason: '',
    sendBackReason: '',
    submittedDate: '2026-02-27 11:25 AM',
    approvalHistory: [
      {
        action: 'Submitted',
        person: 'Vikram Singh',
        role: 'Employee',
        date: '27 Feb 2026',
        time: '11:25 AM',
        comment: 'Fuel slips for 180 km site audit attached.'
      },
      {
        action: 'Approved',
        person: 'Suresh Raina',
        role: 'Reporting Manager',
        date: '27 Feb 2026',
        time: '03:15 PM',
        comment: 'KM log verified against GPS tracker.'
      },
      {
        action: 'Approved',
        person: 'Admin HR',
        role: 'HR/Admin',
        date: '28 Feb 2026',
        time: '10:45 AM',
        comment: 'Approved ₹3,000 as per monthly officer fuel capping (₹200 variance remark).'
      }
    ]
  },
  {
    id: 'clm-004',
    claimId: 'CLM-2026-004',
    employeeId: 'e004',
    employeeCode: 'EMP004',
    employeeName: 'Amit Patel',
    department: 'Security',
    designation: 'Security Supervisor',
    client: 'Apex Guarding Services',
    site: 'Sector 18 Plant',
    expenseDate: '2026-02-27',
    expenseType: 'Food / Meal',
    amount: 1650,
    approvedAmount: 0,
    purpose: 'Catering and refreshment costs for visiting client audit team during surprise security check.',
    receipt: {
      fileName: 'Bikanervala_Food_Bill.jpg',
      fileSize: '890 KB',
      fileType: 'image/jpeg',
      uploadedAt: '2026-02-28 09:00 AM',
      previewUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=60'
    },
    approvalStatus: 'Pending HR/Admin Approval',
    currentApprover: 'HR / Admin Head',
    paymentStatus: 'Unpaid',
    paidAmount: 0,
    paymentDate: null,
    paymentMode: 'UPI',
    transactionNumber: '',
    payrollIncluded: true,
    payrollMonth: '2026-03',
    reimbursementHead: 'Special Reimbursement',
    taxable: false,
    rejectionReason: '',
    sendBackReason: '',
    submittedDate: '2026-02-28 09:10 AM',
    approvalHistory: [
      {
        action: 'Submitted',
        person: 'Amit Patel',
        role: 'Employee',
        date: '28 Feb 2026',
        time: '09:10 AM',
        comment: 'Refreshment bill attached.'
      },
      {
        action: 'Approved',
        person: 'Vikram Singh',
        role: 'Reporting Manager',
        date: '28 Feb 2026',
        time: '11:40 AM',
        comment: 'Pre-authorized for client visit.'
      }
    ]
  },
  {
    id: 'clm-005',
    claimId: 'CLM-2026-005',
    employeeId: 'e005',
    employeeCode: 'EMP005',
    employeeName: 'Sunita Devi',
    department: 'Housekeeping',
    designation: 'Housekeeping Staff',
    client: 'HealthFirst Facility Care',
    site: 'Bareilly Hospital Ward',
    expenseDate: '2026-03-01',
    expenseType: 'Uniform / Miscellaneous',
    amount: 1200,
    approvedAmount: 0,
    purpose: 'Special safety gloves, apron and sanitized boot repairs required for ICU deep cleaning protocol.',
    receipt: {
      fileName: 'Medical_Store_Receipt.jpg',
      fileSize: '540 KB',
      fileType: 'image/jpeg',
      uploadedAt: '2026-03-01 02:00 PM',
      previewUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=60'
    },
    approvalStatus: 'Pending Manager Approval',
    currentApprover: 'Sunil Mehra (Reporting Manager)',
    paymentStatus: 'Unpaid',
    paidAmount: 0,
    paymentDate: null,
    paymentMode: 'Cash',
    transactionNumber: '',
    payrollIncluded: true,
    payrollMonth: '2026-03',
    reimbursementHead: 'Uniform Allowance',
    taxable: false,
    rejectionReason: '',
    sendBackReason: '',
    submittedDate: '2026-03-01 02:15 PM',
    approvalHistory: [
      {
        action: 'Submitted',
        person: 'Sunita Devi',
        role: 'Employee',
        date: '01 Mar 2026',
        time: '02:15 PM',
        comment: 'Purchased as per hospital sanitation directive.'
      }
    ]
  },
  {
    id: 'clm-006',
    claimId: 'CLM-2026-006',
    employeeId: 'e006',
    employeeCode: 'EMP006',
    employeeName: 'Rajesh Verma',
    department: 'Technical',
    designation: 'CCTV Technician',
    client: 'CyberTech Facilities',
    site: 'Data Center Noida',
    expenseDate: '2026-02-18',
    expenseType: 'Hotel / Accommodation',
    amount: 8500,
    approvedAmount: 0,
    purpose: '3-day emergency stay at Sector 62 Hotel for NVR server installation.',
    receipt: {
      fileName: 'Hotel_LemonTree_Invoice.pdf',
      fileSize: '1.8 MB',
      fileType: 'application/pdf',
      uploadedAt: '2026-02-22 10:00 AM',
      previewUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=60'
    },
    approvalStatus: 'Rejected',
    currentApprover: 'Closed',
    paymentStatus: 'Unpaid',
    paidAmount: 0,
    paymentDate: null,
    paymentMode: 'Bank Transfer',
    transactionNumber: '',
    payrollIncluded: false,
    payrollMonth: '2026-02',
    reimbursementHead: 'Travel & Lodging',
    taxable: false,
    rejectionReason: 'Exceeded company hotel allowance capping of ₹2,000/night without prior Director pre-approval.',
    sendBackReason: '',
    submittedDate: '2026-02-22 10:15 AM',
    approvalHistory: [
      {
        action: 'Submitted',
        person: 'Rajesh Verma',
        role: 'Employee',
        date: '22 Feb 2026',
        time: '10:15 AM',
        comment: 'Emergency outstation stay.'
      },
      {
        action: 'Rejected',
        person: 'Admin HR',
        role: 'HR/Admin',
        date: '23 Feb 2026',
        time: '04:00 PM',
        comment: 'Exceeded company hotel allowance capping of ₹2,000/night without prior Director pre-approval.'
      }
    ]
  },
  {
    id: 'clm-007',
    claimId: 'CLM-2026-007',
    employeeId: 'e007',
    employeeCode: 'EMP007',
    employeeName: 'Deepak Joshi',
    department: 'Security',
    designation: 'Armed Guard',
    client: 'Apex Guarding Services',
    site: 'Warehouse Hub Moradabad',
    expenseDate: '2026-02-25',
    expenseType: 'Cab / Taxi',
    amount: 1450,
    approvedAmount: 0,
    purpose: 'Urgent taxi hire to transport licensed weapon escort team to Moradabad cash vault.',
    receipt: {
      fileName: 'Taxi_Slip_Blurred.jpg',
      fileSize: '310 KB',
      fileType: 'image/jpeg',
      uploadedAt: '2026-02-26 12:30 PM',
      previewUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=60'
    },
    approvalStatus: 'Sent Back',
    currentApprover: 'Deepak Joshi (Awaiting Correction)',
    paymentStatus: 'Unpaid',
    paidAmount: 0,
    paymentDate: null,
    paymentMode: 'Cash',
    transactionNumber: '',
    payrollIncluded: false,
    payrollMonth: '2026-03',
    reimbursementHead: 'Conveyance Reimbursement',
    taxable: false,
    rejectionReason: '',
    sendBackReason: 'Attached driver receipt is blurred and vehicle license plate number is not readable. Please upload a clear photo.',
    submittedDate: '2026-02-26 12:45 PM',
    approvalHistory: [
      {
        action: 'Submitted',
        person: 'Deepak Joshi',
        role: 'Employee',
        date: '26 Feb 2026',
        time: '12:45 PM',
        comment: 'Cab bill submitted.'
      },
      {
        action: 'Sent Back',
        person: 'Vikram Singh',
        role: 'Reporting Manager',
        date: '27 Feb 2026',
        time: '09:30 AM',
        comment: 'Attached driver receipt is blurred and vehicle license plate number is not readable. Please upload a clear photo.'
      }
    ]
  },
  {
    id: 'clm-008',
    claimId: 'CLM-2026-008',
    employeeId: 'e008',
    employeeCode: 'EMP008',
    employeeName: 'Kavita Sen',
    department: 'Accounts',
    designation: 'Senior Accountant',
    client: 'ABC Security Services',
    site: 'Corporate HQ',
    expenseDate: '2026-02-23',
    expenseType: 'Client-site Expenses',
    amount: 4100,
    approvedAmount: 4100,
    purpose: 'Urgent purchase of stationery, registers and biometric backup batteries for Bareilly field deployment.',
    receipt: {
      fileName: 'Stationery_Tax_Invoice.pdf',
      fileSize: '760 KB',
      fileType: 'application/pdf',
      uploadedAt: '2026-02-24 11:00 AM',
      previewUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=60'
    },
    approvalStatus: 'Approved',
    currentApprover: 'Completed',
    paymentStatus: 'Paid',
    paidAmount: 4100,
    paymentDate: '2026-02-28',
    paymentMode: 'UPI',
    transactionNumber: 'UPI7738291044',
    payrollIncluded: false,
    payrollMonth: '2026-02',
    reimbursementHead: 'Special Reimbursement',
    taxable: false,
    rejectionReason: '',
    sendBackReason: '',
    submittedDate: '2026-02-24 11:15 AM',
    approvalHistory: [
      {
        action: 'Submitted',
        person: 'Kavita Sen',
        role: 'Employee',
        date: '24 Feb 2026',
        time: '11:15 AM',
        comment: 'GST Invoice 8812 attached.'
      },
      {
        action: 'Approved',
        person: 'Admin HR',
        role: 'HR/Admin',
        date: '24 Feb 2026',
        time: '03:45 PM',
        comment: 'Approved as per emergency stationeries requisition.'
      },
      {
        action: 'Payment Completed',
        person: 'Accounts Head',
        role: 'Accounts',
        date: '28 Feb 2026',
        time: '05:20 PM',
        comment: 'Settled via UPI Ref: UPI7738291044.'
      }
    ]
  }
];

// Helper to compute live dashboard metrics from claims array
export function calculateReimbursementMetrics(claims) {
  const totalClaims = claims.length;
  const pendingApproval = claims.filter(c => 
    c.approvalStatus.includes('Pending') || c.approvalStatus === 'Submitted'
  ).length;
  const approved = claims.filter(c => c.approvalStatus === 'Approved').length;
  const rejected = claims.filter(c => c.approvalStatus === 'Rejected').length;
  const sentBack = claims.filter(c => c.approvalStatus === 'Sent Back').length;
  
  const pendingPayment = claims.filter(c => 
    c.approvalStatus === 'Approved' && (c.paymentStatus === 'Unpaid' || c.paymentStatus === 'Processing')
  ).length;

  const paidAmount = claims
    .filter(c => c.paymentStatus === 'Paid')
    .reduce((sum, c) => sum + (Number(c.paidAmount) || 0), 0);

  // Month calculations (current month: Feb/March 2026)
  const currentMonthPrefix = '2026-02';
  const thisMonthClaims = claims.filter(c => c.expenseDate && c.expenseDate.startsWith('2026-02') || c.expenseDate.startsWith('2026-03')).length;
  
  const thisMonthReimbursed = claims
    .filter(c => c.paymentStatus === 'Paid' && (c.paymentDate && (c.paymentDate.startsWith('2026-02') || c.paymentDate.startsWith('2026-03'))))
    .reduce((sum, c) => sum + (Number(c.paidAmount) || 0), 0);

  return {
    totalClaims,
    pendingApproval,
    approved,
    rejected,
    sentBack,
    pendingPayment,
    paidAmount,
    thisMonthClaims,
    thisMonthReimbursed
  };
}
