import mongoose from 'mongoose';
import fs from 'fs';
import UserRole from '../models/userRoleModel.js';
import Employee from '../models/employeeModel.js';
import Role from '../models/roleModel.js';
import Company from '../models/companyModel.js';

/**
 * Helper to get all company identifier variations (companyId + _id + name)
 * Strictly matches the targeted company without cross-company leakage
 */
const getCompanyIdVariations = async (companyId, adminEmail) => {
  let companyIds = [companyId].filter(Boolean);
  if (!companyId && !adminEmail) return companyIds;

  try {
    const orConditions = [];
    if (companyId) {
      orConditions.push({ companyId });
      orConditions.push({ name: companyId });
      if (mongoose.Types.ObjectId.isValid(companyId)) {
        orConditions.push({ _id: companyId });
      }
    }
    if (adminEmail) {
      orConditions.push({ adminEmail });
    }

    const comps = await Company.find({ $or: orConditions })
      .select('companyId name _id')
      .lean();

    const ids = new Set([companyId].filter(Boolean));
    comps.forEach((c) => {
      if (c.companyId) ids.add(c.companyId);
      if (c._id) ids.add(c._id.toString());
      if (c.name) ids.add(c.name);
    });

    companyIds = Array.from(ids);
  } catch (_) {}
  return companyIds;
};

/**
 * Helper to safely build query targeting a single user by ID or ObjectId
 * and strictly within the specified company
 */
const buildUserQuery = (id, companyIds) => {
  const idConditions = [{ userId: id }];
  if (mongoose.Types.ObjectId.isValid(id)) {
    idConditions.push({ _id: id });
  }

  const query = {
    $or: idConditions,
  };

  if (companyIds && companyIds.length > 0) {
    query.companyId = { $in: companyIds };
  }

  return query;
};

/**
 * Helper to compute the next sequential USR ID
 * Scans globally across all userroles to guarantee 100% uniqueness (no duplicate User ID)
 */
export const calculateNextUserId = async (companyId, adminEmail) => {
  const allUsers = await UserRole.find({}, { userId: 1 }).lean();

  const usedIds = new Set();
  let maxNum = 0;

  for (const u of allUsers) {
    if (u.userId) {
      const clean = String(u.userId).trim().toUpperCase();
      usedIds.add(clean);
      const match = clean.match(/USR[-_]?(\d+)/i);
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

  while (usedIds.has(candidateId.toUpperCase()) || (await UserRole.exists({ userId: candidateId }))) {
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

    // Fetch users belonging to this company or created by this admin
    const users = await UserRole.find({
      $or: [
        { companyId: { $in: companyIds } },
        ...(adminEmail ? [{ adminEmail }] : []),
      ],
    })
      .sort({ createdAt: 1 })
      .lean();

    // Auto-heal duplicate or missing userIds on the fly
    const allUsers = await UserRole.find({}, { userId: 1, _id: 1 }).lean();
    let maxNum = 0;
    const globalUsedIds = new Set();

    for (const u of allUsers) {
      if (u.userId) {
        const clean = String(u.userId).trim().toUpperCase();
        globalUsedIds.add(clean);
        const match = clean.match(/USR[-_]?(\d+)/i);
        if (match) {
          const num = parseInt(match[1], 10);
          if (!isNaN(num) && num > maxNum) maxNum = num;
        }
      }
    }

    const seenInCompany = new Set();
    const sanitizedUsers = [];

    for (const u of users) {
      let uid = u.userId ? String(u.userId).trim().toUpperCase() : '';
      const isDuplicate = !uid || seenInCompany.has(uid);

      if (isDuplicate) {
        maxNum += 1;
        let newUid = `USR${String(maxNum).padStart(3, '0')}`;
        while (globalUsedIds.has(newUid) || (await UserRole.exists({ userId: newUid }))) {
          maxNum += 1;
          newUid = `USR${String(maxNum).padStart(3, '0')}`;
        }
        globalUsedIds.add(newUid);
        await UserRole.updateOne({ _id: u._id }, { userId: newUid });
        u.userId = newUid;
        uid = newUid;
      }

      seenInCompany.add(uid);
      sanitizedUsers.push({
        ...u,
        id: u._id.toString(),
      });
    }

    // Return sorted newest first
    sanitizedUsers.sort((a, b) => new Date(b.createdAt || b.createdOn || 0) - new Date(a.createdAt || a.createdOn || 0));

    return res.status(200).json({
      success: true,
      count: sanitizedUsers.length,
      users: sanitizedUsers,
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

    const query = buildUserQuery(id, companyIds);
    const user = await UserRole.findOne(query);

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

    // Resolve official company name and companyId to guarantee proper association
    let resolvedCompanyId = companyId;
    let resolvedCompanyName = req.body.companyName || '';

    try {
      const compDoc = await Company.findOne({
        $or: [
          { companyId },
          ...(mongoose.Types.ObjectId.isValid(companyId) ? [{ _id: companyId }] : []),
        ],
      })
        .select('companyId name')
        .lean();

      if (compDoc) {
        resolvedCompanyId = compDoc.companyId || companyId;
        resolvedCompanyName = compDoc.name || resolvedCompanyName;
      }
    } catch (_) {}

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
        ...(customRoleName ? [{ name: customRoleName }] : []),
      ],
      companyId: { $in: companyIds },
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
        companyId: { $in: companyIds },
      });

      if (empDoc) {
        linkedEmployeeId = empDoc.employeeId || empDoc._id.toString();
      } else {
        linkedEmployeeId = employeeId;
      }
    }

    // Calculate guaranteed unique User ID
    const generatedUserId = await calculateNextUserId(resolvedCompanyId, adminEmail);

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
      companyId: resolvedCompanyId,
      companyName: resolvedCompanyName,
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
      message: `User account ${newUser.name} (${newUser.userId}) created successfully for ${resolvedCompanyName || resolvedCompanyId}.`,
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

    const query = buildUserQuery(id, companyIds);
    const user = await UserRole.findOne(query);

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

    const query = buildUserQuery(id, companyIds);
    const user = await UserRole.findOne(query);

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
          ...(mongoose.Types.ObjectId.isValid(roleId) ? [{ _id: roleId }] : []),
        ],
        companyId: { $in: companyIds },
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

    const query = buildUserQuery(id, companyIds);
    const user = await UserRole.findOne(query);

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

    const query = buildUserQuery(id, companyIds);
    const user = await UserRole.findOneAndDelete(query);

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
