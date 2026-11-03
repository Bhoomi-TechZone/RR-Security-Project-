import React, { useState, useRef, useMemo } from 'react';
import {
  X,
  UploadCloud,
  FileSpreadsheet,
  Download,
  CheckCircle,
  AlertTriangle,
  FileText,
  Users,
  AlertCircle,
  Layers
} from 'lucide-react';
import * as XLSX from 'xlsx';
import employeeService from '../../services/employeeService';
import styles from './EmployeeImportModal.module.css';

/**
 * Available Import Sections corresponding to the Add Employee form:
 * 01. Basic Details
 * 02. Employee Details (Employment)
 * 03. Statutory Details (Salary & Statutory)
 * 04. Bank Details
 * 05. Address & Family
 * 06. All Sections (Complete Master)
 *
 * NOTE: EMPID and EMPLOYEE NAME are common in ALL sections so each employee
 * can be identified and updated or created seamlessly.
 */
export const IMPORT_SECTIONS = [
  {
    id: 'basic',
    name: 'Basic Details',
    label: '01. Basic Details',
    description: 'Personal details, identity, contact numbers and credentials',
    columns: [
      { key: 'empid', header: 'EMPID', common: true, width: 14 },
      { key: 'name', header: 'EMPLOYEE NAME', common: true, width: 22 },
      { key: 'fatherHusbandName', header: 'FATHER/HUSBAND NAME', width: 22 },
      { key: 'gender', header: 'GENDER', width: 12 },
      { key: 'dob', header: 'DOB', width: 14 },
      { key: 'mobile', header: 'MOBILE', width: 16 },
      { key: 'email', header: 'EMAIL', width: 26 },
      { key: 'maritalStatus', header: 'MARITAL STATUS', width: 16 },
      { key: 'bloodGroup', header: 'BLOOD GROUP', width: 14 },
      { key: 'aadhaar', header: 'AADHAAR NO', width: 18 },
      { key: 'pan', header: 'PAN NO', width: 16 }
    ]
  },
  {
    id: 'employment',
    name: 'Employee Details',
    label: '02. Employee Details (Employment)',
    description: 'Client company allocation, site location, department, designation and shift roster',
    columns: [
      { key: 'empid', header: 'EMPID', common: true, width: 14 },
      { key: 'name', header: 'EMPLOYEE NAME', common: true, width: 22 },
      { key: 'clientName', header: 'CLIENT NAME', width: 28 },
      { key: 'siteLocation', header: 'SITE / LOCATION', width: 24 },
      { key: 'department', header: 'DEPARTMENT', width: 18 },
      { key: 'designation', header: 'DESIGNATION', width: 20 },
      { key: 'employeeType', header: 'EMPLOYEE TYPE', width: 16 },
      { key: 'joiningDate', header: 'JOINING DATE', width: 14 },
      { key: 'dutyPost', header: 'DUTY POST', width: 18 },
      { key: 'shift', header: 'SHIFT', width: 18 }
    ]
  },
  {
    id: 'statutory',
    name: 'Statutory Details',
    label: '03. Statutory Details (Salary & Statutory)',
    description: 'Wage structure, Basic, HRA, Gross Salary, PF, ESIC, PT and LWF compliance',
    columns: [
      { key: 'empid', header: 'EMPID', common: true, width: 14 },
      { key: 'name', header: 'EMPLOYEE NAME', common: true, width: 22 },
      { key: 'salaryType', header: 'SALARY TYPE', width: 16 },
      { key: 'basic', header: 'BASIC SALARY', width: 16 },
      { key: 'vda', header: 'DA', width: 14 },
      { key: 'hra', header: 'HRA', width: 14 },
      { key: 'conveyance', header: 'CONVEYANCE', width: 14 },
      { key: 'specialAllowance', header: 'SPECIAL ALLOWANCE', width: 20 },
      { key: 'otherAllowance', header: 'OTHER ALLOWANCE', width: 18 },
      { key: 'grossSalary', header: 'GROSS SALARY', width: 16 },
      { key: 'uan', header: 'UAN', width: 18 },
      { key: 'pfNo', header: 'PF NUMBER', width: 18 },
      { key: 'esicNo', header: 'ESIC NUMBER', width: 18 },
      { key: 'pfApplicable', header: 'PF APPLICABLE', width: 16 },
      { key: 'esiApplicable', header: 'ESIC APPLICABLE', width: 16 },
      { key: 'ptApplicable', header: 'PT APPLICABLE', width: 16 },
      { key: 'lwfApplicable', header: 'LWF APPLICABLE', width: 16 }
    ]
  },
  {
    id: 'bank',
    name: 'Bank Details',
    label: '04. Bank Details',
    description: 'Salary disbursement bank account, IFSC code, branch and payment mode',
    columns: [
      { key: 'empid', header: 'EMPID', common: true, width: 14 },
      { key: 'name', header: 'EMPLOYEE NAME', common: true, width: 22 },
      { key: 'bankName', header: 'BANK NAME', width: 24 },
      { key: 'accountNumber', header: 'ACCOUNT NUMBER', width: 20 },
      { key: 'ifsc', header: 'IFSC CODE', width: 16 },
      { key: 'branchName', header: 'BRANCH NAME', width: 20 },
      { key: 'accountHolder', header: 'ACCOUNT HOLDER NAME', width: 22 },
      { key: 'paymentMode', header: 'PAYMENT MODE', width: 18 }
    ]
  },
  {
    id: 'address',
    name: 'Address & Family',
    label: '05. Address & Family',
    description: 'Residential address, family members, emergency contact and nominee details',
    columns: [
      { key: 'empid', header: 'EMPID', common: true, width: 14 },
      { key: 'name', header: 'EMPLOYEE NAME', common: true, width: 22 },
      { key: 'presentAddress', header: 'PRESENT ADDRESS', width: 28 },
      { key: 'permanentAddress', header: 'PERMANENT ADDRESS', width: 28 },
      { key: 'city', header: 'CITY', width: 16 },
      { key: 'state', header: 'STATE', width: 18 },
      { key: 'pincode', header: 'PINCODE', width: 14 },
      { key: 'familyMemberName', header: 'FAMILY MEMBER NAME', width: 22 },
      { key: 'relation', header: 'RELATION', width: 14 },
      { key: 'emergencyMobile', header: 'EMERGENCY CONTACT', width: 20 },
      { key: 'nomineeName', header: 'NOMINEE NAME', width: 22 },
      { key: 'nomineeRelation', header: 'NOMINEE RELATION', width: 18 }
    ]
  },
  {
    id: 'all',
    name: 'All Sections (Complete Master)',
    label: '★ All Sections (Complete Master)',
    description: 'Complete employee profile across all sections in a consolidated master spreadsheet',
    columns: [
      { key: 'empid', header: 'EMPID', common: true, width: 14 },
      { key: 'name', header: 'EMPLOYEE NAME', common: true, width: 22 },
      { key: 'fatherHusbandName', header: 'FATHER/HUSBAND NAME', width: 22 },
      { key: 'gender', header: 'GENDER', width: 12 },
      { key: 'dob', header: 'DOB', width: 14 },
      { key: 'mobile', header: 'MOBILE', width: 16 },
      { key: 'email', header: 'EMAIL', width: 24 },
      { key: 'clientName', header: 'CLIENT NAME', width: 26 },
      { key: 'siteLocation', header: 'SITE / LOCATION', width: 22 },
      { key: 'department', header: 'DEPARTMENT', width: 16 },
      { key: 'designation', header: 'DESIGNATION', width: 18 },
      { key: 'employeeType', header: 'EMPLOYEE TYPE', width: 16 },
      { key: 'joiningDate', header: 'JOINING DATE', width: 14 },
      { key: 'salaryType', header: 'SALARY TYPE', width: 16 },
      { key: 'basic', header: 'BASIC SALARY', width: 16 },
      { key: 'hra', header: 'HRA', width: 14 },
      { key: 'grossSalary', header: 'GROSS SALARY', width: 16 },
      { key: 'uan', header: 'UAN', width: 18 },
      { key: 'pfNo', header: 'PF NUMBER', width: 18 },
      { key: 'esicNo', header: 'ESIC NUMBER', width: 18 },
      { key: 'bankName', header: 'BANK NAME', width: 22 },
      { key: 'accountNumber', header: 'ACCOUNT NUMBER', width: 20 },
      { key: 'ifsc', header: 'IFSC CODE', width: 16 },
      { key: 'branchName', header: 'BRANCH NAME', width: 18 },
      { key: 'paymentMode', header: 'PAYMENT MODE', width: 16 },
      { key: 'presentAddress', header: 'PRESENT ADDRESS', width: 24 },
      { key: 'permanentAddress', header: 'PERMANENT ADDRESS', width: 24 },
      { key: 'aadhaar', header: 'AADHAAR NO', width: 18 },
      { key: 'pan', header: 'PAN NO', width: 16 }
    ]
  }
];

