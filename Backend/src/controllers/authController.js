import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/userModel.js';
import Company from '../models/companyModel.js';
import Employee from '../models/employeeModel.js';
import UserRole from '../models/userRoleModel.js';
import Client from '../models/clientModel.js';
import Role from '../models/roleModel.js';
import PasswordResetToken from '../models/passwordResetTokenModel.js';
import { sendPasswordResetEmail } from '../services/emailService.js';


/**
 * Generate JWT token
 */
const generateToken = (id, role, rememberMe = false) => {
  const secret = process.env.JWT_SECRET || 'novaspark_hrms_super_secure_jwt_secret_key_2026';
  const expiresIn = rememberMe ? '30d' : (process.env.JWT_EXPIRES_IN || '7d');
  return jwt.sign({ id, role }, secret, { expiresIn });
};

/**
 * @desc    Authenticate user & get token (Supports Corporate Email, Employee ID, Client ID, User ID)
 * @route   POST /api/auth/login
 * @access  Public
 */
export const login = async (req, res) => {
  try {
    const { email, password, rememberMe } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both corporate email/client ID and password.'
      });
    }

    const cleanIdentifier = String(email).trim();
    const lowerIdentifier = cleanIdentifier.toLowerCase();

    // Flexible identifier matching (e.g. cli001, CLI-001, CLI001, rr001, RR-001, emp001, EMP-001)
    const alphanumericOnly = cleanIdentifier.replace(/[^a-zA-Z0-9]/g, '');
    const flexibleRegex = alphanumericOnly.length >= 2
      ? new RegExp(`^${alphanumericOnly.replace(/([a-zA-Z]+)(\d+)/, '$1[-_\\s]?$2')}$`, 'i')
      : new RegExp(`^${cleanIdentifier.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');

    const isAdminIdentifier = 
      lowerIdentifier === 'rrsecurity@gmail.com' ||
      lowerIdentifier === 'admin' ||
      lowerIdentifier === 'admin@rrsecurity.com' ||
      lowerIdentifier === 'admin@gmail.com' ||
      lowerIdentifier === 'rrsecurity';

    // 1. Try finding user in User model (admin, corporate user, etc.)
    const user = await User.findOne({
      $or: [
        { email: lowerIdentifier },
        ...(isAdminIdentifier ? [{ email: 'rrsecurity@gmail.com' }, { role: 'admin' }] : [])
      ]
    }).select('+password');

    if (user) {
      if (user.status !== 'Active') {
        return res.status(403).json({
          success: false,
          message: 'Your account is currently inactive or suspended. Please contact the administrator.'
        });
      }

      // Block login if associated company workspace is deactivated
      const isMasterAdmin = 
        user.email.toLowerCase() === 'rrsecurity@gmail.com' ||
        user.email.toLowerCase() === 'admin@rrsecurity.com';

      if (!isMasterAdmin) {
        let userCompany = null;
        if (user.companyId && user.companyId !== 'RRS8392014SEC') {
          userCompany = await Company.findOne({ companyId: user.companyId });
        } else if (!user.companyId) {
          userCompany = await Company.findOne({
            $or: [
              { adminEmail: user.email.toLowerCase() },
              { email: user.email.toLowerCase() }
            ]
          });
        }

        if (userCompany && userCompany.status === 'Inactive') {
          return res.status(403).json({
            success: false,
            message: `Company workspace "${userCompany.name}" is currently deactivated. Access has been suspended. Please contact RR Security Master Administration.`
          });
        }
      }

      const isMatch = await user.comparePassword(password);

      if (isMatch) {
        const token = generateToken(user._id, user.role || 'admin', !!rememberMe);
        
        let roleDoc = null;
        let permissions = { '*': ['*'] };
        let roleName = 'Administrator';

        if (user.role === 'user') {
          if (user.roleId || user.roleName) {
            roleDoc = await Role.findOne({
              $or: [
                { roleId: user.roleId },
                ...(mongoose.Types.ObjectId.isValid(user.roleId) ? [{ _id: user.roleId }] : []),
                { name: user.roleName }
              ]
            });
          }
          permissions = roleDoc?.permissions || user.permissions || {};
          roleName = roleDoc?.name || user.roleName || 'Custom Role';
        }

        const safeUser = {
          ...user.toJSON(),
          role: user.role || 'admin',
          companyId: isMasterAdmin ? 'RRS8392014SEC' : (user.companyId || ''),
          companyName: isMasterAdmin ? 'RR Security & Facilities' : (user.companyName || ''),
          roleName,
          permissions,
          redirect: user.role === 'admin' ? '/admin/dashboard' : '/user/dashboard'
        };

        return res.status(200).json({
          success: true,
          message: `Welcome back, ${user.name || 'Admin'}!`,
          token,
          user: safeUser,
          redirect: user.role === 'admin' ? '/admin/dashboard' : '/user/dashboard'
        });
      }
    }

    // 2. Try finding employee in Employee model by employeeId, employeeCode, email or contact
    const employeeDoc = await Employee.findOne({
      $or: [
        { employeeId: { $regex: flexibleRegex } },
        { employeeCode: { $regex: flexibleRegex } },
        { email: lowerIdentifier },
        { contact: cleanIdentifier },
        { mobile: cleanIdentifier }
      ]
    }).select('+password');

    if (employeeDoc) {
      // Block login if employee's company workspace is deactivated
      if (employeeDoc.companyId && employeeDoc.companyId !== 'RRS8392014SEC') {
        const empCompany = await Company.findOne({ companyId: employeeDoc.companyId });
        if (empCompany && empCompany.status === 'Inactive') {
          return res.status(403).json({
            success: false,
            message: `Company workspace "${empCompany.name}" is currently deactivated. Employee portal login is suspended. Please contact your company administrator.`
          });
        }
      }

      const empStatus = employeeDoc.employeeStatus || employeeDoc.status || 'Active';

      if (employeeDoc.enablePortalAccess === false || employeeDoc.enablePortalAccess === 'false') {
        return res.status(403).json({
          success: false,
          message: 'Employee portal login access is disabled for your account. Please contact your administrator.'
        });
      }

      if (String(empStatus).toLowerCase() === 'inactive' || String(empStatus).toLowerCase() === 'resigned' || String(empStatus).toLowerCase() === 'suspended') {
        return res.status(403).json({
          success: false,
          message: 'Your employee account is currently inactive. Please contact the HR administrator.'
        });
      }

      const isMatch = await employeeDoc.comparePassword(password);

      if (isMatch) {
        const token = generateToken(employeeDoc._id, 'employee', !!rememberMe);
        const safeEmployee = {
          id: employeeDoc.employeeId || employeeDoc._id.toString(),
          _id: employeeDoc._id.toString(),
          employeeId: employeeDoc.employeeId,
          employeeCode: employeeDoc.employeeCode || employeeDoc.employeeId,
          name: employeeDoc.name,
          email: employeeDoc.email || `${(employeeDoc.employeeId || 'emp').toLowerCase()}@rrsecurity.internal`,
          role: 'employee',
          companyId: employeeDoc.companyId,
          companyName: employeeDoc.companyName || employeeDoc.clientName || 'RR Security & Facilities',
          clientName: employeeDoc.clientName || employeeDoc.companyName || '',
          department: employeeDoc.department || 'Operations',
          designation: employeeDoc.designation || 'Staff',
          avatar: employeeDoc.employeePhoto || employeeDoc.photo || '',
          status: empStatus,
          redirect: '/employee/dashboard'
        };

        return res.status(200).json({
          success: true,
          message: `Welcome back, ${employeeDoc.name}!`,
          token,
          user: safeEmployee,
          redirect: '/employee/dashboard'
        });
      }
    }

    // 3. Try finding in Client model by clientId, email, contactNumber, or phone
    let clientDoc = await Client.findOne({
      $or: [
        { clientId: { $regex: flexibleRegex } },
        { email: lowerIdentifier },
        { contactNumber: cleanIdentifier },
        { phone: cleanIdentifier }
      ]
    }).select('+password');

    if (clientDoc) {
      // Block login if client's company workspace is deactivated
      if (clientDoc.companyId && clientDoc.companyId !== 'RRS8392014SEC') {
        const clientComp = await Company.findOne({ companyId: clientDoc.companyId });
        if (clientComp && clientComp.status === 'Inactive') {
          return res.status(403).json({
            success: false,
            message: `Company workspace "${clientComp.name}" is currently deactivated. Client portal access is suspended. Please contact RR Security Master Administration.`
          });
        }
      }

      if (clientDoc.enablePortalAccess === false || clientDoc.enablePortalAccess === 'false') {
        return res.status(403).json({
          success: false,
          message: 'Client portal login access is disabled for your account. Please contact your administrator.'
        });
      }

      if (clientDoc.status !== 'active' && clientDoc.status !== 'Active') {
        return res.status(403).json({
          success: false,
          message: 'Your client account is currently inactive. Please contact the administrator.'
        });
      }

      const isMatch = await clientDoc.comparePassword(password);

      if (isMatch) {
        const token = generateToken(clientDoc._id, 'client', !!rememberMe);
        const safeClient = {
          id: clientDoc.clientId || clientDoc._id.toString(),
          _id: clientDoc._id.toString(),
          clientId: clientDoc.clientId,
          name: clientDoc.name,
          contactPerson: clientDoc.contactPerson || clientDoc.name,
          email: clientDoc.email || `${(clientDoc.clientId || 'client').toLowerCase()}@client.portal`,
          role: 'client',
          companyId: clientDoc.companyId,
          redirect: '/client/dashboard'
        };

        return res.status(200).json({
          success: true,
          message: `Welcome back, ${clientDoc.name}!`,
          token,
          user: safeClient,
          redirect: '/client/dashboard'
        });
      }
    }

    // 4. Try finding in UserRole model (for role-based users)
    const userRoleDoc = await UserRole.findOne({
      $or: [
        { email: lowerIdentifier },
        { userId: { $regex: new RegExp(`^${cleanIdentifier.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } },
        { employeeId: { $regex: new RegExp(`^${cleanIdentifier.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } }
      ]
    }).select('+password');

    if (userRoleDoc) {
      // Block login if user role's company workspace is deactivated
      if (userRoleDoc.companyId && userRoleDoc.companyId !== 'RRS8392014SEC') {
        const roleComp = await Company.findOne({ companyId: userRoleDoc.companyId });
        if (roleComp && roleComp.status === 'Inactive') {
          return res.status(403).json({
            success: false,
            message: `Company workspace "${roleComp.name}" is currently deactivated. Portal login is suspended. Please contact RR Security Master Administration.`
          });
        }
      }

      if (userRoleDoc.status !== 'Active') {
        return res.status(403).json({
          success: false,
          message: 'Your account is inactive. Please contact the administrator.'
        });
      }

      const isMatch = await userRoleDoc.comparePassword(password);

      if (isMatch) {
        const token = generateToken(userRoleDoc._id, 'user', !!rememberMe);
        
        let roleDoc = null;
        if (userRoleDoc.roleId || userRoleDoc.roleName) {
          roleDoc = await Role.findOne({
            companyId: userRoleDoc.companyId,
            $or: [
              { roleId: userRoleDoc.roleId },
              ...(mongoose.Types.ObjectId.isValid(userRoleDoc.roleId) ? [{ _id: userRoleDoc.roleId }] : []),
              { name: userRoleDoc.roleName }
            ]
          });

          if (!roleDoc) {
            roleDoc = await Role.findOne({
              $or: [
                { roleId: userRoleDoc.roleId },
                { name: userRoleDoc.roleName }
              ]
            });
          }
        }

        const permissions = roleDoc?.permissions || {};
        const safeRoleUser = {
          ...userRoleDoc.toJSON(),
          role: 'user',
          roleId: userRoleDoc.roleId,
          roleName: roleDoc?.name || userRoleDoc.roleName || 'Custom Role',
          permissions,
          redirect: '/user/dashboard'
        };

        return res.status(200).json({
          success: true,
          message: `Welcome back, ${userRoleDoc.name}!`,
          token,
          user: safeRoleUser,
          redirect: '/user/dashboard'
        });
      }
    }

    return res.status(401).json({
      success: false,
      message: 'Invalid credentials. Please check your Corporate Email / ID / Client ID / Employee ID and password.'
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      message: 'An unexpected server error occurred during login. Please try again later.'
    });
  }
};

/**
 * @desc    Get currently logged in user profile
 * @route   GET /api/auth/me
 * @access  Private
 */
export const getMe = async (req, res) => {
  try {
    const rawId = req.user._id || req.user.id;

    // 1. If role is explicitly known on req.user:
    if (req.user.role === 'user') {
      const uRole = (mongoose.Types.ObjectId.isValid(rawId) ? await UserRole.findById(rawId) : null) ||
                    await UserRole.findOne({ userId: req.user.userId || rawId });
      if (uRole) {
        let roleDoc = null;
        if (uRole.roleId || uRole.roleName) {
          roleDoc = await Role.findOne({
            companyId: uRole.companyId,
            $or: [
              { roleId: uRole.roleId },
              ...(mongoose.Types.ObjectId.isValid(uRole.roleId) ? [{ _id: uRole.roleId }] : []),
              { name: uRole.roleName }
            ]
          }) || await Role.findOne({
            $or: [
              { roleId: uRole.roleId },
              { name: uRole.roleName }
            ]
          });
        }

        return res.status(200).json({
          success: true,
          user: {
            ...uRole.toJSON(),
            role: 'user',
            roleId: uRole.roleId,
            roleName: roleDoc?.name || uRole.roleName || 'Custom Role',
            permissions: roleDoc?.permissions || {},
            redirect: '/user/dashboard'
          }
        });
      }
    }

    if (req.user.role === 'employee') {
      const emp = (mongoose.Types.ObjectId.isValid(rawId) ? await Employee.findById(rawId) : null) ||
                  await Employee.findOne({ employeeId: req.user.employeeId || rawId });
      if (emp) {
        return res.status(200).json({
          success: true,
          user: {
            id: emp.employeeId || emp._id.toString(),
            _id: emp._id.toString(),
            employeeId: emp.employeeId,
            employeeCode: emp.employeeCode || emp.employeeId,
            name: emp.name,
            email: emp.email || `${emp.employeeId.toLowerCase()}@rrsecurity.internal`,
            role: 'employee',
            companyId: emp.companyId,
            companyName: emp.companyName || emp.clientName || '',
            department: emp.department,
            designation: emp.designation,
            avatar: emp.employeePhoto || emp.photo || '',
            status: emp.employeeStatus || emp.status || 'Active',
            redirect: '/employee/dashboard'
          }
        });
      }
    }

    if (req.user.role === 'client') {
      const client = (mongoose.Types.ObjectId.isValid(rawId) ? await Client.findById(rawId) : null) ||
                     await Client.findOne({ clientId: req.user.clientId || rawId });
      if (client) {
        return res.status(200).json({
          success: true,
          user: {
            id: client.clientId || client._id.toString(),
            _id: client._id.toString(),
            clientId: client.clientId,
            name: client.name,
            contactPerson: client.contactPerson || client.name,
            email: client.email || `${client.clientId.toLowerCase()}@client.portal`,
            role: 'client',
            companyId: client.companyId,
            redirect: '/client/dashboard'
          }
        });
      }
    }

    // Default or admin lookup
    let user = null;
    if (mongoose.Types.ObjectId.isValid(rawId)) {
      user = await User.findById(rawId);
    }
    if (!user && req.user.email) {
      user = await User.findOne({ email: req.user.email.toLowerCase() });
    }

    if (user) {
      let permissions = { '*': ['*'] };
      let roleName = 'Administrator';

      if (user.role === 'user') {
        let roleDoc = null;
        if (user.roleId || user.roleName) {
          roleDoc = await Role.findOne({
            $or: [
              { roleId: user.roleId },
              ...(mongoose.Types.ObjectId.isValid(user.roleId) ? [{ _id: user.roleId }] : []),
              { name: user.roleName }
            ]
          });
        }
        permissions = roleDoc?.permissions || user.permissions || {};
        roleName = roleDoc?.name || user.roleName || 'Custom Role';
      }

      return res.status(200).json({
        success: true,
        user: {
          ...user.toJSON(),
          role: user.role || 'admin',
          roleName,
          permissions,
          redirect: user.role === 'admin' ? '/admin/dashboard' : '/user/dashboard'
        }
      });
    }

    return res.status(404).json({
      success: false,
      message: 'User profile not found.'
    });
  } catch (error) {
    console.error('Get profile error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve user profile.'
    });
  }
};

/**
 * @desc    Logout user / invalidate session
 * @route   POST /api/auth/logout
 * @access  Private
 */
export const logout = async (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'Logged out successfully.'
  });
};

/**
 * @desc    Initiate password reset (Supports Corporate Email, Employee ID, Client ID, User ID)
 * @route   POST /api/auth/forgot-password
 * @access  Public
 */
export const forgotPassword = async (req, res) => {
  try {
    const rawIdentifier = (req.body.identifier || req.body.email || '').trim();

    if (!rawIdentifier) {
      return res.status(400).json({
        success: false,
        message: 'Please provide your Corporate Email, Employee ID, Client ID, or User ID.'
      });
    }

    const cleanIdentifier = rawIdentifier.trim();
    const lowerIdentifier = cleanIdentifier.toLowerCase();
    const alphanumericOnly = cleanIdentifier.replace(/[^a-zA-Z0-9]/g, '');

    // Dynamic pattern matching for prefixed IDs (e.g., RR004, RR-004, CLI001, CLI-001, EMP001, EMP-001, USR001)
    let flexibleRegex;
    const matchAlphaNum = alphanumericOnly.match(/^([a-zA-Z]+)(0*)(\d+)$/);
    if (matchAlphaNum) {
      const prefix = matchAlphaNum[1];
      const digits = matchAlphaNum[3];
      // Match prefix + optional separator + optional leading zeros + digits (e.g. RR[-_\s]?0*4)
      flexibleRegex = new RegExp(`^${prefix}[-_\\s]?0*${digits}$`, 'i');
    } else if (alphanumericOnly.length >= 2) {
      flexibleRegex = new RegExp(`^${alphanumericOnly.replace(/([a-zA-Z]+)(\d+)/, '$1[-_\\s]?$2')}$`, 'i');
    } else {
      flexibleRegex = new RegExp(`^${cleanIdentifier.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
    }

    // Pre-computed literal variants for high-speed indexed lookup
    const literalVariants = Array.from(new Set([
      rawIdentifier,
      cleanIdentifier,
      lowerIdentifier,
      alphanumericOnly,
      alphanumericOnly.toUpperCase(),
      alphanumericOnly.toLowerCase(),
      matchAlphaNum ? `${matchAlphaNum[1].toUpperCase()}-${matchAlphaNum[2]}${matchAlphaNum[3]}` : null,
      matchAlphaNum ? `${matchAlphaNum[1].toUpperCase()}-${matchAlphaNum[3]}` : null,
      matchAlphaNum ? `${matchAlphaNum[1].toUpperCase()}-${String(matchAlphaNum[3]).padStart(3, '0')}` : null,
      matchAlphaNum ? `${matchAlphaNum[1].toUpperCase()}${matchAlphaNum[2]}${matchAlphaNum[3]}` : null,
      matchAlphaNum ? `${matchAlphaNum[1].toUpperCase()}${String(matchAlphaNum[3]).padStart(3, '0')}` : null,
    ])).filter(Boolean);

    let account = null;
    let userType = '';
    let userModelName = '';
    let registeredEmail = '';
    let accountName = '';
    let displayId = '';
    let companyId = '';

    // 1. Check User model (Admin or standard corporate user)
    const isAdminIdentifier = 
      lowerIdentifier === 'rrsecurity@gmail.com' ||
      lowerIdentifier === 'admin' ||
      lowerIdentifier === 'admin@rrsecurity.com' ||
      lowerIdentifier === 'admin@gmail.com' ||
      lowerIdentifier === 'rrsecurity';

    const orUserConditions = [
      { email: lowerIdentifier },
      ...(isAdminIdentifier ? [{ email: 'rrsecurity@gmail.com' }, { role: 'admin' }] : []),
      ...(mongoose.Types.ObjectId.isValid(rawIdentifier) ? [{ _id: rawIdentifier }] : [])
    ];
    const userDoc = await User.findOne({ $or: orUserConditions });
    if (userDoc) {
      account = userDoc;
      userType = userDoc.role === 'admin' ? 'admin' : (userDoc.role || 'user');
      userModelName = 'User';
      registeredEmail = (userDoc.email || '').trim();
      accountName = userDoc.name || 'Administrator';
      displayId = userDoc.email;
      companyId = userDoc.companyId || '';
    }

    // 2. Check Employee model (by employeeId, employeeCode, email, contact, mobile)
    if (!account) {
      const empDoc = await Employee.findOne({
        $or: [
          { employeeId: { $in: literalVariants } },
          { employeeCode: { $in: literalVariants } },
          { employeeId: { $regex: flexibleRegex } },
          { employeeCode: { $regex: flexibleRegex } },
          { email: lowerIdentifier },
          { contact: cleanIdentifier },
          { mobile: cleanIdentifier }
        ]
      });

      if (empDoc) {
        account = empDoc;
        userType = 'employee';
        userModelName = 'Employee';
        registeredEmail = (empDoc.email || empDoc.personalEmail || '').trim();
        if (!registeredEmail && empDoc.adminEmail) {
          registeredEmail = empDoc.adminEmail.trim();
        }
        accountName = empDoc.name || 'Employee';
        displayId = empDoc.employeeId || empDoc.employeeCode || empDoc.name;
        companyId = empDoc.companyId || '';
      }
    }

    // 3. Check Client model (by clientId, email, contactNumber, phone)
    if (!account) {
      const clientDoc = await Client.findOne({
        $or: [
          { clientId: { $in: literalVariants } },
          { clientId: { $regex: flexibleRegex } },
          { email: lowerIdentifier },
          { contactNumber: cleanIdentifier },
          { phone: cleanIdentifier }
        ]
      });

      if (clientDoc) {
        account = clientDoc;
        userType = 'client';
        userModelName = 'Client';
        registeredEmail = (clientDoc.email || '').trim();
        if (!registeredEmail && clientDoc.adminEmail) {
          registeredEmail = clientDoc.adminEmail.trim();
        }
        accountName = clientDoc.contactPerson || clientDoc.name || 'Client';
        displayId = clientDoc.clientId || clientDoc.name;
        companyId = clientDoc.companyId || '';
      }
    }

    // 4. Check UserRole model (Sub-admins & Role users by userId, email, mobile)
    if (!account) {
      const userRoleDoc = await UserRole.findOne({
        $or: [
          { userId: { $in: literalVariants } },
          { userId: { $regex: flexibleRegex } },
          { email: lowerIdentifier },
          { mobile: cleanIdentifier }
        ]
      });

      if (userRoleDoc) {
        account = userRoleDoc;
        userType = 'user';
        userModelName = 'UserRole';
        registeredEmail = (userRoleDoc.email || '').trim();
        if (!registeredEmail && userRoleDoc.adminEmail) {
          registeredEmail = userRoleDoc.adminEmail.trim();
        }
        accountName = userRoleDoc.name || 'User';
        displayId = userRoleDoc.userId || userRoleDoc.name;
        companyId = userRoleDoc.companyId || '';
      }
    }

    if (!account) {
      return res.status(404).json({
        success: false,
        message: `No active account found matching "${rawIdentifier}". Please verify your Email, Employee ID, Client ID, or User ID.`
      });
    }

    // Validate that the account has a registered email
    if (!registeredEmail || !registeredEmail.includes('@')) {
      return res.status(400).json({
        success: false,
        message: `The account for "${displayId}" does not have a registered email address on file. Please contact your system administrator to configure your email or reset your password directly.`
      });
    }

    // Generate secure random reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiresInMinutes = 60;
    const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000);

    // Invalidate any existing pending tokens for this account
    await PasswordResetToken.deleteMany({ userId: account._id });

    // Store new token in database
    await PasswordResetToken.create({
      token: resetToken,
      userType,
      userId: account._id,
      userModelName,
      email: registeredEmail.toLowerCase(),
      identifier: displayId,
      name: accountName,
      companyId: companyId || '',
      expiresAt
    });


    // Send professional HTML email
    const clientUrl = process.env.CLIENT_URL || req.headers.origin || 'http://localhost:5173';
    const emailResult = await sendPasswordResetEmail({
      to: registeredEmail,
      name: accountName,
      identifier: displayId,
      role: userType,
      token: resetToken,
      companyId,
      clientUrl
    });

    // Mask registered email for privacy display (e.g. r***r@gmail.com)
    const [localPart, domainPart] = registeredEmail.split('@');
    const maskedLocal = localPart.length > 2
      ? `${localPart[0]}${'*'.repeat(Math.min(localPart.length - 2, 5))}${localPart.slice(-1)}`
      : `${localPart[0]}*`;
    const maskedEmail = `${maskedLocal}@${domainPart}`;

    return res.status(200).json({
      success: true,
      message: `Password reset instructions have been sent to your registered email (${maskedEmail}).`,
      maskedEmail,
      userType,
      identifier: displayId,
      devResetUrl: emailResult.devFallback ? emailResult.resetUrl : undefined
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to process password reset request. Please try again later.'
    });
  }
};

