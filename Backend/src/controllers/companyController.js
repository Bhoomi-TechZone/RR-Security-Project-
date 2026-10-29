import mongoose from 'mongoose';
import Company, { generateCompanyId } from '../models/companyModel.js';
import User from '../models/userModel.js';
import Employee from '../models/employeeModel.js';
import Client from '../models/clientModel.js';
import UserRole from '../models/userRoleModel.js';
import { sendCompanyCredentialsEmail } from '../services/emailService.js';

/**
 * @desc    Get all company profiles for current logged-in admin
 * @route   GET /api/companies
 * @access  Private
 */
export const getCompanies = async (req, res) => {
  try {
    const userEmail = req.user.email.toLowerCase();
    
    // Check if the requesting user is the master admin RR Security
    const isMasterRR = 
      userEmail === 'rrsecurity@gmail.com' || 
      userEmail === 'admin@rrsecurity.com' ||
      userEmail.includes('rrsecurity');

    let companies = [];
    if (isMasterRR) {
      // RR Security Master Admin sees ALL registered companies
      companies = await Company.find({}).sort({ isDefault: -1, createdAt: -1 });
    } else {
      // Created company admin only sees their assigned company workspace
      const userCompId = req.user.companyId;
      companies = await Company.find({
        $or: [
          ...(userCompId ? [{ companyId: userCompId }] : []),
          { adminEmail: userEmail },
          { email: userEmail }
        ]
      }).sort({ isDefault: -1, createdAt: -1 });
    }

    // If no companies found, check if default exists or create one
    if (companies.length === 0) {
      const existingCompany = await Company.findOne({
        $or: [
          { companyId: 'RRS8392014SEC' },
          { isDefault: true }
        ]
      });

      if (existingCompany) {
        companies = [existingCompany];
      } else {
        const defaultCompany = await Company.create({
          companyId: 'RRS8392014SEC',
          name: 'RR Security',
          code: 'RRS',
          industry: 'Security & Facility Management',
          email: userEmail,
          phone: '+91 9876543210',
          address: 'Civil Lines, Bareilly, Uttar Pradesh 243001',
          city: 'Bareilly',
          state: 'Uttar Pradesh',
          pinCode: '243001',
          gstin: '09ABCDE1234F1Z5',
          pan: 'ABCDE1234F',
          tan: 'BLRA12345D',
          employerPfCode: 'DLCPM0012345000',
          employerEsiCode: '31000123450000101',
          adminEmail: userEmail,
          isDefault: true,
          status: 'Active'
        });
        companies = [defaultCompany];
      }
    }

    return res.status(200).json({
      success: true,
      count: companies.length,
      companies: companies.map(c => c.toJSON())
    });
  } catch (error) {
    console.error('Error fetching companies:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve company profiles.'
    });
  }
};

/**
 * @desc    Get single company profile by ID or companyId
 * @route   GET /api/companies/:id
 * @access  Private
 */
export const getCompanyById = async (req, res) => {
  try {
    const { id } = req.params;
    const adminEmail = req.user.email.toLowerCase();
    const isMasterRR = 
      adminEmail === 'rrsecurity@gmail.com' || 
      adminEmail === 'admin@rrsecurity.com' ||
      adminEmail.includes('rrsecurity');

    const query = {
      $and: [
        {
          $or: [
            ...(mongoose.isValidObjectId(id) ? [{ _id: id }] : []),
            { companyId: id }
          ]
        },
        ...(isMasterRR ? [] : [{
          $or: [
            { adminEmail },
            { email: adminEmail },
            ...(req.user.companyId ? [{ companyId: req.user.companyId }] : []),
            { isDefault: true }
          ]
        }])
      ]
    };

    const company = await Company.findOne(query);

    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company profile not found.'
      });
    }

    return res.status(200).json({
      success: true,
      company: company.toJSON()
    });
  } catch (error) {
    console.error('Error fetching company details:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve company profile.'
    });
  }
};

