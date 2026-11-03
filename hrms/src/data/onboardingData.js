// ============================================================================
// NovaSpark HRMS - Onboarding Pipeline Store & Service
// Tracks selected candidates through document verification, uniform sizing,
// site deployment, and final conversion to permanent employee
// ============================================================================

export const ONBOARDING_STAGES = [
  { id: 'all', label: 'All in Onboarding', color: '#64748b' },
  { id: 'offer_accepted', label: 'Offer Accepted / Pre-joining', color: '#3b82f6' },
  { id: 'document_verification', label: 'Document Verification', color: '#8b5cf6' },
  { id: 'uniform_allocation', label: 'Uniform & Kit Allocation', color: '#f59e0b' },
  { id: 'ready_to_deploy', label: 'Ready for Deployment', color: '#10b981' },
  { id: 'completed', label: 'Converted to Employee', color: '#06b6d4' },
];

export const UNIFORM_SHIRT_SIZES = ['S (38)', 'M (40)', 'L (42)', 'XL (44)', 'XXL (46)'];
export const UNIFORM_TROUSER_SIZES = ['28', '30', '32', '34', '36', '38', '40'];
export const BOOT_SIZES = ['6', '7', '8', '9', '10', '11'];

export const INITIAL_ONBOARDING_CANDIDATES = [
  {
    id: 'ONB-2026-001',
    candidateId: 'CAN-2026-005',
    candidateName: 'Amit Kumar Verma',
    mobile: '9988776655',
    email: 'amit.verma.ops@gmail.com',
    jobCategory: 'CCTV / Control Room Operator',
    appliedFor: 'Control Room Surveillance Executive',
    offeredSalary: 22500,
    offeredDesignation: 'Control Room Surveillance Executive',
    proposedJoiningDate: '2026-11-08',
    assignedClient: 'DLF CyberCity Tech Park',
    assignedSite: 'Tower 4 Central Surveillance Hub',
    assignedShift: 'Rotational 8hr Shift (A/B/C)',
    stage: 'ready_to_deploy',
    photo: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
    documents: {
      aadhaar: { status: 'Verified', number: 'XXXX-XXXX-9281', documentName: 'Aadhaar Card' },
      pan: { status: 'Verified', number: 'AYUPV9182K', documentName: 'PAN Card' },
      bankProof: { status: 'Verified', bankName: 'HDFC Bank Ltd', ifsc: 'HDFC0001824', accountNumber: '501002918271', documentName: 'Bank Cancelled Cheque' },
      policeVerification: { status: 'Verified', refNo: 'PV/GZB/2026/8812', clearanceDate: '2026-10-28', documentName: 'Special Branch Police Clearance' },
      educationCertificate: { status: 'Verified', documentName: 'Graduation Degree (BA)' },
      experienceRelieving: { status: 'Verified', documentName: 'Securitas India Relieving Letter' }
    },
    uniformKit: {
      shirtSize: 'M (40)',
      trouserSize: '32',
      bootSize: '8',
      capIssued: true,
      badgeIssued: true,
      whistleIssued: true,
      batonIssued: false,
      torchIssued: true,
      idCardGenerated: true,
    },
    isConvertedToEmployee: false,
    createdEmployeeCode: '',
    notes: 'All documents verified against original copies. Candidate is cleared for joining on 8th Nov.'
  },
  {
    id: 'ONB-2026-002',
    candidateId: 'CAN-2026-001',
    candidateName: 'Surender Singh Tomar',
    mobile: '9876543210',
    email: 'surender.tomar@gmail.com',
    jobCategory: 'Security Guard',
    appliedFor: 'Security Guard',
    offeredSalary: 19500,
    offeredDesignation: 'Security Guard',
    proposedJoiningDate: '2026-11-10',
    assignedClient: 'Advant Navis Business Park',
    assignedSite: 'Gate 1 Pedestrian Turnstile',
    assignedShift: 'Day Shift (08:00 AM - 08:00 PM)',
    stage: 'document_verification',
    photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    documents: {
      aadhaar: { status: 'Verified', number: 'XXXX-XXXX-4821', documentName: 'Aadhaar Card' },
      pan: { status: 'Verified', number: 'BNZPT4812L', documentName: 'PAN Card' },
      bankProof: { status: 'Uploaded', bankName: 'State Bank of India', ifsc: 'SBIN0006214', accountNumber: '20194819281', documentName: 'SBI Passbook Copy' },
      policeVerification: { status: 'Pending', refNo: 'Applied at Sector 58 Police Station', clearanceDate: '', documentName: 'Police Verification Slip' },
      educationCertificate: { status: 'Verified', documentName: '10th Matriculation Marksheet' },
      experienceRelieving: { status: 'Uploaded', documentName: 'G4S Experience Certificate' }
    },
    uniformKit: {
      shirtSize: 'L (42)',
      trouserSize: '34',
      bootSize: '9',
      capIssued: false,
      badgeIssued: false,
      whistleIssued: false,
      batonIssued: false,
      torchIssued: false,
      idCardGenerated: false,
    },
    isConvertedToEmployee: false,
    createdEmployeeCode: '',
    notes: 'Police verification receipt submitted. Awaiting Special Branch clearance before issuing uniform.'
  }
];

