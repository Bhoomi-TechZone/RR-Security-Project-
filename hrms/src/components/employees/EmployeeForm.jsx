import React, { useState, useEffect, useRef } from 'react';
import { X, Check, ChevronRight, ChevronLeft, Loader2 } from 'lucide-react';
import styles from './EmployeeForm.module.css';
import PersonalInfoStep from './PersonalInfoStep';
import EmploymentStep from './EmploymentStep';
import SalaryStructureStep from './SalaryStructureStep';
import BankDetailsStep from './BankDetailsStep';
import AddressStep from './AddressStep';
import FamilyStep from './FamilyStep';
import DocumentsStep from './DocumentsStep';
import EmployeeReview from './EmployeeReview';
import EmployeeSummaryStep from './EmployeeSummaryStep';
import LoginAccessStep from './LoginAccessStep';
import AdditionalInfoStep from './AdditionalInfoStep';
import ActivityLogsStep from './ActivityLogsStep';
import LetterInboxStep from './LetterInboxStep';
import AssetsStep from './AssetsStep';
import { useCompany } from '../../context/CompanyContext';
import { generateSeriesPreview } from '../../data/numberSeriesData';

const STEPS = [
  { id: 'summary', label: 'Summary', number: '01' },
  { id: 'basic', label: 'Basic Details', number: '02' },
  { id: 'employment', label: 'Employment Details', number: '03' },
  { id: 'salary', label: 'Salary & Statutory', number: '04' },
  { id: 'statutory', label: 'Bank Details', number: '05' },
  { id: 'address', label: 'Addresses', number: '06' },
  { id: 'family', label: 'Family Details', number: '07' },
  { id: 'documents', label: 'Documents', number: '08' },
  { id: 'assets', label: 'Assets', number: '09' },
  { id: 'letters', label: 'Letter Inbox', number: '10' },
  { id: 'login', label: 'Login Access', number: '11' },
  { id: 'additional', label: 'Additional Info', number: '12' },
  { id: 'activity', label: 'Activity Logs', number: '13' },
  { id: 'review', label: 'Review & Submit', number: '14' }
];

const QUICK_NAV_SECTIONS = [
  { id: 'section-summary', number: '01', label: 'Summary' },
  { id: 'section-basic', number: '02', label: 'Basic Details' },
  { id: 'section-employment', number: '03', label: 'Employment Details' },
  { id: 'section-salary', number: '04', label: 'Salary & Statutory' },
  { id: 'section-bank', number: '05', label: 'Bank Details' },
  { id: 'section-address', number: '06', label: 'Addresses' },
  { id: 'section-family', number: '07', label: 'Family Details' },
  { id: 'section-documents', number: '08', label: 'Documents' },
  { id: 'section-assets', number: '09', label: 'Assets' },
  { id: 'section-letters', number: '10', label: 'Letter Inbox' },
  { id: 'section-login', number: '11', label: 'Login Access' },
  { id: 'section-additional', number: '12', label: 'Additional Info' },
  { id: 'section-activity', number: '13', label: 'Activity Logs' },
];