/**
 * @desc    Create a new company profile with Admin credentials
 * @route   POST /api/companies
 * @access  Private (Admin)
 */
export const createCompany = async (req, res) => {
  try {
    const {
      companyId,
      name,
      code,
      industry,
      email,
      phone,
      alternatePhone,
      alternateContact,
      address,
      city,
      state,
      pinCode,
      gstin,
      pan,
      tan,
      employerPfCode,
      employerEsiCode,
      logo,
      dateFormat,
      timeZone,
      currency,
      regionalSettings,
      employeeCodeSeries,
      pfCodeSeries,
      adminEmail,
      adminPassword,
      password
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Company Name is required.'
      });
    }

    const companyCode = (code || name.substring(0, 3)).trim().toUpperCase();
    const loginEmail = (adminEmail || email || '').trim().toLowerCase();
    const loginPassword = (adminPassword || password || '').trim();

    // Check duplicate name
    const existing = await Company.findOne({
      name: { $regex: new RegExp(`^${name.trim()}$`, 'i') }
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: `A company profile named "${name.trim()}" already exists.`
      });
    }

    // Check if an admin user already exists with this login email
    if (loginEmail) {
      const existingUser = await User.findOne({ email: loginEmail });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: `An account with email "${loginEmail}" already exists. Please use a unique Admin Email for this company.`
        });
      }
    }

    const generatedId = companyId || generateCompanyId(name.trim());

    const newCompany = await Company.create({
      companyId: generatedId,
      name: name.trim(),
      code: companyCode,
      industry: industry || 'Security & Facility Management',
      email: loginEmail || email || req.user.email.toLowerCase(),
      phone: phone || '',
      alternatePhone: alternatePhone || '',
      alternateContact: alternateContact || alternatePhone || '',
      address: address || '',
      city: city || '',
      state: state || '',
      pinCode: pinCode || '',
      gstin: (gstin || '').toUpperCase(),
      pan: (pan || '').toUpperCase(),
      tan: (tan || '').toUpperCase(),
      employerPfCode: (employerPfCode || '').toUpperCase(),
      employerEsiCode: (employerEsiCode || '').toUpperCase(),
      logo: logo || null,
      dateFormat: dateFormat || 'DD/MM/YYYY',
      timeZone: timeZone || 'Asia/Kolkata (IST +05:30)',
      currency: currency || 'INR (₹)',
      regionalSettings: regionalSettings || {},
      employeeCodeSeries: employeeCodeSeries || null,
      pfCodeSeries: pfCodeSeries || null,
      adminEmail: loginEmail || req.user.email.toLowerCase(),
      adminInitialPassword: loginPassword || '',
      status: 'Active',
      isDefault: false
    });

    // Create Admin User account for the new company so they can log in!
    let createdAdminUser = null;
    if (loginEmail && loginPassword) {
      createdAdminUser = await User.create({
        name: `${name.trim()} Administrator`,
        email: loginEmail,
        password: loginPassword,
        savedPassword: loginPassword,
        role: 'admin',
        redirect: '/admin/dashboard',
        label: 'Admin',
        department: 'Executive Administration',
        companyId: generatedId,
        companyName: name.trim(),
        status: 'Active'
      });
    }

    return res.status(201).json({
      success: true,
      message: `Company profile "${newCompany.name}" and Admin login account created successfully!`,
      company: newCompany.toJSON(),
      adminCreated: Boolean(createdAdminUser)
    });
  } catch (error) {
    console.error('Error creating company:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to create company profile.'
    });
  }
};

/**
 * @desc    Update an existing company profile
 * @route   PUT /api/companies/:id
 * @access  Private (Admin)
 */
