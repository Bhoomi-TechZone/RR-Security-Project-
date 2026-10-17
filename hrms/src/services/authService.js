const API_BASE_URL = import.meta.env.VITE_API_URL

export const authService = {
  /**
   * Login user via backend API
   * @param {Object} credentials - { email, password, rememberMe }
   * @returns {Promise<Object>} - { success, user, token, redirect, message }
   */
  async login({ email, password, rememberMe = false }) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, rememberMe }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed. Please verify your credentials.');
      }

      // Store session
      if (data.token) {
        localStorage.setItem('novaspark_auth_token', data.token);
        localStorage.setItem('novaspark_active_user', JSON.stringify(data.user));
        if (!rememberMe) {
          sessionStorage.setItem('novaspark_auth_token', data.token);
        }
        window.dispatchEvent(new CustomEvent('auth-changed', { detail: data.user }));
      }

      return data;
    } catch (error) {
      // Return structured error
      throw error;
    }
  },

  /**
   * Fetch current authenticated profile
   */
  async getProfile() {
    const token = this.getToken();
    if (!token) return null;

    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      this.logout();
      return null;
    }

    const data = await response.json();
    return data.user;
  },

  /**
   * Get stored JWT token
   */
  getToken() {
    return (
      localStorage.getItem('novaspark_auth_token') ||
      sessionStorage.getItem('novaspark_auth_token') ||
      null
    );
  },

  /**
   * Get currently saved user
   */
  getCurrentUser() {
    const userStr = localStorage.getItem('novaspark_active_user');
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  },

  /**
   * Alias for getCurrentUser
   */
  getUser() {
    return this.getCurrentUser();
  },

  /**
   * Clear auth session
   */
  logout() {
    localStorage.removeItem('novaspark_auth_token');
    sessionStorage.removeItem('novaspark_auth_token');
    localStorage.removeItem('novaspark_active_user');
    window.dispatchEvent(new CustomEvent('auth-changed', { detail: null }));
  },

  /**
   * Request password reset link (Supports Corporate Email, Employee ID, Client ID, User ID)
   * @param {string} identifier
   * @returns {Promise<Object>}
   */
  async forgotPassword(identifier) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ identifier }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to process password reset request.');
      }

      return data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Verify password reset token
   * @param {string} token
   * @returns {Promise<Object>}
   */
  async verifyResetToken(token) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/reset-password/verify?token=${encodeURIComponent(token)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Invalid or expired password reset link.');
      }

      return data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Reset password with token
   * @param {Object} payload - { token, newPassword }
   * @returns {Promise<Object>}
   */
  async resetPassword({ token, newPassword }) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, newPassword }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to reset password.');
      }

      return data;
    } catch (error) {
      throw error;
    }
  }
};


export default authService;
