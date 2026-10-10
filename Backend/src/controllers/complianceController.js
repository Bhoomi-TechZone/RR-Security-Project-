import ComplianceConfig from '../models/documentComplianceModel.js';
import Employee from '../models/employeeModel.js';
import Notification from '../models/notificationModel.js';
import { sendLicenseExpiryEmailAlert } from '../services/emailService.js';

// Default dynamic initialization (empty array for user-defined rules)
const DEFAULT_EXPIRY_RULES = [];
const DEFAULT_VERIFICATION_RULES = [];

const getCompanyId = (req) => {
  return req.headers['x-company-id'] || req.query.companyId || req.user?.companyId || 'RRS8392014SEC';
};

/**
 * @desc    Get or initialize compliance configuration for company from MongoDB
 * @route   GET /api/compliance/config
 * @access  Private
 */
export const getComplianceConfig = async (req, res) => {
  try {
    const companyId = getCompanyId(req);
    let config = await ComplianceConfig.findOne({ companyId });

    if (!config) {
      config = await ComplianceConfig.create({
        companyId,
        companyName: req.user?.companyName || 'RR Security & Facilities',
        adminEmail: req.user?.email || 'admin@rrsecurity.com',
        expiryConfig: {
          enabled: true,
          defaultAlertDays: 30,
          repeatFrequencyDays: 7,
          recipients: {
            admin: true,
            hr: true,
            reportingManager: true,
            siteSupervisor: false,
          },
          channels: {
            inApp: true,
            email: true,
          },
          lastUpdated: new Date().toLocaleString(),
        },
        expiryRules: [],
        verificationRules: [],
      });
    } else {
      // Clean legacy mock rules if present
      let modified = false;
      if (Array.isArray(config.expiryRules) && config.expiryRules.some(r => ['er-1', 'er-2', 'er-3'].includes(r.id))) {
        config.expiryRules = config.expiryRules.filter(r => !['er-1', 'er-2', 'er-3'].includes(r.id));
        modified = true;
      }
      if (Array.isArray(config.verificationRules) && config.verificationRules.some(r => ['vr-1', 'vr-2', 'vr-3', 'vr-4'].includes(r.id))) {
        config.verificationRules = config.verificationRules.filter(r => !['vr-1', 'vr-2', 'vr-3', 'vr-4'].includes(r.id));
        modified = true;
      }
      if (modified) {
        await config.save();
      }
    }

    return res.status(200).json({
      success: true,
      config,
    });
  } catch (error) {
    console.error('Error fetching compliance config:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve compliance configuration from database',
      error: error.message,
    });
  }
};

/**
 * @desc    Update global expiry alert preferences in MongoDB
 * @route   PUT /api/compliance/expiry-config
 * @access  Private
 */
export const updateExpiryConfig = async (req, res) => {
  try {
    const companyId = getCompanyId(req);
    const { expiryConfig } = req.body;

    if (!expiryConfig) {
      return res.status(400).json({ success: false, message: 'expiryConfig is required' });
    }

    const updated = await ComplianceConfig.findOneAndUpdate(
      { companyId },
      {
        $set: {
          'expiryConfig.enabled': expiryConfig.enabled !== false,
          'expiryConfig.defaultAlertDays': Number(expiryConfig.defaultAlertDays) || 30,
          'expiryConfig.repeatFrequencyDays': Number(expiryConfig.repeatFrequencyDays) || 7,
          'expiryConfig.recipients': expiryConfig.recipients || {},
          'expiryConfig.channels': expiryConfig.channels || {},
          'expiryConfig.lastUpdated': new Date().toLocaleString(),
        },
      },
      { new: true, upsert: true }
    );

    // Sync or clear notifications depending on whether In-App Bell is enabled/ticked
    await syncComplianceExpiryNotifications(companyId);

    return res.status(200).json({
      success: true,
      message: 'Global expiry alert preferences saved to database successfully',
      expiryConfig: updated.expiryConfig,
    });
  } catch (error) {
    console.error('Error updating expiry config:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update expiry alert configuration in database',
      error: error.message,
    });
  }
};

/**
 * @desc    Add or update a document-specific expiry rule in MongoDB
 * @route   POST /api/compliance/expiry-rules
 * @access  Private
 */