export const updateCompany = async (req, res) => {
  try {
    const { id } = req.params;
    const adminEmail = req.user.email.toLowerCase();
    const isMasterRR = 
      adminEmail === 'rrsecurity@gmail.com' || 
      adminEmail === 'admin@rrsecurity.com' ||
      adminEmail.includes('rrsecurity');

    const query = {
      $and: [
        {
          $or: [
            ...(mongoose.isValidObjectId(id) ? [{ _id: id }] : []),
            { companyId: id }
          ]
        },
        ...(isMasterRR ? [] : [{
          $or: [
            { adminEmail },
            { email: adminEmail },
            ...(req.user.companyId ? [{ companyId: req.user.companyId }] : []),
            { isDefault: true }
          ]
        }])
      ]
    };

    const company = await Company.findOne(query);

    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company profile not found or permission denied.'
      });
    }

    // Prevent deactivating Primary Master Company
    if (req.body.status && req.body.status.toLowerCase() === 'inactive') {
      if (company.isDefault || company.companyId === 'RRS8392014SEC') {
        return res.status(400).json({
          success: false,
          message: 'Primary Master Company (RR Security) cannot be deactivated.'
        });
      }
    }

    // Editable fields
    const allowedUpdates = [
      'name', 'code', 'industry', 'email', 'phone', 'alternatePhone',
      'alternateContact', 'address', 'city', 'state', 'pinCode', 'gstin',
      'pan', 'tan', 'employerPfCode', 'employerEsiCode', 'logo', 'dateFormat',
      'timeZone', 'currency', 'status', 'regionalSettings', 'employeeCodeSeries',
      'pfCodeSeries'
    ];

    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        if (typeof req.body[field] === 'string') {
          company[field] = req.body[field].trim();
        } else {
          company[field] = req.body[field];
        }
      }
    });

    await company.save();

    // If status changed or provided, cascade to all associated entities
    const requestedStatus = req.body.status;
    if (requestedStatus && (requestedStatus === 'Active' || requestedStatus === 'Inactive')) {
      const isInactive = requestedStatus === 'Inactive';
      const userStatus = isInactive ? 'Inactive' : 'Active';
      const clientStatus = isInactive ? 'inactive' : 'active';
      const empStatus = isInactive ? 'Inactive' : 'Active';

      // 1. Cascade to associated Users (Company Admin & Portal Users)
      await User.updateMany(
        {
          $or: [
            ...(company.companyId ? [{ companyId: company.companyId }] : []),
            ...(company.adminEmail && company.adminEmail !== 'rrsecurity@gmail.com' ? [{ email: company.adminEmail.toLowerCase() }] : []),
            ...(company.email && company.email !== 'rrsecurity@gmail.com' ? [{ email: company.email.toLowerCase() }] : [])
          ]
        },
        { $set: { status: userStatus } }
      );

      // 2. Cascade to associated Employees
      if (company.companyId) {
        await Employee.updateMany(
          { companyId: company.companyId },
          { $set: { employeeStatus: empStatus, status: empStatus } }
        );
      }

      // 3. Cascade to associated Clients
      if (company.companyId) {
        await Client.updateMany(
          { companyId: company.companyId },
          { $set: { status: clientStatus } }
        );
      }

      // 4. Cascade to associated UserRoles
      if (company.companyId) {
        await UserRole.updateMany(
          { companyId: company.companyId },
          { $set: { status: userStatus } }
        );
      }
    }

    return res.status(200).json({
      success: true,
      message: `Company profile "${company.name}" ${requestedStatus ? (requestedStatus === 'Active' ? 'activated' : 'deactivated') : 'updated'} successfully.`,
      company: company.toJSON()
    });
  } catch (error) {
    console.error('Error updating company:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to update company profile.'
    });
  }
};

/**
 * @desc    Delete / archive a company profile
 * @route   DELETE /api/companies/:id
 * @access  Private (Admin)
 */
