import authService from './authService';

const API_BASE_URL = import.meta.env.VITE_API_URL;

const getHeaders = () => {
  const token = authService.getToken();
  const user = authService.getCurrentUser();
  const clientId = user?.clientId || user?.id || '';

  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token || ''}`,
    'x-client-id': clientId,
    'x-company-id': user?.companyId || ''
  };
};

export const clientPortalService = {
  /**
   * Fetch authenticated client profile
   */
  async getProfile() {
    try {
      const response = await fetch(`${API_BASE_URL}/client-portal/profile`, {
        method: 'GET',
        headers: getHeaders()
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch client profile');
      }

      return data.profile;
    } catch (error) {
      console.error('clientPortalService.getProfile error:', error);
      throw error;
    }
  },

  /**
   * Update client authorized contact details
   */
  async updateProfile(profileData) {
    try {
      const response = await fetch(`${API_BASE_URL}/client-portal/profile`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(profileData)
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to update profile');
      }

      return data.profile;
    } catch (error) {
      console.error('clientPortalService.updateProfile error:', error);
      throw error;
    }
  },

  /**
   * Get dynamic client dashboard metrics, trends, assigned staff preview & invoices
   */
  async getDashboard() {
    try {
      const response = await fetch(`${API_BASE_URL}/client-portal/dashboard`, {
        method: 'GET',
        headers: getHeaders()
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch dashboard data');
      }

      return data;
    } catch (error) {
      console.error('clientPortalService.getDashboard error:', error);
      throw error;
    }
  },

  /**
   * Fetch employees assigned exclusively to this client
   */
  async getAssignedEmployees(params = {}) {
    try {
      const queryParams = new URLSearchParams();
      if (params.search) queryParams.append('search', params.search);
      if (params.department && params.department !== 'all') queryParams.append('department', params.department);
      if (params.site && params.site !== 'all') queryParams.append('site', params.site);
      if (params.status && params.status !== 'all') queryParams.append('status', params.status);
      if (params.shift && params.shift !== 'all') queryParams.append('shift', params.shift);

      const qs = queryParams.toString();
      const url = `${API_BASE_URL}/client-portal/employees${qs ? `?${qs}` : ''}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: getHeaders()
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch assigned employees');
      }

      return data;
    } catch (error) {
      console.error('clientPortalService.getAssignedEmployees error:', error);
      throw error;
    }
  },

  /**
   * Fetch attendance logs for assigned employees
   */
  async getAttendance(params = {}) {
    try {
      const queryParams = new URLSearchParams();
      if (params.date) queryParams.append('date', params.date);
      if (params.search) queryParams.append('search', params.search);
      if (params.department && params.department !== 'all') queryParams.append('department', params.department);
      if (params.site && params.site !== 'all') queryParams.append('site', params.site);
      if (params.status && params.status !== 'all') queryParams.append('status', params.status);

      const qs = queryParams.toString();
      const url = `${API_BASE_URL}/client-portal/attendance${qs ? `?${qs}` : ''}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: getHeaders()
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch attendance');
      }

      return data;
    } catch (error) {
      console.error('clientPortalService.getAttendance error:', error);
      throw error;
    }
  },

  /**
   * Fetch dynamic billing statement and invoices for this client
   */
  async getBilling() {
    try {
      const response = await fetch(`${API_BASE_URL}/client-portal/billing`, {
        method: 'GET',
        headers: getHeaders()
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch billing details');
      }

      return data;
    } catch (error) {
      console.error('clientPortalService.getBilling error:', error);
      throw error;
    }
  },

  /**
   * Fetch notifications tailored to this client
   */
  async getNotifications() {
    try {
      const response = await fetch(`${API_BASE_URL}/client-portal/notifications`, {
        method: 'GET',
        headers: getHeaders()
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch notifications');
      }

      return data.notifications || [];
    } catch (error) {
      console.error('clientPortalService.getNotifications error:', error);
      return [];
    }
  }
};

export default clientPortalService;
