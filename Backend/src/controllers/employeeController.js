import mongoose from 'mongoose';
import Employee from '../models/employeeModel.js';
import Company from '../models/companyModel.js';

/**
 * @desc    Get all employees for the active company profile
 * @route   GET /api/employees
 * @access  Private
 */
export const getEmployees = async (req, res) => {
  try {
    const adminEmail = req.user.email.toLowerCase();
    const companyId = req.headers['x-company-id'] || req.query.companyId;

    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: 'Company ID is required to fetch isolated employees.'
      });
    }

    let companyIds = [companyId];
    try {
      const comp = await Company.findOne({
        adminEmail,
        $or: [
          { companyId },
          { _id: mongoose.Types.ObjectId.isValid(companyId) ? companyId : null }
        ]
      });
      if (comp) {
        companyIds = Array.from(new Set([comp.companyId, comp._id?.toString(), companyId])).filter(Boolean);
      }
    } catch {}

    const filter = {
      companyId: { $in: companyIds },
      adminEmail
    };

    if (req.query.clientId && req.query.clientId !== 'all') {
      filter.clientId = req.query.clientId;
    }

    const employees = await Employee.find(filter).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: employees.length,
      employees: employees.map(e => e.toJSON())
    });
  } catch (error) {
    console.error('Error fetching employees:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve employees.'
    });
  }
};

/**
 * @desc    Get a single employee by ID
 * @route   GET /api/employees/:id
 * @access  Private
 */
export const getEmployeeById = async (req, res) => {
  try {
    const { id } = req.params;
    const adminEmail = req.user.email.toLowerCase();

    let query = { adminEmail };
    if (mongoose.Types.ObjectId.isValid(id)) {
      query.$or = [{ _id: id }, { employeeId: id }];
    } else {
      query.employeeId = id;
    }

    const employee = await Employee.findOne(query);

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found.'
      });
    }

    return res.status(200).json({
      success: true,
      employee: employee.toJSON()
    });
  } catch (error) {
    console.error('Error fetching employee by ID:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch employee.'
    });
  }
};

/**
 * @desc    Create a new employee associated with company and client
 * @route   POST /api/employees
 * @access  Private (Admin)
 */
