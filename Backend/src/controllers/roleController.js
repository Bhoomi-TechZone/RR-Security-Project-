import mongoose from 'mongoose';
import Role from '../models/roleModel.js';
import UserRole from '../models/userRoleModel.js';
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
 * @desc    Get all roles for the active company profile strictly from MongoDB
 * @route   GET /api/roles
 * @access  Private
 */
export const getRoles = async (req, res) => {
  try {
    const adminEmail = (req.user.adminEmail || req.user.email || '').toLowerCase();
    const companyId = req.headers['x-company-id'] || req.query.companyId;

    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: 'Company ID is required to fetch isolated roles.',
      });
    }

    const companyIds = await getCompanyIdVariations(companyId, adminEmail);

    // Clean up any legacy auto-seeded static system mock roles if requested/existing
    await Role.deleteMany({
      companyId: { $in: companyIds },
      roleId: { $in: ['role-admin', 'role-hr-manager', 'role-field-officer', 'role-auditor'] }
    });

    const roles = await Role.find({
      $or: [
        { companyId: { $in: companyIds } },
        ...(adminEmail ? [{ adminEmail }] : [])
      ]
    }).sort({ createdAt: 1 });

    // Update user counts dynamically for this specific company
    const userRoles = await UserRole.find({
      $or: [
        { companyId: { $in: companyIds } },
        ...(adminEmail ? [{ adminEmail }] : [])
      ]
    });

    const rolesWithCounts = roles.map((r) => {
      const count = userRoles.filter((u) => 
        u.roleId === r.roleId || 
        u.roleId === r.id || 
        u.roleId === r._id?.toString() || 
        (u.roleName && r.name && u.roleName.toLowerCase() === r.name.toLowerCase())
      ).length;
      const json = r.toJSON();
      json.usersCount = count;
      return json;
    });

    return res.status(200).json({
      success: true,
      count: rolesWithCounts.length,
      roles: rolesWithCounts,
    });
  } catch (error) {
    console.error('Error getting roles:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve roles.',
    });
  }
};

/**
 * Helper to compute the next sequential unique Role ID for a given company
 */
export const calculateNextRoleId = async (companyId, adminEmail) => {
  const companyIds = await getCompanyIdVariations(companyId, adminEmail);
  const roles = await Role.find(
    {
      $or: [
        { companyId: { $in: companyIds } },
        ...(adminEmail ? [{ adminEmail }] : [])
      ]
    },
    { roleId: 1 }
  ).lean();

  let maxNum = 0;
  for (const r of roles) {
    if (r.roleId) {
      const match = String(r.roleId).match(/(?:role|rol)[-_]?(\d+)/i);
      if (match) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num) && num > maxNum) {
          maxNum = num;
        }
      }
    }
  }

  let nextNum = maxNum + 1;
  let candidateId = `ROLE-${String(nextNum).padStart(3, '0')}`;

  // Double check uniqueness within this company and increment if needed
  while (await Role.exists({ roleId: candidateId, $or: [{ companyId: { $in: companyIds } }, ...(adminEmail ? [{ adminEmail }] : [])] })) {
    nextNum += 1;
    candidateId = `ROLE-${String(nextNum).padStart(3, '0')}`;
  }

  return candidateId;
};

/**
 * @desc    Get next sequential unique role ID for company
 * @route   GET /api/roles/next-id
 * @access  Private
 */
export const getNextRoleId = async (req, res) => {
  try {
    const adminEmail = (req.user.adminEmail || req.user.email || '').toLowerCase();
    const companyId = req.headers['x-company-id'] || req.query.companyId;

    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: 'Company ID is required.',
      });
    }

    const nextRoleId = await calculateNextRoleId(companyId, adminEmail);

    return res.status(200).json({
      success: true,
      nextRoleId,
    });
  } catch (error) {
    console.error('Error computing next role ID:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate next role ID.',
    });
  }
};

/**
 * @desc    Create a new custom role associated with active company
 * @route   POST /api/roles
 * @access  Private (Admin)
 */
