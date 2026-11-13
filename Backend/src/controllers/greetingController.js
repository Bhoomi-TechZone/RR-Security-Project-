import mongoose from 'mongoose';
import Company from '../models/companyModel.js';
import {
  DEFAULT_GREETINGS_CONFIG,
  getUpcomingCelebrations,
  dispatchGreetingsForCompany
} from '../services/greetingService.js';
import { getDynamicEmailConfig } from '../services/emailService.js';

/**
 * Resolve target company by companyId or fallback to user company
 */
const resolveCompany = async (companyIdHeader, adminEmail) => {
  if (companyIdHeader) {
    const isObjectId = mongoose.isValidObjectId(companyIdHeader);
    const found = await Company.findOne({
      $or: [
        { companyId: companyIdHeader },
        ...(isObjectId ? [{ _id: companyIdHeader }] : [])
      ]
    });
    if (found) return found;
  }

  // Fallback to admin default active company
  if (adminEmail) {
    const adminComp = await Company.findOne({
      adminEmail: adminEmail.toLowerCase(),
      status: 'Active'
    }).sort({ isDefault: -1, createdAt: 1 });
    if (adminComp) return adminComp;
  }

  return await Company.findOne({ status: 'Active' }).sort({ isDefault: -1, createdAt: 1 });
};

/**
 * @desc    Get dynamic greetings configuration and upcoming celebrations for active company
 * @route   GET /api/greetings
 * @access  Private (Admin / HR)
 */
export const getGreetingsConfig = async (req, res) => {
  try {
    const companyId = req.headers['x-company-id'] || req.query.companyId;
    const adminEmail = req.user?.email || '';

    const company = await resolveCompany(companyId, adminEmail);
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'No active company found to load greetings configuration.'
      });
    }

    const savedConfig = company.preferences?.greetingsConfig || {};
    const mergedConfig = {
      birthday: {
        enabled: savedConfig.birthday?.enabled !== undefined ? Boolean(savedConfig.birthday.enabled) : DEFAULT_GREETINGS_CONFIG.birthday.enabled,
        subject: String(savedConfig.birthday?.subject || DEFAULT_GREETINGS_CONFIG.birthday.subject),
        message: String(savedConfig.birthday?.message || DEFAULT_GREETINGS_CONFIG.birthday.message)
      },
      workAnniversary: {
        enabled: savedConfig.workAnniversary?.enabled !== undefined ? Boolean(savedConfig.workAnniversary.enabled) : DEFAULT_GREETINGS_CONFIG.workAnniversary.enabled,
        subject: String(savedConfig.workAnniversary?.subject || DEFAULT_GREETINGS_CONFIG.workAnniversary.subject),
        message: String(savedConfig.workAnniversary?.message || DEFAULT_GREETINGS_CONFIG.workAnniversary.message)
      }
    };

    // Calculate upcoming celebrations for this company
    const activeCompanyId = company.companyId || String(company._id);
    const upcomingEvents = await getUpcomingCelebrations([activeCompanyId, String(company._id)], 30);

    // Check if company has isolated email credentials configured
    const emailConfig = await getDynamicEmailConfig(activeCompanyId);

    return res.status(200).json({
      success: true,
      companyId: activeCompanyId,
      companyName: company.name || company.companyName || 'RR Security & Facilities',
      emailConfigured: emailConfig.isConfigured,
      senderEmail: emailConfig.fromEmail || emailConfig.user || '',
      config: mergedConfig,
      upcomingEvents
    });
  } catch (error) {
    console.error('[GreetingController] Error fetching greetings config:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch greetings configuration.'
    });
  }
};

/**
 * @desc    Save greetings configuration per isolated company
 * @route   PUT /api/greetings
 * @access  Private (Admin / HR)
 */
export const updateGreetingsConfig = async (req, res) => {
  try {
    const companyId = req.headers['x-company-id'] || req.body.companyId;
    const adminEmail = req.user?.email || '';

    const company = await resolveCompany(companyId, adminEmail);
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Target company not found to save greetings configuration.'
      });
    }

    const { birthday, workAnniversary } = req.body;

    const newGreetingsConfig = {
      birthday: {
        enabled: birthday?.enabled !== undefined ? Boolean(birthday.enabled) : true,
        subject: String(birthday?.subject !== undefined ? birthday.subject : DEFAULT_GREETINGS_CONFIG.birthday.subject),
        message: String(birthday?.message !== undefined ? birthday.message : DEFAULT_GREETINGS_CONFIG.birthday.message)
      },
      workAnniversary: {
        enabled: workAnniversary?.enabled !== undefined ? Boolean(workAnniversary.enabled) : true,
        subject: String(workAnniversary?.subject !== undefined ? workAnniversary.subject : DEFAULT_GREETINGS_CONFIG.workAnniversary.subject),
        message: String(workAnniversary?.message !== undefined ? workAnniversary.message : DEFAULT_GREETINGS_CONFIG.workAnniversary.message)
      }
    };

    await Company.updateOne(
      { _id: company._id },
      { $set: { 'preferences.greetingsConfig': newGreetingsConfig } }
    );

    return res.status(200).json({
      success: true,
      message: 'Greetings configuration saved successfully for ' + (company.name || 'this company') + '.',
      config: newGreetingsConfig
    });
  } catch (error) {
    console.error('[GreetingController] Error updating greetings config:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to save greetings configuration.'
    });
  }
};

/**
 * @desc    Trigger immediate greetings dispatch check for today
 * @route   POST /api/greetings/dispatch
 * @access  Private (Admin / HR)
 */
export const triggerGreetingsDispatch = async (req, res) => {
  try {
    const companyId = req.headers['x-company-id'] || req.body.companyId;
    const adminEmail = req.user?.email || '';
    const force = Boolean(req.body.force);

    const company = await resolveCompany(companyId, adminEmail);
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Target company not found.'
      });
    }

    const result = await dispatchGreetingsForCompany(company, { force });

    return res.status(200).json({
      success: true,
      message: `Greetings dispatch completed: ${result.birthdaySentCount} birthday email(s), ${result.anniversarySentCount} anniversary email(s), ${result.notificationsCreated} panel notification(s) dispatched.`,
      result
    });
  } catch (error) {
    console.error('[GreetingController] Error triggering greetings dispatch:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to dispatch greetings.'
    });
  }
};