function EmployeeImportModal({
  isOpen,
  onClose,
  onImportSuccess,
  activeCompanyId,
  activeCompanyName = '',
  employeeCodeSeries = null,
  clients = [],
  departments = [],
  designations = []
}) {
  if (!isOpen) return null;

  const [selectedSection, setSelectedSection] = useState('basic');
  const [file, setFile] = useState(null);
  const [parsedRows, setParsedRows] = useState([]);
  const [detectedColumns, setDetectedColumns] = useState([]);
  const [parseError, setParseError] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fileInputRef = useRef(null);

  const currentSection = useMemo(() => {
    return IMPORT_SECTIONS.find((s) => s.id === selectedSection) || IMPORT_SECTIONS[0];
  }, [selectedSection]);

  // Normalize date string / Excel numeric serial
  const normalizeDate = (val) => {
    if (!val && val !== 0) return '';
    if (val instanceof Date) {
      if (!isNaN(val.getTime())) {
        return val.toISOString().split('T')[0];
      }
    }
    if (typeof val === 'number') {
      try {
        const dateObj = new Date(Math.round((val - 25569) * 86400 * 1000));
        if (!isNaN(dateObj.getTime())) {
          return dateObj.toISOString().split('T')[0];
        }
      } catch {
        // fallback
      }
    }
    const str = String(val).trim();
    if (!str) return '';
    if (/^\d{4}[-/]\d{1,2}[-/]\d{1,2}$/.test(str)) {
      const [y, m, d] = str.split(/[-/]/);
      return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    }
    if (/^\d{1,2}[-/]\d{1,2}[-/]\d{4}$/.test(str)) {
      const [d, m, y] = str.split(/[-/]/);
      return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    }
    return str;
  };

  const normalizeMobile = (val) => {
    if (!val && val !== 0) return '';
    return String(val).replace(/[^0-9]/g, '');
  };

  const normalizeGender = (val) => {
    if (!val) return 'Male';
    const clean = String(val).trim().toLowerCase();
    if (clean.startsWith('f')) return 'Female';
    if (clean.startsWith('m')) return 'Male';
    if (clean.startsWith('o')) return 'Other';
    return 'Male';
  };

  const formatEmpIdWithSeries = (rawId) => {
    if (!rawId || String(rawId).trim().toLowerCase() === 'auto-generate') {
      return '';
    }
    const series = employeeCodeSeries || {};
    const prefix = (series.prefix || 'RR').trim().toUpperCase();
    const separator = series.separator !== undefined ? series.separator : '-';
    const padding = Number(series.padding) || 3;
    const yearFormat = series.yearFormat;
    const monthFormat = series.monthFormat;

    const str = String(rawId).trim();

    if (/^\d+$/.test(str)) {
      const numPadded = str.padStart(padding, '0');
      const parts = [prefix];
      if (yearFormat === 'YYYY') parts.push(String(new Date().getFullYear()));
      else if (yearFormat === 'YY') parts.push(String(new Date().getFullYear()).slice(-2));
      if (monthFormat === 'MM') parts.push(String(new Date().getMonth() + 1).padStart(2, '0'));
      parts.push(numPadded);
      return parts.join(separator);
    }

    const match = str.match(/^([A-Za-z]+)?[-_/\s]*(\d+)$/);
    if (match) {
      const matchedPrefix = match[1] ? match[1].toUpperCase() : prefix;
      const matchedDigits = match[2];
      const numPadded = matchedDigits.padStart(padding, '0');
      const finalPrefix =
        matchedPrefix === prefix || matchedPrefix === 'EMP' || matchedPrefix === 'RR'
          ? prefix
          : matchedPrefix;

      const parts = [finalPrefix];
      if (yearFormat === 'YYYY') parts.push(String(new Date().getFullYear()));
      else if (yearFormat === 'YY') parts.push(String(new Date().getFullYear()).slice(-2));
      if (monthFormat === 'MM') parts.push(String(new Date().getMonth() + 1).padStart(2, '0'));
      parts.push(numPadded);
      return parts.join(separator);
    }

    return str;
  };

  // Download Sample Excel (.xlsx) for selected section
  const handleDownloadExcelSample = () => {
    const headers = [currentSection.columns.map((c) => c.header)];
    const worksheet = XLSX.utils.aoa_to_sheet(headers);
    worksheet['!cols'] = currentSection.columns.map((c) => ({ wch: c.width || 18 }));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, currentSection.name.slice(0, 31));
    const safeName = currentSection.name.replace(/[^a-zA-Z0-9]/g, '_');
    XLSX.writeFile(workbook, `Employee_Import_${safeName}.xlsx`);
  };

  // Download Sample CSV (.csv) for selected section
  const handleDownloadCsvSample = () => {
    const csvContent = currentSection.columns.map((c) => c.header).join(',') + '\n';
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    const safeName = currentSection.name.replace(/[^a-zA-Z0-9]/g, '_');
    link.setAttribute('download', `Employee_Import_${safeName}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Process rows extracted from XLSX / CSV dynamically
  const processFileData = (rawRows) => {
    setParseError('');
    if (!rawRows || rawRows.length === 0) {
      setParseError('The uploaded file contains no data rows.');
      setParsedRows([]);
      setDetectedColumns([]);
      return;
    }

    const headers = Object.keys(rawRows[0] || {});
    const normalizeHeader = (h) => String(h || '').toLowerCase().replace(/[^a-z0-9]/g, '');

    const findKey = (possibleNames) => {
      const normalizedPossibles = possibleNames.map((p) => normalizeHeader(p));
      const exactMatch = headers.find((h) => normalizedPossibles.includes(normalizeHeader(h)));
      if (exactMatch) return exactMatch;

      return headers.find((h) => {
        const norm = normalizeHeader(h);
        return normalizedPossibles.some(
          (p) => p.length >= 3 && (norm.startsWith(p) || norm.endsWith(p) || norm.includes(p))
        );
      });
    };

    // Common Keys across all sections
    const empIdKey = findKey(['empid', 'emp_id', 'employeeid', 'employee_id', 'empcode', 'employeecode', 'code', 'emp_code']);
    const empNameKey = findKey(['employeename', 'employee_name', 'empname', 'emp_name', 'name', 'fullname']);

    // Basic Details Keys
    const fatherNameKey = findKey(['fatherhusbandname', 'father_husband_name', 'fathername', 'father_name', 'husbandname']);
    const genderKey = findKey(['gender', 'sex']);
    const dobKey = findKey(['dob', 'dateofbirth', 'date_of_birth', 'birthdate']);
    const mobileKey = findKey(['mobile', 'contact', 'phonenumber', 'phone_number', 'phone', 'cell']);
    const emailKey = findKey(['email', 'emailaddress', 'email_id', 'mail']);
    const maritalStatusKey = findKey(['maritalstatus', 'marital_status', 'marriage']);
    const bloodGroupKey = findKey(['bloodgroup', 'blood_group', 'blood']);
    const aadhaarKey = findKey(['aadhaar', 'aadhaarno', 'aadhaar_no', 'aadhaarnumber', 'aadhar']);
    const panKey = findKey(['pan', 'panno', 'pan_no', 'pannumber']);

    // Employment Details Keys
    const clientNameKey = findKey(['clientname', 'client_name', 'client', 'companyname', 'company_name']);
    const siteLocationKey = findKey(['sitelocation', 'site_location', 'site', 'location', 'worklocation']);
    const departmentKey = findKey(['department', 'dept']);
    const designationKey = findKey(['designation', 'role', 'post']);
    const employeeTypeKey = findKey(['employeetype', 'employee_type', 'type', 'employmenttype']);
    const joiningDateKey = findKey(['joiningdate', 'joining_date', 'doj', 'dateofjoining']);
    const dutyPostKey = findKey(['dutypost', 'duty_post']);
    const shiftKey = findKey(['shift', 'shiftroster']);

    // Statutory & Salary Keys
    const salaryTypeKey = findKey(['salarytype', 'salary_type']);
    const basicKey = findKey(['basicsalary', 'basic_salary', 'basic', 'basicwage', 'basic_wage']);
    const vdaKey = findKey(['da', 'vda', 'dearnessallowance', 'da_vda']);
    const hraKey = findKey(['hra', 'houserentallowance', 'house_rent']);
    const conveyanceKey = findKey(['conveyance', 'conv', 'conveyanceallowance']);
    const specialAllowanceKey = findKey(['specialallowance', 'special_allowance', 'spall', 'sp_all']);
    const otherAllowanceKey = findKey(['otherallowance', 'other_allowance', 'othall', 'oth_all']);
    const grossSalaryKey = findKey(['grosssalary', 'gross_salary', 'gross']);
    const uanKey = findKey(['uan', 'pfuan', 'pf_uan', 'uannumber']);
    const pfNoKey = findKey(['pfnumber', 'pf_number', 'pfno', 'pf_no', 'memberid']);
    const esicNoKey = findKey(['esicnumber', 'esic_number', 'esicno', 'esic_no', 'esino', 'esi_no']);
    const pfApplicableKey = findKey(['pfapplicable', 'pf_applicable', 'epfapplicable']);
    const esiApplicableKey = findKey(['esicapplicable', 'esi_applicable', 'esic_applicable']);
    const ptApplicableKey = findKey(['ptapplicable', 'pt_applicable']);
    const lwfApplicableKey = findKey(['lwfapplicable', 'lwf_applicable']);

    // Bank Details Keys
    const bankNameKey = findKey(['bankname', 'bank_name', 'bank']);
    const accountNumberKey = findKey(['accountnumber', 'account_number', 'accountno', 'account_no', 'bankaccount']);
    const ifscKey = findKey(['ifsccode', 'ifsc_code', 'ifsc']);
    const branchNameKey = findKey(['branchname', 'branch_name', 'branch', 'bankbranch']);
    const accountHolderKey = findKey(['accountholder', 'account_holder', 'accountholdername']);
    const paymentModeKey = findKey(['paymentmode', 'payment_mode', 'mode']);

    // Address & Family Keys
    const presentAddressKey = findKey(['presentaddress', 'present_address', 'address']);
    const permanentAddressKey = findKey(['permanentaddress', 'permanent_address']);
    const cityKey = findKey(['city']);
    const stateKey = findKey(['state']);
    const pincodeKey = findKey(['pincode', 'pin_code', 'zip', 'zipcode']);
    const familyMemberNameKey = findKey(['familymembername', 'family_member_name', 'familymember', 'spouse']);
    const relationKey = findKey(['relation', 'relationship']);
    const emergencyMobileKey = findKey(['emergencycontact', 'emergency_contact', 'emergencymobile', 'emergency_phone']);
    const nomineeNameKey = findKey(['nomineename', 'nominee_name', 'nominee']);
    const nomineeRelationKey = findKey(['nomineerelation', 'nominee_relation']);

    const formattedRows = [];

    rawRows.forEach((row, i) => {
      const rawEmpId = empIdKey && row[empIdKey] !== undefined ? String(row[empIdKey]).trim() : '';
      const formattedEmpId = formatEmpIdWithSeries(rawEmpId);
      const rawName = empNameKey && row[empNameKey] !== undefined ? String(row[empNameKey]).trim() : '';

      // Skip empty blank row
      const hasAnyValue = Object.values(row).some((v) => String(v || '').trim() !== '');
      if (!hasAnyValue) return;

      const isValid = Boolean(rawName || formattedEmpId || rawEmpId);

      const parsedRow = {
        id: i + 1,
        empid: formattedEmpId || rawEmpId || 'Auto-generate',
        rawEmpId,
        name: rawName,
        isValid,
        error: !rawName && !rawEmpId ? 'Employee Name or EMPID missing' : ''
      };

      // Populate whatever section keys are present
      if (fatherNameKey && row[fatherNameKey]) parsedRow.fatherHusbandName = String(row[fatherNameKey]).trim();
      if (genderKey && row[genderKey]) parsedRow.gender = normalizeGender(row[genderKey]);
      if (dobKey && row[dobKey]) parsedRow.dob = normalizeDate(row[dobKey]);
      if (mobileKey && row[mobileKey]) parsedRow.mobile = normalizeMobile(row[mobileKey]);
      if (emailKey && row[emailKey]) parsedRow.email = String(row[emailKey]).trim().toLowerCase();
      if (maritalStatusKey && row[maritalStatusKey]) parsedRow.maritalStatus = String(row[maritalStatusKey]).trim();
      if (bloodGroupKey && row[bloodGroupKey]) parsedRow.bloodGroup = String(row[bloodGroupKey]).trim();
      if (aadhaarKey && row[aadhaarKey]) parsedRow.aadhaar = String(row[aadhaarKey]).trim();
      if (panKey && row[panKey]) parsedRow.pan = String(row[panKey]).trim().toUpperCase();

      if (clientNameKey && row[clientNameKey]) parsedRow.clientName = String(row[clientNameKey]).trim();
      if (siteLocationKey && row[siteLocationKey]) parsedRow.siteLocation = String(row[siteLocationKey]).trim();
      if (departmentKey && row[departmentKey]) parsedRow.department = String(row[departmentKey]).trim();
      if (designationKey && row[designationKey]) parsedRow.designation = String(row[designationKey]).trim();
      if (employeeTypeKey && row[employeeTypeKey]) parsedRow.employeeType = String(row[employeeTypeKey]).trim();
      if (joiningDateKey && row[joiningDateKey]) parsedRow.joiningDate = normalizeDate(row[joiningDateKey]);
      if (dutyPostKey && row[dutyPostKey]) parsedRow.dutyPost = String(row[dutyPostKey]).trim();
      if (shiftKey && row[shiftKey]) parsedRow.shift = String(row[shiftKey]).trim();

      if (salaryTypeKey && row[salaryTypeKey]) parsedRow.salaryType = String(row[salaryTypeKey]).trim();
      if (basicKey && row[basicKey] !== '') parsedRow.basic = Number(row[basicKey]);
      if (vdaKey && row[vdaKey] !== '') parsedRow.vda = Number(row[vdaKey]);
      if (hraKey && row[hraKey] !== '') parsedRow.hra = Number(row[hraKey]);
      if (conveyanceKey && row[conveyanceKey] !== '') parsedRow.conveyance = Number(row[conveyanceKey]);
      if (specialAllowanceKey && row[specialAllowanceKey] !== '') parsedRow.specialAllowance = Number(row[specialAllowanceKey]);
      if (otherAllowanceKey && row[otherAllowanceKey] !== '') parsedRow.otherAllowance = Number(row[otherAllowanceKey]);
      if (grossSalaryKey && row[grossSalaryKey] !== '') parsedRow.grossSalary = Number(row[grossSalaryKey]);
      if (uanKey && row[uanKey]) parsedRow.uan = String(row[uanKey]).trim();
      if (pfNoKey && row[pfNoKey]) parsedRow.pfNo = String(row[pfNoKey]).trim();
      if (esicNoKey && row[esicNoKey]) parsedRow.esicNo = String(row[esicNoKey]).trim();
      if (pfApplicableKey && row[pfApplicableKey] !== undefined) parsedRow.pfApplicable = row[pfApplicableKey];
      if (esiApplicableKey && row[esiApplicableKey] !== undefined) parsedRow.esiApplicable = row[esiApplicableKey];
      if (ptApplicableKey && row[ptApplicableKey] !== undefined) parsedRow.ptApplicable = row[ptApplicableKey];
      if (lwfApplicableKey && row[lwfApplicableKey] !== undefined) parsedRow.lwfApplicable = row[lwfApplicableKey];

      if (bankNameKey && row[bankNameKey]) parsedRow.bankName = String(row[bankNameKey]).trim();
      if (accountNumberKey && row[accountNumberKey]) parsedRow.accountNumber = String(row[accountNumberKey]).trim();
      if (ifscKey && row[ifscKey]) parsedRow.ifsc = String(row[ifscKey]).trim().toUpperCase();
      if (branchNameKey && row[branchNameKey]) parsedRow.branchName = String(row[branchNameKey]).trim();
      if (accountHolderKey && row[accountHolderKey]) parsedRow.accountHolder = String(row[accountHolderKey]).trim();
      if (paymentModeKey && row[paymentModeKey]) parsedRow.paymentMode = String(row[paymentModeKey]).trim();

      if (presentAddressKey && row[presentAddressKey]) parsedRow.presentAddress = String(row[presentAddressKey]).trim();
      if (permanentAddressKey && row[permanentAddressKey]) parsedRow.permanentAddress = String(row[permanentAddressKey]).trim();
      if (cityKey && row[cityKey]) parsedRow.city = String(row[cityKey]).trim();
      if (stateKey && row[stateKey]) parsedRow.state = String(row[stateKey]).trim();
      if (pincodeKey && row[pincodeKey]) parsedRow.pincode = String(row[pincodeKey]).trim();
      if (familyMemberNameKey && row[familyMemberNameKey]) parsedRow.familyMemberName = String(row[familyMemberNameKey]).trim();
      if (relationKey && row[relationKey]) parsedRow.relation = String(row[relationKey]).trim();
      if (emergencyMobileKey && row[emergencyMobileKey]) parsedRow.emergencyMobile = String(row[emergencyMobileKey]).trim();
      if (nomineeNameKey && row[nomineeNameKey]) parsedRow.nomineeName = String(row[nomineeNameKey]).trim();
      if (nomineeRelationKey && row[nomineeRelationKey]) parsedRow.nomineeRelation = String(row[nomineeRelationKey]).trim();

      formattedRows.push(parsedRow);
    });

    if (formattedRows.length === 0) {
      setParseError('No valid employee records could be identified from the uploaded file.');
    }

    // Determine extra preview columns from the parsed data
    const candidateCols = [
      { key: 'gender', label: 'GENDER' },
      { key: 'dob', label: 'DOB' },
      { key: 'mobile', label: 'MOBILE' },
      { key: 'email', label: 'EMAIL' },
      { key: 'clientName', label: 'CLIENT' },
      { key: 'department', label: 'DEPARTMENT' },
      { key: 'designation', label: 'DESIGNATION' },
      { key: 'basic', label: 'BASIC' },
      { key: 'grossSalary', label: 'GROSS' },
      { key: 'uan', label: 'UAN' },
      { key: 'pfNo', label: 'PF NO' },
      { key: 'esicNo', label: 'ESIC NO' },
      { key: 'bankName', label: 'BANK NAME' },
      { key: 'accountNumber', label: 'ACCOUNT NO' },
      { key: 'ifsc', label: 'IFSC CODE' },
      { key: 'paymentMode', label: 'PAY MODE' },
      { key: 'presentAddress', label: 'ADDRESS' },
      { key: 'aadhaar', label: 'AADHAAR' },
      { key: 'pan', label: 'PAN' }
    ];

    const activeExtraCols = candidateCols.filter((col) =>
      formattedRows.some((r) => r[col.key] !== undefined && r[col.key] !== '')
    );

    setDetectedColumns(activeExtraCols.slice(0, 5));
    setParsedRows(formattedRows);
  };

  const handleFile = (uploadedFile) => {
    if (!uploadedFile) return;

    const fileExt = uploadedFile.name.split('.').pop().toLowerCase();
    if (!['xlsx', 'xls', 'csv'].includes(fileExt)) {
      setParseError('Unsupported file type. Please upload an Excel (.xlsx, .xls) or CSV (.csv) file.');
      return;
    }

    setFile(uploadedFile);

    const reader = new FileReader();

    if (fileExt === 'csv') {
      reader.onload = (e) => {
        try {
          const text = e.target.result;
          const workbook = XLSX.read(text, { type: 'string' });
          const firstSheet = workbook.SheetNames[0];
          const rawData = XLSX.utils.sheet_to_json(workbook.Sheets[firstSheet], { defval: '' });
          processFileData(rawData);
        } catch (err) {
          console.error('Error parsing CSV:', err);
          setParseError('Failed to parse the CSV file. Please ensure valid comma-separated format.');
        }
      };
      reader.readAsText(uploadedFile);
    } else {
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array', cellDates: true });
          const firstSheet = workbook.SheetNames[0];
          const rawData = XLSX.utils.sheet_to_json(workbook.Sheets[firstSheet], { defval: '' });
          processFileData(rawData);
        } catch (err) {
          console.error('Error parsing Excel:', err);
          setParseError('Failed to parse the Excel workbook. Please check file structure.');
        }
      };
      reader.readAsArrayBuffer(uploadedFile);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleResetFile = () => {
    setFile(null);
    setParsedRows([]);
    setDetectedColumns([]);
    setParseError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Submit bulk import to backend
  const handleSubmit = async () => {
    const validRows = parsedRows.filter((r) => r.isValid);
    if (validRows.length === 0) {
      setParseError('There are no valid employee rows to import.');
      return;
    }

    setIsSubmitting(true);
    setParseError('');

    try {
      const recordsPayload = validRows.map((r) => ({
        employeeId: r.empid !== 'Auto-generate' ? r.empid : '',
        name: r.name,
        ...r
      }));

      const res = await employeeService.bulkImportEmployees(activeCompanyId, recordsPayload, {
        importSection: selectedSection
      });

      if (onImportSuccess) {
        onImportSuccess(res);
      }
      onClose();
    } catch (err) {
      console.error('Import error:', err);
      setParseError(err.message || 'Failed to complete employee import.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const validCount = parsedRows.filter((r) => r.isValid).length;
  const invalidCount = parsedRows.length - validCount;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <div className={styles.headerIcon}>
              <Users size={22} />
            </div>
            <div>
              <h2 className={styles.title}>Bulk Import Employees</h2>
              <p className={styles.sub}>
                Import employee master records by section for {activeCompanyName || 'Company Profile'}.
              </p>
            </div>
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close modal">
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className={styles.body}>
          {/* Section Selector & Sample Download Card */}
          <div className={styles.sectionSelectorCard}>
            <div className={styles.sectionSelectWrapper}>
              <label className={styles.sectionSelectLabel}>
                <Layers size={16} />
                <span>Select Employee Section to Import / Download:</span>
              </label>
              <select
                className={styles.sectionSelect}
                value={selectedSection}
                onChange={(e) => setSelectedSection(e.target.value)}
              >
                {IMPORT_SECTIONS.map((sec) => (
                  <option key={sec.id} value={sec.id}>
                    {sec.label}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.templateActions}>
              <button
                type="button"
                className={styles.downloadBtn}
                onClick={handleDownloadExcelSample}
                title={`Download ${currentSection.name} Excel template (.xlsx)`}
              >
                <Download size={14} />
                <span>Excel (.xlsx)</span>
              </button>
              <button
                type="button"
                className={styles.downloadBtn}
                onClick={handleDownloadCsvSample}
                title={`Download ${currentSection.name} CSV template (.csv)`}
              >
                <Download size={14} />
                <span>CSV (.csv)</span>
              </button>
            </div>
          </div>

          {/* Dropzone or Loaded File Status */}
          {!file ? (
            <div
              className={`${styles.dropzone} ${isDragging ? styles.dropzoneActive : ''}`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls, .csv"
                style={{ display: 'none' }}
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFile(e.target.files[0]);
                  }
                }}
              />
              <div className={styles.dropzoneIcon}>
                <UploadCloud size={26} />
              </div>
              <p className={styles.dropzonePrompt}>
                Drag & drop Excel or CSV file here, or <span>browse file</span>
              </p>
              <p className={styles.dropzoneSub}>Supports .xlsx, .xls, and .csv files</p>
            </div>
          ) : (
            <div className={styles.fileLoadedCard}>
              <div className={styles.fileLoadedInfo}>
                <FileText size={22} className={styles.fileLoadedIcon} />
                <div>
                  <h5 className={styles.fileName}>{file.name}</h5>
                  <p className={styles.fileMeta}>
                    {(file.size / 1024).toFixed(1)} KB &bull; {parsedRows.length} rows loaded
                  </p>
                </div>
              </div>
              <button
                type="button"
                className={styles.removeFileBtn}
                onClick={handleResetFile}
                disabled={isSubmitting}
              >
                Change File
              </button>
            </div>
          )}

          {/* Error Message */}
          {parseError && (
            <div className={styles.alertError}>
              <AlertCircle size={18} style={{ flexShrink: 0 }} />
              <span>{parseError}</span>
            </div>
          )}

          {/* Preview Table */}
          {parsedRows.length > 0 && (
            <div className={styles.previewSection}>
              <div className={styles.previewHeader}>
                <div className={styles.previewTitle}>
                  <span>Data Preview</span>
                  <span className={styles.badgeSuccess}>
                    {validCount} ready to import
                  </span>
                  {invalidCount > 0 && (
                    <span className={styles.badgeWarning}>
                      {invalidCount} missing required name or ID
                    </span>
                  )}
                </div>
              </div>

              <div className={styles.tableContainer}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>EMPID</th>
                      <th>EMPLOYEE NAME</th>
                      {detectedColumns.map((c) => (
                        <th key={c.key}>{c.label}</th>
                      ))}
                      <th>STATUS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedRows.map((row) => (
                      <tr key={row.id}>
                        <td>{row.id}</td>
                        <td style={{ fontWeight: 600 }}>{row.empid}</td>
                        <td style={{ fontWeight: 600 }}>
                          {row.name || <span style={{ color: '#dc2626' }}>[Missing]</span>}
                        </td>
                        {detectedColumns.map((c) => (
                          <td key={c.key}>{row[c.key] !== undefined && row[c.key] !== '' ? String(row[c.key]) : '-'}</td>
                        ))}
                        <td>
                          {row.isValid ? (
                            <span className={styles.statusReady}>
                              <CheckCircle size={13} />
                              Ready
                            </span>
                          ) : (
                            <span className={styles.statusMissing}>
                              <AlertTriangle size={13} />
                              {row.error}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className={styles.footer}>
          <button
            type="button"
            className={styles.cancelBtn}
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="button"
            className={styles.submitBtn}
            onClick={handleSubmit}
            disabled={isSubmitting || validCount === 0}
          >
            {isSubmitting ? (
              <>
                <div className={styles.spinner} />
                <span>Importing...</span>
              </>
            ) : (
              <>
                <UploadCloud size={16} />
                <span>Import {validCount > 0 ? `${validCount} Employees` : 'Employees'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default EmployeeImportModal;
