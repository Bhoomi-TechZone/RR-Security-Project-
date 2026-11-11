import mongoose from 'mongoose';
import Candidate from '../models/candidateModel.js';
import Company from '../models/companyModel.js';
import Onboarding from '../models/onboardingModel.js';
import { sendOnboardingInvitationEmail } from '../services/emailService.js';
import { generateNextOnboardingIdInternal } from './onboardingController.js';

const SEED_CANDIDATES = [
  {
    id: 'CAN-2026-001',
    candidateId: 'CAN-2026-001',
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
    status: 'selected'
  },
  {
    id: 'CAN-2026-002',
    candidateId: 'CAN-2026-002',
    name: 'Balwant Singh Rathore',
    mobile: '9810987654',
    altMobile: '9414012345',
    whatsapp: '9810987654',
    email: 'balwant.rathore@outlook.com',
    address: 'Vill. Badshahpur, Sohna Road',
    city: 'Gurugram',
    state: 'Haryana',
    pincode: '122018',
    jobCategory: 'Armed Security Guard',
    appliedFor: 'Armed Security Guard',
    experience: 'Experienced',
    totalExperienceYears: 7,
    lastCompany: 'SIS India Limited (Cash Logistics & Bank)',
    lastSalary: 22000,
    expectedSalary: 26000,
    minExpectedSalary: 24500,
    maxExpectedSalary: 28000,
    preferredLocation: 'Gurugram Cyber Hub / Golf Course Road',
    resumeUrl: 'Balwant_Rathore_Gunman_CV.pdf',
    resumeSize: '890 KB',
    photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    skills: ['Arms / Weapon Handling (Licensed)', 'Gate Access & Frisking', 'Crowd Control & VIP Escort'],
    source: 'Reference',
    registrationDate: '2026-11-02',
    remarks: 'Holds valid all-India DBBL 12-bore license with renewal done in Jan 2026. Physically fit ex-serviceman demeanor.',
    status: 'applied'
  },
  {
    id: 'CAN-2026-003',
    candidateId: 'CAN-2026-003',
    name: 'Rameshwar Dayal',
    mobile: '9711224466',
    altMobile: '',
    whatsapp: '9711224466',
    email: 'rameshwar.dayal.sec@gmail.com',
    address: 'G-12, Sector 12, Pratap Vihar',
    city: 'Greater Noida',
    state: 'Uttar Pradesh',
    pincode: '201009',
    jobCategory: 'Field Supervisor',
    appliedFor: 'Field Supervisor',
    experience: 'Experienced',
    totalExperienceYears: 5,
    lastCompany: 'Peregrine Guarding Pvt Ltd',
    lastSalary: 21000,
    expectedSalary: 25000,
    minExpectedSalary: 23500,
    maxExpectedSalary: 26500,
    preferredLocation: 'Greater Noida West / Techzone 4',
    resumeUrl: 'Rameshwar_Supervisor_Profile.pdf',
    resumeSize: '1.0 MB',
    photo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
    skills: ['Visitor Log & Register Keeping', 'Two Wheeler License', 'Physical Fitness & Turnout'],
    source: 'Job Portal',
    registrationDate: '2026-11-02',
    remarks: 'Has personal bike with DL. Can handle night patrols across 4 active client sites. Leadership capability verified.',
    status: 'selected'
  },
  {
    id: 'CAN-2026-004',
    candidateId: 'CAN-2026-004',
    name: 'Sunita Devi',
    mobile: '9654321987',
    altMobile: '',
    whatsapp: '9654321987',
    email: 'sunita.housekeeping@gmail.com',
    address: 'Khora Colony, Near Primary School',
    city: 'Ghaziabad',
    state: 'Uttar Pradesh',
    pincode: '201020',
    jobCategory: 'Housekeeping Attendant',
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
    status: 'applied'
  },
  {
    id: 'CAN-2026-005',
    candidateId: 'CAN-2026-005',
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
    status: 'moved_to_onboarding'
  }
];

/**
 * Helper to resolve company IDs for strict multi-tenant company isolation
 */
const resolveCompanyIds = async (companyId, adminEmail) => {
  let companyIds = [companyId];
  if (!companyId) return companyIds;

  try {
    const comp = await Company.findOne({
      adminEmail,
      $or: [
        { companyId },
        { _id: mongoose.Types.ObjectId.isValid(companyId) ? companyId : null }
      ]
    });
    if (comp) {
      companyIds = Array.from(new Set([comp.companyId, comp._id?.toString(), companyId])).filter(Boolean);
    }
  } catch { }
  return companyIds;
};

/**
 * Generate sequential candidate ID per company (CAN-YYYY-001, CAN-YYYY-002, etc.)
 */
