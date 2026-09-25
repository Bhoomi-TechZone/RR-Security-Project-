// NovaSpark HRMS — Mock Salary Components Master Data

export const mockSalaryComponents = [
  {
    id: 'sal-1',
    name: 'Basic Salary',
    code: 'BASIC',
    type: 'earning',
    calculationType: 'fixed',
    defaultValue: '50% of CTC',
    taxable: 'taxable',
    description: 'Core fixed salary component subject to statutory deductions',
    status: 'active'
  },
  {
    id: 'sal-2',
    name: 'House Rent Allowance (HRA)',
    code: 'HRA',
    type: 'earning',
    calculationType: 'percentage_basic',
    defaultValue: '50% of Basic',
    taxable: 'taxable',
    description: 'Accommodation allowance with Section 10(13A) tax exemption limits',
    status: 'active'
  },
  {
    id: 'sal-3',
    name: 'Conveyance Allowance',
    code: 'CONV',
    type: 'earning',
    calculationType: 'fixed',
    defaultValue: '1600',
    taxable: 'taxable',
    description: 'Travel and local conveyance allowance for site duties',
    status: 'active'
  },
  {
    id: 'sal-4',
    name: 'Special Allowance',
    code: 'SA',
    type: 'earning',
    calculationType: 'fixed',
    defaultValue: 'Variable',
    taxable: 'taxable',
    description: 'Balancing monthly allowance provided above statutory minimums',
    status: 'active'
  },
  {
    id: 'sal-5',
    name: 'Overtime Allowance',
    code: 'OT',
    type: 'earning',
    calculationType: 'variable',
    defaultValue: '2x Hourly Rate',
    taxable: 'taxable',
    description: 'Duty compensation calculated from verified extra shift overtime hours',
    status: 'active'
  },
  {
    id: 'sal-6',
    name: 'Provident Fund (Employee PF)',
    code: 'PF',
    type: 'deduction',
    calculationType: 'percentage_basic',
    defaultValue: '12% of Basic',
    taxable: 'non-taxable',
    description: 'Employee retirement contribution as per EPFO regulations',
    status: 'active'
  },
  {
    id: 'sal-7',
    name: 'Employee State Insurance (ESI)',
    code: 'ESI',
    type: 'deduction',
    calculationType: 'percentage_gross',
    defaultValue: '0.75% of Gross',
    taxable: 'non-taxable',
    description: 'Employee healthcare contribution as per ESIC guidelines',
    status: 'active'
  },
  {
    id: 'sal-8',
    name: 'Professional Tax (PT)',
    code: 'PT',
    type: 'deduction',
    calculationType: 'fixed',
    defaultValue: 'State Slab',
    taxable: 'taxable',
    description: 'State government employment tax based on salary slab',
    status: 'active'
  },
  {
    id: 'sal-9',
    name: 'Tax Deducted at Source (TDS)',
    code: 'TDS',
    type: 'deduction',
    calculationType: 'variable',
    defaultValue: 'Income Tax Slab',
    taxable: 'taxable',
    description: 'Monthly income tax withholding deducted as per declared tax regime',
    status: 'active'
  },
  {
    id: 'sal-10',
    name: 'Labour Welfare Fund (LWF)',
    code: 'LWF',
    type: 'deduction',
    calculationType: 'fixed',
    defaultValue: '25',
    taxable: 'taxable',
    description: 'State statutory labour welfare fund contribution',
    status: 'active'
  }
];
