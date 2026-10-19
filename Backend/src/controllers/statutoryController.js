import mongoose from 'mongoose';
import StatutoryConfig from '../models/statutoryModel.js';
import Company from '../models/companyModel.js';

const DEFAULT_PT_SLABS = [
  {
    id: 'pt-mh-1',
    state: 'Maharashtra',
    minSalary: 0,
    maxSalary: 7500,
    taxAmount: 0,
    effectiveFrom: '2026-04-01',
    status: 'active',
  },
  {
    id: 'pt-mh-2',
    state: 'Maharashtra',
    minSalary: 7501,
    maxSalary: 10000,
    taxAmount: 175,
    effectiveFrom: '2026-04-01',
    status: 'active',
  },
  {
    id: 'pt-mh-3',
    state: 'Maharashtra',
    minSalary: 10001,
    maxSalary: 9999999,
    taxAmount: 200,
    februaryTaxAmount: 300,
    effectiveFrom: '2026-04-01',
    status: 'active',
  },
  {
    id: 'pt-ka-1',
    state: 'Karnataka',
    minSalary: 0,
    maxSalary: 15000,
    taxAmount: 0,
    effectiveFrom: '2026-04-01',
    status: 'active',
  },
  {
    id: 'pt-ka-2',
    state: 'Karnataka',
    minSalary: 15001,
    maxSalary: 9999999,
    taxAmount: 200,
    effectiveFrom: '2026-04-01',
    status: 'active',
  },
  {
    id: 'pt-tg-1',
    state: 'Telangana',
    minSalary: 0,
    maxSalary: 15000,
    taxAmount: 0,
    effectiveFrom: '2026-04-01',
    status: 'active',
  },
  {
    id: 'pt-tg-2',
    state: 'Telangana',
    minSalary: 15001,
    maxSalary: 20000,
    taxAmount: 150,
    effectiveFrom: '2026-04-01',
    status: 'active',
  },
  {
    id: 'pt-tg-3',
    state: 'Telangana',
    minSalary: 20001,
    maxSalary: 9999999,
    taxAmount: 200,
    effectiveFrom: '2026-04-01',
    status: 'active',
  },
  {
    id: 'pt-gj-1',
    state: 'Gujarat',
    minSalary: 0,
    maxSalary: 12000,
    taxAmount: 0,
    effectiveFrom: '2026-04-01',
    status: 'active',
  },
  {
    id: 'pt-gj-2',
    state: 'Gujarat',
    minSalary: 12001,
    maxSalary: 9999999,
    taxAmount: 200,
    effectiveFrom: '2026-04-01',
    status: 'active',
  },
];

const DEFAULT_LWF_RULES = [
  {
    id: 'lwf-mh',
    state: 'Maharashtra',
    employeeContribution: 12,
    employerContribution: 36,
    frequency: 'Half-Yearly',
    deductionMonths: 'June & December',
    status: 'active',
    effectiveDate: '2026-04-01',
  },
  {
    id: 'lwf-ka',
    state: 'Karnataka',
    employeeContribution: 20,
    employerContribution: 40,
    frequency: 'Yearly',
    deductionMonths: 'December',
    status: 'active',
    effectiveDate: '2026-04-01',
  },
  {
    id: 'lwf-hr',
    state: 'Haryana',
    employeeContribution: 25,
    employerContribution: 50,
    frequency: 'Monthly',
    deductionMonths: 'Every Month',
    status: 'active',
    effectiveDate: '2026-04-01',
  },
  {
    id: 'lwf-dl',
    state: 'Delhi',
    employeeContribution: 0.75,
    employerContribution: 2.25,
    frequency: 'Monthly',
    deductionMonths: 'Every Month',
    status: 'active',
    effectiveDate: '2026-04-01',
  },
  {
    id: 'lwf-wb',
    state: 'West Bengal',
    employeeContribution: 3,
    employerContribution: 15,
    frequency: 'Half-Yearly',
    deductionMonths: 'June & December',
    status: 'active',
    effectiveDate: '2026-04-01',
  },
];

/**
 * Resolves the statutory configuration across company IDs and aliases
 */