export const createRole = async (req, res) => {
  try {
    const adminEmail = (req.user.adminEmail || req.user.email || '').toLowerCase();
    const companyId = req.headers['x-company-id'] || req.body.companyId;

    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: 'Company ID is required to create a role.',
      });
    }

    const companyIds = await getCompanyIdVariations(companyId, adminEmail);
    const { name, description, status, permissions, roleId: customRoleId } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Role name is required.',
      });
    }

    // Check for duplicate name within this isolated company
    const existingName = await Role.findOne({
      name: { $regex: new RegExp(`^${name.trim()}$`, 'i') },
      $or: [
        { companyId: { $in: companyIds } },
        ...(adminEmail ? [{ adminEmail }] : [])
      ]
    });

    if (existingName) {
      return res.status(400).json({
        success: false,
        message: `A role named "${name.trim()}" already exists for this company.`,
      });
    }

    // Determine unique roleId for this company
    let assignedRoleId = customRoleId ? customRoleId.trim() : null;

    if (assignedRoleId) {
      const existingId = await Role.findOne({
        roleId: assignedRoleId,
        $or: [
          { companyId: { $in: companyIds } },
          ...(adminEmail ? [{ adminEmail }] : [])
        ]
      });

      if (existingId) {
        return res.status(400).json({
          success: false,
          message: `Role ID "${assignedRoleId}" already exists for this company.`,
        });
      }
    } else {
      assignedRoleId = await calculateNextRoleId(companyId, adminEmail);
    }

    const newRole = await Role.create({
      roleId: assignedRoleId,
      companyId,
      adminEmail: adminEmail || 'rrsecurity@gmail.com',
      name: name.trim(),
      type: 'custom',
      description: description || 'Configured system access control role.',
      status: status || 'Active',
      permissions: permissions || {},
      usersCount: 0,
      createdOn: new Date().toISOString().split('T')[0],
    });

    return res.status(201).json({
      success: true,
      message: `Role "${newRole.name}" created successfully.`,
      role: newRole.toJSON(),
    });
  } catch (error) {
    console.error('Error creating role:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to create role.',
    });
  }
};

/**
 * @desc    Update role info or permissions
 * @route   PUT /api/roles/:id
 * @access  Private (Admin)
 */
export const updateRole = async (req, res) => {
  try {
    const { id } = req.params;
    const adminEmail = (req.user.adminEmail || req.user.email || '').toLowerCase();
    const companyId = req.headers['x-company-id'] || req.body.companyId;
    const companyIds = await getCompanyIdVariations(companyId, adminEmail);

    const idConditions = [{ roleId: id }];
    if (mongoose.Types.ObjectId.isValid(id)) {
      idConditions.push({ _id: id });
    }

    const role = await Role.findOne({
      $or: idConditions,
      ...(companyIds.length > 0 ? { $or: [{ companyId: { $in: companyIds } }, { adminEmail }] } : {})
    });

    if (!role) {
      return res.status(404).json({
        success: false,
        message: 'Role not found.',
      });
    }

    const fields = ['name', 'description', 'status', 'permissions'];
    fields.forEach((f) => {
      if (req.body[f] !== undefined) {
        role[f] = req.body[f];
      }
    });

    await role.save();

    // Also update roleName in linked UserRoles if name changed
    if (req.body.name && req.body.name !== role.name) {
      await UserRole.updateMany(
        {
          roleId: role.roleId,
          $or: [{ companyId: { $in: companyIds } }, { adminEmail }]
        },
        { roleName: req.body.name }
      );
    }

    return res.status(200).json({
      success: true,
      message: `Role "${role.name}" updated successfully.`,
      role: role.toJSON(),
    });
  } catch (error) {
    console.error('Error updating role:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update role.',
    });
  }
};

/**
 * @desc    Update role permissions matrix
 * @route   PUT /api/roles/:id/permissions
 * @access  Private (Admin)
 */
export const updateRolePermissions = async (req, res) => {
  try {
    const { id } = req.params;
    const adminEmail = (req.user.adminEmail || req.user.email || '').toLowerCase();
    const companyId = req.headers['x-company-id'] || req.body.companyId;
    const companyIds = await getCompanyIdVariations(companyId, adminEmail);
    const { permissions } = req.body;

    const idConditions = [{ roleId: id }];
    if (mongoose.Types.ObjectId.isValid(id)) {
      idConditions.push({ _id: id });
    }

    const role = await Role.findOne({
      $or: idConditions,
      ...(companyIds.length > 0 ? { $or: [{ companyId: { $in: companyIds } }, { adminEmail }] } : {})
    });

    if (!role) {
      return res.status(404).json({
        success: false,
        message: 'Role not found.',
      });
    }

    role.permissions = permissions || {};
    await role.save();

    return res.status(200).json({
      success: true,
      message: `Permissions for role "${role.name}" updated successfully.`,
      role: role.toJSON(),
    });
  } catch (error) {
    console.error('Error updating role permissions:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update role permissions.',
    });
  }
};

/**
 * @desc    Delete a custom role
 * @route   DELETE /api/roles/:id
 * @access  Private (Admin)
 */
