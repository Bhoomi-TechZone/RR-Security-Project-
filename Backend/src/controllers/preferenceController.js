import mongoose from 'mongoose';
import Company from '../models/companyModel.js';

const DEFAULT_EMPLOYEE_PORTAL = {
  enabled: true,
  allowDashboard: true,
  allowAttendance: true,
  allowLeaves: true,
  allowApplyLeave: true,
  allowLeaveBalance: true,
  allowSalarySlips: true,
  allowProfile: true,
  allowNotifications: true,
  lastUpdated: new Date().toISOString(),
};

const DEFAULT_REPORTING_MANAGER = {
  viewAssignedEmployees: true,
  viewEmployeeAttendance: true,
  approveLeave: true,
  approveOvertime: true,
  viewOvertime: true,
  viewEmployeeDocuments: false,
  viewEmployeeReports: true,
  viewAssignedSiteBranchEmployees: true,
  allowShiftOverride: false,
  allowAttendanceRegularization: true,
  lastUpdated: new Date().toISOString(),
};

const DEFAULT_EMAIL_CONFIG = {
  enabled: true,
  smtpHost: 'smtp.gmail.com',
  smtpPort: '587',
  encryption: 'TLS',
  smtpUsername: 'notifications@novasparkhrms.com',
  smtpPassword: '••••••••••••••••',
  fromEmail: 'noreply@novasparkhrms.com',
  fromName: 'NovaSpark HRMS Admin',
  replyToEmail: 'support@novasparkhrms.com',
  lastUpdated: new Date().toISOString(),
};

const DEFAULT_NOTIFICATION_CONFIG = {
  channels: {
    inApp: false,
    email: true,
  },
  events: {
    attendance: { name: 'Attendance Notifications', inApp: false, email: false },
    leave: { name: 'Leave Notifications', inApp: false, email: true },
    overtime: { name: 'Overtime Notifications', inApp: false, email: true },
    payroll: { name: 'Payroll Notifications', inApp: false, email: true },
    salarySlip: { name: 'Salary Slip Notifications', inApp: false, email: true },
    approval: { name: 'Approval Notifications', inApp: false, email: true },
    system: { name: 'System Notifications', inApp: false, email: true },
  },
  lastUpdated: new Date().toISOString(),
};

const DEFAULT_APPROVAL_CONFIG = {
  leave: {
    type: 'multi',
    levels: [
      { id: 'lvl-1', level: 1, role: 'Reporting Manager', isMandatory: true },
      { id: 'lvl-2', level: 2, role: 'HR', isMandatory: true },
    ],
    autoApprovalDays: 3,
    allowSelfApproval: false,
  },
  overtime: {
    type: 'single',
    levels: [
      { id: 'lvl-1', level: 1, role: 'Reporting Manager', isMandatory: true },
    ],
    autoApprovalDays: 2,
    allowSelfApproval: false,
  },
  reimbursement: {
    type: 'multi',
    levels: [
      { id: 'lvl-1', level: 1, role: 'Reporting Manager', isMandatory: true },
      { id: 'lvl-2', level: 2, role: 'HR', isMandatory: true },
      { id: 'lvl-3', level: 3, role: 'Accounts', isMandatory: true },
    ],
    autoApprovalDays: 5,
    allowSelfApproval: false,
  },
  employeeRequests: {
    type: 'multi',
    levels: [
      { id: 'lvl-1', level: 1, role: 'Reporting Manager', isMandatory: false },
      { id: 'lvl-2', level: 2, role: 'HR', isMandatory: true },
      { id: 'lvl-3', level: 3, role: 'Admin', isMandatory: false },
    ],
    autoApprovalDays: 4,
    allowSelfApproval: false,
  },
  lastUpdated: new Date().toISOString(),
};

const DEFAULT_PREFERENCES = {
  employeePortal: DEFAULT_EMPLOYEE_PORTAL,
  reportingManager: DEFAULT_REPORTING_MANAGER,
  emailConfig: DEFAULT_EMAIL_CONFIG,
  notificationConfig: DEFAULT_NOTIFICATION_CONFIG,
  approvalConfig: DEFAULT_APPROVAL_CONFIG,
};

/**
 * Helper to find company by companyId or _id or adminEmail
 */
async function findCompany(companyId, adminEmail) {
  const isObjectId = companyId && mongoose.isValidObjectId(companyId);
  const query = [];

  if (companyId) {
    query.push({ companyId });
    if (isObjectId) {
      query.push({ _id: companyId });
    }
  }

  if (adminEmail) {
    query.push({ adminEmail: adminEmail.toLowerCase() });
  }

  if (query.length === 0) {
    return await Company.findOne({ isDefault: true }) || await Company.findOne({});
  }

  let company = await Company.findOne({ $or: query });
  if (!company) {
    company = await Company.findOne({ isDefault: true }) || await Company.findOne({});
  }

  return company;
}

/**
 * @desc    Get all preferences for the active company
 * @route   GET /api/preferences
 * @access  Private (Admin)
 */