/**
 * @desc    Verify if a password reset token is active & valid
 * @route   GET /api/auth/reset-password/verify
 * @access  Public
 */
export const verifyResetToken = async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Password reset token is required.'
      });
    }

    const resetDoc = await PasswordResetToken.findOne({
      token: String(token).trim(),
      used: false,
      expiresAt: { $gt: new Date() }
    });

    if (!resetDoc) {
      return res.status(400).json({
        success: false,
        message: 'This password reset link is invalid or has expired. Please request a new reset link.'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Token is valid.',
      email: resetDoc.email,
      name: resetDoc.name,
      identifier: resetDoc.identifier,
      userType: resetDoc.userType
    });
  } catch (error) {
    console.error('Verify reset token error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to verify password reset token.'
    });
  }
};

/**
 * @desc    Reset password using valid token
 * @route   POST /api/auth/reset-password
 * @access  Public
 */
export const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Reset token is required.'
      });
    }

    if (!newPassword || typeof newPassword !== 'string' || newPassword.trim().length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long.'
      });
    }

    const cleanToken = String(token).trim();
    const cleanPassword = newPassword.trim();

    const resetDoc = await PasswordResetToken.findOne({
      token: cleanToken,
      used: false,
      expiresAt: { $gt: new Date() }
    });

    if (!resetDoc) {
      return res.status(400).json({
        success: false,
        message: 'Password reset link is invalid or has expired. Please request a new one.'
      });
    }

    // Update password in the corresponding model
    if (resetDoc.userModelName === 'User') {
      const user = await User.findById(resetDoc.userId).select('+password');
      if (!user) {
        return res.status(404).json({ success: false, message: 'User account not found.' });
      }
      user.password = cleanPassword;
      user.markModified('password');
      await user.save({ validateBeforeSave: false });
    } else if (resetDoc.userModelName === 'Employee') {
      const emp = await Employee.findById(resetDoc.userId).select('+password');
      if (!emp) {
        return res.status(404).json({ success: false, message: 'Employee account not found.' });
      }
      emp.password = cleanPassword;
      emp.savedPassword = cleanPassword;
      emp.markModified('password');
      emp.markModified('savedPassword');
      await emp.save({ validateBeforeSave: false });
    } else if (resetDoc.userModelName === 'Client') {
      const client = await Client.findById(resetDoc.userId).select('+password');
      if (!client) {
        return res.status(404).json({ success: false, message: 'Client account not found.' });
      }
      client.password = cleanPassword;
      client.savedPassword = cleanPassword;
      client.markModified('password');
      client.markModified('savedPassword');
      await client.save({ validateBeforeSave: false });
    } else if (resetDoc.userModelName === 'UserRole') {
      const uRole = await UserRole.findById(resetDoc.userId).select('+password');
      if (!uRole) {
        return res.status(404).json({ success: false, message: 'Role user account not found.' });
      }
      uRole.password = cleanPassword;
      uRole.markModified('password');
      await uRole.save({ validateBeforeSave: false });
    }

    // Invalidate token
    resetDoc.used = true;
    await resetDoc.save();
    await PasswordResetToken.deleteMany({ userId: resetDoc.userId });

    return res.status(200).json({
      success: true,
      message: `Password has been reset successfully for ${resetDoc.name || resetDoc.email}! You can now sign in with your new password.`
    });
  } catch (error) {
    console.error('Reset password error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to reset password. Please try again later.'
    });
  }
};

