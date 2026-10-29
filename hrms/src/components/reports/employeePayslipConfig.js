/**
 * Employee Payslip — Report Options Configuration
 * 
 * Strictly maps verified HRMS frontend data structures and MongoDB report models
 * into an organized, evenly balanced 4-column layout matching the user's requested visual presentation.
 */

export const EMPLOYEE_PAYSLIP_LAYOUT = [
  // Column 1: Employee Profile & Document Header (10 fields)
  {
    columnId: 'col_1',
    sections: [
      {
        id: 'employee_profile',
        title: 'Employee Profile',
        fields: [
          { id: 'employeeCode', label: 'Employee Code', defaultSelected: true },
          { id: 'empCardNo', label: 'Emp. Card No.', defaultSelected: true },
          { id: 'employeeName', label: 'Employee Name', defaultSelected: true },
          { id: 'fatherHusbandName', label: 'Father / Husband Name', defaultSelected: true },
          { id: 'designation', label: 'Designation', defaultSelected: true },
          { id: 'department', label: 'Department', defaultSelected: true },
          { id: 'location', label: 'Location / Deployment Site', defaultSelected: true },
          { id: 'dateOfJoining', label: 'Date of Joining (DOJ)', defaultSelected: true },
        ],
      },
      {
        id: 'header_branding',
        title: 'Header & Branding',
        fields: [
          { id: 'showCompanyHeader', label: 'Company Header & Address', defaultSelected: true },
          { id: 'showCompanyStatutoryCodes', label: 'Company PAN & ESIC Numbers', defaultSelected: true },
        ],
      },
    ],
  },

  // Column 2: Statutory & Bank Details (9 fields)
  {
    columnId: 'col_2',
    sections: [
      {
        id: 'statutory_details',
        title: 'Statutory Numbers',
        fields: [
          { id: 'esiNo', label: 'ESI IP Number', defaultSelected: true },
          { id: 'uan', label: 'PF UAN Number', defaultSelected: true },
          { id: 'pan', label: 'PAN Card Number', defaultSelected: true },
          { id: 'lwfNo', label: 'LWF Registration Number', defaultSelected: true },
        ],
      },
      {
        id: 'bank_details',
        title: 'Bank & Disbursement',
        fields: [
          { id: 'paymentMode', label: 'Payment Mode (Bank / Cash)', defaultSelected: true },
          { id: 'accountNo', label: 'Bank Account Number', defaultSelected: true },
          { id: 'bankName', label: 'Bank Name', defaultSelected: true },
          { id: 'ifscCode', label: 'Bank IFSC Code', defaultSelected: true },
          { id: 'daysPaid', label: 'Days Paid Indicator', defaultSelected: true },
        ],
      },
    ],
  },

  // Column 3: Attendance Details (9 fields)
  {
    columnId: 'col_3',
    sections: [
      {
        id: 'attendance_details',
        title: 'Attendance Details',
        fields: [
          { id: 'monthDays', label: 'Month Total Days', defaultSelected: true },
          { id: 'present', label: 'Present Days', defaultSelected: true },
          { id: 'wOff', label: 'Weekly Offs (W.Off)', defaultSelected: true },
          { id: 'holiday', label: 'Paid Holidays', defaultSelected: true },
          { id: 'payable', label: 'Payable Days', defaultSelected: true },
          { id: 'lwp', label: 'Leave Without Pay (LWP)', defaultSelected: true },
          { id: 'cl', label: 'Casual Leaves (CL)', defaultSelected: true },
          { id: 'sl', label: 'Sick Leaves (SL)', defaultSelected: true },
          { id: 'el', label: 'Earned Leaves (EL)', defaultSelected: true },
        ],
      },
    ],
  },

  // Column 4: Salary Ledger & Net Payout (10 fields)
  {
    columnId: 'col_4',
    sections: [
      {
        id: 'salary_ledger',
        title: 'Salary Ledger Columns',
        fields: [
          { id: 'showAllowances', label: 'Allowance Names Column', defaultSelected: true },
          { id: 'showRate', label: 'Wage Rate Column', defaultSelected: true },
          { id: 'showPayable', label: 'Payable / Earned Column', defaultSelected: true },
          { id: 'showDeductions', label: 'Deduction Names Column', defaultSelected: true },
          { id: 'showDeductionAmount', label: 'Deduction Amount Column', defaultSelected: true },
          { id: 'showTotalRow', label: 'Gross & Deduction Totals Row', defaultSelected: true },
        ],
      },
      {
        id: 'payout_signatory',
        title: 'Net Payout & Signatory',
        fields: [
          { id: 'netSalary', label: 'NET SALARY Amount Box', defaultSelected: true },
          { id: 'netSalaryWords', label: 'Net Salary in Indian Words', defaultSelected: true },
          { id: 'showAttendanceStrip', label: 'Bottom Attendance Strip', defaultSelected: true },
          { id: 'showAuthorisedSignatory', label: 'Authorised Signatory Box', defaultSelected: true },
        ],
      },
    ],
  },
];

/**
 * Returns default selected options mapping: { [fieldId]: boolean }
 */
export function getDefaultSelectedOptions() {
  const defaults = {
    recordScope: 'active', // 'all' | 'active' | 'inactive'
    excludeHoldSalary: true,
    amountRounding: '0 decimals',
    unitRounding: '0 decimals',
    recordsPerPage: 10,
  };

  EMPLOYEE_PAYSLIP_LAYOUT.forEach((col) => {
    col.sections.forEach((sec) => {
      sec.fields.forEach((field) => {
        defaults[field.id] = field.defaultSelected;
      });
    });
  });

  return defaults;
}

/**
 * Returns mapping with all fields set to checked (true) or unchecked (false)
 */
export function getAllSelectedOptions(checked = true, existingOptions = {}) {
  const result = {
    ...existingOptions,
    recordScope: existingOptions.recordScope || 'active',
    excludeHoldSalary: existingOptions.excludeHoldSalary !== false,
    amountRounding: existingOptions.amountRounding || '0 decimals',
    unitRounding: existingOptions.unitRounding || '0 decimals',
    recordsPerPage: existingOptions.recordsPerPage || 10,
  };

  EMPLOYEE_PAYSLIP_LAYOUT.forEach((col) => {
    col.sections.forEach((sec) => {
      sec.fields.forEach((field) => {
        result[field.id] = checked;
      });
    });
  });

  return result;
}

/**
 * Total count of configurable fields across all columns
 */
export function getTotalOptionsCount() {
  let count = 0;
  EMPLOYEE_PAYSLIP_LAYOUT.forEach((col) => {
    col.sections.forEach((sec) => {
      count += sec.fields.length;
    });
  });
  return count;
}

