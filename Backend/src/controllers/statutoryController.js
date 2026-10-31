import mongoose from 'mongoose';
import StatutoryConfig from '../models/statutoryModel.js';
import Company from '../models/companyModel.js';
import Master from '../models/masterModel.js';

export const DEFAULT_INITIAL_PF_RATES = [
  {
    id: 'rate-1',
    enabled: true,
    effectiveDate: '2026-09-01',
    displayDate: '01-Sep-2026',
    employeeRate: 12,
    employerRate: 3.67,
    pensionRate: 8.33,
    seniorEmployeeRate: 12,
    seniorEmployerRate: 3.67,
    seniorPensionRate: 8.33,
    edliAdminRate: 1,
    wageCeiling: 15000,
    seniorAge: 58,
  },
  {
    id: 'rate-2',
    enabled: false,
    effectiveDate: '1975-04-01',
    displayDate: '01-Apr-1975',
    employeeRate: 12,
    employerRate: 3.67,
    pensionRate: 8.33,
    seniorEmployeeRate: 12,
    seniorEmployerRate: 3.67,
    seniorPensionRate: 8.33,
    edliAdminRate: 1,
    wageCeiling: 0,
    seniorAge: 58,
  },
];

export const DEFAULT_INITIAL_ESI_RATES = [
  {
    id: 'esi-rate-1',
    enabled: true,
    effectiveDate: '2026-04-01',
    displayDate: '01-Apr-2026',
    employeeContribution: 0.75,
    employerContribution: 3.25,
    eligibilityWageCeiling: 21000,
    deductionWageCeiling: 0,
  },
];

export const DEFAULT_INITIAL_PT_SLABS = [
  {
    id: 'pt-bihar-1',
    state: 'Bihar',
    startDate: '2023-04-01',
    effectiveFrom: '2023-04-01',
    displayDate: '01-Apr-2023',
    salaryAbove: 25000,
    minSalary: 25000,
    maxSalary: 41666,
    taxAmount: 1000,
    gender: 'All Genders',
    month: 'Sep',
    status: 'active',
  },
  {
    id: 'pt-bihar-2',
    state: 'Bihar',
    startDate: '2023-04-01',
    effectiveFrom: '2023-04-01',
    displayDate: '01-Apr-2023',
    salaryAbove: 41667,
    minSalary: 41667,
    maxSalary: 83332,
    taxAmount: 2000,
    gender: 'All Genders',
    month: 'Sep',
    status: 'active',
  },
  {
    id: 'pt-bihar-3',
    state: 'Bihar',
    startDate: '2023-04-01',
    effectiveFrom: '2023-04-01',
    displayDate: '01-Apr-2023',
    salaryAbove: 83333,
    minSalary: 83333,
    maxSalary: 9999999,
    taxAmount: 3000,
    gender: 'All Genders',
    month: 'Sep',
    status: 'active',
  },
  {
    id: 'pt-mh-1',
    state: 'Maharashtra',
    startDate: '2023-04-01',
    effectiveFrom: '2023-04-01',
    displayDate: '01-Apr-2023',
    salaryAbove: 7500,
    minSalary: 7500,
    maxSalary: 10000,
    taxAmount: 175,
    gender: 'Male',
    month: 'All Months',
    status: 'active',
  },
  {
    id: 'pt-mh-2',
    state: 'Maharashtra',
    startDate: '2023-04-01',
    effectiveFrom: '2023-04-01',
    displayDate: '01-Apr-2023',
    salaryAbove: 10000,
    minSalary: 10000,
    maxSalary: 9999999,
    taxAmount: 200,
    gender: 'All Genders',
    month: 'All Months',
    status: 'active',
  },
  {
    id: 'pt-mh-3',
    state: 'Maharashtra',
    startDate: '2023-04-01',
    effectiveFrom: '2023-04-01',
    displayDate: '01-Apr-2023',
    salaryAbove: 10000,
    minSalary: 10000,
    maxSalary: 9999999,
    taxAmount: 300,
    februaryTaxAmount: 300,
    gender: 'All Genders',
    month: 'February',
    status: 'active',
  },
  {
    id: 'pt-kar-1',
    state: 'Karnataka',
    startDate: '2023-04-01',
    effectiveFrom: '2023-04-01',
    displayDate: '01-Apr-2023',
    salaryAbove: 15000,
    minSalary: 15000,
    maxSalary: 9999999,
    taxAmount: 200,
    gender: 'All Genders',
    month: 'All Months',
    status: 'active',
  },
];

