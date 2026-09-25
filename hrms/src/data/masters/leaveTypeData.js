// NovaSpark HRMS — Mock Leave Type Master Data

export const mockLeaveTypes = [
  {
    id: 'lt-1',
    name: 'Casual Leave',
    code: 'CL',
    paidType: 'paid',
    annualQuota: 12,
    carryForward: false,
    maxAccumulation: 12,
    encashment: false,
    description: 'Short unplanned leaves for personal reasons and unforeseen exigencies',
    status: 'active'
  },
  {
    id: 'lt-2',
    name: 'Sick Leave',
    code: 'SL',
    paidType: 'paid',
    annualQuota: 10,
    carryForward: true,
    maxAccumulation: 30,
    encashment: false,
    description: 'Leave granted for medical recovery and health ailments',
    status: 'active'
  },
  {
    id: 'lt-3',
    name: 'Earned / Privilege Leave',
    code: 'EL',
    paidType: 'paid',
    annualQuota: 15,
    carryForward: true,
    maxAccumulation: 45,
    encashment: true,
    description: 'Accumulated annual leaves eligible for encashment or planned vacations',
    status: 'active'
  },
  {
    id: 'lt-4',
    name: 'Leave Without Pay',
    code: 'LWP',
    paidType: 'unpaid',
    annualQuota: 0,
    carryForward: false,
    maxAccumulation: 0,
    encashment: false,
    description: 'Unpaid leaves taken beyond standard paid entitlements',
    status: 'active'
  },
  {
    id: 'lt-5',
    name: 'Maternity Leave',
    code: 'ML',
    paidType: 'paid',
    annualQuota: 180,
    carryForward: false,
    maxAccumulation: 180,
    encashment: false,
    description: 'Statutory maternity benefits as per Maternity Benefit Act guidelines',
    status: 'active'
  },
  {
    id: 'lt-6',
    name: 'Compensatory Off',
    code: 'CO',
    paidType: 'paid',
    annualQuota: 0,
    carryForward: false,
    maxAccumulation: 5,
    encashment: false,
    description: 'Leave granted in lieu of overtime duty done on weekly off or holidays',
    status: 'active'
  }
];
