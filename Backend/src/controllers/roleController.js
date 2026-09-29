import mongoose from 'mongoose';
import Role from '../models/roleModel.js';
import UserRole from '../models/userRoleModel.js';

/**
 * @desc    Get all roles for the active company profile strictly from MongoDB
 * @route   GET /api/roles
 * @access  Private
 */
export const getRoles = async (req, res) => {
  try {
    const adminEmail = req.user.email.toLowerCase();
    const companyId = req.headers['x-company-id'] || req.query.companyId;

    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: 'Company ID is required to fetch isolated roles.',
      });
    }

    // Clean up any legacy auto-seeded static system mock roles if requested/existing
    await Role.deleteMany({
      companyId,
      adminEmail,
      roleId: { $in: ['role-admin', 'role-hr-manager', 'role-field-officer', 'role-auditor'] }
    });

    const roles = await Role.find({ companyId, adminEmail }).sort({ createdAt: 1 });

    // Update user counts dynamically
    const userRoles = await UserRole.find({ companyId, adminEmail });
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
  const roles = await Role.find(
    { companyId, adminEmail },
    { roleId: 1 }
  ).lean();

  let maxNum = 0;
  for (const r of roles) {
    if (r.roleId) {
      const match = r.roleId.match(/(?:role|rol)[-_]?(\d+)/i);
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
  while (await Role.exists({ companyId, adminEmail, roleId: candidateId })) {
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
    const adminEmail = req.user.email.toLowerCase();
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
    const adminEmail = req.user.email.toLowerCase();
    const companyId = req.headers['x-company-id'] || req.body.companyId;

    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: 'Company ID is required to create a role.',
      });
    }

    const { name, description, status, permissions, roleId: customRoleId } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Role name is required.',
      });
    }

    // Check for duplicate name within this company
    const existingName = await Role.findOne({
      companyId,
      adminEmail,
      name: { $regex: new RegExp(`^${name.trim()}$`, 'i') },
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
        companyId,
        adminEmail,
        roleId: assignedRoleId,
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
      adminEmail,
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
    const adminEmail = req.user.email.toLowerCase();
    const companyId = req.headers['x-company-id'] || req.body.companyId;

    const orConditions = [{ roleId: id }];
    if (mongoose.Types.ObjectId.isValid(id)) {
      orConditions.push({ _id: id });
    }

    const query = {
      $or: orConditions,
      adminEmail,
    };
    if (companyId) query.companyId = companyId;

    const role = await Role.findOne(query);

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
    const adminEmail = req.user.email.toLowerCase();
    const companyId = req.headers['x-company-id'] || req.body.companyId;
    const { permissions } = req.body;

    const orConditions = [{ roleId: id }];
    if (mongoose.Types.ObjectId.isValid(id)) {
      orConditions.push({ _id: id });
    }

    const query = {
      $or: orConditions,
      adminEmail,
    };
    if (companyId) query.companyId = companyId;

    const role = await Role.findOne(query);

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
    const adminEmail = req.user.email.toLowerCase();
    const companyId = req.headers['x-company-id'] || req.query.companyId;

    const orConditions = [{ roleId: id }];
    if (mongoose.Types.ObjectId.isValid(id)) {
      orConditions.push({ _id: id });
    }

    const query = {
      $or: orConditions,
      adminEmail,
    };
    if (companyId) query.companyId = companyId;

    const role = await Role.findOne(query);

    if (!role) {
      return res.status(404).json({
        success: false,
        message: 'Role not found.',
      });
    }

    await Role.deleteOne({ _id: role._id });

    // Also remove user assignments associated with this role
    await UserRole.deleteMany({
      roleId: role.roleId || role.id,
      companyId,
      adminEmail,
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
    const adminEmail = req.user.email.toLowerCase();
    const companyId = req.headers['x-company-id'] || req.query.companyId;

    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: 'Company ID is required.',
      });
    }

    const assignments = await UserRole.find({ companyId, adminEmail }).sort({ createdAt: -1 });

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
    const adminEmail = req.user.email.toLowerCase();
    const companyId = req.headers['x-company-id'] || req.body.companyId;

    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: 'Company ID is required.',
      });
    }

    const { name, email, employeeId, roleId, roleName, department, status } = req.body;

    if (!name || !email || !roleId) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and role are required.',
      });
    }

    // Check if user is already assigned for this company
    let assignment = await UserRole.findOne({
      companyId,
      adminEmail,
      email: email.toLowerCase().trim(),
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
        adminEmail,
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
    const adminEmail = req.user.email.toLowerCase();
    const companyId = req.headers['x-company-id'] || req.query.companyId;

    const orConditions = [{ userId }];
    if (mongoose.Types.ObjectId.isValid(userId)) {
      orConditions.push({ _id: userId });
    }

    const assignment = await UserRole.findOneAndDelete({
      $or: orConditions,
      adminEmail,
      ...(companyId ? { companyId } : {}),
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
