import mongoose from 'mongoose';
import Onboarding from '../models/onboardingModel.js';
import Candidate from '../models/candidateModel.js';
import Company from '../models/companyModel.js';
import Employee from '../models/employeeModel.js';
import { sendOnboardingInvitationEmail } from '../services/emailService.js';

const SEED_ONBOARDING = [
  {
    id: 'ONB-2026-001',
    candidateId: 'CAN-2026-005',
    candidateName: 'Amit Kumar Verma',
    mobile: '9988776655',
    email: 'amit.verma.ops@gmail.com',
    presentAddress: 'Plot 45, Govindpuram, Ghaziabad, Uttar Pradesh - 201013',
    address: 'Plot 45, Govindpuram',
    city: 'Ghaziabad',
    state: 'Uttar Pradesh',
    pincode: '201013',
    dob: '1994-08-20',
    gender: 'Male',
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
      idCardGenerated: true
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
    presentAddress: 'H.No 142, Gali No 4, Mamura Village, Sector 66, Noida, Uttar Pradesh - 201301',
    address: 'H.No 142, Gali No 4, Mamura Village, Sector 66',
    city: 'Noida',
    state: 'Uttar Pradesh',
    pincode: '201301',
    dob: '1996-05-14',
    gender: 'Male',
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
      idCardGenerated: false
    },
    isConvertedToEmployee: false,
    createdEmployeeCode: '',
    notes: 'Police verification receipt submitted. Awaiting Special Branch clearance before issuing uniform.'
  }
];

/**
 * Resolve company IDs for strict multi-tenant company isolation
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
  } catch {}
  return companyIds;
};

/**
 * Generate sequential onboarding ID per company (ONB-YYYY-001, ONB-YYYY-002, etc.)
 */
export const generateNextOnboardingIdInternal = async (companyIds, adminEmail) => {
  const currentYear = new Date().getFullYear();
  const prefix = `ONB-${currentYear}-`;

  const existing = await Onboarding.find({
    companyId: { $in: companyIds },
    adminEmail,
    id: { $regex: new RegExp(`^ONB-${currentYear}-`) }
  }).select('id');

  let maxNum = 0;
  existing.forEach((item) => {
    if (item.id) {
      const match = item.id.match(/ONB-\d{4}-(\d+)/i);
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
 * @desc    Get next onboarding ID
 * @route   GET /api/onboarding/next-id
 * @access  Private (Admin)
 */
export const getNextOnboardingId = async (req, res) => {
  try {
    const adminEmail = req.user.email.toLowerCase();
    const companyId = req.headers['x-company-id'] || req.query.companyId;

    if (!companyId) {
      return res.status(400).json({ success: false, message: 'Company ID is required.' });
    }

    const companyIds = await resolveCompanyIds(companyId, adminEmail);
    const nextId = await generateNextOnboardingIdInternal(companyIds, adminEmail);

    return res.status(200).json({ success: true, nextId });
  } catch (error) {
    console.error('Error generating next onboarding ID:', error);
    return res.status(500).json({ success: false, message: 'Failed to generate onboarding ID' });
  }
};

/**
 * @desc    Get all onboarding records isolated to active company
 * @route   GET /api/onboarding
 * @access  Private (Admin)
 */
export const getOnboardingList = async (req, res) => {
  try {
    const adminEmail = req.user.email.toLowerCase();
    const companyId = req.headers['x-company-id'] || req.query.companyId;

    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: 'Company ID is required to fetch isolated onboarding records.'
      });
    }

    const companyIds = await resolveCompanyIds(companyId, adminEmail);

    // Auto-seed primary company in MongoDB if count is 0
    const existingCount = await Onboarding.countDocuments({
      companyId: { $in: companyIds },
      adminEmail
    });

    const isPrimaryComp =
      companyId === 'RRS8392014SEC' ||
      companyId === 'comp_rr_security' ||
      companyId.toLowerCase().includes('rr');

    if (existingCount === 0 && isPrimaryComp) {
      const comp = await Company.findOne({ adminEmail, companyId: { $in: companyIds } }).select('name companyName');
      const compName = comp?.name || comp?.companyName || 'RR Security & Facilities';

      const seedDocs = SEED_ONBOARDING.map((item) => ({
        ...item,
        companyId,
        companyName: compName,
        adminEmail
      }));

      try {
        await Onboarding.insertMany(seedDocs);
      } catch (seedErr) {
        console.warn('Auto-seed onboarding warning:', seedErr.message);
      }
    }

    const filter = {
      companyId: { $in: companyIds },
      adminEmail
    };

    if (req.query.stage && req.query.stage !== 'all') {
      filter.stage = req.query.stage;
    }

    if (req.query.category && req.query.category !== 'all') {
      filter.jobCategory = req.query.category;
    }

    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.$or = [
        { candidateName: searchRegex },
        { id: searchRegex },
        { candidateId: searchRegex },
        { mobile: searchRegex },
        { email: searchRegex },
        { assignedClient: searchRegex },
        { assignedSite: searchRegex }
      ];
    }

    const list = await Onboarding.find(filter).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: list.length,
      onboardingList: list
    });
  } catch (error) {
    console.error('Error fetching onboarding list:', error);
    return res.status(500).json({ success: false, message: error.message || 'Failed to fetch onboarding list' });
  }
};

