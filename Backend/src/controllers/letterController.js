import mongoose from 'mongoose';
import Letter from '../models/letterModel.js';
import LetterTemplate from '../models/letterTemplateModel.js';
import Employee from '../models/employeeModel.js';
import Company from '../models/companyModel.js';

// Default templates content
export const DEFAULT_LETTER_TEMPLATES = {
  'appointment-letter': {
    templateName: 'Standard Executive Appointment Letter',
    headerTitle: 'APPOINTMENT LETTER',
    subject: 'Offer of Appointment for the position of {{designation}}',
    content: `Dear {{employeeName}} {{employeeCode}},

We are pleased to offer you an appointment with {{companyName}} for the position of {{designation}} in our {{department}} department, based at {{location}}.

Your date of joining will be {{joiningDate}}.

1. REMUNERATION & BENEFITS
Your Total Annual Cost to Company (CTC) will be {{ctc}} (Monthly Gross Salary of {{salary}}), subject to statutory tax deductions and standard company payroll policies. Detailed breakdown is enclosed in Annexure A.

2. PROBATION & CONFIRMATION
You will be on probation for a period of {{probationPeriod}} from the date of joining. Upon satisfactory evaluation of your performance, your employment will be confirmed in writing.

3. WORKING HOURS & DUTY ASSIGNMENT
Your standard working schedule is {{workingHours}}. Given operational requirements, you may be deployed on rotational shifts as communicated by your reporting officer {{reportingManager}}.

4. NOTICE PERIOD & TERMINATION
During probation, either party may terminate employment by providing 15 days written notice. Post confirmation, the notice period required is {{noticePeriod}}.

Please sign and return the duplicate copy of this letter as confirmation of your acceptance.

We welcome you to {{companyName}} and look forward to a rewarding association.

Sincerely,
For {{companyName}},

{{signatoryName}}
{{signatoryDesignation}}`
  },
  'joining-letter': {
    templateName: 'Official Employee Joining Letter',
    headerTitle: 'JOINING & ONBOARDING',
    subject: 'Joining Confirmation - Employee ID: {{employeeCode}}',
    content: `To,
{{employeeName}}
Employee ID: {{employeeCode}}
Designation: {{designation}}
Department: {{department}}

Dear {{employeeName}},

This is to officially confirm your joining at {{companyName}} on {{joiningDate}} as {{designation}}.

You will be stationed at our site/branch located at {{location}} and will report directly to {{reportingManager}}.

Terms of Onboarding:
• Verification of background check and submitted statutory documents.
• Adherence to the company code of conduct, dress code, and confidentiality protocols.
• Standard duty roster schedule: {{workingHours}}.

We are confident that your expertise will be a significant contribution to our organization.

Authorized By:
{{signatoryName}}
{{signatoryDesignation}}
{{companyName}}`
  },
  'experience-letter': {
    templateName: 'Standard Service & Experience Certificate',
    headerTitle: 'EXPERIENCE CERTIFICATE',
    subject: 'Service & Experience Certificate - {{employeeName}}',
    content: `Date: {{currentDate}}

TO WHOMSOEVER IT MAY CONCERN

This is to certify that {{employeeName}} (Employee Code: {{employeeCode}}) was employed with {{companyName}} from {{joiningDate}} to {{lastWorkingDate}}.

During this tenure, {{employeeName}} worked as {{designation}} in the {{department}} department based out of {{location}}.

During the term of employment, {{employeeName}} performed the assigned operational duties with sincere commitment, professional diligence, and high integrity. Conduct with colleagues, supervisors, and clients was commendable.

{{employeeName}} has been relieved of all official duties on {{lastWorkingDate}} after successful handover of company assets and clearance of accounts.

We wish {{employeeName}} every success in all future professional endeavors.

For {{companyName}},

{{signatoryName}}
{{signatoryDesignation}}`
  },
  'full-final-letter': {
    templateName: 'Full & Final Settlement Clearance',
    headerTitle: 'FULL & FINAL SETTLEMENT',
    subject: 'Final Settlement Voucher - {{employeeName}} ({{employeeCode}})',
    content: `Date: {{currentDate}}

FULL & FINAL SETTLEMENT CLEARANCE

Employee Name: {{employeeName}}
Employee Code: {{employeeCode}}
Department: {{department}}
Designation: {{designation}}
Date of Joining: {{joiningDate}}
Date of Leaving: {{lastWorkingDate}}

SETTLEMENT SUMMARY:
------------------------------------------------------------
A. EARNINGS & ACCRUALS:
   1. Unpaid Salary / Earned Days
   2. Leave Encashment
   3. Gratuity / Statutory Bonus (if applicable)
   4. Approved Expense Reimbursements

B. DEDUCTIONS & RECOVERIES:
   1. Statutory Deductions (PF / PT / TDS)
   2. Asset Clearance / ID Recovery
   3. Notice Period Recovery (if applicable)

NET PAYABLE SETTLEMENT AMOUNT: {{settlementAmount}}
------------------------------------------------------------

DECLARATION & RECEIPT:
I, {{employeeName}}, hereby acknowledge receipt of the final settlement amount and confirm that I have no outstanding claims, financial dues, or grievances against {{companyName}}.

Employee Signature: _______________________      Date: ______________

Authorized Signatory:
{{signatoryName}}
{{signatoryDesignation}}
{{companyName}}`
  }
};