const DEFAULT_PT_SLABS = DEFAULT_INITIAL_PT_SLABS;

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

  // NOTE: Company-to-company isolation:
  // Do NOT fall back to RR Security's configuration if this company doesn't have one!
  // Return config: null so that a dedicated, isolated config is created for THIS company.
  const primaryCompanyId = (companyId && String(companyId).trim()) || comp?.companyId || (specificIds.length > 0 ? specificIds[0] : 'RRS8392014SEC');

  let salaryComponents = [];
  try {
    if (specificIds.length > 0) {
      salaryComponents = await Master.find({
        companyId: { $in: specificIds },
        type: { $in: ['salary-components', 'earning', 'deduction'] },
        status: { $nin: ['inactive', 'Inactive'] }
      }).lean();
    }
  } catch (err) {
    console.error('Failed to query salary-components in resolveStatutoryConfig:', err);
  }

  if (config) {
    config.salaryComponents = salaryComponents;
  }

  return { config, salaryComponents, primaryCompanyId, resolvedIds: specificIds };
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
      // Seed initial isolated compliance rules for THIS company in MongoDB
      config = await StatutoryConfig.create({
        companyId: primaryCompanyId,
        adminEmail,
        pf: {
          enabled: true,
          employeeContribution: 12,
          employerContribution: 12,
          epsContribution: 8.33,
          epfEmployerContribution: 3.67,
          edliContribution: 0.5,
          adminCharges: 0.5,
          wageCeiling: 15000,
          wageCeilingRestricted: true,
          allowVPF: true,
          vpfEnabled: false,
          wageCeilingProRata: false,
          selectedComponentIds: [],
          pfRates: DEFAULT_INITIAL_PF_RATES,
          effectiveDate: '2026-09-01',
          status: 'active',
          createdBy: user?.name || user?.email || 'Admin',
          createdDate: new Date().toISOString().split('T')[0],
          lastUpdatedBy: user?.name || user?.email || 'Admin',
          lastUpdatedDate: new Date().toISOString().split('T')[0],
        },
        esi: {
          enabled: true,
          employeeContribution: 0.75,
          employerContribution: 3.25,
          wageEligibilityLimit: 21000,
          disabilityWageLimit: 25000,
          selectedComponentIds: [],
          esiRates: DEFAULT_INITIAL_ESI_RATES,
          effectiveDate: '2026-04-01',
          status: 'active',
          notes: 'Applicable to staff drawing gross monthly wage up to ₹21,000.',
          createdBy: user?.name || user?.email || 'Admin',
          createdDate: new Date().toISOString().split('T')[0],
          lastUpdatedBy: user?.name || user?.email || 'Admin',
          lastUpdatedDate: new Date().toISOString().split('T')[0],
        },
        ptSlabs: DEFAULT_PT_SLABS,
        lwfRules: DEFAULT_LWF_RULES,
      });
    } else {
      // Ensure existing config has pfRates, esiRates and new fields initialized
      let needsSave = false;
      if (!config.pf) {
        config.pf = {};
        needsSave = true;
      }
      if (!Array.isArray(config.pf.pfRates)) {
        config.pf.pfRates = DEFAULT_INITIAL_PF_RATES;
        needsSave = true;
      }
      if (!Array.isArray(config.pf.selectedComponentIds)) {
        config.pf.selectedComponentIds = [];
        needsSave = true;
      }
      if (config.pf.vpfEnabled === undefined) {
        config.pf.vpfEnabled = false;
        needsSave = true;
      }
      if (config.pf.wageCeilingProRata === undefined) {
        config.pf.wageCeilingProRata = false;
        needsSave = true;
      }

      if (!config.esi) {
        config.esi = {};
        needsSave = true;
      }
      if (!Array.isArray(config.esi.esiRates)) {
        config.esi.esiRates = DEFAULT_INITIAL_ESI_RATES;
        needsSave = true;
      }
      if (!Array.isArray(config.esi.selectedComponentIds)) {
        config.esi.selectedComponentIds = [];
        needsSave = true;
      }

      if (!config.pt) {
        config.pt = {};
        needsSave = true;
      }
      if (!Array.isArray(config.pt.selectedComponentIds)) {
        config.pt.selectedComponentIds = [];
        needsSave = true;
      }
      if (!config.pt.calculateOn) {
        config.pt.calculateOn = 'Gross Salary';
        needsSave = true;
      }
      if (!Array.isArray(config.ptSlabs)) {
        config.ptSlabs = DEFAULT_INITIAL_PT_SLABS;
        needsSave = true;
      }

      if (needsSave) {
        config.markModified('pf');
        config.markModified('esi');
        config.markModified('pt');
        config.markModified('ptSlabs');
        await config.save();
      }
    }

    const serialized = config.toJSON ? config.toJSON() : { ...config };
    serialized.salaryComponents = config.salaryComponents || [];

    return res.status(200).json({
      success: true,
      config: serialized,
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

    if (moduleKey === 'pf') {
      config.pf = {
        ...(config.pf || {}),
        ...moduleData,
        lastUpdatedBy: adminName,
        lastUpdatedDate: timestamp,
      };

      // Automatically sync active rate values if pfRates array is updated
      if (Array.isArray(moduleData.pfRates) && moduleData.pfRates.length > 0) {
        const activeRate = moduleData.pfRates.find((r) => r.enabled);
        if (activeRate) {
          config.pf.employeeContribution = Number(activeRate.employeeRate) || 12;
          config.pf.epfEmployerContribution = Number(activeRate.employerRate) || 3.67;
          config.pf.epsContribution = Number(activeRate.pensionRate) || 8.33;
          config.pf.employerContribution = (Number(activeRate.employerRate) || 3.67) + (Number(activeRate.pensionRate) || 8.33);
          config.pf.wageCeiling = Number(activeRate.wageCeiling) || 15000;
          if (activeRate.effectiveDate) config.pf.effectiveDate = activeRate.effectiveDate;
        }
      }
    } else if (moduleKey === 'esi') {
      config.esi = {
        ...(config.esi || {}),
        ...moduleData,
        lastUpdatedBy: adminName,
        lastUpdatedDate: timestamp,
      };

      // Automatically sync active rate values if esiRates array is updated
      if (Array.isArray(moduleData.esiRates) && moduleData.esiRates.length > 0) {
        const activeRate = moduleData.esiRates.find((r) => r.enabled);
        if (activeRate) {
          config.esi.employeeContribution = Number(activeRate.employeeContribution) || 0.75;
          config.esi.employerContribution = Number(activeRate.employerContribution) || 3.25;
          config.esi.wageEligibilityLimit = Number(activeRate.eligibilityWageCeiling) || 21000;
          if (activeRate.effectiveDate) config.esi.effectiveDate = activeRate.effectiveDate;
        }
      }
    } else {
      config[moduleKey] = {
        ...(config[moduleKey] || {}),
        ...moduleData,
        lastUpdatedBy: adminName,
        lastUpdatedDate: timestamp,
      };
    }

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

    const salaryAbove = slabData.salaryAbove !== undefined && slabData.salaryAbove !== ''
      ? Number(slabData.salaryAbove)
      : (slabData.minSalary !== undefined && slabData.minSalary !== '' ? Number(slabData.minSalary) : 0);

    const startDate = String(slabData.startDate || slabData.effectiveFrom || '2023-04-01').trim();
    const effectiveFrom = String(slabData.effectiveFrom || slabData.startDate || '2023-04-01').trim();
    let displayDate = String(slabData.displayDate || '').trim();
    if (!displayDate) {
      const d = new Date(startDate);
      if (!isNaN(d.getTime())) {
        const day = String(d.getDate()).padStart(2, '0');
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        displayDate = `${day}-${months[d.getMonth()]}-${d.getFullYear()}`;
      }
    }

    const formattedSlab = {
      id: slabId,
      state: String(slabData.state || 'Maharashtra').trim(),
      salaryAbove,
      minSalary: salaryAbove,
      maxSalary: slabData.maxSalary !== undefined && slabData.maxSalary !== '' ? Number(slabData.maxSalary) : 9999999,
      taxAmount: slabData.taxAmount !== undefined && slabData.taxAmount !== '' ? Number(slabData.taxAmount) : 0,
      februaryTaxAmount: slabData.februaryTaxAmount !== undefined && slabData.februaryTaxAmount !== '' ? Number(slabData.februaryTaxAmount) : 0,
      gender: String(slabData.gender || 'All Genders').trim(),
      month: String(slabData.month || 'All Months').trim(),
      startDate,
      displayDate,
      effectiveFrom,
      status: slabData.status || 'active',
    };

    const currentSlabs = Array.isArray(config.ptSlabs) ? [...config.ptSlabs] : [];
    const existingIdx = currentSlabs.findIndex((s) => String(s.id || s._id || '').trim() === slabId);
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
    const rawCompanyId = req.headers['x-company-id'] || req.query.companyId || req.body?.companyId || user?.companyId || 'RRS8392014SEC';
    const { id } = req.params;
    const adminEmail = user?.email || 'admin@rrsecurity.com';

    let { config } = await resolveStatutoryConfig(rawCompanyId, adminEmail);

    if (!config) {
      return res.status(404).json({ success: false, message: 'Statutory configuration not found.' });
    }

    const cleanId = String(id || '').trim();
    config.ptSlabs = (config.ptSlabs || []).filter((s) => String(s.id || s._id || '').trim() !== cleanId);
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

/**
 * @desc    Add or update PF Rate Change entry in MongoDB
 * @route   POST /api/statutory/pf-rates
 * @access  Private (Admin)
 */
export const savePFRate = async (req, res) => {
  try {
    const user = req.user;
    const rawCompanyId = req.headers['x-company-id'] || req.body.companyId || user?.companyId || 'RRS8392014SEC';
    const rateData = req.body;
    const adminEmail = user?.email || 'admin@rrsecurity.com';

    let { config, primaryCompanyId } = await resolveStatutoryConfig(rawCompanyId, adminEmail);
    if (!config) {
      config = await StatutoryConfig.create({
        companyId: primaryCompanyId,
        adminEmail,
        pf: {
          enabled: true,
          pfRates: DEFAULT_INITIAL_PF_RATES,
        },
        ptSlabs: DEFAULT_PT_SLABS,
        lwfRules: DEFAULT_LWF_RULES,
      });
    }

    const rateId = String(
      (rateData.id && String(rateData.id).trim()) ||
      `rate-${Date.now()}`
    );

    const formattedRate = {
      id: rateId,
      enabled: rateData.enabled !== undefined ? Boolean(rateData.enabled) : true,
      effectiveDate: String(rateData.effectiveDate || new Date().toISOString().split('T')[0]).trim(),
      displayDate: String(rateData.displayDate || '').trim(),
      employeeRate: Number(rateData.employeeRate) || 0,
      employerRate: Number(rateData.employerRate) || 0,
      pensionRate: Number(rateData.pensionRate) || 0,
      seniorEmployeeRate: Number(rateData.seniorEmployeeRate ?? rateData.employeeRate) || 0,
      seniorEmployerRate: Number(rateData.seniorEmployerRate ?? rateData.employerRate) || 0,
      seniorPensionRate: Number(rateData.seniorPensionRate ?? rateData.pensionRate) || 0,
      edliAdminRate: Number(rateData.edliAdminRate) || 0,
      wageCeiling: Number(rateData.wageCeiling) || 0,
      seniorAge: Number(rateData.seniorAge) || 58,
    };

    if (!config.pf) config.pf = {};
    const currentRates = Array.isArray(config.pf.pfRates) && config.pf.pfRates.length > 0 
      ? [...config.pf.pfRates] 
      : [...DEFAULT_INITIAL_PF_RATES];

    const existingIdx = currentRates.findIndex((r) => r.id === rateId);
    if (existingIdx >= 0) {
      currentRates[existingIdx] = formattedRate;
    } else {
      currentRates.unshift(formattedRate);
    }

    config.pf.pfRates = currentRates;

    // If enabled, also sync core PF fields
    if (formattedRate.enabled) {
      config.pf.employeeContribution = formattedRate.employeeRate;
      config.pf.epfEmployerContribution = formattedRate.employerRate;
      config.pf.epsContribution = formattedRate.pensionRate;
      config.pf.employerContribution = formattedRate.employerRate + formattedRate.pensionRate;
      config.pf.wageCeiling = formattedRate.wageCeiling;
      config.pf.effectiveDate = formattedRate.effectiveDate;
    }

    config.markModified('pf');
    await config.save();

    return res.status(200).json({
      success: true,
      message: '✓ PF Rate Change saved successfully in database.',
      pfRates: config.pf.pfRates,
      pf: config.pf,
      config: config.toJSON(),
    });
  } catch (error) {
    console.error('Error saving PF rate:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to save PF rate change.',
      error: error.message,
    });
  }
};

/**
 * @desc    Delete PF Rate Change entry from MongoDB
 * @route   DELETE /api/statutory/pf-rates/:id
 * @access  Private (Admin)
 */
export const deletePFRate = async (req, res) => {
  try {
    const user = req.user;
    const rawCompanyId = req.headers['x-company-id'] || req.query.companyId || user?.companyId || 'RRS8392014SEC';
    const { id } = req.params;
    const adminEmail = user?.email || 'admin@rrsecurity.com';

    let { config } = await resolveStatutoryConfig(rawCompanyId, adminEmail);
    if (!config || !config.pf) {
      return res.status(404).json({ success: false, message: 'Statutory configuration not found.' });
    }

    const cleanId = String(id || '').trim();
    config.pf.pfRates = (config.pf.pfRates || []).filter((r) => r.id !== cleanId);
    config.markModified('pf');
    await config.save();

    return res.status(200).json({
      success: true,
      message: '✓ PF Rate Change entry deleted successfully from database.',
      pfRates: config.pf.pfRates,
      pf: config.pf,
      config: config.toJSON(),
    });
  } catch (error) {
    console.error('Error deleting PF rate:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete PF rate change.',
      error: error.message,
    });
  }
};

