import mongoose from 'mongoose';
import UserRole from '../models/userRoleModel.js';
import Employee from '../models/employeeModel.js';
import Role from '../models/roleModel.js';
import Company from '../models/companyModel.js';

/**
 * Helper to get all company identifier variations (companyId + _id)
 */
const getCompanyIdVariations = async (companyId, adminEmail) => {
  let companyIds = [companyId].filter(Boolean);
  try {
    const comp = await Company.findOne({
      $or: [
        { companyId },
        ...(mongoose.Types.ObjectId.isValid(companyId) ? [{ _id: companyId }] : []),
        ...(adminEmail ? [{ adminEmail }] : [])
      ]
    });
    if (comp) {
      companyIds = Array.from(new Set([comp.companyId, comp._id?.toString(), companyId])).filter(Boolean);
    }
  } catch (_) {}
  return companyIds;
};

/**
 * Helper to compute the next sequential USR ID for a given company
 */
export const calculateNextUserId = async (companyId, adminEmail) => {
  const companyIds = await getCompanyIdVariations(companyId, adminEmail);
  const users = await UserRole.find(
    {
      $or: [
        { companyId: { $in: companyIds } },
        ...(adminEmail ? [{ adminEmail }] : [])
      ]
    },
    { userId: 1 }
  ).lean();

  let maxNum = 0;
  for (const u of users) {
    if (u.userId) {
      const match = String(u.userId).match(/USR[-_]?(\d+)/i);
      if (match) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num) && num > maxNum) {
          maxNum = num;
        }
      }
    }
  }

  let nextNum = maxNum + 1;
  let candidateId = `USR${String(nextNum).padStart(3, '0')}`;

  while (await UserRole.exists({ userId: candidateId, $or: [{ companyId: { $in: companyIds } }, ...(adminEmail ? [{ adminEmail }] : [])] })) {
    nextNum += 1;
    candidateId = `USR${String(nextNum).padStart(3, '0')}`;
  }

  return candidateId;
};

/**
 * @desc    Get all user accounts for the active company
 * @route   GET /api/users
 * @access  Private
 */
export const getUsers = async (req, res) => {
  try {
    const adminEmail = (req.user.adminEmail || req.user.email || '').toLowerCase();
    const companyId = req.headers['x-company-id'] || req.query.companyId;

    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: 'Company ID is required to fetch isolated user accounts.',
      });
    }

    const companyIds = await getCompanyIdVariations(companyId, adminEmail);

    const users = await UserRole.find({
      $or: [
        { companyId: { $in: companyIds } },
        ...(adminEmail ? [{ adminEmail }] : [])
      ]
    })
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: users.length,
      users: users.map((u) => ({
        ...u,
        id: u._id.toString(),
      })),
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve user accounts from database.',
    });
  }
};

/**
 * @desc    Get next available User ID for the company
 * @route   GET /api/users/next-id
 * @access  Private
 */
export const getNextUserId = async (req, res) => {
  try {
    const adminEmail = (req.user.adminEmail || req.user.email || '').toLowerCase();
    const companyId = req.headers['x-company-id'] || req.query.companyId;

    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: 'Company ID is required.',
      });
    }

    const nextId = await calculateNextUserId(companyId, adminEmail);

    return res.status(200).json({
      success: true,
      nextUserId: nextId,
    });
  } catch (error) {
    console.error('Error calculating next user ID:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate next user ID.',
    });
  }
};

/**
 * @desc    Get single user account by ID
 * @route   GET /api/users/:id
 * @access  Private
 */
export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const adminEmail = (req.user.adminEmail || req.user.email || '').toLowerCase();
    const companyId = req.headers['x-company-id'] || req.query.companyId;
    const companyIds = await getCompanyIdVariations(companyId, adminEmail);

    const idConditions = [{ userId: id }];
    if (mongoose.Types.ObjectId.isValid(id)) {
      idConditions.push({ _id: id });
    }

    const user = await UserRole.findOne({
      $or: idConditions,
      ...(companyIds.length > 0 ? { $or: [{ companyId: { $in: companyIds } }, { adminEmail }] } : {})
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User account not found in database.',
      });
    }

    return res.status(200).json({
      success: true,
      user: user.toJSON(),
    });
  } catch (error) {
    console.error('Error fetching user by ID:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve user account.',
    });
  }
};

/**
 * @desc    Create a new login user account (standalone or linked with employee)
 * @route   POST /api/users
 * @access  Private (Admin)
 */
