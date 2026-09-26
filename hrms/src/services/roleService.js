import authService from './authService';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://backendhrmspayroll.bhoomitechzone.shop/api';

export const roleService = {
  /**
   * Fetch all roles for the active company profile
   */
  async getRoles(companyId) {
    try {
      const token = authService.getToken();
      const response = await fetch(`${API_BASE_URL}/roles?companyId=${companyId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-company-id': companyId,
        },
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch roles');
      }

      return data.roles || [];
    } catch (error) {
      console.error('roleService.getRoles error:', error);
      throw error;
    }
  },

  /**
   * Create a new custom role
   */
  async createRole(companyId, roleData) {
    try {
      const token = authService.getToken();
      const response = await fetch(`${API_BASE_URL}/roles`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-company-id': companyId,
        },
        body: JSON.stringify({ ...roleData, companyId }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to create role');
      }

      return data.role;
    } catch (error) {
      console.error('roleService.createRole error:', error);
      throw error;
    }
  },

  /**
   * Update role metadata
   */
  async updateRole(companyId, id, roleData) {
    try {
      const token = authService.getToken();
      const response = await fetch(`${API_BASE_URL}/roles/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-company-id': companyId,
        },
        body: JSON.stringify({ ...roleData, companyId }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to update role');
      }

      return data.role;
    } catch (error) {
      console.error('roleService.updateRole error:', error);
      throw error;
    }
  },

  /**
   * Update role permissions matrix
   */
  async updateRolePermissions(companyId, id, permissions) {
    try {
      const token = authService.getToken();
      const response = await fetch(`${API_BASE_URL}/roles/${id}/permissions`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-company-id': companyId,
        },
        body: JSON.stringify({ permissions, companyId }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to update role permissions');
      }

      return data.role;
    } catch (error) {
      console.error('roleService.updateRolePermissions error:', error);
      throw error;
    }
  },

  /**
   * Delete a custom role
   */
  async deleteRole(companyId, id) {
    try {
      const token = authService.getToken();
      const response = await fetch(`${API_BASE_URL}/roles/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-company-id': companyId,
        },
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete role');
      }

      return data;
    } catch (error) {
      console.error('roleService.deleteRole error:', error);
      throw error;
    }
  },

  /**
   * Get all user assignments for the active company
   */
  async getAssignedUsers(companyId) {
    try {
      const token = authService.getToken();
      const response = await fetch(`${API_BASE_URL}/roles/users/assignments?companyId=${companyId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-company-id': companyId,
        },
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch user assignments');
      }

      return data.users || [];
    } catch (error) {
      console.error('roleService.getAssignedUsers error:', error);
      throw error;
    }
  },

  /**
   * Assign or reassign user to role
   */
  async assignUser(companyId, userData) {
    try {
      const token = authService.getToken();
      const response = await fetch(`${API_BASE_URL}/roles/users/assignments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-company-id': companyId,
        },
        body: JSON.stringify({ ...userData, companyId }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to assign user');
      }

      return data.user;
    } catch (error) {
      console.error('roleService.assignUser error:', error);
      throw error;
    }
  },

  /**
   * Remove user from role
   */
  async removeUser(companyId, userId) {
    try {
      const token = authService.getToken();
      const response = await fetch(`${API_BASE_URL}/roles/users/assignments/${userId}?companyId=${companyId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-company-id': companyId,
        },
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to remove user assignment');
      }

      return data;
    } catch (error) {
      console.error('roleService.removeUser error:', error);
      throw error;
    }
  },
};

export default roleService;