export const saveExpiryRule = async (req, res) => {
  try {
    const companyId = getCompanyId(req);
    const ruleData = req.body;

    if (!ruleData.documentName) {
      return res.status(400).json({ success: false, message: 'Document name is required' });
    }

    let config = await ComplianceConfig.findOne({ companyId });
    if (!config) {
      config = await ComplianceConfig.create({
        companyId,
        expiryRules: DEFAULT_EXPIRY_RULES,
        verificationRules: DEFAULT_VERIFICATION_RULES,
      });
    }

    const ruleId = ruleData.id || `er-${Date.now()}`;
    const ruleObj = {
      id: ruleId,
      documentName: ruleData.documentName.trim(),
      category: ruleData.category || 'Security License',
      alertDays: Number(ruleData.alertDays) || 30,
      escalationLevel: ruleData.escalationLevel || 'Admin & HR',
      repeatFrequency: ruleData.repeatFrequency || 'Every 7 Days',
      channels: ruleData.channels || 'In-App + Email',
      status: ruleData.status || 'Active',
    };

    // Check if an expiry tracker for this license type already exists under a different ID
    const duplicateDocIdx = config.expiryRules.findIndex(
      (r) => r.documentName?.trim().toLowerCase() === ruleObj.documentName.toLowerCase() && r.id !== ruleId
    );
    if (duplicateDocIdx >= 0) {
      return res.status(400).json({
        success: false,
        message: `An expiry tracker rule for "${ruleObj.documentName}" already exists. Each license can have only one tracker rule. Please edit the existing rule instead.`,
      });
    }

    const existingIdx = config.expiryRules.findIndex((r) => r.id === ruleId);
    if (existingIdx >= 0) {
      config.expiryRules[existingIdx] = ruleObj;
    } else {
      config.expiryRules.push(ruleObj);
    }

    await config.save();
    await syncComplianceExpiryNotifications(companyId);

    return res.status(200).json({
      success: true,
      message: `Expiry rule for "${ruleObj.documentName}" saved successfully`,
      rule: ruleObj,
      expiryRules: config.expiryRules,
    });
  } catch (error) {
    console.error('Error saving expiry rule:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to save expiry rule to database',
      error: error.message,
    });
  }
};

/**
 * @desc    Delete a document-specific expiry rule from MongoDB
 * @route   DELETE /api/compliance/expiry-rules/:id
 * @access  Private
 */
export const deleteExpiryRule = async (req, res) => {
  try {
    const companyId = getCompanyId(req);
    const { id } = req.params;

    const config = await ComplianceConfig.findOne({ companyId });
    if (!config) {
      return res.status(404).json({ success: false, message: 'Compliance config not found' });
    }

    config.expiryRules = config.expiryRules.filter((r) => r.id !== id);
    await config.save();
    await syncComplianceExpiryNotifications(companyId);

    return res.status(200).json({
      success: true,
      message: 'Expiry alert rule deleted from database',
      expiryRules: config.expiryRules,
    });
  } catch (error) {
    console.error('Error deleting expiry rule:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete expiry rule',
      error: error.message,
    });
  }
};

/**
 * @desc    Add or update a verification rule in MongoDB
 * @route   POST /api/compliance/verification-rules
 * @access  Private
 */