/**
 * @desc    Get single onboarding record by ID
 * @route   GET /api/onboarding/:id
 * @access  Private (Admin)
 */
export const getOnboardingById = async (req, res) => {
  try {
    const { id } = req.params;
    const adminEmail = req.user.email.toLowerCase();
    const companyId = req.headers['x-company-id'] || req.query.companyId;

    if (!companyId) {
      return res.status(400).json({ success: false, message: 'Company ID is required.' });
    }

    const companyIds = await resolveCompanyIds(companyId, adminEmail);

    const record = await Onboarding.findOne({
      companyId: { $in: companyIds },
      adminEmail,
      $or: [
        { id },
        { candidateId: id },
        ...(mongoose.Types.ObjectId.isValid(id) ? [{ _id: id }] : [])
      ]
    });

    if (!record) {
      return res.status(404).json({ success: false, message: 'Onboarding record not found.' });
    }

    return res.status(200).json({ success: true, onboarding: record });
  } catch (error) {
    console.error('Error fetching onboarding record:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch onboarding record' });
  }
};

/**
 * @desc    Create or transfer candidate to onboarding
 * @route   POST /api/onboarding
 * @access  Private (Admin)
 */
export const createOnboarding = async (req, res) => {
  try {
    const adminEmail = req.user.email.toLowerCase();
    const companyId = req.headers['x-company-id'] || req.body.companyId;

    if (!companyId) {
      return res.status(400).json({ success: false, message: 'Company ID is required.' });
    }

    const companyIds = await resolveCompanyIds(companyId, adminEmail);

    const candidateId = req.body.candidateId;
    if (!candidateId) {
      return res.status(400).json({ success: false, message: 'Candidate ID is required.' });
    }

    const comp = await Company.findOne({ adminEmail, companyId: { $in: companyIds } }).lean();
    const compName = comp?.name || comp?.companyName || req.body.companyName || '';

    // Lookup candidate from database to inherit verified address & demographics
    const cand = await Candidate.findOne({
      companyId: { $in: companyIds },
      adminEmail,
      $or: [{ id: candidateId }, { candidateId }]
    });

    // Check if onboarding record already exists for this candidate in this company
    const existing = await Onboarding.findOne({
      companyId: { $in: companyIds },
      adminEmail,
      candidateId
    });

    if (existing) {
      existing.linkExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
      existing.invitationSentAt = new Date();
      await existing.save();

      const candidateEmail = (existing.email || cand?.email || req.body.email || '').trim();
      if (candidateEmail) {
        const clientBaseUrl = (process.env.CLIENT_URL || process.env.FRONTEND_URL || req.headers?.origin || 'http://localhost:5173').replace(/\/+$/, '');
        const onboardingUrl = `${clientBaseUrl}/onboard/${existing.id}`;
        sendOnboardingInvitationEmail({
          to: candidateEmail,
          candidateName: existing.candidateName,
          role: existing.appliedFor || existing.jobCategory,
          companyName: compName || comp?.name || 'RR Security & Facilities',
          onboardingUrl,
          joiningDate: existing.proposedJoiningDate || 'Upcoming',
          refId: existing.id,
          assignedClient: existing.assignedClient || 'Main Site',
          companyId: comp?.companyId || companyId,
          customConfig: comp?.preferences?.emailConfig
        }).catch((e) => console.warn('[Onboarding] Resend existing invite notice:', e.message));
      }
      return res.status(200).json({
        success: true,
        message: 'Candidate is already in onboarding pipeline. Verification email link resent.',
        onboarding: existing
      });
    }

    const id = req.body.id || (await generateNextOnboardingIdInternal(companyIds, adminEmail));

    const fullAddr = cand
      ? [cand.address, cand.city, cand.state ? `${cand.state}${cand.pincode ? ` - ${cand.pincode}` : ''}` : ''].filter(Boolean).join(', ')
      : '';

    const newRecord = new Onboarding({
      ...req.body,
      id,
      companyId,
      companyName: compName,
      adminEmail,
      presentAddress: req.body.presentAddress || fullAddr || cand?.address || '',
      address: req.body.address || cand?.address || '',
      city: req.body.city || cand?.city || '',
      state: req.body.state || cand?.state || '',
      pincode: req.body.pincode || cand?.pincode || '',
      dob: req.body.dob || cand?.dob || '',
      gender: req.body.gender || cand?.gender || 'Male',
      fatherHusbandName: req.body.fatherHusbandName || cand?.fatherName || '',
      stage: req.body.stage || 'offer_accepted',
      linkExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      invitationSentAt: new Date()
    });

    await newRecord.save();

    // Also update candidate status to 'moved_to_onboarding' in Candidate model
    await Candidate.updateOne(
      {
        companyId: { $in: companyIds },
        adminEmail,
        $or: [{ id: candidateId }, { candidateId }]
      },
      { $set: { status: 'moved_to_onboarding' } }
    );

    // Send professional onboarding invitation email with document verification link
    const candidateEmail = (newRecord.email || cand?.email || req.body.email || '').trim();
    let emailStatus = null;
    if (candidateEmail) {
      const clientBaseUrl = (process.env.CLIENT_URL || process.env.FRONTEND_URL || req.headers?.origin || 'http://localhost:5173').replace(/\/+$/, '');
      const onboardingUrl = `${clientBaseUrl}/onboard/${newRecord.id}`;
      try {
        emailStatus = await sendOnboardingInvitationEmail({
          to: candidateEmail,
          candidateName: newRecord.candidateName,
          role: newRecord.appliedFor || newRecord.jobCategory,
          companyName: compName || comp?.name || 'RR Security & Facilities',
          onboardingUrl,
          joiningDate: newRecord.proposedJoiningDate || 'Upcoming',
          refId: newRecord.id,
          assignedClient: newRecord.assignedClient || 'Main Site',
          companyId: comp?.companyId || companyId,
          customConfig: comp?.preferences?.emailConfig
        });
        console.log(`[Onboarding] Invitation email delivered to ${candidateEmail}:`, emailStatus?.messageId);
      } catch (emailErr) {
        console.warn('[Onboarding] Error sending invitation email on create:', emailErr.message);
      }
    }

    let emailMessage = '';
    if (!candidateEmail) {
      emailMessage = 'Candidate has no email address configured.';
    } else if (emailStatus?.success) {
      emailMessage = `Verification email delivered to ${candidateEmail}.`;
    } else {
      emailMessage = `Verification email could not be delivered (${emailStatus?.error || 'unconfigured SMTP'}).`;
    }

    return res.status(201).json({
      success: true,
      message: `Candidate "${newRecord.candidateName}" moved to Onboarding (${newRecord.id}). ${emailMessage}`,
      onboarding: newRecord,
      emailSent: Boolean(emailStatus?.success),
      emailError: emailStatus?.error || (!candidateEmail ? 'No email address on candidate profile' : null)
    });
  } catch (error) {
    console.error('Error creating onboarding:', error);
    return res.status(500).json({ success: false, message: error.message || 'Failed to create onboarding record' });
  }
};

