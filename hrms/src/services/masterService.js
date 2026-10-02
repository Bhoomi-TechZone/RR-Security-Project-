import authService from './authService';

const API_BASE_URL = import.meta.env.VITE_API_URL;

export const masterService = {
  /**
   * Fetch all master records for a given category type and company
   */
  async getMasters(type, companyId) {
    try {
      const token = authService.getToken();
      const url = new URL(`${API_BASE_URL}/masters`);
      if (type) url.searchParams.append('type', type);
      if (companyId) url.searchParams.append('companyId', companyId);

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-company-id': companyId || ''
        }
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch master records');
      }

      return data.data || [];
    } catch (error) {
      console.error(`masterService.getMasters (${type}) error:`, error);
      throw error;
    }
  },

  /**
   * Create a new master record for active company
   */
  async createMaster(companyId, masterData) {
    try {
      const token = authService.getToken();
      const response = await fetch(`${API_BASE_URL}/masters`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-company-id': companyId || ''
        },
        body: JSON.stringify({ ...masterData, companyId })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to create master record');
      }

      return data.data;
    } catch (error) {
      console.error('masterService.createMaster error:', error);
      throw error;
    }
  },

  /**
   * Update an existing master record
   */
  async updateMaster(companyId, id, masterData) {
    try {
      const token = authService.getToken();
      const response = await fetch(`${API_BASE_URL}/masters/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-company-id': companyId || ''
        },
        body: JSON.stringify({ ...masterData, companyId })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to update master record');
      }

      return data.data;
    } catch (error) {
      console.error('masterService.updateMaster error:', error);
      throw error;
    }
  },

  /**
   * Toggle status of a master record
   */
  async toggleMasterStatus(companyId, id, status) {
    try {
      const token = authService.getToken();
      const response = await fetch(`${API_BASE_URL}/masters/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-company-id': companyId || ''
        },
        body: JSON.stringify({ status, companyId })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to update master status');
      }

      return data.data;
    } catch (error) {
      console.error('masterService.toggleMasterStatus error:', error);
      throw error;
    }
  },

  /**
   * Delete a master record
   */
  async deleteMaster(companyId, id) {
    try {
      const token = authService.getToken();
      const response = await fetch(`${API_BASE_URL}/masters/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-company-id': companyId || ''
        }
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete master record');
      }

      return true;
    } catch (error) {
      console.error('masterService.deleteMaster error:', error);
      throw error;
    }
  }
};

export default masterService;
