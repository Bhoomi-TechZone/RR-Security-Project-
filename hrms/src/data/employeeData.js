// NovaSpark HRMS — Mock Employee Data
// Replace with API calls when backend is ready.

export const mockEmployees = [
  {
    // Basic Details (Step 1)
    id: "e001",
    employeeCode: "EMP001",
    employeeId: "EMP001",
    joiningDate: "2025-01-15",
    name: "Rahul Kumar",
    fatherHusbandName: "Rajesh Kumar",
    gender: "Male",
    dob: "1990-05-20",
    mobile: "+91 98765 43210",
    alternateMobile: "+91 98765 43211",
    email: "rahul.kumar@example.com",
    maritalStatus: "Married",
    bloodGroup: "O+",
    employeePhoto: null,
    initials: "RK",
    
    // Employment Details (Step 2)
    companyId: "c001",
    companyName: "ABC Security Services",
    department: "Security",
    designation: "Security Guard",
    siteLocation: "Main Gate",
    dutyPost: "Gate Security",
    shift: "Night",
    reportingSupervisor: "Vikram Singh",
    joiningLocation: "Bareilly",
    previousExperience: "5 years",
    employeeStatus: "Active",
    exitDateReason: null,
    employeeType: "Permanent",
    
    // Salary Details (Step 3)
    salaryType: "Monthly",
    salaryStructureType: "Regular",
    basic: 20000,
    vda: 2000,
    hra: 5000,
    conveyance: 1000,
    specialAllowance: 2000,
    otherAllowance: 0,
    grossSalary: 30000,
    minimumWageCategory: "General",
    overtimeRate: 150,
    bonus: 2500,
    gratuity: 0,
    salaryEffectiveFrom: "2025-01-15",
    
    // Statutory & Bank (Step 4)
    pan: "ABCDE1234F",
    aadhaar: "1234 5678 9012",
    uan: "100123456789",
    esicNo: "21800123456789012",
    pfApplicable: true,
    esiApplicable: true,
    bankName: "State Bank of India",
    accountNumber: "XXXX XXXX 4521",
    ifsc: "SBIN0001234",
    accountHolder: "Rahul Kumar",
    paymentMode: "Bank Transfer",
    
    // Address & Family (Step 5)
    presentAddress: "Civil Lines, Bareilly, Uttar Pradesh 243001",
    permanentAddress: "Village Kumhar, Bareilly, Uttar Pradesh 243001",
    sameAsPresentAddress: false,
    familyMemberName: "Priya Kumar",
    relation: "Spouse",
    dobAge: "1992-08-10",
    address: "Civil Lines, Bareilly, Uttar Pradesh 243001",
    nomineeYesNo: "Yes",
    nomineeSharePercent: "100",
    
    // Documents (Step 6)
    documents: {
      aadhaarCard: { status: "uploaded", date: "2026-01-15", fileName: "aadhaar.pdf" },
      panCard: { status: "uploaded", date: "2026-01-15", fileName: "pan.pdf" },
      bankProof: { status: "uploaded", date: "2026-01-16", fileName: "bank_proof.pdf" },
      addressProof: { status: "uploaded", date: "2026-01-15", fileName: "address.pdf" },
      policeVerification: { status: "uploaded", date: "2026-01-20", fileName: "police_verify.pdf" },
      educationCertificate: { status: "pending", date: null },
      experienceCertificate: { status: "uploaded", date: "2026-01-15", fileName: "experience.pdf" },
      appointmentLetter: { status: "uploaded", date: "2026-01-15", fileName: "offer_letter.pdf" },
      photo: { status: "uploaded", date: "2026-01-15", fileName: "photo.jpg" },
      otherDocuments: { status: "pending", date: null },
      employeeSignature: { status: "uploaded", date: "2026-01-15", fileName: "signature.jpg" },
      hrAdminVerification: { status: "uploaded", date: "2026-01-20", fileName: "verification.pdf" }
    },
    remarks: "Security personnel verified. All documents complete.",
    
    // Legacy fields for display
    contact: "+91 98765 43210",
    photo: null,
    site: "Main Gate",
    status: "active"
  },
  {
    // Basic Details (Step 1)
    id: "e002",
    employeeCode: "EMP002",
    employeeId: "EMP002",
    joiningDate: "2025-03-22",
    name: "Amit Sharma",
    fatherHusbandName: "Ashok Sharma",
    gender: "Male",
    dob: "1988-11-15",
    mobile: "+91 98877 65432",
    alternateMobile: "+91 98877 65433",
    email: "amit.sharma@example.com",
    maritalStatus: "Single",
    bloodGroup: "A+",
    employeePhoto: null,
    initials: "AS",
    
    // Employment Details (Step 2)
    companyId: "c002",
    companyName: "XYZ Facility Management",
    department: "Operations",
    designation: "Supervisor",
    siteLocation: "HQ Office",
    dutyPost: "Operations Supervisor",
    shift: "Day",
    reportingSupervisor: "Manoj Verma",
    joiningLocation: "Noida",
    previousExperience: "8 years",
    employeeStatus: "Active",
    exitDateReason: null,
    employeeType: "Permanent",
    
    // Salary Details (Step 3)
    salaryType: "Monthly",
    salaryStructureType: "Regular",
    basic: 25000,
    vda: 2500,
    hra: 6000,
    conveyance: 1500,
    specialAllowance: 2000,
    otherAllowance: 500,
    grossSalary: 37500,
    minimumWageCategory: "General",
    overtimeRate: 180,
    bonus: 3000,
    gratuity: 0,
    salaryEffectiveFrom: "2025-03-22",
    
    // Statutory & Bank (Step 4)
    pan: "BCDEF2345G",
    aadhaar: "2345 6789 0123",
    uan: "100234567890",
    esicNo: "21800234567890123",
    pfApplicable: true,
    esiApplicable: true,
    bankName: "HDFC Bank",
    accountNumber: "XXXX XXXX 7890",
    ifsc: "HDFC0000123",
    accountHolder: "Amit Sharma",
    paymentMode: "Bank Transfer",
    
    // Address & Family (Step 5)
    presentAddress: "Sector 18, Noida, Uttar Pradesh 201301",
    permanentAddress: "Greater Noida, Uttar Pradesh 201306",
    sameAsPresentAddress: false,
    familyMemberName: "Ravi Sharma",
    relation: "Brother",
    dobAge: "1985-06-25",
    address: "Sector 18, Noida, Uttar Pradesh 201301",
    nomineeYesNo: "Yes",
    nomineeSharePercent: "100",
    
    // Documents (Step 6)
    documents: {
      aadhaarCard: { status: "uploaded", date: "2026-03-22", fileName: "aadhaar.pdf" },
      panCard: { status: "uploaded", date: "2026-03-22", fileName: "pan.pdf" },
      bankProof: { status: "uploaded", date: "2026-03-22", fileName: "bank.pdf" },
      addressProof: { status: "uploaded", date: "2026-03-22", fileName: "address.pdf" },
      policeVerification: { status: "pending", date: null },
      educationCertificate: { status: "uploaded", date: "2026-03-22", fileName: "education.pdf" },
      experienceCertificate: { status: "uploaded", date: "2026-03-22", fileName: "experience.pdf" },
      appointmentLetter: { status: "uploaded", date: "2026-03-22", fileName: "offer.pdf" },
      photo: { status: "uploaded", date: "2026-03-22", fileName: "photo.jpg" },
      otherDocuments: { status: "pending", date: null },
      employeeSignature: { status: "uploaded", date: "2026-03-22", fileName: "signature.jpg" },
      hrAdminVerification: { status: "pending", date: null }
    },
    remarks: "Pending police verification.",
    
    // Legacy fields for display
    contact: "+91 98877 65432",
    photo: null,
    site: "HQ Office",
    status: "active"
  },
  {
    // Basic Details (Step 1)
    id: "e003",
    employeeCode: "EMP003",
    employeeId: "EMP003",
    joiningDate: "2025-11-06",
    name: "Raj Kumar",
    fatherHusbandName: "Ramesh Kumar",
    gender: "Male",
    dob: "1985-03-10",
    mobile: "+91 97654 32109",
    alternateMobile: "+91 97654 32110",
    email: "raj.kumar@example.com",
    maritalStatus: "Married",
    bloodGroup: "B+",
    employeePhoto: null,
    initials: "RK",
    
    // Employment Details (Step 2)
    companyId: "c003",
    companyName: "PQR Housekeeping Pvt Ltd",
    department: "Housekeeping",
    designation: "Supervisor",
    siteLocation: "Zone A",
    dutyPost: "Housekeeping Supervisor",
    shift: "Day",
    reportingSupervisor: "Deepak Gupta",
    joiningLocation: "Indore",
    previousExperience: "10 years",
    employeeStatus: "Active",
    exitDateReason: null,
    employeeType: "Permanent",
    
    // Salary Details (Step 3)
    salaryType: "Monthly",
    salaryStructureType: "Regular",
    basic: 18000,
    vda: 1800,
    hra: 4500,
    conveyance: 1000,
    specialAllowance: 1500,
    otherAllowance: 0,
    grossSalary: 26800,
    minimumWageCategory: "General",
    overtimeRate: 120,
    bonus: 2000,
    gratuity: 0,
    salaryEffectiveFrom: "2025-11-06",
    
    // Statutory & Bank (Step 4)
    pan: "CDEFG3456H",
    aadhaar: "3456 7890 1234",
    uan: "100345678901",
    esicNo: "21800345678901234",
    pfApplicable: true,
    esiApplicable: true,
    bankName: "ICICI Bank",
    accountNumber: "XXXX XXXX 3456",
    ifsc: "ICIC0000456",
    accountHolder: "Raj Kumar",
    paymentMode: "Bank Transfer",
    
    // Address & Family (Step 5)
    presentAddress: "MG Road, Indore, Madhya Pradesh 452001",
    permanentAddress: "Ujjain, Madhya Pradesh 456010",
    sameAsPresentAddress: false,
    familyMemberName: "Sunita Kumar",
    relation: "Spouse",
    dobAge: "1987-09-18",
    address: "MG Road, Indore, Madhya Pradesh 452001",
    nomineeYesNo: "Yes",
    nomineeSharePercent: "100",
    
    // Documents (Step 6)
    documents: {
      aadhaarCard: { status: "uploaded", date: "2025-11-06", fileName: "aadhaar.pdf" },
      panCard: { status: "uploaded", date: "2025-11-06", fileName: "pan.pdf" },
      bankProof: { status: "uploaded", date: "2025-11-06", fileName: "bank.pdf" },
      addressProof: { status: "pending", date: null },
      policeVerification: { status: "pending", date: null },
      educationCertificate: { status: "uploaded", date: "2025-11-06", fileName: "education.pdf" },
      experienceCertificate: { status: "uploaded", date: "2025-11-06", fileName: "experience.pdf" },
      appointmentLetter: { status: "uploaded", date: "2025-11-06", fileName: "offer.pdf" },
      photo: { status: "uploaded", date: "2025-11-06", fileName: "photo.jpg" },
      otherDocuments: { status: "pending", date: null },
      employeeSignature: { status: "uploaded", date: "2025-11-06", fileName: "signature.jpg" },
      hrAdminVerification: { status: "pending", date: null }
    },
    remarks: "Housekeeping staff. Pending address proof.",
    
    // Legacy fields for display
    contact: "+91 97654 32109",
    photo: null,
    site: "Zone A",
    status: "active"
  },
  {
    id: "e004",
    employeeCode: "EMP004",
    employeeId: "EMP004",
    joiningDate: "2025-08-16",
    name: "Manoj Verma",
    fatherHusbandName: "Virendra Verma",
    gender: "Male",
    dob: "1987-12-05",
    mobile: "+91 96543 21098",
    alternateMobile: "+91 96543 21099",
    email: "manoj.verma@example.com",
    maritalStatus: "Married",
    bloodGroup: "O-",
    employeePhoto: null,
    initials: "MV",
    companyId: "c004",
    companyName: "Suraksha Security Corp",
    department: "Security",
    designation: "Security Guard",
    siteLocation: "North Checkpost",
    dutyPost: "Perimeter Security",
    shift: "Night",
    reportingSupervisor: "Vikram Singh",
    joiningLocation: "Bhopal",
    previousExperience: "6 years",
    employeeStatus: "Active",
    exitDateReason: null,
    employeeType: "Permanent",
    salaryType: "Monthly",
    salaryStructureType: "Regular",
    basic: 20000,
    vda: 2000,
    hra: 5000,
    conveyance: 1000,
    specialAllowance: 2000,
    otherAllowance: 0,
    grossSalary: 30000,
    minimumWageCategory: "General",
    overtimeRate: 150,
    bonus: 2500,
    gratuity: 0,
    salaryEffectiveFrom: "2025-08-16",
    pan: "DEFGH4567I",
    aadhaar: "4567 8901 2345",
    uan: "100456789012",
    esicNo: "21800456789012345",
    pfApplicable: true,
    esiApplicable: true,
    bankName: "Punjab National Bank",
    accountNumber: "XXXX XXXX 9012",
    ifsc: "PUNB0000789",
    accountHolder: "Manoj Verma",
    paymentMode: "Bank Transfer",
    presentAddress: "Ring Road, Bhopal, Madhya Pradesh 462001",
    permanentAddress: "Village Vidisha, Madhya Pradesh 464228",
    sameAsPresentAddress: false,
    familyMemberName: "Geeta Verma",
    relation: "Spouse",
    dobAge: "1990-03-22",
    address: "Ring Road, Bhopal, Madhya Pradesh 462001",
    nomineeYesNo: "Yes",
    nomineeSharePercent: "100",
    documents: {
      aadhaarCard: { status: "uploaded", date: "2025-08-16", fileName: "aadhaar.pdf" },
      panCard: { status: "uploaded", date: "2025-08-16", fileName: "pan.pdf" },
      bankProof: { status: "uploaded", date: "2025-08-16", fileName: "bank.pdf" },
      addressProof: { status: "uploaded", date: "2025-08-16", fileName: "address.pdf" },
      policeVerification: { status: "uploaded", date: "2025-08-20", fileName: "police.pdf" },
      educationCertificate: { status: "pending", date: null },
      experienceCertificate: { status: "uploaded", date: "2025-08-16", fileName: "experience.pdf" },
      appointmentLetter: { status: "uploaded", date: "2025-08-16", fileName: "offer.pdf" },
      photo: { status: "uploaded", date: "2025-08-16", fileName: "photo.jpg" },
      otherDocuments: { status: "pending", date: null },
      employeeSignature: { status: "uploaded", date: "2025-08-16", fileName: "signature.jpg" },
      hrAdminVerification: { status: "uploaded", date: "2025-08-20", fileName: "verification.pdf" }
    },
    remarks: "Security staff. All verification complete.",
    contact: "+91 96543 21098",
    photo: null,
    site: "North Checkpost",
    status: "active"
  },
  {
    id: "e005",
    employeeId: "EMP005",
    name: "Priya Nair",
    initials: "PN",
    photo: null,
    contact: "+91 95432 10987",
    address: "IT Park, Pune, Maharashtra 411014",
    companyId: "c005",
    companyName: "Greenfield Services Ltd",
    department: "Administration",
    designation: "Admin",
    site: "Main Block",
    documents: {
      aadhaar: { status: "uploaded", date: "2026-04-02" },
      pan: { status: "uploaded", date: "2026-04-02" },
      idProof: { status: "uploaded", date: "2026-04-02" },
      photo: { status: "uploaded", date: "2026-04-02" },
      policeVerification: { status: "pending", date: null }
    },
    bankDetails: {
      bank: "Axis Bank",
      accountNumber: "XXXX XXXX 1234",
      ifsc: "UTIB0000222",
      accountHolder: "Priya Nair"
    },
    salaryStructure: {
      basic: 30000,
      hra: 8000,
      allowances: 5000,
      overtimeRate: 200,
      deductions: 3000
    },
    status: "active"
  },
  {
    id: "e006",
    employeeId: "EMP006",
    name: "Vikram Singh",
    initials: "VS",
    photo: null,
    contact: "+91 94321 09876",
    address: "Andheri West, Mumbai, Maharashtra 400053",
    companyId: "c006",
    companyName: "SafeGuard Protection Ltd",
    department: "Security",
    designation: "Security Guard",
    site: "Main Gate",
    documents: {
      aadhaar: { status: "uploaded", date: "2025-06-11" },
      pan: { status: "uploaded", date: "2025-06-11" },
      idProof: { status: "uploaded", date: "2025-06-11" },
      photo: { status: "uploaded", date: "2025-06-11" },
      policeVerification: { status: "uploaded", date: "2025-06-15" }
    },
    bankDetails: {
      bank: "State Bank of India",
      accountNumber: "XXXX XXXX 5678",
      ifsc: "SBIN0000999",
      accountHolder: "Vikram Singh"
    },
    salaryStructure: {
      basic: 21000,
      hra: 5200,
      allowances: 3100,
      overtimeRate: 160,
      deductions: 2100
    },
    status: "inactive"
  },
  {
    id: "e007",
    employeeId: "EMP007",
    name: "Deepak Gupta",
    initials: "DG",
    photo: null,
    contact: "+91 93210 98765",
    address: "Connaught Place, New Delhi 110001",
    companyId: "c007",
    companyName: "Bharat Workforce Solutions",
    department: "Operations",
    designation: "Supervisor",
    site: "Client Site A",
    documents: {
      aadhaar: { status: "uploaded", date: "2026-03-01" },
      pan: { status: "uploaded", date: "2026-03-01" },
      idProof: { status: "uploaded", date: "2026-03-02" },
      photo: { status: "uploaded", date: "2026-03-01" },
      policeVerification: { status: "pending", date: null }
    },
    bankDetails: {
      bank: "Kotak Mahindra Bank",
      accountNumber: "XXXX XXXX 6789",
      ifsc: "KKBK0000111",
      accountHolder: "Deepak Gupta"
    },
    salaryStructure: {
      basic: 26000,
      hra: 6500,
      allowances: 4500,
      overtimeRate: 190,
      deductions: 2600
    },
    status: "active"
  },
  {
    id: "e008",
    employeeId: "EMP008",
    name: "Sunita Yadav",
    initials: "SY",
    photo: null,
    contact: "+91 92109 87654",
    address: "Gomti Nagar, Lucknow, Uttar Pradesh 226010",
    companyId: "c008",
    companyName: "Apex Cleaning Services",
    department: "Housekeeping",
    designation: "Supervisor",
    site: "South Sector",
    documents: {
      aadhaar: { status: "uploaded", date: "2025-12-16" },
      pan: { status: "pending", date: null },
      idProof: { status: "uploaded", date: "2025-12-16" },
      photo: { status: "uploaded", date: "2025-12-16" },
      policeVerification: { status: "pending", date: null }
    },
    bankDetails: {
      bank: "Bank of Baroda",
      accountNumber: "XXXX XXXX 2345",
      ifsc: "BARB0GOMTIN",
      accountHolder: "Sunita Yadav"
    },
    salaryStructure: {
      basic: 18500,
      hra: 4600,
      allowances: 2600,
      overtimeRate: 130,
      deductions: 1850
    },
    status: "active"
  },
  {
    id: "e009",
    employeeId: "EMP009",
    name: "Ravi Joshi",
    initials: "RJ",
    photo: null,
    contact: "+91 91098 76543",
    address: "Koregaon Park, Pune, Maharashtra 411001",
    companyId: "c009",
    companyName: "NexGen Facility Corp",
    department: "Administration",
    designation: "Admin",
    site: "East Wing",
    documents: {
      aadhaar: { status: "uploaded", date: "2026-05-02" },
      pan: { status: "uploaded", date: "2026-05-02" },
      idProof: { status: "uploaded", date: "2026-05-02" },
      photo: { status: "uploaded", date: "2026-05-02" },
      policeVerification: { status: "pending", date: null }
    },
    bankDetails: {
      bank: "HDFC Bank",
      accountNumber: "XXXX XXXX 3456",
      ifsc: "HDFC0000456",
      accountHolder: "Ravi Joshi"
    },
    salaryStructure: {
      basic: 31000,
      hra: 8200,
      allowances: 5200,
      overtimeRate: 210,
      deductions: 3100
    },
    status: "active"
  },
  {
    id: "e010",
    employeeId: "EMP010",
    name: "Kavita Meena",
    initials: "KM",
    photo: null,
    contact: "+91 90987 65432",
    address: "Malviya Nagar, Jaipur, Rajasthan 302017",
    companyId: "c010",
    companyName: "Sterling Security Pvt Ltd",
    department: "Security",
    designation: "Security Guard",
    site: "Patrol Gate 3",
    documents: {
      aadhaar: { status: "uploaded", date: "2025-09-23" },
      pan: { status: "uploaded", date: "2025-09-23" },
      idProof: { status: "uploaded", date: "2025-09-23" },
      photo: { status: "uploaded", date: "2025-09-23" },
      policeVerification: { status: "uploaded", date: "2025-09-27" }
    },
    bankDetails: {
      bank: "State Bank of India",
      accountNumber: "XXXX XXXX 4567",
      ifsc: "SBIN0000789",
      accountHolder: "Kavita Meena"
    },
    salaryStructure: {
      basic: 20000,
      hra: 5000,
      allowances: 3000,
      overtimeRate: 150,
      deductions: 2000
    },
    status: "active"
  },
  {
    id: "e011",
    employeeId: "EMP011",
    name: "Anand Patel",
    initials: "AP",
    photo: null,
    contact: "+91 89876 54321",
    address: "Satellite Area, Ahmedabad, Gujarat 380015",
    companyId: "c011",
    companyName: "Reliable Manpower Agency",
    department: "Operations",
    designation: "Supervisor",
    site: "Main Plant",
    documents: {
      aadhaar: { status: "uploaded", date: "2026-02-01" },
      pan: { status: "uploaded", date: "2026-02-01" },
      idProof: { status: "uploaded", date: "2026-02-01" },
      photo: { status: "uploaded", date: "2026-02-01" },
      policeVerification: { status: "pending", date: null }
    },
    bankDetails: {
      bank: "ICICI Bank",
      accountNumber: "XXXX XXXX 5678",
      ifsc: "ICIC0000123",
      accountHolder: "Anand Patel"
    },
    salaryStructure: {
      basic: 27000,
      hra: 6800,
      allowances: 4800,
      overtimeRate: 200,
      deductions: 2700
    },
    status: "inactive"
  },
  {
    id: "e012",
    employeeId: "EMP012",
    name: "Srinivas Rao",
    initials: "SR",
    photo: null,
    contact: "+91 88765 43210",
    address: "Jubilee Hills, Hyderabad, Telangana 500033",
    companyId: "c012",
    companyName: "VIP Security & Escorts",
    department: "Security",
    designation: "Supervisor",
    site: "VIP Lounge",
    documents: {
      aadhaar: { status: "uploaded", date: "2025-10-09" },
      pan: { status: "uploaded", date: "2025-10-09" },
      idProof: { status: "uploaded", date: "2025-10-09" },
      photo: { status: "uploaded", date: "2025-10-09" },
      policeVerification: { status: "uploaded", date: "2025-10-14" }
    },
    bankDetails: {
      bank: "HDFC Bank",
      accountNumber: "XXXX XXXX 6789",
      ifsc: "HDFC0000999",
      accountHolder: "Srinivas Rao"
    },
    salaryStructure: {
      basic: 28000,
      hra: 7000,
      allowances: 4600,
      overtimeRate: 200,
      deductions: 2800
    },
    status: "active"
  },
  {
    id: "e013",
    employeeId: "EMP013",
    name: "Nilesh Desai",
    initials: "ND",
    photo: null,
    contact: "+91 87654 32109",
    address: "MIDC, Nagpur, Maharashtra 440016",
    companyId: "c013",
    companyName: "SwiftClean Solutions",
    department: "Housekeeping",
    designation: "Supervisor",
    site: "Building B",
    documents: {
      aadhaar: { status: "uploaded", date: "2026-03-06" },
      pan: { status: "uploaded", date: "2026-03-06" },
      idProof: { status: "uploaded", date: "2026-03-06" },
      photo: { status: "uploaded", date: "2026-03-06" },
      policeVerification: { status: "pending", date: null }
    },
    bankDetails: {
      bank: "Bank of India",
      accountNumber: "XXXX XXXX 7890",
      ifsc: "BKID0000888",
      accountHolder: "Nilesh Desai"
    },
    salaryStructure: {
      basic: 19000,
      hra: 4700,
      allowances: 2700,
      overtimeRate: 140,
      deductions: 1900
    },
    status: "inactive"
  },
  {
    id: "e014",
    employeeId: "EMP014",
    name: "Karthik Reddy",
    initials: "KR",
    photo: null,
    contact: "+91 86543 21098",
    address: "HSR Layout, Bengaluru, Karnataka 560102",
    companyId: "c014",
    companyName: "Horizon Guard Services",
    department: "Security",
    designation: "Security Guard",
    site: "Main Lobby",
    documents: {
      aadhaar: { status: "uploaded", date: "2025-07-20" },
      pan: { status: "uploaded", date: "2025-07-20" },
      idProof: { status: "uploaded", date: "2025-07-20" },
      photo: { status: "uploaded", date: "2025-07-20" },
      policeVerification: { status: "uploaded", date: "2025-07-25" }
    },
    bankDetails: {
      bank: "Canara Bank",
      accountNumber: "XXXX XXXX 8901",
      ifsc: "CNRB0000222",
      accountHolder: "Karthik Reddy"
    },
    salaryStructure: {
      basic: 20500,
      hra: 5100,
      allowances: 3100,
      overtimeRate: 155,
      deductions: 2050
    },
    status: "active"
  },
  {
    id: "e015",
    employeeId: "EMP015",
    name: "Vikrant Patil",
    initials: "VP",
    photo: null,
    contact: "+91 91234 56789",
    address: "Kothrud, Pune, Maharashtra 411038",
    companyId: "c005",
    companyName: "Greenfield Services Ltd",
    department: "Operations",
    designation: "Supervisor",
    site: "Warehouse A",
    documents: {
      aadhaar: { status: "uploaded", date: "2026-04-05" },
      pan: { status: "uploaded", date: "2026-04-05" },
      idProof: { status: "uploaded", date: "2026-04-06" },
      photo: { status: "uploaded", date: "2026-04-05" },
      policeVerification: { status: "pending", date: null }
    },
    bankDetails: {
      bank: "State Bank of India",
      accountNumber: "XXXX XXXX 9012",
      ifsc: "SBIN0000111",
      accountHolder: "Vikrant Patil"
    },
    salaryStructure: {
      basic: 24000,
      hra: 5800,
      allowances: 3800,
      overtimeRate: 170,
      deductions: 2400
    },
    status: "active"
  }
];

export const mockDepartments = [
  "Security",
  "Operations",
  "Housekeeping",
  "Administration",
  "Finance",
  "HR",
  "IT Support",
  "Maintenance"
];

export const mockDesignations = [
  "Security Guard",
  "Supervisor",
  "Manager",
  "Admin",
  "Accountant",
  "HR Executive",
  "IT Support",
  "Maintenance Technician",
  "Director"
];