export const resolveStatutoryConfig = async (companyId, adminEmail = null) => {
  const candidateIds = new Set();
  if (companyId) candidateIds.add(String(companyId).trim());

  let comp = null;
  try {
    comp = await Company.findOne({
      $or: [
        { companyId },
        ...(mongoose.isValidObjectId(companyId) ? [{ _id: companyId }] : []),
        { code: companyId },
        ...(adminEmail ? [{ email: adminEmail.toLowerCase() }, { adminEmail: adminEmail.toLowerCase() }] : [])
      ]
    }).lean();

    if (comp) {
      if (comp.companyId) candidateIds.add(comp.companyId);
      if (comp._id) candidateIds.add(String(comp._id));
      if (comp.code) candidateIds.add(comp.code);
    }
  } catch {}

  const specificIds = Array.from(candidateIds).filter(Boolean);

  let config = null;
  if (specificIds.length > 0) {
    config = await StatutoryConfig.findOne({ companyId: { $in: specificIds } });
  }

  if (!config && adminEmail) {
    config = await StatutoryConfig.findOne({ adminEmail: adminEmail.toLowerCase() });
  }

  if (!config) {
    config = await StatutoryConfig.findOne({
      $or: [
        { companyId: { $in: ['RRS8392014SEC', 'comp_rr_security'] } },
        { isDefault: true }
      ]
    });
  }

  const primaryCompanyId = (companyId && String(companyId).trim()) || comp?.companyId || (specificIds.length > 0 ? specificIds[0] : 'RRS8392014SEC');

  return { config, primaryCompanyId, resolvedIds: specificIds };
};

/**
 * @desc    Get statutory setup configuration for company directly from MongoDB
 * @route   GET /api/statutory
 * @access  Private
 */
export const getStatutoryConfig = async (req, res) => {
  try {
    const user = req.user;
    const rawCompanyId = req.headers['x-company-id'] || req.query.companyId || user?.companyId || 'RRS8392014SEC';
    const adminEmail = user?.email || 'admin@rrsecurity.com';

    let { config, primaryCompanyId } = await resolveStatutoryConfig(rawCompanyId, adminEmail);

    if (!config) {
      // Seed initial standard compliance rules in MongoDB Atlas
      config = await StatutoryConfig.create({
        companyId: primaryCompanyId,
        adminEmail,
        ptSlabs: DEFAULT_PT_SLABS,
        lwfRules: DEFAULT_LWF_RULES,
      });
    }

    return res.status(200).json({
      success: true,
      config: config.toJSON(),
    });
  } catch (error) {
    console.error('Error fetching statutory config from database:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve statutory configuration.',
      error: error.message,
    });
  }
};

/**
 * @desc    Update a specific statutory module (e.g. pf, esi, pt, tds, bonus, gratuity, lwf)
 * @route   PUT /api/statutory/:moduleKey
 * @access  Private (Admin)
 */
export const updateStatutoryModule = async (req, res) => {
  try {
    const user = req.user;
    const rawCompanyId = req.headers['x-company-id'] || req.body.companyId || user?.companyId || 'RRS8392014SEC';
    const { moduleKey } = req.params;
    const moduleData = req.body;
    const adminEmail = user?.email || 'admin@rrsecurity.com';

    const validModules = ['pf', 'esi', 'pt', 'tds', 'bonus', 'gratuity', 'lwf'];
    if (!validModules.includes(moduleKey)) {
      return res.status(400).json({
        success: false,
        message: `Invalid module key: ${moduleKey}. Must be one of ${validModules.join(', ')}`,
      });
    }

    let { config, primaryCompanyId } = await resolveStatutoryConfig(rawCompanyId, adminEmail);
    if (!config) {
      config = await StatutoryConfig.create({
        companyId: primaryCompanyId,
        adminEmail,
        ptSlabs: DEFAULT_PT_SLABS,
        lwfRules: DEFAULT_LWF_RULES,
      });
    }

    const timestamp = new Date().toISOString().split('T')[0];
    const adminName = user?.name || user?.email || 'Admin';

    config[moduleKey] = {
      ...(config[moduleKey] || {}),
      ...moduleData,
      lastUpdatedBy: adminName,
      lastUpdatedDate: timestamp,
    };

    config.markModified(moduleKey);
    await config.save();

    return res.status(200).json({
      success: true,
      message: `✓ ${moduleKey.toUpperCase()} settings saved successfully in database.`,
      config: config.toJSON(),
    });
  } catch (error) {
    console.error('Error updating statutory module:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to save statutory settings.',
      error: error.message,
    });
  }
};

/**
 * @desc    Toggle module active / inactive status
 * @route   PUT /api/statutory/toggle/:moduleKey
 * @access  Private (Admin)
 */