/**
 * @desc    Update onboarding details
 * @route   PUT /api/onboarding/:id
 * @access  Private (Admin)
 */
export const updateOnboarding = async (req, res) => {
  try {
    const { id } = req.params;
    const adminEmail = req.user.email.toLowerCase();
    const companyId = req.headers['x-company-id'] || req.body.companyId;

    if (!companyId) {
      return res.status(400).json({ success: false, message: 'Company ID is required.' });
    }

    const companyIds = await resolveCompanyIds(companyId, adminEmail);

    const record = await Onboarding.findOne({
      companyId: { $in: companyIds },
      adminEmail,
      $or: [
        { id },
        { candidateId: id },
        ...(mongoose.Types.ObjectId.isValid(id) ? [{ _id: id }] : [])
      ]
    });

    if (!record) {
      return res.status(404).json({ success: false, message: 'Onboarding record not found.' });
    }

    delete req.body.companyId;
    delete req.body.adminEmail;

    Object.assign(record, req.body);
    await record.save();

    return res.status(200).json({
      success: true,
      message: `Onboarding details for "${record.candidateName}" updated successfully.`,
      onboarding: record
    });
  } catch (error) {
    console.error('Error updating onboarding:', error);
    return res.status(500).json({ success: false, message: error.message || 'Failed to update onboarding record' });
  }
};