export const saveVerificationRule = async (req, res) => {
  try {
    const companyId = getCompanyId(req);
    const ruleData = req.body;

    if (!ruleData.documentName) {
      return res.status(400).json({ success: false, message: 'Document name is required' });
    }

    let config = await ComplianceConfig.findOne({ companyId });
    if (!config) {
      config = await ComplianceConfig.create({
        companyId,
        expiryRules: DEFAULT_EXPIRY_RULES,
        verificationRules: DEFAULT_VERIFICATION_RULES,
      });
    }

    const ruleId = ruleData.id || `vr-${Date.now()}`;
    const ruleObj = {
      id: ruleId,
      documentName: ruleData.documentName.trim(),
      category: ruleData.category || 'Identity',
      verificationRequired: ruleData.verificationRequired !== false,
      verificationMethod: ruleData.verificationMethod || 'Physical Verification',
      verifierRole: ruleData.verifierRole || 'HR Verifier',
      verificationDeadline: ruleData.verificationDeadline || '7 Days from Joining',
      validity: ruleData.validity || '1 Year (365 Days)',
      requireBeforeActivation: !!ruleData.requireBeforeActivation,
      reverifyAfterExpiry: !!ruleData.reverifyAfterExpiry,
      remarks: ruleData.remarks || '',
      status: ruleData.status || 'Active',
      lastUpdated: new Date().toLocaleDateString(),
    };

    // Check if a verification rule for this license type already exists under a different ID
    const duplicateDocIdx = config.verificationRules.findIndex(
      (r) => r.documentName?.trim().toLowerCase() === ruleObj.documentName.toLowerCase() && r.id !== ruleId
    );
    if (duplicateDocIdx >= 0) {
      return res.status(400).json({
        success: false,
        message: `A verification rule for "${ruleObj.documentName}" already exists. Please edit the existing rule instead.`,
      });
    }

    const existingIdx = config.verificationRules.findIndex((r) => r.id === ruleId);
    if (existingIdx >= 0) {
      config.verificationRules[existingIdx] = ruleObj;
    } else {
      config.verificationRules.push(ruleObj);
    }

    await config.save();

    return res.status(200).json({
      success: true,
      message: `Verification rule for "${ruleObj.documentName}" saved successfully`,
      rule: ruleObj,
      verificationRules: config.verificationRules,
    });
  } catch (error) {
    console.error('Error saving verification rule:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to save verification rule to database',
      error: error.message,
    });
  }
};

/**
 * @desc    Delete a verification rule from MongoDB
 * @route   DELETE /api/compliance/verification-rules/:id
 * @access  Private
 */
export const deleteVerificationRule = async (req, res) => {
  try {
    const companyId = getCompanyId(req);
    const { id } = req.params;

    const config = await ComplianceConfig.findOne({ companyId });
    if (!config) {
      return res.status(404).json({ success: false, message: 'Compliance config not found' });
    }

    config.verificationRules = config.verificationRules.filter((r) => r.id !== id);
    await config.save();

    return res.status(200).json({
      success: true,
      message: 'Verification rule deleted from database',
      verificationRules: config.verificationRules,
    });
  } catch (error) {
    console.error('Error deleting verification rule:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete verification rule',
      error: error.message,
    });
  }
};

/**
 * @desc    Update police verification governance config in MongoDB
 * @route   PUT /api/compliance/police-config
 * @access  Private
 */
export const updatePoliceConfig = async (req, res) => {
  try {
    const companyId = getCompanyId(req);
    const { policeConfig } = req.body;

    if (!policeConfig) {
      return res.status(400).json({ success: false, message: 'policeConfig is required' });
    }

    const updated = await ComplianceConfig.findOneAndUpdate(
      { companyId },
      {
        $set: {
          'policeConfig.enabled': policeConfig.enabled !== false,
          'policeConfig.mandatoryFor': policeConfig.mandatoryFor || 'Security Guards & Armed Personnel',
          'policeConfig.verificationAuthority': policeConfig.verificationAuthority || '',
          'policeConfig.verificationDeadline': Number(policeConfig.verificationDeadline) || 30,
          'policeConfig.validityPeriodYears': Number(policeConfig.validityPeriodYears) || 1,
          'policeConfig.reverificationRequired': policeConfig.reverificationRequired !== false,
          'policeConfig.blockDeploymentIfPending': policeConfig.blockDeploymentIfPending !== false,
          'policeConfig.supportingDocuments': policeConfig.supportingDocuments || [],
          'policeConfig.stages': policeConfig.stages || [],
          'policeConfig.lastUpdated': new Date().toLocaleString(),
        },
      },
      { new: true, upsert: true }
    );

    return res.status(200).json({
      success: true,
      message: 'Police verification compliance rules saved to database successfully',
      policeConfig: updated.policeConfig,
    });
  } catch (error) {
    console.error('Error updating police config:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update police verification config in database',
      error: error.message,
    });
  }
};

/**
 * Helper to compute status and days remaining for an expiry date
 */