const DEFAULT_FORM_DATA = {
  employeeCode: '',
  joiningDate: '',
  name: '',
  firstName: '',
  middleName: '',
  lastName: '',
  fatherHusbandName: '',
  fatherName: '',
  fatherHusbandRelation: '',
  gender: '',
  dob: '',
  mobile: '',
  alternateMobile: '',
  emergencyMobile: '',
  email: '',
  maritalStatus: '',
  marriedDate: '',
  marriageDate: '',
  spouseName: '',
  bloodGroup: '',
  religion: '',
  nationality: 'Indian',
  employeePhoto: '',
  password: '',
  enablePortalAccess: true,
  employeeType: '',
  clientId: '',
  clientName: '',
  companyId: '',
  companyName: '',
  department: '',
  designation: '',
  clientAddress: '',
  site: '',
  siteLocation: '',
  dutyPost: '',
  shift: '',
  shiftPolicy: '',
  weekOffPolicy: 'Sunday Fixed',
  attendanceMethod: 'Manual',
  attendanceMethods: ['Default / WiFi / Geolocation'],
  allowMobileAppLogin: true,
  attendanceHolidayOfficeOff: false,
  autoPunchOutLocationOff: false,
  reportingSupervisor: '',
  reportingManager: '',
  joiningLocation: '',
  previousExperience: '',
  language: '',
  qualification: '',
  technicalQualification: '',
  employeeStatus: '',
  exitDate: '',
  exitReason: '',
  exitDateReason: '',
  salaryType: '',
  salaryStructureType: '',
  basic: 0,
  vda: 0,
  hra: 0,
  conveyance: 0,
  specialAllowance: 0,
  otherAllowance: 0,
  grossSalary: 0,
  minimumWageCategory: '',
  overtimeRate: 0,
  bonus: 0,
  gratuity: 0,
  salaryEffectiveFrom: '',
  pan: '',
  aadhaar: '',
  uan: '',
  pfNo: '',
  esicNo: '',
  dispensaryNo: '',
  pfApplicable: '',
  esiApplicable: '',
  ptApplicable: '',
  lwf: '',
  lwfApplicable: false,
  tdsApplicable: '',
  salaryRevisions: [],
  customEarnings: {},
  deductions: {},
  employerContributions: {},
  netSalary: 0,
  totalSalary: 0,
  ctc: 0,
  totalCtc: 0,
  isIncrement: false,
  doNotDeductEsi: false,
  deductEsi: true,
  deductEsiAboveCeiling: true,
  doNotDeductPf: false,
  deductPf: true,
  doNotDeductPension: false,
  deductPfAboveCeilingEmployee: false,
  deductPfAboveCeilingEmployer: false,
  deductPfOnGrossSalary: false,
  deductPfExtraContribution: false,
  minPfDeduction: 0,
  doNotDeductPt: false,
  deductPt: true,
  ptNo: '',
  ptTaxState: 'Delhi',
  doNotDeductTds: true,
  deductTds: false,
  metroCityResident: false,
  doNotDeductLwf: true,
  deductLwf: false,
  lwfTaxState: 'Delhi',
  lwfNo: '',
  licenseList: [
    {
      licenseType: 'Driving License',
      licenseNo: '',
      expiryDate: '',
      photo: ''
    }
  ],
  licenseType: 'Driving License',
  drivingLicenseType: 'Driving License',
  drivingLicenseNo: '',
  dlExpiryDate: '',
  drivingLicenseCopy: '',
  armedLicenseNo: '',
  alExpiryDate: '',
  bankName: '',
  branchName: '',
  accountNumber: '',
  ifsc: '',
  accountHolder: '',
  paymentMode: '',
  presentAddress: '',
  permanentAddress: '',
  sameAsPresentAddress: false,
  familyMembers: [
    {
      name: '',
      relation: '',
      dob: '',
      dobAge: '',
      aadhaarNumber: '',
      address: '',
      residentWith: 'Yes',
      residingWith: 'Yes',
      aadhaarPhoto: ''
    }
  ],
  familyMemberName: '',
  relation: '',
  dob: '',
  dobAge: '',
  address: '',
  residentWith: 'Yes',
  residingWith: 'Yes',
  nomineeYesNo: '',
  nomineeSharePercent: '',
  documentList: [
    {
      name: '',
      photo: ''
    }
  ],
  documents: {
    aadhaarCard: { status: 'pending', date: null },
    panCard: { status: 'pending', date: null },
    bankProof: { status: 'pending', date: null },
    addressProof: { status: 'pending', date: null },
    policeVerification: { status: 'pending', date: null },
    educationCertificate: { status: 'pending', date: null },
    experienceCertificate: { status: 'pending', date: null },
    appointmentLetter: { status: 'pending', date: null },
    photo: { status: 'pending', date: null },
    otherDocuments: { status: 'pending', date: null },
    employeeSignature: { status: 'pending', date: null },
    hrAdminVerification: { status: 'pending', date: null }
  },
  remarks: '',
  notes: '',
  otherInfo1: '',
  otherInfo2: '',
  otherInfo3: '',
  otherInfo4: '',
  otherInfo5: '',
  otherInfo6: '',
  otherInfo7: '',
  otherInfo8: '',
  otherInfo9: '',
  otherInfo10: '',
  additionalInfo: {}
};