/**
 * @desc    Update onboarding stage
 * @route   PATCH /api/onboarding/:id/stage
 * @access  Private (Admin)
 */
export const updateOnboardingStage = async (req, res) => {
  try {
    const { id } = req.params;
    const { stage } = req.body;
    const adminEmail = req.user.email.toLowerCase();
    const companyId = req.headers['x-company-id'] || req.body.companyId;

    if (!companyId) {
      return res.status(400).json({ success: false, message: 'Company ID is required.' });
    }

    if (!stage) {
      return res.status(400).json({ success: false, message: 'Stage is required.' });
    }

    const companyIds = await resolveCompanyIds(companyId, adminEmail);

    const record = await Onboarding.findOne({
      companyId: { $in: companyIds },
      adminEmail,
      $or: [
        { id },
        { candidateId: id },
        ...(mongoose.Types.ObjectId.isValid(id) ? [{ _id: id }] : [])
      ]
    });

    if (!record) {
      return res.status(404).json({ success: false, message: 'Onboarding record not found.' });
    }

    record.stage = stage;
    await record.save();

    return res.status(200).json({
      success: true,
      message: `Stage updated to "${stage}".`,
      onboarding: record
    });
  } catch (error) {
    console.error('Error updating stage:', error);
    return res.status(500).json({ success: false, message: error.message || 'Failed to update stage' });
  }
};

/**
 * @desc    Convert Onboarding candidate to permanent Employee
 * @route   POST /api/onboarding/:id/convert
 * @access  Private (Admin)
 */