const evaluateExpiry = (expiryDateStr, defaultAlertDays = 30, customAlertDays = null) => {
  if (!expiryDateStr) {
    return {
      daysRemaining: null,
      status: 'No Expiry',
      isAlertTriggered: false,
      urgencyLevel: 'none',
      statusLabel: 'No Expiry Date',
    };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const expDate = new Date(expiryDateStr);
  if (isNaN(expDate.getTime())) {
    return {
      daysRemaining: null,
      status: 'Invalid Date',
      isAlertTriggered: false,
      urgencyLevel: 'none',
      statusLabel: 'Invalid Date',
    };
  }

  const diffTime = expDate.getTime() - today.getTime();
  const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const threshold = customAlertDays || defaultAlertDays || 30;

  if (daysRemaining < 0) {
    const pastDays = Math.abs(daysRemaining);
    return {
      daysRemaining,
      status: 'Expired',
      isAlertTriggered: true,
      urgencyLevel: 'expired',
      statusLabel: `Expired ${pastDays} day${pastDays === 1 ? '' : 's'} ago`,
    };
  } else if (daysRemaining <= 15) {
    return {
      daysRemaining,
      status: 'Critical',
      isAlertTriggered: true,
      urgencyLevel: 'critical',
      statusLabel: `Expires in ${daysRemaining} day${daysRemaining === 1 ? '' : 's'}`,
    };
  } else if (daysRemaining <= threshold) {
    return {
      daysRemaining,
      status: 'Expiring Soon',
      isAlertTriggered: true,
      urgencyLevel: 'warning',
      statusLabel: `Expires in ${daysRemaining} days`,
    };
  } else if (daysRemaining <= 90) {
    return {
      daysRemaining,
      status: 'Upcoming',
      isAlertTriggered: false,
      urgencyLevel: 'upcoming',
      statusLabel: `Valid (${daysRemaining} days remaining)`,
    };
  } else {
    return {
      daysRemaining,
      status: 'Valid',
      isAlertTriggered: false,
      urgencyLevel: 'valid',
      statusLabel: `Valid (${daysRemaining} days remaining)`,
    };
  }
};

/**
 * @desc    Live workforce license & credential expiry tracker from MongoDB
 * @route   GET /api/compliance/expiry-tracker
 * @access  Private
 */
export const getExpiryTracker = async (req, res) => {
  try {
    const companyId = getCompanyId(req);

    // 1. Get company compliance rules
    let config = await ComplianceConfig.findOne({ companyId });
    const defaultAlertDays = config?.expiryConfig?.defaultAlertDays || 30;
    const rulesMap = {};
    if (config?.expiryRules) {
      config.expiryRules.forEach((r) => {
        if (r.status === 'Active') {
          rulesMap[r.documentName.toLowerCase()] = r.alertDays;
        }
      });
    }

    // 2. Query all active employees in MongoDB for this company
    const employees = await Employee.find({
      $or: [{ companyId }, { companyId: { $exists: false } }],
      employeeStatus: { $ne: 'Terminated' },
    }).lean();

    const trackedList = [];

    employees.forEach((emp) => {
      const empName = emp.name || 'Unnamed Employee';
      const empId = emp.employeeId || emp.employeeCode || emp._id.toString();
      const empCode = emp.employeeCode || emp.employeeId || '';
      const designation = emp.designation || 'Security Guard';
      const department = emp.department || 'Security';
      const siteLocation = emp.siteLocation || emp.site || emp.clientName || 'General Deployment';
      const clientName = emp.clientName || emp.companyName || '';
      const photo = emp.employeePhoto || emp.photo || '';
      const mobile = emp.mobile || emp.contact || '';

      // A. Arms / Gun License
      if (emp.armedLicenseNo || emp.alExpiryDate) {
        const customThreshold = rulesMap['arms / gun license'] || rulesMap['gun license'] || null;
        const evalRes = evaluateExpiry(emp.alExpiryDate, defaultAlertDays, customThreshold);
        trackedList.push({
          id: `lic-arm-${emp._id}`,
          employeeId: empId,
          employeeCode: empCode,
          employeeName: empName,
          employeePhoto: photo,
          mobile,
          designation,
          department,
          siteLocation,
          clientName,
          licenseType: 'Arms / Gun License',
          licenseCategory: 'Security License',
          licenseNo: emp.armedLicenseNo || 'Not Specified',
          expiryDate: emp.alExpiryDate || '',
          photoCopy: emp.armedLicenseCopy || '',
          ...evalRes,
          thresholdDays: customThreshold || defaultAlertDays,
        });
      }

      // B. Driving License
      if (emp.drivingLicenseNo || emp.dlExpiryDate) {
        const customThreshold = rulesMap['driving license'] || null;
        const evalRes = evaluateExpiry(emp.dlExpiryDate, defaultAlertDays, customThreshold);
        trackedList.push({
          id: `lic-dl-${emp._id}`,
          employeeId: empId,
          employeeCode: empCode,
          employeeName: empName,
          employeePhoto: photo,
          mobile,
          designation,
          department,
          siteLocation,
          clientName,
          licenseType: emp.drivingLicenseType || emp.licenseType || 'Driving License',
          licenseCategory: 'Identity',
          licenseNo: emp.drivingLicenseNo || 'Not Specified',
          expiryDate: emp.dlExpiryDate || '',
          photoCopy: emp.drivingLicenseCopy || '',
          ...evalRes,
          thresholdDays: customThreshold || defaultAlertDays,
        });
      }

      // C. Dynamic licenseList items added during employee creation / editing
      if (Array.isArray(emp.licenseList)) {
        emp.licenseList.forEach((lic, idx) => {
          if (!lic) return;
          // Avoid duplicate entry if it's already captured in armed or driving license
          const lType = lic.licenseType || 'Workforce License';
          const lNo = lic.licenseNo || '';
          if (
            (emp.armedLicenseNo && lNo === emp.armedLicenseNo) ||
            (emp.drivingLicenseNo && lNo === emp.drivingLicenseNo)
          ) {
            return;
          }

          const lTypeLower = lType.toLowerCase();
          const customThreshold =
            rulesMap[lTypeLower] ||
            (lTypeLower.includes('gun') || lTypeLower.includes('arm') ? rulesMap['arms / gun license'] : null) ||
            (lTypeLower.includes('driving') ? rulesMap['driving license'] : null);

          const evalRes = evaluateExpiry(lic.expiryDate, defaultAlertDays, customThreshold);
          trackedList.push({
            id: `lic-dyn-${emp._id}-${idx}`,
            employeeId: empId,
            employeeCode: empCode,
            employeeName: empName,
            employeePhoto: photo,
            mobile,
            designation,
            department,
            siteLocation,
            clientName,
            licenseType: lType,
            licenseCategory: lType.toLowerCase().includes('gun') || lType.toLowerCase().includes('guard') ? 'Security License' : 'Compliance',
            licenseNo: lNo || 'Attached in Dossier',
            expiryDate: lic.expiryDate || '',
            photoCopy: lic.photo || '',
            ...evalRes,
            thresholdDays: customThreshold || defaultAlertDays,
          });
        });
      }

      // D. Police Verification Certificate from documents/documentList
      const pvcDoc =
        emp.documents?.policeVerification ||
        emp.documents?.pvc ||
        (Array.isArray(emp.documentList) ? emp.documentList.find((d) => d && (d.name?.toLowerCase().includes('police') || d.type?.toLowerCase().includes('police'))) : null);

      if (pvcDoc && (pvcDoc.expiryDate || pvcDoc.date || pvcDoc.photo)) {
        const customThreshold = rulesMap['police verification certificate'] || rulesMap['police clearance'] || 60;
        const evalRes = evaluateExpiry(pvcDoc.expiryDate || pvcDoc.date, defaultAlertDays, customThreshold);
        trackedList.push({
          id: `lic-pvc-${emp._id}`,
          employeeId: empId,
          employeeCode: empCode,
          employeeName: empName,
          employeePhoto: photo,
          mobile,
          designation,
          department,
          siteLocation,
          clientName,
          licenseType: 'Police Verification Certificate',
          licenseCategory: 'Compliance',
          licenseNo: pvcDoc.docNumber || pvcDoc.certificateNo || 'PCC-' + empCode,
          expiryDate: pvcDoc.expiryDate || pvcDoc.date || '',
          photoCopy: pvcDoc.photo || pvcDoc.file || '',
          ...evalRes,
          thresholdDays: customThreshold,
        });
      }
    });

    // Sort: Expired first, then by daysRemaining ascending (most urgent first)
    trackedList.sort((a, b) => {
      if (a.daysRemaining === null && b.daysRemaining === null) return 0;
      if (a.daysRemaining === null) return 1;
      if (b.daysRemaining === null) return -1;
      return a.daysRemaining - b.daysRemaining;
    });

    // Summary Metrics
    const totalTracked = trackedList.length;
    const expiredCount = trackedList.filter((item) => item.status === 'Expired').length;
    const criticalCount = trackedList.filter((item) => item.status === 'Critical').length;
    const expiringSoonCount = trackedList.filter((item) => item.status === 'Expiring Soon').length;
    const validCount = trackedList.filter((item) => item.status === 'Valid' || item.status === 'Upcoming').length;

    // Trigger background sync if In-App Activity Bell is active
    syncComplianceExpiryNotifications(companyId).catch((err) =>
      console.warn('Async compliance notification sync error:', err.message)
    );

    return res.status(200).json({
      success: true,
      summary: {
        totalTracked,
        expiredCount,
        criticalCount,
        expiringSoonCount,
        validCount,
        activeAlertsTotal: expiredCount + criticalCount + expiringSoonCount,
      },
      trackedLicenses: trackedList,
    });
  } catch (error) {
    console.error('Error fetching expiry tracker data:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to evaluate workforce license expiry alerts from database',
      error: error.message,
    });
  }
};

