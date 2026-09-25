import authService from './authService';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const workLocationService = {
  /**
   * Fetch all work locations for the active company profile
   */
  async getWorkLocations(companyId) {
    try {
      const token = authService.getToken();
      const response = await fetch(`${API_BASE_URL}/work-locations?companyId=${companyId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-company-id': companyId,
        },
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch work locations');
      }

      return data.locations || [];
    } catch (error) {
      console.error('workLocationService.getWorkLocations error:', error);
      throw error;
    }
  },

  /**
   * Create a new work location associated with companyId
   */
  async createWorkLocation(companyId, locationData) {
    try {
      const token = authService.getToken();
      const response = await fetch(`${API_BASE_URL}/work-locations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-company-id': companyId,
        },
        body: JSON.stringify({ ...locationData, companyId }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to create work location');
      }

      return data.location;
    } catch (error) {
      console.error('workLocationService.createWorkLocation error:', error);
      throw error;
    }
  },

  /**
   * Update an existing work location
   */
  async updateWorkLocation(companyId, id, locationData) {
    try {
      const token = authService.getToken();
      const response = await fetch(`${API_BASE_URL}/work-locations/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-company-id': companyId,
        },
        body: JSON.stringify({ ...locationData, companyId }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to update work location');
      }

      return data.location;
    } catch (error) {
      console.error('workLocationService.updateWorkLocation error:', error);
      throw error;
    }
  },

  /**
   * Toggle active/inactive status
   */
  async toggleWorkLocationStatus(companyId, id, status) {
    try {
      const token = authService.getToken();
      const response = await fetch(`${API_BASE_URL}/work-locations/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-company-id': companyId,
        },
        body: JSON.stringify({ status, companyId }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to update location status');
      }

      return data.location;
    } catch (error) {
      console.error('workLocationService.toggleWorkLocationStatus error:', error);
      throw error;
    }
  },

  /**
   * Delete work location
   */
  async deleteWorkLocation(companyId, id) {
    try {
      const token = authService.getToken();
      const response = await fetch(`${API_BASE_URL}/work-locations/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-company-id': companyId,
        },
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete work location');
      }

      return data;
    } catch (error) {
      console.error('workLocationService.deleteWorkLocation error:', error);
      throw error;
    }
  },
};

export default workLocationService;
