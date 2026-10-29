/**
 * Employee Master Report — Report Options Configuration
 * 
 * Strictly maps verified HRMS frontend data structures and MongoDB report models
 * into an organized, evenly balanced 4-column layout matching the user's requested visual presentation.
 * Each column has exactly 9 fields (total 36 fields) for zero dead empty space.
 */

export const EMPLOYEE_MASTER_LAYOUT = [
  // Column 1: Basic Information & Profile (9 fields)
  {
    columnId: 'col_1',
    sections: [
      {
        id: 'basic_details',
        title: 'Basic Details',
        fields: [
          { id: 'employeeCode', label: 'Employee Code / ID', defaultSelected: true },
          { id: 'name', label: 'Employee Name', defaultSelected: true },
          { id: 'gender', label: 'Gender', defaultSelected: true },
          { id: 'dob', label: 'Date of Birth (DOB)', defaultSelected: true },
          { id: 'joiningDate', label: 'Date of Joining (DOJ)', defaultSelected: true },
          { id: 'maritalStatus', label: 'Marital Status', defaultSelected: true },
        ],
      },
      {
        id: 'personal_profile',
        title: 'Personal Details',
        fields: [
          { id: 'bloodGroup', label: 'Blood Group', defaultSelected: true },
          { id: 'qualification', label: 'Education / Qualification', defaultSelected: false },
          { id: 'language', label: 'Languages Known', defaultSelected: false },
        ],
      },
    ],
  },

  // Column 2: Work & Family Profile (9 fields)
  {
    columnId: 'col_2',
    sections: [
      {
        id: 'work_profile',
        title: 'Work Profile',
        fields: [
          { id: 'companyName', label: 'Company / Client Name', defaultSelected: true },
          { id: 'department', label: 'Department', defaultSelected: true },
          { id: 'designation', label: 'Designation', defaultSelected: true },
          { id: 'siteLocation', label: 'Site / Deployment Location', defaultSelected: true },
          { id: 'status', label: 'Employment Status', defaultSelected: true },
          { id: 'grossSalary', label: 'Gross Monthly Salary', defaultSelected: true },
        ],
      },
      {
        id: 'family_nominee',
        title: 'Family & Nominee',
        fields: [
          { id: 'fatherHusbandName', label: 'Father / Husband Name', defaultSelected: true },
          { id: 'fatherHusbandRelation', label: 'Father / Husband Relation', defaultSelected: false },
          { id: 'nomineeDetails', label: 'Nominee Name & Share %', defaultSelected: false },
        ],
      },
    ],
  },

  // Column 3: Statutory & Banking (9 fields)
  {
    columnId: 'col_3',
    sections: [
      {
        id: 'statutory_numbers',
        title: 'Statutory Numbers',
        fields: [
          { id: 'uan', label: 'PF UAN Number', defaultSelected: true },
          { id: 'pfNo', label: 'PF Member ID / Number', defaultSelected: true },
          { id: 'esicNo', label: 'ESI IP Number', defaultSelected: true },
          { id: 'pan', label: 'Income Tax PAN', defaultSelected: true },
          { id: 'aadhaar', label: 'Aadhaar Card Number', defaultSelected: true },
        ],
      },
      {
        id: 'bank_disbursement',
        title: 'Bank & Disbursement',
        fields: [
          { id: 'bankName', label: 'Bank Name', defaultSelected: true },
          { id: 'accountNumber', label: 'Bank Account Number', defaultSelected: true },
          { id: 'ifsc', label: 'Bank IFSC Code', defaultSelected: true },
          { id: 'paymentMode', label: 'Payment Mode (Bank / Cash)', defaultSelected: false },
        ],
      },
    ],
  },

  // Column 4: Contact, Address & Display (9 fields)
  {
    columnId: 'col_4',
    sections: [
      {
        id: 'contact_info',
        title: 'Contact Information',
        fields: [
          { id: 'contact', label: 'Mobile Phone Number', defaultSelected: true },
          { id: 'alternateMobile', label: 'Emergency / Alternate Contact', defaultSelected: false },
          { id: 'email', label: 'Official / Personal Email', defaultSelected: false },
        ],
      },
      {
        id: 'residential_address',
        title: 'Residential Address',
        fields: [
          { id: 'presentAddress', label: 'Present / Local Address', defaultSelected: false },
          { id: 'permanentAddress', label: 'Permanent Address', defaultSelected: false },
          { id: 'cityState', label: 'City / State / Pin Code', defaultSelected: false },
        ],
      },
      {
        id: 'display_options',
        title: 'Table Display Options',
        fields: [
          { id: 'showSrNo', label: 'Serial Number (Sr. No.)', defaultSelected: true },
          { id: 'showStatusBadge', label: 'Status Badge Pill', defaultSelected: true },
          { id: 'showAvatar', label: 'Employee Photo / Avatar', defaultSelected: true },
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
    excludeInactive: true,
    amountRounding: '0 decimals',
    unitRounding: '0 decimals',
    recordsPerPage: 10,
  };

  EMPLOYEE_MASTER_LAYOUT.forEach((col) => {
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
    excludeInactive: existingOptions.excludeInactive !== false,
    amountRounding: existingOptions.amountRounding || '0 decimals',
    unitRounding: existingOptions.unitRounding || '0 decimals',
    recordsPerPage: existingOptions.recordsPerPage || 10,
  };

  EMPLOYEE_MASTER_LAYOUT.forEach((col) => {
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
  EMPLOYEE_MASTER_LAYOUT.forEach((col) => {
    col.sections.forEach((sec) => {
      count += sec.fields.length;
    });
  });
  return count;
}