function formatDateDisplay(dateVal) {
  if (!dateVal) return '';
  const str = String(dateVal).trim();
  if (/\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\b/i.test(str)) return str;
  const d = new Date(str);
  if (isNaN(d.getTime())) return str;
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

// Helper to fill placeholders
function renderTemplateContent(templateStr, data, company) {
  if (!templateStr) return '';
  const compName = company?.name || company?.companyName || 'RR Security & Facilities';
  const compAddress = company?.address || 'Sector 18, Gurugram, Haryana - 122008';
  const compEmail = company?.email || 'admin@rrsecurity.com';
  const compPhone = company?.phone || '+91 9876543210';
  const compGstin = company?.gstin || '';
  const compPan = company?.pan || '';

  const placeholders = {
    '{{companyName}}': compName,
    '{{companyAddress}}': compAddress,
    '{{companyEmail}}': compEmail,
    '{{companyPhone}}': compPhone,
    '{{companyGstin}}': compGstin,
    '{{companyPan}}': compPan,
    '{{currentDate}}': formatDateDisplay(data.issueDate) || new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
    '{{employeeName}}': data.employeeName || '',
    '{{employeeCode}}': data.employeeCode || data.employeeId || '',
    '{{designation}}': data.designation || '',
    '{{department}}': data.department || '',
    '{{location}}': data.location || 'Corporate Office',
    '{{reportingManager}}': data.reportingManager || '',
    '{{joiningDate}}': formatDateDisplay(data.joiningDate) || formatDateDisplay(data.issueDate) || '',
    '{{lastWorkingDate}}': formatDateDisplay(data.lastWorkingDate) || (data.letterType === 'experience-letter' ? formatDateDisplay(data.issueDate) : '') || '',
    '{{salary}}': data.salary || '',
    '{{ctc}}': data.ctc || '',
    '{{probationPeriod}}': data.probationPeriod || '6 Months',
    '{{noticePeriod}}': data.noticePeriod || '30 Days',
    '{{workingHours}}': data.workingHours || '9:00 AM - 6:00 PM',
    '{{signatoryName}}': data.signatoryName || '',
    '{{signatoryDesignation}}': data.signatoryDesignation || '',
    '{{settlementAmount}}': data.settlementAmount || ''
  };

  let rendered = templateStr;
  Object.entries(placeholders).forEach(([key, val]) => {
    rendered = rendered.split(key).join(val || '');
  });

  // Sanitize any remaining raw ISO dates into formatted string (DD Mon YYYY)
  rendered = rendered.replace(/\b(\d{4}-\d{2}-\d{2})\b/g, (match, dateStr) => {
    return formatDateDisplay(dateStr);
  });

  return rendered;
}

/**
 * @desc Get all issued letters with stats & filters
 * @route GET /api/letters
 */
export const getLetters = async (req, res) => {
  try {
    const companyId = req.headers['x-company-id'] || req.query.companyId || 'comp_rr_security';

    // Purge any previously auto-seeded mock records so only real user-created letters exist
    await Letter.deleteMany({
      companyId,
      $or: [
        { letterId: { $regex: '^let-seed-' } },
        { refNo: { $in: ['NS/APPT/2026/0142', 'NS/JOIN/2026/0091', 'NS/APPT/2026/0143', 'NS/JOIN/2026/0092', 'NS/EXP/2026/0034', 'NS/FNF/2026/0012', 'NS/EXP/2026/0035', 'NS/APPT/2026/0144'] } }
      ]
    });

    // Build filter
    const filter = { companyId };
    if (req.query.type && req.query.type !== 'all') {
      filter.letterType = req.query.type;
    }
    if (req.query.status && req.query.status !== 'All') {
      filter.status = req.query.status;
    }
    if (req.query.department && req.query.department !== 'All') {
      filter.department = req.query.department;
    }
    if (req.query.search) {
      const q = req.query.search.trim();
      filter.$or = [
        { employeeName: { $regex: q, $options: 'i' } },
        { employeeCode: { $regex: q, $options: 'i' } },
        { refNo: { $regex: q, $options: 'i' } },
        { designation: { $regex: q, $options: 'i' } },
        { department: { $regex: q, $options: 'i' } }
      ];
    }

    const letters = await Letter.find(filter).sort({ createdAt: -1 }).lean();

    // Compute stats
    const allForCompany = await Letter.find({ companyId }).lean();
    const stats = {
      total: allForCompany.length,
      appointment: allForCompany.filter(l => l.letterType === 'appointment-letter').length,
      joining: allForCompany.filter(l => l.letterType === 'joining-letter').length,
      experience: allForCompany.filter(l => l.letterType === 'experience-letter').length,
      fullFinal: allForCompany.filter(l => l.letterType === 'full-final-letter').length
    };

    return res.status(200).json({
      success: true,
      count: letters.length,
      stats,
      letters
    });
  } catch (error) {
    console.error('Error fetching letters:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch letter records.',
      error: error.message
    });
  }
};

