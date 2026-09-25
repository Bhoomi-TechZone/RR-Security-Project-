import mongoose from 'mongoose';
import Role from '../models/roleModel.js';
import UserRole from '../models/userRoleModel.js';

// Default standard module permissions for new company onboarding
const DEFAULT_SYSTEM_ROLES = [
  {
    roleId: 'role-admin',
    name: 'Admin',
    type: 'system',
    description: 'Full administrative access across all system modules and configurations',
    status: 'Active',
    permissions: {
      employees: ['view', 'add', 'edit', 'delete', 'export'],
      attendance: ['view', 'add', 'edit', 'delete', 'approve'],
      leave: ['view', 'add', 'edit', 'delete', 'approve'],
      overtime: ['view', 'add', 'edit', 'delete', 'approve'],
      shifts: ['view', 'add', 'edit', 'delete'],
      inventory: ['view', 'add', 'edit', 'delete', 'issue', 'return'],
      advances_loans: ['view', 'add', 'edit', 'delete', 'approve'],
      payroll: ['view', 'generate', 'process', 'download'],
      reports: ['view', 'generate', 'export', 'print'],
      notifications: ['view', 'post', 'edit', 'delete'],
      companies: ['view', 'add', 'edit', 'delete'],
      masters: ['view', 'add', 'edit', 'delete'],
    },
  },
  {
    roleId: 'role-hr-manager',
    name: 'HR Manager',
    type: 'system',
    description: 'Employee lifecycle, onboarding, muster roll, leave approvals and payroll access',
    status: 'Active',
    permissions: {
      employees: ['view', 'add', 'edit', 'export'],
      attendance: ['view', 'add', 'edit', 'approve'],
      leave: ['view', 'add', 'edit', 'approve'],
      overtime: ['view', 'add', 'edit', 'approve'],
      shifts: ['view', 'add', 'edit'],
      inventory: ['view', 'issue', 'return'],
      advances_loans: ['view', 'add', 'approve'],
      payroll: ['view', 'generate', 'download'],
      reports: ['view', 'generate', 'export'],
      notifications: ['view', 'post'],
      companies: ['view'],
      masters: ['view'],
    },
  },
  {
    roleId: 'role-field-officer',
    name: 'Field Officer',
    type: 'system',
    description: 'Site-level operations, shift scheduling, daily biometric checks and inventory dispatch',
    status: 'Active',
    permissions: {
      employees: ['view'],
      attendance: ['view', 'add', 'edit'],
      leave: ['view', 'add'],
      overtime: ['view', 'add'],
      shifts: ['view', 'add', 'edit'],
      inventory: ['view', 'issue', 'return'],
      advances_loans: ['view', 'add'],
      payroll: [],
      reports: ['view'],
      notifications: ['view'],
      companies: ['view'],
      masters: ['view'],
    },
  },
  {
    roleId: 'role-auditor',
    name: 'Auditor',
    type: 'system',
    description: 'Read-only compliance reporting, statutory deductions, registers and muster verification',
    status: 'Active',
    permissions: {
      employees: ['view', 'export'],
      attendance: ['view'],
      leave: ['view'],
      overtime: ['view'],
      shifts: ['view'],
      inventory: ['view'],
      advances_loans: ['view'],
      payroll: ['view', 'download'],
      reports: ['view', 'generate', 'export', 'print'],
      notifications: ['view'],
      companies: ['view'],
      masters: ['view'],
    },
  },
];

/**
 * @desc    Get all roles for the active company profile (auto-seeds defaults if empty)
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

    let roles = await Role.find({ companyId, adminEmail }).sort({ createdAt: 1 });

    // If company has no roles yet, seed the default system roles
    if (roles.length === 0) {
      const seeded = DEFAULT_SYSTEM_ROLES.map((r) => ({
        ...r,
        companyId,
        adminEmail,
        createdOn: new Date().toISOString().split('T')[0],
      }));
      roles = await Role.insertMany(seeded);
    }

    // Update user counts dynamically
    const userRoles = await UserRole.find({ companyId, adminEmail });
    const rolesWithCounts = roles.map((r) => {
      const count = userRoles.filter((u) => u.roleId === (r.roleId || r.id)).length;
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

    const { name, description, status, permissions } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Role name is required.',
      });
    }

    // Check for duplicate name within this company
    const existing = await Role.findOne({
      companyId,
      adminEmail,
      name: { $regex: new RegExp(`^${name.trim()}$`, 'i') },
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: `A role named "${name.trim()}" already exists for this company.`,
      });
    }

    const newRole = await Role.create({
      roleId: `role-${Date.now().toString().slice(-6)}`,
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

    if (role.type === 'system') {
      return res.status(400).json({
        success: false,
        message: 'System roles cannot be deleted.',
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
