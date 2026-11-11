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

import candidateService from '../services/candidateService';

export const PRIMARY_COMPANY_ID = 'RRS8392014SEC';

/**
 * Resolve active company identifier for multi-tenant candidate isolation
 */
export const getActiveCompanyId = (passedCompanyId) => {
  if (passedCompanyId && typeof passedCompanyId === 'string' && passedCompanyId.trim()) {
    return passedCompanyId.trim();
  }
  if (typeof window !== 'undefined') {
    return localStorage.getItem('novaspark_active_company_id') || PRIMARY_COMPANY_ID;
  }
  return PRIMARY_COMPANY_ID;
};

export const getCompanyCandidatesKey = (companyId) => {
  const cId = getActiveCompanyId(companyId);
  return `novaspark_recruitment_candidates_${cId}`;
};

/**
 * Get stored candidates strictly isolated per company profile
 */
export const getStoredCandidates = (companyId) => {
  try {
    const activeId = getActiveCompanyId(companyId);
    const key = getCompanyCandidatesKey(activeId);
    const raw = localStorage.getItem(key);

    if (!raw) {
      // If primary company, seed initial sample candidates tagged with its company ID
      if (activeId === PRIMARY_COMPANY_ID || activeId === 'comp_rr_security' || activeId.toLowerCase().includes('rr')) {
        const seeded = INITIAL_CANDIDATES.map((c) => ({
          ...c,
          companyId: activeId
        }));
        localStorage.setItem(key, JSON.stringify(seeded));
        return seeded;
      }
      // Any other company starts completely clean with 0 candidates
      localStorage.setItem(key, JSON.stringify([]));
      return [];
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    let migrated = false;
    const cleanList = parsed.map((c) => {
      let candidate = { ...c, companyId: c.companyId || activeId };
      if (c.status === 'interview_inprogress' || c.status === 'interview_scheduled') {
        migrated = true;
        candidate.status = c.id === 'CAN-2026-003' ? 'selected' : 'applied';
      }
      return candidate;
    });

    if (migrated) {
      localStorage.setItem(key, JSON.stringify(cleanList));
    }
    return cleanList;
  } catch (e) {
    console.error('Error loading candidates from storage:', e);
    return [];
  }
};

/**
 * Save candidates isolated to the active company profile
 */
export const saveStoredCandidates = (candidates, companyId, broadcast = true) => {
  try {
    const activeId = getActiveCompanyId(companyId);
    const key = getCompanyCandidatesKey(activeId);
    const listWithCompany = (candidates || []).map((c) => ({
      ...c,
      companyId: c.companyId || activeId
    }));
    localStorage.setItem(key, JSON.stringify(listWithCompany));
    if (broadcast) {
      window.dispatchEvent(
        new CustomEvent('recruitment-data-updated', { detail: { companyId: activeId } })
      );
    }
  } catch (e) {
    console.error('Error saving candidates to storage:', e);
  }
};

/**
 * Fetch candidates from Backend MongoDB and update local company cache
 */
export const fetchCompanyCandidates = async (companyId) => {
  const activeId = getActiveCompanyId(companyId);
  try {
    const candidates = await candidateService.getCandidates(activeId);
    if (Array.isArray(candidates)) {
      // Do NOT broadcast on fetch to prevent infinite event loop
      saveStoredCandidates(candidates, activeId, false);
      return candidates;
    }
  } catch (err) {
    console.warn(`[Recruitment] Backend fetch error for company ${activeId}:`, err);
  }
  return getStoredCandidates(activeId);
};

/**
 * Generate sequential candidate ID per company (CAN-YYYY-001, etc.)
 */
export const generateNextCandidateId = (companyId) => {
  const activeId = getActiveCompanyId(companyId);
  const currentList = getStoredCandidates(activeId);
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

/**
 * Add a new candidate isolated to the company (Dynamically saved to MongoDB)
 */
export const addCandidate = async (candidateData, companyId) => {
  const activeId = getActiveCompanyId(companyId || candidateData?.companyId);
  const currentList = getStoredCandidates(activeId);

  const payload = {
    ...candidateData,
    companyId: activeId,
    id: candidateData.id || generateNextCandidateId(activeId),
    registrationDate: candidateData.registrationDate || new Date().toISOString().split('T')[0],
    status: candidateData.status || 'applied',
    createdAt: new Date().toISOString()
  };

  try {
    const liveCandidate = await candidateService.createCandidate(payload, activeId);
    if (liveCandidate) {
      const updated = [liveCandidate, ...currentList.filter((c) => c.id !== liveCandidate.id)];
      saveStoredCandidates(updated, activeId);
      return liveCandidate;
    }
  } catch (err) {
    console.warn('[Recruitment] Backend save failed, caching locally:', err.message);
  }

  const updated = [payload, ...currentList];
  saveStoredCandidates(updated, activeId);
  return payload;
};

/**
 * Update candidate status isolated to the company (Dynamically saved to MongoDB)
 */
export const updateCandidateStatus = async (candidateId, newStatus, companyId) => {
  const activeId = getActiveCompanyId(companyId);
  const currentList = getStoredCandidates(activeId);

  try {
    const liveCandidate = await candidateService.updateCandidateStatus(candidateId, newStatus, activeId);
    if (liveCandidate) {
      const updated = currentList.map((c) => (c.id === candidateId ? liveCandidate : c));
      saveStoredCandidates(updated, activeId);
      return liveCandidate;
    }
  } catch (err) {
    console.warn('[Recruitment] Backend status update failed:', err.message);
  }

  const updated = currentList.map((c) =>
    c.id === candidateId ? { ...c, status: newStatus } : c
  );
  saveStoredCandidates(updated, activeId);
  return updated.find((c) => c.id === candidateId);
};

/**
 * Update candidate details isolated to the company (Dynamically saved to MongoDB)
 */
export const updateCandidate = async (candidateId, updatedData, companyId) => {
  const activeId = getActiveCompanyId(companyId || updatedData?.companyId);
  const currentList = getStoredCandidates(activeId);

  try {
    const liveCandidate = await candidateService.updateCandidate(candidateId, updatedData, activeId);
    if (liveCandidate) {
      const updated = currentList.map((c) => (c.id === candidateId ? liveCandidate : c));
      saveStoredCandidates(updated, activeId);
      return liveCandidate;
    }
  } catch (err) {
    console.warn('[Recruitment] Backend update failed:', err.message);
  }

  const updated = currentList.map((c) =>
    c.id === candidateId ? { ...c, ...updatedData, companyId: activeId } : c
  );
  saveStoredCandidates(updated, activeId);
  return updated.find((c) => c.id === candidateId);
};

/**
 * Delete candidate isolated to the company (Dynamically deleted from MongoDB)
 */
export const deleteCandidate = async (candidateId, companyId) => {
  const activeId = getActiveCompanyId(companyId);
  const currentList = getStoredCandidates(activeId);

  try {
    await candidateService.deleteCandidate(candidateId, activeId);
  } catch (err) {
    console.warn('[Recruitment] Backend delete failed:', err.message);
  }

  const updated = currentList.filter((c) => c.id !== candidateId);
  saveStoredCandidates(updated, activeId);
  return true;
};