export const getPreferences = async (req, res) => {
  try {
    const adminEmail = req.user?.email?.toLowerCase();
    const companyId = req.headers['x-company-id'] || req.query.companyId;

    const company = await findCompany(companyId, adminEmail);

    if (!company) {
      return res.status(200).json({
        success: true,
        preferences: DEFAULT_PREFERENCES,
      });
    }

    const companyPrefs = company.preferences || {};
    const mergedPreferences = {
      employeePortal: { ...DEFAULT_EMPLOYEE_PORTAL, ...(companyPrefs.employeePortal || {}) },
      reportingManager: { ...DEFAULT_REPORTING_MANAGER, ...(companyPrefs.reportingManager || {}) },
      emailConfig: { ...DEFAULT_EMAIL_CONFIG, ...(companyPrefs.emailConfig || {}) },
      notificationConfig: {
        ...DEFAULT_NOTIFICATION_CONFIG,
        ...(companyPrefs.notificationConfig || {}),
        channels: {
          ...DEFAULT_NOTIFICATION_CONFIG.channels,
          ...(companyPrefs.notificationConfig?.channels || {}),
        },
        events: {
          ...DEFAULT_NOTIFICATION_CONFIG.events,
          ...(companyPrefs.notificationConfig?.events || {}),
        },
      },
      approvalConfig: {
        ...DEFAULT_APPROVAL_CONFIG,
        ...(companyPrefs.approvalConfig || {}),
      },
    };

    return res.status(200).json({
      success: true,
      preferences: mergedPreferences,
    });
  } catch (error) {
    console.error('Error fetching preferences:', error);
    return res.status(200).json({
      success: true,
      preferences: DEFAULT_PREFERENCES,
    });
  }
};

/**
 * @desc    Get employee portal access rules dynamically (used by Employee Portal panel)
 * @route   GET /api/preferences/portal-access
 * @access  Public / Authenticated
 */
export const getEmployeePortalAccess = async (req, res) => {
  try {
    const companyId = req.headers['x-company-id'] || req.query.companyId;
    const company = await findCompany(companyId, null);

    if (!company || !company.preferences || !company.preferences.employeePortal) {
      return res.status(200).json({
        success: true,
        employeePortal: DEFAULT_EMPLOYEE_PORTAL,
      });
    }

    return res.status(200).json({
      success: true,
      employeePortal: company.preferences.employeePortal,
    });
  } catch (error) {
    console.error('Error fetching employee portal access:', error);
    return res.status(200).json({
      success: true,
      employeePortal: DEFAULT_EMPLOYEE_PORTAL,
    });
  }
};

/**
 * @desc    Update Employee Portal preferences
 * @route   PUT /api/preferences/employee-portal
 * @access  Private (Admin)
 */
export const updateEmployeePortalPreferences = async (req, res) => {
  try {
    const adminEmail = req.user?.email?.toLowerCase();
    const companyId = req.headers['x-company-id'] || req.body.companyId;

    let company = await findCompany(companyId, adminEmail);

    const {
      enabled,
      allowDashboard,
      allowAttendance,
      allowLeaves,
      allowSalarySlips,
      allowProfile,
      allowNotifications,
    } = req.body;

    const newPortalConfig = {
      enabled: enabled !== undefined ? enabled : true,
      allowDashboard: allowDashboard !== undefined ? allowDashboard : true,
      allowAttendance: allowAttendance !== undefined ? allowAttendance : true,
      allowLeaves: allowLeaves !== undefined ? allowLeaves : true,
      allowApplyLeave: allowLeaves !== undefined ? allowLeaves : true,
      allowLeaveBalance: allowLeaves !== undefined ? allowLeaves : true,
      allowSalarySlips: allowSalarySlips !== undefined ? allowSalarySlips : true,
      allowProfile: allowProfile !== undefined ? allowProfile : true,
      allowNotifications: allowNotifications !== undefined ? allowNotifications : true,
      lastUpdated: new Date().toISOString(),
    };

    if (company) {
      if (!company.preferences) {
        company.preferences = {};
      }
      company.preferences.employeePortal = newPortalConfig;
      company.markModified('preferences');
      await company.save();
    }

    return res.status(200).json({
      success: true,
      message: 'Employee Portal preferences saved successfully.',
      employeePortal: newPortalConfig,
    });
  } catch (error) {
    console.error('Error updating employee portal preferences:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to update preferences.',
    });
  }
};

/**
 * @desc    Update generic preferences object
 * @route   PUT /api/preferences
 * @access  Private (Admin)
 */
export const updatePreferences = async (req, res) => {
  try {
    const adminEmail = req.user?.email?.toLowerCase();
    const companyId = req.headers['x-company-id'] || req.body.companyId;

    let company = await findCompany(companyId, adminEmail);

    const fields = ['employeePortal', 'reportingManager', 'emailConfig', 'notificationConfig', 'approvalConfig'];

    if (company) {
      if (!company.preferences) {
        company.preferences = {};
      }

      fields.forEach((field) => {
        if (req.body[field] !== undefined) {
          company.preferences[field] = req.body[field];
        }
      });

      company.markModified('preferences');
      await company.save();
    }

    return res.status(200).json({
      success: true,
      message: 'Preferences saved successfully.',
      preferences: company?.preferences || DEFAULT_PREFERENCES,
    });
  } catch (error) {
    console.error('Error saving preferences:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to save preferences.',
    });
  }
};