export const convertToEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const adminEmail = req.user.email.toLowerCase();
    const companyId = req.headers['x-company-id'] || req.body.companyId;

    if (!companyId) {
      return res.status(400).json({ success: false, message: 'Company ID is required.' });
    }

    const companyIds = await resolveCompanyIds(companyId, adminEmail);

    const record = await Onboarding.findOne({
      companyId: { $in: companyIds },
      adminEmail,
      $or: [
        { id },
        { candidateId: id },
        ...(mongoose.Types.ObjectId.isValid(id) ? [{ _id: id }] : [])
      ]
    });

    if (!record) {
      return res.status(404).json({ success: false, message: 'Onboarding record not found.' });
    }

    if (record.isConvertedToEmployee) {
      return res.status(400).json({
        success: false,
        message: `Candidate already converted to Employee (${record.createdEmployeeCode})`
      });
    }

    // Generate next Employee Code (e.g., RR-008)
    const existingEmployees = await Employee.find({
      companyId: { $in: companyIds },
      adminEmail
    }).select('employeeId employeeCode');

    let maxNum = 0;
    existingEmployees.forEach((emp) => {
      const code = emp.employeeCode || emp.employeeId || '';
      const match = code.match(/RR-(\d+)/i);
      if (match) {
        const n = parseInt(match[1], 10);
        if (!isNaN(n) && n > maxNum) maxNum = n;
      }
    });

    const nextCode = `RR-${String(maxNum + 1).padStart(3, '0')}`;

    // Lookup company name
    const comp = await Company.findOne({ adminEmail, companyId: { $in: companyIds } }).select('name companyName');
    const compName = comp?.name || comp?.companyName || record.companyName || '';

    // Create Employee record with complete flat & nested fields from candidate's verified dossier
    const basicPay = Math.round((Number(record.offeredSalary) || 18000) * 0.5);
    const hraPay = Math.round((Number(record.offeredSalary) || 18000) * 0.3);
    const specialPay = Math.max(0, (Number(record.offeredSalary) || 18000) - basicPay - hraPay);

    const newEmployee = new Employee({
      employeeId: nextCode,
      employeeCode: nextCode,
      companyId,
      companyName: compName,
      adminEmail,
      name: record.candidateName,
      fatherHusbandName: record.fatherHusbandName || '',
      fatherHusbandRelation: 'Father',
      gender: record.gender || 'Male',
      dob: record.dob || '',
      contact: record.mobile,
      mobile: record.mobile,
      email: record.email || '',
      status: 'Active',
      employeeStatus: 'Active',
      employeeType: 'Permanent',
      department: record.jobCategory || 'Security',
      designation: record.offeredDesignation || record.appliedFor || 'Security Guard',
      siteLocation: record.assignedSite || record.assignedClient || 'Headquarters',
      site: record.assignedSite || record.assignedClient || 'Headquarters',
      clientName: record.assignedClient || compName,
      joiningDate: record.proposedJoiningDate || new Date().toISOString().split('T')[0],
      grossSalary: Number(record.offeredSalary) || 18000,
      basic: basicPay,
      hra: hraPay,
      specialAllowance: specialPay,
      salaryType: 'Monthly',
      salaryStructureType: 'Regular',
      bankName: record.bankName || record.documents?.bankProof?.bankName || '',
      accountNumber: record.accountNumber || record.documents?.bankProof?.accountNumber || '',
      ifsc: record.ifsc || record.documents?.bankProof?.ifsc || '',
      accountHolder: record.accountHolder || record.candidateName,
      paymentMode: 'Bank Transfer',
      aadhaar: record.aadhaar || record.documents?.aadhaar?.number || '',
      pan: record.pan || record.documents?.pan?.number || '',
      presentAddress: record.presentAddress || record.address || '',
      permanentAddress: record.permanentAddress || record.presentAddress || record.address || '',
      address: record.presentAddress || record.address || '',
      photo: record.photo || '',
      employeePhoto: record.photo || '',
      documents: record.documents || {},
      employmentDetails: {
        designation: record.offeredDesignation || record.appliedFor || 'Security Guard',
        department: record.jobCategory || 'Security',
        joiningDate: record.proposedJoiningDate || new Date().toISOString().split('T')[0],
        workLocation: record.assignedSite || record.assignedClient || 'Headquarters'
      },
      salaryDetails: {
        basicSalary: basicPay,
        grossSalary: Number(record.offeredSalary) || 18000
      },
      bankDetails: {
        bankName: record.bankName || record.documents?.bankProof?.bankName || '',
        accountNumber: record.accountNumber || record.documents?.bankProof?.accountNumber || '',
        ifscCode: record.ifsc || record.documents?.bankProof?.ifsc || ''
      },
      statutoryDetails: {
        aadhaarNumber: record.aadhaar || record.documents?.aadhaar?.number || '',
        panNumber: record.pan || record.documents?.pan?.number || ''
      }
    });

    await newEmployee.save();

    // Mark onboarding as completed
    record.isConvertedToEmployee = true;
    record.createdEmployeeCode = nextCode;
    record.stage = 'completed';
    await record.save();

    return res.status(200).json({
      success: true,
      message: `Candidate converted to Employee successfully! Employee ID: ${nextCode}`,
      employee: newEmployee,
      onboarding: record
    });
  } catch (error) {
    console.error('Error converting candidate to employee:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to convert candidate to employee'
    });
  }
};

/**
 * @desc    Delete onboarding record
 * @route   DELETE /api/onboarding/:id
 * @access  Private (Admin)
 */