export const deleteCompany = async (req, res) => {
  try {
    const { id } = req.params;
    const adminEmail = req.user.email.toLowerCase();
    const isMasterRR = 
      adminEmail === 'rrsecurity@gmail.com' || 
      adminEmail === 'admin@rrsecurity.com' ||
      adminEmail.includes('rrsecurity');

    const query = {
      $and: [
        {
          $or: [
            ...(mongoose.isValidObjectId(id) ? [{ _id: id }] : []),
            { companyId: id }
          ]
        },
        ...(isMasterRR ? [] : [{ adminEmail }])
      ]
    };

    const company = await Company.findOne(query);

    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company profile not found or cannot be deleted.'
      });
    }

    if (company.isDefault || company.companyId === 'RRS8392014SEC') {
      return res.status(400).json({
        success: false,
        message: 'Default primary company profile (RR Security) cannot be deleted.'
      });
    }

    // Delete company profile
    await Company.deleteOne({ _id: company._id });

    // Clean up associated Admin User account for this company
    if (company.adminEmail && company.adminEmail !== 'rrsecurity@gmail.com') {
      await User.deleteMany({ email: company.adminEmail.toLowerCase() });
    }
    if (company.companyId) {
      await User.deleteMany({ companyId: company.companyId });
    }

    return res.status(200).json({
      success: true,
      message: `Company profile "${company.name}" and associated workspace records removed successfully.`
    });
  } catch (error) {
    console.error('Error deleting company:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete company profile.'
    });
  }
};

/**
 * @desc    Get company administrator credentials
 * @route   GET /api/companies/:id/credentials
 * @access  Private (Admin)
 */
export const getCompanyCredentials = async (req, res) => {
  try {
    const { id } = req.params;
    const company = await Company.findOne({
      $or: [
        ...(mongoose.isValidObjectId(id) ? [{ _id: id }] : []),
        { companyId: id }
      ]
    });

    if (!company) {
      return res.status(404).json({ success: false, message: 'Company profile not found.' });
    }

    const adminUser = await User.findOne({
      $or: [
        ...(company.adminEmail ? [{ email: company.adminEmail.toLowerCase() }] : []),
        ...(company.companyId ? [{ companyId: company.companyId }] : [])
      ]
    }).select('+password savedPassword');

    let rawPassword = company.adminInitialPassword || adminUser?.savedPassword || '';

    // If company doesn't have an initial password stored yet (e.g. created prior to password tracking),
    // generate and persist a default password so it's visible and immediately functional
    if (!rawPassword) {
      const defaultPass = `${(company.code || company.name.substring(0, 3) || 'Apex').toUpperCase()}@123`;
      rawPassword = defaultPass;
      company.adminInitialPassword = defaultPass;
      await company.save();
      if (adminUser) {
        adminUser.password = defaultPass;
        adminUser.savedPassword = defaultPass;
        await adminUser.save();
      }
    }

    return res.status(200).json({
      success: true,
      credentials: {
        companyId: company.companyId,
        companyName: company.name,
        adminEmail: company.adminEmail || adminUser?.email || '',
        password: rawPassword,
        hasPassword: Boolean(rawPassword),
        status: company.status || 'Active',
        loginUrl: `${process.env.CLIENT_URL || 'http://localhost:5173'}/login`
      }
    });
  } catch (error) {
    console.error('Error fetching credentials:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve credentials.' });
  }
};

/**
 * @desc    Send company administrator credentials via email notification
 * @route   POST /api/companies/:id/send-credentials
 * @access  Private (Admin)
 */
