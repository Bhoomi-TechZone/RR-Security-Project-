import jwt from 'jsonwebtoken';
import User from '../models/userModel.js';
import Employee from '../models/employeeModel.js';
import UserRole from '../models/userRoleModel.js';
import Client from '../models/clientModel.js';

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

    // Flexible identifier matching (e.g. cli001, CLI-001, CLI001, rr001, RR-001)
    const alphanumericOnly = cleanIdentifier.replace(/[^a-zA-Z0-9]/g, '');
    const flexibleRegex = alphanumericOnly.length >= 2
      ? new RegExp(`^${alphanumericOnly.replace(/([a-zA-Z]+)(\d+)/, '$1[-_\\s]?$2')}$`, 'i')
      : new RegExp(`^${cleanIdentifier.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');

    // 1. Try finding user in User model (admin, corporate user, etc.)
    const user = await User.findOne({ email: lowerIdentifier }).select('+password');

    if (user) {
      if (user.status !== 'Active') {
        return res.status(403).json({
          success: false,
          message: 'Your account is currently inactive or suspended. Please contact the administrator.'
        });
      }

      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials. Please check your corporate email/ID and password.'
        });
      }

      const token = generateToken(user._id, user.role, !!rememberMe);
      const safeUser = user.toJSON();

      return res.status(200).json({
        success: true,
        message: 'Login successful.',
        token,
        user: safeUser,
        redirect: user.redirect || (user.role === 'admin' ? '/admin/dashboard' : `/${user.role}/dashboard`)
      });
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

      if (!employeeDoc.password) {
        return res.status(401).json({
          success: false,
          message: 'No login password has been set for your account. Please contact your administrator to set a password.'
        });
      }

      const isMatch = await employeeDoc.comparePassword(password);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials. Please check your Employee ID/email and password.'
        });
      }

      const token = generateToken(employeeDoc._id, 'employee', !!rememberMe);
      const safeEmployee = {
        id: employeeDoc.employeeId || employeeDoc._id.toString(),
        _id: employeeDoc._id.toString(),
        employeeId: employeeDoc.employeeId,
        employeeCode: employeeDoc.employeeCode || employeeDoc.employeeId,
        name: employeeDoc.name,
        email: employeeDoc.email || `${employeeDoc.employeeId.toLowerCase()}@rrsecurity.internal`,
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

    // 3. Try finding in Client model by clientId, email, or contactNumber
    let clientDoc = await Client.findOne({
      $or: [
        { clientId: { $regex: flexibleRegex } },
        { email: lowerIdentifier },
        { contactNumber: cleanIdentifier }
      ]
    }).select('+password');

    if (clientDoc) {
      if (clientDoc.enablePortalAccess === false || clientDoc.enablePortalAccess === 'false') {
        return res.status(403).json({
          success: false,
          message: 'Client portal login access is disabled for your account. Please contact your administrator.'
        });
      }

      if (clientDoc.status !== 'active') {
        return res.status(403).json({
          success: false,
          message: 'Your client account is currently inactive. Please contact the administrator.'
        });
      }

      if (!clientDoc.password && !clientDoc.savedPassword) {
        return res.status(401).json({
          success: false,
          message: 'No login password has been set for this client account. Please contact your administrator.'
        });
      }

      const isMatch = await clientDoc.comparePassword(password);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials. Please check your Client ID and password.'
        });
      }

      const token = generateToken(clientDoc._id, 'client', !!rememberMe);
      const safeClient = {
        id: clientDoc.clientId || clientDoc._id.toString(),
        _id: clientDoc._id.toString(),
        clientId: clientDoc.clientId,
        name: clientDoc.name,
        contactPerson: clientDoc.contactPerson || clientDoc.name,
        email: clientDoc.email || `${clientDoc.clientId.toLowerCase()}@client.portal`,
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

    // 4. Try finding in UserRole model (for role-based users)
    const userRoleDoc = await UserRole.findOne({
      $or: [
        { email: lowerIdentifier },
        { userId: { $regex: new RegExp(`^${cleanIdentifier.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } },
        { employeeId: { $regex: new RegExp(`^${cleanIdentifier.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } }
      ]
    }).select('+password');

    if (userRoleDoc) {
      if (userRoleDoc.status !== 'Active') {
        return res.status(403).json({
          success: false,
          message: 'Your account is inactive. Please contact the administrator.'
        });
      }

      const isMatch = await userRoleDoc.comparePassword(password);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials. Please check your user ID/email and password.'
        });
      }

      const token = generateToken(userRoleDoc._id, 'user', !!rememberMe);
      const safeRoleUser = {
        ...userRoleDoc.toJSON(),
        role: 'user',
        redirect: '/user/dashboard'
      };

      return res.status(200).json({
        success: true,
        message: 'Login successful.',
        token,
        user: safeRoleUser,
        redirect: '/user/dashboard'
      });
    }

    return res.status(401).json({
      success: false,
      message: 'Invalid credentials. Please check your Client ID / Employee ID / email and password.'
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
    const user = await User.findById(req.user.id);
    if (user) {
      return res.status(200).json({
        success: true,
        user: user.toJSON()
      });
    }

    const emp = await Employee.findById(req.user.id);
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

    const client = await Client.findById(req.user.id);
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

    const uRole = await UserRole.findById(req.user.id);
    if (uRole) {
      return res.status(200).json({
        success: true,
        user: {
          ...uRole.toJSON(),
          role: 'user',
          redirect: '/user/dashboard'
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
