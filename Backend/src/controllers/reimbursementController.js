import { ReimbursementClaim, ExpenseType } from '../models/reimbursementModel.js';
import Employee from '../models/employeeModel.js';
import { createSystemNotification } from './notificationController.js';

const DEFAULT_EXPENSE_TYPES = [
  { name: 'Travel / Conveyance', code: 'TRV', category: 'Travel', maxLimit: 15000, requiresReceipt: true, taxExempt: true, status: 'Active', description: 'Fuel, cab, public transit, and travel expenses incurred during official duty.' },
  { name: 'Mobile / Internet', code: 'MOB', category: 'Utilities', maxLimit: 3000, requiresReceipt: true, taxExempt: true, status: 'Active', description: 'Monthly phone bill and broadband internet expenses for communication.' },
  { name: 'Food & Meals', code: 'FOD', category: 'Meals', maxLimit: 5000, requiresReceipt: true, taxExempt: false, status: 'Active', description: 'Meal allowance during overtime, client meetings, or off-site assignments.' },
  { name: 'Client Entertainment', code: 'ENT', category: 'Business', maxLimit: 20000, requiresReceipt: true, taxExempt: false, status: 'Active', description: 'Client meeting expenses, lunches, and hospitality.' },
  { name: 'Uniform & Safety Gear', code: 'UNI', category: 'Operations', maxLimit: 10000, requiresReceipt: true, taxExempt: true, status: 'Active', description: 'Security uniform replacements, safety boots, torches, and equipment.' },
  { name: 'Office Supplies & Courier', code: 'OFF', category: 'Admin', maxLimit: 5000, requiresReceipt: true, taxExempt: true, status: 'Active', description: 'Stationery, site registers, courier and postal dispatches.' },
  { name: 'Medical / Emergency', code: 'MED', category: 'Health', maxLimit: 25000, requiresReceipt: true, taxExempt: true, status: 'Active', description: 'Emergency medical aid, first aid consumables, and duty accident care.' },
  { name: 'Relocation / Transfer', code: 'REL', category: 'Travel', maxLimit: 50000, requiresReceipt: true, taxExempt: true, status: 'Active', description: 'Site relocation allowance, packing, and temporary transit lodging.' },
];

/**
 * Helper to generate sequential Claim ID: CLM-YYYY-XXX
 */
const generateClaimId = async (companyId) => {
  const currentYear = new Date().getFullYear();
  const count = await ReimbursementClaim.countDocuments({
    companyId,
    claimId: new RegExp(`^CLM-${currentYear}-`, 'i'),
  });
  return `CLM-${currentYear}-${String(count + 1).padStart(3, '0')}`;
};

/**
 * @desc    Get all reimbursement claims for company (with filters)
 * @route   GET /api/reimbursements
 * @access  Private
 */
export const getReimbursementClaims = async (req, res) => {
  try {
    const user = req.user;
    const companyId = req.headers['x-company-id'] || req.query.companyId || user.companyId || 'RRS8392014SEC';
    const { status, paymentStatus, department, site, expenseType, month, search, employeeId } = req.query;

    const query = { companyId };

    // Employee isolation: If employee logs in, only view own claims
    if (user.role === 'employee') {
      const empId = user.employeeId || user.id;
      if (empId) {
        query.employeeId = empId;
      }
    } else if (employeeId) {
      query.employeeId = employeeId;
    }

    if (status && status !== 'All') {
      query.approvalStatus = status;
    }

    if (paymentStatus && paymentStatus !== 'All') {
      query.paymentStatus = paymentStatus;
    }

    if (department && department !== 'All') {
      query.department = department;
    }

    if (site && site !== 'All') {
      query.site = site;
    }

    if (expenseType && expenseType !== 'All') {
      query.expenseType = expenseType;
    }

    if (month) {
      query.expenseDate = { $regex: new RegExp(`^${month}`, 'i') };
    }

    if (search) {
      const s = search.trim();
      const regex = new RegExp(s, 'i');
      query.$or = [
        { claimId: regex },
        { employeeId: regex },
        { employeeCode: regex },
        { employeeName: regex },
        { expenseType: regex },
        { merchantName: regex },
        { description: regex },
      ];
    }

    const claims = await ReimbursementClaim.find(query).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: claims.length,
      claims: claims.map((c) => c.toJSON()),
    });
  } catch (error) {
    console.error('Error fetching reimbursement claims:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve reimbursement claims from database.',
      error: error.message,
    });
  }
};