/**
 * @desc Get single letter by ID
 * @route GET /api/letters/:id
 */
export const getLetterById = async (req, res) => {
  try {
    const { id } = req.params;
    const filter = mongoose.Types.ObjectId.isValid(id)
      ? { $or: [{ _id: id }, { letterId: id }] }
      : { letterId: id };

    const letter = await Letter.findOne(filter).lean();

    if (!letter) {
      return res.status(404).json({ success: false, message: 'Letter not found.' });
    }

    return res.status(200).json({ success: true, letter });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * @desc Create / Generate a new letter using respective template
 * @route POST /api/letters
 */
export const createLetter = async (req, res) => {
  try {
    const companyId = req.headers['x-company-id'] || req.body.companyId || 'comp_rr_security';
    const payload = req.body;

    if (!payload.letterType) {
      return res.status(400).json({ success: false, message: 'letterType is required.' });
    }
    if (!payload.employeeName) {
      return res.status(400).json({ success: false, message: 'employeeName is required.' });
    }

    // Resolve company
    const company = await Company.findOne({
      $or: [{ companyId }, { id: companyId }]
    }).lean();

    // Fetch active template from DB or fallback to default
    let template = await LetterTemplate.findOne({
      companyId,
      letterType: payload.letterType
    }).lean();

    if (!template) {
      template = DEFAULT_LETTER_TEMPLATES[payload.letterType] || {};
    }

    // Auto-generate Reference Number if not supplied
    let refNo = payload.refNo;
    if (!refNo) {
      const codeMap = {
        'appointment-letter': 'APPT',
        'joining-letter': 'JOIN',
        'experience-letter': 'EXP',
        'full-final-letter': 'FNF'
      };
      const typeCode = codeMap[payload.letterType] || 'GEN';
      const year = new Date().getFullYear();
      const existingCount = await Letter.countDocuments({ companyId, letterType: payload.letterType });
      const seq = String(existingCount + 1).padStart(4, '0');
      refNo = `NS/${typeCode}/${year}/${seq}`;
    }

    // If content not provided, render from template
    const templateName = payload.templateName || template.templateName || '';
    const rawContent = payload.content || template.content || '';
    const renderedContent = renderTemplateContent(rawContent, payload, company);
    const subject = payload.subject || renderTemplateContent(template.subject || '', payload, company);
    const headerTitle = payload.headerTitle || template.headerTitle || 'OFFICIAL LETTER';

    const newLetter = new Letter({
      letterId: `let-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      companyId,
      refNo,
      letterType: payload.letterType,
      templateName,
      employeeId: payload.employeeId || payload.employeeCode || 'EMP',
      employeeName: payload.employeeName,
      employeeCode: payload.employeeCode || payload.employeeId || 'EMP',
      designation: payload.designation || '',
      department: payload.department || '',
      location: payload.location || '',
      issueDate: payload.issueDate || new Date().toISOString().split('T')[0],
      joiningDate: payload.joiningDate || '',
      lastWorkingDate: payload.lastWorkingDate || '',
      ctc: payload.ctc || '',
      salary: payload.salary || '',
      settlementAmount: payload.settlementAmount || '',
      probationPeriod: payload.probationPeriod || '6 Months',
      noticePeriod: payload.noticePeriod || '30 Days',
      workingHours: payload.workingHours || '9:00 AM - 6:00 PM',
      reportingManager: payload.reportingManager || '',
      signatoryName: payload.signatoryName || 'Amitabh Sharma',
      signatoryDesignation: payload.signatoryDesignation || 'Director - HR',
      status: payload.status || 'Issued',
      subject,
      headerTitle,
      content: renderedContent,
      metadata: payload.metadata || {}
    });

    await newLetter.save();

    return res.status(201).json({
      success: true,
      message: 'Letter generated and saved successfully.',
      letter: newLetter
    });
  } catch (error) {
    console.error('Error generating letter:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate letter.',
      error: error.message
    });
  }
};

/**
 * @desc Update letter details or status
 * @route PUT /api/letters/:id
 */
export const updateLetter = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const filter = mongoose.Types.ObjectId.isValid(id)
      ? { $or: [{ _id: id }, { letterId: id }] }
      : { letterId: id };

    const letter = await Letter.findOne(filter);

    if (!letter) {
      return res.status(404).json({ success: false, message: 'Letter not found.' });
    }

    Object.keys(updates).forEach(key => {
      if (key !== '_id' && key !== 'letterId' && updates[key] !== undefined) {
        letter[key] = updates[key];
      }
    });

    await letter.save();

    return res.status(200).json({
      success: true,
      message: 'Letter updated successfully.',
      letter
    });
  } catch (error) {
    console.error('Error updating letter:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update letter.',
      error: error.message
    });
  }
};

/**
 * @desc Delete letter
 * @route DELETE /api/letters/:id
 */
export const deleteLetter = async (req, res) => {
  try {
    const { id } = req.params;
    const filter = mongoose.Types.ObjectId.isValid(id)
      ? { $or: [{ _id: id }, { letterId: id }] }
      : { letterId: id };

    const deleted = await Letter.findOneAndDelete(filter);

    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Letter not found.' });
    }

    return res.status(200).json({
      success: true,
      message: 'Letter deleted successfully.'
    });
  } catch (error) {
    console.error('Error deleting letter:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete letter.',
      error: error.message
    });
  }
};

/**
 * @desc Get company letter templates
 * @route GET /api/letters/templates
 */
export const getLetterTemplates = async (req, res) => {
  try {
    const companyId = req.headers['x-company-id'] || req.query.companyId || 'comp_rr_security';
    const templatesInDb = await LetterTemplate.find({ companyId }).lean();

    const merged = { ...DEFAULT_LETTER_TEMPLATES };
    templatesInDb.forEach(t => {
      merged[t.letterType] = {
        templateName: t.templateName,
        headerTitle: t.headerTitle,
        subject: t.subject,
        content: t.content,
        status: t.status,
        isDefault: t.isDefault
      };
    });

    return res.status(200).json({
      success: true,
      templates: merged
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * @desc Save / Update company letter template
 * @route POST /api/letters/templates
 */
export const saveLetterTemplate = async (req, res) => {
  try {
    const companyId = req.headers['x-company-id'] || req.body.companyId || 'comp_rr_security';
    const { letterType, templateName, headerTitle, subject, content, status } = req.body;

    if (!letterType) {
      return res.status(400).json({ success: false, message: 'letterType is required.' });
    }

    const template = await LetterTemplate.findOneAndUpdate(
      { companyId, letterType },
      {
        templateId: `tpl-${companyId}-${letterType}`,
        companyId,
        letterType,
        templateName: templateName || DEFAULT_LETTER_TEMPLATES[letterType]?.templateName || 'Template',
        headerTitle: headerTitle || DEFAULT_LETTER_TEMPLATES[letterType]?.headerTitle || '',
        subject: subject || DEFAULT_LETTER_TEMPLATES[letterType]?.subject || '',
        content: content || DEFAULT_LETTER_TEMPLATES[letterType]?.content || '',
        status: status || 'Active',
        isDefault: true
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return res.status(200).json({
      success: true,
      message: 'Template configuration saved successfully.',
      template
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};