export const deleteRole = async (req, res) => {
  try {
    const { id } = req.params;
    const adminEmail = (req.user.adminEmail || req.user.email || '').toLowerCase();
    const companyId = req.headers['x-company-id'] || req.query.companyId;
    const companyIds = await getCompanyIdVariations(companyId, adminEmail);

    const idConditions = [{ roleId: id }];
    if (mongoose.Types.ObjectId.isValid(id)) {
      idConditions.push({ _id: id });
    }

    const role = await Role.findOne({
      $or: idConditions,
      ...(companyIds.length > 0 ? { $or: [{ companyId: { $in: companyIds } }, { adminEmail }] } : {})
    });

    if (!role) {
      return res.status(404).json({
        success: false,
        message: 'Role not found.',
      });
    }

    await Role.deleteOne({ _id: role._id });

    // Also remove user assignments associated with this role within this company
    await UserRole.deleteMany({
      roleId: role.roleId || role.id,
      $or: [{ companyId: { $in: companyIds } }, { adminEmail }]
    });

    return res.status(200).json({
      success: true,
      message: `Role "${role.name}" deleted successfully.`,
    });
  } catch (error) {
    console.error('Error deleting role:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete role.',
    });
  }
};

/**
 * @desc    Get all user role assignments for the company
 * @route   GET /api/roles/users/assignments
 * @access  Private
 */
export const getAssignedUsers = async (req, res) => {
  try {
    const adminEmail = (req.user.adminEmail || req.user.email || '').toLowerCase();
    const companyId = req.headers['x-company-id'] || req.query.companyId;

    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: 'Company ID is required.',
      });
    }

    const companyIds = await getCompanyIdVariations(companyId, adminEmail);

    const assignments = await UserRole.find({
      $or: [
        { companyId: { $in: companyIds } },
        ...(adminEmail ? [{ adminEmail }] : [])
      ]
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: assignments.length,
      users: assignments.map((a) => a.toJSON()),
    });
  } catch (error) {
    console.error('Error getting assigned users:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve user assignments.',
    });
  }
};

/**
 * @desc    Assign or update user role
 * @route   POST /api/roles/users/assignments
 * @access  Private (Admin)
 */
export const assignUserToRole = async (req, res) => {
  try {
    const adminEmail = (req.user.adminEmail || req.user.email || '').toLowerCase();
    const companyId = req.headers['x-company-id'] || req.body.companyId;

    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: 'Company ID is required.',
      });
    }

    const companyIds = await getCompanyIdVariations(companyId, adminEmail);
    const { name, email, employeeId, roleId, roleName, department, status } = req.body;

    if (!name || !email || !roleId) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and role are required.',
      });
    }

    // Check if user is already assigned for this company
    let assignment = await UserRole.findOne({
      email: email.toLowerCase().trim(),
      $or: [
        { companyId: { $in: companyIds } },
        ...(adminEmail ? [{ adminEmail }] : [])
      ]
    });

    if (assignment) {
      assignment.roleId = roleId;
      assignment.roleName = roleName || assignment.roleName;
      assignment.name = name;
      assignment.department = department || assignment.department;
      assignment.status = status || assignment.status;
      await assignment.save();
    } else {
      assignment = await UserRole.create({
        userId: `USR-${Date.now().toString().slice(-6)}`,
        companyId,
        adminEmail: adminEmail || 'rrsecurity@gmail.com',
        name: name.trim(),
        email: email.toLowerCase().trim(),
        employeeId: employeeId || '',
        roleId,
        roleName: roleName || '',
        department: department || 'General',
        status: status || 'Active',
        assignedOn: new Date().toISOString().split('T')[0],
        assignedBy: req.user.name || 'Admin',
      });
    }

    return res.status(200).json({
      success: true,
      message: `User ${assignment.name} assigned to role successfully.`,
      user: assignment.toJSON(),
    });
  } catch (error) {
    console.error('Error assigning user to role:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to assign user to role.',
    });
  }
};

/**
 * @desc    Remove user from role
 * @route   DELETE /api/roles/users/assignments/:userId
 * @access  Private (Admin)
 */
export const removeUserFromRole = async (req, res) => {
  try {
    const { userId } = req.params;
    const adminEmail = (req.user.adminEmail || req.user.email || '').toLowerCase();
    const companyId = req.headers['x-company-id'] || req.query.companyId;
    const companyIds = await getCompanyIdVariations(companyId, adminEmail);

    const idConditions = [{ userId }];
    if (mongoose.Types.ObjectId.isValid(userId)) {
      idConditions.push({ _id: userId });
    }

    const assignment = await UserRole.findOneAndDelete({
      $or: idConditions,
      ...(companyIds.length > 0 ? { $or: [{ companyId: { $in: companyIds } }, { adminEmail }] } : {})
    });

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'User assignment not found.',
      });
    }

    return res.status(200).json({
      success: true,
      message: `User ${assignment.name} removed from role.`,
    });
  } catch (error) {
    console.error('Error removing user from role:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to remove user from role.',
    });
  }
};

