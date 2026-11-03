// ============================================================================
// NovaSpark HRMS - Recruitment Store & Service (Status-Driven Pipeline)
// Candidate lifecycle is driven directly by Status:
// Applied -> Selected / Shortlisted -> Moved to Onboarding
// (No interview round pipeline)
// ============================================================================

export const JOB_CATEGORIES = [
  'Security',
  'Housekeeping',
  'Supervisor',
  'Office Staff',
  'Gunman / Armed Guard',
  'Driver',
  'Other'
];

export const RECRUITMENT_SOURCES = [
  'Walk-in',
  'WhatsApp',
  'Email',
  'Website',
  'Reference',
  'Job Portal',
  'Other'
];

export const SKILL_OPTIONS = [
  'CCTV Surveillance',
  'Fire Safety & Fire Fighting Drill',
  'First Aid Certified',
  'Gate Access & Frisking',
  'Visitor Log & Register Keeping',
  'Arms / Weapon Handling (Licensed)',
  'Crowd Control & VIP Escort',
  'Physical Fitness & Turnout',
  'Basic English Speaking',
  'Basic Computer & Excel Entry',
  'Two Wheeler License',
  'Heavy / LMV Driving License',
  'Housekeeping Chemicals Handling',
];

export const CANDIDATE_STATUSES = [
  { id: 'all', label: 'All Candidates', color: '#64748b' },
  { id: 'applied', label: 'Applied', color: '#3b82f6' },
  { id: 'selected', label: 'Selected', color: '#10b981' },
  { id: 'on_hold', label: 'On Hold', color: '#ec4899' },
  { id: 'rejected', label: 'Rejected', color: '#ef4444' },
  { id: 'moved_to_onboarding', label: 'Moved to Onboarding', color: '#06b6d4' },
];

export const INITIAL_CANDIDATES = [
  {
    id: 'CAN-2026-001',
    name: 'Surender Singh Tomar',
    mobile: '9876543210',
    altMobile: '9811223344',
    whatsapp: '9876543210',
    email: 'surender.tomar@gmail.com',
    address: 'H.No 142, Gali No 4, Mamura Village, Sector 66',
    city: 'Noida',
    state: 'Uttar Pradesh',
    pincode: '201301',
    jobCategory: 'Security Guard',
    appliedFor: 'Security Guard',
    experience: 'Experienced',
    totalExperienceYears: 3,
    lastCompany: 'G4S Secure Solutions India Pvt Ltd',
    lastSalary: 16500,
    expectedSalary: 19000,
    minExpectedSalary: 18000,
    maxExpectedSalary: 20500,
    preferredLocation: 'Noida Sector 62 / Greater Noida Industrial Area',
    resumeUrl: 'Resume_Surender_Singh_Tomar.pdf',
    resumeSize: '1.2 MB',
    photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    skills: ['CCTV Surveillance', 'Fire Safety & Fire Fighting Drill', 'Gate Access & Frisking'],
    source: 'Walk-in',
    registrationDate: '2026-11-01',
    remarks: 'Turnout is sharp, clear Hindi & basic English speech. Aadhaar and 10th certificate verified physically.',
    status: 'selected',
  },
  {
    id: 'CAN-2026-002',
    name: 'Balwant Singh Rathore',
    mobile: '9810987654',
    altMobile: '9414012345',
    whatsapp: '9810987654',
    email: 'balwant.rathore@outlook.com',
    address: 'Vill. Badshahpur, Sohna Road',
    city: 'Gurugram',
    state: 'Haryana',
    pincode: '122018',
    jobCategory: 'Gunman / Armed Guard',
    appliedFor: 'Armed Security Guard',
    experience: 'Experienced',
    totalExperienceYears: 7,
    lastCompany: 'SIS India Limited (Cash Logistics & Bank)',
    lastSalary: 22000,
    expectedSalary: 26000,
    minExpectedSalary: 24000,
    maxExpectedSalary: 27000,
    preferredLocation: 'Gurugram Cyber Hub / Golf Course Road',
    resumeUrl: 'Armed_Guard_Balwant_Singh_Resume.pdf',
    resumeSize: '840 KB',
    photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    skills: ['Arms / Weapon Handling (Licensed)', 'Gate Access & Frisking', 'First Aid Certified'],
    source: 'Reference',
    registrationDate: '2026-11-02',
    remarks: 'Holds valid all-India DBBL 12-Bore Arms License valid till 2028. Ex-Army (Rajputana Rifles).',
    status: 'applied',
  },
  {
    id: 'CAN-2026-003',
    name: 'Rameshwar Dayal',
    mobile: '9711224466',
    altMobile: '',
    whatsapp: '9711224466',
    email: 'rameshwardayal99@gmail.com',
    address: 'Near Old Bus Stand, Dadri',
    city: 'Greater Noida',
    state: 'Uttar Pradesh',
    pincode: '203207',
    jobCategory: 'Field Supervisor',
    appliedFor: 'Field Supervisor',
    experience: 'Experienced',
    totalExperienceYears: 5,
    lastCompany: 'Peregrine Guarding Pvt Ltd',
    lastSalary: 21000,
    expectedSalary: 25000,
    minExpectedSalary: 23500,
    maxExpectedSalary: 26000,
    preferredLocation: 'Greater Noida West / TechZone 4',
    resumeUrl: 'Rameshwar_Supervisor_CV.docx',
    resumeSize: '512 KB',
    photo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
    skills: ['Gate Access & Frisking', 'Visitor Log & Register Keeping', 'Two Wheeler License'],
    source: 'Walk-in',
    registrationDate: '2026-11-02',
    remarks: 'Has personal bike with DL. Can supervise night shift rounds across 6 client sites.',
    status: 'selected',
  },
  {
    id: 'CAN-2026-004',
    name: 'Sunita Devi',
    mobile: '9654321987',
    altMobile: '9873216540',
    whatsapp: '9654321987',
    email: '',
    address: 'Khora Colony, Near Primary School',
    city: 'Ghaziabad',
    state: 'Uttar Pradesh',
    pincode: '201020',
    jobCategory: 'Housekeeping Staff',
    appliedFor: 'Housekeeping Attendant',
    experience: 'Fresher',
    totalExperienceYears: 0,
    lastCompany: '',
    lastSalary: 0,
    expectedSalary: 14500,
    minExpectedSalary: 13500,
    maxExpectedSalary: 15500,
    preferredLocation: 'Noida Sector 59 / Sector 63',
    resumeUrl: '',
    resumeSize: '',
    photo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    skills: ['Housekeeping Chemicals Handling'],
    source: 'Reference',
    registrationDate: '2026-11-03',
    remarks: 'Punctual, polite demeanor. Husband works in housekeeping in Sector 63.',
    status: 'applied',
  },
  {
    id: 'CAN-2026-005',
    name: 'Amit Kumar Verma',
    mobile: '9988776655',
    altMobile: '9876501234',
    whatsapp: '9988776655',
    email: 'amit.verma.ops@gmail.com',
    address: 'Plot 45, Govindpuram',
    city: 'Ghaziabad',
    state: 'Uttar Pradesh',
    pincode: '201013',
    jobCategory: 'CCTV / Control Room Operator',
    appliedFor: 'Control Room Surveillance Executive',
    experience: 'Experienced',
    totalExperienceYears: 4,
    lastCompany: 'Securitas India Pvt Ltd',
    lastSalary: 19500,
    expectedSalary: 23000,
    minExpectedSalary: 21500,
    maxExpectedSalary: 24000,
    preferredLocation: 'Okhla Industrial Area Phase 3 / Delhi NCR',
    resumeUrl: 'Amit_Kumar_CCTV_Surveillance_Resume.pdf',
    resumeSize: '1.5 MB',
    photo: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
    skills: ['CCTV Surveillance', 'Basic Computer & Excel Entry', 'Fire Safety & Fire Fighting Drill'],
    source: 'Website',
    registrationDate: '2026-10-30',
    remarks: 'Expert in Hikvision & Dahua NVR playback, incident logging, and gate barrier integration.',
    status: 'moved_to_onboarding',
  }
];

