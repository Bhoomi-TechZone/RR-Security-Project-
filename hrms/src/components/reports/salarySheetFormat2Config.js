/**
 * Salary Sheet (Format 2) — Report Options Configuration
 * FORM - IV [Payment of Wages Rules, 1971] Register of Payment of Wages
 * 
 * Strictly maps verified HRMS frontend data structures and MongoDB report models
 * into an organized, evenly balanced 4-column layout matching the user's requested visual presentation.
 */

export const SALARY_SHEET_FORMAT_2_LAYOUT = [
  // Column 1: Basic Details & Statutory / Bank Identifiers (14 fields)
  {
    columnId: 'col_1',
    sections: [
      {
        id: 'basic_details',
        title: 'Basic Details',
        fields: [
          { id: 'employeeId', label: 'Emp. Code / Card No.', defaultSelected: true },
          { id: 'name', label: 'Employee Name', defaultSelected: true },
          { id: 'fatherHusbandName', label: 'Father / Husband Name', defaultSelected: true },
          { id: 'dob', label: 'Date of Birth (DOB)', defaultSelected: true },
          { id: 'doj', label: 'Date of Joining (DOJ)', defaultSelected: true },
          { id: 'designation', label: 'Designation', defaultSelected: true },
          { id: 'department', label: 'Department', defaultSelected: true },
          { id: 'srNo', label: 'Sr. No.', defaultSelected: true },
        ],
      },
      {
        id: 'statutory_bank',
        title: 'Statutory & Bank Identifiers',
        fields: [
          { id: 'esiNo', label: 'ESI IP Number', defaultSelected: true },
          { id: 'uan', label: 'PF UAN Number', defaultSelected: true },
          { id: 'aadhaar', label: 'Aadhaar Number', defaultSelected: true },
          { id: 'bankAccountNo', label: 'Bank Account Number', defaultSelected: true },
          { id: 'paymentMode', label: 'Payment Mode (Bank/Cash)', defaultSelected: true },
          { id: 'signature', label: 'Signature / Thumb Ack.', defaultSelected: true },
        ],
      },
    ],
  },

  // Column 2: Attendance & Rate of Pay (17 fields)
  {
    columnId: 'col_2',
    sections: [
      {
        id: 'attendance',
        title: 'Attendance',
        fields: [
          { id: 'attTot', label: 'Payable Days (Total)', defaultSelected: true },
          { id: 'attWd', label: 'Month Working Days', defaultSelected: true },
          { id: 'attPd', label: 'Present Days (Present)', defaultSelected: true },
          { id: 'attWo', label: 'Weekly Offs (W.Off)', defaultSelected: true },
          { id: 'attPh', label: 'Holidays (Holiday)', defaultSelected: true },
          { id: 'attEl', label: 'Earned Leaves (EL)', defaultSelected: true },
          { id: 'attCl', label: 'Casual Leaves (CL)', defaultSelected: true },
          { id: 'attSl', label: 'Sick Leaves (SL)', defaultSelected: true },
          { id: 'attLwp', label: 'Leave Without Pay (LWP)', defaultSelected: false },
          { id: 'attOt', label: 'Overtime Days (OT)', defaultSelected: false },
        ],
      },
      {
        id: 'rate_of_pay',
        title: 'Rate of Pay',
        fields: [
          { id: 'rateBasic', label: 'Basic Pay Rate', defaultSelected: true },
          { id: 'rateDa', label: 'D.A. Rate', defaultSelected: true },
          { id: 'rateHra', label: 'HRA Rate', defaultSelected: true },
          { id: 'rateConv', label: 'CONV ALLO Rate', defaultSelected: true },
          { id: 'rateSpAll', label: 'SPEC ALLO Rate', defaultSelected: true },
          { id: 'rateBonus', label: 'Bonus Rate', defaultSelected: true },
          { id: 'rateTotal', label: 'Total Rate of Pay', defaultSelected: true },
        ],
      },
    ],
  },

  // Column 3: Earnings Components & Net Payout (12 fields)
  {
    columnId: 'col_3',
    sections: [
      {
        id: 'earnings',
        title: 'Earnings Components',
        fields: [
          { id: 'earnBasic', label: 'Basic Wages Earned', defaultSelected: true },
          { id: 'earnDa', label: 'D.A. Earned', defaultSelected: true },
          { id: 'earnHra', label: 'HRA Earned', defaultSelected: true },
          { id: 'earnConv', label: 'CONV ALLO Earned', defaultSelected: true },
          { id: 'earnSpAll', label: 'SPEC ALLOW Earned', defaultSelected: true },
          { id: 'earnBonus', label: 'Bonus Earned', defaultSelected: true },
          { id: 'earnLeave', label: 'Leave Wages', defaultSelected: true },
          { id: 'earnArrear', label: 'Arrear Wages', defaultSelected: true },
          { id: 'earnUniAllow', label: 'Uniform Allowance', defaultSelected: true },
          { id: 'earnOtAmount', label: 'Overtime Amount (OT)', defaultSelected: true },
          { id: 'grossSalary', label: 'Gross Salary (Total)', defaultSelected: true },
        ],
      },
      {
        id: 'net_payout',
        title: 'Net Payout',
        fields: [
          { id: 'netPayable', label: 'Net Payable Salary', defaultSelected: true },
        ],
      },
    ],
  },

  // Column 4: Deductions & Statutory Summaries (12 fields)
  {
    columnId: 'col_4',
    sections: [
      {
        id: 'deductions',
        title: 'Deductions',
        fields: [
          { id: 'dedPf', label: 'PF (EPF EE 12%)', defaultSelected: true },
          { id: 'dedEsi', label: 'ESI (ESIC EE 0.75%)', defaultSelected: true },
          { id: 'dedLwf', label: 'LWF (Labour Welfare)', defaultSelected: true },
          { id: 'dedAdvance', label: 'Salary Advance Recovery', defaultSelected: true },
          { id: 'dedUni', label: 'Uniform Deduction (UNI)', defaultSelected: true },
          { id: 'dedNightSlp', label: 'Night Shift Slip Deduction', defaultSelected: true },
          { id: 'dedLoan', label: 'Loan / EMI Recovery', defaultSelected: true },
          { id: 'dedOtherDed', label: 'Other Deductions', defaultSelected: true },
          { id: 'grossDeduct', label: 'Total Deductions', defaultSelected: true },
        ],
      },
      {
        id: 'summarization',
        title: 'Statutory Summaries (Bottom)',
        fields: [
          { id: 'showPfSummary', label: 'PF Summary Statement Box', defaultSelected: true },
          { id: 'showEsiSummary', label: 'ESI Summary Statement Box', defaultSelected: true },
          { id: 'showLwfSummary', label: 'LWF Summary Statement Box', defaultSelected: true },
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

  SALARY_SHEET_FORMAT_2_LAYOUT.forEach((col) => {
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

  SALARY_SHEET_FORMAT_2_LAYOUT.forEach((col) => {
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
  SALARY_SHEET_FORMAT_2_LAYOUT.forEach((col) => {
    col.sections.forEach((sec) => {
      count += sec.fields.length;
    });
  });
  return count;
}

