import authService from './authService';

const API_BASE_URL = import.meta.env.VITE_API_URL;

export const announcementService = {
  /**
   * Fetch announcements for given company and optional target parameters
   */
  async getAnnouncements(companyId, params = {}) {
    try {
      const token = authService.getToken();
      const url = new URL(`${API_BASE_URL}/announcements`);
      if (companyId) url.searchParams.append('companyId', companyId);

      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== '') {
          url.searchParams.append(key, val);
        }
      });

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
          'x-company-id': companyId || ''
        }
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch announcements');
      }

      return data.data || [];
    } catch (error) {
      console.error('announcementService.getAnnouncements error:', error);
      return [];
    }
  },

  /**
   * Create / post new announcement
   */
  async createAnnouncement(companyId, payload) {
    try {
      const token = authService.getToken();
      const response = await fetch(`${API_BASE_URL}/announcements`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
          'x-company-id': companyId || ''
        },
        body: JSON.stringify({ ...payload, companyId })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to post announcement');
      }

      return data.data;
    } catch (error) {
      console.error('announcementService.createAnnouncement error:', error);
      throw error;
    }
  },

  /**
   * Update announcement
   */
  async updateAnnouncement(id, payload) {
    try {
      const token = authService.getToken();
      const response = await fetch(`${API_BASE_URL}/announcements/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to update announcement');
      }

      return data.data;
    } catch (error) {
      console.error('announcementService.updateAnnouncement error:', error);
      throw error;
    }
  },

  /**
   * Delete announcement
   */
  async deleteAnnouncement(id) {
    try {
      const token = authService.getToken();
      const response = await fetch(`${API_BASE_URL}/announcements/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        }
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete announcement');
      }

      return true;
    } catch (error) {
      console.error('announcementService.deleteAnnouncement error:', error);
      throw error;
    }
  }
};

export default announcementService;