const normalizeEmployeeForForm = (employee) => {
  if (!employee) return DEFAULT_FORM_DATA;

  const documents = {
    ...DEFAULT_FORM_DATA.documents,
    ...(employee.documents || {})
  };

  const documentList = Array.isArray(employee.documentList) && employee.documentList.length > 0
    ? employee.documentList.map(d => ({
        name: d.name ?? d.documentName ?? '',
        photo: d.photo ?? d.fileName ?? ''
      }))
    : [
        {
          name: '',
          photo: ''
        }
      ];

  const licenseList = Array.isArray(employee.licenseList) && employee.licenseList.length > 0
    ? employee.licenseList.map(l => ({
        licenseType: l.licenseType ?? l.type ?? 'Driving License',
        licenseNo: l.licenseNo ?? l.number ?? '',
        expiryDate: l.expiryDate ?? l.dlExpiryDate ?? '',
        photo: l.photo ?? l.drivingLicenseCopy ?? ''
      }))
    : Array.isArray(employee.licenses) && employee.licenses.length > 0
    ? employee.licenses.map(l => ({
        licenseType: l.licenseType ?? l.type ?? 'Driving License',
        licenseNo: l.licenseNo ?? l.number ?? '',
        expiryDate: l.expiryDate ?? l.dlExpiryDate ?? '',
        photo: l.photo ?? l.drivingLicenseCopy ?? ''
      }))
    : [
        {
          licenseType: employee.licenseType ?? employee.drivingLicenseType ?? 'Driving License',
          licenseNo: employee.drivingLicenseNo ?? employee.dlNo ?? '',
          expiryDate: employee.dlExpiryDate ?? '',
          photo: employee.drivingLicenseCopy ?? employee.dlCopy ?? employee.drivingLicensePhoto ?? ''
        }
      ];

  const familyMembers = Array.isArray(employee.familyMembers) && employee.familyMembers.length > 0
    ? employee.familyMembers.map(m => ({
        name: m.name ?? m.familyMemberName ?? '',
        relation: m.relation ?? '',
        dob: m.dob ?? m.dobAge ?? '',
        dobAge: m.dobAge ?? m.dob ?? '',
        aadhaarNumber: m.aadhaarNumber ?? m.aadhaar ?? '',
        address: m.address ?? '',
        residentWith: m.residentWith ?? m.residingWith ?? 'Yes',
        residingWith: m.residingWith ?? m.residentWith ?? 'Yes',
        aadhaarPhoto: m.aadhaarPhoto ?? m.photo ?? ''
      }))
    : [
        {
          name: employee.familyMemberName ?? '',
          relation: employee.relation ?? '',
          dob: employee.familyDob ?? employee.dobAge ?? '',
          dobAge: employee.dobAge ?? employee.familyDob ?? '',
          aadhaarNumber: employee.familyAadhaar ?? '',
          address: employee.address ?? '',
          residentWith: employee.residentWith ?? employee.residingWith ?? 'Yes',
          residingWith: employee.residingWith ?? employee.residentWith ?? 'Yes',
          aadhaarPhoto: ''
        }
      ];

  const rawName = (employee.name || '').trim();
  const nameParts = rawName.split(/\s+/).filter(Boolean);
  const hasDistinctParts = Boolean(
    (employee.firstName && String(employee.firstName).trim() !== '') ||
    (employee.lastName && String(employee.lastName).trim() !== '')
  );
  const inferredFirst = hasDistinctParts ? (employee.firstName || '') : (nameParts[0] || '');
  const inferredMiddle = hasDistinctParts ? (employee.middleName || '') : (nameParts.length > 2 ? nameParts.slice(1, -1).join(' ') : '');
  const inferredLast = hasDistinctParts ? (employee.lastName || '') : (nameParts.length > 1 ? nameParts[nameParts.length - 1] : '');
  const resolvedFullName = rawName || [inferredFirst, inferredMiddle, inferredLast].filter(Boolean).join(' ');

  return {
    ...DEFAULT_FORM_DATA,
    ...employee,
    employeeCode: employee.employeeCode ?? employee.employeeId ?? '',
    employeeId: employee.employeeId ?? employee.employeeCode ?? '',
    name: resolvedFullName,
    firstName: inferredFirst,
    middleName: inferredMiddle,
    lastName: inferredLast,
    fatherHusbandName: employee.fatherHusbandName ?? employee.fatherName ?? '',
    fatherName: employee.fatherName ?? employee.fatherHusbandName ?? '',
    fatherHusbandRelation: employee.fatherHusbandRelation ?? employee.fatherRelation ?? '',
    gender: employee.gender ?? '',
    dob: employee.dob ?? '',
    mobile: employee.mobile ?? employee.contact ?? '',
    alternateMobile: employee.alternateMobile ?? employee.emergencyMobile ?? '',
    emergencyMobile: employee.emergencyMobile ?? employee.alternateMobile ?? '',
    email: employee.email ?? '',
    maritalStatus: employee.maritalStatus ?? '',
    marriedDate: employee.marriedDate ?? employee.marriageDate ?? '',
    marriageDate: employee.marriageDate ?? employee.marriedDate ?? '',
    spouseName: employee.spouseName ?? '',
    bloodGroup: employee.bloodGroup ?? '',
    religion: employee.religion ?? '',
    nationality: employee.nationality ?? 'Indian',
    employeePhoto: employee.employeePhoto ?? employee.photo ?? '',
    employeeType: employee.employeeType ?? '',
    clientId: employee.clientId ?? employee.companyId ?? '',
    clientName: employee.clientName ?? employee.companyName ?? '',
    companyId: employee.companyId ?? '',
    companyName: employee.companyName ?? employee.clientName ?? '',
    department: employee.department ?? '',
    designation: employee.designation ?? '',
    clientAddress: (employee.clientAddress && employee.clientAddress !== 'Branch Office' && employee.clientAddress !== 'Main Site')
      ? employee.clientAddress
      : (employee.clientCompanyAddress || employee.address || ''),
    site: employee.site ?? employee.siteLocation ?? '',
    siteLocation: employee.site ?? employee.siteLocation ?? '',
    dutyPost: employee.dutyPost ?? '',
    shift: employee.shift ?? employee.shiftPolicy ?? '',
    shiftPolicy: employee.shiftPolicy ?? employee.shift ?? '',
    weekOffPolicy: employee.weekOffPolicy ?? 'Sunday Fixed',
    attendanceMethod: employee.attendanceMethod ?? 'Manual',
    attendanceMethods: Array.isArray(employee.attendanceMethods) && employee.attendanceMethods.length > 0
      ? employee.attendanceMethods
      : (employee.attendanceMethod ? [employee.attendanceMethod] : ['Default / WiFi / Geolocation']),
    allowMobileAppLogin: employee.allowMobileAppLogin !== undefined ? !!employee.allowMobileAppLogin : true,
    attendanceHolidayOfficeOff: employee.attendanceHolidayOfficeOff !== undefined ? !!employee.attendanceHolidayOfficeOff : false,
    autoPunchOutLocationOff: employee.autoPunchOutLocationOff !== undefined ? !!employee.autoPunchOutLocationOff : false,
    reportingSupervisor: employee.reportingSupervisor ?? '',
    reportingManager: employee.reportingManager ?? '',
    joiningLocation: employee.joiningLocation ?? '',
    previousExperience: employee.previousExperience ?? '',
    language: employee.language ?? '',
    qualification: employee.qualification ?? '',
    technicalQualification: employee.technicalQualification ?? '',
    employeeStatus: employee.employeeStatus ?? employee.status ?? '',
    exitDate: employee.exitDate ?? '',
    exitReason: employee.exitReason ?? '',
    exitDateReason: employee.exitDateReason ?? (employee.exitDate || employee.exitReason ? `${employee.exitDate || ''} ${employee.exitReason || ''}`.trim() : ''),
    salaryType: employee.salaryType ?? '',
    salaryStructureType: employee.salaryStructureType ?? '',
    basic: employee.basic ?? 0,
    vda: employee.vda ?? 0,
    hra: employee.hra ?? 0,
    conveyance: employee.conveyance ?? 0,
    specialAllowance: employee.specialAllowance ?? 0,
    otherAllowance: employee.otherAllowance ?? 0,
    grossSalary: employee.grossSalary ?? 0,
    minimumWageCategory: employee.minimumWageCategory ?? '',
    overtimeRate: employee.overtimeRate ?? 0,
    bonus: employee.bonus ?? 0,
    gratuity: employee.gratuity ?? 0,
    salaryEffectiveFrom: employee.salaryEffectiveFrom ?? '',
    pan: employee.pan ?? '',
    aadhaar: employee.aadhaar ?? '',
    uan: employee.uan ?? '',
    pfNo: employee.pfNo ?? employee.pfNumber ?? '',
    esicNo: employee.esicNo ?? '',
    dispensaryNo: employee.dispensaryNo ?? employee.dispensaryNumber ?? employee.dispensary ?? '',
    pfApplicable: employee.pfApplicable ?? '',
    esiApplicable: employee.esiApplicable ?? '',
    ptApplicable: employee.ptApplicable ?? '',
    lwf: employee.lwf ?? employee.lwfNo ?? '',
    lwfApplicable: employee.lwfApplicable ?? false,
    tdsApplicable: employee.tdsApplicable ?? employee.tds ?? '',
    salaryRevisions: Array.isArray(employee.salaryRevisions) ? employee.salaryRevisions : [],
    customEarnings: employee.customEarnings || {},
    deductions: employee.deductions || {},
    employerContributions: employee.employerContributions || {},
    netSalary: employee.netSalary ?? 0,
    totalSalary: employee.totalSalary ?? employee.grossSalary ?? 0,
    ctc: employee.ctc ?? employee.totalCtc ?? 0,
    totalCtc: employee.totalCtc ?? employee.ctc ?? 0,
    isIncrement: Boolean(employee.isIncrement),
    doNotDeductEsi: employee.doNotDeductEsi ?? (employee.deductEsi !== undefined ? !employee.deductEsi : false),
    deductEsi: employee.deductEsi ?? (employee.doNotDeductEsi !== undefined ? !employee.doNotDeductEsi : true),
    deductEsiAboveCeiling: employee.deductEsiAboveCeiling !== undefined ? Boolean(employee.deductEsiAboveCeiling) : true,
    doNotDeductPf: employee.doNotDeductPf ?? (employee.deductPf !== undefined ? !employee.deductPf : false),
    deductPf: employee.deductPf ?? (employee.doNotDeductPf !== undefined ? !employee.doNotDeductPf : true),
    doNotDeductPension: Boolean(employee.doNotDeductPension),
    deductPfAboveCeilingEmployee: Boolean(employee.deductPfAboveCeilingEmployee),
    deductPfAboveCeilingEmployer: Boolean(employee.deductPfAboveCeilingEmployer),
    deductPfOnGrossSalary: Boolean(employee.deductPfOnGrossSalary),
    deductPfExtraContribution: Boolean(employee.deductPfExtraContribution),
    minPfDeduction: employee.minPfDeduction ?? 0,
    doNotDeductPt: employee.doNotDeductPt ?? (employee.deductPt !== undefined ? !employee.deductPt : false),
    deductPt: employee.deductPt ?? (employee.doNotDeductPt !== undefined ? !employee.doNotDeductPt : true),
    ptNo: employee.ptNo ?? employee.ptNumber ?? '',
    ptTaxState: employee.ptTaxState || 'Delhi',
    doNotDeductTds: employee.doNotDeductTds ?? (employee.deductTds !== undefined ? !employee.deductTds : true),
    deductTds: employee.deductTds ?? (employee.doNotDeductTds !== undefined ? !employee.doNotDeductTds : false),
    metroCityResident: Boolean(employee.metroCityResident),
    doNotDeductLwf: employee.doNotDeductLwf ?? (employee.deductLwf !== undefined ? !employee.deductLwf : true),
    deductLwf: employee.deductLwf ?? (employee.doNotDeductLwf !== undefined ? !employee.doNotDeductLwf : false),
    lwfTaxState: employee.lwfTaxState || 'Delhi',
    lwfNo: employee.lwfNo ?? employee.lwf ?? '',
    licenseType: employee.licenseType ?? employee.drivingLicenseType ?? 'Driving License',
    drivingLicenseType: employee.drivingLicenseType ?? employee.licenseType ?? 'Driving License',
    drivingLicenseNo: employee.drivingLicenseNo ?? employee.dlNo ?? '',
    dlExpiryDate: employee.dlExpiryDate ?? '',
    drivingLicenseCopy: employee.drivingLicenseCopy ?? employee.dlCopy ?? employee.drivingLicensePhoto ?? '',
    armedLicenseNo: employee.armedLicenseNo ?? employee.alNo ?? '',
    alExpiryDate: employee.alExpiryDate ?? '',
    bankName: employee.bankName ?? '',
    branchName: employee.branchName ?? employee.branch ?? '',
    accountNumber: employee.accountNumber ?? '',
    ifsc: employee.ifsc ?? '',
    accountHolder: employee.accountHolder ?? '',
    paymentMode: employee.paymentMode ?? '',
    presentAddress: employee.presentAddress ?? '',
    permanentAddress: employee.permanentAddress ?? '',
    sameAsPresentAddress: employee.sameAsPresentAddress ?? false,
    licenseList,
    familyMembers,
    familyMemberName: familyMembers[0]?.name || (employee.familyMemberName ?? ''),
    relation: familyMembers[0]?.relation || (employee.relation ?? ''),
    dobAge: familyMembers[0]?.dobAge || (employee.dobAge ?? ''),
    address: familyMembers[0]?.address || (employee.address ?? ''),
    residentWith: familyMembers[0]?.residentWith || familyMembers[0]?.residingWith || employee.residentWith || employee.residingWith || 'Yes',
    residingWith: familyMembers[0]?.residentWith || familyMembers[0]?.residingWith || employee.residentWith || employee.residingWith || 'Yes',
    nomineeYesNo: familyMembers[0]?.nomineeYesNo || (employee.nomineeYesNo ?? ''),
    nomineeSharePercent: familyMembers[0]?.nomineeSharePercent || (employee.nomineeSharePercent ?? ''),
    documentList,
    documents,
    remarks: employee.remarks ?? '',
    status: employee.status ?? employee.employeeStatus ?? 'active',
    site: employee.site ?? employee.siteLocation ?? '',
    contact: employee.contact ?? employee.mobile ?? '',
    password: employee.savedPassword ?? employee.password ?? '',
    enablePortalAccess: employee.enablePortalAccess !== false && employee.enablePortalAccess !== 'false',
    allowMobileAppLogin: employee.allowMobileAppLogin !== undefined ? !!employee.allowMobileAppLogin : true,
    notes: employee.notes ?? employee.additionalInfo?.notes ?? '',
    otherInfo1: employee.otherInfo1 ?? employee.additionalInfo?.otherInfo1 ?? '',
    otherInfo2: employee.otherInfo2 ?? employee.additionalInfo?.otherInfo2 ?? '',
    otherInfo3: employee.otherInfo3 ?? employee.additionalInfo?.otherInfo3 ?? '',
    otherInfo4: employee.otherInfo4 ?? employee.additionalInfo?.otherInfo4 ?? '',
    otherInfo5: employee.otherInfo5 ?? employee.additionalInfo?.otherInfo5 ?? '',
    otherInfo6: employee.otherInfo6 ?? employee.additionalInfo?.otherInfo6 ?? '',
    otherInfo7: employee.otherInfo7 ?? employee.additionalInfo?.otherInfo7 ?? '',
    otherInfo8: employee.otherInfo8 ?? employee.additionalInfo?.otherInfo8 ?? '',
    otherInfo9: employee.otherInfo9 ?? employee.additionalInfo?.otherInfo9 ?? '',
    otherInfo10: employee.otherInfo10 ?? employee.additionalInfo?.otherInfo10 ?? '',
    additionalInfo: employee.additionalInfo || {}
  };
};