/**
 * @desc    Save selected salary components for PF calculation in MongoDB
 * @route   PUT /api/statutory/pf/applicability
 * @access  Private (Admin)
 */
export const savePFApplicability = async (req, res) => {
  try {
    const user = req.user;
    const rawCompanyId = req.headers['x-company-id'] || req.body.companyId || user?.companyId || 'RRS8392014SEC';
    const { selectedComponentIds } = req.body;
    const adminEmail = user?.email || 'admin@rrsecurity.com';

    let { config, primaryCompanyId } = await resolveStatutoryConfig(rawCompanyId, adminEmail);
    if (!config) {
      config = await StatutoryConfig.create({
        companyId: primaryCompanyId,
        adminEmail,
        pf: {
          enabled: true,
          pfRates: DEFAULT_INITIAL_PF_RATES,
          selectedComponentIds: selectedComponentIds || [],
        },
        ptSlabs: DEFAULT_PT_SLABS,
        lwfRules: DEFAULT_LWF_RULES,
      });
    } else {
      if (!config.pf) config.pf = {};
      config.pf.selectedComponentIds = Array.isArray(selectedComponentIds) ? selectedComponentIds : [];
      config.markModified('pf');
      await config.save();
    }

    return res.status(200).json({
      success: true,
      message: '✓ Salary Component PF applicability saved successfully in database.',
      selectedComponentIds: config.pf.selectedComponentIds,
      config: config.toJSON(),
    });
  } catch (error) {
    console.error('Error saving PF applicability:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to save PF component applicability.',
      error: error.message,
    });
  }
};

