import authService from './authService';

const API_BASE_URL = import.meta.env.VITE_API_URL;

export const dashboardService = {
  /**
   * Fetch dynamic admin dashboard metrics
   * @param {string} companyId - Active company identifier
   * @param {boolean} refresh - Force bypass in-memory backend cache
   */
  async getDashboardStats(companyId, refresh = false) {
    try {
      const token = authService.getToken();
      const url = new URL(`${API_BASE_URL}/dashboard/stats`);
      if (companyId) {
        url.searchParams.append('companyId', companyId);
      }
      if (refresh) {
        url.searchParams.append('refresh', 'true');
      }

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
        throw new Error(data.message || 'Failed to fetch dashboard metrics');
      }

      return data;
    } catch (error) {
      console.error('dashboardService.getDashboardStats error:', error);
      throw error;
    }
  }
};

export default dashboardService;
