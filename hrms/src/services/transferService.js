import authService from './authService';

const API_BASE_URL = import.meta.env.VITE_API_URL;

export const transferService = {
  /**
   * Fetch all employee transfer history records for a company from MongoDB
   */
  async getTransfers(companyId) {
    try {
      const token = authService.getToken();
      const response = await fetch(`${API_BASE_URL}/transfers?companyId=${encodeURIComponent(companyId || '')}`, {
        method: 'GET',
        cache: 'no-cache',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token || ''}`,
          'x-company-id': companyId || '',
        },
      });

      if (!response.ok) {
        let errMsg = 'Failed to fetch transfer history from database';
        try {
          const errData = await response.json();
          errMsg = errData.message || errMsg;
        } catch (_) {}
        throw new Error(errMsg);
      }

      const data = await response.json();
      return Array.isArray(data.transfers) ? data.transfers : [];
    } catch (error) {
      console.error('transferService.getTransfers error:', error);
      return [];
    }
  },

  /**
   * Execute an employee transfer, update employee deployment, and save transfer log to MongoDB
   */
  async createTransfer(payload, companyId) {
    const token = authService.getToken();
    const response = await fetch(`${API_BASE_URL}/transfers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token || ''}`,
        'x-company-id': companyId || '',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to record employee transfer in database');
    }

    return data;
  },

  /**
   * Delete a transfer history log from database
   */
  async deleteTransfer(transferId, companyId) {
    const token = authService.getToken();
    const response = await fetch(`${API_BASE_URL}/transfers/${transferId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token || ''}`,
        'x-company-id': companyId || '',
      },
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to delete transfer record from database');
    }

    return data;
  },
};

export default transferService;
