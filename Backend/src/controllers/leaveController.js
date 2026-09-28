import Leave from '../models/leaveModel.js';
import LeaveType from '../models/leaveTypeModel.js';
import LeaveBalance from '../models/leaveBalanceModel.js';
import Attendance from '../models/attendanceModel.js';
import Employee from '../models/employeeModel.js';

// Default standard leave types to auto-seed if none exist for a company
const DEFAULT_LEAVE_TYPES = [
  {
    code: 'CL',
    name: 'Casual Leave',
    category: 'Paid',
    quota: 12,
    accrual: 'Annual',
    carryForward: false,
    maxCarryForward: 0,
    requiresProof: false,
    description: 'General personal leave for security staff and operators',
    status: 'Active',
  },
  {
    code: 'SL',
    name: 'Sick / Medical Leave',
    category: 'Paid',
    quota: 8,
    accrual: 'Annual',
    carryForward: true,
    maxCarryForward: 5,
    requiresProof: true,
    description: 'Medical leave; requires doctor prescription if > 2 days',
    status: 'Active',
  },
  {
    code: 'EL',
    name: 'Earned / Privilege Leave',
    category: 'Paid',
    quota: 15,
    accrual: 'Monthly',
    carryForward: true,
    maxCarryForward: 30,
    requiresProof: false,
    description: 'Earned leave accumulated based on active duty days',
    status: 'Active',
  },
  {
    code: 'LWP',
    name: 'Leave Without Pay',
    category: 'Unpaid',
    quota: 30,
    accrual: 'None',
    carryForward: false,
    maxCarryForward: 0,
    requiresProof: false,
    description: 'Unpaid absence resulting in salary deduction',
    status: 'Active',
  },
];

/**
 * Helper to generate date range list
 */
const getDateRangeList = (fromDate, toDate) => {
  if (!fromDate || !toDate) return [];
  const list = [];
  const start = new Date(fromDate);
  const end = new Date(toDate);
  const diffDays = Math.round((end - start) / 86400000) + 1;

  for (let i = 0; i < diffDays; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    list.push(d.toISOString().slice(0, 10));
  }
  return list;
};

/**
 * Sync approved leave to MongoDB Attendance collection
 */
const syncLeaveToAttendance = async (companyId, adminEmail, leaveDoc) => {
  try {
    const dates =
      leaveDoc.dateBreakdown && leaveDoc.dateBreakdown.length > 0
        ? leaveDoc.dateBreakdown.map((b) => b.date)
        : getDateRangeList(leaveDoc.fromDate, leaveDoc.toDate);

    for (const dateStr of dates) {
      await Attendance.findOneAndUpdate(
        {
          companyId,
          employeeId: leaveDoc.employeeId,
          date: dateStr,
        },
        {
          $set: {
            employeeName: leaveDoc.employeeName,
            initials: leaveDoc.initials || 'EM',
            clientName: leaveDoc.clientName || 'RR Security',
            companyName: leaveDoc.clientName || 'RR Security',
            site: leaveDoc.site || 'Main Site',
            department: leaveDoc.department || 'Security',
            checkIn: null,
            checkOut: null,
            workingHours: null,
            status: 'onLeave',
            lateMinutes: 0,
            earlyOutMinutes: 0,
            adminEmail,
            companyId,
          },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    }
  } catch (err) {
    console.error('Error syncing leave to attendance:', err.message);
  }
};

/**
 * @desc    Get leave requests for company (filtered by status, search, department, role)
 * @route   GET /api/leaves
 * @access  Private
 */
export const getLeaveRequests = async (req, res) => {
  try {
    const companyId = req.headers['x-company-id'] || req.query.companyId || 'RRS8392014SEC';
    const { status, search, department, clientName, leaveType, fromDate, toDate } = req.query;

    const query = { companyId };

    // If user is employee, only fetch their own leaves
    if (req.user.role === 'employee') {
      const empId = req.user.employeeId || req.user.employeeCode;
      if (empId) {
        query.employeeId = empId;
      } else {
        query.adminEmail = req.user.email.toLowerCase();
      }
    }

    if (status && status !== 'All') {
      if (status === 'Pending') {
        query.status = { $in: ['Pending', 'Pending Supervisor Approval', 'Pending HR Approval'] };
      } else {
        query.status = status;
      }
    }

    if (department && department !== 'All') {
      query.department = new RegExp(department, 'i');
    }

    if (clientName && clientName !== 'All') {
      query.clientName = new RegExp(clientName, 'i');
    }

    if (leaveType && leaveType !== 'All') {
      query.leaveCode = leaveType;
    }

    if (fromDate && toDate) {
      query.fromDate = { $lte: toDate };
      query.toDate = { $gte: fromDate };
    } else if (fromDate) {
      query.fromDate = { $gte: fromDate };
    }

    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { employeeName: { $regex: searchRegex } },
        { employeeId: { $regex: searchRegex } },
        { leaveId: { $regex: searchRegex } },
        { site: { $regex: searchRegex } },
      ];
    }

    const leaves = await Leave.find(query).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: leaves.length,
      leaves: leaves.map((l) => l.toJSON()),
    });
  } catch (error) {
    console.error('Error fetching leave requests from database:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve leave requests from database.',
      error: error.message,
    });
  }
};