export const deleteOnboarding = async (req, res) => {
  try {
    const { id } = req.params;
    const adminEmail = req.user.email.toLowerCase();
    const companyId = req.headers['x-company-id'] || req.query.companyId;

    if (!companyId) {
      return res.status(400).json({ success: false, message: 'Company ID is required.' });
    }

    const companyIds = await resolveCompanyIds(companyId, adminEmail);

    const deleted = await Onboarding.findOneAndDelete({
      companyId: { $in: companyIds },
      adminEmail,
      $or: [
        { id },
        { candidateId: id },
        ...(mongoose.Types.ObjectId.isValid(id) ? [{ _id: id }] : [])
      ]
    });

    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Onboarding record not found.' });
    }

    return res.status(200).json({
      success: true,
      message: `Onboarding candidate "${deleted.candidateName}" deleted successfully.`
    });
  } catch (error) {
    console.error('Error deleting onboarding candidate:', error);
    return res.status(500).json({ success: false, message: error.message || 'Failed to delete onboarding candidate' });
  }
};

/**
 * @desc    Public endpoint for candidate to view their onboarding dossier
 * @route   GET /api/onboarding/public/:id
 * @access  Public
 */
export const getPublicOnboardingById = async (req, res) => {
  try {
    const { id } = req.params;
    const cleanId = (id || '').trim();
    const idRegex = new RegExp(`^${cleanId}$`, 'i');

    let record = await Onboarding.findOne({
      $or: [
        { id: idRegex },
        { candidateId: idRegex },
        ...(mongoose.Types.ObjectId.isValid(cleanId) ? [{ _id: cleanId }] : [])
      ]
    });

    // Auto-heal: If onboarding record was not created (e.g. earlier save error), find from Candidate
    if (!record) {
      const cand = await Candidate.findOne({
        $or: [
          { id: idRegex },
          { candidateId: idRegex },
          { id: new RegExp(`^${cleanId.replace(/^ONB-/i, 'CAN-')}$`, 'i') },
          { candidateId: new RegExp(`^${cleanId.replace(/^ONB-/i, 'CAN-')}$`, 'i') }
        ]
      });

      if (cand) {
        const fullAddr = [cand.address, cand.city, cand.state ? `${cand.state}${cand.pincode ? ` - ${cand.pincode}` : ''}` : ''].filter(Boolean).join(', ');
        record = new Onboarding({
          id: cleanId.toUpperCase().startsWith('ONB-') ? cleanId.toUpperCase() : `ONB-${new Date().getFullYear()}-001`,
          companyId: cand.companyId,
          companyName: cand.companyName || '',
          adminEmail: cand.adminEmail,
          candidateId: cand.id || cand.candidateId,
          candidateName: cand.name,
          mobile: cand.mobile || '',
          email: cand.email || '',
          jobCategory: cand.jobCategory || 'Security Guard',
          appliedFor: cand.appliedFor || 'Security Guard',
          offeredSalary: Number(cand.expectedSalary || 18000),
          offeredDesignation: cand.appliedFor || 'Security Guard',
          proposedJoiningDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
          assignedClient: 'Corporate Office / Main Site',
          assignedSite: 'Main Gate Security Post',
          assignedShift: 'Day Shift (08:00 AM - 08:00 PM)',
          stage: 'document_verification',
          photo: cand.photo || '',
          presentAddress: fullAddr || cand.address || '',
          address: cand.address || '',
          city: cand.city || '',
          state: cand.state || '',
          pincode: cand.pincode || '',
          dob: cand.dob || '',
          gender: cand.gender || 'Male',
          fatherHusbandName: cand.fatherHusbandName || cand.fatherName || '',
          linkExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
          invitationSentAt: new Date(),
          documents: {
            aadhaar: { status: 'Uploaded', number: '', documentName: 'Aadhaar Card' },
            pan: { status: 'Uploaded', number: '', documentName: 'PAN Card' },
            bankProof: { status: 'Pending', bankName: '', ifsc: '', accountNumber: '', documentName: 'Bank Passbook / Cheque' },
            policeVerification: { status: 'Pending', refNo: '', clearanceDate: '', documentName: 'Police Verification' },
            educationCertificate: { status: 'Uploaded', documentName: 'Educational Certificate' },
            experienceRelieving: { status: cand.experience === 'Experienced' ? 'Uploaded' : 'N/A', documentName: 'Previous Relieving Letter' }
          },
          uniformKit: {
            shirtSize: 'M (40)',
            trouserSize: '32',
            bootSize: '8'
          }
        });
        await record.save();
      }
    }

    if (!record) {
      return res.status(404).json({ success: false, message: 'Onboarding record not found.' });
    }

    // Check 24-hour link expiration
    if (record.linkExpiresAt && new Date() > new Date(record.linkExpiresAt)) {
      return res.status(410).json({
        success: false,
        expired: true,
        candidateName: record.candidateName,
        id: record.id,
        message: 'This onboarding verification link has expired (24-hour limit exceeded). Please contact HR for a new link.'
      });
    }

    // Populate candidate address if not yet copied
    if (!record.presentAddress && record.candidateId) {
      const cand = await Candidate.findOne({
        $or: [{ id: record.candidateId }, { candidateId: record.candidateId }]
      });
      if (cand) {
        const fullAddr = [cand.address, cand.city, cand.state ? `${cand.state}${cand.pincode ? ` - ${cand.pincode}` : ''}` : ''].filter(Boolean).join(', ');
        record.presentAddress = fullAddr || cand.address || '';
        record.address = cand.address || '';
        record.city = cand.city || '';
        record.state = cand.state || '';
        record.pincode = cand.pincode || '';
        if (!record.dob && cand.dob) record.dob = cand.dob;
        if (!record.gender && cand.gender) record.gender = cand.gender;
        await record.save();
      }
    }

    return res.status(200).json({ success: true, onboarding: record });
  } catch (error) {
    console.error('Error fetching public onboarding:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch onboarding record' });
  }
};