export const sendCompanyCredentials = async (req, res) => {
  try {
    const { id } = req.params;
    const { password: customPassword, recipientEmail, sendToEmail } = req.body;

    const company = await Company.findOne({
      $or: [
        ...(mongoose.isValidObjectId(id) ? [{ _id: id }] : []),
        { companyId: id }
      ]
    });

    if (!company) {
      return res.status(404).json({ success: false, message: 'Company profile not found.' });
    }

    const adminUser = await User.findOne({
      $or: [
        ...(company.adminEmail ? [{ email: company.adminEmail.toLowerCase() }] : []),
        ...(company.companyId ? [{ companyId: company.companyId }] : [])
      ]
    }).select('+password savedPassword');

    const passwordToSend = customPassword || company.adminInitialPassword || adminUser?.savedPassword || '';

    if (!passwordToSend) {
      return res.status(400).json({
        success: false,
        message: 'No login password available to send. Please specify a password.'
      });
    }

    const targetRecipient = (sendToEmail || recipientEmail || company.adminEmail || adminUser?.email || '').toLowerCase().trim();

    if (!targetRecipient) {
      return res.status(400).json({
        success: false,
        message: 'Recipient email address is required.'
      });
    }

    // If customPassword was passed, sync to company and user
    if (customPassword) {
      company.adminInitialPassword = customPassword;
      if (adminUser) {
        adminUser.password = customPassword;
        adminUser.savedPassword = customPassword;
      }
    }

    // Sync admin email if user entered an updated email
    if (targetRecipient && targetRecipient !== company.adminEmail) {
      company.adminEmail = targetRecipient;
      if (adminUser) {
        adminUser.email = targetRecipient;
      }
    }

    await company.save();
    if (adminUser) {
      await adminUser.save();
    }

    const portalUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/login`;

    const emailResult = await sendCompanyCredentialsEmail({
      recipientEmail: targetRecipient,
      companyName: company.name,
      companyId: company.companyId,
      adminEmail: targetRecipient,
      password: passwordToSend,
      loginUrl: portalUrl
    });

    if (!emailResult.success) {
      return res.status(500).json({
        success: false,
        message: `Failed to dispatch credentials email: ${emailResult.error || 'SMTP delivery issue'}`
      });
    }

    return res.status(200).json({
      success: true,
      message: `Administrator credentials successfully sent to ${targetRecipient}!`,
      recipient: targetRecipient,
      devFallback: emailResult.devFallback || false
    });
  } catch (error) {
    console.error('Error sending credentials:', error);
    return res.status(500).json({ success: false, message: error.message || 'Failed to dispatch email.' });
  }
};

/**
 * @desc    Get Master Brand Logo (visible to all companies across the platform)
 * @route   GET /api/companies/brand-logo
 * @access  Private
 */
export const getBrandLogo = async (req, res) => {
  try {
    const masterCompany = await Company.findOne({
      $or: [
        { isDefault: true },
        { companyId: 'RRS8392014SEC' },
        { code: 'RRS' }
      ]
    });

    return res.status(200).json({
      success: true,
      brandLogo: masterCompany?.brandLogo || null
    });
  } catch (error) {
    console.error('Error fetching brand logo:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve brand logo.' });
  }
};

/**
 * @desc    Update Master Brand Logo (Master company admin only)
 * @route   PUT /api/companies/brand-logo
 * @access  Private (Admin)
 */
export const updateBrandLogo = async (req, res) => {
  try {
    const userEmail = req.user?.email?.toLowerCase();
    const isMasterRR = 
      userEmail === 'rrsecurity@gmail.com' ||
      userEmail === 'admin@rrsecurity.com' ||
      userEmail.includes('rrsecurity');

    if (!isMasterRR) {
      return res.status(403).json({
        success: false,
        message: 'Only the RR Security Master Admin is authorized to change the system Brand Logo.'
      });
    }

    const { logo } = req.body;

    let masterCompany = await Company.findOne({
      $or: [
        { isDefault: true },
        { companyId: 'RRS8392014SEC' },
        { code: 'RRS' }
      ]
    });

    if (!masterCompany) {
      return res.status(404).json({ success: false, message: 'Master company profile not found.' });
    }

    masterCompany.brandLogo = logo !== undefined ? logo : null;
    await masterCompany.save();

    return res.status(200).json({
      success: true,
      message: 'Brand logo updated successfully! The new logo is now active across all company sidebars.',
      brandLogo: masterCompany.brandLogo
    });
  } catch (error) {
    console.error('Error updating brand logo:', error);
    return res.status(500).json({ success: false, message: error.message || 'Failed to update brand logo.' });
  }
};