const generateNextCandidateIdInternal = async (companyIds, adminEmail) => {
  const currentYear = new Date().getFullYear();
  const prefix = `CAN-${currentYear}-`;

  const existing = await Candidate.find({
    companyId: { $in: companyIds },
    adminEmail,
    id: { $regex: new RegExp(`^CAN-${currentYear}-`) }
  }).select('id');

  let maxNum = 0;
  existing.forEach((c) => {
    if (c.id) {
      const match = c.id.match(/CAN-\d{4}-(\d+)/i);
      if (match) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num) && num > maxNum) maxNum = num;
      }
    }
  });

  const nextNum = maxNum + 1;
  return `${prefix}${String(nextNum).padStart(3, '0')}`;
};

/**
 * @desc    Get next candidate ID for active company
 * @route   GET /api/candidates/next-id
 * @access  Private (Admin)
 */
export const getNextCandidateId = async (req, res) => {
  try {
    const adminEmail = req.user.email.toLowerCase();
    const companyId = req.headers['x-company-id'] || req.query.companyId;

    if (!companyId) {
      return res.status(400).json({ success: false, message: 'Company ID is required.' });
    }

    const companyIds = await resolveCompanyIds(companyId, adminEmail);
    const nextId = await generateNextCandidateIdInternal(companyIds, adminEmail);

    return res.status(200).json({ success: true, nextId });
  } catch (error) {
    console.error('Error generating next candidate ID:', error);
    return res.status(500).json({ success: false, message: 'Failed to generate candidate ID' });
  }
};

/**
 * @desc    Get all candidates strictly isolated to active company
 * @route   GET /api/candidates
 * @access  Private (Admin)
 */
export const getCandidates = async (req, res) => {
  try {
    const adminEmail = req.user.email.toLowerCase();
    const companyId = req.headers['x-company-id'] || req.query.companyId;

    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: 'Company ID is required to fetch isolated candidate records.'
      });
    }

    const companyIds = await resolveCompanyIds(companyId, adminEmail);

    // Auto-seed primary company in MongoDB if count is 0
    const existingCount = await Candidate.countDocuments({
      companyId: { $in: companyIds },
      adminEmail
    });

    const isPrimaryComp =
      companyId === 'RRS8392014SEC' ||
      companyId === 'comp_rr_security' ||
      companyId.toLowerCase().includes('rr');

    if (existingCount === 0 && isPrimaryComp) {
      // Find company name for records
      const comp = await Company.findOne({ adminEmail, companyId: { $in: companyIds } }).select('name companyName');
      const compName = comp?.name || comp?.companyName || 'RR Security & Facilities';

      const seedDocs = SEED_CANDIDATES.map((cand) => ({
        ...cand,
        companyId,
        companyName: compName,
        adminEmail
      }));

      try {
        await Candidate.insertMany(seedDocs);
      } catch (seedErr) {
        console.warn('Auto-seed warning (may already exist):', seedErr.message);
      }
    }

    const filter = {
      companyId: { $in: companyIds },
      adminEmail
    };

    if (req.query.status && req.query.status !== 'all') {
      filter.status = req.query.status;
    }

    if (req.query.category && req.query.category !== 'all') {
      filter.$or = [
        { jobCategory: req.query.category },
        { jobCategories: req.query.category }
      ];
    }

    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.$or = [
        { name: searchRegex },
        { id: searchRegex },
        { mobile: searchRegex },
        { email: searchRegex },
        { appliedFor: searchRegex },
        { jobCategory: searchRegex }
      ];
    }

    const candidates = await Candidate.find(filter).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: candidates.length,
      candidates
    });
  } catch (error) {
    console.error('Error fetching candidates:', error);
    return res.status(500).json({ success: false, message: error.message || 'Failed to fetch candidates' });
  }
};

/**
 * @desc    Get single candidate by ID isolated to company
 * @route   GET /api/candidates/:id
 * @access  Private (Admin)
 */
export const getCandidateById = async (req, res) => {
  try {
    const { id } = req.params;
    const adminEmail = req.user.email.toLowerCase();
    const companyId = req.headers['x-company-id'] || req.query.companyId;

    if (!companyId) {
      return res.status(400).json({ success: false, message: 'Company ID is required.' });
    }

    const companyIds = await resolveCompanyIds(companyId, adminEmail);

    const query = {
      companyId: { $in: companyIds },
      adminEmail,
      $or: [
        { id },
        { candidateId: id },
        ...(mongoose.Types.ObjectId.isValid(id) ? [{ _id: id }] : [])
      ]
    };

    const candidate = await Candidate.findOne(query);

    if (!candidate) {
      return res.status(404).json({ success: false, message: 'Candidate not found.' });
    }

    return res.status(200).json({ success: true, candidate });
  } catch (error) {
    console.error('Error fetching candidate:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch candidate' });
  }
};