/**
 * @desc    Public endpoint for candidate to submit documents & details
 * @route   POST /api/onboarding/public/:id/submit
 * @access  Public
 */
export const submitPublicOnboarding = async (req, res) => {
  try {
    const { id } = req.params;
    const cleanId = (id || '').trim();
    const idRegex = new RegExp(`^${cleanId}$`, 'i');

    const record = await Onboarding.findOne({
      $or: [
        { id: idRegex },
        { candidateId: idRegex },
        ...(mongoose.Types.ObjectId.isValid(cleanId) ? [{ _id: cleanId }] : [])
      ]
    });

    if (!record) {
      return res.status(404).json({ success: false, message: 'Onboarding record not found.' });
    }

    // Check 24-hour link expiration
    if (record.linkExpiresAt && new Date() > new Date(record.linkExpiresAt)) {
      return res.status(410).json({
        success: false,
        expired: true,
        candidateName: record.candidateName,
        id: record.id,
        message: 'This onboarding verification link has expired (24-hour limit exceeded). Please contact HR for a new link.'
      });
    }

    const submission = req.body;
    if (submission.fatherHusbandName) record.fatherHusbandName = submission.fatherHusbandName.trim();
    if (submission.dob) record.dob = submission.dob;
    if (submission.gender) record.gender = submission.gender;
    if (submission.employeePhoto) record.photo = submission.employeePhoto;

    record.selfSubmitted = true;
    record.selfSubmittedAt = new Date();

    // Update Aadhaar
    if (submission.aadhaar || submission.aadhaarFrontPhoto || submission.aadhaarBackPhoto) {
      record.aadhaar = submission.aadhaar || record.aadhaar || '';
      record.documents.aadhaar = {
        status: 'Uploaded',
        number: submission.aadhaar || record.documents?.aadhaar?.number || '',
        photoFront: submission.aadhaarFrontPhoto || record.documents?.aadhaar?.photoFront || '',
        photoBack: submission.aadhaarBackPhoto || record.documents?.aadhaar?.photoBack || '',
        documentName: 'Aadhaar Card'
      };
    }

    // Update PAN
    if (submission.pan || submission.panPhoto) {
      record.pan = submission.pan || record.pan || '';
      record.documents.pan = {
        status: 'Uploaded',
        number: submission.pan || record.documents?.pan?.number || '',
        photo: submission.panPhoto || record.documents?.pan?.photo || '',
        documentName: 'PAN Card'
      };
    }

    // Update Bank Details
    if (submission.accountNumber || submission.bankPassbookPhoto || submission.bankName || submission.ifsc) {
      record.bankName = submission.bankName || record.bankName || '';
      record.accountNumber = submission.accountNumber || record.accountNumber || '';
      record.ifsc = submission.ifsc || record.ifsc || '';
      record.accountHolder = submission.accountHolder || submission.name || record.candidateName;

      record.documents.bankProof = {
        status: 'Uploaded',
        bankName: submission.bankName || record.documents?.bankProof?.bankName || '',
        accountNumber: submission.accountNumber || record.documents?.bankProof?.accountNumber || '',
        ifsc: submission.ifsc || record.documents?.bankProof?.ifsc || '',
        photo: submission.bankPassbookPhoto || record.documents?.bankProof?.photo || '',
        documentName: 'Bank Passbook / Cheque'
      };
    }

    // Update Uniform Kit
    if (submission.shirtSize || submission.bootSize) {
      record.uniformKit = {
        ...record.uniformKit,
        shirtSize: submission.shirtSize || record.uniformKit?.shirtSize || '',
        bootSize: submission.bootSize || record.uniformKit?.bootSize || ''
      };
    }

    if (record.stage === 'offer_accepted') {
      record.stage = 'document_verification';
    }

    await record.save();

    return res.status(200).json({
      success: true,
      message: 'Documents and verification submitted successfully. Dossier is now ready for HR review.',
      onboarding: record
    });
  } catch (error) {
    console.error('Error submitting public onboarding:', error);
    return res.status(500).json({ success: false, message: 'Failed to submit onboarding dossier' });
  }
};

