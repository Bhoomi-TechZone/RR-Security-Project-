import Notification from '../models/notificationModel.js';
import ComplianceConfig from '../models/documentComplianceModel.js';
import Employee from '../models/employeeModel.js';
import Leave from '../models/leaveModel.js';
import { ReimbursementClaim } from '../models/reimbursementModel.js';
import { AdvanceLoanRequest } from '../models/advanceLoanModel.js';
import { syncComplianceExpiryNotifications } from './complianceController.js';

// Throttle cache to avoid hammering MongoDB Atlas on repeated poll requests
const lastAdminSyncMap = new Map();
let isSyncing = false;

/**
 * Synchronize real-time birthday notifications, pending claims, and leave requests for company admin
 */
export const syncAdminDynamicNotifications = async (companyId) => {
  try {
    if (!companyId) return;

    // Throttle: run at most once every 3 minutes per company, never concurrently
    const lastSync = lastAdminSyncMap.get(companyId);
    if (isSyncing || (lastSync && Date.now() - lastSync < 180000)) {
      return;
    }
    isSyncing = true;
    lastAdminSyncMap.set(companyId, Date.now());

    const companyFilter = {
      $or: [
        { companyId: companyId },
        { companyId: { $regex: new RegExp(`^${companyId}$`, 'i') } }
      ]
    };

    const now = new Date();
    const currentYear = now.getFullYear();
    const todayDay = now.getDate();
    const todayMidnight = new Date(currentYear, now.getMonth(), todayDay);
    const shortMonthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    // 1. Employee Birthdays (Today & Next 7 Days)
    // ONLY select essential lightweight identity fields - NEVER pull massive base64 documents!
    const employees = await Employee.find(companyFilter)
      .select('employeeId employeeCode name dob designation department clientName companyName')
      .lean();

    const parseDob = (dobStr) => {
      if (!dobStr) return null;
      const str = String(dobStr).trim();
      let match = str.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
      if (match) {
        return { year: parseInt(match[1], 10), month: parseInt(match[2], 10), day: parseInt(match[3], 10) };
      }
      match = str.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
      if (match) {
        return { day: parseInt(match[1], 10), month: parseInt(match[2], 10), year: parseInt(match[3], 10) };
      }
      return null;
    };

    const birthdayCandidates = [];
    for (const emp of employees) {
      if (!emp.dob) continue;
      const parsed = parseDob(emp.dob);
      if (!parsed || !parsed.month || !parsed.day) continue;

      let nextBirthday = new Date(currentYear, parsed.month - 1, parsed.day);
      if (nextBirthday < todayMidnight) {
        nextBirthday = new Date(currentYear + 1, parsed.month - 1, parsed.day);
      }

      const diffDays = Math.round((nextBirthday.getTime() - todayMidnight.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays >= 0 && diffDays <= 7) {
        birthdayCandidates.push({ emp, parsed, nextBirthday, diffDays });
      }
    }

    if (birthdayCandidates.length > 0) {
      const refIds = birthdayCandidates.map(c =>
        c.diffDays === 0
          ? `bday-${c.emp.employeeId || c.emp._id}-${c.nextBirthday.getFullYear()}-today`
          : `bday-${c.emp.employeeId || c.emp._id}-${c.nextBirthday.getFullYear()}-upcoming`
      );
      const existingNotifs = await Notification.find({
        companyId,
        referenceId: { $in: refIds }
      }).select('referenceId').lean();
      const existingSet = new Set(existingNotifs.map(n => n.referenceId));

      for (const { emp, parsed, nextBirthday, diffDays } of birthdayCandidates) {
        const empIdStr = emp.employeeId || emp.employeeCode || String(emp._id);
        const empName = emp.name || emp.employeeName || 'Staff Member';
        const isToday = diffDays === 0;
        const refId = isToday
          ? `bday-${empIdStr}-${nextBirthday.getFullYear()}-today`
          : `bday-${empIdStr}-${nextBirthday.getFullYear()}-upcoming`;

        if (!existingSet.has(refId)) {
          existingSet.add(refId);
          const dayLabel = isToday ? 'Today' : diffDays === 1 ? 'Tomorrow' : `in ${diffDays} days`;
          const formattedDate = `${parsed.day} ${shortMonthNames[parsed.month - 1]}`;
          await createSystemNotification({
            companyId,
            recipientRole: 'admin',
            recipientId: 'admin',
            type: 'birthday',
            title: isToday ? `Today is ${empName}'s Birthday!` : `Upcoming Birthday: ${empName} (${dayLabel})`,
            message: isToday
              ? `Wish ${empName} (${emp.designation || 'Staff'}, ${emp.department || 'Security'}) a very Happy Birthday today!`
              : `${empName} (${emp.department || 'Operations'}) has their birthday coming up on ${formattedDate} (${dayLabel}). Plan greetings!`,
            employeeId: empIdStr,
            employeeName: empName,
            clientName: emp.clientName || emp.companyName || '',
            targetModule: 'employees',
            targetUrl: '/admin/employees',
            referenceId: refId,
            priority: isToday ? 'important' : 'normal'
          });
        }
      }
    }

    // 2. Pending Leaves
    const empIds = employees.map(e => e.employeeId).concat(employees.map(e => e.employeeCode)).filter(Boolean);
    const pendingLeaves = await Leave.find({
      $or: [
        { companyId },
        { companyId: { $regex: new RegExp(`^${companyId}$`, 'i') } },
        { employeeId: { $in: empIds } }
      ],
      status: { $regex: /^pending$/i }
    })
      .select('leaveId employeeId employeeName leaveType days fromDate toDate reason clientName')
      .limit(25)
      .lean();

    if (pendingLeaves.length > 0) {
      const leaveRefIds = pendingLeaves.map(lv => String(lv.leaveId || lv._id));
      const existingLeaveNotifs = await Notification.find({
        companyId,
        referenceId: { $in: leaveRefIds },
        type: 'leave-application'
      }).select('referenceId').lean();
      const existingLeaveSet = new Set(existingLeaveNotifs.map(n => n.referenceId));

      for (const lv of pendingLeaves) {
        const refId = String(lv.leaveId || lv._id);
        if (!existingLeaveSet.has(refId)) {
          existingLeaveSet.add(refId);
          const empName = lv.employeeName || 'Staff Member';
          const dateRange = lv.fromDate === lv.toDate ? lv.fromDate : `${lv.fromDate} to ${lv.toDate}`;
          await createSystemNotification({
            companyId,
            recipientRole: 'admin',
            recipientId: 'admin',
            type: 'leave-application',
            title: `Leave Request: ${empName}`,
            message: `${empName} applied for ${lv.leaveType || 'Leave'} (${lv.days || 1} day, ${dateRange}). Reason: ${lv.reason || 'Personal'}. Pending your approval.`,
            employeeId: lv.employeeId || '',
            employeeName: empName,
            clientName: lv.clientName || '',
            targetModule: 'leave',
            targetUrl: '/admin/leave?tab=requests',
            referenceId: refId,
            priority: 'important'
          });
        }
      }
    }

    // 3. Pending Reimbursement Claims
    const pendingClaims = await ReimbursementClaim.find({
      $or: [
        { companyId },
        { companyId: { $regex: new RegExp(`^${companyId}$`, 'i') } }
      ],
      approvalStatus: { $regex: /^pending/i }
    })
      .select('claimId employeeId employeeName expenseType claimedAmount clientName')
      .limit(25)
      .lean();

    if (pendingClaims.length > 0) {
      const claimRefIds = pendingClaims.map(c => String(c.claimId || c._id));
      const existingClaimNotifs = await Notification.find({
        companyId,
        referenceId: { $in: claimRefIds },
        type: 'reimbursement'
      }).select('referenceId').lean();
      const existingClaimSet = new Set(existingClaimNotifs.map(n => n.referenceId));

      for (const claim of pendingClaims) {
        const refId = String(claim.claimId || claim._id);
        if (!existingClaimSet.has(refId)) {
          existingClaimSet.add(refId);
          const empName = claim.employeeName || 'Staff Member';
          await createSystemNotification({
            companyId,
            recipientRole: 'admin',
            recipientId: 'admin',
            type: 'reimbursement',
            title: `Pending Claim: ${claim.expenseType} (₹${Number(claim.claimedAmount || 0).toLocaleString('en-IN')})`,
            message: `${empName} submitted a reimbursement claim of ₹${Number(claim.claimedAmount || 0).toLocaleString('en-IN')} for ${claim.expenseType}. Pending approval.`,
            employeeId: claim.employeeId || claim.employeeCode || '',
            employeeName: empName,
            clientName: claim.clientName || '',
            targetModule: 'reimbursements',
            targetUrl: '/admin/reimbursements',
            referenceId: refId,
            priority: 'important'
          });
        }
      }
    }

    // 4. Pending Advance & Loan Requests
    const pendingLoans = await AdvanceLoanRequest.find({
      $or: [
        { companyId },
        { companyId: { $regex: new RegExp(`^${companyId}$`, 'i') } }
      ],
      status: { $regex: /^pending/i }
    })
      .select('requestId employeeId employeeName amountRequested amount reason clientName')
      .limit(25)
      .lean();

    if (pendingLoans.length > 0) {
      const loanRefIds = pendingLoans.map(l => String(l.requestId || l._id));
      const existingLoanNotifs = await Notification.find({
        companyId,
        referenceId: { $in: loanRefIds },
        type: 'advance-loan'
      }).select('referenceId').lean();
      const existingLoanSet = new Set(existingLoanNotifs.map(n => n.referenceId));

      for (const loan of pendingLoans) {
        const refId = String(loan.requestId || loan._id);
        if (!existingLoanSet.has(refId)) {
          existingLoanSet.add(refId);
          const empName = loan.employeeName || 'Staff Member';
          const loanAmt = Number(loan.amountRequested || loan.amount || 0);
          await createSystemNotification({
            companyId,
            recipientRole: 'admin',
            recipientId: 'admin',
            type: 'advance-loan',
            title: `Advance Request: ₹${loanAmt.toLocaleString('en-IN')}`,
            message: `${empName} requested an advance of ₹${loanAmt.toLocaleString('en-IN')} (${loan.reason || 'Personal'}). Pending approval.`,
            employeeId: loan.employeeId || loan.employeeCode || '',
            employeeName: empName,
            clientName: loan.clientName || '',
            targetModule: 'advances-loans',
            targetUrl: '/admin/advances-loans',
            referenceId: refId,
            priority: 'important'
          });
        }
      }
    }
  } catch (err) {
    console.error('Error in syncAdminDynamicNotifications:', err.message);
  } finally {
    isSyncing = false;
  }
};

/**
 * Helper function to create a system notification in MongoDB
 * Can be called internally from any controller (inventory, reimbursement, advance-loan, leave, attendance, payroll)
 */
export const createSystemNotification = async ({
  companyId,
  adminEmail,
  recipientRole = 'admin',
  recipientId = 'admin',
  type = 'general',
  title,
  message,
  employeeId = '',
  employeeName = '',
  clientName = '',
  targetModule = '',
  targetUrl = '',
  referenceId = '',
  priority = 'normal'
}) => {
  try {
    if (!companyId || !title || !message) return null;

    const notification = new Notification({
      companyId,
      adminEmail: adminEmail || process.env.EMAIL || '',
      recipientRole,
      recipientId,
      type,
      title: title.trim(),
      message: message.trim(),
      employeeId,
      employeeName,
      clientName,
      targetModule,
      targetUrl,
      referenceId,
      priority,
      status: 'unread',
      date: new Date().toISOString().slice(0, 10)
    });

    return await notification.save();
  } catch (error) {
    console.error('Error creating system notification:', error);
    return null;
  }
};

/**
 * @desc    Get all notifications for company & recipient
 * @route   GET /api/notifications
 * @access  Private
 */
export const getNotifications = async (req, res) => {
  try {
    const user = req.user;
    const companyId = req.headers['x-company-id'] || req.query.companyId || user?.companyId || 'RRS8392014SEC';
    const { type, status, search, page = 1, limit = 50, employeeId } = req.query;

    // Check In-App Activity Bell settings from ComplianceConfig
    const complianceConfig = await ComplianceConfig.findOne({ companyId }).lean();
    const isExpiryAlertsEnabled = complianceConfig?.expiryConfig?.enabled !== false;
    const isInAppBellTicked = complianceConfig?.expiryConfig?.channels?.inApp === true;

    // If In-App Bell is ticked, run background sync for real-time fresh license alerts
    if (isExpiryAlertsEnabled && isInAppBellTicked) {
      syncComplianceExpiryNotifications(companyId).catch(() => { });
    }

    // Automatically synchronize dynamic notifications (birthdays, pending leaves, claims) for company admin
    if (!user || user.role === 'admin' || user.role === 'superadmin') {
      await syncAdminDynamicNotifications(companyId);
    }

    const query = { companyId };

    const targetEmpId = employeeId || (user && user.role === 'employee' ? (user.employeeId || user.id) : null);

    // Role filtering:
    if (user && user.role === 'employee') {
      const empId = user.employeeId || user.id;
      query.$or = [
        { recipientRole: 'employee', recipientId: empId },
        { recipientRole: 'employee', employeeId: empId },
        { recipientRole: 'all' },
        { employeeId: empId }
      ];
    } else if (targetEmpId && user?.role !== 'admin') {
      query.$or = [
        { recipientRole: 'employee', recipientId: targetEmpId },
        { recipientRole: 'employee', employeeId: targetEmpId },
        { recipientRole: 'all' },
        { employeeId: targetEmpId }
      ];
    } else if (user && user.role === 'client') {
      const clientId = user.clientId || user.id;
      query.$or = [
        { recipientRole: 'client', recipientId: clientId },
        { recipientRole: 'all' }
      ];
    } else {
      // Company Admin / Super Admin
      query.$or = [
        { recipientRole: 'admin' },
        { recipientRole: 'all' },
        { recipientRole: { $exists: false } }
      ];
    }

    if (type && type !== 'all') {
      query.type = type;
    }

    if (status && status !== 'all') {
      query.status = status;
    }

    // Strictly enforce: if In-App Activity Bell is NOT ticked or alerts disabled -> hide expiry notifications
    if (!isExpiryAlertsEnabled || !isInAppBellTicked) {
      if (query.type) {
        if (['document-expiry', 'compliance_alert'].includes(query.type)) {
          query.type = '__hidden_suppressed__';
        }
      } else {
        query.type = { $nin: ['document-expiry', 'compliance_alert'] };
      }
    }

    if (search && search.trim()) {
      const s = search.trim();
      const searchRegex = { $regex: s, $options: 'i' };
      const searchCond = [
        { title: searchRegex },
        { message: searchRegex },
        { employeeName: searchRegex },
        { employeeId: searchRegex },
        { clientName: searchRegex }
      ];
      if (query.$or) {
        query.$and = [{ $or: query.$or }, { $or: searchCond }];
        delete query.$or;
      } else {
        query.$or = searchCond;
      }
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 50;
    const skip = (pageNum - 1) * limitNum;

    const unreadEmpId = employeeId || (user?.role === 'employee' ? (user.employeeId || user.id) : null);
    const unreadCountQuery = {
      companyId,
      status: 'unread',
      ...(unreadEmpId && user?.role !== 'admin'
        ? {
          $or: [
            { recipientRole: 'employee', recipientId: unreadEmpId },
            { recipientRole: 'employee', employeeId: unreadEmpId },
            { recipientRole: 'all' },
            { employeeId: unreadEmpId }
          ]
        }
        : user?.role === 'client'
          ? { recipientRole: { $in: ['client', 'all'] } }
          : { recipientRole: { $in: ['admin', 'all'] } })
    };

    if (!isExpiryAlertsEnabled || !isInAppBellTicked) {
      unreadCountQuery.type = { $nin: ['document-expiry', 'compliance_alert'] };
    }

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(query).sort({ createdAt: -1 }).skip(skip).limit(limitNum),
      Notification.countDocuments(query),
      Notification.countDocuments(unreadCountQuery)
    ]);

    res.status(200).json({
      success: true,
      count: notifications.length,
      total,
      unreadCount,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum) || 1,
      data: notifications
    });
  } catch (error) {
    console.error('Error in getNotifications:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get unread notification count
 * @route   GET /api/notifications/unread-count
 * @access  Private
 */
export const getUnreadNotificationCount = async (req, res) => {
  try {
    const user = req.user;
    const companyId = req.headers['x-company-id'] || req.query.companyId || user?.companyId || 'RRS8392014SEC';
    const { employeeId } = req.query;

    const targetEmpId = employeeId || (user?.role === 'employee' ? (user.employeeId || user.id) : null);
    const query = { companyId, status: 'unread' };

    // Check In-App Activity Bell settings from ComplianceConfig
    const complianceConfig = await ComplianceConfig.findOne({ companyId }).lean();
    const isExpiryAlertsEnabled = complianceConfig?.expiryConfig?.enabled !== false;
    const isInAppBellTicked = complianceConfig?.expiryConfig?.channels?.inApp === true;

    if (!isExpiryAlertsEnabled || !isInAppBellTicked) {
      query.type = { $nin: ['document-expiry', 'compliance_alert'] };
    }

    // Run dynamic sync non-blocking in background - do NOT await it here to keep polling instantaneous
    if (!user || user.role === 'admin' || user.role === 'superadmin') {
      syncAdminDynamicNotifications(companyId).catch(() => { });
    }

    if (targetEmpId && user?.role !== 'admin') {
      query.$or = [
        { recipientRole: 'employee', recipientId: targetEmpId },
        { recipientRole: 'employee', employeeId: targetEmpId },
        { recipientRole: 'all' },
        { employeeId: targetEmpId }
      ];
    } else if (user && user.role === 'employee') {
      const empId = user.employeeId || user.id;
      query.$or = [
        { recipientRole: 'employee', recipientId: empId },
        { recipientRole: 'employee', employeeId: empId },
        { recipientRole: 'all' },
        { employeeId: empId }
      ];
    } else if (user && user.role === 'client') {
      query.recipientRole = { $in: ['client', 'all'] };
    } else {
      query.recipientRole = { $in: ['admin', 'all'] };
    }

    const unreadCount = await Notification.countDocuments(query);

    res.status(200).json({
      success: true,
      unreadCount
    });
  } catch (error) {
    console.error('Error in getUnreadNotificationCount:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Mark a notification as read
 * @route   PUT /api/notifications/:id/read
 * @access  Private
 */
export const markNotificationAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const companyId = req.headers['x-company-id'] || req.user?.companyId || 'RRS8392014SEC';

    const notification = await Notification.findOneAndUpdate(
      { _id: id, companyId },
      { $set: { status: 'read' } },
      { returnDocument: 'after' }
    );

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Notification marked as read',
      data: notification
    });
  } catch (error) {
    console.error('Error in markNotificationAsRead:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Mark all notifications as read
 * @route   PUT /api/notifications/mark-all-read
 * @access  Private
 */
export const markAllNotificationsAsRead = async (req, res) => {
  try {
    const user = req.user;
    const companyId = req.headers['x-company-id'] || req.user?.companyId || 'RRS8392014SEC';

    const query = { companyId, status: 'unread' };
    if (user && user.role === 'employee') {
      const empId = user.employeeId || user.id;
      query.$or = [{ recipientRole: 'employee', recipientId: empId }, { employeeId: empId }];
    } else if (user && user.role === 'client') {
      query.recipientRole = { $in: ['client', 'all'] };
    } else {
      query.recipientRole = { $in: ['admin', 'all'] };
    }

    await Notification.updateMany(query, { $set: { status: 'read' } });

    res.status(200).json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    console.error('Error in markAllNotificationsAsRead:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Delete notification
 * @route   DELETE /api/notifications/:id
 * @access  Private
 */
export const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const companyId = req.headers['x-company-id'] || req.user?.companyId || 'RRS8392014SEC';

    const deleted = await Notification.findOneAndDelete({ _id: id, companyId });
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    console.error('Error in deleteNotification:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Clear all read notifications
 * @route   DELETE /api/notifications/clear-read
 * @access  Private
 */
export const clearReadNotifications = async (req, res) => {
  try {
    const user = req.user;
    const companyId = req.headers['x-company-id'] || req.user?.companyId || 'RRS8392014SEC';

    await Notification.deleteMany({ companyId, status: 'read' });

    res.status(200).json({
      success: true,
      message: 'Read notifications cleared successfully'
    });
  } catch (error) {
    console.error('Error in clearReadNotifications:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateNotificationAction = async (req, res) => {
  try {
    const { id } = req.params;
    const { actionStatus, actionTakenBy } = req.body;
    const companyId = req.headers['x-company-id'] || req.user?.companyId || 'RRS8392014SEC';
    const adminUser = actionTakenBy || req.user?.name || 'Administrator';
    const actionCap = actionStatus === 'approved' ? 'Approved' : 'Rejected';
    const actionLower = actionStatus === 'approved' ? 'approved' : 'rejected';

    const notification = await Notification.findOneAndUpdate(
      { _id: id, companyId },
      {
        $set: {
          actionStatus: actionStatus || 'approved',
          status: 'read',
          actionTakenAt: new Date(),
          actionTakenBy: adminUser
        }
      },
      { returnDocument: 'after' }
    );

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    // Proactively sync underlying module status and notify employee
    if (notification.referenceId || notification.employeeId) {
      try {
        if (notification.targetModule === 'inventory' || notification.type?.includes('request') || notification.type === 'inventory') {
          const InventoryRequest = (await import('../models/inventoryRequestModel.js')).default;
          const invReq = await InventoryRequest.findOneAndUpdate(
            {
              companyId,
              $or: [
                { requestId: notification.referenceId },
                { _id: notification.referenceId }
              ]
            },
            {
              $set: {
                status: actionCap,
                adminRemarks: `${actionCap} by ${adminUser}.`,
                actionBy: adminUser,
                actionDate: new Date().toISOString().slice(0, 10)
              }
            },
            { returnDocument: 'after' }
          );

          const itemName = invReq?.itemName || notification.title.replace(/^.*:\s*/, '') || 'Uniform/Equipment';
          const isUniform = invReq?.category === 'Uniform' || notification.type === 'uniform-request';
          const itemLabel = isUniform ? 'Uniform' : 'Asset';

          // Emit dynamic notification to employee
          await createSystemNotification({
            companyId,
            adminEmail: notification.adminEmail,
            recipientRole: 'employee',
            recipientId: notification.employeeId || invReq?.employeeId,
            employeeId: notification.employeeId || invReq?.employeeId,
            employeeName: notification.employeeName || invReq?.employeeName || 'Employee',
            type: isUniform ? 'uniform-request' : 'asset-request',
            title: `${itemLabel} Requisition ${actionCap}: ${itemName}`,
            message: `Your requisition request for ${itemName} has been ${actionLower} by ${adminUser}.`,
            targetModule: 'inventory',
            targetUrl: '/employee/assets',
            referenceId: notification.referenceId,
            priority: actionStatus === 'approved' ? 'normal' : 'important'
          });
        }
      } catch (syncErr) {
        console.warn('Non-critical sync warning in updateNotificationAction:', syncErr.message);
      }
    }

    res.status(200).json({
      success: true,
      message: `Notification action updated to ${actionStatus}`,
      data: notification
    });
  } catch (error) {
    console.error('Error in updateNotificationAction:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