/**
 * @desc    Apply / Create a new leave request
 *          RULE: Admin applying = Directly Approved (no approval needed);
 *                Employee applying = Pending (requires supervisor/admin approval)
 * @route   POST /api/leaves
 * @access  Private
 */
export const createLeaveRequest = async (req, res) => {
  try {
    const adminEmail = req.user.email.toLowerCase();
    const companyId = req.headers['x-company-id'] || req.body.companyId || 'RRS8392014SEC';
    const isAdmin = req.user.role === 'admin' || req.user.role === 'superadmin';

    const {
      employeeId,
      employeeName,
      employeeAvatar,
      employeeRole,
      department,
      site,
      clientName,
      leaveCode,
      leaveType,
      category,
      durationType,
      halfDayType,
      shortLeaveTime,
      fromDate,
      toDate,
      days,
      dateBreakdown,
      reason,
      remarks,
      handoverNotes,
      supportingDocName,
    } = req.body;

    if (!employeeId || !fromDate || !reason) {
      return res.status(400).json({
        success: false,
        message: 'Employee ID, From Date, and Reason are required.',
      });
    }

    const totalDays = Number(days) || 1;
    const leaveId = `LV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const initials =
      (employeeName || 'EM')
        .split(' ')
        .map((n) => n[0])
        .join('')
        .substring(0, 2)
        .toUpperCase();

    let finalStatus = 'Pending Supervisor Approval';
    let workflowStage = 1;
    let currentApprover = 'Site Supervisor (Amit Gaurav)';
    let timeline = [];
    let processedOn = null;
    let processedBy = null;

    if (isAdmin) {
      // Direct instant approval when applied by Admin
      finalStatus = 'Approved';
      workflowStage = 3;
      currentApprover = 'Fully Processed';
      processedOn = new Date().toISOString().slice(0, 10);
      processedBy = req.user.name || 'Administrator';
      timeline = [
        {
          stage: 'Direct Sanction (Admin)',
          actor: req.user.name || 'Administrator',
          status: 'Approved',
          timestamp: new Date().toLocaleString(),
          remarks: remarks || 'Directly applied & approved by Admin.',
        },
        {
          stage: 'Attendance & Payroll Sync',
          actor: 'Automated System',
          status: 'Completed',
          timestamp: new Date().toLocaleString(),
          remarks: 'Attendance synchronized as On Leave.',
        },
      ];
    } else {
      // Standard workflow for employee
      finalStatus = 'Pending Supervisor Approval';
      workflowStage = 1;
      currentApprover = 'Site Supervisor (Amit Gaurav)';
      timeline = [
        {
          stage: 'Site Supervisor Sign-off',
          actor: 'Site Supervisor (Amit Gaurav)',
          status: 'Pending',
          timestamp: null,
          remarks: null,
        },
        {
          stage: 'HR Verification & Sanction',
          actor: 'HR Manager (Priya Sen)',
          status: 'Waiting',
          timestamp: null,
          remarks: null,
        },
        {
          stage: 'Attendance & Payroll Sync',
          actor: 'Automated System',
          status: 'Waiting',
          timestamp: null,
          remarks: null,
        },
      ];
    }

    const leaveDoc = await Leave.create({
      leaveId,
      companyId,
      adminEmail,
      employeeId,
      employeeName: employeeName || 'Employee',
      employeeAvatar: employeeAvatar || null,
      initials,
      employeeRole: employeeRole || 'Security Personnel',
      department: department || 'Security',
      site: site || 'Main Site',
      clientName: clientName || 'RR Security',
      leaveCode: leaveCode || 'CL',
      leaveType: leaveType || 'Casual Leave',
      category: category || 'Paid',
      durationType: durationType || 'Full Day',
      halfDayType: halfDayType || null,
      shortLeaveTime: shortLeaveTime || null,
      fromDate,
      toDate: toDate || fromDate,
      days: totalDays,
      dateBreakdown: dateBreakdown || [{ date: fromDate, dayType: durationType || 'Full Day', units: totalDays }],
      reason: reason.trim(),
      remarks: remarks ? remarks.trim() : null,
      handoverNotes: handoverNotes ? handoverNotes.trim() : null,
      supportingDocName: supportingDocName || null,
      status: finalStatus,
      appliedBy: isAdmin ? 'Admin' : 'Employee',
      workflowStage,
      currentApprover,
      processedOn,
      processedBy,
      timeline,
      attendanceImpact: {
        status: category === 'Paid' ? `Leave (${leaveCode || 'CL'})` : 'Leave Without Pay (LWP)',
        dailyCode: `L-${leaveCode || 'CL'}`,
        dateRange: `${fromDate} to ${toDate || fromDate}`,
        stage: 'Attendance Update',
        remarks: category === 'Paid' ? 'Paid Leave' : 'LWP: Salary Deduction',
        paidLeaveDays: category === 'Paid' ? totalDays : 0,
      },
    });

    // If directly approved (Admin), sync immediately to Attendance collection in MongoDB
    if (isAdmin) {
      await syncLeaveToAttendance(companyId, adminEmail, leaveDoc);
    }

    // Update Employee Leave Balance in MongoDB
    let balanceDoc = await LeaveBalance.findOne({
      companyId,
      $or: [{ employeeId }, { employeeName: employeeName || '' }],
    });
    if (!balanceDoc) {
      balanceDoc = await LeaveBalance.create({
        companyId,
        adminEmail,
        employeeId,
        employeeName: employeeName || 'Employee',
        department: department || 'Security',
      });
    }

    if (balanceDoc && balanceDoc.balances) {
      const current = balanceDoc.balances[leaveCode || 'CL'] || { opening: 8, accrued: 4, used: 0, pending: 0 };
      if (isAdmin) {
        current.used = (current.used || 0) + totalDays;
      } else {
        current.pending = (current.pending || 0) + totalDays;
      }
      balanceDoc.balances[leaveCode || 'CL'] = current;
      balanceDoc.markModified('balances');
      await balanceDoc.save();
    }

    return res.status(201).json({
      success: true,
      message: isAdmin
        ? 'Leave application submitted and directly approved.'
        : 'Leave application submitted and sent for supervisor approval.',
      leave: leaveDoc.toJSON(),
    });
  } catch (error) {
    console.error('Error creating leave request in database:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create leave application.',
      error: error.message,
    });
  }
};

/**
 * @desc    Review / Approve / Reject / Send Back leave request (Admin/Supervisor)
 * @route   PUT /api/leaves/:id/review
 * @access  Private (Admin)
 */
export const reviewLeaveRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, reason } = req.body; // 'approve', 'reject', 'send_back'
    const adminEmail = req.user.email.toLowerCase();

    let leaveDoc = null;
    try {
      leaveDoc = await Leave.findById(id);
    } catch {
      leaveDoc = await Leave.findOne({ $or: [{ leaveId: id }, { id }] });
    }

    if (!leaveDoc) {
      return res.status(404).json({
        success: false,
        message: 'Leave request not found in database.',
      });
    }

    if (action === 'approve') {
      leaveDoc.status = 'Approved';
      leaveDoc.workflowStage = 3;
      leaveDoc.currentApprover = 'Fully Processed';
      leaveDoc.processedOn = new Date().toISOString().slice(0, 10);
      leaveDoc.processedBy = req.user.name || 'HR Manager';

      leaveDoc.timeline = [
        ...(leaveDoc.timeline || []),
        {
          stage: 'HR Sanction & Approval',
          actor: req.user.name || 'HR Manager',
          status: 'Approved',
          timestamp: new Date().toLocaleString(),
          remarks: reason || 'Approved by HR Manager.',
        },
        {
          stage: 'Attendance & Payroll Sync',
          actor: 'Automated System',
          status: 'Completed',
          timestamp: new Date().toLocaleString(),
          remarks: 'Attendance synchronized as On Leave.',
        },
      ];

      await leaveDoc.save();

      // Synchronize into Attendance collection in MongoDB Atlas
      await syncLeaveToAttendance(leaveDoc.companyId, adminEmail, leaveDoc);

      // Move pending balance to used
      const balanceDoc = await LeaveBalance.findOne({
        companyId: leaveDoc.companyId,
        employeeId: leaveDoc.employeeId,
      });
      if (balanceDoc && balanceDoc.balances) {
        const current = balanceDoc.balances[leaveDoc.leaveCode] || { opening: 8, accrued: 4, used: 0, pending: 0 };
        current.used = (current.used || 0) + leaveDoc.days;
        current.pending = Math.max(0, (current.pending || 0) - leaveDoc.days);
        balanceDoc.balances[leaveDoc.leaveCode] = current;
        balanceDoc.markModified('balances');
        await balanceDoc.save();
      }

      return res.status(200).json({
        success: true,
        message: `Leave request approved and synced to attendance for ${leaveDoc.employeeName}.`,
        leave: leaveDoc.toJSON(),
      });
    } else if (action === 'reject') {
      leaveDoc.status = 'Rejected';
      leaveDoc.currentApprover = 'Rejected';
      leaveDoc.rejectionReason = reason || 'Rejected by management.';
      leaveDoc.timeline = [
        ...(leaveDoc.timeline || []),
        {
          stage: 'Leave Rejection',
          actor: req.user.name || 'Reviewer',
          status: 'Rejected',
          timestamp: new Date().toLocaleString(),
          remarks: reason || 'Rejected.',
        },
      ];

      await leaveDoc.save();

      // Release pending balance
      const balanceDoc = await LeaveBalance.findOne({
        companyId: leaveDoc.companyId,
        employeeId: leaveDoc.employeeId,
      });
      if (balanceDoc && balanceDoc.balances) {
        const current = balanceDoc.balances[leaveDoc.leaveCode];
        if (current) {
          current.pending = Math.max(0, (current.pending || 0) - leaveDoc.days);
          balanceDoc.balances[leaveDoc.leaveCode] = current;
          balanceDoc.markModified('balances');
          await balanceDoc.save();
        }
      }

      return res.status(200).json({
        success: true,
        message: `Leave request rejected for ${leaveDoc.employeeName}.`,
        leave: leaveDoc.toJSON(),
      });
    } else if (action === 'send_back') {
      leaveDoc.status = 'Sent Back';
      leaveDoc.currentApprover = `Employee (${leaveDoc.employeeName})`;
      leaveDoc.sendBackReason = reason || 'Sent back for revision.';
      leaveDoc.timeline = [
        ...(leaveDoc.timeline || []),
        {
          stage: 'Sent Back for Clarification',
          actor: req.user.name || 'Reviewer',
          status: 'Sent Back',
          timestamp: new Date().toLocaleString(),
          remarks: reason || 'Please revise and resubmit.',
        },
      ];

      await leaveDoc.save();

      return res.status(200).json({
        success: true,
        message: `Leave request sent back to employee for revision.`,
        leave: leaveDoc.toJSON(),
      });
    }

    return res.status(400).json({ success: false, message: 'Invalid review action.' });
  } catch (error) {
    console.error('Error reviewing leave request:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to review leave request.',
      error: error.message,
    });
  }
};

/**
 * @desc    Cancel leave request (Employee or Admin)
 * @route   PUT /api/leaves/:id/cancel
 * @access  Private
 */
export const cancelLeaveRequest = async (req, res) => {
  try {
    const { id } = req.params;
    let leaveDoc = null;
    try {
      leaveDoc = await Leave.findById(id);
    } catch {
      leaveDoc = await Leave.findOne({ $or: [{ leaveId: id }, { id }] });
    }

    if (!leaveDoc) {
      return res.status(404).json({ success: false, message: 'Leave request not found.' });
    }

    if (leaveDoc.status === 'Approved') {
      return res.status(400).json({ success: false, message: 'Approved leaves cannot be directly cancelled. Please contact HR.' });
    }

    leaveDoc.status = 'Cancelled';
    leaveDoc.currentApprover = 'Cancelled';
    leaveDoc.timeline = [
      ...(leaveDoc.timeline || []),
      {
        stage: 'Cancelled by Employee',
        actor: req.user.name || leaveDoc.employeeName || 'Employee',
        status: 'Cancelled',
        timestamp: new Date().toLocaleString(),
        remarks: 'Request withdrawn by applicant.',
      },
    ];

    await leaveDoc.save();

    // Release pending balance
    const balanceDoc = await LeaveBalance.findOne({
      companyId: leaveDoc.companyId,
      employeeId: leaveDoc.employeeId,
    });
    if (balanceDoc && balanceDoc.balances) {
      const current = balanceDoc.balances[leaveDoc.leaveCode];
      if (current) {
        current.pending = Math.max(0, (current.pending || 0) - leaveDoc.days);
        balanceDoc.balances[leaveDoc.leaveCode] = current;
        balanceDoc.markModified('balances');
        await balanceDoc.save();
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Leave request cancelled successfully.',
      leave: leaveDoc.toJSON(),
    });
  } catch (error) {
    console.error('Error cancelling leave request:', error);
    return res.status(500).json({ success: false, message: 'Failed to cancel leave request.', error: error.message });
  }
};

/**
 * @desc    Edit / Update leave request (Admin)
 * @route   PUT /api/leaves/:id
 * @access  Private (Admin)
 */
export const updateLeaveRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const adminEmail = req.user.email.toLowerCase();
    const companyId = req.headers['x-company-id'] || req.body.companyId || 'RRS8392014SEC';

    let leaveDoc = null;
    try {
      leaveDoc = await Leave.findById(id);
    } catch {
      leaveDoc = await Leave.findOne({ $or: [{ leaveId: id }, { id }] });
    }

    if (!leaveDoc) {
      return res.status(404).json({ success: false, message: 'Leave record not found in database.' });
    }

    const prevEmployeeId = leaveDoc.employeeId;
    const prevLeaveCode = leaveDoc.leaveCode;
    const prevDays = Number(leaveDoc.days) || 0;
    const prevStatus = leaveDoc.status;
    const prevDates =
      leaveDoc.dateBreakdown && leaveDoc.dateBreakdown.length > 0
        ? leaveDoc.dateBreakdown.map((b) => b.date)
        : getDateRangeList(leaveDoc.fromDate, leaveDoc.toDate);

    // If previously approved, clear old attendance onLeave dates
    if (prevStatus === 'Approved') {
      await Attendance.deleteMany({
        companyId: leaveDoc.companyId,
        employeeId: prevEmployeeId,
        date: { $in: prevDates },
        status: 'onLeave',
        checkIn: null,
      });

      // Revert previous used balance
      const prevBalDoc = await LeaveBalance.findOne({ companyId: leaveDoc.companyId, employeeId: prevEmployeeId });
      if (prevBalDoc && prevBalDoc.balances && prevBalDoc.balances[prevLeaveCode]) {
        prevBalDoc.balances[prevLeaveCode].used = Math.max(0, (prevBalDoc.balances[prevLeaveCode].used || 0) - prevDays);
        prevBalDoc.markModified('balances');
        await prevBalDoc.save();
      }
    } else if (prevStatus.startsWith('Pending')) {
      // Revert previous pending balance
      const prevBalDoc = await LeaveBalance.findOne({ companyId: leaveDoc.companyId, employeeId: prevEmployeeId });
      if (prevBalDoc && prevBalDoc.balances && prevBalDoc.balances[prevLeaveCode]) {
        prevBalDoc.balances[prevLeaveCode].pending = Math.max(0, (prevBalDoc.balances[prevLeaveCode].pending || 0) - prevDays);
        prevBalDoc.markModified('balances');
        await prevBalDoc.save();
      }
    }

    const {
      employeeId,
      employeeName,
      department,
      site,
      clientName,
      leaveCode,
      leaveType,
      category,
      durationType,
      halfDayType,
      shortLeaveTime,
      fromDate,
      toDate,
      days,
      dateBreakdown,
      reason,
      remarks,
      status,
    } = req.body;

    const newEmpId = employeeId || prevEmployeeId;
    const newLeaveCode = leaveCode || prevLeaveCode;
    const newDays = days !== undefined ? Number(days) : prevDays;
    const newStatus = status || prevStatus || 'Approved';

    leaveDoc.employeeId = newEmpId;
    if (employeeName) leaveDoc.employeeName = employeeName;
    if (department) leaveDoc.department = department;
    if (site) leaveDoc.site = site;
    if (clientName) leaveDoc.clientName = clientName;
    leaveDoc.leaveCode = newLeaveCode;
    if (leaveType) leaveDoc.leaveType = leaveType;
    if (category) leaveDoc.category = category;
    if (durationType) leaveDoc.durationType = durationType;
    leaveDoc.halfDayType = durationType === 'Half Day' ? (halfDayType || 'First Half') : null;
    leaveDoc.shortLeaveTime = durationType === 'Short Leave' ? (shortLeaveTime || null) : null;
    if (fromDate) leaveDoc.fromDate = fromDate;
    if (toDate || fromDate) leaveDoc.toDate = toDate || fromDate;
    leaveDoc.days = newDays;
    leaveDoc.dateBreakdown = dateBreakdown || (fromDate ? getDateRangeList(fromDate, toDate || fromDate).map((d) => ({ date: d, dayType: durationType || 'Full Day', units: 1.0 })) : leaveDoc.dateBreakdown);
    if (reason !== undefined) leaveDoc.reason = reason;
    if (remarks !== undefined) leaveDoc.remarks = remarks;
    leaveDoc.status = newStatus;

    leaveDoc.timeline = [
      ...(leaveDoc.timeline || []),
      {
        stage: 'Leave Modified by Admin',
        actor: req.user.name || 'Admin',
        status: newStatus,
        timestamp: new Date().toLocaleString(),
        remarks: 'Leave details updated by administrator.',
      },
    ];

    await leaveDoc.save();

    // Re-apply balance and attendance for updated leave
    if (newStatus === 'Approved') {
      await syncLeaveToAttendance(leaveDoc.companyId, adminEmail, leaveDoc);

      const balDoc = await LeaveBalance.findOne({ companyId: leaveDoc.companyId, employeeId: newEmpId });
      if (balDoc && balDoc.balances) {
        const cur = balDoc.balances[newLeaveCode] || { opening: 8, accrued: 4, used: 0, pending: 0 };
        cur.used = (cur.used || 0) + newDays;
        balDoc.balances[newLeaveCode] = cur;
        balDoc.markModified('balances');
        await balDoc.save();
      }
    } else if (newStatus.startsWith('Pending')) {
      const balDoc = await LeaveBalance.findOne({ companyId: leaveDoc.companyId, employeeId: newEmpId });
      if (balDoc && balDoc.balances) {
        const cur = balDoc.balances[newLeaveCode] || { opening: 8, accrued: 4, used: 0, pending: 0 };
        cur.pending = (cur.pending || 0) + newDays;
        balDoc.balances[newLeaveCode] = cur;
        balDoc.markModified('balances');
        await balDoc.save();
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Leave application updated successfully and attendance synced.',
      leave: leaveDoc.toJSON(),
    });
  } catch (error) {
    console.error('Error updating leave request:', error);
    return res.status(500).json({ success: false, message: 'Failed to update leave request.', error: error.message });
  }
};

/**
 * @desc    Delete leave record permanently (Admin)
 * @route   DELETE /api/leaves/:id
 * @access  Private (Admin)
 */
export const deleteLeaveRequest = async (req, res) => {
  try {
    const { id } = req.params;
    let leaveDoc = null;
    try {
      leaveDoc = await Leave.findById(id);
    } catch {
      leaveDoc = await Leave.findOne({ $or: [{ leaveId: id }, { id }] });
    }

    if (!leaveDoc) {
      return res.status(404).json({ success: false, message: 'Leave record not found in database.' });
    }

    const { companyId, employeeId, leaveCode, days, status } = leaveDoc;
    const numDays = Number(days) || 0;
    const dates =
      leaveDoc.dateBreakdown && leaveDoc.dateBreakdown.length > 0
        ? leaveDoc.dateBreakdown.map((b) => b.date)
        : getDateRangeList(leaveDoc.fromDate, leaveDoc.toDate);

    // If leave was Approved, delete synced On Leave attendance records
    if (status === 'Approved') {
      await Attendance.deleteMany({
        companyId,
        employeeId,
        date: { $in: dates },
        status: 'onLeave',
        checkIn: null,
      });

      // Refund used balance in MongoDB
      const balDoc = await LeaveBalance.findOne({ companyId, employeeId });
      if (balDoc && balDoc.balances && balDoc.balances[leaveCode]) {
        balDoc.balances[leaveCode].used = Math.max(0, (balDoc.balances[leaveCode].used || 0) - numDays);
        balDoc.markModified('balances');
        await balDoc.save();
      }
    } else if (status.startsWith('Pending')) {
      // Refund pending balance
      const balDoc = await LeaveBalance.findOne({ companyId, employeeId });
      if (balDoc && balDoc.balances && balDoc.balances[leaveCode]) {
        balDoc.balances[leaveCode].pending = Math.max(0, (balDoc.balances[leaveCode].pending || 0) - numDays);
        balDoc.markModified('balances');
        await balDoc.save();
      }
    }

    await Leave.deleteOne({ _id: leaveDoc._id });

    return res.status(200).json({
      success: true,
      message: `Leave record ${leaveDoc.leaveId || id} deleted and balance restored.`,
    });
  } catch (error) {
    console.error('Error deleting leave request:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete leave record.', error: error.message });
  }
};


/**
 * @desc    Get leave types for company (auto-seeds defaults if empty)
 * @route   GET /api/leaves/types
 * @access  Private
 */
export const getLeaveTypes = async (req, res) => {
  try {
    const adminEmail = req.user.email.toLowerCase();
    const companyId = req.headers['x-company-id'] || req.query.companyId || 'RRS8392014SEC';

    let types = await LeaveType.find({ companyId }).sort({ code: 1 });

    if (types.length === 0) {
      const seedTypes = DEFAULT_LEAVE_TYPES.map((t) => ({
        ...t,
        companyId,
        adminEmail,
      }));
      types = await LeaveType.insertMany(seedTypes).catch(() => []);
    }

    return res.status(200).json({
      success: true,
      count: types.length,
      types: types.map((t) => t.toJSON()),
    });
  } catch (error) {
    console.error('Error fetching leave types:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve leave types.',
      error: error.message,
    });
  }
};

/**
 * @desc    Save / Update leave type in MongoDB
 * @route   POST /api/leaves/types
 * @access  Private (Admin)
 */
export const saveLeaveType = async (req, res) => {
  try {
    const adminEmail = req.user.email.toLowerCase();
    const companyId = req.headers['x-company-id'] || req.body.companyId || 'RRS8392014SEC';
    const {
      code,
      name,
      category,
      quota,
      annualQuota,
      accrual,
      carryForward,
      maxCarryForward,
      maxAccumulation,
      encashment,
      requiresProof,
      description,
      status,
    } = req.body;

    if (!code || !name) {
      return res.status(400).json({ success: false, message: 'Leave code and name are required.' });
    }

    const quotaVal = annualQuota !== undefined ? Number(annualQuota) : quota !== undefined ? Number(quota) : 12;
    const maxCFVal =
      maxAccumulation !== undefined
        ? Number(maxAccumulation)
        : maxCarryForward !== undefined
        ? Number(maxCarryForward)
        : 0;
    const carryForwardBool =
      typeof carryForward === 'string' ? carryForward.toLowerCase() === 'yes' : !!carryForward;

    const updated = await LeaveType.findOneAndUpdate(
      { companyId, code: code.toUpperCase() },
      {
        $set: {
          name,
          category: category || 'Paid',
          quota: quotaVal,
          accrual: accrual || 'Annual',
          carryForward: carryForwardBool,
          maxCarryForward: maxCFVal,
          requiresProof: !!requiresProof,
          description: description || '',
          status: status || 'Active',
          adminEmail,
          companyId,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return res.status(200).json({
      success: true,
      message: 'Leave type saved successfully.',
      type: updated.toJSON(),
    });
  } catch (error) {
    console.error('Error saving leave type:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to save leave type.',
      error: error.message,
    });
  }
};

/**
 * @desc    Delete leave type from MongoDB
 * @route   DELETE /api/leaves/types/:id
 * @access  Private (Admin)
 */
export const deleteLeaveType = async (req, res) => {
  try {
    const { id } = req.params;
    const companyId = req.headers['x-company-id'] || req.query.companyId || 'RRS8392014SEC';

    let deletedDoc = null;
    try {
      deletedDoc = await LeaveType.findOneAndDelete({ _id: id, companyId });
    } catch {
      // If id is not an ObjectId, fallback to code search
    }

    if (!deletedDoc) {
      deletedDoc = await LeaveType.findOneAndDelete({
        companyId,
        $or: [{ code: id.toUpperCase() }, { id }],
      });
    }

    if (!deletedDoc) {
      return res.status(404).json({ success: false, message: 'Leave type not found in database.' });
    }

    // Clean up key in LeaveBalance documents for this company
    if (deletedDoc.code) {
      await LeaveBalance.updateMany(
        { companyId },
        { $unset: { [`balances.${deletedDoc.code}`]: '' } }
      ).catch(() => {});
    }

    return res.status(200).json({
      success: true,
      message: `Leave type ${deletedDoc.code} - ${deletedDoc.name} deleted successfully from database.`,
      deletedType: deletedDoc.toJSON ? deletedDoc.toJSON() : deletedDoc,
    });
  } catch (error) {
    console.error('Error deleting leave type:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete leave type.',
      error: error.message,
    });
  }
};

/**
 * @desc    Get employee leave balances for company
 * @route   GET /api/leaves/balances
 * @access  Private
 */
export const getEmployeeLeaveBalances = async (req, res) => {
  try {
    const adminEmail = req.user.email.toLowerCase();
    const companyId = req.headers['x-company-id'] || req.query.companyId || 'RRS8392014SEC';

    // Fetch registered employees, active leave types, and active leave requests from MongoDB database
    const [employees, companyLeaveTypes, allLeaves] = await Promise.all([
      Employee.find({ companyId }),
      LeaveType.find({ companyId }),
      Leave.find({
        companyId,
        status: { $nin: ['Cancelled', 'Rejected'] },
      }),
    ]);

    let balances = await LeaveBalance.find({ companyId });
    const balanceMap = new Map();
    balances.forEach((b) => {
      if (b.employeeId) balanceMap.set(b.employeeId, b);
    });

    // Default balance template based on active configured leave types
    const defaultBalancesObj = {};
    if (companyLeaveTypes && companyLeaveTypes.length > 0) {
      companyLeaveTypes.forEach((t) => {
        if (t.code) {
          defaultBalancesObj[t.code] = {
            opening: t.category === 'Unpaid' ? 0 : Number(t.quota) || 12,
            accrued: 0,
            used: 0,
            pending: 0,
          };
        }
      });
    } else {
      defaultBalancesObj.CL = { opening: 8, accrued: 4, used: 0, pending: 0 };
      defaultBalancesObj.SL = { opening: 6, accrued: 2, used: 0, pending: 0 };
      defaultBalancesObj.EL = { opening: 10, accrued: 5, used: 0, pending: 0 };
      defaultBalancesObj.LWP = { opening: 0, accrued: 0, used: 0, pending: 0 };
    }

    // Ensure every registered employee has a live leave balance record in MongoDB
    if (employees.length > 0) {
      for (const emp of employees) {
        const empId = emp.employeeId || emp.employeeCode || emp._id.toString();
        if (empId && !balanceMap.has(empId)) {
          const newBal = await LeaveBalance.create({
            companyId,
            adminEmail,
            employeeId: empId,
            employeeName: emp.name || emp.employeeName || 'Employee',
            department: emp.department || 'Security',
            policyName: 'Standard Security Staff Policy',
            balances: defaultBalancesObj,
          });
          balanceMap.set(empId, newBal);
          balances.push(newBal);
        }
      }
    }

    // Dynamic list of all leave codes to reconcile
    const allCodes = new Set(['CL', 'SL', 'EL', 'LWP']);
    companyLeaveTypes.forEach((t) => {
      if (t.code) allCodes.add(t.code.toUpperCase());
    });
    allLeaves.forEach((l) => {
      if (l.leaveCode) allCodes.add(l.leaveCode.toUpperCase());
    });

    // Live Reconcile: compute exact used & pending days from active Leave requests in database
    for (const b of balances) {
      const empId = b.employeeId;
      const emp = employees.find(
        (e) =>
          (e.employeeId && e.employeeId === empId) ||
          (e.employeeCode && e.employeeCode === empId) ||
          e._id.toString() === empId
      );
      const possibleIds = [
        empId,
        emp?.employeeId,
        emp?.employeeCode,
        emp?.name,
        emp?.employeeName,
        b.employeeName,
      ].filter(Boolean);

      const empLeaves = allLeaves.filter((l) =>
        possibleIds.some(
          (id) =>
            l.employeeId === id ||
            l.employeeCode === id ||
            (l.employeeName && l.employeeName.toLowerCase() === (b.employeeName || '').toLowerCase())
        )
      );

      const balObj = b.balances || {};

      for (const code of allCodes) {
        const typeInfo = companyLeaveTypes.find((t) => t.code === code);
        const defaultQuota = typeInfo ? (typeInfo.category === 'Unpaid' ? 0 : Number(typeInfo.quota) || 12) : 8;

        const approvedDays = empLeaves
          .filter((l) => l.leaveCode === code && l.status === 'Approved')
          .reduce((acc, l) => acc + (Number(l.days) || 0), 0);

        const pendingDays = empLeaves
          .filter((l) => l.leaveCode === code && l.status && l.status.startsWith('Pending'))
          .reduce((acc, l) => acc + (Number(l.days) || 0), 0);

        const cur = balObj[code] || {
          opening: defaultQuota,
          accrued: 0,
          used: 0,
          pending: 0,
        };

        cur.used = approvedDays;
        cur.pending = pendingDays;
        cur.available = Math.max(0, (Number(cur.opening) || 0) + (Number(cur.accrued) || 0) - approvedDays - pendingDays);
        balObj[code] = cur;
      }

      b.balances = balObj;
      b.markModified('balances');
      await b.save().catch(() => {});
    }

    // Attach dynamic employee info (clientName, siteLocation, designation) to the balances
    const enrichedBalances = balances.map((b) => {
      const emp = employees.find(
        (e) =>
          (e.employeeId && e.employeeId === b.employeeId) ||
          (e.employeeCode && e.employeeCode === b.employeeId) ||
          e._id.toString() === b.employeeId
      );
      const obj = b.toJSON ? b.toJSON() : b;
      return {
        ...obj,
        employeeCode: emp?.employeeId || emp?.employeeCode || b.employeeId,
        client: emp?.clientName || 'RR Security',
        site: emp?.siteLocation || emp?.dutyPost || 'Main Site',
        designation: emp?.designation || 'Security Guard',
        department: emp?.department || b.department || 'Security',
      };
    });

    return res.status(200).json({
      success: true,
      count: enrichedBalances.length,
      balances: enrichedBalances,
    });
  } catch (error) {
    console.error('Error fetching employee leave balances:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve leave balances.',
      error: error.message,
    });
  }
};


/**
 * @desc    Assign policy & opening balances to employee
 * @route   POST /api/leaves/balances/assign
 * @access  Private (Admin)
 */
export const assignLeavePolicy = async (req, res) => {
  try {
    const adminEmail = req.user.email.toLowerCase();
    const companyId = req.headers['x-company-id'] || req.body.companyId || 'RRS8392014SEC';
    const { employeeId, employeeCode, policyName, openingBalances } = req.body;

    const empId = employeeId || employeeCode;
    if (!empId) {
      return res.status(400).json({ success: false, message: 'Employee ID is required.' });
    }

    let balanceDoc = await LeaveBalance.findOne({ companyId, employeeId: empId });
    if (!balanceDoc) {
      const emp = await Employee.findOne({ companyId, $or: [{ employeeId: empId }, { employeeCode: empId }] });
      balanceDoc = new LeaveBalance({
        companyId,
        adminEmail,
        employeeId: empId,
        employeeName: emp?.name || emp?.employeeName || 'Employee',
        department: emp?.department || 'Security',
      });
    }

    balanceDoc.policyName = policyName || balanceDoc.policyName;
    if (openingBalances) {
      const current = balanceDoc.balances || {};
      for (const [code, val] of Object.entries(openingBalances)) {
        current[code] = {
          opening: Number(val) || 0,
          accrued: current[code]?.accrued || 4,
          used: current[code]?.used || 0,
          pending: current[code]?.pending || 0,
        };
      }
      balanceDoc.balances = current;
      balanceDoc.markModified('balances');
    }

    await balanceDoc.save();

    return res.status(200).json({
      success: true,
      message: 'Leave policy and opening balances assigned successfully.',
      balance: balanceDoc.toJSON(),
    });
  } catch (error) {
    console.error('Error assigning leave policy:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to assign leave policy.',
      error: error.message,
    });
  }
};