const ONBOARDING_STORAGE_KEY = 'novaspark_onboarding_candidates_v1';

export const getStoredOnboarding = () => {
  try {
    const raw = localStorage.getItem(ONBOARDING_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(INITIAL_ONBOARDING_CANDIDATES));
      return INITIAL_ONBOARDING_CANDIDATES;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading onboarding from localStorage:', err);
    return INITIAL_ONBOARDING_CANDIDATES;
  }
};

export const saveStoredOnboarding = (list) => {
  try {
    localStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(list));
    window.dispatchEvent(new CustomEvent('onboarding-data-updated'));
  } catch (err) {
    console.error('Error saving onboarding to localStorage:', err);
  }
};

export const generateNextOnboardingId = () => {
  const list = getStoredOnboarding();
  const currentYear = new Date().getFullYear();
  let maxSeq = 0;
  list.forEach((item) => {
    const match = String(item.id).match(/ONB-\d{4}-(\d+)/);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num > maxSeq) maxSeq = num;
    }
  });
  const nextSeq = String(maxSeq + 1).padStart(3, '0');
  return `ONB-${currentYear}-${nextSeq}`;
};

export const transferCandidateToOnboarding = (candidate, offerDetails = {}) => {
  const list = getStoredOnboarding();
  const existing = list.find((item) => item.candidateId === candidate.id);
  if (existing) {
    return existing;
  }

  const newOnboarding = {
    id: generateNextOnboardingId(),
    candidateId: candidate.id,
    candidateName: candidate.name,
    mobile: candidate.mobile || '',
    email: candidate.email || '',
    jobCategory: candidate.jobCategory || 'Security Guard',
    appliedFor: candidate.appliedFor || 'Security Guard',
    offeredSalary: Number(offerDetails.offeredSalary || candidate.expectedSalary || 18000),
    offeredDesignation: offerDetails.offeredDesignation || candidate.appliedFor || 'Security Guard',
    proposedJoiningDate: offerDetails.proposedJoiningDate || new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
    assignedClient: offerDetails.assignedClient || 'Corporate Office / Main Site',
    assignedSite: offerDetails.assignedSite || 'Main Gate Security Post',
    assignedShift: offerDetails.assignedShift || 'Day Shift (08:00 AM - 08:00 PM)',
    stage: 'offer_accepted',
    photo: candidate.photo || '',
    documents: {
      aadhaar: { status: 'Uploaded', number: '', documentName: 'Aadhaar Card' },
      pan: { status: 'Uploaded', number: '', documentName: 'PAN Card' },
      bankProof: { status: 'Pending', bankName: '', ifsc: '', accountNumber: '', documentName: 'Bank Passbook / Cheque' },
      policeVerification: { status: 'Pending', refNo: '', clearanceDate: '', documentName: 'Police Verification' },
      educationCertificate: { status: 'Uploaded', documentName: 'Educational Certificate' },
      experienceRelieving: { status: candidate.experience === 'Experienced' ? 'Uploaded' : 'N/A', documentName: 'Previous Relieving Letter' }
    },
    uniformKit: {
      shirtSize: 'M (40)',
      trouserSize: '32',
      bootSize: '8',
      capIssued: false,
      badgeIssued: false,
      whistleIssued: false,
      batonIssued: false,
      torchIssued: false,
      idCardGenerated: false,
    },
    isConvertedToEmployee: false,
    createdEmployeeCode: '',
    notes: `Transferred from Recruitment. Candidate selected in interview.`
  };

  const updated = [newOnboarding, ...list];
  saveStoredOnboarding(updated);
  return newOnboarding;
};

