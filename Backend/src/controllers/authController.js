import jwt from 'jsonwebtoken';
import User from '../models/userModel.js';

/**
 * Generate JWT token
 */
const generateToken = (id, role, rememberMe = false) => {
  const secret = process.env.JWT_SECRET || 'novaspark_hrms_super_secure_jwt_secret_key_2026';
  const expiresIn = rememberMe ? '30d' : (process.env.JWT_EXPIRES_IN || '7d');
  return jwt.sign({ id, role }, secret, { expiresIn });
};

/**
 * @desc    Authenticate user & get token
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
        message: 'Please provide both corporate email and password.'
      });
    }

    // Find user by email and include password for verification
    const user = await User.findOne({ email: email.trim().toLowerCase() }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. Please check your corporate email and password.'
      });
    }

    if (user.status !== 'Active') {
      return res.status(403).json({
        success: false,
        message: 'Your account is currently inactive or suspended. Please contact the administrator.'
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. Please check your corporate email and password.'
      });
    }

    // Generate JWT
    const token = generateToken(user._id, user.role, !!rememberMe);
    const safeUser = user.toJSON();

    return res.status(200).json({
      success: true,
      message: 'Login successful.',
      token,
      user: safeUser,
      redirect: user.redirect || (user.role === 'admin' ? '/admin/dashboard' : `/${user.role}/dashboard`)
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
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User profile not found.'
      });
    }

    return res.status(200).json({
      success: true,
      user: user.toJSON()
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