export const createUser = async (req, res) => {
  try {
    const adminEmail = (req.user.adminEmail || req.user.email || '').toLowerCase();
    const companyId = req.headers['x-company-id'] || req.body.companyId;

    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: 'Company ID is required to create a user account.',
      });
    }

    const companyIds = await getCompanyIdVariations(companyId, adminEmail);

    const {
      name,
      email,
      mobile,
      password,
      roleId,
      roleName: customRoleName,
      status = 'Active',
      isExistingEmployee = false,
      employeeId = null,
      companyName = '',
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'User full name is required.',
      });
    }

    if (!roleId) {
      return res.status(400).json({
        success: false,
        message: 'Role assignment is required.',
      });
    }

    // Resolve Role Name
    let resolvedRoleName = customRoleName;
    const roleDoc = await Role.findOne({
      $or: [
        { roleId },
        ...(mongoose.Types.ObjectId.isValid(roleId) ? [{ _id: roleId }] : []),
        ...(customRoleName ? [{ name: customRoleName }] : [])
      ],
      $or: [
        { companyId: { $in: companyIds } },
        ...(adminEmail ? [{ adminEmail }] : [])
      ]
    });

    if (roleDoc) {
      resolvedRoleName = roleDoc.name;
    } else if (!resolvedRoleName) {
      resolvedRoleName = 'Custom Role';
    }

    // Handle Employee link if specified
    let linkedEmployeeId = null;

    if (isExistingEmployee && employeeId) {
      const empDoc = await Employee.findOne({
        $or: [
          { employeeId: employeeId },
          ...(mongoose.Types.ObjectId.isValid(employeeId) ? [{ _id: employeeId }] : []),
        ],
        $or: [
          { companyId: { $in: companyIds } },
          ...(adminEmail ? [{ adminEmail }] : [])
        ]
      });

      if (empDoc) {
        linkedEmployeeId = empDoc.employeeId || empDoc._id.toString();
      } else {
        linkedEmployeeId = employeeId;
      }
    }

    // Calculate unique User ID for this company
    const generatedUserId = await calculateNextUserId(companyId, adminEmail);

    const initials = name
      .trim()
      .split(' ')
      .filter(Boolean)
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

    const today = new Date().toISOString().split('T')[0];

    const newUser = await UserRole.create({
      userId: generatedUserId,
      companyId,
      companyName: companyName || '',
      adminEmail: adminEmail || 'rrsecurity@gmail.com',
      name: name.trim(),
      email: (email || '').trim().toLowerCase(),
      mobile: (mobile || '').trim(),
      password: password || '123456',
      isExistingEmployee: Boolean(isExistingEmployee && linkedEmployeeId),
      employeeId: linkedEmployeeId,
      roleId: roleDoc?.roleId || roleId,
      roleName: resolvedRoleName,
      status: status || 'Active',
      createdOn: today,
      assignedOn: today,
      assignedBy: req.user.name || 'Admin',
      initials,
      avatarTone: 'primary',
    });

    return res.status(201).json({
      success: true,
      message: `User account ${newUser.name} (${newUser.userId}) created successfully.`,
      user: newUser.toJSON(),
    });
  } catch (error) {
    console.error('Error creating user account:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to create user account in database.',
    });
  }
};

/**
 * @desc    Update user account details
 * @route   PUT /api/users/:id
 * @access  Private (Admin)
 */
export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const adminEmail = (req.user.adminEmail || req.user.email || '').toLowerCase();
    const companyId = req.headers['x-company-id'] || req.body.companyId;
    const companyIds = await getCompanyIdVariations(companyId, adminEmail);

    const idConditions = [{ userId: id }];
    if (mongoose.Types.ObjectId.isValid(id)) {
      idConditions.push({ _id: id });
    }

    const user = await UserRole.findOne({
      $or: idConditions,
      ...(companyIds.length > 0 ? { $or: [{ companyId: { $in: companyIds } }, { adminEmail }] } : {})
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User account not found in database.',
      });
    }

    const {
      name,
      email,
      mobile,
      password,
      roleId,
      roleName,
      status,
      isExistingEmployee,
      employeeId,
    } = req.body;

    if (name) user.name = name.trim();
    if (email !== undefined) user.email = email.trim().toLowerCase();
    if (mobile !== undefined) user.mobile = mobile.trim();
    if (password) user.password = password;
    if (roleId) user.roleId = roleId;
    if (roleName) user.roleName = roleName;
    if (status) user.status = status;

    if (isExistingEmployee !== undefined) {
      user.isExistingEmployee = Boolean(isExistingEmployee);
      user.employeeId = isExistingEmployee ? (employeeId || user.employeeId) : null;
    }

    if (name) {
      user.initials = name
        .trim()
        .split(' ')
        .filter(Boolean)
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }

    await user.save();

    return res.status(200).json({
      success: true,
      message: `User ${user.name} updated successfully.`,
      user: user.toJSON(),
    });
  } catch (error) {
    console.error('Error updating user:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update user account.',
    });
  }
};

