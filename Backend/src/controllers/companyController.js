import Company from '../models/companyModel.js';

/**
 * @desc    Get all company profiles for current logged-in admin
 * @route   GET /api/companies
 * @access  Private
 */
export const getCompanies = async (req, res) => {
  try {
    const adminEmail = req.user.email.toLowerCase();
    
    // Find all companies owned by this admin or default company
    let companies = await Company.find({
      $or: [
        { adminEmail },
        { isDefault: true }
      ]
    }).sort({ isDefault: -1, createdAt: -1 });

    // If no companies found, auto-create RR Security as default
    if (companies.length === 0) {
      const defaultCompany = await Company.create({
        name: 'RR Security',
        code: 'RRS',
        industry: 'Security & Facility Management Services',
        email: adminEmail,
        phone: '+91 9876543210',
        address: 'Civil Lines, Bareilly, Uttar Pradesh 243001',
        city: 'Bareilly',
        state: 'Uttar Pradesh',
        pinCode: '243001',
        gstin: '09ABCDE1234F1Z5',
        pan: 'ABCDE1234F',
        tan: 'BLRA12345D',
        adminEmail,
        isDefault: true,
        status: 'Active'
      });
      companies = [defaultCompany];
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
 * @desc    Create a new company profile
 * @route   POST /api/companies
 * @access  Private (Admin)
 */
export const createCompany = async (req, res) => {
  try {
    const {
      name,
      code,
      industry,
      email,
      phone,
      address,
      city,
      state,
      pinCode,
      gstin,
      pan,
      tan,
      logo
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Company Name is required.'
      });
    }

    const adminEmail = req.user.email.toLowerCase();
    const companyCode = (code || name.substring(0, 3)).trim().toUpperCase();

    // Check duplicate name for this admin
    const existing = await Company.findOne({
      adminEmail,
      name: { $regex: new RegExp(`^${name.trim()}$`, 'i') }
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'A company profile with this name already exists in your account.'
      });
    }

    const newCompany = await Company.create({
      name: name.trim(),
      code: companyCode,
      industry: industry || 'Security & Facility Management',
      email: (email || adminEmail).trim().toLowerCase(),
      phone: phone || '',
      address: address || '',
      city: city || '',
      state: state || '',
      pinCode: pinCode || '',
      gstin: (gstin || '').toUpperCase(),
      pan: (pan || '').toUpperCase(),
      tan: (tan || '').toUpperCase(),
      logo: logo || null,
      adminEmail,
      status: 'Active',
      isDefault: false
    });

    return res.status(201).json({
      success: true,
      message: `Company profile "${newCompany.name}" created successfully!`,
      company: newCompany.toJSON()
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

    const company = await Company.findOne({
      _id: id,
      $or: [{ adminEmail }, { isDefault: true }]
    });

    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company profile not found.'
      });
    }

    const fields = [
      'name', 'code', 'industry', 'email', 'phone',
      'address', 'city', 'state', 'pinCode', 'gstin', 'pan', 'tan', 'logo', 'status'
    ];

    fields.forEach(field => {
      if (req.body[field] !== undefined) {
        company[field] = req.body[field];
      }
    });

    await company.save();

    return res.status(200).json({
      success: true,
      message: 'Company profile updated successfully.',
      company: company.toJSON()
    });
  } catch (error) {
    console.error('Error updating company:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update company profile.'
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

    const company = await Company.findOne({ _id: id, adminEmail });

    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company profile not found or cannot be deleted.'
      });
    }

    if (company.isDefault) {
      return res.status(400).json({
        success: false,
        message: 'Default primary company profile cannot be deleted.'
      });
    }

    await Company.deleteOne({ _id: id });

    return res.status(200).json({
      success: true,
      message: 'Company profile removed successfully.'
    });
  } catch (error) {
    console.error('Error deleting company:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete company profile.'
    });
  }
};