export const toggleModuleStatus = async (req, res) => {
  try {
    const user = req.user;
    const rawCompanyId = req.headers['x-company-id'] || req.body.companyId || user?.companyId || 'RRS8392014SEC';
    const { moduleKey } = req.params;
    const { enabled } = req.body;
    const adminEmail = user?.email || 'admin@rrsecurity.com';

    const validModules = ['pf', 'esi', 'pt', 'tds', 'bonus', 'gratuity', 'lwf'];
    if (!validModules.includes(moduleKey)) {
      return res.status(400).json({
        success: false,
        message: `Invalid module key: ${moduleKey}`,
      });
    }

    let { config, primaryCompanyId } = await resolveStatutoryConfig(rawCompanyId, adminEmail);
    if (!config) {
      config = await StatutoryConfig.create({
        companyId: primaryCompanyId,
        adminEmail,
        ptSlabs: DEFAULT_PT_SLABS,
        lwfRules: DEFAULT_LWF_RULES,
      });
    }

    const timestamp = new Date().toISOString().split('T')[0];
    const adminName = user?.name || user?.email || 'Admin';

    if (!config[moduleKey]) config[moduleKey] = {};
    config[moduleKey].enabled = Boolean(enabled);
    config[moduleKey].status = enabled ? 'active' : 'inactive';
    config[moduleKey].lastUpdatedBy = adminName;
    config[moduleKey].lastUpdatedDate = timestamp;

    config.markModified(moduleKey);
    await config.save();

    return res.status(200).json({
      success: true,
      message: `✓ ${moduleKey.toUpperCase()} status updated to ${enabled ? 'active' : 'inactive'}.`,
      config: config.toJSON(),
    });
  } catch (error) {
    console.error('Error toggling statutory module:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to toggle module status.',
      error: error.message,
    });
  }
};

/**
 * @desc    Add or update PT Slab in MongoDB Atlas
 * @route   POST /api/statutory/pt-slabs
 * @access  Private (Admin)
 */
export const savePTSlab = async (req, res) => {
  try {
    const user = req.user;
    const rawCompanyId = req.headers['x-company-id'] || req.body.companyId || user?.companyId || 'RRS8392014SEC';
    const slabData = req.body;
    const adminEmail = user?.email || 'admin@rrsecurity.com';

    let { config, primaryCompanyId } = await resolveStatutoryConfig(rawCompanyId, adminEmail);
    if (!config) {
      config = await StatutoryConfig.create({
        companyId: primaryCompanyId,
        adminEmail,
        ptSlabs: DEFAULT_PT_SLABS,
        lwfRules: DEFAULT_LWF_RULES,
      });
    }

    const slabId = String(
      (slabData.id && String(slabData.id).trim()) ||
      (slabData._id && String(slabData._id).trim()) ||
      `pt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`
    );

    const formattedSlab = {
      id: slabId,
      state: String(slabData.state || 'Maharashtra').trim(),
      minSalary: slabData.minSalary !== undefined && slabData.minSalary !== '' ? Number(slabData.minSalary) : 0,
      maxSalary: slabData.maxSalary !== undefined && slabData.maxSalary !== '' ? Number(slabData.maxSalary) : 9999999,
      taxAmount: slabData.taxAmount !== undefined && slabData.taxAmount !== '' ? Number(slabData.taxAmount) : 0,
      februaryTaxAmount: slabData.februaryTaxAmount !== undefined && slabData.februaryTaxAmount !== '' ? Number(slabData.februaryTaxAmount) : 0,
      effectiveFrom: slabData.effectiveFrom || '2026-04-01',
      status: slabData.status || 'active',
    };

    const currentSlabs = Array.isArray(config.ptSlabs) ? [...config.ptSlabs] : [];
    const existingIdx = currentSlabs.findIndex((s) => s.id === slabId || String(s._id) === slabId);
    if (existingIdx >= 0) {
      currentSlabs[existingIdx] = formattedSlab;
    } else {
      currentSlabs.unshift(formattedSlab);
    }

    config.ptSlabs = currentSlabs;
    config.markModified('ptSlabs');
    await config.save();

    return res.status(200).json({
      success: true,
      message: '✓ Professional Tax slab saved successfully in database.',
      ptSlabs: config.ptSlabs,
      config: config.toJSON(),
    });
  } catch (error) {
    console.error('Error saving PT slab:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to save PT slab.',
      error: error.message,
    });
  }
};

/**
 * @desc    Delete PT Slab from MongoDB
 * @route   DELETE /api/statutory/pt-slabs/:id
 * @access  Private (Admin)
 */
