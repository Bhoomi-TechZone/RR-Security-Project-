import authService from './authService';

const API_BASE_URL = import.meta.env.VITE_API_URL;

export const userService = {
  /**
   * Fetch all user accounts for the active company profile
   */
  async getUsers(companyId) {
    try {
      const token = authService.getToken();
      const response = await fetch(`${API_BASE_URL}/users?companyId=${companyId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token || ''}`,
          'x-company-id': companyId,
        },
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch user accounts');
      }

      return data.users || [];
    } catch (error) {
      console.error('userService.getUsers error:', error);
      throw error;
    }
  },

  /**
   * Get next available User ID for the company
   */
  async getNextUserId(companyId) {
    try {
      const token = authService.getToken();
      const response = await fetch(`${API_BASE_URL}/users/next-id?companyId=${companyId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token || ''}`,
          'x-company-id': companyId,
        },
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to get next user ID');
      }

      return data.nextUserId || 'USR001';
    } catch (error) {
      console.error('userService.getNextUserId error:', error);
      return 'USR001';
    }
  },

  /**
   * Create a new login user account
   */
  async createUser(companyId, userData) {
    try {
      const token = authService.getToken();
      const response = await fetch(`${API_BASE_URL}/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token || ''}`,
          'x-company-id': companyId,
        },
        body: JSON.stringify({ ...userData, companyId }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to create user account');
      }

      return data.user;
    } catch (error) {
      console.error('userService.createUser error:', error);
      throw error;
    }
  },

  /**
   * Update user details
   */
  async updateUser(companyId, id, userData) {
    try {
      const token = authService.getToken();
      const response = await fetch(`${API_BASE_URL}/users/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token || ''}`,
          'x-company-id': companyId,
        },
        body: JSON.stringify({ ...userData, companyId }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to update user account');
      }

      return data.user;
    } catch (error) {
      console.error('userService.updateUser error:', error);
      throw error;
    }
  },

  /**
   * Change user assigned role
   */
  async changeUserRole(companyId, id, roleData) {
    try {
      const token = authService.getToken();
      const response = await fetch(`${API_BASE_URL}/users/${id}/role`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token || ''}`,
          'x-company-id': companyId,
        },
        body: JSON.stringify({ ...roleData, companyId }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to change user role');
      }

      return data.user;
    } catch (error) {
      console.error('userService.changeUserRole error:', error);
      throw error;
    }
  },

  /**
   * Toggle or update user account status
   */
  async toggleUserStatus(companyId, id, status) {
    try {
      const token = authService.getToken();
      const response = await fetch(`${API_BASE_URL}/users/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token || ''}`,
          'x-company-id': companyId,
        },
        body: JSON.stringify({ status, companyId }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to update user status');
      }

      return data.user;
    } catch (error) {
      console.error('userService.toggleUserStatus error:', error);
      throw error;
    }
  },

  /**
   * Delete user account
   */
  async deleteUser(companyId, id) {
    try {
      const token = authService.getToken();
      const response = await fetch(`${API_BASE_URL}/users/${id}?companyId=${companyId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token || ''}`,
          'x-company-id': companyId,
        },
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete user account');
      }

      return data;
    } catch (error) {
      console.error('userService.deleteUser error:', error);
      throw error;
    }
  },
};

export default userService;
