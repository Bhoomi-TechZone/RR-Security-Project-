/**
 * Salary Sheet (Format 1) — Report Options Configuration
 * 
 * Strictly maps verified HRMS frontend data structures and MongoDB report models
 * into an organized, evenly balanced 4-column layout matching the user's requested visual presentation.
 */

export const SALARY_SHEET_FORMAT_1_LAYOUT = [
  // Column 1: Master Identity, Statutory Identifiers & Work Profile (15 fields)
  {
    columnId: 'col_1',
    sections: [
      {
        id: 'basic_details',
        title: 'Basic Details',
        fields: [
          { id: 'employeeId', label: 'Employee Code', defaultSelected: true },
          { id: 'name', label: 'Employee Name', defaultSelected: true },
          { id: 'gender', label: 'Gender', defaultSelected: false },
          { id: 'fatherHusbandName', label: 'Father / Husband Name', defaultSelected: true },
          { id: 'joiningDate', label: 'Date of Joining', defaultSelected: false },
          { id: 'dutyPost', label: 'Duty Post', defaultSelected: false },
          { id: 'srNo', label: 'Sr. No.', defaultSelected: true },
        ],
      },
      {
        id: 'statutory_identifiers',
        title: 'Statutory Numbers',
        fields: [
          { id: 'esiNo', label: 'ESI IP Number', defaultSelected: true },
          { id: 'uan', label: 'PF UAN Number', defaultSelected: true },
          { id: 'pfNo', label: 'PF Member Number', defaultSelected: true },
          { id: 'pan', label: 'Income Tax PAN', defaultSelected: false },
          { id: 'aadhaar', label: 'Aadhaar Number', defaultSelected: false },
        ],
      },
      {
        id: 'work_profile',
        title: 'Work Profile',
        fields: [
          { id: 'site', label: 'Location / Deployment Site', defaultSelected: true },
          { id: 'department', label: 'Department', defaultSelected: true },
          { id: 'designation', label: 'Designation', defaultSelected: true },
        ],
      },
    ],
  },

  // Column 2: Attendance & Base Wage Rates (16 fields)
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
          { id: 'attMlAdj', label: 'Maternity / Adjustment (ML)', defaultSelected: true },
        ],
      },
      {
        id: 'rate_of_wages',
        title: 'Rate of Wages',
        fields: [
          { id: 'rateBasic', label: 'Basic Pay Rate', defaultSelected: true },
          { id: 'rateDa', label: 'DA Rate', defaultSelected: true },
          { id: 'rateHra', label: 'HRA Rate', defaultSelected: true },
          { id: 'rateConv', label: 'Conveyance Rate', defaultSelected: true },
          { id: 'rateSpAll', label: 'Special Allowance Rate', defaultSelected: true },
          { id: 'rateOthAll', label: 'Other Allowance Rate', defaultSelected: true },
          { id: 'rateTotal', label: 'Total Base Wage Rate', defaultSelected: true },
        ],
      },
    ],
  },

  // Column 3: Monthly Earnings & Bank Payout (16 fields)
  {
    columnId: 'col_3',
    sections: [
      {
        id: 'earnings',
        title: 'Earnings Components',
        fields: [
          { id: 'earnBasic', label: 'Basic Wages Earned', defaultSelected: true },
          { id: 'earnDa', label: 'DA Earned', defaultSelected: true },
          { id: 'earnHra', label: 'HRA Earned', defaultSelected: true },
          { id: 'earnConv', label: 'CONV Earned', defaultSelected: true },
          { id: 'earnSpAll', label: 'SP.All Earned', defaultSelected: true },
          { id: 'earnOthAll', label: 'OTH.All Earned', defaultSelected: true },
          { id: 'earnOtPib', label: 'Overtime / PIB', defaultSelected: true },
          { id: 'grossSalary', label: 'Gross Salary Earned', defaultSelected: true },
          { id: 'pfWage', label: 'PF Qualifying Base (P)', defaultSelected: true },
          { id: 'esiWage', label: 'ESI Qualifying Base (E)', defaultSelected: true },
        ],
      },
      {
        id: 'bank_details',
        title: 'Bank & Disbursement',
        fields: [
          { id: 'netPayable', label: 'Net Payable Salary', defaultSelected: true },
          { id: 'bankName', label: 'Bank Name', defaultSelected: true },
          { id: 'bankAccountNo', label: 'Bank Account Number', defaultSelected: true },
          { id: 'ifsc', label: 'Bank IFSC Code', defaultSelected: false },
          { id: 'paymentMode', label: 'Payment Mode', defaultSelected: false },
          { id: 'signature', label: 'Signature / Ack. Box', defaultSelected: true },
        ],
      },
    ],
  },

  // Column 4: Statutory Deductions & Report Summarization (18 fields)
  {
    columnId: 'col_4',
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
          { id: 'dedOthDed', label: 'Other Deductions', defaultSelected: true },
          { id: 'dedEMbill', label: 'E/Mbill (Utilities)', defaultSelected: true },
          { id: 'grossDeduct', label: 'Gross Deductions Total', defaultSelected: true },
        ],
      },
      {
        id: 'summarization',
        title: 'Summarization (Page 2)',
        fields: [
          { id: 'showPfSummary', label: 'PF Summary Statement', defaultSelected: true },
          { id: 'showEsiSummary', label: 'ESI Summary Statement', defaultSelected: true },
          { id: 'showPtSummary', label: 'P.T. Summary Statement', defaultSelected: true },
          { id: 'showWorkforceStrength', label: 'Workforce Strength Card', defaultSelected: true },
          { id: 'showEarningDeductionStatement', label: 'Consolidated Statement', defaultSelected: true },
          { id: 'showNetPayHighlight', label: 'Net Salary in Words Card', defaultSelected: true },
          { id: 'showSignatures', label: 'Signatory Verification Block', defaultSelected: true },
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

  SALARY_SHEET_FORMAT_1_LAYOUT.forEach((col) => {
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

  SALARY_SHEET_FORMAT_1_LAYOUT.forEach((col) => {
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
  SALARY_SHEET_FORMAT_1_LAYOUT.forEach((col) => {
    col.sections.forEach((sec) => {
      count += sec.fields.length;
    });
  });
  return count;
}