export const createEmployee = async (req, res) => {
  try {
    const adminEmail = req.user.email.toLowerCase();
    const companyId = req.headers['x-company-id'] || req.body.companyId;

    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: 'Active Company ID is required to associate new employee.'
      });
    }

    const {
      name,
      employeeId,
      employeeCode,
      clientId,
      clientName,
      companyName,
      department,
      designation,
      contact,
      mobile,
      email,
      gender,
      dob,
      joiningDate,
      employeeType,
      status,
      employeeStatus,
      siteLocation,
      site,
      dutyPost,
      shift,
      salaryType,
      salaryStructureType,
      basic,
      vda,
      hra,
      conveyance,
      otherAllowance,
      specialAllowance,
      grossSalary,
      minimumWageCategory,
      salaryEffectiveFrom,
      pan,
      aadhaar,
      uan,
      pfNo,
      esicNo,
      bankName,
      branchName,
      accountNumber,
      ifsc,
      accountHolder,
      presentAddress,
      permanentAddress,
      familyMembers,
      documents
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Employee Name is required.'
      });
    }

    // Fetch company configuration to resolve prefix & numbering series
    const company = await Company.findOne({
      $or: [
        ...(mongoose.isValidObjectId(companyId) ? [{ _id: companyId }] : []),
        { companyId }
      ]
    });

    const companySeries = company?.employeeCodeSeries;
    const companyPrefix = (companySeries?.prefix || company?.code || 'EMP').trim().toUpperCase();
    const separator = companySeries?.separator !== undefined ? companySeries.separator : '-';
    const padding = Number(companySeries?.padding) || 3;
    const startNumber = Number(companySeries?.startingNumber) || 1;

    // Dynamically calculate sequence from actual database employee count for this company
    const existingEmployeeCount = await Employee.countDocuments({ companyId, adminEmail });
    const currentSeq = startNumber + existingEmployeeCount;

    let resolvedEmpId = (employeeId || employeeCode || '').trim();

    if (!resolvedEmpId) {
      // Auto-generate using dynamic database sequence and company rules
      const yearPart = companySeries?.yearFormat === 'YYYY' ? String(new Date().getFullYear()) : companySeries?.yearFormat === 'YY' ? String(new Date().getFullYear()).slice(-2) : '';
      const monthPart = companySeries?.monthFormat === 'MM' ? String(new Date().getMonth() + 1).padStart(2, '0') : '';
      const seqPart = String(currentSeq).padStart(padding, '0');
      const parts = [companyPrefix, yearPart, monthPart, seqPart].filter(Boolean);
      resolvedEmpId = parts.join(separator);

      // Increment sequence for company
      if (company) {
        company.employeeCodeSeries = {
          ...(company.employeeCodeSeries || {}),
          prefix: companyPrefix,
          separator,
          padding,
          startingNumber: startNumber,
          currentNumber: currentSeq + 1,
          lastUsedNumber: currentSeq,
          lastUpdated: new Date().toLocaleString()
        };
        await company.save();
      }
    } else if (/^\d+$/.test(resolvedEmpId)) {
      // If user provided only raw digits (e.g. 1 or 4534545), pad to configured sequence digits and prepend prefix
      const formattedSeq = resolvedEmpId.length < padding ? resolvedEmpId.padStart(padding, '0') : resolvedEmpId;
      resolvedEmpId = `${companyPrefix}${separator}${formattedSeq}`;
    }

    const numBasic = Number(req.body.basic) || 0;
    const numVda = Number(req.body.vda) || 0;
    const numHra = Number(req.body.hra) || 0;
    const numConveyance = Number(req.body.conveyance) || 0;
    const numOtherAllowance = Number(req.body.otherAllowance) || 0;
    const numSpecialAllowance = Number(req.body.specialAllowance) || 0;
    const computedGross = Number(req.body.grossSalary) || (numBasic + numVda + numHra + numConveyance + numOtherAllowance + numSpecialAllowance);

    const clientCompName = (req.body.clientName || req.body.companyName || '').trim();
    const photoUrl = req.body.employeePhoto || req.body.photo || '';

    const employeeData = {
      ...req.body,
      employeeId: resolvedEmpId,
      employeeCode: resolvedEmpId,
      companyId,
      companyName: clientCompName,
      clientId: req.body.clientId || '',
      clientName: clientCompName,
      adminEmail,
      name: (req.body.name || '').trim(),
      fatherHusbandName: req.body.fatherHusbandName || '',
      fatherHusbandRelation: req.body.fatherHusbandRelation || '',
      gender: req.body.gender || 'Male',
      dob: req.body.dob || '',
      contact: req.body.contact || req.body.mobile || '',
      mobile: req.body.mobile || req.body.contact || '',
      alternateMobile: req.body.alternateMobile || req.body.emergencyMobile || '',
      emergencyMobile: req.body.emergencyMobile || req.body.alternateMobile || '',
      email: req.body.email || '',
      maritalStatus: req.body.maritalStatus || '',
      spouseName: req.body.spouseName || '',
      bloodGroup: req.body.bloodGroup || '',
      religion: req.body.religion || '',
      nationality: req.body.nationality || 'Indian',
      employeePhoto: photoUrl,
      photo: photoUrl,

      // Employment Details
      employeeType: req.body.employeeType || 'Permanent',
      department: req.body.department || 'Security',
      designation: req.body.designation || 'Security Guard',
      siteLocation: req.body.siteLocation || req.body.site || '',
      site: req.body.siteLocation || req.body.site || '',
      dutyPost: req.body.dutyPost || '',
      shift: req.body.shift || '',
      joiningDate: req.body.joiningDate || '',
      reportingSupervisor: req.body.reportingSupervisor || '',
      joiningLocation: req.body.joiningLocation || '',
      previousExperience: req.body.previousExperience || '',
      language: req.body.language || '',
      qualification: req.body.qualification || '',
      technicalQualification: req.body.technicalQualification || '',
      employeeStatus: req.body.employeeStatus || req.body.status || 'Active',
      status: req.body.status || req.body.employeeStatus || 'Active',
      exitDate: req.body.exitDate || '',
      exitReason: req.body.exitReason || '',
      exitDateReason: req.body.exitDateReason || '',

      // Salary & Statutory
      salaryType: req.body.salaryType || 'Monthly',
      salaryStructureType: req.body.salaryStructureType || 'Regular',
      basic: numBasic,
      vda: numVda,
      hra: numHra,
      conveyance: numConveyance,
      otherAllowance: numOtherAllowance,
      specialAllowance: numSpecialAllowance,
      grossSalary: computedGross,
      minimumWageCategory: req.body.minimumWageCategory || '',
      overtimeRate: Number(req.body.overtimeRate) || 0,
      bonus: Number(req.body.bonus) || 0,
      gratuity: Number(req.body.gratuity) || 0,
      salaryEffectiveFrom: req.body.salaryEffectiveFrom || '',
      pan: (req.body.pan || '').toUpperCase(),
      aadhaar: req.body.aadhaar || '',
      uan: req.body.uan || '',
      pfNo: req.body.pfNo || '',
      esicNo: req.body.esicNo || '',
      dispensaryNo: req.body.dispensaryNo || '',
      pfApplicable: req.body.pfApplicable,
      esiApplicable: req.body.esiApplicable,
      lwf: req.body.lwf || '',
      lwfApplicable: req.body.lwfApplicable,
      tdsApplicable: req.body.tdsApplicable,

      // Licenses
      licenseList: req.body.licenseList || [],
      licenseType: req.body.licenseType || '',
      drivingLicenseType: req.body.drivingLicenseType || '',
      drivingLicenseNo: req.body.drivingLicenseNo || '',
      dlExpiryDate: req.body.dlExpiryDate || '',
      drivingLicenseCopy: req.body.drivingLicenseCopy || '',
      armedLicenseNo: req.body.armedLicenseNo || '',
      alExpiryDate: req.body.alExpiryDate || '',

      // Bank Details
      bankName: req.body.bankName || '',
      branchName: req.body.branchName || '',
      accountNumber: req.body.accountNumber || '',
      ifsc: (req.body.ifsc || '').toUpperCase(),
      accountHolder: req.body.accountHolder || req.body.name || '',
      paymentMode: req.body.paymentMode || '',

      // Address & Family
      presentAddress: req.body.presentAddress || '',
      permanentAddress: req.body.permanentAddress || '',
      sameAsPresentAddress: !!req.body.sameAsPresentAddress,
      familyMembers: req.body.familyMembers || [],
      familyMemberName: req.body.familyMemberName || '',
      relation: req.body.relation || '',
      dobAge: req.body.dobAge || '',
      address: req.body.address || '',
      nomineeYesNo: req.body.nomineeYesNo || '',
      nomineeSharePercent: req.body.nomineeSharePercent || '',

      // Documents & Remarks
      documentList: req.body.documentList || [],
      documents: req.body.documents || {},
      remarks: req.body.remarks || ''
    };

    const newEmployee = await Employee.create(employeeData);

    return res.status(201).json({
      success: true,
      message: `Employee "${newEmployee.name}" (${newEmployee.employeeId}) created successfully.`,
      employee: newEmployee.toJSON()
    });
  } catch (error) {
    console.error('Error creating employee:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to create employee.'
    });
  }
};