/**
 * @desc    Create a new candidate isolated to the company
 * @route   POST /api/candidates
 * @access  Private (Admin)
 */
export const createCandidate = async (req, res) => {
  try {
    const adminEmail = req.user.email.toLowerCase();
    const companyId = req.headers['x-company-id'] || req.body.companyId;

    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: 'Active Company ID is required to register a candidate.'
      });
    }

    const companyIds = await resolveCompanyIds(companyId, adminEmail);

    // Auto-generate candidate ID if missing
    let candidateId = (req.body.id || req.body.candidateId || '').trim();
    if (!candidateId) {
      candidateId = await generateNextCandidateIdInternal(companyIds, adminEmail);
    }

    // Lookup company name
    let compName = req.body.companyName || '';
    if (!compName) {
      const comp = await Company.findOne({ adminEmail, companyId: { $in: companyIds } }).select('name companyName');
      compName = comp?.name || comp?.companyName || '';
    }

    const candidateData = {
      ...req.body,
      id: candidateId,
      candidateId,
      companyId,
      companyName: compName,
      adminEmail,
      status: req.body.status || 'applied',
      registrationDate: req.body.registrationDate || new Date().toISOString().split('T')[0]
    };

    const newCandidate = new Candidate(candidateData);
    await newCandidate.save();

    return res.status(201).json({
      success: true,
      message: `Candidate "${newCandidate.name}" (${newCandidate.id}) registered successfully for company.`,
      candidate: newCandidate
    });
  } catch (error) {
    console.error('Error creating candidate:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to register candidate'
    });
  }
};

/**
 * @desc    Update candidate details
 * @route   PUT /api/candidates/:id
 * @access  Private (Admin)
 */
export const updateCandidate = async (req, res) => {
  try {
    const { id } = req.params;
    const adminEmail = req.user.email.toLowerCase();
    const companyId = req.headers['x-company-id'] || req.body.companyId;

    if (!companyId) {
      return res.status(400).json({ success: false, message: 'Company ID is required.' });
    }

    const companyIds = await resolveCompanyIds(companyId, adminEmail);

    const query = {
      companyId: { $in: companyIds },
      adminEmail,
      $or: [
        { id },
        { candidateId: id },
        ...(mongoose.Types.ObjectId.isValid(id) ? [{ _id: id }] : [])
      ]
    };

    const candidate = await Candidate.findOne(query);

    if (!candidate) {
      return res.status(404).json({ success: false, message: 'Candidate not found.' });
    }

    // Prevent overwriting isolated identifiers
    delete req.body.companyId;
    delete req.body.adminEmail;

    Object.assign(candidate, req.body);
    await candidate.save();

    return res.status(200).json({
      success: true,
      message: `Candidate "${candidate.name}" updated successfully.`,
      candidate
    });
  } catch (error) {
    console.error('Error updating candidate:', error);
    return res.status(500).json({ success: false, message: error.message || 'Failed to update candidate' });
  }
};

/**
 * @desc    Update candidate status (e.g., applied -> selected -> moved_to_onboarding)
 * @route   PATCH /api/candidates/:id/status
 * @access  Private (Admin)
 */
