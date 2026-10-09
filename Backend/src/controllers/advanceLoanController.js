import { AdvanceLoanRequest, DeductionSchedule, DeductionHistory } from '../models/advanceLoanModel.js';
import Employee from '../models/employeeModel.js';
import { createSystemNotification } from './notificationController.js';

/**
 * Generate sequential Request ID: ADV-YYYY-XXX or LN-YYYY-XXX
 */
const generateRequestId = async (companyId, type) => {
  const currentYear = new Date().getFullYear();
  const prefix = type === 'loan' ? 'LN' : 'ADV';
  const regex = new RegExp(`^${prefix}-${currentYear}-`, 'i');
  
  const count = await AdvanceLoanRequest.countDocuments({
    companyId,
    requestId: regex
  });
  
  return `${prefix}-${currentYear}-${String(count + 1).padStart(3, '0')}`;
};

/**
 * Helper to get initials from a full name
 */
const getInitials = (name = '') => {
  return name
    .split(' ')
    .filter(Boolean)
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'EM';
};

/**
 * @desc    Get all advance and loan requests
 * @route   GET /api/advances-loans
 * @access  Private
 */
export const getAdvanceLoanRequests = async (req, res) => {
  try {
    const user = req.user;
    const companyId = req.headers['x-company-id'] || req.query.companyId || user?.companyId || 'RRS8392014SEC';
    const { type, status, client, employee, fromDate, toDate, search } = req.query;

    const query = { companyId };

    // Employee isolation: If employee logs in, only view own requests
    if (user && user.role === 'employee') {
      const empId = user.employeeId || user.id;
      if (empId) {
        query.employeeId = empId;
      }
    } else if (employee) {
      query.employeeId = employee;
    }

    if (type && type !== 'all') {
      query.type = type;
    }

    if (status && status !== 'all') {
      query.status = status;
    }

    if (client && client !== 'All Clients') {
      query.clientName = client;
    }

    if (fromDate && toDate) {
      query.requestDate = { $gte: fromDate, $lte: toDate };
    } else if (fromDate) {
      query.requestDate = { $gte: fromDate };
    } else if (toDate) {
      query.requestDate = { $lte: toDate };
    }

    if (search && search.trim()) {
      const s = search.trim();
      query.$or = [
        { requestId: { $regex: s, $options: 'i' } },
        { employeeName: { $regex: s, $options: 'i' } },
        { employeeId: { $regex: s, $options: 'i' } },
        { reason: { $regex: s, $options: 'i' } }
      ];
    }

    const requests = await AdvanceLoanRequest.find(query).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: requests.length,
      data: requests
    });
  } catch (error) {
    console.error('Error in getAdvanceLoanRequests:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get single advance/loan request by ID or requestId
 * @route   GET /api/advances-loans/:id
 * @access  Private
 */
export const getAdvanceLoanRequestById = async (req, res) => {
  try {
    const { id } = req.params;
    const companyId = req.headers['x-company-id'] || req.user?.companyId || 'RRS8392014SEC';

    let request = null;
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      request = await AdvanceLoanRequest.findOne({ _id: id, companyId });
    }
    if (!request) {
      request = await AdvanceLoanRequest.findOne({ requestId: id, companyId });
    }

    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    res.status(200).json({ success: true, data: request });
  } catch (error) {
    console.error('Error in getAdvanceLoanRequestById:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Create advance or loan request
 * @route   POST /api/advances-loans
 * @access  Private
 */
export const createAdvanceLoanRequest = async (req, res) => {
  try {
    const user = req.user;
    const companyId = req.headers['x-company-id'] || req.body.companyId || user?.companyId || 'RRS8392014SEC';
    const body = req.body;

    if (!body.employeeId || !body.amount || !body.type || !body.reason) {
      return res.status(400).json({
        success: false,
        message: 'Employee, amount, request type, and reason are required'
      });
    }

    // Lookup employee details from DB
    let employeeData = null;
    if (body.employeeId) {
      employeeData = await Employee.findOne({
        $or: [
          { employeeId: body.employeeId },
          { _id: body.employeeId.match(/^[0-9a-fA-F]{24}$/) ? body.employeeId : null }
        ].filter(Boolean)
      });
    }

    const employeeName = body.employeeName || (employeeData ? `${employeeData.personalInfo?.firstName || ''} ${employeeData.personalInfo?.lastName || ''}`.trim() : 'Employee');
    const employeeId = employeeData?.employeeId || body.employeeId;
    const clientName = body.clientName || employeeData?.employmentDetails?.clientName || employeeData?.companyName || 'RR Security';
    const clientId = body.clientId || employeeData?.companyId || '';
    const department = body.department || employeeData?.employmentDetails?.department || 'Operations';
    const designation = body.designation || employeeData?.employmentDetails?.designation || 'Staff';
    const currentSalary = body.currentSalary || employeeData?.salaryDetails?.basic || employeeData?.salaryStructure?.basic || 0;
    const initials = getInitials(employeeName);

    const amount = Number(body.amount);
    const isLoan = body.type === 'loan';
    const interestRate = isLoan ? Number(body.interestRate || 0) : 0;
    const numberOfMonths = body.deductionMethod === 'monthly-emi' ? Math.max(1, Number(body.numberOfMonths || 1)) : 1;
    
    // Calculate total interest & repayable
    const totalInterest = isLoan
      ? Math.round((amount * interestRate * (numberOfMonths / 12)) / 100)
      : 0;
    const totalRepayable = amount + totalInterest;

    let emiAmount = body.emiAmount;
    if (body.deductionMethod === 'monthly-emi') {
      if (!emiAmount || Number(emiAmount) <= 0) {
        emiAmount = Math.ceil(totalRepayable / numberOfMonths);
      } else {
        emiAmount = Number(emiAmount);
      }
    } else {
      emiAmount = amount;
    }

    const requestId = body.requestId || await generateRequestId(companyId, body.type);
    const requestDate = body.requestDate || new Date().toISOString().slice(0, 10);

    const newRequest = new AdvanceLoanRequest({
      companyId,
      adminEmail: user?.email || 'admin@rrsecurity.com',
      requestId,
      employeeId,
      employeeCode: employeeData?.employeeCode || employeeId,
      employeeName,
      initials,
      department,
      designation,
      site: body.site || employeeData?.employmentDetails?.workLocation || 'Main Site',
      clientId,
      clientName,
      currentSalary,
      type: body.type,
      amount,
      interestRate,
      totalInterest,
      totalRepayable,
      reason: body.reason,
      otherReason: body.otherReason || '',
      requestDate,
      deductionMethod: body.deductionMethod || (isLoan ? 'monthly-emi' : 'salary-adjustment'),
      adjustmentMonth: body.adjustmentMonth || '',
      emiAmount,
      numberOfMonths,
      firstDeductionMonth: body.firstDeductionMonth || '',
      approvedAmount: 0,
      approvedDate: null,
      deductedAmount: 0,
      remainingAmount: totalRepayable,
      status: 'pending',
      remarks: body.remarks || '',
      auditTrail: [
        {
          action: 'Created Request',
          by: user?.name || user?.email || 'Admin',
          date: new Date().toISOString().slice(0, 10),
          notes: `Created ${body.type} request of ₹${amount}`
        }
      ]
    });

    const savedRequest = await newRequest.save();

    // Dynamically notify Company Admin
    await createSystemNotification({
      companyId,
      adminEmail: user?.email || 'admin@rrsecurity.com',
      recipientRole: 'admin',
      recipientId: 'admin',
      type: 'advance-loan',
      title: `New ${body.type === 'loan' ? 'Loan Application' : 'Advance Request'}: ₹${amount.toLocaleString('en-IN')}`,
      message: `${employeeName} (${employeeId}) applied for a ${body.type} of ₹${amount.toLocaleString('en-IN')} for ${body.reason}.`,
      employeeId,
      employeeName,
      clientName: clientName || '',
      targetModule: 'advances-loans',
      targetUrl: '/admin/advances-loans',
      referenceId: requestId,
      priority: amount > 50000 ? 'urgent' : amount > 20000 ? 'important' : 'normal'
    });

    res.status(201).json({
      success: true,
      message: `${body.type === 'loan' ? 'Loan' : 'Advance'} request submitted successfully`,
      data: savedRequest
    });
  } catch (error) {
    console.error('Error in createAdvanceLoanRequest:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Update advance/loan request
 * @route   PUT /api/advances-loans/:id
 * @access  Private
 */
export const updateAdvanceLoanRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;
    const companyId = req.headers['x-company-id'] || user?.companyId || 'RRS8392014SEC';
    const body = req.body;

    const request = await AdvanceLoanRequest.findOne({
      $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { requestId: id }].filter(Boolean),
      companyId
    });

    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    if (request.status !== 'pending' && body.status === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Only pending requests can be edited'
      });
    }

    if (body.amount !== undefined) request.amount = Number(body.amount);
    if (body.interestRate !== undefined) request.interestRate = Number(body.interestRate);
    if (body.numberOfMonths !== undefined) request.numberOfMonths = Number(body.numberOfMonths);
    if (body.reason !== undefined) request.reason = body.reason;
    if (body.otherReason !== undefined) request.otherReason = body.otherReason;
    if (body.deductionMethod !== undefined) request.deductionMethod = body.deductionMethod;
    if (body.adjustmentMonth !== undefined) request.adjustmentMonth = body.adjustmentMonth;
    if (body.firstDeductionMonth !== undefined) request.firstDeductionMonth = body.firstDeductionMonth;
    if (body.remarks !== undefined) request.remarks = body.remarks;

    // Recalculate totals
    const isLoan = request.type === 'loan';
    const months = request.deductionMethod === 'monthly-emi' ? Math.max(1, request.numberOfMonths || 1) : 1;
    request.totalInterest = isLoan
      ? Math.round((request.amount * (request.interestRate || 0) * (months / 12)) / 100)
      : 0;
    request.totalRepayable = request.amount + request.totalInterest;

    if (request.deductionMethod === 'monthly-emi') {
      request.emiAmount = body.emiAmount ? Number(body.emiAmount) : Math.ceil(request.totalRepayable / months);
    } else {
      request.emiAmount = request.amount;
    }

    if (request.status === 'pending') {
      request.remainingAmount = request.totalRepayable;
    }

    request.auditTrail.push({
      action: 'Updated Request',
      by: user?.name || user?.email || 'Admin',
      date: new Date().toISOString().slice(0, 10),
      notes: 'Request details modified'
    });

    const updated = await request.save();

    res.status(200).json({
      success: true,
      message: 'Request updated successfully',
      data: updated
    });
  } catch (error) {
    console.error('Error in updateAdvanceLoanRequest:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Delete advance/loan request
 * @route   DELETE /api/advances-loans/:id
 * @access  Private
 */
export const deleteAdvanceLoanRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const companyId = req.headers['x-company-id'] || req.user?.companyId || 'RRS8392014SEC';

    const request = await AdvanceLoanRequest.findOneAndDelete({
      $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { requestId: id }].filter(Boolean),
      companyId
    });

    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    // Also delete any associated deduction schedules
    await DeductionSchedule.deleteMany({ requestId: request.requestId, companyId });

    res.status(200).json({
      success: true,
      message: 'Request deleted successfully'
    });
  } catch (error) {
    console.error('Error in deleteAdvanceLoanRequest:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Approve advance/loan request & create Deduction Schedule
 * @route   POST /api/advances-loans/:id/approve
 * @access  Private
 */
export const approveAdvanceLoanRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;
    const companyId = req.headers['x-company-id'] || user?.companyId || 'RRS8392014SEC';
    const { approvedAmount, remarks } = req.body;

    const request = await AdvanceLoanRequest.findOne({
      $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { requestId: id }].filter(Boolean),
      companyId
    });

    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    if (request.status === 'approved') {
      return res.status(400).json({ success: false, message: 'Request is already approved' });
    }

    const isLoan = request.type === 'loan';
    const finalAmount = approvedAmount ? Number(approvedAmount) : request.amount;
    const months = request.deductionMethod === 'monthly-emi' ? Math.max(1, request.numberOfMonths || 1) : 1;
    const interest = isLoan ? Math.round((finalAmount * (request.interestRate || 0) * (months / 12)) / 100) : 0;
    const totalRepayable = finalAmount + interest;
    const monthlyDeduction = request.deductionMethod === 'monthly-emi' ? (request.emiAmount || Math.ceil(totalRepayable / months)) : totalRepayable;

    const todayStr = new Date().toISOString().slice(0, 10);
    const nextMonthStr = request.firstDeductionMonth || request.adjustmentMonth || new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().slice(0, 7);

    request.status = 'approved';
    request.approvedAmount = totalRepayable;
    request.approvedDate = todayStr;
    request.approvedBy = user?.name || user?.email || 'Admin';
    request.remainingAmount = totalRepayable;
    request.deductedAmount = 0;
    if (remarks) request.remarks = remarks;

    request.auditTrail.push({
      action: 'Approved Request',
      by: user?.name || user?.email || 'Admin',
      date: todayStr,
      notes: `Approved for ₹${totalRepayable}`
    });

    await request.save();

    // Generate installment items
    const installments = [];
    const [year, month] = nextMonthStr.split('-').map(Number);
    let startYear = year || new Date().getFullYear();
    let startMonth = month || (new Date().getMonth() + 2); // 1-indexed

    for (let i = 0; i < months; i++) {
      let instMonth = startMonth + i;
      let instYear = startYear;
      while (instMonth > 12) {
        instMonth -= 12;
        instYear += 1;
      }
      installments.push({
        month: `${instYear}-${String(instMonth).padStart(2, '0')}`,
        amount: monthlyDeduction,
        status: 'pending',
        deductionDate: null,
        payslipId: null
      });
    }

    // Create or update Deduction Schedule
    await DeductionSchedule.findOneAndUpdate(
      { requestId: request.requestId, companyId },
      {
        companyId,
        requestId: request.requestId,
        employeeId: request.employeeId,
        employeeName: request.employeeName,
        initials: request.initials || getInitials(request.employeeName),
        clientName: request.clientName,
        type: request.type,
        approvedAmount: totalRepayable,
        monthlyDeduction,
        totalMonths: months,
        deductedAmount: 0,
        remainingAmount: totalRepayable,
        nextDeductionMonth: nextMonthStr,
        status: 'active',
        installments
      },
      { upsert: true, new: true }
    );

    // Notify employee of approval
    if (request.employeeId) {
      await createSystemNotification({
        companyId: request.companyId,
        adminEmail: user?.email || 'admin@rrsecurity.com',
        recipientRole: 'employee',
        recipientId: request.employeeId,
        employeeId: request.employeeId,
        employeeName: request.employeeName,
        type: 'advance-loan',
        title: `${request.type === 'loan' ? 'Loan Application' : 'Advance Request'} Approved`,
        message: `Your ${request.type} request of ₹${totalRepayable.toLocaleString('en-IN')} has been approved.`,
        targetUrl: '/employee/notifications',
        referenceId: request.requestId,
        priority: 'normal'
      });
    }

    res.status(200).json({
      success: true,
      message: `${request.type === 'loan' ? 'Loan' : 'Advance'} request approved successfully`,
      data: request
    });
  } catch (error) {
    console.error('Error in approveAdvanceLoanRequest:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Reject advance/loan request
 * @route   POST /api/advances-loans/:id/reject
 * @access  Private
 */
export const rejectAdvanceLoanRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;
    const companyId = req.headers['x-company-id'] || user?.companyId || 'RRS8392014SEC';
    const { reason } = req.body;

    if (!reason || !reason.trim()) {
      return res.status(400).json({ success: false, message: 'Rejection reason is required' });
    }

    const request = await AdvanceLoanRequest.findOne({
      $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { requestId: id }].filter(Boolean),
      companyId
    });

    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    const todayStr = new Date().toISOString().slice(0, 10);
    request.status = 'rejected';
    request.rejectionReason = reason.trim();
    request.approvedAmount = 0;
    request.remainingAmount = 0;

    request.auditTrail.push({
      action: 'Rejected Request',
      by: user?.name || user?.email || 'Admin',
      date: todayStr,
      notes: `Rejected: ${reason.trim()}`
    });

    await request.save();

    // Deactivate / Remove any scheduled deduction
    await DeductionSchedule.deleteMany({ requestId: request.requestId, companyId });

    // Notify employee of rejection
    if (request.employeeId) {
      await createSystemNotification({
        companyId: request.companyId,
        adminEmail: user?.email || 'admin@rrsecurity.com',
        recipientRole: 'employee',
        recipientId: request.employeeId,
        employeeId: request.employeeId,
        employeeName: request.employeeName,
        type: 'advance-loan',
        title: `${request.type === 'loan' ? 'Loan Application' : 'Advance Request'} Rejected`,
        message: `Your ${request.type} request was rejected.${reason ? ` Reason: ${reason}` : ''}`,
        targetUrl: '/employee/notifications',
        referenceId: request.requestId,
        priority: 'important'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Request rejected',
      data: request
    });
  } catch (error) {
    console.error('Error in rejectAdvanceLoanRequest:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get all deduction schedules
 * @route   GET /api/advances-loans/schedules
 * @access  Private
 */
export const getDeductionSchedules = async (req, res) => {
  try {
    const user = req.user;
    const companyId = req.headers['x-company-id'] || req.query.companyId || user?.companyId || 'RRS8392014SEC';
    const { employee, client, type, status } = req.query;

    const query = { companyId };

    if (user && user.role === 'employee') {
      const empId = user.employeeId || user.id;
      if (empId) query.employeeId = empId;
    } else if (employee) {
      query.employeeId = employee;
    }

    if (client && client !== 'All Clients') query.clientName = client;
    if (type && type !== 'all') query.type = type;
    if (status && status !== 'all') query.status = status;

    const schedules = await DeductionSchedule.find(query).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: schedules.length,
      data: schedules
    });
  } catch (error) {
    console.error('Error in getDeductionSchedules:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get deduction history
 * @route   GET /api/advances-loans/history
 * @access  Private
 */
export const getDeductionHistory = async (req, res) => {
  try {
    const user = req.user;
    const companyId = req.headers['x-company-id'] || req.query.companyId || user?.companyId || 'RRS8392014SEC';
    const { employee, client, type } = req.query;

    const query = { companyId };

    if (user && user.role === 'employee') {
      const empId = user.employeeId || user.id;
      if (empId) query.employeeId = empId;
    } else if (employee) {
      query.employeeId = employee;
    }

    if (type && type !== 'all') query.type = type;

    const history = await DeductionHistory.find(query).sort({ deductionDate: -1, createdAt: -1 });

    res.status(200).json({
      success: true,
      count: history.length,
      data: history
    });
  } catch (error) {
    console.error('Error in getDeductionHistory:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Record manual or payroll deduction payment
 * @route   POST /api/advances-loans/deductions/record
 * @access  Private
 */
export const recordDeductionPayment = async (req, res) => {
  try {
    const user = req.user;
    const companyId = req.headers['x-company-id'] || req.body.companyId || user?.companyId || 'RRS8392014SEC';
    const { requestId, employeeId, amount, salaryMonth, payrollCycleId, remarks } = req.body;

    if (!requestId || !amount || Number(amount) <= 0) {
      return res.status(400).json({ success: false, message: 'Request ID and valid amount are required' });
    }

    const request = await AdvanceLoanRequest.findOne({ requestId, companyId });
    if (!request) {
      return res.status(404).json({ success: false, message: 'Associated request not found' });
    }

    const todayStr = new Date().toISOString().slice(0, 10);
    const monthName = salaryMonth || new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric' }).format(new Date());
    const deductAmt = Number(amount);

    // Save deduction history record
    const historyItem = new DeductionHistory({
      companyId,
      requestId: request.requestId,
      employeeId: request.employeeId,
      employeeName: request.employeeName,
      type: request.type,
      month: monthName,
      deductionDate: todayStr,
      amount: deductAmt,
      salaryMonth: salaryMonth || monthName,
      status: 'deducted',
      payrollCycleId: payrollCycleId || '',
      remarks: remarks || `Salary deduction for ${monthName}`
    });
    await historyItem.save();

    // Update Request
    request.deductedAmount = (request.deductedAmount || 0) + deductAmt;
    request.remainingAmount = Math.max(0, (request.approvedAmount || request.totalRepayable) - request.deductedAmount);
    if (request.remainingAmount === 0) {
      request.status = 'completed';
    }
    await request.save();

    // Update Schedule
    const schedule = await DeductionSchedule.findOne({ requestId: request.requestId, companyId });
    if (schedule) {
      schedule.deductedAmount = (schedule.deductedAmount || 0) + deductAmt;
      schedule.remainingAmount = Math.max(0, schedule.approvedAmount - schedule.deductedAmount);
      if (schedule.remainingAmount === 0) {
        schedule.status = 'completed';
      }
      await schedule.save();
    }

    res.status(201).json({
      success: true,
      message: 'Deduction recorded successfully',
      data: historyItem
    });
  } catch (error) {
    console.error('Error in recordDeductionPayment:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get high-level statistics for Advance & Loan module
 * @route   GET /api/advances-loans/stats
 * @access  Private
 */
export const getAdvanceLoanStats = async (req, res) => {
  try {
    const user = req.user;
    const companyId = req.headers['x-company-id'] || req.query.companyId || user?.companyId || 'RRS8392014SEC';

    const requests = await AdvanceLoanRequest.find({ companyId });
    const schedules = await DeductionSchedule.find({ companyId });
    const history = await DeductionHistory.find({ companyId });

    const totalRequests = requests.length;
    const pendingRequests = requests.filter(r => r.status === 'pending').length;
    const approvedRequests = requests.filter(r => ['approved', 'completed'].includes(r.status));
    const approvedAmount = approvedRequests.reduce((sum, r) => sum + (r.approvedAmount || 0), 0);
    const outstandingAmount = approvedRequests.reduce((sum, r) => sum + (r.remainingAmount || 0), 0);

    const advanceList = requests.filter(r => r.type === 'advance');
    const loanList = requests.filter(r => r.type === 'loan');

    // Calculate monthly deduction expected vs actual
    const currentMonthKey = new Date().toISOString().slice(0, 7); // YYYY-MM
    let monthlyExpected = 0;
    schedules.forEach(s => {
      if (s.status === 'active' && s.remainingAmount > 0) {
        monthlyExpected += (s.monthlyDeduction || 0);
      }
    });

    const monthlyDeducted = history.reduce((sum, h) => sum + (h.amount || 0), 0);
    const monthlyRemaining = Math.max(0, monthlyExpected - monthlyDeducted);

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalRequests,
          pendingRequests,
          approvedAmount,
          outstandingAmount
        },
        advanceOverview: {
          count: advanceList.length,
          amount: advanceList.reduce((sum, r) => sum + (r.amount || 0), 0),
          approved: advanceList.filter(r => ['approved', 'completed'].includes(r.status)).length,
          pending: advanceList.filter(r => r.status === 'pending').length,
          rejected: advanceList.filter(r => r.status === 'rejected').length
        },
        loanOverview: {
          count: loanList.length,
          amount: loanList.reduce((sum, r) => sum + (r.amount || 0), 0),
          approved: loanList.filter(r => ['approved', 'completed'].includes(r.status)).length,
          pending: loanList.filter(r => r.status === 'pending').length,
          rejected: loanList.filter(r => r.status === 'rejected').length
        },
        monthlyDeduction: {
          expected: monthlyExpected,
          deducted: monthlyDeducted,
          remaining: monthlyRemaining
        },
        pendingApprovals: requests
          .filter(r => r.status === 'pending')
          .slice(0, 5)
      }
    });
  } catch (error) {
    console.error('Error in getAdvanceLoanStats:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
