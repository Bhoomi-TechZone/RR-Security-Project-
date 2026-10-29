/**
 * Wage & Salary Register (Payroll) — Report Options Configuration
 * 
 * Accurately maps the verified 5-column layout and field defaults
 * matching the user's provided specification screenshot.
 */

export const WAGE_SALARY_REGISTER_LAYOUT = [
  // Column 1: Basic Details & Statutory Numbers (12 fields)
  {
    columnId: 'col_1',
    sections: [
      {
        id: 'basic_details',
        title: 'Basic Details',
        fields: [
          { id: 'employeeCode', label: 'Employee Code', defaultSelected: true },
          { id: 'employeeName', label: 'Employee Name', defaultSelected: true },
          { id: 'gender', label: 'Gender', defaultSelected: false },
          { id: 'fatherHusbandName', label: 'Father / Husband Name', defaultSelected: true },
          { id: 'dateOfJoining', label: 'Date of Joining', defaultSelected: false },
          { id: 'dutyPost', label: 'Duty Post', defaultSelected: false },
          { id: 'srNo', label: 'Sr. No.', defaultSelected: true },
        ],
      },
      {
        id: 'statutory_numbers',
        title: 'Statutory Numbers',
        fields: [
          { id: 'esiIpNumber', label: 'ESI IP Number', defaultSelected: true },
          { id: 'pfUanNumber', label: 'PF UAN Number', defaultSelected: true },
          { id: 'pfMemberNumber', label: 'PF Member Number', defaultSelected: true },
          { id: 'incomeTaxPan', label: 'Income Tax PAN', defaultSelected: false },
          { id: 'aadhaarNumber', label: 'Aadhaar Number', defaultSelected: false },
        ],
      },
    ],
  },

  // Column 2: Attendance & Work Profile (12 fields)
  {
    columnId: 'col_2',
    sections: [
      {
        id: 'attendance',
        title: 'Attendance',
        fields: [
          { id: 'attTot', label: 'Total Payable Days (TOT)', defaultSelected: true },
          { id: 'attWd', label: 'Scheduled Working Days (WD)', defaultSelected: true },
          { id: 'attPd', label: 'Present Days (PD)', defaultSelected: true },
          { id: 'attWo', label: 'Week Offs (WO)', defaultSelected: true },
          { id: 'attPh', label: 'Holidays (PH)', defaultSelected: true },
          { id: 'attPl', label: 'Paid Leaves (PL)', defaultSelected: true },
          { id: 'attCl', label: 'Casual Leaves (CL)', defaultSelected: true },
          { id: 'attSl', label: 'Sick Leaves (SL)', defaultSelected: true },
          { id: 'attMl', label: 'Maternity / Adjustment (ML)', defaultSelected: true },
        ],
      },
      {
        id: 'work_profile',
        title: 'Work Profile',
        fields: [
          { id: 'workLocation', label: 'Location / Deployment Site', defaultSelected: true },
          { id: 'department', label: 'Department', defaultSelected: true },
          { id: 'designation', label: 'Designation', defaultSelected: true },
        ],
      },
    ],
  },

  // Column 3: Rate of Wages & Bank & Disbursement (13 fields)
  {
    columnId: 'col_3',
    sections: [
      {
        id: 'rate_of_wages',
        title: 'Rate of Wages',
        fields: [
          { id: 'rateBasic', label: 'Basic Pay Rate', defaultSelected: true },
          { id: 'rateDa', label: 'DA Rate', defaultSelected: true },
          { id: 'rateHra', label: 'HRA Rate', defaultSelected: true },
          { id: 'rateConv', label: 'Conveyance Rate', defaultSelected: true },
          { id: 'rateSpAll', label: 'Special Allowance Rate', defaultSelected: true },
          { id: 'rateOther', label: 'Other Allowance Rate', defaultSelected: true },
          { id: 'rateTotal', label: 'Total Base Wage Rate', defaultSelected: true },
        ],
      },
      {
        id: 'bank_disbursement',
        title: 'Bank & Disbursement',
        fields: [
          { id: 'netPayable', label: 'Net Payable Salary', defaultSelected: true },
          { id: 'bankName', label: 'Bank Name', defaultSelected: true },
          { id: 'bankAccountNo', label: 'Bank Account Number', defaultSelected: false },
          { id: 'bankIfscCode', label: 'Bank IFSC Code', defaultSelected: false },
          { id: 'paymentMode', label: 'Payment Mode', defaultSelected: false },
          { id: 'signatureAck', label: 'Signature / Ack. Box', defaultSelected: true },
        ],
      },
    ],
  },

  // Column 4: Earnings Components (10 fields)
  {
    columnId: 'col_4',
    sections: [
      {
        id: 'earnings_components',
        title: 'Earnings Components',
        fields: [
          { id: 'earnBasic', label: 'Basic Wages Earned', defaultSelected: true },
          { id: 'earnDa', label: 'DA Earned', defaultSelected: true },
          { id: 'earnHra', label: 'HRA Earned', defaultSelected: true },
          { id: 'earnConv', label: 'CONV Earned', defaultSelected: true },
          { id: 'earnSpAll', label: 'SP.All Earned', defaultSelected: true },
          { id: 'earnOther', label: 'OTH.All Earned', defaultSelected: true },
          { id: 'earnOt', label: 'Overtime / PIB', defaultSelected: true },
          { id: 'grossSalary', label: 'Gross Salary Earned', defaultSelected: true },
          { id: 'pfBase', label: 'PF Qualifying Base (P)', defaultSelected: true },
          { id: 'esiBase', label: 'ESI Qualifying Base (E)', defaultSelected: true },
        ],
      },
    ],
  },

  // Column 5: Deductions & Summarization (Page 2) (18 fields)
  {
    columnId: 'col_5',
    sections: [
      {
        id: 'deductions',
        title: 'Deductions',
        fields: [
          { id: 'dedPf', label: 'P.F. (EPF EE 12%)', defaultSelected: true },
          { id: 'dedEsi', label: 'ESI (ESIC EE 0.75%)', defaultSelected: true },
          { id: 'dedPt', label: 'P.T. (Professional Tax)', defaultSelected: true },
          { id: 'dedIt', label: 'I.T. / TDS (Income Tax)', defaultSelected: true },
          { id: 'dedLwf', label: 'LWF (Labour Welfare)', defaultSelected: true },
          { id: 'dedAdvance', label: 'Salary Advance Recovery', defaultSelected: true },
          { id: 'dedLoan', label: 'Loan / EMI Deduction', defaultSelected: true },
          { id: 'dedFood', label: 'Food / Canteen Deduction', defaultSelected: true },
          { id: 'dedOther', label: 'Other Deductions', defaultSelected: true },
          { id: 'dedMbill', label: 'E/Mbill (Utilities)', defaultSelected: true },
          { id: 'grossDeduct', label: 'Gross Deductions Total', defaultSelected: true },
        ],
      },
      {
        id: 'summarization_page2',
        title: 'Summarization (Page 2)',
        fields: [
          { id: 'summaryPf', label: 'PF Summary Statement', defaultSelected: true },
          { id: 'summaryEsi', label: 'ESI Summary Statement', defaultSelected: true },
          { id: 'summaryPt', label: 'P.T. Summary Statement', defaultSelected: true },
          { id: 'summaryWorkforce', label: 'Workforce Strength Card', defaultSelected: true },
          { id: 'summaryConsolidated', label: 'Consolidated Statement', defaultSelected: true },
          { id: 'summaryNetInWords', label: 'Net Salary In Words Card', defaultSelected: true },
          { id: 'summarySignatory', label: 'Signatory Verification Block', defaultSelected: true },
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
    excludeHoldSalary: false,
    amountRounding: '0 decimals',
    unitRounding: '0 decimals',
    recordsPerPage: 6,
  };

  WAGE_SALARY_REGISTER_LAYOUT.forEach((col) => {
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
    excludeHoldSalary: existingOptions.excludeHoldSalary !== undefined ? existingOptions.excludeHoldSalary : false,
    amountRounding: existingOptions.amountRounding || '0 decimals',
    unitRounding: existingOptions.unitRounding || '0 decimals',
    recordsPerPage: existingOptions.recordsPerPage || 6,
  };

  WAGE_SALARY_REGISTER_LAYOUT.forEach((col) => {
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
  WAGE_SALARY_REGISTER_LAYOUT.forEach((col) => {
    col.sections.forEach((sec) => {
      count += sec.fields.length;
    });
  });
  return count;
}