/**
 * @desc    Add or update ESI Rate Change entry in MongoDB
 * @route   POST /api/statutory/esi-rates
 * @access  Private (Admin)
 */
export const saveESIRate = async (req, res) => {
  try {
    const user = req.user;
    const rawCompanyId = req.headers['x-company-id'] || req.body.companyId || user?.companyId || 'RRS8392014SEC';
    const rateData = req.body;
    const adminEmail = user?.email || 'admin@rrsecurity.com';

    let { config, primaryCompanyId } = await resolveStatutoryConfig(rawCompanyId, adminEmail);
    if (!config) {
      config = await StatutoryConfig.create({
        companyId: primaryCompanyId,
        adminEmail,
        esi: {
          enabled: true,
          esiRates: DEFAULT_INITIAL_ESI_RATES,
        },
        ptSlabs: DEFAULT_PT_SLABS,
        lwfRules: DEFAULT_LWF_RULES,
      });
    }

    const rateId = String(
      (rateData.id && String(rateData.id).trim()) ||
      (rateData._id && String(rateData._id).trim()) ||
      `esi-rate-${Date.now()}`
    );

    const formattedRate = {
      id: rateId,
      enabled: rateData.enabled !== undefined ? Boolean(rateData.enabled) : true,
      effectiveDate: String(rateData.effectiveDate || new Date().toISOString().split('T')[0]).trim(),
      displayDate: String(rateData.displayDate || '').trim(),
      employeeContribution: Number(rateData.employeeContribution) || 0,
      employerContribution: Number(rateData.employerContribution) || 0,
      eligibilityWageCeiling: Number(rateData.eligibilityWageCeiling) || 0,
      deductionWageCeiling: Number(rateData.deductionWageCeiling) || 0,
    };

    if (!config.esi) config.esi = {};
    const currentRates = Array.isArray(config.esi.esiRates) 
      ? [...config.esi.esiRates] 
      : [];

    const existingIdx = currentRates.findIndex((r) => String(r.id || r._id || '').trim() === rateId);
    if (existingIdx >= 0) {
      currentRates[existingIdx] = formattedRate;
    } else {
      currentRates.unshift(formattedRate);
    }

    config.esi.esiRates = currentRates;

    // If enabled, also sync core ESI fields
    if (formattedRate.enabled) {
      config.esi.employeeContribution = formattedRate.employeeContribution;
      config.esi.employerContribution = formattedRate.employerContribution;
      config.esi.wageEligibilityLimit = formattedRate.eligibilityWageCeiling;
      config.esi.effectiveDate = formattedRate.effectiveDate;
    } else {
      const activeRate = currentRates.find((r) => r.enabled);
      if (activeRate) {
        config.esi.employeeContribution = activeRate.employeeContribution;
        config.esi.employerContribution = activeRate.employerContribution;
        config.esi.wageEligibilityLimit = activeRate.eligibilityWageCeiling;
        config.esi.effectiveDate = activeRate.effectiveDate;
      }
    }

    config.markModified('esi');
    await config.save();

    return res.status(200).json({
      success: true,
      message: '✓ ESI Rate Change saved successfully in database.',
      esiRates: config.esi.esiRates,
      esi: config.esi,
      config: config.toJSON(),
    });
  } catch (error) {
    console.error('Error saving ESI rate:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to save ESI rate change.',
      error: error.message,
    });
  }
};