/**
 * @desc    Update an employee
 * @route   PUT /api/employees/:id
 * @access  Private (Admin)
 */
export const updateEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const adminEmail = req.user.email.toLowerCase();
    const companyId = req.headers['x-company-id'] || req.body.companyId;

    let query = { adminEmail };
    if (mongoose.Types.ObjectId.isValid(id)) {
      query.$or = [{ _id: id }, { employeeId: id }];
    } else {
      query.employeeId = id;
    }
    if (companyId) query.companyId = companyId;

    const employee = await Employee.findOne(query);

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found.'
      });
    }

    if (req.body.clientId !== undefined) {
      employee.clientId = req.body.clientId;
    }
    if (req.body.clientName !== undefined || req.body.companyName !== undefined) {
      const compName = req.body.clientName || req.body.companyName;
      employee.clientName = compName;
      employee.companyName = compName;
    }
    if (req.body.siteLocation !== undefined || req.body.site !== undefined) {
      const siteLoc = req.body.siteLocation || req.body.site;
      employee.siteLocation = siteLoc;
      employee.site = siteLoc;
    }
    if (req.body.licenseList !== undefined) {
      employee.licenseList = Array.isArray(req.body.licenseList) ? req.body.licenseList : [];
      employee.markModified('licenseList');

      // Sync specific license shortcut fields if present in licenseList
      const armLic = employee.licenseList.find(l => l.licenseType === 'Arms / Gun License');
      if (armLic) {
        employee.armedLicenseNo = armLic.licenseNo || employee.armedLicenseNo;
        employee.alExpiryDate = armLic.expiryDate || employee.alExpiryDate;
      }
      const dlLic = employee.licenseList.find(l => l.licenseType !== 'Arms / Gun License');
      if (dlLic) {
        employee.drivingLicenseType = dlLic.licenseType || employee.drivingLicenseType;
        employee.drivingLicenseNo = dlLic.licenseNo || employee.drivingLicenseNo;
        employee.dlExpiryDate = dlLic.expiryDate || employee.dlExpiryDate;
        employee.drivingLicenseCopy = dlLic.photo || employee.drivingLicenseCopy;
      }
    }

    if (req.body.documentList !== undefined) {
      employee.documentList = Array.isArray(req.body.documentList) ? req.body.documentList : [];
      employee.markModified('documentList');
    }

    if (req.body.familyMembers !== undefined) {
      employee.familyMembers = Array.isArray(req.body.familyMembers) ? req.body.familyMembers : [];
      employee.markModified('familyMembers');
    }

    if (req.body.documents !== undefined) {
      employee.documents = req.body.documents;
      employee.markModified('documents');
    }

    if (req.body.enablePortalAccess !== undefined) {
      employee.enablePortalAccess = Boolean(req.body.enablePortalAccess === true || req.body.enablePortalAccess === 'true');
    }

    if (req.body.password && typeof req.body.password === 'string' && req.body.password.trim()) {
      employee.password = req.body.password.trim();
      employee.savedPassword = req.body.password.trim();
    } else {
      delete req.body.password;
    }

    Object.assign(employee, req.body);
    await employee.save();

    return res.status(200).json({
      success: true,
      message: `Employee "${employee.name}" updated successfully (Client: ${employee.clientName || 'Unassigned'}).`,
      employee: employee.toJSON()
    });
  } catch (error) {
    console.error('Error updating employee:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update employee.'
    });
  }
};

/**
 * @desc    Delete an employee
 * @route   DELETE /api/employees/:id
 * @access  Private (Admin)
 */
export const deleteEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const adminEmail = req.user.email.toLowerCase();

    let query = { adminEmail };
    if (mongoose.Types.ObjectId.isValid(id)) {
      query.$or = [{ _id: id }, { employeeId: id }];
    } else {
      query.employeeId = id;
    }

    const employee = await Employee.findOneAndDelete(query);

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found.'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Employee deleted successfully.'
    });
  } catch (error) {
    console.error('Error deleting employee:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete employee.'
    });
  }
};