/**
 * @desc    Create new reimbursement claim
 * @route   POST /api/reimbursements
 * @access  Private
 */
export const createReimbursementClaim = async (req, res) => {
  try {
    const user = req.user;
    const companyId = req.headers['x-company-id'] || req.body.companyId || user.companyId || 'RRS8392014SEC';
    const adminEmail = user?.email || 'admin@rrsecurity.com';
    const data = req.body;

    // Resolve employee details
    let empCode = data.employeeCode || data.employeeId || '';
    let empName = data.employeeName || '';
    let dept = data.department || 'Security';
    let desig = data.designation || 'Staff';
    let site = data.site || 'Main Site';
    let clientName = data.clientName || 'RR Security';

    if (data.employeeId) {
      const emp = await Employee.findOne({
        $or: [
          { employeeId: data.employeeId },
          { _id: data.employeeId },
        ],
      });
      if (emp) {
        empCode = emp.employeeId || emp.employeeCode || empCode;
        empName = emp.name || empName;
        dept = emp.department || dept;
        desig = emp.designation || desig;
        site = emp.site || emp.siteLocation || site;
        clientName = emp.clientName || emp.companyName || clientName;
      }
    }

    const claimId = data.claimId || await generateClaimId(companyId);
    const claimedAmt = Number(data.claimedAmount) || 0;
    const expenseDate = data.expenseDate || new Date().toISOString().slice(0, 10);
    const claimMonth = expenseDate ? expenseDate.slice(0, 7) : new Date().toISOString().slice(0, 7);
    const claimYear = Number(claimMonth.split('-')[0]) || new Date().getFullYear();

    const newClaim = await ReimbursementClaim.create({
      companyId,
      adminEmail,
      claimId,
      employeeId: data.employeeId || empCode,
      employeeCode: empCode,
      employeeName: empName,
      department: dept,
      designation: desig,
      site,
      clientName,
      expenseType: data.expenseType || 'General Expense',
      expenseCategory: data.expenseCategory || 'Operations',
      expenseDate,
      claimMonth,
      claimYear,
      claimedAmount: claimedAmt,
      approvedAmount: data.approvedAmount !== undefined ? Number(data.approvedAmount) : 0,
      description: data.description || '',
      receiptNumber: data.receiptNumber || '',
      merchantName: data.merchantName || '',
      billAttachmentUrl: data.billAttachmentUrl || '',
      receiptsCount: data.receiptsCount || 1,
      approvalStatus: data.approvalStatus || 'Pending Approval',
      paymentStatus: 'Unpaid',
      paymentMethod: '—',
      auditTrail: [
        {
          action: 'Claim Submitted',
          by: user?.name || user?.email || 'Employee / Admin',
          date: new Date().toISOString().slice(0, 10),
          notes: `Expense of ₹${claimedAmt.toLocaleString('en-IN')} submitted for ${data.expenseType}.`,
        },
      ],
    });

    // Dynamically notify Company Admin
    await createSystemNotification({
      companyId,
      adminEmail,
      recipientRole: 'admin',
      recipientId: 'admin',
      type: 'reimbursement',
      title: `New Reimbursement Claim: ${data.expenseType || 'Expense'}`,
      message: `${empName} (${data.employeeId || empCode}) submitted a claim of ₹${claimedAmt.toLocaleString('en-IN')} for ${data.expenseType}.`,
      employeeId: data.employeeId || empCode,
      employeeName: empName,
      clientName: clientName || '',
      targetModule: 'reimbursements',
      targetUrl: '/admin/reimbursements',
      referenceId: claimId,
      priority: claimedAmt > 10000 ? 'important' : 'normal'
    });

    return res.status(201).json({
      success: true,
      message: `✓ Reimbursement claim ${claimId} created successfully.`,
      claim: newClaim.toJSON(),
    });
  } catch (error) {
    console.error('Error creating reimbursement claim:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create reimbursement claim in database.',
      error: error.message,
    });
  }
};