/**
 * @desc    Delete ESI Rate Change entry from MongoDB
 * @route   DELETE /api/statutory/esi-rates/:id
 * @access  Private (Admin)
 */
export const deleteESIRate = async (req, res) => {
  try {
    const user = req.user;
    const rawCompanyId = req.headers['x-company-id'] || req.query.companyId || req.body.companyId || user?.companyId || 'RRS8392014SEC';
    const { id } = req.params;
    const adminEmail = user?.email || 'admin@rrsecurity.com';

    let { config } = await resolveStatutoryConfig(rawCompanyId, adminEmail);
    if (!config || !config.esi) {
      return res.status(404).json({ success: false, message: 'Statutory configuration not found.' });
    }

    const cleanId = String(id || '').trim();
    config.esi.esiRates = (config.esi.esiRates || []).filter(
      (r) => String(r.id || r._id || '').trim() !== cleanId
    );

    // If the deleted rate was active, sync core ESI with remaining enabled rate if any
    const activeRate = (config.esi.esiRates || []).find((r) => r.enabled);
    if (activeRate) {
      config.esi.employeeContribution = activeRate.employeeContribution;
      config.esi.employerContribution = activeRate.employerContribution;
      config.esi.wageEligibilityLimit = activeRate.eligibilityWageCeiling;
      config.esi.effectiveDate = activeRate.effectiveDate;
    }

    config.markModified('esi');
    await config.save();

    return res.status(200).json({
      success: true,
      message: '✓ ESI Rate Change entry deleted successfully from database.',
      esiRates: config.esi.esiRates,
      esi: config.esi,
      config: config.toJSON(),
    });
  } catch (error) {
    console.error('Error deleting ESI rate:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete ESI rate change.',
      error: error.message,
    });
  }
};

