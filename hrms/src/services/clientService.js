import authService from './authService';

const API_BASE_URL = import.meta.env.VITE_API_URL;

export const clientService = {
  /**
   * Fetch all clients for the active company profile
   */
  async getClients(companyId) {
    try {
      const token = authService.getToken();
      const response = await fetch(`${API_BASE_URL}/clients?companyId=${companyId || ''}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token || ''}`,
          'x-company-id': companyId || '',
        },
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch clients');
      }

      return data.clients || [];
    } catch (error) {
      console.error('clientService.getClients error:', error);
      throw error;
    }
  },

  /**
   * Create a new client associated with companyId
   */
  async createClient(companyId, clientData) {
    try {
      const token = authService.getToken();
      const response = await fetch(`${API_BASE_URL}/clients`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token || ''}`,
          'x-company-id': companyId || '',
        },
        body: JSON.stringify({ ...clientData, companyId }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to create client');
      }

      return data.client;
    } catch (error) {
      console.error('clientService.createClient error:', error);
      throw error;
    }
  },

  /**
   * Update an existing client
   */
  async updateClient(companyId, id, clientData) {
    try {
      const token = authService.getToken();
      const response = await fetch(`${API_BASE_URL}/clients/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token || ''}`,
          'x-company-id': companyId || '',
        },
        body: JSON.stringify({ ...clientData, companyId }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to update client');
      }

      return data.client;
    } catch (error) {
      console.error('clientService.updateClient error:', error);
      throw error;
    }
  },

  /**
   * Toggle client status
   */
  async toggleClientStatus(companyId, id, status) {
    try {
      const token = authService.getToken();
      const response = await fetch(`${API_BASE_URL}/clients/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token || ''}`,
          'x-company-id': companyId || '',
        },
        body: JSON.stringify({ status, companyId }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to update client status');
      }

      return data.client;
    } catch (error) {
      console.error('clientService.toggleClientStatus error:', error);
      throw error;
    }
  },

  /**
   * Delete client
   */
  async deleteClient(companyId, id) {
    try {
      const token = authService.getToken();
      const response = await fetch(`${API_BASE_URL}/clients/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token || ''}`,
          'x-company-id': companyId || '',
        },
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete client');
      }

      return data;
    } catch (error) {
      console.error('clientService.deleteClient error:', error);
      throw error;
    }
  },
};

export default clientService;