/**
 * @desc    Update an existing reimbursement claim
 * @route   PUT /api/reimbursements/:id
 * @access  Private
 */
export const updateReimbursementClaim = async (req, res) => {
  try {
    const user = req.user;
    const companyId = req.headers['x-company-id'] || req.body.companyId || user.companyId || 'RRS8392014SEC';
    const { id } = req.params;
    const updateData = req.body;

    const claim = await ReimbursementClaim.findOne({
      companyId,
      $or: [{ _id: id }, { claimId: id }],
    });

    if (!claim) {
      return res.status(404).json({
        success: false,
        message: 'Reimbursement claim not found.',
      });
    }

    // Apply allowed updates
    const fields = [
      'expenseType', 'expenseCategory', 'expenseDate', 'claimedAmount',
      'approvedAmount', 'description', 'receiptNumber', 'merchantName',
      'billAttachmentUrl', 'receiptsCount', 'department', 'site', 'clientName',
    ];

    fields.forEach((f) => {
      if (updateData[f] !== undefined) {
        claim[f] = updateData[f];
      }
    });

    claim.auditTrail.push({
      action: 'Claim Updated',
      by: user?.name || user?.email || 'Admin',
      date: new Date().toISOString().slice(0, 10),
      notes: 'Claim details modified.',
    });

    await claim.save();

    return res.status(200).json({
      success: true,
      message: `✓ Reimbursement claim ${claim.claimId} updated successfully.`,
      claim: claim.toJSON(),
    });
  } catch (error) {
    console.error('Error updating reimbursement claim:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update reimbursement claim in database.',
      error: error.message,
    });
  }
};

/**
 * @desc    Delete reimbursement claim permanently
 * @route   DELETE /api/reimbursements/:id
 * @access  Private (Admin)
 */
export const deleteReimbursementClaim = async (req, res) => {
  try {
    const user = req.user;
    const companyId = req.headers['x-company-id'] || user.companyId || 'RRS8392014SEC';
    const { id } = req.params;

    const claim = await ReimbursementClaim.findOneAndDelete({
      companyId,
      $or: [{ _id: id }, { claimId: id }],
    });

    if (!claim) {
      return res.status(404).json({
        success: false,
        message: 'Reimbursement claim not found.',
      });
    }

    return res.status(200).json({
      success: true,
      message: `✓ Claim ${claim.claimId} permanently deleted from database.`,
    });
  } catch (error) {
    console.error('Error deleting reimbursement claim:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete reimbursement claim.',
      error: error.message,
    });
  }
};

/**
 * @desc    Review claim: Approve, Reject, or Send Back
 * @route   PUT /api/reimbursements/:id/review
 * @access  Private (Admin / Approver)
 */