/**
 * @desc    Save selected salary components for ESI calculation in MongoDB
 * @route   PUT /api/statutory/esi/applicability
 * @access  Private (Admin)
 */
export const saveESIApplicability = async (req, res) => {
  try {
    const user = req.user;
    const rawCompanyId = req.headers['x-company-id'] || req.body.companyId || user?.companyId || 'RRS8392014SEC';
    const { selectedComponentIds } = req.body;
    const adminEmail = user?.email || 'admin@rrsecurity.com';

    let { config, primaryCompanyId } = await resolveStatutoryConfig(rawCompanyId, adminEmail);
    if (!config) {
      config = await StatutoryConfig.create({
        companyId: primaryCompanyId,
        adminEmail,
        esi: {
          enabled: true,
          esiRates: DEFAULT_INITIAL_ESI_RATES,
          selectedComponentIds: selectedComponentIds || [],
        },
        ptSlabs: DEFAULT_PT_SLABS,
        lwfRules: DEFAULT_LWF_RULES,
      });
    } else {
      if (!config.esi) config.esi = {};
      config.esi.selectedComponentIds = Array.isArray(selectedComponentIds) ? selectedComponentIds : [];
      config.markModified('esi');
      await config.save();
    }

    return res.status(200).json({
      success: true,
      message: '✓ Salary Component ESI applicability saved successfully in database.',
      selectedComponentIds: config.esi.selectedComponentIds,
      config: config.toJSON(),
    });
  } catch (error) {
    console.error('Error saving ESI applicability:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to save ESI component applicability.',
      error: error.message,
    });
  }
};

