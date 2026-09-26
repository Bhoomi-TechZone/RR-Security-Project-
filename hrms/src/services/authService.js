const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://backendhrmspayroll.bhoomitechzone.shop/api';

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
        if (rememberMe) {
          localStorage.setItem('novaspark_auth_token', data.token);
          localStorage.setItem('novaspark_active_user', JSON.stringify(data.user));
        } else {
          sessionStorage.setItem('novaspark_auth_token', data.token);
          localStorage.setItem('novaspark_active_user', JSON.stringify(data.user));
        }
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
   * Clear auth session
   */
  logout() {
    localStorage.removeItem('novaspark_auth_token');
    sessionStorage.removeItem('novaspark_auth_token');
    localStorage.removeItem('novaspark_active_user');
  }
};

export default authService;
