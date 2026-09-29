import { authService } from './authService';

const API_BASE_URL = import.meta.env.VITE_API_URL;

export const preferenceService = {
  /**
   * Get all preferences for company from database
   */
  async getPreferences(companyId) {
    try {
      const token = authService.getToken();
      const response = await fetch(`${API_BASE_URL}/preferences?companyId=${companyId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token || ''}`,
          'x-company-id': companyId,
        },
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch preferences');
      }

      return data.preferences;
    } catch (error) {
      console.error('preferenceService.getPreferences error:', error);
      throw error;
    }
  },

  /**
   * Get employee portal access configuration dynamically for employee panel
   */
  async getEmployeePortalAccess(companyId) {
    try {
      const token = authService.getToken();
      const headers = {
        'Content-Type': 'application/json',
      };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      if (companyId) headers['x-company-id'] = companyId;

      const url = companyId 
        ? `${API_BASE_URL}/preferences/portal-access?companyId=${companyId}`
        : `${API_BASE_URL}/preferences/portal-access`;

      const response = await fetch(url, {
        method: 'GET',
        headers,
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch employee portal access');
      }

      return data.employeePortal;
    } catch (error) {
      console.warn('preferenceService.getEmployeePortalAccess error:', error);
      return {
        enabled: true,
        allowDashboard: true,
        allowAttendance: true,
        allowLeaves: true,
        allowSalarySlips: true,
        allowProfile: true,
        allowNotifications: true,
      };
    }
  },

  /**
   * Update Employee Portal access preferences in MongoDB
   */
  async updateEmployeePortalPreferences(companyId, portalData) {
    try {
      const token = authService.getToken();
      const response = await fetch(`${API_BASE_URL}/preferences/employee-portal`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token || ''}`,
          'x-company-id': companyId,
        },
        body: JSON.stringify({ ...portalData, companyId }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to save employee portal preferences');
      }

      return data.employeePortal;
    } catch (error) {
      console.error('preferenceService.updateEmployeePortalPreferences error:', error);
      throw error;
    }
  },

  /**
   * Update full preferences object in MongoDB
   */
  async updatePreferences(companyId, prefData) {
    try {
      const token = authService.getToken();
      const response = await fetch(`${API_BASE_URL}/preferences`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token || ''}`,
          'x-company-id': companyId,
        },
        body: JSON.stringify({ ...prefData, companyId }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to save preferences');
      }

      return data.preferences;
    } catch (error) {
      console.error('preferenceService.updatePreferences error:', error);
      throw error;
    }
  }
};

export default preferenceService;
