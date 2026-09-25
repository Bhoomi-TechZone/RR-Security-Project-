import mongoose from 'mongoose';
import Employee from '../models/employeeModel.js';

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

    const filter = {
      companyId,
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

    const resolvedEmpId = employeeId || employeeCode || `EMP${Math.floor(1000 + Math.random() * 9000)}`;

    const numBasic = Number(basic) || 0;
    const numVda = Number(vda) || 0;
    const numHra = Number(hra) || 0;
    const numConveyance = Number(conveyance) || 0;
    const numOtherAllowance = Number(otherAllowance) || 0;
    const numSpecialAllowance = Number(specialAllowance) || 0;
    const computedGross = Number(grossSalary) || (numBasic + numVda + numHra + numConveyance + numOtherAllowance + numSpecialAllowance);

    const newEmployee = await Employee.create({
      employeeId: resolvedEmpId,
      companyId,
      clientId: clientId || '',
      clientName: clientName || companyName || '',
      adminEmail,
      name: name.trim(),
      contact: contact || mobile || '',
      email: email || '',
      gender: gender || 'Male',
      dob: dob || '',
      joiningDate: joiningDate || '',
      employeeType: employeeType || 'Permanent',
      department: department || 'Security',
      designation: designation || 'Security Guard',
      siteLocation: siteLocation || site || '',
      dutyPost: dutyPost || '',
      shift: shift || '',
      status: status || employeeStatus || 'Active',
      salaryType: salaryType || 'Monthly',
      salaryStructureType: salaryStructureType || 'Regular',
      basic: numBasic,
      vda: numVda,
      hra: numHra,
      conveyance: numConveyance,
      otherAllowance: numOtherAllowance,
      specialAllowance: numSpecialAllowance,
      grossSalary: computedGross,
      pan: (pan || '').toUpperCase(),
      aadhaar: aadhaar || '',
      uan: uan || '',
      pfNo: pfNo || '',
      esicNo: esicNo || '',
      bankName: bankName || '',
      branchName: branchName || '',
      accountNumber: accountNumber || '',
      ifsc: (ifsc || '').toUpperCase(),
      accountHolder: accountHolder || name,
      presentAddress: presentAddress || '',
      permanentAddress: permanentAddress || '',
      familyMembers: familyMembers || [],
      documents: documents || {}
    });

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
      employee.clientName = req.body.clientName || req.body.companyName;
    }
    if (req.body.siteLocation !== undefined || req.body.site !== undefined) {
      employee.siteLocation = req.body.siteLocation || req.body.site;
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