/**
 * @desc    Change user assigned role
 * @route   PATCH /api/users/:id/role
 * @access  Private (Admin)
 */
export const changeUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const adminEmail = (req.user.adminEmail || req.user.email || '').toLowerCase();
    const companyId = req.headers['x-company-id'] || req.body.companyId;
    const companyIds = await getCompanyIdVariations(companyId, adminEmail);
    const { roleId, roleName } = req.body;

    if (!roleId) {
      return res.status(400).json({
        success: false,
        message: 'New role ID is required.',
      });
    }

    const idConditions = [{ userId: id }];
    if (mongoose.Types.ObjectId.isValid(id)) {
      idConditions.push({ _id: id });
    }

    const user = await UserRole.findOne({
      $or: idConditions,
      ...(companyIds.length > 0 ? { $or: [{ companyId: { $in: companyIds } }, { adminEmail }] } : {})
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User account not found.',
      });
    }

    // Resolve roleName
    let resolvedRoleName = roleName;
    if (!resolvedRoleName) {
      const rDoc = await Role.findOne({
        $or: [
          { roleId },
          ...(mongoose.Types.ObjectId.isValid(roleId) ? [{ _id: roleId }] : [])
        ]
      });
      if (rDoc) resolvedRoleName = rDoc.name;
    }

    user.roleId = roleId;
    user.roleName = resolvedRoleName || user.roleName;
    await user.save();

    return res.status(200).json({
      success: true,
      message: `Role for ${user.name} updated to ${user.roleName}.`,
      user: user.toJSON(),
    });
  } catch (error) {
    console.error('Error changing user role:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to change user role.',
    });
  }
};

/**
 * @desc    Toggle or update user status (Active / Inactive / Suspended)
 * @route   PATCH /api/users/:id/status
 * @access  Private (Admin)
 */
export const toggleUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const adminEmail = (req.user.adminEmail || req.user.email || '').toLowerCase();
    const companyId = req.headers['x-company-id'] || req.body.companyId;
    const companyIds = await getCompanyIdVariations(companyId, adminEmail);
    const { status } = req.body;

    const idConditions = [{ userId: id }];
    if (mongoose.Types.ObjectId.isValid(id)) {
      idConditions.push({ _id: id });
    }

    const user = await UserRole.findOne({
      $or: idConditions,
      ...(companyIds.length > 0 ? { $or: [{ companyId: { $in: companyIds } }, { adminEmail }] } : {})
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User account not found.',
      });
    }

    if (status) {
      user.status = status;
    } else {
      user.status = user.status === 'Active' ? 'Inactive' : 'Active';
    }

    await user.save();

    return res.status(200).json({
      success: true,
      message: `User ${user.name} is now ${user.status}.`,
      user: user.toJSON(),
    });
  } catch (error) {
    console.error('Error toggling user status:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update user status.',
    });
  }
};

/**
 * @desc    Delete user account
 * @route   DELETE /api/users/:id
 * @access  Private (Admin)
 */
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const adminEmail = (req.user.adminEmail || req.user.email || '').toLowerCase();
    const companyId = req.headers['x-company-id'] || req.query.companyId;
    const companyIds = await getCompanyIdVariations(companyId, adminEmail);

    const idConditions = [{ userId: id }];
    if (mongoose.Types.ObjectId.isValid(id)) {
      idConditions.push({ _id: id });
    }

    const user = await UserRole.findOneAndDelete({
      $or: idConditions,
      ...(companyIds.length > 0 ? { $or: [{ companyId: { $in: companyIds } }, { adminEmail }] } : {})
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User account not found.',
      });
    }

    return res.status(200).json({
      success: true,
      message: `User ${user.name} (${user.userId}) deleted successfully from database.`,
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete user account.',
    });
  }
};