export const deletePTSlab = async (req, res) => {
  try {
    const user = req.user;
    const rawCompanyId = req.headers['x-company-id'] || req.query.companyId || user?.companyId || 'RRS8392014SEC';
    const { id } = req.params;
    const adminEmail = user?.email || 'admin@rrsecurity.com';

    let { config } = await resolveStatutoryConfig(rawCompanyId, adminEmail);

    if (!config) {
      return res.status(404).json({ success: false, message: 'Statutory configuration not found.' });
    }

    const cleanId = String(id || '').trim();
    config.ptSlabs = (config.ptSlabs || []).filter((s) => s.id !== cleanId && String(s._id) !== cleanId);
    config.markModified('ptSlabs');
    await config.save();

    return res.status(200).json({
      success: true,
      message: '✓ PT Slab deleted successfully from database.',
      ptSlabs: config.ptSlabs,
      config: config.toJSON(),
    });
  } catch (error) {
    console.error('Error deleting PT slab:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete PT slab.',
      error: error.message,
    });
  }
};

/**
 * @desc    Add or update LWF Rule in MongoDB
 * @route   POST /api/statutory/lwf-rules
 * @access  Private (Admin)
 */
export const saveLWFRule = async (req, res) => {
  try {
    const user = req.user;
    const rawCompanyId = req.headers['x-company-id'] || req.body.companyId || user?.companyId || 'RRS8392014SEC';
    const ruleData = req.body;
    const adminEmail = user?.email || 'admin@rrsecurity.com';

    let { config, primaryCompanyId } = await resolveStatutoryConfig(rawCompanyId, adminEmail);
    if (!config) {
      config = await StatutoryConfig.create({
        companyId: primaryCompanyId,
        adminEmail,
        ptSlabs: DEFAULT_PT_SLABS,
        lwfRules: DEFAULT_LWF_RULES,
      });
    }

    const ruleId = String(
      (ruleData.id && String(ruleData.id).trim()) ||
      (ruleData._id && String(ruleData._id).trim()) ||
      `lwf-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`
    );

    const formattedRule = {
      id: ruleId,
      state: String(ruleData.state || 'Maharashtra').trim(),
      employeeContribution: Number(ruleData.employeeContribution) || 0,
      employerContribution: Number(ruleData.employerContribution) || 0,
      frequency: ruleData.frequency || 'Monthly',
      deductionMonths: ruleData.deductionMonths || 'Every Month',
      status: ruleData.status || 'active',
      effectiveDate: ruleData.effectiveDate || '2026-04-01',
    };

    const currentRules = Array.isArray(config.lwfRules) ? [...config.lwfRules] : [];
    const existingIdx = currentRules.findIndex((r) => r.id === ruleId || String(r._id) === ruleId);
    if (existingIdx >= 0) {
      currentRules[existingIdx] = formattedRule;
    } else {
      currentRules.unshift(formattedRule);
    }

    config.lwfRules = currentRules;
    config.markModified('lwfRules');
    await config.save();

    return res.status(200).json({
      success: true,
      message: '✓ LWF State rule saved successfully in database.',
      lwfRules: config.lwfRules,
      config: config.toJSON(),
    });
  } catch (error) {
    console.error('Error saving LWF rule:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to save LWF rule.',
      error: error.message,
    });
  }
};

/**
 * @desc    Delete LWF Rule from MongoDB
 * @route   DELETE /api/statutory/lwf-rules/:id
 * @access  Private (Admin)
 */
export const deleteLWFRule = async (req, res) => {
  try {
    const user = req.user;
    const rawCompanyId = req.headers['x-company-id'] || req.query.companyId || user?.companyId || 'RRS8392014SEC';
    const { id } = req.params;
    const adminEmail = user?.email || 'admin@rrsecurity.com';

    let { config } = await resolveStatutoryConfig(rawCompanyId, adminEmail);

    if (!config) {
      return res.status(404).json({ success: false, message: 'Statutory configuration not found.' });
    }

    const cleanId = String(id || '').trim();
    config.lwfRules = (config.lwfRules || []).filter((r) => r.id !== cleanId && String(r._id) !== cleanId);
    config.markModified('lwfRules');
    await config.save();

    return res.status(200).json({
      success: true,
      message: '✓ LWF State rule deleted successfully from database.',
      lwfRules: config.lwfRules,
      config: config.toJSON(),
    });
  } catch (error) {
    console.error('Error deleting LWF rule:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete LWF rule.',
      error: error.message,
    });
  }
};