/**
 * @desc    Synchronize license expiry alerts into the Notification system based on In-App Bell settings
 */
export const syncComplianceExpiryNotifications = async (companyId) => {
  try {
    if (!companyId) return { synced: 0, active: false };
    const config = await ComplianceConfig.findOne({ companyId }).lean();

    const isAlertsEnabled = config?.expiryConfig?.enabled !== false;
    const isInAppBellTicked = config?.expiryConfig?.channels?.inApp === true;

    // If automated alerts are disabled OR In-App Activity Bell is UNTICKED -> suppress/clean active alerts
    if (!isAlertsEnabled || !isInAppBellTicked) {
      await Notification.deleteMany({
        companyId,
        type: { $in: ['document-expiry', 'compliance_alert'] },
        referenceId: { $regex: /^lic-exp-/ },
      });
      return { synced: 0, active: false };
    }

    // In-App Activity Bell is TICKED -> evaluate all active employees dynamically
    const defaultAlertDays = config?.expiryConfig?.defaultAlertDays || 30;
    const rulesMap = {};
    if (config?.expiryRules) {
      config.expiryRules.forEach((r) => {
        if (r.status === 'Active') {
          rulesMap[r.documentName.toLowerCase()] = r.alertDays;
        }
      });
    }

    const employees = await Employee.find({
      $or: [{ companyId }, { companyId: { $exists: false } }],
      employeeStatus: { $ne: 'Terminated' },
    }).lean();

    const recipientRoles = [];
    if (config?.expiryConfig?.recipients?.admin !== false) recipientRoles.push('admin');
    if (config?.expiryConfig?.recipients?.hr) recipientRoles.push('hr');
    if (recipientRoles.length === 0) recipientRoles.push('admin');

    const activeRefIds = [];

    for (const emp of employees) {
      const empName = emp.name || 'Unnamed Employee';
      const empId = emp.employeeId || emp.employeeCode || emp._id.toString();
      const empCode = emp.employeeCode || emp.employeeId || '';
      const clientName = emp.clientName || emp.companyName || '';

      const licensesToEvaluate = [];

      // 1. Armed / Gun License
      if (emp.armedLicenseNo || emp.alExpiryDate) {
        const customThreshold = rulesMap['arms / gun license'] || rulesMap['gun license'] || null;
        licensesToEvaluate.push({
          type: 'Arms / Gun License',
          licenseNo: emp.armedLicenseNo || 'Not Specified',
          expiryDate: emp.alExpiryDate,
          threshold: customThreshold || defaultAlertDays,
        });
      }

      // 2. Driving License
      if (emp.drivingLicenseNo || emp.dlExpiryDate) {
        const customThreshold = rulesMap['driving license'] || null;
        licensesToEvaluate.push({
          type: emp.drivingLicenseType || emp.licenseType || 'Driving License',
          licenseNo: emp.drivingLicenseNo || 'Not Specified',
          expiryDate: emp.dlExpiryDate,
          threshold: customThreshold || defaultAlertDays,
        });
      }

      // 3. Dynamic licenseList items
      if (Array.isArray(emp.licenseList)) {
        emp.licenseList.forEach((lic) => {
          if (!lic) return;
          const lType = lic.licenseType || 'Workforce License';
          const lNo = lic.licenseNo || '';
          if (
            (emp.armedLicenseNo && lNo === emp.armedLicenseNo) ||
            (emp.drivingLicenseNo && lNo === emp.drivingLicenseNo)
          ) {
            return;
          }
          const lTypeLower = lType.toLowerCase();
          const customThreshold =
            rulesMap[lTypeLower] ||
            (lTypeLower.includes('gun') || lTypeLower.includes('arm') ? rulesMap['arms / gun license'] : null) ||
            (lTypeLower.includes('driving') ? rulesMap['driving license'] : null);

          licensesToEvaluate.push({
            type: lType,
            licenseNo: lNo || 'Attached in Dossier',
            expiryDate: lic.expiryDate,
            threshold: customThreshold || defaultAlertDays,
          });
        });
      }

      // 4. Police Verification Certificate
      const pvcDoc =
        emp.documents?.policeVerification ||
        emp.documents?.pvc ||
        (Array.isArray(emp.documentList)
          ? emp.documentList.find((d) => d && (d.name?.toLowerCase().includes('police') || d.type?.toLowerCase().includes('police')))
          : null);

      if (pvcDoc && (pvcDoc.expiryDate || pvcDoc.date || pvcDoc.photo)) {
        const customThreshold = rulesMap['police verification certificate'] || rulesMap['police clearance'] || 60;
        licensesToEvaluate.push({
          type: 'Police Verification Certificate',
          licenseNo: pvcDoc.docNumber || pvcDoc.certificateNo || 'PCC-' + empCode,
          expiryDate: pvcDoc.expiryDate || pvcDoc.date,
          threshold: customThreshold,
        });
      }

      for (const lic of licensesToEvaluate) {
        const evalRes = evaluateExpiry(lic.expiryDate, defaultAlertDays, lic.threshold);
        if (evalRes.isAlertTriggered) {
          const safeTypeKey = lic.type.toLowerCase().replace(/[^a-z0-9]/g, '_');
          const refId = `lic-exp-${emp._id}-${safeTypeKey}`;
          activeRefIds.push(refId);

          const isExpired = evalRes.status === 'Expired';
          const title = isExpired
            ? `🚨 EXPIRED: ${lic.type} - ${empName}`
            : `⚠️ URGENT: ${lic.type} Expiring - ${empName}`;

          const message = isExpired
            ? `${empName} (${empCode || empId})'s ${lic.type} (No: ${lic.licenseNo}) expired on ${lic.expiryDate || 'N/A'}. Duty replacement or immediate renewal mandated.`
            : `${empName} (${empCode || empId})'s ${lic.type} (No: ${lic.licenseNo}) expires on ${lic.expiryDate || 'N/A'} (${evalRes.daysRemaining} days remaining). Please initiate renewal process.`;

          const priority = isExpired || evalRes.daysRemaining <= 15 ? 'urgent' : 'important';

          await Notification.findOneAndUpdate(
            { companyId, referenceId: refId },
            {
              $set: {
                title,
                message,
                priority,
                employeeId: emp.employeeId || emp._id.toString(),
                employeeName: empName,
                clientName,
                targetModule: 'compliance',
                targetUrl: '/admin/document-compliance?tab=expiry-alert',
                date: new Date().toISOString().slice(0, 10),
              },
              $setOnInsert: {
                companyId,
                adminEmail: config.adminEmail || 'admin@rrsecurity.com',
                recipientRole: recipientRoles[0] || 'admin',
                recipientId: 'admin',
                type: 'document-expiry',
                referenceId: refId,
                status: 'unread',
                actionStatus: 'pending',
              },
            },
            { upsert: true, new: true }
          );
        }
      }
    }

    // Clean up notifications for licenses that are no longer expiring or have been renewed/deleted
    if (activeRefIds.length > 0) {
      await Notification.deleteMany({
        companyId,
        type: { $in: ['document-expiry', 'compliance_alert'] },
        referenceId: { $regex: /^lic-exp-/, $nin: activeRefIds },
      });
    } else {
      await Notification.deleteMany({
        companyId,
        type: { $in: ['document-expiry', 'compliance_alert'] },
        referenceId: { $regex: /^lic-exp-/ },
      });
    }

    return { synced: activeRefIds.length, active: true };
  } catch (error) {
    console.error('Error in syncComplianceExpiryNotifications:', error);
    return { synced: 0, error: error.message };
  }
};

