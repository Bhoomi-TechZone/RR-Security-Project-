import React, { useState, useEffect, useRef } from 'react';
import { X, Check, ChevronRight, ChevronLeft } from 'lucide-react';
import styles from './EmployeeForm.module.css';
import PersonalInfoStep from './PersonalInfoStep';
import EmploymentStep from './EmploymentStep';
import SalaryStructureStep from './SalaryStructureStep';
import BankDetailsStep from './BankDetailsStep';
import AddressFamilyStep from './AddressFamilyStep';
import DocumentsStep from './DocumentsStep';
import EmployeeReview from './EmployeeReview';
import { useCompany } from '../../context/CompanyContext';
import { generateSeriesPreview, mockNumberSeriesList } from '../../data/numberSeriesData';

const STEPS = [
  { id: 'basic', label: 'Basic Details', number: '01' },
  { id: 'employment', label: 'Employment Details', number: '02' },
  { id: 'salary', label: 'Salary & Statutory', number: '03' },
  { id: 'statutory', label: 'Bank Details', number: '04' },
  { id: 'address', label: 'Address & Family', number: '05' },
  { id: 'documents', label: 'Documents', number: '06' },
  { id: 'review', label: 'Review & Submit', number: '07' }
];

const DEFAULT_FORM_DATA = {
  employeeCode: '',
  joiningDate: '',
  name: '',
  fatherHusbandName: '',
  fatherHusbandRelation: '',
  gender: '',
  dob: '',
  mobile: '',
  alternateMobile: '',
  emergencyMobile: '',
  email: '',
  maritalStatus: '',
  spouseName: '',
  bloodGroup: '',
  religion: '',
  nationality: 'Indian',
  employeePhoto: '',
  employeeType: '',
  clientId: '',
  clientName: '',
  companyId: '',
  companyName: '',
  department: '',
  designation: '',
  siteLocation: '',
  dutyPost: '',
  shift: '',
  reportingSupervisor: '',
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
  lwf: '',
  lwfApplicable: false,
  tdsApplicable: '',
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
      nomineeYesNo: 'No',
      nomineeSharePercent: '',
      aadhaarPhoto: ''
    }
  ],
  familyMemberName: '',
  relation: '',
  dob: '',
  dobAge: '',
  address: '',
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
  remarks: ''
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
        nomineeYesNo: m.nomineeYesNo ?? m.nominee ?? 'No',
        nomineeSharePercent: m.nomineeSharePercent ?? '',
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
          nomineeYesNo: employee.nomineeYesNo ?? 'No',
          nomineeSharePercent: employee.nomineeSharePercent ?? '',
          aadhaarPhoto: ''
        }
      ];

  return {
    ...DEFAULT_FORM_DATA,
    ...employee,
    employeeCode: employee.employeeCode ?? employee.employeeId ?? '',
    employeeId: employee.employeeId ?? employee.employeeCode ?? '',
    name: employee.name ?? '',
    fatherHusbandName: employee.fatherHusbandName ?? '',
    fatherHusbandRelation: employee.fatherHusbandRelation ?? employee.fatherRelation ?? '',
    gender: employee.gender ?? '',
    dob: employee.dob ?? '',
    mobile: employee.mobile ?? employee.contact ?? '',
    alternateMobile: employee.alternateMobile ?? employee.emergencyMobile ?? '',
    emergencyMobile: employee.emergencyMobile ?? employee.alternateMobile ?? '',
    email: employee.email ?? '',
    maritalStatus: employee.maritalStatus ?? '',
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
    siteLocation: employee.siteLocation ?? employee.site ?? '',
    dutyPost: employee.dutyPost ?? '',
    shift: employee.shift ?? '',
    reportingSupervisor: employee.reportingSupervisor ?? '',
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
    lwf: employee.lwf ?? employee.lwfNo ?? '',
    lwfApplicable: employee.lwfApplicable ?? false,
    tdsApplicable: employee.tdsApplicable ?? employee.tds ?? '',
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
    nomineeYesNo: familyMembers[0]?.nomineeYesNo || (employee.nomineeYesNo ?? ''),
    nomineeSharePercent: familyMembers[0]?.nomineeSharePercent || (employee.nomineeSharePercent ?? ''),
    documentList,
    documents,
    remarks: employee.remarks ?? '',
    status: employee.status ?? employee.employeeStatus ?? 'active',
    site: employee.site ?? employee.siteLocation ?? '',
    contact: employee.contact ?? employee.mobile ?? ''
  };
};