export const updateCandidateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const adminEmail = req.user.email.toLowerCase();
    const companyId = req.headers['x-company-id'] || req.body.companyId;

    if (!companyId) {
      return res.status(400).json({ success: false, message: 'Company ID is required.' });
    }

    if (!status) {
      return res.status(400).json({ success: false, message: 'New status is required.' });
    }

    const companyIds = await resolveCompanyIds(companyId, adminEmail);

    const candidate = await Candidate.findOne({
      companyId: { $in: companyIds },
      adminEmail,
      $or: [
        { id },
        { candidateId: id },
        ...(mongoose.Types.ObjectId.isValid(id) ? [{ _id: id }] : [])
      ]
    });

    if (!candidate) {
      return res.status(404).json({ success: false, message: 'Candidate not found.' });
    }

    candidate.status = status;
    await candidate.save();

    let onboardingRecord = null;
    if (status === 'moved_to_onboarding') {
      try {
        const candidateId = candidate.id || candidate.candidateId;
        let existingOnb = await Onboarding.findOne({
          companyId: { $in: companyIds },
          adminEmail,
          $or: [{ candidateId }, { candidateId: candidate.id }]
        });

        const comp = await Company.findOne({ adminEmail, companyId: { $in: companyIds } }).lean();
        const compName = comp?.name || comp?.companyName || '';

        if (!existingOnb) {
          const onbId = await generateNextOnboardingIdInternal(companyIds, adminEmail);
          const fullAddr = [candidate.address, candidate.city, candidate.state ? `${candidate.state}${candidate.pincode ? ` - ${candidate.pincode}` : ''}` : ''].filter(Boolean).join(', ');

          existingOnb = new Onboarding({
            id: onbId,
            companyId: candidate.companyId || companyId,
            companyName: compName,
            adminEmail,
            candidateId,
            candidateName: candidate.name,
            mobile: candidate.mobile || '',
            email: candidate.email || '',
            jobCategory: candidate.jobCategory || 'Security Guard',
            appliedFor: candidate.appliedFor || 'Security Guard',
            offeredSalary: Number(candidate.expectedSalary || 18000),
            offeredDesignation: candidate.appliedFor || 'Security Guard',
            proposedJoiningDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
            assignedClient: 'Corporate Office / Main Site',
            assignedSite: 'Main Gate Security Post',
            assignedShift: 'Day Shift (08:00 AM - 08:00 PM)',
            stage: 'document_verification',
            photo: candidate.photo || '',
            presentAddress: fullAddr || candidate.address || '',
            address: candidate.address || '',
            city: candidate.city || '',
            state: candidate.state || '',
            pincode: candidate.pincode || '',
            dob: candidate.dob || '',
            gender: candidate.gender || 'Male',
            fatherHusbandName: candidate.fatherHusbandName || candidate.fatherName || '',
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
              idCardGenerated: false
            },
            isConvertedToEmployee: false,
            createdEmployeeCode: '',
            notes: `Transferred to Onboarding pipeline for ${candidate.companyId || companyId}.`,
            linkExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
            invitationSentAt: new Date()
          });
          await existingOnb.save();
        } else {
          existingOnb.linkExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
          existingOnb.invitationSentAt = new Date();
          await existingOnb.save();
        }

        onboardingRecord = existingOnb;

        // Send professional onboarding invitation email
        const candidateEmail = (existingOnb.email || candidate.email || '').trim();
        if (candidateEmail) {
          const clientBaseUrl = (process.env.CLIENT_URL || process.env.FRONTEND_URL || req.headers?.origin || 'http://localhost:5173').replace(/\/+$/, '');
          const onboardingUrl = `${clientBaseUrl}/onboard/${existingOnb.id}`;
          sendOnboardingInvitationEmail({
            to: candidateEmail,
            candidateName: existingOnb.candidateName,
            role: existingOnb.appliedFor || existingOnb.jobCategory,
            companyName: compName || comp?.name || 'RR Security & Facilities',
            onboardingUrl,
            joiningDate: existingOnb.proposedJoiningDate || 'Upcoming',
            refId: existingOnb.id,
            assignedClient: existingOnb.assignedClient || 'Main Site',
            companyId: comp?.companyId || companyId,
            customConfig: comp?.preferences?.emailConfig
          }).catch((emailErr) => console.warn('[Onboarding] Error sending invitation email on status update:', emailErr.message));
        }
      } catch (onbErr) {
        console.warn('[Onboarding] Auto-transfer on candidate status change failed:', onbErr.message);
      }
    }

    return res.status(200).json({
      success: true,
      message: `Status updated to "${status}".`,
      candidate,
      onboarding: onboardingRecord
    });
  } catch (error) {
    console.error('Error updating candidate status:', error);
    return res.status(500).json({ success: false, message: error.message || 'Failed to update status' });
  }
};

/**
 * @desc    Delete a candidate record
 * @route   DELETE /api/candidates/:id
 * @access  Private (Admin)
 */
export const deleteCandidate = async (req, res) => {
  try {
    const { id } = req.params;
    const adminEmail = req.user.email.toLowerCase();
    const companyId = req.headers['x-company-id'] || req.query.companyId;

    if (!companyId) {
      return res.status(400).json({ success: false, message: 'Company ID is required.' });
    }

    const companyIds = await resolveCompanyIds(companyId, adminEmail);

    const candidate = await Candidate.findOneAndDelete({
      companyId: { $in: companyIds },
      adminEmail,
      $or: [
        { id },
        { candidateId: id },
        ...(mongoose.Types.ObjectId.isValid(id) ? [{ _id: id }] : [])
      ]
    });

    if (!candidate) {
      return res.status(404).json({ success: false, message: 'Candidate not found.' });
    }

    return res.status(200).json({
      success: true,
      message: `Candidate "${candidate.name}" deleted successfully.`
    });
  } catch (error) {
    console.error('Error deleting candidate:', error);
    return res.status(500).json({ success: false, message: error.message || 'Failed to delete candidate' });
  }
};