/**
 * @desc    Send an automated alert notification for an expiring license
 * @route   POST /api/compliance/send-alert
 * @access  Private
 */
export const sendExpiryAlertNotification = async (req, res) => {
  try {
    const companyId = getCompanyId(req);
    const { employeeId, employeeName, licenseType, licenseNo, expiryDate, daysRemaining } = req.body;

    const isExpired = Number(daysRemaining) < 0;
    const title = isExpired
      ? `🚨 EXPIRED LICENSE: ${licenseType} for ${employeeName}`
      : `⚠️ URGENT: ${licenseType} Expiring for ${employeeName}`;

    const message = isExpired
      ? `${employeeName} (${employeeId}) has an expired ${licenseType} (No: ${licenseNo}) which expired on ${expiryDate}. Immediate renewal or duty replacement mandated.`
      : `${employeeName} (${employeeId}) has a ${licenseType} (No: ${licenseNo}) expiring on ${expiryDate} (${daysRemaining} days remaining). Please initiate renewal process.`;

    if (Notification) {
      await Notification.create({
        companyId,
        recipientRole: 'admin',
        type: 'document-expiry',
        title,
        message,
        targetModule: 'compliance',
        targetUrl: '/admin/document-compliance?tab=expiry-alert',
        referenceId: `lic-manual-${Date.now()}`,
        priority: isExpired ? 'urgent' : 'important',
        status: 'unread',
        actionStatus: 'pending',
      });
    }

    // Retrieve company & employee data to populate full email template
    const [config, emp] = await Promise.all([
      ComplianceConfig.findOne({ companyId }).lean(),
      Employee.findOne({
        $or: [{ employeeId }, { employeeCode: employeeId }, { _id: employeeId.match(/^[0-9a-fA-F]{24}$/) ? employeeId : null }],
      }).lean(),
    ]);

    const recipientEmail = config?.adminEmail || req.user?.email || process.env.EMAIL;
    const companyName = config?.companyName || req.user?.companyName || 'RR Security & Facilities';

    if (!recipientEmail) {
      return res.status(400).json({ success: false, message: 'Admin email not found to dispatch alert.' });
    }

    // Dispatch professional HTML email alert
    sendLicenseExpiryEmailAlert({
      to: recipientEmail,
      employeeData: emp || {
        name: employeeName,
        employeeId,
        designation: 'Security Personnel',
        department: 'Operations & Security',
        siteLocation: 'General Deployment',
      },
      licenseData: {
        licenseType,
        licenseNo,
        licenseCategory: 'Security Compliance',
        expiryDate,
        daysRemaining,
        status: isExpired ? 'Expired' : Number(daysRemaining) <= 15 ? 'Critical' : 'Expiring Soon',
        thresholdDays: config?.expiryConfig?.defaultAlertDays || 30,
      },
      companyName,
      companyId,
    }).catch((emailErr) => console.warn('[Compliance] Expiry email dispatch error:', emailErr.message));

    return res.status(200).json({
      success: true,
      message: `Expiry alert notification & email dispatched for ${employeeName} to ${recipientEmail}`,
    });
  } catch (error) {
    console.error('Error dispatching compliance alert:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to send compliance notification',
      error: error.message,
    });
  }
};