/**
 * EmployeeForm — Full 6-step multi-step form for adding or editing an employee.
 * Supports preserving data across steps, validation, and final review.
 */
function EmployeeForm({ isOpen, onClose, onSubmit, employee, clients = [], employeesCount = 0 }) {
  const { activeCompany } = useCompany();
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState(DEFAULT_FORM_DATA);
  const [errors, setErrors] = useState({});
  const modalRef = useRef(null);

  const isEditMode = !!employee;

  useEffect(() => {
    if (isOpen) {
      setCurrentStep(0);
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
    if (isOpen && modalRef.current) {
      modalRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

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

  const handleSubmit = () => {
    onSubmit(formData);
  };

  const isLastStep = currentStep === STEPS.length - 1;

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-labelledby="employee-form-title">
      <div
        ref={modalRef}
        tabIndex="-1"
        className={styles.modal}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <header className={styles.header}>
          <div>
            <h2 id="employee-form-title" className={styles.title}>
              {isEditMode ? 'Edit Employee' : 'Add Employee'}
            </h2>
            <p className={styles.subtitle}>
              Step {currentStep + 1} of {STEPS.length}: {STEPS[currentStep].label}
            </p>
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close form">
            <X size={16} />
          </button>
        </header>

        {/* Stepper Progress */}
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
                    className={`${styles.stepItem} ${styles.stepItemClickable} ${isDone ? styles.stepDone : ''} ${isCurrent ? styles.stepActive : ''}`}
                    onClick={() => {
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

        {/* Step Content */}
        <div className={styles.content}>
          {currentStep === 0 && (
            <PersonalInfoStep data={formData} onChange={handleFormDataChange} errors={errors} />
          )}
          {currentStep === 1 && (
            <EmploymentStep data={formData} onChange={handleFormDataChange} errors={errors} clients={clients} />
          )}
          {currentStep === 2 && (
            <SalaryStructureStep data={formData} onChange={handleFormDataChange} />
          )}
          {currentStep === 3 && (
            <BankDetailsStep data={formData} onChange={handleFormDataChange} errors={errors} />
          )}
          {currentStep === 4 && (
            <AddressFamilyStep data={formData} onChange={handleFormDataChange} />
          )}
          {currentStep === 5 && (
            <DocumentsStep data={formData} onChange={handleFormDataChange} designation={formData.designation} />
          )}
          {currentStep === 6 && (
            <EmployeeReview data={formData} onEditStep={(stepIdx) => setCurrentStep(stepIdx)} />
          )}
        </div>

        {/* Footer Navigation */}
        <footer className={styles.footer}>
          <button className={styles.cancelBtn} onClick={onClose} type="button">
            Cancel
          </button>
          <div className={styles.navButtons}>
            {currentStep > 0 && (
              <button className={styles.backBtn} onClick={handleBack} type="button">
                <ChevronLeft size={16} />
                <span>Back</span>
              </button>
            )}

            {isEditMode ? (
              <>
                {/* Save Changes button on every step for Edit Mode */}
                <button className={styles.submitBtn} onClick={handleSubmit} type="button" title="Save changes">
                  <Check size={16} />
                  <span>Save Changes</span>
                </button>

                {!isLastStep && (
                  <button className={styles.nextBtn} onClick={handleNext} type="button">
                    <span>Continue</span>
                    <ChevronRight size={16} />
                  </button>
                )}
              </>
            ) : (
              <>
                {/* Standard Add Employee flow: Save only on last step, Continue on others */}
                {isLastStep ? (
                  <button className={styles.submitBtn} onClick={handleSubmit} type="button">
                    <Check size={16} />
                    <span>Save Employee</span>
                  </button>
                ) : (
                  <button className={styles.nextBtn} onClick={handleNext} type="button">
                    <span>Continue</span>
                    <ChevronRight size={16} />
                  </button>
                )}
              </>
            )}
          </div>
        </footer>
      </div>
    </div>
  );
}

export default EmployeeForm;