export const reviewReimbursementClaim = async (req, res) => {
  try {
    const user = req.user;
    const companyId = req.headers['x-company-id'] || req.body.companyId || user.companyId || 'RRS8392014SEC';
    const { id } = req.params;
    const { action, approvedAmount, remarks, rejectionReason, sendBackReason } = req.body;

    const claim = await ReimbursementClaim.findOne({
      companyId,
      $or: [{ _id: id }, { claimId: id }],
    });

    if (!claim) {
      return res.status(404).json({
        success: false,
        message: 'Reimbursement claim not found.',
      });
    }

    const today = new Date().toISOString().slice(0, 10);
    const adminName = user?.name || user?.email || 'Admin Approver';

    if (action === 'approve') {
      const finalAmt = Number(approvedAmount !== undefined ? approvedAmount : claim.claimedAmount);
      claim.approvalStatus = 'Approved';
      claim.approvedAmount = finalAmt;
      claim.paymentStatus = 'Ready for Payment';
      claim.approverName = adminName;
      claim.approverRemarks = remarks || 'Approved after policy verification.';
      claim.approvedDate = today;
      claim.rejectionReason = '';
      claim.sendBackReason = '';

      claim.auditTrail.push({
        action: 'Claim Approved',
        by: adminName,
        date: today,
        notes: `Approved for ₹${finalAmt.toLocaleString('en-IN')}. ${remarks || ''}`,
      });
    } else if (action === 'reject') {
      claim.approvalStatus = 'Rejected';
      claim.approvedAmount = 0;
      claim.paymentStatus = 'Unpaid';
      claim.approverName = adminName;
      claim.rejectionReason = rejectionReason || remarks || 'Claim rejected due to policy non-compliance.';
      claim.approvedDate = today;

      claim.auditTrail.push({
        action: 'Claim Rejected',
        by: adminName,
        date: today,
        notes: `Rejected: ${claim.rejectionReason}`,
      });
    } else if (action === 'send_back') {
      claim.approvalStatus = 'Sent Back';
      claim.approverName = adminName;
      claim.sendBackReason = sendBackReason || remarks || 'Clarification / original receipt required.';

      claim.auditTrail.push({
        action: 'Claim Sent Back',
        by: adminName,
        date: today,
        notes: `Sent Back: ${claim.sendBackReason}`,
      });
    }

    await claim.save();

    // Dynamically notify employee of review outcome
    if (claim.employeeId) {
      await createSystemNotification({
        companyId: claim.companyId,
        adminEmail: claim.adminEmail,
        recipientRole: 'employee',
        recipientId: claim.employeeId,
        employeeId: claim.employeeId,
        employeeName: claim.employeeName,
        type: 'reimbursement',
        title: `Reimbursement Claim ${claim.approvalStatus}: ${claim.expenseType}`,
        message: action === 'approve'
          ? `Your claim ${claim.claimId} of ₹${Number(claim.approvedAmount || claim.claimedAmount).toLocaleString('en-IN')} for ${claim.expenseType} has been approved.`
          : `Your claim ${claim.claimId} for ${claim.expenseType} was ${claim.approvalStatus.toLowerCase()}.`,
        targetUrl: '/employee/notifications',
        referenceId: claim.claimId,
        priority: action === 'approve' ? 'normal' : 'important'
      });
    }

    return res.status(200).json({
      success: true,
      message: `✓ Claim ${claim.claimId} ${claim.approvalStatus.toLowerCase()} successfully.`,
      claim: claim.toJSON(),
    });
  } catch (error) {
    console.error('Error reviewing reimbursement claim:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to review reimbursement claim.',
      error: error.message,
    });
  }
};

/**
 * @desc    Process payment for approved reimbursement claim
 * @route   POST /api/reimbursements/:id/pay
 * @access  Private (Admin / Finance)
 */