export const updateOnboardingCandidate = (onboardingId, updatedFields) => {
  const list = getStoredOnboarding();
  const index = list.findIndex((item) => item.id === onboardingId);
  if (index === -1) return null;
  const updatedItem = { ...list[index], ...updatedFields };
  list[index] = updatedItem;
  saveStoredOnboarding(list);
  return updatedItem;
};

export const addOnboardingCandidate = (data) => {
  const list = getStoredOnboarding();
  const newOnboarding = {
    id: data.id || generateNextOnboardingId(),
    candidateId: data.candidateId || 'DIRECT-WALKIN',
    candidateName: data.candidateName || data.name || '',
    mobile: data.mobile || '',
    email: data.email || '',
    jobCategory: data.jobCategory || 'Security',
    appliedFor: data.appliedFor || 'Security Guard',
    offeredSalary: Number(data.offeredSalary || 18000),
    offeredDesignation: data.offeredDesignation || data.appliedFor || 'Security Guard',
    proposedJoiningDate: data.proposedJoiningDate || new Date().toISOString().split('T')[0],
    assignedClient: data.assignedClient || 'Unassigned Client',
    assignedSite: data.assignedSite || 'Main Site',
    assignedShift: data.assignedShift || 'Day Shift (08:00 AM - 08:00 PM)',
    stage: data.stage || 'offer_accepted',
    photo: data.photo || '',
    documents: data.documents || {
      aadhaar: { status: data.aadhaarNumber ? 'Verified' : 'Pending', number: data.aadhaarNumber || '', documentName: 'Aadhaar Card' },
      pan: { status: data.panNumber ? 'Verified' : 'Pending', number: data.panNumber || '', documentName: 'PAN Card' },
      bankProof: { status: data.bankAccount ? 'Verified' : 'Pending', bankName: data.bankName || '', ifsc: data.bankIfsc || '', accountNumber: data.bankAccount || '', documentName: 'Bank Passbook / Cheque' },
      policeVerification: { status: data.policeVerificationStatus || 'Pending', refNo: data.policeRefNo || '', clearanceDate: '', documentName: 'Police Verification' },
      educationCertificate: { status: 'Uploaded', documentName: 'Educational Certificate' },
      experienceRelieving: { status: 'Uploaded', documentName: 'Previous Relieving Letter' }
    },
    uniformKit: data.uniformKit || {
      shirtSize: data.shirtSize || 'M (40)',
      trouserSize: data.trouserSize || '32',
      bootSize: data.bootSize || '8',
      capIssued: Boolean(data.capIssued),
      badgeIssued: Boolean(data.badgeIssued),
      whistleIssued: Boolean(data.whistleIssued),
      batonIssued: false,
      torchIssued: Boolean(data.torchIssued),
      idCardGenerated: false,
    },
    isConvertedToEmployee: false,
    createdEmployeeCode: '',
    notes: data.notes || 'Direct Onboarding'
  };

  const updated = [newOnboarding, ...list];
  saveStoredOnboarding(updated);
  return newOnboarding;
};

export const convertToEmployee = (onboardingId, generatedEmpCode) => {
  const list = getStoredOnboarding();
  const index = list.findIndex((item) => item.id === onboardingId);
  if (index === -1) return null;
  const empCode = generatedEmpCode || `RR-${Math.floor(100 + Math.random() * 900)}`;
  const updatedItem = {
    ...list[index],
    stage: 'completed',
    isConvertedToEmployee: true,
    createdEmployeeCode: empCode,
  };
  list[index] = updatedItem;
  saveStoredOnboarding(list);
  return updatedItem;
};