/**
 * @desc    Send or Resend Onboarding Invitation Email to Candidate
 * @route   POST /api/onboarding/:id/send-invite
 * @access  Private (Admin)
 */
export const sendOnboardingInvite = async (req, res) => {
  try {
    const { id } = req.params;
    const adminEmail = req.user.email.toLowerCase();
    const companyId = req.headers['x-company-id'] || req.body.companyId;

    if (!companyId) {
      return res.status(400).json({ success: false, message: 'Company ID is required.' });
    }

    const companyIds = await resolveCompanyIds(companyId, adminEmail);

    const record = await Onboarding.findOne({
      companyId: { $in: companyIds },
      adminEmail,
      $or: [
        { id },
        { candidateId: id },
        ...(mongoose.Types.ObjectId.isValid(id) ? [{ _id: id }] : [])
      ]
    });

    if (!record) {
      return res.status(404).json({ success: false, message: 'Onboarding record not found.' });
    }

    // Refresh 24-hour expiration window when sending/resending invite
    record.linkExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    record.invitationSentAt = new Date();
    await record.save();

    const targetEmail = (req.body.email || record.email || '').trim();
    if (!targetEmail) {
      return res.status(400).json({ success: false, message: 'Candidate does not have a registered email address.' });
    }

    const comp = await Company.findOne({ adminEmail, companyId: { $in: companyIds } }).lean();
    const compName = comp?.name || comp?.companyName || record.companyName || 'RR Security & Facilities';

    const clientBaseUrl = (process.env.CLIENT_URL || process.env.FRONTEND_URL || req.headers?.origin || 'http://localhost:5173').replace(/\/+$/, '');
    const onboardingUrl = `${clientBaseUrl}/onboard/${record.id}`;

    const emailResult = await sendOnboardingInvitationEmail({
      to: targetEmail,
      candidateName: record.candidateName,
      role: record.appliedFor || record.jobCategory,
      companyName: compName,
      onboardingUrl,
      joiningDate: record.proposedJoiningDate || 'Upcoming',
      refId: record.id,
      assignedClient: record.assignedClient || 'Main Site',
      companyId: comp?.companyId || companyId,
      customConfig: comp?.preferences?.emailConfig
    });

    return res.status(200).json({
      success: true,
      message: `Onboarding verification link successfully sent to ${targetEmail}!`,
      emailResult,
      onboardingUrl
    });
  } catch (error) {
    console.error('Error sending onboarding invite:', error);
    return res.status(500).json({ success: false, message: error.message || 'Failed to send invitation email' });
  }
};