export const processReimbursementPayment = async (req, res) => {
  try {
    const user = req.user;
    const companyId = req.headers['x-company-id'] || req.body.companyId || user.companyId || 'RRS8392014SEC';
    const { id } = req.params;
    const { paymentMethod, paymentReference, paymentDate, paidAmount, payrollMonth, remarks } = req.body;

    const claim = await ReimbursementClaim.findOne({
      companyId,
      $or: [{ _id: id }, { claimId: id }],
    });

    if (!claim) {
      return res.status(404).json({
        success: false,
        message: 'Reimbursement claim not found.',
      });
    }

    const today = paymentDate || new Date().toISOString().slice(0, 10);
    const adminName = user?.name || user?.email || 'Finance Administrator';
    const amount = Number(paidAmount !== undefined ? paidAmount : (claim.approvedAmount || claim.claimedAmount));

    claim.paymentStatus = 'Paid';
    claim.paymentMethod = paymentMethod || 'Bank Transfer';
    claim.paymentReference = paymentReference || `TXN-${Date.now().toString().slice(-6)}`;
    claim.paymentDate = today;
    claim.paidAmount = amount;
    claim.payrollMonth = payrollMonth || claim.claimMonth || '';
    if (payrollMonth || paymentMethod === 'Payroll Adjustment') {
      claim.includedInPayroll = true;
    }

    claim.auditTrail.push({
      action: 'Payment Processed',
      by: adminName,
      date: today,
      notes: `Disbursed ₹${amount.toLocaleString('en-IN')} via ${claim.paymentMethod} (Ref: ${claim.paymentReference}). ${remarks || ''}`,
    });

    await claim.save();

    return res.status(200).json({
      success: true,
      message: `✓ Payment of ₹${amount.toLocaleString('en-IN')} recorded for ${claim.claimId}.`,
      claim: claim.toJSON(),
    });
  } catch (error) {
    console.error('Error processing reimbursement payment:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to record reimbursement payment in database.',
      error: error.message,
    });
  }
};

/**
 * @desc    Get expense types
 * @route   GET /api/reimbursements/expense-types
 * @access  Private
 */
export const getExpenseTypes = async (req, res) => {
  try {
    const user = req.user;
    const companyId = req.headers['x-company-id'] || req.query.companyId || user.companyId || 'RRS8392014SEC';

    let types = await ExpenseType.find({ companyId }).sort({ name: 1 });

    if (!types || types.length === 0) {
      // Seed default expense categories in MongoDB Atlas
      const toInsert = DEFAULT_EXPENSE_TYPES.map((t) => ({ ...t, companyId }));
      types = await ExpenseType.insertMany(toInsert);
    }

    return res.status(200).json({
      success: true,
      count: types.length,
      expenseTypes: types.map((t) => t.toJSON()),
    });
  } catch (error) {
    console.error('Error fetching expense types:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve expense types from database.',
      error: error.message,
    });
  }
};

/**
 * @desc    Create or update expense type
 * @route   POST /api/reimbursements/expense-types
 * @access  Private (Admin)
 */
export const saveExpenseType = async (req, res) => {
  try {
    const user = req.user;
    const companyId = req.headers['x-company-id'] || req.body.companyId || user.companyId || 'RRS8392014SEC';
    const data = req.body;

    let type;
    if (data._id || data.id) {
      type = await ExpenseType.findOneAndUpdate(
        { companyId, $or: [{ _id: data._id || data.id }, { code: data.code }] },
        { $set: data },
        { new: true }
      );
    } else {
      type = await ExpenseType.create({
        companyId,
        ...data,
      });
    }

    return res.status(200).json({
      success: true,
      message: `✓ Expense type '${type.name}' saved successfully.`,
      expenseType: type.toJSON(),
    });
  } catch (error) {
    console.error('Error saving expense type:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to save expense type in database.',
      error: error.message,
    });
  }
};

/**
 * @desc    Delete expense type
 * @route   DELETE /api/reimbursements/expense-types/:id
 * @access  Private (Admin)
 */
export const deleteExpenseType = async (req, res) => {
  try {
    const user = req.user;
    const companyId = req.headers['x-company-id'] || user.companyId || 'RRS8392014SEC';
    const { id } = req.params;

    const type = await ExpenseType.findOneAndDelete({
      companyId,
      $or: [{ _id: id }, { code: id }],
    });

    if (!type) {
      return res.status(404).json({
        success: false,
        message: 'Expense type not found.',
      });
    }

    return res.status(200).json({
      success: true,
      message: `✓ Expense type '${type.name}' deleted.`,
    });
  } catch (error) {
    console.error('Error deleting expense type:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete expense type.',
      error: error.message,
    });
  }
};