const LOCAL_STORAGE_KEY = 'novaspark_recruitment_candidates_v3';

export const getStoredCandidates = () => {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(INITIAL_CANDIDATES));
      return INITIAL_CANDIDATES;
    }
    const parsed = JSON.parse(raw);
    let migrated = false;
    const cleanList = parsed.map((c) => {
      // Migrate old interview round statuses
      if (c.status === 'interview_inprogress' || c.status === 'interview_scheduled') {
        migrated = true;
        return { ...c, status: c.id === 'CAN-2026-003' ? 'selected' : 'applied' };
      }
      return c;
    });
    if (migrated) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(cleanList));
    }
    return cleanList;
  } catch (e) {
    console.error('Error loading candidates from storage:', e);
    return INITIAL_CANDIDATES;
  }
};

export const saveStoredCandidates = (candidates) => {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(candidates));
    window.dispatchEvent(new CustomEvent('recruitment-data-updated'));
  } catch (e) {
    console.error('Error saving candidates to storage:', e);
  }
};

export const generateNextCandidateId = () => {
  const currentList = getStoredCandidates();
  const year = new Date().getFullYear();
  const prefix = `CAN-${year}-`;
  const existingNums = currentList
    .map((c) => {
      if (c.id && c.id.startsWith(prefix)) {
        const numPart = parseInt(c.id.replace(prefix, ''), 10);
        return isNaN(numPart) ? 0 : numPart;
      }
      return 0;
    })
    .filter((n) => n > 0);

  const maxNum = existingNums.length > 0 ? Math.max(...existingNums) : 0;
  const nextNum = String(maxNum + 1).padStart(3, '0');
  return `${prefix}${nextNum}`;
};

export const addCandidate = (candidateData) => {
  const currentList = getStoredCandidates();
  const newCandidate = {
    ...candidateData,
    id: candidateData.id || generateNextCandidateId(),
    registrationDate: candidateData.registrationDate || new Date().toISOString().split('T')[0],
    status: candidateData.status || 'applied',
    createdAt: new Date().toISOString(),
  };

  const updated = [newCandidate, ...currentList];
  saveStoredCandidates(updated);
  return newCandidate;
};

export const updateCandidateStatus = (candidateId, newStatus) => {
  const currentList = getStoredCandidates();
  const updated = currentList.map((c) =>
    c.id === candidateId ? { ...c, status: newStatus } : c
  );
  saveStoredCandidates(updated);
  return updated.find((c) => c.id === candidateId);
};

export const updateCandidate = (candidateId, updatedData) => {
  const currentList = getStoredCandidates();
  const updated = currentList.map((c) =>
    c.id === candidateId ? { ...c, ...updatedData } : c
  );
  saveStoredCandidates(updated);
  return updated.find((c) => c.id === candidateId);
};

export const deleteCandidate = (candidateId) => {
  const currentList = getStoredCandidates();
  const updated = currentList.filter((c) => c.id !== candidateId);
  saveStoredCandidates(updated);
  return true;
};