/**
 * @desc    Save selected salary components and calculation basis for PT in MongoDB
 * @route   PUT /api/statutory/pt/applicability
 * @access  Private (Admin)
 */
export const savePTApplicability = async (req, res) => {
  try {
    const user = req.user;
    const rawCompanyId = req.headers['x-company-id'] || req.body.companyId || user?.companyId || 'RRS8392014SEC';
    const { selectedComponentIds, calculateOn } = req.body;
    const adminEmail = user?.email || 'admin@rrsecurity.com';

    let { config, primaryCompanyId } = await resolveStatutoryConfig(rawCompanyId, adminEmail);
    if (!config) {
      config = await StatutoryConfig.create({
        companyId: primaryCompanyId,
        adminEmail,
        pt: {
          enabled: true,
          calculateOn: calculateOn || 'Gross Salary',
          selectedComponentIds: Array.isArray(selectedComponentIds) ? selectedComponentIds : [],
        },
        ptSlabs: DEFAULT_INITIAL_PT_SLABS,
        lwfRules: DEFAULT_LWF_RULES,
      });
    } else {
      if (!config.pt) config.pt = {};
      if (Array.isArray(selectedComponentIds)) {
        config.pt.selectedComponentIds = selectedComponentIds;
      }
      if (calculateOn !== undefined) {
        config.pt.calculateOn = calculateOn;
      }
      config.markModified('pt');
      await config.save();
    }

    return res.status(200).json({
      success: true,
      message: '✓ Salary Component PT applicability saved successfully in database.',
      selectedComponentIds: config.pt.selectedComponentIds,
      calculateOn: config.pt.calculateOn,
      pt: config.pt,
      config: config.toJSON(),
    });
  } catch (error) {
    console.error('Error saving PT applicability:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to save PT component applicability.',
      error: error.message,
    });
  }
};

