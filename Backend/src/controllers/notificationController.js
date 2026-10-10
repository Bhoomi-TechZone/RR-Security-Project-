import Notification from '../models/notificationModel.js';
import ComplianceConfig from '../models/documentComplianceModel.js';
import { syncComplianceExpiryNotifications } from './complianceController.js';

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
      syncComplianceExpiryNotifications(companyId).catch(() => {});
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
      { new: true }
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
      { new: true }
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
            { new: true }
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