/**
 * EmployeeForm — Full 6-step multi-step form for adding or editing an employee.
 * Supports preserving data across steps, validation, and final review.
 */
function EmployeeForm({
  isOpen,
  isPageMode = false,
  onClose,
  onSubmit,
  employee,
  clients = [],
  departments = [],
  designations = [],
  employeeTypes = [],
  sites = [],
  posts = [],
  shifts = [],
  banks = [],
  documentTypes = [],
  workLocations = [],
  employeesCount = 0,
  breadcrumb = null,
  onPrevEmployee = null,
  onNextEmployee = null,
  hasPrevEmployee = false,
  hasNextEmployee = false
}) {
  const { activeCompany } = useCompany();
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState(DEFAULT_FORM_DATA);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeNavBtn, setActiveNavBtn] = useState(null);
  const modalRef = useRef(null);

  const isEditMode = !!employee;
  const shouldShow = isPageMode || isOpen;
  const isStackedMode = isPageMode;
  const [activeSection, setActiveSection] = useState('section-summary');

  const handleTabClick = (sectionId) => {
    setActiveSection(sectionId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    if (shouldShow) {
      if (!isPageMode) {
        setCurrentStep(0);
      }
      setErrors({});

      if (employee) {
        setFormData(normalizeEmployeeForForm(employee));
      } else {
        // Resolve active company series prefix & rules dynamically
        let seriesConfig = activeCompany?.employeeCodeSeries;
        const compId = activeCompany?.companyId || activeCompany?.id;
        if (!seriesConfig && compId) {
          const savedComp = localStorage.getItem(`novaspark_number_series_${compId}`);
          if (savedComp) {
            try { seriesConfig = JSON.parse(savedComp); } catch(e) {}
          }
        }
        if (!seriesConfig) {
          const globalSaved = localStorage.getItem('novaspark_number_series');
          if (globalSaved) {
            try {
              const parsed = JSON.parse(globalSaved);
              seriesConfig = parsed.find(s => s.id === 'employee-code');
            } catch(e) {}
          }
        }

        const companyPrefix = (seriesConfig?.prefix || activeCompany?.code || 'EMP').trim().toUpperCase();
        const startNum = Number(seriesConfig?.startingNumber) || 1;
        // Dynamically compute next sequence based on existing live database employees count
        const dynamicNextSeq = startNum + employeesCount;

        const effectiveSeries = {
          prefix: companyPrefix,
          padding: Number(seriesConfig?.padding) || 3,
          separator: seriesConfig?.separator !== undefined ? seriesConfig.separator : '-',
          yearFormat: seriesConfig?.yearFormat || 'None',
          monthFormat: seriesConfig?.monthFormat || 'None',
          startingNumber: startNum,
          currentNumber: dynamicNextSeq,
          ...seriesConfig,
          currentNumber: dynamicNextSeq
        };

        const autoGeneratedCode = generateSeriesPreview(effectiveSeries);

        setFormData({
          ...DEFAULT_FORM_DATA,
          employeeCode: autoGeneratedCode,
          employeeId: autoGeneratedCode,
          companyId: compId || '',
          companyName: activeCompany?.name || '',
          joiningDate: new Date().toISOString().split('T')[0]
        });
      }
    }
  }, [isOpen, employee, activeCompany, employeesCount]);

  useEffect(() => {
    if (shouldShow && modalRef.current && !isPageMode) {
      modalRef.current.focus();
    }
  }, [shouldShow, isPageMode]);

  useEffect(() => {
    if (!isOpen || isPageMode) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && onClose) onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isPageMode, onClose]);

  if (!shouldShow) return null;

  const validateStep = (step) => {
    // Required fields are made optional for now as requested
    setErrors({});
    return true;
  };

  const handleNext = () => {
    if (!validateStep(currentStep)) return;
    setCurrentStep((prev) => Math.min(prev + 1, STEPS.length - 1));
  };

  const handleBack = () => {
    setErrors({});
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const handleFormDataChange = (updated) => {
    setFormData(updated);
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    try {
      setIsSubmitting(true);
      const selClient = (clients || []).find(
        c => (c.clientId && c.clientId === formData.clientId) ||
             (c.id && c.id === formData.clientId) ||
             (c._id && c._id === formData.clientId) ||
             (c.name && (c.name === formData.clientName || c.name === formData.companyName))
      );
      const resolvedAddress = selClient?.address ||
        ((formData.clientAddress && formData.clientAddress !== 'Branch Office' && formData.clientAddress !== 'Main Site') ? formData.clientAddress : '');

      const payload = {
        ...formData,
        shift: formData.shiftPolicy || formData.shift || '',
        shiftPolicy: formData.shiftPolicy || formData.shift || '',
        weekOffPolicy: formData.weekOffPolicy || 'Sunday Fixed',
        ...(resolvedAddress ? {
          clientAddress: resolvedAddress,
          siteLocation: resolvedAddress,
          site: resolvedAddress
        } : {})
      };
      await onSubmit(payload);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('employee-saved'));
      }
    } catch (err) {
      console.error('Error saving employee:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isLastStep = currentStep === STEPS.length - 1;

  return (
    <div
      className={isPageMode ? styles.pageContainer : styles.overlay}
      role={isPageMode ? undefined : "dialog"}
      aria-modal={isPageMode ? undefined : "true"}
      aria-labelledby="employee-form-title"
    >
      <div
        ref={modalRef}
        tabIndex={isPageMode ? undefined : "-1"}
        className={isPageMode ? styles.pageCard : styles.modal}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header: In Page Mode, render top bar with breadcrumb */}
        {isPageMode ? (
          <div className={styles.pageTopBar}>
            {breadcrumb ? (
              <div className={styles.breadcrumbWrapper}>{breadcrumb}</div>
            ) : (
              <div />
            )}
          </div>
        ) : (
          <header className={styles.header}>
            <div>
              <h2 id="employee-form-title" className={styles.title}>
                {isEditMode ? 'Edit Employee' : 'Add Employee'}
              </h2>
              <p className={styles.subtitle}>
                {isStackedMode
                  ? (isEditMode ? 'Update employee details across all sections below' : 'Fill out all employee details below across sections')
                  : `Step ${currentStep + 1} of ${STEPS.length}: ${STEPS[currentStep].label}`}
              </p>
            </div>

            {onClose && (
              <button
                className={styles.closeBtn}
                onClick={onClose}
                aria-label="Close form"
                disabled={isSubmitting}
              >
                <X size={16} />
              </button>
            )}
          </header>
        )}

        {/* Form Content: Stacked Layout with Left Quick Nav for Page Mode, Stepped for Modal Mode */}
        {isStackedMode ? (
          <div className={styles.stackedLayout}>
            {/* Quick Section Navigator (Sticky Left Sidebar) */}
            <aside className={styles.quickNavWrapper}>
              {/* Sidebar Header: Next/Previous navigation and Employee Name & Code in Edit Mode, or title in Add Mode */}
              {isEditMode ? (
                <div className={styles.sidebarEmployeeHeader}>
                  <div className={styles.navRoundButtonsRow}>
                    <button
                      type="button"
                      className={`${styles.roundNavBtn} ${activeNavBtn === 'prev' ? styles.roundNavBtnActive : ''}`}
                      onClick={() => {
                        setActiveNavBtn('prev');
                        onPrevEmployee?.();
                        setTimeout(() => setActiveNavBtn(null), 350);
                      }}
                      disabled={!hasPrevEmployee}
                      title={hasPrevEmployee ? "Previous Employee" : "No previous employee"}
                      aria-label="Previous Employee"
                    >
                      <ChevronLeft size={15} strokeWidth={2.5} />
                    </button>
                    <button
                      type="button"
                      className={`${styles.roundNavBtn} ${activeNavBtn === 'next' ? styles.roundNavBtnActive : ''}`}
                      onClick={() => {
                        setActiveNavBtn('next');
                        onNextEmployee?.();
                        setTimeout(() => setActiveNavBtn(null), 350);
                      }}
                      disabled={!hasNextEmployee}
                      title={hasNextEmployee ? "Next Employee" : "No next employee"}
                      aria-label="Next Employee"
                    >
                      <ChevronRight size={15} strokeWidth={2.5} />
                    </button>
                  </div>

                  <div className={styles.sidebarDivider} />

                  <div className={styles.sidebarEmpInfo}>
                    <h3 className={styles.sidebarEmpName}>
                      {employee?.name || formData?.name || 'Employee Details'}
                    </h3>
                    <div className={styles.sidebarEmpCode}>
                      {employee?.employeeId || employee?.empCode || employee?.employeeCode || formData?.employeeId || '—'}
                    </div>
                  </div>
                </div>
              ) : (
                <div className={styles.quickNavHeader}>
                  <span className={styles.quickNavTitle}>Quick Navigation</span>
                </div>
              )}
              <nav className={styles.quickNavList} aria-label="Section navigation" role="tablist">
                {QUICK_NAV_SECTIONS.map((item) => {
                  const isActive = activeSection === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      onClick={() => handleTabClick(item.id)}
                      className={`${styles.quickNavItem} ${isActive ? styles.quickNavItemActive : ''}`}
                    >
                      <span className={`${styles.quickNavNumber} ${isActive ? styles.quickNavNumberActive : ''}`}>
                        {item.number}
                      </span>
                      <span className={styles.quickNavLabel}>{item.label}</span>
                    </button>
                  );
                })}
              </nav>
            </aside>

            {/* Form Content on Right (Tab-based: only active tab displayed) */}
            <div className={styles.allSectionsWrapper}>
            {/* 01. Summary */}
            <section
              id="section-summary"
              className={styles.sectionCard}
              style={{ display: activeSection === 'section-summary' ? 'block' : 'none' }}
            >
              <EmployeeSummaryStep data={formData} />
            </section>

            {/* 02. Basic Details */}
            <section
              id="section-basic"
              className={styles.plainSectionCard}
              style={{ display: activeSection === 'section-basic' ? 'block' : 'none' }}
            >
              <PersonalInfoStep data={formData} onChange={handleFormDataChange} errors={errors} />
            </section>

            {/* 03. Employment Details */}
            <section
              id="section-employment"
              className={styles.plainSectionCard}
              style={{ display: activeSection === 'section-employment' ? 'block' : 'none' }}
            >
              <EmploymentStep
                data={formData}
                onChange={handleFormDataChange}
                errors={errors}
                clients={clients}
                departments={departments}
                designations={designations}
                employeeTypes={employeeTypes}
                sites={sites}
                posts={posts}
                shifts={shifts}
                workLocations={workLocations}
              />
            </section>

            {/* 04. Salary & Statutory */}
            <section
              id="section-salary"
              className={styles.plainSectionCard}
              style={{ display: activeSection === 'section-salary' ? 'block' : 'none' }}
            >
              <SalaryStructureStep
                key={formData._id || formData.id || formData.employeeCode || formData.employeeId || 'salary-new'}
                data={formData}
                onChange={handleFormDataChange}
              />
            </section>

            {/* 05. Bank Details */}
            <section
              id="section-bank"
              className={styles.plainSectionCard}
              style={{ display: activeSection === 'section-bank' ? 'block' : 'none' }}
            >
              <BankDetailsStep
                data={formData}
                onChange={handleFormDataChange}
                errors={errors}
                banks={banks}
              />
            </section>

            {/* 06. Addresses */}
            <section
              id="section-address"
              className={styles.plainSectionCard}
              style={{ display: activeSection === 'section-address' ? 'block' : 'none' }}
            >
              <AddressStep data={formData} onChange={handleFormDataChange} />
            </section>

            {/* 07. Family Details */}
            <section
              id="section-family"
              className={styles.plainSectionCard}
              style={{ display: activeSection === 'section-family' ? 'block' : 'none' }}
            >
              <FamilyStep data={formData} onChange={handleFormDataChange} />
            </section>

            {/* 08. Documents & Licenses */}
            <section
              id="section-documents"
              className={styles.plainSectionCard}
              style={{ display: activeSection === 'section-documents' ? 'block' : 'none' }}
            >
              <DocumentsStep
                data={formData}
                onChange={handleFormDataChange}
                designation={formData.designation}
                documentTypes={documentTypes}
              />
            </section>

            {/* 09. Assets */}
            <section
              id="section-assets"
              className={styles.plainSectionCard}
              style={{ display: activeSection === 'section-assets' ? 'block' : 'none' }}
            >
              <AssetsStep
                data={formData}
                employee={employee || formData}
                onChange={handleFormDataChange}
              />
            </section>

            {/* 10. Letter Inbox */}
            <section
              id="section-letters"
              className={styles.plainSectionCard}
              style={{ display: activeSection === 'section-letters' ? 'block' : 'none' }}
            >
              <LetterInboxStep
                data={formData}
                employee={employee}
              />
            </section>

            {/* 11. Login Access */}
            <section
              id="section-login"
              className={styles.plainSectionCard}
              style={{ display: activeSection === 'section-login' ? 'block' : 'none' }}
            >
              <LoginAccessStep
                data={formData}
                onChange={handleFormDataChange}
                isEditMode={isEditMode}
              />
            </section>

            {/* 12. Additional Info */}
            <section
              id="section-additional"
              className={styles.sectionCard}
              style={{ display: activeSection === 'section-additional' ? 'block' : 'none' }}
            >
              <div className={styles.sectionHeader}>
                <div className={styles.sectionHeaderLeft}>
                  <span className={styles.sectionNumber}>12</span>
                  <div>
                    <h3 className={styles.sectionTitle}>Additional Info</h3>
                    <p className={styles.sectionSubtitle}>Customized data fields and additional organizational notes</p>
                  </div>
                </div>
              </div>
              <div className={styles.sectionBody}>
                <AdditionalInfoStep
                  data={formData}
                  onChange={handleFormDataChange}
                  isSubmitting={isSubmitting}
                />
              </div>
              {isEditMode && (
                <div className={styles.sectionFooter}>
                  <button
                    type="button"
                    className={styles.sectionSaveBtn}
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 size={14} className={styles.spinner} />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Check size={14} />
                        <span>Save</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </section>

            {/* 13. Activity Logs */}
            <section
              id="section-activity"
              className={styles.plainSectionCard}
              style={{ display: activeSection === 'section-activity' ? 'block' : 'none' }}
            >
              <ActivityLogsStep data={formData} employee={employee || {}} />
            </section>

            {/* Bottom Actions Bar in Page Mode (Shifted to bottom as requested) */}
            {isPageMode && (
              <div className={styles.pageBottomBar}>
                <button
                  type="button"
                  className={styles.submitBtn}
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={16} className={styles.spinner} />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Check size={16} />
                      <span>Save</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <>
          <div className={styles.stepperWrapper}>
            <div className={styles.stepper} role={isEditMode ? 'tablist' : 'list'} aria-label="Form steps">
              {STEPS.map((step, idx) => {
                const isDone = idx < currentStep;
                const isCurrent = idx === currentStep;

                if (isEditMode) {
                  return (
                    <button
                      key={step.id}
                      type="button"
                      disabled={isSubmitting}
                      className={`${styles.stepItem} ${styles.stepItemClickable} ${isDone ? styles.stepDone : ''} ${isCurrent ? styles.stepActive : ''}`}
                      onClick={() => {
                        if (isSubmitting) return;
                        setErrors({});
                        setCurrentStep(idx);
                      }}
                      title={`Go to Step ${idx + 1}: ${step.label}`}
                      role="tab"
                      aria-selected={isCurrent}
                    >
                      <div className={styles.stepCircle}>
                        {isDone ? <Check size={13} strokeWidth={3} /> : step.number}
                      </div>
                      <span className={styles.stepLabel}>{step.label}</span>
                      {idx < STEPS.length - 1 && <div className={`${styles.stepConnector} ${isDone ? styles.stepConnectorDone : ''}`} />}
                    </button>
                  );
                }

                return (
                  <div
                    key={step.id}
                    className={`${styles.stepItem} ${isDone ? styles.stepDone : ''} ${isCurrent ? styles.stepActive : ''}`}
                    role="listitem"
                    aria-current={isCurrent ? 'step' : undefined}
                  >
                    <div className={styles.stepCircle}>
                      {isDone ? <Check size={13} strokeWidth={3} /> : step.number}
                    </div>
                    <span className={styles.stepLabel}>{step.label}</span>
                    {idx < STEPS.length - 1 && <div className={`${styles.stepConnector} ${isDone ? styles.stepConnectorDone : ''}`} />}
                  </div>
                );
              })}
            </div>
          </div>

          <div className={styles.content}>
            {currentStep === 0 && (
              <EmployeeSummaryStep data={formData} />
            )}
            {currentStep === 1 && (
              <PersonalInfoStep data={formData} onChange={handleFormDataChange} errors={errors} />
            )}
            {currentStep === 2 && (
              <EmploymentStep
                data={formData}
                onChange={handleFormDataChange}
                errors={errors}
                clients={clients}
                departments={departments}
                designations={designations}
                employeeTypes={employeeTypes}
                sites={sites}
                posts={posts}
                shifts={shifts}
                workLocations={workLocations}
              />
            )}
            {currentStep === 3 && (
              <SalaryStructureStep
                key={formData._id || formData.id || formData.employeeCode || formData.employeeId || 'salary-new'}
                data={formData}
                onChange={handleFormDataChange}
              />
            )}
            {currentStep === 4 && (
              <BankDetailsStep
                data={formData}
                onChange={handleFormDataChange}
                errors={errors}
                banks={banks}
              />
            )}
            {currentStep === 5 && (
              <AddressStep data={formData} onChange={handleFormDataChange} />
            )}
            {currentStep === 6 && (
              <FamilyStep data={formData} onChange={handleFormDataChange} />
            )}
            {currentStep === 7 && (
              <DocumentsStep
                data={formData}
                onChange={handleFormDataChange}
                designation={formData.designation}
                documentTypes={documentTypes}
              />
            )}
            {currentStep === 8 && (
              <AssetsStep
                data={formData}
                employee={employee || formData}
                onChange={handleFormDataChange}
              />
            )}
            {currentStep === 9 && (
              <LetterInboxStep
                data={formData}
                employee={employee}
              />
            )}
            {currentStep === 10 && (
              <LoginAccessStep
                data={formData}
                onChange={handleFormDataChange}
                isEditMode={isEditMode}
              />
            )}
            {currentStep === 11 && (
              <AdditionalInfoStep
                data={formData}
                onChange={handleFormDataChange}
                isSubmitting={isSubmitting}
              />
            )}
            {currentStep === 12 && (
              <ActivityLogsStep data={formData} />
            )}
            {currentStep === 13 && (
              <EmployeeReview data={formData} onEditStep={(stepIdx) => !isSubmitting && setCurrentStep(stepIdx)} />
            )}
          </div>
        </>
      )}

        {/* Footer Navigation: Only shown in Modal Mode */}
        {!isPageMode && (
          <footer className={styles.footer}>
            {onClose && (
              <button className={styles.cancelBtn} onClick={onClose} type="button" disabled={isSubmitting}>
                Cancel
              </button>
            )}

            <div className={styles.navButtons}>
              {currentStep > 0 && (
                <button className={styles.backBtn} onClick={handleBack} type="button" disabled={isSubmitting}>
                  <ChevronLeft size={16} />
                  <span>Back</span>
                </button>
              )}

              {isEditMode ? (
                <>
                  <button
                    className={styles.submitBtn}
                    onClick={handleSubmit}
                    type="button"
                    title="Save changes"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 size={16} className={styles.spinner} />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Check size={16} />
                        <span>Save</span>
                      </>
                    )}
                  </button>

                  {!isLastStep && (
                    <button className={styles.nextBtn} onClick={handleNext} type="button" disabled={isSubmitting}>
                      <span>Continue</span>
                      <ChevronRight size={16} />
                    </button>
                  )}
                </>
              ) : (
                <>
                  {isLastStep ? (
                    <button
                      className={styles.submitBtn}
                      onClick={handleSubmit}
                      type="button"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 size={16} className={styles.spinner} />
                          <span>Saving...</span>
                        </>
                      ) : (
                        <>
                          <Check size={16} />
                          <span>Save Employee</span>
                        </>
                      )}
                    </button>
                  ) : (
                    <button className={styles.nextBtn} onClick={handleNext} type="button" disabled={isSubmitting}>
                      <span>Continue</span>
                      <ChevronRight size={16} />
                    </button>
                  )}
                </>
              )}
            </div>
          </footer>
        )}
      </div>
    </div>
  );
}

export default EmployeeForm;
